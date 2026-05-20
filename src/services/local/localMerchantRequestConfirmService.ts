import {
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

import { evaluateLocalMerchantRequestConfirmEligibility } from './localMerchantRequestConfirmEligibility';
import {
  assertLocalRequestAuditWritten,
  buildRequestAuditSafeMessage,
  createLocalRequestAuditEvent,
} from './localRequestAuditEventService';

export const LOCAL_MERCHANT_REQUEST_CONFIRM_SUCCESS_MESSAGE =
  'Request confirmed. No payment has been captured.' as const;

export type ConfirmMerchantLocalServiceRequestInput = Readonly<{
  merchantUserId: string;
  requestId: string;
}>;

export type ConfirmMerchantLocalServiceRequestFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalMerchantRequestConfirmDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  merchantConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  message: typeof LOCAL_MERCHANT_REQUEST_CONFIRM_SUCCESS_MESSAGE;
}>;

export type ConfirmMerchantLocalServiceRequestResult =
  | Readonly<{ ok: true; request: LocalMerchantRequestConfirmDto }>
  | Readonly<{ ok: false; reason: ConfirmMerchantLocalServiceRequestFailure }>;

function toIso(d: Date): string {
  return d.toISOString();
}

function toConfirmDto(row: {
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): LocalMerchantRequestConfirmDto {
  return {
    id: row.id,
    status: row.status,
    businessId: row.businessId,
    serviceId: row.serviceId,
    walletMode: row.walletMode,
    walletPhase: row.walletPhase,
    merchantConfirmedAt: row.confirmedAt != null ? toIso(row.confirmedAt) : null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    message: LOCAL_MERCHANT_REQUEST_CONFIRM_SUCCESS_MESSAGE,
  };
}

/**
 * Merchant confirm — status transition only; no wallet, booking, or settlement side effects.
 */
export async function confirmMerchantLocalServiceRequest(
  input: ConfirmMerchantLocalServiceRequestInput
): Promise<ConfirmMerchantLocalServiceRequestResult> {
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

  const eligibility = evaluateLocalMerchantRequestConfirmEligibility({
    status: existing.status,
    walletMode: existing.walletMode,
    walletPhase: existing.walletPhase,
  });

  if (eligibility.kind === 'idempotent') {
    return { ok: true, request: toConfirmDto(existing) };
  }

  if (eligibility.kind === 'reject') {
    const reasonMap: Record<
      typeof eligibility.code,
      ConfirmMerchantLocalServiceRequestFailure
    > = {
      invalid_status: 'invalid_status',
      invalid_wallet_mode: 'invalid_wallet_mode',
      invalid_wallet_phase: 'invalid_wallet_phase',
    };
    return { ok: false, reason: reasonMap[eligibility.code] };
  }

  const confirmedAt = existing.confirmedAt ?? new Date();
  const fromStatus = existing.status;

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.localServiceRequest.update({
      where: { id: requestId },
      data: {
        status: LocalServiceRequestStatus.CONFIRMED,
        confirmedAt,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
      },
    });

    assertLocalRequestAuditWritten(
      await createLocalRequestAuditEvent({
        db: tx,
        requestId,
        eventType: LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED,
        actorType: LocalServiceRequestAuditActorType.MERCHANT,
        actorUserId: merchantUserId,
        businessId: existing.businessId,
        fromStatus,
        toStatus: LocalServiceRequestStatus.CONFIRMED,
        safeMessage: buildRequestAuditSafeMessage(
          LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED
        ),
      })
    );

    return updated;
  });

  return { ok: true, request: toConfirmDto(row) };
}
