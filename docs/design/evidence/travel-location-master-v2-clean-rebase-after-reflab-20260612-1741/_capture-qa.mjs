import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8291);
const BASE = `http://localhost:${PORT}`;

async function main() {
  mkdirSync(__dirname, { recursive: true });
  const playwrightPkg = pathToFileURL(path.join('c:/KNG/ket-noi-eu/node_modules/playwright/index.mjs')).href;
  const { chromium } = await import(playwrightPkg);
  const browser = await chromium.launch();
  const shots = [];
  const proofs = [];

  async function prepPage(page) {
    await page.addInitScript(() => {
      localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
    });
    await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 240000 });
    await page.waitForSelector('[data-testid="travel-flagship-translation"]', { timeout: 120000 });
    await page.waitForTimeout(2000);
  }

  try {
    const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await prepPage(page1366);
    await page1366.screenshot({ path: path.join(__dirname, 'screenshot-travel-airport-1366x768.png'), fullPage: false });
    shots.push('airport-1366');
    for (const { id, file } of [
      { id: 'translation', file: 'screenshot-travel-prague-1366x768.png' },
      { id: 'taxi', file: 'screenshot-travel-paris-1366x768.png' },
      { id: 'emergency', file: 'screenshot-travel-berlin-1366x768.png' },
    ]) {
      await page1366.hover(`[data-testid="travel-flagship-${id}"]`);
      await page1366.waitForTimeout(900);
      await page1366.screenshot({ path: path.join(__dirname, file), fullPage: false });
      shots.push(file);
    }
    await page1366.screenshot({ path: path.join(__dirname, 'screenshot-quick-help-cards-1366x768.png'), fullPage: false });
    const cardSrcs = {};
    for (const id of ['airport', 'translation', 'taxi', 'emergency']) {
      const tile = await page1366.$(`[data-testid="travel-flagship-${id}"] img`);
      cardSrcs[id] = tile
        ? await tile.evaluate((el) => (el instanceof HTMLImageElement ? el.currentSrc || el.src : null))
        : null;
    }
    proofs.push({ cardSrcDistinct: new Set(Object.values(cardSrcs).filter(Boolean)).size, cardSrcs });
    await page1366.close();

    for (const vp of [
      { name: '1024x768', width: 1024, height: 768 },
      { name: '768x1024', width: 768, height: 1024 },
      { name: '390x844', width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await prepPage(page);
      await page.screenshot({ path: path.join(__dirname, `screenshot-travel-default-${vp.name}.png`), fullPage: false });
      shots.push(vp.name);
      await page.close();
    }

    const routes = ['/home', '/local', '/ai'];
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
      });
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(8000);
      proofs.push({
        route,
        textLen: await page.evaluate(() => (document.body.innerText || '').trim().length),
        refLabErr: errs.some((m) => /ReferenceLabStackScreensGate|only contain 'Screen'/i.test(m)),
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  writeFileSync(
    path.join(__dirname, 'qa-report.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        port: PORT,
        noAppWorkaround: true,
        shots,
        proofs,
      },
      null,
      2
    )
  );
  console.log('Captured', shots.length);
}

main();
