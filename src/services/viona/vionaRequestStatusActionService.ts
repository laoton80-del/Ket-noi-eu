import type { Prisma } from '@prisma/client';

import { canTransitionRequestStatus } from '../../domain/requests/vionaRequestStatusMachine';
import {
  vionaRequestStatuses,
  type VionaRequestStatus,
} from '../../domain/requests/vionaRequestTypes';
import { getPrisma } from '../../lib/prisma';
import { buildAuthorizedVionaRequestWhere } from './vionaRequestAccessScope';
import type {
  TransitionVionaRequestStatusInput,
  TransitionVionaRequestStatusResult,
} from './vionaRequestStatusActionDto';
import {
  VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION,
  VIONA_REQUEST_STATUS_ACTION_SAFETY,
} from './vionaRequestStatusActionDto';
import { getVionaRequestById } from './vionaRequestReadService';

export const VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE = 'action.status';
export const VIONA_REQUEST_STATUS_REASON_MAX_LENGTH = 500;
export const VIONA_REQUEST_STATUS_NOTE_MAX_LENGTH = 4000;
export const VIONA_REQUEST_STATUS_IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const VIONA_REQUEST_STATUS_CORRELATION_ID_MAX_LENGTH = 128;

const UNSAFE_CONTENT_SUBSTRINGS = [
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
  status: true,
  requesterUserId: true,
  ownerUserId: true,
} as const satisfies Prisma.VionaRequestSelect;

type RequestScopeRow = Prisma.VionaRequestGetPayload<{
  select: typeof REQUEST_SCOPE_SELECT;
}>;

function isVionaRequestStatus(value: string): value is VionaRequestStatus {
  return (vionaRequestStatuses as readonly string[]).includes(value);
}

function normalizeOptionalKey(value: string | undefined, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  return trimmed;
}

function containsUnsafeContent(value: string): boolean {
  const normalized = value.toLowerCase();
  return UNSAFE_CONTENT_SUBSTRINGS.some((fragment) => normalized.includes(fragment));
}

function validateOptionalText(
  value: string | undefined,
  maxLength: number
): { ok: true; value?: string } | { ok: false; reason: 'invalid_input' | 'unsafe_content' } {
  if (value == null) {
    return { ok: true };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return { ok: false, reason: 'invalid_input' };
  }
  if (containsUnsafeContent(trimmed)) {
    return { ok: false, reason: 'unsafe_content' };
  }
  return { ok: true, value: trimmed };
}

function buildStatusPayloadJson(input: {
  targetStatus: string;
  fromStatus: string;
  reason?: string;
  note?: string;
  idempotencyKey?: string;
  clientCorrelationId?: string;
}): Prisma.InputJsonValue {
  const payload: Record<string, string> = {
    targetStatus: input.targetStatus,
    fromStatus: input.fromStatus,
  };
  if (input.reason != null) payload.reason = input.reason;
  if (input.note != null) payload.note = input.note;
  if (input.idempotencyKey != null) payload.idempotencyKey = input.idempotencyKey;
  if (input.clientCorrelationId != null) payload.clientCorrelationId = input.clientCorrelationId;
  return payload;
}

async function findIdempotentStatusAuditEvent(
  requestId: string,
  idempotencyKey: string,
  targetStatus: string
): Promise<{ id: string; statusEventId: string | null; fromStatus?: string } | null> {
  const existing = await getPrisma().vionaRequestAuditEvent.findFirst({
    where: {
      requestId,
      eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
      payloadJson: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
    select: { id: true, payloadJson: true },
  });

  if (existing == null) {
    return null;
  }

  const payload = existing.payloadJson;
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.targetStatus !== targetStatus) {
    return null;
  }

  const statusEventId =
    typeof record.statusEventId === 'string' && record.statusEventId.length > 0
      ? record.statusEventId
      : null;

  const fromStatus =
    typeof record.fromStatus === 'string' && record.fromStatus.length > 0
      ? record.fromStatus
      : undefined;

  return { id: existing.id, statusEventId, fromStatus };
}

function isPack25AllowedTransition(fromStatus: string, toStatus: string): boolean {
  return (
    fromStatus === VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.from &&
    toStatus === VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.to
  );
}

function isOwnerActor(row: RequestScopeRow, authUserId: string): boolean {
  return row.ownerUserId === authUserId;
}

/**
 * Transition an authorized Viona request status (Pack25 narrow: owner-only submitted → triage).
 * Creates mandatory status + audit events in one transaction.
 */
export async function transitionVionaRequestStatus(
  input: TransitionVionaRequestStatusInput
): Promise<TransitionVionaRequestStatusResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const rawTargetStatus = input.targetStatus.trim();

  const idempotencyKey = normalizeOptionalKey(
    input.idempotencyKey,
    VIONA_REQUEST_STATUS_IDEMPOTENCY_KEY_MAX_LENGTH
  );
  const clientCorrelationId = normalizeOptionalKey(
    input.clientCorrelationId,
    VIONA_REQUEST_STATUS_CORRELATION_ID_MAX_LENGTH
  );

  if (authUserId.length === 0 || requestId.length === 0 || rawTargetStatus.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (!isVionaRequestStatus(rawTargetStatus)) {
    return { ok: false, reason: 'invalid_input' };
  }

  const targetStatus = rawTargetStatus;

  if (input.idempotencyKey != null && idempotencyKey == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  if (input.clientCorrelationId != null && clientCorrelationId == null) {
    return { ok: false, reason: 'invalid_input' };
  }

  const reasonResult = validateOptionalText(input.reason, VIONA_REQUEST_STATUS_REASON_MAX_LENGTH);
  if (!reasonResult.ok) {
    return { ok: false, reason: reasonResult.reason };
  }

  const noteResult = validateOptionalText(input.note, VIONA_REQUEST_STATUS_NOTE_MAX_LENGTH);
  if (!noteResult.ok) {
    return { ok: false, reason: noteResult.reason };
  }

  const requestRow = await getPrisma().vionaRequest.findFirst({
    where: {
      id: requestId,
      ...buildAuthorizedVionaRequestWhere(authUserId),
    },
    select: REQUEST_SCOPE_SELECT,
  });

  if (requestRow == null || !isOwnerActor(requestRow, authUserId)) {
    return { ok: false, reason: 'request_not_found' };
  }

  const fromStatus = requestRow.status;

  if (!isVionaRequestStatus(fromStatus)) {
    return { ok: false, reason: 'invalid_transition' };
  }

  if (idempotencyKey != null) {
    const existing = await findIdempotentStatusAuditEvent(
      requestId,
      idempotencyKey,
      targetStatus
    );
    if (existing != null) {
      const detail = await getVionaRequestById({ authUserId, requestId });
      if (!detail.ok) {
        return { ok: false, reason: 'request_not_found' };
      }
      return {
        ok: true,
        data: detail.data,
        action: {
          statusEventId: existing.statusEventId ?? existing.id,
          auditEventId: existing.id,
          eventType: 'action.status',
          fromStatus: existing.fromStatus ?? fromStatus,
          toStatus: targetStatus,
          idempotentReplay: true,
        },
        safety: VIONA_REQUEST_STATUS_ACTION_SAFETY,
      };
    }

    const existingAudit = await getPrisma().vionaRequestAuditEvent.findFirst({
      where: {
        requestId,
        eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
        payloadJson: {
          path: ['idempotencyKey'],
          equals: idempotencyKey,
        },
      },
      select: { id: true },
    });

    if (existingAudit != null) {
      return { ok: false, reason: 'invalid_input' };
    }
  }

  if (!isPack25AllowedTransition(fromStatus, targetStatus)) {
    return { ok: false, reason: 'invalid_transition' };
  }

  if (!canTransitionRequestStatus(fromStatus, targetStatus)) {
    return { ok: false, reason: 'invalid_transition' };
  }

  const reason = reasonResult.value;
  const note = noteResult.value;
  const payloadJson = buildStatusPayloadJson({
    targetStatus,
    fromStatus,
    reason,
    note,
    idempotencyKey,
    clientCorrelationId,
  });

  const transition = await getPrisma().$transaction(async (tx) => {
    const updated = await tx.vionaRequest.updateMany({
      where: {
        id: requestId,
        status: fromStatus,
        ownerUserId: authUserId,
      },
      data: { status: targetStatus },
    });

    if (updated.count !== 1) {
      return null;
    }

    const statusEvent = await tx.vionaRequestStatusEvent.create({
      data: {
        requestId,
        fromStatus,
        toStatus: targetStatus,
        changedByUserId: authUserId,
        reason: reason ?? 'Status transition (preview only).',
      },
      select: { id: true },
    });

    const auditPayload: Prisma.InputJsonValue = {
      ...(payloadJson as Record<string, string>),
      statusEventId: statusEvent.id,
    };

    const auditEvent = await tx.vionaRequestAuditEvent.create({
      data: {
        requestId,
        eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
        actorUserId: authUserId,
        actorRoleLabel: 'owner',
        message: 'Request status transitioned.',
        payloadJson: auditPayload,
      },
      select: { id: true },
    });

    return { statusEvent, auditEvent };
  });

  if (transition == null) {
    return { ok: false, reason: 'invalid_transition' };
  }

  const detail = await getVionaRequestById({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  return {
    ok: true,
    data: detail.data,
    action: {
      statusEventId: transition.statusEvent.id,
      auditEventId: transition.auditEvent.id,
      eventType: 'action.status',
      fromStatus,
      toStatus: targetStatus,
      idempotentReplay: false,
    },
    safety: VIONA_REQUEST_STATUS_ACTION_SAFETY,
  };
}
