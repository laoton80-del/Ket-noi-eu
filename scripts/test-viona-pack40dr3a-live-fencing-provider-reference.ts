/**
 * Pack40DR3A — live generation fencing and provider reference hardening tests.
 *
 * Fake/injected Prisma and adapters only — no database, staging, or live provider access.
 *
 * Run: npx tsx scripts/test-viona-pack40dr3a-live-fencing-provider-reference.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  Prisma,
  VionaRequestExecutionAttemptState,
  VionaRequestExecutionPrincipalType,
  VionaRequestExecutionTriggerType,
  VionaRequestScopeKind,
  type Prisma as PrismaTypes,
} from '@prisma/client';

import {
  buildVionaRequestProviderIdempotencyKey,
  VIONA_PACK40D3A_PROVIDER_NAME,
  type VionaExecutionProviderAdapter,
  type VionaExecutionProviderAdapterResult,
  type VionaPack40D3AOperationCategory,
} from '../src/services/viona/vionaRequestExecutionProviderContract';
import { postVionaInternalTriggerRealTwilioPoc } from '../src/controllers/VionaInternalRealTwilioPocController';
import { createPack40D3TwilioGatewayAdapter } from '../src/services/viona/vionaPack40D3TwilioGatewayAdapter';
import { buildVionaPack40D3EscrowIdempotencyKey } from '../src/services/viona/vionaPack40D3EscrowCoordination';
import {
  executeVionaRequestBusinessFlow,
  type ExecuteVionaRequestBusinessFlowDeps,
  type ExecuteVionaRequestBusinessFlowResult,
} from '../src/services/viona/vionaRequestExecutionOrchestrator';
import {
  prepareVionaRequestExecutionProvider,
  recordVionaRequestExecutionProviderOutcome,
  runVionaRequestExecutionProviderGateway,
  VionaRequestExecutionGatewayError,
  type VionaRequestExecutionGatewayDeps,
} from '../src/services/viona/vionaRequestExecutionGatewayService';
import {
  claimVionaRequestExecution,
  finalizeVionaRequestExecutionCompleted,
  finalizeVionaRequestExecutionFailed,
  VionaRequestIndirectExecutionError,
  type VionaRequestIndirectStatusActionDeps,
} from '../src/services/viona/vionaRequestIndirectStatusActionService';
import { recordPreparedVionaRequestExecutionAttemptProviderOutcome } from '../src/repositories/vionaRequestExecutionAttemptRepository';

type RequestRow = {
  id: string;
  status: string;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  tenantId: string;
};

type ProfileRow = {
  id: string;
  ownerUserId: string;
  tenantId: string;
  isActive: boolean;
};

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

type StatusEventRow = {
  id: string;
  requestId: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string | null;
  reason: string | null;
};

type AuditRow = {
  id: string;
  requestId: string;
  eventType: string;
  actorUserId: string | null;
  actorRoleLabel: string | null;
  message: string | null;
  payloadJson: Record<string, unknown>;
};

type FakeState = {
  requests: RequestRow[];
  profiles: ProfileRow[];
  attempts: AttemptRow[];
  statusEvents: StatusEventRow[];
  auditEvents: AuditRow[];
  preTxProfileLookups: number;
  txProfileLookups: number;
  transactionCount: number;
  transactionIsolationLevel?: string;
  inTransaction: boolean;
  forcePrepareZero: boolean;
  forceOutcomeZero: boolean;
  forceKeyUniqueConflict: boolean;
  attemptCreates: number;
  statusEventCreates: number;
  auditCreates: number;
  adapterCallsDuringTx: number;
  now: Date;
};

const OWNER = 'user-merchant-owner';
const PROFILE_ID = 'profile-merchant-1';
const TENANT_ID = 'tenant-merchant-1';
const REQUEST_ID = 'req-merchant-1';
const ATTEMPT_ID = 'attempt-1';
const LEASE_OWNER = 'worker-alpha';
const ATTEMPT_ID_B = 'attempt-2';
const CORR_ID = 'corr-dr3a-1';
const EXEC_KEY = 'exec-dr3a-1';
const FIXED_NOW = new Date('2026-07-15T15:00:00.000Z');
const OPERATION: VionaPack40D3AOperationCategory = 'send';
const SYNTHETIC_PROVIDER_REFERENCE = 'SMbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const OTHER_REFERENCE = 'SMcccccccccccccccccccccccccccccccc';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS ${passed + failed}: ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${passed + failed}: ${name} — ${String(error)}`);
  }
}

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS ${passed + failed}: ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL ${passed + failed}: ${name} — ${String(error)}`);
  }
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readSourceNoComments(relativePath: string): string {
  return readSource(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function makeRequest(overrides: Partial<RequestRow> = {}): RequestRow {
  return {
    id: REQUEST_ID,
    status: 'inProgress',
    ownerUserId: OWNER,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_ID,
    tenantId: TENANT_ID,
    ...overrides,
  };
}

function makeClaimRequest(overrides: Partial<RequestRow> = {}): RequestRow {
  return makeRequest({ status: 'triage', ...overrides });
}

function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: PROFILE_ID,
    ownerUserId: OWNER,
    tenantId: TENANT_ID,
    isActive: true,
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<AttemptRow> = {}): AttemptRow {
  return {
    id: ATTEMPT_ID,
    requestId: REQUEST_ID,
    attemptNumber: 1,
    executionKey: EXEC_KEY,
    state: VionaRequestExecutionAttemptState.claimed,
    correlationId: CORR_ID,
    principalType: VionaRequestExecutionPrincipalType.merchantService,
    triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
    triggeringUserId: OWNER,
    ownerUserIdSnapshot: OWNER,
    scopeKindSnapshot: VionaRequestScopeKind.merchant,
    merchantProfileIdSnapshot: PROFILE_ID,
    tenantIdSnapshot: TENANT_ID,
    leaseOwner: LEASE_OWNER,
    leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
    leaseGeneration: 0,
    claimedAt: FIXED_NOW,
    providerName: null,
    operationCategory: null,
    providerIdempotencyKey: null,
    providerStartedAt: null,
    providerFinishedAt: null,
    providerResultDigest: null,
    providerExternalReferenceDigest: null,
    providerExternalReference: null,
    failureClass: null,
    failureReasonDigest: null,
    finalizedAt: null,
    abandonedAt: null,
    ...overrides,
  };
}

function expectedKey(
  attemptId = ATTEMPT_ID,
  requestId = REQUEST_ID,
  op: VionaPack40D3AOperationCategory = OPERATION,
): string {
  return buildVionaRequestProviderIdempotencyKey({
    providerName: VIONA_PACK40D3A_PROVIDER_NAME,
    requestId,
    executionAttemptId: attemptId,
    operationCategory: op,
  });
}

function blankState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    requests: [makeRequest()],
    profiles: [makeProfile()],
    attempts: [makeAttempt()],
    statusEvents: [],
    auditEvents: [],
    preTxProfileLookups: 0,
    txProfileLookups: 0,
    transactionCount: 0,
    inTransaction: false,
    forcePrepareZero: false,
    forceOutcomeZero: false,
    forceKeyUniqueConflict: false,
    attemptCreates: 0,
    statusEventCreates: 0,
    auditCreates: 0,
    adapterCallsDuringTx: 0,
    now: FIXED_NOW,
    ...overrides,
  };
}

function matchesAttemptWhere(attempt: AttemptRow, where: Record<string, unknown>): boolean {
  if (where.id != null && attempt.id !== where.id) return false;
  if (where.requestId != null && attempt.requestId !== where.requestId) return false;
  if (where.leaseOwner !== undefined && attempt.leaseOwner !== where.leaseOwner) return false;
  if (where.leaseGeneration !== undefined && attempt.leaseGeneration !== where.leaseGeneration) {
    return false;
  }
  if (Array.isArray(where.OR)) {
    const ok = where.OR.some((clause) =>
      matchesAttemptWhere(attempt, clause as Record<string, unknown>),
    );
    if (!ok) return false;
  }
  if (where.providerName != null && attempt.providerName !== where.providerName) return false;
  if (where.operationCategory != null && attempt.operationCategory !== where.operationCategory) {
    return false;
  }
  if (where.providerIdempotencyKey !== undefined) {
    if (where.providerIdempotencyKey === null) {
      if (attempt.providerIdempotencyKey != null) return false;
    } else if (attempt.providerIdempotencyKey !== where.providerIdempotencyKey) {
      return false;
    }
  }
  if (where.providerExternalReference !== undefined) {
    if (where.providerExternalReference === null) {
      if (attempt.providerExternalReference != null) return false;
    } else if (attempt.providerExternalReference !== where.providerExternalReference) {
      return false;
    }
  }
  if (where.state != null) {
    if (typeof where.state === 'object' && where.state !== null && 'in' in where.state) {
      const states = (where.state as { in: string[] }).in;
      if (!states.includes(attempt.state)) return false;
    } else if (attempt.state !== where.state) {
      return false;
    }
  }
  return true;
}

function enforceProviderReferenceUnique(state: FakeState, attempt: AttemptRow, reference: string | null): void {
  if (reference == null || reference.length === 0) return;
  const providerName = attempt.providerName ?? VIONA_PACK40D3A_PROVIDER_NAME;
  const conflict = state.attempts.find(
    (row) =>
      row.id !== attempt.id &&
      row.providerName === providerName &&
      row.providerExternalReference === reference,
  );
  if (conflict != null) {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
  }
}

function installFakePrisma(state: FakeState): VionaRequestExecutionGatewayDeps['prisma'] {
  type FakeTx = {
    merchantProfile: {
      findUnique: (args: {
        where: { id?: string; ownerUserId?: string };
      }) => Promise<ProfileRow | null>;
      findMany: () => Promise<never>;
    };
    vionaRequest: {
      findFirst: (args: {
        where: PrismaTypes.VionaRequestWhereInput;
      }) => Promise<RequestRow | null>;
      updateMany: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<{ count: number }>;
    };
    vionaRequestExecutionAttempt: {
      findUnique: (args: {
        where: { id?: string; providerIdempotencyKey?: string; executionKey?: string };
        select?: unknown;
      }) => Promise<AttemptRow | Partial<AttemptRow> | null>;
      updateMany: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<{ count: number }>;
      findFirst: () => Promise<null>;
      findMany: () => Promise<AttemptRow[]>;
      create: (args: { data: Record<string, unknown> }) => Promise<AttemptRow>;
    };
    vionaRequestStatusEvent: {
      create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    };
    vionaRequestAuditEvent: {
      create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    };
  };

  const buildTx = (): FakeTx => ({
    merchantProfile: {
      findUnique: async ({ where }) => {
        if (state.inTransaction) state.txProfileLookups += 1;
        else state.preTxProfileLookups += 1;
        if (where.id != null) return state.profiles.find((p) => p.id === where.id) ?? null;
        if (where.ownerUserId != null) {
          return state.profiles.find((p) => p.ownerUserId === where.ownerUserId) ?? null;
        }
        return null;
      },
      findMany: async () => {
        throw new Error('global MerchantProfile scan forbidden');
      },
    },
    vionaRequest: {
      findFirst: async ({ where }) =>
        state.requests.find((row) => {
          if (where.id != null && row.id !== where.id) return false;
          if (where.status != null && row.status !== where.status) return false;
          return true;
        }) ?? null,
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const row of state.requests) {
          if (where.id != null && row.id !== where.id) continue;
          if (where.status != null && row.status !== where.status) continue;
          Object.assign(row, data);
          count += 1;
        }
        return { count };
      },
    },
    vionaRequestExecutionAttempt: {
      findUnique: async ({ where, select }) => {
        const hit =
          (where.id != null ? state.attempts.find((a) => a.id === where.id) : null) ??
          (where.providerIdempotencyKey != null
            ? state.attempts.find((a) => a.providerIdempotencyKey === where.providerIdempotencyKey)
            : null) ??
          (where.executionKey != null
            ? state.attempts.find((a) => a.executionKey === where.executionKey)
            : null) ??
          null;
        if (hit == null) return null;
        if (select && typeof select === 'object' && 'executionKey' in select) {
          return {
            id: hit.id,
            requestId: hit.requestId,
            attemptNumber: hit.attemptNumber,
            executionKey: hit.executionKey,
            state: hit.state,
            correlationId: hit.correlationId,
            leaseOwner: hit.leaseOwner,
            leaseExpiresAt: hit.leaseExpiresAt,
            leaseGeneration: hit.leaseGeneration,
            providerIdempotencyKey: hit.providerIdempotencyKey,
          };
        }
        return hit;
      },
      updateMany: async ({ where, data }) => {
        const isPrepare =
          data.state === VionaRequestExecutionAttemptState.providerPending &&
          data.providerIdempotencyKey != null;
        const isOutcome =
          data.state === VionaRequestExecutionAttemptState.providerSucceeded ||
          data.state === VionaRequestExecutionAttemptState.providerFailed ||
          data.state === VionaRequestExecutionAttemptState.outcomeUncertain;

        if (isPrepare && state.forcePrepareZero) return { count: 0 };
        if (isOutcome && state.forceOutcomeZero) return { count: 0 };
        if (isPrepare && state.forceKeyUniqueConflict) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          });
        }

        let count = 0;
        for (const attempt of state.attempts) {
          if (!matchesAttemptWhere(attempt, where)) continue;
          const nextRef =
            data.providerExternalReference !== undefined
              ? (data.providerExternalReference as string | null)
              : attempt.providerExternalReference;
          if (nextRef != null && nextRef.length > 0) {
            enforceProviderReferenceUnique(state, attempt, nextRef);
          }
          Object.assign(attempt, data);
          count += 1;
        }
        return { count };
      },
      findFirst: async () => null,
      findMany: async () => state.attempts,
      create: async ({ data }) => {
        state.attemptCreates += 1;
        const created = makeAttempt({
          id: String(data.id ?? `attempt-${state.attempts.length + 1}`),
          requestId: String(data.requestId),
          attemptNumber: Number(data.attemptNumber),
          executionKey: String(data.executionKey),
          state: data.state as VionaRequestExecutionAttemptState,
          correlationId: String(data.correlationId),
          principalType: data.principalType as VionaRequestExecutionPrincipalType,
          triggerType: data.triggerType as VionaRequestExecutionTriggerType,
          triggeringUserId: (data.triggeringUserId as string | null) ?? null,
          ownerUserIdSnapshot: String(data.ownerUserIdSnapshot),
          scopeKindSnapshot: data.scopeKindSnapshot as VionaRequestScopeKind,
          merchantProfileIdSnapshot: (data.merchantProfileIdSnapshot as string | null) ?? null,
          tenantIdSnapshot: String(data.tenantIdSnapshot),
          leaseOwner: (data.leaseOwner as string | null) ?? null,
          leaseExpiresAt: (data.leaseExpiresAt as Date | null) ?? null,
          claimedAt: (data.claimedAt as Date | null) ?? null,
          leaseGeneration: 0,
        });
        state.attempts.push(created);
        return created;
      },
    },
    vionaRequestStatusEvent: {
      create: async ({ data }) => {
        state.statusEventCreates += 1;
        const created: StatusEventRow = {
          id: String(data.id ?? `status-event-${state.statusEvents.length + 1}`),
          requestId: String(data.requestId),
          fromStatus: (data.fromStatus as string | null) ?? null,
          toStatus: String(data.toStatus),
          changedByUserId: (data.changedByUserId as string | null) ?? null,
          reason: (data.reason as string | null) ?? null,
        };
        state.statusEvents.push(created);
        return { id: created.id };
      },
    },
    vionaRequestAuditEvent: {
      create: async ({ data }) => {
        state.auditCreates += 1;
        const created: AuditRow = {
          id: String(data.id ?? `audit-${state.auditEvents.length + 1}`),
          requestId: String(data.requestId),
          eventType: String(data.eventType),
          actorUserId: (data.actorUserId as string | null) ?? null,
          actorRoleLabel: (data.actorRoleLabel as string | null) ?? null,
          message: (data.message as string | null) ?? null,
          payloadJson: (data.payloadJson as Record<string, unknown>) ?? {},
        };
        state.auditEvents.push(created);
        return { id: created.id };
      },
    },
  });

  const tx = buildTx();

  return {
    ...tx,
    $transaction: async <T>(
      fn: (client: FakeTx) => Promise<T>,
      options?: { isolationLevel?: string },
    ): Promise<T> => {
      state.transactionCount += 1;
      state.transactionIsolationLevel = options?.isolationLevel;
      const snapshot = {
        requests: state.requests.map((r) => ({ ...r })),
        attempts: state.attempts.map((a) => ({ ...a })),
        statusEvents: state.statusEvents.slice(),
        auditEvents: state.auditEvents.slice(),
      };
      state.inTransaction = true;
      try {
        const result = await fn(tx);
        state.inTransaction = false;
        return result;
      } catch (error) {
        state.inTransaction = false;
        state.requests.splice(0, state.requests.length, ...snapshot.requests);
        state.attempts.splice(0, state.attempts.length, ...snapshot.attempts);
        state.statusEvents.splice(0, state.statusEvents.length, ...snapshot.statusEvents);
        state.auditEvents.splice(0, state.auditEvents.length, ...snapshot.auditEvents);
        throw error;
      }
    },
  } as unknown as VionaRequestExecutionGatewayDeps['prisma'];
}

function makeGatewayDeps(
  state: FakeState,
  adapter: VionaExecutionProviderAdapter,
): VionaRequestExecutionGatewayDeps {
  return {
    prisma: installFakePrisma(state),
    adapter,
    clock: () => new Date(state.now.getTime()),
  };
}

function makeIndirectDeps(state: FakeState): VionaRequestIndirectStatusActionDeps {
  return {
    prisma: installFakePrisma(state) as VionaRequestIndirectStatusActionDeps['prisma'],
    clock: () => new Date(state.now.getTime()),
    createId: () => ATTEMPT_ID,
    createExecutionKey: () => EXEC_KEY,
    createLeaseOwner: () => LEASE_OWNER,
    defaultLeaseDurationMs: 60_000,
  };
}

function makeAdapter(
  result: VionaExecutionProviderAdapterResult,
  tracker: { calls: number; duringTx: boolean[] } = { calls: 0, duringTx: [] },
  state?: FakeState,
): VionaExecutionProviderAdapter {
  return {
    invoke: async (input) => {
      tracker.calls += 1;
      if (state != null) {
        tracker.duringTx.push(state.inTransaction);
        state.adapterCallsDuringTx += state.inTransaction ? 1 : 0;
      }
      if (result.kind === 'succeeded' && !result.providerExternalReference) {
        return {
          ...result,
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          externalReferenceDigest: result.externalReferenceDigest ?? 'ext-digest',
        };
      }
      void input;
      return result;
    },
  };
}

async function expectGatewayCode(code: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    throw new Error(`expected ${code}`);
  } catch (error) {
    assert(
      error instanceof VionaRequestExecutionGatewayError && error.code === code,
      `expected ${code}, got ${String(error)}`,
    );
  }
}

async function expectIndirectCode(code: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    throw new Error(`expected ${code}`);
  } catch (error) {
    assert(
      error instanceof VionaRequestIndirectExecutionError && error.code === code,
      `expected ${code}, got ${String(error)}`,
    );
  }
}

function makeTrustedClaimTrigger() {
  return {
    triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
    triggeringUserId: OWNER,
    requestId: REQUEST_ID,
    correlationId: CORR_ID,
  };
}

function pendingAttempt(leaseGeneration = 0): AttemptRow {
  return makeAttempt({
    state: VionaRequestExecutionAttemptState.providerPending,
    providerName: VIONA_PACK40D3A_PROVIDER_NAME,
    operationCategory: OPERATION,
    providerIdempotencyKey: expectedKey(),
    providerStartedAt: FIXED_NOW,
    leaseGeneration,
  });
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

async function main(): Promise<void> {
  console.log('Pack40DR3A live generation fencing + provider reference suite\n');

  // --- Lease generation fencing (1–16) ---
  await runAsyncTest('1. Claim returns generation zero', async () => {
    const state = blankState({ requests: [makeClaimRequest()], attempts: [] });
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedClaimTrigger() },
      makeIndirectDeps(state),
    );
    assert(result.leaseGeneration === 0, 'generation zero');
    assert(state.attempts[0]!.leaseGeneration === 0, 'persisted zero');
  });

  await runAsyncTest('2. Generation comes from persisted attempt', async () => {
    const state = blankState({
      attempts: [makeAttempt({ leaseGeneration: 4, state: VionaRequestExecutionAttemptState.providerSucceeded })],
      requests: [makeRequest({ status: 'inProgress' })],
    });
    await finalizeVionaRequestExecutionCompleted(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 4,
      },
      makeIndirectDeps(state),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.completed, 'finalized');
  });

  await runAsyncTest('3. Caller-supplied generation ignored/rejected (wrong gen fails)', async () => {
    const state = blankState();
    await expectGatewayCode('stale_lease_generation', () =>
      prepareVionaRequestExecutionProvider(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 99,
          operationCategory: OPERATION,
        },
        makeGatewayDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('4. Provider preparation requires exact generation', async () => {
    const state = blankState({ attempts: [makeAttempt({ leaseGeneration: 2 })] });
    await prepareVionaRequestExecutionProvider(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 2,
        operationCategory: OPERATION,
      },
      makeGatewayDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(
      state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerPending,
      'prepared at gen 2',
    );
  });

  await runAsyncTest('5. Wrong generation cannot enter providerPending', async () => {
    const state = blankState({ attempts: [makeAttempt({ leaseGeneration: 1 })] });
    await expectGatewayCode('stale_lease_generation', () =>
      prepareVionaRequestExecutionProvider(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 0,
          operationCategory: OPERATION,
        },
        makeGatewayDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.claimed, 'still claimed');
  });

  await runAsyncTest('6. Provider success recording requires exact generation', async () => {
    const state = blankState({ attempts: [pendingAttempt(3)] });
    await recordVionaRequestExecutionProviderOutcome(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 3,
        operationCategory: OPERATION,
        providerIdempotencyKey: expectedKey(),
        adapterResult: {
          kind: 'succeeded',
          resultDigest: 'ok',
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
        },
      },
      { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
    );
    assert(
      state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerSucceeded,
      'succeeded',
    );
  });

  await runAsyncTest('7. Provider failure recording requires exact generation', async () => {
    const state = blankState({ attempts: [pendingAttempt(1)] });
    await recordVionaRequestExecutionProviderOutcome(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 1,
        operationCategory: OPERATION,
        providerIdempotencyKey: expectedKey(),
        adapterResult: {
          kind: 'failed',
          failureClass: 'provider_rejected',
          failureReasonDigest: 'fail',
        },
      },
      { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerFailed, 'failed');
  });

  await runAsyncTest('8. Provider uncertain recording requires exact generation', async () => {
    const state = blankState({ attempts: [pendingAttempt(2)] });
    await recordVionaRequestExecutionProviderOutcome(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 2,
        operationCategory: OPERATION,
        providerIdempotencyKey: expectedKey(),
        adapterResult: {
          kind: 'uncertain',
          uncertaintyClass: 'timeout',
          failureReasonDigest: 'timeout',
        },
      },
      { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
    );
    assert(
      state.attempts[0]!.state === VionaRequestExecutionAttemptState.outcomeUncertain,
      'uncertain',
    );
  });

  await runAsyncTest('9. Completion finalization requires exact generation', async () => {
    const state = blankState({
      requests: [makeRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          leaseGeneration: 5,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
        }),
      ],
    });
    await finalizeVionaRequestExecutionCompleted(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 5,
      },
      makeIndirectDeps(state),
    );
    assert(state.requests[0]!.status === 'completed', 'completed');
  });

  await runAsyncTest('10. Failure finalization requires exact generation', async () => {
    const state = blankState({
      requests: [makeRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          leaseGeneration: 6,
          state: VionaRequestExecutionAttemptState.providerFailed,
        }),
      ],
    });
    await finalizeVionaRequestExecutionFailed(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 6,
      },
      makeIndirectDeps(state),
    );
    assert(state.requests[0]!.status === 'failed', 'failed');
  });

  await runAsyncTest('11. Stale generation creates no event on finalize', async () => {
    const state = blankState({
      requests: [makeRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          leaseGeneration: 2,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
        }),
      ],
    });
    await expectIndirectCode('stale_lease_generation', () =>
      finalizeVionaRequestExecutionCompleted(
        {
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 1,
        },
        makeIndirectDeps(state),
      ),
    );
    assert(state.statusEvents.length === 0, 'no status event');
  });

  await runAsyncTest('12. Stale generation creates no audit on finalize', async () => {
    const state = blankState({
      requests: [makeRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          leaseGeneration: 2,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
        }),
      ],
    });
    await expectIndirectCode('stale_lease_generation', () =>
      finalizeVionaRequestExecutionCompleted(
        {
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 0,
        },
        makeIndirectDeps(state),
      ),
    );
    assert(state.auditEvents.length === 0, 'no audit');
  });

  await runAsyncTest('13. Stale generation does not call provider', async () => {
    const state = blankState({ attempts: [makeAttempt({ leaseGeneration: 3 })] });
    const tracker = { calls: 0, duringTx: [] as boolean[] };
    await expectGatewayCode('stale_lease_generation', () =>
      runVionaRequestExecutionProviderGateway(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 0,
          operationCategory: OPERATION,
        },
        makeGatewayDeps(
          state,
          makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker, state),
        ),
      ),
    );
    assert(tracker.calls === 0, 'no adapter invoke');
  });

  await runAsyncTest('14. Stale generation does not resend after stale gateway', async () => {
    const state = blankState({ attempts: [makeAttempt({ leaseGeneration: 1 })] });
    const tracker = { calls: 0, duringTx: [] as boolean[] };
    await expectGatewayCode('stale_lease_generation', () =>
      runVionaRequestExecutionProviderGateway(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 0,
          operationCategory: OPERATION,
        },
        makeGatewayDeps(
          state,
          makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker, state),
        ),
      ),
    );
    await expectGatewayCode('stale_lease_generation', () =>
      runVionaRequestExecutionProviderGateway(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 0,
          operationCategory: OPERATION,
        },
        makeGatewayDeps(
          state,
          makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker, state),
        ),
      ),
    );
    assert(tracker.calls === 0, 'still no resend');
  });

  await runAsyncTest('15. Coordinator propagates one exact generation to gateway/finalize', async () => {
    const tracker = {
      gatewayGen: [] as number[],
      finalizeGen: [] as number[],
    };
    const deps: ExecuteVionaRequestBusinessFlowDeps = {
      claimFn: async () => ({
        requestId: REQUEST_ID,
        attemptId: ATTEMPT_ID,
        attemptNumber: 1,
        executionKey: EXEC_KEY,
        attemptState: 'claimed',
        requestStatus: 'inProgress',
        statusEventId: 'se-1',
        auditEventId: 'ae-1',
        leaseOwner: LEASE_OWNER,
        leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
        leaseGeneration: 7,
      }),
      holdFn: async () => ({ ok: true, holdId: 'hold-1', heldAmountVIO: 0.01, deduplicated: false }),
      settleFn: async () => ({
        ok: true,
        status: 'SETTLED',
        settledAmountVIO: 0.01,
        refundedAmountVIO: 0,
        deduplicated: false,
      }),
      runGatewayFn: async (input) => {
        tracker.gatewayGen.push(input.expectedLeaseGeneration);
        return {
          kind: 'recorded',
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          providerIdempotencyKey: expectedKey(),
          attemptState: VionaRequestExecutionAttemptState.providerSucceeded,
          adapterKind: 'succeeded',
          providerInvoked: true,
        };
      },
      finalizeCompletedFn: async (input) => {
        tracker.finalizeGen.push(input.expectedLeaseGeneration);
        return {
          requestId: REQUEST_ID,
          attemptId: ATTEMPT_ID,
          attemptState: 'completed',
          requestStatus: 'completed',
          statusEventId: 'se-c',
          auditEventId: 'ae-c',
        };
      },
      createAdapter: () => ({ invoke: async () => ({ kind: 'succeeded', resultDigest: 'd' }) }),
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
    assert(tracker.gatewayGen.length === 1 && tracker.gatewayGen[0] === 7, 'gateway gen 7');
    assert(tracker.finalizeGen.length === 1 && tracker.finalizeGen[0] === 7, 'finalize gen 7');
  });

  await runAsyncTest('16. Coordinator never substitutes reloaded newer generation', async () => {
    const state = blankState({
      attempts: [makeAttempt({ leaseGeneration: 0 })],
    });
    const seen: number[] = [];
    const deps: ExecuteVionaRequestBusinessFlowDeps = {
      claimFn: async () => {
        state.attempts[0]!.leaseGeneration = 9;
        return {
          requestId: REQUEST_ID,
          attemptId: ATTEMPT_ID,
          attemptNumber: 1,
          executionKey: EXEC_KEY,
          attemptState: 'claimed',
          requestStatus: 'inProgress',
          statusEventId: 'se-1',
          auditEventId: 'ae-1',
          leaseOwner: LEASE_OWNER,
          leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
          leaseGeneration: 0,
        };
      },
      holdFn: async () => ({ ok: true, holdId: 'hold-1', heldAmountVIO: 0.01, deduplicated: false }),
      runGatewayFn: async (input) => {
        seen.push(input.expectedLeaseGeneration);
        assert(state.attempts[0]!.leaseGeneration === 9, 'db bumped');
        throw new VionaRequestExecutionGatewayError('stale_lease_generation');
      },
      createAdapter: () => ({ invoke: async () => ({ kind: 'succeeded', resultDigest: 'd' }) }),
    };
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      deps,
    );
    assert(!result.ok && result.reason === 'reconciliation_required', 'recon');
    assert(seen.length === 1 && seen[0] === 0, 'uses claim gen not reloaded 9');
  });

  // --- Provider reference hardening (17–25) ---
  await runAsyncTest('17. Single-shot adapter returns exact synthetic reference on success', async () => {
    const adapterSrc = readSource('../src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts');
    assert(
      adapterSrc.includes('providerExternalReference: classified.providerMessageSid'),
      'adapter maps sid field',
    );
    const adapter = createPack40D3TwilioGatewayAdapter({
      message: { fromNumber: '+15005550006', toNumber: '+15005550006', body: 'hi' },
      actorUserId: OWNER,
      isEnabled: () => true,
      circuitBreakerCheck: async () => ({ state: 'closed' }),
      credentials: { accountSid: 'ACtest', authToken: 'token' },
      transport: async () => ({
        status: 201,
        json: { sid: SYNTHETIC_PROVIDER_REFERENCE, status: 'queued' },
      }),
    });
    const result = await adapter.invoke({
      providerName: VIONA_PACK40D3A_PROVIDER_NAME,
      operationCategory: 'send',
      providerIdempotencyKey: expectedKey(),
      correlationId: CORR_ID,
      requestId: REQUEST_ID,
      attemptId: ATTEMPT_ID,
    });
    assert(result.kind === 'succeeded', 'succeeded');
    if (result.kind === 'succeeded') {
      assert(result.providerExternalReference === SYNTHETIC_PROVIDER_REFERENCE, 'exact sid');
    }
  });

  await runAsyncTest('18. Exact reference persisted with success outcome', async () => {
    const state = blankState();
    await runVionaRequestExecutionProviderGateway(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
        operationCategory: OPERATION,
      },
      makeGatewayDeps(
        state,
        makeAdapter({
          kind: 'succeeded',
          resultDigest: 'ok',
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
        }),
      ),
    );
    assert(state.attempts[0]!.providerExternalReference === SYNTHETIC_PROVIDER_REFERENCE, 'stored');
  });

  await runAsyncTest('19. Reference stored when returned on uncertain outcome', async () => {
    const state = blankState();
    await runVionaRequestExecutionProviderGateway(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
        operationCategory: OPERATION,
      },
      makeGatewayDeps(
        state,
        makeAdapter({
          kind: 'uncertain',
          uncertaintyClass: 'response_loss',
          failureReasonDigest: 'loss',
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
        }),
      ),
    );
    assert(
      state.attempts[0]!.providerExternalReference === SYNTHETIC_PROVIDER_REFERENCE,
      'uncertain ref kept',
    );
  });

  await runAsyncTest('20. Known failure before acceptance may retain null reference', async () => {
    const state = blankState();
    await runVionaRequestExecutionProviderGateway(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
        operationCategory: OPERATION,
      },
      makeGatewayDeps(
        state,
        makeAdapter({
          kind: 'failed',
          failureClass: 'blocked_policy',
          failureReasonDigest: 'policy',
        }),
      ),
    );
    assert(state.attempts[0]!.providerExternalReference == null, 'null ref on fail');
  });

  await runAsyncTest('21. Conflicting reference overwrite rejected', async () => {
    const state = blankState({
      attempts: [
        {
          ...pendingAttempt(0),
          providerExternalReference: OTHER_REFERENCE,
        },
      ],
    });
    await expectGatewayCode('outcome_record_conflict', () =>
      recordVionaRequestExecutionProviderOutcome(
        {
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
          expectedLeaseGeneration: 0,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          adapterResult: {
            kind: 'succeeded',
            resultDigest: 'ok',
            providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          },
        },
        { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
      ),
    );
  });

  await runAsyncTest('22. Same reference replay for same attempt safe', async () => {
    const state = blankState({
      attempts: [
        {
          ...pendingAttempt(0),
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
        },
      ],
    });
    const prisma = installFakePrisma(state);
    const recorded = await recordPreparedVionaRequestExecutionAttemptProviderOutcome(
      prisma as never,
      {
        attemptId: ATTEMPT_ID,
        expectedRequestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
        expectedProviderName: VIONA_PACK40D3A_PROVIDER_NAME,
        expectedOperationCategory: OPERATION,
        expectedProviderIdempotencyKey: expectedKey(),
        nextState: VionaRequestExecutionAttemptState.providerSucceeded,
        providerFinishedAt: FIXED_NOW,
        providerResultDigest: 'ok',
        providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
      },
    );
    assert(recorded.updated, 'replay ok');
    assert(state.attempts[0]!.providerExternalReference === SYNTHETIC_PROVIDER_REFERENCE, 'same ref');
  });

  await runAsyncTest('23. Unique reference cannot bind another attempt', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({
          id: ATTEMPT_ID,
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
        }),
        {
          ...pendingAttempt(0),
          id: ATTEMPT_ID_B,
          attemptNumber: 2,
          executionKey: 'exec-2',
          providerIdempotencyKey: expectedKey(ATTEMPT_ID_B),
        },
      ],
    });
    const prisma = installFakePrisma(state);
    try {
      await recordPreparedVionaRequestExecutionAttemptProviderOutcome(prisma as never, {
        attemptId: ATTEMPT_ID_B,
        expectedRequestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
        expectedProviderName: VIONA_PACK40D3A_PROVIDER_NAME,
        expectedOperationCategory: OPERATION,
        expectedProviderIdempotencyKey: expectedKey(ATTEMPT_ID_B),
        nextState: VionaRequestExecutionAttemptState.providerSucceeded,
        providerFinishedAt: FIXED_NOW,
        providerResultDigest: 'ok',
        providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
      });
      assert(false, 'expected unique conflict');
    } catch (error) {
      assert(
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002',
        'unique bind blocked',
      );
    }
  });

  await runAsyncTest('24. Exact reference not in API success response', async () => {
    const { res, state: httpState } = fakeRes();
    await postVionaInternalTriggerRealTwilioPoc(
      {
        authUserId: OWNER,
        body: {
          requestId: REQUEST_ID,
          operatorApprovalGranted: true,
          userConsentGranted: true,
        },
      } as never,
      res,
      {
        coordinator: async () =>
          ({
            ok: true,
            requestId: REQUEST_ID,
            attemptId: ATTEMPT_ID,
            fromStatus: 'triage',
            finalStatus: 'completed',
            providerInvoked: true,
          }) satisfies ExecuteVionaRequestBusinessFlowResult,
      },
    );
    const body = JSON.stringify(httpState.body ?? {});
    assert(!body.includes(SYNTHETIC_PROVIDER_REFERENCE), 'no sid in api');
    assert(!body.includes('providerExternalReference'), 'no ref field');
  });

  await runAsyncTest('25. Exact reference not in error/log/audit fixture', async () => {
    const state = blankState({
      requests: [makeRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          state: VionaRequestExecutionAttemptState.providerSucceeded,
          providerExternalReference: SYNTHETIC_PROVIDER_REFERENCE,
        }),
      ],
    });
    await finalizeVionaRequestExecutionCompleted(
      {
        attemptId: ATTEMPT_ID,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
      },
      makeIndirectDeps(state),
    );
    const auditBlob = JSON.stringify(state.auditEvents);
    const eventBlob = JSON.stringify(state.statusEvents);
    assert(!auditBlob.includes(SYNTHETIC_PROVIDER_REFERENCE), 'audit clean');
    assert(!eventBlob.includes(SYNTHETIC_PROVIDER_REFERENCE), 'event clean');
    const indirect = readSource('../src/services/viona/vionaRequestIndirectStatusActionService.ts');
    assert(!indirect.includes('providerExternalReference'), 'writer never logs ref');
  });

  // --- Runtime isolation + coordinator flows (26–31) ---
  await runAsyncTest('26. Provider call outside transaction', async () => {
    const state = blankState();
    const tracker = { calls: 0, duringTx: [] as boolean[] };
    await runVionaRequestExecutionProviderGateway(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseOwner: LEASE_OWNER,
        expectedLeaseGeneration: 0,
        operationCategory: OPERATION,
      },
      makeGatewayDeps(
        state,
        makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker, state),
      ),
    );
    assert(tracker.calls === 1, 'invoked once');
    assert(tracker.duringTx.every((v) => v === false), 'never inside tx');
    assert(state.adapterCallsDuringTx === 0, 'tx counter zero');
    assert(state.transactionCount >= 2, 'prepare + record txs');
  });

  runTest('27. No blind retry in gateway/coordinator sources', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    for (const src of [gateway, orch]) {
      assert(!src.includes('maxRetries'), 'no maxRetries');
      assert(!src.includes('for (let retry'), 'no retry loop');
    }
  });

  await runAsyncTest('28. Request stays inProgress for outcomeUncertain', async () => {
    const state = blankState({ requests: [makeRequest({ status: 'inProgress' })] });
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      {
        claimFn: async () => ({
          requestId: REQUEST_ID,
          attemptId: ATTEMPT_ID,
          attemptNumber: 1,
          executionKey: EXEC_KEY,
          attemptState: 'claimed',
          requestStatus: 'inProgress',
          statusEventId: 'se-1',
          auditEventId: 'ae-1',
          leaseOwner: LEASE_OWNER,
          leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
          leaseGeneration: 0,
        }),
        holdFn: async () => ({ ok: true, holdId: 'hold-1', heldAmountVIO: 0.01, deduplicated: false }),
        runGatewayFn: async () => ({
          kind: 'recorded',
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          providerIdempotencyKey: expectedKey(),
          attemptState: VionaRequestExecutionAttemptState.outcomeUncertain,
          adapterKind: 'uncertain',
          providerInvoked: true,
        }),
        createAdapter: () => ({ invoke: async () => ({ kind: 'uncertain', uncertaintyClass: 'timeout' }) }),
      },
    );
    assert(!result.ok && result.reason === 'provider_uncertain', 'uncertain');
    if (!result.ok) assert(result.requestStatus === 'inProgress', 'inProgress');
    assert(state.requests[0]!.status === 'inProgress', 'request unchanged');
  });

  await runAsyncTest('29. Existing success flow still works via coordinator', async () => {
    const tracker = { completes: 0, gateways: 0 };
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      {
        claimFn: async () => {
          tracker.gateways += 0;
          return {
            requestId: REQUEST_ID,
            attemptId: ATTEMPT_ID,
            attemptNumber: 1,
            executionKey: EXEC_KEY,
            attemptState: 'claimed',
            requestStatus: 'inProgress',
            statusEventId: 'se-1',
            auditEventId: 'ae-1',
            leaseOwner: LEASE_OWNER,
            leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
            leaseGeneration: 0,
          };
        },
        holdFn: async () => ({ ok: true, holdId: 'hold-1', heldAmountVIO: 0.01, deduplicated: false }),
        runGatewayFn: async () => {
          tracker.gateways += 1;
          return {
            kind: 'recorded',
            attemptId: ATTEMPT_ID,
            requestId: REQUEST_ID,
            providerIdempotencyKey: expectedKey(),
            attemptState: VionaRequestExecutionAttemptState.providerSucceeded,
            adapterKind: 'succeeded',
            providerInvoked: true,
          };
        },
        settleFn: async () => ({
          ok: true,
          status: 'SETTLED',
          settledAmountVIO: 0.01,
          refundedAmountVIO: 0,
          deduplicated: false,
        }),
        finalizeCompletedFn: async () => {
          tracker.completes += 1;
          return {
            requestId: REQUEST_ID,
            attemptId: ATTEMPT_ID,
            attemptState: 'completed',
            requestStatus: 'completed',
            statusEventId: 'se-c',
            auditEventId: 'ae-c',
          };
        },
        createAdapter: () => ({ invoke: async () => ({ kind: 'succeeded', resultDigest: 'd' }) }),
      },
    );
    assert(result.ok === true && result.finalStatus === 'completed', 'success flow');
    assert(tracker.gateways === 1 && tracker.completes === 1, 'once each');
  });

  await runAsyncTest('30. Existing failure flow still works via coordinator', async () => {
    const tracker = { fails: 0, refunds: 0 };
    const result = await executeVionaRequestBusinessFlow(
      {
        authUserId: OWNER,
        requestId: REQUEST_ID,
        fromNumber: '+15005550006',
        toNumber: '+15005550006',
        body: 'hi',
      },
      {
        claimFn: async () => ({
          requestId: REQUEST_ID,
          attemptId: ATTEMPT_ID,
          attemptNumber: 1,
          executionKey: EXEC_KEY,
          attemptState: 'claimed',
          requestStatus: 'inProgress',
          statusEventId: 'se-1',
          auditEventId: 'ae-1',
          leaseOwner: LEASE_OWNER,
          leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
          leaseGeneration: 0,
        }),
        holdFn: async () => ({ ok: true, holdId: 'hold-1', heldAmountVIO: 0.01, deduplicated: false }),
        runGatewayFn: async () => ({
          kind: 'recorded',
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          providerIdempotencyKey: expectedKey(),
          attemptState: VionaRequestExecutionAttemptState.providerFailed,
          adapterKind: 'failed',
          providerInvoked: true,
        }),
        refundFn: async () => {
          tracker.refunds += 1;
          return {
            ok: true,
            status: 'REFUNDED',
            settledAmountVIO: 0,
            refundedAmountVIO: 0.01,
            deduplicated: false,
          };
        },
        finalizeFailedFn: async () => {
          tracker.fails += 1;
          return {
            requestId: REQUEST_ID,
            attemptId: ATTEMPT_ID,
            attemptState: 'failed',
            requestStatus: 'failed',
            statusEventId: 'se-f',
            auditEventId: 'ae-f',
          };
        },
        createAdapter: () => ({ invoke: async () => ({ kind: 'failed', failureClass: 'x', failureReasonDigest: 'y' }) }),
      },
    );
    assert(result.ok === true && result.finalStatus === 'failed', 'failure flow');
    assert(tracker.fails === 1 && tracker.refunds === 1, 'finalize + refund once');
  });

  runTest('31. Escrow key attempt-scoped', () => {
    const coord = readSource('../src/services/viona/vionaPack40D3EscrowCoordination.ts');
    assert(coord.includes('executionAttemptId'), 'attempt in key builder');
    const key = buildVionaPack40D3EscrowIdempotencyKey({
      requestId: REQUEST_ID,
      executionAttemptId: ATTEMPT_ID,
    });
    assert(key.includes(ATTEMPT_ID), 'attempt id embedded');
    assert(key.includes(REQUEST_ID), 'request id embedded');
  });

  // --- Wiring closure + preservation (32–40) ---
  runTest('32. Signed webhook execution disabled', () => {
    const webhook = readSource('../src/controllers/VionaWebhookMerchantAgentController.ts');
    assert(!webhook.includes('executeVionaRequestBusinessFlow'), 'webhook no coordinator');
    assert(!webhook.includes('runVionaRequestExecutionProviderGateway'), 'webhook no gateway');
  });

  runTest('33. Dispatch remains unwired for provider execution', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(!orch.includes('approvedInternalDispatch'), 'dispatch trigger unwired');
    const dispatch = readSourceNoComments('../src/services/viona/vionaAutonomousDispatchService.ts');
    assert(dispatch.includes('pack40d_provider_execution_disabled'), 'dispatch closed');
  });

  runTest('34. Consumer execution unsupported in gateway', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(gateway.includes('VionaRequestScopeKind.merchant'), 'merchant required');
    assert(!gateway.includes('VionaRequestScopeKind.consumer'), 'no consumer allow');
  });

  runTest('35. Legacy execution unsupported in gateway', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('VionaRequestScopeKind.legacyUnresolved'), 'no legacy allow');
  });

  runTest('36. Pack40D live orchestrator remains recovery-free (DR3B endpoint separate)', () => {
    const orch = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
    const pocController = readSource('../src/controllers/VionaInternalRealTwilioPocController.ts');
    assert(!orch.includes('acquireRecoveryLease'), 'coordinator no recovery');
    assert(!orch.includes('vionaRequestRecoveryLeaseService'), 'no recovery lease import');
    assert(!pocController.includes('execution-attempts'), 'POC controller no recovery route');
    const internalRoutes = readSource('../src/routes/internalRoutes.ts');
    assert(internalRoutes.includes('execution-attempts/:attemptId/recovery'), 'DR3B recovery route wired');
    assert(internalRoutes.includes('superAdminMiddleware'), 'recovery requires operator admin');
  });

  runTest('37. Schema/migration unchanged in DR3A production sources', () => {
    for (const rel of [
      '../src/services/viona/vionaRequestExecutionGatewayService.ts',
      '../src/services/viona/vionaRequestExecutionOrchestrator.ts',
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
      '../src/repositories/vionaRequestExecutionAttemptRepository.ts',
    ]) {
      const source = readSource(rel);
      assert(!source.includes('prisma/migrations'), 'no migration edits in src');
    }
    const schema = readSource('../prisma/schema.prisma');
    assert(schema.includes('leaseGeneration'), 'field exists');
    assert(schema.includes('providerExternalReference'), 'ref field exists');
  });

  runTest('38. Pack40A/B/C unchanged markers', () => {
    const status = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
    assert(!status.includes('vionaRequestExecutionGatewayService'), 'Pack40C clean');
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('vionaRequestNote'), 'Pack40A untouched');
    assert(!gateway.includes('Pack40B'), 'Pack40B untouched');
  });

  runTest('39. Closed Pack40D preserved', () => {
    const d2 = readSource('../src/services/viona/vionaRequestIndirectStatusActionService.ts');
    assert(d2.includes('claimVionaRequestExecution'), 'D2 claim');
    assert(d2.includes('finalizeVionaRequestExecutionCompleted'), 'D2 complete');
    const g = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(g.includes('runVionaRequestExecutionProviderGateway'), 'D3A gateway');
    assert(!d2.includes('vionaRequestExecutionGatewayService'), 'D2 not wired to gateway');
  });

  runTest('40. Pack40S unimplemented', () => {
    const hit = fs
      .readdirSync(path.resolve(__dirname, '../src'), { recursive: true })
      .map(String)
      .some((f) => f.toLowerCase().includes('pack40s'));
    assert(!hit, 'no Pack40S implementation');
  });

  console.log(`\nPack40DR3A results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error('\nFAIL:', error);
  process.exit(1);
});
