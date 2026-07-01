/**
 * Pack27 — Pure execution lane validators (no side effects, no execution).
 */

import {
  VIONA_PACK27_ACTION_READINESS_POLICIES,
  VIONA_PACK27_UNKNOWN_ACTION_POLICY,
} from './vionaExecutionLanePolicy';
import type {
  VionaExecutionAttemptEnvelope,
  VionaExecutionLaneValidationIssue,
  VionaExecutionLaneValidationResult,
  VionaExecutionReadinessGateEvaluation,
  VionaExecutionReadinessPolicy,
} from './vionaExecutionLaneTypes';
import {
  vionaExecutionLaneTypes,
  vionaExecutionReadinessStages,
} from './vionaExecutionLaneTypes';

function issue(field: string, code: string, message: string): VionaExecutionLaneValidationIssue {
  return { field, code, message };
}

function result(
  errors: VionaExecutionLaneValidationIssue[],
  warnings: VionaExecutionLaneValidationIssue[] = [],
): VionaExecutionLaneValidationResult {
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
): VionaExecutionLaneValidationIssue[] {
  if (!value) return [];
  if (!containsSecretLikeContent(value)) return [];
  return [issue(field, 'secret_like_content', `${field} must not contain secret-like content`)];
}

function isValidReadinessStage(value: string): boolean {
  return (vionaExecutionReadinessStages as readonly string[]).includes(value);
}

function isValidExecutionLaneType(value: string): boolean {
  return (vionaExecutionLaneTypes as readonly string[]).includes(value);
}

/** Validate a Pack27 execution readiness policy record. */
export function validateVionaExecutionReadinessPolicy(
  policy: VionaExecutionReadinessPolicy,
): VionaExecutionLaneValidationResult {
  const errors: VionaExecutionLaneValidationIssue[] = [];

  if (!isNonEmptyString(policy.actionId) && policy.actionFamily !== 'unknown') {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(policy.actionFamily)) {
    errors.push(issue('actionFamily', 'required', 'actionFamily must be a non-empty string'));
  }
  if (!isValidReadinessStage(policy.readinessStage)) {
    errors.push(issue('readinessStage', 'invalid', 'readinessStage is invalid'));
  }
  if (!isValidExecutionLaneType(policy.executionLaneType)) {
    errors.push(issue('executionLaneType', 'invalid', 'executionLaneType is invalid'));
  }
  if (policy.readinessStage === 'execution_authorized_future') {
    errors.push(
      issue(
        'readinessStage',
        'future_not_active',
        'execution_authorized_future must not be active in current Pack27 policy',
      ),
    );
  }
  if (policy.planningOnly !== true) {
    errors.push(issue('planningOnly', 'must_be_true', 'planningOnly must be true in Pack27'));
  }
  if (policy.executionAuthorized !== false) {
    errors.push(issue('executionAuthorized', 'must_be_false', 'executionAuthorized must be false in Pack27'));
  }
  if (policy.uiAffordanceAuthorized !== false) {
    errors.push(
      issue('uiAffordanceAuthorized', 'must_be_false', 'uiAffordanceAuthorized must be false in Pack27'),
    );
  }
  if (policy.dbWriteAuthorized !== false) {
    errors.push(issue('dbWriteAuthorized', 'must_be_false', 'dbWriteAuthorized must be false in Pack27'));
  }
  if (policy.statusPostAuthorized !== false) {
    errors.push(issue('statusPostAuthorized', 'must_be_false', 'statusPostAuthorized must be false in Pack27'));
  }
  if (policy.liveQaAuthorized !== false) {
    errors.push(issue('liveQaAuthorized', 'must_be_false', 'liveQaAuthorized must be false in Pack27'));
  }
  if (
    policy.executionLaneType === 'blocked_sensitive_lane' &&
    policy.readinessStage !== 'execution_blocked' &&
    policy.actionFamily !== 'unknown'
  ) {
    errors.push(
      issue('readinessStage', 'blocked_lane', 'blocked_sensitive_lane policies should use execution_blocked stage'),
    );
  }
  if (policy.sensitiveLane && policy.executionLaneType === 'blocked_sensitive_lane' && !policy.requiresHumanApproval) {
    errors.push(
      issue('requiresHumanApproval', 'required', 'blocked sensitive lanes must require human approval'),
    );
  }
  if (policy.previewOnly && policy.dryRunOnly) {
    errors.push(issue('previewOnly', 'exclusive', 'previewOnly and dryRunOnly cannot both be true'));
  }

  errors.push(...collectSecretIssues('notes', policy.notes));

  return result(errors);
}

/** Validate a Pack27 execution attempt envelope. */
export function validateVionaExecutionAttemptEnvelope(
  envelope: VionaExecutionAttemptEnvelope,
): VionaExecutionLaneValidationResult {
  const errors: VionaExecutionLaneValidationIssue[] = [];
  const warnings: VionaExecutionLaneValidationIssue[] = [];

  if (!isNonEmptyString(envelope.executionAttemptId)) {
    errors.push(issue('executionAttemptId', 'required', 'executionAttemptId must be a non-empty string'));
  }
  if (!isNonEmptyString(envelope.actionId)) {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(envelope.targetType)) {
    errors.push(issue('targetType', 'required', 'targetType must be a non-empty string'));
  }
  if (!isNonEmptyString(envelope.targetId)) {
    errors.push(issue('targetId', 'required', 'targetId must be a non-empty string'));
  }
  if (!isValidReadinessStage(envelope.readinessStage)) {
    errors.push(issue('readinessStage', 'invalid', 'readinessStage is invalid'));
  }
  if (!isValidExecutionLaneType(envelope.executionLaneType)) {
    errors.push(issue('executionLaneType', 'invalid', 'executionLaneType is invalid'));
  }
  if (envelope.executionAuthorized !== false) {
    errors.push(issue('executionAuthorized', 'must_be_false', 'executionAuthorized must be false in Pack27'));
  }
  if (envelope.readinessStage === 'execution_authorized_future') {
    errors.push(
      issue(
        'readinessStage',
        'future_not_active',
        'execution_authorized_future must not be active in current Pack27 envelope',
      ),
    );
  }
  if (envelope.capabilityFlagsSnapshot.executionEnabled !== false) {
    errors.push(
      issue(
        'capabilityFlagsSnapshot.executionEnabled',
        'must_be_false',
        'capabilityFlagsSnapshot.executionEnabled must be false',
      ),
    );
  }
  if (envelope.capabilityFlagsSnapshot.uiAffordanceAllowed !== false) {
    errors.push(
      issue(
        'capabilityFlagsSnapshot.uiAffordanceAllowed',
        'must_be_false',
        'capabilityFlagsSnapshot.uiAffordanceAllowed must be false',
      ),
    );
  }
  if (envelope.approvalSnapshot.executionAuthorized !== false) {
    errors.push(
      issue('approvalSnapshot.executionAuthorized', 'must_be_false', 'approvalSnapshot.executionAuthorized must be false'),
    );
  }
  if (envelope.auditTimelineSnapshot.persistent !== false) {
    errors.push(
      issue('auditTimelineSnapshot.persistent', 'must_be_false', 'auditTimelineSnapshot.persistent must be false'),
    );
  }
  if (envelope.executionLaneType === 'blocked_sensitive_lane' && !isNonEmptyString(envelope.blockedReason)) {
    errors.push(issue('blockedReason', 'required', 'blockedReason is required for blocked sensitive lanes'));
  }
  if (envelope.previewOnly && envelope.dryRunOnly) {
    errors.push(issue('previewOnly', 'exclusive', 'previewOnly and dryRunOnly cannot both be true'));
  }
  if (envelope.previewOnly && envelope.executionAuthorized !== false) {
    errors.push(issue('previewOnly', 'non_executing', 'preview-only attempts must remain non-executing'));
  }
  if (envelope.dryRunOnly && envelope.executionAuthorized !== false) {
    errors.push(issue('dryRunOnly', 'non_executing', 'dry-run attempts must remain non-executing'));
  }

  for (const [field, value] of [
    ['blockedReason', envelope.blockedReason],
    ['failureReason', envelope.failureReason],
    ['operatorMessage', envelope.operatorMessage],
    ['userFacingMessage', envelope.userFacingMessage],
  ] as const) {
    errors.push(...collectSecretIssues(field, value));
  }

  if (envelope.previewOnly && envelope.executionLaneType === 'blocked_sensitive_lane') {
    warnings.push(
      issue('executionLaneType', 'unexpected', 'preview-only envelope on blocked_sensitive_lane is unusual'),
    );
  }

  return result(errors, warnings);
}

/** Validate an execution readiness gate evaluation result. */
export function validateVionaExecutionReadinessGateEvaluation(
  evaluation: VionaExecutionReadinessGateEvaluation,
): VionaExecutionLaneValidationResult {
  const errors: VionaExecutionLaneValidationIssue[] = [];

  if (!isNonEmptyString(evaluation.actionId)) {
    errors.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (evaluation.executionAuthorized !== false) {
    errors.push(issue('executionAuthorized', 'must_be_false', 'executionAuthorized must be false'));
  }
  if (!isValidReadinessStage(evaluation.readinessStage)) {
    errors.push(issue('readinessStage', 'invalid', 'readinessStage is invalid'));
  }
  if (!isValidExecutionLaneType(evaluation.executionLaneType)) {
    errors.push(issue('executionLaneType', 'invalid', 'executionLaneType is invalid'));
  }
  if (evaluation.readinessStage === 'execution_authorized_future') {
    errors.push(
      issue(
        'readinessStage',
        'future_not_active',
        'execution_authorized_future must not be active in current Pack27 evaluation',
      ),
    );
  }
  if (evaluation.blocked && !isNonEmptyString(evaluation.blockedReason)) {
    errors.push(issue('blockedReason', 'required', 'blockedReason is required when blocked is true'));
  }

  const policyResult = validateVionaExecutionReadinessPolicy(evaluation.policy);
  errors.push(...policyResult.errors);

  errors.push(...collectSecretIssues('operatorMessage', evaluation.operatorMessage));
  errors.push(...collectSecretIssues('userFacingMessage', evaluation.userFacingMessage));
  errors.push(...collectSecretIssues('blockedReason', evaluation.blockedReason));

  return result(errors);
}

/** Assert Pack27 execution lane planning layer invariants — structured result only, no throw. */
export function assertVionaExecutionLanePlanningLayerSafe(): VionaExecutionLaneValidationResult {
  const errors: VionaExecutionLaneValidationIssue[] = [];

  for (const policy of VIONA_PACK27_ACTION_READINESS_POLICIES) {
    const policyResult = validateVionaExecutionReadinessPolicy(policy);
    if (!policyResult.ok) {
      errors.push(
        ...policyResult.errors.map((entry) =>
          issue(`policy.${policy.actionId}.${entry.field}`, entry.code, entry.message),
        ),
      );
    }
  }

  const unknownResult = validateVionaExecutionReadinessPolicy(VIONA_PACK27_UNKNOWN_ACTION_POLICY);
  if (!unknownResult.ok) {
    errors.push(...unknownResult.errors);
  }

  if (VIONA_PACK27_ACTION_READINESS_POLICIES.length !== 9) {
    errors.push(issue('policies', 'count', 'Pack27 must define exactly 9 action readiness policies'));
  }

  return result(errors);
}
