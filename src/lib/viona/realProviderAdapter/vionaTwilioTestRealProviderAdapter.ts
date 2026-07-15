/**
 * Pack30D-4 — Twilio Test-Credentials real-provider POC adapter.
 *
 * Implements exactly one narrow, explicitly-opt-in real-provider call path:
 * `executeReal()` sends a single SMS via Twilio's REST API using **Test Credentials only**
 * (`TWILIO_TEST_ACCOUNT_SID` / `TWILIO_TEST_AUTH_TOKEN` — never the live
 * `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` used elsewhere in this repo's existing mock-only
 * telephony features) and **only** Twilio's documented "magic phone numbers"
 * (https://www.twilio.com/docs/iam/test-credentials). Twilio guarantees Test Credentials never
 * send a real SMS, never reach a real handset, and never incur cost — this is the one, narrow,
 * explicitly-approved exception to this repo's otherwise strict "no real provider call" rule
 * (see docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §3, §5).
 *
 * `executeReal()` is hard-gated by `isRealProviderExecutionEnabled()` (default `false`,
 * hard-blocked in production) and unconditionally writes an append-only audit-ledger row via the
 * existing, unmodified Pack30D-1 writer (`appendVionaExecutionAuditEvent`) on every exit path —
 * flag-blocked, policy-blocked, attempted, succeeded, and failed — before returning.
 *
 * Pack30D-7 — staging deployment-stage fix: real execution is allowed only when
 * `VIONA_DEPLOYMENT_STAGE=staging` and `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true`; production
 * deployment stage always hard-blocks regardless of `NODE_ENV` (Fly staging runs
 * `NODE_ENV=production` by design).
 *
 * This module never touches `VionaRequest.status`, never writes outside the existing
 * `VionaRequestAuditEvent` table, and never imports Prisma directly (payload typing is imported
 * from the existing writer, mirroring the Pack30D-1 pattern used by
 * `vionaExecutionPlanRouteService.ts`).
 *
 * Pack30D-5 — Real-Provider spend Circuit Breaker (see
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §3, §5). Checked immediately after the
 * feature-flag gate above and before validation/credentials/transport — a second, independent,
 * fail-closed layer on top of (never a replacement for) the flag + production hard-block. This
 * check is purely additive: every existing exit path, audit-payload shape, and return type is
 * unchanged; only a new `blockedOperator` reason
 * (`circuit_breaker_open_daily_cap_exceeded`) and one new early-return branch are added.
 */

import {
  appendVionaExecutionAuditEvent,
  type VionaExecutionAuditPayloadJson,
} from '../../../services/viona/vionaExecutionAuditWriteService';
import {
  evaluateVionaProviderCircuitBreaker,
  readVionaProviderSpendCapUsdCentsFromEnv,
} from '../circuitBreaker/vionaProviderSpendCircuitBreaker';
import { queryVionaTwilioSpendWindow } from '../../../services/viona/vionaProviderSpendWindowQueryService';
import { isRealProviderExecutionEnabled } from './vionaRealProviderExecutionFlag';

export const VIONA_TWILIO_TEST_POC_SAFETY = {
  providerCalled: 'test_credentials_only',
  liveCredentialsUsed: false,
  productionAllowed: false,
  persistentAuditWritten: true,
  notProductionReady: true,
} as const;

/**
 * Twilio's documented "magic phone numbers" for SMS (`Messages.create`) — the **only** values
 * this adapter will ever accept. Any other value is rejected by `validateIntent()` before any
 * network call is attempted. Source: https://www.twilio.com/docs/iam/test-credentials
 */
export const VIONA_TWILIO_TEST_FROM_MAGIC_NUMBERS = [
  '+15005550006', // passes all validation (use for the happy path)
  '+15005550001', // invalid phone number -> 21212
  '+15005550007', // not owned by account / not SMS-capable -> 21606
  '+15005550008', // SMS queue full -> 21611
] as const;

export const VIONA_TWILIO_TEST_TO_MAGIC_NUMBERS = [
  '+15005550006', // valid, no error
  '+15005550001', // invalid phone number -> 21211
  '+15005550002', // cannot route -> 21612
  '+15005550003', // no international permission -> 21408
  '+15005550004', // blocked for this account -> 21610
  '+15005550009', // cannot receive SMS -> 21614
] as const;

export type VionaTwilioTestFromMagicNumber = (typeof VIONA_TWILIO_TEST_FROM_MAGIC_NUMBERS)[number];
export type VionaTwilioTestToMagicNumber = (typeof VIONA_TWILIO_TEST_TO_MAGIC_NUMBERS)[number];

export type VionaTwilioTestPocIntent = Readonly<{
  fromNumber: string;
  toNumber: string;
  body: string;
}>;

export type VionaTwilioTestPocIntentValidation =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'invalid_from_number' | 'invalid_to_number' | 'empty_body' }>;

/**
 * Refuses any `fromNumber`/`toNumber` that is not one of Twilio's documented magic numbers —
 * this is the adapter-level enforcement of "Test Credentials + magic numbers only" required by
 * docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §5.2. No network, no DB.
 */
export function validateVionaTwilioTestPocIntent(
  intent: VionaTwilioTestPocIntent,
): VionaTwilioTestPocIntentValidation {
  if (!(VIONA_TWILIO_TEST_FROM_MAGIC_NUMBERS as readonly string[]).includes(intent.fromNumber)) {
    return { ok: false, reason: 'invalid_from_number' };
  }
  if (!(VIONA_TWILIO_TEST_TO_MAGIC_NUMBERS as readonly string[]).includes(intent.toNumber)) {
    return { ok: false, reason: 'invalid_to_number' };
  }
  if (intent.body.trim().length === 0) {
    return { ok: false, reason: 'empty_body' };
  }
  return { ok: true };
}

/** Pure request-payload builder — no network, no DB, fully unit-testable in isolation. */
export function buildVionaTwilioTestPocRequestPayload(intent: VionaTwilioTestPocIntent): URLSearchParams {
  return new URLSearchParams({
    From: intent.fromNumber,
    To: intent.toNumber,
    Body: intent.body,
  });
}

export type VionaTwilioHttpTransportResult = Readonly<{
  status: number;
  json: unknown;
}>;

/**
 * Minimal Twilio HTTP transport surface — enables dependency injection so unit tests never make
 * a real network call even though this adapter's default implementation does.
 */
export type VionaTwilioHttpTransport = (args: {
  accountSid: string;
  authToken: string;
  body: URLSearchParams;
  timeoutMs: number;
}) => Promise<VionaTwilioHttpTransportResult>;

/**
 * Real Twilio REST transport (Basic Auth, form-encoded body) — the one and only network call
 * this module ever makes, and only when explicitly invoked (never on import, never as a
 * side-effect of any other function in this file).
 */
export const defaultVionaTwilioHttpTransport: VionaTwilioHttpTransport = async ({
  accountSid,
  authToken,
  body,
  timeoutMs,
}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: controller.signal,
      },
    );
    const json: unknown = await response.json().catch(() => null);
    return { status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
};

export type VionaTwilioTestCredentials = Readonly<{ accountSid: string; authToken: string }>;

/**
 * Reads **only** the Test-Credentials env vars — deliberately never falls back to the live
 * `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` used by this repo's existing mock-only telephony
 * features, per docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §4.2.
 */
export function readVionaTwilioTestCredentialsFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): VionaTwilioTestCredentials | null {
  const accountSid = env.TWILIO_TEST_ACCOUNT_SID;
  const authToken = env.TWILIO_TEST_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return { accountSid, authToken };
}

export type VionaTwilioRealExecutionOutcome =
  | Readonly<{ outcome: 'blockedOperator'; reason: 'flag_disabled' | 'missing_test_credentials' }>
  // Pack30D-5 — additive variant sharing the same `outcome: 'blockedOperator'` discriminant as the
  // line above (never edited); TypeScript merges both variants' `reason` literals on narrowing, so
  // `outcome.outcome === 'blockedOperator'` still exposes all three reasons via `outcome.reason`.
  | Readonly<{ outcome: 'blockedOperator'; reason: 'circuit_breaker_open_daily_cap_exceeded' }>
  | Readonly<{ outcome: 'blockedPolicy'; reason: 'invalid_from_number' | 'invalid_to_number' | 'empty_body' }>
  | Readonly<{
      outcome: 'succeeded';
      providerMessageSid: string;
      attempts: number;
      latencyMs: number;
    }>
  | Readonly<{
      outcome: 'failedBounded';
      errorClass: 'provider_rejected' | 'provider_timeout' | 'provider_unavailable';
      providerErrorCode: number | null;
      attempts: number;
      latencyMs: number;
    }>;

export type VionaTwilioRealExecutionResult = Readonly<{
  requestId: string;
  actionId: string;
  outcome: VionaTwilioRealExecutionOutcome;
  auditWritten: boolean;
}>;

export type ExecuteVionaTwilioTestPocInput = Readonly<{
  requestId: string;
  actionId: string;
  intent: VionaTwilioTestPocIntent;
  idempotencyKey?: string | null;
  actorUserId: string;
  actorRoleLabel: string;
}>;

export type ExecuteVionaTwilioTestPocDeps = Readonly<{
  isEnabled?: () => boolean;
  credentials?: VionaTwilioTestCredentials | null;
  transport?: VionaTwilioHttpTransport;
  auditWriter?: typeof appendVionaExecutionAuditEvent;
  nowMs?: () => number;
  timeoutMs?: number;
  /** Test-only hook — lets unit tests skip the real `setTimeout` backoff before a retry. */
  sleepMs?: (ms: number) => Promise<void>;
  /** Non-persistent, process-local idempotency placeholder — see the store type above. */
  idempotencyStore?: VionaTwilioRealExecutionIdempotencyStore;
  /**
   * Pack30D-5 — injectable Circuit Breaker check, encapsulating the read-only spend-window query
   * (`queryVionaTwilioSpendWindow`) and the pure decision function
   * (`evaluateVionaProviderCircuitBreaker`). Defaults to the real, DB-backed check; unit tests
   * override this to force `open`/`closed` deterministically without a database.
   */
  circuitBreakerCheck?: () => Promise<{ state: 'closed' | 'open' }>;
}>;

/** Default, DB-backed Circuit Breaker check — read-only query + pure decision, no writes. */
export async function defaultVionaTwilioCircuitBreakerCheck(): Promise<{ state: 'closed' | 'open' }> {
  const window = await queryVionaTwilioSpendWindow();
  const capUsdCents = readVionaProviderSpendCapUsdCentsFromEnv('twilio');
  const decision = evaluateVionaProviderCircuitBreaker(window, capUsdCents);
  return { state: decision.state };
}

const DEFAULT_TIMEOUT_MS = 8_000;
const RETRY_BACKOFF_MS = 250;

/** Network-level classes only ever get **one** automatic retry — never 4xx/policy rejections. */
function isRetryableErrorClass(errorClass: 'provider_rejected' | 'provider_timeout' | 'provider_unavailable'): boolean {
  return errorClass === 'provider_timeout' || errorClass === 'provider_unavailable';
}

/** Exported for Pack40D3B single-shot gateway adapter (no retry loop). */
export function classifyTwilioTransportResult(
  result: VionaTwilioHttpTransportResult,
): Readonly<{ ok: true; providerMessageSid: string } | { ok: false; errorClass: 'provider_rejected' | 'provider_unavailable'; providerErrorCode: number | null }> {
  const body = result.json as { sid?: unknown; code?: unknown } | null;
  if (result.status >= 200 && result.status < 300 && typeof body?.sid === 'string') {
    return { ok: true, providerMessageSid: body.sid };
  }
  const providerErrorCode = typeof body?.code === 'number' ? body.code : null;
  if (result.status >= 500 || result.status === 0) {
    return { ok: false, errorClass: 'provider_unavailable', providerErrorCode };
  }
  return { ok: false, errorClass: 'provider_rejected', providerErrorCode };
}

type VionaTwilioAuditableEvent = Readonly<{ outcome: 'attempted' }> | VionaTwilioRealExecutionOutcome;

/**
 * Process-local, non-persistent idempotency placeholder — mirrors the exact contract of the
 * Pack30A mock adapter's `VionaMockIdempotencyStore` (never durable, never a substitute for the
 * audit ledger), scoped to real-provider outcomes only.
 */
export type VionaTwilioRealExecutionIdempotencyStore = Readonly<{
  get(key: string): VionaTwilioRealExecutionOutcome | undefined;
  set(key: string, outcome: VionaTwilioRealExecutionOutcome): void;
}>;

export function createInMemoryVionaTwilioRealExecutionIdempotencyStore(): VionaTwilioRealExecutionIdempotencyStore {
  const store = new Map<string, VionaTwilioRealExecutionOutcome>();
  return Object.freeze({
    get(key: string): VionaTwilioRealExecutionOutcome | undefined {
      return store.get(key);
    },
    set(key: string, outcome: VionaTwilioRealExecutionOutcome): void {
      store.set(key, outcome);
    },
  });
}

function eventTypeForOutcome(
  outcome: VionaTwilioRealExecutionOutcome,
): 'executionRealSucceeded' | 'executionRealFailedBounded' | 'executionBlockedOperator' | 'executionBlockedPolicy' {
  if (outcome.outcome === 'succeeded') return 'executionRealSucceeded';
  if (outcome.outcome === 'failedBounded') return 'executionRealFailedBounded';
  if (outcome.outcome === 'blockedOperator') return 'executionBlockedOperator';
  return 'executionBlockedPolicy';
}

function buildOutcomeAuditPayload(
  input: ExecuteVionaTwilioTestPocInput,
  event: VionaTwilioAuditableEvent,
  replay: boolean,
): VionaExecutionAuditPayloadJson {
  return {
    provider: 'twilio_test_credentials',
    actionId: input.actionId,
    fromNumber: input.intent.fromNumber,
    toNumber: input.intent.toNumber,
    idempotencyKey: input.idempotencyKey ?? null,
    outcome: event.outcome,
    replay,
    detail: event,
  };
}

async function writeOutcomeAudit(
  input: ExecuteVionaTwilioTestPocInput,
  eventType: 'executionRealAttempted' | 'executionRealSucceeded' | 'executionRealFailedBounded' | 'executionBlockedOperator' | 'executionBlockedPolicy',
  event: VionaTwilioAuditableEvent,
  auditWriter: typeof appendVionaExecutionAuditEvent,
  replay: boolean = false,
): Promise<boolean> {
  const result = await auditWriter({
    requestId: input.requestId,
    eventType,
    actorUserId: input.actorUserId,
    actorRoleLabel: input.actorRoleLabel,
    message: `Pack30D-4 Twilio Test-Credentials real-provider POC: ${eventType}${replay ? ' (idempotent replay)' : ''}.`,
    payloadJson: buildOutcomeAuditPayload(input, event, replay),
  });
  return result.ok;
}

/**
 * The one and only real-provider call path in this repo. Every exit path (flag-blocked,
 * policy-blocked, attempted, succeeded, failed) writes exactly one durable audit-ledger row
 * before returning, via the existing, unmodified Pack30D-1 writer.
 */
export async function executeVionaTwilioTestPocReal(
  input: ExecuteVionaTwilioTestPocInput,
  deps: ExecuteVionaTwilioTestPocDeps = {},
): Promise<VionaTwilioRealExecutionResult> {
  const isEnabled = deps.isEnabled ?? isRealProviderExecutionEnabled;
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;
  const nowMs = deps.nowMs ?? (() => Date.now());
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const sleepMs = deps.sleepMs ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  if (!isEnabled()) {
    const outcome: VionaTwilioRealExecutionOutcome = { outcome: 'blockedOperator', reason: 'flag_disabled' };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
  }

  const circuitBreakerCheck = deps.circuitBreakerCheck ?? defaultVionaTwilioCircuitBreakerCheck;
  const breakerResult = await circuitBreakerCheck();
  if (breakerResult.state === 'open') {
    const outcome: VionaTwilioRealExecutionOutcome = {
      outcome: 'blockedOperator',
      reason: 'circuit_breaker_open_daily_cap_exceeded',
    };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
  }

  const validation = validateVionaTwilioTestPocIntent(input.intent);
  if (!validation.ok) {
    const outcome: VionaTwilioRealExecutionOutcome = { outcome: 'blockedPolicy', reason: validation.reason };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedPolicy', outcome, auditWriter);
    return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
  }

  const credentials = deps.credentials !== undefined ? deps.credentials : readVionaTwilioTestCredentialsFromEnv();
  if (!credentials) {
    const outcome: VionaTwilioRealExecutionOutcome = {
      outcome: 'blockedOperator',
      reason: 'missing_test_credentials',
    };
    const auditWritten = await writeOutcomeAudit(input, 'executionBlockedOperator', outcome, auditWriter);
    return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
  }

  if (input.idempotencyKey && deps.idempotencyStore) {
    const cached = deps.idempotencyStore.get(input.idempotencyKey);
    if (cached) {
      const auditWritten = await writeOutcomeAudit(
        input,
        eventTypeForOutcome(cached),
        cached,
        auditWriter,
        true,
      );
      return { requestId: input.requestId, actionId: input.actionId, outcome: cached, auditWritten };
    }
  }

  await writeOutcomeAudit(input, 'executionRealAttempted', { outcome: 'attempted' }, auditWriter).catch(
    () => false,
  );

  const transport = deps.transport ?? defaultVionaTwilioHttpTransport;
  const payload = buildVionaTwilioTestPocRequestPayload(input.intent);
  const startedAtMs = nowMs();

  let attempts = 0;
  let lastFailure: Readonly<{ errorClass: 'provider_rejected' | 'provider_timeout' | 'provider_unavailable'; providerErrorCode: number | null }> | null = null;

  while (attempts < 2) {
    attempts += 1;
    try {
      const transportResult = await transport({
        accountSid: credentials.accountSid,
        authToken: credentials.authToken,
        body: payload,
        timeoutMs,
      });
      const classified = classifyTwilioTransportResult(transportResult);
      if (classified.ok) {
        const outcome: VionaTwilioRealExecutionOutcome = {
          outcome: 'succeeded',
          providerMessageSid: classified.providerMessageSid,
          attempts,
          latencyMs: nowMs() - startedAtMs,
        };
        if (input.idempotencyKey && deps.idempotencyStore) {
          deps.idempotencyStore.set(input.idempotencyKey, outcome);
        }
        const auditWritten = await writeOutcomeAudit(input, 'executionRealSucceeded', outcome, auditWriter);
        return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
      }
      lastFailure = { errorClass: classified.errorClass, providerErrorCode: classified.providerErrorCode };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === 'AbortError';
      lastFailure = {
        errorClass: isAbort ? 'provider_timeout' : 'provider_unavailable',
        providerErrorCode: null,
      };
    }

    if (attempts < 2 && lastFailure && isRetryableErrorClass(lastFailure.errorClass)) {
      await sleepMs(RETRY_BACKOFF_MS);
      continue;
    }
    break;
  }

  const finalFailure = lastFailure ?? { errorClass: 'provider_unavailable' as const, providerErrorCode: null };
  const outcome: VionaTwilioRealExecutionOutcome = {
    outcome: 'failedBounded',
    errorClass: finalFailure.errorClass,
    providerErrorCode: finalFailure.providerErrorCode,
    attempts,
    latencyMs: nowMs() - startedAtMs,
  };
  if (input.idempotencyKey && deps.idempotencyStore) {
    deps.idempotencyStore.set(input.idempotencyKey, outcome);
  }
  const auditWritten = await writeOutcomeAudit(input, 'executionRealFailedBounded', outcome, auditWriter);
  return { requestId: input.requestId, actionId: input.actionId, outcome, auditWritten };
}
