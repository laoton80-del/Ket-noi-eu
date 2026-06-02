/**
 * Pack 42A — fullscreen stack reset QA.
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
  'wave-3b-travel-fullscreen-stack-reset-hero-quickhelp-situations-pack-42a'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const BEFORE = {
  fullscreenHeroTargetPx: 386,
  fullscreenHeroToCardGapPx: 0,
  fullscreenHeroAirBonusPx: -14,
  fullscreenUtilityBridgePx: -76,
  fullscreenTitle: { fontSizePx: 54, lineHeightPx: 58, maxWidthPx: 680 },
  normalHeroTargetPx: 410,
  normalUtilityBridgePx: -34,
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
  await page.goto(`${BASE}/travel?pack42a=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}

async function collectMetrics(page, mode) {
  return page.evaluate(({ modeLabel, before }) => {
    const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const situations = document.querySelector('[data-testid="travel-situations-section"]');
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const utilityBridge = [...document.querySelectorAll('div')].find((n) =>
      [...(n.classList ?? [])].some((k) => k.includes('utilityBridge'))
    );

    const hr = hero?.getBoundingClientRect();
    const qr = quickHelp?.getBoundingClientRect();
    const sr = situations?.getBoundingClientRect();
    const tr = title?.getBoundingClientRect();
    const ts = title ? getComputedStyle(title) : null;
    const gapHeroToQuickHelp = hr && qr ? Math.round(qr.top - (hr.top + hr.height)) : null;
    const gapQuickHelpToSituations = qr && sr ? Math.round(sr.top - (qr.top + qr.height)) : null;
    const titleLineHeightPx = ts?.lineHeight ? Math.round(parseFloat(ts.lineHeight)) : null;
    const titleLineCount =
      tr && titleLineHeightPx ? Math.max(1, Math.round(tr.height / titleLineHeightPx)) : null;
    return {
      mode: modeLabel,
      heroHeightPx: hr ? Math.round(hr.height) : null,
      heroToQuickHelpGapPx: gapHeroToQuickHelp,
      quickHelpToSituationsGapPx: gapQuickHelpToSituations,
      title: {
        fontSize: ts?.fontSize ?? null,
        lineHeight: ts?.lineHeight ?? null,
        maxWidth: ts?.maxWidth ?? null,
        renderedWidthPx: tr ? Math.round(tr.width) : null,
        lineCount: titleLineCount,
      },
      utilityBridgeMarginTop: utilityBridge ? getComputedStyle(utilityBridge).marginTop : null,
      beforeReference: before,
    };
  }, { modeLabel: mode, before: BEFORE });
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

async function screenshotGap(page, outName) {
  const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
  const qh = page.locator('[data-testid="travel-flagship-cards-row"]');
  const si = page.locator('[data-testid="travel-situations-section"]');
  await hero.waitFor({ state: 'visible' });
  const hb = await hero.boundingBox();
  const qb = await qh.boundingBox();
  const sb = await si.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (hb && qb && sb) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, hb.y + hb.height - 40),
        width: vw,
        height: sb.y + sb.height - (hb.y + hb.height - 40) + 10,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: '42A', before: BEFORE, captures: {} };

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'en');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);
proof.captures.normal1366 = await collectMetrics(page1366, 'normal-1366');
await screenshotOpening(page1366, 'travel-1366x768-normal-opening-sanity.png');

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(900);
proof.captures.fullscreen1366 = await collectMetrics(page1366, 'fullscreen-1366');
await screenshotOpening(page1366, 'travel-1366x768-fullscreen-opening.png');
await screenshotGap(page1366, 'travel-1366x768-fullscreen-hero-quickhelp-gap-closeup.png');
await screenshotGap(page1366, 'travel-1366x768-fullscreen-quickhelp-situations-gap-closeup.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

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
console.log(`Pack 42A evidence → ${OUT_DIR}`);
