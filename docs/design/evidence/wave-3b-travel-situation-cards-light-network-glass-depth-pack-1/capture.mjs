/**
 * VIONA.UI.TRAVEL.SITUATION_CARDS.LIGHT_NETWORK_GLASS_DEPTH.PACK_1
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle', timeout: 120000 });
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
  await page.evaluate(() => {
    document.querySelector('[data-testid="travel-utility-grid"]')?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(4500);
}

async function measure(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    const cards = document.querySelectorAll('[data-testid^="travel-utility-"]');
    const row = document.querySelector('[data-testid="travel-situation-grid-row"]');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    return {
      gridHeightPx: grid ? Math.round(r(grid).height) : null,
      cardCount: cards.length,
      firstRowHeightPx: row ? Math.round(r(row).height) : null,
      firstCardHeightPx: cards[0] ? Math.round(r(cards[0]).height) : null,
      kickerPresent: grid?.textContent?.includes('TÌNH HUỐNG') ?? false,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { capturedAt: new Date().toISOString() };

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
    await page.locator('[data-testid="travel-utility-grid"]').screenshot({
      path: path.join(OUT, `situation-${vp.name}.png`),
    });
    console.log(
      `${vp.name}: grid=${all[vp.name].gridHeightPx}px cards=${all[vp.name].cardCount} cardH=${all[vp.name].firstCardHeightPx}px`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
