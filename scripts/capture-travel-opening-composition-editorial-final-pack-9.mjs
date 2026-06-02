/**
 * Travel opening composition editorial final — Pack 9 QA captures.
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
  'wave-3b-travel-opening-composition-editorial-final-pack-9'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;

const SHOTS = [
  { name: 'travel-1366x768-normal-default', width: 1366, height: 768 },
  { name: 'travel-1366x768-normal-airport', width: 1366, height: 768, hover: 'travel-flagship-airport' },
  { name: 'travel-1366x768-normal-interpreter', width: 1366, height: 768, hover: 'travel-flagship-translation' },
  { name: 'travel-1366x768-normal-transport', width: 1366, height: 768, hover: 'travel-flagship-taxi' },
  { name: 'travel-1366x768-fullscreen-default', width: 1366, height: 768, fullscreen: true },
  { name: 'travel-1366x768-fullscreen-airport', width: 1366, height: 768, fullscreen: true, hover: 'travel-flagship-airport' },
  { name: 'travel-1366x768-fullscreen-interpreter', width: 1366, height: 768, fullscreen: true, hover: 'travel-flagship-translation' },
  { name: 'travel-1366x768-fullscreen-transport', width: 1366, height: 768, fullscreen: true, hover: 'travel-flagship-taxi' },
  { name: 'travel-1024x768-default', width: 1024, height: 768 },
  { name: 'travel-768x1024-default', width: 768, height: 1024 },
  { name: 'travel-390x844-default', width: 390, height: 844 },
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

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await openTravel(page);
  await dismissGates(page);
  if (shot.fullscreen) await enterFullscreen(page);
  if (shot.hover) await hoverQuickHelp(page, shot.hover);
  await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: false });
  await page.close();
  console.log('captured', shot.name);
}

await browser.close();
console.log('done', OUT_DIR);
