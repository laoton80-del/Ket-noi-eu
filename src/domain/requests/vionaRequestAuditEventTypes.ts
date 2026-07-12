import type { VionaRequestStatus } from './vionaRequestTypes';

export const vionaRequestAuditActorTypes = [
  'requester',
  'operator',
  'admin',
  'merchant',
  'partner',
  'system',
  'aiDraftOnly',
] as const;

export type VionaRequestAuditActorType = (typeof vionaRequestAuditActorTypes)[number];

export const vionaRequestAuditEventTypes = [
  'requestRead',
  'requestSubmitted',
  'statusTransitionProposed',
  'humanConfirmationRequested',
  'humanConfirmationRecorded',
  'partnerResponseRecorded',
  'terminalStateMarked',
  'safetyGateBlocked',
  'auditRead',
  // Pack30D-1 — durable audit trail for the existing, unmodified, mock-only Pack30B
  // execution-plan-preview route. See docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md §6.2.
  // `executionRealAttempted`/`executionRealSucceeded`/`executionRealFailedBounded`/
  // `executionRolledBack`/`executionKilled` are reserved for a future, separately authorized
  // real-provider stage (Pack30D-2) and are never emitted by Pack30D-1.
  'executionPlanBuilt',
  'executionMockInvoked',
  'executionRealAttempted',
  'executionRealSucceeded',
  'executionRealFailedBounded',
  'executionBlockedPolicy',
  'executionBlockedOperator',
  'executionRolledBack',
  'executionKilled',
  // Pack30D-2 — durable audit hook fired by the existing, narrowly-scoped Pack25 request
  // status state machine (`vionaRequestStatusActionService.ts`) on every *committed* status
  // transition. Mock-only: this event is never emitted for a real-provider call, never emitted
  // for an idempotent replay (no new transition occurred), and never changes the transition's
  // existing response shape or the pre-existing `action.status` audit row written alongside it.
  'stateTransition',
] as const;

export type VionaRequestAuditEventType = (typeof vionaRequestAuditEventTypes)[number];

/**
 * Future append-only audit event shape. Types only — no writer, no DB, no API.
 * Audit log records workflow evidence; it is not ledger or payment truth.
 */
export type VionaRequestAuditEventRecord = Readonly<{
  id: string;
  requestId: string;
  eventType: VionaRequestAuditEventType;
  actorType: VionaRequestAuditActorType;
  actorUserId: string | null;
  fromStatus: VionaRequestStatus | null;
  toStatus: VionaRequestStatus | null;
  reason: string;
  idempotencyKey: string | null;
  createdAt: string;
  metadata: Readonly<Record<string, unknown>> | null;
  containsProtectedAction: boolean;
}>;

/**
 * Preview of a proposed status transition for operator review. Read-only planning type.
 */
export type VionaRequestAuditTransitionPreview = Readonly<{
  requestId: string;
  fromStatus: VionaRequestStatus;
  toStatus: VionaRequestStatus;
  actorType: VionaRequestAuditActorType;
  reason: string;
  requiresHumanConfirmation: boolean;
  requiresAuditLogBeforeWrite: boolean;
  blockedReason: string | null;
}>;

/**
 * Documents which write paths remain blocked until future gates pass.
 */
export type VionaRequestAuditWriteReadiness = Readonly<{
  auditLogImplemented: false;
  statusWritesAllowed: false;
  protectedActionWritesAllowed: false;
  requiresAuthRoleGate: true;
  requiresIdempotency: true;
  requiresHumanConfirmationForProtectedActions: true;
  requiresOpsRunbook: true;
  auditIsNotLedger: true;
}>;

export const VIONA_REQUEST_AUDIT_WRITE_READINESS: VionaRequestAuditWriteReadiness = {
  auditLogImplemented: false,
  statusWritesAllowed: false,
  protectedActionWritesAllowed: false,
  requiresAuthRoleGate: true,
  requiresIdempotency: true,
  requiresHumanConfirmationForProtectedActions: true,
  requiresOpsRunbook: true,
  auditIsNotLedger: true,
} as const;
