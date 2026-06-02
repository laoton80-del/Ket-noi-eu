/**
 * VIONA.UI.TRAVEL.HERO_AND_QUICKHELP_RENDER_HARD_FIX.PACK_3
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

const CONTEXTS = [
  { id: 'default', hover: null },
  { id: 'airport', testId: 'travel-flagship-airport' },
  { id: 'translation', testId: 'travel-flagship-translation' },
  { id: 'taxi', testId: 'travel-flagship-taxi' },
  { id: 'emergency', testId: 'travel-flagship-emergency' },
];

async function prep(page, { fullscreen }) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle', timeout: 120000 });
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
  await page.waitForTimeout(3500);
}

async function activate(page, testId) {
  if (!testId) return;
  await page.locator(`[data-testid="${testId}"]`).hover();
  await page.waitForTimeout(700);
}

async function measure(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const layer = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const trust = document.querySelector('[data-testid="travel-hero-editorial-text-layer"] .hero-trust-strip, [class*="heroTrustStrip"]');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const cs = title ? getComputedStyle(title) : null;
    const hero = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]')?.parentElement;
    const heroW = hero ? r(hero).width : null;
    const titleW = title ? Math.round(r(title).width) : null;
    return {
      titleFontSizePx: cs ? Math.round(parseFloat(cs.fontSize)) : null,
      titleMaxWidthPx: cs?.maxWidth && cs.maxWidth !== 'none' ? Math.round(parseFloat(cs.maxWidth)) : null,
      titleWidthPx: titleW,
      textLayerWidthPx: layer ? Math.round(r(layer).width) : null,
      heroWidthPx: heroW ? Math.round(heroW) : null,
      titleWidthPercentOfHero: heroW && titleW ? Math.round((titleW / heroW) * 100) : null,
      titleText: title?.textContent?.slice(0, 80) ?? null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { capturedAt: new Date().toISOString() };

  const shots = [
    { name: '1366-normal-default', w: 1366, h: 768, fs: false, ctx: 'default' },
    { name: '1366-normal-airport', w: 1366, h: 768, fs: false, ctx: 'airport' },
    { name: '1366-normal-interpreter', w: 1366, h: 768, fs: false, ctx: 'translation' },
    { name: '1366-normal-transport', w: 1366, h: 768, fs: false, ctx: 'taxi' },
    { name: '1366-normal-emergency', w: 1366, h: 768, fs: false, ctx: 'emergency' },
    { name: '1366-fullscreen-default', w: 1366, h: 768, fs: true, ctx: 'default' },
    { name: '1366-fullscreen-interpreter', w: 1366, h: 768, fs: true, ctx: 'translation' },
    { name: '1366-fullscreen-quickhelp-closeup', w: 1366, h: 768, fs: true, ctx: 'default', rowOnly: true },
    { name: '390-sanity', w: 390, h: 844, fs: false, ctx: 'default' },
  ];

  for (const shot of shots) {
    const ctx = CONTEXTS.find((c) => c.id === shot.ctx) ?? CONTEXTS[0];
    const browserCtx = await browser.newContext({ viewport: { width: shot.w, height: shot.h } });
    await browserCtx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await browserCtx.newPage();
    await prep(page, { fullscreen: shot.fs });
    await activate(page, ctx.testId);
    all[shot.name] = await measure(page);
    const locator = shot.rowOnly
      ? page.locator('[data-testid="travel-flagship-cards-row"]')
      : page.locator('body');
    await locator.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
    console.log(
      `${shot.name}: title=${all[shot.name].titleFontSizePx}px w=${all[shot.name].titleWidthPx}px (${all[shot.name].titleWidthPercentOfHero}% hero)`
    );
    await browserCtx.close();
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
