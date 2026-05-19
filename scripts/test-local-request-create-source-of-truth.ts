/**
 * Integration checks for Local request-only create (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-request-create-source-of-truth.ts
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
  createLocalServiceRequest,
  LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE,
} from '../src/services/local/localRequestCreateService';
import { findDangerousLocalRequestCreateBodyKeys } from '../src/services/local/localRequestCreateValidation';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-request-create-source-of-truth] Refusing to run: DATABASE_URL is not set.'
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

  const ownerId = randomUUID();
  const requesterId = randomUUID();
  const ownerPhone = uniquePhone();
  const requesterPhone = uniquePhone();

  await prisma.user.createMany({
    data: [
      {
        id: ownerId,
        phoneNumber: ownerPhone,
        role: Role.B2B_VN,
        pinCode: 'hash-not-used',
      },
      {
        id: requesterId,
        phoneNumber: requesterPhone,
        role: Role.B2C,
        pinCode: 'hash-not-used',
      },
    ],
  });

  const business = await prisma.business.create({
    data: {
      ownerId,
      name: `SoT test biz ${randomUUID().slice(0, 8)}`,
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 10.77,
      locationLng: 106.7,
    },
  });

  const service = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Test menu item',
      priceVIG: 0,
    },
  });

  const createdIds: string[] = [];

  try {
    const dangerous = findDangerousLocalRequestCreateBodyKeys({
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Test',
      status: LocalServiceRequestStatus.CONFIRMED,
      walletMode: LocalWalletMode.HOLD_ON_SUBMIT,
      holdAmountCredits: 99,
    });
    assert.ok(dangerous.includes('status'));
    assert.ok(dangerous.includes('walletMode'));
    assert.ok(dangerous.includes('holdAmountCredits'));

    const valid = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: business.id,
      serviceId: service.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Need help with paperwork',
      source: LocalRequestSource.API_DIRECT,
      description: 'Integration test row',
    });

    assert.equal(valid.ok, true);
    if (!valid.ok) throw new Error('expected ok create');
    createdIds.push(valid.request.id);

    assert.equal(valid.request.status, LocalServiceRequestStatus.REQUESTED);
    assert.equal(valid.request.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(valid.request.walletPhase, LocalWalletPhase.NONE);
    assert.equal(valid.request.message, LOCAL_REQUEST_CREATE_SUCCESS_MESSAGE);
    assert.equal(valid.request.totalVioCredits, null);
    assert.equal(valid.request.heldVioCredits, null);
    assert.equal(valid.request.releasedVioCredits, null);
    assert.equal(valid.request.platformFeeVioCredits, null);
    assert.equal(valid.request.providerEarningsVioCredits, null);

    const persisted = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: valid.request.id },
    });
    assert.equal(persisted.requesterUserId, requesterId);
    assert.equal(persisted.status, LocalServiceRequestStatus.REQUESTED);
    assert.equal(persisted.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(persisted.walletPhase, LocalWalletPhase.NONE);
    assert.equal(persisted.totalVioCredits, null);
    assert.equal(persisted.heldVioCredits, null);

    const missingBiz = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: randomUUID(),
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Should fail',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(missingBiz.ok, false);
    if (missingBiz.ok || missingBiz.reason !== 'business_not_found') {
      throw new Error('expected business_not_found');
    }

    const selfReq = await createLocalServiceRequest({
      requesterUserId: ownerId,
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Self request',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(selfReq.ok, false);
    if (selfReq.ok || selfReq.reason !== 'self_request_forbidden') {
      throw new Error('expected self_request_forbidden');
    }

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore, 'create must not insert wallet Transaction rows');

    const bookingCount = await prisma.booking.count({ where: { userId: requesterId } });
    assert.equal(bookingCount, 0, 'must not create Booking bridge rows');

    const tourismCount = await prisma.tourismBooking.count({
      where: { userId: requesterId },
    });
    assert.equal(tourismCount, 0, 'must not create TourismBooking rows');

    assert.ok(findDangerousLocalRequestCreateBodyKeys({ status: 'X' }).includes('status'));
  } finally {
    if (createdIds.length > 0) {
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.service.deleteMany({ where: { businessId: business.id } });
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-request-create-source-of-truth] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
