/**
 * Integration checks for Local request expiry apply worker (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-request-expiry-apply.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  BizType,
  LocalRequestSource,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
} from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { confirmMerchantLocalServiceRequest } from '../src/services/local/localMerchantRequestConfirmService';
import { applyLocalRequestExpiry } from '../src/services/local/localRequestExpiryApplyService';
import { LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON } from '../src/services/local/localRequestExpiryDryRunService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-request-expiry-apply] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function run(): Promise<void> {
  requireDatabaseUrl();

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();
  const now = new Date();

  const ownerId = randomUUID();
  const requesterId = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  const biz = await prisma.business.create({
    data: {
      ownerId,
      name: 'Expiry apply test biz',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const pastRequestedId = randomUUID();
  const pastReviewId = randomUUID();
  const futureId = randomUUID();
  const nullDeadlineId = randomUUID();
  const confirmedId = randomUUID();
  const rejectedId = randomUUID();
  const userCancelledId = randomUUID();
  const opsCancelledId = randomUUID();
  const expiredId = randomUUID();
  const inProgressId = randomUUID();
  const completedId = randomUUID();
  const raceConfirmId = randomUUID();

  const createdIds = [
    pastRequestedId,
    pastReviewId,
    futureId,
    nullDeadlineId,
    confirmedId,
    rejectedId,
    userCancelledId,
    opsCancelledId,
    expiredId,
    inProgressId,
    completedId,
    raceConfirmId,
  ];

  const pastDeadline = hoursAgo(2);

  try {
    await prisma.localServiceRequest.createMany({
      data: [
        {
          id: pastRequestedId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Past requested',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.REQUESTED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
        },
        {
          id: pastReviewId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Past review',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.MERCHANT_REVIEW,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
        },
        {
          id: futureId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Future deadline',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.REQUESTED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: hoursFromNow(24),
        },
        {
          id: nullDeadlineId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Null deadline',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.REQUESTED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: null,
        },
        {
          id: confirmedId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Confirmed past deadline',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.CONFIRMED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
          confirmedAt: pastDeadline,
        },
        {
          id: rejectedId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Rejected',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.REJECTED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
          rejectedAt: pastDeadline,
        },
        {
          id: userCancelledId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'User cancelled',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.USER_CANCELLED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
          cancelledAt: pastDeadline,
        },
        {
          id: opsCancelledId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Ops cancelled',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.OPS_CANCELLED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
          cancelledAt: pastDeadline,
          cancelledByRole: 'OPS',
        },
        {
          id: expiredId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Already expired',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.EXPIRED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
          expiredAt: pastDeadline,
        },
        {
          id: inProgressId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'In progress',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.IN_PROGRESS,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
        },
        {
          id: completedId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Completed',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.COMPLETED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
          completedAt: pastDeadline,
        },
        {
          id: raceConfirmId,
          requesterUserId: requesterId,
          businessId: biz.id,
          serviceType: LocalServiceType.GENERIC_REQUEST,
          title: 'Race confirm',
          source: LocalRequestSource.API_DIRECT,
          status: LocalServiceRequestStatus.REQUESTED,
          walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhase: LocalWalletPhase.NONE,
          merchantReviewDeadlineAt: pastDeadline,
        },
      ],
    });

    const expiredBefore = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: expiredId },
      select: { expiredAt: true, updatedAt: true },
    });

    const raceConfirmBeforeApply = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: raceConfirmId,
    });
    assert.equal(raceConfirmBeforeApply.ok, true);
    if (!raceConfirmBeforeApply.ok) throw new Error('race confirm before apply failed');

    const firstApply = await applyLocalRequestExpiry(prisma, {
      now,
      requestIds: createdIds,
    });

    assert.equal(firstApply.dryRun, false);
    assert.equal(firstApply.applied, true);
    assert.equal(firstApply.reason, LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON);
    assert.equal(firstApply.noWalletAction, true);
    assert.equal(firstApply.attemptedCount, 2);
    assert.equal(firstApply.expiredCount, 2);
    assert.deepEqual(
      new Set(firstApply.requestIds),
      new Set([pastRequestedId, pastReviewId])
    );

    const pastRequested = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: pastRequestedId },
    });
    assert.equal(pastRequested.status, LocalServiceRequestStatus.EXPIRED);
    assert.ok(pastRequested.expiredAt != null);
    assert.equal(pastRequested.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(pastRequested.walletPhase, LocalWalletPhase.NONE);
    assert.equal(pastRequested.totalVioCredits, null);
    assert.equal(pastRequested.heldVioCredits, null);

    const pastReview = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: pastReviewId },
    });
    assert.equal(pastReview.status, LocalServiceRequestStatus.EXPIRED);
    assert.ok(pastReview.expiredAt != null);

    const futureRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: futureId },
    });
    assert.equal(futureRow.status, LocalServiceRequestStatus.REQUESTED);

    const nullDeadlineRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: nullDeadlineId },
    });
    assert.equal(nullDeadlineRow.status, LocalServiceRequestStatus.REQUESTED);

    const confirmedRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: confirmedId },
    });
    assert.equal(confirmedRow.status, LocalServiceRequestStatus.CONFIRMED);

    const rejectedRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: rejectedId },
    });
    assert.equal(rejectedRow.status, LocalServiceRequestStatus.REJECTED);

    const userCancelledRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: userCancelledId },
    });
    assert.equal(userCancelledRow.status, LocalServiceRequestStatus.USER_CANCELLED);

    const opsCancelledRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: opsCancelledId },
    });
    assert.equal(opsCancelledRow.status, LocalServiceRequestStatus.OPS_CANCELLED);

    const inProgressRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: inProgressId },
    });
    assert.equal(inProgressRow.status, LocalServiceRequestStatus.IN_PROGRESS);

    const completedRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: completedId },
    });
    assert.equal(completedRow.status, LocalServiceRequestStatus.COMPLETED);

    const expiredAfterFirst = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: expiredId },
    });
    assert.equal(expiredAfterFirst.status, LocalServiceRequestStatus.EXPIRED);
    assert.equal(
      expiredAfterFirst.expiredAt?.getTime(),
      expiredBefore.expiredAt?.getTime()
    );
    assert.equal(expiredAfterFirst.updatedAt.getTime(), expiredBefore.updatedAt.getTime());

    const idempotentApply = await applyLocalRequestExpiry(prisma, {
      now,
      requestIds: [pastRequestedId, pastReviewId, expiredId],
    });
    assert.equal(idempotentApply.attemptedCount, 0);
    assert.equal(idempotentApply.expiredCount, 0);
    assert.equal(idempotentApply.requestIds.length, 0);

    const raceApply = await applyLocalRequestExpiry(prisma, {
      now,
      requestId: raceConfirmId,
    });
    assert.equal(raceApply.attemptedCount, 0);
    assert.equal(raceApply.expiredCount, 0);

    const raceRow = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: raceConfirmId },
    });
    assert.equal(raceRow.status, LocalServiceRequestStatus.CONFIRMED);

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    const bookingCount = await prisma.booking.count({
      where: { userId: requesterId },
    });
    assert.equal(bookingCount, 0);

    const tourismCount = await prisma.tourismBooking.count({
      where: { userId: requesterId },
    });
    assert.equal(tourismCount, 0);
  } finally {
    await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-request-expiry-apply] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
