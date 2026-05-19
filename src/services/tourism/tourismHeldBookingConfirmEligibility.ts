import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

export type TourismHeldBookingConfirmEligibility =
  | Readonly<{ kind: 'confirm' }>
  | Readonly<{ kind: 'idempotent'; status: TourismBookingStatus }>
  | Readonly<{ kind: 'reject'; code: TourismHeldBookingConfirmRejectCode; message: string }>;

export type TourismHeldBookingConfirmRejectCode =
  | 'invalid_settlement_mode'
  | 'invalid_status'
  | 'not_held'
  | 'inconsistent_state';

export type TourismHeldBookingConfirmRow = Readonly<{
  status: TourismBookingStatus;
  settlementMode: TourismSettlementMode;
  providerSettledAt: Date | null;
  confirmedAt: Date | null;
  totalPaidVIG: number;
}>;

/**
 * Pure eligibility for merchant confirm → settle held tourism bookings.
 */
export function evaluateTourismHeldBookingConfirmEligibility(
  booking: TourismHeldBookingConfirmRow
): TourismHeldBookingConfirmEligibility {
  if (booking.providerSettledAt != null) {
    if (booking.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK) {
      return {
        kind: 'reject',
        code: 'invalid_settlement_mode',
        message: 'Legacy settle-on-book booking; confirm/settle does not apply',
      };
    }
    if (
      booking.status === TourismBookingStatus.CONFIRMED ||
      booking.status === TourismBookingStatus.COMPLETED
    ) {
      return { kind: 'idempotent', status: booking.status };
    }
    return {
      kind: 'reject',
      code: 'inconsistent_state',
      message: 'providerSettledAt is set but booking status is not CONFIRMED/COMPLETED',
    };
  }

  if (booking.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: 'Legacy settle-on-book booking was already settled at book',
    };
  }

  if (booking.settlementMode === TourismSettlementMode.UNKNOWN) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: 'Booking settlement metadata is UNKNOWN; cannot confirm hold',
    };
  }

  if (booking.settlementMode === TourismSettlementMode.PREVIEW_ONLY) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: 'Preview-only booking has no held funds to settle',
    };
  }

  if (booking.settlementMode === TourismSettlementMode.SETTLE_ON_CONFIRM) {
    return {
      kind: 'reject',
      code: 'inconsistent_state',
      message: 'Booking is marked settle-on-confirm but providerSettledAt is missing',
    };
  }

  if (booking.settlementMode !== TourismSettlementMode.HOLD_ON_SUBMIT) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: `Unsupported settlement mode: ${booking.settlementMode}`,
    };
  }

  if (booking.status === TourismBookingStatus.CANCELLED) {
    return {
      kind: 'reject',
      code: 'invalid_status',
      message: 'Cancelled booking cannot be confirmed',
    };
  }

  if (booking.status !== TourismBookingStatus.PENDING) {
    return {
      kind: 'reject',
      code: 'invalid_status',
      message: 'Only PENDING held bookings can be confirmed',
    };
  }

  if (booking.confirmedAt != null) {
    return {
      kind: 'reject',
      code: 'inconsistent_state',
      message: 'confirmedAt is set but providerSettledAt is missing',
    };
  }

  return { kind: 'confirm' };
}
