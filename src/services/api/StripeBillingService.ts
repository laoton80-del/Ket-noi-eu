/**
 * Dynamic Stripe cost recovery + mandatory KNG net margin (ViGlobal guardrails).
 * Replaces flat `2.5% + $0.30` with **method-aware** acquirer estimates + **1% of gross** platform net.
 *
 * All fee math uses **integer minor units** (cents) to avoid float drift; VIG is treated 1:1 with EUR major for settlement.
 *
 * **Ironclad Seal:** PaymentIntents and Supabase money payloads for the live rail use **EUR minor units only**
 * — see `src/constants/V7FinancialRules.ts` and `createPaymentIntentParamsFromV7Plan` in `services/billing/StripeBillingService.ts`.
 */

export type SettlementCurrency = 'EUR' | 'USD';

/**
 * Coarse payment rails — map from Stripe `payment_method_details` in production webhooks.
 */
export type StripePaymentRail =
  | 'eu_card_consumer'
  | 'us_card_consumer'
  | 'amex'
  | 'sepa_debit'
  | 'default_card';

/** 1% of gross = 100 basis points of amount_minor */
export const KNG_NET_MARGIN_BPS = 100 as const;

type FeeSchedule = Readonly<{
  /** Variable fee in basis points of authorization amount (e.g. 290 = 2.90%). */
  variableBps: number;
  fixedMinor: Readonly<Record<SettlementCurrency, number>>;
}>;

const RAILS: Readonly<Record<StripePaymentRail, FeeSchedule>> = {
  /** EU/EEA consumer cards (Stripe EU blended — illustrative; tune from Sigma). */
  eu_card_consumer: {
    variableBps: 150,
    fixedMinor: { EUR: 25, USD: 30 },
  },
  us_card_consumer: {
    variableBps: 290,
    fixedMinor: { EUR: 30, USD: 30 },
  },
  amex: {
    variableBps: 360,
    fixedMinor: { EUR: 30, USD: 30 },
  },
  sepa_debit: {
    variableBps: 35,
    fixedMinor: { EUR: 8, USD: 10 },
  },
  default_card: {
    variableBps: 280,
    fixedMinor: { EUR: 30, USD: 30 },
  },
};

function assertNonNegativeMinor(n: number): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('stripe_billing: minor units must be non-negative integers');
  }
}

export function majorToMinorUnits(major: number): number {
  if (!Number.isFinite(major) || major < 0) return 0;
  return Math.round(major * 100);
}

export function minorUnitsToMajor(minor: number): number {
  if (!Number.isFinite(minor)) return 0;
  return Math.round(minor) / 100;
}

/**
 * Stripe’s portion (pass-through) — **ceil** variable % so we never under-reserve acquirer cost.
 */
export function estimateStripeProcessingFeeMinor(
  amountMinor: number,
  rail: StripePaymentRail,
  currency: SettlementCurrency
): number {
  assertNonNegativeMinor(amountMinor);
  const sch = RAILS[rail];
  const fixed = sch.fixedMinor[currency] ?? sch.fixedMinor.EUR;
  const variable = Math.ceil((amountMinor * sch.variableBps) / 10_000);
  return variable + fixed;
}

export type DynamicPlatformRecovery = Readonly<{
  currency: SettlementCurrency;
  rail: StripePaymentRail;
  grossAmountMinor: number;
  stripeProcessingFeeMinor: number;
  /** Strict 1.0% of gross charged amount (KNG net profit margin on volume). */
  kngNetMarginMinor: number;
  /** Total the platform must recover from the transaction to avoid absorbing Stripe + earn net margin. */
  totalPlatformRecoveryMinor: number;
}>;

/**
 * **Dynamic markup:** `totalRecovery = stripeFeeEstimate + ceil(gross * 1%)`.
 * Caller passes the **customer-charged gross** in major units for the rail used.
 */
export function computeDynamicPlatformRecovery(input: Readonly<{
  grossAmountMajor: number;
  currency: SettlementCurrency;
  rail: StripePaymentRail;
}>): DynamicPlatformRecovery {
  const grossMinor = majorToMinorUnits(input.grossAmountMajor);
  const stripeMinor = estimateStripeProcessingFeeMinor(grossMinor, input.rail, input.currency);
  const kngMarginMinor = Math.ceil((grossMinor * KNG_NET_MARGIN_BPS) / 10_000);
  return {
    currency: input.currency,
    rail: input.rail,
    grossAmountMinor: grossMinor,
    stripeProcessingFeeMinor: stripeMinor,
    kngNetMarginMinor: kngMarginMinor,
    totalPlatformRecoveryMinor: stripeMinor + kngMarginMinor,
  };
}

/**
 * Allocates a proportional share of estimated acquirer cost to the **platform fee VIG pool**
 * when settlement runs on `totalPaidVIG` (wallet / card).
 */
export function estimateKngNetPlatformVigAfterAcquirer(
  grossPlatformFeePoolVig: number,
  totalSettlementVig: number,
  rail: StripePaymentRail,
  currency: SettlementCurrency
): number {
  const pool = minorUnitsToMajor(majorToMinorUnits(grossPlatformFeePoolVig));
  const total = minorUnitsToMajor(majorToMinorUnits(totalSettlementVig));
  if (pool <= 0 || total <= 0) return 0;

  const totalMinor = majorToMinorUnits(total);
  const stripeOnTotalMinor = estimateStripeProcessingFeeMinor(totalMinor, rail, currency);
  const ratio = pool / total;
  const allocatedStripeMinor = Math.ceil(stripeOnTotalMinor * ratio);
  const poolMinor = majorToMinorUnits(pool);
  const netMinor = Math.max(0, poolMinor - allocatedStripeMinor);
  return minorUnitsToMajor(netMinor);
}

// —— V7 OMNIVERSE — Dual Split-Fee (platform policy, separate from Stripe acquirer estimates above) ——

/** Merchant-side platform take — **5%** of service gross (500 bps). */
export const V7_MERCHANT_PLATFORM_FEE_BPS = 500 as const;

/** Tier 3 Wholesale — **1%** merchant cut on service gross (replaces 5%). */
export const V7_WHOLESALE_MERCHANT_FEE_BPS = 100 as const;

/**
 * Tourist “Trust Fee” band — **5–7%** of authorized gross (dispute / protection pool).
 * Pick concrete bps per product lane; clamp with {@link computeV7DualSplitFeesMinor}.
 */
export const V7_TOURIST_TRUST_FEE_BPS_MIN = 500 as const;
export const V7_TOURIST_TRUST_FEE_BPS_MAX = 700 as const;

export type V7DualSplitFeeMinor = Readonly<{
  grossAmountMinor: number;
  merchantPlatformFeeMinor: number;
  touristTrustFeeMinor: number;
}>;

/**
 * Computes **parallel** policy fees on the same service gross: **merchant platform %** + **tourist trust (5–7%)**.
 * Standard merchants: 5% unless `merchantPlatformFeeBps` is set. Tier 3 Wholesale: pass {@link V7_WHOLESALE_MERCHANT_FEE_BPS}.
 * Does **not** include Stripe acquirer cost — combine with {@link estimateStripeProcessingFeeMinor} at settlement design time.
 */
export function computeV7DualSplitFeesMinor(input: Readonly<{
  grossAmountMinor: number;
  touristTrustBps: number;
  /** Defaults to {@link V7_MERCHANT_PLATFORM_FEE_BPS}. */
  merchantPlatformFeeBps?: number;
}>): V7DualSplitFeeMinor {
  assertNonNegativeMinor(input.grossAmountMinor);
  const clampedTrust = Math.min(
    V7_TOURIST_TRUST_FEE_BPS_MAX,
    Math.max(V7_TOURIST_TRUST_FEE_BPS_MIN, Math.round(input.touristTrustBps))
  );
  const merchantBps = input.merchantPlatformFeeBps ?? V7_MERCHANT_PLATFORM_FEE_BPS;
  const merchantPlatformFeeMinor = Math.ceil((input.grossAmountMinor * merchantBps) / 10_000);
  const touristTrustFeeMinor = Math.ceil((input.grossAmountMinor * clampedTrust) / 10_000);
  return {
    grossAmountMinor: input.grossAmountMinor,
    merchantPlatformFeeMinor,
    touristTrustFeeMinor,
  };
}
