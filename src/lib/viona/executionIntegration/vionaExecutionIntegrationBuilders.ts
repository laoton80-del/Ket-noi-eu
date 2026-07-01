/**
 * Pack28 — Pure future integration plan builders (no side effects, no execution).
 */

import { getVionaExecutionIntegrationPolicyForAction } from './vionaExecutionIntegrationPolicy';
import type {
  VionaExecutionIntegrationPlan,
  VionaExecutionIntegrationPlanBuilderInput,
  VionaExecutionIntegrationPolicySnapshot,
} from './vionaExecutionIntegrationTypes';

function freezeResult<T extends object>(value: T): T {
  return Object.freeze({ ...value });
}

function policySnapshotFromPolicy(
  policy: ReturnType<typeof getVionaExecutionIntegrationPolicyForAction>,
): VionaExecutionIntegrationPolicySnapshot {
  return Object.freeze({
    actionId: policy.actionId,
    integrationReadinessBucket: policy.integrationReadinessBucket,
    integrationLaneClassification: policy.integrationLaneClassification,
    executionAuthorized: false,
    uiBackendWiringAuthorized: false,
    dbWriteAuthorized: false,
    statusPostAuthorized: false,
    liveQaAuthorized: false,
  });
}

function buildPlanCore(
  input: VionaExecutionIntegrationPlanBuilderInput,
  overrides: Partial<
    Pick<
      VionaExecutionIntegrationPlan,
      | 'previewOnly'
      | 'dryRunOnly'
      | 'operatorMessage'
      | 'userFacingMessage'
      | 'requiredFutureGate'
    >
  > = {},
): VionaExecutionIntegrationPlan {
  const policy = getVionaExecutionIntegrationPolicyForAction(input.actionId);

  return freezeResult({
    integrationPlanId: input.integrationPlanId,
    actionId: input.actionId,
    targetType: input.targetType,
    targetId: input.targetId,
    requestedByRole: input.requestedByRole,
    integrationReadinessBucket: policy.integrationReadinessBucket,
    integrationLaneClassification: policy.integrationLaneClassification,
    previewOnly: overrides.previewOnly ?? false,
    dryRunOnly: overrides.dryRunOnly ?? false,
    executionAuthorized: false,
    uiBackendWiringAuthorized: false,
    dbWriteAuthorized: false,
    statusPostAuthorized: false,
    liveQaAuthorized: false,
    requiredFutureGate: overrides.requiredFutureGate ?? policy.requiredFutureGate,
    policySnapshot: policySnapshotFromPolicy(policy),
    createdAt: input.createdAt,
    operatorMessage: overrides.operatorMessage ?? policy.operatorMessage,
    userFacingMessage: overrides.userFacingMessage ?? policy.userFacingMessage,
  });
}

/** Build a complete future integration plan from caller-supplied fields — no ID or timestamp generation. */
export function buildVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  const policy = getVionaExecutionIntegrationPolicyForAction(input.actionId);
  return buildPlanCore(input, {
    previewOnly: policy.integrationReadinessBucket === 'preview_planning_candidate',
    dryRunOnly: policy.integrationReadinessBucket === 'dry_run_planning_candidate',
  });
}

/** Build a preview-planning integration plan — contract preview only, not real execution. */
export function buildPreviewPlanningVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  return buildPlanCore(input, {
    previewOnly: true,
    dryRunOnly: false,
    operatorMessage: input.operatorMessage ?? 'Preview planning only — execution not enabled in Pack28.',
    userFacingMessage: input.userFacingMessage ?? 'Preview only — no automated action.',
  });
}

/** Build a dry-run-planning integration plan — validation preview only, no side effects. */
export function buildDryRunPlanningVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  return buildPlanCore(input, {
    previewOnly: false,
    dryRunOnly: true,
    operatorMessage: input.operatorMessage ?? 'Dry-run planning only — execution not enabled in Pack28.',
    userFacingMessage: input.userFacingMessage ?? 'Validation preview only — no automated action.',
  });
}

/** Build a human-approval-planning integration plan — does NOT enable execution. */
export function buildHumanApprovalPlanningVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  return buildPlanCore(input, {
    previewOnly: false,
    dryRunOnly: true,
    operatorMessage: input.operatorMessage ?? 'Human approval planning only — execution not enabled in Pack28.',
    userFacingMessage: input.userFacingMessage ?? 'Your request requires review.',
  });
}

/** Build an operator-review-planning integration plan — does NOT enable execution. */
export function buildOperatorReviewPlanningVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  return buildPlanCore(input, {
    previewOnly: false,
    dryRunOnly: true,
    operatorMessage: input.operatorMessage ?? 'Operator review planning only — execution not enabled in Pack28.',
    userFacingMessage: input.userFacingMessage ?? 'Your request is under review.',
  });
}

/** Build a blocked sensitive integration plan. */
export function buildBlockedSensitiveVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  const policy = getVionaExecutionIntegrationPolicyForAction(input.actionId);
  return buildPlanCore(input, {
    previewOnly: false,
    dryRunOnly: false,
    operatorMessage: input.operatorMessage ?? 'Blocked sensitive integration — execution not enabled in Pack28.',
    userFacingMessage: input.userFacingMessage ?? 'This action is not available.',
    requiredFutureGate: policy.requiredFutureGate,
  });
}

/** Build a not-authorized integration plan placeholder. */
export function buildNotAuthorizedVionaExecutionIntegrationPlan(
  input: VionaExecutionIntegrationPlanBuilderInput,
): VionaExecutionIntegrationPlan {
  return buildPlanCore(input, {
    previewOnly: false,
    dryRunOnly: false,
    operatorMessage: input.operatorMessage ?? 'Not authorized — execution not enabled in Pack28.',
    userFacingMessage: input.userFacingMessage ?? 'This action is not available.',
    requiredFutureGate:
      input.requiredFutureGate ??
      'APPROVE_PACK28_EXECUTION_INTEGRATION_READINESS_IMPLEMENTATION_STAGING_SAFE',
  });
}
