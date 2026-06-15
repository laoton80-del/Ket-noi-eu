#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK13A_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts',
  'scripts/viona-request-pack13-prisma-schema-implementation-approval-packet-check.mjs',
  'docs/design/evidence/cursor-request-pack13a-prisma-schema-implementation-approval-packet/README.md',
];

const PACK12_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK12_PRISMA_SCHEMA_READINESS_BOUNDARY.md',
  'src/domain/requests/vionaRequestPrismaSchemaReadinessBoundary.ts',
  'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'docs/design/evidence/cursor-request-pack12-prisma-schema-readiness-boundary/README.md',
];

const POINTER_CONFIG_FILES = [
  'src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts',
  'src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts',
  'src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts',
  'src/config/vionaRequestSotHumanApprovalReadiness.ts',
  'src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts',
  'src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts',
  'src/config/vionaRequestPersistenceAuditReadiness.ts',
  'src/config/vionaOperatorInboxAdminReadiness.ts',
];

const GATE_SCRIPT_FILES = [
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'scripts/viona-request-schema-design-human-approval-recording-check.mjs',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
  'scripts/viona-request-sot-human-approval-recording-check.mjs',
  'scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs',
  'scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
];

const ALLOWED_FILES = [
  ...PACK13A_CORE_FILES,
  ...PACK12_CORE_FILES,
  ...POINTER_CONFIG_FILES,
  ...GATE_SCRIPT_FILES,
];

const REQUIRED_FILES = PACK13A_CORE_FILES;

const REQUIRED_DOC_PHRASES = [
  'origin/master @ c8c0a3f',
  'Pack12 Prisma schema readiness boundary is **complete**',
  'Pack13 Prisma schema **implementation is not approved yet**',
  'future human decision only',
  'Cursor/agent must not fill approval fields',
  'Cursor/agent must not flip',
  'pack13HumanApprovalRecorded',
  'false',
  'pack13PrismaSchemaImplementationApproved',
  'pack12ImplementationApproved',
  'prismaSchemaPermitted',
  'prismaSchemaActive',
  'prismaMigrationPermitted',
  'prismaMigrationActive',
  'API, adapter, mutation, and live runtime remain **blocked**',
  'Status: **PENDING**',
  'Dedicated VIONA Request Store',
  'VionaRequestParticipant',
  'LocalServiceRequest direct reuse',
  'Audit log is not a payment ledger',
  'Admin Debug remains fixture-only',
  'OPERATOR is still not Prisma/Auth',
  'Migration is not approved by this packet',
  'API is not approved by this packet',
  'Adapter/mutation/live runtime are not approved',
  'planning-to-schema conversion',
  'does **not** authorize',
];

const FORBIDDEN_DOC_PHRASES = [
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'prismaSchemaPermitted: true',
  'Final decision** | **APPROVED**',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET_READINESS',
  'export const VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET_CHECKLIST',
  'export function getVionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness',
  'export function isVionaRequestPack13PrismaSchemaImplementationApprovalPacketReadyForHumanReview',
  'pack13PrismaSchemaImplementationApprovalPacketActive: true',
  'pack13ApprovalPacketPrepared: true',
  'pack13HumanApprovalRequired: true',
  'futurePrismaSchemaImplementationRequiresHumanApproval: true',
  'pack12PrismaSchemaReadinessBoundaryActive: true',
  'pack12PlanningStarted: true',
  'pack12PlanningOnly: true',
  'schemaDesignApproved: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'pack13HumanApprovalRecorded: false',
  'pack13PrismaSchemaImplementationApproved: false',
  'pack12ImplementationApproved: false',
  'pack13Started: false',
  'pack12Started: false',
  'prismaSchemaPermitted: false',
  'prismaSchemaActive: false',
  'prismaMigrationPermitted: false',
  'prismaMigrationActive: false',
  'readOnlyApiPermitted: false',
  'persistenceAdapterPermitted: false',
  'requestMutationPermitted: false',
  'persistenceApiActive: false',
  'readOnlyApiActive: false',
  'persistenceAdapterActive: false',
  'auditLogActive: false',
  'requestMutationActive: false',
  'adminDebugLiveDataActive: false',
  'operatorRoleAddedToAuth: false',
  'operatorRoleAddedToPrisma: false',
  'productionLiveOpsActive: false',
  'adminDebugUsesFixturesOnly: true',
  'agentMayFlipSignoff: false',
];

const REQUIRED_POINTER_TOKENS = [
  'pack13PrismaSchemaImplementationApprovalPacketActive: true',
  'pack13ApprovalPacketPrepared: true',
  'pack13HumanApprovalRequired: true',
];

const FORBIDDEN_POINTER_TOKENS = [
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'pack13Started: true',
  'pack12ImplementationApproved: true',
  'prismaSchemaPermitted: true',
  'prismaSchemaActive: true',
];

const FORBIDDEN_DIFF_PATTERNS = [
  /^App\.tsx$/,
  /MainTabNavigator/,
  /^src\/navigation\//,
  /VionaAdminDebugOperatorInboxPreviewScreen/,
  /LocalMerchantRequestInbox/,
  /TourismMerchantInbox/,
  /LocalOpsAudit/,
  /^assets\//,
  /^prisma\//,
  /^src\/routes\//,
  /^src\/controllers\//,
  /^src\/server\.ts$/,
  /vionaRequestTypes\.ts$/,
];

const FORBIDDEN_RUNTIME_IMPORTS = [
  'react',
  'react-native',
  'fetch(',
  'axios.',
  'AsyncStorage',
  '@prisma/client',
  'PrismaClient',
  'useNavigation',
];

const UNSAFE_STANDALONE_CLAIMS = [
  'payment captured',
  'booking confirmed',
  'sos dispatched',
  'live ai action',
  'live merchant execution',
  'payout completed',
  'settlement completed',
];

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function missingValues(content, values) {
  return values.filter((value) => !content.includes(value));
}

function fail(label, values) {
  console.log(`FAIL ${label}`);
  for (const value of values) console.log(`  - ${value}`);
  process.exitCode = 1;
}

function getChangedFiles() {
  const output = run('git diff --name-only origin/master..HEAD');
  if (!output) return [];
  return output.split('\n').map((line) => line.replace(/\\/g, '/')).filter(Boolean);
}

function findUnsafeStandaloneClaims(paths) {
  const hits = [];
  for (const relPath of paths) {
    if (!existsSync(path.join(ROOT, relPath))) continue;
    const content = read(relPath);
    for (const claim of UNSAFE_STANDALONE_CLAIMS) {
      if (!content.toLowerCase().includes(claim)) continue;
      for (const line of content.split('\n')) {
        if (!line.toLowerCase().includes(claim)) continue;
        const normalized = line.toLowerCase();
        if (normalized.includes(`no ${claim}`)) continue;
        if (normalized.includes(`not ${claim}`)) continue;
        if (claim === 'payment captured' && normalized.includes('no payment captured')) continue;
        if (claim === 'booking confirmed' && normalized.includes('not booking confirmed')) continue;
        hits.push(`${relPath}: ${claim} (${line.trim()})`);
      }
    }
  }
  return [...new Set(hits)];
}

function main() {
  console.log('VIONA request Pack13A Prisma schema implementation approval packet check');
  console.log(
    'Approval packet only. No approval recorded. No Prisma schema, migration, API, adapter, mutation, or runtime.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const packetDoc = read(
    'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET.md'
  );
  const config = read(
    'src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts'
  );
  const schemaApproval = read('src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts');
  const pack12 = read('src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts');
  const dedicated = read('src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts');
  const human = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${schemaApproval}\n${pack12}\n${dedicated}\n${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(packetDoc, REQUIRED_DOC_PHRASES);
  const forbiddenDocPhrases = FORBIDDEN_DOC_PHRASES.filter((phrase) => packetDoc.includes(phrase));
  const missingConfigTokens = missingValues(config, REQUIRED_CONFIG_TOKENS);
  const missingPointerTokens = missingValues(pointerCombined, REQUIRED_POINTER_TOKENS);
  const forbiddenPointerHits = FORBIDDEN_POINTER_TOKENS.filter((token) =>
    pointerCombined.includes(token)
  );
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_APPROVAL_PACKET.md',
    'src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => config.includes(token));

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (prismaChanged) fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingDocPhrases.length) fail('missing approval packet doc requirements', missingDocPhrases);
  if (forbiddenDocPhrases.length) fail('approval packet must remain blank/pending', forbiddenDocPhrases);
  if (missingConfigTokens.length) fail('missing readiness config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (forbiddenPointerHits.length) fail('forbidden pointer flags must remain false', forbiddenPointerHits);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports', forbiddenImports);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack13A approval packet before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Approval packet blank/pending: PASS');
  console.log('Human approval required: PASS');
  console.log('Readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log('pack13HumanApprovalRecorded remains false: PASS');
  console.log('pack13PrismaSchemaImplementationApproved remains false: PASS');
  console.log('pack13Started remains false: PASS');
  console.log('pack12ImplementationApproved remains false: PASS');
  console.log('Prisma schema remains not permitted: PASS');
  console.log('Migration/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('OPERATOR Prisma/Auth not added: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - Pack13A Prisma schema implementation approval packet is import-ready.');
}

main();
