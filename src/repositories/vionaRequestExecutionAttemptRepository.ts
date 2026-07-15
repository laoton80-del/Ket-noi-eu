/**
 * Pack40D1 — VionaRequestExecutionAttempt repository foundation.
 *
 * Attempt-table operations only. Does not mutate VionaRequest.status, invoke providers,
 * write events/audits, or perform automatic retries. Not wired to production callers in D1.
 */

import {
  Prisma,
  type VionaRequestExecutionAttempt,
  VionaRequestExecutionAttemptState,
  type VionaRequestExecutionPrincipalType,
  type VionaRequestExecutionTriggerType,
  type VionaRequestScopeKind,
} from '@prisma/client';

/** Non-terminal attempt states protected by the partial unique index (one active attempt per request). */
export const VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES = [
  VionaRequestExecutionAttemptState.claimed,
  VionaRequestExecutionAttemptState.providerPending,
  VionaRequestExecutionAttemptState.providerSucceeded,
  VionaRequestExecutionAttemptState.providerFailed,
  VionaRequestExecutionAttemptState.outcomeUncertain,
] as const;

export const VIONA_REQUEST_EXECUTION_TERMINAL_ATTEMPT_STATES = [
  VionaRequestExecutionAttemptState.completed,
  VionaRequestExecutionAttemptState.failed,
  VionaRequestExecutionAttemptState.abandoned,
] as const;

export type VionaRequestExecutionActiveAttemptState =
  (typeof VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES)[number];

export type VionaRequestExecutionAttemptClient = Pick<
  Prisma.TransactionClient,
  'vionaRequestExecutionAttempt'
>;

export type CreateVionaRequestExecutionAttemptInput = Readonly<{
  /** Optional server-generated id (deterministic tests / injected factories). */
  id?: string;
  requestId: string;
  attemptNumber: number;
  executionKey: string;
  state: VionaRequestExecutionAttemptState;
  correlationId: string;
  principalType: VionaRequestExecutionPrincipalType;
  triggerType: VionaRequestExecutionTriggerType;
  triggeringUserId?: string | null;
  ownerUserIdSnapshot: string;
  scopeKindSnapshot: VionaRequestScopeKind;
  merchantProfileIdSnapshot?: string | null;
  tenantIdSnapshot: string;
  leaseOwner?: string | null;
  leaseExpiresAt?: Date | null;
  claimedAt?: Date | null;
}>;

export type TransitionVionaRequestExecutionAttemptStateInput = Readonly<{
  attemptId: string;
  expectedStates: readonly VionaRequestExecutionAttemptState[];
  nextState: VionaRequestExecutionAttemptState;
  /** When set, the attempt must belong to this request (stale-/cross-request protection). */
  expectedRequestId?: string;
  /** When set, the attempt leaseOwner must match exactly. */
  expectedLeaseOwner?: string | null;
  leaseOwner?: string | null;
  leaseExpiresAt?: Date | null;
  claimedAt?: Date | null;
  failureClass?: string | null;
  failureReasonDigest?: string | null;
  finalizedAt?: Date | null;
  abandonedAt?: Date | null;
}>;

export type UpdateVionaRequestExecutionAttemptLeaseInput = Readonly<{
  attemptId: string;
  expectedStates: readonly VionaRequestExecutionAttemptState[];
  expectedLeaseOwner?: string | null;
  leaseOwner: string;
  leaseExpiresAt: Date;
}>;

export type RecordVionaRequestExecutionAttemptProviderOutcomeInput = Readonly<{
  attemptId: string;
  expectedStates: readonly VionaRequestExecutionAttemptState[];
  expectedLeaseOwner?: string | null;
  nextState:
    | typeof VionaRequestExecutionAttemptState.providerSucceeded
    | typeof VionaRequestExecutionAttemptState.providerFailed
    | typeof VionaRequestExecutionAttemptState.outcomeUncertain;
  providerName: string;
  operationCategory: string;
  providerIdempotencyKey: string;
  providerStartedAt?: Date | null;
  providerFinishedAt?: Date | null;
  providerResultDigest?: string | null;
  providerExternalReferenceDigest?: string | null;
  failureClass?: string | null;
  failureReasonDigest?: string | null;
}>;

/** Pack40D3A — claimed → providerPending with persisted provider identity + key. */
export type PrepareVionaRequestExecutionAttemptForProviderInput = Readonly<{
  attemptId: string;
  expectedRequestId: string;
  expectedLeaseOwner: string;
  providerName: string;
  operationCategory: string;
  providerIdempotencyKey: string;
  providerStartedAt: Date;
}>;

/** Pack40D3A — record outcome against a prepared providerPending attempt. */
export type RecordPreparedVionaRequestExecutionAttemptProviderOutcomeInput = Readonly<{
  attemptId: string;
  expectedRequestId: string;
  expectedLeaseOwner: string;
  expectedProviderName: string;
  expectedOperationCategory: string;
  expectedProviderIdempotencyKey: string;
  nextState:
    | typeof VionaRequestExecutionAttemptState.providerSucceeded
    | typeof VionaRequestExecutionAttemptState.providerFailed
    | typeof VionaRequestExecutionAttemptState.outcomeUncertain;
  providerFinishedAt: Date;
  providerResultDigest?: string | null;
  providerExternalReferenceDigest?: string | null;
  failureClass?: string | null;
  failureReasonDigest?: string | null;
}>;

const ATTEMPT_SELECT_MINIMAL = {
  id: true,
  requestId: true,
  attemptNumber: true,
  executionKey: true,
  state: true,
  correlationId: true,
  leaseOwner: true,
  leaseExpiresAt: true,
  providerIdempotencyKey: true,
} as const satisfies Prisma.VionaRequestExecutionAttemptSelect;

export type VionaRequestExecutionAttemptMinimal = Prisma.VionaRequestExecutionAttemptGetPayload<{
  select: typeof ATTEMPT_SELECT_MINIMAL;
}>;

export async function createVionaRequestExecutionAttempt(
  client: VionaRequestExecutionAttemptClient,
  input: CreateVionaRequestExecutionAttemptInput,
): Promise<VionaRequestExecutionAttempt> {
  return client.vionaRequestExecutionAttempt.create({
    data: {
      ...(input.id != null && input.id.length > 0 ? { id: input.id } : {}),
      requestId: input.requestId,
      attemptNumber: input.attemptNumber,
      executionKey: input.executionKey,
      state: input.state,
      correlationId: input.correlationId,
      principalType: input.principalType,
      triggerType: input.triggerType,
      triggeringUserId: input.triggeringUserId ?? null,
      ownerUserIdSnapshot: input.ownerUserIdSnapshot,
      scopeKindSnapshot: input.scopeKindSnapshot,
      merchantProfileIdSnapshot: input.merchantProfileIdSnapshot ?? null,
      tenantIdSnapshot: input.tenantIdSnapshot,
      leaseOwner: input.leaseOwner ?? null,
      leaseExpiresAt: input.leaseExpiresAt ?? null,
      claimedAt: input.claimedAt ?? null,
    },
  });
}

export async function findVionaRequestExecutionAttemptById(
  client: VionaRequestExecutionAttemptClient,
  attemptId: string,
): Promise<VionaRequestExecutionAttempt | null> {
  return client.vionaRequestExecutionAttempt.findUnique({
    where: { id: attemptId },
  });
}

export async function findVionaRequestExecutionAttemptByExecutionKey(
  client: VionaRequestExecutionAttemptClient,
  executionKey: string,
): Promise<VionaRequestExecutionAttempt | null> {
  return client.vionaRequestExecutionAttempt.findUnique({
    where: { executionKey },
  });
}

export async function findActiveVionaRequestExecutionAttemptForRequest(
  client: VionaRequestExecutionAttemptClient,
  requestId: string,
): Promise<VionaRequestExecutionAttemptMinimal | null> {
  return client.vionaRequestExecutionAttempt.findFirst({
    where: {
      requestId,
      state: { in: [...VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES] },
    },
    select: ATTEMPT_SELECT_MINIMAL,
    orderBy: { attemptNumber: 'desc' },
  });
}

/**
 * Pack40D2 — transaction-scoped max attemptNumber for one request.
 * Callers must allocate next = max + 1 inside the same Serializable transaction.
 */
export async function findMaxAttemptNumberForRequest(
  client: VionaRequestExecutionAttemptClient,
  requestId: string,
): Promise<number> {
  const latest = await client.vionaRequestExecutionAttempt.findFirst({
    where: { requestId },
    select: { attemptNumber: true },
    orderBy: { attemptNumber: 'desc' },
  });
  return latest?.attemptNumber ?? 0;
}

export async function findVionaRequestExecutionAttemptByProviderIdempotencyKey(
  client: VionaRequestExecutionAttemptClient,
  providerIdempotencyKey: string,
): Promise<VionaRequestExecutionAttemptMinimal | null> {
  return client.vionaRequestExecutionAttempt.findUnique({
    where: { providerIdempotencyKey },
    select: ATTEMPT_SELECT_MINIMAL,
  });
}

export async function transitionVionaRequestExecutionAttemptState(
  client: VionaRequestExecutionAttemptClient,
  input: TransitionVionaRequestExecutionAttemptStateInput,
): Promise<{ updated: boolean; attempt: VionaRequestExecutionAttemptMinimal | null }> {
  const result = await client.vionaRequestExecutionAttempt.updateMany({
    where: {
      id: input.attemptId,
      state: { in: [...input.expectedStates] },
      ...(input.expectedRequestId != null ? { requestId: input.expectedRequestId } : {}),
      ...(input.expectedLeaseOwner !== undefined
        ? { leaseOwner: input.expectedLeaseOwner }
        : {}),
    },
    data: {
      state: input.nextState,
      ...(input.leaseOwner !== undefined ? { leaseOwner: input.leaseOwner } : {}),
      ...(input.leaseExpiresAt !== undefined ? { leaseExpiresAt: input.leaseExpiresAt } : {}),
      ...(input.claimedAt !== undefined ? { claimedAt: input.claimedAt } : {}),
      ...(input.failureClass !== undefined ? { failureClass: input.failureClass } : {}),
      ...(input.failureReasonDigest !== undefined
        ? { failureReasonDigest: input.failureReasonDigest }
        : {}),
      ...(input.finalizedAt !== undefined ? { finalizedAt: input.finalizedAt } : {}),
      ...(input.abandonedAt !== undefined ? { abandonedAt: input.abandonedAt } : {}),
    },
  });

  if (result.count !== 1) {
    return { updated: false, attempt: null };
  }

  const attempt = await client.vionaRequestExecutionAttempt.findUnique({
    where: { id: input.attemptId },
    select: ATTEMPT_SELECT_MINIMAL,
  });

  return { updated: true, attempt };
}

export async function updateVionaRequestExecutionAttemptLease(
  client: VionaRequestExecutionAttemptClient,
  input: UpdateVionaRequestExecutionAttemptLeaseInput,
): Promise<{ updated: boolean }> {
  const result = await client.vionaRequestExecutionAttempt.updateMany({
    where: {
      id: input.attemptId,
      state: { in: [...input.expectedStates] },
      ...(input.expectedLeaseOwner != null ? { leaseOwner: input.expectedLeaseOwner } : {}),
    },
    data: {
      leaseOwner: input.leaseOwner,
      leaseExpiresAt: input.leaseExpiresAt,
    },
  });

  return { updated: result.count === 1 };
}

export async function recordVionaRequestExecutionAttemptProviderOutcome(
  client: VionaRequestExecutionAttemptClient,
  input: RecordVionaRequestExecutionAttemptProviderOutcomeInput,
): Promise<{ updated: boolean; attempt: VionaRequestExecutionAttemptMinimal | null }> {
  const result = await client.vionaRequestExecutionAttempt.updateMany({
    where: {
      id: input.attemptId,
      state: { in: [...input.expectedStates] },
      ...(input.expectedLeaseOwner != null ? { leaseOwner: input.expectedLeaseOwner } : {}),
    },
    data: {
      state: input.nextState,
      providerName: input.providerName,
      operationCategory: input.operationCategory,
      providerIdempotencyKey: input.providerIdempotencyKey,
      providerStartedAt: input.providerStartedAt ?? null,
      providerFinishedAt: input.providerFinishedAt ?? null,
      providerResultDigest: input.providerResultDigest ?? null,
      providerExternalReferenceDigest: input.providerExternalReferenceDigest ?? null,
      failureClass: input.failureClass ?? null,
      failureReasonDigest: input.failureReasonDigest ?? null,
    },
  });

  if (result.count !== 1) {
    return { updated: false, attempt: null };
  }

  const attempt = await client.vionaRequestExecutionAttempt.findUnique({
    where: { id: input.attemptId },
    select: ATTEMPT_SELECT_MINIMAL,
  });

  return { updated: true, attempt };
}

/**
 * Pack40D3A — conditionally prepare claim → providerPending and persist key before invoke.
 * Requires providerIdempotencyKey IS NULL so conflicting keys fail closed (zero-row update).
 */
export async function prepareVionaRequestExecutionAttemptForProvider(
  client: VionaRequestExecutionAttemptClient,
  input: PrepareVionaRequestExecutionAttemptForProviderInput,
): Promise<{ updated: boolean; attempt: VionaRequestExecutionAttemptMinimal | null }> {
  const result = await client.vionaRequestExecutionAttempt.updateMany({
    where: {
      id: input.attemptId,
      requestId: input.expectedRequestId,
      state: VionaRequestExecutionAttemptState.claimed,
      leaseOwner: input.expectedLeaseOwner,
      providerIdempotencyKey: null,
    },
    data: {
      state: VionaRequestExecutionAttemptState.providerPending,
      providerName: input.providerName,
      operationCategory: input.operationCategory,
      providerIdempotencyKey: input.providerIdempotencyKey,
      providerStartedAt: input.providerStartedAt,
    },
  });

  if (result.count !== 1) {
    return { updated: false, attempt: null };
  }

  const attempt = await client.vionaRequestExecutionAttempt.findUnique({
    where: { id: input.attemptId },
    select: ATTEMPT_SELECT_MINIMAL,
  });

  return { updated: true, attempt };
}

/**
 * Pack40D3A — record provider outcome against prepared providerPending row.
 * Matches persisted provider name/operation/key; does not invent a new key.
 */
export async function recordPreparedVionaRequestExecutionAttemptProviderOutcome(
  client: VionaRequestExecutionAttemptClient,
  input: RecordPreparedVionaRequestExecutionAttemptProviderOutcomeInput,
): Promise<{ updated: boolean; attempt: VionaRequestExecutionAttemptMinimal | null }> {
  const result = await client.vionaRequestExecutionAttempt.updateMany({
    where: {
      id: input.attemptId,
      requestId: input.expectedRequestId,
      state: VionaRequestExecutionAttemptState.providerPending,
      leaseOwner: input.expectedLeaseOwner,
      providerName: input.expectedProviderName,
      operationCategory: input.expectedOperationCategory,
      providerIdempotencyKey: input.expectedProviderIdempotencyKey,
    },
    data: {
      state: input.nextState,
      providerFinishedAt: input.providerFinishedAt,
      ...(input.providerResultDigest !== undefined
        ? { providerResultDigest: input.providerResultDigest }
        : {}),
      ...(input.providerExternalReferenceDigest !== undefined
        ? { providerExternalReferenceDigest: input.providerExternalReferenceDigest }
        : {}),
      ...(input.failureClass !== undefined ? { failureClass: input.failureClass } : {}),
      ...(input.failureReasonDigest !== undefined
        ? { failureReasonDigest: input.failureReasonDigest }
        : {}),
    },
  });

  if (result.count !== 1) {
    return { updated: false, attempt: null };
  }

  const attempt = await client.vionaRequestExecutionAttempt.findUnique({
    where: { id: input.attemptId },
    select: ATTEMPT_SELECT_MINIMAL,
  });

  return { updated: true, attempt };
}

export async function findExpiredActiveVionaRequestExecutionAttemptLeases(
  client: VionaRequestExecutionAttemptClient,
  now: Date,
  limit = 50,
): Promise<VionaRequestExecutionAttemptMinimal[]> {
  return client.vionaRequestExecutionAttempt.findMany({
    where: {
      state: { in: [...VIONA_REQUEST_EXECUTION_ACTIVE_ATTEMPT_STATES] },
      leaseExpiresAt: { lte: now },
    },
    select: ATTEMPT_SELECT_MINIMAL,
    orderBy: { leaseExpiresAt: 'asc' },
    take: limit,
  });
}
