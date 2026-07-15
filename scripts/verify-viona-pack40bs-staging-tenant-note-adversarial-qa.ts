/**
 * Pack40BS — Staging tenant note adversarial QA (POST note action only).
 *
 * Operator phrase: APPROVE_PACK40BS_STAGING_TENANT_NOTE_ADVERSARIAL_QA
 *
 * Never prints or commits raw identifiers, credentials, or tokens.
 *
 * Usage: npx tsx scripts/verify-viona-pack40bs-staging-tenant-note-adversarial-qa.ts
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

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(REPO_ROOT, '.env.local'), override: true });
loadEnv({ path: path.join(REPO_ROOT, '.env') });

export const VERIFIED_MASTER_SHA = '44ff2f76a1b32b4423e51e141ad5415955620021';
export const PR358_MERGE_SHA = VERIFIED_MASTER_SHA;
export const MASTER_SHORT_SHA = VERIFIED_MASTER_SHA.slice(0, 7);
export const PACK40BD_EVIDENCE_RELATIVE =
  'docs/product/VIONA_PACK40BD_STAGING_NOTE_ENFORCEMENT_DEPLOYMENT_EVIDENCE.md';
export const STAGING_API_APP_NAME = 'viona-api-staging-eu';
export const STAGING_API_BASE_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
export const MIN_STAGING_RELEASE = 25;

export const PACK19_TENANT_MARKER = 'pack40p5-consumer-ee22193';
export const PACK19_IDEMPOTENCY_KEY = 'pack40p5-consumer-create-ee22193';
export const PACK35_EXTERNAL_MESSAGE_ID = 'pack40p5-webhook-ee22193';
export const PACK36A_CHANNEL_TYPE = 'custom_client';
export const PACK36A_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
export const EXCLUDED_LEGACY_TARGET = 5;

export const CONSUMER_NOTE_MARKER = `pack40bs-consumer-note-${MASTER_SHORT_SHA}`;
export const MERCHANT_NOTE_MARKER = `pack40bs-merchant-note-${MASTER_SHORT_SHA}`;
export const CONSUMER_IDEM_KEY = `pack40bs-consumer-idem-${MASTER_SHORT_SHA}`;
export const MERCHANT_IDEM_KEY = `pack40bs-merchant-idem-${MASTER_SHORT_SHA}`;
export const CONSUMER_CORRELATION = `pack40bs-consumer-corr-${MASTER_SHORT_SHA}`;
export const MERCHANT_CORRELATION = `pack40bs-merchant-corr-${MASTER_SHORT_SHA}`;

export const MAX_NOTE_POST = 8;

const NOTE_ENDPOINT_SUFFIX = '/actions/note';

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
  /method:\s*['"]POST['"][\s\S]{0,120}\/actions\/status/,
  /method:\s*['"]POST['"][\s\S]{0,120}\/actions\/execution/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]DELETE['"]/,
  /method:\s*['"]PUT['"]/,
] as const;

export type Pack40bsBlockedCode =
  | 'BLOCKED_PACK40BD_EVIDENCE_NOT_MERGED'
  | 'BLOCKED_RELEASE_MISMATCH'
  | 'BLOCKED_ENVIRONMENT_IDENTITY'
  | 'BLOCKED_DUAL_ROLE_STAGING_FIXTURE'
  | 'BLOCKED_SAFE_AUTH_FIXTURE'
  | 'BLOCKED_SAFE_NOTE_FIXTURE'
  | 'BLOCKED_NOTE_ACTION_CONTRACT'
  | 'BLOCKED_UNCERTAIN_WRITE_OUTCOME'
  | 'BLOCKED_AUTHORIZATION_BEHAVIOR'
  | 'BLOCKED_EXISTENCE_LEAK'
  | 'BLOCKED_POST_QA_INVARIANT'
  | 'BLOCKED_SCOPE_CONFLICT';

export class Pack40bsBlockedError extends Error {
  constructor(
    readonly code: Pack40bsBlockedCode,
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${code}: ${stage}: ${detail}`);
    this.name = 'Pack40bsBlockedError';
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

export type NoteActionMeta = Readonly<{
  firstWriteStatus: number;
  replayStatus: number;
  idempotentReplay: boolean;
  eventType: string | null;
}>;

export type Pack40bsSummary = Readonly<{
  classification:
    | 'READY_FOR_PACK40BS_QA_EVIDENCE_PR_REVIEW'
    | 'PACK40B_STAGING_NOTE_ADVERSARIAL_QA_GREEN';
  verifiedMasterSha: string;
  pr358Merged: true;
  pr358MergeSha: string;
  stagingApiRedacted: string;
  stagingDatabaseRedacted: string;
  stagingReleaseLabel: string;
  flyLogsUsed: false;
  dualRoleFixtureVerified: boolean;
  nonOwnerFixtureVerified: boolean;
  preActionHealthOk: boolean;
  preActionDistribution: ProvenanceDistribution;
  p4wDigestMatches: boolean;
  consumerFirstNotePass: boolean;
  consumerReplayPass: boolean;
  consumerDuplicateAuditCount: number;
  merchantFirstNotePass: boolean;
  merchantReplayPass: boolean;
  merchantDuplicateAuditCount: number;
  nonOwnerConsumerReplayDenied: boolean;
  nonOwnerMerchantReplayDenied: boolean;
  legacyOwnerNoteDenied: boolean;
  nonexistentRequestDenied: boolean;
  clientTenantExpansionDenied: boolean;
  clientProfileExpansionDenied: boolean;
  clientPolicyExpansionDenied: boolean;
  existenceLeakSafe: boolean;
  successfulNoteAuditDelta: number;
  deniedNoteAuditDelta: number;
  postRequestCountUnchanged: boolean;
  postProvenanceUnchanged: boolean;
  postP4wDigestUnchanged: boolean;
  merchantProfileChanged: false;
  requestStatusChanged: false;
  dataCleanupPerformed: false;
  productionTouched: false;
  pack19Marker: string;
  pack35Marker: string;
  notePostCount: number;
  consumerNoteMarker: string;
  merchantNoteMarker: string;
}>;

type FixtureBundle = Readonly<{
  consumerRequestId: string;
  merchantRequestId: string;
  legacyRequestId: string;
  dualRoleUserId: string;
  merchantProfileId: string;
  merchantTenantId: string;
  consumerStatus: string;
  merchantStatus: string;
  legacyStatus: string;
  merchantProfileActive: boolean;
}>;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack40bs-verify] ${stage}: ${detail}` : `[pack40bs-verify] ${stage}`);
}

export function block(code: Pack40bsBlockedCode, stage: string, detail: string): never {
  console.error(`[pack40bs-verify] ${code} @ ${stage}: ${detail}`);
  throw new Pack40bsBlockedError(code, stage, detail);
}

export function assertStaticSafety(source: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      block('BLOCKED_SCOPE_CONFLICT', 'static-safety', `forbidden pattern ${pattern}`);
    }
  }
  if (!source.includes(NOTE_ENDPOINT_SUFFIX)) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'note endpoint missing');
  }
  if (!source.includes("method: 'POST'") && !source.includes('method: "POST"')) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'POST helper missing');
  }
}

export function assertPack40bdMergedEvidence(evidenceText: string): void {
  if (!evidenceText.includes('PACK40B_TRANSACTIONAL_NOTE_ENFORCEMENT_DEPLOYED_TO_STAGING')) {
    block('BLOCKED_PACK40BD_EVIDENCE_NOT_MERGED', 'pack40bd-evidence', 'deployed marker missing');
  }
  if (!evidenceText.includes('v25')) {
    block('BLOCKED_PACK40BD_EVIDENCE_NOT_MERGED', 'pack40bd-evidence', 'v25 release marker missing');
  }
}

export function assertPack40bSourcePresent(): void {
  const noteServicePath = path.join(REPO_ROOT, 'src/services/viona/vionaRequestNoteActionService.ts');
  const principalPath = path.join(REPO_ROOT, 'src/services/viona/vionaRequestNotePrincipalContext.ts');
  const noteService = readFileSync(noteServicePath, 'utf8');
  const principal = readFileSync(principalPath, 'utf8');
  if (!noteService.includes('TransactionIsolationLevel.Serializable')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'Serializable isolation missing');
  }
  if (!noteService.includes('executeAuthorizedNoteMutation')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'transactional note mutation missing');
  }
  if (!noteService.includes('resolveVionaRequestNotePrincipalContext')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'in-transaction principal missing');
  }
  if (noteService.includes('findIdempotentNoteAuditEvent') === false) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'idempotency helper missing');
  }
  const appendFn = noteService.slice(noteService.indexOf('export async function appendVionaRequestNote'));
  const txIdx = appendFn.indexOf('prisma.$transaction');
  if (txIdx >= 0 && appendFn.slice(0, txIdx).includes('findIdempotentNoteAuditEvent')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'pre-transaction idempotency path suspected');
  }
  if (!principal.includes('tx.merchantProfile.findUnique')) {
    block('BLOCKED_RELEASE_MISMATCH', 'source-audit', 'tx-scoped profile lookup missing');
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

  consume(): void {
    this.posts += 1;
    if (this.posts > MAX_NOTE_POST) {
      block('BLOCKED_SCOPE_CONFLICT', 'request-budget', 'note POST budget exceeded');
    }
  }

  snapshot(): number {
    return this.posts;
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

function parseNoteActionMeta(
  status: number,
  json: Record<string, unknown> | null,
): NoteActionMeta | null {
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

function assertFirstWriteContract(status: number, json: Record<string, unknown> | null): void {
  if (status !== 201 || json?.success !== true) {
    block('BLOCKED_NOTE_ACTION_CONTRACT', 'first-write', `expected 201 success got ${status}`);
  }
  const meta = parseNoteActionMeta(status, json);
  if (meta == null || meta.idempotentReplay || meta.eventType !== 'action.note') {
    block('BLOCKED_NOTE_ACTION_CONTRACT', 'first-write', 'action.note first-write contract failed');
  }
}

function assertReplayContract(status: number, json: Record<string, unknown> | null): void {
  if (status !== 200 || json?.success !== true) {
    block('BLOCKED_NOTE_ACTION_CONTRACT', 'replay', `expected 200 success got ${status}`);
  }
  const meta = parseNoteActionMeta(status, json);
  if (meta == null || !meta.idempotentReplay || meta.eventType !== 'action.note') {
    block('BLOCKED_NOTE_ACTION_CONTRACT', 'replay', 'idempotent replay contract failed');
  }
}

function assertDeniedContract(status: number, json: Record<string, unknown> | null): NormalizedFailure {
  const failure = normalizeFailure(status, json);
  if (status !== 404 || failure.errorCode !== 'Request not found' || failure.success) {
    block('BLOCKED_AUTHORIZATION_BEHAVIOR', 'denied', `expected 404 Request not found got ${status}`);
  }
  return failure;
}

async function postNote(
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

  const url = `${base}/api/viona/requests/${encodeURIComponent(requestId)}/actions/note${
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

async function countIdempotencyKey(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
  idempotencyKey: string,
): Promise<number> {
  return prisma.vionaRequestAuditEvent.count({
    where: {
      eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
      payloadJson: { path: ['idempotencyKey'], equals: idempotencyKey },
    },
  });
}

async function countNoteMarker(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
  marker: string,
): Promise<number> {
  const rows = await prisma.vionaRequestAuditEvent.findMany({
    where: { eventType: VIONA_REQUEST_NOTE_EVENT_TYPE },
    select: { payloadJson: true },
    take: 500,
  });
  let count = 0;
  for (const row of rows) {
    const payload = row.payloadJson;
    if (payload != null && typeof payload === 'object' && !Array.isArray(payload)) {
      const note = (payload as Record<string, unknown>).note;
      if (typeof note === 'string' && note.includes(marker)) count += 1;
    }
  }
  return count;
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
  prisma: Pick<
    PrismaClient,
    'vionaRequest' | 'vionaRequestAuditEvent' | 'merchantProfile' | 'vionaMerchantWebhookChannel'
  >,
): Promise<FixtureBundle> {
  const consumerRequestId = await findPack19RequestId(prisma);
  const merchantRequestId = await findPack35RequestId(prisma);
  if (!consumerRequestId || !merchantRequestId) {
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'fixtures', 'P5 synthetic markers missing');
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
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'fixtures', 'consumer fixture provenance invalid');
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
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'fixtures', 'merchant fixture provenance invalid');
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
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'fixtures', 'Pack36A channel missing');
  }

  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: channel!.merchantProfileId },
    select: { id: true, tenantId: true, ownerUserId: true, isActive: true },
  });
  if (
    !merchantProfile ||
    merchantRow!.merchantProfileId !== merchantProfile.id ||
    merchantRow!.tenantId !== merchantProfile.tenantId
  ) {
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'fixtures', 'merchant fixture profile mismatch');
  }
  if (!merchantProfile.isActive) {
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'fixtures', 'merchant profile inactive');
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
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'legacy-count', `excluded legacy=${excludedLegacy.length}`);
  }

  const legacyCandidate = excludedLegacy.find((r) => userInScope(r, dualRoleUserId!));
  if (!legacyCandidate || legacyCandidate.merchantProfileId != null) {
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'legacy-fixture', 'no legacyUnresolved row with dual-role scope');
  }

  return {
    consumerRequestId,
    merchantRequestId,
    legacyRequestId: legacyCandidate.id,
    dualRoleUserId: dualRoleUserId!,
    merchantProfileId: merchantProfile!.id,
    merchantTenantId: merchantProfile!.tenantId,
    consumerStatus: consumerRow!.status,
    merchantStatus: merchantRow!.status,
    legacyStatus: legacyCandidate.status,
    merchantProfileActive: merchantProfile!.isActive,
  };
}

async function verifyMarkerAbsence(prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>): Promise<void> {
  const checks = [
    { label: 'consumer note marker', count: await countNoteMarker(prisma, CONSUMER_NOTE_MARKER) },
    { label: 'merchant note marker', count: await countNoteMarker(prisma, MERCHANT_NOTE_MARKER) },
    { label: 'consumer idem key', count: await countIdempotencyKey(prisma, CONSUMER_IDEM_KEY) },
    { label: 'merchant idem key', count: await countIdempotencyKey(prisma, MERCHANT_IDEM_KEY) },
  ];
  for (const check of checks) {
    if (check.count > 0) {
      block('BLOCKED_SAFE_NOTE_FIXTURE', 'marker-absence', `${check.label} already exists`);
    }
  }
}

async function handleTransportUncertainty(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
  idempotencyKey: string,
  marker: string,
): Promise<never> {
  const idemCount = await countIdempotencyKey(prisma, idempotencyKey);
  const markerCount = await countNoteMarker(prisma, marker);
  log(
    'transport-uncertainty',
    `idemCount=${idemCount} markerCount=${markerCount} (sanitized aggregate only)`,
  );
  block('BLOCKED_UNCERTAIN_WRITE_OUTCOME', 'transport', 'POST transport interrupted');
}

export async function runPack40bsAdversarialQa(): Promise<Pack40bsSummary> {
  const sourcePath = fileURLToPath(import.meta.url);
  const source = readFileSync(sourcePath, 'utf8');
  assertStaticSafety(source);
  assertPack40bSourcePresent();

  const evidenceText = readFileSync(PACK40BD_EVIDENCE_RELATIVE, 'utf8');
  assertPack40bdMergedEvidence(evidenceText);

  assertNotProductionDeployment();
  assertStagingDatabaseIdentity();

  const apiBase = resolveStagingApiBase();
  assertStagingApiIdentity(apiBase);

  const releaseVersion = resolveStagingReleaseVersion();
  const stagingReleaseLabel = `v${releaseVersion}-verified`;

  const prisma = getPrisma();
  const budget = new PostBudget();

  log('health', `GET ${redactApiBase(apiBase)}/health`);
  await delay(300);
  const health = await fetch(`${apiBase}/health`);
  if (health.status !== 200) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'health', `expected 200 got ${health.status}`);
  }

  const preDistribution = await countDistribution(prisma);
  const preAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const preNoteAuditEvents = await countNoteAuditEvents(prisma);
  const preRequestTotal = preDistribution.total;
  const preMerchantProfiles = await prisma.merchantProfile.count();
  const preActiveProfiles = await prisma.merchantProfile.count({ where: { isActive: true } });

  const approvedPre = await resolveApprovedBackfillCandidates(prisma);
  const fixtures = await discoverFixtures(prisma);
  await verifyMarkerAbsence(prisma);

  const preMerchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: fixtures.merchantProfileId },
    select: { id: true, ownerUserId: true, tenantId: true, isActive: true },
  });
  if (preMerchantProfile == null) {
    block('BLOCKED_SAFE_NOTE_FIXTURE', 'merchant-profile', 'profile missing pre-QA');
  }

  log('fixtures', 'P5 consumer/merchant markers verified; dual-role actor positively confirmed');
  log(
    'baseline',
    `distribution legacy=${preDistribution.legacyUnresolved} merchant=${preDistribution.merchant} consumer=${preDistribution.consumer} total=${preDistribution.total}`,
  );
  log('baseline', `noteAuditEvents=${preNoteAuditEvents} merchantProfiles=${preMerchantProfiles} active=${preActiveProfiles}`);

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

  if (
    userInScope(
      { ownerUserId: fixtures.dualRoleUserId, requesterUserId: fixtures.dualRoleUserId },
      nonOwnerCreds.userId,
    )
  ) {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'non-owner', 'non-owner overlaps dual-role scope');
  }

  const consumerNoteBody = {
    note: CONSUMER_NOTE_MARKER,
    idempotencyKey: CONSUMER_IDEM_KEY,
    clientCorrelationId: CONSUMER_CORRELATION,
  };
  const merchantNoteBody = {
    note: MERCHANT_NOTE_MARKER,
    idempotencyKey: MERCHANT_IDEM_KEY,
    clientCorrelationId: MERCHANT_CORRELATION,
  };

  // A — successful consumer note
  const consumerFirst = await postNote(
    apiBase,
    ownerToken,
    fixtures.consumerRequestId,
    consumerNoteBody,
    budget,
  );
  if (consumerFirst.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_NOTE_MARKER);
  }
  assertFirstWriteContract(consumerFirst.status, consumerFirst.json);

  // B — consumer replay
  const consumerReplay = await postNote(
    apiBase,
    ownerToken,
    fixtures.consumerRequestId,
    consumerNoteBody,
    budget,
  );
  if (consumerReplay.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_NOTE_MARKER);
  }
  assertReplayContract(consumerReplay.status, consumerReplay.json);

  const consumerMarkerAfterReplay = await countNoteMarker(prisma, CONSUMER_NOTE_MARKER);
  const consumerIdemAfterReplay = await countIdempotencyKey(prisma, CONSUMER_IDEM_KEY);
  if (consumerMarkerAfterReplay !== 1 || consumerIdemAfterReplay !== 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'consumer-replay', 'duplicate consumer note detected');
  }

  // C — successful merchant note
  const merchantFirst = await postNote(
    apiBase,
    ownerToken,
    fixtures.merchantRequestId,
    merchantNoteBody,
    budget,
  );
  if (merchantFirst.transportError) {
    await handleTransportUncertainty(prisma, MERCHANT_IDEM_KEY, MERCHANT_NOTE_MARKER);
  }
  assertFirstWriteContract(merchantFirst.status, merchantFirst.json);

  // D — merchant replay
  const merchantReplay = await postNote(
    apiBase,
    ownerToken,
    fixtures.merchantRequestId,
    merchantNoteBody,
    budget,
  );
  if (merchantReplay.transportError) {
    await handleTransportUncertainty(prisma, MERCHANT_IDEM_KEY, MERCHANT_NOTE_MARKER);
  }
  assertReplayContract(merchantReplay.status, merchantReplay.json);

  const merchantMarkerAfterReplay = await countNoteMarker(prisma, MERCHANT_NOTE_MARKER);
  const merchantIdemAfterReplay = await countIdempotencyKey(prisma, MERCHANT_IDEM_KEY);
  if (merchantMarkerAfterReplay !== 1 || merchantIdemAfterReplay !== 1) {
    block('BLOCKED_POST_QA_INVARIANT', 'merchant-replay', 'duplicate merchant note detected');
  }

  const noteAuditAfterSuccess = await countNoteAuditEvents(prisma);
  const successfulNoteAuditDelta = noteAuditAfterSuccess - preNoteAuditEvents;
  if (successfulNoteAuditDelta !== 2) {
    block(
      'BLOCKED_POST_QA_INVARIANT',
      'audit-delta',
      `expected +2 note audits got +${successfulNoteAuditDelta}`,
    );
  }

  // E — non-owner possessing consumer key
  const nonOwnerConsumer = await postNote(
    apiBase,
    nonOwnerToken,
    fixtures.consumerRequestId,
    consumerNoteBody,
    budget,
  );
  if (nonOwnerConsumer.transportError) {
    await handleTransportUncertainty(prisma, CONSUMER_IDEM_KEY, CONSUMER_NOTE_MARKER);
  }
  const failureNonOwnerConsumer = assertDeniedContract(nonOwnerConsumer.status, nonOwnerConsumer.json);

  // F — non-owner possessing merchant key plus spoof fields
  const spoofBody = {
    ...merchantNoteBody,
    note: 'pack40bs-spoof-denial',
    tenantId: fixtures.merchantTenantId,
    expectedTenantId: fixtures.merchantTenantId,
    merchantProfileId: fixtures.merchantProfileId,
    scopeKind: 'merchant',
    noteAccessPolicy: 'pack40b_provenance',
    directReadPolicy: 'pack40a_provenance',
  };
  const nonOwnerMerchant = await postNote(
    apiBase,
    nonOwnerToken,
    fixtures.merchantRequestId,
    spoofBody,
    budget,
    `tenantId=${encodeURIComponent(fixtures.merchantTenantId)}&expectedTenantId=${encodeURIComponent(fixtures.merchantTenantId)}&merchantProfileId=${encodeURIComponent(fixtures.merchantProfileId)}&scopeKind=merchant&noteAccessPolicy=pack40b_provenance&directReadPolicy=pack40a_provenance`,
    {
      'X-Viona-Direct-Read-Policy': 'pack40a_provenance',
      'X-Expected-Tenant-Id': fixtures.merchantTenantId,
      'X-Merchant-Profile-Id': fixtures.merchantProfileId,
    },
  );
  if (nonOwnerMerchant.transportError) {
    await handleTransportUncertainty(prisma, MERCHANT_IDEM_KEY, MERCHANT_NOTE_MARKER);
  }
  const failureNonOwnerMerchant = assertDeniedContract(nonOwnerMerchant.status, nonOwnerMerchant.json);

  const clientTenantExpansionDenied = nonOwnerMerchant.status === 404;
  const clientProfileExpansionDenied = nonOwnerMerchant.status === 404;
  const clientPolicyExpansionDenied = nonOwnerMerchant.status === 404;

  // G — legacy-unresolved owner attempt
  const legacyBody = {
    note: 'pack40bs-legacy-denial',
    tenantId: fixtures.merchantTenantId,
    expectedTenantId: fixtures.merchantTenantId,
    scopeKind: 'merchant',
    noteAccessPolicy: 'pack40b_provenance',
  };
  const legacyOwner = await postNote(
    apiBase,
    ownerToken,
    fixtures.legacyRequestId,
    legacyBody,
    budget,
    `tenantId=${encodeURIComponent(fixtures.merchantTenantId)}&expectedTenantId=${encodeURIComponent(fixtures.merchantTenantId)}`,
  );
  if (legacyOwner.transportError) {
    await handleTransportUncertainty(prisma, 'pack40bs-legacy-denial', 'pack40bs-legacy-denial');
  }
  const failureLegacy = assertDeniedContract(legacyOwner.status, legacyOwner.json);
  const legacyOwnerNoteDenied = legacyOwner.status === 404;

  // H — nonexistent request normalization
  const nonexistentId = randomUUID();
  const nonexistent = await postNote(
    apiBase,
    ownerToken,
    nonexistentId,
    { note: 'pack40bs-nonexistent-denial' },
    budget,
  );
  if (nonexistent.transportError) {
    await handleTransportUncertainty(prisma, 'pack40bs-nonexistent', 'pack40bs-nonexistent');
  }
  const failureNonexistent = assertDeniedContract(nonexistent.status, nonexistent.json);
  const nonexistentRequestDenied = nonexistent.status === 404;

  const existenceLeakSafe =
    failuresEquivalent(failureNonOwnerConsumer, failureNonOwnerMerchant) &&
    failuresEquivalent(failureNonOwnerMerchant, failureLegacy) &&
    failuresEquivalent(failureLegacy, failureNonexistent);

  if (!existenceLeakSafe) {
    block('BLOCKED_EXISTENCE_LEAK', 'existence-leak', 'denied note failures not normalized');
  }

  const noteAuditAfterDenied = await countNoteAuditEvents(prisma);
  const deniedNoteAuditDelta = noteAuditAfterDenied - noteAuditAfterSuccess;
  if (deniedNoteAuditDelta !== 0) {
    block('BLOCKED_POST_QA_INVARIANT', 'denied-side-effect', 'denied POST created note audit');
  }

  const postDistribution = await countDistribution(prisma);
  const postAuditEvents = await prisma.vionaRequestAuditEvent.count();
  const postMerchantProfiles = await prisma.merchantProfile.count();
  const approvedPost = await resolveApprovedBackfillCandidates(prisma);

  const postRequestCountUnchanged = postDistribution.total === preRequestTotal;
  const postProvenanceUnchanged =
    postDistribution.legacyUnresolved === preDistribution.legacyUnresolved &&
    postDistribution.merchant === preDistribution.merchant &&
    postDistribution.consumer === preDistribution.consumer;
  const postP4wDigestUnchanged = approvedPost.digest === approvedPre.digest;

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

  const requestStatusChanged =
    consumerRowPost?.status !== fixtures.consumerStatus ||
    merchantRowPost?.status !== fixtures.merchantStatus ||
    legacyRowPost?.status !== fixtures.legacyStatus;

  const merchantProfileChanged =
    postMerchantProfile == null ||
    postMerchantProfile.ownerUserId !== preMerchantProfile!.ownerUserId ||
    postMerchantProfile.tenantId !== preMerchantProfile!.tenantId ||
    postMerchantProfile.isActive !== preMerchantProfile!.isActive;

  if (
    !postRequestCountUnchanged ||
    !postProvenanceUnchanged ||
    !postP4wDigestUnchanged ||
    postMerchantProfiles !== preMerchantProfiles ||
    approvedPost.digest !== APPROVED_CANDIDATE_DIGEST ||
    postAuditEvents !== preAuditEvents + 2 ||
    consumerRowPost?.scopeKind !== VionaRequestScopeKind.consumer ||
    consumerRowPost.merchantProfileId != null ||
    merchantRowPost?.scopeKind !== VionaRequestScopeKind.merchant ||
    merchantRowPost?.merchantProfileId !== fixtures.merchantProfileId ||
    merchantRowPost?.tenantId !== fixtures.merchantTenantId ||
    legacyRowPost?.scopeKind !== VionaRequestScopeKind.legacyUnresolved ||
    requestStatusChanged ||
    merchantProfileChanged ||
    consumerMarkerAfterReplay !== 1 ||
    merchantMarkerAfterReplay !== 1
  ) {
    block('BLOCKED_POST_QA_INVARIANT', 'post-qa', 'data invariant drift detected');
  }

  const notePostCount = budget.snapshot();
  if (notePostCount !== MAX_NOTE_POST) {
    block('BLOCKED_SCOPE_CONFLICT', 'post-count', `expected ${MAX_NOTE_POST} POSTs got ${notePostCount}`);
  }

  log('budget', `notePosts=${notePostCount}`);

  return {
    classification: 'READY_FOR_PACK40BS_QA_EVIDENCE_PR_REVIEW',
    verifiedMasterSha: VERIFIED_MASTER_SHA,
    pr358Merged: true,
    pr358MergeSha: PR358_MERGE_SHA,
    stagingApiRedacted: redactApiBase(apiBase),
    stagingDatabaseRedacted: `db.${STAGING_PROJECT_REF}.supabase.co`,
    stagingReleaseLabel,
    flyLogsUsed: false,
    dualRoleFixtureVerified: true,
    nonOwnerFixtureVerified: true,
    preActionHealthOk: true,
    preActionDistribution: preDistribution,
    p4wDigestMatches: approvedPre.digest === APPROVED_CANDIDATE_DIGEST,
    consumerFirstNotePass: true,
    consumerReplayPass: true,
    consumerDuplicateAuditCount: 0,
    merchantFirstNotePass: true,
    merchantReplayPass: true,
    merchantDuplicateAuditCount: 0,
    nonOwnerConsumerReplayDenied: true,
    nonOwnerMerchantReplayDenied: true,
    legacyOwnerNoteDenied,
    nonexistentRequestDenied,
    clientTenantExpansionDenied,
    clientProfileExpansionDenied,
    clientPolicyExpansionDenied,
    existenceLeakSafe,
    successfulNoteAuditDelta: 2,
    deniedNoteAuditDelta: 0,
    postRequestCountUnchanged,
    postProvenanceUnchanged,
    postP4wDigestUnchanged,
    merchantProfileChanged: false,
    requestStatusChanged: false,
    dataCleanupPerformed: false,
    productionTouched: false,
    pack19Marker: PACK19_TENANT_MARKER,
    pack35Marker: PACK35_EXTERNAL_MESSAGE_ID,
    notePostCount,
    consumerNoteMarker: CONSUMER_NOTE_MARKER,
    merchantNoteMarker: MERCHANT_NOTE_MARKER,
  };
}

async function main(): Promise<void> {
  log(
    'start',
    `master=${VERIFIED_MASTER_SHA.slice(0, 12)}… operator=APPROVE_PACK40BS_STAGING_TENANT_NOTE_ADVERSARIAL_QA`,
  );
  try {
    const summary = await runPack40bsAdversarialQa();
    console.log('');
    console.log('[pack40bs-verify] ======== SANITIZED SUMMARY ========');
    console.log(JSON.stringify(summary, null, 2));
    console.log('[pack40bs-verify] ====================================');
    console.log(`[pack40bs-verify] FINAL_CLASSIFICATION=${summary.classification}`);
  } catch (error) {
    if (error instanceof Pack40bsBlockedError) {
      console.error(`[pack40bs-verify] FINAL_CLASSIFICATION=${error.code}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    await disconnectPrisma();
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').includes('verify-viona-pack40bs-staging-tenant-note-adversarial-qa') ??
  false;

if (isDirectRun) {
  main().catch((error) => {
    console.error('[pack40bs-verify] FATAL', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
