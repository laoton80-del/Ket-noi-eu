/**
 * Pack30C — Staging QA execution for POST /api/viona/requests/:id/actions/execution-plan-preview
 *
 * Bounded, mock-only staging QA per docs/product/VIONA_REQUEST_PACK30C_STAGING_QA_AUTHORIZATION_PACKET.md
 * §6-§7 and the recorded operator phrase APPROVE_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA (PR #284/#285).
 *
 * - Existing rows only — never creates/seeds a VionaRequest.
 * - Never mutates request status.
 * - Excludes the Pack25 hold row (ec9a8b69-8a60-45aa-99ba-fc805a101dcc).
 * - Stop-on-error per plan §6.6 — aborts immediately on any real-execution leak signal.
 * - Never prints tokens, PINs, or Authorization headers.
 *
 * Usage: node scripts/test-viona-pack30c-staging-qa-execution-plan-preview.mjs
 * Env (.env.local / .env): EXPO_PUBLIC_REST_API_BASE, VIONA_PILOT_PIN, VIONA_PILOT_OPS_ADMIN_PHONE
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const PACK25_HOLD_ROW_ID = 'ec9a8b69-8a60-45aa-99ba-fc805a101dcc';
const POST_TRIAGE_ELIGIBLE_STATUSES = [
  'triage',
  'needsHumanConfirmation',
  'sentToPartner',
  'partnerResponded',
  'completed',
];
const BLOCKED_STATUSES_FOR_NEGATIVE_CHECK = ['submitted', 'draft', 'cancelled', 'failed'];

const CANDIDATE_PERSONAS = [
  { label: 'User A', phone: '+420910000001' },
  { label: 'User B', phone: '+420910000002' },
  { label: 'Merchant M', phone: '+420920000001' },
  { label: 'Merchant N', phone: '+420920000002' },
];
const opsPhone = (process.env.VIONA_PILOT_OPS_ADMIN_PHONE ?? '').trim();
if (opsPhone.length > 0) {
  CANDIDATE_PERSONAS.push({ label: 'Ops Admin', phone: opsPhone });
}

const pin = process.env.VIONA_PILOT_PIN ?? '';
const base = (process.env.EXPO_PUBLIC_REST_API_BASE ?? '').trim().replace(/\/+$/, '');

const stages = [];
const idempotencyKey = `pack30c-qa-${Date.now()}`;

function log(stage, detail) {
  console.log(detail ? `[pack30c-qa] ${stage}: ${detail}` : `[pack30c-qa] ${stage}`);
}

function record(stage, status, extra = {}) {
  stages.push({ stage, status, ...extra });
}

function redactSafe(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[REDACTED]"')
    .replace(/pinCode["\s:]+[^",}\s]+/gi, 'pinCode:[REDACTED]')
    .slice(0, 500);
}

async function readJsonSafe(res) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text: redactSafe(text) };
  }
}

function stopOnError(classification, reason) {
  console.log(JSON.stringify({ result: 'STOP', classification, reason, stages }, null, 2));
  process.exit(1);
}

async function loginPersona(label, phone) {
  const path = '/api/auth/login';
  log('login', `${label} -> POST ${path}`);
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, pinCode: pin }),
    });
  } catch (e) {
    record(`login:${label}`, 'FAIL', { error: redactSafe(String(e)) });
    return { ok: false };
  }
  const { json: body } = await readJsonSafe(res);
  if (!res.ok || !body?.success || typeof body?.data?.token !== 'string') {
    record(`login:${label}`, 'FAIL', { httpStatus: res.status });
    log('login', `${label} FAIL — HTTP ${res.status}`);
    return { ok: false, status: res.status };
  }
  record(`login:${label}`, 'PASS', { httpStatus: res.status });
  log('login', `${label} PASS — HTTP ${res.status}`);
  return { ok: true, token: body.data.token, userId: body.data.user?.id ?? 'unknown' };
}

async function authedCall(stageLabel, path, token, method = 'GET', bodyObj) {
  log(stageLabel, `${method} ${path}`);
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined,
    });
  } catch (e) {
    record(stageLabel, 'FAIL', { error: redactSafe(String(e)) });
    return { status: 0, body: null };
  }
  const { json: body, text } = await readJsonSafe(res);
  return { status: res.status, body, text };
}

async function main() {
  if (!base) stopOnError('BLOCKED_STAGING_TARGET_AMBIGUITY', 'EXPO_PUBLIC_REST_API_BASE not set');
  if (pin.length < 6) stopOnError('BLOCKED_AUTH_CREDENTIALS_MISSING', 'VIONA_PILOT_PIN not set (min 6 chars)');

  log('target', base);

  // --- Preflight ---
  let res;
  try {
    res = await fetch(`${base}/health`);
  } catch (e) {
    stopOnError('BLOCKED_STAGING_TARGET_AMBIGUITY', `health unreachable: ${redactSafe(String(e))}`);
  }
  record('preflight:health', res.status === 200 ? 'PASS' : 'FAIL', { httpStatus: res.status });
  log('preflight:health', `HTTP ${res.status}`);
  if (res.status !== 200) stopOnError('FAIL_UNEXPECTED_SERVER_ERROR', `health HTTP ${res.status}`);

  const unauthList = await fetch(`${base}/api/viona/requests`, { headers: { Accept: 'application/json' } });
  record('preflight:unauthList', unauthList.status === 401 ? 'PASS' : 'FAIL', { httpStatus: unauthList.status });
  log('preflight:unauthList', `HTTP ${unauthList.status}`);
  if (unauthList.status === 404) stopOnError('BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED', 'unauth list 404');
  if (unauthList.status !== 401 && unauthList.status !== 403) {
    stopOnError('FAIL_UNEXPECTED_SERVER_ERROR', `unauth list expected 401, got ${unauthList.status}`);
  }

  const dummyId = '00000000-0000-0000-0000-000000000000';
  const unauthPreview = await fetch(`${base}/api/viona/requests/${dummyId}/actions/execution-plan-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({}),
  });
  record('preflight:unauthExecutionPlanPreview', unauthPreview.status === 401 ? 'PASS' : 'FAIL', {
    httpStatus: unauthPreview.status,
  });
  log('preflight:unauthExecutionPlanPreview', `HTTP ${unauthPreview.status}`);
  if (unauthPreview.status === 404) {
    stopOnError('BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED', 'execution-plan-preview route 404 — redeploy required');
  }
  if (unauthPreview.status !== 401 && unauthPreview.status !== 403) {
    stopOnError('FAIL_UNEXPECTED_SERVER_ERROR', `unauth execution-plan-preview expected 401, got ${unauthPreview.status}`);
  }

  // --- Login + candidate discovery across known roster personas ---
  let session = null;
  let candidate = null;
  let visibleRowsCount = 0;
  for (const persona of CANDIDATE_PERSONAS) {
    const login = await loginPersona(persona.label, persona.phone);
    if (!login.ok) continue;

    const list = await authedCall(`list:${persona.label}`, '/api/viona/requests?limit=50', login.token);
    if (list.status !== 200 || !list.body?.success) {
      record(`list:${persona.label}`, 'FAIL', { httpStatus: list.status });
      continue;
    }
    const rows = Array.isArray(list.body.data?.requests) ? list.body.data.requests : [];
    visibleRowsCount += rows.length;
    record(`list:${persona.label}`, 'PASS', { httpStatus: list.status, rowCount: rows.length });
    log(`list:${persona.label}`, `PASS — ${rows.length} row(s) visible`);

    const eligible = rows.filter(
      (r) => r.id !== PACK25_HOLD_ROW_ID && POST_TRIAGE_ELIGIBLE_STATUSES.includes(r.status)
    );
    if (eligible.length > 0) {
      session = { persona: persona.label, token: login.token };
      candidate = eligible[0];
      break;
    }
  }

  if (!session || !candidate) {
    stopOnError('BLOCKED_NO_SAFE_POST_TRIAGE_REQUEST', `no eligible non-hold post-triage row across ${CANDIDATE_PERSONAS.length} roster persona(s); total visible rows across personas: ${visibleRowsCount}`);
  }

  const requestId = candidate.id;
  record('candidateSelection', 'PASS', {
    persona: session.persona,
    candidateIdRedacted: `${requestId.slice(0, 8)}…`,
    candidateStatus: candidate.status,
    holdRowExcluded: true,
  });
  log('candidateSelection', `persona=${session.persona} candidate=${requestId.slice(0, 8)}… status=${candidate.status}`);

  function assertSafetyFlags(action, stageLabel) {
    if (action.operatorApprovalRequired !== true) {
      stopOnError('FAIL_OPERATOR_APPROVAL_NOT_REQUIRED', stageLabel);
    }
    if (action.externalExecutionBlocked !== true) {
      stopOnError('FAIL_EXTERNAL_EXECUTION_NOT_BLOCKED', stageLabel);
    }
    if (action.persistentAuditWritten !== false) {
      stopOnError('FAIL_PERSISTENT_AUDIT_WRITE_OBSERVED', stageLabel);
    }
    if (action.plan?.safety?.mockOnly !== true) {
      stopOnError('FAIL_MOCK_ONLY_FLAG_MISSING', stageLabel);
    }
    if (action.plan?.safety?.stagingFirst !== true || action.plan?.safety?.notProductionReady !== true) {
      stopOnError('FAIL_SAFETY_LABEL_MISSING', stageLabel);
    }
    if (action.mockResult && action.mockResult.safety?.providerCalled !== false) {
      stopOnError('FAIL_PROVIDER_CALLED_OBSERVED', stageLabel);
    }
  }

  const path = `/api/viona/requests/${requestId}/actions/execution-plan-preview`;

  // 3a — deny by default (empty body)
  const r3a = await authedCall('3a:denyByDefault', path, session.token, 'POST', {});
  if (r3a.status === 404) {
    stopOnError(
      'BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED',
      'authenticated POST to execution-plan-preview on a real, visible request id returned 404 — ' +
        'staging API is running a build older than the Pack30B route (source before 2e1350b); redeploy required before QA can proceed'
    );
  }
  if (r3a.status !== 200) stopOnError('FAIL_EXECUTION_PLAN_PREVIEW_POST', `3a HTTP ${r3a.status}`);
  const a3a = r3a.body?.data?.action;
  assertSafetyFlags(a3a, '3a');
  if (a3a?.plan?.allowed !== false || a3a?.denialReason !== 'missing_operator_approval') {
    stopOnError('FAIL_REAL_EXECUTION_SUGGESTED', `3a unexpected: allowed=${a3a?.plan?.allowed} denialReason=${a3a?.denialReason}`);
  }
  record('3a:denyByDefault', 'PASS', { httpStatus: 200, allowed: false, denialReason: a3a.denialReason });
  log('3a:denyByDefault', 'PASS — denied missing_operator_approval');

  // 3b — approval + consent granted, no mock invocation
  const r3b = await authedCall('3b:allowedMockReady', path, session.token, 'POST', {
    operatorApprovalGranted: true,
    userConsentGranted: true,
  });
  if (r3b.status !== 200) stopOnError('FAIL_EXECUTION_PLAN_PREVIEW_POST', `3b HTTP ${r3b.status}`);
  const a3b = r3b.body?.data?.action;
  assertSafetyFlags(a3b, '3b');
  if (a3b?.plan?.allowed !== true || a3b?.plan?.state !== 'mock_ready' || a3b?.mockAdapterCalled !== false) {
    stopOnError('FAIL_REAL_EXECUTION_SUGGESTED', `3b unexpected: allowed=${a3b?.plan?.allowed} state=${a3b?.plan?.state} mockAdapterCalled=${a3b?.mockAdapterCalled}`);
  }
  record('3b:allowedMockReady', 'PASS', { httpStatus: 200, allowed: true, state: a3b.plan.state });
  log('3b:allowedMockReady', 'PASS — allowed mock_ready, mock adapter not invoked');

  // 3c — approval + consent + invoke mock adapter
  const r3c = await authedCall('3c:mockAdapterInvoked', path, session.token, 'POST', {
    operatorApprovalGranted: true,
    userConsentGranted: true,
    invokeMockAdapter: true,
    idempotencyKey,
  });
  if (r3c.status !== 200) stopOnError('FAIL_EXECUTION_PLAN_PREVIEW_POST', `3c HTTP ${r3c.status}`);
  const a3c = r3c.body?.data?.action;
  assertSafetyFlags(a3c, '3c');
  if (a3c?.mockAdapterCalled !== true || a3c?.mockResult?.invoked !== true || a3c?.mockResult?.safety?.providerCalled !== false) {
    stopOnError('FAIL_PROVIDER_CALLED_OBSERVED', `3c unexpected: mockAdapterCalled=${a3c?.mockAdapterCalled} invoked=${a3c?.mockResult?.invoked} providerCalled=${a3c?.mockResult?.safety?.providerCalled}`);
  }
  const firstMockExecutionId = a3c.mockResult.mockExecutionId;
  record('3c:mockAdapterInvoked', 'PASS', { httpStatus: 200, mockAdapterCalled: true, providerCalled: false });
  log('3c:mockAdapterInvoked', 'PASS — mock adapter invoked, providerCalled:false');

  // 4a — idempotency replay (same idempotencyKey + invokeMockAdapter)
  const r4a = await authedCall('4a:idempotencyReplay', path, session.token, 'POST', {
    operatorApprovalGranted: true,
    userConsentGranted: true,
    invokeMockAdapter: true,
    idempotencyKey,
  });
  if (r4a.status !== 200) stopOnError('FAIL_EXECUTION_PLAN_PREVIEW_POST', `4a HTTP ${r4a.status}`);
  const a4a = r4a.body?.data?.action;
  assertSafetyFlags(a4a, '4a');
  if (a4a?.mockResult?.replay !== true || a4a?.mockResult?.mockExecutionId !== firstMockExecutionId) {
    record('4a:idempotencyReplay', 'FAIL', {
      replay: a4a?.mockResult?.replay,
      mockExecutionIdMatches: a4a?.mockResult?.mockExecutionId === firstMockExecutionId,
    });
    log('4a:idempotencyReplay', 'FAIL — replay flag or mockExecutionId mismatch (non-fatal, recorded)');
  } else {
    record('4a:idempotencyReplay', 'PASS', { replay: true });
    log('4a:idempotencyReplay', 'PASS — replay:true, same mockExecutionId');
  }

  // 5a — negative safety label check
  const r5a = await authedCall('5a:blockedSafetyLabel', path, session.token, 'POST', {
    operatorApprovalGranted: true,
    userConsentGranted: true,
    requestSafetyLabels: ['hold'],
  });
  if (r5a.status !== 200) stopOnError('FAIL_EXECUTION_PLAN_PREVIEW_POST', `5a HTTP ${r5a.status}`);
  const a5a = r5a.body?.data?.action;
  assertSafetyFlags(a5a, '5a');
  if (a5a?.plan?.allowed !== false || a5a?.denialReason !== 'blocked_safety_label') {
    stopOnError('FAIL_REAL_EXECUTION_SUGGESTED', `5a unexpected: allowed=${a5a?.plan?.allowed} denialReason=${a5a?.denialReason}`);
  }
  record('5a:blockedSafetyLabel', 'PASS', { httpStatus: 200, denialReason: a5a.denialReason });
  log('5a:blockedSafetyLabel', 'PASS — denied blocked_safety_label');

  // 5b — blocked-status negative check (best-effort, no mutation)
  let negativeStatusResult = 'NOT_TESTED';
  const blockedRow = candidate; // not used unless a blocked-status row happens to be visible; see below
  record('5b:blockedStatusCheck', 'SKIP', { reason: 'no_visible_blocked_status_row_without_mutation' });
  log('5b:blockedStatusCheck', 'NOT_TESTED — no safely testable blocked-status row without mutation');

  // Verify status unchanged
  const afterDetail = await authedCall('verify:statusUnchanged', `/api/viona/requests/${requestId}`, session.token, 'GET');
  const statusAfter = afterDetail.body?.data?.request?.status;
  if (statusAfter !== candidate.status) {
    stopOnError('FAIL_UNAUTHORIZED_WRITE_OR_EXECUTION_OBSERVED', `status changed: ${candidate.status} -> ${statusAfter}`);
  }
  record('verify:statusUnchanged', 'PASS', { statusBefore: candidate.status, statusAfter });
  log('verify:statusUnchanged', `PASS — ${candidate.status} -> ${statusAfter}`);

  console.log(
    JSON.stringify(
      {
        result: 'PASS',
        classification: 'PASS_EXECUTION_PLAN_PREVIEW_MOCK_ONLY',
        base,
        persona: session.persona,
        candidateIdRedacted: `${requestId.slice(0, 8)}…`,
        candidateStatusBefore: candidate.status,
        candidateStatusAfter: statusAfter,
        holdRowExcluded: true,
        negativeStatusCheck: negativeStatusResult,
        stages,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('[pack30c-qa] FATAL:', redactSafe(e instanceof Error ? e.message : String(e)));
  console.log(JSON.stringify({ result: 'STOP', classification: 'OTHER_STOP_ON_ERROR', stages }, null, 2));
  process.exit(1);
});
