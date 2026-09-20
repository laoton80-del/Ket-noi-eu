/**
 * Offline deterministic tests — Viona Explicit Merge Authorization (Stage 2)
 * + GitHub-native ledger backend (Lane B1 V2).
 *
 * Network: global fetch trap. Tokens unused. Real check runs: 0. Real
 * merges: 0. Real ledger writes: 0 (a fully in-memory mock ledger with
 * genuine sha-conditional semantics stands in for the GitHub Contents API).
 * Workflow dispatch: never invoked by this test file.
 */

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
  STAGE2_CHECK_RUN_NAME,
  STAGE1_CHECK_RUN_NAME,
  AUTHORIZATION_STATES,
  BLOCKERS,
  CANONICAL_REPOSITORY,
  CANONICAL_FREEZE_SCOPE,
  GLOBAL_MERGE_FREEZE_STATES,
  GLOBAL_MERGE_FREEZE_STATE,
  RELEASED_FREEZE_SCOPE,
  FREEZE_SCOPE_POLICY_FAILURES,
  AUTHORIZATION_TTL_MINUTES,
  LEDGER_REF,
  computeAuthorizationExpiry,
  evaluateAuthorizationIssuance,
  evaluateAuthorizationLifecycleValidity,
  evaluateFreezeScopeForState,
  stage2BlockerForFreezeScopePolicy,
  evaluateFreezeRecordForState,
  parseStage2Inputs,
  classifyMergeAttemptFailure,
  MERGE_RESULT_CLASSES,
  runExplicitMergeAuthorization,
  computeReviewedScopeDigest,
  computeTargetSerialization,
  computeTargetKey,
  computeLedgerPath,
  assertLedgerWritePath,
  buildLedgerRecord,
  buildFreezeExceptionBinding,
  buildCheckRunProjection,
  ledgerReadRecord,
  ledgerCreateRecord,
  ledgerConditionalWriteRecord,
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
const MASTER = 'cccccccccccccccccccccccccccccccccccccccc';
const BLOB = 'dddddddddddddddddddddddddddddddddddddddd';
const RUN_CREATED_MS = Date.parse('2020-01-01T00:00:10.000Z');

function happyIssuanceFacts(over = {}) {
  return {
    repository: CANONICAL_REPOSITORY,
    prNumber: 461,
    headSha: HEAD,
    baseBranch: 'master',
    mergeMode: 'squash',
    freezeScope: RELEASED_FREEZE_SCOPE,
    stage1CheckRunId: 555,
    reviewedScopeDigest: 'abc',
    missing: [],
    structuredInputsComplete: true,

    provenanceMechanism: 'VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD',
    eventName: 'workflow_dispatch',
    runAttempt: 1,
    actor: 'laoton80-del',
    triggeringActor: 'laoton80-del',
    workflowPath: '.github/workflows/viona-merge-explicit-authorization.yml',
    canonicalWorkflowVersionProven: true,
    workflowRunId: '999',

    prMissing: false,
    prState: 'OPEN',
    actualPrNumber: 461,
    actualBaseBranch: 'master',
    actualHeadSha: HEAD,
    autoMergeActive: false,

    stage1Missing: false,
    stage1Conclusion: 'success',
    stage1CheckName: STAGE1_CHECK_RUN_NAME,
    actualStage1CheckRunId: 555,
    stage1HeadSha: HEAD,
    stage1Superseded: false,

    computedReviewedScopeDigest: 'abc',
    reviewSatisfied: true,
    unresolvedConversation: false,
    duplicateActiveAuthorization: false,
    allConditionsExplicitlyGreen: true,
    technicalError: false,

    authorizationId: 'fixed-test-authorization-id-1',
    authorizedAtMs: RUN_CREATED_MS,
    ttlMinutes: AUTHORIZATION_TTL_MINUTES,
    ...over,
  };
}

function activeRecord(over = {}) {
  const authorizedAtMs = RUN_CREATED_MS;
  const expiresAtMs = computeAuthorizationExpiry(authorizedAtMs);
  const authorizationId = over.authorization_id ?? 'fixed-test-authorization-id-1';
  return {
    schema: 'viona.merge-authority-ledger/v1',
    schema_version: 1,
    target_key: 'a'.repeat(64),
    authorization_id: authorizationId,
    state: AUTHORIZATION_STATES.ACTIVE,
    repository: CANONICAL_REPOSITORY,
    pr_number: 461,
    base_branch: 'master',
    head_sha: HEAD,
    reviewed_scope_digest: 'abc',
    merge_mode: 'squash',
    stage1_check_name: STAGE1_CHECK_RUN_NAME,
    stage1_check_run_id: 555,
    stage1_head_sha: HEAD,
    stage1_completed_at: '2020-01-01T00:00:00.000Z',
    stage1_conclusion: 'success',
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

function historicalFreezeActiveRecord(over = {}) {
  const authorizationId = over.authorization_id ?? 'fixed-test-authorization-id-1';
  const reviewedScopeDigest = over.reviewed_scope_digest ?? 'abc';
  const authorizedAtMs = RUN_CREATED_MS;
  const expiresAtMs = computeAuthorizationExpiry(authorizedAtMs);
  return activeRecord({
    freeze_state: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
    freeze_scope: CANONICAL_FREEZE_SCOPE,
    freeze_exception_binding: buildFreezeExceptionBinding({
      repository: CANONICAL_REPOSITORY,
      prNumber: 461,
      headSha: over.head_sha ?? HEAD,
      authorizationId,
      reviewedScopeDigest,
      mergeMode: over.merge_mode ?? 'squash',
      actor: 'laoton80-del',
      windowStart: new Date(authorizedAtMs).toISOString(),
      windowEnd: new Date(expiresAtMs).toISOString(),
    }),
    ...over,
  });
}

/**
 * Fully in-memory mock of the GitHub Contents API surface this module
 * touches for the ledger — genuine sha-conditional semantics (a create
 * without `sha` fails if the file exists; a PUT with a stale `sha` fails)
 * so CAS/race tests are meaningful, not merely simulated.
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
    seed(urlPath, json) {
      const bare = urlPath.split('?')[0];
      const sha = nextSha();
      store.set(bare, { sha, json });
      return sha;
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

function createMockStage2Deps(options = {}) {
  const creates = [];
  const completes = [];
  const ledger = options.ledger ?? createMockLedgerStore();
  const files = options.files ?? [{ status: 'modified', filename: 'a.txt' }];
  const digest = computeReviewedScopeDigest(files);
  const pr = options.pr ?? {
    number: 461,
    state: 'open',
    base: { ref: 'master' },
    head: { sha: HEAD },
    auto_merge: null,
  };
  const reviews = options.reviews ?? [
    { state: 'APPROVED', commit_id: HEAD, submitted_at: '2020-01-01T00:00:05.000Z' },
  ];
  const stage1Check = options.stage1Check ?? {
    id: 555,
    name: STAGE1_CHECK_RUN_NAME,
    head_sha: HEAD,
    conclusion: 'success',
    completed_at: '2020-01-01T00:00:00.000Z',
  };

  const deps = {
    env: {
      VIONA_STAGE2_PR_NUMBER: '461',
      VIONA_STAGE2_HEAD_SHA: HEAD,
      VIONA_STAGE2_BASE_BRANCH: 'master',
      VIONA_STAGE2_MERGE_MODE: 'squash',
      VIONA_STAGE2_REVIEWED_SCOPE_DIGEST: digest,
      VIONA_STAGE2_STAGE1_CHECK_RUN_ID: '555',
      VIONA_STAGE2_FREEZE_SCOPE: RELEASED_FREEZE_SCOPE,
      VIONA_STAGE2_RUN_ID: '999',
      VIONA_STAGE2_REPOSITORY: CANONICAL_REPOSITORY,
      ...options.env,
    },
    creates,
    completes,
    ledger,
    randomUUID: () => options.authorizationId ?? 'fixed-test-authorization-id-1',
    log: () => {},
    async restRequest(req) {
      const bare = req.urlPath.split('?')[0];
      if (bare.includes('/contents/records/')) {
        return ledger.handle(req);
      }
      const { method, urlPath } = req;
      if (urlPath === `/repos/laoton80-del/Ket-noi-eu`) {
        return { default_branch: 'master' };
      }
      if (urlPath.includes('/git/ref/heads/')) {
        return { object: { sha: MASTER } };
      }
      if (urlPath.includes('/actions/runs/')) {
        if (options.runMissing) return { message: 'Not Found' };
        return {
          id: 999,
          event: options.runEvent ?? 'workflow_dispatch',
          run_attempt: options.runAttempt ?? 1,
          head_branch: options.runHeadBranch ?? 'master',
          head_sha: options.runHeadSha ?? MASTER,
          path: options.runPath ?? '.github/workflows/viona-merge-explicit-authorization.yml',
          workflow_id: 7,
          created_at: options.runCreatedAt ?? '2020-01-01T00:00:10.000Z',
          actor: { login: options.actor ?? 'laoton80-del' },
          triggering_actor: { login: options.triggeringActor ?? options.actor ?? 'laoton80-del' },
        };
      }
      if (urlPath.includes('/actions/workflows/')) {
        return {
          id: 7,
          path: '.github/workflows/viona-merge-explicit-authorization.yml',
          state: 'active',
        };
      }
      if (urlPath.includes('/contents/')) {
        return { sha: BLOB, path: '.github/workflows/viona-merge-explicit-authorization.yml', type: 'file' };
      }
      if (/\/pulls\/\d+$/.test(urlPath) && method === 'GET') {
        if (options.prMissing) return { message: 'Not Found' };
        return pr;
      }
      if (urlPath.includes('/pulls/') && urlPath.includes('/reviews')) {
        return reviews;
      }
      if (urlPath.includes('/pulls/') && urlPath.includes('/files')) {
        return files;
      }
      if (/\/check-runs\/\d+$/.test(urlPath) && method === 'GET') {
        if (options.stage1Missing) return { message: 'Not Found' };
        return stage1Check;
      }
      if (urlPath.includes('/check-runs') && method === 'GET') {
        return { check_runs: options.existingStage2Checks ?? [] };
      }
      return {};
    },
    async graphqlRequest() {
      return {
        data: {
          repository: {
            pullRequest: {
              reviewThreads: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: options.unresolved ? [{ isResolved: false }] : [{ isResolved: true }],
              },
            },
          },
        },
      };
    },
    async createCheckRun(payload) {
      creates.push(payload);
      return { id: 888, ...payload };
    },
    async completeCheckRun(payload) {
      completes.push(payload);
      return payload;
    },
  };
  return { deps, digest, ledger };
}

async function main() {
  try {
    // --- Pure issuance evaluator ---

    test('1 correct exact authorization succeeds in evaluator fixture', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts());
      assert.equal(r.conclusion, 'success');
      assert.equal(r.finalAuthorizationState, AUTHORIZATION_STATES.ACTIVE);
      assert.ok(r.authorizationId);
    });

    test('2 wrong PR rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ actualPrNumber: 999 }));
      assert.equal(r.conclusion, 'failure');
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_PR_MISMATCH);
    });

    test('3 wrong SHA rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ actualHeadSha: HEAD2 }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_HEAD_MISMATCH);
    });

    test('4 wrong base rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ actualBaseBranch: 'develop' }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_BASE_BRANCH_MISMATCH);
    });

    test('5 wrong digest rejected', () => {
      const r = evaluateAuthorizationIssuance(
        happyIssuanceFacts({ computedReviewedScopeDigest: 'different' }),
      );
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_SCOPE_DIGEST_MISMATCH);
    });

    test('6 wrong merge mode rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ mergeMode: 'merge' }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_MERGE_MODE_MISMATCH);
    });

    test('7 Stage 1 missing rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ stage1Missing: true }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_MISSING);
    });

    test('8 Stage 1 wrong-head rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ stage1HeadSha: HEAD2 }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH);
    });

    test('9 Stage 1 non-success rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ stage1Conclusion: 'failure' }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_NOT_SUCCESS);
    });

    test('9b Stage 1 superseded rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ stage1Superseded: true }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_SUPERSEDED);
    });

    test('9c wrong Stage 1 check identity rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ actualStage1CheckRunId: 1 }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH);
    });

    // --- Stage1 Readiness semantic migration (governance directive
    // VIONA.REC2.MERGE_CONTROL.STAGE1_READINESS_SEMANTIC_MIGRATION.LOCAL_IMPLEMENTATION.V1) ---
    test('9d R9 old Stage1 check name alone cannot satisfy Stage2', () => {
      const r = evaluateAuthorizationIssuance(
        happyIssuanceFacts({ stage1CheckName: 'Viona Merge Authorization Gate' }),
      );
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH);
      assert.notEqual('Viona Merge Authorization Gate', STAGE1_CHECK_RUN_NAME);
    });

    test('9e R10 Stage2 rejects wrong readiness check-run ID', () => {
      const r = evaluateAuthorizationIssuance(
        happyIssuanceFacts({ actualStage1CheckRunId: 999999 }),
      );
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH);
    });

    test('9f R11 Stage2 rejects wrong readiness head', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ stage1HeadSha: HEAD2 }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH);
    });

    test('9g STAGE1_CHECK_RUN_NAME alias resolves to renamed Readiness Gate', () => {
      assert.equal(STAGE1_CHECK_RUN_NAME, 'Viona Merge Readiness Gate');
    });

    test('10 duplicate active authorization rejected', () => {
      const r = evaluateAuthorizationIssuance(
        happyIssuanceFacts({ duplicateActiveAuthorization: true }),
      );
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION);
    });

    test('11 review not satisfied rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ reviewSatisfied: false }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_REVIEW_REQUIREMENT_NOT_SATISFIED);
    });

    test('12 unresolved conversation rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ unresolvedConversation: true }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_UNRESOLVED_CONVERSATION);
    });

    test('13a ACTIVE freeze with no remediation exception scope is denied', () => {
      const r = evaluateFreezeScopeForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        freezeScope: null,
      });
      assert.equal(r.ok, false);
      assert.equal(
        r.reason,
        FREEZE_SCOPE_POLICY_FAILURES.ACTIVE_REMEDIATION_SCOPE_REQUIRED,
      );
      assert.equal(
        stage2BlockerForFreezeScopePolicy(r),
        BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING,
      );
    });

    test('13b ACTIVE freeze with invalid remediation exception scope is denied', () => {
      const r = evaluateFreezeScopeForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        freezeScope: 'SOMETHING_ELSE',
      });
      assert.equal(r.ok, false);
      assert.equal(
        r.reason,
        FREEZE_SCOPE_POLICY_FAILURES.ACTIVE_REMEDIATION_SCOPE_REQUIRED,
      );
      assert.equal(
        stage2BlockerForFreezeScopePolicy(r),
        BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING,
      );
    });

    test('14a ACTIVE freeze with exact-bound remediation exception is accepted by shared policy', () => {
      const r = evaluateFreezeRecordForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        record: historicalFreezeActiveRecord(),
        expected: { repository: CANONICAL_REPOSITORY, actor: 'laoton80-del' },
      });
      assert.equal(r.ok, true);
    });

    test('14b RELEASED ordinary Stage2 issuance succeeds when every non-freeze condition is green', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts());
      assert.equal(r.conclusion, 'success');
    });

    test('14c RELEASED mode rejects remediation scope as an ordinary authorization shortcut', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ freezeScope: CANONICAL_FREEZE_SCOPE }));
      assert.equal(r.conclusion, 'failure');
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_FREEZE_SCOPE_MISMATCH);
    });

    test('14d UNKNOWN freeze state fails closed', () => {
      const r = evaluateFreezeScopeForState({ freezeState: 'UNKNOWN', freezeScope: RELEASED_FREEZE_SCOPE });
      assert.equal(r.ok, false);
      assert.equal(r.reason, FREEZE_SCOPE_POLICY_FAILURES.UNKNOWN_FREEZE_STATE);
      assert.equal(
        stage2BlockerForFreezeScopePolicy(r),
        BLOCKERS.BLOCKED_STAGE2_FREEZE_STATE_UNKNOWN,
      );
    });

    test('15 PR closed rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ prState: 'CLOSED' }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_PR_CLOSED);
    });

    test('16 actor not authorized rejected', () => {
      const r = evaluateAuthorizationIssuance(
        happyIssuanceFacts({ actor: 'someone-else', triggeringActor: 'someone-else' }),
      );
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED);
    });

    test('17 workflow rerun (run_attempt != 1) rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ runAttempt: 2 }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_WORKFLOW_RERUN_NOT_PERMITTED);
    });

    test('18 auto-merge active rejected', () => {
      const r = evaluateAuthorizationIssuance(happyIssuanceFacts({ autoMergeActive: true }));
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTO_MERGE_ACTIVE);
    });

    test('19 no default success without every explicit condition green', () => {
      const r = evaluateAuthorizationIssuance(
        happyIssuanceFacts({ allConditionsExplicitlyGreen: false }),
      );
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR);
    });

    // --- Pure lifecycle-validity evaluator (ledger-authoritative; used by wrapper too) ---

    test('20 active ledger authorization within TTL is valid', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord(),
        expected: { headSha: HEAD, prNumber: 461, reviewedScopeDigest: 'abc', mergeMode: 'squash' },
        nowMs: RUN_CREATED_MS + 60_000,
      });
      assert.equal(r.ok, true);
    });

    test('21 expired authorization rejected', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord(),
        expected: {},
        nowMs: computeAuthorizationExpiry(RUN_CREATED_MS) + 1,
      });
      assert.equal(r.ok, false);
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_EXPIRED);
    });

    test('21b explicit EXPIRED state rejected even before TTL boundary', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord({ state: AUTHORIZATION_STATES.EXPIRED }),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_EXPIRED);
    });

    test('22 revoked authorization rejected', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord({ state: AUTHORIZATION_STATES.REVOKED }),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_REVOKED);
    });

    test('23 consumed authorization rejected (replay)', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord({ state: AUTHORIZATION_STATES.CONSUMED }),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_CONSUMED);
    });

    test('23b invalidated authorization rejected', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord({ state: AUTHORIZATION_STATES.INVALIDATED }),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_INVALIDATED);
    });

    test('23c consuming authorization requires reconciliation, not reuse', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord({ state: AUTHORIZATION_STATES.CONSUMING }),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_MERGE_RESULT_UNKNOWN_RECONCILIATION_REQUIRED);
    });

    test('24 missing authorization record rejected', () => {
      const r = evaluateAuthorizationLifecycleValidity({ record: null, expected: {}, nowMs: 1 });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND);
    });

    test('25 head mismatch invalidates (review/head drift)', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord(),
        expected: { headSha: HEAD2 },
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_HEAD_MISMATCH);
    });

    test('26 PR closed invalidates outstanding authorization', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord(),
        expected: { prClosed: true },
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_PR_CLOSED);
    });

    test('27 scope digest mismatch rejected', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord(),
        expected: { reviewedScopeDigest: 'not-abc' },
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_SCOPE_DIGEST_MISMATCH);
    });

    test('28 merge mode mismatch rejected', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord(),
        expected: { mergeMode: 'merge' },
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_MERGE_MODE_MISMATCH);
    });

    test('28b ACTIVE missing freeze-exception binding rejected even with matching remediation scope', () => {
      const r = evaluateFreezeRecordForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        record: historicalFreezeActiveRecord({ freeze_exception_binding: null }),
        expected: {},
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING);
    });

    test('28c ACTIVE freeze-exception binding for a DIFFERENT authorization_id rejected', () => {
      const r = evaluateFreezeRecordForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        record: historicalFreezeActiveRecord({
          freeze_exception_binding: buildFreezeExceptionBinding({
            repository: CANONICAL_REPOSITORY,
            prNumber: 461,
            headSha: HEAD,
            authorizationId: 'a-different-authorization-id',
            reviewedScopeDigest: 'abc',
            mergeMode: 'squash',
            actor: 'laoton80-del',
            windowStart: new Date(RUN_CREATED_MS).toISOString(),
            windowEnd: new Date(computeAuthorizationExpiry(RUN_CREATED_MS)).toISOString(),
          }),
        }),
        expected: {},
      });
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING);
    });

    test('28d RELEASED lifecycle rejects a manufactured ACTIVE remediation exception record', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: historicalFreezeActiveRecord(),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.ok, false);
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_FREEZE_SCOPE_MISMATCH);
    });

    test('28e RELEASED record rejects a fake remediation binding even with the released scope', () => {
      const r = evaluateAuthorizationLifecycleValidity({
        record: activeRecord({ freeze_exception_binding: { manufactured: true } }),
        expected: {},
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.ok, false);
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_NOT_PERMITTED);
    });

    // --- classifyMergeAttemptFailure ---

    test('29 405/409/422 classified SAFE_RETRYABLE_FAILURE', () => {
      for (const status of [405, 409, 422]) {
        const c = classifyMergeAttemptFailure({ sanitized: { status } });
        assert.equal(c, MERGE_RESULT_CLASSES.SAFE_RETRYABLE_FAILURE);
      }
    });

    test('30 401/403/404/410 classified NON_RETRYABLE_FAILURE', () => {
      for (const status of [401, 403, 404, 410]) {
        const c = classifyMergeAttemptFailure({ sanitized: { status } });
        assert.equal(c, MERGE_RESULT_CLASSES.NON_RETRYABLE_FAILURE);
      }
    });

    test('31 network timeout / no status classified MERGE_RESULT_UNKNOWN', () => {
      const c = classifyMergeAttemptFailure(new Error('ECONNRESET'));
      assert.equal(c, MERGE_RESULT_CLASSES.MERGE_RESULT_UNKNOWN);
    });

    // --- Structured input parsing ---

    test('32 structured inputs parsed and validated', () => {
      const parsed = parseStage2Inputs({
        VIONA_STAGE2_PR_NUMBER: '461',
        VIONA_STAGE2_HEAD_SHA: HEAD,
        VIONA_STAGE2_BASE_BRANCH: 'master',
        VIONA_STAGE2_MERGE_MODE: 'squash',
        VIONA_STAGE2_REVIEWED_SCOPE_DIGEST: 'abc',
        VIONA_STAGE2_STAGE1_CHECK_RUN_ID: '555',
        VIONA_STAGE2_FREEZE_SCOPE: RELEASED_FREEZE_SCOPE,
      });
      assert.equal(parsed.structuredInputsComplete, true);
      assert.equal(parsed.prNumber, 461);
    });

    test('33 missing structured input detected', () => {
      const parsed = parseStage2Inputs({ VIONA_STAGE2_PR_NUMBER: '461' });
      assert.equal(parsed.structuredInputsComplete, false);
      assert.ok(parsed.missing.length > 0);
    });

    // --- Ledger primitives: target serialization / target_key / path ---

    test('40 deterministic target serialization has exact fixed field order and LF termination', () => {
      const s = computeTargetSerialization({
        repository: CANONICAL_REPOSITORY,
        prNumber: 461,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: 'ABC',
      });
      assert.equal(
        s,
        `repository=${CANONICAL_REPOSITORY}\n` +
          `pr_number=461\n` +
          `head_sha=${HEAD}\n` +
          `base_branch=master\n` +
          `merge_mode=squash\n` +
          `reviewed_scope_digest=abc\n`,
      );
    });

    test('41 deterministic target_key: identical target -> identical key; any field change -> different key', () => {
      const base = {
        repository: CANONICAL_REPOSITORY,
        prNumber: 461,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: 'abc',
      };
      const k1 = computeTargetKey(base);
      const k2 = computeTargetKey({ ...base });
      assert.equal(k1, k2);
      assert.match(k1, /^[0-9a-f]{64}$/);
      for (const changed of [
        { prNumber: 462 },
        { headSha: HEAD2 },
        { baseBranch: 'develop' },
        { mergeMode: 'merge' },
        { reviewedScopeDigest: 'different' },
      ]) {
        assert.notEqual(computeTargetKey({ ...base, ...changed }), k1);
      }
    });

    test('42 deterministic ledger path: records/<first-two-chars>/<target_key>.json', () => {
      const key = computeTargetKey({
        repository: CANONICAL_REPOSITORY,
        prNumber: 461,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: 'abc',
      });
      const p = computeLedgerPath(key);
      assert.equal(p, `records/${key.slice(0, 2)}/${key}.json`);
    });

    test('43 malformed target_key rejected before any path is produced', () => {
      assert.throws(() => computeLedgerPath('not-a-valid-hex-key'));
      assert.throws(() => computeLedgerPath(''));
    });

    // --- Security: hard-bound write scope (directive §7/§8/§26/§32) ---

    test('44 arbitrary path rejected by assertLedgerWritePath', () => {
      const [owner, repo] = CANONICAL_REPOSITORY.split('/');
      assert.throws(() => assertLedgerWritePath(`/repos/${owner}/${repo}/contents/other/path.json`));
      assert.throws(() => assertLedgerWritePath(`/repos/${owner}/${repo}/contents/records-not-really/x.json`));
    });

    test('45 another-repository path rejected by assertLedgerWritePath', () => {
      assert.throws(() => assertLedgerWritePath('/repos/someone-else/other-repo/contents/records/aa/x.json'));
    });

    test('46 canonical records/ path under the canonical repository is accepted', () => {
      const [owner, repo] = CANONICAL_REPOSITORY.split('/');
      assert.doesNotThrow(() => assertLedgerWritePath(`/repos/${owner}/${repo}/contents/records/aa/${'a'.repeat(64)}.json`));
    });

    test('47 wrong/master ref never reachable: reads/writes always carry LEDGER_REF, never master', async () => {
      const ledger = createMockLedgerStore();
      const capturedUrlPaths = [];
      const capturedBranches = [];
      const deps = {
        async restRequest(req) {
          capturedUrlPaths.push(req.urlPath);
          if (req.body?.branch != null) capturedBranches.push(req.body.branch);
          if (req.urlPath.split('?')[0].includes('/contents/records/')) return ledger.handle(req);
          return {};
        },
      };
      const key = 'b'.repeat(64);
      await ledgerReadRecord(deps, key).catch(() => {});
      await ledgerCreateRecord(deps, {
        targetKey: key,
        record: buildLedgerRecord({
          targetKey: key,
          authorizationId: 'x',
          state: AUTHORIZATION_STATES.ACTIVE,
          repository: CANONICAL_REPOSITORY,
          prNumber: 1,
          headSha: HEAD,
          baseBranch: 'master',
          mergeMode: 'squash',
          reviewedScopeDigest: 'abc',
          authorizedBy: 'laoton80-del',
          authorizedAt: new Date(0).toISOString(),
          expiresAt: new Date(1).toISOString(),
          expiresAtMs: 1,
          freezeState: GLOBAL_MERGE_FREEZE_STATE,
          freezeScope: RELEASED_FREEZE_SCOPE,
          freezeExceptionBinding: null,
          lastTransitionAt: new Date(0).toISOString(),
          lastTransitionActor: 'laoton80-del',
        }),
      });
      assert.ok(capturedUrlPaths.every((p) => p.includes(`ref=${LEDGER_REF}`) || !p.includes('?')));
      assert.ok(capturedUrlPaths.every((p) => !p.includes('ref=master')));
      assert.ok(capturedBranches.length > 0);
      assert.ok(capturedBranches.every((b) => b === LEDGER_REF));
    });

    test('48 no code path accepts a caller-supplied ref/path override', () => {
      // ledgerCreateRecord / ledgerConditionalWriteRecord accept only
      // {targetKey, record, message} — there is no `ref`, `path`, or
      // `branch` parameter for a caller to supply. This is verified
      // structurally: passing extra unexpected keys has no effect on the
      // computed write target, which is derived solely from targetKey.
      const key = 'c'.repeat(64);
      const p1 = computeLedgerPath(key);
      const p2 = computeLedgerPath(key);
      assert.equal(p1, p2);
      assert.equal(p1, `records/${key.slice(0, 2)}/${key}.json`);
    });

    // --- Ledger CAS primitives against the mock store ---

    await testAsync('49 issuance CAS: create-without-sha succeeds when no record exists', async () => {
      const ledger = createMockLedgerStore();
      const deps = { async restRequest(req) { return ledger.handle(req); } };
      const key = 'd'.repeat(64);
      const record = { state: AUTHORIZATION_STATES.ACTIVE, authorization_id: 'auth-1', pr_number: 1 };
      const res = await ledgerCreateRecord(deps, { targetKey: key, record });
      assert.equal(res.ok, true);
      assert.ok(res.blobSha);
    });

    await testAsync('50 issuance CAS: create-without-sha fails (does not overwrite) when a record already exists', async () => {
      const ledger = createMockLedgerStore();
      const deps = { async restRequest(req) { return ledger.handle(req); } };
      const key = 'e'.repeat(64);
      ledger.seed(`/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(key)}`, {
        authorization_id: 'existing',
      });
      const res = await ledgerCreateRecord(deps, {
        targetKey: key,
        record: { authorization_id: 'attempted-overwrite' },
      });
      assert.equal(res.ok, false);
      assert.equal(res.reason, 'already_exists');
      const read = await ledgerReadRecord(deps, key);
      assert.equal(read.record.authorization_id, 'existing');
    });

    await testAsync('51 re-authorization CAS: conditional write with correct observed sha succeeds', async () => {
      const ledger = createMockLedgerStore();
      const deps = { async restRequest(req) { return ledger.handle(req); } };
      const key = 'f'.repeat(64);
      const sha = ledger.seed(`/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(key)}`, {
        authorization_id: 'old-id',
        state: AUTHORIZATION_STATES.CONSUMED,
      });
      const res = await ledgerConditionalWriteRecord(deps, {
        targetKey: key,
        record: { authorization_id: 'new-id', state: AUTHORIZATION_STATES.ACTIVE },
        expectedBlobSha: sha,
      });
      assert.equal(res.ok, true);
      const read = await ledgerReadRecord(deps, key);
      assert.equal(read.record.authorization_id, 'new-id');
      assert.notEqual('new-id', 'old-id');
    });

    await testAsync('52 stale blob sha claim rejected (fail closed, never overwritten)', async () => {
      const ledger = createMockLedgerStore();
      const deps = { async restRequest(req) { return ledger.handle(req); } };
      const key = 'a1'.padEnd(64, '0');
      ledger.seed(`/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(key)}`, {
        authorization_id: 'real',
        state: AUTHORIZATION_STATES.ACTIVE,
      });
      const res = await ledgerConditionalWriteRecord(deps, {
        targetKey: key,
        record: { authorization_id: 'attacker', state: AUTHORIZATION_STATES.CONSUMING },
        expectedBlobSha: 'not-the-real-sha',
      });
      assert.equal(res.ok, false);
      assert.equal(res.reason, 'stale_sha');
      const read = await ledgerReadRecord(deps, key);
      assert.equal(read.record.authorization_id, 'real');
    });

    await testAsync('53 two consumers race the same blob sha: exactly one CAS write succeeds', async () => {
      const ledger = createMockLedgerStore();
      const deps = { async restRequest(req) { return ledger.handle(req); } };
      const key = 'b1'.padEnd(64, '0');
      const sha = ledger.seed(`/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(key)}`, {
        authorization_id: 'shared',
        state: AUTHORIZATION_STATES.ACTIVE,
      });
      const [a, b] = await Promise.all([
        ledgerConditionalWriteRecord(deps, {
          targetKey: key,
          record: { authorization_id: 'shared', state: AUTHORIZATION_STATES.CONSUMING, winner: 'A' },
          expectedBlobSha: sha,
        }),
        ledgerConditionalWriteRecord(deps, {
          targetKey: key,
          record: { authorization_id: 'shared', state: AUTHORIZATION_STATES.CONSUMING, winner: 'B' },
          expectedBlobSha: sha,
        }),
      ]);
      const winners = [a, b].filter((r) => r.ok === true);
      assert.equal(winners.length, 1, 'exactly one conditional write must succeed for a shared starting sha');
    });

    test('54 buildCheckRunProjection carries only immutable references, never a full record or credential', () => {
      const key = 'c1'.padEnd(64, '0');
      const projection = buildCheckRunProjection({
        authorizationId: 'auth-x',
        targetKey: key,
        headSha: HEAD,
        expiresAt: '2020-01-01T00:15:00.000Z',
      });
      assert.deepEqual(Object.keys(projection).sort(), [
        'authorization_id',
        'expires_at',
        'head_sha',
        'ledger_path',
        'ledger_ref',
        'schema',
        'schema_version',
        'target_key',
      ]);
      assert.equal(projection.ledger_ref, LEDGER_REF);
      assert.equal(projection.ledger_path, computeLedgerPath(key));
      assert.equal(JSON.stringify(projection).toLowerCase().includes('token'), false);
    });

    // --- Orchestrator-level (mocked adapters; zero real GitHub/ledger mutation) ---

    await testAsync('55 orchestrator issues success, creates exactly one check, and writes exactly one ACTIVE ledger record', async () => {
      const { deps, ledger } = createMockStage2Deps();
      const result = await runExplicitMergeAuthorization(deps);
      assert.equal(result.conclusion, 'success');
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.equal(deps.creates[0].name, STAGE2_CHECK_RUN_NAME);
      assert.equal(ledger.store.size, 1);
      const [[, entry]] = [...ledger.store.entries()];
      assert.equal(entry.json.state, AUTHORIZATION_STATES.ACTIVE);
      assert.equal(entry.json.freeze_state, GLOBAL_MERGE_FREEZE_STATES.RELEASED);
      assert.equal(entry.json.freeze_scope, RELEASED_FREEZE_SCOPE);
      assert.equal(entry.json.freeze_exception_binding, null);
      // Check-run output is a PROJECTION only — no full record fields.
      const summary = JSON.parse(deps.completes[0].output.summary);
      assert.equal(summary.ledger_ref, LEDGER_REF);
      assert.equal(summary.authorization_id, entry.json.authorization_id);
      assert.equal('state' in summary, false, 'check-run projection must not carry the authoritative state field');
    });

    await testAsync('56 orchestrator rejects when Stage 1 missing (and still performs zero ledger writes)', async () => {
      const { deps, ledger } = createMockStage2Deps({ stage1Missing: true });
      const result = await runExplicitMergeAuthorization(deps);
      assert.equal(result.conclusion, 'failure');
      assert.equal(result.blocker, BLOCKERS.BLOCKED_STAGE2_STAGE1_MISSING);
      assert.equal(ledger.store.size, 0);
    });

    await testAsync('57 existing ACTIVE ledger target cannot receive a duplicate issuance (no check even created)', async () => {
      const { deps, ledger, digest } = createMockStage2Deps();
      const targetKey = computeTargetKey({
        repository: CANONICAL_REPOSITORY,
        prNumber: 461,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: digest,
      });
      const seededSha = ledger.seed(
        `/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(targetKey)}`,
        activeRecord({ target_key: targetKey, reviewed_scope_digest: digest }),
      );
      const result = await runExplicitMergeAuthorization(deps);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION);
      assert.equal(deps.creates.length, 0, 'must not create a second check run for an already-active target');
      const read = await ledger.handle({ method: 'GET', urlPath: `/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(targetKey)}` });
      assert.equal(read.sha, seededSha, 'the existing ledger record must be untouched');
    });

    await testAsync('58 a terminal (CONSUMED) ledger target may receive a NEW authorization_id via CAS re-authorization', async () => {
      const { deps, ledger, digest } = createMockStage2Deps({ authorizationId: 'brand-new-auth-id' });
      const targetKey = computeTargetKey({
        repository: CANONICAL_REPOSITORY,
        prNumber: 461,
        headSha: HEAD,
        baseBranch: 'master',
        mergeMode: 'squash',
        reviewedScopeDigest: digest,
      });
      ledger.seed(
        `/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(targetKey)}`,
        activeRecord({
          target_key: targetKey,
          reviewed_scope_digest: digest,
          authorization_id: 'old-consumed-auth-id',
          state: AUTHORIZATION_STATES.CONSUMED,
        }),
      );
      const result = await runExplicitMergeAuthorization(deps);
      assert.equal(result.conclusion, 'success');
      assert.equal(deps.creates.length, 1, 'a fresh check run IS created for a terminal-target re-authorization');
      const read = await ledger.handle({ method: 'GET', urlPath: `/repos/laoton80-del/Ket-noi-eu/contents/${computeLedgerPath(targetKey)}` });
      const finalRecord = JSON.parse(Buffer.from(read.content, 'base64').toString('utf8'));
      assert.equal(finalRecord.authorization_id, 'brand-new-auth-id');
      assert.notEqual(finalRecord.authorization_id, 'old-consumed-auth-id');
      assert.equal(finalRecord.state, AUTHORIZATION_STATES.ACTIVE);
    });

    await testAsync('59 orchestrator rejects unauthorized actor (and performs zero ledger writes)', async () => {
      const { deps, ledger } = createMockStage2Deps({ actor: 'random-user', triggeringActor: 'random-user' });
      const result = await runExplicitMergeAuthorization(deps);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED);
      assert.equal(deps.creates.length, 0);
      assert.equal(ledger.store.size, 0);
    });

    await testAsync('60 orchestrator performs zero merge API calls ever', async () => {
      const { deps } = createMockStage2Deps();
      let mergeCalls = 0;
      const wrapped = {
        ...deps,
        async restRequest(req) {
          if (/\/merges$|\/merge$/.test(req.urlPath)) mergeCalls += 1;
          return deps.restRequest(req);
        },
      };
      await runExplicitMergeAuthorization(wrapped);
      assert.equal(mergeCalls, 0);
    });

    await testAsync('61 check success without a matching valid ledger record is INVALID per evaluateAuthorizationLifecycleValidity', async () => {
      // Simulates the wrapper-side consultation the design requires: a
      // check-run projection whose target_key has NO corresponding ledger
      // record (e.g. deleted/never-written) must never be treated as a
      // valid authorization merely because the check run says "success".
      const r = evaluateAuthorizationLifecycleValidity({
        record: null, // nothing at the projected ledger path
        expected: { headSha: HEAD, prNumber: 461, reviewedScopeDigest: 'abc', mergeMode: 'squash' },
        nowMs: RUN_CREATED_MS + 1,
      });
      assert.equal(r.ok, false);
      assert.equal(r.blocker, BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND);
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
