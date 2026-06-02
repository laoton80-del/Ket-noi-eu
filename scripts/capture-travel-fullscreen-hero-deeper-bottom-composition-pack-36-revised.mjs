/**
 * Pack 36 revised — fullscreen hero deeper + bottom composition QA.
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
  'wave-3b-travel-fullscreen-hero-deeper-bottom-composition-pack-36-revised'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const PACK_35_BEFORE_FULLSCREEN = {
  heroTargetPx: 358,
  bridgePx: -40,
  objectPositionY: '35%',
  coverScale: 0.845,
};

const PACK_36_AFTER_FULLSCREEN = {
  heroTargetPx: 414,
  bridgePx: -76,
  objectPositionY: '31%',
  coverScale: 0.815,
};

const NORMAL_WEB_GUARD = {
  heroTargetPx: 410,
  titleFontSize: '74px',
  titleLineHeight: '70px',
  titleMaxWidth: '820px',
  bridgePx: -34,
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  const locEn = page.getByText('Continue without location', { exact: true });
  if (await locEn.isVisible({ timeout: 1500 }).catch(() => false)) await locEn.click();
  await page.waitForTimeout(500);
}

async function resolveTravelLocationGate(page) {
  const secondaryVi = page.getByText('Tiếp tục không dùng vị trí', { exact: true });
  const secondaryEn = page.getByText('Continue without location', { exact: true });
  if (await secondaryVi.isVisible({ timeout: 3000 }).catch(() => false)) {
    await secondaryVi.click();
    await page.waitForTimeout(600);
    return;
  }
  if (await secondaryEn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await secondaryEn.click();
    await page.waitForTimeout(600);
  }
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack36=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}

async function collectMetrics(page, mode) {
  return page.evaluate(
    ({ modeLabel, beforeFs, afterFs, normalGuard }) => {
      const title = document.querySelector('[data-testid="travel-hero-title"]');
      const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const heroImg = hero?.querySelector('img, [style*="object-position"]');
      const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
      const situations = document.querySelector('[data-testid="travel-situations-section"]');
      const bridge = document.querySelector('[class*="utilityBridge"]');
      const bg = document.querySelector('[data-testid="travel-situation-network-bg-image"]');
      const ts = title ? getComputedStyle(title) : null;
      const tr = title?.getBoundingClientRect();
      const hr = hero?.getBoundingClientRect();
      const qh = quickHelp?.getBoundingClientRect();
      const si = situations?.getBoundingClientRect();
      const gap = qh && si ? Math.round(si.top - (qh.top + qh.height)) : null;
      const imgStyle = heroImg ? getComputedStyle(heroImg) : null;
      return {
        mode: modeLabel,
        title: {
          fontSize: ts?.fontSize ?? null,
          lineHeight: ts?.lineHeight ?? null,
          maxWidth: ts?.maxWidth ?? null,
          width: tr ? Math.round(tr.width) : null,
        },
        heroHeightPx: hr ? Math.round(hr.height) : null,
        heroObjectPosition: imgStyle?.objectPosition ?? null,
        quickHelpToSituationsGapPx: gap,
        bridgeMarginTop: bridge ? getComputedStyle(bridge).marginTop : null,
        situationsBgPresent: Boolean(bg),
        constants: { beforeFs, afterFs, normalGuard },
      };
    },
    {
      modeLabel: mode,
      beforeFs: PACK_35_BEFORE_FULLSCREEN,
      afterFs: PACK_36_AFTER_FULLSCREEN,
      normalGuard: NORMAL_WEB_GUARD,
    }
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
        height: sitBox.y + sitBox.height - heroBox.y + 20,
      },
    });
  }
}

async function screenshotHeroCrop(page, outName) {
  const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
  await hero.waitFor({ state: 'visible' });
  const box = await hero.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: { x: 0, y: Math.max(0, box.y - 4), width: vw, height: box.height + 8 },
    });
  }
}

async function screenshotGap(page, outName) {
  const qh = page.locator('[data-testid="travel-flagship-cards-row"]');
  const si = page.locator('[data-testid="travel-situations-section"]');
  await qh.waitFor({ state: 'visible' });
  const qhBox = await qh.boundingBox();
  const siBox = await si.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (qhBox && siBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, qhBox.y - 12),
        width: vw,
        height: siBox.y + siBox.height - qhBox.y + 16,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = {
  pack: '36-revised',
  fullscreenBefore: PACK_35_BEFORE_FULLSCREEN,
  fullscreenAfter: PACK_36_AFTER_FULLSCREEN,
  normalWebGuard: NORMAL_WEB_GUARD,
  captures: {},
};

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(900);
proof.captures.fullscreen1366 = await collectMetrics(page1366, 'fullscreen-1366');
await screenshotOpening(page1366, 'travel-1366x768-fullscreen-opening.png');
await screenshotHeroCrop(page1366, 'travel-1366x768-fullscreen-hero-crop-closeup.png');
await screenshotGap(page1366, 'travel-1366x768-fullscreen-quickhelp-situations-gap.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(500);

proof.captures.normal1366 = await collectMetrics(page1366, 'normal-1366');
await screenshotOpening(page1366, 'travel-1366x768-normal-sanity.png');

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures.tablet1024 = await collectMetrics(page1024, 'tablet-1024');
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-sanity.png'),
  fullPage: true,
});

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
proof.captures.mobile390 = await collectMetrics(page390, 'mobile-390');
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 36 revised evidence → ${OUT_DIR}`);
