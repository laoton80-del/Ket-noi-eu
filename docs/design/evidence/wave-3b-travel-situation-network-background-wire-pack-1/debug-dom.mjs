import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
await ctx.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  localStorage.setItem('@app_language', 'vi');
});
const page = await ctx.newPage();
const port = Number(process.env.EXPO_CAPTURE_PORT || 8093);
await page.goto(`http://localhost:${port}/travel`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('[data-testid="travel-utility-grid"]', { timeout: 90000 });
await page.waitForTimeout(8000);
const info = await page.evaluate(() => ({
  bg: document.querySelectorAll('[data-testid="travel-situation-network-bg"]').length,
  grid: document.querySelectorAll('[data-testid="travel-utility-grid"]').length,
  imgsInGrid: document.querySelectorAll('[data-testid="travel-utility-grid"] img').length,
  situationIds: Array.from(document.querySelectorAll('[data-testid]'))
    .map((e) => e.getAttribute('data-testid'))
    .filter((id) => id?.includes('situation') || id?.includes('utility')),
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
