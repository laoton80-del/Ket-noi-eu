/**
 * Local integration checks for Pack16 read-only VIONA persistence API.
 *
 * Requires DATABASE_URL. Refuses to run without it.
 * Does not call staging endpoints or print secrets.
 *
 * Run: npx tsx scripts/test-viona-read-only-persistence-api.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import { Role } from '@prisma/client';

import {
  getVionaRequestDetail,
  getVionaRequests,
} from '../src/controllers/VionaRequestController';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { VIONA_REQUEST_READ_SAFETY } from '../src/services/viona/vionaRequestReadDto';
import {
  getVionaRequestById,
  listVionaRequests,
} from '../src/services/viona/vionaRequestReadService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-viona-read-only-persistence-api] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

async function runControllerUnauthorized(): Promise<void> {
  let listStatus = 0;
  let detailStatus = 0;

  const makeRes = (setter: (code: number) => void) =>
    ({
      status(code: number) {
        setter(code);
        return this;
      },
      json() {
        return this;
      },
    }) as unknown as Response;

  await getVionaRequests({ query: {} } as Request, makeRes((code) => { listStatus = code; }));
  await getVionaRequestDetail(
    { params: { id: randomUUID() } } as unknown as Request,
    makeRes((code) => { detailStatus = code; })
  );

  assert.equal(listStatus, 401);
  assert.equal(detailStatus, 401);
}

async function run(): Promise<void> {
  requireDatabaseUrl();
  await runControllerUnauthorized();

  const prisma = getPrisma();
  const auditBefore = await prisma.vionaRequestAuditEvent.count();
  const statusBefore = await prisma.vionaRequestStatusEvent.count();

  const userA = randomUUID();
  const userB = randomUUID();
  const requestIdA = randomUUID();
  const requestIdB = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: userA, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: userB, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  try {
    await prisma.vionaRequest.createMany({
      data: [
        {
          id: requestIdA,
          tenantId: 'pilot-tenant-a',
          requesterUserId: userA,
          ownerUserId: userA,
          sourceUniverse: 'local',
          requestType: 'generic',
          status: 'submitted',
          title: 'Pack16 A',
          summary: 'Visible to A only',
        },
        {
          id: requestIdB,
          tenantId: 'pilot-tenant-b',
          requesterUserId: userB,
          ownerUserId: userB,
          sourceUniverse: 'local',
          requestType: 'generic',
          status: 'submitted',
          title: 'Pack16 B',
          summary: 'Visible to B only',
        },
      ],
    });

    const emptyForUnknown = await listVionaRequests({ authUserId: randomUUID() });
    assert.equal(emptyForUnknown.requests.length, 0);
    assert.equal(emptyForUnknown.safety, VIONA_REQUEST_READ_SAFETY);

    const listA = await listVionaRequests({ authUserId: userA });
    assert.equal(listA.requests.length, 1);
    assert.equal(listA.requests[0]?.id, requestIdA);
    assert.equal(listA.safety, VIONA_REQUEST_READ_SAFETY);

    const detailA = await getVionaRequestById({ authUserId: userA, requestId: requestIdA });
    assert.equal(detailA.ok, true);
    if (!detailA.ok) throw new Error('detail A failed');
    assert.equal(detailA.data.request.id, requestIdA);
    assert.equal(detailA.data.safety.readOnly, true);

    const crossUserDetail = await getVionaRequestById({
      authUserId: userA,
      requestId: requestIdB,
    });
    assert.equal(crossUserDetail.ok, false);
    if (crossUserDetail.ok) throw new Error('cross-user detail must fail');
    assert.equal(crossUserDetail.reason, 'request_not_found');

    const auditAfter = await prisma.vionaRequestAuditEvent.count();
    const statusAfter = await prisma.vionaRequestStatusEvent.count();
    assert.equal(auditAfter, auditBefore);
    assert.equal(statusAfter, statusBefore);
  } finally {
    await prisma.vionaRequest.deleteMany({
      where: { id: { in: [requestIdA, requestIdB] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
    await disconnectPrisma();
  }

  console.log('[test-viona-read-only-persistence-api] OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
