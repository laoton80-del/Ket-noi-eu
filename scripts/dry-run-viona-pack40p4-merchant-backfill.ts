/**
 * Pack40P4D — Read-only merchant provenance backfill dry run (staging only).
 *
 * Operator phrase: APPROVE_PACK40P4_MERCHANT_BACKFILL_DRY_RUN
 *
 * Structurally read-only: count / findMany (minimal select) / groupBy / aggregate only.
 * Never prints raw IDs, audit payloads, connection secrets, or personal data.
 *
 * Usage: npx tsx scripts/dry-run-viona-pack40p4-merchant-backfill.ts
 */

import 'dotenv/config';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { VionaRequestScopeKind } from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { readVionaDeploymentStage } from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';

/** Established VIONA staging Supabase project ref (see Pack40P3/P40A evidence). */
const STAGING_PROJECT_REF = 'euqbfanilcssjiwwtcby';

const ROW_BOUNDARY = 50_000;

/** Non-secret population-integrity constant (committed; not an auth mechanism). */
const CANDIDATE_DIGEST_CONSTANT = 'viona-pack40p4d-candidate-digest-v1';
const CANDIDATE_DIGEST_ALGORITHM = 'sha256-v1';

const FORBIDDEN_INVOCATION_PATTERNS = [
  /\bprisma\.\w+\.create\s*\(/,
  /\bprisma\.\w+\.createMany\s*\(/,
  /\bprisma\.\w+\.update\s*\(/,
  /\bprisma\.\w+\.updateMany\s*\(/,
  /\bprisma\.\w+\.upsert\s*\(/,
  /\bprisma\.\w+\.delete\s*\(/,
  /\bprisma\.\w+\.deleteMany\s*\(/,
  /\bprisma\.\$executeRaw\b/,
  /\bprisma\.\$executeRawUnsafe\b/,
  /\bprisma\.\$queryRawUnsafe\b/,
  /\bprisma\.\$queryRaw\s*\(/,
  /\btx\.\w+\.create\s*\(/,
  /\btx\.\w+\.update\s*\(/,
  /\btx\.\w+\.delete\s*\(/,
] as const;

export type Pack40p4DryRunSummary = Readonly<{
  environment: string;
  stagingProjectRefPresent: boolean;
  deploymentStage: string;
  rowBoundary: number;
  sizeGatePassed: boolean;
  executionTimestampUtc: string;
  totalRequests: number;
  legacyUnresolvedRequests: number;
  consumerRequests: number;
  merchantRequests: number;
  unresolvedWithNullMerchantProfileId: number;
  unresolvedWithNonNullMerchantProfileId: number;
  inconsistentUnresolvedNonNullProfile: number;
  webhookPositiveUnresolvedRequests: number;
  webhookPositiveExactTenantProfileMatch: number;
  webhookPositiveNoProfileMatch: number;
  webhookPositiveAmbiguousProfileMatch: number;
  webhookPositiveOwnerAligned: number;
  webhookPositiveOwnerMismatch: number;
  webhookPositiveOwnerAlignmentUnprovable: number;
  fullyQualifiedMerchantCandidates: number;
  activeMerchantCandidates: number;
  inactiveMerchantCandidates: number;
  duplicateOrContradictoryWebhookEvidence: number;
  registryMatchedUnresolvedWithoutWebhook: number;
  webhookPositiveTenantMismatch: number;
  excludedContradictoryCurrentProvenance: number;
  totalAuditEvents: number;
  totalMerchantProfiles: number;
  latestWebhookAuditBucketUtc: string | null;
  candidateDigestAlgorithm: string;
  candidateDigest: string;
  candidateCount: number;
  p4wDesignReady: boolean;
  dataModified: false;
  p4wAuthorized: false;
}>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40p4-dry-run] ${stage}: ${detail}` : `[pack40p4-dry-run] ${stage}`);
}

function fail(stage: string, detail: string): never {
  console.error(`[pack40p4-dry-run] BLOCKED ${stage}: ${detail}`);
  process.exit(1);
}

function assertStructuralReadOnly(): void {
  const sourcePath = fileURLToPath(import.meta.url);
  const source = readFileSync(sourcePath, 'utf8');
  for (const pattern of FORBIDDEN_INVOCATION_PATTERNS) {
    if (pattern.test(source)) {
      fail('read-only-safety', `forbidden invocation pattern detected: ${pattern.source}`);
    }
  }
  if (/from\s+['"]axios['"]|from\s+['"]node-fetch['"]|from\s+['"]twilio['"]|from\s+['"]openai['"]/.test(source)) {
    fail('read-only-safety', 'forbidden HTTP/provider SDK import detected');
  }
  log('static-safety', 'structural read-only scan PASS');
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

function bucketUtcHour(iso: Date): string {
  const d = new Date(iso);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

function computeCandidateDigest(sortedCandidateRequestIds: readonly string[]): string {
  const payload = sortedCandidateRequestIds
    .map((id) => `${id}:${CANDIDATE_DIGEST_CONSTANT}`)
    .join('\n');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

async function runDryRun(): Promise<Pack40p4DryRunSummary> {
  const prisma = getPrisma();
  const executionTimestampUtc = new Date().toISOString();

  const totalRequests = await prisma.vionaRequest.count();
  const totalAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const totalMerchantProfiles = await prisma.merchantProfile.count();

  log(
    'size-gate',
    `totalRequests=${totalRequests}, auditEvents=${totalAuditEvents}, merchantProfiles=${totalMerchantProfiles}`,
  );

  if (totalRequests > ROW_BOUNDARY) {
    fail(
      'size-gate',
      `totalRequests=${totalRequests} exceeds boundary ${ROW_BOUNDARY} — requires aggregate-query review.`,
    );
  }

  const scopeGroups = await prisma.vionaRequest.groupBy({
    by: ['scopeKind'],
    _count: { _all: true },
  });

  let legacyUnresolvedRequests = 0;
  let consumerRequests = 0;
  let merchantRequests = 0;
  for (const group of scopeGroups) {
    const count = group._count._all;
    if (group.scopeKind === VionaRequestScopeKind.legacyUnresolved) {
      legacyUnresolvedRequests = count;
    } else if (group.scopeKind === VionaRequestScopeKind.consumer) {
      consumerRequests = count;
    } else if (group.scopeKind === VionaRequestScopeKind.merchant) {
      merchantRequests = count;
    }
  }

  const unresolvedWithNullMerchantProfileId = await prisma.vionaRequest.count({
    where: {
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: null,
    },
  });

  const unresolvedWithNonNullMerchantProfileId = await prisma.vionaRequest.count({
    where: {
      scopeKind: VionaRequestScopeKind.legacyUnresolved,
      merchantProfileId: { not: null },
    },
  });

  const excludedContradictoryCurrentProvenance =
    consumerRequests + merchantRequests + unresolvedWithNonNullMerchantProfileId;

  const merchantProfiles = await prisma.merchantProfile.findMany({
    select: { id: true, tenantId: true, ownerUserId: true, isActive: true },
  });

  const tenantToProfiles = new Map<
    string,
    ReadonlyArray<{ id: string; ownerUserId: string; isActive: boolean }>
  >();
  for (const profile of merchantProfiles) {
    const existing = tenantToProfiles.get(profile.tenantId) ?? [];
    tenantToProfiles.set(profile.tenantId, [
      ...existing,
      { id: profile.id, ownerUserId: profile.ownerUserId, isActive: profile.isActive },
    ]);
  }

  const profileById = new Map(merchantProfiles.map((p) => [p.id, p]));

  const unresolvedRows = await prisma.vionaRequest.findMany({
    where: { scopeKind: VionaRequestScopeKind.legacyUnresolved },
    select: {
      id: true,
      tenantId: true,
      ownerUserId: true,
      merchantProfileId: true,
      auditEvents: {
        where: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
        select: { createdAt: true },
      },
    },
  });

  const webhookAuditTimestamps: Date[] = [];

  let inconsistentUnresolvedNonNullProfile = 0;
  let webhookPositiveUnresolvedRequests = 0;
  let webhookPositiveExactTenantProfileMatch = 0;
  let webhookPositiveNoProfileMatch = 0;
  let webhookPositiveAmbiguousProfileMatch = 0;
  let webhookPositiveOwnerAligned = 0;
  let webhookPositiveOwnerMismatch = 0;
  let webhookPositiveOwnerAlignmentUnprovable = 0;
  let duplicateOrContradictoryWebhookEvidence = 0;
  let registryMatchedUnresolvedWithoutWebhook = 0;
  let webhookPositiveTenantMismatch = 0;

  const fullyQualifiedCandidateIds: string[] = [];
  let activeMerchantCandidates = 0;
  let inactiveMerchantCandidates = 0;

  for (const row of unresolvedRows) {
    if (row.merchantProfileId != null) {
      inconsistentUnresolvedNonNullProfile += 1;
      const linked = profileById.get(row.merchantProfileId);
      if (linked != null && linked.tenantId !== row.tenantId) {
        duplicateOrContradictoryWebhookEvidence += 1;
      }
      continue;
    }

    const webhookCount = row.auditEvents.length;
    const hasWebhook = webhookCount > 0;
    const profilesForTenant = tenantToProfiles.get(row.tenantId) ?? [];
    const registryMatched = profilesForTenant.length > 0;

    if (!hasWebhook) {
      if (registryMatched) {
        registryMatchedUnresolvedWithoutWebhook += 1;
      }
      continue;
    }

    webhookPositiveUnresolvedRequests += 1;
    for (const event of row.auditEvents) {
      webhookAuditTimestamps.push(event.createdAt);
    }

    if (webhookCount > 1) {
      duplicateOrContradictoryWebhookEvidence += 1;
    }

    if (profilesForTenant.length === 0) {
      webhookPositiveNoProfileMatch += 1;
      webhookPositiveTenantMismatch += 1;
      continue;
    }

    if (profilesForTenant.length > 1) {
      webhookPositiveAmbiguousProfileMatch += 1;
      duplicateOrContradictoryWebhookEvidence += 1;
      continue;
    }

    webhookPositiveExactTenantProfileMatch += 1;
    const profile = profilesForTenant[0]!;

    if (row.ownerUserId == null) {
      webhookPositiveOwnerAlignmentUnprovable += 1;
      continue;
    }

    if (row.ownerUserId === profile.ownerUserId) {
      webhookPositiveOwnerAligned += 1;
    } else {
      webhookPositiveOwnerMismatch += 1;
      continue;
    }

    if (webhookCount > 1) {
      continue;
    }

    fullyQualifiedCandidateIds.push(row.id);
    if (profile.isActive) {
      activeMerchantCandidates += 1;
    } else {
      inactiveMerchantCandidates += 1;
    }
  }

  fullyQualifiedCandidateIds.sort((a, b) => a.localeCompare(b));
  const candidateDigest = computeCandidateDigest(fullyQualifiedCandidateIds);

  const latestWebhookAuditBucketUtc =
    webhookAuditTimestamps.length === 0
      ? null
      : bucketUtcHour(
          webhookAuditTimestamps.reduce((latest, current) =>
            current > latest ? current : latest,
          ),
        );

  const ambiguousCandidates =
    webhookPositiveAmbiguousProfileMatch + inconsistentUnresolvedNonNullProfile;
  const p4wDesignReady =
    fullyQualifiedCandidateIds.length > 0 &&
    ambiguousCandidates === 0 &&
    webhookPositiveOwnerMismatch === 0 &&
    webhookPositiveOwnerAlignmentUnprovable === 0 &&
    duplicateOrContradictoryWebhookEvidence === 0;

  return {
    environment: 'staging-redacted',
    stagingProjectRefPresent: true,
    deploymentStage: readVionaDeploymentStage(),
    rowBoundary: ROW_BOUNDARY,
    sizeGatePassed: true,
    executionTimestampUtc,
    totalRequests,
    legacyUnresolvedRequests,
    consumerRequests,
    merchantRequests,
    unresolvedWithNullMerchantProfileId,
    unresolvedWithNonNullMerchantProfileId,
    inconsistentUnresolvedNonNullProfile,
    webhookPositiveUnresolvedRequests,
    webhookPositiveExactTenantProfileMatch,
    webhookPositiveNoProfileMatch,
    webhookPositiveAmbiguousProfileMatch,
    webhookPositiveOwnerAligned,
    webhookPositiveOwnerMismatch,
    webhookPositiveOwnerAlignmentUnprovable,
    fullyQualifiedMerchantCandidates: fullyQualifiedCandidateIds.length,
    activeMerchantCandidates,
    inactiveMerchantCandidates,
    duplicateOrContradictoryWebhookEvidence,
    registryMatchedUnresolvedWithoutWebhook,
    webhookPositiveTenantMismatch,
    excludedContradictoryCurrentProvenance,
    totalAuditEvents,
    totalMerchantProfiles,
    latestWebhookAuditBucketUtc,
    candidateDigestAlgorithm: CANDIDATE_DIGEST_ALGORITHM,
    candidateDigest,
    candidateCount: fullyQualifiedCandidateIds.length,
    p4wDesignReady,
    dataModified: false,
    p4wAuthorized: false,
  };
}

async function main(): Promise<void> {
  assertStructuralReadOnly();
  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  log('start', 'read-only merchant backfill dry run (no mutation authorized)');

  const summary = await runDryRun();

  log('complete', 'aggregate dry run finished — sanitized summary follows');
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(
      '[pack40p4-dry-run] FATAL',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
