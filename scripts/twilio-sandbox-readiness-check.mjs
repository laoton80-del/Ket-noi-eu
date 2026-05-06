/**
 * Twilio sandbox pilot documentation + registry checks.
 * - Does not call Twilio APIs or read `.env` secrets.
 * - Exit 1 if required files missing or registry guards incomplete.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const READINESS_IDS = [
  'aiReceptionistTwilioSandbox',
  'b2cAiCallAssistantSandbox',
  'liveInterpreterVoiceBridge',
];

const PATHS = {
  types: 'src/core/telephony/telephonyPilotTypes.ts',
  registry: 'src/core/telephony/telephonyPilotRegistry.ts',
  index: 'src/core/telephony/index.ts',
  runbook: 'docs/ops/VIONA_TWILIO_SANDBOX_PILOT_RUNBOOK.md',
};

const ENV_KEYS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'TWILIO_VOICE_FROM_NUMBER',
  'TWILIO_SANDBOX_ENABLED',
  'VIONA_TWILIO_PRODUCTION_CALLS_ENABLED',
  'VIONA_CALL_RECORDING_ENABLED',
  'VIONA_CALL_CONSENT_REQUIRED',
];

function read(rel) {
  return readFileSync(path.join(root, ...rel.split('/')), 'utf8');
}

function extractBlock(src, id) {
  const start = src.indexOf(`${id}:`);
  if (start === -1) return null;
  const brace = src.indexOf('{', start);
  if (brace === -1) return null;
  let depth = 0;
  for (let i = brace; i < src.length; i += 1) {
    const c = src[i];
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        return src.slice(brace, i + 1);
      }
    }
  }
  return null;
}

function main() {
  let errors = 0;

  for (const [label, rel] of Object.entries(PATHS)) {
    const full = path.join(root, ...rel.split('/'));
    if (!existsSync(full)) {
      console.error(`[twilio-sandbox-readiness] ERROR: missing ${label}: ${rel}`);
      errors += 1;
    }
  }

  const examplePath = path.join(root, '.env.example');
  if (!existsSync(examplePath)) {
    console.error('[twilio-sandbox-readiness] ERROR: .env.example missing');
    errors += 1;
  } else {
    const ex = readFileSync(examplePath, 'utf8');
    for (const key of ENV_KEYS) {
      if (!ex.includes(key)) {
        console.error(`[twilio-sandbox-readiness] ERROR: .env.example missing key name ${key}`);
        errors += 1;
      }
    }
  }

  if (errors > 0) {
    console.error('[twilio-sandbox-readiness] FAIL: required files or env key documentation missing.');
    process.exit(1);
  }

  const registry = read(PATHS.registry);

  for (const id of READINESS_IDS) {
    const block = extractBlock(registry, id);
    if (!block) {
      console.error(`[twilio-sandbox-readiness] ERROR: registry block missing for ${id}`);
      errors += 1;
      continue;
    }
    const checks = [
      ['requiresConsent:', block.includes('requiresConsent:')],
      ['requiresCostGuard:', block.includes('requiresCostGuard:')],
      ['productionReady:', block.includes('productionReady:')],
      ["blockedModes includes 'productionOutbound'", block.includes("'productionOutbound'")],
    ];
    for (const [label, ok] of checks) {
      if (!ok) {
        console.error(`[twilio-sandbox-readiness] ERROR: ${id} missing ${label}`);
        errors += 1;
      }
    }
    if (block.includes('productionReady: true')) {
      if (!block.includes("'productionOutbound'") || !block.includes('blockedModes')) {
        console.error(`[twilio-sandbox-readiness] ERROR: ${id} productionReady true must still document blockedModes review`);
        errors += 1;
      }
    } else {
      if (!block.includes('productionReady: false')) {
        console.error(`[twilio-sandbox-readiness] ERROR: ${id} must set productionReady: false until gated release`);
        errors += 1;
      }
    }
  }

  const b2c = extractBlock(registry, 'b2cAiCallAssistantSandbox');
  if (b2c && !b2c.includes("'sandboxOutbound'")) {
    console.error('[twilio-sandbox-readiness] ERROR: b2cAiCallAssistantSandbox should block sandboxOutbound until approved');
    errors += 1;
  }

  if (errors > 0) {
    console.error('[twilio-sandbox-readiness] FAIL: registry guard validation.');
    process.exit(1);
  }

  console.log(
    `[twilio-sandbox-readiness] OK: ${String(READINESS_IDS.length)} pilot lanes, runbook, telephony sources, .env.example key names.`
  );
  process.exit(0);
}

main();
