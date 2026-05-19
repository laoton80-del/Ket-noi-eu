import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

export type LocalOpsRequestCancelRejectCode =
  | 'invalid_status'
  | 'invalid_wallet_mode'
  | 'invalid_wallet_phase';

export type LocalOpsRequestCancelEligibility =
  | Readonly<{ kind: 'cancel' }>
  | Readonly<{ kind: 'idempotent' }>
  | Readonly<{
      kind: 'reject';
      code: LocalOpsRequestCancelRejectCode;
      message: string;
    }>;

export type LocalOpsRequestCancelEligibilityRow = Readonly<{
  status: LocalServiceRequestStatus;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
}>;

const OPS_CANCELLABLE_STATUSES: ReadonlySet<LocalServiceRequestStatus> = new Set([
  LocalServiceRequestStatus.REQUESTED,
  LocalServiceRequestStatus.MERCHANT_REVIEW,
  LocalServiceRequestStatus.CONFIRMED,
]);

/**
 * Pure eligibility for ops/admin cancel on request-only Local rows (no wallet side effects).
 */
export function evaluateLocalOpsRequestCancelEligibility(
  row: LocalOpsRequestCancelEligibilityRow
): LocalOpsRequestCancelEligibility {
  if (row.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_mode',
      message: 'Ops cancel is not available for this wallet mode',
    };
  }

  if (row.walletPhase !== LocalWalletPhase.NONE) {
    return {
      kind: 'reject',
      code: 'invalid_wallet_phase',
      message: 'Ops cancel is not available while wallet phase is not NONE',
    };
  }

  if (row.status === LocalServiceRequestStatus.OPS_CANCELLED) {
    return { kind: 'idempotent' };
  }

  if (OPS_CANCELLABLE_STATUSES.has(row.status)) {
    return { kind: 'cancel' };
  }

  return {
    kind: 'reject',
    code: 'invalid_status',
    message: 'Request cannot be ops-cancelled in its current status',
  };
}
