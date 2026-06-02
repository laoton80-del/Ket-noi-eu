/**
 * Local hero true one-line proof — DOM height + screenshots.
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-local-hero-title-true-one-line-proof-fix'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;

function measureTitleDom() {
  const title = document.querySelector('[data-testid="local-hero-title"]');
  if (!title) return { error: 'missing local-hero-title' };
  const tr = title.getBoundingClientRect();
  const cs = getComputedStyle(title);
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.14;
  const range = document.createRange();
  range.selectNodeContents(title);
  const rectLines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
  const height = Math.round(tr.height);
  const lineCountByHeight = Math.max(1, Math.round(height / lh));
  return {
    text: (title.textContent ?? '').trim(),
    width: Math.round(tr.width),
    height,
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    lineHeightPx: lh,
    whiteSpace: cs.whiteSpace,
    lineCountRects: rectLines,
    lineCountByHeight,
    isTrueOneLine: rectLines === 1 && height <= lh * 1.2,
  };
}

async function openLocal(page, w, h, fs = false) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}/local`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="local-hero-title"]', { timeout: 60000 });
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  if (fs) {
    await page.evaluate(async () => {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    });
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(900);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
  });

  for (const [name, w, h, fs] of [
    ['local-1366x768', 1366, 768, false],
    ['local-1366x768-fullscreen', 1366, 768, true],
    ['local-1024x768', 1024, 768, false],
  ]) {
    await openLocal(page, w, h, fs);
    const dom = await page.evaluate(measureTitleDom);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(JSON.stringify({ name, dom }, null, 2));
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="travel-hero-editorial-text-layer"]', { timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'travel-1366x768-comparison.png') });
  console.log('OK travel-1366x768-comparison');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
