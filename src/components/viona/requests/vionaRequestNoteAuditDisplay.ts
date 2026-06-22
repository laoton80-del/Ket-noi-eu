import type { VionaRequestAuditEvent } from '../../../services/vionaRequestApi';

export const VIONA_REQUEST_NOTE_AUDIT_EVENT_TYPE = 'action.note';

export const VIONA_REQUEST_NOTE_DISPLAY_MAX_LENGTH = 4000;

const UNSAFE_NOTE_SUBSTRINGS = ['http://', 'https://'] as const;

export type VionaRequestNoteAuditTimelineItem = Readonly<{
  id: string;
  label: 'Note';
  actorLabel: string;
  timestampLabel: string;
  noteText: string;
  usedFallback: boolean;
}>;

function readSafeNoteFromPayload(payloadJson: unknown): string | null {
  if (payloadJson == null || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
    return null;
  }
  const raw = (payloadJson as Record<string, unknown>).note;
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > VIONA_REQUEST_NOTE_DISPLAY_MAX_LENGTH) {
    return null;
  }
  const normalized = trimmed.toLowerCase();
  if (UNSAFE_NOTE_SUBSTRINGS.some((fragment) => normalized.includes(fragment))) {
    return null;
  }
  return trimmed;
}

function formatNoteAuditTimestamp(iso: string): string {
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

function resolveActorLabel(event: VionaRequestAuditEvent): string {
  const role = event.actorRoleLabel?.trim();
  if (role != null && role.length > 0) {
    return role;
  }
  return 'Participant';
}

/** Maps Pack16 detail `auditEvents` into safe read-only note timeline rows (GET data only). */
export function mapVionaRequestNoteAuditTimelineItems(
  auditEvents: readonly VionaRequestAuditEvent[]
): readonly VionaRequestNoteAuditTimelineItem[] {
  const noteEvents = auditEvents.filter(
    (event) => event.eventType === VIONA_REQUEST_NOTE_AUDIT_EVENT_TYPE
  );

  return [...noteEvents]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((event) => {
      const safeNote = readSafeNoteFromPayload(event.payloadJson);
      return {
        id: event.id,
        label: 'Note' as const,
        actorLabel: resolveActorLabel(event),
        timestampLabel: formatNoteAuditTimestamp(event.createdAt),
        noteText: safeNote ?? 'Note recorded (read-only preview).',
        usedFallback: safeNote == null,
      };
    });
}

export function filterNonNoteAuditEvents(
  auditEvents: readonly VionaRequestAuditEvent[]
): readonly VionaRequestAuditEvent[] {
  return auditEvents.filter((event) => event.eventType !== VIONA_REQUEST_NOTE_AUDIT_EVENT_TYPE);
}
