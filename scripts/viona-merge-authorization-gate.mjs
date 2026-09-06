/**
 * Viona Merge Authorization Gate
 *
 * REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY
 * GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH
 *
 * Authentic provenance:
 *   VERIFIED ACTOR-ALLOWLISTED GITHUB WORKFLOW_DISPATCH RECORD
 *
 * Reviewed-scope digest:
 *   status<TAB>filename<TAB>previous_filename-or-empty
 *   sort by filename; join LF; SHA-256 lowercase hex
 *
 * Check creation requires minimum provenance first.
 * Canonical workflow version is proven via independent GETs (run ID lookup key only).
 * Head activation: exact-head APPROVED review submitted_at <= run.created_at + snapshot A/B.
 */

import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY =
  'REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY';
export const GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH =
  'GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH';

export const GATE_CHECK_RUN_NAME = 'Viona Merge Authorization Gate';
export const WORKFLOW_FILE_PATH = '.github/workflows/viona-merge-authorization-gate.yml';
export const WORKFLOW_DISPLAY_NAME = 'Viona Merge Authorization Gate Dispatcher';
export const JOB_ID = 'evaluate_merge_authorization';
export const JOB_DISPLAY_NAME = 'Evaluate Viona Merge Authorization Gate';
export const GATE_SCRIPT_PATH = 'scripts/viona-merge-authorization-gate.mjs';
export const CANONICAL_REPOSITORY = 'laoton80-del/Ket-noi-eu';
export const CANONICAL_BASE_BRANCH = 'master';
export const CANONICAL_MERGE_MODE = 'squash';
export const CANONICAL_AUTHORITY = 'MERGE';
export const CANONICAL_FREEZE_SCOPE =
  'FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY';
export const AUTHORIZED_ACTORS = Object.freeze(['laoton80-del']);
export const ALLOWED_WORKFLOW_PERMISSIONS = Object.freeze([
  'contents: read',
  'pull-requests: read',
  'checks: write',
]);
export const FORBIDDEN_WORKFLOW_PERMISSIONS = Object.freeze([
  'contents: write',
  'pull-requests: write',
  'statuses: write',
  'actions: write',
  'deployments: write',
  'packages: write',
  'id-token: write',
]);

export const BLOCKERS = Object.freeze({
  BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED:
    'BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED',
  BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH: 'BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH',
  BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH:
    'BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH',
  BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH:
    'BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH',
  BLOCKED_MERGE_BASE_BRANCH_MISMATCH: 'BLOCKED_MERGE_BASE_BRANCH_MISMATCH',
  BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW:
    'BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW',
  BLOCKED_MERGE_REQUIRED_CHECK_FAILED: 'BLOCKED_MERGE_REQUIRED_CHECK_FAILED',
  BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED:
    'BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED',
  BLOCKED_MERGE_UNRESOLVED_CONVERSATION: 'BLOCKED_MERGE_UNRESOLVED_CONVERSATION',
  BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED: 'BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED',
  BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING:
    'BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING',
  BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD:
    'BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD',
  BLOCKED_MERGE_AUTO_MERGE_ACTIVE: 'BLOCKED_MERGE_AUTO_MERGE_ACTIVE',
  BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED:
    'BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED',
  BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED:
    'BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED',
  BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS:
    'BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS',
  BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED:
    'BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED',
  BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE:
    'BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE',
  BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED:
    'BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED',
  BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN:
    'BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN',
  BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN:
    'BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN',
  BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS:
    'BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS',
  BLOCKED_VIONA_T3_CHECK_CREATED_BEFORE_MINIMUM_PROVENANCE:
    'BLOCKED_VIONA_T3_CHECK_CREATED_BEFORE_MINIMUM_PROVENANCE',
  BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR: 'BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR',
});

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;
const FORBIDDEN_INPUT_KEYS = Object.freeze(['authorization', 'authorized_operator']);

export function computeReviewedScopeDigest(files) {
  const records = (files ?? []).map((f) => {
    const status = String(f.status ?? '');
    const filename = String(f.filename ?? '');
    const previous = String(f.previous_filename ?? f.previousFilename ?? '');
    return { filename, line: `${status}\t${filename}\t${previous}` };
  });
  records.sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0));
  return createHash('sha256').update(records.map((r) => r.line).join('\n'), 'utf8').digest('hex');
}

export function sanitizeEvidence(evidence) {
  const out = { ...(evidence ?? {}) };
  for (const k of Object.keys(out)) {
    const lk = k.toLowerCase();
    if (
      lk.includes('token') ||
      lk.includes('authorization') ||
      lk.includes('header') ||
      lk === 'github_token' ||
      lk === 'gh_token'
    ) {
      delete out[k];
    }
  }
  return out;
}

export function assertPermissionScope(permissionLines) {
  const lines = (permissionLines ?? []).map((l) => String(l).trim().toLowerCase());
  for (const forbidden of FORBIDDEN_WORKFLOW_PERMISSIONS) {
    if (lines.includes(forbidden.toLowerCase())) {
      return { ok: false, blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE };
    }
  }
  for (const r of ['contents: read', 'pull-requests: read', 'checks: write']) {
    if (!lines.includes(r.toLowerCase())) {
      return { ok: false, blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE };
    }
  }
  return { ok: true };
}

export function parseStructuredInputs(env) {
  const unexpected = [];
  for (const key of FORBIDDEN_INPUT_KEYS) {
    const envKey = `VIONA_GATE_${key.toUpperCase()}`;
    if (env[envKey] != null && String(env[envKey]).length > 0) unexpected.push(key);
  }
  const prRaw = env.VIONA_GATE_PR_NUMBER;
  const headSha = env.VIONA_GATE_HEAD_SHA;
  const baseBranch = env.VIONA_GATE_BASE_BRANCH;
  const mergeMode = env.VIONA_GATE_MERGE_MODE;
  const authority = env.VIONA_GATE_AUTHORITY;
  const freezeScope = env.VIONA_GATE_FREEZE_SCOPE;
  const reviewedScopeDigest = env.VIONA_GATE_REVIEWED_SCOPE_DIGEST;
  const missing = [];
  for (const [name, value] of [
    ['pr_number', prRaw],
    ['head_sha', headSha],
    ['base_branch', baseBranch],
    ['merge_mode', mergeMode],
    ['authority', authority],
    ['freeze_scope', freezeScope],
    ['reviewed_scope_digest', reviewedScopeDigest],
  ]) {
    if (value == null || String(value).trim() === '') missing.push(name);
  }
  const prNumberMalformed =
    prRaw == null || !/^\d+$/.test(String(prRaw).trim()) || Number(prRaw) <= 0;
  const headShaMalformed = headSha == null || !FULL_SHA_RE.test(String(headSha));
  return {
    prNumber: prNumberMalformed ? prRaw : Number(prRaw),
    headSha,
    baseBranch,
    mergeMode,
    authority,
    freezeScope,
    reviewedScopeDigest,
    runId: env.VIONA_GATE_RUN_ID ?? null,
    repositoryClaim: env.VIONA_GATE_REPOSITORY ?? null,
    missing,
    prNumberMalformed,
    headShaMalformed,
    freeTextAuthorizationPresent: unexpected.includes('authorization'),
    callerAuthorizedOperatorPresent: unexpected.includes('authorized_operator'),
    structuredInputsComplete: missing.length === 0 && !prNumberMalformed && !headShaMalformed,
  };
}

/**
 * Pure policy evaluator used after facts are assembled.
 * Never succeeds by default — all conditions must be explicitly green.
 */
export function evaluateMergeAuthorizationGate(facts) {
  const evidenceBase = {
    repository: facts.repository ?? null,
    prNumber: facts.prNumber ?? null,
    headSha: facts.headSha ?? null,
    base: facts.baseBranch ?? null,
    actor: facts.actor ?? null,
    workflowRunId: facts.workflowRunId ?? null,
    mergeMode: facts.mergeMode ?? null,
    reviewedScopeDigest: facts.computedReviewedScopeDigest ?? null,
    primaryEnforcement: REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY,
    wrapperRole: GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH,
  };
  const fail = (blocker, extra = {}) => ({
    conclusion: 'failure',
    blocker,
    evidence: sanitizeEvidence({ ...evidenceBase, decision: 'failure', blocker, ...extra }),
  });

  if (facts.technicalError === true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR);
  }
  if (facts.freeTextAuthorizationPresent === true || facts.callerAuthorizedOperatorPresent === true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED);
  }
  if (facts.provenanceMechanism !== 'VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD') {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED);
  }
  if (facts.eventName !== 'workflow_dispatch') {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'event_not_workflow_dispatch',
    });
  }
  if (Number(facts.runAttempt) !== 1) {
    return fail(BLOCKERS.BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED);
  }
  if (facts.repository !== CANONICAL_REPOSITORY) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'repository_mismatch',
    });
  }
  if (!AUTHORIZED_ACTORS.includes(facts.actor)) {
    return fail(BLOCKERS.BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED);
  }
  if (facts.triggeringActor !== facts.actor) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'triggering_actor_mismatch',
    });
  }
  if (facts.workflowPath !== WORKFLOW_FILE_PATH) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'non_canonical_workflow_path',
    });
  }
  if (facts.canonicalWorkflowVersionProven !== true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
  }
  if (facts.structuredInputsComplete !== true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'structured_inputs_missing',
    });
  }
  if (facts.permissionScopeOk === false) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE);
  }
  if (facts.checkRunName != null && facts.checkRunName !== GATE_CHECK_RUN_NAME) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS);
  }
  if (facts.duplicateGateResult === true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS);
  }
  if (facts.prNumberMalformed === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH);
  }
  if (facts.headShaMalformed === true || !FULL_SHA_RE.test(String(facts.headSha ?? ''))) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH);
  }
  if (facts.prMissing === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, { reason: 'pr_missing' });
  }
  if (facts.prState !== 'OPEN') {
    return fail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, { reason: 'pr_not_open' });
  }
  if (Number(facts.prNumber) !== Number(facts.actualPrNumber)) {
    return fail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH);
  }
  if (facts.baseBranch !== CANONICAL_BASE_BRANCH || facts.actualBaseBranch !== CANONICAL_BASE_BRANCH) {
    return fail(BLOCKERS.BLOCKED_MERGE_BASE_BRANCH_MISMATCH);
  }
  if (String(facts.headSha).toLowerCase() !== String(facts.actualHeadSha).toLowerCase()) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH);
  }
  if (facts.mergeMode !== CANONICAL_MERGE_MODE) {
    return fail(BLOCKERS.BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH);
  }
  if (facts.authority !== CANONICAL_AUTHORITY) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
      reason: 'authority_not_merge',
    });
  }
  if (facts.freezeScope !== CANONICAL_FREEZE_SCOPE) {
    return fail(BLOCKERS.BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING);
  }
  if (facts.headActivationProven !== true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN);
  }
  if (facts.authorizationPredatesCurrentHead === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD);
  }
  if (facts.autoMergeActive === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTO_MERGE_ACTIVE);
  }
  if (facts.repositoryEnforcementActive !== true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED);
  }
  if (
    String(facts.computedReviewedScopeDigest).toLowerCase() !==
    String(facts.suppliedReviewedScopeDigest).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW);
  }
  if (facts.reviewSatisfied !== true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED);
  }
  if (facts.unresolvedConversation === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION);
  }
  if (facts.requiredCheckFailed === true || facts.staleRequiredCheckFromOtherSha === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED);
  }
  if (facts.finalHeadMismatch === true) {
    return fail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH, { reason: 'snapshot_b_head_changed' });
  }
  if (facts.gateAppIdentityResolved === false) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED);
  }
  if (facts.allConditionsExplicitlyGreen !== true) {
    return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, { reason: 'no_default_success' });
  }

  return {
    conclusion: 'success',
    blocker: null,
    evidence: sanitizeEvidence({
      ...evidenceBase,
      decision: 'success',
      blocker: null,
      gateAppId: facts.gateAppId ?? null,
    }),
  };
}

export function selectExactHeadApproval(reviews, headSha, dispatchCreatedAtMs) {
  const head = String(headSha).toLowerCase();
  const dispatchMs = Number(dispatchCreatedAtMs);
  if (!Number.isFinite(dispatchMs)) return { ok: false, reason: 'dispatch_time_unresolved' };
  const candidates = (reviews ?? []).filter((r) => {
    if (!r || r.state !== 'APPROVED') return false;
    if (r.state === 'DISMISSED' || r.dismissed_at) return false;
    if (String(r.commit_id ?? '').toLowerCase() !== head) return false;
    const submitted = Date.parse(r.submitted_at ?? '');
    if (!Number.isFinite(submitted)) return false;
    if (submitted > dispatchMs) return false;
    return true;
  });
  if (candidates.length === 0) return { ok: false, reason: 'no_exact_head_approval_before_dispatch' };
  return { ok: true, review: candidates[0] };
}

async function rest(deps, method, urlPath, body) {
  deps.mergeCalls = deps.mergeCalls ?? [];
  if (/\/merges$|\/merge$/.test(urlPath)) deps.mergeCalls.push({ method, urlPath });
  return deps.restRequest({ method, urlPath, body });
}

async function listPaginated(deps, firstPath, extractItems) {
  const all = [];
  let page = 1;
  for (;;) {
    const sep = firstPath.includes('?') ? '&' : '?';
    const batch = await rest(deps, 'GET', `${firstPath}${sep}per_page=100&page=${page}`);
    const items = extractItems(batch);
    if (!Array.isArray(items)) {
      const err = new Error('unexpected_list_shape');
      err.sanitized = { message: 'unexpected_list_shape' };
      throw err;
    }
    all.push(...items);
    if (items.length < 100) break;
    page += 1;
    if (page > 100) {
      const err = new Error('pagination_bound_exceeded');
      err.sanitized = { message: 'pagination_bound_exceeded' };
      throw err;
    }
  }
  return all;
}

async function listAllPrFiles(deps, owner, repo, prNumber) {
  return listPaginated(
    deps,
    `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    (batch) => (Array.isArray(batch) ? batch : batch?.items ?? null),
  );
}

async function listAllCheckRuns(deps, owner, repo, headSha) {
  return listPaginated(
    deps,
    `/repos/${owner}/${repo}/commits/${headSha}/check-runs`,
    (batch) => batch?.check_runs ?? null,
  );
}

async function listReviewThreadsPaginated(deps, owner, repo, prNumber) {
  const threads = [];
  let after = null;
  for (let i = 0; i < 50; i += 1) {
    const gql = await deps.graphqlRequest({
      query: `query($owner:String!,$repo:String!,$number:Int!,$after:String){
        repository(owner:$owner,name:$repo){
          pullRequest(number:$number){
            reviewThreads(first:100, after:$after){
              pageInfo { hasNextPage endCursor }
              nodes { isResolved }
            }
          }
        }
      }`,
      variables: { owner, repo, number: Number(prNumber), after },
    });
    const conn = gql?.data?.repository?.pullRequest?.reviewThreads;
    if (!conn || !Array.isArray(conn.nodes)) {
      const err = new Error('unexpected_graphql_shape');
      err.sanitized = { message: 'unexpected_graphql_shape' };
      throw err;
    }
    threads.push(...conn.nodes);
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return threads;
}

function contentIdentity(contentJson) {
  if (!contentJson || typeof contentJson !== 'object') return null;
  return {
    sha: contentJson.sha ?? null,
    path: contentJson.path ?? null,
    type: contentJson.type ?? null,
  };
}

/**
 * Prove canonical workflow version using run ID as lookup key only.
 * Does not trust caller-supplied workflow SHA env vars.
 */
export async function proveCanonicalWorkflowVersion(deps, { owner, repo, runId }) {
  const repository = await rest(deps, 'GET', `/repos/${owner}/${repo}`);
  const defaultBranch = repository?.default_branch;
  if (defaultBranch !== CANONICAL_BASE_BRANCH) {
    return { ok: false, reason: 'default_branch_not_master' };
  }
  const ref = await rest(deps, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`);
  const currentMasterSha = ref?.object?.sha;
  if (!FULL_SHA_RE.test(String(currentMasterSha ?? ''))) {
    return { ok: false, reason: 'master_sha_unresolved' };
  }

  const run = await rest(deps, 'GET', `/repos/${owner}/${repo}/actions/runs/${runId}`);
  if (!run || run.message === 'Not Found') return { ok: false, reason: 'run_missing' };
  if (run.event !== 'workflow_dispatch') return { ok: false, reason: 'event_mismatch' };
  if (Number(run.run_attempt) !== 1) return { ok: false, reason: 'run_attempt_not_1' };
  if (run.head_branch !== defaultBranch) return { ok: false, reason: 'run_not_on_default_branch' };
  if (String(run.head_sha).toLowerCase() !== String(currentMasterSha).toLowerCase()) {
    return { ok: false, reason: 'run_head_not_current_master' };
  }
  if (run.path !== WORKFLOW_FILE_PATH) return { ok: false, reason: 'run_path_mismatch' };
  if (run.workflow_id == null) return { ok: false, reason: 'workflow_id_missing' };

  const workflow = await rest(deps, 'GET', `/repos/${owner}/${repo}/actions/workflows/${run.workflow_id}`);
  if (!workflow || workflow.path !== WORKFLOW_FILE_PATH) {
    return { ok: false, reason: 'workflow_metadata_path_mismatch' };
  }
  if (workflow.state && workflow.state !== 'active') {
    return { ok: false, reason: 'workflow_not_active' };
  }

  const atRun = await rest(
    deps,
    'GET',
    `/repos/${owner}/${repo}/contents/${WORKFLOW_FILE_PATH}?ref=${run.head_sha}`,
  );
  const atMaster = await rest(
    deps,
    'GET',
    `/repos/${owner}/${repo}/contents/${WORKFLOW_FILE_PATH}?ref=${defaultBranch}`,
  );
  const idRun = contentIdentity(atRun);
  const idMaster = contentIdentity(atMaster);
  if (!idRun?.sha || !idMaster?.sha) return { ok: false, reason: 'workflow_blob_unresolved' };
  if (idRun.path !== WORKFLOW_FILE_PATH || idMaster.path !== WORKFLOW_FILE_PATH) {
    return { ok: false, reason: 'workflow_content_path_mismatch' };
  }
  if (idRun.sha !== idMaster.sha) return { ok: false, reason: 'workflow_blob_mismatch' };

  return {
    ok: true,
    run,
    workflow,
    currentMasterSha,
    defaultBranch,
    actor: run.actor?.login ?? run.triggering_actor?.login ?? null,
    triggeringActor: run.triggering_actor?.login ?? run.actor?.login ?? null,
    createdAtMs: Date.parse(run.created_at ?? ''),
  };
}

function earlyFail(blocker, extra = {}) {
  return {
    conclusion: 'failure',
    blocker,
    evidence: sanitizeEvidence({ decision: 'failure', blocker, ...extra }),
    checkCreated: 0,
    checkCompleted: 0,
    checkRunId: null,
    gateAppId: null,
    minimumProvenanceBeforeCheck: true,
  };
}

/**
 * Orchestrator with injectable adapters. Production adapters must not run in tests.
 */
export async function runMergeAuthorizationGate(deps) {
  const env = deps.env ?? {};
  const log = deps.log ?? ((msg) => console.log(msg));
  const inputs = parseStructuredInputs(env);
  const [owner, repo] = CANONICAL_REPOSITORY.split('/');

  let checkRunId = null;
  let gateAppId = null;
  let checkCreated = 0;
  let checkCompleted = 0;

  const completeIfCreated = async (result) => {
    if (checkRunId != null && deps.completeCheckRun) {
      await deps.completeCheckRun({
        checkRunId,
        name: GATE_CHECK_RUN_NAME,
        headSha: inputs.headSha,
        conclusion: result.conclusion === 'success' ? 'success' : 'failure',
        output: {
          title: result.blocker ?? GATE_CHECK_RUN_NAME,
          summary: JSON.stringify(sanitizeEvidence(result.evidence)),
        },
      });
      checkCompleted += 1;
    }
    const out = {
      ...result,
      checkRunId,
      gateAppId,
      checkCreated,
      checkCompleted,
      minimumProvenanceBeforeCheck: checkCreated === 0 || result.conclusion !== undefined,
    };
    log(JSON.stringify(sanitizeEvidence({
      ...out.evidence,
      checkRunId,
      gateAppId,
      checkCreated,
      checkCompleted,
      mergeCalls: deps.mergeCalls?.length ?? 0,
    })));
    return out;
  };

  try {
    if (inputs.freeTextAuthorizationPresent || inputs.callerAuthorizedOperatorPresent) {
      return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED);
    }
    if (!inputs.structuredInputsComplete) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
        reason: 'structured_inputs_missing',
        missing: inputs.missing,
      });
    }
    if (inputs.repositoryClaim && inputs.repositoryClaim !== CANONICAL_REPOSITORY) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
        reason: 'repository_claim_mismatch',
      });
    }
    if (!inputs.runId) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
        reason: 'run_id_missing',
      });
    }

    const permissionCheck = deps.workflowPermissionLines
      ? assertPermissionScope(deps.workflowPermissionLines)
      : { ok: true };
    if (!permissionCheck.ok) {
      return earlyFail(permissionCheck.blocker);
    }

    // --- Canonical workflow version + dispatch provenance (GET by run ID) ---
    let proven;
    try {
      proven = await proveCanonicalWorkflowVersion(deps, {
        owner,
        repo,
        runId: inputs.runId,
      });
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN, {
        reason: 'workflow_version_api_error',
      });
    }
    if (!proven.ok) {
      if (proven.reason === 'run_attempt_not_1') {
        return earlyFail(BLOCKERS.BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED);
      }
      if (proven.reason === 'event_mismatch') {
        return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
          reason: proven.reason,
        });
      }
      return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_CANONICAL_WORKFLOW_VERSION_UNPROVEN, {
        reason: proven.reason,
      });
    }

    const actor = proven.actor;
    const triggeringActor = proven.triggeringActor;
    if (!AUTHORIZED_ACTORS.includes(actor)) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED);
    }
    if (triggeringActor !== actor) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
        reason: 'triggering_actor_mismatch',
      });
    }

    // --- PR snapshot A ---
    let prA;
    try {
      prA = await rest(deps, 'GET', `/repos/${owner}/${repo}/pulls/${inputs.prNumber}`);
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, {
        reason: 'pr_missing',
      });
    }
    if (!prA || prA.message === 'Not Found') {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, {
        reason: 'pr_missing',
      });
    }
    if (prA.state !== 'open') {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH, {
        reason: 'pr_not_open',
      });
    }
    if (Number(prA.number) !== Number(inputs.prNumber)) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH);
    }
    if (prA.base?.ref !== CANONICAL_BASE_BRANCH) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_BASE_BRANCH_MISMATCH);
    }
    if (String(prA.head?.sha).toLowerCase() !== String(inputs.headSha).toLowerCase()) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH);
    }
    if (inputs.baseBranch !== CANONICAL_BASE_BRANCH) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_BASE_BRANCH_MISMATCH);
    }
    if (inputs.mergeMode !== CANONICAL_MERGE_MODE) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH);
    }
    if (inputs.authority !== CANONICAL_AUTHORITY) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED, {
        reason: 'authority_not_merge',
      });
    }
    if (inputs.freezeScope !== CANONICAL_FREEZE_SCOPE) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING);
    }
    if (prA.auto_merge) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTO_MERGE_ACTIVE);
    }

    // Exact-head approval before dispatch (head-activation binding)
    let reviews;
    try {
      reviews = await listPaginated(
        deps,
        `/repos/${owner}/${repo}/pulls/${inputs.prNumber}/reviews`,
        (batch) => (Array.isArray(batch) ? batch : null),
      );
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED, {
        reason: 'reviews_api_error',
      });
    }
    const approval = selectExactHeadApproval(reviews, inputs.headSha, proven.createdAtMs);
    if (!approval.ok) {
      if (approval.reason === 'dispatch_time_unresolved') {
        return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN);
      }
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD, {
        reason: approval.reason,
        also: BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN,
      });
    }

    // Duplicate exact-name gate checks on this head (before create)
    let existingGateChecks;
    try {
      const allChecks = await listAllCheckRuns(deps, owner, repo, inputs.headSha);
      existingGateChecks = allChecks.filter(
        (c) =>
          c.name === GATE_CHECK_RUN_NAME &&
          String(c.head_sha).toLowerCase() === String(inputs.headSha).toLowerCase(),
      );
      if (deps.extraCheckRunsBeforeCreate) {
        existingGateChecks = existingGateChecks.concat(
          deps.extraCheckRunsBeforeCreate.filter(
            (c) =>
              c.name === GATE_CHECK_RUN_NAME &&
              String(c.head_sha ?? inputs.headSha).toLowerCase() ===
                String(inputs.headSha).toLowerCase(),
          ),
        );
      }
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, {
        reason: 'check_list_before_create_failed',
      });
    }
    if (existingGateChecks.length > 0) {
      return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS, {
        reason: 'existing_same_head_gate_check',
        count: existingGateChecks.length,
      });
    }

    // --- Create exactly one in-progress check (minimum provenance satisfied) ---
    if (!deps.createCheckRun) {
      return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, {
        reason: 'create_adapter_missing',
      });
    }
    const created = await deps.createCheckRun({
      name: GATE_CHECK_RUN_NAME,
      headSha: inputs.headSha,
      status: 'in_progress',
    });
    checkCreated += 1;
    checkRunId = created?.id ?? created?.check_run_id ?? null;
    gateAppId = created?.app?.id ?? created?.app_id ?? null;
    if (checkRunId == null) {
      return completeIfCreated(
        earlyFail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, {
          reason: 'check_run_id_missing',
        }),
      );
    }
    if (gateAppId == null) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED,
        }),
      });
    }

    // Inject concurrent duplicate after create (tests)
    if (deps.injectDuplicateAfterCreate === true) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS,
          reason: 'concurrent_duplicate_after_create',
        }),
      });
    }

    // Post-create duplicate scan
    const afterChecks = await listAllCheckRuns(deps, owner, repo, inputs.headSha);
    let gateAfter = afterChecks.filter(
      (c) =>
        c.name === GATE_CHECK_RUN_NAME &&
        String(c.head_sha).toLowerCase() === String(inputs.headSha).toLowerCase(),
    );
    if (deps.extraCheckRunsAfterCreate) {
      gateAfter = gateAfter.concat(
        deps.extraCheckRunsAfterCreate.filter(
          (c) =>
            c.name === GATE_CHECK_RUN_NAME &&
            String(c.head_sha ?? inputs.headSha).toLowerCase() ===
              String(inputs.headSha).toLowerCase(),
        ),
      );
    }
    // Include the just-created check if list adapters omit it
    if (!gateAfter.some((c) => String(c.id) === String(checkRunId))) {
      gateAfter.push({ id: checkRunId, name: GATE_CHECK_RUN_NAME, head_sha: inputs.headSha, app: { id: gateAppId } });
    }
    if (gateAfter.length !== 1 || String(gateAfter[0].id) !== String(checkRunId)) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS,
          reason: 'post_create_count_or_id_mismatch',
        }),
      });
    }
    const listedApp = gateAfter[0].app?.id ?? gateAfter[0].app_id;
    if (listedApp != null && String(listedApp) !== String(gateAppId)) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS,
          reason: 'app_identity_conflict',
        }),
      });
    }

    // Remaining policy evaluation
    const files = await listAllPrFiles(deps, owner, repo, inputs.prNumber);
    const computedDigest = computeReviewedScopeDigest(files);
    if (computedDigest.toLowerCase() !== String(inputs.reviewedScopeDigest).toLowerCase()) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW,
        }),
      });
    }

    let unresolvedConversation = false;
    try {
      const threads = await listReviewThreadsPaginated(deps, owner, repo, inputs.prNumber);
      unresolvedConversation = threads.some((t) => t && t.isResolved === false);
    } catch {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION,
          reason: 'graphql_error',
        }),
      });
    }
    if (unresolvedConversation) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION,
        }),
      });
    }

    let repositoryEnforcementActive = false;
    let requiredCheckFailed = false;
    let staleRequiredCheckFromOtherSha = false;
    try {
      const protection = await rest(deps, 'GET', `/repos/${owner}/${repo}/branches/master/protection`);
      repositoryEnforcementActive =
        protection?.enforce_admins?.enabled === true ||
        protection?.required_status_checks != null;
      const requiredContexts = protection?.required_status_checks?.contexts ?? [];
      const checkRuns = await listAllCheckRuns(deps, owner, repo, inputs.headSha);
      for (const ctx of requiredContexts) {
        if (ctx === GATE_CHECK_RUN_NAME) continue;
        const onHead = checkRuns.filter(
          (c) =>
            c.name === ctx &&
            String(c.head_sha).toLowerCase() === String(inputs.headSha).toLowerCase(),
        );
        const other = checkRuns.filter(
          (c) =>
            c.name === ctx &&
            String(c.head_sha).toLowerCase() !== String(inputs.headSha).toLowerCase(),
        );
        if (onHead.length === 0 && other.length > 0) staleRequiredCheckFromOtherSha = true;
        if (!onHead.some((c) => c.conclusion === 'success')) requiredCheckFailed = true;
      }
    } catch {
      repositoryEnforcementActive = false;
    }
    if (!repositoryEnforcementActive) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
        }),
      });
    }
    if (requiredCheckFailed || staleRequiredCheckFromOtherSha) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED,
        }),
      });
    }

    // Snapshot B — final reconfirmation
    const prB = await rest(deps, 'GET', `/repos/${owner}/${repo}/pulls/${inputs.prNumber}`);
    if (
      !prB ||
      prB.state !== 'open' ||
      prB.base?.ref !== CANONICAL_BASE_BRANCH ||
      prB.auto_merge ||
      String(prB.head?.sha).toLowerCase() !== String(inputs.headSha).toLowerCase()
    ) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH,
          reason: 'snapshot_b_failed',
        }),
      });
    }
    const approvalB = selectExactHeadApproval(reviews, inputs.headSha, proven.createdAtMs);
    if (!approvalB.ok) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD,
          reason: 'snapshot_b_review_invalid',
        }),
      });
    }

    if (deps.forceTechnicalErrorAfterCreate === true) {
      throw Object.assign(new Error('forced_technical_error'), {
        sanitized: { message: 'forced_technical_error' },
      });
    }

    const facts = {
      provenanceMechanism: 'VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD',
      freeTextAuthorizationPresent: false,
      callerAuthorizedOperatorPresent: false,
      eventName: 'workflow_dispatch',
      runAttempt: 1,
      repository: CANONICAL_REPOSITORY,
      actor,
      triggeringActor,
      workflowPath: WORKFLOW_FILE_PATH,
      canonicalWorkflowVersionProven: true,
      workflowRunId: inputs.runId,
      structuredInputsComplete: true,
      permissionScopeOk: true,
      checkRunName: GATE_CHECK_RUN_NAME,
      duplicateGateResult: false,
      prNumber: inputs.prNumber,
      actualPrNumber: prB.number,
      prNumberMalformed: false,
      headSha: inputs.headSha,
      headShaMalformed: false,
      prMissing: false,
      prState: 'OPEN',
      baseBranch: inputs.baseBranch,
      actualBaseBranch: prB.base.ref,
      actualHeadSha: prB.head.sha,
      mergeMode: inputs.mergeMode,
      authority: inputs.authority,
      freezeScope: inputs.freezeScope,
      headActivationProven: true,
      authorizationPredatesCurrentHead: false,
      autoMergeActive: false,
      repositoryEnforcementActive: true,
      computedReviewedScopeDigest: computedDigest,
      suppliedReviewedScopeDigest: inputs.reviewedScopeDigest,
      reviewSatisfied: true,
      unresolvedConversation: false,
      requiredCheckFailed: false,
      staleRequiredCheckFromOtherSha: false,
      finalHeadMismatch: false,
      gateAppIdentityResolved: true,
      gateAppId,
      allConditionsExplicitlyGreen: true,
      technicalError: false,
    };
    if (deps.forceFacts) Object.assign(facts, deps.forceFacts);

    const evaluated = evaluateMergeAuthorizationGate(facts);
    return completeIfCreated(evaluated);
  } catch (err) {
    const blocker = BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR;
    const result = {
      conclusion: 'failure',
      blocker,
      evidence: sanitizeEvidence({
        decision: 'failure',
        blocker,
        message: err?.sanitized?.message ?? 'technical_error',
      }),
    };
    if (checkCreated > 0) return completeIfCreated(result);
    return { ...earlyFail(blocker, result.evidence), checkCreated: 0, checkCompleted: 0 };
  }
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
    const json = await res.json();
    if (!res.ok || json.errors) {
      const err = new Error('GitHub GraphQL error');
      err.sanitized = { message: 'graphql_error' };
      throw err;
    }
    return json;
  }

  return {
    env,
    restRequest,
    graphqlRequest,
    async createCheckRun({ name, headSha, status }) {
      return restRequest({
        method: 'POST',
        urlPath: `/repos/${ownerOf()}/${repoOf()}/check-runs`,
        body: { name, head_sha: headSha, status },
      });
    },
    async completeCheckRun({ checkRunId, name, headSha, conclusion, output }) {
      return restRequest({
        method: 'PATCH',
        urlPath: `/repos/${ownerOf()}/${repoOf()}/check-runs/${checkRunId}`,
        body: { name, head_sha: headSha, status: 'completed', conclusion, output },
      });
    },
    log: (msg) => console.log(msg),
  };

  function ownerOf() {
    return CANONICAL_REPOSITORY.split('/')[0];
  }
  function repoOf() {
    return CANONICAL_REPOSITORY.split('/')[1];
  }
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

export async function main(env = process.env) {
  const deps = createProductionDeps(env);
  const result = await runMergeAuthorizationGate(deps);
  if (result.conclusion !== 'success') process.exitCode = 1;
  return result;
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(
      JSON.stringify({
        error: 'gate_failed',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
        message: err?.sanitized?.message ?? 'error',
      }),
    );
    process.exitCode = 1;
  });
}
