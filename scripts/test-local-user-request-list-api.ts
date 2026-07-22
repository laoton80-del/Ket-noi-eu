/**
 * Integration checks for Local user request list API (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-user-request-list-api.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import {
  BizType,
  LocalRequestSource,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
} from '@prisma/client';

import { getUserLocalServiceRequests } from '../src/controllers/LocalRequestController';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import {
  createLocalServiceRequestForRegression,
  deleteLocalProviderEligibilityIfPresent,
} from './localProviderEligibilityTestSupport';
import {
  LOCAL_USER_REQUEST_LIST_SAFETY,
  listUserLocalServiceRequests,
} from '../src/services/local/localUserRequestListService';

const FORBIDDEN_COPY = [
  'escrow',
  'deposit',
  'refund',
  'provider paid',
  'payout',
  'settlement',
  'paid booking',
  'guaranteed',
  'dispatched',
] as const;

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-user-request-list-api] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

function assertNoForbiddenCopy(payload: string): void {
  const lower = payload.toLowerCase();
  for (const term of FORBIDDEN_COPY) {
    assert.equal(lower.includes(term), false, `forbidden copy "${term}" in payload`);
  }
}

async function runControllerUnauthorized(): Promise<void> {
  let statusCode = 0;
  let body: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  const req = { query: {} } as Request;

  await getUserLocalServiceRequests(req, res);

  assert.equal(statusCode, 401);
  assert.equal(
    (body as { success?: boolean; error?: string }).success,
    false,
    'unauthenticated must return success:false'
  );
}

async function run(): Promise<void> {
  requireDatabaseUrl();

  await runControllerUnauthorized();

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
      name: 'User list test biz',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const createdIds: string[] = [];

  try {
    const reqA = await createLocalServiceRequestForRegression(prisma, {
      requesterUserId: requesterA,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'List A',
      source: LocalRequestSource.API_DIRECT,
      description: 'Owned by A',
    });
    assert.equal(reqA.ok, true);
    if (!reqA.ok) throw new Error('create A failed');
    createdIds.push(reqA.request.id);

    const reqB = await createLocalServiceRequestForRegression(prisma, {
      requesterUserId: requesterB,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'List B',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(reqB.ok, true);
    if (!reqB.ok) throw new Error('create B failed');
    createdIds.push(reqB.request.id);

    const listA = await listUserLocalServiceRequests({ requesterUserId: requesterA });
    assert.equal(listA.requests.length, 1);
    assert.equal(listA.requests[0]?.id, reqA.request.id);
    assert.equal(listA.safety, LOCAL_USER_REQUEST_LIST_SAFETY);
    assert.equal(listA.requests[0]?.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(listA.requests[0]?.walletPhase, LocalWalletPhase.NONE);
    assert.equal(listA.requests[0]?.display.noPaymentCaptured, true);
    assert.equal(listA.requests[0]?.display.requestOnlyNoCharge, true);
    assert.equal(listA.requests[0]?.business.name, 'User list test biz');
    assert.equal(listA.requests[0]?.statusLabel, 'Request submitted');
    assert.ok(listA.requests[0]?.requestedAt.length > 0);

    assert.ok(!('totalVioCredits' in (listA.requests[0] as object)));
    assert.ok(!('heldVioCredits' in (listA.requests[0] as object)));
    assert.ok(!('assignedProviderUserId' in (listA.requests[0] as object)));
    assert.ok(!('auditEvents' in (listA.requests[0] as object)));

    assertNoForbiddenCopy(JSON.stringify(listA));

    const listB = await listUserLocalServiceRequests({ requesterUserId: requesterB });
    assert.equal(listB.requests.length, 1);
    assert.equal(listB.requests[0]?.id, reqB.request.id);
    assert.notEqual(listB.requests[0]?.id, reqA.request.id);

    const isolated = await listUserLocalServiceRequests({ requesterUserId: requesterA });
    assert.equal(
      isolated.requests.some((r) => r.id === reqB.request.id),
      false,
      'requester A must not see requester B rows'
    );

    const filtered = await listUserLocalServiceRequests({
      requesterUserId: requesterA,
      status: LocalServiceRequestStatus.REQUESTED,
    });
    assert.equal(filtered.requests.length, 1);
    assert.equal(filtered.requests[0]?.status, LocalServiceRequestStatus.REQUESTED);

    const emptyFilter = await listUserLocalServiceRequests({
      requesterUserId: requesterA,
      status: LocalServiceRequestStatus.REJECTED,
    });
    assert.equal(emptyFilter.requests.length, 0);

    const paged = await listUserLocalServiceRequests({
      requesterUserId: requesterA,
      limit: 1,
      skip: 0,
    });
    assert.equal(paged.requests.length, 1);

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore, 'list must not create WalletTransaction rows');

    console.log('[test-local-user-request-list-api] OK');
  } finally {
    if (createdIds.length > 0) {
      await prisma.localServiceRequestAuditEvent.deleteMany({
        where: { requestId: { in: createdIds } },
      });
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    }
    await deleteLocalProviderEligibilityIfPresent(prisma, biz.id);
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [owner, requesterA, requesterB] } },
    });
    await disconnectPrisma();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
