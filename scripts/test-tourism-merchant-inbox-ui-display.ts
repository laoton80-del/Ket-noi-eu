/**
 * UI display-helper checks for tourism merchant inbox (no database).
 *
 * Run: npx tsx scripts/test-tourism-merchant-inbox-ui-display.ts
 */
import assert from 'node:assert/strict';

import {
  buildTourismInboxDisplayLabels,
  displayStateLabel,
  shouldShowConfirmedNote,
  shouldShowProviderSettledNote,
  walletPhaseLabel,
} from '../src/screens/b2b/tourismMerchantInboxUi';
import {
  deriveTourismMerchantInboxActions,
  deriveTourismMerchantDisplayState,
  deriveTourismWalletPhase,
} from '../src/services/tourism/tourismMerchantInboxView';
import type { TourismMerchantInboxBooking } from '../src/services/tourismMerchantInboxApi';
import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

function fixture(overrides: Partial<TourismMerchantInboxBooking>): TourismMerchantInboxBooking {
  return {
    id: 'bk-test',
    businessId: 'biz-1',
    businessName: 'Test Biz',
    status: TourismBookingStatus.PENDING,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    totalPaidVIG: 100,
    netProviderEarningsVIG: 80,
    providerFeeVIG: 10,
    touristFeeVIG: 10,
    providerSettledAt: null,
    confirmedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: null,
    startDate: '2026-06-01T14:00:00.000Z',
    endDate: '2026-06-03T11:00:00.000Z',
    guestCount: 2,
    tourist: { userId: 'u1', displayName: 'Alex' },
    service: { id: 'svc-1', title: 'Boutique stay' },
    walletPhase: 'HELD',
    merchantDisplayState: 'pending_merchant_review',
    actions: { canConfirm: true, canCancel: true, canComplete: false },
    ...overrides,
  };
}

function run(): void {
  const pendingRow = fixture({});
  assert.equal(pendingRow.actions.canConfirm, true);
  assert.equal(pendingRow.actions.canCancel, true);
  assert.equal(pendingRow.actions.canComplete, false);
  assert.equal(displayStateLabel(pendingRow.merchantDisplayState), 'Pending merchant review');
  assert.equal(walletPhaseLabel(pendingRow.walletPhase), 'VIO Credits held');

  const confirmedActions = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: new Date('2026-01-02T00:00:00.000Z'),
    confirmedAt: new Date('2026-01-01T00:00:00.000Z'),
    cancelledAt: null,
    totalPaidVIG: 100,
  });
  assert.equal(confirmedActions.canCancel, false);

  const cancelledActions = deriveTourismMerchantInboxActions({
    status: TourismBookingStatus.CANCELLED,
    settlementMode: TourismSettlementMode.HOLD_ON_SUBMIT,
    providerSettledAt: null,
    confirmedAt: null,
    cancelledAt: new Date('2026-01-03T00:00:00.000Z'),
    totalPaidVIG: 100,
  });
  assert.equal(cancelledActions.canConfirm, false);
  assert.equal(cancelledActions.canCancel, false);

  const legacyPhase = deriveTourismWalletPhase({
    status: TourismBookingStatus.CONFIRMED,
    settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    providerSettledAt: new Date('2025-12-01T00:00:00.000Z'),
    confirmedAt: new Date('2025-12-01T00:00:00.000Z'),
    cancelledAt: null,
    totalPaidVIG: 50,
  });
  assert.equal(legacyPhase, 'LEGACY_SETTLED');
  assert.equal(
    deriveTourismMerchantDisplayState({
      status: TourismBookingStatus.CONFIRMED,
      settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
      providerSettledAt: new Date('2025-12-01T00:00:00.000Z'),
      confirmedAt: new Date('2025-12-01T00:00:00.000Z'),
      cancelledAt: null,
      totalPaidVIG: 50,
    }),
    'legacy_settled'
  );
  const legacyLabels = buildTourismInboxDisplayLabels(
    fixture({
      merchantDisplayState: 'legacy_settled',
      walletPhase: 'LEGACY_SETTLED',
      status: TourismBookingStatus.CONFIRMED,
      settlementMode: TourismSettlementMode.LEGACY_SETTLE_ON_BOOK,
    })
  );
  assert.equal(legacyLabels.displayState, 'Legacy settled');
  assert.notEqual(legacyLabels.walletPhase, 'HELD');

  const previewLabels = buildTourismInboxDisplayLabels(
    fixture({
      merchantDisplayState: 'preview_only',
      walletPhase: 'PREVIEW',
      settlementMode: TourismSettlementMode.PREVIEW_ONLY,
      actions: { canConfirm: false, canCancel: false, canComplete: false },
    })
  );
  assert.equal(previewLabels.displayState, 'Preview only');
  assert.equal(previewLabels.walletPhase, 'Preview only');

  const noProviderNote = buildTourismInboxDisplayLabels(
    fixture({
      status: TourismBookingStatus.CONFIRMED,
      confirmedAt: '2026-01-01T00:00:00.000Z',
      providerSettledAt: null,
    })
  );
  assert.equal(noProviderNote.showProviderSettledNote, false);
  assert.equal(shouldShowProviderSettledNote({ providerSettledAt: null }), false);

  const withProvider = fixture({ providerSettledAt: '2026-01-02T00:00:00.000Z' });
  assert.equal(shouldShowProviderSettledNote(withProvider), true);
  assert.equal(
    buildTourismInboxDisplayLabels(withProvider).showProviderSettledNote,
    true
  );

  const pendingNoConfirm = fixture({
    status: TourismBookingStatus.PENDING,
    confirmedAt: null,
    providerSettledAt: null,
  });
  assert.equal(shouldShowConfirmedNote(pendingNoConfirm), false);

  console.log('test-tourism-merchant-inbox-ui-display: OK');
}

run();
