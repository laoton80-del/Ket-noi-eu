/**
 * Integration checks for Local request expiry dry-run (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-request-expiry-dry-run.ts
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
import {
  LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION,
  LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON,
  runLocalRequestExpiryDryRun,
} from '../src/services/local/localRequestExpiryDryRunService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-request-expiry-dry-run] Refusing to run: DATABASE_URL is not set.'
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
      name: 'Expiry dry-run test biz',
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
      ],
    });

    const beforeRows = await prisma.localServiceRequest.findMany({
      where: { id: { in: createdIds } },
      select: { id: true, status: true, expiredAt: true, updatedAt: true },
    });
    const beforeById = new Map(beforeRows.map((row) => [row.id, row]));

    const result = await runLocalRequestExpiryDryRun(prisma, {
      now,
      requestIds: createdIds,
    });

    assert.equal(result.dryRun, true);
    assert.equal(result.eligibleCount, 2);
    assert.deepEqual(new Set(result.requestIds), new Set([pastRequestedId, pastReviewId]));

    for (const item of result.items) {
      assert.equal(item.reason, LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON);
      assert.equal(item.noWalletAction, LOCAL_REQUEST_EXPIRY_DRY_RUN_NO_WALLET_ACTION);
      assert.equal(item.businessId, biz.id);
      assert.ok(
        item.status === LocalServiceRequestStatus.REQUESTED ||
          item.status === LocalServiceRequestStatus.MERCHANT_REVIEW
      );
    }

    const eligibleIds = new Set(result.requestIds);
    assert.ok(!eligibleIds.has(futureId));
    assert.ok(!eligibleIds.has(nullDeadlineId));
    assert.ok(!eligibleIds.has(confirmedId));
    assert.ok(!eligibleIds.has(rejectedId));
    assert.ok(!eligibleIds.has(userCancelledId));
    assert.ok(!eligibleIds.has(opsCancelledId));
    assert.ok(!eligibleIds.has(expiredId));
    assert.ok(!eligibleIds.has(inProgressId));
    assert.ok(!eligibleIds.has(completedId));

    const secondRun = await runLocalRequestExpiryDryRun(prisma, {
      now,
      requestIds: createdIds,
    });
    assert.deepEqual(secondRun.requestIds, result.requestIds);

    const afterRows = await prisma.localServiceRequest.findMany({
      where: { id: { in: createdIds } },
      select: { id: true, status: true, expiredAt: true, updatedAt: true },
    });

    for (const row of afterRows) {
      const before = beforeById.get(row.id);
      assert.ok(before, `missing before snapshot for ${row.id}`);
      assert.equal(row.status, before.status);
      assert.equal(row.expiredAt?.getTime() ?? null, before.expiredAt?.getTime() ?? null);
      assert.equal(row.updatedAt.getTime(), before.updatedAt.getTime());
    }

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

  console.log('[test-local-request-expiry-dry-run] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
