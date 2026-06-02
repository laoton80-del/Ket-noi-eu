/**
 * Pack 40 — Dynamic Hero title hard cap final QA.
 * Prereq: npx expo start --web --port 8095 --clear
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-travel-dynamic-hero-title-hard-cap-final-pack-40'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const TARGETS = {
  normal: { fontSizeMin: 46, fontSizeMax: 52, lineHeightMin: 50, lineHeightMax: 56, maxWidthMin: 560, maxWidthMax: 640 },
  fullscreen: { fontSizeMin: 50, fontSizeMax: 56, lineHeightMin: 54, lineHeightMax: 60, maxWidthMin: 620, maxWidthMax: 700 },
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  const locEn = page.getByText('Continue without location', { exact: true });
  if (await locEn.isVisible({ timeout: 1500 }).catch(() => false)) await locEn.click();
  await page.waitForTimeout(400);
}

async function resolveTravelLocationGate(page) {
  const secondaryVi = page.getByText('Tiếp tục không dùng vị trí', { exact: true });
  const secondaryEn = page.getByText('Continue without location', { exact: true });
  if (await secondaryVi.isVisible({ timeout: 3000 }).catch(() => false)) {
    await secondaryVi.click();
    await page.waitForTimeout(500);
    return;
  }
  if (await secondaryEn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await secondaryEn.click();
    await page.waitForTimeout(500);
  }
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack40=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}

async function collectTitleMetrics(page, mode) {
  return page.evaluate(({ modeLabel, targets }) => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const ts = title ? getComputedStyle(title) : null;
    const tr = title?.getBoundingClientRect();
    const fontSizePx = ts?.fontSize ? Math.round(parseFloat(ts.fontSize)) : null;
    const lineHeightPx = ts?.lineHeight ? Math.round(parseFloat(ts.lineHeight)) : null;
    const maxWidthPx = ts?.maxWidth && ts.maxWidth !== 'none' ? Math.round(parseFloat(ts.maxWidth)) : null;
    const lineCount =
      tr && lineHeightPx && lineHeightPx > 0 ? Math.max(1, Math.round(tr.height / lineHeightPx)) : null;
    const band = modeLabel.includes('fullscreen') ? targets.fullscreen : targets.normal;
    return {
      mode: modeLabel,
      fontSize: ts?.fontSize ?? null,
      lineHeight: ts?.lineHeight ?? null,
      maxWidth: ts?.maxWidth ?? null,
      fontSizePx,
      lineHeightPx,
      maxWidthPx,
      renderedWidthPx: tr ? Math.round(tr.width) : null,
      lineCount,
      inTargetBand:
        fontSizePx != null &&
        lineHeightPx != null &&
        maxWidthPx != null &&
        fontSizePx >= band.fontSizeMin &&
        fontSizePx <= band.fontSizeMax &&
        lineHeightPx >= band.lineHeightMin &&
        lineHeightPx <= band.lineHeightMax &&
        maxWidthPx >= band.maxWidthMin &&
        maxWidthPx <= band.maxWidthMax,
      failGuardNormal: modeLabel.includes('normal') ? fontSizePx != null && fontSizePx >= 56 : false,
      failGuardFullscreen: modeLabel.includes('fullscreen') ? fontSizePx != null && fontSizePx >= 62 : false,
    };
  }, { modeLabel: mode, targets: TARGETS });
}

async function screenshotOpening(page, outName) {
  const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
  const situations = page.locator('[data-testid="travel-situations-section"]');
  await hero.waitFor({ state: 'visible' });
  const heroBox = await hero.boundingBox();
  const sitBox = await situations.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (heroBox && sitBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, heroBox.y - 8),
        width: vw,
        height: sitBox.y + sitBox.height - heroBox.y + 16,
      },
    });
  }
}

async function screenshotTitle(page, outName) {
  const title = page.locator('[data-testid="travel-hero-title"]');
  await title.waitFor({ state: 'visible' });
  const box = await title.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, box.y - 28),
        width: vw,
        height: box.height + 140,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = {
  pack: 40,
  beforeReference: {
    normal: { fontSizePx: 56, lineHeightPx: 60, maxWidthPx: 660 },
    fullscreen: { fontSizePx: 60, lineHeightPx: 64, maxWidthPx: 720 },
  },
  targets: TARGETS,
  captures: {},
};

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'en');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);

proof.captures.normal1366 = await collectTitleMetrics(page1366, 'normal-1366');
await screenshotOpening(page1366, 'travel-1366x768-normal-opening.png');
await screenshotTitle(page1366, 'travel-1366x768-normal-title-closeup.png');

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(900);
proof.captures.fullscreen1366 = await collectTitleMetrics(page1366, 'fullscreen-1366');
await screenshotOpening(page1366, 'travel-1366x768-fullscreen-opening.png');
await screenshotTitle(page1366, 'travel-1366x768-fullscreen-title-closeup.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures.tablet1024 = await collectTitleMetrics(page1024, 'tablet-1024');
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-sanity.png'),
  fullPage: true,
});

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
proof.captures.mobile390 = await collectTitleMetrics(page390, 'mobile-390');
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 40 evidence → ${OUT_DIR}`);
