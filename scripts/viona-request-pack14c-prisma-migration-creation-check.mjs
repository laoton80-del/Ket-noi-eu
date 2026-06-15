#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const PACK14C_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md',
  'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts',
  'scripts/viona-request-pack14c-prisma-migration-creation-check.mjs',
  'docs/design/evidence/cursor-request-pack14c-prisma-migration-creation-only/README.md',
];

const PACK14B_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14B_PRISMA_MIGRATION_HUMAN_APPROVAL_RECORD.md',
  'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts',
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
  'docs/design/evidence/cursor-request-pack14b-prisma-migration-human-approval/README.md',
];

const PACK14A_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK14A_PRISMA_MIGRATION_READINESS_APPROVAL_PACKET.md',
  'src/config/vionaRequestPack14PrismaMigrationReadinessApprovalPacket.ts',
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'docs/design/evidence/cursor-request-pack14a-prisma-migration-readiness-approval-packet/README.md',
];

const PACK13C_CORE_FILES = [
  'docs/product/VIONA_REQUEST_PACK13C_PRISMA_SCHEMA_IMPLEMENTATION_SCHEMA_ONLY.md',
  'src/config/vionaRequestPack13CPrismaSchemaImplementationReadiness.ts',
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'docs/design/evidence/cursor-request-pack13c-prisma-schema-implementation-schema-only/README.md',
];

const POINTER_CONFIG_FILES = [
  'src/config/vionaRequestPack14PrismaMigrationHumanApprovalReadiness.ts',
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
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
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

const REQUIRED_FILES = [...PACK14C_CORE_FILES];

const REQUIRED_DOC_PHRASES = [
  'Pack14C creates migration files only',
  'Pack14B approval enabled future migration creation',
  'Migration file is created but not applied',
  'No DB apply',
  'prisma migrate dev',
  'prisma migrate deploy',
  'prisma db push',
  'No API',
  'No persistence adapter',
  'No request mutation',
  'Admin Debug remains fixture-only',
  'No OPERATOR',
  'Dedicated VIONA Request Store remains',
  'Direct LocalServiceRequest reuse remains disallowed',
  'DB apply remains separately blocked',
  'migrationCreated: true',
  'dbApplied: false',
];

const REQUIRED_CONFIG_TOKENS = [
  'export const VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_READINESS',
  'export const VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_CHECKLIST',
  'export function getVionaRequestPack14CPrismaMigrationCreationReadiness',
  'export function isVionaRequestPack14CPrismaMigrationCreationReadyForReview',
  'pack14HumanApprovalRecorded: true',
  'pack14PrismaMigrationApproved: true',
  'prismaMigrationPermitted: true',
  'pack14MigrationCreationOnly: true',
  'prismaMigrationActive: true',
  'migrationCreated: true',
  'dbApplied: false',
  'readOnlyApiPermitted: false',
  'persistenceAdapterPermitted: false',
  'requestMutationPermitted: false',
  'adminDebugUsesFixturesOnly: true',
  'agentMayFlipSignoff: false',
];

const REQUIRED_POINTER_TOKENS = [
  'pack14MigrationCreationOnly: true',
  'prismaMigrationActive: true',
  'migrationCreated: true',
  'dbApplied: false',
];

const REQUIRED_SQL_TABLES = [
  'CREATE TABLE "VionaRequest"',
  'CREATE TABLE "VionaRequestParticipant"',
  'CREATE TABLE "VionaRequestSourceLink"',
  'CREATE TABLE "VionaRequestStatusEvent"',
  'CREATE TABLE "VionaRequestAuditEvent"',
  'CREATE TABLE "VionaRequestAttachmentReference"',
  'VionaRequestSourceLinkStatus',
];

const FORBIDDEN_SQL_PATTERNS = [
  /\bDROP TABLE\b/i,
  /\bDROP COLUMN\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE FROM\b/i,
  /paymentConfirmed/i,
  /bookingConfirmed/i,
  /sosDispatched/i,
  /walletSettled/i,
  /LocalServiceRequest/i,
  /\bOPERATOR\b/,
];

const FORBIDDEN_APPLY_COMMANDS = [
  'prisma migrate dev',
  'prisma migrate deploy',
  'prisma db push',
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
  /^prisma\/schema\.prisma$/,
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
  'db applied',
  'migration applied',
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

function findMigrationFolders() {
  const migrationsDir = path.join(ROOT, 'prisma/migrations');
  if (!existsSync(migrationsDir)) return [];
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('_add_viona_request_models'))
    .map((entry) => `prisma/migrations/${entry.name}`);
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
        if (normalized.includes('remains false')) continue;
        if (claim === 'db applied' && normalized.includes('no db apply')) continue;
        if (claim === 'migration applied' && normalized.includes('not applied')) continue;
        hits.push(`${relPath}: ${claim} (${line.trim()})`);
      }
    }
  }
  return [...new Set(hits)];
}

function isAllowedChangedFile(file) {
  if (ALLOWED_FILES.includes(file)) return true;
  if (/^prisma\/migrations\/\d+_add_viona_request_models\/migration\.sql$/.test(file)) return true;
  return false;
}

const ALLOWED_FILES = [
  ...PACK14C_CORE_FILES,
  ...POINTER_CONFIG_FILES,
  ...GATE_SCRIPT_FILES,
  'prisma/migrations/20260615120000_add_viona_request_models/migration.sql',
];

function main() {
  console.log('VIONA request Pack14C Prisma migration creation check');
  console.log('Migration files only. No DB apply. No schema edit. No API, adapter, mutation, or runtime.\n');

  const migrationFolders = findMigrationFolders();
  const migrationSqlPaths = migrationFolders.map((folder) => `${folder}/migration.sql`);
  const missingFiles = REQUIRED_FILES.filter((relPath) => !existsSync(path.join(ROOT, relPath)));
  const changedFiles = getChangedFiles();
  const unexpectedFiles = changedFiles.filter((file) => !isAllowedChangedFile(file));
  const forbiddenFiles = changedFiles.filter((file) =>
    FORBIDDEN_DIFF_PATTERNS.some((pattern) => pattern.test(file))
  );

  const productDoc = read('docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md');
  const config = read('src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts');
  const pointerCombined = POINTER_CONFIG_FILES.map((rel) => read(rel)).join('\n');

  const schemaChanged = run('git diff --name-only origin/master..HEAD -- prisma/schema.prisma');
  const appChanged = run('git diff --name-only origin/master..HEAD -- App.tsx');
  const serverChanged = run('git diff --name-only origin/master..HEAD -- src/server.ts');
  const typesChanged = run('git diff --name-only origin/master..HEAD -- src/domain/requests/vionaRequestTypes.ts');

  let migrationSql = '';
  if (migrationSqlPaths.length === 1 && existsSync(path.join(ROOT, migrationSqlPaths[0]))) {
    migrationSql = read(migrationSqlPaths[0]);
  }

  const missingDocPhrases = missingValues(productDoc, REQUIRED_DOC_PHRASES);
  const missingConfigTokens = missingValues(config, REQUIRED_CONFIG_TOKENS);
  const missingPointerTokens = missingValues(pointerCombined, REQUIRED_POINTER_TOKENS);
  const missingSqlTables = REQUIRED_SQL_TABLES.filter((token) => !migrationSql.includes(token));
  const forbiddenSqlHits = FORBIDDEN_SQL_PATTERNS.filter((pattern) => pattern.test(migrationSql)).map(
    (pattern) => pattern.toString()
  );
  const unsafeClaims = findUnsafeStandaloneClaims([
    'docs/product/VIONA_REQUEST_PACK14C_PRISMA_MIGRATION_CREATION_ONLY.md',
    'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts',
  ]);

  const forbiddenImports = FORBIDDEN_RUNTIME_IMPORTS.filter((token) => config.includes(token));
  const hasBom = migrationSql.length > 0 && migrationSql.charCodeAt(0) === 0xfeff;

  if (missingFiles.length) fail('missing required Pack14C files', missingFiles);
  if (migrationFolders.length !== 1) {
    fail('exactly one add_viona_request_models migration folder required', [
      `found ${migrationFolders.length}: ${migrationFolders.join(', ') || 'none'}`,
    ]);
  }
  if (!migrationSql.trim()) fail('migration SQL missing or empty', migrationSqlPaths);
  if (unexpectedFiles.length) fail('unexpected changed files (scope drift)', unexpectedFiles);
  if (forbiddenFiles.length) fail('forbidden changed files', forbiddenFiles);
  if (schemaChanged) fail('prisma/schema.prisma must not change in Pack14C', [schemaChanged]);
  if (appChanged) fail('App.tsx must not change', [appChanged]);
  if (serverChanged) fail('src/server.ts must not change', [serverChanged]);
  if (typesChanged) fail('vionaRequestTypes.ts must not change', [typesChanged]);
  if (missingDocPhrases.length) fail('product doc missing required phrases', missingDocPhrases);
  if (missingConfigTokens.length) fail('readiness config missing required tokens', missingConfigTokens);
  if (missingPointerTokens.length) fail('pointer configs missing Pack14C tokens', missingPointerTokens);
  if (missingSqlTables.length) fail('migration SQL missing VionaRequest structures', missingSqlTables);
  if (forbiddenSqlHits.length) fail('migration SQL contains forbidden patterns', forbiddenSqlHits);
  if (unsafeClaims.length) fail('unsafe standalone production claims', unsafeClaims);
  if (forbiddenImports.length) fail('readiness config has forbidden runtime imports', forbiddenImports);
  if (hasBom) fail('migration SQL must be UTF-8 without BOM', ['BOM detected']);
  if (config.includes('dbApplied: true')) fail('dbApplied must remain false', ['dbApplied: true']);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack14C migration creation before import.');
    return;
  }

  console.log('PASS Pack14C Prisma migration creation check');
  console.log(`  - migration folder: ${migrationFolders[0]}`);
  console.log('  - migration SQL additive for six VionaRequest* models');
  console.log('  - prisma/schema.prisma unchanged; no DB apply');
  console.log('  - API/adapter/mutation/live remain blocked');
}

main();
