/**
 * Ephemeral Playwright capture for Local luminous polish QA.
 * Prereq: expo web on configurable port.
 * Example: EXPO_CAPTURE_PORT=8093 node scripts/capture-local-luminous-polish.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-local-luminous-polish');
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8088);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;

const VIEWPORTS = [
  { name: 'local-390x844', width: 390, height: 844 },
  { name: 'local-768x1024', width: 768, height: 1024 },
  { name: 'local-1024x768', width: 1024, height: 768 },
  { name: 'local-1366x768', width: 1366, height: 768 },
];

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(`${BASE}/local`, { waitUntil: 'networkidle', timeout: 120_000 });
      await page.waitForSelector('[data-testid="local-premium-shell"]', { timeout: 90_000 });
      await page.waitForSelector('[data-testid="local-tile-my-requests"]', { timeout: 60_000 });
      await page.waitForTimeout(800);
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
