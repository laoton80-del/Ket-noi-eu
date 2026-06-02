/**
 * Travel quick-help force visible premium rims — QA captures.
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
  'wave-3b-travel-quick-help-force-visible-premium-rims'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'travel-rim-1366x768', width: 1366, height: 768 },
  { name: 'travel-rim-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
  { name: 'travel-rim-1024x768', width: 1024, height: 768 },
  { name: 'travel-rim-390x844', width: 390, height: 844 },
  { name: 'local-compare-1366x768', width: 1366, height: 768, route: '/local' },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function openRoute(page, routes, readySelector) {
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForSelector(readySelector, { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error(`Route readiness failed for ${readySelector}.`);
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function captureViewport(browser, vp) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.addInitScript(
    ({ intentKey, consentKey }) => {
      localStorage.setItem(intentKey, '1');
      localStorage.setItem(consentKey, '0');
    },
    { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
  );
  const routes = vp.route ? [vp.route, '/tabs/local', '/LocalHub'] : ['/travel', '/tabs/travel', '/TravelHub'];
  const ready = vp.route
    ? '[data-testid="local-opening-stage"]'
    : '[data-testid="travel-flagship-cards-row"]';
  const route = await openRoute(page, routes, ready);
  await dismissIntentModal(page);
  if (vp.fullscreen) await enterFullscreen(page);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`), fullPage: false });
  console.log(`OK ${vp.name} via ${route}`);
  await page.close();
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      await captureViewport(browser, vp);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
