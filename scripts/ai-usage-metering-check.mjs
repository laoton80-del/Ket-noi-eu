/**
 * Pack U — AI usage metering foundation readiness.
 * Does not read secrets, call providers, or import TypeScript.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const REQUIRED = {
  types: 'src/core/aiUsage/aiUsageTypes.ts',
  meter: 'src/core/aiUsage/aiUsageMeter.ts',
  fixtures: 'src/core/aiUsage/aiUsageFixtures.ts',
  runbook: 'docs/ops/VIONA_AI_USAGE_METERING_RUNBOOK.md',
};

const MARKERS = [
  { file: REQUIRED.types, needles: ['AiUsageEvent', 'AiUsageMeterResult', 'estimatedMarginMinor'] },
  {
    file: REQUIRED.meter,
    needles: ['evaluateAiUsageAgainstGuard', 'blocked', 'autoPause', 'estimatedMarginMinor'],
  },
];

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

function main() {
  let errors = 0;

  for (const [label, rel] of Object.entries(REQUIRED)) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[ai-usage-metering-check] ERROR: missing ${label}: ${rel}`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[ai-usage-metering-check] FAIL: required files missing.');
    process.exit(1);
  }

  for (const { file, needles } of MARKERS) {
    const text = read(file);
    for (const n of needles) {
      if (!text.includes(n)) {
        console.error(`[ai-usage-metering-check] ERROR: ${file} missing marker "${n}"`);
        errors += 1;
      }
    }
  }

  const blockedApis = ['fetch(', 'axios.', 'api.openai.com', 'api.twilio.com'];
  const meterText = read(REQUIRED.meter);
  for (const token of blockedApis) {
    if (meterText.includes(token)) {
      console.error(`[ai-usage-metering-check] ERROR: disallowed external API marker "${token}" in ${REQUIRED.meter}`);
      errors += 1;
    }
  }

  const secretHints = ['process.env', 'TWILIO_AUTH', 'OPENAI_API_KEY', 'API_KEY'];
  for (const h of secretHints) {
    if (meterText.includes(h) || read(REQUIRED.fixtures).includes(h)) {
      console.error(`[ai-usage-metering-check] ERROR: disallowed secret/env hint "${h}" in metering sources`);
      errors += 1;
    }
  }

  if (errors > 0) {
    console.error('[ai-usage-metering-check] FAIL: markers or safety checks failed.');
    process.exit(1);
  }

  console.log('[ai-usage-metering-check] OK: metering types, pure meter, fixtures, runbook present.');
  process.exit(0);
}

main();
