/**
 * ViGlobal tourism checkout — **REST via `restApiFetchJson`** (project standard; no Axios bundle).
 * Quotes and confirmations hit the authoritative Node API; **never** recompute dual-fee totals on device.
 *
 * **V7 parity:** Server-side PaymentIntent creation should use the same policy as
 * `src/services/billing/StripeBillingService.ts` (`buildV7ConnectMarketplaceCheckoutPlan` +
 * `computeV7DualSplitFeesMinor`) so trust + merchant cuts match Connect `application_fee_amount`.
 */

import { trackEvent } from '../AnalyticsService';
import { restApiFetchJson, type ApiRequestResult } from '../apiClient';

/** Mirrors `TourismQuoteDto` from `TourismHubService` (server). */
export type TourismQuote = Readonly<{
  basePriceVIG: number;
  touristFeeVIG: number;
  totalVIG: number;
  providerFeeVIG: number;
  netProviderEarningsVIG: number;
  trustFeeRateApplied: number;
  providerCommissionRate: number;
  nights: number;
  unitPriceVIG: number;
  guestCount: number;
  fx?: Readonly<{
    eurVndRate: number;
    asOfIso: string;
    source: string;
    indicativeOffRampVnd: number;
  }>;
}>;

export type TourismQuoteApiPayload = Readonly<{
  businessId: string;
  serviceId: string;
  /** ISO-8601 */
  startDate: string;
  endDate: string;
  guestCount: number;
}>;

export type TourismQuoteApiResponse = Readonly<{ quote: TourismQuote }>;

export type ConfirmTourismBookingPayload = Readonly<{
  businessId: string;
  serviceId: string;
  startDate: string;
  endDate: string;
  guestCount: number;
}>;

export type TourismBookingConfirmation = Readonly<{
  booking: Readonly<{
    id: string;
    userId: string;
    businessId: string;
    serviceId: string;
    startDate: string;
    endDate: string;
    guestCount: number;
    status: string;
    providerFeeVIG: number;
    touristFeeVIG: number;
    totalPaidVIG: number;
    netProviderEarningsVIG: number;
  }>;
}>;

/** `POST /api/tourism/quote` — server-only dual split math. */
export async function calculateTourismQuote(
  payload: TourismQuoteApiPayload
): Promise<ApiRequestResult<TourismQuoteApiResponse>> {
  return restApiFetchJson<TourismQuoteApiResponse>('/api/tourism/quote', {
    method: 'POST',
    body: payload,
  });
}

/**
 * `POST /api/tourism/book` — atomic wallet + `TourismBooking` transaction.
 * Same payload shape as quote; booking row appears on merchant inbound radar when successful.
 */
export async function confirmTourismBooking(
  payload: ConfirmTourismBookingPayload
): Promise<ApiRequestResult<TourismBookingConfirmation>> {
  const r = await restApiFetchJson<TourismBookingConfirmation>('/api/tourism/book', {
    method: 'POST',
    body: payload,
  });
  if (r.ok) {
    const b = r.data.booking;
    trackEvent('tourism_booking_completed', {
      guestCount: b.guestCount,
      status: String(b.status),
      totalPaidVigRounded: Math.round(b.totalPaidVIG),
    });
  }
  return r;
}

/** Detect insufficient VIG from API error (HTTP 409 + copy from `TourismController`). */
export function isInsufficientVigError(error: string): boolean {
  return /insufficient|Insufficient/i.test(error);
}
