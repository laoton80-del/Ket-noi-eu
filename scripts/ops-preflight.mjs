/**
 * Observability wiring checks (repo-scope only).
 * Run from repo root: npm run ops:preflight
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function read(relPath) {
  return readFileSync(path.join(root, ...relPath.split('/')), 'utf8');
}

const checks = [
  ['operations runtime module exists', existsSync(path.join(root, 'src', 'observability', 'operationsRuntime.ts'))],
  ['App installs global error handlers', read('App.tsx').includes('installGlobalErrorHandlers')],
  ['App resolves ops runtime config', read('App.tsx').includes('resolveOpsRuntimeConfig')],
  ['App has kill switch screen', read('App.tsx').includes('Kết Nối Global tạm bảo trì')],
  ['ops runbook exists', existsSync(path.join(root, 'docs', 'OBSERVABILITY_OPERATIONS.md'))],
];

let failed = false;
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`[ops-preflight] FAIL: ${label}`);
    failed = true;
  }
}

if (failed) {
  console.error('[ops-preflight] Observability wiring incomplete.');
  process.exit(1);
}

console.log('[ops-preflight] OK: observability runtime wiring anchors present.');
