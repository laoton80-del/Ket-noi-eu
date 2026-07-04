#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK17_ALLOWED_DIFF_FILES = [
  'scripts/viona-pack17-read-only-inbox-check.mjs',
  'docs/product/VIONA_REQUEST_PACK17_READ_ONLY_INBOX_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack17-read-only-inbox-implementation/README.md',
  'src/services/vionaRequestReadOnlyApi.ts',
  'src/screens/viona/VionaRequestLiveInboxScreen.tsx',
  'src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx',
  'src/components/viona/requests/VionaRequestLiveListReadOnly.tsx',
];

const REQUIRED_RUNTIME_FILES = [
  'src/services/vionaRequestReadOnlyApi.ts',
  'src/screens/viona/VionaRequestLiveInboxScreen.tsx',
  'src/components/viona/requests/VionaRequestLiveListReadOnly.tsx',
  'src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx',
  'src/navigation/routes.ts',
  'App.tsx',
];

const REQUIRED_DOCS = [
  'docs/product/VIONA_REQUEST_PACK17_READ_ONLY_INBOX_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack17-read-only-inbox-implementation/README.md',
];

const PACK17_INBOX_SOURCES = [
  'src/services/vionaRequestReadOnlyApi.ts',
  'src/components/viona/requests/VionaRequestLiveListReadOnly.tsx',
  'src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^prisma\//,
  /^\.env/,
  /^docs\/ai-context\/VIONA_KERNEL_HANDOFF/,
  /pack29/i,
  /^src\/lib\/viona\/execution\//,
];

const INBOX_FORBIDDEN_IMPORTS = [
  'VionaRequestNoteInputWrite',
  'VionaRequestStatusActionWrite',
  'appendVionaRequestNote',
  'transitionVionaRequestStatus',
  'vionaRequestNoteActionService',
  'vionaRequestStatusActionService',
];

const INBOX_FORBIDDEN_PATTERNS = [
  /method:\s*['"]POST['"]/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]PUT['"]/,
  /method:\s*['"]DELETE['"]/,
  /\/api\/viona\/requests\/[^'"]+\/status/,
  /\/api\/viona\/requests\/[^'"]+\/actions\//,
  /onNoteSubmitted/,
  /onStatusActionCompleted/,
  /VionaRequestNoteInputWrite/,
  /VionaRequestStatusActionWrite/,
];

const READ_ONLY_API_FORBIDDEN = [
  /appendVionaRequestNote/,
  /transitionVionaRequestStatus/,
  /method:\s*['"]POST['"]/,
  /method:\s*['"]PATCH['"]/,
  /method:\s*['"]PUT['"]/,
  /method:\s*['"]DELETE['"]/,
];

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
  console.log('VIONA Pack17 read-only inbox implementation check');
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

  const readOnlyApi = read('src/services/vionaRequestReadOnlyApi.ts');
  const inboxScreen = read('src/screens/viona/VionaRequestLiveInboxScreen.tsx');
  const productDoc = read('docs/product/VIONA_REQUEST_PACK17_READ_ONLY_INBOX_IMPLEMENTATION.md');
  const routes = read('src/navigation/routes.ts');

  const runtimeChecks = [
    ['read-only API exports fetchVionaRequestsReadOnly', readOnlyApi.includes('export async function fetchVionaRequestsReadOnly')],
    ['read-only API exports fetchVionaRequestByIdReadOnly', readOnlyApi.includes('export async function fetchVionaRequestByIdReadOnly')],
    ['inbox screen uses read-only API module', inboxScreen.includes("from '../../services/vionaRequestReadOnlyApi'")],
    ['inbox screen does not import write API directly', !inboxScreen.includes("from '../../services/vionaRequestApi'")],
    ['inbox screen loading state', inboxScreen.includes('loading') && inboxScreen.includes('ActivityIndicator')],
    ['inbox screen empty state via list component', inboxScreen.includes('VionaRequestLiveListReadOnly')],
    ['inbox screen unauthorized state', inboxScreen.includes('unauthorized')],
    ['inbox screen error state', inboxScreen.includes('listError')],
    ['VionaRequestLiveInbox route registered', routes.includes('VionaRequestLiveInbox')],
    ['operator phrase in product doc', productDoc.includes('APPROVE_PACK17_READ_ONLY_INBOX_IMPLEMENTATION_STAGING_SAFE')],
    ['staging QA phrase separate in product doc', productDoc.includes('APPROVE_PACK17_READ_ONLY_INBOX_STAGING_QA')],
    ['implementation status recorded', productDoc.includes('implemented_local_read_only_inbox')],
    ['Pack16 baseline in product doc', productDoc.includes('staging_read_only_qa_passed')],
    ['source master in product doc', productDoc.includes('2f21023')],
  ];

  for (const [label, ok] of runtimeChecks) {
    if (!ok) fail(`runtime/doc check: ${label}`);
  }

  for (const relPath of PACK17_INBOX_SOURCES) {
    const source = read(relPath);
    for (const token of INBOX_FORBIDDEN_IMPORTS) {
      if (source.includes(token)) {
        fail(`${relPath} contains forbidden import/token`, [token]);
      }
    }
    for (const pattern of INBOX_FORBIDDEN_PATTERNS) {
      if (pattern.test(source)) {
        fail(`${relPath} contains forbidden pattern`, [String(pattern)]);
      }
    }
  }

  for (const pattern of READ_ONLY_API_FORBIDDEN) {
    if (pattern.test(readOnlyApi)) {
      fail('read-only API module contains forbidden write pattern', [String(pattern)]);
    }
  }

  if (!readOnlyApi.includes('fetchVionaRequests') || !readOnlyApi.includes('fetchVionaRequestById')) {
    fail('read-only API must delegate to Pack16 GET helpers');
  }

  const diffFiles = getDiffFiles();
  const pack18ImplementationPresent = existsSync(
    path.join(ROOT, 'docs/product/VIONA_REQUEST_PACK18_CONTROLLED_WRITE_IMPLEMENTATION.md')
  );
  const unexpectedDiff = pack18ImplementationPresent
    ? []
    : diffFiles.filter((file) => !PACK17_ALLOWED_DIFF_FILES.includes(file));
  const forbiddenDiff = diffFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  if (unexpectedDiff.length) {
    fail('unexpected files in diff vs origin/master', unexpectedDiff);
  }
  if (forbiddenDiff.length) {
    fail('forbidden files in diff vs origin/master', forbiddenDiff);
  }

  if (diffFiles.includes('prisma/schema.prisma')) {
    fail('Pack17 diff must not change Prisma schema');
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack17 read-only inbox implementation.');
    return;
  }

  console.log(`Required runtime files: PASS (${REQUIRED_RUNTIME_FILES.length})`);
  console.log('GET-only inbox client: PASS');
  console.log('List/detail read-only UI: PASS');
  console.log('Loading/empty/unauthorized/error states: PASS');
  console.log('No write/status/action wiring in inbox layer: PASS');
  console.log(`Diff scope: PASS (${diffFiles.length} file(s) vs origin/master)`);
  console.log('Product doc operator phrase: PASS');
  console.log('Forbidden diff patterns: PASS');
  console.log('\nResult: PASS — Pack17 read-only inbox implementation is consistent.');
}

main();
