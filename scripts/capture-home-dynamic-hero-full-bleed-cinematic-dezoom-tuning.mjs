/**
 * Home dynamic hero full-bleed cinematic de-zoom tuning QA captures.
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
  'wave-3b-home-dynamic-hero-full-bleed-cinematic-dezoom-tuning'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';

const VIEWPORTS = [
  { name: 'home-cinematic-dezoom-390x844', width: 390, height: 844 },
  { name: 'home-cinematic-dezoom-844x390', width: 844, height: 390 },
  { name: 'home-cinematic-dezoom-768x1024', width: 768, height: 1024 },
  { name: 'home-cinematic-dezoom-1024x768', width: 1024, height: 768 },
  { name: 'home-cinematic-dezoom-1366x768', width: 1366, height: 768 },
];

const WORLD_HOVERS = [
  { key: 'default', labels: [] },
  { key: 'local', labels: ['Místní', 'Local'] },
  { key: 'travel', labels: ['Cestování', 'Travel'] },
  { key: 'academy', labels: ['Akademie', 'Academy'] },
  { key: 'business', labels: ['Byznys', 'Business'] },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
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

async function hoverWorld(page, labels) {
  if (labels.length === 0) {
    await page.mouse.move(8, 8);
    await page.waitForTimeout(500);
    return;
  }
  const hovered = await page.evaluate((ls) => {
    const nodes = [...document.querySelectorAll('div, span, p')].filter(
      (el) => el instanceof HTMLElement && ls.some((l) => el.textContent?.trim() === l)
    );
    const card =
      nodes
        .map((el) => el.closest('[tabindex], button, [role="button"], a') ?? el.parentElement)
        .find(Boolean) ?? null;
    if (!(card instanceof HTMLElement)) return false;
    card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    card.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    return true;
  }, labels);
  if (!hovered) {
    const idx = labels.includes('Travel') || labels.includes('Cestování') ? 1 : 0;
    const coords = await page.evaluate((i) => {
      const slot = Math.max(120, (window.innerWidth - 48) / 4);
      return { x: Math.round(24 + slot * i + slot / 2), y: Math.round(window.innerHeight - 180) };
    }, idx);
    await page.mouse.move(coords.x, coords.y);
  }
  await page.waitForTimeout(900);
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
        } catch {
          /* ignore */
        }
      }, INTENT_KEY);
      await openHomeRoute(page);
      await dismissIntentModal(page);
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`), fullPage: false });
      console.log(`Captured ${vp.name}`);
      await page.close();
    }

    const hoverPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await hoverPage.addInitScript((key) => {
      try {
        localStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    }, INTENT_KEY);
    await openHomeRoute(hoverPage);
    await dismissIntentModal(hoverPage);
    for (const world of WORLD_HOVERS) {
      await hoverWorld(hoverPage, world.labels);
      const out = path.join(OUT_DIR, `home-cinematic-dezoom-1366x768-${world.key}.png`);
      await hoverPage.screenshot({ path: out, fullPage: false });
      console.log(`Captured ${world.key}`);
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
