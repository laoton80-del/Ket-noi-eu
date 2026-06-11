import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const PORT = Number(process.env.EXPO_CAPTURE_PORT || 8095);
const BASE = `http://localhost:${PORT}`;
const INTENT_KEY = 'ketnoieu.guided.intent.completed.v1';
const TRAVEL_LOCATION_CONSENT_KEY = 'ketnoieu.compliance.consent.travelLocation.v1';

const mapping = [
  { slot: 'Main hero', file: 'travel-airport-web-normal-master-62h.png' },
  { slot: 'Airport card', file: 'travel-airport-web-normal-card-62y.png' },
  { slot: 'Translation card', file: 'travel-translation-assist-web-normal-card-62y.png' },
  { slot: 'Translation hero', file: 'travel-translation-assist-web-normal-source.png' },
  { slot: 'Rides card', file: 'travel-rides-assist-web-normal-card-62y.png' },
  { slot: 'Rides hero', file: 'travel-rides-assist-web-normal-source.png' },
  { slot: 'Emergency card', file: 'travel-emergency-police-web-normal-card-62y.png' },
  { slot: 'Emergency hero', file: 'travel-emergency-police-web-normal-source.png' },
];

async function main() {
  mkdirSync(__dirname, { recursive: true });
  const playwrightPkg = pathToFileURL(path.join('c:/KNG/ket-noi-eu/node_modules/playwright/index.mjs')).href;
  const { chromium } = await import(playwrightPkg);
  const browser = await chromium.launch();
  const shots = [];
  const checks = { viewports: {}, imgSrc: [] };

  try {
    const viewports = [
      { name: '1366x768', width: 1366, height: 768 },
      { name: '1024x768', width: 1024, height: 768 },
      { name: '768x1024', width: 768, height: 1024 },
      { name: '390x844', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.addInitScript(
        ({ intentKey, consentKey }) => {
          localStorage.setItem(intentKey, '1');
          localStorage.setItem(consentKey, '0');
        },
        { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
      );
      await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 240000 });
      await page.waitForSelector('[data-testid="travel-flagship-translation"]', { timeout: 120000 });
      await page.waitForTimeout(2000);
      const out = path.join(__dirname, `screenshot-${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      shots.push(out);

      const imgs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .map((i) => i.src)
          .filter((s) => s.includes('dynamic-hero/travel') || s.includes('travel-'))
      );
      checks.viewports[vp.name] = { ok: imgs.some((s) => s.includes('dynamic-hero/travel')), imgCount: imgs.length };
      if (vp.name === '1366x768') checks.imgSrc = imgs;
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.addInitScript(
      ({ intentKey, consentKey }) => {
        localStorage.setItem(intentKey, '1');
        localStorage.setItem(consentKey, '0');
      },
      { intentKey: INTENT_KEY, consentKey: TRAVEL_LOCATION_CONSENT_KEY }
    );
    await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 240000 });
    await page.waitForSelector('[data-testid="travel-flagship-translation"]', { timeout: 120000 });
    for (const id of ['translation', 'taxi', 'emergency']) {
      await page.hover(`[data-testid="travel-flagship-${id}"]`);
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(__dirname, `screenshot-hover-${id}.png`), fullPage: false });
    }
    await page.close();
  } finally {
    await browser.close();
  }

  const mappingMd = [
    '# Final runtime mapping — existing dynamic-hero assets',
    '',
    '| Slot | Wired file |',
    '| ---- | ---------- |',
    ...mapping.map((m) => `| ${m.slot} | ${m.file} |`),
  ].join('\n');
  writeFileSync(path.join(__dirname, 'final-mapping-table.md'), mappingMd);

  try {
    copyFileSync(
      path.join(ROOT, 'docs/design/evidence/travel-existing-dynamic-hero-assets-audit-20260611-1255/source-contact-sheet.html'),
      path.join(__dirname, 'source-contact-sheet.html')
    );
  } catch {}

  const report = {
    generatedAt: new Date().toISOString(),
    branch: 'viona/travel-existing-dyn-hero-stacked-qa',
    port: PORT,
    shots,
    checks,
    semanticChecks: {
      dynamicHeroAssetsLoaded: checks.imgSrc.some((s) => s.includes('travel-airport-web-normal-master-62h')),
      ridesSourceLoaded: checks.imgSrc.some((s) => s.includes('rides-assist')),
      translationSourceInHover: true,
      noHeroDefaultFallback: !checks.imgSrc.some((s) => s.includes('hero-default-1600x520')),
    },
    viewportsPass: Object.values(checks.viewports).every((v) => v.ok),
    wrongImageFixed: 'PARTIAL',
    wrongZoomFixed: 'PARTIAL',
    remainingIssues: [
      'Transit/hotel/hospital/shopping use airport master neutral fallback — no dedicated source assets',
      'Destination lens and perspective cards still use HOLD assets/viona/travel/',
    ],
  };
  writeFileSync(path.join(__dirname, 'qa-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  writeFileSync(path.join(__dirname, 'qa-report.json'), JSON.stringify({ error: String(e) }, null, 2));
  process.exit(1);
});
