/**
 * Pack 52B — Travel tile component closure QA (read-only screenshots).
 * Prereq: npx expo start --web --port 8096
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
  'wave-3b-travel-tile-component-closure-pack-52b'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8096);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const SHOTS = [
  { name: 'travel-1366x768-normal-opening', width: 1366, height: 768 },
  { name: 'travel-1366x768-fullscreen-opening', width: 1366, height: 768, fullscreen: true },
  {
    name: 'travel-1366x768-hover-translation-assist',
    width: 1366,
    height: 768,
    hover: 'travel-flagship-translation',
  },
  { name: 'travel-390x844-sanity', width: 390, height: 844 },
  { name: 'travel-1024x768-sanity', width: 1024, height: 768 },
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
      .waitForSelector('[data-testid="travel-hero-title"]', { timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel page not ready');
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function hoverQuickHelp(page, testId) {
  const el = page.locator(`[data-testid="${testId}"]`);
  await el.scrollIntoViewIfNeeded();
  await el.hover({ force: true });
  await page.waitForTimeout(800);
}

async function measure(page, shot) {
  return page.evaluate(
    ({ shotName, isFullscreen }) => {
      const title = document.querySelector('[data-testid="travel-hero-title"]');
      const titleStyle = title ? window.getComputedStyle(title) : null;
      const text = document.body.textContent ?? '';
      const rawKey = /\btravel\.[a-z0-9_.-]+\b/i.test(text);
      return {
        shot: shotName,
        isFullscreen,
        heroTitlePresent: Boolean(title),
        heroTitleFontSize: titleStyle?.fontSize ?? null,
        hasFlagshipRow: Boolean(document.querySelector('[data-testid="travel-flagship-cards-row"]')),
        hasSituationNetworkBg: Boolean(document.querySelector('[data-testid="travel-situation-network-bg"]')),
        hasSafetyCopy: text.includes('Không xác nhận đặt chỗ'),
        hasFakeLive: /\blive GPS\b|real-time tracking|đặt ngay|gọi fixer/i.test(text),
        rawI18nKey: rawKey,
        runtimeErrorBanner: Boolean(document.querySelector('[data-testid="travel-runtime-error"]')),
      };
    },
    { shotName: shot.name, isFullscreen: Boolean(shot.fullscreen) }
  );
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const allMetrics = [];
  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
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
      if (shot.fullscreen) await enterFullscreen(page);
      if (shot.hover) await hoverQuickHelp(page, shot.hover);
      await page.waitForTimeout(600);
      const metrics = await measure(page, shot);
      allMetrics.push(metrics);
      console.log(JSON.stringify(metrics, null, 2));
      await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: true });
      await page.close();
    }
    await writeFile(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(allMetrics, null, 2), 'utf8');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
