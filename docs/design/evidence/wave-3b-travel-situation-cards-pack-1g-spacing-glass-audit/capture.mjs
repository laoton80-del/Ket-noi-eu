/**
 * Pack 1G QA — spacing + glass audit captures.
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'situation-1g-390x844', width: 390, height: 844 },
  { name: 'situation-1g-768x1024', width: 768, height: 1024 },
  { name: 'situation-1g-1024x768', width: 1024, height: 768 },
  { name: 'situation-1g-1366x768', width: 1366, height: 768 },
  { name: 'situation-1g-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
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

async function scrollToOpeningStage(page) {
  await page.evaluate(async () => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    flagship?.scrollIntoView({ block: 'start', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
  });
  await page.waitForTimeout(800);
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function measureSection(page) {
  return page.evaluate(() => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    const cards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
      (el) => el.getAttribute('data-testid') !== 'travel-utility-grid'
    );
    const fr = flagship?.getBoundingClientRect();
    const gr = grid?.getBoundingClientRect();
    const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    const gridBottom = gr ? gr.bottom : null;
    const viewportBottom = window.innerHeight;
    return {
      quickHelpToSituationGapPx: fr && gr ? Math.round(gr.top - fr.bottom) : null,
      cardCount: cards.length,
      cardHeights: heights,
      minHeight: heights.length ? Math.min(...heights) : null,
      maxHeight: heights.length ? Math.max(...heights) : null,
      avgHeight: heights.length ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null,
      gridHeight: gr ? Math.round(gr.height) : null,
      gridTop: gr ? Math.round(gr.top) : null,
      gridBottom: gridBottom ? Math.round(gridBottom) : null,
      viewportHeight: viewportBottom,
      gridFullyVisible: gridBottom != null ? gridBottom <= viewportBottom + 2 : null,
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
    if (vp.fullscreen) await enterFullscreen(page);
    await scrollToOpeningStage(page);
    await page.waitForTimeout(1200);

    const measure = await measureSection(page);
    metrics[vp.name] = measure;

    await page.locator('[data-testid="travel-utility-grid"]').screenshot({
      path: path.join(OUT_DIR, `${vp.name}.png`),
    });
    if (vp.fullscreen) {
      await page.screenshot({
        path: path.join(OUT_DIR, `${vp.name}-viewport.png`),
        fullPage: false,
      });
    }
    await context.close();
    console.log(
      `${vp.name}: gap=${measure.quickHelpToSituationGapPx}px cards=${measure.avgHeight}px gridVisible=${measure.gridFullyVisible}`
    );
  }

  await writeFile(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
