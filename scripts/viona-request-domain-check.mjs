#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'docs/product/VIONA_REQUEST_ENGINE_FOUNDATION.md',
  'src/domain/requests/vionaRequestTypes.ts',
  'src/domain/requests/vionaRequestStatusMachine.ts',
  'src/domain/requests/index.ts',
  'docs/design/evidence/codex-request-engine-foundation-job-b/README.md',
];

const REQUIRED_STATUSES = [
  'draft',
  'submitted',
  'triage',
  'needsHumanConfirmation',
  'sentToPartner',
  'partnerResponded',
  'completed',
  'cancelled',
  'failed',
];

const REQUIRED_TYPES = [
  'VionaRequestUniverse',
  'VionaRequestIntent',
  'VionaRequestStatus',
  'VionaRequestRiskLevel',
  'VionaRequestHumanConfirmationState',
];

const REQUIRED_HELPERS = ['canTransitionRequestStatus', 'explainRequestStatusTransition'];

const REQUIRED_SAFETY_NOTES = [
  'submitted is not paid',
  'partnerResponded is not booking confirmed',
  'completed is not settled',
  'SOS request is guidance/handoff only unless ops ready',
];

const POSITIVE_OVERCLAIMS = [
  'submitted is paid',
  'partnerResponded is booking confirmed',
  'completed is settled',
  'SOS request dispatches',
  'AI executes protected action',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function missingValues(content, values) {
  return values.filter((value) => !content.includes(value));
}

function fail(label, values) {
  console.log(`FAIL ${label}`);
  for (const value of values) console.log(`  - ${value}`);
  process.exitCode = 1;
}

function main() {
  console.log('VIONA request domain check (Job B)');
  console.log('Types/status-machine only. No API, DB, UI, payment, booking, SOS, wallet, or live AI.\n');

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  if (missingFiles.length) {
    fail('missing required files', missingFiles);
    return;
  }

  const types = read('src/domain/requests/vionaRequestTypes.ts');
  const machine = read('src/domain/requests/vionaRequestStatusMachine.ts');
  const index = read('src/domain/requests/index.ts');
  const docs = read('docs/product/VIONA_REQUEST_ENGINE_FOUNDATION.md');
  const combined = `${types}\n${machine}\n${index}\n${docs}`;

  const missingStatuses = missingValues(types, REQUIRED_STATUSES);
  const missingTypes = missingValues(types, REQUIRED_TYPES);
  const missingHelpers = missingValues(machine, REQUIRED_HELPERS);
  const missingSafetyNotes = missingValues(combined, REQUIRED_SAFETY_NOTES);
  const overclaims = POSITIVE_OVERCLAIMS.filter((claim) => combined.includes(claim));

  if (missingStatuses.length) fail('missing statuses', missingStatuses);
  if (missingTypes.length) fail('missing domain types', missingTypes);
  if (missingHelpers.length) fail('missing helpers', missingHelpers);
  if (missingSafetyNotes.length) fail('missing safety notes', missingSafetyNotes);
  if (overclaims.length) fail('unsafe positive overclaims found', overclaims);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix request domain foundation.');
    return;
  }

  console.log(`Statuses: PASS (${REQUIRED_STATUSES.join(', ')})`);
  console.log('Domain types: PASS');
  console.log('Status helpers: PASS');
  console.log('Safety notes: PASS');
  console.log('Unsafe positive overclaims: PASS');
  console.log('\nResult: PASS - request engine foundation is types-only and import-ready.');
}

main();
