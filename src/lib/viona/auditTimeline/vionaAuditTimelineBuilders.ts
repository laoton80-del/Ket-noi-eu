/**
 * Pack26C — Pure audit/timeline contract builders (no side effects, no execution).
 */

import type {
  VionaActionResultEnvelope,
  VionaActionResultEnvelopeInput,
  VionaAuditEvent,
  VionaAuditEventInput,
  VionaBlockedActionResultInput,
  VionaFailedActionResultInput,
  VionaReplayActionResultInput,
  VionaTimelineEvent,
  VionaTimelineEventInput,
} from './vionaAuditTimelineTypes';

function freezeResult<T extends object>(value: T): T {
  return Object.freeze({ ...value });
}

/** Build a complete audit event from caller-supplied fields — no ID or timestamp generation. */
export function buildVionaAuditEvent(input: VionaAuditEventInput): VionaAuditEvent {
  return freezeResult({
    auditEventId: input.auditEventId,
    actionId: input.actionId,
    actionFamily: input.actionFamily,
    actionVersion: input.actionVersion,
    universe: input.universe,
    targetType: input.targetType,
    targetId: input.targetId,
    actorRole: input.actorRole,
    actorRef: { ...input.actorRef },
    ownerRef: input.ownerRef ? { ...input.ownerRef } : null,
    market: input.market,
    environment: input.environment,
    readinessState: input.readinessState,
    beforeState: input.beforeState,
    afterState: input.afterState,
    requestedTransition: input.requestedTransition,
    approvedTransition: input.approvedTransition,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    capabilityFlagsSnapshot: { ...input.capabilityFlagsSnapshot },
    approvalSnapshot: {
      required: input.approvalSnapshot.required,
      satisfied: [...input.approvalSnapshot.satisfied],
      missing: [...input.approvalSnapshot.missing],
    },
    safetyGateSnapshot: { ...input.safetyGateSnapshot },
    blockedReason: input.blockedReason,
    failureReason: input.failureReason,
    createdAt: input.createdAt,
    sourceSystem: input.sourceSystem,
    evidenceLevel: input.evidenceLevel,
    humanReadableSummary: input.humanReadableSummary,
    eventCategory: input.eventCategory,
  });
}

/** Build a complete timeline event from caller-supplied fields — no ID or timestamp generation. */
export function buildVionaTimelineEvent(input: VionaTimelineEventInput): VionaTimelineEvent {
  return freezeResult({
    timelineEventId: input.timelineEventId,
    actionId: input.actionId,
    targetType: input.targetType,
    targetId: input.targetId,
    universe: input.universe,
    market: input.market,
    actorDisplayRole: input.actorDisplayRole,
    label: input.label,
    summary: input.summary,
    statusBefore: input.statusBefore,
    statusAfter: input.statusAfter,
    userFacingState: input.userFacingState,
    safetyCopyLevel: input.safetyCopyLevel,
    occurredAt: input.occurredAt,
    visibleToOwner: input.visibleToOwner,
    visibleToMerchant: input.visibleToMerchant,
    visibleToOperator: input.visibleToOperator,
    visibleToAdmin: input.visibleToAdmin,
    redactionLevel: input.redactionLevel,
    linkedAuditEventId: input.linkedAuditEventId,
    eventCategory: input.eventCategory,
  });
}

/** Build a standard action result envelope — execution and UI affordance always false in Pack26C. */
export function buildVionaActionResultEnvelope(
  input: VionaActionResultEnvelopeInput,
): VionaActionResultEnvelope {
  return freezeResult({
    ok: input.ok,
    actionId: input.actionId,
    targetId: input.targetId,
    requestedState: input.requestedState ?? null,
    resultingState: input.resultingState ?? null,
    readinessState: input.readinessState,
    executionEnabled: false,
    uiAffordanceAllowed: false,
    idempotencyKey: input.idempotencyKey ?? null,
    auditEventCreated: input.auditEventCreated ?? false,
    timelineEventCreated: input.timelineEventCreated ?? false,
    replayed: input.replayed ?? false,
    blocked: input.blocked ?? false,
    blockedReason: input.blockedReason ?? null,
    failureReason: input.failureReason ?? null,
    userMessage: input.userMessage ?? '',
    operatorMessage: input.operatorMessage ?? '',
    safeToRetry: input.safeToRetry ?? false,
  });
}

/** Build a blocked action result — non-executing contract layer only. */
export function buildBlockedVionaActionResult(
  input: VionaBlockedActionResultInput,
): VionaActionResultEnvelope {
  return buildVionaActionResultEnvelope({
    ok: false,
    actionId: input.actionId,
    targetId: input.targetId,
    requestedState: input.requestedState ?? null,
    resultingState: input.resultingState ?? input.requestedState ?? null,
    readinessState: input.readinessState,
    idempotencyKey: input.idempotencyKey ?? null,
    auditEventCreated: false,
    timelineEventCreated: false,
    replayed: false,
    blocked: true,
    blockedReason: input.blockedReason,
    failureReason: null,
    userMessage: input.userMessage ?? 'Action is not available.',
    operatorMessage: input.operatorMessage ?? input.blockedReason,
    safeToRetry: input.safeToRetry ?? false,
  });
}

/** Build an idempotent replay result — no new audit/timeline events created. */
export function buildReplayVionaActionResult(
  input: VionaReplayActionResultInput,
): VionaActionResultEnvelope {
  return buildVionaActionResultEnvelope({
    ok: true,
    actionId: input.actionId,
    targetId: input.targetId,
    requestedState: input.requestedState ?? null,
    resultingState: input.resultingState ?? input.requestedState ?? null,
    readinessState: input.readinessState,
    idempotencyKey: input.idempotencyKey ?? null,
    auditEventCreated: false,
    timelineEventCreated: false,
    replayed: true,
    blocked: false,
    blockedReason: null,
    failureReason: null,
    userMessage: input.userMessage ?? 'Request already processed.',
    operatorMessage: input.operatorMessage ?? 'Idempotent replay — no duplicate events.',
    safeToRetry: false,
  });
}

/** Build a failed action result — non-executing contract layer only. */
export function buildFailedVionaActionResult(
  input: VionaFailedActionResultInput,
): VionaActionResultEnvelope {
  return buildVionaActionResultEnvelope({
    ok: false,
    actionId: input.actionId,
    targetId: input.targetId,
    requestedState: input.requestedState ?? null,
    resultingState: input.resultingState ?? null,
    readinessState: input.readinessState,
    idempotencyKey: input.idempotencyKey ?? null,
    auditEventCreated: false,
    timelineEventCreated: false,
    replayed: false,
    blocked: false,
    blockedReason: null,
    failureReason: input.failureReason,
    userMessage: input.userMessage ?? 'Action could not be completed.',
    operatorMessage: input.operatorMessage ?? input.failureReason,
    safeToRetry: input.safeToRetry ?? false,
  });
}
