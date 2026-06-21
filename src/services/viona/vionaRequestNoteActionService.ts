import type { Prisma } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { buildAuthorizedVionaRequestWhere } from './vionaRequestAccessScope';
import type {
  AppendVionaRequestNoteInput,
  AppendVionaRequestNoteResult,
} from './vionaRequestNoteActionDto';
import { VIONA_REQUEST_NOTE_ACTION_SAFETY } from './vionaRequestNoteActionDto';
import { getVionaRequestById } from './vionaRequestReadService';

export const VIONA_REQUEST_NOTE_EVENT_TYPE = 'action.note';
export const VIONA_REQUEST_NOTE_MAX_LENGTH = 4000;
export const VIONA_REQUEST_NOTE_IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const VIONA_REQUEST_NOTE_CORRELATION_ID_MAX_LENGTH = 128;

const UNSAFE_NOTE_SUBSTRINGS = [
  'http://',
  'https://',
  'bearer ',
  'password',
  'secret',
  'api_key',
  'apikey',
] as const;

const REQUEST_SCOPE_SELECT = {
  id: true,
  requesterUserId: true,
  ownerUserId: true,
  participants: {
    select: {
      userRef: true,
      participantRoleLabel: true,
    },
  },
} as const satisfies Prisma.VionaRequestSelect;

type RequestScopeRow = Prisma.VionaRequestGetPayload<{
  select: typeof REQUEST_SCOPE_SELECT;
}>;

function resolveActorRoleLabel(row: RequestScopeRow, authUserId: string): string {
  if (row.requesterUserId === authUserId) {
    return 'requester';
  }
  if (row.ownerUserId === authUserId) {
    return 'owner';
  }
  const participant = row.participants.find((p) => p.userRef === authUserId);
  return participant?.participantRoleLabel?.trim() || 'participant';
}

function normalizeOptionalKey(value: string | undefined, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  return trimmed;
}

function noteContainsUnsafeContent(note: string): boolean {
  const normalized = note.toLowerCase();
  return UNSAFE_NOTE_SUBSTRINGS.some((fragment) => normalized.includes(fragment));
}

function validateNote(
  note: string
): { ok: true; value: string } | { ok: false; reason: 'invalid_input' | 'unsafe_note' } {
  const trimmed = note.trim();
  if (trimmed.length === 0 || trimmed.length > VIONA_REQUEST_NOTE_MAX_LENGTH) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (noteContainsUnsafeContent(trimmed)) {
    return { ok: false, reason: 'unsafe_note' };
  }
  return { ok: true, value: trimmed };
}

function buildNotePayloadJson(input: {
  note: string;
  idempotencyKey?: string;
  clientCorrelationId?: string;
}): Prisma.InputJsonValue {
  const payload: Record<string, string> = { note: input.note };
  if (input.idempotencyKey != null) {
    payload.idempotencyKey = input.idempotencyKey;
  }
  if (input.clientCorrelationId != null) {
    payload.clientCorrelationId = input.clientCorrelationId;
  }
  return payload;
}

async function findIdempotentNoteAuditEvent(
  requestId: string,
  idempotencyKey: string
): Promise<{ id: string } | null> {
  return getPrisma().vionaRequestAuditEvent.findFirst({
    where: {
      requestId,
      eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
      payloadJson: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
    select: { id: true },
  });
}

/**
 * Append a note audit event to an authorized Viona request.
 * Does not change request status, assignment, or payment/booking/SOS/wallet/live AI state.
 */
export async function appendVionaRequestNote(
  input: AppendVionaRequestNoteInput
): Promise<AppendVionaRequestNoteResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const noteResult = validateNote(input.note);

  const idempotencyKey = normalizeOptionalKey(
    input.idempotencyKey,
    VIONA_REQUEST_NOTE_IDEMPOTENCY_KEY_MAX_LENGTH
  );
  const clientCorrelationId = normalizeOptionalKey(
    input.clientCorrelationId,
    VIONA_REQUEST_NOTE_CORRELATION_ID_MAX_LENGTH
  );

  if (authUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (!noteResult.ok) {
    return { ok: false, reason: noteResult.reason };
  }

  const note = noteResult.value;

  if (input.idempotencyKey != null && idempotencyKey == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (input.clientCorrelationId != null && clientCorrelationId == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  const requestRow = await getPrisma().vionaRequest.findFirst({
    where: {
      id: requestId,
      ...buildAuthorizedVionaRequestWhere(authUserId),
    },
    select: REQUEST_SCOPE_SELECT,
  });

  if (requestRow == null) {
    return { ok: false, reason: 'request_not_found' };
  }

  if (idempotencyKey != null) {
    const existing = await findIdempotentNoteAuditEvent(requestId, idempotencyKey);
    if (existing != null) {
      const detail = await getVionaRequestById({ authUserId, requestId });
      if (!detail.ok) {
        return { ok: false, reason: 'request_not_found' };
      }
      return {
        ok: true,
        data: detail.data,
        action: {
          auditEventId: existing.id,
          eventType: 'action.note',
          idempotentReplay: true,
        },
        safety: VIONA_REQUEST_NOTE_ACTION_SAFETY,
      };
    }
  }

  const actorRoleLabel = resolveActorRoleLabel(requestRow, authUserId);
  const payloadJson = buildNotePayloadJson({
    note,
    idempotencyKey,
    clientCorrelationId,
  });

  const auditEvent = await getPrisma().vionaRequestAuditEvent.create({
    data: {
      requestId,
      eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
      actorUserId: authUserId,
      actorRoleLabel,
      message: 'Request note appended.',
      payloadJson,
    },
    select: { id: true },
  });

  const detail = await getVionaRequestById({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  return {
    ok: true,
    data: detail.data,
    action: {
      auditEventId: auditEvent.id,
      eventType: 'action.note',
      idempotentReplay: false,
    },
    safety: VIONA_REQUEST_NOTE_ACTION_SAFETY,
  };
}
