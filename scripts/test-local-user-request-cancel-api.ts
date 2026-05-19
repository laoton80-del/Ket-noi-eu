/**
 * Integration checks for Local user request cancel API (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-user-request-cancel-api.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  BizType,
  LocalCancelReason,
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
  cancelUserLocalServiceRequest,
  LOCAL_USER_REQUEST_CANCEL_SUCCESS_MESSAGE,
} from '../src/services/local/localUserRequestCancelService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-user-request-cancel-api] Refusing to run: DATABASE_URL is not set.'
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

  const owner = randomUUID();
  const requesterA = randomUUID();
  const requesterB = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: owner, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterA, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: requesterB, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  const biz = await prisma.business.create({
    data: {
      ownerId: owner,
      name: 'Cancel test biz',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const createdIds: string[] = [];

  try {
    const created = await createLocalServiceRequest({
      requesterUserId: requesterA,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Cancel me',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    createdIds.push(created.request.id);

    const cancel = await cancelUserLocalServiceRequest({
      requesterUserId: requesterA,
      requestId: created.request.id,
    });
    assert.equal(cancel.ok, true);
    if (!cancel.ok) throw new Error('cancel failed');
    assert.equal(cancel.request.status, LocalServiceRequestStatus.USER_CANCELLED);
    assert.equal(cancel.request.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(cancel.request.walletPhase, LocalWalletPhase.NONE);
    assert.equal(cancel.request.message, LOCAL_USER_REQUEST_CANCEL_SUCCESS_MESSAGE);
    assert.ok(cancel.request.cancelledAt != null);
    assert.equal(cancel.request.cancelReason, LocalCancelReason.USER_CANCEL);

    const persisted = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(persisted.status, LocalServiceRequestStatus.USER_CANCELLED);
    assert.equal(persisted.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(persisted.walletPhase, LocalWalletPhase.NONE);
    assert.equal(persisted.totalVioCredits, null);
    assert.equal(persisted.heldVioCredits, null);
    assert.equal(persisted.releasedVioCredits, null);
    assert.equal(persisted.platformFeeVioCredits, null);
    assert.equal(persisted.providerEarningsVioCredits, null);

    const crossUser = await cancelUserLocalServiceRequest({
      requesterUserId: requesterB,
      requestId: created.request.id,
    });
    assert.equal(crossUser.ok, false);
    if (crossUser.ok || crossUser.reason !== 'request_not_found') {
      throw new Error('expected request_not_found for non-requester');
    }

    const updatedAtAfterFirst = persisted.updatedAt;

    const duplicate = await cancelUserLocalServiceRequest({
      requesterUserId: requesterA,
      requestId: created.request.id,
    });
    assert.equal(duplicate.ok, true);
    if (!duplicate.ok) throw new Error('idempotent cancel failed');

    const afterIdempotent = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(afterIdempotent.updatedAt.getTime(), updatedAtAfterFirst.getTime());
    assert.equal(afterIdempotent.cancelledAt?.getTime(), persisted.cancelledAt?.getTime());

    const confirmedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: confirmedId,
        requesterUserId: requesterA,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'To confirm',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.REQUESTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
      },
    });
    createdIds.push(confirmedId);

    const confirmed = await confirmMerchantLocalServiceRequest({
      merchantUserId: owner,
      requestId: confirmedId,
    });
    assert.equal(confirmed.ok, true);
    if (!confirmed.ok) throw new Error('confirm setup failed');

    const cancelConfirmed = await cancelUserLocalServiceRequest({
      requesterUserId: requesterA,
      requestId: confirmedId,
    });
    assert.equal(cancelConfirmed.ok, false);
    if (cancelConfirmed.ok || cancelConfirmed.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for CONFIRMED');
    }

    const rejectedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: rejectedId,
        requesterUserId: requesterA,
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

    const cancelRejected = await cancelUserLocalServiceRequest({
      requesterUserId: requesterA,
      requestId: rejectedId,
    });
    assert.equal(cancelRejected.ok, false);
    if (cancelRejected.ok || cancelRejected.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for REJECTED');
    }

    const opsId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: opsId,
        requesterUserId: requesterA,
        businessId: biz.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Ops cancelled',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.OPS_CANCELLED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        cancelledAt: new Date(),
      },
    });
    createdIds.push(opsId);

    const cancelOps = await cancelUserLocalServiceRequest({
      requesterUserId: requesterA,
      requestId: opsId,
    });
    assert.equal(cancelOps.ok, false);
    if (cancelOps.ok || cancelOps.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for OPS_CANCELLED');
    }

    const completedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: completedId,
        requesterUserId: requesterA,
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

    const cancelCompleted = await cancelUserLocalServiceRequest({
      requesterUserId: requesterA,
      requestId: completedId,
    });
    assert.equal(cancelCompleted.ok, false);
    if (cancelCompleted.ok || cancelCompleted.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for COMPLETED');
    }

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    const bookingCount = await prisma.booking.count({
      where: { userId: { in: [requesterA, requesterB] } },
    });
    assert.equal(bookingCount, 0);

    const tourismCount = await prisma.tourismBooking.count({
      where: { userId: { in: [requesterA, requesterB] } },
    });
    assert.equal(tourismCount, 0);
  } finally {
    if (createdIds.length > 0) {
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({ where: { id: { in: [owner, requesterA, requesterB] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-user-request-cancel-api] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
