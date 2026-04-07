/**
 * G5 / M1 — Commercial release gate: advisory checklist vs strict commercial-candidate mode.
 *
 * Advisory (default):
 *   npm run preflight:commercial   (after preflight:release — see root package.json)
 *
 * Strict commercial candidate (hard failures — not “printed = safe”):
 *   npm run preflight:commercial:strict
 *   or: COMMERCIAL_GATE_MODE=strict node scripts/commercial-release-gate.mjs
 *
 * Strict mode runs:
 *   - Native readiness with TRUST_NATIVE_READINESS_STRICT=1
 *   - functions:verify-bundle with FUNCTIONS_BUNDLE_CI_REQUIRE_HEAD_SYNC=1 (working tree must match HEAD for functions/lib after build)
 *
 * Optional env (legacy / CI):
 *   COMMERCIAL_GATE_REQUIRE_TRUST_LIVE_STAMP=1 → fail if .trust-live-stamp missing
 *   COMMERCIAL_GATE_ALLOW_NO_TRUST_LIVE_STAMP=I_UNDERSTAND → waive trust-live in strict mode only (dangerous)
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const stampPath = path.join(root, '.trust-live-stamp');

const strict =
  process.argv.includes('--strict') || process.env.COMMERCIAL_GATE_MODE?.trim().toLowerCase() === 'strict';

console.log('');
console.log('=== Kết Nối Global — G5 commercial release gate ===');
if (strict) {
  console.log('[commercial-gate] MODE: **STRICT** (commercial candidate — failures exit non-zero)');
} else {
  console.log('[commercial-gate] MODE: **ADVISORY** (checklist only — use preflight:commercial:strict for hard gate)');
}
console.log('');

function run(cmd, extraEnv = {}) {
  const r = spawnSync(cmd, { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, ...extraEnv } });
  return r.status ?? 1;
}

if (strict) {
  const waiveTrust =
    process.env.COMMERCIAL_GATE_ALLOW_NO_TRUST_LIVE_STAMP?.trim() === 'I_UNDERSTAND';
  if (!existsSync(stampPath) && !waiveTrust) {
    console.error('[commercial-gate] FAIL (strict): .trust-live-stamp missing. Run npm run trust:live with TRUST_SMOKE_* , or set COMMERCIAL_GATE_ALLOW_NO_TRUST_LIVE_STAMP=I_UNDERSTAND (documented waiver only).');
    process.exit(1);
  }
  if (!existsSync(stampPath) && waiveTrust) {
    console.warn('[commercial-gate] WARN (strict): trust-live stamp waived via COMMERCIAL_GATE_ALLOW_NO_TRUST_LIVE_STAMP.');
  }

  const nr = run('npm run trust:native-readiness', { TRUST_NATIVE_READINESS_STRICT: '1' });
  if (nr !== 0) {
    console.error('[commercial-gate] FAIL (strict): native readiness strict failed.');
    process.exit(nr);
  }

  const vb = run('npm run functions:verify-bundle', { FUNCTIONS_BUNDLE_CI_REQUIRE_HEAD_SYNC: '1' });
  if (vb !== 0) {
    console.error('[commercial-gate] FAIL (strict): functions bundle verify + HEAD sync failed (commit functions/lib if build changed it).');
    process.exit(vb);
  }

  console.log('[commercial-gate] STRICT block OK: trust stamp (or waiver), native readiness, functions/lib HEAD parity after build.');
}

if (process.env.COMMERCIAL_GATE_REQUIRE_TRUST_LIVE_STAMP === '1' && !existsSync(stampPath)) {
  console.error('[commercial-gate] FAIL: COMMERCIAL_GATE_REQUIRE_TRUST_LIVE_STAMP=1 but .trust-live-stamp missing.');
  process.exit(1);
}

if (process.env.COMMERCIAL_GATE_REQUIRE_NATIVE_READINESS_STRICT === '1' && !strict) {
  const r = spawnSync(
    process.execPath,
    [path.join(root, 'scripts', 'trust-native-readiness.mjs')],
    {
      env: { ...process.env, TRUST_NATIVE_READINESS_STRICT: '1' },
      stdio: 'inherit',
    }
  );
  if (r.status !== 0) {
    console.error('[commercial-gate] FAIL: native readiness strict check failed (see trust-native-readiness).');
    process.exit(r.status ?? 1);
  }
}

console.log('[commercial-gate] Checklist (human confirmation — does not replace staging QA):');
console.log('  1) Native M1: dev client / store builds use @react-native-firebase/app-check (see docs/G5_PLATFORM_TRUST.md). Expo Go = no App Check token.');
console.log('  2) FIREBASE_APP_CHECK_ENFORCE=1: align with docs/G5; set NATIVE_EXPECTED or WEB_ONLY_ENFORCEMENT deliberately.');
console.log('  3) Web enforcement: EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY + Console App Check for web app.');
console.log('  4) npm run trust:native-readiness — wiring only; device proof: trust:live or on-device.');
console.log('  5) trust:live: set TRUST_SMOKE_* ; optional COMMERCIAL_GATE_REQUIRE_TRUST_LIVE_STAMP=1.');
console.log('  6) EXPO_PUBLIC_RELEASE_TRUST_PROFILE: native_pilot | web_commercial | mixed_pilot (labels only).');
console.log('  7) App Check unsafe default logs: docs/G5_PLATFORM_TRUST.md.');
console.log('  8) Wallet receipt ops: docs/RECEIPT_STRICTNESS.md + scripts/verify-receipt-strictness.mjs.');
console.log('  9) Bundle parity: docs/FUNCTIONS_BUNDLE_PARITY.md ; CI defaults HEAD sync when CI=true.');
console.log('');
if (existsSync(stampPath)) {
  const stamp = readFileSync(stampPath, 'utf8').trim();
  console.log(`[commercial-gate] .trust-live-stamp: ${stamp}`);
} else {
  console.log('[commercial-gate] No .trust-live-stamp — required for strict mode unless waived.');
}
if (strict) {
  console.log('[commercial-gate] OK (STRICT): automated checks passed. Still not legal/compliance/payments certification.');
} else {
  console.log('[commercial-gate] OK (ADVISORY): checklist printed. Use `npm run preflight:commercial:strict` for hard gate.');
}
console.log('');
