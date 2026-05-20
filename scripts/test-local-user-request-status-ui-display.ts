/**
 * UI display-helper checks for Local user request status screen (no database).
 *
 * Run: npx tsx scripts/test-local-user-request-status-ui-display.ts
 */
import assert from 'node:assert/strict';

import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
} from '@prisma/client';

import {
  buildLocalUserRequestDisplayLabels,
  collectLocalUserStatusVisibleCopy,
  LOCAL_USER_STATUS_FORBIDDEN_COPY,
} from '../src/screens/b2c/localUserRequestStatusUi';
import type { LocalUserRequestListItem } from '../src/services/localUserRequestApi';

function fixture(overrides: Partial<LocalUserRequestListItem>): LocalUserRequestListItem {
  return {
    id: 'req-user-1',
    status: LocalServiceRequestStatus.REQUESTED,
    serviceType: 'GENERIC_REQUEST',
    category: null,
    title: 'Nails appointment',
    description: 'Saturday afternoon',
    businessId: 'biz-1',
    serviceId: null,
    locationText: 'District 3',
    city: 'Ho Chi Minh City',
    countryCode: 'VN',
    walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
    walletPhase: LocalWalletPhase.NONE,
    requestedAt: '2026-05-02T10:00:00.000Z',
    createdAt: '2026-05-02T10:00:00.000Z',
    updatedAt: '2026-05-02T10:00:00.000Z',
    statusLabel: 'Request submitted',
    display: { noPaymentCaptured: true, requestOnlyNoCharge: true },
    business: { id: 'biz-1', name: 'Glow Nails', category: 'LOCAL_EXPERIENCE' },
    ...overrides,
  };
}

function assertNoForbiddenCopy(visible: string): void {
  const lower = visible.toLowerCase();
  for (const term of LOCAL_USER_STATUS_FORBIDDEN_COPY) {
    assert.equal(lower.includes(term), false, `forbidden copy "${term}" in: ${visible}`);
  }
}

function run(): void {
  const requested = fixture({ status: LocalServiceRequestStatus.REQUESTED });
  const requestedLabels = buildLocalUserRequestDisplayLabels(requested);
  assert.equal(requestedLabels.showReviewPendingNote, true);
  assert.match(requestedLabels.walletBadge, /No payment has been captured/);
  assert.equal(requestedLabels.actions.canCancel, true);
  assertNoForbiddenCopy(collectLocalUserStatusVisibleCopy(requestedLabels));

  const confirmed = fixture({ status: LocalServiceRequestStatus.CONFIRMED });
  const confirmedLabels = buildLocalUserRequestDisplayLabels(confirmed);
  assert.equal(confirmedLabels.showConfirmedNote, true);
  assert.match(confirmedLabels.statusLabel, /Merchant confirmed your request/);
  assert.match(collectLocalUserStatusVisibleCopy(confirmedLabels), /does not mean paid/);
  assert.equal(confirmedLabels.actions.canCancel, false);
  assertNoForbiddenCopy(collectLocalUserStatusVisibleCopy(confirmedLabels));

  const rejected = fixture({ status: LocalServiceRequestStatus.REJECTED });
  assert.equal(buildLocalUserRequestDisplayLabels(rejected).actions.canCancel, false);

  const expired = fixture({ status: LocalServiceRequestStatus.EXPIRED });
  assert.equal(buildLocalUserRequestDisplayLabels(expired).actions.canCancel, false);

  const completed = fixture({ status: LocalServiceRequestStatus.COMPLETED });
  assert.equal(buildLocalUserRequestDisplayLabels(completed).actions.canCancel, false);

  const review = fixture({ status: LocalServiceRequestStatus.MERCHANT_REVIEW });
  assert.equal(buildLocalUserRequestDisplayLabels(review).actions.canCancel, true);

  const walletOk = buildLocalUserRequestDisplayLabels(
    fixture({
      walletMode: LocalWalletMode.REQUEST_ONLY_NO_CHARGE,
      walletPhase: LocalWalletPhase.NONE,
    })
  );
  assert.match(walletOk.walletBadge, /Request-only \/ no-charge/);
  assert.match(walletOk.walletBadge, /walletPhase NONE/);

  console.log('test-local-user-request-status-ui-display: OK');
}

run();
