import * as assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, promises as fs, readFileSync } from 'node:fs';
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
import {
  LANE_B_MODEL_PRICES,
  LANE_B_PRICE_PROVENANCE,
  PROVISIONAL_PRICE,
  seedLaneBModelPrices,
} from './seed-viona-cost-governor-price';

const execFile = promisify(execFileCallback);
const root = resolve(__dirname, '..');
const MIGRATIONS = [
  '20261103000000_ai_cost_governor',
  '20261104000000_ai_cost_receipt_inflight',
  '20261104010000_ai_cost_price_unit_per_million',
  '20261105000000_ai_cost_operation_snapshots',
  '20261110120000_laneb_mult_unit_price_snapshots',
  '20261111000000_ai_model_price_active_unique',
] as const;
const TIMEOUT_MS = 60_000;
const testTimeZone = process.env.VIONA_TEST_PG_TIME_ZONE ?? 'UTC';
const execFileAsync = execFile;

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
  query(sql: string): Promise<PgQueryResult>;
}>;
type PgClientConstructor = new (options: Readonly<Record<string, unknown>>) => PgClient;
type ActivePrice = Readonly<{
  id: string;
  calculationVersion: string;
  effectiveTo: Date | null;
  inputMicrousdPerMillionTokens: bigint;
  outputMicrousdPerMillionTokens: bigint;
  audioInputMicrousdPerSecond: bigint;
  audioOutputMicrousdPerSecond: bigint;
  imageMicrousdPerUnit: bigint;
}>;

let toolRoot: string | undefined;
let passes = 0;

function requireToolRoot(): string {
  if (!toolRoot) throw new Error('VIONA_TEST_PG_TOOLS_DIR must point to the approved local pg-test tools directory');
  return toolRoot;
}

function assertTemporaryDataDir(dataDir: string): void {
  const child = relative(requireToolRoot(), dataDir);
  if (!child || child === '..' || child.startsWith(`..${sep}`)) {
    throw new Error('Temporary PostgreSQL data directory escaped VIONA_TEST_PG_TOOLS_DIR');
  }
}

async function phase<T>(name: string, work: () => Promise<T>): Promise<T> {
  console.log(`[phase] ${name}: start`);
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${name} timed out after ${TIMEOUT_MS} ms`)), TIMEOUT_MS);
    });
    const result = await Promise.race([work(), timeout]);
    console.log(`[phase] ${name}: PASS`);
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

async function forceStopAndRemoveTemporaryPostgres(dataDir: string): Promise<void> {
  assertTemporaryDataDir(dataDir);
  const pidPath = join(dataDir, 'postmaster.pid');
  if (existsSync(pidPath)) {
    const rawPid = await fs.readFile(pidPath, 'utf8');
    const pid = rawPid.split(/\r?\n/, 1)[0];
    if (!/^\d+$/.test(pid)) throw new Error('Temporary PostgreSQL postmaster PID was malformed');
    try {
      await execFileAsync('taskkill.exe', ['/PID', pid, '/T', '/F'], { windowsHide: true });
    } catch {
      // It may already have stopped; the data directory is still removed below.
    }
  }
  await fs.rm(dataDir, { recursive: true, force: true });
}

function setFixtureConfig(): void {
  const values: Record<keyof typeof COST_GOVERNOR_ENV_NAMES, string> = {
    userDailyCap: '1000000',
    globalDailyCap: '10000000',
    globalMonthlyCap: '100000000',
    userInflightLimit: '100',
    globalInflightLimit: '100',
    providerTimeoutMs: '1000',
  };
  for (const [key, name] of Object.entries(COST_GOVERNOR_ENV_NAMES) as Array<
    [keyof typeof COST_GOVERNOR_ENV_NAMES, string]
  >) process.env[name] = values[key];
}

function clearFixtureConfig(): void {
  for (const name of Object.values(COST_GOVERNOR_ENV_NAMES)) delete process.env[name];
}

async function activeRows(
  prisma: PrismaClient,
  provider = PROVISIONAL_PRICE.provider,
  model = PROVISIONAL_PRICE.model
): Promise<ActivePrice[]> {
  return prisma.$queryRawUnsafe<ActivePrice[]>(
    `SELECT "id", "calculationVersion", "effectiveTo",
            "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
            "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
       FROM "AiModelPrice"
      WHERE "provider" = $1 AND "model" = $2
        AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
        AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")
      ORDER BY "effectiveFrom" DESC`,
    provider,
    model
  );
}

async function activeLaneBRows(prisma: PrismaClient): Promise<ActivePrice[]> {
  return prisma.$queryRawUnsafe<ActivePrice[]>(
    `SELECT "id", "calculationVersion", "effectiveTo",
            "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
            "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
       FROM "AiModelPrice"
      WHERE "calculationVersion" = $1
        AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
        AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")
      ORDER BY "provider", "model"`,
    LANE_B_PRICE_PROVENANCE
  );
}

async function totalRows(
  prisma: PrismaClient,
  provider = PROVISIONAL_PRICE.provider,
  model = PROVISIONAL_PRICE.model
): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS "count" FROM "AiModelPrice" WHERE "provider" = $1 AND "model" = $2`,
    provider,
    model
  );
  return Number(rows[0]?.count ?? -1n);
}

async function test(name: string, run: () => Promise<void>): Promise<void> {
  await run();
  passes += 1;
  console.log(`PASS ${name}`);
}

async function main(): Promise<void> {
  const configuredTools = process.env.VIONA_TEST_PG_TOOLS_DIR?.trim();
  if (!configuredTools) throw new Error('VIONA_TEST_PG_TOOLS_DIR is required; no PostgreSQL test was attempted');
  toolRoot = resolve(configuredTools);
  for (const required of [join(requireToolRoot(), 'package.json'), ...MIGRATIONS.map((name) =>
    resolve(root, 'prisma', 'migrations', name, 'migration.sql'))]) {
    if (!existsSync(required)) throw new Error(`Required local PostgreSQL artifact is unavailable: ${required}`);
  }
  if (!['UTC', 'Europe/Prague', 'Pacific/Auckland'].includes(testTimeZone)) {
    throw new Error('VIONA_TEST_PG_TIME_ZONE must be UTC, Europe/Prague, or Pacific/Auckland');
  }

  const requireFromTools = createRequire(join(requireToolRoot(), 'package.json'));
  const embeddedPath = requireFromTools.resolve('embedded-postgres');
  const embedded = await import(pathToFileURL(embeddedPath).href) as Readonly<{
    default: EmbeddedServerConstructor;
  }>;
  const PgClientClass = (requireFromTools('pg') as Readonly<{ Client: PgClientConstructor }>).Client;

  const port = await findFreeLoopbackPort();
  const dataDir = resolve(requireToolRoot(), `data-a1-price-seed-${randomUUID()}`);
  assertTemporaryDataDir(dataDir);
  const user = 'cost_price_seed_fixture';
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
  let pg: PgClient | undefined;
  let prisma: PrismaClient | undefined;
  let serverStarted = false;
  try {
    await phase('server.initialise', () => server.initialise());
    await phase('server.start', () => server.start());
    serverStarted = true;
    pg = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
    await phase('pg.connect', () => pg!.connect());
    const timezoneRows = await pg.query('SHOW TimeZone');
    assert.equal(String(timezoneRows.rows[0]?.TimeZone ?? ''), testTimeZone);
    for (const migration of MIGRATIONS) {
      const sql = readFileSync(resolve(root, 'prisma', 'migrations', migration, 'migration.sql'), 'utf8');
      await phase(`migration ${migration}`, async () => { await pg!.query(sql); });
    }
    await phase('pg.end', () => pg!.end());
    pg = undefined;

    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await phase('prisma.$connect', () => prisma!.$connect());
    setFixtureConfig();

    await test('Lane B seed installs all five operator-approved unit prices and chat reserve snapshots its rate', async () => {
      const seededResults = await seedLaneBModelPrices(prisma!);
      assert.equal(seededResults.length, 5);
      assert.ok(seededResults.every((result) => result.outcome === 'inserted'));
      const activeSeedRows = await activeLaneBRows(prisma!);
      assert.equal(activeSeedRows.length, 5);
      for (const target of LANE_B_MODEL_PRICES) {
        const rowsForModel = await prisma!.$queryRawUnsafe<ActivePrice[]>(
          `SELECT "id", "calculationVersion", "effectiveTo",
                  "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
                  "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
             FROM "AiModelPrice"
            WHERE "provider" = $1 AND "model" = $2
              AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
              AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")`,
          target.provider,
          target.model
        );
        assert.equal(rowsForModel.length, 1, `${target.provider}/${target.model} must have one active version`);
        const seeded = rowsForModel[0];
        assert.equal(seeded.effectiveTo, null, `${target.provider}/${target.model} active version must be open-ended`);
        assert.equal(seeded.calculationVersion, LANE_B_PRICE_PROVENANCE);
        assert.equal(seeded.inputMicrousdPerMillionTokens, target.inputMicrousdPerMillionTokens);
        assert.equal(seeded.outputMicrousdPerMillionTokens, target.outputMicrousdPerMillionTokens);
        assert.equal(seeded.audioInputMicrousdPerSecond, target.audioInputMicrousdPerSecond);
        assert.equal(seeded.audioOutputMicrousdPerSecond, target.audioOutputMicrousdPerSecond);
        assert.equal(seeded.imageMicrousdPerUnit, target.imageMicrousdPerUnit);
      }
      const gpt4oRows = await activeRows(prisma!, 'openai', 'gpt-4o');
      assert.equal(gpt4oRows.length, 1);
      assert.equal(gpt4oRows[0].inputMicrousdPerMillionTokens, 2500000n);
      assert.equal(gpt4oRows[0].outputMicrousdPerMillionTokens, 10000000n);
      assert.equal(gpt4oRows[0].effectiveTo, null);
      const rows = await activeRows(prisma!);
      assert.equal(rows.length, 1);
      const seededMini = seededResults.find((result) => result.model === PROVISIONAL_PRICE.model);
      assert.ok(seededMini);
      assert.equal(rows[0].id, seededMini.priceVersionId);
      assert.equal(rows[0].calculationVersion, PROVISIONAL_PRICE.calculationVersion);
      assert.equal(rows[0].inputMicrousdPerMillionTokens, PROVISIONAL_PRICE.inputMicrousdPerMillionTokens);
      assert.equal(rows[0].outputMicrousdPerMillionTokens, PROVISIONAL_PRICE.outputMicrousdPerMillionTokens);
      assert.equal(rows[0].audioInputMicrousdPerSecond, 0n);
      assert.equal(rows[0].audioOutputMicrousdPerSecond, 0n);
      assert.equal(rows[0].imageMicrousdPerUnit, 0n);

      const governor = new CostGovernorService(() => prisma as never);
      const reserveInput: CostGovernorReserveInput = {
        subjectId: 'price-seed-test-subject',
        idempotencyKey: `price-seed-${randomUUID()}`,
        rail: 'EXPRESS',
        provider: PROVISIONAL_PRICE.provider,
        model: PROVISIONAL_PRICE.model,
        operationKind: 'ROUTED_CHAT_COMPLETION',
        inputTokensUpperBound: 10n,
        outputTokens: 20n,
      };
      const result = await governor.reserve(reserveInput);
      assert.equal(result.decision, 'ALLOW_RESERVED');
      if (result.decision !== 'ALLOW_RESERVED') return;
      assert.equal(result.operation.inputMicrousdPerMillionTokens, 150000n);
      assert.equal(result.operation.outputMicrousdPerMillionTokens, 600000n);
      assert.equal(result.operation.reservedMicrousd, 14n);
      assert.equal(result.operation.priceVersionId, seededMini.priceVersionId);
    });

    await test('repeated Lane B seed is idempotent and preserves all model versions', async () => {
      const before = await activeRows(prisma!);
      assert.equal(before.length, 1);
      const firstId = before[0].id;
      const beforeCount = await totalRows(prisma!);
      const beforeActiveIds = (await activeLaneBRows(prisma!)).map((row) => row.id);
      const second = await seedLaneBModelPrices(prisma!);
      const third = await seedLaneBModelPrices(prisma!);
      assert.ok(second.every((result) => result.outcome === 'unchanged'));
      assert.ok(third.every((result) => result.outcome === 'unchanged'));
      assert.equal(second.find((result) => result.model === PROVISIONAL_PRICE.model)?.priceVersionId, firstId);
      assert.equal(third.find((result) => result.model === PROVISIONAL_PRICE.model)?.priceVersionId, firstId);
      assert.equal(await totalRows(prisma!), beforeCount);
      assert.deepEqual((await activeLaneBRows(prisma!)).map((row) => row.id), beforeActiveIds);
      assert.equal((await activeRows(prisma!)).length, 1);

      const governor = new CostGovernorService(() => prisma as never);
      const reserved = await governor.reserve({
        subjectId: `reseed-reserve-${randomUUID()}`,
        idempotencyKey: `reseed-reserve-${randomUUID()}`,
        rail: 'EXPRESS',
        provider: PROVISIONAL_PRICE.provider,
        model: PROVISIONAL_PRICE.model,
        operationKind: 'ROUTED_CHAT_COMPLETION',
        inputTokensUpperBound: 10n,
        outputTokens: 20n,
      });
      assert.equal(reserved.decision, 'ALLOW_RESERVED', 'repeated seeds must leave a reservable active price');
    });

    await test('a changed gpt-4o version is closed and replaced by the seeded version', async () => {
      const target = LANE_B_MODEL_PRICES.find((price) => price.provider === 'openai' && price.model === 'gpt-4o');
      assert.ok(target);
      const previousRows = await activeRows(prisma!, target.provider, target.model);
      assert.equal(previousRows.length, 1);
      const previousId = previousRows[0].id;
      const changedId = randomUUID();
      await prisma!.$transaction(async (transaction) => {
        await transaction.$executeRawUnsafe(
          `UPDATE "AiModelPrice"
              SET "effectiveTo" = (now() AT TIME ZONE 'UTC'),
                  "updatedAt" = (now() AT TIME ZONE 'UTC')
            WHERE "id" = $1`,
          previousId
        );
        await transaction.$executeRawUnsafe(
          `INSERT INTO "AiModelPrice" (
             "id", "provider", "model", "calculationVersion", "effectiveFrom", "effectiveTo",
             "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
             "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
             "createdAt", "updatedAt"
           ) VALUES (
             $1, $2, $3, 'test-changed-price-v1', (now() AT TIME ZONE 'UTC'), NULL,
             10000, 20000, 0, 0, 0, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
           )`,
          changedId,
          target.provider,
          target.model
        );
      });
      const reseededResults = await seedLaneBModelPrices(prisma!);
      const reseeded = reseededResults.find((result) => result.provider === target.provider && result.model === target.model);
      assert.ok(reseeded);
      assert.equal(reseeded.outcome, 'inserted');
      const replacementRows = await prisma!.$queryRawUnsafe<Array<{
        id: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        calculationVersion: string;
        inputMicrousdPerMillionTokens: bigint;
        outputMicrousdPerMillionTokens: bigint;
      }>>(
        `SELECT "id", "effectiveFrom", "effectiveTo", "calculationVersion",
                "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens"
           FROM "AiModelPrice" WHERE "id" = $1`,
        reseeded.priceVersionId
      );
      assert.equal(replacementRows.length, 1);
      const replacement = replacementRows[0];
      assert.equal(replacement.id, reseeded.priceVersionId);
      assert.notEqual(replacement.id, changedId);
      assert.equal(replacement.calculationVersion, target.calculationVersion);
      assert.equal(replacement.inputMicrousdPerMillionTokens, target.inputMicrousdPerMillionTokens);
      assert.equal(replacement.outputMicrousdPerMillionTokens, target.outputMicrousdPerMillionTokens);
      assert.equal(replacement.effectiveTo, null, 'the replacement version must remain open-ended');
      const closedRows = await prisma!.$queryRawUnsafe<Array<{
        id: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
      }>>(
        `SELECT "id", "effectiveFrom", "effectiveTo" FROM "AiModelPrice" WHERE "id" = ANY($1::text[])`,
        [previousId, changedId]
      );
      assert.equal(closedRows.length, 2);
      const previous = closedRows.find((row) => row.id === previousId);
      const changed = closedRows.find((row) => row.id === changedId);
      assert.ok(previous?.effectiveTo instanceof Date && previous.effectiveTo > previous.effectiveFrom);
      assert.ok(changed?.effectiveTo instanceof Date && changed.effectiveTo > changed.effectiveFrom);
      assert.equal(previous.effectiveTo.getTime(), changed.effectiveFrom.getTime());
      assert.equal(changed.effectiveTo.getTime(), replacement.effectiveFrom.getTime());
      assert.equal((await activeRows(prisma!, target.provider, target.model)).length, 1);
      assert.equal(await totalRows(prisma!, target.provider, target.model), 3);
    });

    console.log(`PASS ${passes} price-seed PostgreSQL checks (${testTimeZone})`);
  } finally {
    clearFixtureConfig();
    if (prisma) await prisma.$disconnect();
    if (pg) await pg.end();
    if (serverStarted) {
      try { await server.stop(); } catch { /* force-stop and remove below */ }
    }
    await forceStopAndRemoveTemporaryPostgres(dataDir);
  }
}

void main().catch((error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error);
  const safe = raw.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgresql://<redacted>@');
  console.error(`FAIL price-seed PostgreSQL test: ${safe}`);
  process.exitCode = 1;
});
