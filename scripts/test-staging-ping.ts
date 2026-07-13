/**
 * Staging ping + Twilio Test-Credentials POC helper (temporary operator script).
 *
 * ARCHITECTURE NOTE (read before expecting real SMS via HTTP):
 * ---------------------------------------------------------------------------
 * There is **no public HTTP route** on staging that calls Twilio today.
 *
 * Real Twilio chain (service-layer only, not HTTP-wired):
 *   executeVionaTwilioTestPocReal()
 *     <- previewVionaExecutionPlanRealProviderPocRoute()  (Pack30D-4 + Pack31)
 *     <- dispatchVionaAutonomousRequest()               (Pack32, also not HTTP-wired)
 *
 * The only related **mock-only** HTTP route (never calls Twilio):
 *   POST /api/viona/requests/:id/actions/execution-plan-preview  (Pack30B)
 *
 * Pack30D-8 internal real Twilio POC route (staging/local only):
 *   POST /api/internal/viona/trigger-real-twilio-poc
 *   → previewVionaExecutionPlanRealProviderPocRoute() on the Fly server (requires deploy + secrets).
 *
 * Modes:
 *   default (HTTP only)  — health, login, list requests, internal real Twilio POC route
 *   --run-real-poc       — (legacy) runs previewVionaExecutionPlanRealProviderPocRoute() locally
 *                          locally against DATABASE_URL (staging Supabase) with Twilio magic numbers.
 *                          Twilio HTTP call originates from **this machine**, not Fly — requires
 *                          local env: VIONA_DEPLOYMENT_STAGE=staging,
 *                          PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true,
 *                          TWILIO_TEST_ACCOUNT_SID, TWILIO_TEST_AUTH_TOKEN,
 *                          PACK30D5_TWILIO_DAILY_CAP_USD_CENTS (optional cap).
 *
 * Magic numbers only (zero Twilio cost): From/To +15005550006
 *
 * Usage:
 *   npx tsx scripts/test-staging-ping.ts
 *   npx tsx scripts/test-staging-ping.ts --run-real-poc
 *
 * Env (.env.local): EXPO_PUBLIC_REST_API_BASE, VIONA_PILOT_PIN, VIONA_PILOT_OPS_ADMIN_PHONE (optional)
 */

import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const STAGING_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
const MAGIC_FROM = '+15005550006';
const MAGIC_TO = '+15005550006';
const PACK25_HOLD_ROW_ID = 'ec9a8b69-8a60-45aa-99ba-fc805a101dcc';

const runRealPoc = process.argv.includes('--run-real-poc');

const base = (
  process.env.STAGING_PUBLIC_API_BASE ??
  process.env.EXPO_PUBLIC_REST_API_BASE ??
  STAGING_DEFAULT
)
  .trim()
  .replace(/\/+$/, '');

const pin = (process.env.VIONA_PILOT_PIN ?? '').trim();
const pilotPhone = (process.env.VIONA_PILOT_PHONE ?? '+420910000001').trim();
const opsPhone = (process.env.VIONA_PILOT_OPS_ADMIN_PHONE ?? '').trim();

type JsonRecord = Record<string, unknown>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[staging-ping] ${stage}: ${detail}` : `[staging-ping] ${stage}`);
}

function redactSafe(text: string): string {
  return text
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .slice(0, 2000);
}

async function readJson(res: Response): Promise<{ json: JsonRecord | null; text: string }> {
  const text = await res.text();
  try {
    return { json: JSON.parse(text) as JsonRecord, text };
  } catch {
    return { json: null, text: redactSafe(text) };
  }
}

async function fetchJson(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<{ status: number; json: JsonRecord | null; text: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.token) {
    headers.Authorization = `Bearer ${init.token}`;
  }
  const res = await fetch(`${base}${path}`, { ...init, headers });
  const { json, text } = await readJson(res);
  return { status: res.status, json, text };
}

async function login(phone: string, label: string): Promise<{ token: string; userId: string } | null> {
  if (!pin) {
    log('login', `${label} SKIP — VIONA_PILOT_PIN not set`);
    return null;
  }
  log('login', `${label} POST /api/auth/login`);
  const { status, json } = await fetchJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: phone, pinCode: pin }),
  });
  const token = json?.success === true && typeof (json.data as JsonRecord)?.token === 'string'
    ? ((json.data as JsonRecord).token as string)
    : null;
  const userId =
    json?.success === true && typeof (json.data as JsonRecord)?.user === 'object'
      ? String(((json.data as JsonRecord).user as JsonRecord).id ?? '')
      : '';
  if (!token) {
    log('login', `${label} FAIL HTTP ${status}`);
    return null;
  }
  log('login', `${label} PASS HTTP ${status}`);
  return { token, userId };
}

function extractRequestRows(listBody: JsonRecord | null): JsonRecord[] {
  if (listBody?.success !== true || listBody.data == null) return [];
  const data = listBody.data;
  if (Array.isArray(data)) return data as JsonRecord[];
  if (typeof data === 'object' && Array.isArray((data as JsonRecord).requests)) {
    return (data as JsonRecord).requests as JsonRecord[];
  }
  return [];
}

function pickRequestId(listBody: JsonRecord | null): string | null {
  const rows = extractRequestRows(listBody);
  const eligible = rows.filter((row) => {
    const id = String(row.id ?? '');
    const status = String(row.status ?? '');
    if (id === PACK25_HOLD_ROW_ID) return false;
    return id.length > 0 && status !== 'draft' && status !== 'cancelled';
  });
  if (eligible.length === 0) return null;
  return String(eligible[0]!.id);
}

async function createStagingTestRequest(token: string): Promise<string | null> {
  log('create', 'POST /api/viona/requests (Pack19-safe staging row)');
  const { status, json } = await fetchJson('/api/viona/requests', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: 'staging-ping-tenant',
      sourceUniverse: 'local',
      requestType: 'pack19-precondition-test',
      title: 'Staging ping Twilio POC precondition row',
      summary: 'Temporary row for staging-ping script only.',
      safetyLabels: [
        'pack19-safe-submitted-row-precondition',
        'staging-only',
        'non-production',
        'non-hold',
        'non-customer-critical',
        'test-remediation',
      ],
      idempotencyKey: `staging-ping-create-${Date.now()}`,
    }),
  });
  if (status !== 201 && status !== 200) {
    log('create', `FAIL HTTP ${status}`);
    return null;
  }
  const data = json?.data as JsonRecord | undefined;
  const request = data?.request as JsonRecord | undefined;
  const id = String(request?.id ?? data?.id ?? '');
  if (!id) {
    log('create', 'FAIL — no id in response');
    return null;
  }
  log('create', `PASS — created requestId=${id}`);
  return id;
}

async function resolveSession(): Promise<{ token: string; userId: string; label: string } | null> {
  const candidates = [
    { phone: pilotPhone, label: 'PilotA' },
    ...(opsPhone.length > 0 ? [{ phone: opsPhone, label: 'OpsAdmin' }] : []),
  ];
  for (const c of candidates) {
    const session = await login(c.phone, c.label);
    if (!session) continue;
    const list = await fetchJson('/api/viona/requests?limit=20', { token: session.token });
    const rows = extractRequestRows(list.json);
    log('list', `${c.label} visible rows=${rows.length}`);
    if (rows.length > 0 || c === candidates[candidates.length - 1]) {
      return { ...session, label: c.label };
    }
  }
  return null;
}

async function httpDiagnostic(token: string, userId: string, label: string): Promise<string | null> {
  log('health', `GET ${base}/health`);
  const health = await fetch(`${base}/health`);
  log('health', `HTTP ${health.status}`);

  log('list', `GET /api/viona/requests (${label})`);
  const list = await fetchJson('/api/viona/requests?limit=20', { token });
  log('list', `HTTP ${list.status}`);

  let requestId = pickRequestId(list.json);
  if (!requestId) {
    log('list', 'No eligible request — creating a Pack19-safe staging row');
    requestId = await createStagingTestRequest(token);
  }
  if (!requestId) {
    log('list', 'Still no requestId — cannot continue');
    return null;
  }
  log('list', `Using requestId=${requestId} (userId=${userId || 'unknown'})`);

  log('real-poc-http', 'POST /api/internal/viona/trigger-real-twilio-poc');
  const realPoc = await fetchJson('/api/internal/viona/trigger-real-twilio-poc', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      actionId: 'request.assign',
      operatorApprovalGranted: true,
      userConsentGranted: true,
      messageBody: `VIONA staging-ping POC ${new Date().toISOString()} (Twilio Test Credentials, magic numbers only).`,
      idempotencyKey: `staging-ping-${Date.now()}`,
    }),
  });

  log('real-poc-http', `HTTP ${realPoc.status}`);
  if (realPoc.json) {
    const data = realPoc.json.data as JsonRecord | undefined;
    log('real-poc-http', `planAllowed=${String(data?.planAllowed)}`);
    const outcome = (data?.realProviderResult as JsonRecord)?.outcome as JsonRecord | undefined;
    if (outcome) {
      log('real-poc-http', `Twilio outcome=${String(outcome.outcome)} reason=${String(outcome.reason ?? 'n/a')}`);
    }
    const safety = data?.safety ?? realPoc.json.safety;
    log('real-poc-http', `safety=${JSON.stringify(safety)}`);
  } else {
    log('real-poc-http', `body=${redactSafe(realPoc.text)}`);
  }

  if (realPoc.status === 403) {
    log(
      'real-poc-http',
      '403 — route blocked (production/unknown stage) or not deployed yet. After Pack30D-8 deploy, staging must have VIONA_DEPLOYMENT_STAGE=staging.',
    );
  }

  log('mock-preview', `POST /api/viona/requests/${requestId}/actions/execution-plan-preview (Pack30B mock-only)`);
  const preview = await fetchJson(`/api/viona/requests/${requestId}/actions/execution-plan-preview`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actionId: 'request.assign',
      operatorApprovalGranted: true,
      userConsentGranted: true,
      invokeMockAdapter: true,
      idempotencyKey: `staging-ping-${Date.now()}`,
    }),
  });

  log('mock-preview', `HTTP ${preview.status}`);
  if (preview.json) {
    const safety = (preview.json.data as JsonRecord)?.safety ?? (preview.json as JsonRecord).safety;
    log('mock-preview', `safety=${JSON.stringify(safety)}`);
    const action = (preview.json.data as JsonRecord)?.action ?? (preview.json as JsonRecord).action;
    if (action && typeof action === 'object') {
      const mockCalled = (action as JsonRecord).mockAdapterCalled;
      log('mock-preview', `mockAdapterCalled=${String(mockCalled)} (expected true — mock-only route)`);
    }
  } else {
    log('mock-preview', `body=${redactSafe(preview.text)}`);
  }

  log(
    'architecture',
    'Real Twilio on Fly goes through POST /api/internal/viona/trigger-real-twilio-poc (Pack30D-8) → previewVionaExecutionPlanRealProviderPocRoute().',
  );

  return requestId;
}

async function runLocalRealPoc(authUserId: string, requestId: string): Promise<void> {
  log('real-poc', 'Starting local service-layer Twilio Test-Credentials POC (magic numbers only)...');

  const stage = (process.env.VIONA_DEPLOYMENT_STAGE ?? '').trim();
  const flag = (process.env.PACK30_REAL_PROVIDER_EXECUTION_ENABLED ?? '').trim();
  const hasTestSid = Boolean(process.env.TWILIO_TEST_ACCOUNT_SID?.trim());
  const hasTestToken = Boolean(process.env.TWILIO_TEST_AUTH_TOKEN?.trim());

  log('real-poc', `VIONA_DEPLOYMENT_STAGE=${stage || '(unset)'}`);
  log('real-poc', `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=${flag || '(unset)'}`);
  log('real-poc', `TWILIO_TEST_ACCOUNT_SID=${hasTestSid ? 'set' : 'MISSING'}`);
  log('real-poc', `TWILIO_TEST_AUTH_TOKEN=${hasTestToken ? 'set' : 'MISSING'}`);

  if (stage !== 'staging' || flag !== 'true' || !hasTestSid || !hasTestToken) {
    log(
      'real-poc',
      'ABORT — local env gate not satisfied. Set VIONA_DEPLOYMENT_STAGE=staging, PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true, and Twilio Test Credentials in .env.local',
    );
    return;
  }

  const { previewVionaExecutionPlanRealProviderPocRoute } = await import(
    '../src/services/viona/vionaExecutionPlanRouteService'
  );

  const result = await previewVionaExecutionPlanRealProviderPocRoute({
    authUserId,
    requestId,
    actionId: 'request.assign',
    operatorApprovalGranted: true,
    userConsentGranted: true,
    fromNumber: MAGIC_FROM,
    toNumber: MAGIC_TO,
    body: `VIONA staging-ping POC ${new Date().toISOString()} (Twilio Test Credentials, magic numbers only).`,
    idempotencyKey: `staging-real-poc-${Date.now()}`,
  });

  console.log('[staging-ping] real-poc: result (redacted) =');
  console.log(
    JSON.stringify(
      result,
      (_key, value) => {
        if (typeof value === 'string' && value.startsWith('SM')) return value.slice(0, 8) + '…';
        return value;
      },
      2,
    ),
  );

  if (result.ok && result.realProviderResult) {
    const outcome = result.realProviderResult.outcome;
    log('real-poc', `Twilio outcome=${outcome.outcome}`);
    if (outcome.outcome === 'blockedOperator') {
      log('real-poc', `blocked reason=${outcome.reason}`);
    }
    if (outcome.outcome === 'succeeded') {
      log('real-poc', 'PASS — Twilio Test-Credentials call succeeded (zero-cost magic number path)');
    }
  }
}

async function main(): Promise<void> {
  log('config', `base=${base}`);
  log('config', `mode=${runRealPoc ? 'HTTP + --run-real-poc' : 'HTTP diagnostic only'}`);

  const session = await resolveSession();
  if (!session) {
    console.error('[staging-ping] STOP — could not authenticate (check VIONA_PILOT_PIN and phone)');
    process.exit(1);
  }

  const requestId = await httpDiagnostic(session.token, session.userId, session.label);
  if (!requestId) {
    process.exit(1);
  }

  if (runRealPoc) {
    if (!session.userId) {
      log('real-poc', 'ABORT — missing userId from login response');
      process.exit(1);
    }
    await runLocalRealPoc(session.userId, requestId);
  } else {
    log(
      'hint',
      'Legacy local-only path: npx tsx scripts/test-staging-ping.ts --run-real-poc (requires local Twilio test creds + DATABASE_URL).',
    );
    log(
      'hint',
      'Preferred Fly path after deploy: POST /api/internal/viona/trigger-real-twilio-poc with Bearer token (this script does that automatically).',
    );
  }

  log('done', 'complete');
}

main().catch((error) => {
  console.error('[staging-ping] FATAL', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
