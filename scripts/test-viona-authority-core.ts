import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import {
  AuthorityService,
  canonicalize,
  prepareHash,
  type AuthorityDatabase,
  type AuthorityIssueInput,
  type AuthorityPolicyProvider,
  type AuthorityTransaction,
} from '../src/services/authority/AuthorityService';

type MemoryRecord = Record<string, unknown>;

// AuthorityService stores a UTC wall-clock timestamp without a zone suffix to
// match PostgreSQL TIMESTAMP(3) WITHOUT TIME ZONE. JavaScript parses a bare ISO
// timestamp in local time, so restore Z when no zone is present for this adapter.
function isoUtcToDate(value: string): Date {
  return new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}

class MemoryAuthorityDatabase implements AuthorityDatabase {
  readonly records = new Map<string, MemoryRecord>();
  readonly ledger: Array<Readonly<{ authorityId: string; entryType: string; detail: unknown }>> = [];

  async $transaction<T>(callback: (transaction: AuthorityTransaction) => Promise<T>, _options: Readonly<{ maxWait: number; timeout: number }>): Promise<T> {
    return callback(this);
  }

  async $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> {
    if (query.includes('INSERT INTO "AuthorityRecord"')) {
      const [authorityId, subjectId, tenantId, policyVersion, prepareSha256, actionKind, exactTarget,
        maxAttempts, expiresAt, currency, maxCostMinor, allowedDisclosures, constraints, issuedBy,
        approvalRef, contextBinding] = values;
      const row: MemoryRecord = {
        authorityId, subjectId, tenantId, policyVersion, prepareSha256, actionKind, exactTarget,
        maxAttempts, expiresAt: isoUtcToDate(String(expiresAt)), currency, maxCostMinor: BigInt(String(maxCostMinor)),
        allowedDisclosures: JSON.parse(String(allowedDisclosures)) as unknown,
        constraints: JSON.parse(String(constraints)) as unknown,
        state: 'ACTIVE_UNUSED', issuedBy, approvalRef, contextBinding, createdAt: new Date(), consumedAt: null,
      };
      this.records.set(String(authorityId), row);
      return [row] as T;
    }
    if (query.includes('FROM "AuthorityRecord"')) {
      const row = this.records.get(String(values[0]));
      return (row ? [{ ...row, isNotExpired: new Date(String(row.expiresAt)).getTime() > Date.now() }] : []) as T;
    }
    if (query.includes('UPDATE "AuthorityRecord"')) {
      const row = this.records.get(String(values[0]));
      if (!row || row.state !== 'ACTIVE_UNUSED' || new Date(String(row.expiresAt)).getTime() <= Date.now()) return [] as T;
      row.state = 'CONSUMED';
      row.consumedAt = new Date();
      return [{ ...row }] as T;
    }
    throw new Error(`Unrecognized memory authority SQL: ${query}`);
  }

  async $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number> {
    if (!query.includes('INSERT INTO "AuthorityLedgerEntry"')) throw new Error(`Unrecognized memory authority execute SQL: ${query}`);
    this.ledger.push({
      authorityId: String(values[1]),
      entryType: String(values[2]),
      detail: JSON.parse(String(values[3])) as unknown,
    });
    return 1;
  }
}

function policyProvider(): AuthorityPolicyProvider {
  return {
    authorizeIssue: async () => ({
      allowed: true,
      policyVersion: 'policy-v1',
      issuedBy: 'server:authority-test',
      approvalRef: 'approval:test-fixture',
      contextBinding: 'context-binding:test-fixture',
    }),
    authorizeConsume: async () => ({ allowed: true }),
  };
}

function issueInput(preparePayload: unknown): AuthorityIssueInput {
  return {
    subjectId: 'subject-unit',
    tenantId: 'tenant-unit',
    actionKind: 'VOICE_CALL_BOOKING',
    exactTarget: 'appointment:123',
    maxAttempts: 1,
    expiresAt: new Date(Date.now() + 60_000),
    currency: 'USD',
    maxCostMinor: 500n,
    allowedDisclosures: ['name'],
    constraints: { durationSeconds: 60 },
    preparePayload,
  };
}

function contextFor(input: AuthorityIssueInput, preparePayload: unknown) {
  return {
    subjectId: input.subjectId,
    tenantId: input.tenantId,
    exactTarget: input.exactTarget,
    contextBinding: 'context-binding:test-fixture',
    preparePayload,
  };
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|mjs|cjs)$/.test(name) ? [path] : [];
  });
}

async function main(): Promise<void> {
  assert.equal(canonicalize({ z: 1, a: { y: 2, x: 3 } }), '{"a":{"x":3,"y":2},"z":1}');
  assert.equal(canonicalize({ a: 1, b: 2 }), canonicalize({ b: 2, a: 1 }));
  assert.equal(prepareHash({ a: 1, b: 2 }), prepareHash({ b: 2, a: 1 }));
  assert.match(prepareHash({ payload: 'x' }), /^[0-9A-F]{64}$/);
  assert.notEqual(prepareHash({ payload: 'x' }), prepareHash({ payload: 'y' }));
  assert.throws(() => canonicalize({ value: Number.NaN }), /non-finite/);
  assert.throws(() => canonicalize({ value: 1n }), /unsupported value/);
  console.log('PASS canonical JSON ordering, UTF-8 SHA-256, changed payload, and unsupported values');
  // B1: __proto__ own-key must not collapse to {} (hash binding integrity)
  assert.equal(canonicalize(JSON.parse('{"__proto__":{"x":1}}')), '{"__proto__":{"x":1}}');
  assert.notEqual(prepareHash(JSON.parse('{"__proto__":{"x":1}}')), prepareHash({}));
  console.log('PASS __proto__ payload is canonicalized distinctly (no hash collision)');

  const unissuedDb = new MemoryAuthorityDatabase();
  const unissuedService = new AuthorityService(unissuedDb, policyProvider());
  const selfApprovedDraft = { approved: true, payload: { target: 'appointment:123' } };
  const unissued = await unissuedService.verifyAndConsume(randomUUID(), contextFor(issueInput(selfApprovedDraft), selfApprovedDraft));
  assert.deepEqual(unissued, { consumed: false, reason: 'NOT_FOUND' });
  assert.equal(unissuedDb.records.size, 0, 'a self-approved draft does not create an authority record');
  console.log('PASS an approved=true draft without server-side issue has no record and cannot consume');

  const changedDb = new MemoryAuthorityDatabase();
  const changedService = new AuthorityService(changedDb, policyProvider());
  const issuedPayload = { target: 'appointment:123', note: 'original' };
  const issuedInput = issueInput(issuedPayload);
  const issued = await changedService.issue(issuedInput);
  assert.equal(issued.prepareSha256, prepareHash(issuedPayload));
  const changed = await changedService.verifyAndConsume(issued.authorityId, contextFor(issuedInput, { ...issuedPayload, note: 'changed' }));
  assert.deepEqual(changed, { consumed: false, reason: 'CONTEXT_MISMATCH' });
  assert.equal(changedDb.records.get(issued.authorityId)?.state, 'ACTIVE_UNUSED');
  assert.equal(changedDb.ledger.filter((entry) => entry.entryType === 'CONSUME_REJECTED').length, 1);
  assert.equal(changedDb.ledger.some((entry) => entry.entryType === 'CONSUMED'), false);
  console.log('PASS payload mutation is rejected and audited as CONSUME_REJECTED');

  const snapshotDb = new MemoryAuthorityDatabase();
  const mutableIssueInput = issueInput({ target: 'appointment:123', note: 'snapshot' });
  const snapshotService = new AuthorityService(snapshotDb, {
    authorizeIssue: async (snapshot) => {
      await Promise.resolve();
      (mutableIssueInput as any).exactTarget = 'MUTATED';
      assert.equal(snapshot.exactTarget, 'appointment:123');
      return {
        allowed: true,
        policyVersion: 'policy-v1',
        issuedBy: 'server:authority-test',
        approvalRef: 'approval:test-fixture',
        contextBinding: 'context-binding:test-fixture',
      };
    },
    authorizeConsume: async () => ({ allowed: true }),
  });
  const snapshotIssued = await snapshotService.issue(mutableIssueInput);
  assert.equal(snapshotIssued.exactTarget, 'appointment:123');
  assert.equal(snapshotDb.records.get(snapshotIssued.authorityId)?.exactTarget, 'appointment:123');
  assert.equal((mutableIssueInput as any).exactTarget, 'MUTATED');
  console.log('PASS issue() snapshots input against concurrent mutation');

  let issuePolicyReady!: () => void;
  let allowIssuePolicyToContinue!: () => void;
  const issuePolicyReadyPromise = new Promise<void>((resolve) => { issuePolicyReady = resolve; });
  const issuePolicyContinuePromise = new Promise<void>((resolve) => { allowIssuePolicyToContinue = resolve; });
  let policySawPassport: unknown;
  const nestedDisclosureInput = {
    ...issueInput({ target: 'appointment:123', note: 'deep snapshot' }),
    allowedDisclosures: { passport: true },
  };
  const nestedSnapshotService = new AuthorityService(new MemoryAuthorityDatabase(), {
    authorizeIssue: async (snapshot) => {
      await Promise.resolve();
      issuePolicyReady();
      await issuePolicyContinuePromise;
      policySawPassport = (snapshot.allowedDisclosures as { passport: boolean }).passport;
      return {
        allowed: true,
        policyVersion: 'policy-v1',
        issuedBy: 'server:authority-test',
        approvalRef: 'approval:test-fixture',
        contextBinding: 'context-binding:test-fixture',
      };
    },
    authorizeConsume: async () => ({ allowed: true }),
  });
  const nestedIssuePromise = nestedSnapshotService.issue(nestedDisclosureInput);
  await issuePolicyReadyPromise;
  nestedDisclosureInput.allowedDisclosures.passport = false;
  allowIssuePolicyToContinue();
  const nestedIssued = await nestedIssuePromise;
  assert.equal(policySawPassport, true);
  assert.deepEqual(nestedIssued.allowedDisclosures, { passport: true });
  console.log('PASS issue() deep-snapshots nested input');

  const contextDb = new MemoryAuthorityDatabase();
  const contextInput = issueInput({ target: 'appointment:123', note: 'context snapshot' });
  const contextIssuedByService = new AuthorityService(contextDb, policyProvider());
  const contextIssued = await contextIssuedByService.issue(contextInput);
  const mutableContext = contextFor(contextInput, contextInput.preparePayload);
  let consumePolicyReady!: () => void;
  let allowConsumePolicyToContinue!: () => void;
  const consumePolicyReadyPromise = new Promise<void>((resolve) => { consumePolicyReady = resolve; });
  const consumePolicyContinuePromise = new Promise<void>((resolve) => { allowConsumePolicyToContinue = resolve; });
  let policySawSubjectId: string | undefined;
  const contextSnapshotService = new AuthorityService(contextDb, {
    authorizeIssue: async () => ({
      allowed: true,
      policyVersion: 'policy-v1',
      issuedBy: 'server:authority-test',
      approvalRef: 'approval:test-fixture',
      contextBinding: 'context-binding:test-fixture',
    }),
    authorizeConsume: async (_record, snapshot) => {
      await Promise.resolve();
      consumePolicyReady();
      await consumePolicyContinuePromise;
      policySawSubjectId = snapshot.subjectId;
      return { allowed: true };
    },
  });
  const consumePromise = contextSnapshotService.verifyAndConsume(contextIssued.authorityId, mutableContext);
  await consumePolicyReadyPromise;
  mutableContext.subjectId = 'SAFE';
  allowConsumePolicyToContinue();
  const consumed = await consumePromise;
  assert.equal(policySawSubjectId, contextInput.subjectId);
  assert.equal(consumed.consumed, true);
  assert.equal(consumed.authority?.subjectId, contextInput.subjectId);
  console.log('PASS verifyAndConsume snapshots context against mutation');

  // B5: preparePayload source is read exactly once (hash == payload shown to policy), even with a getter.
  let payloadReads = 0;
  const getterInput = issueInput({ placeholder: true });
  Object.defineProperty(getterInput, 'preparePayload', {
    enumerable: true,
    configurable: true,
    get() { return { amount: (++payloadReads === 1 ? 1_000_000 : 1) }; },
  });
  let b5PolicySawPayload: unknown;
  const b5Service = new AuthorityService(new MemoryAuthorityDatabase(), {
    authorizeIssue: async (snapshot) => {
      b5PolicySawPayload = snapshot.preparePayload;
      return {
        allowed: true,
        policyVersion: 'policy-v1',
        issuedBy: 'server:authority-test',
        approvalRef: 'approval:test-fixture',
        contextBinding: 'context-binding:test-fixture',
      };
    },
    authorizeConsume: async () => ({ allowed: true }),
  });
  const b5Issued = await b5Service.issue(getterInput);
  assert.equal(payloadReads, 1);
  assert.deepEqual(b5PolicySawPayload, { amount: 1_000_000 });
  assert.equal(b5Issued.prepareSha256, prepareHash({ amount: 1_000_000 }));
  console.log('PASS preparePayload is read once; hash matches payload shown to policy');

  const srcRoot = resolve(__dirname, '..', 'src');
  const writer = /\b(?:INSERT\s+INTO|UPDATE)\s+"?(?:AuthorityRecord|AuthorityLedgerEntry)"?\b|\.authority(?:Record|LedgerEntry)\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/i;
  const outOfModuleWriters = sourceFiles(srcRoot)
    .filter((path) => relative(srcRoot, path).split(sep).join('/') !== 'services/authority/AuthorityService.ts')
    .filter((path) => writer.test(readFileSync(path, 'utf8')))
    .map((path) => relative(resolve(__dirname, '..'), path).split(sep).join('/'));
  assert.deepEqual(outOfModuleWriters, [], 'only AuthorityService may write AuthorityRecord or AuthorityLedgerEntry');
  const envDoc = readFileSync(resolve(__dirname, '..', 'docs', 'ops', 'VIONA_P0_AUTHORITY_ENV.md'), 'utf8');
  assert.match(envDoc, /separate database role/i);
  assert.match(envDoc, /planner\/AI/i);
  console.log('PASS static single-writer guard and deploy-role requirement');
  console.log('9 authority core checks passed.');
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
