/**
 * Runtime style trace — Local + Travel dynamic hero @1366 desktop.
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
    routes: ['/travel', '/tabs/travel', '/TravelHub'],
    layerTestId: 'travel-hero-editorial-text-layer',
    titleHint: 'průvodce',
  },
  {
    name: 'local',
    routes: ['/local', '/tabs/local', '/LocalHub'],
    layerTestId: 'local-hero-editorial-text-layer',
    titleHint: 'Vietnamese services',
  },
];

function pickLargestTextNode(root) {
  const candidates = [...root.querySelectorAll('*')].filter((el) => {
    const t = (el.textContent ?? '').trim();
    return t.length > 8 && el.children.length === 0;
  });
  let best = null;
  let bestSize = 0;
  for (const el of candidates) {
    const fs = parseFloat(getComputedStyle(el).fontSize || '0');
    if (fs > bestSize) {
      bestSize = fs;
      best = el;
    }
  }
  return best;
}

async function dismissIntentModal(page) {
  const question = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await question.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await question.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);
}

async function openRoute(page, routes, readySelector) {
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    const ok = await page
      .waitForSelector(readySelector, { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return route;
  }
  throw new Error(`Route readiness failed for ${readySelector}.`);
}

async function traceRoute(browser, cfg) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(
    ({ intentKey, consentKey }) => {
      localStorage.setItem(intentKey, '1');
      localStorage.setItem(consentKey, '0');
    },
    { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
  );
  const route = await openRoute(page, cfg.routes, `[data-testid="${cfg.layerTestId}"]`);
  await dismissIntentModal(page);
  await page.waitForTimeout(900);

  const trace = await page.evaluate(
    ({ layerTestId }) => {
      const layer = document.querySelector(`[data-testid="${layerTestId}"]`);
      if (!layer) return { error: `missing ${layerTestId}` };
      const layerCs = getComputedStyle(layer);
      const all = [...layer.querySelectorAll('*')].filter((el) => {
        const t = (el.textContent ?? '').trim();
        return t.length > 8 && el.children.length === 0;
      });
      const scored = all
        .map((el) => {
          const cs = getComputedStyle(el);
          return {
            text: (el.textContent ?? '').trim().slice(0, 80),
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            maxWidth: cs.maxWidth,
            width: cs.width,
            fontWeight: cs.fontWeight,
            whiteSpace: cs.whiteSpace,
            overflow: cs.overflow,
            textOverflow: cs.textOverflow,
            webkitLineClamp: cs.webkitLineClamp || cs.getPropertyValue('-webkit-line-clamp'),
            color: cs.color,
            webkitTextStroke: cs.webkitTextStroke || cs.getPropertyValue('-webkit-text-stroke'),
          };
        })
        .sort((a, b) => parseFloat(b.fontSize) - parseFloat(a.fontSize));

      const subtitle = all
        .map((el) => {
          const cs = getComputedStyle(el);
          const fs = parseFloat(cs.fontSize);
          return {
            text: (el.textContent ?? '').trim().slice(0, 80),
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            maxWidth: cs.maxWidth,
            width: cs.width,
            fs,
          };
        })
        .filter((x) => x.fs >= 14 && x.fs <= 22)
        .sort((a, b) => b.fs - a.fs)[0];

      const chips = layer.querySelector('[class*="trust"], [class*="Trust"]') ?? layer.lastElementChild;
      const chipsCs = chips ? getComputedStyle(chips) : null;

      return {
        layer: {
          testID: layerTestId,
          position: layerCs.position,
          width: layerCs.width,
          maxWidth: layerCs.maxWidth,
          minWidth: layerCs.minWidth,
          flexBasis: layerCs.flexBasis,
          alignSelf: layerCs.alignSelf,
          left: layerCs.left,
          top: layerCs.top,
        },
        titleCandidates: scored.slice(0, 3),
        subtitle,
        chipsRow: chipsCs
          ? {
              maxWidth: chipsCs.maxWidth,
              width: chipsCs.width,
              minWidth: chipsCs.minWidth,
              flexWrap: chipsCs.flexWrap,
            }
          : null,
        viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
      };
    },
    { layerTestId: cfg.layerTestId }
  );

  console.log(JSON.stringify({ route, cfg: cfg.name, trace }, null, 2));
  await page.close();
}

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    for (const cfg of ROUTES) {
      await traceRoute(browser, cfg);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
