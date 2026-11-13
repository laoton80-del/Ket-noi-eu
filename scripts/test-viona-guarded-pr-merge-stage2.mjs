/**
 * Offline deterministic tests — Guarded PR Merge wrapper, Stage 2 ledger
 * integration (Lane B1 V2).
 *
 * Network: global fetch trap. Tokens unused. Real check runs: 0. Real
 * merges: 0. Real ledger writes: 0 (in-memory mock ledger with genuine
 * sha-conditional semantics). No workflow dispatch.
 *
 * Every "valid exact authority" case below still ends with mergeInvoked
 * verified against the mock's own call counters (never a real GitHub call —
 * the global fetch trap below guarantees this file never reaches real
 * network regardless of `--execute`).
 */

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
  GATE_CHECK_RUN_NAME,
  evaluateGuardedMerge,
  runGuardedPrMerge,
  parseGuardedMergeArgs,
} from './viona-guarded-pr-merge.mjs';
import {
  STAGE2_CHECK_RUN_NAME,
  AUTHORIZATION_STATES,
  CANONICAL_FREEZE_SCOPE,
  GLOBAL_MERGE_FREEZE_STATES,
  GLOBAL_MERGE_FREEZE_STATE,
  RELEASED_FREEZE_SCOPE,
  CANONICAL_REPOSITORY,
  LEDGER_REF,
  computeAuthorizationExpiry,
  computeReviewedScopeDigest,
  computeTargetKey,
  computeLedgerPath,
  buildFreezeExceptionBinding,
  buildCheckRunProjection,
} from './viona-merge-explicit-authorization.mjs';

const originalFetch = globalThis.fetch;
let unexpectedNetworkCalls = 0;
globalThis.fetch = function unexpectedFetchTrap() {
  unexpectedNetworkCalls += 1;
  throw new Error('UNEXPECTED_NETWORK_ACCESS');
};

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}
async function testAsync(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

const HEAD = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const HEAD2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const AUTHORIZED_AT_MS = Date.parse('2020-01-01T00:00:10.000Z');
const [OWNER, REPO_NAME] = CANONICAL_REPOSITORY.split('/');

/**
 * Fully in-memory mock of the GitHub Contents API surface the ledger
 * touches — genuine sha-conditional semantics so CAS/race tests are
 * meaningful, not merely simulated.
 */
function createMockLedgerStore() {
  const store = new Map();
  let counter = 0;
  function nextSha() {
    counter += 1;
    return String(counter).padStart(40, '0');
  }
  function notFound() {
    return Object.assign(new Error('Not Found'), { sanitized: { status: 404, message: 'Not Found' } });
  }
  function conflict(message) {
    return Object.assign(new Error(message), { sanitized: { status: 409, message } });
  }
  return {
    store,
    seed(targetKey, json) {
      const bare = `/repos/${OWNER}/${REPO_NAME}/contents/${computeLedgerPath(targetKey)}`;
      const sha = nextSha();
      store.set(bare, { sha, json });
      return sha;
    },
    getRaw(targetKey) {
      return store.get(`/repos/${OWNER}/${REPO_NAME}/contents/${computeLedgerPath(targetKey)}`);
    },
    async handle({ method, urlPath, body }) {
      const bare = urlPath.split('?')[0];
      if (method === 'GET') {
        const entry = store.get(bare);
        if (!entry) throw notFound();
        return {
          sha: entry.sha,
          content: Buffer.from(JSON.stringify(entry.json), 'utf8').toString('base64'),
          encoding: 'base64',
          path: bare.split('/contents/')[1],
        };
      }
      if (method === 'PUT') {
        const existing = store.get(bare);
        if (body.sha == null) {
          if (existing) throw conflict('sha_required_but_exists');
        } else if (!existing || existing.sha !== body.sha) {
          throw conflict('stale_sha');
        }
        const decoded = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
        const sha = nextSha();
        store.set(bare, { sha, json: decoded });
        return { content: { sha }, commit: { sha: `commit-${sha}` } };
      }
      return { message: 'unsupported_mock_method' };
    },
  };
}

function ledgerRecord(over = {}) {
  const authorizedAtMs = AUTHORIZED_AT_MS;
  const expiresAtMs = computeAuthorizationExpiry(authorizedAtMs);
  const authorizationId = over.authorization_id ?? 'fixed-test-authorization-id-1';
  const digest = over.reviewed_scope_digest ?? 'PLACEHOLDER_DIGEST';
  return {
    schema: 'viona.merge-authority-ledger/v1',
    schema_version: 1,
    target_key: over.target_key ?? 'placeholder',
    authorization_id: authorizationId,
    state: AUTHORIZATION_STATES.ACTIVE,
    repository: CANONICAL_REPOSITORY,
    pr_number: 461,
    base_branch: 'master',
    head_sha: HEAD,
    reviewed_scope_digest: digest,
    merge_mode: 'squash',
    stage1_check_run_id: 555,
    stage1_completed_at: '2020-01-01T00:00:00.000Z',
    authorized_by: 'laoton80-del',
    authorized_at: new Date(authorizedAtMs).toISOString(),
    expires_at: new Date(expiresAtMs).toISOString(),
    expires_at_ms: expiresAtMs,
    freeze_state: GLOBAL_MERGE_FREEZE_STATE,
    freeze_scope: RELEASED_FREEZE_SCOPE,
    freeze_exception_binding: null,
    revoked_at: null,
    revoked_by: null,
    revocation_reason: null,
    consumption_started_at: null,
    consumed_at: null,
    consumed_by: null,
    merge_commit_sha: null,
    merge_api_result: null,
    last_transition_at: new Date(authorizedAtMs).toISOString(),
    last_transition_actor: 'laoton80-del',
    ...over,
  };
}

function createMockWrapperDeps(options = {}) {
  const files = options.files ?? [{ status: 'modified', filename: 'a.txt' }];
  const digest = computeReviewedScopeDigest(files);

  const pr = options.pr ?? {
    number: 461,
    state: 'open',
    base: { ref: 'master' },
    head: { sha: options.headSha ?? HEAD },
    auto_merge: null,
  };

  const targetKey = computeTargetKey({
    repository: CANONICAL_REPOSITORY,
    prNumber: 461,
    headSha: pr.head.sha,
    baseBranch: 'master',
    mergeMode: 'squash',
    reviewedScopeDigest: digest,
  });

  let currentNowMs = options.nowMs ?? AUTHORIZED_AT_MS + 60_000;

  const ledger = options.ledger ?? createMockLedgerStore();
  if (!options.noLedgerRecord) {
    ledger.seed(
      targetKey,
      ledgerRecord({ target_key: targetKey, reviewed_scope_digest: digest, head_sha: pr.head.sha, ...options.recordOverrides }),
    );
  }

  const projection =
    options.forceProjection !== undefined
      ? options.forceProjection
      : buildCheckRunProjection({
          authorizationId: 'fixed-test-authorization-id-1',
          targetKey: options.projectionTargetKeyOverride ?? targetKey,
          headSha: options.projectionHeadShaOverride ?? pr.head.sha,
          expiresAt: new Date(computeAuthorizationExpiry(AUTHORIZED_AT_MS)).toISOString(),
        });

  const stage1Check = options.noStage1
    ? []
    : [{ name: GATE_CHECK_RUN_NAME, head_sha: pr.head.sha, conclusion: 'success', app: { id: 42 } }];
  const stage2CheckRun = options.noStage2
    ? []
    : [
        {
          id: 900,
          name: STAGE2_CHECK_RUN_NAME,
          head_sha: pr.head.sha,
          conclusion: options.stage2Conclusion ?? 'success',
          output: { summary: JSON.stringify(projection) },
        },
      ];

  const mergeCalls = [];
  let mergeAttempt = 0;

  const args = {
    repo: CANONICAL_REPOSITORY,
    pr: '461',
    head: pr.head.sha,
    base: 'master',
    mode: 'squash',
    reviewedScopeDigest: digest,
    gateAppId: '42',
    freezeScope: options.freezeScope ?? RELEASED_FREEZE_SCOPE,
    authorizationId: options.authorizationId ?? 'fixed-test-authorization-id-1',
    execute: options.execute === true,
  };

  const deps = {
    args,
    nowMs: () => currentNowMs,
    extraCheckRuns: options.extraCheckRuns ?? [],
    log: () => {},
    async restRequest(req) {
      const { method, urlPath } = req;
      const bare = urlPath.split('?')[0];
      if (bare.includes('/contents/records/')) {
        if (options.forceLedgerReadError && method === 'GET') throw options.forceLedgerReadError;
        if (options.forceConsumedWriteError && method === 'PUT' && req.body?.sha != null) {
          const decoded = JSON.parse(Buffer.from(req.body.content, 'base64').toString('utf8'));
          if (decoded.state === AUTHORIZATION_STATES.CONSUMED) {
            throw options.forceConsumedWriteError;
          }
        }
        return ledger.handle(req);
      }
      if (/\/pulls\/\d+$/.test(urlPath) && method === 'GET') {
        return pr;
      }
      if (urlPath.includes('/pulls/') && urlPath.includes('/reviews')) {
        return options.reviews ?? [{ state: 'APPROVED', commit_id: pr.head.sha }];
      }
      if (urlPath.includes('/pulls/') && urlPath.includes('/files')) {
        return files;
      }
      if (urlPath.includes('/check-runs') && method === 'GET') {
        return { check_runs: [...stage1Check, ...stage2CheckRun] };
      }
      if (urlPath.includes('/branches/master/protection') && method === 'GET') {
        return {
          enforce_admins: { enabled: true },
          // Simulates the post-Lane-B2 state where branch protection has
          // already added STAGE2_CHECK_RUN_NAME as required — this is the
          // scenario these wrapper tests exercise, even though Lane B1
          // itself never performs this mutation for real.
          required_status_checks: {
            contexts: options.requiredContexts ?? [GATE_CHECK_RUN_NAME, STAGE2_CHECK_RUN_NAME],
          },
        };
      }
      if (/\/merges$|\/merge$/.test(urlPath) && method === 'PUT') {
        mergeAttempt += 1;
        mergeCalls.push(req);
        if (options.forceMergeError) {
          // Simulate real elapsed time / real live-PR drift discovered
          // during the (failed) merge attempt, so the wrapper's POST-merge
          // recovery re-check (which runs strictly after this throw)
          // observes a genuinely different fact than the earlier VERIFY/
          // CLAIM steps did — never merely forcing a helper to return
          // false (revision directive §10).
          if (options.advanceNowMsOnMergeErrorTo != null) currentNowMs = options.advanceNowMsOnMergeErrorTo;
          if (typeof options.onMergeError === 'function') options.onMergeError({ pr });
          throw options.forceMergeError;
        }
        return { sha: 'merged-commit-sha-0000000000000000000000' };
      }
      return {};
    },
    async graphqlRequest() {
      return {
        data: {
          repository: {
            pullRequest: {
              reviewThreads: { nodes: options.unresolved ? [{ isResolved: false }] : [{ isResolved: true }] },
            },
          },
        },
      };
    },
  };
  deps._ledger = ledger;
  deps._targetKey = targetKey;
  deps._digest = digest;
  deps._mergeAttempt = () => mergeAttempt;
  return deps;
}

async function main() {
  try {
    // --- 1. Stage 1 green + Stage 2 missing => wrapper refuses ---
    await testAsync('1 Stage 1 green + Stage 2 missing => wrapper refuses', async () => {
      const deps = createMockWrapperDeps({ noStage2: true, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 2. Stage 2 wrong head => refuses ---
    await testAsync('2 Stage 2 wrong head => refuses', async () => {
      const deps = createMockWrapperDeps({
        recordOverrides: { head_sha: HEAD2 },
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 3. Stage 2 wrong digest => refuses ---
    await testAsync('3 Stage 2 wrong digest => refuses', async () => {
      const deps = createMockWrapperDeps({
        recordOverrides: { reviewed_scope_digest: 'not-the-real-digest' },
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 4. Stage 2 wrong mode => refuses ---
    await testAsync('4 Stage 2 wrong mode => refuses', async () => {
      const deps = createMockWrapperDeps({ recordOverrides: { merge_mode: 'merge' }, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 5. Replay/duplicate authorization => refuses ---
    await testAsync('5 replay/duplicate authorization (already CONSUMED) => refuses', async () => {
      const deps = createMockWrapperDeps({
        recordOverrides: { state: AUTHORIZATION_STATES.CONSUMED },
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 6. Two consumers => exactly one claim ---
    await testAsync('6 two consumers attempt claim => exactly one merge call total (real ledger sha-CAS)', async () => {
      const ledger = createMockLedgerStore();
      const deps1 = createMockWrapperDeps({ ledger, execute: true });
      const deps2 = createMockWrapperDeps({ ledger, noLedgerRecord: true, execute: true });
      const [resultA, resultB] = await Promise.all([
        runGuardedPrMerge(deps1),
        runGuardedPrMerge(deps2),
      ]);
      const winners = [resultA, resultB].filter((r) => r.mergeInvoked === true);
      assert.equal(winners.length, 1, 'exactly one consumer must reach mergeInvoked=true');
      assert.equal(deps1._mergeAttempt() + deps2._mergeAttempt(), 1, 'exactly one merge API call total');
      const losers = [resultA, resultB].filter((r) => r.mergeInvoked !== true);
      assert.equal(losers.length, 1);
      assert.equal(losers[0].ok, false);
    });

    // --- 7. Head changes after authorization => refuses ---
    await testAsync('7 head changes after authorization => refuses', async () => {
      const deps = createMockWrapperDeps({ headSha: HEAD2, execute: true });
      // args.head still points at the ORIGINAL authorized head, while the
      // live PR now reports HEAD2 — this must be caught by the existing
      // exact-head check (never weakened) before Stage 2 is even reached.
      deps.args.head = HEAD;
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 8. Review invalidated => refuses ---
    await testAsync('8 review invalidated (dismissed) => refuses', async () => {
      const deps = createMockWrapperDeps({ reviews: [], execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 9. Branch protection drift => refuses ---
    await testAsync('9 branch protection drift (new unmet required check) => refuses', async () => {
      const deps = createMockWrapperDeps({
        requiredContexts: [GATE_CHECK_RUN_NAME, 'Some New Required Check'],
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    // --- 10. MERGE_RESULT_UNKNOWN => reconciliation required, no blind retry ---
    await testAsync('10 MERGE_RESULT_UNKNOWN => held CONSUMING in the ledger, no retry, no reissue', async () => {
      const timeoutError = new Error('ECONNRESET');
      const deps = createMockWrapperDeps({ forceMergeError: timeoutError, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(result.mergeResultClass, 'MERGE_RESULT_UNKNOWN');
      assert.equal(deps._mergeAttempt(), 1, 'exactly one merge attempt was made, not retried');
      // The ledger record must have been CAS-written to CONSUMING (claim)
      // and MUST NOT have been written a second time back to
      // ACTIVE/INVALIDATED — it stays held pending reconciliation.
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(final.json.state, AUTHORIZATION_STATES.CONSUMING);
    });

    // --- 11. Valid exact authority in dry-run => all checks pass, no merge ---
    await testAsync('11 RELEASED valid exact authority in dry-run => verified, zero merge calls, ledger untouched', async () => {
      const deps = createMockWrapperDeps({ execute: false });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, true);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 0);
      const before = deps._ledger.getRaw(deps._targetKey);
      assert.equal(before.json.state, AUTHORIZATION_STATES.ACTIVE);
      assert.equal(before.json.freeze_state, GLOBAL_MERGE_FREEZE_STATES.RELEASED);
      assert.equal(before.json.freeze_exception_binding, null);
    });

    await testAsync('12 valid exact authority with --execute => claim, one merge, CONSUMED recorded in ledger with merge_commit_sha', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, true);
      assert.equal(result.mergeInvoked, true);
      assert.equal(deps._mergeAttempt(), 1);
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(final.json.state, AUTHORIZATION_STATES.CONSUMED);
      assert.ok(final.json.merge_commit_sha);
      assert.ok(final.json.consumed_at);
    });

    test('13 freeze scope missing/wrong => refuses even if everything else is green', () => {
      const digest = computeReviewedScopeDigest([{ status: 'modified', filename: 'a.txt' }]);
      const r = evaluateGuardedMerge({
        repository: CANONICAL_REPOSITORY,
        prNumber: '461',
        prMissing: false,
        prState: 'OPEN',
        headSha: HEAD,
        actualHeadSha: HEAD,
        base: 'master',
        actualBase: 'master',
        mode: 'squash',
        computedReviewedScopeDigest: digest,
        suppliedReviewedScopeDigest: digest,
        autoMergeActive: false,
        unresolvedConversation: false,
        reviewSatisfied: true,
        requiredCheckFailed: false,
        gateCheckMissing: false,
        gateCheckStaleSha: false,
        gateCheckConclusion: 'success',
        duplicateConflictingGateContext: false,
        gateAppIdMissing: false,
        gateAppId: '42',
        actualGateAppId: 42,
        stage2Required: true,
        stage2CheckMissing: false,
        stage2CheckConclusion: 'success',
        stage2TargetKeyMismatch: false,
        stage2LifecycleOk: true,
        stage2LifecycleBlocker: null,
        freezeScope: 'NOT_THE_CANONICAL_SCOPE',
        authorizationId: 'fixed-test-authorization-id-1',
        stage2RecordAuthorizedBy: 'laoton80-del',
        stage2RecordAuthorizationId: 'fixed-test-authorization-id-1',
      });
      assert.equal(r.ok, false);
    });

    await testAsync('13b RELEASED wrapper rejects remediation scope as an ordinary bypass', async () => {
      const deps = createMockWrapperDeps({ freezeScope: CANONICAL_FREEZE_SCOPE, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    await testAsync('13c RELEASED wrapper rejects a historical ACTIVE remediation record', async () => {
      const digest = computeReviewedScopeDigest([{ status: 'modified', filename: 'a.txt' }]);
      const authorizationId = 'fixed-test-authorization-id-1';
      const deps = createMockWrapperDeps({
        freezeScope: CANONICAL_FREEZE_SCOPE,
        recordOverrides: {
          freeze_state: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
          freeze_scope: CANONICAL_FREEZE_SCOPE,
          freeze_exception_binding: buildFreezeExceptionBinding({
            repository: CANONICAL_REPOSITORY,
            prNumber: 461,
            headSha: HEAD,
            authorizationId,
            reviewedScopeDigest: digest,
            mergeMode: 'squash',
            actor: 'laoton80-del',
            windowStart: new Date(AUTHORIZED_AT_MS).toISOString(),
            windowEnd: new Date(computeAuthorizationExpiry(AUTHORIZED_AT_MS)).toISOString(),
          }),
        },
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    test('14 evaluateGuardedMerge never weakens pre-existing Stage 1 checks', () => {
      // Every pre-existing Stage 1/review/digest guard must still fire even
      // when every Stage 2 fact is green — additive checks must never move
      // earlier in the sequence.
      const digest = computeReviewedScopeDigest([{ status: 'modified', filename: 'a.txt' }]);
      const r = evaluateGuardedMerge({
        repository: CANONICAL_REPOSITORY,
        prNumber: '461',
        prMissing: false,
        prState: 'OPEN',
        headSha: HEAD,
        actualHeadSha: HEAD2, // pre-existing head-mismatch guard
        base: 'master',
        actualBase: 'master',
        mode: 'squash',
        computedReviewedScopeDigest: digest,
        suppliedReviewedScopeDigest: digest,
        stage2Required: true,
        stage2CheckMissing: false,
        stage2CheckConclusion: 'success',
        stage2TargetKeyMismatch: false,
        stage2LifecycleOk: true,
        freezeScope: RELEASED_FREEZE_SCOPE,
        stage2RecordAuthorizedBy: 'laoton80-del',
      });
      assert.equal(r.ok, false);
      assert.notEqual(r.blocker, undefined);
    });

    test('15 parseGuardedMergeArgs parses new Stage 2 flags', () => {
      const parsed = parseGuardedMergeArgs([
        '--freeze-scope', RELEASED_FREEZE_SCOPE,
        '--authorization-id', 'abc-123',
      ]);
      assert.equal(parsed.freezeScope, RELEASED_FREEZE_SCOPE);
      assert.equal(parsed.authorizationId, 'abc-123');
    });

    // --- Ledger authoritative / check-run projection-only integration ---

    await testAsync('16 wrapper reads the LEDGER as authority: check success but ledger record missing => reject, no merge', async () => {
      const deps = createMockWrapperDeps({ noLedgerRecord: true, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    await testAsync('17 check-run projection target_key mismatch vs live facts => reject (never trust the check run alone)', async () => {
      const otherKey = computeTargetKey({
        repository: CANONICAL_REPOSITORY,
        prNumber: 9999,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: 'irrelevant',
      });
      const deps = createMockWrapperDeps({
        projectionTargetKeyOverride: otherKey,
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    await testAsync('18 check-run projection ledger_ref mismatch => reject, no merge', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      // Force the projection to declare a different (wrong) ledger_ref.
      const deps2 = createMockWrapperDeps({
        execute: true,
        forceProjection: {
          authorization_id: 'fixed-test-authorization-id-1',
          target_key: deps._targetKey,
          ledger_ref: 'some-other-ref',
          ledger_path: `records/${deps._targetKey.slice(0, 2)}/${deps._targetKey}.json`,
          head_sha: HEAD,
          expires_at: new Date(computeAuthorizationExpiry(AUTHORIZED_AT_MS)).toISOString(),
        },
      });
      const result = await runGuardedPrMerge(deps2);
      assert.equal(result.ok, false);
      assert.equal(deps2._mergeAttempt(), 0);
    });

    await testAsync('19 no ledger write path this file exercises ever targets master', async () => {
      const capturedBranches = [];
      const ledger = createMockLedgerStore();
      const deps = createMockWrapperDeps({ ledger, execute: true });
      const wrapped = {
        ...deps,
        async restRequest(req) {
          if (req.body?.branch != null) capturedBranches.push(req.body.branch);
          return deps.restRequest(req);
        },
      };
      await runGuardedPrMerge(wrapped);
      assert.ok(capturedBranches.length > 0, 'at least one ledger write occurred');
      assert.ok(capturedBranches.every((b) => b === LEDGER_REF));
      assert.ok(capturedBranches.every((b) => b !== 'master'));
    });

    await testAsync('20 successful mock merge => ledger CONSUMED with merge_commit_sha, and check-run PATCH is never used as the claim primitive', async () => {
      const patchedCheckRuns = [];
      const deps = createMockWrapperDeps({ execute: true });
      const wrapped = {
        ...deps,
        async restRequest(req) {
          if (/\/check-runs\/\d+$/.test(req.urlPath.split('?')[0]) && req.method === 'PATCH') {
            patchedCheckRuns.push(req);
          }
          return deps.restRequest(req);
        },
      };
      const result = await runGuardedPrMerge(wrapped);
      assert.equal(result.ok, true);
      assert.equal(result.mergeInvoked, true);
      assert.equal(patchedCheckRuns.length, 0, 'the claim/consumption mechanism must never PATCH a check run');
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(final.json.state, AUTHORIZATION_STATES.CONSUMED);
      assert.ok(final.json.merge_commit_sha);
    });

    await testAsync('21 stale-sha claimant makes zero merge API calls', async () => {
      const ledger = createMockLedgerStore();
      const deps = createMockWrapperDeps({ ledger, execute: true });
      // Simulate that some OTHER process already advanced the ledger past
      // our observed sha between VERIFY and CLAIM by rewriting the record
      // (with a fresh sha) right before this wrapper run executes its own
      // internal reread/claim.
      const original = deps.restRequest;
      let claimAttempted = false;
      deps.restRequest = async (req) => {
        const bare = req.urlPath.split('?')[0];
        if (bare.includes('/contents/records/') && req.method === 'PUT' && req.body.sha != null && !claimAttempted) {
          claimAttempted = true;
          // Race: bump the stored sha out from under the claim by writing
          // through the mock directly with a DIFFERENT expected sha first.
          const current = ledger.getRaw(deps._targetKey);
          await ledger.handle({
            method: 'PUT',
            urlPath: req.urlPath,
            body: { sha: current.sha, content: req.body.content },
          });
        }
        return original(req);
      };
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 0, 'a stale-sha claimant must never call the merge API');
    });

    await testAsync('22 CONSUMING state observed at VERIFY time => no second merge', async () => {
      const ledger = createMockLedgerStore();
      const digest = computeReviewedScopeDigest([{ status: 'modified', filename: 'a.txt' }]);
      const targetKey = computeTargetKey({
        repository: CANONICAL_REPOSITORY,
        prNumber: 461,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: digest,
      });
      ledger.seed(targetKey, ledgerRecord({ target_key: targetKey, reviewed_scope_digest: digest, state: AUTHORIZATION_STATES.CONSUMING }));
      const deps = createMockWrapperDeps({ ledger, noLedgerRecord: true, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps._mergeAttempt(), 0);
    });

    await testAsync('23 no write from this wrapper ever targets a repository other than CANONICAL_REPOSITORY', async () => {
      const capturedUrlPaths = [];
      const deps = createMockWrapperDeps({ execute: true });
      const wrapped = {
        ...deps,
        async restRequest(req) {
          if (req.urlPath.includes('/contents/')) capturedUrlPaths.push(req.urlPath);
          return deps.restRequest(req);
        },
      };
      await runGuardedPrMerge(wrapped);
      assert.ok(capturedUrlPaths.length > 0);
      assert.ok(capturedUrlPaths.every((p) => p.startsWith(`/repos/${OWNER}/${REPO_NAME}/contents/records/`)));
    });

    // --- Merge-failure recovery re-verification (revision directive
    // LANE_B1.IMPLEMENTATION_REVISION.V1) ---

    await testAsync('T-R1 valid retryable failure => CONSUMING re-verified and correctly reactivated to ACTIVE, exactly one merge attempt', async () => {
      const safeRetryableErr = Object.assign(new Error('merge conflict'), { sanitized: { status: 409 } });
      const deps = createMockWrapperDeps({ forceMergeError: safeRetryableErr, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(result.mergeResultClass, 'SAFE_RETRYABLE_FAILURE');
      assert.equal(deps._mergeAttempt(), 1, 'exactly one merge attempt');
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(final.json.state, AUTHORIZATION_STATES.ACTIVE);
    });

    await testAsync('T-R2 expired at recovery evaluation => CONSUMING resolves to EXPIRED, never ACTIVE, exactly one merge attempt', async () => {
      const safeRetryableErr = Object.assign(new Error('merge conflict'), { sanitized: { status: 409 } });
      const deps = createMockWrapperDeps({
        forceMergeError: safeRetryableErr,
        // Simulate real elapsed time discovered at recovery time — the
        // earlier VERIFY/CLAIM steps observed the original valid nowMs;
        // only the post-failure recovery re-check observes this advanced,
        // past-expiry clock.
        advanceNowMsOnMergeErrorTo: computeAuthorizationExpiry(AUTHORIZED_AT_MS) + 120_000,
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 1, 'exactly one merge attempt');
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(final.json.state, AUTHORIZATION_STATES.EXPIRED);
      assert.notEqual(final.json.state, AUTHORIZATION_STATES.ACTIVE);
    });

    await testAsync('T-R3 real binding dimension invalidated (head changed) at recovery evaluation => CONSUMING resolves to INVALIDATED, never ACTIVE, exactly one merge attempt', async () => {
      const safeRetryableErr = Object.assign(new Error('merge conflict'), { sanitized: { status: 409 } });
      const deps = createMockWrapperDeps({
        forceMergeError: safeRetryableErr,
        // Mutates the SAME live `pr` object the wrapper already captured
        // (real head-mismatch dimension per revision directive §10 —
        // never merely forcing evaluateAuthorizationLifecycleValidity to
        // return false without exercising real facts).
        onMergeError: ({ pr: livePr }) => {
          livePr.head.sha = HEAD2;
        },
        execute: true,
      });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps._mergeAttempt(), 1, 'exactly one merge attempt');
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(final.json.state, AUTHORIZATION_STATES.INVALIDATED);
      assert.notEqual(final.json.state, AUTHORIZATION_STATES.ACTIVE);
    });

    await testAsync('T-R4 merge succeeds but CONSUMED ledger write fails => no second merge, never returns to ACTIVE, reconciliation required, merge success not misclassified as merge failure', async () => {
      const consumedWriteErr = Object.assign(new Error('ledger technical error'), { sanitized: { status: 500 } });
      const deps = createMockWrapperDeps({ forceConsumedWriteError: consumedWriteErr, execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(deps._mergeAttempt(), 1, 'merge API called exactly once');
      assert.equal(result.mergeInvoked, true, 'merge success must not be misclassified as merge failure');
      assert.equal(result.ok, false, 'ledger finalization failure must surface as a non-ok result');
      assert.equal(result.mergeSucceededLedgerFinalizationFailed, true);
      assert.notEqual(result.mergeResultClass, 'SAFE_RETRYABLE_FAILURE');
      assert.notEqual(result.mergeResultClass, 'NON_RETRYABLE_FAILURE');
      const final = deps._ledger.getRaw(deps._targetKey);
      assert.equal(
        final.json.state,
        AUTHORIZATION_STATES.CONSUMING,
        'ledger remains held at CONSUMING pending manual reconciliation',
      );
      assert.notEqual(final.json.state, AUTHORIZATION_STATES.ACTIVE);
    });

    assert.equal(unexpectedNetworkCalls, 0, 'global fetch trap must remain unused');
    console.log(`\nPASS_COUNT ${passed}`);
    console.log(`UNEXPECTED_NETWORK_CALLS ${unexpectedNetworkCalls}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((err) => {
  globalThis.fetch = originalFetch;
  console.error(err);
  process.exitCode = 1;
});
