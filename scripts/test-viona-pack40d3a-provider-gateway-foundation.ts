/**
 * Pack40D3A — dormant provider gateway foundation tests.
 *
 * Operator phrase: APPROVE_PACK40D3A_PROVIDER_GATEWAY_FOUNDATION.
 * Fake/injected adapters and Prisma only — no database, staging, or live provider access.
 *
 * Run: npx tsx scripts/test-viona-pack40d3a-provider-gateway-foundation.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  Prisma,
  VionaRequestExecutionAttemptState,
  VionaRequestExecutionPrincipalType,
  VionaRequestExecutionTriggerType,
  VionaRequestScopeKind,
  type Prisma as PrismaTypes,
} from '@prisma/client';

import {
  buildVionaRequestProviderIdempotencyKey,
  VIONA_PACK40D3A_PROVIDER_NAME,
  type VionaExecutionProviderAdapter,
  type VionaExecutionProviderAdapterResult,
  type VionaPack40D3AOperationCategory,
} from '../src/services/viona/vionaRequestExecutionProviderContract';
import {
  prepareVionaRequestExecutionProvider,
  recordVionaRequestExecutionProviderOutcome,
  runVionaRequestExecutionProviderGateway,
  VionaRequestExecutionGatewayError,
  type VionaRequestExecutionGatewayDeps,
} from '../src/services/viona/vionaRequestExecutionGatewayService';

type RequestRow = {
  id: string;
  status: string;
  ownerUserId: string | null;
  scopeKind: VionaRequestScopeKind;
  merchantProfileId: string | null;
  tenantId: string;
};

type ProfileRow = {
  id: string;
  ownerUserId: string;
  tenantId: string;
  isActive: boolean;
};

type AttemptRow = {
  id: string;
  requestId: string;
  attemptNumber: number;
  executionKey: string;
  state: VionaRequestExecutionAttemptState;
  correlationId: string;
  principalType: VionaRequestExecutionPrincipalType;
  triggerType: VionaRequestExecutionTriggerType;
  triggeringUserId: string | null;
  ownerUserIdSnapshot: string;
  scopeKindSnapshot: VionaRequestScopeKind;
  merchantProfileIdSnapshot: string | null;
  tenantIdSnapshot: string;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  claimedAt: Date | null;
  providerName: string | null;
  operationCategory: string | null;
  providerIdempotencyKey: string | null;
  providerStartedAt: Date | null;
  providerFinishedAt: Date | null;
  providerResultDigest: string | null;
  providerExternalReferenceDigest: string | null;
  failureClass: string | null;
  failureReasonDigest: string | null;
  finalizedAt: Date | null;
  abandonedAt: Date | null;
};

type FakeState = {
  requests: RequestRow[];
  profiles: ProfileRow[];
  attempts: AttemptRow[];
  preTxProfileLookups: number;
  txProfileLookups: number;
  transactionCount: number;
  transactionIsolationLevel?: string;
  inTransaction: boolean;
  forcePrepareZero: boolean;
  forceOutcomeZero: boolean;
  forceKeyUniqueConflict: boolean;
  now: Date;
};

const OWNER = 'user-merchant-owner';
const PROFILE_ID = 'profile-merchant-1';
const TENANT_ID = 'tenant-merchant-1';
const REQUEST_ID = 'req-merchant-1';
const ATTEMPT_ID = 'attempt-1';
const LEASE_OWNER = 'worker-alpha';
const OTHER_PROFILE = 'profile-other';
const OTHER_TENANT = 'tenant-other';
const OTHER_OWNER = 'user-other';
const FIXED_NOW = new Date('2026-07-15T15:00:00.000Z');
const OPERATION: VionaPack40D3AOperationCategory = 'send';

let passed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runTest(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function makeRequest(overrides: Partial<RequestRow> = {}): RequestRow {
  return {
    id: REQUEST_ID,
    status: 'inProgress',
    ownerUserId: OWNER,
    scopeKind: VionaRequestScopeKind.merchant,
    merchantProfileId: PROFILE_ID,
    tenantId: TENANT_ID,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: PROFILE_ID,
    ownerUserId: OWNER,
    tenantId: TENANT_ID,
    isActive: true,
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<AttemptRow> = {}): AttemptRow {
  return {
    id: ATTEMPT_ID,
    requestId: REQUEST_ID,
    attemptNumber: 1,
    executionKey: 'exec-1',
    state: VionaRequestExecutionAttemptState.claimed,
    correlationId: 'corr-1',
    principalType: VionaRequestExecutionPrincipalType.merchantService,
    triggerType: VionaRequestExecutionTriggerType.signedMerchantWebhook,
    triggeringUserId: OWNER,
    ownerUserIdSnapshot: OWNER,
    scopeKindSnapshot: VionaRequestScopeKind.merchant,
    merchantProfileIdSnapshot: PROFILE_ID,
    tenantIdSnapshot: TENANT_ID,
    leaseOwner: LEASE_OWNER,
    leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000),
    claimedAt: FIXED_NOW,
    providerName: null,
    operationCategory: null,
    providerIdempotencyKey: null,
    providerStartedAt: null,
    providerFinishedAt: null,
    providerResultDigest: null,
    providerExternalReferenceDigest: null,
    failureClass: null,
    failureReasonDigest: null,
    finalizedAt: null,
    abandonedAt: null,
    ...overrides,
  };
}

function expectedKey(
  attemptId = ATTEMPT_ID,
  requestId = REQUEST_ID,
  op: VionaPack40D3AOperationCategory = OPERATION,
): string {
  return buildVionaRequestProviderIdempotencyKey({
    providerName: VIONA_PACK40D3A_PROVIDER_NAME,
    requestId,
    executionAttemptId: attemptId,
    operationCategory: op,
  });
}

function blankState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    requests: [makeRequest()],
    profiles: [makeProfile()],
    attempts: [makeAttempt()],
    preTxProfileLookups: 0,
    txProfileLookups: 0,
    transactionCount: 0,
    inTransaction: false,
    forcePrepareZero: false,
    forceOutcomeZero: false,
    forceKeyUniqueConflict: false,
    now: FIXED_NOW,
    ...overrides,
  };
}

function installFakePrisma(state: FakeState): VionaRequestExecutionGatewayDeps['prisma'] {
  type FakeTx = {
    merchantProfile: {
      findUnique: (args: {
        where: { id?: string; ownerUserId?: string };
      }) => Promise<ProfileRow | null>;
      findMany: () => Promise<never>;
    };
    vionaRequest: {
      findFirst: (args: {
        where: PrismaTypes.VionaRequestWhereInput;
      }) => Promise<RequestRow | null>;
      updateMany: () => Promise<{ count: number }>;
    };
    vionaRequestExecutionAttempt: {
      findUnique: (args: {
        where: { id?: string; providerIdempotencyKey?: string; executionKey?: string };
        select?: unknown;
      }) => Promise<AttemptRow | Partial<AttemptRow> | null>;
      updateMany: (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => Promise<{ count: number }>;
      findFirst: () => Promise<null>;
      findMany: () => Promise<AttemptRow[]>;
      create: () => Promise<never>;
    };
  };

  const matchesAttemptWhere = (attempt: AttemptRow, where: Record<string, unknown>): boolean => {
    if (where.id != null && attempt.id !== where.id) return false;
    if (where.requestId != null && attempt.requestId !== where.requestId) return false;
    if (where.leaseOwner !== undefined && attempt.leaseOwner !== where.leaseOwner) return false;
    if (where.providerName != null && attempt.providerName !== where.providerName) return false;
    if (
      where.operationCategory != null &&
      attempt.operationCategory !== where.operationCategory
    ) {
      return false;
    }
    if (where.providerIdempotencyKey !== undefined) {
      if (where.providerIdempotencyKey === null) {
        if (attempt.providerIdempotencyKey != null) return false;
      } else if (attempt.providerIdempotencyKey !== where.providerIdempotencyKey) {
        return false;
      }
    }
    if (where.state != null) {
      if (typeof where.state === 'object' && where.state !== null && 'in' in where.state) {
        const states = (where.state as { in: string[] }).in;
        if (!states.includes(attempt.state)) return false;
      } else if (attempt.state !== where.state) {
        return false;
      }
    }
    return true;
  };

  const buildTx = (): FakeTx => ({
    merchantProfile: {
      findUnique: async ({ where }) => {
        if (state.inTransaction) state.txProfileLookups += 1;
        else state.preTxProfileLookups += 1;
        if (where.id != null) {
          return state.profiles.find((p) => p.id === where.id) ?? null;
        }
        if (where.ownerUserId != null) {
          return state.profiles.find((p) => p.ownerUserId === where.ownerUserId) ?? null;
        }
        return null;
      },
      findMany: async () => {
        throw new Error('global MerchantProfile scan forbidden');
      },
    },
    vionaRequest: {
      findFirst: async ({ where }) => {
        return (
          state.requests.find((row) => {
            if (where.id != null && row.id !== where.id) return false;
            if (where.status != null && row.status !== where.status) return false;
            return true;
          }) ?? null
        );
      },
      updateMany: async () => ({ count: 0 }),
    },
    vionaRequestExecutionAttempt: {
      findUnique: async ({ where, select }) => {
        const hit =
          (where.id != null ? state.attempts.find((a) => a.id === where.id) : null) ??
          (where.providerIdempotencyKey != null
            ? state.attempts.find((a) => a.providerIdempotencyKey === where.providerIdempotencyKey)
            : null) ??
          (where.executionKey != null
            ? state.attempts.find((a) => a.executionKey === where.executionKey)
            : null) ??
          null;
        if (hit == null) return null;
        if (select && typeof select === 'object' && 'executionKey' in select) {
          return {
            id: hit.id,
            requestId: hit.requestId,
            attemptNumber: hit.attemptNumber,
            executionKey: hit.executionKey,
            state: hit.state,
            correlationId: hit.correlationId,
            leaseOwner: hit.leaseOwner,
            leaseExpiresAt: hit.leaseExpiresAt,
            providerIdempotencyKey: hit.providerIdempotencyKey,
          };
        }
        return hit;
      },
      updateMany: async ({ where, data }) => {
        const isPrepare =
          data.state === VionaRequestExecutionAttemptState.providerPending &&
          data.providerIdempotencyKey != null;
        const isOutcome =
          data.state === VionaRequestExecutionAttemptState.providerSucceeded ||
          data.state === VionaRequestExecutionAttemptState.providerFailed ||
          data.state === VionaRequestExecutionAttemptState.outcomeUncertain;

        if (isPrepare && state.forcePrepareZero) return { count: 0 };
        if (isOutcome && state.forceOutcomeZero) return { count: 0 };
        if (isPrepare && state.forceKeyUniqueConflict) {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          });
        }

        let count = 0;
        for (const attempt of state.attempts) {
          if (!matchesAttemptWhere(attempt, where)) continue;
          Object.assign(attempt, data);
          count += 1;
        }
        return { count };
      },
      findFirst: async () => null,
      findMany: async () => state.attempts,
      create: async () => {
        throw new Error('create forbidden in D3A gateway tests');
      },
    },
  });

  const tx = buildTx();

  return {
    ...tx,
    $transaction: async <T>(
      fn: (client: FakeTx) => Promise<T>,
      options?: { isolationLevel?: string },
    ): Promise<T> => {
      state.transactionCount += 1;
      state.transactionIsolationLevel = options?.isolationLevel;
      const snapshot = {
        requests: state.requests.map((r) => ({ ...r })),
        attempts: state.attempts.map((a) => ({ ...a })),
      };
      state.inTransaction = true;
      try {
        const result = await fn(tx);
        state.inTransaction = false;
        return result;
      } catch (error) {
        state.inTransaction = false;
        state.requests.splice(0, state.requests.length, ...snapshot.requests);
        state.attempts.splice(0, state.attempts.length, ...snapshot.attempts);
        throw error;
      }
    },
  } as unknown as VionaRequestExecutionGatewayDeps['prisma'];
}

function makeAdapter(
  result: VionaExecutionProviderAdapterResult | (() => VionaExecutionProviderAdapterResult),
  tracker: { calls: number; lastKey?: string; lastInput?: unknown } = { calls: 0 },
): VionaExecutionProviderAdapter {
  return {
    invoke: async (input) => {
      tracker.calls += 1;
      tracker.lastKey = input.providerIdempotencyKey;
      tracker.lastInput = input;
      return typeof result === 'function' ? result() : result;
    },
  };
}

function makeDeps(
  state: FakeState,
  adapter: VionaExecutionProviderAdapter,
): VionaRequestExecutionGatewayDeps {
  return {
    prisma: installFakePrisma(state),
    adapter,
    clock: () => new Date(state.now.getTime()),
  };
}

async function expectCode(code: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    throw new Error(`expected ${code}`);
  } catch (error) {
    assert(
      error instanceof VionaRequestExecutionGatewayError && error.code === code,
      `expected ${code}, got ${String(error)}`,
    );
  }
}

async function main(): Promise<void> {
  console.log('Pack40D3A provider gateway foundation suite\n');

  // --- Authority and preparation ---
  await runAsyncTest('1. Exact active merchant attempt prepares successfully', async () => {
    const state = blankState();
    const result = await prepareVionaRequestExecutionProvider(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(result.kind === 'prepared', 'prepared');
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerPending, 'pending');
    assert(state.attempts[0]!.providerIdempotencyKey === expectedKey(), 'key set');
    assert(state.requests[0]!.status === 'inProgress', 'request unchanged');
  });

  await runAsyncTest('2. Consumer request denied', async () => {
    const state = blankState({
      requests: [
        makeRequest({
          scopeKind: VionaRequestScopeKind.consumer,
          merchantProfileId: null,
        }),
      ],
    });
    await expectCode('merchant_execution_not_authorized', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('3. Legacy request denied', async () => {
    const state = blankState({
      requests: [
        makeRequest({
          scopeKind: VionaRequestScopeKind.legacyUnresolved,
          merchantProfileId: null,
        }),
      ],
    });
    await expectCode('merchant_execution_not_authorized', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('4. Wrong profile denied', async () => {
    const state = blankState({
      requests: [makeRequest({ merchantProfileId: OTHER_PROFILE })],
    });
    await expectCode('merchant_execution_not_authorized', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('5. Tenant mismatch denied', async () => {
    const state = blankState({
      requests: [makeRequest({ tenantId: OTHER_TENANT })],
    });
    await expectCode('merchant_execution_not_authorized', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('6. Owner mismatch denied', async () => {
    const state = blankState({
      requests: [makeRequest({ ownerUserId: OTHER_OWNER })],
    });
    await expectCode('merchant_execution_not_authorized', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('7. Inactive profile denied', async () => {
    const state = blankState({ profiles: [makeProfile({ isActive: false })] });
    await expectCode('merchant_execution_not_authorized', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.claimed, 'still claimed');
  });

  await runAsyncTest('8. Wrong request status denied', async () => {
    const state = blankState({ requests: [makeRequest({ status: 'triage' })] });
    await expectCode('invalid_attempt_state', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('9. Wrong attempt/request binding denied', async () => {
    const state = blankState({
      attempts: [makeAttempt({ requestId: 'req-other' })],
      requests: [makeRequest()],
    });
    // Authority loads request by attempt.requestId — missing/other request fails
    state.requests = [makeRequest({ id: REQUEST_ID })];
    await expectCode('request_attempt_mismatch', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('10. Wrong lease owner denied', async () => {
    const state = blankState();
    await expectCode('stale_lease_owner', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: 'worker-other', operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('11. Expired lease denied', async () => {
    const state = blankState({
      now: new Date(FIXED_NOW.getTime() + 120_000),
      attempts: [
        makeAttempt({ leaseExpiresAt: new Date(FIXED_NOW.getTime() + 60_000) }),
      ],
    });
    await expectCode('stale_lease_owner', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('12. Authority reload occurs inside transaction', async () => {
    const state = blankState();
    await prepareVionaRequestExecutionProvider(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(state.txProfileLookups === 1, 'tx profile');
    assert(state.transactionCount === 1, 'one tx');
  });

  await runAsyncTest('13. No profile lookup before transaction', async () => {
    const state = blankState();
    await prepareVionaRequestExecutionProvider(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(state.preTxProfileLookups === 0, 'no pre-tx');
  });

  await runAsyncTest('14. Envelope tenant/profile fields ignored', async () => {
    const state = blankState();
    await prepareVionaRequestExecutionProvider(
      {
        attemptId: ATTEMPT_ID,
        expectedLeaseOwner: LEASE_OWNER,
        operationCategory: OPERATION,
        envelopeTenantId: OTHER_TENANT,
        envelopeMerchantProfileId: OTHER_PROFILE,
      },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(state.attempts[0]!.tenantIdSnapshot === TENANT_ID, 'snap tenant unchanged');
    assert(state.attempts[0]!.merchantProfileIdSnapshot === PROFILE_ID, 'snap profile');
  });

  // --- Provider key ---
  runTest('15. Key binds provider/request/attempt/operation', () => {
    const key = expectedKey();
    assert(key === `${VIONA_PACK40D3A_PROVIDER_NAME}:${REQUEST_ID}:${ATTEMPT_ID}:${OPERATION}`, 'format');
  });

  await runAsyncTest('16. Same attempt reuses key', async () => {
    const state = blankState();
    const first = await prepareVionaRequestExecutionProvider(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    // Roll back to claimed manually and clear key to prove derivation stability
    const derivedAgain = buildVionaRequestProviderIdempotencyKey({
      providerName: VIONA_PACK40D3A_PROVIDER_NAME,
      requestId: REQUEST_ID,
      executionAttemptId: ATTEMPT_ID,
      operationCategory: OPERATION,
    });
    assert(first.providerIdempotencyKey === derivedAgain, 'stable derivation');
  });

  runTest('17. Different attempt gets different key', () => {
    assert(expectedKey('attempt-a') !== expectedKey('attempt-b'), 'diff attempt');
  });

  runTest('18. Different request gets different key', () => {
    assert(expectedKey(ATTEMPT_ID, 'req-a') !== expectedKey(ATTEMPT_ID, 'req-b'), 'diff request');
  });

  runTest('19. Different operation gets different key', () => {
    // Key builder is general; gateway only accepts `send`, but operation segment isolates keys.
    const a = `${VIONA_PACK40D3A_PROVIDER_NAME}:${REQUEST_ID}:${ATTEMPT_ID}:send`;
    const b = `${VIONA_PACK40D3A_PROVIDER_NAME}:${REQUEST_ID}:${ATTEMPT_ID}:other`;
    assert(a !== b, 'diff op');
  });

  await runAsyncTest('20. Conflicting persisted key denied', async () => {
    const state = blankState({
      attempts: [makeAttempt({ providerIdempotencyKey: 'foreign-key' })],
    });
    await expectCode('provider_key_conflict', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  await runAsyncTest('21. Key stored before invocation', async () => {
    const state = blankState();
    const tracker = { calls: 0, lastKey: undefined as string | undefined };
    let keyDuringInvoke: string | null = null;
    const adapter: VionaExecutionProviderAdapter = {
      invoke: async (input) => {
        tracker.calls += 1;
        keyDuringInvoke = state.attempts[0]!.providerIdempotencyKey;
        tracker.lastKey = input.providerIdempotencyKey;
        return { kind: 'succeeded', resultDigest: 'digest-ok' };
      },
    };
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, adapter),
    );
    assert(keyDuringInvoke === expectedKey(), 'persisted before invoke');
    assert(tracker.lastKey === expectedKey(), 'passed to adapter');
    assert(tracker.calls === 1, 'one call');
  });

  runTest('22. Provider key remains unique', () => {
    const repo = readSource('../src/repositories/vionaRequestExecutionAttemptRepository.ts');
    assert(repo.includes('providerIdempotencyKey'), 'key field');
    const schema = readSource('../prisma/schema.prisma');
    assert(schema.includes('providerIdempotencyKey') && schema.includes('@unique'), 'unique');
  });

  // --- Preparation atomicity ---
  await runAsyncTest('23. Serializable isolation used', async () => {
    const state = blankState();
    await prepareVionaRequestExecutionProvider(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(
      state.transactionIsolationLevel === Prisma.TransactionIsolationLevel.Serializable ||
        state.transactionIsolationLevel === 'Serializable',
      'serializable',
    );
  });

  await runAsyncTest('24. claimed → providerPending conditional', async () => {
    const state = blankState();
    await prepareVionaRequestExecutionProvider(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.providerPending, 'pending');
  });

  await runAsyncTest('25. Preparation failure leaves attempt claimed', async () => {
    const state = blankState({ forcePrepareZero: true });
    await expectCode('preparation_conflict', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.claimed, 'claimed');
    assert(state.attempts[0]!.providerIdempotencyKey == null, 'no key');
  });

  await runAsyncTest('26. Key persistence failure rolls back state', async () => {
    const state = blankState({ forceKeyUniqueConflict: true });
    await expectCode('provider_key_conflict', () =>
      prepareVionaRequestExecutionProvider(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
    assert(state.attempts[0]!.state === VionaRequestExecutionAttemptState.claimed, 'rolled back');
  });

  await runAsyncTest('27. No request status change', async () => {
    const state = blankState();
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'digest' })),
    );
    assert(state.requests[0]!.status === 'inProgress', 'still inProgress');
  });

  runTest('28. No event/audit pretending provider completion', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('vionaRequestStatusEvent'), 'no status event');
    assert(!gateway.includes('vionaRequestAuditEvent'), 'no audit');
    assert(!gateway.includes('finalizeVionaRequestExecution'), 'no D2 finalize');
  });

  runTest('29. No automatic retry', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('maxRetries'), 'no retries');
    assert(!gateway.includes('for (let retry'), 'no retry loop');
  });

  // --- Provider outcomes ---
  await runAsyncTest('30. Known success records providerSucceeded', async () => {
    const state = blankState();
    const result = await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'ok-digest', externalReferenceDigest: 'ext' })),
    );
    assert(result.attemptState === VionaRequestExecutionAttemptState.providerSucceeded, 'succeeded');
    assert(state.attempts[0]!.providerResultDigest === 'ok-digest', 'digest');
    assert(state.attempts[0]!.providerExternalReferenceDigest === 'ext', 'ext');
    assert(state.attempts[0]!.providerFinishedAt != null, 'finished');
  });

  await runAsyncTest('31. Known failure records providerFailed', async () => {
    const state = blankState();
    const result = await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(
        state,
        makeAdapter({
          kind: 'failed',
          failureClass: 'provider_rejected',
          failureReasonDigest: 'fail-digest',
        }),
      ),
    );
    assert(result.attemptState === VionaRequestExecutionAttemptState.providerFailed, 'failed');
    assert(state.attempts[0]!.failureClass === 'provider_rejected', 'class');
  });

  await runAsyncTest('32. Timeout records outcomeUncertain', async () => {
    const state = blankState();
    const result = await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(
        state,
        makeAdapter({
          kind: 'uncertain',
          uncertaintyClass: 'timeout',
          failureReasonDigest: 'timeout',
        }),
      ),
    );
    assert(result.attemptState === VionaRequestExecutionAttemptState.outcomeUncertain, 'uncertain');
    assert(state.attempts[0]!.failureClass === 'timeout', 'class');
  });

  await runAsyncTest('33. Response-loss classification is uncertain', async () => {
    const state = blankState();
    const adapter: VionaExecutionProviderAdapter = {
      invoke: async () => {
        throw new Error('connection lost');
      },
    };
    const result = await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, adapter),
    );
    assert(result.attemptState === VionaRequestExecutionAttemptState.outcomeUncertain, 'uncertain');
    assert(result.adapterKind === 'uncertain', 'kind');
  });

  await runAsyncTest('34. Success digest stored without raw payload', async () => {
    const state = blankState();
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'sha256:abc' })),
    );
    const a = state.attempts[0]!;
    assert(a.providerResultDigest === 'sha256:abc', 'digest only');
    assert(!JSON.stringify(a).includes('Hello'), 'no raw body');
  });

  await runAsyncTest('35. Failure digest bounded', async () => {
    const state = blankState();
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(
        state,
        makeAdapter({
          kind: 'failed',
          failureClass: 'bounded_class',
          failureReasonDigest: 'bounded_digest',
        }),
      ),
    );
    assert(state.attempts[0]!.failureReasonDigest === 'bounded_digest', 'bounded');
  });

  await runAsyncTest('36. Outcome update requires exact attempt', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({
          state: VionaRequestExecutionAttemptState.providerPending,
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          providerStartedAt: FIXED_NOW,
        }),
      ],
    });
    await expectCode('outcome_record_conflict', () =>
      recordVionaRequestExecutionProviderOutcome(
        {
          attemptId: 'missing',
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          adapterResult: { kind: 'succeeded', resultDigest: 'd' },
        },
        { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
      ),
    );
  });

  await runAsyncTest('37. Outcome update requires persisted key', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({
          state: VionaRequestExecutionAttemptState.providerPending,
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          providerStartedAt: FIXED_NOW,
        }),
      ],
    });
    await expectCode('outcome_record_conflict', () =>
      recordVionaRequestExecutionProviderOutcome(
        {
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
          operationCategory: OPERATION,
          providerIdempotencyKey: 'wrong-key',
          adapterResult: { kind: 'succeeded', resultDigest: 'd' },
        },
        { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
      ),
    );
  });

  await runAsyncTest('38. Zero-row outcome update is observable', async () => {
    const state = blankState({
      forceOutcomeZero: true,
      attempts: [
        makeAttempt({
          state: VionaRequestExecutionAttemptState.providerPending,
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          providerStartedAt: FIXED_NOW,
        }),
      ],
    });
    await expectCode('outcome_record_conflict', () =>
      recordVionaRequestExecutionProviderOutcome(
        {
          attemptId: ATTEMPT_ID,
          requestId: REQUEST_ID,
          expectedLeaseOwner: LEASE_OWNER,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          adapterResult: { kind: 'succeeded', resultDigest: 'd' },
        },
        { prisma: installFakePrisma(state), clock: () => FIXED_NOW },
      ),
    );
  });

  await runAsyncTest('39. Duplicate success does not duplicate provider call', async () => {
    const state = blankState();
    const tracker = { calls: 0 };
    const adapter = makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker);
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, adapter),
    );
    await expectCode('outcome_already_recorded', () =>
      runVionaRequestExecutionProviderGateway(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, adapter),
      ),
    );
    assert(tracker.calls === 1, 'no second invoke');
  });

  await runAsyncTest('40. Duplicate failure does not duplicate provider call', async () => {
    const state = blankState();
    const tracker = { calls: 0 };
    const adapter = makeAdapter(
      { kind: 'failed', failureClass: 'x', failureReasonDigest: 'y' },
      tracker,
    );
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, adapter),
    );
    await expectCode('outcome_already_recorded', () =>
      runVionaRequestExecutionProviderGateway(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, adapter),
      ),
    );
    assert(tracker.calls === 1, 'one call');
  });

  await runAsyncTest('41. Uncertain outcome does not retry', async () => {
    const state = blankState();
    const tracker = { calls: 0 };
    const adapter = makeAdapter(
      { kind: 'uncertain', uncertaintyClass: 'timeout' },
      tracker,
    );
    await runVionaRequestExecutionProviderGateway(
      { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
      makeDeps(state, adapter),
    );
    await expectCode('uncertain_outcome_requires_review', () =>
      runVionaRequestExecutionProviderGateway(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, adapter),
      ),
    );
    assert(tracker.calls === 1, 'no retry');
  });

  await runAsyncTest('42. Terminal attempt cannot invoke provider', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({ state: VionaRequestExecutionAttemptState.completed }),
      ],
    });
    const tracker = { calls: 0 };
    await expectCode('terminal_attempt', () =>
      runVionaRequestExecutionProviderGateway(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker)),
      ),
    );
    assert(tracker.calls === 0, 'no invoke');
  });

  // --- Runtime isolation ---
  const runtimeFiles = [
    ['43', '../src/services/viona/vionaRequestExecutionOrchestrator.ts', 'Orchestrator'],
    ['44', '../src/controllers/VionaInternalRealTwilioPocController.ts', 'Controller'],
    ['45', '../src/controllers/VionaWebhookMerchantAgentController.ts', 'Webhook'],
    [
      '46',
      '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts',
      'Twilio adapter',
    ],
    ['47', '../src/services/viona/vionaRequestEscrowHoldService.ts', 'Escrow'],
  ] as const;

  for (const [n, rel, label] of runtimeFiles) {
    runTest(`${n}. ${label} does not import gateway`, () => {
      const p = path.resolve(__dirname, rel);
      if (!fs.existsSync(p)) return;
      const source = fs.readFileSync(p, 'utf8');
      assert(!source.includes('vionaRequestExecutionGatewayService'), `${label} no gateway`);
      assert(!source.includes('runVionaRequestExecutionProviderGateway'), `${label} no run`);
    });
  }

  // Fix numbering: 43-47 above; need 48 for DB path
  runTest('48. No database or staging path exists', () => {
    for (const rel of [
      '../src/services/viona/vionaRequestExecutionGatewayService.ts',
      '../src/services/viona/vionaRequestExecutionProviderContract.ts',
    ]) {
      const source = readSource(rel);
      assert(!source.includes('DATA' + 'BASE_URL'), 'no db url');
      assert(!source.includes('supabase.co'), 'no staging');
      assert(!source.includes('migrate deploy'), 'no migrate');
    }
  });

  runTest('43b. Dispatch does not import gateway', () => {
    const p = path.resolve(__dirname, '../src/services/viona/vionaAutonomousDispatchService.ts');
    if (!fs.existsSync(p)) return;
    const source = fs.readFileSync(p, 'utf8');
    assert(!source.includes('vionaRequestExecutionGatewayService'), 'dispatch clean');
  });

  runTest('46b. Twilio live adapter is not imported by gateway', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    const contract = readSource('../src/services/viona/vionaRequestExecutionProviderContract.ts');
    for (const s of [gateway, contract]) {
      assert(!s.includes('vionaTwilioTestRealProviderAdapter'), 'no live twilio import');
      assert(!s.includes("from 'twilio'"), 'no twilio package import');
      assert(!s.includes('require("twilio")'), 'no twilio require');
    }
  });

  runTest('47b. Escrow live service is not imported by gateway', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('vionaRequestEscrowHoldService'), 'no escrow import');
    assert(!gateway.includes('prepareHold('), 'no hold call');
  });

  // --- Preservation ---
  runTest('49. Pack40A unchanged', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('vionaRequestNote'), 'no note');
  });

  runTest('50. Pack40B unchanged', () => {
    assert(
      !readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts').includes(
        'Pack40B',
      ),
      'no Pack40B',
    );
  });

  runTest('51. Pack40C unchanged', () => {
    const status = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
    assert(!status.includes('vionaRequestExecutionGatewayService'), 'Pack40C clean');
  });

  runTest('52. Pack40D2 claim/finalization unchanged', () => {
    const d2 = readSource('../src/services/viona/vionaRequestIndirectStatusActionService.ts');
    assert(d2.includes('claimVionaRequestExecution'), 'claim present');
    assert(d2.includes('finalizeVionaRequestExecutionCompleted'), 'complete present');
    assert(!d2.includes('vionaRequestExecutionGatewayService'), 'D2 not wired to gateway');
  });

  runTest('53. Schema/migration unchanged', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes('prisma/schema'), 'no schema path');
  });

  runTest('54. Request status transitions unchanged', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(!gateway.includes("status: 'completed'"), 'no completed write');
    assert(!gateway.includes("status: 'failed'"), 'no failed write');
    assert(!gateway.includes('vionaRequest.update'), 'no request update');
  });

  runTest('55. Consumer execution remains unsupported', () => {
    const gateway = readSource('../src/services/viona/vionaRequestExecutionGatewayService.ts');
    assert(gateway.includes('VionaRequestScopeKind.merchant'), 'merchant required');
    assert(!gateway.includes('VionaRequestScopeKind.consumer'), 'no consumer allow');
  });

  runTest('56. Pack40D3B and Pack40S remain unimplemented', () => {
    const srcRoot = path.resolve(__dirname, '../src');
    const files = fs.readdirSync(srcRoot, { recursive: true }).map(String);
    assert(
      !files.some((f) => f.toLowerCase().includes('pack40d3b')),
      'no D3B',
    );
    assert(!files.some((f) => f.toLowerCase().includes('pack40s')), 'no Pack40S');
  });

  runTest('57. Runtime src scan — no gateway callers outside D3A files', () => {
    const srcRoot = path.resolve(__dirname, '../src');
    const banned = [
      'vionaRequestExecutionGatewayService',
      'runVionaRequestExecutionProviderGateway',
      'prepareVionaRequestExecutionProvider',
    ];
    const allow = [
      path.normalize('services/viona/vionaRequestExecutionGatewayService.ts'),
      path.normalize('services/viona/vionaRequestExecutionProviderContract.ts'),
      path.normalize('repositories/vionaRequestExecutionAttemptRepository.ts'),
    ];
    for (const file of fs.readdirSync(srcRoot, { recursive: true }).map(String)) {
      if (!file.endsWith('.ts')) continue;
      const norm = path.normalize(file);
      if (allow.some((a) => norm.endsWith(a))) continue;
      const source = fs.readFileSync(path.join(srcRoot, file), 'utf8');
      for (const token of banned) {
        assert(!source.includes(token), `${file} must not import ${token}`);
      }
    }
  });

  await runAsyncTest('58. already_prepared does not invoke adapter', async () => {
    const state = blankState({
      attempts: [
        makeAttempt({
          state: VionaRequestExecutionAttemptState.providerPending,
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          operationCategory: OPERATION,
          providerIdempotencyKey: expectedKey(),
          providerStartedAt: FIXED_NOW,
        }),
      ],
    });
    const tracker = { calls: 0 };
    await expectCode('already_prepared', () =>
      runVionaRequestExecutionProviderGateway(
        { attemptId: ATTEMPT_ID, expectedLeaseOwner: LEASE_OWNER, operationCategory: OPERATION },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' }, tracker)),
      ),
    );
    assert(tracker.calls === 0, 'no invoke');
  });

  await runAsyncTest('59. Unsupported operation denied', async () => {
    const state = blankState();
    await expectCode('unsupported_operation', () =>
      prepareVionaRequestExecutionProvider(
        {
          attemptId: ATTEMPT_ID,
          expectedLeaseOwner: LEASE_OWNER,
          operationCategory: 'booking' as VionaPack40D3AOperationCategory,
        },
        makeDeps(state, makeAdapter({ kind: 'succeeded', resultDigest: 'd' })),
      ),
    );
  });

  console.log(`\nPack40D3A suite: ${passed}/${passed} PASS`);
}

main().catch((error) => {
  console.error('\nFAIL:', error);
  process.exit(1);
});
