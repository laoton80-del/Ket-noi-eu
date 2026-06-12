import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8275);
const BASE = `http://localhost:${PORT}`;

const VIEWPORTS = [
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '844x390', width: 844, height: 390 },
  { name: '1024x1366', width: 1024, height: 1366 },
];

const KNOWN_SELECTORS = [
  '[data-testid="travel-dynamic-hero-stage"]',
  '[data-testid="travel-dynamic-hero-default-image"]',
  '[data-testid="travel-dynamic-hero-active-overlay-image"]',
  '[data-testid="travel-hero-editorial-text-layer"]',
  '[data-testid="travel-hero-lighting-network"]',
  '[data-testid="travel-flagship-cards-row"]',
  '[data-testid="travel-flagship-translation"]',
  '[data-testid="travel-flagship-taxi"]',
  '[data-testid="travel-flagship-emergency"]',
  '[data-testid="travel-flagship-airport"]',
];

async function measurePage(page, viewport, state) {
  const records = [];
  for (const sel of KNOWN_SELECTORS) {
    const els = await page.$$(sel);
    for (const el of els) {
      const rec = await el.evaluate(
        (node, args) => {
          const box = node.getBoundingClientRect();
          const cs = getComputedStyle(node);
          const out = {
            viewport: args.viewport,
            state: args.state,
            selector: args.selector,
            testId: node.getAttribute('data-testid'),
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
            aspectRatio: box.height > 0 ? Math.round((box.width / box.height) * 1000) / 1000 : null,
            objectFit: cs.objectFit || null,
            objectPosition: cs.objectPosition || null,
            transform: cs.transform !== 'none' ? cs.transform : null,
            opacity: cs.opacity,
            zIndex: cs.zIndex,
            overflow: cs.overflow,
          };
          if (node instanceof HTMLImageElement) {
            out.src = node.currentSrc || node.src || null;
            out.naturalWidth = node.naturalWidth || null;
            out.naturalHeight = node.naturalHeight || null;
            out.travelHeroKey = node.dataset?.travelHeroKey ?? null;
            out.travelHeroLayer = node.dataset?.travelHeroLayer ?? null;
          }
          return out;
        },
        { viewport: viewport.name, state, selector: sel }
      );
      if (rec) records.push(rec);
    }
  }
  const scanned = await page.evaluate(({ vpName, st }) => {
    const out = [];
    const nodes = document.querySelectorAll('[data-testid]');
    for (const el of nodes) {
      const tid = el.getAttribute('data-testid') || '';
      if (!/(travel|hero|flagship|overlay|fullscreen|dynamic)/i.test(tid)) continue;
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      const cs = getComputedStyle(el);
      const row = {
        viewport: vpName,
        state: st,
        selector: `[data-testid="${tid}"]`,
        testId: tid,
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        aspectRatio: box.height > 0 ? Math.round((box.width / box.height) * 1000) / 1000 : null,
        tag: el.tagName.toLowerCase(),
        objectFit: cs.objectFit || null,
        opacity: cs.opacity,
      };
      if (el instanceof HTMLImageElement) {
        row.src = el.currentSrc || el.src || null;
        row.naturalWidth = el.naturalWidth || null;
        row.naturalHeight = el.naturalHeight || null;
      }
      out.push(row);
    }
    const heroClip = document.querySelector('[data-testid="travel-dynamic-hero-stage"]');
    if (heroClip) {
      const imgs = heroClip.parentElement?.querySelectorAll('img') ?? [];
      for (const img of imgs) {
        const box = img.getBoundingClientRect();
        const cs = getComputedStyle(img);
        out.push({
          viewport: vpName,
          state: st,
          selector: 'hero-descendant-img',
          testId: img.getAttribute('data-testid'),
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          aspectRatio: box.height > 0 ? Math.round((box.width / box.height) * 1000) / 1000 : null,
          objectFit: cs.objectFit,
          objectPosition: cs.objectPosition,
          left: cs.left,
          top: cs.top,
          widthCss: cs.width,
          heightCss: cs.height,
          src: img.currentSrc || img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
      }
    }
    return out;
  }, { vpName: viewport.name, st: state });
  records.push(...scanned);
  return records;
}

async function prep(page) {
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForSelector('[data-testid="travel-flagship-translation"]', { timeout: 120000 });
  await page.waitForTimeout(2000);
}

async function tryFullscreen(page) {
  const btn = page.locator('button, [role="button"]').filter({ hasText: /fullscreen|toàn màn|full screen/i }).first();
  if ((await btn.count()) === 0) return { testable: false, reason: 'no fullscreen control found in DOM' };
  try {
    await btn.click({ timeout: 5000 });
    await page.waitForTimeout(1200);
    const fsActive = await page.evaluate(() => Boolean(document.fullscreenElement));
    return { testable: true, fullscreenActive: fsActive };
  } catch (e) {
    return { testable: false, reason: String(e.message || e) };
  }
}

async function main() {
  mkdirSync(__dirname, { recursive: true });
  const playwrightPkg = pathToFileURL(path.join('c:/KNG/ket-noi-eu/node_modules/playwright/index.mjs')).href;
  const { chromium } = await import(playwrightPkg);
  const browser = await chromium.launch();
  const allRecords = [];
  const screenshots = [];
  const meta = { port: PORT, generatedAt: new Date().toISOString(), fullscreen: null };

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await prep(page);
      allRecords.push(...(await measurePage(page, vp, 'default')));
      const shot = path.join(__dirname, `screenshot-default-${vp.name}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      screenshots.push(shot);
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await prep(page);
    for (const id of ['translation', 'taxi', 'emergency']) {
      await page.hover(`[data-testid="travel-flagship-${id}"]`);
      await page.waitForTimeout(900);
      allRecords.push(...(await measurePage(page, { name: '1366x768', width: 1366, height: 768 }, `hover-${id}`)));
      const shot = path.join(__dirname, `screenshot-hover-${id}-1366x768.png`);
      await page.screenshot({ path: shot, fullPage: false });
      screenshots.push(shot);
    }
    await page.hover('[data-testid="travel-flagship-translation"]');
    await page.waitForTimeout(600);
    const netShot = path.join(__dirname, 'screenshot-hover-lighting-network-1366x768.png');
    await page.screenshot({ path: netShot, fullPage: false });
    screenshots.push(netShot);

    meta.fullscreen = await tryFullscreen(page);
    if (meta.fullscreen.testable && meta.fullscreen.fullscreenActive) {
      allRecords.push(
        ...(await measurePage(page, { name: '1366x768', width: 1366, height: 768 }, 'fullscreen'))
      );
      const fsShot = path.join(__dirname, 'screenshot-fullscreen-1366x768.png');
      await page.screenshot({ path: fsShot, fullPage: false });
      screenshots.push(fsShot);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
    await page.close();
  } finally {
    await browser.close();
  }

  writeFileSync(
    path.join(__dirname, 'RUNTIME_FRAME_AUDIT.json'),
    JSON.stringify({ meta, records: allRecords, screenshots }, null, 2)
  );
  console.log('Recorded', allRecords.length, 'frame measurements;', screenshots.length, 'screenshots');
}

main();
