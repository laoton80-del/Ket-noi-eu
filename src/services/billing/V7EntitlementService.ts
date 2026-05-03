/**
 * V7 SaaS fulfillment — maps **Stripe subscription checkout** to **merchant tier** mutations.
 * **No phantom access:** if `priceId` is unknown, return `ok: false` — do not grant tier.
 * Wire `handleStripeSubscriptionSuccess` from `customer.subscription.created|updated` webhooks (server)
 * or Stripe SDK after successful payment — same types apply.
 *
 * **EU VAT:** For B2B SaaS (e.g. Power ~$139) and VIG token top-ups, Stripe Checkout / PaymentIntents created
 * **server-side** must merge {@link V7_CHECKOUT_SESSION_TAX_AND_INVOICE} — `automatic_tax` + `invoice_creation`.
 */

import { STRIPE_PRICE_ID_V7 } from '../../config/stripeEntitlements';

/** Stripe Checkout Session / PaymentIntent nested params (API 2024+ shape — pass through your Node API). */
export type V7StripeTaxAndInvoiceParams = Readonly<{
  automatic_tax: { enabled: true };
  invoice_creation: { enabled: true };
}>;

/**
 * Supreme Audit — **mandatory** on Checkout Sessions for **Power tier** SaaS and **VIG wallet top-up** lines
 * so EU VAT is calculated and a **Stripe invoice** is emitted for audit defense.
 */
export const V7_CHECKOUT_SESSION_TAX_AND_INVOICE: V7StripeTaxAndInvoiceParams = {
  automatic_tax: { enabled: true },
  invoice_creation: { enabled: true },
};

/**
 * Merge tax + invoice flags into a Checkout Session payload (server builds the final `fetch` to Stripe).
 */
export function mergeCheckoutSessionEuVatCompliance<T extends Record<string, unknown>>(base: T): T & { metadata: Record<string, string> } {
  const meta =
    typeof base.metadata === 'object' && base.metadata !== null && !Array.isArray(base.metadata)
      ? (base.metadata as Record<string, string>)
      : {};
  return {
    ...base,
    ...V7_CHECKOUT_SESSION_TAX_AND_INVOICE,
    metadata: {
      ...meta,
      v7_eu_vat: 'automatic_tax_and_invoice',
      v7_compliance_tier: 'supreme_audit',
    },
  } as T & { metadata: Record<string, string> };
}

/**
 * PaymentIntent-only top-ups (if you use PI instead of Checkout): enable automatic tax on the **Customer**
 * and still prefer Checkout + invoice for B2B. Documented for webhook parity.
 */
export function paymentIntentMetadataVigTopUpEuVat(): Readonly<Record<string, string>> {
  return {
    v7_product_lane: 'vig_token_topup',
    v7_eu_vat: 'requires_checkout_invoice_or_server_tax',
  };
}

export type V7MerchantSaaSTier = 'FREE' | 'PAY_AS_YOU_GO' | 'POWER_ELITE' | 'WHOLESALE_TIER3';

export type V7MerchantEntitlementMutation = Readonly<{
  schema: 'public';
  table: 'merchants';
  operation: 'update';
  match: Readonly<{ stripe_customer_id: string }>;
  set: Readonly<{
    tier: V7MerchantSaaSTier;
    subscription_price_id: string;
    subscription_active: boolean;
    entitlements_updated_at: string;
  }>;
}>;

export type V7StripeSubscriptionSuccessOk = Readonly<{
  ok: true;
  customerId: string;
  priceId: string;
  resolvedTier: V7MerchantSaaSTier;
  mutation: V7MerchantEntitlementMutation;
  /** Feature flags to flip in app config row or JSON column — server may expand */
  unlockedFeatures: readonly string[];
}>;

export type V7StripeSubscriptionSuccessErr = Readonly<{
  ok: false;
  code: 'unknown_price' | 'invalid_customer' | 'invalid_price';
  message: string;
}>;

export type V7StripeSubscriptionSuccessResult = V7StripeSubscriptionSuccessOk | V7StripeSubscriptionSuccessErr;

const POWER_FEATURES = [
  'ai_receptionist_unlimited',
  'vip_client_profiles',
  'booking_intelligence',
  'dark_mode_reports',
] as const;

const PAYG_FEATURES = ['ai_receptionist_metered', 'vig_wallet_topup'] as const;

const WHOLESALE_FEATURES = ['wholesale_corridor_1pct', 'b2b_supply_listing'] as const;

/**
 * Resolve Stripe Price ID → internal tier. Unknown IDs return null (strict).
 */
export function mapStripePriceIdToV7Tier(priceId: string): V7MerchantSaaSTier | null {
  const p = priceId.trim();
  if (p.length === 0) return null;
  if (STRIPE_PRICE_ID_V7.POWER_ELITE_MONTHLY && p === STRIPE_PRICE_ID_V7.POWER_ELITE_MONTHLY) {
    return 'POWER_ELITE';
  }
  if (STRIPE_PRICE_ID_V7.PAYG_METERED && p === STRIPE_PRICE_ID_V7.PAYG_METERED) {
    return 'PAY_AS_YOU_GO';
  }
  if (STRIPE_PRICE_ID_V7.WHOLESALE_TIER3 && p === STRIPE_PRICE_ID_V7.WHOLESALE_TIER3) {
    return 'WHOLESALE_TIER3';
  }
  return null;
}

function featuresForTier(tier: V7MerchantSaaSTier): readonly string[] {
  if (tier === 'POWER_ELITE') return [...POWER_FEATURES];
  if (tier === 'PAY_AS_YOU_GO') return [...PAYG_FEATURES];
  if (tier === 'WHOLESALE_TIER3') return [...WHOLESALE_FEATURES];
  return [];
}

/**
 * Webhook-shaped handler: returns a **Supabase mutation object** or explicit failure (no silent grants).
 */
export function handleStripeSubscriptionSuccess(
  customerId: string,
  priceId: string
): V7StripeSubscriptionSuccessResult {
  const stripeCustomerId = customerId.trim();
  const pid = priceId.trim();
  if (stripeCustomerId.length === 0) {
    return { ok: false, code: 'invalid_customer', message: 'stripe_customer_id required' };
  }
  if (pid.length === 0) {
    return { ok: false, code: 'invalid_price', message: 'price_id required' };
  }

  const resolvedTier = mapStripePriceIdToV7Tier(pid);
  if (resolvedTier == null) {
    return {
      ok: false,
      code: 'unknown_price',
      message:
        'Unknown Stripe price_id — refusing to grant entitlements. Configure EXPO_PUBLIC_STRIPE_PRICE_* env keys.',
    };
  }

  const now = new Date().toISOString();
  const mutation: V7MerchantEntitlementMutation = {
    schema: 'public',
    table: 'merchants',
    operation: 'update',
    match: { stripe_customer_id: stripeCustomerId },
    set: {
      tier: resolvedTier,
      subscription_price_id: pid,
      subscription_active: true,
      entitlements_updated_at: now,
    },
  };

  return {
    ok: true,
    customerId: stripeCustomerId,
    priceId: pid,
    resolvedTier,
    mutation,
    unlockedFeatures: [...featuresForTier(resolvedTier)],
  };
}
