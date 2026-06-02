/**
 * Pack 1 — Quick Help semantic contrast captures.
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
  await page.waitForSelector('[data-testid="travel-flagship-cards-row"]', { timeout: 90000 });
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

async function measureQuickHelp(page) {
  return page.evaluate(() => {
    const ids = ['airport', 'translation', 'taxi', 'emergency'];
    const row = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const rowRect = row?.getBoundingClientRect();
    const cards = ids.map((id) => {
      const el = document.querySelector(`[data-testid="travel-flagship-${id}"]`);
      const cell = el?.closest('[style*="box-shadow"], [style*="border"]') ?? el?.parentElement?.parentElement;
      const style = cell ? window.getComputedStyle(cell) : null;
      const boxShadow = style?.boxShadow ?? '';
      const borderColor = style?.borderColor ?? '';
      const title = el?.querySelector('[class*="flagshipTitle"]') ?? el;
      return {
        id,
        boxShadow: boxShadow.slice(0, 120),
        borderColor,
        titleText: title?.textContent?.trim() ?? '',
      };
    });
    return { rowWidthPx: rowRect ? Math.round(rowRect.width) : null, cards };
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
    all[vp.name] = await measureQuickHelp(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-travel-${vp.name}.png`) });
    const row = page.locator('[data-testid="travel-flagship-cards-row"]');
    if (await row.isVisible()) {
      await row.screenshot({ path: path.join(OUT, `${LABEL}-quick-help-row-${vp.name}.png`) });
    }
    console.log(`${vp.name}: row=${all[vp.name].rowWidthPx}px cards=${all[vp.name].cards.length}`);
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-quick-help-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
