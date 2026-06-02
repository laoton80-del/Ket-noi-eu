/**
 * Pack 33B — Travel fullscreen-only title and spacing fix QA.
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
  'wave-3b-travel-fullscreen-only-title-and-spacing-fix-pack-33b'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const BEFORE = {
  fullscreenTitle: { fontSize: '72px', lineHeight: '72px', maxWidth: '940px' },
  normalTitle: { fontSize: '74px', lineHeight: '70px', maxWidth: '820px' },
  fullscreenHeroTargetPx: 376,
  fullscreenBridgePx: -28,
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack33b=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function collectMetrics(page, mode) {
  return page.evaluate(
    ({ modeLabel, before }) => {
      const title = document.querySelector('[data-testid="travel-hero-title"]');
      const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
      const situations = document.querySelector('[data-testid="travel-situations-section"]');
      const bridge = document.querySelector('[class*="utilityBridge"]');
      const bg = document.querySelector('[data-testid="travel-situation-network-bg-image"]');
      const ts = title ? getComputedStyle(title) : null;
      const tr = title?.getBoundingClientRect();
      const hr = hero?.getBoundingClientRect();
      const qh = quickHelp?.getBoundingClientRect();
      const si = situations?.getBoundingClientRect();
      const gap =
        qh && si ? Math.round(si.top - (qh.top + qh.height)) : null;
      return {
        mode: modeLabel,
        title: {
          fontSize: ts?.fontSize ?? null,
          lineHeight: ts?.lineHeight ?? null,
          maxWidth: ts?.maxWidth ?? null,
          width: tr ? Math.round(tr.width) : null,
        },
        heroHeightPx: hr ? Math.round(hr.height) : null,
        quickHelpToSituationsGapPx: gap,
        bridgeMarginTop: bridge ? getComputedStyle(bridge).marginTop : null,
        situationsBgPresent: Boolean(bg),
        beforeReference: before,
      };
    },
    { modeLabel: mode, before: BEFORE }
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
        y: Math.max(0, box.y - 24),
        width: vw,
        height: box.height + 120,
      },
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
const proof = { pack: '33B', before: BEFORE, captures: {} };

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);
proof.captures.normal1366 = await collectMetrics(page1366, 'normal-1366');
await screenshotOpening(page1366, 'travel-1366x768-normal-sanity.png');

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(800);
proof.captures.fullscreen1366 = await collectMetrics(page1366, 'fullscreen-1366');
await screenshotOpening(page1366, 'travel-1366x768-fullscreen-opening.png');
await screenshotTitle(page1366, 'travel-1366x768-fullscreen-title-closeup.png');
await screenshotGap(page1366, 'travel-1366x768-fullscreen-quickhelp-situations-gap.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures.normal1024 = await collectMetrics(page1024, 'normal-1024');
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
console.log(`Pack 33B evidence → ${OUT_DIR}`);
