/**
 * Home luminous default mode lock QA captures.
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
  'wave-3b-home-luminous-default-mode-lock'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const DAYLIGHT_KEY = 'viona.daylightBoost.v1';

const VIEWPORTS = [
  { name: 'home-luminous-lock-390x844', width: 390, height: 844 },
  { name: 'home-luminous-lock-844x390', width: 844, height: 390 },
  { name: 'home-luminous-lock-768x1024', width: 768, height: 1024 },
  { name: 'home-luminous-lock-1024x768', width: 1024, height: 768 },
  { name: 'home-luminous-lock-1366x768', width: 1366, height: 768 },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function waitForHomeReadiness(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector('[data-testid="home-hero-network-edge"]') ||
          document.querySelector('[data-testid="home-fashion-command-bar"]') ||
          document.body.textContent?.includes('VIONA')
      ),
    { timeout: 90_000 }
  );
}

async function openHomeRoute(page) {
  const candidates = ['/', '/tabs/home', '/home'];
  for (const route of candidates) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForFunction(
        () =>
          Boolean(
            document.querySelector('[data-testid="home-hero-network-edge"]') ||
              document.querySelector('[data-testid="home-fashion-command-bar"]') ||
              document.body.textContent?.includes('VIONA')
          ),
        { timeout: 45_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Home route readiness failed on /, /tabs/home, and /home.');
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(
        (intentKey, daylightKey) => {
          try {
            localStorage.setItem(intentKey, '1');
            localStorage.setItem(daylightKey, '0');
          } catch {}
        },
        INTENT_KEY,
        DAYLIGHT_KEY
      );
      await openHomeRoute(page);
      await waitForHomeReadiness(page);
      await dismissIntentModal(page);
      const out = path.join(OUT_DIR, `${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`wrote ${out}`);
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
