/**
 * Pack 1 — Destination FX compact strip captures + metrics.
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
  await page.waitForSelector('[data-testid="travel-destination-context-fx-row"]', { timeout: 90000 });
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
  await page.evaluate(() => {
    document.querySelector('[data-testid="travel-destination-context-weather-row"]')?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.querySelector('[data-testid="travel-destination-context-fx-row"]')?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(700);
}

async function measure(page) {
  return page.evaluate(() => {
    const fx = document.querySelector('[data-testid="travel-fx-reference-chip-eur-usd"]');
    const weather = document.querySelector('[data-testid^="travel-destination-weather-mini-card-"]');
    const strip = document.querySelector('[data-testid="travel-destination-context-fx-row"]');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const fxCards = [...document.querySelectorAll('[data-testid^="travel-fx-reference-chip-"]')].map((el) =>
      Math.round(r(el).height)
    );
    const safety = strip?.textContent?.includes('Không phải dịch vụ đổi tiền');
    return {
      fxCardHeightsPx: fxCards,
      fxCardSampleHeightPx: fx ? Math.round(r(fx).height) : null,
      weatherCardHeightPx: weather ? Math.round(r(weather).height) : null,
      fxStripHeightPx: strip ? Math.round(r(strip).height) : null,
      safetyMicrocopyPresent: Boolean(safety),
      kickerPresent: strip?.textContent?.includes('TỶ GIÁ THAM KHẢO') ?? false,
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
    all[vp.name] = await measure(page);
    await page.locator('[data-testid="travel-destination-context-fx-row"]').screenshot({
      path: path.join(OUT, `${LABEL}-fx-strip-${vp.name}.png`),
    });
    await page.screenshot({
      path: path.join(OUT, `${LABEL}-travel-${vp.name}.png`),
      fullPage: false,
    });
    console.log(
      `${vp.name}: fx=${all[vp.name].fxCardSampleHeightPx}px weather=${all[vp.name].weatherCardHeightPx}px`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-fx-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
