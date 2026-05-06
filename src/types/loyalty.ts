/**
 * ViGlobal Rewards — VIG Token loyalty layer (ecosystem retention).
 * Earning rule: every **1 EUR** of qualifying spend → **10 VIG Tokens**.
 */

/** VIP ladder — unlocks visual status + future perks. */
export type VipTier = 'MEMBER' | 'SILVER' | 'GOLD' | 'DIAMOND';

export const VIP_TIER_ORDER: readonly VipTier[] = ['MEMBER', 'SILVER', 'GOLD', 'DIAMOND'] as const;

/** VIG Tokens earned per 1 EUR equivalent spent. */
export const VIG_TOKENS_PER_EUR_EARNING = 10 as const;
/** @deprecated Use `VIG_TOKENS_PER_EUR_EARNING`. */
export const KNG_POINTS_PER_EUR_EARNING = VIG_TOKENS_PER_EUR_EARNING;

/** Lifetime VIG token thresholds (exclusive upper bands from previous tier). */
export const LIFETIME_VIG_TOKENS_SILVER_MIN = 800 as const;
export const LIFETIME_VIG_TOKENS_GOLD_MIN = 4_000 as const;
export const LIFETIME_VIG_TOKENS_DIAMOND_MIN = 15_000 as const;
/** @deprecated Use `LIFETIME_VIG_TOKENS_SILVER_MIN`. */
export const LIFETIME_POINTS_SILVER_MIN = LIFETIME_VIG_TOKENS_SILVER_MIN;
/** @deprecated Use `LIFETIME_VIG_TOKENS_GOLD_MIN`. */
export const LIFETIME_POINTS_GOLD_MIN = LIFETIME_VIG_TOKENS_GOLD_MIN;
/** @deprecated Use `LIFETIME_VIG_TOKENS_DIAMOND_MIN`. */
export const LIFETIME_POINTS_DIAMOND_MIN = LIFETIME_VIG_TOKENS_DIAMOND_MIN;

export function tierFromLifetimeVigTokens(lifetimeVigTokensEarned: number): VipTier {
  const x = Math.max(0, Math.floor(lifetimeVigTokensEarned));
  if (x >= LIFETIME_VIG_TOKENS_DIAMOND_MIN) return 'DIAMOND';
  if (x >= LIFETIME_VIG_TOKENS_GOLD_MIN) return 'GOLD';
  if (x >= LIFETIME_VIG_TOKENS_SILVER_MIN) return 'SILVER';
  return 'MEMBER';
}
/** @deprecated Use `tierFromLifetimeVigTokens`. */
export const tierFromLifetimePoints = tierFromLifetimeVigTokens;

/** VIG Tokens still needed in lifetime bucket to reach the next tier; `null` when already DIAMOND. */
export function vigTokensRemainingToNextTier(lifetimeVigTokensEarned: number, tier: VipTier): number | null {
  if (tier === 'DIAMOND') return null;
  const x = Math.max(0, Math.floor(lifetimeVigTokensEarned));
  if (tier === 'MEMBER') return Math.max(0, LIFETIME_VIG_TOKENS_SILVER_MIN - x);
  if (tier === 'SILVER') return Math.max(0, LIFETIME_VIG_TOKENS_GOLD_MIN - x);
  return Math.max(0, LIFETIME_VIG_TOKENS_DIAMOND_MIN - x);
}
/** @deprecated Use `vigTokensRemainingToNextTier`. */
export const pointsRemainingToNextTier = vigTokensRemainingToNextTier;

export type LoyaltyRewardKind = 'voucher' | 'ai_minutes' | 'vig_tokens' | 'travel_perk';

export type LoyaltyRewardDefinition = Readonly<{
  readonly id: string;
  readonly titleVi: string;
  readonly subtitleVi: string;
  readonly vigTokenCost: number;
  readonly kind: LoyaltyRewardKind;
}>;
