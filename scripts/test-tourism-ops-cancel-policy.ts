/**
 * Unit checks for tourism ops cancel reason policy and eligibility alignment (no database).
 *
 * Run: npx tsx scripts/test-tourism-ops-cancel-policy.ts
 */
import assert from 'node:assert/strict';

import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import { evaluateTourismHeldBookingCancelEligibility } from '../src/services/tourism/tourismHeldBookingCancelEligibility';
import {
  normalizeOpsTourismCancelReason,
  TOURISM_OPS_CANCEL_REASONS,
} from '../src/services/tourism/tourismOpsCancelPolicy';

const settledAt = new Date('2026-01-01T00:00:00.000Z');

function run(): void {
  assert.deepEqual([...TOURISM_OPS_CANCEL_REASONS], ['OPS_CANCEL', 'SYSTEM_SAFETY_RELEASE']);

  const ops = normalizeOpsTourismCancelReason('OPS_CANCEL');
  assert.equal(typeof ops, 'string');
  assert.equal(ops, 'OPS_CANCEL');

  const safety = normalizeOpsTourismCancelReason('system_safety_release');
  assert.equal(safety, 'SYSTEM_SAFETY_RELEASE');

  const empty = normalizeOpsTourismCancelReason('');
  assert.equal(typeof empty, 'object');
  if (typeof empty === 'string') assert.fail('expected invalid_cancel_reason');
  else assert.equal(empty.code, 'invalid_cancel_reason');

  const bad = normalizeOpsTourismCancelReason('MERCHANT_NO_RESPONSE');
  assert.equal(typeof bad, 'object');
  if (typeof bad === 'string') assert.fail('expected invalid_cancel_reason');
  else assert.equal(bad.code, 'invalid_cancel_reason');

  const holdPending = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(holdPending.kind, 'release');

  const legacy = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    providerSettledAt: settledAt,
    confirmedAt: null,
  });
  assert.equal(legacy.kind, 'reject');

  const confirmed = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
    providerSettledAt: settledAt,
    confirmedAt: settledAt,
  });
  assert.equal(confirmed.kind, 'reject');

  const cancelled = evaluateTourismHeldBookingCancelEligibility({
    status: TourismBookingStatus.CANCELLED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
  });
  assert.equal(cancelled.kind, 'idempotent');

  console.log('[test-tourism-ops-cancel-policy] OK');
}

run();
