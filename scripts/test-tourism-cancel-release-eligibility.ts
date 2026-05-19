/**
 * Unit checks for tourism held-booking cancel/release eligibility (no database).
 *
 * Run: npx tsx scripts/test-tourism-cancel-release-eligibility.ts
 */
import assert from 'node:assert/strict';

import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import { evaluateTourismHeldBookingCancelEligibility } from '../src/services/tourism/tourismHeldBookingCancelEligibility';

const settledAt = new Date('2026-01-01T00:00:00.000Z');

function run(): void {
  const holdPending = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(holdPending.kind, 'release');

  const alreadyCancelled = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.CANCELLED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(alreadyCancelled.kind, 'idempotent');

  const legacy = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(legacy.kind, 'reject');
  assert.equal(legacy.kind === 'reject' ? legacy.code : '', 'invalid_settlement_mode');

  const preview = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.PREVIEW_ONLY,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(preview.kind, 'reject');

  const settleOnConfirm = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
    providerSettledAt: settledAt,
    confirmedAt: settledAt,
  });
  assert.equal(settleOnConfirm.kind, 'reject');

  const confirmedHold = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: settledAt,
  });
  assert.equal(confirmedHold.kind, 'reject');

  const completed = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.COMPLETED,
    settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
    providerSettledAt: settledAt,
    confirmedAt: settledAt,
  });
  assert.equal(completed.kind, 'reject');

  const unknown = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.UNKNOWN,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(unknown.kind, 'reject');

  console.log('[test-tourism-cancel-release-eligibility] OK');
}

run();
