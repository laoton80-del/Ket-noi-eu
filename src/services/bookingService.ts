import type { ServiceResult } from '../types/serviceResult';
import { restApiFetchJson } from './apiClient';

export type CreateBookingPayload = Readonly<{
  businessId: string;
  serviceId: string;
  timeSlot: string;
}>;

export type BookingRow = Readonly<{
  id: string;
  userId: string;
  businessId: string;
  serviceId: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  lockedAmountVIG: number;
}>;

export type CreateBookingResponseData = Readonly<{
  booking: BookingRow;
}>;

export async function createBooking(
  payload: CreateBookingPayload
): Promise<ServiceResult<CreateBookingResponseData>> {
  const businessId = payload.businessId.trim();
  const serviceId = payload.serviceId.trim();
  const timeSlot = payload.timeSlot.trim();
  if (!businessId || !serviceId || !timeSlot) {
    return { ok: false, error: 'Thiếu businessId, serviceId hoặc timeSlot.', status: 400 };
  }

  const res = await restApiFetchJson<CreateBookingResponseData>('/api/bookings', {
    method: 'POST',
    body: { businessId, serviceId, timeSlot },
  });

  if (!res.ok) {
    return { ok: false, error: res.error, status: res.status, unreachable: res.unreachable };
  }
  return { ok: true, data: res.data };
}
