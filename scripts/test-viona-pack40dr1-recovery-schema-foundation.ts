/**
 * Pack40DR1 — recovery fencing + exact provider-reference schema/migration contract tests.
 *
 * Operator phrase: APPROVE_PACK40DR1_RECOVERY_SCHEMA_PACKET
 * Static inspection only — no database, staging, provider, escrow or deployment.
 *
 * Run:
 *   npx tsx scripts/test-viona-pack40dr1-recovery-schema-foundation.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');

const MIGRATION_DIR = 'prisma/migrations/20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference';
const MIGRATION_PATH = `${MIGRATION_DIR}/migration.sql`;
const SCHEMA_PATH = 'prisma/schema.prisma';

const UNCHANGED_RUNTIME_PATHS = [
  'src/repositories/vionaRequestExecutionAttemptRepository.ts',
  'src/services/viona/vionaRequestIndirectStatusActionService.ts',
  'src/services/viona/vionaRequestExecutionGatewayService.ts',
  'src/services/viona/vionaRequestExecutionOrchestrator.ts',
  'src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts',
  'src/services/viona/vionaRequestEscrowHoldService.ts',
  'src/controllers/VionaInternalRealTwilioPocController.ts',
  'src/services/viona/vionaAutonomousDispatchService.ts',
  'src/services/viona/vionaRequestStatusActionService.ts',
  'src/services/viona/vionaRequestNoteActionService.ts',
  'src/services/viona/vionaRequestReadService.ts',
  'src/services/viona/vionaRequestAccessScope.ts',
  'src/routes/vionaRoutes.ts',
] as const;

const FORBIDDEN_SYMBOLS = [
  'acquireRecoveryLease',
  'reconcileProvider',
  'recoverAttempt',
  'abandonAttempt',
  'SYSTEM_RECOVERY_PRINCIPAL',
] as const;

const ATTEMPT_STATES = [
  'claimed',
  'providerPending',
  'providerSucceeded',
  'providerFailed',
  'outcomeUncertain',
  'completed',
  'failed',
  'abandoned',
] as const;

let passed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL: ${message}`);
    return;
  }
  passed += 1;
  console.log(`PASS: ${message}`);
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

function countModelOccurrences(source: string, modelName: string): number {
  return (source.match(new RegExp(`\\bmodel\\s+${modelName}\\b`, 'g')) ?? []).length;
}

function main(): void {
  const schema = readUtf8(SCHEMA_PATH);
  const attempt = extractModelBlock(schema, 'VionaRequestExecutionAttempt');
  const attemptEnum = extractEnumBlock(schema, 'VionaRequestExecutionAttemptState');
  const migration = readUtf8(MIGRATION_PATH);
  const evidencePath = 'docs/product/VIONA_PACK40DR1_RECOVERY_SCHEMA_FOUNDATION_EVIDENCE.md';
  const evidence = fs.existsSync(path.join(REPO_ROOT, evidencePath))
    ? readUtf8(evidencePath)
    : '';
  const plan = readUtf8('docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md');
  const kernel = readUtf8('docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md');
  const handoff = readUtf8('Handoff_VIONA11726.txt');

  // 1–6 lease generation + existing lease fields
  assert(/leaseGeneration\s+Int\s+@default\(0\)/.test(attempt), 'leaseGeneration field exists');
  assert(/leaseGeneration\s+Int\s+@default\(0\)/.test(attempt), 'leaseGeneration is non-null Int with default');
  assert(
    migration.includes('ADD COLUMN "leaseGeneration" INTEGER NOT NULL DEFAULT 0'),
    'leaseGeneration has default zero in migration',
  );
  assert(/\bleaseOwner\s+String\?/.test(attempt), 'leaseOwner remains present');
  assert(/\bleaseExpiresAt\s+DateTime\?/.test(attempt), 'leaseExpiresAt remains present');
  assert(countModelOccurrences(schema, 'VionaRequestExecutionLease') === 0, 'no second lease table exists');

  // 7 no recovery job table
  assert(countModelOccurrences(schema, 'VionaRequestExecutionRecoveryJob') === 0, 'no recovery job table exists');
  assert(!/CREATE TABLE\s+"VionaRequestExecutionRecovery/.test(migration), 'migration creates no recovery job table');

  // 8–12 provider reference
  assert(
    /providerExternalReference\s+String\?\s+@db\.VarChar\(191\)/.test(attempt),
    'exact provider-reference field exists',
  );
  assert(
    /providerExternalReference\s+String\?\s+@db\.VarChar\(191\)/.test(attempt),
    'provider-reference field is nullable',
  );
  assert(
    migration.includes('ADD COLUMN "providerExternalReference" VARCHAR(191)'),
    'provider-reference field is bounded VARCHAR(191)',
  );
  assert(/\bproviderResultDigest\s+String\?/.test(attempt), 'providerResultDigest remains');
  assert(
    /\bproviderExternalReferenceDigest\s+String\?/.test(attempt),
    'providerExternalReferenceDigest remains',
  );
  assert(
    /providerExternalReference\s+String\?\s+@db\.VarChar\(191\)/.test(attempt) &&
      !/providerExternalReference\s+String\?\s+@db\.VarChar\(191\).*Digest/.test(attempt),
    'exact reference is not represented only as a digest',
  );

  // 13–15 no body/phone/credential columns on attempt
  assert(!/\bsmsBody\b|\bmessageBody\b|\bbody\s+String/.test(attempt), 'no SMS body field exists');
  assert(
    !/\bdestination\b|\btoNumber\b|\bphoneNumber\b|\bfromNumber\b/.test(attempt),
    'no destination/phone field exists',
  );
  assert(
    !/\bauthToken\b|\bapiKey\b|\baccountSid\b|\bcredential\b/.test(attempt),
    'no provider credential field exists',
  );

  // 16–18 partial unique index
  assert(
    migration.includes(
      'CREATE UNIQUE INDEX "VionaRequestExecutionAttempt_providerName_providerExternalReference_key"',
    ),
    'partial unique provider-reference index exists',
  );
  assert(
    /WHERE\s+"providerExternalReference"\s+IS\s+NOT\s+NULL/.test(migration),
    'partial index permits null values',
  );
  assert(
    /ON\s+"VionaRequestExecutionAttempt"\s*\(\s*"providerName"\s*,\s*"providerExternalReference"\s*\)/.test(
      migration,
    ),
    'partial index binds provider identity and reference',
  );
  assert(
    !attempt.includes('@@unique([providerName, providerExternalReference])'),
    'partial index is migration-managed (not Prisma @@unique)',
  );

  // 19–25 migration safety
  const alterAdds = migration.match(/ADD COLUMN/g) ?? [];
  assert(alterAdds.length === 2, 'migration adds only approved columns');
  assert((migration.match(/CREATE UNIQUE INDEX/g) ?? []).length === 1, 'migration adds only approved unique index');
  const migrationSqlOnly = migration
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
  assert(!/^\s*UPDATE\b/im.test(migrationSqlOnly), 'migration contains no UPDATE');
  assert(!/^\s*DELETE\b/im.test(migrationSqlOnly), 'migration contains no DELETE');
  assert(!/^\s*DROP\b/im.test(migrationSqlOnly), 'migration contains no DROP');
  assert(
    !/INSERT\b|SM[0-9a-fA-F]{32}/i.test(migrationSqlOnly),
    'migration contains no provider-reference backfill',
  );
  assert(
    !/ALTER TYPE\s+"VionaRequestExecutionAttemptState"/i.test(migrationSqlOnly),
    'migration does not change attempt enum',
  );
  assert(
    !/ALTER TYPE\s+"VionaRequest/.test(migrationSqlOnly) && !/VionaRequestStatus/i.test(migrationSqlOnly),
    'migration does not change request status enum',
  );

  // 26–28 enums / FK
  for (const state of ATTEMPT_STATES) {
    assert(attemptEnum.includes(state), `attempt state ${state} remains`);
  }
  assert(
    !/\brecovering\b|\breconciling\b|\bretrying\b|\bcompensating\b|\bmanuallyCompleted\b/.test(
      attemptEnum,
    ),
    'no new attempt states exist',
  );
  const requestModel = extractModelBlock(schema, 'VionaRequest');
  assert(
    !/\brecovering\b|\breconciling\b|\brecoveryPending\b/.test(requestModel),
    'no new request statuses exist',
  );
  assert(!/\bactiveExecutionAttemptId\b/.test(schema), 'no activeExecutionAttemptId exists');

  // 29–37 no runtime recovery / unchanged runtimes
  const srcTree = path.join(REPO_ROOT, 'src');
  let runtimeImportsReference = false;
  let recoveryServiceExists = false;
  let recoveryControllerExists = false;
  let schedulerExists = false;
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) continue;
      const rel = path.relative(REPO_ROOT, full).replace(/\\/g, '/');
      const text = fs.readFileSync(full, 'utf8');
      if (
        rel !== SCHEMA_PATH &&
        /\bproviderExternalReference\b/.test(text) &&
        !rel.includes('test-viona-pack40dr1')
      ) {
        // schema.prisma is outside src; within src any use is a runtime import
        runtimeImportsReference = true;
      }
      if (/vionaRequestExecutionRecovery/i.test(rel) || /RecoveryService/.test(text)) {
        recoveryServiceExists = true;
      }
      if (/RecoveryController/.test(text) || /recover-execution/.test(text)) {
        recoveryControllerExists = true;
      }
      if (
        /findExpiredActiveVionaRequestExecutionAttemptLeases/.test(text) &&
        !rel.includes('vionaRequestExecutionAttemptRepository.ts') &&
        !rel.includes('test-viona-pack40d')
      ) {
        schedulerExists = true;
      }
      for (const sym of FORBIDDEN_SYMBOLS) {
        if (text.includes(sym) && !rel.includes('test-viona-pack40dr1')) {
          // SYSTEM_RECOVERY_PRINCIPAL may appear in docs only; src forbid
          if (rel.startsWith('src/')) {
            failures.push(`forbidden symbol ${sym} in ${rel}`);
          }
        }
      }
    }
  };
  walk(srcTree);
  assert(!runtimeImportsReference, 'no source runtime imports the new reference field');
  assert(!recoveryServiceExists, 'no recovery service exists');
  assert(!recoveryControllerExists, 'no recovery controller or route exists');
  assert(!schedulerExists, 'no scheduler, queue or worker exists for expired-lease recovery');

  for (const rel of UNCHANGED_RUNTIME_PATHS) {
    const text = readUtf8(rel);
    assert(!/\bleaseGeneration\b/.test(text), `${rel} does not write leaseGeneration`);
    assert(!/\bproviderExternalReference\b/.test(text), `${rel} does not write providerExternalReference`);
  }

  assert(
    !readUtf8('src/services/viona/vionaPack40D3TwilioGatewayAdapter.ts').includes('providerExternalReference'),
    'Twilio wrapper unchanged wrt new reference field',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestEscrowHoldService.ts').includes('leaseGeneration'),
    'Escrow runtime unchanged',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestIndirectStatusActionService.ts').includes('leaseGeneration'),
    'Pack40D2 unchanged',
  );
  assert(
    !/\bproviderExternalReference\b(?!Digest)/.test(
      readUtf8('src/services/viona/vionaRequestExecutionGatewayService.ts'),
    ),
    'Pack40D3A unchanged',
  );
  assert(
    !readUtf8('src/services/viona/vionaRequestExecutionOrchestrator.ts').includes('leaseGeneration'),
    'Pack40D3B unchanged',
  );

  // 38–41 triggers / provenance
  const dispatch = readUtf8('src/services/viona/vionaAutonomousDispatchService.ts');
  assert(
    dispatch.includes('pack40d_provider_execution_disabled'),
    'signed-webhook execution remains disabled',
  );
  assert(
    !/approvedInternalDispatch/.test(
      readUtf8('src/controllers/VionaInternalRealTwilioPocController.ts'),
    ) ||
      !/triggerType:\s*['"]approvedInternalDispatch['"]/.test(
        readUtf8('src/controllers/VionaInternalRealTwilioPocController.ts'),
      ),
    'approvedInternalDispatch remains unwired in controller',
  );
  const principal = readUtf8('src/services/viona/vionaRequestExecutionPrincipalContext.ts');
  assert(principal.includes('approvedInternalDispatch'), 'trigger enum still lists approvedInternalDispatch');
  // No runtime caller assigning approvedInternalDispatch outside enum/types
  const srcOrchestrator = readUtf8('src/services/viona/vionaRequestExecutionOrchestrator.ts');
  assert(
    !srcOrchestrator.includes('approvedInternalDispatch'),
    'approvedInternalDispatch unwired in coordinator',
  );

  const d2 = readUtf8('src/services/viona/vionaRequestIndirectStatusActionService.ts');
  assert(/consumer|legacyUnresolved|scopeKind/.test(d2), 'consumer/legacy fail-closed surface remains in D2');

  // 42–44 Pack40A/B/C source files unchanged by DR1 (presence + no DR1 fields)
  for (const rel of [
    'src/services/viona/vionaRequestAccessScope.ts',
    'src/services/viona/vionaRequestNoteActionService.ts',
    'src/services/viona/vionaRequestStatusActionService.ts',
  ] as const) {
    const text = readUtf8(rel);
    assert(!/\bleaseGeneration\b|\bproviderExternalReference\b/.test(text), `Pack40 surface unchanged: ${rel}`);
  }

  // 45–46 closure markers / Pack40S
  assert(
    /Pack40D initial controlled merchant execution[:\s*]*\*?\*?CLOSED\s*\/\s*GREEN/i.test(plan) ||
      /Pack40D initial controlled merchant execution:\s*CLOSED\/GREEN/i.test(handoff),
    'initial controlled Pack40D closure marker remains',
  );
  assert(/Pack40S[:\s].*UNIMPLEMENTED|Pack40S.*NOT AUTHORIZED/i.test(plan), 'Pack40S remains unimplemented');
  assert(/Pack40A.*CLOSED\s*\/\s*GREEN/i.test(plan), 'Pack40A CLOSED/GREEN remains');
  assert(/Pack40B.*CLOSED\s*\/\s*GREEN/i.test(plan), 'Pack40B CLOSED/GREEN remains');
  assert(/Pack40C.*CLOSED\s*\/\s*GREEN/i.test(plan), 'Pack40C CLOSED/GREEN remains');

  // 47–48 no apply / no deploy commands in DR1 artifacts
  const suiteSource = readUtf8('scripts/test-viona-pack40dr1-recovery-schema-foundation.ts');
  assert(
    !/prisma\s+migrate\s+(deploy|dev|reset|resolve)|db\s+push/i.test(suiteSource),
    'migration is not applied by the test',
  );
  assert(
    !/\b(?:npx|prisma)\s+migrate\s+deploy\b|\bfly\s+deploy\b|\bhttps?:\/\/api\.twilio\.com\b|\bprocess\.env\.DATABASE_URL\b/i.test(
      suiteSource,
    ),
    'no DB/staging/provider/deploy command exists in suite',
  );

  // 49 privacy in evidence
  if (evidence) {
    assert(
      !/SM[0-9a-fA-F]{32}|\+\d{8,}|authToken|ACCOUNT_SID\s*=/.test(evidence),
      'no raw provider identifier appears in evidence fixtures',
    );
    assert(/unapplied|NOT been applied|Migration applied:\s*\*?no/i.test(evidence), 'evidence records unapplied migration');
  } else {
    assert(false, 'evidence document must exist');
  }

  // 50 no permanent broad git-diff-versus-master assertion
  assert(
    !/git\s+diff\s+origin\/master/.test(suiteSource),
    'no permanent broad git-diff-versus-master assertion exists',
  );

  // migration naming / comments
  assert(
    fs.existsSync(path.join(REPO_ROOT, MIGRATION_PATH)),
    'Pack40DR1 migration path exists',
  );
  assert(
    migration.includes('has NOT been applied') || migration.includes('not applied'),
    'migration header states unapplied',
  );
  assert(kernel.includes('Pack40DR1') || kernel.includes('leaseGeneration'), 'Kernel mentions Pack40DR1 foundation');

  console.log('');
  console.log(`Pack40DR1 results: ${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
