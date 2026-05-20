import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  type PrismaClient,
} from '@prisma/client';

export const LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON = 'MERCHANT_REVIEW_TIMEOUT' as const;

export const LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION = true as const;

const EXPIRABLE_STATUSES: readonly LocalServiceRequestStatus[] = [
  LocalServiceRequestStatus.REQUESTED,
  LocalServiceRequestStatus.MERCHANT_REVIEW,
];

export type LocalRequestExpiryDryRunEligibilityRow = Readonly<{
  status: LocalServiceRequestStatus;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  merchantReviewDeadlineAt: Date | null;
}>;

export type LocalRequestExpiryDryRunItem = Readonly<{
  requestId: string;
  businessId: string;
  status: LocalServiceRequestStatus;
  merchantReviewDeadlineAt: string;
  reason: typeof LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON;
  noWalletAction: typeof LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION;
}>;

export type LocalRequestExpiryDryRunResult = Readonly<{
  dryRun: true;
  now: string;
  eligibleCount: number;
  requestIds: readonly string[];
  items: readonly LocalRequestExpiryDryRunItem[];
}>;

export type LocalRequestExpiryDryRunOptions = Readonly<{
  now?: Date;
  requestId?: string | null;
  requestIds?: readonly string[] | null;
  maxRows?: number;
}>;

/**
 * Pure eligibility for expiry dry-run (read-only). Rows must have a populated deadline in the past.
 */
export function evaluateLocalRequestExpiryDryRunEligibility(
  row: LocalRequestExpiryDryRunEligibilityRow,
  now: Date
): boolean {
  if (row.walletMode !== LocalWalletMode.REQUEST_ONLY_NO_CHARGE) {
    return false;
  }

  if (row.walletPhase !== LocalWalletPhase.NONE) {
    return false;
  }

  if (!EXPIRABLE_STATUSES.includes(row.status)) {
    return false;
  }

  const deadline = row.merchantReviewDeadlineAt;
  if (deadline == null || Number.isNaN(deadline.getTime())) {
    return false;
  }

  return deadline.getTime() < now.getTime();
}

/**
 * Read-only dry-run: lists LocalServiceRequest rows eligible for future expiry worker apply.
 * Does not mutate status, timestamps, wallet, bookings, or audit tables.
 */
export async function runLocalRequestExpiryDryRun(
  prisma: PrismaClient,
  options: LocalRequestExpiryDryRunOptions = {}
): Promise<LocalRequestExpiryDryRunResult> {
  const now = options.now ?? new Date();

  const rows = await prisma.localServiceRequest.findMany({
    where: {
      ...(options.requestId != null && options.requestId.length > 0
        ? { id: options.requestId }
        : {}),
      ...(options.requestIds != null && options.requestIds.length > 0
        ? { id: { in: [...options.requestIds] } }
        : {}),
      status: { in: [...EXPIRABLE_STATUSES] },
      walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
      walletPhase: LocalWalletPhase.NONE,
      merchantReviewDeadlineAt: { not: null, lt: now },
    },
    select: {
      id: true,
      businessId: true,
      status: true,
      walletMode: true,
      walletPhase: true,
      merchantReviewDeadlineAt: true,
    },
    orderBy: { merchantReviewDeadlineAt: 'asc' },
    ...(options.maxRows != null ? { take: options.maxRows } : {}),
  });

  const items: LocalRequestExpiryDryRunItem[] = [];

  for (const row of rows) {
    if (
      !evaluateLocalRequestExpiryDryRunEligibility(
        {
          status: row.status,
          walletMode: row.walletMode,
          walletPhase: row.walletPhase,
          merchantReviewDeadlineAt: row.merchantReviewDeadlineAt,
        },
        now
      )
    ) {
      continue;
    }

    const deadline = row.merchantReviewDeadlineAt;
    if (deadline == null) {
      continue;
    }

    items.push({
      requestId: row.id,
      businessId: row.businessId,
      status: row.status,
      merchantReviewDeadlineAt: deadline.toISOString(),
      reason: LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
      noWalletAction: LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION,
    });
  }

  return {
    dryRun: true,
    now: now.toISOString(),
    eligibleCount: items.length,
    requestIds: items.map((item) => item.requestId),
    items,
  };
}
