import { normalizeCountryCodeOrSentinel, pricingTierForUsageDebits, resolveCountryPack } from '../config/countryPacks';
import { LETAN_BOOKING_CREDITS_BY_TIER, OUTBOUND_CALL_CREDITS_BY_TIER } from '../config/countryPacks/pricingByTier';
import { devWarn } from '../utils/devLog';

type PlatformIntentRequest = {
  amount: number;
  currency: string;
  comboId: string;
  idempotencyKey?: string;
  /** D8: normalized ISO2 or `ZZ` — same contract as `resolveCommercialCountryContext`. */
  commercialCountryCode?: string;
  /** D8: Stripe-safe merchant country from same context. */
  merchantCountryCode?: string;
  /** D8: pack display currency for payment-service alignment. */
  displayCurrency?: string;
};

type PlatformIntentResponse = {
  clientSecret?: string;
};

const PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? '';

/** True when the payments microservice base URL is configured (required for intents + verify). */
export function isPaymentsApiConfigured(): boolean {
  return PAYMENTS_API_BASE.length > 0;
}

/**
 * After a successful verify, the same `idempotencyKey` must be sent to `walletOps` topup as
 * `paymentEventId` so duplicate grants are impossible server-side.
 *
 * **Truth:** `verifyTopupCreditEntitlement` / `pollTopupCreditEntitlement` mean “payment path says the
 * user may receive this top-up” (e.g. provider captured + backend marked entitled). It does **not** mean
 * Credits are already on the wallet — that only happens after `topupCreditsServer` succeeds.
 *
 * Webhook-authoritative mode: a payment provider webhook should write
 * `platform_payment_receipts/{paymentEventId}` (see `functions/src/payments/paymentReceiptModel.ts`);
 * enable `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` on Functions so topup requires `status: paid` first (`docs/RECEIPT_STRICTNESS.md`).
 */
type VerifyTopupEntitlementRequest = {
  country: string;
  comboId: string;
  provider: 'platform_pay';
  idempotencyKey?: string;
};

/** Backend verify response — not the same as wallet credit applied. */
type VerifyTopupEntitlementResponse = {
  /** Payment side already recorded grant (optional; depends on backend). */
  credited?: boolean;
  /** User is allowed to proceed to server topup (payment service path). */
  entitlement_active?: boolean;
};

export type CallCreditPriceQuote = {
  country: string;
  /** Outbound Leona debit unit: Credits (tier from country pack). */
  creditsPerCall: number;
  /** @deprecated Alias for `creditsPerCall` (legacy name). */
  basePerCallCzk: number;
  localAmount: number;
  currencyCode: string;
  amountLabel: string;
};

export type LeTanBookingPriceQuote = {
  country: string;
  creditsPerBooking: number;
  localAmount: number;
  currencyCode: 'CREDITS';
  amountLabel: string;
};

/** Empty/missing → `GLOBAL_UNLISTED_COUNTRY_PACK` sentinel `ZZ` (matches `resolveCountryPack`). */
function normalizeCountry(input?: string): string {
  return resolveCountryPack(input).countryCode;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
}

export function calculateCallCreditPrice(userCountry?: string): CallCreditPriceQuote {
  const country = normalizeCountry(userCountry);
  const tier = pricingTierForUsageDebits(country);
  const creditsPerCall = OUTBOUND_CALL_CREDITS_BY_TIER[tier];

  return {
    country,
    creditsPerCall,
    basePerCallCzk: creditsPerCall,
    localAmount: creditsPerCall,
    currencyCode: 'CREDITS',
    amountLabel: `${formatMoney(creditsPerCall)} Credits/cuộc`,
  };
}

export function calculateLeTanBookingPrice(userCountry?: string): LeTanBookingPriceQuote {
  const country = normalizeCountry(userCountry);
  const tier = pricingTierForUsageDebits(country);
  const creditsPerBooking = LETAN_BOOKING_CREDITS_BY_TIER[tier];
  return {
    country,
    creditsPerBooking,
    localAmount: creditsPerBooking,
    currencyCode: 'CREDITS',
    amountLabel: `${creditsPerBooking} Credits/lượt`,
  };
}

export async function createPlatformPayIntent(input: PlatformIntentRequest): Promise<string | null> {
  if (!isPaymentsApiConfigured()) {
    devWarn('payments', 'EXPO_PUBLIC_PAYMENTS_API_BASE is unset — top-up intents disabled');
    return null;
  }
  try {
    const res = await fetch(`${PAYMENTS_API_BASE}/platform-pay/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      devWarn('payments', 'platform_pay_intent_http_error', { status: res.status });
      return null;
    }
    const data = (await res.json()) as PlatformIntentResponse;
    return typeof data.clientSecret === 'string' && data.clientSecret.length > 0 ? data.clientSecret : null;
  } catch {
    return null;
  }
}

export async function verifyTopupCreditEntitlement(input: VerifyTopupEntitlementRequest): Promise<boolean> {
  if (!PAYMENTS_API_BASE) return false;
  const country = normalizeCountryCodeOrSentinel(input.country);
  try {
    const res = await fetch(`${PAYMENTS_API_BASE}/wallet/topup/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, country }),
    });
    if (!res.ok) {
      devWarn('payments', 'topup_verify_http_error', { status: res.status });
      return false;
    }
    const data = (await res.json()) as VerifyTopupEntitlementResponse;
    return data.credited === true || data.entitlement_active === true;
  } catch {
    return false;
  }
}

export async function pollTopupCreditEntitlement(
  input: VerifyTopupEntitlementRequest,
  retries = 5,
  delayMs = 2000
): Promise<boolean> {
  for (let i = 0; i < retries; i += 1) {
    const verified = await verifyTopupCreditEntitlement(input);
    if (verified) return true;
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}
