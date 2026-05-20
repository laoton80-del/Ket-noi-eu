import {
  LocalCancelReason,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  type PrismaClient,
} from '@prisma/client';

import {
  LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION,
  LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
  runLocalRequestExpiryDryRun,
} from './localRequestExpiryDryRunService';

const EXPIRABLE_STATUSES: readonly LocalServiceRequestStatus[] = [
  LocalServiceRequestStatus.REQUESTED,
  LocalServiceRequestStatus.MERCHANT_REVIEW,
];

export type LocalRequestExpiryApplyOptions = Readonly<{
  now?: Date;
  requestId?: string | null;
  requestIds?: readonly string[] | null;
  maxRows?: number;
}>;

export type LocalRequestExpiryApplyResult = Readonly<{
  dryRun: false;
  applied: true;
  now: string;
  attemptedCount: number;
  expiredCount: number;
  requestIds: readonly string[];
  noWalletAction: typeof LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION;
  reason: typeof LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON;
}>;

/**
 * Apply merchant-review timeout expiry on eligible Local rows (request-only / no wallet).
 * Uses conditional `updateMany` per row for race safety with confirm/reject/cancel paths.
 */
export async function applyLocalRequestExpiry(
  prisma: PrismaClient,
  options: LocalRequestExpiryApplyOptions = {}
): Promise<LocalRequestExpiryApplyResult> {
  const now = options.now ?? new Date();

  const candidates = await runLocalRequestExpiryDryRun(prisma, {
    now,
    requestId: options.requestId,
    requestIds: options.requestIds,
    maxRows: options.maxRows,
  });

  const expiredIds: string[] = [];

  for (const requestId of candidates.requestIds) {
    const updated = await prisma.localServiceRequest.updateMany({
      where: {
        id: requestId,
        status: { in: [...EXPIRABLE_STATUSES] },
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        merchantReviewDeadlineAt: { not: null, lt: now },
      },
      data: {
        status: LocalServiceRequestStatus.EXPIRED,
        expiredAt: now,
        cancelReason: LocalCancelReason.EXPIRED,
      },
    });

    if (updated.count === 1) {
      expiredIds.push(requestId);
    }
  }

  return {
    dryRun: false,
    applied: true,
    now: now.toISOString(),
    attemptedCount: candidates.eligibleCount,
    expiredCount: expiredIds.length,
    requestIds: expiredIds,
    noWalletAction: LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION,
    reason: LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
  };
}
