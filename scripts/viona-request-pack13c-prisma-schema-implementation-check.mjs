#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PACK14D_BRANCH_ALLOWED_FILES } from './lib/vionaPackDiffAllowlist.mjs';

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
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
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

function isPack13cSchemaOnlyActive() {
  const configPath = 'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts';
  if (!existsSync(path.join(ROOT, configPath))) return false;
  return read(configPath).includes('pack13SchemaOnlyImplementation: true');
}

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
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
  'scripts/viona-request-pack14c-prisma-migration-creation-check.mjs',
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

const REQUIRED_FILES = PACK13C_CORE_FILES;

const REQUIRED_PRISMA_MODELS = [
  'model VionaRequest {',
  'model VionaRequestParticipant {',
  'model VionaRequestSourceLink {',
  'model VionaRequestStatusEvent {',
  'model VionaRequestAuditEvent {',
  'model VionaRequestAttachmentReference {',
];

const FORBIDDEN_SCHEMA_FIELD_TOKENS = [
  'paymentConfirmed',
  'bookingConfirmed',
  'sosDispatched',
  'walletSettled',
  'payoutConfirmed',
  'settlementConfirmed',
  'liveAiExecuted',
  'LocalServiceRequest',
];

const FORBIDDEN_OPERATOR_TOKENS = ['OPERATOR', 'operatorRoleAddedToAuth', 'operatorRoleAddedToPrisma'];

const REQUIRED_DOC_PHRASES = [
  'origin/master @ 3f4625f',
  'Pack13C implements Prisma schema only',
  'Pack13B human approval',
  'prisma/schema.prisma',
  'no migration',
  'no DB apply',
  'no API',
  'no adapter',
  'no mutation',
  'Admin Debug remains fixture-only',
  'OPERATOR is still not Prisma/Auth',
  'Dedicated VIONA Request Store',
  'LocalServiceRequest direct reuse',
  'Audit log is not a payment ledger',
  'VionaRequest',
  'VionaRequestParticipant',
  'VionaRequestSourceLink',
  'VionaRequestStatusEvent',
  'VionaRequestAuditEvent',
  'VionaRequestAttachmentReference',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_READINESS',
  'export const VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_CHECKLIST',
  'export function getVionaRequestPack13CPrismaSchemaImplementationReadiness',
  'export function isVionaRequestPack13CPrismaSchemaImplementationReadyForReview',
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'prismaSchemaPermitted: true',
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
  'migrationCreated: false',
  'dbApplied: false',
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
  'prismaSchemaPermitted: true',
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
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
  /^prisma\/migrations\//,
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
  console.log('VIONA request Pack13C Prisma schema implementation check (schema only)');
  console.log(
    pack14cActive
      ? 'Pack14C migration files created. Pack13C schema-only state remains valid.\n'
      : pack14bRecorded
        ? 'Pack14B migration approval recorded. Pack13C schema-only state remains valid.\n'
        : 'Schema-only pack. Prisma models in schema.prisma. No migration, API, adapter, mutation, or runtime.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter(
    (file) => !ALLOWED_FILES.includes(file) && !isPack14cMigrationDiffFile(file)
  );
  const forbiddenFiles = changedFiles.filter(
    (file) =>
      !isPack14cMigrationDiffFile(file) &&
      FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const schema = read('prisma/schema.prisma');
  const implDoc = read('docs/product/VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_SCHEMA_ONLY.md');
  const config = read('src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts');
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
  const pointerCombined = `${pack13b}\n${pack13a}\n${pack12}\n${schemaApproval}\n${dedicated}\n${human}\n${pack9}\n${pack8}\n${persistence}\n${operator}`;

  const appChanged = run('git diff --name-only origin/master -- App.tsx');
  const migrationsChanged = run('git diff --name-only origin/master -- prisma/migrations');
  const serverChanged = run('git diff --name-only origin/master -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master -- src/domain/requests/vionaRequestTypes.ts');
  const schemaChanged = run('git diff --name-only origin/master -- prisma/schema.prisma');

  const missingDocPhrases = missingValues(implDoc, REQUIRED_DOC_PHRASES);
  let configTokens = augmentConfigTokensForPack14b(REQUIRED_CONFIG_TOKENS, pack14bRecorded);
  configTokens = augmentConfigTokensForPack14c(configTokens, pack14cActive);
  let pointerTokens = augmentPointerTokensForPack14b(REQUIRED_POINTER_TOKENS, pack14bRecorded);
  pointerTokens = augmentPointerTokensForPack14c(pointerTokens, pack14cActive);
  const missingConfigTokens = missingValues(config, configTokens);
  const missingPointerTokens = missingValues(pointerCombined, pointerTokens);
  const missingModels = missingValues(schema, REQUIRED_PRISMA_MODELS);
  const forbiddenSchemaFields = FORBIDDEN_SCHEMA_FIELD_TOKENS.filter((token) => {
    const vionaSection = schema.split('VIONA Request Engine')[1] || '';
    return vionaSection.includes(token);
  });
  const operatorInRoleEnum = schema.includes('enum Role {') && /\bOPERATOR\b/.test(schema.split('enum Role {')[1]?.split('}')[0] || '');
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_SCHEMA_ONLY.md',
    'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => config.includes(token));

  const migrationCreated = existsSync(path.join(ROOT, 'prisma/migrations')) &&
    run('git diff --name-only origin/master -- prisma/migrations').length > 0;
  const migrationPermitted = config.includes('prismaMigrationPermitted: true');
  const apiPermitted =
    config.includes('readOnlyApiPermitted: true') ||
    config.includes('persistenceAdapterPermitted: true');
  const mutationPermitted = config.includes('requestMutationPermitted: true');
  const apiActive =
    config.includes('persistenceApiActive: true') ||
    config.includes('readOnlyApiActive: true') ||
    config.includes('persistenceAdapterActive: true');
  const mutationActive = config.includes('requestMutationActive: true');
  const adminDebugLive = config.includes('adminDebugLiveDataActive: true');
  const operatorAdded =
    config.includes('operatorRoleAddedToAuth: true') ||
    config.includes('operatorRoleAddedToPrisma: true');
  const liveRuntime =
    config.includes('paymentCaptureActive: true') ||
    config.includes('bookingConfirmationActive: true') ||
    config.includes('sosDispatchActive: true') ||
    config.includes('walletMutationActive: true') ||
    config.includes('liveAiProtectedActionsActive: true') ||
    config.includes('liveMerchantExecutionActive: true');

  if (missingFiles.length) fail('missing required files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected files changed', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden paths changed', forbiddenFiles);
  if (appChanged) fail('App.tsx changed vs origin/master', [appChanged]);
  if (migrationsChanged && !pack14cActive) {
    fail('prisma/migrations changed vs origin/master', [migrationsChanged.split('\n')[0] || 'prisma/migrations']);
  }
  if (serverChanged) fail('src/server.ts changed vs origin/master', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts changed vs origin/master', [typesChanged]);
  if (!schemaChanged && !pack13cActive) fail('prisma/schema.prisma must change in Pack13C', ['no schema diff']);
  if (missingDocPhrases.length) fail('missing implementation doc requirements', missingDocPhrases);
  if (missingConfigTokens.length) fail('missing readiness config tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('missing pointer config tokens', missingPointerTokens);
  if (missingModels.length) fail('missing required Prisma models', missingModels);
  if (forbiddenSchemaFields.length) fail('forbidden truth fields in VIONA schema section', forbiddenSchemaFields);
  if (operatorInRoleEnum) fail('OPERATOR must not be added to Role enum', ['OPERATOR in Role enum']);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('forbidden runtime imports in Pack13C config', forbiddenImports);
  if (migrationCreated && !pack14cActive) fail('migration files must not be created', ['prisma/migrations changed']);
  if (migrationPermitted && !pack14bRecorded) fail('migration must remain unauthorized', ['prismaMigrationPermitted: true']);
  if (apiPermitted) fail('API/adapter must remain unauthorized', ['API/adapter permitted']);
  if (mutationPermitted) fail('mutation must remain unauthorized', ['requestMutationPermitted: true']);
  if (apiActive) fail('API/adapter must remain inactive', ['persistence API/adapter active']);
  if (mutationActive) fail('mutation must remain inactive', ['requestMutationActive: true']);
  if (adminDebugLive) fail('Admin Debug must remain fixture-only', ['adminDebugLiveDataActive: true']);
  if (operatorAdded) fail('OPERATOR must not be added', ['operator role added']);
  if (liveRuntime) fail('live runtime must remain blocked', ['payment/booking/SOS/wallet/live AI active']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack13C Prisma schema implementation before import.');
    return;
  }

  console.log(`Required files: PASS (${REQUIRED_FILES.length})`);
  console.log(`Changed file scope: PASS (${changedFiles.length || ALLOWED_FILES.length} allowed files)`);
  console.log('prisma/schema.prisma changed: PASS');
  console.log('All six VionaRequest* models present: PASS');
  console.log('No forbidden truth fields: PASS');
  console.log('No OPERATOR Prisma/Auth role: PASS');
  console.log('Implementation doc: PASS');
  console.log('Readiness config: PASS');
  console.log('Pointer configs updated: PASS');
  console.log('pack13Started true: PASS');
  console.log('pack13SchemaOnlyImplementation true: PASS');
  console.log('prismaSchemaActive true: PASS');
  console.log('No migration/API/adapter/mutation/live runtime: PASS');
  console.log('Admin Debug fixture-only: PASS');
  console.log('No forbidden runtime paths: PASS');
  console.log('No unsafe standalone claims: PASS');
  console.log('\nResult: PASS - Pack13C Prisma schema implementation (schema only) is import-ready.');
}

main();
