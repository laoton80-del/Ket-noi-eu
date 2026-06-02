/**
 * Pack 1H BEFORE diagnostic — rendered style audit
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'before');
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

async function measure(page, label) {
  await page.evaluate(async () => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    flagship?.scrollIntoView({ block: 'start', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 300));
  });
  await page.waitForTimeout(900);
  return page.evaluate(({ label }) => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const grid = document.querySelector('[data-testid="travel-utility-grid"]');
    const firstCard = document.querySelector('[data-testid^="travel-utility-"]:not([data-testid="travel-utility-grid"])');
    const fr = flagship?.getBoundingClientRect();
    const gr = grid?.getBoundingClientRect();
    const cr = firstCard?.getBoundingClientRect();
    const cs = firstCard ? window.getComputedStyle(firstCard) : null;
    const gridCs = grid ? window.getComputedStyle(grid) : null;
    const cards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
      (el) => el.getAttribute('data-testid') !== 'travel-utility-grid'
    );
    const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    let parent = grid?.parentElement;
    const parentStyles = [];
    for (let i = 0; i < 6 && parent; i++) {
      const st = window.getComputedStyle(parent);
      parentStyles.push({
        tag: parent.tagName,
        className: String(parent.className || '').slice(0, 80),
        backgroundColor: st.backgroundColor,
        opacity: st.opacity,
      });
      parent = parent.parentElement;
    }
    return {
      label,
      quickHelpToSituationGapPx: fr && gr ? Math.round(gr.top - fr.bottom) : null,
      gridTop: gr ? Math.round(gr.top) : null,
      gridHeight: gr ? Math.round(gr.height) : null,
      gridBottom: gr ? Math.round(gr.bottom) : null,
      viewportHeight: window.innerHeight,
      gridFullyVisible: gr ? gr.bottom <= window.innerHeight + 2 : null,
      cardHeights: heights,
      avgCardHeight: heights.length ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null,
      firstCardBg: cs?.backgroundColor,
      firstCardOpacity: cs?.opacity,
      firstCardMinHeight: cs?.minHeight,
      firstCardPadding: cs?.padding,
      gridBg: gridCs?.backgroundColor,
      parentChain: parentStyles,
    };
  }, { label });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const metrics = {};

  for (const vp of [
    { name: '1366x768', width: 1366, height: 768, fs: false },
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('[data-testid="travel-utility-grid"]', { timeout: 90000 });
    if (vp.fs) {
      await page.evaluate(async () => {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      });
      await page.waitForTimeout(800);
    }
    metrics[vp.name] = await measure(page, vp.name);
    await page.screenshot({ path: path.join(OUT, `${vp.name}.png`), fullPage: false });
    await ctx.close();
    console.log(JSON.stringify(metrics[vp.name], null, 2));
  }

  await writeFile(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
