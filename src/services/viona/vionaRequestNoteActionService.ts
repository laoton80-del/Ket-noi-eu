import { Prisma, type Prisma as PrismaTypes } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { buildAuthorizedVionaRequestNoteWhere } from './vionaRequestNoteAccessScope';
import type {
  AppendVionaRequestNoteInput,
  AppendVionaRequestNoteResult,
} from './vionaRequestNoteActionDto';
import { VIONA_REQUEST_NOTE_ACTION_SAFETY } from './vionaRequestNoteActionDto';
import {
  resolveVionaRequestNotePrincipalContext,
  type ResolveVionaRequestNotePrincipalContextDeps,
} from './vionaRequestNotePrincipalContext';
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
} as const satisfies PrismaTypes.VionaRequestSelect;

type RequestScopeRow = PrismaTypes.VionaRequestGetPayload<{
  select: typeof REQUEST_SCOPE_SELECT;
}>;

type NoteMutationPrisma = Pick<
  ReturnType<typeof getPrisma>,
  'vionaRequest' | 'vionaRequestAuditEvent' | 'merchantProfile'
>;

export type AppendVionaRequestNoteDeps = Readonly<
  ResolveVionaRequestNotePrincipalContextDeps & {
    prisma?: NoteMutationPrisma &
      Pick<ReturnType<typeof getPrisma>, '$transaction'>;
  }
>;

type NoteTxClient = NoteMutationPrisma;

type NoteTxResult =
  | Readonly<{ kind: 'denied' }>
  | Readonly<{ kind: 'replay'; auditEventId: string }>
  | Readonly<{ kind: 'created'; auditEventId: string }>;

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
}): PrismaTypes.InputJsonValue {
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
  prisma: Pick<NoteTxClient, 'vionaRequestAuditEvent'>,
  requestId: string,
  idempotencyKey: string
): Promise<{ id: string } | null> {
  return prisma.vionaRequestAuditEvent.findFirst({
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

async function executeAuthorizedNoteMutation(
  tx: NoteTxClient,
  input: Readonly<{
    authUserId: string;
    requestId: string;
    note: string;
    idempotencyKey?: string;
    clientCorrelationId?: string;
  }>,
  deps: ResolveVionaRequestNotePrincipalContextDeps,
): Promise<NoteTxResult> {
  const principal = await resolveVionaRequestNotePrincipalContext(
    input.authUserId,
    tx,
    deps,
  );
  const authorizedWhere = buildAuthorizedVionaRequestNoteWhere(principal);

  const requestRow = await tx.vionaRequest.findFirst({
    where: {
      id: input.requestId,
      ...authorizedWhere,
    },
    select: REQUEST_SCOPE_SELECT,
  });

  if (requestRow == null) {
    return { kind: 'denied' };
  }

  if (input.idempotencyKey != null) {
    const existing = await findIdempotentNoteAuditEvent(
      tx,
      input.requestId,
      input.idempotencyKey,
    );
    if (existing != null) {
      return { kind: 'replay', auditEventId: existing.id };
    }
  }

  const payloadJson = buildNotePayloadJson({
    note: input.note,
    idempotencyKey: input.idempotencyKey,
    clientCorrelationId: input.clientCorrelationId,
  });

  const auditEvent = await tx.vionaRequestAuditEvent.create({
    data: {
      requestId: input.requestId,
      eventType: VIONA_REQUEST_NOTE_EVENT_TYPE,
      actorUserId: input.authUserId,
      actorRoleLabel: resolveActorRoleLabel(requestRow, input.authUserId),
      message: 'Request note appended.',
      payloadJson,
    },
    select: { id: true },
  });

  return { kind: 'created', auditEventId: auditEvent.id };
}

/**
 * Append a note audit event to an authorized Viona request.
 * Does not change request status, assignment, or payment/booking/SOS/wallet/live AI state.
 */
export async function appendVionaRequestNote(
  input: AppendVionaRequestNoteInput,
  deps: AppendVionaRequestNoteDeps = {},
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

  const prisma = deps.prisma ?? getPrisma();

  const txResult = await prisma.$transaction(
    async (tx) =>
      executeAuthorizedNoteMutation(
        tx,
        {
          authUserId,
          requestId,
          note,
          idempotencyKey,
          clientCorrelationId,
        },
        deps,
      ),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  if (txResult.kind === 'denied') {
    return { ok: false, reason: 'request_not_found' };
  }

  const detail = await getVionaRequestById({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  return {
    ok: true,
    data: detail.data,
    action: {
      auditEventId: txResult.auditEventId,
      eventType: 'action.note',
      idempotentReplay: txResult.kind === 'replay',
    },
    safety: VIONA_REQUEST_NOTE_ACTION_SAFETY,
  };
}
