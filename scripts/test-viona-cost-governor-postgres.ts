/**
 * P0-A1 PostgreSQL concurrency proof. It starts one throwaway PostgreSQL
 * cluster below VIONA_TEST_PG_TOOLS_DIR, applies only the reviewed A1
 * SQL files to that loopback database, and uses independent Prisma transactions
 * through a 60-connection pool. No .env, external database, provider, or
 * network is used.
 *
 * Run: npx tsx scripts/test-viona-cost-governor-postgres.ts
 */
import * as assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, promises as fs, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { createContext, runInContext } from 'node:vm';

import { PrismaClient } from '@prisma/client';
import * as ts from 'typescript';

import {
  assertCostGovernorReservation,
  COST_GOVERNOR_ENV_NAMES,
  CostGovernorDeniedError,
  CostGovernorService,
  estimateInputTokensUpperBound,
  readCostGovernorConfig,
  type CostGovernor,
  type CostGovernorReserveInput,
  type CostGovernorReserveResult,
} from '../src/services/ai/CostGovernorService';
import { seedLaneBModelPrices } from './seed-viona-cost-governor-price';
import { LlmProviderAdmissionDeniedError } from '../src/services/ai/llmProviderAdmissionGate';
import type * as RouterModule from '../src/services/ai/AIRouterService';
import type * as ViralModule from '../src/services/marketing/ViralWrapEngine';

const execFile = promisify(execFileCallback);
const root = resolve(__dirname, '..');
const A1_MIGRATIONS = [
  resolve(root, 'prisma', 'migrations', '20261103000000_ai_cost_governor', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261104000000_ai_cost_receipt_inflight', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261104010000_ai_cost_price_unit_per_million', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261105000000_ai_cost_operation_snapshots', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261110120000_laneb_mult_unit_price_snapshots', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261111000000_ai_model_price_active_unique', 'migration.sql'),
] as const;
const inputPrice = 150000n;
const outputPrice = 600000n;
const reserveInputTokens = 10n;
const reserveOutputTokens = 20n;
const reserveAmount = 14n;
const testTimeZone = process.env.VIONA_TEST_PG_TIME_ZONE ?? 'UTC';
const PHASE_TIMEOUT_MS = 60_000;
if (testTimeZone !== 'UTC' && testTimeZone !== 'Europe/Prague' && testTimeZone !== 'Pacific/Auckland') {
  throw new Error('VIONA_TEST_PG_TIME_ZONE must be UTC, Europe/Prague, or Pacific/Auckland');
}

type EmbeddedServer = Readonly<{
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}>;
type EmbeddedServerConstructor = new (options: Readonly<Record<string, unknown>>) => EmbeddedServer;
type PgQueryResult = Readonly<{ rows: readonly Readonly<Record<string, unknown>>[] }>;
type PgClient = Readonly<{
  connect(): Promise<void>;
  end(): Promise<void>;
  query(sql: string, values?: readonly unknown[]): Promise<PgQueryResult>;
}>;
type PgClientConstructor = new (options: Readonly<Record<string, unknown>>) => PgClient;

let toolRoot: string | undefined;

function requiredToolRoot(): string {
  if (!toolRoot) throw new Error('VIONA_TEST_PG_TOOLS_DIR must name the approved local pg-test tools directory');
  return toolRoot;
}

function assertTemporaryDataDir(dataDir: string): void {
  const containment = relative(requiredToolRoot(), dataDir);
  if (!containment || containment.startsWith(`..${sep}`) || containment === '..') {
    throw new Error('Temporary PostgreSQL data directory escaped the authorized tool directory');
  }
}

async function findFreeLoopbackPort(): Promise<number> {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate a loopback port for temporary PostgreSQL'));
        return;
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

async function forceStopTemporaryPostgres(dataDir: string): Promise<void> {
  const pidPath = join(dataDir, 'postmaster.pid');
  if (existsSync(pidPath)) {
    const raw = await fs.readFile(pidPath, 'utf8');
    const pid = raw.split(/\r?\n/, 1)[0];
    if (!/^\d+$/.test(pid)) throw new Error('Temporary PostgreSQL postmaster pid was malformed');
    try {
      await execFile('taskkill.exe', ['/PID', pid, '/T', '/F'], { windowsHide: true });
    } catch {
      // The server can have already stopped; the data-directory cleanup below is the final proof.
    }
  }
  for (let attempt = 0; attempt < 50 && existsSync(pidPath); attempt += 1) {
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assertTemporaryDataDir(dataDir);
  await fs.rm(dataDir, { recursive: true, force: true });
}

async function applyA1Migrations(client: PgClient, migrationPaths: readonly string[] = A1_MIGRATIONS): Promise<void> {
  for (const migrationPath of migrationPaths) {
    const sql = await fs.readFile(migrationPath, 'utf8');
    try {
      // One unmodified query per reviewed migration file, in directory-name order.
      await client.query(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`A1 migration SQL failed (${migrationPath}): ${message}`);
    }
  }
}

async function dropA1Tables(client: PgClient): Promise<void> {
  await client.query(
    'DROP TABLE IF EXISTS "AiCostLedgerEntry", "AiCostOperation", "AiCostBudgetCounter", "AiModelPrice" CASCADE'
  );
}

async function verifySnapshotColumnsAbsent(client: PgClient): Promise<void> {
  const snapshotColumns = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'AiCostOperation'
        AND column_name = ANY($1::text[])`,
    [['inputMicrousdPerMillionTokens', 'outputMicrousdPerMillionTokens', 'providerTimeoutMs']]
  );
  assert.equal(snapshotColumns.rows.length, 0, 'rejected snapshot migration must not partially add columns');
}

async function verifyLaneBColumnsAbsent(client: PgClient): Promise<void> {
  const columns = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'AiCostOperation'
        AND column_name = ANY($1::text[])`,
    [['audioInputMicrousdPerSecond', 'audioOutputMicrousdPerSecond', 'imageMicrousdPerUnit']]
  );
  assert.equal(columns.rows.length, 0, 'rejected Lane B migration must not partially add unit snapshots');
}

async function proveSnapshotMigrationGuard(client: PgClient): Promise<void> {
  const priorMigrations = A1_MIGRATIONS.slice(0, 3);
  const snapshotMigration = A1_MIGRATIONS[3];
  await applyA1Migrations(client, priorMigrations);
  await client.query(
    `INSERT INTO "AiModelPrice" (
       "id", "provider", "model", "calculationVersion", "effectiveFrom",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
       "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
       "createdAt", "updatedAt"
     ) VALUES (
       'snapshot-guard-price', 'openai', 'snapshot-guard-model', 'snapshot-guard-v1', (now() AT TIME ZONE 'UTC'),
       1, 1, 0, 0, 0, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  await client.query(
    `INSERT INTO "AiCostOperation" (
       "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind", "priceVersionId",
       "reservedMicrousd", "windowStartDay", "windowStartMonth", "expiresAt", "createdAt", "updatedAt"
     ) VALUES (
       'snapshot-guard-legacy-row', 'snapshot-guard-subject', 'snapshot-guard-key', 'EXPRESS', 'openai', 'fixture-mini',
       'POSTGRES_TEST', 'snapshot-guard-price', 1, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'),
       (now() AT TIME ZONE 'UTC') + interval '1 minute', (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  const snapshotSql = await fs.readFile(snapshotMigration, 'utf8');
  await assert.rejects(
    client.query(snapshotSql),
    /AiCostOperation must be empty before applying snapshot columns; no backfill is defined/
  );
  await verifySnapshotColumnsAbsent(client);

  await dropA1Tables(client);
  await applyA1Migrations(client);
  await verifyA1Schema(client);
}

async function proveLaneBMigrationGuard(client: PgClient): Promise<void> {
  const priorMigrations = A1_MIGRATIONS.slice(0, 4);
  const laneBMigration = A1_MIGRATIONS[4];
  const laneBSql = await fs.readFile(laneBMigration, 'utf8');
  const activeUniqueMigration = A1_MIGRATIONS[5];
  const activeUniqueSql = await fs.readFile(activeUniqueMigration, 'utf8');

  await dropA1Tables(client);
  await applyA1Migrations(client, priorMigrations);
  await client.query(
    `INSERT INTO "AiModelPrice" (
       "id", "provider", "model", "calculationVersion", "effectiveFrom",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
       "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
       "createdAt", "updatedAt"
     ) VALUES (
       'laneb-invalid-reserve-price', 'openai', 'laneb-invalid-reserve-model', 'fixture-v1',
       (now() AT TIME ZONE 'UTC'), 1, 1, 0, 0, 0,
       (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  await client.query(
    `INSERT INTO "AiCostOperation" (
       "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind", "priceVersionId",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens", "providerTimeoutMs", "reservedMicrousd",
       "windowStartDay", "windowStartMonth", "expiresAt", "createdAt", "updatedAt"
     ) VALUES (
       'laneb-invalid-reserve-operation', 'laneb-subject', 'laneb-key', 'EXPRESS', 'openai',
       'laneb-invalid-reserve-model', 'ROUTED_CHAT_COMPLETION', 'laneb-invalid-reserve-price',
       1, 1, 1000, 0, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'),
       (now() AT TIME ZONE 'UTC') + interval '1 minute',
       (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  await assert.rejects(
    client.query(laneBSql),
    /AiCostOperation contains rows incompatible with LaneB cost-model checks; refusing migration/
  );
  await verifyLaneBColumnsAbsent(client);
  const oldChecks = await client.query(
    `SELECT conname FROM pg_constraint WHERE contype = 'c' AND conname = ANY($1::text[])`,
    [['AiCostOperation_inputMicrousdPerMillionTokens_positive', 'AiCostOperation_outputMicrousdPerMillionTokens_positive']]
  );
  assert.equal(oldChecks.rows.length, 2, 'failed preflight must leave both original token checks intact');

  await dropA1Tables(client);
  await applyA1Migrations(client, priorMigrations);
  await client.query(
    `INSERT INTO "AiModelPrice" (
       "id", "provider", "model", "calculationVersion", "effectiveFrom",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
       "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
       "createdAt", "updatedAt"
     ) VALUES (
       'laneb-valid-price', 'openai', 'laneb-valid-model', 'fixture-v1',
       (now() AT TIME ZONE 'UTC'), 1, 1, 0, 0, 0,
       (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  await client.query(
    `INSERT INTO "AiCostOperation" (
       "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind", "priceVersionId",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens", "providerTimeoutMs", "reservedMicrousd",
       "windowStartDay", "windowStartMonth", "expiresAt", "createdAt", "updatedAt"
     ) VALUES (
       'laneb-valid-operation', 'laneb-subject', 'laneb-valid-key', 'EXPRESS', 'openai',
       'laneb-valid-model', 'ROUTED_CHAT_COMPLETION', 'laneb-valid-price',
       1, 1, 1000, 1, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'),
       (now() AT TIME ZONE 'UTC') + interval '1 minute',
       (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  await client.query(laneBSql);
  const preserved = await client.query(
    `SELECT "reservedMicrousd", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
            "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
       FROM "AiCostOperation" WHERE "id" = 'laneb-valid-operation'`
  );
  assert.equal(preserved.rows.length, 1);
  assert.equal(preserved.rows[0].reservedMicrousd, '1');
  assert.equal(preserved.rows[0].inputMicrousdPerMillionTokens, '1');
  assert.equal(preserved.rows[0].outputMicrousdPerMillionTokens, '1');
  assert.equal(preserved.rows[0].audioInputMicrousdPerSecond, null);
  assert.equal(preserved.rows[0].audioOutputMicrousdPerSecond, null);
  assert.equal(preserved.rows[0].imageMicrousdPerUnit, null);
  await client.query(
    `UPDATE "AiCostOperation"
        SET "inputMicrousdPerMillionTokens" = 0, "outputMicrousdPerMillionTokens" = 0
      WHERE "id" = 'laneb-valid-operation'`
  );
  await assert.rejects(
    client.query(`UPDATE "AiCostOperation" SET "reservedMicrousd" = 0 WHERE "id" = 'laneb-valid-operation'`),
    /AiCostOperation_reservedMicrousd_positive/
  );

  await client.query(
    `INSERT INTO "AiModelPrice" (
       "id", "provider", "model", "calculationVersion", "effectiveFrom",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
       "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
       "createdAt", "updatedAt"
     ) VALUES (
       'laneb-duplicate-active-price', 'openai', 'laneb-valid-model', 'fixture-v2',
       (now() AT TIME ZONE 'UTC') + interval '1 millisecond', 1, 1, 0, 0, 0,
       (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`
  );
  await assert.rejects(
    client.query(activeUniqueSql),
    /AiModelPrice has multiple active versions per provider\/model; refusing unique index/
  );
  const indexAfterRejectedPrecheck = await client.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'AiModelPrice_active_unique'`
  );
  assert.equal(indexAfterRejectedPrecheck.rows.length, 0, 'precheck failure must not install the partial unique index');

  await client.query(`DELETE FROM "AiModelPrice" WHERE "id" = 'laneb-duplicate-active-price'`);
  await client.query(activeUniqueSql);
  await assert.rejects(
    client.query(
      `INSERT INTO "AiModelPrice" (
         "id", "provider", "model", "calculationVersion", "effectiveFrom",
         "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
         "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
         "createdAt", "updatedAt"
       ) VALUES (
         'laneb-second-indexed-active-price', 'openai', 'laneb-valid-model', 'fixture-v3',
         (now() AT TIME ZONE 'UTC') + interval '2 milliseconds', 1, 1, 0, 0, 0,
         (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
       )`
    ),
    /AiModelPrice_active_unique/
  );

  await dropA1Tables(client);
  await applyA1Migrations(client);
  await verifyA1Schema(client);
}

async function verifyA1Schema(client: PgClient): Promise<void> {
  const expectedTables = ['AiModelPrice', 'AiCostOperation', 'AiCostLedgerEntry', 'AiCostBudgetCounter'];
  const tables = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
    [expectedTables]
  );
  assert.deepEqual(
    [...tables.rows].map((row) => String(row.tablename)).sort(),
    [...expectedTables].sort(),
    'all four A1 tables must exist after the reviewed SQL files'
  );

  const expectedColumns = [
    ['AiCostOperation', 'providerRequestId'],
    ['AiCostOperation', 'usageInputTokens'],
    ['AiCostOperation', 'usageOutputTokens'],
    ['AiCostOperation', 'actualCostMicrousd'],
    ['AiCostOperation', 'settledAt'],
    ['AiCostOperation', 'inputMicrousdPerMillionTokens'],
    ['AiCostOperation', 'outputMicrousdPerMillionTokens'],
    ['AiCostOperation', 'providerTimeoutMs'],
    ['AiCostOperation', 'audioInputMicrousdPerSecond'],
    ['AiCostOperation', 'audioOutputMicrousdPerSecond'],
    ['AiCostOperation', 'imageMicrousdPerUnit'],
    ['AiModelPrice', 'inputMicrousdPerMillionTokens'],
    ['AiModelPrice', 'outputMicrousdPerMillionTokens'],
  ] as const;
  const columns = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public'
         AND (table_name, column_name) IN (
           ('AiCostOperation', 'providerRequestId'), ('AiCostOperation', 'usageInputTokens'),
           ('AiCostOperation', 'usageOutputTokens'), ('AiCostOperation', 'actualCostMicrousd'),
           ('AiCostOperation', 'settledAt'), ('AiCostOperation', 'inputMicrousdPerMillionTokens'),
           ('AiCostOperation', 'outputMicrousdPerMillionTokens'), ('AiCostOperation', 'providerTimeoutMs'),
           ('AiCostOperation', 'audioInputMicrousdPerSecond'), ('AiCostOperation', 'audioOutputMicrousdPerSecond'),
           ('AiCostOperation', 'imageMicrousdPerUnit'),
           ('AiModelPrice', 'inputMicrousdPerMillionTokens'),
           ('AiModelPrice', 'outputMicrousdPerMillionTokens')
         )`
  );
  const actualColumns = new Set([...columns.rows].map((row) => `${row.table_name}.${row.column_name}`));
  for (const [table, column] of expectedColumns) {
    assert.ok(actualColumns.has(`${table}.${column}`), `missing ${table}.${column}`);
  }

  const expectedChecks = [
    'AiModelPrice_inputMicrousdPerMillionTokens_nonnegative',
    'AiModelPrice_outputMicrousdPerMillionTokens_nonnegative',
    'AiCostOperation_reservedMicrousd_nonnegative',
    'AiCostOperation_settledMicrousd_nonnegative',
    'AiCostOperation_usageInputTokens_nonnegative',
    'AiCostOperation_usageOutputTokens_nonnegative',
    'AiCostOperation_actualCostMicrousd_nonnegative',
    'AiCostOperation_settled_requires_settledAt',
    'AiCostOperation_actualCost_requires_settled',
    'AiCostOperation_inputMicrousdPerMillionTokens_nonnegative',
    'AiCostOperation_outputMicrousdPerMillionTokens_nonnegative',
    'AiCostOperation_reservedMicrousd_positive',
    'AiCostOperation_providerTimeoutMs_valid',
    'AiCostBudgetCounter_reservedMicrousd_nonnegative',
    'AiCostBudgetCounter_settledMicrousd_nonnegative',
  ];
  const checks = await client.query(
    `SELECT conname FROM pg_constraint
       WHERE contype = 'c' AND conname = ANY($1::text[])`,
    [expectedChecks]
  );
  const actualChecks = new Set([...checks.rows].map((row) => String(row.conname)));
  for (const name of expectedChecks) assert.ok(actualChecks.has(name), `missing CHECK ${name}`);

  const expectedIndexes = [
    'AiModelPrice_provider_model_effectiveFrom_key',
    'AiModelPrice_active_unique',
    'AiCostOperation_subjectId_idempotencyKey_key',
    'AiCostOperation_status_expiresAt_idx',
    'AiCostOperation_status_dispatchedAt_idx',
    'AiCostOperation_subjectId_status_idx',
    'AiCostBudgetCounter_scope_windowStart_key',
  ];
  const indexes = await client.query(
    `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
    [expectedIndexes]
  );
  const actualIndexes = new Set([...indexes.rows].map((row) => String(row.indexname)));
  for (const name of expectedIndexes) assert.ok(actualIndexes.has(name), `missing index ${name}`);
}

function setFixtureConfig(overrides: Partial<Record<keyof typeof COST_GOVERNOR_ENV_NAMES, bigint>> = {}): void {
  const values: Record<keyof typeof COST_GOVERNOR_ENV_NAMES, bigint> = {
    userDailyCap: 1_000_000n,
    globalDailyCap: 10_000_000n,
    globalMonthlyCap: 100_000_000n,
    userInflightLimit: 100n,
    globalInflightLimit: 100n,
    providerTimeoutMs: 1_000n,
    ...overrides,
  };
  for (const [key, name] of Object.entries(COST_GOVERNOR_ENV_NAMES) as Array<
    [keyof typeof COST_GOVERNOR_ENV_NAMES, string]
  >) {
    process.env[name] = values[key].toString();
  }
}

function clearFixtureConfig(): void {
  for (const name of Object.values(COST_GOVERNOR_ENV_NAMES)) delete process.env[name];
}

type SqlDiagnostic = Readonly<{
  origin: string;
  message: string;
  statement?: string;
  prismaCode?: string;
  sqlState?: string;
}>;

function redactDiagnostic(value: string): string {
  return value.replace(/postgresql:\/\/[^\s@]+@/gi, 'postgresql://<temporary>@');
}

function diagnosticCodes(error: unknown): Readonly<{ prismaCode?: string; sqlState?: string }> {
  if (typeof error !== 'object' || error === null) return {};
  const record = error as Readonly<Record<string, unknown>>;
  const meta = typeof record.meta === 'object' && record.meta !== null
    ? record.meta as Readonly<Record<string, unknown>>
    : undefined;
  const cause = typeof record.cause === 'object' && record.cause !== null
    ? record.cause as Readonly<Record<string, unknown>>
    : undefined;
  const prismaCode = typeof record.code === 'string' && /^P\d{4}$/.test(record.code)
    ? record.code
    : undefined;
  const sqlState = [record.sqlState, record.sqlstate, meta?.code, meta?.sqlState, cause?.code]
    .find((value): value is string => typeof value === 'string' && /^[0-9A-Z]{5}$/i.test(value));
  return { prismaCode, sqlState: sqlState?.toUpperCase() };
}

async function runPhase<T>(name: string, run: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  console.log(`[phase] ${new Date().toISOString()} BEGIN ${name}`);
  let timeout: NodeJS.Timeout | undefined;
  try {
    const result = await Promise.race([
      Promise.resolve().then(run),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`phase timeout after ${PHASE_TIMEOUT_MS}ms: ${name}`)), PHASE_TIMEOUT_MS);
      }),
    ]);
    console.log(`[phase] ${new Date().toISOString()} PASS ${name} ${Date.now() - startedAt}ms`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[phase] ${new Date().toISOString()} FAIL ${name} ${Date.now() - startedAt}ms ${redactDiagnostic(message)}`);
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function diagnosticCollector(): Readonly<{
  record(origin: string, error: unknown, statement?: string): void;
  clear(): void;
  values(): readonly SqlDiagnostic[];
}> {
  const values: SqlDiagnostic[] = [];
  return {
    record(origin, error, statement) {
      const message = error instanceof Error ? error.message : String(error);
      values.push({ origin, message: redactDiagnostic(message), statement, ...diagnosticCodes(error) });
    },
    clear() { values.length = 0; },
    values() { return values; },
  };
}

type SqlFault = Readonly<{
  before?(origin: 'query' | 'execute', query: string, values: readonly unknown[]): void;
  after?(origin: 'query' | 'execute', query: string, values: readonly unknown[]): void;
}>;

type GovernorTransactionOptions = Readonly<{ maxWait: number; timeout: number }>;

function oneShotSqlFault(
  origin: 'query' | 'execute',
  match: (query: string) => boolean,
  timing: 'before' | 'after' = 'before'
): SqlFault {
  let remaining = 1;
  const inject = (actualOrigin: 'query' | 'execute', query: string): void => {
    if (remaining > 0 && actualOrigin === origin && match(query)) {
      remaining -= 1;
      throw new Error(`synthetic PostgreSQL ${timing}-acknowledgment failure at ${origin}`);
    }
  };
  return timing === 'before' ? { before: inject } : { after: inject };
}

function serviceFor(
  prisma: PrismaClient,
  diagnostics?: ReturnType<typeof diagnosticCollector>,
  fault?: SqlFault,
  observedTransactionOptions?: GovernorTransactionOptions[]
): CostGovernorService {
  if (!diagnostics && !fault && !observedTransactionOptions) return new CostGovernorService(() => prisma as never);
  const observeRawClient = (client: Readonly<{
    $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
    $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  }>) => ({
    async $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> {
      try {
        fault?.before?.('query', query, values);
        const result = await client.$queryRawUnsafe<T>(query, ...values);
        fault?.after?.('query', query, values);
        return result;
      } catch (error) {
        diagnostics?.record('query', error, query);
        throw error;
      }
    },
    async $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number> {
      try {
        fault?.before?.('execute', query, values);
        const result = await client.$executeRawUnsafe(query, ...values);
        fault?.after?.('execute', query, values);
        return result;
      } catch (error) {
        diagnostics?.record('execute', error, query);
        throw error;
      }
    },
  });
  const rootClient = observeRawClient(prisma);
  const database = {
    async $transaction<T>(
      callback: (transaction: ReturnType<typeof observeRawClient>) => Promise<T>,
      options: GovernorTransactionOptions
    ): Promise<T> {
      try {
        observedTransactionOptions?.push({ ...options });
        return await prisma.$transaction(
          async (transaction) => callback(observeRawClient(transaction as never)),
          options
        );
      } catch (error) {
        diagnostics?.record('transaction', error);
        throw error;
      }
    },
    $queryRawUnsafe: rootClient.$queryRawUnsafe,
    $executeRawUnsafe: rootClient.$executeRawUnsafe,
  };
  return new CostGovernorService(() => database as never);
}

function printReserveDiagnostics(
  label: string,
  results: readonly CostGovernorReserveResult[],
  diagnostics: ReturnType<typeof diagnosticCollector>
): void {
  const histogram = new Map<string, number>();
  for (const result of results) histogram.set(result.decision, (histogram.get(result.decision) ?? 0) + 1);
  console.log(`[diagnostic] ${label} decisions ${JSON.stringify(Object.fromEntries(histogram))}`);
  for (const decision of [...histogram.keys()].filter((value) => value !== 'ALLOW_RESERVED').sort()) {
    const errors = decision === 'DENY_LEDGER_UNAVAILABLE' ? diagnostics.values().slice(0, 3) : [];
    console.log(`[diagnostic] ${label} ${decision} root-errors ${JSON.stringify(errors)}`);
  }
}

function input(subjectId: string, idempotencyKey: string, overrides: Partial<CostGovernorReserveInput> = {}): CostGovernorReserveInput {
  return {
    subjectId,
    idempotencyKey,
    rail: 'EXPRESS',
    provider: 'openai',
    model: 'fixture-mini',
    operationKind: 'ROUTED_CHAT_COMPLETION',
    inputTokensUpperBound: reserveInputTokens,
    outputTokens: reserveOutputTokens,
    ...overrides,
  };
}

function allowed(result: CostGovernorReserveResult): Extract<CostGovernorReserveResult, { decision: 'ALLOW_RESERVED' }> {
  assert.equal(result.decision, 'ALLOW_RESERVED');
  return result as Extract<CostGovernorReserveResult, { decision: 'ALLOW_RESERVED' }>;
}

const ROUTER_TASK_TYPES = {
  SIMPLE_TRANSLATION: 'SIMPLE_TRANSLATION',
  ROUTING_INQUIRY: 'ROUTING_INQUIRY',
  COMPLEX_MARKETING: 'COMPLEX_MARKETING',
  DEEP_CONTEXT: 'DEEP_CONTEXT',
  VIONA_REAL_EXECUTION_CONTENT: 'VIONA_REAL_EXECUTION_CONTENT',
};

function compileVmModule<T>(
  context: ReturnType<typeof createContext>,
  relativePath: string,
  dependencies: Readonly<Record<string, unknown>>
): T {
  const filename = resolve(root, relativePath);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const closedRequire = (id: string): unknown => {
    if (!Object.prototype.hasOwnProperty.call(dependencies, id)) {
      throw new Error(`Unexpected runtime dependency blocked: ${id}`);
    }
    return dependencies[id];
  };
  const execute = runInContext(`(function(require, module, exports) { ${output}\n})`, context, {
    filename,
    timeout: 1_000,
  }) as (require: typeof closedRequire, module: { exports: unknown }, exports: unknown) => void;
  execute(closedRequire, module, module.exports);
  return module.exports as T;
}

type RouterIntegrationOptions = Readonly<{
  governor: CostGovernor;
  providerFailure?: Error & Readonly<{ status?: number }>;
  apiKey?: string;
  consoleLines?: string[];
  usageLogFailure?: Error;
}>;

function routerIntegrationHarness(options: RouterIntegrationOptions): Readonly<{
  router: typeof RouterModule;
  sdkRequests: unknown[];
  sdkConstructed: { value: number };
}> {
  const sdkRequests: unknown[] = [];
  const sdkConstructed = { value: 0 };
  const environment: Record<string, string> = {
    VIONA_LLM_PROVIDER_ADMISSION_ENABLED: 'true',
    VIONA_LLM_PROVIDER_ALLOWED_USER_IDS: 'router-subject',
    VIONA_LLM_PROVIDER_ALLOWED_TASK_TYPES: 'ROUTING_INQUIRY',
    OPENAI_API_KEY: options.apiKey ?? 'router-fake-key-never-sent',
  };
  const capture = (...values: unknown[]): void => {
    options.consoleLines?.push(values.map((value) => String(value)).join(' '));
  };
  const context = createContext({
    process: { env: environment },
    AbortSignal,
    console: { log: capture, info: capture, warn: capture, error: capture },
  }, { codeGeneration: { strings: false, wasm: false } });
  const gate = compileVmModule<Record<string, unknown>>(context, 'src/services/ai/llmProviderAdmissionGate.ts', {});
  class FakeOpenAI {
    constructor(_configuration: Readonly<{ apiKey?: string; maxRetries?: number }> = {}) {
      sdkConstructed.value += 1;
    }

    chat = { completions: { create: async (params: unknown) => {
      sdkRequests.push(params);
      if (options.providerFailure) throw options.providerFailure;
      return {
        id: 'pg-router-provider-receipt',
        choices: [{ message: { content: 'Synthetic PostgreSQL router completion.' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };
    } } };
  }
  const costGovernor = {
    CostGovernorDeniedError,
    assertCostGovernorReservation,
    estimateInputTokensUpperBound,
    getCostGovernor: () => options.governor,
  };
  const router = compileVmModule<typeof RouterModule>(context, 'src/services/ai/AIRouterService.ts', {
    '@prisma/client': { LlmRouterTaskType: ROUTER_TASK_TYPES },
    openai: FakeOpenAI,
    '../../lib/prisma': {
      getPrisma: () => ({
        llmApiUsageLog: {
          create: async () => {
            if (options.usageLogFailure) throw options.usageLogFailure;
            return {};
          },
        },
      }),
    },
    './CostGovernorService': costGovernor,
    './llmProviderAdmissionGate': gate,
  });
  return { router, sdkRequests, sdkConstructed };
}

type ViralIntegrationOptions = Readonly<{
  governor: CostGovernor;
  providerFailure?: Error & Readonly<{ status?: number }>;
  awaitAbort?: boolean;
}>;

function viralIntegrationHarness(options: ViralIntegrationOptions): Readonly<{
  viral: typeof ViralModule;
  sdkRequests: unknown[];
  sdkConstructed: { value: number };
}> {
  const sdkRequests: unknown[] = [];
  const sdkConstructed = { value: 0 };
  const environment: Record<string, string> = {
    OPENAI_API_KEY: 'viral-fake-key-never-sent',
    OPENAI_MODEL: 'fixture-mini',
  };
  const context = createContext({
    process: { env: environment },
    AbortSignal,
    console: { log() {}, info() {}, warn() {}, error() {} },
  }, { codeGeneration: { strings: false, wasm: false } });
  class FakeOpenAI {
    constructor(_configuration: Readonly<{ apiKey?: string; maxRetries?: number }> = {}) {
      sdkConstructed.value += 1;
    }

    chat = { completions: { create: async (params: unknown, requestOptions?: Readonly<{ signal?: AbortSignal }>) => {
      sdkRequests.push(params);
      if (options.awaitAbort) {
        const signal = requestOptions?.signal;
        if (!signal) throw new Error('Viral timeout proof expected an AbortSignal');
        return new Promise<never>((_resolve, reject) => {
          const onAbort = () => {
            signal.removeEventListener('abort', onAbort);
            reject(Object.assign(new Error('synthetic viral provider timeout after abort'), { code: 'ETIMEDOUT' }));
          };
          signal.addEventListener('abort', onAbort, { once: true });
          if (signal.aborted) onAbort();
        });
      }
      if (options.providerFailure) throw options.providerFailure;
      return {
        id: 'pg-viral-provider-receipt',
        choices: [{ message: { content: 'Synthetic viral PostgreSQL tagline.' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };
    } } };
  }
  const viralPrisma = {
    tourismBooking: {
      findUnique: async () => ({
        id: 'viral-trip-1',
        userId: 'viral-subject',
        status: 'COMPLETED',
        totalPaidVIG: 100,
        touristFeeVIG: 10,
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        endDate: new Date('2026-11-02T00:00:00.000Z'),
        business: { name: 'Synthetic viral destination' },
        service: { title: 'Synthetic viral service' },
      }),
      count: async () => 1,
    },
    profile: { findUnique: async () => ({ languageCode: 'en' }) },
    aILog: { count: async () => 0 },
  };
  const costGovernor = {
    CostGovernorDeniedError,
    assertCostGovernorReservation,
    estimateInputTokensUpperBound,
    getCostGovernor: () => options.governor,
  };
  const viral = compileVmModule<typeof ViralModule>(context, 'src/services/marketing/ViralWrapEngine.ts', {
    '@prisma/client': {
      LlmRouterTaskType: ROUTER_TASK_TYPES,
      TourismBookingStatus: { COMPLETED: 'COMPLETED', CONFIRMED: 'CONFIRMED' },
    },
    openai: FakeOpenAI,
    '../../lib/prisma': { getPrisma: () => viralPrisma },
    '../../config/pricingConfig': { CREDIT_EXCHANGE_RATE_USD: 0.01 },
    '../ai/CostGovernorService': costGovernor,
    '../ai/llmProviderAdmissionGate': {
      LlmProviderAdmissionDeniedError,
      assertLlmProviderAdmission: () => {},
    },
  });
  return { viral, sdkRequests, sdkConstructed };
}

function routedInputForPostgres(
  idempotencyKey: string,
  prompt: string,
  maxTokens = 20
): RouterModule.RoutedChatCompletionInput {
  return {
    taskType: 'ROUTING_INQUIRY' as never,
    userId: 'router-subject',
    idempotencyKey,
    params: { messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens } as never,
  };
}

async function resetCostTables(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "AiCostLedgerEntry", "AiCostOperation", "AiCostBudgetCounter", "AiModelPrice" CASCADE'
  );
}

async function insertFixturePrice(prisma: PrismaClient, overrides: Readonly<{
  input?: bigint;
  output?: bigint;
  model?: string;
}> = {}): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AiModelPrice" (
       "id", "provider", "model", "calculationVersion", "effectiveFrom", "effectiveTo",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
       "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
       "createdAt", "updatedAt"
      ) VALUES (
        $1, 'openai', $2, 'fixture-v1', (now() AT TIME ZONE 'UTC') - interval '1 minute', NULL,
        $3::bigint, $4::bigint, 0, 0, 0, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
     )`,
    id,
    overrides.model ?? 'fixture-mini',
    (overrides.input ?? inputPrice).toString(),
    (overrides.output ?? outputPrice).toString()
  );
  return id;
}

async function counter(prisma: PrismaClient, scope: string, windowStart?: Date): Promise<Readonly<{
  reservedMicrousd: bigint;
  settledMicrousd: bigint;
}>> {
  const rows = await prisma.$queryRawUnsafe<Array<{ reservedMicrousd: bigint; settledMicrousd: bigint }>>(
    windowStart
      ? `SELECT "reservedMicrousd", "settledMicrousd" FROM "AiCostBudgetCounter"
           WHERE "scope" = $1 AND "windowStart" = $2`
      : `SELECT "reservedMicrousd", "settledMicrousd" FROM "AiCostBudgetCounter"
           WHERE "scope" = $1 ORDER BY "windowStart" DESC LIMIT 1`,
    ...(windowStart ? [scope, windowStart] : [scope])
  );
  assert.equal(rows.length, 1, `missing counter ${scope}`);
  return rows[0];
}

async function operation(prisma: PrismaClient, id: string): Promise<Readonly<{
  status: string;
  reservedMicrousd: bigint;
  settledMicrousd: bigint;
  actualCostMicrousd: bigint | null;
  inputMicrousdPerMillionTokens: bigint;
  outputMicrousdPerMillionTokens: bigint;
  audioInputMicrousdPerSecond: bigint | null;
  audioOutputMicrousdPerSecond: bigint | null;
  imageMicrousdPerUnit: bigint | null;
  providerTimeoutMs: bigint;
  windowStartDay: Date;
  windowStartMonth: Date;
  createdAt: Date;
  dispatchedAt: Date | null;
  expiresAt: Date;
  settledAt: Date | null;
}>> {
  const rows = await prisma.$queryRawUnsafe<Array<{
    status: string;
    reservedMicrousd: bigint;
    settledMicrousd: bigint;
    actualCostMicrousd: bigint | null;
    inputMicrousdPerMillionTokens: bigint;
    outputMicrousdPerMillionTokens: bigint;
    audioInputMicrousdPerSecond: bigint | null;
    audioOutputMicrousdPerSecond: bigint | null;
    imageMicrousdPerUnit: bigint | null;
    providerTimeoutMs: bigint;
    windowStartDay: Date;
    windowStartMonth: Date;
    createdAt: Date;
    dispatchedAt: Date | null;
    expiresAt: Date;
    settledAt: Date | null;
  }>>(
    `SELECT "status", "reservedMicrousd", "settledMicrousd", "actualCostMicrousd",
            "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
            "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit", "providerTimeoutMs",
            "windowStartDay", "windowStartMonth",
            "createdAt", "dispatchedAt", "expiresAt", "settledAt"
       FROM "AiCostOperation" WHERE "id" = $1`,
    id
  );
  assert.equal(rows.length, 1, `missing operation ${id}`);
  return rows[0];
}

async function operationIdForKey(prisma: PrismaClient, subjectId: string, idempotencyKey: string): Promise<string> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "AiCostOperation"
      WHERE "subjectId" = $1 AND "idempotencyKey" = $2`,
    subjectId,
    idempotencyKey
  );
  assert.equal(rows.length, 1, 'expected exactly one operation for subject/idempotency key');
  return rows[0].id;
}

async function counterTriplet(prisma: PrismaClient, subjectId: string): Promise<Readonly<Record<string, Readonly<{
  reservedMicrousd: bigint;
  settledMicrousd: bigint;
}>>>> {
  const scopes = ['GLOBAL_MONTH', 'GLOBAL_DAY', `USER_DAY:${subjectId}`] as const;
  const values = await Promise.all(scopes.map(async (scope) => [scope, await counter(prisma, scope)] as const));
  return Object.fromEntries(values);
}

async function countRows(prisma: PrismaClient, table: string): Promise<bigint> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*)::bigint AS "count" FROM ${table}`);
  return rows[0].count;
}

async function ledgerEntryCount(prisma: PrismaClient, operationId: string, entryType: string): Promise<bigint> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS "count"
       FROM "AiCostLedgerEntry"
      WHERE "operationId" = $1 AND "entryType" = $2`,
    operationId,
    entryType
  );
  assert.equal(rows.length, 1, `missing ledger count for ${entryType}`);
  return rows[0].count;
}

let passed = 0;
async function test(name: string, run: () => Promise<void>): Promise<void> {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  const configuredToolRoot = process.env.VIONA_TEST_PG_TOOLS_DIR?.trim();
  if (!configuredToolRoot) {
    throw new Error('VIONA_TEST_PG_TOOLS_DIR is required; PostgreSQL proof was not attempted');
  }
  toolRoot = resolve(configuredToolRoot);
  for (const required of [requiredToolRoot(), join(requiredToolRoot(), 'package.json'), ...A1_MIGRATIONS]) {
    if (!existsSync(required)) throw new Error(`Required local PostgreSQL artifact is unavailable: ${required}`);
  }
  const requireFromTool = createRequire(join(requiredToolRoot(), 'package.json'));
  let embedded: Readonly<{ default: EmbeddedServerConstructor }>;
  let PgClientClass: PgClientConstructor;
  try {
    const modulePath = requireFromTool.resolve('embedded-postgres');
    embedded = await import(pathToFileURL(modulePath).href) as Readonly<{ default: EmbeddedServerConstructor }>;
    PgClientClass = (requireFromTool('pg') as Readonly<{ Client: PgClientConstructor }>).Client;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Required pg-test module is unavailable under VIONA_TEST_PG_TOOLS_DIR: ${message}`);
  }
  const port = await findFreeLoopbackPort();
  const dataDir = resolve(requiredToolRoot(), `data-a1-core-${randomUUID()}`);
  assertTemporaryDataDir(dataDir);
  const user = 'cost_governor_fixture';
  const password = randomUUID();
  const databaseUrl = `postgresql://${user}:${encodeURIComponent(password)}@127.0.0.1:${port}/postgres?connection_limit=60&pool_timeout=30`;
  const server = new embedded.default({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: true,
    createPostgresUser: false,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    postgresFlags: ['-h', '127.0.0.1', '-c', `TimeZone=${testTimeZone}`],
    onLog: () => {},
    onError: () => {},
  });
  let prisma: PrismaClient | undefined;
  let pg: PgClient | undefined;
  try {
    await runPhase('server.initialise', () => server.initialise());
    await runPhase('server.start', () => server.start());
    pg = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
    await runPhase('pg.connect', () => pg!.connect());
    const timeZoneRows = await pg.query('SHOW TimeZone');
    const observedTimeZone = String(timeZoneRows.rows[0]?.TimeZone ?? '');
    if (observedTimeZone !== testTimeZone) {
      throw new Error(`Temporary PostgreSQL session timezone mismatch: expected ${testTimeZone}, got ${observedTimeZone}`);
    }
    console.log(`[diagnostic] PostgreSQL session timezone ${observedTimeZone}`);
    const encodingRows = await pg.query('SHOW SERVER_ENCODING');
    const observedEncoding = String(encodingRows.rows[0]?.server_encoding ?? '');
    if (observedEncoding !== 'UTF8') {
      throw new Error(`Temporary PostgreSQL server encoding mismatch: expected UTF8, got ${observedEncoding}`);
    }
    await runPhase('prove snapshot migration guard and apply empty-table path', () => test(
      '44: snapshot migration rejects a legacy row without partial schema and applies on an empty table',
      () => proveSnapshotMigrationGuard(pg!)
    ));
    await runPhase('prove Lane B nonpositive-reserve migration guard', () => test(
      '44b: Lane B migration rejects nonpositive legacy reserves and preserves valid snapshots',
      () => proveLaneBMigrationGuard(pg!)
    ));
    await runPhase('pg.end after schema verification', () => pg!.end());
    pg = undefined;
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await runPhase('prisma.$connect', () => prisma!.$connect());
    const diagnostics = diagnosticCollector();
    const governor = serviceFor(prisma, diagnostics);

    await test('1: fifty parallel reserves never exceed the user cap', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ userDailyCap: reserveAmount * 10n });
      diagnostics.clear();
      const results = await Promise.all(Array.from({ length: 50 }, (_, index) =>
        governor.reserve(input('subject-cap', `user-cap-${index}`))
      ));
      printReserveDiagnostics('scenario-1', results, diagnostics);
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 10);
      assert.equal(results.filter((result) => result.decision === 'DENY_CAP').length, 40);
      assert.equal((await counter(prisma!, 'USER_DAY:subject-cap')).reservedMicrousd, reserveAmount * 10n);
    });

    await test('2: global daily and monthly caps are atomic across competing users', async () => {
      for (const window of ['daily', 'monthly'] as const) {
        await resetCostTables(prisma!); await insertFixturePrice(prisma!);
        setFixtureConfig(window === 'daily'
          ? { globalDailyCap: reserveAmount * 7n }
          : { globalMonthlyCap: reserveAmount * 7n });
        const results = await Promise.all(Array.from({ length: 30 }, (_, index) =>
          governor.reserve(input(`global-${window}-${index}`, `${window}-${index}`))
        ));
        assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 7);
        assert.equal(results.filter((result) => result.decision === 'DENY_CAP').length, 23);
        const scope = window === 'daily' ? 'GLOBAL_DAY' : 'GLOBAL_MONTH';
        assert.equal((await counter(prisma!, scope)).reservedMicrousd, reserveAmount * 7n);
      }
    });

    await test('3: global in-flight limit has no reserve leak under thirty concurrent admissions', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ globalInflightLimit: 4n });
      const results = await Promise.all(Array.from({ length: 30 }, (_, index) =>
        governor.reserve(input(`inflight-global-${index}`, `inflight-global-${index}`))
      ));
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 4);
      assert.equal(results.filter((result) => result.decision === 'DENY_INFLIGHT').length, 26);
      assert.equal((await counter(prisma!, 'GLOBAL_DAY')).reservedMicrousd, reserveAmount * 4n);
    });

    await test('4: user in-flight limit is independent across competing subjects', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ userInflightLimit: 1n });
      const results = await Promise.all(Array.from({ length: 5 }, (_, userIndex) =>
        Array.from({ length: 3 }, (_, attempt) => governor.reserve(input(`user-${userIndex}`, `user-${userIndex}-${attempt}`)))
      ).flat());
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 5);
      assert.equal(results.filter((result) => result.decision === 'DENY_INFLIGHT').length, 10);
    });

    await test('5: concurrent money and in-flight controls obey the tighter in-flight limit', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ globalDailyCap: reserveAmount * 3n, globalInflightLimit: 2n });
      const results = await Promise.all(Array.from({ length: 30 }, (_, index) =>
        governor.reserve(input(`tight-${index}`, `tight-${index}`))
      ));
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 2);
      assert.equal(results.filter((result) => result.decision === 'DENY_INFLIGHT').length, 28);
      assert.equal((await counter(prisma!, 'GLOBAL_DAY')).reservedMicrousd, reserveAmount * 2n);
    });

    await test('6: twenty concurrent uses of one idempotency key create one operation', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const results = await Promise.all(Array.from({ length: 20 }, () => governor.reserve(input('idempotent', 'same-key'))));
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 1);
      assert.equal(results.filter((result) => result.decision === 'DUPLICATE_IN_PROGRESS').length, 19);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 1n);
    });

    await test('7: an expired RESERVED operation frees only its in-flight slot', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig({ globalInflightLimit: 1n });
      const first = allowed(await governor.reserve(input('stale-reserved', 'stale-reserved')));
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation"
            SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '6 minutes',
                "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 minute'
          WHERE "id" = $1`,
        first.operation.id
      );
      assert.equal((await governor.reserve(input('after-stale', 'after-stale'))).decision, 'ALLOW_RESERVED');
      assert.equal((await counter(prisma!, 'GLOBAL_DAY')).reservedMicrousd, reserveAmount * 2n);
    });

    await test('8: OUTCOME_UNKNOWN frees a slot but keeps its reservation', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig({ globalInflightLimit: 1n });
      const first = allowed(await governor.reserve(input('unknown', 'unknown')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal(await governor.markOutcomeUnknown(first.operation.id), true);
      assert.equal((await governor.reserve(input('after-unknown', 'after-unknown'))).decision, 'ALLOW_RESERVED');
      assert.equal((await operation(prisma!, first.operation.id)).status, 'OUTCOME_UNKNOWN');
      assert.equal((await counter(prisma!, 'GLOBAL_DAY')).reservedMicrousd, reserveAmount * 2n);
    });

    await test('9: an expired dispatch lease frees only its in-flight slot', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig({ globalInflightLimit: 1n, providerTimeoutMs: 1_000n });
      const first = allowed(await governor.reserve(input('lease', 'lease')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      await prisma!.$executeRawUnsafe(
         `UPDATE "AiCostOperation"
             SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '18 seconds',
                 "dispatchedAt" = (now() AT TIME ZONE 'UTC') - interval '17 seconds',
                 "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 second'
           WHERE "id" = $1`,
        first.operation.id
      );
      assert.equal((await governor.reserve(input('after-lease', 'after-lease'))).decision, 'ALLOW_RESERVED');
      assert.equal((await counter(prisma!, 'GLOBAL_DAY')).reservedMicrousd, reserveAmount * 2n);
    });

    await test('10: a duplicate settle is a counter no-op', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('settle-repeat', 'settle-repeat')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      const initial = await governor.settle({ operationId: first.operation.id, usage: { inputTokens: 10n, outputTokens: 20n } });
      const afterFirst = await counter(prisma!, 'USER_DAY:settle-repeat');
      const repeated = await governor.settle({ operationId: first.operation.id, usage: { inputTokens: 10n, outputTokens: 20n } });
      assert.equal(initial.applied, true); assert.equal(repeated.applied, false);
      assert.deepEqual(await counter(prisma!, 'USER_DAY:settle-repeat'), afterFirst);
      const ledger = await prisma!.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT count(*)::bigint AS "count" FROM "AiCostLedgerEntry" WHERE "operationId" = $1 AND "entryType" = 'SETTLE'`,
        first.operation.id
      );
      assert.equal(ledger[0].count, 1n);
    });

    await test('11: a late settle updates the operation original UTC windows', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('late', 'late')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      const oldDay = new Date('2000-01-02T00:00:00.000Z');
      const oldMonth = new Date('2000-01-01T00:00:00.000Z');
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation" SET "windowStartDay" = $2, "windowStartMonth" = $3 WHERE "id" = $1`,
        first.operation.id, oldDay, oldMonth
      );
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostBudgetCounter"
            SET "windowStart" = CASE WHEN "scope" = 'GLOBAL_MONTH' THEN $1 ELSE $2 END`,
        oldMonth, oldDay
      );
      await governor.settle({ operationId: first.operation.id, usage: { inputTokens: 10n, outputTokens: 20n } });
      assert.deepEqual(await counter(prisma!, 'GLOBAL_MONTH', oldMonth), { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY', oldDay), { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
      assert.deepEqual(await counter(prisma!, 'USER_DAY:late', oldDay), { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
    });

    await test('12: actual cost above reserve is recorded without clipping', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('above-reserve', 'above-reserve', { inputTokensUpperBound: 1n, outputTokens: 0n })));
      assert.equal(first.operation.reservedMicrousd, 1n);
      assert.equal(await governor.markDispatching(first.operation.id), true);
      await governor.settle({ operationId: first.operation.id, usage: { inputTokens: 1n, outputTokens: 20n } });
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.actualCostMicrousd, 13n);
      assert.equal(stored.settledMicrousd, 13n);
      assert.deepEqual(await counter(prisma!, 'USER_DAY:above-reserve'), { reservedMicrousd: 0n, settledMicrousd: 13n });
    });

    await test('13: fifty concurrent independent admissions complete without deadlock', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const results = await Promise.all(Array.from({ length: 50 }, (_, index) =>
        governor.reserve(input(`deadlock-${index}`, `deadlock-${index}`))
      ));
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 50);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 50n);
    });

    await test('14: the per-million-token formula rounds once over the full total', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('rounding', 'rounding', { inputTokensUpperBound: 1n, outputTokens: 1n })));
      assert.equal(first.operation.reservedMicrousd, 1n);
      assert.equal(await governor.markDispatching(first.operation.id), true);
      await governor.settle({ operationId: first.operation.id, usage: { inputTokens: 1n, outputTokens: 1n } });
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.actualCostMicrousd, 1n);
      assert.equal(stored.settledMicrousd, 1n);
    });

    await test('15: settlement and clear provider release use stored windows under the configured session timezone', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const settled = allowed(await governor.reserve(input('timezone-window', 'timezone-settle')));
      assert.equal(await governor.markDispatching(settled.operation.id), true);
      await governor.settle({ operationId: settled.operation.id, usage: { inputTokens: 10n, outputTokens: 20n } });
      const released = allowed(await governor.reserve(input('timezone-window', 'timezone-release')));
      assert.equal(await governor.markDispatching(released.operation.id), true);
      assert.equal(await governor.release({ operationId: released.operation.id, reason: 'provider_http_4xx' }), true);
      assert.deepEqual(await counter(prisma!, 'USER_DAY:timezone-window'), {
        reservedMicrousd: 0n,
        settledMicrousd: reserveAmount,
      });
    });

    await test('16: ten concurrent settles move each counter exactly once', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('parallel-settle', 'parallel-settle')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      const results = await Promise.all(Array.from({ length: 10 }, () => governor.settle({
        operationId: first.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      })));
      assert.equal(results.filter((result) => result.applied).length, 1);
      assert.equal(results.filter((result) => !result.applied).length, 9);
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.status, 'SETTLED');
      assert.equal(stored.actualCostMicrousd, reserveAmount);
      assert.equal(stored.settledMicrousd, reserveAmount);
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:parallel-settle']) {
        const value = await counter(prisma!, scope);
        assert.ok(value.reservedMicrousd >= 0n && value.settledMicrousd >= 0n, `${scope} must remain non-negative`);
        assert.deepEqual(value, { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
      }
      assert.equal(await ledgerEntryCount(prisma!, first.operation.id, 'SETTLE'), 1n);
    });

    await test('17: concurrent settle and release apply one lifecycle transition without double credit', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('settle-release-race', 'settle-release-race')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      const [settleResult, releaseResult] = await Promise.all([
        governor.settle({
          operationId: first.operation.id,
          usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
        }).then(() => true, () => false),
        governor.release({ operationId: first.operation.id, reason: 'provider_http_4xx' }).then(() => true, () => false),
      ]);
      assert.equal(Number(settleResult) + Number(releaseResult), 1, 'exactly one lifecycle transition must win');
      const stored = await operation(prisma!, first.operation.id);
      assert.ok(stored.status === 'SETTLED' || stored.status === 'RELEASED', `unexpected terminal state ${stored.status}`);
      const expectedSettled = stored.status === 'SETTLED' ? reserveAmount : 0n;
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:settle-release-race']) {
        const value = await counter(prisma!, scope);
        assert.ok(value.reservedMicrousd >= 0n && value.settledMicrousd >= 0n, `${scope} must remain non-negative`);
        assert.deepEqual(value, { reservedMicrousd: 0n, settledMicrousd: expectedSettled });
      }
      const settleEntries = await ledgerEntryCount(prisma!, first.operation.id, 'SETTLE');
      const releaseEntries = await ledgerEntryCount(prisma!, first.operation.id, 'RELEASE');
      assert.equal(settleEntries + releaseEntries, 1n);
      assert.equal(stored.status === 'SETTLED' ? settleEntries : releaseEntries, 1n);
    });

    await test('18: ten concurrent reserves with one idempotency key reserve money once', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const results = await Promise.all(Array.from({ length: 10 }, () =>
        governor.reserve(input('idempotent-ten', 'same-key-ten'))
      ));
      assert.equal(results.filter((result) => result.decision === 'ALLOW_RESERVED').length, 1);
      assert.equal(results.filter((result) => result.decision === 'DUPLICATE_IN_PROGRESS').length, 9);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 1n);
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:idempotent-ten']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: reserveAmount, settledMicrousd: 0n });
      }
      const operationRows = await prisma!.$queryRawUnsafe<Array<{ id: string }>>(
        'SELECT "id" FROM "AiCostOperation" WHERE "subjectId" = $1 AND "idempotencyKey" = $2',
        'idempotent-ten',
        'same-key-ten'
      );
      assert.equal(operationRows.length, 1);
      assert.equal(await ledgerEntryCount(prisma!, operationRows[0].id, 'RESERVE'), 1n);
    });

    await test('19: an orphaned DISPATCHING operation expires from in-flight but retains its original-window reserve', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ globalInflightLimit: 1n, globalDailyCap: reserveAmount * 2n });
      const orphan = allowed(await governor.reserve(input('orphan-dispatch', 'orphan-dispatch')));
      assert.equal(await governor.markDispatching(orphan.operation.id), true);
      await prisma!.$executeRawUnsafe(
         `UPDATE "AiCostOperation"
             SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '18 seconds',
                 "dispatchedAt" = (now() AT TIME ZONE 'UTC') - interval '17 seconds',
                 "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 second'
           WHERE "id" = $1`,
        orphan.operation.id
      );
      assert.equal(
        (await governor.reserve(input('after-orphan-dispatch', 'after-orphan-dispatch'))).decision,
        'ALLOW_RESERVED',
        'the expired dispatch lease must no longer consume the global in-flight slot'
      );
      assert.equal((await operation(prisma!, orphan.operation.id)).status, 'DISPATCHING');
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), {
        reservedMicrousd: reserveAmount * 2n,
        settledMicrousd: 0n,
      });

      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ globalInflightLimit: 1n, globalDailyCap: reserveAmount });
      const capOrphan = allowed(await governor.reserve(input('orphan-cap', 'orphan-cap')));
      assert.equal(await governor.markDispatching(capOrphan.operation.id), true);
      await prisma!.$executeRawUnsafe(
         `UPDATE "AiCostOperation"
             SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '18 seconds',
                 "dispatchedAt" = (now() AT TIME ZONE 'UTC') - interval '17 seconds',
                 "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 second'
           WHERE "id" = $1`,
        capOrphan.operation.id
      );
      assert.equal(
        (await governor.reserve(input('after-orphan-cap', 'after-orphan-cap'))).decision,
        'DENY_CAP',
        'the expired dispatch lease must not erase the original-window money reservation'
      );
      assert.equal((await operation(prisma!, capOrphan.operation.id)).status, 'DISPATCHING');
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), {
        reservedMicrousd: reserveAmount,
        settledMicrousd: 0n,
      });
    });

    await test('20: terminal accounting completes from stored reservation state after cap configuration is removed', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const settled = allowed(await governor.reserve(input('terminal-config', 'terminal-settle')));
      const released = allowed(await governor.reserve(input('terminal-config', 'terminal-release')));
      const unknown = allowed(await governor.reserve(input('terminal-config', 'terminal-unknown')));
      assert.equal(await governor.markDispatching(settled.operation.id), true);
      assert.equal(await governor.markDispatching(unknown.operation.id), true);

      clearFixtureConfig();

      const settledResult = await governor.settle({
        operationId: settled.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      });
      assert.equal(settledResult.applied, true);
      assert.equal(await governor.release({ operationId: released.operation.id, reason: 'reserved_not_dispatched' }), true);
      assert.equal(await governor.markOutcomeUnknown(unknown.operation.id), true);
      assert.equal((await operation(prisma!, settled.operation.id)).status, 'SETTLED');
      assert.equal((await operation(prisma!, released.operation.id)).status, 'RELEASED');
      assert.equal((await operation(prisma!, unknown.operation.id)).status, 'OUTCOME_UNKNOWN');
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:terminal-config']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: reserveAmount, settledMicrousd: reserveAmount });
      }
      assert.equal((await governor.reserve(input('terminal-config', 'terminal-new-reserve'))).decision, 'DENY_UNCONFIGURED');
    });

    await test('21: configuration loss before dispatch releases its reservation and never calls the provider stub', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const reserved = allowed(await governor.reserve(input('dispatch-config', 'dispatch-config')));
      clearFixtureConfig();

      let providerCalls = 0;
      const providerStub = () => { providerCalls += 1; };
      let dispatchError: unknown;
      try {
        const dispatched = await governor.markDispatching(reserved.operation.id);
        if (dispatched) providerStub();
      } catch (error) {
        dispatchError = error;
        await governor.release({ operationId: reserved.operation.id, reason: 'reserved_not_dispatched' });
      }
      assert.equal((dispatchError as Readonly<{ code?: string }>).code, 'COST_GOVERNOR_DENY_UNCONFIGURED');
      assert.equal(providerCalls, 0);
      assert.equal((await operation(prisma!, reserved.operation.id)).status, 'RELEASED');
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:dispatch-config']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: 0n, settledMicrousd: 0n });
      }
    });

    await test('22: invalid in-flight and timeout configuration after reserve cannot block settle or release', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const settled = allowed(await governor.reserve(input('terminal-invalid', 'terminal-invalid-settle')));
      const released = allowed(await governor.reserve(input('terminal-invalid', 'terminal-invalid-release')));
      assert.equal(await governor.markDispatching(settled.operation.id), true);

      process.env[COST_GOVERNOR_ENV_NAMES.userInflightLimit] = '0';
      process.env[COST_GOVERNOR_ENV_NAMES.globalInflightLimit] = '0';
      process.env[COST_GOVERNOR_ENV_NAMES.providerTimeoutMs] = '0';

      assert.equal((await governor.settle({
        operationId: settled.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      })).applied, true);
      assert.equal(await governor.release({ operationId: released.operation.id, reason: 'reserved_not_dispatched' }), true);
      assert.equal((await operation(prisma!, settled.operation.id)).status, 'SETTLED');
      assert.equal((await operation(prisma!, released.operation.id)).status, 'RELEASED');
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:terminal-invalid']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
      }
    });

    await test('23: a first counter insert rejects an amount above each cap, while equality is allowed', async () => {
      const capCases: Array<readonly [string, Partial<Record<keyof typeof COST_GOVERNOR_ENV_NAMES, bigint>>]> = [
        ['USER_DAY', { userDailyCap: reserveAmount - 1n }],
        ['GLOBAL_DAY', { globalDailyCap: reserveAmount - 1n }],
        ['GLOBAL_MONTH', { globalMonthlyCap: reserveAmount - 1n }],
      ];
      for (const [scope, overrides] of capCases) {
        await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig(overrides);
        assert.equal(
          (await governor.reserve(input(`first-${scope}`, `first-${scope}`))).decision,
          'DENY_CAP',
          `${scope} must reject a first reservation larger than its cap`
        );
        assert.equal(await countRows(prisma!, '"AiCostOperation"'), 0n);
        assert.equal(await countRows(prisma!, '"AiCostBudgetCounter"'), 0n);
      }

      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({
        userDailyCap: reserveAmount,
        globalDailyCap: reserveAmount,
        globalMonthlyCap: reserveAmount,
      });
      const equal = allowed(await governor.reserve(input('cap-equality', 'cap-equality')));
      assert.equal(equal.operation.reservedMicrousd, reserveAmount);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 1n);
      assert.equal(await countRows(prisma!, '"AiCostBudgetCounter"'), 3n);
    });

    await test('24: a late settle above reserve preserves the original counter window and constrains a new reserve', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({
        userDailyCap: reserveAmount,
        globalDailyCap: reserveAmount,
        globalMonthlyCap: reserveAmount,
        providerTimeoutMs: 1_000n,
      });
      const first = allowed(await governor.reserve(input('late-above-reserve', 'late-above-reserve', {
        inputTokensUpperBound: 1n,
        outputTokens: 0n,
      })));
      assert.equal(first.operation.reservedMicrousd, 1n);
      assert.equal(await governor.markDispatching(first.operation.id), true);
      await prisma!.$executeRawUnsafe(
         `UPDATE "AiCostOperation"
             SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '18 seconds',
                 "dispatchedAt" = (now() AT TIME ZONE 'UTC') - interval '17 seconds',
                 "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 second'
          WHERE "id" = $1`,
        first.operation.id
      );
      assert.equal((await governor.settle({
        operationId: first.operation.id,
        usage: { inputTokens: 1n, outputTokens: 20n },
      })).applied, true);
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:late-above-reserve']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: 0n, settledMicrousd: 13n });
      }
      assert.equal(
        (await governor.reserve(input('late-above-reserve', 'late-above-reserve-next'))).decision,
        'DENY_CAP'
      );
    });

    await test('25: missing provider usage settles conservatively at the reserve while retaining a null actual cost', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('missing-usage', 'missing-usage')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal((await governor.settle({ operationId: first.operation.id, usage: null })).applied, true);
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.status, 'SETTLED');
      assert.equal(stored.actualCostMicrousd, null);
      assert.equal(stored.settledMicrousd, reserveAmount);
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:missing-usage']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
      }

      const zeroUsage = allowed(await governor.reserve(input('zero-usage', 'zero-usage')));
      assert.equal(await governor.markDispatching(zeroUsage.operation.id), true);
      assert.equal((await governor.settle({
        operationId: zeroUsage.operation.id,
        usage: { inputTokens: 0n, outputTokens: 0n },
      })).applied, true);
      const zeroUsageStored = await operation(prisma!, zeroUsage.operation.id);
      assert.equal(zeroUsageStored.status, 'SETTLED');
      assert.equal(zeroUsageStored.actualCostMicrousd, null);
      assert.equal(zeroUsageStored.settledMicrousd, zeroUsageStored.reservedMicrousd);
      assert.ok(zeroUsageStored.settledMicrousd > 0n);
      const zeroUsageLedger = await prisma!.$queryRawUnsafe<Array<{ reason: string | null }>>(
        `SELECT "reason" FROM "AiCostLedgerEntry" WHERE "operationId" = $1 AND "entryType" = 'SETTLE'`,
        zeroUsage.operation.id
      );
      assert.equal(zeroUsageLedger.length, 1);
      assert.equal(zeroUsageLedger[0].reason, 'usage_unavailable_conservative_settle');
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: 0n, settledMicrousd: reserveAmount * 2n });
      }
      assert.deepEqual(await counter(prisma!, 'USER_DAY:zero-usage'), {
        reservedMicrousd: 0n,
        settledMicrousd: reserveAmount,
      });
    });

    await test('26: settlement keeps its reserve-time price snapshot after the source version is closed and replaced', async () => {
      await resetCostTables(prisma!);
      const priceAId = await insertFixturePrice(prisma!);
      setFixtureConfig();
      const first = allowed(await governor.reserve(input('price-history', 'price-history')));
      assert.equal(first.operation.priceVersionId, priceAId);
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiModelPrice"
            SET "effectiveTo" = (now() AT TIME ZONE 'UTC'),
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          WHERE "id" = $1`,
        priceAId
      );
      await prisma!.$executeRawUnsafe(
        `INSERT INTO "AiModelPrice" (
           "id", "provider", "model", "calculationVersion", "effectiveFrom", "effectiveTo",
           "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
           "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
           "createdAt", "updatedAt"
         ) VALUES (
           $1, 'openai', 'fixture-mini', 'fixture-v2',
           (now() AT TIME ZONE 'UTC') + interval '1 millisecond', NULL,
           $2::bigint, $3::bigint, 0, 0, 0,
           (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
         )`,
        randomUUID(),
        '1000000',
        '1000000'
      );
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal((await governor.settle({
        operationId: first.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      })).applied, true);
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.actualCostMicrousd, reserveAmount);
      assert.equal(stored.settledMicrousd, reserveAmount);
    });

    await test('27: UTC price windows and dispatch leases are invariant under the configured session timezone', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ globalInflightLimit: 1n, providerTimeoutMs: 1_000n });
      const first = allowed(await governor.reserve(input('utc-window', 'utc-window')));
      const expectedWindows = await prisma!.$queryRawUnsafe<Array<{
        windowStartDay: Date;
        windowStartMonth: Date;
      }>>(
        `SELECT date_trunc('day', now() AT TIME ZONE 'UTC') AS "windowStartDay",
                date_trunc('month', now() AT TIME ZONE 'UTC') AS "windowStartMonth"`
      );
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.windowStartDay.getTime(), expectedWindows[0].windowStartDay.getTime());
      assert.equal(stored.windowStartMonth.getTime(), expectedWindows[0].windowStartMonth.getTime());
      assert.equal(await governor.markDispatching(first.operation.id), true);
      await prisma!.$executeRawUnsafe(
         `UPDATE "AiCostOperation"
             SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '18 seconds',
                 "dispatchedAt" = (now() AT TIME ZONE 'UTC') - interval '17 seconds',
                 "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 second'
          WHERE "id" = $1`,
        first.operation.id
      );
      assert.equal(
        (await governor.reserve(input('utc-window-next', 'utc-window-next'))).decision,
        'ALLOW_RESERVED',
        'the expired lease must be compared against the same UTC clock under every session timezone'
      );
    });

    await test('28: dispatch uses the reserve-time timeout for its stored lease and in-flight count', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ globalInflightLimit: 1n, providerTimeoutMs: 60_000n });
      const first = allowed(await governor.reserve(input('timeout-a', 'timeout-a')));
      assert.equal(first.providerTimeoutMs, 60_000);

      setFixtureConfig({ globalInflightLimit: 1n, providerTimeoutMs: 1_000n });
      assert.equal(await governor.markDispatching(first.operation.id), true);
      const marked = await operation(prisma!, first.operation.id);
      assert.equal(marked.providerTimeoutMs, 60_000n);
      assert.ok(marked.dispatchedAt instanceof Date);
      assert.equal(marked.expiresAt.getTime() - marked.dispatchedAt.getTime(), 75_000);

      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation"
            SET "dispatchedAt" = (now() AT TIME ZONE 'UTC') - interval '20 seconds',
                "expiresAt" = (now() AT TIME ZONE 'UTC') + interval '55 seconds'
          WHERE "id" = $1`,
        first.operation.id
      );
      assert.equal(
        (await governor.reserve(input('timeout-b', 'timeout-b'))).decision,
        'DENY_INFLIGHT',
        'a 60-second reservation remains in-flight at virtual T+20 despite a later one-second config'
      );
    });

    await test('29: markDispatching stops before the reserved TTL boundary guard and allows younger reservations', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const old = allowed(await governor.reserve(input('dispatch-guard', 'dispatch-too-old')));
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation"
            SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '280 seconds',
                "expiresAt" = (now() AT TIME ZONE 'UTC') + interval '20 seconds'
          WHERE "id" = $1`,
        old.operation.id
      );
      assert.equal(await governor.markDispatching(old.operation.id), false);
      assert.equal(await governor.release({ operationId: old.operation.id, reason: 'reserved_not_dispatched' }), true);

      const young = allowed(await governor.reserve(input('dispatch-guard', 'dispatch-young-enough')));
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation"
            SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '200 seconds',
                "expiresAt" = (now() AT TIME ZONE 'UTC') + interval '100 seconds'
          WHERE "id" = $1`,
        young.operation.id
      );
      assert.equal(await governor.markDispatching(young.operation.id), true);
    });

    await test('30: zero input or output token pricing denies without counters or operations', async () => {
      for (const [name, prices] of [
        ['input', { input: 0n, output: outputPrice }],
        ['output', { input: inputPrice, output: 0n }],
      ] as const) {
        await resetCostTables(prisma!); await insertFixturePrice(prisma!, prices); setFixtureConfig();
        assert.equal((await governor.reserve(input(`zero-price-${name}`, `zero-price-${name}`))).decision, 'DENY_UNCONFIGURED');
        assert.equal(await countRows(prisma!, '"AiCostOperation"'), 0n);
        assert.equal(await countRows(prisma!, '"AiCostBudgetCounter"'), 0n);
      }
    });

    await test('31: an expired OUTCOME_UNKNOWN operation still settles with its ledger entry and settled timestamp', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const first = allowed(await governor.reserve(input('unknown-late-settle', 'unknown-late-settle')));
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal(await governor.markOutcomeUnknown(first.operation.id), true);
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation"
            SET "createdAt" = (now() AT TIME ZONE 'UTC') - interval '61 seconds',
                "expiresAt" = (now() AT TIME ZONE 'UTC') - interval '1 minute'
          WHERE "id" = $1`,
        first.operation.id
      );
      assert.equal((await governor.settle({
        operationId: first.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      })).applied, true);
      const stored = await operation(prisma!, first.operation.id);
      assert.equal(stored.status, 'SETTLED');
      assert.equal(stored.settledMicrousd, reserveAmount);
      assert.equal(stored.actualCostMicrousd, reserveAmount);
      assert.ok(stored.settledAt instanceof Date);
      assert.equal(await ledgerEntryCount(prisma!, first.operation.id, 'SETTLE'), 1n);
      for (const scope of ['GLOBAL_MONTH', 'GLOBAL_DAY', 'USER_DAY:unknown-late-settle']) {
        assert.deepEqual(await counter(prisma!, scope), { reservedMicrousd: 0n, settledMicrousd: reserveAmount });
      }
    });

    await test('32: a counter already over cap after an above-reserve settlement denies the next bounded reserve unchanged', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({ userDailyCap: 12n, globalDailyCap: 12n, globalMonthlyCap: 12n });
      const first = allowed(await governor.reserve(input('over-cap-after-settle', 'over-cap-first', {
        inputTokensUpperBound: 1n,
        outputTokens: 0n,
      })));
      assert.equal(first.operation.reservedMicrousd, 1n);
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal((await governor.settle({
        operationId: first.operation.id,
        usage: { inputTokens: 1n, outputTokens: 20n },
      })).applied, true);
      const before = await counter(prisma!, 'USER_DAY:over-cap-after-settle');
      assert.deepEqual(before, { reservedMicrousd: 0n, settledMicrousd: 13n });
      assert.equal((await governor.reserve(input('over-cap-after-settle', 'over-cap-next', {
        inputTokensUpperBound: 1n,
        outputTokens: 0n,
      }))).decision, 'DENY_CAP');
      assert.deepEqual(await counter(prisma!, 'USER_DAY:over-cap-after-settle'), before);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 1n);
    });

    await test('33: one subject/idempotency key keeps its existing operation when token bounds change', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const subjectId = 'idempotency-bounds';
      const key = 'same-key-different-bounds';
      const first = allowed(await governor.reserve(input(subjectId, key)));
      const beforeDuplicate = await counterTriplet(prisma!, subjectId);
      const duplicate = await governor.reserve(input(subjectId, key, {
        inputTokensUpperBound: 999n,
        outputTokens: 1n,
      }));
      assert.equal(duplicate.decision, 'DUPLICATE_IN_PROGRESS');
      assert.deepEqual(await counterTriplet(prisma!, subjectId), beforeDuplicate);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 1n);
      assert.equal(await ledgerEntryCount(prisma!, first.operation.id, 'RESERVE'), 1n);

      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal(await governor.markOutcomeUnknown(first.operation.id), true);
      const unknown = await governor.reserve(input(subjectId, key, {
        inputTokensUpperBound: 1n,
        outputTokens: 999n,
      }));
      assert.equal(unknown.decision, 'OUTCOME_UNKNOWN');
      assert.deepEqual(await counterTriplet(prisma!, subjectId), beforeDuplicate);
      assert.equal(await ledgerEntryCount(prisma!, first.operation.id, 'RESERVE'), 1n);
    });

    await test('34: terminal-ledger database failures roll back settle, release, and unknown transitions completely', async () => {
      const ledgerInsert = (entryType: 'SETTLE' | 'RELEASE' | 'ADJUSTMENT') => oneShotSqlFault(
        'execute',
        (query) => query.includes('INSERT INTO "AiCostLedgerEntry"') && query.includes(`'${entryType}'`)
      );

      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const settleReservation = allowed(await governor.reserve(input('rollback-settle', 'rollback-settle')));
      assert.equal(await governor.markDispatching(settleReservation.operation.id), true);
      const settleBefore = await counterTriplet(prisma!, 'rollback-settle');
      const failingSettle = serviceFor(prisma!, undefined, ledgerInsert('SETTLE'));
      await assert.rejects(
        failingSettle.settle({ operationId: settleReservation.operation.id, usage: { inputTokens: 10n, outputTokens: 20n } }),
        (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE'
      );
      assert.equal((await operation(prisma!, settleReservation.operation.id)).status, 'DISPATCHING');
      assert.deepEqual(await counterTriplet(prisma!, 'rollback-settle'), settleBefore);
      assert.equal(await ledgerEntryCount(prisma!, settleReservation.operation.id, 'SETTLE'), 0n);
      assert.equal((await governor.settle({
        operationId: settleReservation.operation.id,
        usage: { inputTokens: 10n, outputTokens: 20n },
      })).applied, true);
      assert.equal(await ledgerEntryCount(prisma!, settleReservation.operation.id, 'SETTLE'), 1n);

      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const releaseReservation = allowed(await governor.reserve(input('rollback-release', 'rollback-release')));
      const releaseBefore = await counterTriplet(prisma!, 'rollback-release');
      const failingRelease = serviceFor(prisma!, undefined, ledgerInsert('RELEASE'));
      await assert.rejects(
        failingRelease.release({ operationId: releaseReservation.operation.id, reason: 'reserved_not_dispatched' }),
        (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE'
      );
      assert.equal((await operation(prisma!, releaseReservation.operation.id)).status, 'RESERVED');
      assert.deepEqual(await counterTriplet(prisma!, 'rollback-release'), releaseBefore);
      assert.equal(await ledgerEntryCount(prisma!, releaseReservation.operation.id, 'RELEASE'), 0n);
      assert.equal(await governor.release({ operationId: releaseReservation.operation.id, reason: 'reserved_not_dispatched' }), true);
      assert.equal(await ledgerEntryCount(prisma!, releaseReservation.operation.id, 'RELEASE'), 1n);

      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const unknownReservation = allowed(await governor.reserve(input('rollback-unknown', 'rollback-unknown')));
      assert.equal(await governor.markDispatching(unknownReservation.operation.id), true);
      const unknownBefore = await counterTriplet(prisma!, 'rollback-unknown');
      const failingUnknown = serviceFor(prisma!, undefined, ledgerInsert('ADJUSTMENT'));
      await assert.rejects(
        failingUnknown.markOutcomeUnknown(unknownReservation.operation.id),
        (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE'
      );
      assert.equal((await operation(prisma!, unknownReservation.operation.id)).status, 'DISPATCHING');
      assert.deepEqual(await counterTriplet(prisma!, 'rollback-unknown'), unknownBefore);
      assert.equal(await ledgerEntryCount(prisma!, unknownReservation.operation.id, 'ADJUSTMENT'), 0n);
      assert.equal(await governor.markOutcomeUnknown(unknownReservation.operation.id), true);
      assert.equal(await ledgerEntryCount(prisma!, unknownReservation.operation.id, 'ADJUSTMENT'), 1n);
    });

    await test('35: AIRouter plus the real governor settles success and contains dispatch/provider failures', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const successGovernor = serviceFor(prisma!);
      const success = routerIntegrationHarness({ governor: successGovernor });
      const successKey = 'router-success';
      await success.router.createRoutedChatCompletion(routedInputForPostgres(successKey, 'router success'));
      assert.equal(success.sdkRequests.length, 1);
      const successId = await operationIdForKey(prisma!, 'router-subject', successKey);
      assert.equal((await operation(prisma!, successId)).status, 'SETTLED');
      assert.deepEqual(await counterTriplet(prisma!, 'router-subject'), {
        GLOBAL_MONTH: { reservedMicrousd: 0n, settledMicrousd: reserveAmount },
        GLOBAL_DAY: { reservedMicrousd: 0n, settledMicrousd: reserveAmount },
        'USER_DAY:router-subject': { reservedMicrousd: 0n, settledMicrousd: reserveAmount },
      });

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const dispatchFaultGovernor = serviceFor(prisma!, undefined, oneShotSqlFault(
        'query',
        (query) => query.includes('UPDATE "AiCostOperation"') && query.includes("'DISPATCHING'")
      ));
      const dispatchFault = routerIntegrationHarness({ governor: dispatchFaultGovernor });
      const dispatchFaultKey = 'router-dispatch-sql-fault';
      await assert.rejects(
        dispatchFault.router.createRoutedChatCompletion(routedInputForPostgres(dispatchFaultKey, 'dispatch fault')),
        (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE'
      );
      assert.equal(dispatchFault.sdkRequests.length, 0);
      const dispatchFaultId = await operationIdForKey(prisma!, 'router-subject', dispatchFaultKey);
      assert.equal((await operation(prisma!, dispatchFaultId)).status, 'RELEASED');
      for (const value of Object.values(await counterTriplet(prisma!, 'router-subject'))) {
        assert.deepEqual(value, { reservedMicrousd: 0n, settledMicrousd: 0n });
      }

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const clearError = Object.assign(new Error('synthetic clear provider rejection'), { status: 429 });
      const clearFailure = routerIntegrationHarness({ governor: serviceFor(prisma!), providerFailure: clearError });
      const clearKey = 'router-clear-4xx';
      await assert.rejects(clearFailure.router.createRoutedChatCompletion(routedInputForPostgres(clearKey, 'clear failure')), (error) => error === clearError);
      assert.equal(clearFailure.sdkRequests.length, 1);
      assert.equal((await operation(prisma!, await operationIdForKey(prisma!, 'router-subject', clearKey))).status, 'RELEASED');
      for (const value of Object.values(await counterTriplet(prisma!, 'router-subject'))) {
        assert.deepEqual(value, { reservedMicrousd: 0n, settledMicrousd: 0n });
      }

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const ambiguousError = Object.assign(new Error('synthetic ambiguous provider failure'), { status: 503 });
      const ambiguousFailure = routerIntegrationHarness({ governor: serviceFor(prisma!), providerFailure: ambiguousError });
      const ambiguousKey = 'router-ambiguous-5xx';
      await assert.rejects(ambiguousFailure.router.createRoutedChatCompletion(routedInputForPostgres(ambiguousKey, 'ambiguous failure')), (error) => error === ambiguousError);
      assert.equal(ambiguousFailure.sdkRequests.length, 1);
      const ambiguousOperation = await operation(
        prisma!,
        await operationIdForKey(prisma!, 'router-subject', ambiguousKey)
      );
      assert.equal(ambiguousOperation.status, 'OUTCOME_UNKNOWN');
      for (const value of Object.values(await counterTriplet(prisma!, 'router-subject'))) {
        assert.deepEqual(value, { reservedMicrousd: ambiguousOperation.reservedMicrousd, settledMicrousd: 0n });
      }

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const acknowledgmentFaultGovernor = serviceFor(prisma!, undefined, oneShotSqlFault(
        'query',
        (query) => query.includes('UPDATE "AiCostOperation"') && query.includes("'DISPATCHING'"),
        'after'
      ));
      const acknowledgmentFault = routerIntegrationHarness({ governor: acknowledgmentFaultGovernor });
      const acknowledgmentKey = 'router-dispatch-acknowledgment-fault';
      await assert.rejects(acknowledgmentFault.router.createRoutedChatCompletion(
        routedInputForPostgres(acknowledgmentKey, 'acknowledgment fault')
      ));
      assert.equal(acknowledgmentFault.sdkRequests.length, 0);
      const acknowledgmentOperation = await operation(
        prisma!,
        await operationIdForKey(prisma!, 'router-subject', acknowledgmentKey)
      );
      assert.equal(acknowledgmentOperation.status, 'RELEASED');
      for (const value of Object.values(await counterTriplet(prisma!, 'router-subject'))) {
        assert.deepEqual(value, { reservedMicrousd: 0n, settledMicrousd: 0n });
      }
    });

    await test('36: caller-supplied router idempotency key prevents a changed prompt and bound from dispatching twice', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const governorForRouter = serviceFor(prisma!);
      const harness = routerIntegrationHarness({ governor: governorForRouter });
      const key = 'router-same-key-changed-prompt';
      await harness.router.createRoutedChatCompletion(routedInputForPostgres(key, 'first prompt', 20));
      const before = await counterTriplet(prisma!, 'router-subject');
      await assert.rejects(
        harness.router.createRoutedChatCompletion(routedInputForPostgres(key, 'different prompt must not dispatch', 99)),
        (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DUPLICATE_IN_PROGRESS'
      );
      assert.equal(harness.sdkRequests.length, 1);
      assert.deepEqual(await counterTriplet(prisma!, 'router-subject'), before);
      const operationId = await operationIdForKey(prisma!, 'router-subject', key);
      assert.equal(await ledgerEntryCount(prisma!, operationId, 'RESERVE'), 1n);
      assert.equal(await ledgerEntryCount(prisma!, operationId, 'SETTLE'), 1n);
    });

    await test('37: parameterized SQL preserves hostile subject/key text and captured logs omit prompt and API-key markers', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const maliciousSubject = "subject'; DROP TABLE \"AiCostOperation\"; -- Ω";
      const maliciousKey = `${"key'; DROP TABLE \"AiCostLedgerEntry\"; -- ☃"}${'x'.repeat(1_024)}`;
      const maliciousDiagnostics = diagnosticCollector();
      const maliciousReservation = await serviceFor(prisma!, maliciousDiagnostics).reserve(input(maliciousSubject, maliciousKey));
      assert.equal(maliciousReservation.decision, 'ALLOW_RESERVED', JSON.stringify(maliciousDiagnostics.values()));
      const settled = allowed(maliciousReservation);
      assert.equal(await governor.markDispatching(settled.operation.id), true);
      assert.equal((await governor.settle({
        operationId: settled.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      })).applied, true);
      const releasable = allowed(await governor.reserve(input(maliciousSubject, `${maliciousKey}-release`)));
      assert.equal(await governor.release({ operationId: releasable.operation.id, reason: 'reserved_not_dispatched' }), true);
      const preserved = await prisma!.$queryRawUnsafe<Array<{ subjectId: string; idempotencyKey: string }>>(
        `SELECT "subjectId", "idempotencyKey" FROM "AiCostOperation" WHERE "id" = $1`,
        settled.operation.id
      );
      assert.deepEqual(preserved, [{ subjectId: maliciousSubject, idempotencyKey: maliciousKey }]);
      for (const table of ['"AiModelPrice"', '"AiCostOperation"', '"AiCostLedgerEntry"', '"AiCostBudgetCounter"']) {
        assert.ok((await countRows(prisma!, table)) >= 1n, `${table} must remain intact`);
      }

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const promptMarker = 'PROMPT_MARKER_NEVER_LOGGED_V6B';
      const apiKeyMarker = 'API_KEY_MARKER_NEVER_LOGGED_V6B';
      const consoleLines: string[] = [];
      const loggingHarness = routerIntegrationHarness({
        governor: serviceFor(prisma!),
        apiKey: apiKeyMarker,
        consoleLines,
      });
      await loggingHarness.router.createRoutedChatCompletion(routedInputForPostgres('router-log-proof', promptMarker));
      const combinedLogs = consoleLines.join('\n');
      assert.doesNotMatch(combinedLogs, new RegExp(promptMarker));
      assert.doesNotMatch(combinedLogs, new RegExp(apiKeyMarker));
    });

    await test('37b: rejected usage-log persistence reaches console.error without prompt or key disclosure', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      const promptMarker = 'PROMPT_MARKER_NEVER_LOGGED_V7';
      const apiKeyMarker = 'API_KEY_MARKER_NEVER_LOGGED_V7';
      const consoleLines: string[] = [];
      const harness = routerIntegrationHarness({
        governor: serviceFor(prisma!),
        apiKey: apiKeyMarker,
        consoleLines,
        usageLogFailure: new Error('synthetic usage-log persistence rejection'),
      });
      await harness.router.createRoutedChatCompletion(routedInputForPostgres('router-log-reject', promptMarker));
      await new Promise<void>((resolveImmediate) => setImmediate(resolveImmediate));
      const combinedLogs = consoleLines.join('\n');
      assert.match(combinedLogs, /LlmApiUsageLog persist failed/);
      assert.doesNotMatch(combinedLogs, new RegExp(promptMarker));
      assert.doesNotMatch(combinedLogs, new RegExp(apiKeyMarker));
    });

    await test('38: a controlled temporary database clock preserves UTC windows and TTL/lease behavior across midnight', async () => {
      let controlClient: PgClient | undefined;
      let boundaryPrisma: PrismaClient | undefined;
      try {
        controlClient = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
        await controlClient.connect();
        await controlClient.query('CREATE TABLE public."A1ClockControl" ("value" timestamptz NOT NULL)');
        await controlClient.query(`INSERT INTO public."A1ClockControl" ("value") VALUES ('2026-01-31T23:59:59.900Z')`);
        await controlClient.query(
          `CREATE FUNCTION public.now() RETURNS timestamptz LANGUAGE sql STABLE AS
             $$ SELECT "value" FROM public."A1ClockControl" LIMIT 1 $$`
        );
        await controlClient.query(`ALTER DATABASE "postgres" SET search_path TO public, pg_catalog`);
        await controlClient.end();
        controlClient = undefined;

        boundaryPrisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
        await boundaryPrisma.$connect();
        const searchPath = await boundaryPrisma.$queryRawUnsafe<Array<{ search_path: string }>>('SHOW search_path');
        assert.match(searchPath[0].search_path, /^public, pg_catalog$/);
        const setClock = async (iso: string): Promise<void> => {
          await boundaryPrisma!.$executeRawUnsafe(
            'UPDATE public."A1ClockControl" SET "value" = $1::timestamptz',
            iso
          );
        };
        const observedClock = async (): Promise<string> => {
          const rows = await boundaryPrisma!.$queryRawUnsafe<Array<{ instant: string }>>(
            `SELECT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS') AS "instant"`
          );
          return rows[0].instant;
        };
        assert.equal(await observedClock(), '2026-01-31 23:59:59.900');
        const boundaryGovernor = serviceFor(boundaryPrisma);

        await resetCostTables(boundaryPrisma); await insertFixturePrice(boundaryPrisma);
        setFixtureConfig({ globalInflightLimit: 5n });
        const oldWindow = allowed(await boundaryGovernor.reserve(input('boundary-window', 'boundary-old-window')));
        await setClock('2026-02-01T00:00:00.000Z');
        const newWindow = allowed(await boundaryGovernor.reserve(input('boundary-window', 'boundary-new-window')));
        const windowRows = await boundaryPrisma.$queryRawUnsafe<Array<{ id: string; day: string; month: string }>>(
          `SELECT "id", to_char("windowStartDay", 'YYYY-MM-DD HH24:MI:SS.MS') AS "day",
                  to_char("windowStartMonth", 'YYYY-MM-DD HH24:MI:SS.MS') AS "month"
             FROM "AiCostOperation" WHERE "id" IN ($1, $2) ORDER BY "id"`,
          oldWindow.operation.id,
          newWindow.operation.id
        );
        const windows = new Map(windowRows.map((row) => [row.id, row]));
        assert.deepEqual(windows.get(oldWindow.operation.id), {
          id: oldWindow.operation.id,
          day: '2026-01-31 00:00:00.000',
          month: '2026-01-01 00:00:00.000',
        });
        assert.deepEqual(windows.get(newWindow.operation.id), {
          id: newWindow.operation.id,
          day: '2026-02-01 00:00:00.000',
          month: '2026-02-01 00:00:00.000',
        });
        assert.equal(await boundaryGovernor.markDispatching(oldWindow.operation.id), true);
        assert.equal((await boundaryGovernor.settle({
          operationId: oldWindow.operation.id,
          usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
        })).applied, true);
        const oldDayCounter = await boundaryPrisma.$queryRawUnsafe<Array<{
          reservedMicrousd: bigint;
          settledMicrousd: bigint;
        }>>(
          `SELECT "reservedMicrousd", "settledMicrousd" FROM "AiCostBudgetCounter"
            WHERE "scope" = 'USER_DAY:boundary-window'
              AND "windowStart" = timestamp '2026-01-31 00:00:00.000'`
        );
        assert.deepEqual(oldDayCounter, [{ reservedMicrousd: 0n, settledMicrousd: reserveAmount }]);

        await resetCostTables(boundaryPrisma); await setClock('2026-01-31T23:59:59.900Z');
        await insertFixturePrice(boundaryPrisma); setFixtureConfig({ globalInflightLimit: 1n });
        const ttlOperation = allowed(await boundaryGovernor.reserve(input('boundary-ttl', 'boundary-ttl')));
        await setClock('2026-02-01T00:04:59.899Z');
        assert.equal((await boundaryGovernor.reserve(input('boundary-ttl-next', 'boundary-ttl-before-expiry'))).decision, 'DENY_INFLIGHT');
        await setClock('2026-02-01T00:05:00.001Z');
        assert.equal((await boundaryGovernor.reserve(input('boundary-ttl-next', 'boundary-ttl-after-expiry'))).decision, 'ALLOW_RESERVED');
        assert.equal((await operation(boundaryPrisma, ttlOperation.operation.id)).status, 'RESERVED');

        await resetCostTables(boundaryPrisma); await setClock('2026-01-31T23:59:59.900Z');
        await insertFixturePrice(boundaryPrisma); setFixtureConfig({ globalInflightLimit: 1n, providerTimeoutMs: 1_000n });
        const leaseOperation = allowed(await boundaryGovernor.reserve(input('boundary-lease', 'boundary-lease')));
        await setClock('2026-02-01T00:00:00.000Z');
        assert.equal(await boundaryGovernor.markDispatching(leaseOperation.operation.id), true);
        await setClock('2026-02-01T00:00:15.999Z');
        assert.equal((await boundaryGovernor.reserve(input('boundary-lease-next', 'boundary-lease-before-expiry'))).decision, 'DENY_INFLIGHT');
        await setClock('2026-02-01T00:00:16.001Z');
        assert.equal((await boundaryGovernor.reserve(input('boundary-lease-next', 'boundary-lease-after-expiry'))).decision, 'ALLOW_RESERVED');
      } finally {
        if (boundaryPrisma) await boundaryPrisma.$disconnect();
        if (controlClient) await controlClient.end();
      }
    });

    await test('39: settlement uses immutable reserve-time price snapshots after the source price is mutated', async () => {
      await resetCostTables(prisma!);
      const priceId = await insertFixturePrice(prisma!);
      setFixtureConfig();
      const first = allowed(await governor.reserve(input('snapshot-price', 'snapshot-price')));
      const reserved = await operation(prisma!, first.operation.id);
      assert.equal(reserved.inputMicrousdPerMillionTokens, inputPrice);
      assert.equal(reserved.outputMicrousdPerMillionTokens, outputPrice);
      assert.equal(first.operation.priceVersionId, priceId);
      const zeroSnapshot = await prisma!.$executeRawUnsafe(
        'UPDATE "AiCostOperation" SET "inputMicrousdPerMillionTokens" = 0 WHERE "id" = $1',
        first.operation.id
      );
      assert.equal(zeroSnapshot, 1, 'zero is valid for a price dimension not charged by a unit operation');
      await prisma!.$executeRawUnsafe(
        'UPDATE "AiCostOperation" SET "inputMicrousdPerMillionTokens" = $2::bigint WHERE "id" = $1',
        first.operation.id,
        inputPrice.toString()
      );
      await assert.rejects(prisma!.$executeRawUnsafe(
        'UPDATE "AiCostOperation" SET "providerTimeoutMs" = 0 WHERE "id" = $1',
        first.operation.id
      ));
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiModelPrice"
            SET "inputMicrousdPerMillionTokens" = 0,
                "outputMicrousdPerMillionTokens" = 0,
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          WHERE "id" = $1`,
        priceId
      );
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiModelPrice"
            SET "inputMicrousdPerMillionTokens" = 999999,
                "outputMicrousdPerMillionTokens" = 888888,
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          WHERE "id" = $1`,
        priceId
      );
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal((await governor.settle({
        operationId: first.operation.id,
        usage: { inputTokens: reserveInputTokens, outputTokens: reserveOutputTokens },
      })).applied, true);
      const settled = await operation(prisma!, first.operation.id);
      assert.equal(settled.actualCostMicrousd, reserveAmount);
      assert.equal(settled.settledMicrousd, reserveAmount);
    });

    await test('40: duplicate idempotency resolves before config or current price lookup', async () => {
      await resetCostTables(prisma!);
      const priceId = await insertFixturePrice(prisma!);
      setFixtureConfig();
      const subjectId = 'idempotency-before-config';
      const key = 'idempotency-before-config';
      const first = allowed(await governor.reserve(input(subjectId, key)));
      const before = await counterTriplet(prisma!, subjectId);
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiModelPrice" SET "effectiveTo" = (now() AT TIME ZONE 'UTC') WHERE "id" = $1`,
        priceId
      );
      clearFixtureConfig();
      const duplicate = await governor.reserve(input(subjectId, key));
      assert.equal(duplicate.decision, 'DUPLICATE_IN_PROGRESS');
      assert.deepEqual(await counterTriplet(prisma!, subjectId), before);
      assert.equal((await governor.reserve(input(subjectId, 'new-key-without-config'))).decision, 'DENY_UNCONFIGURED');

      setFixtureConfig();
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal(await governor.markOutcomeUnknown(first.operation.id), true);
      clearFixtureConfig();
      assert.equal((await governor.reserve(input(subjectId, key))).decision, 'OUTCOME_UNKNOWN');
      assert.deepEqual(await counterTriplet(prisma!, subjectId), before);
    });

    await test('41: ViralWrapEngine real governor ordering settles, releases, preserves unknown, and never double-dispatches', async () => {
      const fixedKeyGovernor = (delegate: CostGovernorService, idempotencyKey: string): CostGovernor => ({
        createServerIdempotencyKey: () => idempotencyKey,
        reserve: (request) => delegate.reserve(request),
        markDispatching: (operationId) => delegate.markDispatching(operationId),
        settle: (request) => delegate.settle(request),
        release: (request) => delegate.release(request),
        markOutcomeUnknown: (operationId) => delegate.markOutcomeUnknown(operationId),
      });

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'fixture-mini' }); setFixtureConfig();
      const success = viralIntegrationHarness({ governor: fixedKeyGovernor(serviceFor(prisma!), 'viral-success') });
      await success.viral.generateUserTripSummary('viral-subject', 'viral-trip-1');
      assert.equal(success.sdkRequests.length, 1);
      assert.equal((await operation(prisma!, await operationIdForKey(prisma!, 'viral-subject', 'viral-success'))).status, 'SETTLED');

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'fixture-mini' }); setFixtureConfig();
      const rejected429 = Object.assign(new Error('synthetic viral 429'), { status: 429 });
      const clearFailure = viralIntegrationHarness({
        governor: fixedKeyGovernor(serviceFor(prisma!), 'viral-429'), providerFailure: rejected429,
      });
      await assert.rejects(clearFailure.viral.generateUserTripSummary('viral-subject', 'viral-trip-1'), (error) => error === rejected429);
      assert.equal(clearFailure.sdkRequests.length, 1);
      assert.equal((await operation(prisma!, await operationIdForKey(prisma!, 'viral-subject', 'viral-429'))).status, 'RELEASED');

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'fixture-mini' }); setFixtureConfig();
      const unknownFailure = Object.assign(new Error('synthetic viral 503'), { status: 503 });
      const unknown = viralIntegrationHarness({
        governor: fixedKeyGovernor(serviceFor(prisma!), 'viral-503'), providerFailure: unknownFailure,
      });
      await assert.rejects(unknown.viral.generateUserTripSummary('viral-subject', 'viral-trip-1'), (error) => error === unknownFailure);
      assert.equal(unknown.sdkRequests.length, 1);
      assert.equal((await operation(prisma!, await operationIdForKey(prisma!, 'viral-subject', 'viral-503'))).status, 'OUTCOME_UNKNOWN');

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'fixture-mini' });
      setFixtureConfig({ providerTimeoutMs: 20n });
      const timeout = viralIntegrationHarness({
        governor: fixedKeyGovernor(serviceFor(prisma!), 'viral-timeout'), awaitAbort: true,
      });
      await assert.rejects(timeout.viral.generateUserTripSummary('viral-subject', 'viral-trip-1'), /synthetic viral provider timeout/);
      assert.equal(timeout.sdkRequests.length, 1);
      assert.equal((await operation(prisma!, await operationIdForKey(prisma!, 'viral-subject', 'viral-timeout'))).status, 'OUTCOME_UNKNOWN');

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'fixture-mini' }); setFixtureConfig();
      const dispatchFault = viralIntegrationHarness({
        governor: fixedKeyGovernor(serviceFor(prisma!, undefined, oneShotSqlFault(
          'query',
          (query) => query.includes('UPDATE "AiCostOperation"') && query.includes("'DISPATCHING'")
        )), 'viral-dispatch-fault'),
      });
      await assert.rejects(dispatchFault.viral.generateUserTripSummary('viral-subject', 'viral-trip-1'));
      assert.equal(dispatchFault.sdkRequests.length, 0);
      assert.equal((await operation(prisma!, await operationIdForKey(prisma!, 'viral-subject', 'viral-dispatch-fault'))).status, 'RELEASED');

      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'fixture-mini' }); setFixtureConfig();
      const sameKey = 'viral-unknown-same-key';
      const firstFailure = Object.assign(new Error('synthetic viral lost response'), { status: 503 });
      const first = viralIntegrationHarness({
        governor: fixedKeyGovernor(serviceFor(prisma!), sameKey), providerFailure: firstFailure,
      });
      await assert.rejects(first.viral.generateUserTripSummary('viral-subject', 'viral-trip-1'), (error) => error === firstFailure);
      const retry = viralIntegrationHarness({ governor: fixedKeyGovernor(serviceFor(prisma!), sameKey) });
      await assert.rejects(retry.viral.generateUserTripSummary('viral-subject', 'viral-trip-1'));
      assert.equal(first.sdkRequests.length, 1);
      assert.equal(retry.sdkRequests.length, 0);
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 1n);
    });

    await test('42: a held operation-row lock makes dispatch fail closed before the router sends a provider request', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      diagnostics.clear();
      const transactionOptions: GovernorTransactionOptions[] = [];
      const delegate = serviceFor(prisma!, diagnostics, undefined, transactionOptions);
      let locker: PgClient | undefined;
      let releaseTimer: NodeJS.Timeout | undefined;
      const lockGovernor: CostGovernor = {
        createServerIdempotencyKey: () => 'router-lock-timeout',
        reserve: async (request) => {
          const reservation = await delegate.reserve(request);
          if (reservation.decision !== 'ALLOW_RESERVED') return reservation;
          locker = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
          await locker.connect();
          await locker.query('BEGIN');
          await locker.query('SELECT "id" FROM "AiCostOperation" WHERE "id" = $1 FOR UPDATE', [reservation.operation.id]);
          releaseTimer = setTimeout(() => {
            void locker?.query('ROLLBACK').catch(() => undefined);
          }, 6_000);
          return reservation;
        },
        markDispatching: (operationId) => delegate.markDispatching(operationId),
        settle: (request) => delegate.settle(request),
        release: (request) => delegate.release(request),
        markOutcomeUnknown: (operationId) => delegate.markOutcomeUnknown(operationId),
      };
      const harness = routerIntegrationHarness({ governor: lockGovernor });
      const startedAt = Date.now();
      try {
        await assert.rejects(
          harness.router.createRoutedChatCompletion(routedInputForPostgres('router-lock-timeout', 'lock timeout')),
          (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE'
        );
        const elapsedMs = Date.now() - startedAt;
        assert.ok(elapsedMs >= 4_500 && elapsedMs < 7_500, `dispatch/release elapsed ${elapsedMs}ms outside expected lock-guard range`);
        const lockDiagnostic = diagnostics.values().find((entry) => entry.sqlState === '55P03');
        assert.ok(lockDiagnostic, `expected SQLSTATE 55P03, got ${JSON.stringify(diagnostics.values())}`);
        assert.match(lockDiagnostic.message, /lock timeout|lock_not_available/i);
        assert.ok(!diagnostics.values().some((entry) => entry.prismaCode === 'P2028'), 'the DB lock timeout must occur before the Prisma transaction timeout');
        assert.deepEqual(transactionOptions, Array.from({ length: 3 }, () => ({ maxWait: 5_000, timeout: 20_000 })));
        console.log(`[diagnostic] scenario-42 SQLSTATE ${lockDiagnostic.sqlState} elapsed ${elapsedMs}ms`);
        assert.equal(harness.sdkRequests.length, 0, 'no provider SDK request may follow a lock timeout');
        const operationId = await operationIdForKey(prisma!, 'router-subject', 'router-lock-timeout');
        assert.equal((await operation(prisma!, operationId)).status, 'RELEASED');
      } finally {
        if (releaseTimer) clearTimeout(releaseTimer);
        if (locker) {
          try { await locker.query('ROLLBACK'); } catch { /* the timer may have released it */ }
          await locker.end();
        }
      }
    });

    await test('47: dispatched settlement lock timeout is 55P03 before P2028 and preserves the reservation', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      diagnostics.clear();
      const transactionOptions: GovernorTransactionOptions[] = [];
      const delegate = serviceFor(prisma!, diagnostics, undefined, transactionOptions);
      const subjectId = 'transaction-timeout-subject';
      const reservation = allowed(await delegate.reserve(input(subjectId, 'transaction-timeout-dispatched')));
      assert.equal(await delegate.markDispatching(reservation.operation.id), true);
      const counterBefore = await counterTriplet(prisma!, subjectId);
      const reserveEntriesBefore = await ledgerEntryCount(prisma!, reservation.operation.id, 'RESERVE');
      const settleEntriesBefore = await ledgerEntryCount(prisma!, reservation.operation.id, 'SETTLE');
      const releaseEntriesBefore = await ledgerEntryCount(prisma!, reservation.operation.id, 'RELEASE');

      let locker: PgClient | undefined;
      try {
        locker = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
        await locker.connect();
        await locker.query('BEGIN');
        await locker.query('SELECT "id" FROM "AiCostOperation" WHERE "id" = $1 FOR UPDATE', [reservation.operation.id]);

        const startedAt = Date.now();
        await assert.rejects(
          delegate.settle({
            operationId: reservation.operation.id,
            usage: { inputTokens: 10n, outputTokens: 5n },
          }),
          (error: unknown) => (error as Readonly<{ code?: string }>).code === 'COST_GOVERNOR_DENY_LEDGER_UNAVAILABLE'
        );
        const elapsedMs = Date.now() - startedAt;
        assert.ok(elapsedMs >= 4_500 && elapsedMs < 8_000, `settle elapsed ${elapsedMs}ms outside the PostgreSQL lock-timeout window`);
        const lockDiagnostic = diagnostics.values().find((entry) => entry.sqlState === '55P03');
        assert.ok(lockDiagnostic, `expected SQLSTATE 55P03, got ${JSON.stringify(diagnostics.values())}`);
        assert.match(lockDiagnostic.message, /lock timeout|lock_not_available/i);
        assert.ok(!diagnostics.values().some((entry) => entry.prismaCode === 'P2028'), 'the DB lock timeout must occur before the Prisma transaction timeout');
        assert.deepEqual(transactionOptions, Array.from({ length: 3 }, () => ({ maxWait: 5_000, timeout: 20_000 })));

        const operationAfter = await operation(prisma!, reservation.operation.id);
        assert.equal(operationAfter.status, 'DISPATCHING');
        assert.equal(operationAfter.settledMicrousd, 0n);
        assert.deepEqual(await counterTriplet(prisma!, subjectId), counterBefore);
        assert.equal(await ledgerEntryCount(prisma!, reservation.operation.id, 'RESERVE'), reserveEntriesBefore);
        assert.equal(await ledgerEntryCount(prisma!, reservation.operation.id, 'SETTLE'), settleEntriesBefore);
        assert.equal(await ledgerEntryCount(prisma!, reservation.operation.id, 'RELEASE'), releaseEntriesBefore);
        console.log(`[diagnostic] scenario-47 SQLSTATE ${lockDiagnostic.sqlState} elapsed ${elapsedMs}ms; DISPATCHING reservation unchanged`);
      } finally {
        if (locker) {
          try { await locker.query('ROLLBACK'); } catch { /* the transaction may already be closed */ }
          await locker.end();
        }
      }
    });

    await test('48: ambiguous markDispatching commit (wrapper throws after DB commit) keeps DISPATCHING, refuses release, and makes no provider call', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-mini' }); setFixtureConfig();
      diagnostics.clear();
      const subjectId = 'router-subject';
      const idempotencyKey = 'router-ambiguous-dispatch-commit';
      const delegate = serviceFor(prisma!, diagnostics);
      let counterAfterDispatch: Awaited<ReturnType<typeof counterTriplet>> | undefined;
      const wrapperError = Object.assign(new Error('Transaction already closed: ...'), {
        name: 'PrismaClientKnownRequestError',
        code: 'P2028',
      });
      const wrapper: CostGovernor = {
        createServerIdempotencyKey: () => idempotencyKey,
        reserve: (request) => delegate.reserve(request),
        markDispatching: async (operationId) => {
          assert.equal(await delegate.markDispatching(operationId), true);
          counterAfterDispatch = await counterTriplet(prisma!, subjectId);
          throw wrapperError;
        },
        settle: (request) => delegate.settle(request),
        release: (request) => delegate.release(request),
        markOutcomeUnknown: (operationId) => delegate.markOutcomeUnknown(operationId),
      };
      const harness = routerIntegrationHarness({ governor: wrapper });

      await assert.rejects(
        harness.router.createRoutedChatCompletion(
          routedInputForPostgres(idempotencyKey, 'ambiguous dispatch commit')
        )
      );
      assert.equal(harness.sdkRequests.length, 0);
      const operationId = await operationIdForKey(prisma!, subjectId, idempotencyKey);
      const stored = await operation(prisma!, operationId);
      assert.equal(stored.status, 'DISPATCHING');
      assert.equal(stored.settledMicrousd, 0n);
      assert.ok(counterAfterDispatch, 'expected a counter snapshot after the real dispatch commit');
      assert.deepEqual(await counterTriplet(prisma!, subjectId), counterAfterDispatch);
      assert.equal(await ledgerEntryCount(prisma!, operationId, 'RELEASE'), 0n);
      assert.equal(await ledgerEntryCount(prisma!, operationId, 'SETTLE'), 0n);
    });

    await test('43: duplicate RESERVED and UNKNOWN operations win over invalid replay bounds without money movement', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const subjectId = 'idempotency-invalid-replay';
      const key = 'idempotency-invalid-replay';
      const first = allowed(await governor.reserve(input(subjectId, key)));
      const beforeReserved = await counterTriplet(prisma!, subjectId);
      const beforeReservedLedger = await countRows(prisma!, '"AiCostLedgerEntry"');
      for (const invalidBounds of [
        { inputTokensUpperBound: -1n },
        { outputTokens: -1n },
      ]) {
        const duplicate = await governor.reserve(input(subjectId, key, invalidBounds));
        assert.equal(duplicate.decision, 'DUPLICATE_IN_PROGRESS');
        assert.deepEqual(await counterTriplet(prisma!, subjectId), beforeReserved);
        assert.equal(await countRows(prisma!, '"AiCostLedgerEntry"'), beforeReservedLedger);
      }
      assert.equal(await governor.markDispatching(first.operation.id), true);
      assert.equal(await governor.markOutcomeUnknown(first.operation.id), true);
      const beforeUnknown = await counterTriplet(prisma!, subjectId);
      const beforeUnknownLedger = await countRows(prisma!, '"AiCostLedgerEntry"');
      for (const invalidBounds of [
        { inputTokensUpperBound: -1n },
        { outputTokens: -1n },
      ]) {
        const duplicate = await governor.reserve(input(subjectId, key, invalidBounds));
        assert.equal(duplicate.decision, 'OUTCOME_UNKNOWN');
        assert.deepEqual(await counterTriplet(prisma!, subjectId), beforeUnknown);
        assert.equal(await countRows(prisma!, '"AiCostLedgerEntry"'), beforeUnknownLedger);
      }
      for (const invalidBounds of [
        { inputTokensUpperBound: -1n },
        { outputTokens: -1n },
      ]) {
        const fresh = await governor.reserve(input(subjectId, `fresh-${Object.keys(invalidBounds)[0]}`, invalidBounds));
        assert.equal(fresh.decision, 'DENY_POLICY');
      }
      assert.deepEqual(await counterTriplet(prisma!, subjectId), beforeUnknown);
      assert.equal(await countRows(prisma!, '"AiCostLedgerEntry"'), beforeUnknownLedger);
    });

    await test('45: cap values at PostgreSQL BIGINT max reserve, while one above denies before price or counter SQL', async () => {
      const postgresBigintMax = 9_223_372_036_854_775_807n;
      await resetCostTables(prisma!); await insertFixturePrice(prisma!);
      setFixtureConfig({
        userDailyCap: postgresBigintMax,
        globalDailyCap: postgresBigintMax,
        globalMonthlyCap: postgresBigintMax,
      });
      assert.equal(readCostGovernorConfig()?.userDailyCapMicrousd, postgresBigintMax);
      assert.equal((await governor.reserve(input('bigint-at-boundary', 'bigint-at-boundary'))).decision, 'ALLOW_RESERVED');
      for (const [label, overflow] of [
        ['userDailyCap', { userDailyCap: postgresBigintMax + 1n }],
        ['globalDailyCap', { globalDailyCap: postgresBigintMax + 1n }],
        ['globalMonthlyCap', { globalMonthlyCap: postgresBigintMax + 1n }],
      ] as const) {
        await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig(overflow);
        assert.equal(readCostGovernorConfig(), null, `${label} overflow must be rejected before SQL cap binding`);
        const denied = await governor.reserve(input(`bigint-overflow-${label}`, `bigint-overflow-${label}`));
        assert.equal(denied.decision, 'DENY_UNCONFIGURED');
        assert.equal(await countRows(prisma!, '"AiCostOperation"'), 0n);
        assert.equal(await countRows(prisma!, '"AiCostBudgetCounter"'), 0n);
      }
    });

    await test('49: token chat settles actual usage while TTS and STT settle at their unit reserve', async () => {
      await resetCostTables(prisma!);
      const seeded = await seedLaneBModelPrices(prisma!);
      assert.equal(seeded.length, 4);
      setFixtureConfig();

      const chat = allowed(await governor.reserve(input('laneb-chat', 'laneb-chat', { model: 'gpt-4o-mini' })));
      assert.equal(chat.operation.reservedMicrousd, 14n);
      assert.equal(chat.operation.inputMicrousdPerMillionTokens, 150000n);
      assert.equal(chat.operation.outputMicrousdPerMillionTokens, 600000n);
      assert.equal(await governor.markDispatching(chat.operation.id), true);
      const chatSettled = await governor.settle({
        operationId: chat.operation.id,
        usage: { inputTokens: 2n, outputTokens: 4n },
      });
      assert.equal(chatSettled.operation.settledMicrousd, 3n);
      assert.equal((await operation(prisma!, chat.operation.id)).actualCostMicrousd, 3n);
      assert.equal(await counter(prisma!, 'USER_DAY:laneb-chat').then((value) => value.settledMicrousd), 3n);

      const tts = allowed(await governor.reserve(input('laneb-tts', 'laneb-tts', {
        model: 'gpt-4o-mini-tts', operationKind: 'TTS', inputTokensUpperBound: 10n, outputTokens: 0n,
      })));
      assert.equal(tts.operation.reservedMicrousd, 6n);
      assert.equal(tts.operation.inputMicrousdPerMillionTokens, 600000n);
      assert.equal(tts.operation.outputMicrousdPerMillionTokens, 0n);
      assert.equal(await governor.markDispatching(tts.operation.id), true);
      const ttsSettled = await governor.settle({
        operationId: tts.operation.id,
        usage: { inputTokens: 8n, outputTokens: 0n },
      });
      assert.equal(ttsSettled.operation.settledMicrousd, 6n);
      assert.equal((await operation(prisma!, tts.operation.id)).actualCostMicrousd, null);
      assert.equal(await counter(prisma!, 'USER_DAY:laneb-tts').then((value) => value.settledMicrousd), 6n);

      const stt = allowed(await governor.reserve(input('laneb-stt', 'laneb-stt', {
        model: 'gpt-4o-transcribe', operationKind: 'STT',
        inputTokensUpperBound: 0n, outputTokens: 0n, audioSecondsUpperBound: 3n,
      })));
      assert.equal(stt.operation.reservedMicrousd, 300n);
      assert.equal(stt.operation.inputMicrousdPerMillionTokens, 0n);
      assert.equal(stt.operation.outputMicrousdPerMillionTokens, 0n);
      assert.equal(stt.operation.audioInputMicrousdPerSecond, 100n);
      assert.equal(stt.operation.audioOutputMicrousdPerSecond, 0n);
      assert.equal(await governor.markDispatching(stt.operation.id), true);
      const sttSettled = await governor.settle({ operationId: stt.operation.id });
      assert.equal(sttSettled.operation.settledMicrousd, 300n);
      assert.equal((await operation(prisma!, stt.operation.id)).actualCostMicrousd, null);
      assert.equal(await counter(prisma!, 'USER_DAY:laneb-stt').then((value) => value.settledMicrousd), 300n);
    });

    await test('50: a zero computed reserve denies without creating an operation or counter', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!); setFixtureConfig();
      const result = await governor.reserve(input('laneb-zero', 'laneb-zero', {
        inputTokensUpperBound: 0n,
        outputTokens: 0n,
      }));
      assert.equal(result.decision, 'DENY_POLICY');
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 0n);
      assert.equal(await countRows(prisma!, '"AiCostBudgetCounter"'), 0n);
    });

    await test('51: a missing STT audio-second rate denies before creating an operation or counter', async () => {
      await resetCostTables(prisma!); await insertFixturePrice(prisma!, { model: 'gpt-4o-transcribe' }); setFixtureConfig();
      const result = await governor.reserve(input('laneb-stt-missing-rate', 'laneb-stt-missing-rate', {
        model: 'gpt-4o-transcribe',
        operationKind: 'STT',
        inputTokensUpperBound: 0n,
        outputTokens: 0n,
        audioSecondsUpperBound: 2n,
      }));
      assert.equal(result.decision, 'DENY_UNCONFIGURED');
      assert.equal(await countRows(prisma!, '"AiCostOperation"'), 0n);
      assert.equal(await countRows(prisma!, '"AiCostBudgetCounter"'), 0n);
    });

    console.log(`\n${passed} PostgreSQL scenarios passed with independent Prisma transactions, a 60-connection pool, and ${testTimeZone}.`);
  } finally {
    if (prisma) await runPhase('prisma.$disconnect', () => prisma!.$disconnect()).catch(() => undefined);
    if (pg) await runPhase('pg.end during cleanup', () => pg!.end()).catch(() => undefined);
    await runPhase('server.stop during cleanup', () => server.stop()).catch(() => undefined);
    await runPhase('forceStopTemporaryPostgres', () => forceStopTemporaryPostgres(dataDir));
  }
}

void main().then(
  () => process.exit(0),
  (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message.replace(/postgresql:\/\/[^\s@]+@/gi, 'postgresql://<temporary>@'));
    process.exit(1);
  }
);
