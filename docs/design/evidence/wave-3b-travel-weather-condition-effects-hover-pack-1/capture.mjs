/**
 * Pack 1 — Weather condition effects + hover captures.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const BASE = `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const LABEL = process.env.PACK_LABEL || 'after';

const CARD_SAMPLES = [
  { id: 'today', mood: 'clear', label: 'sunny-clear' },
  { id: 't4', mood: 'lightRain', label: 'rain' },
  { id: 't3', mood: 'partlyCloudy', label: 'cloudy' },
  { id: 't7', mood: 'windy', label: 'wind' },
];

async function prep(page, fullscreen) {
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="travel-destination-context-weather-row"]', { timeout: 90000 });
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
  await page.evaluate(() => {
    document.querySelector('[data-testid="travel-destination-context-weather-row"]')?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  });
  await page.waitForTimeout(600);
}

async function measure(page) {
  return page.evaluate(() => {
    const row = document.querySelector('[data-testid="travel-destination-context-weather-row"]');
    const cards = [...document.querySelectorAll('[data-testid^="travel-destination-weather-mini-card-"]')];
    const effects = [...document.querySelectorAll('[data-testid^="travel-weather-condition-effect-"]')];
    const text = row?.textContent ?? '';
    return {
      cardCount: cards.length,
      effectLayerCount: effects.length,
      cardHeightPx: cards[0] ? Math.round(cards[0].getBoundingClientRect().height) : null,
      demoNotePresent: text.includes('thời tiết tham chiếu demo'),
      liveClaimAbsent: !text.match(/live|real-time|cập nhật theo giờ thực tế|thời tiết hiện tại/i),
      moods: effects.map((el) => el.getAttribute('data-testid')?.replace('travel-weather-condition-effect-', '')),
    };
  });
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const all = { label: LABEL, capturedAt: new Date().toISOString() };

  for (const vp of [
    { name: '390x844', width: 390, height: 844, fs: false },
    { name: '768x1024', width: 768, height: 1024, fs: false },
    { name: '1024x768', width: 1024, height: 768, fs: false },
    { name: '1366x768-normal', width: 1366, height: 768, fs: false },
    { name: '1366x768-fullscreen', width: 1366, height: 768, fs: true },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('@app_language', 'vi');
    });
    const page = await ctx.newPage();
    await prep(page, vp.fs);
    all[vp.name] = await measure(page);
    await page.locator('[data-testid="travel-destination-context-weather-row"]').screenshot({
      path: path.join(OUT, `${LABEL}-weather-row-${vp.name}.png`),
    });
    console.log(`${vp.name}: cards=${all[vp.name].cardCount} height=${all[vp.name].cardHeightPx}px`);
    await ctx.close();
  }

  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    localStorage.setItem('@app_language', 'vi');
  });
  const page = await ctx.newPage();
  await prep(page, false);

  for (const sample of CARD_SAMPLES) {
    const card = page.locator(`[data-testid="travel-destination-weather-mini-card-${sample.id}"]`);
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({
      path: path.join(OUT, `${LABEL}-weather-closeup-${sample.label}.png`),
    });
    const effect = page.locator(`[data-testid="travel-weather-condition-effect-${sample.mood}"]`).first();
    if (await effect.count()) {
      all[`closeup-${sample.label}-effect-present`] = true;
    }
  }

  const rainCard = page.locator('[data-testid="travel-destination-weather-mini-card-t4"]');
  await rainCard.hover({ force: true });
  await page.waitForTimeout(500);
  await rainCard.screenshot({ path: path.join(OUT, `${LABEL}-weather-closeup-rain-hover.png`) });
  all['rain-hover-captured'] = true;

  await ctx.close();
  await writeFile(path.join(OUT, `${LABEL}-weather-metrics.json`), JSON.stringify(all, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
