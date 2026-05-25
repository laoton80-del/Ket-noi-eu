/**
 * Local luminous hard cutover — screenshot evidence.
 * Prereq: npx expo start --web --port 8088 --clear
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-local-hard-cutover');
const BASE = process.env.VIONA_WEB_BASE ?? 'http://localhost:8088';
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';

const VIEWPORTS = [
  { name: 'local-390x844', width: 390, height: 844 },
  { name: 'local-768x1024', width: 768, height: 1024 },
  { name: 'local-1024x768', width: 1024, height: 768 },
  { name: 'local-1366x768', width: 1366, height: 768 },
];

const MODAL_VIEWPORTS = [
  { name: 'local-modal-390x844', width: 390, height: 844 },
  { name: 'local-modal-768x1024', width: 768, height: 1024 },
];

async function captureLocal(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/local`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('[data-testid="local-premium-shell"]', { timeout: 90_000 });
  await page.waitForSelector('[data-testid="local-tile-my-requests"]', { timeout: 60_000 });
  await page.waitForTimeout(900);
  const out = path.join(OUT_DIR, `${vp.name}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`wrote ${out}`);
}

async function captureModal(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, INTENT_KEY);
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('text=Bạn đang cần gì nhất lúc này?', { timeout: 90_000 });
  await page.waitForTimeout(600);
  const out = path.join(OUT_DIR, `${vp.name}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`wrote ${out}`);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const vp of VIEWPORTS) {
      await captureLocal(page, vp);
    }
    for (const vp of MODAL_VIEWPORTS) {
      await captureModal(page, vp);
    }
    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
