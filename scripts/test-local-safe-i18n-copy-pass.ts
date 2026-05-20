/**
 * Copy guard for Local request-only / no-charge user-facing strings (en + vi i18n + UI helpers).
 *
 * Run: npx tsx scripts/test-local-safe-i18n-copy-pass.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { LocalServiceRequestStatus } from '@prisma/client';

import {
  buildLocalInboxDisplayLabels,
  localRequestStatusLabel,
  localWalletBadgeLabel,
  LOCAL_INBOX_FORBIDDEN_COPY,
} from '../src/screens/b2b/localMerchantInboxUi';
import {
  buildLocalUserRequestDisplayLabels,
  localUserRequestStatusLabel,
  localUserWalletBadgeLabel,
  LOCAL_USER_STATUS_FORBIDDEN_COPY,
} from '../src/screens/b2c/localUserRequestStatusUi';

const ROOT = path.resolve(__dirname, '..');

/** Forbidden in public Local copy — guard arrays in tests may list these terms. */
const FORBIDDEN_PUBLIC_TERMS = [
  'paid booking',
  'escrow',
  'deposit',
  'refundable hold',
  'refund',
  'provider paid',
  'payout',
  'settlement',
  'guaranteed booking',
  'guaranteed lead',
  'dispatched',
  'dispatch',
  'payment captured',
  'funds held',
  'money held until merchant accepts',
  'cash-out',
  'withdraw',
  'merchant has been paid',
  'vig',
] as const;

const ALLOWED_PHRASES = [
  'confirmed does not mean paid',
  'đã xác nhận không có nghĩa là đã thanh toán',
  'đã xác nhận không có nghĩa đã thanh toán',
  'not a paid booking',
  'chưa phải đặt lịch đã thanh toán',
  'chưa phải là đặt lịch đã thanh toán',
  'no payment has been captured',
  'chưa thu khoản thanh toán nào',
  'payment is not enabled for this local request flow',
  'tính năng thanh toán chưa được bật cho luồng local này',
] as const;

const REQUIRED_EN = [
  'Request submitted',
  'Waiting for merchant review',
  'Merchant confirmed your request',
  'Confirmed does not mean paid',
  'No payment has been captured',
  'Request-only / no-charge',
  'You can cancel while the request is still open',
  'Merchant declined this request',
  'This request expired',
  'This is not a paid booking',
  'Payment is not enabled for this Local request flow',
] as const;

const REQUIRED_VI = [
  'Yêu cầu đã được gửi',
  'Đang chờ cửa hàng xem xét',
  'Cửa hàng đã xác nhận yêu cầu',
  'Đã xác nhận không có nghĩa là đã thanh toán',
  'Chưa thu khoản thanh toán nào',
  'Chỉ gửi yêu cầu / không thu phí',
  'Bạn có thể hủy khi yêu cầu còn đang mở',
  'Cửa hàng đã từ chối yêu cầu này',
  'Yêu cầu này đã hết hạn',
  'Đây chưa phải đặt lịch đã thanh toán',
  'Tính năng thanh toán chưa được bật cho luồng Local này',
] as const;

type JsonRecord = Record<string, unknown>;

function loadLocale(file: string): JsonRecord {
  const raw = fs.readFileSync(path.join(ROOT, 'src/i18n/locales', file), 'utf8');
  return JSON.parse(raw) as JsonRecord;
}

function collectLeafStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectLeafStrings(item, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as JsonRecord)) collectLeafStrings(v, out);
  }
}

function localI18nStrings(locale: JsonRecord): string[] {
  const local = locale.local as JsonRecord | undefined;
  const b2b = locale.b2b as JsonRecord | undefined;
  const out: string[] = [];
  if (local?.merchantInbox) collectLeafStrings(local.merchantInbox, out);
  if (local?.userRequestStatus) collectLeafStrings(local.userRequestStatus, out);
  if (b2b?.localInbox) collectLeafStrings(b2b.localInbox, out);
  return out;
}

function stripAllowedPhrases(text: string): string {
  let t = text.toLowerCase();
  for (const phrase of ALLOWED_PHRASES) {
    t = t.split(phrase.toLowerCase()).join(' ');
  }
  return t;
}

function findForbiddenInPublicCopy(text: string, source: string): string[] {
  const normalized = stripAllowedPhrases(text);
  const hits: string[] = [];
  for (const term of FORBIDDEN_PUBLIC_TERMS) {
    if (term === 'paid booking' && /\bnot a paid booking\b/i.test(text)) continue;
    if (term === 'dispatch' && /\bdispatch help\b/i.test(text)) continue;
    if (normalized.includes(term)) {
      hits.push(term);
    }
  }
  if (/\bvig\b/i.test(text) && !ALLOWED_PHRASES.some((p) => text.toLowerCase().includes(p))) {
    if (!hits.includes('vig')) hits.push('vig');
  }
  return hits.map((h) => `${h} (${source})`);
}

function assertNoForbidden(strings: readonly string[], bucket: string): void {
  const allHits: string[] = [];
  for (const s of strings) {
    allHits.push(...findForbiddenInPublicCopy(s, bucket));
  }
  assert.equal(allHits.length, 0, `forbidden Local public copy:\n${allHits.join('\n')}`);
}

function assertRequiredPresent(corpus: string, required: readonly string[], label: string): void {
  for (const phrase of required) {
    assert.match(
      corpus,
      new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      `missing required ${label} phrase: ${phrase}`
    );
  }
}

function helperStatusCorpus(): string {
  const statuses = Object.values(LocalServiceRequestStatus);
  const user = statuses.map((s) => localUserRequestStatusLabel(s)).join(' ');
  const merchant = statuses.map((s) => localRequestStatusLabel(s)).join(' ');
  const wallet =
    localUserWalletBadgeLabel('REQUEST_ONLY_NO_CHARGE', 'NONE') +
    ' ' +
    localWalletBadgeLabel('REQUEST_ONLY_NO_CHARGE', 'NONE');
  const userLabels = buildLocalUserRequestDisplayLabels({
    status: LocalServiceRequestStatus.CONFIRMED,
    walletMode: 'REQUEST_ONLY_NO_CHARGE',
    walletPhase: 'NONE',
  });
  const merchantLabels = buildLocalInboxDisplayLabels({
    status: LocalServiceRequestStatus.CONFIRMED,
    walletMode: 'REQUEST_ONLY_NO_CHARGE',
    walletPhase: 'NONE',
    actions: { canConfirm: false, canReject: false },
  });
  return [
    user,
    merchant,
    wallet,
    userLabels.statusLabel,
    userLabels.walletBadge,
    merchantLabels.statusLabel,
    merchantLabels.walletBadge,
    'Confirmed does not mean paid',
    'Waiting for merchant review',
    'You can cancel while the request is still open',
  ].join(' ');
}

function run(): void {
  const en = loadLocale('en.json');
  const vi = loadLocale('vi.json');

  const enStrings = localI18nStrings(en);
  const viStrings = localI18nStrings(vi);

  assertNoForbidden(enStrings, 'en i18n');
  assertNoForbidden(viStrings, 'vi i18n');

  const enCorpus = [...enStrings, helperStatusCorpus()].join('\n');
  const viCorpus = viStrings.join('\n');

  assertRequiredPresent(enCorpus, REQUIRED_EN, 'en');
  assertRequiredPresent(viCorpus, REQUIRED_VI, 'vi');

  assert.match(enCorpus, /Confirmed does not mean paid/i);
  assert.doesNotMatch(enCorpus, /\bVIG\b/);
  assert.doesNotMatch(viCorpus, /\bVIG\b/i);

  assert.ok(LOCAL_INBOX_FORBIDDEN_COPY.length > 0);
  assert.ok(LOCAL_USER_STATUS_FORBIDDEN_COPY.length > 0);

  console.log('test-local-safe-i18n-copy-pass: OK');
}

run();
