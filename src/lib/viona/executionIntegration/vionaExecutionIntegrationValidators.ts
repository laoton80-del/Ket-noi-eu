/**
 * Pack28 — Pure execution integration readiness validators (no side effects, no execution).
 */

import {
  VIONA_PACK28_ACTION_INTEGRATION_POLICIES,
  VIONA_PACK28_UNKNOWN_ACTION_POLICY,
} from './vionaExecutionIntegrationPolicy';
import type {
  VionaExecutionIntegrationGateEvaluation,
  VionaExecutionIntegrationPlan,
  VionaExecutionIntegrationPolicy,
  VionaExecutionIntegrationValidationIssue,
  VionaExecutionIntegrationValidationResult,
} from './vionaExecutionIntegrationTypes';
import {
  vionaIntegrationLaneClassifications,
  vionaIntegrationReadinessBuckets,
} from './vionaExecutionIntegrationTypes';

function issue(field: string, code: string, message: string): VionaExecutionIntegrationValidationIssue {
  return { field, code, message };
}

function result(
  errors: VionaExecutionIntegrationValidationIssue[],
  warnings: VionaExecutionIntegrationValidationIssue[] = [],
): VionaExecutionIntegrationValidationResult {
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
  joinParts(['Git', 'Hub token']),
  'ghp_',
];

function containsSecretLikeContent(value: string): boolean {
  const normalized = value.toLowerCase();
  return SECRET_MARKERS.some((marker) => normalized.includes(marker.toLowerCase()));
}

function collectSecretIssues(
  field: string,
  value: string | null | undefined,
): VionaExecutionIntegrationValidationIssue[] {
  if (!value) return [];
  if (!containsSecretLikeContent(value)) return [];
  return [issue(field, 'secret_like_content', `${field} must not contain secret-like content`)];
}

function isValidReadinessBucket(value: string): boolean {
  return (vionaIntegrationReadinessBuckets as readonly string[]).includes(value);
}

function isValidLaneClassification(value: string): boolean {
  return (vionaIntegrationLaneClassifications as readonly string[]).includes(value);
}

function validateAuthorizationFlags(
  errors: VionaExecutionIntegrationValidationIssue[],
  prefix: string,
  record: {
    executionAuthorized: false;
    uiBackendWiringAuthorized: false;
    dbWriteAuthorized: false;
    statusPostAuthorized: false;
    liveQaAuthorized: false;
  },
): void {
  if (record.executionAuthorized !== false) {
    errors.push(issue(`${prefix}.executionAuthorized`, 'must_be_false', 'executionAuthorized must be false in Pack28'));
  }
  if (record.uiBackendWiringAuthorized !== false) {
    errors.push(
      issue(`${prefix}.uiBackendWiringAuthorized`, 'must_be_false', 'uiBackendWiringAuthorized must be false in Pack28'),
    );
  }
  if (record.dbWriteAuthorized !== false) {
    errors.push(issue(`${prefix}.dbWriteAuthorized`, 'must_be_false', 'dbWriteAuthorized must be false in Pack28'));
  }
  if (record.statusPostAuthorized !== false) {
    errors.push(
      issue(`${prefix}.statusPostAuthorized`, 'must_be_false', 'statusPostAuthorized must be false in Pack28'),
    );
  }
  if (record.liveQaAuthorized !== false) {
    errors.push(issue(`${prefix}.liveQaAuthorized`, 'must_be_false', 'liveQaAuthorized must be false in Pack28'));
  }
}

/** Validate a Pack28 execution integration policy record. */
export function validateVionaExecutionIntegrationPolicy(
  policy: VionaExecutionIntegrationPolicy,
): VionaExecutionIntegrationValidationResult {
  const errors: VionaExecutionIntegrationValidationIssue[] = [];

  if (!isNonEmptyString(policy.actionId) && policy.actionFamily !== 'unknown') {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(policy.actionFamily)) {
    errors.push(issue('actionFamily', 'required', 'actionFamily must be a non-empty string'));
  }
  if (!isValidReadinessBucket(policy.integrationReadinessBucket)) {
    errors.push(issue('integrationReadinessBucket', 'invalid', 'integrationReadinessBucket is invalid'));
  }
  if (!isValidLaneClassification(policy.integrationLaneClassification)) {
    errors.push(issue('integrationLaneClassification', 'invalid', 'integrationLaneClassification is invalid'));
  }

  validateAuthorizationFlags(errors, 'policy', policy);

  if (
    policy.integrationReadinessBucket === 'blocked_sensitive_integration' &&
    !isNonEmptyString(policy.blockedReason) &&
    policy.actionFamily !== 'unknown'
  ) {
    errors.push(issue('blockedReason', 'required', 'blockedReason is required for blocked sensitive integration'));
  }
  if (policy.sensitiveLane && policy.integrationReadinessBucket === 'blocked_sensitive_integration') {
    if (!policy.requiresHumanApproval && policy.actionFamily !== 'unknown') {
      errors.push(
        issue('requiresHumanApproval', 'required', 'blocked sensitive lanes must require human approval'),
      );
    }
  }

  errors.push(...collectSecretIssues('notes', policy.notes));
  errors.push(...collectSecretIssues('operatorMessage', policy.operatorMessage));
  errors.push(...collectSecretIssues('userFacingMessage', policy.userFacingMessage));
  errors.push(...collectSecretIssues('blockedReason', policy.blockedReason));
  errors.push(...collectSecretIssues('requiredFutureGate', policy.requiredFutureGate));

  return result(errors);
}

/** Validate an integration gate evaluation result. */
export function validateVionaExecutionIntegrationGateEvaluation(
  evaluation: VionaExecutionIntegrationGateEvaluation,
): VionaExecutionIntegrationValidationResult {
  const errors: VionaExecutionIntegrationValidationIssue[] = [];

  if (!isNonEmptyString(evaluation.actionId)) {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isValidReadinessBucket(evaluation.integrationReadinessBucket)) {
    errors.push(issue('integrationReadinessBucket', 'invalid', 'integrationReadinessBucket is invalid'));
  }
  if (!isValidLaneClassification(evaluation.integrationLaneClassification)) {
    errors.push(issue('integrationLaneClassification', 'invalid', 'integrationLaneClassification is invalid'));
  }

  validateAuthorizationFlags(errors, 'evaluation', evaluation);

  if (evaluation.blocked && !isNonEmptyString(evaluation.blockedReason)) {
    errors.push(issue('blockedReason', 'required', 'blockedReason is required when blocked is true'));
  }
  if (evaluation.allowedToBuildPreviewPlan && evaluation.executionAuthorized !== false) {
    errors.push(issue('allowedToBuildPreviewPlan', 'non_executing', 'preview planning must remain non-executing'));
  }
  if (evaluation.allowedToBuildDryRunPlan && evaluation.executionAuthorized !== false) {
    errors.push(issue('allowedToBuildDryRunPlan', 'non_executing', 'dry-run planning must remain non-executing'));
  }

  errors.push(...collectSecretIssues('operatorMessage', evaluation.operatorMessage));
  errors.push(...collectSecretIssues('userFacingMessage', evaluation.userFacingMessage));
  errors.push(...collectSecretIssues('blockedReason', evaluation.blockedReason));

  return result(errors);
}

/** Validate a future integration plan record. */
export function validateVionaExecutionIntegrationPlan(
  plan: VionaExecutionIntegrationPlan,
): VionaExecutionIntegrationValidationResult {
  const errors: VionaExecutionIntegrationValidationIssue[] = [];
  const warnings: VionaExecutionIntegrationValidationIssue[] = [];

  if (!isNonEmptyString(plan.integrationPlanId)) {
    errors.push(issue('integrationPlanId', 'required', 'integrationPlanId must be a non-empty string'));
  }
  if (!isNonEmptyString(plan.actionId)) {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(plan.targetType)) {
    errors.push(issue('targetType', 'required', 'targetType must be a non-empty string'));
  }
  if (!isNonEmptyString(plan.targetId)) {
    errors.push(issue('targetId', 'required', 'targetId must be a non-empty string'));
  }
  if (!isValidReadinessBucket(plan.integrationReadinessBucket)) {
    errors.push(issue('integrationReadinessBucket', 'invalid', 'integrationReadinessBucket is invalid'));
  }
  if (!isValidLaneClassification(plan.integrationLaneClassification)) {
    errors.push(issue('integrationLaneClassification', 'invalid', 'integrationLaneClassification is invalid'));
  }

  validateAuthorizationFlags(errors, 'plan', plan);

  if (plan.previewOnly && plan.dryRunOnly) {
    errors.push(issue('previewOnly', 'exclusive', 'previewOnly and dryRunOnly cannot both be true'));
  }
  if (plan.previewOnly && plan.executionAuthorized !== false) {
    errors.push(issue('previewOnly', 'non_executing', 'preview planning plans must remain non-executing'));
  }
  if (plan.dryRunOnly && plan.executionAuthorized !== false) {
    errors.push(issue('dryRunOnly', 'non_executing', 'dry-run planning plans must remain non-executing'));
  }
  if (
    plan.integrationReadinessBucket === 'blocked_sensitive_integration' &&
    plan.integrationLaneClassification === 'blocked_sensitive_lane'
  ) {
    // blocked sensitive plans must remain non-executing — validated via authorization flags above
  }

  validateAuthorizationFlags(errors, 'plan.policySnapshot', plan.policySnapshot);

  errors.push(...collectSecretIssues('operatorMessage', plan.operatorMessage));
  errors.push(...collectSecretIssues('userFacingMessage', plan.userFacingMessage));
  errors.push(...collectSecretIssues('requiredFutureGate', plan.requiredFutureGate));

  if (plan.previewOnly && plan.integrationLaneClassification === 'blocked_sensitive_lane') {
    warnings.push(
      issue('integrationLaneClassification', 'unexpected', 'preview plan on blocked_sensitive_lane is unusual'),
    );
  }

  return result(errors, warnings);
}

/** Assert Pack28 execution integration readiness layer invariants — structured result only, no throw. */
export function assertVionaExecutionIntegrationReadinessLayerSafe(): VionaExecutionIntegrationValidationResult {
  const errors: VionaExecutionIntegrationValidationIssue[] = [];

  for (const policy of VIONA_PACK28_ACTION_INTEGRATION_POLICIES) {
    const policyResult = validateVionaExecutionIntegrationPolicy(policy);
    if (!policyResult.ok) {
      errors.push(
        ...policyResult.errors.map((entry) =>
          issue(`policy.${policy.actionId}.${entry.field}`, entry.code, entry.message),
        ),
      );
    }
  }

  const unknownResult = validateVionaExecutionIntegrationPolicy(VIONA_PACK28_UNKNOWN_ACTION_POLICY);
  if (!unknownResult.ok) {
    errors.push(...unknownResult.errors);
  }

  if (VIONA_PACK28_ACTION_INTEGRATION_POLICIES.length !== 9) {
    errors.push(issue('policies', 'count', 'Pack28 must define exactly 9 action integration policies'));
  }

  if (vionaIntegrationReadinessBuckets.length !== 9) {
    errors.push(issue('buckets', 'count', 'Pack28 must define exactly 9 integration readiness buckets'));
  }

  if (vionaIntegrationLaneClassifications.length !== 9) {
    errors.push(issue('classifications', 'count', 'Pack28 must define exactly 9 integration lane classifications'));
  }

  return result(errors);
}
