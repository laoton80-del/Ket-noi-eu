/**
 * Unit checks for tourism held-booking confirm eligibility (no database).
 *
 * Run: npx tsx scripts/test-tourism-confirm-settle-eligibility.ts
 */
import assert from 'node:assert/strict';

import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import { evaluateTourismHeldBookingConfirmEligibility } from '../src/services/tourism/tourismHeldBookingConfirmEligibility';

const settledAt = new Date('2026-01-01T00:00:00.000Z');

function run(): void {
  const holdPending = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
    totalPaidVIG: 100,
  });
  assert.equal(holdPending.kind, 'confirm');

  const idempotent = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
    providerSettledAt: settledAt,
    confirmedAt: settledAt,
    totalPaidVIG: 100,
  });
  assert.equal(idempotent.kind, 'idempotent');

  const legacy = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    providerSettledAt: null,
    confirmedAt: null,
    totalPaidVIG: 100,
  });
  assert.equal(legacy.kind, 'reject');
  assert.equal(legacy.kind === 'reject' ? legacy.code : '', 'invalid_settlement_mode');

  const legacySettled = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    providerSettledAt: settledAt,
    confirmedAt: null,
    totalPaidVIG: 100,
  });
  assert.equal(legacySettled.kind, 'reject');

  const preview = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.PREVIEW_ONLY,
    providerSettledAt: null,
    confirmedAt: null,
    totalPaidVIG: 0,
  });
  assert.equal(preview.kind, 'reject');

  const cancelled = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.CANCELLED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
    totalPaidVIG: 50,
  });
  assert.equal(cancelled.kind, 'reject');
  assert.equal(cancelled.kind === 'reject' ? cancelled.code : '', 'invalid_status');

  const alreadySettledHold = evaluateTourismHeldBookingConfirmEligibility({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: settledAt,
    confirmedAt: settledAt,
    totalPaidVIG: 100,
  });
  assert.equal(alreadySettledHold.kind, 'idempotent');

  console.log('[test-tourism-confirm-settle-eligibility] OK');
}

run();
