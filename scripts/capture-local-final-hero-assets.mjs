/**
 * Local final hero assets QA captures.
 * Prereq: npx expo start --web --port 8088
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
  'wave-3b-local-final-hero-assets'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8088);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const LOCAL_WEB_CANVAS_BG = '#050B14';

const VIEWPORTS = [
  { name: 'local-final-hero-assets-390x844', width: 390, height: 844 },
  { name: 'local-final-hero-assets-844x390', width: 844, height: 390 },
  { name: 'local-final-hero-assets-768x1024', width: 768, height: 1024 },
  { name: 'local-final-hero-assets-1024x768', width: 1024, height: 768 },
  { name: 'local-final-hero-assets-1366x768', width: 1366, height: 768 },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function waitForLocalReadiness(page) {
  // Give Expo/Router time to hydrate and mount web test IDs.
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector('[data-testid="local-premium-shell"]') ||
          document.querySelector('[id="local-hub-root"]') ||
          document.querySelector('[data-testid="local-opening-stage"]') ||
          document.querySelector('[data-testid="local-dynamic-hero"]')
      ),
    { timeout: 90_000 }
  );
}

async function openLocalRoute(page) {
  const waitForLocalSelector = () =>
    page
      .waitForFunction(
        () =>
          Boolean(
            document.querySelector('[data-testid="local-premium-shell"]') ||
              document.querySelector('[id="local-hub-root"]') ||
              document.querySelector('[data-testid="local-opening-stage"]') ||
              document.querySelector('[data-testid="local-dynamic-hero"]')
          ),
        { timeout: 45_000 }
      )
      .then(() => true)
      .catch(() => false);

  const candidates = ['/local', '/tabs/local', '/'];
  for (const route of candidates) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await waitForLocalSelector();
    if (ok) return route;
  }

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
  const localEntryCandidates = [
    'a[href="/local"]',
    'a[href$="/local"]',
    '[role="link"][href*="local"]',
    '[role="tab"] >> text=Local',
    'text=Local',
  ];
  for (const selector of localEntryCandidates) {
    const target = page.locator(selector).first();
    const canUse = await target.isVisible({ timeout: 4000 }).catch(() => false);
    if (!canUse) continue;
    await target.click({ timeout: 4000 }).catch(() => {});
    const ok = await waitForLocalSelector();
    if (ok) return '/ (via local tab/link fallback)';
  }

  throw new Error('Local route readiness failed on /local, /tabs/local, and /.');
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(
        ({ key, canvasBg }) => {
          try {
            localStorage.setItem(key, '1');
          } catch {}
          document.documentElement.style.backgroundColor = canvasBg;
          document.body.style.backgroundColor = canvasBg;
          document.documentElement.style.overflowX = 'hidden';
          document.body.style.overflowX = 'hidden';
        },
        { key: INTENT_KEY, canvasBg: LOCAL_WEB_CANVAS_BG }
      );
      await openLocalRoute(page);
      await waitForLocalReadiness(page);
      await dismissIntentModal(page);
      await page.waitForFunction(
        () =>
          Boolean(
            document.querySelector('[data-testid="local-dynamic-hero"]') ||
              document.querySelector('[data-testid="local-opening-stage"]')
          ),
        { timeout: 120_000 }
      );
      await page.waitForSelector('[data-testid="local-hero-cards-row"]', { timeout: 120_000 });
      await page.evaluate((canvasBg) => {
        document.documentElement.style.backgroundColor = canvasBg;
        document.body.style.backgroundColor = canvasBg;
        const root = document.getElementById('local-hub-root');
        if (!(root instanceof HTMLElement)) return;
        root.style.backgroundColor = canvasBg;
        let current = root.parentElement;
        while (current && current !== document.body) {
          const maxWidth = window.getComputedStyle(current).maxWidth;
          if (maxWidth === '600px') {
            current.style.maxWidth = '100%';
            current.style.width = '100%';
          }
          current = current.parentElement;
        }
      }, LOCAL_WEB_CANVAS_BG);
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
