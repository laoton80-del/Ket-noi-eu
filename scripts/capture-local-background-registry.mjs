/**
 * Local background registry screenshot QA.
 * Prereq: npx expo start --web --port 8088 --clear
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs', 'design', 'evidence', 'wave-3b-local-background-registry');
const CAPTURE_PORT = Number(process.env.EXPO_CAPTURE_PORT || process.env.CAPTURE_PORT || 8088);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${CAPTURE_PORT}`;

const VIEWPORTS = [
  { name: 'local-390x844', width: 390, height: 844, expected: 'mobile-portrait' },
  { name: 'local-844x390', width: 844, height: 390, expected: 'mobile-landscape' },
  { name: 'local-768x1024', width: 768, height: 1024, expected: 'tablet-portrait' },
  { name: 'local-1024x768', width: 1024, height: 768, expected: 'tablet-landscape' },
  { name: 'local-1366x768', width: 1366, height: 768, expected: 'web-landscape' },
];

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const meta = [];
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(`${BASE}/local`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
      await page.waitForSelector('[data-testid="local-premium-shell"]', { timeout: 90_000 });
      await page.waitForTimeout(1000);
      const out = path.join(OUT_DIR, `${vp.name}.png`);
      await page.screenshot({ path: out, fullPage: true });
      meta.push({ ...vp, artifact: out });
      console.log(`wrote ${out} (expect ${vp.expected})`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  await writeFile(
    path.join(OUT_DIR, 'capture-meta.json'),
    `${JSON.stringify({ capturedAt: new Date().toISOString(), viewports: meta }, null, 2)}\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
