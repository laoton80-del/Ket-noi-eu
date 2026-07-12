/**
 * Pack32 — Agentic Autonomous Dispatcher tests (Intent Router + Tool Registry + orchestrator),
 * no real LLM call, no real DB, no real Twilio call.
 *
 * Covers the required test plan from docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md §6,
 * adapted to this repo's existing `tsx` + `assert`-based testing pattern (mirrors
 * `scripts/test-viona-pack31-financial-escrow.ts`). Every test injects a **fake** `callLlm`
 * (never calling OpenAI) and, for the orchestrator tests, a **fake** `routeExecutor` standing in
 * for the existing, unmodified `previewVionaExecutionPlanRealProviderPocRoute()` (Pack30D-4 +
 * Pack31 already have their own dedicated test coverage for that function's internals — this
 * script tests only the new Pack32 orchestration boundary around it).
 *
 * Test list (13 runnable here; cases 14–15 are run separately, see bottom of file):
 *   1.  Happy path: valid tool + valid input + confidence >= 0.6           -> ok:true
 *   2.  operatorApprovalGranted:false is forwarded unmodified, never overridden to true (HITL)
 *   3.  Hallucinated/unregistered toolName                                 -> unknown_tool, hallucination-blocked audit
 *   4.  toolInputRaw missing a required field                              -> tool_input_schema_invalid
 *   5.  LLM response is not valid JSON                                    -> response_not_valid_json
 *   6.  Valid shape but confidence below threshold                         -> low_confidence
 *   7.  Injected callLlm throws                                            -> llm_call_failed, never throws out
 *   8.  Full happy path via fake routeExecutor                             -> dispatch accepted, route passed through unchanged
 *   9.  Fake routeExecutor simulates insufficient-funds hold failure       -> passthrough unchanged, zero extra calls
 *   10. Fake routeExecutor simulates Twilio failure + full refund          -> passthrough unchanged
 *   11. Source-scan: no LangChain/LlamaIndex/agent-framework import
 *   12. Source-scan: package.json has no new agent-framework dependency
 *   13. Source-scan: dispatcher files never literally assign operatorApprovalGranted:true / userConsentGranted:true
 *   14. Existing Pack25/29/30A/30B/30D-1..4/31/Pack32 regression scripts — run separately, see below
 *   15. `tsc --noEmit` / `npm run lint` — run separately via those npm scripts
 *
 * Run: npx tsx scripts/test-viona-pack32-autonomous-dispatcher.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  routeVionaDispatchIntent,
  type VionaDispatchIntentInput,
} from '../src/lib/viona/dispatcher/vionaIntentRouter';
import {
  findVionaToolRegistryEntry,
  assertVionaToolRegistryLinkedActionIdsAreKnown,
} from '../src/lib/viona/dispatcher/vionaToolRegistry';
import {
  dispatchVionaAutonomousRequest,
  type DispatchVionaAutonomousRequestInput,
} from '../src/services/viona/vionaAutonomousDispatchService';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';
import type { PreviewVionaExecutionPlanRealProviderPocResult } from '../src/services/viona/vionaExecutionPlanRouteService';

const PACK32_TOUCHED_FILES = [
  '../src/lib/viona/dispatcher/vionaToolRegistry.ts',
  '../src/lib/viona/dispatcher/vionaIntentRouter.ts',
  '../src/services/viona/vionaAutonomousDispatchService.ts',
] as const;

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

// ---------------------------------------------------------------------------
// Fakes — no real LLM call, no real DB, no real network call.
// ---------------------------------------------------------------------------

const BASE_INTENT_INPUT: VionaDispatchIntentInput = {
  requestId: 'req-pack32-1',
  requestStatus: 'triage',
  userMessage: 'Please send a test SMS to confirm the request.',
};

function jsonLlm(shape: Readonly<Record<string, unknown>>): (prompt: string) => Promise<string> {
  return async () => JSON.stringify(shape);
}

const VALID_TOOL_INPUT = { fromNumber: '+15005550006', toNumber: '+15005550006', body: 'hello' };

type FakeAuditRow = Readonly<{ eventType: string; payloadJson: unknown }>;

function createFakeAuditWriter(): { writer: typeof appendVionaExecutionAuditEvent; rows: FakeAuditRow[] } {
  const rows: FakeAuditRow[] = [];
  const writer = (async (input: { requestId: string; eventType: string; payloadJson?: unknown }) => {
    rows.push({ eventType: input.eventType, payloadJson: input.payloadJson });
    return { ok: true as const, auditEventId: `fake-audit-${rows.length}` };
  }) as typeof appendVionaExecutionAuditEvent;
  return { writer, rows };
}

function fakeRouteExecutorSpy(
  result: PreviewVionaExecutionPlanRealProviderPocResult,
): { executor: () => Promise<PreviewVionaExecutionPlanRealProviderPocResult>; calls: unknown[] } {
  const calls: unknown[] = [];
  const executor = async (input: unknown): Promise<PreviewVionaExecutionPlanRealProviderPocResult> => {
    calls.push(input);
    return result;
  };
  return { executor: executor as any, calls };
}

const BASE_DISPATCH_INPUT: DispatchVionaAutonomousRequestInput = {
  authUserId: 'user-pack32-1',
  requestId: 'req-pack32-1',
  requestStatus: 'triage',
  userMessage: 'Please send a test SMS to confirm the request.',
  operatorApprovalGranted: true,
  userConsentGranted: true,
};

/** Test 1: happy path — valid tool + valid input + confidence >= threshold -> ok:true. */
async function testHappyPathValidToolAcceptsAndValidates(): Promise<void> {
  const decision = await routeVionaDispatchIntent(BASE_INTENT_INPUT, {
    callLlm: jsonLlm({
      toolName: 'twilio_test_sms_poc',
      toolInputRaw: VALID_TOOL_INPUT,
      confidence: 0.95,
      rationale: 'User explicitly asked for an SMS.',
    }),
  });

  assert(decision.ok, 'a valid, high-confidence, schema-valid tool call must be accepted');
  assert(decision.ok && decision.toolName === 'twilio_test_sms_poc', 'toolName must be passed through unchanged');
  assert(
    decision.ok && findVionaToolRegistryEntry(decision.toolName) != null,
    'the accepted toolName must always resolve against the registry',
  );
}

/** Test 2: operatorApprovalGranted:false is forwarded unmodified — the dispatcher never self-grants HITL consent. */
async function testOrchestratorNeverOverridesHumanApprovalFlags(): Promise<void> {
  const fakeResult: PreviewVionaExecutionPlanRealProviderPocResult = {
    ok: true,
    requestId: 'req-pack32-1',
    actionId: 'live_ai.action',
    planAllowed: false,
    denialReason: 'missing_operator_approval',
    escrow: { attempted: false },
    realProviderResult: null,
  };
  const spy = fakeRouteExecutorSpy(fakeResult);
  const { writer } = createFakeAuditWriter();

  const result = await dispatchVionaAutonomousRequest(
    { ...BASE_DISPATCH_INPUT, operatorApprovalGranted: false, userConsentGranted: false },
    {
      callLlm: jsonLlm({
        toolName: 'twilio_test_sms_poc',
        toolInputRaw: VALID_TOOL_INPUT,
        confidence: 0.9,
        rationale: 'ok',
      }),
      auditWriter: writer,
      routeExecutor: spy.executor,
    },
  );

  assert(result.ok && result.dispatch.accepted === true, 'a valid, registered tool call must still be accepted by the dispatcher itself');
  assert(spy.calls.length === 1, 'the existing route pipeline must still be invoked exactly once');
  const forwarded = spy.calls[0] as { operatorApprovalGranted: boolean; userConsentGranted: boolean };
  assert(forwarded.operatorApprovalGranted === false, 'operatorApprovalGranted must be forwarded exactly as the human supplied it — never overridden to true');
  assert(forwarded.userConsentGranted === false, 'userConsentGranted must be forwarded exactly as the human supplied it — never overridden to true');
}

/** Test 3: hallucinated/unregistered toolName -> unknown_tool, zero downstream calls, hallucination-blocked audit. */
async function testHallucinatedToolNameIsBlocked(): Promise<void> {
  const decision = await routeVionaDispatchIntent(BASE_INTENT_INPUT, {
    callLlm: jsonLlm({
      toolName: 'send_real_stripe_charge',
      toolInputRaw: {},
      confidence: 0.99,
      rationale: 'invented',
    }),
  });
  assert(!decision.ok && decision.reason === 'unknown_tool', 'an unregistered tool name must be rejected as unknown_tool, never fuzzy-matched');

  const spy = fakeRouteExecutorSpy({ ok: false, reason: 'invalid_input' });
  const { writer, rows } = createFakeAuditWriter();
  const result = await dispatchVionaAutonomousRequest(BASE_DISPATCH_INPUT, {
    callLlm: jsonLlm({ toolName: 'send_real_stripe_charge', toolInputRaw: {}, confidence: 0.99, rationale: 'invented' }),
    auditWriter: writer,
    routeExecutor: spy.executor,
  });

  assert(result.ok && result.dispatch.accepted === false && result.dispatch.reason === 'unknown_tool', 'the orchestrator must surface unknown_tool, never guess a fallback tool');
  assert(spy.calls.length === 0, 'zero downstream Pack31/Pack30D calls must be made for a hallucinated tool');
  assert(rows.some((r) => r.eventType === 'dispatcherHallucinationBlocked'), 'a dispatcherHallucinationBlocked audit row must be written');
}

/** Test 4: toolInputRaw missing a required field -> tool_input_schema_invalid, zero downstream calls. */
async function testMissingRequiredFieldIsBlocked(): Promise<void> {
  const decision = await routeVionaDispatchIntent(BASE_INTENT_INPUT, {
    callLlm: jsonLlm({
      toolName: 'twilio_test_sms_poc',
      toolInputRaw: { fromNumber: '+15005550006', toNumber: '+15005550006' }, // missing "body"
      confidence: 0.9,
      rationale: 'ok',
    }),
  });
  assert(!decision.ok && decision.reason === 'tool_input_schema_invalid', 'a missing required field must be rejected as tool_input_schema_invalid');
}

/** Test 5: LLM response is not valid JSON -> response_not_valid_json, never throws. */
async function testMalformedJsonResponseIsBlocked(): Promise<void> {
  const decision = await routeVionaDispatchIntent(BASE_INTENT_INPUT, {
    callLlm: async () => 'Sure! Here is the tool: {"toolName": "twilio_test_sms_poc"', // truncated / prose-wrapped
  });
  assert(!decision.ok && decision.reason === 'response_not_valid_json', 'malformed JSON must be rejected as response_not_valid_json, never partially parsed');
}

/** Test 6: valid shape but confidence below the threshold -> low_confidence. */
async function testLowConfidenceIsBlocked(): Promise<void> {
  const decision = await routeVionaDispatchIntent(BASE_INTENT_INPUT, {
    callLlm: jsonLlm({ toolName: 'twilio_test_sms_poc', toolInputRaw: VALID_TOOL_INPUT, confidence: 0.2, rationale: 'unsure' }),
  });
  assert(!decision.ok && decision.reason === 'low_confidence', 'confidence below the threshold must be rejected as low_confidence, never acted on anyway');
}

/** Test 7: injected callLlm throws -> llm_call_failed, routeVionaDispatchIntent never throws out. */
async function testLlmCallFailureNeverThrowsOut(): Promise<void> {
  let threw = false;
  let decision;
  try {
    decision = await routeVionaDispatchIntent(BASE_INTENT_INPUT, {
      callLlm: async () => {
        throw new Error('simulated network/API error');
      },
    });
  } catch {
    threw = true;
  }
  assert(!threw, 'routeVionaDispatchIntent must convert an injected callLlm failure into a typed result, never rethrow');
  assert(decision != null && !decision.ok && decision.reason === 'llm_call_failed', 'an injected callLlm failure must resolve to llm_call_failed');
}

/** Test 8: full happy path via a fake routeExecutor — dispatch accepted, route result passed through unchanged. */
async function testFullHappyPathPassesThroughRouteResultUnchanged(): Promise<void> {
  const fakeResult: PreviewVionaExecutionPlanRealProviderPocResult = {
    ok: true,
    requestId: 'req-pack32-1',
    actionId: 'live_ai.action',
    planAllowed: true,
    denialReason: 'not_denied',
    escrow: {
      attempted: true,
      holdOk: true,
      holdId: 'hold-1',
      heldAmountVIO: 0.01,
      resolvedStatus: 'SETTLED',
      settledAmountVIO: 0.01,
      refundedAmountVIO: 0,
    },
    realProviderResult: {
      requestId: 'req-pack32-1',
      actionId: 'live_ai.action',
      outcome: { outcome: 'succeeded', providerMessageSid: 'SMfake', attempts: 1, latencyMs: 12 },
      auditWritten: true,
    },
  };
  const spy = fakeRouteExecutorSpy(fakeResult);
  const { writer, rows } = createFakeAuditWriter();

  const result = await dispatchVionaAutonomousRequest(BASE_DISPATCH_INPUT, {
    callLlm: jsonLlm({ toolName: 'twilio_test_sms_poc', toolInputRaw: VALID_TOOL_INPUT, confidence: 0.95, rationale: 'ok' }),
    auditWriter: writer,
    routeExecutor: spy.executor,
  });

  assert(result.ok && result.dispatch.accepted === true, 'a valid dispatch must be accepted');
  assert(result.ok && result.dispatch.accepted === true && result.route === fakeResult, 'the existing pipeline result must be returned byte-for-byte unchanged, never re-wrapped or mutated');
  assert(rows.some((r) => r.eventType === 'dispatcherToolSelected'), 'a dispatcherToolSelected audit row must be written before the downstream call');
  assert(spy.calls.length === 1, 'the existing pipeline must be invoked exactly once');
}

/** Test 9: fake routeExecutor simulates an insufficient-funds hold failure -> passthrough unchanged. */
async function testInsufficientFundsPassthroughUnchanged(): Promise<void> {
  const fakeResult: PreviewVionaExecutionPlanRealProviderPocResult = {
    ok: true,
    requestId: 'req-pack32-1',
    actionId: 'live_ai.action',
    planAllowed: true,
    denialReason: 'not_denied',
    escrow: { attempted: true, holdOk: false, reason: 'insufficient_funds' },
    realProviderResult: null,
  };
  const spy = fakeRouteExecutorSpy(fakeResult);
  const { writer } = createFakeAuditWriter();

  const result = await dispatchVionaAutonomousRequest(BASE_DISPATCH_INPUT, {
    callLlm: jsonLlm({ toolName: 'twilio_test_sms_poc', toolInputRaw: VALID_TOOL_INPUT, confidence: 0.95, rationale: 'ok' }),
    auditWriter: writer,
    routeExecutor: spy.executor,
  });

  assert(result.ok && result.dispatch.accepted === true && result.route === fakeResult, 'an insufficient-funds hold failure from the existing pipeline must be surfaced unchanged, never retried or bypassed');
  assert(spy.calls.length === 1, 'the dispatcher must never call the existing pipeline more than once per dispatch');
}

/** Test 10: fake routeExecutor simulates a Twilio failure + full refund -> passthrough unchanged. */
async function testTwilioFailureRefundPassthroughUnchanged(): Promise<void> {
  const fakeResult: PreviewVionaExecutionPlanRealProviderPocResult = {
    ok: true,
    requestId: 'req-pack32-1',
    actionId: 'live_ai.action',
    planAllowed: true,
    denialReason: 'not_denied',
    escrow: {
      attempted: true,
      holdOk: true,
      holdId: 'hold-2',
      heldAmountVIO: 0.01,
      resolvedStatus: 'REFUNDED',
      settledAmountVIO: 0,
      refundedAmountVIO: 0.01,
    },
    realProviderResult: {
      requestId: 'req-pack32-1',
      actionId: 'live_ai.action',
      outcome: { outcome: 'failedBounded', errorClass: 'provider_unavailable', providerErrorCode: null, attempts: 2, latencyMs: 900 },
      auditWritten: true,
    },
  };
  const spy = fakeRouteExecutorSpy(fakeResult);
  const { writer } = createFakeAuditWriter();

  const result = await dispatchVionaAutonomousRequest(BASE_DISPATCH_INPUT, {
    callLlm: jsonLlm({ toolName: 'twilio_test_sms_poc', toolInputRaw: VALID_TOOL_INPUT, confidence: 0.95, rationale: 'ok' }),
    auditWriter: writer,
    routeExecutor: spy.executor,
  });

  assert(result.ok && result.dispatch.accepted === true && result.route === fakeResult, 'a provider failure + refund outcome must be surfaced unchanged');
}

/** Test 11: source-scan — no LangChain/LlamaIndex/agent-framework import in any new Pack32 file. */
function testNoAgentFrameworkImportInNewFiles(): void {
  assertNoneMatch(
    PACK32_TOUCHED_FILES,
    [/langchain/i, /llamaindex/i, /llama-index/i, /\bautogen\b/i, /crewai/i],
    'Pack32 files must never import a LangChain/LlamaIndex/agent-framework dependency',
  );
}

/** Test 12: source-scan — package.json has no new agent-framework dependency. */
function testPackageJsonHasNoNewAgentFrameworkDependency(): void {
  const pkgRaw = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8');
  for (const pattern of [/langchain/i, /llamaindex/i, /llama-index/i, /\bautogen\b/i, /crewai/i]) {
    assert(!pattern.test(pkgRaw), `package.json must not reference a forbidden agent-framework dependency (${pattern})`);
  }
}

/** Test 13: source-scan — dispatcher files never literally hardcode operatorApprovalGranted:true / userConsentGranted:true. */
function testDispatcherNeverHardcodesApprovalOrConsentTrue(): void {
  assertNoneMatch(
    ['../src/services/viona/vionaAutonomousDispatchService.ts'],
    [/operatorApprovalGranted\s*:\s*true\b/, /userConsentGranted\s*:\s*true\b/],
    'the dispatcher must never literally assign operatorApprovalGranted/userConsentGranted to true — both must always be forwarded from the caller-supplied human input',
  );
}

/** Sanity check for the Tool Registry's own internal integrity (not a plan-numbered test case). */
function testToolRegistryLinkedActionIdsAreKnown(): void {
  assertVionaToolRegistryLinkedActionIdsAreKnown();
}

async function main(): Promise<void> {
  await testHappyPathValidToolAcceptsAndValidates();
  await testOrchestratorNeverOverridesHumanApprovalFlags();
  await testHallucinatedToolNameIsBlocked();
  await testMissingRequiredFieldIsBlocked();
  await testMalformedJsonResponseIsBlocked();
  await testLowConfidenceIsBlocked();
  await testLlmCallFailureNeverThrowsOut();
  await testFullHappyPathPassesThroughRouteResultUnchanged();
  await testInsufficientFundsPassthroughUnchanged();
  await testTwilioFailureRefundPassthroughUnchanged();
  testNoAgentFrameworkImportInNewFiles();
  testPackageJsonHasNoNewAgentFrameworkDependency();
  testDispatcherNeverHardcodesApprovalOrConsentTrue();
  testToolRegistryLinkedActionIdsAreKnown();
  console.log('PASS Pack32 agentic autonomous dispatcher tests (13/13 runnable test-plan cases + registry integrity check)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
