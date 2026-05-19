import {
  LocalCancelReason,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

import { evaluateLocalUserRequestCancelEligibility } from './localUserRequestCancelEligibility';

export const LOCAL_USER_REQUEST_CANCEL_SUCCESS_MESSAGE =
  'Request cancelled. No payment was captured.' as const;

export type CancelUserLocalServiceRequestInput = Readonly<{
  requesterUserId: string;
  requestId: string;
}>;

export type CancelUserLocalServiceRequestFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalUserRequestCancelDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  cancelledAt: string | null;
  cancelReason: LocalCancelReason | null;
  createdAt: string;
  updatedAt: string;
  message: typeof LOCAL_USER_REQUEST_CANCEL_SUCCESS_MESSAGE;
}>;

export type CancelUserLocalServiceRequestResult =
  | Readonly<{ ok: true; request: LocalUserRequestCancelDto }>
  | Readonly<{ ok: false; reason: CancelUserLocalServiceRequestFailure }>;

function toIso(d: Date): string {
  return d.toISOString();
}

function toCancelDto(row: {
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  cancelledAt: Date | null;
  cancelReason: LocalCancelReason | null;
  createdAt: Date;
  updatedAt: Date;
}): LocalUserRequestCancelDto {
  return {
    id: row.id,
    status: row.status,
    businessId: row.businessId,
    serviceId: row.serviceId,
    walletMode: row.walletMode,
    walletPhase: row.walletPhase,
    cancelledAt: row.cancelledAt != null ? toIso(row.cancelledAt) : null,
    cancelReason: row.cancelReason,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    message: LOCAL_USER_REQUEST_CANCEL_SUCCESS_MESSAGE,
  };
}

/**
 * Requester user cancel — status transition only; no wallet, booking, or settlement side effects.
 */
export async function cancelUserLocalServiceRequest(
  input: CancelUserLocalServiceRequestInput
): Promise<CancelUserLocalServiceRequestResult> {
  const requesterUserId = input.requesterUserId.trim();
  const requestId = input.requestId.trim();

  if (requesterUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const existing = await prisma.localServiceRequest.findUnique({
    where: { id: requestId },
  });

  if (!existing || existing.requesterUserId !== requesterUserId) {
    return { ok: false, reason: 'request_not_found' };
  }

  const eligibility = evaluateLocalUserRequestCancelEligibility({
    status: existing.status,
    walletMode: existing.walletMode,
    walletPhase: existing.walletPhase,
  });

  if (eligibility.kind === 'idempotent') {
    return { ok: true, request: toCancelDto(existing) };
  }

  if (eligibility.kind === 'reject') {
    const reasonMap: Record<typeof eligibility.code, CancelUserLocalServiceRequestFailure> =
      {
        invalid_status: 'invalid_status',
        invalid_wallet_mode: 'invalid_wallet_mode',
        invalid_wallet_phase: 'invalid_wallet_phase',
      };
    return { ok: false, reason: reasonMap[eligibility.code] };
  }

  const cancelledAt = existing.cancelledAt ?? new Date();

  const row = await prisma.localServiceRequest.update({
    where: { id: requestId },
    data: {
      status: LocalServiceRequestStatus.USER_CANCELLED,
      cancelledAt,
      cancelReason: existing.cancelReason ?? LocalCancelReason.USER_CANCEL,
      cancelledByRole: existing.cancelledByRole ?? 'REQUESTER',
      walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
      walletPhase: LocalWalletPhase.NONE,
    },
  });

  return { ok: true, request: toCancelDto(row) };
}
