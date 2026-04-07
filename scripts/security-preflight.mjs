/**
 * Security static checks (repo-scope, no external secret managers).
 * Run from repo root: npm run security:preflight
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function read(relPath) {
  return readFileSync(path.join(root, ...relPath.split('/')), 'utf8');
}

const adminDebugGate = read('src/config/adminDebugGate.ts');
const envExample = read('.env.example');
const opsRuntime = read('src/observability/operationsRuntime.ts');

const checks = [
  ['admin debug release ack guard present', adminDebugGate.includes('EXPO_PUBLIC_ENABLE_ADMIN_DEBUG_RELEASE_ACK')],
  ['admin PIN blocked in release bundles', adminDebugGate.includes('if (!__DEV__) return null;')],
  ['admin PIN minimum length raised', adminDebugGate.includes('p.length >= 12')],
  ['no EXPO_PUBLIC_OBS_INGEST_TOKEN guidance', !envExample.includes('EXPO_PUBLIC_OBS_INGEST_TOKEN')],
  ['ops runtime does not read client ingest token', !opsRuntime.includes('EXPO_PUBLIC_OBS_INGEST_TOKEN')],
];

let failed = false;
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`[security-preflight] FAIL: ${label}`);
    failed = true;
  }
}

if (failed) {
  console.error('[security-preflight] Fix security wiring before release.');
  process.exit(1);
}

console.log('[security-preflight] OK: repo-side security guards present.');
