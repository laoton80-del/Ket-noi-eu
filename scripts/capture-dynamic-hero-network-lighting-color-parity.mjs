/**
 * Dynamic hero network lighting color parity — Home + Travel QA captures.
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
  'wave-3b-dynamic-hero-network-lighting-color-parity'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const CAPTURES = [
  { name: 'home-lighting-1366x768', route: '/home', width: 1366, height: 768 },
  { name: 'home-lighting-1366x768-fullscreen', route: '/home', width: 1366, height: 768, fullscreen: true },
  { name: 'travel-lighting-1366x768', route: '/travel', width: 1366, height: 768 },
  { name: 'travel-lighting-1366x768-fullscreen', route: '/travel', width: 1366, height: 768, fullscreen: true },
  { name: 'travel-lighting-390x844', route: '/travel', width: 390, height: 844 },
  { name: 'travel-lighting-844x390', route: '/travel', width: 844, height: 390 },
  { name: 'travel-lighting-768x1024', route: '/travel', width: 768, height: 1024 },
  { name: 'travel-lighting-1024x768', route: '/travel', width: 1024, height: 768 },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function waitForRoute(page, route) {
  if (route.includes('travel')) {
    await page.waitForSelector('[data-testid="travel-hero-lighting-network"]', { timeout: 60_000 });
    await page.waitForSelector('[data-testid="travel-flagship-translation"]', { timeout: 15_000 });
    return;
  }
  await page.waitForSelector('[data-testid="home-hero-network-edge"]', { timeout: 60_000 });
}

async function openRoute(page, route) {
  const candidates = route.includes('travel')
    ? ['/travel', '/tabs/travel', '/TravelHub']
    : ['/home', '/tabs/home', '/'];
  for (const pathSuffix of candidates) {
    await page.goto(`${BASE}${pathSuffix}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForFunction(
        (isTravel) => {
          if (isTravel) {
            return Boolean(document.querySelector('[data-testid="travel-hero-lighting-network"]'));
          }
          return Boolean(document.querySelector('[data-testid="home-hero-network-edge"]'));
        },
        route.includes('travel'),
        { timeout: 45_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return pathSuffix;
  }
  throw new Error(`Route readiness failed for ${route}`);
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const cap of CAPTURES) {
      const page = await browser.newPage({ viewport: { width: cap.width, height: cap.height } });
      await page.addInitScript(
        ({ intentKey, consentKey }) => {
          localStorage.setItem(intentKey, '1');
          localStorage.setItem(consentKey, '0');
        },
        { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
      );
      const opened = await openRoute(page, cap.route);
      await dismissIntentModal(page);
      if (cap.fullscreen) await enterFullscreen(page);
      await waitForRoute(page, cap.route);
      await page.waitForTimeout(cap.fullscreen ? 1200 : 800);
      const outPath = path.join(OUT_DIR, `${cap.name}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`OK ${cap.name} via ${opened}`);
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
