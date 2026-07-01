/**
 * Pack26D — Pure operator approval decision builders (no side effects, no execution).
 */

import { getVionaApprovalPolicyForAction } from './vionaOperatorApprovalPolicy';
import type {
  VionaApprovalDecision,
  VionaApprovalDecisionBuilderInput,
  VionaApprovalDecisionInput,
  VionaOperatorApprovalCapabilityFlagsSnapshot,
} from './vionaOperatorApprovalTypes';

function freezeResult<T extends object>(value: T): T {
  return Object.freeze({ ...value });
}

function defaultCapabilitySnapshot(
  input: Pick<VionaApprovalDecisionBuilderInput, 'actionId' | 'readinessState' | 'capabilityFlagsSnapshot'>,
): VionaOperatorApprovalCapabilityFlagsSnapshot {
  if (input.capabilityFlagsSnapshot) {
    return {
      executionEnabled: false,
      uiAffordanceAllowed: false,
      readinessState: input.capabilityFlagsSnapshot.readinessState,
      actionId: input.capabilityFlagsSnapshot.actionId,
    };
  }
  return {
    executionEnabled: false,
    uiAffordanceAllowed: false,
    readinessState: input.readinessState,
    actionId: input.actionId,
  };
}

function buildDecisionCore(
  input: VionaApprovalDecisionInput,
): VionaApprovalDecision {
  const capabilityFlagsSnapshot = defaultCapabilitySnapshot(input);

  return freezeResult({
    approvalDecisionId: input.approvalDecisionId,
    actionId: input.actionId,
    targetType: input.targetType,
    targetId: input.targetId,
    requestedByRole: input.requestedByRole,
    requiredApprovalRole: input.requiredApprovalRole,
    approvalRequirement: input.approvalRequirement,
    decision: input.decision,
    decisionReason: input.decisionReason ?? null,
    gateOutcome: input.gateOutcome,
    readinessState: input.readinessState,
    capabilityFlagsSnapshot,
    executionEnabledSnapshot: false,
    uiAffordanceAllowedSnapshot: false,
    humanReviewRequired: input.humanReviewRequired,
    blockedReason: input.blockedReason ?? null,
    safetyLevel: input.safetyLevel ?? 'staging',
    redactionLevel: input.redactionLevel ?? 'partial',
    correlationId: input.correlationId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    createdAt: input.createdAt,
    decidedAt: input.decidedAt ?? null,
    operatorMessage: input.operatorMessage ?? '',
    userFacingMessage: input.userFacingMessage ?? '',
  });
}

/** Build a complete approval decision from caller-supplied fields — no ID or timestamp generation. */
export function buildVionaApprovalDecision(input: VionaApprovalDecisionInput): VionaApprovalDecision {
  return buildDecisionCore(input);
}

function resolvePolicyFields(input: VionaApprovalDecisionBuilderInput) {
  const policy = getVionaApprovalPolicyForAction(input.actionId);
  return {
    approvalRequirement: input.approvalRequirement ?? policy.defaultApprovalRequirement,
    requiredApprovalRole: input.requiredApprovalRole ?? policy.defaultRequiredRole,
    gateOutcome: input.gateOutcome ?? policy.defaultGateOutcome,
  };
}

/** Build a pending human-review decision — execution remains disabled. */
export function buildPendingVionaApprovalDecision(
  input: VionaApprovalDecisionBuilderInput,
): VionaApprovalDecision {
  const resolved = resolvePolicyFields(input);
  return buildDecisionCore({
    ...input,
    ...resolved,
    decision: 'pending_review',
    humanReviewRequired: true,
    decisionReason: input.decisionReason ?? 'Pending operator review.',
    operatorMessage: input.operatorMessage ?? 'Awaiting human review — execution not enabled.',
    userFacingMessage: input.userFacingMessage ?? 'Your request is under review.',
  });
}

/** Build an approved decision — does NOT enable execution or UI affordances. */
export function buildApprovedVionaApprovalDecision(
  input: VionaApprovalDecisionBuilderInput,
): VionaApprovalDecision {
  const resolved = resolvePolicyFields(input);
  return buildDecisionCore({
    ...input,
    ...resolved,
    decision: 'approved',
    humanReviewRequired: false,
    decisionReason: input.decisionReason ?? 'Approved by required reviewer.',
    operatorMessage: input.operatorMessage ?? 'Approved — execution still disabled in Pack26D.',
    userFacingMessage: input.userFacingMessage ?? 'Review complete — no automated action.',
    decidedAt: input.decidedAt ?? input.createdAt,
  });
}

/** Build a rejected decision. */
export function buildRejectedVionaApprovalDecision(
  input: VionaApprovalDecisionBuilderInput,
): VionaApprovalDecision {
  const resolved = resolvePolicyFields(input);
  return buildDecisionCore({
    ...input,
    ...resolved,
    decision: 'rejected',
    humanReviewRequired: false,
    decisionReason: input.decisionReason ?? 'Rejected by required reviewer.',
    operatorMessage: input.operatorMessage ?? 'Rejected — execution not enabled.',
    userFacingMessage: input.userFacingMessage ?? 'Request was not approved.',
    decidedAt: input.decidedAt ?? input.createdAt,
  });
}

/** Build a blocked decision. */
export function buildBlockedVionaApprovalDecision(
  input: VionaApprovalDecisionBuilderInput,
): VionaApprovalDecision {
  const resolved = resolvePolicyFields(input);
  return buildDecisionCore({
    ...input,
    ...resolved,
    decision: 'blocked',
    humanReviewRequired: false,
    blockedReason: input.blockedReason ?? 'Blocked by Pack26D policy gate.',
    decisionReason: input.decisionReason ?? null,
    operatorMessage: input.operatorMessage ?? 'Blocked — execution not enabled.',
    userFacingMessage: input.userFacingMessage ?? 'This action is not available.',
    decidedAt: input.decidedAt ?? input.createdAt,
  });
}

/** Build a not-required decision — does NOT imply execution is enabled. */
export function buildNotRequiredVionaApprovalDecision(
  input: VionaApprovalDecisionBuilderInput,
): VionaApprovalDecision {
  const resolved = resolvePolicyFields(input);
  return buildDecisionCore({
    ...input,
    ...resolved,
    decision: 'not_required',
    humanReviewRequired: false,
    approvalRequirement: 'none',
    gateOutcome: input.gateOutcome ?? 'allow_read_only',
    decisionReason: input.decisionReason ?? null,
    operatorMessage: input.operatorMessage ?? 'Approval not required — execution still disabled.',
    userFacingMessage: input.userFacingMessage ?? 'Read-only context.',
    decidedAt: input.decidedAt ?? input.createdAt,
  });
}

/** Build a superseded decision. */
export function buildSupersededVionaApprovalDecision(
  input: VionaApprovalDecisionBuilderInput,
): VionaApprovalDecision {
  const resolved = resolvePolicyFields(input);
  return buildDecisionCore({
    ...input,
    ...resolved,
    decision: 'superseded',
    humanReviewRequired: false,
    decisionReason: input.decisionReason ?? 'Superseded by newer decision.',
    operatorMessage: input.operatorMessage ?? 'Superseded — execution not enabled.',
    userFacingMessage: input.userFacingMessage ?? 'Request status updated.',
    decidedAt: input.decidedAt ?? input.createdAt,
  });
}
