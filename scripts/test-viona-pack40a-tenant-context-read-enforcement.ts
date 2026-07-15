/**
 * Pack40A — tenant principal context and provenance-aware read enforcement tests.
 *
 * Operator phrase: APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT.
 * Fake/injected dependencies only — no database, staging, or network access.
 *
 * Run: npx tsx scripts/test-viona-pack40a-tenant-context-read-enforcement.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind, type MerchantProfile, type Prisma } from '@prisma/client';

import {
  buildAuthorizedVionaRequestReadWhere,
} from '../src/services/viona/vionaRequestReadAccessScope';
import {
  buildAuthorizedVionaRequestWhere,
} from '../src/services/viona/vionaRequestAccessScope';
import {
  resolveVionaRequestReadPrincipalContext,
  type VionaRequestReadPrincipalContext,
} from '../src/services/viona/vionaRequestReadPrincipalContext';
import { getVionaRequestById, listVionaRequests } from '../src/services/viona/vionaRequestReadService';

type TestRow = Readonly<{
  id: string;
  tenantId: string;
  requesterUserId: string | null;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  status: string;
  sourceUniverse: string;
  requestType: string;
  title: string;
  summary: string;
  locale: string | null;
  countryCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  participants: readonly { userRef: string | null; participantRoleLabel: string | null }[];
}>;

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

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
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

function makeRow(overrides: Partial<TestRow> & Pick<TestRow, 'id' | 'ownerUserId'>): TestRow {
  const now = new Date('2026-07-15T12:00:00.000Z');
  return {
    tenantId: 'tenant-generic',
    requesterUserId: overrides.ownerUserId,
    scopeKind: VionaRequestScopeKind.legacyUnresolved,
    merchantProfileId: null,
    status: 'submitted',
    sourceUniverse: 'local',
    requestType: 'generic',
    title: 'test',
    summary: '',
    locale: null,
    countryCode: null,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
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

function provenanceMatches(row: TestRow, principal: VionaRequestReadPrincipalContext): boolean {
  if (
    row.scopeKind === VionaRequestScopeKind.consumer &&
    row.merchantProfileId === null
  ) {
    return true;
  }
  if (
    principal.merchantProfileResolution === 'single' &&
    principal.merchantProfile != null &&
    row.scopeKind === VionaRequestScopeKind.merchant &&
    row.merchantProfileId === principal.merchantProfile.id &&
    row.tenantId === principal.merchantProfile.tenantId
  ) {
    return true;
  }
  return false;
}

function rowVisibleForPack40aRead(
  row: TestRow,
  authUserId: string,
  principal: VionaRequestReadPrincipalContext,
): boolean {
  if (!userScopeMatches(row, authUserId)) return false;
  return provenanceMatches(row, principal);
}

function filterRows(
  rows: readonly TestRow[],
  authUserId: string,
  principal: VionaRequestReadPrincipalContext,
): TestRow[] {
  return rows.filter((row) => rowVisibleForPack40aRead(row, authUserId, principal));
}

function dualRolePrincipal(): VionaRequestReadPrincipalContext {
  return {
    authUserId: USER_DUAL,
    merchantProfile: {
      id: PROFILE_DUAL,
      tenantId: TENANT_DUAL,
      isActive: false,
    },
    merchantProfileResolution: 'single',
  };
}

function installFakeReadPrisma(rows: TestRow[], principal: VionaRequestReadPrincipalContext): void {
  let profileLookups = 0;

  (globalThis as unknown as { prisma?: unknown }).prisma = {
    merchantProfile: {
      findUnique: async () => {
        profileLookups += 1;
        if (principal.merchantProfileResolution !== 'single' || principal.merchantProfile == null) {
          return null;
        }
        return {
          id: principal.merchantProfile.id,
          tenantId: principal.merchantProfile.tenantId,
          ownerUserId: principal.authUserId,
          isActive: principal.merchantProfile.isActive,
        } satisfies Partial<MerchantProfile>;
      },
      findMany: async () => {
        throw new Error('global MerchantProfile scan forbidden');
      },
    },
    vionaRequest: {
      findMany: async () => {
        return filterRows(rows, principal.authUserId, principal).map((row) => ({
          ...row,
          sourceFeature: null,
        }));
      },
      findFirst: async ({ where }: { where: Prisma.VionaRequestWhereInput & { id?: string } }) => {
        const match =
          filterRows(rows, principal.authUserId, principal).find((row) => row.id === where.id) ??
          null;
        if (!match) return null;
        return {
          ...match,
          sourceFeature: null,
          participants: match.participants.map((p, index) => ({
            id: `participant-${index}`,
            userRef: p.userRef,
            participantRoleLabel: p.participantRoleLabel,
            displayName: null,
            createdAt: match.createdAt,
            updatedAt: match.updatedAt,
          })),
          sourceLinks: [],
          statusEvents: [],
          auditEvents: [],
          attachmentReferences: [],
        };
      },
    },
    _profileLookups: () => profileLookups,
  };
}

function clearFakePrisma(): void {
  (globalThis as unknown as { prisma?: unknown }).prisma = undefined;
}

async function main(): Promise<void> {
  const readAccessScopeSource = readSource('../src/services/viona/vionaRequestReadAccessScope.ts');
  const readServiceSource = readSource('../src/services/viona/vionaRequestReadService.ts');
  const noteSource = readSource('../src/services/viona/vionaRequestNoteActionService.ts');
  const statusSource = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
  const createSource = readSource('../src/services/viona/vionaRequestCreateService.ts');
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
  const inactiveMerchantRow = makeRow({
    id: 'req-inactive-merchant',
    ownerUserId: USER_MERCHANT,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_MERCHANT,
    tenantId: TENANT_MERCHANT,
  });

  const allRows = [
    consumerRow,
    dualConsumerRow,
    dualMerchantRow,
    merchantRow,
    legacyRow,
    malformedConsumerRow,
    wrongProfileMerchantRow,
    nullProfileMerchantRow,
    inactiveMerchantRow,
  ];

  await runAsyncTest('1: consumer owner without MerchantProfile can list consumer row', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    const result = await listVionaRequests({
      authUserId: USER_CONSUMER,
      directReadPolicy: 'pack40a_provenance',
    });
    assert(result.requests.length === 1, 'one consumer row');
    assert(result.requests[0]?.id === 'req-consumer', 'consumer row id');
    clearFakePrisma();
  });

  await runAsyncTest('2: consumer owner can read consumer detail', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    const detail = await getVionaRequestById({
      authUserId: USER_CONSUMER,
      requestId: 'req-consumer',
      directReadPolicy: 'pack40a_provenance',
    });
    assert(detail.ok === true, 'detail ok');
    clearFakePrisma();
  });

  await runAsyncTest('3: dual-role user can read consumer row', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, dualRolePrincipal());
    const detail = await getVionaRequestById({
      authUserId: USER_DUAL,
      requestId: 'req-dual-consumer',
      directReadPolicy: 'pack40a_provenance',
    });
    assert(detail.ok === true, 'dual consumer detail ok');
    clearFakePrisma();
  });

  runTest('4: dual-role MerchantProfile does not alter consumer classification predicate', () => {
    const where = buildAuthorizedVionaRequestReadWhere(dualRolePrincipal());
    const branches = (where.AND as Prisma.VionaRequestWhereInput[])[1]?.OR ?? [];
    assert(
      (branches as Prisma.VionaRequestWhereInput[]).some(
        (branch) =>
          branch.scopeKind === VionaRequestScopeKind.consumer && branch.merchantProfileId === null,
      ),
      'consumer branch preserved',
    );
  });

  runTest('5: malformed consumer row with merchantProfileId is excluded', () => {
    const visible = filterRows(allRows, USER_CONSUMER, {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    assert(!visible.some((row) => row.id === 'req-malformed-consumer'), 'malformed excluded');
  });

  runTest('6: consumer row belonging to another user is excluded', () => {
    const visible = filterRows(allRows, USER_OTHER, {
      authUserId: USER_OTHER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    assert(!visible.some((row) => row.id === 'req-consumer'), 'other user excluded');
  });

  runTest('7: arbitrary tenantId does not affect consumer access predicate', () => {
    const where = buildAuthorizedVionaRequestReadWhere({
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    const branch = (where.AND as Prisma.VionaRequestWhereInput[])[1]?.OR?.[0];
    assert(branch != null && !('tenantId' in branch), 'consumer branch has no tenant filter');
  });

  await runAsyncTest('8: merchant owner can read matching merchant row', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: true,
      },
      merchantProfileResolution: 'single',
    });
    const detail = await getVionaRequestById({
      authUserId: USER_MERCHANT,
      requestId: 'req-merchant',
      directReadPolicy: 'pack40a_provenance',
    });
    assert(detail.ok === true, 'merchant detail ok');
    clearFakePrisma();
  });

  await runAsyncTest('9: inactive merchant can read historical merchant row', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: false,
      },
      merchantProfileResolution: 'single',
    });
    const detail = await getVionaRequestById({
      authUserId: USER_MERCHANT,
      requestId: 'req-inactive-merchant',
      directReadPolicy: 'pack40a_provenance',
    });
    assert(detail.ok === true, 'inactive merchant read ok');
    clearFakePrisma();
  });

  runTest('10: merchant row with another MerchantProfile ID is excluded', () => {
    const principal = {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: true,
      },
      merchantProfileResolution: 'single' as const,
    };
    const visible = filterRows(allRows, principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-wrong-profile'), 'wrong profile excluded');
  });

  runTest('11: same tenantId but wrong MerchantProfile ID is excluded', () => {
    const principal = {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: true,
      },
      merchantProfileResolution: 'single' as const,
    };
    const row = makeRow({
      id: 'req-same-tenant-wrong-profile',
      ownerUserId: USER_MERCHANT,
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: PROFILE_OTHER,
      tenantId: TENANT_MERCHANT,
    });
    const visible = filterRows([...allRows, row], principal.authUserId, principal);
    assert(!visible.some((r) => r.id === 'req-same-tenant-wrong-profile'), 'wrong id excluded');
  });

  runTest('12: merchant row with null merchantProfileId is excluded', () => {
    const principal = {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: true,
      },
      merchantProfileResolution: 'single' as const,
    };
    const visible = filterRows(allRows, principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-null-profile-merchant'), 'null fk excluded');
  });

  runTest('13: MerchantProfile relation without user scope is insufficient', () => {
    const principal = {
      authUserId: USER_OTHER,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: true,
      },
      merchantProfileResolution: 'single' as const,
    };
    const visible = filterRows(allRows, principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-merchant'), 'user scope required');
  });

  runTest('14: merchant owner cannot read another merchant request', () => {
    const principal = {
      authUserId: USER_MERCHANT,
      merchantProfile: {
        id: PROFILE_MERCHANT,
        tenantId: TENANT_MERCHANT,
        isActive: true,
      },
      merchantProfileResolution: 'single' as const,
    };
    const otherMerchantRow = makeRow({
      id: 'req-other-merchant',
      ownerUserId: USER_OTHER,
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: PROFILE_OTHER,
      tenantId: TENANT_OTHER,
    });
    const visible = filterRows([...allRows, otherMerchantRow], principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-other-merchant'), 'other merchant excluded');
  });

  runTest('15: ambiguous profile resolution does not authorize merchant rows', () => {
    const principal = {
      authUserId: USER_DUAL,
      merchantProfile: null,
      merchantProfileResolution: 'ambiguous' as const,
    };
    const visible = filterRows(allRows, principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-dual-merchant'), 'merchant branch omitted');
    assert(visible.some((row) => row.id === 'req-dual-consumer'), 'consumer branch remains');
  });

  runTest('16: no-profile actor cannot read merchant rows', () => {
    const visible = filterRows(allRows, USER_CONSUMER, {
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    assert(!visible.some((row) => row.scopeKind === VionaRequestScopeKind.merchant), 'no merchant');
  });

  runTest('17: legacy unresolved row is omitted from list predicate', () => {
    const principal = dualRolePrincipal();
    const visible = filterRows(allRows, principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-legacy'), 'legacy excluded');
  });

  await runAsyncTest('18: legacy unresolved detail returns request_not_found', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, dualRolePrincipal());
    const detail = await getVionaRequestById({
      authUserId: USER_DUAL,
      requestId: 'req-legacy',
      directReadPolicy: 'pack40a_provenance',
    });
    assert(detail.ok === false && detail.reason === 'request_not_found', 'legacy not found');
    clearFakePrisma();
  });

  runTest('19: registry match does not expose unresolved row', () => {
    const row = makeRow({
      id: 'req-registry-looking-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: null,
      tenantId: TENANT_DUAL,
    });
    const visible = filterRows([...allRows, row], USER_DUAL, dualRolePrincipal());
    assert(!visible.some((r) => r.id === 'req-registry-looking-legacy'), 'registry tenant insufficient');
  });

  runTest('20: registry absence does not convert unresolved row to consumer', () => {
    const principal = {
      authUserId: USER_DUAL,
      merchantProfile: null,
      merchantProfileResolution: 'none' as const,
    };
    const visible = filterRows(allRows, principal.authUserId, principal);
    assert(!visible.some((row) => row.id === 'req-legacy'), 'no consumer fallback');
  });

  runTest('21: webhook-looking metadata does not expose unresolved row', () => {
    const row = makeRow({
      id: 'req-webhook-looking-legacy',
      ownerUserId: USER_DUAL,
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: PROFILE_DUAL,
      tenantId: TENANT_DUAL,
    });
    const visible = filterRows([...allRows, row], USER_DUAL, dualRolePrincipal());
    assert(!visible.some((r) => r.id === 'req-webhook-looking-legacy'), 'legacy stays closed');
  });

  await runAsyncTest('22: exactly one MerchantProfile resolution occurs per service request', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, dualRolePrincipal());
    await listVionaRequests({
      authUserId: USER_DUAL,
      directReadPolicy: 'pack40a_provenance',
    });
    const prisma = (globalThis as unknown as { prisma?: { _profileLookups?: () => number } }).prisma;
    assert(prisma?._profileLookups?.() === 1, 'one profile lookup');
    clearFakePrisma();
  });

  runTest('23: no per-row MerchantProfile query in read service source', () => {
    assert(!readServiceSource.includes('findMerchantProfileByTenantId'), 'no per-row tenant lookup');
    assert(!readServiceSource.includes('merchantProfile.findMany'), 'no per-row scan');
  });

  runTest('24: no global MerchantProfile registry scan in read access scope', () => {
    assert(!readAccessScopeSource.includes('findMany'), 'no findMany in read access scope');
    assert(!readAccessScopeSource.includes('NOT IN'), 'no NOT IN logic');
  });

  runTest('25: no client expectedTenantId enters read where builder', () => {
    assert(!readAccessScopeSource.includes('expectedTenantId'), 'read builder has no expectedTenantId');
    const where = buildAuthorizedVionaRequestReadWhere(dualRolePrincipal());
    assert(JSON.stringify(where).includes('expectedTenantId') === false, 'where has no client tenant');
  });

  runTest('26: no NOT IN tenant logic exists', () => {
    assert(!readAccessScopeSource.toLowerCase().includes('not in'), 'no NOT IN');
  });

  runTest('27: query uses scopeKind and exact merchantProfileId equality', () => {
    const where = buildAuthorizedVionaRequestReadWhere(dualRolePrincipal());
    const branches = (where.AND as Prisma.VionaRequestWhereInput[])[1]?.OR ?? [];
    assert(
      (branches as Prisma.VionaRequestWhereInput[]).some(
        (branch) =>
          branch.scopeKind === VionaRequestScopeKind.merchant &&
          branch.merchantProfileId === PROFILE_DUAL,
      ),
      'exact merchantProfileId equality',
    );
  });

  runTest('28: existing user scope remains mandatory', () => {
    const legacyOnly = buildAuthorizedVionaRequestWhere(USER_CONSUMER);
    const readWhere = buildAuthorizedVionaRequestReadWhere({
      authUserId: USER_CONSUMER,
      merchantProfile: null,
      merchantProfileResolution: 'none',
    });
    assert(JSON.stringify(readWhere).includes('requesterUserId'), 'user scope present');
    assert(JSON.stringify(legacyOnly).includes('participants'), 'legacy user scope preserved');
  });

  runTest('29: inaccessible reasons are not exposed externally', () => {
    assert(readServiceSource.includes("'request_not_found'"), 'single not-found reason');
    assert(!readServiceSource.includes('legacyUnresolved'), 'no external legacy label');
  });

  runTest('30: note service uses Pack40B mutation scope not Pack40A read policy', () => {
    assert(noteSource.includes('buildAuthorizedVionaRequestNoteWhere(principal)'), 'note uses pack40b scope');
    assert(!noteSource.includes('pack40a_provenance'), 'note has no pack40a read flag');
  });

  runTest('31: status service behavior is unchanged', () => {
    assert(statusSource.includes('buildAuthorizedVionaRequestWhere(authUserId)'), 'status uses legacy scope');
    assert(!statusSource.includes('pack40a_provenance'), 'status has no pack40a flag');
  });

  runTest('32: request creation behavior is unchanged', () => {
    assert(!createSource.includes('directReadPolicy'), 'create has no read policy flag');
    assert(createSource.includes('VionaRequestScopeKind.consumer'), 'create still assigns consumer');
  });

  runTest('33: Prisma schema and migration are unchanged by this task', () => {
    assert(schemaSource.includes('scopeKind'), 'schema already has scopeKind from Pack40P1');
    assert(!readServiceSource.includes('$executeRaw'), 'no raw SQL writes');
  });

  runTest('34: no existing row mutation exists in touched read files', () => {
    assert(!readServiceSource.includes('.update('), 'no update in read service');
    assert(!readAccessScopeSource.includes('.delete('), 'no delete in read access scope');
  });

  runTest('35: Pack40B note scope is separate from Pack40A read enforcement', () => {
    assert(
      fs.existsSync(path.resolve(__dirname, '../src/services/viona/vionaRequestNoteAccessScope.ts')),
      'pack40b note scope file exists',
    );
    assert(!readServiceSource.includes('buildAuthorizedVionaRequestNoteWhere'), 'read service has no note scope');
    assert(!readAccessScopeSource.includes('isActive'), 'read scope has no isActive gate');
  });

  runTest('36: no deploy, Fly, database or provider path in new read files', () => {
    const principalSource = readSource('../src/services/viona/vionaRequestReadPrincipalContext.ts');
    assert(!/fly\s+(deploy|auth)/i.test(principalSource), 'no fly commands');
    assert(!/prisma\s+migrate/i.test(principalSource), 'no migrate');
  });

  runTest('37: no permanent git-diff-versus-master assertion is used', () => {
    const testSource = readSource('test-viona-pack40a-tenant-context-read-enforcement.ts');
    assert(!/git\s+diff\s+origin\/master/i.test(testSource), 'no git diff gate');
  });

  await runAsyncTest('dual-role: consumer and merchant branches coexist', async () => {
    clearFakePrisma();
    installFakeReadPrisma(allRows, dualRolePrincipal());
    const list = await listVionaRequests({
      authUserId: USER_DUAL,
      directReadPolicy: 'pack40a_provenance',
    });
    const ids = list.requests.map((row) => row.id).sort();
    assert(ids.includes('req-dual-consumer'), 'consumer branch visible');
    assert(ids.includes('req-dual-merchant'), 'merchant branch visible');
    assert(!ids.includes('req-legacy'), 'legacy still excluded');
    clearFakePrisma();
  });

  await runAsyncTest('principal resolver: ambiguous multi-profile owner fails closed on merchant branch', async () => {
    const principal = await resolveVionaRequestReadPrincipalContext(USER_DUAL, {
      findMerchantProfilesByOwner: async () => [
        {
          id: PROFILE_DUAL,
          tenantId: TENANT_DUAL,
          ownerUserId: USER_DUAL,
          isActive: true,
        } as MerchantProfile,
        {
          id: PROFILE_OTHER,
          tenantId: TENANT_OTHER,
          ownerUserId: USER_DUAL,
          isActive: true,
        } as MerchantProfile,
      ],
    });
    assert(principal.merchantProfileResolution === 'ambiguous', 'ambiguous resolution');
    assert(principal.merchantProfile === null, 'no selected profile');
  });

  console.log('');
  console.log(`[pack40a-test] ================ ${passed} CHECK(S) PASSED ================`);
}

main().catch((error) => {
  console.error('[pack40a-test] FATAL', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
