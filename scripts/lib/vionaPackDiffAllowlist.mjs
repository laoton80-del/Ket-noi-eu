import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Exact Pack14C migration SQL path (file creation only; no DB apply). */
export const PACK14C_MIGRATION_SQL_PATH =
  'prisma/migrations/20260615120000_add_viona_request_models/migration.sql';

export const PACK14D_CORE_FILES = [
  'scripts/lib/vionaPackDiffAllowlist.mjs',
  'scripts/viona-request-pack14d-gate-factory-check.mjs',
  'docs/product/VIONA_REQUEST_PACK14D_GATE_FACTORY_NO_PRODUCT_CHANGE.md',
  'docs/design/evidence/cursor-request-pack14d-gate-factory/README.md',
];

export const PACK14D_MIGRATED_GATE_SCRIPTS = [
  'scripts/viona-request-pack13-prisma-schema-implementation-human-approval-recording-check.mjs',
  'scripts/viona-request-pack13-prisma-schema-implementation-approval-packet-check.mjs',
  'scripts/viona-request-inbox-readonly-check.mjs',
  'scripts/viona-request-pack12-prisma-schema-readiness-boundary-check.mjs',
  'scripts/viona-request-schema-design-human-approval-recording-check.mjs',
  'scripts/viona-request-dedicated-store-schema-design-contract-check.mjs',
  'scripts/viona-request-sot-human-approval-recording-check.mjs',
  'scripts/viona-request-sot-founder-architect-signoff-packet-check.mjs',
  'scripts/viona-request-sot-signoff-phase-promotion-readiness-check.mjs',
  'scripts/viona-request-source-of-truth-auth-tenant-mapping-check.mjs',
  'scripts/viona-request-persistence-audit-readiness-check.mjs',
];

/** Adjacent gates: allowlist-only spread so Pack14D branch diff passes scope checks. */
export const PACK14D_ADJACENT_ALLOWLIST_GATE_SCRIPTS = [
  'scripts/viona-operator-inbox-admin-debug-preview-check.mjs',
  'scripts/viona-operator-inbox-admin-route-readiness-check.mjs',
  'scripts/viona-request-inbox-operator-reference-lab-check.mjs',
  'scripts/viona-request-inbox-reference-lab-check.mjs',
];

/** Pack-specific scope gates: allowlist-only so Pack14D branch diff passes their scope checks. */
export const PACK14D_SCOPE_ALLOWLIST_GATE_SCRIPTS = [
  'scripts/viona-request-pack13c-prisma-schema-implementation-check.mjs',
  'scripts/viona-request-pack14-prisma-migration-human-approval-recording-check.mjs',
  'scripts/viona-request-pack14-prisma-migration-readiness-approval-packet-check.mjs',
  'scripts/viona-request-pack14c-prisma-migration-creation-check.mjs',
];

export const PACK14D_BRANCH_ALLOWED_FILES = [
  ...PACK14D_CORE_FILES,
  ...PACK14D_MIGRATED_GATE_SCRIPTS,
  ...PACK14D_ADJACENT_ALLOWLIST_GATE_SCRIPTS,
  ...PACK14D_SCOPE_ALLOWLIST_GATE_SCRIPTS,
];

/** Narrow pattern: only Pack14C add_viona_request_models migration.sql files. */
export const PACK14C_MIGRATION_SQL_RELATIVE_PATTERN =
  /^prisma\/migrations\/\d+_add_viona_request_models\/migration\.sql$/;

const FORBIDDEN_DB_APPLY_COMMANDS = [
  'prisma migrate dev',
  'prisma migrate deploy',
  'prisma db push',
];

export function normalizeDiffPath(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

export function isPrismaSchemaPath(filePath) {
  return normalizeDiffPath(filePath) === 'prisma/schema.prisma';
}

export function isPrismaMigrationPath(filePath) {
  return normalizeDiffPath(filePath).startsWith('prisma/migrations/');
}

export function isPack14cMigrationSqlPath(filePath) {
  const normalized = normalizeDiffPath(filePath);
  return (
    normalized === PACK14C_MIGRATION_SQL_PATH ||
    PACK14C_MIGRATION_SQL_RELATIVE_PATTERN.test(normalized)
  );
}

/** @deprecated Use isPack14cMigrationSqlPath — kept for gate script parity during migration. */
export const isPack14cMigrationDiffFile = isPack14cMigrationSqlPath;

export function isAllowedPack14cMigrationDiffFile(filePath, options = {}) {
  const { pack14cActive = false } = options;
  if (!pack14cActive) return false;
  return isPack14cMigrationSqlPath(filePath);
}

export function isForbiddenPrismaDiffPath(filePath, options = {}) {
  const { pack13cActive = false, pack14cActive = false } = options;
  const normalized = normalizeDiffPath(filePath);

  if (isAllowedPack14cMigrationDiffFile(normalized, { pack14cActive })) {
    return false;
  }
  if (pack13cActive && isPrismaSchemaPath(normalized)) {
    return false;
  }
  if (isPrismaSchemaPath(normalized)) {
    return true;
  }
  if (isPrismaMigrationPath(normalized)) {
    return true;
  }
  if (normalized.startsWith('prisma/')) {
    return true;
  }
  return false;
}

export function isPack14cMigrationCreated(root = process.cwd()) {
  const configPath = 'src/config/vionaRequestPack14CPrismaMigrationCreationReadiness.ts';
  const fullPath = path.join(root, configPath);
  if (!existsSync(fullPath)) return false;
  return readFileSync(fullPath, 'utf8').includes('migrationCreated: true');
}

export function isPrismaDiffBlocked(pack13cActive, pack14cActive, prismaChanged) {
  if (!prismaChanged) return false;
  const files = prismaChanged.split('\n').map(normalizeDiffPath).filter(Boolean);
  return files.some((file) =>
    isForbiddenPrismaDiffPath(file, { pack13cActive, pack14cActive })
  );
}

export function isMigrationsDiffBlocked(pack14cActive, migrationsChanged) {
  if (!migrationsChanged) return false;
  if (!pack14cActive) return true;
  const files = migrationsChanged.split('\n').map(normalizeDiffPath).filter(Boolean);
  return files.some((file) => !isPack14cMigrationSqlPath(file));
}

export function containsForbiddenDbApplyCommand(text) {
  return FORBIDDEN_DB_APPLY_COMMANDS.some((command) => text.includes(command));
}
