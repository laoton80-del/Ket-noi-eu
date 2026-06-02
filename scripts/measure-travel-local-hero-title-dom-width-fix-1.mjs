/**
 * DOM proof — title vs wrapper bounding boxes @1366.
 * Prereq: npx expo start --web --port 8093
 */
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;

function lineCountFromRects(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
}

async function measureRoute(page, route, layerId, titleId) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector(`[data-testid="${layerId}"]`, { timeout: 45000 });
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
  }
  await page.waitForTimeout(900);
  return page.evaluate(
    ({ layerId, titleId }) => {
      const layer = document.querySelector(`[data-testid="${layerId}"]`);
      const title = document.querySelector(`[data-testid="${titleId}"]`);
      if (!layer || !title) return { error: 'missing nodes' };
      const lr = layer.getBoundingClientRect();
      const tr = title.getBoundingClientRect();
      const tcs = getComputedStyle(title);
      const lh = parseFloat(tcs.lineHeight) || parseFloat(tcs.fontSize) * 1.1;
      const range = document.createRange();
      range.selectNodeContents(title);
      const lineRects = [...range.getClientRects()];
      const lineCount = new Set(lineRects.map((r) => Math.round(r.top))).size;
      const subtitle = [...layer.querySelectorAll('*')].find((el) => {
        if (el === title || el.contains(title)) return false;
        const fs = parseFloat(getComputedStyle(el).fontSize || '0');
        const t = (el.textContent ?? '').trim();
        return fs >= 14 && fs <= 24 && t.length > 20 && el.children.length === 0;
      });
      const chip = layer.querySelector('[class*="trust"], [class*="Trust"], [class*="cta"], [class*="Cta"]');
      const sr = subtitle?.getBoundingClientRect();
      const cr = chip?.getBoundingClientRect();
      return {
        wrapper: {
          x: Math.round(lr.x),
          y: Math.round(lr.y),
          width: Math.round(lr.width),
          height: Math.round(lr.height),
        },
        title: {
          x: Math.round(tr.x),
          y: Math.round(tr.y),
          width: Math.round(tr.width),
          height: Math.round(tr.height),
          fontSize: tcs.fontSize,
          lineHeight: tcs.lineHeight,
          lineCount,
          lineCountEstimate: Math.max(1, Math.round(tr.height / lh)),
          maxWidth: tcs.maxWidth,
          widthCss: tcs.width,
          flexShrink: tcs.flexShrink,
        },
        subtitle: sr
          ? { width: Math.round(sr.width), maxWidth: getComputedStyle(subtitle).maxWidth }
          : null,
        chipRow: cr ? { width: Math.round(cr.width) } : null,
      };
    },
    { layerId, titleId }
  );
}

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  for (const [name, route, layerId, titleId] of [
    ['travel', '/travel', 'travel-hero-editorial-text-layer', 'travel-hero-title'],
    ['local', '/local', 'local-hero-editorial-text-layer', 'local-hero-title'],
  ]) {
    const m = await measureRoute(page, route, layerId, titleId);
    console.log(JSON.stringify({ name, before: m }, null, 2));
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
