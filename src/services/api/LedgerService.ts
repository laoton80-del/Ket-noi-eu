/**
 * Immutable charity accrual from **KNG net revenue** at settlement time (1% → `CharityLedgerEntry`).
 * UI aggregates **only** from this table — no client-side mock counters.
 */

import { Prisma } from '@prisma/client';

import { CREDIT_EXCHANGE_RATE_USD } from '../../config/pricingConfig';
import { getPrisma } from '../../lib/prisma';

/** Share of each KNG net revenue event allocated to the global charity pool. */
export const CHARITY_SHARE_OF_KNG_NET = 0.01 as const;

function roundMoney(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export type CharityTotalsDto = Readonly<{
  /** Sum of `charityAccrualVig` (ledger truth). */
  totalCharityVig: number;
  /** `totalCharityVig * CREDIT_EXCHANGE_RATE_USD` for USD display. */
  totalUsd: number;
  rowCount: number;
  updatedAtIso: string;
}>;

/**
 * Idempotent insert: one row per settled revenue event (`idempotencyKey`).
 */
export async function recordCharityAccrualForSettlement(
  tx: Prisma.TransactionClient,
  input: Readonly<{
    kngNetRevenueVig: number;
    idempotencyKey: string;
    sourceKind: string;
  }>
): Promise<void> {
  const key = input.idempotencyKey.trim();
  if (key.length === 0) return;
  const net = roundMoney(input.kngNetRevenueVig);
  if (!Number.isFinite(net) || net <= 0) return;

  const charity = roundMoney(net * CHARITY_SHARE_OF_KNG_NET);
  if (!Number.isFinite(charity) || charity <= 0) return;

  const existing = await tx.charityLedgerEntry.findUnique({
    where: { idempotencyKey: key },
    select: { id: true },
  });
  if (existing) return;

  await tx.charityLedgerEntry.create({
    data: {
      idempotencyKey: key,
      kngNetRevenueVig: net,
      charityAccrualVig: charity,
      sourceKind: input.sourceKind.trim().slice(0, 64),
    },
  });
}

/**
 * Aggregated totals for public charity display (Hub / Home widget).
 */
export async function getCharityLedgerTotals(): Promise<CharityTotalsDto> {
  const prisma = getPrisma();
  const [agg, latest] = await Promise.all([
    prisma.charityLedgerEntry.aggregate({
      _sum: { charityAccrualVig: true },
      _count: { _all: true },
    }),
    prisma.charityLedgerEntry.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);

  const totalCharityVig = roundMoney(agg._sum.charityAccrualVig ?? 0);
  const totalUsd = roundMoney(totalCharityVig * CREDIT_EXCHANGE_RATE_USD);

  return {
    totalCharityVig,
    totalUsd,
    rowCount: agg._count._all,
    updatedAtIso: (latest?.createdAt ?? new Date()).toISOString(),
  };
}
