/**
 * Pack 19 — Quick Help + hero title true render fix QA.
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
  'wave-3b-travel-quick-help-and-hero-title-true-render-fix-pack-19'
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
  await page.goto(`${BASE}/travel?pack19=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

function browserCollectProof() {
  const title = document.querySelector('[data-testid="travel-hero-title"]');
  const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
  const ts = title ? getComputedStyle(title) : null;
  const tr = title?.getBoundingClientRect();
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
        overflow: cs?.overflow,
        height: cr ? Math.round(cr.height) : null,
        bottom: cr ? Math.round(cr.bottom) : null,
      },
      innerTile: {
        borderTopWidth: ts2?.borderTopWidth,
        borderBottomWidth: ts2?.borderBottomWidth,
        boxShadow: ts2?.boxShadow?.slice(0, 80),
      },
    };
  });
  return {
    viewportWidth: window.innerWidth,
    title: {
      fontSize: ts?.fontSize,
      lineHeight: ts?.lineHeight,
      width: tr ? Math.round(tr.width) : null,
      height: tr ? Math.round(tr.height) : null,
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
  { name: 'travel-390x844-top-to-quickhelp', width: 390, height: 844, scrollY: 0, fullPage: true },
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
const proof = await proofPage.evaluate(browserCollectProof);
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
  if (shot.scrollY != null) {
    await page.evaluate((y) => window.scrollTo(0, y), shot.scrollY);
    await page.waitForTimeout(400);
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
      clip = {
        x: Math.max(0, box.x - 8),
        y: Math.max(0, box.y - 8),
        width: Math.min(shot.width, box.width + 16),
        height: box.height + 20,
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
await writeFile(path.join(OUT_DIR, 'computed-style-proof-pack-19.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 19 evidence → ${OUT_DIR}`);
