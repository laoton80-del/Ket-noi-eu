/**
 * Home / Local / Travel dynamic hero typography + lighting parity captures.
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
  'wave-3b-home-local-travel-dynamic-hero-typography-and-lighting-parity'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const CAPTURES = [
  { name: 'home-parity-1366x768', route: 'home', width: 1366, height: 768 },
  { name: 'home-parity-1366x768-fullscreen', route: 'home', width: 1366, height: 768, fullscreen: true },
  { name: 'local-parity-1366x768', route: 'local', width: 1366, height: 768 },
  { name: 'local-parity-1366x768-fullscreen', route: 'local', width: 1366, height: 768, fullscreen: true },
  { name: 'travel-parity-1366x768', route: 'travel', width: 1366, height: 768 },
  { name: 'travel-parity-1366x768-fullscreen', route: 'travel', width: 1366, height: 768, fullscreen: true },
  { name: 'travel-parity-390x844', route: 'travel', width: 390, height: 844 },
  { name: 'travel-parity-844x390', route: 'travel', width: 844, height: 390 },
  { name: 'travel-parity-768x1024', route: 'travel', width: 768, height: 1024 },
  { name: 'travel-parity-1024x768', route: 'travel', width: 1024, height: 768 },
];

async function dismissIntent(page) {
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2500 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await q.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(500);
}

async function openRoute(page, kind) {
  const paths =
    kind === 'travel'
      ? ['/travel', '/tabs/travel']
      : kind === 'local'
        ? ['/local', '/tabs/local']
        : ['/home', '/tabs/home', '/'];
  for (const p of paths) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    const ok = await page.waitForFunction(
      () => document.body?.textContent?.length > 80,
      { timeout: 45_000 }
    ).then(() => true).catch(() => false);
    if (ok) return p;
  }
  throw new Error(`Failed ${kind}`);
}

async function waitReady(page, kind) {
  if (kind === 'travel') {
    await page.waitForSelector('[data-testid="travel-hero-lighting-network"]', { timeout: 60_000 });
  } else if (kind === 'local') {
    await page.waitForSelector('[data-testid="local-dynamic-hero"], [data-testid="local-hub"]', {
      timeout: 60_000,
    });
  } else {
    await page.waitForSelector('[data-testid="home-hero-network-edge"]', { timeout: 60_000 });
  }
}

async function fullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForTimeout(700);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const cap of CAPTURES) {
      const page = await browser.newPage({ viewport: { width: cap.width, height: cap.height } });
      await page.addInitScript(({ intentKey, consentKey }) => {
        localStorage.setItem(intentKey, '1');
        localStorage.setItem(consentKey, '0');
      }, { intentKey: INTENT_KEY, consentKey: TRAVEL_CONSENT_KEY });
      const opened = await openRoute(page, cap.route);
      await dismissIntent(page);
      if (cap.fullscreen) await fullscreen(page);
      await waitReady(page, cap.route);
      await page.waitForTimeout(cap.fullscreen ? 1000 : 700);
      await page.screenshot({ path: path.join(OUT_DIR, `${cap.name}.png`) });
      console.log(`OK ${cap.name} via ${opened}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
