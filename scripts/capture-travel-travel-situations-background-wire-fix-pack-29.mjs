/**
 * Pack 29 — Travel Situations premium network background visibility QA.
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
  'wave-3b-travel-travel-situations-background-wire-fix-pack-29'
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
  await page.goto(`${BASE}/travel?pack29=${BUST}`, {
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
    const bgImg = document.querySelector('[data-testid="travel-situation-network-bg-image"]')
      ?? bg?.querySelector('img');
    const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const ss = section ? getComputedStyle(section) : null;
    const is = bgImg ? getComputedStyle(bgImg) : null;
    const src = bgImg?.getAttribute('src') ?? '';
    return {
      hasSituationsSection: Boolean(section),
      hasNetworkBgHost: Boolean(bg),
      hasNetworkBgImage: Boolean(bgImg),
      bgInsideSection: Boolean(section && bg && section.contains(bg)),
      bgImageSrcContainsAsset: src.includes(assetFile.replace('.png', '')),
      bgImageNaturalWidth: bgImg && 'naturalWidth' in bgImg ? bgImg.naturalWidth : null,
      bgImageObjectFit: is?.objectFit ?? null,
      sectionBackgroundColor: ss?.backgroundColor ?? null,
      sectionBorderRadius: ss?.borderRadius ?? null,
      sectionOverflow: ss?.overflow ?? null,
      heroNotInsideSection: hero && section ? !section.contains(hero) : null,
      quickHelpNotInsideSection: quickHelp && section ? !section.contains(quickHelp) : null,
    };
  }, ASSET_FILE);
}

async function screenshotSection(page, outName, pad = 16) {
  const section = page.locator('[data-testid="travel-situations-section"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
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

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 29, assetFile: ASSET_FILE, assetPath: `assets/viona/travel/${ASSET_FILE}` };

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1366);
proof.normal1366 = await collectProof(page1366);
await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-full-page.png'),
  fullPage: true,
});
await screenshotSection(page1366, 'travel-1366x768-situations-closeup.png');
await page1366.close();

const fsPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await fsPage.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(fsPage);
await fsPage.evaluate(async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
});
await fsPage.waitForTimeout(600);
proof.fullscreen1366 = await collectProof(fsPage);
await screenshotSection(fsPage, 'travel-1366x768-fullscreen-situations-closeup.png');
await fsPage.close();

for (const shot of [
  { name: 'travel-1024x768-sanity', width: 1024, height: 768 },
  { name: 'travel-390x844-sanity', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await openTravel(page);
  proof[shot.name] = await collectProof(page);
  await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();
proof.tintAdjustments = {
  imageOpacity: 1,
  horizontalVeil: 'rgba(4,10,18,0.34→0.22→0.30) was 0.58→0.38→0.50',
  readabilityVeil: 'rgba(4,10,18,0.22→0.14→0.18) was 0.42→0.28→0.36',
  shellBackground: 'transparent was rgba(4,10,18,0.22)',
  gridStageBackground: 'transparent was rgba(4,10,18,0.08)',
  removedShellBackdropFilter: true,
};
proof.capturedAt = new Date().toISOString();
await writeFile(path.join(OUT_DIR, 'computed-proof-pack-29.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 29 evidence → ${OUT_DIR}`);
