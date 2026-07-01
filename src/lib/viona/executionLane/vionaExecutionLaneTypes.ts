/**
 * Pack27 — Execution lane planning contract types (non-persistent, non-executing).
 * No DB writes, no UI wiring, no env/network access.
 */

import type { VionaApprovalRequirement, VionaGateOutcome, VionaHumanRole } from '../operatorApproval/vionaOperatorApprovalTypes';

export const vionaExecutionReadinessStages = [
  'not_authorized',
  'planning_only',
  'contract_ready',
  'preview_only',
  'dry_run_only',
  'staging_safe_candidate',
  'human_approved_candidate',
  'execution_blocked',
  'execution_authorized_future',
] as const;

export type VionaExecutionReadinessStage = (typeof vionaExecutionReadinessStages)[number];

/** Current Pack27 pack status — planning boundary only. */
export const VIONA_PACK27_CURRENT_READINESS_STAGE: VionaExecutionReadinessStage = 'planning_only';

export const vionaExecutionLaneTypes = [
  'read_only_summary',
  'preview_payload',
  'dry_run_validation',
  'human_approval_required',
  'operator_review_required',
  'staging_safe_execution_candidate',
  'blocked_sensitive_lane',
  'not_implemented',
] as const;

export type VionaExecutionLaneType = (typeof vionaExecutionLaneTypes)[number];

export type VionaExecutionCapabilityFlagsSnapshot = {
  executionEnabled: false;
  uiAffordanceAllowed: false;
  actionId: string;
};

export type VionaExecutionApprovalSnapshot = {
  approvalRequirement: VionaApprovalRequirement;
  gateOutcome: VionaGateOutcome;
  executionAuthorized: false;
};

export type VionaExecutionAuditTimelineSnapshot = {
  persistent: false;
  actionId: string;
};

export type VionaExecutionAttemptEnvelope = {
  executionAttemptId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: VionaHumanRole;
  approvalDecisionId: string | null;
  approvalRequirement: VionaApprovalRequirement;
  gateOutcome: VionaGateOutcome;
  readinessStage: VionaExecutionReadinessStage;
  executionLaneType: VionaExecutionLaneType;
  executionAuthorized: false;
  dryRunOnly: boolean;
  previewOnly: boolean;
  idempotencyKey: string | null;
  correlationId: string | null;
  capabilityFlagsSnapshot: VionaExecutionCapabilityFlagsSnapshot;
  approvalSnapshot: VionaExecutionApprovalSnapshot;
  auditTimelineSnapshot: VionaExecutionAuditTimelineSnapshot;
  blockedReason: string | null;
  failureReason: string | null;
  createdAt: string;
  operatorMessage: string;
  userFacingMessage: string;
};

export type VionaExecutionReadinessPolicy = {
  actionId: string;
  actionFamily: string;
  currentReadiness: string;
  readinessStage: VionaExecutionReadinessStage;
  executionLaneType: VionaExecutionLaneType;
  requiresHumanApproval: boolean;
  requiresOperatorReview: boolean;
  sensitiveLane: boolean;
  planningOnly: true;
  executionAuthorized: false;
  dryRunOnly: boolean;
  previewOnly: boolean;
  uiAffordanceAuthorized: false;
  dbWriteAuthorized: false;
  statusPostAuthorized: false;
  liveQaAuthorized: false;
  notes: string;
};

export type VionaExecutionReadinessGateInput = {
  actionId: string;
  targetType?: string;
  targetId?: string;
  requestedByRole?: VionaHumanRole;
};

export type VionaExecutionReadinessGateEvaluation = {
  actionId: string;
  knownAction: boolean;
  policy: VionaExecutionReadinessPolicy;
  readinessStage: VionaExecutionReadinessStage;
  executionLaneType: VionaExecutionLaneType;
  executionAuthorized: false;
  blocked: boolean;
  blockedReason: string | null;
  dryRunOnly: boolean;
  previewOnly: boolean;
  requiresHumanApproval: boolean;
  requiresOperatorReview: boolean;
  safeToDisplay: boolean;
  operatorMessage: string;
  userFacingMessage: string;
};

export type VionaExecutionAttemptBuilderInput = {
  executionAttemptId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: VionaHumanRole;
  approvalDecisionId?: string | null;
  approvalRequirement?: VionaApprovalRequirement;
  gateOutcome?: VionaGateOutcome;
  readinessStage?: VionaExecutionReadinessStage;
  executionLaneType?: VionaExecutionLaneType;
  dryRunOnly?: boolean;
  previewOnly?: boolean;
  idempotencyKey?: string | null;
  correlationId?: string | null;
  capabilityFlagsSnapshot?: VionaExecutionCapabilityFlagsSnapshot;
  approvalSnapshot?: VionaExecutionApprovalSnapshot;
  auditTimelineSnapshot?: VionaExecutionAuditTimelineSnapshot;
  blockedReason?: string | null;
  failureReason?: string | null;
  createdAt: string;
  operatorMessage?: string;
  userFacingMessage?: string;
};

export type VionaExecutionLaneValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type VionaExecutionLaneValidationResult = {
  ok: boolean;
  errors: readonly VionaExecutionLaneValidationIssue[];
  warnings: readonly VionaExecutionLaneValidationIssue[];
};
