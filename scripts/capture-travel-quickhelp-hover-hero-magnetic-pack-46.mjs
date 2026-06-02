/**
 * Pack 46 — Quick Help hover drives Dynamic Hero + magnetic lift QA.
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
  'wave-3b-travel-quickhelp-hover-hero-magnetic-pack-46'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8096);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const CARD_IDS = ['airport', 'translation', 'taxi', 'emergency'];

const EXPECTED_VI = {
  default: { id: 'default', title: 'Đồng hành trên mọi hành trình', accent: 'cyan' },
  airport: { id: 'airport', title: 'Đi qua sân bay tự tin hơn', accent: 'cyan' },
  translation: { id: 'translation', title: 'Hiểu đúng trong tình huống quan trọng', accent: 'violet' },
  taxi: { id: 'taxi', title: 'Tìm cách di chuyển phù hợp', accent: 'emerald' },
  emergency: { id: 'emergency', title: 'Bình tĩnh trong tình huống khẩn cấp', accent: 'magenta' },
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(400);
}

async function resolveTravelLocationGate(page) {
  const secondaryVi = page.getByText('Tiếp tục không dùng vị trí', { exact: true });
  if (await secondaryVi.isVisible({ timeout: 2500 }).catch(() => false)) {
    await secondaryVi.click();
    await page.waitForTimeout(500);
  }
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack46=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await dismissGates(page);
  await resolveTravelLocationGate(page);
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 180_000 });
}

async function moveMouseAway(page) {
  await page.mouse.move(6, 6);
  await page.waitForTimeout(450);
}

async function moveMouseToCardCenter(page, cardId) {
  const cell = page.locator(`[data-testid="travel-quick-help-cell-${cardId}"]`);
  await cell.waitFor({ state: 'visible', timeout: 30_000 });
  const box = await cell.boundingBox();
  if (!box) throw new Error(`No bounding box for travel-quick-help-cell-${cardId}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
}

async function enterFullscreen(page) {
  const enter = page
    .getByText('Fullscreen', { exact: true })
    .or(page.getByText('Toàn màn hình', { exact: true }));
  if (await enter.first().isVisible({ timeout: 4000 }).catch(() => false)) {
    await enter.first().click({ timeout: 8000 });
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

async function collectProof(page, hoveredCardId) {
  return page.evaluate(
    ({ hoveredCardId: cardId, expected }) => {
      const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
      const heroStage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const cell = cardId
        ? document.querySelector(`[data-testid="travel-quick-help-cell-${cardId}"]`)
        : null;
      const cellCs = cell ? getComputedStyle(cell) : null;
      const titleCs = titleEl ? getComputedStyle(titleEl) : null;
      const heroRect = heroStage?.getBoundingClientRect();
      const cellRect = cell?.getBoundingClientRect();
      const exp = cardId ? expected[cardId] : expected.default;
      const displayedId =
        heroStage?.getAttribute('data-travel-displayed-quick-help-id') ?? null;
      const accent = heroStage?.getAttribute('data-travel-hero-accent') ?? null;
      const transform = cellCs?.transform ?? null;
      const scaleMatch = transform && transform !== 'none' && /matrix|scale/.test(transform);
      return {
        hoveredCardId: cardId,
        displayedQuickHelpId: displayedId,
        heroTitle: titleEl?.textContent?.trim() ?? null,
        expectedTitle: exp?.title ?? null,
        titleMatches: titleEl?.textContent?.trim() === exp?.title,
        heroAccent: accent,
        expectedAccent: exp?.accent ?? null,
        accentMatches: accent === exp?.accent,
        heroTitleFontSize: titleCs?.fontSize ?? null,
        heroStageHeightPx: heroRect ? Math.round(heroRect.height) : null,
        quickHelpCellHeightPx: cellRect ? Math.round(cellRect.height) : null,
        outerCellTransform: transform,
        magneticLiftDetected: scaleMatch,
        cellHoveredAttr: cell?.getAttribute('data-travel-quick-help-hovered') ?? null,
      };
    },
    { hoveredCardId, expected: EXPECTED_VI }
  );
}

async function screenshotHeroAndRow(page, outName) {
  const heroBox = await page.locator('[data-testid="travel-dynamic-hero-stage"]').boundingBox();
  const rowBox = await page.locator('[data-testid="travel-flagship-cards-row"]').boundingBox();
  const vw = page.viewportSize()?.width ?? 1366;
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

const gateInit = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = {
  pack: 46,
  architecture: {
    hoveredState: 'hoveredQuickHelpHeroContextId',
    selectedState: 'selectedQuickHelpHeroContextId',
    displayedId: 'displayedHeroQuickHelpContextId = hovered ?? selected ?? default',
    heroCopy: 'resolveTravelQuickHelpHeroDisplay(displayedHeroQuickHelpContextId, t)',
    magneticHost: 'travelQuickHelpFlagshipHostMotionStyle on outer View',
  },
  captures: {},
  baselines: {},
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(gateInit);
await openTravel(page1366);

await moveMouseAway(page1366);
proof.captures.default = await collectProof(page1366, null);
proof.baselines.titleFontSize = proof.captures.default.heroTitleFontSize;
proof.baselines.heroStageHeightPx = proof.captures.default.heroStageHeightPx;
proof.baselines.quickHelpCellHeightPx = proof.captures.default.quickHelpCellHeightPx;
await screenshotHeroAndRow(page1366, 'travel-1366x768-normal-default.png');

const hoverShots = [
  ['airport', 'travel-1366x768-normal-hover-airport.png'],
  ['translation', 'travel-1366x768-normal-hover-translation.png'],
  ['taxi', 'travel-1366x768-normal-hover-rides.png'],
  ['emergency', 'travel-1366x768-normal-hover-emergency.png'],
];

for (const [cardId, file] of hoverShots) {
  await moveMouseAway(page1366);
  await moveMouseToCardCenter(page1366, cardId);
  proof.captures[`normal-hover-${cardId}`] = await collectProof(page1366, cardId);
  await screenshotHeroAndRow(page1366, file);
}

const fsEntered = await enterFullscreen(page1366);
proof.fullscreenEntered = fsEntered;
if (fsEntered) {
  for (const [cardId, file] of [
    ['translation', 'travel-1366x768-fullscreen-hover-translation.png'],
    ['emergency', 'travel-1366x768-fullscreen-hover-emergency.png'],
  ]) {
    await moveMouseAway(page1366);
    await moveMouseToCardCenter(page1366, cardId);
    proof.captures[`fullscreen-hover-${cardId}`] = await collectProof(page1366, cardId);
    await screenshotHeroAndRow(page1366, file);
  }
}

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(gateInit);
await openTravel(page390);
await moveMouseToCardCenter(page390, 'airport');
proof.captures.mobile390 = await collectProof(page390, 'airport');
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-vietnamese-sanity.png'),
  fullPage: true,
});

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(gateInit);
await openTravel(page1024);
await moveMouseToCardCenter(page1024, 'translation');
proof.captures.tablet1024 = await collectProof(page1024, 'translation');
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-vietnamese-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 46 evidence → ${OUT_DIR}`);
