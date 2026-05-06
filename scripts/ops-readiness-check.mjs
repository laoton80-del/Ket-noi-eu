/**
 * Commercial pilot ops readiness — local documentation and template checks only.
 * - Does not read `.env`, `.env.local`, or any secret values.
 * - Always exits 0 so CI / release gates are not blocked by incomplete ops wiring.
 *
 * Run: npm run ops:readiness
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const DOC_FILES = [
  'docs/ops/VIONA_COMMERCIAL_PILOT_OPS_RUNBOOK.md',
  'docs/ops/VIONA_COMMERCIAL_PILOT_CHECKLIST.md',
  'docs/ai-context/AI_RECEPTIONIST_MANUAL_OPS_RUNBOOK.md',
];

/** Key names that should appear in `.env.example` for operator discoverability (values not validated). */
const ENV_EXAMPLE_KEY_NAMES = ['VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL', 'AWS_SES_SENDER_EMAIL'];

function main() {
  let notices = 0;

  for (const rel of DOC_FILES) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.warn(`[ops-readiness-check] NOTICE: missing file ${rel}`);
      notices += 1;
    }
  }

  const examplePath = path.join(root, '.env.example');
  if (!existsSync(examplePath)) {
    console.warn('[ops-readiness-check] NOTICE: .env.example missing');
    notices += 1;
  } else {
    const text = readFileSync(examplePath, 'utf8');
    for (const key of ENV_EXAMPLE_KEY_NAMES) {
      if (!text.includes(key)) {
        console.warn(`[ops-readiness-check] NOTICE: .env.example does not mention ${key}`);
        notices += 1;
      }
    }
  }

  if (notices === 0) {
    console.log('[ops-readiness-check] OK: commercial pilot ops doc anchors and .env.example key names present.');
  } else {
    console.log(
      `[ops-readiness-check] PASS with ${String(notices)} notice(s) — resolve to tighten ops discoverability (non-blocking).`
    );
  }
  process.exit(0);
}

main();
