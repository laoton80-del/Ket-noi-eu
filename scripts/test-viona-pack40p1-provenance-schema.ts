/**
 * Pack40P1 — VionaRequest scope provenance schema & migration structural test suite.
 *
 * Operator phrase: APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION.
 * Pure content/contract scans only — no DB, network, or git-diff-vs-master assertions.
 *
 * Run:
 *   npx tsx scripts/test-viona-pack40p1-provenance-schema.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATION_DIR = path.join(
  REPO_ROOT,
  'prisma/migrations/20260714120000_pack40p1_add_viona_request_provenance',
);
const MIGRATION_PATH = path.join(MIGRATION_DIR, 'migration.sql');

const PROTECTED_PATHS = [
  'src/controllers/VionaRequestController.ts',
  'src/services/viona/vionaRequestCreateService.ts',
  'src/services/viona/vionaRequestCreateDto.ts',
  'src/controllers/VionaWebhookMerchantAgentController.ts',
  'src/services/viona/vionaRequestCreateFromWebhookService.ts',
  'src/services/viona/vionaRequestAccessScope.ts',
] as const;

const FORBIDDEN_RUNTIME_ENUM_REFS = [
  'src/controllers/VionaRequestController.ts',
  'src/services/viona/vionaRequestCreateService.ts',
  'src/services/viona/vionaRequestCreateDto.ts',
  'src/controllers/VionaWebhookMerchantAgentController.ts',
  'src/services/viona/vionaRequestCreateFromWebhookService.ts',
  'src/services/viona/vionaRequestAccessScope.ts',
  'src/services/viona/vionaRequestReadService.ts',
  'src/services/viona/vionaRequestNoteActionService.ts',
  'src/services/viona/vionaRequestStatusActionService.ts',
  'src/services/viona/vionaRequestExecutionOrchestrator.ts',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readUtf8(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function extractEnumBlock(source: string, enumName: string): string {
  const marker = `enum ${enumName} {`;
  const start = source.indexOf(marker);
  assert(start >= 0, `enum ${enumName} must exist`);
  const end = source.indexOf('}', start);
  assert(end > start, `enum ${enumName} must be closed`);
  return source.slice(start, end + 1);
}

function extractModelBlock(source: string, modelName: string): string {
  const marker = `model ${modelName} {`;
  const start = source.indexOf(marker);
  assert(start >= 0, `model ${modelName} must exist`);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`model ${modelName} must be closed`);
}

let passed = 0;

function runTest(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

function main(): void {
  const schema = readUtf8('prisma/schema.prisma');
  const migration = readUtf8(
    'prisma/migrations/20260714120000_pack40p1_add_viona_request_provenance/migration.sql',
  );
  const enumBlock = extractEnumBlock(schema, 'VionaRequestScopeKind');
  const vionaRequestBlock = extractModelBlock(schema, 'VionaRequest');
  const merchantProfileBlock = extractModelBlock(schema, 'MerchantProfile');

  runTest('enum VionaRequestScopeKind exists', () => {
    assert(enumBlock.includes('enum VionaRequestScopeKind {'), 'enum block must be declared');
  });

  runTest('enum contains exactly consumer, merchant, legacyUnresolved', () => {
    for (const value of ['consumer', 'merchant', 'legacyUnresolved'] as const) {
      assert(new RegExp(`\\n\\s*${value}\\s*\\n`).test(enumBlock), `enum must contain ${value}`);
    }
    const valueLines = enumBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('enum') && line !== '{' && line !== '}');
    assert(valueLines.length === 3, `enum must contain exactly 3 values, found ${valueLines.length}`);
  });

  runTest('scopeKind exists on VionaRequest and is non-null with legacyUnresolved default', () => {
    assert(
      /scopeKind\s+VionaRequestScopeKind\s+@default\(legacyUnresolved\)/.test(vionaRequestBlock),
      'scopeKind must be VionaRequestScopeKind @default(legacyUnresolved)',
    );
    assert(!/scopeKind\s+VionaRequestScopeKind\?/.test(vionaRequestBlock), 'scopeKind must not be optional');
  });

  runTest('merchantProfileId is nullable on VionaRequest', () => {
    assert(/merchantProfileId\s+String\?/.test(vionaRequestBlock), 'merchantProfileId must be String?');
  });

  runTest('MerchantProfile relation references id with Restrict deletion', () => {
    assert(
      /merchantProfile\s+MerchantProfile\?\s+@relation\(\s*fields:\s*\[merchantProfileId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict\s*\)/.test(
        vionaRequestBlock,
      ),
      'merchantProfile relation must reference MerchantProfile.id with onDelete: Restrict',
    );
    assert(!/onDelete:\s*Cascade/.test(vionaRequestBlock), 'VionaRequest must not cascade-delete merchant profile');
  });

  runTest('MerchantProfile back relation vionaRequests exists', () => {
    assert(/vionaRequests\s+VionaRequest\[\]/.test(merchantProfileBlock), 'MerchantProfile.vionaRequests back relation required');
  });

  runTest('scopeKind and merchantProfileId indexes exist on VionaRequest', () => {
    assert(/@@index\(\[scopeKind\]\)/.test(vionaRequestBlock), '@@index([scopeKind]) required');
    assert(/@@index\(\[merchantProfileId\]\)/.test(vionaRequestBlock), '@@index([merchantProfileId]) required');
  });

  runTest('existing tenantId field remains present and unchanged in shape', () => {
    assert(/tenantId\s+String/.test(vionaRequestBlock), 'tenantId String must remain');
    assert(!/tenantId\s+String\s+@default/.test(vionaRequestBlock), 'tenantId must not gain a new default');
  });

  runTest('migration creates VionaRequestScopeKind enum', () => {
    assert(
      migration.includes(`CREATE TYPE "VionaRequestScopeKind" AS ENUM ('consumer', 'merchant', 'legacyUnresolved')`),
      'migration must create enum with exact values',
    );
  });

  runTest('migration adds scopeKind and merchantProfileId columns', () => {
    assert(migration.includes('ADD COLUMN "scopeKind"'), 'migration must add scopeKind');
    assert(migration.includes('ADD COLUMN "merchantProfileId"'), 'migration must add merchantProfileId');
    assert(
      migration.includes(`NOT NULL DEFAULT 'legacyUnresolved'`),
      'scopeKind must be NOT NULL DEFAULT legacyUnresolved',
    );
  });

  runTest('migration creates both indexes and restrictive FK', () => {
    assert(migration.includes('CREATE INDEX "VionaRequest_scopeKind_idx"'), 'scopeKind index required');
    assert(
      migration.includes('CREATE INDEX "VionaRequest_merchantProfileId_idx"'),
      'merchantProfileId index required',
    );
    assert(
      migration.includes('"VionaRequest_merchantProfileId_fkey"') &&
        migration.includes('ON DELETE RESTRICT ON UPDATE CASCADE'),
      'FK must use ON DELETE RESTRICT ON UPDATE CASCADE',
    );
  });

  runTest('migration contains no data writes or destructive DDL', () => {
    const lines = migration
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('--'));
    for (const line of lines) {
      const upper = line.toUpperCase();
      assert(!/^DROP\s+TABLE\b/.test(upper), `migration must not contain DROP TABLE: ${line}`);
      assert(!/^DROP\s+COLUMN\b/.test(upper), `migration must not contain DROP COLUMN: ${line}`);
      assert(!/^TRUNCATE\b/.test(upper), `migration must not contain TRUNCATE: ${line}`);
      assert(!/^DELETE\b/.test(upper), `migration must not contain DELETE: ${line}`);
      assert(!/^UPDATE\b/.test(upper), `migration must not contain UPDATE: ${line}`);
      assert(!/^INSERT\b/.test(upper), `migration must not contain INSERT: ${line}`);
      assert(!/^UPSERT\b/.test(upper), `migration must not contain UPSERT: ${line}`);
    }
  });

  runTest('migration does not assign consumer or merchant to existing rows', () => {
    assert(!/DEFAULT\s+'consumer'/i.test(migration), 'migration must not default to consumer');
    assert(!/DEFAULT\s+'merchant'/i.test(migration), 'migration must not default to merchant');
    assert(!/=\s*'consumer'/i.test(migration), 'migration must not assign consumer to rows');
    assert(!/=\s*'merchant'/i.test(migration), 'migration must not assign merchant to rows');
    assert(
      migration.includes("DEFAULT 'legacyUnresolved'"),
      'migration must default existing rows to legacyUnresolved only',
    );
  });

  runTest('exactly one Pack40P1 migration directory exists', () => {
    const migrationsRoot = path.join(REPO_ROOT, 'prisma/migrations');
    const matches = fs
      .readdirSync(migrationsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.includes('pack40p1_add_viona_request_provenance'));
    assert(matches.length === 1, `expected exactly one pack40p1 migration directory, found ${matches.length}`);
    assert(fs.existsSync(MIGRATION_PATH), 'migration.sql must exist at expected path');
  });

  for (const relativePath of PROTECTED_PATHS) {
    runTest(`protected create/access path unchanged by P1 provenance wiring: ${relativePath}`, () => {
      const source = readUtf8(relativePath);
      assert(!source.includes('VionaRequestScopeKind'), `${relativePath} must not reference VionaRequestScopeKind in P1`);
      assert(!source.includes('scopeKind'), `${relativePath} must not reference scopeKind in P1`);
    });
  }

  runTest('no runtime production file references VionaRequestScopeKind or scopeKind', () => {
    for (const relativePath of FORBIDDEN_RUNTIME_ENUM_REFS) {
      const source = readUtf8(relativePath);
      assert(!source.includes('VionaRequestScopeKind'), `${relativePath} must not reference VionaRequestScopeKind`);
      assert(!source.includes('scopeKind'), `${relativePath} must not reference scopeKind`);
    }
  });

  runTest('MerchantProfile core fields remain present', () => {
    for (const field of [
      'ownerUserId',
      'tenantId',
      'displayName',
      'aiPersona',
      'toolScope',
      'isActive',
    ] as const) {
      assert(merchantProfileBlock.includes(field), `MerchantProfile.${field} must remain`);
    }
    assert(merchantProfileBlock.includes('@unique'), 'MerchantProfile @unique constraints must remain');
    assert(merchantProfileBlock.includes('ownerUserId   String   @unique'), 'ownerUserId @unique must remain');
    assert(merchantProfileBlock.includes('tenantId      String   @unique'), 'tenantId @unique must remain');
  });

  console.log(`\nPack40P1 provenance schema structural tests: ${passed}/${passed} PASS`);
}

main();
