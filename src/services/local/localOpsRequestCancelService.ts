import {
  LocalCancelReason,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

import { evaluateLocalOpsRequestCancelEligibility } from './localOpsRequestCancelEligibility';
import {
  localOpsCancelReasonToEnum,
  type LocalOpsCancelReasonCode,
} from './localOpsRequestCancelPolicy';

export const LOCAL_OPS_REQUEST_CANCEL_SUCCESS_MESSAGE =
  'Request cancelled by ops. No payment was captured.' as const;

export type CancelOpsLocalServiceRequestInput = Readonly<{
  adminUserId: string;
  requestId: string;
  cancelReason: LocalOpsCancelReasonCode;
}>;

export type CancelOpsLocalServiceRequestFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'forbidden'
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalOpsRequestCancelDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  cancelledAt: string | null;
  cancelReason: LocalCancelReason | null;
  cancelledByRole: string | null;
  createdAt: string;
  updatedAt: string;
  message: typeof LOCAL_OPS_REQUEST_CANCEL_SUCCESS_MESSAGE;
}>;

export type CancelOpsLocalServiceRequestResult =
  | Readonly<{ ok: true; request: LocalOpsRequestCancelDto }>
  | Readonly<{ ok: false; reason: CancelOpsLocalServiceRequestFailure }>;

function toIso(d: Date): string {
  return d.toISOString();
}

function toOpsCancelDto(row: {
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  cancelledAt: Date | null;
  cancelReason: LocalCancelReason | null;
  cancelledByRole: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LocalOpsRequestCancelDto {
  return {
    id: row.id,
    status: row.status,
    businessId: row.businessId,
    serviceId: row.serviceId,
    walletMode: row.walletMode,
    walletPhase: row.walletPhase,
    cancelledAt: row.cancelledAt != null ? toIso(row.cancelledAt) : null,
    cancelReason: row.cancelReason,
    cancelledByRole: row.cancelledByRole,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    message: LOCAL_OPS_REQUEST_CANCEL_SUCCESS_MESSAGE,
  };
}

/**
 * Ops/admin cancel — status transition only; no wallet, booking, or settlement side effects.
 * Caller must be `Role.ADMIN` (enforced here and via `superAdminMiddleware` on the route).
 */
export async function cancelOpsLocalServiceRequest(
  input: CancelOpsLocalServiceRequestInput
): Promise<CancelOpsLocalServiceRequestResult> {
  const adminUserId = input.adminUserId.trim();
  const requestId = input.requestId.trim();

  if (adminUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { role: true },
  });

  if (!admin || admin.role !== Role.ADMIN) {
    return { ok: false, reason: 'forbidden' };
  }

  const existing = await prisma.localServiceRequest.findUnique({
    where: { id: requestId },
  });

  if (!existing) {
    return { ok: false, reason: 'request_not_found' };
  }

  const eligibility = evaluateLocalOpsRequestCancelEligibility({
    status: existing.status,
    walletMode: existing.walletMode,
    walletPhase: existing.walletPhase,
  });

  if (eligibility.kind === 'idempotent') {
    return { ok: true, request: toOpsCancelDto(existing) };
  }

  if (eligibility.kind === 'reject') {
    const reasonMap: Record<typeof eligibility.code, CancelOpsLocalServiceRequestFailure> =
      {
        invalid_status: 'invalid_status',
        invalid_wallet_mode: 'invalid_wallet_mode',
        invalid_wallet_phase: 'invalid_wallet_phase',
      };
    return { ok: false, reason: reasonMap[eligibility.code] };
  }

  const cancelledAt = existing.cancelledAt ?? new Date();
  const cancelReason = localOpsCancelReasonToEnum(input.cancelReason);

  const row = await prisma.localServiceRequest.update({
    where: { id: requestId },
    data: {
      status: LocalServiceRequestStatus.OPS_CANCELLED,
      cancelledAt,
      cancelReason,
      cancelledByRole: existing.cancelledByRole ?? 'OPS',
      walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
      walletPhase: LocalWalletPhase.NONE,
    },
  });

  return { ok: true, request: toOpsCancelDto(row) };
}
