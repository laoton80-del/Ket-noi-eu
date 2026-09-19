/**
 * Viona Explicit Merge Authorization (Stage 2)
 *
 * Canonical design:
 *   docs/governance/VIONA_REC2_TWO_STAGE_MERGE_CONTROL_DESIGN_V1.md
 *
 * STAGE2_IS_EXPLICIT_EXACT_TARGET_ONE_TIME_MERGE_AUTHORITY
 * STAGE1_READINESS_SUCCESS_IS_A_PRECONDITION_NOT_A_SUBSTITUTE
 *
 * Ledger/backend decision (Lane B1, documented per governance directive
 * VIONA.REC2.MERGE_CONTROL.LANE_B1.IMPLEMENTATION_AUTHORIZATION.V1 §20):
 *   No new database, GitHub App, secret, repository variable, or external
 *   store is introduced. The canonical Stage 2 Checks API check run (name
 *   STAGE2_CHECK_RUN_NAME, bound to an exact head SHA) IS the authorization
 *   record. Its `output.summary` JSON payload is the audit-trail snapshot.
 *   Duplicate-check-run detection (same technique as the existing Stage 1
 *   gate) plus an Actions concurrency group keyed on the exact target
 *   tuple plus the existing sole-actor allowlist provide best-effort
 *   single-issuance protection. This mirrors the exact risk posture
 *   already accepted for the existing canonical Stage 1 gate; it is not a
 *   new risk introduced by Stage 2. True cross-process compare-and-swap is
 *   not available without new infrastructure and is therefore explicitly
 *   NOT claimed — see the Lane B1 implementation report for the accepted
 *   residual limitation.
 *
 * NOTE ON STAGE 1 NAME: the design's target name for Stage 1 is
 * "Viona Merge Readiness Gate", but that rename is a LATER migration step
 * (design doc §15, step 8) and is explicitly out of scope for Lane B1.
 * This module therefore binds to the CURRENT canonical Stage 1 check name,
 * "Viona Merge Authorization Gate", imported unchanged from the existing
 * approved implementation.
 */

import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import {
  CANONICAL_REPOSITORY,
  CANONICAL_BASE_BRANCH,
  CANONICAL_MERGE_MODE,
  CANONICAL_FREEZE_SCOPE,
  AUTHORIZED_ACTORS,
  GATE_CHECK_RUN_NAME as STAGE1_CHECK_RUN_NAME,
  computeReviewedScopeDigest,
  sanitizeEvidence,
  selectExactHeadApproval,
} from './viona-merge-authorization-gate.mjs';

export const STAGE2_CHECK_RUN_NAME = 'Viona Explicit Merge Authorization';
export const STAGE2_WORKFLOW_FILE_PATH =
  '.github/workflows/viona-merge-explicit-authorization.yml';
export const STAGE2_JOB_ID = 'evaluate_explicit_merge_authorization';
export const STAGE2_SCRIPT_PATH = 'scripts/viona-merge-explicit-authorization.mjs';
export const AUTHORIZATION_TTL_MINUTES = 15;

/**
 * Ledger backend (Lane B1 V2, per governance directive
 * VIONA.REC2.MERGE_CONTROL.LANE_B1.LEDGER_INTEGRATION_AUTHORIZATION.V2).
 *
 * Sealed decision (VIONA.REC2.MERGE_CONTROL.LEDGER_BACKEND_DESIGN_DECISION.V1
 * + VIONA.REC2.MERGE_CONTROL.LEDGER_REF_ACTIVATION_AUTHORIZATION.V1):
 *   The authoritative Stage 2 authorization lifecycle store is a dedicated,
 *   protected GitHub ref (LEDGER_REF), written exclusively via the GitHub
 *   Contents API's sha-conditional PUT (a genuine, GitHub-native, server-
 *   enforced optimistic-locking compare-and-swap primitive: a stale/omitted
 *   `sha` on an existing file is rejected with 409/422, never silently
 *   applied). The Stage 2 Checks API check run is a GitHub-visible
 *   PROJECTION of ledger-backed validity only — it is never itself
 *   authoritative (design directive §10, §18, §20).
 *
 * LEDGER_REF, LEDGER_SCHEMA, LEDGER_PATH_PREFIX are hard-bound constants.
 * No workflow input, CLI argument, or caller-supplied environment variable
 * may redirect a ledger write to another ref, another repository, or an
 * arbitrary path (directive §7, §8, §32) — there is no code path in this
 * module that accepts a caller-supplied ref or path for a ledger write; the
 * only inputs to `computeLedgerPath` are the fields of the exact
 * authorization target tuple, and every write function below re-derives
 * the ref/path internally from these constants rather than accepting them
 * as parameters.
 */
export const LEDGER_REF = 'viona-governance-merge-ledger-v1';
export const LEDGER_SCHEMA = 'viona.merge-authority-ledger/v1';
export const LEDGER_SCHEMA_VERSION = 1;
const LEDGER_PATH_PREFIX = 'records/';
const LEDGER_TARGET_KEY_RE = /^[0-9a-f]{64}$/;

/**
 * Canonical target-tuple serialization (directive §8). Deterministic,
 * ASCII/UTF-8 stable, one line per field in fixed order, each line
 * terminated by LF (including the final line).
 */
export function computeTargetSerialization(target) {
  const lines = [
    `repository=${target.repository}`,
    `pr_number=${Number(target.prNumber)}`,
    `head_sha=${String(target.headSha ?? '').toLowerCase()}`,
    `base_branch=${target.baseBranch}`,
    `merge_mode=${target.mergeMode}`,
    `reviewed_scope_digest=${String(target.reviewedScopeDigest ?? '').toLowerCase()}`,
  ];
  return lines.map((line) => `${line}\n`).join('');
}

export function computeTargetKey(target) {
  return createHash('sha256').update(computeTargetSerialization(target), 'utf8').digest('hex');
}

/**
 * One deterministic current-state ledger path per exact target (directive
 * §8). Throws (never silently coerces) on a malformed key so a bug upstream
 * cannot smuggle an arbitrary path through this function.
 */
export function computeLedgerPath(targetKey) {
  const key = String(targetKey ?? '');
  if (!LEDGER_TARGET_KEY_RE.test(key)) {
    throw Object.assign(new Error('invalid_target_key'), {
      sanitized: { message: 'invalid_target_key' },
    });
  }
  return `${LEDGER_PATH_PREFIX}${key.slice(0, 2)}/${key}.json`;
}

/**
 * Defense-in-depth assertion: every ledger write MUST target exactly
 * `/repos/<CANONICAL_REPOSITORY>/contents/records/...`. Called from every
 * ledger write function before any HTTP mutation (directive §26 — hard-
 * binding failures must occur before HTTP mutation).
 */
export function assertLedgerWritePath(urlPath) {
  const [owner, repo] = CANONICAL_REPOSITORY.split('/');
  const prefix = `/repos/${owner}/${repo}/contents/${LEDGER_PATH_PREFIX}`;
  const bare = String(urlPath ?? '').split('?')[0];
  if (!bare.startsWith(prefix)) {
    throw Object.assign(new Error('ledger_write_path_forbidden'), {
      sanitized: { message: 'ledger_write_path_forbidden' },
    });
  }
}

function ledgerContentsUrlPath(targetKey) {
  const [owner, repo] = CANONICAL_REPOSITORY.split('/');
  return `/repos/${owner}/${repo}/contents/${computeLedgerPath(targetKey)}`;
}

function decodeLedgerContentsPayload(res) {
  if (!res || typeof res.content !== 'string') return null;
  const encoding = res.encoding === 'base64' ? 'base64' : 'utf8';
  const raw = Buffer.from(res.content, encoding).toString('utf8');
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Deterministic lookup by target_key (directive §13 claim step 1 / §8).
 * Never throws for "record does not exist" (404) — returns
 * `{ record: null, blobSha: null }` so callers can uniformly treat a
 * missing ledger file the same as "no authorization for this target".
 */
export async function ledgerReadRecord(deps, targetKey) {
  const urlPath = `${ledgerContentsUrlPath(targetKey)}?ref=${LEDGER_REF}`;
  let res;
  try {
    res = await deps.restRequest({ method: 'GET', urlPath });
  } catch (err) {
    if (err?.sanitized?.status === 404) return { record: null, blobSha: null };
    throw err;
  }
  if (!res || res.message === 'Not Found') return { record: null, blobSha: null };
  return { record: decodeLedgerContentsPayload(res), blobSha: res.sha ?? null };
}

function encodeLedgerContentsBody(record, { sha, message, branch } = {}) {
  const json = JSON.stringify(record, null, 2);
  const content = Buffer.from(json, 'utf8').toString('base64');
  const body = { message, content, branch: branch ?? LEDGER_REF };
  if (sha != null) body.sha = sha;
  return body;
}

/**
 * Issuance CAS (directive §11): create-without-sha. GitHub's Contents API
 * rejects a create-without-sha PUT against a path that already has content
 * (422/409) — this is the native "create if not exists" primitive used to
 * guarantee at most one initial record per target_key. On a reported
 * conflict this function returns `{ ok:false, reason:'already_exists' }`
 * and performs NO overwrite — callers must read the existing record and
 * apply lifecycle rules (directive §11), never blindly retry as an update.
 */
export async function ledgerCreateRecord(deps, { targetKey, record, message }) {
  const urlPath = ledgerContentsUrlPath(targetKey);
  assertLedgerWritePath(urlPath);
  const body = encodeLedgerContentsBody(record, {
    message: message ?? `viona-ledger: ${record.state} ${record.authorization_id} pr#${record.pr_number}`,
  });
  try {
    const res = await deps.restRequest({ method: 'PUT', urlPath, body });
    return { ok: true, blobSha: res?.content?.sha ?? null, commitSha: res?.commit?.sha ?? null };
  } catch (err) {
    const status = err?.sanitized?.status;
    if (status === 409 || status === 422) {
      return { ok: false, reason: 'already_exists' };
    }
    throw err;
  }
}

/**
 * Atomic claim / re-authorization / lifecycle-transition CAS (directive
 * §12, §13): conditional PUT with the exact observed blob `sha`. GitHub
 * rejects the write (409/422) if the current blob sha no longer matches —
 * the caller lost the race and MUST fail closed, never retry-to-win
 * (directive §13, §14).
 */
export async function ledgerConditionalWriteRecord(deps, { targetKey, record, expectedBlobSha, message }) {
  const urlPath = ledgerContentsUrlPath(targetKey);
  assertLedgerWritePath(urlPath);
  const body = encodeLedgerContentsBody(record, {
    sha: expectedBlobSha,
    message: message ?? `viona-ledger: ${record.state} ${record.authorization_id} pr#${record.pr_number}`,
  });
  try {
    const res = await deps.restRequest({ method: 'PUT', urlPath, body });
    return { ok: true, blobSha: res?.content?.sha ?? null, commitSha: res?.commit?.sha ?? null };
  } catch (err) {
    const status = err?.sanitized?.status;
    if (status === 409 || status === 422) {
      return { ok: false, reason: 'stale_sha' };
    }
    throw err;
  }
}

/**
 * Exact-bound freeze-exception structure (directive §23) — a canonical
 * freeze-scope string alone is never sufficient; the ledger record must
 * carry a structure tied to the exact authorization it belongs to.
 */
export function buildFreezeExceptionBinding({
  repository,
  prNumber,
  headSha,
  authorizationId,
  reviewedScopeDigest,
  mergeMode,
  actor,
  windowStart,
  windowEnd,
}) {
  return {
    repository,
    pr_number: prNumber,
    head_sha: String(headSha ?? '').toLowerCase(),
    authorization_id: authorizationId,
    reviewed_scope_digest: String(reviewedScopeDigest ?? '').toLowerCase(),
    merge_mode: mergeMode,
    actor,
    window_start: windowStart,
    window_end: windowEnd,
  };
}

/**
 * Authoritative ledger record model (directive §9). Every field the
 * directive requires "at least" is present; extra bookkeeping fields
 * (expires_at_ms, schema/schema_version) are additive and harmless.
 */
export function buildLedgerRecord(input) {
  return {
    schema: LEDGER_SCHEMA,
    schema_version: LEDGER_SCHEMA_VERSION,

    target_key: input.targetKey,
    authorization_id: input.authorizationId,
    state: input.state,

    repository: input.repository,
    pr_number: input.prNumber,
    head_sha: input.headSha,
    base_branch: input.baseBranch,
    merge_mode: input.mergeMode,
    reviewed_scope_digest: input.reviewedScopeDigest,

    stage1_check_name: input.stage1CheckName ?? null,
    stage1_check_run_id: input.stage1CheckRunId ?? null,
    stage1_head_sha: input.stage1HeadSha ?? null,
    stage1_completed_at: input.stage1CompletedAt ?? null,
    stage1_conclusion: input.stage1Conclusion ?? null,

    authorized_by: input.authorizedBy,
    authorized_at: input.authorizedAt,
    expires_at: input.expiresAt,
    expires_at_ms: input.expiresAtMs,

    freeze_scope: input.freezeScope,
    freeze_exception_binding: input.freezeExceptionBinding,

    revoked_at: input.revokedAt ?? null,
    revoked_by: input.revokedBy ?? null,
    revocation_reason: input.revocationReason ?? null,

    consumption_started_at: input.consumptionStartedAt ?? null,
    consumed_at: input.consumedAt ?? null,
    consumed_by: input.consumedBy ?? null,

    merge_commit_sha: input.mergeCommitSha ?? null,
    merge_api_result: input.mergeApiResult ?? null,

    last_transition_at: input.lastTransitionAt,
    last_transition_actor: input.lastTransitionActor,
  };
}

/**
 * GitHub-visible check-run PROJECTION (directive §18, §19). Contains only
 * immutable references sufficient to locate the authoritative ledger
 * record — never the full lifecycle record, and never any credential.
 */
export function buildCheckRunProjection({ authorizationId, targetKey, headSha, expiresAt }) {
  return {
    schema: LEDGER_SCHEMA,
    schema_version: LEDGER_SCHEMA_VERSION,
    authorization_id: authorizationId,
    target_key: targetKey,
    ledger_ref: LEDGER_REF,
    ledger_path: computeLedgerPath(targetKey),
    head_sha: String(headSha ?? '').toLowerCase(),
    expires_at: expiresAt,
  };
}

export {
  CANONICAL_REPOSITORY,
  CANONICAL_BASE_BRANCH,
  CANONICAL_MERGE_MODE,
  CANONICAL_FREEZE_SCOPE,
  AUTHORIZED_ACTORS,
  STAGE1_CHECK_RUN_NAME,
  computeReviewedScopeDigest,
  sanitizeEvidence,
  selectExactHeadApproval,
};

export const AUTHORIZATION_STATES = Object.freeze({
  ISSUED: 'ISSUED',
  ACTIVE: 'ACTIVE',
  CONSUMING: 'CONSUMING',
  CONSUMED: 'CONSUMED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  INVALIDATED: 'INVALIDATED',
});

export const TERMINAL_AUTHORIZATION_STATES = Object.freeze([
  AUTHORIZATION_STATES.CONSUMED,
  AUTHORIZATION_STATES.EXPIRED,
  AUTHORIZATION_STATES.REVOKED,
  AUTHORIZATION_STATES.INVALIDATED,
]);

export const MERGE_RESULT_CLASSES = Object.freeze({
  SAFE_RETRYABLE_FAILURE: 'SAFE_RETRYABLE_FAILURE',
  NON_RETRYABLE_FAILURE: 'NON_RETRYABLE_FAILURE',
  MERGE_RESULT_UNKNOWN: 'MERGE_RESULT_UNKNOWN',
});

export const BLOCKERS = Object.freeze({
  BLOCKED_STAGE2_STRUCTURED_INPUTS_MISSING: 'BLOCKED_STAGE2_STRUCTURED_INPUTS_MISSING',
  BLOCKED_STAGE2_PROVENANCE_UNRESOLVED: 'BLOCKED_STAGE2_PROVENANCE_UNRESOLVED',
  BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED: 'BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED',
  BLOCKED_STAGE2_WORKFLOW_RERUN_NOT_PERMITTED: 'BLOCKED_STAGE2_WORKFLOW_RERUN_NOT_PERMITTED',
  BLOCKED_STAGE2_CANONICAL_WORKFLOW_VERSION_UNPROVEN:
    'BLOCKED_STAGE2_CANONICAL_WORKFLOW_VERSION_UNPROVEN',
  BLOCKED_STAGE2_PR_MISMATCH: 'BLOCKED_STAGE2_PR_MISMATCH',
  BLOCKED_STAGE2_BASE_BRANCH_MISMATCH: 'BLOCKED_STAGE2_BASE_BRANCH_MISMATCH',
  BLOCKED_STAGE2_HEAD_MISMATCH: 'BLOCKED_STAGE2_HEAD_MISMATCH',
  BLOCKED_STAGE2_MERGE_MODE_MISMATCH: 'BLOCKED_STAGE2_MERGE_MODE_MISMATCH',
  BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING: 'BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING',
  BLOCKED_STAGE2_STAGE1_MISSING: 'BLOCKED_STAGE2_STAGE1_MISSING',
  BLOCKED_STAGE2_STAGE1_NOT_SUCCESS: 'BLOCKED_STAGE2_STAGE1_NOT_SUCCESS',
  BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH: 'BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH',
  BLOCKED_STAGE2_STAGE1_SUPERSEDED: 'BLOCKED_STAGE2_STAGE1_SUPERSEDED',
  BLOCKED_STAGE2_REVIEW_REQUIREMENT_NOT_SATISFIED:
    'BLOCKED_STAGE2_REVIEW_REQUIREMENT_NOT_SATISFIED',
  BLOCKED_STAGE2_UNRESOLVED_CONVERSATION: 'BLOCKED_STAGE2_UNRESOLVED_CONVERSATION',
  BLOCKED_STAGE2_SCOPE_DIGEST_MISMATCH: 'BLOCKED_STAGE2_SCOPE_DIGEST_MISMATCH',
  BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION: 'BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION',
  BLOCKED_STAGE2_AUTO_MERGE_ACTIVE: 'BLOCKED_STAGE2_AUTO_MERGE_ACTIVE',
  BLOCKED_STAGE2_PR_CLOSED: 'BLOCKED_STAGE2_PR_CLOSED',
  BLOCKED_STAGE2_TECHNICAL_ERROR: 'BLOCKED_STAGE2_TECHNICAL_ERROR',

  // Wrapper/re-check surface (consumed by scripts/viona-guarded-pr-merge.mjs).
  BLOCKED_STAGE2_CHECK_MISSING: 'BLOCKED_STAGE2_CHECK_MISSING',
  BLOCKED_STAGE2_CHECK_NOT_SUCCESS: 'BLOCKED_STAGE2_CHECK_NOT_SUCCESS',

  // Lifecycle-validity (used by the wrapper / re-check callers, not only
  // by the issuance evaluator above).
  BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND: 'BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND',
  BLOCKED_STAGE2_AUTHORIZATION_NOT_ACTIVE: 'BLOCKED_STAGE2_AUTHORIZATION_NOT_ACTIVE',
  BLOCKED_STAGE2_AUTHORIZATION_EXPIRED: 'BLOCKED_STAGE2_AUTHORIZATION_EXPIRED',
  BLOCKED_STAGE2_AUTHORIZATION_REVOKED: 'BLOCKED_STAGE2_AUTHORIZATION_REVOKED',
  BLOCKED_STAGE2_AUTHORIZATION_CONSUMED: 'BLOCKED_STAGE2_AUTHORIZATION_CONSUMED',
  BLOCKED_STAGE2_AUTHORIZATION_INVALIDATED: 'BLOCKED_STAGE2_AUTHORIZATION_INVALIDATED',
  BLOCKED_STAGE2_MERGE_RESULT_UNKNOWN_RECONCILIATION_REQUIRED:
    'BLOCKED_STAGE2_MERGE_RESULT_UNKNOWN_RECONCILIATION_REQUIRED',

  // Ledger-backend (Lane B1 V2) surface.
  BLOCKED_STAGE2_LEDGER_WRITE_CONFLICT: 'BLOCKED_STAGE2_LEDGER_WRITE_CONFLICT',
  BLOCKED_STAGE2_LEDGER_READ_FAILED: 'BLOCKED_STAGE2_LEDGER_READ_FAILED',
  BLOCKED_STAGE2_LEDGER_TARGET_KEY_MISMATCH: 'BLOCKED_STAGE2_LEDGER_TARGET_KEY_MISMATCH',
});

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

/**
 * Parse the workflow_dispatch structured inputs (env-provided) for Stage 2.
 */
export function parseStage2Inputs(env) {
  const prRaw = env.VIONA_STAGE2_PR_NUMBER;
  const headSha = env.VIONA_STAGE2_HEAD_SHA;
  const baseBranch = env.VIONA_STAGE2_BASE_BRANCH;
  const mergeMode = env.VIONA_STAGE2_MERGE_MODE;
  const reviewedScopeDigest = env.VIONA_STAGE2_REVIEWED_SCOPE_DIGEST;
  const stage1CheckRunId = env.VIONA_STAGE2_STAGE1_CHECK_RUN_ID;
  const freezeScope = env.VIONA_STAGE2_FREEZE_SCOPE;

  const missing = [];
  for (const [name, value] of [
    ['pr_number', prRaw],
    ['head_sha', headSha],
    ['base_branch', baseBranch],
    ['merge_mode', mergeMode],
    ['reviewed_scope_digest', reviewedScopeDigest],
    ['stage1_check_run_id', stage1CheckRunId],
    ['freeze_scope', freezeScope],
  ]) {
    if (value == null || String(value).trim() === '') missing.push(name);
  }

  const prNumberMalformed =
    prRaw == null || !/^\d+$/.test(String(prRaw).trim()) || Number(prRaw) <= 0;
  const headShaMalformed = headSha == null || !FULL_SHA_RE.test(String(headSha));
  const stage1CheckRunIdMalformed =
    stage1CheckRunId == null || !/^\d+$/.test(String(stage1CheckRunId).trim());

  return {
    prNumber: prNumberMalformed ? prRaw : Number(prRaw),
    headSha,
    baseBranch,
    mergeMode,
    reviewedScopeDigest,
    stage1CheckRunId: stage1CheckRunIdMalformed ? stage1CheckRunId : Number(stage1CheckRunId),
    freezeScope,
    runId: env.VIONA_STAGE2_RUN_ID ?? null,
    repositoryClaim: env.VIONA_STAGE2_REPOSITORY ?? null,
    missing,
    prNumberMalformed,
    headShaMalformed,
    stage1CheckRunIdMalformed,
    structuredInputsComplete:
      missing.length === 0 && !prNumberMalformed && !headShaMalformed && !stage1CheckRunIdMalformed,
  };
}

export function computeAuthorizationExpiry(authorizedAtMs, ttlMinutes = AUTHORIZATION_TTL_MINUTES) {
  return authorizedAtMs + ttlMinutes * 60 * 1000;
}

export function generateAuthorizationId(deps = {}) {
  if (typeof deps.randomUUID === 'function') return deps.randomUUID();
  return randomUUID();
}

/**
 * Pure Stage 2 ISSUANCE evaluator. Never succeeds by default — every
 * condition must be explicitly green. Mirrors the fail-closed guard-clause
 * shape of the existing Stage 1 evaluator for consistency and auditability.
 */
export function evaluateAuthorizationIssuance(facts) {
  const evidenceBase = {
    repository: facts.repository ?? null,
    prNumber: facts.prNumber ?? null,
    headSha: facts.headSha ?? null,
    base: facts.baseBranch ?? null,
    mergeMode: facts.mergeMode ?? null,
    actor: facts.actor ?? null,
    workflowRunId: facts.workflowRunId ?? null,
    reviewedScopeDigest: facts.computedReviewedScopeDigest ?? null,
    stage1CheckRunId: facts.stage1CheckRunId ?? null,
  };
  const fail = (blocker, extra = {}) => ({
    conclusion: 'failure',
    blocker,
    evidence: sanitizeEvidence({ ...evidenceBase, decision: 'failure', blocker, ...extra }),
  });

  if (facts.technicalError === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR);
  }
  if (facts.provenanceMechanism !== 'VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD') {
    return fail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED);
  }
  if (facts.eventName !== 'workflow_dispatch') {
    return fail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'event_not_workflow_dispatch' });
  }
  if (Number(facts.runAttempt) !== 1) {
    return fail(BLOCKERS.BLOCKED_STAGE2_WORKFLOW_RERUN_NOT_PERMITTED);
  }
  if (facts.repository !== CANONICAL_REPOSITORY) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'repository_mismatch' });
  }
  if (!AUTHORIZED_ACTORS.includes(facts.actor)) {
    return fail(BLOCKERS.BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED);
  }
  if (facts.triggeringActor !== facts.actor) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'triggering_actor_mismatch' });
  }
  if (facts.workflowPath !== STAGE2_WORKFLOW_FILE_PATH) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'non_canonical_workflow_path' });
  }
  if (facts.canonicalWorkflowVersionProven !== true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_CANONICAL_WORKFLOW_VERSION_UNPROVEN);
  }
  if (facts.structuredInputsComplete !== true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_STRUCTURED_INPUTS_MISSING, { missing: facts.missing ?? [] });
  }
  if (facts.freezeScope !== CANONICAL_FREEZE_SCOPE) {
    return fail(BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING);
  }
  if (facts.prMissing === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PR_MISMATCH, { reason: 'pr_missing' });
  }
  if (facts.prState !== 'OPEN') {
    return fail(BLOCKERS.BLOCKED_STAGE2_PR_CLOSED, { reason: 'pr_not_open' });
  }
  if (Number(facts.prNumber) !== Number(facts.actualPrNumber)) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PR_MISMATCH);
  }
  if (facts.baseBranch !== CANONICAL_BASE_BRANCH || facts.actualBaseBranch !== CANONICAL_BASE_BRANCH) {
    return fail(BLOCKERS.BLOCKED_STAGE2_BASE_BRANCH_MISMATCH);
  }
  if (String(facts.headSha ?? '').toLowerCase() !== String(facts.actualHeadSha ?? '').toLowerCase()) {
    return fail(BLOCKERS.BLOCKED_STAGE2_HEAD_MISMATCH);
  }
  if (facts.mergeMode !== CANONICAL_MERGE_MODE) {
    return fail(BLOCKERS.BLOCKED_STAGE2_MERGE_MODE_MISMATCH);
  }
  if (facts.autoMergeActive === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTO_MERGE_ACTIVE);
  }
  if (facts.stage1Missing === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_STAGE1_MISSING);
  }
  if (facts.stage1Conclusion !== 'success') {
    return fail(BLOCKERS.BLOCKED_STAGE2_STAGE1_NOT_SUCCESS);
  }
  if (
    facts.stage1CheckName !== STAGE1_CHECK_RUN_NAME ||
    Number(facts.stage1CheckRunId) !== Number(facts.actualStage1CheckRunId)
  ) {
    return fail(BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH, { reason: 'wrong_check_identity' });
  }
  if (String(facts.stage1HeadSha ?? '').toLowerCase() !== String(facts.headSha ?? '').toLowerCase()) {
    return fail(BLOCKERS.BLOCKED_STAGE2_STAGE1_IDENTITY_MISMATCH, { reason: 'wrong_head' });
  }
  if (facts.stage1Superseded === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_STAGE1_SUPERSEDED);
  }
  if (
    String(facts.computedReviewedScopeDigest ?? '').toLowerCase() !==
    String(facts.reviewedScopeDigest ?? '').toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_STAGE2_SCOPE_DIGEST_MISMATCH);
  }
  if (facts.reviewSatisfied !== true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_REVIEW_REQUIREMENT_NOT_SATISFIED);
  }
  if (facts.unresolvedConversation === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_UNRESOLVED_CONVERSATION);
  }
  if (facts.duplicateActiveAuthorization === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION);
  }
  if (facts.allConditionsExplicitlyGreen !== true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR, { reason: 'no_default_success' });
  }

  const authorizedAtMs = Number(facts.authorizedAtMs);
  const authorizationId = facts.authorizationId ?? null;
  return {
    conclusion: 'success',
    blocker: null,
    authorizationId,
    authorizedAtMs,
    expiresAtMs: computeAuthorizationExpiry(authorizedAtMs, facts.ttlMinutes ?? AUTHORIZATION_TTL_MINUTES),
    finalAuthorizationState: AUTHORIZATION_STATES.ACTIVE,
    evidence: sanitizeEvidence({
      ...evidenceBase,
      decision: 'success',
      blocker: null,
      authorizationId,
    }),
  };
}

/**
 * Pure lifecycle-validity evaluator. Used both directly (tests) and by the
 * guarded merge wrapper (imported) so there is exactly one definition of
 * "is this authorization currently usable" — mirroring the reviewed-scope
 * digest reuse principle applied to lifecycle validity.
 *
 * `facts.record` is the AUTHORITATIVE ledger record (directive §10: the
 * ledger, never the check run, is authoritative — `record.state`, not any
 * check-run field). `facts.expected` is the exact target the caller wants
 * to consume against.
 */
export function evaluateAuthorizationLifecycleValidity(facts) {
  const record = facts.record ?? null;
  const expected = facts.expected ?? {};
  const nowMs = Number(facts.nowMs);

  const fail = (blocker, extra = {}) => ({
    ok: false,
    blocker,
    evidence: sanitizeEvidence({ decision: 'failure', blocker, ...extra }),
  });

  if (!record) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND);
  }
  if (record.state === AUTHORIZATION_STATES.CONSUMED) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_CONSUMED);
  }
  if (record.state === AUTHORIZATION_STATES.REVOKED) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_REVOKED);
  }
  if (record.state === AUTHORIZATION_STATES.INVALIDATED) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_INVALIDATED);
  }
  if (record.state === AUTHORIZATION_STATES.EXPIRED) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_EXPIRED);
  }
  if (record.state === AUTHORIZATION_STATES.CONSUMING) {
    return fail(BLOCKERS.BLOCKED_STAGE2_MERGE_RESULT_UNKNOWN_RECONCILIATION_REQUIRED);
  }
  if (record.state !== AUTHORIZATION_STATES.ACTIVE) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_NOT_ACTIVE);
  }
  const expiresAtMs = Number.isFinite(record.expires_at_ms)
    ? Number(record.expires_at_ms)
    : Date.parse(record.expires_at ?? '');
  if (!Number.isFinite(nowMs) || !Number.isFinite(expiresAtMs) || nowMs > expiresAtMs) {
    return fail(BLOCKERS.BLOCKED_STAGE2_AUTHORIZATION_EXPIRED);
  }
  if (expected.prClosed === true) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PR_CLOSED);
  }
  if (
    expected.headSha != null &&
    String(record.head_sha ?? '').toLowerCase() !== String(expected.headSha).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_STAGE2_HEAD_MISMATCH);
  }
  if (expected.prNumber != null && Number(record.pr_number) !== Number(expected.prNumber)) {
    return fail(BLOCKERS.BLOCKED_STAGE2_PR_MISMATCH);
  }
  if (
    expected.reviewedScopeDigest != null &&
    String(record.reviewed_scope_digest ?? '').toLowerCase() !==
      String(expected.reviewedScopeDigest).toLowerCase()
  ) {
    return fail(BLOCKERS.BLOCKED_STAGE2_SCOPE_DIGEST_MISMATCH);
  }
  if (expected.mergeMode != null && record.merge_mode !== expected.mergeMode) {
    return fail(BLOCKERS.BLOCKED_STAGE2_MERGE_MODE_MISMATCH);
  }

  // Exact-bound freeze-exception structure (directive §23). A canonical
  // freeze-scope string alone is never sufficient authority while
  // GLOBAL_MERGE_FREEZE is active (the current, invariant system state):
  // the ledger record must carry a freeze_exception_binding tied to this
  // exact authorization_id/target, not merely a matching scope string.
  const feb = record.freeze_exception_binding;
  const febValid =
    feb &&
    Number(feb.pr_number) === Number(record.pr_number) &&
    String(feb.head_sha ?? '').toLowerCase() === String(record.head_sha ?? '').toLowerCase() &&
    feb.authorization_id === record.authorization_id &&
    String(feb.reviewed_scope_digest ?? '').toLowerCase() ===
      String(record.reviewed_scope_digest ?? '').toLowerCase() &&
    feb.merge_mode === record.merge_mode &&
    (expected.repository == null || feb.repository === expected.repository) &&
    (expected.actor == null || feb.actor === expected.actor);
  if (!febValid) {
    return fail(BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING);
  }

  return {
    ok: true,
    blocker: null,
    evidence: sanitizeEvidence({ decision: 'valid', authorizationId: record.authorization_id }),
  };
}

/**
 * Parse the Stage 2 audit-trail record from a check run's output.summary.
 * Returns null (never throws) if the payload is missing or malformed so
 * callers can uniformly treat it the same as BLOCKED_STAGE2_CHECK_MISSING /
 * BLOCKED_STAGE2_AUTHORIZATION_NOT_FOUND.
 */
export function parseStage2Record(checkRun) {
  const summary = checkRun?.output?.summary;
  if (summary == null || summary === '') return null;
  try {
    const parsed = JSON.parse(summary);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Classify a failed merge API call into exactly one of the three outcomes
 * required by the design (§4.5). Pure and side-effect free so both the
 * wrapper and its tests share one definition — never a second incompatible
 * one.
 */
export function classifyMergeAttemptFailure(err) {
  const status = err?.sanitized?.status ?? err?.status ?? null;
  if (status === 405 || status === 409 || status === 422) {
    return MERGE_RESULT_CLASSES.SAFE_RETRYABLE_FAILURE;
  }
  if (status === 401 || status === 403 || status === 404 || status === 410) {
    return MERGE_RESULT_CLASSES.NON_RETRYABLE_FAILURE;
  }
  // No definitive status (network timeout/reset, ambiguous 5xx, or the
  // request outcome could not be observed) — per design §4.5/§4.6 this
  // MUST be treated as unknown, never as an assumed failure.
  return MERGE_RESULT_CLASSES.MERGE_RESULT_UNKNOWN;
}

async function rest(deps, method, urlPath, body) {
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
  return { sha: contentJson.sha ?? null, path: contentJson.path ?? null, type: contentJson.type ?? null };
}

/**
 * Prove canonical Stage 2 workflow version using run ID as lookup key only
 * (does not trust caller-supplied env vars for actor/version). Mirrors the
 * Stage 1 gate's proveCanonicalWorkflowVersion, parameterized for Stage 2's
 * own workflow file path. Duplicated rather than imported because Stage 1's
 * implementation is hardcoded to its own WORKFLOW_FILE_PATH and Stage 1's
 * file is outside the Lane B1 modification allowlist.
 */
export async function proveCanonicalStage2WorkflowVersion(deps, { owner, repo, runId }) {
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
  if (run.path !== STAGE2_WORKFLOW_FILE_PATH) return { ok: false, reason: 'run_path_mismatch' };
  if (run.workflow_id == null) return { ok: false, reason: 'workflow_id_missing' };

  const workflow = await rest(deps, 'GET', `/repos/${owner}/${repo}/actions/workflows/${run.workflow_id}`);
  if (!workflow || workflow.path !== STAGE2_WORKFLOW_FILE_PATH) {
    return { ok: false, reason: 'workflow_metadata_path_mismatch' };
  }
  if (workflow.state && workflow.state !== 'active') {
    return { ok: false, reason: 'workflow_not_active' };
  }

  const atRun = await rest(
    deps,
    'GET',
    `/repos/${owner}/${repo}/contents/${STAGE2_WORKFLOW_FILE_PATH}?ref=${run.head_sha}`,
  );
  const atMaster = await rest(
    deps,
    'GET',
    `/repos/${owner}/${repo}/contents/${STAGE2_WORKFLOW_FILE_PATH}?ref=${defaultBranch}`,
  );
  const idRun = contentIdentity(atRun);
  const idMaster = contentIdentity(atMaster);
  if (!idRun?.sha || !idMaster?.sha) return { ok: false, reason: 'workflow_blob_unresolved' };
  if (idRun.path !== STAGE2_WORKFLOW_FILE_PATH || idMaster.path !== STAGE2_WORKFLOW_FILE_PATH) {
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
  };
}

/**
 * Orchestrator with injectable adapters (mirrors the Stage 1 gate's DI
 * pattern). Production adapters must not run in tests.
 */
export async function runExplicitMergeAuthorization(deps) {
  const env = deps.env ?? {};
  const log = deps.log ?? ((msg) => console.log(msg));
  const inputs = parseStage2Inputs(env);
  const [owner, repo] = CANONICAL_REPOSITORY.split('/');

  let checkRunId = null;
  let checkCreated = 0;
  let checkCompleted = 0;

  const completeIfCreated = async (result) => {
    if (checkRunId != null && deps.completeCheckRun) {
      // Check-run output is a PROJECTION only (directive §10/§18/§19) —
      // on success it carries just enough immutable reference (authorization
      // id / target_key / ledger_ref / ledger_path / head_sha / expires_at)
      // to locate the authoritative ledger record. It never carries the
      // full lifecycle record and never a credential. On failure it carries
      // the same small evidence object as before.
      //
      // NOTE: the shared `sanitizeEvidence` helper (imported unchanged from
      // the Stage 1 gate module, outside this lane's modification
      // allowlist) redacts any field whose name merely *contains* the
      // substring "authorization" — a blanket heuristic aimed at stray
      // `Authorization` HTTP headers, which also matches the legitimate,
      // non-secret `authorization_id` field required by directive §19. The
      // projection object has a fixed, hardcoded shape built exclusively by
      // `buildCheckRunProjection` and never contains a credential, so it is
      // safe to serialize directly without that redaction pass; the
      // failure-path `evidence` object (which may echo caller-influenced
      // values) continues to go through `sanitizeEvidence` unchanged.
      const summaryPayload = result.projection ?? sanitizeEvidence(result.evidence);
      await deps.completeCheckRun({
        checkRunId,
        name: STAGE2_CHECK_RUN_NAME,
        headSha: inputs.headSha,
        conclusion: result.conclusion === 'success' ? 'success' : 'failure',
        output: {
          title: result.blocker ?? STAGE2_CHECK_RUN_NAME,
          summary: JSON.stringify(summaryPayload),
        },
      });
      checkCompleted += 1;
    }
    const out = { ...result, checkRunId, checkCreated, checkCompleted };
    log(JSON.stringify(sanitizeEvidence({ ...out.evidence, checkRunId, checkCreated, checkCompleted })));
    return out;
  };

  try {
    if (!inputs.structuredInputsComplete) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_STRUCTURED_INPUTS_MISSING, { missing: inputs.missing });
    }
    if (inputs.repositoryClaim && inputs.repositoryClaim !== CANONICAL_REPOSITORY) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'repository_claim_mismatch' });
    }
    if (!inputs.runId) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'run_id_missing' });
    }
    if (inputs.freezeScope !== CANONICAL_FREEZE_SCOPE) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_FREEZE_EXCEPTION_MISSING);
    }

    let proven;
    try {
      proven = await proveCanonicalStage2WorkflowVersion(deps, { owner, repo, runId: inputs.runId });
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_CANONICAL_WORKFLOW_VERSION_UNPROVEN, {
        reason: 'workflow_version_api_error',
      });
    }
    if (!proven.ok) {
      if (proven.reason === 'run_attempt_not_1') {
        return earlyFail(BLOCKERS.BLOCKED_STAGE2_WORKFLOW_RERUN_NOT_PERMITTED);
      }
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_CANONICAL_WORKFLOW_VERSION_UNPROVEN, { reason: proven.reason });
    }

    const actor = proven.actor;
    const triggeringActor = proven.triggeringActor;
    if (!AUTHORIZED_ACTORS.includes(actor)) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_OPERATOR_NOT_AUTHORIZED);
    }
    if (triggeringActor !== actor) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_PROVENANCE_UNRESOLVED, { reason: 'triggering_actor_mismatch' });
    }

    let prA;
    try {
      prA = await rest(deps, 'GET', `/repos/${owner}/${repo}/pulls/${inputs.prNumber}`);
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_PR_MISMATCH, { reason: 'pr_missing' });
    }
    if (!prA || prA.message === 'Not Found') {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_PR_MISMATCH, { reason: 'pr_missing' });
    }

    // Ledger-backed duplicate-issuance check BEFORE creating a check
    // (directive §10/§11): the ledger, not a check-run scan, is now
    // authoritative for "is there already a non-terminal authorization for
    // this exact target". target_key is derived solely from the exact
    // target tuple in the (already structurally-validated) dispatch inputs
    // — no caller-supplied path/ref is ever accepted.
    const targetKey = computeTargetKey({
      repository: CANONICAL_REPOSITORY,
      prNumber: inputs.prNumber,
      headSha: inputs.headSha,
      baseBranch: inputs.baseBranch,
      mergeMode: inputs.mergeMode,
      reviewedScopeDigest: inputs.reviewedScopeDigest,
    });
    let ledgerLookup;
    try {
      ledgerLookup = await ledgerReadRecord(deps, targetKey);
    } catch {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_LEDGER_READ_FAILED);
    }
    const existingLedgerRecord = ledgerLookup.record;
    const existingLedgerBlobSha = ledgerLookup.blobSha;
    const duplicateActiveAuthorization =
      existingLedgerRecord != null && !TERMINAL_AUTHORIZATION_STATES.includes(existingLedgerRecord.state);
    if (duplicateActiveAuthorization) {
      // Same technique as the Stage 1 gate's pre-create duplicate scan —
      // never create a second check run for a target that already has a
      // live (non-terminal) ledger authorization.
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION, { targetKey });
    }

    if (!deps.createCheckRun) {
      return earlyFail(BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR, { reason: 'create_adapter_missing' });
    }
    const created = await deps.createCheckRun({
      name: STAGE2_CHECK_RUN_NAME,
      headSha: inputs.headSha,
      status: 'in_progress',
    });
    checkCreated += 1;
    checkRunId = created?.id ?? created?.check_run_id ?? null;
    if (checkRunId == null) {
      return completeIfCreated(earlyFail(BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR, { reason: 'check_run_id_missing' }));
    }

    // Stage 1 binding
    let stage1Check = null;
    try {
      stage1Check = await rest(deps, 'GET', `/repos/${owner}/${repo}/check-runs/${inputs.stage1CheckRunId}`);
    } catch {
      stage1Check = null;
    }
    const stage1Missing = !stage1Check || stage1Check.message === 'Not Found';

    // Review + files + conversations
    let reviews = [];
    try {
      reviews = await listPaginated(
        deps,
        `/repos/${owner}/${repo}/pulls/${inputs.prNumber}/reviews`,
        (batch) => (Array.isArray(batch) ? batch : null),
      );
    } catch {
      reviews = [];
    }
    const approval = selectExactHeadApproval(reviews, inputs.headSha, proven.createdAtMs);

    let unresolvedConversation = false;
    try {
      const threads = await listReviewThreadsPaginated(deps, owner, repo, inputs.prNumber);
      unresolvedConversation = threads.some((t) => t && t.isResolved === false);
    } catch {
      unresolvedConversation = true;
    }

    const files = await listAllPrFiles(deps, owner, repo, inputs.prNumber);
    const computedDigest = computeReviewedScopeDigest(files);

    const authorizedAtMs = Date.now();
    const authorizationId = generateAuthorizationId(deps);

    const facts = {
      repository: inputs.repositoryClaim ?? CANONICAL_REPOSITORY,
      prNumber: inputs.prNumber,
      headSha: inputs.headSha,
      baseBranch: inputs.baseBranch,
      mergeMode: inputs.mergeMode,
      freezeScope: inputs.freezeScope,
      stage1CheckRunId: inputs.stage1CheckRunId,
      reviewedScopeDigest: inputs.reviewedScopeDigest,
      missing: inputs.missing,
      structuredInputsComplete: inputs.structuredInputsComplete,

      provenanceMechanism: 'VERIFIED_ACTOR_ALLOWLISTED_GITHUB_WORKFLOW_DISPATCH_RECORD',
      eventName: 'workflow_dispatch',
      runAttempt: 1,
      actor,
      triggeringActor,
      workflowPath: STAGE2_WORKFLOW_FILE_PATH,
      canonicalWorkflowVersionProven: true,
      workflowRunId: inputs.runId,

      prMissing: false,
      prState: prA.state === 'open' ? 'OPEN' : String(prA.state ?? '').toUpperCase(),
      actualPrNumber: prA.number,
      actualBaseBranch: prA.base?.ref ?? null,
      actualHeadSha: prA.head?.sha ?? null,
      autoMergeActive: Boolean(prA.auto_merge),

      stage1Missing,
      stage1Conclusion: stage1Check?.conclusion ?? null,
      stage1CheckName: stage1Check?.name ?? null,
      actualStage1CheckRunId: stage1Check?.id ?? null,
      stage1HeadSha: stage1Check?.head_sha ?? null,
      stage1Superseded:
        !stage1Missing &&
        String(stage1Check?.head_sha ?? '').toLowerCase() !== String(inputs.headSha).toLowerCase(),

      computedReviewedScopeDigest: computedDigest,
      reviewSatisfied: approval.ok,
      unresolvedConversation,
      duplicateActiveAuthorization: false, // excluded pre-create by the ledger lookup above
      allConditionsExplicitlyGreen: true,
      technicalError: false,

      authorizationId,
      authorizedAtMs,
      ttlMinutes: AUTHORIZATION_TTL_MINUTES,
    };
    if (deps.forceFacts) Object.assign(facts, deps.forceFacts);

    const evaluated = evaluateAuthorizationIssuance(facts);
    if (evaluated.conclusion !== 'success') {
      return completeIfCreated(evaluated);
    }

    // Directive §12: re-authorization after a terminal state may only be
    // created by generating a NEW authorization_id and conditionally
    // writing with the exact observed blob sha — never resurrecting the
    // old identity. `authorizationId` above is always a freshly-generated
    // UUID per evaluation, so old != new is guaranteed by construction;
    // this assertion documents (and mechanically enforces) that guarantee
    // rather than silently trusting it.
    if (
      existingLedgerRecord != null &&
      String(evaluated.authorizationId) === String(existingLedgerRecord.authorization_id)
    ) {
      return completeIfCreated(
        earlyFail(BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR, { reason: 'authorization_id_not_fresh' }),
      );
    }

    const nowIso = new Date(evaluated.authorizedAtMs).toISOString();
    const expiresAtIso = new Date(evaluated.expiresAtMs).toISOString();
    const freezeExceptionBinding = buildFreezeExceptionBinding({
      repository: facts.repository,
      prNumber: facts.prNumber,
      headSha: facts.headSha,
      authorizationId: evaluated.authorizationId,
      reviewedScopeDigest: facts.reviewedScopeDigest,
      mergeMode: facts.mergeMode,
      actor,
      windowStart: nowIso,
      windowEnd: expiresAtIso,
    });
    const record = buildLedgerRecord({
      targetKey,
      authorizationId: evaluated.authorizationId,
      state: AUTHORIZATION_STATES.ACTIVE,
      repository: facts.repository,
      prNumber: facts.prNumber,
      headSha: facts.headSha,
      baseBranch: facts.baseBranch,
      mergeMode: facts.mergeMode,
      reviewedScopeDigest: facts.reviewedScopeDigest,
      stage1CheckName: facts.stage1CheckName,
      stage1CheckRunId: facts.stage1CheckRunId,
      stage1HeadSha: facts.stage1HeadSha,
      stage1CompletedAt: stage1Check?.completed_at ?? null,
      stage1Conclusion: facts.stage1Conclusion,
      authorizedBy: actor,
      authorizedAt: nowIso,
      expiresAt: expiresAtIso,
      expiresAtMs: evaluated.expiresAtMs,
      freezeScope: facts.freezeScope,
      freezeExceptionBinding,
      lastTransitionAt: nowIso,
      lastTransitionActor: actor,
    });

    let ledgerWrite;
    try {
      ledgerWrite =
        existingLedgerRecord == null
          ? await ledgerCreateRecord(deps, {
              targetKey,
              record,
              message: `viona-ledger: ISSUED ${record.authorization_id} pr#${record.pr_number}`,
            })
          : await ledgerConditionalWriteRecord(deps, {
              targetKey,
              record,
              expectedBlobSha: existingLedgerBlobSha,
              message: `viona-ledger: REAUTHORIZED ${record.authorization_id} pr#${record.pr_number}`,
            });
    } catch {
      return completeIfCreated(
        earlyFail(BLOCKERS.BLOCKED_STAGE2_LEDGER_WRITE_CONFLICT, { reason: 'ledger_write_technical_error' }),
      );
    }
    if (!ledgerWrite.ok) {
      // A concurrent writer won the race between our read and our write —
      // never overwrite blindly (§11); fail closed instead.
      const blocker =
        ledgerWrite.reason === 'already_exists'
          ? BLOCKERS.BLOCKED_STAGE2_DUPLICATE_AUTHORIZATION
          : BLOCKERS.BLOCKED_STAGE2_LEDGER_WRITE_CONFLICT;
      return completeIfCreated(earlyFail(blocker, { reason: ledgerWrite.reason }));
    }

    const projection = buildCheckRunProjection({
      authorizationId: evaluated.authorizationId,
      targetKey,
      headSha: facts.headSha,
      expiresAt: expiresAtIso,
    });
    return completeIfCreated({ ...evaluated, record, projection });
  } catch (err) {
    const blocker = BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR;
    const result = {
      conclusion: 'failure',
      blocker,
      evidence: sanitizeEvidence({ decision: 'failure', blocker, message: err?.sanitized?.message ?? 'technical_error' }),
    };
    if (checkCreated > 0) return completeIfCreated(result);
    return { ...earlyFail(blocker, result.evidence), checkCreated: 0, checkCompleted: 0 };
  }
}

export function createProductionDeps(env = process.env) {
  const token = env.GITHUB_TOKEN;
  const apiBase = 'https://api.github.com';

  async function githubFetch(bearerToken, { method, urlPath, body }) {
    const res = await fetch(`${apiBase}${urlPath}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${bearerToken}`,
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

  async function restRequest({ method, urlPath, body }) {
    return githubFetch(token, { method, urlPath, body });
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

  const [owner, repoName] = CANONICAL_REPOSITORY.split('/');

  return {
    env,
    restRequest,
    graphqlRequest,
    randomUUID,
    async createCheckRun({ name, headSha, status }) {
      return restRequest({
        method: 'POST',
        urlPath: `/repos/${owner}/${repoName}/check-runs`,
        body: { name, head_sha: headSha, status },
      });
    },
    async completeCheckRun({ checkRunId, name, headSha, conclusion, output }) {
      return restRequest({
        method: 'PATCH',
        urlPath: `/repos/${owner}/${repoName}/check-runs/${checkRunId}`,
        body: { name, head_sha: headSha, status: 'completed', conclusion, output },
      });
    },
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

export async function main(env = process.env) {
  const deps = createProductionDeps(env);
  const result = await runExplicitMergeAuthorization(deps);
  if (result.conclusion !== 'success') process.exitCode = 1;
  return result;
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(
      JSON.stringify({
        error: 'stage2_evaluation_failed',
        blocker: BLOCKERS.BLOCKED_STAGE2_TECHNICAL_ERROR,
        message: err?.sanitized?.message ?? 'error',
      }),
    );
    process.exitCode = 1;
  });
}
