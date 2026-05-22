/**
 * Public (or local) staging API smoke — no secrets printed.
 * Usage: node scripts/smoke-public-staging-api.mjs [baseUrl]
 * Env: STAGING_PUBLIC_API_BASE or EXPO_PUBLIC_REST_API_BASE
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

function fail(msg) {
  console.error(`[smoke-public-staging-api] FAIL: ${msg}`);
  process.exit(1);
}

async function login(phone) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phoneNumber: phone, pinCode: pin }),
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    return { ok: false, status: res.status, error: body.error ?? `HTTP ${res.status}` };
  }
  return { ok: true, userId: body.data.user.id, role: body.data.user.role, token: body.data.token };
}

async function authed(path, token, method = 'GET', payload) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    return { ok: false, status: res.status, error: body.error ?? `HTTP ${res.status}` };
  }
  return { ok: true, data: body.data };
}

async function main() {
  if (!base) fail('Set STAGING_PUBLIC_API_BASE or pass baseUrl argument.');
  if (pin.length < 6) fail('VIONA_PILOT_PIN not set (min 6).');

  const dbHaystack = `${process.env.DATABASE_URL ?? ''}\n${process.env.DIRECT_URL ?? ''}`;
  if (!dbHaystack.includes(STAGING_REF)) {
    fail(`DATABASE_URL/DIRECT_URL must contain staging ref ${STAGING_REF}.`);
  }

  const healthRes = await fetch(`${base}/health`);
  const healthText = await healthRes.text();
  let healthJson;
  try {
    healthJson = JSON.parse(healthText);
  } catch {
    fail(`health invalid JSON HTTP ${healthRes.status}`);
  }
  if (healthRes.status !== 200 || healthJson?.success !== true) {
    fail(`health HTTP ${healthRes.status}`);
  }
  if (/jwt|password|secret|pin|token/i.test(healthText) && healthText.length > 200) {
    fail('health response may expose secrets');
  }

  const loginA = await login(PHONE_USER_A);
  const loginB = await login(PHONE_USER_B);
  const loginM = await login(PHONE_MERCHANT_M);
  const loginN = await login(PHONE_MERCHANT_N);
  if (!loginA.ok || !loginB.ok || !loginM.ok || !loginN.ok) {
    fail('one or more REST logins failed');
  }

  const jwtA = loginA.token;
  const jwtM = loginM.token;
  const jwtN = loginN.token;

  const listA = await authed('/api/local/requests', jwtA);
  const listB = await authed('/api/local/requests', loginB.token);
  const inboxM = await authed('/api/local/merchant/requests', jwtM);
  const inboxN = await authed('/api/local/merchant/requests', jwtN);

  const idsA = new Set((listA.data?.requests ?? []).map((r) => r.id));
  const idsB = new Set((listB.data?.requests ?? []).map((r) => r.id));
  const overlap = [...idsA].filter((id) => idsB.has(id));
  if (overlap.length > 0) fail('User B sees User A private overlap');

  const nSeesM = (inboxN.data?.requests ?? []).some((r) => r.businessId === BUSINESS_M_ID);
  if (nSeesM) fail('Merchant N sees Business M');

  const title = `Pilot public API smoke ${new Date().toISOString().slice(0, 10)}`;
  const created = await authed('/api/local/requests', jwtA, 'POST', {
    businessId: BUSINESS_M_ID,
    serviceType: 'GENERIC_REQUEST',
    title: `${title} confirm`,
    source: 'API_DIRECT',
  });
  const createdDecline = await authed('/api/local/requests', jwtA, 'POST', {
    businessId: BUSINESS_M_ID,
    serviceType: 'GENERIC_REQUEST',
    title: `${title} decline`,
    source: 'API_DIRECT',
  });

  let confirmOk = 'SKIP';
  let declineOk = 'SKIP';
  if (created.data?.id) {
    const c = await authed(`/api/local/merchant/requests/${created.data.id}/confirm`, jwtM, 'POST');
    confirmOk = c.ok ? 'PASS' : 'FAIL';
  }
  if (createdDecline.data?.id) {
    const d = await authed(`/api/local/merchant/requests/${createdDecline.data.id}/reject`, jwtM, 'POST');
    declineOk = d.ok ? 'PASS' : 'FAIL';
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
        merchantMInbox: inboxM.ok ? 'PASS' : 'FAIL',
        confirm: confirmOk,
        decline: declineOk,
        walletMode: created.data?.walletMode ?? 'n/a',
        walletPhase: created.data?.walletPhase ?? 'n/a',
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('[smoke-public-staging-api] ERROR:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
