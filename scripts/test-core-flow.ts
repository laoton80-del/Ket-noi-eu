/**
 * V6.2 core API E2E smoke (Auth → Wallet → Booking).
 *
 * Required in `.env` (repo root):
 *   - EXPO_PUBLIC_REST_API_BASE  (e.g. http://127.0.0.1:8787)
 *   - E2E_LOGIN_PHONE            (E.164, must exist in DB with bcrypt pinCode)
 *   - E2E_LOGIN_PIN              (plaintext PIN matching User.pinCode hash)
 *
 * Optional:
 *   - E2E_TRANSFER_TO_USER_ID   (receiver User.id for P2P; needs wallet row)
 *   - EXPO_PUBLIC_DEMO_BOOKING_BUSINESS_ID / EXPO_PUBLIC_DEMO_BOOKING_SERVICE_ID
 *
 * Run: npx tsx scripts/test-core-flow.ts
 *   or: npm run test:core-flow
 */
import 'dotenv/config';

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

function parseEnvelope<T>(raw: string): { success: true; data: T } | { success: false; error: string } | null {
  try {
    const v: unknown = raw.length === 0 ? null : JSON.parse(raw);
    if (!isRecord(v)) return null;
    if (v.success === true && 'data' in v) return { success: true, data: v.data as T };
    if (v.success === false && typeof v.error === 'string') return { success: false, error: v.error };
    return null;
  } catch {
    return null;
  }
}

async function safeReadBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch (e) {
    return `[read body failed: ${e instanceof Error ? e.message : String(e)}]`;
  }
}

function baseUrl(): string {
  const u = process.env.EXPO_PUBLIC_REST_API_BASE?.trim() ?? '';
  return u.replace(/\/+$/, '');
}

type LoginData = Readonly<{ token: string; user: unknown }>;
type BalanceData = Readonly<{ balanceVIG: number; lockedBalanceVIG?: number; walletId: string }>;
type TransferData = Readonly<{
  senderWalletId: string;
  receiverWalletId: string;
  amountVIG: number;
  feeVIG: number;
  senderTransactionId: string;
  receiverTransactionId: string;
}>;
type BookingData = Readonly<{ booking: UnknownRecord }>;

async function postJson<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<Readonly<{ status: number; envelope: ReturnType<typeof parseEnvelope<T>>; raw: string }>> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (e) {
    const msg = e instanceof TypeError ? e.message : e instanceof Error ? e.message : String(e);
    return { status: 0, envelope: null, raw: `[network] ${msg}` };
  }

  const raw = await safeReadBody(res);
  return { status: res.status, envelope: parseEnvelope<T>(raw), raw };
}

async function getJson<T>(path: string, token: string): Promise<Readonly<{ status: number; envelope: ReturnType<typeof parseEnvelope<T>>; raw: string }>> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', headers });
  } catch (e) {
    const msg = e instanceof TypeError ? e.message : e instanceof Error ? e.message : String(e);
    return { status: 0, envelope: null, raw: `[network] ${msg}` };
  }

  const raw = await safeReadBody(res);
  return { status: res.status, envelope: parseEnvelope<T>(raw), raw };
}

function fail(msg: string): void {
  console.error(`🔴 ${msg}`);
  process.exitCode = 1;
}

function ok(msg: string): void {
  console.log(`🟢 ${msg}`);
}

function warn(msg: string): void {
  console.warn(`🟡 ${msg}`);
}

function info(msg: string): void {
  console.log(`🔵 ${msg}`);
}

async function main(): Promise<void> {
  console.log('\n════════ ViGlobal V6.2 — Core API E2E ════════\n');

  const root = baseUrl();
  if (!root) {
    fail('SETUP: EXPO_PUBLIC_REST_API_BASE is missing in .env');
    return;
  }
  info(`API base: ${root}`);

  const phone = process.env.E2E_LOGIN_PHONE?.trim() ?? '';
  const pin = process.env.E2E_LOGIN_PIN?.trim() ?? '';
  if (!phone || !pin) {
    fail('SETUP: Set E2E_LOGIN_PHONE and E2E_LOGIN_PIN in .env (user must exist with bcrypt pinCode).');
    return;
  }

  // —— STEP 1 ——
  info('STEP 1: POST /api/auth/login …');
  let token: string | null = null;
  try {
    const r = await postJson<LoginData>('/api/auth/login', { phoneNumber: phone, pinCode: pin });
    if (r.status === 0) {
      fail(`STEP 1: LOGIN FAILED — ${r.raw}`);
      return;
    }
    if (r.envelope?.success === true && typeof r.envelope.data.token === 'string') {
      token = r.envelope.data.token;
      ok(`STEP 1: LOGIN SUCCESS — user id: ${isRecord(r.envelope.data.user) && typeof r.envelope.data.user.id === 'string' ? r.envelope.data.user.id : '(see data)'}`);
    } else if (r.envelope?.success === false) {
      warn('STEP 1: LOGIN REJECTED — Invalid phone or PIN, or server error.');
      warn('       Seed a User + Profile + bcrypt pinCode, then create Wallet (createWalletForUser).');
      fail(`STEP 1: LOGIN FAILED — ${r.envelope.error} (HTTP ${r.status})`);
      return;
    } else {
      fail(`STEP 1: LOGIN FAILED — Unexpected response HTTP ${r.status}: ${r.raw.slice(0, 400)}`);
      return;
    }
  } catch (e) {
    fail(`STEP 1: LOGIN CRASH — ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  if (!token) {
    fail('STEP 1: No JWT extracted.');
    return;
  }

  // —— STEP 2 ——
  info('STEP 2: GET /api/wallet/balance …');
  try {
    const r = await getJson<BalanceData>('/api/wallet/balance', token);
    if (r.status === 0) {
      fail(`STEP 2: BALANCE FAILED — ${r.raw}`);
      return;
    }
    if (r.envelope?.success === true) {
      ok(`STEP 2: WALLET BALANCE — balanceVIG=${r.envelope.data.balanceVIG} walletId=${r.envelope.data.walletId}`);
    } else if (r.envelope?.success === false) {
      fail(`STEP 2: BALANCE FAILED — ${r.envelope.error} (HTTP ${r.status})`);
      return;
    } else {
      fail(`STEP 2: BALANCE FAILED — HTTP ${r.status}: ${r.raw.slice(0, 400)}`);
      return;
    }
  } catch (e) {
    fail(`STEP 2: BALANCE CRASH — ${e instanceof Error ? e.message : String(e)}`);
    return;
  }

  // —— STEP 3 ——
  const receiverId = process.env.E2E_TRANSFER_TO_USER_ID?.trim() ?? '';
  info('STEP 3: POST /api/wallet/transfer (10 VIG) …');
  if (!receiverId) {
    warn('STEP 3: SKIPPED — set E2E_TRANSFER_TO_USER_ID (User.id with Wallet) to run P2P transfer.');
  } else {
    try {
      const r = await postJson<TransferData>(
        '/api/wallet/transfer',
        { toUserId: receiverId, amountVIG: 10 },
        token
      );
      if (r.status === 0) {
        fail(`STEP 3: TRANSFER FAILED — ${r.raw}`);
      } else if (r.envelope?.success === true) {
        ok(`STEP 3: TRANSFER SUCCESS — senderTx=${r.envelope.data.senderTransactionId}`);
      } else if (r.envelope?.success === false) {
        fail(`STEP 3: TRANSFER FAILED — ${r.envelope.error} (HTTP ${r.status})`);
      } else {
        fail(`STEP 3: TRANSFER FAILED — HTTP ${r.status}: ${r.raw.slice(0, 400)}`);
      }
    } catch (e) {
      fail(`STEP 3: TRANSFER CRASH — ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // —— STEP 4 ——
  const biz = process.env.EXPO_PUBLIC_DEMO_BOOKING_BUSINESS_ID?.trim() ?? '';
  const svc = process.env.EXPO_PUBLIC_DEMO_BOOKING_SERVICE_ID?.trim() ?? '';
  info('STEP 4: POST /api/bookings …');
  if (!biz || !svc) {
    warn('STEP 4: SKIPPED — set EXPO_PUBLIC_DEMO_BOOKING_BUSINESS_ID and EXPO_PUBLIC_DEMO_BOOKING_SERVICE_ID in .env.');
  } else {
    const timeSlot = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    try {
      const r = await postJson<BookingData>(
        '/api/bookings',
        { businessId: biz, serviceId: svc, timeSlot },
        token
      );
      if (r.status === 0) {
        fail(`STEP 4: BOOKING FAILED — ${r.raw}`);
      } else if (r.envelope?.success === true) {
        const id = isRecord(r.envelope.data.booking) && typeof r.envelope.data.booking.id === 'string' ? r.envelope.data.booking.id : '?';
        ok(`STEP 4: BOOKING SUCCESS — booking id=${id} (HTTP ${r.status})`);
      } else if (r.envelope?.success === false) {
        fail(`STEP 4: BOOKING FAILED — ${r.envelope.error} (HTTP ${r.status})`);
      } else {
        fail(`STEP 4: BOOKING FAILED — HTTP ${r.status}: ${r.raw.slice(0, 400)}`);
      }
    } catch (e) {
      fail(`STEP 4: BOOKING CRASH — ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log('\n════════ Run finished ════════\n');
}

void main();
