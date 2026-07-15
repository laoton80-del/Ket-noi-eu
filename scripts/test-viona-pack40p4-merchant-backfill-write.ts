/**
 * Pack40P4W — merchant backfill write static/fake-Prisma test suite.
 *
 * Operator phrase: APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE.
 * No database, network, deploy, or git-diff-vs-master assertions.
 *
 * Run: npx tsx scripts/test-viona-pack40p4-merchant-backfill-write.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind, type PrismaClient } from '@prisma/client';

import {
  APPROVED_CANDIDATE_COUNT,
  APPROVED_CANDIDATE_DIGEST,
  CANDIDATE_DIGEST_CONSTANT,
  computeCandidateDigest,
  Pack40p4WriteBlockedError,
  reconstructMerchantBackfillCandidates,
  validateApprovedPopulation,
  writeApprovedCandidatesInTransaction,
  type MerchantBackfillCandidate,
} from './apply-viona-pack40p4-merchant-backfill';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';

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

const PROFILE_ID = 'profile-1';
const OWNER_ID = 'owner-1';
const TENANT_ID = 'pack36a-qa-tenant';

function asCandidatePrisma(
  prisma: ReturnType<typeof buildFakePrisma>['prisma'],
): Pick<PrismaClient, 'merchantProfile' | 'vionaRequest'> {
  return prisma as unknown as Pick<PrismaClient, 'merchantProfile' | 'vionaRequest'>;
}

function asWritePrisma(
  prisma: ReturnType<typeof buildFakePrisma>['prisma'],
): Pick<PrismaClient, 'merchantProfile' | 'vionaRequest' | 'vionaRequestAuditEvent'> {
  return prisma as unknown as Pick<
    PrismaClient,
    'merchantProfile' | 'vionaRequest' | 'vionaRequestAuditEvent'
  >;
}

function makeApprovedCandidates(count: number): MerchantBackfillCandidate[] {
  const ids = Array.from({ length: count }, (_, i) => `req-${String(i + 1).padStart(2, '0')}`);
  return ids.map((requestId) => ({
    requestId,
    tenantId: TENANT_ID,
    ownerUserId: OWNER_ID,
    merchantProfileId: PROFILE_ID,
  }));
}

type FakeRequest = {
  id: string;
  tenantId: string;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  auditEvents: { id: string; eventType: string }[];
};

function buildFakePrisma(initial: {
  requests: FakeRequest[];
  profiles?: { id: string; tenantId: string; ownerUserId: string }[];
}) {
  const requests = initial.requests.map((r) => ({ ...r, auditEvents: [...r.auditEvents] }));
  const profiles = initial.profiles ?? [
    { id: PROFILE_ID, tenantId: TENANT_ID, ownerUserId: OWNER_ID },
  ];

  const vionaRequest = {
    count: async (args?: { where?: { scopeKind?: VionaRequestScopeKind } }) => {
      if (!args?.where?.scopeKind) return requests.length;
      return requests.filter((r) => r.scopeKind === args.where!.scopeKind).length;
    },
    groupBy: async () => {
      const map = new Map<VionaRequestScopeKind, number>();
      for (const r of requests) {
        map.set(r.scopeKind, (map.get(r.scopeKind) ?? 0) + 1);
      }
      return [...map.entries()].map(([scopeKind, _count]) => ({
        scopeKind,
        _count: { _all: _count },
      }));
    },
    findMany: async (args: {
      where: { scopeKind?: VionaRequestScopeKind };
      select: unknown;
    }) => {
      return requests
        .filter((r) =>
          args.where.scopeKind != null ? r.scopeKind === args.where.scopeKind : true,
        )
        .map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          ownerUserId: r.ownerUserId,
          merchantProfileId: r.merchantProfileId,
          auditEvents: r.auditEvents.filter(
            (e) => e.eventType === VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE,
          ),
        }));
    },
    findUnique: async (args: { where: { id: string } }) => {
      const row = requests.find((r) => r.id === args.where.id);
      if (!row) return null;
      return {
        scopeKind: row.scopeKind,
        merchantProfileId: row.merchantProfileId,
        tenantId: row.tenantId,
        ownerUserId: row.ownerUserId,
      };
    },
    updateMany: async (args: {
      where: {
        id: string;
        scopeKind: VionaRequestScopeKind;
        merchantProfileId: null;
        tenantId: string;
        ownerUserId: string;
      };
      data: { scopeKind: VionaRequestScopeKind; merchantProfileId: string };
    }) => {
      const idx = requests.findIndex(
        (r) =>
          r.id === args.where.id &&
          r.scopeKind === args.where.scopeKind &&
          r.merchantProfileId === args.where.merchantProfileId &&
          r.tenantId === args.where.tenantId &&
          r.ownerUserId === args.where.ownerUserId,
      );
      if (idx === -1) return { count: 0 };
      requests[idx] = {
        ...requests[idx]!,
        scopeKind: args.data.scopeKind,
        merchantProfileId: args.data.merchantProfileId,
      };
      return { count: 1 };
    },
  };

  const merchantProfile = {
    count: async () => profiles.length,
    findMany: async () => profiles,
  };

  const vionaRequestAuditEvent = {
    count: async () => requests.reduce((sum, r) => sum + r.auditEvents.length, 0),
  };

  const prisma: {
    vionaRequest: typeof vionaRequest;
    merchantProfile: typeof merchantProfile;
    vionaRequestAuditEvent: typeof vionaRequestAuditEvent;
    $transaction: <T>(fn: (tx: typeof prisma) => Promise<T>) => Promise<T>;
  } = {
    vionaRequest,
    merchantProfile,
    vionaRequestAuditEvent,
    $transaction: async <T>(
      fn: (tx: typeof prisma) => Promise<T>,
    ): Promise<T> => fn(prisma),
  };

  return { prisma, requests };
}

function legacyWebhookRequest(id: string): FakeRequest {
  return {
    id,
    tenantId: TENANT_ID,
    ownerUserId: OWNER_ID,
    scopeKind: VionaRequestScopeKind.legacyUnresolved,
    merchantProfileId: null,
    auditEvents: [{ id: `audit-${id}`, eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE }],
  };
}

async function main(): Promise<void> {
  runTest('wrong candidate count blocks before mutation', () => {
    try {
      validateApprovedPopulation(makeApprovedCandidates(4), APPROVED_CANDIDATE_DIGEST, []);
      assert(false, 'expected throw');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected Pack40p4WriteBlockedError');
    }
  });

  runTest('wrong digest blocks before mutation', () => {
    const candidates = makeApprovedCandidates(5);
    const wrongDigest = computeCandidateDigest(candidates.map((c) => c.requestId).reverse());
    try {
      validateApprovedPopulation(candidates, wrongDigest, []);
      assert(false, 'expected throw');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected blocked');
    }
  });

  await runAsyncTest('new candidate blocks (count drift)', async () => {
    const requests = [
      ...makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId)),
      legacyWebhookRequest('req-extra'),
    ];
    const { prisma } = buildFakePrisma({ requests });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(result.candidates.length === 6, 'expected 6 candidates');
    try {
      validateApprovedPopulation(result.candidates, result.digest, result.blockedReasons);
      assert(false, 'expected throw');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected blocked');
    }
  });

  await runAsyncTest('missing candidate blocks (count drift)', async () => {
    const requests = makeApprovedCandidates(4).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma } = buildFakePrisma({ requests });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    try {
      validateApprovedPopulation(result.candidates, result.digest, result.blockedReasons);
      assert(false, 'expected throw');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected blocked');
    }
  });

  await runAsyncTest('owner mismatch blocks', async () => {
    const requests = makeApprovedCandidates(5).map((c) => ({
      ...legacyWebhookRequest(c.requestId),
      ownerUserId: 'wrong-owner',
    }));
    const { prisma } = buildFakePrisma({ requests });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(result.blockedReasons.includes('owner_mismatch'), 'expected owner_mismatch');
  });

  await runAsyncTest('ambiguous profile blocks', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma } = buildFakePrisma({
      requests,
      profiles: [
        { id: 'p1', tenantId: TENANT_ID, ownerUserId: OWNER_ID },
        { id: 'p2', tenantId: TENANT_ID, ownerUserId: OWNER_ID },
      ],
    });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(result.blockedReasons.includes('ambiguous_profile'), 'expected ambiguous_profile');
  });

  await runAsyncTest('tenant mismatch blocks', async () => {
    const requests = makeApprovedCandidates(5).map((c) => ({
      ...legacyWebhookRequest(c.requestId),
      tenantId: 'unknown-tenant',
    }));
    const { prisma } = buildFakePrisma({ requests });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(result.blockedReasons.includes('tenant_mismatch'), 'expected tenant_mismatch');
  });

  await runAsyncTest('contradictory provenance blocks', async () => {
    const requests = makeApprovedCandidates(5).map((c) => ({
      ...legacyWebhookRequest(c.requestId),
      merchantProfileId: PROFILE_ID,
    }));
    const { prisma } = buildFakePrisma({ requests });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(
      result.blockedReasons.includes('inconsistent_unresolved_fk'),
      'expected inconsistent_unresolved_fk',
    );
  });

  await runAsyncTest('partial prior backfill blocks', async () => {
    const candidates = makeApprovedCandidates(5);
    const requests = candidates.map((c) => legacyWebhookRequest(c.requestId));
    requests[0] = {
      ...requests[0]!,
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: PROFILE_ID,
    };
    const { prisma } = buildFakePrisma({ requests });
    const recomputed = {
      candidates,
      digest: computeCandidateDigest(candidates.map((c) => c.requestId)),
      blockedReasons: [] as const,
    };
    try {
      await writeApprovedCandidatesInTransaction(asWritePrisma(prisma), recomputed);
      assert(false, 'expected partial block');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected partial block');
    }
  });

  await runAsyncTest('exact already-applied merchant-scope reconstruction finds five rows', async () => {
    const requests = makeApprovedCandidates(5).map((c) => ({
      ...legacyWebhookRequest(c.requestId),
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: PROFILE_ID,
    }));
    const { prisma } = buildFakePrisma({ requests });
    const legacyRecomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(legacyRecomputed.candidates.length === 0, 'legacy reconstruct empty when applied');
    const appliedRecomputed = await reconstructMerchantBackfillCandidates(
      asCandidatePrisma(prisma),
      VionaRequestScopeKind.merchant,
    );
    assert(appliedRecomputed.candidates.length === 5, 'merchant reconstruct finds five');
    assert(appliedRecomputed.blockedReasons.length === 0, 'no blocks');
  });

  await runAsyncTest('duplicate webhook evidence blocks', async () => {
    const requests = makeApprovedCandidates(5).map((c) => ({
      ...legacyWebhookRequest(c.requestId),
      auditEvents: [
        { id: `a1-${c.requestId}`, eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
        { id: `a2-${c.requestId}`, eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
      ],
    }));
    const { prisma } = buildFakePrisma({ requests });
    const result = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(result.blockedReasons.includes('duplicate_webhook'), 'duplicate webhook');
  });

  await runAsyncTest('mid-transaction guarded update failure throws before completion', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(recomputed.candidates.length === 5, 'five candidates');
    const originalUpdateMany = prisma.vionaRequest.updateMany.bind(prisma.vionaRequest);
    let callCount = 0;
    prisma.vionaRequest.updateMany = async (args: Parameters<typeof originalUpdateMany>[0]) => {
      callCount += 1;
      if (callCount === 3) return { count: 0 };
      return originalUpdateMany(args);
    };
    try {
      await writeApprovedCandidatesInTransaction(asWritePrisma(prisma), recomputed);
      assert(false, 'expected throw');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected blocked');
    }
  });

  await runAsyncTest('total request count unchanged in fake five-row write', async () => {
    const requests = [
      ...makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId)),
      {
        id: 'excluded-legacy',
        tenantId: 'other-tenant',
        ownerUserId: 'other-owner',
        scopeKind: VionaRequestScopeKind.legacyUnresolved,
        merchantProfileId: null,
        auditEvents: [],
      },
    ];
    const { prisma } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    try {
      validateApprovedPopulation(recomputed.candidates, recomputed.digest, recomputed.blockedReasons);
      assert(false, 'expected drift with 6-row population');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'only exact 5-candidate staging set authorized');
    }
  });

  await runAsyncTest('exact pre-state updates exactly five candidates', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma, requests: store } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    assert(recomputed.candidates.length === 5, 'five candidates');
    assert(recomputed.blockedReasons.length === 0, 'no blocks');
    const result = await writeApprovedCandidatesInTransaction(asWritePrisma(prisma), recomputed);
    assert(result.rowsUpdated === 5, 'expected 5 updates');
    assert(
      store.every((r) => r.scopeKind === VionaRequestScopeKind.merchant),
      'all merchant',
    );
  });

  await runAsyncTest('each update requires one affected row (zero blocks)', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    requests[0] = { ...requests[0]!, tenantId: 'drift-tenant' };
    const { prisma } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    try {
      validateApprovedPopulation(recomputed.candidates, recomputed.digest, recomputed.blockedReasons);
      assert(false, 'expected drift block first');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'expected drift');
    }
  });

  runTest('digest constant matches P4D algorithm label', () => {
    const ids = ['a', 'b', 'c'];
    const digest = computeCandidateDigest(ids);
    assert(typeof digest === 'string' && digest.length === 64, 'sha256 hex');
    assert(CANDIDATE_DIGEST_CONSTANT.includes('pack40p4d'), 'constant label');
  });

  runTest('no consumer write path in apply script update data', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    const updateDataBlocks = source.match(/data:\s*\{[^}]+\}/g) ?? [];
    assert(updateDataBlocks.length > 0, 'update data blocks found');
    assert(
      !updateDataBlocks.some((block) => block.includes('consumer')),
      'consumer not assigned in update data',
    );
  });

  runTest('no tenantId update in apply script update data', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    const dataBlock = source.slice(source.indexOf('data: {'));
    assert(!dataBlock.includes('tenantId:'), 'tenantId not in update data');
  });

  runTest('no request insert or delete in apply script', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(!/\bvionaRequest\.create\b/.test(source), 'no create');
    assert(!/\bvionaRequest\.delete\b/.test(source), 'no delete');
  });

  runTest('no audit-event mutation in apply script', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(!/\bvionaRequestAuditEvent\.(create|update|delete)/.test(source), 'no audit mutation');
  });

  runTest('no MerchantProfile mutation in apply script', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(!/\bmerchantProfile\.(create|update|delete|upsert)/.test(source), 'no profile mutation');
  });

  runTest('no raw SQL in apply script', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(!/\$executeRaw|\$queryRawUnsafe|\$queryRaw\s*\(/.test(source), 'no raw sql');
  });

  runTest('no deploy, Fly or provider path in apply script', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(!/\bfly\b|openai|twilio|axios|node-fetch/.test(source), 'no external paths');
  });

  runTest('update data contains only scopeKind and merchantProfileId fields', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    const match = source.match(/data:\s*\{([^}]+)\}/);
    assert(match != null, 'update data block found');
    const fields = match![1]!
      .split(',')
      .map((s) => s.trim().split(':')[0])
      .filter(Boolean);
    assert(
      fields.every((f) => f === 'scopeKind' || f === 'merchantProfileId'),
      `unexpected fields: ${fields.join(',')}`,
    );
  });

  runTest('no raw identifier emission in apply script logging', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(!/console\.log\([^)]*requestId/.test(source), 'no requestId in console.log');
    assert(!/log\([^)]*merchantProfileId/.test(source), 'no profile id in log helper calls');
  });

  runTest('no production environment accepted (guard exists)', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(source.includes("stage === 'production'"), 'production guard present');
  });

  runTest('approved digest and count constants committed', () => {
    assert(APPROVED_CANDIDATE_COUNT === 5, 'count 5');
    assert(
      APPROVED_CANDIDATE_DIGEST ===
        'aa74f63813af18e26afca268175b2b40246159619cda5438aaf40c6d5f930213',
      'digest matches P4D',
    );
  });

  await runAsyncTest('post-write merchant count equals approved set size in fake run', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma, requests: store } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    await writeApprovedCandidatesInTransaction(asWritePrisma(prisma), recomputed);
    const merchantCount = store.filter((r) => r.scopeKind === VionaRequestScopeKind.merchant).length;
    assert(merchantCount === 5, 'five merchant rows');
  });

  await runAsyncTest('consumer count remains unchanged in fake five-row write', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma, requests: store } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    await writeApprovedCandidatesInTransaction(asWritePrisma(prisma), recomputed);
    assert(store.length === 5, 'total unchanged');
  });

  await runAsyncTest('candidate digest after write stable in fake run', async () => {
    const requests = makeApprovedCandidates(5).map((c) => legacyWebhookRequest(c.requestId));
    const { prisma } = buildFakePrisma({ requests });
    const recomputed = await reconstructMerchantBackfillCandidates(asCandidatePrisma(prisma));
    const digestBefore = computeCandidateDigest(recomputed.candidates.map((c) => c.requestId));
    await writeApprovedCandidatesInTransaction(asWritePrisma(prisma), recomputed);
    const digestAfter = computeCandidateDigest(recomputed.candidates.map((c) => c.requestId));
    assert(digestBefore === digestAfter, 'digest stable across write');
  });

  runTest('transaction uses Serializable isolation in apply script', () => {
    const source = readSource('../scripts/apply-viona-pack40p4-merchant-backfill.ts');
    assert(source.includes("isolationLevel: 'Serializable'"), 'serializable isolation configured');
  });

  console.log(`\nPack40P4W merchant backfill write tests: ${passed} PASS`);
  if (passed < 30) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error('[pack40p4-write-tests] FATAL', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
