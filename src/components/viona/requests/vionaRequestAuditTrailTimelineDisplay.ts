/**
 * Pack30D-3 — Audit Trail Timeline display mapping (read-only, mock-only, no writes).
 *
 * Maps the full, unfiltered `VionaRequestAuditEvent` ledger already returned by the existing
 * `GET /api/viona/requests/:id` detail endpoint (`detail.auditEvents`) into UI-ready, newest-first
 * timeline rows. This is deliberately a separate, more technical/complete ledger view from the
 * existing friendly `vionaRequestActivityTimelineDisplay.ts` timeline (which merges status/note
 * events into a curated narrative, oldest-first) — the Audit Trail view below surfaces every raw
 * audit row, including internal hooks like Pack30D-1 (`executionPlanBuilt`, `executionMockInvoked`,
 * …) and Pack30D-2 (`stateTransition`), for full transparency.
 *
 * No DB access, no writes, no mutation of the input array — pure mapping only. No secret content
 * is ever read from `payloadJson`; only the well-known `fromStatus`/`toStatus`/`targetStatus` keys
 * already written by the existing, reviewed write paths are extracted for the state-change label.
 */

import type { VionaRequestAuditEvent } from '../../../services/vionaRequestApi';

export type VionaRequestAuditTrailTimelineItem = Readonly<{
  id: string;
  eventType: string;
  eventTypeLabel: string;
  actorLabel: string;
  timestampLabel: string;
  stateChangeLabel: string | null;
  createdAt: string;
}>;

/**
 * Known event-type labels — covers the pre-existing Pack16/20/25 types plus the Pack30D-1
 * (`executionPlanBuilt` … `executionKilled`) and Pack30D-2 (`stateTransition`) additions. Any
 * future/unrecognized event type falls back to its raw `eventType` string rather than failing.
 */
const VIONA_AUDIT_TRAIL_EVENT_TYPE_LABELS: Readonly<Record<string, string>> = {
  'action.status': 'Status transition',
  'action.note': 'Note added',
  requestRead: 'Request viewed',
  requestSubmitted: 'Request submitted',
  statusTransitionProposed: 'Status transition proposed',
  humanConfirmationRequested: 'Human confirmation requested',
  humanConfirmationRecorded: 'Human confirmation recorded',
  partnerResponseRecorded: 'Partner response recorded',
  terminalStateMarked: 'Terminal state marked',
  safetyGateBlocked: 'Safety gate blocked',
  auditRead: 'Audit read',
  executionPlanBuilt: 'Execution plan built (mock-only)',
  executionMockInvoked: 'Mock execution invoked (mock-only)',
  executionRealAttempted: 'Real execution attempted',
  executionRealSucceeded: 'Real execution succeeded',
  executionRealFailedBounded: 'Real execution failed (bounded)',
  executionBlockedPolicy: 'Execution blocked (policy)',
  executionBlockedOperator: 'Execution blocked (operator approval)',
  executionRolledBack: 'Execution rolled back',
  executionKilled: 'Execution killed (kill switch)',
  stateTransition: 'Audit ledger hook (state machine)',
};

export function resolveVionaAuditTrailEventTypeLabel(eventType: string): string {
  return VIONA_AUDIT_TRAIL_EVENT_TYPE_LABELS[eventType] ?? eventType;
}

function resolveVionaAuditTrailActorLabel(event: VionaRequestAuditEvent): string {
  const role = event.actorRoleLabel?.trim();
  if (role != null && role.length > 0) {
    return role;
  }
  return 'System';
}

function formatVionaAuditTrailTimestamp(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }
  return new Date(parsed).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Reads a `fromStatus` → `toStatus` (Pack30D-2 `stateTransition` payload shape) or
 * `fromStatus` → `targetStatus` (pre-existing Pack25 `action.status` payload shape) pair from
 * `payloadJson`, if present. Returns `null` when the event carries no recognizable state change
 * (e.g. a note, an execution-plan-preview event, or a malformed/missing payload).
 */
export function readVionaAuditTrailStateChange(payloadJson: unknown): string | null {
  if (payloadJson == null || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
    return null;
  }
  const record = payloadJson as Record<string, unknown>;
  const fromStatus = typeof record.fromStatus === 'string' ? record.fromStatus : null;
  const toStatus =
    typeof record.toStatus === 'string'
      ? record.toStatus
      : typeof record.targetStatus === 'string'
        ? record.targetStatus
        : null;
  if (fromStatus == null || toStatus == null) {
    return null;
  }
  return `${fromStatus} → ${toStatus}`;
}

/**
 * Read-only, newest-first mapping of the full audit-event ledger into UI-ready timeline rows.
 * Never mutates the input array, never writes, never calls the network — pure function only.
 */
export function buildVionaRequestAuditTrailTimelineItems(
  auditEvents: readonly VionaRequestAuditEvent[]
): readonly VionaRequestAuditTrailTimelineItem[] {
  return [...auditEvents]
    .sort((a, b) => {
      const bySortAt = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (bySortAt !== 0) return bySortAt;
      return b.id.localeCompare(a.id);
    })
    .map((event) => ({
      id: event.id,
      eventType: event.eventType,
      eventTypeLabel: resolveVionaAuditTrailEventTypeLabel(event.eventType),
      actorLabel: resolveVionaAuditTrailActorLabel(event),
      timestampLabel: formatVionaAuditTrailTimestamp(event.createdAt),
      stateChangeLabel: readVionaAuditTrailStateChange(event.payloadJson),
      createdAt: event.createdAt,
    }));
}
