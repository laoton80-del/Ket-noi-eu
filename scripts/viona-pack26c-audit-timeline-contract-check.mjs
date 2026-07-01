#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACK26C_FILES = [
  'src/lib/viona/auditTimeline/vionaAuditTimelineTypes.ts',
  'src/lib/viona/auditTimeline/vionaAuditTimelineBuilders.ts',
  'src/lib/viona/auditTimeline/vionaAuditTimelineValidators.ts',
  'src/lib/viona/auditTimeline/index.ts',
  'scripts/viona-pack26c-audit-timeline-contract-check.mjs',
  'docs/product/VIONA_REQUEST_PACK26C_UNIFIED_AUDIT_TIMELINE_CONTRACT_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack26c-unified-audit-timeline-contract-implementation/README.md',
];

const PACK26C_SOURCE_FILES = [
  'src/lib/viona/auditTimeline/vionaAuditTimelineTypes.ts',
  'src/lib/viona/auditTimeline/vionaAuditTimelineBuilders.ts',
  'src/lib/viona/auditTimeline/vionaAuditTimelineValidators.ts',
  'src/lib/viona/auditTimeline/index.ts',
];

const REQUIRED_TAXONOMY = [
  'status.transition',
  'assignment.requested',
  'assignment.completed',
  'confirmation.requested',
  'confirmation.completed',
  'cancellation.requested',
  'cancellation.completed',
  'booking.requested',
  'payment.intent.created',
  'sos.assist.requested',
  'wallet.adjustment.requested',
  'live_ai.action.requested',
  'gate.blocked',
  'gate.approved',
  'replay.detected',
  'failure.recorded',
];

const REQUIRED_BUILDERS = [
  'buildVionaAuditEvent',
  'buildVionaTimelineEvent',
  'buildVionaActionResultEnvelope',
  'buildBlockedVionaActionResult',
  'buildReplayVionaActionResult',
  'buildFailedVionaActionResult',
];

const REQUIRED_VALIDATORS = [
  'validateVionaAuditEvent',
  'validateVionaTimelineEvent',
  'validateVionaActionResultEnvelope',
  'assertVionaAuditTimelineContractSafe',
];

const BUILDER_FORBIDDEN_PATTERNS = [
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

const VALIDATOR_FORBIDDEN_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\b/,
  /\bPOST\b/,
  /\bprisma\b/i,
  /\bsupabase\b/i,
  /\bprocess\.env\b/,
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
  /from\s+['"][^'"]*components\//i,
  /from\s+['"][^'"]*screens\//i,
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(message, details = []) {
  console.log(`FAIL ${message}`);
  for (const detail of details) console.log(`  - ${detail}`);
  process.exitCode = 1;
}

function runPack26bRegistryCheck() {
  const result = spawnSync('node', ['scripts/viona-pack26b-action-registry-check.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail('Pack26B registry check failed', [
      result.stderr?.trim() || result.stdout?.trim() || 'non-zero exit',
    ]);
    return false;
  }
  return true;
}

function runTsxContractSmoke() {
  const script = `
import {
  buildBlockedVionaActionResult,
  buildFailedVionaActionResult,
  buildReplayVionaActionResult,
  buildVionaAuditEvent,
  buildVionaTimelineEvent,
  validateVionaActionResultEnvelope,
  validateVionaAuditEvent,
  validateVionaTimelineEvent,
  assertVionaAuditTimelineContractSafe,
  vionaAuditTimelineEventTaxonomy,
} from './src/lib/viona/auditTimeline/index.ts';

if (vionaAuditTimelineEventTaxonomy.length !== ${REQUIRED_TAXONOMY.length}) {
  throw new Error('unexpected taxonomy count');
}

const auditEvent = buildVionaAuditEvent({
  auditEventId: 'audit-pack26c-sample-1',
  actionId: 'request.status.submitted_to_triage',
  actionFamily: 'request_status',
  actionVersion: 'pack26c-1',
  universe: 'local',
  targetType: 'viona_request',
  targetId: 'target-pack26c-sample',
  actorRole: 'owner',
  actorRef: { role: 'owner', ref: 'owner-ref-redacted', redacted: true },
  ownerRef: { ref: 'owner-ref-redacted', redacted: true },
  market: 'CZ',
  environment: 'staging',
  readinessState: 'staging_verified',
  beforeState: 'submitted',
  afterState: 'triage',
  requestedTransition: 'submitted -> triage',
  approvedTransition: 'submitted -> triage',
  idempotencyKey: 'idem-pack26c-sample',
  correlationId: 'corr-pack26c-sample',
  capabilityFlagsSnapshot: {
    executionEnabled: false,
    uiAffordanceAllowed: false,
    readinessState: 'staging_verified',
    actionId: 'request.status.submitted_to_triage',
  },
  approvalSnapshot: { required: 'owner', satisfied: ['owner'], missing: [] },
  safetyGateSnapshot: {
    legal: 'allowed',
    payment: 'allowed',
    ops: 'allowed',
    sos: 'allowed',
    market: 'allowed',
  },
  blockedReason: null,
  failureReason: null,
  createdAt: '2026-06-16T12:00:00.000Z',
  sourceSystem: 'viona-contract',
  evidenceLevel: 'staging',
  humanReadableSummary: 'Owner submitted request to triage.',
  eventCategory: 'status.transition',
});

const timelineEvent = buildVionaTimelineEvent({
  timelineEventId: 'timeline-pack26c-sample-1',
  actionId: 'request.status.submitted_to_triage',
  targetType: 'viona_request',
  targetId: 'target-pack26c-sample',
  universe: 'local',
  market: 'CZ',
  actorDisplayRole: 'Owner',
  label: 'request.status.submitted_to_triage',
  summary: 'Request moved to review.',
  statusBefore: 'submitted',
  statusAfter: 'triage',
  userFacingState: 'in_review',
  safetyCopyLevel: 'staging',
  occurredAt: '2026-06-16T12:00:00.000Z',
  visibleToOwner: true,
  visibleToMerchant: false,
  visibleToOperator: true,
  visibleToAdmin: true,
  redactionLevel: 'partial',
  linkedAuditEventId: 'audit-pack26c-sample-1',
  eventCategory: 'status.transition',
});

const blocked = buildBlockedVionaActionResult({
  actionId: 'request.assign',
  targetId: 'target-pack26c-sample',
  readinessState: 'disabled',
  blockedReason: 'Action is planning-only in Pack26C.',
});

const replay = buildReplayVionaActionResult({
  actionId: 'request.status.submitted_to_triage',
  targetId: 'target-pack26c-sample',
  readinessState: 'staging_verified',
  idempotencyKey: 'idem-pack26c-sample',
  resultingState: 'triage',
});

const failed = buildFailedVionaActionResult({
  actionId: 'request.status.submitted_to_triage',
  targetId: 'target-pack26c-sample',
  readinessState: 'staging_verified',
  failureReason: 'Precondition not met.',
});

for (const [name, result] of [
  ['audit', validateVionaAuditEvent(auditEvent)],
  ['timeline', validateVionaTimelineEvent(timelineEvent)],
  ['blocked', validateVionaActionResultEnvelope(blocked)],
  ['replay', validateVionaActionResultEnvelope(replay)],
  ['failed', validateVionaActionResultEnvelope(failed)],
  ['contractSafe', assertVionaAuditTimelineContractSafe()],
]) {
  if (!result.ok) {
    throw new Error(name + ' validation failed: ' + JSON.stringify(result.issues));
  }
}

if (blocked.executionEnabled !== false || blocked.uiAffordanceAllowed !== false) {
  throw new Error('blocked result must keep execution flags false');
}

console.log('CONTRACT_SMOKE_OK');
`;

  const result = spawnSync('npx', ['tsx', '-e', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('contract smoke via tsx failed', [
      result.stderr?.trim() || result.stdout?.trim() || 'tsx exited non-zero',
    ]);
    return false;
  }
  return true;
}

function main() {
  console.log('VIONA Pack26C audit/timeline contract check');
  console.log('Non-persistent contract layer. No routes, writes, DB, or execution.\n');

  const missingFiles = PACK26C_FILES.filter((rel) => !existsSync(path.join(ROOT, rel)));
  if (missingFiles.length) {
    fail('required Pack26C files missing', missingFiles);
    return;
  }

  const typesSource = read('src/lib/viona/auditTimeline/vionaAuditTimelineTypes.ts');
  const buildersSource = read('src/lib/viona/auditTimeline/vionaAuditTimelineBuilders.ts');
  const validatorsSource = read('src/lib/viona/auditTimeline/vionaAuditTimelineValidators.ts');
  const indexSource = read('src/lib/viona/auditTimeline/index.ts');

  const taxonomyInConst = REQUIRED_TAXONOMY.filter((category) => !typesSource.includes(`'${category}'`));
  if (taxonomyInConst.length) {
    fail('missing taxonomy categories in types', taxonomyInConst);
  }

  const duplicateTaxonomy = REQUIRED_TAXONOMY.filter(
    (category, index) => REQUIRED_TAXONOMY.indexOf(category) !== index,
  );
  if (duplicateTaxonomy.length) {
    fail('duplicate taxonomy categories', duplicateTaxonomy);
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

  for (const pattern of BUILDER_FORBIDDEN_PATTERNS) {
    if (pattern.test(buildersSource)) {
      fail('forbidden runtime pattern in builders source', [String(pattern)]);
    }
  }

  for (const pattern of VALIDATOR_FORBIDDEN_PATTERNS) {
    if (pattern.test(validatorsSource)) {
      fail('forbidden runtime pattern in validators source', [String(pattern)]);
    }
  }

  for (const rel of PACK26C_SOURCE_FILES) {
    const source = read(rel);
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden import in Pack26C source', [`${rel}: ${pattern}`]);
      }
    }
  }

  if (!indexSource.includes('export {')) {
    fail('index must export public contract utilities');
  }

  if (!runPack26bRegistryCheck()) {
    return;
  }

  if (!runTsxContractSmoke()) {
    return;
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack26C audit/timeline contract.');
    return;
  }

  console.log(`Expected files: PASS (${PACK26C_FILES.length})`);
  console.log(`Taxonomy categories: PASS (${REQUIRED_TAXONOMY.length})`);
  console.log('Duplicate taxonomy: PASS');
  console.log('Builders present: PASS');
  console.log('Validators present: PASS');
  console.log('Forbidden builder patterns: PASS');
  console.log('Forbidden validator patterns: PASS');
  console.log('Forbidden imports: PASS');
  console.log('Pack26B registry check: PASS');
  console.log('Contract smoke: PASS');
  console.log('\nResult: PASS — Pack26C audit/timeline contract is consistent.');
}

main();
