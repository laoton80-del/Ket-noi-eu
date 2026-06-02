/**
 * Editorial copy + line count QA — Local + Travel heroes.
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
  'wave-3b-dynamic-hero-editorial-copy-and-line-count-fix'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;

const VIEWPORTS = [
  { name: 'travel-1366x768', route: '/travel', w: 1366, h: 768 },
  { name: 'travel-1366x768-fullscreen', route: '/travel', w: 1366, h: 768, fs: true },
  { name: 'travel-1024x768', route: '/travel', w: 1024, h: 768 },
  { name: 'local-1366x768', route: '/local', w: 1366, h: 768 },
  { name: 'local-1366x768-fullscreen', route: '/local', w: 1366, h: 768, fs: true },
  { name: 'local-1024x768', route: '/local', w: 1024, h: 768 },
];

function titleLineCount(titleEl) {
  const range = document.createRange();
  range.selectNodeContents(titleEl);
  return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
}

async function measure(page, titleId) {
  return page.evaluate((titleId) => {
    const title = document.querySelector(`[data-testid="${titleId}"]`);
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
      lineCount,
    };
  }, titleId);
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
      localStorage.setItem('i18nextLng', 'vi');
    });
    await page.goto(`${BASE}${vp.route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('[data-testid$="hero-title"]', { timeout: 45000 });
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
    await page.waitForTimeout(900);
    const titleId = vp.route.includes('travel') ? 'travel-hero-title' : 'local-hero-title';
    const box = await measure(page, titleId);
    await page.screenshot({ path: path.join(OUT, `${vp.name}.png`) });
    console.log(JSON.stringify({ viewport: vp.name, title: box }, null, 2));
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
