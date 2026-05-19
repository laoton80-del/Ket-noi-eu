import type { TourismMerchantDisplayState, TourismWalletPhase } from '../../services/tourism/tourismMerchantInboxView';
import type { TourismMerchantInboxBooking } from '../../services/tourismMerchantInboxApi';

export type TourismInboxFilterChip =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'legacy';

export type TourismInboxDisplayLabels = Readonly<{
  displayState: string;
  walletPhase: string;
  showConfirmedNote: boolean;
  showProviderSettledNote: boolean;
}>;

export function displayStateLabel(state: TourismMerchantDisplayState): string {
  switch (state) {
    case 'pending_merchant_review':
      return 'Pending merchant review';
    case 'confirmed_settled':
      return 'Confirmed / settled';
    case 'completed':
      return 'Completed';
    case 'cancelled_released':
      return 'Cancelled / released';
    case 'legacy_settled':
      return 'Legacy settled';
    case 'preview_only':
      return 'Preview only';
    default:
      return 'Unknown';
  }
}

export function walletPhaseLabel(phase: TourismWalletPhase): string {
  switch (phase) {
    case 'HELD':
      return 'VIO Credits held';
    case 'SETTLED':
      return 'Provider settlement recorded';
    case 'RELEASED':
      return 'Held VIO Credits released';
    case 'LEGACY_SETTLED':
      return 'Legacy settled booking';
    case 'PREVIEW':
      return 'Preview only';
    default:
      return 'No wallet action';
  }
}

export function shouldShowConfirmedNote(booking: Pick<TourismMerchantInboxBooking, 'status' | 'confirmedAt'>): boolean {
  if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') return true;
  return booking.confirmedAt != null && booking.confirmedAt.trim().length > 0;
}

export function shouldShowProviderSettledNote(
  booking: Pick<TourismMerchantInboxBooking, 'providerSettledAt'>
): boolean {
  return booking.providerSettledAt != null && booking.providerSettledAt.trim().length > 0;
}

export function buildTourismInboxDisplayLabels(booking: TourismMerchantInboxBooking): TourismInboxDisplayLabels {
  return {
    displayState: displayStateLabel(booking.merchantDisplayState),
    walletPhase: walletPhaseLabel(booking.walletPhase),
    showConfirmedNote: shouldShowConfirmedNote(booking),
    showProviderSettledNote: shouldShowProviderSettledNote(booking),
  };
}

export function filterTourismInboxBookings(
  bookings: readonly TourismMerchantInboxBooking[],
  chip: TourismInboxFilterChip
): readonly TourismMerchantInboxBooking[] {
  if (chip === 'all') return bookings;
  if (chip === 'pending') {
    return bookings.filter((b) => b.merchantDisplayState === 'pending_merchant_review');
  }
  if (chip === 'confirmed') {
    return bookings.filter((b) => b.merchantDisplayState === 'confirmed_settled');
  }
  if (chip === 'cancelled') {
    return bookings.filter((b) => b.merchantDisplayState === 'cancelled_released');
  }
  if (chip === 'completed') {
    return bookings.filter((b) => b.merchantDisplayState === 'completed');
  }
  return bookings.filter((b) => b.merchantDisplayState === 'legacy_settled');
}
