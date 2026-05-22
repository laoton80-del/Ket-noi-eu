/**
 * Public (or local) staging API smoke — no secrets printed.
 * Usage: node scripts/smoke-public-staging-api.mjs [baseUrl]
 * Env: STAGING_PUBLIC_API_BASE or EXPO_PUBLIC_REST_API_BASE, VIONA_PILOT_PIN
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const STAGING_REF = 'euqbfanilcssjiwwtcby';
const PHONE_USER_A = '+420910000001';
const PHONE_USER_B = '+420910000002';
const PHONE_MERCHANT_M = '+420920000001';
const PHONE_MERCHANT_N = '+420920000002';
const BUSINESS_M_ID = '257f467a-8de2-41d0-b171-5ee499ba96d2';

const base = (process.argv[2] ?? process.env.STAGING_PUBLIC_API_BASE ?? process.env.EXPO_PUBLIC_REST_API_BASE ?? '')
  .trim()
  .replace(/\/+$/, '');

const pin = process.env.VIONA_PILOT_PIN ?? '';

const stages = [];

function log(stage, detail) {
  const line = detail ? `[smoke-public-staging-api] ${stage}: ${detail}` : `[smoke-public-staging-api] ${stage}`;
  console.log(line);
}

function record(stage, status, extra = {}) {
  stages.push({ stage, status, ...extra });
}

/** Redact JWT-like strings and never echo pin/secrets from bodies. */
function redactSafe(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[REDACTED]"')
    .replace(/pinCode["\s:]+[^",}\s]+/gi, 'pinCode:[REDACTED]')
    .slice(0, 400);
}

function safeErrorFromBody(body, status) {
  if (body && typeof body === 'object') {
    const err = typeof body.error === 'string' ? redactSafe(body.error) : null;
    const reason =
      typeof body.reason === 'string' ? redactSafe(body.reason) : null;
    if (err) return err;
    if (reason) return reason;
    if (body.success === false) return 'success:false';
    return redactSafe(JSON.stringify(body));
  }
  return `HTTP ${status}`;
}

async function readJsonSafe(res) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text: redactSafe(text) };
  }
}

function failFinal(msg) {
  console.error(`[smoke-public-staging-api] FAIL: ${msg}`);
  console.log(JSON.stringify({ base, stages }, null, 2));
  process.exit(1);
}

async function loginPersona(label, phone) {
  const path = '/api/auth/login';
  log('login', `${label} → POST ${path}`);
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, pinCode: pin }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    record(`login:${label}`, 'FAIL', { path, error: redactSafe(msg), unreachable: true });
    log('login', `${label} FAIL — network: ${redactSafe(msg)}`);
    return { ok: false, label, path, status: 0, error: msg };
  }

  const { json: body, text } = await readJsonSafe(res);
  if (!res.ok || !body?.success) {
    const err = body ? safeErrorFromBody(body, res.status) : text || `HTTP ${res.status}`;
    record(`login:${label}`, 'FAIL', {
      path,
      httpStatus: res.status,
      error: err,
      phoneE164: phone,
    });
    log('login', `${label} FAIL — HTTP ${res.status} — ${err}`);
    return { ok: false, label, path, status: res.status, error: err };
  }

  if (typeof body.data?.token !== 'string' || body.data.token.length < 8) {
    record(`login:${label}`, 'FAIL', { path, httpStatus: res.status, error: 'invalid_token_shape' });
    log('login', `${label} FAIL — invalid token shape (not logged)`);
    return { ok: false, label, path, status: res.status, error: 'invalid_token_shape' };
  }

  record(`login:${label}`, 'PASS', {
    path,
    httpStatus: res.status,
    role: body.data.user?.role ?? 'unknown',
    userId: body.data.user?.id ?? 'unknown',
  });
  log('login', `${label} PASS — HTTP ${res.status} role=${body.data.user?.role ?? '?'}`);
  return {
    ok: true,
    label,
    token: body.data.token,
    role: body.data.user?.role,
    userId: body.data.user?.id,
  };
}

async function authedStage(stageLabel, path, token, method = 'GET', payload) {
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
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    record(stageLabel, 'FAIL', { path, method, error: redactSafe(msg) });
    log(stageLabel, `FAIL — network: ${redactSafe(msg)}`);
    return { ok: false, status: 0, error: msg };
  }

  const { json: body, text } = await readJsonSafe(res);
  if (!res.ok || !body?.success) {
    const err = body ? safeErrorFromBody(body, res.status) : text || `HTTP ${res.status}`;
    record(stageLabel, 'FAIL', { path, method, httpStatus: res.status, error: err });
    log(stageLabel, `FAIL — HTTP ${res.status} — ${err}`);
    return { ok: false, status: res.status, error: err };
  }

  record(stageLabel, 'PASS', { path, method, httpStatus: res.status });
  log(stageLabel, `PASS — HTTP ${res.status}`);
  return { ok: true, status: res.status, data: body.data };
}

async function main() {
  if (!base) failFinal('Set STAGING_PUBLIC_API_BASE or pass baseUrl argument.');
  if (pin.length < 6) failFinal('VIONA_PILOT_PIN not set (min 6 chars; value not logged).');

  const dbHaystack = `${process.env.DATABASE_URL ?? ''}\n${process.env.DIRECT_URL ?? ''}`;
  if (!dbHaystack.includes(STAGING_REF)) {
    failFinal(`DATABASE_URL/DIRECT_URL must contain staging ref ${STAGING_REF}.`);
  }

  log('health', `GET /health @ ${base}`);
  let healthRes;
  try {
    healthRes = await fetch(`${base}/health`);
  } catch (e) {
    failFinal(`health unreachable: ${redactSafe(e instanceof Error ? e.message : String(e))}`);
  }
  const { json: healthJson, text: healthText } = await readJsonSafe(healthRes);
  if (healthRes.status !== 200 || healthJson?.success !== true) {
    record('health', 'FAIL', { httpStatus: healthRes.status, error: safeErrorFromBody(healthJson, healthRes.status) || healthText });
    failFinal(`health HTTP ${healthRes.status}`);
  }
  const healthBodyRedacted = redactSafe(JSON.stringify(healthJson));
  if (healthBodyRedacted.includes('[REDACTED_JWT]') || /"pin/i.test(healthBodyRedacted)) {
    failFinal('health response may expose secrets');
  }
  record('health', 'PASS', { httpStatus: healthRes.status });
  log('health', `PASS — HTTP ${healthRes.status}`);

  const loginA = await loginPersona('User A', PHONE_USER_A);
  const loginB = await loginPersona('User B', PHONE_USER_B);
  const loginM = await loginPersona('Merchant M', PHONE_MERCHANT_M);
  const loginN = await loginPersona('Merchant N', PHONE_MERCHANT_N);

  const loginFailures = [loginA, loginB, loginM, loginN].filter((r) => !r.ok);
  if (loginFailures.length > 0) {
    failFinal(
      `REST login failed for: ${loginFailures.map((f) => `${f.label} (HTTP ${f.status}: ${f.error})`).join('; ')}`
    );
  }

  const listA = await authedStage('userA:listRequests', '/api/local/requests', loginA.token);
  const listB = await authedStage('userB:listRequests', '/api/local/requests', loginB.token);
  const inboxM = await authedStage('merchantM:inbox', '/api/local/merchant/requests', loginM.token);
  const inboxN = await authedStage('merchantN:inbox', '/api/local/merchant/requests', loginN.token);

  if (!listA.ok || !listB.ok || !inboxM.ok || !inboxN.ok) {
    failFinal('one or more authed Local routes failed (see stages)');
  }

  log('isolation:userB', 'checking request id overlap');
  const idsA = new Set((listA.data?.requests ?? []).map((r) => r.id));
  const idsB = new Set((listB.data?.requests ?? []).map((r) => r.id));
  const overlap = [...idsA].filter((id) => idsB.has(id));
  if (overlap.length > 0) {
    record('isolation:userB', 'FAIL', { overlapCount: overlap.length });
    failFinal(`User B sees User A private overlap (${overlap.length})`);
  }
  record('isolation:userB', 'PASS');
  log('isolation:userB', 'PASS');

  log('isolation:merchantN', 'checking Business M not in Merchant N inbox');
  const nSeesM = (inboxN.data?.requests ?? []).some((r) => r.businessId === BUSINESS_M_ID);
  if (nSeesM) {
    record('isolation:merchantN', 'FAIL');
    failFinal('Merchant N sees Business M');
  }
  record('isolation:merchantN', 'PASS');
  log('isolation:merchantN', 'PASS');

  const title = `Pilot public API smoke ${new Date().toISOString().slice(0, 10)}`;
  const created = await authedStage('local:createConfirmTarget', '/api/local/requests', loginA.token, 'POST', {
    businessId: BUSINESS_M_ID,
    serviceType: 'GENERIC_REQUEST',
    title: `${title} confirm`,
    source: 'API_DIRECT',
  });
  const createdDecline = await authedStage('local:createDeclineTarget', '/api/local/requests', loginA.token, 'POST', {
    businessId: BUSINESS_M_ID,
    serviceType: 'GENERIC_REQUEST',
    title: `${title} decline`,
    source: 'API_DIRECT',
  });

  if (!created.ok || !createdDecline.ok) {
    failFinal('Local request create failed (see stages)');
  }

  let confirmOk = 'SKIP';
  let declineOk = 'SKIP';
  if (created.data?.id) {
    const c = await authedStage(
      'merchantM:confirm',
      `/api/local/merchant/requests/${created.data.id}/confirm`,
      loginM.token,
      'POST'
    );
    confirmOk = c.ok ? 'PASS' : 'FAIL';
    if (!c.ok) failFinal('merchant confirm failed');
  }
  if (createdDecline.data?.id) {
    const d = await authedStage(
      'merchantM:decline',
      `/api/local/merchant/requests/${createdDecline.data.id}/reject`,
      loginM.token,
      'POST'
    );
    declineOk = d.ok ? 'PASS' : 'FAIL';
    if (!d.ok) failFinal('merchant decline failed');
  }

  const walletMode = created.data?.walletMode ?? 'n/a';
  const walletPhase = created.data?.walletPhase ?? 'n/a';
  if (walletMode !== 'REQUEST_ONLY_NO_CHARGE') {
    failFinal(`walletMode expected REQUEST_ONLY_NO_CHARGE got ${walletMode}`);
  }
  if (walletPhase !== 'NONE') {
    failFinal(`walletPhase expected NONE got ${walletPhase}`);
  }

  console.log(
    JSON.stringify(
      {
        base,
        https: base.startsWith('https://'),
        health: 'PASS',
        restAuth: 'PASS',
        userBIsolation: 'PASS',
        merchantNIsolation: 'PASS',
        merchantMInbox: 'PASS',
        confirm: confirmOk,
        decline: declineOk,
        walletMode,
        walletPhase,
        paymentCaptured: false,
        stages,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('[smoke-public-staging-api] ERROR:', redactSafe(e instanceof Error ? e.message : String(e)));
  process.exit(1);
});
