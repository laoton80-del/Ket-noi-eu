/**
 * Copy-safety checks for wallet public ledger terms fix pack.
 * Run: npx tsx scripts/test-wallet-public-copy-ledger-terms.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { walletPhaseLabel } from '../src/screens/b2b/tourismMerchantInboxUi';

const ROOT = process.cwd();

const SCREEN_AND_CONTROLLER_REL = [
  'src/screens/b2c/CashOutScreen.tsx',
  'src/screens/merchant/MerchantVnDashboardScreen.tsx',
  'src/screens/b2c/ReferralRewardScreen.tsx',
  'src/screens/b2c/LocalScreen.tsx',
  'src/screens/b2c/travel/LocalFixerCheckoutScreen.tsx',
  'src/screens/b2c/travel/LocalFixerScreen.tsx',
  'src/controllers/WalletController.ts',
  'src/controllers/TourismController.ts',
  'src/controllers/BookingController.ts',
  'src/controllers/AIController.ts',
] as const;

const FORBIDDEN_UI = [
  /\bcash\s*out\b/i,
  /\bwithdraw\b/i,
  /quy\s*đổi\s*tiền\s*mặt/i,
  /\brút\s*tiền\b/i,
  /\bescrow\b/i,
  /\bget\s+paid\s+in\s+one\s+wallet\b/i,
  /\bthanh\s+toán\b/i,
  /\bminimum\s+transfer\s+is\s+1\.0\s+vig\b/i,
  /\binsufficient\s+spendable\s+vig\b/i,
];

const LOCALE_KEYS = [
  'checkout.quoteLegal',
  'b2b.radar.acceptedMsg',
  'home.profileRoleGateMerchantBody',
  'localHub.vipPostSuccessVipBody',
] as const;

function isCommentOnlyLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

function isAllowedInternalLine(line: string): boolean {
  if (/navigate\(\s*['"]CashOut['"]\s*\)/.test(line)) return true;
  if (/styles\.cashout/i.test(line)) return true;
  if (/CashOutScreen|cashOutNav|onBankCashOut/.test(line)) return true;
  if (/VIGLOBAL_TREASURY|amountVIG|balanceVIG|feeVIG|platformFeeVIG|lockedBalanceVIG/.test(line)) return true;
  return false;
}

function scanUiFile(rel: string): void {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (isCommentOnlyLine(line) || isAllowedInternalLine(line)) continue;
    for (const re of FORBIDDEN_UI) {
      if (re.test(line)) {
        throw new Error(`${rel}:${i + 1}: forbidden copy ${re}: ${line.trim().slice(0, 120)}`);
      }
    }
  }
  if (rel.startsWith('src/controllers/')) {
    const bad = [...text.matchAll(/jsonFail\([^)]+\)/g)].filter(
      (m) => /\bVIG\b/.test(m[0]) && !/VIGLOBAL|amountVIG|feeVIG/.test(m[0])
    );
    if (bad.length > 0) {
      throw new Error(`${rel}: jsonFail still exposes VIG: ${bad[0]![0]}`);
    }
    if (/LegalScanPaymentError\([^)]*\bVIG\b/.test(text)) {
      throw new Error(`${rel}: legal scan error still exposes VIG`);
    }
  }
}

function getNested(obj: Record<string, unknown>, dotted: string): string {
  let cur: unknown = obj;
  for (const part of dotted.split('.')) {
    if (cur == null || typeof cur !== 'object') return '';
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : '';
}

function scanLocale(rel: string): void {
  const obj = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')) as Record<string, unknown>;
  for (const key of LOCALE_KEYS) {
    const value = getNested(obj, key);
    if (!value) continue;
    assert.doesNotMatch(value, /\bwallet will be debited\b/i, `${rel} ${key}`);
    assert.doesNotMatch(value, /\bget paid in one wallet\b/i, `${rel} ${key}`);
    if (key === 'b2b.radar.acceptedMsg') {
      assert.match(value, /demo|preview|not sent/i, `${rel} ${key} must indicate demo/mock`);
    }
    if (key === 'checkout.quoteLegal') {
      assert.match(value, /VIO Credits/i, `${rel} ${key}`);
      assert.match(value, /hold|preview|confirmed/i, `${rel} ${key} must mention conditional debit`);
    }
    if (key === 'localHub.vipPostSuccessVipBody') {
      assert.match(value, /boost/i, `${rel} ${key}`);
      assert.match(value, /deposit|held|merchant/i, `${rel} ${key} safety disclaimer`);
    }
  }
}

function testWalletPhaseLabels(): void {
  assert.equal(walletPhaseLabel('HELD'), 'VIO Credits held');
  assert.equal(walletPhaseLabel('SETTLED'), 'Provider settlement recorded');
  assert.equal(walletPhaseLabel('RELEASED'), 'Held VIO Credits released');
  assert.equal(walletPhaseLabel('LEGACY_SETTLED'), 'Legacy settled booking');
  assert.equal(walletPhaseLabel('PREVIEW'), 'Preview only');
  assert.equal(walletPhaseLabel('NONE'), 'No wallet action');
}

function run(): void {
  testWalletPhaseLabels();
  for (const rel of SCREEN_AND_CONTROLLER_REL) scanUiFile(rel);
  for (const rel of ['src/i18n/locales/en.json', 'src/i18n/locales/vi.json'] as const) {
    scanLocale(rel);
  }
  console.log('[test-wallet-public-copy-ledger-terms] OK');
}

run();
