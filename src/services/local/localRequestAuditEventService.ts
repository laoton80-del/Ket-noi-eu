import {
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  Prisma,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

/** Prisma client or transaction scope for audit writes (lifecycle $transaction). */
export type LocalRequestAuditDb = Pick<
  Prisma.TransactionClient,
  'localServiceRequest' | 'localServiceRequestAuditEvent'
>;

/** Keys that must never appear in audit `metadataJson` (PII / secrets). */
export const UNSAFE_LOCAL_REQUEST_AUDIT_METADATA_KEYS = [
  'email',
  'phone',
  'phoneNumber',
  'password',
  'token',
  'secret',
  'rawMetadata',
] as const;

/** Substrings that must not appear in `safeMessage` (payment implication). */
const UNSAFE_SAFE_MESSAGE_SUBSTRINGS = [
  'payment captured',
  'payment received',
  'refunded',
  'refund',
  'escrow released',
  'vio credits returned',
  'debited',
  'settled',
  'hold released',
] as const;

export const LOCAL_REQUEST_AUDIT_V1_WALLET_MODE = LocalWalletMode.REQUEST_ONLY_NO_CHARGE;
export const LOCAL_REQUEST_AUDIT_V1_WALLET_PHASE = LocalWalletPhase.NONE;

export type CreateLocalRequestAuditEventInput = Readonly<{
  requestId: string;
  eventType: LocalServiceRequestAuditEventType;
  actorType: LocalServiceRequestAuditActorType;
  actorUserId?: string | null;
  businessId?: string | null;
  fromStatus?: LocalServiceRequestStatus | null;
  toStatus?: LocalServiceRequestStatus | null;
  reason?: string | null;
  safeMessage?: string | null;
  metadataJson?: Prisma.InputJsonValue | Record<string, unknown> | null;
  idempotencyKey?: string | null;
  runId?: string | null;
  db?: LocalRequestAuditDb;
}>;

export type CreateLocalRequestAuditEventFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'unsafe_metadata'
  | 'unsafe_safe_message';

export type CreateLocalRequestAuditEventResult =
  | Readonly<{
      ok: true;
      event: Readonly<{
        id: string;
        requestId: string;
        eventType: LocalServiceRequestAuditEventType;
        actorType: LocalServiceRequestAuditActorType;
        noWalletAction: boolean;
        walletModeSnapshot: LocalWalletMode | null;
        walletPhaseSnapshot: LocalWalletPhase | null;
        requestOnlyNoChargeSnapshot: boolean;
      }>;
    }>
  | Readonly<{ ok: false; reason: CreateLocalRequestAuditEventFailure }>;

/**
 * Idempotency dedup via unique `idempotencyKey` is future hardening (AUDIT_RUNTIME_2+);
 * this pack stores the key but does not enforce uniqueness at the DB layer.
 */
export function buildRequestAuditSafeMessage(
  eventType: LocalServiceRequestAuditEventType
): string {
  switch (eventType) {
    case LocalServiceRequestAuditEventType.REQUEST_CREATED:
      return 'Request submitted.';
    case LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED:
      return 'Merchant confirmed your request. No payment has been captured.';
    case LocalServiceRequestAuditEventType.MERCHANT_REJECTED:
      return 'Merchant rejected your request. No payment was captured.';
    case LocalServiceRequestAuditEventType.USER_CANCELLED:
      return 'Request cancelled. No payment was captured.';
    case LocalServiceRequestAuditEventType.OPS_CANCELLED:
      return 'Request cancelled by ops. No payment was captured.';
    case LocalServiceRequestAuditEventType.REQUEST_EXPIRED:
      return 'Request expired because the merchant did not respond in time. No payment was captured.';
    default:
      return 'Local request lifecycle event recorded.';
  }
}

function findUnsafeMetadataKeys(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value !== 'object' || Array.isArray(value)) return [];

  const unsafe = new Set<string>(UNSAFE_LOCAL_REQUEST_AUDIT_METADATA_KEYS);
  const hits: string[] = [];

  const walk = (node: Record<string, unknown>, prefix: string): void => {
    for (const [key, child] of Object.entries(node)) {
      const childPath = prefix ? `${prefix}.${key}` : key;
      if (unsafe.has(key)) {
        hits.push(childPath);
      }
      if (child != null && typeof child === 'object' && !Array.isArray(child)) {
        walk(child as Record<string, unknown>, childPath);
      }
    }
  };

  walk(value as Record<string, unknown>, '');
  return hits;
}

function safeMessageImpliesPayment(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (normalized.length === 0) return false;
  if (
    normalized.includes('no payment has been captured') ||
    normalized.includes('no payment was captured')
  ) {
    return false;
  }
  return UNSAFE_SAFE_MESSAGE_SUBSTRINGS.some((s) => normalized.includes(s));
}

/**
 * Append-only Local request audit writer — creates `LocalServiceRequestAuditEvent` only.
 * Does not mutate `LocalServiceRequest`, Wallet, Transaction, Booking, or TourismBooking.
 */
export async function createLocalRequestAuditEvent(
  input: CreateLocalRequestAuditEventInput
): Promise<CreateLocalRequestAuditEventResult> {
  const requestId = input.requestId.trim();
  if (requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const unsafeKeys = findUnsafeMetadataKeys(input.metadataJson ?? null);
  if (unsafeKeys.length > 0) {
    return { ok: false, reason: 'unsafe_metadata' };
  }

  const safeMessage =
    input.safeMessage?.trim() ??
    (input.safeMessage === undefined || input.safeMessage === null
      ? undefined
      : '');
  if (safeMessage !== undefined) {
    if (safeMessage.length === 0) {
      return { ok: false, reason: 'invalid_input' };
    }
    if (safeMessageImpliesPayment(safeMessage)) {
      return { ok: false, reason: 'unsafe_safe_message' };
    }
  }

  const prisma = input.db ?? getPrisma();
  const request = await prisma.localServiceRequest.findUnique({
    where: { id: requestId },
    select: { id: true },
  });
  if (!request) {
    return { ok: false, reason: 'request_not_found' };
  }

  const metadataJson =
    input.metadataJson === undefined || input.metadataJson === null
      ? undefined
      : (input.metadataJson as Prisma.InputJsonValue);

  const row = await prisma.localServiceRequestAuditEvent.create({
    data: {
      requestId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? undefined,
      businessId: input.businessId ?? undefined,
      fromStatus: input.fromStatus ?? undefined,
      toStatus: input.toStatus ?? undefined,
      reason: input.reason?.trim() || undefined,
      safeMessage: safeMessage ?? undefined,
      metadataJson,
      noWalletAction: true,
      walletModeSnapshot: LOCAL_REQUEST_AUDIT_V1_WALLET_MODE,
      walletPhaseSnapshot: LOCAL_REQUEST_AUDIT_V1_WALLET_PHASE,
      requestOnlyNoChargeSnapshot: true,
      idempotencyKey: input.idempotencyKey?.trim() || undefined,
      runId: input.runId?.trim() || undefined,
    },
  });

  return {
    ok: true,
    event: {
      id: row.id,
      requestId: row.requestId,
      eventType: row.eventType,
      actorType: row.actorType,
      noWalletAction: row.noWalletAction,
      walletModeSnapshot: row.walletModeSnapshot,
      walletPhaseSnapshot: row.walletPhaseSnapshot,
      requestOnlyNoChargeSnapshot: row.requestOnlyNoChargeSnapshot,
    },
  };
}

/** Throws when audit write fails — use inside lifecycle `$transaction` to roll back mutation. */
export function assertLocalRequestAuditWritten(
  result: CreateLocalRequestAuditEventResult
): asserts result is Extract<CreateLocalRequestAuditEventResult, { ok: true }> {
  if (!result.ok) {
    throw new Error(`local_request_audit_write_failed:${result.reason}`);
  }
}
