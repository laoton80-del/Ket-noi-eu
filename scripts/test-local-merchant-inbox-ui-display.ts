/**
 * UI display-helper checks for Local merchant request inbox (no database).
 *
 * Run: npx tsx scripts/test-local-merchant-inbox-ui-display.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  LOCAL_SERVICE_REQUEST_STATUS,
  LOCAL_WALLET_MODE,
  LOCAL_WALLET_PHASE,
  type LocalServiceRequestStatusClient,
  type LocalWalletModeClient,
  type LocalWalletPhaseClient,
} from '../src/domain/local/localServiceRequestClientContract';
import {
  buildLocalInboxDisplayLabels,
  collectLocalInboxVisibleCopy,
  LOCAL_INBOX_FORBIDDEN_COPY,
} from '../src/screens/b2b/localMerchantInboxUi';
import { deriveLocalMerchantInboxActions } from '../src/services/local/localMerchantInboxView';
import type { LocalMerchantInboxRequest } from '../src/services/localMerchantInboxApi';

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

function fixture(overrides: Partial<LocalMerchantInboxRequest>): LocalMerchantInboxRequest {
  const base = {
    id: 'req-test',
    status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED,
    businessId: 'biz-1',
    serviceId: null,
    title: 'Haircut request',
    description: 'Evening slot preferred',
    category: null,
    locationText: 'District 1',
    city: 'Ho Chi Minh City',
    countryCode: 'VN',
    walletMode: LOCAL_WALLET_MODE.REQUEST_ONLY_NO_CHARGE,
    walletPhase: LOCAL_WALLET_PHASE.NONE,
    createdAt: '2026-05-01T10:00:00.000Z',
    updatedAt: '2026-05-01T10:00:00.000Z',
    requester: { userId: 'u1', displayName: 'Lan' },
    actions: { canConfirm: true, canReject: true },
  };
  const row = { ...base, ...overrides };
  if (!overrides.actions) {
    row.actions = deriveLocalMerchantInboxActions({
      status: row.status as LocalServiceRequestStatusClient,
      walletMode: row.walletMode as LocalWalletModeClient,
      walletPhase: row.walletPhase as LocalWalletPhaseClient,
    });
  }
  return row;
}

function assertNoForbiddenCopy(visible: string): void {
  const lower = visible.toLowerCase();
  for (const word of LOCAL_INBOX_FORBIDDEN_COPY) {
    assert.equal(
      lower.includes(word),
      false,
      `forbidden copy "${word}" in: ${visible}`
    );
  }
}

function run(): void {
  const tEn = localeTranslate(loadLocale('en.json'));
  const tVi = localeTranslate(loadLocale('vi.json'));

  const requested = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.REQUESTED });
  const requestedLabels = buildLocalInboxDisplayLabels(requested, tEn);
  assert.equal(requestedLabels.showReviewPendingNote, true);
  assert.equal(requestedLabels.walletBadge, 'Request-only · no payment captured');
  assert.equal(requested.actions.canConfirm, true);
  assert.equal(requested.actions.canReject, true);
  assertNoForbiddenCopy(collectLocalInboxVisibleCopy(requestedLabels, [], tEn));

  const requestedVi = buildLocalInboxDisplayLabels(requested, tVi);
  assert.match(requestedVi.statusLabel, /Yêu cầu đã được gửi/);
  assert.equal(requestedVi.walletBadge, 'Chỉ gửi yêu cầu · chưa thu thanh toán');

  const confirmed = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.CONFIRMED });
  const confirmedLabels = buildLocalInboxDisplayLabels(confirmed, tEn);
  assert.equal(confirmedLabels.showConfirmedNote, true);
  assert.match(confirmedLabels.statusLabel, /^Confirmed$/);
  assert.equal(confirmed.actions.canConfirm, false);
  assert.equal(confirmed.actions.canReject, false);
  const confirmedCopy = collectLocalInboxVisibleCopy(confirmedLabels, [], tEn);
  assertNoForbiddenCopy(confirmedCopy);
  assert.match(confirmedCopy, /Confirmed ≠ paid/i);
  assert.doesNotMatch(confirmedLabels.walletBadge, /settled|captured payment/i);

  const confirmedVi = buildLocalInboxDisplayLabels(confirmed, tVi);
  assert.match(confirmedVi.statusLabel, /Đã xác nhận/);
  assert.match(collectLocalInboxVisibleCopy(confirmedVi, [], tVi), /Đã xác nhận ≠ đã thanh toán/);

  const rejected = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.REJECTED });
  assert.equal(rejected.actions.canConfirm, false);
  assert.equal(rejected.actions.canReject, false);
  assert.match(
    buildLocalInboxDisplayLabels(rejected, tVi).statusLabel,
    /Cửa hàng đã từ chối yêu cầu này/
  );

  const userCancelled = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.USER_CANCELLED });
  assert.equal(userCancelled.actions.canConfirm, false);

  const expired = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.EXPIRED });
  assert.equal(expired.actions.canConfirm, false);
  assert.equal(expired.actions.canReject, false);
  assert.match(buildLocalInboxDisplayLabels(expired, tVi).statusLabel, /Yêu cầu này đã hết hạn/);

  const review = fixture({ status: LOCAL_SERVICE_REQUEST_STATUS.MERCHANT_REVIEW });
  assert.equal(review.actions.canConfirm, true);
  assert.equal(review.actions.canReject, true);

  console.log('test-local-merchant-inbox-ui-display: OK');
}

run();
