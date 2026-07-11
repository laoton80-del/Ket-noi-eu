/**
 * Pack30B — execution-plan route wiring tests (mock-only, no real execution).
 *
 * Covers the required test plan from
 * docs/product/VIONA_REQUEST_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET.md
 * (section 10), to the extent testable without a live database connection:
 *   1. Unauthenticated request        -> verified by source scan (401 guard present in controller)
 *   2. Missing/invalid request id     -> verified via previewVionaExecutionPlanRoute validation
 *   3. Request not found              -> requires a live DB; explicitly OUT OF SCOPE here (see note below)
 *   4. Policy denies unsafe status
 *   5. Policy denies hold/safety label
 *   6. Policy denies missing operator approval
 *   7. Policy denies missing user consent
 *   8. Eligible + mock invocation requested   -> 200, providerCalled: false
 *   9. Eligible + no mock invocation requested -> plan in mock_ready state, adapter not invoked
 *  10. Idempotency replay within same process  -> no duplicate work
 *  11. Response safety-flag presence on every response, including denials
 *  12. No status mutation            -> source scan
 *  13. No persistent audit write     -> source scan
 *  14. No request creation           -> source scan
 *  15. No real provider call         -> source scan
 *  16. tsc --noEmit PASS             -> run separately (see package/CI, not this script)
 *
 * Note on DB scope: `previewVionaExecutionPlanRoute` calls the existing, unmodified, read-only
 * `getVionaRequestById` helper after input validation passes. Exercising that live DB path is
 * explicitly deferred (same boundary Pack29's own test-viona-pack29-execution-gate.ts drew) —
 * this script instead fully unit-tests the DB-free core wiring logic via the exported
 * `buildVionaExecutionPlanPreviewAction` helper, and the input-validation short-circuits of
 * `previewVionaExecutionPlanRoute` that return before any DB call.
 *
 * Run: npx tsx scripts/test-viona-pack30b-execution-plan-route.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  buildVionaExecutionPlanPreviewAction,
  previewVionaExecutionPlanRoute,
} from '../src/services/viona/vionaExecutionPlanRouteService';
import type { BuildVionaExecutionPlanPreviewActionInput } from '../src/services/viona/vionaExecutionPlanRouteService';
import { VIONA_EXECUTION_PLAN_ROUTE_SAFETY } from '../src/services/viona/vionaExecutionPlanRouteDto';
import { VIONA_PACK30A_EXECUTION_PLAN_SAFETY } from '../src/lib/viona/executionPlan/vionaExecutionPlanTypes';
import { VIONA_MOCK_ADAPTER_SAFETY } from '../src/lib/viona/mockAdapter/vionaMockExecutionAdapterTypes';

const PACK30B_NEW_PURE_FILES = [
  '../src/services/viona/vionaExecutionPlanRouteDto.ts',
  '../src/services/viona/vionaExecutionPlanRouteService.ts',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** Reads source with comments stripped so doc-comment mentions of forbidden terms don't false-positive. */
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

/** Extracts one exported controller action's source block (up to the next doc-comment/export). */
function extractControllerActionSource(functionName: string): string {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/controllers/VionaRequestController.ts'),
    'utf8',
  );
  const startIdx = source.indexOf(`export async function ${functionName}`);
  assert(startIdx !== -1, `controller function ${functionName} must exist`);
  const rest = source.slice(startIdx + functionName.length);
  const nextDocIdx = rest.indexOf('\n/**');
  const nextExportIdx = rest.indexOf('\nexport ');
  let endIdx = rest.length;
  if (nextDocIdx !== -1) endIdx = Math.min(endIdx, nextDocIdx);
  if (nextExportIdx !== -1) endIdx = Math.min(endIdx, nextExportIdx);
  return rest.slice(0, endIdx);
}

function extractRoutesBlock(routePath: string): string {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/routes/vionaRoutes.ts'), 'utf8');
  const pathIdx = source.indexOf(routePath);
  assert(pathIdx !== -1, `route ${routePath} must be registered`);
  const startIdx = source.lastIndexOf('vionaRouter.', pathIdx);
  assert(startIdx !== -1, `route registration for ${routePath} must start with vionaRouter.`);
  const rest = source.slice(startIdx);
  const endIdx = rest.indexOf('});');
  assert(endIdx !== -1, `route registration block for ${routePath} must close`);
  return rest.slice(0, endIdx + '});'.length);
}

const BASE_ACTION_INPUT: BuildVionaExecutionPlanPreviewActionInput = {
  requestId: 'req-pack30b-test',
  requestStatus: 'triage',
  actionId: 'request.assign',
  requestSafetyLabels: [],
  operatorApprovalGranted: true,
  userConsentGranted: true,
  idempotencyKey: null,
  clientCorrelationId: 'corr-pack30b-test',
  invokeMockAdapter: false,
};

function buildAction(overrides: Partial<BuildVionaExecutionPlanPreviewActionInput> = {}) {
  return buildVionaExecutionPlanPreviewAction({ ...BASE_ACTION_INPUT, ...overrides });
}

/** Test 1: unauthenticated request is rejected — verified via source scan of the controller guard. */
function testUnauthenticatedGuardPresentInController(): void {
  const block = extractControllerActionSource('postVionaRequestExecutionPlanPreviewAction');
  assert(/readAuthUserId\s*\(\s*req\s*\)/.test(block), 'controller action must check readAuthUserId(req)');
  assert(/jsonFail\(res,\s*'Unauthorized',\s*401\)/.test(block), 'controller action must reject with 401 Unauthorized');
}

/** Test 2: missing/invalid request id (and other invalid input) rejected before any DB call. */
async function testInvalidInputRejectedBeforeDbCall(): Promise<void> {
  const emptyAuth = await previewVionaExecutionPlanRoute({ authUserId: '   ', requestId: 'req-1' });
  assert(!emptyAuth.ok && emptyAuth.reason === 'invalid_input', 'blank authUserId must be invalid_input');

  const emptyRequestId = await previewVionaExecutionPlanRoute({ authUserId: 'user-1', requestId: '   ' });
  assert(!emptyRequestId.ok && emptyRequestId.reason === 'invalid_input', 'blank requestId must be invalid_input');

  const badIdempotency = await previewVionaExecutionPlanRoute({
    authUserId: 'user-1',
    requestId: 'req-1',
    idempotencyKey: 'x'.repeat(129),
  });
  assert(!badIdempotency.ok && badIdempotency.reason === 'invalid_input', 'over-long idempotencyKey must be invalid_input');

  const badCorrelation = await previewVionaExecutionPlanRoute({
    authUserId: 'user-1',
    requestId: 'req-1',
    clientCorrelationId: 'x'.repeat(129),
  });
  assert(!badCorrelation.ok && badCorrelation.reason === 'invalid_input', 'over-long clientCorrelationId must be invalid_input');

  const blankActionId = await previewVionaExecutionPlanRoute({
    authUserId: 'user-1',
    requestId: 'req-1',
    actionId: '   ',
  });
  assert(!blankActionId.ok && blankActionId.reason === 'invalid_input', 'blank actionId must be invalid_input');
}

/** Test 3 (out of scope note): request-not-found requires a live DB; not exercised in this script. */
function testRequestNotFoundOutOfScopeDocumented(): void {
  // Intentionally no DB call here. See file header note — Pack30C staging QA covers this path.
  assert(true, 'documented boundary — no assertion needed');
}

/** Test 4: policy denies unsafe status (reused verbatim from Pack30A). */
function testPolicyDeniesUnsafeStatus(): void {
  for (const status of ['draft', 'submitted', 'cancelled', 'failed']) {
    const action = buildAction({ requestStatus: status });
    assert(!action.plan.allowed, `expected denial for status ${status}`);
    assert(action.denialReason === 'ineligible_status', `expected ineligible_status for ${status}`);
    assert(action.mockAdapterCalled === false, 'mock adapter must not be called when invokeMockAdapter is false');
  }
}

/** Test 5: policy denies hold/safety label. */
function testPolicyDeniesHoldOrSafetyLabel(): void {
  for (const label of ['hold', 'safety_hold', 'restricted']) {
    const action = buildAction({ requestSafetyLabels: [label] });
    assert(!action.plan.allowed, `expected denial for safety label ${label}`);
    assert(action.denialReason === 'blocked_safety_label', `expected blocked_safety_label for ${label}`);
  }

  const nonHold = buildAction({ requestSafetyLabels: ['non-hold'] });
  assert(nonHold.plan.allowed, 'non-hold label must not block execution');
}

/** Test 6: policy denies missing operator approval. */
function testPolicyDeniesMissingOperatorApproval(): void {
  const action = buildAction({ operatorApprovalGranted: false });
  assert(!action.plan.allowed, 'expected denial for missing operator approval');
  assert(action.denialReason === 'missing_operator_approval', 'expected missing_operator_approval reason');
}

/** Test 7: policy denies missing user consent. */
function testPolicyDeniesMissingUserConsent(): void {
  const action = buildAction({ userConsentGranted: false });
  assert(!action.plan.allowed, 'expected denial for missing user consent');
  assert(action.denialReason === 'missing_user_consent', 'expected missing_user_consent reason');
}

/** Test 8: eligible + mock invocation requested -> mock-only result, providerCalled: false. */
function testEligibleWithMockInvocationRequested(): void {
  const action = buildAction({ invokeMockAdapter: true });
  assert(action.plan.allowed, 'baseline eligible plan must be allowed');
  assert(action.mockAdapterCalled === true, 'mock adapter must be called when invokeMockAdapter is true');
  assert(action.mockResult != null, 'mockResult must be present');
  assert(action.mockResult!.invoked === true, 'mock adapter must invoke for an allowed plan');
  assert(action.mockResult!.safety.providerCalled === false, 'providerCalled must be false');
  assert(action.mockResult!.safety.mockOnly === true, 'mockOnly must be true');
}

/** Test 9: eligible + no mock invocation requested -> plan stays mock_ready, adapter not called. */
function testEligibleWithoutMockInvocationRequested(): void {
  const action = buildAction({ invokeMockAdapter: false });
  assert(action.plan.allowed, 'baseline eligible plan must be allowed');
  assert(action.plan.state === 'mock_ready', 'plan must be in mock_ready state');
  assert(action.mockAdapterCalled === false, 'mock adapter must not be called');
  assert(action.mockResult === null, 'mockResult must be null when adapter is not called');
}

/** Test 10: idempotency replay within the same process does not duplicate work. */
function testIdempotencyReplayWithinSameProcess(): void {
  const key = `idem-pack30b-${Date.now()}`;
  const first = buildAction({ idempotencyKey: key, invokeMockAdapter: true });
  assert(first.mockResult != null && first.mockResult.replay === false, 'first invocation must not be a replay');

  const second = buildAction({ idempotencyKey: key, invokeMockAdapter: true });
  assert(second.mockResult != null && second.mockResult.replay === true, 'second invocation with same key must be a replay');
  assert(
    second.mockResult!.mockExecutionId === first.mockResult!.mockExecutionId,
    'replay must return the same mock execution id — no duplicate work',
  );
}

/** Test 11: response safety-flag presence on every response, including denials. */
function testResponseSafetyFlagPresenceOnEveryResponse(): void {
  const allowed = buildAction();
  const denied = buildAction({ operatorApprovalGranted: false });

  for (const action of [allowed, denied]) {
    assert(action.operatorApprovalRequired === true, 'operatorApprovalRequired must be true');
    assert(action.externalExecutionBlocked === true, 'externalExecutionBlocked must be true');
    assert(action.persistentAuditWritten === false, 'persistentAuditWritten must be false');
    assert(action.plan.safety.mockOnly === true, 'plan.safety.mockOnly must be true');
    assert(action.plan.safety.notProductionReady === true, 'plan.safety.notProductionReady must be true');
  }

  assert(
    VIONA_EXECUTION_PLAN_ROUTE_SAFETY.externalExecutionBlocked === true,
    'route-level safety const must keep externalExecutionBlocked true',
  );
  assert(
    VIONA_EXECUTION_PLAN_ROUTE_SAFETY.notProductionReady === true,
    'route-level safety const must keep notProductionReady true',
  );
  assert(
    VIONA_EXECUTION_PLAN_ROUTE_SAFETY.noPersistentAuditWrite === true,
    'route-level safety const must keep noPersistentAuditWrite true',
  );
}

/** Test 12: no status mutation — source scan of the new pure files + immutability check. */
function testNoStatusMutation(): void {
  const action = buildAction();
  assert(Object.isFrozen(action.plan), 'plan must remain frozen (Pack30A builder unmodified)');

  assertNoneMatch(
    PACK30B_NEW_PURE_FILES,
    [/\.update\s*\(/, /\.updateMany\s*\(/, /UPDATE\s+\w+\s+SET/i],
    'no status mutation',
  );
}

/** Test 13: no persistent audit write — source scan (read-only DB reuse only). */
function testNoPersistentAuditWrite(): void {
  assertNoneMatch(
    PACK30B_NEW_PURE_FILES,
    [/PrismaClient/, /@prisma\/client/, /supabase/i, /\.insert\s*\(/i, /INSERT\s+INTO/i, /\.create\s*\(/, /\.upsert\s*\(/],
    'no persistent audit write / no DB writes',
  );
}

/** Test 14: no request creation — source scan. */
function testNoRequestCreation(): void {
  assertNoneMatch(
    PACK30B_NEW_PURE_FILES,
    [/vionaRequestCreateService/, /vionaRequestCreateDto/, /createVionaRequest/],
    'no request creation',
  );
}

/** Test 15: no real provider call — source scan of new files + the wired controller/route blocks. */
function testNoRealProviderCall(): void {
  assertNoneMatch(
    PACK30B_NEW_PURE_FILES,
    [/\bfetch\s*\(/, /\baxios\b/i, /node-fetch/i, /\bhttp\.request/i, /\bhttps\.request/i, /XMLHttpRequest/i],
    'no real provider / network calls',
  );

  const controllerBlock = extractControllerActionSource('postVionaRequestExecutionPlanPreviewAction');
  const routesBlock = extractRoutesBlock('/requests/:id/actions/execution-plan-preview');
  for (const [label, block] of [
    ['controller action', controllerBlock],
    ['route registration', routesBlock],
  ] as const) {
    for (const pattern of [/\bfetch\s*\(/, /\baxios\b/i, /node-fetch/i, /PrismaClient/, /@prisma\/client/]) {
      assert(!pattern.test(block), `${label} must not match forbidden pattern ${pattern}`);
    }
  }
}

/** Test 16: Pack30A core logic reused verbatim, not modified — reference-equality check. */
function testPack30ACoreLogicUnmodified(): void {
  const action = buildAction();
  assert(
    action.plan.safety === VIONA_PACK30A_EXECUTION_PLAN_SAFETY,
    'plan.safety must be the exact same frozen object exported by Pack30A (no divergent copy)',
  );

  const withMock = buildAction({ invokeMockAdapter: true });
  assert(
    withMock.mockResult!.safety === VIONA_MOCK_ADAPTER_SAFETY,
    'mock result safety must be the exact same frozen object exported by Pack30A mock adapter',
  );
}

/** Extra: route is registered and wired to the correct controller action. */
function testRouteRegisteredAndWiredToController(): void {
  const routesBlock = extractRoutesBlock('/requests/:id/actions/execution-plan-preview');
  assert(
    routesBlock.includes('postVionaRequestExecutionPlanPreviewAction'),
    'route must be wired to postVionaRequestExecutionPlanPreviewAction',
  );
  assert(routesBlock.includes('.post('), 'route must be registered as POST');
}

async function main(): Promise<void> {
  testUnauthenticatedGuardPresentInController();
  await testInvalidInputRejectedBeforeDbCall();
  testRequestNotFoundOutOfScopeDocumented();
  testPolicyDeniesUnsafeStatus();
  testPolicyDeniesHoldOrSafetyLabel();
  testPolicyDeniesMissingOperatorApproval();
  testPolicyDeniesMissingUserConsent();
  testEligibleWithMockInvocationRequested();
  testEligibleWithoutMockInvocationRequested();
  testIdempotencyReplayWithinSameProcess();
  testResponseSafetyFlagPresenceOnEveryResponse();
  testNoStatusMutation();
  testNoPersistentAuditWrite();
  testNoRequestCreation();
  testNoRealProviderCall();
  testPack30ACoreLogicUnmodified();
  testRouteRegisteredAndWiredToController();
  console.log('PASS Pack30B execution-plan route wiring tests (17/17)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
