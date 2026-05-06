/**
 * Post-build workaround for Firebase Hosting + Expo Web:
 * Expo may emit font assets under `dist/assets/node_modules/`, which Hosting can skip.
 *
 * Usage (from repo root, after `npx expo export -p web`):
 *   node fix-fonts.js
 */

const fs = require('fs/promises');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const FROM_DIR = path.join(DIST_DIR, 'assets', 'node_modules');
const TO_DIR = path.join(DIST_DIR, 'assets', 'vendor_modules');
const FROM_PREFIX = 'assets/node_modules/';
const TO_PREFIX = 'assets/vendor_modules/';

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function renameIfNeeded() {
  const fromOk = await pathExists(FROM_DIR);
  if (!fromOk) {
    console.log(`[fix-fonts] Skip rename: missing directory ${path.relative(__dirname, FROM_DIR)}`);
    return false;
  }

  const toOk = await pathExists(TO_DIR);
  if (toOk) {
    console.error(
      `[fix-fonts] Refusing to rename: target already exists ${path.relative(__dirname, TO_DIR)}`
    );
    process.exitCode = 1;
    return false;
  }

  await fs.rename(FROM_DIR, TO_DIR);
  console.log(
    `[fix-fonts] Renamed ${path.relative(__dirname, FROM_DIR)} -> ${path.relative(__dirname, TO_DIR)}`
  );
  return true;
}

async function walkFiles(dir) {
  /** @type {string[]} */
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(full)));
    } else if (ent.isFile()) {
      out.push(full);
    }
  }
  return out;
}

async function rewriteDistStrings() {
  const distOk = await pathExists(DIST_DIR);
  if (!distOk) {
    console.log(`[fix-fonts] Skip rewrite: missing dist directory ${path.relative(__dirname, DIST_DIR)}`);
    return { scanned: 0, changed: 0 };
  }

  const allFiles = await walkFiles(DIST_DIR);
  const targets = allFiles.filter((f) => f.endsWith('.js') || f.endsWith('.html'));

  let changed = 0;
  for (const file of targets) {
    const original = await fs.readFile(file, 'utf8');
    if (!original.includes(FROM_PREFIX)) continue;
    const next = original.split(FROM_PREFIX).join(TO_PREFIX);
    if (next !== original) {
      await fs.writeFile(file, next, 'utf8');
      changed += 1;
    }
  }

  console.log(
    `[fix-fonts] Rewrote strings in ${changed}/${targets.length} files (scanned ${targets.length} *.js/*.html under dist/)`
  );
  return { scanned: targets.length, changed };
}

async function main() {
  await renameIfNeeded();
  await rewriteDistStrings();
  console.log('[fix-fonts] Success: font asset path workaround completed.');
}

main().catch((err) => {
  console.error('[fix-fonts] Failed:', err);
  process.exitCode = 1;
});
