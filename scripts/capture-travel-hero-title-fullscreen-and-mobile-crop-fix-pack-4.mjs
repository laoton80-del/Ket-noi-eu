/**
 * Travel hero title — FULLSCREEN_AND_MOBILE_CROP_FIX PACK_4 QA.
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
  'wave-3b-travel-hero-title-fullscreen-and-mobile-crop-fix-pack-4'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const SHOTS = [
  { name: 'hero-pack4-390x844-default', width: 390, height: 844 },
  { name: 'hero-pack4-390x844-airport', width: 390, height: 844, hover: 'travel-flagship-airport' },
  { name: 'hero-pack4-1366x768-normal-default', width: 1366, height: 768 },
  { name: 'hero-pack4-1366x768-normal-airport', width: 1366, height: 768, hover: 'travel-flagship-airport' },
  {
    name: 'hero-pack4-1366x768-normal-interpreter',
    width: 1366,
    height: 768,
    hover: 'travel-flagship-translation',
  },
  { name: 'hero-pack4-1366x768-fullscreen-default', width: 1366, height: 768, fullscreen: true },
  {
    name: 'hero-pack4-1366x768-fullscreen-interpreter',
    width: 1366,
    height: 768,
    fullscreen: true,
    hover: 'travel-flagship-translation',
  },
  {
    name: 'hero-pack4-1366x768-fullscreen-transport',
    width: 1366,
    height: 768,
    fullscreen: true,
    hover: 'travel-flagship-taxi',
  },
];

async function dismissGates(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  const locationGate = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await locationGate.isVisible({ timeout: 2000 }).catch(() => false)) {
    await locationGate.click();
  }
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  for (const route of ['/travel', '/tabs/travel', '/TravelHub']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForSelector('[data-testid="travel-hero-title"]', { timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel hero not ready');
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function hoverQuickHelp(page, testId) {
  const el = page.locator(`[data-testid="${testId}"]`);
  await el.scrollIntoViewIfNeeded();
  await el.hover({ force: true });
  await page.waitForTimeout(700);
}

async function measureHero(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]');
    const stage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const stack = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const subtitle = stack?.querySelectorAll('span, div, p') ?? [];
    let subEl = null;
    for (const el of stack?.children ?? []) {
      if (el !== title && el.textContent && el.textContent.length > 40) {
        subEl = el;
        break;
      }
    }
    const clip = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const parent = stage?.getBoundingClientRect();
      if (!parent) return { clipped: false };
      return {
        clipped: r.bottom > parent.bottom + 1 || r.top < parent.top - 1,
        bottomDelta: Math.round(r.bottom - parent.bottom),
        topDelta: Math.round(r.top - parent.top),
      };
    };
    const titleStyle = title ? window.getComputedStyle(title) : null;
    return {
      stageHeight: stage ? Math.round(stage.getBoundingClientRect().height) : null,
      titleFontSize: titleStyle?.fontSize ?? null,
      titleLineHeight: titleStyle?.lineHeight ?? null,
      titleClip: clip(title),
      subtitleClip: clip(subEl),
      stackHeight: stack ? Math.round(stack.getBoundingClientRect().height) : null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const metricsOut = [];
  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
      await page.addInitScript(
        ({ intentKey, consentKey }) => {
          try {
            localStorage.setItem(intentKey, '1');
            localStorage.setItem('@app_language', 'vi');
            localStorage.setItem(consentKey, '0');
          } catch {
            /* ignore */
          }
        },
        { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
      );
      const route = await openTravel(page);
      await dismissGates(page);
      if (shot.fullscreen) await enterFullscreen(page);
      if (shot.hover) await hoverQuickHelp(page, shot.hover);
      const metrics = await measureHero(page);
      metricsOut.push({ shot: shot.name, route, metrics });
      console.log(JSON.stringify({ shot: shot.name, metrics }, null, 2));
      const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
      await hero.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`) });
      await page.close();
    }
    await writeFile(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metricsOut, null, 2), 'utf8');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
