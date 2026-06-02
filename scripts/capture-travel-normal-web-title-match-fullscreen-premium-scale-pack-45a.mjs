import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PHASE = process.env.VIONA_CAPTURE_PHASE ?? 'run';
const BASE = process.env.VIONA_WEB_BASE ?? 'http://localhost:8096';
const BUST = Date.now();
const OUT_DIR =
  process.env.VIONA_CAPTURE_OUT ??
  path.join(os.tmpdir(), 'viona-pack-45a-title-scale', PHASE);

async function dismissGates(page) {
  const locVi = page.getByText('Tiếp tục không dùng vị trí', { exact: true });
  const locEn = page.getByText('Continue without location', { exact: true });
  if (await locVi.isVisible({ timeout: 2500 }).catch(() => false)) {
    await locVi.click();
    await page.waitForTimeout(400);
    return;
  }
  if (await locEn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await locEn.click();
    await page.waitForTimeout(400);
  }
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack45a=${BUST}&phase=${PHASE}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', {
    timeout: 180_000,
  });
  await page.waitForTimeout(600);
}

async function collectTitleMetrics(page, modeLabel) {
  return page.evaluate((mode) => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const style = title ? getComputedStyle(title) : null;
    const rect = title?.getBoundingClientRect();
    const fontSizePx = style?.fontSize ? Math.round(parseFloat(style.fontSize)) : null;
    const lineHeightPx = style?.lineHeight ? Math.round(parseFloat(style.lineHeight)) : null;
    const maxWidthPx =
      style?.maxWidth && style.maxWidth !== 'none'
        ? Math.round(parseFloat(style.maxWidth))
        : null;
    const lineCount =
      rect && lineHeightPx && lineHeightPx > 0
        ? Math.max(1, Math.round(rect.height / lineHeightPx))
        : null;
    return {
      mode,
      fontSize: style?.fontSize ?? null,
      lineHeight: style?.lineHeight ?? null,
      maxWidth: style?.maxWidth ?? null,
      fontSizePx,
      lineHeightPx,
      maxWidthPx,
      renderedWidthPx: rect ? Math.round(rect.width) : null,
      lineCount,
    };
  }, modeLabel);
}

async function collectLayoutAnchors(page, modeLabel) {
  return page.evaluate((mode) => {
    const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const situations = document.querySelector('[data-testid="travel-situations-section"]');
    const heroRect = hero?.getBoundingClientRect();
    const quickHelpRect = quickHelp?.getBoundingClientRect();
    const situationsRect = situations?.getBoundingClientRect();
    return {
      mode,
      heroTopPx: heroRect ? Math.round(heroRect.top) : null,
      heroHeightPx: heroRect ? Math.round(heroRect.height) : null,
      quickHelpTopPx: quickHelpRect ? Math.round(quickHelpRect.top) : null,
      situationsTopPx: situationsRect ? Math.round(situationsRect.top) : null,
      heroToQuickHelpGapPx:
        heroRect && quickHelpRect ? Math.round(quickHelpRect.top - (heroRect.top + heroRect.height)) : null,
      quickHelpToSituationsGapPx:
        quickHelpRect && situationsRect
          ? Math.round(situationsRect.top - (quickHelpRect.top + quickHelpRect.height))
          : null,
    };
  }, modeLabel);
}

async function screenshotOpening(page, fileName) {
  const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
  const situations = page.locator('[data-testid="travel-situations-section"]');
  await hero.waitFor({ state: 'visible' });
  const heroBox = await hero.boundingBox();
  const sitBox = await situations.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (heroBox && sitBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, fileName),
      clip: {
        x: 0,
        y: Math.max(0, heroBox.y - 8),
        width: vw,
        height: sitBox.y + sitBox.height - heroBox.y + 16,
      },
    });
  }
}

async function screenshotTitle(page, fileName) {
  const title = page.locator('[data-testid="travel-hero-title"]');
  await title.waitFor({ state: 'visible' });
  const box = await title.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, fileName),
      clip: {
        x: 0,
        y: Math.max(0, box.y - 28),
        width: vw,
        height: box.height + 140,
      },
    });
  }
}

const initScript = (lang) => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', lang);
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

const proof = {
  pack: '45A',
  phase: PHASE,
  baseUrl: BASE,
  captures: {},
  screenshots: {},
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript, 'vi');
await openTravel(page1366);
proof.captures.normal1366_vi = await collectTitleMetrics(page1366, 'normal-1366-vi');
proof.captures.normal1366_layout = await collectLayoutAnchors(page1366, 'normal-1366-layout');
await screenshotOpening(page1366, `${PHASE}-travel-1366x768-normal-opening.png`);
await screenshotTitle(page1366, `${PHASE}-travel-1366x768-normal-title-closeup.png`);
proof.screenshots.normalOpening = path.join(OUT_DIR, `${PHASE}-travel-1366x768-normal-opening.png`);
proof.screenshots.normalTitleCloseup = path.join(
  OUT_DIR,
  `${PHASE}-travel-1366x768-normal-title-closeup.png`
);

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(900);
proof.captures.fullscreen1366 = await collectTitleMetrics(page1366, 'fullscreen-1366');
proof.captures.fullscreen1366_layout = await collectLayoutAnchors(page1366, 'fullscreen-1366-layout');
await screenshotOpening(page1366, `${PHASE}-travel-1366x768-fullscreen-opening.png`);
proof.screenshots.fullscreenOpening = path.join(
  OUT_DIR,
  `${PHASE}-travel-1366x768-fullscreen-opening.png`
);
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1366en = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366en.addInitScript(initScript, 'en');
await openTravel(page1366en);
proof.captures.normal1366_en = await collectTitleMetrics(page1366en, 'normal-1366-en');
await page1366en.close();

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript, 'vi');
await openTravel(page1024);
proof.captures.tablet1024 = await collectTitleMetrics(page1024, 'tablet-1024');
proof.captures.tablet1024_layout = await collectLayoutAnchors(page1024, 'tablet-1024-layout');
await page1024.screenshot({
  path: path.join(OUT_DIR, `${PHASE}-travel-1024x768-sanity.png`),
  fullPage: true,
});
proof.screenshots.tabletSanity = path.join(OUT_DIR, `${PHASE}-travel-1024x768-sanity.png`);

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript, 'vi');
await openTravel(page390);
proof.captures.mobile390 = await collectTitleMetrics(page390, 'mobile-390');
proof.captures.mobile390_layout = await collectLayoutAnchors(page390, 'mobile-390-layout');
await page390.screenshot({
  path: path.join(OUT_DIR, `${PHASE}-travel-390x844-sanity.png`),
  fullPage: true,
});
proof.screenshots.mobileSanity = path.join(OUT_DIR, `${PHASE}-travel-390x844-sanity.png`);

await browser.close();
await writeFile(path.join(OUT_DIR, `proof-${PHASE}.json`), JSON.stringify(proof, null, 2));
console.log(JSON.stringify({ outDir: OUT_DIR, proofFile: path.join(OUT_DIR, `proof-${PHASE}.json`) }));
