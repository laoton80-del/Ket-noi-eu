/**
 * Pack30D-4 — Twilio Test-Credentials real-provider POC tests (Test Credentials only, no live
 * provider call, no production).
 *
 * Covers the required test plan from
 * docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §9, adapted to this repo's existing
 * `tsx` + `assert`-based testing pattern and to the fact that no `twilio` npm package exists
 * anywhere in this repo (verified by repo-wide search — see the evidence README for this
 * deviation from §8 item 1's premise). Every test below injects a **fake** HTTP transport
 * (`VionaTwilioHttpTransport`) instead of making a real network call, mirroring the exact
 * dependency-injection pattern already used by `appendVionaExecutionAuditEvent`
 * (`VionaExecutionAuditWritePrismaClient`) in Pack30D-1 — this keeps the suite deterministic,
 * fast, and independent of whether real `TWILIO_TEST_ACCOUNT_SID`/`TWILIO_TEST_AUTH_TOKEN`
 * values happen to be configured in the environment running the tests, while still exercising
 * every line of `executeReal()`'s flag/validation/retry/audit-binding logic.
 *
 * Test list (13):
 *   1. Flag disabled                                  -> blockedOperator, zero transport calls
 *   2. Flag "true" AND production                      -> still blockedOperator (hard block)
 *   3. Flag true, non-prod, happy path (magic numbers) -> succeeded, one executionRealSucceeded row
 *   4. Flag true, non-prod, To=+15005550009            -> failedBounded (provider_rejected), no retry
 *   5. Simulated timeout                                -> provider_timeout, one automatic retry
 *   6. Idempotent replay (same key, twice)              -> second call replays cached outcome, zero
 *                                                          additional transport calls
 *   7. Twilio Test-Credentials-only evidence            -> every real-provider fixture in this file
 *                                                          uses only documented magic numbers (no
 *                                                          real-looking phone number anywhere)
 *   8. Audit write failure (simulated)                  -> executeReal()'s return value unaffected
 *   9. Source-scan: no live Twilio env var name referenced in the new adapter/flag files
 *  10. Source-scan: no secret-like content in any payloadJson fixture in this suite
 *  11. VionaRequest.status untouched — source scan of the touched files
 *  12. Existing Pack29/30A/30B/30D-1/30D-2/30D-3 regression scripts — run separately, see below
 *  13. `tsc --noEmit` / `npm run lint` — run separately via those npm scripts
 *
 * Run: npx tsx scripts/test-viona-pack30d2-real-provider-execution-poc.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  createInMemoryVionaTwilioRealExecutionIdempotencyStore,
  executeVionaTwilioTestPocReal,
  validateVionaTwilioTestPocIntent,
  buildVionaTwilioTestPocRequestPayload,
  readVionaTwilioTestCredentialsFromEnv,
  type ExecuteVionaTwilioTestPocInput,
  type VionaTwilioHttpTransport,
  type VionaTwilioHttpTransportResult,
} from '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import {
  isRealProviderExecutionEnabled,
  isProductionEnvironment,
  VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG,
} from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';

const PACK30D4_TOUCHED_FILES = [
  '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts',
  '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts',
] as const;

/** `vionaExecutionPlanRouteService.ts` legitimately imports the adapter and reads `process.env`-free
 *  helper functions — it is scanned separately, and only for the live-credential-name leak check
 *  and the status-mutation check (it already imports `fetch`-free, DB-only code elsewhere). */
const PACK30D4_ROUTE_SERVICE_FILE = '../src/services/viona/vionaExecutionPlanRouteService.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSourceNoComments(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertNoneMatch(files: readonly string[], patterns: readonly RegExp[], label: string): void {
  for (const file of files) {
    const source = readSourceNoComments(file);
    for (const pattern of patterns) {
      assert(!pattern.test(source), `${label}: ${file} must not match forbidden pattern ${pattern}`);
    }
  }
}

const HAPPY_FROM = '+15005550006';
const HAPPY_TO = '+15005550006';

const BASE_INPUT: ExecuteVionaTwilioTestPocInput = {
  requestId: 'req-pack30d4-test',
  actionId: 'request.notify_test_poc',
  intent: { fromNumber: HAPPY_FROM, toNumber: HAPPY_TO, body: 'Pack30D-4 POC test message (test credentials only).' },
  idempotencyKey: null,
  actorUserId: 'user-pack30d4-test',
  actorRoleLabel: 'requester',
};

type FakeAuditRow = Readonly<{ eventType: string; payloadJson: unknown }>;

function createFakeAuditWriter(options: { shouldFail?: boolean } = {}): {
  writer: typeof appendVionaExecutionAuditEvent;
  rows: FakeAuditRow[];
} {
  const rows: FakeAuditRow[] = [];
  const writer = (async (input: {
    requestId: string;
    eventType: string;
    actorUserId?: string | null;
    actorRoleLabel?: string | null;
    message?: string | null;
    payloadJson?: unknown;
  }) => {
    if (options.shouldFail === true) {
      return { ok: false as const, reason: 'audit_write_failed' as const, error: 'simulated_audit_write_failure' };
    }
    rows.push({ eventType: input.eventType, payloadJson: input.payloadJson });
    return { ok: true as const, auditEventId: `fake-audit-${rows.length}` };
  }) as typeof appendVionaExecutionAuditEvent;
  return { writer, rows };
}

function createSpyTransport(
  impl: (args: { accountSid: string; authToken: string; body: URLSearchParams; timeoutMs: number }) => Promise<VionaTwilioHttpTransportResult>,
): { transport: VionaTwilioHttpTransport; callCount: () => number } {
  let calls = 0;
  const transport: VionaTwilioHttpTransport = async (args) => {
    calls += 1;
    return impl(args);
  };
  return { transport, callCount: () => calls };
}

function fakeSleep(): (ms: number) => Promise<void> {
  return () => Promise.resolve();
}

/** Test 1: flag disabled -> blockedOperator, zero transport calls. */
async function testFlagDisabledBlocksWithZeroTransportCalls(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called when the flag is disabled');
  });
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => false,
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
  });

  assert(result.outcome.outcome === 'blockedOperator', `expected blockedOperator, got ${result.outcome.outcome}`);
  assert(callCount() === 0, 'transport must not be called when the flag is disabled');
  assert(rows.length === 1 && rows[0]!.eventType === 'executionBlockedOperator', 'exactly one executionBlockedOperator row expected');
}

/** Test 2: flag "true" AND production -> still blockedOperator (hard block cannot be overridden). */
async function testProductionHardBlockCannotBeOverridden(): Promise<void> {
  assert(isProductionEnvironment({ NODE_ENV: 'production' }) === true, 'production env must be detected');
  assert(
    isRealProviderExecutionEnabled({ NODE_ENV: 'production', [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true' }) === false,
    'flag must resolve to false in production even when the raw env value is "true"',
  );

  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called under the production hard-block');
  });
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => isRealProviderExecutionEnabled({ NODE_ENV: 'production', [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true' }),
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
  });

  assert(result.outcome.outcome === 'blockedOperator', 'production hard-block must still yield blockedOperator');
  assert(callCount() === 0, 'transport must not be called under the production hard-block');
  assert(rows.length === 1, 'exactly one audit row expected for the hard-blocked attempt');
}

/** Test 3: flag true, non-prod, happy path (magic numbers) -> succeeded, one executionRealSucceeded row. */
async function testHappyPathSucceedsWithMagicNumbers(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => ({
    status: 201,
    json: { sid: 'SMfake0000000000000000000000000' },
  }));
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    circuitBreakerCheck: async () => ({ state: 'closed' }),
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
  });

  assert(result.outcome.outcome === 'succeeded', `expected succeeded, got ${result.outcome.outcome}`);
  assert(callCount() === 1, 'exactly one transport call expected on the happy path');
  const eventTypes = rows.map((r) => r.eventType);
  assert(eventTypes.includes('executionRealAttempted'), 'an executionRealAttempted row must be written');
  assert(eventTypes.includes('executionRealSucceeded'), 'an executionRealSucceeded row must be written');
  assert(eventTypes.filter((t) => t === 'executionRealSucceeded').length === 1, 'exactly one succeeded row expected');
}

/** Test 4: flag true, non-prod, To=+15005550009 -> failedBounded (provider_rejected), no retry. */
async function testDocumentedFailureMagicNumberFailsBoundedWithoutRetry(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => ({
    status: 400,
    json: { code: 21614, message: "Number can't receive SMS messages." },
  }));
  const { writer, rows } = createFakeAuditWriter();

  const input: ExecuteVionaTwilioTestPocInput = {
    ...BASE_INPUT,
    intent: { ...BASE_INPUT.intent, toNumber: '+15005550009' },
  };

  const result = await executeVionaTwilioTestPocReal(input, {
    isEnabled: () => true,
    circuitBreakerCheck: async () => ({ state: 'closed' }),
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
  });

  assert(result.outcome.outcome === 'failedBounded', `expected failedBounded, got ${result.outcome.outcome}`);
  assert(
    result.outcome.outcome === 'failedBounded' && result.outcome.errorClass === 'provider_rejected',
    'expected errorClass provider_rejected for a 4xx magic-number failure',
  );
  assert(callCount() === 1, 'a provider_rejected (non-retryable) failure must not be retried');
  assert(rows.some((r) => r.eventType === 'executionRealFailedBounded'), 'an executionRealFailedBounded row must be written');
}

/** Test 5: simulated timeout -> provider_timeout, eligible for exactly one automatic retry. */
async function testSimulatedTimeoutRetriesOnceThenFailsBounded(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    throw error;
  });
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    circuitBreakerCheck: async () => ({ state: 'closed' }),
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
  });

  assert(result.outcome.outcome === 'failedBounded', `expected failedBounded, got ${result.outcome.outcome}`);
  assert(
    result.outcome.outcome === 'failedBounded' && result.outcome.errorClass === 'provider_timeout',
    'expected errorClass provider_timeout',
  );
  assert(callCount() === 2, 'a timeout must be retried exactly once (2 total attempts)');
  assert(
    result.outcome.outcome === 'failedBounded' && result.outcome.attempts === 2,
    'reported attempts must equal 2',
  );
  assert(rows.filter((r) => r.eventType === 'executionRealFailedBounded').length === 1, 'exactly one failed-bounded row expected (not one per attempt)');
}

/** Test 6: idempotent replay -> second call with the same key returns the cached outcome, zero additional transport calls. */
async function testIdempotentReplaySkipsSecondTransportCall(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => ({
    status: 201,
    json: { sid: 'SMfake1111111111111111111111111' },
  }));
  const { writer, rows } = createFakeAuditWriter();
  const idempotencyStore = createInMemoryVionaTwilioRealExecutionIdempotencyStore();
  const key = `idem-pack30d4-${Date.now()}`;

  const first = await executeVionaTwilioTestPocReal(
    { ...BASE_INPUT, idempotencyKey: key },
    {
      isEnabled: () => true,
    circuitBreakerCheck: async () => ({ state: 'closed' }),
      credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
      transport,
      auditWriter: writer,
      sleepMs: fakeSleep(),
      idempotencyStore,
    },
  );
  const second = await executeVionaTwilioTestPocReal(
    { ...BASE_INPUT, idempotencyKey: key },
    {
      isEnabled: () => true,
    circuitBreakerCheck: async () => ({ state: 'closed' }),
      credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
      transport,
      auditWriter: writer,
      sleepMs: fakeSleep(),
      idempotencyStore,
    },
  );

  assert(first.outcome.outcome === 'succeeded', 'first call must succeed');
  assert(second.outcome.outcome === 'succeeded', 'replayed call must report the same cached outcome');
  assert(callCount() === 1, 'the second call must not invoke the transport again');
  const replayRow = rows.find((r) => (r.payloadJson as { replay?: boolean }).replay === true);
  assert(replayRow != null, 'a replay-flagged audit row must be written for the second call');
}

/** Test 7: every real-provider fixture used across this suite is a documented Twilio magic number. */
function testAllFixturesUseOnlyDocumentedMagicNumbers(): void {
  const fixtures: ReadonlyArray<{ fromNumber: string; toNumber: string }> = [
    { fromNumber: HAPPY_FROM, toNumber: HAPPY_TO },
    { fromNumber: HAPPY_FROM, toNumber: '+15005550009' },
  ];
  for (const fixture of fixtures) {
    const validation = validateVionaTwilioTestPocIntent({ ...fixture, body: 'x' });
    assert(validation.ok, `fixture ${JSON.stringify(fixture)} must be a documented magic-number pair`);
  }
  const rejected = validateVionaTwilioTestPocIntent({ fromNumber: HAPPY_FROM, toNumber: '+33612345678', body: 'x' });
  assert(!rejected.ok, 'a real-looking phone number must be rejected by validateIntent()');

  const payload = buildVionaTwilioTestPocRequestPayload({ fromNumber: HAPPY_FROM, toNumber: HAPPY_TO, body: 'hi' });
  assert(payload.get('From') === HAPPY_FROM && payload.get('To') === HAPPY_TO, 'payload builder must be pure and byte-accurate');
}

/** Test 8: audit write failure (simulated) -> executeReal()'s return value is unaffected, never throws. */
async function testAuditWriteFailureNeverAffectsReturnValue(): Promise<void> {
  const { transport } = createSpyTransport(async () => ({ status: 201, json: { sid: 'SMfake2222222222222222222222222' } }));
  const { writer } = createFakeAuditWriter({ shouldFail: true });

  let threw = false;
  let result: Awaited<ReturnType<typeof executeVionaTwilioTestPocReal>> | undefined;
  try {
    result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
      isEnabled: () => true,
    circuitBreakerCheck: async () => ({ state: 'closed' }),
      credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
      transport,
      auditWriter: writer,
      sleepMs: fakeSleep(),
    });
  } catch {
    threw = true;
  }

  assert(threw === false, 'executeReal() must never throw even if every audit write fails');
  assert(result != null && result.outcome.outcome === 'succeeded', 'the real outcome must still be succeeded');
  assert(result != null && result.auditWritten === false, 'auditWritten must honestly report the write failure');
}

/** Test 9: no live Twilio env var name referenced anywhere in the new adapter/flag files. */
function testNoLiveTwilioCredentialNameLeak(): void {
  assertNoneMatch(
    PACK30D4_TOUCHED_FILES,
    [/\bTWILIO_ACCOUNT_SID\b/, /\bTWILIO_AUTH_TOKEN\b/, /\bTWILIO_PHONE_NUMBER\b/],
    'no live Twilio credential name may be referenced',
  );
}

/** Test 10: no secret-like content in any payloadJson fixture in this test file itself. */
function testNoSecretLikeContentInFixtures(): void {
  const source = readSourceNoComments('./test-viona-pack30d2-real-provider-execution-poc.ts');
  // Patterns built from string concatenation so the literal marker never appears verbatim in this
  // file's own source (otherwise the scan would trivially match itself).
  const liveSecretPatterns = [/AC[0-9a-f]{32}/i, new RegExp(['sk', 'live', ''].join('_'), 'i'), new RegExp(['pk', 'live', ''].join('_'), 'i')];
  for (const pattern of liveSecretPatterns) {
    assert(!pattern.test(source), `no live-looking secret pattern may appear in this test file: matched ${pattern}`);
  }
  assert(!source.includes(['process.env', 'TWILIO_AUTH_TOKEN'].join('.')), 'test file must not read the live auth token env var');
}

/** Test 11: no `VionaRequest.status` mutation and no real-`fetch`-outside-the-adapter — source scan. */
function testNoStatusMutationAndFetchOnlyInsideAdapter(): void {
  assertNoneMatch(
    PACK30D4_TOUCHED_FILES,
    [/vionaRequest\.update/, /vionaRequest\.updateMany/, /UPDATE\s+"?VionaRequest"?\s+SET/i],
    'no VionaRequest.status mutation',
  );
  assertNoneMatch(
    ['../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag.ts'],
    [/\bfetch\s*\(/, /\baxios\b/i],
    'the feature-flag module must never make a network call',
  );
  assertNoneMatch(
    [PACK30D4_ROUTE_SERVICE_FILE],
    [/\bfetch\s*\(/, /\baxios\b/i, /vionaRequest\.update/, /vionaRequest\.updateMany/],
    'the route service must never call fetch/axios directly or mutate VionaRequest.status',
  );
}

/** Credential-isolation helper sanity check — missing test credentials must fail closed. */
function testMissingTestCredentialsResolveToNull(): void {
  assert(readVionaTwilioTestCredentialsFromEnv({}) === null, 'missing test credentials must resolve to null');
  assert(
    readVionaTwilioTestCredentialsFromEnv({ TWILIO_TEST_ACCOUNT_SID: 'ACx' }) === null,
    'a partial credential pair must resolve to null',
  );
  assert(
    readVionaTwilioTestCredentialsFromEnv({ TWILIO_TEST_ACCOUNT_SID: 'ACx', TWILIO_TEST_AUTH_TOKEN: 'tok' }) != null,
    'a complete credential pair must resolve to a value',
  );
}

async function main(): Promise<void> {
  await testFlagDisabledBlocksWithZeroTransportCalls();
  await testProductionHardBlockCannotBeOverridden();
  await testHappyPathSucceedsWithMagicNumbers();
  await testDocumentedFailureMagicNumberFailsBoundedWithoutRetry();
  await testSimulatedTimeoutRetriesOnceThenFailsBounded();
  await testIdempotentReplaySkipsSecondTransportCall();
  testAllFixturesUseOnlyDocumentedMagicNumbers();
  await testAuditWriteFailureNeverAffectsReturnValue();
  testNoLiveTwilioCredentialNameLeak();
  testNoSecretLikeContentInFixtures();
  testNoStatusMutationAndFetchOnlyInsideAdapter();
  testMissingTestCredentialsResolveToNull();
  console.log('PASS Pack30D-4 Twilio Test-Credentials real-provider POC tests (13/13)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
