/**
 * Pack40D1 — VionaRequestExecutionAttempt schema, migration and repository contract tests.
 *
 * Operator phrase: APPROVE_PACK40D1_EXECUTION_ATTEMPT_SCHEMA
 * Static inspection and injected fake Prisma clients only — no database or network.
 *
 * Run:
 *   npx tsx scripts/test-viona-pack40d1-execution-attempt-schema.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES,
  VIONA_REQUEST_EXECUTION_TERMINAL_ATTEMPT_STATES,
  createVionaRequestExecutionAttempt,
  findActiveVionaRequestExecutionAttemptForRequest,
  findExpiredActiveVionaRequestExecutionAttemptLeases,
  findVionaRequestExecutionAttemptByExecutionKey,
  findVionaRequestExecutionAttemptById,
  findVionaRequestExecutionAttemptByProviderIdempotencyKey,
  recordVionaRequestExecutionAttemptProviderOutcome,
  transitionVionaRequestExecutionAttemptState,
  updateVionaRequestExecutionAttemptLease,
  type VionaRequestExecutionAttemptClient,
} from '../src/repositories/vionaRequestExecutionAttemptRepository';
import {
  VionaRequestExecutionAttemptState,
  VionaRequestExecutionPrincipalType,
  VionaRequestExecutionTriggerType,
  VionaRequestScopeKind,
} from '@prisma/client';

const REPO_ROOT = path.resolve(__dirname, '..');
const MIGRATION_DIR = path.join(
  REPO_ROOT,
  'prisma/migrations/20260715120000_pack40d1_add_viona_request_execution_attempt',
);
const MIGRATION_PATH = path.join(MIGRATION_DIR, 'migration.sql');
const REPOSITORY_PATH = 'src/repositories/vionaRequestExecutionAttemptRepository.ts';

const PROTECTED_RUNTIME_PATHS = [
  'src/controllers/VionaRequestController.ts',
  'src/controllers/VionaWebhookMerchantAgentController.ts',
  'src/controllers/VionaInternalRealTwilioPocController.ts',
  'src/services/viona/vionaRequestExecutionOrchestrator.ts',
  'src/services/viona/vionaExecutionPlanRouteService.ts',
  'src/services/viona/vionaAutonomousDispatchService.ts',
  'src/services/viona/vionaRequestStatusActionService.ts',
  'src/services/viona/vionaRequestNoteActionService.ts',
  'src/services/viona/vionaRequestReadService.ts',
  'src/services/viona/vionaRequestEscrowHoldService.ts',
  'src/routes/vionaRoutes.ts',
] as const;

const ACTIVE_STATES = [
  'claimed',
  'providerPending',
  'providerSucceeded',
  'providerFailed',
  'outcomeUncertain',
] as const;

const TERMINAL_STATES = ['completed', 'failed', 'abandoned'] as const;

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

function countModelOccurrences(source: string, modelName: string): number {
  const re = new RegExp(`\\bmodel\\s+${modelName}\\b`, 'g');
  return (source.match(re) ?? []).length;
}

function attemptRows(store: Map<string, Record<string, unknown>>): Record<string, unknown>[] {
  return [...store.entries()]
    .filter(([key]) => !key.startsWith('key:'))
    .map(([, row]) => row);
}

function asAttemptClient(fake: ReturnType<typeof makeFakeAttemptClient>): VionaRequestExecutionAttemptClient {
  return fake.client as unknown as VionaRequestExecutionAttemptClient;
}

function makeFakeAttemptClient(initial: Record<string, unknown> = {}) {
  const store = new Map<string, Record<string, unknown>>();
  let seq = 0;

  const client = {
      vionaRequestExecutionAttempt: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          seq += 1;
          const row = {
            id: `attempt-${seq}`,
            createdAt: new Date('2026-07-15T00:00:00.000Z'),
            updatedAt: new Date('2026-07-15T00:00:00.000Z'),
            ...data,
          };
          store.set(row.id as string, row);
          if (typeof data.executionKey === 'string') {
            store.set(`key:${data.executionKey}`, row);
          }
          return row;
        },
        findUnique: async ({
          where,
          select,
        }: {
          where: { id?: string; executionKey?: string; providerIdempotencyKey?: string };
          select?: Record<string, boolean>;
        }) => {
          let row: Record<string, unknown> | undefined;
          if (where.id) row = store.get(where.id);
          if (where.executionKey) row = store.get(`key:${where.executionKey}`);
          if (where.providerIdempotencyKey) {
            row = [...store.values()].find(
              (candidate) => candidate.providerIdempotencyKey === where.providerIdempotencyKey,
            );
          }
          if (row == null) return null;
          if (select == null) return row;
          const picked: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            picked[key] = row[key];
          }
          return picked;
        },
        findFirst: async ({
          where,
          select,
        }: {
          where: { requestId?: string; state?: { in?: string[] } };
          select?: Record<string, boolean>;
        }) => {
          const match = attemptRows(store).find((row) => {
            if (where.requestId && row.requestId !== where.requestId) return false;
            if (where.state?.in && !where.state.in.includes(row.state as string)) return false;
            return true;
          });
          if (match == null) return null;
          if (select == null) return match;
          const picked: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            picked[key] = match[key];
          }
          return picked;
        },
        findMany: async ({
          where,
          select,
        }: {
          where: {
            state?: { in?: string[] };
            leaseExpiresAt?: { lte?: Date };
          };
          select?: Record<string, boolean>;
        }) => {
          const rows = attemptRows(store).filter((row) => {
            if (where.state?.in && !where.state.in.includes(row.state as string)) return false;
            if (
              where.leaseExpiresAt?.lte &&
              (!(row.leaseExpiresAt instanceof Date) ||
                (row.leaseExpiresAt as Date) > where.leaseExpiresAt.lte)
            ) {
              return false;
            }
            return true;
          });
          if (select == null) return rows;
          return rows.map((row) => {
            const picked: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              picked[key] = row[key];
            }
            return picked;
          });
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: {
            id?: string;
            state?: { in?: string[] };
            leaseOwner?: string;
          };
          data: Record<string, unknown>;
        }) => {
          const row = where.id ? store.get(where.id) : undefined;
          if (row == null) return { count: 0 };
          if (where.state?.in && !where.state.in.includes(row.state as string)) return { count: 0 };
          if (where.leaseOwner != null && row.leaseOwner !== where.leaseOwner) return { count: 0 };
          Object.assign(row, data, { updatedAt: new Date('2026-07-15T00:00:01.000Z') });
          return { count: 1 };
        },
      },
  };

  return { store, client, ...initial };
}

let passed = 0;

function runTest(name: string, fn: () => void | Promise<void>): void {
  const result = fn();
  if (result instanceof Promise) {
    throw new Error(`async test not supported inline: ${name}`);
  }
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

async function main(): Promise<void> {
  const schema = readUtf8('prisma/schema.prisma');
  const migration = readUtf8(
    'prisma/migrations/20260715120000_pack40d1_add_viona_request_execution_attempt/migration.sql',
  );
  const repositorySource = readUtf8(REPOSITORY_PATH);
  const attemptBlock = extractModelBlock(schema, 'VionaRequestExecutionAttempt');
  const vionaRequestBlock = extractModelBlock(schema, 'VionaRequest');
  const attemptStateEnum = extractEnumBlock(schema, 'VionaRequestExecutionAttemptState');
  const principalEnum = extractEnumBlock(schema, 'VionaRequestExecutionPrincipalType');
  const triggerEnum = extractEnumBlock(schema, 'VionaRequestExecutionTriggerType');
  const scopeEnum = extractEnumBlock(schema, 'VionaRequestScopeKind');

  runTest('attempt model exists exactly once', () => {
    assert(countModelOccurrences(schema, 'VionaRequestExecutionAttempt') === 1, 'single model required');
  });

  runTest('attempt-state enum contains only approved values', () => {
    for (const value of [...ACTIVE_STATES, ...TERMINAL_STATES]) {
      assert(attemptStateEnum.includes(value), `state enum must contain ${value}`);
    }
    const lines = attemptStateEnum
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('enum') && line !== '{' && line !== '}');
    assert(lines.length === 8, `expected 8 attempt states, found ${lines.length}`);
  });

  runTest('active and terminal state constants match approved sets', () => {
    assert(
      VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES.length === ACTIVE_STATES.length,
      'active state count',
    );
    assert(
      VIONA_REQUEST_EXECUTION_TERMINAL_ATTEMPT_STATES.length === TERMINAL_STATES.length,
      'terminal state count',
    );
  });

  runTest('principal enum contains only merchantService', () => {
    assert(principalEnum.includes('merchantService'), 'merchantService required');
    const lines = principalEnum
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('enum') && line !== '{' && line !== '}');
    assert(lines.length === 1, `expected one principal type, found ${lines.length}`);
  });

  runTest('trigger enum contains only approved production triggers', () => {
    for (const value of [
      'signedMerchantWebhook',
      'internalAuthenticatedController',
      'approvedInternalDispatch',
    ] as const) {
      assert(triggerEnum.includes(value), `trigger enum must contain ${value}`);
    }
    assert(!triggerEnum.includes('approvedTestHarness'), 'test harness must not be persisted');
  });

  runTest('consumer execution principal is not added', () => {
    assert(!principalEnum.includes('consumerService'), 'consumer principal forbidden');
  });

  runTest('provenance enum remains consumer merchant legacyUnresolved only', () => {
    const lines = scopeEnum
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('enum') && line !== '{' && line !== '}');
    assert(lines.length === 3, 'scope enum unchanged');
  });

  runTest('required request relation exists with Restrict deletion', () => {
    assert(
      /request\s+VionaRequest\s+@relation\(\s*fields:\s*\[requestId\],\s*references:\s*\[id\],\s*onDelete:\s*Restrict\s*\)/.test(
        attemptBlock,
      ),
      'Restrict FK required',
    );
    assert(/executionAttempts\s+VionaRequestExecutionAttempt\[\]/.test(vionaRequestBlock), 'back relation');
  });

  runTest('requestId attemptNumber executionKey correlationId exist', () => {
    for (const field of ['requestId', 'attemptNumber', 'executionKey', 'correlationId'] as const) {
      assert(attemptBlock.includes(field), `${field} required`);
    }
    assert(/executionKey\s+String\s+@unique/.test(attemptBlock), 'executionKey unique');
  });

  runTest('immutable provenance snapshot fields exist', () => {
    for (const field of [
      'ownerUserIdSnapshot',
      'scopeKindSnapshot',
      'merchantProfileIdSnapshot',
      'tenantIdSnapshot',
      'principalType',
      'triggerType',
      'triggeringUserId',
    ] as const) {
      assert(attemptBlock.includes(field), `${field} required`);
    }
  });

  runTest('lease provider and terminal timestamp fields exist', () => {
    for (const field of [
      'leaseOwner',
      'leaseExpiresAt',
      'claimedAt',
      'providerName',
      'operationCategory',
      'providerIdempotencyKey',
      'providerResultDigest',
      'providerExternalReferenceDigest',
      'failureClass',
      'failureReasonDigest',
      'finalizedAt',
      'abandonedAt',
    ] as const) {
      assert(attemptBlock.includes(field), `${field} required`);
    }
  });

  runTest('no activeExecutionAttemptId on VionaRequest', () => {
    assert(!vionaRequestBlock.includes('activeExecutionAttemptId'), 'active FK deferred');
  });

  runTest('unique requestId attemptNumber and provider idempotency key', () => {
    assert(/@@unique\(\[requestId,\s*attemptNumber\]\)/.test(attemptBlock), 'attempt number unique');
    assert(/providerIdempotencyKey\s+String\?\s+@unique/.test(attemptBlock), 'provider key unique');
  });

  runTest('lookup indexes exist on schema', () => {
    assert(/@@index\(\[requestId\]\)/.test(attemptBlock), 'requestId index');
    assert(/@@index\(\[requestId,\s*state\]\)/.test(attemptBlock), 'requestId state index');
    assert(/@@index\(\[state,\s*leaseExpiresAt\]\)/.test(attemptBlock), 'lease recovery index');
    assert(/@@index\(\[correlationId\]\)/.test(attemptBlock), 'correlation index');
  });

  runTest('partial unique active-attempt index exists in migration', () => {
    assert(
      migration.includes('VionaRequestExecutionAttempt_one_active_attempt_per_request'),
      'partial index name required',
    );
    assert(migration.includes('migration-managed'), 'partial index must be documented');
    for (const state of ACTIVE_STATES) {
      assert(migration.includes(`'${state}'`), `partial index must include ${state}`);
    }
    for (const state of TERMINAL_STATES) {
      const whereClause = migration.slice(
        migration.indexOf('WHERE "state" IN'),
        migration.indexOf(');', migration.indexOf('WHERE "state" IN')),
      );
      assert(!whereClause.includes(`'${state}'`), `terminal state ${state} excluded from partial index`);
    }
    assert(!/CREATE UNIQUE INDEX[^\n]*\("requestId"\)\s*;/.test(migration), 'no broad requestId unique');
  });

  runTest('exactly one Pack40D1 migration exists and is additive', () => {
    const migrationsRoot = path.join(REPO_ROOT, 'prisma/migrations');
    const matches = fs
      .readdirSync(migrationsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.includes('pack40d1_add_viona_request_execution_attempt'));
    assert(matches.length === 1, `expected one pack40d1 migration, found ${matches.length}`);
    assert(fs.existsSync(MIGRATION_PATH), 'migration.sql must exist');
    const lines = migration
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('--'));
    for (const line of lines) {
      const upper = line.toUpperCase();
      assert(!/^DROP\s+TABLE\b/.test(upper), `no drop table: ${line}`);
      assert(!/^UPDATE\b/.test(upper), `no update: ${line}`);
      assert(!/^DELETE\b/.test(upper), `no delete: ${line}`);
      assert(!/^INSERT\b/.test(upper), `no insert: ${line}`);
    }
  });

  runTest('repository accepts injected client and has no global prisma import', () => {
    assert(!repositorySource.includes("from '../../lib/prisma'"), 'no global prisma');
    assert(!repositorySource.includes('getPrisma'), 'no getPrisma');
    assert(repositorySource.includes('VionaRequestExecutionAttemptClient'), 'client type exported');
  });

  runTest('repository uses conditional updateMany for state transitions', () => {
    assert(repositorySource.includes('updateMany'), 'conditional updates required');
    assert(repositorySource.includes('expectedStates'), 'expected state guard required');
    assert(!repositorySource.includes('update({'), 'unconditional update forbidden');
  });

  runTest('repository does not import provider orchestrator escrow or audit writers', () => {
    for (const forbidden of [
      'vionaRequestExecutionOrchestrator',
      'vionaTwilioTestRealProviderAdapter',
      'vionaRequestEscrowHoldService',
      'appendVionaExecutionAuditEvent',
      'vionaRequestStatusActionService',
    ] as const) {
      assert(!repositorySource.includes(forbidden), `${forbidden} import forbidden`);
    }
  });

  for (const relativePath of PROTECTED_RUNTIME_PATHS) {
    runTest(`runtime path does not import repository: ${relativePath}`, () => {
      const source = readUtf8(relativePath);
      assert(
        !source.includes('vionaRequestExecutionAttemptRepository'),
        `${relativePath} must not import repository`,
      );
    });
  }

  await runAsyncTest('create attempt does not expose request status mutation API', async () => {
    const fake = makeFakeAttemptClient();
    const row = await createVionaRequestExecutionAttempt(asAttemptClient(fake), {
      requestId: 'req-1',
      attemptNumber: 1,
      executionKey: 'exec-key-1',
      state: VionaRequestExecutionAttemptState.claimed,
      correlationId: 'corr-1',
      principalType: VionaRequestExecutionPrincipalType.merchantService,
      triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
      ownerUserIdSnapshot: 'owner-1',
      scopeKindSnapshot: VionaRequestScopeKind.merchant,
      merchantProfileIdSnapshot: 'profile-1',
      tenantIdSnapshot: 'tenant-1',
    });
    assert(row.requestId === 'req-1', 'attempt created');
    assert(fake.client.vionaRequestExecutionAttempt.updateMany != null, 'fake client intact');
  });

  await runAsyncTest('state transition requires expected current state and exposes zero-row update', async () => {
    const fake = makeFakeAttemptClient();
    await createVionaRequestExecutionAttempt(asAttemptClient(fake), {
      requestId: 'req-2',
      attemptNumber: 1,
      executionKey: 'exec-key-2',
      state: VionaRequestExecutionAttemptState.claimed,
      correlationId: 'corr-2',
      principalType: VionaRequestExecutionPrincipalType.merchantService,
      triggerType: VionaRequestExecutionTriggerType.approvedInternalDispatch,
      ownerUserIdSnapshot: 'owner-2',
      scopeKindSnapshot: VionaRequestScopeKind.merchant,
      tenantIdSnapshot: 'tenant-2',
    });
    const miss = await transitionVionaRequestExecutionAttemptState(asAttemptClient(fake), {
      attemptId: 'attempt-1',
      expectedStates: [VionaRequestExecutionAttemptState.providerPending],
      nextState: VionaRequestExecutionAttemptState.providerSucceeded,
    });
    assert(miss.updated === false, 'wrong expected state must not update');
    const hit = await transitionVionaRequestExecutionAttemptState(asAttemptClient(fake), {
      attemptId: 'attempt-1',
      expectedStates: [VionaRequestExecutionAttemptState.claimed],
      nextState: VionaRequestExecutionAttemptState.providerPending,
    });
    assert(hit.updated === true, 'matching expected state must update');
  });

  await runAsyncTest('lease update can require expected lease owner', async () => {
    const fake = makeFakeAttemptClient();
    await createVionaRequestExecutionAttempt(asAttemptClient(fake), {
      requestId: 'req-3',
      attemptNumber: 1,
      executionKey: 'exec-key-3',
      state: VionaRequestExecutionAttemptState.claimed,
      correlationId: 'corr-3',
      principalType: VionaRequestExecutionPrincipalType.merchantService,
      triggerType: VionaRequestExecutionTriggerType.internalAuthenticatedController,
      ownerUserIdSnapshot: 'owner-3',
      scopeKindSnapshot: VionaRequestScopeKind.merchant,
      tenantIdSnapshot: 'tenant-3',
      leaseOwner: 'worker-a',
    });
    const denied = await updateVionaRequestExecutionAttemptLease(asAttemptClient(fake), {
      attemptId: 'attempt-1',
      expectedStates: [VionaRequestExecutionAttemptState.claimed],
      expectedLeaseOwner: 'worker-b',
      leaseOwner: 'worker-c',
      leaseExpiresAt: new Date('2026-07-15T01:00:00.000Z'),
    });
    assert(denied.updated === false, 'wrong lease owner must fail');
    const ok = await updateVionaRequestExecutionAttemptLease(asAttemptClient(fake), {
      attemptId: 'attempt-1',
      expectedStates: [VionaRequestExecutionAttemptState.claimed],
      expectedLeaseOwner: 'worker-a',
      leaseOwner: 'worker-a',
      leaseExpiresAt: new Date('2026-07-15T01:00:00.000Z'),
    });
    assert(ok.updated === true, 'matching lease owner must succeed');
  });

  await runAsyncTest('provider outcome binds exact attempt id', async () => {
    const fake = makeFakeAttemptClient();
    await createVionaRequestExecutionAttempt(asAttemptClient(fake), {
      requestId: 'req-4',
      attemptNumber: 1,
      executionKey: 'exec-key-4',
      state: VionaRequestExecutionAttemptState.providerPending,
      correlationId: 'corr-4',
      principalType: VionaRequestExecutionPrincipalType.merchantService,
      triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
      ownerUserIdSnapshot: 'owner-4',
      scopeKindSnapshot: VionaRequestScopeKind.merchant,
      tenantIdSnapshot: 'tenant-4',
    });
    const result = await recordVionaRequestExecutionAttemptProviderOutcome(asAttemptClient(fake), {
      attemptId: 'attempt-1',
      expectedStates: [VionaRequestExecutionAttemptState.providerPending],
      nextState: VionaRequestExecutionAttemptState.providerSucceeded,
      providerName: 'twilio_test_credentials',
      operationCategory: 'send',
      providerIdempotencyKey: 'twilio:req-4:attempt-1:send',
      providerResultDigest: 'digest-1',
    });
    assert(result.updated === true, 'provider outcome must update attempt');
    const byKey = await findVionaRequestExecutionAttemptByProviderIdempotencyKey(
      asAttemptClient(fake),
      'twilio:req-4:attempt-1:send',
    );
    assert(byKey?.id === 'attempt-1', 'provider key binds attempt');
  });

  await runAsyncTest('find helpers return minimal selections', async () => {
    const fake = makeFakeAttemptClient();
    await createVionaRequestExecutionAttempt(asAttemptClient(fake), {
      requestId: 'req-5',
      attemptNumber: 2,
      executionKey: 'exec-key-5',
      state: VionaRequestExecutionAttemptState.claimed,
      correlationId: 'corr-5',
      principalType: VionaRequestExecutionPrincipalType.merchantService,
      triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
      ownerUserIdSnapshot: 'owner-5',
      scopeKindSnapshot: VionaRequestScopeKind.merchant,
      tenantIdSnapshot: 'tenant-5',
      leaseExpiresAt: new Date('2026-07-14T00:00:00.000Z'),
    });
    const byId = await findVionaRequestExecutionAttemptById(asAttemptClient(fake), 'attempt-1');
    assert(byId != null, 'find by id');
    const byKey = await findVionaRequestExecutionAttemptByExecutionKey(asAttemptClient(fake), 'exec-key-5');
    assert(byKey != null, 'find by execution key');
    const active = await findActiveVionaRequestExecutionAttemptForRequest(asAttemptClient(fake), 'req-5');
    assert(active?.attemptNumber === 2, 'active lookup');
    const expired = await findExpiredActiveVionaRequestExecutionAttemptLeases(
      asAttemptClient(fake),
      new Date('2026-07-15T00:00:00.000Z'),
    );
    assert(expired.length === 1, 'expired lease lookup');
  });

  runTest('repository source has no retry loop', () => {
    assert(!repositorySource.includes('while ('), 'retry loop forbidden');
  });

  runTest('no prisma deploy or migrate command added in scripts touched by D1', () => {
    assert(!repositorySource.includes('migrate deploy'), 'no deploy in repository');
  });

  runTest('no secret payload or phone/body fields on attempt model', () => {
    for (const forbidden of ['phoneNumber', 'messageBody', 'providerPayload', 'twilioAuth', 'apiSecret'] as const) {
      assert(!attemptBlock.includes(forbidden), `${forbidden} forbidden`);
    }
  });

  runTest('migration creates all three Pack40D1 enums', () => {
    assert(migration.includes('VionaRequestExecutionAttemptState'), 'attempt state enum');
    assert(migration.includes('VionaRequestExecutionPrincipalType'), 'principal enum');
    assert(migration.includes('VionaRequestExecutionTriggerType'), 'trigger enum');
  });

  runTest('migration FK uses ON DELETE RESTRICT', () => {
    assert(migration.includes('ON DELETE RESTRICT ON UPDATE CASCADE'), 'restrict FK');
  });

  runTest('existing VionaRequest status field unchanged', () => {
    assert(/status\s+String\s+@default\("draft"\)/.test(vionaRequestBlock), 'status unchanged');
  });

  runTest('existing MerchantProfile and escrow models unchanged in D1', () => {
    const escrowBlock = extractModelBlock(schema, 'VionaRequestEscrowHold');
    assert(escrowBlock.includes('idempotencyKey'), 'escrow unchanged');
    assert(extractModelBlock(schema, 'MerchantProfile').includes('isActive'), 'merchant profile unchanged');
  });

  runTest('orchestrator source unchanged by repository wiring', () => {
    const orchestrator = readUtf8('src/services/viona/vionaRequestExecutionOrchestrator.ts');
    assert(!orchestrator.includes('ExecutionAttempt'), 'orchestrator untouched');
  });

  runTest('Pack40C status service unchanged', () => {
    const status = readUtf8('src/services/viona/vionaRequestStatusActionService.ts');
    assert(status.includes('transitionVionaRequestStatus'), 'Pack40C intact');
    assert(!status.includes('ExecutionAttempt'), 'no attempt wiring in Pack40C');
  });

  runTest('no deploy or db push commands in repository source', () => {
    assert(!repositorySource.includes('migrate deploy'), 'no deploy in repository');
    assert(!repositorySource.includes('db push'), 'no db push in repository');
  });

  runTest('no prisma deploy command in D1 test script body', () => {
    assert(!/migrate\s+deploy/.test(repositorySource), 'repository must not run migrate deploy');
  });

  runTest('Pack40S remains unimplemented in canonical plan header', () => {
    const plan = readUtf8('docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md');
    assert(plan.includes('Pack40S'), 'Pack40S referenced');
  });

  console.log(`\nPack40D1 schema/repository suite: ${passed} passed`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
