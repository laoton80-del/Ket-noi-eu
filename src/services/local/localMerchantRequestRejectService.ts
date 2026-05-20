import {
  LocalCancelReason,
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

import { evaluateLocalMerchantRequestRejectEligibility } from './localMerchantRequestRejectEligibility';
import {
  assertLocalRequestAuditWritten,
  buildRequestAuditSafeMessage,
  createLocalRequestAuditEvent,
} from './localRequestAuditEventService';

export const LOCAL_MERCHANT_REQUEST_REJECT_SUCCESS_MESSAGE =
  'Request rejected. No payment was captured.' as const;

export type RejectMerchantLocalServiceRequestInput = Readonly<{
  merchantUserId: string;
  requestId: string;
}>;

export type RejectMerchantLocalServiceRequestFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalMerchantRequestRejectDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  message: typeof LOCAL_MERCHANT_REQUEST_REJECT_SUCCESS_MESSAGE;
}>;

export type RejectMerchantLocalServiceRequestResult =
  | Readonly<{ ok: true; request: LocalMerchantRequestRejectDto }>
  | Readonly<{ ok: false; reason: RejectMerchantLocalServiceRequestFailure }>;

function toIso(d: Date): string {
  return d.toISOString();
}

function toRejectDto(row: {
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): LocalMerchantRequestRejectDto {
  return {
    id: row.id,
    status: row.status,
    businessId: row.businessId,
    serviceId: row.serviceId,
    walletMode: row.walletMode,
    walletPhase: row.walletPhase,
    rejectedAt: row.rejectedAt != null ? toIso(row.rejectedAt) : null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    message: LOCAL_MERCHANT_REQUEST_REJECT_SUCCESS_MESSAGE,
  };
}

/**
 * Merchant reject — status transition only; no wallet, booking, or settlement side effects.
 */
export async function rejectMerchantLocalServiceRequest(
  input: RejectMerchantLocalServiceRequestInput
): Promise<RejectMerchantLocalServiceRequestResult> {
  const merchantUserId = input.merchantUserId.trim();
  const requestId = input.requestId.trim();

  if (merchantUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const existing = await prisma.localServiceRequest.findUnique({
    where: { id: requestId },
    include: { business: { select: { ownerId: true } } },
  });

  if (!existing || existing.business.ownerId !== merchantUserId) {
    return { ok: false, reason: 'request_not_found' };
  }

  const eligibility = evaluateLocalMerchantRequestRejectEligibility({
    status: existing.status,
    walletMode: existing.walletMode,
    walletPhase: existing.walletPhase,
  });

  if (eligibility.kind === 'idempotent') {
    return { ok: true, request: toRejectDto(existing) };
  }

  if (eligibility.kind === 'reject_ineligible') {
    const reasonMap: Record<
      typeof eligibility.code,
      RejectMerchantLocalServiceRequestFailure
    > = {
      invalid_status: 'invalid_status',
      invalid_wallet_mode: 'invalid_wallet_mode',
      invalid_wallet_phase: 'invalid_wallet_phase',
    };
    return { ok: false, reason: reasonMap[eligibility.code] };
  }

  const rejectedAt = existing.rejectedAt ?? new Date();
  const fromStatus = existing.status;
  const rejectReason = existing.rejectReason ?? LocalCancelReason.PROVIDER_REJECTED;

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.localServiceRequest.update({
      where: { id: requestId },
      data: {
        status: LocalServiceRequestStatus.REJECTED,
        rejectedAt,
        rejectReason,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
      },
    });

    assertLocalRequestAuditWritten(
      await createLocalRequestAuditEvent({
        db: tx,
        requestId,
        eventType: LocalServiceRequestAuditEventType.MERCHANT_REJECTED,
        actorType: LocalServiceRequestAuditActorType.MERCHANT,
        actorUserId: merchantUserId,
        businessId: existing.businessId,
        fromStatus,
        toStatus: LocalServiceRequestStatus.REJECTED,
        reason: rejectReason,
        safeMessage: buildRequestAuditSafeMessage(
          LocalServiceRequestAuditEventType.MERCHANT_REJECTED
        ),
      })
    );

    return updated;
  });

  return { ok: true, request: toRejectDto(row) };
}
