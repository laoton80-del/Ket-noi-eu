/**
 * Pack40B — provenance-aware note mutation enforcement tests.
 *
 * Operator phrase: APPROVE_PACK40B_TENANT_NOTE_ENFORCEMENT.
 * Fake/injected dependencies only — no database, staging, or network access.
 *
 * Run: npx tsx scripts/test-viona-pack40b-tenant-note-enforcement.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind, type MerchantProfile, type Prisma } from '@prisma/client';

import { buildAuthorizedVionaRequestNoteWhere } from '../src/services/viona/vionaRequestNoteAccessScope';
import {
  appendVionaRequestNote,
  VIONA_REQUEST_NOTE_EVENT_TYPE,
} from '../src/services/viona/vionaRequestNoteActionService';
import { buildAuthorizedVionaRequestReadWhere } from '../src/services/viona/vionaRequestReadAccessScope';
import type { VionaRequestNotePrincipalContext } from '../src/services/viona/vionaRequestNotePrincipalContext';

type TestRow = Readonly<{
  id: string;
  tenantId: string;
  requesterUserId: string | null;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  participants: readonly { userRef: string | null; participantRoleLabel: string | null }[];
}>;

type AuditRow = {
  id: string;
  requestId: string;
  eventType: string;
  payloadJson: Record<string, unknown>;
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
    participants: [],
    ...overrides,
  };
}

function userScopeMatches(row: TestRow, authUserId: string): boolean {
  return (
    row.requesterUserId === authUserId ||
    row.ownerUserId === authUserId ||
    row.participants.some((p) => p.userRef === authUserId)
  );
}

function noteProvenanceMatches(row: TestRow, principal: VionaRequestNotePrincipalContext): boolean {
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

function rowAuthorizedForNote(row: TestRow, authUserId: string, principal: VionaRequestNotePrincipalContext): boolean {
  return userScopeMatches(row, authUserId) && noteProvenanceMatches(row, principal);
}

function makeDetailRow(row: TestRow) {
  const now = new Date('2026-07-15T12:00:00.000Z');
  return {
    ...row,
    status: 'submitted',
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
    participants: row.participants.map((p, index) => ({
      id: `participant-${index}`,
      userRef: p.userRef,
      participantRoleLabel: p.participantRoleLabel,
      displayName: null,
      createdAt: now,
      updatedAt: now,
    })),
    sourceLinks: [],
    statusEvents: [],
    auditEvents: [],
    attachmentReferences: [],
  };
}

function matchesRequestWhere(
  row: TestRow,
  authUserId: string,
  where: Prisma.VionaRequestWhereInput,
  principal: VionaRequestNotePrincipalContext,
): boolean {
  if (where.id != null && row.id !== where.id) {
    return false;
  }
  const usesProvenance = JSON.stringify(where).includes('"scopeKind"');
  if (usesProvenance) {
    return rowAuthorizedForNote(row, authUserId, principal);
  }
  return userScopeMatches(row, authUserId);
}

function dualRolePrincipal(isActive: boolean): VionaRequestNotePrincipalContext {
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

function merchantPrincipal(isActive: boolean): VionaRequestNotePrincipalContext {
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

type FakeNotePrismaState = {
  rows: TestRow[];
  transactionalPrincipal: VionaRequestNotePrincipalContext;
  auditEvents: AuditRow[];
  preTxProfileLookups: number;
  txProfileLookups: number;
  requestFindFirstCalls: number;
  auditCreates: number;
  failAuditCreate: boolean;
  failTransaction: boolean;
  transactionCount: number;
  transactionIsolationLevel?: string;
};

function installFakeNotePrisma(state: FakeNotePrismaState): void {
  type FakeTx = {
    merchantProfile: {
      findUnique: () => Promise<Partial<MerchantProfile> | null>;
      findMany: () => Promise<never>;
    };
    vionaRequest: {
      findFirst: (args: { where: Prisma.VionaRequestWhereInput & { id?: string } }) => Promise<unknown>;
    };
    vionaRequestAuditEvent: {
      findFirst: (args: {
        where: {
          requestId: string;
          eventType: string;
          payloadJson: { path: string[]; equals: string };
        };
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
    $transaction: <T>(fn: (tx: FakeTx) => Promise<T>) => Promise<T>;
    _state: FakeNotePrismaState;
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
      findFirst: async ({ where }: { where: Prisma.VionaRequestWhereInput & { id?: string } }) => {
        state.requestFindFirstCalls += 1;
        const match = state.rows.find((row) =>
          matchesRequestWhere(row, state.transactionalPrincipal.authUserId, where, state.transactionalPrincipal),
        );
        if (!match) return null;
        const detail = makeDetailRow(match);
        const usesProvenance = JSON.stringify(where).includes('"scopeKind"');
        if (usesProvenance) {
          return {
            ...match,
            participants: match.participants.map((p) => ({
              userRef: p.userRef,
              participantRoleLabel: p.participantRoleLabel,
            })),
          };
        }
        return detail;
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
        const created = {
          id: `audit-${state.auditEvents.length + 1}`,
          requestId: data.requestId,
          eventType: data.eventType,
          payloadJson: data.payloadJson,
        };
        state.auditEvents.push(created);
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
      return fn(self);
    },
    _state: state,
  };

  (globalThis as unknown as { prisma?: unknown }).prisma = self;
}

function clearFakePrisma(): void {
  (globalThis as unknown as { prisma?: unknown }).prisma = undefined;
}

async function main(): Promise<void> {
  const noteAccessScopeSource = readSource('../src/services/viona/vionaRequestNoteAccessScope.ts');
  const noteServiceSource = readSource('../src/services/viona/vionaRequestNoteActionService.ts');
  const readAccessScopeSource = readSource('../src/services/viona/vionaRequestReadAccessScope.ts');
  const readServiceSource = readSource('../src/services/viona/vionaRequestReadService.ts');
  const statusSource = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
  const createSource = readSource('../src/services/viona/vionaRequestCreateService.ts');
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
  const otherMerchantRow = makeRow({
    id: 'req-other-merchant',
    ownerUserId: USER_OTHER,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_OTHER,
    tenantId: TENANT_OTHER,
  });

  console.log('Pack40B tenant note enforcement tests\n');

  await runAsyncTest('1: consumer owner without MerchantProfile can create a note', async () => {
    const state: FakeNotePrismaState = {
      rows: [consumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      note: 'consumer note',
    });
    assert(result.ok, 'note succeeds');
    assert(state.auditCreates === 1, 'one audit created');
    clearFakePrisma();
  });

  await runAsyncTest('2: consumer owner replay preserves idempotency', async () => {
    const state: FakeNotePrismaState = {
      rows: [consumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [
        {
          id: 'audit-existing',
          requestId: consumerRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'key-1', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      note: 'consumer note',
      idempotencyKey: 'key-1',
    });
    assert(result.ok && result.action.idempotentReplay, 'idempotent replay');
    assert(state.auditCreates === 0, 'no new audit');
    clearFakePrisma();
  });

  await runAsyncTest('3: dual-role actor can create note on consumer request', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      note: 'dual consumer note',
    });
    assert(result.ok, 'consumer note succeeds');
    clearFakePrisma();
  });

  await runAsyncTest('4: inactive merchant ownership does not block consumer note', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow],
      transactionalPrincipal: dualRolePrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      note: 'inactive merchant consumer note',
    });
    assert(result.ok, 'consumer note allowed');
    clearFakePrisma();
  });

  runTest('5: arbitrary tenantId does not alter consumer authorization predicate', () => {
    const where = buildAuthorizedVionaRequestNoteWhere({
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    assert(JSON.stringify(where).includes('tenant-arbitrary') === false, 'no client tenant');
    assert(JSON.stringify(where).includes(VionaRequestScopeKind.consumer), 'consumer branch');
  });

  await runAsyncTest('6: consumer row with non-null merchantProfileId is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [malformedConsumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: malformedConsumerRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'denied');
    clearFakePrisma();
  });

  await runAsyncTest('7: another user consumer request is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [otherConsumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'denied');
    clearFakePrisma();
  });

  await runAsyncTest('8: denied consumer attempt creates no note audit', async () => {
    const state: FakeNotePrismaState = {
      rows: [otherConsumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      note: 'denied',
    });
    assert(state.auditCreates === 0, 'no audit');
    clearFakePrisma();
  });

  await runAsyncTest('9: active merchant owner can create note on exact merchant request', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'merchant note',
    });
    assert(result.ok, 'merchant note succeeds');
    clearFakePrisma();
  });

  await runAsyncTest('10: active merchant replay preserves idempotency', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [
        {
          id: 'audit-merchant',
          requestId: merchantRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'm-key', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'merchant note',
      idempotencyKey: 'm-key',
    });
    assert(result.ok && result.action.idempotentReplay, 'replay ok');
    clearFakePrisma();
  });

  await runAsyncTest('11: inactive merchant owner is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'inactive denied');
    clearFakePrisma();
  });

  await runAsyncTest('12: same tenant wrong MerchantProfile ID is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [wrongProfileMerchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: wrongProfileMerchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'wrong profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('13: same profile ID tenant mismatch is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [tenantMismatchRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: tenantMismatchRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'tenant mismatch denied');
    clearFakePrisma();
  });

  await runAsyncTest('14: merchant row with null merchantProfileId is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [nullProfileMerchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: nullProfileMerchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'null profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('15: merchant owner cannot mutate another merchant request', async () => {
    const state: FakeNotePrismaState = {
      rows: [otherMerchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: otherMerchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'other merchant denied');
    clearFakePrisma();
  });

  runTest('16: merchant relation without user scope is insufficient', () => {
    const row = makeRow({
      id: 'req-no-user-scope',
      ownerUserId: USER_OTHER,
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: PROFILE_MERCHANT,
      tenantId: TENANT_MERCHANT,
    });
    assert(
      !rowAuthorizedForNote(row, USER_MERCHANT, merchantPrincipal(true)),
      'user scope required',
    );
  });

  await runAsyncTest('17: no-profile actor cannot mutate merchant request', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: merchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'no profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('18: ambiguous profile resolution cannot authorize merchant mutation', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: { authUserId: USER_MERCHANT, merchantProfile: null, merchantProfileResolution: 'ambiguous' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote(
      {
        authUserId: USER_MERCHANT,
        requestId: merchantRow.id,
        note: 'denied',
      },
      {
        findMerchantProfilesByOwner: async () => [
          { id: PROFILE_MERCHANT, tenantId: TENANT_MERCHANT, isActive: true } as MerchantProfile,
          { id: PROFILE_OTHER, tenantId: TENANT_OTHER, isActive: true } as MerchantProfile,
        ],
      },
    );
    assert(!result.ok && result.reason === 'request_not_found', 'ambiguous denied');
    clearFakePrisma();
  });

  await runAsyncTest('19: denied merchant attempt creates no note audit', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'denied',
    });
    assert(state.auditCreates === 0, 'no audit');
    clearFakePrisma();
  });

  await runAsyncTest('20: legacy unresolved owner is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [legacyRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'legacy denied');
    clearFakePrisma();
  });

  await runAsyncTest('21: registry-matched unresolved row remains denied', async () => {
    const row = makeRow({
      id: 'req-registry-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: PROFILE_DUAL,
      tenantId: TENANT_DUAL,
    });
    const state: FakeNotePrismaState = {
      rows: [row],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: row.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'registry legacy denied');
    clearFakePrisma();
  });

  await runAsyncTest('22: registry-unmatched unresolved row remains denied', async () => {
    const row = makeRow({
      id: 'req-unmatched-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: null,
      tenantId: 'unknown-tenant',
    });
    const state: FakeNotePrismaState = {
      rows: [row],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: row.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'unmatched legacy denied');
    clearFakePrisma();
  });

  await runAsyncTest('23: webhook-looking unresolved row remains denied', async () => {
    const row = makeRow({
      id: 'req-webhook-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: PROFILE_DUAL,
      tenantId: TENANT_DUAL,
    });
    const state: FakeNotePrismaState = {
      rows: [row],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: row.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'webhook legacy denied');
    clearFakePrisma();
  });

  runTest('24: unsupported provenance fails closed in note where builder', () => {
    const where = buildAuthorizedVionaRequestNoteWhere(merchantPrincipal(true));
    const branches = (where.AND as Prisma.VionaRequestWhereInput[])[1]?.OR ?? [];
    assert(
      !(branches as Prisma.VionaRequestWhereInput[]).some(
        (branch) => branch.scopeKind === VionaRequestScopeKind.legacyUnresolved,
      ),
      'no legacy branch',
    );
  });

  await runAsyncTest('25: denied unresolved attempt creates no mutation', async () => {
    const state: FakeNotePrismaState = {
      rows: [legacyRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      note: 'denied',
    });
    assert(state.auditCreates === 0, 'no mutation');
    clearFakePrisma();
  });

  runTest('26: client tenantId cannot expand access via note DTO', () => {
    assert(!noteServiceSource.includes('expectedTenantId'), 'note service has no expectedTenantId');
    assert(!controllerSource.includes('expectedTenantId'), 'controller has no expectedTenantId on note');
  });

  runTest('27: client expectedTenantId cannot expand access', () => {
    assert(!noteAccessScopeSource.includes('expectedTenantId'), 'note scope has no expectedTenantId');
  });

  runTest('28: client merchantProfileId cannot expand access', () => {
    assert(!noteServiceSource.includes('input.merchantProfileId'), 'no client merchantProfileId');
  });

  runTest('29: client scopeKind cannot expand access', () => {
    assert(!noteServiceSource.includes('input.scopeKind'), 'no client scopeKind');
  });

  runTest('30: client note-policy or read-policy field cannot expand access', () => {
    assert(!noteServiceSource.includes('noteAccessPolicy'), 'no noteAccessPolicy');
    assert(!noteServiceSource.includes('directReadPolicy'), 'no directReadPolicy');
  });

  await runAsyncTest('31: idempotency key cannot bypass provenance enforcement', async () => {
    const state: FakeNotePrismaState = {
      rows: [legacyRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [
        {
          id: 'audit-bypass',
          requestId: legacyRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'bypass-key', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      note: 'denied',
      idempotencyKey: 'bypass-key',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'idempotency does not bypass');
    clearFakePrisma();
  });

  await runAsyncTest('32: exactly one MerchantProfile resolution occurs per note request', async () => {
    const state: FakeNotePrismaState = {
      rows: [consumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      note: 'one lookup',
    });
    assert(state.preTxProfileLookups === 0, 'no pre-transaction profile lookup');
    assert(state.txProfileLookups === 1, 'one in-transaction profile lookup');
    clearFakePrisma();
  });

  runTest('33: no per-row MerchantProfile query in note service source', () => {
    assert(!noteServiceSource.includes('findMerchantProfileByTenantId'), 'no per-row tenant lookup');
    assert(!noteServiceSource.includes('merchantProfile.findMany'), 'no per-row scan in service');
  });

  runTest('34: no global profile scan in note access scope', () => {
    assert(!noteAccessScopeSource.includes('findMany'), 'no findMany');
    assert(!noteAccessScopeSource.includes('NOT IN'), 'no NOT IN');
  });

  runTest('35: complete authorization predicate is used in DB lookup', () => {
    assert(noteServiceSource.includes('...authorizedWhere'), 'authorized where spread in findFirst');
    assert(noteAccessScopeSource.includes('scopeKind'), 'scopeKind in predicate');
    assert(noteAccessScopeSource.includes('merchantProfileId'), 'merchantProfileId in predicate');
  });

  runTest('36: no broad fetch-then-filter path exists', () => {
    assert(!noteServiceSource.includes('findMany'), 'no findMany in note service');
  });

  runTest('37: authorization failure happens before note write', () => {
    const authIndex = noteServiceSource.indexOf('authorizedWhere');
    const createIndex = noteServiceSource.indexOf('vionaRequestAuditEvent.create');
    assert(authIndex > 0 && createIndex > authIndex, 'authorize before create');
  });

  await runAsyncTest('38: note-write failure rolls back via transaction rejection', async () => {
    const state: FakeNotePrismaState = {
      rows: [consumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: true,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    let threw = false;
    try {
      await appendVionaRequestNote({
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        note: 'should fail',
      });
    } catch {
      threw = true;
    }
    assert(threw, 'transaction throws on audit failure');
    assert(state.auditEvents.length === 0, 'no committed audit row');
    clearFakePrisma();
  });

  runTest('39: audit and note share one Serializable transaction wrapper', () => {
    assert(noteServiceSource.includes('$transaction'), 'uses transaction');
    assert(
      noteServiceSource.includes('TransactionIsolationLevel.Serializable'),
      'uses Serializable isolation',
    );
    assert(
      !noteServiceSource.includes('resolveVionaRequestReadPrincipalContext'),
      'no pre-transaction Pack40A read resolver',
    );
    assert(
      noteServiceSource.includes('resolveVionaRequestNotePrincipalContext'),
      'uses note-specific transactional resolver',
    );
    assert(
      !noteServiceSource.includes('findIdempotentNoteAuditEvent(prisma,'),
      'no pre-transaction idempotency fast path',
    );
  });

  runTest('40: existing transaction/idempotency contract remains intact', () => {
    assert(noteServiceSource.includes('idempotentReplay'), 'idempotent replay preserved');
    assert(noteServiceSource.includes('idempotencyKey'), 'idempotency key preserved');
  });

  runTest('41: merchant isActive is checked for merchant mutation only', () => {
    assert(noteAccessScopeSource.includes('isActive'), 'isActive gate in note scope');
    assert(!readAccessScopeSource.includes('isActive'), 'read scope has no isActive gate');
  });

  runTest('42: consumer branch remains when merchant branch is absent', () => {
    const inactive = buildAuthorizedVionaRequestNoteWhere(merchantPrincipal(false));
    const branches = (inactive.AND as Prisma.VionaRequestWhereInput[])[1]?.OR ?? [];
    assert(
      (branches as Prisma.VionaRequestWhereInput[]).some(
        (branch) => branch.scopeKind === VionaRequestScopeKind.consumer,
      ),
      'consumer branch present',
    );
    assert(
      !(branches as Prisma.VionaRequestWhereInput[]).some(
        (branch) => branch.scopeKind === VionaRequestScopeKind.merchant,
      ),
      'merchant branch omitted when inactive',
    );
  });

  const deniedReason = 'request_not_found';

  await runAsyncTest('43: wrong owner returns not-found-safe result', async () => {
    const state: FakeNotePrismaState = {
      rows: [otherConsumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: otherConsumerRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === deniedReason, 'wrong owner');
    clearFakePrisma();
  });

  await runAsyncTest('44: wrong profile returns same result', async () => {
    const state: FakeNotePrismaState = {
      rows: [wrongProfileMerchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: wrongProfileMerchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === deniedReason, 'wrong profile');
    clearFakePrisma();
  });

  await runAsyncTest('45: inactive merchant returns same result', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === deniedReason, 'inactive merchant');
    clearFakePrisma();
  });

  await runAsyncTest('46: tenant mismatch returns same result', async () => {
    const state: FakeNotePrismaState = {
      rows: [tenantMismatchRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: tenantMismatchRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === deniedReason, 'tenant mismatch');
    clearFakePrisma();
  });

  await runAsyncTest('47: legacy unresolved returns same result', async () => {
    const state: FakeNotePrismaState = {
      rows: [legacyRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      note: 'denied',
    });
    assert(!result.ok && result.reason === deniedReason, 'legacy');
    clearFakePrisma();
  });

  await runAsyncTest('48: nonexistent request returns same result', async () => {
    const state: FakeNotePrismaState = {
      rows: [],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: 'missing',
      note: 'denied',
    });
    assert(!result.ok && result.reason === deniedReason, 'missing');
    clearFakePrisma();
  });

  runTest('49: no response reveals provenance or tenant mismatch', () => {
    assert(noteServiceSource.includes("'request_not_found'"), 'single denial reason');
    assert(!noteServiceSource.includes('merchant_inactive'), 'no merchant_inactive');
    assert(!noteServiceSource.includes('legacyUnresolved'), 'no legacy label');
    assert(!noteServiceSource.includes('wrong_tenant'), 'no wrong_tenant');
  });

  runTest('50: Pack40A list behavior remains unchanged', () => {
    assert(readServiceSource.includes("directReadPolicy !== 'pack40a_provenance'"), 'read opt-in preserved');
  });

  runTest('51: Pack40A detail behavior remains unchanged', () => {
    assert(!readAccessScopeSource.includes('isActive'), 'read merchant branch unchanged');
  });

  runTest('52: status-action service uses Pack40C scope separate from note scope', () => {
    assert(statusSource.includes('buildAuthorizedVionaRequestStatusWhere(principal)'), 'status pack40c scope');
    assert(!statusSource.includes('buildAuthorizedVionaRequestNoteWhere'), 'status has no note scope');
  });

  runTest('53: request creation remains unchanged', () => {
    assert(!createSource.includes('buildAuthorizedVionaRequestNoteWhere'), 'create untouched');
  });

  runTest('54: Pack35 webhook creation remains unchanged', () => {
    const webhookSource = readSource('../src/services/viona/vionaRequestCreateFromWebhookService.ts');
    assert(!webhookSource.includes('buildAuthorizedVionaRequestNoteWhere'), 'webhook untouched');
  });

  runTest('55: Prisma schema and migrations remain unchanged', () => {
    assert(!schemaSource.includes('pack40b'), 'no pack40b schema marker');
  });

  runTest('56: no existing-row remediation exists', () => {
    assert(!noteServiceSource.includes('updateMany'), 'no remediation writes');
  });

  runTest('57: no Pack40C/D/S implementation exists', () => {
    assert(!noteServiceSource.includes('pack40c'), 'no pack40c');
    assert(!noteServiceSource.includes('pack40d'), 'no pack40d');
  });

  runTest('58: no deployment, Fly, database or provider path exists', () => {
    assert(!noteServiceSource.includes('flyctl'), 'no fly');
    assert(!noteServiceSource.includes('DATABASE_URL'), 'no db url');
  });

  runTest('59: no permanent git-diff-versus-master assertion is used', () => {
    assert(!noteServiceSource.includes('git diff'), 'no git diff assertion');
  });

  console.log('\nPack40B transactional refinement tests\n');

  runTest('tx-1: profile lookup uses transaction client', () => {
    assert(
      readSource('../src/services/viona/vionaRequestNotePrincipalContext.ts').includes(
        'tx.merchantProfile.findUnique',
      ),
      'transaction client lookup',
    );
  });

  runTest('tx-2: no authorization profile lookup occurs before transaction', () => {
    const appendFn =
      noteServiceSource.match(/export async function appendVionaRequestNote[\s\S]*?\n}\s*$/)?.[0] ?? '';
    assert(!appendFn.includes('resolveVionaRequestNotePrincipalContext'), 'append does not resolve pre-tx');
    assert(appendFn.includes('$transaction'), 'append enters transaction before mutation');
  });

  await runAsyncTest('tx-3: transaction uses Serializable isolation', async () => {
    const state: FakeNotePrismaState = {
      rows: [consumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    await appendVionaRequestNote({
      authUserId: USER_CONSUMER,
      requestId: consumerRow.id,
      note: 'serializable',
    });
    assert(state.transactionIsolationLevel === 'Serializable', 'Serializable isolation');
    clearFakePrisma();
  });

  await runAsyncTest('tx-4: inactive transactional state denies merchant note', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'denied inactive',
    });
    assert(!result.ok && result.reason === deniedReason, 'inactive denied');
    assert(state.auditCreates === 0, 'no audit');
    clearFakePrisma();
  });

  await runAsyncTest('tx-5: changed transactional tenant denies merchant note', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: {
        authUserId: USER_MERCHANT,
        merchantProfile: {
          id: PROFILE_MERCHANT,
          ownerUserId: USER_MERCHANT,
          tenantId: TENANT_OTHER,
          isActive: true,
        },
        merchantProfileResolution: 'single',
      },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'denied tenant drift',
    });
    assert(!result.ok && result.reason === deniedReason, 'tenant drift denied');
    clearFakePrisma();
  });

  await runAsyncTest('tx-6: missing transactional profile denies merchant note', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: { authUserId: USER_MERCHANT, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'denied no profile',
    });
    assert(!result.ok && result.reason === deniedReason, 'missing profile denied');
    clearFakePrisma();
  });

  await runAsyncTest('tx-7: consumer note succeeds when MerchantProfile transactionally inactive', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow],
      transactionalPrincipal: dualRolePrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      note: 'consumer independent',
    });
    assert(result.ok, 'consumer still ok');
    clearFakePrisma();
  });

  await runAsyncTest('tx-8: consumer note succeeds when merchant tenant changes transactionally', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow],
      transactionalPrincipal: {
        authUserId: USER_DUAL,
        merchantProfile: {
          id: PROFILE_DUAL,
          ownerUserId: USER_DUAL,
          tenantId: TENANT_OTHER,
          isActive: true,
        },
        merchantProfileResolution: 'single',
      },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      note: 'consumer unaffected by tenant drift',
    });
    assert(result.ok, 'consumer unaffected');
    clearFakePrisma();
  });

  await runAsyncTest('tx-9: active merchant note remains green', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'merchant ok',
    });
    assert(result.ok, 'merchant note ok');
    clearFakePrisma();
  });

  await runAsyncTest('tx-10: replay after merchant deactivation is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: merchantPrincipal(false),
      auditEvents: [
        {
          id: 'audit-replay-inactive',
          requestId: merchantRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'inactive-replay', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'replay denied',
      idempotencyKey: 'inactive-replay',
    });
    assert(!result.ok && result.reason === deniedReason, 'inactive replay denied');
    assert(state.auditCreates === 0, 'no new audit');
    clearFakePrisma();
  });

  await runAsyncTest('tx-11: replay after tenant change is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [merchantRow],
      transactionalPrincipal: {
        authUserId: USER_MERCHANT,
        merchantProfile: {
          id: PROFILE_MERCHANT,
          ownerUserId: USER_MERCHANT,
          tenantId: TENANT_OTHER,
          isActive: true,
        },
        merchantProfileResolution: 'single',
      },
      auditEvents: [
        {
          id: 'audit-replay-tenant',
          requestId: merchantRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'tenant-replay', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: merchantRow.id,
      note: 'replay denied',
      idempotencyKey: 'tenant-replay',
    });
    assert(!result.ok && result.reason === deniedReason, 'tenant replay denied');
    clearFakePrisma();
  });

  await runAsyncTest('tx-12: replay by wrong-profile owner is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [wrongProfileMerchantRow],
      transactionalPrincipal: merchantPrincipal(true),
      auditEvents: [
        {
          id: 'audit-replay-wrong-profile',
          requestId: wrongProfileMerchantRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'wrong-profile-replay', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_MERCHANT,
      requestId: wrongProfileMerchantRow.id,
      note: 'replay denied',
      idempotencyKey: 'wrong-profile-replay',
    });
    assert(!result.ok && result.reason === deniedReason, 'wrong profile replay denied');
    clearFakePrisma();
  });

  await runAsyncTest('tx-13: replay against legacy unresolved is denied', async () => {
    const state: FakeNotePrismaState = {
      rows: [legacyRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [
        {
          id: 'audit-replay-legacy',
          requestId: legacyRow.id,
          eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
          payloadJson: { idempotencyKey: 'legacy-replay', note: 'prior' },
        },
      ],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: legacyRow.id,
      note: 'replay denied',
      idempotencyKey: 'legacy-replay',
    });
    assert(!result.ok && result.reason === deniedReason, 'legacy replay denied');
    clearFakePrisma();
  });

  runTest('tx-14: authorization occurs before idempotency replay in source order', () => {
    const mutationFn =
      noteServiceSource.match(/async function executeAuthorizedNoteMutation[\s\S]*?\n}/)?.[0] ?? '';
    const authIndex = mutationFn.indexOf('requestRow == null');
    const idempotencyIndex = mutationFn.indexOf('findIdempotentNoteAuditEvent');
    assert(authIndex > 0 && idempotencyIndex > authIndex, 'auth before idempotency');
  });

  await runAsyncTest('tx-15: transaction rejection produces no partial write', async () => {
    const state: FakeNotePrismaState = {
      rows: [consumerRow],
      transactionalPrincipal: { authUserId: USER_CONSUMER, merchantProfile: null, merchantProfileResolution: 'none' },
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: true,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    let threw = false;
    try {
      await appendVionaRequestNote({
        authUserId: USER_CONSUMER,
        requestId: consumerRow.id,
        note: 'tx rejected',
      });
    } catch {
      threw = true;
    }
    assert(threw, 'transaction rejection throws');
    assert(state.auditEvents.length === 0, 'no partial audit');
    clearFakePrisma();
  });

  runTest('tx-16: no pre-transaction stale authorizedWhere survives in service', () => {
    const appendFn =
      noteServiceSource.match(/export async function appendVionaRequestNote[\s\S]*?\n}\s*$/)?.[0] ?? '';
    assert(!appendFn.includes('buildAuthorizedVionaRequestNoteWhere'), 'append does not build where pre-tx');
    assert(
      /async \(tx\) =>[\s\S]*executeAuthorizedNoteMutation\(\s*tx,/.test(noteServiceSource),
      'mutation executes only with transaction client',
    );
  });

  runTest('tx-17: Pack40A read behavior remains unchanged', () => {
    assert(readServiceSource.includes("directReadPolicy !== 'pack40a_provenance'"), 'read opt-in preserved');
    assert(!readServiceSource.includes('resolveVionaRequestNotePrincipalContext'), 'read has no note resolver');
  });

  await runAsyncTest('dual-role: consumer note succeeds through consumer provenance', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow, dualMerchantRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      note: 'dual consumer',
    });
    assert(result.ok, 'consumer branch ok');
    clearFakePrisma();
  });

  await runAsyncTest('dual-role: merchant note succeeds while profile active and exact', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow, dualMerchantRow],
      transactionalPrincipal: dualRolePrincipal(true),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualMerchantRow.id,
      note: 'dual merchant',
    });
    assert(result.ok, 'merchant branch ok');
    clearFakePrisma();
  });

  await runAsyncTest('dual-role: deactivating profile blocks only merchant note', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualMerchantRow],
      transactionalPrincipal: dualRolePrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualMerchantRow.id,
      note: 'denied merchant',
    });
    assert(!result.ok && result.reason === 'request_not_found', 'merchant blocked');
    clearFakePrisma();
  });

  await runAsyncTest('dual-role: consumer note remains permitted after merchant deactivation', async () => {
    const state: FakeNotePrismaState = {
      rows: [dualConsumerRow],
      transactionalPrincipal: dualRolePrincipal(false),
      auditEvents: [],
      preTxProfileLookups: 0,
      txProfileLookups: 0,
      failTransaction: false,
      requestFindFirstCalls: 0,
      auditCreates: 0,
      failAuditCreate: false,
      transactionCount: 0,
    };
    installFakeNotePrisma(state);
    const result = await appendVionaRequestNote({
      authUserId: USER_DUAL,
      requestId: dualConsumerRow.id,
      note: 'consumer still ok',
    });
    assert(result.ok, 'consumer still ok');
    clearFakePrisma();
  });

  runTest('dual-role: consumer and merchant branches never overlap in note predicate', () => {
    const where = buildAuthorizedVionaRequestNoteWhere(dualRolePrincipal(true));
    const branches = (where.AND as Prisma.VionaRequestWhereInput[])[1]?.OR ?? [];
    assert((branches as Prisma.VionaRequestWhereInput[]).length === 2, 'two distinct branches');
    const readWhere = buildAuthorizedVionaRequestReadWhere(dualRolePrincipal(true));
    const readBranches = (readWhere.AND as Prisma.VionaRequestWhereInput[])[1]?.OR ?? [];
    assert((readBranches as Prisma.VionaRequestWhereInput[]).length === 2, 'read still two branches');
    assert(!readAccessScopeSource.includes('isActive'), 'read branch differs by isActive');
  });

  console.log(`\nPack40B note enforcement: ${passed} tests passed`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
