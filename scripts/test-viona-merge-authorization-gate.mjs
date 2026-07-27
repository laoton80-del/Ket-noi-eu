/**
 * Offline deterministic tests — Viona Merge Authorization Gate (remediated)
 * Network: global fetch trap. Tokens unused. Real check runs: 0.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  GATE_CHECK_RUN_NAME,
  WORKFLOW_FILE_PATH,
  CANONICAL_REPOSITORY,
  CANONICAL_FREEZE_SCOPE,
  BLOCKERS,
  computeReviewedScopeDigest,
  evaluateMergeAuthorizationGate,
  parseStructuredInputs,
  runMergeAuthorizationGate,
  proveCanonicalWorkflowVersion,
  selectExactHeadApproval,
  assertPermissionScope,
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
} from './viona-merge-authorization-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
const RUN_CREATED = '2020-01-01T00:00:10.000Z';
const APPROVAL_BEFORE = '2020-01-01T00:00:05.000Z';
const APPROVAL_AFTER = '2020-01-01T00:00:20.000Z';

function happyFacts(over = {}) {
  return {
    provenanceMechanism: 'VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD',
    freeTextAuthorizationPresent: false,
    callerAuthorizedOperatorPresent: false,
    eventName: 'workflow_dispatch',
    runAttempt: 1,
    repository: CANONICAL_REPOSITORY,
    actor: 'laoton80-del',
    triggeringActor: 'laoton80-del',
    workflowPath: WORKFLOW_FILE_PATH,
    canonicalWorkflowVersionProven: true,
    workflowRunId: '999',
    structuredInputsComplete: true,
    permissionScopeOk: true,
    checkRunName: GATE_CHECK_RUN_NAME,
    duplicateGateResult: false,
    prNumber: 100,
    actualPrNumber: 100,
    prNumberMalformed: false,
    headSha: HEAD,
    headShaMalformed: false,
    prMissing: false,
    prState: 'OPEN',
    baseBranch: 'master',
    actualBaseBranch: 'master',
    actualHeadSha: HEAD,
    mergeMode: 'squash',
    authority: 'MERGE',
    freezeScope: CANONICAL_FREEZE_SCOPE,
    headActivationProven: true,
    authorizationPredatesCurrentHead: false,
    autoMergeActive: false,
    repositoryEnforcementActive: true,
    computedReviewedScopeDigest: 'abc',
    suppliedReviewedScopeDigest: 'abc',
    reviewSatisfied: true,
    unresolvedConversation: false,
    requiredCheckFailed: false,
    staleRequiredCheckFromOtherSha: false,
    finalHeadMismatch: false,
    gateAppIdentityResolved: true,
    gateAppId: 42,
    allConditionsExplicitlyGreen: true,
    technicalError: false,
    ...over,
  };
}

function createMockGateDeps(options = {}) {
  const creates = [];
  const completes = [];
  const mergeCalls = [];
  const files = options.files ?? [{ status: 'modified', filename: 'a.txt' }];
  const digest = computeReviewedScopeDigest(files);
  const pr = options.pr ?? {
    number: 100,
    state: 'open',
    base: { ref: 'master' },
    head: { sha: HEAD },
    auto_merge: null,
  };
  const reviews = options.reviews ?? [
    {
      state: 'APPROVED',
      commit_id: HEAD,
      submitted_at: APPROVAL_BEFORE,
    },
  ];
  let checkListPages = options.checkListPages;
  let filePages = options.filePages;
  let threadPages = options.threadPages;

  const deps = {
    env: {
      VIONA_GATE_PR_NUMBER: '100',
      VIONA_GATE_HEAD_SHA: HEAD,
      VIONA_GATE_BASE_BRANCH: 'master',
      VIONA_GATE_MERGE_MODE: 'squash',
      VIONA_GATE_AUTHORITY: 'MERGE',
      VIONA_GATE_FREEZE_SCOPE: CANONICAL_FREEZE_SCOPE,
      VIONA_GATE_REVIEWED_SCOPE_DIGEST: digest,
      VIONA_GATE_RUN_ID: '999',
      VIONA_GATE_REPOSITORY: CANONICAL_REPOSITORY,
      ...options.env,
    },
    workflowPermissionLines: [
      'contents: read',
      'pull-requests: read',
      'checks: write',
    ],
    creates,
    completes,
    mergeCalls,
    extraCheckRunsBeforeCreate: options.extraCheckRunsBeforeCreate ?? [],
    extraCheckRunsAfterCreate: options.extraCheckRunsAfterCreate ?? [],
    injectDuplicateAfterCreate: options.injectDuplicateAfterCreate === true,
    forceTechnicalErrorAfterCreate: options.forceTechnicalErrorAfterCreate === true,
    forceTechnicalErrorBeforeCreate: options.forceTechnicalErrorBeforeCreate === true,
    forceFacts: options.forceFacts,
    log: () => {},
    async restRequest({ method, urlPath }) {
      if (/\/merges$|\/merge$/.test(urlPath)) mergeCalls.push({ method, urlPath });
      if (options.forceTechnicalErrorBeforeCreate && urlPath.includes('/actions/runs/')) {
        const err = new Error('boom');
        err.sanitized = { message: 'boom' };
        throw err;
      }
      if (urlPath === `/repos/laoton80-del/Ket-noi-eu`) {
        return { default_branch: options.defaultBranch ?? 'master' };
      }
      if (urlPath.includes('/git/ref/heads/')) {
        return { object: { sha: options.masterSha ?? MASTER } };
      }
      if (urlPath.includes('/actions/runs/')) {
        if (options.runMissing) return { message: 'Not Found' };
        return {
          id: 999,
          event: options.runEvent ?? 'workflow_dispatch',
          run_attempt: options.runAttempt ?? 1,
          head_branch: options.runHeadBranch ?? 'master',
          head_sha: options.runHeadSha ?? MASTER,
          path: options.runPath ?? WORKFLOW_FILE_PATH,
          workflow_id: options.workflowId ?? 7,
          created_at: options.runCreatedAt ?? RUN_CREATED,
          actor: { login: options.actor ?? 'laoton80-del' },
          triggering_actor: { login: options.triggeringActor ?? options.actor ?? 'laoton80-del' },
        };
      }
      if (urlPath.includes('/actions/workflows/')) {
        if (options.workflowMissing) return { message: 'Not Found' };
        return {
          id: options.workflowId ?? 7,
          path: options.workflowMetaPath ?? WORKFLOW_FILE_PATH,
          state: options.workflowState ?? 'active',
        };
      }
      if (urlPath.includes('/contents/')) {
        if (options.contentError) {
          const err = new Error('content');
          err.sanitized = { message: 'content' };
          throw err;
        }
        const isRun = urlPath.includes(`ref=${options.runHeadSha ?? MASTER}`);
        const sha = isRun
          ? options.runBlobSha ?? BLOB
          : options.masterBlobSha ?? BLOB;
        if (options.blobMismatch && !isRun) {
          return { sha: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', path: WORKFLOW_FILE_PATH, type: 'file' };
        }
        return { sha, path: WORKFLOW_FILE_PATH, type: 'file' };
      }
      if (/\/pulls\/\d+$/.test(urlPath) && method === 'GET') {
        if (options.prMissing) {
          const err = new Error('missing');
          throw err;
        }
        if (options.prSnapshotB && deps._prGets >= 1) {
          deps._prGets += 1;
          return options.prSnapshotB;
        }
        deps._prGets = (deps._prGets ?? 0) + 1;
        return pr;
      }
      if (urlPath.includes('/files')) {
        if (filePages) {
          const page = Number(new URL('https://x' + urlPath).searchParams.get('page') || '1');
          return filePages[page - 1] ?? [];
        }
        return files;
      }
      if (urlPath.includes('/reviews')) {
        return reviews;
      }
      if (urlPath.includes('/check-runs') && method === 'GET') {
        if (checkListPages) {
          const page = Number(new URL('https://x' + urlPath).searchParams.get('page') || '1');
          return { check_runs: checkListPages[page - 1] ?? [] };
        }
        return {
          check_runs: options.checkRuns ?? [
            {
              name: 'Viona Emergency Merge Lock',
              head_sha: HEAD,
              conclusion: 'success',
              status: 'completed',
            },
          ],
        };
      }
      if (urlPath.includes('/branches/master/protection')) {
        return {
          enforce_admins: { enabled: true },
          required_status_checks: {
            contexts: options.requiredContexts ?? ['Viona Emergency Merge Lock'],
          },
        };
      }
      return {};
    },
    async graphqlRequest() {
      if (threadPages) {
        const page = deps._threadPage ?? 0;
        deps._threadPage = page + 1;
        const nodes = threadPages[page] ?? [];
        const hasNext = page + 1 < threadPages.length;
        return {
          data: {
            repository: {
              pullRequest: {
                reviewThreads: {
                  pageInfo: { hasNextPage: hasNext, endCursor: hasNext ? `c${page}` : null },
                  nodes,
                },
              },
            },
          },
        };
      }
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
      return { id: 777, app: { id: options.appId ?? 42 }, ...payload };
    },
    async completeCheckRun(payload) {
      completes.push(payload);
      return payload;
    },
  };
  return deps;
}

async function main() {
  try {
    test('1 valid evaluate success', () => {
      const r = evaluateMergeAuthorizationGate(happyFacts());
      assert.equal(r.conclusion, 'success');
    });

    test('2 wrong repository', () => {
      assert.notEqual(
        evaluateMergeAuthorizationGate(happyFacts({ repository: 'x/y' })).conclusion,
        'success',
      );
    });

    test('3 non-workflow_dispatch', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ eventName: 'push' })).blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED,
      );
    });

    test('4 unauthorized actor', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ actor: 'x', triggeringActor: 'x' }),
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED,
      );
    });

    test('5 triggering actor mismatch', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ triggeringActor: 'other' }),
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED,
      );
    });

    test('6 run_attempt > 1', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ runAttempt: 2 })).blocker,
        BLOCKERS.BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED,
      );
    });

    test('7 non-canonical workflow path', () => {
      assert.notEqual(
        evaluateMergeAuthorizationGate(happyFacts({ workflowPath: 'x.yml' })).conclusion,
        'success',
      );
    });

    test('8 canonical workflow unproven', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ canonicalWorkflowVersionProven: false }),
        ).blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN,
      );
    });

    test('9 missing structured input', () => {
      assert.notEqual(
        evaluateMergeAuthorizationGate(happyFacts({ structuredInputsComplete: false }))
          .conclusion,
        'success',
      );
    });

    test('10 malformed PR number', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ prNumberMalformed: true })).blocker,
        BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH,
      );
    });

    test('11 non-40 head', () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ headSha: 'x', headShaMalformed: true }),
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH,
      );
    });

    test('12-26 classic binding blockers', () => {
      const cases = [
        { prMissing: true },
        { prState: 'CLOSED' },
        { actualPrNumber: 9 },
        { actualBaseBranch: 'dev' },
        { actualHeadSha: HEAD2 },
        { mergeMode: 'merge' },
        { authority: 'NO' },
        { freezeScope: 'NO' },
        { headActivationProven: false },
        { authorizationPredatesCurrentHead: true },
        { autoMergeActive: true },
        { computedReviewedScopeDigest: '1', suppliedReviewedScopeDigest: '2' },
        { reviewSatisfied: false },
        { unresolvedConversation: true },
        { requiredCheckFailed: true },
        { staleRequiredCheckFromOtherSha: true },
        { repositoryEnforcementActive: false },
        { duplicateGateResult: true },
        { freeTextAuthorizationPresent: true },
        { technicalError: true },
        { allConditionsExplicitlyGreen: false },
      ];
      for (const over of cases) {
        assert.notEqual(
          evaluateMergeAuthorizationGate(happyFacts(over)).conclusion,
          'success',
          JSON.stringify(over),
        );
      }
    });

    test('27 no default success path', () => {
      const r = evaluateMergeAuthorizationGate(
        happyFacts({ allConditionsExplicitlyGreen: false }),
      );
      assert.notEqual(r.conclusion, 'success');
    });

    test('28 free-text rejected', () => {
      const p = parseStructuredInputs({ VIONA_GATE_AUTHORIZATION: 'APPROVE_X' });
      assert.equal(p.freeTextAuthorizationPresent, true);
    });

    test('29 authorized_operator rejected', () => {
      const p = parseStructuredInputs({ VIONA_GATE_AUTHORIZED_OPERATOR: 'laoton80-del' });
      assert.equal(p.callerAuthorizedOperatorPresent, true);
    });

    test('30 exact-head approval helper', () => {
      const ok = selectExactHeadApproval(
        [{ state: 'APPROVED', commit_id: HEAD, submitted_at: APPROVAL_BEFORE }],
        HEAD,
        Date.parse(RUN_CREATED),
      );
      assert.equal(ok.ok, true);
      const late = selectExactHeadApproval(
        [{ state: 'APPROVED', commit_id: HEAD, submitted_at: APPROVAL_AFTER }],
        HEAD,
        Date.parse(RUN_CREATED),
      );
      assert.equal(late.ok, false);
      const wrong = selectExactHeadApproval(
        [{ state: 'APPROVED', commit_id: HEAD2, submitted_at: APPROVAL_BEFORE }],
        HEAD,
        Date.parse(RUN_CREATED),
      );
      assert.equal(wrong.ok, false);
      const dismissed = selectExactHeadApproval(
        [
          {
            state: 'APPROVED',
            commit_id: HEAD,
            submitted_at: APPROVAL_BEFORE,
            dismissed_at: APPROVAL_BEFORE,
          },
        ],
        HEAD,
        Date.parse(RUN_CREATED),
      );
      assert.equal(dismissed.ok, false);
    });

    test('31 digest algorithm + rename', () => {
      const files = [
        { status: 'renamed', filename: 'c.txt', previous_filename: 'old.txt' },
        { status: 'added', filename: 'a.txt' },
      ];
      const d = computeReviewedScopeDigest(files);
      const material = ['added\ta.txt\t', 'renamed\tc.txt\told.txt'].join('\n');
      assert.equal(d, createHash('sha256').update(material, 'utf8').digest('hex'));
      assert.equal(d, computeReviewedScopeDigest([...files].reverse()));
    });

    test('32 workflow permissions + dispatch-only', () => {
      const yml = readFileSync(path.join(root, WORKFLOW_FILE_PATH), 'utf8');
      assert.match(yml, /checks:\s*write/);
      assert.doesNotMatch(yml, /statuses:\s*write/);
      assert.doesNotMatch(yml, /contents:\s*write/);
      assert.doesNotMatch(yml, /pull-requests:\s*write/);
      assert.match(yml, /workflow_dispatch:/);
      assert.doesNotMatch(yml, /pull_request:/);
      assert.match(yml, /concurrency:/);
      assert.match(
        yml,
        /viona-merge-authorization-gate-\$\{\{\s*github\.repository\s*\}\}-\$\{\{\s*inputs\.pr_number\s*\}\}-\$\{\{\s*inputs\.head_sha\s*\}\}/,
      );
      assert.match(yml, /cancel-in-progress:\s*false/);
      assert.doesNotMatch(yml, /VIONA_GATE_WORKFLOW_SHA/);
      assert.doesNotMatch(yml, /VIONA_GATE_MASTER_WORKFLOW_SHA/);
      assert.equal(
        assertPermissionScope([
          'contents: read',
          'pull-requests: read',
          'checks: write',
        ]).ok,
        true,
      );
    });

    test('33 markers exported', () => {
      assert.equal(
        REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
        'REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY',
      );
      assert.equal(
        GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
        'GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH',
      );
    });

    await testAsync('34 happy orchestrated success', async () => {
      const deps = createMockGateDeps();
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, 'success');
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.creates[0].name, GATE_CHECK_RUN_NAME);
      assert.equal(deps.completes.length, 1);
      assert.equal(deps.mergeCalls.length, 0);
    });

    await testAsync('35 minimum provenance before check — repo mismatch zero checks', async () => {
      const deps = createMockGateDeps({ env: { VIONA_GATE_REPOSITORY: 'other/repo' } });
      const result = await runMergeAuthorizationGate(deps);
      assert.notEqual(result.conclusion, 'success');
      assert.equal(deps.creates.length, 0);
    });

    await testAsync('36 event mismatch zero checks', async () => {
      const deps = createMockGateDeps({ runEvent: 'push' });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.notEqual(result.conclusion, 'success');
    });

    await testAsync('37 rerun zero checks', async () => {
      const deps = createMockGateDeps({ runAttempt: 2 });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED);
    });

    await testAsync('38 unauthorized actor zero checks', async () => {
      const deps = createMockGateDeps({ actor: 'evil', triggeringActor: 'evil' });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED);
    });

    await testAsync('39 triggering actor mismatch zero checks', async () => {
      const deps = createMockGateDeps({ triggeringActor: 'other' });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync('40 canonical workflow failure zero checks', async () => {
      const deps = createMockGateDeps({ runPath: 'other.yml' });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
    });

    await testAsync('41 PR missing zero checks', async () => {
      const deps = createMockGateDeps({ prMissing: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync('42 head mismatch zero checks', async () => {
      const deps = createMockGateDeps({
        pr: {
          number: 100,
          state: 'open',
          base: { ref: 'master' },
          head: { sha: HEAD2 },
          auto_merge: null,
        },
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH);
    });

    await testAsync('43 duplicate existing gate zero checks', async () => {
      const deps = createMockGateDeps({
        extraCheckRunsBeforeCreate: [
          { name: GATE_CHECK_RUN_NAME, id: 1, head_sha: HEAD, conclusion: 'success' },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS);
    });

    await testAsync('44 run on non-default branch', async () => {
      const deps = createMockGateDeps({ runHeadBranch: 'feature' });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
    });

    await testAsync('45 run SHA differs from current master', async () => {
      const deps = createMockGateDeps({ runHeadSha: HEAD2 });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
    });

    await testAsync('46 workflow blob mismatch', async () => {
      const deps = createMockGateDeps({ blobMismatch: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
    });

    await testAsync('47 wrong workflow id/path metadata', async () => {
      const deps = createMockGateDeps({ workflowMetaPath: 'nope.yml' });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync('48 proveCanonicalWorkflowVersion happy', async () => {
      const deps = createMockGateDeps();
      const proven = await proveCanonicalWorkflowVersion(deps, {
        owner: 'laoton80-del',
        repo: 'Ket-noi-eu',
        runId: '999',
      });
      assert.equal(proven.ok, true);
    });

    await testAsync('49 approval after dispatch rejected', async () => {
      const deps = createMockGateDeps({
        reviews: [
          { state: 'APPROVED', commit_id: HEAD, submitted_at: APPROVAL_AFTER },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD);
    });

    await testAsync('50 approval for another commit rejected', async () => {
      const deps = createMockGateDeps({
        reviews: [
          { state: 'APPROVED', commit_id: HEAD2, submitted_at: APPROVAL_BEFORE },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync('51 head changes between snapshot A and B', async () => {
      const deps = createMockGateDeps({
        prSnapshotB: {
          number: 100,
          state: 'open',
          base: { ref: 'master' },
          head: { sha: HEAD2 },
          auto_merge: null,
        },
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.notEqual(result.conclusion, 'success');
    });

    await testAsync('52 duplicate in-progress same head', async () => {
      const deps = createMockGateDeps({
        extraCheckRunsBeforeCreate: [
          { name: GATE_CHECK_RUN_NAME, id: 9, status: 'in_progress', head_sha: HEAD },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS);
    });

    await testAsync('53 concurrent duplicate after create', async () => {
      const deps = createMockGateDeps({ injectDuplicateAfterCreate: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS);
    });

    await testAsync('54 conflicting app after create', async () => {
      const deps = createMockGateDeps({
        extraCheckRunsAfterCreate: [
          { id: 777, name: GATE_CHECK_RUN_NAME, head_sha: HEAD, app: { id: 99 } },
          { id: 778, name: GATE_CHECK_RUN_NAME, head_sha: HEAD, app: { id: 42 } },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS);
    });

    await testAsync('55 stale other-SHA ignored not reused', async () => {
      const deps = createMockGateDeps({
        checkRuns: [
          {
            name: 'Viona Emergency Merge Lock',
            head_sha: HEAD,
            conclusion: 'success',
          },
          {
            name: GATE_CHECK_RUN_NAME,
            head_sha: HEAD2,
            conclusion: 'success',
            id: 55,
          },
        ],
      });
      // other-SHA gate is on different head listing — listAllCheckRuns uses current HEAD only
      // so other-SHA won't appear; ensure success still requires no same-head duplicate
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, 'success');
      assert.equal(deps.creates.length, 1);
    });

    await testAsync('56 unknown error before check creation', async () => {
      const deps = createMockGateDeps({ forceTechnicalErrorBeforeCreate: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
    });

    await testAsync('57 unknown error after check creation completes failure', async () => {
      const deps = createMockGateDeps({ forceTechnicalErrorAfterCreate: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.equal(deps.completes[0].conclusion, 'failure');
      assert.equal(result.blocker, BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR);
    });

    await testAsync('58 PR-file REST pagination + renamed digest', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        status: 'modified',
        filename: `f${String(i).padStart(3, '0')}.txt`,
      }));
      const page2 = [
        { status: 'renamed', filename: 'zzz.txt', previous_filename: 'old-zzz.txt' },
      ];
      const deps = createMockGateDeps({
        filePages: [page1, page2],
        files: [...page1, ...page2],
      });
      // digest in env must match recomputed from all pages
      deps.env.VIONA_GATE_REVIEWED_SCOPE_DIGEST = computeReviewedScopeDigest([
        ...page1,
        ...page2,
      ]);
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, 'success');
    });

    await testAsync('59 conversation GraphQL pagination', async () => {
      const page1 = Array.from({ length: 100 }, () => ({ isResolved: true }));
      const page2 = [{ isResolved: true }];
      const deps = createMockGateDeps({ threadPages: [page1, page2] });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, 'success');
    });

    await testAsync('60 check-run pagination', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        name: `other-${i}`,
        head_sha: HEAD,
        conclusion: 'success',
      }));
      const page2 = [
        {
          name: 'Viona Emergency Merge Lock',
          head_sha: HEAD,
          conclusion: 'success',
        },
      ];
      const deps = createMockGateDeps({ checkListPages: [page1, page2] });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, 'success');
    });

    await testAsync('61 zero merge endpoint calls', async () => {
      const deps = createMockGateDeps();
      await runMergeAuthorizationGate(deps);
      assert.equal(deps.mergeCalls.length, 0);
    });

    test('62 no pr.updated_at in gate source', () => {
      const src = readFileSync(
        path.join(root, 'scripts/viona-merge-authorization-gate.mjs'),
        'utf8',
      );
      assert.doesNotMatch(src, /pr\.updated_at/);
      assert.doesNotMatch(src, /updated_at \?\?/);
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
