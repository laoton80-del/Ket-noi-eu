/**
 * Pack40D3A — dormant execution-attempt-scoped provider gateway.
 *
 * Owns provider preparation (claimed → providerPending) and durable outcome recording.
 * Does not finalize VionaRequest status (Pack40D2). Does not call live Twilio/escrow.
 * Pack40D3B may invoke this only through the Pack40D coordinator (no direct controller/Twilio path).
 */

import {
  Prisma,
  VionaRequestExecutionAttemptState,
  VionaRequestScopeKind,
  type VionaRequestExecutionAttempt,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  findVionaRequestExecutionAttemptById,
  findVionaRequestExecutionAttemptByProviderIdempotencyKey,
  prepareVionaRequestExecutionAttemptForProvider,
  recordPreparedVionaRequestExecutionAttemptProviderOutcome,
  type VionaRequestExecutionAttemptClient,
} from '../../repositories/vionaRequestExecutionAttemptRepository';
import {
  buildVionaRequestProviderIdempotencyKey,
  isVionaPack40D3AOperationCategory,
  VIONA_PACK40D3A_PROVIDER_NAME,
  type VionaExecutionProviderAdapter,
  type VionaExecutionProviderAdapterResult,
  type VionaPack40D3AOperationCategory,
} from './vionaRequestExecutionProviderContract';

export type Pack40D3AGatewayErrorCode =
  | 'attempt_not_found'
  | 'stale_lease_owner'
  | 'invalid_attempt_state'
  | 'request_attempt_mismatch'
  | 'merchant_execution_not_authorized'
  | 'unsupported_operation'
  | 'provider_key_conflict'
  | 'preparation_conflict'
  | 'already_prepared'
  | 'outcome_already_recorded'
  | 'uncertain_outcome_requires_review'
  | 'outcome_record_conflict'
  | 'terminal_attempt';

export class VionaRequestExecutionGatewayError extends Error {
  readonly code: Pack40D3AGatewayErrorCode;

  constructor(code: Pack40D3AGatewayErrorCode) {
    super(code);
    this.name = 'VionaRequestExecutionGatewayError';
    this.code = code;
  }
}

type GatewayPrisma = Pick<
  ReturnType<typeof getPrisma>,
  'vionaRequest' | 'merchantProfile' | 'vionaRequestExecutionAttempt'
>;

export type Pack40D3AClock = () => Date;

export type Pack40D3AProviderKeyFactory = (input: {
  providerName: typeof VIONA_PACK40D3A_PROVIDER_NAME;
  requestId: string;
  executionAttemptId: string;
  operationCategory: VionaPack40D3AOperationCategory;
}) => string;

export type RunVionaRequestExecutionProviderGatewayInput = Readonly<{
  attemptId: string;
  expectedLeaseOwner: string;
  operationCategory: VionaPack40D3AOperationCategory;
  /** Ignored for authority — accepted only to prove envelope spoofing cannot authorize. */
  envelopeTenantId?: string;
  envelopeMerchantProfileId?: string;
}>;

export type VionaRequestExecutionGatewayDeps = Readonly<{
  prisma?: GatewayPrisma & Pick<ReturnType<typeof getPrisma>, '$transaction'>;
  adapter: VionaExecutionProviderAdapter;
  clock?: Pack40D3AClock;
  buildProviderIdempotencyKey?: Pack40D3AProviderKeyFactory;
}>;

export type PrepareVionaRequestExecutionProviderResult = Readonly<{
  kind: 'prepared';
  attemptId: string;
  requestId: string;
  correlationId: string;
  providerName: typeof VIONA_PACK40D3A_PROVIDER_NAME;
  operationCategory: VionaPack40D3AOperationCategory;
  providerIdempotencyKey: string;
  attemptState: typeof VionaRequestExecutionAttemptState.providerPending;
  requestStatus: 'inProgress';
}>;

export type RunVionaRequestExecutionProviderGatewayResult = Readonly<{
  kind: 'recorded';
  attemptId: string;
  requestId: string;
  providerIdempotencyKey: string;
  attemptState:
    | typeof VionaRequestExecutionAttemptState.providerSucceeded
    | typeof VionaRequestExecutionAttemptState.providerFailed
    | typeof VionaRequestExecutionAttemptState.outcomeUncertain;
  adapterKind: VionaExecutionProviderAdapterResult['kind'];
  providerInvoked: true;
}>;

const REQUEST_AUTHORITY_SELECT = {
  id: true,
  status: true,
  ownerUserId: true,
  scopeKind: true,
  merchantProfileId: true,
  tenantId: true,
} as const;

const PROFILE_SELECT = {
  id: true,
  ownerUserId: true,
  tenantId: true,
  isActive: true,
} as const;

function throwGateway(code: Pack40D3AGatewayErrorCode): never {
  throw new VionaRequestExecutionGatewayError(code);
}

function defaultPrisma() {
  return getPrisma();
}

function mapPrismaConflict(error: unknown): Pack40D3AGatewayErrorCode | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2002' || error.code === 'P2034')
  ) {
    return 'provider_key_conflict';
  }
  return null;
}

function classifyDuplicateState(
  state: VionaRequestExecutionAttemptState,
): Pack40D3AGatewayErrorCode {
  if (state === VionaRequestExecutionAttemptState.providerPending) {
    return 'already_prepared';
  }
  if (state === VionaRequestExecutionAttemptState.outcomeUncertain) {
    return 'uncertain_outcome_requires_review';
  }
  if (
    state === VionaRequestExecutionAttemptState.providerSucceeded ||
    state === VionaRequestExecutionAttemptState.providerFailed
  ) {
    return 'outcome_already_recorded';
  }
  if (
    state === VionaRequestExecutionAttemptState.completed ||
    state === VionaRequestExecutionAttemptState.failed ||
    state === VionaRequestExecutionAttemptState.abandoned
  ) {
    return 'terminal_attempt';
  }
  return 'invalid_attempt_state';
}

async function revalidateMerchantAuthorityForProvider(
  tx: GatewayPrisma,
  attempt: VionaRequestExecutionAttempt,
  expectedLeaseOwner: string,
  now: Date,
): Promise<{ requestId: string }> {
  if (attempt.leaseOwner !== expectedLeaseOwner) {
    throwGateway('stale_lease_owner');
  }
  if (attempt.leaseExpiresAt != null && attempt.leaseExpiresAt.getTime() <= now.getTime()) {
    throwGateway('stale_lease_owner');
  }
  if (attempt.state !== VionaRequestExecutionAttemptState.claimed) {
    throwGateway(classifyDuplicateState(attempt.state));
  }

  const request = await tx.vionaRequest.findFirst({
    where: { id: attempt.requestId },
    select: REQUEST_AUTHORITY_SELECT,
  });
  if (request == null) {
    throwGateway('request_attempt_mismatch');
  }
  if (request.id !== attempt.requestId) {
    throwGateway('request_attempt_mismatch');
  }
  if (request.status !== 'inProgress') {
    throwGateway('invalid_attempt_state');
  }

  const snapshotProfileId = attempt.merchantProfileIdSnapshot;
  if (snapshotProfileId == null || snapshotProfileId.length === 0) {
    throwGateway('merchant_execution_not_authorized');
  }

  const profile = await tx.merchantProfile.findUnique({
    where: { id: snapshotProfileId },
    select: PROFILE_SELECT,
  });
  if (profile == null || !profile.isActive) {
    throwGateway('merchant_execution_not_authorized');
  }

  if (
    request.scopeKind !== VionaRequestScopeKind.merchant ||
    request.merchantProfileId == null ||
    request.merchantProfileId !== profile.id ||
    request.tenantId !== profile.tenantId ||
    request.ownerUserId == null ||
    request.ownerUserId !== profile.ownerUserId ||
    attempt.ownerUserIdSnapshot !== profile.ownerUserId ||
    attempt.tenantIdSnapshot !== profile.tenantId ||
    attempt.scopeKindSnapshot !== VionaRequestScopeKind.merchant
  ) {
    throwGateway('merchant_execution_not_authorized');
  }

  return { requestId: request.id };
}

/**
 * Serializable preparation: claimed → providerPending with persisted provider key.
 * Does not invoke the provider and does not change VionaRequest.status.
 */
export async function prepareVionaRequestExecutionProvider(
  input: RunVionaRequestExecutionProviderGatewayInput,
  deps: Omit<VionaRequestExecutionGatewayDeps, 'adapter'> & {
    adapter?: VionaExecutionProviderAdapter;
  },
): Promise<PrepareVionaRequestExecutionProviderResult> {
  const attemptId = input.attemptId.trim();
  const expectedLeaseOwner = input.expectedLeaseOwner.trim();
  if (attemptId.length === 0 || expectedLeaseOwner.length === 0) {
    throwGateway('invalid_attempt_state');
  }
  if (!isVionaPack40D3AOperationCategory(input.operationCategory)) {
    throwGateway('unsupported_operation');
  }

  // Envelope spoof fields are intentionally unused for authority.
  void input.envelopeTenantId;
  void input.envelopeMerchantProfileId;

  const prisma = deps.prisma ?? defaultPrisma();
  const clock = deps.clock ?? (() => new Date());
  const buildKey = deps.buildProviderIdempotencyKey ?? buildVionaRequestProviderIdempotencyKey;

  try {
    return await prisma.$transaction(
      async (tx) => {
        const now = clock();
        const attempt = await findVionaRequestExecutionAttemptById(
          tx as VionaRequestExecutionAttemptClient,
          attemptId,
        );
        if (attempt == null) {
          throwGateway('attempt_not_found');
        }

        const { requestId } = await revalidateMerchantAuthorityForProvider(
          tx,
          attempt,
          expectedLeaseOwner,
          now,
        );

        if (
          attempt.providerIdempotencyKey != null &&
          attempt.providerIdempotencyKey.length > 0
        ) {
          throwGateway('provider_key_conflict');
        }

        const providerIdempotencyKey = buildKey({
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          requestId,
          executionAttemptId: attemptId,
          operationCategory: input.operationCategory,
        });

        const existingKey = await findVionaRequestExecutionAttemptByProviderIdempotencyKey(
          tx as VionaRequestExecutionAttemptClient,
          providerIdempotencyKey,
        );
        if (existingKey != null && existingKey.id !== attemptId) {
          throwGateway('provider_key_conflict');
        }

        const prepared = await prepareVionaRequestExecutionAttemptForProvider(
          tx as VionaRequestExecutionAttemptClient,
          {
            attemptId,
            expectedRequestId: requestId,
            expectedLeaseOwner,
            providerName: VIONA_PACK40D3A_PROVIDER_NAME,
            operationCategory: input.operationCategory,
            providerIdempotencyKey,
            providerStartedAt: now,
          },
        );
        if (!prepared.updated || prepared.attempt == null) {
          throwGateway('preparation_conflict');
        }

        return {
          kind: 'prepared' as const,
          attemptId,
          requestId,
          correlationId: attempt.correlationId,
          providerName: VIONA_PACK40D3A_PROVIDER_NAME,
          operationCategory: input.operationCategory,
          providerIdempotencyKey,
          attemptState: VionaRequestExecutionAttemptState.providerPending,
          requestStatus: 'inProgress' as const,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof VionaRequestExecutionGatewayError) {
      throw error;
    }
    const conflict = mapPrismaConflict(error);
    if (conflict != null) {
      throwGateway(conflict);
    }
    throw error;
  }
}

export type RecordVionaRequestExecutionProviderOutcomeInput = Readonly<{
  attemptId: string;
  requestId: string;
  expectedLeaseOwner: string;
  operationCategory: VionaPack40D3AOperationCategory;
  providerIdempotencyKey: string;
  adapterResult: VionaExecutionProviderAdapterResult;
}>;

export async function recordVionaRequestExecutionProviderOutcome(
  input: RecordVionaRequestExecutionProviderOutcomeInput,
  deps: Readonly<{
    prisma?: GatewayPrisma & Pick<ReturnType<typeof getPrisma>, '$transaction'>;
    clock?: Pack40D3AClock;
  }> = {},
): Promise<{
  attemptId: string;
  attemptState:
    | typeof VionaRequestExecutionAttemptState.providerSucceeded
    | typeof VionaRequestExecutionAttemptState.providerFailed
    | typeof VionaRequestExecutionAttemptState.outcomeUncertain;
  updated: boolean;
}> {
  const prisma = deps.prisma ?? defaultPrisma();
  const clock = deps.clock ?? (() => new Date());

  const next =
    input.adapterResult.kind === 'succeeded'
      ? {
          nextState: VionaRequestExecutionAttemptState.providerSucceeded,
          providerResultDigest: input.adapterResult.resultDigest,
          providerExternalReferenceDigest:
            input.adapterResult.externalReferenceDigest ?? null,
          failureClass: null as string | null,
          failureReasonDigest: null as string | null,
        }
      : input.adapterResult.kind === 'failed'
        ? {
            nextState: VionaRequestExecutionAttemptState.providerFailed,
            providerResultDigest: null as string | null,
            providerExternalReferenceDigest: null as string | null,
            failureClass: input.adapterResult.failureClass,
            failureReasonDigest: input.adapterResult.failureReasonDigest,
          }
        : {
            nextState: VionaRequestExecutionAttemptState.outcomeUncertain,
            providerResultDigest: null as string | null,
            providerExternalReferenceDigest: null as string | null,
            failureClass: input.adapterResult.uncertaintyClass,
            failureReasonDigest: input.adapterResult.failureReasonDigest ?? null,
          };

  try {
    return await prisma.$transaction(
      async (tx) => {
        const now = clock();
        const recorded = await recordPreparedVionaRequestExecutionAttemptProviderOutcome(
          tx as VionaRequestExecutionAttemptClient,
          {
            attemptId: input.attemptId,
            expectedRequestId: input.requestId,
            expectedLeaseOwner: input.expectedLeaseOwner,
            expectedProviderName: VIONA_PACK40D3A_PROVIDER_NAME,
            expectedOperationCategory: input.operationCategory,
            expectedProviderIdempotencyKey: input.providerIdempotencyKey,
            nextState: next.nextState,
            providerFinishedAt: now,
            providerResultDigest: next.providerResultDigest,
            providerExternalReferenceDigest: next.providerExternalReferenceDigest,
            failureClass: next.failureClass,
            failureReasonDigest: next.failureReasonDigest,
          },
        );

        if (!recorded.updated) {
          throwGateway('outcome_record_conflict');
        }

        return {
          attemptId: input.attemptId,
          attemptState: next.nextState,
          updated: true,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof VionaRequestExecutionGatewayError) {
      throw error;
    }
    const conflict = mapPrismaConflict(error);
    if (conflict != null) {
      throwGateway('outcome_record_conflict');
    }
    throw error;
  }
}

/**
 * Full Pack40D3A gateway run: prepare (separate Serializable tx) → inject adapter → record outcome.
 * Never holds a DB transaction across the adapter call. Never finalizes request status.
 * Duplicate delivery against non-claimed states fails closed without invoking the adapter.
 */
export async function runVionaRequestExecutionProviderGateway(
  input: RunVionaRequestExecutionProviderGatewayInput,
  deps: VionaRequestExecutionGatewayDeps,
): Promise<RunVionaRequestExecutionProviderGatewayResult> {
  if (deps.adapter == null) {
    throwGateway('unsupported_operation');
  }

  const prepared = await prepareVionaRequestExecutionProvider(input, deps);

  let adapterResult: VionaExecutionProviderAdapterResult;
  try {
    adapterResult = await deps.adapter.invoke({
      providerName: prepared.providerName,
      operationCategory: prepared.operationCategory,
      providerIdempotencyKey: prepared.providerIdempotencyKey,
      correlationId: prepared.correlationId,
      requestId: prepared.requestId,
      attemptId: prepared.attemptId,
    });
  } catch {
    adapterResult = {
      kind: 'uncertain',
      uncertaintyClass: 'response_loss',
      failureReasonDigest: 'adapter_throw',
    };
  }

  const recorded = await recordVionaRequestExecutionProviderOutcome(
    {
      attemptId: prepared.attemptId,
      requestId: prepared.requestId,
      expectedLeaseOwner: input.expectedLeaseOwner.trim(),
      operationCategory: prepared.operationCategory,
      providerIdempotencyKey: prepared.providerIdempotencyKey,
      adapterResult,
    },
    { prisma: deps.prisma, clock: deps.clock },
  );

  return {
    kind: 'recorded',
    attemptId: prepared.attemptId,
    requestId: prepared.requestId,
    providerIdempotencyKey: prepared.providerIdempotencyKey,
    attemptState: recorded.attemptState,
    adapterKind: adapterResult.kind,
    providerInvoked: true,
  };
}
