/**
 * Travel weather cinematic mini cards pack 1C final tune — QA captures.
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
  'wave-3b-travel-weather-cinematic-mini-cards-pack-1c-final-tune'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';
const FLOAT_RESERVE_PX = 220;

const VIEWPORTS = [
  { name: 'weather-1c-390x844', width: 390, height: 844 },
  { name: 'weather-1c-768x1024', width: 768, height: 1024 },
  { name: 'weather-1c-1024x768', width: 1024, height: 768 },
  { name: 'weather-1c-1366x768', width: 1366, height: 768 },
  { name: 'weather-1c-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
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
  await page.waitForTimeout(600);
}

async function openTravelRoute(page) {
  for (const route of ['/travel', '/tabs/travel', '/TravelHub']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForFunction(
        () => Boolean(document.querySelector('[data-testid="travel-destination-context-weather-row"]')),
        { timeout: 60_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel weather 1C readiness failed.');
}

async function scrollForViewport(page, mobile) {
  await page.evaluate(({ mobile: isMobile }) => {
    document
      .querySelector('[data-testid="travel-destination-section"]')
      ?.scrollIntoView({ block: isMobile ? 'start' : 'center', behavior: 'instant' });
    let scrollEl = document.querySelector('[data-testid="travel-destination-section"]')?.parentElement ?? null;
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
    if (isMobile && scrollEl) {
      const business = document.querySelector('[data-testid="travel-connected-business"]');
      if (business) {
        for (let i = 0; i < 20; i++) {
          scrollEl.scrollTop += 64;
          const rect = business.getBoundingClientRect();
          if (window.innerHeight - rect.bottom >= 220) break;
        }
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

async function measureWeatherCards(page) {
  return page.evaluate(() => {
    const weather = document.querySelector('[data-testid="travel-destination-context-weather-row"]');
    const shell = document.querySelector('[data-testid="travel-destination-weather-scroll-shell"]');
    const fx = document.querySelector('[data-testid="travel-destination-context-fx-row"]');
    const cards = [...document.querySelectorAll('[data-testid^="travel-destination-weather-mini-card-"]')];
    const today = document.querySelector('[data-testid="travel-destination-weather-mini-card-today"]');
    const firstCard = cards[0]?.getBoundingClientRect();
    const weatherRect = weather?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();
    const fxRect = fx?.getBoundingClientRect();
    const leafEls = [...(weather?.querySelectorAll('*') ?? [])].filter(
      (el) => el.children.length === 0 && el.textContent?.trim()
    );
    const overflow = leafEls.filter(
      (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
    );
    const clipRight = shellRect?.right ?? weatherRect?.right ?? window.innerWidth;
    const clipLeft = shellRect?.left ?? weatherRect?.left ?? 0;
    let clearlyVisible = 0;
    let partiallyVisible = 0;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const visibleWidth = Math.min(rect.right, clipRight) - Math.max(rect.left, clipLeft);
      if (visibleWidth >= rect.width * 0.85 && rect.width > 0) clearlyVisible += 1;
      else if (visibleWidth >= rect.width * 0.35) partiallyVisible += 1;
    }
    const scrollAffordance = Boolean(shell?.querySelector('[style*="chevron"]') || shell?.textContent?.includes('›'));
    return {
      weatherVisible: Boolean(weather),
      fxVisible: Boolean(fx),
      weatherCardCount: cards.length,
      clearlyVisibleCards: clearlyVisible,
      partiallyVisibleCards: partiallyVisible,
      scrollShellPresent: Boolean(shell),
      demoNote: weather?.textContent?.includes('thời tiết tham chiếu demo') ?? false,
      todayWidth: today ? Math.round(today.getBoundingClientRect().width) : null,
      firstCardWidth: firstCard ? Math.round(firstCard.width) : null,
      firstCardHeight: firstCard ? Math.round(firstCard.height) : null,
      weatherFxGap: weatherRect && fxRect ? Math.round(fxRect.top - weatherRect.bottom) : null,
      overflowCount: overflow.length,
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
      clearance: rect ? Math.round(vh - rect.bottom) : null,
      pass: rect ? vh - rect.bottom >= floatReserve : null,
    }));
    return { allPass: results.every((r) => r.pass === true), chips: results };
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
      await dismissGates(page);
      if (vp.fullscreen) await enterFullscreen(page);
      await scrollForViewport(page, vp.width < 768);
      const metrics = await measureWeatherCards(page);
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
