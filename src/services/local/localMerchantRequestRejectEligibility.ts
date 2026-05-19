import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

export type LocalMerchantRequestRejectRejectCode =
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalMerchantRequestRejectEligibility =
  | Readonly<{ kind: 'reject' }>
  | Readonly<{ kind: 'idempotent' }>
  | Readonly<{
      kind: 'reject_ineligible';
      code: LocalMerchantRequestRejectRejectCode;
      message: string;
    }>;

export type LocalMerchantRequestRejectEligibilityRow = Readonly<{
  status: LocalServiceRequestStatus;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
}>;

const REJECTABLE_STATUSES: ReadonlySet<LocalServiceRequestStatus> = new Set([
  LocalServiceRequestStatus.REQUESTED,
  LocalServiceRequestStatus.MERCHANT_REVIEW,
]);

/**
 * Pure eligibility for merchant reject on request-only Local rows (no wallet side effects).
 */
export function evaluateLocalMerchantRequestRejectEligibility(
  row: LocalMerchantRequestRejectEligibilityRow
): LocalMerchantRequestRejectEligibility {
  if (row.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE) {
    return {
      kind: 'reject_ineligible',
      code: 'invalid_wallet_mode',
      message: 'Reject is not available for this wallet mode',
    };
  }

  if (row.walletPhase !== LocalWalletPhase.NONE) {
    return {
      kind: 'reject_ineligible',
      code: 'invalid_wallet_phase',
      message: 'Reject is not available while wallet phase is not NONE',
    };
  }

  if (row.status === LocalServiceRequestStatus.REJECTED) {
    return { kind: 'idempotent' };
  }

  if (REJECTABLE_STATUSES.has(row.status)) {
    return { kind: 'reject' };
  }

  return {
    kind: 'reject_ineligible',
    code: 'invalid_status',
    message: 'Request cannot be rejected in its current status',
  };
}
