/**
 * Pack40P4W — Staging merchant provenance backfill write (exact population).
 *
 * Operator phrase: APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE
 *
 * Mutates only VionaRequest.scopeKind and VionaRequest.merchantProfileId for the exact
 * five-row population approved by Pack40P4D. Never prints raw identifiers.
 *
 * Usage: npx tsx scripts/apply-viona-pack40p4-merchant-backfill.ts
 */

import 'dotenv/config';

import { createHash } from 'node:crypto';

import { VionaRequestScopeKind, type PrismaClient } from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { readVionaDeploymentStage } from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';

/** Established VIONA staging Supabase project ref (see Pack40P3/P40A/P4D evidence). */
export const STAGING_PROJECT_REF = 'euqbfanilcssjiwwtcby';

export const ROW_BOUNDARY = 50_000;

/** Approved Pack40P4D population (merged evidence PR #349). */
export const APPROVED_CANDIDATE_COUNT = 5;
export const APPROVED_CANDIDATE_DIGEST =
  'aa74f63813af18e26afca268175b2b40246159619cda5438aaf40c6d5f930213';
export const CANDIDATE_DIGEST_CONSTANT = 'viona-pack40p4d-candidate-digest-v1';
export const CANDIDATE_DIGEST_ALGORITHM = 'sha256-v1';

export type MerchantBackfillCandidate = Readonly<{
  requestId: string;
  tenantId: string;
  ownerUserId: string;
  merchantProfileId: string;
}>;

export type CandidateReconstructionBlockReason =
  | 'ambiguous_profile'
  | 'owner_mismatch'
  | 'owner_unprovable'
  | 'duplicate_webhook'
  | 'tenant_mismatch'
  | 'inconsistent_unresolved_fk'
  | 'contradictory_provenance';

export type CandidateReconstructionResult = Readonly<{
  candidates: readonly MerchantBackfillCandidate[];
  digest: string;
  blockedReasons: readonly CandidateReconstructionBlockReason[];
}>;

export type Pack40p4WriteSummary = Readonly<{
  environment: string;
  stagingProjectRefPresent: boolean;
  deploymentStage: string;
  approvedCandidateCount: number;
  approvedCandidateDigestAlgorithm: string;
  approvedCandidateDigest: string;
  recomputedCandidateCount: number;
  recomputedCandidateDigest: string;
  candidateSetRevalidated: boolean;
  preWriteLegacyUnresolved: number;
  preWriteMerchant: number;
  preWriteConsumer: number;
  preWriteTotalRequests: number;
  rowsUpdated: number;
  alreadyApplied: boolean;
  postWriteLegacyUnresolved: number;
  postWriteMerchant: number;
  postWriteConsumer: number;
  postWriteTotalRequests: number;
  postWriteMerchantRowsFromApprovedSet: number;
  postWriteLegacyRowsFromApprovedSet: number;
  consumerRowsModified: number;
  tenantIdsModified: number;
  requestCountChanged: boolean;
  auditEventCountChanged: boolean;
  merchantProfileCountChanged: boolean;
  dataModified: boolean;
  productionTouched: false;
}>;

type PrismaLike = Pick<
  PrismaClient,
  | 'vionaRequest'
  | 'merchantProfile'
  | 'vionaRequestAuditEvent'
  | '$transaction'
>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40p4-write] ${stage}: ${detail}` : `[pack40p4-write] ${stage}`);
}

export function failWrite(stage: string, detail: string): never {
  console.error(`[pack40p4-write] BLOCKED ${stage}: ${detail}`);
  throw new Pack40p4WriteBlockedError(stage, detail);
}

export class Pack40p4WriteBlockedError extends Error {
  constructor(
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${stage}: ${detail}`);
    this.name = 'Pack40p4WriteBlockedError';
  }
}

export function computeCandidateDigest(sortedCandidateRequestIds: readonly string[]): string {
  const payload = sortedCandidateRequestIds
    .map((id) => `${id}:${CANDIDATE_DIGEST_CONSTANT}`)
    .join('\n');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function validateApprovedPopulation(
  candidates: readonly MerchantBackfillCandidate[],
  digest: string,
  blockedReasons: readonly CandidateReconstructionBlockReason[],
): void {
  if (blockedReasons.length > 0) {
    failWrite('candidate-revalidation', `blockedReasons=${blockedReasons.join(',')}`);
  }
  if (candidates.length !== APPROVED_CANDIDATE_COUNT) {
    failWrite(
      'candidate-set-drift',
      `count=${candidates.length} expected=${APPROVED_CANDIDATE_COUNT}`,
    );
  }
  if (digest !== APPROVED_CANDIDATE_DIGEST) {
    failWrite('candidate-set-drift', 'digest mismatch vs approved Pack40P4D evidence');
  }
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

export function assertNotProductionDeployment(): void {
  const stage = readVionaDeploymentStage();
  if (stage === 'production') {
    failWrite('environment', 'VIONA_DEPLOYMENT_STAGE=production');
  }
  log('environment', `deploymentStage=${stage}`);
}

export function assertStagingDatabaseIdentity(): void {
  const db = process.env.DATABASE_URL?.trim() ?? '';
  const direct = process.env.DIRECT_URL?.trim() ?? '';
  const haystack = `${db}\n${direct}`;
  if (!haystack.includes(STAGING_PROJECT_REF)) {
    failWrite(
      'environment',
      `DATABASE_URL or DIRECT_URL must contain staging project ref ${STAGING_PROJECT_REF}`,
    );
  }
  log('environment', `targetDatabase=${maskDatabaseUrl(db)}`);
  log('environment', `stagingProjectRef=${STAGING_PROJECT_REF} (verified present, redacted)`);
}

export async function reconstructMerchantBackfillCandidates(
  prisma: Pick<PrismaClient, 'merchantProfile' | 'vionaRequest'>,
  scopeKind: typeof VionaRequestScopeKind.legacyUnresolved | typeof VionaRequestScopeKind.merchant = VionaRequestScopeKind.legacyUnresolved,
): Promise<CandidateReconstructionResult> {
  const blockedReasons: CandidateReconstructionBlockReason[] = [];

  const merchantProfiles = await prisma.merchantProfile.findMany({
    select: { id: true, tenantId: true, ownerUserId: true },
  });

  const tenantToProfiles = new Map<
    string,
    readonly { id: string; ownerUserId: string }[]
  >();
  for (const profile of merchantProfiles) {
    const existing = tenantToProfiles.get(profile.tenantId) ?? [];
    tenantToProfiles.set(profile.tenantId, [
      ...existing,
      { id: profile.id, ownerUserId: profile.ownerUserId },
    ]);
  }

  const profileById = new Map(merchantProfiles.map((p) => [p.id, p]));

  const scopedRows = await prisma.vionaRequest.findMany({
    where: { scopeKind },
    select: {
      id: true,
      tenantId: true,
      ownerUserId: true,
      merchantProfileId: true,
      auditEvents: {
        where: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
        select: { id: true },
      },
    },
  });

  const candidates: MerchantBackfillCandidate[] = [];

  for (const row of scopedRows) {
    if (scopeKind === VionaRequestScopeKind.legacyUnresolved && row.merchantProfileId != null) {
      blockedReasons.push('inconsistent_unresolved_fk');
      const linked = profileById.get(row.merchantProfileId);
      if (linked != null && linked.tenantId !== row.tenantId) {
        blockedReasons.push('contradictory_provenance');
      }
      continue;
    }

    const webhookCount = row.auditEvents.length;
    if (webhookCount === 0) {
      continue;
    }

    if (webhookCount > 1) {
      blockedReasons.push('duplicate_webhook');
      continue;
    }

    const profilesForTenant = tenantToProfiles.get(row.tenantId) ?? [];
    if (profilesForTenant.length === 0) {
      blockedReasons.push('tenant_mismatch');
      continue;
    }
    if (profilesForTenant.length > 1) {
      blockedReasons.push('ambiguous_profile');
      continue;
    }

    const profile = profilesForTenant[0]!;
    if (row.ownerUserId == null) {
      blockedReasons.push('owner_unprovable');
      continue;
    }
    if (row.ownerUserId !== profile.ownerUserId) {
      blockedReasons.push('owner_mismatch');
      continue;
    }

    if (
      scopeKind === VionaRequestScopeKind.merchant &&
      row.merchantProfileId !== profile.id
    ) {
      blockedReasons.push('contradictory_provenance');
      continue;
    }

    candidates.push({
      requestId: row.id,
      tenantId: row.tenantId,
      ownerUserId: row.ownerUserId,
      merchantProfileId: profile.id,
    });
  }

  const sorted = [...candidates].sort((a, b) => a.requestId.localeCompare(b.requestId));
  const digest = computeCandidateDigest(sorted.map((c) => c.requestId));

  return {
    candidates: sorted,
    digest,
    blockedReasons: [...new Set(blockedReasons)],
  };
}

async function countScopeKinds(
  prisma: Pick<PrismaClient, 'vionaRequest'>,
): Promise<{ legacy: number; merchant: number; consumer: number; total: number }> {
  const scopeGroups = await prisma.vionaRequest.groupBy({
    by: ['scopeKind'],
    _count: { _all: true },
  });
  let legacy = 0;
  let merchant = 0;
  let consumer = 0;
  for (const group of scopeGroups) {
    const count = group._count._all;
    if (group.scopeKind === VionaRequestScopeKind.legacyUnresolved) legacy = count;
    else if (group.scopeKind === VionaRequestScopeKind.merchant) merchant = count;
    else if (group.scopeKind === VionaRequestScopeKind.consumer) consumer = count;
  }
  const total = legacy + merchant + consumer;
  return { legacy, merchant, consumer, total };
}

type ApprovedRowState = Readonly<{
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  tenantId: string;
  ownerUserId: string | null;
}>;

async function readApprovedRowStates(
  tx: Pick<PrismaClient, 'vionaRequest'>,
  candidates: readonly MerchantBackfillCandidate[],
): Promise<ApprovedRowState[]> {
  const states: ApprovedRowState[] = [];
  for (const candidate of candidates) {
    const row = await tx.vionaRequest.findUnique({
      where: { id: candidate.requestId },
      select: {
        scopeKind: true,
        merchantProfileId: true,
        tenantId: true,
        ownerUserId: true,
      },
    });
    if (row == null) {
      failWrite('candidate-set-drift', 'approved candidate row missing');
    }
    states.push(row);
  }
  return states;
}

function classifyPreWriteState(
  candidates: readonly MerchantBackfillCandidate[],
  states: readonly ApprovedRowState[],
): 'write' | 'already_applied' | 'partial' {
  let merchantCount = 0;
  let legacyCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const state = states[i]!;
    const isFullyApplied =
      state.scopeKind === VionaRequestScopeKind.merchant &&
      state.merchantProfileId === candidate.merchantProfileId &&
      state.tenantId === candidate.tenantId &&
      state.ownerUserId === candidate.ownerUserId;

    const isExactPreState =
      state.scopeKind === VionaRequestScopeKind.legacyUnresolved &&
      state.merchantProfileId === null &&
      state.tenantId === candidate.tenantId &&
      state.ownerUserId === candidate.ownerUserId;

    if (isFullyApplied) {
      merchantCount += 1;
    } else if (isExactPreState) {
      legacyCount += 1;
    } else {
      return 'partial';
    }
  }

  if (merchantCount === candidates.length) return 'already_applied';
  if (legacyCount === candidates.length) return 'write';
  if (merchantCount > 0 && legacyCount > 0) return 'partial';
  return 'partial';
}

export async function writeApprovedCandidatesInTransaction(
  tx: Pick<PrismaClient, 'vionaRequest' | 'vionaRequestAuditEvent' | 'merchantProfile'>,
  recomputed: CandidateReconstructionResult,
): Promise<{ rowsUpdated: number; alreadyApplied: boolean }> {
  const preTotal = await tx.vionaRequest.count();
  const preAudit = await tx.vionaRequestAuditEvent.count();
  const preProfiles = await tx.merchantProfile.count();
  const preConsumer = await tx.vionaRequest.count({
    where: { scopeKind: VionaRequestScopeKind.consumer },
  });

  const preStates = await readApprovedRowStates(tx, recomputed.candidates);
  const preClass = classifyPreWriteState(recomputed.candidates, preStates);
  if (preClass === 'partial') {
    failWrite('partial-or-inconsistent-backfill', 'mixed or unexpected approved-row state');
  }
  if (preClass === 'already_applied') {
    return { rowsUpdated: 0, alreadyApplied: true };
  }

  let rowsUpdated = 0;
  for (const candidate of recomputed.candidates) {
    const result = await tx.vionaRequest.updateMany({
      where: {
        id: candidate.requestId,
        scopeKind: VionaRequestScopeKind.legacyUnresolved,
        merchantProfileId: null,
        tenantId: candidate.tenantId,
        ownerUserId: candidate.ownerUserId,
      },
      data: {
        scopeKind: VionaRequestScopeKind.merchant,
        merchantProfileId: candidate.merchantProfileId,
      },
    });
    if (result.count !== 1) {
      failWrite('transaction-invariant', 'guarded update affected unexpected row count');
    }
    rowsUpdated += 1;
  }

  const postStates = await readApprovedRowStates(tx, recomputed.candidates);
  for (let i = 0; i < recomputed.candidates.length; i++) {
    const candidate = recomputed.candidates[i]!;
    const state = postStates[i]!;
    if (state.scopeKind !== VionaRequestScopeKind.merchant) {
      failWrite('transaction-invariant', 'post-update scopeKind not merchant');
    }
    if (state.merchantProfileId !== candidate.merchantProfileId) {
      failWrite('transaction-invariant', 'post-update merchantProfileId mismatch');
    }
    if (state.tenantId !== candidate.tenantId || state.ownerUserId !== candidate.ownerUserId) {
      failWrite('transaction-invariant', 'tenant or owner changed during update');
    }
  }

  const postTotal = await tx.vionaRequest.count();
  const postAudit = await tx.vionaRequestAuditEvent.count();
  const postProfiles = await tx.merchantProfile.count();
  const postConsumer = await tx.vionaRequest.count({
    where: { scopeKind: VionaRequestScopeKind.consumer },
  });

  if (postTotal !== preTotal) {
    failWrite('transaction-invariant', 'total request count changed inside transaction');
  }
  if (postAudit !== preAudit) {
    failWrite('transaction-invariant', 'audit event count changed inside transaction');
  }
  if (postProfiles !== preProfiles) {
    failWrite('transaction-invariant', 'merchant profile count changed inside transaction');
  }
  if (postConsumer !== preConsumer) {
    failWrite('transaction-invariant', 'consumer count changed inside transaction');
  }

  return { rowsUpdated, alreadyApplied: false };
}

export async function executeMerchantBackfillTransaction(
  prisma: PrismaLike,
  candidates: readonly MerchantBackfillCandidate[],
): Promise<{ rowsUpdated: number; alreadyApplied: boolean }> {
  return prisma.$transaction(
    async (tx) => {
      const recomputed = await reconstructMerchantBackfillCandidates(tx);
      validateApprovedPopulation(
        recomputed.candidates,
        recomputed.digest,
        recomputed.blockedReasons,
      );
      return writeApprovedCandidatesInTransaction(tx, recomputed);
    },
    { isolationLevel: 'Serializable' },
  );
}

async function buildWriteSummary(
  prisma: PrismaLike,
  preScope: { legacy: number; merchant: number; consumer: number; total: number },
  preAudit: number,
  preProfiles: number,
  preRecomputed: CandidateReconstructionResult,
  rowsUpdated: number,
  alreadyApplied: boolean,
): Promise<Pack40p4WriteSummary> {
  const postScope = await countScopeKinds(prisma);
  const postAudit = await prisma.vionaRequestAuditEvent.count();
  const postProfiles = await prisma.merchantProfile.count();

  let postWriteMerchantFromApproved = 0;
  let postWriteLegacyFromApproved = 0;
  for (const candidate of preRecomputed.candidates) {
    const row = await prisma.vionaRequest.findUnique({
      where: { id: candidate.requestId },
      select: { scopeKind: true, merchantProfileId: true },
    });
    if (row == null) {
      failWrite('post-write-invariant', 'approved candidate missing after commit');
    }
    if (
      row.scopeKind === VionaRequestScopeKind.merchant &&
      row.merchantProfileId === candidate.merchantProfileId
    ) {
      postWriteMerchantFromApproved += 1;
    } else if (row.scopeKind === VionaRequestScopeKind.legacyUnresolved) {
      postWriteLegacyFromApproved += 1;
    } else {
      failWrite('post-write-invariant', 'approved candidate post-state unexpected');
    }
  }

  const postDigest = computeCandidateDigest(preRecomputed.candidates.map((c) => c.requestId));

  if (postWriteMerchantFromApproved !== APPROVED_CANDIDATE_COUNT) {
    failWrite('post-write-invariant', 'approved merchant post-state count mismatch');
  }
  if (postWriteLegacyFromApproved !== 0) {
    failWrite('post-write-invariant', 'approved set still contains legacyUnresolved rows');
  }
  if (postDigest !== APPROVED_CANDIDATE_DIGEST) {
    failWrite('post-write-invariant', 'post-write candidate digest drift');
  }
  if (postScope.total !== preScope.total) {
    failWrite('post-write-invariant', 'total request count changed');
  }
  if (postScope.consumer !== preScope.consumer) {
    failWrite('post-write-invariant', 'consumer count changed');
  }

  return {
    environment: 'staging-redacted',
    stagingProjectRefPresent: true,
    deploymentStage: readVionaDeploymentStage(),
    approvedCandidateCount: APPROVED_CANDIDATE_COUNT,
    approvedCandidateDigestAlgorithm: CANDIDATE_DIGEST_ALGORITHM,
    approvedCandidateDigest: APPROVED_CANDIDATE_DIGEST,
    recomputedCandidateCount: preRecomputed.candidates.length,
    recomputedCandidateDigest: preRecomputed.digest,
    candidateSetRevalidated: true,
    preWriteLegacyUnresolved: preScope.legacy,
    preWriteMerchant: preScope.merchant,
    preWriteConsumer: preScope.consumer,
    preWriteTotalRequests: preScope.total,
    rowsUpdated,
    alreadyApplied,
    postWriteLegacyUnresolved: postScope.legacy,
    postWriteMerchant: postScope.merchant,
    postWriteConsumer: postScope.consumer,
    postWriteTotalRequests: postScope.total,
    postWriteMerchantRowsFromApprovedSet: postWriteMerchantFromApproved,
    postWriteLegacyRowsFromApprovedSet: postWriteLegacyFromApproved,
    consumerRowsModified: 0,
    tenantIdsModified: 0,
    requestCountChanged: postScope.total !== preScope.total,
    auditEventCountChanged: postAudit !== preAudit,
    merchantProfileCountChanged: postProfiles !== preProfiles,
    dataModified: rowsUpdated > 0,
    productionTouched: false,
  };
}

export async function runPack40p4MerchantBackfillWrite(
  prisma: PrismaLike = getPrisma(),
): Promise<Pack40p4WriteSummary> {
  const preAudit = await prisma.vionaRequestAuditEvent.count();
  const preProfiles = await prisma.merchantProfile.count();
  const preScope = await countScopeKinds(prisma);

  if (preScope.total > ROW_BOUNDARY) {
    failWrite('size-gate', `totalRequests=${preScope.total} exceeds boundary ${ROW_BOUNDARY}`);
  }

  const preRecomputed = await reconstructMerchantBackfillCandidates(prisma);

  if (
    preRecomputed.candidates.length === APPROVED_CANDIDATE_COUNT &&
    preRecomputed.digest === APPROVED_CANDIDATE_DIGEST &&
    preRecomputed.blockedReasons.length === 0
  ) {
    const txResult = await executeMerchantBackfillTransaction(prisma, preRecomputed.candidates);
    return buildWriteSummary(
      prisma,
      preScope,
      preAudit,
      preProfiles,
      preRecomputed,
      txResult.rowsUpdated,
      txResult.alreadyApplied,
    );
  }

  if (preRecomputed.candidates.length === 0) {
    const appliedRecomputed = await reconstructMerchantBackfillCandidates(
      prisma,
      VionaRequestScopeKind.merchant,
    );
    validateApprovedPopulation(
      appliedRecomputed.candidates,
      appliedRecomputed.digest,
      appliedRecomputed.blockedReasons,
    );
    return buildWriteSummary(
      prisma,
      preScope,
      preAudit,
      preProfiles,
      appliedRecomputed,
      0,
      true,
    );
  }

  validateApprovedPopulation(
    preRecomputed.candidates,
    preRecomputed.digest,
    preRecomputed.blockedReasons,
  );
  failWrite('candidate-set-drift', 'unreachable');
}

async function main(): Promise<void> {
  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  log('start', 'exact-population merchant backfill write (Pack40P4W)');

  try {
    const summary = await runPack40p4MerchantBackfillWrite();
    log('complete', 'sanitized write summary follows');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error: unknown) {
    if (error instanceof Pack40p4WriteBlockedError) {
      process.exit(1);
    }
    throw error;
  }
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('apply-viona-pack40p4-merchant-backfill.ts') ||
    process.argv[1].endsWith('apply-viona-pack40p4-merchant-backfill.js'));

if (isDirectExecution) {
  main()
    .catch((error: unknown) => {
      console.error(
        '[pack40p4-write] FATAL',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    })
    .finally(async () => {
      await disconnectPrisma();
    });
}
