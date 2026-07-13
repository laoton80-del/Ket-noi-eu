/**
 * Pack32.5 — Core System Integration Audit: true end-to-end service-layer tests piercing every
 * layer from Pack30D to Pack32:
 *
 *   [Mock VionaRequest] -> [Dispatcher Intent (fake callLlm)] -> [Tool Registry] ->
 *   [buildVionaExecutionPlan() — REAL, pure] -> [Pack31 escrow hold — REAL function, fake Prisma] ->
 *   [Pack30D-4 executeReal() — REAL function, fake network transport] ->
 *   [Pack31 escrow settle/refund — REAL function, fake Prisma] -> [Audit Ledger — REAL writer contract, in-memory rows].
 *
 * This is deliberately **not** a re-run of the Pack30D-1/30D-2/30D-4/31/32 unit suites (those
 * already cover each function's own internals in isolation and are re-run separately as part of
 * this audit's own regression pass, see the evidence README). This file's only job is to prove the
 * *wiring between* those layers is correct, by calling `dispatchVionaAutonomousRequest()` with only
 * the true system edges faked out (LLM call, DB, network) — every business-logic function in
 * between (`buildVionaExecutionPlan`, `holdVionaRequestExecutionCost`,
 * `executeVionaTwilioTestPocReal`, `settleVionaRequestExecutionHold`,
 * `previewVionaExecutionPlanRealProviderPocRoute`) runs its real, unmodified implementation.
 *
 * Audit finding (Pack32.5, documented in the evidence README + the route service's own doc
 * comment): `previewVionaExecutionPlanRealProviderPocRoute()` had **zero** dependency-injection
 * surface, and a hold failure was only `console.error`-logged, never durably audited. Both are
 * fixed as narrow, additive, backward-compatible bug-fixes in
 * `src/services/viona/vionaExecutionPlanRouteService.ts` (see its `PreviewVionaExecutionPlanRealProviderPocDeps`
 * type and the new `executionBlockedPolicy` audit write on hold failure) — no new business logic,
 * no new tool, no schema change, no UI change.
 *
 * Scenarios (3 required by the operator + 1 additional fail-closed/race-condition regression):
 *   1. Happy path      — dispatch accepted, hold succeeds, real call succeeds, settle charges in
 *                         full, >= 5 audit events, exact VIO Credits accounting.
 *   2. Hold fail        — insufficient VIO Credits -> immediate fail-closed denial, executeReal()
 *                         is NEVER called (spy asserts 0 network calls), ledger records the denial.
 *   3. Network timeout   — hold succeeds, the real call times out on both attempts, escrow
 *                         refunds the FULL held amount, wallet balance is fully restored, ledger
 *                         records the network risk (`executionRealFailedBounded` + `escrowRefunded`).
 *   4. Settle throws     — (race-condition regression) an unexpected error during settle must
 *                         never erase the already-known, already-succeeded `realProviderResult` —
 *                         the caller must still see the real outcome even though reconciliation of
 *                         the VIO Credits hold itself is flagged for manual follow-up.
 *
 * Run: npx tsx scripts/test-viona-pack32-5-core-integration-audit.ts
 */

import {
  holdVionaRequestExecutionCost,
  settleVionaRequestExecutionHold,
  type VionaEscrowHoldPrismaClient,
} from '../src/services/viona/vionaRequestEscrowHoldService';
import {
  executeVionaTwilioTestPocReal,
  createInMemoryVionaTwilioRealExecutionIdempotencyStore,
  type VionaTwilioHttpTransport,
  type VionaTwilioHttpTransportResult,
} from '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';
import {
  previewVionaExecutionPlanRealProviderPocRoute,
  VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO,
} from '../src/services/viona/vionaExecutionPlanRouteService';
import { dispatchVionaAutonomousRequest } from '../src/services/viona/vionaAutonomousDispatchService';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';
import type { GetVionaRequestByIdResult } from '../src/services/viona/vionaRequestReadDto';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ---------------------------------------------------------------------------
// Fakes at the true system edges only (DB, network, LLM). No business-logic function is faked.
// ---------------------------------------------------------------------------

type FakeWalletRow = { id: string; userId: string; balanceVIG: number; lockedBalanceVIG: number };
type FakeTransactionRow = { id: string; type: string; amountVIG: number; senderId: string; receiverId: string };
type FakeHoldRow = {
  id: string;
  requestId: string;
  actionId: string;
  userId: string;
  estimatedAmountVIO: number;
  heldAmountVIO: number;
  settledAmountVIO: number | null;
  refundedAmountVIO: number | null;
  status: string;
  holdTransactionId: string;
  settleTransactionId: string | null;
  refundTransactionId: string | null;
  idempotencyKey: string;
  createdAt: Date;
  settledAt: Date | null;
};

function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  return new Map([...map].map(([k, v]) => [k, { ...(v as object) } as V]));
}

function createFakeEscrowPrismaClient(initialWallets: readonly FakeWalletRow[]) {
  const wallets = new Map<string, FakeWalletRow>(initialWallets.map((w) => [w.id, { ...w }]));
  let transactions: FakeTransactionRow[] = [];
  const holds = new Map<string, FakeHoldRow>();
  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}-${(idCounter += 1)}`;

  const client: any = {
    wallet: {
      findUnique: async ({ where }: any) => {
        if (where.id) return wallets.get(where.id) ?? null;
        if (where.userId) return [...wallets.values()].find((w) => w.userId === where.userId) ?? null;
        return null;
      },
      updateMany: async ({ where, data }: any) => {
        const w = wallets.get(where.id);
        if (!w) return { count: 0 };
        if (where.balanceVIG?.gte != null && w.balanceVIG < where.balanceVIG.gte) return { count: 0 };
        if (data.balanceVIG?.decrement != null) w.balanceVIG -= data.balanceVIG.decrement;
        if (data.balanceVIG?.increment != null) w.balanceVIG += data.balanceVIG.increment;
        if (data.lockedBalanceVIG?.increment != null) w.lockedBalanceVIG += data.lockedBalanceVIG.increment;
        if (data.lockedBalanceVIG?.decrement != null) w.lockedBalanceVIG -= data.lockedBalanceVIG.decrement;
        return { count: 1 };
      },
      update: async ({ where, data }: any) => {
        const w = wallets.get(where.id);
        if (!w) throw new Error('fake: wallet not found');
        if (data.balanceVIG?.increment != null) w.balanceVIG += data.balanceVIG.increment;
        if (data.balanceVIG?.decrement != null) w.balanceVIG -= data.balanceVIG.decrement;
        if (data.lockedBalanceVIG?.increment != null) w.lockedBalanceVIG += data.lockedBalanceVIG.increment;
        if (data.lockedBalanceVIG?.decrement != null) w.lockedBalanceVIG -= data.lockedBalanceVIG.decrement;
        return { ...w };
      },
    },
    transaction: {
      create: async ({ data }: any) => {
        const row: FakeTransactionRow = { id: nextId('tx'), ...data };
        transactions.push(row);
        return row;
      },
    },
    vionaRequestEscrowHold: {
      findUnique: async ({ where }: any) => {
        if (where.id) return holds.get(where.id) ?? null;
        if (where.idempotencyKey) {
          return [...holds.values()].find((h) => h.idempotencyKey === where.idempotencyKey) ?? null;
        }
        return null;
      },
      create: async ({ data }: any) => {
        const row: FakeHoldRow = {
          settledAmountVIO: null,
          refundedAmountVIO: null,
          settleTransactionId: null,
          refundTransactionId: null,
          createdAt: new Date(),
          settledAt: null,
          ...data,
          id: nextId('hold'),
        };
        holds.set(row.id, row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = holds.get(where.id);
        if (!row) throw new Error('fake: hold not found');
        Object.assign(row, data);
        return { ...row };
      },
    },
    $transaction: async (callback: (tx: unknown) => unknown) => {
      const walletsSnapshot = cloneMap(wallets);
      const holdsSnapshot = cloneMap(holds);
      const transactionsSnapshot = [...transactions];
      try {
        return await callback(client);
      } catch (error) {
        wallets.clear();
        for (const [k, v] of walletsSnapshot) wallets.set(k, v);
        holds.clear();
        for (const [k, v] of holdsSnapshot) holds.set(k, v);
        transactions = transactionsSnapshot;
        throw error;
      }
    },
  };

  return {
    client: client as VionaEscrowHoldPrismaClient,
    getWallet: (id: string) => wallets.get(id)!,
    getHolds: () => [...holds.values()],
  };
}

type FakeAuditRow = Readonly<{ eventType: string; payloadJson: unknown }>;

function createFakeAuditWriter(): { writer: typeof appendVionaExecutionAuditEvent; rows: FakeAuditRow[] } {
  const rows: FakeAuditRow[] = [];
  const writer = (async (input: { requestId: string; eventType: string; payloadJson?: unknown }) => {
    rows.push({ eventType: input.eventType, payloadJson: input.payloadJson });
    return { ok: true as const, auditEventId: `fake-audit-${rows.length}` };
  }) as typeof appendVionaExecutionAuditEvent;
  return { writer, rows };
}

const WALLET_ID = 'wallet-pack32-5-1';
const USER_ID = 'user-pack32-5-1';
const REQUEST_ID = 'req-pack32-5-1';
const FROM_NUMBER = '+15005550006';
const TO_NUMBER = '+15005550006';

function freshWallet(balanceVIG: number): FakeWalletRow {
  return { id: WALLET_ID, userId: USER_ID, balanceVIG, lockedBalanceVIG: 0 };
}

function fakeGetVionaRequestByIdFn(): (input: {
  authUserId: string;
  requestId: string;
}) => Promise<GetVionaRequestByIdResult> {
  return async () => ({
    ok: true,
    data: {
      request: {
        id: REQUEST_ID,
        tenantId: 'tenant-1',
        requesterUserId: USER_ID,
        ownerUserId: USER_ID,
        sourceUniverse: 'local',
        sourceFeature: null,
        requestType: 'test',
        status: 'triage',
        title: 'Pack32.5 integration audit fixture',
        summary: 'fixture',
        locale: null,
        countryCode: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: null,
        display: { statusLabel: 'Triage', notProductionCopy: 'not production ready' },
      },
      participants: [],
      sourceLinks: [],
      statusEvents: [],
      auditEvents: [],
      attachmentReferences: [],
      safety: {
        readOnly: true,
        noPaymentCaptured: true,
        noBookingConfirmed: true,
        noSosDispatch: true,
        notProductionReady: true,
      },
    },
  });
}

function jsonLlm(): (prompt: string) => Promise<string> {
  return async () =>
    JSON.stringify({
      toolName: 'twilio_test_sms_poc',
      toolInputRaw: { fromNumber: FROM_NUMBER, toNumber: TO_NUMBER, body: 'Pack32.5 audit SMS' },
      confidence: 0.95,
      rationale: 'User explicitly asked for an SMS confirmation.',
    });
}

function successTransport(callCount: { count: number }): VionaTwilioHttpTransport {
  return async (): Promise<VionaTwilioHttpTransportResult> => {
    callCount.count += 1;
    return { status: 201, json: { sid: 'SMfakeaudit123' } };
  };
}

function timeoutTransport(callCount: { count: number }): VionaTwilioHttpTransport {
  return async (): Promise<VionaTwilioHttpTransportResult> => {
    callCount.count += 1;
    const error = new Error('simulated timeout');
    error.name = 'AbortError';
    throw error;
  };
}

function neverCalledTransport(callCount: { count: number }): VionaTwilioHttpTransport {
  return async (): Promise<VionaTwilioHttpTransportResult> => {
    callCount.count += 1;
    throw new Error('this transport must never be invoked in this scenario');
  };
}

/**
 * Builds a fully-wired `dispatchVionaAutonomousRequest` call using ONLY real business-logic
 * functions, with fakes injected exclusively at the DB / network / LLM edges.
 */
function buildFullyWiredDispatch(options: {
  wallet: FakeWalletRow;
  transport: VionaTwilioHttpTransport;
  auditWriter: typeof appendVionaExecutionAuditEvent;
}) {
  const escrow = createFakeEscrowPrismaClient([options.wallet]);
  const idempotencyStore = createInMemoryVionaTwilioRealExecutionIdempotencyStore();

  const call = () =>
    dispatchVionaAutonomousRequest(
      {
        authUserId: USER_ID,
        requestId: REQUEST_ID,
        requestStatus: 'triage',
        userMessage: 'Please send a test SMS to confirm the request.',
        operatorApprovalGranted: true,
        userConsentGranted: true,
      },
      {
        callLlm: jsonLlm(),
        auditWriter: options.auditWriter,
        routeExecutor: (routeInput) =>
          previewVionaExecutionPlanRealProviderPocRoute(routeInput, {
            getVionaRequestByIdFn: fakeGetVionaRequestByIdFn(),
            auditWriter: options.auditWriter,
            holdFn: (holdInput) =>
              holdVionaRequestExecutionCost(holdInput, {
                prismaClient: escrow.client,
                auditWriter: options.auditWriter,
              }),
            settleFn: (settleInput) =>
              settleVionaRequestExecutionHold(settleInput, {
                prismaClient: escrow.client,
                auditWriter: options.auditWriter,
              }),
            executeRealFn: (execInput) =>
              executeVionaTwilioTestPocReal(execInput, {
                isEnabled: () => true,
                circuitBreakerCheck: async () => ({ state: 'closed' }),
                credentials: { accountSid: 'ACfaketestaccount', authToken: 'fake-test-token' },
                transport: options.transport,
                auditWriter: options.auditWriter,
                idempotencyStore,
                sleepMs: async () => undefined, // skip the real retry backoff delay in tests
              }),
          }),
      },
    );

  return { call, escrow };
}

/** Scenario 1: happy path — correct tool selected, hold succeeds, real call succeeds, full settle. */
async function testScenario1HappyPathFullChain(): Promise<void> {
  const { writer, rows } = createFakeAuditWriter();
  const callCount = { count: 0 };
  const { call, escrow } = buildFullyWiredDispatch({
    wallet: freshWallet(10),
    transport: successTransport(callCount),
    auditWriter: writer,
  });

  const result = await call();

  assert(result.ok, 'scenario 1: dispatch call itself must not fail invalid_input');
  if (!result.ok) return;
  assert(result.dispatch.accepted === true, 'scenario 1: dispatch must be accepted');
  if (!result.dispatch.accepted || result.route == null) return;
  assert(result.route.ok === true, 'scenario 1: the route pipeline must report ok:true');
  if (!result.route.ok) return;
  const route = result.route;
  assert(route.planAllowed === true, 'scenario 1: the execution plan must be allowed');
  assert(route.escrow.attempted === true && route.escrow.holdOk === true, 'scenario 1: the escrow hold must succeed');
  if (!route.escrow.attempted || !route.escrow.holdOk) return;
  assert(
    route.escrow.resolvedStatus === 'SETTLED',
    'scenario 1: a successful real call must resolve the hold to SETTLED (full charge, no refund)',
  );
  assert(
    route.realProviderResult?.outcome.outcome === 'succeeded',
    'scenario 1: the real provider call must succeed against the fake transport',
  );
  assert(callCount.count === 1, 'scenario 1: the fake transport must be called exactly once');

  const wallet = escrow.getWallet(WALLET_ID);
  assert(
    Math.abs(wallet.balanceVIG - (10 - VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO)) < 1e-9,
    'scenario 1: exactly the estimated cost must be deducted from balanceVIG — no more, no less (Zero-Loss)',
  );
  assert(wallet.lockedBalanceVIG === 0, 'scenario 1: lockedBalanceVIG must be fully cleared after settle');

  const eventTypes = rows.map((r) => r.eventType);
  const requiredEvents = [
    'dispatcherToolSelected',
    'escrowHoldPlaced',
    'executionRealAttempted',
    'executionRealSucceeded',
    'escrowSettled',
  ];
  for (const eventType of requiredEvents) {
    assert(eventTypes.includes(eventType), `scenario 1: the audit ledger must include a "${eventType}" row`);
  }
  assert(rows.length >= 5, `scenario 1: the audit ledger must record at least 5 events, got ${rows.length}`);
}

/** Scenario 2: hold fails (insufficient VIO Credits) -> immediate fail-closed denial, zero network calls. */
async function testScenario2HoldFailBlocksBeforeAnyRealCall(): Promise<void> {
  const { writer, rows } = createFakeAuditWriter();
  const callCount = { count: 0 };
  const { call, escrow } = buildFullyWiredDispatch({
    wallet: freshWallet(0), // insufficient for even the 0.01 VIO estimate
    transport: neverCalledTransport(callCount),
    auditWriter: writer,
  });

  const result = await call();

  assert(result.ok, 'scenario 2: dispatch call itself must not fail invalid_input');
  if (!result.ok) return;
  assert(result.dispatch.accepted === true, 'scenario 2: the dispatcher itself must still accept the (valid) tool call');
  if (!result.dispatch.accepted || result.route == null) return;
  assert(result.route.ok === true, 'scenario 2: the route pipeline must report ok:true');
  if (!result.route.ok) return;
  const route = result.route;
  assert(route.planAllowed === true, 'scenario 2: the execution plan itself must still be allowed');
  assert(
    route.escrow.attempted === true && route.escrow.holdOk === false && route.escrow.reason === 'insufficient_funds',
    'scenario 2: the escrow hold must fail closed with insufficient_funds',
  );
  assert(route.realProviderResult === null, 'scenario 2: realProviderResult must be null — executeReal() was never reached');
  assert(callCount.count === 0, 'scenario 2: the real-provider transport must NEVER be called when the hold fails');

  const wallet = escrow.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 0 && wallet.lockedBalanceVIG === 0, 'scenario 2: the wallet must be completely untouched by a failed hold');

  const eventTypes = rows.map((r) => r.eventType);
  assert(eventTypes.includes('dispatcherToolSelected'), 'scenario 2: the dispatcher must still record which tool it selected');
  assert(
    eventTypes.includes('executionBlockedPolicy'),
    'scenario 2 (Pack32.5 fix verification): the hold failure must be durably recorded in the ledger, not just console-logged',
  );
  assert(!eventTypes.includes('escrowHoldPlaced'), 'scenario 2: no escrowHoldPlaced row may exist for a failed hold');
  assert(!eventTypes.includes('executionRealAttempted'), 'scenario 2: no executionRealAttempted row may exist — the real call was never reached');
}

/** Scenario 3: hold succeeds, the real call times out on both attempts -> full refund, wallet restored. */
async function testScenario3NetworkTimeoutTriggersFullRefund(): Promise<void> {
  const { writer, rows } = createFakeAuditWriter();
  const callCount = { count: 0 };
  const { call, escrow } = buildFullyWiredDispatch({
    wallet: freshWallet(10),
    transport: timeoutTransport(callCount),
    auditWriter: writer,
  });

  const result = await call();

  assert(result.ok, 'scenario 3: dispatch call itself must not fail invalid_input');
  if (!result.ok) return;
  assert(result.dispatch.accepted === true, 'scenario 3: dispatch must be accepted');
  if (!result.dispatch.accepted || result.route == null) return;
  assert(result.route.ok === true, 'scenario 3: the route pipeline must report ok:true');
  if (!result.route.ok) return;
  const route = result.route;
  assert(route.escrow.attempted === true && route.escrow.holdOk === true, 'scenario 3: the hold must succeed before the network timeout occurs');
  if (!route.escrow.attempted || !route.escrow.holdOk) return;
  assert(
    route.realProviderResult?.outcome.outcome === 'failedBounded' &&
      (route.realProviderResult.outcome as any).errorClass === 'provider_timeout',
    'scenario 3: a transport timeout must classify as failedBounded/provider_timeout',
  );
  assert(callCount.count === 2, 'scenario 3: a retryable timeout must be retried exactly once (2 attempts total)');
  assert(
    route.escrow.resolvedStatus === 'REFUNDED',
    'scenario 3: a fully-failed real call must resolve the hold to REFUNDED (zero real cost incurred)',
  );

  const wallet = escrow.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 10 && wallet.lockedBalanceVIG === 0, 'scenario 3: the wallet balance must be fully restored to its pre-hold value — no VIO Credits lost to a network failure');

  const eventTypes = rows.map((r) => r.eventType);
  assert(eventTypes.includes('executionRealFailedBounded'), 'scenario 3: the ledger must record the network-risk outcome');
  assert(eventTypes.includes('escrowRefunded'), 'scenario 3: the ledger must record the full refund');
}

/** Scenario 4 (race-condition regression): settle throws after a successful real call -> the real outcome must never be lost. */
async function testScenario4SettleThrowNeverLosesRealProviderResult(): Promise<void> {
  const { writer } = createFakeAuditWriter();
  const callCount = { count: 0 };
  const escrow = createFakeEscrowPrismaClient([freshWallet(10)]);
  const idempotencyStore = createInMemoryVionaTwilioRealExecutionIdempotencyStore();

  const result = await dispatchVionaAutonomousRequest(
    {
      authUserId: USER_ID,
      requestId: REQUEST_ID,
      requestStatus: 'triage',
      userMessage: 'Please send a test SMS to confirm the request.',
      operatorApprovalGranted: true,
      userConsentGranted: true,
    },
    {
      callLlm: jsonLlm(),
      auditWriter: writer,
      routeExecutor: (routeInput) =>
        previewVionaExecutionPlanRealProviderPocRoute(routeInput, {
          getVionaRequestByIdFn: fakeGetVionaRequestByIdFn(),
          auditWriter: writer,
          holdFn: (holdInput) => holdVionaRequestExecutionCost(holdInput, { prismaClient: escrow.client, auditWriter: writer }),
          // Simulated mid-settle DB error — the route service's own try/catch must convert this
          // to `{ ok: false, reason: 'settle_error' }` internally and still return the
          // already-known `realProviderResult` untouched.
          settleFn: async () => {
            throw new Error('simulated DB error during settle');
          },
          executeRealFn: (execInput) =>
            executeVionaTwilioTestPocReal(execInput, {
              isEnabled: () => true,
                circuitBreakerCheck: async () => ({ state: 'closed' }),
              credentials: { accountSid: 'ACfaketestaccount', authToken: 'fake-test-token' },
              transport: successTransport(callCount),
              auditWriter: writer,
              idempotencyStore,
            }),
        }),
    },
  );

  assert(result.ok, 'scenario 4: dispatch call itself must not fail invalid_input');
  if (!result.ok) return;
  assert(result.dispatch.accepted === true, 'scenario 4: dispatch must be accepted');
  if (!result.dispatch.accepted || result.route == null) return;
  assert(result.route.ok === true, 'scenario 4: the route pipeline must report ok:true');
  if (!result.route.ok) return;
  const route = result.route;
  assert(
    route.realProviderResult?.outcome.outcome === 'succeeded',
    'scenario 4: the already-known, already-succeeded realProviderResult must still be returned even though settle threw',
  );
  assert(route.escrow.attempted === true && route.escrow.holdOk === true, 'scenario 4: the hold itself must have succeeded before settle threw');
  if (!route.escrow.attempted || !route.escrow.holdOk) return;
  assert(
    route.escrow.resolvedStatus === null,
    'scenario 4: escrow.resolvedStatus must be null (unresolved) when settle throws — never silently reported as SETTLED',
  );

  // Documents the known, by-design reconciliation gap: a settle-throw leaves the hold row itself
  // stuck in HELD (VIO Credits remain locked, not lost) pending manual reconciliation — this is
  // the existing, intentional behavior (see vionaExecutionPlanRouteService.ts's own comment on
  // "flagged for reconciliation"), not a new Pack32.5 defect. Asserted here so a future change
  // that silently "fixes" this by auto-refunding is caught as an intentional behavior change.
  const holds = escrow.getHolds();
  assert(holds.length === 1 && holds[0]!.status === 'HELD', 'scenario 4: the hold must remain HELD (VIO Credits locked, never lost) pending manual reconciliation after a settle-throw');
}

async function main(): Promise<void> {
  await testScenario1HappyPathFullChain();
  await testScenario2HoldFailBlocksBeforeAnyRealCall();
  await testScenario3NetworkTimeoutTriggersFullRefund();
  await testScenario4SettleThrowNeverLosesRealProviderResult();
  console.log(
    'PASS Pack32.5 core system integration audit (4/4 end-to-end scenarios: happy path, hold-fail, network-timeout, settle-throw race condition)',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
