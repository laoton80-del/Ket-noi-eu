/**
 * Pack 44 — Travel Situations tile pop + rim polish QA.
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
  'wave-3b-travel-situations-tile-pop-and-rim-polish-pack-44'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const BEFORE = {
  backgroundOpacity: { fullscreen: 0.72, web1366: 0.76, web1024: 0.74, mobile: 0.68 },
  tileBodyAlpha: 0.044,
  borderWidth: 1,
  borderAlpha: { idle: 0.38, active: 0.46 },
  labelColor: 'rgba(244, 251, 255, 1)',
  iconCapsuleBorderWidth: 1,
  iconCapsuleBg: 'rgba(4, 10, 18, 0.18)',
};

const AFTER = {
  backgroundOpacity: { fullscreen: 0.16, web1366: 0.18, web1024: 0.17, mobile: 0.14 },
  tileBodyAlpha: 0.58,
  borderWidth: 1.35,
  borderAlpha: { idle: 0.78, active: 0.86 },
  labelColor: 'rgba(244, 251, 255, 1)',
  iconCapsuleBorderWidth: 1.2,
  iconCapsuleBg: 'rgba(4, 10, 18, 0.18)',
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  const locEn = page.getByText('Continue without location', { exact: true });
  if (await locEn.isVisible({ timeout: 1500 }).catch(() => false)) await locEn.click();
  await page.waitForTimeout(450);
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
  await page.goto(`${BASE}/travel?pack44=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-situations-section"]', { timeout: 180_000 });
}

async function collectProof(page, mode) {
  return page.evaluate(({ modeLabel, before, after }) => {
    const veil = document.querySelector('[data-testid="travel-situation-section-readability-veil"]');
    const img = document.querySelector('[data-testid="travel-situation-network-bg-image"]');
    const section = document.querySelector('[data-testid="travel-situations-section"]');
    const card = document.querySelector('[data-testid^="travel-utility-"]');
    const title = card?.querySelector('span,div,p');
    const iconCapsule = card?.querySelector('[class*="IconCapsule"], [class*="iconCapsule"]');
    const csImg = img ? getComputedStyle(img) : null;
    const csCard = card ? getComputedStyle(card) : null;
    const csTitle = title ? getComputedStyle(title) : null;
    const csCapsule = iconCapsule ? getComputedStyle(iconCapsule) : null;
    const csVeil = veil ? getComputedStyle(veil) : null;
    return {
      mode: modeLabel,
      computed: {
        bgOpacity: csImg?.opacity ?? null,
        veilGradient: csVeil?.backgroundImage ?? null,
        cardBg: csCard?.backgroundColor ?? null,
        cardBorderColor: csCard?.borderColor ?? null,
        cardBorderWidth: csCard?.borderTopWidth ?? null,
        titleColor: csTitle?.color ?? null,
        iconCapsuleBg: csCapsule?.backgroundColor ?? null,
        iconCapsuleBorderWidth: csCapsule?.borderTopWidth ?? null,
      },
      refs: { before, after },
      sectionPresent: Boolean(section),
    };
  }, { modeLabel: mode, before: BEFORE, after: AFTER });
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

async function screenshotSituations(page, outName) {
  const situations = page.locator('[data-testid="travel-situations-section"]');
  await situations.waitFor({ state: 'visible' });
  const box = await situations.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, box.y - 10),
        width: vw,
        height: box.height + 20,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 44, before: BEFORE, after: AFTER, captures: {} };

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'en');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);
await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(900);
proof.captures.fullscreen1366 = await collectProof(page1366, 'fullscreen-1366');
await screenshotOpening(page1366, 'travel-1366x768-fullscreen-opening.png');
await screenshotSituations(page1366, 'travel-1366x768-fullscreen-situations-closeup.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(500);
proof.captures.normal1366 = await collectProof(page1366, 'normal-1366');
await screenshotSituations(page1366, 'travel-1366x768-normal-situations-closeup.png');

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures.tablet1024 = await collectProof(page1024, 'tablet-1024');
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-sanity.png'),
  fullPage: true,
});

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
proof.captures.mobile390 = await collectProof(page390, 'mobile-390');
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 44 evidence → ${OUT_DIR}`);
