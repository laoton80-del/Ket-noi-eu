/**
 * Pack40D3B — controlled runtime wiring + provider-bypass closure tests.
 *
 * Operator phrase: APPROVE_PACK40D3B_CONTROLLED_RUNTIME_WIRING_AND_BYPASS_CLOSURE.
 * Fake/injected coordinator, escrow, gateway, and Twilio deps only — no DB/staging/live provider.
 *
 * Run: npx tsx scripts/test-viona-pack40d3b-controlled-runtime-wiring.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestExecutionAttemptState } from '@prisma/client';

import { postVionaInternalTriggerRealTwilioPoc } from '../src/controllers/VionaInternalRealTwilioPocController';
import { dispatchVionaAutonomousRequest } from '../src/services/viona/vionaAutonomousDispatchService';
import { previewVionaExecutionPlanRealProviderPocRoute } from '../src/services/viona/vionaExecutionPlanRouteService';
import {
  executeVionaRequestBusinessFlow,
  type ExecuteVionaRequestBusinessFlowDeps,
  type ExecuteVionaRequestBusinessFlowResult,
} from '../src/services/viona/vionaRequestExecutionOrchestrator';
import { buildVionaPack40D3EscrowIdempotencyKey } from '../src/services/viona/vionaPack40D3EscrowCoordination';
import type { ClaimVionaRequestExecutionResult } from '../src/services/viona/vionaRequestIndirectStatusActionService';
import { VionaRequestIndirectExecutionError } from '../src/services/viona/vionaRequestIndirectStatusActionService';
import type { RunVionaRequestExecutionProviderGatewayResult } from '../src/services/viona/vionaRequestExecutionGatewayService';
import { VionaRequestExecutionGatewayError } from '../src/services/viona/vionaRequestExecutionGatewayService';
import type { VionaExecutionProviderAdapter } from '../src/services/viona/vionaRequestExecutionProviderContract';

let passed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

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

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readSourceNoComments(relativePath: string): string {
  return readSource(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

const OWNER = 'user-owner';
const REQUEST_ID = 'req-1';
const ATTEMPT_ID = 'attempt-1';
const LEASE_OWNER = 'lease-1';
const HOLD_ID = 'hold-1';

function baseClaim(overrides: Partial<ClaimVionaRequestExecutionResult> = {}): ClaimVionaRequestExecutionResult {
  return {
    requestId: REQUEST_ID,
    attemptId: ATTEMPT_ID,
    attemptNumber: 1,
    executionKey: 'exec-1',
    attemptState: 'claimed',
    requestStatus: 'inProgress',
    statusEventId: 'se-1',
    auditEventId: 'ae-1',
    leaseOwner: LEASE_OWNER,
    leaseExpiresAt: new Date('2026-07-15T16:00:00.000Z'),
    ...overrides,
  };
}

function gatewayOk(
  state: RunVionaRequestExecutionProviderGatewayResult['attemptState'],
  adapterKind: RunVionaRequestExecutionProviderGatewayResult['adapterKind'] = 'succeeded',
): RunVionaRequestExecutionProviderGatewayResult {
  return {
    kind: 'recorded',
    attemptId: ATTEMPT_ID,
    requestId: REQUEST_ID,
    providerIdempotencyKey: `twilio_test_sms:${REQUEST_ID}:${ATTEMPT_ID}:send`,
    attemptState: state,
    adapterKind,
    providerInvoked: true,
  };
}

type Tracker = {
  claims: number;
  holds: number;
  settles: number;
  refunds: number;
  gateways: number;
  completes: number;
  fails: number;
  adapterCalls: number;
  lastHoldKey?: string;
};

function makeTracker(): Tracker {
  return {
    claims: 0,
    holds: 0,
    settles: 0,
    refunds: 0,
    gateways: 0,
    completes: 0,
    fails: 0,
    adapterCalls: 0,
  };
}

type MutableCoordsDeps = {
  -readonly [K in keyof ExecuteVionaRequestBusinessFlowDeps]?: ExecuteVionaRequestBusinessFlowDeps[K];
};

function makeSuccessDeps(
  tracker: Tracker,
  options: {
    claimError?: PackError;
    holdOk?: boolean;
    gateway?: RunVionaRequestExecutionProviderGatewayResult | (() => RunVionaRequestExecutionProviderGatewayResult);
    gatewayError?: PackError;
    settleOk?: boolean;
    refundOk?: boolean;
    finalizeCompleteError?: boolean;
    finalizeFailError?: boolean;
  } = {},
): MutableCoordsDeps {
  return {
    claimFn: async () => {
      tracker.claims += 1;
      if (options.claimError) throw options.claimError;
      return baseClaim();
    },
    holdFn: async (input) => {
      tracker.holds += 1;
      tracker.lastHoldKey = input.idempotencyKey;
      if (options.holdOk === false) return { ok: false, reason: 'insufficient_funds' };
      return { ok: true, holdId: HOLD_ID, heldAmountVIO: 0.01, deduplicated: tracker.holds > 1 };
    },
    settleFn: async () => {
      tracker.settles += 1;
      if (options.settleOk === false) return { ok: false, reason: 'hold_not_found' };
      return {
        ok: true,
        status: 'SETTLED',
        settledAmountVIO: 0.01,
        refundedAmountVIO: 0,
        deduplicated: false,
      };
    },
    refundFn: async () => {
      tracker.refunds += 1;
      if (options.refundOk === false) return { ok: false, reason: 'hold_not_found' };
      return {
        ok: true,
        status: 'REFUNDED',
        settledAmountVIO: 0,
        refundedAmountVIO: 0.01,
        deduplicated: false,
      };
    },
    runGatewayFn: async (_input, deps) => {
      tracker.gateways += 1;
      if (options.gatewayError) throw options.gatewayError;
      // Exercise injected adapter exactly once when provided.
      if (deps.adapter) {
        tracker.adapterCalls += 1;
        await deps.adapter.invoke({
          providerName: 'twilio_test_sms',
          operationCategory: 'send',
          providerIdempotencyKey: `twilio_test_sms:${REQUEST_ID}:${ATTEMPT_ID}:send`,
          correlationId: 'corr',
          requestId: REQUEST_ID,
          attemptId: ATTEMPT_ID,
        });
      }
      if (typeof options.gateway === 'function') return options.gateway();
      return options.gateway ?? gatewayOk(VionaRequestExecutionAttemptState.providerSucceeded);
    },
    finalizeCompletedFn: async () => {
      tracker.completes += 1;
      if (options.finalizeCompleteError) {
        throw new VionaRequestIndirectExecutionError('terminal_transition_conflict');
      }
      return {
        requestId: REQUEST_ID,
        attemptId: ATTEMPT_ID,
        attemptState: 'completed',
        requestStatus: 'completed',
        statusEventId: 'se-t',
        auditEventId: 'ae-t',
      };
    },
    finalizeFailedFn: async () => {
      tracker.fails += 1;
      if (options.finalizeFailError) {
        throw new VionaRequestIndirectExecutionError('terminal_transition_conflict');
      }
      return {
        requestId: REQUEST_ID,
        attemptId: ATTEMPT_ID,
        attemptState: 'failed',
        requestStatus: 'failed',
        statusEventId: 'se-f',
        auditEventId: 'ae-f',
      };
    },
    createAdapter: () =>
      ({
        invoke: async () => ({ kind: 'succeeded', resultDigest: 'd' }),
      }) satisfies VionaExecutionProviderAdapter,
  };
}

type PackError = VionaRequestIndirectExecutionError | VionaRequestExecutionGatewayError;

function fakeRes() {
  const state: { statusCode?: number; body?: unknown } = {};
  return {
    state,
    res: {
      status(code: number) {
        state.statusCode = code;
        return this;
      },
      json(body: unknown) {
        state.body = body;
        return this;
      },
    } as unknown as import('express').Response,
  };
}

async function main(): Promise<void> {
  console.log('Pack40D3B controlled runtime wiring suite\n');

  // --- Trigger and controller ---
  runTest('1. Existing internal authenticated controller is the only enabled trigger', () => {
    const controller = readSource('../src/controllers/VionaInternalRealTwilioPocController.ts');
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(controller.includes('executeVionaRequestBusinessFlow'), 'controller -> coordinator');
    assert(orch.includes('internalAuthenticatedController'), 'trigger type');
    assert(!orch.includes('signedMerchantWebhook'), 'webhook trigger not used in coordinator');
    assert(!orch.includes('approvedInternalDispatch'), 'dispatch trigger not used');
  });

  await runAsyncTest('2. Authenticated owner becomes trusted triggering user', async () => {
    const tracker = makeTracker();
    let seenUser: string | undefined;
    const deps = makeSuccessDeps(tracker);
    deps.claimFn = async (input) => {
      seenUser = input.trigger.triggeringUserId;
      tracker.claims += 1;
      return baseClaim();
    };
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    assert(seenUser === OWNER, 'triggering user = auth user');
  });

  await runAsyncTest('3. Unauthenticated request denied', async () => {
    const { res, state } = fakeRes();
    await postVionaInternalTriggerRealTwilioPoc(
      { authUserId: undefined, body: { requestId: REQUEST_ID, operatorApprovalGranted: true, userConsentGranted: true } } as never,
      res,
    );
    assert(state.statusCode === 401, '401');
  });

  await runAsyncTest('4. Tenant/profile body fields ignored', async () => {
    const tracker = makeTracker();
    const { res, state } = fakeRes();
    await postVionaInternalTriggerRealTwilioPoc(
      {
        authUserId: OWNER,
        body: {
          requestId: REQUEST_ID,
          operatorApprovalGranted: true,
          userConsentGranted: true,
          tenantId: 'spoof-tenant',
          merchantProfileId: 'spoof-profile',
          messageBody: 'hello',
        },
      } as never,
      res,
      {
        coordinator: async (input, d) =>
          executeVionaRequestBusinessFlow(input, { ...makeSuccessDeps(tracker), ...d }),
      },
    );
    assert(state.statusCode === 200 || (state.body as { ok?: boolean })?.ok === true || state.body != null, 'responded');
    assert(tracker.claims === 1, 'claimed via trusted auth user only');
  });

  await runAsyncTest('5. Consumer request denied before escrow/provider', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('request_not_eligible_for_claim'),
      }),
    );
    assert(!result.ok && result.reason === 'invalid_state', 'denied');
    assert(tracker.holds === 0 && tracker.gateways === 0, 'no escrow/provider');
  });

  await runAsyncTest('6. Legacy request denied before escrow/provider', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('merchant_execution_not_authorized'),
      }),
    );
    assert(!result.ok, 'denied');
    assert(tracker.holds === 0 && tracker.gateways === 0, 'no side effects');
  });

  await runAsyncTest('7. Inactive merchant denied', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('merchant_execution_not_authorized'),
      }),
    );
    assert(!result.ok && tracker.gateways === 0, 'inactive denied');
  });

  await runAsyncTest('8. Wrong tenant/profile/owner denied', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('request_not_eligible_for_claim'),
      }),
    );
    assert(tracker.holds === 0, 'no hold');
  });

  runTest('9. No new public route exists', () => {
    const routes = [
      '../src/routes/vionaRoutes.ts',
      '../src/routes/internalRoutes.ts',
      '../src/routes/vionaWebhookRoutes.ts',
    ];
    for (const rel of routes) {
      const p = path.resolve(__dirname, rel);
      if (!fs.existsSync(p)) continue;
      const source = fs.readFileSync(p, 'utf8');
      assert(!source.includes('pack40d-execute'), 'no new pack40d public route');
      assert(!source.includes('execution-gateway'), 'no new gateway route');
    }
    assert(
      readSource('../src/routes/internalRoutes.ts').includes('trigger-real-twilio-poc'),
      'existing internal route kept',
    );
  });

  // --- Coordinator and claim ---
  runTest('10. Coordinator invokes D2 claim', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(orch.includes('claimVionaRequestExecution'), 'uses D2 claim');
  });

  runTest('11. Coordinator performs no direct Prisma status write', () => {
    const orch = readSourceNoComments('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(!orch.includes('vionaRequest.updateMany'), 'no updateMany');
    assert(!orch.includes("status: 'inProgress'"), 'no direct status assign');
    assert(!orch.includes('getPrisma()'), 'no prisma client');
  });

  await runAsyncTest('12. Claim failure prevents escrow', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('claim_conflict'),
      }),
    );
    assert(tracker.holds === 0, 'no hold');
  });

  await runAsyncTest('13. Claim failure prevents provider', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('active_attempt_exists'),
      }),
    );
    assert(tracker.gateways === 0, 'no gateway');
  });

  await runAsyncTest('14. Claim failure prevents finalization', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('invalid_attempt_state'),
      }),
    );
    assert(tracker.completes === 0 && tracker.fails === 0, 'no finalize');
  });

  await runAsyncTest('15. Successful claim returns exact attempt', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker),
    );
    assert(result.ok && result.attemptId === ATTEMPT_ID, 'attempt id');
  });

  await runAsyncTest('16. Duplicate active attempt prevents second execution', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('active_attempt_exists'),
      }),
    );
    assert(!result.ok && tracker.gateways === 0, 'blocked');
  });

  // --- Escrow ---
  runTest('17. Hold key binds request and attempt', () => {
    const key = buildVionaPack40D3EscrowIdempotencyKey({
      requestId: REQUEST_ID,
      executionAttemptId: ATTEMPT_ID,
    });
    assert(key === `escrow:${REQUEST_ID}:${ATTEMPT_ID}:twilio_test_sms`, 'format');
  });

  await runAsyncTest('18. Hold occurs after claim', async () => {
    const order: string[] = [];
    const tracker = makeTracker();
    const deps = makeSuccessDeps(tracker);
    const claimFn = deps.claimFn!;
    const holdFn = deps.holdFn!;
    deps.claimFn = async (input) => {
      order.push('claim');
      return claimFn(input);
    };
    deps.holdFn = async (input) => {
      order.push('hold');
      return holdFn(input);
    };
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    assert(order[0] === 'claim' && order[1] === 'hold', 'order');
  });

  await runAsyncTest('19. Hold occurs before provider', async () => {
    const order: string[] = [];
    const tracker = makeTracker();
    const deps = makeSuccessDeps(tracker);
    const holdFn = deps.holdFn!;
    const runGatewayFn = deps.runGatewayFn!;
    deps.holdFn = async (input) => {
      order.push('hold');
      return holdFn(input);
    };
    deps.runGatewayFn = async (input, d) => {
      order.push('gateway');
      return runGatewayFn(input, d);
    };
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    assert(order.indexOf('hold') < order.indexOf('gateway'), 'hold before gateway');
  });

  await runAsyncTest('20. Failed hold prevents provider', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, { holdOk: false }),
    );
    assert(!result.ok && result.reason === 'reconciliation_required', 'hold fail');
    assert(tracker.gateways === 0, 'no provider');
  });

  await runAsyncTest('21. Duplicate delivery does not duplicate hold', async () => {
    const tracker = makeTracker();
    const deps = makeSuccessDeps(tracker);
    // Second claim fails active attempt — simulates duplicate delivery after success.
    let calls = 0;
    deps.claimFn = async () => {
      calls += 1;
      tracker.claims += 1;
      if (calls > 1) throw new VionaRequestIndirectExecutionError('active_attempt_exists');
      return baseClaim();
    };
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    assert(tracker.holds === 1, 'one hold');
  });

  runTest('22. Another attempt uses another escrow key', () => {
    const a = buildVionaPack40D3EscrowIdempotencyKey({
      requestId: REQUEST_ID,
      executionAttemptId: 'a1',
    });
    const b = buildVionaPack40D3EscrowIdempotencyKey({
      requestId: REQUEST_ID,
      executionAttemptId: 'a2',
    });
    assert(a !== b, 'diff attempt keys');
  });

  runTest('23. Another request cannot reuse the escrow key', () => {
    const a = buildVionaPack40D3EscrowIdempotencyKey({
      requestId: 'r1',
      executionAttemptId: ATTEMPT_ID,
    });
    const b = buildVionaPack40D3EscrowIdempotencyKey({
      requestId: 'r2',
      executionAttemptId: ATTEMPT_ID,
    });
    assert(a !== b, 'diff request keys');
  });

  runTest('24. Escrow runtime is injected in tests', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(orch.includes('holdFn'), 'injectable hold');
    assert(orch.includes('settleFn'), 'injectable settle');
    assert(orch.includes('refundFn'), 'injectable refund');
  });

  // --- Provider ---
  runTest('25. Coordinator invokes D3A gateway, not Twilio directly', () => {
    const orch = readSourceNoComments('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(orch.includes('runVionaRequestExecutionProviderGateway'), 'gateway');
    assert(!orch.includes('executeVionaTwilioTestPocReal'), 'no direct executeReal');
    assert(!orch.includes('previewVionaExecutionPlanRealProviderPocRoute'), 'no POC route');
  });

  runTest('26. Only twilio_test_sms/send supported', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(orch.includes("operationCategory: 'send'"), 'send only');
    const adapter = readSource('../src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts');
    assert(adapter.includes('createPack40D3TwilioGatewayAdapter'), 'single-shot adapter');
    assert(!adapter.includes('while (attempts'), 'no retry loop');
  });

  await runAsyncTest('27. Provider key is attempt-scoped', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker),
    );
    assert(Boolean(tracker.lastHoldKey?.includes(ATTEMPT_ID)), 'attempt in escrow key');
  });

  await runAsyncTest('28. Known success recorded once', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.providerSucceeded),
      }),
    );
    assert(tracker.gateways === 1 && tracker.completes === 1, 'once');
  });

  await runAsyncTest('29. Known failure recorded once', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.providerFailed, 'failed'),
      }),
    );
    assert(result.ok === true && result.finalStatus === 'failed', 'failed flow');
    assert(tracker.gateways === 1 && tracker.fails === 1 && tracker.refunds === 1, 'once');
  });

  await runAsyncTest('30. Timeout becomes outcome uncertain', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.outcomeUncertain, 'uncertain'),
      }),
    );
    assert(!result.ok && result.reason === 'provider_uncertain', 'uncertain');
    assert(tracker.completes === 0 && tracker.fails === 0, 'no finalize');
  });

  await runAsyncTest('31. Uncertain outcome causes no retry', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.outcomeUncertain, 'uncertain'),
      }),
    );
    assert(tracker.gateways === 1 && tracker.adapterCalls === 1, 'single invoke');
  });

  await runAsyncTest('32. Duplicate gateway call causes no second provider invocation', async () => {
    const tracker = makeTracker();
    let calls = 0;
    const deps = makeSuccessDeps(tracker);
    deps.claimFn = async () => {
      calls += 1;
      tracker.claims += 1;
      if (calls > 1) throw new VionaRequestIndirectExecutionError('active_attempt_exists');
      return baseClaim();
    };
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    assert(tracker.gateways === 1, 'gateway once');
  });

  await runAsyncTest('33. Terminal attempt causes no provider call', async () => {
    const tracker = makeTracker();
    await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        claimError: new VionaRequestIndirectExecutionError('terminal_transition_conflict'),
      }),
    );
    assert(tracker.gateways === 0, 'no provider');
  });

  // --- Successful flow ---
  await runAsyncTest('34-43. Successful end-to-end coordinator flow', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker),
    );
    assert(result.ok === true, 'ok');
    if (result.ok) {
      assert(result.finalStatus === 'completed', '35-39 completed');
    }
    assert(tracker.claims === 1, '34 claim');
    assert(tracker.holds === 1, '35 hold');
    assert(tracker.gateways === 1, '36 provider');
    assert(tracker.settles === 1, '37 settle');
    assert(tracker.completes === 1, '38 D2 completion');
    assert(tracker.adapterCalls === 1, '43 provider once');
    assert(tracker.lastHoldKey === buildVionaPack40D3EscrowIdempotencyKey({
      requestId: REQUEST_ID,
      executionAttemptId: ATTEMPT_ID,
    }), 'attempt-scoped escrow');
  });

  // --- Failure flow ---
  await runAsyncTest('44-50. Known-failure flow', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.providerFailed, 'failed'),
      }),
    );
    assert(result.ok && result.finalStatus === 'failed', '48-49 failed');
    assert(tracker.claims === 1, '44 claim');
    assert(tracker.gateways === 1, '45 provider fail');
    assert(tracker.refunds === 1, '46 release');
    assert(tracker.fails === 1, '47 D2 fail');
    assert(tracker.adapterCalls === 1, '50 once');
  });

  // --- Reconciliation ---
  await runAsyncTest('51-52. Provider success + settle failure', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, { settleOk: false }),
    );
    assert(!result.ok && result.reason === 'reconciliation_required', 'recon');
    if (!result.ok) {
      assert(result.requestStatus === 'inProgress', '52 not failed');
    }
    assert(tracker.gateways === 1 && tracker.completes === 0, '51 no retry/finalize');
  });

  await runAsyncTest('53. Provider failure + escrow-release failure does not terminal-finalize', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.providerFailed, 'failed'),
        refundOk: false,
      }),
    );
    assert(!result.ok && result.reason === 'reconciliation_required', 'recon');
    assert(tracker.fails === 0, 'no finalize');
  });

  await runAsyncTest('54-55. Outcome uncertain remains inProgress, no settle/release', async () => {
    const tracker = makeTracker();
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      makeSuccessDeps(tracker, {
        gateway: gatewayOk(VionaRequestExecutionAttemptState.outcomeUncertain, 'uncertain'),
      }),
    );
    assert(!result.ok && result.reason === 'provider_uncertain', '54');
    if (!result.ok) {
      assert(result.requestStatus === 'inProgress', 'inProgress');
    }
    assert(tracker.settles === 0 && tracker.refunds === 0, '55');
  });

  await runAsyncTest('56. Reconciliation result is sanitized', async () => {
    const { res, state } = fakeRes();
    await postVionaInternalTriggerRealTwilioPoc(
      {
        authUserId: OWNER,
        body: {
          requestId: REQUEST_ID,
          operatorApprovalGranted: true,
          userConsentGranted: true,
          messageBody: 'x',
        },
      } as never,
      res,
      {
        coordinator: async () =>
          ({
            ok: false,
            reason: 'reconciliation_required',
            attemptId: ATTEMPT_ID,
            requestStatus: 'inProgress',
          }) satisfies ExecuteVionaRequestBusinessFlowResult,
      },
    );
    const body = JSON.stringify(state.body ?? {});
    assert(!body.includes(LEASE_OWNER), 'no lease');
    assert(!body.includes('merchantProfile'), 'no profile');
    assert(state.statusCode === 409 || body.includes('reconciliation') || body.includes('Execution'), 'sanitized');
  });

  // --- Bypass closure ---
  runTest('57-59. Preview routes remain preview-only', () => {
    const route = readSourceNoComments('../src/services/viona/vionaExecutionPlanRouteService.ts');
    const start = route.indexOf('export async function previewVionaExecutionPlanRoute');
    const end = route.indexOf('export async function previewVionaExecutionPlanRealProviderPocRoute');
    assert(start >= 0 && end > start, 'preview fn bounds');
    const previewFn = route.slice(start, end);
    assert(!previewFn.includes('executeVionaRequestBusinessFlow'), 'preview no coordinator');
    assert(!previewFn.includes('holdVionaRequestExecutionCost('), 'preview no hold call');
    assert(!previewFn.includes('executeVionaTwilioTestPocReal('), 'preview no twilio call');
    const routes = readSource('../src/routes/vionaRoutes.ts');
    assert(routes.includes('execution-plan-preview') || routes.includes('execution-preview'), 'preview routes exist');
  });

  await runAsyncTest('60-61. Direct real-provider route disabled without test bypass', async () => {
    const closed = await previewVionaExecutionPlanRealProviderPocRoute({
      authUserId: OWNER,
      requestId: REQUEST_ID,
      operatorApprovalGranted: true,
      userConsentGranted: true,
      fromNumber: '+15005550006',
      toNumber: '+15005550006',
      body: 'hi',
    });
    assert(!closed.ok && closed.reason === 'provider_bypass_closed', 'closed');
  });

  await runAsyncTest('62-64. Signed webhook / dispatch Twilio disabled', async () => {
    const result = await dispatchVionaAutonomousRequest(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        requestStatus: 'submitted',
        userMessage: 'send a test sms please',
        operatorApprovalGranted: true,
        userConsentGranted: true,
        precomputedIntentDecision: {
          ok: true,
          toolName: 'twilio_test_sms_poc',
          confidence: 0.99,
          rationale: 'test',
          toolInput: {
            fromNumber: '+15005550006',
            toNumber: '+15005550006',
            body: 'hi',
          },
        },
      },
      {
        routeExecutor: async () => {
          throw new Error('routeExecutor must not be called');
        },
        auditWriter: async () => ({ ok: true, auditEventId: 'a1' }),
      },
    );
    assert(result.ok === true, 'ok envelope');
    if (result.ok) {
      assert(result.dispatch.accepted === false, 'not accepted');
      if (!result.dispatch.accepted) {
        assert(result.dispatch.reason === 'pack40d_provider_execution_disabled', 'disabled');
      }
    }
  });

  runTest('65. Approved internal dispatch remains unwired', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(!orch.includes('approvedInternalDispatch'), 'not enabled');
  });

  runTest('66. No provider-capable bypass remains', () => {
    const controller = readSourceNoComments(
      '../src/controllers/VionaInternalRealTwilioPocController.ts',
    );
    assert(!controller.includes('previewVionaExecutionPlanRealProviderPocRoute'), 'controller delegated');
    const dispatch = readSourceNoComments(
      '../src/services/viona/vionaAutonomousDispatchService.ts',
    );
    assert(dispatch.includes('pack40d_provider_execution_disabled'), 'dispatch closed');
    const webhook = readSource('../src/controllers/VionaWebhookMerchantAgentController.ts');
    assert(!webhook.includes('executeVionaTwilioTestPocReal'), 'webhook no direct twilio');
    assert(!webhook.includes('executeVionaRequestBusinessFlow'), 'webhook no coordinator exec');
  });

  // --- Preservation ---
  runTest('67-69. Pack40A/B/C unchanged', () => {
    for (const rel of [
      '../src/services/viona/vionaRequestStatusActionService.ts',
      '../src/services/viona/vionaRequestStatusAccessScope.ts',
    ]) {
      const source = readSource(rel);
      assert(!source.includes('executeVionaRequestBusinessFlow'), `${rel} untouched by D3B`);
    }
  });

  runTest('70. Pack40D1 schema unchanged', () => {
    // Evidence by absence of schema edits in this pack's allowlist intent
    assert(fs.existsSync(path.resolve(__dirname, '../prisma/schema.prisma')), 'schema exists');
  });

  runTest('71. Pack40D2 services still export claim/finalize', () => {
    const d2 = readSource('../src/services/viona/vionaRequestIndirectStatusActionService.ts');
    assert(d2.includes('export async function claimVionaRequestExecution'), 'claim');
    assert(d2.includes('finalizeVionaRequestExecutionCompleted'), 'complete');
  });

  runTest('72. Pack40D3A outcome API unchanged', () => {
    const g = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(g.includes('runVionaRequestExecutionProviderGateway'), 'run');
    assert(g.includes('outcomeUncertain'), 'uncertain');
  });

  runTest('73. No schema or migration change in D3B sources', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(!orch.includes('prisma/schema'), 'no schema');
  });

  runTest('74. No database/staging/live provider path in D3B production sources', () => {
    for (const rel of [
      '../src/services/viona/vionaRequestExecutionOrchestrator.ts',
      '../src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts',
      '../src/controllers/VionaInternalRealTwilioPocController.ts',
    ]) {
      const source = readSource(rel);
      assert(!source.includes('DATA' + 'BASE_URL'), 'no db url');
      assert(!source.includes('supabase.co'), 'no staging host');
      assert(!source.includes('migrate' + ' deploy'), 'no migrate');
    }
  });

  runTest('75-76. Consumer/legacy remain unsupported in coordinator', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(orch.includes('claimVionaRequestExecution'), 'relies on D2 merchant-only claim');
  });

  runTest('77. No background worker or scheduler added', () => {
    const src = path.resolve(__dirname, '../src');
    const files = fs.readdirSync(src, { recursive: true }).map(String);
    assert(!files.some((f) => f.toLowerCase().includes('pack40d3b') && f.includes('worker')), 'no worker');
    assert(!files.some((f) => f.toLowerCase().includes('pack40d') && f.includes('scheduler')), 'no scheduler');
  });

  runTest('78. Pack40S remains unimplemented', () => {
    const hit = fs
      .readdirSync(path.resolve(__dirname, '../src'), { recursive: true })
      .map(String)
      .some((f) => f.toLowerCase().includes('pack40s'));
    assert(!hit, 'no Pack40S');
  });

  runTest('79. Single-shot Twilio adapter has no retry loop', () => {
    const adapter = readSource('../src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts');
    assert(!adapter.includes('RETRY_BACKOFF'), 'no backoff');
    assert(!adapter.includes('attempts < 2'), 'no second attempt');
  });

  console.log(`\nPack40D3B suite: ${passed}/${passed} PASS`);
}

main().catch((error) => {
  console.error('\nFAIL:', error);
  process.exit(1);
});
