/**
 * Pack 31 — Travel Situations background visibility and fit QA.
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
  'wave-3b-travel-situations-bg-visibility-and-fit-fix-pack-31'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();
const ASSET_FILE = 'viona-travel-situation-network-bg-premium-v1.png';

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack31=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-situations-section"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function collectProof(page) {
  return page.evaluate((assetFile) => {
    const section = document.querySelector('[data-testid="travel-situations-section"]');
    const bg = document.querySelector('[data-testid="travel-situation-network-bg"]');
    const bgImg =
      document.querySelector('[data-testid="travel-situation-network-bg-image"]') ??
      bg?.querySelector('img');
    const veil = document.querySelector('[data-testid="travel-situation-section-readability-veil"]');
    const oldLightNetwork = section?.querySelector('[class*="situationLightNetwork"]');
    const ss = section ? getComputedStyle(section) : null;
    const is = bgImg ? getComputedStyle(bgImg) : null;
    const bs = bg ? getComputedStyle(bg) : null;
    const src = bgImg?.getAttribute('src') ?? '';
    const sectionRect = section?.getBoundingClientRect();
    const imgRect = bgImg?.getBoundingClientRect();
    return {
      layerOrder: [
        '1. travel-situations-section shell (frame)',
        '2. travel-situation-network-bg + image (zIndex 0)',
        '3. travel-situation-section-readability-veil (zIndex 2)',
        '4. situationSectionContent + tiles (zIndex 4+)',
      ],
      removedLayers: [
        'TravelSituationLightNetworkBackdrop (old synthetic network)',
        'situationPremiumNetworkBgVeil horizontal dark gradient (0.34/0.22/0.30)',
        'situationPremiumNetworkBgCyanWash',
      ],
      imageFit: {
        resizeMode: 'cover',
        objectFit: is?.objectFit ?? null,
        objectPosition: is?.objectPosition ?? null,
        width: is?.width ?? null,
        height: is?.height ?? null,
      },
      overlay: {
        readabilityVeilPresent: Boolean(veil),
        readabilityVeilColors: 'rgba(4,10,18) peak 0.20 / mid 0.12 / end 0.16',
        oldLightNetworkPresent: Boolean(oldLightNetwork),
      },
      section: {
        backgroundColor: ss?.backgroundColor ?? null,
        borderRadius: ss?.borderRadius ?? null,
        overflow: ss?.overflow ?? null,
        width: sectionRect ? Math.round(sectionRect.width) : null,
        height: sectionRect ? Math.round(sectionRect.height) : null,
      },
      bgHost: {
        zIndex: bs?.zIndex ?? null,
        overflow: bs?.overflow ?? null,
        borderRadius: bs?.borderRadius ?? null,
      },
      bgImage: {
        srcContainsAsset: src.includes(assetFile.replace('.png', '')),
        naturalWidth: bgImg && 'naturalWidth' in bgImg ? bgImg.naturalWidth : null,
        fillsSection:
          sectionRect && imgRect
            ? Math.abs(imgRect.width - sectionRect.width) < 4 &&
              Math.abs(imgRect.height - sectionRect.height) < 4
            : null,
      },
    };
  }, ASSET_FILE);
}

async function screenshotSection(page, outName, pad = 16) {
  const section = page.locator('[data-testid="travel-situations-section"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
  const box = await section.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: Math.min(vw, box.width + pad * 2),
        height: box.height + pad * 2,
      },
    });
  }
}

async function screenshotOpening(page, outName) {
  const hero = page.locator('[data-testid="travel-dynamic-hero-stage"]');
  const section = page.locator('[data-testid="travel-situations-section"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const heroBox = await hero.boundingBox();
  const sectionBox = await section.boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
  if (heroBox && sectionBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, heroBox.y - 8),
        width: vw,
        height: sectionBox.y + sectionBox.height - heroBox.y + 24,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 31, captures: {} };

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);
proof.captures['1366'] = await collectProof(page1366);
await screenshotOpening(page1366, 'travel-1366x768-opening-situations-visible.png');
await screenshotSection(page1366, 'travel-1366x768-situations-closeup.png');

await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(700);
proof.captures['1366-fullscreen'] = await collectProof(page1366);
await screenshotSection(page1366, 'travel-1366x768-fullscreen-situations-closeup.png', 12);
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures['1024'] = await collectProof(page1024);
await screenshotSection(page1024, 'travel-1024x768-sanity.png');

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
proof.captures['390'] = await collectProof(page390);
await screenshotSection(page390, 'travel-390x844-sanity.png');

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 31 evidence → ${OUT_DIR}`);
