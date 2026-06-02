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
  'wave-3b-travel-quick-help-semantic-color-alignment'
);
const BASE = process.env.VIONA_WEB_BASE ?? `http://localhost:${process.env.EXPO_CAPTURE_PORT || 8093}`;

async function main() {
  const { chromium } = await import('playwright');
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => {
    localStorage.setItem('ketnoieu.guided.intent.completed.v1', '1');
    localStorage.setItem('ketnoieu.compliance.consent.travelLocation.v1', '0');
  });
  await page.goto(`${BASE}/travel`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('[data-testid="travel-flagship-emergency"]', { timeout: 60_000 });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(OUT_DIR, 'travel-quick-help-semantic-1366x768.png'),
    fullPage: false,
  });
  console.log('OK travel-quick-help-semantic-1366x768');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
