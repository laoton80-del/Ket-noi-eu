/**
 * Local reference compact card pass screenshot QA (hub-only, intent dismissed).
 * Prereq: npx expo start --web --port 8088
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-local-reference-compact-card-pass'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8088);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';

const VIEWPORTS = [
  { name: 'local-ref-compact-390x844', width: 390, height: 844 },
  { name: 'local-ref-compact-844x390', width: 844, height: 390 },
  { name: 'local-ref-compact-768x1024', width: 768, height: 1024 },
  { name: 'local-ref-compact-1024x768', width: 1024, height: 768 },
  { name: 'local-ref-compact-1366x768', width: 1366, height: 768 },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript((key) => {
        try {
          localStorage.setItem(key, '1');
        } catch {}
      }, INTENT_KEY);
      await page.goto(`${BASE}/local`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
      await page.waitForSelector('[data-testid="local-premium-shell"]', { timeout: 90_000 });
      await dismissIntentModal(page);
      await page.waitForSelector('[data-testid="local-cta-browse-services"]', { timeout: 60_000 });
      await page.waitForSelector('[data-testid="local-primary-tile-grid"]', { timeout: 60_000 });
      const out = path.join(OUT_DIR, `${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`wrote ${out}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
