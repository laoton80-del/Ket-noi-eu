/**
 * Pack 34 — Quick Help hover must drive Dynamic Hero QA.
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
  'wave-3b-travel-quickhelp-hover-must-drive-dynamic-hero-pack-34'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const CARD_IDS = ['airport', 'translation', 'taxi', 'emergency'];

const EXPECTED = {
  default: {
    id: 'default',
    title: 'Đồng hành trên mọi hành trình',
    accent: 'cyan',
  },
  airport: {
    id: 'airport',
    title: 'Đi qua sân bay tự tin hơn',
    accent: 'cyan',
  },
  translation: {
    id: 'translation',
    title: 'Hiểu đúng trong tình huống quan trọng',
    accent: 'violet',
  },
  taxi: {
    id: 'taxi',
    title: 'Tìm cách di chuyển phù hợp',
    accent: 'emerald',
  },
  emergency: {
    id: 'emergency',
    title: 'Bình tĩnh trong tình huống khẩn cấp',
    accent: 'magenta',
  },
};

async function dismissGates(page) {
  const loc = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) await loc.click();
  await page.waitForTimeout(500);
}

async function openTravel(page) {
  await page.goto(`${BASE}/travel?pack34=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-hero-title"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function moveMouseAway(page) {
  await page.mouse.move(8, 8);
  await page.waitForTimeout(400);
}

async function moveMouseToCardCenter(page, cardId) {
  const cell = page.locator(`[data-testid="travel-quick-help-cell-${cardId}"]`);
  await cell.waitFor({ state: 'visible', timeout: 30_000 });
  const box = await cell.boundingBox();
  if (!box) throw new Error(`No bounding box for travel-quick-help-cell-${cardId}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(650);
}

async function collectProof(page, hoveredCardId) {
  return page.evaluate(
    ({ hoveredCardId: cardId, expected }) => {
      const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
      const subEl = document.querySelector('[data-testid="travel-hero-editorial-text-layer"]');
      const subtitleEl = subEl?.querySelectorAll('span, p, div')[1];
      const heroStage = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
      const cell = cardId
        ? document.querySelector(`[data-testid="travel-quick-help-cell-${cardId}"]`)
        : null;
      const cellCs = cell ? getComputedStyle(cell) : null;
      const exp = cardId ? expected[cardId] : expected.default;
      const displayedId =
        heroStage?.getAttribute('data-travel-displayed-quick-help-id') ?? null;
      const accent = heroStage?.getAttribute('data-travel-hero-accent') ?? null;
      const chips = [...(subEl?.querySelectorAll('[class*="heroTrustText"]') ?? [])].map((n) =>
        n.textContent?.trim()
      );
      return {
        hoveredCardId: cardId,
        displayedQuickHelpId: displayedId,
        heroTitle: titleEl?.textContent?.trim() ?? null,
        expectedTitle: exp?.title ?? null,
        titleMatches: titleEl?.textContent?.trim() === exp?.title,
        heroAccent: accent,
        expectedAccent: exp?.accent ?? null,
        accentMatches: accent === exp?.accent,
        heroChips: chips,
        outerCellTransform: cellCs?.transform ?? null,
        outerCellTag: cell?.tagName?.toLowerCase() ?? null,
        heroEventPath:
          'Pressable onHoverIn/onMouseEnter + View onPointerEnter → onTravelHeroCardHover(id)',
      };
    },
    { hoveredCardId, expected: EXPECTED }
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

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = {
  pack: 34,
  architecture: {
    quickHelpIds: CARD_IDS,
    hoveredState: 'hoveredQuickHelpHeroContextId',
    selectedState: 'selectedQuickHelpHeroContextId',
    displayedId: 'displayedHeroQuickHelpContextId = hovered ?? selected ?? default',
    heroCopy: 'resolveTravelQuickHelpHeroDisplay(displayedHeroQuickHelpContextId, ...)',
    heroImage: 'activeTravelHeroKey via TRAVEL_FLAGSHIP_DYNAMIC_HERO_KEY',
    heroAccent: 'travelQuickHelpHeroAccent(displayedHeroQuickHelpContextId)',
  },
  captures: {},
};

const initScript = () => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(initScript);
await openTravel(page1366);
await moveMouseAway(page1366);
proof.captures.default = await collectProof(page1366, null);
await screenshotHeroAndRow(page1366, 'travel-1366x768-normal-default.png');

for (const cardId of CARD_IDS) {
  await moveMouseAway(page1366);
  await moveMouseToCardCenter(page1366, cardId);
  const label =
    cardId === 'taxi' ? 'rides' : cardId === 'emergency' ? 'emergency' : cardId;
  proof.captures[`hover-${cardId}`] = await collectProof(page1366, cardId);
  await screenshotHeroAndRow(page1366, `travel-1366x768-hover-${label}.png`);
}

await moveMouseToCardCenter(page1366, 'translation');
await page1366.evaluate(() => document.documentElement.requestFullscreen?.().catch(() => {}));
await page1366.waitForTimeout(700);
proof.captures['fullscreen-hover-translation'] = await collectProof(page1366, 'translation');
await screenshotHeroAndRow(page1366, 'travel-1366x768-fullscreen-hover-translation.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(initScript);
await openTravel(page1024);
proof.captures['1024-default'] = await collectProof(page1024, null);
await page1024.screenshot({
  path: path.join(OUT_DIR, 'travel-1024x768-sanity.png'),
  fullPage: true,
});

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(initScript);
await openTravel(page390);
proof.captures['390-default'] = await collectProof(page390, null);
await page390.screenshot({
  path: path.join(OUT_DIR, 'travel-390x844-sanity.png'),
  fullPage: true,
});

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 34 evidence → ${OUT_DIR}`);
