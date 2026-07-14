/**
 * Pack40A — Read-only tenant provenance inventory (staging only).
 *
 * Operator phrase: APPROVE_PACK40A_READ_ONLY_TENANT_PROVENANCE_INVENTORY
 *
 * Structurally read-only: count / findMany (minimal select) / groupBy / aggregate only.
 * Never prints raw tenant IDs, request IDs, user IDs, audit payloads, or connection secrets.
 *
 * Usage: npx tsx scripts/inventory-viona-pack40a-tenant-provenance.ts
 */

import 'dotenv/config';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { readVionaDeploymentStage } from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';

/** Established VIONA staging Supabase project ref (see scripts/provision-local-pilot-accounts-staging.ts). */
const STAGING_PROJECT_REF = 'euqbfanilcssjiwwtcby';

const INVENTORY_ROW_BOUNDARY = 50_000;

/** Source-committed synthetic tenant constants — labels only in output. */
const SYNTHETIC_TENANT_FIXTURES = [
  { label: 'pack36aQaTenant', tenantId: 'pack36a-qa-tenant' },
  { label: 'stagingPingTenant', tenantId: 'staging-ping-tenant' },
  { label: 'pack31E2eTenant', tenantId: 'pack31-e2e-tenant' },
  { label: 'pilotTenantA', tenantId: 'pilot-tenant-a' },
  { label: 'pilotTenantB', tenantId: 'pilot-tenant-b' },
] as const;

export type Pack40aInventorySummary = Readonly<{
  environment: string;
  stagingProjectRefPresent: boolean;
  deploymentStage: string;
  inventoryRowBoundary: number;
  sizeGatePassed: boolean;
  totalRequests: number;
  distinctTenantCount: number;
  totalMerchantProfiles: number;
  activeMerchantProfiles: number;
  inactiveMerchantProfiles: number;
  merchantTenantMatchedRequests: number;
  merchantTenantMatchedActiveProfileRequests: number;
  merchantTenantMatchedInactiveProfileRequests: number;
  merchantTenantUnmatchedRequests: number;
  distinctUnmatchedTenantCount: number;
  webhookAssociatedRequests: number;
  webhookAssociatedMatchedRequests: number;
  webhookAssociatedUnmatchedRequests: number;
  nonWebhookMerchantMatchedRequests: number;
  nonWebhookUnmatchedRequests: number;
  merchantMatchedOwnerAlignedRequests: number;
  merchantMatchedOwnerMisalignedRequests: number;
  duplicateMerchantTenantMappings: number;
  knownSyntheticFixtures: Readonly<Record<string, number>>;
  unresolvedRequests: number;
  canonicalConsumerProvenanceConfirmed: false;
  dataModified: false;
}>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40a-inventory] ${stage}: ${detail}` : `[pack40a-inventory] ${stage}`);
}

function fail(stage: string, detail: string): never {
  console.error(`[pack40a-inventory] BLOCKED ${stage}: ${detail}`);
  process.exit(1);
}

function maskDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '(unset)';
  try {
    const url = new URL(rawUrl);
    const host = url.hostname;
    const redactedHost = host.includes(STAGING_PROJECT_REF)
      ? `db.${STAGING_PROJECT_REF}.supabase.co`
      : `${host.slice(0, 4)}…${host.slice(-8)}`;
    return `${url.protocol}//${redactedHost}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return '(unparseable — not printed for safety)';
  }
}

function assertNotProductionDeployment(): void {
  const stage = readVionaDeploymentStage();
  if (stage === 'production') {
    fail('environment', 'VIONA_DEPLOYMENT_STAGE=production — aborting before any query.');
  }
  log('environment', `deploymentStage=${stage}`);
}

function assertStagingDatabaseIdentity(): void {
  const db = process.env.DATABASE_URL?.trim() ?? '';
  const direct = process.env.DIRECT_URL?.trim() ?? '';
  const haystack = `${db}\n${direct}`;
  if (!haystack.includes(STAGING_PROJECT_REF)) {
    fail(
      'environment',
      `DATABASE_URL or DIRECT_URL must contain staging project ref ${STAGING_PROJECT_REF}. Refusing to query.`,
    );
  }
  log('environment', `targetDatabase=${maskDatabaseUrl(db)}`);
  log('environment', `stagingProjectRef=${STAGING_PROJECT_REF} (verified present, redacted)`);
}

async function runInventory(): Promise<Pack40aInventorySummary> {
  const prisma = getPrisma();

  const totalRequests = await prisma.vionaRequest.count();
  const totalMerchantProfiles = await prisma.merchantProfile.count();
  const totalAuditEvents = await prisma.vionaRequestAuditEvent.count();

  log('size-gate', `totalRequests=${totalRequests}, merchantProfiles=${totalMerchantProfiles}, auditEvents=${totalAuditEvents}`);

  if (totalRequests > INVENTORY_ROW_BOUNDARY) {
    fail(
      'inventory-size',
      `totalRequests=${totalRequests} exceeds boundary ${INVENTORY_ROW_BOUNDARY} — requires aggregate-query review.`,
    );
  }

  const merchantProfiles = await prisma.merchantProfile.findMany({
    select: { tenantId: true, isActive: true, ownerUserId: true },
  });

  const activeMerchantProfiles = merchantProfiles.filter((p) => p.isActive).length;
  const inactiveMerchantProfiles = merchantProfiles.length - activeMerchantProfiles;

  const tenantToProfile = new Map<
    string,
    Readonly<{ isActive: boolean; ownerUserId: string }>
  >();
  for (const profile of merchantProfiles) {
    tenantToProfile.set(profile.tenantId, {
      isActive: profile.isActive,
      ownerUserId: profile.ownerUserId,
    });
  }

  const duplicateMerchantTenantMappings = merchantProfiles.length - tenantToProfile.size;

  const merchantTenantIds = [...tenantToProfile.keys()];

  const tenantGroups = await prisma.vionaRequest.groupBy({
    by: ['tenantId'],
    _count: { _all: true },
  });

  const distinctTenantCount = tenantGroups.length;

  let merchantTenantMatchedRequests = 0;
  let merchantTenantMatchedActiveProfileRequests = 0;
  let merchantTenantMatchedInactiveProfileRequests = 0;
  let merchantTenantUnmatchedRequests = 0;
  let distinctUnmatchedTenantCount = 0;

  for (const group of tenantGroups) {
    const count = group._count._all;
    const profile = tenantToProfile.get(group.tenantId);
    if (profile != null) {
      merchantTenantMatchedRequests += count;
      if (profile.isActive) {
        merchantTenantMatchedActiveProfileRequests += count;
      } else {
        merchantTenantMatchedInactiveProfileRequests += count;
      }
    } else {
      merchantTenantUnmatchedRequests += count;
      distinctUnmatchedTenantCount += 1;
    }
  }

  const webhookAssociatedRequests = await prisma.vionaRequest.count({
    where: {
      auditEvents: {
        some: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
      },
    },
  });

  const webhookAssociatedMatchedRequests =
    merchantTenantIds.length === 0
      ? 0
      : await prisma.vionaRequest.count({
          where: {
            tenantId: { in: merchantTenantIds },
            auditEvents: {
              some: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
            },
          },
        });

  const webhookAssociatedUnmatchedRequests =
    webhookAssociatedRequests - webhookAssociatedMatchedRequests;

  const nonWebhookMerchantMatchedRequests =
    merchantTenantIds.length === 0
      ? 0
      : await prisma.vionaRequest.count({
          where: {
            tenantId: { in: merchantTenantIds },
            auditEvents: {
              none: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
            },
          },
        });

  const nonWebhookUnmatchedRequests = await prisma.vionaRequest.count({
    where: {
      ...(merchantTenantIds.length > 0 ? { tenantId: { notIn: merchantTenantIds } } : {}),
      auditEvents: {
        none: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
      },
    },
  });

  let merchantMatchedOwnerAlignedRequests = 0;
  let merchantMatchedOwnerMisalignedRequests = 0;

  for (const profile of merchantProfiles) {
    const aligned = await prisma.vionaRequest.count({
      where: { tenantId: profile.tenantId, ownerUserId: profile.ownerUserId },
    });
    const misaligned = await prisma.vionaRequest.count({
      where: {
        tenantId: profile.tenantId,
        OR: [
          { ownerUserId: { not: profile.ownerUserId } },
          { ownerUserId: null },
        ],
      },
    });
    merchantMatchedOwnerAlignedRequests += aligned;
    merchantMatchedOwnerMisalignedRequests += misaligned;
  }

  const knownSyntheticFixtures: Record<string, number> = {};
  for (const fixture of SYNTHETIC_TENANT_FIXTURES) {
    const fixtureCount = await prisma.vionaRequest.count({
      where: { tenantId: fixture.tenantId },
    });
    if (fixtureCount > 0) {
      knownSyntheticFixtures[fixture.label] = fixtureCount;
    }
  }

  const unresolvedRequests = merchantTenantUnmatchedRequests;

  return {
    environment: 'staging-redacted',
    stagingProjectRefPresent: true,
    deploymentStage: readVionaDeploymentStage(),
    inventoryRowBoundary: INVENTORY_ROW_BOUNDARY,
    sizeGatePassed: true,
    totalRequests,
    distinctTenantCount,
    totalMerchantProfiles,
    activeMerchantProfiles,
    inactiveMerchantProfiles,
    merchantTenantMatchedRequests,
    merchantTenantMatchedActiveProfileRequests,
    merchantTenantMatchedInactiveProfileRequests,
    merchantTenantUnmatchedRequests,
    distinctUnmatchedTenantCount,
    webhookAssociatedRequests,
    webhookAssociatedMatchedRequests,
    webhookAssociatedUnmatchedRequests,
    nonWebhookMerchantMatchedRequests,
    nonWebhookUnmatchedRequests,
    merchantMatchedOwnerAlignedRequests,
    merchantMatchedOwnerMisalignedRequests,
    duplicateMerchantTenantMappings,
    knownSyntheticFixtures,
    unresolvedRequests,
    canonicalConsumerProvenanceConfirmed: false,
    dataModified: false,
  };
}

async function main(): Promise<void> {
  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  log('start', 'read-only tenant provenance inventory (no mutation authorized)');

  const summary = await runInventory();

  log('complete', 'aggregate inventory finished — sanitized summary follows');
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error('[pack40a-inventory] FATAL', error instanceof Error ? error.message : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
