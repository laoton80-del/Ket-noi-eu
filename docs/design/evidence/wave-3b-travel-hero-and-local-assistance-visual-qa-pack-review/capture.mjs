/**
 * Pack review — Hero title Pack 2 + Local Assistance Pack 3 visual QA.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8095)}`;
const LABEL = process.env.PACK_LABEL || 'review';

const SHOTS = [
  { id: '01-1366-normal-default', width: 1366, height: 768, fs: false, hover: null },
  { id: '02-1366-normal-airport', width: 1366, height: 768, fs: false, hover: 'airport' },
  { id: '03-1366-normal-interpreter', width: 1366, height: 768, fs: false, hover: 'translation' },
  { id: '04-1366-normal-transport', width: 1366, height: 768, fs: false, hover: 'taxi' },
  { id: '05-1366-normal-emergency', width: 1366, height: 768, fs: false, hover: 'emergency' },
  { id: '06-1366-fullscreen-default', width: 1366, height: 768, fs: true, hover: null },
  { id: '07-1366-fullscreen-interpreter', width: 1366, height: 768, fs: true, hover: 'translation' },
  { id: '08-1366-fullscreen-transport', width: 1366, height: 768, fs: true, hover: 'taxi' },
  { id: '09-1024x768', width: 1024, height: 768, fs: false, hover: null },
  { id: '10-768x1024', width: 768, height: 1024, fs: false, hover: null },
  { id: '11-390x844', width: 390, height: 844, fs: false, hover: null },
];

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForSelector('[data-testid="travel-dynamic-hero-stage"]', { timeout: 90000 });
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
  await page.waitForTimeout(400);
}

async function hoverQuickHelp(page, id) {
  const tile = page.locator(`[data-testid="travel-flagship-${id}"]`).first();
  await tile.scrollIntoViewIfNeeded();
  await tile.hover({ force: true });
  await page.waitForTimeout(500);
}

async function measure(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const layer = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const scene = document.querySelector('[data-testid="travel-local-concierge-scene-panel"]');
    const tr = title?.getBoundingClientRect();
    const hr = hero?.getBoundingClientRect();
    const lr = layer?.getBoundingClientRect();
    const sr = scene?.getBoundingClientRect();
    const ts = title ? window.getComputedStyle(title) : null;
    const bg = document.querySelector('[data-testid="travel-local-concierge-scene-bg"]');
    const bgs = bg ? window.getComputedStyle(bg) : null;
    const flagshipCells = [...document.querySelectorAll('[data-testid^="travel-flagship-"]')].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        testId: el.getAttribute('data-testid'),
        borderWidth: cs.borderWidth,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow?.slice(0, 80) ?? null,
      };
    });
    return {
      titleFontSizePx: ts ? parseFloat(ts.fontSize) : null,
      titleLineHeightPx: ts ? parseFloat(ts.lineHeight) : null,
      titleWidthPx: tr ? Math.round(tr.width) : null,
      titleLeftPx: tr ? Math.round(tr.left) : null,
      textStackWidthPx: lr ? Math.round(lr.width) : null,
      textStackPaddingLeftPx: layer ? parseFloat(window.getComputedStyle(layer).paddingLeft) : null,
      heroStageHeightPx: hr ? Math.round(hr.height) : null,
      heroStageWidthPx: hr ? Math.round(hr.width) : null,
      titleText: title?.textContent?.trim() ?? null,
      sceneHeightPx: sr ? Math.round(sr.height) : null,
      sceneBgPosition: bgs?.backgroundPosition ?? null,
      flagshipCellCount: flagshipCells.length,
      flagshipCells: flagshipCells.slice(0, 4),
    };
  });
}

async function screenshotIfVisible(locator, filePath) {
  if (await locator.isVisible().catch(() => false)) {
    await locator.screenshot({ path: filePath });
    return true;
  }
  return false;
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, base: BASE, capturedAt: new Date().toISOString(), shots: {} };

  for (const shot of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: shot.width, height: shot.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '1');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, shot.fs);
    if (shot.hover) await hoverQuickHelp(page, shot.hover);

    all.shots[shot.id] = await measure(page);

    const prefix = path.join(OUT, `${LABEL}-${shot.id}`);
    await page.screenshot({ path: `${prefix}-full.png` });

    const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
    await screenshotIfVisible(hero, `${prefix}-closeup-hero.png`);

    const title = page.locator('[data-testid="travel-hero-title"]');
    if (await title.isVisible().catch(() => false)) {
      const box = await title.boundingBox();
      if (box) {
        await page.screenshot({
          path: `${prefix}-closeup-hero-title.png`,
          clip: {
            x: Math.max(0, box.x - 24),
            y: Math.max(0, box.y - 40),
            width: Math.min(shot.width, box.width + 120),
            height: Math.min(shot.height - box.y + 40, box.height + 100),
          },
        });
      }
    }

    const flagship = page.locator('[data-testid="travel-flagship-cards-row"]');
    await screenshotIfVisible(flagship, `${prefix}-closeup-quick-help.png`);

    await page.locator('[data-testid="travel-local-assist-section"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const localSection = page.locator('[data-testid="travel-local-assist-section"]');
    await screenshotIfVisible(localSection, `${prefix}-closeup-local-assistance.png`);

    const scene = page.locator('[data-testid="travel-local-concierge-scene-panel"]');
    await screenshotIfVisible(scene, `${prefix}-closeup-local-scene.png`);

    console.log(
      `${shot.id}: title=${all.shots[shot.id].titleFontSizePx}px w=${all.shots[shot.id].textStackWidthPx}px scene=${all.shots[shot.id].sceneHeightPx}px heroH=${all.shots[shot.id].heroStageHeightPx}px`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
