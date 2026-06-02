/**
 * Pack 26 — Title balance, accent sync, magnet fix QA.
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
  'wave-3b-travel-final-title-balance-accent-sync-magnet-fix-pack-26'
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

const ACCENT_MAP = {
  airport: 'cyan',
  translation: 'violet',
  taxi: 'emerald',
  emergency: 'magenta',
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack26=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function moveMouseToCardCenter(page, cardId) {
  const cell = page.locator(`[data-testid="travel-quick-help-cell-${cardId}"]`);
  await cell.waitFor({ state: 'visible', timeout: 30_000 });
  const box = await cell.boundingBox();
  if (!box) throw new Error(`No bounding box for travel-quick-help-cell-${cardId}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
}

async function collectTitleProof(page) {
  return page.evaluate(() => {
    const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
    const ts = titleEl ? getComputedStyle(titleEl) : null;
    const tr = titleEl?.getBoundingClientRect();
    return {
      heroTitleText: titleEl?.textContent?.trim() ?? null,
      fontSize: ts?.fontSize ?? null,
      lineHeight: ts?.lineHeight ?? null,
      width: tr ? Math.round(tr.width) : null,
    };
  });
}

async function collectHoverProof(page, cardId) {
  return page.evaluate(
    ({ id, titles, accents }) => {
      const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
      const cellEl = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
      const heroStage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const cs = cellEl ? getComputedStyle(cellEl) : null;
      const heroAccent =
        heroStage?.getAttribute('data-travel-hero-accent') ??
        document.querySelector('[data-travel-hero-accent]')?.getAttribute('data-travel-hero-accent') ??
        null;
      const heroRim = heroStage?.querySelector('[class*="heroHoverRim"]') ?? heroStage?.lastElementChild;
      const rimStyle = heroRim ? getComputedStyle(heroRim) : null;
      return {
        hoveredCardId: id,
        displayedHeroTitle: titleEl?.textContent?.trim() ?? null,
        expectedTitle: titles[id],
        titleMatches: titleEl?.textContent?.trim() === titles[id],
        heroAccent,
        expectedAccent: accents[id],
        accentMatches: heroAccent === accents[id],
        heroRimBorderColor: rimStyle?.borderColor?.slice(0, 80) ?? null,
        cellTransform: cs?.transform ?? null,
        cellFilter: cs?.filter ?? null,
        cellBoxShadow: cs?.boxShadow?.slice(0, 140) ?? null,
        cellTestId: cellEl?.getAttribute('data-testid') ?? null,
        cellTag: cellEl?.tagName?.toLowerCase() ?? null,
      };
    },
    { id: cardId, titles: HERO_TITLES, accents: ACCENT_MAP }
  );
}

async function screenshotHeroAndRow(page, outName) {
  const rowBox = await page.locator('[data-testid="travel-flagship-cards-row"]').boundingBox();
  const heroBox = await page.locator('[data-testid="travel-dynamic-hero-stage"]').boundingBox();
  if (rowBox && heroBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, outName),
      clip: {
        x: 0,
        y: Math.max(0, heroBox.y - 8),
        width: page.viewportSize()?.width ?? 1366,
        height: rowBox.y + rowBox.height - heroBox.y + 16,
      },
    });
  }
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = {
  pack: 26,
  titleBeforePack25: { fontSize: '88px', lineHeight: '82px', width: 940 },
  default: null,
  hover: {},
  titleNormal: null,
  titleFullscreen: null,
  displayedQuickHelpId: {},
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1366);
proof.default = await collectTitleProof(page1366);
proof.titleNormal = proof.default;
proof.displayedQuickHelpId.default = proof.default.heroTitleText;

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
  await moveMouseToCardCenter(page1366, id);
  proof.hover[id] = await collectHoverProof(page1366, id);
  proof.displayedQuickHelpId[id] = proof.hover[id].displayedHeroTitle;
  await screenshotHeroAndRow(page1366, `travel-1366x768-normal-hover-${id}.png`);
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
proof.titleFullscreen = await collectTitleProof(fsPage);
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
proof.titleAfterPack26 = proof.titleNormal;
await writeFile(path.join(OUT_DIR, 'computed-proof-pack-26.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 26 evidence → ${OUT_DIR}`);
