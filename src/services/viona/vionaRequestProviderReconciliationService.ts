/**
 * Pack40DR2 — dormant exact-provider reconciliation (lookup outside TX; durable write inside).
 *
 * No send. No broad listing. No terminal finalize. Unwired from HTTP.
 */

import { Prisma, VionaRequestExecutionAttemptState, VionaRequestScopeKind } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  findVionaRequestExecutionAttemptForRecovery,
  transitionVionaRequestExecutionAttemptStateWithGeneration,
  type VionaRequestExecutionAttemptClient,
} from '../../repositories/vionaRequestExecutionAttemptRepository';
import {
  VIONA_PACK40DR2_PROVIDER_NAME_TWILIO_TEST_SMS,
  type VionaProviderStatusLookupAdapter,
} from './vionaProviderStatusLookupContract';
import { isVionaRequestSystemRecoveryPrincipal } from './vionaRequestSystemRecoveryPrincipal';
import type { VionaRequestSystemRecoveryPrincipal } from './vionaRequestSystemRecoveryPrincipal';

export type ProviderReconciliationErrorCode =
  | 'invalid_recovery_principal'
  | 'attempt_not_found'
  | 'stale_lease_generation'
  | 'stale_lease_owner'
  | 'expired_recovery_lease'
  | 'invalid_attempt_state'
  | 'provider_reference_missing_operator_review'
  | 'provider_name_mismatch'
  | 'caller_supplied_reference_rejected'
  | 'merchant_provenance_invalid'
  | 'cas_miss'
  | 'lookup_transport_uncertain_operator_review'
  | 'invalid_input';

export class VionaRequestProviderReconciliationError extends Error {
  readonly code: ProviderReconciliationErrorCode;

  constructor(code: ProviderReconciliationErrorCode) {
    super(code);
    this.name = 'VionaRequestProviderReconciliationError';
    this.code = code;
  }
}

export type ReconcileProviderOutcomeInput = Readonly<{
  attemptId: string;
  expectedLeaseOwner: string;
  expectedLeaseGeneration: number;
  recoveryPrincipal: VionaRequestSystemRecoveryPrincipal;
  /** Must never be used — exact reference is loaded from the attempt. */
  callerSuppliedProviderReference?: string | null;
}>;

export type ReconcileProviderOutcomeResult = Readonly<{
  classification:
    | 'provider_reconciled_success'
    | 'provider_reconciled_failure'
    | 'provider_remains_uncertain'
    | 'provider_reference_missing_operator_review'
    | 'lookup_transport_uncertain_operator_review';
  attemptId: string;
  requestId: string;
  attemptState: VionaRequestExecutionAttemptState;
  leaseGeneration: number;
}>;

type ReconPrisma = Pick<
  ReturnType<typeof getPrisma>,
  'vionaRequestExecutionAttempt' | 'vionaRequest' | 'merchantProfile' | '$transaction'
>;

export type ProviderReconciliationDeps = Readonly<{
  prisma?: ReconPrisma;
  clock?: () => Date;
  providerStatusLookup: VionaProviderStatusLookupAdapter;
}>;

function throwRecon(code: ProviderReconciliationErrorCode): never {
  throw new VionaRequestProviderReconciliationError(code);
}

async function loadAndAuthorizeRecoveryOwnership(
  prisma: ReconPrisma,
  input: ReconcileProviderOutcomeInput,
  now: Date,
) {
  return prisma.$transaction(
    async (tx) => {
      const attempt = await findVionaRequestExecutionAttemptForRecovery(
        tx as VionaRequestExecutionAttemptClient,
        input.attemptId.trim(),
      );
      if (attempt == null) throwRecon('attempt_not_found');
      if (attempt.leaseOwner !== input.expectedLeaseOwner.trim()) {
        throwRecon('stale_lease_owner');
      }
      if (attempt.leaseGeneration !== input.expectedLeaseGeneration) {
        throwRecon('stale_lease_generation');
      }
      if (attempt.leaseExpiresAt != null && attempt.leaseExpiresAt.getTime() <= now.getTime()) {
        throwRecon('expired_recovery_lease');
      }
      if (
        attempt.state !== VionaRequestExecutionAttemptState.providerPending &&
        attempt.state !== VionaRequestExecutionAttemptState.outcomeUncertain
      ) {
        throwRecon('invalid_attempt_state');
      }
      if (attempt.providerName !== VIONA_PACK40DR2_PROVIDER_NAME_TWILIO_TEST_SMS) {
        throwRecon('provider_name_mismatch');
      }
      if (
        attempt.providerExternalReference == null ||
        attempt.providerExternalReference.trim().length === 0
      ) {
        throwRecon('provider_reference_missing_operator_review');
      }
      if (attempt.scopeKindSnapshot !== VionaRequestScopeKind.merchant) {
        throwRecon('merchant_provenance_invalid');
      }
      if (
        attempt.merchantProfileIdSnapshot == null ||
        attempt.merchantProfileIdSnapshot.trim().length === 0
      ) {
        throwRecon('merchant_provenance_invalid');
      }

      const request = await tx.vionaRequest.findUnique({
        where: { id: attempt.requestId },
        select: {
          id: true,
          status: true,
          scopeKind: true,
          merchantProfileId: true,
          tenantId: true,
          ownerUserId: true,
        },
      });
      if (
        request == null ||
        request.scopeKind !== VionaRequestScopeKind.merchant ||
        request.merchantProfileId !== attempt.merchantProfileIdSnapshot ||
        request.tenantId !== attempt.tenantIdSnapshot ||
        request.ownerUserId !== attempt.ownerUserIdSnapshot
      ) {
        throwRecon('merchant_provenance_invalid');
      }

      return {
        attemptId: attempt.id,
        requestId: attempt.requestId,
        state: attempt.state,
        providerExternalReference: attempt.providerExternalReference.trim(),
        leaseGeneration: attempt.leaseGeneration,
        leaseOwner: attempt.leaseOwner!,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/**
 * Exact-reference provider reconciliation. Lookup is outside any DB transaction.
 */
export async function reconcileProviderOutcomeForRecovery(
  input: ReconcileProviderOutcomeInput,
  deps: ProviderReconciliationDeps,
): Promise<ReconcileProviderOutcomeResult> {
  if (!isVionaRequestSystemRecoveryPrincipal(input.recoveryPrincipal)) {
    throwRecon('invalid_recovery_principal');
  }
  if (
    input.callerSuppliedProviderReference != null &&
    String(input.callerSuppliedProviderReference).trim().length > 0
  ) {
    throwRecon('caller_supplied_reference_rejected');
  }

  const attemptId = input.attemptId.trim();
  const expectedLeaseOwner = input.expectedLeaseOwner.trim();
  if (
    attemptId.length === 0 ||
    expectedLeaseOwner.length === 0 ||
    !Number.isInteger(input.expectedLeaseGeneration)
  ) {
    throwRecon('invalid_input');
  }

  const prisma = deps.prisma ?? getPrisma();
  const clock = deps.clock ?? (() => new Date());
  const now = clock();

  const prepared = await loadAndAuthorizeRecoveryOwnership(prisma, input, now);

  // Phase 3 — provider lookup outside TX
  const lookup = await deps.providerStatusLookup.lookupExactOperation({
    providerExternalReference: prepared.providerExternalReference,
    correlationId: input.recoveryPrincipal.correlationId,
  });

  if (lookup.classification === 'lookupTransportUncertain') {
    return {
      classification: 'lookup_transport_uncertain_operator_review',
      attemptId: prepared.attemptId,
      requestId: prepared.requestId,
      attemptState: prepared.state,
      leaseGeneration: prepared.leaseGeneration,
    };
  }

  // Phase 4 — durable result recording
  return prisma.$transaction(
    async (tx) => {
      const client = tx as VionaRequestExecutionAttemptClient;
      const current = await findVionaRequestExecutionAttemptForRecovery(client, prepared.attemptId);
      if (current == null) throwRecon('attempt_not_found');
      if (
        current.leaseOwner !== expectedLeaseOwner ||
        current.leaseGeneration !== input.expectedLeaseGeneration
      ) {
        throwRecon('stale_lease_generation');
      }
      if (current.leaseExpiresAt != null && current.leaseExpiresAt.getTime() <= clock().getTime()) {
        throwRecon('expired_recovery_lease');
      }

      if (lookup.classification === 'stillUncertain') {
        if (current.state === VionaRequestExecutionAttemptState.outcomeUncertain) {
          return {
            classification: 'provider_remains_uncertain' as const,
            attemptId: current.id,
            requestId: current.requestId,
            attemptState: current.state,
            leaseGeneration: current.leaseGeneration,
          };
        }
        const updated = await transitionVionaRequestExecutionAttemptStateWithGeneration(client, {
          attemptId: current.id,
          expectedRequestId: current.requestId,
          expectedStates: [VionaRequestExecutionAttemptState.providerPending],
          expectedLeaseOwner,
          expectedLeaseGeneration: input.expectedLeaseGeneration,
          nextState: VionaRequestExecutionAttemptState.outcomeUncertain,
          providerFinishedAt: clock(),
          failureClass: 'still_uncertain',
          failureReasonDigest: lookup.uncertaintyDigest,
        });
        if (!updated.updated || updated.attempt == null) throwRecon('cas_miss');
        return {
          classification: 'provider_remains_uncertain' as const,
          attemptId: updated.attempt.id,
          requestId: updated.attempt.requestId,
          attemptState: updated.attempt.state,
          leaseGeneration: updated.attempt.leaseGeneration,
        };
      }

      if (lookup.classification === 'knownSuccess') {
        const updated = await transitionVionaRequestExecutionAttemptStateWithGeneration(client, {
          attemptId: current.id,
          expectedRequestId: current.requestId,
          expectedStates: [
            VionaRequestExecutionAttemptState.providerPending,
            VionaRequestExecutionAttemptState.outcomeUncertain,
          ],
          expectedLeaseOwner,
          expectedLeaseGeneration: input.expectedLeaseGeneration,
          nextState: VionaRequestExecutionAttemptState.providerSucceeded,
          providerFinishedAt: clock(),
          providerResultDigest: lookup.resultDigest,
          failureClass: null,
          failureReasonDigest: null,
        });
        if (!updated.updated || updated.attempt == null) throwRecon('cas_miss');
        return {
          classification: 'provider_reconciled_success' as const,
          attemptId: updated.attempt.id,
          requestId: updated.attempt.requestId,
          attemptState: updated.attempt.state,
          leaseGeneration: updated.attempt.leaseGeneration,
        };
      }

      // knownFailure — only when adapter proves not accepted/sent
      const updated = await transitionVionaRequestExecutionAttemptStateWithGeneration(client, {
        attemptId: current.id,
        expectedRequestId: current.requestId,
        expectedStates: [
          VionaRequestExecutionAttemptState.providerPending,
          VionaRequestExecutionAttemptState.outcomeUncertain,
        ],
        expectedLeaseOwner,
        expectedLeaseGeneration: input.expectedLeaseGeneration,
        nextState: VionaRequestExecutionAttemptState.providerFailed,
        providerFinishedAt: clock(),
        failureClass: lookup.failureClass,
        failureReasonDigest: lookup.failureDigest,
        providerResultDigest: null,
      });
      if (!updated.updated || updated.attempt == null) throwRecon('cas_miss');
      return {
        classification: 'provider_reconciled_failure' as const,
        attemptId: updated.attempt.id,
        requestId: updated.attempt.requestId,
        attemptState: updated.attempt.state,
        leaseGeneration: updated.attempt.leaseGeneration,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
