/**
 * Pack30A — Controlled execution decision layer + mock-only execution plan contract types.
 * Pure planning layer: no DB writes, no UI wiring, no env/network access, no real execution.
 *
 * Scope: VionaRequest only. See docs/product/VIONA_REQUEST_PACK30_CONTROLLED_REAL_EXECUTION_IMPLEMENTATION_PLAN_PACKET.md.
 */

import type { VionaHumanLoopGateEvaluation } from '../operatorApproval/vionaOperatorApprovalTypes';
import type { VionaExecutionReadinessGateEvaluation } from '../executionLane/vionaExecutionLaneTypes';
import type { VionaRequestExecutionEligibilityEvaluation } from '../executionGate/vionaRequestExecutionEligibilityGuard';

/**
 * In-memory / mock states only — no persistent state transition writes.
 * Maps to Pack30 design topic #1 (controlled real-execution state machine), planning stance only.
 */
export const vionaPack30AExecutionPlanStates = [
  'pending_decision',
  'denied',
  'mock_ready',
  'mock_executed_no_op',
] as const;

export type VionaPack30AExecutionPlanState = (typeof vionaPack30AExecutionPlanStates)[number];

export const VIONA_PACK30A_EXECUTION_PLAN_SAFETY = {
  operatorApprovalRequired: true,
  externalExecutionBlocked: true,
  persistentAuditWritten: false,
  stagingFirst: true,
  notProductionReady: true,
  dryRunNoOp: true,
  executionPreviewOnly: true,
  mockOnly: true,
  requestStatusMutated: false,
  requestCreated: false,
  realProviderCalled: false,
} as const;

export type VionaPack30AExecutionPlanSafety = typeof VIONA_PACK30A_EXECUTION_PLAN_SAFETY;

/** Default blocking safety labels — Pack25 hold / safety labels must block execution. */
export const VIONA_PACK30A_BLOCKING_SAFETY_LABELS = ['hold', 'safety_hold', 'restricted'] as const;

export type VionaExecutionPlanDenialReason =
  | 'not_denied'
  | 'invalid_input'
  | 'unsupported_action'
  | 'ineligible_status'
  | 'blocked_safety_label'
  | 'blocked_lane'
  | 'missing_operator_approval'
  | 'missing_user_consent';

export type VionaExecutionPlanDecisionInput = Readonly<{
  requestId: string;
  requestStatus: string;
  actionId?: string;
  requestSafetyLabels?: readonly string[];
  operatorApprovalGranted: boolean;
  userConsentGranted: boolean;
  idempotencyKey?: string | null;
}>;

export type VionaExecutionPlanDecisionEvaluation = Readonly<{
  allowed: boolean;
  denialReason: VionaExecutionPlanDenialReason;
  requestId: string;
  requestStatus: string;
  actionId: string;
  matchedBlockingLabels: readonly string[];
  eligibility: VionaRequestExecutionEligibilityEvaluation;
  readinessGate: VionaExecutionReadinessGateEvaluation;
  humanLoopGate: VionaHumanLoopGateEvaluation;
  operatorApprovalGranted: boolean;
  userConsentGranted: boolean;
  operatorMessage: string;
  userFacingMessage: string;
}>;

export type VionaExecutionPlanBuildInput = VionaExecutionPlanDecisionInput & Readonly<{
  planId: string;
  createdAt: string;
}>;

export type VionaExecutionPlan = Readonly<{
  planId: string;
  requestId: string;
  actionId: string;
  state: VionaPack30AExecutionPlanState;
  allowed: boolean;
  denialReason: VionaExecutionPlanDenialReason;
  decision: VionaExecutionPlanDecisionEvaluation;
  idempotencyKey: string | null;
  /** Deterministic placeholder only — not a real replay-protection ledger (no persistence). */
  idempotencyMode: 'placeholder_deterministic';
  mockAdapterInstruction: 'invoke_mock' | 'do_not_invoke';
  safety: VionaPack30AExecutionPlanSafety;
  createdAt: string;
  operatorMessage: string;
  userFacingMessage: string;
}>;
