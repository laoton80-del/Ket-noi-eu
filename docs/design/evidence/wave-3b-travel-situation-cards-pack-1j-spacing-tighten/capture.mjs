/**
 * Pack 1J — Quick Help → Situation spacing measurement + screenshots.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="travel-utility-grid"]', { timeout: 90000 });
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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

async function measureLayout(page) {
  return page.evaluate(() => {
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const utility = document.querySelector('[data-testid="travel-utility-grid"]');
    const grid = document.querySelector('[data-testid="travel-situation-grid-row"]');
    const rows = document.querySelectorAll('[data-testid="travel-situation-grid-row"], [data-testid^="travel-situation-row-"]');
    const allRows = Array.from(document.querySelectorAll('[data-testid="travel-situation-grid-row"]')).length
      ? document.querySelectorAll('[data-testid="travel-situation-grid-row"]')
      : document.querySelectorAll('.situationGlassGridRow, [class*="situationGlassGridRow"]');

    const flagshipRect = flagship?.getBoundingClientRect();
    const utilityRect = utility?.getBoundingClientRect();
    const gridRows = document.querySelectorAll('[data-testid="travel-utility-grid"] [class*="situationGlassGridRow"]');
    const rowEls = gridRows.length >= 2 ? gridRows : document.querySelectorAll('[data-testid="travel-utility-grid"] > div > div > div > div > div');

    let row1 = null;
    let row2 = null;
    const gridContainer = document.querySelector('[data-testid="travel-utility-grid"]');
    if (gridContainer) {
      const rowNodes = gridContainer.querySelectorAll('[class*="situationGlassGridRow"]');
      if (rowNodes.length >= 2) {
        row1 = rowNodes[0].getBoundingClientRect();
        row2 = rowNodes[1].getBoundingClientRect();
      }
    }

    const utilCards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
      (el) => el.getAttribute('data-testid') !== 'travel-utility-grid'
    );
    const row2Cards = utilCards.slice(4, 8);
    const row2Bottom = row2Cards.length
      ? Math.max(...row2Cards.map((el) => el.getBoundingClientRect().bottom))
      : null;

    const gap =
      flagshipRect && utilityRect ? Math.round(utilityRect.top - flagshipRect.bottom) : null;

    const quickHelpHeight = flagshipRect ? Math.round(flagshipRect.height) : null;
    const situationTotalHeight = utilityRect ? Math.round(utilityRect.height) : null;

    const row2Visible = row2Bottom != null ? row2Bottom <= window.innerHeight + 1 : null;
    const row2BottomPx = row2Bottom != null ? Math.round(row2Bottom) : null;
    const viewportH = window.innerHeight;

    const titleEl = utility?.querySelector('[class*="utilityPrompt"]') || utility?.firstElementChild?.firstElementChild;
    const titleRect = titleEl?.getBoundingClientRect();
    const headerHeight =
      titleRect && utilityRect ? Math.round(titleRect.bottom - utilityRect.top) : null;
    const gridHeight =
      headerHeight != null && situationTotalHeight != null
        ? situationTotalHeight - headerHeight
        : null;

    return {
      gapQuickHelpToSituationPx: gap,
      quickHelpSectionHeightPx: quickHelpHeight,
      situationSectionHeightPx: situationTotalHeight,
      situationHeaderHeightPx: headerHeight,
      situationGridHeightPx: gridHeight,
      situationGridBottomPx: utilityRect ? Math.round(utilityRect.bottom) : null,
      row2BottomPx,
      row2FullyVisible: row2Visible,
      viewportHeightPx: viewportH,
      scrollY: window.scrollY,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const metrics = { label: process.env.PACK_LABEL || 'after', capturedAt: new Date().toISOString() };

  for (const vp of [
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
    { name: '1366x768-normal', width: 1366, height: 768, fs: false },
    { name: '390x844', width: 390, height: 844, fs: false },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);

    metrics[vp.name] = await measureLayout(page);

    if (vp.name.startsWith('1366')) {
      await page.screenshot({
        path: path.join(OUT, `${metrics.label}-${vp.name}.png`),
        fullPage: false,
      });
      const flagship = page.locator('[data-testid="travel-flagship-cards-row"]');
      const utility = page.locator('[data-testid="travel-utility-grid"]');
      const flagshipBox = await flagship.boundingBox();
      const utilityBox = await utility.boundingBox();
      if (flagshipBox && utilityBox) {
        const y = Math.max(0, flagshipBox.y - 8);
        const h = utilityBox.y + utilityBox.height - y + 8;
        await page.screenshot({
          path: path.join(OUT, `${metrics.label}-boundary-${vp.name}.png`),
          clip: { x: 0, y, width: vp.width, height: Math.min(h, vp.height - y) },
        });
      }
    } else {
      await page.screenshot({
        path: path.join(OUT, `${metrics.label}-${vp.name}.png`),
        fullPage: false,
      });
    }

    console.log(`${vp.name}: gap=${metrics[vp.name].gapQuickHelpToSituationPx}px row2Visible=${metrics[vp.name].row2FullyVisible}`);
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${metrics.label}-metrics.json`), JSON.stringify(metrics, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
