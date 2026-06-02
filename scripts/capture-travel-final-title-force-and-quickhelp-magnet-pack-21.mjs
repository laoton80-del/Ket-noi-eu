/**
 * Pack 21 — final title force + Quick Help full-card magnet QA.
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
  'wave-3b-travel-final-title-force-and-quickhelp-magnet-pack-21'
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
  await page.goto(`${BASE}/travel?pack21=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

const SHOTS = [
  { name: 'travel-1366x768-normal-full', width: 1366, height: 768, fullPage: true },
  {
    name: 'travel-1366x768-normal-title-closeup',
    width: 1366,
    height: 768,
    clip: 'travel-hero-title',
    pad: 56,
  },
  {
    name: 'travel-1366x768-normal-quickhelp-default',
    width: 1366,
    height: 768,
    clip: 'travel-flagship-cards-row',
    pad: 16,
  },
  { name: 'travel-1366x768-fullscreen-sanity', width: 1366, height: 768, fullscreen: true, fullPage: true },
  { name: 'travel-1024x768-sanity', width: 1024, height: 768, fullPage: true },
  { name: 'travel-390x844-sanity', width: 390, height: 844, fullPage: true },
];

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

const proof = { normal: null, fullscreen: null, quickHelp: {} };

const normalPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await normalPage.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(normalPage);
proof.normal = await normalPage.evaluate(() => {
  const title = document.querySelector('[data-testid="travel-hero-title"]');
  const stack = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
  const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
  const ts = title ? getComputedStyle(title) : null;
  const ss = stack ? getComputedStyle(stack) : null;
  const tr = title?.getBoundingClientRect();
  const sr = stack?.getBoundingClientRect();
  const hr = hero?.getBoundingClientRect();
  return {
    fullscreen: Boolean(document.fullscreenElement),
    viewportWidth: window.innerWidth,
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
    titleToHeroWidthPct: hr && tr ? Math.round((tr.width / hr.width) * 1000) / 10 : null,
  };
});
proof.quickHelp.airportDefault = await normalPage.evaluate((id) => {
  const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
  const cs = cell ? getComputedStyle(cell) : null;
  return {
    outerElement: `[data-testid="travel-quick-help-cell-${id}"]`,
    transform: cs?.transform,
    transition: cs?.transition,
    boxShadow: cs?.boxShadow,
    zIndex: cs?.zIndex,
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
    if (shot.width === 1366) {
      proof.fullscreen = await page.evaluate(() => {
        const title = document.querySelector('[data-testid="travel-hero-title"]');
        const stack = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
        const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
        const ts = title ? getComputedStyle(title) : null;
        const ss = stack ? getComputedStyle(stack) : null;
        const tr = title?.getBoundingClientRect();
        const sr = stack?.getBoundingClientRect();
        const hr = hero?.getBoundingClientRect();
        return {
          fullscreen: Boolean(document.fullscreenElement),
          viewportWidth: window.innerWidth,
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
          titleToHeroWidthPct: hr && tr ? Math.round((tr.width / hr.width) * 1000) / 10 : null,
        };
      });
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
  if (page !== normalPage) await page.close();
}

const airportCell = normalPage.locator('[data-testid="travel-quick-help-cell-airport"]');
await airportCell.hover();
await normalPage.waitForTimeout(320);
proof.quickHelp.airportHover = await normalPage.evaluate((id) => {
  const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
  const cs = cell ? getComputedStyle(cell) : null;
  return {
    outerElement: `[data-testid="travel-quick-help-cell-${id}"]`,
    transform: cs?.transform,
    transition: cs?.transition,
    boxShadow: cs?.boxShadow,
    zIndex: cs?.zIndex,
  };
}, 'airport');
await normalPage.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-normal-quickhelp-hover-airport.png'),
  clip: await (async () => {
    const box = await normalPage.locator('[data-testid="travel-flagship-cards-row"]').boundingBox();
    if (!box) return undefined;
    return {
      x: Math.max(0, box.x - 16),
      y: Math.max(0, box.y - 16),
      width: Math.min(1366, box.width + 32),
      height: box.height + 32,
    };
  })(),
});

const translationCell = normalPage.locator('[data-testid="travel-quick-help-cell-translation"]');
await translationCell.hover();
await normalPage.waitForTimeout(320);
proof.quickHelp.translationHover = await normalPage.evaluate((id) => {
  const cell = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
  const cs = cell ? getComputedStyle(cell) : null;
  return {
    outerElement: `[data-testid="travel-quick-help-cell-${id}"]`,
    transform: cs?.transform,
    transition: cs?.transition,
    boxShadow: cs?.boxShadow,
    zIndex: cs?.zIndex,
  };
}, 'translation');
await normalPage.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-normal-quickhelp-hover-translation.png'),
  clip: await (async () => {
    const box = await normalPage.locator('[data-testid="travel-flagship-cards-row"]').boundingBox();
    if (!box) return undefined;
    return {
      x: Math.max(0, box.x - 16),
      y: Math.max(0, box.y - 16),
      width: Math.min(1366, box.width + 32),
      height: box.height + 32,
    };
  })(),
});

await normalPage.close();
await browser.close();

proof.capturedAt = new Date().toISOString();
await writeFile(path.join(OUT_DIR, 'computed-style-proof-pack-21.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 21 evidence → ${OUT_DIR}`);
