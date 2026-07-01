/**
 * Pack28 — Execution integration readiness contract types (non-persistent, non-executing).
 * No DB writes, no UI wiring, no env/network access.
 */

export const vionaIntegrationReadinessBuckets = [
  'not_authorized',
  'documentation_only',
  'contract_reference_only',
  'preview_planning_candidate',
  'dry_run_planning_candidate',
  'human_approval_planning_candidate',
  'operator_review_planning_candidate',
  'blocked_sensitive_integration',
  'future_implementation_requires_phrase',
] as const;

export type VionaIntegrationReadinessBucket = (typeof vionaIntegrationReadinessBuckets)[number];

export const vionaIntegrationLaneClassifications = [
  'no_integration',
  'docs_reference_only',
  'contract_readiness_reference',
  'preview_contract_candidate',
  'dry_run_contract_candidate',
  'human_gate_contract_candidate',
  'operator_gate_contract_candidate',
  'blocked_sensitive_lane',
  'future_phrase_required',
] as const;

export type VionaIntegrationLaneClassification = (typeof vionaIntegrationLaneClassifications)[number];

export type VionaIntegrationAllowedReferenceMode =
  | 'none'
  | 'docs_only'
  | 'contract_types_only'
  | 'preview_plan'
  | 'dry_run_plan';

export type VionaExecutionIntegrationPolicy = {
  actionId: string;
  actionFamily: string;
  pack26bActionExists: boolean;
  pack27PolicyExists: boolean;
  integrationReadinessBucket: VionaIntegrationReadinessBucket;
  integrationLaneClassification: VionaIntegrationLaneClassification;
  uiBackendWiringAuthorized: false;
  executionAuthorized: false;
  dbWriteAuthorized: false;
  statusPostAuthorized: false;
  liveQaAuthorized: false;
  requiresHumanApproval: boolean;
  requiresOperatorReview: boolean;
  sensitiveLane: boolean;
  allowedReferenceMode: VionaIntegrationAllowedReferenceMode;
  requiredFutureGate: string;
  blockedReason: string | null;
  operatorMessage: string;
  userFacingMessage: string;
  notes: string;
};

export type VionaExecutionIntegrationGateInput = {
  actionId: string;
  targetType?: string;
  targetId?: string;
};

export type VionaExecutionIntegrationGateEvaluation = {
  actionId: string;
  integrationReadinessBucket: VionaIntegrationReadinessBucket;
  integrationLaneClassification: VionaIntegrationLaneClassification;
  allowedToReferenceContract: boolean;
  allowedToBuildPreviewPlan: boolean;
  allowedToBuildDryRunPlan: boolean;
  uiBackendWiringAuthorized: false;
  executionAuthorized: false;
  dbWriteAuthorized: false;
  statusPostAuthorized: false;
  liveQaAuthorized: false;
  blocked: boolean;
  blockedReason: string | null;
  requiresHumanApproval: boolean;
  requiresOperatorReview: boolean;
  operatorMessage: string;
  userFacingMessage: string;
};

export type VionaExecutionIntegrationPolicySnapshot = {
  actionId: string;
  integrationReadinessBucket: VionaIntegrationReadinessBucket;
  integrationLaneClassification: VionaIntegrationLaneClassification;
  executionAuthorized: false;
  uiBackendWiringAuthorized: false;
  dbWriteAuthorized: false;
  statusPostAuthorized: false;
  liveQaAuthorized: false;
};

export type VionaExecutionIntegrationPlanBuilderInput = {
  integrationPlanId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: string;
  createdAt: string;
  operatorMessage?: string;
  userFacingMessage?: string;
  requiredFutureGate?: string;
};

export type VionaExecutionIntegrationPlan = {
  integrationPlanId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: string;
  integrationReadinessBucket: VionaIntegrationReadinessBucket;
  integrationLaneClassification: VionaIntegrationLaneClassification;
  previewOnly: boolean;
  dryRunOnly: boolean;
  executionAuthorized: false;
  uiBackendWiringAuthorized: false;
  dbWriteAuthorized: false;
  statusPostAuthorized: false;
  liveQaAuthorized: false;
  requiredFutureGate: string;
  policySnapshot: VionaExecutionIntegrationPolicySnapshot;
  createdAt: string;
  operatorMessage: string;
  userFacingMessage: string;
};

export type VionaExecutionIntegrationValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type VionaExecutionIntegrationValidationResult = {
  ok: boolean;
  errors: readonly VionaExecutionIntegrationValidationIssue[];
  warnings: readonly VionaExecutionIntegrationValidationIssue[];
};
