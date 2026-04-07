/**
 * Phase 5 — lightweight release smoke (NOT E2E, NOT full QA).
 *
 * Runs:
 * 1) `tsc --noEmit` for the Expo app (functions excluded via root tsconfig).
 * 2) Narrow string checks that critical stack routes stayed registered.
 *
 * From repo root: `npm run smoke`
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

execSync('npx tsc --noEmit', { cwd: root, stdio: 'inherit', shell: true });

const appTsx = readFileSync(path.join(root, 'App.tsx'), 'utf8');
const routesTs = readFileSync(path.join(root, 'src', 'navigation', 'routes.ts'), 'utf8');

const checks = [
  ['App.tsx uses appBrand (G3 spine)', appTsx.includes("from './src/config/appBrand'")],
  ['App.tsx registers TravelCompanion', appTsx.includes('name="TravelCompanion"')],
  ['App.tsx registers FlightSearchAssistant', appTsx.includes('name="FlightSearchAssistant"')],
  ['routes.ts declares TravelCompanion', /TravelCompanion\s*:/.test(routesTs)],
  ['routes.ts declares FlightSearchAssistant', /FlightSearchAssistant\s*:/.test(routesTs)],
];

let failed = false;
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`[release-smoke] FAIL: ${label}`);
    failed = true;
  }
}

if (failed) {
  console.error('[release-smoke] Fix navigation registration before release.');
  process.exit(1);
}

console.log('[release-smoke] OK: app typecheck + navigation registry spot-check (see docs/RELEASE_DISCIPLINE.md).');
