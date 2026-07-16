/**
 * Pack40DR2 — dormant generation-fenced recovered terminal finalization.
 *
 * Does not weaken Pack40D2 finalize. Separate recovery path. Unwired from HTTP.
 */

import { Prisma, VionaRequestExecutionAttemptState } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  findVionaRequestExecutionAttemptForRecovery,
  transitionVionaRequestExecutionAttemptStateWithGeneration,
  type VionaRequestExecutionAttemptClient,
} from '../../repositories/vionaRequestExecutionAttemptRepository';
import {
  VIONA_RECOVERY_AUDIT_ACTOR_ROLE,
  isVionaRequestSystemRecoveryPrincipal,
  type VionaRequestSystemRecoveryPrincipal,
} from './vionaRequestSystemRecoveryPrincipal';

/** Mirror Pack40D2 request lifecycle literals without importing the D2 service module. */
const VIONA_RECOVERY_AUDIT_EVENT_TYPE = 'stateTransition' as const;
const VIONA_RECOVERY_IN_PROGRESS_STATUS = 'inProgress' as const;
const VIONA_RECOVERY_COMPLETED_STATUS = 'completed' as const;
const VIONA_RECOVERY_FAILED_STATUS = 'failed' as const;

export const VIONA_PACK40DR2_EVENT_CATEGORY_RECOVERED_COMPLETED =
  'execution.recovery.terminal_completed' as const;
export const VIONA_PACK40DR2_EVENT_CATEGORY_RECOVERED_FAILED =
  'execution.recovery.terminal_failed' as const;

export type RecoveredFinalizationErrorCode =
  | 'invalid_recovery_principal'
  | 'attempt_not_found'
  | 'stale_lease_generation'
  | 'stale_lease_owner'
  | 'expired_recovery_lease'
  | 'invalid_attempt_state'
  | 'request_attempt_mismatch'
  | 'wrong_request_status'
  | 'terminal_transition_conflict'
  | 'duplicate_terminal_noop'
  | 'invalid_input';

export class VionaRequestRecoveredFinalizationError extends Error {
  readonly code: RecoveredFinalizationErrorCode;

  constructor(code: RecoveredFinalizationErrorCode) {
    super(code);
    this.name = 'VionaRequestRecoveredFinalizationError';
    this.code = code;
  }
}

export type RecoveredFinalizeInput = Readonly<{
  attemptId: string;
  requestId: string;
  expectedLeaseOwner: string;
  expectedLeaseGeneration: number;
  recoveryPrincipal: VionaRequestSystemRecoveryPrincipal;
}>;

export type RecoveredFinalizeResult = Readonly<{
  requestId: string;
  attemptId: string;
  attemptState:
    | typeof VionaRequestExecutionAttemptState.completed
    | typeof VionaRequestExecutionAttemptState.failed;
  requestStatus:
    | typeof VIONA_RECOVERY_COMPLETED_STATUS
    | typeof VIONA_RECOVERY_FAILED_STATUS;
  statusEventId: string;
  auditEventId: string;
  leaseGeneration: number;
  idempotentReplay: boolean;
}>;

type FinalizePrisma = Pick<
  ReturnType<typeof getPrisma>,
  | 'vionaRequest'
  | 'vionaRequestExecutionAttempt'
  | 'vionaRequestStatusEvent'
  | 'vionaRequestAuditEvent'
  | '$transaction'
>;

export type RecoveredFinalizationDeps = Readonly<{
  prisma?: FinalizePrisma;
  clock?: () => Date;
  createId?: () => string;
}>;

function throwFinalize(code: RecoveredFinalizationErrorCode): never {
  throw new VionaRequestRecoveredFinalizationError(code);
}

function buildRecoveryStatusReason(attemptId: string, category: string): string {
  return `pack40dr2.executionAttemptId=${attemptId};category=${category}`;
}

async function finalizeRecoveredTerminal(
  input: RecoveredFinalizeInput,
  deps: RecoveredFinalizationDeps,
  outcome: {
    expectedAttemptState: VionaRequestExecutionAttemptState;
    nextAttemptState:
      | typeof VionaRequestExecutionAttemptState.completed
      | typeof VionaRequestExecutionAttemptState.failed;
    nextRequestStatus:
      | typeof VIONA_RECOVERY_COMPLETED_STATUS
      | typeof VIONA_RECOVERY_FAILED_STATUS;
    eventCategory: string;
    message: string;
  },
): Promise<RecoveredFinalizeResult> {
  if (!isVionaRequestSystemRecoveryPrincipal(input.recoveryPrincipal)) {
    throwFinalize('invalid_recovery_principal');
  }

  const attemptId = input.attemptId.trim();
  const requestId = input.requestId.trim();
  const expectedLeaseOwner = input.expectedLeaseOwner.trim();
  if (
    attemptId.length === 0 ||
    requestId.length === 0 ||
    expectedLeaseOwner.length === 0 ||
    !Number.isInteger(input.expectedLeaseGeneration)
  ) {
    throwFinalize('invalid_input');
  }

  const prisma = deps.prisma ?? getPrisma();
  const clock = deps.clock ?? (() => new Date());
  const createId = deps.createId;

  return prisma.$transaction(
    async (tx) => {
      const now = clock();
      const attempt = await findVionaRequestExecutionAttemptForRecovery(
        tx as VionaRequestExecutionAttemptClient,
        attemptId,
      );
      if (attempt == null) throwFinalize('attempt_not_found');
      if (attempt.requestId !== requestId) throwFinalize('request_attempt_mismatch');

      if (
        attempt.state === outcome.nextAttemptState
      ) {
        const request = await tx.vionaRequest.findUnique({
          where: { id: requestId },
          select: { status: true },
        });
        if (request?.status === outcome.nextRequestStatus) {
          return {
            requestId,
            attemptId,
            attemptState: outcome.nextAttemptState,
            requestStatus: outcome.nextRequestStatus,
            statusEventId: 'idempotent',
            auditEventId: 'idempotent',
            leaseGeneration: attempt.leaseGeneration,
            idempotentReplay: true,
          };
        }
      }

      if (attempt.state !== outcome.expectedAttemptState) {
        throwFinalize('invalid_attempt_state');
      }
      if (attempt.leaseOwner !== expectedLeaseOwner) throwFinalize('stale_lease_owner');
      if (attempt.leaseGeneration !== input.expectedLeaseGeneration) {
        throwFinalize('stale_lease_generation');
      }
      if (attempt.leaseExpiresAt != null && attempt.leaseExpiresAt.getTime() <= now.getTime()) {
        throwFinalize('expired_recovery_lease');
      }

      const request = await tx.vionaRequest.findFirst({
        where: { id: requestId, status: VIONA_RECOVERY_IN_PROGRESS_STATUS },
        select: { id: true },
      });
      if (request == null) throwFinalize('wrong_request_status');

      const requestUpdate = await tx.vionaRequest.updateMany({
        where: { id: requestId, status: VIONA_RECOVERY_IN_PROGRESS_STATUS },
        data: { status: outcome.nextRequestStatus },
      });
      if (requestUpdate.count !== 1) throwFinalize('terminal_transition_conflict');

      const attemptUpdate = await transitionVionaRequestExecutionAttemptStateWithGeneration(
        tx as VionaRequestExecutionAttemptClient,
        {
          attemptId,
          expectedRequestId: requestId,
          expectedStates: [outcome.expectedAttemptState],
          expectedLeaseOwner,
          expectedLeaseGeneration: input.expectedLeaseGeneration,
          nextState: outcome.nextAttemptState,
          finalizedAt: now,
        },
      );
      if (!attemptUpdate.updated || attemptUpdate.attempt == null) {
        throwFinalize('terminal_transition_conflict');
      }

      const statusEvent = await tx.vionaRequestStatusEvent.create({
        data: {
          ...(createId != null ? { id: createId() } : {}),
          requestId,
          fromStatus: VIONA_RECOVERY_IN_PROGRESS_STATUS,
          toStatus: outcome.nextRequestStatus,
          changedByUserId: input.recoveryPrincipal.triggeringUserId,
          reason: buildRecoveryStatusReason(attemptId, outcome.eventCategory),
        },
      });

      const auditEvent = await tx.vionaRequestAuditEvent.create({
        data: {
          ...(createId != null ? { id: createId() } : {}),
          requestId,
          eventType: VIONA_RECOVERY_AUDIT_EVENT_TYPE,
          actorUserId: input.recoveryPrincipal.triggeringUserId,
          actorRoleLabel: VIONA_RECOVERY_AUDIT_ACTOR_ROLE,
          message: outcome.message,
          payloadJson: {
            fromStatus: VIONA_RECOVERY_IN_PROGRESS_STATUS,
            toStatus: outcome.nextRequestStatus,
            statusEventId: statusEvent.id,
            executionAttemptId: attemptId,
            eventCategory: outcome.eventCategory,
            correlationId: input.recoveryPrincipal.correlationId,
            triggerType: input.recoveryPrincipal.triggerType,
            principalType: input.recoveryPrincipal.principalType,
            leaseGeneration: input.expectedLeaseGeneration,
            recoveryClassification: outcome.eventCategory,
          },
        },
      });

      return {
        requestId,
        attemptId,
        attemptState: outcome.nextAttemptState,
        requestStatus: outcome.nextRequestStatus,
        statusEventId: statusEvent.id,
        auditEventId: auditEvent.id,
        leaseGeneration: attemptUpdate.attempt.leaseGeneration,
        idempotentReplay: false,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function finalizeRecoveredExecutionCompleted(
  input: RecoveredFinalizeInput,
  deps: RecoveredFinalizationDeps = {},
): Promise<RecoveredFinalizeResult> {
  return finalizeRecoveredTerminal(input, deps, {
    expectedAttemptState: VionaRequestExecutionAttemptState.providerSucceeded,
    nextAttemptState: VionaRequestExecutionAttemptState.completed,
    nextRequestStatus: VIONA_RECOVERY_COMPLETED_STATUS,
    eventCategory: VIONA_PACK40DR2_EVENT_CATEGORY_RECOVERED_COMPLETED,
    message: 'Pack40DR2 recovered execution completed.',
  });
}

export async function finalizeRecoveredExecutionFailed(
  input: RecoveredFinalizeInput,
  deps: RecoveredFinalizationDeps = {},
): Promise<RecoveredFinalizeResult> {
  return finalizeRecoveredTerminal(input, deps, {
    expectedAttemptState: VionaRequestExecutionAttemptState.providerFailed,
    nextAttemptState: VionaRequestExecutionAttemptState.failed,
    nextRequestStatus: VIONA_RECOVERY_FAILED_STATUS,
    eventCategory: VIONA_PACK40DR2_EVENT_CATEGORY_RECOVERED_FAILED,
    message: 'Pack40DR2 recovered execution failed.',
  });
}
