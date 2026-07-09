#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACK29_FILES = [
  'src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard.ts',
  'src/lib/viona/executionGate/index.ts',
  'src/services/viona/vionaRequestExecutionGateDto.ts',
  'src/services/viona/vionaRequestExecutionGateService.ts',
  'src/controllers/VionaRequestController.ts',
  'src/routes/vionaRoutes.ts',
  'scripts/test-viona-pack29-execution-gate.ts',
  'scripts/viona-pack29-execution-gate-check.mjs',
  'docs/product/VIONA_REQUEST_PACK29_STAGING_FIRST_EXECUTION_GATE_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack29-staging-first-execution-gate-implementation/README.md',
];

const PACK29_PURE_SOURCE_FILES = [
  'src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard.ts',
  'src/lib/viona/executionGate/index.ts',
];

const FORBIDDEN_PURE_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\b/,
  /\bprisma\b/i,
  /\bsupabase\b/i,
  /\bprocess\.env\b/,
  /\bDate\.now\b/,
  /\bcrypto\b/,
  /\brandomUUID\b/,
  /\bMath\.random\b/,
];

const FORBIDDEN_PURE_IMPORTS = [
  /from\s+['"][^'"]*prisma/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"]@prisma/i,
  /from\s+['"][^'"]*\/routes\//i,
  /from\s+['"][^'"]*\/controllers\//i,
];

const FORBIDDEN_SERVICE_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\b/,
  /\b\.update\s*\(/,
  /\b\.create\s*\(/,
  /\b\.delete\s*\(/,
  /\b\$transaction\b/,
  /\bsendEmail\b/i,
  /\bsendSms\b/i,
  /\bpushNotification\b/i,
  /\bsosDispatch\b/i,
  /\bpaymentCapture\b/i,
  /\bconfirmBooking\b/i,
];

const REQUIRED_GUARD_EXPORTS = [
  'VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES',
  'VIONA_PACK29_EXECUTION_BLOCKED_STATUSES',
  'VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID',
  'evaluateVionaRequestExecutionEligibility',
  'isVionaPack29PostTriageEligibleStatus',
];

const REQUIRED_SAFETY_FLAGS = [
  'executionPreviewOnly: true',
  'dryRunNoOp: true',
  'noPersistentAuditWrite: true',
  'noExternalSideEffects: true',
  'operatorApprovalRequiredBeforeRealAction: true',
  'externalExecutionBlocked: true',
  'stagingFirst: true',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(message, details = []) {
  console.log(`FAIL ${message}`);
  for (const detail of details) console.log(`  - ${detail}`);
  process.exitCode = 1;
}

function runTsx(scriptPath) {
  const result = spawnSync('npx', ['tsx', scriptPath], {
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

function main() {
  for (const rel of PACK29_FILES) {
    if (!existsSync(path.join(ROOT, rel))) {
      fail('missing required Pack29 file', [rel]);
      return;
    }
  }

  const guardSource = read('src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard.ts');
  for (const name of REQUIRED_GUARD_EXPORTS) {
    if (!guardSource.includes(name)) {
      fail('missing guard export', [name]);
      return;
    }
  }

  const dtoSource = read('src/services/viona/vionaRequestExecutionGateDto.ts');
  for (const flag of REQUIRED_SAFETY_FLAGS) {
    if (!dtoSource.includes(flag)) {
      fail('missing safety flag in DTO', [flag]);
      return;
    }
  }

  const serviceSource = read('src/services/viona/vionaRequestExecutionGateService.ts');
  if (!serviceSource.includes('previewVionaRequestExecutionGate')) {
    fail('missing previewVionaRequestExecutionGate service');
    return;
  }
  if (!serviceSource.includes('buildDryRunOnlyVionaExecutionAttempt')) {
    fail('service must use dry-run builder only');
    return;
  }
  if (!serviceSource.includes('persistentAuditWritten: false')) {
    fail('service must not claim persistent audit writes');
    return;
  }
  for (const pattern of FORBIDDEN_SERVICE_PATTERNS) {
    if (pattern.test(serviceSource)) {
      fail('forbidden pattern in service source', [String(pattern)]);
      return;
    }
  }

  const routesSource = read('src/routes/vionaRoutes.ts');
  if (!routesSource.includes('/actions/execution-preview')) {
    fail('missing execution-preview route');
    return;
  }

  for (const rel of PACK29_PURE_SOURCE_FILES) {
    const source = read(rel);
    for (const pattern of FORBIDDEN_PURE_PATTERNS) {
      if (pattern.test(source)) {
        fail('forbidden pattern in pure guard source', [`${rel}: ${pattern}`]);
        return;
      }
    }
    for (const pattern of FORBIDDEN_PURE_IMPORTS) {
      if (pattern.test(source)) {
        fail('forbidden import in pure guard source', [`${rel}: ${pattern}`]);
        return;
      }
    }
  }

  if (existsSync(path.join(ROOT, 'prisma/migrations'))) {
    // Pack29 must not add migrations — diff check below is authoritative.
  }

  const prismaDirChanged = spawnSync('git', ['diff', '--name-only', 'origin/master..HEAD', '--', 'prisma/'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (prismaDirChanged.stdout?.trim()) {
    fail('prisma changes forbidden in Pack29', [prismaDirChanged.stdout.trim()]);
    return;
  }

  const envChanged = spawnSync('git', ['diff', '--name-only', 'origin/master..HEAD', '--', '.env', '.env.local', '.env.*'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (envChanged.stdout?.trim()) {
    fail('.env changes forbidden in Pack29', [envChanged.stdout.trim()]);
    return;
  }

  if (!runTsx('scripts/test-viona-pack29-execution-gate.ts')) {
    return;
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack29 staging-first execution gate.');
    return;
  }

  console.log(`Expected files: PASS (${PACK29_FILES.length})`);
  console.log('Eligibility guard exports: PASS');
  console.log('Safety envelope flags: PASS');
  console.log('Dry-run service constraints: PASS');
  console.log('Execution-preview route: PASS');
  console.log('Pure guard forbidden patterns: PASS');
  console.log('No prisma/env diff: PASS');
  console.log('Pure tests: PASS');
  console.log('\nResult: PASS — Pack29 staging-first execution gate is consistent.');
  console.log('Classification: PACK29_STAGING_FIRST_EXECUTION_GATE_IMPLEMENTED_NO_EXTERNAL_SIDE_EFFECTS');
}

main();
