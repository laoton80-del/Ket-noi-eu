/**
 * Pack 24 — Quick Help hover drives hero + title + magnet QA.
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
  'wave-3b-travel-quickhelp-hover-drives-hero-and-final-title-pack-24'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const HERO_TITLES = {
  default: 'Đồng hành trên mọi hành trình',
  airport: 'Đi qua sân bay tự tin hơn',
  translation: 'Hiểu đúng trong tình huống quan trọng',
  taxi: 'Tìm cách di chuyển phù hợp',
  emergency: 'Bình tĩnh trong tình huống khẩn cấp',
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack24=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function collectProof(page) {
  return page.evaluate((titles) => {
    const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
    const heroStage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    const heroCard = heroStage?.closest('[class*="hero"]') ?? heroStage?.parentElement;
    const ts = titleEl ? getComputedStyle(titleEl) : null;
    const tr = titleEl?.getBoundingClientRect();
    const stack = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
    const sr = stack?.getBoundingClientRect();
    const hoveredCell = document.querySelector('[data-testid="travel-quick-help-cell-translation"]:hover')
      ?? document.querySelector('[data-testid="travel-quick-help-cell-airport"]');
    return {
      heroTitleText: titleEl?.textContent?.trim() ?? null,
      heroTitleExpectedKeys: Object.entries(titles).find(([, v]) => v === titleEl?.textContent?.trim())?.[0] ?? null,
      title: {
        fontSize: ts?.fontSize,
        lineHeight: ts?.lineHeight,
        width: tr ? Math.round(tr.width) : null,
      },
      textStackWidth: sr ? Math.round(sr.width) : null,
      heroHeight: heroStage ? Math.round(heroStage.getBoundingClientRect().height) : null,
    };
  }, HERO_TITLES);
}

async function collectHoverProof(page, cardId) {
  const cell = page.locator(`[data-testid="travel-quick-help-cell-${cardId}"]`);
  await cell.hover();
  await page.waitForTimeout(350);
  return page.evaluate(
    ({ id, titles }) => {
      const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
      const cellEl = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
      const cs = cellEl ? getComputedStyle(cellEl) : null;
      const heroStage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const heroImages = heroStage?.querySelectorAll('img');
      const heroImgCount = heroImages?.length ?? 0;
      return {
        hoveredCardId: id,
        heroTitleText: titleEl?.textContent?.trim() ?? null,
        expectedTitle: titles[id],
        titleMatches: titleEl?.textContent?.trim() === titles[id],
        cellTransform: cs?.transform,
        cellTransition: cs?.transition,
        cellBoxShadow: cs?.boxShadow?.slice(0, 120),
        heroOverlayImageCount: heroImgCount,
      };
    },
    { id: cardId, titles: HERO_TITLES }
  );
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = { default: null, hover: {}, titleNormal: null, titleFullscreen: null };

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1366);
proof.default = await collectProof(page1366);
proof.titleNormal = proof.default.title;

await page1366.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-normal-default.png'),
  fullPage: true,
});

const titleBox = await page1366.locator('[data-testid="travel-hero-title"]').boundingBox();
if (titleBox) {
  await page1366.screenshot({
    path: path.join(OUT_DIR, 'travel-1366x768-normal-title-closeup.png'),
    clip: {
      x: Math.max(0, titleBox.x - 48),
      y: Math.max(0, titleBox.y - 48),
      width: Math.min(1366, titleBox.width + 96),
      height: titleBox.height + 96,
    },
  });
}

for (const id of ['airport', 'translation', 'taxi', 'emergency']) {
  proof.hover[id] = await collectHoverProof(page1366, id);
  const rowBox = await page1366.locator('[data-testid="travel-flagship-cards-row"]').boundingBox();
  const heroBox = await page1366.locator('[data-testid="travel-dynamic-hero-stage"]').boundingBox();
  if (rowBox && heroBox) {
    await page1366.screenshot({
      path: path.join(OUT_DIR, `travel-1366x768-normal-hover-${id}.png`),
      clip: {
        x: 0,
        y: Math.max(0, heroBox.y - 8),
        width: 1366,
        height: rowBox.y + rowBox.height - heroBox.y + 16,
      },
    });
  }
}

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
proof.titleFullscreen = (
  await collectProof(fsPage)
).title;
await fsPage.screenshot({
  path: path.join(OUT_DIR, 'travel-1366x768-fullscreen-sanity.png'),
  fullPage: true,
});
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
  await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();
proof.capturedAt = new Date().toISOString();
proof.hoverStateArchitecture = {
  hoveredQuickHelpHeroContextId: 'TravelFlagshipScenarioId | null',
  selectedQuickHelpHeroContextId: 'TravelQuickHelpHeroContextId',
  displayedHeroQuickHelpContextId: 'hovered ?? selected ?? default',
};
await writeFile(path.join(OUT_DIR, 'computed-proof-pack-24.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 24 evidence → ${OUT_DIR}`);
