/**
 * Pack40DS — staging controlled indirect execution QA (live verify script).
 *
 * Operator phrase: APPROVE_PACK40DS_STAGING_CONTROLLED_INDIRECT_EXECUTION_QA
 *
 * Exactly one live Twilio test-SMS send through the Pack40D coordinator.
 * Never prints or commits raw IDs, phones, tokens, or SIDs.
 *
 * Usage: npx tsx scripts/verify-viona-pack40ds-staging-controlled-indirect-execution-qa.ts
 */

import 'dotenv/config';

import { createHash, randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import {
  VionaRequestExecutionAttemptState,
  VionaRequestEscrowHoldStatus,
  VionaRequestScopeKind,
  type PrismaClient,
} from '@prisma/client';

import {
  assertStagingDatabaseIdentity,
  STAGING_PROJECT_REF,
} from './apply-viona-pack40p4-merchant-backfill';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER } from '../src/lib/viona/internalRoute/vionaInternalRealTwilioPocRouteGate';
import { VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO } from '../src/services/viona/vionaPack40D3EscrowCoordination';
import { VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE } from '../src/services/viona/vionaRequestCreateFromWebhookService';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(REPO_ROOT, '.env.local'), override: true });
loadEnv({ path: path.join(REPO_ROOT, '.env') });

export const VERIFIED_MASTER_SHA = 'bd72de56953ad90fccf653059ad42b4ebd0bbea9';
export const PR374_MERGE_SHA = VERIFIED_MASTER_SHA;
export const MASTER_SHORT_SHA = VERIFIED_MASTER_SHA.slice(0, 7);

export const PACK40DD_EVIDENCE_RELATIVE =
  'docs/product/VIONA_PACK40DD_STAGING_INDIRECT_EXECUTION_DEPLOYMENT_EVIDENCE.md';

export const STAGING_API_APP_NAME = 'viona-api-staging-eu';
export const STAGING_API_BASE_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
export const MIN_STAGING_RELEASE = 27;

export const PACK19_TENANT_MARKER = 'pack40p5-consumer-ee22193';
export const PACK35_EXTERNAL_MESSAGE_ID = 'pack40p5-webhook-ee22193';
export const PACK36A_CHANNEL_TYPE = 'custom_client';
export const PACK36A_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
export const EXCLUDED_LEGACY_TARGET = 5;

export const EXECUTION_MARKER = `pack40ds-execution-${MASTER_SHORT_SHA}`;
export const CORRELATION_MARKER = `pack40ds-correlation-${MASTER_SHORT_SHA}`;
export const SMS_MARKER = `pack40ds-sms-${MASTER_SHORT_SHA}`;
export const SMS_BODY = `VIONA staging Pack40D test ${MASTER_SHORT_SHA}. No action required.`;

export const SAFE_TWILIO_DESTINATION = VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER;
export const ESCROW_AMOUNT_VIO = VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO;
export const ESCROW_SAFE_CAP_VIO = 1;

export const INTERNAL_EXECUTION_PATH = '/api/internal/viona/trigger-real-twilio-poc';

export const MAX_EXECUTION_POST = 5;
export const MAX_PROVIDER_SEND = 1;
export const MAX_ESCROW_HOLD = 1;
export const MAX_ESCROW_SETTLE = 1;

export const FORBIDDEN_PATTERNS = [
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
  /method:\s*['"]POST['"][\s\S]{0,160}\/api\/viona\/requests['"]/,
  /method:\s*['"]POST['"][\s\S]{0,160}\/actions\/note/,
  /method:\s*['"]POST['"][\s\S]{0,160}\/actions\/status/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]DELETE['"]/,
  /method:\s*['"]PUT['"]/,
] as const;

export type Pack40dsBlockedCode =
  | 'BLOCKED_PACK40DD_EVIDENCE_NOT_MERGED'
  | 'BLOCKED_PACK40D_RELEASE_MISMATCH'
  | 'BLOCKED_ENVIRONMENT_IDENTITY'
  | 'BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE'
  | 'BLOCKED_SAFE_PROVIDER_DESTINATION'
  | 'BLOCKED_ESCROW_AMOUNT_POLICY'
  | 'BLOCKED_SAFE_AUTH_FIXTURE'
  | 'BLOCKED_UNCERTAIN_EXECUTION_OUTCOME'
  | 'BLOCKED_PROVIDER_RESULT'
  | 'BLOCKED_ESCROW_RESULT'
  | 'BLOCKED_PACK40D_EXECUTION_FINALIZATION'
  | 'BLOCKED_DENIED_EXECUTION_SIDE_EFFECT'
  | 'BLOCKED_DUPLICATE_EXECUTION'
  | 'BLOCKED_POST_QA_INVARIANT'
  | 'BLOCKED_SCOPE_CONFLICT';

export class Pack40dsBlockedError extends Error {
  constructor(
    readonly code: Pack40dsBlockedCode,
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${code}: ${stage}: ${detail}`);
    this.name = 'Pack40dsBlockedError';
  }
}

function block(code: Pack40dsBlockedCode, stage: string, detail: string): never {
  throw new Pack40dsBlockedError(code, stage, detail);
}

function log(stage: string, message: string): void {
  console.log(`[pack40ds] ${stage}: ${message}`);
}

function anonymize(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function assertPack40ddMergedEvidence(evidenceText: string): void {
  const required = [
    'PACK40D_CONTROLLED_INDIRECT_EXECUTION_DEPLOYED_TO_STAGING',
    'PACK40D_LIVE_EXECUTION_QA_STILL_REQUIRED',
    'PACK40D_SIGNED_WEBHOOK_EXECUTION_DISABLED',
    'PACK40D_RECOVERY_RECONCILIATION_NOT_IMPLEMENTED',
    'v27',
  ];
  for (const marker of required) {
    if (!evidenceText.includes(marker)) {
      block('BLOCKED_PACK40DD_EVIDENCE_NOT_MERGED', 'evidence', `missing marker ${marker}`);
    }
  }
}

export function assertStagingApiIdentity(baseUrl: string): void {
  let host: string;
  try {
    host = new URL(baseUrl).host;
  } catch {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'api-identity', 'invalid URL');
  }
  if (!host.includes(STAGING_API_APP_NAME)) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'api-identity', `host must be ${STAGING_API_APP_NAME}`);
  }
  if (host.includes('production') || host.includes('prod')) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'api-identity', 'production host rejected');
  }
}

export function resolveStagingApiBase(): string {
  const candidates = [
    process.env.STAGING_PUBLIC_API_BASE?.trim(),
    process.env.EXPO_PUBLIC_REST_API_BASE?.trim(),
    STAGING_API_BASE_DEFAULT,
  ].filter(Boolean) as string[];
  for (const cand of candidates) {
    try {
      const host = new URL(cand).host;
      if (host.includes(STAGING_API_APP_NAME)) return cand.replace(/\/+$/, '');
    } catch {
      // continue
    }
  }
  return STAGING_API_BASE_DEFAULT.replace(/\/+$/, '');
}

export function redactApiBase(base: string): string {
  try {
    const url = new URL(base);
    return `${url.protocol}//${STAGING_API_APP_NAME}.fly.dev`;
  } catch {
    return `${STAGING_API_APP_NAME} (redacted)`;
  }
}

export function readStagingReleaseVersion(): number {
  try {
    const raw = execSync(`fly releases --app ${STAGING_API_APP_NAME} --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const rows = JSON.parse(raw) as { Version?: number; version?: number }[];
    const maxVersion = Math.max(
      ...rows.map((r) => Number(r.Version ?? r.version ?? 0)).filter((n) => Number.isFinite(n)),
    );
    if (!Number.isFinite(maxVersion) || maxVersion < MIN_STAGING_RELEASE) {
      block(
        'BLOCKED_PACK40D_RELEASE_MISMATCH',
        'release',
        `release v${maxVersion} < required v${MIN_STAGING_RELEASE}`,
      );
    }
    return maxVersion;
  } catch (error) {
    if (error instanceof Pack40dsBlockedError) throw error;
    block('BLOCKED_PACK40D_RELEASE_MISMATCH', 'release', 'unable to read fly releases');
  }
}

export function assertSafeProviderDestination(): void {
  if (SAFE_TWILIO_DESTINATION !== '+15005550006') {
    block('BLOCKED_SAFE_PROVIDER_DESTINATION', 'destination', 'forced magic number mismatch');
  }
}

export function assertEscrowAmountPolicy(): void {
  if (!(ESCROW_AMOUNT_VIO > 0) || ESCROW_AMOUNT_VIO > ESCROW_SAFE_CAP_VIO) {
    block('BLOCKED_ESCROW_AMOUNT_POLICY', 'escrow', 'amount outside safe cap');
  }
  if (ESCROW_AMOUNT_VIO !== 0.01) {
    block('BLOCKED_ESCROW_AMOUNT_POLICY', 'escrow', 'unexpected amount vs approved test contract');
  }
}

export function assertStaticSafety(source: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      block('BLOCKED_SCOPE_CONFLICT', 'static-safety', `forbidden pattern ${pattern}`);
    }
  }
  if (!source.includes(INTERNAL_EXECUTION_PATH)) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'missing internal execution path');
  }
  if (!source.includes('MAX_PROVIDER_SEND = 1')) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'provider send max must be 1');
  }
  if (!source.includes('MAX_EXECUTION_POST = 5')) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'execution post max must be 5');
  }
}

export function assertPack40dSourceBoundaries(): void {
  const orch = readFileSync(
    path.join(REPO_ROOT, 'src/services/viona/vionaRequestExecutionOrchestrator.ts'),
    'utf8',
  );
  const controller = readFileSync(
    path.join(REPO_ROOT, 'src/controllers/VionaInternalRealTwilioPocController.ts'),
    'utf8',
  );
  const dispatch = readFileSync(
    path.join(REPO_ROOT, 'src/services/viona/vionaAutonomousDispatchService.ts'),
    'utf8',
  );
  const adapter = readFileSync(
    path.join(REPO_ROOT, 'src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts'),
    'utf8',
  );
  if (!orch.includes('internalAuthenticatedController')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'coordinator missing enabled trigger');
  }
  if (orch.includes('vionaRequest.updateMany') || orch.includes('getPrisma()')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'coordinator must not write status directly');
  }
  if (!controller.includes('executeVionaRequestBusinessFlow')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'controller must use coordinator');
  }
  if (!dispatch.includes('pack40d_provider_execution_disabled')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'dispatch Twilio must remain disabled');
  }
  if (adapter.includes('attempts < 2') || adapter.includes('RETRY_BACKOFF')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'single-shot adapter must not retry');
  }
}

type PilotCred = Readonly<{ phone: string; pin: string; userId: string }>;

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

function resolvePin(primaryEnv: string, fallbackEnv: string): string {
  const pin =
    process.env[primaryEnv]?.trim() ||
    process.env[fallbackEnv]?.trim() ||
    process.env.VIONA_LOCAL_PILOT_PIN?.trim() ||
    '';
  if (pin.length < 4) block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-pin', `${primaryEnv} unavailable`);
  return pin;
}

async function resolvePilotCredentialsForUser(
  prisma: Pick<PrismaClient, 'user'>,
  userId: string,
  phoneA: string,
  phoneB: string,
  pinA: string,
  pinB: string,
): Promise<PilotCred> {
  const userA = await prisma.user.findFirst({
    where: { phoneNumber: phoneA },
    select: { id: true },
  });
  if (userA?.id === userId) return { phone: phoneA, pin: pinA, userId };

  const userB = await prisma.user.findFirst({
    where: { phoneNumber: phoneB },
    select: { id: true },
  });
  if (userB?.id === userId) return { phone: phoneB, pin: pinB, userId };

  block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-map', 'no pilot credential maps to required user');
}

async function loginPilot(base: string, phone: string, pin: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: phone, pinCode: pin }),
  });
  const text = await res.text();
  let json: { success?: boolean; data?: { accessToken?: string; token?: string } } = {};
  try {
    json = JSON.parse(text) as { success?: boolean; data?: { accessToken?: string; token?: string } };
  } catch {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-login', `invalid login JSON HTTP ${res.status}`);
  }
  const token = json.data?.accessToken ?? json.data?.token;
  if (res.status !== 200 || json.success !== true || typeof token !== 'string' || token.length < 20) {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'auth-login', `login failed HTTP ${res.status}`);
  }
  return token;
}

type HttpResult = Readonly<{
  httpStatus: number;
  ok: boolean;
  body: unknown;
  uncertain: boolean;
}>;

async function postInternalExecution(
  base: string,
  token: string,
  requestId: string,
  messageBody?: string,
): Promise<HttpResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${base}${INTERNAL_EXECUTION_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestId,
        operatorApprovalGranted: true,
        userConsentGranted: true,
        ...(messageBody ? { messageBody } : {}),
      }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    return { httpStatus: res.status, ok: res.ok, body, uncertain: false };
  } catch {
    return {
      httpStatus: 0,
      ok: false,
      body: null,
      uncertain: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

type FixtureBundle = Readonly<{
  consumerRequestId: string | null;
  merchantRequestId: string;
  legacyRequestId: string;
  dualRoleUserId: string;
  merchantProfileId: string;
  merchantTenantId: string;
  consumerAvailable: boolean;
}>;

async function findPack19RequestId(prisma: Pick<PrismaClient, 'vionaRequest'>): Promise<string | null> {
  const row = await prisma.vionaRequest.findFirst({
    where: {
      scopeKind: VionaRequestScopeKind.consumer,
      tenantId: PACK19_TENANT_MARKER,
      merchantProfileId: null,
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });
  return row?.id ?? null;
}

async function findPack35RequestId(
  prisma: Pick<PrismaClient, 'vionaRequestAuditEvent'>,
): Promise<string | null> {
  const audit = await prisma.vionaRequestAuditEvent.findFirst({
    where: {
      eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE,
      payloadJson: { path: ['externalMessageId'], equals: PACK35_EXTERNAL_MESSAGE_ID },
    },
    select: { requestId: true },
    orderBy: { createdAt: 'desc' },
  });
  return audit?.requestId ?? null;
}

function userInScope(
  row: Readonly<{ ownerUserId: string | null; requesterUserId: string | null }>,
  userId: string,
): boolean {
  return row.ownerUserId === userId || row.requesterUserId === userId;
}

export async function discoverFixtures(
  prisma: Pick<
    PrismaClient,
    | 'vionaRequest'
    | 'vionaRequestAuditEvent'
    | 'merchantProfile'
    | 'vionaMerchantWebhookChannel'
    | 'vionaRequestExecutionAttempt'
  >,
): Promise<FixtureBundle> {
  const merchantRequestId = await findPack35RequestId(prisma);
  if (!merchantRequestId) {
    block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'fixtures', 'merchant marker missing');
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
  if (
    !merchantRow ||
    merchantRow.scopeKind !== VionaRequestScopeKind.merchant ||
    merchantRow.status !== 'triage' ||
    !merchantRow.merchantProfileId ||
    !merchantRow.ownerUserId
  ) {
    block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'fixtures', 'merchant not eligible triage');
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
    block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'fixtures', 'Pack36A channel missing');
  }

  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { id: channel!.merchantProfileId },
    select: { id: true, tenantId: true, ownerUserId: true, isActive: true },
  });
  if (
    !merchantProfile ||
    !merchantProfile.isActive ||
    merchantRow.merchantProfileId !== merchantProfile.id ||
    merchantRow.tenantId !== merchantProfile.tenantId ||
    merchantRow.ownerUserId !== merchantProfile.ownerUserId
  ) {
    block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'fixtures', 'merchant authority mismatch');
  }

  const activeAttempts = await prisma.vionaRequestExecutionAttempt.count({
    where: {
      requestId: merchantRequestId,
      state: {
        in: [
          VionaRequestExecutionAttemptState.claimed,
          VionaRequestExecutionAttemptState.providerPending,
          VionaRequestExecutionAttemptState.providerSucceeded,
          VionaRequestExecutionAttemptState.providerFailed,
          VionaRequestExecutionAttemptState.outcomeUncertain,
        ],
      },
    },
  });
  if (activeAttempts !== 0) {
    block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'fixtures', 'active attempt already exists');
  }

  const dualRoleUserId = merchantProfile!.ownerUserId;

  const consumerRequestId = await findPack19RequestId(prisma);
  let consumerAvailable = false;
  if (consumerRequestId) {
    const consumerRow = await prisma.vionaRequest.findUnique({
      where: { id: consumerRequestId },
      select: {
        scopeKind: true,
        merchantProfileId: true,
        status: true,
        ownerUserId: true,
        requesterUserId: true,
      },
    });
    consumerAvailable = Boolean(
      consumerRow &&
        consumerRow.scopeKind === VionaRequestScopeKind.consumer &&
        consumerRow.merchantProfileId == null &&
        consumerRow.status === 'triage' &&
        userInScope(consumerRow, dualRoleUserId),
    );
  }

  const legacyRows = await prisma.vionaRequest.findMany({
    where: { scopeKind: VionaRequestScopeKind.legacyUnresolved },
    select: {
      id: true,
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
      'BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE',
      'legacy-count',
      `excluded legacy=${excludedLegacy.length}`,
    );
  }
  const legacyCandidate = excludedLegacy.find((r) => userInScope(r, dualRoleUserId));
  if (!legacyCandidate || legacyCandidate.merchantProfileId != null) {
    block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'legacy-fixture', 'no dual-role legacy fixture');
  }

  return {
    consumerRequestId: consumerAvailable ? consumerRequestId : null,
    merchantRequestId: merchantRequestId!,
    legacyRequestId: legacyCandidate!.id,
    dualRoleUserId,
    merchantProfileId: merchantProfile!.id,
    merchantTenantId: merchantProfile!.tenantId,
    consumerAvailable,
  };
}

export async function verifyMarkerAbsence(
  prisma: Pick<PrismaClient, 'vionaRequestExecutionAttempt' | 'vionaRequestEscrowHold' | 'vionaRequestAuditEvent'>,
): Promise<void> {
  const smsHits = await prisma.vionaRequestAuditEvent.count({
    where: {
      message: { contains: SMS_MARKER },
    },
  });
  if (smsHits > 0) {
    block('BLOCKED_SCOPE_CONFLICT', 'markers', 'SMS marker already present');
  }
  const corrHits = await prisma.vionaRequestExecutionAttempt.count({
    where: {
      OR: [
        { correlationId: { contains: CORRELATION_MARKER } },
        { executionKey: { contains: EXECUTION_MARKER } },
      ],
    },
  });
  if (corrHits > 0) {
    block('BLOCKED_SCOPE_CONFLICT', 'markers', 'execution marker already present');
  }
  const escrowHits = await prisma.vionaRequestEscrowHold.count({
    where: { idempotencyKey: { contains: EXECUTION_MARKER } },
  });
  if (escrowHits > 0) {
    block('BLOCKED_SCOPE_CONFLICT', 'markers', 'escrow marker already present');
  }
}

type Snap = Readonly<{
  requestCount: number;
  attemptCount: number;
  activeAttemptCount: number;
  escrowCount: number;
  eventCountForMerchant: number;
  auditCountForMerchant: number;
  indirectExecutionAuditCountForMerchant: number;
  merchantStatus: string;
  provenance: Readonly<{ merchant: number; consumer: number; legacyUnresolved: number }>;
  profileCount: number;
}>;

async function takeSnapshot(
  prisma: PrismaClient,
  merchantRequestId: string,
): Promise<Snap> {
  const [
    requestCount,
    attemptCount,
    activeAttemptCount,
    escrowCount,
    eventCountForMerchant,
    auditCountForMerchant,
    indirectExecutionAuditCountForMerchant,
    merchant,
    groups,
    profileCount,
  ] = await Promise.all([
    prisma.vionaRequest.count(),
    prisma.vionaRequestExecutionAttempt.count(),
    prisma.vionaRequestExecutionAttempt.count({
      where: {
        state: {
          in: [
            VionaRequestExecutionAttemptState.claimed,
            VionaRequestExecutionAttemptState.providerPending,
            VionaRequestExecutionAttemptState.providerSucceeded,
            VionaRequestExecutionAttemptState.providerFailed,
            VionaRequestExecutionAttemptState.outcomeUncertain,
          ],
        },
      },
    }),
    prisma.vionaRequestEscrowHold.count(),
    prisma.vionaRequestStatusEvent.count({ where: { requestId: merchantRequestId } }),
    prisma.vionaRequestAuditEvent.count({ where: { requestId: merchantRequestId } }),
    prisma.vionaRequestAuditEvent.count({
      where: {
        requestId: merchantRequestId,
        eventType: 'stateTransition',
        actorRoleLabel: 'execution_service',
      },
    }),
    prisma.vionaRequest.findUnique({
      where: { id: merchantRequestId },
      select: { status: true },
    }),
    prisma.vionaRequest.groupBy({ by: ['scopeKind'], _count: { _all: true } }),
    prisma.merchantProfile.count(),
  ]);

  const provenance = { merchant: 0, consumer: 0, legacyUnresolved: 0 };
  for (const g of groups) {
    if (g.scopeKind === VionaRequestScopeKind.merchant) provenance.merchant = g._count._all;
    if (g.scopeKind === VionaRequestScopeKind.consumer) provenance.consumer = g._count._all;
    if (g.scopeKind === VionaRequestScopeKind.legacyUnresolved) {
      provenance.legacyUnresolved = g._count._all;
    }
  }

  return {
    requestCount,
    attemptCount,
    activeAttemptCount,
    escrowCount,
    eventCountForMerchant,
    auditCountForMerchant,
    indirectExecutionAuditCountForMerchant,
    merchantStatus: merchant?.status ?? 'missing',
    provenance,
    profileCount,
  };
}

export type Pack40dsSummary = Readonly<{
  classification: 'READY_FOR_PACK40DS_QA_EVIDENCE_PR_REVIEW' | 'PACK40D_STAGING_CONTROLLED_EXECUTION_QA_GREEN';
  verifiedMasterSha: string;
  pr374Merged: true;
  stagingRelease: number;
  enabledTrigger: 'internalAuthenticatedController';
  signedWebhookExecutionEnabled: false;
  internalDispatchExecutionEnabled: false;
  successfulExecutionCount: number;
  providerInvocationCount: number;
  executionAttemptDelta: number;
  completedAttemptDelta: number;
  requestTransitionCount: number;
  transitionEventDelta: number;
  executionAuditDelta: number;
  escrowHoldDelta: number;
  escrowSettlementDelta: number;
  deniedSideEffectCount: number;
  duplicateExecutionSideEffectCount: number;
  consumerExecutionAllowed: false;
  legacyExecutionAllowed: false;
  consumerFixtureUsed: boolean;
  postCount: number;
  cleanupPerformed: false;
  recoveryPerformed: false;
  productionTouched: false;
  transportCertain: boolean;
}>;

export async function runPack40dsLiveQa(): Promise<Pack40dsSummary> {
  const evidence = readFileSync(path.join(REPO_ROOT, PACK40DD_EVIDENCE_RELATIVE), 'utf8');
  assertPack40ddMergedEvidence(evidence);
  assertPack40dSourceBoundaries();
  assertSafeProviderDestination();
  assertEscrowAmountPolicy();

  const selfSource = readFileSync(
    path.join(REPO_ROOT, 'scripts/verify-viona-pack40ds-staging-controlled-indirect-execution-qa.ts'),
    'utf8',
  );
  assertStaticSafety(selfSource);

  assertStagingDatabaseIdentity();
  const apiBase = resolveStagingApiBase();
  assertStagingApiIdentity(apiBase);
  const release = readStagingReleaseVersion();
  log('env', `api=${redactApiBase(apiBase)} release=v${release} db=db.${STAGING_PROJECT_REF}.supabase.co`);

  const health = await fetch(`${apiBase}/health`);
  if (health.status !== 200) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'health', `HTTP ${health.status}`);
  }

  const prisma = getPrisma();
  try {
    const fixtures = await discoverFixtures(prisma);
    await verifyMarkerAbsence(prisma);
    log(
      'fixtures',
      `merchantEligible=true consumerAvailable=${fixtures.consumerAvailable} dest=magic destination anonymized=${anonymize(SAFE_TWILIO_DESTINATION)}`,
    );

    const wallet = await prisma.wallet.findUnique({
      where: { userId: fixtures.dualRoleUserId },
      select: { balanceVIG: true },
    });
    if (!wallet || Number(wallet.balanceVIG) + 1e-9 < ESCROW_AMOUNT_VIO) {
      block('BLOCKED_ESCROW_AMOUNT_POLICY', 'wallet', 'insufficient staged funds for test hold');
    }

    const pre = await takeSnapshot(prisma, fixtures.merchantRequestId);
    if (pre.merchantStatus !== 'triage') {
      block('BLOCKED_SAFE_MERCHANT_EXECUTION_FIXTURE', 'pre', 'merchant not triage');
    }

    const phoneA = resolvePilotAPhone();
    const phoneB = resolvePilotBPhone();
    const pinA = resolvePin('VIONA_PILOT_USER_A_PIN', 'VIONA_PILOT_PIN');
    const pinB = resolvePin('VIONA_PILOT_USER_B_PIN', 'VIONA_PILOT_PIN');
    const ownerCreds = await resolvePilotCredentialsForUser(
      prisma,
      fixtures.dualRoleUserId,
      phoneA,
      phoneB,
      pinA,
      pinB,
    );
    const token = await loginPilot(apiBase, ownerCreds.phone, ownerCreds.pin);
    let postCount = 0;
    let providerInvocationCount = 0;
    let successfulExecutionCount = 0;
    let deniedSideEffectCount = 0;
    let duplicateExecutionSideEffectCount = 0;
    let transportCertain = true;

    const snapAfter = async () => takeSnapshot(prisma, fixtures.merchantRequestId);

    const assertDenialNoSideEffects = async (label: string, before: Snap): Promise<void> => {
      const after = await snapAfter();
      const deltas = {
        attempts: after.attemptCount - before.attemptCount,
        escrow: after.escrowCount - before.escrowCount,
        events: after.eventCountForMerchant - before.eventCountForMerchant,
        audits: after.auditCountForMerchant - before.auditCountForMerchant,
        indirectAudits:
          after.indirectExecutionAuditCountForMerchant - before.indirectExecutionAuditCountForMerchant,
        statusChanged: after.merchantStatus !== before.merchantStatus,
        requests: after.requestCount - before.requestCount,
      };
      if (
        deltas.attempts !== 0 ||
        deltas.escrow !== 0 ||
        deltas.events !== 0 ||
        deltas.audits !== 0 ||
        deltas.indirectAudits !== 0 ||
        deltas.statusChanged ||
        deltas.requests !== 0
      ) {
        block('BLOCKED_DENIED_EXECUTION_SIDE_EFFECT', label, JSON.stringify(deltas));
      }
    };

    // A — consumer
    if (fixtures.consumerAvailable && fixtures.consumerRequestId) {
      const before = await snapAfter();
      postCount += 1;
      const result = await postInternalExecution(apiBase, token, fixtures.consumerRequestId);
      if (result.uncertain) {
        transportCertain = false;
        block('BLOCKED_UNCERTAIN_EXECUTION_OUTCOME', 'consumer', 'uncertain transport');
      }
      if (result.ok) {
        block('BLOCKED_DENIED_EXECUTION_SIDE_EFFECT', 'consumer', 'consumer must not succeed');
      }
      await assertDenialNoSideEffects('consumer', before);
      log('A', `consumer denial HTTP ${result.httpStatus}`);
    } else {
      log('A', 'consumer fixture unavailable in triage — skipped (local coverage)');
    }

    // B — legacy
    {
      const before = await snapAfter();
      postCount += 1;
      const result = await postInternalExecution(apiBase, token, fixtures.legacyRequestId);
      if (result.uncertain) {
        transportCertain = false;
        block('BLOCKED_UNCERTAIN_EXECUTION_OUTCOME', 'legacy', 'uncertain transport');
      }
      if (result.ok) {
        block('BLOCKED_DENIED_EXECUTION_SIDE_EFFECT', 'legacy', 'legacy must not succeed');
      }
      await assertDenialNoSideEffects('legacy', before);
      log('B', `legacy denial HTTP ${result.httpStatus}`);
    }

    // C — nonexistent
    {
      const before = await snapAfter();
      postCount += 1;
      const fakeId = randomUUID();
      const result = await postInternalExecution(apiBase, token, fakeId);
      if (result.uncertain) {
        transportCertain = false;
        block('BLOCKED_UNCERTAIN_EXECUTION_OUTCOME', 'nonexistent', 'uncertain transport');
      }
      if (result.ok) {
        block('BLOCKED_DENIED_EXECUTION_SIDE_EFFECT', 'nonexistent', 'must not succeed');
      }
      await assertDenialNoSideEffects('nonexistent', before);
      log('C', `nonexistent denial HTTP ${result.httpStatus}`);
    }

    // D — authorized merchant execution (only live Twilio send)
    {
      const before = await snapAfter();
      postCount += 1;
      const result = await postInternalExecution(apiBase, token, fixtures.merchantRequestId, SMS_BODY);
      if (result.uncertain) {
        transportCertain = false;
        // Read-only recon without retry
        const mid = await snapAfter();
        log(
          'uncertain',
          `attemptDelta=${mid.attemptCount - before.attemptCount} status=${mid.merchantStatus}`,
        );
        block('BLOCKED_UNCERTAIN_EXECUTION_OUTCOME', 'merchant-exec', 'no definitive HTTP response');
      }
      if (!result.ok) {
        block(
          'BLOCKED_PROVIDER_RESULT',
          'merchant-exec',
          `expected success HTTP, got ${result.httpStatus}`,
        );
      }

      const data = (result.body as { data?: { finalStatus?: string; providerInvoked?: boolean } })
        ?.data;
      if (data?.finalStatus !== 'completed' || data?.providerInvoked !== true) {
        block('BLOCKED_PACK40D_EXECUTION_FINALIZATION', 'merchant-exec', 'unexpected response shape');
      }

      const after = await snapAfter();
      const attemptDelta = after.attemptCount - before.attemptCount;
      const escrowDelta = after.escrowCount - before.escrowCount;
      const eventDelta = after.eventCountForMerchant - before.eventCountForMerchant;
      const auditDelta = after.auditCountForMerchant - before.auditCountForMerchant;
      const indirectAuditDelta =
        after.indirectExecutionAuditCountForMerchant - before.indirectExecutionAuditCountForMerchant;

      if (attemptDelta !== 1) {
        block('BLOCKED_PACK40D_EXECUTION_FINALIZATION', 'attempt-delta', `delta=${attemptDelta}`);
      }
      if (escrowDelta !== 1) {
        block('BLOCKED_ESCROW_RESULT', 'hold-delta', `delta=${escrowDelta}`);
      }
      if (eventDelta !== 2) {
        block('BLOCKED_POST_QA_INVARIANT', 'event-delta', `delta=${eventDelta}`);
      }
      if (indirectAuditDelta !== 2) {
        block('BLOCKED_POST_QA_INVARIANT', 'indirect-audit-delta', `delta=${indirectAuditDelta}`);
      }
      if (auditDelta < 2) {
        block('BLOCKED_POST_QA_INVARIANT', 'audit-delta', `delta=${auditDelta}`);
      }
      if (after.merchantStatus !== 'completed') {
        block('BLOCKED_PACK40D_EXECUTION_FINALIZATION', 'status', after.merchantStatus);
      }

      const attempt = await prisma.vionaRequestExecutionAttempt.findFirst({
        where: { requestId: fixtures.merchantRequestId },
        orderBy: { attemptNumber: 'desc' },
        select: {
          id: true,
          state: true,
          providerResultDigest: true,
          providerIdempotencyKey: true,
          finalizedAt: true,
          providerName: true,
        },
      });
      if (
        !attempt ||
        attempt.state !== VionaRequestExecutionAttemptState.completed ||
        !attempt.providerResultDigest ||
        !attempt.providerIdempotencyKey ||
        !attempt.finalizedAt ||
        attempt.providerName !== 'twilio_test_sms'
      ) {
        block('BLOCKED_PROVIDER_RESULT', 'attempt', 'terminal provider fields incomplete');
      }

      const hold = await prisma.vionaRequestEscrowHold.findFirst({
        where: {
          requestId: fixtures.merchantRequestId,
          idempotencyKey: { contains: attempt!.id },
        },
        select: { status: true, idempotencyKey: true, heldAmountVIO: true },
        orderBy: { createdAt: 'desc' },
      });
      if (
        !hold ||
        hold.status !== VionaRequestEscrowHoldStatus.SETTLED ||
        Math.abs(Number(hold.heldAmountVIO) - ESCROW_AMOUNT_VIO) > 1e-6
      ) {
        block('BLOCKED_ESCROW_RESULT', 'settle', 'hold not settled at approved amount');
      }
      if (!hold.idempotencyKey.includes(fixtures.merchantRequestId) || !hold.idempotencyKey.includes('twilio_test_sms')) {
        block('BLOCKED_ESCROW_RESULT', 'key', 'hold key not attempt-scoped');
      }

      const activeLeft = await prisma.vionaRequestExecutionAttempt.count({
        where: {
          requestId: fixtures.merchantRequestId,
          state: {
            in: [
              VionaRequestExecutionAttemptState.claimed,
              VionaRequestExecutionAttemptState.providerPending,
              VionaRequestExecutionAttemptState.providerSucceeded,
              VionaRequestExecutionAttemptState.providerFailed,
              VionaRequestExecutionAttemptState.outcomeUncertain,
            ],
          },
        },
      });
      if (activeLeft !== 0) {
        block('BLOCKED_PACK40D_EXECUTION_FINALIZATION', 'active', `active=${activeLeft}`);
      }

      providerInvocationCount = 1;
      successfulExecutionCount = 1;
      log(
        'D',
        `merchant execution completed events=+${eventDelta} indirectAudits=+${indirectAuditDelta} totalAudits=+${auditDelta} escrowSettled=true providerSend=1`,
      );
    }

    // E — duplicate on completed request
    {
      const before = await snapAfter();
      postCount += 1;
      const result = await postInternalExecution(apiBase, token, fixtures.merchantRequestId, SMS_BODY);
      if (result.uncertain) {
        transportCertain = false;
        block('BLOCKED_UNCERTAIN_EXECUTION_OUTCOME', 'duplicate', 'uncertain transport');
      }
      if (result.ok) {
        block('BLOCKED_DUPLICATE_EXECUTION', 'duplicate', 'duplicate must not succeed');
      }
      const after = await snapAfter();
      const deltas = {
        attempts: after.attemptCount - before.attemptCount,
        escrow: after.escrowCount - before.escrowCount,
        events: after.eventCountForMerchant - before.eventCountForMerchant,
        audits: after.auditCountForMerchant - before.auditCountForMerchant,
        status: after.merchantStatus,
      };
      if (
        deltas.attempts !== 0 ||
        deltas.escrow !== 0 ||
        deltas.events !== 0 ||
        // audit may remain unchanged; require zero delta
        deltas.audits !== 0 ||
        deltas.status !== 'completed'
      ) {
        block('BLOCKED_DUPLICATE_EXECUTION', 'duplicate-side-effects', JSON.stringify(deltas));
      }
      duplicateExecutionSideEffectCount = 0;
      log('E', `duplicate denial HTTP ${result.httpStatus} sideEffects=0`);
    }

    if (postCount > MAX_EXECUTION_POST) {
      block('BLOCKED_SCOPE_CONFLICT', 'post-cap', `posts=${postCount}`);
    }
    if (providerInvocationCount !== MAX_PROVIDER_SEND) {
      block('BLOCKED_PROVIDER_RESULT', 'send-cap', `sends=${providerInvocationCount}`);
    }

    const post = await takeSnapshot(prisma, fixtures.merchantRequestId);
    if (post.requestCount !== pre.requestCount) {
      block('BLOCKED_POST_QA_INVARIANT', 'request-count', 'changed');
    }
    if (
      post.provenance.merchant !== pre.provenance.merchant ||
      post.provenance.consumer !== pre.provenance.consumer ||
      post.provenance.legacyUnresolved !== pre.provenance.legacyUnresolved
    ) {
      block('BLOCKED_POST_QA_INVARIANT', 'provenance', 'changed');
    }
    if (post.profileCount !== pre.profileCount) {
      block('BLOCKED_POST_QA_INVARIANT', 'profiles', 'changed');
    }
    if (post.attemptCount - pre.attemptCount !== 1) {
      block('BLOCKED_POST_QA_INVARIANT', 'attempt-total', 'unexpected');
    }
    if (post.escrowCount - pre.escrowCount !== 1) {
      block('BLOCKED_POST_QA_INVARIANT', 'escrow-total', 'unexpected');
    }
    if (post.eventCountForMerchant - pre.eventCountForMerchant !== 2) {
      block('BLOCKED_POST_QA_INVARIANT', 'event-total', 'unexpected');
    }
    if (
      post.indirectExecutionAuditCountForMerchant - pre.indirectExecutionAuditCountForMerchant !==
      2
    ) {
      block('BLOCKED_POST_QA_INVARIANT', 'indirect-audit-total', 'unexpected');
    }
    if (post.merchantStatus !== 'completed') {
      block('BLOCKED_POST_QA_INVARIANT', 'merchant-final', post.merchantStatus);
    }

    const legacyPost = await prisma.vionaRequest.findUnique({
      where: { id: fixtures.legacyRequestId },
      select: { scopeKind: true, status: true },
    });
    if (legacyPost?.scopeKind !== VionaRequestScopeKind.legacyUnresolved) {
      block('BLOCKED_POST_QA_INVARIANT', 'legacy', 'changed');
    }

    return {
      classification: 'READY_FOR_PACK40DS_QA_EVIDENCE_PR_REVIEW',
      verifiedMasterSha: VERIFIED_MASTER_SHA,
      pr374Merged: true,
      stagingRelease: release,
      enabledTrigger: 'internalAuthenticatedController',
      signedWebhookExecutionEnabled: false,
      internalDispatchExecutionEnabled: false,
      successfulExecutionCount,
      providerInvocationCount,
      executionAttemptDelta: 1,
      completedAttemptDelta: 1,
      requestTransitionCount: 2,
      transitionEventDelta: post.eventCountForMerchant - pre.eventCountForMerchant,
      executionAuditDelta:
        post.indirectExecutionAuditCountForMerchant - pre.indirectExecutionAuditCountForMerchant,
      escrowHoldDelta: 1,
      escrowSettlementDelta: 1,
      deniedSideEffectCount,
      duplicateExecutionSideEffectCount,
      consumerExecutionAllowed: false,
      legacyExecutionAllowed: false,
      consumerFixtureUsed: fixtures.consumerAvailable,
      postCount,
      cleanupPerformed: false,
      recoveryPerformed: false,
      productionTouched: false,
      transportCertain,
    };
  } finally {
    await disconnectPrisma();
  }
}

async function main(): Promise<void> {
  try {
    const summary = await runPack40dsLiveQa();
    console.log(JSON.stringify({ ok: true, summary }, null, 2));
    console.log(
      `[pack40ds] classification=${summary.classification} posts=${summary.postCount} providerSends=${summary.providerInvocationCount}`,
    );
  } catch (error) {
    if (error instanceof Pack40dsBlockedError) {
      console.error(JSON.stringify({ ok: false, code: error.code, stage: error.stage, detail: error.detail }));
      process.exitCode = 2;
      return;
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
    process.argv[1].replace(/\\/g, '/').includes('verify-viona-pack40ds-staging-controlled-indirect-execution-qa'))
) {
  void main();
}
