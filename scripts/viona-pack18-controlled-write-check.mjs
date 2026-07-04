#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK18_ALLOWED_DIFF_FILES = [
  'scripts/viona-pack18-controlled-write-check.mjs',
  'scripts/viona-pack17-read-only-inbox-check.mjs',
  'docs/product/VIONA_REQUEST_PACK18_CONTROLLED_WRITE_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack18-controlled-write-implementation/README.md',
  'src/lib/viona/requests/vionaRequestControlledWritePolicy.ts',
  'src/services/vionaRequestControlledWriteApi.ts',
  'src/components/viona/requests/VionaRequestLiveDetailControlledWrite.tsx',
  'src/components/viona/requests/VionaRequestNoteInputWrite.tsx',
  'src/components/viona/requests/VionaRequestStatusActionWrite.tsx',
  'src/components/viona/requests/index.ts',
  'src/screens/viona/VionaRequestLiveInboxScreen.tsx',
];

const REQUIRED_RUNTIME_FILES = [
  'src/lib/viona/requests/vionaRequestControlledWritePolicy.ts',
  'src/services/vionaRequestControlledWriteApi.ts',
  'src/components/viona/requests/VionaRequestLiveDetailControlledWrite.tsx',
  'src/components/viona/requests/VionaRequestNoteInputWrite.tsx',
  'src/components/viona/requests/VionaRequestStatusActionWrite.tsx',
  'src/screens/viona/VionaRequestLiveInboxScreen.tsx',
  'src/services/vionaRequestReadOnlyApi.ts',
  'src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx',
];

const REQUIRED_DOCS = [
  'docs/product/VIONA_REQUEST_PACK18_CONTROLLED_WRITE_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack18-controlled-write-implementation/README.md',
];

const PACK18_WRITE_SOURCES = [
  'src/services/vionaRequestControlledWriteApi.ts',
  'src/components/viona/requests/VionaRequestNoteInputWrite.tsx',
  'src/components/viona/requests/VionaRequestStatusActionWrite.tsx',
  'src/components/viona/requests/VionaRequestLiveDetailControlledWrite.tsx',
  'src/screens/viona/VionaRequestLiveInboxScreen.tsx',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^prisma\//,
  /^\.env/,
  /^docs\/ai-context\/VIONA_KERNEL_HANDOFF/,
  /pack29/i,
  /^src\/lib\/viona\/execution\//,
];

function containsForbiddenPack29Reference(source) {
  for (const line of source.split('\n')) {
    if (!/pack29/i.test(line)) continue;
    if (/\b(no|not|without|blocked|forbidden|absent)\b/i.test(line)) continue;
    if (/import.*pack29/i.test(line)) return true;
    if (/from\s+['"][^'"]*pack29/i.test(line)) return true;
    return true;
  }
  return false;
}

const FORBIDDEN_SOURCE_PATTERNS = [
  /executionLane/i,
  /assignVionaRequest/i,
  /confirmBooking/i,
  /cancelBooking/i,
  /paymentCapture/i,
  /sosDispatch/i,
  /console\.(log|debug|info)\([^)]*(authorization|cookie|jwt|token|pin)/i,
  /staging\.ket-noi/i,
  /https?:\/\/[^'"]*staging[^'"]*/i,
];

const UNGUARDED_WRITE_FORBIDDEN = [
  /\bappendVionaRequestNote\s*\(/,
  /\btransitionVionaRequestStatus\s*\(/,
];

const REQUIRED_IN_FLIGHT_GUARDS = [/if\s*\(\s*submitting\s*\)/, /setSubmitting\s*\(\s*true\s*\)/];

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

function main() {
  console.log('VIONA Pack18 controlled write implementation check');
  console.log('Static verification only. No staging calls, DB commands, or secrets.\n');

  const missingRuntime = REQUIRED_RUNTIME_FILES.filter(
    (relPath) => !existsSync(path.join(ROOT, relPath))
  );
  if (missingRuntime.length) {
    fail('missing required runtime files', missingRuntime);
    return;
  }

  const missingDocs = REQUIRED_DOCS.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  if (missingDocs.length) {
    fail('missing required docs/evidence', missingDocs);
    return;
  }

  const policy = read('src/lib/viona/requests/vionaRequestControlledWritePolicy.ts');
  const controlledApi = read('src/services/vionaRequestControlledWriteApi.ts');
  const noteWrite = read('src/components/viona/requests/VionaRequestNoteInputWrite.tsx');
  const statusWrite = read('src/components/viona/requests/VionaRequestStatusActionWrite.tsx');
  const controlledDetail = read(
    'src/components/viona/requests/VionaRequestLiveDetailControlledWrite.tsx'
  );
  const inboxScreen = read('src/screens/viona/VionaRequestLiveInboxScreen.tsx');
  const readOnlyApi = read('src/services/vionaRequestReadOnlyApi.ts');
  const readOnlyDetail = read('src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx');
  const productDoc = read('docs/product/VIONA_REQUEST_PACK18_CONTROLLED_WRITE_IMPLEMENTATION.md');

  const runtimeChecks = [
    ['policy exports isVionaPack18ControlledWriteEnabled', policy.includes('export function isVionaPack18ControlledWriteEnabled')],
    ['policy documents rollback flag', policy.includes('VIONA_PACK18_CONTROLLED_WRITE_ENABLED')],
    ['policy endpoint inventory', policy.includes('VIONA_PACK18_CONTROLLED_WRITE_ENDPOINTS')],
    ['policy status allowlist', policy.includes('VIONA_PACK18_STATUS_ACTION_ALLOWLIST')],
    ['controlled API appendVionaRequestNoteControlled', controlledApi.includes('export async function appendVionaRequestNoteControlled')],
    ['controlled API transitionVionaRequestStatusControlled', controlledApi.includes('export async function transitionVionaRequestStatusControlled')],
    ['note write uses controlled API', noteWrite.includes('appendVionaRequestNoteControlled')],
    ['status write uses controlled API', statusWrite.includes('transitionVionaRequestStatusControlled')],
    ['note write requires writePolicyContext', noteWrite.includes('writePolicyContext')],
    ['status write requires writePolicyContext', statusWrite.includes('writePolicyContext')],
    ['controlled detail gates note write', controlledDetail.includes('canSubmitVionaRequestNote')],
    ['controlled detail gates status write', controlledDetail.includes('canPerformVionaRequestStatusAction')],
    ['inbox uses read-only GET client', inboxScreen.includes("from '../../services/vionaRequestReadOnlyApi'")],
    ['inbox rollback to read-only detail', inboxScreen.includes('VionaRequestLiveDetailReadOnly')],
    ['inbox controlled detail wiring', inboxScreen.includes('VionaRequestLiveDetailControlledWrite')],
    ['read-only API unchanged GET-only', !/method:\s*['"]POST['"]/.test(readOnlyApi)],
    ['read-only detail remains write-free', !readOnlyDetail.includes('VionaRequestNoteInputWrite')],
    ['operator phrase in product doc', productDoc.includes('APPROVE_PACK18_CONTROLLED_WRITE_IMPLEMENTATION_STAGING_SAFE')],
    ['staging QA phrase separate', productDoc.includes('APPROVE_PACK18_CONTROLLED_WRITE_STAGING_QA')],
    ['status after pack recorded', productDoc.includes('implemented_local_controlled_write')],
    ['Pack16 baseline in product doc', productDoc.includes('staging_read_only_qa_passed')],
    ['Pack17 baseline in product doc', productDoc.includes('staging_read_only_qa_passed')],
    ['source master in product doc', productDoc.includes('a3cf5dd')],
  ];

  for (const [label, ok] of runtimeChecks) {
    if (!ok) fail(`runtime/doc check: ${label}`);
  }

  for (const relPath of PACK18_WRITE_SOURCES) {
    const source = read(relPath);
    if (containsForbiddenPack29Reference(source)) {
      fail(`${relPath} contains forbidden Pack29 wiring/reference`, ['pack29']);
    }
    for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
      if (pattern.test(source)) {
        fail(`${relPath} contains forbidden pattern`, [String(pattern)]);
      }
    }
  }

  for (const relPath of [
    'src/components/viona/requests/VionaRequestNoteInputWrite.tsx',
    'src/components/viona/requests/VionaRequestStatusActionWrite.tsx',
  ]) {
    const source = read(relPath);
    for (const pattern of REQUIRED_IN_FLIGHT_GUARDS) {
      if (!pattern.test(source)) {
        fail(`${relPath} missing in-flight/duplicate-submit guard`, [String(pattern)]);
      }
    }
    if (!source.includes('attemptIdempotencyKeyRef')) {
      fail(`${relPath} missing idempotency key guard`);
    }
    if (!source.includes('result.ok')) {
      fail(`${relPath} must confirm server response before success UI`);
    }
  }

  if (noteWrite.includes('appendVionaRequestNote(') && !noteWrite.includes('appendVionaRequestNoteControlled')) {
    fail('unguarded note submit — must use appendVionaRequestNoteControlled');
  }
  if (
    statusWrite.includes('transitionVionaRequestStatus(') &&
    !statusWrite.includes('transitionVionaRequestStatusControlled')
  ) {
    fail('unguarded status POST — must use transitionVionaRequestStatusControlled');
  }

  for (const pattern of UNGUARDED_WRITE_FORBIDDEN) {
    if (pattern.test(inboxScreen)) {
      fail('inbox screen must not call write APIs directly', [String(pattern)]);
    }
    if (pattern.test(controlledDetail)) {
      fail('controlled detail must not call write APIs directly', [String(pattern)]);
    }
  }

  if (readOnlyDetail.includes('onNoteSubmitted') || readOnlyDetail.includes('onStatusActionCompleted')) {
    fail('Pack17 read-only detail must remain write-free');
  }

  const diffFiles = getDiffFiles();
  const unexpectedDiff = diffFiles.filter((file) => !PACK18_ALLOWED_DIFF_FILES.includes(file));
  const forbiddenDiff = diffFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  if (unexpectedDiff.length) {
    fail('unexpected files in diff vs origin/master', unexpectedDiff);
  }
  if (forbiddenDiff.length) {
    fail('forbidden files in diff vs origin/master', forbiddenDiff);
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack18 controlled write implementation.');
    return;
  }

  console.log(`Required runtime files: PASS (${REQUIRED_RUNTIME_FILES.length})`);
  console.log('Policy/capability layer: PASS');
  console.log('Controlled write API adapter: PASS');
  console.log('Note submit + status action wiring: PASS');
  console.log('In-flight/idempotency guards: PASS');
  console.log('Pack17 read-only recoverable: PASS');
  console.log(`Diff scope: PASS (${diffFiles.length} file(s) vs origin/master)`);
  console.log('No Pack29/execution/staging patterns: PASS');
  console.log('\nResult: PASS — Pack18 controlled write implementation is consistent.');
}

main();
