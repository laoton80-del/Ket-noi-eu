#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PACK14D_BRANCH_ALLOWED_FILES } from './lib/vionaPackDiffAllowlist.mjs';

const ROOT = process.cwd();

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


const PACK14A_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14A_PRISMA_MIGRATION_READINESS_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts',
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'docs/design/evidence/cursor-request-pack14a-prisma-migration-readiness-approval-packet/README.md',
];

const PACK13C_CORE_FILES = [
  'prisma/schema.prisma',
  'docs/product/VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_SCHEMA_ONLY.md',
  'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts',
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'docs/design/evidence/cursor-request-pack13c-prisma-schema-implementation-schema-only/README.md',
];

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
  'src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts',
  'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts',
  'src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts',
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
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'scripts/viona-request-pack13-prisma-schema-implementation-human-approval-recording-check.mjs',
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
];

const ALLOWED_FILES = [
  ...PACK14D_BRANCH_ALLOWED_FILES,
  ...PACK14B_CORE_FILES,
  ...PACK14C_CORE_FILES,
  ...PACK14A_CORE_FILES,
  ...PACK13C_CORE_FILES,
  ...PACK13B_CORE_FILES,
  ...PACK13A_CORE_FILES,
  ...PACK12_CORE_FILES,
  ...POINTER_CONFIG_FILES,
  ...GATE_SCRIPT_FILES,
];

const REQUIRED_FILES = PACK14B_CORE_FILES;

const REQUIRED_DOC_PHRASES = [
  'origin/master @ 1a9fe01',
  'human chat instruction',
  'APPROVED Pack14 Prisma migration approval recording.',
  'Nong Si Buong',
  'Founder / Executive Sponsor + Acting Principal Architect',
  '2026-06-15',
  'APPROVED',
  'Pack14A',
  'approval packet',
  'pending',
  'Pack14B records approval only',
  'recording-only',
  'does not create migration',
  'does not run `prisma migrate`',
  'does not run `prisma db push`',
  'does not apply DB changes',
  'does not edit `prisma/schema.prisma`',
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
  'Pack14C',
  'migration-creation-only',
  'migration files only',
  'DB apply remains separately blocked',
  'Dedicated VIONA Request Store',
  'LocalServiceRequest direct reuse',
  'Audit log is not a payment ledger',
  'Admin Debug remains fixture-only',
  'OPERATOR is still not Prisma/Auth',
  'read-only API',
  'persistence adapter',
  'request mutation',
  'Admin Debug live data',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK14_PRISMA_MIGRATION_HUMAN_APPROVAL_READINESS',
  'export const VIONA_REQUEST_PACK14_PRISMA_MIGRATION_HUMAN_APPROVAL_CHECKLIST',
  'export function getVionaRequestPack14PrismaMigrationHumanApprovalReadiness',
  'export function isVionaRequestPack14PrismaMigrationHumanApprovalReadyForMigrationPlanning',
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'pack14PrismaMigrationApprovalRecordingOnly: true',
  'pack14MigrationCreationMayBePlannedNext: true',
  "pack14PrismaMigrationApprovalSource: 'human-chat-instruction'",
  "pack14PrismaMigrationApprovedBy: 'Nong Si Buong'",
  "pack14PrismaMigrationApproverRole: 'Founder / Executive Sponsor + Acting Principal Architect'",
  "pack14PrismaMigrationApprovalDate: '2026-06-15'",
  "pack14PrismaMigrationApprovalDecision: 'approved'",
  'prismaMigrationPermitted: true',
  'pack14MigrationReadinessApprovalPacketActive: true',
  'pack14MigrationApprovalPacketPrepared: true',
  'pack14HumanApprovalRequired: true',
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'prismaMigrationActive: false',
  'migrationCreated: false',
  'dbApplied: false',
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
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'pack14PrismaMigrationApprovalRecordingOnly: true',
  'pack14MigrationCreationMayBePlannedNext: true',
  "pack14PrismaMigrationApprovalSource: 'human-chat-instruction'",
  "pack14PrismaMigrationApprovedBy: 'Nong Si Buong'",
  "pack14PrismaMigrationApprovalDate: '2026-06-15'",
  'prismaMigrationPermitted: true',
  'prismaMigrationActive: false',
  'migrationCreated: false',
  'dbApplied: false',
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
        if (claim === 'live merchant execution' && normalized.includes('not authorize')) continue;
        hits.push(`${relPath}: ${claim} (${line.trim()})`);
      }
    }
  }
  return [...new Set(hits)];
}

function main() {
  const pack14cActive = isPack14cMigrationCreated();
  console.log('VIONA request Pack14B Prisma migration human approval recording check');
  console.log('Recording-only pack. Human approval recorded. No migration, DB apply, API, adapter, mutation, or runtime.\n');

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file) && !isPack14cMigrationDiffFile(file));
  const forbiddenFiles = changedFiles.filter(
    (file) =>
      !isPack14cMigrationDiffFile(file) &&
      FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const approvalDoc = read('docs/product/VIONA_REQUEST_PACK14B_PRISMA_MIGRATION_HUMAN_APPROVAL_RECORD.md');
  const approvalConfig = read('src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts');
  const pack14a = read('src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts');
  const pack13c = read('src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts');
  const pack13b = read('src/config/vionaRequestPack13PrismaSchemaImplementationHumanApprovalReadiness.ts');
  const pack13a = read('src/config/vionaRequestPack13PrismaSchemaImplementationApprovalPacketReadiness.ts');
  const pack12 = read('src/config/vionaRequestPack12PrismaSchemaReadinessBoundary.ts');
  const schemaApproval = read('src/config/vionaRequestSchemaDesignHumanApprovalReadiness.ts');
  const dedicated = read('src/config/vionaRequestDedicatedStoreSchemaDesignReadiness.ts');
  const human = read('src/config/vionaRequestSotHumanApprovalReadiness.ts');
  const pack9 = read('src/config/vionaRequestSotSignoffPhasePromotionReadiness.ts');
  const pack8 = read('src/config/vionaRequestSourceOfTruthAuthTenantReadiness.ts');
  const persistence = read('src/config/vionaRequestPersistenceAuditReadiness.ts');
  const operator = read('src/config/vionaOperatorInboxAdminReadiness.ts');
  const pointerCombined = `${pack14a}\n${pack13c}\n${pack13b}\n${pack13a}\n${pack12}\n${schemaApproval}\n${dedicated}\n${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master..HEAD -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master..HEAD -- prisma/');
  const migrationsChanged = run('git diff --name-only origin/master..HEAD -- prisma/migrations/');
  const serverChanged = run('git diff --name-only origin/master..HEAD -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master..HEAD -- src/domain/requests/vionaRequestTypes.ts');

  const missingDocPhrases = missingValues(approvalDoc, REQUIRED_DOC_PHRASES);
  let configTokens = augmentConfigTokensForPack14c(REQUIRED_CONFIG_TOKENS, pack14cActive);
  const missingConfigTokens = missingValues(approvalConfig, configTokens);
  let pointerTokens = augmentPointerTokensForPack14c(REQUIRED_POINTER_TOKENS, pack14cActive);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PACK14B_PRISMA_MIGRATION_HUMAN_APPROVAL_RECORD.md',
    'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => approvalConfig.includes(token));

  const humanApprovalRecorded = approvalConfig.includes('pack14HumanApprovalRecorded: true');
  const migrationApproved = approvalConfig.includes('pack14PrismaMigrationApproved: true');
  const migrationPermitted = approvalConfig.includes('prismaMigrationPermitted: true');
  const migrationActive = approvalConfig.includes('prismaMigrationActive: true');
  const migrationCreated = approvalConfig.includes('migrationCreated: true');
  const dbApplied = approvalConfig.includes('dbApplied: true');
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

  if (missingFiles.length) fail('missing required Pack14B files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected changed files (scope drift)', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden changed files', forbiddenFiles);
  if (appChanged) fail('App.tsx must not change', [appChanged]);
  if (prismaChanged && !pack14cActive) fail('prisma/ must not change in Pack14B', prismaChanged.split('\n'));
  if (migrationsChanged && !pack14cActive) fail('prisma/migrations/ must not be added in Pack14B', migrationsChanged.split('\n'));
  if (serverChanged) fail('src/server.ts must not change', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts must not change', [typesChanged]);
  if (missingDocPhrases.length) fail('approval record doc missing required phrases', missingDocPhrases);
  if (missingConfigTokens.length) fail('readiness config missing required tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('pointer configs missing Pack14B tokens', missingPointerTokens);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('readiness config has forbidden runtime imports', forbiddenImports);
  if (!humanApprovalRecorded) fail('pack14HumanApprovalRecorded must be true', ['pack14HumanApprovalRecorded: false']);
  if (!migrationApproved) fail('pack14PrismaMigrationApproved must be true', ['pack14PrismaMigrationApproved: false']);
  if (!migrationPermitted) fail('prismaMigrationPermitted must be true for future Pack14C', ['prismaMigrationPermitted: false']);
  if (migrationActive && !pack14cActive) fail('prismaMigrationActive must remain false', ['prismaMigrationActive: true']);
  if (migrationCreated && !pack14cActive) fail('migrationCreated must remain false', ['migrationCreated: true']);
  if (dbApplied) fail('dbApplied must remain false', ['dbApplied: true']);
  if (apiPermitted) fail('API/adapter must remain unauthorized', ['API/adapter permitted']);
  if (mutationPermitted) fail('mutation must remain unauthorized', ['requestMutationPermitted: true']);
  if (apiActive) fail('API/adapter must remain inactive', ['persistence API/adapter active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);
  if (liveRuntime) fail('live runtime must remain blocked', ['payment/booking/SOS/wallet/live AI active']);

  if (!process.exitCode) {
    console.log('PASS Pack14B Prisma migration human approval recording check');
    console.log('  - Pack14B files present; scope limited to allowed files');
    console.log('  - human approval recorded; prismaMigrationPermitted true for future Pack14C');
    console.log('  - no migration created; no DB apply; API/adapter/mutation/live remain blocked');
  }
}

main();
