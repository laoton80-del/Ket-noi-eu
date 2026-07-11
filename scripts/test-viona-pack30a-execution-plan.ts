/**
 * Pack30A — mock-only execution plan + mock adapter pure tests (no DB, no network, no side effects).
 *
 * Covers the required test plan from
 * docs/product/VIONA_REQUEST_PACK30_CONTROLLED_REAL_EXECUTION_IMPLEMENTATION_PLAN_PACKET.md (section 10):
 *   1. Policy denies unsafe status
 *   2. Policy denies hold/safety label
 *   3. Policy denies missing operator approval
 *   4. Policy denies missing user consent
 *   5. Mock adapter does not call external provider
 *   6. Idempotency placeholder/replay does not duplicate work
 *   7. Response preserves safety flags
 *   8. No status mutation
 *   9. No persistent audit write
 *  10. No request creation
 *  11. No production flag
 *
 * Run: npx tsx scripts/test-viona-pack30a-execution-plan.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  buildVionaExecutionPlan,
  deriveVionaPack30AStateAfterMockInvocation,
} from '../src/lib/viona/executionPlan/vionaExecutionPlanBuilder';
import type { VionaExecutionPlanBuildInput } from '../src/lib/viona/executionPlan/vionaExecutionPlanTypes';
import {
  createInMemoryVionaMockIdempotencyStore,
  invokeVionaMockExecutionAdapter,
} from '../src/lib/viona/mockAdapter/vionaMockExecutionAdapter';

const PACK30A_SOURCE_FILES = [
  '../src/lib/viona/executionPlan/vionaExecutionPlanTypes.ts',
  '../src/lib/viona/executionPlan/vionaExecutionPlanPolicy.ts',
  '../src/lib/viona/executionPlan/vionaExecutionPlanBuilder.ts',
  '../src/lib/viona/mockAdapter/vionaMockExecutionAdapterTypes.ts',
  '../src/lib/viona/mockAdapter/vionaMockExecutionAdapter.ts',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** Reads source with comments stripped so doc-comment mentions of forbidden terms don't false-positive. */
function readPack30ASource(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertNoneMatch(files: readonly string[], patterns: readonly RegExp[], label: string): void {
  for (const file of files) {
    const source = readPack30ASource(file);
    for (const pattern of patterns) {
      assert(!pattern.test(source), `${label}: ${file} must not match forbidden pattern ${pattern}`);
    }
  }
}

const BASE_INPUT: VionaExecutionPlanBuildInput = {
  planId: 'plan-pack30a-test',
  createdAt: '1970-01-01T00:00:00.000Z',
  requestId: 'req-pack30a-test',
  requestStatus: 'triage',
  actionId: 'request.assign',
  requestSafetyLabels: [],
  operatorApprovalGranted: true,
  userConsentGranted: true,
  idempotencyKey: null,
};

function buildPlan(overrides: Partial<VionaExecutionPlanBuildInput> = {}) {
  return buildVionaExecutionPlan({ ...BASE_INPUT, ...overrides });
}

/** Test 1: policy denies unsafe status. */
function testDeniesUnsafeStatus(): void {
  for (const status of ['draft', 'submitted', 'cancelled', 'failed']) {
    const plan = buildPlan({ requestStatus: status });
    assert(!plan.allowed, `expected denial for status ${status}`);
    assert(plan.state === 'denied', `expected denied state for status ${status}`);
    assert(plan.mockAdapterInstruction === 'do_not_invoke', `expected do_not_invoke for status ${status}`);
    assert(
      plan.denialReason === 'ineligible_status',
      `expected ineligible_status reason for status ${status}, got ${plan.denialReason}`,
    );
  }
}

/** Test 2: policy denies hold/safety label. */
function testDeniesHoldOrSafetyLabel(): void {
  const nonHoldPlan = buildPlan({ requestSafetyLabels: ['non-hold'] });
  assert(nonHoldPlan.allowed, 'non-hold label must not block execution');

  for (const label of ['hold', 'safety_hold', 'restricted']) {
    const plan = buildPlan({ requestSafetyLabels: [label] });
    assert(!plan.allowed, `expected denial for safety label ${label}`);
    assert(
      plan.denialReason === 'blocked_safety_label',
      `expected blocked_safety_label reason for ${label}, got ${plan.denialReason}`,
    );
    assert(plan.decision.matchedBlockingLabels.includes(label), `expected matched blocking label ${label}`);
  }
}

/** Test 3: policy denies missing operator approval. */
function testDeniesMissingOperatorApproval(): void {
  const plan = buildPlan({ operatorApprovalGranted: false });
  assert(!plan.allowed, 'expected denial for missing operator approval');
  assert(plan.denialReason === 'missing_operator_approval', 'expected missing_operator_approval reason');
  assert(plan.mockAdapterInstruction === 'do_not_invoke', 'must not invoke mock adapter without operator approval');
}

/** Test 4: policy denies missing user consent. */
function testDeniesMissingUserConsent(): void {
  const plan = buildPlan({ userConsentGranted: false });
  assert(!plan.allowed, 'expected denial for missing user consent');
  assert(plan.denialReason === 'missing_user_consent', 'expected missing_user_consent reason');
  assert(plan.mockAdapterInstruction === 'do_not_invoke', 'must not invoke mock adapter without user consent');
}

/** Test 5: mock adapter does not call external provider. */
function testMockAdapterDoesNotCallExternalProvider(): void {
  const plan = buildPlan();
  assert(plan.allowed, 'baseline plan must be allowed for this test');

  const result = invokeVionaMockExecutionAdapter({ plan, invokedAt: '1970-01-01T00:00:00.000Z' });
  assert(result.invoked === true, 'mock adapter should invoke for an allowed plan');
  assert(result.safety.providerCalled === false, 'providerCalled must be false');
  assert(result.safety.mockOnly === true, 'mockOnly must be true');
  assert(result.safety.externalExecutionBlocked === true, 'externalExecutionBlocked must be true');

  assertNoneMatch(
    ['../src/lib/viona/mockAdapter/vionaMockExecutionAdapter.ts'],
    [/\bfetch\s*\(/, /axios/i, /node-fetch/i, /\bhttp\.request/i, /\bhttps\.request/i, /XMLHttpRequest/i],
    'mock adapter must not import/call network primitives',
  );
}

/** Test 6: idempotency placeholder/replay does not duplicate work. */
function testIdempotencyReplayDoesNotDuplicateWork(): void {
  const store = createInMemoryVionaMockIdempotencyStore();
  const plan = buildPlan({ idempotencyKey: 'idem-key-pack30a-test' });

  const first = invokeVionaMockExecutionAdapter({ plan, invokedAt: '1970-01-01T00:00:00.000Z' }, store);
  assert(first.replay === false, 'first invocation must not be a replay');

  const second = invokeVionaMockExecutionAdapter({ plan, invokedAt: '1970-01-01T00:00:01.000Z' }, store);
  assert(second.replay === true, 'second invocation with the same idempotency key must be a replay');
  assert(
    second.mockExecutionId === first.mockExecutionId,
    'replay must return the same mock execution id — no duplicate work',
  );

  const withoutStore = invokeVionaMockExecutionAdapter({ plan, invokedAt: '1970-01-01T00:00:02.000Z' });
  assert(withoutStore.replay === false, 'invocation without a store must not claim to be a replay');
}

/** Test 7: response preserves safety flags. */
function testResponsePreservesSafetyFlags(): void {
  const plan = buildPlan();
  assert(plan.safety.operatorApprovalRequired === true, 'operatorApprovalRequired must be true');
  assert(plan.safety.externalExecutionBlocked === true, 'externalExecutionBlocked must be true');
  assert(plan.safety.persistentAuditWritten === false, 'persistentAuditWritten must be false');
  assert(plan.safety.stagingFirst === true, 'stagingFirst must be true');
  assert(plan.safety.notProductionReady === true, 'notProductionReady must be true');
  assert(plan.safety.dryRunNoOp === true, 'dryRunNoOp must be true');
  assert(plan.safety.executionPreviewOnly === true, 'executionPreviewOnly must be true');
  assert(plan.safety.mockOnly === true, 'mockOnly must be true');
  assert(plan.safety.requestStatusMutated === false, 'requestStatusMutated must be false');
  assert(plan.safety.requestCreated === false, 'requestCreated must be false');
  assert(plan.safety.realProviderCalled === false, 'realProviderCalled must be false');

  const result = invokeVionaMockExecutionAdapter({ plan, invokedAt: '1970-01-01T00:00:00.000Z' });
  assert(result.safety.providerCalled === false, 'adapter providerCalled must be false');
  assert(result.safety.externalExecutionBlocked === true, 'adapter externalExecutionBlocked must be true');
  assert(result.safety.notProductionReady === true, 'adapter notProductionReady must be true');
  assert(result.safety.persistentAuditWritten === false, 'adapter persistentAuditWritten must be false');
}

/** Test 8: no status mutation. */
function testNoStatusMutation(): void {
  const plan = buildPlan();
  assert(Object.isFrozen(plan), 'execution plan must be frozen (immutable)');
  assert(Object.isFrozen(plan.decision), 'decision evaluation must be frozen (immutable)');
  assert(plan.safety.requestStatusMutated === false, 'requestStatusMutated flag must be false');

  assertNoneMatch(
    PACK30A_SOURCE_FILES,
    [/\.update\s*\(/, /\.updateMany\s*\(/, /prisma\./i, /UPDATE\s+\w+\s+SET/i],
    'no status mutation',
  );
}

/** Test 9: no persistent audit write. */
function testNoPersistentAuditWrite(): void {
  const plan = buildPlan();
  assert(plan.safety.persistentAuditWritten === false, 'persistentAuditWritten must be false');

  const result = invokeVionaMockExecutionAdapter({ plan, invokedAt: '1970-01-01T00:00:00.000Z' });
  assert(result.safety.persistentAuditWritten === false, 'adapter persistentAuditWritten must be false');

  assertNoneMatch(
    PACK30A_SOURCE_FILES,
    [/PrismaClient/, /@prisma\/client/, /supabase/i, /\.insert\s*\(/i, /INSERT\s+INTO/i],
    'no persistent audit write',
  );
}

/** Test 10: no request creation. */
function testNoRequestCreation(): void {
  const plan = buildPlan();
  assert(plan.safety.requestCreated === false, 'requestCreated flag must be false');

  assertNoneMatch(
    PACK30A_SOURCE_FILES,
    [/vionaRequestCreateService/, /vionaRequestCreateDto/, /\.create\s*\(/],
    'no request creation',
  );
}

/** Test 11: no production flag. */
function testNoProductionFlag(): void {
  const allowedPlan = buildPlan();
  assert(allowedPlan.safety.notProductionReady === true, 'notProductionReady must remain true when allowed');

  const deniedPlan = buildPlan({ operatorApprovalGranted: false });
  assert(deniedPlan.safety.notProductionReady === true, 'notProductionReady must remain true when denied');
}

/** Extra: state machine transitions remain in-memory / mock-only. */
function testStateMachineTransitions(): void {
  const allowedPlan = buildPlan();
  assert(allowedPlan.state === 'mock_ready', 'allowed plan must start in mock_ready state');

  const afterInvocation = deriveVionaPack30AStateAfterMockInvocation(allowedPlan, true);
  assert(afterInvocation === 'mock_executed_no_op', 'expected mock_executed_no_op after mock invocation');

  const deniedPlan = buildPlan({ operatorApprovalGranted: false });
  assert(deniedPlan.state === 'denied', 'denied plan must be in denied state');

  const deniedAfterAttempt = deriveVionaPack30AStateAfterMockInvocation(deniedPlan, false);
  assert(deniedAfterAttempt === 'denied', 'denied plan must never transition away from denied');
}

/** Extra: unsupported action and invalid input remain safely denied. */
function testUnsupportedActionAndInvalidInput(): void {
  const unsupported = buildPlan({ actionId: 'payment.intent' });
  assert(!unsupported.allowed, 'unsupported action must be denied');
  assert(unsupported.denialReason === 'unsupported_action', 'expected unsupported_action reason');

  const invalid = buildPlan({ requestId: '   ' });
  assert(!invalid.allowed, 'blank requestId must be denied');
  assert(invalid.denialReason === 'invalid_input', 'expected invalid_input reason');
}

function main(): void {
  testDeniesUnsafeStatus();
  testDeniesHoldOrSafetyLabel();
  testDeniesMissingOperatorApproval();
  testDeniesMissingUserConsent();
  testMockAdapterDoesNotCallExternalProvider();
  testIdempotencyReplayDoesNotDuplicateWork();
  testResponsePreservesSafetyFlags();
  testNoStatusMutation();
  testNoPersistentAuditWrite();
  testNoRequestCreation();
  testNoProductionFlag();
  testStateMachineTransitions();
  testUnsupportedActionAndInvalidInput();
  console.log('PASS Pack30A mock-only execution plan + mock adapter tests (13/13)');
}

main();
