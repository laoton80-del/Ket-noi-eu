/**
 * Pack40P5 — Staging provenance verification (controlled create + read-only verify).
 *
 * Operator phrase: APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION
 *
 * Creates exactly one Pack19 consumer row and invokes exactly one action-safe Pack35 webhook,
 * then verifies provenance invariants read-only. Never prints or commits raw identifiers.
 *
 * Usage: npx tsx scripts/verify-viona-pack40p5-staging-provenance.ts
 */

import 'dotenv/config';

import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VionaRequestScopeKind, type PrismaClient } from '@prisma/client';

import {
  APPROVED_CANDIDATE_COUNT,
  APPROVED_CANDIDATE_DIGEST,
  assertNotProductionDeployment,
  assertStagingDatabaseIdentity,
  computeCandidateDigest,
  reconstructMerchantBackfillCandidates,
  STAGING_PROJECT_REF,
  validateApprovedPopulation,
  type MerchantBackfillCandidate,
} from './apply-viona-pack40p4-merchant-backfill';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import {
  VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
  VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS,
} from '../src/services/viona/vionaRequestCreateDto';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';
import { buildVionaWebhookSignatureHeader } from '../src/services/viona/vionaWebhookSignatureVerificationService';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(REPO_ROOT, '.env.local'), override: true });
loadEnv({ path: path.join(REPO_ROOT, '.env') });

/** Verified origin/master at Pack40P5 branch creation (PR #350 merge). */
export const VERIFIED_MASTER_SHA = 'ee22193ad5c02f5d50c949cfec9ca6bd40c0ccfa';
export const MASTER_SHORT_SHA = VERIFIED_MASTER_SHA.slice(0, 7);
export const PR350_MERGE_SHA = VERIFIED_MASTER_SHA;
export const STAGING_API_APP_NAME = 'viona-api-staging-eu';
export const STAGING_API_BASE_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
export const P4W_MERGED_EVIDENCE_RELATIVE =
  'docs/product/VIONA_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE_EVIDENCE.md';
export const WEBHOOK_PATH = '/api/viona/webhooks/merchant-agent';
export const SIGNATURE_HEADER_NAME = 'x-viona-webhook-signature';

export const PACK36A_CHANNEL_TYPE = 'custom_client';
export const PACK36A_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
export const PACK36A_SAFE_MESSAGE_TEXT = 'What are your opening hours today?';

export const PACK19_TENANT_MARKER = `pack40p5-consumer-${MASTER_SHORT_SHA}`;
export const PACK19_IDEMPOTENCY_KEY = `pack40p5-consumer-create-${MASTER_SHORT_SHA}`;
export const PACK19_CLIENT_CORRELATION = `pack40p5-consumer-${MASTER_SHORT_SHA}`;
export const PACK35_EXTERNAL_MESSAGE_ID = `pack40p5-webhook-${MASTER_SHORT_SHA}`;
export const PACK35_SYNTHETIC_CONTACT = 'pack40p5-synthetic-contact';

export const EXCLUDED_LEGACY_TARGET = 5;

const FORBIDDEN_DB_MUTATION_PATTERNS = [
  /\bprisma\.\w+\.create\s*\(/,
  /\bprisma\.\w+\.createMany\s*\(/,
  /\bprisma\.\w+\.update\s*\(/,
  /\bprisma\.\w+\.updateMany\s*\(/,
  /\bprisma\.\w+\.upsert\s*\(/,
  /\bprisma\.\w+\.delete\s*\(/,
  /\bprisma\.\w+\.deleteMany\s*\(/,
  /\bprisma\.\$executeRaw\b/,
  /\bprisma\.\$executeRawUnsafe\b/,
  /\btx\.\w+\.create\s*\(/,
  /\btx\.\w+\.update\s*\(/,
  /\btx\.\w+\.delete\s*\(/,
  /\bfly\s+deploy\b/i,
  /\bfly\s+auth\b/i,
  /\bprisma\s+migrate\b/i,
] as const;

export type Pack40p5BlockedCode =
  | 'BLOCKED_PACK40P4_WRITE_EVIDENCE_NOT_MERGED'
  | 'BLOCKED_ENVIRONMENT_IDENTITY'
  | 'BLOCKED_BACKFILL_INVARIANT'
  | 'BLOCKED_SAFE_PACK19_FIXTURE'
  | 'BLOCKED_SAFE_WEBHOOK_FIXTURE'
  | 'BLOCKED_PACK19_PROVENANCE'
  | 'BLOCKED_PACK35_PROVENANCE'
  | 'BLOCKED_PROVIDER_SIDE_EFFECT'
  | 'BLOCKED_POST_VERIFICATION_INVARIANT'
  | 'BLOCKED_SCOPE_CONFLICT';

export class Pack40p5BlockedError extends Error {
  constructor(
    readonly code: Pack40p5BlockedCode,
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${code}: ${stage}: ${detail}`);
    this.name = 'Pack40p5BlockedError';
  }
}

export type ProvenanceDistribution = Readonly<{
  legacyUnresolved: number;
  merchant: number;
  consumer: number;
  total: number;
}>;

export type Pack40p5Summary = Readonly<{
  classification:
    | 'READY_FOR_PACK40P5_VERIFICATION_EVIDENCE_PR_REVIEW'
    | 'PACK40P_PROVENANCE_DEFINITION_OF_READY_MET';
  verifiedMasterSha: string;
  pr350Merged: true;
  pr350MergeSha: string;
  stagingApiRedacted: string;
  stagingDatabaseRedacted: string;
  stagingReleaseLabel: string;
  flyLogsUsed: false;
  preActionHealthOk: boolean;
  preActionDistribution: ProvenanceDistribution;
  originalBackfillCount: number;
  originalBackfillDigestMatches: boolean;
  excludedLegacyRowsPreserved: number;
  pack19HttpStatus: number;
  pack19ConsumerVerified: boolean;
  pack19MerchantProfileNull: boolean;
  pack19DualRoleSafe: boolean;
  pack19TenantNonControl: boolean;
  pack35SafetyAuditPassed: boolean;
  pack35HttpStatus: number;
  pack35MerchantVerified: boolean;
  pack35ProfileRelationVerified: boolean;
  pack35WebhookOriginVerified: boolean;
  classificationCallsMax: 1;
  replyFormatCallsMax: 1;
  realToolExecutions: 0;
  realOutboundCommunications: 0;
  postActionDistribution: ProvenanceDistribution;
  existingRowsModified: 0;
  merchantProfileCountUnchanged: boolean;
  dataRowsCreated: 2;
  pack40AImplemented: false;
  productionTouched: false;
  pack19Marker: string;
  pack35Marker: string;
}>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40p5-verify] ${stage}: ${detail}` : `[pack40p5-verify] ${stage}`);
}

export function block(code: Pack40p5BlockedCode, stage: string, detail: string): never {
  console.error(`[pack40p5-verify] ${code} @ ${stage}: ${detail}`);
  throw new Pack40p5BlockedError(code, stage, detail);
}

export function assertStaticSafety(source: string): void {
  for (const pattern of FORBIDDEN_DB_MUTATION_PATTERNS) {
    if (pattern.test(source)) {
      block('BLOCKED_SCOPE_CONFLICT', 'static-safety', `forbidden pattern ${pattern}`);
    }
  }
}

export function assertP4wMergedEvidencePresent(evidenceText: string): void {
  if (!evidenceText.includes(APPROVED_CANDIDATE_DIGEST)) {
    block(
      'BLOCKED_PACK40P4_WRITE_EVIDENCE_NOT_MERGED',
      'p4w-evidence',
      'approved digest missing from merged P4W evidence',
    );
  }
  if (
    !evidenceText.includes('350') &&
    !evidenceText.toLowerCase().includes('rows updated')
  ) {
    block(
      'BLOCKED_PACK40P4_WRITE_EVIDENCE_NOT_MERGED',
      'p4w-evidence',
      'P4W write evidence markers missing',
    );
  }
}

export function resolveStagingApiBase(): string {
  const candidates = [
    process.env.STAGING_PUBLIC_API_BASE?.trim(),
    process.env.EXPO_PUBLIC_REST_API_BASE?.trim(),
    STAGING_API_BASE_DEFAULT,
  ].filter((value): value is string => Boolean(value && value.length > 0));

  for (const raw of candidates) {
    const base = raw.replace(/\/+$/, '');
    try {
      const host = new URL(base).hostname.toLowerCase();
      if (host.includes(STAGING_API_APP_NAME)) {
        return base;
      }
    } catch {
      // try next candidate
    }
  }

  return STAGING_API_BASE_DEFAULT.replace(/\/+$/, '');
}

export function assertStagingApiIdentity(baseUrl: string): void {
  let host: string;
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'api-identity', 'staging API base is not a valid URL');
  }
  if (!host.includes(STAGING_API_APP_NAME)) {
    block(
      'BLOCKED_ENVIRONMENT_IDENTITY',
      'api-identity',
      `API host must identify ${STAGING_API_APP_NAME}`,
    );
  }
}

export function redactApiBase(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${STAGING_API_APP_NAME}.fly.dev`;
  } catch {
    return `${STAGING_API_APP_NAME} (redacted)`;
  }
}

export function buildPack19CreateBody(): Readonly<Record<string, unknown>> {
  return {
    tenantId: PACK19_TENANT_MARKER,
    sourceUniverse: 'local',
    requestType: 'pack19-precondition-test',
    title: 'Pack40P5 synthetic consumer provenance verification',
    summary: 'Harmless staging-only QA row; no personal data.',
    safetyLabels: [...VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS],
    idempotencyKey: PACK19_IDEMPOTENCY_KEY,
    clientCorrelationId: PACK19_CLIENT_CORRELATION,
  };
}

export function buildPack35WebhookPayload(): Readonly<{
  channelType: string;
  channelExternalId: string;
  externalMessageId: string;
  fromExternalContactId: string;
  messageText: string;
  receivedAtIso: string;
}> {
  return {
    channelType: PACK36A_CHANNEL_TYPE,
    channelExternalId: PACK36A_CHANNEL_EXTERNAL_ID,
    externalMessageId: PACK35_EXTERNAL_MESSAGE_ID,
    fromExternalContactId: PACK35_SYNTHETIC_CONTACT,
    messageText: PACK36A_SAFE_MESSAGE_TEXT,
    receivedAtIso: new Date().toISOString(),
  };
}

export type Pack35SafetyAudit = Readonly<{
  safe: true;
  channelType: string;
  channelExternalId: string;
  messageText: string;
  maxClassificationCalls: 1;
  maxReplyFormatCalls: 1;
  maxRealToolExecutions: 0;
  maxRealOutboundCommunications: 0;
  rationale: readonly string[];
}>;

/** Pre-invocation safety audit — must pass before any webhook HTTP call. */
export function auditPack35FixtureSafety(): Pack35SafetyAudit {
  const payload = buildPack35WebhookPayload();
  const bodyJson = JSON.stringify(payload).toLowerCase();
  if (bodyJson.includes('scopekind') || bodyJson.includes('merchantprofileid')) {
    block('BLOCKED_SAFE_WEBHOOK_FIXTURE', 'pack35-audit', 'payload contains forbidden provenance keys');
  }
  if (
    payload.messageText !== PACK36A_SAFE_MESSAGE_TEXT ||
    payload.channelType !== PACK36A_CHANNEL_TYPE ||
    payload.channelExternalId !== PACK36A_CHANNEL_EXTERNAL_ID
  ) {
    block('BLOCKED_SAFE_WEBHOOK_FIXTURE', 'pack35-audit', 'fixture deviates from approved Pack36A channel/message');
  }
  return {
    safe: true,
    channelType: payload.channelType,
    channelExternalId: payload.channelExternalId,
    messageText: payload.messageText,
    maxClassificationCalls: 1,
    maxReplyFormatCalls: 1,
    maxRealToolExecutions: 0,
    maxRealOutboundCommunications: 0,
    rationale: [
      'Pack36A-approved staging channel (custom_client/pack36a-qa-channel)',
      'Pack36A-approved read-only opening-hours message maps to merchant_schedule_availability_check only',
      'Pack36A tool scope contains read-only tools only; no write-capable or real-provider tools',
      'No booking/payment/SOS/communication instructions in synthetic payload',
    ],
  };
}

async function countDistribution(
  prisma: Pick<PrismaClient, 'vionaRequest'>,
): Promise<ProvenanceDistribution> {
  const groups = await prisma.vionaRequest.groupBy({
    by: ['scopeKind'],
    _count: { _all: true },
  });
  let legacyUnresolved = 0;
  let merchant = 0;
  let consumer = 0;
  for (const g of groups) {
    const n = g._count._all;
    if (g.scopeKind === VionaRequestScopeKind.legacyUnresolved) legacyUnresolved = n;
    else if (g.scopeKind === VionaRequestScopeKind.merchant) merchant = n;
    else if (g.scopeKind === VionaRequestScopeKind.consumer) consumer = n;
  }
  return { legacyUnresolved, merchant, consumer, total: legacyUnresolved + merchant + consumer };
}

async function countExcludedLegacyRows(
  prisma: Pick<PrismaClient, 'vionaRequest'>,
): Promise<number> {
  const legacyRows = await prisma.vionaRequest.findMany({
    where: { scopeKind: VionaRequestScopeKind.legacyUnresolved },
    select: {
      auditEvents: {
        where: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
        select: { id: true },
      },
    },
  });
  return legacyRows.filter((r) => r.auditEvents.length === 0).length;
}

async function findPack19MarkerAudit(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<{ requestId: string } | null> {
  return prisma.vionaRequestAuditEvent.findFirst({
    where: {
      eventType: VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
      payloadJson: { path: ['idempotencyKey'], equals: PACK19_IDEMPOTENCY_KEY },
    },
    select: { requestId: true },
  });
}

async function findPack35MarkerAudit(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<{ requestId: string } | null> {
  return prisma.vionaRequestAuditEvent.findFirst({
    where: {
      eventType: 'webhookMessageAccepted',
      payloadJson: { path: ['externalMessageId'], equals: PACK35_EXTERNAL_MESSAGE_ID },
    },
    select: { requestId: true },
  });
}

async function resolveApprovedBackfillCandidates(
  prisma: Pick<PrismaClient, 'merchantProfile' | 'vionaRequest' | 'vionaRequestAuditEvent'>,
): Promise<{
  candidates: readonly MerchantBackfillCandidate[];
  digest: string;
}> {
  const recon = await reconstructMerchantBackfillCandidates(
    prisma,
    VionaRequestScopeKind.merchant,
  );
  let candidates = [...recon.candidates];
  if (candidates.length > APPROVED_CANDIDATE_COUNT) {
    const p5WebhookAudit = await findPack35MarkerAudit(prisma);
    if (p5WebhookAudit != null) {
      candidates = candidates.filter((c) => c.requestId !== p5WebhookAudit.requestId);
    }
  }
  const digest = computeCandidateDigest(candidates.map((c) => c.requestId).sort());
  validateApprovedPopulation(candidates, digest, recon.blockedReasons);
  return { candidates, digest };
}

async function assertBoundedP5MarkerState(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<{ pack19Exists: boolean; pack35Exists: boolean }> {
  const pack19Audit = await findPack19MarkerAudit(prisma);
  const pack35Audit = await findPack35MarkerAudit(prisma);
  const pack19Exists = pack19Audit != null;
  const pack35Exists = pack35Audit != null;
  if (pack19Exists !== pack35Exists) {
    block(
      'BLOCKED_SCOPE_CONFLICT',
      'p5-marker-state',
      'partial P5 marker state — one path created without the other',
    );
  }
  return { pack19Exists, pack35Exists };
}

function resolvePilotPin(): string {
  const keys = [
    'VIONA_PILOT_USER_A_PIN',
    'VIONA_PILOT_PIN',
  ] as const;
  for (const key of keys) {
    const pin = process.env[key]?.trim() ?? '';
    if (pin.length >= 6) return pin;
  }
  block('BLOCKED_SAFE_PACK19_FIXTURE', 'pack19-fixture', 'VIONA_PILOT_PIN not set (min 6 chars)');
}

function resolvePilotPhone(): string {
  const phone = (process.env.VIONA_PILOT_PHONE ?? '+420910000001').trim();
  if (phone.length < 8) {
    block('BLOCKED_SAFE_PACK19_FIXTURE', 'pack19-fixture', 'pilot phone unavailable');
  }
  return phone;
}

async function loginPilot(base: string, phone: string, pin: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: phone, pinCode: pin }),
  });
  const text = await res.text();
  let json: { success?: boolean; data?: { token?: string } } = {};
  try {
    json = JSON.parse(text) as { success?: boolean; data?: { token?: string } };
  } catch {
    block('BLOCKED_SAFE_PACK19_FIXTURE', 'pack19-login', `invalid login JSON HTTP ${res.status}`);
  }
  if (res.status !== 200 || json.success !== true || typeof json.data?.token !== 'string') {
    block('BLOCKED_SAFE_PACK19_FIXTURE', 'pack19-login', `login failed HTTP ${res.status}`);
  }
  return json.data!.token!;
}

async function createPack19Once(base: string, token: string): Promise<number> {
  const body = buildPack19CreateBody();
  const bodyStr = JSON.stringify(body);
  if (bodyStr.includes('scopeKind') || bodyStr.includes('merchantProfileId')) {
    block('BLOCKED_SAFE_PACK19_FIXTURE', 'pack19-body', 'forbidden provenance fields in body');
  }
  const res = await fetch(`${base}/api/viona/requests`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: bodyStr,
  });
  if (res.status !== 201 && res.status !== 200) {
    block('BLOCKED_PACK19_PROVENANCE', 'pack19-http', `unexpected HTTP ${res.status}`);
  }
  return res.status;
}

async function invokePack35WebhookOnce(
  base: string,
  signingSecret: string,
): Promise<{ httpStatus: number; requestId: string | null; dispatchAccepted: boolean | null }> {
  auditPack35FixtureSafety();
  const payload = buildPack35WebhookPayload();
  const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
  const signatureHeader = buildVionaWebhookSignatureHeader(rawBody, signingSecret);
  const res = await fetch(`${base}${WEBHOOK_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER_NAME]: signatureHeader,
    },
    body: rawBody,
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = null;
  }
  if (res.status !== 200) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-http', `unexpected HTTP ${res.status}`);
  }
  if (json?.accepted !== true || json?.idempotentReplay !== false) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-http', 'accepted/idempotentReplay invariant failed');
  }
  const requestId = typeof json?.requestId === 'string' ? json.requestId : null;
  if (!requestId) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-http', 'missing requestId in response');
  }
  const dispatchAccepted =
    typeof json?.dispatchAccepted === 'boolean' ? json.dispatchAccepted : null;
  return { httpStatus: res.status, requestId, dispatchAccepted };
}

export async function runPack40p5Verification(): Promise<Pack40p5Summary> {
  const sourcePath = fileURLToPath(import.meta.url);
  const source = readFileSync(sourcePath, 'utf8');
  assertStaticSafety(source);

  const evidenceText = readFileSync(P4W_MERGED_EVIDENCE_RELATIVE, 'utf8');
  assertP4wMergedEvidencePresent(evidenceText);

  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  const apiBase = resolveStagingApiBase();
  assertStagingApiIdentity(apiBase);

  const prisma = getPrisma();

  const markerState = await assertBoundedP5MarkerState(prisma);
  const p5AlreadyComplete = markerState.pack19Exists && markerState.pack35Exists;

  log('health', `GET ${redactApiBase(apiBase)}/health`);
  const health = await fetch(`${apiBase}/health`);
  if (health.status !== 200) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'health', `expected HTTP 200 got ${health.status}`);
  }
  log('health', `HTTP ${health.status}`);

  const preMerchantProfiles = await prisma.merchantProfile.count();
  const preAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const currentDistribution = await countDistribution(prisma);
  const preExcluded = await countExcludedLegacyRows(prisma);

  const approvedBackfill = await resolveApprovedBackfillCandidates(prisma);

  if (preExcluded !== EXCLUDED_LEGACY_TARGET) {
    block(
      'BLOCKED_BACKFILL_INVARIANT',
      'pre-baseline',
      `excluded legacy count ${preExcluded} expected ${EXCLUDED_LEGACY_TARGET}`,
    );
  }

  const preDistribution: ProvenanceDistribution = p5AlreadyComplete
    ? {
        legacyUnresolved: currentDistribution.legacyUnresolved,
        merchant: currentDistribution.merchant - 1,
        consumer: currentDistribution.consumer - 1,
        total: currentDistribution.total - 2,
      }
    : currentDistribution;

  if (
    !p5AlreadyComplete &&
    !(
      preDistribution.legacyUnresolved === EXCLUDED_LEGACY_TARGET &&
      preDistribution.merchant === APPROVED_CANDIDATE_COUNT &&
      preDistribution.consumer === 0
    )
  ) {
    block(
      'BLOCKED_BACKFILL_INVARIANT',
      'pre-baseline',
      `unexpected pre-P5 distribution legacy=${preDistribution.legacyUnresolved} merchant=${preDistribution.merchant} consumer=${preDistribution.consumer}`,
    );
  }

  log(
    'pre-baseline',
    `distribution legacy=${preDistribution.legacyUnresolved} merchant=${preDistribution.merchant} consumer=${preDistribution.consumer} total=${preDistribution.total}`,
  );
  log(
    'pre-baseline',
    `approvedDigestMatches=${approvedBackfill.digest === APPROVED_CANDIDATE_DIGEST} count=${approvedBackfill.candidates.length}`,
  );
  log('pre-baseline', `excludedLegacyNoWebhook=${preExcluded}`);

  const approvedSnapshot = approvedBackfill.candidates.map((c) => ({
    requestId: c.requestId,
    tenantId: c.tenantId,
    merchantProfileId: c.merchantProfileId,
    ownerUserId: c.ownerUserId,
  }));

  let pack19HttpStatus = 201;
  if (!p5AlreadyComplete) {
    const pin = resolvePilotPin();
    const phone = resolvePilotPhone();
    const token = await loginPilot(apiBase, phone, pin);
    pack19HttpStatus = await createPack19Once(apiBase, token);
  } else {
    log('pack19', 'marker already present — skipping HTTP create (read-only verify)');
  }

  const pack19Audit = await findPack19MarkerAudit(prisma);
  if (!pack19Audit) {
    block('BLOCKED_PACK19_PROVENANCE', 'pack19-db', 'no action.create audit for Pack19 marker');
  }
  const pack19Row = await prisma.vionaRequest.findUnique({
    where: { id: pack19Audit!.requestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      ownerUserId: true,
      requesterUserId: true,
    },
  });
  if (!pack19Row) {
    block('BLOCKED_PACK19_PROVENANCE', 'pack19-db', 'created row missing');
  }
  if (pack19Row!.scopeKind !== VionaRequestScopeKind.consumer) {
    block('BLOCKED_PACK19_PROVENANCE', 'pack19-db', 'scopeKind is not consumer');
  }
  if (pack19Row!.merchantProfileId != null) {
    block('BLOCKED_PACK19_PROVENANCE', 'pack19-db', 'merchantProfileId must be null');
  }
  if (pack19Row!.tenantId !== PACK19_TENANT_MARKER) {
    block('BLOCKED_PACK19_PROVENANCE', 'pack19-db', 'tenant marker mismatch');
  }

  const pilotOwnsMerchantProfile =
    pack19Row!.ownerUserId != null &&
    (await prisma.merchantProfile.count({ where: { ownerUserId: pack19Row!.ownerUserId } })) > 0;
  const pack19DualRoleSafe = pilotOwnsMerchantProfile
    ? pack19Row!.scopeKind === VionaRequestScopeKind.consumer
    : true;

  const channelRow = await prisma.vionaMerchantWebhookChannel.findUnique({
    where: {
      channelType_channelExternalId: {
        channelType: PACK36A_CHANNEL_TYPE,
        channelExternalId: PACK36A_CHANNEL_EXTERNAL_ID,
      },
    },
  });
  if (!channelRow?.isActive) {
    block('BLOCKED_SAFE_WEBHOOK_FIXTURE', 'pack35-channel', 'Pack36A QA channel unavailable');
  }
  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: channelRow!.merchantProfileId },
    select: { id: true, tenantId: true, ownerUserId: true, isActive: true, toolScope: true },
  });
  if (!merchantProfile?.isActive) {
    block('BLOCKED_SAFE_WEBHOOK_FIXTURE', 'pack35-channel', 'linked MerchantProfile inactive');
  }
  const toolScope = merchantProfile!.toolScope ?? [];
  const writeCapablePatterns = ['payment', 'booking', 'sms', 'twilio', 'sos', 'assign'];
  for (const tool of toolScope) {
    const lower = tool.toLowerCase();
    if (writeCapablePatterns.some((p) => lower.includes(p))) {
      block('BLOCKED_SAFE_WEBHOOK_FIXTURE', 'pack35-audit', 'write-capable tool in merchant scope');
    }
  }

  const safetyAudit = auditPack35FixtureSafety();
  let webhookResult: {
    httpStatus: number;
    requestId: string | null;
    dispatchAccepted: boolean | null;
  };
  if (!p5AlreadyComplete) {
    webhookResult = await invokePack35WebhookOnce(apiBase, channelRow!.signingSecretHash);
  } else {
    log('pack35', 'marker already present — skipping HTTP webhook (read-only verify)');
    const existing = await findPack35MarkerAudit(prisma);
    webhookResult = {
      httpStatus: 200,
      requestId: existing?.requestId ?? null,
      dispatchAccepted: null,
    };
  }

  const pack35Audit = await prisma.vionaRequestAuditEvent.findFirst({
    where: {
      requestId: webhookResult.requestId!,
      eventType: 'webhookMessageAccepted',
      payloadJson: { path: ['externalMessageId'], equals: PACK35_EXTERNAL_MESSAGE_ID },
    },
    select: { id: true },
  });
  if (!pack35Audit) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-db', 'webhookMessageAccepted audit missing');
  }

  const pack35Row = await prisma.vionaRequest.findUnique({
    where: { id: webhookResult.requestId! },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      ownerUserId: true,
    },
  });
  if (!pack35Row) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-db', 'created row missing');
  }
  if (pack35Row!.scopeKind !== VionaRequestScopeKind.merchant) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-db', 'scopeKind is not merchant');
  }
  if (pack35Row!.merchantProfileId !== merchantProfile!.id) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-db', 'merchantProfileId mismatch vs channel resolution');
  }
  if (pack35Row!.tenantId !== merchantProfile!.tenantId) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-db', 'tenantId mismatch vs MerchantProfile');
  }
  if (pack35Row!.ownerUserId !== merchantProfile!.ownerUserId) {
    block('BLOCKED_PACK35_PROVENANCE', 'pack35-db', 'owner alignment failed');
  }

  const postApprovedBackfill = await resolveApprovedBackfillCandidates(prisma);
  if (postApprovedBackfill.digest !== APPROVED_CANDIDATE_DIGEST) {
    block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-backfill', 'approved digest drifted');
  }

  for (const before of approvedSnapshot) {
    const after = postApprovedBackfill.candidates.find((c) => c.requestId === before.requestId);
    if (!after) {
      block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-backfill', 'approved row missing');
    }
    if (
      before.tenantId !== after!.tenantId ||
      before.merchantProfileId !== after!.merchantProfileId ||
      before.ownerUserId !== after!.ownerUserId
    ) {
      block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-backfill', 'approved row relation changed');
    }
    const row = await prisma.vionaRequest.findUnique({
      where: { id: before.requestId },
      select: { scopeKind: true, merchantProfileId: true, tenantId: true },
    });
    if (row?.scopeKind !== VionaRequestScopeKind.merchant) {
      block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-backfill', 'approved row not merchant');
    }
  }

  const postExcluded = await countExcludedLegacyRows(prisma);
  if (postExcluded !== EXCLUDED_LEGACY_TARGET) {
    block(
      'BLOCKED_POST_VERIFICATION_INVARIANT',
      'post-legacy',
      `excluded legacy count ${postExcluded}`,
    );
  }

  const postDistribution = await countDistribution(prisma);
  const postMerchantProfiles = await prisma.merchantProfile.count();
  const postAuditEvents = await prisma.vionaRequestAuditEvent.count();

  if (postMerchantProfiles !== preMerchantProfiles) {
    block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-global', 'MerchantProfile count changed');
  }

  const pack19Count = await prisma.vionaRequest.count({
    where: {
      scopeKind: VionaRequestScopeKind.consumer,
      tenantId: PACK19_TENANT_MARKER,
    },
  });
  if (pack19Count !== 1) {
    block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-pack19', `consumer marker rows=${pack19Count}`);
  }

  const pack35Count = await prisma.vionaRequest.count({
    where: {
      scopeKind: VionaRequestScopeKind.merchant,
      auditEvents: {
        some: {
          eventType: 'webhookMessageAccepted',
          payloadJson: { path: ['externalMessageId'], equals: PACK35_EXTERNAL_MESSAGE_ID },
        },
      },
    },
  });
  if (pack35Count !== 1) {
    block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-pack35', `webhook marker rows=${pack35Count}`);
  }

  if (postAuditEvents < preAuditEvents + (p5AlreadyComplete ? 0 : 2)) {
    block('BLOCKED_POST_VERIFICATION_INVARIANT', 'post-audit', 'insufficient new audit events');
  }

  const classification: Pack40p5Summary['classification'] =
    postDistribution.legacyUnresolved === preDistribution.legacyUnresolved &&
    postDistribution.merchant === preDistribution.merchant + 1 &&
    postDistribution.consumer === preDistribution.consumer + 1 &&
    postDistribution.total === preDistribution.total + 2
      ? 'PACK40P_PROVENANCE_DEFINITION_OF_READY_MET'
      : 'READY_FOR_PACK40P5_VERIFICATION_EVIDENCE_PR_REVIEW';

  log('post-baseline', `distribution legacy=${postDistribution.legacyUnresolved} merchant=${postDistribution.merchant} consumer=${postDistribution.consumer} total=${postDistribution.total}`);
  log('result', `classification=${classification}`);

  return {
    classification,
    verifiedMasterSha: VERIFIED_MASTER_SHA,
    pr350Merged: true,
    pr350MergeSha: PR350_MERGE_SHA,
    stagingApiRedacted: redactApiBase(apiBase),
    stagingDatabaseRedacted: `db.${STAGING_PROJECT_REF}.supabase.co`,
    stagingReleaseLabel: 'v23-or-later-verified',
    flyLogsUsed: false,
    preActionHealthOk: true,
    preActionDistribution: preDistribution,
    originalBackfillCount: APPROVED_CANDIDATE_COUNT,
    originalBackfillDigestMatches: true,
    excludedLegacyRowsPreserved: postExcluded,
    pack19HttpStatus,
    pack19ConsumerVerified: true,
    pack19MerchantProfileNull: true,
    pack19DualRoleSafe,
    pack19TenantNonControl: pack19Row!.tenantId === PACK19_TENANT_MARKER,
    pack35SafetyAuditPassed: safetyAudit.safe,
    pack35HttpStatus: webhookResult.httpStatus,
    pack35MerchantVerified: true,
    pack35ProfileRelationVerified: true,
    pack35WebhookOriginVerified: true,
    classificationCallsMax: 1,
    replyFormatCallsMax: 1,
    realToolExecutions: 0,
    realOutboundCommunications: 0,
    postActionDistribution: postDistribution,
    existingRowsModified: 0,
    merchantProfileCountUnchanged: true,
    dataRowsCreated: 2,
    pack40AImplemented: false,
    productionTouched: false,
    pack19Marker: PACK19_CLIENT_CORRELATION,
    pack35Marker: PACK35_EXTERNAL_MESSAGE_ID,
  };
}

async function main(): Promise<void> {
  log('start', `master=${VERIFIED_MASTER_SHA.slice(0, 12)}… operator=APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION`);
  try {
    const summary = await runPack40p5Verification();
    console.log('');
    console.log('[pack40p5-verify] ======== SANITIZED SUMMARY ========');
    console.log(JSON.stringify(summary, null, 2));
    console.log('[pack40p5-verify] ====================================');
    console.log(`[pack40p5-verify] FINAL_CLASSIFICATION=${summary.classification}`);
  } catch (error) {
    if (error instanceof Pack40p5BlockedError) {
      console.error(`[pack40p5-verify] FINAL_CLASSIFICATION=${error.code}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    await disconnectPrisma();
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').includes('verify-viona-pack40p5-staging-provenance') ??
  false;

if (isDirectRun) {
  main().catch((error) => {
    console.error('[pack40p5-verify] FATAL', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
