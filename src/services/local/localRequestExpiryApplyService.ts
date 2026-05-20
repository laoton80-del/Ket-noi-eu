import { randomUUID } from 'node:crypto';

import {
  LocalCancelReason,
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  type PrismaClient,
} from '@prisma/client';

import {
  assertLocalRequestAuditWritten,
  createLocalRequestAuditEvent,
} from './localRequestAuditEventService';
import {
  LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION,
  LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
  runLocalRequestExpiryDryRun,
} from './localRequestExpiryDryRunService';

const REQUEST_EXPIRED_AUDIT_SAFE_MESSAGE =
  'Request expired because the merchant did not respond in time.' as const;

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
  runId: string;
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

  const runId = randomUUID();
  const expiredIds: string[] = [];

  for (const item of candidates.items) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.localServiceRequest.updateMany({
        where: {
          id: item.requestId,
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
        assertLocalRequestAuditWritten(
          await createLocalRequestAuditEvent({
            db: tx,
            requestId: item.requestId,
            eventType: LocalServiceRequestAuditEventType.REQUEST_EXPIRED,
            actorType: LocalServiceRequestAuditActorType.SYSTEM,
            actorUserId: null,
            businessId: item.businessId,
            fromStatus: item.status,
            toStatus: LocalServiceRequestStatus.EXPIRED,
            reason: LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
            safeMessage: REQUEST_EXPIRED_AUDIT_SAFE_MESSAGE,
            runId,
          })
        );
        expiredIds.push(item.requestId);
      }
    });
  }

  return {
    dryRun: false,
    applied: true,
    now: now.toISOString(),
    runId,
    attemptedCount: candidates.eligibleCount,
    expiredCount: expiredIds.length,
    requestIds: expiredIds,
    noWalletAction: LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION,
    reason: LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
  };
}
