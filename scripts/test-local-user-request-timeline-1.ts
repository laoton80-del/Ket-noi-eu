/**
 * USER_TIMELINE_1 — requester read-only safe public timeline (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-user-request-timeline-1.ts
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
  LOCAL_USER_REQUEST_TIMELINE_SAFETY,
  readLocalUserRequestTimeline,
  type LocalUserRequestTimelineItemDto,
} from '../src/services/local/localUserRequestTimelineService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-user-request-timeline-1] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

const PUBLIC_COPY: Record<
  LocalServiceRequestAuditEventType,
  { title: string; message: string } | 'omit'
> = {
  REQUEST_CREATED: {
    title: 'Request submitted',
    message: 'Your request was submitted for merchant review.',
  },
  MERCHANT_REVIEW_STARTED: 'omit',
  MERCHANT_CONFIRMED: {
    title: 'Merchant confirmed',
    message: 'Merchant confirmed your request. No payment has been captured.',
  },
  MERCHANT_REJECTED: {
    title: 'Merchant rejected',
    message: 'Merchant rejected your request. No payment was captured.',
  },
  USER_CANCELLED: {
    title: 'Request cancelled',
    message: 'Request cancelled. No payment was captured.',
  },
  OPS_CANCELLED: {
    title: 'Request cancelled',
    message: 'Request cancelled by support. No payment was captured.',
  },
  REQUEST_EXPIRED: {
    title: 'Request expired',
    message: 'Request expired because the merchant did not respond in time.',
  },
  EXPIRY_DRY_RUN_IDENTIFIED: 'omit',
  EXPIRY_APPLY_ATTEMPTED: 'omit',
  EXPIRY_APPLY_SKIPPED_RACE_CONDITION: 'omit',
  EXPIRY_APPLY_COMPLETED: 'omit',
};

const PAYMENT_IMPLYING = [
  'payment captured',
  'settlement',
  'refund',
  'payout',
  'escrow',
  'debited',
  'hold released',
] as const;

async function run(): Promise<void> {
  requireDatabaseUrl();

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();

  const ownerId = randomUUID();
  const requesterId = randomUUID();
  const nonOwnerId = randomUUID();

  await prisma.user.createMany({
    data: [
      { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
      { id: nonOwnerId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  const biz = await prisma.business.create({
    data: {
      ownerId,
      name: `Timeline test ${randomUUID().slice(0, 8)}`,
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
      title: 'Timeline mapping test',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('create failed');
    requestIds.push(created.request.id);

    const base = new Date('2026-05-20T10:00:00.000Z');
    const extraTypes: LocalServiceRequestAuditEventType[] = [
      LocalServiceRequestAuditEventType.MERCHANT_CONFIRMED,
      LocalServiceRequestAuditEventType.MERCHANT_REJECTED,
      LocalServiceRequestAuditEventType.USER_CANCELLED,
      LocalServiceRequestAuditEventType.OPS_CANCELLED,
      LocalServiceRequestAuditEventType.REQUEST_EXPIRED,
      LocalServiceRequestAuditEventType.EXPIRY_DRY_RUN_IDENTIFIED,
    ];

    let offsetMs = 60_000;
    for (const eventType of extraTypes) {
      await prisma.localServiceRequestAuditEvent.create({
        data: {
          requestId: created.request.id,
          eventType,
          actorType: LocalServiceRequestAuditActorType.SYSTEM,
          fromStatus: LocalServiceRequestStatus.REQUESTED,
          toStatus: LocalServiceRequestStatus.REQUESTED,
          noWalletAction: true,
          walletModeSnapshot: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
          walletPhaseSnapshot: LocalWalletPhase.NONE,
          requestOnlyNoChargeSnapshot: true,
          createdAt: new Date(base.getTime() + offsetMs),
        },
      });
      offsetMs += 60_000;
    }

    const auditCountBefore = await prisma.localServiceRequestAuditEvent.count({
      where: { requestId: created.request.id },
    });
    assert.ok(auditCountBefore >= 7);

    const statusBefore = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
      select: { status: true, updatedAt: true },
    });

    const ownerRead = await readLocalUserRequestTimeline({
      requesterUserId: requesterId,
      requestId: created.request.id,
    });
    assert.equal(ownerRead.ok, true);
    if (!ownerRead.ok) throw new Error('owner read failed');

    assert.equal(ownerRead.data.requestId, created.request.id);
    assert.equal(ownerRead.data.status, statusBefore.status);
    assert.deepEqual(ownerRead.data.safety, LOCAL_USER_REQUEST_TIMELINE_SAFETY);

    for (let i = 1; i < ownerRead.data.timeline.length; i++) {
      const prev = ownerRead.data.timeline[i - 1]!.at;
      const cur = ownerRead.data.timeline[i]!.at;
      assert.ok(prev <= cur, 'timeline must be ascending by at');
    }

    const publicTypes = (
      Object.entries(PUBLIC_COPY) as [
        LocalServiceRequestAuditEventType,
        (typeof PUBLIC_COPY)[LocalServiceRequestAuditEventType],
      ][]
    ).filter(
      (
        entry
      ): entry is [
        LocalServiceRequestAuditEventType,
        { title: string; message: string },
      ] => entry[1] !== 'omit'
    );
    for (const [eventType, expected] of publicTypes) {
      const found: LocalUserRequestTimelineItemDto | undefined = ownerRead.data.timeline.find(
        (t) => t.type === eventType
      );
      assert.ok(found, `expected timeline item for ${eventType}`);
      assert.equal(found.title, expected.title);
      assert.equal(found.message, expected.message);
      assert.equal(found.noPaymentCaptured, true);
    }

    assert.ok(
      !ownerRead.data.timeline.some(
        (t) => t.type === LocalServiceRequestAuditEventType.EXPIRY_DRY_RUN_IDENTIFIED
      ),
      'internal expiry dry-run marker must be omitted'
    );

    const serialized = JSON.stringify(ownerRead.data).toLowerCase();
    assert.ok(!serialized.includes('metadatajson'));
    assert.ok(!serialized.includes('actoruserid'));
    assert.ok(!serialized.includes('phone'));
    assert.ok(!serialized.includes('email'));
    assert.ok(!serialized.includes('password'));
    assert.ok(!serialized.includes('token'));
    assert.ok(!serialized.includes('secret'));

    for (const item of ownerRead.data.timeline) {
      const blob = `${item.title} ${item.message}`.toLowerCase();
      for (const phrase of PAYMENT_IMPLYING) {
        if (phrase === 'payment captured' && blob.includes('no payment')) continue;
        assert.ok(!blob.includes(phrase), `timeline must not imply: ${phrase}`);
      }
    }

    const nonOwner = await readLocalUserRequestTimeline({
      requesterUserId: nonOwnerId,
      requestId: created.request.id,
    });
    assert.equal(nonOwner.ok, false);
    if (nonOwner.ok || nonOwner.reason !== 'request_not_found') {
      throw new Error('expected request_not_found for non-owner');
    }

    const unauth = await readLocalUserRequestTimeline({
      requesterUserId: '',
      requestId: created.request.id,
    });
    assert.equal(unauth.ok, false);
    if (unauth.ok || unauth.reason !== 'invalid_input') {
      throw new Error('expected invalid_input for empty requester id');
    }

    const missing = await readLocalUserRequestTimeline({
      requesterUserId: requesterId,
      requestId: randomUUID(),
    });
    assert.equal(missing.ok, false);
    if (missing.ok || missing.reason !== 'request_not_found') {
      throw new Error('expected request_not_found for missing request');
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
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, requesterId, nonOwnerId] } },
    });
    await disconnectPrisma();
  }

  console.log('[test-local-user-request-timeline-1] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
