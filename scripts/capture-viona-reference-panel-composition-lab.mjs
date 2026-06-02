/**
 * VIONA panel composition lab capture.
 * Prereq: EXPO_PUBLIC_VIONA_REFERENCE_PANEL_COMPOSITION_LAB=true npx expo start --web --port 8088
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-reference-panel-composition-lab');
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8088);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';

const VIEWPORTS = [
  { name: 'panel-composition-390x844', width: 390, height: 844 },
  { name: 'panel-composition-844x390', width: 844, height: 390 },
  { name: 'panel-composition-768x1024', width: 768, height: 1024 },
  { name: 'panel-composition-1024x768', width: 1024, height: 768 },
  { name: 'panel-composition-1366x768', width: 1366, height: 768 },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(500);
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
      await page.goto(`${BASE}/viona-reference-panel-composition-lab`, {
        waitUntil: 'domcontentloaded',
        timeout: 180_000,
      });
      await page.waitForSelector('[data-testid="viona-reference-panel-composition-lab"]', { timeout: 90_000 });
      await dismissIntentModal(page);
      await page.waitForSelector('[data-testid="viona-reference-panel-composition-panel"]', { timeout: 60_000 });
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}.png`), fullPage: true });
      console.log(`wrote ${vp.name}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
