/**
 * RATE_LIMIT_ABUSE_GUARD_1 — Local mutation in-memory rate limit (dev/staging DB only).
 *
 * Requires DATABASE_URL. Refuses to run without it.
 *
 * Run: npx tsx scripts/test-local-rate-limit-abuse-guard-1.ts
 */
import 'dotenv/config';

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';
import {
  BizType,
  LocalRequestSource,
  LocalServiceType,
  Role,
} from '@prisma/client';

import { createLocalMutationRateLimiter } from '../src/middleware/localRateLimitMiddleware';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { createLocalServiceRequest } from '../src/services/local/localRequestCreateService';
import {
  buildLocalRateLimitKey,
  LOCAL_RATE_LIMIT_TOO_MANY_MESSAGE,
  resetLocalRateLimitGuardForTests,
  setLocalRateLimitPoliciesForTests,
  tryConsumeLocalRateLimit,
} from '../src/services/local/localRateLimitGuard';
import { readLocalUserRequestTimeline } from '../src/services/local/localUserRequestTimelineService';

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      '[test-local-rate-limit-abuse-guard-1] Refusing to run: DATABASE_URL is not set.'
    );
  }
}

function uniquePhone(): string {
  return `+4209${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

type MockRes = {
  statusCode: number;
  body: unknown;
  status(code: number): MockRes;
  json(payload: unknown): void;
};

function createMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    },
  };
  return res;
}

async function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>
): Promise<{ statusCode: number; body: unknown; nextCalled: boolean }> {
  const res = createMockRes();
  let nextCalled = false;
  await new Promise<void>((resolve) => {
    middleware(req as Request, res as unknown as Response, () => {
      nextCalled = true;
      resolve();
    });
  });
  return { statusCode: res.statusCode, body: res.body, nextCalled };
}

async function run(): Promise<void> {
  requireDatabaseUrl();

  resetLocalRateLimitGuardForTests();

  const requesterId = randomUUID();
  const ownerId = randomUUID();
  const key = buildLocalRateLimitKey(requesterId, 'create_request');
  assert.ok(!key.includes('email'));
  assert.ok(!key.includes('phone'));
  assert.ok(!key.includes('@'));
  assert.equal(key, `local:${requesterId}:create_request`);

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();

  await prisma.user.createMany({
    data: [
      { id: ownerId, phoneNumber: uniquePhone(), role: Role.B2B_VN, pinCode: 'x' },
      { id: requesterId, phoneNumber: uniquePhone(), role: Role.B2C, pinCode: 'x' },
    ],
  });

  const biz = await prisma.business.create({
    data: {
      ownerId,
      name: `Rate limit test ${randomUUID().slice(0, 8)}`,
      category: BizType.LOCAL_EXPERIENCE,
      locationLat: 1,
      locationLng: 1,
    },
  });

  const requestIds: string[] = [];

  try {
    setLocalRateLimitPoliciesForTests({
      create_request: { maxAttempts: 2, windowMs: 60_000 },
      merchant_confirm: { maxAttempts: 2, windowMs: 60_000 },
    });

    const created = await createLocalServiceRequest({
      requesterUserId: requesterId,
      businessId: biz.id,
      serviceType: LocalServiceType.GENERIC_REQUEST,
      title: 'Rate limit allowed create',
      source: LocalRequestSource.API_DIRECT,
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error('expected first create');
    requestIds.push(created.request.id);

    const auditAfterFirst = await prisma.localServiceRequestAuditEvent.count({
      where: { requestId: created.request.id },
    });
    assert.ok(auditAfterFirst >= 1);

    assert.equal(tryConsumeLocalRateLimit(requesterId, 'create_request'), true);
    assert.equal(tryConsumeLocalRateLimit(requesterId, 'create_request'), true);
    assert.equal(tryConsumeLocalRateLimit(requesterId, 'create_request'), false);

    const limiter = createLocalMutationRateLimiter('create_request');
    const blocked = await runMiddleware(limiter, { authUserId: requesterId });
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.nextCalled, false);
    const errBody = blocked.body as { success?: boolean; error?: string };
    assert.equal(errBody.success, false);
    assert.equal(errBody.error, LOCAL_RATE_LIMIT_TOO_MANY_MESSAGE);
    const serialized = JSON.stringify(blocked.body).toLowerCase();
    assert.ok(!serialized.includes('bucket'));
    assert.ok(!serialized.includes('counter'));
    assert.ok(!serialized.includes('windowms'));

    const auditBeforeBlockedCreate = await prisma.localServiceRequestAuditEvent.count({
      where: { requestId: created.request.id },
    });
    const statusBefore = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
      select: { status: true, updatedAt: true },
    });

    if (tryConsumeLocalRateLimit(requesterId, 'create_request')) {
      throw new Error('expected guard to block further create_request');
    }

    const auditAfterBlocked = await prisma.localServiceRequestAuditEvent.count({
      where: { requestId: created.request.id },
    });
    assert.equal(auditAfterBlocked, auditBeforeBlockedCreate);

    const statusAfter = await prisma.localServiceRequest.findUniqueOrThrow({
      where: { id: created.request.id },
    });
    assert.equal(statusAfter.status, statusBefore.status);
    assert.equal(statusAfter.updatedAt.getTime(), statusBefore.updatedAt.getTime());

    const timelineRead = await readLocalUserRequestTimeline({
      requesterUserId: requesterId,
      requestId: created.request.id,
    });
    assert.equal(timelineRead.ok, true);
    if (!timelineRead.ok) throw new Error('read-only timeline should not be blocked');

    resetLocalRateLimitGuardForTests();
    setLocalRateLimitPoliciesForTests({
      merchant_confirm: { maxAttempts: 1, windowMs: 60_000 },
    });

    const confirmLimiter = createLocalMutationRateLimiter('merchant_confirm', {
      scopeRequestId: true,
    });
    const allowedConfirm = await runMiddleware(confirmLimiter, {
      authUserId: ownerId,
      params: { id: created.request.id },
    });
    assert.equal(allowedConfirm.statusCode, 200);
    assert.equal(allowedConfirm.nextCalled, true);

    const blockedConfirm = await runMiddleware(confirmLimiter, {
      authUserId: ownerId,
      params: { id: created.request.id },
    });
    assert.equal(blockedConfirm.statusCode, 429);
    assert.equal(blockedConfirm.nextCalled, false);

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
    resetLocalRateLimitGuardForTests();
    if (requestIds.length > 0) {
      await prisma.localServiceRequestAuditEvent.deleteMany({
        where: { requestId: { in: requestIds } },
      });
      await prisma.localServiceRequest.deleteMany({ where: { id: { in: requestIds } } });
    }
    await prisma.business.delete({ where: { id: biz.id } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId] } } });
    await disconnectPrisma();
  }

  console.log('[test-local-rate-limit-abuse-guard-1] OK');
}

void run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
