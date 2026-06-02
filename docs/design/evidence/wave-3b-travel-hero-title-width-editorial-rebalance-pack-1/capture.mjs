/**
 * Pack 1 — Hero title width editorial rebalance captures.
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
  await page.waitForTimeout(500);
}

async function measure(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const layer = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const hero = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]')?.closest('[style*="aspect"]')
      || layer?.parentElement;
    const tr = title?.getBoundingClientRect();
    const lr = layer?.getBoundingClientRect();
    const hr = hero?.getBoundingClientRect();
    const style = title ? window.getComputedStyle(title) : null;
    return {
      titleWidthPx: tr ? Math.round(tr.width) : null,
      titleHeightPx: tr ? Math.round(tr.height) : null,
      titleFontSizePx: style ? Math.round(parseFloat(style.fontSize)) : null,
      titleLineHeightPx: style ? Math.round(parseFloat(style.lineHeight)) : null,
      textStackWidthPx: lr ? Math.round(lr.width) : null,
      heroWidthPx: hr ? Math.round(hr.width) : null,
      titleWidthPercentOfHero: tr && hr ? Math.round((tr.width / hr.width) * 100) : null,
      textStackWidthPercentOfHero: lr && hr ? Math.round((lr.width / hr.width) * 100) : null,
      titleText: title?.textContent?.trim() ?? '',
      lineCountEstimate: title ? Math.max(1, Math.round(tr.height / parseFloat(style.lineHeight || '1'))) : null,
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
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);
    all[vp.name] = await measure(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-travel-${vp.name}.png`) });
    await page.locator('[data-testid="travel-hero-editorial-text-layer"]').screenshot({
      path: path.join(OUT, `${LABEL}-hero-text-${vp.name}.png`),
    });
    console.log(
      `${vp.name}: stack=${all[vp.name].textStackWidthPx}px title=${all[vp.name].titleWidthPx}px font=${all[vp.name].titleFontSizePx}px lines~${all[vp.name].lineCountEstimate}`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-hero-title-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
