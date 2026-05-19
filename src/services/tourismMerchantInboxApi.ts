import { restApiFetchJson, type ApiRequestResult } from './apiClient';
import type { TourismMerchantDisplayState, TourismWalletPhase } from './tourism/tourismMerchantInboxView';

export type TourismMerchantInboxBooking = Readonly<{
  id: string;
  businessId: string;
  businessName: string;
  status: string;
  settlementMode: string;
  totalPaidVIG: number;
  netProviderEarningsVIG: number;
  providerFeeVIG: number;
  touristFeeVIG: number;
  providerSettledAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string | null;
  startDate: string;
  endDate: string;
  guestCount: number;
  tourist: Readonly<{
    userId: string;
    displayName: string | null;
  }>;
  service: Readonly<{
    id: string;
    title: string;
  }>;
  walletPhase: TourismWalletPhase;
  merchantDisplayState: TourismMerchantDisplayState;
  actions: Readonly<{
    canConfirm: boolean;
    canCancel: boolean;
    canComplete: boolean;
  }>;
}>;

export type TourismMerchantInboxResponse = Readonly<{
  bookings: readonly TourismMerchantInboxBooking[];
}>;

export type TourismMerchantBookingActionResult = Readonly<{
  bookingId: string;
  status: string;
  idempotent?: boolean;
  cancelReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  providerSettledAt?: string;
  settlementMode?: string;
}>;

/** `GET /api/tourism/bookings/merchant` */
export async function fetchMerchantTourismBookings(): Promise<
  ApiRequestResult<TourismMerchantInboxResponse>
> {
  return restApiFetchJson<TourismMerchantInboxResponse>('/api/tourism/bookings/merchant', {
    method: 'GET',
  });
}

/** `POST /api/tourism/bookings/:bookingId/confirm` */
export async function confirmMerchantTourismBooking(
  bookingId: string
): Promise<ApiRequestResult<TourismMerchantBookingActionResult>> {
  return restApiFetchJson<TourismMerchantBookingActionResult>(
    `/api/tourism/bookings/${encodeURIComponent(bookingId)}/confirm`,
    { method: 'POST', body: {} }
  );
}

/** `POST /api/tourism/bookings/:bookingId/cancel` — merchant reject (release held VIO Credits). */
export async function cancelMerchantTourismBooking(
  bookingId: string
): Promise<ApiRequestResult<TourismMerchantBookingActionResult>> {
  return restApiFetchJson<TourismMerchantBookingActionResult>(
    `/api/tourism/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: 'POST',
      body: { cancelReason: 'PROVIDER_REJECTED' },
    }
  );
}

/** `POST /api/tourism/bookings/:bookingId/complete` */
export async function completeMerchantTourismBooking(
  bookingId: string
): Promise<ApiRequestResult<TourismMerchantBookingActionResult>> {
  return restApiFetchJson<TourismMerchantBookingActionResult>(
    `/api/tourism/bookings/${encodeURIComponent(bookingId)}/complete`,
    { method: 'POST', body: {} }
  );
}
