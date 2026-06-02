/**
 * Pack 1 — Travel location consent gate captures (unset consent).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8095)}`;
const LABEL = process.env.PACK_LABEL || 'pack1';

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844, fs: false },
  { name: '768x1024', width: 768, height: 1024, fs: false },
  { name: '1024x768', width: 1024, height: 768, fs: false },
  { name: '1366x768', width: 1366, height: 768, fs: false },
  { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
];

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForSelector('[data-testid="travel-location-consent-gate"]', { timeout: 90000 });
  if (fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(400);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.removeItem('ketnoieu.compliance.consent.travelLocation.v1');
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-travel-location-gate-${vp.name}.png`) });
    const gate = page.locator('[data-testid="travel-location-consent-gate"]');
    if (await gate.isVisible()) {
      await gate.screenshot({ path: path.join(OUT, `${LABEL}-location-gate-card-${vp.name}.png`) });
    }
    console.log(`captured ${vp.name}`);
    await ctx.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
