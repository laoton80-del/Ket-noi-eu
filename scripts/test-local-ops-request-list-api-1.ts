/**
 * OPS_AUDIT_UI.READONLY_API_AUDIT.1 — ops read-only Local request list/detail API.
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-ops-request-list-api-1.ts
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

import {
  getOpsLocalServiceRequestDetail,
  getOpsLocalServiceRequests,
} from '../src/controllers/LocalRequestController';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { createLocalServiceRequest } from '../src/services/local/localRequestCreateService';
import { confirmMerchantLocalServiceRequest } from '../src/services/local/localMerchantRequestConfirmService';
import {
  LOCAL_OPS_REQUEST_LIST_SAFETY,
  getOpsLocalServiceRequestById,
  listOpsLocalServiceRequests,
} from '../src/services/local/localOpsRequestListService';

const FORBIDDEN_KEYS = [
  'phoneNumber',
  'pinCode',
  'email',
  'token',
  'jwt',
  'password',
  'totalVioCredits',
  'heldVioCredits',
  'releasedVioCredits',
  'platformFeeVioCredits',
  'stripePaymentIntentId',
  'metadataJson',
] as const;

const FORBIDDEN_COPY = [
  'escrow',
  'payout',
  'settlement',
  'cash-out',
  'withdraw',
  'paid booking',
] as const;

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-ops-request-list-api-1] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

function assertNoForbiddenPayload(payload: string): void {
  const lower = payload.toLowerCase();
  for (const key of FORBIDDEN_KEYS) {
    assert.ok(!lower.includes(key.toLowerCase()), `forbidden key "${key}" in payload`);
  }
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

  await getOpsLocalServiceRequests(req, res);

  assert.equal(statusCode, 401);
  assert.equal((body as { success?: boolean }).success, false);
}

async function run(): Promise<void> {
  requireDatabaseUrl();
  await runControllerUnauthorized();

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();

  const adminId = randomUUID();
  const ownerId = randomUUID();
  const requesterId = randomUUID();
  const b2cId = randomUUID();
  const merchantId = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: adminId, phoneNumber: uniquePhone(), role: Role.ADMIN, pinCode: 'x' },
      { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: b2cId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: merchantId, phoneNumber: uniquePhone(), role: Role.B2B_EU, pinCode: 'x' },
    ],
  });

  const biz = await prisma.business.create({
    data: {
      ownerId,
      name: 'Ops list API test biz',
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const createdIds: string[] = [];

  try {
    const created = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Ops list row',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    createdIds.push(created.request.id);

    const confirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: created.request.id,
    });
    assert.equal(confirm.ok, true);
    if (!confirm.ok) throw new Error('confirm failed');

    const statusBefore = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
      select: { status: true, updatedAt: true },
    });

    const adminList = await listOpsLocalServiceRequests({ adminUserId: adminId });
    assert.equal(adminList.ok, true);
    if (!adminList.ok) throw new Error('admin list failed');
    assert.deepEqual(adminList.data.safety, LOCAL_OPS_REQUEST_LIST_SAFETY);
    assert.ok(adminList.data.requests.some((r) => r.id === created.request.id));

    const row = adminList.data.requests.find((r) => r.id === created.request.id)!;
    assert.equal(row.walletMode, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(row.walletPhase, LocalWalletPhase.NONE);
    assert.equal(row.display.noPaymentCaptured, true);
    assert.equal(row.display.requestOnlyNoCharge, true);
    assert.equal(row.merchantDecision, 'confirmed');
    assert.equal(row.requester.role, Role.B2C);
    assert.equal(row.business.owner.userId, ownerId);
    assert.equal(row.tenantIsolation.requesterIsBusinessOwner, false);
    assertNoForbiddenPayload(JSON.stringify(adminList.data));

    const b2cList = await listOpsLocalServiceRequests({ adminUserId: b2cId });
    assert.equal(b2cList.ok, false);
    if (b2cList.ok || b2cList.reason !== 'forbidden') {
      throw new Error('expected forbidden for B2C');
    }

    const merchantList = await listOpsLocalServiceRequests({ adminUserId: merchantId });
    assert.equal(merchantList.ok, false);
    if (merchantList.ok || merchantList.reason !== 'forbidden') {
      throw new Error('expected forbidden for merchant');
    }

    const detail = await getOpsLocalServiceRequestById({
      adminUserId: adminId,
      requestId: created.request.id,
    });
    assert.equal(detail.ok, true);
    if (!detail.ok) throw new Error('detail failed');
    assert.equal(detail.data.id, created.request.id);
    assertNoForbiddenPayload(JSON.stringify(detail.data));

    const detailForbidden = await getOpsLocalServiceRequestById({
      adminUserId: requesterId,
      requestId: created.request.id,
    });
    assert.equal(detailForbidden.ok, false);
    if (detailForbidden.ok || detailForbidden.reason !== 'forbidden') {
      throw new Error('expected forbidden detail for requester');
    }

    let controllerStatus = 0;
    let controllerBody: unknown;
    const res = {
      status(code: number) {
        controllerStatus = code;
        return this;
      },
      json(payload: unknown) {
        controllerBody = payload;
        return this;
      },
    } as unknown as Response;

    const req = {
      authUserId: adminId,
      params: { id: created.request.id },
    } as unknown as Request;

    await getOpsLocalServiceRequestDetail(req, res);
    assert.equal(controllerStatus, 200);
    assert.equal((controllerBody as { success?: boolean }).success, true);

    const statusAfter = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(statusAfter.status, statusBefore.status);
    assert.equal(statusAfter.updatedAt.getTime(), statusBefore.updatedAt.getTime());

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    console.log('[test-local-ops-request-list-api-1] OK');
  } finally {
    if (createdIds.length > 0) {
      await prisma.localServiceRequestAuditEvent.deleteMany({
        where: { requestId: { in: createdIds } },
      });
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, ownerId, requesterId, b2cId, merchantId] } },
    });
    await disconnectPrisma();
  }
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
