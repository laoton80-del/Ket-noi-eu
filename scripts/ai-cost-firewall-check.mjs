/**
 * Validates AI cost firewall foundation files exist and registry contains required fields.
 * Does not read .env, call providers, or import TypeScript sources.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FEATURE_IDS = [
  'aiReceptionistDemo',
  'aiReceptionistPilot',
  'b2cAiCallAssistant',
  'leonaAssistant',
  'minhKhangTranslator',
  'documentScanner',
  'liveInterpreter',
  'copilot',
  'outboundMarketingDraft',
];

const PATHS = {
  types: 'src/core/aiCost/aiCostTypes.ts',
  registry: 'src/core/aiCost/aiCostGuardRegistry.ts',
  index: 'src/core/aiCost/index.ts',
  runbook: 'docs/ops/VIONA_AI_COST_FIREWALL_RUNBOOK.md',
};

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

function main() {
  let errors = 0;

  for (const [label, rel] of Object.entries(PATHS)) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[ai-cost-firewall-check] ERROR: missing ${label}: ${rel}`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[ai-cost-firewall-check] FAIL: required files missing.');
    process.exit(1);
  }

  const registry = read(PATHS.registry);

  for (const id of FEATURE_IDS) {
    const keyPattern = new RegExp(`\\b${id}\\s*:\\s*\\{`);
    if (!keyPattern.test(registry)) {
      console.error(`[ai-cost-firewall-check] ERROR: registry missing block for ${id}`);
      errors += 1;
    }
  }

  const hardCapCount = (registry.match(/\bhardCap\s*:/g) ?? []).length;
  const unitCount = (registry.match(/\bunit\s*:/g) ?? []).length;
  const statusCount = (registry.match(/\bstatus\s*:/g) ?? []).length;
  const autoPauseCount = (registry.match(/\bautoPauseOnCap\s*:/g) ?? []).length;
  const prodReadyCount = (registry.match(/\bproductionReady\s*:/g) ?? []).length;

  const n = FEATURE_IDS.length;
  if (hardCapCount < n || unitCount < n || statusCount < n || autoPauseCount < n || prodReadyCount < n) {
    console.error(
      `[ai-cost-firewall-check] ERROR: expected at least ${String(n)} occurrences each of hardCap, unit, status, autoPauseOnCap, productionReady (found hardCap=${String(hardCapCount)} unit=${String(unitCount)} status=${String(statusCount)} autoPause=${String(autoPauseCount)} productionReady=${String(prodReadyCount)}).`
    );
    errors += 1;
  }

  if (errors > 0) {
    console.error('[ai-cost-firewall-check] FAIL: registry malformed.');
    process.exit(1);
  }

  console.log(`[ai-cost-firewall-check] OK: ${String(FEATURE_IDS.length)} features, registry + runbook present.`);
  process.exit(0);
}

main();
