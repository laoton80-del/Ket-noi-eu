/**
 * Stripe Price ID → V7 SaaS tier mapping. **Server webhook must use the same map** (no drift).
 * Set `EXPO_PUBLIC_STRIPE_PRICE_POWER_ELITE` in EAS / Vercel to the live Price ID from Stripe Dashboard.
 */
import { B2B_POWER_TIER_USD } from './pricingConfig';

/** Power SaaS Elite — €139/mo product lane (display currency may vary; Price ID is authoritative). */
export const V7_POWER_ELITE_USD_MAJOR = B2B_POWER_TIER_USD;

const env = (k: string) => (typeof process !== 'undefined' && process.env?.[k]?.trim()) || '';

export const STRIPE_PRICE_ID_V7 = {
  /** Power tier — unlocks POWER_ELITE entitlements */
  POWER_ELITE_MONTHLY: env('EXPO_PUBLIC_STRIPE_PRICE_POWER_ELITE'),
  /** Pay-as-you-go / metered — optional second price */
  PAYG_METERED: env('EXPO_PUBLIC_STRIPE_PRICE_PAYG'),
  /** Wholesale Tier 3 — 1% lane (if sold as subscription SKU) */
  WHOLESALE_TIER3: env('EXPO_PUBLIC_STRIPE_PRICE_WHOLESALE'),
} as const;

/** Three B2B SaaS lanes — Price IDs are authoritative; display amounts are marketing hints only. */
export const V7_B2B_SAAS_TIER = {
  PAYG_METERED: 'PAYG_METERED',
  POWER_ELITE_MONTHLY: 'POWER_ELITE_MONTHLY',
  WHOLESALE_TIER3: 'WHOLESALE_TIER3',
} as const;

export type V7B2bSaasTierKey = (typeof V7_B2B_SAAS_TIER)[keyof typeof V7_B2B_SAAS_TIER];

/**
 * Maps Stripe Price ID → V7 tier key. Unknown / empty env IDs return `null` (webhook must still validate signature).
 */
export function resolveB2bSaasTierFromStripePriceId(priceId: string): V7B2bSaasTierKey | null {
  const p = priceId.trim();
  if (p.length === 0) return null;
  const { POWER_ELITE_MONTHLY, PAYG_METERED, WHOLESALE_TIER3 } = STRIPE_PRICE_ID_V7;
  if (POWER_ELITE_MONTHLY && p === POWER_ELITE_MONTHLY) return V7_B2B_SAAS_TIER.POWER_ELITE_MONTHLY;
  if (PAYG_METERED && p === PAYG_METERED) return V7_B2B_SAAS_TIER.PAYG_METERED;
  if (WHOLESALE_TIER3 && p === WHOLESALE_TIER3) return V7_B2B_SAAS_TIER.WHOLESALE_TIER3;
  return null;
}

/** Human labels for CMO dashboards — Power tier anchored at ~$139 USD display baseline. */
export const V7_B2B_SAAS_TIER_LABEL: Readonly<Record<V7B2bSaasTierKey, string>> = {
  PAYG_METERED: 'Tier 1 · VIG / metered (Pay-as-you-go)',
  POWER_ELITE_MONTHLY: `Tier 2 · Power SaaS Elite (~$${V7_POWER_ELITE_USD_MAJOR}/mo display anchor)`,
  WHOLESALE_TIER3: 'Tier 3 · Wholesale corridor (1% headline)',
};
