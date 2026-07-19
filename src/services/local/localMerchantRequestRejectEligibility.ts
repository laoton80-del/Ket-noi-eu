import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
  type LocalServiceRequestStatusClient,
  type LocalWalletModeClient,
  type LocalWalletPhaseClient,
} from '../../domain/local/localServiceRequestClientContract';

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
  status: LocalServiceRequestStatusClient;
  walletMode: LocalWalletModeClient;
  walletPhase: LocalWalletPhaseClient;
}>;

const REJECTABLE_STATUSES: ReadonlySet<LocalServiceRequestStatusClient> = new Set([
  LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
  LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW,
]);

/**
 * Pure eligibility for merchant reject on request-only Local rows (no wallet side effects).
 */
export function evaluateLocalMerchantRequestRejectEligibility(
  row: LocalMerchantRequestRejectEligibilityRow
): LocalMerchantRequestRejectEligibility {
  if (row.walletMode !== LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE) {
    return {
      kind: 'reject_ineligible',
      code: 'invalid_wallet_mode',
      message: 'Reject is not available for this wallet mode',
    };
  }

  if (row.walletPhase !== LOCAL_WALLET_PHASE.NONE) {
    return {
      kind: 'reject_ineligible',
      code: 'invalid_wallet_phase',
      message: 'Reject is not available while wallet phase is not NONE',
    };
  }

  if (row.status === LOCAL_SERVICE_REQUEST_STATUS.REJECTED) {
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
