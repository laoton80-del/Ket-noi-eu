/**
 * Local hero title one-line microfix QA.
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
  'wave-3b-local-dynamic-hero-title-one-line-final-microfix'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;

async function measureTitle(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="local-hero-title"]');
    if (!title) return { error: 'missing title' };
    const tr = title.getBoundingClientRect();
    const cs = getComputedStyle(title);
    const range = document.createRange();
    range.selectNodeContents(title);
    const lineCount = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    return {
      text: (title.textContent ?? '').trim(),
      width: Math.round(tr.width),
      height: Math.round(tr.height),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      whiteSpace: cs.whiteSpace,
      lineCount,
    };
  });
}

async function capture(page, route, name, fs = false) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-testid="local-hero-title"]', { timeout: 45000 });
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
  const box = await measureTitle(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(JSON.stringify({ name, title: box }, null, 2));
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
  });
  await capture(page, '/local', 'local-1366x768');
  await capture(page, '/local', 'local-1366x768-fullscreen', true);
  await page.setViewportSize({ width: 1024, height: 768 });
  await capture(page, '/local', 'local-1024x768');
  await page.setViewportSize({ width: 1366, height: 768 });
  await capture(page, '/travel', 'travel-1366x768-comparison');
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
