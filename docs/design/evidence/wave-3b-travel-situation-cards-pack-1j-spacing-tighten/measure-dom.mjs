import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
const page = await ctx.newPage();
await page.goto('http://localhost:8093/travel', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-testid="travel-utility-grid"]');
await page.evaluate(async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
});
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0));

const m = await page.evaluate(() => {
  const r = (el) => (el ? el.getBoundingClientRect() : null);
  const flagship = document.querySelector('[data-testid="travel-flagship-cards-row"]');
  const utility = document.querySelector('[data-testid="travel-utility-grid"]');
  const flagshipCards = [...document.querySelectorAll('[data-testid^="travel-flagship-"]')].filter(
    (el) => el.getAttribute('data-testid') !== 'travel-flagship-cards-row'
  );
  const utilCards = [...document.querySelectorAll('[data-testid^="travel-utility-"]')].filter(
    (el) => el.getAttribute('data-testid') !== 'travel-utility-grid'
  );
  const lastFlagship = flagshipCards[flagshipCards.length - 1];
  const row2Cards = utilCards.slice(4, 8);
  const row2Bottom = row2Cards.length
    ? Math.max(...row2Cards.map((el) => r(el).bottom))
    : null;

  return {
    vh: window.innerHeight,
    flagship: r(flagship) && {
      top: Math.round(r(flagship).top),
      bottom: Math.round(r(flagship).bottom),
      h: Math.round(r(flagship).height),
    },
    lastFlagshipCardBottom: lastFlagship ? Math.round(r(lastFlagship).bottom) : null,
    utility: r(utility) && {
      top: Math.round(r(utility).top),
      bottom: Math.round(r(utility).bottom),
      h: Math.round(r(utility).height),
    },
    gapWrapToUtility: r(flagship) && r(utility) ? Math.round(r(utility).top - r(flagship).bottom) : null,
    gapCardToUtility: lastFlagship && r(utility) ? Math.round(r(utility).top - r(lastFlagship).bottom) : null,
    row2BottomPx: row2Bottom ? Math.round(row2Bottom) : null,
    row2Visible: row2Bottom ? row2Bottom <= window.innerHeight + 1 : null,
    utilCardCount: utilCards.length,
  };
});

console.log(JSON.stringify(m, null, 2));
await browser.close();
