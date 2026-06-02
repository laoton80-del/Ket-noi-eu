/**
 * VIONA.UI.TRAVEL.SITUATION_NETWORK_BACKGROUND_WIRE.PACK_1
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

async function prep(page, { fullscreen }) {
  await page.goto(`${BASE}/travel?pack1=${Date.now()}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="travel-utility-grid"]', { timeout: 90000 });
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
  await page.locator('[data-testid="travel-utility-grid"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
}

async function measure(page) {
  return page.evaluate(() => {
    const bg =
      document.querySelector('[data-testid="travel-situation-network-bg"]') ??
      document.querySelector('[data-testid="travel-utility-grid"] img[alt=""]');
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    const card = document.querySelector('[data-testid="travel-utility-hotel"]');
    const bgStyle = bg ? getComputedStyle(bg) : null;
    const imgChild = bg?.tagName === 'IMG' ? bg : bg?.querySelector('img');
    const bgR = bg?.getBoundingClientRect();
    const gridR = grid?.getBoundingClientRect();
    const cardR = card?.getBoundingClientRect();
    return {
      networkBgPresent: Boolean(bg),
      networkBgWidthPx: bgR ? Math.round(bgR.width) : null,
      networkBgHeightPx: bgR ? Math.round(bgR.height) : null,
      gridTopPx: gridR ? Math.round(gridR.top) : null,
      cardTopPx: cardR ? Math.round(cardR.top) : null,
      cardAboveBg:
        bgR && cardR ? cardR.top >= bgR.top && cardR.bottom <= bgR.bottom + 2 : null,
      bgOpacity: bgStyle?.opacity ?? null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { capturedAt: new Date().toISOString(), pack: 'situation-network-bg-wire-pack-1' };

  const shots = [
    { name: '390-sanity', w: 390, h: 844, fs: false },
    { name: '768x1024', w: 768, h: 1024, fs: false },
    { name: '1024x768', w: 1024, h: 768, fs: false },
    { name: '1366-normal', w: 1366, h: 768, fs: false },
    { name: '1366-fullscreen', w: 1366, h: 768, fs: true },
  ];

  for (const shot of shots) {
    const ctx = await browser.newContext({ viewport: { width: shot.w, height: shot.h } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, { fullscreen: shot.fs });
    all[shot.name] = await measure(page);
    await page
      .locator('[data-testid="travel-utility-grid"]')
      .screenshot({ path: path.join(OUT, `${shot.name}-situation.png`) });
    await page.screenshot({ path: path.join(OUT, `${shot.name}-page.png`) });
    console.log(`${shot.name}: bg=${all[shot.name].networkBgPresent} h=${all[shot.name].networkBgHeightPx}`);
    await ctx.close();
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
