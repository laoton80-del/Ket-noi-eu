/**
 * Pack40DR2 — dormant recovery/reconciliation services (fake Prisma / adapters only).
 *
 * Operator phrase: APPROVE_PACK40DR2_DORMANT_RECOVERY_SERVICES
 * No DB, staging, Twilio, escrow mutation, HTTP, scheduler, or schema change.
 *
 * Run: npx tsx scripts/test-viona-pack40dr2-dormant-recovery-services.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  VionaRequestExecutionAttemptState,
  VionaRequestExecutionPrincipalType,
  VionaRequestExecutionTriggerType,
  VionaRequestScopeKind,
} from '@prisma/client';

import {
  acquireVionaRequestExecutionAttemptRecoveryLease,
  findVionaRequestExecutionAttemptForRecovery,
  transitionVionaRequestExecutionAttemptStateWithGeneration,
} from '../src/repositories/vionaRequestExecutionAttemptRepository';
import type { VionaProviderStatusLookupAdapter } from '../src/services/viona/vionaProviderStatusLookupContract';
import type { VionaRecoveryEscrowAdapter } from '../src/services/viona/vionaRecoveryEscrowAdapterContract';
import {
  reconcileEscrowForRecoveredProviderOutcome,
  VionaRequestEscrowReconciliationError,
} from '../src/services/viona/vionaRequestEscrowReconciliationService';
import {
  reconcileProviderOutcomeForRecovery,
  VionaRequestProviderReconciliationError,
} from '../src/services/viona/vionaRequestProviderReconciliationService';
import {
  finalizeRecoveredExecutionCompleted,
  finalizeRecoveredExecutionFailed,
  VionaRequestRecoveredFinalizationError,
} from '../src/services/viona/vionaRequestRecoveredFinalizationService';
import {
  acquireRecoveryLease,
  classifyRecoverableAttempt,
  VionaRequestRecoveryLeaseError,
} from '../src/services/viona/vionaRequestRecoveryLeaseService';
import {
  assertNotMasqueradingAsRecoveryPrincipal,
  createVionaRequestSystemRecoveryPrincipal,
  isVionaRequestSystemRecoveryPrincipal,
  PACK40DR2_PROVIDER_REFERENCE_RUNTIME_POPULATION_NOT_WIRED,
  VionaRequestSystemRecoveryPrincipalError,
} from '../src/services/viona/vionaRequestSystemRecoveryPrincipal';

const REPO_ROOT = path.resolve(__dirname, '..');

let passed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL: ${message}`);
    return;
  }
  passed += 1;
  console.log(`PASS: ${message}`);
}

function readUtf8(rel: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
}

type AttemptRow = {
  id: string;
  requestId: string;
  attemptNumber: number;
  executionKey: string;
  state: VionaRequestExecutionAttemptState;
  correlationId: string;
  principalType: VionaRequestExecutionPrincipalType;
  triggerType: VionaRequestExecutionTriggerType;
  triggeringUserId: string | null;
  ownerUserIdSnapshot: string;
  scopeKindSnapshot: VionaRequestScopeKind;
  merchantProfileIdSnapshot: string | null;
  tenantIdSnapshot: string;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  leaseGeneration: number;
  claimedAt: Date | null;
  providerName: string | null;
  operationCategory: string | null;
  providerIdempotencyKey: string | null;
  providerStartedAt: Date | null;
  providerFinishedAt: Date | null;
  providerResultDigest: string | null;
  providerExternalReferenceDigest: string | null;
  providerExternalReference: string | null;
  failureClass: string | null;
  failureReasonDigest: string | null;
  finalizedAt: Date | null;
  abandonedAt: Date | null;
};

type RequestRow = {
  id: string;
  status: string;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  tenantId: string;
  ownerUserId: string | null;
};

type FakeState = {
  attempts: Map<string, AttemptRow>;
  requests: Map<string, RequestRow>;
  statusEvents: Record<string, unknown>[];
  auditEvents: Record<string, unknown>[];
};

function baseAttempt(partial: Partial<AttemptRow> & Pick<AttemptRow, 'id' | 'state'>): AttemptRow {
  return {
    requestId: 'req-1',
    attemptNumber: 1,
    executionKey: `ek-${partial.id}`,
    correlationId: 'corr-1',
    principalType: VionaRequestExecutionPrincipalType.merchantService,
    triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
    triggeringUserId: 'user-op',
    ownerUserIdSnapshot: 'owner-1',
    scopeKindSnapshot: VionaRequestScopeKind.merchant,
    merchantProfileIdSnapshot: 'mp-1',
    tenantIdSnapshot: 'tenant-1',
    leaseOwner: 'worker-old',
    leaseExpiresAt: new Date('2020-01-01T00:00:00.000Z'),
    leaseGeneration: 0,
    claimedAt: new Date('2020-01-01T00:00:00.000Z'),
    providerName: 'twilio_test_sms',
    operationCategory: 'twilio_test_sms',
    providerIdempotencyKey: 'twilio_test_sms:req-1:a1:send',
    providerStartedAt: null,
    providerFinishedAt: null,
    providerResultDigest: null,
    providerExternalReferenceDigest: null,
    providerExternalReference: null,
    failureClass: null,
    failureReasonDigest: null,
    finalizedAt: null,
    abandonedAt: null,
    ...partial,
  };
}

function matchWhere(row: AttemptRow, where: Record<string, unknown>): boolean {
  if (where.id != null && row.id !== where.id) return false;
  if (where.requestId != null && row.requestId !== where.requestId) return false;
  if (where.leaseOwner !== undefined && row.leaseOwner !== where.leaseOwner) return false;
  if (where.leaseGeneration !== undefined && row.leaseGeneration !== where.leaseGeneration) {
    return false;
  }
  if (where.providerName != null && row.providerName !== where.providerName) return false;
  if (where.operationCategory != null && row.operationCategory !== where.operationCategory) {
    return false;
  }
  if (
    where.providerIdempotencyKey !== undefined &&
    row.providerIdempotencyKey !== where.providerIdempotencyKey
  ) {
    return false;
  }
  if (where.state != null) {
    const state = where.state as { in?: string[] } | string;
    if (typeof state === 'string') {
      if (row.state !== state) return false;
    } else if (state.in != null && !state.in.includes(row.state)) {
      return false;
    }
  }
  if (Array.isArray(where.OR)) {
    const ok = where.OR.some((clause) => {
      const c = clause as Record<string, unknown>;
      if (c.leaseOwner === null && row.leaseOwner == null) return true;
      if (c.leaseExpiresAt != null) {
        const lte = (c.leaseExpiresAt as { lte?: Date }).lte;
        if (lte != null && row.leaseExpiresAt != null && row.leaseExpiresAt.getTime() <= lte.getTime()) {
          return true;
        }
      }
      return false;
    });
    if (!ok) return false;
  }
  return true;
}

function applyData(row: AttemptRow, data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    if (key === 'leaseGeneration' && value != null && typeof value === 'object' && 'increment' in value) {
      row.leaseGeneration += Number((value as { increment: number }).increment);
      continue;
    }
    (row as Record<string, unknown>)[key] = value;
  }
}

function makeFakePrisma(state: FakeState) {
  const attemptClient = {
    findUnique: async ({ where, select }: { where: { id?: string }; select?: unknown }) => {
      const row = where.id != null ? state.attempts.get(where.id) ?? null : null;
      if (row == null) return null;
      if (select == null) return { ...row };
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(select as object)) {
        out[key] = (row as Record<string, unknown>)[key];
      }
      return out;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => {
      let count = 0;
      for (const row of state.attempts.values()) {
        if (!matchWhere(row, where)) continue;
        applyData(row, data);
        count += 1;
      }
      return { count };
    },
    findFirst: async () => null,
    findMany: async () => [],
    create: async () => {
      throw new Error('unexpected create');
    },
  };

  type FakePrisma = {
    vionaRequestExecutionAttempt: typeof attemptClient;
    vionaRequest: {
      findUnique: (args: { where: { id: string } }) => Promise<RequestRow | null>;
      findFirst: (args: {
        where: { id: string; status?: string };
      }) => Promise<RequestRow | null>;
      updateMany: (args: {
        where: { id: string; status: string };
        data: { status: string };
      }) => Promise<{ count: number }>;
    };
    merchantProfile: {
      findUnique: () => Promise<{ id: string; isActive: boolean }>;
    };
    vionaRequestStatusEvent: {
      create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    };
    vionaRequestAuditEvent: {
      create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    };
    $transaction: (
      fn: (tx: FakePrisma) => Promise<unknown>,
      _opts?: unknown,
    ) => Promise<unknown>;
  };

  const prisma: FakePrisma = {
    vionaRequestExecutionAttempt: attemptClient,
    vionaRequest: {
      findUnique: async ({ where }) => state.requests.get(where.id) ?? null,
      findFirst: async ({ where }) => {
        const row = state.requests.get(where.id);
        if (row == null) return null;
        if (where.status != null && row.status !== where.status) return null;
        return row;
      },
      updateMany: async ({ where, data }) => {
        const row = state.requests.get(where.id);
        if (row == null || row.status !== where.status) return { count: 0 };
        row.status = data.status;
        return { count: 1 };
      },
    },
    merchantProfile: {
      findUnique: async () => ({ id: 'mp-1', isActive: true }),
    },
    vionaRequestStatusEvent: {
      create: async ({ data }) => {
        const id = (data.id as string) ?? `se-${state.statusEvents.length + 1}`;
        const row = { ...data, id };
        state.statusEvents.push(row);
        return row;
      },
    },
    vionaRequestAuditEvent: {
      create: async ({ data }) => {
        const id = (data.id as string) ?? `ae-${state.auditEvents.length + 1}`;
        const row = { ...data, id };
        state.auditEvents.push(row);
        return row;
      },
    },
    $transaction: async (fn, _opts?) => fn(prisma),
  };

  return prisma;
}

function makeEscrowAdapter(opts: {
  status?: 'HELD' | 'SETTLED' | 'REFUNDED';
  failSettle?: boolean;
  failRefund?: boolean;
  uncertain?: boolean;
}): VionaRecoveryEscrowAdapter & { settleCalls: number; refundCalls: number } {
  let status = opts.status ?? 'HELD';
  const adapter = {
    settleCalls: 0,
    refundCalls: 0,
    async inspectExactHold(input: {
      requestId: string;
      executionAttemptId: string;
      operationCategory: string;
    }) {
      return {
        holdId: 'hold-1',
        requestId: input.requestId,
        idempotencyKey: `escrow:${input.requestId}:${input.executionAttemptId}:${input.operationCategory}`,
        status,
        heldAmountVIO: 0.01,
      };
    },
    async settleExactHoldIdempotently() {
      adapter.settleCalls += 1;
      if (opts.uncertain) return { ok: false, status, deduplicated: false, uncertainty: true };
      if (opts.failSettle) return { ok: false, status, deduplicated: false };
      const deduplicated = status === 'SETTLED';
      status = 'SETTLED';
      return { ok: true, status, deduplicated };
    },
    async releaseOrRefundExactHoldIdempotently() {
      adapter.refundCalls += 1;
      if (opts.uncertain) return { ok: false, status, deduplicated: false, uncertainty: true };
      if (opts.failRefund) return { ok: false, status, deduplicated: false };
      const deduplicated = status === 'REFUNDED';
      status = 'REFUNDED';
      return { ok: true, status, deduplicated };
    },
  };
  return adapter;
}

function makeLookup(
  result: Awaited<ReturnType<VionaProviderStatusLookupAdapter['lookupExactOperation']>>,
  tracker?: { calls: number; refs: string[] },
): VionaProviderStatusLookupAdapter {
  return {
    providerName: 'twilio_test_sms',
    async lookupExactOperation(input) {
      if (tracker) {
        tracker.calls += 1;
        tracker.refs.push(input.providerExternalReference);
      }
      return result;
    },
  };
}

async function main(): Promise<void> {
  const principal = createVionaRequestSystemRecoveryPrincipal({
    triggeringUserId: 'operator-1',
    correlationId: 'corr-rec-1',
  });

  // 1–8 principal
  assert(isVionaRequestSystemRecoveryPrincipal(principal), '1. trusted recovery principal accepted');
  try {
    createVionaRequestSystemRecoveryPrincipal({ triggeringUserId: '', correlationId: 'x' });
    assert(false, '5. missing operator identity rejected');
  } catch (e) {
    assert(
      e instanceof VionaRequestSystemRecoveryPrincipalError,
      '5. missing operator identity rejected',
    );
  }
  try {
    assertNotMasqueradingAsRecoveryPrincipal({ principalType: 'authenticatedUser' });
    assert(false, '2. public customer principal rejected');
  } catch {
    assert(true, '2. public customer principal rejected');
  }
  try {
    assertNotMasqueradingAsRecoveryPrincipal({
      principalType: 'merchantService',
      triggerType: 'internalAuthenticatedController',
    });
    assert(false, '3. merchant principal cannot masquerade');
  } catch {
    assert(true, '3. merchant principal cannot masquerade');
  }
  try {
    assertNotMasqueradingAsRecoveryPrincipal({ tenantId: 't1', merchantProfileId: 'm1' });
    assert(false, '4. tenant/profile input cannot establish recovery authority');
  } catch {
    assert(true, '4. tenant/profile input cannot establish recovery authority');
  }
  assert(
    !readUtf8('prisma/schema.prisma').includes('systemRecovery'),
    '6. no new execution principal enum value persisted',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestSystemRecoveryPrincipal.ts').includes(
      'createVionaRequestExecutionAttempt',
    ),
    '7. principal module cannot create a new attempt',
  );
  assert(
    !/sendMessage|createMessage|invokeProviderSend/.test(
      readUtf8('src/services/viona/vionaProviderStatusLookupContract.ts'),
    ),
    '8. principal/status contract cannot start provider send',
  );

  // 9–20 lease generation
  {
    const state: FakeState = {
      attempts: new Map([
        [
          'a1',
          baseAttempt({
            id: 'a1',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: 'SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            leaseGeneration: 2,
          }),
        ],
      ]),
      requests: new Map(),
      statusEvents: [],
      auditEvents: [],
    };
    const prisma = makeFakePrisma(state);
    const acquired = await acquireRecoveryLease(
      {
        attemptId: 'a1',
        expectedLeaseGeneration: 2,
        newLeaseOwner: 'recovery-worker-1',
        newLeaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        recoveryPrincipal: principal,
        now: new Date('2026-01-01T00:00:00.000Z'),
      },
      { prisma: prisma as never, clock: () => new Date('2026-01-01T00:00:00.000Z') },
    );
    assert(acquired.leaseGeneration === 3, '9/10. expired lease acquired; generation increments once');
    assert(acquired.leaseOwner === 'recovery-worker-1', '11. lease owner changes atomically');
    assert(acquired.leaseExpiresAt.toISOString().startsWith('2030'), '12. lease expiry changes atomically');
    assert(state.attempts.get('a1')!.state === VionaRequestExecutionAttemptState.providerPending, '19. no attempt-state mutation during lease acquisition');

    state.attempts.get('a1')!.leaseExpiresAt = new Date('2035-01-01T00:00:00.000Z');
    try {
      await acquireRecoveryLease(
        {
          attemptId: 'a1',
          expectedLeaseGeneration: 3,
          newLeaseOwner: 'thief',
          newLeaseExpiresAt: new Date('2036-01-01T00:00:00.000Z'),
          recoveryPrincipal: principal,
          now: new Date('2026-01-01T00:00:00.000Z'),
        },
        { prisma: prisma as never },
      );
      assert(false, '13. unexpired lease cannot be stolen');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveryLeaseError && e.code === 'lease_not_expired',
        '13. unexpired lease cannot be stolen',
      );
    }

    state.attempts.get('a1')!.leaseExpiresAt = new Date('2020-01-01T00:00:00.000Z');
    try {
      await acquireRecoveryLease(
        {
          attemptId: 'a1',
          expectedLeaseGeneration: 2,
          newLeaseOwner: 'stale',
          newLeaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '14. wrong expected generation fails');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveryLeaseError && e.code === 'stale_lease_generation',
        '14. wrong expected generation fails',
      );
    }

    const casMiss = await acquireVionaRequestExecutionAttemptRecoveryLease(
      { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt } as never,
      {
        attemptId: 'a1',
        expectedLeaseGeneration: 99,
        expectedStates: [VionaRequestExecutionAttemptState.providerPending],
        newLeaseOwner: 'x',
        newLeaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        now: new Date('2026-01-01T00:00:00.000Z'),
      },
    );
    assert(!casMiss.updated, '15/16. stale generation CAS miss observable; no auto-retry');
  }

  assert(
    !readUtf8('src/services/viona/vionaRequestRecoveryLeaseService.ts').includes('while ('),
    '17. no automatic retry loop in lease service',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestRecoveryLeaseService.ts').includes('vionaRequest.update'),
    '18. no request status mutation during lease acquisition',
  );
  assert(
    readUtf8('src/repositories/vionaRequestExecutionAttemptRepository.ts').includes(
      'leaseGeneration: { increment: 1 }',
    ),
    '20. immutable snapshots not overwritten by lease CAS (generation increment only)',
  );

  // 21–28 state policy
  {
    const claimed = baseAttempt({ id: 'c1', state: VionaRequestExecutionAttemptState.claimed });
    assert(
      classifyRecoverableAttempt(claimed).classification ===
        'unstarted_attempt_requires_operator_decision',
      '21. expired claimed → operator review, not provider invocation',
    );
    const pendingNoRef = baseAttempt({
      id: 'p1',
      state: VionaRequestExecutionAttemptState.providerPending,
      providerExternalReference: null,
    });
    assert(
      classifyRecoverableAttempt(pendingNoRef).classification ===
        'provider_reference_missing_operator_review',
      '22/23. providerPending requires exact provider reference',
    );
    assert(
      classifyRecoverableAttempt(
        baseAttempt({
          id: 's1',
          state: VionaRequestExecutionAttemptState.providerSucceeded,
        }),
      ).classification === 'eligible_success_escrow_finalization',
      '24. providerSucceeded eligible for success reconciliation',
    );
    assert(
      classifyRecoverableAttempt(
        baseAttempt({ id: 'f1', state: VionaRequestExecutionAttemptState.providerFailed }),
      ).classification === 'eligible_failure_escrow_finalization',
      '25. providerFailed eligible for failure reconciliation',
    );
    assert(
      classifyRecoverableAttempt(
        baseAttempt({
          id: 'u1',
          state: VionaRequestExecutionAttemptState.outcomeUncertain,
          providerExternalReference: 'SMbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        }),
      ).classification === 'eligible_provider_reconciliation',
      '26. outcomeUncertain cannot finalize directly (recon only)',
    );
    assert(
      classifyRecoverableAttempt(
        baseAttempt({ id: 't1', state: VionaRequestExecutionAttemptState.completed }),
      ).classification === 'terminal_immutable',
      '27. terminal attempts immutable',
    );
    assert(
      !fs
        .readdirSync(path.join(REPO_ROOT, 'src/services/viona'))
        .some((f) => /abandon/i.test(f)) &&
        !readUtf8('src/services/viona/vionaRequestRecoveryLeaseService.ts').includes(
          'abandonAttempt',
        ),
      '28. no abandonment without approved request-state policy',
    );
  }

  // 29–44 provider lookup
  {
    const tracker = { calls: 0, refs: [] as string[] };
    const state: FakeState = {
      attempts: new Map([
        [
          'a2',
          baseAttempt({
            id: 'a2',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: 'SMcccccccccccccccccccccccccccccccc',
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
          }),
        ],
      ]),
      requests: new Map([
        [
          'req-1',
          {
            id: 'req-1',
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
      statusEvents: [],
      auditEvents: [],
    };
    const prisma = makeFakePrisma(state);

    try {
      await reconcileProviderOutcomeForRecovery(
        {
          attemptId: 'a2',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
          callerSuppliedProviderReference: 'SMshouldreject',
        },
        {
          prisma: prisma as never,
          providerStatusLookup: makeLookup(
            { classification: 'knownSuccess', resultDigest: 'digest-ok' },
            tracker,
          ),
        },
      );
      assert(false, '30. caller-supplied reference rejected');
    } catch (e) {
      assert(
        e instanceof VionaRequestProviderReconciliationError &&
          e.code === 'caller_supplied_reference_rejected',
        '30. caller-supplied reference rejected',
      );
    }

    const success = await reconcileProviderOutcomeForRecovery(
      {
        attemptId: 'a2',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      {
        prisma: prisma as never,
        providerStatusLookup: makeLookup(
          { classification: 'knownSuccess', resultDigest: 'digest-ok' },
          tracker,
        ),
      },
    );
    assert(
      success.classification === 'provider_reconciled_success' &&
        state.attempts.get('a2')!.state === VionaRequestExecutionAttemptState.providerSucceeded,
      '29/34. exact persisted reference used; known success → providerSucceeded',
    );
    assert(tracker.refs[0] === 'SMcccccccccccccccccccccccccccccccc', '29. exact persisted reference used');
    assert(tracker.calls === 1, '37. lookup called once (no blind retry on success path)');

    // reset for failure path
    state.attempts.set(
      'a3',
      baseAttempt({
        id: 'a3',
        state: VionaRequestExecutionAttemptState.outcomeUncertain,
        providerExternalReference: 'SMdddddddddddddddddddddddddddddddd',
        leaseOwner: 'rec-1',
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 1,
      }),
    );
    const fail = await reconcileProviderOutcomeForRecovery(
      {
        attemptId: 'a3',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      {
        prisma: prisma as never,
        providerStatusLookup: makeLookup({
          classification: 'knownFailure',
          failureClass: 'not_created',
          failureDigest: 'fd1',
        }),
      },
    );
    assert(
      fail.classification === 'provider_reconciled_failure' &&
        state.attempts.get('a3')!.state === VionaRequestExecutionAttemptState.providerFailed,
      '35. proven known failure → providerFailed',
    );

    state.attempts.set(
      'a4',
      baseAttempt({
        id: 'a4',
        state: VionaRequestExecutionAttemptState.providerPending,
        providerExternalReference: 'SMeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        leaseOwner: 'rec-1',
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 1,
      }),
    );
    const uncertain = await reconcileProviderOutcomeForRecovery(
      {
        attemptId: 'a4',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      {
        prisma: prisma as never,
        providerStatusLookup: makeLookup({
          classification: 'stillUncertain',
          uncertaintyDigest: 'u1',
        }),
      },
    );
    assert(
      uncertain.classification === 'provider_remains_uncertain' &&
        state.attempts.get('a4')!.state === VionaRequestExecutionAttemptState.outcomeUncertain,
      '36. unknown remains outcomeUncertain',
    );

    const transportTracker = { calls: 0, refs: [] as string[] };
    state.attempts.set(
      'a5',
      baseAttempt({
        id: 'a5',
        state: VionaRequestExecutionAttemptState.providerPending,
        providerExternalReference: 'SMffffffffffffffffffffffffffffffff',
        leaseOwner: 'rec-1',
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 1,
      }),
    );
    const transport = await reconcileProviderOutcomeForRecovery(
      {
        attemptId: 'a5',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      {
        prisma: prisma as never,
        providerStatusLookup: makeLookup(
          {
            classification: 'lookupTransportUncertain',
            uncertaintyDigest: 'timeout',
          },
          transportTracker,
        ),
      },
    );
    assert(
      transport.classification === 'lookup_transport_uncertain_operator_review' &&
        transportTracker.calls === 1 &&
        state.attempts.get('a5')!.state === VionaRequestExecutionAttemptState.providerPending,
      '37. lookup timeout → no blind retry; state retained',
    );

    try {
      await reconcileProviderOutcomeForRecovery(
        {
          attemptId: 'a5',
          expectedLeaseOwner: 'wrong',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        {
          prisma: prisma as never,
          providerStatusLookup: makeLookup({
            classification: 'knownSuccess',
            resultDigest: 'x',
          }),
        },
      );
      assert(false, '42. wrong recovery lease owner cannot record result');
    } catch (e) {
      assert(
        e instanceof VionaRequestProviderReconciliationError && e.code === 'stale_lease_owner',
        '42. wrong recovery lease owner cannot record result',
      );
    }

    try {
      await reconcileProviderOutcomeForRecovery(
        {
          attemptId: 'a5',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 99,
          recoveryPrincipal: principal,
        },
        {
          prisma: prisma as never,
          providerStatusLookup: makeLookup({
            classification: 'knownSuccess',
            resultDigest: 'x',
          }),
        },
      );
      assert(false, '41. stale generation cannot record provider result');
    } catch (e) {
      assert(
        e instanceof VionaRequestProviderReconciliationError && e.code === 'stale_lease_generation',
        '41. stale generation cannot record provider result',
      );
    }
  }

  assert(
    !readUtf8('src/services/viona/vionaProviderStatusLookupContract.ts').includes('listMessages') &&
      !readUtf8('src/services/viona/vionaProviderStatusLookupContract.ts').includes('destination'),
    '31/32. no broad listing / destination lookup in contract',
  );
  assert(
    !readUtf8('src/services/viona/vionaProviderStatusLookupContract.ts').includes('sendMessage'),
    '33. no provider send method exists',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
      'payloadJson: lookup',
    ),
    '38. raw provider payload not stored',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
      'providerExternalReference:',
    ) ||
      readUtf8('src/services/viona/vionaRequestRecoveredFinalizationService.ts').includes(
        'leaseGeneration',
      ),
    '39. recovery audits bind generation metadata (no raw SID in finalize payload contract)',
  );
  assert(
    readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
      'outside',
    ) ||
      readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
        'Phase 3',
      ),
    '44. provider lookup occurs outside transaction (documented/phased)',
  );
  assert(
    readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
      'Serializable',
    ),
    '43. result-record transaction uses Serializable isolation',
  );
  assert(
    readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
      'cas_miss',
    ),
    '40. another attempt cannot reuse result via CAS miss path',
  );

  // 45–56 escrow
  {
    const state: FakeState = {
      attempts: new Map([
        [
          'e1',
          baseAttempt({
            id: 'e1',
            state: VionaRequestExecutionAttemptState.providerSucceeded,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
          }),
        ],
        [
          'e2',
          baseAttempt({
            id: 'e2',
            state: VionaRequestExecutionAttemptState.providerFailed,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
          }),
        ],
        [
          'e3',
          baseAttempt({
            id: 'e3',
            state: VionaRequestExecutionAttemptState.outcomeUncertain,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
            providerExternalReference: 'SMgggggggggggggggggggggggggggggggg',
          }),
        ],
      ]),
      requests: new Map(),
      statusEvents: [],
      auditEvents: [],
    };
    const prisma = makeFakePrisma(state);
    const settleAdapter = makeEscrowAdapter({});
    const settled = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'e1',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: settleAdapter },
    );
    assert(settled.holdStatus === 'SETTLED' && settleAdapter.refundCalls === 0, '45/46. success settles, never refunds');
    const settled2 = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'e1',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: settleAdapter },
    );
    assert(settled2.deduplicated === true, '49. duplicate settlement idempotent');

    const refundAdapter = makeEscrowAdapter({});
    const refunded = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'e2',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: refundAdapter },
    );
    assert(refunded.holdStatus === 'REFUNDED' && refundAdapter.settleCalls === 0, '47. failure refunds, never settles');
    const refunded2 = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'e2',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: refundAdapter },
    );
    assert(refunded2.deduplicated === true, '50. duplicate refund idempotent');

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'e3',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({}) },
      );
      assert(false, '48. outcome uncertain performs no escrow mutation');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError &&
          e.code === 'outcome_uncertain_escrow_forbidden',
        '48. outcome uncertain performs no escrow mutation',
      );
    }

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'e1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
          expectedEscrowIdempotencyKey: 'escrow:req-1:twilio_test_sms',
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({}) },
      );
      assert(false, '52. request-only escrow key rejected');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError && e.code === 'escrow_key_mismatch',
        '51/52. wrong/request-only escrow key rejected',
      );
    }

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'e1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({ failSettle: true }) },
      );
      assert(false, '53. settlement failure prevents completion path');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError && e.code === 'escrow_operation_failed',
        '53. settlement failure prevents completion path',
      );
    }

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'e2',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({ failRefund: true }) },
      );
      assert(false, '54. refund failure prevents failed finalization path');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError && e.code === 'escrow_operation_failed',
        '54. refund failure prevents failed finalization path',
      );
    }

    assert(
      !readUtf8('src/services/viona/vionaRequestEscrowReconciliationService.ts').includes(
        'lookupExactOperation',
      ),
      '55. provider never called during escrow reconciliation',
    );

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'e1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 99,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({}) },
      );
      assert(false, '56. stale generation prevents escrow-driven finalization');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError && e.code === 'stale_lease_generation',
        '56. stale generation prevents escrow-driven finalization',
      );
    }
  }

  // 57–78 recovered completion/failure
  {
    const state: FakeState = {
      attempts: new Map([
        [
          'fin1',
          baseAttempt({
            id: 'fin1',
            state: VionaRequestExecutionAttemptState.providerSucceeded,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 4,
          }),
        ],
        [
          'fin2',
          baseAttempt({
            id: 'fin2',
            state: VionaRequestExecutionAttemptState.providerFailed,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 4,
          }),
        ],
      ]),
      requests: new Map([
        [
          'req-1',
          {
            id: 'req-1',
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
      statusEvents: [],
      auditEvents: [],
    };
    const prisma = makeFakePrisma(state);
    const completed = await finalizeRecoveredExecutionCompleted(
      {
        attemptId: 'fin1',
        requestId: 'req-1',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 4,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never },
    );
    assert(
      completed.attemptState === 'completed' &&
        completed.requestStatus === 'completed' &&
        state.requests.get('req-1')!.status === 'completed',
      '57/58/59. providerSucceeded + settled completes request/attempt',
    );
    assert(state.statusEvents.length === 1 && state.auditEvents.length === 1, '60. event/audit atomic with terminal writes');
    const completedDup = await finalizeRecoveredExecutionCompleted(
      {
        attemptId: 'fin1',
        requestId: 'req-1',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 4,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never },
    );
    assert(
      completedDup.idempotentReplay === true && state.statusEvents.length === 1,
      '68. duplicate completion creates no duplicate event/audit',
    );

    // reset request for failure path
    state.requests.get('req-1')!.status = 'inProgress';
    const failed = await finalizeRecoveredExecutionFailed(
      {
        attemptId: 'fin2',
        requestId: 'req-1',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 4,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never },
    );
    assert(
      failed.attemptState === 'failed' && failed.requestStatus === 'failed',
      '69/70/71. providerFailed fails request/attempt',
    );
    assert(state.statusEvents.length === 2 && state.auditEvents.length === 2, '72. failure event/audit atomic');
    const failedDup = await finalizeRecoveredExecutionFailed(
      {
        attemptId: 'fin2',
        requestId: 'req-1',
        expectedLeaseOwner: 'rec-1',
        expectedLeaseGeneration: 4,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never },
    );
    assert(failedDup.idempotentReplay === true && state.statusEvents.length === 2, '78. duplicate failure no extra events');

    state.attempts.set(
      'fin3',
      baseAttempt({
        id: 'fin3',
        requestId: 'req-2',
        state: VionaRequestExecutionAttemptState.providerSucceeded,
        leaseOwner: 'rec-1',
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 1,
      }),
    );
    state.requests.set('req-2', {
      id: 'req-2',
      status: 'triage',
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: 'mp-1',
      tenantId: 'tenant-1',
      ownerUserId: 'owner-1',
    });
    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'fin3',
          requestId: 'req-2',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '63. wrong request status blocks completion');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'wrong_request_status',
        '63. wrong request status blocks completion',
      );
    }

    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'fin3',
          requestId: 'req-1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '64. wrong attempt/request binding blocks completion');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError &&
          (e.code === 'request_attempt_mismatch' || e.code === 'wrong_request_status'),
        '64. wrong attempt/request binding blocks completion',
      );
    }

    state.requests.get('req-1')!.status = 'inProgress';
    state.attempts.set(
      'fin4',
      baseAttempt({
        id: 'fin4',
        requestId: 'req-1',
        state: VionaRequestExecutionAttemptState.providerSucceeded,
        leaseOwner: 'rec-1',
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 1,
      }),
    );
    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'fin4',
          requestId: 'req-1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 9,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '65. wrong generation blocks completion');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'stale_lease_generation',
        '65. wrong generation blocks completion',
      );
    }
    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'fin4',
          requestId: 'req-1',
          expectedLeaseOwner: 'wrong',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '66. wrong lease owner blocks completion');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'stale_lease_owner',
        '66. wrong lease owner blocks completion',
      );
    }
    state.attempts.get('fin4')!.leaseExpiresAt = new Date('2020-01-01T00:00:00.000Z');
    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'fin4',
          requestId: 'req-1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '67. expired recovery lease blocks completion');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'expired_recovery_lease',
        '67. expired recovery lease blocks completion',
      );
    }

    // failure wrong status / generation / owner
    state.attempts.set(
      'fin5',
      baseAttempt({
        id: 'fin5',
        requestId: 'req-1',
        state: VionaRequestExecutionAttemptState.providerFailed,
        leaseOwner: 'rec-1',
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 1,
      }),
    );
    state.requests.get('req-1')!.status = 'completed';
    try {
      await finalizeRecoveredExecutionFailed(
        {
          attemptId: 'fin5',
          requestId: 'req-1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '75. wrong request status blocks failure');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'wrong_request_status',
        '75. wrong request status blocks failure',
      );
    }
    state.requests.get('req-1')!.status = 'inProgress';
    try {
      await finalizeRecoveredExecutionFailed(
        {
          attemptId: 'fin5',
          requestId: 'req-1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 8,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '76. wrong generation blocks failure');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'stale_lease_generation',
        '76. wrong generation blocks failure',
      );
    }
    try {
      await finalizeRecoveredExecutionFailed(
        {
          attemptId: 'fin5',
          requestId: 'req-1',
          expectedLeaseOwner: 'nope',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '77. wrong lease owner blocks failure');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'stale_lease_owner',
        '77. wrong lease owner blocks failure',
      );
    }
  }

  // Atomic rollback: simulate audit failure
  {
    const state: FakeState = {
      attempts: new Map([
        [
          'rb1',
          baseAttempt({
            id: 'rb1',
            state: VionaRequestExecutionAttemptState.providerSucceeded,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
          }),
        ],
      ]),
      requests: new Map([
        [
          'req-1',
          {
            id: 'req-1',
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
      statusEvents: [],
      auditEvents: [],
    };
    const prisma = makeFakePrisma(state);
    const originalTx = prisma.$transaction;
    prisma.$transaction = async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const tx = {
        ...prisma,
        vionaRequestAuditEvent: {
          create: async () => {
            throw new Error('audit_boom');
          },
        },
      };
      // naive rollback: snapshot
      const snapAttempts = new Map([...state.attempts.entries()].map(([k, v]) => [k, { ...v }]));
      const snapRequests = new Map([...state.requests.entries()].map(([k, v]) => [k, { ...v }]));
      const snapEvents = [...state.statusEvents];
      try {
        return await fn(tx as typeof prisma);
      } catch (e) {
        state.attempts.clear();
        for (const [k, v] of snapAttempts) state.attempts.set(k, v);
        state.requests.clear();
        for (const [k, v] of snapRequests) state.requests.set(k, v);
        state.statusEvents.length = 0;
        state.statusEvents.push(...snapEvents);
        throw e;
      }
    };
    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'rb1',
          requestId: 'req-1',
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '62. audit failure rolls back terminal writes');
    } catch {
      assert(
        state.requests.get('req-1')!.status === 'inProgress' &&
          state.attempts.get('rb1')!.state === VionaRequestExecutionAttemptState.providerSucceeded,
        '61/62. event/audit failure rolls back terminal writes',
      );
    }
    prisma.$transaction = originalTx;
  }

  // 79–88 runtime isolation
  const srcFiles: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        srcFiles.push(path.relative(REPO_ROOT, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(path.join(REPO_ROOT, 'src'));
  const recoveryImport =
    /vionaRequestRecovery|vionaRequestProviderReconciliation|vionaRequestEscrowReconciliation|vionaRequestRecoveredFinalization|vionaRequestSystemRecoveryPrincipal|vionaProviderStatusLookupContract|vionaRecoveryEscrowAdapterContract/;
  const allowed = new Set([
    'src/services/viona/vionaRequestSystemRecoveryPrincipal.ts',
    'src/services/viona/vionaProviderStatusLookupContract.ts',
    'src/services/viona/vionaRecoveryEscrowAdapterContract.ts',
    'src/services/viona/vionaRequestRecoveryLeaseService.ts',
    'src/services/viona/vionaRequestProviderReconciliationService.ts',
    'src/services/viona/vionaRequestEscrowReconciliationService.ts',
    'src/services/viona/vionaRequestRecoveredFinalizationService.ts',
    'src/repositories/vionaRequestExecutionAttemptRepository.ts',
  ]);
  let leaked = false;
  for (const rel of srcFiles) {
    if (allowed.has(rel)) continue;
    const text = readUtf8(rel);
    if (recoveryImport.test(text)) {
      leaked = true;
      failures.push(`recovery import leak in ${rel}`);
    }
  }
  assert(!leaked, '79–84. no route/controller/orchestrator/webhook/scheduler/entry imports DR2');
  assert(
    !readUtf8('src/services/viona/vionaRequestProviderReconciliationService.ts').includes(
      'vionaPack40D3TwilioGatewayAdapter',
    ),
    '85. no live Twilio adapter imported',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestEscrowReconciliationService.ts').includes(
      'vionaRequestEscrowHoldService',
    ),
    '86. no live escrow implementation invoked',
  );
  assert(
    readUtf8('src/services/viona/vionaRequestExecutionGatewayService.ts').includes(
      'providerExternalReference',
    ),
    '87. live Pack40D3A gateway persists providerExternalReference (DR3A wired)',
  );
  assert(
    !/\b(?:npx|prisma)\s+migrate\s+deploy\b|\bprocess\.env\.DATABASE_URL\b|\bhttps?:\/\/[^"'`]+\.fly\.dev\b/.test(
      readUtf8('scripts/test-viona-pack40dr2-dormant-recovery-services.ts'),
    ),
    '88. no DB or staging path exists in suite',
  );

  // 89–102 preservation
  for (const rel of [
    'src/services/viona/vionaRequestAccessScope.ts',
    'src/services/viona/vionaRequestNoteActionService.ts',
    'src/services/viona/vionaRequestStatusActionService.ts',
    'src/services/viona/vionaRequestIndirectStatusActionService.ts',
    'src/services/viona/vionaRequestExecutionGatewayService.ts',
    'src/services/viona/vionaRequestExecutionOrchestrator.ts',
  ]) {
    assert(
      !recoveryImport.test(readUtf8(rel)),
      `89–95. preservation / Pack40 surface unchanged imports: ${path.basename(rel)}`,
    );
  }
  assert(
    !fs.existsSync(path.join(REPO_ROOT, 'prisma/migrations/20260716020000_pack40dr2')),
    '96. schema and migrations unchanged by DR2 (no new DR2 migration)',
  );
  const plan = readUtf8('docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md');
  assert(/signed-webhook.*DISABLED|Signed-webhook execution: DISABLED/i.test(plan), '97. signed-webhook disabled marker');
  assert(/approvedInternalDispatch.*UNWIRED|internal dispatch UNWIRED/i.test(plan), '98. internal dispatch unwired');
  assert(/consumer\/legacy.*UNSUPPORTED|Consumer\/legacy/i.test(plan), '99/100. consumer/legacy unsupported');
  assert(/Pack40S.*UNIMPLEMENTED/i.test(plan), '101. Pack40S remains unimplemented');
  assert(
    !/git\s+diff\s+origin\/master/.test(
      readUtf8('scripts/test-viona-pack40dr2-dormant-recovery-services.ts'),
    ),
    '102. no permanent broad git-diff-versus-master assertion',
  );

  // repo helpers smoke
  {
    const state: FakeState = {
      attempts: new Map([
        [
          'r1',
          baseAttempt({
            id: 'r1',
            state: VionaRequestExecutionAttemptState.providerPending,
            leaseGeneration: 0,
            providerExternalReference: 'SMhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
          }),
        ],
      ]),
      requests: new Map(),
      statusEvents: [],
      auditEvents: [],
    };
    const prisma = makeFakePrisma(state);
    const found = await findVionaRequestExecutionAttemptForRecovery(
      { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt } as never,
      'r1',
    );
    assert(found?.leaseGeneration === 0 && found.providerExternalReference != null, 'repo recovery projection works');
    await transitionVionaRequestExecutionAttemptStateWithGeneration(
      { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt } as never,
      {
        attemptId: 'r1',
        expectedRequestId: 'req-1',
        expectedStates: [VionaRequestExecutionAttemptState.providerPending],
        expectedLeaseOwner: 'recovery-worker-1',
        expectedLeaseGeneration: 0,
        nextState: VionaRequestExecutionAttemptState.providerSucceeded,
      },
    );
    // lease owner still old — should miss
    assert(
      state.attempts.get('r1')!.state === VionaRequestExecutionAttemptState.providerPending,
      'generation/owner skip CAS without match',
    );
  }

  console.log('');
  console.log(`Pack40DR2 results: ${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    for (const f of failures) console.error(` - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
