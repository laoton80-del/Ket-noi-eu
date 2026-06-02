/**
 * Pack 20 — forced editorial title + Quick Help single-frame hover QA.
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
  'wave-3b-travel-title-force-editorial-and-quickhelp-single-card-hover-pack-20'
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
  await page.goto(`${BASE}/travel?pack20=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

function browserCollectProof() {
  const title = document.querySelector('[data-testid="travel-hero-title"]');
  const stack =
    title?.closest('[data-testid="travel-hero-text-stack"]') ??
    title?.parentElement?.parentElement;
  const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
  const ts = title ? getComputedStyle(title) : null;
  const ss = stack ? getComputedStyle(stack) : null;
  const tr = title?.getBoundingClientRect();
  const sr = stack?.getBoundingClientRect();
  const hr = hero?.getBoundingClientRect();
  const cards = ['airport', 'translation', 'taxi', 'emergency'].map((id) => {
    const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
    const tile = document.querySelector(`[data-testid="travel-flagship-${id}"]`);
    const cs = cell ? getComputedStyle(cell) : null;
    const ts2 = tile ? getComputedStyle(tile) : null;
    const cr = cell?.getBoundingClientRect();
    return {
      id,
      cell: {
        boxShadow: cs?.boxShadow,
        transform: cs?.transform,
        overflow: cs?.overflow,
        height: cr ? Math.round(cr.height) : null,
      },
      innerTile: {
        borderTopWidth: ts2?.borderTopWidth,
        borderBottomWidth: ts2?.borderBottomWidth,
        boxShadow: ts2?.boxShadow,
        backgroundColor: ts2?.backgroundColor,
      },
    };
  });
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    fullscreen: Boolean(document.fullscreenElement),
    title: {
      fontSize: ts?.fontSize,
      lineHeight: ts?.lineHeight,
      width: tr ? Math.round(tr.width) : null,
      height: tr ? Math.round(tr.height) : null,
    },
    textStack: {
      width: sr ? Math.round(sr.width) : null,
      maxWidth: ss?.maxWidth,
    },
    heroHeight: hr ? Math.round(hr.height) : null,
    titleToHeroRatio: hr && tr ? Math.round((tr.width / hr.width) * 1000) / 10 : null,
    cards,
    capturedAt: new Date().toISOString(),
  };
}

const SHOTS = [
  { name: 'travel-1366x768-normal-full', width: 1366, height: 768, fullPage: true },
  {
    name: 'travel-1366x768-normal-title-closeup',
    width: 1366,
    height: 768,
    clip: 'travel-hero-title',
    pad: 48,
  },
  {
    name: 'travel-1366x768-normal-quickhelp-closeup',
    width: 1366,
    height: 768,
    clip: 'travel-flagship-cards-row',
    pad: 16,
  },
  {
    name: 'travel-1366x768-normal-hero-quickhelp-closeup',
    width: 1366,
    height: 768,
    clip: 'travel-dynamic-hero-stage',
    clip2: 'travel-flagship-cards-row',
  },
  { name: 'travel-1366x768-fullscreen-full', width: 1366, height: 768, fullscreen: true, fullPage: true },
  {
    name: 'travel-1366x768-fullscreen-quickhelp-situations',
    width: 1366,
    height: 768,
    fullscreen: true,
    fullPage: true,
  },
  { name: 'travel-1024x768-sanity', width: 1024, height: 768, fullPage: true },
  { name: 'travel-390x844-quickhelp-sanity', width: 390, height: 844, fullPage: true },
];

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

const proofPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await proofPage.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(proofPage);
const proofNormal = await proofPage.evaluate(browserCollectProof);

const airportCell = proofPage.locator('[data-testid="travel-quick-help-cell-airport"]');
await airportCell.hover();
await proofPage.waitForTimeout(280);
const proofHover = await proofPage.evaluate(() => {
  const cell = document.querySelector('[data-testid="travel-quick-help-cell-airport"]');
  const cs = cell ? getComputedStyle(cell) : null;
  return {
    transform: cs?.transform,
    boxShadow: cs?.boxShadow?.slice(0, 120),
  };
});
await proofPage.close();

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
  }
  if (shot.clip && shot.clip2) {
    const h1 = await page.locator(`[data-testid="${shot.clip}"]`).boundingBox();
    const h2 = await page.locator(`[data-testid="${shot.clip2}"]`).boundingBox();
    if (h1 && h2) {
      const y = Math.min(h1.y, h2.y) - 8;
      const bottom = Math.max(h1.y + h1.height, h2.y + h2.height) + 12;
      await page.screenshot({
        path: path.join(OUT_DIR, `${shot.name}.png`),
        clip: { x: 0, y: Math.max(0, y), width: shot.width, height: bottom - y },
      });
      await page.close();
      continue;
    }
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
  await page.close();
}

await browser.close();
const proof = { normal: proofNormal, quickHelpHoverAirport: proofHover };
await writeFile(path.join(OUT_DIR, 'computed-style-proof-pack-20.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 20 evidence → ${OUT_DIR}`);
