/**
 * Pack40D3B — thin Pack40D execution coordinator.
 *
 * Operator phrase: APPROVE_PACK40D3B_CONTROLLED_RUNTIME_WIRING_AND_BYPASS_CLOSURE
 *
 * Sequences only:
 *   Pack40D2 claim → attempt-scoped escrow hold → Pack40D3A gateway → escrow resolve → Pack40D2 finalize
 *
 * Does not perform direct Prisma request-status writes, provider-key generation, or Twilio calls.
 * Never holds a DB transaction across network/escrow calls.
 */

import { randomUUID } from 'node:crypto';

import { VionaRequestExecutionTriggerType } from '@prisma/client';

import {
  claimVionaRequestExecution,
  finalizeVionaRequestExecutionCompleted,
  finalizeVionaRequestExecutionFailed,
  VionaRequestIndirectExecutionError,
  type ClaimVionaRequestExecutionResult,
} from './vionaRequestIndirectStatusActionService';
import {
  runVionaRequestExecutionProviderGateway,
  VionaRequestExecutionGatewayError,
  type RunVionaRequestExecutionProviderGatewayResult,
} from './vionaRequestExecutionGatewayService';
import {
  holdVionaRequestExecutionCost,
  refundVionaRequestExecutionHold,
  settleVionaRequestExecutionHold,
  type HoldVionaRequestExecutionCostResult,
  type ResolveVionaRequestEscrowHoldResult,
} from './vionaRequestEscrowHoldService';
import {
  buildVionaPack40D3EscrowIdempotencyKey,
  VIONA_PACK40D3_ESCROW_ACTION_ID,
  VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO,
} from './vionaPack40D3EscrowCoordination';
import { createPack40D3TwilioGatewayAdapter } from './vionaPack40D3TwilioGatewayAdapter';
import type { PreviewVionaExecutionPlanRealProviderPocResult } from './vionaExecutionPlanRouteService';
import type { VionaExecutionProviderAdapter } from './vionaRequestExecutionProviderContract';

export type ExecuteVionaRequestBusinessFlowInput = Readonly<{
  authUserId: string;
  requestId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  correlationId?: string;
}>;

export type ExecuteVionaRequestBusinessFlowFailureReason =
  | 'invalid_input'
  | 'invalid_state'
  | 'execution_error'
  | 'reconciliation_required'
  | 'provider_uncertain';

export type ExecuteVionaRequestBusinessFlowResult =
  | Readonly<{
      ok: true;
      requestId: string;
      attemptId: string;
      fromStatus: 'triage';
      finalStatus: 'completed' | 'failed';
      providerInvoked: true;
    }>
  | Readonly<{
      ok: false;
      reason: ExecuteVionaRequestBusinessFlowFailureReason;
      attemptId?: string;
      requestStatus?: 'inProgress' | 'triage';
    }>;

export type ExecuteVionaRequestBusinessFlowDeps = Readonly<{
  claimFn?: typeof claimVionaRequestExecution;
  holdFn?: typeof holdVionaRequestExecutionCost;
  settleFn?: typeof settleVionaRequestExecutionHold;
  refundFn?: typeof refundVionaRequestExecutionHold;
  runGatewayFn?: typeof runVionaRequestExecutionProviderGateway;
  finalizeCompletedFn?: typeof finalizeVionaRequestExecutionCompleted;
  finalizeFailedFn?: typeof finalizeVionaRequestExecutionFailed;
  createAdapter?: (input: {
    fromNumber: string;
    toNumber: string;
    body: string;
    actorUserId: string;
  }) => VionaExecutionProviderAdapter;
  createExecutionKey?: () => string;
  createLeaseOwner?: () => string;
  createCorrelationId?: () => string;
  clock?: () => Date;
  leaseDurationMs?: number;
  estimatedAmountVIO?: number;
}>;

function isNonEmptyTrimmed(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Legacy Pack31 pure helper retained for historical unit tests.
 * Pack40D3B coordinator does not use this for terminal decisions (D2/D3A state owns that).
 */
export function resolveVionaRequestBusinessFlowFinalStatus(
  executionResult: PreviewVionaExecutionPlanRealProviderPocResult,
): 'completed' | 'failed' {
  if (!executionResult.ok) return 'failed';
  if (!executionResult.planAllowed) return 'failed';
  if (executionResult.escrow.attempted && !executionResult.escrow.holdOk) return 'failed';
  return executionResult.realProviderResult?.outcome.outcome === 'succeeded' ? 'completed' : 'failed';
}

/**
 * Pack40D coordinator: claim → escrow hold → gateway → escrow resolve → finalize.
 */
export async function executeVionaRequestBusinessFlow(
  input: ExecuteVionaRequestBusinessFlowInput,
  deps: ExecuteVionaRequestBusinessFlowDeps = {},
): Promise<ExecuteVionaRequestBusinessFlowResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const fromNumber = input.fromNumber.trim();
  const toNumber = input.toNumber.trim();
  const body = input.body.trim();

  if (
    !isNonEmptyTrimmed(authUserId) ||
    !isNonEmptyTrimmed(requestId) ||
    !isNonEmptyTrimmed(fromNumber) ||
    !isNonEmptyTrimmed(toNumber) ||
    !isNonEmptyTrimmed(body)
  ) {
    return { ok: false, reason: 'invalid_input' };
  }

  const claimFn = deps.claimFn ?? claimVionaRequestExecution;
  const holdFn = deps.holdFn ?? holdVionaRequestExecutionCost;
  const settleFn = deps.settleFn ?? settleVionaRequestExecutionHold;
  const refundFn = deps.refundFn ?? refundVionaRequestExecutionHold;
  const runGatewayFn = deps.runGatewayFn ?? runVionaRequestExecutionProviderGateway;
  const finalizeCompletedFn = deps.finalizeCompletedFn ?? finalizeVionaRequestExecutionCompleted;
  const finalizeFailedFn = deps.finalizeFailedFn ?? finalizeVionaRequestExecutionFailed;
  const createExecutionKey = deps.createExecutionKey ?? (() => `exec-${randomUUID()}`);
  const createLeaseOwner = deps.createLeaseOwner ?? (() => `lease-${randomUUID()}`);
  const createCorrelationId = deps.createCorrelationId ?? (() => `corr-${randomUUID()}`);
  const clock = deps.clock ?? (() => new Date());
  const leaseDurationMs = deps.leaseDurationMs ?? 15 * 60 * 1000;
  const estimatedAmountVIO =
    deps.estimatedAmountVIO ?? VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO;

  // Phase 1 — Claim (Pack40D2). No escrow/provider on failure.
  let claim: ClaimVionaRequestExecutionResult;
  try {
    claim = await claimFn({
      trigger: {
        triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
        triggeringUserId: authUserId,
        requestId,
        correlationId: input.correlationId?.trim() || createCorrelationId(),
      },
      executionKey: createExecutionKey(),
      leaseOwner: createLeaseOwner(),
      leaseDurationMs,
    });
  } catch (error) {
    if (error instanceof VionaRequestIndirectExecutionError) {
      return { ok: false, reason: 'invalid_state' };
    }
    return { ok: false, reason: 'execution_error' };
  }

  const attemptId = claim.attemptId;
  const leaseOwner = claim.leaseOwner;
  const leaseGeneration = claim.leaseGeneration;
  const escrowKey = buildVionaPack40D3EscrowIdempotencyKey({
    requestId,
    executionAttemptId: attemptId,
  });

  // Phase 2 — Escrow hold (after claim, before provider).
  let hold: HoldVionaRequestExecutionCostResult;
  try {
    hold = await holdFn({
      requestId,
      actionId: VIONA_PACK40D3_ESCROW_ACTION_ID,
      userId: authUserId,
      estimatedAmountVIO,
      idempotencyKey: escrowKey,
      auditActorRoleLabel: 'execution_service',
    });
  } catch {
    return {
      ok: false,
      reason: 'reconciliation_required',
      attemptId,
      requestStatus: 'inProgress',
    };
  }
  if (!hold.ok) {
    return {
      ok: false,
      reason: 'reconciliation_required',
      attemptId,
      requestStatus: 'inProgress',
    };
  }

  // Phase 3 — Provider gateway (Pack40D3A). Coordinator never calls Twilio directly.
  const adapter =
    deps.createAdapter?.({ fromNumber, toNumber, body, actorUserId: authUserId }) ??
    createPack40D3TwilioGatewayAdapter({
      message: { fromNumber, toNumber, body },
      actorUserId: authUserId,
    });

  let gatewayResult: RunVionaRequestExecutionProviderGatewayResult;
  try {
    gatewayResult = await runGatewayFn(
      {
        attemptId,
        expectedLeaseOwner: leaseOwner,
        expectedLeaseGeneration: leaseGeneration,
        operationCategory: 'send',
      },
      { adapter, clock },
    );
  } catch (error) {
    if (error instanceof VionaRequestExecutionGatewayError) {
      if (error.code === 'stale_lease_generation' || error.code === 'stale_lease_owner') {
        return {
          ok: false,
          reason: 'reconciliation_required',
          attemptId,
          requestStatus: 'inProgress',
        };
      }
      if (
        error.code === 'uncertain_outcome_requires_review' ||
        error.code === 'already_prepared' ||
        error.code === 'outcome_already_recorded'
      ) {
        return {
          ok: false,
          reason:
            error.code === 'uncertain_outcome_requires_review'
              ? 'provider_uncertain'
              : 'reconciliation_required',
          attemptId,
          requestStatus: 'inProgress',
        };
      }
      return { ok: false, reason: 'execution_error', attemptId, requestStatus: 'inProgress' };
    }
    return { ok: false, reason: 'execution_error', attemptId, requestStatus: 'inProgress' };
  }

  // Phase 4 — Escrow resolve + Pack40D2 finalization (no provider retry).
  if (gatewayResult.attemptState === 'outcomeUncertain' || gatewayResult.adapterKind === 'uncertain') {
    return {
      ok: false,
      reason: 'provider_uncertain',
      attemptId,
      requestStatus: 'inProgress',
    };
  }

  if (gatewayResult.attemptState === 'providerSucceeded') {
    let settle: ResolveVionaRequestEscrowHoldResult;
    try {
      settle = await settleFn({
        holdId: hold.holdId,
        requestId,
        actualCostVIO: estimatedAmountVIO,
        auditActorUserId: authUserId,
        auditActorRoleLabel: 'execution_service',
      });
    } catch {
      return {
        ok: false,
        reason: 'reconciliation_required',
        attemptId,
        requestStatus: 'inProgress',
      };
    }
    if (!settle.ok) {
      return {
        ok: false,
        reason: 'reconciliation_required',
        attemptId,
        requestStatus: 'inProgress',
      };
    }

    try {
      await finalizeCompletedFn({
        attemptId,
        requestId,
        expectedLeaseOwner: leaseOwner,
        expectedLeaseGeneration: leaseGeneration,
      });
    } catch (error) {
      if (
        error instanceof VionaRequestIndirectExecutionError &&
        (error.code === 'stale_lease_generation' || error.code === 'stale_lease_owner')
      ) {
        return {
          ok: false,
          reason: 'reconciliation_required',
          attemptId,
          requestStatus: 'inProgress',
        };
      }
      return {
        ok: false,
        reason: 'reconciliation_required',
        attemptId,
        requestStatus: 'inProgress',
      };
    }

    return {
      ok: true,
      requestId,
      attemptId,
      fromStatus: 'triage',
      finalStatus: 'completed',
      providerInvoked: true,
    };
  }

  // providerFailed
  let refund: ResolveVionaRequestEscrowHoldResult;
  try {
    refund = await refundFn({
      holdId: hold.holdId,
      requestId,
      auditActorUserId: authUserId,
      auditActorRoleLabel: 'execution_service',
    });
  } catch {
    return {
      ok: false,
      reason: 'reconciliation_required',
      attemptId,
      requestStatus: 'inProgress',
    };
  }
  if (!refund.ok) {
    return {
      ok: false,
      reason: 'reconciliation_required',
      attemptId,
      requestStatus: 'inProgress',
    };
  }

  try {
    await finalizeFailedFn({
      attemptId,
      requestId,
      expectedLeaseOwner: leaseOwner,
      expectedLeaseGeneration: leaseGeneration,
    });
  } catch (error) {
    if (
      error instanceof VionaRequestIndirectExecutionError &&
      (error.code === 'stale_lease_generation' || error.code === 'stale_lease_owner')
    ) {
      return {
        ok: false,
        reason: 'reconciliation_required',
        attemptId,
        requestStatus: 'inProgress',
      };
    }
    return {
      ok: false,
      reason: 'reconciliation_required',
      attemptId,
      requestStatus: 'inProgress',
    };
  }

  return {
    ok: true,
    requestId,
    attemptId,
    fromStatus: 'triage',
    finalStatus: 'failed',
    providerInvoked: true,
  };
}
