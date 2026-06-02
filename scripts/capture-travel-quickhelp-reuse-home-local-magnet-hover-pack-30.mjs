/**
 * Pack 30 — Quick Help reuse Home/Local magnetic hover QA.
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
  'wave-3b-travel-quickhelp-reuse-home-local-magnet-hover-pack-30'
);
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${PORT}`;
const BUST = Date.now();

const CARD_IDS = ['airport', 'translation', 'taxi', 'emergency'];

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
  await page.goto(`${BASE}/travel?pack30=${BUST}`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  });
  await page.waitForSelector('[data-testid="travel-flagship-cards-row"]', { timeout: 120_000 });
  await dismissGates(page);
}

async function moveMouseAway(page) {
  await page.mouse.move(8, 8);
  await page.waitForTimeout(350);
}

async function moveMouseToCardCenter(page, cardId) {
  const cell = page.locator(`[data-testid="travel-quick-help-cell-${cardId}"]`);
  await cell.waitFor({ state: 'visible', timeout: 30_000 });
  const box = await cell.boundingBox();
  if (!box) throw new Error(`No bounding box for travel-quick-help-cell-${cardId}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(550);
}

async function collectHoverProof(page, cardId) {
  return page.evaluate(
    ({ id, titles }) => {
      const outerEl = document.querySelector(`[data-testid="travel-quick-help-cell-${id}"]`);
      const innerEl = document.querySelector(`[data-testid="travel-quick-help-magnet-host-${id}"]`);
      const titleEl = document.querySelector('[data-testid="travel-hero-title"]');
      const outerCs = outerEl ? getComputedStyle(outerEl) : null;
      const innerCs = innerEl ? getComputedStyle(innerEl) : null;
      const outerRect = outerEl?.getBoundingClientRect();
      const innerRect = innerEl?.getBoundingClientRect();
      return {
        cardId: id,
        outerWrapper: {
          testId: outerEl?.getAttribute('data-testid') ?? null,
          tag: outerEl?.tagName?.toLowerCase() ?? null,
          transform: outerCs?.transform ?? null,
          transition: outerCs?.transition ?? null,
          zIndex: outerCs?.zIndex ?? null,
          boxShadow: outerCs?.boxShadow?.slice(0, 160) ?? null,
          cursor: outerCs?.cursor ?? null,
          height: outerRect ? Math.round(outerRect.height) : null,
        },
        innerPressable: {
          testId: innerEl?.getAttribute('data-testid') ?? null,
          tag: innerEl?.tagName?.toLowerCase() ?? null,
          transform: innerCs?.transform ?? null,
          boxShadow: innerCs?.boxShadow?.slice(0, 160) ?? null,
          height: innerRect ? Math.round(innerRect.height) : null,
        },
        heroTitle: titleEl?.textContent?.trim() ?? null,
        expectedHeroTitle: titles[id] ?? null,
        heroTitleMatches: id === 'default' ? true : titleEl?.textContent?.trim() === titles[id],
        homeLocalReference: {
          source: 'fashionHomeWebMagneticMotionStyle / LocalHomeParityCard outer View',
          hoverTranslateY: '-1px (+ magnetic offset up to 3px)',
          hoverScale: '1.004',
          transitionMs: 200,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      };
    },
    { id: cardId, titles: HERO_TITLES }
  );
}

async function screenshotQuickHelpRow(page, outName) {
  const row = page.locator('[data-testid="travel-flagship-cards-row"]');
  await row.waitFor({ state: 'visible' });
  const box = await row.boundingBox();
  if (!box) throw new Error('No bounding box for travel-flagship-cards-row');
  await page.screenshot({
    path: path.join(OUT_DIR, outName),
    clip: {
      x: 0,
      y: Math.max(0, box.y - 12),
      width: page.viewportSize()?.width ?? 1366,
      height: box.height + 24,
    },
  });
}

const { chromium } = await import('playwright');
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const proof = {
  pack: 30,
  homeLocalReference: {
    files: [
      'src/components/viona/local/LocalHomeParityCard.tsx',
      'src/components/viona/fashionHomeDesktopShell.ts',
    ],
    functions: [
      'createFashionHomeWebWorldCardPointerHandlers',
      'fashionHomeWebMagneticMotionStyle',
      'fashionHomeWebWorldCardHostMotionStyle',
      'computeFashionHomeWebMagneticOffset',
      'useFashionHomePrefersReducedMotion',
    ],
    motionValues: {
      magneticMaxTranslatePx: 3,
      magneticMaxRotateDeg: 0.65,
      hoverTranslateY: -1,
      hoverScale: 1.004,
      transitionMs: 200,
    },
  },
  captures: {},
  default: null,
};

const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page1366.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1366);
await moveMouseAway(page1366);
proof.default = await collectHoverProof(page1366, 'airport');
await screenshotQuickHelpRow(page1366, 'travel-1366x768-normal-default.png');

for (const cardId of CARD_IDS) {
  await moveMouseAway(page1366);
  await moveMouseToCardCenter(page1366, cardId);
  const hoverProof = await collectHoverProof(page1366, cardId);
  proof.captures[`1366-hover-${cardId}`] = hoverProof;
  const label =
    cardId === 'taxi'
      ? 'rides'
      : cardId === 'emergency'
        ? 'emergency'
        : cardId;
  await screenshotQuickHelpRow(
    page1366,
    `travel-1366x768-hover-${label}.png`
  );
}

await moveMouseToCardCenter(page1366, 'airport');
await page1366.evaluate(() => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
});
await page1366.waitForTimeout(600);
await moveMouseToCardCenter(page1366, 'airport');
await screenshotQuickHelpRow(page1366, 'travel-1366x768-fullscreen-hover-sanity.png');
await page1366.evaluate(() => document.exitFullscreen?.().catch(() => {}));

const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page1024.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page1024);
await moveMouseToCardCenter(page1024, 'translation');
proof.captures['1024-hover-translation'] = await collectHoverProof(page1024, 'translation');
await screenshotQuickHelpRow(page1024, 'travel-1024x768-sanity.png');

const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page390.addInitScript(() => {
  localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
  localStorage.setItem('@app_language', 'vi');
  localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
});
await openTravel(page390);
await screenshotQuickHelpRow(page390, 'travel-390x844-sanity.png');

await browser.close();
await writeFile(path.join(OUT_DIR, 'proof.json'), JSON.stringify(proof, null, 2));
console.log(`Pack 30 evidence → ${OUT_DIR}`);
