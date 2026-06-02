/**
 * Travel Local Assistance — FINAL_CONTRAST_AND_BOTTOM_SPACING PACK_8 QA.
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
  'wave-3b-travel-local-assistance-final-contrast-bottom-spacing-pack-8'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const VIEWPORTS = [
  { name: 'local-assist-pack8-390x844', width: 390, height: 844 },
  { name: 'local-assist-pack8-768x1024', width: 768, height: 1024 },
  { name: 'local-assist-pack8-1024x768', width: 1024, height: 768 },
  { name: 'local-assist-pack8-1366x768', width: 1366, height: 768 },
  { name: 'local-assist-pack8-1366x768-fullscreen', width: 1366, height: 768, fullscreen: true },
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
      .waitForSelector('[data-testid="travel-connected-section"]', { timeout: 90_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error('Travel connected section not ready');
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
    const assist = document.querySelector('[data-testid="travel-local-assist-card"]');
    const connected = document.querySelector('[data-testid="travel-connected-section"]');
    const secondary = document.querySelector('[data-testid="travel-local-discovery-handoff-guides"]');
    const assistRect = assist?.getBoundingClientRect();
    const connectedRect = connected?.getBoundingClientRect();
    const gap =
      assistRect && connectedRect ? Math.round(connectedRect.top - assistRect.bottom) : null;
    const secStyle = secondary ? window.getComputedStyle(secondary) : null;
    const secLabel = secondary?.querySelector('span, div');
    const labelStyle =
      secLabel && secondary?.textContent?.includes('Local')
        ? window.getComputedStyle(secLabel)
        : null;
    const text = assist?.textContent ?? '';
    return {
      gapAssistToConnectedPx: gap,
      secondaryColor: secStyle?.color ?? null,
      secondaryBg: secStyle?.backgroundColor ?? null,
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
      await page.evaluate(() => {
        document
          .querySelector('[data-testid="travel-local-assist-section"]')
          ?.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
      await page.waitForTimeout(800);
      const metrics = await measure(page);
      metricsOut.push({ viewport: vp.name, metrics });
      console.log(JSON.stringify({ viewport: vp.name, metrics }, null, 2));
      const assist = await page.locator('[data-testid="travel-local-assist-card"]').boundingBox();
      const connected = await page.locator('[data-testid="travel-connected-section"]').boundingBox();
      if (assist && connected) {
        const y = Math.max(0, assist.y + assist.height * 0.55);
        const h = Math.min(vp.height - y, connected.y + connected.height - y + 24);
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.name}-lower-connected.png`),
          clip: { x: 0, y, width: vp.width, height: h },
        });
      }
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`), fullPage: false });
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
