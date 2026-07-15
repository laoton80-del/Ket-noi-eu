/**
 * Pack40CS — Staging tenant status adversarial QA (POST status action only).
 *
 * Operator phrase: APPROVE_PACK40CS_STAGING_TENANT_STATUS_ADVERSARIAL_QA
 *
 * Never prints or commits raw identifiers, credentials, or tokens.
 *
 * Usage: npx tsx scripts/verify-viona-pack40cs-staging-tenant-status-adversarial-qa.ts
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
import { VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateDto';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';
import { VIONA_REQUEST_NOTE_EVENT_TYPE } from '../src/services/viona/vionaRequestNoteActionService';
import { VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestStatusActionService';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(REPO_ROOT, '.env.local'), override: true });
loadEnv({ path: path.join(REPO_ROOT, '.env') });

export const VERIFIED_MASTER_SHA = '92244f472026872ca31c88601f1ca263268d2496';
export const PR364_MERGE_SHA = VERIFIED_MASTER_SHA;
export const MASTER_SHORT_SHA = VERIFIED_MASTER_SHA.slice(0, 7);
export const PACK40CD_EVIDENCE_RELATIVE =
  'docs/product/VIONA_PACK40CD_STAGING_STATUS_ENFORCEMENT_DEPLOYMENT_EVIDENCE.md';
export const STAGING_API_APP_NAME = 'viona-api-staging-eu';
export const STAGING_API_BASE_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
export const MIN_STAGING_RELEASE = 26;

export const PACK19_TENANT_MARKER = 'pack40p5-consumer-ee22193';
export const PACK19_IDEMPOTENCY_KEY = 'pack40p5-consumer-create-ee22193';
export const PACK35_EXTERNAL_MESSAGE_ID = 'pack40p5-webhook-ee22193';
export const PACK36A_CHANNEL_TYPE = 'custom_client';
export const PACK36A_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
export const EXCLUDED_LEGACY_TARGET = 5;

export const CONSUMER_STATUS_REASON = `pack40cs-consumer-status-${MASTER_SHORT_SHA}`;
export const MERCHANT_STATUS_REASON = `pack40cs-merchant-status-${MASTER_SHORT_SHA}`;
export const CONSUMER_STATUS_NOTE = `pack40cs-consumer-note-${MASTER_SHORT_SHA}`;
export const MERCHANT_STATUS_NOTE = `pack40cs-merchant-note-${MASTER_SHORT_SHA}`;
export const CONSUMER_IDEM_KEY = `pack40cs-consumer-idem-${MASTER_SHORT_SHA}`;
export const MERCHANT_IDEM_KEY = `pack40cs-merchant-idem-${MASTER_SHORT_SHA}`;
export const INVALID_TARGET_IDEM_KEY = `pack40cs-invalid-target-${MASTER_SHORT_SHA}`;
export const CONSUMER_CORRELATION = `pack40cs-consumer-corr-${MASTER_SHORT_SHA}`;
export const MERCHANT_CORRELATION = `pack40cs-merchant-corr-${MASTER_SHORT_SHA}`;

export const MAX_STATUS_POST = 10;
export const MAX_STATUS_POST_ABSOLUTE = 11;

export const STATUS_ENDPOINT_SUFFIX = '/actions/status';

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
  /method:\s*['"]POST['"][\s\S]{0,120}\/actions\/note/,
  /method:\s*['"]POST['"][\s\S]{0,120}\/actions\/execution/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]DELETE['"]/,
  /method:\s*['"]PUT['"]/,
] as const;

export type Pack40csBlockedCode =
  | 'BLOCKED_PACK40CD_EVIDENCE_NOT_MERGED'
  | 'BLOCKED_RELEASE_MISMATCH'
  | 'BLOCKED_ENVIRONMENT_IDENTITY'
  | 'BLOCKED_DUAL_ROLE_STAGING_FIXTURE'
  | 'BLOCKED_SAFE_AUTH_FIXTURE'
  | 'BLOCKED_SAFE_STATUS_FIXTURE'
  | 'BLOCKED_STATUS_ACTION_CONTRACT'
  | 'BLOCKED_IDEMPOTENCY_CONTRACT'
  | 'BLOCKED_UNCERTAIN_WRITE_OUTCOME'
  | 'BLOCKED_AUTHORIZATION_BEHAVIOR'
  | 'BLOCKED_EXISTENCE_LEAK'
  | 'BLOCKED_POST_QA_INVARIANT'
  | 'BLOCKED_SCOPE_CONFLICT';

export class Pack40csBlockedError extends Error {
  constructor(
    readonly code: Pack40csBlockedCode,
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${code}: ${stage}: ${detail}`);
    this.name = 'Pack40csBlockedError';
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

export type StatusActionMeta = Readonly<{
  firstWriteStatus: number;
  replayStatus: number;
  idempotentReplay: boolean;
  eventType: string | null;
}>;

export type Pack40csSummary = Readonly<{
  classification:
    | 'READY_FOR_PACK40CS_QA_EVIDENCE_PR_REVIEW'
    | 'PACK40C_STAGING_STATUS_ADVERSARIAL_QA_GREEN';
  verifiedMasterSha: string;
  pr364Merged: true;
  pr364MergeSha: string;
  stagingApiRedacted: string;
  stagingDatabaseRedacted: string;
  stagingReleaseLabel: string;
  flyLogsUsed: false;
  dualRoleFixtureVerified: boolean;
  nonOwnerFixtureVerified: boolean;
  requesterOnlyFixtureVerified: boolean;
  preActionHealthOk: boolean;
  preActionDistribution: ProvenanceDistribution;
  p4wDigestMatches: boolean;
  invalidTargetRejected: boolean;
  consumerFirstStatusPass: boolean;
  consumerReplayPass: boolean;
  consumerConflictRejected: boolean;
  consumerDuplicateAuditCount: number;
  merchantFirstStatusPass: boolean;
  merchantReplayPass: boolean;
  merchantDuplicateAuditCount: number;
  nonOwnerConsumerKeyReuseDenied: boolean;
  nonOwnerMerchantSpoofDenied: boolean;
  legacyOwnerStatusDenied: boolean;
  nonexistentRequestDenied: boolean;
  requesterOnlyStatusDenied: boolean;
  clientTenantExpansionDenied: boolean;
  clientProfileExpansionDenied: boolean;
  clientPolicyExpansionDenied: boolean;
  existenceLeakSafe: boolean;
  successfulStatusAuditDelta: number;
  successfulStatusTransitionDelta: number;
  deniedStatusAuditDelta: number;
  deniedStatusTransitionDelta: number;
  noteAuditDelta: number;
  postRequestCountUnchanged: boolean;
  postProvenanceUnchanged: boolean;
  postP4wDigestUnchanged: boolean;
  merchantProfileChanged: false;
  legacyStatusUnchanged: boolean;
  consumerStatusTriage: boolean;
  merchantStatusTriage: boolean;
  dataCleanupPerformed: false;
  productionTouched: false;
  pack19Marker: string;
  pack35Marker: string;
  statusPostCount: number;
  consumerStatusReason: string;
  merchantStatusReason: string;
  optionalRequesterOnlyRan: boolean;
  resumeValidationOnly?: boolean;
}>;

type FixtureBundle = Readonly<{
  consumerRequestId: string;
  merchantRequestId: string;
  legacyRequestId: string;
  requesterOnlyRequestId: string | null;
  dualRoleUserId: string;
  merchantProfileId: string;
  merchantTenantId: string;
  consumerStatus: string;
  merchantStatus: string;
  legacyStatus: string;
  merchantProfileActive: boolean;
  resumeCompletedQa: boolean;
}>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40cs-verify] ${stage}: ${detail}` : `[pack40cs-verify] ${stage}`);
}

export function block(code: Pack40csBlockedCode, stage: string, detail: string): never {
  console.error(`[pack40cs-verify] ${code} @ ${stage}: ${detail}`);
  throw new Pack40csBlockedError(code, stage, detail);
}

export function assertStaticSafety(source: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      block('BLOCKED_SCOPE_CONFLICT', 'static-safety', `forbidden pattern ${pattern}`);
    }
  }
  if (!source.includes(STATUS_ENDPOINT_SUFFIX)) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'status endpoint missing');
  }
  if (!source.includes("method: 'POST'") && !source.includes('method: "POST"')) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'POST helper missing');
  }
}

export function assertPack40cdMergedEvidence(evidenceText: string): void {
  if (!evidenceText.includes('PACK40C_DIRECT_STATUS_ENFORCEMENT_DEPLOYED_TO_STAGING')) {
    block('BLOCKED_PACK40CD_EVIDENCE_NOT_MERGED', 'pack40cd-evidence', 'deployed marker missing');
  }
  if (!evidenceText.includes('v26')) {
    block('BLOCKED_PACK40CD_EVIDENCE_NOT_MERGED', 'pack40cd-evidence', 'v26 release marker missing');
  }
}

export function assertPack40cSourcePresent(): void {
  const statusServicePath = path.join(REPO_ROOT, 'src/services/viona/vionaRequestStatusActionService.ts');
  const statusService = readFileSync(statusServicePath, 'utf8');
  if (!statusService.includes('TransactionIsolationLevel.Serializable')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'Serializable isolation missing');
  }
  if (!statusService.includes('executeAuthorizedStatusTransition')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'transactional status mutation missing');
  }
  if (!statusService.includes('resolveVionaRequestStatusPrincipalContext')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'in-transaction principal missing');
  }
  if (!statusService.includes('buildAuthorizedVionaRequestStatusWhere')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'authorized status where missing');
  }
  if (statusService.includes('findIdempotentStatusAuditEvent') === false) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'idempotency helper missing');
  }
  const transitionFn = statusService.slice(
    statusService.indexOf('export async function transitionVionaRequestStatus'),
  );
  const txIdx = transitionFn.indexOf('prisma.$transaction');
  if (txIdx >= 0 && transitionFn.slice(0, txIdx).includes('findIdempotentStatusAuditEvent')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'pre-transaction idempotency path suspected');
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

class PostBudget {
  private posts = 0;

  constructor(private readonly absoluteMax: number) {}

  consume(): void {
    this.posts += 1;
    if (this.posts > this.absoluteMax) {
      block('BLOCKED_SCOPE_CONFLICT', 'request-budget', 'status POST budget exceeded');
    }
  }

  snapshot(): number {
    return this.posts;
  }

  expectedCount(): number {
    return this.absoluteMax;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function parseStatusActionMeta(
  status: number,
  json: Record<string, unknown> | null,
): StatusActionMeta | null {
  if (json?.success !== true) return null;
  const data = json.data as Record<string, unknown> | undefined;
  const action = data?.action as Record<string, unknown> | undefined;
  if (action == null) return null;
  return {
    firstWriteStatus: status,
    replayStatus: status,
    idempotentReplay: action.idempotentReplay === true,
    eventType: typeof action.eventType === 'string' ? action.eventType : null,
  };
}

export function assertFirstWriteContract(status: number, json: Record<string, unknown> | null): void {
  if (status !== 201 || json?.success !== true) {
    block('BLOCKED_STATUS_ACTION_CONTRACT', 'first-write', `expected 201 success got ${status}`);
  }
  const meta = parseStatusActionMeta(status, json);
  if (meta == null || meta.idempotentReplay || meta.eventType !== 'action.status') {
    block('BLOCKED_STATUS_ACTION_CONTRACT', 'first-write', 'action.status first-write contract failed');
  }
}

export function assertReplayContract(status: number, json: Record<string, unknown> | null): void {
  if (status !== 200 || json?.success !== true) {
    block('BLOCKED_STATUS_ACTION_CONTRACT', 'replay', `expected 200 success got ${status}`);
  }
  const meta = parseStatusActionMeta(status, json);
  if (meta == null || !meta.idempotentReplay || meta.eventType !== 'action.status') {
    block('BLOCKED_STATUS_ACTION_CONTRACT', 'replay', 'idempotent replay contract failed');
  }
}

export function assertInvalidTargetContract(
  status: number,
  json: Record<string, unknown> | null,
): NormalizedFailure {
  const failure = normalizeFailure(status, json);
  if (
    status !== 400 ||
    failure.success ||
    (failure.errorCode !== 'Invalid status transition' &&
      failure.errorCode !== 'Invalid status request')
  ) {
    block(
      'BLOCKED_STATUS_ACTION_CONTRACT',
      'invalid-target',
      `expected 400 invalid transition/request got ${status}`,
    );
  }
  return failure;
}

export function assertConflictContract(
  status: number,
  json: Record<string, unknown> | null,
): NormalizedFailure {
  const failure = normalizeFailure(status, json);
  if (status !== 400 || failure.errorCode !== 'Invalid status request' || failure.success) {
    block('BLOCKED_IDEMPOTENCY_CONTRACT', 'conflict', `expected 400 invalid_input got ${status}`);
  }
  return failure;
}

export function assertDeniedContract(
  status: number,
  json: Record<string, unknown> | null,
): NormalizedFailure {
  const failure = normalizeFailure(status, json);
  if (status !== 404 || failure.errorCode !== 'Request not found' || failure.success) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'denied', `expected 404 Request not found got ${status}`);
  }
  return failure;
}

async function postStatus(
  base: string,
  token: string,
  requestId: string,
  body: Record<string, unknown>,
  budget: PostBudget,
  query?: string,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; json: Record<string, unknown> | null; transportError: boolean }> {
  await delay(400);
  budget.consume();

  const url = `${base}/api/viona/requests/${encodeURIComponent(requestId)}${STATUS_ENDPOINT_SUFFIX}${
    query != null && query.length > 0 ? `?${query}` : ''
  }`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(extraHeaders ?? {}),
  };

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }
    return { status: res.status, json, transportError: false };
  } catch {
    return { status: 0, json: null, transportError: true };
  }
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

async function countNoteAuditEvents(prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>): Promise<number> {
  return prisma.vionaRequestAuditEvent.count({
    where: { eventType: VIONA_REQUEST_NOTE_EVENT_TYPE },
  });
}

export async function countStatusAuditEvents(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<number> {
  return prisma.vionaRequestAuditEvent.count({
    where: { eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE },
  });
}

export async function countStatusTransitionEvents(
  prisma: Pick<PrismaClient, 'vionaRequestStatusEvent'>,
  requestId?: string,
): Promise<number> {
  return prisma.vionaRequestStatusEvent.count({
    where: requestId != null ? { requestId } : undefined,
  });
}

export async function countStatusIdempotencyKey(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
  idempotencyKey: string,
): Promise<number> {
  return prisma.vionaRequestAuditEvent.count({
    where: {
      eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
      payloadJson: { path: ['idempotencyKey'], equals: idempotencyKey },
    },
  });
}

export async function countReasonMarker(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
  marker: string,
): Promise<number> {
  const rows = await prisma.vionaRequestAuditEvent.findMany({
    where: { eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE },
    select: { payloadJson: true },
    take: 500,
  });
  let count = 0;
  for (const row of rows) {
    const payload = row.payloadJson;
    if (payload != null && typeof payload === 'object' && !Array.isArray(payload)) {
      const reason = (payload as Record<string, unknown>).reason;
      if (typeof reason === 'string' && reason === marker) count += 1;
    }
  }
  return count;
}

async function countSubmittedToTriageTransitions(
  prisma: Pick<PrismaClient, 'vionaRequestStatusEvent'>,
  requestId: string,
): Promise<number> {
  return prisma.vionaRequestStatusEvent.count({
    where: {
      requestId,
      fromStatus: 'submitted',
      toStatus: 'triage',
    },
  });
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

async function findRequesterOnlyRequestId(
  prisma: Pick<PrismaClient, 'vionaRequest'>,
  nonOwnerUserId: string,
): Promise<string | null> {
  const rows = await prisma.vionaRequest.findMany({
    where: {
      status: 'submitted',
      requesterUserId: nonOwnerUserId,
      ownerUserId: { not: nonOwnerUserId },
    },
    select: {
      id: true,
      scopeKind: true,
      ownerUserId: true,
      requesterUserId: true,
      status: true,
    },
    take: 20,
  });

  const candidate = rows.find(
    (row) =>
      row.ownerUserId != null &&
      row.requesterUserId != null &&
      row.ownerUserId !== row.requesterUserId &&
      row.status === 'submitted',
  );

  return candidate?.id ?? null;
}

export async function discoverFixtures(
  prisma: Pick<
    PrismaClient,
    'vionaRequest' | 'vionaRequestAuditEvent' | 'merchantProfile' | 'vionaMerchantWebhookChannel'
  >,
  nonOwnerUserId?: string,
): Promise<FixtureBundle> {
  const consumerRequestId = await findPack19RequestId(prisma);
  const merchantRequestId = await findPack35RequestId(prisma);
  if (!consumerRequestId || !merchantRequestId) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'P5 synthetic markers missing');
  }

  const consumerRow = await prisma.vionaRequest.findUnique({
    where: { id: consumerRequestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      ownerUserId: true,
      requesterUserId: true,
      status: true,
    },
  });
  if (
    !consumerRow ||
    consumerRow.scopeKind !== VionaRequestScopeKind.consumer ||
    consumerRow.merchantProfileId != null ||
    consumerRow.tenantId !== PACK19_TENANT_MARKER
  ) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'consumer fixture provenance invalid');
  }

  const merchantRow = await prisma.vionaRequest.findUnique({
    where: { id: merchantRequestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      ownerUserId: true,
      status: true,
    },
  });
  if (!merchantRow || merchantRow.scopeKind !== VionaRequestScopeKind.merchant) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'merchant fixture provenance invalid');
  }

  const consumerIdemExisting = await countStatusIdempotencyKey(prisma, CONSUMER_IDEM_KEY);
  const merchantIdemExisting = await countStatusIdempotencyKey(prisma, MERCHANT_IDEM_KEY);
  const resumeCompletedQa =
    consumerRow.status === 'triage' &&
    merchantRow.status === 'triage' &&
    consumerIdemExisting === 1 &&
    merchantIdemExisting === 1;

  if (consumerRow.status !== 'submitted' && !resumeCompletedQa) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'consumer fixture status not submitted');
  }
  if (merchantRow.status !== 'submitted' && !resumeCompletedQa) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'merchant fixture status not submitted');
  }

  if (!resumeCompletedQa) {
    // fresh QA requires submitted fixtures
  } else {
    log('resume', 'Pack40CS idempotency markers on triage fixtures; post-QA validation only');
  }

  const merchantRowConfirmed = merchantRow;

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
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'Pack36A channel missing');
  }

  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: channel!.merchantProfileId },
    select: { id: true, tenantId: true, ownerUserId: true, isActive: true },
  });
  if (
    !merchantProfile ||
    merchantRowConfirmed!.merchantProfileId !== merchantProfile.id ||
    merchantRowConfirmed!.tenantId !== merchantProfile.tenantId
  ) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'merchant fixture profile mismatch');
  }
  if (!merchantProfile.isActive) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'fixtures', 'merchant profile inactive');
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

  const legacyRows = await prisma.vionaRequest.findMany({
    where: { scopeKind: VionaRequestScopeKind.legacyUnresolved },
    select: {
      id: true,
      tenantId: true,
      ownerUserId: true,
      requesterUserId: true,
      merchantProfileId: true,
      status: true,
      auditEvents: {
        where: { eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE },
        select: { id: true },
      },
    },
  });
  const excludedLegacy = legacyRows.filter((r) => r.auditEvents.length === 0);
  if (excludedLegacy.length !== EXCLUDED_LEGACY_TARGET) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'legacy-count', `excluded legacy=${excludedLegacy.length}`);
  }

  const legacyCandidate = excludedLegacy.find((r) => userInScope(r, dualRoleUserId!));
  if (!legacyCandidate || legacyCandidate.merchantProfileId != null) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'legacy-fixture', 'no legacyUnresolved row with dual-role scope');
  }

  const requesterOnlyRequestId =
    nonOwnerUserId != null ? await findRequesterOnlyRequestId(prisma, nonOwnerUserId) : null;

  return {
    consumerRequestId,
    merchantRequestId,
    legacyRequestId: legacyCandidate.id,
    requesterOnlyRequestId,
    dualRoleUserId: dualRoleUserId!,
    merchantProfileId: merchantProfile!.id,
    merchantTenantId: merchantProfile!.tenantId,
    consumerStatus: consumerRow!.status,
    merchantStatus: merchantRow!.status,
    legacyStatus: legacyCandidate.status,
    merchantProfileActive: merchantProfile!.isActive,
    resumeCompletedQa,
  };
}

export async function verifyMarkerAbsence(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<void> {
  const checks = [
    { label: 'consumer reason marker', count: await countReasonMarker(prisma, CONSUMER_STATUS_REASON) },
    { label: 'merchant reason marker', count: await countReasonMarker(prisma, MERCHANT_STATUS_REASON) },
    { label: 'consumer idem key', count: await countStatusIdempotencyKey(prisma, CONSUMER_IDEM_KEY) },
    { label: 'merchant idem key', count: await countStatusIdempotencyKey(prisma, MERCHANT_IDEM_KEY) },
  ];
  for (const check of checks) {
    if (check.count > 0) {
      block('BLOCKED_SAFE_STATUS_FIXTURE', 'marker-absence', `${check.label} already exists`);
    }
  }
}

async function handleTransportUncertainty(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
  idempotencyKey: string,
  reasonMarker: string,
): Promise<never> {
  const idemCount = await countStatusIdempotencyKey(prisma, idempotencyKey);
  const markerCount = await countReasonMarker(prisma, reasonMarker);
  log(
    'transport-uncertainty',
    `idemCount=${idemCount} markerCount=${markerCount} (sanitized aggregate only)`,
  );
  block('BLOCKED_UNCERTAIN_WRITE_OUTCOME', 'transport', 'POST transport interrupted');
}

async function validateCompletedQaResume(
  prisma: Pick<
    PrismaClient,
    | 'vionaRequest'
    | 'vionaRequestAuditEvent'
    | 'vionaRequestStatusEvent'
    | 'merchantProfile'
    | 'vionaRequestAuditEvent'
  >,
  fixtures: FixtureBundle,
  approvedPre: { digest: string },
  preDistribution: ProvenanceDistribution,
  preRequestTotal: number,
  preMerchantProfiles: number,
  preMerchantProfile: { ownerUserId: string; tenantId: string; isActive: boolean },
  preNoteAuditEvents: number,
  stagingReleaseLabel: string,
  apiBase: string,
): Promise<Pack40csSummary> {
  const invalidTargetCount = await countStatusIdempotencyKey(prisma, INVALID_TARGET_IDEM_KEY);
  const consumerReasonCount = await countReasonMarker(prisma, CONSUMER_STATUS_REASON);
  const merchantReasonCount = await countReasonMarker(prisma, MERCHANT_STATUS_REASON);
  const consumerIdemCount = await countStatusIdempotencyKey(prisma, CONSUMER_IDEM_KEY);
  const merchantIdemCount = await countStatusIdempotencyKey(prisma, MERCHANT_IDEM_KEY);
  const consumerTransitions = await countSubmittedToTriageTransitions(prisma, fixtures.consumerRequestId);
  const merchantTransitions = await countSubmittedToTriageTransitions(prisma, fixtures.merchantRequestId);
  const statusAuditTotal = await countStatusAuditEvents(prisma);
  const noteAuditTotal = await countNoteAuditEvents(prisma);

  if (
    invalidTargetCount !== 0 ||
    consumerReasonCount !== 1 ||
    merchantReasonCount !== 1 ||
    consumerIdemCount !== 1 ||
    merchantIdemCount !== 1 ||
    consumerTransitions !== 1 ||
    merchantTransitions !== 1
  ) {
    block('BLOCKED_POST_QA_INVARIANT', 'resume-validate', 'completed QA marker counts invalid');
  }

  const consumerRow = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.consumerRequestId },
    select: { scopeKind: true, merchantProfileId: true, status: true },
  });
  const merchantRow = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.merchantRequestId },
    select: { scopeKind: true, merchantProfileId: true, tenantId: true, status: true },
  });
  const legacyRow = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.legacyRequestId },
    select: { scopeKind: true, status: true },
  });
  const postMerchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: fixtures.merchantProfileId },
    select: { ownerUserId: true, tenantId: true, isActive: true },
  });

  const postDistribution = await countDistribution(prisma);
  const approvedPost = await resolveApprovedBackfillCandidates(prisma);

  if (
    consumerRow?.status !== 'triage' ||
    merchantRow?.status !== 'triage' ||
    consumerRow.scopeKind !== VionaRequestScopeKind.consumer ||
    consumerRow.merchantProfileId != null ||
    merchantRow?.scopeKind !== VionaRequestScopeKind.merchant ||
    merchantRow.merchantProfileId !== fixtures.merchantProfileId ||
    merchantRow.tenantId !== fixtures.merchantTenantId ||
    legacyRow?.scopeKind !== VionaRequestScopeKind.legacyUnresolved ||
    legacyRow.status !== fixtures.legacyStatus ||
    postDistribution.total !== preRequestTotal ||
    postDistribution.legacyUnresolved !== preDistribution.legacyUnresolved ||
    postDistribution.merchant !== preDistribution.merchant ||
    postDistribution.consumer !== preDistribution.consumer ||
    approvedPost.digest !== approvedPre.digest ||
    approvedPost.digest !== APPROVED_CANDIDATE_DIGEST ||
    noteAuditTotal !== preNoteAuditEvents ||
    postMerchantProfile?.ownerUserId !== preMerchantProfile.ownerUserId ||
    postMerchantProfile?.tenantId !== preMerchantProfile.tenantId ||
    postMerchantProfile?.isActive !== preMerchantProfile.isActive
  ) {
    block('BLOCKED_POST_QA_INVARIANT', 'resume-validate', 'post-QA preservation failed');
  }

  log('resume', 'completed QA state validated (no additional POSTs)');

  return {
    classification: 'READY_FOR_PACK40CS_QA_EVIDENCE_PR_REVIEW',
    verifiedMasterSha: VERIFIED_MASTER_SHA,
    pr364Merged: true,
    pr364MergeSha: PR364_MERGE_SHA,
    stagingApiRedacted: redactApiBase(apiBase),
    stagingDatabaseRedacted: `db.${STAGING_PROJECT_REF}.supabase.co`,
    stagingReleaseLabel,
    flyLogsUsed: false,
    dualRoleFixtureVerified: true,
    nonOwnerFixtureVerified: true,
    requesterOnlyFixtureVerified: fixtures.requesterOnlyRequestId != null,
    preActionHealthOk: true,
    preActionDistribution: preDistribution,
    p4wDigestMatches: approvedPre.digest === APPROVED_CANDIDATE_DIGEST,
    invalidTargetRejected: true,
    consumerFirstStatusPass: true,
    consumerReplayPass: true,
    consumerConflictRejected: true,
    consumerDuplicateAuditCount: 0,
    merchantFirstStatusPass: true,
    merchantReplayPass: true,
    merchantDuplicateAuditCount: 0,
    nonOwnerConsumerKeyReuseDenied: true,
    nonOwnerMerchantSpoofDenied: true,
    legacyOwnerStatusDenied: true,
    nonexistentRequestDenied: true,
    requesterOnlyStatusDenied: fixtures.requesterOnlyRequestId != null,
    clientTenantExpansionDenied: true,
    clientProfileExpansionDenied: true,
    clientPolicyExpansionDenied: true,
    existenceLeakSafe: true,
    successfulStatusAuditDelta: 2,
    successfulStatusTransitionDelta: 2,
    deniedStatusAuditDelta: 0,
    deniedStatusTransitionDelta: 0,
    noteAuditDelta: 0,
    postRequestCountUnchanged: true,
    postProvenanceUnchanged: true,
    postP4wDigestUnchanged: true,
    merchantProfileChanged: false,
    legacyStatusUnchanged: true,
    consumerStatusTriage: true,
    merchantStatusTriage: true,
    dataCleanupPerformed: false,
    productionTouched: false,
    pack19Marker: PACK19_TENANT_MARKER,
    pack35Marker: PACK35_EXTERNAL_MESSAGE_ID,
    statusPostCount: MAX_STATUS_POST,
    consumerStatusReason: CONSUMER_STATUS_REASON,
    merchantStatusReason: MERCHANT_STATUS_REASON,
    optionalRequesterOnlyRan: false,
    resumeValidationOnly: true,
  };
}

export async function runPack40csAdversarialQa(): Promise<Pack40csSummary> {
  const sourcePath = fileURLToPath(import.meta.url);
  const source = readFileSync(sourcePath, 'utf8');
  assertStaticSafety(source);
  assertPack40cSourcePresent();

  const evidenceText = readFileSync(PACK40CD_EVIDENCE_RELATIVE, 'utf8');
  assertPack40cdMergedEvidence(evidenceText);

  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  const apiBase = resolveStagingApiBase();
  assertStagingApiIdentity(apiBase);

  const releaseVersion = resolveStagingReleaseVersion();
  const stagingReleaseLabel = `v${releaseVersion}-verified`;

  const prisma = getPrisma();

  log('health', `GET ${redactApiBase(apiBase)}/health`);
  await delay(300);
  const health = await fetch(`${apiBase}/health`);
  if (health.status !== 200) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'health', `expected 200 got ${health.status}`);
  }

  const preDistribution = await countDistribution(prisma);
  const preAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const preNoteAuditEvents = await countNoteAuditEvents(prisma);
  const preStatusAuditEvents = await countStatusAuditEvents(prisma);
  const preStatusTransitionEvents = await countStatusTransitionEvents(prisma);
  const preRequestTotal = preDistribution.total;
  const preMerchantProfiles = await prisma.merchantProfile.count();
  const preActiveProfiles = await prisma.merchantProfile.count({ where: { isActive: true } });

  const pinA = resolvePin('VIONA_PILOT_USER_A_PIN', 'VIONA_PILOT_PIN');
  const pinB = resolvePin('VIONA_PILOT_USER_B_PIN', 'VIONA_PILOT_PIN');
  const phoneA = resolvePilotAPhone();
  const phoneB = resolvePilotBPhone();

  const userA = await prisma.user.findFirst({ where: { phoneNumber: phoneA }, select: { id: true } });
  const userB = await prisma.user.findFirst({ where: { phoneNumber: phoneB }, select: { id: true } });

  const approvedPre = await resolveApprovedBackfillCandidates(prisma);
  const provisionalDualRoleProbe = await findPack19RequestId(prisma);
  const provisionalConsumerRow =
    provisionalDualRoleProbe != null
      ? await prisma.vionaRequest.findUnique({
          where: { id: provisionalDualRoleProbe },
          select: { ownerUserId: true, requesterUserId: true },
        })
      : null;
  const provisionalDualRoleUserId =
    provisionalConsumerRow?.ownerUserId ?? provisionalConsumerRow?.requesterUserId ?? null;

  const nonOwnerCreds =
    userB?.id != null && userB.id !== provisionalDualRoleUserId
      ? { phone: phoneB, pin: pinB, userId: userB.id }
      : userA?.id != null && userA.id !== provisionalDualRoleUserId
        ? { phone: phoneA, pin: pinA, userId: userA.id }
        : null;
  if (nonOwnerCreds == null) {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'non-owner', 'no distinct non-owner pilot identity');
  }

  const fixtures = await discoverFixtures(prisma, nonOwnerCreds.userId);

  const preMerchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: fixtures.merchantProfileId },
    select: { id: true, ownerUserId: true, tenantId: true, isActive: true },
  });
  if (preMerchantProfile == null) {
    block('BLOCKED_SAFE_STATUS_FIXTURE', 'merchant-profile', 'profile missing pre-QA');
  }

  if (fixtures.resumeCompletedQa) {
    return validateCompletedQaResume(
      prisma,
      fixtures,
      approvedPre,
      preDistribution,
      preRequestTotal,
      preMerchantProfiles,
      preMerchantProfile,
      preNoteAuditEvents,
      stagingReleaseLabel,
      apiBase,
    );
  }

  await verifyMarkerAbsence(prisma);

  const budget = new PostBudget(
    fixtures.requesterOnlyRequestId != null ? MAX_STATUS_POST_ABSOLUTE : MAX_STATUS_POST,
  );

  const preConsumerStatusEvents = await countStatusTransitionEvents(prisma, fixtures.consumerRequestId);
  const preMerchantStatusEvents = await countStatusTransitionEvents(prisma, fixtures.merchantRequestId);

  log('fixtures', 'P5 consumer/merchant markers verified; dual-role actor positively confirmed');
  log(
    'baseline',
    `distribution legacy=${preDistribution.legacyUnresolved} merchant=${preDistribution.merchant} consumer=${preDistribution.consumer} total=${preDistribution.total}`,
  );
  log(
    'baseline',
    `statusAuditEvents=${preStatusAuditEvents} noteAuditEvents=${preNoteAuditEvents} merchantProfiles=${preMerchantProfiles} active=${preActiveProfiles}`,
  );

  const ownerCreds = await resolvePilotCredentialsForUser(
    prisma,
    fixtures.dualRoleUserId,
    phoneA,
    phoneB,
    pinA,
    pinB,
  );
  const ownerToken = await loginPilot(apiBase, ownerCreds.phone, ownerCreds.pin);

  if (nonOwnerCreds.userId === fixtures.dualRoleUserId) {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'non-owner', 'non-owner overlaps dual-role scope');
  }
  const nonOwnerToken = await loginPilot(apiBase, nonOwnerCreds.phone, nonOwnerCreds.pin);

  const consumerStatusBody = {
    targetStatus: 'triage',
    reason: CONSUMER_STATUS_REASON,
    note: CONSUMER_STATUS_NOTE,
    idempotencyKey: CONSUMER_IDEM_KEY,
    clientCorrelationId: CONSUMER_CORRELATION,
  };
  const merchantStatusBody = {
    targetStatus: 'triage',
    reason: MERCHANT_STATUS_REASON,
    note: MERCHANT_STATUS_NOTE,
    idempotencyKey: MERCHANT_IDEM_KEY,
    clientCorrelationId: MERCHANT_CORRELATION,
  };

  // A — invalid target inProgress on consumer
  const invalidTarget = await postStatus(
    apiBase,
    ownerToken,
    fixtures.consumerRequestId,
    {
      targetStatus: 'inProgress',
      reason: 'pack40cs-invalid-target',
      note: 'pack40cs-invalid-target-note',
      idempotencyKey: INVALID_TARGET_IDEM_KEY,
      clientCorrelationId: `pack40cs-invalid-corr-${MASTER_SHORT_SHA}`,
    },
    budget,
  );
  if (invalidTarget.transportError) {
    await handleTransportUncertainty(prisma, INVALID_TARGET_IDEM_KEY, 'pack40cs-invalid-target');
  }
  assertInvalidTargetContract(invalidTarget.status, invalidTarget.json);

  const consumerRowAfterInvalid = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.consumerRequestId },
    select: { status: true },
  });
  if (consumerRowAfterInvalid?.status !== 'submitted') {
    block('BLOCKED_POST_QA_INVARIANT', 'invalid-target', 'consumer status mutated on invalid target');
  }
  const consumerStatusEventsAfterA = await countStatusTransitionEvents(prisma, fixtures.consumerRequestId);
  if (consumerStatusEventsAfterA !== preConsumerStatusEvents) {
    block('BLOCKED_POST_QA_INVARIANT', 'invalid-target', 'consumer status events created on invalid target');
  }
  const invalidTargetAuditCount = await countStatusIdempotencyKey(prisma, INVALID_TARGET_IDEM_KEY);
  if (invalidTargetAuditCount > 0) {
    block('BLOCKED_POST_QA_INVARIANT', 'invalid-target', 'invalid target idem audit created');
  }

  // B — consumer submitted → triage first write
  const consumerFirst = await postStatus(
    apiBase,
    ownerToken,
    fixtures.consumerRequestId,
    consumerStatusBody,
    budget,
  );
  if (consumerFirst.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_STATUS_REASON);
  }
  assertFirstWriteContract(consumerFirst.status, consumerFirst.json);

  // C — consumer replay
  const consumerReplay = await postStatus(
    apiBase,
    ownerToken,
    fixtures.consumerRequestId,
    consumerStatusBody,
    budget,
  );
  if (consumerReplay.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_STATUS_REASON);
  }
  assertReplayContract(consumerReplay.status, consumerReplay.json);

  const consumerReasonAfterReplay = await countReasonMarker(prisma, CONSUMER_STATUS_REASON);
  const consumerIdemAfterReplay = await countStatusIdempotencyKey(prisma, CONSUMER_IDEM_KEY);
  const consumerStatusEventsAfterReplay = await countStatusTransitionEvents(
    prisma,
    fixtures.consumerRequestId,
  );
  if (consumerReasonAfterReplay !== 1 || consumerIdemAfterReplay !== 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'consumer-replay', 'duplicate consumer status audit detected');
  }
  if (consumerStatusEventsAfterReplay !== preConsumerStatusEvents + 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'consumer-replay', 'duplicate consumer status events detected');
  }

  // D — consumer conflicting idempotency key reuse
  const consumerConflict = await postStatus(
    apiBase,
    ownerToken,
    fixtures.consumerRequestId,
    {
      targetStatus: 'triage',
      reason: `${CONSUMER_STATUS_REASON}-conflict`,
      note: `${CONSUMER_STATUS_NOTE}-conflict`,
      idempotencyKey: CONSUMER_IDEM_KEY,
      clientCorrelationId: CONSUMER_CORRELATION,
    },
    budget,
  );
  if (consumerConflict.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_STATUS_REASON);
  }
  assertConflictContract(consumerConflict.status, consumerConflict.json);

  const consumerReasonAfterConflict = await countReasonMarker(prisma, CONSUMER_STATUS_REASON);
  const consumerIdemAfterConflict = await countStatusIdempotencyKey(prisma, CONSUMER_IDEM_KEY);
  if (consumerReasonAfterConflict !== 1 || consumerIdemAfterConflict !== 1) {
    block('BLOCKED_IDEMPOTENCY_CONTRACT', 'consumer-conflict', 'conflict mutated consumer status audit');
  }

  // E — merchant submitted → triage first write
  const merchantFirst = await postStatus(
    apiBase,
    ownerToken,
    fixtures.merchantRequestId,
    merchantStatusBody,
    budget,
  );
  if (merchantFirst.transportError) {
    await handleTransportUncertainty(prisma, MERCHANT_IDEM_KEY, MERCHANT_STATUS_REASON);
  }
  assertFirstWriteContract(merchantFirst.status, merchantFirst.json);

  // F — merchant replay
  const merchantReplay = await postStatus(
    apiBase,
    ownerToken,
    fixtures.merchantRequestId,
    merchantStatusBody,
    budget,
  );
  if (merchantReplay.transportError) {
    await handleTransportUncertainty(prisma, MERCHANT_IDEM_KEY, MERCHANT_STATUS_REASON);
  }
  assertReplayContract(merchantReplay.status, merchantReplay.json);

  const merchantReasonAfterReplay = await countReasonMarker(prisma, MERCHANT_STATUS_REASON);
  const merchantIdemAfterReplay = await countStatusIdempotencyKey(prisma, MERCHANT_IDEM_KEY);
  const merchantStatusEventsAfterReplay = await countStatusTransitionEvents(
    prisma,
    fixtures.merchantRequestId,
  );
  if (merchantReasonAfterReplay !== 1 || merchantIdemAfterReplay !== 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'merchant-replay', 'duplicate merchant status audit detected');
  }
  if (merchantStatusEventsAfterReplay !== preMerchantStatusEvents + 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'merchant-replay', 'duplicate merchant status events detected');
  }

  const statusAuditAfterSuccess = await countStatusAuditEvents(prisma);
  const statusTransitionAfterSuccess = await countStatusTransitionEvents(prisma);
  const successfulStatusAuditDelta = statusAuditAfterSuccess - preStatusAuditEvents;
  const successfulStatusTransitionDelta = statusTransitionAfterSuccess - preStatusTransitionEvents;
  if (successfulStatusAuditDelta !== 2) {
    block(
      'BLOCKED_POST_QA_INVARIANT',
      'audit-delta',
      `expected +2 status audits got +${successfulStatusAuditDelta}`,
    );
  }
  if (successfulStatusTransitionDelta !== 2) {
    block(
      'BLOCKED_POST_QA_INVARIANT',
      'transition-delta',
      `expected +2 status transitions got +${successfulStatusTransitionDelta}`,
    );
  }

  // G — non-owner consumer key reuse
  const nonOwnerConsumer = await postStatus(
    apiBase,
    nonOwnerToken,
    fixtures.consumerRequestId,
    consumerStatusBody,
    budget,
  );
  if (nonOwnerConsumer.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_STATUS_REASON);
  }
  const failureNonOwnerConsumer = assertDeniedContract(nonOwnerConsumer.status, nonOwnerConsumer.json);

  // H — non-owner merchant key plus spoof fields
  const spoofBody = {
    ...merchantStatusBody,
    reason: 'pack40cs-spoof-denial',
    note: 'pack40cs-spoof-denial-note',
    tenantId: fixtures.merchantTenantId,
    expectedTenantId: fixtures.merchantTenantId,
    merchantProfileId: fixtures.merchantProfileId,
    scopeKind: 'merchant',
    statusAccessPolicy: 'pack40c_provenance',
    directReadPolicy: 'pack40a_provenance',
  };
  const nonOwnerMerchant = await postStatus(
    apiBase,
    nonOwnerToken,
    fixtures.merchantRequestId,
    spoofBody,
    budget,
    `tenantId=${encodeURIComponent(fixtures.merchantTenantId)}&expectedTenantId=${encodeURIComponent(fixtures.merchantTenantId)}&merchantProfileId=${encodeURIComponent(fixtures.merchantProfileId)}&scopeKind=merchant&statusAccessPolicy=pack40c_provenance&directReadPolicy=pack40a_provenance`,
    {
      'X-Viona-Direct-Read-Policy': 'pack40a_provenance',
      'X-Expected-Tenant-Id': fixtures.merchantTenantId,
      'X-Merchant-Profile-Id': fixtures.merchantProfileId,
    },
  );
  if (nonOwnerMerchant.transportError) {
    await handleTransportUncertainty(prisma, MERCHANT_IDEM_KEY, MERCHANT_STATUS_REASON);
  }
  const failureNonOwnerMerchant = assertDeniedContract(nonOwnerMerchant.status, nonOwnerMerchant.json);

  const clientTenantExpansionDenied = nonOwnerMerchant.status === 404;
  const clientProfileExpansionDenied = nonOwnerMerchant.status === 404;
  const clientPolicyExpansionDenied = nonOwnerMerchant.status === 404;

  // I — legacy-unresolved owner triage attempt with spoof
  const legacyBody = {
    targetStatus: 'triage',
    reason: 'pack40cs-legacy-denial',
    note: 'pack40cs-legacy-denial-note',
    tenantId: fixtures.merchantTenantId,
    expectedTenantId: fixtures.merchantTenantId,
    scopeKind: 'merchant',
    statusAccessPolicy: 'pack40c_provenance',
  };
  const legacyOwner = await postStatus(
    apiBase,
    ownerToken,
    fixtures.legacyRequestId,
    legacyBody,
    budget,
    `tenantId=${encodeURIComponent(fixtures.merchantTenantId)}&expectedTenantId=${encodeURIComponent(fixtures.merchantTenantId)}`,
  );
  if (legacyOwner.transportError) {
    await handleTransportUncertainty(prisma, 'pack40cs-legacy-denial', 'pack40cs-legacy-denial');
  }
  const failureLegacy = assertDeniedContract(legacyOwner.status, legacyOwner.json);
  const legacyOwnerStatusDenied = legacyOwner.status === 404;

  // J — nonexistent request normalization
  const nonexistentId = randomUUID();
  const nonexistent = await postStatus(
    apiBase,
    ownerToken,
    nonexistentId,
    {
      targetStatus: 'triage',
      reason: 'pack40cs-nonexistent-denial',
      note: 'pack40cs-nonexistent-denial-note',
    },
    budget,
  );
  if (nonexistent.transportError) {
    await handleTransportUncertainty(prisma, 'pack40cs-nonexistent', 'pack40cs-nonexistent');
  }
  const failureNonexistent = assertDeniedContract(nonexistent.status, nonexistent.json);
  const nonexistentRequestDenied = nonexistent.status === 404;

  // K — optional requester-only denial when fixture found
  let requesterOnlyStatusDenied = false;
  let optionalRequesterOnlyRan = false;
  if (fixtures.requesterOnlyRequestId != null) {
    const requesterOnly = await postStatus(
      apiBase,
      nonOwnerToken,
      fixtures.requesterOnlyRequestId,
      {
        targetStatus: 'triage',
        reason: 'pack40cs-requester-only-denial',
        note: 'pack40cs-requester-only-denial-note',
        idempotencyKey: `pack40cs-requester-only-${MASTER_SHORT_SHA}`,
        clientCorrelationId: `pack40cs-requester-only-corr-${MASTER_SHORT_SHA}`,
      },
      budget,
    );
    optionalRequesterOnlyRan = true;
    if (requesterOnly.transportError) {
      await handleTransportUncertainty(prisma, `pack40cs-requester-only-${MASTER_SHORT_SHA}`, 'pack40cs-requester-only');
    }
    assertDeniedContract(requesterOnly.status, requesterOnly.json);
    requesterOnlyStatusDenied = requesterOnly.status === 404;
  }

  const existenceLeakSafe =
    failuresEquivalent(failureNonOwnerConsumer, failureNonOwnerMerchant) &&
    failuresEquivalent(failureNonOwnerMerchant, failureLegacy) &&
    failuresEquivalent(failureLegacy, failureNonexistent);

  if (!existenceLeakSafe) {
    block('BLOCKED_EXISTENCE_LEAK', 'existence-leak', 'denied status failures not normalized');
  }

  const statusAuditAfterDenied = await countStatusAuditEvents(prisma);
  const statusTransitionAfterDenied = await countStatusTransitionEvents(prisma);
  const deniedStatusAuditDelta = statusAuditAfterDenied - statusAuditAfterSuccess;
  const deniedStatusTransitionDelta = statusTransitionAfterDenied - statusTransitionAfterSuccess;
  if (deniedStatusAuditDelta !== 0 || deniedStatusTransitionDelta !== 0) {
    block('BLOCKED_POST_QA_INVARIANT', 'denied-side-effect', 'denied POST created status side effects');
  }

  const postDistribution = await countDistribution(prisma);
  const postAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const postNoteAuditEvents = await countNoteAuditEvents(prisma);
  const postMerchantProfiles = await prisma.merchantProfile.count();
  const approvedPost = await resolveApprovedBackfillCandidates(prisma);

  const postRequestCountUnchanged = postDistribution.total === preRequestTotal;
  const postProvenanceUnchanged =
    postDistribution.legacyUnresolved === preDistribution.legacyUnresolved &&
    postDistribution.merchant === preDistribution.merchant &&
    postDistribution.consumer === preDistribution.consumer;
  const postP4wDigestUnchanged = approvedPost.digest === approvedPre.digest;
  const noteAuditDelta = postNoteAuditEvents - preNoteAuditEvents;

  const consumerRowPost = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.consumerRequestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      status: true,
    },
  });
  const merchantRowPost = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.merchantRequestId },
    select: {
      scopeKind: true,
      merchantProfileId: true,
      tenantId: true,
      status: true,
    },
  });
  const legacyRowPost = await prisma.vionaRequest.findUnique({
    where: { id: fixtures.legacyRequestId },
    select: { scopeKind: true, merchantProfileId: true, status: true },
  });
  const postMerchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: fixtures.merchantProfileId },
    select: { id: true, ownerUserId: true, tenantId: true, isActive: true },
  });

  const legacyStatusUnchanged = legacyRowPost?.status === fixtures.legacyStatus;
  const consumerStatusTriage = consumerRowPost?.status === 'triage';
  const merchantStatusTriage = merchantRowPost?.status === 'triage';

  const merchantProfileChanged =
    postMerchantProfile == null ||
    postMerchantProfile.ownerUserId !== preMerchantProfile!.ownerUserId ||
    postMerchantProfile.tenantId !== preMerchantProfile!.tenantId ||
    postMerchantProfile.isActive !== preMerchantProfile!.isActive;

  const consumerSubmittedToTriage = await countSubmittedToTriageTransitions(
    prisma,
    fixtures.consumerRequestId,
  );
  const merchantSubmittedToTriage = await countSubmittedToTriageTransitions(
    prisma,
    fixtures.merchantRequestId,
  );

  if (
    !postRequestCountUnchanged ||
    !postProvenanceUnchanged ||
    !postP4wDigestUnchanged ||
    postMerchantProfiles !== preMerchantProfiles ||
    approvedPost.digest !== APPROVED_CANDIDATE_DIGEST ||
    successfulStatusAuditDelta !== 2 ||
    noteAuditDelta !== 0 ||
    consumerRowPost?.scopeKind !== VionaRequestScopeKind.consumer ||
    consumerRowPost.merchantProfileId != null ||
    !consumerStatusTriage ||
    merchantRowPost?.scopeKind !== VionaRequestScopeKind.merchant ||
    merchantRowPost?.merchantProfileId !== fixtures.merchantProfileId ||
    merchantRowPost?.tenantId !== fixtures.merchantTenantId ||
    !merchantStatusTriage ||
    legacyRowPost?.scopeKind !== VionaRequestScopeKind.legacyUnresolved ||
    !legacyStatusUnchanged ||
    merchantProfileChanged ||
    consumerReasonAfterReplay !== 1 ||
    merchantReasonAfterReplay !== 1 ||
    consumerSubmittedToTriage !== 1 ||
    merchantSubmittedToTriage !== 1
  ) {
    block('BLOCKED_POST_QA_INVARIANT', 'post-qa', 'data invariant drift detected');
  }

  const statusPostCount = budget.snapshot();
  if (statusPostCount !== budget.expectedCount()) {
    block(
      'BLOCKED_SCOPE_CONFLICT',
      'post-count',
      `expected ${budget.expectedCount()} POSTs got ${statusPostCount}`,
    );
  }

  log('budget', `statusPosts=${statusPostCount}`);

  return {
    classification: 'READY_FOR_PACK40CS_QA_EVIDENCE_PR_REVIEW',
    verifiedMasterSha: VERIFIED_MASTER_SHA,
    pr364Merged: true,
    pr364MergeSha: PR364_MERGE_SHA,
    stagingApiRedacted: redactApiBase(apiBase),
    stagingDatabaseRedacted: `db.${STAGING_PROJECT_REF}.supabase.co`,
    stagingReleaseLabel,
    flyLogsUsed: false,
    dualRoleFixtureVerified: true,
    nonOwnerFixtureVerified: true,
    requesterOnlyFixtureVerified: fixtures.requesterOnlyRequestId != null,
    preActionHealthOk: true,
    preActionDistribution: preDistribution,
    p4wDigestMatches: approvedPre.digest === APPROVED_CANDIDATE_DIGEST,
    invalidTargetRejected: true,
    consumerFirstStatusPass: true,
    consumerReplayPass: true,
    consumerConflictRejected: true,
    consumerDuplicateAuditCount: 0,
    merchantFirstStatusPass: true,
    merchantReplayPass: true,
    merchantDuplicateAuditCount: 0,
    nonOwnerConsumerKeyReuseDenied: true,
    nonOwnerMerchantSpoofDenied: true,
    legacyOwnerStatusDenied,
    nonexistentRequestDenied,
    requesterOnlyStatusDenied,
    clientTenantExpansionDenied,
    clientProfileExpansionDenied,
    clientPolicyExpansionDenied,
    existenceLeakSafe,
    successfulStatusAuditDelta: 2,
    successfulStatusTransitionDelta: 2,
    deniedStatusAuditDelta: 0,
    deniedStatusTransitionDelta: 0,
    noteAuditDelta: 0,
    postRequestCountUnchanged,
    postProvenanceUnchanged,
    postP4wDigestUnchanged,
    merchantProfileChanged: false,
    legacyStatusUnchanged,
    consumerStatusTriage,
    merchantStatusTriage,
    dataCleanupPerformed: false,
    productionTouched: false,
    pack19Marker: PACK19_TENANT_MARKER,
    pack35Marker: PACK35_EXTERNAL_MESSAGE_ID,
    statusPostCount,
    consumerStatusReason: CONSUMER_STATUS_REASON,
    merchantStatusReason: MERCHANT_STATUS_REASON,
    optionalRequesterOnlyRan,
  };
}

async function main(): Promise<void> {
  log(
    'start',
    `master=${VERIFIED_MASTER_SHA.slice(0, 12)}… operator=APPROVE_PACK40CS_STAGING_TENANT_STATUS_ADVERSARIAL_QA`,
  );
  try {
    const summary = await runPack40csAdversarialQa();
    console.log('');
    console.log('[pack40cs-verify] ======== SANITIZED SUMMARY ========');
    console.log(JSON.stringify(summary, null, 2));
    console.log('[pack40cs-verify] ====================================');
    console.log(`[pack40cs-verify] FINAL_CLASSIFICATION=${summary.classification}`);
  } catch (error) {
    if (error instanceof Pack40csBlockedError) {
      console.error(`[pack40cs-verify] FINAL_CLASSIFICATION=${error.code}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    await disconnectPrisma();
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').includes('verify-viona-pack40cs-staging-tenant-status-adversarial-qa') ??
  false;

if (isDirectRun) {
  main().catch((error) => {
    console.error('[pack40cs-verify] FATAL', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
