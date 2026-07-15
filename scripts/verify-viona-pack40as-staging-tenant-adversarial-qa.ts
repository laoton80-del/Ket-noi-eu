/**
 * Pack40AS — Staging tenant adversarial read QA (GET-only list/detail).
 *
 * Operator phrase: APPROVE_PACK40AS_STAGING_TENANT_ADVERSARIAL_QA
 *
 * Never prints or commits raw identifiers, credentials, or tokens.
 *
 * Usage: npx tsx scripts/verify-viona-pack40as-staging-tenant-adversarial-qa.ts
 */

import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { VionaRequestScopeKind, type PrismaClient } from '@prisma/client';

import {
  APPROVED_CANDIDATE_DIGEST,
  assertNotProductionDeployment,
  assertStagingDatabaseIdentity,
  computeCandidateDigest,
  reconstructMerchantBackfillCandidates,
  validateApprovedPopulation,
  STAGING_PROJECT_REF,
  type MerchantBackfillCandidate,
} from './apply-viona-pack40p4-merchant-backfill';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import {
  VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
} from '../src/services/viona/vionaRequestCreateDto';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(REPO_ROOT, '.env.local'), override: true });
loadEnv({ path: path.join(REPO_ROOT, '.env') });

export const VERIFIED_MASTER_SHA = '3d96f83167626aa445ed0063427f7857eb5f5e4b';
export const PR353_MERGE_SHA = VERIFIED_MASTER_SHA;
export const PACK40AD_EVIDENCE_RELATIVE =
  'docs/product/VIONA_PACK40AD_STAGING_READ_ENFORCEMENT_DEPLOYMENT_EVIDENCE.md';
export const STAGING_API_APP_NAME = 'viona-api-staging-eu';
export const STAGING_API_BASE_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
export const MIN_STAGING_RELEASE = 24;

export const PACK19_TENANT_MARKER = 'pack40p5-consumer-ee22193';
export const PACK19_IDEMPOTENCY_KEY = 'pack40p5-consumer-create-ee22193';
export const PACK35_EXTERNAL_MESSAGE_ID = 'pack40p5-webhook-ee22193';
export const PACK36A_CHANNEL_TYPE = 'custom_client';
export const PACK36A_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
export const EXCLUDED_LEGACY_TARGET = 5;

export const MAX_AUTHENTICATED_GET = 30;
export const MAX_UNAUTH_GET = 5;

const FORBIDDEN_PATTERNS = [
  /\bprisma\.\w+\.create\s*\(/,
  /\bprisma\.\w+\.update\s*\(/,
  /\bprisma\.\w+\.updateMany\s*\(/,
  /\bprisma\.\w+\.upsert\s*\(/,
  /\bprisma\.\w+\.delete\s*\(/,
  /\bprisma\.\w+\.deleteMany\s*\(/,
  /\bprisma\.\$executeRaw\b/,
  /\bfly\s+deploy\b/i,
  /\bfly\s+auth\b/i,
  /\bprisma\s+migrate\b/i,
  /method:\s*['"]POST['"][\s\S]{0,120}\/api\/viona\/requests['"]/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]DELETE['"]/,
  /method:\s*['"]PUT['"]/,
] as const;

export type Pack40asBlockedCode =
  | 'BLOCKED_PACK40AD_EVIDENCE_NOT_MERGED'
  | 'BLOCKED_RELEASE_MISMATCH'
  | 'BLOCKED_ENVIRONMENT_IDENTITY'
  | 'BLOCKED_DUAL_ROLE_STAGING_FIXTURE'
  | 'BLOCKED_SAFE_AUTH_FIXTURE'
  | 'BLOCKED_BACKFILL_INVARIANT'
  | 'BLOCKED_AUTHORIZATION_BEHAVIOR'
  | 'BLOCKED_EXISTENCE_LEAK'
  | 'BLOCKED_POST_QA_INVARIANT'
  | 'BLOCKED_SCOPE_CONFLICT';

export class Pack40asBlockedError extends Error {
  constructor(
    readonly code: Pack40asBlockedCode,
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${code}: ${stage}: ${detail}`);
    this.name = 'Pack40asBlockedError';
  }
}

export type ProvenanceDistribution = Readonly<{
  legacyUnresolved: number;
  merchant: number;
  consumer: number;
  total: number;
}>;

export type NormalizedFailure = Readonly<{
  httpStatus: number;
  errorCode: string | null;
  success: boolean;
}>;

export type Pack40asSummary = Readonly<{
  classification: 'READY_FOR_PACK40AS_QA_EVIDENCE_PR_REVIEW' | 'PACK40A_STAGING_ADVERSARIAL_QA_GREEN';
  verifiedMasterSha: string;
  pr353Merged: true;
  pr353MergeSha: string;
  stagingApiRedacted: string;
  stagingDatabaseRedacted: string;
  stagingReleaseLabel: string;
  flyLogsUsed: false;
  dualRoleFixtureVerified: boolean;
  nonOwnerFixtureVerified: boolean;
  preActionHealthOk: boolean;
  preActionDistribution: ProvenanceDistribution;
  p4wDigestMatches: boolean;
  consumerOwnerListPass: boolean;
  consumerOwnerDetailPass: boolean;
  merchantOwnerListPass: boolean;
  merchantOwnerDetailPass: boolean;
  historicalMerchantListPass: boolean;
  historicalMerchantDetailPass: boolean;
  legacyOwnerListDenied: boolean;
  legacyOwnerDetailDenied: boolean;
  nonOwnerConsumerDenied: boolean;
  nonOwnerMerchantDenied: boolean;
  nonOwnerLegacyDenied: boolean;
  clientTenantExpansionDenied: boolean;
  clientProfileExpansionDenied: boolean;
  clientPolicyExpansionDenied: boolean;
  existenceLeakSafe: boolean;
  listDetailConsistent: boolean;
  inactiveMerchantLiveQaExercised: false;
  malformedProvenanceLiveQaExercised: false;
  postRequestCountUnchanged: boolean;
  postAuditCountUnchanged: boolean;
  postProvenanceUnchanged: boolean;
  postP4wDigestUnchanged: boolean;
  dataModified: false;
  pack40BImplemented: false;
  pack40CImplemented: false;
  pack40DImplemented: false;
  productionTouched: false;
  pack19Marker: string;
  pack35Marker: string;
  authenticatedGetCount: number;
  unauthGetCount: number;
}>;

type FixtureBundle = Readonly<{
  consumerRequestId: string;
  merchantRequestId: string;
  historicalRequestId: string;
  legacyRequestId: string;
  dualRoleUserId: string;
  merchantProfileId: string;
  merchantTenantId: string;
  legacyTenantId: string;
  consumerTenantMarker: string;
}>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40as-verify] ${stage}: ${detail}` : `[pack40as-verify] ${stage}`);
}

export function block(code: Pack40asBlockedCode, stage: string, detail: string): never {
  console.error(`[pack40as-verify] ${code} @ ${stage}: ${detail}`);
  throw new Pack40asBlockedError(code, stage, detail);
}

export function assertStaticSafety(source: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      block('BLOCKED_SCOPE_CONFLICT', 'static-safety', `forbidden pattern ${pattern}`);
    }
  }
  if (!source.includes("method: 'GET'") && !source.includes('method: "GET"')) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'GET helper missing');
  }
}

export function assertPack40adMergedEvidence(evidenceText: string): void {
  if (!evidenceText.includes('PACK40A_READ_ENFORCEMENT_DEPLOYED_TO_STAGING')) {
    block(
      'BLOCKED_PACK40AD_EVIDENCE_NOT_MERGED',
      'pack40ad-evidence',
      'deployed marker missing',
    );
  }
  if (!evidenceText.includes('v24') && !evidenceText.includes('v24-or-later')) {
    block('BLOCKED_PACK40AD_EVIDENCE_NOT_MERGED', 'pack40ad-evidence', 'v24 release marker missing');
  }
}

export function assertPack40aSourcePresent(): void {
  const readScopePath = path.join(REPO_ROOT, 'src/services/viona/vionaRequestReadAccessScope.ts');
  const source = readFileSync(readScopePath, 'utf8');
  if (!source.includes('buildAuthorizedVionaRequestReadWhere')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'Pack40A read scope missing on master');
  }
  if (!source.includes('pack40a') && !source.includes('VionaRequestScopeKind')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'Pack40A provenance builder absent');
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
      // try next
    }
  }
  return STAGING_API_BASE_DEFAULT.replace(/\/+$/, '');
}

export function assertStagingApiIdentity(baseUrl: string): void {
  let host: string;
  try {
    host = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'api-identity', 'invalid API URL');
  }
  if (!host.includes(STAGING_API_APP_NAME)) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'api-identity', `host must be ${STAGING_API_APP_NAME}`);
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

export function resolveStagingReleaseVersion(): number {
  try {
    const raw = execSync(`fly releases --app ${STAGING_API_APP_NAME} --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(raw) as { Version?: number; Status?: string }[];
    const versions = parsed
      .filter((r) => r.Status === 'complete' && typeof r.Version === 'number')
      .map((r) => r.Version as number);
    if (versions.length === 0) {
      block('BLOCKED_RELEASE_MISMATCH', 'fly-releases', 'no complete releases');
    }
    const maxVersion = Math.max(...versions);
    if (maxVersion < MIN_STAGING_RELEASE) {
      block(
        'BLOCKED_RELEASE_MISMATCH',
        'fly-releases',
        `release v${maxVersion} < required v${MIN_STAGING_RELEASE}`,
      );
    }
    return maxVersion;
  } catch {
    block('BLOCKED_RELEASE_MISMATCH', 'fly-releases', 'unable to read Fly release version');
  }
}

function resolvePin(envKey: string, fallbackKey: string): string {
  for (const key of [envKey, fallbackKey] as const) {
    const pin = process.env[key]?.trim() ?? '';
    if (pin.length >= 6) return pin;
  }
  block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-pin', `${envKey} not configured`);
}

function resolvePilotAPhone(): string {
  const phone = (process.env.VIONA_PILOT_PHONE ?? '+420910000001').trim();
  if (phone.length < 8) block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-phone-a', 'pilot A unavailable');
  return phone;
}

function resolvePilotBPhone(): string {
  const phone = (process.env.VIONA_PILOT_USER_B_PHONE ?? '+420910000002').trim();
  if (phone.length < 8) block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-phone-b', 'pilot B unavailable');
  return phone;
}

async function resolvePilotCredentialsForUser(
  prisma: Pick<PrismaClient, 'user'>,
  userId: string,
  phoneA: string,
  phoneB: string,
  pinA: string,
  pinB: string,
): Promise<{ phone: string; pin: string }> {
  const userA = await prisma.user.findFirst({
    where: { phoneNumber: phoneA },
    select: { id: true },
  });
  if (userA?.id === userId) return { phone: phoneA, pin: pinA };

  const userB = await prisma.user.findFirst({
    where: { phoneNumber: phoneB },
    select: { id: true },
  });
  if (userB?.id === userId) return { phone: phoneB, pin: pinB };

  block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-map', 'no pilot credential maps to required user');
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
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-login', `invalid login JSON HTTP ${res.status}`);
  }
  if (res.status !== 200 || json.success !== true || typeof json.data?.token !== 'string') {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-login', `login failed HTTP ${res.status}`);
  }
  return json.data!.token!;
}

function isAuthBoundaryDenied(status: number): boolean {
  return status === 401 || status === 429;
}

class RequestBudget {
  private authGets = 0;
  private unauthGets = 0;

  consumeAuth(): void {
    this.authGets += 1;
    if (this.authGets > MAX_AUTHENTICATED_GET) {
      block('BLOCKED_SCOPE_CONFLICT', 'request-budget', 'authenticated GET budget exceeded');
    }
  }

  consumeUnauth(): void {
    this.unauthGets += 1;
    if (this.unauthGets > MAX_UNAUTH_GET) {
      block('BLOCKED_SCOPE_CONFLICT', 'request-budget', 'unauth GET budget exceeded');
    }
  }

  snapshot(): { authenticatedGetCount: number; unauthGetCount: number } {
    return { authenticatedGetCount: this.authGets, unauthGetCount: this.unauthGets };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(
  url: string,
  token: string | null,
  budget: RequestBudget,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; json: Record<string, unknown> | null }> {
  await delay(300);
  if (token) budget.consumeAuth();
  else budget.consumeUnauth();

  const headers: Record<string, string> = { Accept: 'application/json', ...(extraHeaders ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

export function normalizeFailure(
  status: number,
  json: Record<string, unknown> | null,
): NormalizedFailure {
  const success = json?.success === true;
  const errorCode = typeof json?.error === 'string' ? json.error : null;
  return { httpStatus: status, errorCode, success };
}

export function failuresEquivalent(a: NormalizedFailure, b: NormalizedFailure): boolean {
  return a.httpStatus === b.httpStatus && a.errorCode === b.errorCode && a.success === b.success;
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

async function findPack19RequestId(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<string | null> {
  const audit = await prisma.vionaRequestAuditEvent.findFirst({
    where: {
      eventType: VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE,
      payloadJson: { path: ['idempotencyKey'], equals: PACK19_IDEMPOTENCY_KEY },
    },
    select: { requestId: true },
  });
  return audit?.requestId ?? null;
}

async function findPack35RequestId(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<string | null> {
  const audit = await prisma.vionaRequestAuditEvent.findFirst({
    where: {
      eventType: 'webhookMessageAccepted',
      payloadJson: { path: ['externalMessageId'], equals: PACK35_EXTERNAL_MESSAGE_ID },
    },
    select: { requestId: true },
  });
  return audit?.requestId ?? null;
}

async function resolveApprovedBackfillCandidates(
  prisma: Pick<PrismaClient, 'merchantProfile' | 'vionaRequest' | 'vionaRequestAuditEvent'>,
): Promise<{ candidates: readonly MerchantBackfillCandidate[]; digest: string }> {
  const recon = await reconstructMerchantBackfillCandidates(
    prisma,
    VionaRequestScopeKind.merchant,
  );
  let candidates = [...recon.candidates];
  const p5Webhook = await findPack35RequestId(prisma);
  if (p5Webhook != null) {
    candidates = candidates.filter((c) => c.requestId !== p5Webhook);
  }
  const digest = computeCandidateDigest(candidates.map((c) => c.requestId).sort());
  validateApprovedPopulation(candidates, digest, recon.blockedReasons);
  return { candidates, digest };
}

function userInScope(
  row: { ownerUserId: string | null; requesterUserId: string | null },
  userId: string,
): boolean {
  return row.ownerUserId === userId || row.requesterUserId === userId;
}

async function discoverFixtures(
  prisma: Pick<PrismaClient, 'vionaRequest' | 'vionaRequestAuditEvent' | 'merchantProfile' | 'vionaMerchantWebhookChannel'>,
): Promise<FixtureBundle> {
  const consumerRequestId = await findPack19RequestId(prisma);
  const merchantRequestId = await findPack35RequestId(prisma);
  if (!consumerRequestId || !merchantRequestId) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'fixtures', 'P5 synthetic markers missing');
  }

  const consumerRow = await prisma.vionaRequest.findUnique({
    where: { id: consumerRequestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      ownerUserId: true,
      requesterUserId: true,
    },
  });
  if (
    !consumerRow ||
    consumerRow.scopeKind !== VionaRequestScopeKind.consumer ||
    consumerRow.merchantProfileId != null ||
    consumerRow.tenantId !== PACK19_TENANT_MARKER
  ) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'fixtures', 'consumer fixture provenance invalid');
  }

  const merchantRow = await prisma.vionaRequest.findUnique({
    where: { id: merchantRequestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      ownerUserId: true,
    },
  });
  if (!merchantRow || merchantRow.scopeKind !== VionaRequestScopeKind.merchant) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'fixtures', 'merchant fixture provenance invalid');
  }

  const channel = await prisma.vionaMerchantWebhookChannel.findUnique({
    where: {
      channelType_channelExternalId: {
        channelType: PACK36A_CHANNEL_TYPE,
        channelExternalId: PACK36A_CHANNEL_EXTERNAL_ID,
      },
    },
    select: { merchantProfileId: true },
  });
  if (!channel) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'fixtures', 'Pack36A channel missing');
  }

  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: channel!.merchantProfileId },
    select: { id: true, tenantId: true, ownerUserId: true },
  });
  if (
    !merchantProfile ||
    merchantRow!.merchantProfileId !== merchantProfile.id ||
    merchantRow!.tenantId !== merchantProfile.tenantId
  ) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'fixtures', 'merchant fixture profile mismatch');
  }

  const dualRoleUserId = consumerRow!.ownerUserId ?? consumerRow!.requesterUserId;
  if (!dualRoleUserId) {
    block('BLOCKED_DUAL_ROLE_STAGING_FIXTURE', 'dual-role', 'consumer owner missing');
  }
  if (merchantProfile!.ownerUserId !== dualRoleUserId) {
    block(
      'BLOCKED_DUAL_ROLE_STAGING_FIXTURE',
      'dual-role',
      'consumer owner is not MerchantProfile owner',
    );
  }
  if (!userInScope(consumerRow!, dualRoleUserId!)) {
    block('BLOCKED_DUAL_ROLE_STAGING_FIXTURE', 'dual-role', 'consumer user scope mismatch');
  }

  const approved = await resolveApprovedBackfillCandidates(prisma);
  const historical = approved.candidates.find((c) => c.ownerUserId === dualRoleUserId);
  if (!historical) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'fixtures', 'no historical P4W row for dual-role owner');
  }

  const legacyRows = await prisma.vionaRequest.findMany({
    where: { scopeKind: VionaRequestScopeKind.legacyUnresolved },
    select: {
      id: true,
      tenantId: true,
      ownerUserId: true,
      requesterUserId: true,
      merchantProfileId: true,
      auditEvents: {
        where: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
        select: { id: true },
      },
    },
  });
  const excludedLegacy = legacyRows.filter((r) => r.auditEvents.length === 0);
  if (excludedLegacy.length !== EXCLUDED_LEGACY_TARGET) {
    block(
      'BLOCKED_BACKFILL_INVARIANT',
      'legacy-count',
      `excluded legacy=${excludedLegacy.length}`,
    );
  }

  const legacyCandidate = excludedLegacy.find((r) => userInScope(r, dualRoleUserId!));
  if (!legacyCandidate || legacyCandidate.merchantProfileId != null) {
    block(
      'BLOCKED_AUTHORIZATION_BEHAVIOR',
      'legacy-fixture',
      'no legacyUnresolved row with dual-role user scope',
    );
  }

  return {
    consumerRequestId,
    merchantRequestId,
    historicalRequestId: historical!.requestId,
    legacyRequestId: legacyCandidate.id,
    dualRoleUserId: dualRoleUserId!,
    merchantProfileId: merchantProfile!.id,
    merchantTenantId: merchantProfile!.tenantId,
    legacyTenantId: legacyCandidate.tenantId,
    consumerTenantMarker: PACK19_TENANT_MARKER,
  };
}

function listContainsId(json: Record<string, unknown> | null, requestId: string): boolean {
  if (json?.success !== true) return false;
  const data = json.data as { requests?: { id?: string }[] } | undefined;
  const requests = data?.requests;
  if (!Array.isArray(requests)) return false;
  return requests.some((r) => r.id === requestId);
}

export async function runPack40asAdversarialQa(): Promise<Pack40asSummary> {
  const sourcePath = fileURLToPath(import.meta.url);
  const source = readFileSync(sourcePath, 'utf8');
  assertStaticSafety(source);
  assertPack40aSourcePresent();

  const evidenceText = readFileSync(PACK40AD_EVIDENCE_RELATIVE, 'utf8');
  assertPack40adMergedEvidence(evidenceText);

  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  const apiBase = resolveStagingApiBase();
  assertStagingApiIdentity(apiBase);

  const releaseVersion = resolveStagingReleaseVersion();
  const stagingReleaseLabel = `v${releaseVersion}-verified`;

  const prisma = getPrisma();
  const budget = new RequestBudget();

  log('health', `GET ${redactApiBase(apiBase)}/health`);
  await delay(300);
  const health = await fetch(`${apiBase}/health`);
  budget.consumeUnauth();
  if (health.status !== 200) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'health', `expected 200 got ${health.status}`);
  }

  const preDistribution = await countDistribution(prisma);
  const preAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const preRequestTotal = preDistribution.total;
  const preMerchantProfiles = await prisma.merchantProfile.count();

  const approvedPre = await resolveApprovedBackfillCandidates(prisma);
  const fixtures = await discoverFixtures(prisma);

  log('fixtures', 'P5 consumer/merchant markers verified; dual-role actor positively confirmed');
  log(
    'baseline',
    `distribution legacy=${preDistribution.legacyUnresolved} merchant=${preDistribution.merchant} consumer=${preDistribution.consumer} total=${preDistribution.total}`,
  );

  const pinA = resolvePin('VIONA_PILOT_USER_A_PIN', 'VIONA_PILOT_PIN');
  const pinB = resolvePin('VIONA_PILOT_USER_B_PIN', 'VIONA_PILOT_PIN');
  const phoneA = resolvePilotAPhone();
  const phoneB = resolvePilotBPhone();

  const ownerCreds = await resolvePilotCredentialsForUser(
    prisma,
    fixtures.dualRoleUserId,
    phoneA,
    phoneB,
    pinA,
    pinB,
  );
  const ownerToken = await loginPilot(apiBase, ownerCreds.phone, ownerCreds.pin);

  const userA = await prisma.user.findFirst({ where: { phoneNumber: phoneA }, select: { id: true } });
  const userB = await prisma.user.findFirst({ where: { phoneNumber: phoneB }, select: { id: true } });
  const nonOwnerCreds =
    userB?.id != null && userB.id !== fixtures.dualRoleUserId
      ? { phone: phoneB, pin: pinB, userId: userB.id }
      : userA?.id != null && userA.id !== fixtures.dualRoleUserId
        ? { phone: phoneA, pin: pinA, userId: userA.id }
        : null;
  if (nonOwnerCreds == null) {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'non-owner', 'no distinct non-owner pilot identity');
  }
  const nonOwnerToken = await loginPilot(apiBase, nonOwnerCreds.phone, nonOwnerCreds.pin);

  const nonexistentId = randomUUID();

  // Group A — auth boundary (partially unauth)
  const unauthList = await getJson(`${apiBase}/api/viona/requests`, null, budget);
  if (!isAuthBoundaryDenied(unauthList.status)) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'unauth-list', `expected 401/429 got ${unauthList.status}`);
  }

  const unauthDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.consumerRequestId}`,
    null,
    budget,
  );
  if (!isAuthBoundaryDenied(unauthDetail.status)) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'unauth-detail', `expected 401/429 got ${unauthDetail.status}`);
  }

  const invalidTokenDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.consumerRequestId}`,
    'invalid-token-value',
    budget,
  );
  if (!isAuthBoundaryDenied(invalidTokenDetail.status)) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'invalid-token', `expected 401/429 got ${invalidTokenDetail.status}`);
  }

  const invalidTokenList = await getJson(`${apiBase}/api/viona/requests`, 'invalid-token-value', budget);
  if (!isAuthBoundaryDenied(invalidTokenList.status)) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'invalid-token-list', `expected 401/429 got ${invalidTokenList.status}`);
  }

  // Group B/C — owner list once, detail checks
  const ownerList = await getJson(`${apiBase}/api/viona/requests`, ownerToken, budget);
  if (ownerList.status !== 200 || ownerList.json?.success !== true) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'owner-list', 'owner list failed');
  }

  const consumerOwnerListPass = listContainsId(ownerList.json, fixtures.consumerRequestId);
  const merchantOwnerListPass = listContainsId(ownerList.json, fixtures.merchantRequestId);
  const historicalMerchantListPass = listContainsId(ownerList.json, fixtures.historicalRequestId);
  const legacyOwnerListDenied = !listContainsId(ownerList.json, fixtures.legacyRequestId);

  if (!consumerOwnerListPass || !merchantOwnerListPass || !historicalMerchantListPass) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'owner-list-membership', 'expected rows missing from owner list');
  }
  if (!legacyOwnerListDenied) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'legacy-list', 'legacy row visible to owner');
  }

  const ownerConsumerDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.consumerRequestId}`,
    ownerToken,
    budget,
  );
  const consumerOwnerDetailPass = ownerConsumerDetail.status === 200 && ownerConsumerDetail.json?.success === true;

  const ownerMerchantDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.merchantRequestId}`,
    ownerToken,
    budget,
  );
  const merchantOwnerDetailPass = ownerMerchantDetail.status === 200 && ownerMerchantDetail.json?.success === true;

  const ownerHistoricalDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.historicalRequestId}`,
    ownerToken,
    budget,
  );
  const historicalMerchantDetailPass =
    ownerHistoricalDetail.status === 200 && ownerHistoricalDetail.json?.success === true;

  if (!consumerOwnerDetailPass || !merchantOwnerDetailPass || !historicalMerchantDetailPass) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'owner-detail', 'owner detail failed for authorized row');
  }

  const ownerLegacyDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.legacyRequestId}`,
    ownerToken,
    budget,
  );
  const legacyOwnerDetailDenied =
    ownerLegacyDetail.status === 404 &&
    normalizeFailure(ownerLegacyDetail.status, ownerLegacyDetail.json).errorCode === 'Request not found';

  if (!legacyOwnerDetailDenied) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'legacy-detail', 'legacy row accessible to owner');
  }

  // Group E — non-owner
  const nonOwnerList = await getJson(`${apiBase}/api/viona/requests`, nonOwnerToken, budget);
  if (nonOwnerList.status !== 200) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'non-owner-list', 'non-owner list failed');
  }

  const nonOwnerConsumerDenied = !listContainsId(nonOwnerList.json, fixtures.consumerRequestId);
  const nonOwnerMerchantDenied = !listContainsId(nonOwnerList.json, fixtures.merchantRequestId);
  const nonOwnerLegacyDenied = !listContainsId(nonOwnerList.json, fixtures.legacyRequestId);

  const nonOwnerConsumerDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.consumerRequestId}`,
    nonOwnerToken,
    budget,
  );
  const nonOwnerMerchantDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.merchantRequestId}`,
    nonOwnerToken,
    budget,
  );
  const nonOwnerHistoricalDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.historicalRequestId}`,
    nonOwnerToken,
    budget,
  );
  const nonOwnerLegacyDetail = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.legacyRequestId}`,
    nonOwnerToken,
    budget,
  );

  const nonOwnerDeniedDetail = (result: { status: number; json: Record<string, unknown> | null }) =>
    result.status === 404 &&
    normalizeFailure(result.status, result.json).errorCode === 'Request not found';

  if (
    !nonOwnerConsumerDenied ||
    !nonOwnerMerchantDenied ||
    !nonOwnerLegacyDenied ||
    !nonOwnerDeniedDetail(nonOwnerConsumerDetail) ||
    !nonOwnerDeniedDetail(nonOwnerMerchantDetail) ||
    !nonOwnerDeniedDetail(nonOwnerHistoricalDetail) ||
    !nonOwnerDeniedDetail(nonOwnerLegacyDetail)
  ) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'non-owner', 'non-owner access not fully denied');
  }

  // Group F — client spoof attempts (non-owner + owner legacy)
  const spoofQueries = [
    `tenantId=${encodeURIComponent(fixtures.merchantTenantId)}`,
    `expectedTenantId=${encodeURIComponent(fixtures.merchantTenantId)}`,
    `merchantProfileId=${encodeURIComponent(fixtures.merchantProfileId)}`,
    'scopeKind=merchant',
    'directReadPolicy=pack40a_provenance',
  ];

  let clientTenantExpansionDenied = true;
  let clientProfileExpansionDenied = true;
  let clientPolicyExpansionDenied = true;

  for (const q of spoofQueries) {
    const spoofList = await getJson(
      `${apiBase}/api/viona/requests?${q}`,
      nonOwnerToken,
      budget,
    );
    if (listContainsId(spoofList.json, fixtures.consumerRequestId)) {
      clientTenantExpansionDenied = false;
    }
    if (listContainsId(spoofList.json, fixtures.merchantRequestId)) {
      clientProfileExpansionDenied = false;
    }

    const spoofLegacy = await getJson(
      `${apiBase}/api/viona/requests/${fixtures.legacyRequestId}?${q}`,
      ownerToken,
      budget,
    );
    if (spoofLegacy.status === 200 && spoofLegacy.json?.success === true) {
      clientPolicyExpansionDenied = false;
    }
  }

  const headerSpoof = await getJson(
    `${apiBase}/api/viona/requests/${fixtures.legacyRequestId}`,
    nonOwnerToken,
    budget,
    {
      'X-Viona-Direct-Read-Policy': 'pack40a_provenance',
      'X-Expected-Tenant-Id': fixtures.merchantTenantId,
    },
  );
  if (headerSpoof.status === 200 && headerSpoof.json?.success === true) {
    clientPolicyExpansionDenied = false;
  }

  if (!clientTenantExpansionDenied || !clientProfileExpansionDenied || !clientPolicyExpansionDenied) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'client-spoof', 'client input expanded access');
  }

  // Group G — existence leak normalization
  const failureConsumer = normalizeFailure(nonOwnerConsumerDetail.status, nonOwnerConsumerDetail.json);
  const failureMerchant = normalizeFailure(nonOwnerMerchantDetail.status, nonOwnerMerchantDetail.json);
  const failureLegacy = normalizeFailure(ownerLegacyDetail.status, ownerLegacyDetail.json);
  const nonexistentDetail = await getJson(
    `${apiBase}/api/viona/requests/${nonexistentId}`,
    ownerToken,
    budget,
  );
  const failureNonexistent = normalizeFailure(nonexistentDetail.status, nonexistentDetail.json);

  const existenceLeakSafe =
    failuresEquivalent(failureConsumer, failureMerchant) &&
    failuresEquivalent(failureMerchant, failureLegacy) &&
    failuresEquivalent(failureLegacy, failureNonexistent);

  if (!existenceLeakSafe) {
    block('BLOCKED_EXISTENCE_LEAK', 'existence-leak', 'detail failures not normalized');
  }

  const listDetailConsistent =
    (consumerOwnerListPass && consumerOwnerDetailPass) &&
    (merchantOwnerListPass && merchantOwnerDetailPass) &&
    legacyOwnerListDenied &&
    legacyOwnerDetailDenied;

  // Post-QA invariants
  const postDistribution = await countDistribution(prisma);
  const postAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const postMerchantProfiles = await prisma.merchantProfile.count();
  const approvedPost = await resolveApprovedBackfillCandidates(prisma);

  const postRequestCountUnchanged = postDistribution.total === preRequestTotal;
  const postAuditCountUnchanged = postAuditEvents === preAuditEvents;
  const postProvenanceUnchanged =
    postDistribution.legacyUnresolved === preDistribution.legacyUnresolved &&
    postDistribution.merchant === preDistribution.merchant &&
    postDistribution.consumer === preDistribution.consumer;
  const postP4wDigestUnchanged = approvedPost.digest === approvedPre.digest;

  if (
    !postRequestCountUnchanged ||
    !postAuditCountUnchanged ||
    !postProvenanceUnchanged ||
    !postP4wDigestUnchanged ||
    postMerchantProfiles !== preMerchantProfiles ||
    approvedPost.digest !== APPROVED_CANDIDATE_DIGEST
  ) {
    block('BLOCKED_POST_QA_INVARIANT', 'post-qa', 'data invariant drift detected');
  }

  const pack19StillConsumer = await prisma.vionaRequest.count({
    where: {
      scopeKind: VionaRequestScopeKind.consumer,
      tenantId: PACK19_TENANT_MARKER,
      merchantProfileId: null,
    },
  });
  if (pack19StillConsumer !== 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'post-pack19', 'consumer fixture drift');
  }

  const budgetSnap = budget.snapshot();
  log('budget', `authGets=${budgetSnap.authenticatedGetCount} unauthGets=${budgetSnap.unauthGetCount}`);

  return {
    classification: 'READY_FOR_PACK40AS_QA_EVIDENCE_PR_REVIEW',
    verifiedMasterSha: VERIFIED_MASTER_SHA,
    pr353Merged: true,
    pr353MergeSha: PR353_MERGE_SHA,
    stagingApiRedacted: redactApiBase(apiBase),
    stagingDatabaseRedacted: `db.${STAGING_PROJECT_REF}.supabase.co`,
    stagingReleaseLabel,
    flyLogsUsed: false,
    dualRoleFixtureVerified: true,
    nonOwnerFixtureVerified: true,
    preActionHealthOk: true,
    preActionDistribution: preDistribution,
    p4wDigestMatches: approvedPre.digest === APPROVED_CANDIDATE_DIGEST,
    consumerOwnerListPass,
    consumerOwnerDetailPass,
    merchantOwnerListPass,
    merchantOwnerDetailPass,
    historicalMerchantListPass,
    historicalMerchantDetailPass,
    legacyOwnerListDenied,
    legacyOwnerDetailDenied,
    nonOwnerConsumerDenied,
    nonOwnerMerchantDenied,
    nonOwnerLegacyDenied,
    clientTenantExpansionDenied,
    clientProfileExpansionDenied,
    clientPolicyExpansionDenied,
    existenceLeakSafe,
    listDetailConsistent,
    inactiveMerchantLiveQaExercised: false,
    malformedProvenanceLiveQaExercised: false,
    postRequestCountUnchanged,
    postAuditCountUnchanged,
    postProvenanceUnchanged,
    postP4wDigestUnchanged,
    dataModified: false,
    pack40BImplemented: false,
    pack40CImplemented: false,
    pack40DImplemented: false,
    productionTouched: false,
    pack19Marker: PACK19_TENANT_MARKER,
    pack35Marker: PACK35_EXTERNAL_MESSAGE_ID,
    authenticatedGetCount: budgetSnap.authenticatedGetCount,
    unauthGetCount: budgetSnap.unauthGetCount,
  };
}

async function main(): Promise<void> {
  log('start', `master=${VERIFIED_MASTER_SHA.slice(0, 12)}… operator=APPROVE_PACK40AS_STAGING_TENANT_ADVERSARIAL_QA`);
  try {
    const summary = await runPack40asAdversarialQa();
    console.log('');
    console.log('[pack40as-verify] ======== SANITIZED SUMMARY ========');
    console.log(JSON.stringify(summary, null, 2));
    console.log('[pack40as-verify] ====================================');
    console.log(`[pack40as-verify] FINAL_CLASSIFICATION=${summary.classification}`);
  } catch (error) {
    if (error instanceof Pack40asBlockedError) {
      console.error(`[pack40as-verify] FINAL_CLASSIFICATION=${error.code}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    await disconnectPrisma();
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').includes('verify-viona-pack40as-staging-tenant-adversarial-qa') ??
  false;

if (isDirectRun) {
  main().catch((error) => {
    console.error('[pack40as-verify] FATAL', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
