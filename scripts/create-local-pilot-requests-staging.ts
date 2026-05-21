/**
 * Staging-only: create exactly two Local pilot requests via REST API (no wallet mutations).
 *
 * Run: npx tsx scripts/create-local-pilot-requests-staging.ts
 *
 * Requires: DATABASE_URL, DIRECT_URL, JWT_SECRET, EXPO_PUBLIC_REST_API_BASE, VIONA_PILOT_PIN
 * Staging ref: euqbfanilcssjiwwtcby
 */
import 'dotenv/config';

import {
  LocalRequestSource,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';

const STAGING_PROJECT_REF = 'euqbfanilcssjiwwtcby';

const DEFAULT_USER_A_PHONE = '+420910000001';
const DEFAULT_USER_B_PHONE = '+420910000002';
const DEFAULT_MERCHANT_M_PHONE = '+420920000001';
const DEFAULT_MERCHANT_N_PHONE = '+420920000002';

const DEFAULT_BUSINESS_M_ID = '257f467a-8de2-41d0-b171-5ee499ba96d2';

const TITLE_R1 = 'Pilot Local request R1 confirm path';
const TITLE_R2 = 'Pilot Local request R2 reject or cancel path';

const PRODUCTION_HOST_PATTERNS = [
  /\.prod\./i,
  /production/i,
  /viona\.app$/i,
  /api\.viona/i,
  /railway\.app$/i,
  /render\.com$/i,
  /fly\.dev$/i,
  /vercel\.app$/i,
] as const;

type ApiBaseClassification = 'local_dev' | 'lan_local_dev' | 'rejected';

type ApiEnvelope<T> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{ success: false; error: string }>;

type LoginData = Readonly<{ token: string; user: Readonly<{ id: string }> }>;

type CreateRequestData = Readonly<{
  id: string;
  requesterUserId: string;
  businessId: string;
  status: string;
  walletMode: string;
  walletPhase: string;
  title: string;
}>;

type InboxData = Readonly<{
  requests: ReadonlyArray<Readonly<{ id: string; businessId: string; title: string }>>;
}>;

function fail(message: string): never {
  console.error(`[create-local-pilot-requests-staging] ERROR: ${message}`);
  process.exit(1);
}

function envTrim(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function requireEnv(name: string): string {
  const v = envTrim(name);
  if (v.length === 0) fail(`${name} is not set.`);
  return v;
}

function assertStagingDatabaseRef(): void {
  const haystack = `${envTrim('DATABASE_URL')}\n${envTrim('DIRECT_URL')}`;
  if (!haystack.includes(STAGING_PROJECT_REF)) {
    fail(`DATABASE_URL or DIRECT_URL must identify staging ref ${STAGING_PROJECT_REF}.`);
  }
}

function classifyApiBase(raw: string): ApiBaseClassification {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail('EXPO_PUBLIC_REST_API_BASE is not a valid URL.');
  }
  const host = url.hostname.toLowerCase();
  for (const pattern of PRODUCTION_HOST_PATTERNS) {
    if (pattern.test(host) || pattern.test(raw)) return 'rejected';
  }
  if (host === '127.0.0.1' || host === 'localhost') return 'local_dev';
  if (
    /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host) &&
    envTrim('VIONA_PILOT_ALLOW_LAN_API') === '1'
  ) {
    return 'lan_local_dev';
  }
  if (url.protocol === 'https:' && !host.includes('staging')) return 'rejected';
  return 'rejected';
}

function resolvePin(envKey: string): string {
  const specific = envTrim(envKey);
  if (specific.length >= 6) return specific;
  const shared = envTrim('VIONA_PILOT_PIN');
  if (shared.length >= 6) return shared;
  fail(`Set ${envKey} or VIONA_PILOT_PIN (min 6 chars). PIN is never printed.`);
}

function apiBase(): string {
  return requireEnv('EXPO_PUBLIC_REST_API_BASE').replace(/\/+$/, '');
}

async function fetchHealth(): Promise<boolean> {
  const res = await fetch(`${apiBase()}/health`, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) return false;
  try {
    const body = (await res.json()) as ApiEnvelope<{ status?: string }>;
    return body.success === true && body.data?.status === 'ok';
  } catch {
    return false;
  }
}

async function login(phoneNumber: string, pinCode: string): Promise<string> {
  const res = await fetch(`${apiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, pinCode }),
  });
  const raw = await res.text();
  let envelope: ApiEnvelope<LoginData> | null = null;
  try {
    envelope = JSON.parse(raw) as ApiEnvelope<LoginData>;
  } catch {
    fail(`Login failed for ${phoneNumber}: invalid JSON (HTTP ${res.status}).`);
  }
  if (!envelope?.success || typeof envelope.data.token !== 'string') {
    fail(`Login failed for ${phoneNumber}: ${envelope && !envelope.success ? envelope.error : 'no token'} (HTTP ${res.status}).`);
  }
  return envelope.data.token;
}

async function createRequest(
  token: string,
  body: Readonly<{
    businessId: string;
    serviceType: string;
    title: string;
    source: string;
  }>
): Promise<CreateRequestData> {
  const res = await fetch(`${apiBase()}/api/local/requests`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let envelope: ApiEnvelope<CreateRequestData> | null = null;
  try {
    envelope = JSON.parse(raw) as ApiEnvelope<CreateRequestData>;
  } catch {
    fail(`Create request failed: invalid JSON (HTTP ${res.status}).`);
  }
  if (!envelope?.success) {
    fail(
      `Create request failed: ${envelope && !envelope.success ? envelope.error : 'unknown'} (HTTP ${res.status}).`
    );
  }
  return envelope.data;
}

async function fetchMerchantInbox(token: string): Promise<InboxData> {
  const res = await fetch(`${apiBase()}/api/local/merchant/requests`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const raw = await res.text();
  let envelope: ApiEnvelope<InboxData> | null = null;
  try {
    envelope = JSON.parse(raw) as ApiEnvelope<InboxData>;
  } catch {
    fail(`Merchant inbox fetch failed: invalid JSON (HTTP ${res.status}).`);
  }
  if (!envelope?.success) {
    fail(
      `Merchant inbox fetch failed: ${envelope && !envelope.success ? envelope.error : 'unknown'} (HTTP ${res.status}).`
    );
  }
  return envelope.data;
}

async function run(): Promise<void> {
  requireEnv('DATABASE_URL');
  requireEnv('DIRECT_URL');
  requireEnv('JWT_SECRET');
  const apiBaseRaw = requireEnv('EXPO_PUBLIC_REST_API_BASE');
  assertStagingDatabaseRef();

  const apiClass = classifyApiBase(apiBaseRaw.replace(/\/+$/, ''));
  if (apiClass === 'rejected') {
    fail('EXPO_PUBLIC_REST_API_BASE is missing or production-looking.');
  }

  const healthOk = await fetchHealth();
  if (!healthOk) fail('GET /health did not return success ok.');

  const businessMId = envTrim('VIONA_PILOT_BUSINESS_M_ID') || DEFAULT_BUSINESS_M_ID;
  const userAPhone = envTrim('VIONA_PILOT_USER_A_PHONE') || DEFAULT_USER_A_PHONE;
  const userBPhone = envTrim('VIONA_PILOT_USER_B_PHONE') || DEFAULT_USER_B_PHONE;
  const merchantMPhone = envTrim('VIONA_PILOT_MERCHANT_M_PHONE') || DEFAULT_MERCHANT_M_PHONE;
  const merchantNPhone = envTrim('VIONA_PILOT_MERCHANT_N_PHONE') || DEFAULT_MERCHANT_N_PHONE;

  const pinA = resolvePin('VIONA_PILOT_USER_A_PIN');
  const pinB = resolvePin('VIONA_PILOT_USER_B_PIN');
  const pinM = resolvePin('VIONA_PILOT_MERCHANT_M_PIN');
  const pinN = resolvePin('VIONA_PILOT_MERCHANT_N_PIN');

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();
  const walletsBefore = await prisma.wallet.count();

  const existingR1 = await prisma.localServiceRequest.findFirst({
    where: { businessId: businessMId, title: TITLE_R1 },
    select: {
      id: true,
      status: true,
      walletMode: true,
      walletPhase: true,
      requesterUserId: true,
      businessId: true,
      title: true,
    },
  });
  const existingR2 = await prisma.localServiceRequest.findFirst({
    where: { businessId: businessMId, title: TITLE_R2 },
    select: {
      id: true,
      status: true,
      walletMode: true,
      walletPhase: true,
      requesterUserId: true,
      businessId: true,
      title: true,
    },
  });

  const tokenA = await login(userAPhone, pinA);
  const tokenB = await login(userBPhone, pinB);
  const tokenM = await login(merchantMPhone, pinM);
  const tokenN = await login(merchantNPhone, pinN);

  const userA = await prisma.user.findUnique({
    where: { phoneNumber: userAPhone },
    select: { id: true },
  });
  const userB = await prisma.user.findUnique({
    where: { phoneNumber: userBPhone },
    select: { id: true },
  });
  if (!userA || !userB) fail('Pilot User A or User B not found in staging DB.');

  let r1 = existingR1;
  let r2 = existingR2;
  let createdCount = 0;

  if (!r1) {
    const created = await createRequest(tokenA, {
      businessId: businessMId,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: TITLE_R1,
      source: LocalRequestSource.API_DIRECT,
    });
    createdCount += 1;
    r1 = {
      id: created.id,
      status: created.status as LocalServiceRequestStatus,
      walletMode: created.walletMode as LocalWalletMode,
      walletPhase: created.walletPhase as LocalWalletPhase,
      requesterUserId: created.requesterUserId,
      businessId: created.businessId,
      title: created.title,
    };
  }

  if (!r2) {
    const created = await createRequest(tokenB, {
      businessId: businessMId,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: TITLE_R2,
      source: LocalRequestSource.API_DIRECT,
    });
    createdCount += 1;
    r2 = {
      id: created.id,
      status: created.status as LocalServiceRequestStatus,
      walletMode: created.walletMode as LocalWalletMode,
      walletPhase: created.walletPhase as LocalWalletPhase,
      requesterUserId: created.requesterUserId,
      businessId: created.businessId,
      title: created.title,
    };
  }

  if (!r1 || !r2) fail('R1 or R2 missing after create/idempotency check.');

  const txAfter = await prisma.transaction.count();
  const walletsAfter = await prisma.wallet.count();

  const inboxM = await fetchMerchantInbox(tokenM);
  const inboxN = await fetchMerchantInbox(tokenN);

  const mIds = new Set(inboxM.requests.map((r) => r.id));
  const nIds = new Set(inboxN.requests.map((r) => r.id));

  const mSeesR1 = mIds.has(r1.id);
  const mSeesR2 = mIds.has(r2.id);
  const nSeesR1 = nIds.has(r1.id);
  const nSeesR2 = nIds.has(r2.id);

  console.log('[create-local-pilot-requests-staging] staging ref confirmed: yes');
  console.log(`[create-local-pilot-requests-staging] API health: PASS`);
  console.log(`[create-local-pilot-requests-staging] API base classification: ${apiClass}`);
  console.log(`[create-local-pilot-requests-staging] data created this run: ${createdCount}`);
  console.log(`[create-local-pilot-requests-staging] R1 id=${r1.id} status=${r1.status} walletMode=${r1.walletMode} walletPhase=${r1.walletPhase} requesterMatchUserA=${r1.requesterUserId === userA.id}`);
  console.log(`[create-local-pilot-requests-staging] R2 id=${r2.id} status=${r2.status} walletMode=${r2.walletMode} walletPhase=${r2.walletPhase} requesterMatchUserB=${r2.requesterUserId === userB.id}`);
  console.log(`[create-local-pilot-requests-staging] Merchant M inbox sees R1: ${mSeesR1 ? 'yes' : 'no'} R2: ${mSeesR2 ? 'yes' : 'no'} (count=${inboxM.requests.length})`);
  console.log(`[create-local-pilot-requests-staging] Merchant N isolation R1 visible: ${nSeesR1 ? 'FAIL' : 'PASS'} R2 visible: ${nSeesR2 ? 'FAIL' : 'PASS'}`);
  console.log(`[create-local-pilot-requests-staging] Transaction delta: ${txAfter - txBefore}`);
  console.log(`[create-local-pilot-requests-staging] Wallet row delta: ${walletsAfter - walletsBefore}`);

  if (r1.businessId !== businessMId || r2.businessId !== businessMId) {
    fail('R1/R2 businessId must be Business M.');
  }
  if (r1.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE || r2.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE) {
    fail('walletMode must be REQUEST_ONLY_NO_CHARGE.');
  }
  if (r1.walletPhase !== LocalWalletPhase.NONE || r2.walletPhase !== LocalWalletPhase.NONE) {
    fail('walletPhase must be NONE.');
  }
  if (r1.requesterUserId !== userA.id || r2.requesterUserId !== userB.id) {
    fail('Requester mismatch: R1 must be User A, R2 must be User B.');
  }
  if (!mSeesR1 || !mSeesR2) fail('Merchant M inbox must list both pilot requests.');
  if (nSeesR1 || nSeesR2) fail('Merchant N must not see Business M pilot requests.');
  if (txAfter !== txBefore || walletsAfter !== walletsBefore) {
    fail('Unexpected wallet/transaction mutation.');
  }
  if (createdCount > 2) fail('Created more than 2 requests in one run.');

  console.log('[create-local-pilot-requests-staging] OK — two pilot Local requests ready for walkthrough.');
}

run()
  .catch((e: unknown) => {
    fail(e instanceof Error ? e.message : String(e));
  })
  .finally(() => disconnectPrisma());
