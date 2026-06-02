/**
 * Pack 1F QA capture — run: node capture.mjs (from this folder)
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || 8093);
const BASE = `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'situation-1f-390x844', width: 390, height: 844 },
  { name: 'situation-1f-768x1024', width: 768, height: 1024 },
  { name: 'situation-1f-1024x768', width: 1024, height: 768 },
  { name: 'situation-1f-1366x768', width: 1366, height: 768 },
  { name: 'situation-1f-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
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
        () => Boolean(document.querySelector('[data-testid="travel-utility-grid"]')),
        { timeout: 90_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel situation grid readiness failed.');
}

async function scrollToSituationGrid(page, mobile) {
  await page.evaluate(async ({ mobile: isMobile }) => {
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    grid?.scrollIntoView({ block: 'center', behavior: 'instant' });
    let scrollEl = grid?.parentElement ?? null;
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
    if (grid && scrollEl) {
      const rect = grid.getBoundingClientRect();
      scrollEl.scrollTop += rect.top - (isMobile ? 120 : 72);
    }
    await new Promise((r) => setTimeout(r, 400));
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

async function measureSituationSection(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    const panel = grid?.closest('[data-testid]') ?? grid?.parentElement;
    const cards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
      (el) => el.getAttribute('data-testid') !== 'travel-utility-grid'
    );
    const rows = [...document.querySelectorAll('[data-testid^="travel-situation-row-"], [data-testid="travel-situation-grid-row"]')];
    const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    const gridRect = grid?.getBoundingClientRect();
    const panelRect = grid?.parentElement?.getBoundingClientRect();
    return {
      cardCount: cards.length,
      rowElements: rows.length,
      cardHeights: heights,
      minHeight: heights.length ? Math.min(...heights) : null,
      maxHeight: heights.length ? Math.max(...heights) : null,
      avgHeight: heights.length ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null,
      gridHeight: gridRect ? Math.round(gridRect.height) : null,
      panelHeight: panelRect ? Math.round(panelRect.height) : null,
      viewportHeight: window.innerHeight,
      columns: window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const metrics = {};

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await context.addInitScript(
      ({ intentKey, travelKey }) => {
        localStorage.setItem(intentKey, '1');
        localStorage.setItem(travelKey, '0');
      },
      { intentKey: INTENT_KEY, travelKey: TRAVEL_LOCATION_CONSENT_KEY }
    );
    const page = await context.newPage();
    await openTravelRoute(page);
    await dismissIntentModal(page);
    await scrollToSituationGrid(page, vp.width < 768);
    if (vp.fullscreen) await enterFullscreen(page);
    await page.waitForTimeout(1200);

    const measure = await measureSituationSection(page);
    metrics[vp.name] = measure;

    await page.locator('[data-testid="travel-utility-grid"]').screenshot({
      path: path.join(OUT_DIR, `${vp.name}.png`),
    });
    if (vp.fullscreen) {
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-viewport.png`), fullPage: false });
    }
    await context.close();
    console.log(
      `${vp.name}: cards=${measure.avgHeight}px grid=${measure.gridHeight}px panel=${measure.panelHeight}px`
    );
  }

  await writeFile(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
