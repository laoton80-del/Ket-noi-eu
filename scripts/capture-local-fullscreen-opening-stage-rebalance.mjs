/**
 * Local fullscreen opening-stage rebalance QA captures.
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
  'wave-3b-local-fullscreen-opening-stage-rebalance'
);
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const LOCAL_WEB_CANVAS_BG = '#050B14';

const VIEWPORTS = [
  { name: 'local-fs-rebalance-390x844', width: 390, height: 844, fullscreen: false },
  { name: 'local-fs-rebalance-844x390', width: 844, height: 390, fullscreen: false },
  { name: 'local-fs-rebalance-768x1024', width: 768, height: 1024, fullscreen: false },
  { name: 'local-fs-rebalance-1024x768', width: 1024, height: 768, fullscreen: false },
  {
    name: 'local-fs-rebalance-1366x768',
    width: 1366,
    height: 768,
    fullscreen: false,
  },
  {
    name: 'local-fs-rebalance-1366x768-fullscreen',
    width: 1366,
    height: 768,
    fullscreen: true,
    viewportOnly: true,
  },
];

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function waitForLocalReadiness(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector('[data-testid="local-premium-shell"]') ||
          document.querySelector('[data-testid="local-opening-stage"]') ||
          document.querySelector('[data-testid="local-dynamic-hero"]')
      ),
    { timeout: 90_000 }
  );
}

async function openLocalRoute(page) {
  const waitForLocalSelector = () =>
    page
      .waitForFunction(
        () =>
          Boolean(
            document.querySelector('[data-testid="local-premium-shell"]') ||
              document.querySelector('[data-testid="local-opening-stage"]') ||
              document.querySelector('[data-testid="local-dynamic-hero"]')
          ),
        { timeout: 45_000 }
      )
      .then(() => true)
      .catch(() => false);

  for (const route of ['/local', '/tabs/local']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    if (await waitForLocalSelector()) return route;
  }
  throw new Error('Local route readiness failed.');
}

async function widenLocalShell(page) {
  await page.evaluate((canvasBg) => {
    document.documentElement.style.backgroundColor = canvasBg;
    document.body.style.backgroundColor = canvasBg;
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    const root = document.getElementById('local-hub-root');
    if (!(root instanceof HTMLElement)) return;
    root.style.backgroundColor = canvasBg;
    let current = root.parentElement;
    while (current && current !== document.body) {
      const maxWidth = window.getComputedStyle(current).maxWidth;
      if (maxWidth === '600px') {
        current.style.maxWidth = '100%';
        current.style.width = '100%';
      }
      current = current.parentElement;
    }
  }, LOCAL_WEB_CANVAS_BG);
}

async function enterFullscreen(page) {
  await page.evaluate(async () => {
    const root = document.documentElement;
    if (document.fullscreenElement) return;
    if (typeof root.requestFullscreen === 'function') {
      await root.requestFullscreen();
    }
  });
  await page.waitForFunction(() => Boolean(document.fullscreenElement), { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function countVisibleForYouRows(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('[data-testid="local-for-you-grid"]');
    if (!(grid instanceof HTMLElement)) return { rows: 0, pills: 0 };
    const pills = [...grid.querySelectorAll('[accessibilityrole="button"], [role="button"]')].filter(
      (node) => node instanceof HTMLElement && node.offsetParent !== null
    );
    const tops = pills.map((node) => node.getBoundingClientRect().top);
    const uniqueRows = [...new Set(tops.map((t) => Math.round(t)))].length;
    const viewportBottom = window.innerHeight;
    const visiblePills = pills.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= viewportBottom + 1;
    });
    const visibleTops = visiblePills.map((node) => node.getBoundingClientRect().top);
    const visibleRows = [...new Set(visibleTops.map((t) => Math.round(t)))].length;
    return { rows: uniqueRows, visibleRows, visiblePills: visiblePills.length, pills: pills.length };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(
        ({ key, canvasBg }) => {
          try {
            localStorage.setItem(key, '1');
          } catch {}
          document.documentElement.style.backgroundColor = canvasBg;
          document.body.style.backgroundColor = canvasBg;
        },
        { key: INTENT_KEY, canvasBg: LOCAL_WEB_CANVAS_BG }
      );
      await openLocalRoute(page);
      await waitForLocalReadiness(page);
      await dismissIntentModal(page);
      await page.waitForSelector('[data-testid="local-hero-cards-row"]', { timeout: 120_000 });
      await widenLocalShell(page);
      if (vp.fullscreen) {
        await enterFullscreen(page);
      }
      const metrics =
        vp.fullscreen && vp.width === 1366
          ? await countVisibleForYouRows(page)
          : null;
      const out = path.join(OUT_DIR, `${vp.name}.png`);
      await page.screenshot({
        path: out,
        fullPage: !vp.viewportOnly,
      });
      console.log(`wrote ${out}${metrics ? ` visibleRows=${metrics.visibleRows} visiblePills=${metrics.visiblePills}` : ''}`);
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
