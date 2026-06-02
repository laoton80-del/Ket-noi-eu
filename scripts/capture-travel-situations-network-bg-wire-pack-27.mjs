/**
 * Pack 27 — Travel Situations network background wire QA.
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
  'wave-3b-travel-situations-network-bg-wire-pack-27'
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
  await page.goto(`${BASE}/travel?pack27=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-situations-section"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function collectProof(page) {
  return page.evaluate(() => {
    const section = document.querySelector('[data-testid="travel-situations-section"]');
    const bg = document.querySelector('[data-testid="travel-situation-network-bg"]');
    const veil = document.querySelector('[data-testid="travel-situation-section-readability-veil"]');
    const hero = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const quickHelp = document.querySelector('[data-testid="travel-flagship-cards-row"]');
    const bgImg = bg?.querySelector('img');
    const bgImgStyle = bgImg ? getComputedStyle(bgImg) : null;
    const sectionStyle = section ? getComputedStyle(section) : null;
    const sr = section?.getBoundingClientRect();
    const hr = hero?.getBoundingClientRect();
    const qr = quickHelp?.getBoundingClientRect();
    return {
      hasSituationsSection: Boolean(section),
      hasSituationNetworkBg: Boolean(bg),
      hasReadabilityVeil: Boolean(veil),
      bgInsideSection: Boolean(section && bg && section.contains(bg)),
      bgImageOpacity: bgImgStyle?.opacity ?? null,
      bgImageObjectFit: bgImgStyle?.objectFit ?? null,
      sectionBorderRadius: sectionStyle?.borderRadius ?? null,
      sectionOverflow: sectionStyle?.overflow ?? null,
      heroAboveSection: hr && sr ? hr.bottom <= sr.top + 4 : null,
      quickHelpAboveSection: qr && sr ? qr.bottom <= sr.top + 4 : null,
      bgImgSrc: bgImg?.getAttribute('src')?.slice(-80) ?? null,
    };
  });
}

async function screenshotSection(page, outName) {
  const section = page.locator('[data-testid="travel-situations-section"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await section.boundingBox();
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: Math.max(0, box.x - 12),
        y: Math.max(0, box.y - 12),
        width: Math.min((page.viewportSize()?.width ?? 1366) - Math.max(0, box.x - 12), box.width + 24),
        height: box.height + 24,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 27, captures: {} };

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1366);
proof.normal1366 = await collectProof(page1366);
await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-normal.png'),
  fullPage: true,
});
await screenshotSection(page1366, 'travel-1366x768-situations-closeup.png');
proof.captures.normal1366 = true;

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
await fsPage.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-fullscreen.png'),
  fullPage: true,
});
await fsPage.close();

for (const shot of [
  { name: 'travel-1024x768-sanity', width: 1024, height: 768, key: 'sanity1024' },
  { name: 'travel-390x844-sanity', width: 390, height: 844, key: 'sanity390' },
]) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('@app_language', 'vi');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await openTravel(page);
  proof[shot.key] = await collectProof(page);
  await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();
proof.assetPath = 'assets/viona/travel/viona-travel-situation-network-bg-premium-v1.png';
proof.capturedAt = new Date().toISOString();
await writeFile(path.join(OUT_DIR, 'computed-proof-pack-27.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 27 evidence → ${OUT_DIR}`);
