#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACK27_FILES = [
  'src/lib/viona/executionLane/vionaExecutionLaneTypes.ts',
  'src/lib/viona/executionLane/vionaExecutionLanePolicy.ts',
  'src/lib/viona/executionLane/vionaExecutionLaneBuilders.ts',
  'src/lib/viona/executionLane/vionaExecutionLaneValidators.ts',
  'src/lib/viona/executionLane/index.ts',
  'scripts/viona-pack27-execution-lane-check.mjs',
  'docs/product/VIONA_REQUEST_PACK27_EXECUTION_LANE_PLANNING_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack27-execution-lane-planning-implementation/README.md',
];

const PACK27_SOURCE_FILES = [
  'src/lib/viona/executionLane/vionaExecutionLaneTypes.ts',
  'src/lib/viona/executionLane/vionaExecutionLanePolicy.ts',
  'src/lib/viona/executionLane/vionaExecutionLaneBuilders.ts',
  'src/lib/viona/executionLane/vionaExecutionLaneValidators.ts',
  'src/lib/viona/executionLane/index.ts',
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
  'buildVionaExecutionAttemptEnvelope',
  'buildPreviewOnlyVionaExecutionAttempt',
  'buildDryRunOnlyVionaExecutionAttempt',
  'buildBlockedVionaExecutionAttempt',
  'buildHumanApprovalRequiredVionaExecutionAttempt',
  'buildOperatorReviewRequiredVionaExecutionAttempt',
  'buildNotImplementedVionaExecutionAttempt',
];

const REQUIRED_VALIDATORS = [
  'validateVionaExecutionReadinessPolicy',
  'validateVionaExecutionAttemptEnvelope',
  'validateVionaExecutionReadinessGateEvaluation',
  'assertVionaExecutionLanePlanningLayerSafe',
];

const REQUIRED_POLICY_HELPERS = [
  'getVionaExecutionReadinessPolicyForAction',
  'getVionaExecutionLaneTypeForAction',
  'evaluateVionaExecutionReadinessGate',
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
  buildBlockedVionaExecutionAttempt,
  buildDryRunOnlyVionaExecutionAttempt,
  buildHumanApprovalRequiredVionaExecutionAttempt,
  buildNotImplementedVionaExecutionAttempt,
  buildOperatorReviewRequiredVionaExecutionAttempt,
  buildPreviewOnlyVionaExecutionAttempt,
  evaluateVionaExecutionReadinessGate,
  getVionaExecutionReadinessPolicyForAction,
  validateVionaExecutionAttemptEnvelope,
  validateVionaExecutionReadinessGateEvaluation,
  assertVionaExecutionLanePlanningLayerSafe,
  VIONA_PACK27_ACTION_READINESS_POLICIES,
  vionaExecutionLaneTypes,
  vionaExecutionReadinessStages,
} from './src/lib/viona/executionLane/index.ts';

if (vionaExecutionReadinessStages.length !== 9) throw new Error('unexpected readiness stage count');
if (vionaExecutionLaneTypes.length !== 8) throw new Error('unexpected execution lane type count');
if (VIONA_PACK27_ACTION_READINESS_POLICIES.length !== 9) throw new Error('unexpected policy count');

const base = {
  executionAttemptId: 'attempt-pack27-sample-1',
  actionId: 'request.assign',
  targetType: 'viona_request',
  targetId: 'target-pack27-sample',
  requestedByRole: 'request_owner',
  createdAt: '2026-06-16T12:00:00.000Z',
};

const preview = buildPreviewOnlyVionaExecutionAttempt({
  ...base,
  executionAttemptId: 'attempt-pack27-preview',
  actionId: 'request.status.submitted_to_triage',
});
const dryRun = buildDryRunOnlyVionaExecutionAttempt({
  ...base,
  executionAttemptId: 'attempt-pack27-dryrun',
});
const blocked = buildBlockedVionaExecutionAttempt({
  ...base,
  executionAttemptId: 'attempt-pack27-blocked',
  actionId: 'payment.intent',
  blockedReason: 'Sensitive lane blocked in Pack27.',
});
const humanApproval = buildHumanApprovalRequiredVionaExecutionAttempt({
  ...base,
  executionAttemptId: 'attempt-pack27-human',
  actionId: 'booking.request',
});
const operatorReview = buildOperatorReviewRequiredVionaExecutionAttempt({
  ...base,
  executionAttemptId: 'attempt-pack27-operator',
});
const notImplemented = buildNotImplementedVionaExecutionAttempt({
  ...base,
  executionAttemptId: 'attempt-pack27-not-implemented',
  actionId: 'unknown.action.sample',
});

const unknownGate = evaluateVionaExecutionReadinessGate({ actionId: 'unknown.action.sample' });
const knownGate = evaluateVionaExecutionReadinessGate({ actionId: 'request.assign' });

for (const [name, result] of [
  ['preview', validateVionaExecutionAttemptEnvelope(preview)],
  ['dryRun', validateVionaExecutionAttemptEnvelope(dryRun)],
  ['blocked', validateVionaExecutionAttemptEnvelope(blocked)],
  ['humanApproval', validateVionaExecutionAttemptEnvelope(humanApproval)],
  ['operatorReview', validateVionaExecutionAttemptEnvelope(operatorReview)],
  ['notImplemented', validateVionaExecutionAttemptEnvelope(notImplemented)],
  ['unknownGate', validateVionaExecutionReadinessGateEvaluation(unknownGate)],
  ['knownGate', validateVionaExecutionReadinessGateEvaluation(knownGate)],
  ['layerSafe', assertVionaExecutionLanePlanningLayerSafe()],
]) {
  if (!result.ok) {
    throw new Error(name + ' validation failed: ' + JSON.stringify(result.errors));
  }
}

if (preview.executionAuthorized !== false || preview.previewOnly !== true) {
  throw new Error('preview attempt must remain non-executing');
}
if (dryRun.executionAuthorized !== false || dryRun.dryRunOnly !== true) {
  throw new Error('dry-run attempt must remain non-executing');
}
if (!unknownGate.blocked || unknownGate.executionAuthorized !== false) {
  throw new Error('unknown action must return safe blocked gate');
}
const paymentPolicy = getVionaExecutionReadinessPolicyForAction('payment.intent');
if (paymentPolicy.executionAuthorized !== false || paymentPolicy.uiAffordanceAuthorized !== false) {
  throw new Error('payment policy must remain non-executing');
}
if (paymentPolicy.dbWriteAuthorized !== false || paymentPolicy.statusPostAuthorized !== false) {
  throw new Error('payment policy must remain non-writing/non-status-post');
}

console.log('EXECUTION_LANE_SMOKE_OK');
`;

  const result = spawnSync('npx', ['tsx', '-e', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('execution lane smoke via tsx failed', [
      result.stderr?.trim() || result.stdout?.trim() || 'tsx exited non-zero',
    ]);
    return false;
  }
  return true;
}

function extractConstArray(source, constName) {
  const match = source.match(new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

function duplicateConstEntries(source, constName) {
  const values = extractConstArray(source, constName);
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function main() {
  console.log('VIONA Pack27 execution lane check');
  console.log('Non-persistent contract/policy layer. No routes, writes, DB, or execution.\n');

  const missingFiles = PACK27_FILES.filter((rel) => !existsSync(path.join(ROOT, rel)));
  if (missingFiles.length) {
    fail('required Pack27 files missing', missingFiles);
    return;
  }

  const typesSource = read('src/lib/viona/executionLane/vionaExecutionLaneTypes.ts');
  const policySource = read('src/lib/viona/executionLane/vionaExecutionLanePolicy.ts');
  const buildersSource = read('src/lib/viona/executionLane/vionaExecutionLaneBuilders.ts');
  const validatorsSource = read('src/lib/viona/executionLane/vionaExecutionLaneValidators.ts');
  const indexSource = read('src/lib/viona/executionLane/index.ts');

  const duplicateStages = duplicateConstEntries(typesSource, 'vionaExecutionReadinessStages');
  if (duplicateStages.length) {
    fail('duplicate execution readiness stages', duplicateStages);
  }

  const duplicateLaneTypes = duplicateConstEntries(typesSource, 'vionaExecutionLaneTypes');
  if (duplicateLaneTypes.length) {
    fail('duplicate execution lane types', duplicateLaneTypes);
  }

  for (const actionId of PACK26B_ACTION_IDS) {
    if (!policySource.includes(`actionId: '${actionId}'`)) {
      fail('missing Pack26B action ID in readiness mapping', [actionId]);
    }
  }

  for (const flag of [
    'executionAuthorized: false',
    'uiAffordanceAuthorized: false',
    'dbWriteAuthorized: false',
    'statusPostAuthorized: false',
    'liveQaAuthorized: false',
  ]) {
    if (!policySource.includes(flag)) {
      fail(`policy source must keep ${flag}`);
    }
  }

  if (policySource.includes("readinessStage: 'execution_authorized_future'")) {
    fail('policy source must not use active execution_authorized_future stage');
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

  for (const rel of PACK27_SOURCE_FILES) {
    const source = read(rel);
    for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden runtime pattern in Pack27 source', [`${rel}: ${pattern}`]);
      }
    }
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden import in Pack27 source', [`${rel}: ${pattern}`]);
      }
    }
  }

  if (!indexSource.includes('export {')) {
    fail('index must export public execution lane utilities');
  }

  if (!runNodeCheck('scripts/viona-pack26b-action-registry-check.mjs')) {
    return;
  }
  if (!runNodeCheck('scripts/viona-pack26c-audit-timeline-contract-check.mjs')) {
    return;
  }
  if (!runNodeCheck('scripts/viona-pack26d-operator-approval-check.mjs')) {
    return;
  }
  if (!runTsxContractSmoke()) {
    return;
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack27 execution lane layer.');
    return;
  }

  console.log(`Expected files: PASS (${PACK27_FILES.length})`);
  console.log('Execution readiness stages: PASS (9)');
  console.log('Execution lane types: PASS (8)');
  console.log('Pack26B action readiness mapping: PASS (9)');
  console.log('Policy execution/write flags: PASS');
  console.log('Builders present: PASS');
  console.log('Validators present: PASS');
  console.log('Forbidden runtime patterns: PASS');
  console.log('Forbidden imports: PASS');
  console.log('Pack26B registry check: PASS');
  console.log('Pack26C contract check: PASS');
  console.log('Pack26D operator approval check: PASS');
  console.log('Execution lane smoke: PASS');
  console.log('\nResult: PASS — Pack27 execution lane planning layer is consistent.');
}

main();
