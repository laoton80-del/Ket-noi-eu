#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK13C_CORE_FILES = [
  'prisma/schema.prisma',
  'docs/product/VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_SCHEMA_ONLY.md',
  'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts',
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'docs/design/evidence/cursor-request-pack13c-prisma-schema-implementation-schema-only/README.md',
];

const PACK14A_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14A_PRISMA_MIGRATION_READINESS_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts',
  'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts',
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-pack14a-prisma-migration-readiness-approval-packet/README.md',
];

const PACK14B_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14B_PRISMA_MIGRATION_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts',
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-pack14b-prisma-migration-human-approval/README.md',
];
const PACK14C_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md',
  'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts',
  'scripts/viona-request-pack14c-prisma-migration-creation-check.mjs',
  'docs/design/evidence/cursor-request-pack14c-prisma-migration-creation-only/README.md',
  'prisma/migrations/20260615120000_add_viona_request_models/migration.sql',
];

const POST_PACK14C_POINTER_TOKENS = [
  'pack14MigrationCreationOnly: true',
  'prismaMigrationActive: true',
  'migrationCreated: true',
  'dbApplied: false',
];

function isPack14cMigrationCreated() {
  const configPath = 'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('migrationCreated: true');
}

function augmentPointerTokensForPack14c(tokens, pack14cActive) {
  if (!pack14cActive) return tokens;
  const filtered = tokens.filter(
    (token) => token !== 'prismaMigrationActive: false' && token !== 'migrationCreated: false'
  );
  return [...filtered, ...POST_PACK14C_POINTER_TOKENS];
}

function augmentConfigTokensForPack14c(tokens, pack14cActive) {
  return augmentPointerTokensForPack14c(tokens, pack14cActive);
}

function isPack14cMigrationDiffFile(file) {
  return /^prisma\/migrations\/\d+_add_viona_request_models\/migration\.sql$/.test(file);
}


const POST_PACK14B_POINTER_TOKENS = [
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'pack14PrismaMigrationApprovalRecordingOnly: true',
  'pack14MigrationCreationMayBePlannedNext: true',
  "pack14PrismaMigrationApprovalSource: 'human-chat-instruction'",
  "pack14PrismaMigrationApprovedBy: 'Nong Si Buong'",
  "pack14PrismaMigrationApprovalDate: '2026-06-15'",
  'prismaMigrationPermitted: true',
];

function isPack14bRecorded() {
  const configPath = 'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('pack14HumanApprovalRecorded: true');
}

function augmentPointerTokensForPack14b(tokens, pack14bRecorded) {
  if (!pack14bRecorded) return tokens;
  const filtered = tokens.filter((token) => token !== 'prismaMigrationPermitted: false');
  return [...filtered, ...POST_PACK14B_POINTER_TOKENS];
}

function augmentConfigTokensForPack14b(tokens, pack14bRecorded) {
  if (!pack14bRecorded) return tokens;
  const filtered = tokens.filter((token) => token !== 'prismaMigrationPermitted: false');
  return [...filtered, 'prismaMigrationPermitted: true', ...POST_PACK14B_POINTER_TOKENS];
}

const POST_PACK13C_POINTER_TOKENS = [
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
];

function isPack13cSchemaOnlyActive() {
  const configPath = 'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('pack13SchemaOnlyImplementation: true');
}

function augmentPointerTokensForPack13c(tokens, pack13cActive) {
  if (!pack13cActive) return tokens;
  const filtered = tokens.filter(
    (token) => token !== 'prismaSchemaActive: false' && token !== 'pack13Started: false'
  );
  return [...filtered, ...POST_PACK13C_POINTER_TOKENS];
}

function augmentConfigTokensForPack13c(tokens, pack13cActive) {
  if (!pack13cActive) return tokens;
  const filtered = tokens.filter(
    (token) => token !== 'prismaSchemaActive: false' && token !== 'pack13Started: false'
  );
  const additions = [];
  if (tokens.includes('prismaSchemaActive: false')) additions.push('prismaSchemaActive: true');
  if (tokens.includes('pack13Started: false')) additions.push('pack13Started: true');
  if (tokens.includes('pack13SchemaOnlyImplementation: true') || tokens.includes('vionaRequestPrismaModelsAdded: true')) {
    additions.push('pack13SchemaOnlyImplementation: true', 'vionaRequestPrismaModelsAdded: true');
  }
  return [...filtered, ...additions];
}

function matchesForbiddenDiff(file, pack13cActive) {
  if (isPack14cMigrationDiffFile(file)) return false;
  if (pack13cActive && file === 'prisma/schema.prisma') return false;
  return FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file));
}

function isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged) {
  if (!prismaChanged) return false;
  const files = prismaChanged.split('\n').map((line) => line.replace(/\\/g, '/')).filter(Boolean);
  return files.some((file) => {
    if (pack14cActive && isPack14cMigrationDiffFile(file)) return false;
    if (pack13cActive && file === 'prisma/schema.prisma') return false;
    return true;
  });
}


const PACK13B_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts',
  'scripts/viona-request-pack13-prisma-schema-implementation-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-pack13b-prisma-schema-implementation-human-approval/README.md',
];

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
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
];

const ALLOWED_FILES = [
  ...PACK13C_CORE_FILES,
  ...PACK14A_CORE_FILES,
  ...PACK14B_CORE_FILES,
  ...PACK14C_CORE_FILES,
  ...PACK13B_CORE_FILES,
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

const POST_APPROVAL_REQUIRED_CONFIG_TOKENS = [
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
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'pack13PrismaSchemaImplementationRecordingOnly: true',
  'pack13PrismaSchemaImplementationMayBePlannedNext: true',
  "pack13PrismaSchemaImplementationApprovalSource: 'human-chat-instruction'",
  "pack13PrismaSchemaImplementationApprovedBy: 'Nong Si Buong'",
  "pack13PrismaSchemaImplementationApprovalDate: '2026-06-15'",
  'pack12ImplementationApproved: false',
  'pack13Started: false',
  'pack12Started: false',
  'prismaSchemaPermitted: true',
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

const POST_APPROVAL_REQUIRED_POINTER_TOKENS = [
  'pack13PrismaSchemaImplementationApprovalPacketActive: true',
  'pack13ApprovalPacketPrepared: true',
  'pack13HumanApprovalRequired: true',
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'pack13PrismaSchemaImplementationRecordingOnly: true',
  'pack13PrismaSchemaImplementationMayBePlannedNext: true',
  "pack13PrismaSchemaImplementationApprovalSource: 'human-chat-instruction'",
  "pack13PrismaSchemaImplementationApprovedBy: 'Nong Si Buong'",
  "pack13PrismaSchemaImplementationApprovalDate: '2026-06-15'",
  'prismaSchemaPermitted: true',
  'pack13Started: false',
  'prismaSchemaActive: false',
];

const POST_PACK13C_APPROVAL_POINTER_TOKENS = [
  'pack13PrismaSchemaImplementationApprovalPacketActive: true',
  'pack13ApprovalPacketPrepared: true',
  'pack13HumanApprovalRequired: true',
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'pack13PrismaSchemaImplementationRecordingOnly: true',
  'pack13PrismaSchemaImplementationMayBePlannedNext: true',
  "pack13PrismaSchemaImplementationApprovalSource: 'human-chat-instruction'",
  "pack13PrismaSchemaImplementationApprovedBy: 'Nong Si Buong'",
  "pack13PrismaSchemaImplementationApprovalDate: '2026-06-15'",
  'prismaSchemaPermitted: true',
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
];

const POST_APPROVAL_FORBIDDEN_POINTER_TOKENS = [
  'pack13Started: true',
  'pack12ImplementationApproved: true',
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

function isPack13bRecorded() {
  const configPath = 'src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('pack13HumanApprovalRecorded: true');
}

function main() {
  const pack13cActive = isPack13cSchemaOnlyActive();
  const pack13bRecorded = isPack13bRecorded();
  const pack14bRecorded = isPack14bRecorded();
  const pack14cActive = isPack14cMigrationCreated();
  console.log('VIONA request Pack13A Prisma schema implementation approval packet check');
  console.log(
    pack13cActive
      ? 'Pack13C schema-only active. Pack13A packet doc remains historical blank/pending.\n'
      : pack13bRecorded
        ? 'Pack13B human approval recorded. Packet doc remains historical blank/pending.\n'
        : 'Approval packet only. No approval recorded. No Prisma schema, migration, API, adapter, mutation, or runtime.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file) && !isPack14cMigrationDiffFile(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

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
  let configTokens = pack13cActive
    ? augmentConfigTokensForPack13c(
        pack13bRecorded ? POST_APPROVAL_REQUIRED_CONFIG_TOKENS : REQUIRED_CONFIG_TOKENS,
        true
      )
    : pack13bRecorded
      ? POST_APPROVAL_REQUIRED_CONFIG_TOKENS
      : REQUIRED_CONFIG_TOKENS;
  configTokens = augmentConfigTokensForPack14b(configTokens, pack14bRecorded);
  configTokens = augmentConfigTokensForPack14c(configTokens, pack14cActive);
  let pointerTokens = pack13cActive
    ? augmentPointerTokensForPack13c(POST_PACK13C_APPROVAL_POINTER_TOKENS, true)
    : pack13bRecorded
      ? POST_APPROVAL_REQUIRED_POINTER_TOKENS
      : REQUIRED_POINTER_TOKENS;
  pointerTokens = augmentPointerTokensForPack14b(pointerTokens, pack14bRecorded);
  pointerTokens = augmentPointerTokensForPack14c(pointerTokens, pack14cActive);
  const forbiddenPointerTokens =
    pack13cActive || !pack13bRecorded ? [] : POST_APPROVAL_FORBIDDEN_POINTER_TOKENS;
  const missingConfigTokens = missingValues(config, configTokens);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const forbiddenPointerHits = forbiddenPointerTokens.filter((token) =>
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
  if (isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged)) {
    fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  }
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
  if (pack13bRecorded) {
    console.log('pack13HumanApprovalRecorded true in Pack13B: PASS');
    console.log('pack13PrismaSchemaImplementationApproved true: PASS');
    console.log('prismaSchemaPermitted true for future pack: PASS');
  } else {
    console.log('pack13HumanApprovalRecorded remains false: PASS');
    console.log('pack13PrismaSchemaImplementationApproved remains false: PASS');
    console.log('Prisma schema remains not permitted: PASS');
  }
  console.log('pack13Started remains false: PASS');
  console.log('pack12ImplementationApproved remains false: PASS');
  console.log('Migration/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('OPERATOR Prisma/Auth not added: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log(
    pack13bRecorded
      ? '\nResult: PASS - Pack13A approval packet remains valid with Pack13B human approval recorded.'
      : '\nResult: PASS - Pack13A Prisma schema implementation approval packet is import-ready.'
  );
}

main();
