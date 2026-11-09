import { createHash, randomUUID } from 'node:crypto';

export type AuthorityActionKind = 'VOICE_CALL_BOOKING';
export type AuthorityLedgerEntryType = 'ISSUED' | 'CONSUMED' | 'EXPIRED' | 'CONSUME_REJECTED';

export type AuthorityIssueInput = Readonly<{
  subjectId: string;
  tenantId: string;
  actionKind: AuthorityActionKind;
  exactTarget: string;
  maxAttempts: 1;
  expiresAt: Date;
  currency: string;
  maxCostMinor: bigint;
  allowedDisclosures: unknown;
  constraints: unknown;
  preparePayload: unknown;
}>;

export type AuthorityRecord = Readonly<{
  authorityId: string;
  subjectId: string;
  tenantId: string;
  policyVersion: string;
  prepareSha256: string;
  actionKind: AuthorityActionKind;
  exactTarget: string;
  maxAttempts: 1;
  expiresAt: Date;
  currency: string;
  maxCostMinor: bigint;
  allowedDisclosures: unknown;
  constraints: unknown;
  state: 'ACTIVE_UNUSED' | 'CONSUMED';
  issuedBy: string;
  approvalRef: string;
  contextBinding: string;
  createdAt: Date;
  consumedAt: Date | null;
}>;

export type AuthorityContext = Readonly<{
  subjectId: string;
  tenantId: string;
  exactTarget: string;
  contextBinding: string;
  preparePayload: unknown;
}>;

export type AuthorityPolicyProvider = Readonly<{
  authorizeIssue(input: AuthorityIssueInput): Promise<Readonly<{
    allowed: boolean;
    policyVersion: string;
    issuedBy: string;
    approvalRef: string;
    contextBinding: string;
    reason?: string;
  }>>;
  authorizeConsume(record: AuthorityRecord, context: AuthorityContext): Promise<Readonly<{
    allowed: boolean;
    reason?: string;
  }>>;
}>;

export type AuthorityTransaction = Readonly<{
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}>;

export type AuthorityDatabase = AuthorityTransaction & Readonly<{
  $transaction<T>(
    callback: (transaction: AuthorityTransaction) => Promise<T>,
    options: Readonly<{ maxWait: number; timeout: number }>
  ): Promise<T>;
}>;
type AuthorityRow = Readonly<Record<string, unknown>>;
type AuthorityDbRow = AuthorityRow & Readonly<{ isNotExpired: boolean }>;

export type AuthorityConsumeResult =
  | Readonly<{ consumed: true; authority: AuthorityRecord }>
  | Readonly<{ consumed: false; reason: 'NOT_FOUND' | 'EXPIRED' | 'CONTEXT_MISMATCH' | 'POLICY_REJECTED' | 'ALREADY_CONSUMED' }>;

const TRANSACTION_OPTIONS = Object.freeze({ maxWait: 5_000, timeout: 10_000 });
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9A-F]{64}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function canonicalValue(value: unknown, stack: Set<object>): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Canonical JSON does not support non-finite numbers');
    return value;
  }
  if (Array.isArray(value)) {
    if (stack.has(value)) throw new TypeError('Canonical JSON does not support cycles');
    stack.add(value);
    const result = value.map((item) => {
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol' || typeof item === 'bigint') {
        throw new TypeError('Canonical JSON array contains an unsupported value');
      }
      return canonicalValue(item, stack);
    });
    stack.delete(value);
    return result;
  }
  if (isPlainObject(value)) {
    if (stack.has(value)) throw new TypeError('Canonical JSON does not support cycles');
    stack.add(value);
    const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value).sort()) {
      const item = value[key];
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol' || typeof item === 'bigint') {
        throw new TypeError(`Canonical JSON property ${key} has an unsupported value`);
      }
      result[key] = canonicalValue(item, stack);
    }
    stack.delete(value);
    return result;
  }
  throw new TypeError('Canonical JSON accepts only JSON primitives, arrays, and plain objects');
}

/** Stable compact JSON: recursively sorted object keys and no platform line-ending conversion. */
export function canonicalize(value: unknown): string {
  const serialized = JSON.stringify(canonicalValue(value, new Set<object>()));
  if (typeof serialized !== 'string') throw new TypeError('Canonical JSON serialization failed');
  return serialized;
}

export function prepareHashFromCanonical(canonical: string): string {
  return createHash('sha256').update(Buffer.from(canonical, 'utf8')).digest('hex').toUpperCase();
}
export function prepareHash(value: unknown): string {
  return prepareHashFromCanonical(canonicalize(value));
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function utcTimestampWithoutZone(value: Date): string {
  return value.toISOString().replace(/Z$/, '');
}

function requiredText(row: AuthorityRow, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new Error(`Authority database row is missing ${key}`);
  return value;
}

function asDate(value: unknown, field: string): Date {
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (!Number.isFinite(parsed.getTime())) throw new Error(`Authority database row has invalid ${field}`);
  return parsed;
}

function authorityFromRow(row: AuthorityRow): AuthorityRecord {
  const maxAttempts = Number(row.maxAttempts);
  if (maxAttempts !== 1) throw new Error('Authority database row violates maxAttempts=1');
  const state = requiredText(row, 'state');
  if (state !== 'ACTIVE_UNUSED' && state !== 'CONSUMED') throw new Error('Authority database row has invalid state');
  const disclosures = typeof row.allowedDisclosures === 'string' ? JSON.parse(row.allowedDisclosures) as unknown : row.allowedDisclosures;
  const constraints = typeof row.constraints === 'string' ? JSON.parse(row.constraints) as unknown : row.constraints;
  return {
    authorityId: requiredText(row, 'authorityId'),
    subjectId: requiredText(row, 'subjectId'),
    tenantId: requiredText(row, 'tenantId'),
    policyVersion: requiredText(row, 'policyVersion'),
    prepareSha256: requiredText(row, 'prepareSha256'),
    actionKind: requiredText(row, 'actionKind') as AuthorityActionKind,
    exactTarget: requiredText(row, 'exactTarget'),
    maxAttempts: 1,
    expiresAt: asDate(row.expiresAt, 'expiresAt'),
    currency: requiredText(row, 'currency'),
    maxCostMinor: BigInt(String(row.maxCostMinor)),
    allowedDisclosures: disclosures,
    constraints,
    state,
    issuedBy: requiredText(row, 'issuedBy'),
    approvalRef: requiredText(row, 'approvalRef'),
    contextBinding: requiredText(row, 'contextBinding'),
    createdAt: asDate(row.createdAt, 'createdAt'),
    consumedAt: row.consumedAt === null || row.consumedAt === undefined ? null : asDate(row.consumedAt, 'consumedAt'),
  };
}

export class AuthorityService {
  constructor(
    private readonly database: AuthorityDatabase,
    private readonly policy: AuthorityPolicyProvider
  ) {}

  async issue(input: AuthorityIssueInput): Promise<AuthorityRecord> {
    const subjectId = input.subjectId;
    const tenantId = input.tenantId;
    const exactTarget = input.exactTarget;
    const actionKind = input.actionKind;
    const maxAttempts = input.maxAttempts;
    const expiresAt = input.expiresAt;
    const currency = input.currency;
    const maxCostMinor = input.maxCostMinor;
    if (
      !nonEmpty(subjectId) || !nonEmpty(tenantId) || !nonEmpty(exactTarget) ||
      actionKind !== 'VOICE_CALL_BOOKING' || maxAttempts !== 1 ||
      !(expiresAt instanceof Date) || !/^[A-Z]{3}$/.test(currency) ||
      maxCostMinor < 0n
    ) {
      throw new Error('Authority issue input failed closed validation');
    }
    // Read the caller Date's epoch once via the Date intrinsic so overridden getTime/toISOString
    // (or a Date subclass) cannot make the stored expiry disagree with the expiry the policy evaluates.
    const expiresAtMs = Date.prototype.getTime.call(expiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      throw new Error('Authority issue input failed closed validation');
    }
    const trustedExpiresAt = new Date(expiresAtMs);
    // Snapshot before any await so a concurrent caller mutation cannot change what was approved/stored.
    const preparePayloadCanon = canonicalize(input.preparePayload);
    const prepareSha256 = prepareHashFromCanonical(preparePayloadCanon);
    const disclosuresJson = canonicalize(input.allowedDisclosures);
    const constraintsJson = canonicalize(input.constraints);
    const expiresAtUtc = utcTimestampWithoutZone(trustedExpiresAt);
    const maxCostMinorText = maxCostMinor.toString();
    const snapshot: AuthorityIssueInput = Object.freeze({
      subjectId, tenantId, actionKind, exactTarget, maxAttempts,
      expiresAt: new Date(expiresAtMs), currency, maxCostMinor,
      allowedDisclosures: JSON.parse(disclosuresJson) as unknown,
      constraints: JSON.parse(constraintsJson) as unknown,
      preparePayload: JSON.parse(preparePayloadCanon) as unknown,
    });
    const decision = await this.policy.authorizeIssue(snapshot);
    if (
      decision.allowed !== true || !nonEmpty(decision.policyVersion) || !nonEmpty(decision.issuedBy) ||
      !nonEmpty(decision.approvalRef) || !nonEmpty(decision.contextBinding)
    ) {
      throw new Error(`Authority issue denied${decision.reason ? `: ${decision.reason}` : ''}`);
    }

    return this.database.$transaction(async (transaction) => {
      const authorityId = randomUUID();
      const rows = await transaction.$queryRawUnsafe<AuthorityRow[]>(
        `INSERT INTO "AuthorityRecord" (
           "authorityId", "subjectId", "tenantId", "policyVersion", "prepareSha256", "actionKind",
           "exactTarget", "maxAttempts", "expiresAt", "currency", "maxCostMinor", "allowedDisclosures",
           "constraints", "state", "issuedBy", "approvalRef", "contextBinding", "createdAt", "consumedAt"
         ) VALUES (
           $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::timestamp(3), $10, $11::bigint,
           $12::jsonb, $13::jsonb, 'ACTIVE_UNUSED', $14, $15, $16, (now() AT TIME ZONE 'UTC'), NULL
         ) RETURNING *`,
        authorityId,
        subjectId,
        tenantId,
        decision.policyVersion,
        prepareSha256,
        actionKind,
        exactTarget,
        maxAttempts,
        expiresAtUtc,
        currency,
        maxCostMinorText,
        disclosuresJson,
        constraintsJson,
        decision.issuedBy,
        decision.approvalRef,
        decision.contextBinding
      );
      if (rows.length !== 1) throw new Error('Authority issue did not return exactly one record');
      const authority = authorityFromRow(rows[0]);
      await this.appendLedger(transaction, authorityId, 'ISSUED', {
        policyVersion: decision.policyVersion,
        actionKind,
      });
      return authority;
    }, TRANSACTION_OPTIONS);
  }

  async verifyAndConsume(authorityId: string, context: AuthorityContext): Promise<AuthorityConsumeResult> {
    if (!UUID_PATTERN.test(authorityId)) return { consumed: false, reason: 'NOT_FOUND' };
    // Snapshot context BEFORE any await so a concurrent caller mutation cannot change what is matched/approved.
    const ctxSubjectId = context.subjectId;
    const ctxTenantId = context.tenantId;
    const ctxExactTarget = context.exactTarget;
    const ctxContextBinding = context.contextBinding;
    const contextPayloadCanon = canonicalize(context.preparePayload);
    const contextHash = prepareHashFromCanonical(contextPayloadCanon);
    const frozenContext: AuthorityContext = Object.freeze({
      subjectId: ctxSubjectId, tenantId: ctxTenantId, exactTarget: ctxExactTarget,
      contextBinding: ctxContextBinding,
      preparePayload: JSON.parse(contextPayloadCanon) as unknown,
    });
    return this.database.$transaction(async (transaction) => {
      const rows = await transaction.$queryRawUnsafe<AuthorityDbRow[]>(
        `SELECT *, ("expiresAt" > (clock_timestamp() AT TIME ZONE 'UTC')) AS "isNotExpired"
           FROM "AuthorityRecord"
          WHERE "authorityId" = $1::uuid
          FOR UPDATE`,
        authorityId
      );
      if (rows.length !== 1) return { consumed: false, reason: 'NOT_FOUND' } as const;
      const row = rows[0];
      const record = authorityFromRow(row);
      if (row.isNotExpired !== true) {
        await this.appendLedger(transaction, authorityId, 'EXPIRED', { reason: 'expired_before_consume' });
        return { consumed: false, reason: 'EXPIRED' } as const;
      }
      if (
        record.subjectId !== ctxSubjectId || record.tenantId !== ctxTenantId ||
        record.prepareSha256 !== contextHash || record.exactTarget !== ctxExactTarget ||
        record.contextBinding !== ctxContextBinding
      ) {
        await this.appendLedger(transaction, authorityId, 'CONSUME_REJECTED', { reason: 'context_mismatch' });
        return { consumed: false, reason: 'CONTEXT_MISMATCH' } as const;
      }
      if (record.state !== 'ACTIVE_UNUSED') {
        await this.appendLedger(transaction, authorityId, 'CONSUME_REJECTED', { reason: 'already_consumed' });
        return { consumed: false, reason: 'ALREADY_CONSUMED' } as const;
      }
      const policyDecision = await this.policy.authorizeConsume(record, frozenContext);
      if (policyDecision.allowed !== true) {
        await this.appendLedger(transaction, authorityId, 'CONSUME_REJECTED', {
          reason: policyDecision.reason ?? 'current_policy_rejected',
        });
        return { consumed: false, reason: 'POLICY_REJECTED' } as const;
      }
      const consumedRows = await transaction.$queryRawUnsafe<AuthorityRow[]>(
        `UPDATE "AuthorityRecord"
            SET "state" = 'CONSUMED',
                "consumedAt" = date_trunc('milliseconds', clock_timestamp() AT TIME ZONE 'UTC')
          WHERE "authorityId" = $1::uuid
            AND "state" = 'ACTIVE_UNUSED'
            AND "expiresAt" > (clock_timestamp() AT TIME ZONE 'UTC')
          RETURNING *`,
        authorityId
      );
      if (consumedRows.length !== 1) {
        await this.appendLedger(transaction, authorityId, 'CONSUME_REJECTED', { reason: 'compare_and_swap_lost' });
        return { consumed: false, reason: 'ALREADY_CONSUMED' } as const;
      }
      const consumedAuthority = authorityFromRow(consumedRows[0]);
      await this.appendLedger(transaction, authorityId, 'CONSUMED', {
        actionKind: consumedAuthority.actionKind,
        prepareSha256: consumedAuthority.prepareSha256,
      });
      return { consumed: true, authority: consumedAuthority } as const;
    }, TRANSACTION_OPTIONS);
  }

  private async appendLedger(
    transaction: AuthorityTransaction,
    authorityId: string,
    entryType: AuthorityLedgerEntryType,
    detail: unknown
  ): Promise<void> {
    await transaction.$executeRawUnsafe(
      `INSERT INTO "AuthorityLedgerEntry" ("id", "authorityId", "entryType", "detail", "createdAt")
       VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, (now() AT TIME ZONE 'UTC'))`,
      randomUUID(),
      authorityId,
      entryType,
      canonicalize(detail)
    );
  }
}
