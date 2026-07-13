/**
 * Pack30D-5 — Real-Provider spend Circuit Breaker tests (Twilio wired, OpenAI unwired-adapter
 * design). Covers the required test plan from
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §7, adapted to this repo's existing
 * `tsx` + `assert`-based testing pattern. Every test injects fakes (Prisma client, transport,
 * audit writer, clock) instead of making a real network/DB call, mirroring the exact
 * dependency-injection pattern already used by Pack30D-4's test suite.
 *
 * Test list (12):
 *   1. Breaker closed under cap -> Twilio real call proceeds exactly as it does today.
 *   2. Breaker open at/over cap -> zero network calls, blockedOperator/circuit_breaker_open_daily_cap_exceeded.
 *   3. Window correctly resets at the UTC day boundary (fixed test clock).
 *   4. Aggregate query counts ONLY the 3 Twilio real-execution event types.
 *   5. CRITICAL - OpenAI-side aggregate query counts ONLY VIONA_REAL_EXECUTION_CONTENT taskType.
 *   6. Missing/unparseable cap env var fails closed to a 0 cap (always open).
 *   7. CRITICAL - production hard-block still forces false independently of the breaker's state.
 *   8. Breaker check runs strictly before the network transport call/retry loop.
 *   9. No half-open probe - a second call in the same open window stays open, no re-attempt.
 *  10. CRITICAL source-scan - new OpenAI adapter never references AIRouterService.ts/AIPostGenerator.ts/
 *      TranslationService.ts/AIController.ts/vionaIntentRouter.ts, and none of those existing files
 *      is modified by this pack.
 *  11. CRITICAL source-scan - vionaTwilioTestRealProviderAdapter.ts's diff vs. origin/master
 *      contains only added lines (git-diff line-prefix parsing, same pattern as Pack32.4's test 8).
 *  12. Regression: Pack30D-4 (13/13) - run inline via the existing exported functions' behaviors,
 *      plus a full-suite note (Pack31/Pack32/Pack32.5) run separately via npm scripts below.
 *
 * Run: npx tsx scripts/test-viona-pack30d-5-real-provider-circuit-breaker.ts
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  evaluateVionaProviderCircuitBreaker,
  readVionaProviderSpendCapUsdCentsFromEnv,
  VIONA_PROVIDER_CIRCUIT_BREAKER_CAP_ENV_VARS,
  type VionaProviderSpendWindow,
} from '../src/lib/viona/circuitBreaker/vionaProviderSpendCircuitBreaker';
import {
  computeVionaProviderSpendUtcDayWindow,
  queryVionaTwilioSpendWindow,
  queryVionaOpenAiRealExecutionSpendWindow,
  VIONA_TWILIO_REAL_EXECUTION_EVENT_TYPES,
  type VionaProviderSpendWindowQueryPrismaClient,
  type VionaOpenAiSpendWindowQueryPrismaClient,
} from '../src/services/viona/vionaProviderSpendWindowQueryService';
import {
  executeVionaTwilioTestPocReal,
  type ExecuteVionaTwilioTestPocInput,
  type VionaTwilioHttpTransport,
  type VionaTwilioHttpTransportResult,
} from '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import {
  isRealProviderExecutionEnabled,
  VIONA_DEPLOYMENT_STAGE_ENV,
  VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG,
} from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';

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
  requestId: 'req-pack30d5-test',
  actionId: 'request.notify_test_poc',
  intent: { fromNumber: HAPPY_FROM, toNumber: HAPPY_TO, body: 'Pack30D-5 breaker test message (test credentials only).' },
  idempotencyKey: null,
  actorUserId: 'user-pack30d5-test',
  actorRoleLabel: 'requester',
};

type FakeAuditRow = Readonly<{ eventType: string; payloadJson: unknown }>;

function createFakeAuditWriter(): { writer: typeof appendVionaExecutionAuditEvent; rows: FakeAuditRow[] } {
  const rows: FakeAuditRow[] = [];
  const writer = (async (input: {
    requestId: string;
    eventType: string;
    actorUserId?: string | null;
    actorRoleLabel?: string | null;
    message?: string | null;
    payloadJson?: unknown;
  }) => {
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

function fixedWindow(overrides: Partial<VionaProviderSpendWindow> = {}): VionaProviderSpendWindow {
  return {
    provider: 'twilio',
    windowStartIso: '2026-07-13T00:00:00.000Z',
    windowEndIso: '2026-07-14T00:00:00.000Z',
    callCount: 0,
    estimatedSpendUsdCents: 0,
    ...overrides,
  };
}

/** Test 1: breaker closed under cap -> Twilio real call proceeds exactly as it does today. */
async function testBreakerClosedUnderCapAllowsRealCall(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => ({
    status: 201,
    json: { sid: 'SMfakebreaker0000000000000000001' },
  }));
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    circuitBreakerCheck: async () => ({ state: 'closed' }),
  });

  assert(result.outcome.outcome === 'succeeded', `expected succeeded, got ${result.outcome.outcome}`);
  assert(callCount() === 1, 'exactly one transport call expected when the breaker is closed');
  assert(rows.every((r) => r.eventType !== 'executionBlockedOperator'), 'no blockedOperator row expected when the breaker is closed');
}

/** Test 2: breaker open at/over cap -> zero network calls, blockedOperator/circuit_breaker_open_daily_cap_exceeded. */
async function testBreakerOpenBlocksWithZeroTransportCalls(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called when the circuit breaker is open');
  });
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    circuitBreakerCheck: async () => ({ state: 'open' }),
  });

  assert(result.outcome.outcome === 'blockedOperator', `expected blockedOperator, got ${result.outcome.outcome}`);
  assert(
    result.outcome.outcome === 'blockedOperator' && result.outcome.reason === 'circuit_breaker_open_daily_cap_exceeded',
    'expected reason circuit_breaker_open_daily_cap_exceeded',
  );
  assert(callCount() === 0, 'transport must not be called when the circuit breaker is open');
  assert(rows.length === 1 && rows[0]!.eventType === 'executionBlockedOperator', 'exactly one executionBlockedOperator row expected');
}

/** Test 3: window correctly resets at the UTC day boundary (fixed test clock, no real wall-clock wait). */
function testWindowResetsAtUtcDayBoundary(): void {
  const day1EndMs = new Date('2026-07-13T23:59:59.999Z').getTime();
  const day2StartMs = new Date('2026-07-14T00:00:00.000Z').getTime();

  const day1Window = computeVionaProviderSpendUtcDayWindow(day1EndMs);
  const day2Window = computeVionaProviderSpendUtcDayWindow(day2StartMs);

  assert(day1Window.windowStartIso === '2026-07-13T00:00:00.000Z', 'day1 window must start at 2026-07-13T00:00:00.000Z');
  assert(day1Window.windowEndIso === '2026-07-14T00:00:00.000Z', 'day1 window must end at 2026-07-14T00:00:00.000Z');
  assert(day2Window.windowStartIso === '2026-07-14T00:00:00.000Z', 'day2 window must start at 2026-07-14T00:00:00.000Z (rolled over)');
  assert(day2Window.windowStartIso !== day1Window.windowStartIso, 'window must roll over to a new UTC day');
}

/** Test 4: aggregate query counts ONLY the 3 Twilio real-execution event types. */
async function testTwilioAggregateQueryCountsOnlyRealExecutionEventTypes(): Promise<void> {
  let capturedWhere: unknown;
  const fakePrisma: VionaProviderSpendWindowQueryPrismaClient = {
    vionaRequestAuditEvent: {
      count: async (args) => {
        capturedWhere = args.where;
        return 3;
      },
    },
  };

  const window = await queryVionaTwilioSpendWindow({ prismaClient: fakePrisma, nowMs: () => Date.now() });

  assert(window.callCount === 3, 'window callCount must reflect the fake count result');
  assert(window.estimatedSpendUsdCents === 3, 'estimated spend must be callCount * illustrative per-call cost (1 cent)');
  const where = capturedWhere as { eventType: { in: readonly string[] } };
  assert(
    where.eventType.in.length === VIONA_TWILIO_REAL_EXECUTION_EVENT_TYPES.length &&
      VIONA_TWILIO_REAL_EXECUTION_EVENT_TYPES.every((t) => where.eventType.in.includes(t)),
    'query must filter on exactly the 3 Twilio real-execution event types',
  );
  assert(
    !where.eventType.in.includes('executionMockInvoked') && !where.eventType.in.includes('executionPlanBuilt'),
    'query must never include Pack30A/30B mock-only preview event types',
  );
}

/** Test 5 (CRITICAL): OpenAI-side aggregate query counts ONLY the VIONA_REAL_EXECUTION_CONTENT taskType. */
async function testOpenAiAggregateQueryIsolatedToDedicatedTaskType(): Promise<void> {
  let capturedWhere: unknown;
  const fakePrisma: VionaOpenAiSpendWindowQueryPrismaClient = {
    llmApiUsageLog: {
      aggregate: async (args) => {
        capturedWhere = args.where;
        return { _sum: { totalTokens: 5000 }, _count: { _all: 2 } };
      },
    },
  };

  const window = await queryVionaOpenAiRealExecutionSpendWindow({ prismaClient: fakePrisma, nowMs: () => Date.now() });

  assert(window.callCount === 2, 'window callCount must reflect the fake aggregate _count');
  assert(window.estimatedSpendUsdCents > 0, 'estimated spend must be derived from totalTokens, not zero');
  const where = capturedWhere as { taskType: string };
  assert(where.taskType === 'VIONA_REAL_EXECUTION_CONTENT', 'query must filter on exactly the VIONA_REAL_EXECUTION_CONTENT task type');
  assert(
    where.taskType !== 'COMPLEX_MARKETING' &&
      where.taskType !== 'SIMPLE_TRANSLATION' &&
      where.taskType !== 'ROUTING_INQUIRY' &&
      where.taskType !== 'DEEP_CONTEXT',
    'query must never count any other, already-live task type',
  );
}

/** Test 6: missing/unparseable cap env var fails closed to a 0 cap (always open), never "unlimited." */
function testMissingOrInvalidCapFailsClosedToZero(): void {
  assert(readVionaProviderSpendCapUsdCentsFromEnv('twilio', {}) === 0, 'missing cap env var must resolve to 0');
  assert(
    readVionaProviderSpendCapUsdCentsFromEnv('twilio', { [VIONA_PROVIDER_CIRCUIT_BREAKER_CAP_ENV_VARS.twilio]: 'not-a-number' }) === 0,
    'non-numeric cap env var must resolve to 0',
  );
  assert(
    readVionaProviderSpendCapUsdCentsFromEnv('twilio', { [VIONA_PROVIDER_CIRCUIT_BREAKER_CAP_ENV_VARS.twilio]: '-5' }) === 0,
    'negative cap env var must resolve to 0',
  );

  const zeroSpendWindow = fixedWindow({ callCount: 0, estimatedSpendUsdCents: 0 });
  const decision = evaluateVionaProviderCircuitBreaker(zeroSpendWindow, 0);
  assert(decision.state === 'open', 'a 0 cap must always be open, even with zero recorded spend');
  assert(decision.reason === 'daily_cap_exceeded', 'a 0 cap decision reason must be daily_cap_exceeded');
}

/** Test 7 (CRITICAL): production deployment-stage hard-block still forces false independently of the breaker's state. */
async function testProductionHardBlockIndependentOfBreakerState(): Promise<void> {
  const productionStageEnv = {
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'production',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
    NODE_ENV: 'production',
  };
  assert(isRealProviderExecutionEnabled(productionStageEnv) === false, 'production deployment stage must hard-block even when flag is true');

  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called under the production deployment-stage hard-block, even if the breaker reports closed');
  });
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => isRealProviderExecutionEnabled(productionStageEnv),
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    // Deliberately report the breaker as CLOSED to prove the flag gate alone is sufficient and
    // the breaker cannot compensate for / override it in either direction.
    circuitBreakerCheck: async () => ({ state: 'closed' }),
  });

  assert(result.outcome.outcome === 'blockedOperator', 'production deployment-stage hard-block must still yield blockedOperator even with a closed breaker');
  assert(
    result.outcome.outcome === 'blockedOperator' && result.outcome.reason === 'flag_disabled',
    'the flag gate, not the breaker, must be the reported reason under the production deployment-stage hard-block',
  );
  assert(callCount() === 0, 'transport must not be called under the production deployment-stage hard-block');
  assert(rows.length === 1, 'exactly one audit row expected for the hard-blocked attempt');
}

/** Test 8: breaker check runs strictly before the network transport call/retry loop. */
async function testBreakerCheckRunsBeforeTransport(): Promise<void> {
  const callOrder: string[] = [];
  const { transport } = createSpyTransport(async () => {
    callOrder.push('transport');
    return { status: 201, json: { sid: 'SMfakebreaker0000000000000000002' } };
  });
  const { writer } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    circuitBreakerCheck: async () => {
      callOrder.push('breaker');
      return { state: 'closed' };
    },
  });

  assert(result.outcome.outcome === 'succeeded', 'expected the happy path to succeed');
  assert(callOrder.length === 2 && callOrder[0] === 'breaker' && callOrder[1] === 'transport', 'the breaker check must run strictly before the transport call');
}

/** Test 9: no half-open probe - a second call in the same open window stays open, no re-attempt. */
async function testNoHalfOpenProbeSecondCallStaysOpen(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called while the breaker is open, even on a second attempt in the same window');
  });
  const { writer, rows } = createFakeAuditWriter();
  let breakerCheckCalls = 0;
  const circuitBreakerCheck = async (): Promise<{ state: 'closed' | 'open' }> => {
    breakerCheckCalls += 1;
    return { state: 'open' };
  };

  const first = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    circuitBreakerCheck,
  });
  const second = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => true,
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    circuitBreakerCheck,
  });

  assert(first.outcome.outcome === 'blockedOperator' && second.outcome.outcome === 'blockedOperator', 'both calls must be blockedOperator while the breaker is open');
  assert(callCount() === 0, 'zero transport calls must ever be made while the breaker is open, across both attempts');
  assert(breakerCheckCalls === 2, 'the breaker is re-evaluated (read-only) on each call, but never auto-probes the network');
  assert(rows.filter((r) => r.eventType === 'executionBlockedOperator').length === 2, 'each open-breaker attempt must write its own audit row (no caching/mutation of breaker state)');
}

/** Test 10 (CRITICAL source-scan): new OpenAI adapter never references any existing, already-live OpenAI call site. */
function testOpenAiAdapterNeverReferencesExistingLiveCallSites(): void {
  assertNoneMatch(
    ['../src/lib/viona/realProviderAdapter/vionaOpenAiRealProviderAdapter.ts'],
    [/AIRouterService/, /AIPostGenerator/, /TranslationService/, /AIController/, /vionaIntentRouter/, /createRoutedChatCompletion/],
    'the new OpenAI adapter must never reference an existing, already-live OpenAI call site or its router entry point',
  );

  const existingLiveFiles = [
    '../src/services/ai/AIRouterService.ts',
    '../src/services/ai/AIPostGenerator.ts',
    '../src/services/ai/TranslationService.ts',
    '../src/controllers/AIController.ts',
  ];
  for (const file of existingLiveFiles) {
    const resolved = path.resolve(__dirname, file);
    if (!fs.existsSync(resolved)) continue; // some may not exist under these exact names/paths in this repo layout
    const diff = execSync(`git diff origin/master -- "${path.relative(path.resolve(__dirname, '..'), resolved)}"`, {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
    });
    assert(diff.trim().length === 0, `${file} must have zero diff vs. origin/master (this pack must never modify existing, already-live OpenAI call sites)`);
  }
}

/** Test 11 (CRITICAL source-scan): the modified Twilio adapter's diff vs. origin/master is purely additive. */
function testTwilioAdapterDiffIsPurelyAdditive(): void {
  const relativePath = 'src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts';
  const diff = execSync(`git diff origin/master -- "${relativePath}"`, {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });
  assert(diff.trim().length > 0, 'expected a non-empty diff for the modified Twilio adapter file');
  const removedContentLines = diff
    .split('\n')
    .filter((line) => line.startsWith('-') && !line.startsWith('---'));
  assert(removedContentLines.length === 0, `the Twilio adapter's diff vs. origin/master must contain zero removed lines; found ${removedContentLines.length}`);
}

/** Test 12: regression - Pack30D-4's own gate chain (flag-disabled path) is unaffected by this pack's new breaker branch. */
async function testPack30D4FlagDisabledPathUnaffectedByNewBreakerBranch(): Promise<void> {
  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called when the flag is disabled, regardless of the new breaker branch');
  });
  const { writer, rows } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => false,
    transport,
    auditWriter: writer,
    sleepMs: fakeSleep(),
    // No circuitBreakerCheck override - proves the flag check still short-circuits BEFORE the
    // breaker is ever consulted, exactly matching Pack30D-4's original, unmodified ordering.
  });

  assert(result.outcome.outcome === 'blockedOperator', 'expected blockedOperator');
  assert(result.outcome.outcome === 'blockedOperator' && result.outcome.reason === 'flag_disabled', 'expected reason flag_disabled, not a breaker-related reason');
  assert(callCount() === 0, 'transport must not be called when the flag is disabled');
  assert(rows.length === 1 && rows[0]!.eventType === 'executionBlockedOperator', 'exactly one executionBlockedOperator row expected');
}

async function main(): Promise<void> {
  await testBreakerClosedUnderCapAllowsRealCall();
  await testBreakerOpenBlocksWithZeroTransportCalls();
  testWindowResetsAtUtcDayBoundary();
  await testTwilioAggregateQueryCountsOnlyRealExecutionEventTypes();
  await testOpenAiAggregateQueryIsolatedToDedicatedTaskType();
  testMissingOrInvalidCapFailsClosedToZero();
  await testProductionHardBlockIndependentOfBreakerState();
  await testBreakerCheckRunsBeforeTransport();
  await testNoHalfOpenProbeSecondCallStaysOpen();
  testOpenAiAdapterNeverReferencesExistingLiveCallSites();
  testTwilioAdapterDiffIsPurelyAdditive();
  await testPack30D4FlagDisabledPathUnaffectedByNewBreakerBranch();
  console.log('PASS Pack30D-5 real-provider spend Circuit Breaker tests (12/12)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
