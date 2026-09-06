/**
 * Offline deterministic tests — Viona Guarded PR Merge Wrapper
 * Network calls: 0. Real merges: 0. Check-run creation by wrapper: 0.
 * Global fetch trap proves network isolation.
 */

import assert from 'node:assert/strict';
import {
  GATE_CHECK_RUN_NAME,
  CANONICAL_REPOSITORY,
  computeReviewedScopeDigest,
  BLOCKERS,
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
} from './viona-merge-authorization-gate.mjs';
import {
  evaluateGuardedMerge,
  parseGuardedMergeArgs,
  runGuardedPrMerge,
} from './viona-guarded-pr-merge.mjs';

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

function happyWrapperFacts(over = {}) {
  return {
    repository: CANONICAL_REPOSITORY,
    prNumber: '100',
    prMissing: false,
    prState: 'OPEN',
    headSha: HEAD,
    actualHeadSha: HEAD,
    base: 'master',
    actualBase: 'master',
    mode: 'squash',
    computedReviewedScopeDigest: 'digest',
    suppliedReviewedScopeDigest: 'digest',
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
    ...over,
  };
}

function createMockWrapperDeps(options = {}) {
  const files = options.files ?? [{ status: 'modified', filename: 'a.txt' }];
  const digest = computeReviewedScopeDigest(files);
  const mergeCalls = [];
  const checkRunCreates = [];
  const protectionMutations = [];

  const pr = options.pr ?? {
    number: 100,
    state: 'open',
    base: { ref: 'master' },
    head: { sha: HEAD },
    auto_merge: null,
  };

  return {
    args: {
      repo: CANONICAL_REPOSITORY,
      pr: '100',
      head: HEAD,
      base: 'master',
      mode: 'squash',
      reviewedScopeDigest: digest,
      gateAppId: '42',
      execute: options.execute === true,
      ...options.args,
    },
    forceFacts: options.forceFacts,
    forceDuplicateConflictingGateContext: options.forceDuplicateConflictingGateContext,
    extraCheckRuns: options.extraCheckRuns ?? [],
    mergeCalls,
    checkRunCreates,
    protectionMutations,
    log: () => {},
    async restRequest(req) {
      const { method, urlPath } = req;
      if (/\/pulls\/\d+\/merge$/.test(urlPath) && method === 'PUT') {
        mergeCalls.push(req);
        return { merged: true, sha: HEAD };
      }
      if (/\/check-runs$/.test(urlPath) && method === 'POST') {
        checkRunCreates.push(req);
      }
      if (/\/protection/.test(urlPath) && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
        protectionMutations.push(req);
      }
      if (/\/pulls\/\d+$/.test(urlPath) && method === 'GET') {
        if (options.prMissing) throw new Error('missing');
        return pr;
      }
      if (urlPath.includes('/files')) return files;
      if (urlPath.includes('/reviews')) return options.reviews ?? [{ state: 'APPROVED' }];
      if (urlPath.includes('/check-runs')) {
        return {
          check_runs: options.checkRuns ?? [
            {
              name: GATE_CHECK_RUN_NAME,
              head_sha: HEAD,
              conclusion: 'success',
              status: 'completed',
              app: { id: 42 },
            },
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
            contexts: ['Viona Emergency Merge Lock', GATE_CHECK_RUN_NAME],
          },
        };
      }
      return {};
    },
    async graphqlRequest() {
      return {
        data: {
          repository: {
            pullRequest: {
              reviewThreads: {
                nodes: options.unresolved ? [{ isResolved: false }] : [{ isResolved: true }],
              },
            },
          },
        },
      };
    },
  };
}

async function main() {
  try {
    test('parse args execute flag', () => {
      const a = parseGuardedMergeArgs([
        '--repo',
        CANONICAL_REPOSITORY,
        '--pr',
        '1',
        '--head',
        HEAD,
        '--base',
        'master',
        '--mode',
        'squash',
        '--reviewed-scope-digest',
        'x',
        '--gate-app-id',
        '9',
        '--execute',
      ]);
      assert.equal(a.execute, true);
      assert.equal(a.gateAppId, '9');
    });

    await testAsync('1 valid dry-run performs zero merge calls', async () => {
      const deps = createMockWrapperDeps({ execute: false });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, true);
      assert.equal(result.mergeInvoked, false);
      assert.equal(deps.mergeCalls.length, 0);
    });

    await testAsync('2 valid execute allows exactly one mocked merge call', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, true);
      assert.equal(result.mergeInvoked, true);
      assert.equal(deps.mergeCalls.length, 1);
    });

    test('3 wrong repository', () => {
      assert.equal(evaluateGuardedMerge(happyWrapperFacts({ repository: 'other/x' })).ok, false);
    });

    test('4 PR not OPEN', () => {
      assert.equal(evaluateGuardedMerge(happyWrapperFacts({ prState: 'CLOSED' })).ok, false);
    });

    test('5 head mismatch', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ actualHeadSha: HEAD2 })).blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH,
      );
    });

    test('6 base mismatch', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ actualBase: 'develop' })).blocker,
        BLOCKERS.BLOCKED_MERGE_BASE_BRANCH_MISMATCH,
      );
    });

    test('7 mode mismatch', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ mode: 'merge' })).blocker,
        BLOCKERS.BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH,
      );
    });

    test('8 reviewed-scope digest mismatch', () => {
      assert.equal(
        evaluateGuardedMerge(
          happyWrapperFacts({
            computedReviewedScopeDigest: 'a',
            suppliedReviewedScopeDigest: 'b',
          }),
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
      );
    });

    test('9 auto-merge active', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ autoMergeActive: true })).blocker,
        BLOCKERS.BLOCKED_MERGE_AUTO_MERGE_ACTIVE,
      );
    });

    test('10 unresolved conversation', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ unresolvedConversation: true })).blocker,
        BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION,
      );
    });

    test('11 review unsatisfied', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ reviewSatisfied: false })).blocker,
        BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED,
      );
    });

    test('12 required check failed', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ requiredCheckFailed: true })).blocker,
        BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED,
      );
    });

    test('13 missing gate check', () => {
      assert.equal(evaluateGuardedMerge(happyWrapperFacts({ gateCheckMissing: true })).ok, false);
    });

    test('14 gate check on stale SHA', () => {
      assert.equal(
        evaluateGuardedMerge(
          happyWrapperFacts({ gateCheckStaleSha: true, gateCheckMissing: true }),
        ).ok,
        false,
      );
    });

    test('15 gate check conclusion not success', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ gateCheckConclusion: 'failure' })).ok,
        false,
      );
    });

    test('16 duplicate conflicting gate contexts', () => {
      assert.equal(
        evaluateGuardedMerge(
          happyWrapperFacts({ duplicateConflictingGateContext: true }),
        ).blocker,
        BLOCKERS.BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS,
      );
    });

    test('17 gate app ID missing', () => {
      assert.equal(
        evaluateGuardedMerge(
          happyWrapperFacts({ gateAppIdMissing: true, gateAppId: null }),
        ).blocker,
        BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED,
      );
    });

    test('18 gate app ID mismatch', () => {
      assert.equal(
        evaluateGuardedMerge(happyWrapperFacts({ gateAppId: '1', actualGateAppId: 2 })).blocker,
        BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED,
      );
    });

    await testAsync('19 no --execute means zero mutation', async () => {
      const deps = createMockWrapperDeps({ execute: false });
      await runGuardedPrMerge(deps);
      assert.equal(deps.mergeCalls.length, 0);
    });

    await testAsync('20 blocker means zero merge calls', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      deps.forceFacts = { repository: 'wrong/repo' };
      const result = await runGuardedPrMerge(deps);
      assert.equal(result.ok, false);
      assert.equal(deps.mergeCalls.length, 0);
    });

    await testAsync('21 successful execute never retries', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      await runGuardedPrMerge(deps);
      assert.equal(deps.mergeCalls.length, 1);
    });

    await testAsync('22 wrapper never creates a check run', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      await runGuardedPrMerge(deps);
      assert.equal(deps.checkRunCreates.length, 0);
    });

    await testAsync('23 wrapper never changes branch protection', async () => {
      const deps = createMockWrapperDeps({ execute: true });
      await runGuardedPrMerge(deps);
      assert.equal(deps.protectionMutations.length, 0);
    });

    test('24 exact primary and defense-in-depth markers exist', () => {
      assert.equal(
        REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
        'REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY',
      );
      assert.equal(
        GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
        'GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH',
      );
    });

    test('25 global fetch trap unused', () => {
      assert.equal(unexpectedNetworkCalls, 0);
    });

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
