/**
 * VIG utility token — **closed-loop economy** (fiat purchase → in-app burn only).
 * **Withdrawal to fiat is prohibited** — use {@link assertVigFiatWithdrawalForbidden} at any cash-out path.
 *
 * Peg is **policy-defined** in minor units (1 VIG minor ≡ 1 fiat minor at peg baseline for accounting).
 * Tune `EXPO_PUBLIC_VIG_FIAT_PEG_MINOR_PER_MINOR` or replace with Supabase `system_config` in production.
 */

export type VigServiceBurnType = 'B2B_LEAD' | 'SEO_RANKING';

/** 1 fiat minor unit (e.g. 1 cent) buys this many VIG minors at list peg (integer math). */
const DEFAULT_VIG_PER_FIAT_MINOR = 1 as const;

function pegVigPerFiatMinor(): number {
  const raw = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_VIG_FIAT_PEG_MINOR_PER_MINOR : undefined;
  const n = raw != null && raw.trim() !== '' ? Number.parseInt(raw, 10) : NaN;
  if (Number.isInteger(n) && n > 0) return n;
  return DEFAULT_VIG_PER_FIAT_MINOR;
}

const B2B_LEAD_BURN_MULTIPLIER_BPS = 10_000 as const;
const SEO_RANKING_BURN_MULTIPLIER_BPS = 12_000 as const;

export type VigBurnResult = Readonly<{
  serviceType: VigServiceBurnType;
  /** Input fiat in smallest currency unit (e.g. cents). */
  fiatValueMinor: number;
  /** VIG to burn from wallet for this service — always ≥ 0 integer. */
  vigBurnMinor: number;
  /** One-way path: Fiat → VIG (purchase) → burn; never reverse. */
  economy: 'closed_loop';
}>;

/**
 * Calculates VIG burn for a metered service. Uses **bps multipliers** on peg so SEO ranking can cost more VIG per fiat.
 */
export function calculateVigBurnForService(
  serviceType: VigServiceBurnType,
  fiatValueMinor: number
): VigBurnResult {
  if (!Number.isInteger(fiatValueMinor) || fiatValueMinor < 0) {
    throw new Error('VigToken: fiatValueMinor must be a non-negative integer (minor units)');
  }
  const peg = pegVigPerFiatMinor();
  const baseVig = fiatValueMinor * peg;
  const multBps = serviceType === 'B2B_LEAD' ? B2B_LEAD_BURN_MULTIPLIER_BPS : SEO_RANKING_BURN_MULTIPLIER_BPS;
  const vigBurnMinor = Math.ceil((baseVig * multBps) / 10_000);
  return {
    serviceType,
    fiatValueMinor,
    vigBurnMinor,
    economy: 'closed_loop',
  };
}

/**
 * Call at **every** attempted fiat withdrawal / off-ramp; must throw to block illegal redemption.
 */
export function assertVigFiatWithdrawalForbidden(context: string): never {
  throw new Error(
    `VIG_CLOSED_LOOP: withdrawal to fiat is prohibited (${context}). Use VIO Credits only within VIONA in-app services — not withdrawable cash.`
  );
}

/** Type-level guard: wallet settlement may only target in-app ledgers, not bank rails. */
export type VigSettlementTarget = 'service_burn' | 'merchant_credit' | 'platform_fee_pool';

export function isAllowedVigSettlementTarget(t: string): t is VigSettlementTarget {
  return t === 'service_burn' || t === 'merchant_credit' || t === 'platform_fee_pool';
}
