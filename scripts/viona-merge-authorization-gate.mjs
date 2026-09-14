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
import { Buffer } from 'node:buffer';
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
export const PR459_EXCEPTION_TOKEN =
  'FREEZE_EXCEPTION_FOR_PR459_OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION_ONLY';
export const PR459_NUMBER = 459;
export const PR459_HEAD_BRANCH = 'docs/viona-operating-protocol-v2-canonical-promotion';
export const PR459_BASE_BRANCH = 'master';
export const PR459_MERGE_MODE = 'squash';
export const PR459_PURPOSE = 'OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION';
export const PR459_PRE_REMEDIATION_REFERENCE_HEAD =
  'a6aeff6c0a521d422d4cf28e07ec218d1d371a02';
export const PR459_PAYLOAD_FILE_COUNT = 7;
export const PR459_CANONICAL_PAYLOAD_DIGEST =
  '6a7e59d1b2948f16999bff53e4f855d93f6931df53a220a5fb374044328f9944';
export const PR459_CANONICAL_REVIEWED_SCOPE_DIGEST =
  '5d242aeae7ad51dbf782dd7a38a2d94f314d1ce5410106dfb9c03aebc9802713';
export const PR459_PINNED_PAYLOAD = Object.freeze([
  Object.freeze({
    status: 'added',
    path: 'docs/ai-context/VIONA_CODEX_CANONICAL_ENTRYPOINT.md',
    sha256: '9ab7705adc748722432ba99f2cc9d51577dee6ec1e55a9ad73286518a110f843',
  }),
  Object.freeze({
    status: 'modified',
    path: 'docs/ai-context/VIONA_OPERATING_PROTOCOL.md',
    sha256: 'a90c443e775bd82ca58f2b225957af9f21ffb787314fb7ce1fde48358c789d16',
  }),
  Object.freeze({
    status: 'added',
    path: 'docs/ai-context/archive/VIONA_OPERATING_PROTOCOL_V1.md',
    sha256: '9cfe4452f974a287e74e4bff5c987e8614178b501c2b7be05aca73e51dd4f657',
  }),
  Object.freeze({
    status: 'added',
    path: 'docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/README.md',
    sha256: '3d971bca8d7b26bfe4858349fdd1142ef45f8cb656215041046470f0b2aad172',
  }),
  Object.freeze({
    status: 'added',
    path: 'docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/RECONCILIATION_MATRIX.md',
    sha256: 'c1c18c76bb6c19724b52ec0d059760fb81879ceb80f190ac2257653809150e05',
  }),
  Object.freeze({
    status: 'added',
    path: 'docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/evidence-manifest.sha256',
    sha256: '0da50a50fd9aef6b66700e72369293654212bff82644cb30e0bff2b6f38e9f9d',
  }),
  Object.freeze({
    status: 'added',
    path: 'docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/promotion-record.json',
    sha256: '31c6b3d53a6acd9c7e773aeeb5214e37fe99d5267ecab84644ef6874cb8d3408',
  }),
]);
export const SUPPORTED_FREEZE_SCOPES = Object.freeze([
  CANONICAL_FREEZE_SCOPE,
  PR459_EXCEPTION_TOKEN,
]);
export const ELIGIBLE_REPOSITORY_PERMISSIONS = Object.freeze(['push', 'maintain', 'admin']);
export const INELIGIBLE_REPOSITORY_PERMISSIONS = Object.freeze(['none', 'read', 'triage']);
export const REVIEW_THREAD_PAGE_LIMIT = 50;
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
  BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING:
    'BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING',
  BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED:
    'BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED',
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
  BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH: 'BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH',
  BLOCKED_PR459_SCOPE_MISMATCH: 'BLOCKED_PR459_SCOPE_MISMATCH',
  BLOCKED_PR459_CONTENT_READ_FAILED: 'BLOCKED_PR459_CONTENT_READ_FAILED',
  BLOCKED_PR459_PAYLOAD_HASH_MISMATCH: 'BLOCKED_PR459_PAYLOAD_HASH_MISMATCH',
  BLOCKED_PR459_PAYLOAD_DIGEST_MISMATCH: 'BLOCKED_PR459_PAYLOAD_DIGEST_MISMATCH',
  BLOCKED_PR459_NOT_CURRENT_WITH_MASTER: 'BLOCKED_PR459_NOT_CURRENT_WITH_MASTER',
  BLOCKED_PR459_CURRENT_MASTER_DRIFT_DURING_GATE:
    'BLOCKED_PR459_CURRENT_MASTER_DRIFT_DURING_GATE',
  BLOCKED_PR459_TRANSITION_TOPOLOGY_MISMATCH:
    'BLOCKED_PR459_TRANSITION_TOPOLOGY_MISMATCH',
  BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE:
    'BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE',
  BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN:
    'BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN',
});

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;
const FORBIDDEN_INPUT_KEYS = Object.freeze(['authorization', 'authorized_operator']);

export const CANONICAL_MASTER_PROTECTION_PATH = `/repos/${CANONICAL_REPOSITORY}/branches/master/protection`;

export function normalizeRestPath(urlPath) {
  return String(urlPath ?? '').split('?')[0];
}

export function isCanonicalMasterProtectionPath(urlPath) {
  return normalizeRestPath(urlPath) === CANONICAL_MASTER_PROTECTION_PATH;
}

function pathGuardError(message) {
  const err = new Error(message);
  err.sanitized = { message };
  return err;
}

/**
 * GITHUB_TOKEN / checks REST route must never perform the canonical protection GET.
 */
export function assertChecksRestRequest(method, urlPath) {
  void method;
  if (isCanonicalMasterProtectionPath(urlPath)) {
    throw pathGuardError('checks_token_protection_get_forbidden');
  }
}

/**
 * Protection-read credential may perform exactly one operation:
 * GET /repos/laoton80-del/Ket-noi-eu/branches/master/protection
 */
export function assertProtectionReadRequest(method, urlPath) {
  const m = String(method ?? '').toUpperCase();
  if (m !== 'GET' || !isCanonicalMasterProtectionPath(urlPath)) {
    throw pathGuardError('protection_read_path_forbidden');
  }
}

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

/** Compare strings by Unicode code point, without locale or case folding. */
export function compareOrdinalCodePoints(left, right) {
  const a = Array.from(String(left), (ch) => ch.codePointAt(0));
  const b = Array.from(String(right), (ch) => ch.codePointAt(0));
  const count = Math.min(a.length, b.length);
  for (let i = 0; i < count; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return a.length < b.length ? -1 : a.length > b.length ? 1 : 0;
}

/**
 * Content digest for the immutable PR #459 payload:
 * path<TAB>sha256, ordinal path order, LF join, UTF-8, SHA-256.
 */
export function computeCanonicalPayloadDigest(records) {
  const normalized = (records ?? []).map((record) => ({
    path: String(record?.path ?? ''),
    sha256: String(record?.sha256 ?? '').toLowerCase(),
  }));
  normalized.sort((a, b) => compareOrdinalCodePoints(a.path, b.path));
  const body = normalized.map((record) => `${record.path}\t${record.sha256}`).join('\n');
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

const PR459_PAYLOAD_BY_PATH = new Map(
  PR459_PINNED_PAYLOAD.map((record) => [record.path, record]),
);

/** Validate the exact seven GitHub PR file records, including status. */
export function validatePr459ScopeFiles(files) {
  if (!Array.isArray(files) || files.length !== PR459_PAYLOAD_FILE_COUNT) {
    return { ok: false, blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH, reason: 'file_count' };
  }
  const seen = new Set();
  for (const file of files) {
    const filename = typeof file?.filename === 'string' ? file.filename : '';
    const expected = PR459_PAYLOAD_BY_PATH.get(filename);
    if (!expected || seen.has(filename)) {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH,
        reason: expected ? 'duplicate_path' : 'unexpected_path',
      };
    }
    seen.add(filename);
    if (file.status !== expected.status) {
      return { ok: false, blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH, reason: 'status' };
    }
    if (String(file.previous_filename ?? '') !== '') {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH,
        reason: 'unexpected_previous_filename',
      };
    }
    if (!FULL_SHA_RE.test(String(file.sha ?? ''))) {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH,
        reason: 'file_blob_sha_unresolved',
      };
    }
  }
  if (seen.size !== PR459_PAYLOAD_FILE_COUNT) {
    return { ok: false, blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH, reason: 'missing_path' };
  }
  const reviewedScopeDigest = computeReviewedScopeDigest(files);
  if (reviewedScopeDigest !== PR459_CANONICAL_REVIEWED_SCOPE_DIGEST) {
    return {
      ok: false,
      blocker: BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH,
      reason: 'canonical_scope_digest',
      reviewedScopeDigest,
    };
  }
  return { ok: true, reviewedScopeDigest };
}

function encodeContentPath(filePath) {
  return String(filePath).split('/').map((part) => encodeURIComponent(part)).join('/');
}

/** Decode an ordinary GitHub Contents API file without text normalization. */
export function decodeGitHubFileBytes(content, expectedPath) {
  if (
    !content ||
    content.type !== 'file' ||
    content.path !== expectedPath ||
    content.encoding !== 'base64' ||
    typeof content.content !== 'string' ||
    content.truncated === true
  ) {
    throw pathGuardError('pr459_content_shape_invalid');
  }
  const compact = content.content.replace(/\r\n|\n|\r/g, '');
  if (/\s/.test(compact) || compact.length === 0 || compact.length % 4 !== 0) {
    throw pathGuardError('pr459_content_base64_invalid');
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)) {
    throw pathGuardError('pr459_content_base64_invalid');
  }
  const bytes = Buffer.from(compact, 'base64');
  if (bytes.toString('base64') !== compact) {
    throw pathGuardError('pr459_content_base64_noncanonical');
  }
  if (!Number.isSafeInteger(content.size) || content.size !== bytes.length) {
    throw pathGuardError('pr459_content_size_mismatch');
  }
  if (!FULL_SHA_RE.test(String(content.sha ?? ''))) {
    throw pathGuardError('pr459_content_blob_sha_unresolved');
  }
  return bytes;
}

/** Read and hash every pinned file from the exact live PR head. */
export async function verifyPr459PayloadAtHead(deps, { owner, repo, headSha, files }) {
  const scope = validatePr459ScopeFiles(files);
  if (!scope.ok) return scope;
  const filesByPath = new Map(files.map((file) => [file.filename, file]));
  const actual = [];
  for (const expected of PR459_PINNED_PAYLOAD) {
    let content;
    try {
      content = await rest(
        deps,
        'GET',
        `/repos/${owner}/${repo}/contents/${encodeContentPath(expected.path)}?ref=${encodeURIComponent(headSha)}`,
      );
    } catch (err) {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_CONTENT_READ_FAILED,
        reason: err?.sanitized?.message ?? err?.message ?? 'content_api_error',
        path: expected.path,
      };
    }
    let bytes;
    try {
      bytes = decodeGitHubFileBytes(content, expected.path);
    } catch (err) {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_CONTENT_READ_FAILED,
        reason: err?.sanitized?.message ?? 'content_decode_error',
        path: expected.path,
      };
    }
    if (String(content.sha).toLowerCase() !== String(filesByPath.get(expected.path)?.sha).toLowerCase()) {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_CONTENT_READ_FAILED,
        reason: 'pr_file_content_blob_mismatch',
        path: expected.path,
      };
    }
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (sha256 !== expected.sha256) {
      return {
        ok: false,
        blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_HASH_MISMATCH,
        reason: 'content_sha256',
        path: expected.path,
      };
    }
    actual.push({ path: expected.path, sha256 });
  }
  const payloadDigest = computeCanonicalPayloadDigest(actual);
  if (payloadDigest !== PR459_CANONICAL_PAYLOAD_DIGEST) {
    return {
      ok: false,
      blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_DIGEST_MISMATCH,
      reason: 'canonical_payload_digest',
      payloadDigest,
    };
  }
  return {
    ok: true,
    reviewedScopeDigest: scope.reviewedScopeDigest,
    payloadDigest,
    fileCount: actual.length,
  };
}

/** Prove that current master is the exact second parent and merge base of the PR head. */
export async function verifyPr459MasterAncestryAndTopology(
  deps,
  { owner, repo, masterSha, headSha },
) {
  if (!FULL_SHA_RE.test(String(masterSha ?? '')) || !FULL_SHA_RE.test(String(headSha ?? ''))) {
    return { ok: false, blocker: BLOCKERS.BLOCKED_PR459_NOT_CURRENT_WITH_MASTER, reason: 'sha' };
  }
  let comparison;
  let commit;
  try {
    comparison = await rest(
      deps,
      'GET',
      `/repos/${owner}/${repo}/compare/${masterSha}...${headSha}`,
    );
    commit = await rest(deps, 'GET', `/repos/${owner}/${repo}/commits/${headSha}`);
  } catch {
    return {
      ok: false,
      blocker: BLOCKERS.BLOCKED_PR459_NOT_CURRENT_WITH_MASTER,
      reason: 'ancestry_api_error',
    };
  }
  const lower = (value) => String(value ?? '').toLowerCase();
  if (
    comparison?.status !== 'ahead' ||
    lower(comparison?.base_commit?.sha) !== lower(masterSha) ||
    lower(comparison?.merge_base_commit?.sha) !== lower(masterSha)
  ) {
    return {
      ok: false,
      blocker: BLOCKERS.BLOCKED_PR459_NOT_CURRENT_WITH_MASTER,
      reason: 'compare_not_exact_ancestor',
    };
  }
  const parents = commit?.parents;
  if (
    lower(commit?.sha) !== lower(headSha) ||
    !Array.isArray(parents) ||
    parents.length !== 2 ||
    lower(parents[0]?.sha) !== lower(PR459_PRE_REMEDIATION_REFERENCE_HEAD) ||
    lower(parents[1]?.sha) !== lower(masterSha)
  ) {
    return {
      ok: false,
      blocker: BLOCKERS.BLOCKED_PR459_TRANSITION_TOPOLOGY_MISMATCH,
      reason: 'ordered_parent_topology',
    };
  }
  return { ok: true, masterSha: lower(masterSha), headSha: lower(headSha) };
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
    approvingReviewer: facts.approvingReviewer ?? null,
    approvingReviewerPermission: facts.approvingReviewerPermission ?? null,
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
  if (!SUPPORTED_FREEZE_SCOPES.includes(facts.freezeScope)) {
    return fail(BLOCKERS.BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING);
  }
  if (facts.freezeScope === PR459_EXCEPTION_TOKEN) {
    if (
      Number(facts.prNumber) !== PR459_NUMBER ||
      Number(facts.actualPrNumber) !== PR459_NUMBER ||
      facts.pr459HeadBranch !== PR459_HEAD_BRANCH ||
      facts.baseBranch !== PR459_BASE_BRANCH ||
      facts.actualBaseBranch !== PR459_BASE_BRANCH ||
      facts.mergeMode !== PR459_MERGE_MODE ||
      facts.pr459Purpose !== PR459_PURPOSE ||
      facts.prDraft === true ||
      facts.prMerged === true
    ) {
      return fail(BLOCKERS.BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH);
    }
    if (
      facts.pr459ScopeVerified !== true ||
      String(facts.computedReviewedScopeDigest).toLowerCase() !==
        PR459_CANONICAL_REVIEWED_SCOPE_DIGEST ||
      String(facts.suppliedReviewedScopeDigest).toLowerCase() !==
        PR459_CANONICAL_REVIEWED_SCOPE_DIGEST
    ) {
      return fail(BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH);
    }
    if (facts.pr459PayloadHashesVerified !== true) {
      return fail(BLOCKERS.BLOCKED_PR459_PAYLOAD_HASH_MISMATCH);
    }
    if (
      facts.pr459PayloadDigestVerified !== true ||
      facts.pr459PayloadDigest !== PR459_CANONICAL_PAYLOAD_DIGEST
    ) {
      return fail(BLOCKERS.BLOCKED_PR459_PAYLOAD_DIGEST_MISMATCH);
    }
    if (facts.pr459CurrentMasterAncestor !== true) {
      return fail(BLOCKERS.BLOCKED_PR459_NOT_CURRENT_WITH_MASTER);
    }
    if (facts.pr459TransitionTopologyVerified !== true) {
      return fail(BLOCKERS.BLOCKED_PR459_TRANSITION_TOPOLOGY_MISMATCH);
    }
    if (facts.pr459MasterStable !== true) {
      return fail(BLOCKERS.BLOCKED_PR459_CURRENT_MASTER_DRIFT_DURING_GATE);
    }
    if (facts.pr459PayloadStable !== true) {
      return fail(BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE);
    }
    if (facts.pr459ReviewerPermissionProven !== true) {
      return fail(BLOCKERS.BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN);
    }
    if (
      facts.pr459ProtectionInvariantsVerified !== true ||
      facts.pr459ThreadInventoryComplete !== true ||
      facts.finalAuthorizationSnapshotVerified !== true ||
      facts.finalGateSingletonVerified !== true
    ) {
      return fail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, {
        reason: 'pr459_final_authorization_snapshot_unproven',
      });
    }
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

function exactHeadApprovalCandidates(reviews, headSha, dispatchCreatedAtMs) {
  const head = String(headSha).toLowerCase();
  const dispatchMs = Number(dispatchCreatedAtMs);
  if (!Number.isFinite(dispatchMs)) {
    return { ok: false, reason: 'dispatch_time_unresolved', candidates: [] };
  }
  if (!Array.isArray(reviews)) {
    return { ok: false, reason: 'reviews_shape_invalid', candidates: [] };
  }
  const candidates = reviews.filter((r) => {
    if (!r || r.state !== 'APPROVED') return false;
    if (r.state === 'DISMISSED' || r.dismissed_at) return false;
    if (String(r.commit_id ?? '').toLowerCase() !== head) return false;
    const submitted = Date.parse(r.submitted_at ?? '');
    if (!Number.isFinite(submitted)) return false;
    if (submitted > dispatchMs) return false;
    return true;
  });
  if (candidates.length === 0) {
    return { ok: false, reason: 'no_exact_head_approval_before_dispatch', candidates: [] };
  }
  return { ok: true, candidates };
}

export function selectExactHeadApproval(reviews, headSha, dispatchCreatedAtMs) {
  const selected = exactHeadApprovalCandidates(reviews, headSha, dispatchCreatedAtMs);
  if (!selected.ok) return { ok: false, reason: selected.reason };
  return { ok: true, review: selected.candidates[0] };
}

/** PR #459 also requires the exact-head approval to come from a non-author. */
export function selectPr459ExactHeadApproval(
  reviews,
  headSha,
  dispatchCreatedAtMs,
  prAuthorLogin,
) {
  const author = String(prAuthorLogin ?? '').toLowerCase();
  if (!author) return { ok: false, reason: 'pr_author_unresolved' };
  if (!Array.isArray(reviews)) return { ok: false, reason: 'reviews_shape_invalid' };
  const nonAuthorReviews = reviews.filter((review) => {
    const reviewer = String(review?.user?.login ?? '').toLowerCase();
    return reviewer.length > 0 && reviewer !== author;
  });
  return selectExactHeadApproval(nonAuthorReviews, headSha, dispatchCreatedAtMs);
}

/** Validate the repository-permission response for one exact reviewer identity. */
export function validateReviewerPermissionResponse(payload, expectedLogin) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, technicalError: true, reason: 'reviewer_permission_shape_invalid' };
  }
  const expected = String(expectedLogin ?? '').trim().toLowerCase();
  const actual =
    typeof payload.user?.login === 'string' ? payload.user.login.trim().toLowerCase() : '';
  if (!expected || !actual || actual !== expected) {
    return { ok: false, technicalError: true, reason: 'reviewer_permission_identity_invalid' };
  }
  if (typeof payload.permission !== 'string') {
    return { ok: false, technicalError: true, reason: 'reviewer_permission_missing' };
  }
  const permission = payload.permission.trim().toLowerCase();
  if (ELIGIBLE_REPOSITORY_PERMISSIONS.includes(permission)) {
    return { ok: true, technicalError: false, permission };
  }
  if (INELIGIBLE_REPOSITORY_PERMISSIONS.includes(permission)) {
    return {
      ok: false,
      technicalError: false,
      reason: 'reviewer_permission_ineligible',
      permission,
    };
  }
  return {
    ok: false,
    technicalError: true,
    reason: 'reviewer_permission_unknown',
    permission,
  };
}

const KNOWN_REVIEW_STATES = Object.freeze([
  'APPROVED',
  'CHANGES_REQUESTED',
  'COMMENTED',
  'DISMISSED',
  'PENDING',
]);

export function validatePr459ReviewInventory(reviews) {
  if (!Array.isArray(reviews)) {
    return { ok: false, reason: 'reviews_shape_invalid' };
  }
  for (const review of reviews) {
    if (!isPlainObject(review) || !KNOWN_REVIEW_STATES.includes(review.state)) {
      return { ok: false, reason: 'review_record_shape_invalid' };
    }
    if (
      !isPlainObject(review.user) ||
      typeof review.user.login !== 'string' ||
      review.user.login.trim().length === 0
    ) {
      return { ok: false, reason: 'reviewer_identity_malformed' };
    }
    if (!FULL_SHA_RE.test(String(review.commit_id ?? ''))) {
      return { ok: false, reason: 'review_commit_identity_malformed' };
    }
    if (!Number.isFinite(Date.parse(review.submitted_at ?? ''))) {
      return { ok: false, reason: 'review_submission_time_malformed' };
    }
    if (
      review.dismissed_at != null &&
      !Number.isFinite(Date.parse(review.dismissed_at))
    ) {
      return { ok: false, reason: 'review_dismissal_time_malformed' };
    }
  }
  return { ok: true };
}

/**
 * Select an exact-head non-author approval only after repository permission is
 * independently proven. At least one fully proven candidate is sufficient;
 * uncertainty is fatal when no candidate can be proven eligible.
 */
export async function selectEligiblePr459ExactHeadApproval(
  deps,
  { owner, repo, reviews, headSha, dispatchCreatedAtMs, prAuthorLogin },
) {
  const author = String(prAuthorLogin ?? '').trim().toLowerCase();
  if (!author) {
    return { ok: false, technicalError: true, reason: 'pr_author_unresolved' };
  }
  const inventory = validatePr459ReviewInventory(reviews);
  if (!inventory.ok) {
    return { ok: false, technicalError: true, reason: inventory.reason };
  }
  const selected = exactHeadApprovalCandidates(reviews, headSha, dispatchCreatedAtMs);
  if (!selected.ok) {
    return {
      ok: false,
      technicalError: selected.reason === 'reviews_shape_invalid',
      reason: selected.reason,
    };
  }

  const candidates = [];
  const seen = new Set();
  let malformedCandidate = false;
  for (const review of selected.candidates) {
    const login = typeof review?.user?.login === 'string' ? review.user.login.trim() : '';
    const normalized = login.toLowerCase();
    if (!normalized) {
      malformedCandidate = true;
      continue;
    }
    if (normalized === author || seen.has(normalized)) continue;
    seen.add(normalized);
    candidates.push({ review, login, normalized });
  }
  if (candidates.length === 0) {
    return {
      ok: false,
      technicalError: malformedCandidate,
      reason: malformedCandidate ? 'reviewer_identity_malformed' : 'no_non_author_exact_head_approval',
    };
  }

  const technicalFailures = [];
  for (const candidate of candidates) {
    let payload;
    try {
      payload = await rest(
        deps,
        'GET',
        `/repos/${owner}/${repo}/collaborators/${encodeURIComponent(candidate.login)}/permission`,
      );
    } catch (err) {
      technicalFailures.push({
        reviewer: candidate.login,
        reason: 'reviewer_permission_api_error',
        status: err?.sanitized?.status ?? null,
      });
      continue;
    }
    const permission = validateReviewerPermissionResponse(payload, candidate.login);
    if (permission.ok) {
      return {
        ok: true,
        review: candidate.review,
        reviewerLogin: candidate.login,
        permission: permission.permission,
      };
    }
    if (permission.technicalError) {
      technicalFailures.push({
        reviewer: candidate.login,
        reason: permission.reason,
      });
    }
  }

  if (technicalFailures.length > 0 || malformedCandidate) {
    return {
      ok: false,
      technicalError: true,
      reason: technicalFailures[0]?.reason ?? 'reviewer_identity_malformed',
    };
  }
  return { ok: false, technicalError: false, reason: 'no_eligible_reviewer_permission' };
}

async function rest(deps, method, urlPath, body) {
  deps.mergeCalls = deps.mergeCalls ?? [];
  if (/\/merges$|\/merge$/.test(urlPath)) deps.mergeCalls.push({ method, urlPath });
  assertChecksRestRequest(method, urlPath);
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
  const all = [];
  let expectedTotal = null;
  for (let page = 1; page <= 100; page += 1) {
    const batch = await rest(
      deps,
      'GET',
      `/repos/${owner}/${repo}/commits/${headSha}/check-runs?filter=all&per_page=100&page=${page}`,
    );
    if (
      !isPlainObject(batch) ||
      !Number.isSafeInteger(batch.total_count) ||
      batch.total_count < 0 ||
      !Array.isArray(batch.check_runs)
    ) {
      throw pathGuardError('check_run_inventory_shape_invalid');
    }
    if (expectedTotal == null) expectedTotal = batch.total_count;
    if (batch.total_count !== expectedTotal) {
      throw pathGuardError('check_run_inventory_total_changed');
    }
    all.push(...batch.check_runs);
    if (batch.check_runs.length < 100) {
      if (all.length !== expectedTotal) {
        throw pathGuardError('check_run_inventory_incomplete');
      }
      return all;
    }
  }
  throw pathGuardError('check_run_pagination_bound_exceeded');
}

export async function listReviewThreadsPaginated(deps, owner, repo, prNumber) {
  const threads = [];
  let after = null;
  const seenCursors = new Set();
  for (let i = 0; i < REVIEW_THREAD_PAGE_LIMIT; i += 1) {
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
    if (Array.isArray(gql?.errors) && gql.errors.length > 0) {
      const err = new Error('review_threads_graphql_partial_error');
      err.sanitized = { message: 'review_threads_graphql_partial_error' };
      throw err;
    }
    const conn = gql?.data?.repository?.pullRequest?.reviewThreads;
    const pageInfo = conn?.pageInfo;
    if (
      !conn ||
      typeof conn !== 'object' ||
      Array.isArray(conn) ||
      !Array.isArray(conn.nodes) ||
      !pageInfo ||
      typeof pageInfo !== 'object' ||
      Array.isArray(pageInfo) ||
      typeof pageInfo.hasNextPage !== 'boolean' ||
      !Object.prototype.hasOwnProperty.call(pageInfo, 'endCursor') ||
      (pageInfo.endCursor !== null && typeof pageInfo.endCursor !== 'string')
    ) {
      const err = new Error('review_threads_page_shape_invalid');
      err.sanitized = { message: 'review_threads_page_shape_invalid' };
      throw err;
    }
    for (const thread of conn.nodes) {
      if (
        !thread ||
        typeof thread !== 'object' ||
        Array.isArray(thread) ||
        typeof thread.isResolved !== 'boolean'
      ) {
        const err = new Error('review_thread_node_shape_invalid');
        err.sanitized = { message: 'review_thread_node_shape_invalid' };
        throw err;
      }
    }
    threads.push(...conn.nodes);
    if (pageInfo.hasNextPage === false) return threads;
    if (
      typeof pageInfo.endCursor !== 'string' ||
      pageInfo.endCursor.length === 0 ||
      pageInfo.endCursor.trim() !== pageInfo.endCursor ||
      seenCursors.has(pageInfo.endCursor)
    ) {
      const err = new Error('review_threads_cursor_invalid');
      err.sanitized = { message: 'review_threads_cursor_invalid' };
      throw err;
    }
    if (i + 1 >= REVIEW_THREAD_PAGE_LIMIT) {
      const err = new Error('review_threads_page_limit_exceeded');
      err.sanitized = { message: 'review_threads_page_limit_exceeded' };
      throw err;
    }
    seenCursors.add(pageInfo.endCursor);
    after = pageInfo.endCursor;
  }
  throw pathGuardError('review_threads_page_limit_exceeded');
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

/** Prove the complete canonical master-protection response required by PR459. */
export function validatePr459MasterProtection(protection, gateAppId) {
  if (!isPlainObject(protection)) {
    return { ok: false, reason: 'protection_shape_invalid' };
  }
  const status = protection.required_status_checks;
  if (!isPlainObject(status)) {
    return { ok: false, reason: 'required_status_checks_invalid' };
  }
  if (status.strict !== true) {
    return { ok: false, reason: 'required_status_checks_strict_not_true' };
  }
  if (
    !Array.isArray(status.contexts) ||
    !status.contexts.every(
      (context) => typeof context === 'string' && context.length > 0 && context.trim() === context,
    ) ||
    new Set(status.contexts).size !== status.contexts.length ||
    !Array.isArray(status.checks) ||
    !status.checks.every(
      (check) =>
        isPlainObject(check) &&
        typeof check.context === 'string' &&
        check.context.length > 0 &&
        check.context.trim() === check.context &&
        (check.app_id == null || isPositiveSafeInteger(check.app_id)),
    )
  ) {
    return { ok: false, reason: 'required_status_checks_shape_invalid' };
  }
  if (protection.enforce_admins?.enabled !== true) {
    return { ok: false, reason: 'enforce_admins_not_enabled' };
  }
  if (protection.allow_force_pushes?.enabled !== false) {
    return { ok: false, reason: 'force_push_state_not_disabled' };
  }
  if (protection.allow_deletions?.enabled !== false) {
    return { ok: false, reason: 'deletion_state_not_disabled' };
  }
  const reviews = protection.required_pull_request_reviews;
  if (
    !isPlainObject(reviews) ||
    reviews.dismiss_stale_reviews !== true ||
    reviews.require_code_owner_reviews !== false ||
    !Number.isInteger(reviews.required_approving_review_count) ||
    reviews.required_approving_review_count < 1
  ) {
    return { ok: false, reason: 'required_pull_request_reviews_invalid' };
  }
  if (protection.required_conversation_resolution?.enabled !== true) {
    return { ok: false, reason: 'required_conversation_resolution_not_enabled' };
  }
  if (protection.restrictions !== null) {
    return { ok: false, reason: 'branch_restrictions_not_canonical' };
  }
  if (!status.contexts.includes(GATE_CHECK_RUN_NAME)) {
    return { ok: false, reason: 'required_gate_context_missing' };
  }
  const gateChecks = status.checks.filter((entry) => entry.context === GATE_CHECK_RUN_NAME);
  if (
    gateChecks.length !== 1 ||
    !isPositiveSafeInteger(gateAppId) ||
    !isPositiveSafeInteger(gateChecks[0].app_id) ||
    gateChecks[0].app_id !== gateAppId
  ) {
    return { ok: false, reason: 'required_gate_app_identity_invalid' };
  }
  return { ok: true, requiredContexts: [...status.contexts] };
}

/** Verify every non-gate required context against the exact current head. */
export function validateRequiredNonGateChecks(checkRuns, requiredContexts, headSha) {
  if (
    !Array.isArray(checkRuns) ||
    !Array.isArray(requiredContexts) ||
    !requiredContexts.every((context) => typeof context === 'string')
  ) {
    return { ok: false, reason: 'required_check_inventory_shape_invalid' };
  }
  const head = String(headSha ?? '').toLowerCase();
  if (!FULL_SHA_RE.test(head)) return { ok: false, reason: 'required_check_head_invalid' };
  for (const check of checkRuns) {
    if (!isPlainObject(check) || typeof check.name !== 'string') {
      return { ok: false, reason: 'check_run_shape_invalid' };
    }
  }
  for (const context of requiredContexts) {
    if (context === GATE_CHECK_RUN_NAME) continue;
    const onHead = checkRuns.filter(
      (check) => check.name === context && String(check.head_sha ?? '').toLowerCase() === head,
    );
    if (
      onHead.length === 0 ||
      !onHead.every((check) => check.status === 'completed' && check.conclusion === 'success')
    ) {
      return { ok: false, reason: 'required_check_not_successful', context };
    }
  }
  return { ok: true };
}

/** Prove one and only one same-head canonical gate check owned by this attempt. */
export function validateFinalGateSingleton(
  checkRuns,
  { headSha, checkRunId, gateAppId },
) {
  if (!Array.isArray(checkRuns)) {
    return { ok: false, reason: 'check_run_inventory_shape_invalid' };
  }
  const head = String(headSha ?? '').toLowerCase();
  if (
    !FULL_SHA_RE.test(head) ||
    !isPositiveSafeInteger(checkRunId) ||
    !isPositiveSafeInteger(gateAppId)
  ) {
    return { ok: false, reason: 'gate_identity_unresolved' };
  }
  const candidates = [];
  for (const check of checkRuns) {
    if (!isPlainObject(check) || typeof check.name !== 'string') {
      return { ok: false, reason: 'check_run_shape_invalid' };
    }
    if (check.name !== GATE_CHECK_RUN_NAME) continue;
    if (!FULL_SHA_RE.test(String(check.head_sha ?? ''))) {
      return { ok: false, reason: 'gate_check_head_invalid' };
    }
    if (String(check.head_sha).toLowerCase() === head) candidates.push(check);
  }
  if (candidates.length !== 1) {
    return { ok: false, reason: 'final_gate_context_count', count: candidates.length };
  }
  const gate = candidates[0];
  if (!isPositiveSafeInteger(gate.id) || gate.id !== checkRunId) {
    return { ok: false, reason: 'final_gate_check_id_mismatch' };
  }
  const appId = gate.app?.id ?? gate.app_id;
  if (!isPositiveSafeInteger(appId) || appId !== gateAppId) {
    return { ok: false, reason: 'final_gate_app_identity_invalid' };
  }
  if (gate.status !== 'in_progress' || gate.conclusion != null) {
    return { ok: false, reason: 'final_gate_attempt_state_invalid' };
  }
  return { ok: true };
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
  const scriptAtRun = await rest(
    deps,
    'GET',
    `/repos/${owner}/${repo}/contents/${GATE_SCRIPT_PATH}?ref=${run.head_sha}`,
  );
  const scriptAtMaster = await rest(
    deps,
    'GET',
    `/repos/${owner}/${repo}/contents/${GATE_SCRIPT_PATH}?ref=${defaultBranch}`,
  );
  const idRun = contentIdentity(atRun);
  const idMaster = contentIdentity(atMaster);
  const scriptIdRun = contentIdentity(scriptAtRun);
  const scriptIdMaster = contentIdentity(scriptAtMaster);
  if (!idRun?.sha || !idMaster?.sha) return { ok: false, reason: 'workflow_blob_unresolved' };
  if (idRun.path !== WORKFLOW_FILE_PATH || idMaster.path !== WORKFLOW_FILE_PATH) {
    return { ok: false, reason: 'workflow_content_path_mismatch' };
  }
  if (idRun.sha !== idMaster.sha) return { ok: false, reason: 'workflow_blob_mismatch' };
  if (!scriptIdRun?.sha || !scriptIdMaster?.sha) {
    return { ok: false, reason: 'gate_script_blob_unresolved' };
  }
  if (scriptIdRun.path !== GATE_SCRIPT_PATH || scriptIdMaster.path !== GATE_SCRIPT_PATH) {
    return { ok: false, reason: 'gate_script_content_path_mismatch' };
  }
  if (scriptIdRun.sha !== scriptIdMaster.sha) {
    return { ok: false, reason: 'gate_script_blob_mismatch' };
  }

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
  const isPr459Exception = inputs.freezeScope === PR459_EXCEPTION_TOKEN;

  let checkRunId = null;
  let gateAppId = null;
  let checkCreated = 0;
  let checkCompleted = 0;
  let pr459SnapshotA = null;

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

  const failAfterCreate = (blocker, reason, extra = {}) =>
    completeIfCreated({
      conclusion: 'failure',
      blocker,
      evidence: sanitizeEvidence({ decision: 'failure', blocker, reason, ...extra }),
    });

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
    if (!SUPPORTED_FREEZE_SCOPES.includes(inputs.freezeScope)) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING);
    }
    if (
      isPr459Exception &&
      (Number(inputs.prNumber) !== PR459_NUMBER ||
        prA.head?.ref !== PR459_HEAD_BRANCH ||
        prA.base?.ref !== PR459_BASE_BRANCH ||
        inputs.baseBranch !== PR459_BASE_BRANCH ||
        inputs.mergeMode !== PR459_MERGE_MODE ||
        Number(prA.changed_files) !== PR459_PAYLOAD_FILE_COUNT ||
        prA.draft !== false ||
        prA.merged !== false ||
        prA.merged_at !== null ||
        String(prA.user?.login ?? '').length === 0)
    ) {
      return earlyFail(BLOCKERS.BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH);
    }
    if (prA.auto_merge) {
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTO_MERGE_ACTIVE);
    }
    if (isPr459Exception && prA.auto_merge !== null) {
      return earlyFail(BLOCKERS.BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH, {
        reason: 'auto_merge_state_unresolved',
      });
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
    const approval = isPr459Exception
      ? await selectEligiblePr459ExactHeadApproval(deps, {
          owner,
          repo,
          reviews,
          headSha: inputs.headSha,
          dispatchCreatedAtMs: proven.createdAtMs,
          prAuthorLogin: prA.user?.login,
        })
      : selectExactHeadApproval(reviews, inputs.headSha, proven.createdAtMs);
    if (!approval.ok) {
      if (approval.reason === 'dispatch_time_unresolved') {
        return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN);
      }
      if (isPr459Exception && approval.technicalError) {
        return earlyFail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, {
          reason: approval.reason,
        });
      }
      if (isPr459Exception && approval.reason?.includes('permission')) {
        return earlyFail(BLOCKERS.BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN, {
          reason: approval.reason,
        });
      }
      return earlyFail(BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD, {
        reason: approval.reason,
        also: BLOCKERS.BLOCKED_VIONA_T3_AUTHORIZATION_HEAD_ACTIVATION_TIME_UNPROVEN,
      });
    }

    // The PR459 profile is proven against live bytes and current master before
    // any required check is created. The same mutable facts are repeated in B.
    if (isPr459Exception) {
      let filesA;
      try {
        filesA = await listAllPrFiles(deps, owner, repo, inputs.prNumber);
      } catch {
        return earlyFail(BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH, {
          reason: 'snapshot_a_files_api_error',
        });
      }
      const payloadA = await verifyPr459PayloadAtHead(deps, {
        owner,
        repo,
        headSha: inputs.headSha,
        files: filesA,
      });
      if (!payloadA.ok) {
        return earlyFail(payloadA.blocker, { reason: payloadA.reason, path: payloadA.path });
      }
      if (
        payloadA.reviewedScopeDigest !== PR459_CANONICAL_REVIEWED_SCOPE_DIGEST ||
        String(inputs.reviewedScopeDigest).toLowerCase() !==
          PR459_CANONICAL_REVIEWED_SCOPE_DIGEST
      ) {
        return earlyFail(BLOCKERS.BLOCKED_PR459_SCOPE_MISMATCH, {
          reason: 'snapshot_a_scope_digest',
        });
      }
      const ancestryA = await verifyPr459MasterAncestryAndTopology(deps, {
        owner,
        repo,
        masterSha: proven.currentMasterSha,
        headSha: inputs.headSha,
      });
      if (!ancestryA.ok) {
        return earlyFail(ancestryA.blocker, { reason: ancestryA.reason });
      }
      pr459SnapshotA = {
        masterSha: String(proven.currentMasterSha).toLowerCase(),
        headSha: String(inputs.headSha).toLowerCase(),
        reviewedScopeDigest: payloadA.reviewedScopeDigest,
        payloadDigest: payloadA.payloadDigest,
      };
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
    if (!isPositiveSafeInteger(checkRunId)) {
      return completeIfCreated(
        earlyFail(BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR, {
          reason: 'check_run_id_missing',
        }),
      );
    }
    if (!isPositiveSafeInteger(gateAppId)) {
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
    const files = isPr459Exception
      ? null
      : await listAllPrFiles(deps, owner, repo, inputs.prNumber);
    const computedDigest = isPr459Exception
      ? pr459SnapshotA.reviewedScopeDigest
      : computeReviewedScopeDigest(files);
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
    } catch (err) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          reason: err?.sanitized?.message ?? 'review_threads_inventory_error',
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

    const protectionTokenPresent =
      String(env.VIONA_GATE_PROTECTION_READ_TOKEN ?? '').trim().length > 0;
    if (!protectionTokenPresent) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING,
        }),
      });
    }

    let repositoryEnforcementActive = false;
    let requiredCheckFailed = false;
    let staleRequiredCheckFromOtherSha = false;
    let protection;
    try {
      if (!deps.protectionRestRequest) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
            reason: 'protection_adapter_missing',
          }),
        });
      }
      protection = await deps.protectionRestRequest({
        method: 'GET',
        urlPath: CANONICAL_MASTER_PROTECTION_PATH,
      });
    } catch (err) {
      const status = err?.sanitized?.status;
      if (status === 401 || status === 403) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED,
            status,
          }),
        });
      }
      if (status === 404) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
            status,
          }),
        });
      }
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          reason: 'protection_get_error',
        }),
      });
    }
    const protectionMalformed = !isPlainObject(protection);
    const pr459Protection = isPr459Exception
      ? validatePr459MasterProtection(protection, gateAppId)
      : null;
    repositoryEnforcementActive = isPr459Exception
      ? pr459Protection.ok
      : !protectionMalformed &&
        (protection?.enforce_admins?.enabled === true ||
          protection?.required_status_checks != null);
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
    const requiredContexts = isPr459Exception
      ? pr459Protection.requiredContexts ?? []
      : protection?.required_status_checks?.contexts ?? [];
    const requiredChecks = protection?.required_status_checks?.checks ?? [];
    const requiredGateCheck = Array.isArray(requiredChecks)
      ? requiredChecks.find((entry) => entry?.context === GATE_CHECK_RUN_NAME)
      : null;
    if (
      isPr459Exception &&
      (!pr459Protection.ok ||
        !requiredContexts.includes(GATE_CHECK_RUN_NAME) ||
        !requiredGateCheck ||
        String(requiredGateCheck.app_id ?? '') !== String(gateAppId))
    ) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
          reason: pr459Protection.reason ?? 'pr459_protection_invariants_missing',
        }),
      });
    }
    const checkRuns = await listAllCheckRuns(deps, owner, repo, inputs.headSha);
    if (isPr459Exception) {
      const nonGateChecks = validateRequiredNonGateChecks(
        checkRuns,
        requiredContexts,
        inputs.headSha,
      );
      requiredCheckFailed = !nonGateChecks.ok;
    } else {
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
    if (
      isPr459Exception &&
      (Number(prB.number) !== PR459_NUMBER ||
        prB.head?.ref !== PR459_HEAD_BRANCH ||
        Number(prB.changed_files) !== PR459_PAYLOAD_FILE_COUNT ||
        prB.draft !== false ||
        prB.merged !== false ||
        prB.merged_at !== null ||
        prB.auto_merge !== null ||
        String(prB.user?.login ?? '').toLowerCase() !==
          String(prA.user?.login ?? '').toLowerCase())
    ) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker: BLOCKERS.BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker: BLOCKERS.BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH,
          reason: 'snapshot_b_binding',
        }),
      });
    }
    let reviewsB = reviews;
    if (isPr459Exception) {
      try {
        reviewsB = await listPaginated(
          deps,
          `/repos/${owner}/${repo}/pulls/${inputs.prNumber}/reviews`,
          (batch) => (Array.isArray(batch) ? batch : null),
        );
      } catch {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED,
            reason: 'snapshot_b_reviews_api_error',
          }),
        });
      }
    }
    const approvalB = isPr459Exception
      ? await selectEligiblePr459ExactHeadApproval(deps, {
          owner,
          repo,
          reviews: reviewsB,
          headSha: inputs.headSha,
          dispatchCreatedAtMs: proven.createdAtMs,
          prAuthorLogin: prB.user?.login,
        })
      : selectExactHeadApproval(reviewsB, inputs.headSha, proven.createdAtMs);
    if (!approvalB.ok) {
      return completeIfCreated({
        conclusion: 'failure',
        blocker:
          isPr459Exception && approvalB.technicalError
            ? BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR
            : isPr459Exception && approvalB.reason?.includes('permission')
              ? BLOCKERS.BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN
              : BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD,
        evidence: sanitizeEvidence({
          decision: 'failure',
          blocker:
            isPr459Exception && approvalB.technicalError
              ? BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR
              : isPr459Exception && approvalB.reason?.includes('permission')
                ? BLOCKERS.BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN
                : BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD,
          reason: `snapshot_b_${approvalB.reason ?? 'review_invalid'}`,
        }),
      });
    }

    let pr459SnapshotB = null;
    if (isPr459Exception) {
      let masterB;
      try {
        const refB = await rest(
          deps,
          'GET',
          `/repos/${owner}/${repo}/git/ref/heads/${PR459_BASE_BRANCH}`,
        );
        masterB = refB?.object?.sha;
      } catch {
        masterB = null;
      }
      if (
        !FULL_SHA_RE.test(String(masterB ?? '')) ||
        String(masterB).toLowerCase() !== pr459SnapshotA.masterSha
      ) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_PR459_CURRENT_MASTER_DRIFT_DURING_GATE,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_PR459_CURRENT_MASTER_DRIFT_DURING_GATE,
          }),
        });
      }
      const ancestryB = await verifyPr459MasterAncestryAndTopology(deps, {
        owner,
        repo,
        masterSha: masterB,
        headSha: inputs.headSha,
      });
      if (!ancestryB.ok) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: ancestryB.blocker,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: ancestryB.blocker,
            reason: `snapshot_b_${ancestryB.reason}`,
          }),
        });
      }
      let filesB;
      try {
        filesB = await listAllPrFiles(deps, owner, repo, inputs.prNumber);
      } catch {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
            reason: 'snapshot_b_files_api_error',
          }),
        });
      }
      const payloadB = await verifyPr459PayloadAtHead(deps, {
        owner,
        repo,
        headSha: inputs.headSha,
        files: filesB,
      });
      if (!payloadB.ok) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
            underlying: payloadB.blocker,
            reason: payloadB.reason,
            path: payloadB.path,
          }),
        });
      }
      pr459SnapshotB = {
        masterSha: String(masterB).toLowerCase(),
        headSha: String(inputs.headSha).toLowerCase(),
        reviewedScopeDigest: payloadB.reviewedScopeDigest,
        payloadDigest: payloadB.payloadDigest,
      };
      if (
        pr459SnapshotB.masterSha !== pr459SnapshotA.masterSha ||
        pr459SnapshotB.headSha !== pr459SnapshotA.headSha ||
        pr459SnapshotB.reviewedScopeDigest !== pr459SnapshotA.reviewedScopeDigest ||
        pr459SnapshotB.payloadDigest !== pr459SnapshotA.payloadDigest
      ) {
        return completeIfCreated({
          conclusion: 'failure',
          blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
          evidence: sanitizeEvidence({
            decision: 'failure',
            blocker: BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
            reason: 'snapshot_a_b_mismatch',
          }),
        });
      }
    }

    // Final authorization snapshot. Every mutable PR459 authorization fact is
    // read again, then the singleton gate check is the final remote read before
    // policy evaluation and completion.
    let finalEligibleApproval = approvalB;
    if (isPr459Exception) {
      let prFinal;
      try {
        prFinal = await rest(deps, 'GET', `/repos/${owner}/${repo}/pulls/${inputs.prNumber}`);
      } catch {
        return failAfterCreate(
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          'final_pr_read_failed',
        );
      }
      if (
        !isPlainObject(prFinal) ||
        !Number.isSafeInteger(prFinal.number) ||
        Number(prFinal.number) !== PR459_NUMBER ||
        prFinal.state !== 'open' ||
        prFinal.base?.ref !== PR459_BASE_BRANCH ||
        prFinal.head?.ref !== PR459_HEAD_BRANCH ||
        String(prFinal.head?.sha ?? '').toLowerCase() !== String(inputs.headSha).toLowerCase() ||
        !Number.isSafeInteger(prFinal.changed_files) ||
        prFinal.changed_files !== PR459_PAYLOAD_FILE_COUNT ||
        prFinal.draft !== false ||
        prFinal.merged !== false ||
        prFinal.merged_at !== null ||
        prFinal.auto_merge !== null ||
        String(prFinal.user?.login ?? '').toLowerCase() !==
          String(prA.user?.login ?? '').toLowerCase()
      ) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_PR459_EXCEPTION_BINDING_MISMATCH,
          'final_pr_snapshot_invalid',
        );
      }

      let reviewsFinal;
      try {
        reviewsFinal = await listPaginated(
          deps,
          `/repos/${owner}/${repo}/pulls/${inputs.prNumber}/reviews`,
          (batch) => (Array.isArray(batch) ? batch : null),
        );
      } catch {
        return failAfterCreate(
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          'final_reviews_inventory_failed',
        );
      }
      finalEligibleApproval = await selectEligiblePr459ExactHeadApproval(deps, {
        owner,
        repo,
        reviews: reviewsFinal,
        headSha: inputs.headSha,
        dispatchCreatedAtMs: proven.createdAtMs,
        prAuthorLogin: prFinal.user?.login,
      });
      if (!finalEligibleApproval.ok) {
        const blocker = finalEligibleApproval.technicalError
          ? BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR
          : finalEligibleApproval.reason?.includes('permission')
            ? BLOCKERS.BLOCKED_PR459_REVIEWER_PERMISSION_UNPROVEN
            : BLOCKERS.BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD;
        return failAfterCreate(
          blocker,
          `final_${finalEligibleApproval.reason ?? 'review_invalid'}`,
        );
      }

      let finalThreads;
      try {
        finalThreads = await listReviewThreadsPaginated(deps, owner, repo, inputs.prNumber);
      } catch (err) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          err?.sanitized?.message ?? 'final_review_threads_inventory_failed',
        );
      }
      if (finalThreads.some((thread) => thread.isResolved === false)) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_MERGE_UNRESOLVED_CONVERSATION,
          'final_unresolved_conversation',
        );
      }

      let finalMasterSha;
      try {
        const finalMaster = await rest(
          deps,
          'GET',
          `/repos/${owner}/${repo}/git/ref/heads/${PR459_BASE_BRANCH}`,
        );
        finalMasterSha = finalMaster?.object?.sha;
      } catch {
        finalMasterSha = null;
      }
      if (
        !FULL_SHA_RE.test(String(finalMasterSha ?? '')) ||
        String(finalMasterSha).toLowerCase() !== pr459SnapshotA.masterSha ||
        String(finalMasterSha).toLowerCase() !== pr459SnapshotB.masterSha
      ) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_PR459_CURRENT_MASTER_DRIFT_DURING_GATE,
          'final_master_identity_drift',
        );
      }
      const finalAncestry = await verifyPr459MasterAncestryAndTopology(deps, {
        owner,
        repo,
        masterSha: finalMasterSha,
        headSha: inputs.headSha,
      });
      if (!finalAncestry.ok) {
        return failAfterCreate(
          finalAncestry.blocker,
          `final_${finalAncestry.reason}`,
        );
      }

      let finalProtection;
      try {
        finalProtection = await deps.protectionRestRequest({
          method: 'GET',
          urlPath: CANONICAL_MASTER_PROTECTION_PATH,
        });
      } catch (err) {
        return failAfterCreate(
          err?.sanitized?.status === 401 || err?.sanitized?.status === 403
            ? BLOCKERS.BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED
            : BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          'final_protection_read_failed',
        );
      }
      const finalProtectionProof = validatePr459MasterProtection(finalProtection, gateAppId);
      if (!finalProtectionProof.ok) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED,
          `final_${finalProtectionProof.reason}`,
        );
      }

      let finalRequiredCheckRuns;
      try {
        finalRequiredCheckRuns = await listAllCheckRuns(deps, owner, repo, inputs.headSha);
      } catch {
        return failAfterCreate(
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          'final_required_check_inventory_failed',
        );
      }
      const finalNonGateChecks = validateRequiredNonGateChecks(
        finalRequiredCheckRuns,
        finalProtectionProof.requiredContexts,
        inputs.headSha,
      );
      if (!finalNonGateChecks.ok) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_MERGE_REQUIRED_CHECK_FAILED,
          `final_${finalNonGateChecks.reason}`,
          { context: finalNonGateChecks.context ?? null },
        );
      }

      let finalFiles;
      try {
        finalFiles = await listAllPrFiles(deps, owner, repo, inputs.prNumber);
      } catch {
        return failAfterCreate(
          BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
          'final_files_inventory_failed',
        );
      }
      const finalPayload = await verifyPr459PayloadAtHead(deps, {
        owner,
        repo,
        headSha: inputs.headSha,
        files: finalFiles,
      });
      if (
        !finalPayload.ok ||
        finalPayload.reviewedScopeDigest !== pr459SnapshotA.reviewedScopeDigest ||
        finalPayload.reviewedScopeDigest !== pr459SnapshotB.reviewedScopeDigest ||
        finalPayload.payloadDigest !== pr459SnapshotA.payloadDigest ||
        finalPayload.payloadDigest !== pr459SnapshotB.payloadDigest
      ) {
        return failAfterCreate(
          BLOCKERS.BLOCKED_PR459_PAYLOAD_CHANGED_DURING_GATE,
          `final_${finalPayload.reason ?? 'payload_snapshot_mismatch'}`,
          { path: finalPayload.path ?? null },
        );
      }

      let finalGateRuns;
      try {
        finalGateRuns = await listAllCheckRuns(deps, owner, repo, inputs.headSha);
      } catch {
        return failAfterCreate(
          BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          'final_gate_context_inventory_failed',
        );
      }
      const finalGateSingleton = validateFinalGateSingleton(finalGateRuns, {
        headSha: inputs.headSha,
        checkRunId,
        gateAppId,
      });
      if (!finalGateSingleton.ok) {
        return failAfterCreate(
          finalGateSingleton.reason?.includes('count')
            ? BLOCKERS.BLOCKED_VIONA_T3_DUPLICATE_GATE_RESULT_AMBIGUOUS
            : BLOCKERS.BLOCKED_VIONA_T3_GATE_TECHNICAL_ERROR,
          finalGateSingleton.reason,
          { count: finalGateSingleton.count ?? null },
        );
      }
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
      pr459HeadBranch: prB.head?.ref ?? null,
      pr459Purpose: isPr459Exception ? PR459_PURPOSE : null,
      prDraft: prB.draft === true,
      prMerged: prB.merged === true || prB.merged_at != null,
      pr459ScopeVerified: isPr459Exception ? true : null,
      pr459PayloadHashesVerified: isPr459Exception ? true : null,
      pr459PayloadDigestVerified: isPr459Exception ? true : null,
      pr459PayloadDigest: isPr459Exception ? pr459SnapshotB.payloadDigest : null,
      pr459CurrentMasterAncestor: isPr459Exception ? true : null,
      pr459TransitionTopologyVerified: isPr459Exception ? true : null,
      pr459MasterStable: isPr459Exception ? true : null,
      pr459PayloadStable: isPr459Exception ? true : null,
      pr459ReviewerPermissionProven: isPr459Exception ? true : null,
      pr459ProtectionInvariantsVerified: isPr459Exception ? true : null,
      pr459ThreadInventoryComplete: isPr459Exception ? true : null,
      finalAuthorizationSnapshotVerified: isPr459Exception ? true : null,
      finalGateSingletonVerified: isPr459Exception ? true : null,
      approvingReviewer: isPr459Exception ? finalEligibleApproval.reviewerLogin : null,
      approvingReviewerPermission: isPr459Exception ? finalEligibleApproval.permission : null,
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
  const checksToken = env.GITHUB_TOKEN;
  const apiBase = 'https://api.github.com';

  async function githubFetch(token, { method, urlPath, body }) {
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

  async function restRequest({ method, urlPath, body }) {
    assertChecksRestRequest(method, urlPath);
    return githubFetch(checksToken, { method, urlPath, body });
  }

  async function protectionRestRequest({ method, urlPath, body }) {
    assertProtectionReadRequest(method, urlPath);
    const protectionToken = String(env.VIONA_GATE_PROTECTION_READ_TOKEN ?? '').trim();
    if (!protectionToken) {
      const err = new Error('protection_read_credential_missing');
      err.sanitized = { message: 'protection_read_credential_missing' };
      throw err;
    }
    return githubFetch(protectionToken, { method, urlPath, body });
  }

  async function graphqlRequest({ query, variables }) {
    const res = await fetch(`${apiBase}/graphql`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${checksToken}`,
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
    protectionRestRequest,
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
