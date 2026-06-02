/**
 * Pack 32 — Travel mobile legacy floating overlay removal QA.
 * Prereq: npx expo start --web --port 8095 --clear
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-travel-mobile-legacy-floating-overlay-removal-pack-32'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack32=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-flagship-cards-row"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function collectOverlayProof(page) {
  return page.evaluate(() => {
    const root = document.getElementById('travel-hub-root');
    const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const qhRect = quickHelp?.getBoundingClientRect();

    const legacyHidden = [...document.querySelectorAll('[data-viona-floating-legacy-hide="true"]')].map(
      (el) => ({
        tag: el.tagName.toLowerCase(),
        display: getComputedStyle(el).display,
        ariaLabel: el.getAttribute('aria-label')?.slice(0, 80) ?? null,
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
      })
    );

    const visibleFixed = [...document.querySelectorAll('body *')]
      .filter((node) => {
        const el = node;
        if (!(el instanceof HTMLElement)) return false;
        if (root?.contains(el)) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        if (style.position !== 'fixed' && style.position !== 'absolute') return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 16) return false;
        const label = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`.toLowerCase();
        const isLegacy =
          label.includes('ngôn ngữ') ||
          label.includes('language') ||
          label.includes('tài khoản') ||
          label.includes('account') ||
          label.includes('sos') ||
          label.includes('market');
        if (!isLegacy) return false;
        if (!qhRect) return true;
        const overlap =
          rect.left < qhRect.right &&
          rect.right > qhRect.left &&
          rect.top < qhRect.bottom &&
          rect.bottom > qhRect.top;
        return overlap;
      })
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        display: getComputedStyle(el).display,
        position: getComputedStyle(el).position,
        zIndex: getComputedStyle(el).zIndex,
        ariaLabel: el.getAttribute('aria-label')?.slice(0, 80) ?? null,
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
      }));

    const topRail = document.querySelector('[data-testid="viona-global-top-rail"]');
    const topRailButtons = topRail
      ? [...topRail.querySelectorAll('[role="button"], button')].map((b) => ({
          ariaLabel: b.getAttribute('aria-label')?.slice(0, 80) ?? null,
          visible: getComputedStyle(b).display !== 'none',
        }))
      : [];

    return {
      overlaySources: {
        languageMarket: 'SmartTrioLanguageChip (ProfileSwitcher via MainTabNavigator)',
        accountPill: 'ProfileSwitcher singleChip / chip (MainTabNavigator)',
        sosBubble: 'SOSFloatingButton (MainTabNavigator)',
        suppression: 'useVionaGlobalTopRailWebLegacySuppression in TravelScreen (mobile web)',
      },
      legacyHiddenCount: legacyHidden.length,
      legacyHidden,
      overlappingLegacyFloats: visibleFixed,
      quickHelpVisible: Boolean(quickHelp),
      topRailPresent: Boolean(topRail),
      topRailButtons,
      bodyRailActive: document.body.dataset.vionaGlobalTopRailActive === 'true',
    };
  });
}

async function screenshotQuickHelp(page, outName) {
  const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
  const row = page.locator('[data-testid="travel-flagship-cards-row"]');
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const heroBox = await hero.boundingBox();
  const rowBox = await row.boundingBox();
  const vw = page.viewportSize()?.width ?? 390;
  if (heroBox && rowBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, heroBox.y - 8),
        width: vw,
        height: rowBox.y + rowBox.height - heroBox.y + 16,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 32, captures: {} };

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
await page390.waitForTimeout(1500);
proof.captures['390-default'] = await collectOverlayProof(page390);
await screenshotQuickHelp(page390, 'travel-390x844-quick-help-top.png');

await page390.evaluate(() => {
  const row = document.querySelector('[data-testid="travel-flagship-cards-row"]');
  row?.scrollIntoView({ block: 'center' });
});
await page390.waitForTimeout(600);
proof.captures['390-scroll'] = await collectOverlayProof(page390);
await screenshotQuickHelp(page390, 'travel-390x844-quick-help-scroll.png');

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);
proof.captures['1366'] = await collectOverlayProof(page1366);
await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-sanity.png'),
  fullPage: true,
});

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(600);
proof.captures['1366-fullscreen'] = await collectOverlayProof(page1366);
await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-fullscreen-sanity.png'),
  fullPage: true,
});
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures['1024'] = await collectOverlayProof(page1024);
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 32 evidence → ${OUT_DIR}`);
