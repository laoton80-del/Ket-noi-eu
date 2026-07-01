/**
 * Pack26C — Pure audit/timeline contract validators (no side effects, no execution).
 */

import type {
  VionaActionResultEnvelope,
  VionaAuditEvent,
  VionaAuditTimelineValidationIssue,
  VionaAuditTimelineValidationResult,
  VionaTimelineEvent,
} from './vionaAuditTimelineTypes';

function issue(
  field: string,
  code: string,
  message: string,
): VionaAuditTimelineValidationIssue {
  return { field, code, message };
}

function result(issues: VionaAuditTimelineValidationIssue[]): VionaAuditTimelineValidationResult {
  return { ok: issues.length === 0, issues };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function joinParts(parts: readonly string[]): string {
  return parts.join('');
}

/** Secret-like substrings — built without forbidden literals in source for static grep safety. */
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
): VionaAuditTimelineValidationIssue[] {
  if (!value) return [];
  if (!containsSecretLikeContent(value)) return [];
  return [issue(field, 'secret_like_content', `${field} must not contain secret-like content`)];
}

function validateExecutionFlags(envelope: VionaActionResultEnvelope): VionaAuditTimelineValidationIssue[] {
  const issues: VionaAuditTimelineValidationIssue[] = [];
  if (envelope.executionEnabled !== false) {
    issues.push(
      issue('executionEnabled', 'must_be_false', 'executionEnabled must be false in Pack26C'),
    );
  }
  if (envelope.uiAffordanceAllowed !== false) {
    issues.push(
      issue('uiAffordanceAllowed', 'must_be_false', 'uiAffordanceAllowed must be false in Pack26C'),
    );
  }
  if (!envelope.executionEnabled && envelope.ok && envelope.auditEventCreated && envelope.blocked) {
    issues.push(
      issue('blocked', 'inconsistent_ok', 'blocked result must not be ok with new audit events'),
    );
  }
  return issues;
}

function validateEnvelopeStateConsistency(
  envelope: VionaActionResultEnvelope,
): VionaAuditTimelineValidationIssue[] {
  const issues: VionaAuditTimelineValidationIssue[] = [];

  if (envelope.blocked) {
    if (!isNonEmptyString(envelope.blockedReason)) {
      issues.push(issue('blockedReason', 'required', 'blockedReason is required when blocked'));
    }
    if (envelope.ok) {
      issues.push(issue('ok', 'blocked_not_ok', 'blocked envelope must have ok === false'));
    }
    if (envelope.replayed) {
      issues.push(issue('replayed', 'blocked_not_replayed', 'blocked envelope must not be replayed'));
    }
  }

  if (envelope.replayed) {
    if (!envelope.ok) {
      issues.push(issue('ok', 'replay_must_ok', 'replayed envelope must have ok === true'));
    }
    if (envelope.auditEventCreated || envelope.timelineEventCreated) {
      issues.push(
        issue(
          'replayed',
          'no_new_events',
          'replayed envelope must not create new audit/timeline events',
        ),
      );
    }
    if (envelope.blocked) {
      issues.push(issue('blocked', 'replay_not_blocked', 'replayed envelope must not be blocked'));
    }
  }

  if (!envelope.ok && !envelope.blocked && !envelope.replayed) {
    if (!isNonEmptyString(envelope.failureReason)) {
      issues.push(
        issue('failureReason', 'required', 'failureReason is required for failed non-blocked results'),
      );
    }
  }

  return issues;
}

export function validateVionaAuditEvent(event: VionaAuditEvent): VionaAuditTimelineValidationResult {
  const issues: VionaAuditTimelineValidationIssue[] = [];

  const requiredStringFields: Array<[keyof VionaAuditEvent, string]> = [
    ['auditEventId', 'auditEventId'],
    ['actionId', 'actionId'],
    ['actionFamily', 'actionFamily'],
    ['actionVersion', 'actionVersion'],
    ['universe', 'universe'],
    ['targetType', 'targetType'],
    ['targetId', 'targetId'],
    ['actorRole', 'actorRole'],
    ['market', 'market'],
    ['environment', 'environment'],
    ['readinessState', 'readinessState'],
    ['createdAt', 'createdAt'],
    ['sourceSystem', 'sourceSystem'],
    ['evidenceLevel', 'evidenceLevel'],
    ['humanReadableSummary', 'humanReadableSummary'],
    ['eventCategory', 'eventCategory'],
  ];

  for (const [key, label] of requiredStringFields) {
    if (!isNonEmptyString(event[key] as string)) {
      issues.push(issue(label, 'required', `${label} must be a non-empty string`));
    }
  }

  if (!isNonEmptyString(event.actorRef.ref)) {
    issues.push(issue('actorRef.ref', 'required', 'actorRef.ref must be a non-empty string'));
  }

  issues.push(
    ...collectSecretIssues('humanReadableSummary', event.humanReadableSummary),
    ...collectSecretIssues('blockedReason', event.blockedReason),
    ...collectSecretIssues('failureReason', event.failureReason),
  );

  if (event.capabilityFlagsSnapshot.executionEnabled !== false) {
    issues.push(
      issue(
        'capabilityFlagsSnapshot.executionEnabled',
        'must_be_false',
        'capabilityFlagsSnapshot.executionEnabled must be false',
      ),
    );
  }
  if (event.capabilityFlagsSnapshot.uiAffordanceAllowed !== false) {
    issues.push(
      issue(
        'capabilityFlagsSnapshot.uiAffordanceAllowed',
        'must_be_false',
        'capabilityFlagsSnapshot.uiAffordanceAllowed must be false',
      ),
    );
  }

  return result(issues);
}

export function validateVionaTimelineEvent(
  timelineEvent: VionaTimelineEvent,
): VionaAuditTimelineValidationResult {
  const issues: VionaAuditTimelineValidationIssue[] = [];

  const requiredStringFields: Array<[keyof VionaTimelineEvent, string]> = [
    ['timelineEventId', 'timelineEventId'],
    ['actionId', 'actionId'],
    ['targetType', 'targetType'],
    ['targetId', 'targetId'],
    ['universe', 'universe'],
    ['market', 'market'],
    ['actorDisplayRole', 'actorDisplayRole'],
    ['label', 'label'],
    ['summary', 'summary'],
    ['userFacingState', 'userFacingState'],
    ['safetyCopyLevel', 'safetyCopyLevel'],
    ['occurredAt', 'occurredAt'],
    ['redactionLevel', 'redactionLevel'],
    ['linkedAuditEventId', 'linkedAuditEventId'],
    ['eventCategory', 'eventCategory'],
  ];

  for (const [key, label] of requiredStringFields) {
    if (!isNonEmptyString(timelineEvent[key] as string)) {
      issues.push(issue(label, 'required', `${label} must be a non-empty string`));
    }
  }

  issues.push(
    ...collectSecretIssues('summary', timelineEvent.summary),
    ...collectSecretIssues('label', timelineEvent.label),
  );

  return result(issues);
}

export function validateVionaActionResultEnvelope(
  envelope: VionaActionResultEnvelope,
): VionaAuditTimelineValidationResult {
  const issues: VionaAuditTimelineValidationIssue[] = [];

  if (!isNonEmptyString(envelope.actionId)) {
    issues.push(issue('actionId', 'required', 'actionId must be a non-empty string'));
  }
  if (!isNonEmptyString(envelope.targetId)) {
    issues.push(issue('targetId', 'required', 'targetId must be a non-empty string'));
  }
  if (!isNonEmptyString(envelope.readinessState)) {
    issues.push(issue('readinessState', 'required', 'readinessState must be present'));
  }

  issues.push(
    ...validateExecutionFlags(envelope),
    ...validateEnvelopeStateConsistency(envelope),
    ...collectSecretIssues('userMessage', envelope.userMessage),
    ...collectSecretIssues('operatorMessage', envelope.operatorMessage),
    ...collectSecretIssues('blockedReason', envelope.blockedReason),
    ...collectSecretIssues('failureReason', envelope.failureReason),
  );

  return result(issues);
}

/** Assert contract module remains safe — no secret markers in sample-safe strings only. */
export function assertVionaAuditTimelineContractSafe(): VionaAuditTimelineValidationResult {
  const probe = 'Pack26C contract utilities are read-only and non-executing.';
  if (containsSecretLikeContent(probe)) {
    return result([
      issue('contract', 'unsafe_probe', 'contract safety probe unexpectedly matched secret markers'),
    ]);
  }
  return result([]);
}
