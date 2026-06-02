/**
 * Pack 43A — Travel Situations card clarity polish QA.
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
  'wave-3b-travel-situations-card-clarity-polish-pack-43a'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const BEFORE = {
  sectionReadabilityVeil: ['rgba(4, 10, 18, 0.20)', 'rgba(4, 10, 18, 0.12)', 'rgba(4, 10, 18, 0.16)'],
  tileBackgroundAlpha: 0.022,
  tileBorderAlphaIdle: 0.32,
  tileBorderAlphaActive: 0.42,
  tileGlowAlphaIdle: 0.075,
  tileGlowAlphaActive: 0.12,
  tileEdgeGlowBorderAlpha: 0.12,
  tileLabelColor: 'rgba(236, 246, 255, 0.96)',
  tileIconCapsuleBg: 'rgba(4, 10, 18, 0.28)',
};

const AFTER = {
  sectionReadabilityVeil: ['rgba(4, 10, 18, 0.16)', 'rgba(4, 10, 18, 0.09)', 'rgba(4, 10, 18, 0.13)'],
  tileBackgroundAlpha: 0.03,
  tileBorderAlphaIdle: 0.38,
  tileBorderAlphaActive: 0.46,
  tileGlowAlphaIdle: 0.095,
  tileGlowAlphaActive: 0.14,
  tileEdgeGlowBorderAlpha: 0.18,
  tileLabelColor: 'rgba(240, 249, 255, 1)',
  tileIconCapsuleBg: 'rgba(4, 10, 18, 0.22)',
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
  await page.goto(`${BASE}/travel?pack43a=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-situations-section"]', { timeout: 180_000 });
}

async function collectSituationsMetrics(page, mode) {
  return page.evaluate(({ modeLabel, before, after }) => {
    const section = document.querySelector('[data-testid="travel-situations-section"]');
    const firstCard = document.querySelector('[data-testid^="travel-utility-"]');
    const title = firstCard?.querySelector('span,div,p');
    const iconCapsule = firstCard?.querySelector('[class*="IconCapsule"], [class*="iconCapsule"]');
    const edgeGlow = section?.querySelector('[class*="situationGlassGridEdgeGlow"]');
    const veil = document.querySelector('[data-testid="travel-situation-section-readability-veil"]');
    const cardCs = firstCard ? getComputedStyle(firstCard) : null;
    const titleCs = title ? getComputedStyle(title) : null;
    const iconCs = iconCapsule ? getComputedStyle(iconCapsule) : null;
    const edgeCs = edgeGlow ? getComputedStyle(edgeGlow) : null;
    const veilCs = veil ? getComputedStyle(veil) : null;
    return {
      mode: modeLabel,
      computed: {
        cardBackground: cardCs?.backgroundColor ?? null,
        cardBorder: cardCs?.borderColor ?? null,
        labelColor: titleCs?.color ?? null,
        iconCapsuleBg: iconCs?.backgroundColor ?? null,
        edgeGlowBorder: edgeCs?.borderColor ?? null,
        veilBackgroundImage: veilCs?.backgroundImage ?? null,
      },
      refs: { before, after },
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
const proof = { pack: '43A', before: BEFORE, after: AFTER, captures: {} };

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
proof.captures.fullscreen1366 = await collectSituationsMetrics(page1366, 'fullscreen-1366');
await screenshotOpening(page1366, 'travel-1366x768-fullscreen-opening.png');
await screenshotSituations(page1366, 'travel-1366x768-fullscreen-situations-closeup.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(500);

proof.captures.normal1366 = await collectSituationsMetrics(page1366, 'normal-1366');
await screenshotSituations(page1366, 'travel-1366x768-normal-situations-sanity.png');

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures.tablet1024 = await collectSituationsMetrics(page1024, 'tablet-1024');
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-sanity.png'),
  fullPage: true,
});

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
proof.captures.mobile390 = await collectSituationsMetrics(page390, 'mobile-390');
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 43A evidence → ${OUT_DIR}`);
