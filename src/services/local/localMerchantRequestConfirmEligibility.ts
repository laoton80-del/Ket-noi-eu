import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
  type LocalServiceRequestStatusClient,
  type LocalWalletModeClient,
  type LocalWalletPhaseClient,
} from '../../domain/local/localServiceRequestClientContract';

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
  status: LocalServiceRequestStatusClient;
  walletMode: LocalWalletModeClient;
  walletPhase: LocalWalletPhaseClient;
}>;

const CONFIRMABLE_STATUSES: ReadonlySet<LocalServiceRequestStatusClient> = new Set([
  LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
  LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW,
]);

/**
 * Pure eligibility for merchant confirm on request-only Local rows (no wallet side effects).
 */
export function evaluateLocalMerchantRequestConfirmEligibility(
  row: LocalMerchantRequestConfirmEligibilityRow
): LocalMerchantRequestConfirmEligibility {
  if (row.walletMode !== LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_mode',
      message: 'Confirm is not available for this wallet mode',
    };
  }

  if (row.walletPhase !== LOCAL_WALLET_PHASE.NONE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_phase',
      message: 'Confirm is not available while wallet phase is not NONE',
    };
  }

  if (row.status === LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED) {
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
