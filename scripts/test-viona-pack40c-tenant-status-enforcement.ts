/**
 * Pack40C — provenance-aware status transition enforcement tests.
 *
 * Operator phrase: APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT.
 * Fake/injected dependencies only — no database, staging, or network access.
 *
 * Run: npx tsx scripts/test-viona-pack40c-tenant-status-enforcement.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind, type MerchantProfile, type Prisma } from '@prisma/client';

import { buildAuthorizedVionaRequestStatusWhere } from '../src/services/viona/vionaRequestStatusAccessScope';
import {
  transitionVionaRequestStatus,
  VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
} from '../src/services/viona/vionaRequestStatusActionService';
import { VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION } from '../src/services/viona/vionaRequestStatusActionDto';
import type { VionaRequestStatusPrincipalContext } from '../src/services/viona/vionaRequestStatusPrincipalContext';
import type { AppendVionaExecutionAuditEventInput } from '../src/services/viona/vionaExecutionAuditWriteService';

type TestRow = Readonly<{
  id: string;
  tenantId: string;
  requesterUserId: string | null;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  status: string;
}>;

type AuditRow = {
  id: string;
  requestId: string;
  eventType: string;
  actorUserId: string;
  payloadJson: Record<string, unknown>;
};

type StatusEventRow = {
  id: string;
  requestId: string;
  fromStatus: string;
  toStatus: string;
  changedByUserId: string;
  reason: string;
};

const USER_CONSUMER = 'user-consumer';
const USER_DUAL = 'user-dual';
const USER_MERCHANT = 'user-merchant';
const USER_OTHER = 'user-other';
const PROFILE_DUAL = 'profile-dual';
const PROFILE_MERCHANT = 'profile-merchant';
const PROFILE_OTHER = 'profile-other';
const TENANT_DUAL = 'tenant-dual';
const TENANT_MERCHANT = 'tenant-merchant';
const TENANT_OTHER = 'tenant-other';

const TARGET_STATUS = VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.to;
const FROM_STATUS = VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.from;

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

function makeRow(overrides: Partial<TestRow> & Pick<TestRow, 'id' | 'ownerUserId'>): TestRow {
  return {
    tenantId: 'tenant-generic',
    requesterUserId: overrides.ownerUserId,
    scopeKind: VionaRequestScopeKind.legacyUnresolved,
    merchantProfileId: null,
    status: FROM_STATUS,
    ...overrides,
  };
}

function userScopeMatches(row: TestRow, authUserId: string): boolean {
  return (
    row.requesterUserId === authUserId ||
    row.ownerUserId === authUserId
  );
}

function statusProvenanceMatches(
  row: TestRow,
  principal: VionaRequestStatusPrincipalContext,
): boolean {
  if (row.scopeKind === VionaRequestScopeKind.consumer && row.merchantProfileId === null) {
    return true;
  }
  if (
    principal.merchantProfileResolution === 'single' &&
    principal.merchantProfile != null &&
    principal.merchantProfile.isActive &&
    row.scopeKind === VionaRequestScopeKind.merchant &&
    row.merchantProfileId === principal.merchantProfile.id &&
    row.tenantId === principal.merchantProfile.tenantId
  ) {
    return true;
  }
  return false;
}

function rowAuthorizedForStatus(
  row: TestRow,
  authUserId: string,
  principal: VionaRequestStatusPrincipalContext,
): boolean {
  return row.ownerUserId === authUserId && statusProvenanceMatches(row, principal);
}

function makeDetailRow(row: TestRow) {
  const now = new Date('2026-07-15T12:00:00.000Z');
  return {
    ...row,
    sourceUniverse: 'local',
    requestType: 'generic',
    title: 'test',
    summary: '',
    locale: null,
    countryCode: null,
    sourceFeature: null,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    participants: [],
    sourceLinks: [],
    statusEvents: [],
    auditEvents: [],
    attachmentReferences: [],
  };
}

function isStatusAuthWhere(where: Prisma.VionaRequestWhereInput): boolean {
  return where.ownerUserId != null && where.OR != null;
}

function matchesRequestWhere(
  row: TestRow,
  authUserId: string,
  where: Prisma.VionaRequestWhereInput,
  principal: VionaRequestStatusPrincipalContext,
): boolean {
  if (where.id != null && row.id !== where.id) {
    return false;
  }
  if (typeof where.status === 'string' && row.status !== where.status) {
    return false;
  }
  if (isStatusAuthWhere(where)) {
    if (where.ownerUserId !== authUserId) {
      return false;
    }
    return rowAuthorizedForStatus(row, authUserId, principal);
  }
  return userScopeMatches(row, authUserId);
}

function dualRolePrincipal(isActive: boolean): VionaRequestStatusPrincipalContext {
  return {
    authUserId: USER_DUAL,
    merchantProfile: {
      id: PROFILE_DUAL,
      ownerUserId: USER_DUAL,
      tenantId: TENANT_DUAL,
      isActive,
    },
    merchantProfileResolution: 'single',
  };
}

function merchantPrincipal(isActive: boolean): VionaRequestStatusPrincipalContext {
  return {
    authUserId: USER_MERCHANT,
    merchantProfile: {
      id: PROFILE_MERCHANT,
      ownerUserId: USER_MERCHANT,
      tenantId: TENANT_MERCHANT,
      isActive,
    },
    merchantProfileResolution: 'single',
  };
}

function makeReplayAudit(
  requestId: string,
  authUserId: string,
  idempotencyKey: string,
  overrides: Partial<AuditRow['payloadJson']> = {},
): AuditRow {
  return {
    id: `audit-replay-${idempotencyKey}`,
    requestId,
    eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
    actorUserId: authUserId,
    payloadJson: {
      idempotencyKey,
      targetStatus: TARGET_STATUS,
      fromStatus: FROM_STATUS,
      statusEventId: `status-event-${idempotencyKey}`,
      reason: 'replay reason',
      note: 'replay note',
      ...overrides,
    },
  };
}

type FakeStatusPrismaState = {
  rows: TestRow[];
  transactionalPrincipal: VionaRequestStatusPrincipalContext;
  auditEvents: AuditRow[];
  statusEvents: StatusEventRow[];
  preTxProfileLookups: number;
  txProfileLookups: number;
  requestFindFirstCalls: number;
  updateManyCalls: number;
  auditCreates: number;
  statusEventCreates: number;
  failAuditCreate: boolean;
  failStatusEventCreate: boolean;
  failTransaction: boolean;
  forceUpdateManyZero: boolean;
  transactionCount: number;
  transactionIsolationLevel?: string;
  rowStatusOverrides?: Record<string, string>;
};

function installFakeStatusPrisma(state: FakeStatusPrismaState): void {
  type FakeTx = {
    merchantProfile: {
      findUnique: () => Promise<Partial<MerchantProfile> | null>;
      findMany: () => Promise<never>;
    };
    vionaRequest: {
      findFirst: (args: { where: Prisma.VionaRequestWhereInput & { id?: string }; select?: unknown }) => Promise<unknown>;
      updateMany: (args: {
        where: Prisma.VionaRequestWhereInput & { id?: string; status?: string };
        data: { status?: string };
      }) => Promise<{ count: number }>;
    };
    vionaRequestAuditEvent: {
      findFirst: (args: {
        where: {
          requestId: string;
          eventType: string;
          payloadJson: { path: string[]; equals: string };
        };
        select?: { id?: boolean; actorUserId?: boolean; payloadJson?: boolean };
      }) => Promise<AuditRow | null>;
      create: (args: {
        data: {
          requestId: string;
          eventType: string;
          actorUserId: string;
          actorRoleLabel: string;
          message: string;
          payloadJson: Record<string, unknown>;
        };
      }) => Promise<{ id: string }>;
    };
    vionaRequestStatusEvent: {
      create: (args: {
        data: {
          requestId: string;
          fromStatus: string;
          toStatus: string;
          changedByUserId: string;
          reason: string;
        };
      }) => Promise<{ id: string }>;
    };
    $transaction: <T>(fn: (tx: FakeTx) => Promise<T>, options?: { isolationLevel?: string }) => Promise<T>;
    _state: FakeStatusPrismaState;
  };

  const self: FakeTx = {
    merchantProfile: {
      findUnique: async () => {
        state.txProfileLookups += 1;
        if (
          state.transactionalPrincipal.merchantProfileResolution !== 'single' ||
          state.transactionalPrincipal.merchantProfile == null
        ) {
          return null;
        }
        return {
          id: state.transactionalPrincipal.merchantProfile.id,
          tenantId: state.transactionalPrincipal.merchantProfile.tenantId,
          ownerUserId: state.transactionalPrincipal.merchantProfile.ownerUserId,
          isActive: state.transactionalPrincipal.merchantProfile.isActive,
        } satisfies Partial<MerchantProfile>;
      },
      findMany: async () => {
        throw new Error('global MerchantProfile scan forbidden');
      },
    },
    vionaRequest: {
      findFirst: async ({
        where,
      }: {
        where: Prisma.VionaRequestWhereInput & { id?: string };
        select?: unknown;
      }) => {
        state.requestFindFirstCalls += 1;
        const match = state.rows.find((row) =>
          matchesRequestWhere(row, state.transactionalPrincipal.authUserId, where, state.transactionalPrincipal),
        );
        if (!match) return null;
        if (isStatusAuthWhere(where)) {
          return {
            id: match.id,
            status: match.status,
            requesterUserId: match.requesterUserId,
            ownerUserId: match.ownerUserId,
          };
        }
        return makeDetailRow(match);
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: Prisma.VionaRequestWhereInput & { id?: string; status?: string };
        data: { status?: string };
      }) => {
        state.updateManyCalls += 1;
        if (state.forceUpdateManyZero) {
          return { count: 0 };
        }
        let count = 0;
        for (const row of state.rows) {
          if (
            matchesRequestWhere(row, state.transactionalPrincipal.authUserId, where, state.transactionalPrincipal)
          ) {
            if (data.status != null) {
              (row as { status: string }).status = data.status;
            }
            count += 1;
          }
        }
        return { count };
      },
    },
    vionaRequestAuditEvent: {
      findFirst: async ({
        where,
      }: {
        where: {
          requestId: string;
          eventType: string;
          payloadJson: { path: string[]; equals: string };
        };
        select?: { id?: boolean; actorUserId?: boolean; payloadJson?: boolean };
      }) => {
        const key = where.payloadJson.equals;
        return (
          state.auditEvents.find(
            (event) =>
              event.requestId === where.requestId &&
              event.eventType === where.eventType &&
              event.payloadJson.idempotencyKey === key,
          ) ?? null
        );
      },
      create: async ({
        data,
      }: {
        data: {
          requestId: string;
          eventType: string;
          actorUserId: string;
          actorRoleLabel: string;
          message: string;
          payloadJson: Record<string, unknown>;
        };
      }) => {
        state.auditCreates += 1;
        if (state.failAuditCreate) {
          throw new Error('audit create failed');
        }
        const created: AuditRow = {
          id: `audit-${state.auditEvents.length + 1}`,
          requestId: data.requestId,
          eventType: data.eventType,
          actorUserId: data.actorUserId,
          payloadJson: data.payloadJson,
        };
        state.auditEvents.push(created);
        return { id: created.id };
      },
    },
    vionaRequestStatusEvent: {
      create: async ({
        data,
      }: {
        data: {
          requestId: string;
          fromStatus: string;
          toStatus: string;
          changedByUserId: string;
          reason: string;
        };
      }) => {
        state.statusEventCreates += 1;
        if (state.failStatusEventCreate) {
          throw new Error('status event create failed');
        }
        const created: StatusEventRow = {
          id: `status-event-${state.statusEvents.length + 1}`,
          requestId: data.requestId,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          changedByUserId: data.changedByUserId,
          reason: data.reason,
        };
        state.statusEvents.push(created);
        return { id: created.id };
      },
    },
    $transaction: async <T>(
      fn: (tx: FakeTx) => Promise<T>,
      options?: { isolationLevel?: string },
    ): Promise<T> => {
      state.transactionCount += 1;
      state.transactionIsolationLevel = options?.isolationLevel;
      if (state.failTransaction) {
        throw new Error('transaction rejected');
      }
      const rowSnapshot = state.rows.map((r) => ({ ...r }));
      const auditSnapshot = [...state.auditEvents];
      const statusSnapshot = [...state.statusEvents];
      const auditCreatesBefore = state.auditCreates;
      const statusEventCreatesBefore = state.statusEventCreates;
      const updateManyCallsBefore = state.updateManyCalls;
      try {
        return await fn(self);
      } catch (error) {
        state.rows.splice(0, state.rows.length, ...rowSnapshot.map((r) => ({ ...r })));
        state.auditEvents.splice(0, state.auditEvents.length, ...auditSnapshot);
        state.statusEvents.splice(0, state.statusEvents.length, ...statusSnapshot);
        state.auditCreates = auditCreatesBefore;
        state.statusEventCreates = statusEventCreatesBefore;
        state.updateManyCalls = updateManyCallsBefore;
        throw error;
      }
    },
    _state: state,
  };

  (globalThis as unknown as { prisma?: unknown }).prisma = self;
}

function clearFakePrisma(): void {
  (globalThis as unknown as { prisma?: unknown }).prisma = undefined;
}

function freshState(
  rows: TestRow[],
  principal: VionaRequestStatusPrincipalContext,
  overrides: Partial<FakeStatusPrismaState> = {},
): FakeStatusPrismaState {
  const { rowStatusOverrides, ...restOverrides } = overrides;
  return {
    rows: rows.map((r) => ({
      ...r,
      status:
        rowStatusOverrides?.[r.id] ??
        (r.status !== FROM_STATUS && r.status !== TARGET_STATUS ? r.status : FROM_STATUS),
    })),
    transactionalPrincipal: principal,
    auditEvents: [],
    statusEvents: [],
    preTxProfileLookups: 0,
    txProfileLookups: 0,
    requestFindFirstCalls: 0,
    updateManyCalls: 0,
    auditCreates: 0,
    statusEventCreates: 0,
    failAuditCreate: false,
    failStatusEventCreate: false,
    failTransaction: false,
    forceUpdateManyZero: false,
    transactionCount: 0,
    ...restOverrides,
  };
}

async function main(): Promise<void> {
  const statusAccessScopeSource = readSource('../src/services/viona/vionaRequestStatusAccessScope.ts');
  const statusServiceSource = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
  const statusPrincipalSource = readSource('../src/services/viona/vionaRequestStatusPrincipalContext.ts');
  const noteAccessScopeSource = readSource('../src/services/viona/vionaRequestNoteAccessScope.ts');
  const noteServiceSource = readSource('../src/services/viona/vionaRequestNoteActionService.ts');
  const readAccessScopeSource = readSource('../src/services/viona/vionaRequestReadAccessScope.ts');
  const readServiceSource = readSource('../src/services/viona/vionaRequestReadService.ts');
  const createSource = readSource('../src/services/viona/vionaRequestCreateService.ts');
  const orchestratorSource = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
  const controllerSource = readSource('../src/controllers/VionaRequestController.ts');
  const schemaSource = readSource('../prisma/schema.prisma');

  const consumerRow = makeRow({
    id: 'req-consumer',
    ownerUserId: USER_CONSUMER,
    scopeKind: VionaRequestScopeKind.consumer,
    merchantProfileId: null,
    tenantId: 'tenant-arbitrary-client',
  });
  const dualConsumerRow = makeRow({
    id: 'req-dual-consumer',
    ownerUserId: USER_DUAL,
    scopeKind: VionaRequestScopeKind.consumer,
    merchantProfileId: null,
    tenantId: 'tenant-arbitrary-dual',
  });
  const dualMerchantRow = makeRow({
    id: 'req-dual-merchant',
    ownerUserId: USER_DUAL,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_DUAL,
    tenantId: TENANT_DUAL,
  });
  const merchantRow = makeRow({
    id: 'req-merchant',
    ownerUserId: USER_MERCHANT,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_MERCHANT,
    tenantId: TENANT_MERCHANT,
  });
  const legacyRow = makeRow({
    id: 'req-legacy',
    ownerUserId: USER_DUAL,
    scopeKind: VionaRequestScopeKind.legacyUnresolved,
    merchantProfileId: null,
    tenantId: TENANT_DUAL,
  });
  const malformedConsumerRow = makeRow({
    id: 'req-malformed-consumer',
    ownerUserId: USER_CONSUMER,
    scopeKind: VionaRequestScopeKind.consumer,
    merchantProfileId: PROFILE_OTHER,
  });
  const wrongProfileMerchantRow = makeRow({
    id: 'req-wrong-profile',
    ownerUserId: USER_MERCHANT,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_OTHER,
    tenantId: TENANT_MERCHANT,
  });
  const nullProfileMerchantRow = makeRow({
    id: 'req-null-profile-merchant',
    ownerUserId: USER_MERCHANT,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: null,
    tenantId: TENANT_MERCHANT,
  });
  const tenantMismatchRow = makeRow({
    id: 'req-tenant-mismatch',
    ownerUserId: USER_MERCHANT,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_MERCHANT,
    tenantId: TENANT_OTHER,
  });
  const otherConsumerRow = makeRow({
    id: 'req-other-consumer',
    ownerUserId: USER_OTHER,
    scopeKind: VionaRequestScopeKind.consumer,
    merchantProfileId: null,
  });
  const requesterOnlyRow = makeRow({
    id: 'req-requester-only',
    ownerUserId: USER_OTHER,
    requesterUserId: USER_CONSUMER,
    scopeKind: VionaRequestScopeKind.consumer,
    merchantProfileId: null,
  });
  const participantOnlyRow = makeRow({
    id: 'req-participant-only',
    ownerUserId: USER_OTHER,
    requesterUserId: USER_OTHER,
    scopeKind: VionaRequestScopeKind.consumer,
    merchantProfileId: null,
  });
  const merchantOwnerNotRequestOwnerRow = makeRow({
    id: 'req-merchant-owner-not-request-owner',
    ownerUserId: USER_OTHER,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_MERCHANT,
    tenantId: TENANT_MERCHANT,
  });
  const tenantMatchNoOwnershipRow = makeRow({
    id: 'req-tenant-match-no-ownership',
    ownerUserId: USER_OTHER,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_MERCHANT,
    tenantId: TENANT_MERCHANT,
  });

  console.log('Pack40C tenant status enforcement tests\n');

  // ── 1. Owner scope (1-5) ──────────────────────────────────────────────────

  runTest('1: owner-only predicate is used in DB lookup', () => {
    const where = buildAuthorizedVionaRequestStatusWhere({
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    assert(where.ownerUserId === USER_CONSUMER, 'ownerUserId in predicate');
    assert(JSON.stringify(where).includes('scopeKind'), 'provenance branches present');
    assert(!JSON.stringify(where).includes('requesterUserId'), 'no requester branch');
    assert(!JSON.stringify(where).includes('participants'), 'no participant branch');
    assert(statusServiceSource.includes('...authorizedWhere'), 'authorized where spread in findFirst');
  });

  await runAsyncTest('2: requester-only actor is denied', async () => {
    const state = freshState([requesterOnlyRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: requesterOnlyRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'requester-only denied');
    clearFakePrisma();
  });

  await runAsyncTest('3: participant-only actor is denied', async () => {
    const state = freshState([participantOnlyRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: participantOnlyRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'participant-only denied');
    clearFakePrisma();
  });

  await runAsyncTest('4: merchant profile owner who is not request owner is denied', async () => {
    const state = freshState([merchantOwnerNotRequestOwnerRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantOwnerNotRequestOwnerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'merchant owner not request owner denied');
    clearFakePrisma();
  });

  await runAsyncTest('5: tenant match without ownership is denied', async () => {
    const state = freshState([tenantMatchNoOwnershipRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: tenantMatchNoOwnershipRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'tenant match without ownership denied');
    clearFakePrisma();
  });

  // ── 2. Consumer (6-12) ────────────────────────────────────────────────────

  await runAsyncTest('6: consumer owner can transition submitted to triage', async () => {
    const hookCalls: AppendVionaExecutionAuditEventInput[] = [];
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
        reason: 'consumer transition',
        note: 'consumer note',
      },
      {
        appendStateTransitionHook: async (input) => {
          hookCalls.push(input);
          return { ok: true };
        },
      },
    );
    assert(result.ok, 'consumer transition succeeds');
    assert(state.auditCreates === 1, 'one audit created');
    assert(state.statusEventCreates === 1, 'one status event created');
    assert(hookCalls.length === 1, 'hook invoked once');
    assert(state.rows[0]!.status === TARGET_STATUS, 'status updated');
    clearFakePrisma();
  });

  await runAsyncTest('7: consumer owner replay preserves idempotency', async () => {
    const hookCalls: AppendVionaExecutionAuditEventInput[] = [];
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'key-1', {
          reason: 'replay reason',
          note: 'replay note',
        }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
        reason: 'replay reason',
        note: 'replay note',
        idempotencyKey: 'key-1',
      },
      {
        appendStateTransitionHook: async (input) => {
          hookCalls.push(input);
          return { ok: true };
        },
      },
    );
    assert(result.ok && result.action.idempotentReplay, 'idempotent replay');
    assert(state.auditCreates === 0, 'no new audit');
    assert(state.statusEventCreates === 0, 'no new status event');
    assert(hookCalls.length === 0, 'no hook on replay');
    clearFakePrisma();
  });

  await runAsyncTest('8: dual-role actor can transition consumer request', async () => {
    const state = freshState([dualConsumerRow], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok, 'dual consumer transition succeeds');
    clearFakePrisma();
  });

  await runAsyncTest('9: inactive merchant ownership does not block consumer transition', async () => {
    const state = freshState([dualConsumerRow], dualRolePrincipal(false));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok, 'consumer transition allowed with inactive merchant');
    clearFakePrisma();
  });

  await runAsyncTest('10: malformed consumer row with non-null merchantProfileId is denied', async () => {
    const state = freshState([malformedConsumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: malformedConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'malformed consumer denied');
    clearFakePrisma();
  });

  await runAsyncTest('11: another user consumer request is denied', async () => {
    const state = freshState([otherConsumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'wrong owner denied');
    clearFakePrisma();
  });

  await runAsyncTest('12: denied consumer attempt creates no status events or audit', async () => {
    const state = freshState([otherConsumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(state.auditCreates === 0, 'no audit');
    assert(state.statusEventCreates === 0, 'no status event');
    assert(state.updateManyCalls === 0, 'no updateMany');
    clearFakePrisma();
  });

  // ── 3. Merchant (13-22) ───────────────────────────────────────────────────

  await runAsyncTest('13: active merchant owner can transition merchant request', async () => {
    const state = freshState([merchantRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok, 'merchant transition succeeds');
    clearFakePrisma();
  });

  await runAsyncTest('14: active merchant replay preserves idempotency', async () => {
    const state = freshState([merchantRow], merchantPrincipal(true), {
      rowStatusOverrides: { [merchantRow.id]: TARGET_STATUS },
      auditEvents: [
        makeReplayAudit(merchantRow.id, USER_MERCHANT, 'm-key', {
          reason: 'merchant replay',
          note: 'merchant note',
        }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
      reason: 'merchant replay',
      note: 'merchant note',
      idempotencyKey: 'm-key',
    });
    assert(result.ok && result.action.idempotentReplay, 'merchant replay ok');
    assert(state.auditCreates === 0, 'no new audit on replay');
    clearFakePrisma();
  });

  await runAsyncTest('15: inactive merchant owner is denied', async () => {
    const state = freshState([merchantRow], merchantPrincipal(false));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'inactive merchant denied');
    clearFakePrisma();
  });

  await runAsyncTest('16: same tenant wrong MerchantProfile ID is denied', async () => {
    const state = freshState([wrongProfileMerchantRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: wrongProfileMerchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'wrong profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('17: same profile ID tenant mismatch is denied', async () => {
    const state = freshState([tenantMismatchRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: tenantMismatchRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'tenant mismatch denied');
    clearFakePrisma();
  });

  await runAsyncTest('18: merchant row with null merchantProfileId is denied', async () => {
    const state = freshState([nullProfileMerchantRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: nullProfileMerchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'null profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('19: no-profile actor cannot transition merchant request', async () => {
    const state = freshState([merchantRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'missing profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('20: ambiguous profile resolution cannot authorize merchant transition', async () => {
    const state = freshState([merchantRow], {
      authUserId: USER_MERCHANT,
      merchantProfile: null,
      merchantProfileResolution: 'ambiguous',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus(
      {
        authUserId: USER_MERCHANT,
        requestId: merchantRow.id,
        targetStatus: TARGET_STATUS,
      },
      {
        findMerchantProfilesByOwner: async () => [
          { id: PROFILE_MERCHANT, ownerUserId: USER_MERCHANT, tenantId: TENANT_MERCHANT, isActive: true },
          { id: PROFILE_OTHER, ownerUserId: USER_MERCHANT, tenantId: TENANT_OTHER, isActive: true },
        ],
      },
    );
    assert(!result.ok && result.reason === 'request_not_found', 'ambiguous profile denied');
    clearFakePrisma();
  });

  runTest('21: merchant relation without ownership is insufficient', () => {
    const row = makeRow({
      id: 'req-no-ownership',
      ownerUserId: USER_OTHER,
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: PROFILE_MERCHANT,
      tenantId: TENANT_MERCHANT,
    });
    assert(
      !rowAuthorizedForStatus(row, USER_MERCHANT, merchantPrincipal(true)),
      'ownership required',
    );
  });

  await runAsyncTest('22: denied merchant attempt creates no status side effects', async () => {
    const state = freshState([merchantRow], merchantPrincipal(false));
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(state.auditCreates === 0, 'no audit');
    assert(state.statusEventCreates === 0, 'no status event');
    clearFakePrisma();
  });

  // ── 4. Legacy (23-27) ─────────────────────────────────────────────────────

  await runAsyncTest('23: legacy unresolved owner is denied', async () => {
    const state = freshState([legacyRow], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'legacy denied');
    clearFakePrisma();
  });

  await runAsyncTest('24: registry-matched unresolved row remains denied', async () => {
    const row = makeRow({
      id: 'req-registry-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: PROFILE_DUAL,
      tenantId: TENANT_DUAL,
    });
    const state = freshState([row], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: row.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'registry legacy denied');
    clearFakePrisma();
  });

  await runAsyncTest('25: webhook-looking unresolved row remains denied', async () => {
    const row = makeRow({
      id: 'req-webhook-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: PROFILE_DUAL,
      tenantId: TENANT_DUAL,
    });
    const state = freshState([row], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: row.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'webhook legacy denied');
    clearFakePrisma();
  });

  runTest('26: unsupported provenance fails closed in status where builder', () => {
    const where = buildAuthorizedVionaRequestStatusWhere(merchantPrincipal(true));
    const branches = where.OR ?? [];
    assert(
      !(branches as Prisma.VionaRequestWhereInput[]).some(
        (branch) => branch.scopeKind === VionaRequestScopeKind.legacyUnresolved,
      ),
      'no legacy branch',
    );
  });

  await runAsyncTest('27: denied unresolved attempt creates no mutation', async () => {
    const state = freshState([legacyRow], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(state.auditCreates === 0, 'no audit');
    assert(state.statusEventCreates === 0, 'no status event');
    assert(state.updateManyCalls === 0, 'no update');
    clearFakePrisma();
  });

  // ── 5. Transaction/principal (28-35) ──────────────────────────────────────

  runTest('28: profile lookup uses transaction client', () => {
    assert(
      statusPrincipalSource.includes('tx.merchantProfile.findUnique'),
      'transaction client lookup',
    );
  });

  runTest('29: no authorization profile lookup occurs before transaction', () => {
    const transitionFn =
      statusServiceSource.match(/export async function transitionVionaRequestStatus[\s\S]*?\n}\s*$/)?.[0] ?? '';
    assert(!transitionFn.includes('resolveVionaRequestStatusPrincipalContext'), 'no pre-tx resolve in export');
    assert(transitionFn.includes('$transaction'), 'enters transaction before mutation');
  });

  await runAsyncTest('30: exactly one MerchantProfile resolution occurs per status request', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(state.preTxProfileLookups === 0, 'no pre-transaction profile lookup');
    assert(state.txProfileLookups === 1, 'one in-transaction profile lookup');
    clearFakePrisma();
  });

  await runAsyncTest('31: transaction uses Serializable isolation', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(state.transactionIsolationLevel === 'Serializable', 'Serializable isolation');
    clearFakePrisma();
  });

  runTest('32: authorization occurs inside transaction before mutation', () => {
    const mutationFn =
      statusServiceSource.match(/async function executeAuthorizedStatusTransition[\s\S]*?\n}/)?.[0] ?? '';
    const authIndex = mutationFn.indexOf('requestRow == null');
    const updateIndex = mutationFn.indexOf('vionaRequest.updateMany');
    assert(authIndex > 0 && updateIndex > authIndex, 'auth before updateMany');
  });

  runTest('33: no broad fetch-then-filter path exists in status service', () => {
    assert(!statusServiceSource.includes('findMany'), 'no findMany in status service');
  });

  runTest('34: conditional update includes submitted status guard', () => {
    assert(statusServiceSource.includes('status: fromStatus'), 'updateMany includes fromStatus guard');
    assert(statusServiceSource.includes('...authorizedWhere'), 'updateMany includes authorizedWhere');
  });

  await runAsyncTest('35: zero-row update produces no events', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, { forceUpdateManyZero: true });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'zero-row update fails transition');
    assert(state.auditCreates === 0, 'no audit on zero-row');
    assert(state.statusEventCreates === 0, 'no status event on zero-row');
    clearFakePrisma();
  });

  // ── 6. Replay idempotency (36-50) ─────────────────────────────────────────

  runTest('36: authorization occurs before idempotency replay in source order', () => {
    const mutationFn =
      statusServiceSource.match(/async function executeAuthorizedStatusTransition[\s\S]*?\n}/)?.[0] ?? '';
    const authIndex = mutationFn.indexOf('requestRow == null');
    const idempotencyIndex = mutationFn.indexOf('findIdempotentStatusAuditEvent');
    assert(authIndex > 0 && idempotencyIndex > authIndex, 'auth before idempotency');
  });

  await runAsyncTest('37: replay when already triage succeeds without writes', async () => {
    const hookCalls: AppendVionaExecutionAuditEventInput[] = [];
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'already-triage', {
          reason: 'r1',
          note: 'n1',
        }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
        reason: 'r1',
        note: 'n1',
        idempotencyKey: 'already-triage',
      },
      {
        appendStateTransitionHook: async (input) => {
          hookCalls.push(input);
          return { ok: true };
        },
      },
    );
    assert(result.ok && result.action.idempotentReplay, 'replay when already triage');
    assert(state.auditCreates === 0, 'no duplicate audit');
    assert(state.statusEventCreates === 0, 'no duplicate status event');
    assert(hookCalls.length === 0, 'no duplicate hook');
    clearFakePrisma();
  });

  await runAsyncTest('38: inactive merchant cannot replay merchant transition', async () => {
    const state = freshState([merchantRow], merchantPrincipal(false), {
      rowStatusOverrides: { [merchantRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(merchantRow.id, USER_MERCHANT, 'inactive-replay')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'inactive-replay',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'inactive replay denied');
    assert(state.auditCreates === 0, 'no new audit');
    clearFakePrisma();
  });

  await runAsyncTest('39: replay after tenant change is denied', async () => {
    const state = freshState([merchantRow], {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        ownerUserId: USER_MERCHANT,
        tenantId: TENANT_OTHER,
        isActive: true,
      },
      merchantProfileResolution: 'single',
    }, {
      rowStatusOverrides: { [merchantRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(merchantRow.id, USER_MERCHANT, 'tenant-replay')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'tenant-replay',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'tenant replay denied');
    clearFakePrisma();
  });

  await runAsyncTest('40: replay by wrong-profile owner is denied', async () => {
    const state = freshState([wrongProfileMerchantRow], merchantPrincipal(true), {
      rowStatusOverrides: { [wrongProfileMerchantRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(wrongProfileMerchantRow.id, USER_MERCHANT, 'wrong-profile-replay')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: wrongProfileMerchantRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'wrong-profile-replay',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'wrong profile replay denied');
    clearFakePrisma();
  });

  await runAsyncTest('41: replay against legacy unresolved is denied', async () => {
    const state = freshState([legacyRow], dualRolePrincipal(true), {
      rowStatusOverrides: { [legacyRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(legacyRow.id, USER_DUAL, 'legacy-replay')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'legacy-replay',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'legacy replay denied');
    clearFakePrisma();
  });

  await runAsyncTest('42: idempotency key cannot bypass provenance enforcement', async () => {
    const state = freshState([legacyRow], dualRolePrincipal(true), {
      auditEvents: [makeReplayAudit(legacyRow.id, USER_DUAL, 'bypass-key')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'bypass-key',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'idempotency does not bypass auth');
    clearFakePrisma();
  });

  await runAsyncTest('43: idempotency key conflict with mismatched targetStatus fails', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'conflict-key', {
          targetStatus: 'completed',
        }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'conflict-key',
    });
    assert(!result.ok && result.reason === 'invalid_input', 'targetStatus mismatch fails');
    clearFakePrisma();
  });

  await runAsyncTest('44: idempotency payload actor mismatch fails', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(consumerRow.id, USER_OTHER, 'actor-mismatch')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'actor-mismatch',
    });
    assert(!result.ok && result.reason === 'invalid_input', 'actor mismatch fails');
    clearFakePrisma();
  });

  await runAsyncTest('45: idempotency reason mismatch fails', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'reason-mismatch', { reason: 'stored' }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      reason: 'different',
      idempotencyKey: 'reason-mismatch',
    });
    assert(!result.ok && result.reason === 'invalid_input', 'reason mismatch fails');
    clearFakePrisma();
  });

  await runAsyncTest('46: idempotency note mismatch fails', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'note-mismatch', { note: 'stored note' }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      note: 'different note',
      idempotencyKey: 'note-mismatch',
    });
    assert(!result.ok && result.reason === 'invalid_input', 'note mismatch fails');
    clearFakePrisma();
  });

  await runAsyncTest('47: status inconsistent with replay fails invalid_transition', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'status-inconsistent', {
          reason: undefined,
          note: undefined,
        }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'status-inconsistent',
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'status still submitted fails replay');
    clearFakePrisma();
  });

  await runAsyncTest('48: duplicate idempotency key without parseable payload fails', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      auditEvents: [
        {
          id: 'audit-bad-payload',
          requestId: consumerRow.id,
          eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
          actorUserId: USER_CONSUMER,
          payloadJson: { idempotencyKey: 'bad-payload' },
        },
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'bad-payload',
    });
    assert(!result.ok, 'bad payload does not allow replay bypass');
    clearFakePrisma();
  });

  await runAsyncTest('49: replay with wrong owner is denied before idempotency', async () => {
    const state = freshState([otherConsumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [otherConsumerRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(otherConsumerRow.id, USER_OTHER, 'wrong-owner-replay')],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'wrong-owner-replay',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'wrong owner replay denied');
    clearFakePrisma();
  });

  await runAsyncTest('50: replay audit requires statusEventId in payload', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [
        makeReplayAudit(consumerRow.id, USER_CONSUMER, 'no-status-event', {
          statusEventId: undefined,
          reason: undefined,
          note: undefined,
        }),
      ],
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
      idempotencyKey: 'no-status-event',
    });
    assert(result.ok && result.action.idempotentReplay, 'falls back to audit id when statusEventId absent');
    clearFakePrisma();
  });

  // ── 7. State machine (51-59) ──────────────────────────────────────────────

  await runAsyncTest('51: only submitted to triage is allowed', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok && result.action.fromStatus === FROM_STATUS && result.action.toStatus === TARGET_STATUS, 'allowed transition');
    clearFakePrisma();
  });

  await runAsyncTest('52: invalid current status rejects transition', async () => {
    const invalidRow = makeRow({
      id: 'req-invalid-status',
      ownerUserId: USER_CONSUMER,
      scopeKind: VionaRequestScopeKind.consumer,
      merchantProfileId: null,
      status: 'not-a-real-status',
    });
    const state = freshState([invalidRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: invalidRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'invalid current status');
    clearFakePrisma();
  });

  await runAsyncTest('53: unapproved target status is rejected', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: 'completed',
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'unapproved target rejected');
    clearFakePrisma();
  });

  runTest('54: allowlist and state machine both enforced in source', () => {
    assert(statusServiceSource.includes('isPack25AllowedTransition'), 'allowlist check');
    assert(statusServiceSource.includes('canTransitionRequestStatus'), 'state machine check');
  });

  await runAsyncTest('55: concurrent update (status already changed) fails', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, { rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS } });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'concurrent update fails');
    clearFakePrisma();
  });

  await runAsyncTest('56: duplicate events prevented when updateMany returns zero', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, { forceUpdateManyZero: true });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(state.statusEventCreates === 0, 'no status event on failed update');
    assert(state.auditCreates === 0, 'no audit on failed update');
    clearFakePrisma();
  });

  await runAsyncTest('57: audit create failure rolls back transaction', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, { failAuditCreate: true });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'audit failure rolls back');
    assert(state.auditEvents.length === 0, 'no committed audit');
    assert(state.rows[0]!.status === FROM_STATUS, 'status not committed');
    clearFakePrisma();
  });

  await runAsyncTest('58: serializable transaction rejection returns invalid_transition', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, { failTransaction: true });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'invalid_transition', 'serializable rejection');
    clearFakePrisma();
  });

  runTest('59: Pack25 allowed transition constant matches submitted to triage', () => {
    assert(VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.from === 'submitted', 'from submitted');
    assert(VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.to === 'triage', 'to triage');
  });

  // ── 8. Hook (60-64) ───────────────────────────────────────────────────────

  await runAsyncTest('60: stateTransition hook runs once on first commit', async () => {
    const hookCalls: AppendVionaExecutionAuditEventInput[] = [];
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
      },
      {
        appendStateTransitionHook: async (input) => {
          hookCalls.push(input);
          return { ok: true };
        },
      },
    );
    assert(hookCalls.length === 1, 'hook runs once');
    assert(hookCalls[0]!.eventType === 'stateTransition', 'stateTransition event type');
    clearFakePrisma();
  });

  await runAsyncTest('61: hook failure does not rollback committed transition', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
      },
      {
        appendStateTransitionHook: async () => ({ ok: false, error: 'hook failed' }),
      },
    );
    assert(result.ok, 'transition still succeeds when hook fails');
    assert(state.rows[0]!.status === TARGET_STATUS, 'status committed');
    assert(state.auditCreates === 1, 'audit committed');
    clearFakePrisma();
  });

  await runAsyncTest('62: hook is not invoked on idempotent replay', async () => {
    const hookCalls: AppendVionaExecutionAuditEventInput[] = [];
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    }, {
      rowStatusOverrides: { [consumerRow.id]: TARGET_STATUS },
      auditEvents: [makeReplayAudit(consumerRow.id, USER_CONSUMER, 'hook-replay')],
    });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
        idempotencyKey: 'hook-replay',
      },
      {
        appendStateTransitionHook: async (input) => {
          hookCalls.push(input);
          return { ok: true };
        },
      },
    );
    assert(hookCalls.length === 0, 'no hook on replay');
    clearFakePrisma();
  });

  await runAsyncTest('63: hook does not perform additional status write', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    await transitionVionaRequestStatus(
      {
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        targetStatus: TARGET_STATUS,
      },
      {
        appendStateTransitionHook: async () => ({ ok: true }),
      },
    );
    assert(state.updateManyCalls === 1, 'only one status write in transaction');
    clearFakePrisma();
  });

  runTest('64: no Pack40D implementation in status service', () => {
    assert(!statusServiceSource.includes('pack40d'), 'no pack40d');
    assert(!statusAccessScopeSource.includes('pack40d'), 'no pack40d in scope');
  });

  // ── 9. Client input (65-70) ───────────────────────────────────────────────

  runTest('65: client tenantId cannot expand access via status DTO', () => {
    assert(!statusServiceSource.includes('expectedTenantId'), 'status service has no expectedTenantId');
    assert(!controllerSource.includes('expectedTenantId'), 'controller has no expectedTenantId on status');
  });

  runTest('66: client expectedTenantId cannot expand status access', () => {
    assert(!statusAccessScopeSource.includes('expectedTenantId'), 'status scope has no expectedTenantId');
  });

  runTest('67: client merchantProfileId cannot expand status access', () => {
    assert(!statusServiceSource.includes('input.merchantProfileId'), 'no client merchantProfileId');
  });

  runTest('68: client scopeKind cannot expand status access', () => {
    assert(!statusServiceSource.includes('input.scopeKind'), 'no client scopeKind');
  });

  runTest('69: client status-policy or read-policy field cannot expand access', () => {
    assert(!statusServiceSource.includes('statusAccessPolicy'), 'no statusAccessPolicy');
    assert(!statusServiceSource.includes('directReadPolicy'), 'no directReadPolicy in status service');
  });

  await runAsyncTest('70: unapproved transition rejected at input validation', async () => {
    const state = freshState([consumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      targetStatus: 'draft',
    });
    assert(!result.ok && (result.reason === 'invalid_input' || result.reason === 'invalid_transition'), 'unapproved target rejected');
    clearFakePrisma();
  });

  // ── 10. Error normalization (71-77) ───────────────────────────────────────

  const deniedReason = 'request_not_found';

  await runAsyncTest('71: wrong owner returns not-found-safe result', async () => {
    const state = freshState([otherConsumerRow], {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === deniedReason, 'wrong owner');
    clearFakePrisma();
  });

  await runAsyncTest('72: wrong profile returns same result', async () => {
    const state = freshState([wrongProfileMerchantRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: wrongProfileMerchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === deniedReason, 'wrong profile');
    clearFakePrisma();
  });

  await runAsyncTest('73: inactive merchant returns same result', async () => {
    const state = freshState([merchantRow], merchantPrincipal(false));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === deniedReason, 'inactive merchant');
    clearFakePrisma();
  });

  await runAsyncTest('74: tenant mismatch returns same result', async () => {
    const state = freshState([tenantMismatchRow], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: tenantMismatchRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === deniedReason, 'tenant mismatch');
    clearFakePrisma();
  });

  await runAsyncTest('75: legacy unresolved returns same result', async () => {
    const state = freshState([legacyRow], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === deniedReason, 'legacy');
    clearFakePrisma();
  });

  await runAsyncTest('76: nonexistent request returns same result', async () => {
    const state = freshState([], merchantPrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_MERCHANT,
      requestId: 'missing',
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === deniedReason, 'missing');
    clearFakePrisma();
  });

  runTest('77: no response reveals provenance or tenant mismatch', () => {
    assert(statusServiceSource.includes("'request_not_found'"), 'single denial reason for auth');
    assert(!statusServiceSource.includes('merchant_inactive'), 'no merchant_inactive');
    assert(!statusServiceSource.includes('legacyUnresolved'), 'no legacy label in responses');
    assert(!statusServiceSource.includes('wrong_tenant'), 'no wrong_tenant');
  });

  // ── 11. Preservation (78-88) ──────────────────────────────────────────────

  runTest('78: Pack40A list behavior remains unchanged', () => {
    assert(readServiceSource.includes("directReadPolicy !== 'pack40a_provenance'"), 'read opt-in preserved');
  });

  runTest('79: Pack40A detail behavior remains unchanged', () => {
    assert(!readAccessScopeSource.includes('isActive'), 'read merchant branch unchanged');
  });

  runTest('80: note-action service remains unchanged', () => {
    assert(noteServiceSource.includes('buildAuthorizedVionaRequestNoteWhere'), 'note scope preserved');
    assert(!noteServiceSource.includes('buildAuthorizedVionaRequestStatusWhere'), 'note has no status scope');
  });

  runTest('81: note access scope remains unchanged', () => {
    assert(noteAccessScopeSource.includes('buildAuthorizedVionaRequestWhere'), 'note user scope preserved');
    assert(!noteAccessScopeSource.includes('ownerUserId: principal.authUserId'), 'note not owner-only');
  });

  runTest('82: request creation remains unchanged', () => {
    assert(!createSource.includes('buildAuthorizedVionaRequestStatusWhere'), 'create untouched');
  });

  runTest('83: execution orchestrator remains unchanged', () => {
    assert(!orchestratorSource.includes('buildAuthorizedVionaRequestStatusWhere'), 'orchestrator untouched');
    assert(!orchestratorSource.includes('buildAuthorizedVionaRequestStatusWhere('), 'orchestrator no status scope wiring');
  });

  runTest('84: Pack35 webhook creation remains unchanged', () => {
    const webhookSource = readSource('../src/services/viona/vionaRequestCreateFromWebhookService.ts');
    assert(!webhookSource.includes('buildAuthorizedVionaRequestStatusWhere'), 'webhook untouched');
  });

  runTest('85: Prisma schema and migrations remain unchanged', () => {
    assert(!schemaSource.includes('pack40c'), 'no pack40c schema marker');
  });

  runTest('86: no existing-row remediation exists in status service', () => {
    const remediationPattern = /updateMany[\s\S]*scopeKind/;
    assert(!remediationPattern.test(statusServiceSource), 'no remediation writes');
  });

  runTest('87: no Pack40D implementation exists', () => {
    assert(!statusServiceSource.includes('pack40d'), 'no pack40d in status');
    assert(!noteServiceSource.includes('pack40d'), 'no pack40d in note');
  });

  runTest('88: no deployment, Fly, database or provider path in status tests scope', () => {
    assert(!statusServiceSource.includes('flyctl'), 'no fly');
    assert(!statusServiceSource.includes('DATABASE_URL'), 'no db url in service');
  });

  // ── Dual-role positive tests ───────────────────────────────────────────────

  console.log('\nPack40C dual-role positive tests\n');

  await runAsyncTest('dual-role: consumer transition succeeds through consumer provenance', async () => {
    const state = freshState([dualConsumerRow, dualMerchantRow], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok, 'consumer branch ok');
    clearFakePrisma();
  });

  await runAsyncTest('dual-role: merchant transition succeeds while profile active and exact', async () => {
    const state = freshState([dualConsumerRow, dualMerchantRow], dualRolePrincipal(true));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: dualMerchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok, 'merchant branch ok');
    clearFakePrisma();
  });

  await runAsyncTest('dual-role: deactivating profile blocks only merchant transition', async () => {
    const state = freshState([dualMerchantRow], dualRolePrincipal(false));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: dualMerchantRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(!result.ok && result.reason === 'request_not_found', 'merchant blocked');
    clearFakePrisma();
  });

  await runAsyncTest('dual-role: consumer transition remains permitted after merchant deactivation', async () => {
    const state = freshState([dualConsumerRow], dualRolePrincipal(false));
    installFakeStatusPrisma(state);
    const result = await transitionVionaRequestStatus({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      targetStatus: TARGET_STATUS,
    });
    assert(result.ok, 'consumer still ok');
    clearFakePrisma();
  });

  runTest('dual-role: consumer and merchant branches never overlap in status predicate', () => {
    const where = buildAuthorizedVionaRequestStatusWhere(dualRolePrincipal(true));
    const branches = where.OR ?? [];
    assert((branches as Prisma.VionaRequestWhereInput[]).length === 2, 'two distinct branches');
    assert(where.ownerUserId === USER_DUAL, 'owner-only predicate');
    assert(statusAccessScopeSource.includes('isActive'), 'merchant branch gated by isActive');
    assert(!readAccessScopeSource.includes('ownerUserId: principal.authUserId'), 'read differs from status');
  });

  console.log(`\nPack40C status enforcement: ${passed} tests passed`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
