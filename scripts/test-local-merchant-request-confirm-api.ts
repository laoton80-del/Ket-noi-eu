/**
 * Integration checks for Local merchant request confirm API (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-merchant-request-confirm-api.ts
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
import {
  confirmMerchantLocalServiceRequest,
  LOCAL_MERCHANT_REQUEST_CONFIRM_SUCCESS_MESSAGE,
} from '../src/services/local/localMerchantRequestConfirmService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-merchant-request-confirm-api] Refusing to run: DATABASE_URL is not set.'
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
      name: 'Confirm test biz',
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
      title: 'Confirm me',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    createdIds.push(created.request.id);

    const confirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: created.request.id,
    });
    assert.equal(confirm.ok, true);
    if (!confirm.ok) throw new Error('confirm failed');
    assert.equal(confirm.request.status, LocalServiceRequestStatus.CONFIRMED);
    assert.equal(confirm.request.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(confirm.request.walletPhase, LocalWalletPhase.NONE);
    assert.equal(confirm.request.message, LOCAL_MERCHANT_REQUEST_CONFIRM_SUCCESS_MESSAGE);
    assert.ok(confirm.request.merchantConfirmedAt != null);

    const persisted = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(persisted.status, LocalServiceRequestStatus.CONFIRMED);
    assert.equal(persisted.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(persisted.walletPhase, LocalWalletPhase.NONE);
    assert.equal(persisted.totalVioCredits, null);
    assert.equal(persisted.heldVioCredits, null);
    assert.equal(persisted.releasedVioCredits, null);
    assert.equal(persisted.platformFeeVioCredits, null);
    assert.equal(persisted.providerEarningsVioCredits, null);

    const crossOwner = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerB,
      requestId: created.request.id,
    });
    assert.equal(crossOwner.ok, false);
    if (crossOwner.ok || crossOwner.reason !== 'request_not_found') {
      throw new Error('expected request_not_found for non-owner');
    }

    const updatedAtAfterFirst = persisted.updatedAt;

    const duplicate = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: created.request.id,
    });
    assert.equal(duplicate.ok, true);
    if (!duplicate.ok) throw new Error('idempotent confirm failed');

    const afterIdempotent = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(afterIdempotent.updatedAt.getTime(), updatedAtAfterFirst.getTime());
    assert.equal(
      afterIdempotent.confirmedAt?.getTime(),
      persisted.confirmedAt?.getTime()
    );

    const rejectedId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: rejectedId,
        requesterUserId: requester,
        businessId: bizA.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Rejected row',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.REJECTED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        rejectedAt: new Date(),
      },
    });
    createdIds.push(rejectedId);

    const rejectConfirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: rejectedId,
    });
    assert.equal(rejectConfirm.ok, false);
    if (rejectConfirm.ok || rejectConfirm.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for REJECTED');
    }

    const expiredId = randomUUID();
    await prisma.localServiceRequest.create({
      data: {
        id: expiredId,
        requesterUserId: requester,
        businessId: bizA.id,
        serviceType: LocalServiceType.GENERIC_REQUEST,
        title: 'Expired row',
        source: LocalRequestSource.API_DIRECT,
        status: LocalServiceRequestStatus.EXPIRED,
        walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
        walletPhase: LocalWalletPhase.NONE,
        expiredAt: new Date(),
      },
    });
    createdIds.push(expiredId);

    const expiredConfirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerA,
      requestId: expiredId,
    });
    assert.equal(expiredConfirm.ok, false);
    if (expiredConfirm.ok || expiredConfirm.reason !== 'invalid_status') {
      throw new Error('expected invalid_status for EXPIRED');
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

  console.log('[test-local-merchant-request-confirm-api] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
