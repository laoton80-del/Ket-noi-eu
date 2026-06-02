/**
 * Travel Local Assistance — DEEP_IMAGE_BALANCE PACK_6 QA.
 * Prereq: npx expo start --web --port 8095 --clear
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-travel-local-assistance-deep-image-balance-pack-6'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'local-assist-pack6-390x844', width: 390, height: 844 },
  { name: 'local-assist-pack6-768x1024', width: 768, height: 1024 },
  { name: 'local-assist-pack6-1024x768', width: 1024, height: 768 },
  { name: 'local-assist-pack6-1366x768', width: 1366, height: 768 },
  { name: 'local-assist-pack6-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
];

async function dismissGates(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  const locationGate = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await locationGate.isVisible({ timeout: 2000 }).catch(() => false)) {
    await locationGate.click();
  }
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  for (const route of ['/travel', '/tabs/travel', '/TravelHub']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForSelector('[data-testid="travel-local-assist-card"]', { timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel local assist not ready');
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function measure(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-testid="travel-local-assist-card"]');
    const scene = document.querySelector('[data-testid="travel-local-concierge-scene-panel"]');
    const search = document.querySelector('[data-testid="travel-local-discovery-search-action"]');
    const handoff = document.querySelector('[data-testid="travel-local-discovery-handoff-row"]');
    const cardRect = card?.getBoundingClientRect();
    const sceneRect = scene?.getBoundingClientRect();
    const text = card?.textContent ?? '';
    const sceneShare =
      cardRect && sceneRect && cardRect.height > 0
        ? Math.round((sceneRect.height / cardRect.height) * 100)
        : null;
    return {
      cardHeight: cardRect ? Math.round(cardRect.height) : null,
      sceneHeight: sceneRect ? Math.round(sceneRect.height) : null,
      sceneSharePercent: sceneShare,
      hasSearch: Boolean(search),
      hasHandoff: Boolean(handoff),
      hasSafety: text.includes('Không xác nhận đặt chỗ'),
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const metricsOut = [];
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(
        ({ intentKey, consentKey }) => {
          try {
            localStorage.setItem(intentKey, '1');
            localStorage.setItem('@app_language', 'vi');
            localStorage.setItem(consentKey, '0');
          } catch {
            /* ignore */
          }
        },
        { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
      );
      await openTravel(page);
      await dismissGates(page);
      if (vp.fullscreen) await enterFullscreen(page);
      await page.evaluate(({ mobile }) => {
        document
          .querySelector('[data-testid="travel-local-assist-card"]')
          ?.scrollIntoView({ block: mobile ? 'start' : 'center', behavior: 'instant' });
      }, { mobile: vp.width < 768 });
      await page.waitForTimeout(800);
      const metrics = await measure(page);
      metricsOut.push({ viewport: vp.name, metrics });
      console.log(JSON.stringify({ viewport: vp.name, metrics }, null, 2));
      await page.locator('[data-testid="travel-local-assist-card"]').screenshot({
        path: path.join(OUT_DIR, `${vp.name}.png`),
      });
      await page.close();
    }
    await writeFile(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metricsOut, null, 2), 'utf8');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
