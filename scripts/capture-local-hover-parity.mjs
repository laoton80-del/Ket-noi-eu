/**
 * Local card hover parity QA — prereq: npx expo start --web --port 8093
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-local-hover-parity');
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const LOCAL_WEB_CANVAS_BG = '#050B14';

const VIEWPORTS = [
  { name: 'local-hover-1366x768', width: 1366, height: 768 },
  { name: 'local-hover-1024x768', width: 1024, height: 768 },
];

const CARD_TEST_IDS = [
  'local-tile-my-requests',
  'local-cta-booking-assist',
  'local-tile-legal-wealth',
  'local-cta-browse-services',
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function openLocal(page) {
  for (const route of ['/local', '/tabs/local']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForSelector('[data-testid="local-hero-cards-row"]', { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return;
  }
  throw new Error('Local route failed');
}

async function hoverCard(page, testId) {
  const el = page.locator(`[data-testid="${testId}"]`);
  await el.waitFor({ state: 'visible', timeout: 15_000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`No box for ${testId}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(320);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(
        ({ key, bg }) => {
          try {
            localStorage.setItem(key, '1');
          } catch {}
          document.documentElement.style.backgroundColor = bg;
          document.body.style.backgroundColor = bg;
        },
        { key: INTENT_KEY, bg: LOCAL_WEB_CANVAS_BG }
      );
      await openLocal(page);
      await dismissIntentModal(page);
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-default.png`), fullPage: false });
      for (const testId of CARD_TEST_IDS) {
        await hoverCard(page, testId);
        const slug = testId.replace(/^local-/, '');
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.name}-hover-${slug}.png`),
          fullPage: false,
        });
        console.log(`wrote ${vp.name} hover ${slug}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
