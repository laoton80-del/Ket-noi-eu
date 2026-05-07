/**
 * Read-only anchor check for global production gate documentation and core modules.
 * Does not call APIs, read secrets, or import application TypeScript.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const DOC_PATHS = [
  'docs/ai-context/VIONA_OPERATING_PROTOCOL.md',
  'docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md',
  'docs/ops/VIONA_AI_COST_FIREWALL_RUNBOOK.md',
  'docs/ops/VIONA_AI_USAGE_METERING_RUNBOOK.md',
  'docs/ops/VIONA_TWILIO_SANDBOX_PILOT_RUNBOOK.md',
  'docs/ops/VIONA_INCIDENT_DRY_RUN_RUNBOOK.md',
  'docs/ops/VIONA_AI_AUTO_PAUSE_DRY_RUN_RUNBOOK.md',
  'docs/ops/VIONA_AI_ADMIN_ALERT_DRY_RUN_RUNBOOK.md',
];

const CORE_PATHS = [
  'src/core/miniapps/miniAppRegistry.ts',
  'src/core/miniapps/resolveMiniAppEntry.ts',
  'src/core/i18n/smartTrioConfig.ts',
  'src/core/i18n/resolveSmartTrioLocale.ts',
  'src/core/aiCost/aiCostGuardRegistry.ts',
  'src/core/aiUsage/aiUsageMeter.ts',
  'src/core/aiEnforcement/evaluateAiAutoPauseDecision.ts',
  'src/core/aiAlerts/buildAiAdminAlertPreview.ts',
  'src/core/incidents/buildIncidentDryRunRecord.ts',
  'src/core/telephony/telephonyPilotRegistry.ts',
];

const REQUIRED_NPM_SCRIPTS = [
  'ci:expo-readiness',
  'ops:readiness',
  'ai:cost-readiness',
  'twilio:sandbox-readiness',
  'ai:usage-readiness',
  'ai:usage-preview-readiness',
  'ai:auto-pause-readiness',
  'ai:admin-alert-readiness',
  'incident:dry-run-readiness',
  'gate:production-readiness',
];

function main() {
  let errors = 0;

  for (const rel of [...DOC_PATHS, ...CORE_PATHS]) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[global-production-gate-check] ERROR: missing ${rel}`);
      errors += 1;
    }
  }

  const pkgPath = path.join(root, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error('[global-production-gate-check] ERROR: package.json missing');
    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};

  for (const name of REQUIRED_NPM_SCRIPTS) {
    if (typeof scripts[name] !== 'string' || scripts[name].length === 0) {
      console.error(`[global-production-gate-check] ERROR: package.json missing script "${name}"`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[global-production-gate-check] FAIL: anchors incomplete.');
    process.exit(1);
  }

  console.log(
    `[global-production-gate-check] OK: ${String(DOC_PATHS.length)} ops/ai-context docs, ${String(CORE_PATHS.length)} core anchors, ${String(REQUIRED_NPM_SCRIPTS.length)} package scripts.`
  );
}

main();
