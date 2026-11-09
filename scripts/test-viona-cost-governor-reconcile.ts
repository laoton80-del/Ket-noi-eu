/**
 * PostgreSQL tests for bounded A1 orphan reconciliation.
 *
 * The script starts a disposable loopback cluster below VIONA_TEST_PG_TOOLS_DIR
 * and applies only the reviewed A1 migration SQL. It never reads .env or uses
 * a configured application database.
 */
import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { PrismaClient } from '@prisma/client';

import {
  COST_GOVERNOR_ENV_NAMES,
  CostGovernorService,
  type CostGovernorReserveInput,
} from '../src/services/ai/CostGovernorService';

const execFile = promisify(execFileCallback);
const root = resolve(__dirname, '..');
const A1_MIGRATIONS = [
  resolve(root, 'prisma', 'migrations', '20261103000000_ai_cost_governor', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261104000000_ai_cost_receipt_inflight', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261104010000_ai_cost_price_unit_per_million', 'migration.sql'),
  resolve(root, 'prisma', 'migrations', '20261105000000_ai_cost_operation_snapshots', 'migration.sql'),
] as const;
const INPUT_PRICE = 150_000n;
const OUTPUT_PRICE = 600_000n;
const INPUT_TOKENS = 10n;
const OUTPUT_TOKENS = 20n;
const RESERVE_AMOUNT = 14n;
const PHASE_TIMEOUT_MS = 60_000;
const testTimeZone = process.env.VIONA_TEST_PG_TIME_ZONE ?? 'UTC';
if (!['UTC', 'Europe/Prague', 'Pacific/Auckland'].includes(testTimeZone)) {
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
type CounterRow = Readonly<{ reservedMicrousd: bigint; settledMicrousd: bigint }>;
type OperationRow = Readonly<{
  status: string;
  reservedMicrousd: bigint;
  settledMicrousd: bigint;
  actualCostMicrousd: bigint | null;
  dispatchedAt: Date | null;
  expiresAt: Date;
}>;

let passed = 0;
let toolRoot: string | undefined;

function requiredToolRoot(): string {
  if (!toolRoot) throw new Error('VIONA_TEST_PG_TOOLS_DIR must name the approved local pg-test tools directory');
  return toolRoot;
}

function assertTemporaryDataDir(dataDir: string): void {
  const containment = relative(requiredToolRoot(), dataDir);
  if (!containment || containment === '..' || containment.startsWith(`..${sep}`)) {
    throw new Error('Temporary PostgreSQL data directory escaped the approved tool directory');
  }
}

async function runPhase<T>(name: string, work: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  console.log(`[phase] ${name} start`);
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out during ${name} after ${PHASE_TIMEOUT_MS} ms`)), PHASE_TIMEOUT_MS);
    });
    const result = await Promise.race([work(), timeout]);
    console.log(`[phase] ${name} completed in ${Date.now() - startedAt} ms`);
    return result;
  } finally {
    if (timer) clearTimeout(timer);
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
  assertTemporaryDataDir(dataDir);
  const pidPath = join(dataDir, 'postmaster.pid');
  if (existsSync(pidPath)) {
    const raw = await fs.readFile(pidPath, 'utf8');
    const pid = raw.split(/\r?\n/, 1)[0];
    if (!/^\d+$/.test(pid)) throw new Error('Temporary PostgreSQL postmaster pid was malformed');
    try {
      if (process.platform === 'win32') {
        await execFile('taskkill.exe', ['/PID', pid, '/T', '/F'], { windowsHide: true });
      } else {
        process.kill(Number(pid), 'SIGTERM');
      }
    } catch {
      // The embedded server may already have stopped.
    }
    for (let attempt = 0; attempt < 50 && existsSync(pidPath); attempt += 1) {
      await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 100));
    }
    if (existsSync(pidPath)) throw new Error('Temporary PostgreSQL did not stop; its data directory was preserved');
  }
  await fs.rm(dataDir, { recursive: true, force: true });
}

async function applyA1Migrations(client: PgClient): Promise<void> {
  for (const migrationPath of A1_MIGRATIONS) {
    const sql = await fs.readFile(migrationPath, 'utf8');
    await client.query(sql);
  }
}

function setFixtureConfig(overrides: Readonly<{
  userDailyCap?: bigint;
  globalDailyCap?: bigint;
  globalMonthlyCap?: bigint;
  userInflightLimit?: bigint;
  globalInflightLimit?: bigint;
  providerTimeoutMs?: bigint;
}> = {}): void {
  const values = {
    userDailyCap: 1_000n,
    globalDailyCap: 10_000n,
    globalMonthlyCap: 100_000n,
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

function reserveInput(subjectId: string, idempotencyKey: string): CostGovernorReserveInput {
  return {
    subjectId,
    idempotencyKey,
    rail: 'EXPRESS',
    provider: 'openai',
    model: 'recon-fixture-mini',
    operationKind: 'RECON_TEST',
    inputTokensUpperBound: INPUT_TOKENS,
    outputTokens: OUTPUT_TOKENS,
  };
}

async function reserveOne(governor: CostGovernorService, subjectId: string, key: string): Promise<string> {
  const result = await governor.reserve(reserveInput(subjectId, key));
  if (result.decision !== 'ALLOW_RESERVED') throw new Error(`Reservation denied for ${key}: ${result.decision}`);
  return result.operation.id;
}

async function resetCostTables(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "AiCostLedgerEntry", "AiCostOperation", "AiCostBudgetCounter", "AiModelPrice" CASCADE'
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AiModelPrice" (
       "id", "provider", "model", "calculationVersion", "effectiveFrom", "effectiveTo",
       "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
       "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
       "createdAt", "updatedAt"
     ) VALUES (
       $1, 'openai', 'recon-fixture-mini', 'recon-test-v1',
       (clock_timestamp() AT TIME ZONE 'UTC') - interval '1 minute', NULL,
       $2::bigint, $3::bigint, 0, 0, 0,
       (clock_timestamp() AT TIME ZONE 'UTC'), (clock_timestamp() AT TIME ZONE 'UTC')
     )`,
    randomUUID(),
    INPUT_PRICE.toString(),
    OUTPUT_PRICE.toString()
  );
}

async function setExpired(prisma: PrismaClient, operationId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "AiCostOperation"
        SET "createdAt" = (clock_timestamp() AT TIME ZONE 'UTC') - interval '6 minutes',
            "expiresAt" = (clock_timestamp() AT TIME ZONE 'UTC') - interval '1 second'
      WHERE "id" = $1`,
    operationId
  );
}

async function operation(prisma: PrismaClient, operationId: string): Promise<OperationRow> {
  const rows = await prisma.$queryRawUnsafe<ReadonlyArray<OperationRow>>(
    `SELECT "status", "reservedMicrousd", "settledMicrousd", "actualCostMicrousd", "dispatchedAt", "expiresAt"
       FROM "AiCostOperation" WHERE "id" = $1`,
    operationId
  );
  assert.equal(rows.length, 1, `expected operation ${operationId}`);
  return rows[0];
}

async function counter(prisma: PrismaClient, scope: string): Promise<CounterRow> {
  const rows = await prisma.$queryRawUnsafe<ReadonlyArray<CounterRow>>(
    `SELECT "reservedMicrousd", "settledMicrousd" FROM "AiCostBudgetCounter"
      WHERE "scope" = $1 ORDER BY "windowStart" DESC LIMIT 1`,
    scope
  );
  assert.equal(rows.length, 1, `expected counter ${scope}`);
  return rows[0];
}

async function ledgerCount(prisma: PrismaClient, operationId: string, entryType: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<ReadonlyArray<{ count: bigint }>>(
    `SELECT count(*)::bigint AS "count" FROM "AiCostLedgerEntry"
      WHERE "operationId" = $1 AND "entryType" = $2`,
    operationId,
    entryType
  );
  return Number(rows[0]?.count ?? 0n);
}

async function ledgerReason(prisma: PrismaClient, operationId: string, entryType: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<ReadonlyArray<{ reason: string | null }>>(
    `SELECT "reason" FROM "AiCostLedgerEntry"
      WHERE "operationId" = $1 AND "entryType" = $2`,
    operationId,
    entryType
  );
  return rows[0]?.reason ?? null;
}

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
  const dataDir = resolve(requiredToolRoot(), `data-a1-recon-${randomUUID()}`);
  assertTemporaryDataDir(dataDir);
  const user = 'cost_governor_recon_fixture';
  const password = randomUUID();
  const databaseUrl = `postgresql://${user}:${encodeURIComponent(password)}@127.0.0.1:${port}/postgres?connection_limit=30&pool_timeout=30`;
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
  let pg: PgClient | undefined;
  let prisma: PrismaClient | undefined;
  const originalEnv = new Map<string, string | undefined>();
  for (const name of Object.values(COST_GOVERNOR_ENV_NAMES)) originalEnv.set(name, process.env[name]);

  try {
    await runPhase('server.initialise', () => server.initialise());
    await runPhase('server.start', () => server.start());
    pg = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
    await runPhase('pg.connect', () => pg!.connect());
    const timeZoneRows = await pg.query('SHOW TimeZone');
    const observedTimeZone = String(timeZoneRows.rows[0]?.TimeZone ?? '');
    assert.equal(observedTimeZone, testTimeZone, 'temporary PostgreSQL timezone must match the requested matrix timezone');
    const encodingRows = await pg.query('SHOW SERVER_ENCODING');
    assert.equal(String(encodingRows.rows[0]?.server_encoding ?? ''), 'UTF8', 'temporary PostgreSQL must use UTF8');
    await runPhase('applyA1Migrations', () => applyA1Migrations(pg!));
    await runPhase('pg.end before Prisma', () => pg!.end());
    pg = undefined;
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await runPhase('prisma.$connect', () => prisma!.$connect());
    const governor = new CostGovernorService(() => prisma as never);

    await test('1: expired RESERVED is released and a cap-blocked request can reserve', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig({ globalDailyCap: RESERVE_AMOUNT, globalMonthlyCap: 100n });
      const firstId = await reserveOne(governor, 'recon-reserved-cap', 'reserved-cap-first');
      assert.equal((await governor.reserve(reserveInput('recon-reserved-cap', 'reserved-cap-blocked'))).decision, 'DENY_CAP');
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: RESERVE_AMOUNT, settledMicrousd: 0n });
      await setExpired(prisma!, firstId);

      assert.deepEqual(await governor.reconcileStale(), { released: 1, markedUnknown: 0, settled: 0, skipped: 0 });
      assert.equal((await operation(prisma!, firstId)).status, 'RELEASED');
      assert.equal(await ledgerReason(prisma!, firstId, 'RELEASE'), 'reserved_not_dispatched');
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: 0n, settledMicrousd: 0n });
      assert.equal((await governor.reserve(reserveInput('recon-reserved-cap', 'reserved-cap-after-recon'))).decision, 'ALLOW_RESERVED');
    });

    await test('2: expired DISPATCHING becomes OUTCOME_UNKNOWN and keeps its reserve', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig({ globalInflightLimit: 1n });
      const operationId = await reserveOne(governor, 'recon-dispatching', 'dispatching-expired');
      assert.equal(await governor.markDispatching(operationId), true);
      await setExpired(prisma!, operationId);

      assert.deepEqual(await governor.reconcileStale(), { released: 0, markedUnknown: 1, settled: 0, skipped: 0 });
      const stored = await operation(prisma!, operationId);
      assert.equal(stored.status, 'OUTCOME_UNKNOWN');
      assert.equal(await ledgerReason(prisma!, operationId, 'ADJUSTMENT'), 'provider_outcome_unknown');
      assert.ok(stored.expiresAt.getTime() > Date.now() + 23 * 60 * 60 * 1000);
      assert.ok(stored.expiresAt.getTime() < Date.now() + 25 * 60 * 60 * 1000);
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: RESERVE_AMOUNT, settledMicrousd: 0n });
    });

    await test('3: expired OUTCOME_UNKNOWN settles the reserved amount conservatively', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig();
      const operationId = await reserveOne(governor, 'recon-unknown-24h', 'unknown-expired');
      assert.equal(await governor.markDispatching(operationId), true);
      assert.equal(await governor.markOutcomeUnknown(operationId), true);
      await setExpired(prisma!, operationId);

      assert.deepEqual(await governor.reconcileStale(), { released: 0, markedUnknown: 0, settled: 1, skipped: 0 });
      const stored = await operation(prisma!, operationId);
      assert.equal(stored.status, 'SETTLED');
      assert.equal(stored.settledMicrousd, RESERVE_AMOUNT);
      assert.equal(stored.actualCostMicrousd, null);
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: 0n, settledMicrousd: RESERVE_AMOUNT });
      assert.equal(await ledgerReason(prisma!, operationId, 'SETTLE'), 'usage_unavailable_conservative_settle');
    });

    await test('4: repeated reconciliation is idempotent and does not double-adjust counters', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig();
      const operationId = await reserveOne(governor, 'recon-idempotent', 'reconcile-twice');
      await setExpired(prisma!, operationId);

      assert.equal(await governor.reconcileOperation(operationId), 'released');
      assert.equal(await governor.reconcileOperation(operationId), 'skipped');
      assert.equal(await ledgerCount(prisma!, operationId, 'RELEASE'), 1);
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: 0n, settledMicrousd: 0n });
    });

    await test('5: reconciliation races explicit release and settle without double accounting', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig();
      const releaseId = await reserveOne(governor, 'recon-race-release', 'race-release');
      await setExpired(prisma!, releaseId);
      const [reconcileRelease, explicitRelease] = await Promise.all([
        governor.reconcileOperation(releaseId),
        governor.release({ operationId: releaseId, reason: 'reserved_not_dispatched' }),
      ]);
      assert.equal(Number(reconcileRelease === 'released') + Number(explicitRelease), 1);
      assert.equal((await operation(prisma!, releaseId)).status, 'RELEASED');
      assert.equal(await ledgerCount(prisma!, releaseId, 'RELEASE'), 1);
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: 0n, settledMicrousd: 0n });

      await resetCostTables(prisma!);
      setFixtureConfig();
      const settleId = await reserveOne(governor, 'recon-race-settle', 'race-settle');
      assert.equal(await governor.markDispatching(settleId), true);
      assert.equal(await governor.markOutcomeUnknown(settleId), true);
      await setExpired(prisma!, settleId);
      const [reconcileSettle, explicitSettle] = await Promise.all([
        governor.reconcileOperation(settleId),
        governor.settle({ operationId: settleId, usage: { inputTokens: INPUT_TOKENS, outputTokens: OUTPUT_TOKENS } }),
      ]);
      assert.equal(Number(reconcileSettle === 'settled') + Number(explicitSettle.applied), 1);
      assert.equal((await operation(prisma!, settleId)).status, 'SETTLED');
      assert.equal(await ledgerCount(prisma!, settleId, 'SETTLE'), 1);
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: 0n, settledMicrousd: RESERVE_AMOUNT });
    });

    await test('6: a non-stale operation is skipped without changing state or counter', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig();
      const operationId = await reserveOne(governor, 'recon-not-stale', 'not-stale');
      assert.equal(await governor.reconcileOperation(operationId), 'skipped');
      assert.equal((await operation(prisma!, operationId)).status, 'RESERVED');
      assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: RESERVE_AMOUNT, settledMicrousd: 0n });
      assert.deepEqual(await governor.reconcileStale(), { released: 0, markedUnknown: 0, settled: 0, skipped: 0 });
    });

    await test('7: reconcile does not release an operation that wins markDispatching', async () => {
      await resetCostTables(prisma!);
      setFixtureConfig();
      const operationId = await reserveOne(governor, 'recon-race-dispatching', 'race-dispatching');
      await setExpired(prisma!, operationId);
      // Keep the row eligible for markDispatching while its expiry remains stale for reconciliation.
      await prisma!.$executeRawUnsafe(
        `UPDATE "AiCostOperation"
            SET "createdAt" = (clock_timestamp() AT TIME ZONE 'UTC')
          WHERE "id" = $1`,
        operationId
      );

      const [reconcileResult, dispatchingResult] = await Promise.all([
        governor.reconcileOperation(operationId),
        governor.markDispatching(operationId),
      ]);
      const reconcileWon = reconcileResult === 'released';
      const dispatchingWon = dispatchingResult;
      assert.notEqual(reconcileWon, dispatchingWon, 'exactly one transition must win from RESERVED');

      const stored = await operation(prisma!, operationId);
      const releaseCount = await ledgerCount(prisma!, operationId, 'RELEASE');
      assert.ok(releaseCount <= 1, 'release must not be recorded more than once');

      if (reconcileWon) {
        assert.equal(stored.status, 'RELEASED');
        assert.equal(dispatchingResult, false);
        assert.equal(releaseCount, 1);
        assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), { reservedMicrousd: 0n, settledMicrousd: 0n });
      } else {
        assert.equal(dispatchingResult, true);
        assert.equal(reconcileResult, 'skipped', 'a changed status must prevent reconciliation release');
        assert.equal(stored.status, 'DISPATCHING');
        assert.deepEqual(await counter(prisma!, 'GLOBAL_DAY'), {
          reservedMicrousd: RESERVE_AMOUNT,
          settledMicrousd: 0n,
        });
      }
    });

    console.log(`\n${passed} reconciliation PostgreSQL tests passed with ${testTimeZone}.`);
  } finally {
    if (prisma) await runPhase('prisma.$disconnect', () => prisma!.$disconnect()).catch(() => undefined);
    if (pg) await runPhase('pg.end during cleanup', () => pg!.end()).catch(() => undefined);
    await runPhase('server.stop during cleanup', () => server.stop()).catch(() => undefined);
    await runPhase('remove temporary PostgreSQL cluster', () => forceStopTemporaryPostgres(dataDir));
    for (const [name, value] of originalEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

void main().then(
  () => process.exit(0),
  (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message.replace(/postgres(?:ql)?:\/\/[^\s@]+@/gi, 'postgresql://<temporary>@'));
    process.exit(1);
  }
);
