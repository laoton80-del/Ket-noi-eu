/**
 * Pack W — AI auto-pause dry-run foundation readiness.
 * Does not read secrets or call APIs.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FILES = {
  types: 'src/core/aiEnforcement/aiAutoPauseTypes.ts',
  policy: 'src/core/aiEnforcement/aiAutoPausePolicy.ts',
  evaluate: 'src/core/aiEnforcement/evaluateAiAutoPauseDecision.ts',
  runbook: 'docs/ops/VIONA_AI_AUTO_PAUSE_DRY_RUN_RUNBOOK.md',
};

const MARKER_GROUPS = [
  { file: FILES.policy, needles: ['dryRun', 'allowProductionEnforcement'] },
  { file: FILES.evaluate, needles: ['productionEnforced', 'requireHumanApproval'] },
  { file: FILES.types, needles: ['dryRun', 'AiAutoPauseDecision'] },
];

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

function main() {
  let errors = 0;

  for (const [label, rel] of Object.entries(FILES)) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[ai-auto-pause-readiness-check] ERROR: missing ${label}: ${rel}`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[ai-auto-pause-readiness-check] FAIL: required files missing.');
    process.exit(1);
  }

  for (const { file, needles } of MARKER_GROUPS) {
    const text = read(file);
    for (const n of needles) {
      if (!text.includes(n)) {
        console.error(`[ai-auto-pause-readiness-check] ERROR: ${file} missing marker "${n}"`);
        errors += 1;
      }
    }
  }

  const evalText = read(FILES.evaluate);
  if (evalText.includes('fetch(') || evalText.includes('axios.')) {
    console.error('[ai-auto-pause-readiness-check] ERROR: disallowed HTTP markers in evaluator.');
    errors += 1;
  }
  if (evalText.includes('process.env')) {
    console.error('[ai-auto-pause-readiness-check] ERROR: disallowed process.env in evaluator.');
    errors += 1;
  }

  if (errors > 0) {
    console.error('[ai-auto-pause-readiness-check] FAIL: marker or safety checks failed.');
    process.exit(1);
  }

  console.log('[ai-auto-pause-readiness-check] OK: aiEnforcement dry-run module + runbook present.');
  process.exit(0);
}

main();
