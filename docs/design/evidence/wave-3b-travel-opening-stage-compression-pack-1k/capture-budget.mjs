/**
 * Pack 1K — Fullscreen opening-stage vertical budget measurement + screenshots.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const LABEL = process.env.PACK_LABEL || 'after';

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

async function measureBudget(page) {
  return page.evaluate(() => {
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const topRail = document.querySelector('[data-testid="viona-global-top-rail"]');
    const heroShell = document.querySelector('[data-testid="travel-hero-card"]')
      || document.querySelector('[class*="heroCardShell"]');
    const heroStage =
      heroShell?.querySelector('[class*="heroImageClip"]')?.parentElement || heroShell;
    const heroCardsBridge = document.querySelector('[class*="heroCardsBridge"]');
    const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const utility = document.querySelector('[data-testid="travel-utility-grid"]');
    const utilCards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
      (e) => e.getAttribute('data-testid') !== 'travel-utility-grid'
    );
    const row1Cards = utilCards.slice(0, 4);
    const row2Cards = utilCards.slice(4, 8);
    const titleEl = utility?.querySelector('span, div')?.firstElementChild || utility?.firstElementChild?.children?.[0];

    const chromeBottom = topRail ? Math.round(rect(topRail).bottom) : 0;
    const heroR = rect(heroStage || heroShell);
    const bridgeR = rect(heroCardsBridge);
    const flagshipR = rect(flagship);
    const utilityR = rect(utility);

    const row1Bottom = row1Cards.length
      ? Math.round(Math.max(...row1Cards.map((c) => rect(c).bottom)))
      : null;
    const row2Bottom = row2Cards.length
      ? Math.round(Math.max(...row2Cards.map((c) => rect(c).bottom)))
      : null;

    const cardHeights = utilCards.map((c) => Math.round(rect(c).height));
    const gridGap = row1Cards.length && row2Cards.length
      ? Math.round(rect(row2Cards[0]).top - row1Bottom)
      : null;

    const vh = window.innerHeight;
    const cutOffPx = row2Bottom != null ? Math.max(0, row2Bottom - vh) : null;

    return {
      viewportHeightPx: vh,
      chromeNavHeightPx: chromeBottom,
      heroHeightPx: heroR ? Math.round(heroR.height) : null,
      heroBottomPx: heroR ? Math.round(heroR.bottom) : null,
      gapAfterHeroPx:
        heroR && bridgeR ? Math.round(bridgeR.top - heroR.bottom) : null,
      quickHelpHeightPx: flagshipR ? Math.round(flagshipR.height) : null,
      quickHelpBottomPx: flagshipR ? Math.round(flagshipR.bottom) : null,
      gapQuickHelpToSituationPx:
        flagshipR && utilityR ? Math.round(utilityR.top - flagshipR.bottom) : null,
      situationSectionHeightPx: utilityR ? Math.round(utilityR.height) : null,
      situationTitleHeightPx:
        utilityR && row1Cards.length
          ? Math.round(rect(row1Cards[0]).top - utilityR.top)
          : null,
      situationGridHeightPx:
        row1Bottom != null && utilityR
          ? Math.round(row2Bottom - (utilityR.top + (rect(row1Cards[0]).top - utilityR.top)))
          : null,
      situationCardHeightsPx: cardHeights,
      situationRowGapPx: gridGap,
      row2BottomPx: row2Bottom,
      row2FullyVisible: row2Bottom != null ? row2Bottom <= vh + 1 : null,
      cutOffAmountPx: cutOffPx,
      situationSectionBottomPx: utilityR ? Math.round(utilityR.bottom) : null,
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, capturedAt: new Date().toISOString() };

  for (const vp of [
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
    { name: '1366x768-normal', width: 1366, height: 768, fs: false },
    { name: '1024x768', width: 1024, height: 768, fs: false },
    { name: '768x1024', width: 768, height: 1024, fs: false },
    { name: '390x844', width: 390, height: 844, fs: false },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);
    all[vp.name] = await measureBudget(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-${vp.name}.png`), fullPage: false });
    console.log(
      `${vp.name}: row2=${all[vp.name].row2BottomPx} visible=${all[vp.name].row2FullyVisible} cut=${all[vp.name].cutOffAmountPx}px`
    );
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-budget.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
