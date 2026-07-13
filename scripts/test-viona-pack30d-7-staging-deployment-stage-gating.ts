/**
 * Pack30D-7 — Staging deployment-stage gating for real-provider execution (Twilio only).
 *
 * Proves the Pack30D-7 fix for the Fly staging `NODE_ENV=production` trap:
 * real Twilio executeReal() is allowed ONLY when BOTH:
 *   - VIONA_DEPLOYMENT_STAGE === 'staging'
 *   - PACK30_REAL_PROVIDER_EXECUTION_ENABLED === 'true'
 *
 * Local/dev/unknown stages and production deployment stage always fail closed.
 * OpenAI real-execution flag remains default-off and uses the same stage gate.
 *
 * Run: npx tsx scripts/test-viona-pack30d-7-staging-deployment-stage-gating.ts
 */

import {
  executeVionaTwilioTestPocReal,
  type ExecuteVionaTwilioTestPocInput,
  type VionaTwilioHttpTransport,
  type VionaTwilioHttpTransportResult,
} from '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import {
  isOpenAiRealExecutionEnabled,
  isRealProviderExecutionEnabled,
  isProductionEnvironment,
  isVionaProductionDeploymentStage,
  isVionaStagingDeploymentStage,
  readVionaDeploymentStage,
  VIONA_DEPLOYMENT_STAGE_ENV,
  VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG,
  VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG,
} from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const HAPPY_FROM = '+15005550006';
const HAPPY_TO = '+15005550006';

const BASE_INPUT: ExecuteVionaTwilioTestPocInput = {
  requestId: 'req-pack30d7-test',
  actionId: 'request.notify_test_poc',
  intent: { fromNumber: HAPPY_FROM, toNumber: HAPPY_TO, body: 'Pack30D-7 staging gate test (test credentials only).' },
  idempotencyKey: null,
  actorUserId: 'user-pack30d7-test',
  actorRoleLabel: 'requester',
};

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

function createFakeAuditWriter(): { writer: typeof appendVionaExecutionAuditEvent } {
  const writer = (async () => ({ ok: true as const, auditEventId: 'fake-audit' })) as typeof appendVionaExecutionAuditEvent;
  return { writer };
}

/** Test 1: local/dev (unset stage) + flag true -> blocked (fail-closed). */
function testLocalDevUnsetStageBlocksEvenWhenFlagTrue(): void {
  const env = { [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true', NODE_ENV: 'development' };
  assert(readVionaDeploymentStage(env) === 'unknown', 'unset VIONA_DEPLOYMENT_STAGE must resolve to unknown');
  assert(isRealProviderExecutionEnabled(env) === false, 'local dev must block real execution even when flag is true');
}

/** Test 2: explicit development stage + flag true -> blocked. */
function testExplicitDevelopmentStageBlocksEvenWhenFlagTrue(): void {
  const env = {
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'development',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
  };
  assert(readVionaDeploymentStage(env) === 'development', 'development stage must be detected');
  assert(isRealProviderExecutionEnabled(env) === false, 'development stage must block real execution');
}

/** Test 3: production deployment stage + flag true -> hard-blocked. */
function testProductionDeploymentStageHardBlocksEvenWhenFlagTrue(): void {
  const env = {
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'production',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
    NODE_ENV: 'production',
  };
  assert(isVionaProductionDeploymentStage(env) === true, 'production deployment stage must be detected');
  assert(isRealProviderExecutionEnabled(env) === false, 'production deployment stage must hard-block');
}

/** Test 4: staging stage but flag unset/false -> blocked (default stays false). */
function testStagingWithoutExplicitFlagRemainsBlocked(): void {
  const envUnset = { [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging' };
  const envFalse = { [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging', [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'false' };
  assert(isVionaStagingDeploymentStage(envUnset) === true, 'staging must be detected');
  assert(isRealProviderExecutionEnabled(envUnset) === false, 'staging without flag must remain blocked');
  assert(isRealProviderExecutionEnabled(envFalse) === false, 'staging with flag=false must remain blocked');
}

/** Test 5: staging + flag true -> allowed (the intended unlock path). */
function testStagingWithExplicitFlagAllowsRealExecutionGate(): void {
  const env = {
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
  };
  assert(isRealProviderExecutionEnabled(env) === true, 'staging + explicit flag=true must allow the real-execution gate');
}

/** Test 6 (CRITICAL): Fly staging pattern — NODE_ENV=production + VIONA_DEPLOYMENT_STAGE=staging + flag true -> allowed. */
function testFlyStagingNodeEnvProductionTrapIsFixed(): void {
  const flyStagingEnv = {
    NODE_ENV: 'production',
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
  };
  assert(isProductionEnvironment(flyStagingEnv) === true, 'Fly staging still runs NODE_ENV=production');
  assert(
    isRealProviderExecutionEnabled(flyStagingEnv) === true,
    'NODE_ENV=production must NOT block when VIONA_DEPLOYMENT_STAGE=staging and flag=true',
  );
}

/** Test 7: OpenAI real-execution flag stays locked unless staging + explicit true. */
function testOpenAiFlagRemainsStagingGatedAndDefaultOff(): void {
  assert(isOpenAiRealExecutionEnabled({}) === false, 'OpenAI flag default-off on empty env');
  assert(
    isOpenAiRealExecutionEnabled({ [VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG]: 'true' }) === false,
    'OpenAI flag true without staging stage must remain blocked',
  );
  assert(
    isOpenAiRealExecutionEnabled({
      [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging',
      [VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG]: 'true',
    }) === true,
    'OpenAI flag may only pass on staging with explicit true (adapter still unwired)',
  );
  assert(
    isOpenAiRealExecutionEnabled({
      [VIONA_DEPLOYMENT_STAGE_ENV]: 'production',
      [VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG]: 'true',
    }) === false,
    'OpenAI flag must hard-block on production deployment stage',
  );
}

/** Test 8: staging + flag true but circuit breaker open -> blocked before transport (Zero-Loss guard). */
async function testStagingAllowedGateStillRequiresClosedCircuitBreaker(): Promise<void> {
  const stagingEnv = {
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
    NODE_ENV: 'production',
  };
  assert(isRealProviderExecutionEnabled(stagingEnv) === true, 'precondition: staging gate must be open');

  const { transport, callCount } = createSpyTransport(async () => {
    throw new Error('transport must never be called when the circuit breaker is open');
  });
  const { writer } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => isRealProviderExecutionEnabled(stagingEnv),
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: () => Promise.resolve(),
    circuitBreakerCheck: async () => ({ state: 'open' }),
  });

  assert(result.outcome.outcome === 'blockedOperator', 'breaker open must block even when staging gate is open');
  assert(
    result.outcome.outcome === 'blockedOperator' && result.outcome.reason === 'circuit_breaker_open_daily_cap_exceeded',
    'expected circuit_breaker_open_daily_cap_exceeded',
  );
  assert(callCount() === 0, 'zero transport calls when breaker is open');
}

/** Test 9: staging + flag true + closed breaker -> transport may proceed (happy path through full gate chain). */
async function testStagingFullGateChainAllowsTransportWhenBreakerClosed(): Promise<void> {
  const stagingEnv = {
    [VIONA_DEPLOYMENT_STAGE_ENV]: 'staging',
    [VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG]: 'true',
    NODE_ENV: 'production',
  };

  const { transport, callCount } = createSpyTransport(async () => ({
    status: 201,
    json: { sid: 'SMfakepack30d70000000000000000001' },
  }));
  const { writer } = createFakeAuditWriter();

  const result = await executeVionaTwilioTestPocReal(BASE_INPUT, {
    isEnabled: () => isRealProviderExecutionEnabled(stagingEnv),
    credentials: { accountSid: 'ACtest_fake_sid', authToken: 'test_fake_token' },
    transport,
    auditWriter: writer,
    sleepMs: () => Promise.resolve(),
    circuitBreakerCheck: async () => ({ state: 'closed' }),
  });

  assert(result.outcome.outcome === 'succeeded', `expected succeeded through full gate chain, got ${result.outcome.outcome}`);
  assert(callCount() === 1, 'exactly one transport call expected when staging gate and breaker both allow');
}

async function main(): Promise<void> {
  testLocalDevUnsetStageBlocksEvenWhenFlagTrue();
  testExplicitDevelopmentStageBlocksEvenWhenFlagTrue();
  testProductionDeploymentStageHardBlocksEvenWhenFlagTrue();
  testStagingWithoutExplicitFlagRemainsBlocked();
  testStagingWithExplicitFlagAllowsRealExecutionGate();
  testFlyStagingNodeEnvProductionTrapIsFixed();
  testOpenAiFlagRemainsStagingGatedAndDefaultOff();
  await testStagingAllowedGateStillRequiresClosedCircuitBreaker();
  await testStagingFullGateChainAllowsTransportWhenBreakerClosed();
  console.log('PASS Pack30D-7 staging deployment-stage gating tests (9/9)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
