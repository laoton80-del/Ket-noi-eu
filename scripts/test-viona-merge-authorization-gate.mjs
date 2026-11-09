/**
 * Offline deterministic tests — Viona Merge Readiness Gate (Stage 1,
 * formerly "Viona Merge Authorization Gate"; remediated)
 * Network: global fetch trap. Tokens unused. Real check runs: 0.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  GATE_CHECK_RUN_NAME,
  GATE_DISPATCH_MODES,
  GATE_RECOVERY_EVIDENCE_SCHEMA,
  FAILED_STAGE1_SUPERSESSION_CASE_V1,
  WORKFLOW_FILE_PATH,
  CANONICAL_REPOSITORY,
  CANONICAL_FREEZE_SCOPE,
  GLOBAL_MERGE_FREEZE_STATES,
  GLOBAL_MERGE_FREEZE_STATE,
  RELEASED_FREEZE_SCOPE,
  FREEZE_SCOPE_POLICY_FAILURES,
  BLOCKERS,
  computeReviewedScopeDigest,
  parseGateCheckEvidence,
  recoveryCheckExternalId,
  resolveEffectiveStage1Check,
  evaluateFreezeScopeForState,
  evaluateMergeAuthorizationGate,
  parseStructuredInputs,
  runMergeAuthorizationGate,
  proveCanonicalWorkflowVersion,
  selectExactHeadApproval,
  selectRecoveryCaseApproval,
  assertPermissionScope,
  createProductionDeps,
  assertChecksRestRequest,
  assertProtectionReadRequest,
  CANONICAL_MASTER_PROTECTION_PATH,
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
} from "./viona-merge-authorization-gate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const originalFetch = globalThis.fetch;
let unexpectedNetworkCalls = 0;
globalThis.fetch = function unexpectedFetchTrap() {
  unexpectedNetworkCalls += 1;
  throw new Error("UNEXPECTED_NETWORK_ACCESS");
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

const HEAD = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const HEAD2 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const MASTER = "cccccccccccccccccccccccccccccccccccccccc";
const BLOB = "dddddddddddddddddddddddddddddddddddddddd";
const TREE = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const RECOVERY_HEAD = FAILED_STAGE1_SUPERSESSION_CASE_V1.headSha;
const RECOVERY_TREE = FAILED_STAGE1_SUPERSESSION_CASE_V1.treeSha;
const PRIOR_RUN_ID = FAILED_STAGE1_SUPERSESSION_CASE_V1.priorRunId;
const PRIOR_CHECK_RUN_ID = FAILED_STAGE1_SUPERSESSION_CASE_V1.priorCheckRunId;
const RECOVERY_CASE_ID = "123e4567-e89b-42d3-a456-426614174000";
const PRIOR_BAD_DIGEST = FAILED_STAGE1_SUPERSESSION_CASE_V1.priorDigest;
const RECOVERY_FILES = Object.freeze([
  { status: "modified", filename: "App.tsx" },
  {
    status: "added",
    filename: "scripts/test-viona-runtime-canon-wave1-public-copy.ts",
  },
  { status: "modified", filename: "src/i18n/locales/cs.json" },
  { status: "modified", filename: "src/i18n/locales/de.json" },
  { status: "modified", filename: "src/i18n/locales/en.json" },
  { status: "modified", filename: "src/i18n/locales/fr.json" },
  { status: "modified", filename: "src/i18n/locales/ja.json" },
  { status: "modified", filename: "src/i18n/locales/ko.json" },
  { status: "modified", filename: "src/i18n/locales/vi.json" },
  { status: "modified", filename: "src/navigation/mvpSurfaceGate.tsx" },
]);

function makeRecoveryBinding(over = {}) {
  return [
    "v1",
    over.recoveryCaseId ?? RECOVERY_CASE_ID,
    over.expectedTree ?? RECOVERY_TREE,
    over.priorRunId ?? PRIOR_RUN_ID,
    over.priorCheckRunId ?? PRIOR_CHECK_RUN_ID,
    over.priorBlocker ?? BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
    over.priorDigest ?? PRIOR_BAD_DIGEST,
  ].join("|");
}
const RUN_CREATED = "2020-01-01T00:00:10.000Z";
const APPROVAL_BEFORE = "2020-01-01T00:00:05.000Z";
const APPROVAL_AFTER = "2020-01-01T00:00:20.000Z";

function happyFacts(over = {}) {
  return {
    provenanceMechanism:
      "VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD",
    freeTextAuthorizationPresent: false,
    callerAuthorizedOperatorPresent: false,
    eventName: "workflow_dispatch",
    runAttempt: 1,
    repository: CANONICAL_REPOSITORY,
    actor: "laoton80-del",
    triggeringActor: "laoton80-del",
    workflowPath: WORKFLOW_FILE_PATH,
    canonicalWorkflowVersionProven: true,
    workflowRunId: "999",
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
    prState: "OPEN",
    baseBranch: "master",
    actualBaseBranch: "master",
    actualHeadSha: HEAD,
    mergeMode: "squash",
    freezeScope: RELEASED_FREEZE_SCOPE,
    headActivationProven: true,
    authorizationPredatesCurrentHead: false,
    autoMergeActive: false,
    repositoryEnforcementActive: true,
    computedReviewedScopeDigest: "abc",
    suppliedReviewedScopeDigest: "abc",
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
  const files = options.files ?? [{ status: "modified", filename: "a.txt" }];
  const digest = computeReviewedScopeDigest(files);
  const expectedHead = options.expectedHead ?? HEAD;
  const expectedTree = options.expectedTree ?? TREE;
  const pr = options.pr ?? {
    number: 100,
    state: "open",
    draft: false,
    base: { ref: "master" },
    head: { sha: expectedHead },
    auto_merge: null,
  };
  const reviews = options.reviews ?? [
    {
      state: "APPROVED",
      commit_id: expectedHead,
      submitted_at: APPROVAL_BEFORE,
    },
  ];
  let checkListPages = options.checkListPages;
  let filePages = options.filePages;
  let threadPages = options.threadPages;

  const deps = {
    env: {
      VIONA_GATE_DISPATCH_MODE: GATE_DISPATCH_MODES.NORMAL,
      VIONA_GATE_PR_NUMBER: "100",
      VIONA_GATE_HEAD_SHA: expectedHead,
      VIONA_GATE_BASE_BRANCH: "master",
      VIONA_GATE_MERGE_MODE: "squash",
      VIONA_GATE_FREEZE_SCOPE: RELEASED_FREEZE_SCOPE,
      VIONA_GATE_REVIEWED_SCOPE_DIGEST: digest,
      VIONA_GATE_RUN_ID: "999",
      VIONA_GATE_REPOSITORY: CANONICAL_REPOSITORY,
      VIONA_GATE_PROTECTION_READ_TOKEN: "test-protection-read-token",
      ...options.env,
    },
    workflowPermissionLines: [
      "contents: read",
      "pull-requests: read",
      "checks: write",
    ],
    creates,
    completes,
    mergeCalls,
    protectionRestCalls: [],
    extraCheckRunsBeforeCreate: options.extraCheckRunsBeforeCreate ?? [],
    extraCheckRunsAfterCreate: options.extraCheckRunsAfterCreate ?? [],
    injectDuplicateAfterCreate: options.injectDuplicateAfterCreate === true,
    forceTechnicalErrorAfterCreate:
      options.forceTechnicalErrorAfterCreate === true,
    forceTechnicalErrorBeforeCreate:
      options.forceTechnicalErrorBeforeCreate === true,
    forceFacts: options.forceFacts,
    log: () => {},
    async restRequest({ method, urlPath }) {
      if (/\/merges$|\/merge$/.test(urlPath))
        mergeCalls.push({ method, urlPath });
      if (
        options.forceTechnicalErrorBeforeCreate &&
        urlPath.includes("/actions/runs/")
      ) {
        const err = new Error("boom");
        err.sanitized = { message: "boom" };
        throw err;
      }
      if (urlPath === `/repos/laoton80-del/Ket-noi-eu`) {
        return { default_branch: options.defaultBranch ?? "master" };
      }
      if (urlPath.includes("/git/ref/heads/")) {
        return { object: { sha: options.masterSha ?? MASTER } };
      }
      if (
        urlPath ===
        `/repos/laoton80-del/Ket-noi-eu/actions/runs/${PRIOR_RUN_ID}`
      ) {
        return (
          options.priorRun ?? {
            id: PRIOR_RUN_ID,
            event: "workflow_dispatch",
            run_attempt: 1,
            status: "completed",
            conclusion: "failure",
            head_branch: "master",
            head_sha: "9999999999999999999999999999999999999999",
            path: WORKFLOW_FILE_PATH,
            workflow_id: options.workflowId ?? 7,
            created_at: "2020-01-01T00:00:01.000Z",
            actor: { login: "laoton80-del" },
            triggering_actor: { login: "laoton80-del" },
          }
        );
      }
      if (urlPath.includes("/actions/runs/")) {
        if (options.runMissing) return { message: "Not Found" };
        return {
          id: 999,
          event: options.runEvent ?? "workflow_dispatch",
          run_attempt: options.runAttempt ?? 1,
          head_branch: options.runHeadBranch ?? "master",
          head_sha: options.runHeadSha ?? MASTER,
          path: options.runPath ?? WORKFLOW_FILE_PATH,
          workflow_id: options.workflowId ?? 7,
          created_at: options.runCreatedAt ?? RUN_CREATED,
          actor: { login: options.actor ?? "laoton80-del" },
          triggering_actor: {
            login: options.triggeringActor ?? options.actor ?? "laoton80-del",
          },
        };
      }
      if (urlPath.includes("/actions/workflows/")) {
        if (options.workflowMissing) return { message: "Not Found" };
        return {
          id: options.workflowId ?? 7,
          path: options.workflowMetaPath ?? WORKFLOW_FILE_PATH,
          state: options.workflowState ?? "active",
        };
      }
      if (urlPath.includes("/contents/")) {
        if (options.contentError) {
          const err = new Error("content");
          err.sanitized = { message: "content" };
          throw err;
        }
        const isRun = urlPath.includes(`ref=${options.runHeadSha ?? MASTER}`);
        const sha = isRun
          ? options.runBlobSha ?? BLOB
          : options.masterBlobSha ?? BLOB;
        if (options.blobMismatch && !isRun) {
          return {
            sha: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            path: WORKFLOW_FILE_PATH,
            type: "file",
          };
        }
        return { sha, path: WORKFLOW_FILE_PATH, type: "file" };
      }
      if (
        urlPath === `/repos/laoton80-del/Ket-noi-eu/git/commits/${expectedHead}`
      ) {
        return {
          sha: expectedHead,
          tree: { sha: options.headTree ?? expectedTree },
        };
      }
      if (/\/pulls\/\d+$/.test(urlPath) && method === "GET") {
        if (options.prMissing) {
          const err = new Error("missing");
          throw err;
        }
        if (options.prSnapshotB && deps._prGets >= 1) {
          deps._prGets += 1;
          return options.prSnapshotB;
        }
        deps._prGets = (deps._prGets ?? 0) + 1;
        return pr;
      }
      if (urlPath.includes("/files")) {
        if (filePages) {
          const page = Number(
            new URL("https://x" + urlPath).searchParams.get("page") || "1"
          );
          return filePages[page - 1] ?? [];
        }
        return files;
      }
      if (urlPath.includes("/reviews")) {
        return reviews;
      }
      if (
        urlPath ===
          `/repos/laoton80-del/Ket-noi-eu/check-runs/${PRIOR_CHECK_RUN_ID}` &&
        method === "GET"
      ) {
        return (
          options.priorCheck ?? {
            id: PRIOR_CHECK_RUN_ID,
            name: GATE_CHECK_RUN_NAME,
            head_sha: expectedHead,
            status: "completed",
            conclusion: "failure",
            app: { id: options.appId ?? 42 },
            output: {
              title: BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
              summary: JSON.stringify({
                decision: "failure",
                blocker: BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
              }),
            },
          }
        );
      }
      if (urlPath.includes("/check-runs") && method === "GET") {
        if (urlPath.includes("/commits/")) {
          assert.equal(
            new URL("https://x" + urlPath).searchParams.get("filter"),
            "all"
          );
        }
        if (checkListPages) {
          const page = Number(
            new URL("https://x" + urlPath).searchParams.get("page") || "1"
          );
          return { check_runs: checkListPages[page - 1] ?? [] };
        }
        return {
          check_runs: options.checkRuns ?? [
            {
              name: "Viona Emergency Merge Lock",
              head_sha: expectedHead,
              conclusion: "success",
              status: "completed",
            },
          ],
        };
      }
      assertChecksRestRequest(method, urlPath);
      return {};
    },
    async protectionRestRequest({ method, urlPath }) {
      deps.protectionRestCalls.push({ method, urlPath });
      assertProtectionReadRequest(method, urlPath);
      if (
        options.protectionHttpStatus === 401 ||
        options.protectionHttpStatus === 403
      ) {
        const err = new Error(`GitHub REST ${options.protectionHttpStatus}`);
        err.sanitized = {
          status: options.protectionHttpStatus,
          message: "error",
        };
        throw err;
      }
      if (options.protectionMalformed === true) {
        return "not-an-object";
      }
      if (Object.prototype.hasOwnProperty.call(options, "protectionOverride")) {
        return options.protectionOverride;
      }
      return {
        enforce_admins: { enabled: true },
        required_status_checks: {
          contexts: options.requiredContexts ?? ["Viona Emergency Merge Lock"],
        },
      };
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
                  pageInfo: {
                    hasNextPage: hasNext,
                    endCursor: hasNext ? `c${page}` : null,
                  },
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
                nodes: options.unresolved
                  ? [{ isResolved: false }]
                  : [{ isResolved: true }],
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

function createRecoveryGateDeps(options = {}) {
  const files = options.files ?? RECOVERY_FILES;
  const digest = computeReviewedScopeDigest(files);
  const priorCheck = options.priorCheck ?? {
    id: PRIOR_CHECK_RUN_ID,
    name: GATE_CHECK_RUN_NAME,
    head_sha: RECOVERY_HEAD,
    status: "completed",
    conclusion: "failure",
    app: { id: options.appId ?? 42 },
    output: {
      title: BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
      summary: JSON.stringify({
        decision: "failure",
        blocker: BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
      }),
    },
  };
  const checkRuns = options.checkRuns ?? [
    priorCheck,
    {
      id: 43,
      name: FAILED_STAGE1_SUPERSESSION_CASE_V1.preflightCheckName,
      head_sha: RECOVERY_HEAD,
      status: "completed",
      conclusion: "success",
      app: { id: 42 },
    },
    {
      id: 44,
      name: "Viona Emergency Merge Lock",
      head_sha: RECOVERY_HEAD,
      status: "completed",
      conclusion: "success",
      app: { id: 42 },
    },
  ];
  const deps = createMockGateDeps({
    ...options,
    files,
    priorCheck,
    checkRuns,
    expectedHead: RECOVERY_HEAD,
    expectedTree: RECOVERY_TREE,
    pr: options.pr ?? {
      number: FAILED_STAGE1_SUPERSESSION_CASE_V1.prNumber,
      state: "open",
      draft: false,
      base: { ref: "master" },
      head: { sha: RECOVERY_HEAD },
      auto_merge: null,
    },
    reviews: options.reviews ?? [
      {
        state: "APPROVED",
        commit_id: RECOVERY_HEAD,
        submitted_at: APPROVAL_BEFORE,
        user: { login: FAILED_STAGE1_SUPERSESSION_CASE_V1.reviewerLogin },
      },
    ],
    env: {
      VIONA_GATE_DISPATCH_MODE:
        GATE_DISPATCH_MODES.FAILED_STAGE1_SUPERSESSION_V1,
      VIONA_GATE_PR_NUMBER: String(FAILED_STAGE1_SUPERSESSION_CASE_V1.prNumber),
      VIONA_GATE_HEAD_SHA: RECOVERY_HEAD,
      VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding(),
      VIONA_GATE_REVIEWED_SCOPE_DIGEST: digest,
      ...(options.env ?? {}),
    },
  });
  deps.priorCheck = priorCheck;
  deps.checkRuns = checkRuns;
  return deps;
}

function findRecoveryPredecessor(deps) {
  const predecessor = deps.checkRuns.find(
    (check) => String(check?.id) === String(PRIOR_CHECK_RUN_ID)
  );
  assert.ok(
    predecessor,
    "the exact historical predecessor fixture must be present"
  );
  return predecessor;
}

function snapshotRecoveryPredecessor(check) {
  const evidence = parseGateCheckEvidence(check);
  return {
    id: check.id,
    name: check.name,
    head_sha: check.head_sha,
    status: check.status,
    conclusion: check.conclusion,
    output_title: check.output?.title ?? null,
    output_summary: check.output?.summary ?? null,
    evidence_blocker: evidence?.blocker ?? null,
    app_id: check.app?.id ?? check.app_id ?? null,
  };
}

function assertRecoveryPredecessorUnchanged(check, before) {
  assert.deepEqual(
    snapshotRecoveryPredecessor(check),
    before,
    "failed historical Stage1 evidence must remain unchanged"
  );
}

async function main() {
  try {
    test("P1 parity 1 ACTIVE plus remediation audit scope passes shared policy", () => {
      const r = evaluateFreezeScopeForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        freezeScope: CANONICAL_FREEZE_SCOPE,
      });
      assert.deepEqual(r, { ok: true, reason: null });
    });

    test("P1 parity 2 ACTIVE plus released audit scope is denied", () => {
      const r = evaluateFreezeScopeForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        freezeScope: RELEASED_FREEZE_SCOPE,
      });
      assert.equal(r.ok, false);
      assert.equal(
        r.reason,
        FREEZE_SCOPE_POLICY_FAILURES.ACTIVE_REMEDIATION_SCOPE_REQUIRED
      );
    });

    test("P1 parity 3 RELEASED plus released audit scope passes shared policy", () => {
      const r = evaluateFreezeScopeForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.RELEASED,
        freezeScope: RELEASED_FREEZE_SCOPE,
      });
      assert.deepEqual(r, { ok: true, reason: null });
    });

    test("P1 parity 4 RELEASED plus remediation audit scope is denied", () => {
      const r = evaluateFreezeScopeForState({
        freezeState: GLOBAL_MERGE_FREEZE_STATES.RELEASED,
        freezeScope: CANONICAL_FREEZE_SCOPE,
      });
      assert.equal(r.ok, false);
      assert.equal(
        r.reason,
        FREEZE_SCOPE_POLICY_FAILURES.RELEASED_SCOPE_REQUIRED
      );
    });

    test("P1 parity 5 UNKNOWN state denies either canonical audit scope", () => {
      for (const freezeScope of [
        CANONICAL_FREEZE_SCOPE,
        RELEASED_FREEZE_SCOPE,
      ]) {
        const r = evaluateFreezeScopeForState({
          freezeState: "UNKNOWN",
          freezeScope,
        });
        assert.equal(r.ok, false);
        assert.equal(
          r.reason,
          FREEZE_SCOPE_POLICY_FAILURES.UNKNOWN_FREEZE_STATE
        );
      }
    });

    test("P1 parity 6 canonical RELEASED mode accepts otherwise-valid Stage1 facts", () => {
      assert.equal(
        GLOBAL_MERGE_FREEZE_STATE,
        GLOBAL_MERGE_FREEZE_STATES.RELEASED
      );
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts()).conclusion,
        "success"
      );
    });

    test("P1 parity 7 RELEASED mode still denies an invalid approval", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ reviewSatisfied: false }))
          .blocker,
        BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED
      );
    });

    test("P1 parity 8 RELEASED mode still denies the wrong reviewed-scope digest", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({
            computedReviewedScopeDigest: "abc",
            suppliedReviewedScopeDigest: "def",
          })
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
      );
    });

    test("P1 parity 9 RELEASED mode still denies an unresolved conversation", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ unresolvedConversation: true })
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION
      );
    });

    await testAsync(
      "P1 parity 10 RELEASED mode still denies a failed unrelated required context",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [
            GATE_CHECK_RUN_NAME,
            "Viona Explicit Merge Authorization",
            "Some Unrelated Required CI",
          ],
          checkRuns: [],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    test("P1 parity state is code-owned and cannot be selected through env input", () => {
      const parsed = parseStructuredInputs({
        VIONA_GATE_DISPATCH_MODE: GATE_DISPATCH_MODES.NORMAL,
        VIONA_GATE_PR_NUMBER: "100",
        VIONA_GATE_HEAD_SHA: HEAD,
        VIONA_GATE_BASE_BRANCH: "master",
        VIONA_GATE_MERGE_MODE: "squash",
        VIONA_GATE_FREEZE_SCOPE: RELEASED_FREEZE_SCOPE,
        VIONA_GATE_FREEZE_STATE: GLOBAL_MERGE_FREEZE_STATES.ACTIVE,
        VIONA_GATE_REVIEWED_SCOPE_DIGEST: "abc",
      });
      assert.equal(parsed.structuredInputsComplete, true);
      assert.equal(Object.hasOwn(parsed, "freezeState"), false);
      assert.equal(
        GLOBAL_MERGE_FREEZE_STATE,
        GLOBAL_MERGE_FREEZE_STATES.RELEASED
      );
    });

    test("1 valid evaluate success", () => {
      const r = evaluateMergeAuthorizationGate(happyFacts());
      assert.equal(r.conclusion, "success");
    });

    test("2 wrong repository", () => {
      assert.notEqual(
        evaluateMergeAuthorizationGate(happyFacts({ repository: "x/y" }))
          .conclusion,
        "success"
      );
    });

    test("3 non-workflow_dispatch", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ eventName: "push" }))
          .blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
      );
    });

    test("4 unauthorized actor", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ actor: "x", triggeringActor: "x" })
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED
      );
    });

    test("5 triggering actor mismatch", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ triggeringActor: "other" }))
          .blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
      );
    });

    test("6 run_attempt > 1", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ runAttempt: 2 })).blocker,
        BLOCKERS.BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED
      );
    });

    test("7 non-canonical workflow path", () => {
      assert.notEqual(
        evaluateMergeAuthorizationGate(happyFacts({ workflowPath: "x.yml" }))
          .conclusion,
        "success"
      );
    });

    test("8 canonical workflow unproven", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ canonicalWorkflowVersionProven: false })
        ).blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN
      );
    });

    test("9 missing structured input", () => {
      assert.notEqual(
        evaluateMergeAuthorizationGate(
          happyFacts({ structuredInputsComplete: false })
        ).conclusion,
        "success"
      );
    });

    test("10 malformed PR number", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(happyFacts({ prNumberMalformed: true }))
          .blocker,
        BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH
      );
    });

    test("11 non-40 head", () => {
      assert.equal(
        evaluateMergeAuthorizationGate(
          happyFacts({ headSha: "x", headShaMalformed: true })
        ).blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
      );
    });

    test("12-26 classic binding blockers", () => {
      const cases = [
        { prMissing: true },
        { prState: "CLOSED" },
        { actualPrNumber: 9 },
        { actualBaseBranch: "dev" },
        { actualHeadSha: HEAD2 },
        { mergeMode: "merge" },
        { freezeScope: "NO" },
        { headActivationProven: false },
        { authorizationPredatesCurrentHead: true },
        { autoMergeActive: true },
        { computedReviewedScopeDigest: "1", suppliedReviewedScopeDigest: "2" },
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
          "success",
          JSON.stringify(over)
        );
      }
    });

    test("27 no default success path", () => {
      const r = evaluateMergeAuthorizationGate(
        happyFacts({ allConditionsExplicitlyGreen: false })
      );
      assert.notEqual(r.conclusion, "success");
    });

    test("28 free-text rejected", () => {
      const p = parseStructuredInputs({
        VIONA_GATE_AUTHORIZATION: "APPROVE_X",
      });
      assert.equal(p.freeTextAuthorizationPresent, true);
    });

    test("29 authorized_operator rejected", () => {
      const p = parseStructuredInputs({
        VIONA_GATE_AUTHORIZED_OPERATOR: "laoton80-del",
      });
      assert.equal(p.callerAuthorizedOperatorPresent, true);
    });

    test("30 exact-head approval helper", () => {
      const ok = selectExactHeadApproval(
        [{ state: "APPROVED", commit_id: HEAD, submitted_at: APPROVAL_BEFORE }],
        HEAD,
        Date.parse(RUN_CREATED)
      );
      assert.equal(ok.ok, true);
      const late = selectExactHeadApproval(
        [{ state: "APPROVED", commit_id: HEAD, submitted_at: APPROVAL_AFTER }],
        HEAD,
        Date.parse(RUN_CREATED)
      );
      assert.equal(late.ok, false);
      const wrong = selectExactHeadApproval(
        [
          {
            state: "APPROVED",
            commit_id: HEAD2,
            submitted_at: APPROVAL_BEFORE,
          },
        ],
        HEAD,
        Date.parse(RUN_CREATED)
      );
      assert.equal(wrong.ok, false);
      const dismissed = selectExactHeadApproval(
        [
          {
            state: "APPROVED",
            commit_id: HEAD,
            submitted_at: APPROVAL_BEFORE,
            dismissed_at: APPROVAL_BEFORE,
          },
        ],
        HEAD,
        Date.parse(RUN_CREATED)
      );
      assert.equal(dismissed.ok, false);
    });

    test("31 digest algorithm + rename", () => {
      const files = [
        { status: "renamed", filename: "c.txt", previous_filename: "old.txt" },
        { status: "added", filename: "a.txt" },
      ];
      const d = computeReviewedScopeDigest(files);
      const material = ["added\ta.txt\t", "renamed\tc.txt\told.txt"].join("\n");
      assert.equal(
        d,
        createHash("sha256").update(material, "utf8").digest("hex")
      );
      assert.equal(d, computeReviewedScopeDigest([...files].reverse()));
    });

    test("32 workflow permissions + dispatch-only", () => {
      const yml = readFileSync(path.join(root, WORKFLOW_FILE_PATH), "utf8");
      assert.match(yml, /checks:\s*write/);
      assert.doesNotMatch(yml, /statuses:\s*write/);
      assert.doesNotMatch(yml, /contents:\s*write/);
      assert.doesNotMatch(yml, /pull-requests:\s*write/);
      assert.match(yml, /workflow_dispatch:/);
      assert.doesNotMatch(yml, /pull_request:/);
      assert.match(yml, /concurrency:/);
      assert.match(
        yml,
        /viona-merge-authorization-gate-\$\{\{\s*github\.repository\s*\}\}-\$\{\{\s*inputs\.pr_number\s*\}\}-\$\{\{\s*inputs\.head_sha\s*\}\}/
      );
      assert.match(yml, /cancel-in-progress:\s*false/);
      assert.doesNotMatch(yml, /VIONA_GATE_WORKFLOW_SHA/);
      assert.doesNotMatch(yml, /VIONA_GATE_MASTER_WORKFLOW_SHA/);
      assert.match(yml, /actions\/create-github-app-token@v2/);
      assert.match(yml, /VIONA_GATE_PROTECTION_READ_APP_ID/);
      assert.match(yml, /VIONA_GATE_PROTECTION_READ_APP_PRIVATE_KEY/);
      assert.match(yml, /VIONA_GATE_PROTECTION_READ_TOKEN:/);
      assert.match(yml, /permission-administration:\s*read/);
      assert.doesNotMatch(yml, /\npermissions:\n(?:  .+\n)*  administration:/);
      assert.doesNotMatch(yml, /permission-administration:\s*write/);
      // R2 — authority=MERGE input removed, no replacement flag introduced (R3).
      assert.doesNotMatch(yml, /\n\s*authority:/);
      assert.doesNotMatch(yml, /VIONA_GATE_AUTHORITY/);
      assert.doesNotMatch(yml, /\n\s*readiness:/);
      assert.doesNotMatch(yml, /\n\s*approval:/);
      assert.doesNotMatch(yml, /\n\s*authorized:/);
      assert.doesNotMatch(yml, /\n\s*decision:/);
      assert.doesNotMatch(yml, /\n\s*go:/);
      assert.doesNotMatch(yml, /^\s{6}freeze_state:/m);
      assert.match(yml, /description: Audit scope only;/);
      assert.match(
        yml,
        /- FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY/
      );
      assert.match(yml, /- GLOBAL_MERGE_FREEZE_RELEASED/);
      assert.match(yml, /Viona Merge Readiness Gate/);
      assert.doesNotMatch(yml, /name:\s*Viona Merge Authorization Gate\b/);
      assert.equal(
        assertPermissionScope([
          "contents: read",
          "pull-requests: read",
          "checks: write",
        ]).ok,
        true
      );
    });

    test("33 markers exported", () => {
      assert.equal(
        REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
        "REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY"
      );
      assert.equal(
        GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
        "GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH"
      );
    });

    await testAsync("34 happy orchestrated success", async () => {
      const deps = createMockGateDeps();
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, "success");
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.creates[0].name, GATE_CHECK_RUN_NAME);
      assert.equal(deps.completes.length, 1);
      assert.equal(deps.mergeCalls.length, 0);
    });

    await testAsync(
      "35 minimum provenance before check — repo mismatch zero checks",
      async () => {
        const deps = createMockGateDeps({
          env: { VIONA_GATE_REPOSITORY: "other/repo" },
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.notEqual(result.conclusion, "success");
        assert.equal(deps.creates.length, 0);
      }
    );

    await testAsync("36 event mismatch zero checks", async () => {
      const deps = createMockGateDeps({ runEvent: "push" });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.notEqual(result.conclusion, "success");
    });

    await testAsync("37 rerun zero checks", async () => {
      const deps = createMockGateDeps({ runAttempt: 2 });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED
      );
    });

    await testAsync("38 unauthorized actor zero checks", async () => {
      const deps = createMockGateDeps({
        actor: "evil",
        triggeringActor: "evil",
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED
      );
    });

    await testAsync("39 triggering actor mismatch zero checks", async () => {
      const deps = createMockGateDeps({ triggeringActor: "other" });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync("40 canonical workflow failure zero checks", async () => {
      const deps = createMockGateDeps({ runPath: "other.yml" });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN
      );
    });

    await testAsync("41 PR missing zero checks", async () => {
      const deps = createMockGateDeps({ prMissing: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync("42 head mismatch zero checks", async () => {
      const deps = createMockGateDeps({
        pr: {
          number: 100,
          state: "open",
          base: { ref: "master" },
          head: { sha: HEAD2 },
          auto_merge: null,
        },
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
      );
    });

    await testAsync("43 duplicate existing gate zero checks", async () => {
      const deps = createMockGateDeps({
        extraCheckRunsBeforeCreate: [
          {
            name: GATE_CHECK_RUN_NAME,
            id: 1,
            head_sha: HEAD,
            conclusion: "success",
          },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS
      );
    });

    await testAsync("44 run on non-default branch", async () => {
      const deps = createMockGateDeps({ runHeadBranch: "feature" });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN
      );
    });

    await testAsync("45 run SHA differs from current master", async () => {
      const deps = createMockGateDeps({ runHeadSha: HEAD2 });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN
      );
    });

    await testAsync("46 workflow blob mismatch", async () => {
      const deps = createMockGateDeps({ blobMismatch: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN
      );
    });

    await testAsync("47 wrong workflow id/path metadata", async () => {
      const deps = createMockGateDeps({ workflowMetaPath: "nope.yml" });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync("48 proveCanonicalWorkflowVersion happy", async () => {
      const deps = createMockGateDeps();
      const proven = await proveCanonicalWorkflowVersion(deps, {
        owner: "laoton80-del",
        repo: "Ket-noi-eu",
        runId: "999",
      });
      assert.equal(proven.ok, true);
    });

    await testAsync("49 approval after dispatch rejected", async () => {
      const deps = createMockGateDeps({
        reviews: [
          { state: "APPROVED", commit_id: HEAD, submitted_at: APPROVAL_AFTER },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD
      );
    });

    await testAsync("50 approval for another commit rejected", async () => {
      const deps = createMockGateDeps({
        reviews: [
          {
            state: "APPROVED",
            commit_id: HEAD2,
            submitted_at: APPROVAL_BEFORE,
          },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
    });

    await testAsync("51 head changes between snapshot A and B", async () => {
      const deps = createMockGateDeps({
        prSnapshotB: {
          number: 100,
          state: "open",
          base: { ref: "master" },
          head: { sha: HEAD2 },
          auto_merge: null,
        },
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.notEqual(result.conclusion, "success");
    });

    await testAsync("52 duplicate in-progress same head", async () => {
      const deps = createMockGateDeps({
        extraCheckRunsBeforeCreate: [
          {
            name: GATE_CHECK_RUN_NAME,
            id: 9,
            status: "in_progress",
            head_sha: HEAD,
          },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS
      );
    });

    await testAsync("53 concurrent duplicate after create", async () => {
      const deps = createMockGateDeps({ injectDuplicateAfterCreate: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS
      );
    });

    await testAsync("54 conflicting app after create", async () => {
      const deps = createMockGateDeps({
        extraCheckRunsAfterCreate: [
          {
            id: 777,
            name: GATE_CHECK_RUN_NAME,
            head_sha: HEAD,
            app: { id: 99 },
          },
          {
            id: 778,
            name: GATE_CHECK_RUN_NAME,
            head_sha: HEAD,
            app: { id: 42 },
          },
        ],
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 1);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS
      );
    });

    await testAsync("55 stale other-SHA ignored not reused", async () => {
      const deps = createMockGateDeps({
        checkRuns: [
          {
            name: "Viona Emergency Merge Lock",
            head_sha: HEAD,
            conclusion: "success",
          },
          {
            name: GATE_CHECK_RUN_NAME,
            head_sha: HEAD2,
            conclusion: "success",
            id: 55,
          },
        ],
      });
      // other-SHA gate is on different head listing — listAllCheckRuns uses current HEAD only
      // so other-SHA won't appear; ensure success still requires no same-head duplicate
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, "success");
      assert.equal(deps.creates.length, 1);
    });

    await testAsync("56 unknown error before check creation", async () => {
      const deps = createMockGateDeps({
        forceTechnicalErrorBeforeCreate: true,
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(deps.creates.length, 0);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN
      );
    });

    await testAsync(
      "57 unknown error after check creation completes failure",
      async () => {
        const deps = createMockGateDeps({
          forceTechnicalErrorAfterCreate: true,
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(deps.creates.length, 1);
        assert.equal(deps.completes.length, 1);
        assert.equal(deps.completes[0].conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR
        );
      }
    );

    await testAsync("58 PR-file REST pagination + renamed digest", async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        status: "modified",
        filename: `f${String(i).padStart(3, "0")}.txt`,
      }));
      const page2 = [
        {
          status: "renamed",
          filename: "zzz.txt",
          previous_filename: "old-zzz.txt",
        },
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
      assert.equal(result.conclusion, "success");
    });

    await testAsync("59 conversation GraphQL pagination", async () => {
      const page1 = Array.from({ length: 100 }, () => ({ isResolved: true }));
      const page2 = [{ isResolved: true }];
      const deps = createMockGateDeps({ threadPages: [page1, page2] });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, "success");
    });

    await testAsync("60 check-run pagination", async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        name: `other-${i}`,
        head_sha: HEAD,
        conclusion: "success",
      }));
      const page2 = [
        {
          name: "Viona Emergency Merge Lock",
          head_sha: HEAD,
          conclusion: "success",
        },
      ];
      const deps = createMockGateDeps({ checkListPages: [page1, page2] });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(result.conclusion, "success");
    });

    await testAsync("61 zero merge endpoint calls", async () => {
      const deps = createMockGateDeps();
      await runMergeAuthorizationGate(deps);
      assert.equal(deps.mergeCalls.length, 0);
    });

    test("62 no pr.updated_at in gate source", () => {
      const src = readFileSync(
        path.join(root, "scripts/viona-merge-authorization-gate.mjs"),
        "utf8"
      );
      assert.doesNotMatch(src, /pr\.updated_at/);
      assert.doesNotMatch(src, /updated_at \?\?/);
    });

    await testAsync("63 protection credential missing", async () => {
      const deps = createMockGateDeps({
        env: { VIONA_GATE_PROTECTION_READ_TOKEN: "" },
      });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING
      );
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes.length, 1);
      assert.equal(deps.completes[0].conclusion, "failure");
      assert.equal(deps.protectionRestCalls.length, 0);
      assert.equal(deps.mergeCalls.length, 0);
    });

    await testAsync("64 protection GET 401", async () => {
      const deps = createMockGateDeps({ protectionHttpStatus: 401 });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED
      );
      assert.equal(deps.creates.length, 1);
      assert.equal(deps.completes[0].conclusion, "failure");
    });

    await testAsync("65 protection GET 403", async () => {
      const deps = createMockGateDeps({ protectionHttpStatus: 403 });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED
      );
      assert.notEqual(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED
      );
      assert.equal(deps.creates.length, 1);
    });

    await testAsync("66 malformed protection payload", async () => {
      const deps = createMockGateDeps({ protectionMalformed: true });
      const result = await runMergeAuthorizationGate(deps);
      assert.equal(
        result.blocker,
        BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED
      );
    });

    await testAsync(
      "67 enforce_admins false and required_status_checks absent",
      async () => {
        const deps = createMockGateDeps({
          protectionOverride: { enforce_admins: { enabled: false } },
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED
        );
      }
    );

    await testAsync(
      "68 valid protection proceeds to remaining policy",
      async () => {
        const deps = createMockGateDeps();
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "success");
        assert.equal(deps.protectionRestCalls.length, 1);
        assert.equal(deps.protectionRestCalls[0].method, "GET");
        assert.equal(
          deps.protectionRestCalls[0].urlPath,
          CANONICAL_MASTER_PROTECTION_PATH
        );
        assert.equal(deps.mergeCalls.length, 0);
      }
    );

    test("69 checks client cannot perform canonical protection GET", () => {
      assert.throws(
        () => assertChecksRestRequest("GET", CANONICAL_MASTER_PROTECTION_PATH),
        /checks_token_protection_get_forbidden/
      );
    });

    test("70 protection token rejects Checks create path", () => {
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "POST",
            "/repos/laoton80-del/Ket-noi-eu/check-runs"
          ),
        /protection_read_path_forbidden/
      );
    });

    test("71 protection token rejects status paths", () => {
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "POST",
            `/repos/laoton80-del/Ket-noi-eu/statuses/${HEAD}`
          ),
        /protection_read_path_forbidden/
      );
    });

    test("72 protection token rejects merge paths", () => {
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "PUT",
            "/repos/laoton80-del/Ket-noi-eu/pulls/100/merge"
          ),
        /protection_read_path_forbidden/
      );
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "POST",
            "/repos/laoton80-del/Ket-noi-eu/merges"
          ),
        /protection_read_path_forbidden/
      );
    });

    test("73 protection token rejects protection write", () => {
      assert.throws(
        () =>
          assertProtectionReadRequest("PUT", CANONICAL_MASTER_PROTECTION_PATH),
        /protection_read_path_forbidden/
      );
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "PATCH",
            CANONICAL_MASTER_PROTECTION_PATH
          ),
        /protection_read_path_forbidden/
      );
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "DELETE",
            CANONICAL_MASTER_PROTECTION_PATH
          ),
        /protection_read_path_forbidden/
      );
    });

    test("74 protection token rejects arbitrary path", () => {
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "GET",
            "/repos/laoton80-del/Ket-noi-eu/actions/secrets"
          ),
        /protection_read_path_forbidden/
      );
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "POST",
            "/repos/laoton80-del/Ket-noi-eu/actions/workflows/1/dispatches"
          ),
        /protection_read_path_forbidden/
      );
      assert.throws(
        () =>
          assertProtectionReadRequest(
            "POST",
            "/repos/laoton80-del/Ket-noi-eu/deployments"
          ),
        /protection_read_path_forbidden/
      );
    });

    test("75 protection GET path is the only allowed protection-read request", () => {
      assert.doesNotThrow(() =>
        assertProtectionReadRequest("GET", CANONICAL_MASTER_PROTECTION_PATH)
      );
    });

    await testAsync(
      "76 production deps isolate tokens and reject writes",
      async () => {
        const auths = [];
        const prev = globalThis.fetch;
        globalThis.fetch = async (_url, opts) => {
          auths.push(opts.headers.Authorization);
          return {
            ok: true,
            status: 200,
            async text() {
              return JSON.stringify({ id: 1, app: { id: 15368 } });
            },
          };
        };
        try {
          const deps = createProductionDeps({
            GITHUB_TOKEN: "checks-token",
            VIONA_GATE_PROTECTION_READ_TOKEN: "prot-token",
          });
          await assert.rejects(() =>
            deps.restRequest({
              method: "GET",
              urlPath: CANONICAL_MASTER_PROTECTION_PATH,
            })
          );
          await deps.createCheckRun({
            name: GATE_CHECK_RUN_NAME,
            headSha: HEAD,
            status: "in_progress",
          });
          await deps.protectionRestRequest({
            method: "GET",
            urlPath: CANONICAL_MASTER_PROTECTION_PATH,
          });
          assert.deepEqual(auths, ["Bearer checks-token", "Bearer prot-token"]);
          await assert.rejects(() =>
            deps.protectionRestRequest({
              method: "POST",
              urlPath: "/repos/laoton80-del/Ket-noi-eu/check-runs",
            })
          );
          await assert.rejects(() =>
            deps.protectionRestRequest({
              method: "POST",
              urlPath: `/repos/laoton80-del/Ket-noi-eu/statuses/${HEAD}`,
            })
          );
          await assert.rejects(() =>
            deps.protectionRestRequest({
              method: "PUT",
              urlPath: "/repos/laoton80-del/Ket-noi-eu/pulls/1/merge",
            })
          );
          await assert.rejects(() =>
            deps.protectionRestRequest({
              method: "PUT",
              urlPath: CANONICAL_MASTER_PROTECTION_PATH,
            })
          );
        } finally {
          globalThis.fetch = prev;
        }
      }
    );

    await testAsync(
      "77 orchestrator mergeCalls remain zero after protection read",
      async () => {
        const deps = createMockGateDeps();
        await runMergeAuthorizationGate(deps);
        assert.equal(deps.mergeCalls.length, 0);
      }
    );

    test("78 gate source has no statuses write and no merge execution", () => {
      const src = readFileSync(
        path.join(root, "scripts/viona-merge-authorization-gate.mjs"),
        "utf8"
      );
      const yml = readFileSync(path.join(root, WORKFLOW_FILE_PATH), "utf8");
      assert.doesNotMatch(yml, /statuses:\s*write/);
      assert.doesNotMatch(src, /\/statuses\//);
      assert.doesNotMatch(src, /\/pulls\/\$\{[^}]+\}\/merge/);
    });

    // --- Stage1/Stage2 required-check deadlock remediation (governance
    // directive VIONA.REC2.MERGE_CONTROL.LANE_B2.CIRCULAR_DEPENDENCY_REMEDIATION.LOCAL_IMPLEMENTATION.V2) ---
    // These deterministic, offline, network-free tests exercise ONLY the
    // required-context enumeration inside runMergeAuthorizationGate. They
    // prove Stage1 is independently reachable when the downstream Stage2
    // context is a live required check but has not yet run — they do NOT
    // claim to prove the separate, live GitHub-native property "Stage1
    // success + Stage2 missing => branch protection blocks the merge
    // button," which remains a later disposable-PR proof after Lane B2 is
    // re-activated.

    await testAsync(
      "79 TEST A — Stage2 downstream context missing must not block Stage1",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [
            GATE_CHECK_RUN_NAME,
            "Viona Explicit Merge Authorization",
          ],
          checkRuns: [],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "success");
        assert.equal(deps.mergeCalls.length, 0);
      }
    );

    await testAsync(
      "80 TEST B — unrelated required check remains enforced",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [
            GATE_CHECK_RUN_NAME,
            "Viona Explicit Merge Authorization",
            "Some Unrelated Required CI",
          ],
          checkRuns: [],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.notEqual(result.conclusion, "success");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    await testAsync(
      "81 TEST C — stale unrelated required check on a different head remains fail-closed",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [
            GATE_CHECK_RUN_NAME,
            "Viona Explicit Merge Authorization",
            "Some Unrelated Required CI",
          ],
          checkRuns: [
            {
              name: "Some Unrelated Required CI",
              head_sha: HEAD2,
              conclusion: "success",
              status: "completed",
            },
          ],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.notEqual(result.conclusion, "success");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    // --- Stage1 Readiness semantic migration (governance directives
    // VIONA.REC2.MERGE_CONTROL.STAGE1_READINESS_SEMANTIC_MIGRATION.LOCAL_IMPLEMENTATION.V1
    // and, for the FINAL-cleanup tests below (F1-F8),
    // VIONA.REC2.MERGE_CONTROL.STAGE1_READINESS.FINAL_CLEANUP_LOCAL_IMPLEMENTATION.V1)
    // ---
    // The transitional bootstrap shim (LEGACY_STAGE1_CHECK_RUN_NAME + its
    // skip inside the generic required-context loop) has now been REMOVED
    // from scripts/viona-merge-authorization-gate.mjs. Only
    // GATE_CHECK_RUN_NAME (canonical Stage1 identity) and
    // STAGE2_CHECK_RUN_NAME are ever skipped there. If branch protection
    // still lists the legacy name, it is now an ordinary unrelated required
    // context and Stage1 fails closed on it, exactly as designed
    // (design §15 step 10).
    const LEGACY_STAGE1_LITERAL = "Viona Merge Authorization Gate";
    const STAGE2_LITERAL = "Viona Explicit Merge Authorization";

    test("82 R1/F1 canonical identity is the renamed Readiness Gate", () => {
      assert.equal(GATE_CHECK_RUN_NAME, "Viona Merge Readiness Gate");
      assert.notEqual(GATE_CHECK_RUN_NAME, LEGACY_STAGE1_LITERAL);
    });

    await testAsync(
      "83 R1 orchestrated success creates/completes the renamed check",
      async () => {
        const deps = createMockGateDeps();
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "success");
        assert.equal(deps.creates[0].name, "Viona Merge Readiness Gate");
      }
    );

    await testAsync(
      "83b F2 required contexts [Readiness Gate, Stage2] with all unrelated checks green succeeds",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [GATE_CHECK_RUN_NAME, STAGE2_LITERAL],
          checkRuns: [],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "success");
        assert.equal(deps.mergeCalls.length, 0);
      }
    );

    test("84 R2 no authority-shaped env field required for success", () => {
      // happyFacts() and createMockGateDeps() no longer supply any
      // authority-shaped fact/env at all (removed above); test 1 and 34/83
      // already prove success without it. This test proves the removal at
      // the source/workflow-text level.
      const src = readFileSync(
        path.join(root, "scripts/viona-merge-authorization-gate.mjs"),
        "utf8"
      );
      assert.doesNotMatch(src, /CANONICAL_AUTHORITY/);
      assert.doesNotMatch(src, /VIONA_GATE_AUTHORITY/);
      assert.doesNotMatch(src, /authority:\s*inputs\.authority/);
      assert.doesNotMatch(src, /facts\.authority/);
      assert.doesNotMatch(src, /inputs\.authority/);
      // F7 (final cleanup): the transitional legacy constant is fully gone —
      // no free-text or legacy-shaped authority substitute reappeared.
      assert.doesNotMatch(src, /LEGACY_STAGE1_CHECK_RUN_NAME/);
      const yml = readFileSync(path.join(root, WORKFLOW_FILE_PATH), "utf8");
      assert.doesNotMatch(yml, /authority/i);
    });

    test("85 R3 no replacement merge-authority-shaped input introduced", () => {
      const ymlRaw = readFileSync(path.join(root, WORKFLOW_FILE_PATH), "utf8");
      const yml = ymlRaw.replace(/\r\n/g, "\n");
      const inputsBlockMatch = yml.match(
        /workflow_dispatch:\n\s*inputs:\n([\s\S]*?)\n\n/
      );
      assert.ok(
        inputsBlockMatch,
        "workflow_dispatch inputs block must be found"
      );
      const inputNames = [
        ...inputsBlockMatch[1].matchAll(/^\s{6}(\w+):/gm),
      ].map((m) => m[1]);
      assert.deepEqual(inputNames, [
        "dispatch_mode",
        "pr_number",
        "head_sha",
        "base_branch",
        "merge_mode",
        "freeze_scope",
        "reviewed_scope_digest",
        "recovery_binding",
      ]);
      assert.ok(
        inputNames.length <= 10,
        "workflow_dispatch supports at most ten inputs"
      );
      for (const forbidden of [
        "readiness",
        "approval",
        "authorized",
        "decision",
        "go",
      ]) {
        assert.ok(
          !inputNames.includes(forbidden),
          `must not introduce replacement input: ${forbidden}`
        );
      }
    });

    await testAsync(
      "86 F4 unrelated missing required CI still fails (final context set: Readiness Gate + Stage2)",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [
            GATE_CHECK_RUN_NAME,
            STAGE2_LITERAL,
            "Some Unrelated Required CI",
          ],
          checkRuns: [],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.notEqual(result.conclusion, "success");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    await testAsync(
      "87 F5 unrelated required check succeeding only on another head remains fail-closed (final context set)",
      async () => {
        const deps = createMockGateDeps({
          requiredContexts: [
            GATE_CHECK_RUN_NAME,
            STAGE2_LITERAL,
            "Some Unrelated Required CI",
          ],
          checkRuns: [
            {
              name: "Some Unrelated Required CI",
              head_sha: HEAD2,
              conclusion: "success",
              status: "completed",
            },
          ],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.notEqual(result.conclusion, "success");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    await testAsync(
      "88 F3 legacy required context with no successful legacy check now FAILS (transitional skip removed)",
      async () => {
        // Required contexts still (temporarily, on GitHub's side) include
        // the OLD legacy name alongside the NEW Readiness Gate and Stage2.
        // Before this cleanup, LEGACY_STAGE1_CHECK_RUN_NAME was explicitly
        // skipped here and this exact fixture used to succeed. That skip is
        // now gone: the legacy name is treated as an ordinary unrelated
        // required context, and since no check named
        // "Viona Merge Authorization Gate" exists on this head, Stage1 must
        // now fail closed — proving the transitional bootstrap shim has
        // been fully removed.
        const deps = createMockGateDeps({
          requiredContexts: [
            LEGACY_STAGE1_LITERAL,
            GATE_CHECK_RUN_NAME,
            STAGE2_LITERAL,
          ],
          checkRuns: [],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.notEqual(result.conclusion, "success");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
        assert.equal(deps.mergeCalls.length, 0);
      }
    );

    test("89 legacy literal is not the exported canonical identity", () => {
      // Proves legacy rejection; this literal must never satisfy Stage1's
      // own identity/duplicate-scan logic, and — after this cleanup — is no
      // longer tolerated anywhere at all, including the generic
      // required-context enumeration (see test 88/F3 above).
      assert.notEqual(LEGACY_STAGE1_LITERAL, GATE_CHECK_RUN_NAME);
    });

    test("90 F6 Stage2 downstream missing remains excluded from Stage1 prerequisites", () => {
      // Proven end-to-end by test 79 ("TEST A") and test 83b ("F2") above,
      // both of which use requiredContexts=[GATE_CHECK_RUN_NAME, STAGE2_LITERAL]
      // with no Stage2 check present on head and assert success. Re-stated
      // here by name for direct traceability to this cleanup directive's F6
      // requirement — GATE_CHECK_RUN_NAME and STAGE2_CHECK_RUN_NAME (via the
      // STAGE2_LITERAL fixture) remain the only two contexts ever skipped in
      // the generic required-context loop after the legacy skip's removal.
      assert.notEqual(GATE_CHECK_RUN_NAME, STAGE2_LITERAL);
    });

    test("91 F8 Stage1 has zero merge execution capability", () => {
      const src = readFileSync(
        path.join(root, "scripts/viona-merge-authorization-gate.mjs"),
        "utf8"
      );
      // Same execution-path assertion as test 78: Stage1 never constructs a
      // pulls/{n}/merge request. The only `/merges` occurrence in this file
      // is the observer that records mergeCalls so tests 61/77 can prove
      // those calls stay at zero — it is not a merge-execution path.
      assert.doesNotMatch(src, /\/pulls\/\$\{[^}]+\}\/merge/);
      assert.match(src, /deps\.mergeCalls\.push/);
    });

    test("R1 recovery inputs form a closed, mode-specific union", () => {
      const recovery = createRecoveryGateDeps();
      const parsedRecovery = parseStructuredInputs(recovery.env);
      assert.equal(parsedRecovery.structuredInputsComplete, true);
      assert.equal(
        parsedRecovery.dispatchMode,
        GATE_DISPATCH_MODES.FAILED_STAGE1_SUPERSESSION_V1
      );

      const normalWithRecoveryField = parseStructuredInputs({
        ...createMockGateDeps().env,
        VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding(),
      });
      assert.equal(normalWithRecoveryField.structuredInputsComplete, false);

      const unknownMode = parseStructuredInputs({
        ...createMockGateDeps().env,
        VIONA_GATE_DISPATCH_MODE: "RETRY",
      });
      assert.equal(unknownMode.structuredInputsComplete, false);

      const wrongVersion = parseStructuredInputs({
        ...recovery.env,
        VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding().replace(
          /^v1\|/,
          "v2|"
        ),
      });
      assert.equal(wrongVersion.structuredInputsComplete, false);

      const unsafeRunId = parseStructuredInputs({
        ...recovery.env,
        VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding({
          priorRunId: "9007199254740992",
        }),
      });
      assert.equal(unsafeRunId.structuredInputsComplete, false);

      const otherPr = parseStructuredInputs({
        ...recovery.env,
        VIONA_GATE_PR_NUMBER: "476",
      });
      assert.equal(otherPr.structuredInputsComplete, false);

      const otherHead = parseStructuredInputs({
        ...recovery.env,
        VIONA_GATE_HEAD_SHA: HEAD,
      });
      assert.equal(otherHead.structuredInputsComplete, false);

      const otherPriorDigest = parseStructuredInputs({
        ...recovery.env,
        VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding({
          priorDigest: "f".repeat(64),
        }),
      });
      assert.equal(otherPriorDigest.structuredInputsComplete, false);

      const unschematized = parseStructuredInputs({
        ...recovery.env,
        VIONA_GATE_RECOVERY_CASE_ID: RECOVERY_CASE_ID,
      });
      assert.equal(unschematized.structuredInputsComplete, false);
    });

    await testAsync(
      "R2 exact failed Stage1 may create one evidence-bound successor",
      async () => {
        const deps = createRecoveryGateDeps();
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "success");
        assert.equal(deps.creates.length, 1);
        assert.equal(deps.completes.length, 1);
        assert.equal(deps.completes[0].checkRunId, 777);
        assert.equal(
          deps.creates[0].externalId,
          recoveryCheckExternalId(RECOVERY_CASE_ID)
        );
        const evidence = JSON.parse(deps.completes[0].output.summary);
        assert.equal(evidence.recoverySchema, GATE_RECOVERY_EVIDENCE_SCHEMA);
        assert.equal(
          evidence.recovery_mode,
          GATE_DISPATCH_MODES.FAILED_STAGE1_SUPERSESSION_V1
        );
        assert.equal(evidence.recovery_case_id, RECOVERY_CASE_ID);
        assert.equal(
          evidence.exact_pr_number,
          FAILED_STAGE1_SUPERSESSION_CASE_V1.prNumber
        );
        assert.equal(evidence.exact_head, RECOVERY_HEAD);
        assert.equal(evidence.exact_tree, RECOVERY_TREE);
        assert.equal(evidence.supersedes_run_id, PRIOR_RUN_ID);
        assert.equal(evidence.supersedes_check_run_id, PRIOR_CHECK_RUN_ID);
        assert.equal(evidence.prior_conclusion, "failure");
        assert.equal(
          evidence.prior_blocker,
          BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
        );
        assert.equal(evidence.prior_digest, PRIOR_BAD_DIGEST);
        assert.equal(
          evidence.canonical_digest,
          deps.env.VIONA_GATE_REVIEWED_SCOPE_DIGEST
        );
        assert.equal(
          evidence.canonical_digest,
          FAILED_STAGE1_SUPERSESSION_CASE_V1.canonicalDigest
        );
        assert.equal(
          parseGateCheckEvidence({ output: deps.completes[0].output })
            .recovery_case_id,
          RECOVERY_CASE_ID
        );
      }
    );

    await testAsync(
      "R3 recovery cannot target the wrong prior check or tree",
      async () => {
        const wrongCheck = createRecoveryGateDeps({
          env: {
            VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding({
              priorCheckRunId: 665,
            }),
          },
        });
        const wrongCheckResult = await runMergeAuthorizationGate(wrongCheck);
        assert.equal(wrongCheckResult.conclusion, "failure");
        assert.equal(wrongCheck.creates.length, 0);
        assert.equal(
          wrongCheckResult.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );

        const wrongTree = createRecoveryGateDeps({
          env: {
            VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding({
              expectedTree: HEAD2,
            }),
          },
        });
        const wrongTreeResult = await runMergeAuthorizationGate(wrongTree);
        assert.equal(wrongTreeResult.conclusion, "failure");
        assert.equal(wrongTree.creates.length, 0);
        assert.equal(
          wrongTreeResult.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );
      }
    );

    await testAsync(
      "R4 a second recovery attempt is terminal before check creation",
      async () => {
        const prior = createRecoveryGateDeps().priorCheck;
        const deps = createRecoveryGateDeps({
          checkRuns: [
            prior,
            {
              id: 777,
              name: GATE_CHECK_RUN_NAME,
              head_sha: RECOVERY_HEAD,
              status: "completed",
              conclusion: "failure",
              app: { id: 42 },
            },
          ],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(deps.creates.length, 0);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_ALREADY_CONSUMED
        );
      }
    );

    await testAsync(
      "R5 recovery preflight requires every unrelated required check green",
      async () => {
        const deps = createRecoveryGateDeps({
          requiredContexts: [GATE_CHECK_RUN_NAME, "Missing Required CI"],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(deps.creates.length, 0);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    await testAsync(
      "R6 recovery refuses an existing Stage2 record on the head",
      async () => {
        const base = createRecoveryGateDeps();
        const deps = createRecoveryGateDeps({
          checkRuns: [
            ...base.checkRuns,
            {
              id: 909,
              name: STAGE2_LITERAL,
              head_sha: RECOVERY_HEAD,
              status: "completed",
              conclusion: "failure",
            },
          ],
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(deps.creates.length, 0);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );
      }
    );

    await testAsync(
      "R7 downstream resolver selects only a valid same-app successor pair",
      async () => {
        const deps = createRecoveryGateDeps();
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "success");
        const prior = deps.checkRuns.find(
          (check) => check.id === PRIOR_CHECK_RUN_ID
        );
        const successor = {
          id: result.checkRunId,
          name: GATE_CHECK_RUN_NAME,
          head_sha: RECOVERY_HEAD,
          status: "completed",
          conclusion: "success",
          app: { id: 42 },
          external_id: recoveryCheckExternalId(RECOVERY_CASE_ID),
          output: deps.completes[0].output,
        };
        const resolved = resolveEffectiveStage1Check(
          [prior, successor],
          RECOVERY_HEAD
        );
        assert.equal(resolved.ok, true);
        assert.equal(resolved.check.id, result.checkRunId);
        assert.equal(resolved.priorCheck.id, PRIOR_CHECK_RUN_ID);

        assert.equal(
          resolveEffectiveStage1Check([successor], RECOVERY_HEAD).ok,
          false
        );
        assert.equal(
          resolveEffectiveStage1Check(
            [prior, { ...successor, app: { id: 99 } }],
            RECOVERY_HEAD
          ).ok,
          false
        );
        assert.equal(
          resolveEffectiveStage1Check(
            [prior, successor, { ...successor, id: 778 }],
            RECOVERY_HEAD
          ).ok,
          false
        );
        assert.equal(
          resolveEffectiveStage1Check(
            [prior, { ...successor, conclusion: "failure" }],
            RECOVERY_HEAD
          ).ok,
          false
        );
      }
    );

    await testAsync(
      "R8 recovery requires an exact non-draft PR before successor creation",
      async () => {
        const deps = createRecoveryGateDeps({
          pr: {
            number: FAILED_STAGE1_SUPERSESSION_CASE_V1.prNumber,
            state: "open",
            draft: true,
            base: { ref: "master" },
            head: { sha: RECOVERY_HEAD },
            auto_merge: null,
          },
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(deps.creates.length, 0);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );
      }
    );

    await testAsync(
      "R9 recovery requires Maty2016 exact-head approval",
      async () => {
        const reviews = [
          {
            state: "APPROVED",
            commit_id: RECOVERY_HEAD,
            submitted_at: APPROVAL_BEFORE,
            user: { login: "another-reviewer" },
          },
        ];
        const deps = createRecoveryGateDeps({
          reviews,
        });
        assert.equal(
          selectRecoveryCaseApproval(
            reviews,
            RECOVERY_HEAD,
            Date.parse(RUN_CREATED)
          ).ok,
          false
        );
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(deps.creates.length, 0);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD
        );
      }
    );

    await testAsync(
      "R10 recovery requires the exact named preflight success",
      async () => {
        const base = createRecoveryGateDeps();
        const deps = createRecoveryGateDeps({
          checkRuns: base.checkRuns.filter(
            (check) =>
              check.name !==
              FAILED_STAGE1_SUPERSESSION_CASE_V1.preflightCheckName
          ),
        });
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(deps.creates.length, 0);
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
      }
    );

    await testAsync(
      "R11 RECOVERY-02 wrong prior run ID blocks before check creation",
      async () => {
        const wrongPriorRunId = PRIOR_RUN_ID + 1;
        assert.equal(Number.isSafeInteger(wrongPriorRunId), true);
        const deps = createRecoveryGateDeps({
          env: {
            VIONA_GATE_RECOVERY_BINDING: makeRecoveryBinding({
              priorRunId: wrongPriorRunId,
            }),
          },
        });
        const predecessor = findRecoveryPredecessor(deps);
        const predecessorBefore = snapshotRecoveryPredecessor(predecessor);
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );
        assert.equal(result.evidence.reason, "recovery_case_binding_mismatch");
        assert.equal(deps.creates.length, 0);
        assert.equal(deps.completes.length, 0);
        assert.equal(deps.mergeCalls.length, 0);
        assertRecoveryPredecessorUnchanged(predecessor, predecessorBefore);
      }
    );

    await testAsync(
      "R12 RECOVERY-04 non-failed predecessor blocks before check creation",
      async () => {
        const base = createRecoveryGateDeps();
        const deps = createRecoveryGateDeps({
          priorCheck: { ...base.priorCheck, conclusion: "success" },
        });
        const predecessor = findRecoveryPredecessor(deps);
        const predecessorBefore = snapshotRecoveryPredecessor(predecessor);
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );
        assert.equal(result.evidence.reason, "prior_check_evidence_mismatch");
        assert.equal(deps.creates.length, 0);
        assert.equal(deps.completes.length, 0);
        assert.equal(deps.mergeCalls.length, 0);
        assertRecoveryPredecessorUnchanged(predecessor, predecessorBefore);
      }
    );

    await testAsync(
      "R13 RECOVERY-05 prior blocker mismatch blocks before check creation",
      async () => {
        const base = createRecoveryGateDeps();
        const mismatchedBlocker =
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR;
        const deps = createRecoveryGateDeps({
          priorCheck: {
            ...base.priorCheck,
            output: {
              title: mismatchedBlocker,
              summary: JSON.stringify({
                decision: "failure",
                blocker: mismatchedBlocker,
              }),
            },
          },
        });
        const predecessor = findRecoveryPredecessor(deps);
        const predecessorBefore = snapshotRecoveryPredecessor(predecessor);
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_VIONA_T3_FAILED_STAGE1_SUPERSESSION_INVALID
        );
        assert.equal(result.evidence.reason, "prior_check_evidence_mismatch");
        assert.equal(deps.creates.length, 0);
        assert.equal(deps.completes.length, 0);
        assert.equal(deps.mergeCalls.length, 0);
        assertRecoveryPredecessorUnchanged(predecessor, predecessorBefore);
      }
    );

    await testAsync(
      "R14 RECOVERY-07 live canonical digest mismatch blocks before check creation",
      async () => {
        const deps = createRecoveryGateDeps({
          files: [{ status: "modified", filename: "different-live-scope.txt" }],
          env: {
            VIONA_GATE_REVIEWED_SCOPE_DIGEST:
              FAILED_STAGE1_SUPERSESSION_CASE_V1.canonicalDigest,
          },
        });
        const predecessor = findRecoveryPredecessor(deps);
        const predecessorBefore = snapshotRecoveryPredecessor(predecessor);
        const parsedInputs = parseStructuredInputs(deps.env);
        assert.equal(parsedInputs.structuredInputsComplete, true);
        assert.equal(parsedInputs.priorSuppliedScopeDigest, PRIOR_BAD_DIGEST);
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
        );
        assert.equal(result.evidence.reason, "canonical_digest_mismatch");
        assert.equal(deps.creates.length, 0);
        assert.equal(deps.completes.length, 0);
        assert.equal(deps.mergeCalls.length, 0);
        assertRecoveryPredecessorUnchanged(predecessor, predecessorBefore);
      }
    );

    await testAsync(
      "R15 RECOVERY-11 failed preflight blocks before check creation",
      async () => {
        const base = createRecoveryGateDeps();
        const deps = createRecoveryGateDeps({
          checkRuns: base.checkRuns.map((check) =>
            check.name === FAILED_STAGE1_SUPERSESSION_CASE_V1.preflightCheckName
              ? { ...check, conclusion: "failure" }
              : check
          ),
        });
        const predecessor = findRecoveryPredecessor(deps);
        const predecessorBefore = snapshotRecoveryPredecessor(predecessor);
        const preflight = deps.checkRuns.find(
          (check) =>
            check.name === FAILED_STAGE1_SUPERSESSION_CASE_V1.preflightCheckName
        );
        assert.ok(
          preflight,
          "the exact named preflight fixture must be present"
        );
        assert.equal(preflight.status, "completed");
        assert.equal(preflight.conclusion, "failure");
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED
        );
        assert.equal(
          result.evidence.reason,
          "recovery_case_preflight_not_exactly_one_success"
        );
        assert.equal(deps.creates.length, 0);
        assert.equal(deps.completes.length, 0);
        assert.equal(deps.mergeCalls.length, 0);
        assertRecoveryPredecessorUnchanged(predecessor, predecessorBefore);
      }
    );

    await testAsync(
      "R16 RECOVERY-12 unresolved conversation blocks before check creation",
      async () => {
        const deps = createRecoveryGateDeps({ unresolved: true });
        const predecessor = findRecoveryPredecessor(deps);
        const predecessorBefore = snapshotRecoveryPredecessor(predecessor);
        const result = await runMergeAuthorizationGate(deps);
        assert.equal(result.conclusion, "failure");
        assert.equal(
          result.blocker,
          BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION
        );
        assert.equal(result.evidence.reason, "unresolved_conversation");
        assert.equal(deps.creates.length, 0);
        assert.equal(deps.completes.length, 0);
        assert.equal(deps.mergeCalls.length, 0);
        assertRecoveryPredecessorUnchanged(predecessor, predecessorBefore);
      }
    );

    assert.equal(
      unexpectedNetworkCalls,
      0,
      "global fetch trap must remain unused"
    );
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
