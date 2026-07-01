/**
 * Pack27 — Pure execution attempt envelope builders (no side effects, no execution).
 */

import { getVionaApprovalPolicyForAction } from '../operatorApproval/vionaOperatorApprovalPolicy';
import { getVionaExecutionReadinessPolicyForAction } from './vionaExecutionLanePolicy';
import type {
  VionaExecutionAttemptBuilderInput,
  VionaExecutionAttemptEnvelope,
} from './vionaExecutionLaneTypes';

function freezeResult<T extends object>(value: T): T {
  return Object.freeze({ ...value });
}

function resolvePolicyFields(input: Pick<VionaExecutionAttemptBuilderInput, 'actionId'>) {
  const policy = getVionaExecutionReadinessPolicyForAction(input.actionId);
  const approvalPolicy = getVionaApprovalPolicyForAction(input.actionId);
  return { policy, approvalPolicy };
}

function defaultSnapshots(
  input: VionaExecutionAttemptBuilderInput,
  approvalPolicy: ReturnType<typeof getVionaApprovalPolicyForAction>,
) {
  const capabilityFlagsSnapshot = input.capabilityFlagsSnapshot ?? {
    executionEnabled: false as const,
    uiAffordanceAllowed: false as const,
    actionId: input.actionId,
  };
  const approvalSnapshot = input.approvalSnapshot ?? {
    approvalRequirement: approvalPolicy.defaultApprovalRequirement,
    gateOutcome: approvalPolicy.defaultGateOutcome,
    executionAuthorized: false as const,
  };
  const auditTimelineSnapshot = input.auditTimelineSnapshot ?? {
    persistent: false as const,
    actionId: input.actionId,
  };
  return { capabilityFlagsSnapshot, approvalSnapshot, auditTimelineSnapshot };
}

function buildAttemptCore(input: VionaExecutionAttemptBuilderInput): VionaExecutionAttemptEnvelope {
  const { policy, approvalPolicy } = resolvePolicyFields(input);
  const snapshots = defaultSnapshots(input, approvalPolicy);

  return freezeResult({
    executionAttemptId: input.executionAttemptId,
    actionId: input.actionId,
    targetType: input.targetType,
    targetId: input.targetId,
    requestedByRole: input.requestedByRole,
    approvalDecisionId: input.approvalDecisionId ?? null,
    approvalRequirement: input.approvalRequirement ?? approvalPolicy.defaultApprovalRequirement,
    gateOutcome: input.gateOutcome ?? approvalPolicy.defaultGateOutcome,
    readinessStage: input.readinessStage ?? policy.readinessStage,
    executionLaneType: input.executionLaneType ?? policy.executionLaneType,
    executionAuthorized: false,
    dryRunOnly: input.dryRunOnly ?? policy.dryRunOnly,
    previewOnly: input.previewOnly ?? policy.previewOnly,
    idempotencyKey: input.idempotencyKey ?? null,
    correlationId: input.correlationId ?? null,
    capabilityFlagsSnapshot: snapshots.capabilityFlagsSnapshot,
    approvalSnapshot: snapshots.approvalSnapshot,
    auditTimelineSnapshot: snapshots.auditTimelineSnapshot,
    blockedReason: input.blockedReason ?? null,
    failureReason: input.failureReason ?? null,
    createdAt: input.createdAt,
    operatorMessage: input.operatorMessage ?? '',
    userFacingMessage: input.userFacingMessage ?? '',
  });
}

/** Build a complete execution attempt envelope from caller-supplied fields — no ID or timestamp generation. */
export function buildVionaExecutionAttemptEnvelope(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  return buildAttemptCore(input);
}

/** Build a preview-only execution attempt — contract preview only, not real execution. */
export function buildPreviewOnlyVionaExecutionAttempt(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  const { approvalPolicy } = resolvePolicyFields(input);
  return buildAttemptCore({
    ...input,
    readinessStage: input.readinessStage ?? 'preview_only',
    executionLaneType: input.executionLaneType ?? 'preview_payload',
    dryRunOnly: false,
    previewOnly: true,
    gateOutcome: input.gateOutcome ?? 'allow_preview_only',
    blockedReason: null,
    operatorMessage: input.operatorMessage ?? 'Preview-only attempt — execution not enabled in Pack27.',
    userFacingMessage: input.userFacingMessage ?? 'Preview only — no automated action.',
    approvalRequirement: input.approvalRequirement ?? approvalPolicy.defaultApprovalRequirement,
  });
}

/** Build a dry-run-only execution attempt — validation preview only, no side effects. */
export function buildDryRunOnlyVionaExecutionAttempt(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  return buildAttemptCore({
    ...input,
    readinessStage: input.readinessStage ?? 'dry_run_only',
    executionLaneType: input.executionLaneType ?? 'dry_run_validation',
    dryRunOnly: true,
    previewOnly: false,
    blockedReason: null,
    operatorMessage: input.operatorMessage ?? 'Dry-run attempt — execution not enabled in Pack27.',
    userFacingMessage: input.userFacingMessage ?? 'Validation preview only — no automated action.',
  });
}

/** Build a blocked execution attempt. */
export function buildBlockedVionaExecutionAttempt(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  const { policy } = resolvePolicyFields(input);
  return buildAttemptCore({
    ...input,
    readinessStage: input.readinessStage ?? 'execution_blocked',
    executionLaneType: input.executionLaneType ?? policy.executionLaneType,
    dryRunOnly: false,
    previewOnly: false,
    blockedReason: input.blockedReason ?? 'Blocked by Pack27 execution lane policy.',
    operatorMessage: input.operatorMessage ?? 'Blocked — execution not enabled in Pack27.',
    userFacingMessage: input.userFacingMessage ?? 'This action is not available.',
  });
}

/** Build a human-approval-required execution attempt — does NOT enable execution. */
export function buildHumanApprovalRequiredVionaExecutionAttempt(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  return buildAttemptCore({
    ...input,
    readinessStage: input.readinessStage ?? 'planning_only',
    executionLaneType: input.executionLaneType ?? 'human_approval_required',
    dryRunOnly: input.dryRunOnly ?? true,
    previewOnly: false,
    blockedReason: null,
    operatorMessage: input.operatorMessage ?? 'Human approval required — execution not enabled in Pack27.',
    userFacingMessage: input.userFacingMessage ?? 'Your request requires review.',
  });
}

/** Build an operator-review-required execution attempt — does NOT enable execution. */
export function buildOperatorReviewRequiredVionaExecutionAttempt(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  return buildAttemptCore({
    ...input,
    readinessStage: input.readinessStage ?? 'planning_only',
    executionLaneType: input.executionLaneType ?? 'operator_review_required',
    dryRunOnly: input.dryRunOnly ?? true,
    previewOnly: false,
    blockedReason: null,
    operatorMessage: input.operatorMessage ?? 'Operator review required — execution not enabled in Pack27.',
    userFacingMessage: input.userFacingMessage ?? 'Your request is under review.',
  });
}

/** Build a not-implemented execution attempt placeholder. */
export function buildNotImplementedVionaExecutionAttempt(
  input: VionaExecutionAttemptBuilderInput,
): VionaExecutionAttemptEnvelope {
  return buildAttemptCore({
    ...input,
    readinessStage: input.readinessStage ?? 'not_authorized',
    executionLaneType: 'not_implemented',
    dryRunOnly: false,
    previewOnly: false,
    blockedReason: input.blockedReason ?? 'Execution lane not implemented in Pack27.',
    operatorMessage: input.operatorMessage ?? 'Not implemented — execution not enabled in Pack27.',
    userFacingMessage: input.userFacingMessage ?? 'This action is not available.',
  });
}
