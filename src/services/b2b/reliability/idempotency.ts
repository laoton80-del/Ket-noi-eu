/**
 * Firestore patterns for idempotent writes (bookings, orders, sessions, billing).
 *
 * 1) Idempotency doc (optional global collection): b2b_idempotency/{hash}
 *    - Fields: tenantId, operation, referenceId, createdAt
 *    - Transaction: read first; if exists return linked booking/order.
 *
 * 2) Natural keys on domain docs: BusinessBooking.idempotencyKey, same for orders/sessions/billing.
 *    - Composite index: tenantId + idempotencyKey (collection group) OR query within tenant subcollection.
 *
 * 3) Call dedup: BusinessCallSession keyed by externalCallId (Twilio CallSid) + tenantId; enforce unique in transaction.
 *
 * 4) Billing: BusinessBillingEvent.idempotencyKey = `usage:${bookingId}` or `usage:${orderId}` so replay debits once.
 */

export function bookingIdempotencyKey(callSessionId: string, provisionalSlotDigest: string): string {
  return `booking:${callSessionId}:${provisionalSlotDigest}`;
}

export function orderIdempotencyKey(callSessionId: string, cartDigest: string): string {
  return `order:${callSessionId}:${cartDigest}`;
}

export function callSessionIdempotencyKey(provider: string, externalCallId: string): string {
  return `call:${provider}:${externalCallId}`;
}

export function billingUsageIdempotencyKey(kind: 'booking' | 'order', entityId: string): string {
  return `billing:usage:${kind}:${entityId}`;
}
