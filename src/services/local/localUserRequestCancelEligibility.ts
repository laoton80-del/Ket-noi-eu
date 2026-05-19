import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

export type LocalUserRequestCancelRejectCode =
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalUserRequestCancelEligibility =
  | Readonly<{ kind: 'cancel' }>
  | Readonly<{ kind: 'idempotent' }>
  | Readonly<{
      kind: 'reject';
      code: LocalUserRequestCancelRejectCode;
      message: string;
    }>;

export type LocalUserRequestCancelEligibilityRow = Readonly<{
  status: LocalServiceRequestStatus;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
}>;

const CANCELLABLE_STATUSES: ReadonlySet<LocalServiceRequestStatus> = new Set([
  LocalServiceRequestStatus.REQUESTED,
  LocalServiceRequestStatus.MERCHANT_REVIEW,
]);

/**
 * Pure eligibility for requester user cancel on request-only Local rows (no wallet side effects).
 */
export function evaluateLocalUserRequestCancelEligibility(
  row: LocalUserRequestCancelEligibilityRow
): LocalUserRequestCancelEligibility {
  if (row.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_mode',
      message: 'Cancel is not available for this wallet mode',
    };
  }

  if (row.walletPhase !== LocalWalletPhase.NONE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_phase',
      message: 'Cancel is not available while wallet phase is not NONE',
    };
  }

  if (row.status === LocalServiceRequestStatus.USER_CANCELLED) {
    return { kind: 'idempotent' };
  }

  if (CANCELLABLE_STATUSES.has(row.status)) {
    return { kind: 'cancel' };
  }

  return {
    kind: 'reject',
    code: 'invalid_status',
    message: 'Request cannot be cancelled in its current status',
  };
}
