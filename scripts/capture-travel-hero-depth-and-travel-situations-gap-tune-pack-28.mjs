/**
 * Pack 28 — Hero depth + Quick Help → Travel Situations gap tune QA.
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
  'wave-3b-travel-hero-depth-and-travel-situations-gap-tune-pack-28'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const PACK27_BEFORE = {
  heroTargetNormalPx: 378,
  heroTargetFullscreenPx: 368,
  objectPositionYNormal: '31%',
  objectPositionYFullscreen: '33%',
  coverScaleNormal: 0.87,
  quickHelpToSituationsBridgeNormalPx: -22,
  flagshipRowPaddingBottomPx: 6,
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack28=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-dynamic-hero-stage"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function collectOpeningProof(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const heroImg = hero?.querySelector('img');
    const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const situations = document.querySelector('[data-testid="travel-situations-section"]')
      ?? document.querySelector('[data-testid="travel-utility-grid"]');
    const hr = hero?.getBoundingClientRect();
    const qr = quickHelp?.getBoundingClientRect();
    const sr = situations?.getBoundingClientRect();
    const hs = heroImg ? getComputedStyle(heroImg) : null;
    return {
      fullscreen: Boolean(document.fullscreenElement),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      heroHeight: hr ? Math.round(hr.height) : null,
      heroImageObjectPosition: hs?.objectPosition ?? null,
      heroImageWidth: hs?.width ?? null,
      quickHelpBottom: qr ? Math.round(qr.bottom) : null,
      situationsTop: sr ? Math.round(sr.top) : null,
      quickHelpToSituationsGapPx: qr && sr ? Math.round(sr.top - qr.bottom) : null,
    };
  });
}

async function clipBetween(page, fromTestId, toTestId, outPath, pad = 8) {
  const from = page.locator(`[data-testid="${fromTestId}"]`);
  const to = page.locator(`[data-testid="${toTestId}"]`);
  await from.scrollIntoViewIfNeeded();
  const fb = await from.boundingBox();
  const tb = await to.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (fb && tb) {
    await page.screenshot({
      path: outPath,
      clip: {
        x: 0,
        y: Math.max(0, fb.y - pad),
        width: vw,
        height: tb.y + tb.height - fb.y + pad,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 28, before: PACK27_BEFORE, after: {} };

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1366);
proof.after.normal = await collectOpeningProof(page1366);
await clipBetween(
  page1366,
  'travel-dynamic-hero-stage',
  'travel-utility-grid',
  path.join(OUT_DIR, 'travel-1366x768-normal-full-opening.png')
);
await page1366.locator('[data-testid="travel-dynamic-hero-stage"]').screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-normal-hero-crop-closeup.png'),
});
const qh = page1366.locator('[data-testid="travel-flagship-cards-row"]');
const sit = page1366.locator('[data-testid="travel-situations-section"]');
await qh.scrollIntoViewIfNeeded();
const qbox = await qh.boundingBox();
const sbox = await sit.boundingBox();
if (qbox && sbox) {
  await page1366.screenshot({
    path: path.join(OUT_DIR, 'travel-1366x768-normal-quickhelp-situations-gap.png'),
    clip: {
      x: Math.max(0, qbox.x - 24),
      y: Math.max(0, qbox.y - 12),
      width: Math.min(1366, qbox.width + 48),
      height: sbox.y + sbox.height - qbox.y + 16,
    },
  });
}
await page1366.close();

const fsPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await fsPage.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(fsPage);
await fsPage.evaluate(async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
});
await fsPage.waitForTimeout(600);
proof.after.fullscreen = await collectOpeningProof(fsPage);
await clipBetween(
  fsPage,
  'travel-dynamic-hero-stage',
  'travel-utility-grid',
  path.join(OUT_DIR, 'travel-1366x768-fullscreen-full-opening.png')
);
await fsPage.close();

for (const shot of [
  { name: 'travel-1024x768-sanity', width: 1024, height: 768 },
  { name: 'travel-390x844-sanity', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await openTravel(page);
  proof.after[shot.name] = await collectOpeningProof(page);
  await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();
proof.after.constants = {
  heroTargetNormalPx: 410,
  heroTargetFullscreenPx: 376,
  objectPositionYNormal: '34%',
  objectPositionYFullscreen: '35%',
  coverScaleNormal: 0.85,
  quickHelpToSituationsBridgeNormalPx: -34,
  flagshipRowPaddingBottomPx: 0,
};
proof.capturedAt = new Date().toISOString();
await writeFile(path.join(OUT_DIR, 'computed-proof-pack-28.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 28 evidence → ${OUT_DIR}`);
