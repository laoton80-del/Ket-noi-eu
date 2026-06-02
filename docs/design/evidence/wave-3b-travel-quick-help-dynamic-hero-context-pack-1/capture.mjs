/**
 * Pack 1 — Quick Help Dynamic Hero context captures.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const LABEL = process.env.PACK_LABEL || 'after';

const QUICK_HELP = [
  { id: 'default', testId: null, label: 'default' },
  { id: 'airport', testId: 'travel-flagship-airport', label: 'airport' },
  { id: 'translation', testId: 'travel-flagship-translation', label: 'interpreter' },
  { id: 'taxi', testId: 'travel-flagship-taxi', label: 'transport' },
  { id: 'emergency', testId: 'travel-flagship-emergency', label: 'emergency' },
];

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
  await page.waitForTimeout(600);
}

async function readHero(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]')?.textContent?.trim() ?? '';
    const layer = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const lines = layer?.innerText?.split('\n').map((s) => s.trim()).filter(Boolean) ?? [];
    const subtitle = lines.find((line) => line !== title && line.length > 24) ?? '';
    const chipCandidates = lines.filter(
      (line) => line !== title && line !== subtitle && line.length < 24 && !line.includes('TRAVEL')
    );
    return { title, subtitle, chips: chipCandidates.slice(0, 3) };
  });
}

async function captureViewport(browser, vp, all) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.width < 768,
    hasTouch: vp.width < 768,
  });
  await ctx.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    localStorage.setItem('@app_language', 'vi');
  });
  const page = await ctx.newPage();
  await prep(page, vp.fs);

  for (const card of QUICK_HELP) {
    if (card.testId) {
      const el = page.locator(`[data-testid="${card.testId}"]`);
      await el.scrollIntoViewIfNeeded();
      if (vp.width < 768) {
        await el.focus();
      } else {
        await el.hover({ force: true });
      }
      await page.waitForTimeout(700);
    } else {
      await page.evaluate(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 0, clientY: 0 }));
      });
      await page.waitForTimeout(400);
    }
    const hero = await readHero(page);
    const key = `${vp.name}-${card.label}`;
    all[key] = hero;
    await page.locator('[data-testid="travel-hero-editorial-text-layer"]').screenshot({
      path: path.join(OUT, `${LABEL}-hero-${key}.png`),
    });
    console.log(`${key}: ${hero.title}`);
  }

  await page.screenshot({ path: path.join(OUT, `${LABEL}-travel-${vp.name}.png`) });
  await ctx.close();
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, capturedAt: new Date().toISOString() };

  for (const vp of [
    { name: '1366x768-normal', width: 1366, height: 768, fs: false },
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
    { name: '390x844', width: 390, height: 844, fs: false },
  ]) {
    await captureViewport(browser, vp, all);
  }

  await writeFile(path.join(OUT, `${LABEL}-hero-context-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
