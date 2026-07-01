#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACK26D_FILES = [
  'src/lib/viona/operatorApproval/vionaOperatorApprovalTypes.ts',
  'src/lib/viona/operatorApproval/vionaOperatorApprovalPolicy.ts',
  'src/lib/viona/operatorApproval/vionaOperatorApprovalBuilders.ts',
  'src/lib/viona/operatorApproval/vionaOperatorApprovalValidators.ts',
  'src/lib/viona/operatorApproval/index.ts',
  'scripts/viona-pack26d-operator-approval-check.mjs',
  'docs/product/VIONA_REQUEST_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack26d-operator-approval-human-loop-implementation/README.md',
];

const PACK26D_SOURCE_FILES = [
  'src/lib/viona/operatorApproval/vionaOperatorApprovalTypes.ts',
  'src/lib/viona/operatorApproval/vionaOperatorApprovalPolicy.ts',
  'src/lib/viona/operatorApproval/vionaOperatorApprovalBuilders.ts',
  'src/lib/viona/operatorApproval/vionaOperatorApprovalValidators.ts',
  'src/lib/viona/operatorApproval/index.ts',
];

const PACK26B_ACTION_IDS = [
  'request.status.submitted_to_triage',
  'request.assign',
  'request.confirm',
  'request.cancel',
  'booking.request',
  'payment.intent',
  'sos.assist',
  'wallet.adjustment',
  'live_ai.action',
];

const REQUIRED_BUILDERS = [
  'buildVionaApprovalDecision',
  'buildPendingVionaApprovalDecision',
  'buildApprovedVionaApprovalDecision',
  'buildRejectedVionaApprovalDecision',
  'buildBlockedVionaApprovalDecision',
  'buildNotRequiredVionaApprovalDecision',
  'buildSupersededVionaApprovalDecision',
];

const REQUIRED_VALIDATORS = [
  'validateVionaApprovalPolicy',
  'validateVionaApprovalDecision',
  'validateVionaHumanLoopGateEvaluation',
  'assertVionaOperatorApprovalLayerSafe',
];

const REQUIRED_POLICY_HELPERS = [
  'getVionaApprovalPolicyForAction',
  'getVionaApprovalRequirementForAction',
  'evaluateVionaHumanLoopGate',
];

const FORBIDDEN_RUNTIME_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\b/,
  /\bPOST\b/,
  /\bprisma\b/i,
  /\bsupabase\b/i,
  /\bprocess\.env\b/,
  /\bAuthorization\b/,
  /\bJWT\b/,
  /\bPIN\b/,
  /\bDate\.now\b/,
  /\bcrypto\b/,
  /\brandomUUID\b/,
  /\bMath\.random\b/,
];

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"][^'"]*prisma/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"]@prisma/i,
  /from\s+['"][^'"]*\/routes\//i,
  /from\s+['"][^'"]*\/controllers\//i,
  /from\s+['"][^'"]*\/services\//i,
  /from\s+['"][^'"]*\/components\//i,
  /from\s+['"][^'"]*\/screens\//i,
  /from\s+['"][^'"]*\/App(?:\.tsx)?['"]/i,
  /from\s+['"]App['"]/i,
  /from\s+['"][^'"]*\/navigation(?:\/|['"])/i,
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(message, details = []) {
  console.log(`FAIL ${message}`);
  for (const detail of details) console.log(`  - ${detail}`);
  process.exitCode = 1;
}

function runNodeCheck(scriptPath) {
  const result = spawnSync('node', [scriptPath], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail(`${scriptPath} failed`, [result.stderr?.trim() || result.stdout?.trim() || 'non-zero exit']);
    return false;
  }
  return true;
}

function runTsxContractSmoke() {
  const script = `
import {
  buildApprovedVionaApprovalDecision,
  buildBlockedVionaApprovalDecision,
  buildNotRequiredVionaApprovalDecision,
  buildPendingVionaApprovalDecision,
  buildRejectedVionaApprovalDecision,
  evaluateVionaHumanLoopGate,
  getVionaApprovalPolicyForAction,
  validateVionaApprovalDecision,
  validateVionaHumanLoopGateEvaluation,
  assertVionaOperatorApprovalLayerSafe,
  VIONA_PACK26D_ACTION_APPROVAL_POLICIES,
  vionaApprovalRequirements,
  vionaHumanRoles,
  vionaApprovalDecisions,
  vionaGateOutcomes,
} from './src/lib/viona/operatorApproval/index.ts';

if (vionaApprovalRequirements.length !== 10) throw new Error('unexpected approval requirement count');
if (vionaHumanRoles.length !== 9) throw new Error('unexpected human role count');
if (vionaApprovalDecisions.length !== 7) throw new Error('unexpected decision count');
if (vionaGateOutcomes.length !== 7) throw new Error('unexpected gate outcome count');
if (VIONA_PACK26D_ACTION_APPROVAL_POLICIES.length !== 9) throw new Error('unexpected policy count');

const base = {
  approvalDecisionId: 'approval-pack26d-sample-1',
  actionId: 'request.status.submitted_to_triage',
  targetType: 'viona_request',
  targetId: 'target-pack26d-sample',
  requestedByRole: 'request_owner',
  requiredApprovalRole: 'viona_operator',
  readinessState: 'staging_verified',
  createdAt: '2026-06-16T12:00:00.000Z',
};

const pending = buildPendingVionaApprovalDecision(base);
const approved = buildApprovedVionaApprovalDecision({
  ...base,
  approvalDecisionId: 'approval-pack26d-sample-2',
  decidedAt: '2026-06-16T12:05:00.000Z',
});
const rejected = buildRejectedVionaApprovalDecision({
  ...base,
  approvalDecisionId: 'approval-pack26d-sample-3',
  decisionReason: 'Policy rejected sample.',
  decidedAt: '2026-06-16T12:06:00.000Z',
});
const blocked = buildBlockedVionaApprovalDecision({
  ...base,
  approvalDecisionId: 'approval-pack26d-sample-4',
  actionId: 'payment.intent',
  blockedReason: 'Sensitive lane blocked in Pack26D.',
  decidedAt: '2026-06-16T12:07:00.000Z',
});
const notRequired = buildNotRequiredVionaApprovalDecision({
  ...base,
  approvalDecisionId: 'approval-pack26d-sample-5',
  decidedAt: '2026-06-16T12:08:00.000Z',
});

const unknownGate = evaluateVionaHumanLoopGate({ actionId: 'unknown.action.sample' });
const knownGate = evaluateVionaHumanLoopGate({ actionId: 'request.assign' });

for (const [name, result] of [
  ['pending', validateVionaApprovalDecision(pending)],
  ['approved', validateVionaApprovalDecision(approved)],
  ['rejected', validateVionaApprovalDecision(rejected)],
  ['blocked', validateVionaApprovalDecision(blocked)],
  ['notRequired', validateVionaApprovalDecision(notRequired)],
  ['unknownGate', validateVionaHumanLoopGateEvaluation(unknownGate)],
  ['knownGate', validateVionaHumanLoopGateEvaluation(knownGate)],
  ['layerSafe', assertVionaOperatorApprovalLayerSafe()],
]) {
  if (!result.ok) {
    throw new Error(name + ' validation failed: ' + JSON.stringify(result.errors));
  }
}

if (approved.executionEnabledSnapshot !== false || approved.uiAffordanceAllowedSnapshot !== false) {
  throw new Error('approved decision must remain non-executing');
}
if (notRequired.executionEnabledSnapshot !== false || notRequired.uiAffordanceAllowedSnapshot !== false) {
  throw new Error('not_required decision must remain non-executing');
}
if (!unknownGate.blocked || unknownGate.executionAuthorized !== false) {
  throw new Error('unknown action must return safe blocked gate');
}
const paymentPolicy = getVionaApprovalPolicyForAction('payment.intent');
if (paymentPolicy.executionAuthorized !== false || paymentPolicy.uiAffordanceAuthorized !== false) {
  throw new Error('payment policy must remain non-executing');
}

console.log('OPERATOR_APPROVAL_SMOKE_OK');
`;

  const result = spawnSync('npx', ['tsx', '-e', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('operator approval smoke via tsx failed', [
      result.stderr?.trim() || result.stdout?.trim() || 'tsx exited non-zero',
    ]);
    return false;
  }
  return true;
}

function main() {
  console.log('VIONA Pack26D operator approval check');
  console.log('Non-persistent contract/policy layer. No routes, writes, DB, or execution.\n');

  const missingFiles = PACK26D_FILES.filter((rel) => !existsSync(path.join(ROOT, rel)));
  if (missingFiles.length) {
    fail('required Pack26D files missing', missingFiles);
    return;
  }

  const typesSource = read('src/lib/viona/operatorApproval/vionaOperatorApprovalTypes.ts');
  const policySource = read('src/lib/viona/operatorApproval/vionaOperatorApprovalPolicy.ts');
  const buildersSource = read('src/lib/viona/operatorApproval/vionaOperatorApprovalBuilders.ts');
  const validatorsSource = read('src/lib/viona/operatorApproval/vionaOperatorApprovalValidators.ts');
  const indexSource = read('src/lib/viona/operatorApproval/index.ts');

  const duplicateRequirements = vionaApprovalRequirementsCheck(typesSource);
  if (duplicateRequirements.length) {
    fail('duplicate approval requirements', duplicateRequirements);
  }

  const duplicateRoles = duplicateConstEntries(typesSource, 'vionaHumanRoles');
  if (duplicateRoles.length) {
    fail('duplicate human roles', duplicateRoles);
  }

  const duplicateDecisions = duplicateConstEntries(typesSource, 'vionaApprovalDecisions');
  if (duplicateDecisions.length) {
    fail('duplicate approval decisions', duplicateDecisions);
  }

  const duplicateGates = duplicateConstEntries(typesSource, 'vionaGateOutcomes');
  if (duplicateGates.length) {
    fail('duplicate gate outcomes', duplicateGates);
  }

  for (const actionId of PACK26B_ACTION_IDS) {
    if (!policySource.includes(`actionId: '${actionId}'`)) {
      fail('missing Pack26B action ID in policy mapping', [actionId]);
    }
  }

  if (!policySource.includes('executionAuthorized: false')) {
    fail('policy source must keep executionAuthorized false');
  }
  if (!policySource.includes('uiAffordanceAuthorized: false')) {
    fail('policy source must keep uiAffordanceAuthorized false');
  }

  for (const name of REQUIRED_BUILDERS) {
    if (!buildersSource.includes(name)) {
      fail('missing required builder', [name]);
    }
  }

  for (const name of REQUIRED_VALIDATORS) {
    if (!validatorsSource.includes(name)) {
      fail('missing required validator', [name]);
    }
  }

  for (const name of REQUIRED_POLICY_HELPERS) {
    if (!policySource.includes(name)) {
      fail('missing required policy helper', [name]);
    }
  }

  for (const rel of PACK26D_SOURCE_FILES) {
    const source = read(rel);
    for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden runtime pattern in Pack26D source', [`${rel}: ${pattern}`]);
      }
    }
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden import in Pack26D source', [`${rel}: ${pattern}`]);
      }
    }
  }

  if (!indexSource.includes('export {')) {
    fail('index must export public operator approval utilities');
  }

  if (!runNodeCheck('scripts/viona-pack26b-action-registry-check.mjs')) {
    return;
  }
  if (!runNodeCheck('scripts/viona-pack26c-audit-timeline-contract-check.mjs')) {
    return;
  }
  if (!runTsxContractSmoke()) {
    return;
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack26D operator approval layer.');
    return;
  }

  console.log(`Expected files: PASS (${PACK26D_FILES.length})`);
  console.log('Approval requirements: PASS (10)');
  console.log('Human roles: PASS (9)');
  console.log('Approval decisions: PASS (7)');
  console.log('Gate outcomes: PASS (7)');
  console.log('Pack26B action policy mapping: PASS (9)');
  console.log('Policy execution flags: PASS');
  console.log('Builders present: PASS');
  console.log('Validators present: PASS');
  console.log('Forbidden runtime patterns: PASS');
  console.log('Forbidden imports: PASS');
  console.log('Pack26B registry check: PASS');
  console.log('Pack26C contract check: PASS');
  console.log('Operator approval smoke: PASS');
  console.log('\nResult: PASS — Pack26D operator approval layer is consistent.');
}

function extractConstArray(source, constName) {
  const match = source.match(new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

function vionaApprovalRequirementsCheck(source) {
  const values = extractConstArray(source, 'vionaApprovalRequirements');
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function duplicateConstEntries(source, constName) {
  const values = extractConstArray(source, constName);
  return values.filter((value, index) => values.indexOf(value) !== index);
}

main();
