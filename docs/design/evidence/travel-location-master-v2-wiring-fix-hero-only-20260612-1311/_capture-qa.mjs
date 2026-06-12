import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8285);
const BASE = `http://localhost:${PORT}`;

async function main() {
  mkdirSync(__dirname, { recursive: true });
  const playwrightPkg = pathToFileURL(path.join('c:/KNG/ket-noi-eu/node_modules/playwright/index.mjs')).href;
  const { chromium } = await import(playwrightPkg);
  const browser = await chromium.launch();
  const shots = [];
  const proofs = [];
  const viewports = [
    { name: '1366x768', width: 1366, height: 768 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '768x1024', width: 768, height: 1024 },
    { name: '390x844', width: 390, height: 844 },
  ];

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
    const outDefault = path.join(__dirname, 'screenshot-hero-airport-1366x768.png');
    await page1366.screenshot({ path: outDefault, fullPage: false });
    shots.push(outDefault);

    const cardSrcs = {};
    for (const id of ['airport', 'translation', 'taxi', 'emergency']) {
      const tile = await page1366.$(`[data-testid="travel-flagship-${id}"] img`);
      cardSrcs[id] = tile
        ? await tile.evaluate((el) => (el instanceof HTMLImageElement ? el.currentSrc || el.src : null))
        : null;
    }
    await page1366.screenshot({
      path: path.join(__dirname, 'screenshot-quick-help-cards-1366x768.png'),
      fullPage: false,
    });
    shots.push('quick-help-cards');
    proofs.push({ cardSrcs, cardSrcDistinct: new Set(Object.values(cardSrcs).filter(Boolean)).size });

    for (const { id, file } of [
      { id: 'translation', file: 'screenshot-hero-prague-1366x768.png' },
      { id: 'taxi', file: 'screenshot-hero-paris-1366x768.png' },
      { id: 'emergency', file: 'screenshot-hero-berlin-1366x768.png' },
    ]) {
      await page1366.hover(`[data-testid="travel-flagship-${id}"]`);
      await page1366.waitForTimeout(900);
      const out = path.join(__dirname, file);
      await page1366.screenshot({ path: out, fullPage: false });
      shots.push(out);
    }
    await page1366.close();

    for (const vp of viewports.filter((v) => v.name !== '1366x768')) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await prepPage(page);
      const out = path.join(__dirname, `screenshot-default-${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      shots.push(out);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  writeFileSync(
    path.join(__dirname, 'qa-report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), port: PORT, shots, proofs }, null, 2)
  );
  console.log('Captured', shots.length, 'items');
}

main();
