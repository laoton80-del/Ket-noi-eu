/**
 * Pack 57 — Home runtime hero lighting closure QA (untracked evidence).
 * Prereq: npx expo start --web --port 8093
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  '..',
  'docs',
  'design',
  'evidence',
  'wave-3b-home-runtime-hero-lighting-closure-pack-57'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${Number(process.env.EXPO_CAPTURE_PORT || 8093)}`;
const TRAVEL_BASE = process.env.VIONA_TRAVEL_WEB_BASE ?? 'http://localhost:8095';
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

async function dismissIntent(page) {
  const q = page.getByText('Bạn đang cần gì nhất lúc này?', { exact: true });
  if (await q.isVisible({ timeout: 2500 }).catch(() => false)) {
    await page.getByText('Để sau', { exact: true }).click();
    await q.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  const locationGate = page.getByText('Không chia sẻ — tiếp tục hạn chế', { exact: true });
  if (await locationGate.isVisible({ timeout: 2000 }).catch(() => false)) {
    await locationGate.click();
  }
  await page.waitForTimeout(500);
}

async function openHome(page) {
  for (const p of ['/home', '/tabs/home', '/']) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    const bodyOk = await page
      .waitForFunction(() => document.body?.textContent?.length > 80, { timeout: 45_000 })
      .then(() => true)
      .catch(() => false);
    if (!bodyOk) continue;
    await page
      .waitForSelector('[data-testid="home-hero-network-edge"]', { timeout: 60_000 })
      .catch(() => {});
    return p;
  }
  throw new Error('Home not ready');
}

async function openTravel(page) {
  for (const p of ['/travel', '/tabs/travel']) {
    await page.goto(`${TRAVEL_BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
    const ok = await page
      .waitForSelector('[data-testid="travel-hero-lighting-network"], [data-testid="travel-hero-title"]', {
        timeout: 60_000,
      })
      .then(() => true)
      .catch(() => false);
    if (ok) return p;
  }
  throw new Error('Travel not ready');
}

async function assertNoDaylightToggle(page) {
  const toggle = page.getByRole('button', { name: /Daylight|Night|Bật đèn|Tắt đèn/i });
  const visible = await toggle.isVisible({ timeout: 1500 }).catch(() => false);
  if (visible) throw new Error('Daylight toggle still visible on Home command bar');
}

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const init = { intentKey: INTENT_KEY, consentKey: TRAVEL_CONSENT_KEY };
  const results = [];

  try {
    // 1–3 Home 1366
    const home1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await home1366.addInitScript(({ intentKey }) => {
      localStorage.setItem(intentKey, '1');
    }, init);
    const homePath = await openHome(home1366);
    await dismissIntent(home1366);
    await assertNoDaylightToggle(home1366);
    await home1366.waitForTimeout(800);
    await home1366.screenshot({ path: path.join(OUT_DIR, 'home-1366x768-default.png') });
    results.push(`OK home-1366x768-default via ${homePath}`);

    const travelTitle = home1366.getByText('Travel');
    if ((await travelTitle.count()) > 1) {
      await travelTitle.nth(1).hover({ force: true });
      await home1366.waitForTimeout(900);
      await home1366.screenshot({ path: path.join(OUT_DIR, 'home-1366x768-travel-semantic.png') });
      results.push('OK home-1366x768-travel-semantic (hover)');
    } else {
      results.push('SKIP home-1366x768-travel-semantic (card not found)');
    }

    try {
      await home1366.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
      await home1366.waitForTimeout(400);
      const academyTitle = home1366.getByText('Academy').filter({ hasNot: home1366.locator('[role="tab"]') });
      if (await academyTitle.count()) {
        await academyTitle.first().hover({ force: true });
        await home1366.waitForTimeout(900);
        await home1366.screenshot({ path: path.join(OUT_DIR, 'home-1366x768-academy-semantic.png') });
        results.push('OK home-1366x768-academy-semantic (hover)');
      } else {
        results.push('SKIP home-1366x768-academy-semantic (card not found)');
      }
    } catch {
      results.push('SKIP home-1366x768-academy-semantic (not hoverable in opening stage)');
    }
    await home1366.close();

    // 6 Home 390
    const home390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await home390.addInitScript(({ intentKey }) => {
      localStorage.setItem(intentKey, '1');
    }, init);
    await openHome(home390);
    await dismissIntent(home390);
    await assertNoDaylightToggle(home390);
    await home390.waitForTimeout(700);
    await home390.screenshot({ path: path.join(OUT_DIR, 'home-390x844-sanity.png') });
    results.push('OK home-390x844-sanity');
    await home390.close();

    // 4–5 Travel 1366
    const travel1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await travel1366.addInitScript(({ intentKey, consentKey }) => {
      localStorage.setItem(intentKey, '1');
      localStorage.setItem(consentKey, '0');
    }, init);
    const travelPath = await openTravel(travel1366);
    await dismissIntent(travel1366);
    await travel1366.waitForTimeout(800);
    await travel1366.screenshot({ path: path.join(OUT_DIR, 'travel-1366x768-normal.png') });
    results.push(`OK travel-1366x768-normal via ${travelPath}`);

    const qh = travel1366.locator('[data-testid="travel-flagship-translation"]');
    await qh.scrollIntoViewIfNeeded();
    await qh.hover({ force: true });
    await travel1366.waitForTimeout(900);
    await travel1366.screenshot({ path: path.join(OUT_DIR, 'travel-1366x768-quickhelp-translation.png') });
    results.push('OK travel-1366x768-quickhelp-translation (hover)');
    await travel1366.close();

    // 7 Travel 390
    const travel390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await travel390.addInitScript(({ intentKey, consentKey }) => {
      localStorage.setItem(intentKey, '1');
      localStorage.setItem(consentKey, '0');
    }, init);
    await openTravel(travel390);
    await dismissIntent(travel390);
    await travel390.waitForTimeout(700);
    await travel390.screenshot({ path: path.join(OUT_DIR, 'travel-390x844-sanity.png') });
    results.push('OK travel-390x844-sanity');
    await travel390.close();
  } finally {
    await browser.close();
  }

  for (const line of results) console.log(line);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
