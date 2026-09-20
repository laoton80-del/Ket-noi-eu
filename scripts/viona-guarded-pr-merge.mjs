/**
 * Viona Guarded PR Merge Wrapper
 *
 * REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY
 * GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH
 *
 * Default: DRY-RUN (zero merge mutation).
 * Actual merge requires explicit --execute and passes every verification.
 * Wrapper cannot manufacture gate success, alter protection, or admin-bypass.
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import {
  GATE_CHECK_RUN_NAME,
  CANONICAL_REPOSITORY,
  CANONICAL_BASE_BRANCH,
  CANONICAL_MERGE_MODE,
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  computeReviewedScopeDigest,
  sanitizeEvidence,
  BLOCKERS,
} from './viona-merge-authorization-gate.mjs';
import {
  STAGE2_CHECK_RUN_NAME,
  AUTHORIZATION_STATES,
  MERGE_RESULT_CLASSES,
  CANONICAL_FREEZE_SCOPE,
  GLOBAL_MERGE_FREEZE_STATE,
  RELEASED_FREEZE_SCOPE,
  LEDGER_REF,
  AUTHORIZED_ACTORS as STAGE2_AUTHORIZED_ACTORS,
  BLOCKERS as STAGE2_BLOCKERS,
  evaluateFreezeScopeForState,
  stage2BlockerForFreezeScopePolicy,
  evaluateAuthorizationLifecycleValidity,
  parseStage2Record,
  classifyMergeAttemptFailure,
  computeTargetKey,
  ledgerReadRecord,
  ledgerConditionalWriteRecord,
} from './viona-merge-explicit-authorization.mjs';

export {
  REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
  GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  GATE_CHECK_RUN_NAME,
  STAGE2_CHECK_RUN_NAME,
  AUTHORIZATION_STATES,
  MERGE_RESULT_CLASSES,
  CANONICAL_FREEZE_SCOPE,
  GLOBAL_MERGE_FREEZE_STATE,
  RELEASED_FREEZE_SCOPE,
  LEDGER_REF,
  evaluateFreezeScopeForState,
  stage2BlockerForFreezeScopePolicy,
  evaluateAuthorizationLifecycleValidity,
  parseStage2Record,
  classifyMergeAttemptFailure,
  computeTargetKey,
};

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

/**
 * Wrapper-local, informational-only result label (revision directive
 * LANE_B1.IMPLEMENTATION_REVISION.V1 §11/§12). This is NOT part of the
 * canonical STAGE2_BLOCKERS enum (frozen in
 * viona-merge-explicit-authorization.mjs, outside this lane's
 * modification allowlist) and is never written to the ledger record
 * schema — it exists solely so a caller/log can distinguish "the merge
 * itself failed" from the distinct, rarer "the merge succeeded but the
 * ledger could not be updated to reflect it" outcome, which requires
 * manual reconciliation rather than any retry or reactivation.
 */
const MERGE_SUCCEEDED_LEDGER_FINALIZATION_FAILED_BLOCKER =
  'MERGE_SUCCEEDED_LEDGER_FINALIZATION_FAILED_RECONCILIATION_REQUIRED';

export function parseGuardedMergeArgs(argv) {
  const out = {
    repo: null,
    pr: null,
    head: null,
    base: null,
    mode: null,
    reviewedScopeDigest: null,
    gateAppId: null,
    freezeScope: null,
    authorizationId: null,
    execute: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    switch (a) {
      case '--repo':
        out.repo = next;
        i += 1;
        break;
      case '--pr':
        out.pr = next;
        i += 1;
        break;
      case '--head':
        out.head = next;
        i += 1;
        break;
      case '--base':
        out.base = next;
        i += 1;
        break;
      case '--mode':
        out.mode = next;
        i += 1;
        break;
      case '--reviewed-scope-digest':
        out.reviewedScopeDigest = next;
        i += 1;
        break;
      case '--gate-app-id':
        out.gateAppId = next;
        i += 1;
        break;
      case '--freeze-scope':
        out.freezeScope = next;
        i += 1;
        break;
      case '--authorization-id':
        out.authorizationId = next;
        i += 1;
        break;
      case '--execute':
        out.execute = true;
        break;
      default:
        break;
    }
  }
  return out;
}

/**
 * Pure verification of guarded-merge preconditions.
 */
export function evaluateGuardedMerge(facts) {
  const evidence = sanitizeEvidence({
    repository: facts.repository,
    prNumber: facts.prNumber,
    headSha: facts.headSha,
    base: facts.base,
    mode: facts.mode,
    primaryEnforcement: REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
    wrapperRole: GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  });

  const fail = (blocker, extra = {}) => ({
    ok: false,
    blocker,
    evidence: { ...evidence, decision: 'blocked', blocker, ...extra },
  });

  if (facts.repository !== CANONICAL_REPOSITORY) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'repository_mismatch',
    });
  }

  if (facts.prMissing || facts.prState !== 'OPEN') {
    return fail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, {
      reason: facts.prMissing ? 'pr_missing' : 'pr_not_open',
    });
  }

  if (
    !FULL_SHA_RE.test(String(facts.headSha ?? '')) ||
    String(facts.headSha).toLowerCase() !== String(facts.actualHeadSha).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH);
  }

  if (facts.base !== CANONICAL_BASE_BRANCH || facts.actualBase !== CANONICAL_BASE_BRANCH) {
    return fail(BLOCKERS.BLOCKED_MERGE_BASE_BRANCH_MISMATCH);
  }

  if (facts.mode !== CANONICAL_MERGE_MODE) {
    return fail(BLOCKERS.BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH);
  }

  if (
    String(facts.computedReviewedScopeDigest).toLowerCase() !==
    String(facts.suppliedReviewedScopeDigest).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW);
  }

  if (facts.autoMergeActive === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTO_MERGE_ACTIVE);
  }

  if (facts.unresolvedConversation === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION);
  }

  if (facts.reviewSatisfied !== true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED);
  }

  if (facts.requiredCheckFailed === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED);
  }

  if (facts.gateCheckMissing === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED, { reason: 'gate_check_missing' });
  }

  if (facts.gateCheckStaleSha === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH, {
      reason: 'gate_check_stale_sha',
    });
  }

  if (facts.gateCheckConclusion !== 'success') {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED, {
      reason: 'gate_check_not_success',
    });
  }

  if (facts.duplicateConflictingGateContext === true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS);
  }

  if (facts.gateAppIdMissing === true || facts.gateAppId == null || facts.gateAppId === '') {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED, {
      reason: 'gate_app_id_missing',
    });
  }

  if (String(facts.gateAppId) !== String(facts.actualGateAppId)) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED, {
      reason: 'gate_app_id_mismatch',
    });
  }

  // --- Stage 2 (Viona Explicit Merge Authorization) — additive checks. ---
  // These checks are appended after every pre-existing Stage 1 / review /
  // digest / freeze check above and do not relax, remove, or reorder any of
  // them: a request that already fails an existing check above never
  // reaches this section (early-return guard-clause style is preserved).
  //
  // Enforcement is gated on `facts.stage2Required`, which the orchestrator
  // derives from the SAME live branch-protection `required_status_checks`
  // read already used for every other non-Stage-1 required context (see
  // the pre-existing `requiredContexts` loop in runGuardedPrMerge). This
  // mirrors the design's dormancy requirement (Two-Stage design §6 /
  // governance directive §6: "Stage 2 does not become a merge requirement
  // until separately-authorized B2") and preserves 100% backward
  // compatibility for callers/tests that predate Stage 2 and never populate
  // these facts (stage2Required defaults to falsy, so none of the checks
  // below fire and pre-existing behavior is completely unchanged).
  if (facts.stage2Required === true) {
    if (facts.stage2CheckMissing === true) {
      return fail(STAGE2_BLOCKERS.BLOCKED_STAGE2_CHECK_MISSING);
    }
    if (facts.stage2CheckConclusion !== 'success') {
      return fail(STAGE2_BLOCKERS.BLOCKED_STAGE2_CHECK_NOT_SUCCESS);
    }
    // Directive §18: "check success without matching valid ledger state
    // = INVALID." The check run's declared target_key/ledger_ref (its
    // PROJECTION) must exactly match what the wrapper independently
    // computed from LIVE facts before the ledger (the sole authority) is
    // even consulted.
    if (facts.stage2TargetKeyMismatch === true) {
      return fail(STAGE2_BLOCKERS.BLOCKED_STAGE2_LEDGER_TARGET_KEY_MISMATCH);
    }
    if (facts.stage2LifecycleOk !== true) {
      return fail(facts.stage2LifecycleBlocker ?? STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_ACTIVE);
    }
    const freezePolicy = evaluateFreezeScopeForState({
      freezeState: GLOBAL_MERGE_FREEZE_STATE,
      freezeScope: facts.freezeScope,
    });
    if (!freezePolicy.ok) {
      return fail(stage2BlockerForFreezeScopePolicy(freezePolicy));
    }
    if (!STAGE2_AUTHORIZED_ACTORS.includes(facts.stage2RecordAuthorizedBy)) {
      return fail(STAGE2_BLOCKERS.BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED);
    }
    if (
      facts.authorizationId != null &&
      facts.stage2RecordAuthorizationId != null &&
      String(facts.authorizationId) !== String(facts.stage2RecordAuthorizationId)
    ) {
      return fail(STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND, {
        reason: 'authorization_id_mismatch',
      });
    }
  }

  return {
    ok: true,
    blocker: null,
    evidence: { ...evidence, decision: 'verified', blocker: null },
  };
}

async function listAllPrFiles(deps, owner, repo, prNumber) {
  const files = [];
  let page = 1;
  for (;;) {
    const batch = await deps.restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
    });
    const items = Array.isArray(batch) ? batch : [];
    files.push(...items);
    if (items.length < 100) break;
    page += 1;
  }
  return files;
}

export async function runGuardedPrMerge(deps) {
  const args = deps.args ?? parseGuardedMergeArgs(deps.argv ?? []);
  const mergeCalls = [];
  const checkRunCreates = [];
  const protectionMutations = [];

  const restRequest = async (req) => {
    if (/\/merges$|\/merge$/.test(req.urlPath) && req.method === 'PUT') {
      mergeCalls.push(req);
    }
    if (/\/check-runs$/.test(req.urlPath) && req.method === 'POST') {
      checkRunCreates.push(req);
    }
    if (/\/protection/.test(req.urlPath) && ['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      protectionMutations.push(req);
    }
    return deps.restRequest(req);
  };

  const [owner, repoName] = CANONICAL_REPOSITORY.split('/');
  let pr = null;
  let prMissing = true;
  try {
    pr = await restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}`,
    });
    prMissing = !pr || pr.message === 'Not Found';
  } catch {
    prMissing = true;
  }

  let files = [];
  if (!prMissing) {
    files = await listAllPrFiles({ restRequest }, owner, repoName, args.pr);
  }
  const computedDigest = computeReviewedScopeDigest(files);

  let unresolvedConversation = false;
  if (!prMissing && deps.graphqlRequest) {
    try {
      const gql = await deps.graphqlRequest({
        query: `query($owner:String!,$repo:String!,$number:Int!){
          repository(owner:$owner,name:$repo){
            pullRequest(number:$number){
              reviewThreads(first:100){ nodes { isResolved } }
            }
          }
        }`,
        variables: { owner, repo: repoName, number: Number(args.pr) },
      });
      const threads = gql?.data?.repository?.pullRequest?.reviewThreads?.nodes ?? [];
      unresolvedConversation = threads.some((t) => t && t.isResolved === false);
    } catch {
      unresolvedConversation = true;
    }
  }

  let reviews = [];
  if (!prMissing) {
    try {
      reviews = await restRequest({
        method: 'GET',
        urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}/reviews`,
      });
    } catch {
      reviews = [];
    }
  }
  const reviewSatisfied = Array.isArray(reviews) && reviews.some((r) => r.state === 'APPROVED');

  let requiredCheckFailed = false;
  let gateCheckMissing = true;
  let gateCheckStaleSha = false;
  let gateCheckConclusion = null;
  let actualGateAppId = null;
  let duplicateConflictingGateContext = false;

  // Stage 2 (Viona Explicit Merge Authorization) facts — dormant during
  // Lane B1 (no branch protection requires this context yet), but the
  // wrapper's recheck logic is implemented now so it is ready without
  // further code change once Lane B2 makes it required.
  //
  // Directive V2 §10/§18: the LEDGER (not the check run) is authoritative.
  // The check run is consulted only for its PROJECTION (authorization_id /
  // target_key / ledger_ref / ledger_path / head_sha / expires_at) — a
  // pointer to where the real record lives, independently cross-checked
  // against a target_key the wrapper computes itself from live facts.
  let stage2CheckMissing = true;
  let stage2CheckConclusion = null;
  let stage2Record = null;
  let stage2TargetKey = null;
  let stage2TargetKeyMismatch = false;
  let stage2LifecycleOk = false;
  let stage2LifecycleBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_CHECK_MISSING;
  let stage2Required = false;

  if (!prMissing && pr?.head?.sha) {
    const checks = await restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repoName}/commits/${pr.head.sha}/check-runs`,
    });
    const checkRuns = [...(checks?.check_runs ?? []), ...(deps.extraCheckRuns ?? [])];
    const gateOnHead = checkRuns.filter(
      (c) =>
        c.name === GATE_CHECK_RUN_NAME &&
        String(c.head_sha).toLowerCase() === String(pr.head.sha).toLowerCase(),
    );
    const gateOther = checkRuns.filter(
      (c) =>
        c.name === GATE_CHECK_RUN_NAME &&
        String(c.head_sha).toLowerCase() !== String(pr.head.sha).toLowerCase(),
    );
    if (gateOther.some((c) => c.conclusion === 'success')) {
      // conflicting success elsewhere is noted but does not satisfy current head
      void gateOther;
    }
    const aliases = checkRuns.filter(
      (c) =>
        typeof c.name === 'string' &&
        c.name !== GATE_CHECK_RUN_NAME &&
        c.name.startsWith(GATE_CHECK_RUN_NAME),
    );
    if (aliases.length > 0) duplicateConflictingGateContext = true;
    if (deps.forceDuplicateConflictingGateContext === true) {
      duplicateConflictingGateContext = true;
    }

    if (gateOnHead.length === 0) {
      gateCheckMissing = true;
      if (checkRuns.some((c) => c.name === GATE_CHECK_RUN_NAME)) {
        gateCheckStaleSha = true;
      }
    } else {
      gateCheckMissing = false;
      const success = gateOnHead.find((c) => c.conclusion === 'success');
      gateCheckConclusion = success?.conclusion ?? gateOnHead[0]?.conclusion ?? null;
      actualGateAppId = success?.app?.id ?? gateOnHead[0]?.app?.id ?? null;
    }

    const protection = await restRequest({
      method: 'GET',
      urlPath: `/repos/${owner}/${repoName}/branches/master/protection`,
    });
    const requiredContexts = protection?.required_status_checks?.contexts ?? [];
    // Stage 2 is dormant/non-required by default (design §6). Enforcement
    // in this wrapper turns on only once (and if) branch protection itself
    // lists STAGE2_CHECK_RUN_NAME as required — the exact same live signal
    // already used for every other non-Stage-1 required context below.
    // This keeps pre-Stage-2 callers/tests (which never list it) on the
    // unchanged legacy path while making the wrapper immediately correct
    // the moment Lane B2 adds the context, with no further code change.
    stage2Required = requiredContexts.includes(STAGE2_CHECK_RUN_NAME);
    for (const ctx of requiredContexts) {
      if (ctx === GATE_CHECK_RUN_NAME || ctx === STAGE2_CHECK_RUN_NAME) continue;
      const onHead = checkRuns.filter(
        (c) =>
          c.name === ctx &&
          String(c.head_sha).toLowerCase() === String(pr.head.sha).toLowerCase(),
      );
      if (!onHead.some((c) => c.conclusion === 'success')) {
        requiredCheckFailed = true;
      }
    }

    // Stage 2: reuse the SAME check-runs list fetched above — no extra API
    // call, and no second incompatible lookup definition.
    const stage2OnHead = checkRuns.filter(
      (c) =>
        c.name === STAGE2_CHECK_RUN_NAME &&
        String(c.head_sha).toLowerCase() === String(pr.head.sha).toLowerCase(),
    );
    if (stage2OnHead.length === 0) {
      stage2CheckMissing = true;
      stage2LifecycleBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_CHECK_MISSING;
    } else {
      stage2CheckMissing = false;
      const success = stage2OnHead.find((c) => c.conclusion === 'success') ?? stage2OnHead[0];
      stage2CheckConclusion = success?.conclusion ?? null;
      const projection = parseStage2Record(success);

      // Independently compute the target_key from LIVE facts — never trust
      // the check run's own claim of which ledger record it refers to
      // (directive §18: "check success without matching valid ledger state
      // = INVALID").
      stage2TargetKey = computeTargetKey({
        repository: CANONICAL_REPOSITORY,
        prNumber: args.pr,
        headSha: pr.head.sha,
        baseBranch: args.base,
        mergeMode: args.mode,
        reviewedScopeDigest: computedDigest,
      });
      stage2TargetKeyMismatch =
        !projection ||
        projection.target_key !== stage2TargetKey ||
        projection.ledger_ref !== LEDGER_REF ||
        String(projection.head_sha ?? '').toLowerCase() !== String(pr.head.sha).toLowerCase();

      if (!stage2TargetKeyMismatch) {
        let ledgerLookup;
        try {
          ledgerLookup = await ledgerReadRecord({ restRequest }, stage2TargetKey);
        } catch {
          ledgerLookup = { record: null, blobSha: null };
        }
        stage2Record = ledgerLookup.record;
        const lifecycle = evaluateAuthorizationLifecycleValidity({
          record: stage2Record,
          expected: {
            repository: CANONICAL_REPOSITORY,
            headSha: pr.head.sha,
            prNumber: args.pr,
            reviewedScopeDigest: computedDigest,
            mergeMode: args.mode,
            prClosed: pr?.state !== 'open',
          },
          nowMs: typeof deps.nowMs === 'function' ? deps.nowMs() : Date.now(),
        });
        stage2LifecycleOk = lifecycle.ok;
        stage2LifecycleBlocker = lifecycle.blocker ?? null;
      }
    }
  }

  if (deps.forceFacts) {
    // applied after construction below
  }

  const facts = {
    repository: args.repo,
    prNumber: args.pr,
    prMissing,
    prState: prMissing ? null : pr?.state === 'open' ? 'OPEN' : String(pr?.state ?? '').toUpperCase(),
    headSha: args.head,
    actualHeadSha: pr?.head?.sha ?? null,
    base: args.base,
    actualBase: pr?.base?.ref ?? null,
    mode: args.mode,
    computedReviewedScopeDigest: computedDigest,
    suppliedReviewedScopeDigest: args.reviewedScopeDigest,
    autoMergeActive: Boolean(pr?.auto_merge),
    unresolvedConversation,
    reviewSatisfied,
    requiredCheckFailed,
    gateCheckMissing,
    gateCheckStaleSha,
    gateCheckConclusion,
    duplicateConflictingGateContext,
    gateAppIdMissing: args.gateAppId == null || args.gateAppId === '',
    gateAppId: args.gateAppId,
    actualGateAppId,
    stage2Required,
    stage2CheckMissing,
    stage2CheckConclusion,
    stage2TargetKeyMismatch,
    stage2LifecycleOk,
    stage2LifecycleBlocker,
    freezeScope: args.freezeScope,
    authorizationId: args.authorizationId,
    stage2RecordAuthorizedBy: stage2Record?.authorized_by ?? null,
    stage2RecordAuthorizationId: stage2Record?.authorization_id ?? null,
  };

  if (deps.forceFacts) Object.assign(facts, deps.forceFacts);

  const verification = evaluateGuardedMerge(facts);
  const result = {
    ...verification,
    executeRequested: args.execute === true,
    mergeCalls,
    checkRunCreates,
    protectionMutations,
    mergeInvoked: false,
  };

  if (!verification.ok) {
    deps.log?.(JSON.stringify(sanitizeEvidence(result.evidence)));
    return result;
  }

  if (!args.execute) {
    deps.log?.(JSON.stringify(sanitizeEvidence({ ...result.evidence, dryRun: true })));
    return result;
  }

  // Re-verify immediately before merge (same facts path; deps may re-query)
  const reverify = evaluateGuardedMerge(facts);
  if (!reverify.ok) {
    deps.log?.(JSON.stringify(sanitizeEvidence(reverify.evidence)));
    return { ...result, ...reverify, mergeInvoked: false };
  }

  if (!stage2Required) {
    // Legacy path: Stage 2 is dormant / not yet required by branch
    // protection (design §6). Preserves the exact pre-Stage-2 wrapper
    // behavior — a single merge API call, no claim/consumption
    // bookkeeping — for callers operating before Lane B2 activates Stage 2.
    await restRequest({
      method: 'PUT',
      urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}/merge`,
      body: {
        merge_method: 'squash',
        sha: pr.head.sha,
      },
    });
    result.mergeInvoked = true;
    result.mergeCalls = mergeCalls;
    deps.log?.(JSON.stringify(sanitizeEvidence({ ...result.evidence, mergeInvoked: true })));
    return result;
  }

  // --- Atomic claim / merge / record (design §4.3, §4.4; directive V2
  // §13, §14, §20) ---
  // Exact required ordering: VERIFY -> LEDGER CAS CLAIM -> MERGE ->
  // LEDGER CAS RECORD RESULT. VERIFY → MERGE → MARK-CONSUMED-LATER is
  // explicitly forbidden by the design and is not implemented here.
  //
  // The check-run is NOT the claim primitive (directive §20 — this
  // replaces the Lane B1 check-run-PATCH claim entirely). The claim is a
  // sha-conditional PUT against the authoritative ledger record: GitHub's
  // Contents API rejects (409/422) a write whose supplied `sha` no longer
  // matches the file's current blob sha — a genuine, server-enforced
  // compare-and-swap. Exactly one concurrent caller's conditional PUT can
  // succeed for a given blob sha; every other concurrent caller observes
  // the rejection and MUST fail closed immediately, with no retry-to-win
  // (directive §13, §14).
  const nowIso = new Date(typeof deps.nowMs === 'function' ? deps.nowMs() : Date.now()).toISOString();

  let reread;
  try {
    reread = await ledgerReadRecord({ restRequest }, stage2TargetKey);
  } catch {
    return {
      ...result,
      ok: false,
      blocker: STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND,
      mergeInvoked: false,
      claimed: false,
    };
  }
  const rereadRecord = reread.record;
  const rereadBlobSha = reread.blobSha;
  const rereadValidity = evaluateAuthorizationLifecycleValidity({
    record: rereadRecord,
    expected: {
      repository: CANONICAL_REPOSITORY,
      headSha: pr.head.sha,
      prNumber: args.pr,
      reviewedScopeDigest: computedDigest,
      mergeMode: args.mode,
      prClosed: pr?.state !== 'open',
    },
    nowMs: typeof deps.nowMs === 'function' ? deps.nowMs() : Date.now(),
  });
  if (!rereadValidity.ok) {
    deps.log?.(JSON.stringify(sanitizeEvidence(rereadValidity.evidence)));
    return { ...result, ok: false, blocker: rereadValidity.blocker, mergeInvoked: false, claimed: false };
  }

  // CLAIM: ACTIVE -> CONSUMING via ledger sha-conditional PUT (single
  // successful claim per authorization_id — directive §13/§14).
  const claimRecord = {
    ...rereadRecord,
    state: AUTHORIZATION_STATES.CONSUMING,
    consumption_started_at: nowIso,
    last_transition_at: nowIso,
    last_transition_actor: facts.stage2RecordAuthorizedBy ?? null,
  };
  const claim = await ledgerConditionalWriteRecord(
    { restRequest },
    {
      targetKey: stage2TargetKey,
      record: claimRecord,
      expectedBlobSha: rereadBlobSha,
      message: `viona-ledger: CONSUMING ${claimRecord.authorization_id} pr#${args.pr}`,
    },
  );
  if (!claim.ok) {
    // Stale sha: another caller's conditional write already landed first.
    // Fail closed immediately — never retry-to-win, never call the merge
    // API (directive §13, §14).
    deps.log?.(
      JSON.stringify(sanitizeEvidence({ ...result.evidence, mergeInvoked: false, ledgerClaim: 'stale_sha' })),
    );
    return {
      ...result,
      ok: false,
      blocker: STAGE2_BLOCKERS.BLOCKED_STAGE2_LEDGER_WRITE_CONFLICT,
      mergeInvoked: false,
      claimed: false,
    };
  }
  const currentBlobSha = claim.blobSha;

  // MERGE: exactly one GitHub merge API call.
  let mergeResponse;
  try {
    mergeResponse = await restRequest({
      method: 'PUT',
      urlPath: `/repos/${owner}/${repoName}/pulls/${args.pr}/merge`,
      body: {
        merge_method: 'squash',
        sha: pr.head.sha,
      },
    });
  } catch (err) {
    const mergeResultClass = classifyMergeAttemptFailure(err);
    const recoveryNowMs = typeof deps.nowMs === 'function' ? deps.nowMs() : Date.now();
    const recoveryAtIso = new Date(recoveryNowMs).toISOString();
    let revertedState = AUTHORIZATION_STATES.CONSUMING;
    let resultBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_MERGE_RESULT_UNKNOWN_RECONCILIATION_REQUIRED;

    if (mergeResultClass === MERGE_RESULT_CLASSES.SAFE_RETRYABLE_FAILURE) {
      // Revision directive LANE_B1.IMPLEMENTATION_REVISION.V1 §4/§5/§18 +
      // design §4.5: a SAFE_RETRYABLE_FAILURE may transition CONSUMING back
      // to ACTIVE ONLY if the authorization's binding conditions and
      // expiry are RE-VERIFIED as still valid AT RECOVERY TIME — never
      // unconditionally. Reuse the SAME canonical
      // evaluateAuthorizationLifecycleValidity(...) predicate already used
      // for VERIFY/CLAIM (no second lifecycle-validity definition is
      // introduced): feed it the claimed record as if it were ACTIVE again
      // so its state/expiry/head/base/digest/mode/freeze-exception checks
      // run exactly as they would for a fresh claim attempt. Because this
      // wrapper is the exclusive CAS holder of `claimRecord` from CLAIM
      // through this recovery decision (no other writer can touch a
      // CONSUMING record's blob sha without first winning a conditional
      // write this holder still possesses), claimRecord's own
      // revoked_at/freeze-state fields are still authoritative and are
      // re-checked unchanged by this same call.
      const recoveryValidity = evaluateAuthorizationLifecycleValidity({
        record: { ...claimRecord, state: AUTHORIZATION_STATES.ACTIVE },
        expected: {
          repository: CANONICAL_REPOSITORY,
          headSha: pr.head.sha,
          prNumber: args.pr,
          reviewedScopeDigest: computedDigest,
          mergeMode: args.mode,
          prClosed: pr?.state !== 'open',
        },
        nowMs: recoveryNowMs,
      });
      if (recoveryValidity.ok) {
        // Case A (directive §5): still valid and unexpired — the only
        // case where reactivation is permitted.
        revertedState = AUTHORIZATION_STATES.ACTIVE;
        resultBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_ACTIVE;
      } else if (recoveryValidity.blocker === STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_EXPIRED) {
        // Case B (directive §5): expired — never reactivate.
        revertedState = AUTHORIZATION_STATES.EXPIRED;
        resultBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_EXPIRED;
      } else {
        // Case C (directive §5) + fail-closed default (directive §6): any
        // other outcome — binding mismatch, freeze-exception invalidation,
        // or unresolved ambiguity — is treated as INVALIDATED, never
        // reactivated. No new lifecycle state is introduced.
        revertedState = AUTHORIZATION_STATES.INVALIDATED;
        resultBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_INVALIDATED;
      }
    } else if (mergeResultClass === MERGE_RESULT_CLASSES.NON_RETRYABLE_FAILURE) {
      revertedState = AUTHORIZATION_STATES.INVALIDATED;
      resultBlocker = STAGE2_BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_INVALIDATED;
    }
    // MERGE_RESULT_UNKNOWN: revertedState is left at CONSUMING — no blind
    // retry, no assumed failure, no authority reissue (design §4.5/§4.6;
    // directive §15/§16 — CONSUMING must never auto-revert). Read-only
    // reconciliation against live GitHub state is required before any
    // further claim on this or any other authorization for this target.
    if (revertedState !== AUTHORIZATION_STATES.CONSUMING) {
      try {
        await ledgerConditionalWriteRecord(
          { restRequest },
          {
            targetKey: stage2TargetKey,
            record: { ...claimRecord, state: revertedState, last_transition_at: recoveryAtIso },
            expectedBlobSha: currentBlobSha,
            message: `viona-ledger: ${revertedState} ${claimRecord.authorization_id} pr#${args.pr}`,
          },
        );
      } catch {
        // Best-effort revert write; if it fails the record simply remains
        // held at CONSUMING pending manual reconciliation — never silently
        // treated as re-usable (directive §16). This CAS write still uses
        // `expectedBlobSha: currentBlobSha` (the sha observed at claim
        // time) — the CAS model is not weakened by this revision.
      }
    }
    deps.log?.(
      JSON.stringify(
        sanitizeEvidence({ ...result.evidence, mergeInvoked: false, mergeResultClass, revertedState }),
      ),
    );
    return {
      ...result,
      ok: false,
      blocker: resultBlocker,
      mergeInvoked: false,
      mergeResultClass,
    };
  }

  // RECORD: CONSUMING -> CONSUMED via ledger sha-conditional PUT (atomic
  // completion of the claim; directive §13, §16). The merge has ALREADY
  // succeeded (an irreversible GitHub-side mutation) by this point, so a
  // failure of THIS specific write (revision directive
  // LANE_B1.IMPLEMENTATION_REVISION.V1 §11/§12) must never be treated as
  // "merge failed", must never trigger a second merge call, and must never
  // reactivate authority — it is surfaced as its own distinct outcome
  // (MERGE SUCCEEDED / LEDGER FINALIZATION FAILED) requiring manual
  // reconciliation, with the record simply remaining at the CONSUMING
  // state it already holds.
  let finalizeWrite;
  try {
    finalizeWrite = await ledgerConditionalWriteRecord(
      { restRequest },
      {
        targetKey: stage2TargetKey,
        record: {
          ...claimRecord,
          state: AUTHORIZATION_STATES.CONSUMED,
          consumed_at: nowIso,
          consumed_by: facts.stage2RecordAuthorizedBy ?? null,
          merge_commit_sha: mergeResponse?.sha ?? null,
          last_transition_at: nowIso,
        },
        expectedBlobSha: currentBlobSha,
        message: `viona-ledger: CONSUMED ${claimRecord.authorization_id} pr#${args.pr}`,
      },
    );
  } catch {
    finalizeWrite = { ok: false, reason: 'ledger_finalization_technical_error' };
  }

  result.mergeInvoked = true;
  result.mergeCalls = mergeCalls;

  if (!finalizeWrite?.ok) {
    result.ok = false;
    result.blocker = MERGE_SUCCEEDED_LEDGER_FINALIZATION_FAILED_BLOCKER;
    result.mergeSucceededLedgerFinalizationFailed = true;
    result.mergeResultClass = null;
    deps.log?.(
      JSON.stringify(
        sanitizeEvidence({
          ...result.evidence,
          mergeInvoked: true,
          mergeSucceededLedgerFinalizationFailed: true,
          mergeCommitSha: mergeResponse?.sha ?? null,
        }),
      ),
    );
    return result;
  }

  deps.log?.(JSON.stringify(sanitizeEvidence({ ...result.evidence, mergeInvoked: true })));
  return result;
}

export function createProductionDeps(env = process.env) {
  const token = env.GITHUB_TOKEN;
  const apiBase = 'https://api.github.com';

  async function restRequest({ method, urlPath, body }) {
    const res = await fetch(`${apiBase}${urlPath}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { message: 'unparseable_response' };
    }
    if (!res.ok) {
      const err = new Error(`GitHub REST ${res.status}`);
      err.sanitized = { status: res.status, message: json?.message ?? 'error' };
      throw err;
    }
    return json;
  }

  async function graphqlRequest({ query, variables }) {
    const res = await fetch(`${apiBase}/graphql`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  }

  return {
    env,
    restRequest,
    graphqlRequest,
    log: (msg) => console.log(msg),
  };
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href;
  } catch {
    return false;
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const deps = createProductionDeps(env);
  deps.argv = argv;
  const result = await runGuardedPrMerge(deps);
  if (!result.ok) process.exitCode = 1;
  return result;
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(JSON.stringify({ error: 'guarded_merge_failed', message: err?.sanitized?.message ?? 'error' }));
    process.exitCode = 1;
  });
}
