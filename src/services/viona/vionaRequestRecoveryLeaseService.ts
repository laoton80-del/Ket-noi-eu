/**
 * Pack40DR2 — dormant generation-fenced recovery lease acquisition.
 *
 * No provider/escrow/request-status mutation. Unwired from HTTP.
 */

import { VionaRequestExecutionAttemptState } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  acquireVionaRequestExecutionAttemptRecoveryLease,
  findVionaRequestExecutionAttemptForRecovery,
  VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES,
  type VionaRequestExecutionAttemptClient,
  type VionaRequestExecutionRecoveryAttempt,
} from '../../repositories/vionaRequestExecutionAttemptRepository';
import {
  isVionaRequestSystemRecoveryPrincipal,
  type VionaRequestSystemRecoveryPrincipal,
} from './vionaRequestSystemRecoveryPrincipal';

export type RecoveryLeaseErrorCode =
  | 'invalid_recovery_principal'
  | 'attempt_not_found'
  | 'terminal_attempt_immutable'
  | 'lease_not_expired'
  | 'stale_lease_generation'
  | 'recovery_lease_cas_miss'
  | 'invalid_input';

export class VionaRequestRecoveryLeaseError extends Error {
  readonly code: RecoveryLeaseErrorCode;

  constructor(code: RecoveryLeaseErrorCode) {
    super(code);
    this.name = 'VionaRequestRecoveryLeaseError';
    this.code = code;
  }
}

export type AcquireRecoveryLeaseInput = Readonly<{
  attemptId: string;
  expectedLeaseGeneration: number;
  newLeaseOwner: string;
  newLeaseExpiresAt: Date;
  recoveryPrincipal: VionaRequestSystemRecoveryPrincipal;
  now?: Date;
}>;

export type AcquireRecoveryLeaseResult = Readonly<{
  attemptId: string;
  requestId: string;
  attemptState: VionaRequestExecutionAttemptState;
  leaseOwner: string;
  leaseExpiresAt: Date;
  leaseGeneration: number;
  casUpdated: true;
}>;

export type ClassifyRecoverableAttemptResult = Readonly<{
  classification:
    | 'unstarted_attempt_requires_operator_decision'
    | 'provider_reference_missing_operator_review'
    | 'eligible_provider_reconciliation'
    | 'eligible_success_escrow_finalization'
    | 'eligible_failure_escrow_finalization'
    | 'terminal_immutable'
    | 'recovery_not_applicable';
  attempt: VionaRequestExecutionRecoveryAttempt;
}>;

type LeasePrisma = Pick<ReturnType<typeof getPrisma>, 'vionaRequestExecutionAttempt' | '$transaction'>;

export type RecoveryLeaseServiceDeps = Readonly<{
  prisma?: LeasePrisma;
  clock?: () => Date;
}>;

function throwLease(code: RecoveryLeaseErrorCode): never {
  throw new VionaRequestRecoveryLeaseError(code);
}

export function classifyRecoverableAttempt(
  attempt: VionaRequestExecutionRecoveryAttempt,
): ClassifyRecoverableAttemptResult {
  if (
    attempt.state === VionaRequestExecutionAttemptState.completed ||
    attempt.state === VionaRequestExecutionAttemptState.failed ||
    attempt.state === VionaRequestExecutionAttemptState.abandoned
  ) {
    return { classification: 'terminal_immutable', attempt };
  }
  if (attempt.state === VionaRequestExecutionAttemptState.claimed) {
    return { classification: 'unstarted_attempt_requires_operator_decision', attempt };
  }
  if (
    attempt.state === VionaRequestExecutionAttemptState.providerPending ||
    attempt.state === VionaRequestExecutionAttemptState.outcomeUncertain
  ) {
    if (
      attempt.providerExternalReference == null ||
      attempt.providerExternalReference.trim().length === 0
    ) {
      return { classification: 'provider_reference_missing_operator_review', attempt };
    }
    return { classification: 'eligible_provider_reconciliation', attempt };
  }
  if (attempt.state === VionaRequestExecutionAttemptState.providerSucceeded) {
    return { classification: 'eligible_success_escrow_finalization', attempt };
  }
  if (attempt.state === VionaRequestExecutionAttemptState.providerFailed) {
    return { classification: 'eligible_failure_escrow_finalization', attempt };
  }
  return { classification: 'recovery_not_applicable', attempt };
}

/**
 * Acquire recovery ownership for one exact attempt. Increments leaseGeneration by 1 on success.
 * Does not change attempt state or request status.
 */
export async function acquireRecoveryLease(
  input: AcquireRecoveryLeaseInput,
  deps: RecoveryLeaseServiceDeps = {},
): Promise<AcquireRecoveryLeaseResult> {
  if (!isVionaRequestSystemRecoveryPrincipal(input.recoveryPrincipal)) {
    throwLease('invalid_recovery_principal');
  }

  const attemptId = input.attemptId.trim();
  const newLeaseOwner = input.newLeaseOwner.trim();
  if (
    attemptId.length === 0 ||
    newLeaseOwner.length === 0 ||
    !Number.isInteger(input.expectedLeaseGeneration) ||
    input.expectedLeaseGeneration < 0
  ) {
    throwLease('invalid_input');
  }

  const prisma = deps.prisma ?? getPrisma();
  const clock = deps.clock ?? (() => new Date());
  const now = input.now ?? clock();

  return prisma.$transaction(async (tx) => {
    const client = tx as VionaRequestExecutionAttemptClient;
    const existing = await findVionaRequestExecutionAttemptForRecovery(client, attemptId);
    if (existing == null) {
      throwLease('attempt_not_found');
    }

    const classified = classifyRecoverableAttempt(existing);
    if (classified.classification === 'terminal_immutable') {
      throwLease('terminal_attempt_immutable');
    }

    if (existing.leaseGeneration !== input.expectedLeaseGeneration) {
      throwLease('stale_lease_generation');
    }

    const leaseExpired =
      existing.leaseOwner == null ||
      (existing.leaseExpiresAt != null && existing.leaseExpiresAt.getTime() <= now.getTime());
    if (!leaseExpired) {
      throwLease('lease_not_expired');
    }

    const acquired = await acquireVionaRequestExecutionAttemptRecoveryLease(client, {
      attemptId,
      expectedLeaseGeneration: input.expectedLeaseGeneration,
      expectedStates: [...VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES],
      newLeaseOwner,
      newLeaseExpiresAt: input.newLeaseExpiresAt,
      now,
    });

    if (!acquired.updated || acquired.leaseGeneration == null || acquired.attempt == null) {
      throwLease('recovery_lease_cas_miss');
    }

    return {
      attemptId,
      requestId: acquired.attempt.requestId,
      attemptState: acquired.attempt.state,
      leaseOwner: newLeaseOwner,
      leaseExpiresAt: input.newLeaseExpiresAt,
      leaseGeneration: acquired.leaseGeneration,
      casUpdated: true as const,
    };
  });
}
