/**
 * AUDIT_READ_API_1 — ops read-only Local request audit events (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-audit-read-api-1.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  BizType,
  LocalRequestSource,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
} from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { confirmMerchantLocalServiceRequest } from '../src/services/local/localMerchantRequestConfirmService';
import {
  LOCAL_REQUEST_AUDIT_READ_SAFETY,
  readLocalRequestAuditEventsForOps,
} from '../src/services/local/localRequestAuditReadService';
import { createLocalServiceRequest } from '../src/services/local/localRequestCreateService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-audit-read-api-1] Refusing to run: DATABASE_URL is not set.'
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
      name: `Audit read API ${randomUUID().slice(0, 8)}`,
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const requestIds: string[] = [];

  try {
    const created = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Audit read test request',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    requestIds.push(created.request.id);

    const confirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: created.request.id,
    });
    assert.equal(confirm.ok, true);
    if (!confirm.ok) throw new Error('confirm failed');

    const auditCountBefore = await prisma.localServiceRequestAuditEvent.count({
      where: { requestId: created.request.id },
    });
    assert.ok(auditCountBefore >= 2);

    const statusBefore = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
      select: { status: true, updatedAt: true },
    });

    const adminRead = await readLocalRequestAuditEventsForOps({
      adminUserId: adminId,
      requestId: created.request.id,
    });
    assert.equal(adminRead.ok, true);
    if (!adminRead.ok) throw new Error('admin read failed');

    assert.equal(adminRead.data.requestId, created.request.id);
    assert.deepEqual(adminRead.data.safety, LOCAL_REQUEST_AUDIT_READ_SAFETY);
    assert.equal(adminRead.data.events.length, auditCountBefore);

    for (let i = 1; i < adminRead.data.events.length; i++) {
      const prev = adminRead.data.events[i - 1]!.createdAt;
      const cur = adminRead.data.events[i]!.createdAt;
      assert.ok(prev <= cur, 'events must be ascending by createdAt');
    }

    const eventTypes = adminRead.data.events.map((e) => e.eventType);
    assert.ok(eventTypes.includes(LocalServiceRequestAuditEventType.REQUEST_CREATED));
    assert.ok(eventTypes.includes(LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED));

    for (const ev of adminRead.data.events) {
      assert.equal(ev.noWalletAction, true);
      assert.equal(ev.walletModeSnapshot, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
      assert.equal(ev.walletPhaseSnapshot, LocalWalletPhase.NONE);
      assert.equal(ev.requestOnlyNoChargeSnapshot, true);
      assert.ok(ev.safeMessage == null || !ev.safeMessage.toLowerCase().includes('payment captured'));
      assert.ok(!('metadataJson' in ev));
      const serialized = JSON.stringify(ev).toLowerCase();
      assert.ok(!serialized.includes('phone'));
      assert.ok(!serialized.includes('email'));
      assert.ok(!serialized.includes('password'));
      assert.ok(!serialized.includes('token'));
    }

    const forbidden = await readLocalRequestAuditEventsForOps({
      adminUserId: b2cId,
      requestId: created.request.id,
    });
    assert.equal(forbidden.ok, false);
    if (forbidden.ok || forbidden.reason !== 'forbidden') {
      throw new Error('expected forbidden for non-admin');
    }

    const unauth = await readLocalRequestAuditEventsForOps({
      adminUserId: '',
      requestId: created.request.id,
    });
    assert.equal(unauth.ok, false);
    if (unauth.ok || unauth.reason !== 'invalid_input') {
      throw new Error('expected invalid_input for empty admin id');
    }

    const missing = await readLocalRequestAuditEventsForOps({
      adminUserId: adminId,
      requestId: randomUUID(),
    });
    assert.equal(missing.ok, false);
    if (missing.ok || missing.reason !== 'request_not_found') {
      throw new Error('expected request_not_found');
    }

    const auditCountAfter = await prisma.localServiceRequestAuditEvent.count({
      where: { requestId: created.request.id },
    });
    assert.equal(auditCountAfter, auditCountBefore);

    const statusAfter = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(statusAfter.status, statusBefore.status);
    assert.equal(statusAfter.updatedAt.getTime(), statusBefore.updatedAt.getTime());

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
    if (requestIds.length > 0) {
      await prisma.localServiceRequestAuditEvent.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: requestIds } } });
    }
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, ownerId, requesterId, b2cId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-audit-read-api-1] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
