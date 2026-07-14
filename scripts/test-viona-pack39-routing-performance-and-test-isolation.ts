/**
 * Pack39 — B2B Routing Performance & Test Isolation Fixes: implementation test suite.
 *
 * Operator phrase: APPROVE_PACK39_TECH_DEBT_ERADICATION_IMPLEMENTATION (dedup fix + Layers 1-2 of
 * the test-isolation fix). Layer 3 (the optional `AIRouterService.ts` network circuit breaker) was
 * explicitly NOT authorized this implementation — see the "Layer 3 non-authorization" group below,
 * which asserts it was NOT added.
 *
 * Covers docs/product/VIONA_PACK39_TECH_DEBT_ERADICATION_PLAN.md §6. Uses stable content/structural
 * scans (no brittle `git diff origin/master` assertions — Pack34.5 lesson) plus dynamic,
 * spy-/fake-based behavioral proofs. No unit test in this file ever makes a real LLM call or a
 * real DB call.
 *
 * Run (pure tests, no DB/network):
 *   npx tsx scripts/test-viona-pack39-routing-performance-and-test-isolation.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  dispatchVionaAutonomousRequest,
  type DispatchVionaAutonomousRequestInput,
  type DispatchVionaAutonomousRequestResult,
} from '../src/services/viona/vionaAutonomousDispatchService';
import {
  postVionaWebhookMerchantAgent,
  type VionaWebhookMerchantAgentControllerDeps,
} from '../src/controllers/VionaWebhookMerchantAgentController';
import type { ResolvedVionaWebhookChannel } from '../src/services/viona/vionaWebhookChannelResolutionService';
import { buildVionaWebhookSignatureHeader } from '../src/services/viona/vionaWebhookSignatureVerificationService';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';
import { withOpenAiApiKeyDeeplyUnsetAsync } from './_testHelpers/vionaTestEnvGuard';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

let passed = 0;

function runTest(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

// ---------------------------------------------------------------------------
// Shared fakes.
// ---------------------------------------------------------------------------

type FakeAuditRow = Readonly<{ eventType: string; payloadJson: unknown }>;

function createFakeAuditWriter(): { writer: typeof appendVionaExecutionAuditEvent; rows: FakeAuditRow[] } {
  const rows: FakeAuditRow[] = [];
  const writer = (async (input: { requestId: string; eventType: string; payloadJson?: unknown }) => {
    rows.push({ eventType: input.eventType, payloadJson: input.payloadJson });
    return { ok: true as const, auditEventId: `fake-audit-${rows.length}` };
  }) as typeof appendVionaExecutionAuditEvent;
  return { writer, rows };
}

function createCallLlmSpy(response: Readonly<Record<string, unknown>>): {
  callLlm: (prompt: string) => Promise<string>;
  callCount: () => number;
} {
  let calls = 0;
  const callLlm = async (): Promise<string> => {
    calls += 1;
    return JSON.stringify(response);
  };
  return { callLlm, callCount: () => calls };
}

function createThrowIfCalledLlm(): (prompt: string) => Promise<string> {
  return async () => {
    throw new Error(
      'callLlm must never be invoked here — a precomputedIntentDecision was supplied, so dispatchVionaAutonomousRequest must not reclassify internally (Pack39 dedup fix)',
    );
  };
}

const MERCHANT_CONTEXT = { tenantId: 'tenant-pack39-a', merchantProfileId: 'mp-pack39-a' };

const BASE_DISPATCH_INPUT: DispatchVionaAutonomousRequestInput = {
  authUserId: 'user-pack39-1',
  requestId: 'req-pack39-1',
  requestStatus: 'triage',
  userMessage: 'What are your opening hours today?',
  operatorApprovalGranted: true,
  userConsentGranted: true,
};

const ACCEPTED_MERCHANT_DECISION = {
  ok: true as const,
  toolName: 'merchant_schedule_availability_check' as const,
  toolInput: { dateRangeStart: '2026-07-14', dateRangeEnd: '2026-07-14' },
  confidence: 0.85,
  rationale: 'opening hours question',
};

const REJECTED_DECISION = { ok: false as const, reason: 'low_confidence' as const };

// Matches `typeof executeMerchantReadOnlyQuery`'s own shape by contextual inference (mirroring the
// existing Pack37 test suite's own inline stubs) rather than a standalone, explicitly-typed
// function — a hand-written parameter type here would need to duplicate
// `VionaMerchantReadOnlyQueryToolName` and would drift from the real signature over time.
const stubExecuteMerchantQuery = async (input: {
  toolName: 'merchant_schedule_availability_check' | 'merchant_inventory_stock_check';
  tenantId: string;
  merchantProfileId: string;
  toolInput: Readonly<Record<string, unknown>>;
}) => ({
  toolName: input.toolName,
  dataAvailable: false as const,
  summary: 'stub',
  replyText: 'stub reply',
  detailJson: {},
});

// ---------------------------------------------------------------------------
// Group A — Classification-call deduplication (plan §4.1 / §6 items 1-4).
// ---------------------------------------------------------------------------

async function runDeduplicationTests(): Promise<void> {
  await runAsyncTest(
    'dedup: dispatchVionaAutonomousRequest given an accepted precomputedIntentDecision never calls callLlm, uses the decision verbatim',
    async () => {
      const { writer } = createFakeAuditWriter();
      const result = await dispatchVionaAutonomousRequest(
        { ...BASE_DISPATCH_INPUT, merchantContext: MERCHANT_CONTEXT, precomputedIntentDecision: ACCEPTED_MERCHANT_DECISION },
        { callLlm: createThrowIfCalledLlm(), auditWriter: writer, executeMerchantQuery: stubExecuteMerchantQuery },
      );
      assert(result.ok === true, 'dispatch call itself must not fail invalid_input');
      if (!result.ok) return;
      assert(result.dispatch.accepted === true, 'the precomputed, accepted decision must drive an accepted dispatch');
      assert(
        result.dispatch.accepted === true && result.dispatch.toolName === ACCEPTED_MERCHANT_DECISION.toolName,
        'the executed toolName must be exactly the one from the precomputed decision, never re-derived',
      );
      assert(result.route !== null && result.route.kind === 'merchantReadOnlyQuery', 'route must be produced from the precomputed decision alone');
    },
  );

  await runAsyncTest(
    'dedup: dispatchVionaAutonomousRequest given a REJECTED precomputedIntentDecision never calls callLlm, runs the existing reject-path (audit + accepted:false)',
    async () => {
      const { writer, rows } = createFakeAuditWriter();
      const result = await dispatchVionaAutonomousRequest(
        { ...BASE_DISPATCH_INPUT, precomputedIntentDecision: REJECTED_DECISION },
        { callLlm: createThrowIfCalledLlm(), auditWriter: writer },
      );
      assert(result.ok === true, 'dispatch call itself must not fail invalid_input');
      if (!result.ok) return;
      assert(
        result.dispatch.accepted === false && result.dispatch.reason === 'low_confidence',
        'a precomputed rejection must produce the exact same rejection shape as a freshly-classified one',
      );
      assert(result.route === null, 'route must be null for a rejected dispatch');
      assert(
        rows.some((r) => r.eventType === 'dispatcherIntentRejected'),
        'the existing reject-path audit write must still run for a precomputed rejection',
      );
    },
  );

  await runAsyncTest(
    'dedup: dispatchVionaAutonomousRequest with precomputedIntentDecision OMITTED still classifies internally exactly once (zero-regression for every existing non-webhook caller)',
    async () => {
      const spy = createCallLlmSpy({
        toolName: 'merchant_schedule_availability_check',
        toolInputRaw: { dateRangeStart: '2026-07-14', dateRangeEnd: '2026-07-14' },
        confidence: 0.9,
        rationale: 'ok',
      });
      const { writer } = createFakeAuditWriter();
      const result = await dispatchVionaAutonomousRequest(
        { ...BASE_DISPATCH_INPUT, merchantContext: MERCHANT_CONTEXT },
        { callLlm: spy.callLlm, auditWriter: writer, executeMerchantQuery: stubExecuteMerchantQuery },
      );
      assert(result.ok === true, 'dispatch call itself must not fail invalid_input');
      if (!result.ok) return;
      assert(result.dispatch.accepted === true, 'internal classification must still accept a valid decision');
      assert(spy.callCount() === 1, 'omitting precomputedIntentDecision must classify internally exactly once — byte-for-byte prior behavior');
    },
  );

  await runAsyncTest(
    'dedup: webhook controller wiring — its own routeIntent() decision is forwarded into dispatch() as precomputedIntentDecision verbatim',
    async () => {
      let capturedDispatchInput: DispatchVionaAutonomousRequestInput | null = null;
      const channel: ResolvedVionaWebhookChannel = {
        channelId: 'ch-pack39-1',
        channelType: 'custom_client',
        channelExternalId: 'ext-pack39-1',
        channelIsActive: true,
        signingSecretHash: 'pack39-test-secret',
        standingApprovalForReadOnlyToolsOnly: true,
        merchantProfileId: MERCHANT_CONTEXT.merchantProfileId,
        tenantId: MERCHANT_CONTEXT.tenantId,
        merchantOwnerUserId: 'owner-pack39-a',
        merchantIsActive: true,
        merchantToolScope: ['merchant_schedule_availability_check'],
      };
      const body = {
        channelType: channel.channelType,
        channelExternalId: channel.channelExternalId,
        externalMessageId: 'msg-pack39-1',
        fromExternalContactId: 'contact-1',
        messageText: 'What are your opening hours today?',
      };
      const deps: VionaWebhookMerchantAgentControllerDeps = {
        resolveChannel: async () => ({ ok: true, channel }),
        createFromWebhook: async () => ({ ok: true, requestId: 'req-pack39-webhook-1', requestStatus: 'submitted', idempotentReplay: false }),
        routeIntent: async () => ACCEPTED_MERCHANT_DECISION,
        dispatch: async (input): Promise<DispatchVionaAutonomousRequestResult> => {
          capturedDispatchInput = input;
          return {
            ok: true,
            requestId: 'req-pack39-webhook-1',
            dispatch: { accepted: true, toolName: ACCEPTED_MERCHANT_DECISION.toolName, confidence: ACCEPTED_MERCHANT_DECISION.confidence },
            route: { kind: 'merchantReadOnlyQuery', result: { toolName: ACCEPTED_MERCHANT_DECISION.toolName, dataAvailable: false, summary: 's', replyText: 'r', detailJson: {} } },
          };
        },
      };
      const raw = Buffer.from(JSON.stringify(body), 'utf8');
      const header = buildVionaWebhookSignatureHeader(raw, channel.signingSecretHash);
      const req: any = { body: raw, headers: { 'x-viona-webhook-signature': header } };
      const state = { statusCode: null as number | null };
      const res: any = {
        status(code: number) {
          state.statusCode = code;
          return res;
        },
        type() {
          return res;
        },
        send() {
          return res;
        },
        json() {
          return res;
        },
      };
      await postVionaWebhookMerchantAgent(req, res, deps);
      assert(state.statusCode === 200, 'expected HTTP 200');
      assert(capturedDispatchInput !== null, 'dispatch() must have been called');
      assert(
        JSON.stringify((capturedDispatchInput as any).precomputedIntentDecision) === JSON.stringify(ACCEPTED_MERCHANT_DECISION),
        'the controller must forward its own routeIntent() decision into dispatch() as precomputedIntentDecision, verbatim — this is the only real classification call for the whole request',
      );
    },
  );

  runTest('dedup (structural): VionaWebhookMerchantAgentController.ts source wires precomputedIntentDecision from its own routeIntentFn result', () => {
    const source = readSource('../src/controllers/VionaWebhookMerchantAgentController.ts');
    const dispatchCallIdx = source.indexOf('dispatchResult = await dispatchFn(');
    assert(dispatchCallIdx >= 0, 'the dispatchFn call must still exist');
    const dispatchCallBlock = source.slice(dispatchCallIdx, source.indexOf('} catch', dispatchCallIdx));
    assert(
      dispatchCallBlock.includes('precomputedIntentDecision: intentDecision'),
      'the controller must pass its own already-computed intentDecision into dispatchFn as precomputedIntentDecision',
    );
  });

  runTest('dedup (structural): DispatchVionaAutonomousRequestInput declares precomputedIntentDecision as optional, alongside every pre-existing field', () => {
    const source = readSource('../src/services/viona/vionaAutonomousDispatchService.ts');
    assert(source.includes('precomputedIntentDecision?: VionaDispatchDecision'), 'the new field must exist and be optional');
    assert(source.includes('operatorApprovalGranted: boolean'), 'operatorApprovalGranted must remain in the input type, unchanged');
    assert(source.includes('userConsentGranted: boolean'), 'userConsentGranted must remain in the input type, unchanged');
    assert(source.includes("merchantContext?: Readonly<{ tenantId: string; merchantProfileId: string }> | null"), 'merchantContext (Pack37) must remain in the input type, unchanged');
    assert(
      source.includes('input.precomputedIntentDecision ??'),
      'the internal classification call must be skipped via a nullish-coalescing fallback on the new field, not a separate branch that could diverge in behavior',
    );
  });
}

// ---------------------------------------------------------------------------
// Group B — "Deeply unset" env guard contract (plan §4.2 Layer 2).
// ---------------------------------------------------------------------------

async function runDeepUnsetGuardTests(): Promise<void> {
  await runAsyncTest('deep-unset guard: reads inside the guarded callback return undefined', async () => {
    process.env.OPENAI_API_KEY = 'sk-should-never-be-read-inside-guard';
    await withOpenAiApiKeyDeeplyUnsetAsync(undefined, async () => {
      assert(process.env.OPENAI_API_KEY === undefined, 'a read inside the guarded callback must return undefined');
    });
    assert(process.env.OPENAI_API_KEY === 'sk-should-never-be-read-inside-guard', 'the original value must be restored exactly after the guarded callback resolves');
    delete process.env.OPENAI_API_KEY;
  });

  await runAsyncTest(
    'deep-unset guard: a later plain-assignment WRITE inside the callback (simulating Prisma\'s own silent .env re-merge) is silently absorbed, never visible to a later read',
    async () => {
      await withOpenAiApiKeyDeeplyUnsetAsync(undefined, async () => {
        assert(process.env.OPENAI_API_KEY === undefined, 'must read as undefined before the simulated write');
        // Simulates exactly what @prisma/client's own bundled dotenv-merge logic does internally —
        // a plain property assignment once it believes the key is "missing".
        process.env.OPENAI_API_KEY = 'sk-real-key-silently-restored-by-a-3rd-party-env-loader';
        assert(
          process.env.OPENAI_API_KEY === undefined,
          'THE FIX: even after a 3rd-party write attempt, a subsequent read must still return undefined — this is what "deeply unset" means (plan §4.2 Layer 2)',
        );
      });
    },
  );

  await runAsyncTest('deep-unset guard: original value is restored even when the callback throws', async () => {
    process.env.OPENAI_API_KEY = 'sk-original-before-throw';
    let threw = false;
    try {
      await withOpenAiApiKeyDeeplyUnsetAsync(undefined, async () => {
        throw new Error('simulated failure inside guarded callback');
      });
    } catch {
      threw = true;
    }
    assert(threw, 'the guarded callback\'s own error must still propagate out');
    assert(process.env.OPENAI_API_KEY === 'sk-original-before-throw', 'the original value must be restored even when the callback throws (finally-block discipline)');
    delete process.env.OPENAI_API_KEY;
  });

  await runAsyncTest('deep-unset guard: when no original value existed, the property is fully deleted again after restore (no stray undefined-valued key left behind)', async () => {
    delete process.env.OPENAI_API_KEY;
    await withOpenAiApiKeyDeeplyUnsetAsync(undefined, async () => {
      /* no-op */
    });
    assert(!('OPENAI_API_KEY' in process.env), 'restoring to "no prior value" must fully delete the key, not leave a trapped getter/setter behind');
  });

  await runAsyncTest('deep-unset guard: called with a defined string value behaves like a plain, restorable assignment (no trap installed)', async () => {
    const original = process.env.OPENAI_API_KEY;
    await withOpenAiApiKeyDeeplyUnsetAsync('sk-fake-test-key-for-pack39', async () => {
      assert(process.env.OPENAI_API_KEY === 'sk-fake-test-key-for-pack39', 'the supplied value must be readable verbatim inside the callback');
    });
    assert(process.env.OPENAI_API_KEY === original, 'the original value (or absence of one) must be restored after the callback resolves');
    if (original === undefined) delete process.env.OPENAI_API_KEY;
  });
}

// ---------------------------------------------------------------------------
// Group C — Mechanical Layer-1 fix verification (structural).
// ---------------------------------------------------------------------------

function runMechanicalFixStructuralTests(): void {
  runTest('mechanical fix: test-viona-pack37 no longer defines its own local withOpenAiApiKeyAsync helper', () => {
    const source = readSource('../scripts/test-viona-pack37-b2b-dispatcher-realization.ts');
    assert(!source.includes('async function withOpenAiApiKeyAsync'), 'the old, locally-duplicated helper must be removed in favor of the shared Pack39 guard');
  });

  runTest('mechanical fix: test-viona-pack37 imports the shared withOpenAiApiKeyDeeplyUnsetAsync guard from _testHelpers', () => {
    const source = readSource('../scripts/test-viona-pack37-b2b-dispatcher-realization.ts');
    assert(
      source.includes("import { withOpenAiApiKeyDeeplyUnsetAsync } from './_testHelpers/vionaTestEnvGuard'"),
      'test-viona-pack37 must import the shared Pack39 guard, not reimplement it',
    );
    assert(!source.includes('withOpenAiApiKeyAsync('), 'zero remaining call sites of the old helper name must exist');
  });

  runTest('mechanical fix: test-viona-pack37\'s end-to-end "secrets" dispatch test now injects a fake executeMerchantQuery (closing the real getPrisma() trigger at its root)', () => {
    const source = readSource('../scripts/test-viona-pack37-b2b-dispatcher-realization.ts');
    const testIdx = source.indexOf("'secrets: end-to-end dispatch with OPENAI_API_KEY unset");
    assert(testIdx >= 0, 'the target test must still exist by name');
    const nextTestIdx = source.indexOf('await runAsyncTest(', testIdx + 1);
    const testBlock = source.slice(testIdx, nextTestIdx >= 0 ? nextTestIdx : undefined);
    assert(testBlock.includes('executeMerchantQuery:'), 'this specific test must now inject a fake executeMerchantQuery, mirroring its own sibling switch-wiring tests');
  });
}

// ---------------------------------------------------------------------------
// Group D — Layer 3 non-authorization guard (operator explicitly withheld this layer).
// ---------------------------------------------------------------------------

function runLayer3NonAuthorizationTests(): void {
  runTest('Layer 3 non-authorization: AIRouterService.ts contains zero references to any Pack39 test-mode circuit-breaker flag', () => {
    const source = readSource('../src/services/ai/AIRouterService.ts');
    assert(
      !source.includes('VIONA_TEST_BLOCK_REAL_OPENAI_CALLS'),
      'Layer 3 (the optional AIRouterService.ts network circuit breaker) was explicitly NOT authorized for this implementation — production code must stay untouched by it',
    );
  });
}

// ---------------------------------------------------------------------------
// Runner.
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Pack39 — B2B Routing Performance & Test Isolation Fixes: implementation test suite\n');
  await runDeduplicationTests();
  await runDeepUnsetGuardTests();
  runMechanicalFixStructuralTests();
  runLayer3NonAuthorizationTests();
  console.log(`\nAll ${passed} Pack39 tests passed.`);
}

main().catch((err) => {
  console.error('\nFAIL:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
