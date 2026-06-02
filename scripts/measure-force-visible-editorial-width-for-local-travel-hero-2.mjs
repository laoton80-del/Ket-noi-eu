/**
 * Measure rendered hero bounding boxes @1366 — Local + Travel.
 * Prereq: npx expo start --web --port 8093
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8093);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const ROUTES = [
  {
    name: 'travel',
    routes: ['/travel'],
    layerTestId: 'travel-hero-editorial-text-layer',
    titleTestId: 'travel-hero-title',
  },
  {
    name: 'local',
    routes: ['/local'],
    layerTestId: 'local-hero-editorial-text-layer',
    titleTestId: 'local-hero-title',
  },
];

function countTextLines(el) {
  if (!el) return 0;
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = range.getClientRects();
  const tops = [...rects].map((r) => Math.round(r.top));
  return new Set(tops).size;
}

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(800);
}

async function measureRoute(browser, cfg) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(
    ({ intentKey, consentKey }) => {
      localStorage.setItem(intentKey, '1');
      localStorage.setItem(consentKey, '0');
    },
    { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
  );
  for (const route of cfg.routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    if (await page.waitForSelector(`[data-testid="${cfg.layerTestId}"]`, { timeout: 45000 }).catch(() => null)) {
      break;
    }
  }
  await dismissIntentModal(page);

  const box = await page.evaluate(
    ({ layerTestId, titleTestId }) => {
      const layer = document.querySelector(`[data-testid="${layerTestId}"]`);
      const titleEl =
        document.querySelector(`[data-testid="${titleTestId}"]`) ??
        document.querySelector(`[data-testid="${titleTestId.replace(/-/g, '_')}"]`);
      if (!layer || !titleEl) {
        return { error: `missing layer=${!!layer} title=${!!titleEl}` };
      }

      const layerRect = layer.getBoundingClientRect();
      const titleRect = titleEl.getBoundingClientRect();
      const titleCs = getComputedStyle(titleEl);
      const layerCs = getComputedStyle(layer);

      const texts = [...layer.querySelectorAll('*')].filter((el) => {
        const t = (el.textContent ?? '').trim();
        return t.length > 12 && el.children.length === 0;
      });
      const subtitleEl = texts
        .map((el) => ({ el, fs: parseFloat(getComputedStyle(el).fontSize || '0') }))
        .filter((x) => x.fs >= 14 && x.fs <= 24 && x.el !== titleEl)
        .sort((a, b) => b.fs - a.fs)[0]?.el;

      const ctaRow =
        layer.querySelector('[class*="trust"], [class*="Trust"], [class*="cta"], [class*="Cta"]') ??
        layer.querySelector('div:last-child');

      const subtitleRect = subtitleEl?.getBoundingClientRect();
      const ctaRect = ctaRow?.getBoundingClientRect();

      const range = document.createRange();
      range.selectNodeContents(titleEl);
      const titleLineTops = [...range.getClientRects()].map((r) => Math.round(r.top));
      const titleLineCount = new Set(titleLineTops).size;

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        container: {
          x: Math.round(layerRect.x),
          y: Math.round(layerRect.y),
          width: Math.round(layerRect.width),
          height: Math.round(layerRect.height),
          computedWidth: layerCs.width,
          computedMaxWidth: layerCs.maxWidth,
          computedMinWidth: layerCs.minWidth,
          computedLeft: layerCs.left,
        },
        title: {
          x: Math.round(titleRect.x),
          y: Math.round(titleRect.y),
          width: Math.round(titleRect.width),
          height: Math.round(titleRect.height),
          lineCount: titleLineCount,
          fontSize: titleCs.fontSize,
          lineHeight: titleCs.lineHeight,
          maxWidth: titleCs.maxWidth,
          text: (titleEl.textContent ?? '').trim().slice(0, 120),
        },
        subtitle: subtitleEl
          ? {
              width: Math.round(subtitleRect.width),
              maxWidth: getComputedStyle(subtitleEl).maxWidth,
              fontSize: getComputedStyle(subtitleEl).fontSize,
              text: (subtitleEl.textContent ?? '').trim().slice(0, 120),
            }
          : null,
        ctaRow: ctaRow
          ? {
              width: Math.round(ctaRect.width),
              maxWidth: getComputedStyle(ctaRow).maxWidth,
            }
          : null,
      };
    },
    { layerTestId: cfg.layerTestId, titleTestId: cfg.titleTestId }
  );

  console.log(JSON.stringify({ route: cfg.name, measure: box }, null, 2));
  await page.close();
  return box;
}

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const results = {};
  try {
    for (const cfg of ROUTES) {
      results[cfg.name] = await measureRoute(browser, cfg);
    }
  } finally {
    await browser.close();
  }
  return results;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
