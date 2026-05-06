/**
 * UI-testing mock — no OpenAI, Gemini, Twilio, or Supabase. Stripe-only policy elsewhere.
 * Simulates Leona confirming a booking after a fixed network delay.
 * When a slot context is provided, acquires {@link acquireTimeSlotLock} first (same path as Lễ Tân AI).
 */

import { acquireTimeSlotLock } from '../booking/V7ConcurrencyManager';

export const MOCK_LEONA_NETWORK_DELAY_MS = 1_500;

export type MockLeonaBookingStatus = 'Success' | 'SlotLocked';

export type SlotLockContext = Readonly<{
  merchantId: string;
  techId: string;
  /** Epoch ms for the slot start (stable key with merchant + tech). */
  slotStartMs: number;
}>;

export type MockLeonaBookingResult = Readonly<{
  status: MockLeonaBookingStatus;
  clientName: string;
  serviceName: string;
  /** When slot is held elsewhere — UI should suggest an alternative time. */
  pivotHint?: string;
}>;

/**
 * Resolves after {@link MOCK_LEONA_NETWORK_DELAY_MS} with a successful confirmation payload.
 * With `slot`, performs Redis-style lock acquisition; on contention returns `SlotLocked` immediately (no overbook).
 */
export function simulateLeonaBooking(
  clientName: string,
  serviceName: string,
  slot?: SlotLockContext
): Promise<MockLeonaBookingResult> {
  const cn = clientName.trim();
  const sn = serviceName.trim();
  const clientLabel = cn.length > 0 ? cn : 'Khách';
  const serviceLabel = sn.length > 0 ? sn : 'Dịch vụ';

  if (slot != null) {
    const acquired = acquireTimeSlotLock(slot.merchantId, slot.techId, slot.slotStartMs, {
      owner: 'leona_b2c',
    });
    if (!acquired) {
      return Promise.resolve({
        status: 'SlotLocked',
        clientName: clientLabel,
        serviceName: serviceLabel,
        pivotHint: 'Khung giờ vừa được chốt bởi kênh khác — đề xuất khung giờ khác cho khách.',
      });
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'Success',
        clientName: clientLabel,
        serviceName: serviceLabel,
      });
    }, MOCK_LEONA_NETWORK_DELAY_MS);
  });
}
