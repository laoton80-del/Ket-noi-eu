/**
 * P0-A1 Cost Governor for paid AI provider attempts.
 *
 * This service records platform-provider cost in micro-USD only. It never
 * reads, writes, converts, or authorizes VIO or credit balances.
 */
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';

import { getPrisma } from '../../lib/prisma';
import { costMicrousd, costModelUnit, type CostModelPrices } from './costModel';
import { LlmProviderAdmissionDeniedError } from './llmProviderAdmissionGate';

const RESERVED_TTL_MS = 300_000n;
const DISPATCH_GUARD_MS = 30_000n;
const LOCK_TIMEOUT_MS = 5_000n;
const STATEMENT_TIMEOUT_MS = 10_000n;
const TX_TIMEOUT_MS = 20_000;
const TX_MAX_WAIT_MS = 5_000;
const IN_FLIGHT_LEASE_GRACE_MS = 15_000n;
const OUTCOME_UNKNOWN_RECONCILIATION_MS = 86_400_000n;
const ADMISSION_ADVISORY_LOCK_ID = 7_913_114_201_001n;
const MAX_TIMEOUT_MS = 2_147_483_647n;
const MAX_POSTGRES_BIGINT = 9_223_372_036_854_775_807n;
const DEFAULT_RECONCILIATION_BATCH_SIZE = 100;
const MAX_RECONCILIATION_BATCH_SIZE = 500;

if (LOCK_TIMEOUT_MS >= DISPATCH_GUARD_MS) {
  throw new Error('Cost governor lock timeout must be shorter than the dispatch guard');
}
if (BigInt(TX_TIMEOUT_MS) < LOCK_TIMEOUT_MS + STATEMENT_TIMEOUT_MS + 5_000n) {
  throw new Error('Cost governor transaction timeout must exceed database lock and statement timeouts by five seconds');
}
if (TX_MAX_WAIT_MS < 1_000) {
  throw new Error('Cost governor transaction maxWait must be at least one second');
}
const TRANSACTION_OPTIONS = Object.freeze({ maxWait: TX_MAX_WAIT_MS, timeout: TX_TIMEOUT_MS });

export const COST_GOVERNOR_ENV_NAMES = {
  userDailyCap: 'VIONA_COST_GOVERNOR_USER_DAILY_CAP_MICRO_USD',
  globalDailyCap: 'VIONA_COST_GOVERNOR_GLOBAL_DAILY_CAP_MICRO_USD',
  globalMonthlyCap: 'VIONA_COST_GOVERNOR_GLOBAL_MONTHLY_CAP_MICRO_USD',
  userInflightLimit: 'VIONA_COST_GOVERNOR_USER_INFLIGHT_LIMIT',
  globalInflightLimit: 'VIONA_COST_GOVERNOR_GLOBAL_INFLIGHT_LIMIT',
  providerTimeoutMs: 'VIONA_COST_GOVERNOR_PROVIDER_TIMEOUT_MS',
} as const;

export type CostGovernorDenialReason =
  | 'DENY_CAP'
  | 'DENY_INFLIGHT'
  | 'DENY_POLICY'
  | 'DENY_IDENTITY'
  | 'DENY_UNCONFIGURED'
  | 'DUPLICATE_IN_PROGRESS'
  | 'OUTCOME_UNKNOWN'
  | 'DENY_LEDGER_UNAVAILABLE';

export type CostGovernorReserveDecision =
  | 'ALLOW_RESERVED'
  | CostGovernorDenialReason;

export type CostGovernorConfig = Readonly<{
  userDailyCapMicrousd: bigint;
  globalDailyCapMicrousd: bigint;
  globalMonthlyCapMicrousd: bigint;
  userInflightLimit: bigint;
  globalInflightLimit: bigint;
  providerTimeoutMs: bigint;
}>;

export type CostGovernorOperation = Readonly<{
  id: string;
  subjectId: string;
  idempotencyKey: string;
  rail: string;
  provider: string;
  model: string;
  operationKind: string;
  priceVersionId: string;
  inputMicrousdPerMillionTokens: bigint;
  outputMicrousdPerMillionTokens: bigint;
  audioInputMicrousdPerSecond: bigint;
  audioOutputMicrousdPerSecond: bigint;
  imageMicrousdPerUnit: bigint;
  providerTimeoutMs: bigint;
  reservedMicrousd: bigint;
  settledMicrousd: bigint;
  status: string;
  windowStartDay: Date;
  windowStartMonth: Date;
  dispatchedAt: Date | null;
  expiresAt: Date;
}>;

export type CostGovernorReserveInput = Readonly<{
  subjectId?: string | null;
  idempotencyKey: string;
  rail: string;
  provider: string;
  model: string;
  operationKind: string;
  inputTokensUpperBound: bigint;
  outputTokens: bigint;
  audioSecondsUpperBound?: bigint;
}>;

export type CostGovernorReserveResult =
  | Readonly<{
      decision: 'ALLOW_RESERVED';
      operation: CostGovernorOperation;
      providerTimeoutMs: number;
    }>
  | Readonly<{
      decision: Exclude<CostGovernorReserveDecision, 'ALLOW_RESERVED'>;
      detail?: 'idempotency_conflict';
      operation?: CostGovernorOperation;
    }>;

export type CostGovernorSettleInput = Readonly<{
  operationId: string;
  providerRequestId?: string | null;
  usage?: Readonly<{
    inputTokens?: bigint | number | string | null;
    outputTokens?: bigint | number | string | null;
  }> | null;
}>;

export type CostGovernorReleaseInput = Readonly<{
  operationId: string;
  reason: 'reserved_not_dispatched' | 'provider_http_4xx';
}>;

export type CostGovernorReconcilableOperation = Readonly<{
  operationId: string;
  status: 'RESERVED' | 'DISPATCHING' | 'OUTCOME_UNKNOWN';
  dispatchedAt: Date | null;
  reservedMicrousd: bigint;
  expiresAt: Date;
}>;

export type CostGovernorReconciliationAction = 'released' | 'markedUnknown' | 'settled' | 'skipped';

export type CostGovernorReconciliationStats = Readonly<{
  released: number;
  markedUnknown: number;
  settled: number;
  skipped: number;
}>;

export type CostGovernor = Readonly<{
  createServerIdempotencyKey(): string;
  reserve(input: CostGovernorReserveInput): Promise<CostGovernorReserveResult>;
  markDispatching(operationId: string): Promise<boolean>;
  settle(input: CostGovernorSettleInput): Promise<Readonly<{ applied: boolean; operation: CostGovernorOperation }>>;
  release(input: CostGovernorReleaseInput): Promise<boolean>;
  markOutcomeUnknown(operationId: string): Promise<boolean>;
}>;

type RawSqlClient = Readonly<{
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}>;

type CostGovernorDatabase = RawSqlClient & Readonly<{
  $transaction<T>(
    callback: (transaction: RawSqlClient) => Promise<T>,
    options: Readonly<{ maxWait: number; timeout: number }>
  ): Promise<T>;
}>;

type ModelPriceRow = Readonly<{
  id: string;
  inputMicrousdPerMillionTokens: bigint | number | string;
  outputMicrousdPerMillionTokens: bigint | number | string;
  audioInputMicrousdPerSecond: bigint | number | string;
  audioOutputMicrousdPerSecond: bigint | number | string;
  imageMicrousdPerUnit: bigint | number | string;
}>;

type OperationRow = Readonly<Record<string, unknown>>;

type CountRow = Readonly<{ count: bigint | number | string }>;

class TransactionDecisionAbort extends Error {
  constructor(
    readonly decision: Exclude<CostGovernorReserveDecision, 'ALLOW_RESERVED'>,
    readonly detail?: 'idempotency_conflict'
  ) {
    super(decision);
    this.name = 'TransactionDecisionAbort';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * A cost denial remains an admission denial so existing P0-A0/P0-A0b/P0-A0d
 * boundary handlers return their established honest 503 envelopes and never
 * choose a paid fallback rail.
 */
export class CostGovernorDeniedError extends LlmProviderAdmissionDeniedError {
  readonly governorReason: CostGovernorDenialReason;
  readonly detail?: 'idempotency_conflict';

  constructor(reason: CostGovernorDenialReason, detail?: 'idempotency_conflict') {
    // `disabled` deliberately gives the inherited error its existing 503 status.
    super('disabled');
    this.name = 'CostGovernorDeniedError';
    this.governorReason = reason;
    this.detail = detail;
    this.message = `Paid AI is unavailable: cost governor ${reason.toLowerCase()}.`;
    Object.defineProperty(this, 'code', {
      configurable: true,
      enumerable: true,
      value: `COST_GOVERNOR_${reason}`,
      writable: false,
    });
    Object.defineProperty(this, 'reason', {
      configurable: true,
      enumerable: true,
      value: reason,
      writable: false,
    });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function parsePositiveDecimal(raw: string | undefined): bigint | null {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/** Reads all policy values for each call; it deliberately has no enable/bypass flag. */
export function readCostGovernorConfig(
  env: Readonly<Record<string, string | undefined>> = process.env
): CostGovernorConfig | null {
  const userDailyCapMicrousd = parsePositiveDecimal(env[COST_GOVERNOR_ENV_NAMES.userDailyCap]);
  const globalDailyCapMicrousd = parsePositiveDecimal(env[COST_GOVERNOR_ENV_NAMES.globalDailyCap]);
  const globalMonthlyCapMicrousd = parsePositiveDecimal(env[COST_GOVERNOR_ENV_NAMES.globalMonthlyCap]);
  const userInflightLimit = parsePositiveDecimal(env[COST_GOVERNOR_ENV_NAMES.userInflightLimit]);
  const globalInflightLimit = parsePositiveDecimal(env[COST_GOVERNOR_ENV_NAMES.globalInflightLimit]);
  const providerTimeoutMs = parsePositiveDecimal(env[COST_GOVERNOR_ENV_NAMES.providerTimeoutMs]);

  if (
    userDailyCapMicrousd === null ||
    globalDailyCapMicrousd === null ||
    globalMonthlyCapMicrousd === null ||
    userDailyCapMicrousd > MAX_POSTGRES_BIGINT ||
    globalDailyCapMicrousd > MAX_POSTGRES_BIGINT ||
    globalMonthlyCapMicrousd > MAX_POSTGRES_BIGINT ||
    userInflightLimit === null ||
    globalInflightLimit === null ||
    providerTimeoutMs === null ||
    providerTimeoutMs > MAX_TIMEOUT_MS
  ) {
    return null;
  }

  return {
    userDailyCapMicrousd,
    globalDailyCapMicrousd,
    globalMonthlyCapMicrousd,
    userInflightLimit,
    globalInflightLimit,
    providerTimeoutMs,
  };
}

function toBigInt(value: bigint | number | string | null | undefined): bigint | null {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return Number.isSafeInteger(value) ? BigInt(value) : null;
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  return null;
}

function toDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error('Cost governor database returned an invalid timestamp');
  return date;
}

function toNullableDate(value: unknown): Date | null {
  return value == null ? null : toDate(value);
}

function operationFromRow(row: OperationRow): CostGovernorOperation {
  const reservedMicrousd = toBigInt(row.reservedMicrousd as bigint | number | string | null | undefined);
  const settledMicrousd = toBigInt(row.settledMicrousd as bigint | number | string | null | undefined);
  const inputMicrousdPerMillionTokens = toBigInt(
    row.inputMicrousdPerMillionTokens as bigint | number | string | null | undefined
  );
  const outputMicrousdPerMillionTokens = toBigInt(
    row.outputMicrousdPerMillionTokens as bigint | number | string | null | undefined
  );
  const audioInputRaw = row.audioInputMicrousdPerSecond;
  const audioOutputRaw = row.audioOutputMicrousdPerSecond;
  const imageRaw = row.imageMicrousdPerUnit;
  const audioInputMicrousdPerSecond = audioInputRaw == null ? 0n : toBigInt(audioInputRaw as bigint | number | string);
  const audioOutputMicrousdPerSecond = audioOutputRaw == null ? 0n : toBigInt(audioOutputRaw as bigint | number | string);
  const imageMicrousdPerUnit = imageRaw == null ? 0n : toBigInt(imageRaw as bigint | number | string);
  const providerTimeoutMs = toBigInt(row.providerTimeoutMs as bigint | number | string | null | undefined);
  if (
    reservedMicrousd === null ||
    reservedMicrousd <= 0n ||
    settledMicrousd === null ||
    inputMicrousdPerMillionTokens === null ||
    outputMicrousdPerMillionTokens === null ||
    audioInputMicrousdPerSecond === null ||
    audioInputMicrousdPerSecond < 0n ||
    audioOutputMicrousdPerSecond === null ||
    audioOutputMicrousdPerSecond < 0n ||
    imageMicrousdPerUnit === null ||
    imageMicrousdPerUnit < 0n ||
    providerTimeoutMs === null ||
    inputMicrousdPerMillionTokens < 0n ||
    outputMicrousdPerMillionTokens < 0n ||
    providerTimeoutMs <= 0n ||
    providerTimeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new Error('Cost governor database returned an invalid monetary value');
  }
  return {
    id: String(row.id),
    subjectId: String(row.subjectId),
    idempotencyKey: String(row.idempotencyKey),
    rail: String(row.rail),
    provider: String(row.provider),
    model: String(row.model),
    operationKind: String(row.operationKind),
    priceVersionId: String(row.priceVersionId),
    inputMicrousdPerMillionTokens,
    outputMicrousdPerMillionTokens,
    audioInputMicrousdPerSecond,
    audioOutputMicrousdPerSecond,
    imageMicrousdPerUnit,
    providerTimeoutMs,
    reservedMicrousd,
    settledMicrousd,
    status: String(row.status),
    windowStartDay: toDate(row.windowStartDay),
    windowStartMonth: toDate(row.windowStartMonth),
    dispatchedAt: row.dispatchedAt == null ? null : toDate(row.dispatchedAt),
    expiresAt: toDate(row.expiresAt),
  };
}

function isExactNonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function hasValidReserveBounds(input: CostGovernorReserveInput): boolean {
  if (
    typeof input.inputTokensUpperBound !== 'bigint' ||
    typeof input.outputTokens !== 'bigint' ||
    input.inputTokensUpperBound < 0n ||
    input.outputTokens < 0n
  ) return false;
  switch (costModelUnit(input.operationKind, input.model)) {
    case 'audio-second':
      return input.audioSecondsUpperBound !== undefined &&
        typeof input.audioSecondsUpperBound === 'bigint' &&
        input.audioSecondsUpperBound >= 0n &&
        input.inputTokensUpperBound === 0n &&
        input.outputTokens === 0n;
    case 'token-input':
      return input.audioSecondsUpperBound === undefined && input.outputTokens === 0n;
    case 'token-bidirectional':
      return input.audioSecondsUpperBound === undefined;
    default:
      return false;
  }
}

/**
 * Conservative chat input upper bound: UTF-8 bytes of each normalized wire
 * message (including role and content) plus fixed message framing. It
 * intentionally does not accept a caller-supplied token estimate.
 */
export function estimateInputTokensUpperBound(
  messages: readonly Readonly<{ role?: unknown; content?: unknown; name?: unknown }>[]
): bigint {
  let total = 0n;
  for (const message of messages) {
    const wireMessage: Record<string, unknown> = {};
    const role = message.role;
    const name = message.name;
    const content = message.content;
    if (typeof role === 'string') wireMessage.role = role;
    if (typeof name === 'string') wireMessage.name = name;
    wireMessage.content = content ?? '';
    const serialized = JSON.stringify(wireMessage) ?? '';
    total += BigInt(Buffer.byteLength(serialized, 'utf8')) + 16n;
  }
  return total;
}

function counterScope(subjectId: string, period: 'GLOBAL_MONTH' | 'GLOBAL_DAY' | 'USER_DAY'): string {
  return period === 'USER_DAY' ? `USER_DAY:${subjectId}` : period;
}

function sameImmutableFields(existing: CostGovernorOperation, input: CostGovernorReserveInput): boolean {
  return (
    existing.subjectId === input.subjectId &&
    existing.rail === input.rail &&
    existing.provider === input.provider &&
    existing.model === input.model &&
    existing.operationKind === input.operationKind
  );
}

function operationDecision(existing: CostGovernorOperation, input: CostGovernorReserveInput): CostGovernorReserveResult {
  if (!sameImmutableFields(existing, input)) {
    return { decision: 'DENY_POLICY', detail: 'idempotency_conflict' };
  }
  return existing.status === 'OUTCOME_UNKNOWN'
    ? { decision: 'OUTCOME_UNKNOWN', operation: existing }
    : { decision: 'DUPLICATE_IN_PROGRESS', operation: existing };
}

async function setReadCommitted(transaction: RawSqlClient): Promise<void> {
  await transaction.$executeRawUnsafe('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await transaction.$executeRawUnsafe(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT_MS.toString()}ms'`);
  await transaction.$executeRawUnsafe(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS.toString()}ms'`);
}

function assertDispatchingConfig(): CostGovernorConfig {
  const config = readCostGovernorConfig();
  if (!config) throw new CostGovernorDeniedError('DENY_UNCONFIGURED');
  return config;
}

function asLedgerUnavailable(error: unknown): CostGovernorDeniedError {
  if (error instanceof CostGovernorDeniedError) return error;
  return new CostGovernorDeniedError('DENY_LEDGER_UNAVAILABLE');
}

export class CostGovernorService implements CostGovernor {
  constructor(
    private readonly databaseProvider: () => CostGovernorDatabase = () => getPrisma() as unknown as CostGovernorDatabase
  ) {}

  createServerIdempotencyKey(): string {
    return randomUUID();
  }

  async reserve(input: CostGovernorReserveInput): Promise<CostGovernorReserveResult> {
    const subjectId = input.subjectId;
    if (!isExactNonEmpty(subjectId)) return { decision: 'DENY_IDENTITY' };
    if (
      !isExactNonEmpty(input.idempotencyKey) ||
      !isExactNonEmpty(input.rail) ||
      !isExactNonEmpty(input.provider) ||
      !isExactNonEmpty(input.model) ||
      !isExactNonEmpty(input.operationKind)
    ) {
      return { decision: 'DENY_POLICY' };
    }

    try {
      return await this.databaseProvider().$transaction(async (transaction) => {
        await setReadCommitted(transaction);
        const existingBeforeLock = await this.findOperationByIdempotency(transaction, subjectId, input.idempotencyKey);
        if (existingBeforeLock) return operationDecision(existingBeforeLock, input);
        if (!hasValidReserveBounds(input)) return { decision: 'DENY_POLICY' };

        await transaction.$executeRawUnsafe(
          'SELECT pg_advisory_xact_lock($1::bigint)',
          ADMISSION_ADVISORY_LOCK_ID.toString()
        );

        const existingAfterLock = await this.findOperationByIdempotency(transaction, subjectId, input.idempotencyKey);
        if (existingAfterLock) return operationDecision(existingAfterLock, input);

        const config = readCostGovernorConfig();
        if (!config) return { decision: 'DENY_UNCONFIGURED' };
        const priceRows = await transaction.$queryRawUnsafe<ModelPriceRow[]>(
          `SELECT "id", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
                  "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit"
             FROM "AiModelPrice"
            WHERE "provider" = $1
              AND "model" = $2
               AND "effectiveFrom" <= (now() AT TIME ZONE 'UTC')
               AND ("effectiveTo" IS NULL OR (now() AT TIME ZONE 'UTC') < "effectiveTo")`,
          input.provider,
          input.model
        );
        if (priceRows.length !== 1) return { decision: 'DENY_UNCONFIGURED' };

        const inputPrice = toBigInt(priceRows[0].inputMicrousdPerMillionTokens);
        const outputPrice = toBigInt(priceRows[0].outputMicrousdPerMillionTokens);
        const audioInputPrice = toBigInt(priceRows[0].audioInputMicrousdPerSecond);
        const audioOutputPrice = toBigInt(priceRows[0].audioOutputMicrousdPerSecond);
        const imagePrice = toBigInt(priceRows[0].imageMicrousdPerUnit);
        if (
          inputPrice === null ||
          outputPrice === null ||
          audioInputPrice === null ||
          audioOutputPrice === null ||
          imagePrice === null ||
          inputPrice < 0n ||
          outputPrice < 0n ||
          audioInputPrice < 0n ||
          audioOutputPrice < 0n ||
          imagePrice < 0n
        ) {
          return { decision: 'DENY_UNCONFIGURED' };
        }
        const unit = costModelUnit(input.operationKind, input.model);
        if (unit === null) return { decision: 'DENY_UNCONFIGURED' };
        const priceSnapshot: CostModelPrices = unit === 'token-bidirectional'
          ? {
              inputMicrousdPerMillionTokens: inputPrice,
              outputMicrousdPerMillionTokens: outputPrice,
              audioInputMicrousdPerSecond: 0n,
              audioOutputMicrousdPerSecond: 0n,
              imageMicrousdPerUnit: 0n,
            }
          : unit === 'token-input'
            ? {
                inputMicrousdPerMillionTokens: inputPrice,
                outputMicrousdPerMillionTokens: 0n,
                audioInputMicrousdPerSecond: 0n,
                audioOutputMicrousdPerSecond: 0n,
                imageMicrousdPerUnit: 0n,
              }
            : {
                inputMicrousdPerMillionTokens: 0n,
                outputMicrousdPerMillionTokens: 0n,
                audioInputMicrousdPerSecond: audioInputPrice,
                audioOutputMicrousdPerSecond: 0n,
                imageMicrousdPerUnit: 0n,
              };
        const reserveMicrousd = costMicrousd(input.operationKind, {
          model: input.model,
          inputTokens: input.inputTokensUpperBound,
          outputTokens: input.outputTokens,
          audioSeconds: input.audioSecondsUpperBound,
          prices: priceSnapshot,
        });
        if (reserveMicrousd === null) return { decision: 'DENY_UNCONFIGURED' };
        if (reserveMicrousd <= 0n) return { decision: 'DENY_POLICY' };

        const [userInflight, globalInflight] = await Promise.all([
          this.countInflight(transaction, subjectId),
          this.countInflight(transaction, null),
        ]);
        if (userInflight >= config.userInflightLimit || globalInflight >= config.globalInflightLimit) {
          return { decision: 'DENY_INFLIGHT' };
        }

        const counterReservations: readonly Readonly<{
          scope: string;
          period: 'day' | 'month';
          cap: bigint;
        }>[] = [
          { scope: counterScope(subjectId, 'GLOBAL_MONTH'), period: 'month', cap: config.globalMonthlyCapMicrousd },
          { scope: counterScope(subjectId, 'GLOBAL_DAY'), period: 'day', cap: config.globalDailyCapMicrousd },
          { scope: counterScope(subjectId, 'USER_DAY'), period: 'day', cap: config.userDailyCapMicrousd },
        ];
        for (const counter of counterReservations) {
          const reserved = await this.reserveCounter(
            transaction,
            counter.scope,
            counter.period,
            reserveMicrousd,
            counter.cap
          );
          if (!reserved) throw new TransactionDecisionAbort('DENY_CAP');
        }

        const operationRows = await transaction.$queryRawUnsafe<OperationRow[]>(
          `INSERT INTO "AiCostOperation" (
             "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind",
             "priceVersionId", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
             "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit",
             "providerTimeoutMs", "reservedMicrousd", "status", "windowStartDay", "windowStartMonth",
             "expiresAt", "createdAt", "updatedAt"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9::bigint, $10::bigint, $11::bigint, $12::bigint,
             $13::bigint, $14::bigint, $15::bigint, 'RESERVED',
             date_trunc('day', now() AT TIME ZONE 'UTC'),
             date_trunc('month', now() AT TIME ZONE 'UTC'),
              (now() AT TIME ZONE 'UTC') + ($16::bigint * interval '1 millisecond'),
              (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
           )
           RETURNING "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind",
             "priceVersionId", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
             "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit", "providerTimeoutMs",
             "reservedMicrousd", "settledMicrousd", "status", "windowStartDay",
             "windowStartMonth", "dispatchedAt", "expiresAt"`,
          randomUUID(),
          subjectId,
          input.idempotencyKey,
          input.rail,
          input.provider,
          input.model,
          input.operationKind,
          priceRows[0].id,
          priceSnapshot.inputMicrousdPerMillionTokens.toString(),
          priceSnapshot.outputMicrousdPerMillionTokens.toString(),
          priceSnapshot.audioInputMicrousdPerSecond.toString(),
          priceSnapshot.audioOutputMicrousdPerSecond.toString(),
          priceSnapshot.imageMicrousdPerUnit.toString(),
          config.providerTimeoutMs.toString(),
          reserveMicrousd.toString(),
          RESERVED_TTL_MS.toString()
        );
        if (operationRows.length !== 1) throw new Error('Cost governor operation insert did not return a row');
        const operation = operationFromRow(operationRows[0]);

        await transaction.$executeRawUnsafe(
          `INSERT INTO "AiCostLedgerEntry" (
             "id", "operationId", "entryType", "amountMicrousd", "previousStatus", "nextStatus", "reason", "createdAt"
           ) VALUES ($1, $2, 'RESERVE', $3::bigint, NULL, 'RESERVED', 'reserve', (now() AT TIME ZONE 'UTC'))`,
          randomUUID(),
          operation.id,
          reserveMicrousd.toString()
        );

        return {
          decision: 'ALLOW_RESERVED',
          operation,
          providerTimeoutMs: Number(operation.providerTimeoutMs),
        };
      }, TRANSACTION_OPTIONS);
    } catch (error) {
      if (error instanceof TransactionDecisionAbort) {
        return { decision: error.decision, detail: error.detail };
      }
      return { decision: 'DENY_LEDGER_UNAVAILABLE' };
    }
  }

  async markDispatching(operationId: string): Promise<boolean> {
    assertDispatchingConfig();
    if (!isExactNonEmpty(operationId)) throw new CostGovernorDeniedError('DENY_POLICY');
    try {
      return await this.databaseProvider().$transaction(async (transaction) => {
        await setReadCommitted(transaction);
        const rows = await transaction.$queryRawUnsafe<ReadonlyArray<{ id: string }>>(
          `UPDATE "AiCostOperation"
            SET "status" = 'DISPATCHING',
                "dispatchedAt" = (now() AT TIME ZONE 'UTC'),
                "expiresAt" = (now() AT TIME ZONE 'UTC') + (("providerTimeoutMs" + $2::bigint) * interval '1 millisecond'),
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          WHERE "id" = $1
            AND "status" = 'RESERVED'
             AND "createdAt" >= (now() AT TIME ZONE 'UTC')
                 - (($3::bigint - $4::bigint) * interval '1 millisecond')
          RETURNING "id"`,
          operationId,
          IN_FLIGHT_LEASE_GRACE_MS.toString(),
          RESERVED_TTL_MS.toString(),
          DISPATCH_GUARD_MS.toString()
        );
        return rows.length === 1;
      }, TRANSACTION_OPTIONS);
    } catch (error) {
      throw asLedgerUnavailable(error);
    }
  }

  async settle(input: CostGovernorSettleInput): Promise<Readonly<{ applied: boolean; operation: CostGovernorOperation }>> {
    if (!isExactNonEmpty(input.operationId)) throw new CostGovernorDeniedError('DENY_POLICY');
    try {
      return await this.databaseProvider().$transaction(async (transaction) => {
        await setReadCommitted(transaction);
        const operation = await this.requireOperationForUpdate(transaction, input.operationId);
        if (operation.status === 'SETTLED') return { applied: false, operation };
        if (operation.status !== 'DISPATCHING' && operation.status !== 'OUTCOME_UNKNOWN') {
          throw new Error(`Cannot settle cost operation in status ${operation.status}`);
        }

        const usageInput = toBigInt(input.usage?.inputTokens ?? null);
        const usageOutput = toBigInt(input.usage?.outputTokens ?? null);
        const hasCompleteTokenUsage = usageInput !== null && usageOutput !== null && usageInput >= 0n && usageOutput >= 0n;
        let actualCostMicrousd: bigint | null = null;
        let settledMicrousd = operation.reservedMicrousd;
        const unit = costModelUnit(operation.operationKind, operation.model);
        if (unit === 'token-bidirectional' && hasCompleteTokenUsage) {
          actualCostMicrousd = costMicrousd(operation.operationKind, {
            model: operation.model,
            inputTokens: usageInput,
            outputTokens: usageOutput,
            prices: {
              inputMicrousdPerMillionTokens: operation.inputMicrousdPerMillionTokens,
              outputMicrousdPerMillionTokens: operation.outputMicrousdPerMillionTokens,
              audioInputMicrousdPerSecond: operation.audioInputMicrousdPerSecond,
              audioOutputMicrousdPerSecond: operation.audioOutputMicrousdPerSecond,
              imageMicrousdPerUnit: operation.imageMicrousdPerUnit,
            },
          });
          if (actualCostMicrousd === null) throw new Error('Cost governor token settlement has no valid reserve-time price');
          settledMicrousd = actualCostMicrousd;
        }

        await this.moveCountersToSettled(transaction, operation, settledMicrousd);
        const updatedRows = await transaction.$queryRawUnsafe<OperationRow[]>(
          `UPDATE "AiCostOperation"
              SET "settledMicrousd" = $2::bigint,
                  "status" = 'SETTLED',
                  "providerRequestId" = COALESCE($3::text, "providerRequestId"),
                  "usageInputTokens" = $4::bigint,
                  "usageOutputTokens" = $5::bigint,
                  "actualCostMicrousd" = $6::bigint,
                  "settledAt" = (now() AT TIME ZONE 'UTC'),
                  "expiresAt" = GREATEST((now() AT TIME ZONE 'UTC'), "createdAt" + interval '1 millisecond'),
                  "updatedAt" = (now() AT TIME ZONE 'UTC')
            WHERE "id" = $1
            RETURNING "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind",
              "priceVersionId", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
              "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit", "providerTimeoutMs",
              "reservedMicrousd", "settledMicrousd", "status", "windowStartDay",
              "windowStartMonth", "dispatchedAt", "expiresAt"`,
          operation.id,
          settledMicrousd.toString(),
          input.providerRequestId ?? null,
          hasCompleteTokenUsage ? usageInput!.toString() : null,
          hasCompleteTokenUsage ? usageOutput!.toString() : null,
          actualCostMicrousd?.toString() ?? null
        );
        if (updatedRows.length !== 1) throw new Error('Cost governor settle update did not return a row');
        const updated = operationFromRow(updatedRows[0]);
        await transaction.$executeRawUnsafe(
          `INSERT INTO "AiCostLedgerEntry" (
             "id", "operationId", "entryType", "amountMicrousd", "previousStatus", "nextStatus", "reason", "createdAt"
           ) VALUES ($1, $2, 'SETTLE', $3::bigint, $4, 'SETTLED', $5, (now() AT TIME ZONE 'UTC'))`,
          randomUUID(),
          operation.id,
          settledMicrousd.toString(),
          operation.status,
          actualCostMicrousd !== null
            ? 'provider_usage'
            : unit === 'token-bidirectional'
              ? 'usage_unavailable_conservative_settle'
              : 'non_token_settle_at_reserve'
        );
        return { applied: true, operation: updated };
      }, TRANSACTION_OPTIONS);
    } catch (error) {
      throw asLedgerUnavailable(error);
    }
  }

  async release(input: CostGovernorReleaseInput): Promise<boolean> {
    if (!isExactNonEmpty(input.operationId)) throw new CostGovernorDeniedError('DENY_POLICY');
    try {
      return await this.databaseProvider().$transaction(async (transaction) => {
        await setReadCommitted(transaction);
        const operation = await this.requireOperationForUpdate(transaction, input.operationId);
        if (operation.status === 'RELEASED') return false;
        const allowed =
          operation.status === 'RESERVED' ||
          (operation.status === 'DISPATCHING' && input.reason === 'provider_http_4xx');
        if (!allowed) throw new Error(`Cannot release cost operation in status ${operation.status}`);

        await this.releaseCounters(transaction, operation);
        const updated = await transaction.$queryRawUnsafe<ReadonlyArray<{ id: string }>>(
          `UPDATE "AiCostOperation"
              SET "status" = 'RELEASED',
                  "expiresAt" = GREATEST((now() AT TIME ZONE 'UTC'), "createdAt" + interval '1 millisecond'),
                  "updatedAt" = (now() AT TIME ZONE 'UTC')
            WHERE "id" = $1
            RETURNING "id"`,
          operation.id
        );
        if (updated.length !== 1) throw new Error('Cost governor release update did not return a row');
        await transaction.$executeRawUnsafe(
          `INSERT INTO "AiCostLedgerEntry" (
             "id", "operationId", "entryType", "amountMicrousd", "previousStatus", "nextStatus", "reason", "createdAt"
           ) VALUES ($1, $2, 'RELEASE', $3::bigint, $4, 'RELEASED', $5, (now() AT TIME ZONE 'UTC'))`,
          randomUUID(),
          operation.id,
          operation.reservedMicrousd.toString(),
          operation.status,
          input.reason
        );
        return true;
      }, TRANSACTION_OPTIONS);
    } catch (error) {
      throw asLedgerUnavailable(error);
    }
  }

  async markOutcomeUnknown(operationId: string): Promise<boolean> {
    if (!isExactNonEmpty(operationId)) throw new CostGovernorDeniedError('DENY_POLICY');
    try {
      return await this.databaseProvider().$transaction(async (transaction) => {
        await setReadCommitted(transaction);
        const operation = await this.requireOperationForUpdate(transaction, operationId);
        if (operation.status === 'OUTCOME_UNKNOWN') return false;
        if (operation.status !== 'DISPATCHING') {
          throw new Error(`Cannot mark cost operation outcome unknown in status ${operation.status}`);
        }
        const updated = await transaction.$queryRawUnsafe<ReadonlyArray<{ id: string }>>(
          `UPDATE "AiCostOperation"
              SET "status" = 'OUTCOME_UNKNOWN',
                  "expiresAt" = (now() AT TIME ZONE 'UTC') + ($2::bigint * interval '1 millisecond'),
                  "updatedAt" = (now() AT TIME ZONE 'UTC')
            WHERE "id" = $1
            RETURNING "id"`,
          operation.id,
          OUTCOME_UNKNOWN_RECONCILIATION_MS.toString()
        );
        if (updated.length !== 1) throw new Error('Cost governor unknown update did not return a row');
        await transaction.$executeRawUnsafe(
          `INSERT INTO "AiCostLedgerEntry" (
             "id", "operationId", "entryType", "amountMicrousd", "previousStatus", "nextStatus", "reason", "createdAt"
           ) VALUES ($1, $2, 'ADJUSTMENT', 0, $3, 'OUTCOME_UNKNOWN', 'provider_outcome_unknown', (now() AT TIME ZONE 'UTC'))`,
          randomUUID(),
          operation.id,
          operation.status
        );
        return true;
      }, TRANSACTION_OPTIONS);
    } catch (error) {
      throw asLedgerUnavailable(error);
    }
  }

  async findReconcilableOperations(
    limit = DEFAULT_RECONCILIATION_BATCH_SIZE
  ): Promise<readonly CostGovernorReconcilableOperation[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_RECONCILIATION_BATCH_SIZE) {
      throw new RangeError(`Cost governor reconciliation limit must be between 1 and ${MAX_RECONCILIATION_BATCH_SIZE}`);
    }

    // expiresAt is stored as UTC-naive TIMESTAMP; compare it with the DB clock in that same representation.
    const rows = await this.databaseProvider().$queryRawUnsafe<OperationRow[]>(
      `SELECT "id", "status", "dispatchedAt", "reservedMicrousd", "expiresAt"
         FROM "AiCostOperation"
        WHERE "status" IN ('RESERVED', 'DISPATCHING', 'OUTCOME_UNKNOWN')
          AND "expiresAt" < (clock_timestamp() AT TIME ZONE 'UTC')
        ORDER BY "expiresAt" ASC, "id" ASC
        LIMIT $1::integer`,
      limit
    );

    return rows.map((row) => this.reconcilableOperationFromRow(row));
  }

  async reconcileOperation(operationId: string): Promise<CostGovernorReconciliationAction> {
    if (!isExactNonEmpty(operationId)) return 'skipped';
    const candidate = await this.findReconciliationCandidate(operationId);
    if (!candidate || !candidate.isExpired) return 'skipped';

    if (candidate.status === 'RESERVED') {
      if (candidate.dispatchedAt !== null) return 'skipped';
      const applied = await this.applyReconciliationTransition(
        candidate,
        () => this.release({ operationId, reason: 'reserved_not_dispatched' })
      );
      return applied ? 'released' : 'skipped';
    }

    if (candidate.status === 'DISPATCHING') {
      const applied = await this.applyReconciliationTransition(
        candidate,
        () => this.markOutcomeUnknown(operationId)
      );
      return applied ? 'markedUnknown' : 'skipped';
    }

    const settled = await this.applyReconciliationTransition(
      candidate,
      async () => (await this.settle({ operationId })).applied
    );
    return settled ? 'settled' : 'skipped';
  }

  async reconcileStale(limit = DEFAULT_RECONCILIATION_BATCH_SIZE): Promise<CostGovernorReconciliationStats> {
    const candidates = await this.findReconcilableOperations(limit);
    const stats = { released: 0, markedUnknown: 0, settled: 0, skipped: 0 };
    for (const candidate of candidates) {
      const action = await this.reconcileOperation(candidate.operationId);
      stats[action] += 1;
    }
    return stats;
  }

  private async findReconciliationCandidate(
    operationId: string
  ): Promise<Readonly<CostGovernorReconcilableOperation & { isExpired: boolean }> | null> {
    const rows = await this.databaseProvider().$queryRawUnsafe<OperationRow[]>(
      `SELECT "id", "status", "dispatchedAt", "reservedMicrousd", "expiresAt",
              ("expiresAt" < (clock_timestamp() AT TIME ZONE 'UTC')) AS "isExpired"
         FROM "AiCostOperation"
        WHERE "id" = $1
          AND "status" IN ('RESERVED', 'DISPATCHING', 'OUTCOME_UNKNOWN')`,
      operationId
    );
    if (rows.length === 0) return null;
    return { ...this.reconcilableOperationFromRow(rows[0]), isExpired: rows[0].isExpired === true };
  }

  private reconcilableOperationFromRow(row: OperationRow): CostGovernorReconcilableOperation {
    const status = row.status;
    const reservedMicrousd = toBigInt(row.reservedMicrousd as bigint | number | string | null | undefined);
    if (
      (status !== 'RESERVED' && status !== 'DISPATCHING' && status !== 'OUTCOME_UNKNOWN') ||
      reservedMicrousd === null ||
      reservedMicrousd < 0n
    ) {
      throw new Error('Cost governor reconciliation query returned an invalid operation');
    }
    return {
      operationId: String(row.id),
      status,
      dispatchedAt: toNullableDate(row.dispatchedAt),
      reservedMicrousd,
      expiresAt: toDate(row.expiresAt),
    };
  }

  private async applyReconciliationTransition(
    candidate: Readonly<CostGovernorReconcilableOperation & { isExpired: boolean }>,
    transition: () => Promise<boolean>
  ): Promise<boolean> {
    try {
      return await transition();
    } catch (error) {
      const current = await this.findReconciliationCandidate(candidate.operationId);
      const candidateChanged =
        current === null ||
        current.status !== candidate.status ||
        !current.isExpired ||
        (candidate.status === 'RESERVED' && current.dispatchedAt !== null);
      if (candidateChanged) return false;
      throw error;
    }
  }

  private async findOperationByIdempotency(
    transaction: RawSqlClient,
    subjectId: string,
    idempotencyKey: string
  ): Promise<CostGovernorOperation | null> {
    const rows = await transaction.$queryRawUnsafe<OperationRow[]>(
        `SELECT "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind",
              "priceVersionId", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
              "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit", "providerTimeoutMs",
              "reservedMicrousd", "settledMicrousd", "status", "windowStartDay",
              "windowStartMonth", "dispatchedAt", "expiresAt"
         FROM "AiCostOperation"
        WHERE "subjectId" = $1 AND "idempotencyKey" = $2
        FOR UPDATE`,
      subjectId,
      idempotencyKey
    );
    return rows.length === 0 ? null : operationFromRow(rows[0]);
  }

  private async countInflight(
    transaction: RawSqlClient,
    subjectId: string | null
  ): Promise<bigint> {
    const rows = await transaction.$queryRawUnsafe<CountRow[]>(
      `SELECT count(*)::bigint AS "count"
         FROM "AiCostOperation"
        WHERE ($1::text IS NULL OR "subjectId" = $1)
          AND (
             "status" IN ('RESERVED', 'DISPATCHING')
             AND "expiresAt" > (now() AT TIME ZONE 'UTC')
           )`,
       subjectId
    );
    const count = rows.length === 1 ? toBigInt(rows[0].count) : null;
    if (count === null || count < 0n) throw new Error('Cost governor in-flight count is invalid');
    return count;
  }

  private async reserveCounter(
    transaction: RawSqlClient,
    scope: string,
    period: 'day' | 'month',
    amountMicrousd: bigint,
    capMicrousd: bigint
  ): Promise<boolean> {
    if (amountMicrousd > capMicrousd) return false;
    const windowExpression =
      period === 'month'
        ? "date_trunc('month', now() AT TIME ZONE 'UTC')"
        : "date_trunc('day', now() AT TIME ZONE 'UTC')";
    const rows = await transaction.$queryRawUnsafe<ReadonlyArray<{ id: string }>>(
      `INSERT INTO "AiCostBudgetCounter" (
         "id", "scope", "windowStart", "reservedMicrousd", "settledMicrousd", "createdAt", "updatedAt"
       ) SELECT $1, $2, ${windowExpression}, $3::bigint, 0,
                 (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC')
           WHERE $3::bigint <= $4::bigint
       ON CONFLICT ("scope", "windowStart") DO UPDATE
         SET "reservedMicrousd" = "AiCostBudgetCounter"."reservedMicrousd" + EXCLUDED."reservedMicrousd",
              "updatedAt" = (now() AT TIME ZONE 'UTC')
       WHERE "AiCostBudgetCounter"."settledMicrousd" + "AiCostBudgetCounter"."reservedMicrousd" + EXCLUDED."reservedMicrousd" <= $4::bigint
       RETURNING "id"`,
      randomUUID(),
      scope,
      amountMicrousd.toString(),
      capMicrousd.toString()
    );
    return rows.length === 1;
  }

  private async requireOperationForUpdate(transaction: RawSqlClient, operationId: string): Promise<CostGovernorOperation> {
    const rows = await transaction.$queryRawUnsafe<OperationRow[]>(
        `SELECT "id", "subjectId", "idempotencyKey", "rail", "provider", "model", "operationKind",
              "priceVersionId", "inputMicrousdPerMillionTokens", "outputMicrousdPerMillionTokens",
              "audioInputMicrousdPerSecond", "audioOutputMicrousdPerSecond", "imageMicrousdPerUnit", "providerTimeoutMs",
              "reservedMicrousd", "settledMicrousd", "status", "windowStartDay",
              "windowStartMonth", "dispatchedAt", "expiresAt"
         FROM "AiCostOperation"
        WHERE "id" = $1
        FOR UPDATE`,
      operationId
    );
    if (rows.length !== 1) throw new Error('Cost governor operation does not exist');
    return operationFromRow(rows[0]);
  }

  private async moveCountersToSettled(
    transaction: RawSqlClient,
    operation: CostGovernorOperation,
    settledMicrousd: bigint
  ): Promise<void> {
    const counters: readonly Readonly<{ scope: string; operationWindowColumn: 'windowStartMonth' | 'windowStartDay' }>[] = [
      { scope: counterScope(operation.subjectId, 'GLOBAL_MONTH'), operationWindowColumn: 'windowStartMonth' },
      { scope: counterScope(operation.subjectId, 'GLOBAL_DAY'), operationWindowColumn: 'windowStartDay' },
      { scope: counterScope(operation.subjectId, 'USER_DAY'), operationWindowColumn: 'windowStartDay' },
    ];
    for (const counter of counters) {
      const rows = await transaction.$queryRawUnsafe<ReadonlyArray<{ id: string }>>(
        `UPDATE "AiCostBudgetCounter"
            SET "reservedMicrousd" = "AiCostBudgetCounter"."reservedMicrousd" - $1::bigint,
                "settledMicrousd" = "AiCostBudgetCounter"."settledMicrousd" + $2::bigint,
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          FROM "AiCostOperation"
          WHERE "AiCostBudgetCounter"."scope" = $3
            AND "AiCostBudgetCounter"."windowStart" = "AiCostOperation"."${counter.operationWindowColumn}"
            AND "AiCostOperation"."id" = $4
            AND "AiCostBudgetCounter"."reservedMicrousd" >= $1::bigint
          RETURNING "AiCostBudgetCounter"."id"`,
        operation.reservedMicrousd.toString(),
        settledMicrousd.toString(),
        counter.scope,
        operation.id
      );
      if (rows.length !== 1) throw new Error('Cost governor counter settle update was not durable');
    }
  }

  private async releaseCounters(transaction: RawSqlClient, operation: CostGovernorOperation): Promise<void> {
    const counters: readonly Readonly<{ scope: string; operationWindowColumn: 'windowStartMonth' | 'windowStartDay' }>[] = [
      { scope: counterScope(operation.subjectId, 'GLOBAL_MONTH'), operationWindowColumn: 'windowStartMonth' },
      { scope: counterScope(operation.subjectId, 'GLOBAL_DAY'), operationWindowColumn: 'windowStartDay' },
      { scope: counterScope(operation.subjectId, 'USER_DAY'), operationWindowColumn: 'windowStartDay' },
    ];
    for (const counter of counters) {
      const rows = await transaction.$queryRawUnsafe<ReadonlyArray<{ id: string }>>(
        `UPDATE "AiCostBudgetCounter"
            SET "reservedMicrousd" = "AiCostBudgetCounter"."reservedMicrousd" - $1::bigint,
                "updatedAt" = (now() AT TIME ZONE 'UTC')
          FROM "AiCostOperation"
          WHERE "AiCostBudgetCounter"."scope" = $2
            AND "AiCostBudgetCounter"."windowStart" = "AiCostOperation"."${counter.operationWindowColumn}"
            AND "AiCostOperation"."id" = $3
            AND "AiCostBudgetCounter"."reservedMicrousd" >= $1::bigint
          RETURNING "AiCostBudgetCounter"."id"`,
        operation.reservedMicrousd.toString(),
        counter.scope,
        operation.id
      );
      if (rows.length !== 1) throw new Error('Cost governor counter release update was not durable');
    }
  }
}

let defaultCostGovernor: CostGovernor | undefined;

/** Production default. The Prisma client is resolved only when a governor method is called. */
export function getCostGovernor(): CostGovernor {
  if (!defaultCostGovernor) defaultCostGovernor = new CostGovernorService();
  return defaultCostGovernor;
}

export function assertCostGovernorReservation(result: CostGovernorReserveResult): asserts result is Extract<CostGovernorReserveResult, { decision: 'ALLOW_RESERVED' }> {
  if (result.decision !== 'ALLOW_RESERVED') {
    throw new CostGovernorDeniedError(result.decision, result.detail);
  }
}
