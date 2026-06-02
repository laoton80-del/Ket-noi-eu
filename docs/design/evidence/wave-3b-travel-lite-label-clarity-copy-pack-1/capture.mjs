/**
 * Pack 1 — Travel Lite label clarity captures.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const LABEL = process.env.PACK_LABEL || 'after';

async function prep(page) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="travel-pilot-strip"]', { timeout: 90000 });
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  await page.evaluate(() => {
    document.querySelector('[data-testid="travel-pilot-strip"]')?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(600);
}

async function measure(page) {
  return page.evaluate(() => {
    const strip = document.querySelector('[data-testid="travel-pilot-strip"]');
    const text = strip?.textContent ?? '';
    return {
      titlePresent: text.includes('Travel Lite · Hỗ trợ du lịch an toàn'),
      subtitlePresent: text.includes('Chỉ dẫn sân bay, di chuyển, phiên dịch và tình huống'),
      pillSafe: text.includes('Chỉ dẫn an toàn'),
      pillDemo: text.includes('Hỗ trợ demo'),
      pillNoPay: text.includes('Không thanh toán'),
      oldTitleGone: !text.includes('Travel Lite (thử nghiệm)'),
      oldSubtitleGone: !text.includes('Chỉ hỗ trợ ngôn ngữ & tình huống'),
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, capturedAt: new Date().toISOString() };

  for (const vp of [
    { name: '390x844', width: 390, height: 844 },
    { name: '1366x768-normal', width: 1366, height: 768 },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page);
    all[vp.name] = await measure(page);
    await page.locator('[data-testid="travel-pilot-strip"]').screenshot({
      path: path.join(OUT, `${LABEL}-lite-panel-${vp.name}.png`),
    });
    console.log(JSON.stringify(all[vp.name]));
    await ctx.close();
  }

  await writeFile(path.join(OUT, `${LABEL}-lite-panel-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
