/**
 * KNG Rewards — earn / redeem orchestration.
 * Persistence: `useKngLoyaltyStore` (AsyncStorage). Replace with ledger-backed events when finance signs off.
 */

import { findLoyaltyRewardById } from '../../config/loyaltyRewardsCatalog';
import { getOrCreateLoyaltySnapshot, useKngLoyaltyStore } from '../../state/kngLoyaltyStore';
import {
  VIG_TOKENS_PER_EUR_EARNING,
  vigTokensRemainingToNextTier,
  tierFromLifetimePoints,
  type VipTier,
} from '../../types/loyalty';

export type AwardPointsForTransactionResult = Readonly<{
  readonly vigTokensAdded: number;
  readonly newVigTokenBalance: number;
  readonly previousTier: VipTier;
  readonly newTier: VipTier;
}>;

export type RedeemPointsForRewardResult =
  | Readonly<{
      readonly ok: true;
      readonly remainingVigTokens: number;
      readonly perkLabel: string;
      readonly newTier: VipTier;
    }>
  | Readonly<{
      readonly ok: false;
      readonly code: 'unknown_reward' | 'insufficient_vig_tokens' | 'invalid_user';
      readonly message: string;
    }>;

const WELCOME_BONUS_VIG_TOKENS = 220 as const;

function uid(userId: string): string {
  return userId.trim();
}

/** Idempotent: ensures AsyncStorage hydration; seeds a small welcome balance once per user id. */
export async function bootstrapLoyaltyProfile(userId: string): Promise<void> {
  const id = uid(userId);
  if (id.length === 0) return;
  await useKngLoyaltyStore.getState().hydrate();
  const existing = useKngLoyaltyStore.getState().byUser[id];
  if (existing) return;
  const tier = tierFromLifetimePoints(WELCOME_BONUS_VIG_TOKENS);
  useKngLoyaltyStore.getState().upsertUser(id, {
    vigTokenBalance: WELCOME_BONUS_VIG_TOKENS,
    lifetimeVigTokensEarned: WELCOME_BONUS_VIG_TOKENS,
    tier,
  });
}

/**
 * Awards VIG Tokens from EUR-normalised spend (`amountEur` may be fractional).
 * Recomputes VIP tier from lifetime VIG Tokens earned.
 */
export function awardPointsForTransaction(userId: string, amountEur: number): AwardPointsForTransactionResult {
  const id = uid(userId);
  if (id.length === 0) {
    return {
      vigTokensAdded: 0,
      newVigTokenBalance: 0,
      previousTier: 'MEMBER',
      newTier: 'MEMBER',
    };
  }
  const eur = Number.isFinite(amountEur) && amountEur > 0 ? amountEur : 0;
  const vigTokensAdded = Math.floor(eur * VIG_TOKENS_PER_EUR_EARNING);
  const prev = getOrCreateLoyaltySnapshot(id);
  const previousTier = prev.tier;
  if (vigTokensAdded === 0) {
    return { vigTokensAdded: 0, newVigTokenBalance: prev.vigTokenBalance, previousTier, newTier: previousTier };
  }
  const nextLife = prev.lifetimeVigTokensEarned + vigTokensAdded;
  const nextBal = prev.vigTokenBalance + vigTokensAdded;
  const newTier = tierFromLifetimePoints(nextLife);
  useKngLoyaltyStore.getState().upsertUser(id, {
    vigTokenBalance: nextBal,
    lifetimeVigTokensEarned: nextLife,
    tier: newTier,
  });
  return { vigTokensAdded, newVigTokenBalance: nextBal, previousTier, newTier };
}

/**
 * Redeems a catalog reward; deducts VIG Token balance only.
 */
export function redeemPointsForReward(userId: string, rewardId: string): RedeemPointsForRewardResult {
  const id = uid(userId);
  if (id.length === 0) {
    return { ok: false, code: 'invalid_user', message: 'Thiếu định danh người dùng.' };
  }
  const reward = findLoyaltyRewardById(rewardId.trim());
  if (!reward) {
    return { ok: false, code: 'unknown_reward', message: 'Quà không tồn tại trong catalog.' };
  }
  const snap = getOrCreateLoyaltySnapshot(id);
  if (snap.vigTokenBalance < reward.vigTokenCost) {
    return {
      ok: false,
      code: 'insufficient_vig_tokens',
      message: `Bạn cần thêm ${reward.vigTokenCost - snap.vigTokenBalance} VIG Token để đổi quà này.`,
    };
  }
  const nextBal = snap.vigTokenBalance - reward.vigTokenCost;
  useKngLoyaltyStore.getState().upsertUser(id, {
    vigTokenBalance: nextBal,
    lifetimeVigTokensEarned: snap.lifetimeVigTokensEarned,
    tier: snap.tier,
  });
  return {
    ok: true,
    remainingVigTokens: nextBal,
    perkLabel: reward.titleVi,
    newTier: snap.tier,
  };
}

export function readLoyaltySummary(userId: string): Readonly<{
  vigTokens: number;
  tier: VipTier;
  toNext: number | null;
  lifetimeVigTokens: number;
}> {
  const id = uid(userId);
  const snap = getOrCreateLoyaltySnapshot(id);
  return {
    vigTokens: snap.vigTokenBalance,
    tier: snap.tier,
    toNext: vigTokensRemainingToNextTier(snap.lifetimeVigTokensEarned, snap.tier),
    lifetimeVigTokens: snap.lifetimeVigTokensEarned,
  };
}

/**
 * Direct VIG token grant hook for gamification / rewards engines.
 * `reason` is kept for future ledger/audit integration.
 */
export function awardPoints(
  userId: string,
  vigTokens: number,
  _reason: string
): Readonly<{ vigTokensAdded: number; newVigTokenBalance: number }> {
  const id = uid(userId);
  const grant = Number.isFinite(vigTokens) && vigTokens > 0 ? Math.floor(vigTokens) : 0;
  if (id.length === 0 || grant === 0) {
    return { vigTokensAdded: 0, newVigTokenBalance: 0 };
  }
  const snap = getOrCreateLoyaltySnapshot(id);
  const nextBal = snap.vigTokenBalance + grant;
  const nextLifetime = snap.lifetimeVigTokensEarned + grant;
  useKngLoyaltyStore.getState().upsertUser(id, {
    vigTokenBalance: nextBal,
    lifetimeVigTokensEarned: nextLifetime,
    tier: tierFromLifetimePoints(nextLifetime),
  });
  return { vigTokensAdded: grant, newVigTokenBalance: nextBal };
}

/**
 * Backend-only contract placeholder.
 * Monthly/financial reward distributions must be applied server-side with durable idempotency keys.
 */
export async function awardPointsServerOnlyContract(_params: Readonly<{
  parentId: string;
  amountVigTokens: number;
  reason: string;
  idempotencyKey: string;
}>): Promise<never> {
  throw new Error('loyalty_award_server_only');
}
