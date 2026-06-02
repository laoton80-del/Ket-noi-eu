/**
 * Pack 3 — Fullscreen hero title final tune QA.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8095)}`;
const LABEL = process.env.PACK_LABEL || 'pack3-fs-tune';

const SHOTS = [
  { name: '1366-normal-default', width: 1366, height: 768, fs: false, hover: null },
  { name: '1366-normal-airport', width: 1366, height: 768, fs: false, hover: 'airport' },
  { name: '1366-normal-interpreter', width: 1366, height: 768, fs: false, hover: 'translation' },
  { name: '1366-fullscreen-default', width: 1366, height: 768, fs: true, hover: null },
  { name: '1366-fullscreen-transport', width: 1366, height: 768, fs: true, hover: 'taxi' },
  { name: '1366-fullscreen-interpreter', width: 1366, height: 768, fs: true, hover: 'translation' },
  { name: '390-sanity', width: 390, height: 844, fs: false, hover: null },
];

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForSelector('[data-testid="travel-dynamic-hero-stage"]', { timeout: 90000 });
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  if (fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(400);
}

async function hoverQuickHelp(page, id) {
  await page.locator(`[data-testid="travel-flagship-${id}"]`).first().hover({ force: true });
  await page.waitForTimeout(450);
}

async function measure(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const ts = title ? window.getComputedStyle(title) : null;
    const lr = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]')?.getBoundingClientRect();
    return {
      titleFontSizePx: ts ? parseFloat(ts.fontSize) : null,
      titleLineHeightPx: ts ? parseFloat(ts.lineHeight) : null,
      textStackWidthPx: lr ? Math.round(lr.width) : null,
      titleText: title?.textContent?.trim() ?? null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, base: BASE, capturedAt: new Date().toISOString() };

  for (const shot of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: shot.width, height: shot.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '1');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, shot.fs);
    if (shot.hover) await hoverQuickHelp(page, shot.hover);
    all[shot.name] = await measure(page);
    await page.locator('[data-testid="travel-dynamic-hero-stage"]').screenshot({
      path: path.join(OUT, `${LABEL}-hero-${shot.name}.png`),
    });
    const title = page.locator('[data-testid="travel-hero-title"]');
    const box = await title.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(OUT, `${LABEL}-hero-title-${shot.name}.png`),
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 36),
          width: Math.min(shot.width, box.width + 100),
          height: Math.min(shot.height, box.height + 80),
        },
      });
    }
    console.log(
      `${shot.name}: ${all[shot.name].titleFontSizePx}px lh=${all[shot.name].titleLineHeightPx} w=${all[shot.name].textStackWidthPx}`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
