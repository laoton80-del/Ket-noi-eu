/**
 * Force visible editorial width — QA captures (Local + Travel heroes).
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
  'wave-3b-force-visible-editorial-width-for-local-travel-hero-2'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;
const VIEWPORTS = [
  { name: 'travel-1366x768', route: 'travel', w: 1366, h: 768 },
  { name: 'travel-1366x768-fullscreen', route: 'travel', w: 1366, h: 768, fs: true },
  { name: 'travel-1024x768', route: 'travel', w: 1024, h: 768 },
  { name: 'local-1366x768', route: 'local', w: 1366, h: 768 },
  { name: 'local-1366x768-fullscreen', route: 'local', w: 1366, h: 768, fs: true },
  { name: 'local-1024x768', route: 'local', w: 1024, h: 768 },
];
const ROUTES = {
  travel: { paths: ['/travel'], ready: 'travel-hero-editorial-text-layer' },
  local: { paths: ['/local'], ready: 'local-hero-editorial-text-layer' },
};

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const cfg = ROUTES[vp.route];
    for (const p of cfg.paths) {
      await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      if (await page.waitForSelector(`[data-testid="${cfg.ready}"]`, { timeout: 45000 }).catch(() => null)) {
        break;
      }
    }
    const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
    if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByText('Để sau', { exact: true }).click();
    }
    if (vp.fs) {
      await page.evaluate(async () => {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      });
      await page.waitForTimeout(800);
    }
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`) });
    console.log(`OK ${vp.name}`);
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
