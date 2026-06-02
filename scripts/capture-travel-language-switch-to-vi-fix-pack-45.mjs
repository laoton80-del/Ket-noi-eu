/**
 * Pack 45 — Travel language switch to Vietnamese QA.
 * Prereq: npx expo start --web --port 8096 --clear
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
  'wave-3b-travel-language-switch-to-vi-fix-pack-45'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8096);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const VI_MARKERS = {
  railSubtitle: 'đồng hành & hỗ trợ ngôn ngữ',
  heroDefaultTitle: 'Đồng hành trên mọi hành trình',
  quickHelpKicker: 'TRỢ GIÚP NHANH',
  scenariosKicker: 'TÌNH HUỐNG DU LỊCH',
  airportCard: 'Sân bay',
};

const EN_MARKERS = {
  railSubtitle: 'companion & language help',
  heroDefaultTitle: 'Companion on every journey',
  quickHelpKicker: 'QUICK HELP',
  scenariosKicker: 'TRAVEL SITUATIONS',
  airportCard: 'Airport',
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  const locEn = page.getByText(/Continue without sharing|limited mode/i).first();
  if (await locEn.isVisible({ timeout: 1000 }).catch(() => false)) await locEn.click();
  await page.waitForTimeout(500);
}

async function resolveTravelLocationGate(page) {
  const secondaryVi = page.getByText('Tiếp tục không dùng vị trí', { exact: true });
  const secondaryEn = page.getByText('Continue without location', { exact: true });
  if (await secondaryVi.isVisible({ timeout: 3000 }).catch(() => false)) {
    await secondaryVi.click();
    await page.waitForTimeout(600);
    return;
  }
  if (await secondaryEn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await secondaryEn.click();
    await page.waitForTimeout(600);
  }
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack45=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}

async function collectProof(page) {
  return page.evaluate(() => {
    const title = document.querySelector('[data-testid="travel-hero-title"]')?.textContent?.trim() ?? null;
    const railSub = [...document.querySelectorAll('span, p, div')]
      .map((n) => n.textContent?.trim() ?? '')
      .find((t) => t.includes('Travel Lite')) ?? null;
    const quickHelpKicker = [...document.querySelectorAll('span, p, div')]
      .map((n) => n.textContent?.trim() ?? '')
      .find((t) => t === 'QUICK HELP' || t === 'TRỢ GIÚP NHANH') ?? null;
    const scenariosKicker = [...document.querySelectorAll('span, p, div')]
      .map((n) => n.textContent?.trim() ?? '')
      .find((t) => t === 'TRAVEL SITUATIONS' || t === 'TÌNH HUỐNG DU LỊCH') ?? null;
    const airportCell = document.querySelector('[data-testid="travel-flagship-airport"]');
    const airportTitle =
      airportCell?.querySelector('[class*="TileTitle"], [class*="tileTitle"]')?.textContent?.trim() ??
      airportCell?.textContent?.trim()?.split('\n')[0] ??
      null;
    return {
      storedLanguage: localStorage.getItem('@app_language'),
      heroTitle: title,
      railSubtitle: railSub,
      quickHelpKicker,
      scenariosKicker,
      airportQuickHelpTitle: airportTitle,
    };
  });
}

async function clickLanguageAndPickVietnamese(page) {
  const langLabel = page.getByText('Language', { exact: true }).or(page.getByText('Ngôn ngữ', { exact: true }));
  if (await langLabel.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    await langLabel.first().click({ timeout: 10_000 });
  } else {
    await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('div, button, span')];
      const hit = nodes.find((n) => n.textContent?.trim() === 'Language' || n.textContent?.trim() === 'Ngôn ngữ');
      hit?.closest('button')?.click() ?? hit?.click();
    });
  }
  await page.waitForTimeout(500);
  const viOption = page
    .getByText('Vietnamese', { exact: true })
    .or(page.getByText('Tiếng Việt', { exact: true }));
  await viOption.first().click({ timeout: 12_000 });
  await page.waitForTimeout(900);
}

async function enterFullscreenIfAvailable(page) {
  const enter = page
    .getByText('Fullscreen', { exact: true })
    .or(page.getByText('Toàn màn hình', { exact: true }));
  if (await enter.first().isVisible({ timeout: 4000 }).catch(() => false)) {
    await enter.first().click({ timeout: 8000 });
    await page.waitForTimeout(700);
    return true;
  }
  return false;
}

function proofMatches(markers, proof) {
  const checks = {
    railSubtitle: proof.railSubtitle?.includes(markers.railSubtitle) ?? false,
    heroTitle: proof.heroTitle === markers.heroDefaultTitle,
    quickHelpKicker: proof.quickHelpKicker === markers.quickHelpKicker,
    scenariosKicker: proof.scenariosKicker === markers.scenariosKicker,
    airportCard: proof.airportQuickHelpTitle === markers.airportCard,
    storedVi: proof.storedLanguage === 'vi',
  };
  return { checks, pass: Object.values(checks).every(Boolean) };
}

const gateInit = (lang) => () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  if (lang) localStorage.setItem('@app_language', lang);
  else localStorage.removeItem('@app_language');
};

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { pack: 45, captures: {} };

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(gateInit('en'));
await openTravel(page1366);
proof.captures.enNormal = proofMatches(EN_MARKERS, await collectProof(page1366));
await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-english-normal.png'),
  fullPage: true,
});

let switchPath = 'ui-sheet';
try {
  await clickLanguageAndPickVietnamese(page1366);
} catch (err) {
  switchPath = 'storage-fallback';
  proof.switchUiError = String(err);
  await page1366.evaluate(async () => {
    localStorage.setItem('@app_language', 'vi');
    window.dispatchEvent(new Event('storage'));
  });
  await page1366.reload({ waitUntil: 'domcontentloaded' });
  await dismissGates(page1366);
  await resolveTravelLocationGate(page1366);
  await page1366.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}
proof.languageSwitchPath = switchPath;
proof.captures.viNormal = proofMatches(VI_MARKERS, await collectProof(page1366));
await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-vietnamese-normal.png'),
  fullPage: true,
});

const fullscreenEntered = await enterFullscreenIfAvailable(page1366);
proof.fullscreenEntered = fullscreenEntered;
if (fullscreenEntered) {
  proof.captures.viFullscreen = proofMatches(VI_MARKERS, await collectProof(page1366));
  await page1366.screenshot({
    path: path.join(OUT_DIR, 'travel-1366x768-vietnamese-fullscreen.png'),
    fullPage: true,
  });
}

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(gateInit('vi'));
await openTravel(page390);
proof.captures.mobile390 = proofMatches(VI_MARKERS, await collectProof(page390));
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-vietnamese-sanity.png'),
  fullPage: true,
});

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(gateInit('vi'));
await openTravel(page1024);
proof.captures.tablet1024 = proofMatches(VI_MARKERS, await collectProof(page1024));
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-vietnamese-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 45 evidence → ${OUT_DIR}`);
