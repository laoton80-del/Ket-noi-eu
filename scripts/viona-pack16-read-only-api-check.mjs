#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK16_ALLOWED_DIFF_FILES = [
  'scripts/viona-pack16-read-only-api-check.mjs',
  'scripts/test-viona-read-only-persistence-api.ts',
  'docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack16-read-only-persistence-api-implementation/README.md',
];

const REQUIRED_RUNTIME_FILES = [
  'src/routes/vionaRoutes.ts',
  'src/controllers/VionaRequestController.ts',
  'src/services/viona/vionaRequestReadService.ts',
  'src/services/viona/vionaRequestAccessScope.ts',
  'src/services/viona/vionaRequestReadDto.ts',
  'src/services/viona/vionaRequestReadSerializer.ts',
  'src/app.ts',
];

const REQUIRED_DOCS = [
  'docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION.md',
  'docs/design/evidence/cursor-pack16-read-only-persistence-api-implementation/README.md',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^prisma\//,
  /^\.env/,
  /^docs\/ai-context\/VIONA_KERNEL_HANDOFF/,
  /pack17/i,
  /pack29/i,
  /^src\/lib\/viona\/actions\//,
  /^src\/lib\/viona\/audit\//,
  /^src\/lib\/viona\/execution\//,
];

const READ_SERVICE_FORBIDDEN = [
  /\bcreate\s*\(/,
  /\bupdate\s*\(/,
  /\bdelete\s*\(/,
  /\bupsert\s*\(/,
  /\b\$executeRaw\b/,
  /\b\$queryRaw\b/,
];

const GET_HANDLER_FORBIDDEN = [
  /appendVionaRequestNote/,
  /transitionVionaRequestStatus/,
  /\.create\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
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

function extractFunctionBlock(source, signature) {
  const idx = source.indexOf(signature);
  if (idx === -1) return null;
  const braceStart = source.indexOf('{', idx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(idx, i + 1);
    }
  }
  return null;
}

function main() {
  console.log('VIONA Pack16 read-only persistence API check');
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

  const routes = read('src/routes/vionaRoutes.ts');
  const controller = read('src/controllers/VionaRequestController.ts');
  const readService = read('src/services/viona/vionaRequestReadService.ts');
  const accessScope = read('src/services/viona/vionaRequestAccessScope.ts');
  const app = read('src/app.ts');
  const productDoc = read('docs/product/VIONA_REQUEST_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION.md');

  const routeChecks = [
  ["vionaRouter.use(authMiddleware)", routes.includes('vionaRouter.use(authMiddleware)')],
  ["GET /requests route", /vionaRouter\.get\(\s*['"]\/requests['"]/.test(routes)],
  ["GET /requests/:id route", /vionaRouter\.get\(\s*['"]\/requests\/:id['"]/.test(routes)],
  ["app mounts /api/viona", app.includes("app.use('/api/viona', vionaRouter)")],
  ["buildAuthorizedVionaRequestWhere export", accessScope.includes('export function buildAuthorizedVionaRequestWhere')],
  ["requester scope", accessScope.includes('requesterUserId: authUserId')],
  ["owner scope", accessScope.includes('ownerUserId: authUserId')],
  ["participant scope", accessScope.includes('participants: { some: { userRef: authUserId } }')],
  ["listVionaRequests export", readService.includes('export async function listVionaRequests')],
  ["getVionaRequestById export", readService.includes('export async function getVionaRequestById')],
  ["operator phrase in product doc", productDoc.includes('APPROVE_PACK16_READ_ONLY_PERSISTENCE_API_IMPLEMENTATION_STAGING_SAFE')],
  ["staging QA phrase separate", productDoc.includes('APPROVE_PACK16_READ_ONLY_API_STAGING_QA')],
  ["implementation status recorded", productDoc.includes('implemented_local_only')],
  ];

  for (const [label, ok] of routeChecks) {
    if (!ok) fail(`runtime/doc check: ${label}`);
  }

  const getListBlock = extractFunctionBlock(controller, 'export async function getVionaRequests');
  const getDetailBlock = extractFunctionBlock(controller, 'export async function getVionaRequestDetail');

  if (getListBlock == null) fail('could not locate getVionaRequests handler');
  if (getDetailBlock == null) fail('could not locate getVionaRequestDetail handler');

  for (const pattern of GET_HANDLER_FORBIDDEN) {
    if (getListBlock && pattern.test(getListBlock)) {
      fail('getVionaRequests contains forbidden write/action pattern', [String(pattern)]);
    }
    if (getDetailBlock && pattern.test(getDetailBlock)) {
      fail('getVionaRequestDetail contains forbidden write/action pattern', [String(pattern)]);
    }
  }

  for (const pattern of READ_SERVICE_FORBIDDEN) {
    if (pattern.test(readService)) {
      fail('read service contains forbidden write pattern', [String(pattern)]);
    }
  }

  if (!readService.includes('findMany') || !readService.includes('findFirst')) {
    fail('read service must use findMany/findFirst only');
  }

  const diffFiles = getDiffFiles();
  const unexpectedDiff = diffFiles.filter((file) => !PACK16_ALLOWED_DIFF_FILES.includes(file));
  const forbiddenDiff = diffFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  if (unexpectedDiff.length) {
    fail('unexpected files in diff vs origin/master', unexpectedDiff);
  }
  if (forbiddenDiff.length) {
    fail('forbidden files in diff vs origin/master', forbiddenDiff);
  }

  const pack16DiffAddsPost =
    diffFiles.includes('src/routes/vionaRoutes.ts') &&
    /\bvionaRouter\.post\b/.test(
      execSync('git diff origin/master..HEAD -- src/routes/vionaRoutes.ts', {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    );
  if (pack16DiffAddsPost) {
    fail('Pack16 diff must not add POST routes');
  }

  if (process.exitCode) {
    console.log('\nResult: FAIL — fix Pack16 read-only persistence API foundation.');
    return;
  }

  console.log(`Required runtime files: PASS (${REQUIRED_RUNTIME_FILES.length})`);
  console.log('GET /api/viona/requests: PASS');
  console.log('GET /api/viona/requests/:id: PASS');
  console.log('Auth middleware on router: PASS');
  console.log('User/requester/owner/participant scope: PASS');
  console.log('Read service read-only patterns: PASS');
  console.log('GET handlers no write side effects: PASS');
  console.log(`Diff scope: PASS (${diffFiles.length} file(s) vs origin/master)`);
  console.log('Product doc operator phrase: PASS');
  console.log('Forbidden diff patterns: PASS');
  console.log('\nResult: PASS — Pack16 read-only persistence API foundation is consistent.');
}

main();
