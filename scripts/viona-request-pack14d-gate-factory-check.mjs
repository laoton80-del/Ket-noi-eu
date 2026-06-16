#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  PACK14C_MIGRATION_SQL_PATH,
  PACK14D_BRANCH_ALLOWED_FILES,
  PACK14D_CORE_FILES,
  PACK14D_MIGRATED_GATE_SCRIPTS,
  containsForbiddenDbApplyCommand,
  isAllowedPack14cMigrationDiffFile,
  isForbiddenPrismaDiffPath,
  isPack14cMigrationSqlPath,
  isPrismaSchemaPath,
} from './lib/vionaPackDiffAllowlist.mjs';

const ROOT = process.cwd();

const PACK14D_CORE_FILES_LOCAL = PACK14D_CORE_FILES;

const MIGRATED_GATE_SCRIPTS = PACK14D_MIGRATED_GATE_SCRIPTS;

const ALLOWED_CHANGED_FILES = [...PACK14D_BRANCH_ALLOWED_FILES];

const FORBIDDEN_CHANGED_PATTERNS = [
  /^prisma\/schema\.prisma$/,
  /^prisma\/migrations\//,
  /^App\.tsx$/,
  /^src\/navigation\//,
  /^src\/screens\//,
  /^src\/routes\//,
  /^src\/controllers\//,
  /^src\/server\.ts$/,
  /^assets\//,
  /vionaRequestTypes\.ts$/,
];

const FORBIDDEN_FLAG_TOKENS = [
  'dbApplied: true',
  'readOnlyApiPermitted: true',
  'persistenceAdapterPermitted: true',
  'requestMutationPermitted: true',
  'adminDebugLiveDataActive: true',
  'operatorRoleAddedToAuth: true',
  'operatorRoleAddedToPrisma: true',
  'paymentCaptureActive: true',
  'bookingConfirmationActive: true',
  'sosDispatchActive: true',
  'walletMutationActive: true',
  'liveAiProtectedActionsActive: true',
  'liveMerchantExecutionActive: true',
];

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fail(label, values = []) {
  console.error(`FAIL ${label}`);
  for (const value of values) console.error(`  - ${value}`);
  process.exitCode = 1;
}

function main() {
  console.log('VIONA request Pack14D Gate Factory check');
  console.log('Gate Factory refactor only. No product, DB, schema, migration SQL, or runtime change.\n');

  const missingFiles = PACK14D_CORE_FILES_LOCAL.filter((rel) => !existsSync(path.join(ROOT, rel)));
  if (missingFiles.length) fail('missing Pack14D core files', missingFiles);

  const changedFiles = run('git diff --name-only origin/master..HEAD').split('\n').filter(Boolean);
  const unexpected = changedFiles.filter((file) => !ALLOWED_CHANGED_FILES.includes(file));
  if (unexpected.length) fail('unexpected files changed vs origin/master', unexpected);

  const forbiddenChanged = changedFiles.filter((file) =>
    FORBIDDEN_CHANGED_PATTERNS.some((pattern) => pattern.test(file))
  );
  if (forbiddenChanged.length) fail('forbidden paths changed', forbiddenChanged);

  const helper = read('scripts/lib/vionaPackDiffAllowlist.mjs');
  const productDoc = read('docs/product/VIONA_REQUEST_PACK14D_GATE_FACTORY_NO_PRODUCT_CHANGE.md');

  if (!helper.includes(PACK14C_MIGRATION_SQL_PATH)) {
    fail('helper missing exact Pack14C migration SQL path', [PACK14C_MIGRATION_SQL_PATH]);
  }
  if (!helper.includes('FORBIDDEN_DB_APPLY_COMMANDS')) {
    fail('helper must define FORBIDDEN_DB_APPLY_COMMANDS');
  }
  if (!helper.includes('export function containsForbiddenDbApplyCommand')) {
    fail('helper must export containsForbiddenDbApplyCommand');
  }
  if (!isPrismaSchemaPath('prisma/schema.prisma')) {
    fail('isPrismaSchemaPath must recognize prisma/schema.prisma');
  }
  if (isForbiddenPrismaDiffPath('prisma/schema.prisma', { pack13cActive: false, pack14cActive: true })) {
    // schema always forbidden unless pack13c - good
  } else {
    fail('prisma/schema.prisma must be forbidden when pack13c inactive');
  }
  if (!isForbiddenPrismaDiffPath('prisma/migrations/999999_other/migration.sql', { pack14cActive: true })) {
    fail('arbitrary prisma/migrations must remain forbidden');
  }
  if (!isAllowedPack14cMigrationDiffFile(PACK14C_MIGRATION_SQL_PATH, { pack14cActive: true })) {
    fail('Pack14C migration SQL must be allowed when pack14cActive');
  }
  if (isAllowedPack14cMigrationDiffFile(PACK14C_MIGRATION_SQL_PATH, { pack14cActive: false })) {
    fail('Pack14C migration SQL must not be allowed when pack14c inactive');
  }
  if (!isPack14cMigrationSqlPath(PACK14C_MIGRATION_SQL_PATH)) {
    fail('isPack14cMigrationSqlPath must match exact Pack14C path');
  }

  const missingImports = MIGRATED_GATE_SCRIPTS.filter((rel) => {
    const content = read(rel);
    return !content.includes("from './lib/vionaPackDiffAllowlist.mjs'") &&
      !content.includes('from "./lib/vionaPackDiffAllowlist.mjs"');
  });
  if (missingImports.length) fail('migrated gate scripts must import Gate Factory helper', missingImports);

  const localDuplicate = MIGRATED_GATE_SCRIPTS.filter((rel) =>
    read(rel).includes('function isPack14cMigrationDiffFile(')
  );
  if (localDuplicate.length) {
    fail('migrated gate scripts must not retain local isPack14cMigrationDiffFile', localDuplicate);
  }

  const localPrismaBlocked = MIGRATED_GATE_SCRIPTS.filter((rel) =>
    read(rel).includes('function isPrismaDiffBlocked(')
  );
  if (localPrismaBlocked.length) {
    fail('migrated gate scripts must not retain local isPrismaDiffBlocked', localPrismaBlocked);
  }

  const requiredDocPhrases = [
    'Gate Factory refactor',
    'No product behavior change',
    'No DB apply',
    'No schema edit',
    'No migration SQL edit',
    'Pack14C remains migration-file-only',
    'DB apply remains blocked',
  ];
  const missingDoc = requiredDocPhrases.filter((phrase) => !productDoc.includes(phrase));
  if (missingDoc.length) fail('missing product doc phrases', missingDoc);

  const prismaSchemaChanged = run('git diff --name-only origin/master..HEAD -- prisma/schema.prisma');
  if (prismaSchemaChanged) fail('prisma/schema.prisma changed', [prismaSchemaChanged]);

  const migrationChanged = run(
    'git diff --name-only origin/master..HEAD -- prisma/migrations/20260615120000_add_viona_request_models/migration.sql'
  );
  if (migrationChanged) fail('Pack14C migration SQL changed', [migrationChanged]);

  const changedText = changedFiles
    .filter((file) => file.startsWith('src/config/') || file.startsWith('docs/product/'))
    .map((file) => read(file))
    .join('\n');
  const flagHits = FORBIDDEN_FLAG_TOKENS.filter((token) => changedText.includes(token));
  if (flagHits.length) fail('forbidden live/apply flags found', flagHits);

  if (process.exitCode) {
    console.log('\nResult: FAIL - fix Pack14D Gate Factory before import.');
    return;
  }

  console.log('PASS Pack14D Gate Factory check');
  console.log(`  - helper centralizes ${PACK14C_MIGRATION_SQL_PATH}`);
  console.log(`  - ${MIGRATED_GATE_SCRIPTS.length} gate scripts migrated`);
  console.log('  - prisma/schema.prisma and migration SQL unchanged');
  console.log('  - no product/runtime/DB apply changes');
}

main();
