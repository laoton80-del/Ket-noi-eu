/**
 * Integration checks for Local merchant request reject API (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-merchant-request-reject-api.ts
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
  rejectMerchantLocalServiceRequest,
  LOCAL_MERCHANT_REQUEST_REJECT_SUCCESS_MESSAGE,
} from '../src/services/local/localMerchantRequestRejectService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-merchant-request-reject-api] Refusing to run: DATABASE_URL is not set.'
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

  const ownerA = randomUUID();
  const ownerB = randomUUID();
  const requester = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: ownerA, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: ownerB, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requester, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  const bizA = await prisma.business.create({
    data: {
      ownerId: ownerA,
      name: 'Reject test biz',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const bizB = await prisma.business.create({
    data: {
      ownerId: ownerB,
      name: 'Other biz',
      category: BizType.RESTAURANT,
      locationLat: 2,
      locationLng: 2,
    },
  });

  const createdIds: string[] = [];

  try {
    const created = await createLocalServiceRequest({
      requesterUserId: requester,
      businessId: bizA.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Reject me',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    createdIds.push(created.request.id);

    const reject = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: created.request.id,
    });
    assert.equal(reject.ok, true);
    if (!reject.ok) throw new Error('reject failed');
    assert.equal(reject.request.status, LocalServiceRequestStatus.REJECTED);
    assert.equal(reject.request.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(reject.request.walletPhase, LocalWalletPhase.NONE);
    assert.equal(reject.request.message, LOCAL_MERCHANT_REQUEST_REJECT_SUCCESS_MESSAGE);
    assert.ok(reject.request.rejectedAt != null);

    const persisted = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(persisted.status, LocalServiceRequestStatus.REJECTED);
    assert.equal(persisted.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(persisted.walletPhase, LocalWalletPhase.NONE);
    assert.equal(persisted.totalVioCredits, null);
    assert.equal(persisted.heldVioCredits, null);
    assert.equal(persisted.releasedVioCredits, null);
    assert.equal(persisted.platformFeeVioCredits, null);
    assert.equal(persisted.providerEarningsVioCredits, null);

    const crossOwner = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerB,
      requestId: created.request.id,
    });
    assert.equal(crossOwner.ok, false);
    if (crossOwner.ok || crossOwner.reason !== 'request_not_found') {
      throw new Error('expected request_not_found for non-owner');
    }

    const updatedAtAfterFirst = persisted.updatedAt;

    const duplicate = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: created.request.id,
    });
    assert.equal(duplicate.ok, true);
    if (!duplicate.ok) throw new Error('idempotent reject failed');

    const afterIdempotent = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(afterIdempotent.updatedAt.getTime(), updatedAtAfterFirst.getTime());
    assert.equal(afterIdempotent.rejectedAt?.getTime(), persisted.rejectedAt?.getTime());

    const confirmThenRejectId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: confirmThenRejectId,
        requesterUserId: requester,
        businessId: bizA.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Confirmed row',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.REQUESTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
      },
    });
    createdIds.push(confirmThenRejectId);

    const confirmed = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: confirmThenRejectId,
    });
    assert.equal(confirmed.ok, true);
    if (!confirmed.ok) throw new Error('confirm setup failed');

    const rejectConfirmed = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: confirmThenRejectId,
    });
    assert.equal(rejectConfirmed.ok, false);
    if (rejectConfirmed.ok || rejectConfirmed.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for CONFIRMED');
    }

    const expiredId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: expiredId,
        requesterUserId: requester,
        businessId: bizA.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Expired',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.EXPIRED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        expiredAt: new Date(),
      },
    });
    createdIds.push(expiredId);

    const rejectExpired = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: expiredId,
    });
    assert.equal(rejectExpired.ok, false);
    if (rejectExpired.ok || rejectExpired.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for EXPIRED');
    }

    const opsCancelledId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: opsCancelledId,
        requesterUserId: requester,
        businessId: bizA.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Ops cancelled',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.OPS_CANCELLED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        cancelledAt: new Date(),
      },
    });
    createdIds.push(opsCancelledId);

    const rejectOps = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: opsCancelledId,
    });
    assert.equal(rejectOps.ok, false);
    if (rejectOps.ok || rejectOps.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for OPS_CANCELLED');
    }

    const completedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: completedId,
        requesterUserId: requester,
        businessId: bizA.id,
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

    const rejectCompleted = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: completedId,
    });
    assert.equal(rejectCompleted.ok, false);
    if (rejectCompleted.ok || rejectCompleted.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for COMPLETED');
    }

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    const bookingCount = await prisma.booking.count({ where: { userId: requester } });
    assert.equal(bookingCount, 0);

    const tourismCount = await prisma.tourismBooking.count({ where: { userId: requester } });
    assert.equal(tourismCount, 0);

    void bizB;
  } finally {
    if (createdIds.length > 0) {
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.business.deleteMany({ where: { id: { in: [bizA.id, bizB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerA, ownerB, requester] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-merchant-request-reject-api] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
