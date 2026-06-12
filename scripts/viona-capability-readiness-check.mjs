#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'docs/product/VIONA_CAPABILITY_MATRIX.md',
  'src/config/vionaCapabilityReadiness.ts',
  'docs/design/evidence/codex-capability-readiness-job-a/README.md',
];

const REQUIRED_UNIVERSES = ['home', 'local', 'travel', 'academy', 'business', 'account', 'sos'];
const REQUIRED_STATUSES = ['active', 'requestOnly', 'preview', 'disabled'];
const REQUIRED_FLAGS = [
  'requiresHumanConfirmation',
  'requiresOpsReadiness',
  'requiresPaymentReadiness',
  'requiresLegalReadiness',
  'requiresMarketReadiness',
  'prohibitsAutonomousAction',
];

const UNSAFE_EXACT_PHRASES = [
  'payment guaranteed',
  'refund processed',
  'money released',
  'emergency response sent',
  'gps live tracking',
  'live location shared',
  'authority notified',
  'emergency recording started',
  'ai will call automatically',
  'ai confirms booking',
  'ai cancels booking',
  'ai pays',
  'ai settles',
  'no human confirmation needed',
  'official certificate',
  'legally guaranteed',
  'medical diagnosis',
  'legal protection guaranteed',
  'government approved',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(message, details = []) {
  console.log(`FAIL ${message}`);
  for (const detail of details) console.log(`  - ${detail}`);
  process.exitCode = 1;
}

function includesAll(content, values) {
  return values.filter((value) => !content.includes(value));
}

function main() {
  console.log('VIONA capability readiness check (Job A)');
  console.log('Docs/config only. No runtime integration.\n');

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  if (missingFiles.length) {
    fail('required files missing', missingFiles);
    return;
  }

  const config = read('src/config/vionaCapabilityReadiness.ts');
  const matrix = read('docs/product/VIONA_CAPABILITY_MATRIX.md');
  const evidence = read('docs/design/evidence/codex-capability-readiness-job-a/README.md');
  const combined = `${config}\n${matrix}\n${evidence}`;

  const missingUniverses = includesAll(config, REQUIRED_UNIVERSES.map((universe) => `${universe}:`));
  const missingStatuses = includesAll(config, REQUIRED_STATUSES);
  const missingFlags = includesAll(config, REQUIRED_FLAGS);
  const missingDocSections = includesAll(matrix, [
    'Capability status types',
    'Safety flags',
    'Universe readiness matrix',
    'How future features must use this map',
  ]);
  const unsafeHits = UNSAFE_EXACT_PHRASES.filter((phrase) => combined.toLowerCase().includes(phrase));

  if (missingUniverses.length) fail('missing universe keys in config', missingUniverses);
  if (missingStatuses.length) fail('missing capability statuses in config', missingStatuses);
  if (missingFlags.length) fail('missing safety flags in config', missingFlags);
  if (missingDocSections.length) fail('missing required doc sections', missingDocSections);
  if (unsafeHits.length) fail('unsafe exact wording found', unsafeHits);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix readiness map before import.');
    return;
  }

  console.log('Required files: PASS');
  console.log(`Universes: PASS (${REQUIRED_UNIVERSES.join(', ')})`);
  console.log(`Statuses: PASS (${REQUIRED_STATUSES.join(', ')})`);
  console.log(`Safety flags: PASS (${REQUIRED_FLAGS.join(', ')})`);
  console.log('Doc sections: PASS');
  console.log('Unsafe exact wording: PASS');
  console.log('\nResult: PASS - capability readiness foundation is import-ready.');
}

main();
