/**
 * Pack 1H AFTER capture + rendered style audit
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'after');
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

const VIEWPORTS = [
  { name: 'situation-1h-390x844', width: 390, height: 844 },
  { name: 'situation-1h-768x1024', width: 768, height: 1024 },
  { name: 'situation-1h-1024x768', width: 1024, height: 768 },
  { name: 'situation-1h-1366x768', width: 1366, height: 768 },
  { name: 'situation-1h-1366x768-fullscreen', width: 1366, height: 768, fs: true },
];

async function measure(page) {
  await page.evaluate(async () => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    flagship?.scrollIntoView({ block: 'start', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
  });
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    const firstCard = document.querySelector('[data-testid^="travel-utility-"]:not([data-testid="travel-utility-grid"])');
    const fr = flagship?.getBoundingClientRect();
    const gr = grid?.getBoundingClientRect();
    const cs = firstCard ? window.getComputedStyle(firstCard) : null;
    const cards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
      (el) => el.getAttribute('data-testid') !== 'travel-utility-grid'
    );
    const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    let parent = grid?.parentElement;
    const parentStyles = [];
    for (let i = 0; i < 5 && parent; i++) {
      const st = window.getComputedStyle(parent);
      parentStyles.push({ backgroundColor: st.backgroundColor, opacity: st.opacity });
      parent = parent.parentElement;
    }
    return {
      quickHelpToSituationGapPx: fr && gr ? Math.round(gr.top - fr.bottom) : null,
      gridTop: gr ? Math.round(gr.top) : null,
      gridHeight: gr ? Math.round(gr.height) : null,
      gridBottom: gr ? Math.round(gr.bottom) : null,
      viewportHeight: window.innerHeight,
      gridFullyVisible: gr ? gr.bottom <= window.innerHeight + 2 : null,
      cardHeights: heights,
      avgCardHeight: heights.length ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null,
      firstCardBg: cs?.backgroundColor,
      firstCardHeight: cs?.height,
      firstCardMinHeight: cs?.minHeight,
      parentChain: parentStyles,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const metrics = {};

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('[data-testid="travel-utility-grid"]', { timeout: 90000 });
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
    metrics[vp.name] = await measure(page);
    await page.locator('[data-testid="travel-utility-grid"]').screenshot({ path: path.join(OUT, `${vp.name}.png`) });
    if (vp.fs) {
      await page.screenshot({ path: path.join(OUT, `${vp.name}-viewport.png`), fullPage: false });
    }
    await ctx.close();
    console.log(`${vp.name}: gap=${metrics[vp.name].quickHelpToSituationGapPx}px cards=${metrics[vp.name].avgCardHeight}px bg=${metrics[vp.name].firstCardBg}`);
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
