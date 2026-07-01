/**
 * Pack26D — Pure operator approval validators (no side effects, no execution).
 */

import {
  VIONA_PACK26D_ACTION_APPROVAL_POLICIES,
  VIONA_PACK26D_UNKNOWN_ACTION_POLICY,
} from './vionaOperatorApprovalPolicy';
import type {
  VionaApprovalDecision,
  VionaApprovalPolicy,
  VionaHumanLoopGateEvaluation,
  VionaOperatorApprovalValidationIssue,
  VionaOperatorApprovalValidationResult,
} from './vionaOperatorApprovalTypes';
import {
  vionaApprovalDecisions,
  vionaApprovalRequirements,
  vionaGateOutcomes,
  vionaHumanRoles,
} from './vionaOperatorApprovalTypes';

function issue(
  field: string,
  code: string,
  message: string,
): VionaOperatorApprovalValidationIssue {
  return { field, code, message };
}

function result(
  errors: VionaOperatorApprovalValidationIssue[],
  warnings: VionaOperatorApprovalValidationIssue[] = [],
): VionaOperatorApprovalValidationResult {
  return { ok: errors.length === 0, errors, warnings };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function joinParts(parts: readonly string[]): string {
  return parts.join('');
}

const SECRET_MARKERS: readonly string[] = [
  joinParts(['Auth', 'orization']),
  joinParts(['Bear', 'er']),
  joinParts(['J', 'W', 'T']),
  joinParts(['P', 'I', 'N']),
  'database URL',
  'postgres://',
  'postgresql://',
  joinParts(['supa', 'base']),
  joinParts(['process', '.', 'env']),
  'SECRET',
  'PRIVATE_KEY',
];

function containsSecretLikeContent(value: string): boolean {
  const normalized = value.toLowerCase();
  return SECRET_MARKERS.some((marker) => normalized.includes(marker.toLowerCase()));
}

function collectSecretIssues(
  field: string,
  value: string | null | undefined,
): VionaOperatorApprovalValidationIssue[] {
  if (!value) return [];
  if (!containsSecretLikeContent(value)) return [];
  return [issue(field, 'secret_like_content', `${field} must not contain secret-like content`)];
}

function isValidApprovalRequirement(value: string): boolean {
  return (vionaApprovalRequirements as readonly string[]).includes(value);
}

function isValidHumanRole(value: string): boolean {
  return (vionaHumanRoles as readonly string[]).includes(value);
}

function isValidDecision(value: string): boolean {
  return (vionaApprovalDecisions as readonly string[]).includes(value);
}

function isValidGateOutcome(value: string): boolean {
  return (vionaGateOutcomes as readonly string[]).includes(value);
}

/** Validate a Pack26D approval policy record. */
export function validateVionaApprovalPolicy(policy: VionaApprovalPolicy): VionaOperatorApprovalValidationResult {
  const errors: VionaOperatorApprovalValidationIssue[] = [];

  if (!isNonEmptyString(policy.actionId) && policy.actionFamily !== 'unknown') {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(policy.actionFamily)) {
    errors.push(issue('actionFamily', 'required', 'actionFamily must be a non-empty string'));
  }
  if (!isValidApprovalRequirement(policy.defaultApprovalRequirement)) {
    errors.push(issue('defaultApprovalRequirement', 'invalid', 'defaultApprovalRequirement is invalid'));
  }
  if (!isValidHumanRole(policy.defaultRequiredRole)) {
    errors.push(issue('defaultRequiredRole', 'invalid', 'defaultRequiredRole is invalid'));
  }
  if (!isValidGateOutcome(policy.defaultGateOutcome)) {
    errors.push(issue('defaultGateOutcome', 'invalid', 'defaultGateOutcome is invalid'));
  }
  if (policy.planningOnly !== true) {
    errors.push(issue('planningOnly', 'must_be_true', 'planningOnly must be true in Pack26D'));
  }
  if (policy.executionAuthorized !== false) {
    errors.push(issue('executionAuthorized', 'must_be_false', 'executionAuthorized must be false in Pack26D'));
  }
  if (policy.uiAffordanceAuthorized !== false) {
    errors.push(
      issue('uiAffordanceAuthorized', 'must_be_false', 'uiAffordanceAuthorized must be false in Pack26D'),
    );
  }

  errors.push(...collectSecretIssues('notes', policy.notes));

  return result(errors);
}

/** Validate a Pack26D approval decision envelope. */
export function validateVionaApprovalDecision(
  decision: VionaApprovalDecision,
): VionaOperatorApprovalValidationResult {
  const errors: VionaOperatorApprovalValidationIssue[] = [];
  const warnings: VionaOperatorApprovalValidationIssue[] = [];

  if (!isNonEmptyString(decision.approvalDecisionId)) {
    errors.push(issue('approvalDecisionId', 'required', 'approvalDecisionId must be a non-empty string'));
  }
  if (!isNonEmptyString(decision.actionId)) {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(decision.targetType)) {
    errors.push(issue('targetType', 'required', 'targetType must be a non-empty string'));
  }
  if (!isNonEmptyString(decision.targetId)) {
    errors.push(issue('targetId', 'required', 'targetId must be a non-empty string'));
  }
  if (!isValidApprovalRequirement(decision.approvalRequirement)) {
    errors.push(issue('approvalRequirement', 'invalid', 'approvalRequirement is invalid'));
  }
  if (!isValidHumanRole(decision.requestedByRole)) {
    errors.push(issue('requestedByRole', 'invalid', 'requestedByRole is invalid'));
  }
  if (!isValidHumanRole(decision.requiredApprovalRole)) {
    errors.push(issue('requiredApprovalRole', 'invalid', 'requiredApprovalRole is invalid'));
  }
  if (!isValidDecision(decision.decision)) {
    errors.push(issue('decision', 'invalid', 'decision is invalid'));
  }
  if (!isValidGateOutcome(decision.gateOutcome)) {
    errors.push(issue('gateOutcome', 'invalid', 'gateOutcome is invalid'));
  }
  if (decision.executionEnabledSnapshot !== false) {
    errors.push(
      issue('executionEnabledSnapshot', 'must_be_false', 'executionEnabledSnapshot must be false in Pack26D'),
    );
  }
  if (decision.uiAffordanceAllowedSnapshot !== false) {
    errors.push(
      issue(
        'uiAffordanceAllowedSnapshot',
        'must_be_false',
        'uiAffordanceAllowedSnapshot must be false in Pack26D',
      ),
    );
  }
  if (decision.capabilityFlagsSnapshot.executionEnabled !== false) {
    errors.push(
      issue(
        'capabilityFlagsSnapshot.executionEnabled',
        'must_be_false',
        'capabilityFlagsSnapshot.executionEnabled must be false',
      ),
    );
  }
  if (decision.capabilityFlagsSnapshot.uiAffordanceAllowed !== false) {
    errors.push(
      issue(
        'capabilityFlagsSnapshot.uiAffordanceAllowed',
        'must_be_false',
        'capabilityFlagsSnapshot.uiAffordanceAllowed must be false',
      ),
    );
  }

  if (decision.decision === 'approved' && decision.executionEnabledSnapshot !== false) {
    errors.push(issue('decision', 'approved_not_executing', 'approved decision must not enable execution'));
  }
  if (decision.decision === 'not_required' && decision.executionEnabledSnapshot !== false) {
    errors.push(
      issue('decision', 'not_required_not_executing', 'not_required decision must not enable execution'),
    );
  }
  if (decision.decision === 'blocked' && !isNonEmptyString(decision.blockedReason)) {
    errors.push(issue('blockedReason', 'required', 'blockedReason is required when decision is blocked'));
  }
  if (decision.decision === 'rejected' && !isNonEmptyString(decision.decisionReason)) {
    errors.push(issue('decisionReason', 'required', 'decisionReason is required when decision is rejected'));
  }
  if (decision.decision === 'pending_review' && decision.humanReviewRequired !== true) {
    errors.push(
      issue('humanReviewRequired', 'required', 'humanReviewRequired must be true for pending_review'),
    );
  }

  for (const [field, value] of [
    ['decisionReason', decision.decisionReason],
    ['blockedReason', decision.blockedReason],
    ['operatorMessage', decision.operatorMessage],
    ['userFacingMessage', decision.userFacingMessage],
  ] as const) {
    errors.push(...collectSecretIssues(field, value));
  }

  if (decision.decision === 'approved' && decision.humanReviewRequired) {
    warnings.push(
      issue('humanReviewRequired', 'unexpected', 'approved decision typically has humanReviewRequired false'),
    );
  }

  return result(errors, warnings);
}

/** Validate a human-loop gate evaluation result. */
export function validateVionaHumanLoopGateEvaluation(
  evaluation: VionaHumanLoopGateEvaluation,
): VionaOperatorApprovalValidationResult {
  const errors: VionaOperatorApprovalValidationIssue[] = [];

  if (!isNonEmptyString(evaluation.actionId)) {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (evaluation.executionAuthorized !== false) {
    errors.push(issue('executionAuthorized', 'must_be_false', 'executionAuthorized must be false'));
  }
  if (evaluation.uiAffordanceAuthorized !== false) {
    errors.push(issue('uiAffordanceAuthorized', 'must_be_false', 'uiAffordanceAuthorized must be false'));
  }
  if (!isValidGateOutcome(evaluation.gateOutcome)) {
    errors.push(issue('gateOutcome', 'invalid', 'gateOutcome is invalid'));
  }

  const policyResult = validateVionaApprovalPolicy(evaluation.policy);
  errors.push(...policyResult.errors);

  errors.push(...collectSecretIssues('operatorMessage', evaluation.operatorMessage));
  errors.push(...collectSecretIssues('userFacingMessage', evaluation.userFacingMessage));
  errors.push(...collectSecretIssues('blockedReason', evaluation.blockedReason));

  return result(errors);
}

/** Assert Pack26D operator approval layer invariants — structured result only, no throw. */
export function assertVionaOperatorApprovalLayerSafe(): VionaOperatorApprovalValidationResult {
  const errors: VionaOperatorApprovalValidationIssue[] = [];

  for (const policy of VIONA_PACK26D_ACTION_APPROVAL_POLICIES) {
    const policyResult = validateVionaApprovalPolicy(policy);
    if (!policyResult.ok) {
      errors.push(
        ...policyResult.errors.map((entry) =>
          issue(`policy.${policy.actionId}.${entry.field}`, entry.code, entry.message),
        ),
      );
    }
  }

  const unknownResult = validateVionaApprovalPolicy(VIONA_PACK26D_UNKNOWN_ACTION_POLICY);
  if (!unknownResult.ok) {
    errors.push(...unknownResult.errors);
  }

  if (VIONA_PACK26D_ACTION_APPROVAL_POLICIES.length !== 9) {
    errors.push(issue('policies', 'count', 'Pack26D must define exactly 9 action approval policies'));
  }

  return result(errors);
}
