/**
 * Pack40DR3B — operator internal recovery endpoint test suite.
 *
 * Fake Prisma / injected adapters only — no DB, staging, Twilio, or live escrow.
 *
 * Run: npx tsx scripts/test-viona-pack40dr3b-operator-internal-recovery-endpoint.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  VionaRequestExecutionAttemptState,
  VionaRequestExecutionPrincipalType,
  VionaRequestExecutionTriggerType,
  VionaRequestScopeKind,
} from '@prisma/client';

import { postVionaInternalExecutionAttemptRecovery } from '../src/controllers/VionaInternalExecutionAttemptRecoveryController';
import { VIONA_INTERNAL_RECOVERY_ROUTE_SAFETY } from '../src/lib/viona/internalRoute/vionaInternalRecoveryRouteGate';
import {
  acquireVionaRequestExecutionAttemptRecoveryLease,
  findVionaRequestExecutionAttemptForRecovery,
} from '../src/repositories/vionaRequestExecutionAttemptRepository';
import type { VionaProviderStatusLookupAdapter } from '../src/services/viona/vionaProviderStatusLookupContract';
import { createPack40DR3TwilioExactStatusLookupAdapter } from '../src/services/viona/vionaPack40DR3TwilioExactStatusLookupAdapter';
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
  recoverVionaExecutionAttempt,
  PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX,
} from '../src/services/viona/vionaRequestExecutionRecoveryCoordinator';
import {
  createVionaRequestSystemRecoveryPrincipal,
  isVionaRequestSystemRecoveryPrincipal,
  PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED,
} from '../src/services/viona/vionaRequestSystemRecoveryPrincipal';

const REPO_ROOT = path.resolve(__dirname, '..');
const OPERATOR_ID = 'operator-super-admin';
const ATTEMPT_ID = 'attempt-dr3b-1';
const REQUEST_ID = 'req-dr3b-1';
const SYNTHETIC_PROVIDER_REFERENCE = 'SMbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const FIXED_NOW = new Date('2026-07-16T10:00:00.000Z');

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

function readUtf8NoComments(rel: string): string {
  return readUtf8(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
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
  findManyCalls: number;
};

function baseAttempt(partial: Partial<AttemptRow> & Pick<AttemptRow, 'id' | 'state'>): AttemptRow {
  return {
    requestId: REQUEST_ID,
    attemptNumber: 1,
    executionKey: `ek-${partial.id}`,
    correlationId: 'corr-base',
    principalType: VionaRequestExecutionPrincipalType.merchantService,
    triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
    triggeringUserId: OPERATOR_ID,
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
    providerIdempotencyKey: `twilio_test_sms:${REQUEST_ID}:${partial.id}:send`,
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
    findMany: async () => {
      state.findManyCalls += 1;
      return [];
    },
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

function makePrincipal(correlationId = 'corr-rec-test') {
  return createVionaRequestSystemRecoveryPrincipal({
    triggeringUserId: OPERATOR_ID,
    correlationId,
  });
}

function blankState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    attempts: new Map(),
    requests: new Map(),
    statusEvents: [],
    auditEvents: [],
    findManyCalls: 0,
    ...overrides,
  };
}

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

function responseText(body: unknown): string {
  return JSON.stringify(body ?? {});
}

function assertNoSyntheticRefInText(text: string, label: string): void {
  assert(!text.includes(SYNTHETIC_PROVIDER_REFERENCE), `${label} must not expose provider reference`);
  assert(!text.includes('providerExternalReference'), `${label} must not expose ref field name`);
}

async function main(): Promise<void> {
  console.log('Pack40DR3B operator internal recovery endpoint suite\n');

  const routesSrc = readUtf8('src/routes/internalRoutes.ts');
  const controllerSrc = readUtf8('src/controllers/VionaInternalExecutionAttemptRecoveryController.ts');
  const coordinatorSrc = readUtf8('src/services/viona/vionaRequestExecutionRecoveryCoordinator.ts');
  const lookupSrc = readUtf8('src/services/viona/vionaPack40DR3TwilioExactStatusLookupAdapter.ts');
  const principalSrc = readUtf8('src/services/viona/vionaRequestSystemRecoveryPrincipal.ts');

  // 1–10 route, auth, binding
  assert(
    routesSrc.includes("internalRouter.use('/viona', vionaInternalRouter)"),
    '1. recovery route is internal under /viona',
  );
  assert(
    routesSrc.includes('vionaInternalRouter.use(authMiddleware)'),
    '1b. viona internal router requires authMiddleware',
  );
  assert(
    routesSrc.includes('superAdminMiddleware') &&
      routesSrc.includes('/execution-attempts/:attemptId/recovery'),
    '1c. recovery route uses superAdminMiddleware on exact attempt path',
  );

  {
    const { res, state } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: undefined,
        params: { attemptId: ATTEMPT_ID },
        body: { action: 'reconcile' },
      } as never,
      res,
    );
    assert(state.statusCode === 401, '2. unauthenticated request denied with 401');
  }

  assert(
    routesSrc.includes('/execution-attempts/:attemptId/recovery') &&
      /execution-attempts\/:attemptId\/recovery[\s\S]{0,120}superAdminMiddleware/.test(routesSrc),
    '3. superAdminMiddleware guards recovery route (merchant-only trigger route lacks it)',
  );
  {
    const triggerIdx = routesSrc.indexOf('/trigger-real-twilio-poc');
    const recoveryIdx = routesSrc.indexOf('/execution-attempts/:attemptId/recovery');
    const triggerBlock = routesSrc.slice(triggerIdx, recoveryIdx > triggerIdx ? recoveryIdx : triggerIdx + 120);
    assert(!triggerBlock.includes('superAdminMiddleware'), '3b. trigger-real-twilio-poc is not superAdmin-only');
  }

  {
    let seenOperator: string | undefined;
    const { res, state } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: OPERATOR_ID,
        params: { attemptId: ATTEMPT_ID },
        body: { action: 'reconcile' },
      } as never,
      res,
      {
        coordinator: async (input) => {
          seenOperator = input.recoveryPrincipal.triggeringUserId;
          return {
            ok: true,
            category: 'already_terminal',
            attemptId: ATTEMPT_ID,
            requestId: REQUEST_ID,
          };
        },
      },
    );
    assert(seenOperator === OPERATOR_ID, '4. operator identity comes from req.authUserId');
    assert(state.statusCode === 200 || (state.body as { ok?: boolean })?.ok === true, '4b. authenticated ok');
  }

  {
    let seenOperator: string | undefined;
    const { res } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: OPERATOR_ID,
        params: { attemptId: ATTEMPT_ID },
        body: {
          action: 'reconcile',
          triggeringUserId: 'spoof-operator',
          tenantId: 'spoof-tenant',
          merchantProfileId: 'spoof-profile',
          ownerUserId: 'spoof-owner',
          scopeKind: 'merchant',
          providerExternalReference: 'SMffffffffffffffffffffffffffffffff',
          requestId: 'spoof-request',
        },
      } as never,
      res,
      {
        coordinator: async (input) => {
          seenOperator = input.recoveryPrincipal.triggeringUserId;
          return {
            ok: true,
            category: 'already_terminal',
            attemptId: ATTEMPT_ID,
            requestId: REQUEST_ID,
          };
        },
      },
    );
    assert(seenOperator === OPERATOR_ID, '5. body triggeringUserId ignored (auth user used)');
    assert(
      controllerSrc.includes('void body.tenantId') &&
        controllerSrc.includes('void body.merchantProfileId') &&
        controllerSrc.includes('void body.ownerUserId'),
      '6. controller explicitly ignores tenant/profile/owner body fields',
    );
  }

  {
    const state = blankState({
      attempts: new Map([
        [
          ATTEMPT_ID,
          baseAttempt({
            id: ATTEMPT_ID,
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
            leaseOwner: 'rec-1',
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
          }),
        ],
      ]),
    });
    const prisma = makeFakePrisma(state);
    const principal = makePrincipal();
    try {
      await reconcileProviderOutcomeForRecovery(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: 'rec-1',
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
          callerSuppliedProviderReference: 'SMshouldreject',
        },
        {
          prisma: prisma as never,
          providerStatusLookup: makeLookup({ classification: 'knownSuccess', resultDigest: 'd' }),
        },
      );
      assert(false, '7. caller-supplied provider reference rejected');
    } catch (e) {
      assert(
        e instanceof VionaRequestProviderReconciliationError &&
          e.code === 'caller_supplied_reference_rejected',
        '7. caller-supplied provider reference rejected',
      );
    }
  }

  assert(
    controllerSrc.includes('readAttemptIdParam') && controllerSrc.includes('req.params.attemptId'),
    '8. controller binds recovery to exact attemptId route param',
  );
  assert(
    !routesSrc.includes('/requests/:requestId/recovery') &&
      !routesSrc.includes('requestId/recovery'),
    '9. request-id-only recovery route impossible (no requestId route)',
  );
  assert(
    !coordinatorSrc.includes('findMany') && !coordinatorSrc.includes('while ('),
    '10. coordinator performs no broad findMany scan or retry loop',
  );

  // 11–14 lease acquisition
  {
    const state = blankState({
      attempts: new Map([
        [
          ATTEMPT_ID,
          baseAttempt({
            id: ATTEMPT_ID,
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
            leaseGeneration: 2,
          }),
        ],
      ]),
    });
    const prisma = makeFakePrisma(state);
    const principal = makePrincipal('corr-lease-1');
    const acquired = await acquireRecoveryLease(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseGeneration: 2,
        newLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-lease-1`,
        newLeaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        recoveryPrincipal: principal,
        now: FIXED_NOW,
      },
      { prisma: prisma as never, clock: () => FIXED_NOW },
    );
    assert(acquired.leaseGeneration === 3, '11. expired lease acquired; generation increments once');
    assert(
      acquired.leaseOwner === `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-lease-1`,
      '11b. lease owner updated on acquisition',
    );

    state.attempts.get(ATTEMPT_ID)!.leaseExpiresAt = new Date('2035-01-01T00:00:00.000Z');
    try {
      await acquireRecoveryLease(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseGeneration: 3,
          newLeaseOwner: 'thief',
          newLeaseExpiresAt: new Date('2036-01-01T00:00:00.000Z'),
          recoveryPrincipal: principal,
          now: FIXED_NOW,
        },
        { prisma: prisma as never },
      );
      assert(false, '12. unexpired lease cannot be stolen');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveryLeaseError && e.code === 'lease_not_expired',
        '12. unexpired lease cannot be stolen',
      );
    }

    state.attempts.get(ATTEMPT_ID)!.leaseExpiresAt = new Date('2020-01-01T00:00:00.000Z');
    try {
      await acquireRecoveryLease(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseGeneration: 2,
          newLeaseOwner: 'stale',
          newLeaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '13. stale expected generation fails lease acquisition');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveryLeaseError && e.code === 'stale_lease_generation',
        '13. stale expected generation fails lease acquisition',
      );
    }

    const before = state.attempts.get(ATTEMPT_ID)!.leaseGeneration;
    const casMiss = await acquireVionaRequestExecutionAttemptRecoveryLease(
      { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt } as never,
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseGeneration: 99,
        expectedStates: [VionaRequestExecutionAttemptState.providerPending],
        newLeaseOwner: 'x',
        newLeaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        now: FIXED_NOW,
      },
    );
    assert(!casMiss.updated && state.attempts.get(ATTEMPT_ID)!.leaseGeneration === before, '14. generation increments at most once per successful CAS');
  }

  // 15–21 classification + lookup paths via coordinator
  {
    const principal = makePrincipal('corr-coord-claimed');
    const claimedState = blankState({
      attempts: new Map([
        [
          'claimed-1',
          baseAttempt({
            id: 'claimed-1',
            state: VionaRequestExecutionAttemptState.claimed,
          }),
        ],
      ]),
    });
    const claimedResult = await recoverVionaExecutionAttempt(
      { attemptId: 'claimed-1', recoveryPrincipal: principal },
      { prisma: makeFakePrisma(claimedState) as never, clock: () => FIXED_NOW },
    );
    assert(
      claimedResult.ok &&
        claimedResult.category === 'operator_review_required' &&
        claimedResult.operatorReviewReason === 'unstarted_attempt',
      '15. claimed attempt requires operator review (no provider send)',
    );

    const missingRefState = blankState({
      attempts: new Map([
        [
          'missing-ref',
          baseAttempt({
            id: 'missing-ref',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: null,
          }),
        ],
      ]),
    });
    const missingRefResult = await recoverVionaExecutionAttempt(
      { attemptId: 'missing-ref', recoveryPrincipal: makePrincipal('corr-missing') },
      { prisma: makeFakePrisma(missingRefState) as never, clock: () => FIXED_NOW },
    );
    assert(
      missingRefResult.ok &&
        missingRefResult.category === 'operator_review_required' &&
        missingRefResult.operatorReviewReason === 'provider_reference_missing',
      '16. providerPending without reference → operator review',
    );

    const tracker = { calls: 0, refs: [] as string[] };
    const successState = blankState({
      attempts: new Map([
        [
          'lookup-success',
          baseAttempt({
            id: 'lookup-success',
            state: VionaRequestExecutionAttemptState.outcomeUncertain,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          }),
        ],
      ]),
      requests: new Map([
        [
          REQUEST_ID,
          {
            id: REQUEST_ID,
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
    });
    const escrow = makeEscrowAdapter({});
    const successResult = await recoverVionaExecutionAttempt(
      { attemptId: 'lookup-success', recoveryPrincipal: makePrincipal('corr-success') },
      {
        prisma: makeFakePrisma(successState) as never,
        clock: () => FIXED_NOW,
        providerStatusLookup: makeLookup(
          { classification: 'knownSuccess', resultDigest: 'digest-ok' },
          tracker,
        ),
        escrowAdapter: escrow,
      },
    );
    assert(
      successResult.ok && successResult.category === 'recovered_completed',
      '17. lookup known success → reconcile → settle → completed',
    );
    assert(tracker.refs[0] === SYNTHETIC_PROVIDER_REFERENCE, '17b. lookup uses persisted reference only');
    assert(tracker.calls === 1, '22. lookup called once on success path');

    const failState = blankState({
      attempts: new Map([
        [
          'lookup-fail',
          baseAttempt({
            id: 'lookup-fail',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          }),
        ],
      ]),
      requests: new Map([
        [
          REQUEST_ID,
          {
            id: REQUEST_ID,
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
    });
    const failResult = await recoverVionaExecutionAttempt(
      { attemptId: 'lookup-fail', recoveryPrincipal: makePrincipal('corr-fail') },
      {
        prisma: makeFakePrisma(failState) as never,
        clock: () => FIXED_NOW,
        providerStatusLookup: makeLookup({
          classification: 'knownFailure',
          failureClass: 'not_created',
          failureDigest: 'fd1',
        }),
        escrowAdapter: makeEscrowAdapter({}),
      },
    );
    assert(
      failResult.ok && failResult.category === 'recovered_failed',
      '18. lookup known failure → reconcile → refund → failed',
    );

    const uncertainState = blankState({
      attempts: new Map([
        [
          'lookup-uncertain',
          baseAttempt({
            id: 'lookup-uncertain',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          }),
        ],
      ]),
      requests: new Map([
        [
          REQUEST_ID,
          {
            id: REQUEST_ID,
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
    });
    const uncertainResult = await recoverVionaExecutionAttempt(
      { attemptId: 'lookup-uncertain', recoveryPrincipal: makePrincipal('corr-uncertain') },
      {
        prisma: makeFakePrisma(uncertainState) as never,
        clock: () => FIXED_NOW,
        providerStatusLookup: makeLookup({
          classification: 'stillUncertain',
          uncertaintyDigest: 'u1',
        }),
        escrowAdapter: makeEscrowAdapter({}),
      },
    );
    assert(
      uncertainResult.ok && uncertainResult.category === 'remains_uncertain',
      '19. lookup stillUncertain leaves attempt uncertain',
    );

    const transportTracker = { calls: 0, refs: [] as string[] };
    const transportState = blankState({
      attempts: new Map([
        [
          'lookup-timeout',
          baseAttempt({
            id: 'lookup-timeout',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          }),
        ],
      ]),
      requests: new Map([
        [
          REQUEST_ID,
          {
            id: REQUEST_ID,
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
    });
    const transportResult = await recoverVionaExecutionAttempt(
      { attemptId: 'lookup-timeout', recoveryPrincipal: makePrincipal('corr-timeout') },
      {
        prisma: makeFakePrisma(transportState) as never,
        clock: () => FIXED_NOW,
        providerStatusLookup: makeLookup(
          { classification: 'lookupTransportUncertain', uncertaintyDigest: 'timeout' },
          transportTracker,
        ),
        escrowAdapter: makeEscrowAdapter({}),
      },
    );
    assert(
      transportResult.ok &&
        transportResult.category === 'operator_review_required' &&
        transportResult.operatorReviewReason === 'lookup_transport_uncertain',
      '20. lookup transport uncertain → operator review, no retry',
    );
    assert(transportTracker.calls === 1, '20b. lookup timeout performs one lookup only');

    assert(
      !lookupSrc.includes('sendMessage') &&
        !lookupSrc.includes('createMessage') &&
        !lookupSrc.includes('invokeProviderSend'),
      '21. lookup adapter has no provider send surface',
    );
  }

  // 25–31 escrow paths
  {
    const principal = makePrincipal('corr-escrow');
    const prisma = makeFakePrisma(
      blankState({
        attempts: new Map([
          [
            'escrow-success',
            baseAttempt({
              id: 'escrow-success',
              state: VionaRequestExecutionAttemptState.providerSucceeded,
              leaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
              leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
              leaseGeneration: 1,
            }),
          ],
          [
            'escrow-fail',
            baseAttempt({
              id: 'escrow-fail',
              state: VionaRequestExecutionAttemptState.providerFailed,
              leaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
              leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
              leaseGeneration: 1,
            }),
          ],
          [
            'escrow-uncertain',
            baseAttempt({
              id: 'escrow-uncertain',
              state: VionaRequestExecutionAttemptState.outcomeUncertain,
              providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
              leaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
              leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
              leaseGeneration: 1,
            }),
          ],
        ]),
        requests: new Map([
          [
            REQUEST_ID,
            {
              id: REQUEST_ID,
              status: 'inProgress',
              scopeKind: VionaRequestScopeKind.merchant,
              merchantProfileId: 'mp-1',
              tenantId: 'tenant-1',
              ownerUserId: 'owner-1',
            },
          ],
        ]),
      }),
    );

    const settleAdapter = makeEscrowAdapter({});
    const settled = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'escrow-success',
        expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: settleAdapter },
    );
    assert(settled.holdStatus === 'SETTLED' && settleAdapter.refundCalls === 0, '25. success path settles, never refunds');

    const refundAdapter = makeEscrowAdapter({});
    const refunded = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'escrow-fail',
        expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: refundAdapter },
    );
    assert(refunded.holdStatus === 'REFUNDED' && refundAdapter.settleCalls === 0, '26. failure path refunds, never settles');

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'escrow-uncertain',
          expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({}) },
      );
      assert(false, '27. outcome uncertain performs no escrow mutation');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError &&
          e.code === 'outcome_uncertain_escrow_forbidden',
        '27. outcome uncertain performs no escrow mutation',
      );
    }

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'escrow-success',
          expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({ failSettle: true }) },
      );
      assert(false, '28. settlement failure blocks completion path');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError && e.code === 'escrow_operation_failed',
        '28. settlement failure blocks completion path',
      );
    }

    try {
      await reconcileEscrowForRecoveredProviderOutcome(
        {
          attemptId: 'escrow-fail',
          expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never, escrowAdapter: makeEscrowAdapter({ failRefund: true }) },
      );
      assert(false, '29. refund failure blocks failed finalization path');
    } catch (e) {
      assert(
        e instanceof VionaRequestEscrowReconciliationError && e.code === 'escrow_operation_failed',
        '29. refund failure blocks failed finalization path',
      );
    }

    const idemSettle = makeEscrowAdapter({ status: 'SETTLED' });
    const dupSettle = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'escrow-success',
        expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: idemSettle },
    );
    assert(dupSettle.deduplicated === true, '30. duplicate settlement idempotent');

    const idemRefund = makeEscrowAdapter({ status: 'REFUNDED' });
    const dupRefund = await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: 'escrow-fail',
        expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-escrow`,
        expectedLeaseGeneration: 1,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never, escrowAdapter: idemRefund },
    );
    assert(dupRefund.deduplicated === true, '31. duplicate refund idempotent');
  }

  // 32–35 generation fenced finalize + terminal + duplicate
  {
    const principal = makePrincipal('corr-finalize');
    const leaseOwner = `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:corr-finalize`;
    const state = blankState({
      attempts: new Map([
        [
          'fin-success',
          baseAttempt({
            id: 'fin-success',
            state: VionaRequestExecutionAttemptState.providerSucceeded,
            leaseOwner,
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 4,
          }),
        ],
        [
          'fin-terminal',
          baseAttempt({
            id: 'fin-terminal',
            state: VionaRequestExecutionAttemptState.completed,
          }),
        ],
      ]),
      requests: new Map([
        [
          REQUEST_ID,
          {
            id: REQUEST_ID,
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
    });
    const prisma = makeFakePrisma(state);

    await finalizeRecoveredExecutionCompleted(
      {
        attemptId: 'fin-success',
        requestId: REQUEST_ID,
        expectedLeaseOwner: leaseOwner,
        expectedLeaseGeneration: 4,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never },
    );
    assert(state.requests.get(REQUEST_ID)!.status === 'completed', '32. finalize requires exact generation fencing');

    state.attempts.set(
      'fin-stale-gen',
      baseAttempt({
        id: 'fin-stale-gen',
        state: VionaRequestExecutionAttemptState.providerSucceeded,
        leaseOwner,
        leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
        leaseGeneration: 2,
      }),
    );
    const auditBefore = state.auditEvents.length;
    try {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: 'fin-stale-gen',
          requestId: REQUEST_ID,
          expectedLeaseOwner: leaseOwner,
          expectedLeaseGeneration: 1,
          recoveryPrincipal: principal,
        },
        { prisma: prisma as never },
      );
      assert(false, '33. stale generation finalize creates no new audit');
    } catch (e) {
      assert(
        e instanceof VionaRequestRecoveredFinalizationError && e.code === 'stale_lease_generation',
        '33. stale generation finalize rejected (no extra audit)',
      );
    }
    assert(state.auditEvents.length === auditBefore, '33b. stale generation did not append audit');

    const terminalResult = await recoverVionaExecutionAttempt(
      { attemptId: 'fin-terminal', recoveryPrincipal: makePrincipal('corr-terminal') },
      { prisma: prisma as never, clock: () => FIXED_NOW },
    );
    assert(
      terminalResult.ok && terminalResult.category === 'already_terminal',
      '34. terminal attempt is immutable (already_terminal)',
    );
    assert(
      classifyRecoverableAttempt(state.attempts.get('fin-terminal')!).classification === 'terminal_immutable',
      '34b. classifyRecoverableAttempt marks terminal immutable',
    );

    const dup = await finalizeRecoveredExecutionCompleted(
      {
        attemptId: 'fin-success',
        requestId: REQUEST_ID,
        expectedLeaseOwner: leaseOwner,
        expectedLeaseGeneration: 4,
        recoveryPrincipal: principal,
      },
      { prisma: prisma as never },
    );
    assert(dup.idempotentReplay === true && state.statusEvents.length === 1, '35. duplicate completion idempotent');
  }

  // 36–39 privacy — no ref in response/logs/audit
  {
    const { res, state: httpState } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: OPERATOR_ID,
        params: { attemptId: ATTEMPT_ID },
        body: { action: 'reconcile' },
      } as never,
      res,
      {
        coordinator: async () => ({
          ok: true,
          category: 'recovered_completed',
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
        }),
      },
    );
    const bodyText = responseText(httpState.body);
    assertNoSyntheticRefInText(bodyText, '36. API success response');
    assert(
      bodyText.includes('operatorInternalRecovery') || bodyText.includes('pack40dr3b'),
      '36b. response includes DR3B trigger metadata without ref',
    );

    const auditState = blankState({
      attempts: new Map([
        [
          'audit-attempt',
          baseAttempt({
            id: 'audit-attempt',
            state: VionaRequestExecutionAttemptState.providerSucceeded,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
            leaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:audit`,
            leaseExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
            leaseGeneration: 1,
          }),
        ],
      ]),
      requests: new Map([
        [
          REQUEST_ID,
          {
            id: REQUEST_ID,
            status: 'inProgress',
            scopeKind: VionaRequestScopeKind.merchant,
            merchantProfileId: 'mp-1',
            tenantId: 'tenant-1',
            ownerUserId: 'owner-1',
          },
        ],
      ]),
    });
    await finalizeRecoveredExecutionCompleted(
      {
        attemptId: 'audit-attempt',
        requestId: REQUEST_ID,
        expectedLeaseOwner: `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:audit`,
        expectedLeaseGeneration: 1,
        recoveryPrincipal: makePrincipal('corr-audit'),
      },
      { prisma: makeFakePrisma(auditState) as never },
    );
    const auditBlob = JSON.stringify(auditState.auditEvents);
    const eventBlob = JSON.stringify(auditState.statusEvents);
    assertNoSyntheticRefInText(auditBlob, '37. audit events');
    assertNoSyntheticRefInText(eventBlob, '38. status events');

    assert(
      !controllerSrc.includes('providerExternalReference') ||
        controllerSrc.includes('void body.providerExternalReference'),
      '39. controller never forwards provider reference to coordinator response',
    );
    assert(
      !coordinatorSrc.includes('providerExternalReference'),
      '39b. coordinator source does not expose provider reference in results',
    );
  }

  // 40–48 wiring closure + preservation
  assert(
    PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED ===
      'PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED',
    '40. PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED marker exported',
  );
  assert(
    principalSrc.includes('PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT_WIRED'),
    '40b. principal module declares DR3B endpoint wired marker',
  );

  {
    const webhook = readUtf8('src/controllers/VionaWebhookMerchantAgentController.ts');
    assert(
      !webhook.includes('recoverVionaExecutionAttempt') &&
        !webhook.includes('postVionaInternalExecutionAttemptRecovery'),
      '41. signed webhook does not invoke recovery endpoint',
    );
  }

  {
    const dispatch = readUtf8NoComments('src/services/viona/vionaAutonomousDispatchService.ts');
    const orch = readUtf8('src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(dispatch.includes('pack40d_provider_execution_disabled'), '42. dispatch provider execution remains disabled');
    assert(!orch.includes('approvedInternalDispatch'), '42b. orchestrator dispatch trigger unwired');
  }

  assert(
    !readUtf8NoComments('src/services/viona/vionaRequestExecutionRecoveryCoordinator.ts').includes(
      'setInterval',
    ) &&
      !readUtf8NoComments('src/services/viona/vionaRequestExecutionRecoveryCoordinator.ts').includes(
        'cron',
      ),
    '43. recovery coordinator introduces no scheduler/worker',
  );
  assert(
    VIONA_INTERNAL_RECOVERY_ROUTE_SAFETY.noScheduler === true,
    '43b. route safety documents no scheduler',
  );

  assert(
    !readUtf8('prisma/schema.prisma').includes('systemRecovery'),
    '44. schema unchanged — no new execution principal enum persisted',
  );
  assert(
    !fs.existsSync(path.join(REPO_ROOT, 'prisma/migrations/20260716030000_pack40dr3b')),
    '44b. no new DR3B migration directory added by this pack',
  );

  assert(
    !fs
      .readdirSync(path.join(REPO_ROOT, 'src'), { recursive: true })
      .map(String)
      .some((f) => f.toLowerCase().includes('pack40s')),
    '45. Pack40S remains unimplemented',
  );

  assert(
    isVionaRequestSystemRecoveryPrincipal(
      createVionaRequestSystemRecoveryPrincipal({
        triggeringUserId: OPERATOR_ID,
        correlationId: 'corr-principal',
      }),
    ),
    '46. trusted recovery principal factory accepted',
  );

  {
    const adapter = createPack40DR3TwilioExactStatusLookupAdapter({
      readCredentials: () => ({ accountSid: 'ACtest', authToken: 'token' }),
      transport: async () => ({ httpStatus: 200, messageStatus: 'delivered' }),
    });
    const lookupResult = await adapter.lookupExactOperation({
      providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
      correlationId: 'corr-test',
    });
    assert(lookupResult.classification === 'knownSuccess', '47. lookup adapter classifies injected transport (fake only)');
  }

  {
    const scanState = blankState({
      attempts: new Map([
        [
          'scan-attempt',
          baseAttempt({
            id: 'scan-attempt',
            state: VionaRequestExecutionAttemptState.providerPending,
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          }),
        ],
      ]),
    });
    await recoverVionaExecutionAttempt(
      { attemptId: 'scan-attempt', recoveryPrincipal: makePrincipal('corr-scan') },
      {
        prisma: makeFakePrisma(scanState) as never,
        clock: () => FIXED_NOW,
        providerStatusLookup: makeLookup({ classification: 'stillUncertain', uncertaintyDigest: 'x' }),
        escrowAdapter: makeEscrowAdapter({}),
      },
    );
    assert(scanState.findManyCalls === 0, '48. coordinator recovery uses findUnique only (no findMany scan)');
  }

  // Additional controller edge cases
  {
    const { res, state } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      { authUserId: OPERATOR_ID, params: { attemptId: '  ' }, body: {} } as never,
      res,
    );
    assert(state.statusCode === 400, 'missing attemptId param → 400');
  }

  {
    const { res, state } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: OPERATOR_ID,
        params: { attemptId: ATTEMPT_ID },
        body: { action: 'abandon' },
      } as never,
      res,
    );
    assert(state.statusCode === 400, 'unsupported recovery action rejected');
  }

  {
    const { res, state } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: OPERATOR_ID,
        params: { attemptId: ATTEMPT_ID },
        body: { action: 'reconcile' },
      } as never,
      res,
      {
        coordinator: async () => ({ ok: false, category: 'not_found' }),
      },
    );
    assert(state.statusCode === 404, 'coordinator not_found → 404');
  }

  {
    const { res, state } = fakeRes();
    await postVionaInternalExecutionAttemptRecovery(
      {
        authUserId: OPERATOR_ID,
        params: { attemptId: ATTEMPT_ID },
        body: { action: 'reconcile' },
      } as never,
      res,
      {
        coordinator: async () => ({ ok: false, category: 'recovery_conflict' }),
      },
    );
    assert(state.statusCode === 409, 'coordinator recovery_conflict → 409');
  }

  const total = passed + failures.length;
  console.log('');
  console.log(`PASS: ${passed}/${total}`);
  if (failures.length > 0) {
    for (const f of failures) console.error(` - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
