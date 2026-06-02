/**
 * Pack 1 — Travel hero editorial title scale captures + metrics.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const LABEL = process.env.PACK_LABEL || 'after';

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 90000 });
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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function measureTitle(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const layer = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const hero = document.querySelector('[class*="heroImageClip"]')?.parentElement;
    const cs = title ? window.getComputedStyle(title) : null;
    const layerCs = layer ? window.getComputedStyle(layer) : null;
    const titleRect = title?.getBoundingClientRect();
    const heroRect = hero?.getBoundingClientRect();
    const layerRect = layer?.getBoundingClientRect();
    return {
      fontSize: cs ? Math.round(parseFloat(cs.fontSize)) : null,
      lineHeight: cs ? Math.round(parseFloat(cs.lineHeight)) : null,
      maxWidth: cs?.maxWidth ?? null,
      titleWidth: titleRect ? Math.round(titleRect.width) : null,
      titleLeftPx: titleRect ? Math.round(titleRect.left) : null,
      heroLeftPx: heroRect ? Math.round(heroRect.left) : null,
      insetFromHeroLeftPx:
        titleRect && heroRect ? Math.round(titleRect.left - heroRect.left) : null,
      layerPaddingLeft: layerCs?.paddingLeft ?? null,
      layerLeftPx: layerRect ? Math.round(layerRect.left) : null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, capturedAt: new Date().toISOString() };

  for (const vp of [
    { name: '390x844', width: 390, height: 844, fs: false },
    { name: '768x1024', width: 768, height: 1024, fs: false },
    { name: '1024x768', width: 1024, height: 768, fs: false },
    { name: '1366x768-normal', width: 1366, height: 768, fs: false },
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);
    all[vp.name] = await measureTitle(page);
    await page.locator('[data-testid="travel-hero-title"]').screenshot({
      path: path.join(OUT, `${LABEL}-hero-title-${vp.name}.png`),
    });
    await page.screenshot({
      path: path.join(OUT, `${LABEL}-hero-${vp.name}.png`),
      fullPage: false,
    });
    console.log(`${vp.name}: ${all[vp.name].fontSize}px inset=${all[vp.name].insetFromHeroLeftPx}px`);
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-title-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
