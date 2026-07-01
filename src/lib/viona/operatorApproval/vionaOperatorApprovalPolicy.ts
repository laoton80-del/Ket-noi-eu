/**
 * Pack26D — Pure operator approval policy mapping (no side effects, no execution).
 */

import type {
  VionaApprovalPolicy,
  VionaApprovalRequirement,
  VionaHumanLoopGateEvaluation,
  VionaHumanLoopGateInput,
  VionaHumanRole,
} from './vionaOperatorApprovalTypes';
import {
  vionaApprovalDecisions,
  vionaApprovalRequirements,
  vionaGateOutcomes,
  vionaHumanRoles,
} from './vionaOperatorApprovalTypes';

export const VIONA_PACK26D_APPROVAL_REQUIREMENTS = vionaApprovalRequirements;

export const VIONA_PACK26D_HUMAN_ROLES = vionaHumanRoles;

export const VIONA_PACK26D_APPROVAL_DECISIONS = vionaApprovalDecisions;

export const VIONA_PACK26D_GATE_OUTCOMES = vionaGateOutcomes;

const PACK26D_POLICY_DEFAULTS = {
  planningOnly: true as const,
  executionAuthorized: false as const,
  uiAffordanceAuthorized: false as const,
};

export const VIONA_PACK26D_ACTION_APPROVAL_POLICIES: readonly VionaApprovalPolicy[] = [
  {
    actionId: 'request.status.submitted_to_triage',
    actionFamily: 'request_status',
    defaultApprovalRequirement: 'operator_review_required',
    defaultRequiredRole: 'viona_operator',
    defaultGateOutcome: 'require_human_review',
    sensitiveLane: false,
    notes: 'Operator review before broader automation — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'request.assign',
    actionFamily: 'request_assign',
    defaultApprovalRequirement: 'operator_review_required',
    defaultRequiredRole: 'viona_operator',
    defaultGateOutcome: 'require_human_review',
    sensitiveLane: false,
    notes: 'Operator/admin review required — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'request.confirm',
    actionFamily: 'request_confirm',
    defaultApprovalRequirement: 'merchant_review_required',
    defaultRequiredRole: 'merchant_operator',
    defaultGateOutcome: 'require_human_review',
    sensitiveLane: false,
    notes: 'Merchant/operator review required — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'request.cancel',
    actionFamily: 'request_cancel',
    defaultApprovalRequirement: 'owner_confirmation_required',
    defaultRequiredRole: 'request_owner',
    defaultGateOutcome: 'require_human_review',
    sensitiveLane: false,
    notes: 'Owner/merchant/operator review depending on actor — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'booking.request',
    actionFamily: 'booking',
    defaultApprovalRequirement: 'merchant_review_required',
    defaultRequiredRole: 'merchant_operator',
    defaultGateOutcome: 'require_human_review',
    sensitiveLane: true,
    notes: 'Merchant/operator review required — sensitive lane blocked.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'payment.intent',
    actionFamily: 'payment',
    defaultApprovalRequirement: 'payment_review_required',
    defaultRequiredRole: 'payment_reviewer',
    defaultGateOutcome: 'block_sensitive_lane',
    sensitiveLane: true,
    notes: 'Payment review required — highest gate — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'sos.assist',
    actionFamily: 'sos',
    defaultApprovalRequirement: 'sos_manual_review_required',
    defaultRequiredRole: 'sos_reviewer',
    defaultGateOutcome: 'block_sensitive_lane',
    sensitiveLane: true,
    notes: 'SOS manual review required — highest gate — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'wallet.adjustment',
    actionFamily: 'wallet',
    defaultApprovalRequirement: 'admin_review_required',
    defaultRequiredRole: 'admin',
    defaultGateOutcome: 'block_sensitive_lane',
    sensitiveLane: true,
    notes: 'Admin/payment review required — highest gate — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
  {
    actionId: 'live_ai.action',
    actionFamily: 'live_ai',
    defaultApprovalRequirement: 'safety_escalation_required',
    defaultRequiredRole: 'safety_reviewer',
    defaultGateOutcome: 'block_sensitive_lane',
    sensitiveLane: true,
    notes: 'Safety/operator review required — highest gate — planning only.',
    ...PACK26D_POLICY_DEFAULTS,
  },
];

const POLICIES_BY_ACTION_ID: Readonly<Record<string, VionaApprovalPolicy>> = Object.freeze(
  Object.fromEntries(VIONA_PACK26D_ACTION_APPROVAL_POLICIES.map((policy) => [policy.actionId, policy])),
);

export const VIONA_PACK26D_UNKNOWN_ACTION_POLICY: VionaApprovalPolicy = Object.freeze({
  actionId: '',
  actionFamily: 'unknown',
  defaultApprovalRequirement: 'blocked_until_capability_enabled',
  defaultRequiredRole: 'system_gate',
  defaultGateOutcome: 'block_execution',
  sensitiveLane: true,
  planningOnly: true,
  executionAuthorized: false,
  uiAffordanceAuthorized: false,
  notes: 'Unknown action ID — safe blocked policy.',
});

/** Lookup approval policy for a Pack26B action ID; unknown IDs return safe blocked policy. */
export function getVionaApprovalPolicyForAction(actionId: string): VionaApprovalPolicy {
  const policy = POLICIES_BY_ACTION_ID[actionId];
  if (!policy) {
    return { ...VIONA_PACK26D_UNKNOWN_ACTION_POLICY, actionId };
  }
  return policy;
}

/** Resolve default approval requirement for an action ID. */
export function getVionaApprovalRequirementForAction(actionId: string): VionaApprovalRequirement {
  return getVionaApprovalPolicyForAction(actionId).defaultApprovalRequirement;
}

function isHumanReviewGate(outcome: VionaApprovalPolicy['defaultGateOutcome']): boolean {
  return (
    outcome === 'require_human_review' ||
    outcome === 'block_sensitive_lane' ||
    outcome === 'block_until_capability_enabled'
  );
}

/** Pure gate evaluation — no execution, no persistence. */
export function evaluateVionaHumanLoopGate(input: VionaHumanLoopGateInput): VionaHumanLoopGateEvaluation {
  const policy = getVionaApprovalPolicyForAction(input.actionId);
  const knownAction = POLICIES_BY_ACTION_ID[input.actionId] !== undefined;
  const humanReviewRequired = isHumanReviewGate(policy.defaultGateOutcome);
  const blocked =
    !knownAction ||
    policy.defaultGateOutcome === 'block_execution' ||
    policy.defaultGateOutcome === 'block_sensitive_lane' ||
    policy.defaultGateOutcome === 'block_until_capability_enabled';

  const blockedReason = !knownAction
    ? 'Unknown action ID — blocked by Pack26D policy.'
    : blocked
      ? `Action blocked by Pack26D gate (${policy.defaultGateOutcome}).`
      : null;

  const operatorMessage = !knownAction
    ? 'Unknown action — operator approval layer blocked.'
    : humanReviewRequired
      ? 'Human review required — execution not enabled in Pack26D.'
      : 'Read-only gate — execution not enabled in Pack26D.';

  const userFacingMessage = !knownAction
    ? 'This action is not available.'
    : humanReviewRequired
      ? 'Your request requires review.'
      : 'Preview only — no automated action.';

  return Object.freeze({
    actionId: input.actionId,
    knownAction,
    policy,
    approvalRequirement: policy.defaultApprovalRequirement,
    requiredApprovalRole: policy.defaultRequiredRole,
    gateOutcome: policy.defaultGateOutcome,
    humanReviewRequired,
    executionAuthorized: false,
    uiAffordanceAuthorized: false,
    blocked,
    blockedReason,
    operatorMessage,
    userFacingMessage,
  });
}
