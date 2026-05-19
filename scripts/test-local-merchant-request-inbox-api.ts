/**
 * Integration checks for Local merchant request inbox API (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-merchant-request-inbox-api.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  BizType,
  LocalRequestSource,
  LocalServiceRequestStatus,
  LocalServiceType,
  Role,
} from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { createLocalServiceRequest } from '../src/services/local/localRequestCreateService';
import { listMerchantLocalServiceRequests } from '../src/services/local/localMerchantRequestInboxService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-merchant-request-inbox-api] Refusing to run: DATABASE_URL is not set.'
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
  const requesterA = randomUUID();
  const requesterB = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: ownerA, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: ownerB, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterA, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: requesterB, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  await prisma.profile.createMany({
    data: [
      { id: randomUUID(), userId: requesterA, fullName: 'Requester A', country: 'CZ' },
      { id: randomUUID(), userId: requesterB, fullName: 'Requester B', country: 'DE' },
    ],
  });

  const bizA = await prisma.business.create({
    data: {
      ownerId: ownerA,
      name: 'Biz A',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const bizB = await prisma.business.create({
    data: {
      ownerId: ownerB,
      name: 'Biz B',
      category: BizType.RESTAURANT,
      locationLat: 2,
      locationLng: 2,
    },
  });

  const createdIds: string[] = [];

  try {
    const reqA = await createLocalServiceRequest({
      requesterUserId: requesterA,
      businessId: bizA.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Help A',
      source: LocalRequestSource.API_DIRECT,
      description: 'Visible to owner A',
    });
    assert.equal(reqA.ok, true);
    if (!reqA.ok) throw new Error('create A failed');
    createdIds.push(reqA.request.id);

    const reqB = await createLocalServiceRequest({
      requesterUserId: requesterB,
      businessId: bizB.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Help B',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(reqB.ok, true);
    if (!reqB.ok) throw new Error('create B failed');
    createdIds.push(reqB.request.id);

    const ownerAInbox = await listMerchantLocalServiceRequests({ merchantUserId: ownerA });
    assert.equal(ownerAInbox.requests.length, 1);
    assert.equal(ownerAInbox.requests[0]?.id, reqA.request.id);
    assert.equal(ownerAInbox.requests[0]?.businessId, bizA.id);
    assert.equal(ownerAInbox.requests[0]?.requester.displayName, 'Requester A');
    assert.equal(ownerAInbox.requests[0]?.requester.userId, requesterA);
    assert.ok(!('phoneNumber' in (ownerAInbox.requests[0]?.requester as object)));
    assert.ok(!('totalVioCredits' in (ownerAInbox.requests[0] as object)));

    const ownerBInbox = await listMerchantLocalServiceRequests({ merchantUserId: ownerB });
    assert.equal(ownerBInbox.requests.length, 1);
    assert.equal(ownerBInbox.requests[0]?.id, reqB.request.id);

    const crossFilter = await listMerchantLocalServiceRequests({
      merchantUserId: ownerA,
      businessId: bizB.id,
    });
    assert.equal(crossFilter.requests.length, 0);

    const statusFilter = await listMerchantLocalServiceRequests({
      merchantUserId: ownerA,
      status: LocalServiceRequestStatus.REQUESTED,
    });
    assert.equal(statusFilter.requests.length, 1);

    const emptyStatus = await listMerchantLocalServiceRequests({
      merchantUserId: ownerA,
      status: LocalServiceRequestStatus.COMPLETED,
    });
    assert.equal(emptyStatus.requests.length, 0);

    const statusBefore = (
      await prisma.localServiceRequest.findUniqueOrThrow({ where: { id: reqA.request.id } })
    ).status;

    await listMerchantLocalServiceRequests({ merchantUserId: ownerA });

    const statusAfter = (
      await prisma.localServiceRequest.findUniqueOrThrow({ where: { id: reqA.request.id } })
    ).status;
    assert.equal(statusAfter, statusBefore);
    assert.equal(statusAfter, LocalServiceRequestStatus.REQUESTED);

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
    await prisma.profile.deleteMany({
      where: { userId: { in: [requesterA, requesterB] } },
    });
    await prisma.business.deleteMany({ where: { id: { in: [bizA.id, bizB.id] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerA, ownerB, requesterA, requesterB] } },
    });
    await disconnectPrisma();
  }

  console.log('[test-local-merchant-request-inbox-api] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
