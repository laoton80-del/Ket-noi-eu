/**
 * Pack 1I — FX vs Situation material comparison captures.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

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
  await page.evaluate(async () => {
    document.querySelector('[data-testid="travel-destination-context-fx-row"]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(900);
}

async function measureCardStyles(page, testIdPrefix) {
  return page.evaluate(({ prefix }) => {
    const el = document.querySelector(`[data-testid^="${prefix}"]`);
    const cs = el ? window.getComputedStyle(el) : null;
    const rect = el?.getBoundingClientRect();
    return {
      testId: el?.getAttribute('data-testid') ?? null,
      height: rect ? Math.round(rect.height) : null,
      backgroundColor: cs?.backgroundColor,
      borderColor: cs?.borderColor,
      boxShadow: cs?.boxShadow?.slice(0, 120),
    };
  }, { prefix: testIdPrefix });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const metrics = {};

  for (const vp of [
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
    { name: '390x844', width: 390, height: 844, fs: false },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);

    await page.locator('[data-testid="travel-destination-context-fx-row"]').screenshot({
      path: path.join(OUT, `fx-closeup-${vp.name}.png`),
    });
    await page.evaluate(async () => {
      document.querySelector('[data-testid="travel-utility-grid"]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.waitForTimeout(700);
    await page.locator('[data-testid="travel-utility-grid"]').screenshot({
      path: path.join(OUT, `situation-closeup-${vp.name}.png`),
    });
    if (vp.fs) {
      await page.screenshot({ path: path.join(OUT, `fullscreen-${vp.name}.png`), fullPage: false });
    }

    metrics[vp.name] = {
      fxCard: await measureCardStyles(page, 'travel-fx-reference-chip-'),
      situationCard: await measureCardStyles(page, 'travel-utility-airport'),
      grid: await page.evaluate(() => {
        const g = document.querySelector('[data-testid="travel-utility-grid"]')?.getBoundingClientRect();
        return g ? { height: Math.round(g.height), bottom: Math.round(g.bottom), visible: g.bottom <= window.innerHeight + 2 } : null;
      }),
    };
    await ctx.close();
    console.log(`${vp.name}: fx=${metrics[vp.name].fxCard.backgroundColor} sit=${metrics[vp.name].situationCard.backgroundColor}`);
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
