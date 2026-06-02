/**
 * Pack 15 — visual sentinel + rendered proof QA.
 * Prereq: npx expo start --web --port 8095 --clear
 * Env: PACK15_PHASE=sentinel|final (default final)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHASE = process.env.PACK15_PHASE === 'sentinel' ? 'sentinel' : 'final';
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  `wave-3b-travel-visual-sentinel-find-true-render-path-pack-15${PHASE === 'sentinel' ? '/sentinel' : ''}`
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
  await page.goto(`${BASE}/travel?pack15=${PHASE}&bust=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

function browserCollectProof(payload) {
  const { mode, bust, port, phase } = payload;
  const title = document.querySelector('[data-testid="travel-hero-title"]');
  const layer = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
  const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
  const proofLabel = Array.from(document.querySelectorAll('*')).find(
    (el) => el.textContent?.trim() === 'TITLE PATH PROOF'
  );
  const ts = title ? getComputedStyle(title) : null;
  const ls = layer ? getComputedStyle(layer) : null;
  const tr = title?.getBoundingClientRect();
  const lr = layer?.getBoundingClientRect();
  const hr = hero?.getBoundingClientRect();
  const cards = ['airport', 'translation', 'taxi', 'emergency'].map((id) => {
    const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
    const cs = cell ? getComputedStyle(cell) : null;
    return {
      id,
      borderTopWidth: cs?.borderTopWidth,
      borderTopColor: cs?.borderTopColor,
      boxShadow: cs?.boxShadow,
      outline: cs?.outline,
    };
  });
  return {
    phase,
    mode,
    viewportWidth: window.innerWidth,
    sentinelProofLabelVisible: Boolean(proofLabel),
    title: {
      innerText: title?.textContent?.trim(),
      fontSize: ts?.fontSize,
      lineHeight: ts?.lineHeight,
      width: tr ? Math.round(tr.width) : null,
      height: tr ? Math.round(tr.height) : null,
      left: tr ? Math.round(tr.left) : null,
      maxWidth: ts?.maxWidth,
    },
    layer: {
      width: lr ? Math.round(lr.width) : null,
      left: lr ? Math.round(lr.left) : null,
      borderTopWidth: ls?.borderTopWidth,
      borderTopColor: ls?.borderTopColor,
      paddingLeft: ls?.paddingLeft,
      paddingTop: ls?.paddingTop,
    },
    heroWidth: hr ? Math.round(hr.width) : null,
    titleToHeroRatio: hr && tr ? Math.round((tr.width / hr.width) * 1000) / 10 : null,
    cards,
    capturedAt: new Date().toISOString(),
    cacheBust: bust,
    port,
  };
}

const SHOTS =
  PHASE === 'sentinel'
    ? [
        { name: 'travel-1366x768-sentinel-normal', width: 1366, height: 768 },
        { name: 'travel-1366x768-sentinel-fullscreen', width: 1366, height: 768, fullscreen: true },
      ]
    : [
        { name: 'travel-1366x768-normal-opening', width: 1366, height: 768 },
        { name: 'travel-1366x768-normal-title-closeup', width: 1366, height: 768, clip: 'travel-dynamic-hero-stage' },
        { name: 'travel-1366x768-normal-quickhelp-closeup', width: 1366, height: 768, clip: 'travel-flagship-cards-row' },
        { name: 'travel-1366x768-fullscreen-opening', width: 1366, height: 768, fullscreen: true },
        { name: 'travel-1366x768-fullscreen-title-closeup', width: 1366, height: 768, fullscreen: true, clip: 'travel-dynamic-hero-stage' },
        { name: 'travel-1024x768-sanity', width: 1024, height: 768 },
        { name: 'travel-390x844-sanity', width: 390, height: 844 },
      ];

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { phase: PHASE, port: PORT, cacheBust: BUST, modes: [] };

for (const mode of [
  { label: 'normal', fullscreen: false },
  { label: 'fullscreen', fullscreen: true },
]) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await openTravel(page);
  if (mode.fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(600);
  }
  const row = await page.evaluate(browserCollectProof, {
    mode: mode.label,
    bust: BUST,
    port: PORT,
    phase: PHASE,
  });
  proof.modes.push(row);
  await page.close();
}

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
    if (box) clip = box;
  }
  await page.screenshot({
    path: path.join(OUT_DIR, `${shot.name}.png`),
    fullPage: !clip,
    clip,
  });
  await page.close();
}

await browser.close();
await writeFile(
  path.join(OUT_DIR, `computed-style-proof-pack-15-${PHASE}.json`),
  JSON.stringify(proof, null, 2)
);
console.log(`Pack 15 ${PHASE} evidence → ${OUT_DIR}`);
