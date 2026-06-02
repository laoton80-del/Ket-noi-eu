/**
 * Remove light toggle from top command bar — QA captures.
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
  'wave-3b-remove-light-toggle-from-top-command-bar'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'home-rail-1366x768', width: 1366, height: 768, route: '/home' },
  { name: 'home-rail-1366x768-fullscreen', width: 1366, height: 768, route: '/home', fullscreen: true },
  { name: 'local-rail-1366x768', width: 1366, height: 768, route: '/local' },
  { name: 'travel-rail-1366x768', width: 1366, height: 768, route: '/travel' },
  { name: 'travel-rail-390x844', width: 390, height: 844, route: '/travel' },
  { name: 'local-rail-390x844', width: 390, height: 844, route: '/local' },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function openRoute(page, routes, readyFn) {
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page.waitForFunction(readyFn, { timeout: 60_000 }).then(() => true).catch(() => false);
    if (ok) return route;
  }
  throw new Error(`Route readiness failed for ${routes.join(', ')}.`);
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
  const routeMap = {
    '/home': {
      routes: ['/', '/tabs/home', '/home'],
      readyFn: () =>
        Boolean(
          document.querySelector('[data-testid="home-hero-network-edge"]') ||
            document.body.textContent?.includes('VIONA') ||
            document.body.textContent?.includes('Ngôn ngữ')
        ),
    },
    '/local': {
      routes: ['/local', '/tabs/local', '/LocalHub'],
      readyFn: () => Boolean(document.querySelector('[data-testid="local-opening-stage"]')),
    },
    '/travel': {
      routes: ['/travel', '/tabs/travel', '/TravelHub'],
      readyFn: () => Boolean(document.querySelector('[data-testid="travel-flagship-cards-row"]')),
    },
  };
  const cfg = routeMap[vp.route ?? '/travel'];
  const route = await openRoute(page, cfg.routes, cfg.readyFn);
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
