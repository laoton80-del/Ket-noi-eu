/**
 * Travel restore premium frame + Local card grammar QA captures.
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
  'wave-3b-travel-restore-premium-frame-and-local-card-grammar'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const TRAVEL_VIEWPORTS = [
  { name: 'travel-restore-390x844', route: '/travel', width: 390, height: 844 },
  { name: 'travel-restore-844x390', route: '/travel', width: 844, height: 390 },
  { name: 'travel-restore-768x1024', route: '/travel', width: 768, height: 1024 },
  { name: 'travel-restore-1024x768', route: '/travel', width: 1024, height: 768 },
  { name: 'travel-restore-1366x768', route: '/travel', width: 1366, height: 768 },
  {
    name: 'travel-restore-1366x768-fullscreen',
    route: '/travel',
    width: 1366,
    height: 768,
    fullscreen: true,
  },
];

const LOCAL_COMPARE = {
  name: 'local-compare-1366x768',
  route: '/local',
  width: 1366,
  height: 768,
};

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
      .waitForSelector('[data-testid="travel-flagship-emergency"]', { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel route readiness failed.');
}

async function openLocalRoute(page) {
  for (const route of ['/local', '/tabs/local']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForSelector('[data-testid="local-dynamic-hero"]', { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Local route readiness failed.');
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function capture(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.addInitScript(
    ({ intentKey, consentKey }) => {
      localStorage.setItem(intentKey, '1');
      localStorage.setItem(consentKey, '0');
    },
    { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
  );
  const route =
    vp.route === '/local'
      ? await openLocalRoute(page)
      : await openTravelRoute(page);
  await dismissIntentModal(page);
  if (vp.fullscreen) await enterFullscreen(page);
  await page.waitForTimeout(vp.fullscreen ? 1200 : 900);
  const outPath = path.join(OUT_DIR, `${vp.name}.png`);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`OK ${vp.name} via ${route}`);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const vp of TRAVEL_VIEWPORTS) {
      await capture(page, vp);
    }
    await capture(page, LOCAL_COMPARE);
    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
