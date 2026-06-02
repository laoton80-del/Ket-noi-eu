/**
 * Pack 13 — hero title + Quick Help rendered hard-fix QA captures.
 * Prereq: npx expo start --web --port 8095
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
  'wave-3b-travel-hero-title-quickhelp-rendered-audit-hard-fix-pack-13'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8095}`;

const SHOTS = [
  { name: 'travel-1366x768-normal-default', width: 1366, height: 768 },
  { name: 'travel-1366x768-normal-airport-active', width: 1366, height: 768, click: 'travel-flagship-airport' },
  { name: 'travel-1366x768-normal-interpreter-active', width: 1366, height: 768, click: 'travel-flagship-translation' },
  { name: 'travel-1366x768-fullscreen-default', width: 1366, height: 768, fullscreen: true },
  {
    name: 'travel-1366x768-fullscreen-interpreter-active',
    width: 1366,
    height: 768,
    fullscreen: true,
    click: 'travel-flagship-translation',
  },
  { name: 'travel-1366x768-normal-hero-title-closeup', width: 1366, height: 768, clip: 'travel-dynamic-hero-stage' },
  { name: 'travel-1366x768-normal-quickhelp-closeup', width: 1366, height: 768, clip: 'travel-flagship-cards-row' },
  { name: 'travel-390x844-sanity', width: 390, height: 844 },
  { name: 'travel-1024x768-sanity', width: 1024, height: 768 },
];

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(400);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 90_000 });
  await dismissGates(page);
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
  if (shot.fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(600);
  }
  if (shot.click) {
    await page.locator(`[data-testid="${shot.click}"]`).click();
    await page.waitForTimeout(700);
  }
  if (shot.clip) {
    await page.locator(`[data-testid="${shot.clip}"]`).screenshot({
      path: path.join(OUT_DIR, `${shot.name}.png`),
    });
  } else {
    await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: false });
  }
  await page.close();
  console.log('captured', shot.name);
}

await browser.close();
console.log('done', OUT_DIR);
