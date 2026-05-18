/**
 * **Offline failsafe** — if the merchant app does not ACK a Leona-confirmed booking within 3 minutes,
 * dispatch **push + email** alerts (Zero-SMS Doctrine). Optional webhook for server-side delivery.
 */

import { devWarn } from '../../utils/devLog';

export const V7_MERCHANT_BOOKING_ACK_TIMEOUT_MS = 3 * 60 * 1000;

export type V7BookingFailsafeDetails = Readonly<{
  bookingId: string;
  /** One-line summary for logs / email subject */
  summaryLine: string;
  /** E.164 — retained for CRM / future WhatsApp compliance channel only (not SMS). */
  emergencyPhoneE164?: string;
}>;

const pendingAckTimers = new Map<string, ReturnType<typeof setTimeout>>();

function failsafeKey(merchantId: string, bookingId: string): string {
  return `${merchantId.trim()}|${bookingId.trim()}`;
}

/**
 * Call when the merchant device confirms receipt (push handled, dashboard refresh, or manual “seen”).
 * Cancels the pending failsafe timer for this booking.
 */
export function merchantAcknowledgeBookingPing(merchantId: string, bookingId: string): void {
  const k = failsafeKey(merchantId, bookingId);
  const t = pendingAckTimers.get(k);
  if (t != null) {
    clearTimeout(t);
    pendingAckTimers.delete(k);
  }
}

/**
 * After AI Leona confirms a booking, start a **3-minute** watchdog. If {@link merchantAcknowledgeBookingPing}
 * is not called in time, {@link triggerOfflineFailsafe} notifies via data channels (no carrier SMS).
 */
export function scheduleBookingOfflineFailsafe(
  merchantId: string,
  details: V7BookingFailsafeDetails
): void {
  const k = failsafeKey(merchantId, details.bookingId);
  if (pendingAckTimers.has(k)) return;

  const t = setTimeout(() => {
    pendingAckTimers.delete(k);
    void dispatchMerchantBookingFailsafeData(merchantId, details);
  }, V7_MERCHANT_BOOKING_ACK_TIMEOUT_MS);

  pendingAckTimers.set(k, t);
}

/** @deprecated Use {@link scheduleBookingOfflineFailsafe} — alias for CEO spec naming */
export function triggerOfflineFailsafe(merchantId: string, bookingDetails: V7BookingFailsafeDetails): void {
  scheduleBookingOfflineFailsafe(merchantId, bookingDetails);
}

async function dispatchMerchantBookingFailsafeData(
  merchantId: string,
  details: V7BookingFailsafeDetails
): Promise<void> {
  const disabled = process.env.EXPO_PUBLIC_V7_FAILSAFE_DISABLED?.trim() === '1';
  if (disabled) {
    if (__DEV__) {
      devWarn('V7OfflineFailsafe', 'skipped_disabled', { merchantId, bookingId: details.bookingId });
    }
    return;
  }

  const webhook =
    process.env.EXPO_PUBLIC_V7_FAILSAFE_DATA_WEBHOOK_URL?.trim() ??
    process.env.EXPO_PUBLIC_V7_FAILSAFE_SMS_WEBHOOK_URL?.trim() ??
    '';
  const payload = {
    kind: 'merchant_booking_offline_failsafe' as const,
    channels: ['push', 'email'] as const,
    merchantId,
    bookingId: details.bookingId,
    summaryLine: details.summaryLine,
    emergencyPhoneE164: details.emergencyPhoneE164?.trim() ?? null,
    message:
      'VIONA alert (preview): Booking note recorded — check your dashboard. Not a live fulfillment confirmation.',
  };

  if (webhook.length > 0) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok && __DEV__) {
        devWarn('V7OfflineFailsafe', 'webhook_http_error', { status: res.status });
      }
    } catch (e) {
      if (__DEV__) {
        devWarn('V7OfflineFailsafe', 'webhook_failed', { message: e instanceof Error ? e.message : String(e) });
      }
    }
    return;
  }

  if (__DEV__) {
    devWarn(
      'V7OfflineFailsafe',
      'no_webhook_configure_EXPO_PUBLIC_V7_FAILSAFE_DATA_WEBHOOK_URL',
      payload
    );
  }
}

/** Test helper */
export function __dangerClearFailsafeTimersForTests(): void {
  for (const t of pendingAckTimers.values()) clearTimeout(t);
  pendingAckTimers.clear();
}
