#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

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
  ...PACK14A_CORE_FILES,
  ...PACK13C_CORE_FILES,
  ...PACK13B_CORE_FILES,
  ...PACK13A_CORE_FILES,
  ...PACK12_CORE_FILES,
  ...POINTER_CONFIG_FILES,
  ...GATE_SCRIPT_FILES,
];

const REQUIRED_FILES = PACK14A_CORE_FILES;

const REQUIRED_PRISMA_MODELS = [
  'model VionaRequest {',
  'model VionaRequestParticipant {',
  'model VionaRequestSourceLink {',
  'model VionaRequestStatusEvent {',
  'model VionaRequestAuditEvent {',
  'model VionaRequestAttachmentReference {',
];

const REQUIRED_DOC_PHRASES = [
  'origin/master @ 4a1aa03',
  'Pack13C completed',
  'Six approved `VionaRequest*` models',
  'migration readiness and a human approval packet only',
  'does **not** create migration',
  'does **not** apply DB changes',
  'does **not** create API',
  'does **not** wire Admin Debug live data',
  'does **not** add OPERATOR Prisma/Auth role',
  'Cursor/agent must not fill approval fields',
  'Cursor/agent must not silently set migration approval flags',
  'does **not** unlock migration',
  'does **not** unlock DB apply',
  'does **not** unlock API/adapter/mutation/runtime',
  'Status: PENDING',
  'APPROVED',
  'REJECTED',
  'NEEDS REVISION',
  'Name** | *(blank',
  'Pack14B',
  'Pack14C',
  'Verify Prisma schema validates',
  'Verify target DB environment is explicit',
  'Verify migration can be generated without applying DB changes',
  'Verify rollback/backup strategy',
  'Verify staging/prod separation',
  'Verify no payment/booking/SOS/wallet truth',
  'Verify Admin Debug remains fixture-only',
  'Verify OPERATOR remains not Prisma/Auth role',
  'Dedicated VIONA Request Store',
  'LocalServiceRequest direct reuse',
  'Audit log is not a payment ledger',
  'pack14HumanApprovalRecorded` | `false`',
  'prismaMigrationPermitted` | `false`',
  'migrationCreated` | `false`',
  'dbApplied` | `false`',
  'Admin Debug remains fixture-only',
  'OPERATOR is still not Prisma/Auth',
  'No merchant live execution authorized',
];

const FORBIDDEN_DOC_PHRASES = [
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'prismaMigrationPermitted: true',
  'Final decision** | **APPROVED**',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK14_PRISMA_MIGRATION_READINESS_APPROVAL_PACKET',
  'export const VIONA_REQUEST_PACK14_PRISMA_MIGRATION_READINESS_APPROVAL_CHECKLIST',
  'export function getVionaRequestPack14PrismaMigrationReadinessApprovalPacket',
  'export function isVionaRequestPack14PrismaMigrationReadyForHumanReview',
  'pack14MigrationReadinessApprovalPacketActive: true',
  'pack14MigrationApprovalPacketPrepared: true',
  'pack14HumanApprovalRequired: true',
  'pack14MigrationPlanningReadyForHumanReview: true',
  'pack13Started: true',
  'pack13SchemaOnlyImplementation: true',
  'prismaSchemaActive: true',
  'vionaRequestPrismaModelsAdded: true',
  'pack13HumanApprovalRecorded: true',
  'pack13PrismaSchemaImplementationApproved: true',
  'prismaSchemaPermitted: true',
  "selectedSourceOfTruthOptionId: 'dedicatedVionaRequestStore'",
  'pack14HumanApprovalRecorded: false',
  'pack14PrismaMigrationApproved: false',
  'prismaMigrationPermitted: false',
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
  'pack14MigrationReadinessApprovalPacketActive: true',
  'pack14MigrationApprovalPacketPrepared: true',
  'pack14HumanApprovalRequired: true',
  'pack14MigrationPlanningReadyForHumanReview: true',
  'pack14HumanApprovalRecorded: false',
  'pack14PrismaMigrationApproved: false',
];

const FORBIDDEN_POINTER_TOKENS = [
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'prismaMigrationPermitted: true',
  'prismaMigrationActive: true',
  'migrationCreated: true',
  'dbApplied: true',
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
        if (claim === 'live merchant execution' && normalized.includes('no merchant live execution')) continue;
        hits.push(`${relPath}: ${claim} (${line.trim()})`);
      }
    }
  }
  return [...new Set(hits)];
}

function main() {
  console.log('VIONA request Pack14A Prisma migration readiness approval packet check');
  console.log(
    'Migration readiness / approval packet only. No migration, DB apply, API, adapter, mutation, or runtime.\n'
  );

  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !ALLOWED_FILES.includes(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const packetDoc = read(
    'docs/product/VIONA_REQUEST_PACK14A_PRISMA_MIGRATION_READINESS_APPROVAL_PACKET.md'
  );
  const config = read('src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts');
  const schemaPath = 'prisma/schema.prisma';
  const schemaContent = existsSync(path.join(ROOT, schemaPath)) ? read(schemaPath) : '';
  const missingPrismaModels = missingValues(schemaContent, REQUIRED_PRISMA_MODELS);

  const pointerCombined = POINTER_CONFIG_FILES.map((file) => read(file)).join('\n');

  const appChanged = run('git diff --name-only origin/master..HEAD -- App.tsx');
  const prismaChanged = run('git diff --name-only origin/master..HEAD -- prisma/');
  const serverChanged = run('git diff --name-only origin/master..HEAD -- src/server.ts');
  const typesChanged = run(
    'git diff --name-only origin/master..HEAD -- src/domain/requests/vionaRequestTypes.ts'
  );
  const migrationsAdded = run('git diff --name-only origin/master..HEAD -- prisma/migrations/');

  const missingDocPhrases = missingValues(packetDoc, REQUIRED_DOC_PHRASES);
  const forbiddenDocPhrases = FORBIDDEN_DOC_PHRASES.filter((phrase) => packetDoc.includes(phrase));
  const missingConfigTokens = missingValues(config, REQUIRED_CONFIG_TOKENS);
  const missingPointerTokens = missingValues(pointerCombined, REQUIRED_POINTER_TOKENS);
  const forbiddenPointerHits = FORBIDDEN_POINTER_TOKENS.filter((token) =>
    pointerCombined.includes(token)
  );

  const configRuntimeImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => config.includes(token));
  const unsafeClaims = findUnsafeStandaloneClaims(
    PACK14A_CORE_FILES.filter((file) => file.endsWith('.md') || file.endsWith('.ts'))
  );

  if (missingFiles.length) fail('missing required Pack14A files', missingFiles);
  if (unexpectedFiles.length) fail('unexpected changed files (scope drift)', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden changed files', forbiddenFiles);
  if (prismaChanged) fail('prisma/ must not change in Pack14A', prismaChanged.split('\n'));
  if (migrationsAdded) fail('prisma/migrations/ must not be added in Pack14A', migrationsAdded.split('\n'));
  if (missingPrismaModels.length)
    fail('six VionaRequest* models must exist on master (grep schema.prisma)', missingPrismaModels);
  if (missingDocPhrases.length) fail('product doc missing required phrases', missingDocPhrases);
  if (forbiddenDocPhrases.length) fail('product doc has forbidden approval phrases', forbiddenDocPhrases);
  if (missingConfigTokens.length) fail('readiness config missing required tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('pointer configs missing Pack14A tokens', missingPointerTokens);
  if (forbiddenPointerHits.length)
    fail('pointer configs contain forbidden migration approval tokens', forbiddenPointerHits);
  if (configRuntimeImports.length) fail('readiness config has forbidden runtime imports', configRuntimeImports);
  if (appChanged) fail('App.tsx must not change', [appChanged]);
  if (serverChanged) fail('src/server.ts must not change', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts must not change', [typesChanged]);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);

  if (!process.exitCode) {
    console.log('PASS Pack14A Prisma migration readiness approval packet check');
    console.log('  - Pack14A files present; scope limited to allowed files');
    console.log('  - prisma/schema.prisma unchanged; six models verified on master');
    console.log('  - human approval packet pending; migration remains blocked');
  }
}

main();
