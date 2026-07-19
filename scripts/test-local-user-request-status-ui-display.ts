/**
 * UI display-helper checks for Local user request status screen (no database).
 *
 * Run: npx tsx scripts/test-local-user-request-status-ui-display.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
} from '../src/domain/local/localServiceRequestClientContract';
import {
  buildLocalUserRequestDisplayLabels,
  collectLocalUserStatusVisibleCopy,
  LOCAL_USER_STATUS_FORBIDDEN_COPY,
  localUserWalletBadgeLabel,
} from '../src/screens/b2c/localUserRequestStatusUi';
import type { LocalUserRequestListItem } from '../src/services/localUserRequestApi';

const ROOT = path.resolve(__dirname, '..');

type LocaleRoot = Record<string, unknown>;

function loadLocale(file: string): LocaleRoot {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales', file), 'utf8')) as LocaleRoot;
}

function localeTranslate(
  root: LocaleRoot
): (key: string, options?: Record<string, unknown>) => string {
  return (key: string, options?: Record<string, unknown>) => {
    const parts = key.split('.');
    let cur: unknown = root;
    for (const part of parts) {
      if (!cur || typeof cur !== 'object') return key;
      cur = (cur as Record<string, unknown>)[part];
    }
    if (typeof cur !== 'string') return key;
    let out = cur;
    if (options) {
      for (const [k, v] of Object.entries(options)) {
        out = out.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return out;
  };
}

function fixture(overrides: Partial<LocalUserRequestListItem>): LocalUserRequestListItem {
  return {
    id: 'req-user-1',
    status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
    serviceType: 'GENERIC_REQUEST',
    category: null,
    title: 'Nails appointment',
    description: 'Saturday afternoon',
    businessId: 'biz-1',
    serviceId: null,
    locationText: 'District 3',
    city: 'Ho Chi Minh City',
    countryCode: 'VN',
    walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
    walletPhase: LOCAL_WALLET_PHASE.NONE,
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
  const tEn = localeTranslate(loadLocale('en.json'));
  const tVi = localeTranslate(loadLocale('vi.json'));

  const requested = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED });
  const requestedLabels = buildLocalUserRequestDisplayLabels(requested, tEn);
  assert.equal(requestedLabels.showReviewPendingNote, true);
  assert.equal(requestedLabels.walletBadge, 'Request-only · no payment captured');
  assert.equal(requestedLabels.actions.canCancel, true);
  assertNoForbiddenCopy(collectLocalUserStatusVisibleCopy(requestedLabels, tEn));

  const requestedVi = buildLocalUserRequestDisplayLabels(requested, tVi);
  assert.match(requestedVi.statusLabel, /Yêu cầu đã được gửi/);
  assert.equal(requestedVi.walletBadge, 'Chỉ gửi yêu cầu · chưa thu thanh toán');

  const confirmed = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED });
  const confirmedLabels = buildLocalUserRequestDisplayLabels(confirmed, tEn);
  assert.equal(confirmedLabels.showConfirmedNote, true);
  assert.match(confirmedLabels.statusLabel, /Merchant confirmed your request/);
  assert.match(collectLocalUserStatusVisibleCopy(confirmedLabels, tEn), /Confirmed ≠ paid/i);
  assert.equal(confirmedLabels.actions.canCancel, false);
  assertNoForbiddenCopy(collectLocalUserStatusVisibleCopy(confirmedLabels, tEn));

  const confirmedVi = buildLocalUserRequestDisplayLabels(confirmed, tVi);
  assert.match(confirmedVi.statusLabel, /Cửa hàng đã xác nhận yêu cầu/);
  assert.match(collectLocalUserStatusVisibleCopy(confirmedVi, tVi), /Đã xác nhận ≠ đã thanh toán/);

  const rejected = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.REJECTED });
  const rejectedLabels = buildLocalUserRequestDisplayLabels(rejected, tEn);
  assert.match(rejectedLabels.statusLabel, /Merchant declined this request/);
  assert.equal(rejectedLabels.actions.canCancel, false);
  assert.match(buildLocalUserRequestDisplayLabels(rejected, tVi).statusLabel, /Cửa hàng đã từ chối yêu cầu này/);

  const expired = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.EXPIRED });
  const expiredLabels = buildLocalUserRequestDisplayLabels(expired, tEn);
  assert.match(expiredLabels.statusLabel, /This request expired/);
  assert.equal(expiredLabels.actions.canCancel, false);
  assert.match(buildLocalUserRequestDisplayLabels(expired, tVi).statusLabel, /Yêu cầu này đã hết hạn/);

  const completed = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.COMPLETED });
  assert.equal(buildLocalUserRequestDisplayLabels(completed, tEn).actions.canCancel, false);
  assert.match(buildLocalUserRequestDisplayLabels(completed, tVi).statusLabel, /Hoàn tất/);

  const review = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW });
  assert.equal(buildLocalUserRequestDisplayLabels(review, tEn).actions.canCancel, true);
  assert.match(
    buildLocalUserRequestDisplayLabels(review, tVi).statusLabel,
    /Đang chờ cửa hàng xem xét/
  );

  const walletOk = buildLocalUserRequestDisplayLabels(
    fixture({
      walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
      walletPhase: LOCAL_WALLET_PHASE.NONE,
    }),
    tEn
  );
  assert.equal(walletOk.walletBadge, 'Request-only · no payment captured');
  assert.equal(
    localUserWalletBadgeLabel(
      LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
      LOCAL_WALLET_PHASE.NONE
    ),
    'No payment has been captured · Request-only / no-charge · walletPhase NONE'
  );

  console.log('test-local-user-request-status-ui-display: OK');
}

run();
