import { vionaRequestStatuses, type VionaRequestStatus } from '../../../domain/requests/vionaRequestTypes';
import type {
  VionaRequestAuditEvent,
  VionaRequestStatusEvent,
} from '../../../services/vionaRequestApi';
import {
  filterNonNoteAuditEvents,
  mapVionaRequestNoteAuditTimelineItems,
} from './vionaRequestNoteAuditDisplay';

export const VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE = 'action.status';

export type VionaRequestActivityTimelineItem = Readonly<{
  id: string;
  kind: 'status' | 'activity';
  label: 'Status' | 'Activity' | 'Note';
  actorLabel: string;
  timestampLabel: string;
  summary: string;
  detail: string | null;
  sortAt: number;
}>;

export function isKnownVionaRequestStatus(value: string): value is VionaRequestStatus {
  return (vionaRequestStatuses as readonly string[]).includes(value);
}

/** Neutral read-only status label for live detail badge. */
export function normalizeStatusLabel(status: string): string {
  if (status === 'submitted') {
    return 'Submitted';
  }
  if (status === 'triage') {
    return 'In review';
  }
  if (isKnownVionaRequestStatus(status)) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  const trimmed = status.trim();
  if (trimmed.length === 0) {
    return 'Status unavailable';
  }
  return 'Status unavailable';
}

/** Neutral read-only activity row label from audit event type. */
export function normalizeActivityLabel(eventType: string): 'Status' | 'Activity' | 'Note' {
  if (eventType === VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE) {
    return 'Status';
  }
  if (eventType === 'action.note') {
    return 'Note';
  }
  return 'Activity';
}

function formatActivityTimestamp(iso: string): string {
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
  });
}

function resolveAuditActorLabel(event: VionaRequestAuditEvent): string {
  const role = event.actorRoleLabel?.trim();
  if (role != null && role.length > 0) {
    return role;
  }
  return 'Participant';
}

function readStatusTransitionFromPayload(payloadJson: unknown): string | null {
  if (payloadJson == null || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
    return null;
  }
  const record = payloadJson as Record<string, unknown>;
  const fromStatus = typeof record.fromStatus === 'string' ? record.fromStatus : null;
  const targetStatus = typeof record.targetStatus === 'string' ? record.targetStatus : null;
  if (fromStatus == null || targetStatus == null) {
    return null;
  }
  return `${fromStatus} → ${targetStatus}`;
}

function mapStatusEventToTimelineItem(event: VionaRequestStatusEvent): VionaRequestActivityTimelineItem {
  const fromLabel =
    event.fromStatus != null ? normalizeStatusLabel(event.fromStatus) : '—';
  const toLabel = normalizeStatusLabel(event.toStatus);
  const summary = `${fromLabel} → ${toLabel}`;
  return {
    id: `status-event:${event.id}`,
    kind: 'status',
    label: 'Status',
    actorLabel: 'Updated',
    timestampLabel: formatActivityTimestamp(event.createdAt),
    summary,
    detail: event.reason?.trim() ? event.reason.trim() : null,
    sortAt: Date.parse(event.createdAt),
  };
}

function mapAuditEventToTimelineItem(event: VionaRequestAuditEvent): VionaRequestActivityTimelineItem {
  const transition = readStatusTransitionFromPayload(event.payloadJson);
  const activityLabel = normalizeActivityLabel(event.eventType);
  const isStatusAction = activityLabel === 'Status';
  const summary =
    isStatusAction && transition != null
      ? transition
          .split(' → ')
          .map((part) => normalizeStatusLabel(part))
          .join(' → ')
      : event.message?.trim()
        ? event.message.trim()
        : event.eventType;

  return {
    id: `audit-event:${event.id}`,
    kind: 'activity',
    label: activityLabel === 'Note' ? 'Note' : activityLabel,
    actorLabel: resolveAuditActorLabel(event),
    timestampLabel: formatActivityTimestamp(event.createdAt),
    summary,
    detail:
      isStatusAction && event.message?.trim() && event.message.trim() !== summary
        ? event.message.trim()
        : null,
    sortAt: Date.parse(event.createdAt),
  };
}

/** Merges GET detail status + audit rows into one read-only timeline (no writes). */
export function buildReadOnlyTimelineItems(
  statusEvents: readonly VionaRequestStatusEvent[],
  auditEvents: readonly VionaRequestAuditEvent[]
): readonly VionaRequestActivityTimelineItem[] {
  const safeStatusEvents = statusEvents ?? [];
  const safeAuditEvents = auditEvents ?? [];
  const nonNoteAudits = filterNonNoteAuditEvents(safeAuditEvents);
  const noteItems = mapVionaRequestNoteAuditTimelineItems(safeAuditEvents).map(
    (note) =>
      ({
        id: `note-audit:${note.id}`,
        kind: 'activity' as const,
        label: 'Note' as const,
        actorLabel: note.actorLabel,
        timestampLabel: note.timestampLabel,
        summary: note.noteText,
        detail: note.usedFallback ? 'Read-only preview' : null,
        sortAt: Date.parse(
          safeAuditEvents.find((event) => event.id === note.id)?.createdAt ?? ''
        ),
      }) satisfies VionaRequestActivityTimelineItem
  );

  const items: VionaRequestActivityTimelineItem[] = [
    ...safeStatusEvents.map(mapStatusEventToTimelineItem),
    ...nonNoteAudits.map(mapAuditEventToTimelineItem),
    ...noteItems,
  ];

  return items.sort((a, b) => {
    const aSort = Number.isNaN(a.sortAt) ? 0 : a.sortAt;
    const bSort = Number.isNaN(b.sortAt) ? 0 : b.sortAt;
    if (aSort !== bSort) {
      return aSort - bSort;
    }
    return a.id.localeCompare(b.id);
  });
}

export function formatVionaRequestUpdatedLabel(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }
  return formatActivityTimestamp(iso);
}
