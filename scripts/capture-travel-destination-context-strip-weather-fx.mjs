/**
 * Travel destination context strip (weather + FX) — QA captures.
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-travel-destination-context-strip-weather-fx'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';
const FLOAT_RESERVE_PX = 220;

const VIEWPORTS = [
  { name: 'context-strip-390x844', width: 390, height: 844 },
  { name: 'context-strip-768x1024', width: 768, height: 1024 },
  { name: 'context-strip-1024x768', width: 1024, height: 768 },
  { name: 'context-strip-1366x768', width: 1366, height: 768 },
  { name: 'context-strip-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function openTravelRoute(page) {
  for (const route of ['/travel', '/tabs/travel', '/TravelHub']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForFunction(
        () => Boolean(document.querySelector('[data-testid="travel-destination-context-strip"]')),
        { timeout: 60_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel destination context strip readiness failed.');
}

async function scrollForViewport(page, mobile) {
  await page.evaluate(async ({ mobile: isMobile }) => {
    const destination = document.querySelector('[data-testid="travel-destination-card"]');
    const business = document.querySelector('[data-testid="travel-connected-business"]');
    destination?.scrollIntoView({ block: isMobile ? 'start' : 'center', behavior: 'instant' });

    let scrollEl = destination?.parentElement ?? null;
    while (scrollEl && scrollEl !== document.body) {
      const { overflowY } = window.getComputedStyle(scrollEl);
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        scrollEl.scrollHeight > scrollEl.clientHeight + 4
      ) {
        break;
      }
      scrollEl = scrollEl.parentElement;
    }
    if (!scrollEl) scrollEl = document.scrollingElement;

    if (isMobile && business && scrollEl) {
      for (let i = 0; i < 24; i++) {
        scrollEl.scrollTop += 72;
        const rect = business.getBoundingClientRect();
        if (window.innerHeight - rect.bottom >= 220) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }, { mobile });
  await page.waitForTimeout(900);
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function measureContextStrip(page) {
  return page.evaluate(() => {
    const strip = document.querySelector('[data-testid="travel-destination-context-strip"]');
    const weather = document.querySelector('[data-testid="travel-destination-context-weather-row"]');
    const fx = document.querySelector('[data-testid="travel-destination-context-fx-row"]');
    const cards = [...document.querySelectorAll('[data-testid^="travel-destination-weather-mini-card-"]')];
    return {
      stripVisible: Boolean(strip),
      weatherVisible: Boolean(weather),
      fxVisible: Boolean(fx),
      weatherCardCount: cards.length,
      weatherDemoNote: weather?.textContent?.includes('dữ liệu mẫu') ?? false,
      fxDemoNote: fx?.textContent?.includes('tham chiếu demo') ?? false,
    };
  });
}

async function measureMobileOverlap(page) {
  return page.evaluate(({ floatReserve }) => {
    const chips = ['travel-connected-local', 'travel-connected-academy', 'travel-connected-business'].map(
      (id) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect()
    );
    const vh = window.innerHeight;
    const results = chips.map((rect, i) => ({
      id: ['local', 'academy', 'business'][i],
      bottom: rect ? Math.round(rect.bottom) : null,
      clearance: rect ? Math.round(vh - rect.bottom) : null,
      pass: rect ? vh - rect.bottom >= floatReserve : null,
    }));
    return { viewport: vh, floatReserve, chips: results, allPass: results.every((r) => r.pass === true) };
  }, { floatReserve: FLOAT_RESERVE_PX });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
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
      await openTravelRoute(page);
      await dismissIntentModal(page);
      if (vp.fullscreen) await enterFullscreen(page);
      await scrollForViewport(page, vp.width < 768);
      const metrics = await measureContextStrip(page);
      console.log(JSON.stringify({ viewport: vp.name, metrics }, null, 2));
      if (vp.width === 390) {
        const overlap = await measureMobileOverlap(page);
        console.log(JSON.stringify({ viewport: vp.name, overlap }, null, 2));
      }
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`), fullPage: false });
      console.log(`Captured ${vp.name}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
