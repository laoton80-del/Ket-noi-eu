/**
 * Travel card content alignment QA — flagship + perspective upper-zone grammar.
 * Prereq: npx expo start --web --port 8093
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
  'wave-3b-travel-card-content-alignment-match-local'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

const VIEWPORTS = [
  { name: 'travel-align-390x844', width: 390, height: 844 },
  { name: 'travel-align-844x390', width: 844, height: 390 },
  { name: 'travel-align-768x1024', width: 768, height: 1024 },
  { name: 'travel-align-1024x768', width: 1024, height: 768 },
  { name: 'travel-align-1366x768', width: 1366, height: 768 },
  { name: 'travel-align-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
];

async function dismissIntent(page) {
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2500 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  await page.waitForTimeout(500);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(() => {
        localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
        localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      });
      await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
      await dismissIntent(page);
      if (vp.fullscreen) {
        await page.evaluate(async () => {
          if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        });
        await page.waitForTimeout(700);
      }
      await page.waitForSelector('[data-testid="travel-flagship-translation"]', { timeout: 60_000 });
      if (vp.width >= 768) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`) });
      console.log(`OK ${vp.name}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
