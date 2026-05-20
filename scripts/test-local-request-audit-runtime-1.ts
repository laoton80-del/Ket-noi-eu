/**
 * AUDIT_RUNTIME_1 — LocalServiceRequestAuditEvent writer safety (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-request-audit-runtime-1.ts
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
import {
  buildRequestAuditSafeMessage,
  createLocalRequestAuditEvent,
} from '../src/services/local/localRequestAuditEventService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-request-audit-runtime-1] Refusing to run: DATABASE_URL is not set.'
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

  await prisma.user.createMany({
    data: [
      {
        id: ownerId,
        phoneNumber: uniquePhone(),
        role: Role.B2B_VN,
        pinCode: 'hash-not-used',
      },
      {
        id: requesterId,
        phoneNumber: uniquePhone(),
        role: Role.B2C,
        pinCode: 'hash-not-used',
      },
    ],
  });

  const business = await prisma.business.create({
    data: {
      ownerId,
      name: `Audit runtime test ${randomUUID().slice(0, 8)}`,
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 10.77,
      locationLng: 106.7,
    },
  });

  const service = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Audit test menu',
      priceVIG: 0,
    },
  });

  const created = await createLocalServiceRequest({
    requesterUserId: requesterId,
    businessId: business.id,
    serviceId: service.id,
    serviceType: LocalServiceType.GENERIC_REQUEST,
    title: 'Audit runtime integration request',
    source: LocalRequestSource.API_DIRECT,
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected request create');

  const requestId = created.request.id;
  const requestBeforeAudit = await prisma.localServiceRequest.findUniqueOrThrow({
    where: { id: requestId },
    select: { status: true, updatedAt: true, walletMode: true, walletPhase: true },
  });
  const auditEventIds: string[] = [];

  const requesterWalletBefore = await prisma.wallet.findUnique({
    where: { userId: requesterId },
    select: { balanceVIG: true, lockedBalanceVIG: true },
  });

  try {
    const unsafeMeta = await createLocalRequestAuditEvent({
      requestId,
      eventType: LocalServiceRequestAuditEventType.REQUEST_CREATED,
      actorType: LocalServiceRequestAuditActorType.REQUESTER,
      actorUserId: requesterId,
      businessId: business.id,
      fromStatus: null,
      toStatus: LocalServiceRequestStatus.REQUESTED,
      metadataJson: { phoneNumber: '+secret' },
    });
    assert.equal(unsafeMeta.ok, false);
    if (unsafeMeta.ok || unsafeMeta.reason !== 'unsafe_metadata') {
      throw new Error('expected unsafe_metadata rejection');
    }

    const unsafeMessage = await createLocalRequestAuditEvent({
      requestId,
      eventType: LocalServiceRequestAuditEventType.REQUEST_CREATED,
      actorType: LocalServiceRequestAuditActorType.REQUESTER,
      actorUserId: requesterId,
      safeMessage: 'Payment captured for this request.',
    });
    assert.equal(unsafeMessage.ok, false);
    if (unsafeMessage.ok || unsafeMessage.reason !== 'unsafe_safe_message') {
      throw new Error('expected unsafe_safe_message rejection');
    }

    const audit = await createLocalRequestAuditEvent({
      requestId,
      eventType: LocalServiceRequestAuditEventType.REQUEST_CREATED,
      actorType: LocalServiceRequestAuditActorType.REQUESTER,
      actorUserId: requesterId,
      businessId: business.id,
      fromStatus: null,
      toStatus: LocalServiceRequestStatus.REQUESTED,
      safeMessage: buildRequestAuditSafeMessage(
        LocalServiceRequestAuditEventType.REQUEST_CREATED
      ),
      metadataJson: { source: 'audit_runtime_1_test' },
      idempotencyKey: `audit-test-${randomUUID()}`,
    });
    assert.equal(audit.ok, true);
    if (!audit.ok) throw new Error('expected audit create');
    auditEventIds.push(audit.event.id);

    const persisted = await prisma.localServiceRequestAuditEvent.findUniqueOrThrow({
      where: { id: audit.event.id },
    });
    assert.equal(persisted.requestId, requestId);
    assert.equal(persisted.eventType, LocalServiceRequestAuditEventType.REQUEST_CREATED);
    assert.equal(persisted.actorType, LocalServiceRequestAuditActorType.REQUESTER);
    assert.equal(persisted.actorUserId, requesterId);
    assert.equal(persisted.noWalletAction, true);
    assert.equal(persisted.walletModeSnapshot, LocalWalletMode.REQUEST_ONLY_NO_CHARGE);
    assert.equal(persisted.walletPhaseSnapshot, LocalWalletPhase.NONE);
    assert.equal(persisted.requestOnlyNoChargeSnapshot, true);
    assert.equal(persisted.toStatus, LocalServiceRequestStatus.REQUESTED);

    const requestAfter = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    assert.equal(requestAfter.status, requestBeforeAudit.status);
    assert.equal(requestAfter.updatedAt.getTime(), requestBeforeAudit.updatedAt.getTime());
    assert.equal(requestAfter.status, LocalServiceRequestStatus.REQUESTED);
    assert.equal(requestAfter.walletMode, requestBeforeAudit.walletMode);
    assert.equal(requestAfter.walletPhase, requestBeforeAudit.walletPhase);

    const txAfter = await prisma.transaction.count();
    assert.equal(txAfter, txBefore, 'audit writer must not insert wallet Transaction rows');

    const bookingCount = await prisma.booking.count({ where: { userId: requesterId } });
    assert.equal(bookingCount, 0);

    const tourismCount = await prisma.tourismBooking.count({ where: { userId: requesterId } });
    assert.equal(tourismCount, 0);

    const requesterWalletAfter = await prisma.wallet.findUnique({
      where: { userId: requesterId },
      select: { balanceVIG: true, lockedBalanceVIG: true },
    });
    if (requesterWalletBefore && requesterWalletAfter) {
      assert.equal(requesterWalletAfter.balanceVIG, requesterWalletBefore.balanceVIG);
      assert.equal(requesterWalletAfter.lockedBalanceVIG, requesterWalletBefore.lockedBalanceVIG);
    }
  } finally {
    if (auditEventIds.length > 0) {
      await prisma.localServiceRequestAuditEvent.deleteMany({
        where: { id: { in: auditEventIds } },
      });
    }
    await prisma.localServiceRequest.deleteMany({ where: { id: requestId } });
    await prisma.service.deleteMany({ where: { businessId: business.id } });
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-request-audit-runtime-1] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
