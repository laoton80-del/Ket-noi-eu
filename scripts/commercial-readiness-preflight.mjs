/**
 * Commercial readiness static checks (repo scope).
 * Run from repo root: npm run commercial:preflight
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function read(relPath) {
  return readFileSync(path.join(root, ...relPath.split('/')), 'utf8');
}

const appBrand = read('src/config/appBrand.ts');
const profileScreen = read('src/screens/CaNhanScreen.tsx');
const comboWalletScreen = read('src/screens/ComboWalletScreen.tsx');

/** Known past hardcoded Vietnamese user-facing snippets — must not reappear in ComboWalletScreen (use i18n). */
const comboWalletBannedSnippets = [
  'Hỗ trợ trong app',
  'Quà tặng:',
  'Giá gói:',
  'Lịch sử trên thiết bị',
  'Chỉ mang tính tham khảo',
  'Chưa có giao dịch nào',
  'Xác thực để xem Ví',
  'Không thể mở khóa',
  'Mã PIN không đúng',
];

const checks = [
  ['commercial readiness doc exists', existsSync(path.join(root, 'docs', 'COMMERCIAL_READINESS.md'))],
  ['store metadata template exists', existsSync(path.join(root, 'docs', 'STORE_METADATA_TEMPLATE.md'))],
  ['brand has support email anchor', appBrand.includes('supportEmail')],
  ['brand has legal URL anchors', appBrand.includes('privacyUrl') && appBrand.includes('termsUrl')],
  ['profile settings surface support/legal info', profileScreen.includes('APP_BRAND.legal.privacyUrl') && profileScreen.includes('APP_BRAND.supportEmail')],
  ...comboWalletBannedSnippets.map((snippet) => [
    `ComboWalletScreen has no hardcoded snippet: ${snippet.slice(0, 24)}…`,
    !comboWalletScreen.includes(snippet),
  ]),
];

let failed = false;
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`[commercial-preflight] FAIL: ${label}`);
    failed = true;
  }
}

if (failed) {
  console.error('[commercial-preflight] Repo commercial anchors are incomplete.');
  process.exit(1);
}

console.log('[commercial-preflight] OK: repo commercial readiness anchors present.');
