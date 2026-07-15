import { Prisma, type Prisma as PrismaTypes } from '@prisma/client';

import { canTransitionRequestStatus } from '../../domain/requests/vionaRequestStatusMachine';
import {
  vionaRequestStatuses,
  type VionaRequestStatus,
} from '../../domain/requests/vionaRequestTypes';
import { getPrisma } from '../../lib/prisma';
import { buildAuthorizedVionaRequestStatusWhere } from './vionaRequestStatusAccessScope';
import type {
  TransitionVionaRequestStatusInput,
  TransitionVionaRequestStatusResult,
} from './vionaRequestStatusActionDto';
import {
  VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION,
  VIONA_REQUEST_STATUS_ACTION_SAFETY,
} from './vionaRequestStatusActionDto';
import {
  resolveVionaRequestStatusPrincipalContext,
  type ResolveVionaRequestStatusPrincipalContextDeps,
} from './vionaRequestStatusPrincipalContext';
import { getVionaRequestById } from './vionaRequestReadService';
import { appendVionaExecutionAuditEvent } from './vionaExecutionAuditWriteService';
import type { AppendVionaExecutionAuditEventInput } from './vionaExecutionAuditWriteService';

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
} as const satisfies PrismaTypes.VionaRequestSelect;

type RequestScopeRow = PrismaTypes.VionaRequestGetPayload<{
  select: typeof REQUEST_SCOPE_SELECT;
}>;

type StatusMutationPrisma = Pick<
  ReturnType<typeof getPrisma>,
  'vionaRequest' | 'vionaRequestAuditEvent' | 'vionaRequestStatusEvent' | 'merchantProfile'
>;

export type TransitionVionaRequestStatusDeps = Readonly<
  ResolveVionaRequestStatusPrincipalContextDeps & {
    prisma?: StatusMutationPrisma & Pick<ReturnType<typeof getPrisma>, '$transaction'>;
    appendStateTransitionHook?: (
      input: AppendVionaExecutionAuditEventInput,
    ) => Promise<{ ok: boolean; error?: string }>;
  }
>;

type StatusTxClient = StatusMutationPrisma;

type IdempotentStatusAuditRow = Readonly<{
  id: string;
  actorUserId: string;
  statusEventId: string | null;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
  note?: string;
}>;

type StatusTxResult =
  | Readonly<{ kind: 'denied' }>
  | Readonly<{
      kind: 'replay';
      statusEventId: string;
      auditEventId: string;
      fromStatus: string;
    }>
  | Readonly<{
      kind: 'created';
      statusEventId: string;
      auditEventId: string;
      fromStatus: string;
    }>
  | Readonly<{ kind: 'invalid_transition' }>
  | Readonly<{ kind: 'invalid_input' }>;

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
  maxLength: number,
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
}): PrismaTypes.InputJsonValue {
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

export type BuildVionaStateTransitionAuditEventInput = Readonly<{
  requestId: string;
  fromStatus: string;
  toStatus: string;
  actorUserId: string;
  actorRoleLabel: string;
  statusEventId: string;
  idempotencyKey?: string;
  clientCorrelationId?: string;
}>;

/**
 * Pack30D-2 — pure builder for the durable `stateTransition` audit-hook event fired by the
 * request status state machine on every *committed* status transition. No DB access; fully
 * unit-testable in isolation, mirroring the Pack30D-1 `buildVionaExecutionAuditPayload` pattern
 * in `vionaExecutionPlanRouteService.ts`. This hook is separate from, and additional to, the
 * existing, unmodified Pack25 `action.status` audit row written inside the same transaction —
 * it does not replace or alter that row.
 */
export function buildVionaStateTransitionAuditEventInput(
  input: BuildVionaStateTransitionAuditEventInput,
): AppendVionaExecutionAuditEventInput {
  return {
    requestId: input.requestId,
    eventType: 'stateTransition',
    actorUserId: input.actorUserId,
    actorRoleLabel: input.actorRoleLabel,
    message: 'Request status state machine transition hook fired (mock-only, no real execution).',
    payloadJson: {
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      statusEventId: input.statusEventId,
      idempotencyKey: input.idempotencyKey ?? null,
      clientCorrelationId: input.clientCorrelationId ?? null,
    },
  };
}

function parseIdempotentStatusAuditPayload(
  payload: unknown,
  targetStatus: string,
): Omit<IdempotentStatusAuditRow, 'id' | 'actorUserId'> | null {
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

  const toStatus =
    typeof record.toStatus === 'string' && record.toStatus.length > 0
      ? record.toStatus
      : undefined;

  const reason = typeof record.reason === 'string' ? record.reason : undefined;
  const note = typeof record.note === 'string' ? record.note : undefined;

  return { statusEventId, fromStatus, toStatus, reason, note };
}

async function findIdempotentStatusAuditEvent(
  prisma: Pick<StatusTxClient, 'vionaRequestAuditEvent'>,
  requestId: string,
  idempotencyKey: string,
  targetStatus: string,
): Promise<IdempotentStatusAuditRow | null> {
  const existing = await prisma.vionaRequestAuditEvent.findFirst({
    where: {
      requestId,
      eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
      payloadJson: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
    select: { id: true, actorUserId: true, payloadJson: true },
  });

  if (existing == null) {
    return null;
  }

  const parsed = parseIdempotentStatusAuditPayload(existing.payloadJson, targetStatus);
  if (parsed == null) {
    return null;
  }

  if (existing.actorUserId == null || existing.actorUserId.trim().length === 0) {
    return null;
  }

  return {
    id: existing.id,
    actorUserId: existing.actorUserId,
    ...parsed,
  };
}

function statusPayloadMatchesReplay(
  existing: IdempotentStatusAuditRow,
  input: Readonly<{
    authUserId: string;
    reason?: string;
    note?: string;
  }>,
): boolean {
  if (existing.actorUserId !== input.authUserId) {
    return false;
  }
  if (existing.reason !== input.reason) {
    return false;
  }
  if (existing.note !== input.note) {
    return false;
  }
  return true;
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

async function executeAuthorizedStatusTransition(
  tx: StatusTxClient,
  input: Readonly<{
    authUserId: string;
    requestId: string;
    targetStatus: VionaRequestStatus;
    reason?: string;
    note?: string;
    idempotencyKey?: string;
    clientCorrelationId?: string;
  }>,
  deps: ResolveVionaRequestStatusPrincipalContextDeps,
): Promise<StatusTxResult> {
  const principal = await resolveVionaRequestStatusPrincipalContext(
    input.authUserId,
    tx,
    deps,
  );
  const authorizedWhere = buildAuthorizedVionaRequestStatusWhere(principal);

  const requestRow = await tx.vionaRequest.findFirst({
    where: {
      id: input.requestId,
      ...authorizedWhere,
    },
    select: REQUEST_SCOPE_SELECT,
  });

  if (requestRow == null || !isOwnerActor(requestRow, input.authUserId)) {
    return { kind: 'denied' };
  }

  const currentStatus = requestRow.status;
  if (!isVionaRequestStatus(currentStatus)) {
    return { kind: 'invalid_transition' };
  }

  if (input.idempotencyKey != null) {
    const existing = await findIdempotentStatusAuditEvent(
      tx,
      input.requestId,
      input.idempotencyKey,
      input.targetStatus,
    );

    if (existing != null) {
      if (!statusPayloadMatchesReplay(existing, input)) {
        return { kind: 'invalid_input' };
      }

      const recordedFrom =
        existing.fromStatus ?? VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.from;
      const recordedTo = existing.toStatus ?? input.targetStatus;

      if (
        !isPack25AllowedTransition(recordedFrom, recordedTo) ||
        recordedTo !== input.targetStatus
      ) {
        return { kind: 'invalid_transition' };
      }

      if (currentStatus !== input.targetStatus) {
        return { kind: 'invalid_transition' };
      }

      return {
        kind: 'replay',
        statusEventId: existing.statusEventId ?? existing.id,
        auditEventId: existing.id,
        fromStatus: recordedFrom,
      };
    }

    const existingAudit = await tx.vionaRequestAuditEvent.findFirst({
      where: {
        requestId: input.requestId,
        eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
        payloadJson: {
          path: ['idempotencyKey'],
          equals: input.idempotencyKey,
        },
      },
      select: { id: true },
    });

    if (existingAudit != null) {
      return { kind: 'invalid_input' };
    }
  }

  if (!isPack25AllowedTransition(currentStatus, input.targetStatus)) {
    return { kind: 'invalid_transition' };
  }

  if (!canTransitionRequestStatus(currentStatus, input.targetStatus)) {
    return { kind: 'invalid_transition' };
  }

  const fromStatus = currentStatus;
  const payloadJson = buildStatusPayloadJson({
    targetStatus: input.targetStatus,
    fromStatus,
    reason: input.reason,
    note: input.note,
    idempotencyKey: input.idempotencyKey,
    clientCorrelationId: input.clientCorrelationId,
  });

  const updated = await tx.vionaRequest.updateMany({
    where: {
      id: input.requestId,
      status: fromStatus,
      ...authorizedWhere,
    },
    data: { status: input.targetStatus },
  });

  if (updated.count !== 1) {
    return { kind: 'invalid_transition' };
  }

  const statusEvent = await tx.vionaRequestStatusEvent.create({
    data: {
      requestId: input.requestId,
      fromStatus,
      toStatus: input.targetStatus,
      changedByUserId: input.authUserId,
      reason: input.reason ?? 'Status transition (preview only).',
    },
    select: { id: true },
  });

  const auditPayload: PrismaTypes.InputJsonValue = {
    ...(payloadJson as Record<string, string>),
    statusEventId: statusEvent.id,
  };

  const auditEvent = await tx.vionaRequestAuditEvent.create({
    data: {
      requestId: input.requestId,
      eventType: VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
      actorUserId: input.authUserId,
      actorRoleLabel: 'owner',
      message: 'Request status transitioned.',
      payloadJson: auditPayload,
    },
    select: { id: true },
  });

  return {
    kind: 'created',
    statusEventId: statusEvent.id,
    auditEventId: auditEvent.id,
    fromStatus,
  };
}

/**
 * Transition an authorized Viona request status (Pack25 narrow: owner-only submitted → triage).
 * Pack40C — provenance-aware owner-only DB predicate, Serializable transaction, auth before replay.
 */
export async function transitionVionaRequestStatus(
  input: TransitionVionaRequestStatusInput,
  deps: TransitionVionaRequestStatusDeps = {},
): Promise<TransitionVionaRequestStatusResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const rawTargetStatus = input.targetStatus.trim();

  const idempotencyKey = normalizeOptionalKey(
    input.idempotencyKey,
    VIONA_REQUEST_STATUS_IDEMPOTENCY_KEY_MAX_LENGTH,
  );
  const clientCorrelationId = normalizeOptionalKey(
    input.clientCorrelationId,
    VIONA_REQUEST_STATUS_CORRELATION_ID_MAX_LENGTH,
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

  const reason = reasonResult.value;
  const note = noteResult.value;

  const prisma = deps.prisma ?? getPrisma();

  let txResult: StatusTxResult;
  try {
    txResult = await prisma.$transaction(
      async (tx) =>
        executeAuthorizedStatusTransition(
          tx,
          {
            authUserId,
            requestId,
            targetStatus,
            reason,
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
  } catch {
    return { ok: false, reason: 'invalid_transition' };
  }

  if (txResult.kind === 'denied') {
    return { ok: false, reason: 'request_not_found' };
  }

  if (txResult.kind === 'invalid_input') {
    return { ok: false, reason: 'invalid_input' };
  }

  if (txResult.kind === 'invalid_transition') {
    return { ok: false, reason: 'invalid_transition' };
  }

  if (txResult.kind === 'created') {
    const appendHook =
      deps.appendStateTransitionHook ??
      (async (hookInput: AppendVionaExecutionAuditEventInput) =>
        appendVionaExecutionAuditEvent(hookInput));

    const auditHookResult = await appendHook(
      buildVionaStateTransitionAuditEventInput({
        requestId,
        fromStatus: txResult.fromStatus,
        toStatus: targetStatus,
        actorUserId: authUserId,
        actorRoleLabel: 'owner',
        statusEventId: txResult.statusEventId,
        idempotencyKey,
        clientCorrelationId,
      }),
    );

    if (!auditHookResult.ok) {
      console.error(
        `[pack30d2-state-machine-audit-hook] failed to append stateTransition audit event for request ${requestId}: ${auditHookResult.error ?? 'unknown error'}`,
      );
    }
  }

  const detail = await getVionaRequestById({ authUserId, requestId });
  if (!detail.ok) {
    return { ok: false, reason: 'request_not_found' };
  }

  return {
    ok: true,
    data: detail.data,
    action: {
      statusEventId: txResult.statusEventId,
      auditEventId: txResult.auditEventId,
      eventType: 'action.status',
      fromStatus: txResult.fromStatus,
      toStatus: targetStatus,
      idempotentReplay: txResult.kind === 'replay',
    },
    safety: VIONA_REQUEST_STATUS_ACTION_SAFETY,
  };
}
