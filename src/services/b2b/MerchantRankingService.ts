/**
 * 90-Day Top Ranking trap — server-side orchestration (Node / Prisma only).
 * Do not import from React Native screens; use HTTP API + `merchantRankingLogic` on the client.
 */
import { BookStatus } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  computePaidCreditsAfterDailyBurn,
  evaluateMerchantRankingSnapshot,
  type MerchantRankingMetrics,
  type MerchantRankingResult,
  type MerchantRankingSnapshot,
} from './merchantRankingLogic';

export type { MerchantRankingResult, MerchantRankingSnapshot, MerchantRankingMetrics } from './merchantRankingLogic';
export {
  evaluateMerchantRankingSnapshot,
  computePaidCreditsAfterDailyBurn,
  DAILY_PAID_RANK_HOLD_VIG,
  FREE_HIGH_RANK_DAYS,
  HONEYMOON_LAST_DAY,
  SOFT_NUDGE_FIRST_DAY,
  SOFT_NUDGE_LAST_DAY,
  RED_ZONE_FIRST_DAY,
  RED_ZONE_LAST_DAY,
  LOCKOUT_DAY,
  serverCalendarDayNumberFromJoin,
  utcStartOfDayMs,
} from './merchantRankingLogic';

/**
 * Month-on-month growth of **completed** booking volume (VIG) for dashboard Stage 2 copy.
 */
async function computeMonthOnMonthGrowthPercent(businessId: string, now: Date): Promise<number> {
  const prisma = getPrisma();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const thisMonthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const lastMonthStart = new Date(Date.UTC(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, 1, 0, 0, 0, 0));

  const [thisMonth, lastMonth] = await Promise.all([
    prisma.booking.aggregate({
      where: {
        businessId,
        status: BookStatus.COMPLETED,
        timeSlot: { gte: thisMonthStart, lte: now },
      },
      _sum: { lockedAmountVIG: true },
    }),
    prisma.booking.aggregate({
      where: {
        businessId,
        status: BookStatus.COMPLETED,
        timeSlot: { gte: lastMonthStart, lt: thisMonthStart },
      },
      _sum: { lockedAmountVIG: true },
    }),
  ]);

  const cur = thisMonth._sum.lockedAmountVIG ?? 0;
  const prev = lastMonth._sum.lockedAmountVIG ?? 0;
  if (prev <= 0) {
    return cur > 0 ? 100 : 0;
  }
  return Math.round(((cur - prev) / prev) * 100);
}

/**
 * Loads `Business`, applies post-trial daily VIG burn when due, syncs `isPremiumRank`, returns status.
 */
export async function calculateMerchantRankingStatus(merchantId: string, now: Date = new Date()): Promise<MerchantRankingResult> {
  const prisma = getPrisma();

  const row = await prisma.business.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      joinedAt: true,
      paidAdCredits: true,
      lastAdCreditDeductionAt: true,
      isPremiumRank: true,
    },
  });

  if (!row) {
    throw new Error('business_not_found');
  }

  const snapshot: MerchantRankingSnapshot = {
    joinedAt: row.joinedAt,
    paidAdCredits: row.paidAdCredits,
    lastAdCreditDeductionAt: row.lastAdCreditDeductionAt,
  };

  const burn = computePaidCreditsAfterDailyBurn(snapshot, now);
  const afterBurn: MerchantRankingSnapshot = {
    joinedAt: row.joinedAt,
    paidAdCredits: burn.paidAdCredits,
    lastAdCreditDeductionAt: burn.lastAdCreditDeductionAt,
  };

  let metrics: MerchantRankingMetrics | undefined;
  try {
    const pct = await computeMonthOnMonthGrowthPercent(merchantId, now);
    metrics = { monthOnMonthGrowthPercent: pct };
  } catch {
    metrics = { monthOnMonthGrowthPercent: 0 };
  }

  const preliminary = evaluateMerchantRankingSnapshot(afterBurn, now, metrics);
  const isPremiumRank = preliminary.isPremiumRank;

  const lastOld = row.lastAdCreditDeductionAt?.getTime() ?? null;
  const lastNew = burn.lastAdCreditDeductionAt?.getTime() ?? null;
  const needsCreditWrite =
    burn.burnedVIG > 0 ||
    burn.paidAdCredits !== row.paidAdCredits ||
    lastOld !== lastNew ||
    row.isPremiumRank !== isPremiumRank;

  if (needsCreditWrite) {
    await prisma.business.update({
      where: { id: merchantId },
      data: {
        paidAdCredits: burn.paidAdCredits,
        lastAdCreditDeductionAt: burn.lastAdCreditDeductionAt,
        isPremiumRank,
      },
    });
  }

  return preliminary;
}
