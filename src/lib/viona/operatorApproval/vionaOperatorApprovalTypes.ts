/**
 * Pack26D — Operator approval / human-in-the-loop contract types (non-persistent, non-executing).
 * No DB writes, no UI wiring, no env/network access.
 */

import type { VionaActionReadiness } from '../actions/vionaActionCapabilityTypes';

export const vionaApprovalRequirements = [
  'none',
  'operator_review_required',
  'merchant_review_required',
  'owner_confirmation_required',
  'admin_review_required',
  'safety_escalation_required',
  'legal_review_required',
  'payment_review_required',
  'sos_manual_review_required',
  'blocked_until_capability_enabled',
] as const;

export type VionaApprovalRequirement = (typeof vionaApprovalRequirements)[number];

/** Sensitive approval categories — planning-only / non-executing until separately authorized. */
export const VIONA_PACK26D_SENSITIVE_APPROVAL_REQUIREMENTS: readonly VionaApprovalRequirement[] = [
  'payment_review_required',
  'sos_manual_review_required',
  'legal_review_required',
  'safety_escalation_required',
  'blocked_until_capability_enabled',
];

export const vionaHumanRoles = [
  'request_owner',
  'merchant_operator',
  'viona_operator',
  'admin',
  'safety_reviewer',
  'legal_reviewer',
  'payment_reviewer',
  'sos_reviewer',
  'system_gate',
] as const;

export type VionaHumanRole = (typeof vionaHumanRoles)[number];

export const vionaApprovalDecisions = [
  'not_required',
  'pending_review',
  'approved',
  'rejected',
  'blocked',
  'expired',
  'superseded',
] as const;

export type VionaApprovalDecisionValue = (typeof vionaApprovalDecisions)[number];

export const vionaGateOutcomes = [
  'allow_read_only',
  'allow_preview_only',
  'require_human_review',
  'block_execution',
  'block_ui_affordance',
  'block_sensitive_lane',
  'block_until_capability_enabled',
] as const;

export type VionaGateOutcome = (typeof vionaGateOutcomes)[number];

export const vionaOperatorApprovalSafetyLevels = [
  'demo',
  'pilot',
  'staging',
  'production_safe',
] as const;

export type VionaOperatorApprovalSafetyLevel = (typeof vionaOperatorApprovalSafetyLevels)[number];

export const vionaOperatorApprovalRedactionLevels = ['none', 'partial', 'operator_only_detail'] as const;

export type VionaOperatorApprovalRedactionLevel = (typeof vionaOperatorApprovalRedactionLevels)[number];

export type VionaOperatorApprovalCapabilityFlagsSnapshot = {
  executionEnabled: false;
  uiAffordanceAllowed: false;
  readinessState: VionaActionReadiness;
  actionId: string;
};

export type VionaApprovalDecision = {
  approvalDecisionId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: VionaHumanRole;
  requiredApprovalRole: VionaHumanRole;
  approvalRequirement: VionaApprovalRequirement;
  decision: VionaApprovalDecisionValue;
  decisionReason: string | null;
  gateOutcome: VionaGateOutcome;
  readinessState: VionaActionReadiness;
  capabilityFlagsSnapshot: VionaOperatorApprovalCapabilityFlagsSnapshot;
  executionEnabledSnapshot: false;
  uiAffordanceAllowedSnapshot: false;
  humanReviewRequired: boolean;
  blockedReason: string | null;
  safetyLevel: VionaOperatorApprovalSafetyLevel;
  redactionLevel: VionaOperatorApprovalRedactionLevel;
  correlationId: string | null;
  idempotencyKey: string | null;
  createdAt: string;
  decidedAt: string | null;
  operatorMessage: string;
  userFacingMessage: string;
};

export type VionaApprovalPolicy = {
  actionId: string;
  actionFamily: string;
  defaultApprovalRequirement: VionaApprovalRequirement;
  defaultRequiredRole: VionaHumanRole;
  defaultGateOutcome: VionaGateOutcome;
  sensitiveLane: boolean;
  planningOnly: true;
  executionAuthorized: false;
  uiAffordanceAuthorized: false;
  notes: string;
};

export type VionaHumanLoopGateInput = {
  actionId: string;
  targetType?: string;
  targetId?: string;
  requestedByRole?: VionaHumanRole;
};

export type VionaHumanLoopGateEvaluation = {
  actionId: string;
  knownAction: boolean;
  policy: VionaApprovalPolicy;
  approvalRequirement: VionaApprovalRequirement;
  requiredApprovalRole: VionaHumanRole;
  gateOutcome: VionaGateOutcome;
  humanReviewRequired: boolean;
  executionAuthorized: false;
  uiAffordanceAuthorized: false;
  blocked: boolean;
  blockedReason: string | null;
  operatorMessage: string;
  userFacingMessage: string;
};

export type VionaApprovalDecisionInput = {
  approvalDecisionId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: VionaHumanRole;
  requiredApprovalRole: VionaHumanRole;
  approvalRequirement: VionaApprovalRequirement;
  decision: VionaApprovalDecisionValue;
  decisionReason?: string | null;
  gateOutcome: VionaGateOutcome;
  readinessState: VionaActionReadiness;
  capabilityFlagsSnapshot?: VionaOperatorApprovalCapabilityFlagsSnapshot;
  humanReviewRequired: boolean;
  blockedReason?: string | null;
  safetyLevel?: VionaOperatorApprovalSafetyLevel;
  redactionLevel?: VionaOperatorApprovalRedactionLevel;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  operatorMessage?: string;
  userFacingMessage?: string;
};

export type VionaApprovalDecisionBuilderInput = {
  approvalDecisionId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  requestedByRole: VionaHumanRole;
  requiredApprovalRole?: VionaHumanRole;
  approvalRequirement?: VionaApprovalRequirement;
  gateOutcome?: VionaGateOutcome;
  readinessState: VionaActionReadiness;
  capabilityFlagsSnapshot?: VionaOperatorApprovalCapabilityFlagsSnapshot;
  decisionReason?: string | null;
  blockedReason?: string | null;
  safetyLevel?: VionaOperatorApprovalSafetyLevel;
  redactionLevel?: VionaOperatorApprovalRedactionLevel;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  operatorMessage?: string;
  userFacingMessage?: string;
};

export type VionaOperatorApprovalValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type VionaOperatorApprovalValidationResult = {
  ok: boolean;
  errors: readonly VionaOperatorApprovalValidationIssue[];
  warnings: readonly VionaOperatorApprovalValidationIssue[];
};
