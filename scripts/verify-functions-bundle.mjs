/**
 * Phase 2.2C — rebuild Cloud Functions bundle and fail if committed `functions/lib` was stale.
 *
 * Source of truth: `functions/src` + bundled `../src` via `@app` (`functions/esbuild.mjs`).
 * Output: `functions/lib/index.js` — when it changes, **commit** it with the TS/source changes.
 *
 * Run from repo root: `npm run functions:verify-bundle`
 * Or from functions/: `npm run verify-bundle`
 *
 * Set SKIP_FUNCTIONS_BUNDLE_GIT_CHECK=1 to only rebuild (no git check) — e.g. export zips without .git.
 *
 * HEAD sync after build:
 * - **CI default:** when `CI=true` or `GITHUB_ACTIONS=true`, HEAD sync runs unless `FUNCTIONS_BUNDLE_CI_RELAX_HEAD_SYNC=1`.
 * - **Local explicit:** `FUNCTIONS_BUNDLE_CI_REQUIRE_HEAD_SYNC=1` (same check; useful outside GitHub).
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const functionsDir = path.join(root, 'functions');

console.log(
  '[verify-functions-bundle] SoT: functions/src + ../src (@app) → functions/lib — commit lib when it changes.'
);

function readPorcelainForFunctionsLib() {
  return execSync('git status --porcelain=v1 -- functions/lib', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
}

let beforePorcelain = '';
try {
  beforePorcelain = readPorcelainForFunctionsLib();
} catch {
  const ci = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  if (ci) {
    console.error('[verify-functions-bundle] FAIL: git required for parity check in CI.');
    process.exit(1);
  }
  console.warn('[verify-functions-bundle] git unavailable — skipping dirty check (install Git, or set SKIP_FUNCTIONS_BUNDLE_GIT_CHECK=1).');
  process.exit(0);
}

execSync('npm run build', { cwd: functionsDir, stdio: 'inherit', shell: true });

const ciEnv = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const relaxHead = process.env.FUNCTIONS_BUNDLE_CI_RELAX_HEAD_SYNC === '1';
const requireHeadSync =
  process.env.FUNCTIONS_BUNDLE_CI_REQUIRE_HEAD_SYNC === '1' || (ciEnv && !relaxHead);

if (requireHeadSync) {
  try {
    execSync('git diff --quiet HEAD -- functions/lib', { cwd: root, stdio: 'pipe' });
  } catch {
    console.error(
      '[verify-functions-bundle] FAIL: HEAD sync check — `functions/lib` differs from HEAD after build.'
    );
    console.error('Reason: CI/GitHub Actions requires committed bundle, or local FUNCTIONS_BUNDLE_CI_REQUIRE_HEAD_SYNC=1.');
    console.error('Fix: run `cd functions && npm run build`, then stage/commit `functions/lib` with your source changes.');
    console.error('Escape (CI only): FUNCTIONS_BUNDLE_CI_RELAX_HEAD_SYNC=1 (document why in PR).');
    process.exit(1);
  }
}

if (process.env.SKIP_FUNCTIONS_BUNDLE_GIT_CHECK === '1') {
  console.log('[verify-functions-bundle] SKIP_FUNCTIONS_BUNDLE_GIT_CHECK=1 — git parity check skipped.');
  process.exit(0);
}

const afterPorcelain = readPorcelainForFunctionsLib();
if (afterPorcelain !== beforePorcelain) {
  console.error('[verify-functions-bundle] FAIL: `functions/lib` changed after `npm run build`.');
  console.error('Bundle parity drift detected relative to pre-build repo state.');
  console.error('Fix: review changes in `functions/lib`, then stage/commit them (or revert unintended source edits).');
  console.error('--- before build ---');
  console.error(beforePorcelain || '(clean)');
  console.error('--- after build ---');
  console.error(afterPorcelain || '(clean)');
  process.exit(1);
}

console.log('[verify-functions-bundle] OK: build did not introduce new `functions/lib` drift.');
