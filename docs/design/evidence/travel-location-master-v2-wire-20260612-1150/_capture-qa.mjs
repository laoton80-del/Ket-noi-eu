import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8277);
const BASE = `http://localhost:${PORT}`;

const V2_MARKERS = {
  airport: 'travel-airport-web-normal-master-v2',
  prague: 'travel-prague-charles-bridge-castle-web-normal-master-v2',
  paris: 'travel-paris-eiffel-web-normal-master-v2',
  berlin: 'travel-berlin-city-web-normal-master-v2',
};

async function main() {
  mkdirSync(__dirname, { recursive: true });
  const playwrightPkg = pathToFileURL(path.join('c:/KNG/ket-noi-eu/node_modules/playwright/index.mjs')).href;
  const { chromium } = await import(playwrightPkg);
  const browser = await chromium.launch();
  const shots = [];
  const proofs = [];
  const hoverCases = [
    { id: 'translation', marker: V2_MARKERS.prague, heroKey: 'interpreter' },
    { id: 'taxi', marker: V2_MARKERS.paris, heroKey: 'rides' },
    { id: 'emergency', marker: V2_MARKERS.berlin, heroKey: 'emergencyPolice' },
  ];
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

  async function heroSrc(page, testId) {
    const el = await page.$(`[data-testid="${testId}"]`);
    if (!el) return null;
    return el.evaluate((node) =>
      node instanceof HTMLImageElement ? node.currentSrc || node.src : null
    );
  }

  try {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await prepPage(page);
      const defaultSrc = await heroSrc(page, 'travel-dynamic-hero-default-image');
      proofs.push({
        state: `default-${vp.name}`,
        defaultSrc,
        airportV2: Boolean(defaultSrc && defaultSrc.includes(V2_MARKERS.airport)),
      });
      const out = path.join(__dirname, `screenshot-default-${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      shots.push(out);
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await prepPage(page);
    for (const { id, marker, heroKey } of hoverCases) {
      await page.hover(`[data-testid="travel-flagship-${id}"]`);
      await page.waitForTimeout(900);
      const overlaySrc = await heroSrc(page, 'travel-dynamic-hero-active-overlay-image');
      const defaultSrc = await heroSrc(page, 'travel-dynamic-hero-default-image');
      proofs.push({
        id,
        heroKey,
        overlayFound: Boolean(overlaySrc),
        overlayV2: Boolean(overlaySrc && overlaySrc.includes(marker)),
        defaultAirportV2: Boolean(defaultSrc && defaultSrc.includes(V2_MARKERS.airport)),
        srcDiffers: Boolean(overlaySrc && defaultSrc && overlaySrc !== defaultSrc),
      });
      const out = path.join(__dirname, `screenshot-hover-${id}-1366x768.png`);
      await page.screenshot({ path: out, fullPage: false });
      shots.push(out);
    }
    await page.close();
  } finally {
    await browser.close();
  }

  const pass =
    proofs.some((p) => p.airportV2) &&
    hoverCases.every((c) => proofs.some((p) => p.id === c.id && p.overlayV2));

  writeFileSync(
    path.join(__dirname, 'qa-report.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), port: PORT, pass, shots, proofs },
      null,
      2
    )
  );
  console.log('Captured', shots.length, 'shots; pass=', pass);
}

main();
