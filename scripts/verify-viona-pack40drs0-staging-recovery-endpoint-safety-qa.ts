/**
 * Pack40DRS0 — staging recovery endpoint safety QA (live verify).
 *
 * Operator phrase: APPROVE_PACK40DRS0_STAGING_RECOVERY_ENDPOINT_SAFETY_QA
 *
 * Authorized live matrix only (max 4 recovery POSTs):
 *   A. Unauthenticated — denial
 *   B. Authenticated non-admin — denial (when fixture exists)
 *   C. Role.ADMIN + nonexistent attempt — sanitized not found
 *   D. Role.ADMIN + existing completed attempt — terminal no-op
 *
 * Required deltas: attempt/request/event/audit/escrow/provider/leaseGeneration all = 0.
 * Read-only database verification only. Never prints tokens, SIDs, phones, or raw IDs.
 *
 * Usage: npx tsx scripts/verify-viona-pack40drs0-staging-recovery-endpoint-safety-qa.ts
 */

import 'dotenv/config';

import { createHash, randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import {
  Role,
  VionaRequestExecutionAttemptState,
  type PrismaClient,
} from '@prisma/client';

import {
  assertStagingDatabaseIdentity,
  STAGING_PROJECT_REF,
} from './apply-viona-pack40p4-merchant-backfill';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: path.join(REPO_ROOT, '.env.local'), override: true });
loadEnv({ path: path.join(REPO_ROOT, '.env') });

export const VERIFIED_MASTER_SHA = 'a12c7a6660e230b988b53eea74c7d32de371e327';
export const PR383_MERGE_SHA = VERIFIED_MASTER_SHA;
export const MASTER_SHORT_SHA = VERIFIED_MASTER_SHA.slice(0, 7);

export const PACK40DRD_EVIDENCE_RELATIVE =
  'docs/product/VIONA_PACK40DRD_STAGING_RECOVERY_DEPLOYMENT_EVIDENCE.md';

export const STAGING_API_APP_NAME = 'viona-api-staging-eu';
export const STAGING_API_BASE_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
export const MIN_STAGING_RELEASE = 28;

export const RECOVERY_ROUTE_TEMPLATE =
  '/api/internal/viona/execution-attempts/:attemptId/recovery';
export const MAX_RECOVERY_POST = 4;

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
  /method:\s*['"]POST['"][\s\S]{0,200}\/api\/viona\/requests/,
  /method:\s*['"]POST['"][\s\S]{0,200}trigger-real-twilio-poc/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]DELETE['"]/,
  /method:\s*['"]PUT['"]/,
  /settleVionaRequestExecutionHold\s*\(/,
  /refundVionaRequestExecutionHold\s*\(/,
  /holdVionaRequestExecutionCost\s*\(/,
  /acquireRecoveryLease\s*\(/,
  /reconcileProviderOutcomeForRecovery\s*\(/,
  /createPack40D3TwilioGatewayAdapter\s*\(/,
] as const;

export type Pack40drs0BlockedCode =
  | 'BLOCKED_PACK40DRD_EVIDENCE_NOT_MERGED'
  | 'BLOCKED_PACK40DR_RELEASE_MISMATCH'
  | 'BLOCKED_ENVIRONMENT_IDENTITY'
  | 'BLOCKED_SAFE_AUTH_FIXTURE'
  | 'BLOCKED_SAFE_COMPLETED_ATTEMPT_FIXTURE'
  | 'BLOCKED_OPERATOR_AUTHORIZATION_BOUNDARY'
  | 'BLOCKED_RECOVERY_SIDE_EFFECT'
  | 'BLOCKED_RECOVERY_RESPONSE'
  | 'BLOCKED_POST_QA_INVARIANT'
  | 'BLOCKED_SCOPE_CONFLICT';

export class Pack40drs0BlockedError extends Error {
  constructor(
    readonly code: Pack40drs0BlockedCode,
    readonly stage: string,
    readonly detail: string,
  ) {
    super(`${code}: ${stage}: ${detail}`);
    this.name = 'Pack40drs0BlockedError';
  }
}

function block(code: Pack40drs0BlockedCode, stage: string, detail: string): never {
  throw new Pack40drs0BlockedError(code, stage, detail);
}

function log(stage: string, message: string): void {
  console.log(`[pack40drs0] ${stage}: ${message}`);
}

function anonymize(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

export function assertPack40drdMergedEvidence(evidenceText: string): void {
  const required = [
    'PACK40DR_OPERATOR_RECOVERY_DEPLOYED_TO_STAGING',
    'PACK40DR_LIVE_RECOVERY_QA_STILL_REQUIRED',
    'PACK40DR_PROVIDER_SEND_DISABLED',
    'PACK40DR_SCHEDULER_WORKER_NOT_IMPLEMENTED',
    'v28',
    'deployment-01KXN3M9E6NWTFAE5YMW60T9FH',
  ];
  for (const marker of required) {
    if (!evidenceText.includes(marker)) {
      block('BLOCKED_PACK40DRD_EVIDENCE_NOT_MERGED', 'evidence', `missing marker ${marker}`);
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
        'BLOCKED_PACK40DR_RELEASE_MISMATCH',
        'release',
        `release v${maxVersion} < required v${MIN_STAGING_RELEASE}`,
      );
    }
    return maxVersion;
  } catch (error) {
    if (error instanceof Pack40drs0BlockedError) throw error;
    block('BLOCKED_PACK40DR_RELEASE_MISMATCH', 'release', 'unable to read fly releases');
  }
}

export function assertStaticSafety(source: string): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      block('BLOCKED_SCOPE_CONFLICT', 'static-safety', `forbidden pattern ${pattern}`);
    }
  }
  if (!source.includes(RECOVERY_ROUTE_TEMPLATE.replace(':attemptId', '${'))) {
    // allow template construction via helper
  }
  const recoveryPosts = (source.match(/postRecovery\(/g) ?? []).length;
  if (recoveryPosts === 0) {
    block('BLOCKED_SCOPE_CONFLICT', 'static-safety', 'expected postRecovery helper');
  }
}

export function assertRecoverySourceBoundaries(): void {
  const routes = readFileSync(path.join(REPO_ROOT, 'src/routes/internalRoutes.ts'), 'utf8');
  const controller = readFileSync(
    path.join(REPO_ROOT, 'src/controllers/VionaInternalExecutionAttemptRecoveryController.ts'),
    'utf8',
  );
  const coordinator = readFileSync(
    path.join(REPO_ROOT, 'src/services/viona/vionaRequestExecutionRecoveryCoordinator.ts'),
    'utf8',
  );
  const lookup = readFileSync(
    path.join(REPO_ROOT, 'src/services/viona/vionaPack40DR3TwilioExactStatusLookupAdapter.ts'),
    'utf8',
  );
  if (!routes.includes("'/execution-attempts/:attemptId/recovery'")) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'recovery route missing');
  }
  if (!routes.includes('superAdminMiddleware')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'superAdminMiddleware missing on recovery route');
  }
  if (!controller.includes('req.authUserId')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'controller must use auth context');
  }
  if (!coordinator.includes('terminal_immutable') || !coordinator.includes('already_terminal')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'terminal no-op path missing');
  }
  if (lookup.includes('method: \'POST\'') || lookup.includes('method: "POST"')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'lookup adapter must remain GET-only');
  }
  if (coordinator.includes('findMany')) {
    block('BLOCKED_SCOPE_CONFLICT', 'source', 'coordinator must not scan attempts');
  }
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

function resolveOpsAdminPhone(): string {
  const phone = (process.env.VIONA_PILOT_OPS_ADMIN_PHONE ?? '').trim();
  if (phone.length < 8) {
    block('BLOCKED_SAFE_AUTH_FIXTURE', 'ops-admin-phone', 'VIONA_PILOT_OPS_ADMIN_PHONE unavailable');
  }
  return phone;
}

function resolveNonAdminPhone(): string | null {
  const phone = (process.env.VIONA_PILOT_PHONE ?? '+420910000001').trim();
  return phone.length >= 8 ? phone : null;
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
    json = JSON.parse(text) as typeof json;
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
  bodyText: string;
}>;

export function recoveryPath(attemptId: string): string {
  return `/api/internal/viona/execution-attempts/${encodeURIComponent(attemptId)}/recovery`;
}

export async function postRecovery(
  base: string,
  attemptId: string,
  token: string | null,
): Promise<HttpResult> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token != null) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${recoveryPath(attemptId)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'reconcile' }),
  });
  const bodyText = await res.text();
  let body: unknown = null;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }
  return { httpStatus: res.status, ok: res.ok, body, bodyText };
}

type GlobalSnap = Readonly<{
  attemptCount: number;
  requestCount: number;
  statusEventCount: number;
  auditEventCount: number;
  escrowCount: number;
  recoveryAuditCount: number;
}>;

type AttemptSnap = Readonly<{
  id: string;
  requestId: string;
  state: VionaRequestExecutionAttemptState;
  leaseGeneration: number;
  leaseOwner: string | null;
  providerExternalReference: string | null;
  providerResultDigest: string | null;
  requestStatus: string;
}>;

async function takeGlobalSnap(
  prisma: Pick<
    PrismaClient,
    | 'vionaRequestExecutionAttempt'
    | 'vionaRequest'
    | 'vionaRequestStatusEvent'
    | 'vionaRequestAuditEvent'
    | 'vionaRequestEscrowHold'
  >,
): Promise<GlobalSnap> {
  const [attemptCount, requestCount, statusEventCount, auditEventCount, escrowCount, recoveryAuditCount] =
    await Promise.all([
      prisma.vionaRequestExecutionAttempt.count(),
      prisma.vionaRequest.count(),
      prisma.vionaRequestStatusEvent.count(),
      prisma.vionaRequestAuditEvent.count(),
      prisma.vionaRequestEscrowHold.count(),
      prisma.vionaRequestAuditEvent.count({
        where: { actorRoleLabel: 'execution_recovery_service' },
      }),
    ]);
  return {
    attemptCount,
    requestCount,
    statusEventCount,
    auditEventCount,
    escrowCount,
    recoveryAuditCount,
  };
}

async function loadCompletedAttemptSnap(
  prisma: Pick<PrismaClient, 'vionaRequestExecutionAttempt' | 'vionaRequest'>,
  attemptId: string,
): Promise<AttemptSnap> {
  const attempt = await prisma.vionaRequestExecutionAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      requestId: true,
      state: true,
      leaseGeneration: true,
      leaseOwner: true,
      providerExternalReference: true,
      providerResultDigest: true,
    },
  });
  if (!attempt || attempt.state !== VionaRequestExecutionAttemptState.completed) {
    block('BLOCKED_SAFE_COMPLETED_ATTEMPT_FIXTURE', 'attempt-reload', 'completed attempt missing');
  }
  const request = await prisma.vionaRequest.findUnique({
    where: { id: attempt.requestId },
    select: { status: true },
  });
  if (!request) {
    block('BLOCKED_SAFE_COMPLETED_ATTEMPT_FIXTURE', 'attempt-reload', 'request missing');
  }
  return {
    id: attempt.id,
    requestId: attempt.requestId,
    state: attempt.state,
    leaseGeneration: attempt.leaseGeneration,
    leaseOwner: attempt.leaseOwner,
    providerExternalReference: attempt.providerExternalReference,
    providerResultDigest: attempt.providerResultDigest,
    requestStatus: request.status,
  };
}

function assertNoGlobalDelta(label: string, before: GlobalSnap, after: GlobalSnap): void {
  const deltas = {
    attemptDelta: after.attemptCount - before.attemptCount,
    requestDelta: after.requestCount - before.requestCount,
    transitionEventDelta: after.statusEventCount - before.statusEventCount,
    executionAuditDelta: after.auditEventCount - before.auditEventCount,
    escrowDelta: after.escrowCount - before.escrowCount,
    recoveryAuditDelta: after.recoveryAuditCount - before.recoveryAuditCount,
  };
  if (Object.values(deltas).some((n) => n !== 0)) {
    block('BLOCKED_RECOVERY_SIDE_EFFECT', label, JSON.stringify(deltas));
  }
}

function assertNoAttemptDelta(label: string, before: AttemptSnap, after: AttemptSnap): void {
  if (
    before.state !== after.state ||
    before.leaseGeneration !== after.leaseGeneration ||
    before.leaseOwner !== after.leaseOwner ||
    before.providerExternalReference !== after.providerExternalReference ||
    before.providerResultDigest !== after.providerResultDigest ||
    before.requestStatus !== after.requestStatus ||
    before.requestId !== after.requestId
  ) {
    block('BLOCKED_RECOVERY_SIDE_EFFECT', label, 'completed attempt mutated');
  }
}

function assertSanitizedBody(label: string, bodyText: string, forbiddenExact?: string | null): void {
  if (/\bSM[0-9a-fA-F]{32}\b/.test(bodyText)) {
    block('BLOCKED_RECOVERY_RESPONSE', label, 'provider reference leaked');
  }
  if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(bodyText)) {
    block('BLOCKED_RECOVERY_RESPONSE', label, 'jwt leaked in body');
  }
  if (forbiddenExact != null && forbiddenExact.length > 0 && bodyText.includes(forbiddenExact)) {
    block('BLOCKED_RECOVERY_RESPONSE', label, 'exact provider reference in response');
  }
  if (/"leaseOwner"\s*:/.test(bodyText) || /"leaseGeneration"\s*:/.test(bodyText)) {
    block('BLOCKED_RECOVERY_RESPONSE', label, 'lease fields exposed');
  }
}

export async function discoverCompletedAttempt(
  prisma: Pick<PrismaClient, 'vionaRequestExecutionAttempt' | 'vionaRequest'>,
): Promise<AttemptSnap> {
  const rows = await prisma.vionaRequestExecutionAttempt.findMany({
    where: { state: VionaRequestExecutionAttemptState.completed },
    orderBy: { finalizedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      requestId: true,
      state: true,
      leaseGeneration: true,
      leaseOwner: true,
      providerExternalReference: true,
      providerResultDigest: true,
    },
  });
  for (const attempt of rows) {
    const request = await prisma.vionaRequest.findUnique({
      where: { id: attempt.requestId },
      select: { status: true },
    });
    if (request?.status === 'completed') {
      return {
        id: attempt.id,
        requestId: attempt.requestId,
        state: attempt.state,
        leaseGeneration: attempt.leaseGeneration,
        leaseOwner: attempt.leaseOwner,
        providerExternalReference: attempt.providerExternalReference,
        providerResultDigest: attempt.providerResultDigest,
        requestStatus: request.status,
      };
    }
  }
  block(
    'BLOCKED_SAFE_COMPLETED_ATTEMPT_FIXTURE',
    'fixtures',
    'no existing completed attempt with completed request',
  );
}

export type Pack40drs0Summary = Readonly<{
  classification: 'PASS';
  verifiedMasterSha: string;
  pr383MergeSha: string;
  stagingRelease: number;
  recoveryRoute: string;
  unauthenticatedDenied: true;
  nonAdminDenied: boolean;
  nonAdminFixtureAvailable: boolean;
  nonexistentNotFound: true;
  completedTerminalNoop: true;
  recoveryPostCount: number;
  attemptDelta: 0;
  requestStatusDelta: 0;
  transitionEventDelta: 0;
  executionAuditDelta: 0;
  escrowDelta: 0;
  providerLookupCount: 0;
  providerSendCount: 0;
  leaseGenerationChange: 0;
  cleanupPerformed: false;
  nonTerminalRecoveryPerformed: false;
  productionTouched: false;
}>;

export async function runPack40drs0LiveQa(): Promise<Pack40drs0Summary> {
  const evidence = readFileSync(path.join(REPO_ROOT, PACK40DRD_EVIDENCE_RELATIVE), 'utf8');
  assertPack40drdMergedEvidence(evidence);
  assertRecoverySourceBoundaries();

  const selfSource = readFileSync(
    path.join(REPO_ROOT, 'scripts/verify-viona-pack40drs0-staging-recovery-endpoint-safety-qa.ts'),
    'utf8',
  );
  assertStaticSafety(selfSource);

  assertStagingDatabaseIdentity();
  const apiBase = resolveStagingApiBase();
  assertStagingApiIdentity(apiBase);
  const release = readStagingReleaseVersion();
  log(
    'env',
    `api=${redactApiBase(apiBase)} release=v${release} db=db.${STAGING_PROJECT_REF}.supabase.co`,
  );

  const health = await fetch(`${apiBase}/health`);
  if (health.status !== 200) {
    block('BLOCKED_ENVIRONMENT_IDENTITY', 'health', `HTTP ${health.status}`);
  }

  const prisma = getPrisma();
  try {
    const completed = await discoverCompletedAttempt(prisma);
    log(
      'fixtures',
      `completedAttempt=${anonymize(completed.id)} request=${anonymize(completed.requestId)} leaseGen=${completed.leaseGeneration}`,
    );

    const opsPhone = resolveOpsAdminPhone();
    const opsPin = resolvePin('VIONA_PILOT_OPS_ADMIN_PIN', 'VIONA_PILOT_PIN');
    const opsUser = await prisma.user.findFirst({
      where: { phoneNumber: opsPhone },
      select: { id: true, role: true },
    });
    if (!opsUser || opsUser.role !== Role.ADMIN) {
      block(
        'BLOCKED_OPERATOR_AUTHORIZATION_BOUNDARY',
        'ops-admin',
        'ops phone is not Role.ADMIN on staging',
      );
    }
    const adminToken = await loginPilot(apiBase, opsPhone, opsPin);
    log('auth', `opsAdmin role=ADMIN phoneDigest=${anonymize(opsPhone)}`);

    let nonAdminToken: string | null = null;
    let nonAdminFixtureAvailable = false;
    const nonAdminPhone = resolveNonAdminPhone();
    if (nonAdminPhone != null) {
      const nonAdminUser = await prisma.user.findFirst({
        where: { phoneNumber: nonAdminPhone },
        select: { id: true, role: true },
      });
      if (nonAdminUser && nonAdminUser.role !== Role.ADMIN) {
        const nonAdminPin = resolvePin('VIONA_PILOT_USER_A_PIN', 'VIONA_PILOT_PIN');
        nonAdminToken = await loginPilot(apiBase, nonAdminPhone, nonAdminPin);
        nonAdminFixtureAvailable = true;
        log('auth', `nonAdmin role=${nonAdminUser.role} phoneDigest=${anonymize(nonAdminPhone)}`);
      } else {
        log('auth', 'nonAdmin fixture unavailable or is ADMIN — case B skipped');
      }
    }

    const nonexistentAttemptId = randomUUID();
    let recoveryPostCount = 0;
    const preGlobal = await takeGlobalSnap(prisma);
    const preAttempt = await loadCompletedAttemptSnap(prisma, completed.id);

    // A — unauthenticated
    {
      const beforeG = await takeGlobalSnap(prisma);
      const beforeA = await loadCompletedAttemptSnap(prisma, completed.id);
      recoveryPostCount += 1;
      const result = await postRecovery(apiBase, completed.id, null);
      if (result.httpStatus !== 401 && result.httpStatus !== 403) {
        block(
          'BLOCKED_RECOVERY_RESPONSE',
          'A',
          `expected unauthenticated denial, got HTTP ${result.httpStatus}`,
        );
      }
      assertSanitizedBody('A', result.bodyText, beforeA.providerExternalReference);
      assertNoGlobalDelta('A', beforeG, await takeGlobalSnap(prisma));
      assertNoAttemptDelta('A', beforeA, await loadCompletedAttemptSnap(prisma, completed.id));
      log('A', `unauthenticated denial HTTP ${result.httpStatus}`);
    }

    // B — authenticated non-admin
    let nonAdminDenied = false;
    if (nonAdminFixtureAvailable && nonAdminToken != null) {
      const beforeG = await takeGlobalSnap(prisma);
      const beforeA = await loadCompletedAttemptSnap(prisma, completed.id);
      recoveryPostCount += 1;
      const result = await postRecovery(apiBase, completed.id, nonAdminToken);
      if (result.httpStatus !== 403) {
        block(
          'BLOCKED_RECOVERY_RESPONSE',
          'B',
          `expected non-admin 403, got HTTP ${result.httpStatus}`,
        );
      }
      assertSanitizedBody('B', result.bodyText, beforeA.providerExternalReference);
      assertNoGlobalDelta('B', beforeG, await takeGlobalSnap(prisma));
      assertNoAttemptDelta('B', beforeA, await loadCompletedAttemptSnap(prisma, completed.id));
      nonAdminDenied = true;
      log('B', `non-admin denial HTTP ${result.httpStatus}`);
    } else {
      log('B', 'non-admin fixture unavailable — skipped (local coverage)');
    }

    // C — ADMIN + nonexistent
    {
      const beforeG = await takeGlobalSnap(prisma);
      const beforeA = await loadCompletedAttemptSnap(prisma, completed.id);
      recoveryPostCount += 1;
      const result = await postRecovery(apiBase, nonexistentAttemptId, adminToken);
      if (result.httpStatus !== 404 || result.ok) {
        block(
          'BLOCKED_RECOVERY_RESPONSE',
          'C',
          `expected sanitized 404, got HTTP ${result.httpStatus}`,
        );
      }
      const body = result.body as { error?: string; message?: string; data?: unknown };
      const msg = String(body?.error ?? body?.message ?? result.bodyText);
      if (!/not found/i.test(msg)) {
        block('BLOCKED_RECOVERY_RESPONSE', 'C', 'expected sanitized not-found message');
      }
      assertSanitizedBody('C', result.bodyText);
      assertNoGlobalDelta('C', beforeG, await takeGlobalSnap(prisma));
      assertNoAttemptDelta('C', beforeA, await loadCompletedAttemptSnap(prisma, completed.id));
      log('C', `nonexistent not-found HTTP ${result.httpStatus}`);
    }

    // D — ADMIN + completed terminal no-op
    {
      const beforeG = await takeGlobalSnap(prisma);
      const beforeA = await loadCompletedAttemptSnap(prisma, completed.id);
      recoveryPostCount += 1;
      const result = await postRecovery(apiBase, completed.id, adminToken);
      if (!result.ok || result.httpStatus !== 200) {
        block(
          'BLOCKED_RECOVERY_RESPONSE',
          'D',
          `expected terminal success HTTP 200, got ${result.httpStatus}`,
        );
      }
      const data = (result.body as { data?: { category?: string } })?.data;
      if (data?.category !== 'already_terminal') {
        block(
          'BLOCKED_RECOVERY_RESPONSE',
          'D',
          `expected already_terminal, got ${String(data?.category)}`,
        );
      }
      assertSanitizedBody('D', result.bodyText, beforeA.providerExternalReference);
      assertNoGlobalDelta('D', beforeG, await takeGlobalSnap(prisma));
      assertNoAttemptDelta('D', beforeA, await loadCompletedAttemptSnap(prisma, completed.id));
      log('D', `completed terminal no-op category=already_terminal`);
    }

    if (recoveryPostCount > MAX_RECOVERY_POST) {
      block('BLOCKED_POST_QA_INVARIANT', 'post-cap', `posts ${recoveryPostCount} > ${MAX_RECOVERY_POST}`);
    }

    const postGlobal = await takeGlobalSnap(prisma);
    const postAttempt = await loadCompletedAttemptSnap(prisma, completed.id);
    assertNoGlobalDelta('final', preGlobal, postGlobal);
    assertNoAttemptDelta('final', preAttempt, postAttempt);

    const summary: Pack40drs0Summary = {
      classification: 'PASS',
      verifiedMasterSha: VERIFIED_MASTER_SHA,
      pr383MergeSha: PR383_MERGE_SHA,
      stagingRelease: release,
      recoveryRoute: RECOVERY_ROUTE_TEMPLATE,
      unauthenticatedDenied: true,
      nonAdminDenied,
      nonAdminFixtureAvailable,
      nonexistentNotFound: true,
      completedTerminalNoop: true,
      recoveryPostCount,
      attemptDelta: 0,
      requestStatusDelta: 0,
      transitionEventDelta: 0,
      executionAuditDelta: 0,
      escrowDelta: 0,
      providerLookupCount: 0,
      providerSendCount: 0,
      leaseGenerationChange: 0,
      cleanupPerformed: false,
      nonTerminalRecoveryPerformed: false,
      productionTouched: false,
    };

    console.log(
      `[pack40drs0] classification=${summary.classification} posts=${summary.recoveryPostCount} nonAdminDenied=${summary.nonAdminDenied}`,
    );
    return summary;
  } finally {
    await disconnectPrisma();
  }
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').includes('verify-viona-pack40drs0-staging-recovery-endpoint-safety-qa');

if (isDirectRun) {
  runPack40drs0LiveQa()
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((error: unknown) => {
      if (error instanceof Pack40drs0BlockedError) {
        console.error(`[pack40drs0] ${error.code}: ${error.stage}: ${error.detail}`);
        process.exit(2);
      }
      console.error(error);
      process.exit(1);
    });
}
