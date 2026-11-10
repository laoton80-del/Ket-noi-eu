/**
 * Local PostgreSQL proof for the single-use Authority foundation.
 * Starts only a disposable loopback cluster beneath VIONA_TEST_PG_TOOLS_DIR;
 * no .env, external database, provider, or network is used.
 */
import * as assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { PrismaClient } from '@prisma/client';

import {
  AuthorityService,
  type AuthorityConsumeResult,
  type AuthorityContext,
  type AuthorityDatabase,
  type AuthorityIssueInput,
  type AuthorityPolicyProvider,
} from '../src/services/authority/AuthorityService';
import { CostGovernorService } from '../src/services/ai/CostGovernorService';

const execFile = promisify(execFileCallback);
const root = resolve(__dirname, '..');
const migrations = [
  resolve(root, 'prisma/migrations/20261103000000_ai_cost_governor/migration.sql'),
  resolve(root, 'prisma/migrations/20261104000000_ai_cost_receipt_inflight/migration.sql'),
  resolve(root, 'prisma/migrations/20261104010000_ai_cost_price_unit_per_million/migration.sql'),
  resolve(root, 'prisma/migrations/20261105000000_ai_cost_operation_snapshots/migration.sql'),
  resolve(root, 'prisma/migrations/20261109120000_authority/migration.sql'),
  resolve(root, 'prisma/migrations/20261110120000_laneb_mult_unit_price_snapshots/migration.sql'),
] as const;
const testTimeZone = process.env.VIONA_TEST_PG_TIME_ZONE ?? 'UTC';
const PHASE_TIMEOUT_MS = 60_000;

type EmbeddedServer = Readonly<{ initialise(): Promise<void>; start(): Promise<void>; stop(): Promise<void> }>;
type EmbeddedServerConstructor = new (options: Readonly<Record<string, unknown>>) => EmbeddedServer;
type PgResult = Readonly<{ rows: readonly Readonly<Record<string, unknown>>[] }>;
type PgClient = Readonly<{
  connect(): Promise<void>;
  end(): Promise<void>;
  query(sql: string, values?: readonly unknown[]): Promise<PgResult>;
}>;
type PgClientConstructor = new (options: Readonly<Record<string, unknown>>) => PgClient;

function withTimeout<T>(phase: string, run: () => Promise<T>): Promise<T> {
  return Promise.race([
    run(),
    new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`${phase} exceeded ${PHASE_TIMEOUT_MS} ms`)), PHASE_TIMEOUT_MS)),
  ]);
}

async function freeLoopbackPort(): Promise<number> {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate a loopback port'));
        return;
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

function assertOwnDataDirectory(toolRoot: string, dataDir: string): void {
  const path = relative(toolRoot, dataDir);
  if (!path || path === '..' || path.startsWith(`..${sep}`)) {
    throw new Error('Temporary PostgreSQL data directory escaped VIONA_TEST_PG_TOOLS_DIR');
  }
}

async function stopOwnedProcessIfPresent(dataDir: string): Promise<void> {
  const pidFile = join(dataDir, 'postmaster.pid');
  if (existsSync(pidFile)) {
    const pid = (await fs.readFile(pidFile, 'utf8')).split(/\r?\n/, 1)[0];
    if (!/^\d+$/.test(pid)) throw new Error('Temporary PostgreSQL pid file is malformed');
    try {
      if (process.platform === 'win32') {
        await execFile('taskkill.exe', ['/PID', pid, '/T', '/F'], { windowsHide: true });
      } else {
        await execFile('kill', ['-TERM', pid]);
      }
    } catch {
      // The server may already have stopped; the pid file is checked below.
    }
    for (let attempt = 0; attempt < 50 && existsSync(pidFile); attempt += 1) {
      await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 100));
    }
  }
}

async function applyMigrations(client: PgClient): Promise<void> {
  for (const migration of migrations) {
    const sql = await fs.readFile(migration, 'utf8');
    try {
      await client.query(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Migration failed (${migration}): ${message}`);
    }
  }
}

function issuePolicy(overrides: Readonly<{ consumeAllowed?: boolean; consumeReason?: string }> = {}): AuthorityPolicyProvider {
  return {
    authorizeIssue: async () => ({
      allowed: true,
      policyVersion: 'authority-pilot-v1',
      issuedBy: 'server:authority-pg-test',
      approvalRef: 'approval:pg-fixture',
      contextBinding: 'context-binding:pg-fixture',
    }),
    authorizeConsume: async () => ({
      allowed: overrides.consumeAllowed ?? true,
      reason: overrides.consumeReason,
    }),
  };
}

function fixtureInput(subjectId: string, tenantId: string, overrides: Partial<AuthorityIssueInput> = {}): AuthorityIssueInput {
  return {
    subjectId,
    tenantId,
    actionKind: 'VOICE_CALL_BOOKING',
    exactTarget: 'booking:fixture-001',
    maxAttempts: 1,
    expiresAt: new Date(Date.now() + 60_000),
    currency: 'USD',
    maxCostMinor: 250n,
    allowedDisclosures: ['name'],
    constraints: { maxCallSeconds: 45 },
    preparePayload: { bookingId: 'fixture-001', phone: '+420000000000' },
    ...overrides,
  };
}

function contextFrom(input: AuthorityIssueInput): AuthorityContext {
  return {
    subjectId: input.subjectId,
    tenantId: input.tenantId,
    exactTarget: input.exactTarget,
    contextBinding: 'context-binding:pg-fixture',
    preparePayload: input.preparePayload,
  };
}

function authorityService(prisma: PrismaClient, policy: AuthorityPolicyProvider): AuthorityService {
  return new AuthorityService(prisma as unknown as AuthorityDatabase, policy);
}

async function ledgerCount(prisma: PrismaClient, authorityId: string, entryType: string): Promise<bigint> {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT count(*)::bigint AS "count" FROM "AuthorityLedgerEntry" WHERE "authorityId" = $1::uuid AND "entryType" = $2`,
    authorityId,
    entryType
  );
  return rows[0].count;
}

async function dispatchOnlyWhenConsumed(result: AuthorityConsumeResult, dispatch: () => void): Promise<void> {
  if (result.consumed) dispatch();
}

async function assertAuthoritySchema(pg: PgClient): Promise<void> {
  const tables = await pg.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1::text[])`,
    [['AuthorityRecord', 'AuthorityLedgerEntry']]
  );
  assert.deepEqual([...tables.rows].map((row) => String(row.tablename)).sort(), ['AuthorityLedgerEntry', 'AuthorityRecord']);
  const indexes = await pg.query(
    `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname = ANY($1::text[])`,
    [['AuthorityRecord_subjectId_tenantId_idx', 'AuthorityRecord_state_expiresAt_idx', 'AuthorityLedgerEntry_authorityId_createdAt_idx']]
  );
  assert.equal(indexes.rows.length, 3, 'Authority subject, state/expiry, and ledger lookup indexes must exist');
  const timeTypes = await pg.query(
    `SELECT table_name, column_name, data_type FROM information_schema.columns
      WHERE table_schema='public' AND table_name = ANY($1::text[])
        AND column_name = ANY($2::text[])`,
    [['AuthorityRecord', 'AuthorityLedgerEntry'], ['expiresAt', 'createdAt', 'consumedAt']]
  );
  assert.ok(timeTypes.rows.length >= 4);
  assert.ok(timeTypes.rows.every((row) => row.data_type === 'timestamp without time zone'));
}

async function main(): Promise<void> {
  if (!['UTC', 'Europe/Prague', 'Pacific/Auckland'].includes(testTimeZone)) {
    throw new Error('VIONA_TEST_PG_TIME_ZONE must be UTC, Europe/Prague, or Pacific/Auckland');
  }
  const configuredToolRoot = process.env.VIONA_TEST_PG_TOOLS_DIR?.trim();
  if (!configuredToolRoot) throw new Error('VIONA_TEST_PG_TOOLS_DIR is required; Authority PostgreSQL tests were not attempted');
  const toolRoot = resolve(configuredToolRoot);
  for (const required of [join(toolRoot, 'package.json'), ...migrations]) {
    if (!existsSync(required)) throw new Error(`Required local PostgreSQL artifact is unavailable: ${required}`);
  }
  const requireFromTools = createRequire(join(toolRoot, 'package.json'));
  const embeddedPath = requireFromTools.resolve('embedded-postgres');
  const embedded = await import(pathToFileURL(embeddedPath).href) as Readonly<{ default: EmbeddedServerConstructor }>;
  const PgClientClass = (requireFromTools('pg') as Readonly<{ Client: PgClientConstructor }>).Client;
  const port = await freeLoopbackPort();
  const dataDir = resolve(toolRoot, `data-authority-${randomUUID()}`);
  assertOwnDataDirectory(toolRoot, dataDir);
  const user = 'authority_fixture';
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
  let started = false;
  let pg: PgClient | undefined;
  let prisma: PrismaClient | undefined;
  const originalEnv = new Map<string, string | undefined>();
  const configuredEnv: Readonly<Record<string, string>> = {
    VIONA_COST_GOVERNOR_USER_DAILY_CAP_MICRO_USD: '1000000',
    VIONA_COST_GOVERNOR_GLOBAL_DAILY_CAP_MICRO_USD: '1000000',
    VIONA_COST_GOVERNOR_GLOBAL_MONTHLY_CAP_MICRO_USD: '1000000',
    VIONA_COST_GOVERNOR_USER_INFLIGHT_LIMIT: '20',
    VIONA_COST_GOVERNOR_GLOBAL_INFLIGHT_LIMIT: '100',
    VIONA_COST_GOVERNOR_PROVIDER_TIMEOUT_MS: '1000',
  };
  for (const [key, value] of Object.entries(configuredEnv)) {
    originalEnv.set(key, process.env[key]);
    process.env[key] = value;
  }
  try {
    await withTimeout('server.initialise', () => server.initialise());
    await withTimeout('server.start', () => server.start());
    started = true;
    pg = new PgClientClass({ host: '127.0.0.1', port, user, password, database: 'postgres' });
    await withTimeout('pg.connect', () => pg!.connect());
    const timezone = await pg.query('SHOW TimeZone');
    assert.equal(String(timezone.rows[0]?.TimeZone ?? ''), testTimeZone);
    await applyMigrations(pg);
    await assertAuthoritySchema(pg);
    await pg.end();
    pg = undefined;

    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await withTimeout('prisma.$connect', () => prisma!.$connect());
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AiModelPrice" (
         "id", "provider", "model", "calculationVersion", "effectiveFrom", "inputMicrousdPerMillionTokens",
         "outputMicrousdPerMillionTokens", "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond",
         "imageMicrousdPerUnit", "createdAt", "updatedAt"
       ) VALUES ($1, 'openai', 'authority-fixture-model', 'authority-price-v1',
         (now() AT TIME ZONE 'UTC') - interval '1 day', 150000, 600000, 0, 0, 0,
         (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'))`,
      randomUUID()
    );

    const mismatchInput = fixtureInput('authority-subject-a', 'tenant-a');
    const mismatchService = authorityService(prisma, issuePolicy());
    const mismatchAuthority = await mismatchService.issue(mismatchInput);
    let mismatchDispatches = 0;
    const mismatch = await mismatchService.verifyAndConsume(mismatchAuthority.authorityId, {
      ...contextFrom(mismatchInput),
      subjectId: 'authority-subject-b',
      tenantId: 'tenant-b',
    });
    await dispatchOnlyWhenConsumed(mismatch, () => { mismatchDispatches += 1; });
    assert.deepEqual(mismatch, { consumed: false, reason: 'CONTEXT_MISMATCH' });
    assert.equal(mismatchDispatches, 0);
    assert.equal(await ledgerCount(prisma, mismatchAuthority.authorityId, 'CONSUME_REJECTED'), 1n);
    console.log('PASS PG subject/tenant mismatch is rejected and not dispatched');

    const expiredInput = fixtureInput('authority-expired', 'tenant-expired', { expiresAt: new Date(Date.now() + 300) });
    const expiredService = authorityService(prisma, issuePolicy());
    const expiredAuthority = await expiredService.issue(expiredInput);
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 450));
    let expiredDispatches = 0;
    const expired = await expiredService.verifyAndConsume(expiredAuthority.authorityId, contextFrom(expiredInput));
    await dispatchOnlyWhenConsumed(expired, () => { expiredDispatches += 1; });
    assert.deepEqual(expired, { consumed: false, reason: 'EXPIRED' });
    assert.equal(expiredDispatches, 0);
    assert.equal(await ledgerCount(prisma, expiredAuthority.authorityId, 'EXPIRED'), 1n);
    console.log('PASS PG expiry before consume is audited and not dispatched');

    const revokedInput = fixtureInput('authority-revoked', 'tenant-revoked');
    const revokedService = authorityService(prisma, issuePolicy({ consumeAllowed: false, consumeReason: 'consent_revoked' }));
    const revokedAuthority = await revokedService.issue(revokedInput);
    let revokedDispatches = 0;
    const revoked = await revokedService.verifyAndConsume(revokedAuthority.authorityId, contextFrom(revokedInput));
    await dispatchOnlyWhenConsumed(revoked, () => { revokedDispatches += 1; });
    assert.deepEqual(revoked, { consumed: false, reason: 'POLICY_REJECTED' });
    assert.equal(revokedDispatches, 0);
    assert.equal(await ledgerCount(prisma, revokedAuthority.authorityId, 'CONSUME_REJECTED'), 1n);
    console.log('PASS PG revoked consent/current policy denial is not dispatched');

    const concurrentInput = fixtureInput('authority-concurrent', 'tenant-concurrent');
    const concurrentService = authorityService(prisma, issuePolicy());
    const concurrentAuthority = await concurrentService.issue(concurrentInput);
    const concurrentResults = await Promise.all([
      concurrentService.verifyAndConsume(concurrentAuthority.authorityId, contextFrom(concurrentInput)),
      concurrentService.verifyAndConsume(concurrentAuthority.authorityId, contextFrom(concurrentInput)),
    ]);
    assert.equal(concurrentResults.filter((result) => result.consumed).length, 1);
    assert.equal(concurrentResults.filter((result) => !result.consumed && result.reason === 'ALREADY_CONSUMED').length, 1);
    const consumedRows = await prisma.$queryRawUnsafe<Array<{ state: string; consumedAt: Date | null }>>(
      `SELECT "state", "consumedAt" FROM "AuthorityRecord" WHERE "authorityId" = $1::uuid`,
      concurrentAuthority.authorityId
    );
    assert.equal(consumedRows[0]?.state, 'CONSUMED');
    assert.ok(consumedRows[0]?.consumedAt instanceof Date);
    assert.equal(await ledgerCount(prisma, concurrentAuthority.authorityId, 'CONSUMED'), 1n);
    console.log('PASS PG two concurrent workers produce exactly one CONSUMED winner');

    const costSubject = 'authority-reserve-release-subject';
    const governor = new CostGovernorService(() => prisma as never);
    const reservation = await governor.reserve({
      subjectId: costSubject,
      idempotencyKey: `authority-release-${randomUUID()}`,
      rail: 'EXPRESS',
      provider: 'openai',
      model: 'authority-fixture-model',
      operationKind: 'ROUTED_CHAT_COMPLETION',
      inputTokensUpperBound: 10n,
      outputTokens: 20n,
    });
    assert.equal(reservation.decision, 'ALLOW_RESERVED');
    if (reservation.decision !== 'ALLOW_RESERVED') throw new Error('Cost reserve did not return ALLOW_RESERVED');
    const consumedInput = fixtureInput(costSubject, 'tenant-cost-release');
    const releaseService = authorityService(prisma, issuePolicy());
    const releaseAuthority = await releaseService.issue(consumedInput);
    const firstConsume = await releaseService.verifyAndConsume(releaseAuthority.authorityId, contextFrom(consumedInput));
    assert.equal(firstConsume.consumed, true);
    const losingConsume = await releaseService.verifyAndConsume(releaseAuthority.authorityId, contextFrom(consumedInput));
    assert.deepEqual(losingConsume, { consumed: false, reason: 'ALREADY_CONSUMED' });
    assert.equal(await governor.release({ operationId: reservation.operation.id, reason: 'reserved_not_dispatched' }), true);
    const operationRows = await prisma.$queryRawUnsafe<Array<{ status: string; settledMicrousd: bigint }>>(
      `SELECT "status", "settledMicrousd" FROM "AiCostOperation" WHERE "id" = $1`, reservation.operation.id
    );
    assert.equal(operationRows[0]?.status, 'RELEASED');
    assert.equal(operationRows[0]?.settledMicrousd, 0n);
    const counters = await prisma.$queryRawUnsafe<Array<{ reservedMicrousd: bigint; settledMicrousd: bigint }>>(
      `SELECT "reservedMicrousd", "settledMicrousd" FROM "AiCostBudgetCounter" WHERE "scope" = $1`,
      `USER_DAY:${costSubject}`
    );
    assert.equal(counters[0]?.reservedMicrousd, 0n);
    assert.equal(counters[0]?.settledMicrousd, 0n);
    console.log('PASS PG losing consume after reserve releases reserved_not_dispatched without dispatch or money loss');
    console.log(`5 Authority PostgreSQL scenarios passed (${testTimeZone}).`);
  } finally {
    if (prisma) await withTimeout('prisma.$disconnect', () => prisma!.$disconnect()).catch(() => undefined);
    if (pg) await withTimeout('pg.end', () => pg!.end()).catch(() => undefined);
    if (started) await withTimeout('server.stop', () => server.stop()).catch(() => undefined);
    assertOwnDataDirectory(toolRoot, dataDir);
    await stopOwnedProcessIfPresent(dataDir);
    await fs.rm(dataDir, { recursive: true, force: true });
    for (const [key, value] of originalEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
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
