import {
  TourismBookingStatus,
  TourismSettlementMode,
} from '@prisma/client';

import { evaluateTourismHeldBookingCancelEligibility } from './tourismHeldBookingCancelEligibility';
import { evaluateTourismHeldBookingConfirmEligibility } from './tourismHeldBookingConfirmEligibility';

/** Application-derived wallet phase (no DB column). */
export type TourismWalletPhase =
  | 'NONE'
  | 'HELD'
  | 'SETTLED'
  | 'RELEASED'
  | 'LEGACY_SETTLED'
  | 'PREVIEW';

/** Merchant-facing display bucket — backend truth only. */
export type TourismMerchantDisplayState =
  | 'pending_merchant_review'
  | 'confirmed_settled'
  | 'completed'
  | 'cancelled_released'
  | 'legacy_settled'
  | 'preview_only'
  | 'unknown';

export type TourismMerchantInboxRow = Readonly<{
  status: TourismBookingStatus;
  settlementMode: TourismSettlementMode;
  providerSettledAt: Date | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  totalPaidVIG: number;
}>;

export type TourismMerchantInboxActions = Readonly<{
  canConfirm: boolean;
  canCancel: boolean;
  canComplete: boolean;
}>;

export function deriveTourismWalletPhase(row: TourismMerchantInboxRow): TourismWalletPhase {
  if (row.settlementMode === TourismSettlementMode.PREVIEW_ONLY) {
    return 'PREVIEW';
  }
  if (row.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK) {
    return 'LEGACY_SETTLED';
  }
  if (row.status === TourismBookingStatus.CANCELLED) {
    return row.providerSettledAt != null ? 'SETTLED' : 'RELEASED';
  }
  if (row.providerSettledAt != null) {
    return 'SETTLED';
  }
  if (
    row.settlementMode === TourismSettlementMode.HOLD_ON_SUBMIT &&
    row.status === TourismBookingStatus.PENDING
  ) {
    return 'HELD';
  }
  return 'NONE';
}

export function deriveTourismMerchantDisplayState(
  row: TourismMerchantInboxRow
): TourismMerchantDisplayState {
  const phase = deriveTourismWalletPhase(row);

  if (phase === 'PREVIEW') return 'preview_only';
  if (phase === 'LEGACY_SETTLED') return 'legacy_settled';
  if (row.status === TourismBookingStatus.COMPLETED) return 'completed';
  if (row.status === TourismBookingStatus.CANCELLED) return 'cancelled_released';
  if (
    row.status === TourismBookingStatus.CONFIRMED ||
    row.confirmedAt != null ||
    row.providerSettledAt != null
  ) {
    return 'confirmed_settled';
  }
  if (phase === 'HELD') return 'pending_merchant_review';
  return 'unknown';
}

/**
 * Merchant inbox action flags — mirrors confirm/cancel/complete service gates (read-only).
 */
export function deriveTourismMerchantInboxActions(
  row: TourismMerchantInboxRow
): TourismMerchantInboxActions {
  const confirmEligibility = evaluateTourismHeldBookingConfirmEligibility({
    status: row.status,
    settlementMode: row.settlementMode,
    providerSettledAt: row.providerSettledAt,
    confirmedAt: row.confirmedAt,
    totalPaidVIG: row.totalPaidVIG,
  });

  const cancelEligibility = evaluateTourismHeldBookingCancelEligibility({
    status: row.status,
    settlementMode: row.settlementMode,
    providerSettledAt: row.providerSettledAt,
    confirmedAt: row.confirmedAt,
  });

  const canConfirm = confirmEligibility.kind === 'confirm';
  const canCancel = cancelEligibility.kind === 'release';

  let canComplete = false;
  if (row.status === TourismBookingStatus.COMPLETED) {
    canComplete = false;
  } else if (row.status === TourismBookingStatus.CANCELLED) {
    canComplete = false;
  } else if (
    row.settlementMode === TourismSettlementMode.HOLD_ON_SUBMIT &&
    row.providerSettledAt == null
  ) {
    canComplete = false;
  } else if (
    row.status === TourismBookingStatus.CONFIRMED ||
    row.status === TourismBookingStatus.PENDING
  ) {
    canComplete = true;
  }

  return { canConfirm, canCancel, canComplete };
}
