/**
 * Integration checks for Local ops request cancel API (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-ops-request-cancel-api.ts
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
import { createLocalServiceRequest } from '../src/services/local/localRequestCreateService';
import { confirmMerchantLocalServiceRequest } from '../src/services/local/localMerchantRequestConfirmService';
import {
  cancelOpsLocalServiceRequest,
  LOCAL_OPS_REQUEST_CANCEL_SUCCESS_MESSAGE,
} from '../src/services/local/localOpsRequestCancelService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-ops-request-cancel-api] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

async function run(): Promise<void> {
  requireDatabaseUrl();

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();

  const adminId = randomUUID();
  const ownerId = randomUUID();
  const requesterId = randomUUID();
  const b2cId = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: adminId, phoneNumber: uniquePhone(), role: Role.ADMIN, pinCode: 'x' },
      { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: b2cId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  const biz = await prisma.business.create({
    data: {
      ownerId,
      name: 'Ops cancel test biz',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const createdIds: string[] = [];

  try {
    const requested = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Ops cancel requested',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(requested.ok, true);
    if (!requested.ok) throw new Error('create failed');
    createdIds.push(requested.request.id);

    const opsCancel = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: requested.request.id,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(opsCancel.ok, true);
    if (!opsCancel.ok) throw new Error('ops cancel failed');
    assert.equal(opsCancel.request.status, LocalServiceRequestStatus.OPS_CANCELLED);
    assert.equal(opsCancel.request.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(opsCancel.request.walletPhase, LocalWalletPhase.NONE);
    assert.equal(opsCancel.request.message, LOCAL_OPS_REQUEST_CANCEL_SUCCESS_MESSAGE);
    assert.equal(opsCancel.request.cancelledByRole, 'OPS');

    const forbiddenB2c = await cancelOpsLocalServiceRequest({
      adminUserId: b2cId,
      requestId: requested.request.id,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(forbiddenB2c.ok, false);
    if (forbiddenB2c.ok || forbiddenB2c.reason !== 'forbidden') {
      throw new Error('expected forbidden for non-admin');
    }

    const forbiddenOwner = await cancelOpsLocalServiceRequest({
      adminUserId: ownerId,
      requestId: requested.request.id,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(forbiddenOwner.ok, false);
    if (forbiddenOwner.ok || forbiddenOwner.reason !== 'forbidden') {
      throw new Error('expected forbidden for merchant owner');
    }

    const reviewId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: reviewId,
        requesterUserId: requesterId,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'In review',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.MERCHANT_REVIEW,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
      },
    });
    createdIds.push(reviewId);

    const reviewCancel = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: reviewId,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(reviewCancel.ok, true);
    if (!reviewCancel.ok) throw new Error('review ops cancel failed');

    const confirmId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: confirmId,
        requesterUserId: requesterId,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'To confirm then ops cancel',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.REQUESTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
      },
    });
    createdIds.push(confirmId);

    const confirmed = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: confirmId,
    });
    assert.equal(confirmed.ok, true);
    if (!confirmed.ok) throw new Error('confirm setup failed');

    const confirmedOps = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: confirmId,
      cancelReason: 'SYSTEM_SAFETY_RELEASE',
    });
    assert.equal(confirmedOps.ok, true);
    if (!confirmedOps.ok) throw new Error('confirmed ops cancel failed');

    const idempotentId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: idempotentId,
        requesterUserId: requesterId,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Already ops cancelled',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.OPS_CANCELLED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        cancelledAt: new Date(),
        cancelledByRole: 'OPS',
      },
    });
    createdIds.push(idempotentId);

    const persistedOps = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: idempotentId },
    });
    const updatedAtBefore = persistedOps.updatedAt;

    const duplicate = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: idempotentId,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(duplicate.ok, true);
    if (!duplicate.ok) throw new Error('idempotent ops cancel failed');

    const afterIdempotent = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: idempotentId },
    });
    assert.equal(afterIdempotent.updatedAt.getTime(), updatedAtBefore.getTime());

    const rejectedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: rejectedId,
        requesterUserId: requesterId,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Rejected',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.REJECTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        rejectedAt: new Date(),
      },
    });
    createdIds.push(rejectedId);

    const rejectOps = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: rejectedId,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(rejectOps.ok, false);
    if (rejectOps.ok || rejectOps.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for REJECTED');
    }

    const userCancelledId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: userCancelledId,
        requesterUserId: requesterId,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'User cancelled',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.USER_CANCELLED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        cancelledAt: new Date(),
      },
    });
    createdIds.push(userCancelledId);

    const userCancelOps = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: userCancelledId,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(userCancelOps.ok, false);

    const completedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: completedId,
        requesterUserId: requesterId,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Completed',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.COMPLETED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        completedAt: new Date(),
      },
    });
    createdIds.push(completedId);

    const completedOps = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: completedId,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(completedOps.ok, false);

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    const bookingCount = await prisma.booking.count({
      where: { userId: { in: [requesterId, b2cId] } },
    });
    assert.equal(bookingCount, 0);

    const tourismCount = await prisma.tourismBooking.count({
      where: { userId: { in: [requesterId, b2cId] } },
    });
    assert.equal(tourismCount, 0);
  } finally {
    if (createdIds.length > 0) {
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, ownerId, requesterId, b2cId] } },
    });
    await disconnectPrisma();
  }

  console.log('[test-local-ops-request-cancel-api] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
