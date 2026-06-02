/**
 * Travel final visual QA before commit — read-only captures + DOM metrics.
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
  'wave-3b-travel-final-visual-qa-before-commit-pack-review'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const SHOTS = [
  { name: 'travel-390x844-default', width: 390, height: 844 },
  { name: 'travel-768x1024-default', width: 768, height: 1024 },
  { name: 'travel-1024x768-default', width: 1024, height: 768 },
  { name: 'travel-1366x768-normal-default', width: 1366, height: 768 },
  { name: 'travel-1366x768-normal-airport', width: 1366, height: 768, hover: 'travel-flagship-airport' },
  { name: 'travel-1366x768-normal-interpreter', width: 1366, height: 768, hover: 'travel-flagship-translation' },
  { name: 'travel-1366x768-normal-transport', width: 1366, height: 768, hover: 'travel-flagship-taxi' },
  { name: 'travel-1366x768-normal-emergency', width: 1366, height: 768, hover: 'travel-flagship-emergency' },
  { name: 'travel-1366x768-fullscreen-default', width: 1366, height: 768, fullscreen: true },
  {
    name: 'travel-1366x768-fullscreen-interpreter',
    width: 1366,
    height: 768,
    fullscreen: true,
    hover: 'travel-flagship-translation',
  },
  {
    name: 'travel-1366x768-fullscreen-transport',
    width: 1366,
    height: 768,
    fullscreen: true,
    hover: 'travel-flagship-taxi',
  },
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
      const clipCheck = (el, parent) => {
        if (!el || !parent) return { clipped: false };
        const r = el.getBoundingClientRect();
        const p = parent.getBoundingClientRect();
        return {
          clipped: r.bottom > p.bottom + 1 || r.top < p.top - 1,
          bottomDelta: Math.round(r.bottom - p.bottom),
        };
      };
      const title = document.querySelector('[data-testid="travel-hero-title"]');
      const stage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const titleStyle = title ? window.getComputedStyle(title) : null;
      const scene = document.querySelector('[data-testid="travel-local-concierge-scene-panel"]');
      const assist = document.querySelector('[data-testid="travel-local-assist-card"]');
      const connected = document.querySelector('[data-testid="travel-connected-section"]');
      const assistRect = assist?.getBoundingClientRect();
      const connectedRect = connected?.getBoundingClientRect();
      const gapAssistConnected =
        assistRect && connectedRect ? Math.round(connectedRect.top - assistRect.bottom) : null;
      const text = document.body.textContent ?? '';
      const stack = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
      let subtitleEl = null;
      for (const el of stack?.children ?? []) {
        if (el !== title && (el.textContent?.length ?? 0) > 30) {
          subtitleEl = el;
          break;
        }
      }
      const primaryBtn = document.querySelector('[data-testid="travel-local-discovery-handoff-directions"]');
      const secondaryBtn = document.querySelector('[data-testid="travel-local-discovery-handoff-guides"]');
      return {
        shot: shotName,
        isFullscreen,
        heroTitleFontSize: titleStyle?.fontSize ?? null,
        heroTitleClip: clipCheck(title, stage),
        heroSubtitleClip: clipCheck(subtitleEl, stage),
        sceneHeight: scene ? Math.round(scene.getBoundingClientRect().height) : null,
        gapAssistToConnectedPx: gapAssistConnected,
        hasSituationNetworkBg: Boolean(document.querySelector('[data-testid="travel-situation-network-bg"]')),
        hasWeatherRow: Boolean(document.querySelector('[data-testid="travel-destination-context-weather-row"]')),
        hasFxRow: Boolean(document.querySelector('[data-testid="travel-destination-context-fx-row"]')),
        hasSafety: text.includes('Không xác nhận đặt chỗ'),
        hasFakeLive: /\blive GPS\b|real-time tracking|đặt ngay|gọi fixer/i.test(text),
        primaryHandoffFontSize: primaryBtn ? window.getComputedStyle(primaryBtn).fontSize : null,
        secondaryHandoffColor: secondaryBtn ? window.getComputedStyle(secondaryBtn).color : null,
        flagshipRow: Boolean(document.querySelector('[data-testid="travel-flagship-cards-row"]')),
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
