/**
 * Pack 22 — Quick Help single-frame full-bleed QA.
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
  'wave-3b-travel-quickhelp-single-frame-fullbleed-pack-22'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack22=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

const SHOTS = [
  {
    name: 'travel-1366x768-normal-quickhelp-row',
    width: 1366,
    height: 768,
    clip: 'travel-flagship-cards-row',
    pad: 16,
  },
  { name: 'travel-1366x768-fullscreen-quickhelp-row', width: 1366, height: 768, fullscreen: true, clip: 'travel-flagship-cards-row', pad: 16 },
  { name: 'travel-1024x768-sanity', width: 1024, height: 768, fullPage: true },
  { name: 'travel-390x844-sanity', width: 390, height: 844, fullPage: true },
];

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

const proof = { default: {}, hover: {}, capturedAt: null };

const normalPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await normalPage.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(normalPage);
proof.default.airport = await normalPage.evaluate((id) => {
  const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
  const tile = document.querySelector(`[data-testid="travel-flagship-${id}"]`);
  const art = tile?.firstElementChild;
  const img = art?.querySelector('img');
  const cs = cell ? getComputedStyle(cell) : null;
  const ts = tile ? getComputedStyle(tile) : null;
  const as = art ? getComputedStyle(art) : null;
  const is = img ? getComputedStyle(img) : null;
  const cr = cell?.getBoundingClientRect();
  const ir = img?.getBoundingClientRect();
  return {
    outerFrameElement: `[data-testid="travel-quick-help-cell-${id}"]`,
    outerBorderRadius: cs?.borderRadius,
    outerOverflow: cs?.overflow,
    outerPadding: cs?.padding,
    outerTransform: cs?.transform,
    outerTransition: cs?.transition,
    outerBoxShadow: cs?.boxShadow?.slice(0, 140),
    innerTileBorderWidth: ts?.borderWidth,
    innerTileBorderRadius: ts?.borderRadius,
    innerTileBoxShadow: ts?.boxShadow,
    artworkClipBorderRadius: as?.borderRadius,
    imagePosition: is?.position,
    imageObjectFit: is?.objectFit,
    cellHeight: cr ? Math.round(cr.height) : null,
    imageBleed:
      cr && ir ? Math.round(ir.left - cr.left) <= 1 && Math.round(cr.right - ir.right) <= 1 : null,
  };
}, 'airport');

for (const shot of SHOTS) {
  const page = shot.width === 1366 && !shot.fullscreen ? normalPage : await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  if (page !== normalPage) {
    await page.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('@app_language', 'vi');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    await openTravel(page);
  }
  if (shot.fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(600);
  }
  let clip;
  if (shot.clip) {
    const box = await page.locator(`[data-testid="${shot.clip}"]`).boundingBox();
    if (box) {
      const pad = shot.pad ?? 12;
      clip = {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: Math.min(shot.width, box.width + pad * 2),
        height: box.height + pad * 2,
      };
    }
  }
  await page.screenshot({
    path: path.join(OUT_DIR, `${shot.name}.png`),
    fullPage: shot.fullPage ?? !clip,
    clip,
  });
  if (page !== normalPage) await page.close();
}

async function hoverShot(page, id, filename) {
  const cell = page.locator(`[data-testid="travel-quick-help-cell-${id}"]`);
  await cell.hover();
  await page.waitForTimeout(320);
  proof.hover[id] = await page.evaluate((cardId) => {
    const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${cardId}"]`);
    const tile = document.querySelector(`[data-testid="travel-flagship-${cardId}"]`);
    const art = tile?.firstElementChild;
    const img = art?.querySelector('img');
    const cs = cell ? getComputedStyle(cell) : null;
    const ts = tile ? getComputedStyle(tile) : null;
    const as = art ? getComputedStyle(art) : null;
    const is = img ? getComputedStyle(img) : null;
    const cr = cell?.getBoundingClientRect();
    const ir = img?.getBoundingClientRect();
    return {
      outerFrameElement: `[data-testid="travel-quick-help-cell-${cardId}"]`,
      outerBorderRadius: cs?.borderRadius,
      outerOverflow: cs?.overflow,
      outerPadding: cs?.padding,
      outerTransform: cs?.transform,
      outerTransition: cs?.transition,
      outerBoxShadow: cs?.boxShadow?.slice(0, 140),
      innerTileBorderWidth: ts?.borderWidth,
      innerTileBorderRadius: ts?.borderRadius,
      innerTileBoxShadow: ts?.boxShadow,
      artworkClipBorderRadius: as?.borderRadius,
      imagePosition: is?.position,
      imageObjectFit: is?.objectFit,
      cellHeight: cr ? Math.round(cr.height) : null,
      imageBleed:
        cr && ir ? Math.round(ir.left - cr.left) <= 1 && Math.round(cr.right - ir.right) <= 1 : null,
    };
  }, id);
  const box = await page.locator('[data-testid="travel-flagship-cards-row"]').boundingBox();
  await page.screenshot({
    path: path.join(OUT_DIR, filename),
    clip: box
      ? {
          x: Math.max(0, box.x - 16),
          y: Math.max(0, box.y - 16),
          width: Math.min(1366, box.width + 32),
          height: box.height + 32,
        }
      : undefined,
  });
}

await hoverShot(normalPage, 'airport', 'travel-1366x768-normal-quickhelp-hover-airport.png');
await hoverShot(normalPage, 'translation', 'travel-1366x768-normal-quickhelp-hover-translation.png');

await normalPage.close();
await browser.close();

proof.capturedAt = new Date().toISOString();
await writeFile(path.join(OUT_DIR, 'computed-style-proof-pack-22.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 22 evidence → ${OUT_DIR}`);
