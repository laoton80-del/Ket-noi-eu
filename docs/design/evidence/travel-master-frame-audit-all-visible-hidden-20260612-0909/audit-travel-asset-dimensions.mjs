import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../../..');

const SCAN_DIRS = [
  path.join(ROOT, 'assets/viona/dynamic-hero/travel'),
  path.join(ROOT, 'assets/viona/dynamic-hero/_incoming-travel-master-v2-local-standard'),
  path.join(ROOT, 'assets/viona/travel'),
];

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function categoryGuess(name) {
  if (name.includes('master-v2')) return 'v2 incoming';
  if (name.includes('fullscreen')) return 'fullscreen candidate';
  if (name.includes('-master-')) return 'master';
  if (name.includes('-card-')) return 'card';
  if (name.includes('-source')) return 'source/hero hover';
  if (name.includes('perspective') || name.includes('situation') || name.includes('destination')) return 'secondary/hold';
  if (name.includes('hero')) return 'legacy hero';
  return 'other/candidate';
}

function wiredGuess(name) {
  const wired = new Set([
    'travel-airport-web-normal-master-62h.png',
    'travel-airport-web-normal-card-62y.png',
    'travel-translation-assist-web-normal-card-62y.png',
    'travel-translation-assist-web-normal-source.png',
    'travel-rides-assist-web-normal-card-62y.png',
    'travel-rides-assist-web-normal-source.png',
    'travel-emergency-police-web-normal-card-62y.png',
    'travel-emergency-police-web-normal-source.png',
  ]);
  return wired.has(name) ? 'wired-runtime' : 'on-disk-only';
}

const rows = [];
const seen = new Set();

for (const dir of SCAN_DIRS) {
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    if (!name.toLowerCase().endsWith('.png')) continue;
    const filePath = path.join(dir, name);
    const key = filePath.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const buf = readFileSync(filePath);
    let png;
    try {
      png = PNG.sync.read(buf);
    } catch {
      continue;
    }
    rows.push({
      filename: name,
      directory: path.relative(ROOT, dir).replace(/\\/g, '/'),
      width: png.width,
      height: png.height,
      aspectRatio: Math.round((png.width / png.height) * 1000) / 1000,
      fileSizeBytes: statSync(filePath).size,
      sha256: sha256(filePath),
      category: categoryGuess(name),
      runtimeStatus: wiredGuess(name),
    });
  }
}

rows.sort((a, b) => a.filename.localeCompare(b.filename));

mkdirSync(__dirname, { recursive: true });
writeFileSync(path.join(__dirname, 'ASSET_DIMENSION_AUDIT.json'), JSON.stringify({ generatedAt: new Date().toISOString(), count: rows.length, assets: rows }, null, 2));
console.log('Audited', rows.length, 'Travel PNG assets');
