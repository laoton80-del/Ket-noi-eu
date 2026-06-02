/**
 * VIONA.UI.TRAVEL.QUICK_HELP_HERO_COLOR_SYNC_AND_DOUBLE_FRAME_FIX.PACK_1
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

async function prep(page, { fullscreen, interpreter }) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('[data-testid="travel-flagship-cards-row"]', { timeout: 90000 });
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  if (fullscreen) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(800);
  }
  if (interpreter) {
    await page.locator('[data-testid="travel-flagship-translation"]').hover();
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(4000);
}

async function measureQuickHelp(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-testid^="travel-flagship-"]')].filter(
      (el) => el.getAttribute('data-testid') !== 'travel-flagship-cards-row'
    );
    const interpreter = document.querySelector('[data-testid="travel-flagship-translation"]');
    const hero = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const cardRects = cards.map((el) => {
      const rect = r(el);
      return rect ? { testId: el.getAttribute('data-testid'), width: Math.round(rect.width), height: Math.round(rect.height) } : null;
    });
    return {
      quickHelpCardCount: cards.length,
      cardRects,
      interpreterPresent: Boolean(interpreter),
      heroPresent: Boolean(hero),
      heroText: hero?.textContent?.slice(0, 120) ?? null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { capturedAt: new Date().toISOString() };

  const shots = [
    { name: '1366x768-normal-default', width: 1366, height: 768, fullscreen: false, interpreter: false, target: 'page' },
    { name: '1366x768-normal-interpreter', width: 1366, height: 768, fullscreen: false, interpreter: true, target: 'page' },
    { name: '1366x768-fullscreen-default', width: 1366, height: 768, fullscreen: true, interpreter: false, target: 'page' },
    { name: '1366x768-fullscreen-interpreter', width: 1366, height: 768, fullscreen: true, interpreter: true, target: 'page' },
    { name: '1366x768-fullscreen-quickhelp-closeup', width: 1366, height: 768, fullscreen: true, interpreter: false, target: 'row' },
    { name: '390x844-sanity', width: 390, height: 844, fullscreen: false, interpreter: false, target: 'page' },
  ];

  for (const shot of shots) {
    const ctx = await browser.newContext({ viewport: { width: shot.width, height: shot.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, shot);
    all[shot.name] = await measureQuickHelp(page);
    const locator =
      shot.target === 'row'
        ? page.locator('[data-testid="travel-flagship-cards-row"]')
        : page.locator('body');
    await locator.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
    console.log(`${shot.name}: cards=${all[shot.name].quickHelpCardCount}`);
    await ctx.close();
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
