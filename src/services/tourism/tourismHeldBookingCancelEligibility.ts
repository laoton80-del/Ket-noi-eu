import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

export type TourismHeldBookingCancelEligibility =
  | Readonly<{ kind: 'release' }>
  | Readonly<{ kind: 'idempotent' }>
  | Readonly<{ kind: 'reject'; code: TourismHeldBookingCancelRejectCode; message: string }>;

export type TourismHeldBookingCancelRejectCode =
  | 'invalid_settlement_mode'
  | 'invalid_status'
  | 'not_held'
  | 'inconsistent_state';

export type TourismHeldBookingCancelRow = Readonly<{
  status: TourismBookingStatus;
  settlementMode: TourismSettlementMode;
  providerSettledAt: Date | null;
  confirmedAt: Date | null;
}>;

/**
 * Pure eligibility for cancel → release held tourism bookings (pre-confirm only).
 */
export function evaluateTourismHeldBookingCancelEligibility(
  booking: TourismHeldBookingCancelRow
): TourismHeldBookingCancelEligibility {
  if (booking.status === TourismBookingStatus.CANCELLED) {
    if (booking.providerSettledAt != null) {
      return {
        kind: 'reject',
        code: 'invalid_status',
        message: 'Cancelled booking with provider settlement cannot be released via hold cancel',
      };
    }
    return { kind: 'idempotent' };
  }

  if (booking.providerSettledAt != null) {
    if (booking.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK) {
      return {
        kind: 'reject',
        code: 'invalid_settlement_mode',
        message: 'Legacy settle-on-book booking; hold release does not apply',
      };
    }
    if (
      booking.status === TourismBookingStatus.CONFIRMED ||
      booking.status === TourismBookingStatus.COMPLETED
    ) {
      return {
        kind: 'reject',
        code: 'invalid_status',
        message: 'Confirmed or completed booking cannot be cancelled via hold release',
      };
    }
    return {
      kind: 'reject',
      code: 'inconsistent_state',
      message: 'providerSettledAt is set but booking is not in a terminal confirmed state',
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
      message: 'Booking settlement metadata is UNKNOWN; cannot release hold',
    };
  }

  if (booking.settlementMode === TourismSettlementMode.PREVIEW_ONLY) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: 'Preview-only booking has no held funds to release',
    };
  }

  if (booking.settlementMode === TourismSettlementMode.SETTLE_ON_CONFIRM) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: 'Settle-on-confirm booking cannot be cancelled via hold release',
    };
  }

  if (booking.settlementMode !== TourismSettlementMode.HOLD_ON_SUBMIT) {
    return {
      kind: 'reject',
      code: 'invalid_settlement_mode',
      message: `Unsupported settlement mode: ${booking.settlementMode}`,
    };
  }

  if (
    booking.status === TourismBookingStatus.CONFIRMED ||
    booking.status === TourismBookingStatus.COMPLETED
  ) {
    return {
      kind: 'reject',
      code: 'invalid_status',
      message: 'Confirmed or completed booking cannot be cancelled via hold release',
    };
  }

  if (booking.status !== TourismBookingStatus.PENDING) {
    return {
      kind: 'reject',
      code: 'invalid_status',
      message: 'Only PENDING held bookings can be cancelled',
    };
  }

  if (booking.confirmedAt != null) {
    return {
      kind: 'reject',
      code: 'inconsistent_state',
      message: 'confirmedAt is set but providerSettledAt is missing',
    };
  }

  return { kind: 'release' };
}
