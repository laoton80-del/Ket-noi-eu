/**
 * AUDIT_RUNTIME_3 — expiry apply REQUEST_EXPIRED audit wiring (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-request-audit-runtime-3.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  BizType,
  LocalRequestSource,
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
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

const REQUEST_EXPIRED_SAFE_MESSAGE =
  'Request expired because the merchant did not respond in time.';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-request-audit-runtime-3] Refusing to run: DATABASE_URL is not set.'
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

async function countExpiredAudit(requestId: string): Promise<number> {
  const prisma = getPrisma();
  return prisma.localServiceRequestAuditEvent.count({
    where: {
      requestId,
      eventType: LocalServiceRequestAuditEventType.REQUEST_EXPIRED,
    },
  });
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
      name: `Audit R3 ${randomUUID().slice(0, 8)}`,
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
    raceConfirmId,
  ];

  const terminalNoAuditIds = [
    confirmedId,
    rejectedId,
    userCancelledId,
    opsCancelledId,
    expiredId,
    futureId,
    nullDeadlineId,
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
          title: 'Past requested audit',
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
          title: 'Past review audit',
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
          title: 'Confirmed',
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

    const raceConfirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: raceConfirmId,
    });
    assert.equal(raceConfirm.ok, true);
    if (!raceConfirm.ok) throw new Error('race confirm failed');

    const firstApply = await applyLocalRequestExpiry(prisma, {
      now,
      requestIds: createdIds,
    });

    assert.equal(firstApply.expiredCount, 2);
    assert.ok(firstApply.runId.length > 0);
    assert.equal(await countExpiredAudit(pastRequestedId), 1);
    assert.equal(await countExpiredAudit(pastReviewId), 1);

    const requestedAudit = await prisma.localServiceRequestAuditEvent.findFirstOrThrow({
      where: {
        requestId: pastRequestedId,
        eventType: LocalServiceRequestAuditEventType.REQUEST_EXPIRED,
      },
    });
    assert.equal(requestedAudit.actorType, LocalServiceRequestAuditActorType.SYSTEM);
    assert.equal(requestedAudit.actorUserId, null);
    assert.equal(requestedAudit.fromStatus, LocalServiceRequestStatus.REQUESTED);
    assert.equal(requestedAudit.toStatus, LocalServiceRequestStatus.EXPIRED);
    assert.equal(requestedAudit.reason, LOCAL_REQUEST_EXPIRY_DRY_RUN_REASON);
    assert.equal(requestedAudit.safeMessage, REQUEST_EXPIRED_SAFE_MESSAGE);
    assert.equal(requestedAudit.noWalletAction, true);
    assert.equal(requestedAudit.walletModeSnapshot, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(requestedAudit.walletPhaseSnapshot, LocalWalletPhase.NONE);
    assert.equal(requestedAudit.requestOnlyNoChargeSnapshot, true);
    assert.equal(requestedAudit.runId, firstApply.runId);

    const reviewAudit = await prisma.localServiceRequestAuditEvent.findFirstOrThrow({
      where: {
        requestId: pastReviewId,
        eventType: LocalServiceRequestAuditEventType.REQUEST_EXPIRED,
      },
    });
    assert.equal(reviewAudit.fromStatus, LocalServiceRequestStatus.MERCHANT_REVIEW);
    assert.equal(reviewAudit.toStatus, LocalServiceRequestStatus.EXPIRED);
    assert.equal(reviewAudit.runId, firstApply.runId);

    for (const id of terminalNoAuditIds) {
      assert.equal(await countExpiredAudit(id), 0, `expected no REQUEST_EXPIRED for ${id}`);
    }

    const duplicateApply = await applyLocalRequestExpiry(prisma, {
      now,
      requestIds: [pastRequestedId, pastReviewId, expiredId],
    });
    assert.equal(duplicateApply.expiredCount, 0);
    assert.equal(await countExpiredAudit(pastRequestedId), 1);
    assert.equal(await countExpiredAudit(pastReviewId), 1);

    const raceApply = await applyLocalRequestExpiry(prisma, {
      now,
      requestId: raceConfirmId,
    });
    assert.equal(raceApply.expiredCount, 0);
    assert.equal(await countExpiredAudit(raceConfirmId), 0);

    const metaRows = await prisma.localServiceRequestAuditEvent.findMany({
      where: { requestId: { in: [pastRequestedId, pastReviewId] } },
      select: { metadataJson: true },
    });
    for (const row of metaRows) {
      const serialized = JSON.stringify(row.metadataJson ?? {}).toLowerCase();
      assert.ok(!serialized.includes('phone'));
      assert.ok(!serialized.includes('email'));
    }

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    assert.equal(await prisma.booking.count({ where: { userId: requesterId } }), 0);
    assert.equal(await prisma.tourismBooking.count({ where: { userId: requesterId } }), 0);

    const requesterWallet = await prisma.wallet.findUnique({ where: { userId: requesterId } });
    if (requesterWallet) {
      const after = await prisma.wallet.findUnique({
        where: { userId: requesterId },
        select: { balanceVIG: true, lockedBalanceVIG: true },
      });
      assert.equal(after?.balanceVIG, requesterWallet.balanceVIG);
      assert.equal(after?.lockedBalanceVIG, requesterWallet.lockedBalanceVIG);
    }
  } finally {
    await prisma.localServiceRequestAuditEvent.deleteMany({
      where: { requestId: { in: createdIds } },
    });
    await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-request-audit-runtime-3] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
