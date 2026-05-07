/**
 * Read-only rehearsal package anchor check.
 * Does not call APIs, read .env secrets, mutate DB, or dial Twilio.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const DOC_PATHS = [
  'docs/ops/VIONA_MERCHANT_PILOT_REHEARSAL_RUNBOOK.md',
  'docs/ops/VIONA_MERCHANT_PILOT_EVIDENCE_LOG_TEMPLATE.md',
  'docs/ops/VIONA_MERCHANT_PILOT_CANDIDATE_CHECKLIST.md',
  'docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md',
  'docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md',
];

const REQUIRED_NPM_SCRIPTS = [
  'ops:readiness',
  'ai:cost-readiness',
  'twilio:sandbox-readiness',
  'ai:usage-readiness',
  'ai:usage-preview-readiness',
  'ai:auto-pause-readiness',
  'ai:admin-alert-readiness',
  'incident:dry-run-readiness',
  'gate:production-readiness',
  'pilot:rehearsal-readiness',
];

function main() {
  let errors = 0;

  for (const rel of DOC_PATHS) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[merchant-pilot-rehearsal-check] ERROR: missing ${rel}`);
      errors += 1;
    }
  }

  const pkgPath = path.join(root, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('[merchant-pilot-rehearsal-check] ERROR: package.json missing');
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};

  for (const name of REQUIRED_NPM_SCRIPTS) {
    if (typeof scripts[name] !== 'string' || scripts[name].length === 0) {
      console.error(`[merchant-pilot-rehearsal-check] ERROR: package.json missing script "${name}"`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[merchant-pilot-rehearsal-check] FAIL: rehearsal anchors incomplete.');
    process.exit(1);
  }

  console.log(
    `[merchant-pilot-rehearsal-check] OK: ${String(DOC_PATHS.length)} docs, ${String(REQUIRED_NPM_SCRIPTS.length)} package scripts.`
  );
}

main();
