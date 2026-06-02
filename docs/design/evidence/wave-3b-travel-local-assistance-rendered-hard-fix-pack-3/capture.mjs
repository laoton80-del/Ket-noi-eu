/**
 * Pack 3 — Local Assistance rendered hard-fix captures + scene metrics.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8094)}`;
const LABEL = process.env.PACK_LABEL || 'pack3';

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
  await page.locator('[data-testid="travel-local-assist-section"]').scrollIntoViewIfNeeded();
  await page.waitForSelector('[data-testid="travel-local-concierge-scene-panel"]', {
    state: 'visible',
    timeout: 30000,
  });
  await page.waitForTimeout(500);
}

async function measureLocalAssist(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-testid="travel-local-concierge-scene-panel"]');
    const card = document.querySelector('[data-testid="travel-local-assist-card"]');
    const bg = document.querySelector('[data-testid="travel-local-concierge-scene-bg"]');
    const pr = panel?.getBoundingClientRect();
    const cr = card?.getBoundingClientRect();
    const style = bg ? window.getComputedStyle(bg) : null;
    const search = document.querySelector('[data-testid="travel-local-discovery-search-action"]');
    const sr = search?.getBoundingClientRect();
    return {
      panelWidthPx: pr ? Math.round(pr.width) : null,
      panelHeightPx: pr ? Math.round(pr.height) : null,
      cardHeightPx: cr ? Math.round(cr.height) : null,
      searchRowHeightPx: sr ? Math.round(sr.height) : null,
      renderMode: bg ? 'background-image' : 'unknown',
      backgroundSize: style?.backgroundSize ?? null,
      backgroundPosition: style?.backgroundPosition ?? null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, capturedAt: new Date().toISOString(), base: BASE };

  const viewports = [
    { name: '390x844', width: 390, height: 844, fs: false, closeup: false },
    { name: '768x1024', width: 768, height: 1024, fs: false, closeup: false },
    { name: '1024x768', width: 1024, height: 768, fs: false, closeup: false },
    { name: '1366x768-normal', width: 1366, height: 768, fs: false, closeup: true },
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true, closeup: true },
  ];

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);
    all[vp.name] = await measureLocalAssist(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-travel-${vp.name}.png`) });
    const section = page.locator('[data-testid="travel-local-assist-section"]');
    if (await section.isVisible()) {
      await section.screenshot({ path: path.join(OUT, `${LABEL}-local-assist-panel-${vp.name}.png`) });
    }
    if (vp.closeup) {
      const card = page.locator('[data-testid="travel-local-assist-card"]');
      if (await card.isVisible()) {
        await card.screenshot({ path: path.join(OUT, `${LABEL}-local-assist-closeup-${vp.name}.png`) });
      }
    }
    console.log(
      `${vp.name}: scene=${all[vp.name].panelHeightPx}px search=${all[vp.name].searchRowHeightPx}px bgPos=${all[vp.name].backgroundPosition}`
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
