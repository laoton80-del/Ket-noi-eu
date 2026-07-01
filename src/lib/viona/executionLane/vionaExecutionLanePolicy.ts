/**
 * Pack27 — Pure execution readiness policy mapping (no side effects, no execution).
 */

import { getVionaApprovalPolicyForAction } from '../operatorApproval/vionaOperatorApprovalPolicy';
import type {
  VionaExecutionLaneType,
  VionaExecutionReadinessGateEvaluation,
  VionaExecutionReadinessGateInput,
  VionaExecutionReadinessPolicy,
  VionaExecutionReadinessStage,
} from './vionaExecutionLaneTypes';
import {
  VIONA_PACK27_CURRENT_READINESS_STAGE,
  vionaExecutionLaneTypes,
  vionaExecutionReadinessStages,
} from './vionaExecutionLaneTypes';

export const VIONA_PACK27_EXECUTION_READINESS_STAGES = vionaExecutionReadinessStages;

export const VIONA_PACK27_EXECUTION_LANE_TYPES = vionaExecutionLaneTypes;

const PACK27_POLICY_DEFAULTS = {
  planningOnly: true as const,
  executionAuthorized: false as const,
  uiAffordanceAuthorized: false as const,
  dbWriteAuthorized: false as const,
  statusPostAuthorized: false as const,
  liveQaAuthorized: false as const,
};

export const VIONA_PACK27_ACTION_READINESS_POLICIES: readonly VionaExecutionReadinessPolicy[] = [
  {
    actionId: 'request.status.submitted_to_triage',
    actionFamily: 'request_status',
    currentReadiness: 'Pack25 reference only / Option C hold',
    readinessStage: 'planning_only',
    executionLaneType: 'read_only_summary',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: false,
    dryRunOnly: false,
    previewOnly: true,
    notes: 'Pack25 reference — Option C hold; no further status-post action.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'request.assign',
    actionFamily: 'request_assign',
    currentReadiness: 'Not executable',
    readinessStage: 'planning_only',
    executionLaneType: 'dry_run_validation',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: false,
    dryRunOnly: true,
    previewOnly: false,
    notes: 'Future dry-run/approval planning only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'request.confirm',
    actionFamily: 'request_confirm',
    currentReadiness: 'Not executable',
    readinessStage: 'planning_only',
    executionLaneType: 'dry_run_validation',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: false,
    dryRunOnly: true,
    previewOnly: false,
    notes: 'Future dry-run/approval planning only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'request.cancel',
    actionFamily: 'request_cancel',
    currentReadiness: 'Not executable',
    readinessStage: 'planning_only',
    executionLaneType: 'dry_run_validation',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: false,
    dryRunOnly: true,
    previewOnly: false,
    notes: 'Future dry-run/approval planning only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'booking.request',
    actionFamily: 'booking',
    currentReadiness: 'Not executable',
    readinessStage: 'planning_only',
    executionLaneType: 'human_approval_required',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    dryRunOnly: true,
    previewOnly: false,
    notes: 'Future dry-run/approval planning only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'payment.intent',
    actionFamily: 'payment',
    currentReadiness: 'Not executable',
    readinessStage: 'execution_blocked',
    executionLaneType: 'blocked_sensitive_lane',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    dryRunOnly: false,
    previewOnly: false,
    notes: 'Blocked sensitive lane — planning only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'sos.assist',
    actionFamily: 'sos',
    currentReadiness: 'Not executable',
    readinessStage: 'execution_blocked',
    executionLaneType: 'blocked_sensitive_lane',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    dryRunOnly: false,
    previewOnly: false,
    notes: 'Blocked sensitive lane / manual review only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'wallet.adjustment',
    actionFamily: 'wallet',
    currentReadiness: 'Not executable',
    readinessStage: 'execution_blocked',
    executionLaneType: 'blocked_sensitive_lane',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    dryRunOnly: false,
    previewOnly: false,
    notes: 'Blocked sensitive lane — planning only.',
    ...PACK27_POLICY_DEFAULTS,
  },
  {
    actionId: 'live_ai.action',
    actionFamily: 'live_ai',
    currentReadiness: 'Not executable',
    readinessStage: 'execution_blocked',
    executionLaneType: 'blocked_sensitive_lane',
    requiresHumanApproval: true,
    requiresOperatorReview: true,
    sensitiveLane: true,
    dryRunOnly: false,
    previewOnly: false,
    notes: 'Blocked sensitive lane / safety review only.',
    ...PACK27_POLICY_DEFAULTS,
  },
];

const POLICIES_BY_ACTION_ID: Readonly<Record<string, VionaExecutionReadinessPolicy>> = Object.freeze(
  Object.fromEntries(VIONA_PACK27_ACTION_READINESS_POLICIES.map((policy) => [policy.actionId, policy])),
);

export const VIONA_PACK27_UNKNOWN_ACTION_POLICY: VionaExecutionReadinessPolicy = Object.freeze({
  actionId: '',
  actionFamily: 'unknown',
  currentReadiness: 'Not executable',
  readinessStage: 'execution_blocked',
  executionLaneType: 'blocked_sensitive_lane',
  requiresHumanApproval: true,
  requiresOperatorReview: true,
  sensitiveLane: true,
  planningOnly: true,
  executionAuthorized: false,
  dryRunOnly: false,
  previewOnly: false,
  uiAffordanceAuthorized: false,
  dbWriteAuthorized: false,
  statusPostAuthorized: false,
  liveQaAuthorized: false,
  notes: 'Unknown action ID — safe blocked policy.',
});

/** Lookup execution readiness policy for a Pack26B action ID; unknown IDs return safe blocked policy. */
export function getVionaExecutionReadinessPolicyForAction(actionId: string): VionaExecutionReadinessPolicy {
  const policy = POLICIES_BY_ACTION_ID[actionId];
  if (!policy) {
    return { ...VIONA_PACK27_UNKNOWN_ACTION_POLICY, actionId };
  }
  return policy;
}

/** Resolve execution lane type for a Pack26B action ID. */
export function getVionaExecutionLaneTypeForAction(actionId: string): VionaExecutionLaneType {
  return getVionaExecutionReadinessPolicyForAction(actionId).executionLaneType;
}

function isBlockedLaneType(laneType: VionaExecutionLaneType): boolean {
  return laneType === 'blocked_sensitive_lane' || laneType === 'not_implemented';
}

function isBlockedStage(stage: VionaExecutionReadinessStage): boolean {
  return stage === 'execution_blocked' || stage === 'not_authorized';
}

/** Pure execution readiness gate evaluation — no execution, no persistence. */
export function evaluateVionaExecutionReadinessGate(
  input: VionaExecutionReadinessGateInput,
): VionaExecutionReadinessGateEvaluation {
  const policy = getVionaExecutionReadinessPolicyForAction(input.actionId);
  const approvalPolicy = getVionaApprovalPolicyForAction(input.actionId);
  const knownAction = POLICIES_BY_ACTION_ID[input.actionId] !== undefined;
  const blocked =
    !knownAction ||
    isBlockedLaneType(policy.executionLaneType) ||
    isBlockedStage(policy.readinessStage) ||
    approvalPolicy.defaultGateOutcome === 'block_sensitive_lane' ||
    approvalPolicy.defaultGateOutcome === 'block_execution';

  const blockedReason = !knownAction
    ? 'Unknown action ID — blocked by Pack27 execution lane policy.'
    : blocked
      ? `Action blocked by Pack27 lane (${policy.executionLaneType}).`
      : null;

  const operatorMessage = !knownAction
    ? 'Unknown action — execution lane planning layer blocked.'
    : blocked
      ? 'Sensitive or blocked lane — execution not enabled in Pack27.'
      : policy.dryRunOnly
        ? 'Dry-run planning only — execution not enabled in Pack27.'
        : policy.previewOnly
          ? 'Preview-only planning — execution not enabled in Pack27.'
          : 'Planning-only gate — execution not enabled in Pack27.';

  const userFacingMessage = !knownAction
    ? 'This action is not available.'
    : blocked
      ? 'This action requires review and is not available for execution.'
      : policy.previewOnly
        ? 'Preview only — no automated action.'
        : 'Planning context only — no automated action.';

  return Object.freeze({
    actionId: input.actionId,
    knownAction,
    policy,
    readinessStage: policy.readinessStage,
    executionLaneType: policy.executionLaneType,
    executionAuthorized: false,
    blocked,
    blockedReason,
    dryRunOnly: policy.dryRunOnly,
    previewOnly: policy.previewOnly,
    requiresHumanApproval: policy.requiresHumanApproval,
    requiresOperatorReview: policy.requiresOperatorReview,
    safeToDisplay: !blocked || policy.previewOnly,
    operatorMessage,
    userFacingMessage,
  });
}
