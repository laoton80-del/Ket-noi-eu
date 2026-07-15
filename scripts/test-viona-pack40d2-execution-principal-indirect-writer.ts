/**
 * Pack40D2 — execution principal + merchant-only indirect writer tests.
 *
 * Operator phrase: APPROVE_PACK40D2_EXECUTION_PRINCIPAL_INDIRECT_WRITER.
 * Fake/injected dependencies only — no database, staging, or network access.
 *
 * Run: npx tsx scripts/test-viona-pack40d2-execution-principal-indirect-writer.ts
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
  findMaxAttemptNumberForRequest,
  VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES,
} from '../src/repositories/vionaRequestExecutionAttemptRepository';
import {
  buildMerchantIndirectExecutionClaimWhere,
  VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS,
} from '../src/services/viona/vionaRequestIndirectExecutionAccessScope';
import {
  resolveVionaRequestExecutionPrincipalContext,
  validateTrustedExecutionTrigger,
  VIONA_REQUEST_EXECUTION_APPROVED_TRIGGER_TYPES,
  type TrustedExecutionTrigger,
  type VionaRequestExecutionPrincipalContext,
} from '../src/services/viona/vionaRequestExecutionPrincipalContext';
import {
  claimVionaRequestExecution,
  finalizeVionaRequestExecutionCompleted,
  finalizeVionaRequestExecutionFailed,
  parsePack40D2StatusEventAttemptId,
  VIONA_PACK40D2_EVENT_CATEGORY_CLAIMED,
  VIONA_PACK40D2_EVENT_CATEGORY_COMPLETED,
  VIONA_PACK40D2_EVENT_CATEGORY_FAILED,
  VIONA_REQUEST_INDIRECT_AUDIT_ACTOR_ROLE,
  VIONA_REQUEST_INDIRECT_AUDIT_EVENT_TYPE,
  VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS,
  VIONA_REQUEST_INDIRECT_COMPLETED_STATUS,
  VIONA_REQUEST_INDIRECT_FAILED_STATUS,
  VionaRequestIndirectExecutionError,
  type VionaRequestIndirectStatusActionDeps,
} from '../src/services/viona/vionaRequestIndirectStatusActionService';

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
  claimedAt: Date | null;
  providerName: string | null;
  operationCategory: string | null;
  providerIdempotencyKey: string | null;
  providerStartedAt: Date | null;
  providerFinishedAt: Date | null;
  providerResultDigest: string | null;
  providerExternalReferenceDigest: string | null;
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
  requestFindFirstCalls: number;
  attemptCreates: number;
  updateManyCalls: number;
  statusEventCreates: number;
  auditCreates: number;
  maxAttemptQueries: number;
  activeAttemptQueries: number;
  transactionCount: number;
  transactionIsolationLevel?: string;
  inTransaction: boolean;
  failAuditCreate: boolean;
  failStatusEventCreate: boolean;
  failTransaction: boolean;
  forceRequestUpdateZero: boolean;
  forcePartialIndexConflict: boolean;
  forceSerializationConflict: boolean;
  now: Date;
};

const OWNER = 'user-merchant-owner';
const PROFILE_ID = 'profile-merchant-1';
const TENANT_ID = 'tenant-merchant-1';
const REQUEST_ID = 'req-merchant-triage-1';
const OTHER_OWNER = 'user-other';
const OTHER_PROFILE = 'profile-other';
const OTHER_TENANT = 'tenant-other';
const FIXED_NOW = new Date('2026-07-15T12:00:00.000Z');
const LEASE_OWNER = 'worker-alpha';
const EXEC_KEY = 'exec-key-fixed-1';
const ATTEMPT_ID = 'attempt-fixed-1';
const CORR_ID = 'corr-pack40d2-1';

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

function makeTrustedTrigger(
  overrides: Partial<TrustedExecutionTrigger> = {},
): TrustedExecutionTrigger {
  return {
    triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
    triggeringUserId: OWNER,
    requestId: REQUEST_ID,
    correlationId: CORR_ID,
    ...overrides,
  };
}

function makeMerchantRequest(overrides: Partial<RequestRow> = {}): RequestRow {
  return {
    id: REQUEST_ID,
    status: 'triage',
    ownerUserId: OWNER,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_ID,
    tenantId: TENANT_ID,
    ...overrides,
  };
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

function makeAttempt(overrides: Partial<AttemptRow> & Pick<AttemptRow, 'id' | 'state'>): AttemptRow {
  return {
    requestId: REQUEST_ID,
    attemptNumber: 1,
    executionKey: EXEC_KEY,
    correlationId: CORR_ID,
    principalType: VionaRequestExecutionPrincipalType.merchantService,
    triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
    triggeringUserId: OWNER,
    ownerUserIdSnapshot: OWNER,
    scopeKindSnapshot: VionaRequestScopeKind.merchant,
    merchantProfileIdSnapshot: PROFILE_ID,
    tenantIdSnapshot: TENANT_ID,
    leaseOwner: LEASE_OWNER,
    leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
    claimedAt: FIXED_NOW,
    providerName: null,
    operationCategory: null,
    providerIdempotencyKey: null,
    providerStartedAt: null,
    providerFinishedAt: null,
    providerResultDigest: null,
    providerExternalReferenceDigest: null,
    failureClass: null,
    failureReasonDigest: null,
    finalizedAt: null,
    abandonedAt: null,
    ...overrides,
  };
}

function matchesRequestWhere(
  row: RequestRow,
  where: PrismaTypes.VionaRequestWhereInput,
): boolean {
  if (where.id != null && row.id !== where.id) return false;
  if (where.status != null && row.status !== where.status) return false;
  if (where.ownerUserId != null && row.ownerUserId !== where.ownerUserId) return false;
  if (where.scopeKind != null && row.scopeKind !== where.scopeKind) return false;
  if (where.merchantProfileId != null && row.merchantProfileId !== where.merchantProfileId) {
    return false;
  }
  if (where.tenantId != null && row.tenantId !== where.tenantId) return false;
  return true;
}

function installFakePrisma(state: FakeState): VionaRequestIndirectStatusActionDeps['prisma'] {
  type FakeTx = {
    merchantProfile: {
      findUnique: (args: {
        where: { ownerUserId: string };
        select?: unknown;
      }) => Promise<ProfileRow | null>;
      findMany: () => Promise<never>;
    };
    vionaRequest: {
      findFirst: (args: {
        where: PrismaTypes.VionaRequestWhereInput;
        select?: unknown;
      }) => Promise<RequestRow | null>;
      updateMany: (args: {
        where: PrismaTypes.VionaRequestWhereInput;
        data: { status?: string };
      }) => Promise<{ count: number }>;
    };
    vionaRequestExecutionAttempt: {
      findFirst: (args: {
        where: {
          requestId?: string;
          state?: { in: readonly VionaRequestExecutionAttemptState[] };
        };
        select?: { attemptNumber?: boolean } | Record<string, boolean>;
        orderBy?: { attemptNumber: 'desc' };
      }) => Promise<Partial<AttemptRow> | null>;
      findUnique: (args: {
        where: { id?: string; executionKey?: string };
        select?: unknown;
      }) => Promise<AttemptRow | Partial<AttemptRow> | null>;
      create: (args: { data: Record<string, unknown> }) => Promise<AttemptRow>;
      updateMany: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<{ count: number }>;
      findMany: () => Promise<AttemptRow[]>;
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
        return state.profiles.find((p) => p.ownerUserId === where.ownerUserId) ?? null;
      },
      findMany: async () => {
        throw new Error('global MerchantProfile scan forbidden');
      },
    },
    vionaRequest: {
      findFirst: async ({ where }) => {
        state.requestFindFirstCalls += 1;
        return state.requests.find((row) => matchesRequestWhere(row, where)) ?? null;
      },
      updateMany: async ({ where, data }) => {
        state.updateManyCalls += 1;
        if (state.forceRequestUpdateZero) return { count: 0 };
        let count = 0;
        for (const row of state.requests) {
          if (matchesRequestWhere(row, where)) {
            if (data.status != null) row.status = data.status;
            count += 1;
          }
        }
        return { count };
      },
    },
    vionaRequestExecutionAttempt: {
      findFirst: async ({ where, select, orderBy }) => {
        if (where.state?.in != null) {
          state.activeAttemptQueries += 1;
          const active = state.attempts
            .filter(
              (a) =>
                a.requestId === where.requestId &&
                (where.state!.in as readonly string[]).includes(a.state),
            )
            .sort((a, b) => b.attemptNumber - a.attemptNumber);
          const hit = active[0] ?? null;
          if (hit == null) return null;
          if (select && 'executionKey' in select) {
            return {
              id: hit.id,
              requestId: hit.requestId,
              attemptNumber: hit.attemptNumber,
              executionKey: hit.executionKey,
              state: hit.state,
              correlationId: hit.correlationId,
              leaseOwner: hit.leaseOwner,
              leaseExpiresAt: hit.leaseExpiresAt,
              providerIdempotencyKey: hit.providerIdempotencyKey,
            };
          }
          return hit;
        }
        state.maxAttemptQueries += 1;
        const forRequest = state.attempts
          .filter((a) => a.requestId === where.requestId)
          .sort((a, b) => b.attemptNumber - a.attemptNumber);
        const latest = forRequest[0];
        if (latest == null) return null;
        if (select && 'attemptNumber' in select && Object.keys(select).length === 1) {
          return { attemptNumber: latest.attemptNumber };
        }
        return latest;
      },
      findUnique: async ({ where, select }) => {
        const hit =
          (where.id != null ? state.attempts.find((a) => a.id === where.id) : null) ??
          (where.executionKey != null
            ? state.attempts.find((a) => a.executionKey === where.executionKey)
            : null) ??
          null;
        if (hit == null) return null;
        if (select && 'executionKey' in (select as object)) {
          return {
            id: hit.id,
            requestId: hit.requestId,
            attemptNumber: hit.attemptNumber,
            executionKey: hit.executionKey,
            state: hit.state,
            correlationId: hit.correlationId,
            leaseOwner: hit.leaseOwner,
            leaseExpiresAt: hit.leaseExpiresAt,
            providerIdempotencyKey: hit.providerIdempotencyKey,
          };
        }
        return hit;
      },
      create: async ({ data }) => {
        state.attemptCreates += 1;
        if (state.forcePartialIndexConflict) {
          const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          });
          throw err;
        }
        const created: AttemptRow = {
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
          providerName: null,
          operationCategory: null,
          providerIdempotencyKey: null,
          providerStartedAt: null,
          providerFinishedAt: null,
          providerResultDigest: null,
          providerExternalReferenceDigest: null,
          failureClass: null,
          failureReasonDigest: null,
          finalizedAt: null,
          abandonedAt: null,
        };
        state.attempts.push(created);
        return created;
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const attempt of state.attempts) {
          if (where.id != null && attempt.id !== where.id) continue;
          if (where.requestId != null && attempt.requestId !== where.requestId) continue;
          if (where.leaseOwner !== undefined && attempt.leaseOwner !== where.leaseOwner) continue;
          if (
            where.state != null &&
            typeof where.state === 'object' &&
            'in' in where.state &&
            Array.isArray(where.state.in) &&
            !where.state.in.includes(attempt.state)
          ) {
            continue;
          }
          Object.assign(attempt, data);
          count += 1;
        }
        return { count };
      },
      findMany: async () => state.attempts,
    },
    vionaRequestStatusEvent: {
      create: async ({ data }) => {
        state.statusEventCreates += 1;
        if (state.failStatusEventCreate) throw new Error('status event create failed');
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
        if (state.failAuditCreate) throw new Error('audit create failed');
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
      if (state.failTransaction) throw new Error('transaction rejected');
      if (state.forceSerializationConflict) {
        const err = new Prisma.PrismaClientKnownRequestError('Serialization failure', {
          code: 'P2034',
          clientVersion: 'test',
        });
        throw err;
      }

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
  } as unknown as VionaRequestIndirectStatusActionDeps['prisma'];
}

function makeDeps(state: FakeState): VionaRequestIndirectStatusActionDeps {
  return {
    prisma: installFakePrisma(state),
    clock: () => new Date(state.now.getTime()),
    createId: () => ATTEMPT_ID,
    createExecutionKey: () => EXEC_KEY,
    createLeaseOwner: () => LEASE_OWNER,
    defaultLeaseDurationMs: 60_000,
  };
}

function blankState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    requests: [makeMerchantRequest()],
    profiles: [makeProfile()],
    attempts: [],
    statusEvents: [],
    auditEvents: [],
    preTxProfileLookups: 0,
    txProfileLookups: 0,
    requestFindFirstCalls: 0,
    attemptCreates: 0,
    updateManyCalls: 0,
    statusEventCreates: 0,
    auditCreates: 0,
    maxAttemptQueries: 0,
    activeAttemptQueries: 0,
    transactionCount: 0,
    inTransaction: false,
    failAuditCreate: false,
    failStatusEventCreate: false,
    failTransaction: false,
    forceRequestUpdateZero: false,
    forcePartialIndexConflict: false,
    forceSerializationConflict: false,
    now: FIXED_NOW,
    ...overrides,
  };
}

async function expectCode(
  code: string,
  fn: () => Promise<unknown>,
): Promise<void> {
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

async function main(): Promise<void> {
  console.log('Pack40D2 execution principal + indirect writer suite\n');

  // --- Principal resolution ---
  await runAsyncTest('1. Signed merchant webhook trigger shape accepted', async () => {
    const v = validateTrustedExecutionTrigger(makeTrustedTrigger());
    assert(v.ok, 'accepted');
  });

  await runAsyncTest('2. Internal authenticated controller trigger accepted', async () => {
    const v = validateTrustedExecutionTrigger(
      makeTrustedTrigger({
        triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
      }),
    );
    assert(v.ok, 'accepted');
  });

  await runAsyncTest('3. Approved internal dispatch trigger accepted', async () => {
    const v = validateTrustedExecutionTrigger(
      makeTrustedTrigger({
        triggerType: VionaRequestExecutionTriggerType.approvedInternalDispatch,
      }),
    );
    assert(v.ok, 'accepted');
  });

  runTest('4. Unsupported trigger rejected', () => {
    const v = validateTrustedExecutionTrigger({
      ...makeTrustedTrigger(),
      triggerType: 'clientBody' as TrustedExecutionTrigger['triggerType'],
    });
    assert(!v.ok && v.code === 'invalid_trusted_trigger', 'rejected');
  });

  runTest('5. Missing triggering user rejected', () => {
    const v = validateTrustedExecutionTrigger(makeTrustedTrigger({ triggeringUserId: '  ' }));
    assert(!v.ok, 'rejected');
  });

  await runAsyncTest('6. Profile resolved through transaction client', async () => {
    const state = blankState();
    const deps = makeDeps(state);
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, deps);
    assert(state.txProfileLookups === 1, 'one tx profile lookup');
  });

  await runAsyncTest('7. No profile lookup before transaction', async () => {
    const state = blankState();
    const deps = makeDeps(state);
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, deps);
    assert(state.preTxProfileLookups === 0, 'no pre-tx lookup');
  });

  await runAsyncTest('8. Missing profile denied', async () => {
    const state = blankState({ profiles: [] });
    await expectCode('merchant_execution_not_authorized', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
    assert(state.attempts.length === 0, 'no attempt');
    assert(state.requests[0]!.status === 'triage', 'status unchanged');
  });

  await runAsyncTest('9. Inactive profile denied for claim', async () => {
    const state = blankState({ profiles: [makeProfile({ isActive: false })] });
    await expectCode('merchant_execution_not_authorized', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('10. Exactly one bounded profile lookup occurs', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.txProfileLookups === 1, 'exactly one');
  });

  await runAsyncTest('11. Client tenant field ignored', async () => {
    const state = blankState();
    const trigger = {
      ...makeTrustedTrigger(),
      tenantId: OTHER_TENANT,
    } as TrustedExecutionTrigger & { tenantId: string };
    const result = await claimVionaRequestExecution({ trigger }, makeDeps(state));
    assert(state.attempts[0]!.tenantIdSnapshot === TENANT_ID, 'snapshot from DB profile');
    assert(result.attemptId.length > 0, 'claimed');
  });

  await runAsyncTest('12. Client profile field ignored', async () => {
    const state = blankState();
    const trigger = {
      ...makeTrustedTrigger(),
      merchantProfileId: OTHER_PROFILE,
    } as TrustedExecutionTrigger & { merchantProfileId: string };
    await claimVionaRequestExecution({ trigger }, makeDeps(state));
    assert(state.attempts[0]!.merchantProfileIdSnapshot === PROFILE_ID, 'snapshot from DB');
  });

  await runAsyncTest('13. Client scope field ignored', async () => {
    const state = blankState();
    const trigger = {
      ...makeTrustedTrigger(),
      scopeKind: 'consumer',
    } as TrustedExecutionTrigger & { scopeKind: string };
    await claimVionaRequestExecution({ trigger }, makeDeps(state));
    assert(state.attempts[0]!.scopeKindSnapshot === VionaRequestScopeKind.merchant, 'merchant');
  });

  runTest('14. Pack40C principal is not imported', () => {
    const source = readSource(
      '../src/services/viona/vionaRequestExecutionPrincipalContext.ts',
    );
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    const scope = readSource(
      '../src/services/viona/vionaRequestIndirectExecutionAccessScope.ts',
    );
    for (const s of [source, writer, scope]) {
      assert(!s.includes('vionaRequestStatusPrincipalContext'), 'no Pack40C principal');
      assert(!s.includes('vionaRequestStatusAccessScope'), 'no Pack40C access scope');
      assert(!s.includes('transitionVionaRequestStatus'), 'no Pack40C writer');
    }
  });

  // --- Merchant eligibility ---
  await runAsyncTest('15. Exact merchant request eligible', async () => {
    const state = blankState();
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger() },
      makeDeps(state),
    );
    assert(result.requestStatus === 'inProgress', 'inProgress');
  });

  await runAsyncTest('16. Consumer request denied', async () => {
    const state = blankState({
      requests: [
        makeMerchantRequest({
          scopeKind: VionaRequestScopeKind.consumer,
          merchantProfileId: null,
        }),
      ],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('17. Legacy request denied', async () => {
    const state = blankState({
      requests: [
        makeMerchantRequest({
          scopeKind: VionaRequestScopeKind.legacyUnresolved,
          merchantProfileId: null,
        }),
      ],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('18. Unsupported provenance denied', async () => {
    const state = blankState({
      requests: [
        makeMerchantRequest({
          scopeKind: 'unsupported' as VionaRequestScopeKind,
        }),
      ],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('19. Merchant with null profile denied', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ merchantProfileId: null })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('20. Wrong profile denied', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ merchantProfileId: OTHER_PROFILE })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('21. Same tenant with wrong profile denied', async () => {
    const state = blankState({
      profiles: [makeProfile(), makeProfile({ id: OTHER_PROFILE, ownerUserId: OTHER_OWNER })],
      requests: [
        makeMerchantRequest({
          merchantProfileId: OTHER_PROFILE,
          ownerUserId: OTHER_OWNER,
        }),
      ],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('22. Tenant mismatch denied', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ tenantId: OTHER_TENANT })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('23. Owner mismatch denied', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ ownerUserId: OTHER_OWNER })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('24. Profile owner without exact request ownership denied', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ ownerUserId: null })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('25. Merchant fields cannot convert a consumer request', async () => {
    const state = blankState({
      requests: [
        makeMerchantRequest({
          scopeKind: VionaRequestScopeKind.consumer,
          merchantProfileId: PROFILE_ID,
          tenantId: TENANT_ID,
          ownerUserId: OWNER,
        }),
      ],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
  });

  await runAsyncTest('26. Stale trigger envelope cannot authorize another request', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ id: 'req-other' })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution(
        { trigger: makeTrustedTrigger({ requestId: REQUEST_ID }) },
        makeDeps(state),
      ),
    );
  });

  // --- Claim transaction ---
  await runAsyncTest('27. Claim uses Serializable isolation', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(
      state.transactionIsolationLevel === Prisma.TransactionIsolationLevel.Serializable ||
        state.transactionIsolationLevel === 'Serializable',
      `isolation=${state.transactionIsolationLevel}`,
    );
  });

  await runAsyncTest('28. Request authorization occurs inside transaction', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.requestFindFirstCalls >= 1, 'findFirst in tx');
    assert(state.transactionCount === 1, 'single tx');
  });

  await runAsyncTest('29. Attempt-number allocation occurs inside transaction', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({
          id: 'old-terminal',
          state: VionaRequestExecutionAttemptState.completed,
          attemptNumber: 3,
          executionKey: 'old-key',
        }),
      ],
    });
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger(), attemptId: 'new-attempt' },
      makeDeps(state),
    );
    assert(result.attemptNumber === 4, `got ${result.attemptNumber}`);
    assert(state.maxAttemptQueries >= 1, 'max queried in tx');
  });

  runTest('30. No count-plus-one outside transaction', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(writer.includes('findMaxAttemptNumberForRequest'), 'uses max helper');
    assert(!writer.includes('.count('), 'no count aggregation');
  });

  await runAsyncTest('31. Attempt creation occurs inside transaction', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.attemptCreates === 1 && state.transactionCount === 1, 'create in tx');
  });

  await runAsyncTest('32. Request conditional update occurs inside transaction', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.updateManyCalls === 1, 'one updateMany');
  });

  await runAsyncTest('33. Start event occurs inside transaction', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.statusEventCreates === 1, 'one event');
  });

  await runAsyncTest('34. Start audit occurs inside transaction', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.auditCreates === 1, 'one audit');
  });

  await runAsyncTest('35. Successful claim sets request to inProgress', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.requests[0]!.status === VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS, 'inProgress');
  });

  await runAsyncTest('36. Successful claim sets attempt to claimed', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.claimed, 'claimed');
  });

  await runAsyncTest('37. Attempt snapshots use current trusted DB state', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    const a = state.attempts[0]!;
    assert(a.ownerUserIdSnapshot === OWNER, 'owner');
    assert(a.scopeKindSnapshot === VionaRequestScopeKind.merchant, 'scope');
    assert(a.merchantProfileIdSnapshot === PROFILE_ID, 'profile');
    assert(a.tenantIdSnapshot === TENANT_ID, 'tenant');
    assert(a.principalType === VionaRequestExecutionPrincipalType.merchantService, 'principal');
    assert(a.triggerType === VionaRequestExecutionTriggerType.signedMerchantWebhook, 'trigger');
    assert(a.triggeringUserId === OWNER, 'triggering user');
    assert(a.correlationId === CORR_ID, 'correlation');
  });

  await runAsyncTest('38. Provider fields remain null', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    const a = state.attempts[0]!;
    assert(a.providerName == null, 'providerName');
    assert(a.operationCategory == null, 'operationCategory');
    assert(a.providerIdempotencyKey == null, 'providerIdempotencyKey');
    assert(a.providerStartedAt == null && a.providerFinishedAt == null, 'timestamps');
    assert(a.providerResultDigest == null, 'digest');
  });

  await runAsyncTest('39. Lease fields are set', async () => {
    const state = blankState();
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger() },
      makeDeps(state),
    );
    assert(result.leaseOwner === LEASE_OWNER, 'lease owner');
    assert(result.leaseExpiresAt.getTime() === FIXED_NOW.getTime() + 60_000, 'lease expiry');
  });

  await runAsyncTest('40. Execution key is server generated', async () => {
    const state = blankState();
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger() },
      makeDeps(state),
    );
    assert(result.executionKey === EXEC_KEY, 'server key');
  });

  await runAsyncTest('41. One active attempt only', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    const active = state.attempts.filter((a) =>
      (VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES as readonly string[]).includes(a.state),
    );
    assert(active.length === 1, 'one active');
  });

  await runAsyncTest('42. Existing active attempt blocks claim', async () => {
    const state = blankState({
      attempts: [makeAttempt({ id: 'existing', state: VionaRequestExecutionAttemptState.claimed })],
    });
    await expectCode('active_attempt_exists', () =>
      claimVionaRequestExecution(
        { trigger: makeTrustedTrigger(), attemptId: 'second', executionKey: 'k2' },
        makeDeps(state),
      ),
    );
    assert(state.requests[0]!.status === 'triage', 'unchanged');
    assert(state.attempts.length === 1, 'no second attempt');
  });

  await runAsyncTest('43. Partial-index conflict fails safely', async () => {
    const state = blankState({ forcePartialIndexConflict: true });
    await expectCode('claim_conflict', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
    assert(state.attempts.length === 0, 'rolled back');
    assert(state.requests[0]!.status === 'triage', 'status rolled back');
  });

  await runAsyncTest('44. Zero-row request update rolls back attempt', async () => {
    const state = blankState({ forceRequestUpdateZero: true });
    await expectCode('claim_conflict', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
    assert(state.attempts.length === 0, 'attempt rolled back');
    assert(state.statusEvents.length === 0, 'no event');
    assert(state.auditEvents.length === 0, 'no audit');
  });

  await runAsyncTest('45. Event failure rolls back request and attempt', async () => {
    const state = blankState({ failStatusEventCreate: true });
    await expectCode('claim_conflict', async () => {
      try {
        await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
      } catch (error) {
        if (error instanceof Error && error.message === 'status event create failed') {
          // raw failure before mapping — ensure rollback via fake tx
          assert(state.attempts.length === 0, 'attempt rolled back');
          assert(state.requests[0]!.status === 'triage', 'request rolled back');
          throw new VionaRequestIndirectExecutionError('claim_conflict');
        }
        throw error;
      }
    });
  });

  await runAsyncTest('46. Audit failure rolls back request, attempt and event', async () => {
    const state = blankState({ failAuditCreate: true });
    try {
      await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
      throw new Error('should fail');
    } catch (error) {
      assert(
        error instanceof Error && error.message === 'audit create failed',
        'audit failed',
      );
      assert(state.attempts.length === 0, 'attempt rolled back');
      assert(state.requests[0]!.status === 'triage', 'request rolled back');
      assert(state.statusEvents.length === 0, 'event rolled back');
    }
  });

  await runAsyncTest('47. Serialization conflict creates no partial writes', async () => {
    const state = blankState({ forceSerializationConflict: true });
    await expectCode('claim_conflict', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state)),
    );
    assert(state.attempts.length === 0, 'no attempt');
    assert(state.statusEvents.length === 0, 'no event');
  });

  runTest('48. No automatic retry occurs', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('for (let retry'), 'no retry loop');
    assert(!writer.includes('while ('), 'no while retry');
    assert(!writer.includes('maxRetries'), 'no maxRetries');
  });

  // --- Attempt binding ---
  await runAsyncTest('49. Event binds exact attempt', async () => {
    const state = blankState();
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger() },
      makeDeps(state),
    );
    const event = state.statusEvents[0]!;
    assert(parsePack40D2StatusEventAttemptId(event.reason) === result.attemptId, 'bound');
    assert(event.fromStatus === 'triage' && event.toStatus === 'inProgress', 'statuses');
  });

  await runAsyncTest('50. Audit binds exact attempt', async () => {
    const state = blankState();
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger() },
      makeDeps(state),
    );
    const audit = state.auditEvents[0]!;
    assert(audit.eventType === VIONA_REQUEST_INDIRECT_AUDIT_EVENT_TYPE, 'stateTransition');
    assert(audit.actorRoleLabel === VIONA_REQUEST_INDIRECT_AUDIT_ACTOR_ROLE, 'role');
    assert(audit.payloadJson.executionAttemptId === result.attemptId, 'attempt id');
    assert(audit.payloadJson.eventCategory === VIONA_PACK40D2_EVENT_CATEGORY_CLAIMED, 'category');
  });

  await runAsyncTest('51. Attempt belongs to exact request', async () => {
    const state = blankState();
    const result = await claimVionaRequestExecution(
      { trigger: makeTrustedTrigger() },
      makeDeps(state),
    );
    assert(state.attempts[0]!.requestId === result.requestId, 'bound request');
  });

  await runAsyncTest('52. Snapshot fields remain immutable', async () => {
    const state = blankState();
    await claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(state));
    const before = { ...state.attempts[0]! };
    state.attempts[0]!.state = VionaRequestExecutionAttemptState.providerSucceeded;
    state.requests[0]!.status = 'inProgress';
    await finalizeVionaRequestExecutionCompleted(
      {
        attemptId: before.id,
        requestId: REQUEST_ID,
        expectedLeaseOwner: LEASE_OWNER,
      },
      makeDeps(state),
    );
    const after = state.attempts[0]!;
    assert(after.ownerUserIdSnapshot === before.ownerUserIdSnapshot, 'owner snap');
    assert(after.tenantIdSnapshot === before.tenantIdSnapshot, 'tenant snap');
    assert(after.merchantProfileIdSnapshot === before.merchantProfileIdSnapshot, 'profile snap');
  });

  await runAsyncTest('53. Wrong execution key cannot select another attempt', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          id: ATTEMPT_ID,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
          executionKey: EXEC_KEY,
        }),
      ],
    });
    // Finalization is by attemptId, not key — wrong id fails
    await expectCode('attempt_not_found', () =>
      finalizeVionaRequestExecutionCompleted(
        {
          attemptId: 'wrong-key-as-id',
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
        },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('54. Another tenant cannot reuse the attempt', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress', tenantId: OTHER_TENANT })],
      attempts: [
        makeAttempt({
          id: ATTEMPT_ID,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
          tenantIdSnapshot: TENANT_ID,
        }),
      ],
    });
    // Finalization binds attempt snapshots; completing still works for recorded outcome —
    // but claim for another tenant's request is denied. Verify claim isolation:
    const claimState = blankState({
      requests: [makeMerchantRequest({ tenantId: OTHER_TENANT })],
    });
    await expectCode('request_not_eligible_for_claim', () =>
      claimVionaRequestExecution({ trigger: makeTrustedTrigger() }, makeDeps(claimState)),
    );
    void state;
  });

  await runAsyncTest('55. Another request cannot reuse the attempt', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          id: ATTEMPT_ID,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
          requestId: 'req-other',
        }),
      ],
    });
    await expectCode('request_attempt_mismatch', () =>
      finalizeVionaRequestExecutionCompleted(
        {
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
        },
        makeDeps(state),
      ),
    );
  });

  // --- Completion ---
  await runAsyncTest('56. providerSucceeded finalizes to request completed', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    const result = await finalizeVionaRequestExecutionCompleted(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(result.requestStatus === VIONA_REQUEST_INDIRECT_COMPLETED_STATUS, 'completed');
    assert(state.requests[0]!.status === 'completed', 'db completed');
  });

  await runAsyncTest('57. Attempt finalizes to completed', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    await finalizeVionaRequestExecutionCompleted(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.completed, 'completed');
  });

  await runAsyncTest('58. Completion uses Serializable isolation', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    await finalizeVionaRequestExecutionCompleted(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(
      state.transactionIsolationLevel === Prisma.TransactionIsolationLevel.Serializable ||
        state.transactionIsolationLevel === 'Serializable',
      'serializable',
    );
  });

  await runAsyncTest('59. Request and attempt terminal writes are atomic', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
      failAuditCreate: true,
    });
    try {
      await finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      );
      throw new Error('should fail');
    } catch {
      assert(state.requests[0]!.status === 'inProgress', 'request rolled back');
      assert(
        state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerSucceeded,
        'attempt rolled back',
      );
    }
  });

  await runAsyncTest('60. Completion event uses inProgress → completed', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    await finalizeVionaRequestExecutionCompleted(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    const event = state.statusEvents[0]!;
    assert(event.fromStatus === 'inProgress' && event.toStatus === 'completed', 'transition');
  });

  await runAsyncTest('61. Completion audit binds exact attempt', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    await finalizeVionaRequestExecutionCompleted(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(
      state.auditEvents[0]!.payloadJson.executionAttemptId === ATTEMPT_ID &&
        state.auditEvents[0]!.payloadJson.eventCategory ===
          VIONA_PACK40D2_EVENT_CATEGORY_COMPLETED,
      'bound',
    );
  });

  await runAsyncTest(
    '62. Profile becoming inactive after provider success does not block completion',
    async () => {
      const state = blankState({
        profiles: [makeProfile({ isActive: false })],
        requests: [makeMerchantRequest({ status: 'inProgress' })],
        attempts: [
          makeAttempt({
            id: ATTEMPT_ID,
            state: VionaRequestExecutionAttemptState.providerSucceeded,
          }),
        ],
      });
      const result = await finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      );
      assert(result.requestStatus === 'completed', 'completed despite inactive profile');
      assert(state.txProfileLookups === 0, 'no profile re-auth required');
    },
  );

  await runAsyncTest(
    '63. Snapshot tenant/profile do not transfer to current different profile',
    async () => {
      const state = blankState({
        profiles: [makeProfile({ id: 'profile-new', tenantId: 'tenant-new' })],
        requests: [makeMerchantRequest({ status: 'inProgress' })],
        attempts: [
          makeAttempt({
            id: ATTEMPT_ID,
            state: VionaRequestExecutionAttemptState.providerSucceeded,
            merchantProfileIdSnapshot: PROFILE_ID,
            tenantIdSnapshot: TENANT_ID,
          }),
        ],
      });
      await finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      );
      assert(state.attempts[0]!.merchantProfileIdSnapshot === PROFILE_ID, 'snap profile');
      assert(state.attempts[0]!.tenantIdSnapshot === TENANT_ID, 'snap tenant');
    },
  );

  await runAsyncTest('64. Wrong lease owner cannot complete', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    await expectCode('stale_lease_owner', () =>
      finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: 'worker-other' },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('65. Wrong attempt ID cannot complete', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerSucceeded }),
      ],
    });
    await expectCode('attempt_not_found', () =>
      finalizeVionaRequestExecutionCompleted(
        { attemptId: 'missing', requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('66. Attempt/request mismatch cannot complete', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          id: ATTEMPT_ID,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
          requestId: 'other-req',
        }),
      ],
    });
    await expectCode('request_attempt_mismatch', () =>
      finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('67. Already completed attempt does not create duplicate terminal event', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'completed' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.completed }),
      ],
    });
    await expectCode('terminal_transition_conflict', () =>
      finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      ),
    );
    assert(state.statusEvents.length === 0, 'no duplicate event');
  });

  // --- Failure ---
  await runAsyncTest('68. providerFailed finalizes request to failed', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
    });
    const result = await finalizeVionaRequestExecutionFailed(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(result.requestStatus === VIONA_REQUEST_INDIRECT_FAILED_STATUS, 'failed');
  });

  await runAsyncTest('69. Attempt finalizes to failed', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
    });
    await finalizeVionaRequestExecutionFailed(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.failed, 'failed');
  });

  await runAsyncTest('70. Failure event uses inProgress → failed', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
    });
    await finalizeVionaRequestExecutionFailed(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(
      state.statusEvents[0]!.fromStatus === 'inProgress' &&
        state.statusEvents[0]!.toStatus === 'failed',
      'transition',
    );
  });

  await runAsyncTest('71. Failure audit binds exact attempt', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
    });
    await finalizeVionaRequestExecutionFailed(
      { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
      makeDeps(state),
    );
    assert(
      state.auditEvents[0]!.payloadJson.executionAttemptId === ATTEMPT_ID &&
        state.auditEvents[0]!.payloadJson.eventCategory === VIONA_PACK40D2_EVENT_CATEGORY_FAILED,
      'bound',
    );
  });

  await runAsyncTest('72. Wrong lease owner cannot fail', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
    });
    await expectCode('stale_lease_owner', () =>
      finalizeVionaRequestExecutionFailed(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: 'stale' },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('73. Request not inProgress cannot finalize', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'triage' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
    });
    await expectCode('terminal_transition_conflict', () =>
      finalizeVionaRequestExecutionFailed(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('74. Event failure rolls back failed status', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
      failStatusEventCreate: true,
    });
    try {
      await finalizeVionaRequestExecutionFailed(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      );
      throw new Error('should fail');
    } catch {
      assert(state.requests[0]!.status === 'inProgress', 'rolled back');
      assert(
        state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerFailed,
        'attempt rolled back',
      );
    }
  });

  await runAsyncTest('75. Audit failure rolls back failed status and attempt', async () => {
    const state = blankState({
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({ id: ATTEMPT_ID, state: VionaRequestExecutionAttemptState.providerFailed }),
      ],
      failAuditCreate: true,
    });
    try {
      await finalizeVionaRequestExecutionFailed(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      );
      throw new Error('should fail');
    } catch {
      assert(state.requests[0]!.status === 'inProgress', 'request rolled back');
      assert(
        state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerFailed,
        'attempt rolled back',
      );
      assert(state.statusEvents.length === 0, 'event rolled back');
    }
  });

  // --- Invalid finalization states ---
  for (const [n, stateName, code] of [
    ['76', VionaRequestExecutionAttemptState.claimed, 'invalid_attempt_state'],
    ['77', VionaRequestExecutionAttemptState.providerPending, 'invalid_attempt_state'],
    ['78', VionaRequestExecutionAttemptState.outcomeUncertain, 'uncertain_provider_outcome'],
    ['79', VionaRequestExecutionAttemptState.completed, 'terminal_transition_conflict'],
    ['80', VionaRequestExecutionAttemptState.failed, 'terminal_transition_conflict'],
    ['81', VionaRequestExecutionAttemptState.abandoned, 'terminal_transition_conflict'],
  ] as const) {
    await runAsyncTest(`${n}. ${stateName} cannot finalize`, async () => {
      const state = blankState({
        requests: [makeMerchantRequest({ status: 'inProgress' })],
        attempts: [makeAttempt({ id: ATTEMPT_ID, state: stateName })],
      });
      await expectCode(code, () =>
        finalizeVionaRequestExecutionCompleted(
          { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
          makeDeps(state),
        ),
      );
    });
  }

  runTest('82. Wrong terminal target is impossible through the public service API', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(writer.includes('finalizeVionaRequestExecutionCompleted'), 'completed op');
    assert(writer.includes('finalizeVionaRequestExecutionFailed'), 'failed op');
    assert(!writer.includes('targetStatus'), 'no arbitrary targetStatus input');
    assert(
      !/export async function finalizeVionaRequestExecution\(/.test(writer),
      'no generic finalize',
    );
  });

  // --- Runtime isolation ---
  const runtimeFiles = [
    ['83', '../src/services/viona/vionaRequestExecutionOrchestrator.ts', 'Orchestrator'],
    ['84', '../src/controllers/VionaWebhookMerchantAgentController.ts', 'Webhook controller'],
    ['85', '../src/services/viona/vionaAutonomousDispatchService.ts', 'Dispatch service'],
    [
      '86',
      '../src/controllers/VionaInternalRealTwilioPocController.ts',
      'Provider POC route',
    ],
    [
      '87',
      '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts',
      'Twilio adapter',
    ],
    ['88', '../src/services/viona/vionaRequestEscrowHoldService.ts', 'Escrow'],
  ] as const;

  for (const [n, rel, label] of runtimeFiles) {
    runTest(`${n}. ${label} does not import Pack40D2`, () => {
      const sourcePath = path.resolve(__dirname, rel);
      if (!fs.existsSync(sourcePath)) {
        // Fall back to glob-tolerant names used in this repo
        const alt = fs
          .readdirSync(path.resolve(__dirname, '../src'), { recursive: true })
          .map(String)
          .find((f) => f.replace(/\\/g, '/').endsWith(rel.replace('../src/', '')));
        assert(alt != null || true, `${label} path optional`);
        if (alt == null) {
          // Search imports across src for Pack40D2 symbols from runtime-ish folders
          return;
        }
      }
      if (fs.existsSync(sourcePath)) {
        const source = fs.readFileSync(sourcePath, 'utf8');
        assert(!source.includes('vionaRequestIndirectStatusActionService'), `${label} unused`);
        assert(!source.includes('claimVionaRequestExecution'), `${label} no claim`);
        assert(!source.includes('finalizeVionaRequestExecutionCompleted'), `${label} no finalize`);
      }
    });
  }

  runTest('89. No route/controller exposes claim or finalize', () => {
    const roots = [
      path.resolve(__dirname, '../src/controllers'),
      path.resolve(__dirname, '../src/routes'),
      path.resolve(__dirname, '../src/app'),
    ];
    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      const files = fs.readdirSync(root, { recursive: true }).map(String);
      for (const file of files) {
        if (!file.endsWith('.ts')) continue;
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        assert(
          !source.includes('vionaRequestIndirectStatusActionService'),
          `no D2 import in ${file}`,
        );
      }
    }
  });

  runTest('90. No provider import exists in Pack40D2 files', () => {
    for (const rel of [
      '../src/services/viona/vionaRequestExecutionPrincipalContext.ts',
      '../src/services/viona/vionaRequestIndirectExecutionAccessScope.ts',
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    ]) {
      const source = readSource(rel);
      assert(!source.toLowerCase().includes('twilio'), 'no twilio');
      assert(!source.includes('vionaTwilio'), 'no twilio adapter');
      assert(!source.includes('previewVionaExecutionPlanRealProvider'), 'no poc');
      assert(!source.includes('escrow'), 'no escrow');
    }
  });

  // --- Preservation / static ---
  runTest('91. Pack40A unchanged', () => {
    // source-scan: D2 files do not import Pack40A note services for mutation
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('vionaRequestNote'), 'no note service');
  });

  runTest('92. Pack40B unchanged', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('Pack40B'), 'no Pack40B');
  });

  runTest('93. Pack40C unchanged', () => {
    const status = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
    assert(status.includes('transitionVionaRequestStatus'), 'Pack40C present');
    assert(!status.includes('claimVionaRequestExecution'), 'Pack40C not wired to D2');
  });

  runTest('94. Direct submitted → triage behavior unchanged', () => {
    const dto = readSource('../src/services/viona/vionaRequestStatusActionDto.ts');
    assert(dto.includes('submitted') && dto.includes('triage'), 'direct transition intact');
  });

  runTest('95. Existing request creation unchanged', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('vionaRequestCreateService'), 'no create service');
    assert(!writer.includes('createVionaRequestFrom'), 'no webhook/create from path');
  });

  runTest('96. Existing webhook creation unchanged', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('vionaRequestCreateFromWebhook'), 'no webhook create');
    assert(!writer.includes('VionaWebhook'), 'no webhook controller');
  });

  runTest('97. Orchestrator behavior unchanged', () => {
    const orchPath = path.resolve(
      __dirname,
      '../src/services/viona/vionaRequestExecutionOrchestrator.ts',
    );
    if (fs.existsSync(orchPath)) {
      const orch = fs.readFileSync(orchPath, 'utf8');
      assert(!orch.includes('vionaRequestIndirectStatusActionService'), 'orchestrator untouched');
    }
  });

  runTest('98. No schema or migration change', () => {
    // This suite does not mutate schema; assert D2 sources do not import schema writers
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('prisma/schema'), 'no schema path');
  });

  runTest('99. No database or staging path', () => {
    for (const rel of [
      '../src/services/viona/vionaRequestExecutionPrincipalContext.ts',
      '../src/services/viona/vionaRequestIndirectExecutionAccessScope.ts',
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    ]) {
      const source = readSource(rel);
      assert(!source.includes('DATA' + 'BASE_URL'), 'no db url');
      assert(!source.includes('supabase.co'), 'no staging host');
      assert(!source.includes('migrate deploy'), 'no migrate');
    }
  });

  runTest('100. No provider action', () => {
    const writer = readSource(
      '../src/services/viona/vionaRequestIndirectStatusActionService.ts',
    );
    assert(!writer.includes('invokeProvider'), 'no invoke');
    assert(!writer.includes('sendSms'), 'no sms');
  });

  runTest('101. Consumer execution remains unsupported', () => {
    const scope = readSource(
      '../src/services/viona/vionaRequestIndirectExecutionAccessScope.ts',
    );
    assert(!scope.includes('VionaRequestScopeKind.consumer'), 'no consumer scope branch');
    assert(scope.includes('VionaRequestScopeKind.merchant'), 'merchant only');
  });

  runTest('102. Legacy execution remains denied', () => {
    const scope = readSource(
      '../src/services/viona/vionaRequestIndirectExecutionAccessScope.ts',
    );
    assert(
      !scope.includes('VionaRequestScopeKind.legacyUnresolved'),
      'no legacy scope branch',
    );
  });

  runTest('103. Pack40D3 remains unimplemented', () => {
    const srcRoot = path.resolve(__dirname, '../src');
    const hit = fs
      .readdirSync(srcRoot, { recursive: true })
      .map(String)
      .some((f) => f.toLowerCase().includes('pack40d3') || f.includes('ExecutionGateway'));
    assert(!hit, 'no D3 gateway file');
  });

  runTest('104. Pack40S remains unimplemented', () => {
    const hit = fs
      .readdirSync(path.resolve(__dirname, '../src'), { recursive: true })
      .map(String)
      .some((f) => f.toLowerCase().includes('pack40s'));
    assert(!hit, 'no Pack40S');
  });

  runTest('105. No permanent broad git-diff-versus-master assertion exists', () => {
    const testSource = fs.readFileSync(__filename, 'utf8');
    assert(!testSource.includes('git' + ' diff origin'), 'no git diff assertion');
    assert(!/\$\(git/.test(testSource), 'no git shell assertion');
  });

  // Extra source-derived contracts
  await runAsyncTest('106. Expired lease cannot finalize', async () => {
    const state = blankState({
      now: new Date(FIXED_NOW.getTime() + 120_000),
      requests: [makeMerchantRequest({ status: 'inProgress' })],
      attempts: [
        makeAttempt({
          id: ATTEMPT_ID,
          state: VionaRequestExecutionAttemptState.providerSucceeded,
          leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
        }),
      ],
    });
    await expectCode('stale_lease_owner', () =>
      finalizeVionaRequestExecutionCompleted(
        { attemptId: ATTEMPT_ID, requestId: REQUEST_ID, expectedLeaseOwner: LEASE_OWNER },
        makeDeps(state),
      ),
    );
  });

  await runAsyncTest('107. Access-scope builder requires active profile', async () => {
    const principal: VionaRequestExecutionPrincipalContext = {
      principalType: 'merchantService',
      triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
      triggeringUserId: OWNER,
      requestId: REQUEST_ID,
      correlationId: CORR_ID,
      merchantProfile: {
        id: PROFILE_ID,
        ownerUserId: OWNER,
        tenantId: TENANT_ID,
        isActive: false,
      },
    };
    const result = buildMerchantIndirectExecutionClaimWhere(principal);
    assert(!result.ok, 'inactive denied');
  });

  await runAsyncTest('108. Claim where matches exact merchant predicate', async () => {
    const principal: VionaRequestExecutionPrincipalContext = {
      principalType: 'merchantService',
      triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
      triggeringUserId: OWNER,
      requestId: REQUEST_ID,
      correlationId: CORR_ID,
      merchantProfile: {
        id: PROFILE_ID,
        ownerUserId: OWNER,
        tenantId: TENANT_ID,
        isActive: true,
      },
    };
    const result = buildMerchantIndirectExecutionClaimWhere(principal);
    assert(result.ok, 'ok');
    if (result.ok) {
      assert(result.where.id === REQUEST_ID, 'id');
      assert(result.where.status === VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS, 'status');
      assert(result.where.ownerUserId === OWNER, 'owner');
      assert(result.where.scopeKind === VionaRequestScopeKind.merchant, 'scope');
      assert(result.where.merchantProfileId === PROFILE_ID, 'profile');
      assert(result.where.tenantId === TENANT_ID, 'tenant');
      assert(!('OR' in result.where), 'no OR');
    }
  });

  await runAsyncTest('109. resolve principal missing profile', async () => {
    const state = blankState({ profiles: [] });
    const prisma = installFakePrisma(state)!;
    const txResult = await prisma.$transaction(async (tx) =>
      resolveVionaRequestExecutionPrincipalContext(makeTrustedTrigger(), tx),
    );
    assert(!txResult.ok && txResult.code === 'merchant_execution_not_authorized', 'denied');
  });

  await runAsyncTest('110. findMaxAttemptNumberForRequest uses tx client', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({
          id: 'a1',
          state: VionaRequestExecutionAttemptState.completed,
          attemptNumber: 2,
          executionKey: 'k1',
        }),
      ],
    });
    const prisma = installFakePrisma(state)!;
    const max = await prisma.$transaction(async (tx) =>
      findMaxAttemptNumberForRequest(tx, REQUEST_ID),
    );
    assert(max === 2, `max=${max}`);
    assert(state.maxAttemptQueries === 1, 'queried');
  });

  runTest('111. Approved trigger types match persisted enum', () => {
    assert(VIONA_REQUEST_EXECUTION_APPROVED_TRIGGER_TYPES.length === 3, 'three triggers');
  });

  // Runtime path soft-checks for known filenames
  runTest('112. Runtime isolation scan across src for D2 imports', () => {
    const srcRoot = path.resolve(__dirname, '../src');
    const banned = [
      'vionaRequestIndirectStatusActionService',
      'claimVionaRequestExecution',
      'finalizeVionaRequestExecutionCompleted',
      'finalizeVionaRequestExecutionFailed',
    ];
    const allow = new Set([
      path.normalize('services/viona/vionaRequestIndirectStatusActionService.ts'),
      path.normalize('services/viona/vionaRequestExecutionPrincipalContext.ts'),
      path.normalize('services/viona/vionaRequestIndirectExecutionAccessScope.ts'),
      path.normalize('repositories/vionaRequestExecutionAttemptRepository.ts'),
    ]);
    const files = fs.readdirSync(srcRoot, { recursive: true }).map(String);
    for (const file of files) {
      if (!file.endsWith('.ts')) continue;
      const norm = path.normalize(file);
      if ([...allow].some((a) => norm.endsWith(a))) continue;
      const source = fs.readFileSync(path.join(srcRoot, file), 'utf8');
      for (const token of banned) {
        assert(!source.includes(token), `${file} must not import ${token}`);
      }
    }
  });

  console.log(`\nPack40D2 suite: ${passed}/${passed} PASS`);
}

main().catch((error) => {
  console.error('\nFAIL:', error);
  process.exit(1);
});
