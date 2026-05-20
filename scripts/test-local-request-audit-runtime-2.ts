/**
 * AUDIT_RUNTIME_2 — lifecycle mutation audit wiring (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-request-audit-runtime-2.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  BizType,
  LocalRequestSource,
  LocalServiceRequestAuditActorType,
  LocalServiceRequestAuditEventType,
  LocalServiceRequestStatus,
  LocalServiceType,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
} from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { createLocalServiceRequest } from '../src/services/local/localRequestCreateService';
import { confirmMerchantLocalServiceRequest } from '../src/services/local/localMerchantRequestConfirmService';
import { rejectMerchantLocalServiceRequest } from '../src/services/local/localMerchantRequestRejectService';
import { cancelUserLocalServiceRequest } from '../src/services/local/localUserRequestCancelService';
import { cancelOpsLocalServiceRequest } from '../src/services/local/localOpsRequestCancelService';

const PAYMENT_IMPLYING_SUBSTRINGS = [
  'payment received',
  'refunded',
  'escrow released',
  'vio credits returned',
  'debited',
  'settled',
  'hold released',
];

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-request-audit-runtime-2] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

async function countAudit(
  requestId: string,
  eventType: LocalServiceRequestAuditEventType
): Promise<number> {
  const prisma = getPrisma();
  return prisma.localServiceRequestAuditEvent.count({
    where: { requestId, eventType },
  });
}

async function assertAuditSnapshots(requestId: string): Promise<void> {
  const prisma = getPrisma();
  const rows = await prisma.localServiceRequestAuditEvent.findMany({
    where: { requestId },
  });
  for (const row of rows) {
    assert.equal(row.noWalletAction, true);
    assert.equal(row.walletModeSnapshot, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(row.walletPhaseSnapshot, LocalWalletPhase.NONE);
    assert.equal(row.requestOnlyNoChargeSnapshot, true);
    assert.ok(row.safeMessage != null && row.safeMessage.length > 0);
    const msg = row.safeMessage.toLowerCase();
    for (const bad of PAYMENT_IMPLYING_SUBSTRINGS) {
      assert.ok(!msg.includes(bad), `safeMessage must not imply payment: ${row.safeMessage}`);
    }
    const meta = row.metadataJson;
    if (meta != null && typeof meta === 'object' && !Array.isArray(meta)) {
      const keys = JSON.stringify(meta).toLowerCase();
      assert.ok(!keys.includes('phone'), 'audit metadata must not store phone');
      assert.ok(!keys.includes('email'), 'audit metadata must not store email');
      assert.ok(!keys.includes('password'), 'audit metadata must not store password');
      assert.ok(!keys.includes('token'), 'audit metadata must not store token');
    }
  }
}

async function run(): Promise<void> {
  requireDatabaseUrl();

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();

  const ownerId = randomUUID();
  const requesterId = randomUUID();
  const adminId = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: adminId, phoneNumber: uniquePhone(), role: Role.ADMIN, pinCode: 'x' },
    ],
  });

  const business = await prisma.business.create({
    data: {
      ownerId,
      name: `Audit R2 ${randomUUID().slice(0, 8)}`,
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 10.77,
      locationLng: 106.7,
    },
  });

  const requestIds: string[] = [];

  try {
    const created = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Audit runtime 2 create',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    requestIds.push(created.request.id);

    assert.equal(
      await countAudit(created.request.id, LocalServiceRequestAuditEventType.REQUEST_CREATED),
      1
    );

    const confirmReq = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Audit runtime 2 confirm',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(confirmReq.ok, true);
    if (!confirmReq.ok) throw new Error('confirm setup create failed');
    requestIds.push(confirmReq.request.id);

    const confirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: confirmReq.request.id,
    });
    assert.equal(confirm.ok, true);
    if (!confirm.ok) throw new Error('confirm failed');

    const confirmAudits = await prisma.localServiceRequestAuditEvent.findMany({
      where: {
        requestId: confirmReq.request.id,
        eventType: LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED,
      },
    });
    assert.equal(confirmAudits.length, 1);
    assert.equal(confirmAudits[0]?.fromStatus, LocalServiceRequestStatus.REQUESTED);
    assert.equal(confirmAudits[0]?.toStatus, LocalServiceRequestStatus.CONFIRMED);
    assert.equal(confirmAudits[0]?.actorType, LocalServiceRequestAuditActorType.MERCHANT);

    const confirmAgain = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: confirmReq.request.id,
    });
    assert.equal(confirmAgain.ok, true);
    assert.equal(
      await countAudit(confirmReq.request.id, LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED),
      1
    );

    const rejectReq = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Audit runtime 2 reject',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(rejectReq.ok, true);
    if (!rejectReq.ok) throw new Error('reject setup create failed');
    requestIds.push(rejectReq.request.id);

    const reject = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: rejectReq.request.id,
    });
    assert.equal(reject.ok, true);
    if (!reject.ok) throw new Error('reject failed');

    const rejectAudits = await prisma.localServiceRequestAuditEvent.findMany({
      where: {
        requestId: rejectReq.request.id,
        eventType: LocalServiceRequestAuditEventType.MERCHANT_REJECTED,
      },
    });
    assert.equal(rejectAudits.length, 1);
    assert.equal(rejectAudits[0]?.fromStatus, LocalServiceRequestStatus.REQUESTED);
    assert.equal(rejectAudits[0]?.toStatus, LocalServiceRequestStatus.REJECTED);

    const rejectAgain = await rejectMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: rejectReq.request.id,
    });
    assert.equal(rejectAgain.ok, true);
    assert.equal(
      await countAudit(rejectReq.request.id, LocalServiceRequestAuditEventType.MERCHANT_REJECTED),
      1
    );

    const userCancelReq = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Audit runtime 2 user cancel',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(userCancelReq.ok, true);
    if (!userCancelReq.ok) throw new Error('user cancel setup create failed');
    requestIds.push(userCancelReq.request.id);

    const userCancel = await cancelUserLocalServiceRequest({
      requesterUserId: requesterId,
      requestId: userCancelReq.request.id,
    });
    assert.equal(userCancel.ok, true);
    if (!userCancel.ok) throw new Error('user cancel failed');

    const userCancelAudits = await prisma.localServiceRequestAuditEvent.findMany({
      where: {
        requestId: userCancelReq.request.id,
        eventType: LocalServiceRequestAuditEventType.USER_CANCELLED,
      },
    });
    assert.equal(userCancelAudits.length, 1);
    assert.equal(userCancelAudits[0]?.actorType, LocalServiceRequestAuditActorType.REQUESTER);
    assert.equal(userCancelAudits[0]?.fromStatus, LocalServiceRequestStatus.REQUESTED);
    assert.equal(userCancelAudits[0]?.toStatus, LocalServiceRequestStatus.USER_CANCELLED);

    const userCancelAgain = await cancelUserLocalServiceRequest({
      requesterUserId: requesterId,
      requestId: userCancelReq.request.id,
    });
    assert.equal(userCancelAgain.ok, true);
    assert.equal(
      await countAudit(userCancelReq.request.id, LocalServiceRequestAuditEventType.USER_CANCELLED),
      1
    );

    const opsCancelReq = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: business.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Audit runtime 2 ops cancel',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(opsCancelReq.ok, true);
    if (!opsCancelReq.ok) throw new Error('ops cancel setup create failed');
    requestIds.push(opsCancelReq.request.id);

    const opsCancel = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: opsCancelReq.request.id,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(opsCancel.ok, true);
    if (!opsCancel.ok) throw new Error('ops cancel failed');

    const opsAudits = await prisma.localServiceRequestAuditEvent.findMany({
      where: {
        requestId: opsCancelReq.request.id,
        eventType: LocalServiceRequestAuditEventType.OPS_CANCELLED,
      },
    });
    assert.equal(opsAudits.length, 1);
    assert.equal(opsAudits[0]?.actorType, LocalServiceRequestAuditActorType.OPS);
    assert.equal(opsAudits[0]?.fromStatus, LocalServiceRequestStatus.REQUESTED);
    assert.equal(opsAudits[0]?.toStatus, LocalServiceRequestStatus.OPS_CANCELLED);

    const opsCancelAgain = await cancelOpsLocalServiceRequest({
      adminUserId: adminId,
      requestId: opsCancelReq.request.id,
      cancelReason: 'OPS_CANCEL',
    });
    assert.equal(opsCancelAgain.ok, true);
    assert.equal(
      await countAudit(opsCancelReq.request.id, LocalServiceRequestAuditEventType.OPS_CANCELLED),
      1
    );

    const blockedConfirm = await confirmMerchantLocalServiceRequest({
      merchantUserId: ownerId,
      requestId: rejectReq.request.id,
    });
    assert.equal(blockedConfirm.ok, false);
    if (blockedConfirm.ok || blockedConfirm.reason !== 'invalid_status') {
      throw new Error('expected blocked confirm on REJECTED');
    }
    assert.equal(
      await countAudit(rejectReq.request.id, LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED),
      0
    );

    for (const id of requestIds) {
      await assertAuditSnapshots(id);
    }

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore);

    const bookingCount = await prisma.booking.count({ where: { userId: requesterId } });
    assert.equal(bookingCount, 0);

    const tourismCount = await prisma.tourismBooking.count({ where: { userId: requesterId } });
    assert.equal(tourismCount, 0);

    const requesterWallet = await prisma.wallet.findUnique({ where: { userId: requesterId } });
    if (requesterWallet) {
      const walletAfter = await prisma.wallet.findUnique({
        where: { userId: requesterId },
        select: { balanceVIG: true, lockedBalanceVIG: true },
      });
      assert.equal(walletAfter?.balanceVIG, requesterWallet.balanceVIG);
      assert.equal(walletAfter?.lockedBalanceVIG, requesterWallet.lockedBalanceVIG);
    }
  } finally {
    if (requestIds.length > 0) {
      await prisma.localServiceRequestAuditEvent.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: requestIds } } });
    }
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId, adminId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-request-audit-runtime-2] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
