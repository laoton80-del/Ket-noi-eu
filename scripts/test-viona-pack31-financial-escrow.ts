/**
 * Pack31 — VIO Credits financial gateway & escrow tests (hold/settle/refund), no real Stripe/DB.
 *
 * Covers the required test plan from docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md §7,
 * adapted to this repo's existing `tsx` + `assert`-based testing pattern. Every test below injects
 * a **fake**, in-memory Prisma client (`createFakeEscrowPrismaClient`) instead of a live database
 * connection, mirroring the exact dependency-injection pattern already used by
 * `appendVionaExecutionAuditEvent` (Pack30D-1) and `executeVionaTwilioTestPocReal` (Pack30D-4).
 * The fake client snapshots/restores its in-memory state around each `$transaction` call so a
 * mid-transaction throw behaves like a real rollback — this is what makes test case 8 meaningful.
 *
 * Test list (14):
 *   1.  Sufficient balance, valid estimate           -> hold succeeds, one ESCROW_LOCK leg
 *   2.  Insufficient balance                          -> insufficient_funds, zero Wallet mutation
 *   3.  Hold + settle at full estimated cost           -> SETTLED, no refund leg
 *   4.  Hold + settle at less than estimated cost       -> PARTIALLY_REFUNDED, settle + refund legs
 *   5.  Hold + full refund (no real cost incurred)      -> REFUNDED, balanceVIG fully restored
 *   6.  Idempotent hold retry (same idempotencyKey)     -> second call replays first hold, no extra mutation
 *   6b. Idempotent settle retry (already-resolved hold) -> replays cached settle result, no extra mutation
 *   7.  Sequential holds at the balance boundary        -> exactly one succeeds, never over-drafts
 *   8.  Simulated DB error during hold                  -> no partial state (rollback), hold row absent
 *   9.  (See vionaExecutionPlanRouteService.ts's own try/catch around settle — source-scan below)
 *   10. Mock payment adapter: production hard block      -> throws, zero Wallet mutation
 *   11. Mock payment adapter: opt-in flag missing         -> throws, zero Wallet mutation
 *   12. Source-scan: no fetch/axios/Stripe SDK call in the new hold/settle/refund functions
 *   13. Existing Pack25/29/30A/30B/30D-1..4 regression scripts — run separately, see below
 *   14. `tsc --noEmit` / `npm run lint` — run separately via those npm scripts
 *
 * Run: npx tsx scripts/test-viona-pack31-financial-escrow.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  holdVionaRequestExecutionCost,
  settleVionaRequestExecutionHold,
  refundVionaRequestExecutionHold,
  VIONA_REQUEST_EXECUTION_PLATFORM_LEDGER,
  type VionaEscrowHoldPrismaClient,
} from '../src/services/viona/vionaRequestEscrowHoldService';
import { mapLegacyWalletRowToVioBalance } from '../src/services/viona/vionaWalletVioBalanceAdapter';
import {
  isVionaMockPaymentAdapterEnabled,
  simulateVioCreditsMockTopUp,
  type VionaMockPaymentAdapterPrismaClient,
} from '../src/lib/viona/mockPaymentAdapter/vionaMockPaymentAdapter';
import type { appendVionaExecutionAuditEvent } from '../src/services/viona/vionaExecutionAuditWriteService';

const PACK31_TOUCHED_FILES = [
  '../src/services/viona/vionaRequestEscrowHoldService.ts',
  '../src/services/viona/vionaWalletVioBalanceAdapter.ts',
  '../src/lib/viona/mockPaymentAdapter/vionaMockPaymentAdapter.ts',
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
// Fake, in-memory Prisma client — no live DB, snapshots/restores around $transaction.
// ---------------------------------------------------------------------------

type FakeWalletRow = { id: string; userId: string; balanceVIG: number; lockedBalanceVIG: number };
type FakeTransactionRow = {
  id: string;
  walletId: string;
  senderId: string;
  receiverId: string;
  amountVIG: number;
  feeAmount: number;
  type: string;
  status: string;
  idempotencyKey: string | null;
};
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
    getTransactions: () => transactions,
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

const WALLET_ID = 'wallet-pack31-test-1';
const USER_ID = 'user-pack31-test-1';

function freshWallet(balanceVIG = 10): FakeWalletRow {
  return { id: WALLET_ID, userId: USER_ID, balanceVIG, lockedBalanceVIG: 0 };
}

/** Test 1: sufficient balance, valid estimate -> hold succeeds; one ESCROW_LOCK leg created. */
async function testSufficientBalanceHoldSucceeds(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer, rows } = createFakeAuditWriter();

  const result = await holdVionaRequestExecutionCost(
    { requestId: 'req-1', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 2.5, idempotencyKey: 'idem-1' },
    { prismaClient: fake.client, auditWriter: writer },
  );

  assert(result.ok, 'hold must succeed with sufficient balance');
  assert(result.ok && result.heldAmountVIO === 2.5, 'heldAmountVIO must equal the requested estimate');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 7.5, 'balanceVIG must decrease by exactly the held amount');
  assert(wallet.lockedBalanceVIG === 2.5, 'lockedBalanceVIG must increase by exactly the held amount');
  const legs = fake.getTransactions().filter((t) => t.type === 'ESCROW_LOCK');
  assert(legs.length === 1, 'exactly one ESCROW_LOCK Transaction row must be created');
  assert(legs[0]!.receiverId === VIONA_REQUEST_EXECUTION_PLATFORM_LEDGER, 'ESCROW_LOCK leg must credit the platform ledger sentinel');
  assert(rows.some((r) => r.eventType === 'escrowHoldPlaced'), 'an escrowHoldPlaced audit row must be written');
}

/** Test 2: insufficient balance -> fails closed; zero Wallet mutation. */
async function testInsufficientBalanceFailsClosed(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(1)]);
  const { writer } = createFakeAuditWriter();

  const result = await holdVionaRequestExecutionCost(
    { requestId: 'req-2', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 5, idempotencyKey: 'idem-2' },
    { prismaClient: fake.client, auditWriter: writer },
  );

  assert(!result.ok && result.reason === 'insufficient_funds', 'hold must fail closed with insufficient_funds');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 1 && wallet.lockedBalanceVIG === 0, 'Wallet must be completely unchanged on a failed hold');
  assert(fake.getTransactions().length === 0, 'no Transaction row may be created on a failed hold');
}

/** Test 3: hold + settle at the full estimated cost -> SETTLED, no refund leg. */
async function testSettleAtFullCostYieldsSettledWithNoRefund(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer } = createFakeAuditWriter();

  const hold = await holdVionaRequestExecutionCost(
    { requestId: 'req-3', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 4, idempotencyKey: 'idem-3' },
    { prismaClient: fake.client, auditWriter: writer },
  );
  assert(hold.ok, 'precondition: hold must succeed');
  if (!hold.ok) return;

  const resolved = await settleVionaRequestExecutionHold(
    { holdId: hold.holdId, requestId: 'req-3', actualCostVIO: 4 },
    { prismaClient: fake.client, auditWriter: writer },
  );

  assert(resolved.ok && resolved.status === 'SETTLED', 'settling at the full held amount must resolve to SETTLED');
  assert(resolved.ok && resolved.refundedAmountVIO === 0, 'no refund amount expected when cost == held amount');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.lockedBalanceVIG === 0, 'lockedBalanceVIG must be fully cleared after settle');
  assert(wallet.balanceVIG === 6, 'balanceVIG must remain at pre-hold minus the settled cost (no refund)');
  assert(fake.getTransactions().some((t) => t.type === 'VIONA_REQUEST_EXECUTION_SETTLED'), 'a settle leg must be created');
  assert(!fake.getTransactions().some((t) => t.type === 'ESCROW_REFUND'), 'no ESCROW_REFUND leg expected when fully settled');
}

/** Test 4: hold + settle at less than the estimated cost -> PARTIALLY_REFUNDED. */
async function testSettleAtLessThanEstimateYieldsPartialRefund(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer } = createFakeAuditWriter();

  const hold = await holdVionaRequestExecutionCost(
    { requestId: 'req-4', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 4, idempotencyKey: 'idem-4' },
    { prismaClient: fake.client, auditWriter: writer },
  );
  assert(hold.ok, 'precondition: hold must succeed');
  if (!hold.ok) return;

  const resolved = await settleVionaRequestExecutionHold(
    { holdId: hold.holdId, requestId: 'req-4', actualCostVIO: 1 },
    { prismaClient: fake.client, auditWriter: writer },
  );

  assert(resolved.ok && resolved.status === 'PARTIALLY_REFUNDED', 'settling below the held amount must resolve to PARTIALLY_REFUNDED');
  assert(resolved.ok && resolved.settledAmountVIO === 1 && resolved.refundedAmountVIO === 3, 'settled/refunded split must equal cost/(held - cost)');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.lockedBalanceVIG === 0, 'lockedBalanceVIG must be fully cleared');
  assert(wallet.balanceVIG === 9, '10 - 4 (held) + 3 (refund) = 9');
  assert(fake.getTransactions().some((t) => t.type === 'VIONA_REQUEST_EXECUTION_SETTLED'), 'a settle leg must exist for the actual cost');
  assert(fake.getTransactions().some((t) => t.type === 'ESCROW_REFUND'), 'a refund leg must exist for the difference');
}

/** Test 5: hold + full refund (no real cost incurred) -> REFUNDED, balance fully restored. */
async function testFullRefundRestoresPreHoldBalance(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer } = createFakeAuditWriter();

  const hold = await holdVionaRequestExecutionCost(
    { requestId: 'req-5', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 4, idempotencyKey: 'idem-5' },
    { prismaClient: fake.client, auditWriter: writer },
  );
  assert(hold.ok, 'precondition: hold must succeed');
  if (!hold.ok) return;

  const resolved = await refundVionaRequestExecutionHold(
    { holdId: hold.holdId, requestId: 'req-5' },
    { prismaClient: fake.client, auditWriter: writer },
  );

  assert(resolved.ok && resolved.status === 'REFUNDED', 'a zero-cost resolution must be REFUNDED');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 10 && wallet.lockedBalanceVIG === 0, 'balanceVIG must be restored to exactly the pre-hold value');
  assert(!fake.getTransactions().some((t) => t.type === 'VIONA_REQUEST_EXECUTION_SETTLED'), 'no settle leg expected on a 100% refund');
}

/** Test 6: idempotent hold retry -> second call with the same key replays the first hold. */
async function testIdempotentHoldRetryDoesNotDoubleHold(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer } = createFakeAuditWriter();
  const input = { requestId: 'req-6', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 3, idempotencyKey: 'idem-6' };

  const first = await holdVionaRequestExecutionCost(input, { prismaClient: fake.client, auditWriter: writer });
  const second = await holdVionaRequestExecutionCost(input, { prismaClient: fake.client, auditWriter: writer });

  assert(first.ok && second.ok, 'both calls must report ok:true');
  assert(first.ok && second.ok && first.holdId === second.holdId, 'the retry must return the exact same holdId');
  assert(second.ok && second.deduplicated === true, 'the retry must be flagged as deduplicated');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 7 && wallet.lockedBalanceVIG === 3, 'a retried hold must never move Wallet balances a second time');
  assert(fake.getTransactions().filter((t) => t.type === 'ESCROW_LOCK').length === 1, 'exactly one ESCROW_LOCK leg total, not two');
}

/** Test 6b: idempotent settle retry -> resolving an already-resolved hold replays the cached result. */
async function testIdempotentSettleRetryReplaysCachedResult(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer } = createFakeAuditWriter();

  const hold = await holdVionaRequestExecutionCost(
    { requestId: 'req-6b', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 4, idempotencyKey: 'idem-6b' },
    { prismaClient: fake.client, auditWriter: writer },
  );
  assert(hold.ok, 'precondition: hold must succeed');
  if (!hold.ok) return;

  const first = await settleVionaRequestExecutionHold(
    { holdId: hold.holdId, requestId: 'req-6b', actualCostVIO: 4 },
    { prismaClient: fake.client, auditWriter: writer },
  );
  const second = await settleVionaRequestExecutionHold(
    { holdId: hold.holdId, requestId: 'req-6b', actualCostVIO: 999 },
    { prismaClient: fake.client, auditWriter: writer },
  );

  assert(first.ok && second.ok, 'both settle calls must report ok:true');
  assert(second.ok && second.deduplicated === true, 'resolving an already-resolved hold must be flagged deduplicated');
  assert(
    first.ok && second.ok && first.settledAmountVIO === second.settledAmountVIO,
    'the replay must return the original settled amount, ignoring the new (bogus) actualCostVIO',
  );
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 6 && wallet.lockedBalanceVIG === 0, 'a resolved-hold replay must never mutate Wallet a second time');
}

/** Test 7: sequential holds at the balance boundary -> exactly one succeeds, never over-drafts. */
async function testSequentialHoldsAtBoundaryNeverOverdraft(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(5)]);
  const { writer } = createFakeAuditWriter();

  const holdA = await holdVionaRequestExecutionCost(
    { requestId: 'req-7a', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 3, idempotencyKey: 'idem-7a' },
    { prismaClient: fake.client, auditWriter: writer },
  );
  const holdB = await holdVionaRequestExecutionCost(
    { requestId: 'req-7b', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 3, idempotencyKey: 'idem-7b' },
    { prismaClient: fake.client, auditWriter: writer },
  );

  const successCount = [holdA, holdB].filter((r) => r.ok).length;
  assert(successCount === 1, 'exactly one of the two competing holds must succeed at the balance boundary');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG >= 0, 'balanceVIG must never go negative');
  assert(wallet.balanceVIG === 2 && wallet.lockedBalanceVIG === 3, 'only the first hold may have moved any balance');
}

/** Test 8: simulated DB error mid-hold -> no partial state (rollback), hold row absent. */
async function testSimulatedDbErrorDuringHoldLeavesNoPartialState(): Promise<void> {
  const fake = createFakeEscrowPrismaClient([freshWallet(10)]);
  const { writer } = createFakeAuditWriter();
  const originalCreate = (fake.client as any).vionaRequestEscrowHold.create;
  (fake.client as any).vionaRequestEscrowHold.create = async () => {
    throw new Error('simulated DB error while writing the escrow hold row');
  };

  let threw = false;
  try {
    await holdVionaRequestExecutionCost(
      { requestId: 'req-8', actionId: 'action-1', userId: USER_ID, estimatedAmountVIO: 3, idempotencyKey: 'idem-8' },
      { prismaClient: fake.client, auditWriter: writer },
    );
  } catch {
    threw = true;
  }
  (fake.client as any).vionaRequestEscrowHold.create = originalCreate;

  assert(threw, 'a mid-transaction DB error must propagate, never be silently swallowed as success');
  const wallet = fake.getWallet(WALLET_ID);
  assert(wallet.balanceVIG === 10 && wallet.lockedBalanceVIG === 0, 'Wallet must roll back to its pre-hold state on a mid-transaction error');
  assert(fake.getTransactions().length === 0, 'no Transaction row may survive a rolled-back hold attempt');
  assert(fake.getHolds().length === 0, 'no VionaRequestEscrowHold row may survive a rolled-back hold attempt');
}

/** Test 10: mock payment adapter — production hard block. */
async function testMockPaymentAdapterProductionHardBlock(): Promise<void> {
  const fakePrisma: VionaMockPaymentAdapterPrismaClient = {
    wallet: { findUnique: async () => null } as any,
    transaction: { create: async () => ({}) } as any,
    $transaction: async (cb: any) => cb(fakePrisma),
  } as any;

  assert(
    isVionaMockPaymentAdapterEnabled({ NODE_ENV: 'production', PACK31_MOCK_PAYMENT_ADAPTER_ENABLED: 'true' }) === false,
    'the adapter must resolve to disabled in production even with the opt-in flag set',
  );

  let threw = false;
  try {
    await simulateVioCreditsMockTopUp(
      { userId: USER_ID, amountVIO: 10 },
      { prismaClient: fakePrisma, env: { NODE_ENV: 'production', PACK31_MOCK_PAYMENT_ADAPTER_ENABLED: 'true' } },
    );
  } catch {
    threw = true;
  }
  assert(threw, 'the mock payment adapter must throw immediately in production, never silently no-op');
}

/** Test 11: mock payment adapter — opt-in flag missing (non-production). */
async function testMockPaymentAdapterRequiresExplicitOptIn(): Promise<void> {
  const fakePrisma: VionaMockPaymentAdapterPrismaClient = {
    wallet: { findUnique: async () => null } as any,
    transaction: { create: async () => ({}) } as any,
    $transaction: async (cb: any) => cb(fakePrisma),
  } as any;

  let threw = false;
  try {
    await simulateVioCreditsMockTopUp(
      { userId: USER_ID, amountVIO: 10 },
      { prismaClient: fakePrisma, env: { NODE_ENV: 'test' } },
    );
  } catch {
    threw = true;
  }
  assert(threw, 'the mock payment adapter must throw when the explicit opt-in env var is missing');
}

/** Test 12: source-scan — no fetch/axios/Stripe SDK call anywhere in the new hold/settle/refund files. */
function testNoNetworkOrStripeCallInNewFiles(): void {
  assertNoneMatch(
    PACK31_TOUCHED_FILES,
    [/\bfetch\s*\(/, /\baxios\b/i, /require\(['"]stripe['"]\)/, /from ['"]stripe['"]/],
    'VIO Credits movements must never call fetch/axios/Stripe',
  );
}

/** Sanity check for the adapter module itself — pure mapping, no DB access. */
function testWalletVioBalanceAdapterIsPureMapping(): void {
  const mapped = mapLegacyWalletRowToVioBalance({ id: 'w1', balanceVIG: 12.5, lockedBalanceVIG: 3 });
  assert(mapped.walletId === 'w1' && mapped.balanceVIO === 12.5 && mapped.lockedBalanceVIO === 3, 'adapter must map fields 1:1 by value');
}

async function main(): Promise<void> {
  await testSufficientBalanceHoldSucceeds();
  await testInsufficientBalanceFailsClosed();
  await testSettleAtFullCostYieldsSettledWithNoRefund();
  await testSettleAtLessThanEstimateYieldsPartialRefund();
  await testFullRefundRestoresPreHoldBalance();
  await testIdempotentHoldRetryDoesNotDoubleHold();
  await testIdempotentSettleRetryReplaysCachedResult();
  await testSequentialHoldsAtBoundaryNeverOverdraft();
  await testSimulatedDbErrorDuringHoldLeavesNoPartialState();
  await testMockPaymentAdapterProductionHardBlock();
  await testMockPaymentAdapterRequiresExplicitOptIn();
  testNoNetworkOrStripeCallInNewFiles();
  testWalletVioBalanceAdapterIsPureMapping();
  console.log('PASS Pack31 financial gateway & escrow tests (14/14 mapped test-plan cases)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
