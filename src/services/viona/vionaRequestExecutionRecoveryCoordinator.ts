/**
 * Pack40DR3B — thin recovery coordinator wiring dormant Pack40DR2 services.
 *
 * One exact attempt per invocation. No provider send. No scheduler. No scan.
 */

import { VionaRequestExecutionAttemptState } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { getPrisma } from '../../lib/prisma';
import { findVionaRequestExecutionAttemptForRecovery } from '../../repositories/vionaRequestExecutionAttemptRepository';
import type { VionaProviderStatusLookupAdapter } from './vionaProviderStatusLookupContract';
import { createPack40DR3RecoveryEscrowAdapter } from './vionaPack40DR3RecoveryEscrowAdapter';
import { createPack40DR3TwilioExactStatusLookupAdapter } from './vionaPack40DR3TwilioExactStatusLookupAdapter';
import type { VionaRecoveryEscrowAdapter } from './vionaRecoveryEscrowAdapterContract';
import {
  reconcileEscrowForRecoveredProviderOutcome,
  VionaRequestEscrowReconciliationError,
} from './vionaRequestEscrowReconciliationService';
import {
  reconcileProviderOutcomeForRecovery,
  VionaRequestProviderReconciliationError,
} from './vionaRequestProviderReconciliationService';
import {
  finalizeRecoveredExecutionCompleted,
  finalizeRecoveredExecutionFailed,
  VionaRequestRecoveredFinalizationError,
} from './vionaRequestRecoveredFinalizationService';
import {
  acquireRecoveryLease,
  classifyRecoverableAttempt,
  VionaRequestRecoveryLeaseError,
} from './vionaRequestRecoveryLeaseService';
import type { VionaRequestSystemRecoveryPrincipal } from './vionaRequestSystemRecoveryPrincipal';

export const PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX = 'pack40dr3b-recovery' as const;
export const PACK40DR3B_RECOVERY_LEASE_TTL_MS = 10 * 60 * 1000;

export type RecoverVionaExecutionAttemptInput = Readonly<{
  attemptId: string;
  recoveryPrincipal: VionaRequestSystemRecoveryPrincipal;
  mode?: 'reconcile';
}>;

export type RecoverVionaExecutionAttemptSuccessCategory =
  | 'recovered_completed'
  | 'recovered_failed'
  | 'remains_uncertain'
  | 'already_terminal'
  | 'operator_review_required';

export type RecoverVionaExecutionAttemptFailureCategory =
  | 'not_found'
  | 'recovery_conflict'
  | 'invalid_input'
  | 'recovery_unavailable';

export type RecoverVionaExecutionAttemptResult = Readonly<
  | {
      ok: true;
      category: RecoverVionaExecutionAttemptSuccessCategory;
      attemptId: string;
      requestId: string;
      operatorReviewReason?: 'unstarted_attempt' | 'provider_reference_missing' | 'lookup_transport_uncertain';
    }
  | {
      ok: false;
      category: RecoverVionaExecutionAttemptFailureCategory;
    }
>;

export type RecoverVionaExecutionAttemptDeps = Readonly<{
  prisma?: ReturnType<typeof getPrisma>;
  clock?: () => Date;
  createRecoveryLeaseOwner?: (correlationId: string) => string;
  providerStatusLookup?: VionaProviderStatusLookupAdapter;
  escrowAdapter?: VionaRecoveryEscrowAdapter;
}>;

function buildRecoveryLeaseOwner(correlationId: string): string {
  return `${PACK40DR3B_RECOVERY_LEASE_OWNER_PREFIX}:${correlationId}`;
}

function success(
  category: RecoverVionaExecutionAttemptSuccessCategory,
  attemptId: string,
  requestId: string,
  operatorReviewReason?: 'unstarted_attempt' | 'provider_reference_missing' | 'lookup_transport_uncertain',
): RecoverVionaExecutionAttemptResult {
  if (operatorReviewReason != null) {
    return { ok: true, category, attemptId, requestId, operatorReviewReason };
  }
  return { ok: true, category, attemptId, requestId };
}

function failure(category: RecoverVionaExecutionAttemptFailureCategory): RecoverVionaExecutionAttemptResult {
  return { ok: false, category };
}

async function maybeFinalizeAfterEscrow(
  input: Readonly<{
    attemptId: string;
    requestId: string;
    leaseOwner: string;
    leaseGeneration: number;
    recoveryPrincipal: VionaRequestSystemRecoveryPrincipal;
    attemptState: VionaRequestExecutionAttemptState;
  }>,
  deps: RecoverVionaExecutionAttemptDeps,
): Promise<RecoverVionaExecutionAttemptResult> {
  const prisma = deps.prisma ?? getPrisma();
  const escrowAdapter = deps.escrowAdapter ?? createPack40DR3RecoveryEscrowAdapter({ prismaClient: prisma as never });

  try {
    await reconcileEscrowForRecoveredProviderOutcome(
      {
        attemptId: input.attemptId,
        expectedLeaseOwner: input.leaseOwner,
        expectedLeaseGeneration: input.leaseGeneration,
        recoveryPrincipal: input.recoveryPrincipal,
      },
      { prisma: prisma as never, escrowAdapter, clock: deps.clock },
    );
  } catch (error) {
    if (error instanceof VionaRequestEscrowReconciliationError) {
      return failure('recovery_conflict');
    }
    return failure('recovery_unavailable');
  }

  try {
    if (input.attemptState === VionaRequestExecutionAttemptState.providerSucceeded) {
      await finalizeRecoveredExecutionCompleted(
        {
          attemptId: input.attemptId,
          requestId: input.requestId,
          expectedLeaseOwner: input.leaseOwner,
          expectedLeaseGeneration: input.leaseGeneration,
          recoveryPrincipal: input.recoveryPrincipal,
        },
        { prisma: prisma as never, clock: deps.clock },
      );
      return success('recovered_completed', input.attemptId, input.requestId);
    }
    if (input.attemptState === VionaRequestExecutionAttemptState.providerFailed) {
      await finalizeRecoveredExecutionFailed(
        {
          attemptId: input.attemptId,
          requestId: input.requestId,
          expectedLeaseOwner: input.leaseOwner,
          expectedLeaseGeneration: input.leaseGeneration,
          recoveryPrincipal: input.recoveryPrincipal,
        },
        { prisma: prisma as never, clock: deps.clock },
      );
      return success('recovered_failed', input.attemptId, input.requestId);
    }
    return failure('recovery_conflict');
  } catch (error) {
    if (error instanceof VionaRequestRecoveredFinalizationError) {
      if (error.code === 'duplicate_terminal_noop') {
        return input.attemptState === VionaRequestExecutionAttemptState.providerSucceeded
          ? success('recovered_completed', input.attemptId, input.requestId)
          : success('recovered_failed', input.attemptId, input.requestId);
      }
      return failure('recovery_conflict');
    }
    return failure('recovery_unavailable');
  }
}

/**
 * Recover one exact existing attempt. Assesses safe action from persisted truth.
 */
export async function recoverVionaExecutionAttempt(
  input: RecoverVionaExecutionAttemptInput,
  deps: RecoverVionaExecutionAttemptDeps = {},
): Promise<RecoverVionaExecutionAttemptResult> {
  const attemptId = input.attemptId.trim();
  if (attemptId.length === 0 || input.mode != null && input.mode !== 'reconcile') {
    return failure('invalid_input');
  }

  const prisma = deps.prisma ?? getPrisma();
  const clock = deps.clock ?? (() => new Date());
  const createRecoveryLeaseOwner = deps.createRecoveryLeaseOwner ?? buildRecoveryLeaseOwner;
  const providerStatusLookup =
    deps.providerStatusLookup ?? createPack40DR3TwilioExactStatusLookupAdapter();

  const attempt = await findVionaRequestExecutionAttemptForRecovery(
    { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt },
    attemptId,
  );
  if (attempt == null) {
    return failure('not_found');
  }

  const initial = classifyRecoverableAttempt(attempt);
  if (initial.classification === 'terminal_immutable') {
    return success('already_terminal', attempt.id, attempt.requestId);
  }
  if (initial.classification === 'unstarted_attempt_requires_operator_decision') {
    return {
      ok: true,
      category: 'operator_review_required',
      attemptId: attempt.id,
      requestId: attempt.requestId,
      operatorReviewReason: 'unstarted_attempt',
    };
  }
  if (initial.classification === 'provider_reference_missing_operator_review') {
    return {
      ok: true,
      category: 'operator_review_required',
      attemptId: attempt.id,
      requestId: attempt.requestId,
      operatorReviewReason: 'provider_reference_missing',
    };
  }
  if (initial.classification === 'recovery_not_applicable') {
    return failure('recovery_conflict');
  }

  const leaseOwner = createRecoveryLeaseOwner(input.recoveryPrincipal.correlationId);
  const leaseExpiresAt = new Date(clock().getTime() + PACK40DR3B_RECOVERY_LEASE_TTL_MS);

  let leaseGeneration: number;
  try {
    const leased = await acquireRecoveryLease(
      {
        attemptId,
        expectedLeaseGeneration: attempt.leaseGeneration,
        newLeaseOwner: leaseOwner,
        newLeaseExpiresAt: leaseExpiresAt,
        recoveryPrincipal: input.recoveryPrincipal,
        now: clock(),
      },
      { prisma: prisma as never, clock },
    );
    leaseGeneration = leased.leaseGeneration;
  } catch (error) {
    if (error instanceof VionaRequestRecoveryLeaseError) {
      if (error.code === 'lease_not_expired' || error.code === 'stale_lease_generation') {
        return failure('recovery_conflict');
      }
      if (error.code === 'attempt_not_found') {
        return failure('not_found');
      }
      if (error.code === 'terminal_attempt_immutable') {
        return success('already_terminal', attempt.id, attempt.requestId);
      }
      return failure('recovery_conflict');
    }
    return failure('recovery_unavailable');
  }

  const reloaded = await findVionaRequestExecutionAttemptForRecovery(
    { vionaRequestExecutionAttempt: prisma.vionaRequestExecutionAttempt },
    attemptId,
  );
  if (reloaded == null) {
    return failure('not_found');
  }

  const classified = classifyRecoverableAttempt(reloaded);

  if (classified.classification === 'eligible_provider_reconciliation') {
    try {
      const providerResult = await reconcileProviderOutcomeForRecovery(
        {
          attemptId,
          expectedLeaseOwner: leaseOwner,
          expectedLeaseGeneration: leaseGeneration,
          recoveryPrincipal: input.recoveryPrincipal,
        },
        { prisma: prisma as never, clock, providerStatusLookup },
      );

      if (providerResult.classification === 'lookup_transport_uncertain_operator_review') {
        return {
          ok: true,
          category: 'operator_review_required',
          attemptId: providerResult.attemptId,
          requestId: providerResult.requestId,
          operatorReviewReason: 'lookup_transport_uncertain',
        };
      }
      if (
        providerResult.classification === 'provider_remains_uncertain' ||
        providerResult.attemptState === VionaRequestExecutionAttemptState.outcomeUncertain
      ) {
        return success('remains_uncertain', providerResult.attemptId, providerResult.requestId);
      }

      if (providerResult.classification === 'provider_reconciled_success') {
        return maybeFinalizeAfterEscrow(
          {
            attemptId: providerResult.attemptId,
            requestId: providerResult.requestId,
            leaseOwner,
            leaseGeneration: providerResult.leaseGeneration,
            recoveryPrincipal: input.recoveryPrincipal,
            attemptState: VionaRequestExecutionAttemptState.providerSucceeded,
          },
          deps,
        );
      }
      if (providerResult.classification === 'provider_reconciled_failure') {
        return maybeFinalizeAfterEscrow(
          {
            attemptId: providerResult.attemptId,
            requestId: providerResult.requestId,
            leaseOwner,
            leaseGeneration: providerResult.leaseGeneration,
            recoveryPrincipal: input.recoveryPrincipal,
            attemptState: VionaRequestExecutionAttemptState.providerFailed,
          },
          deps,
        );
      }
      return failure('recovery_conflict');
    } catch (error) {
      if (error instanceof VionaRequestProviderReconciliationError) {
        if (error.code === 'provider_reference_missing_operator_review') {
          return {
            ok: true,
            category: 'operator_review_required',
            attemptId: reloaded.id,
            requestId: reloaded.requestId,
            operatorReviewReason: 'provider_reference_missing',
          };
        }
        if (
          error.code === 'stale_lease_generation' ||
          error.code === 'stale_lease_owner' ||
          error.code === 'expired_recovery_lease'
        ) {
          return failure('recovery_conflict');
        }
      }
      return failure('recovery_unavailable');
    }
  }

  if (classified.classification === 'eligible_success_escrow_finalization') {
    return maybeFinalizeAfterEscrow(
      {
        attemptId: reloaded.id,
        requestId: reloaded.requestId,
        leaseOwner,
        leaseGeneration,
        recoveryPrincipal: input.recoveryPrincipal,
        attemptState: VionaRequestExecutionAttemptState.providerSucceeded,
      },
      deps,
    );
  }

  if (classified.classification === 'eligible_failure_escrow_finalization') {
    return maybeFinalizeAfterEscrow(
      {
        attemptId: reloaded.id,
        requestId: reloaded.requestId,
        leaseOwner,
        leaseGeneration,
        recoveryPrincipal: input.recoveryPrincipal,
        attemptState: VionaRequestExecutionAttemptState.providerFailed,
      },
      deps,
    );
  }

  return failure('recovery_conflict');
}

export function createVionaRecoveryCorrelationId(): string {
  return `corr-recovery-${randomUUID()}`;
}
