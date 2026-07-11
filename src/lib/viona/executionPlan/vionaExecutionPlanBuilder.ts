/**
 * Pack30A — Pure execution plan builder (no side effects, no execution, no persistence).
 * Converts a request + policy context into a safe, mock-only execution plan DTO.
 */

import { evaluateVionaExecutionPlanDecision } from './vionaExecutionPlanPolicy';
import {
  VIONA_PACK30A_EXECUTION_PLAN_SAFETY,
  type VionaExecutionPlan,
  type VionaExecutionPlanBuildInput,
  type VionaPack30AExecutionPlanState,
} from './vionaExecutionPlanTypes';

const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

function normalizeIdempotencyKey(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > IDEMPOTENCY_KEY_MAX_LENGTH) return null;
  return trimmed;
}

function resolveState(allowed: boolean): VionaPack30AExecutionPlanState {
  return allowed ? 'mock_ready' : 'denied';
}

/**
 * Pure in-memory state transition helper — no persistent state transition writes.
 * Given a built plan and whether the mock adapter was invoked, resolves the next
 * Pack30A execution plan state. Denied plans never transition away from `denied`.
 */
export function deriveVionaPack30AStateAfterMockInvocation(
  plan: VionaExecutionPlan,
  adapterInvoked: boolean,
): VionaPack30AExecutionPlanState {
  if (!plan.allowed) return 'denied';
  return adapterInvoked ? 'mock_executed_no_op' : 'mock_ready';
}

/**
 * Build a safe, mock-only Pack30A execution plan — no execution, no persistence, no external calls.
 * Deterministic given identical input (planId/createdAt are caller-supplied, not generated here).
 */
export function buildVionaExecutionPlan(input: VionaExecutionPlanBuildInput): VionaExecutionPlan {
  const decision = evaluateVionaExecutionPlanDecision(input);
  const state = resolveState(decision.allowed);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);

  return Object.freeze({
    planId: input.planId,
    requestId: decision.requestId,
    actionId: decision.actionId,
    state,
    allowed: decision.allowed,
    denialReason: decision.denialReason,
    decision,
    idempotencyKey,
    idempotencyMode: 'placeholder_deterministic' as const,
    mockAdapterInstruction: decision.allowed ? ('invoke_mock' as const) : ('do_not_invoke' as const),
    safety: VIONA_PACK30A_EXECUTION_PLAN_SAFETY,
    createdAt: input.createdAt,
    operatorMessage: decision.operatorMessage,
    userFacingMessage: decision.userFacingMessage,
  });
}
