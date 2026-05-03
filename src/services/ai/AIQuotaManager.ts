/**
 * **Pillar 5 — Market protections (API bankruptcy shield).**
 *
 * Client-side **AI token budget** for free tier — hard daily cap via {@link FREE_TIER_DAILY_TOKEN_BUDGET}.
 * Authoritative metering remains server-side; this is a **defensive pre-check** + local ledger.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SubscriptionPlan } from '../../context/authTypes';

/** Hard cap for `subscriptionPlan === 'free'` (estimated tokens per calendar day, local device). */
export const FREE_TIER_DAILY_TOKEN_BUDGET = 5_000 as const;

const STORAGE_PREFIX = 'ketnoieu.aiQuota.v1.';

export class QuotaExceededError extends Error {
  readonly code = 'QUOTA_EXCEEDED' as const;

  constructor(message = 'QUOTA_EXCEEDED') {
    super(message);
    this.name = 'QuotaExceededError';
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function ledgerKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId.trim()}.${utcDayKey()}`;
}

function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan === 'premium' || plan === 'combo';
}

/**
 * Reserves `requiredTokens` from the user’s **daily free-tier pool** (AsyncStorage).
 * Paid plans (`premium` / `combo`) skip the client cap.
 *
 * @throws QuotaExceededError when the free-tier pool cannot satisfy the request.
 */
export async function checkAndConsumeQuota(
  userId: string,
  requiredTokens: number,
  opts?: Readonly<{ subscriptionPlan?: SubscriptionPlan }>
): Promise<void> {
  const uid = userId.trim();
  if (uid.length === 0) {
    throw new Error('AIQuota: userId required');
  }
  const plan = opts?.subscriptionPlan ?? 'free';
  if (isPaidPlan(plan)) {
    return;
  }
  const n = Math.max(0, Math.ceil(requiredTokens));
  if (n === 0) return;

  const key = ledgerKey(uid);
  const raw = await AsyncStorage.getItem(key);
  const prev = raw != null ? Number.parseInt(raw, 10) : 0;
  const used = Number.isFinite(prev) && prev >= 0 ? prev : 0;

  if (used + n > FREE_TIER_DAILY_TOKEN_BUDGET) {
    throw new QuotaExceededError();
  }

  await AsyncStorage.setItem(key, String(used + n));
}

/** Test / admin — reset today’s ledger for a user. */
export async function __dangerResetDailyQuotaForTests(userId: string): Promise<void> {
  await AsyncStorage.removeItem(ledgerKey(userId.trim()));
}
