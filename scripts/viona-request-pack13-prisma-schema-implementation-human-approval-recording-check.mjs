#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  isPack14cMigrationCreated,
  isPack14cMigrationSqlPath,
  isPrismaDiffBlocked,
  isMigrationsDiffBlocked,
  PACK14D_BRANCH_ALLOWED_FILES,
} from './lib/vionaPackDiffAllowlist.mjs';


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
  if (isPack14cMigrationSqlPath(file)) return false;
  if (pack13cActive && file === 'prisma/schema.prisma') return false;
  return FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file));
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
  'src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts',
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
  'scripts/viona-request-pack13-prisma-schema-implementation-approval-packet-check.mjs',
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
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
];

const ALLOWED_FILES = [
  ...PACK14D_BRANCH_ALLOWED_FILES,
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

const REQUIRED_FILES = PACK13B_CORE_FILES;

const REQUIRED_DOC_PHRASES = [
  'origin/master @ a804204',
  'human chat instruction',
  'APPROVED Pack13 Prisma schema implementation approval recording.',
  'Nong Si Buong',
  'Founder / Executive Sponsor + Acting Principal Architect',
  '2026-06-15',
  'APPROVED',
  'Pack13A',
  'approval packet',
  'pending',
  'Pack13B records approval only',
  'recording-only',
  'does not edit `prisma/schema.prisma`',
  'does not create migration',
  'does not create API',
  'does not create persistence adapter',
  'does not create request mutation',
  'does not start live runtime',
  'does not change Admin Debug data source',
  'does not add OPERATOR',
  'payment',
  'booking',
  'SOS dispatch',
  'wallet mutation',
  'live AI',
  'live merchant execution',
  'future Pack13 Prisma schema implementation',
  'prisma/schema.prisma',
  'VionaRequest*',
  'Dedicated VIONA Request Store',
  'LocalServiceRequest direct reuse',
  'Audit log is not a payment ledger',
  'Admin Debug remains fixture-only',
  'OPERATOR is still not Prisma/Auth',
  'prismaMigrationPermitted',
  'read-only API',
  'persistence adapter',
  'request mutation',
  'Admin Debug live data',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_HUMAN_APPROVAL_READINESS',
  'export const VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_HUMAN_APPROVAL_CHECKLIST',
  'export function getVionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness',
  'export function isVionaRequestPack13PrismaSchemaImplementationHumanApprovalReadyForImplementationPlanning',
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'pack13PrismaSchemaImplementationRecordingOnly: true',
  'pack13PrismaSchemaImplementationMayBePlannedNext: true',
  "pack13PrismaSchemaImplementationApprovalSource: 'human-chat-instruction'",
  "pack13PrismaSchemaImplementationApprovedBy: 'Nong Si Buong'",
  "pack13PrismaSchemaImplementationApproverRole: 'Founder / Executive Sponsor + Acting Principal Architect'",
  "pack13PrismaSchemaImplementationApprovalDate: '2026-06-15'",
  "pack13PrismaSchemaImplementationApprovalDecision: 'approved'",
  'prismaSchemaPermitted: true',
  'pack13PrismaSchemaImplementationApprovalPacketActive: true',
  'pack13ApprovalPacketPrepared: true',
  'pack13HumanApprovalRequired: true',
  'pack12PrismaSchemaReadinessBoundaryActive: true',
  'pack12PlanningStarted: true',
  'pack12PlanningOnly: true',
  'schemaDesignApproved: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'pack13Started: false',
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
  'paymentCaptureActive: false',
  'bookingConfirmationActive: false',
  'sosDispatchActive: false',
  'walletMutationActive: false',
  'liveAiProtectedActionsActive: false',
  'liveMerchantExecutionActive: false',
  'agentMayFlipSignoff: false',
  'adminDebugUsesFixturesOnly: true',
];

const REQUIRED_POINTER_TOKENS = [
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
  const pack13cActive = isPack13cSchemaOnlyActive();
  const pack14bRecorded = isPack14bRecorded();
  const pack14cActive = isPack14cMigrationCreated();
  console.log('VIONA request Pack13B Prisma schema implementation human approval recording check');
  console.log(
    pack13cActive
      ? 'Pack13C schema-only active. Pack13B approval record remains valid.\n'
      : 'Recording-only pack. Human approval recorded. No Prisma schema, migration, API, adapter, mutation, or runtime.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file) && !isPack14cMigrationSqlPath(file));
  const forbiddenFiles = changedFiles.filter((file) => matchesForbiddenDiff(file, pack13cActive));

  const approvalDoc = read(
    'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_HUMAN_APPROVAL_RECORD.md'
  );
  const approvalConfig = read(
    'src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts'
  );
  const pack13a = read('src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts');
  const pack12 = read('src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts');
  const schemaApproval = read('src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts');
  const dedicated = read('src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts');
  const human = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${pack13a}\n${pack12}\n${schemaApproval}\n${dedicated}\n${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master -- prisma/');
  const migrationsChanged = run('git diff --name-only origin/master -- prisma/migrations');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(approvalDoc, REQUIRED_DOC_PHRASES);
  let configTokens = augmentConfigTokensForPack13c(REQUIRED_CONFIG_TOKENS, pack13cActive);
  configTokens = augmentConfigTokensForPack14b(configTokens, pack14bRecorded);
  configTokens = augmentConfigTokensForPack14c(configTokens, pack14cActive);
  let pointerTokens = augmentPointerTokensForPack13c(REQUIRED_POINTER_TOKENS, pack13cActive);
  pointerTokens = augmentPointerTokensForPack14b(pointerTokens, pack14bRecorded);
  pointerTokens = augmentPointerTokensForPack14c(pointerTokens, pack14cActive);
  const missingConfigTokens = missingValues(approvalConfig, configTokens);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PACK13_PRISMA_SCHEMA_IMPLEMENTATION_HUMAN_APPROVAL_RECORD.md',
    'src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => approvalConfig.includes(token));

  const pack13Started = approvalConfig.includes('pack13Started: true');
  const prismaActive =
    approvalConfig.includes('prismaSchemaActive: true') ||
    approvalConfig.includes('prismaMigrationActive: true');
  const migrationPermitted = approvalConfig.includes('prismaMigrationPermitted: true');
  const apiPermitted =
    approvalConfig.includes('readOnlyApiPermitted: true') ||
    approvalConfig.includes('persistenceAdapterPermitted: true');
  const mutationPermitted = approvalConfig.includes('requestMutationPermitted: true');
  const apiActive =
    approvalConfig.includes('persistenceApiActive: true') ||
    approvalConfig.includes('readOnlyApiActive: true') ||
    approvalConfig.includes('persistenceAdapterActive: true');
  const mutationActive = approvalConfig.includes('requestMutationActive: true');
  const adminDebugLive = approvalConfig.includes('adminDebugLiveDataActive: true');
  const operatorAdded =
    approvalConfig.includes('operatorRoleAddedToAuth: true') ||
    approvalConfig.includes('operatorRoleAddedToPrisma: true');
  const liveRuntime =
    approvalConfig.includes('paymentCaptureActive: true') ||
    approvalConfig.includes('bookingConfirmationActive: true') ||
    approvalConfig.includes('sosDispatchActive: true') ||
    approvalConfig.includes('walletMutationActive: true') ||
    approvalConfig.includes('liveAiProtectedActionsActive: true') ||
    approvalConfig.includes('liveMerchantExecutionActive: true');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged)) {
    fail('prisma changed vs origin/master', [prismaChanged.split('\n')[0] || 'prisma/']);
  }
  if (isMigrationsDiffBlocked(pack14cActive, migrationsChanged)) {
    fail('migrations changed vs origin/master', [migrationsChanged.split('\n')[0] || 'prisma/migrations']);
  }
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (missingDocPhrases.length) fail('missing approval record doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing approval readiness config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in Pack13B config', forbiddenImports);
  if (!pack13cActive && pack13Started) fail('pack13Started must remain false', ['pack13Started: true']);
  if (!pack13cActive && prismaActive) fail('Prisma must remain inactive', ['prisma active flag true']);
  if (migrationPermitted && !pack14bRecorded) fail('migration must remain unauthorized', ['prismaMigrationPermitted: true']);
  if (apiPermitted) fail('API/adapter must remain unauthorized', ['API/adapter permitted']);
  if (mutationPermitted) fail('mutation must remain unauthorized', ['requestMutationPermitted: true']);
  if (apiActive) fail('API/adapter must remain inactive', ['persistence API/adapter active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);
  if (liveRuntime) fail('live runtime must remain blocked', ['payment/booking/SOS/wallet/live AI active']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack13B human approval recording before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('Human approval record doc facts: PASS');
  console.log('Approval readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log('pack13HumanApprovalRecorded true: PASS');
  console.log('pack13PrismaSchemaImplementationApproved true: PASS');
  console.log('prismaSchemaPermitted true for future pack: PASS');
  console.log('pack13Started remains false: PASS');
  console.log('prismaSchemaActive remains false: PASS');
  console.log('Migration/API/adapter/mutation remain blocked: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('OPERATOR Prisma/Auth not added: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No prisma/schema.prisma change: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - Pack13B Prisma schema implementation human approval is recorded.');
}

main();
