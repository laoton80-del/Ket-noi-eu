/**
 * Pack40D2 — dedicated merchant-only indirect execution status writer (dormant).
 *
 * Owns:
 *   triage → inProgress (claim)
 *   inProgress → completed | failed (finalize after recorded provider outcome)
 *
 * Does not call Pack40C principal/access/writer, orchestrator, providers, webhooks, or controllers.
 * Not imported by production runtime until Pack40D3.
 */

import {
  Prisma,
  VionaRequestExecutionAttemptState,
  VionaRequestExecutionPrincipalType,
  VionaRequestScopeKind,
  type VionaRequestExecutionAttempt,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { getPrisma } from '../../lib/prisma';
import {
  createVionaRequestExecutionAttempt,
  findActiveVionaRequestExecutionAttemptForRequest,
  findMaxAttemptNumberForRequest,
  findVionaRequestExecutionAttemptById,
  transitionVionaRequestExecutionAttemptState,
  type VionaRequestExecutionAttemptClient,
} from '../../repositories/vionaRequestExecutionAttemptRepository';
import {
  buildMerchantIndirectExecutionClaimWhere,
  VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS,
} from './vionaRequestIndirectExecutionAccessScope';
import {
  resolveVionaRequestExecutionPrincipalContext,
  validateTrustedExecutionTrigger,
  type TrustedExecutionTrigger,
  type VionaRequestExecutionPrincipalContext,
} from './vionaRequestExecutionPrincipalContext';

export const VIONA_REQUEST_INDIRECT_AUDIT_EVENT_TYPE = 'stateTransition' as const;
export const VIONA_REQUEST_INDIRECT_AUDIT_ACTOR_ROLE = 'execution_service' as const;

export const VIONA_PACK40D2_EVENT_CATEGORY_CLAIMED = 'execution.claimed' as const;
export const VIONA_PACK40D2_EVENT_CATEGORY_COMPLETED = 'execution.completed' as const;
export const VIONA_PACK40D2_EVENT_CATEGORY_FAILED = 'execution.failed' as const;

export const VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS = 'inProgress' as const;
export const VIONA_REQUEST_INDIRECT_COMPLETED_STATUS = 'completed' as const;
export const VIONA_REQUEST_INDIRECT_FAILED_STATUS = 'failed' as const;

export type Pack40D2IndirectErrorCode =
  | 'invalid_trusted_trigger'
  | 'merchant_execution_not_authorized'
  | 'request_not_eligible_for_claim'
  | 'active_attempt_exists'
  | 'claim_conflict'
  | 'attempt_not_found'
  | 'stale_lease_owner'
  | 'invalid_attempt_state'
  | 'request_attempt_mismatch'
  | 'terminal_transition_conflict'
  | 'uncertain_provider_outcome';

export class VionaRequestIndirectExecutionError extends Error {
  readonly code: Pack40D2IndirectErrorCode;

  constructor(code: Pack40D2IndirectErrorCode) {
    super(code);
    this.name = 'VionaRequestIndirectExecutionError';
    this.code = code;
  }
}

export function buildPack40D2StatusEventReason(
  executionAttemptId: string,
  category: string,
): string {
  return `pack40d2.executionAttemptId=${executionAttemptId};category=${category}`;
}

export function parsePack40D2StatusEventAttemptId(reason: string | null | undefined): string | null {
  if (reason == null || typeof reason !== 'string') return null;
  const match = /^pack40d2\.executionAttemptId=([^;]+);category=/.exec(reason);
  return match?.[1] && match[1].length > 0 ? match[1] : null;
}

type IndirectMutationPrisma = Pick<
  ReturnType<typeof getPrisma>,
  | 'vionaRequest'
  | 'vionaRequestAuditEvent'
  | 'vionaRequestStatusEvent'
  | 'merchantProfile'
  | 'vionaRequestExecutionAttempt'
>;

type IndirectTxClient = IndirectMutationPrisma;

export type Pack40D2Clock = () => Date;
export type Pack40D2IdFactory = () => string;
export type Pack40D2ExecutionKeyFactory = () => string;
export type Pack40D2LeaseOwnerFactory = () => string;

export type ClaimVionaRequestExecutionInput = Readonly<{
  trigger: TrustedExecutionTrigger;
  /** Server-generated execution key; injectable for deterministic tests. */
  executionKey?: string;
  /** Server-generated lease owner identity for this worker/process. */
  leaseOwner?: string;
  /** Absolute lease expiration, or use leaseDurationMs with clock. */
  leaseExpiresAt?: Date;
  /** Bounded lease duration used with clock when leaseExpiresAt is omitted. */
  leaseDurationMs?: number;
  /** Server-generated attempt id when repository patterns require it. */
  attemptId?: string;
}>;

export type FinalizeVionaRequestExecutionInput = Readonly<{
  attemptId: string;
  requestId: string;
  expectedLeaseOwner: string;
}>;

export type ClaimVionaRequestExecutionResult = Readonly<{
  requestId: string;
  attemptId: string;
  attemptNumber: number;
  executionKey: string;
  attemptState: typeof VionaRequestExecutionAttemptState.claimed;
  requestStatus: typeof VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS;
  statusEventId: string;
  auditEventId: string;
  leaseOwner: string;
  leaseExpiresAt: Date;
}>;

export type FinalizeVionaRequestExecutionResult = Readonly<{
  requestId: string;
  attemptId: string;
  attemptState:
    | typeof VionaRequestExecutionAttemptState.completed
    | typeof VionaRequestExecutionAttemptState.failed;
  requestStatus:
    | typeof VIONA_REQUEST_INDIRECT_COMPLETED_STATUS
    | typeof VIONA_REQUEST_INDIRECT_FAILED_STATUS;
  statusEventId: string;
  auditEventId: string;
}>;

export type VionaRequestIndirectStatusActionDeps = Readonly<{
  prisma?: IndirectMutationPrisma & Pick<ReturnType<typeof getPrisma>, '$transaction'>;
  clock?: Pack40D2Clock;
  createId?: Pack40D2IdFactory;
  createExecutionKey?: Pack40D2ExecutionKeyFactory;
  createLeaseOwner?: Pack40D2LeaseOwnerFactory;
  defaultLeaseDurationMs?: number;
}>;

const DEFAULT_LEASE_DURATION_MS = 15 * 60 * 1000;

const REQUEST_CLAIM_SELECT = {
  id: true,
  status: true,
  ownerUserId: true,
  scopeKind: true,
  merchantProfileId: true,
  tenantId: true,
} as const;

type ClaimRequestRow = {
  id: string;
  status: string;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  tenantId: string;
};

function defaultPrisma() {
  return getPrisma();
}

function throwIndirect(code: Pack40D2IndirectErrorCode): never {
  throw new VionaRequestIndirectExecutionError(code);
}

function mapKnownPrismaConflict(error: unknown): Pack40D2IndirectErrorCode | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2002' || error.code === 'P2034')
  ) {
    return 'claim_conflict';
  }
  return null;
}

function resolveLease(
  input: ClaimVionaRequestExecutionInput,
  deps: VionaRequestIndirectStatusActionDeps,
  now: Date,
): { leaseOwner: string; leaseExpiresAt: Date } {
  const leaseOwner =
    input.leaseOwner?.trim() ||
    deps.createLeaseOwner?.() ||
    `lease-${(deps.createId ?? randomUUID)()}`;
  if (leaseOwner.length === 0) {
    throwIndirect('invalid_trusted_trigger');
  }
  const durationMs = input.leaseDurationMs ?? deps.defaultLeaseDurationMs ?? DEFAULT_LEASE_DURATION_MS;
  const leaseExpiresAt =
    input.leaseExpiresAt ?? new Date(now.getTime() + Math.max(1, durationMs));
  return { leaseOwner, leaseExpiresAt };
}

function buildExecutionAuditPayload(input: {
  fromStatus: string;
  toStatus: string;
  statusEventId: string;
  executionAttemptId: string;
  eventCategory: string;
  correlationId: string;
  triggerType: string;
  principalType: string;
}): Prisma.InputJsonValue {
  return {
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    statusEventId: input.statusEventId,
    executionAttemptId: input.executionAttemptId,
    eventCategory: input.eventCategory,
    correlationId: input.correlationId,
    triggerType: input.triggerType,
    principalType: input.principalType,
  };
}

async function writeStatusEventAndAudit(
  tx: IndirectTxClient,
  input: {
    requestId: string;
    fromStatus: string;
    toStatus: string;
    changedByUserId: string | null;
    executionAttemptId: string;
    eventCategory: string;
    correlationId: string;
    triggerType: string;
    principalType: string;
    message: string;
    statusEventId?: string;
    auditEventId?: string;
  },
): Promise<{ statusEventId: string; auditEventId: string }> {
  const statusEvent = await tx.vionaRequestStatusEvent.create({
    data: {
      ...(input.statusEventId != null ? { id: input.statusEventId } : {}),
      requestId: input.requestId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      changedByUserId: input.changedByUserId,
      reason: buildPack40D2StatusEventReason(input.executionAttemptId, input.eventCategory),
    },
  });

  const auditEvent = await tx.vionaRequestAuditEvent.create({
    data: {
      ...(input.auditEventId != null ? { id: input.auditEventId } : {}),
      requestId: input.requestId,
      eventType: VIONA_REQUEST_INDIRECT_AUDIT_EVENT_TYPE,
      actorUserId: input.changedByUserId,
      actorRoleLabel: VIONA_REQUEST_INDIRECT_AUDIT_ACTOR_ROLE,
      message: input.message,
      payloadJson: buildExecutionAuditPayload({
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        statusEventId: statusEvent.id,
        executionAttemptId: input.executionAttemptId,
        eventCategory: input.eventCategory,
        correlationId: input.correlationId,
        triggerType: input.triggerType,
        principalType: input.principalType,
      }),
    },
  });

  return { statusEventId: statusEvent.id, auditEventId: auditEvent.id };
}

/**
 * Atomically claim a merchant triage request for indirect execution.
 * Creates attempt (claimed) + request triage→inProgress + status event + audit in one Serializable tx.
 */
export async function claimVionaRequestExecution(
  input: ClaimVionaRequestExecutionInput,
  deps: VionaRequestIndirectStatusActionDeps = {},
): Promise<ClaimVionaRequestExecutionResult> {
  const validated = validateTrustedExecutionTrigger(input.trigger);
  if (!validated.ok) {
    throwIndirect(validated.code);
  }

  const prisma = deps.prisma ?? defaultPrisma();
  const clock = deps.clock ?? (() => new Date());
  const createId = deps.createId ?? randomUUID;
  const createExecutionKey = deps.createExecutionKey ?? (() => `exec-${createId()}`);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const now = clock();
        const principalResult = await resolveVionaRequestExecutionPrincipalContext(
          validated.trigger,
          tx,
        );
        if (!principalResult.ok) {
          throwIndirect(principalResult.code);
        }
        const principal = principalResult.principal;

        const whereResult = buildMerchantIndirectExecutionClaimWhere(principal);
        if (!whereResult.ok) {
          throwIndirect(whereResult.code);
        }

        const request = (await tx.vionaRequest.findFirst({
          where: whereResult.where,
          select: REQUEST_CLAIM_SELECT,
        })) as ClaimRequestRow | null;

        if (request == null) {
          throwIndirect('request_not_eligible_for_claim');
        }

        // Defensive fail-closed for consumer/legacy/malformed even if where was bypassed in tests.
        if (
          request.scopeKind !== VionaRequestScopeKind.merchant ||
          request.merchantProfileId == null ||
          request.merchantProfileId !== principal.merchantProfile.id ||
          request.tenantId !== principal.merchantProfile.tenantId ||
          request.ownerUserId !== principal.merchantProfile.ownerUserId ||
          request.status !== VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS
        ) {
          throwIndirect('request_not_eligible_for_claim');
        }

        const active = await findActiveVionaRequestExecutionAttemptForRequest(
          tx as VionaRequestExecutionAttemptClient,
          request.id,
        );
        if (active != null) {
          throwIndirect('active_attempt_exists');
        }

        const maxAttemptNumber = await findMaxAttemptNumberForRequest(
          tx as VionaRequestExecutionAttemptClient,
          request.id,
        );
        const attemptNumber = maxAttemptNumber + 1;
        const executionKey = (input.executionKey?.trim() || createExecutionKey()).trim();
        if (executionKey.length === 0) {
          throwIndirect('invalid_trusted_trigger');
        }
        const { leaseOwner, leaseExpiresAt } = resolveLease(input, deps, now);
        const attemptId = input.attemptId?.trim() || createId();

        const attempt = await createVionaRequestExecutionAttempt(
          tx as VionaRequestExecutionAttemptClient,
          {
            id: attemptId,
            requestId: request.id,
            attemptNumber,
            executionKey,
            state: VionaRequestExecutionAttemptState.claimed,
            correlationId: principal.correlationId,
            principalType: VionaRequestExecutionPrincipalType.merchantService,
            triggerType: principal.triggerType,
            triggeringUserId: principal.triggeringUserId,
            ownerUserIdSnapshot: principal.merchantProfile.ownerUserId,
            scopeKindSnapshot: VionaRequestScopeKind.merchant,
            merchantProfileIdSnapshot: principal.merchantProfile.id,
            tenantIdSnapshot: principal.merchantProfile.tenantId,
            leaseOwner,
            leaseExpiresAt,
            claimedAt: now,
          },
        );

        const boundAttemptId = attempt.id;

        const updateResult = await tx.vionaRequest.updateMany({
          where: whereResult.where,
          data: { status: VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS },
        });
        if (updateResult.count !== 1) {
          throwIndirect('claim_conflict');
        }

        const { statusEventId, auditEventId } = await writeStatusEventAndAudit(tx, {
          requestId: request.id,
          fromStatus: VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS,
          toStatus: VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS,
          changedByUserId: principal.triggeringUserId,
          executionAttemptId: boundAttemptId,
          eventCategory: VIONA_PACK40D2_EVENT_CATEGORY_CLAIMED,
          correlationId: principal.correlationId,
          triggerType: principal.triggerType,
          principalType: principal.principalType,
          message: 'Pack40D2 indirect execution claimed (merchant service).',
        });

        return {
          requestId: request.id,
          attemptId: boundAttemptId,
          attemptNumber,
          executionKey,
          attemptState: VionaRequestExecutionAttemptState.claimed,
          requestStatus: VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS,
          statusEventId,
          auditEventId,
          leaseOwner,
          leaseExpiresAt,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof VionaRequestIndirectExecutionError) {
      throw error;
    }
    const conflict = mapKnownPrismaConflict(error);
    if (conflict != null) {
      throwIndirect(conflict);
    }
    throw error;
  }
}

async function finalizeTerminal(
  input: FinalizeVionaRequestExecutionInput,
  deps: VionaRequestIndirectStatusActionDeps,
  outcome: {
    expectedAttemptState: VionaRequestExecutionAttemptState;
    nextAttemptState:
      | typeof VionaRequestExecutionAttemptState.completed
      | typeof VionaRequestExecutionAttemptState.failed;
    nextRequestStatus:
      | typeof VIONA_REQUEST_INDIRECT_COMPLETED_STATUS
      | typeof VIONA_REQUEST_INDIRECT_FAILED_STATUS;
    eventCategory: string;
    message: string;
  },
): Promise<FinalizeVionaRequestExecutionResult> {
  const attemptId = input.attemptId.trim();
  const requestId = input.requestId.trim();
  const expectedLeaseOwner = input.expectedLeaseOwner.trim();
  if (attemptId.length === 0 || requestId.length === 0 || expectedLeaseOwner.length === 0) {
    throwIndirect('invalid_attempt_state');
  }

  const prisma = deps.prisma ?? defaultPrisma();
  const clock = deps.clock ?? (() => new Date());

  try {
    return await prisma.$transaction(
      async (tx) => {
        const now = clock();
        const attempt = await findVionaRequestExecutionAttemptById(
          tx as VionaRequestExecutionAttemptClient,
          attemptId,
        );
        if (attempt == null) {
          throwIndirect('attempt_not_found');
        }

        if (attempt.requestId !== requestId) {
          throwIndirect('request_attempt_mismatch');
        }

        if (attempt.state === VionaRequestExecutionAttemptState.outcomeUncertain) {
          throwIndirect('uncertain_provider_outcome');
        }

        const terminalStates: readonly VionaRequestExecutionAttemptState[] = [
          VionaRequestExecutionAttemptState.completed,
          VionaRequestExecutionAttemptState.failed,
          VionaRequestExecutionAttemptState.abandoned,
        ];
        if (terminalStates.includes(attempt.state)) {
          throwIndirect('terminal_transition_conflict');
        }

        if (attempt.state !== outcome.expectedAttemptState) {
          throwIndirect('invalid_attempt_state');
        }

        if (attempt.leaseOwner !== expectedLeaseOwner) {
          throwIndirect('stale_lease_owner');
        }

        if (attempt.leaseExpiresAt != null && attempt.leaseExpiresAt.getTime() <= now.getTime()) {
          throwIndirect('stale_lease_owner');
        }

        const request = await tx.vionaRequest.findFirst({
          where: {
            id: requestId,
            status: VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS,
          },
          select: { id: true, status: true },
        });
        if (request == null) {
          throwIndirect('terminal_transition_conflict');
        }

        const requestUpdate = await tx.vionaRequest.updateMany({
          where: {
            id: requestId,
            status: VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS,
          },
          data: { status: outcome.nextRequestStatus },
        });
        if (requestUpdate.count !== 1) {
          throwIndirect('terminal_transition_conflict');
        }

        const attemptUpdate = await transitionVionaRequestExecutionAttemptState(
          tx as VionaRequestExecutionAttemptClient,
          {
            attemptId,
            expectedRequestId: requestId,
            expectedStates: [outcome.expectedAttemptState],
            expectedLeaseOwner,
            nextState: outcome.nextAttemptState,
            finalizedAt: now,
          },
        );
        if (!attemptUpdate.updated) {
          throwIndirect('terminal_transition_conflict');
        }

        const { statusEventId, auditEventId } = await writeStatusEventAndAudit(tx, {
          requestId,
          fromStatus: VIONA_REQUEST_INDIRECT_CLAIM_TO_STATUS,
          toStatus: outcome.nextRequestStatus,
          changedByUserId: attempt.triggeringUserId,
          executionAttemptId: attemptId,
          eventCategory: outcome.eventCategory,
          correlationId: attempt.correlationId,
          triggerType: attempt.triggerType,
          principalType: attempt.principalType,
          message: outcome.message,
        });

        return {
          requestId,
          attemptId,
          attemptState: outcome.nextAttemptState,
          requestStatus: outcome.nextRequestStatus,
          statusEventId,
          auditEventId,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof VionaRequestIndirectExecutionError) {
      throw error;
    }
    const conflict = mapKnownPrismaConflict(error);
    if (conflict != null) {
      throwIndirect('terminal_transition_conflict');
    }
    throw error;
  }
}

/**
 * Finalize after durable providerSucceeded on the exact attempt — request inProgress→completed.
 * Does not require current MerchantProfile.isActive (Policy A after provider success).
 */
export async function finalizeVionaRequestExecutionCompleted(
  input: FinalizeVionaRequestExecutionInput,
  deps: VionaRequestIndirectStatusActionDeps = {},
): Promise<FinalizeVionaRequestExecutionResult> {
  return finalizeTerminal(input, deps, {
    expectedAttemptState: VionaRequestExecutionAttemptState.providerSucceeded,
    nextAttemptState: VionaRequestExecutionAttemptState.completed,
    nextRequestStatus: VIONA_REQUEST_INDIRECT_COMPLETED_STATUS,
    eventCategory: VIONA_PACK40D2_EVENT_CATEGORY_COMPLETED,
    message: 'Pack40D2 indirect execution completed.',
  });
}

/**
 * Finalize after durable providerFailed on the exact attempt — request inProgress→failed.
 */
export async function finalizeVionaRequestExecutionFailed(
  input: FinalizeVionaRequestExecutionInput,
  deps: VionaRequestIndirectStatusActionDeps = {},
): Promise<FinalizeVionaRequestExecutionResult> {
  return finalizeTerminal(input, deps, {
    expectedAttemptState: VionaRequestExecutionAttemptState.providerFailed,
    nextAttemptState: VionaRequestExecutionAttemptState.failed,
    nextRequestStatus: VIONA_REQUEST_INDIRECT_FAILED_STATUS,
    eventCategory: VIONA_PACK40D2_EVENT_CATEGORY_FAILED,
    message: 'Pack40D2 indirect execution failed.',
  });
}

/** Test/helper: expose principal type for snapshot assertions without importing Pack40C. */
export type { TrustedExecutionTrigger, VionaRequestExecutionPrincipalContext, VionaRequestExecutionAttempt };
