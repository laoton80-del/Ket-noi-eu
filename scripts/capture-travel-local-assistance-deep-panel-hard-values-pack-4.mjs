/**
 * Travel Local Assistance — DEEP_PANEL_HARD_VALUES PACK_4 QA captures.
 * Prereq: npx expo start --web --port 8095 --clear
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
  'wave-3b-travel-local-assistance-deep-panel-hard-values-pack-4'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'local-assist-pack4-390x844', width: 390, height: 844 },
  { name: 'local-assist-pack4-768x1024', width: 768, height: 1024 },
  { name: 'local-assist-pack4-1024x768', width: 1024, height: 768 },
  { name: 'local-assist-pack4-1366x768', width: 1366, height: 768 },
  { name: 'local-assist-pack4-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
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
  await page.waitForTimeout(600);
}

async function openTravelRoute(page) {
  for (const route of ['/travel', '/tabs/travel', '/TravelHub']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForFunction(
        () => Boolean(document.querySelector('[data-testid="travel-local-assist-card"]')),
        { timeout: 90_000 }
      )
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel local assist card not ready.');
}

async function scrollLocalAssist(page, mobile) {
  await page.evaluate(({ mobile: isMobile }) => {
    document
      .querySelector('[data-testid="travel-local-assist-card"]')
      ?.scrollIntoView({ block: isMobile ? 'start' : 'center', behavior: 'instant' });
  }, { mobile });
  await page.waitForTimeout(900);
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function measureLocalAssist(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-testid="travel-local-assist-card"]');
    const scene = card?.querySelector('[style*="height"]') ?? card?.querySelector('img')?.parentElement;
    const sceneShell = [...(card?.querySelectorAll('*') ?? [])].find((el) => {
      const h = el.getBoundingClientRect().height;
      return h >= 160 && h <= 360 && el.querySelector('[class*="concierge"]');
    });
    const allHeights = [...(card?.querySelectorAll('*') ?? [])]
      .map((el) => ({ tag: el.tagName, h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }))
      .filter((x) => x.h >= 170 && x.h <= 320 && x.w > 200)
      .slice(0, 8);
    const cardRect = card?.getBoundingClientRect();
    const text = card?.textContent ?? '';
    const searchTitle = card?.querySelector('[data-testid="travel-local-discovery-search-action"]');
    const titleEl = searchTitle?.querySelector('div')?.querySelector('span, div');
    const searchStyle = searchTitle ? window.getComputedStyle(searchTitle) : null;
    return {
      cardHeight: cardRect ? Math.round(cardRect.height) : null,
      cardMinHeight: card ? window.getComputedStyle(card).minHeight : null,
      sceneCandidates: allHeights,
      sceneShellHeight: sceneShell ? Math.round(sceneShell.getBoundingClientRect().height) : null,
      hasSafety: text.includes('Không xác nhận đặt chỗ'),
      hasForbidden: /đặt ngay|gọi fixer|điều phối|xác nhận|thanh toán|live GPS|real-time tracking/i.test(text),
      searchPadding: searchStyle?.padding,
    };
  });
}

async function screenshotCloseUp(page, outPath) {
  const card = page.locator('[data-testid="travel-local-assist-card"]');
  await card.waitFor({ state: 'visible', timeout: 30_000 });
  await card.screenshot({ path: outPath });
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
      await openTravelRoute(page);
      await dismissGates(page);
      if (vp.fullscreen) await enterFullscreen(page);
      await scrollLocalAssist(page, vp.width < 768);
      const metrics = await measureLocalAssist(page);
      metricsOut.push({ viewport: vp.name, metrics });
      console.log(JSON.stringify({ viewport: vp.name, metrics }, null, 2));
      await screenshotCloseUp(page, path.join(OUT_DIR, `${vp.name}.png`));
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-page.png`), fullPage: false });
      console.log(`Captured ${vp.name}`);
      await page.close();
    }
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metricsOut, null, 2), 'utf8')
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
