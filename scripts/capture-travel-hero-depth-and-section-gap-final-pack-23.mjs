/**
 * Pack 23 — hero depth + Quick Help → Situations gap QA.
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
  'wave-3b-travel-hero-depth-and-section-gap-final-pack-23'
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
  await page.goto(`${BASE}/travel?pack23=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

const SHOTS = [
  {
    name: 'travel-1366x768-normal-hero-quickhelp-situations',
    width: 1366,
    height: 768,
    clipFrom: 'travel-dynamic-hero-stage',
    clipTo: 'travel-utility-grid',
  },
  {
    name: 'travel-1366x768-normal-hero-crop-closeup',
    width: 1366,
    height: 768,
    clip: 'travel-dynamic-hero-stage',
    pad: 8,
  },
  {
    name: 'travel-1366x768-fullscreen-hero-quickhelp-situations',
    width: 1366,
    height: 768,
    fullscreen: true,
    clipFrom: 'travel-dynamic-hero-stage',
    clipTo: 'travel-utility-grid',
  },
  { name: 'travel-1024x768-sanity', width: 1024, height: 768, fullPage: true },
  { name: 'travel-390x844-sanity', width: 390, height: 844, fullPage: true },
];

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { normal: null, fullscreen: null };

for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await openTravel(page);
  if (shot.fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(600);
    proof.fullscreen = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const heroImg = hero?.querySelector('img');
      const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
      const situations = document.querySelector('[data-testid="travel-utility-grid"]');
      const hr = hero?.getBoundingClientRect();
      const qr = quickHelp?.getBoundingClientRect();
      const sr = situations?.getBoundingClientRect();
      const hs = heroImg ? getComputedStyle(heroImg) : null;
      return {
        fullscreen: Boolean(document.fullscreenElement),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        heroHeight: hr ? Math.round(hr.height) : null,
        heroImageObjectPosition: hs?.objectPosition,
        quickHelpToSituationsGapPx: qr && sr ? Math.round(sr.top - qr.bottom) : null,
      };
    });
  } else if (shot.width === 1366 && shot.height === 768 && !shot.fullPage) {
    proof.normal = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const heroImg = hero?.querySelector('img');
      const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
      const situations = document.querySelector('[data-testid="travel-utility-grid"]');
      const hr = hero?.getBoundingClientRect();
      const qr = quickHelp?.getBoundingClientRect();
      const sr = situations?.getBoundingClientRect();
      const hs = heroImg ? getComputedStyle(heroImg) : null;
      return {
        fullscreen: Boolean(document.fullscreenElement),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        heroHeight: hr ? Math.round(hr.height) : null,
        heroImageObjectPosition: hs?.objectPosition,
        quickHelpToSituationsGapPx: qr && sr ? Math.round(sr.top - qr.bottom) : null,
      };
    });
  }
  let clip;
  if (shot.clipFrom && shot.clipTo) {
    const b1 = await page.locator(`[data-testid="${shot.clipFrom}"]`).boundingBox();
    const b2 = await page.locator(`[data-testid="${shot.clipTo}"]`).boundingBox();
    if (b1 && b2) {
      clip = {
        x: 0,
        y: Math.max(0, b1.y - 8),
        width: shot.width,
        height: Math.max(b1.y + b1.height, b2.y + b2.height) - Math.max(0, b1.y - 8) + 12,
      };
    }
  } else if (shot.clip) {
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
  await page.close();
}

await browser.close();
await writeFile(path.join(OUT_DIR, 'computed-layout-proof-pack-23.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 23 evidence → ${OUT_DIR}`);
