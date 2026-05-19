/**
 * Unit checks for tourism held-booking timeout candidate classification (no database).
 *
 * Run: npx tsx scripts/test-tourism-timeout-release-eligibility.ts
 */
import assert from 'node:assert/strict';

import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import {
  classifyTourismHeldBookingTimeoutCandidate,
} from '../src/services/tourism/tourismHeldBookingTimeoutEligibility';

const now = new Date('2026-05-20T12:00:00.000Z');
const old = new Date('2026-05-17T12:00:00.000Z');
const recent = new Date('2026-05-20T06:00:00.000Z');
const settledAt = new Date('2026-05-18T00:00:00.000Z');

function run(): void {
  const eligible = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: null,
      confirmedAt: null,
      createdAt: old,
      fxLockedAt: old,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 100,
    },
    now,
    48
  );
  assert.equal(eligible.bucket, 'eligible');

  const notOld = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: null,
      confirmedAt: null,
      createdAt: recent,
      fxLockedAt: recent,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 50,
    },
    now,
    48
  );
  assert.equal(notOld.bucket, 'not_yet_due');

  const legacy = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
      providerSettledAt: settledAt,
      confirmedAt: null,
      createdAt: old,
      fxLockedAt: old,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 80,
    },
    now,
    48
  );
  assert.equal(legacy.bucket, 'already_settled_or_terminal');

  const preview = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.PREVIEW_ONLY,
      providerSettledAt: null,
      confirmedAt: null,
      createdAt: old,
      fxLockedAt: null,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 0,
    },
    now,
    48
  );
  assert.equal(preview.bucket, 'already_settled_or_terminal');

  const confirmed = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.CONFIRMED,
      settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
      providerSettledAt: settledAt,
      confirmedAt: settledAt,
      createdAt: old,
      fxLockedAt: old,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 100,
    },
    now,
    48
  );
  assert.equal(confirmed.bucket, 'already_settled_or_terminal');

  const cancelled = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.CANCELLED,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: null,
      confirmedAt: null,
      createdAt: old,
      fxLockedAt: old,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 50,
    },
    now,
    48
  );
  assert.equal(cancelled.bucket, 'already_cancelled');

  const settledHold = classifyTourismHeldBookingTimeoutCandidate(
    {
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: settledAt,
      confirmedAt: null,
      createdAt: old,
      fxLockedAt: old,
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      totalPaidVIG: 100,
    },
    now,
    48
  );
  assert.equal(settledHold.bucket, 'already_settled_or_terminal');

  console.log('[test-tourism-timeout-release-eligibility] OK');
}

run();
