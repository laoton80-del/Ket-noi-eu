#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACK28_FILES = [
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationTypes.ts',
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationPolicy.ts',
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationBuilders.ts',
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationValidators.ts',
  'src/lib/viona/executionIntegration/index.ts',
  'scripts/viona-pack28-execution-integration-readiness-check.mjs',
  'docs/product/VIONA_REQUEST_PACK28_EXECUTION_INTEGRATION_READINESS_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack28-execution-integration-readiness-implementation/README.md',
];

const PACK28_SOURCE_FILES = [
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationTypes.ts',
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationPolicy.ts',
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationBuilders.ts',
  'src/lib/viona/executionIntegration/vionaExecutionIntegrationValidators.ts',
  'src/lib/viona/executionIntegration/index.ts',
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
  'buildVionaExecutionIntegrationPlan',
  'buildPreviewPlanningVionaExecutionIntegrationPlan',
  'buildDryRunPlanningVionaExecutionIntegrationPlan',
  'buildHumanApprovalPlanningVionaExecutionIntegrationPlan',
  'buildOperatorReviewPlanningVionaExecutionIntegrationPlan',
  'buildBlockedSensitiveVionaExecutionIntegrationPlan',
  'buildNotAuthorizedVionaExecutionIntegrationPlan',
];

const REQUIRED_VALIDATORS = [
  'validateVionaExecutionIntegrationPolicy',
  'validateVionaExecutionIntegrationGateEvaluation',
  'validateVionaExecutionIntegrationPlan',
  'assertVionaExecutionIntegrationReadinessLayerSafe',
];

const REQUIRED_POLICY_HELPERS = [
  'getVionaExecutionIntegrationPolicyForAction',
  'getVionaExecutionIntegrationClassificationForAction',
  'evaluateVionaExecutionIntegrationGate',
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
  /\blocalStorage\b/,
  /\bAsyncStorage\b/,
  /\buseEffect\b/,
  /\bReact\b/,
  /\bcreateEvent\b/,
  /\bsend_email\b/,
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
  /from\s+['"][^'"]*\/backend(?:\/|['"])/i,
  /from\s+['"][^'"]*executionLane/i,
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
  buildBlockedSensitiveVionaExecutionIntegrationPlan,
  buildDryRunPlanningVionaExecutionIntegrationPlan,
  buildHumanApprovalPlanningVionaExecutionIntegrationPlan,
  buildNotAuthorizedVionaExecutionIntegrationPlan,
  buildOperatorReviewPlanningVionaExecutionIntegrationPlan,
  buildPreviewPlanningVionaExecutionIntegrationPlan,
  evaluateVionaExecutionIntegrationGate,
  getVionaExecutionIntegrationPolicyForAction,
  validateVionaExecutionIntegrationGateEvaluation,
  validateVionaExecutionIntegrationPlan,
  assertVionaExecutionIntegrationReadinessLayerSafe,
  VIONA_PACK28_ACTION_INTEGRATION_POLICIES,
  vionaIntegrationLaneClassifications,
  vionaIntegrationReadinessBuckets,
} from './src/lib/viona/executionIntegration/index.ts';

if (vionaIntegrationReadinessBuckets.length !== 9) throw new Error('unexpected readiness bucket count');
if (vionaIntegrationLaneClassifications.length !== 9) throw new Error('unexpected lane classification count');
if (VIONA_PACK28_ACTION_INTEGRATION_POLICIES.length !== 9) throw new Error('unexpected policy count');

const base = {
  integrationPlanId: 'plan-pack28-sample-1',
  actionId: 'request.assign',
  targetType: 'viona_request',
  targetId: 'target-pack28-sample',
  requestedByRole: 'request_owner',
  createdAt: '2026-06-16T12:00:00.000Z',
};

const preview = buildPreviewPlanningVionaExecutionIntegrationPlan({
  ...base,
  integrationPlanId: 'plan-pack28-preview',
  actionId: 'request.status.submitted_to_triage',
});
const dryRun = buildDryRunPlanningVionaExecutionIntegrationPlan({
  ...base,
  integrationPlanId: 'plan-pack28-dryrun',
});
const humanApproval = buildHumanApprovalPlanningVionaExecutionIntegrationPlan({
  ...base,
  integrationPlanId: 'plan-pack28-human',
  actionId: 'request.confirm',
});
const operatorReview = buildOperatorReviewPlanningVionaExecutionIntegrationPlan({
  ...base,
  integrationPlanId: 'plan-pack28-operator',
});
const blocked = buildBlockedSensitiveVionaExecutionIntegrationPlan({
  ...base,
  integrationPlanId: 'plan-pack28-blocked',
  actionId: 'payment.intent',
});
const notAuthorized = buildNotAuthorizedVionaExecutionIntegrationPlan({
  ...base,
  integrationPlanId: 'plan-pack28-not-authorized',
  actionId: 'unknown.action.sample',
});

const unknownGate = evaluateVionaExecutionIntegrationGate({ actionId: 'unknown.action.sample' });
const knownGate = evaluateVionaExecutionIntegrationGate({ actionId: 'request.assign' });

for (const [name, result] of [
  ['preview', validateVionaExecutionIntegrationPlan(preview)],
  ['dryRun', validateVionaExecutionIntegrationPlan(dryRun)],
  ['humanApproval', validateVionaExecutionIntegrationPlan(humanApproval)],
  ['operatorReview', validateVionaExecutionIntegrationPlan(operatorReview)],
  ['blocked', validateVionaExecutionIntegrationPlan(blocked)],
  ['notAuthorized', validateVionaExecutionIntegrationPlan(notAuthorized)],
  ['unknownGate', validateVionaExecutionIntegrationGateEvaluation(unknownGate)],
  ['knownGate', validateVionaExecutionIntegrationGateEvaluation(knownGate)],
  ['layerSafe', assertVionaExecutionIntegrationReadinessLayerSafe()],
]) {
  if (!result.ok) {
    throw new Error(name + ' validation failed: ' + JSON.stringify(result.errors));
  }
}

if (preview.executionAuthorized !== false || preview.previewOnly !== true) {
  throw new Error('preview plan must remain non-executing');
}
if (dryRun.executionAuthorized !== false || dryRun.dryRunOnly !== true) {
  throw new Error('dry-run plan must remain non-executing');
}
if (!unknownGate.blocked || unknownGate.executionAuthorized !== false) {
  throw new Error('unknown action must return safe blocked gate');
}
const paymentPolicy = getVionaExecutionIntegrationPolicyForAction('payment.intent');
if (paymentPolicy.executionAuthorized !== false || paymentPolicy.uiBackendWiringAuthorized !== false) {
  throw new Error('payment policy must remain non-executing/non-wiring');
}
if (paymentPolicy.dbWriteAuthorized !== false || paymentPolicy.statusPostAuthorized !== false) {
  throw new Error('payment policy must remain non-writing/non-status-post');
}

console.log('EXECUTION_INTEGRATION_SMOKE_OK');
`;

  const result = spawnSync('npx', ['tsx', '-e', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('execution integration smoke via tsx failed', [
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
  console.log('VIONA Pack28 execution integration readiness check');
  console.log('Non-persistent contract/policy layer. No routes, writes, DB, or execution.\n');

  const missingFiles = PACK28_FILES.filter((rel) => !existsSync(path.join(ROOT, rel)));
  if (missingFiles.length) {
    fail('required Pack28 files missing', missingFiles);
    return;
  }

  const typesSource = read('src/lib/viona/executionIntegration/vionaExecutionIntegrationTypes.ts');
  const policySource = read('src/lib/viona/executionIntegration/vionaExecutionIntegrationPolicy.ts');
  const buildersSource = read('src/lib/viona/executionIntegration/vionaExecutionIntegrationBuilders.ts');
  const validatorsSource = read('src/lib/viona/executionIntegration/vionaExecutionIntegrationValidators.ts');
  const indexSource = read('src/lib/viona/executionIntegration/index.ts');

  const duplicateBuckets = duplicateConstEntries(typesSource, 'vionaIntegrationReadinessBuckets');
  if (duplicateBuckets.length) {
    fail('duplicate integration readiness buckets', duplicateBuckets);
  }

  const duplicateClassifications = duplicateConstEntries(typesSource, 'vionaIntegrationLaneClassifications');
  if (duplicateClassifications.length) {
    fail('duplicate integration lane classifications', duplicateClassifications);
  }

  for (const actionId of PACK26B_ACTION_IDS) {
    if (!policySource.includes(`actionId: '${actionId}'`) && !policySource.includes(`buildPolicy('${actionId}'`)) {
      if (!policySource.includes(`'${actionId}'`)) {
        fail('missing Pack26B action ID in integration mapping', [actionId]);
      }
    }
    if (!policySource.includes(`'${actionId}'`)) {
      fail('missing Pack26B action ID in integration mapping', [actionId]);
    }
  }

  for (const flag of [
    'uiBackendWiringAuthorized: false',
    'executionAuthorized: false',
    'dbWriteAuthorized: false',
    'statusPostAuthorized: false',
    'liveQaAuthorized: false',
  ]) {
    if (!policySource.includes(flag)) {
      fail(`policy source must keep ${flag}`);
    }
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

  for (const rel of PACK28_SOURCE_FILES) {
    const source = read(rel);
    for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden runtime pattern in Pack28 source', [`${rel}: ${pattern}`]);
      }
    }
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden import in Pack28 source', [`${rel}: ${pattern}`]);
      }
    }
  }

  if (!indexSource.includes('export {')) {
    fail('index must export public execution integration utilities');
  }

  if (!runNodeCheck('scripts/viona-pack27-execution-lane-check.mjs')) {
    return;
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
    console.log('\nResult: FAIL — fix Pack28 execution integration readiness layer.');
    return;
  }

  console.log(`Expected files: PASS (${PACK28_FILES.length})`);
  console.log('Integration readiness buckets: PASS (9)');
  console.log('Integration lane classifications: PASS (9)');
  console.log('Pack26B action integration mapping: PASS (9)');
  console.log('Policy authorization/write flags: PASS');
  console.log('Builders present: PASS');
  console.log('Validators present: PASS');
  console.log('Forbidden runtime patterns: PASS');
  console.log('Forbidden imports: PASS');
  console.log('Pack27 execution lane check: PASS');
  console.log('Pack26B registry check: PASS');
  console.log('Pack26C contract check: PASS');
  console.log('Pack26D operator approval check: PASS');
  console.log('Execution integration smoke: PASS');
  console.log('\nResult: PASS — Pack28 execution integration readiness layer is consistent.');
}

main();
