/**
 * Pack 1 — Local Assistance premium hierarchy captures.
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
  await page.waitForSelector('[data-testid="travel-local-assist-card"]', { timeout: 90000 });
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
    document.querySelector('[data-testid="travel-local-assist-section"]')?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(700);
}

async function measure(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-testid="travel-local-assist-card"]');
    const search = document.querySelector('[data-testid="travel-local-discovery-search-action"]');
    const categories = document.querySelectorAll('[data-testid^="travel-local-discovery-category-"]');
    const previews = document.querySelectorAll('[data-testid^="travel-local-discovery-preview-"]');
    const primary = document.querySelector('[data-testid="travel-local-discovery-handoff-directions"]');
    const secondary = document.querySelector('[data-testid="travel-local-discovery-handoff-guides"]');
    const safety = card?.textContent?.includes('Không xác nhận đặt chỗ');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    return {
      cardHeightPx: card ? Math.round(r(card).height) : null,
      searchHeightPx: search ? Math.round(r(search).height) : null,
      categoryChipCount: categories.length,
      previewItemCount: previews.length,
      primaryCtaHeightPx: primary ? Math.round(r(primary).height) : null,
      secondaryCtaHeightPx: secondary ? Math.round(r(secondary).height) : null,
      safetyPresent: Boolean(safety),
      titlePresent: card?.textContent?.includes('Hỗ trợ địa phương') ?? false,
      searchTitlePresent: card?.textContent?.includes('Tìm địa điểm cần đến') ?? false,
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
    await page.locator('[data-testid="travel-local-assist-card"]').screenshot({
      path: path.join(OUT, `${LABEL}-local-assist-${vp.name}.png`),
    });
    console.log(
      `${vp.name}: card=${all[vp.name].cardHeightPx}px primary=${all[vp.name].primaryCtaHeightPx}px secondary=${all[vp.name].secondaryCtaHeightPx}px`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-local-assist-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
