/**
 * Pack 18 — Quick Help border balance QA.
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
  'wave-3b-travel-quick-help-border-balance-fix-pack-18'
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
  await page.goto(`${BASE}/travel?pack18=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-flagship-cards-row"]', { timeout: 120_000 });
  await dismissGates(page);
}

function browserCollectProof(payload) {
  const { bust, port } = payload;
  const row = document.querySelector('[data-testid="travel-flagship-cards-row"]');
  const rowRect = row?.getBoundingClientRect();
  const cards = ['airport', 'translation', 'taxi', 'emergency'].map((id) => {
    const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
    const tile = document.querySelector(`[data-testid="travel-flagship-${id}"]`);
    const cs = cell ? getComputedStyle(cell) : null;
    const ts = tile ? getComputedStyle(tile) : null;
    const cr = cell?.getBoundingClientRect();
    const tr = tile?.getBoundingClientRect();
    return {
      id,
      cell: {
        borderTopWidth: cs?.borderTopWidth,
        borderBottomWidth: cs?.borderBottomWidth,
        paddingBottom: cs?.paddingBottom,
        overflow: cs?.overflow,
        boxShadow: cs?.boxShadow,
        height: cr ? Math.round(cr.height) : null,
        bottom: cr ? Math.round(cr.bottom) : null,
      },
      innerTile: {
        borderTopWidth: ts?.borderTopWidth,
        borderBottomWidth: ts?.borderBottomWidth,
        boxShadow: ts?.boxShadow?.slice(0, 120),
        height: tr ? Math.round(tr.height) : null,
      },
    };
  });
  return {
    viewportWidth: window.innerWidth,
    rowBottom: rowRect ? Math.round(rowRect.bottom) : null,
    cards,
    capturedAt: new Date().toISOString(),
    cacheBust: bust,
    port,
  };
}

const SHOTS = [
  { name: 'travel-1366x768-normal-quickhelp-row', width: 1366, height: 768, clip: 'travel-flagship-cards-row' },
  { name: 'travel-1366x768-normal-quickhelp-closeup', width: 1366, height: 768, clip: 'travel-flagship-cards-row' },
  {
    name: 'travel-1366x768-fullscreen-quickhelp-row',
    width: 1366,
    height: 768,
    fullscreen: true,
    clip: 'travel-flagship-cards-row',
  },
  { name: 'travel-1024x768-quickhelp-sanity', width: 1024, height: 768, clip: 'travel-flagship-cards-row' },
  { name: 'travel-390x844-quickhelp-sanity', width: 390, height: 844, clip: 'travel-flagship-cards-row' },
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
const proof = await proofPage.evaluate(browserCollectProof, { bust: BUST, port: PORT });
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
  let clip;
  if (shot.clip) {
    const box = await page.locator(`[data-testid="${shot.clip}"]`).boundingBox();
    if (box) {
      clip = {
        x: Math.max(0, box.x - 8),
        y: Math.max(0, box.y - 8),
        width: box.width + 16,
        height: box.height + 20,
      };
    }
  }
  await page.screenshot({
    path: path.join(OUT_DIR, `${shot.name}.png`),
    fullPage: !clip,
    clip,
  });
  await page.close();
}

await browser.close();
await writeFile(path.join(OUT_DIR, 'computed-style-proof-pack-18.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 18 evidence → ${OUT_DIR}`);
