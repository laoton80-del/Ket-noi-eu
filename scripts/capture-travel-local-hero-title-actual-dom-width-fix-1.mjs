/**
 * Title DOM width proof + final captures.
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-travel-local-hero-title-actual-dom-width-fix-1');
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;

async function domBox(page, route, layerId, titleId) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector(`[data-testid="${titleId}"]`, { timeout: 45000 });
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  await page.waitForTimeout(900);
  return page.evaluate(
    ({ layerId, titleId }) => {
      const layer = document.querySelector(`[data-testid="${layerId}"]`);
      const title = document.querySelector(`[data-testid="${titleId}"]`);
      const lr = layer.getBoundingClientRect();
      const tr = title.getBoundingClientRect();
      const cs = getComputedStyle(title);
      const lh = parseFloat(cs.lineHeight) || 48;
      const range = document.createRange();
      range.selectNodeContents(title);
      const lc = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
      return {
        wrapper: { x: Math.round(lr.x), width: Math.round(lr.width) },
        title: {
          x: Math.round(tr.x),
          width: Math.round(tr.width),
          height: Math.round(tr.height),
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          lineCount: lc,
          lineCountEst: Math.max(1, Math.round(tr.height / lh)),
          widthCss: cs.width,
          maxWidthCss: cs.maxWidth,
        },
      };
    },
    { layerId, titleId }
  );
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const suffix = process.argv[2] ?? '-title-proof';
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  for (const [name, route, layerId, titleId] of [
    ['travel', '/travel', 'travel-hero-editorial-text-layer', 'travel-hero-title'],
    ['local', '/local', 'local-hero-editorial-text-layer', 'local-hero-title'],
  ]) {
    const box = await domBox(page, route, layerId, titleId);
    await page.screenshot({ path: path.join(OUT, `${name}-1366x768${suffix}.png`) });
    console.log(JSON.stringify({ name, suffix, box }, null, 2));
  }
  if (suffix === '-final') {
    for (const [name, route, fs] of [
      ['travel', '/travel', false],
      ['travel', '/travel', true],
      ['local', '/local', false],
      ['local', '/local', true],
    ]) {
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid$="hero-title"]', { timeout: 45000 });
      if (fs) {
        await page.evaluate(async () => {
          if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        });
        await page.waitForTimeout(800);
      }
      await page.waitForTimeout(600);
      const tag = fs ? `${name}-1366x768-fullscreen-final` : `${name}-1366x768-final`;
      await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
      console.log(`OK ${tag}`);
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
