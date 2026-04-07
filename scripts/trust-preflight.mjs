/**
 * G2 — static trust wiring checks (NOT live Firebase, NOT E2E).
 *
 * From repo root: npm run trust:preflight
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

const checks = [
  ['functions/src/trustRuntimeDiagnostics.ts exists', existsSync(path.join(root, 'functions', 'src', 'trustRuntimeDiagnostics.ts'))],
  ['functions index loads trustRuntimeDiagnostics', read('functions/src/index.ts').includes('trustRuntimeDiagnostics')],
  ['functions index exports b2bStaffQueueSnapshot', read('functions/src/index.ts').includes('b2bStaffQueueSnapshot')],
  ['appCheckGate documents G2 surfaces', read('functions/src/appCheckGate.ts').includes('G2')],
  ['b2bMerchantAccess: HTTPS-fail fallback explicit opt-in', read('src/config/b2bMerchantAccess.ts').includes('isB2bHttpsFailureFirestoreFallbackEnabled')],
  ['b2bStaffQueueClient uses HTTPS-fail fallback flag', read('src/services/b2b/merchant/b2bStaffQueueClient.ts').includes('isB2bHttpsFailureFirestoreFallbackEnabled')],
  ['docs/G2_RUNTIME_TRUST.md exists', existsSync(path.join(root, 'docs', 'G2_RUNTIME_TRUST.md'))],
  ['wallet callWalletOps parses error body', read('src/state/wallet.ts').includes('wallet_ops_http_error')],
  ['OpenAIService aiProxy error parsing', read('src/services/OpenAIService.ts').includes('throwAiProxyHttpError')],
  ['G3 appBrand spine', existsSync(path.join(root, 'src', 'config', 'appBrand.ts'))],
  ['G3 trustBackendHeaders', existsSync(path.join(root, 'src', 'utils', 'trustBackendHeaders.ts'))],
  ['G3 appCheckClient', read('src/config/appCheckClient.ts').includes('describeAppCheckClientPosture')],
  ['G3 trust-live-smoke script', existsSync(path.join(root, 'scripts', 'trust-live-smoke.mjs'))],
  ['G5 platform trust doc', existsSync(path.join(root, 'docs', 'G5_PLATFORM_TRUST.md'))],
  ['G5 commercial-release-gate script', existsSync(path.join(root, 'scripts', 'commercial-release-gate.mjs'))],
  ['G5 runtimeTrustProfile', read('src/config/runtimeTrustProfile.ts').includes('maybeLogNativeAppCheckEnforcementRiskOnce')],
  ['Wave 1 verify-receipt-strictness harness', existsSync(path.join(root, 'scripts', 'verify-receipt-strictness.mjs'))],
  ['Wave 1 closure evidence doc', existsSync(path.join(root, 'docs', 'WAVE1_CLOSURE_EVIDENCE.md'))],
  ['Wave 1 D8 money paths doc', existsSync(path.join(root, 'docs', 'D8_RUNTIME_SENSITIVE_MONEY_PATHS.md'))],
];

let failed = false;
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`[trust-preflight] FAIL: ${label}`);
    failed = true;
  }
}

if (failed) {
  console.error('[trust-preflight] Fix wiring before treating runtime trust as release-ready.');
  process.exit(1);
}

console.log('[trust-preflight] OK: static trust anchors present (see docs/G2_RUNTIME_TRUST.md + docs/G3_APP_CHECK_AND_RELEASE.md).');
console.log('[trust-preflight] Next: npm run preflight:with-functions for app + Functions bundle parity.');
