import type { CreateBookingPayload } from '../services/bookingService';

/**
 * Optional demo IDs for Ultra Master bento → `POST /api/bookings`.
 * Seed matching `Business` + `Service` rows in Postgres before calling.
 */
export function getDemoBookingPayload(): CreateBookingPayload | null {
  const businessId = process.env.EXPO_PUBLIC_DEMO_BOOKING_BUSINESS_ID?.trim() ?? '';
  const serviceId = process.env.EXPO_PUBLIC_DEMO_BOOKING_SERVICE_ID?.trim() ?? '';
  if (!businessId || !serviceId) return null;
  return {
    businessId,
    serviceId,
    timeSlot: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  };
}
