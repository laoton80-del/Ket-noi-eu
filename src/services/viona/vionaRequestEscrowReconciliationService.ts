/**
 * Pack40DR2 — dormant attempt-scoped escrow reconciliation (injected adapter only).
 *
 * No provider calls. No outcomeUncertain escrow mutation. Unwired from HTTP.
 */

import { VionaRequestExecutionAttemptState } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { findVionaRequestExecutionAttemptForRecovery } from '../../repositories/vionaRequestExecutionAttemptRepository';
import type { VionaRecoveryEscrowAdapter } from './vionaRecoveryEscrowAdapterContract';
import { isVionaRequestSystemRecoveryPrincipal } from './vionaRequestSystemRecoveryPrincipal';
import type { VionaRequestSystemRecoveryPrincipal } from './vionaRequestSystemRecoveryPrincipal';

export type EscrowReconciliationErrorCode =
  | 'invalid_recovery_principal'
  | 'attempt_not_found'
  | 'stale_lease_generation'
  | 'stale_lease_owner'
  | 'expired_recovery_lease'
  | 'invalid_attempt_state'
  | 'outcome_uncertain_escrow_forbidden'
  | 'hold_not_found'
  | 'escrow_key_mismatch'
  | 'escrow_operation_uncertain'
  | 'escrow_operation_failed'
  | 'invalid_input';

export class VionaRequestEscrowReconciliationError extends Error {
  readonly code: EscrowReconciliationErrorCode;

  constructor(code: EscrowReconciliationErrorCode) {
    super(code);
    this.name = 'VionaRequestEscrowReconciliationError';
    this.code = code;
  }
}

export type ReconcileEscrowForRecoveryInput = Readonly<{
  attemptId: string;
  expectedLeaseOwner: string;
  expectedLeaseGeneration: number;
  recoveryPrincipal: VionaRequestSystemRecoveryPrincipal;
  /** When set, must match attempt-scoped key fragment; request-only keys rejected. */
  expectedEscrowIdempotencyKey?: string;
}>;

export type ReconcileEscrowForRecoveryResult = Readonly<{
  classification: 'escrow_reconciliation_completed';
  holdStatus: 'SETTLED' | 'REFUNDED';
  deduplicated: boolean;
  attemptId: string;
  requestId: string;
  attemptState: VionaRequestExecutionAttemptState;
  leaseGeneration: number;
}>;

type EscrowReconPrisma = Pick<ReturnType<typeof getPrisma>, 'vionaRequestExecutionAttempt'>;

export type EscrowReconciliationDeps = Readonly<{
  prisma?: EscrowReconPrisma;
  clock?: () => Date;
  escrowAdapter: VionaRecoveryEscrowAdapter;
}>;

function throwEscrow(code: EscrowReconciliationErrorCode): never {
  throw new VionaRequestEscrowReconciliationError(code);
}

function expectedAttemptScopedKey(requestId: string, attemptId: string, operation: string): string {
  return `escrow:${requestId}:${attemptId}:${operation}`;
}

export async function reconcileEscrowForRecoveredProviderOutcome(
  input: ReconcileEscrowForRecoveryInput,
  deps: EscrowReconciliationDeps,
): Promise<ReconcileEscrowForRecoveryResult> {
  if (!isVionaRequestSystemRecoveryPrincipal(input.recoveryPrincipal)) {
    throwEscrow('invalid_recovery_principal');
  }

  const attemptId = input.attemptId.trim();
  const expectedLeaseOwner = input.expectedLeaseOwner.trim();
  if (attemptId.length === 0 || expectedLeaseOwner.length === 0) {
    throwEscrow('invalid_input');
  }

  const prisma = deps.prisma ?? getPrisma();
  const clock = deps.clock ?? (() => new Date());
  const now = clock();

  const attempt = await findVionaRequestExecutionAttemptForRecovery(
    { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt },
    attemptId,
  );
  if (attempt == null) throwEscrow('attempt_not_found');
  if (attempt.leaseOwner !== expectedLeaseOwner) throwEscrow('stale_lease_owner');
  if (attempt.leaseGeneration !== input.expectedLeaseGeneration) {
    throwEscrow('stale_lease_generation');
  }
  if (attempt.leaseExpiresAt != null && attempt.leaseExpiresAt.getTime() <= now.getTime()) {
    throwEscrow('expired_recovery_lease');
  }
  if (attempt.state === VionaRequestExecutionAttemptState.outcomeUncertain) {
    throwEscrow('outcome_uncertain_escrow_forbidden');
  }
  if (
    attempt.state !== VionaRequestExecutionAttemptState.providerSucceeded &&
    attempt.state !== VionaRequestExecutionAttemptState.providerFailed
  ) {
    throwEscrow('invalid_attempt_state');
  }

  const operationCategory = attempt.operationCategory?.trim() || 'twilio_test_sms';
  const expectedKey = expectedAttemptScopedKey(attempt.requestId, attempt.id, operationCategory);
  if (
    input.expectedEscrowIdempotencyKey != null &&
    input.expectedEscrowIdempotencyKey.trim() !== expectedKey
  ) {
    throwEscrow('escrow_key_mismatch');
  }
  if (
    input.expectedEscrowIdempotencyKey != null &&
    !input.expectedEscrowIdempotencyKey.includes(attempt.id)
  ) {
    throwEscrow('escrow_key_mismatch');
  }

  const hold = await deps.escrowAdapter.inspectExactHold({
    requestId: attempt.requestId,
    executionAttemptId: attempt.id,
    operationCategory,
  });
  if (hold == null) throwEscrow('hold_not_found');
  if (hold.idempotencyKey !== expectedKey || hold.requestId !== attempt.requestId) {
    throwEscrow('escrow_key_mismatch');
  }

  if (attempt.state === VionaRequestExecutionAttemptState.providerSucceeded) {
    const settled = await deps.escrowAdapter.settleExactHoldIdempotently({
      holdId: hold.holdId,
      requestId: attempt.requestId,
      executionAttemptId: attempt.id,
      operationCategory,
    });
    if (settled.uncertainty) throwEscrow('escrow_operation_uncertain');
    if (!settled.ok || settled.status !== 'SETTLED') throwEscrow('escrow_operation_failed');
    return {
      classification: 'escrow_reconciliation_completed',
      holdStatus: 'SETTLED',
      deduplicated: settled.deduplicated,
      attemptId: attempt.id,
      requestId: attempt.requestId,
      attemptState: attempt.state,
      leaseGeneration: attempt.leaseGeneration,
    };
  }

  const refunded = await deps.escrowAdapter.releaseOrRefundExactHoldIdempotently({
    holdId: hold.holdId,
    requestId: attempt.requestId,
    executionAttemptId: attempt.id,
    operationCategory,
  });
  if (refunded.uncertainty) throwEscrow('escrow_operation_uncertain');
  if (!refunded.ok || refunded.status !== 'REFUNDED') throwEscrow('escrow_operation_failed');
  return {
    classification: 'escrow_reconciliation_completed',
    holdStatus: 'REFUNDED',
    deduplicated: refunded.deduplicated,
    attemptId: attempt.id,
    requestId: attempt.requestId,
    attemptState: attempt.state,
    leaseGeneration: attempt.leaseGeneration,
  };
}
