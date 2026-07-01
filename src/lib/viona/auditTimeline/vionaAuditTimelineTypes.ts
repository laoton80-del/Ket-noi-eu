/**
 * Pack26C — Unified audit/timeline contract types (non-persistent, non-executing).
 * No DB writes, no UI wiring, no env/network access.
 */

import type { VionaActionEnvironment, VionaActionReadiness } from '../actions/vionaActionCapabilityTypes';

export const vionaAuditTimelineEventTaxonomy = [
  'status.transition',
  'assignment.requested',
  'assignment.completed',
  'confirmation.requested',
  'confirmation.completed',
  'cancellation.requested',
  'cancellation.completed',
  'booking.requested',
  'payment.intent.created',
  'sos.assist.requested',
  'wallet.adjustment.requested',
  'live_ai.action.requested',
  'gate.blocked',
  'gate.approved',
  'replay.detected',
  'failure.recorded',
] as const;

export type VionaAuditTimelineEventCategory = (typeof vionaAuditTimelineEventTaxonomy)[number];

/** Pack25-proven reference category — other categories are planning-only / non-executing. */
export const VIONA_PACK26C_PACK25_REFERENCE_TAXONOMY: VionaAuditTimelineEventCategory = 'status.transition';

export const VIONA_PACK26C_REPLAY_REFERENCE_TAXONOMY: VionaAuditTimelineEventCategory = 'replay.detected';

/** Planning-only categories — not executable until separately authorized packs open those lanes. */
export const VIONA_PACK26C_PLANNING_ONLY_TAXONOMY: readonly VionaAuditTimelineEventCategory[] =
  vionaAuditTimelineEventTaxonomy.filter(
    (category) =>
      category !== VIONA_PACK26C_PACK25_REFERENCE_TAXONOMY &&
      category !== VIONA_PACK26C_REPLAY_REFERENCE_TAXONOMY,
  );

export const vionaAuditTimelineEvidenceLevels = [
  'demo',
  'pilot',
  'staging',
  'production_safe',
] as const;

export type VionaAuditTimelineEvidenceLevel = (typeof vionaAuditTimelineEvidenceLevels)[number];

export const vionaAuditTimelineRedactionLevels = ['none', 'partial', 'operator_only_detail'] as const;

export type VionaAuditTimelineRedactionLevel = (typeof vionaAuditTimelineRedactionLevels)[number];

export const vionaAuditTimelineSafetyCopyLevels = [
  'demo',
  'pilot',
  'staging',
  'production_safe',
] as const;

export type VionaAuditTimelineSafetyCopyLevel = (typeof vionaAuditTimelineSafetyCopyLevels)[number];

export const vionaAuditTimelineSourceSystems = [
  'viona-api',
  'viona-ui',
  'viona-worker',
  'viona-contract',
] as const;

export type VionaAuditTimelineSourceSystem = (typeof vionaAuditTimelineSourceSystems)[number];

export type VionaAuditTimelineActorRef = {
  role: string;
  ref: string;
  redacted: boolean;
};

export type VionaAuditTimelineOwnerRef = {
  ref: string;
  redacted: boolean;
};

export type VionaAuditTimelineCapabilityFlagsSnapshot = {
  executionEnabled: false;
  uiAffordanceAllowed: false;
  readinessState: VionaActionReadiness;
  actionId: string;
};

export type VionaAuditTimelineApprovalSnapshot = {
  required: string;
  satisfied: readonly string[];
  missing: readonly string[];
};

export type VionaAuditTimelineSafetyGateSnapshot = {
  legal: 'allowed' | 'blocked';
  payment: 'allowed' | 'blocked';
  ops: 'allowed' | 'blocked';
  sos: 'allowed' | 'blocked';
  market: 'allowed' | 'blocked';
};

export type VionaAuditEvent = {
  auditEventId: string;
  actionId: string;
  actionFamily: string;
  actionVersion: string;
  universe: string;
  targetType: string;
  targetId: string;
  actorRole: string;
  actorRef: VionaAuditTimelineActorRef;
  ownerRef: VionaAuditTimelineOwnerRef | null;
  market: string;
  environment: VionaActionEnvironment;
  readinessState: VionaActionReadiness;
  beforeState: string | null;
  afterState: string | null;
  requestedTransition: string | null;
  approvedTransition: string | null;
  idempotencyKey: string | null;
  correlationId: string | null;
  capabilityFlagsSnapshot: VionaAuditTimelineCapabilityFlagsSnapshot;
  approvalSnapshot: VionaAuditTimelineApprovalSnapshot;
  safetyGateSnapshot: VionaAuditTimelineSafetyGateSnapshot;
  blockedReason: string | null;
  failureReason: string | null;
  createdAt: string;
  sourceSystem: VionaAuditTimelineSourceSystem;
  evidenceLevel: VionaAuditTimelineEvidenceLevel;
  humanReadableSummary: string;
  eventCategory: VionaAuditTimelineEventCategory;
};

export type VionaTimelineEvent = {
  timelineEventId: string;
  actionId: string;
  targetType: string;
  targetId: string;
  universe: string;
  market: string;
  actorDisplayRole: string;
  label: string;
  summary: string;
  statusBefore: string | null;
  statusAfter: string | null;
  userFacingState: string;
  safetyCopyLevel: VionaAuditTimelineSafetyCopyLevel;
  occurredAt: string;
  visibleToOwner: boolean;
  visibleToMerchant: boolean;
  visibleToOperator: boolean;
  visibleToAdmin: boolean;
  redactionLevel: VionaAuditTimelineRedactionLevel;
  linkedAuditEventId: string;
  eventCategory: VionaAuditTimelineEventCategory;
};

export type VionaActionResultEnvelope = {
  ok: boolean;
  actionId: string;
  targetId: string;
  requestedState: string | null;
  resultingState: string | null;
  readinessState: VionaActionReadiness;
  executionEnabled: false;
  uiAffordanceAllowed: false;
  idempotencyKey: string | null;
  auditEventCreated: boolean;
  timelineEventCreated: boolean;
  replayed: boolean;
  blocked: boolean;
  blockedReason: string | null;
  failureReason: string | null;
  userMessage: string;
  operatorMessage: string;
  safeToRetry: boolean;
};

export type VionaAuditEventInput = Omit<VionaAuditEvent, never>;

export type VionaTimelineEventInput = Omit<VionaTimelineEvent, never>;

export type VionaActionResultEnvelopeInput = {
  ok: boolean;
  actionId: string;
  targetId: string;
  requestedState?: string | null;
  resultingState?: string | null;
  readinessState: VionaActionReadiness;
  idempotencyKey?: string | null;
  auditEventCreated?: boolean;
  timelineEventCreated?: boolean;
  replayed?: boolean;
  blocked?: boolean;
  blockedReason?: string | null;
  failureReason?: string | null;
  userMessage?: string;
  operatorMessage?: string;
  safeToRetry?: boolean;
};

export type VionaBlockedActionResultInput = {
  actionId: string;
  targetId: string;
  readinessState: VionaActionReadiness;
  blockedReason: string;
  requestedState?: string | null;
  resultingState?: string | null;
  idempotencyKey?: string | null;
  userMessage?: string;
  operatorMessage?: string;
  safeToRetry?: boolean;
};

export type VionaReplayActionResultInput = {
  actionId: string;
  targetId: string;
  readinessState: VionaActionReadiness;
  requestedState?: string | null;
  resultingState?: string | null;
  idempotencyKey?: string | null;
  userMessage?: string;
  operatorMessage?: string;
};

export type VionaFailedActionResultInput = {
  actionId: string;
  targetId: string;
  readinessState: VionaActionReadiness;
  failureReason: string;
  requestedState?: string | null;
  resultingState?: string | null;
  idempotencyKey?: string | null;
  userMessage?: string;
  operatorMessage?: string;
  safeToRetry?: boolean;
};

export type VionaAuditTimelineValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type VionaAuditTimelineValidationResult = {
  ok: boolean;
  issues: readonly VionaAuditTimelineValidationIssue[];
};
