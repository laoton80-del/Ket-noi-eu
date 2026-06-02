/**
 * Pack 1 — Travel Quick Help + Situation card spacing/color captures.
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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function measureCards(page) {
  return page.evaluate(() => {
    const card = (id) => document.querySelector(`[data-testid="travel-utility-${id}"]`);
    const flagship = (id) => document.querySelector(`[data-testid="travel-flagship-${id}"]`);
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const cs = (el) => (el ? window.getComputedStyle(el) : null);
    const grid = document.querySelector('[data-testid="travel-situation-grid-row"]')?.parentElement;
    const gridCs = grid ? window.getComputedStyle(grid) : null;
    const sample = ['airport', 'taxi', 'hotel', 'translation'];
    const situation = Object.fromEntries(
      sample.map((id) => {
        const el = card(id);
        const style = cs(el);
        return [
          id,
          el
            ? {
                height: Math.round(rect(el).height),
                width: Math.round(rect(el).width),
                bg: style?.backgroundColor,
                border: style?.borderColor,
              }
            : null,
        ];
      })
    );
    const quickHelp = Object.fromEntries(
      ['airport', 'translation', 'taxi', 'emergency'].map((id) => {
        const el = flagship(id);
        const style = cs(el);
        return [id, el ? { height: Math.round(rect(el).height), border: style?.borderColor } : null];
      })
    );
    return {
      gridGap: gridCs?.gap ?? gridCs?.rowGap ?? null,
      situation,
      quickHelp,
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
    all[vp.name] = await measureCards(page);
    await page.locator('[data-testid="travel-flagship-cards-row"]').screenshot({
      path: path.join(OUT, `${LABEL}-quickhelp-${vp.name}.png`),
    });
    await page.locator('[data-testid="travel-utility-grid"]').screenshot({
      path: path.join(OUT, `${LABEL}-situation-${vp.name}.png`),
    });
    console.log(`${vp.name}: gridGap=${all[vp.name].gridGap}`);
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-card-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
