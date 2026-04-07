/**
 * Webhook-authoritative payment receipts (top-up precondition when strict mode is on).
 *
 * **End-to-end flow, env matrix, staging order:** `docs/RECEIPT_STRICTNESS.md` (Wave 1 D10).
 *
 * **Enable strict server-side receipt checks** (Cloud Function env):
 * - `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` — require a `paid` doc before `walletOps` topup.
 * - `WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID=1` — receipt must carry `walletUid` matching the caller.
 * - `WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT=1` — receipt must set `creditsToGrant` equal to the top-up `amount`.
 *
 * 1. Client completes checkout; provider webhook verifies signature, then **writes only**:
 *    `platform_payment_receipts/{paymentEventId}` with `status: 'paid'` and metadata.
 * 2. Client calls `walletOps` `op: 'topup'` with Firebase ID token; server applies credits once into
 *    `wallets/{uid}` and `verifiedTopups/{paymentEventId}` (idempotency).
 *
 * **Default:** `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` unset → receipt doc not required; enable when webhook path is live (`docs/RECEIPT_STRICTNESS.md`).
 */

export const PAYMENT_RECEIPTS_COLLECTION = 'platform_payment_receipts' as const;

export type PaymentReceiptProvider = 'stripe' | 'unknown';

/** Lifecycle driven by webhook + optional manual review. Only `paid` may unlock topup. */
export type PaymentReceiptStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Firestore document at `platform_payment_receipts/{paymentEventId}`.
 * `paymentEventId` must match the id sent to `walletOps` topup as `paymentEventId`.
 */
export type PaymentReceiptRecord = {
  status: PaymentReceiptStatus;
  provider: PaymentReceiptProvider;
  /** Normalized minor units (e.g. cents). */
  amountMinor?: number;
  currency?: string;
  /** Credits the platform will grant once receipt is `paid` (audit / double-check vs client body). */
  creditsToGrant?: number;
  /** Wallet owner Firebase Auth uid (from checkout metadata). */
  walletUid?: string;
  /** Provider object id, e.g. Stripe PaymentIntent id. */
  providerPaymentId?: string;
  /** Last provider event id processed (idempotency for webhook retries). */
  providerEventId?: string;
};

export function paymentReceiptDocPath(paymentEventId: string): string {
  const safe = paymentEventId.trim().replace(/\//g, '_');
  return `${PAYMENT_RECEIPTS_COLLECTION}/${safe}`;
}
