#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK19_R1_ALLOWED_DIFF_FILES = [
  'scripts/viona-pack19-r1-create-submit-path-check.mjs',
  'src/routes/vionaRoutes.ts',
  'src/controllers/VionaRequestController.ts',
  'src/services/viona/vionaRequestCreateDto.ts',
  'src/services/viona/vionaRequestCreateService.ts',
  'docs/product/VIONA_REQUEST_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack19-r1-viona-request-create-submit-path-implementation/README.md',
];

const REQUIRED_RUNTIME_FILES = [
  'src/routes/vionaRoutes.ts',
  'src/controllers/VionaRequestController.ts',
  'src/services/viona/vionaRequestCreateDto.ts',
  'src/services/viona/vionaRequestCreateService.ts',
];

const REQUIRED_DOCS = [
  'docs/product/VIONA_REQUEST_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack19-r1-viona-request-create-submit-path-implementation/README.md',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^prisma\//,
  /^\.env/,
  /^docs\/ai-context\/VIONA_KERNEL_HANDOFF/,
  /pack29/i,
  /^src\/lib\/viona\/execution/,
  /^src\/lib\/viona\/executionIntegration/,
  /^src\/lib\/viona\/executionLane/,
];

const CREATE_SERVICE_FORBIDDEN = [
  /LocalServiceRequest/,
  /transitionVionaRequestStatus/,
  /appendVionaRequestNote/,
  /vionaRequestStatusEvent\.create/,
  /\.booking\./i,
  /\.transaction\./i,
  /twilio/i,
  /stripe/i,
  /notification/i,
];

const ROUTES_FORBIDDEN = [/pack29/i, /executionIntegration/i, /executionLane/i];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(label, values = []) {
  console.log(`FAIL ${label}`);
  for (const value of values) console.log(`  - ${value}`);
  process.exitCode = 1;
}

function getDiffFiles() {
  try {
    const output = execSync('git diff --name-only origin/master..HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!output) return [];
    return output.split('\n').map((line) => line.replace(/\\/g, '/'));
  } catch {
    return [];
  }
}

function checkRequiredFiles() {
  const missing = [...REQUIRED_RUNTIME_FILES, ...REQUIRED_DOCS].filter(
    (f) => !existsSync(path.join(ROOT, f))
  );
  if (missing.length > 0) {
    fail('required files missing', missing);
    return false;
  }
  console.log('PASS required files present');
  return true;
}

function checkDiffAllowlist() {
  const diffFiles = getDiffFiles();
  if (diffFiles.length === 0) {
    console.log('WARN no diff vs origin/master (pre-commit?) — skipping allowlist');
    return true;
  }
  const unexpected = diffFiles.filter((f) => !PACK19_R1_ALLOWED_DIFF_FILES.includes(f));
  if (unexpected.length > 0) {
    fail('unexpected diff files', unexpected);
    return false;
  }
  const forbidden = diffFiles.filter((f) =>
    FORBIDDEN_DIFF_PATTERNS.some((re) => re.test(f))
  );
  if (forbidden.length > 0) {
    fail('forbidden diff paths', forbidden);
    return false;
  }
  console.log(`PASS diff allowlist (${diffFiles.length} files)`);
  return true;
}

function checkPostRouteExists() {
  const routes = read('src/routes/vionaRoutes.ts');
  if (!routes.includes("vionaRouter.post('/requests'")) {
    fail('POST /api/viona/requests route missing');
    return false;
  }
  if (!routes.includes('postCreateVionaRequest')) {
    fail('postCreateVionaRequest handler not wired');
    return false;
  }
  console.log('PASS POST /api/viona/requests route exists');
  return true;
}

function checkNoLocalServiceRequestReuse() {
  const createService = read('src/services/viona/vionaRequestCreateService.ts');
  const createDto = read('src/services/viona/vionaRequestCreateDto.ts');
  const controller = read('src/controllers/VionaRequestController.ts');
  const combined = createService + createDto + controller;
  if (/LocalServiceRequest/i.test(combined)) {
    fail('LocalServiceRequest referenced in create path');
    return false;
  }
  if (!/vionaRequest\.create/.test(createService)) {
    fail('create service must write VionaRequest only');
    return false;
  }
  console.log('PASS VionaRequest-only create path (no LocalServiceRequest)');
  return true;
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function checkNoPack29OrExecutionWiring() {
  const routes = read('src/routes/vionaRoutes.ts');
  const createService = stripComments(read('src/services/viona/vionaRequestCreateService.ts'));
  for (const re of ROUTES_FORBIDDEN) {
    if (re.test(routes)) {
      fail('Pack29/execution wiring in routes', [re.toString()]);
      return false;
    }
  }
  for (const re of CREATE_SERVICE_FORBIDDEN) {
    if (re.test(createService)) {
      fail('forbidden pattern in create service', [re.toString()]);
      return false;
    }
  }
  console.log('PASS no Pack29/execution wiring or forbidden side effects in create service');
  return true;
}

function checkInitialStatusSubmitted() {
  const dto = read('src/services/viona/vionaRequestCreateDto.ts');
  if (!dto.includes("VIONA_REQUEST_CREATE_INITIAL_STATUS = 'submitted'")) {
    fail('initial status must be submitted');
    return false;
  }
  const service = read('src/services/viona/vionaRequestCreateService.ts');
  if (service.includes('transitionVionaRequestStatus')) {
    fail('create service must not call status transition logic');
    return false;
  }
  console.log('PASS initial status submitted; no status transition on create');
  return true;
}

function checkRequiredSafetyLabels() {
  const dto = read('src/services/viona/vionaRequestCreateDto.ts');
  const required = [
    'pack19-safe-submitted-row-precondition',
    'staging-only',
    'non-production',
    'non-hold',
    'non-customer-critical',
    'test-remediation',
  ];
  const missing = required.filter((label) => !dto.includes(label));
  if (missing.length > 0) {
    fail('required safety labels missing from DTO', missing);
    return false;
  }
  console.log('PASS required Pack19 safety labels documented in DTO');
  return true;
}

function main() {
  console.log('VIONA Pack19 R1 create-submit path check');
  let ok = true;
  ok = checkRequiredFiles() && ok;
  ok = checkDiffAllowlist() && ok;
  ok = checkPostRouteExists() && ok;
  ok = checkNoLocalServiceRequestReuse() && ok;
  ok = checkNoPack29OrExecutionWiring() && ok;
  ok = checkInitialStatusSubmitted() && ok;
  ok = checkRequiredSafetyLabels() && ok;
  if (ok && process.exitCode !== 1) {
    console.log('Result: PASS');
  } else {
    process.exitCode = 1;
    console.log('Result: FAIL');
  }
}

main();
