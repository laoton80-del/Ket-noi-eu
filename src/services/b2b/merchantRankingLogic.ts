/**
 * 90-Day Merchant Lock-in — pure evaluation (safe for Expo client bundles).
 * Calendar days use **UTC midnight** boundaries (server-standard “end of day”).
 * Server path applies VIG burns + Prisma persistence in `MerchantRankingService.ts`.
 */

export const FREE_HIGH_RANK_DAYS = 90;
/** Last calendar day of Stage 1 — Honeymoon (no pressure UI). */
export const HONEYMOON_LAST_DAY = 60;
/** Stage 2 — Soft nudge (days 61–82). */
export const SOFT_NUDGE_FIRST_DAY = 61;
export const SOFT_NUDGE_LAST_DAY = 82;
/** Stage 3 — Red zone (days 83–90). */
export const RED_ZONE_FIRST_DAY = 83;
export const RED_ZONE_LAST_DAY = 90;
/** First day of paid enforcement / lockout if `paidAdCredits` is 0. */
export const LOCKOUT_DAY = 91;

/** @deprecated Use HONEYMOON_LAST_DAY / SOFT_NUDGE_LAST_DAY */
export const VIP_TRIAL_LAST_DAY = HONEYMOON_LAST_DAY;
/** @deprecated Use RED_ZONE_FIRST_DAY */
export const WARNING_FIRST_DAY = RED_ZONE_FIRST_DAY;
/** @deprecated Use LOCKOUT_DAY */
export const LOCK_DAY = LOCKOUT_DAY;

export const DAILY_PAID_RANK_HOLD_VIG = 1;

const MS_PER_DAY = 86_400_000;

/** Start of UTC calendar day (00:00:00.000Z) for an instant. */
export function utcStartOfDayMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * 1-based calendar day since join: **Day 1** = the merchant’s UTC join date (same as `joinedAt`’s calendar day).
 * Transitions occur at UTC midnight.
 */
export function serverCalendarDayNumberFromJoin(joinedAt: Date, now: Date): number {
  const joinStart = utcStartOfDayMs(joinedAt);
  const nowStart = utcStartOfDayMs(now);
  const diffDays = Math.floor((nowStart - joinStart) / MS_PER_DAY);
  return diffDays + 1;
}

/** @deprecated Prefer `serverCalendarDayNumberFromJoin` (UTC calendar days). */
export function utcDaysSinceJoined(joinedAt: Date, now: Date): number {
  const delta = now.getTime() - joinedAt.getTime();
  if (delta < 0) return 0;
  return Math.floor(delta / MS_PER_DAY);
}

/** @deprecated Prefer `serverCalendarDayNumberFromJoin`. */
export function dayNumberFromJoin(joinedAt: Date, now: Date): number {
  return serverCalendarDayNumberFromJoin(joinedAt, now);
}

export type MerchantRankingSnapshot = Readonly<{
  joinedAt: Date;
  paidAdCredits: number;
  lastAdCreditDeductionAt: Date | null;
}>;

/** Growth metric for Stage 2 copy (computed server-side; default 0). */
export type MerchantRankingMetrics = Readonly<{
  monthOnMonthGrowthPercent: number;
}>;

export type MerchantRankingResult =
  | Readonly<{
      status: 'VIP_TRIAL';
      dayNumber: number;
      isRankedHigh: true;
      isPremiumRank: true;
    }>
  | Readonly<{
      status: 'TRIAL_EXPIRING_SOON';
      dayNumber: number;
      /** Whole days of premium placement left including today through end of day 90. */
      premiumRankingDaysLeft: number;
      monthOnMonthGrowthPercent: number;
      isRankedHigh: true;
      isPremiumRank: true;
    }>
  | Readonly<{
      status: 'CRITICAL_LOCKOUT';
      dayNumber: number;
      /** Calendar days until Top-1 placement drops (until start of day 91). */
      daysUntilRankDrop: number;
      isRankedHigh: true;
      isPremiumRank: true;
      /** Downstream: enqueue Leona retention push / automated call (dedupe per merchant per day). */
      leonaRetentionNudgeRecommended: true;
    }>
  | Readonly<{
      status: 'PAID_VIP';
      dayNumber: number;
      isRankedHigh: true;
      isPremiumRank: true;
      paidAdCredits: number;
    }>
  | Readonly<{
      status: 'LOCKED_RANK';
      dayNumber: number;
      isRankedHigh: false;
      isPremiumRank: false;
      alert: string;
    }>;

const LOCK_COPY = 'Ranking dropped. Top up now or subscribe to Power SaaS.';

/**
 * First instant **after** the 90 free calendar days (start of day `LOCKOUT_DAY`).
 */
function lockoutInstantUtc(joinedAt: Date): Date {
  return new Date(utcStartOfDayMs(joinedAt) + FREE_HIGH_RANK_DAYS * MS_PER_DAY);
}

/**
 * Computes post–day-90 daily burn from paid ad credits (idempotent using `lastAdCreditDeductionAt`).
 */
export function computePaidCreditsAfterDailyBurn(
  snapshot: MerchantRankingSnapshot,
  now: Date
): Readonly<{ paidAdCredits: number; lastAdCreditDeductionAt: Date | null; burnedVIG: number }> {
  const { joinedAt, paidAdCredits: startCredits, lastAdCreditDeductionAt } = snapshot;
  const dayNum = serverCalendarDayNumberFromJoin(joinedAt, now);
  if (dayNum < LOCKOUT_DAY || startCredits <= 0) {
    return {
      paidAdCredits: Math.max(0, startCredits),
      lastAdCreditDeductionAt,
      burnedVIG: 0,
    };
  }

  const trialEndInstant = lockoutInstantUtc(joinedAt);
  const anchor = lastAdCreditDeductionAt ?? trialEndInstant;
  if (now.getTime() <= anchor.getTime()) {
    return { paidAdCredits: startCredits, lastAdCreditDeductionAt, burnedVIG: 0 };
  }

  const wholeDays = Math.floor((now.getTime() - anchor.getTime()) / MS_PER_DAY);
  if (wholeDays < 1) {
    return { paidAdCredits: startCredits, lastAdCreditDeductionAt, burnedVIG: 0 };
  }

  const maxBurn = wholeDays * DAILY_PAID_RANK_HOLD_VIG;
  const burned = Math.min(startCredits, maxBurn);
  const remaining = Math.max(0, startCredits - burned);
  const newLast = new Date(anchor.getTime() + wholeDays * MS_PER_DAY);

  return {
    paidAdCredits: remaining,
    lastAdCreditDeductionAt: newLast,
    burnedVIG: burned,
  };
}

function defaultMetrics(metrics: MerchantRankingMetrics | undefined): MerchantRankingMetrics {
  const raw = metrics?.monthOnMonthGrowthPercent;
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  return { monthOnMonthGrowthPercent: Math.round(Math.min(999, Math.max(-100, n))) };
}

/**
 * Pure status for UI + API — pass **post-burn** credits if server already applied deduction.
 */
export function evaluateMerchantRankingSnapshot(
  snapshot: MerchantRankingSnapshot,
  now: Date = new Date(),
  metrics?: MerchantRankingMetrics
): MerchantRankingResult {
  const dayNumber = serverCalendarDayNumberFromJoin(snapshot.joinedAt, now);
  const growth = defaultMetrics(metrics);

  if (dayNumber < LOCKOUT_DAY) {
    if (dayNumber <= HONEYMOON_LAST_DAY) {
      return {
        status: 'VIP_TRIAL',
        dayNumber,
        isRankedHigh: true,
        isPremiumRank: true,
      };
    }

    if (dayNumber <= SOFT_NUDGE_LAST_DAY) {
      const premiumRankingDaysLeft = Math.max(0, RED_ZONE_LAST_DAY - dayNumber + 1);
      return {
        status: 'TRIAL_EXPIRING_SOON',
        dayNumber,
        premiumRankingDaysLeft,
        monthOnMonthGrowthPercent: growth.monthOnMonthGrowthPercent,
        isRankedHigh: true,
        isPremiumRank: true,
      };
    }

    const daysUntilRankDrop = Math.max(0, LOCKOUT_DAY - dayNumber);
    return {
      status: 'CRITICAL_LOCKOUT',
      dayNumber,
      daysUntilRankDrop,
      isRankedHigh: true,
      isPremiumRank: true,
      leonaRetentionNudgeRecommended: true,
    };
  }

  const credits = Math.max(0, snapshot.paidAdCredits);
  if (credits > 0) {
    return {
      status: 'PAID_VIP',
      dayNumber,
      isRankedHigh: true,
      isPremiumRank: true,
      paidAdCredits: credits,
    };
  }

  return {
    status: 'LOCKED_RANK',
    dayNumber,
    isRankedHigh: false,
    isPremiumRank: false,
    alert: LOCK_COPY,
  };
}
