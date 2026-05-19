/**
 * Unit checks for tourism merchant inbox action availability (no database).
 *
 * Run: npx tsx scripts/test-tourism-merchant-inbox-actions.ts
 */
import assert from 'node:assert/strict';

import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import {
  deriveTourismMerchantInboxActions,
  deriveTourismMerchantDisplayState,
  deriveTourismWalletPhase,
} from '../src/services/tourism/tourismMerchantInboxView';

const settledAt = new Date('2026-01-01T00:00:00.000Z');

function run(): void {
  const holdPending = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
    cancelledAt: null,
    totalPaidVIG: 100,
  });
  assert.equal(holdPending.canConfirm, true);
  assert.equal(holdPending.canCancel, true);
  assert.equal(holdPending.canComplete, false);
  assert.equal(
    deriveTourismMerchantDisplayState({
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: null,
      confirmedAt: null,
      cancelledAt: null,
      totalPaidVIG: 100,
    }),
    'pending_merchant_review'
  );
  assert.equal(
    deriveTourismWalletPhase({
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: null,
      confirmedAt: null,
      cancelledAt: null,
      totalPaidVIG: 100,
    }),
    'HELD'
  );

  const confirmedSettled = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.SETTLE_ON_CONFIRM,
    providerSettledAt: settledAt,
    confirmedAt: settledAt,
    cancelledAt: null,
    totalPaidVIG: 100,
  });
  assert.equal(confirmedSettled.canConfirm, false);
  assert.equal(confirmedSettled.canCancel, false);
  assert.equal(confirmedSettled.canComplete, true);

  const cancelled = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.CANCELLED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
    cancelledAt: settledAt,
    totalPaidVIG: 50,
  });
  assert.equal(cancelled.canConfirm, false);
  assert.equal(cancelled.canCancel, false);
  assert.equal(cancelled.canComplete, false);
  assert.equal(
    deriveTourismWalletPhase({
      status: TourismBookingStatus.CANCELLED,
      settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
      providerSettledAt: null,
      confirmedAt: null,
      cancelledAt: settledAt,
      totalPaidVIG: 50,
    }),
    'RELEASED'
  );

  const legacy = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    providerSettledAt: settledAt,
    confirmedAt: null,
    cancelledAt: null,
    totalPaidVIG: 80,
  });
  assert.equal(legacy.canConfirm, false);
  assert.equal(legacy.canCancel, false);
  assert.equal(legacy.canComplete, true);
  assert.equal(
    deriveTourismMerchantDisplayState({
      status: TourismBookingStatus.PENDING,
      settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
      providerSettledAt: settledAt,
      confirmedAt: null,
      cancelledAt: null,
      totalPaidVIG: 80,
    }),
    'legacy_settled'
  );

  const preview = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.PREVIEW_ONLY,
    providerSettledAt: null,
    confirmedAt: null,
    cancelledAt: null,
    totalPaidVIG: 0,
  });
  assert.equal(preview.canConfirm, false);
  assert.equal(preview.canCancel, false);

  console.log('[test-tourism-merchant-inbox-actions] OK');
}

run();
