/**
 * Home hero semantic/frame + For You scale QA captures.
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-home-polish');
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';

const VIEWPORTS = [
  { name: 'home-polish-390x844', width: 390, height: 844 },
  { name: 'home-polish-844x390', width: 844, height: 390 },
  { name: 'home-polish-768x1024', width: 768, height: 1024 },
  { name: 'home-polish-1024x768', width: 1024, height: 768 },
  { name: 'home-polish-1366x768', width: 1366, height: 768 },
];

const WORLD_HOVERS = ['local', 'travel', 'academy', 'business'];

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
  for (const route of ['/', '/tabs/home', '/home']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForFunction(
        () =>
          Boolean(
            document.querySelector('[data-testid="home-hero-network-edge"]') ||
              document.body.textContent?.includes('VIONA')
          ),
        { timeout: 45_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Home route readiness failed.');
}

async function hoverWorldCard(page, cardIndex) {
  const coords = await page.evaluate((index) => {
    const hero = document.querySelector('[data-testid="home-hero-network-edge"]');
    let heroBottom = 420;
    if (hero) {
      const rect = hero.getBoundingClientRect();
      if (Number.isFinite(rect.bottom) && rect.bottom > 0) heroBottom = rect.bottom;
    }
    const slot = Math.max(120, (window.innerWidth - 48) / 4);
    const x = 24 + slot * index + slot / 2;
    const y = Math.min(window.innerHeight - 48, heroBottom + 96);
    return { x: Math.round(x), y: Math.round(y) };
  }, cardIndex);
  await page.mouse.move(coords.x, coords.y);
  await page.waitForTimeout(320);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript((key) => {
        try {
          localStorage.setItem(key, '1');
        } catch {}
      }, INTENT_KEY);
      await openHomeRoute(page);
      await waitForHomeReadiness(page);
      await dismissIntentModal(page);
      const out = path.join(OUT_DIR, `${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`wrote ${out}`);
      await page.close();
    }

    const hoverPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await hoverPage.addInitScript((key) => {
      try {
        localStorage.setItem(key, '1');
      } catch {}
    }, INTENT_KEY);
    await openHomeRoute(hoverPage);
    await waitForHomeReadiness(hoverPage);
    await dismissIntentModal(hoverPage);

    for (let i = 0; i < WORLD_HOVERS.length; i += 1) {
      await hoverWorldCard(hoverPage, i);
      const out = path.join(OUT_DIR, `home-polish-1366x768-hover-${WORLD_HOVERS[i]}.png`);
      await hoverPage.screenshot({ path: out, fullPage: false });
      console.log(`wrote ${out}`);
    }
    await hoverPage.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
