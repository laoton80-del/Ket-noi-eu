/**
 * Pack 37 — Dynamic Hero title premium scale lock QA.
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
  'wave-3b-travel-dynamic-hero-title-premium-scale-lock-pack-37'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const PACK_37_TARGETS = {
  normal: { fontSizeMin: 64, fontSizeMax: 68, lineHeightMin: 64, lineHeightMax: 70, maxWidthMax: 780 },
  fullscreen: { fontSizeMin: 66, fontSizeMax: 70, lineHeightMin: 66, lineHeightMax: 72, maxWidthMax: 820 },
  forbiddenFontSizePx: 80,
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
  await page.goto(`${BASE}/travel?pack37=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}

function parsePx(value) {
  if (!value || value === 'none') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

async function collectTitleMetrics(page, mode) {
  return page.evaluate(
    ({ modeLabel, targets }) => {
      const title = document.querySelector('[data-testid="travel-hero-title"]');
      const ts = title ? getComputedStyle(title) : null;
      const tr = title?.getBoundingClientRect();
      const fontSize = ts?.fontSize ?? null;
      const lineHeight = ts?.lineHeight ?? null;
      const maxWidth = ts?.maxWidth ?? null;
      const fontSizePx = fontSize ? Math.round(parseFloat(fontSize)) : null;
      const lineHeightPx = lineHeight ? Math.round(parseFloat(lineHeight)) : null;
      const maxWidthPx =
        maxWidth && maxWidth !== 'none' ? Math.round(parseFloat(maxWidth)) : null;
      const band = modeLabel.includes('fullscreen') ? targets.fullscreen : targets.normal;
      const inBand =
        fontSizePx != null &&
        fontSizePx >= band.fontSizeMin &&
        fontSizePx <= band.fontSizeMax &&
        lineHeightPx != null &&
        lineHeightPx >= band.lineHeightMin &&
        lineHeightPx <= band.lineHeightMax &&
        (maxWidthPx == null || maxWidthPx <= band.maxWidthMax);
      const noBillboard = fontSizePx == null || fontSizePx < targets.forbiddenFontSizePx;
      return {
        mode: modeLabel,
        fontSize,
        lineHeight,
        maxWidth,
        fontSizePx,
        lineHeightPx,
        maxWidthPx,
        renderedWidthPx: tr ? Math.round(tr.width) : null,
        inTargetBand: inBand,
        noBillboardFontSize: noBillboard,
      };
    },
    { modeLabel: mode, targets: PACK_37_TARGETS }
  );
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
  pack: 37,
  beforeReference: {
    normal: { fontSizePx: 74, lineHeightPx: 70, maxWidthPx: 820 },
    fullscreen: { fontSizePx: 65, lineHeightPx: 63, maxWidthPx: 820 },
  },
  targets: PACK_37_TARGETS,
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
console.log(`Pack 37 evidence → ${OUT_DIR}`);
