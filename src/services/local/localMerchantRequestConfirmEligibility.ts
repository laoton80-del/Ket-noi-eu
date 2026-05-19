import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

export type LocalMerchantRequestConfirmRejectCode =
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalMerchantRequestConfirmEligibility =
  | Readonly<{ kind: 'confirm' }>
  | Readonly<{ kind: 'idempotent' }>
  | Readonly<{
      kind: 'reject';
      code: LocalMerchantRequestConfirmRejectCode;
      message: string;
    }>;

export type LocalMerchantRequestConfirmEligibilityRow = Readonly<{
  status: LocalServiceRequestStatus;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
}>;

const CONFIRMABLE_STATUSES: ReadonlySet<LocalServiceRequestStatus> = new Set([
  LocalServiceRequestStatus.REQUESTED,
  LocalServiceRequestStatus.MERCHANT_REVIEW,
]);

/**
 * Pure eligibility for merchant confirm on request-only Local rows (no wallet side effects).
 */
export function evaluateLocalMerchantRequestConfirmEligibility(
  row: LocalMerchantRequestConfirmEligibilityRow
): LocalMerchantRequestConfirmEligibility {
  if (row.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_mode',
      message: 'Confirm is not available for this wallet mode',
    };
  }

  if (row.walletPhase !== LocalWalletPhase.NONE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_phase',
      message: 'Confirm is not available while wallet phase is not NONE',
    };
  }

  if (row.status === LocalServiceRequestStatus.CONFIRMED) {
    return { kind: 'idempotent' };
  }

  if (CONFIRMABLE_STATUSES.has(row.status)) {
    return { kind: 'confirm' };
  }

  return {
    kind: 'reject',
    code: 'invalid_status',
    message: 'Request cannot be confirmed in its current status',
  };
}
