#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = [
  'docs/ai-context/VIONA_AUTOMATION_PHASE_GATES.md',
  'src/config/vionaAutomationSafetyGates.ts',
  'scripts/viona-automation-safety-gates-check.mjs',
  'docs/design/evidence/codex-automation-safety-gates-job-c/README.md',
];

const REQUIRED_PHASES = [
  'phaseA_sourceOfTruth',
  'phaseB_readOnlyCopilot',
  'phaseC_humanConfirmedAction',
  'phaseD_limitedAutonomousGated',
];

const REQUIRED_CATEGORIES = ['readOnly', 'draftOnly', 'humanConfirmed', 'opsConfirmed', 'prohibited'];

const REQUIRED_PROHIBITED_ACTIONS = [
  'capturePayment',
  'refund',
  'settle',
  'payout',
  'bookTravelTicketHotel',
  'dispatchSosRescuePoliceAmbulance',
  'sendLegalMedicalAuthorityReport',
  'performIrreversibleAutonomousAction',
];

const REQUIRED_HELPERS = [
  'getAutomationPhaseGate',
  'isAutomationActionAllowed',
  'requiresHumanConfirmation',
];

const REQUIRED_DOC_LINES = [
  'AI can classify/draft/suggest',
  'AI cannot autonomously pay/book/dispatch/refund/settle/payout',
  'human confirmation and audit logs are required before future actions',
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
  console.log('VIONA automation safety gates check (Job C)');
  console.log('Docs/config only. No live AI service, UI, payment, booking, SOS, wallet, or DB integration.\n');

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  if (missingFiles.length) {
    fail('missing required files', missingFiles);
    return;
  }

  const config = read('src/config/vionaAutomationSafetyGates.ts');
  const docs = read('docs/ai-context/VIONA_AUTOMATION_PHASE_GATES.md');
  const evidence = read('docs/design/evidence/codex-automation-safety-gates-job-c/README.md');
  const combined = `${config}\n${docs}\n${evidence}`;

  const missingPhases = missingValues(config, REQUIRED_PHASES);
  const missingCategories = missingValues(config, REQUIRED_CATEGORIES);
  const missingActions = REQUIRED_PROHIBITED_ACTIONS.filter(
    (action) => !config.includes(action) || !docs.includes(action)
  );
  const missingHelpers = missingValues(config, REQUIRED_HELPERS);
  const missingDocLines = missingValues(docs, REQUIRED_DOC_LINES);
  const unguardedProhibited = REQUIRED_PROHIBITED_ACTIONS.filter((action) => {
    const actionIndex = config.indexOf(`${action}:`);
    if (actionIndex < 0) return true;
    const block = config.slice(actionIndex, actionIndex + 520);
    return !block.includes("category: 'prohibited'") || !block.includes('minimumPhase: null');
  });

  if (missingPhases.length) fail('missing phases', missingPhases);
  if (missingCategories.length) fail('missing categories', missingCategories);
  if (missingActions.length) fail('missing prohibited actions in config/docs', missingActions);
  if (missingHelpers.length) fail('missing helpers', missingHelpers);
  if (missingDocLines.length) fail('missing required doc statements', missingDocLines);
  if (unguardedProhibited.length) fail('prohibited actions without prohibited/null gate', unguardedProhibited);
  if (!combined.includes('requiresAuditLog')) fail('audit log requirement missing', ['requiresAuditLog']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix automation safety gates.');
    return;
  }

  console.log(`Phases: PASS (${REQUIRED_PHASES.join(', ')})`);
  console.log(`Categories: PASS (${REQUIRED_CATEGORIES.join(', ')})`);
  console.log(`Prohibited actions: PASS (${REQUIRED_PROHIBITED_ACTIONS.join(', ')})`);
  console.log('Helpers: PASS');
  console.log('Docs: PASS');
  console.log('Audit log requirement: PASS');
  console.log('\nResult: PASS - automation safety gates foundation is import-ready.');
}

main();
