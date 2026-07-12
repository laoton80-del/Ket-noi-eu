/**
 * Pack30D-2 — audit-ledger hooks injected into the request status state machine (mock-only, no
 * real execution). Operator phrase: `APPROVE_PACK30D_AUDIT_LEDGER_HOOKS_IMPLEMENTATION`.
 *
 * Scope (this increment only):
 *   - `src/domain/requests/vionaRequestAuditEventTypes.ts` (MODIFY) — adds one new event type,
 *     `stateTransition`, without removing any pre-existing value (9 original + 9 Pack30D-1 +
 *     1 Pack30D-2 = 19 total).
 *   - `src/services/viona/vionaRequestStatusActionService.ts` (MODIFY) — after the existing,
 *     unmodified Pack25 `$transaction` (status update + `action.status` audit row) commits, calls
 *     the existing Pack30D-1 writer (`appendVionaExecutionAuditEvent`, PR #296) with a new,
 *     pure-built `stateTransition` event carrying `{ fromStatus, toStatus, statusEventId,
 *     idempotencyKey, clientCorrelationId }`.
 *
 * This script covers, to the extent testable without a live database connection:
 *   1. `stateTransition` event type registered without removing any existing type.
 *   2. Pure builder produces the correct event shape (eventType, payload fields).
 *   3. Writing that event via the existing writer against a fake client succeeds.
 *   4. A simulated write failure never throws (same non-blocking contract as Pack30D-1).
 *   5. No real provider / network call in the touched files.
 *   6. The pre-existing single `VionaRequest` status-mutation call site is unchanged in count —
 *      this hook adds no new status-mutation call site anywhere.
 *   7. The Pack25 narrow allowed-transition scope (`submitted` -> `triage` only) is unchanged —
 *      this hook does not unlock any additional transition.
 *   8. The pre-existing `action.status` audit event type/row logic is unchanged.
 *   9. No new Prisma model / no migration (existing `VionaRequestAuditEvent` table reused).
 *  10. The new hook call is wired strictly *after* the existing transaction's commit-or-abort
 *      check in source order (never inside the transaction, never before it).
 *
 * `tsc --noEmit` (via `npm run typecheck`) and the full regression suite (Pack30A/30B/30D-1
 * scripts) are run separately, not duplicated here.
 *
 * Run: npx tsx scripts/test-viona-pack30d2-state-machine-audit-hooks.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  appendVionaExecutionAuditEvent,
  type VionaExecutionAuditWritePrismaClient,
} from '../src/services/viona/vionaExecutionAuditWriteService';
import {
  buildVionaStateTransitionAuditEventInput,
  VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE,
} from '../src/services/viona/vionaRequestStatusActionService';
import { VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION } from '../src/services/viona/vionaRequestStatusActionDto';
import { vionaRequestAuditEventTypes } from '../src/domain/requests/vionaRequestAuditEventTypes';

const PACK30D2_TOUCHED_FILES = [
  '../src/domain/requests/vionaRequestAuditEventTypes.ts',
  '../src/services/viona/vionaRequestStatusActionService.ts',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/** Reads source with comments stripped so doc-comment mentions of forbidden terms don't false-positive. */
function readSourceNoComments(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function readSourceRaw(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function assertNoneMatch(files: readonly string[], patterns: readonly RegExp[], label: string): void {
  for (const file of files) {
    const source = readSourceNoComments(file);
    for (const pattern of patterns) {
      assert(!pattern.test(source), `${label}: ${file} must not match forbidden pattern ${pattern}`);
    }
  }
}

function countOccurrences(source: string, pattern: RegExp): number {
  const matches = source.match(new RegExp(pattern, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`));
  return matches == null ? 0 : matches.length;
}

type FakeAuditRow = Readonly<{
  id: string;
  requestId: string;
  eventType: string;
  actorUserId: string | null;
  actorRoleLabel: string | null;
  message: string | null;
  payloadJson: unknown;
}>;

/**
 * Minimal in-memory fake satisfying the writer's injectable client shape (same pattern as the
 * Pack30D-1 test script) — never a live database connection.
 */
function createFakeAuditPrismaClient(options: { shouldFail?: boolean } = {}): {
  client: VionaExecutionAuditWritePrismaClient;
  rows: FakeAuditRow[];
} {
  const rows: FakeAuditRow[] = [];
  let counter = 0;

  const fakeDelegate = {
    create: async (args: {
      data: {
        requestId: string;
        eventType: string;
        actorUserId?: string | null;
        actorRoleLabel?: string | null;
        message?: string | null;
        payloadJson?: unknown;
      };
    }): Promise<{ id: string }> => {
      if (options.shouldFail === true) {
        throw new Error('simulated_state_transition_audit_write_failure');
      }
      counter += 1;
      const row: FakeAuditRow = {
        id: `fake-state-transition-audit-${counter}`,
        requestId: args.data.requestId,
        eventType: args.data.eventType,
        actorUserId: args.data.actorUserId ?? null,
        actorRoleLabel: args.data.actorRoleLabel ?? null,
        message: args.data.message ?? null,
        payloadJson: args.data.payloadJson ?? null,
      };
      rows.push(row);
      return { id: row.id };
    },
  };

  const client = { vionaRequestAuditEvent: fakeDelegate } as unknown as VionaExecutionAuditWritePrismaClient;

  return { client, rows };
}

/** Test 1: `stateTransition` registered, all 18 pre-existing values preserved (9 + 9 + 1 = 19). */
function testStateTransitionEventTypeRegisteredWithoutRemovingExisting(): void {
  const preExisting = [
    'requestRead',
    'requestSubmitted',
    'statusTransitionProposed',
    'humanConfirmationRequested',
    'humanConfirmationRecorded',
    'partnerResponseRecorded',
    'terminalStateMarked',
    'safetyGateBlocked',
    'auditRead',
    'executionPlanBuilt',
    'executionMockInvoked',
    'executionRealAttempted',
    'executionRealSucceeded',
    'executionRealFailedBounded',
    'executionBlockedPolicy',
    'executionBlockedOperator',
    'executionRolledBack',
    'executionKilled',
  ] as const;

  for (const type of preExisting) {
    assert(
      (vionaRequestAuditEventTypes as readonly string[]).includes(type),
      `vionaRequestAuditEventTypes must still include pre-existing type ${type}`,
    );
  }

  assert(
    (vionaRequestAuditEventTypes as readonly string[]).includes('stateTransition'),
    'vionaRequestAuditEventTypes must include the new stateTransition type',
  );

  assert(
    vionaRequestAuditEventTypes.length === preExisting.length + 1,
    `vionaRequestAuditEventTypes must contain exactly the ${preExisting.length} pre-existing types plus the new stateTransition type (no accidental extra/removed values); got ${vionaRequestAuditEventTypes.length}`,
  );
}

/** Test 2: pure builder produces the correct eventType and payload shape. */
function testBuildVionaStateTransitionAuditEventInputShape(): void {
  const built = buildVionaStateTransitionAuditEventInput({
    requestId: 'req-pack30d2-test',
    fromStatus: 'submitted',
    toStatus: 'triage',
    actorUserId: 'user-pack30d2-test',
    actorRoleLabel: 'owner',
    statusEventId: 'status-event-1',
    idempotencyKey: 'idem-key-1',
    clientCorrelationId: 'corr-1',
  });

  assert(built.requestId === 'req-pack30d2-test', 'requestId must pass through unchanged');
  assert(built.eventType === 'stateTransition', 'eventType must be stateTransition');
  assert(built.actorUserId === 'user-pack30d2-test', 'actorUserId must pass through unchanged');
  assert(built.actorRoleLabel === 'owner', 'actorRoleLabel must pass through unchanged');

  const payload = built.payloadJson as Record<string, unknown>;
  assert(payload.fromStatus === 'submitted', 'payload.fromStatus must equal the from state');
  assert(payload.toStatus === 'triage', 'payload.toStatus must equal the to state');
  assert(payload.statusEventId === 'status-event-1', 'payload.statusEventId must pass through');
  assert(payload.idempotencyKey === 'idem-key-1', 'payload.idempotencyKey must pass through when provided');
  assert(payload.clientCorrelationId === 'corr-1', 'payload.clientCorrelationId must pass through when provided');
}

/** Test 2b: optional fields default to null in the payload when omitted (never `undefined` leakage). */
function testBuildVionaStateTransitionAuditEventInputOptionalDefaults(): void {
  const built = buildVionaStateTransitionAuditEventInput({
    requestId: 'req-pack30d2-test-2',
    fromStatus: 'submitted',
    toStatus: 'triage',
    actorUserId: 'user-pack30d2-test-2',
    actorRoleLabel: 'owner',
    statusEventId: 'status-event-2',
  });

  const payload = built.payloadJson as Record<string, unknown>;
  assert(payload.idempotencyKey === null, 'payload.idempotencyKey must default to null when omitted');
  assert(payload.clientCorrelationId === null, 'payload.clientCorrelationId must default to null when omitted');
}

/** Test 3: writing the built event via the existing writer against a fake client succeeds. */
async function testAppendStateTransitionAuditEventSucceedsAgainstFakeClient(): Promise<void> {
  const input = buildVionaStateTransitionAuditEventInput({
    requestId: 'req-pack30d2-test-3',
    fromStatus: 'submitted',
    toStatus: 'triage',
    actorUserId: 'user-pack30d2-test-3',
    actorRoleLabel: 'owner',
    statusEventId: 'status-event-3',
  });

  const { client, rows } = createFakeAuditPrismaClient();
  const result = await appendVionaExecutionAuditEvent(input, client);

  assert(result.ok === true, 'audit write must succeed against a healthy fake client');
  assert(rows.length === 1, 'exactly one VionaRequestAuditEvent row must be created');
  assert(rows[0]!.eventType === 'stateTransition', 'row eventType must be stateTransition');
  assert(rows[0]!.requestId === 'req-pack30d2-test-3', 'row requestId must match the input');
}

/** Test 4: a simulated write failure never throws — same non-blocking contract as Pack30D-1. */
async function testAppendStateTransitionAuditEventFailureNeverThrows(): Promise<void> {
  const input = buildVionaStateTransitionAuditEventInput({
    requestId: 'req-pack30d2-test-4',
    fromStatus: 'submitted',
    toStatus: 'triage',
    actorUserId: 'user-pack30d2-test-4',
    actorRoleLabel: 'owner',
    statusEventId: 'status-event-4',
  });

  const { client } = createFakeAuditPrismaClient({ shouldFail: true });

  let threw = false;
  let result: Awaited<ReturnType<typeof appendVionaExecutionAuditEvent>> | undefined;
  try {
    result = await appendVionaExecutionAuditEvent(input, client);
  } catch {
    threw = true;
  }

  assert(threw === false, 'appendVionaExecutionAuditEvent must never throw, even on a simulated failure');
  assert(result != null && result.ok === false, 'result must be a typed ok:false failure');
  assert(
    result != null && result.ok === false && result.reason === 'audit_write_failed',
    'failure reason must be audit_write_failed',
  );
}

/** Test 5: no real provider / network call in the touched files. */
function testNoRealProviderCall(): void {
  assertNoneMatch(
    PACK30D2_TOUCHED_FILES,
    [/\bfetch\s*\(/, /\baxios\b/i, /node-fetch/i, /\bhttp\.request/i, /\bhttps\.request/i, /XMLHttpRequest/i],
    'no real provider / network calls',
  );
}

/** Test 6: the pre-existing single VionaRequest status-mutation call site is unchanged in count. */
function testExistingStatusMutationSingleCallSiteUnchanged(): void {
  const source = readSourceNoComments('../src/services/viona/vionaRequestStatusActionService.ts');
  const updateManyCount = countOccurrences(source, /\.updateMany\s*\(/g);
  const updateCount = countOccurrences(source, /\bvionaRequest\.update\s*\(/g);

  assert(
    updateManyCount === 1,
    `expected exactly 1 pre-existing .updateMany( call site (the Pack25 state-machine write), found ${updateManyCount}`,
  );
  assert(updateCount === 0, 'no direct vionaRequest.update( call site may exist (only the pre-existing updateMany)');
}

/** Test 7: the Pack25 narrow allowed-transition scope is unchanged — this hook unlocks nothing new. */
function testPack25AllowedTransitionScopeUnchanged(): void {
  assert(
    VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.from === 'submitted',
    'allowed transition "from" must remain submitted (unchanged by this hook injection)',
  );
  assert(
    VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION.to === 'triage',
    'allowed transition "to" must remain triage (unchanged by this hook injection)',
  );
}

/** Test 8: the pre-existing `action.status` audit event type constant is unchanged. */
function testExistingActionStatusAuditEventTypeUnchanged(): void {
  assert(
    VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE === 'action.status',
    'VIONA_REQUEST_STATUS_AUDIT_EVENT_TYPE must remain "action.status" (pre-existing Pack25 event type, untouched)',
  );
}

/** Test 9: no new Prisma model / no migration — the existing model block must be unchanged. */
function testNoNewPrismaModelOrMigration(): void {
  const schema = fs
    .readFileSync(path.resolve(__dirname, '../prisma/schema.prisma'), 'utf8')
    .replace(/\r\n/g, '\n');
  const expectedModelBlock = [
    'model VionaRequestAuditEvent {',
    '  id             String   @id @default(uuid())',
    '  requestId      String',
    '  eventType      String',
    '  actorUserId    String?',
    '  actorRoleLabel String?',
    '  message        String?',
    '  payloadJson    Json?',
    '  createdAt      DateTime @default(now())',
  ].join('\n');

  assert(
    schema.includes(expectedModelBlock),
    'VionaRequestAuditEvent model block must be byte-for-byte unchanged (no schema/migration in Pack30D-2)',
  );
}

/**
 * Test 10: the new hook call must be wired strictly after the existing transaction's
 * commit-or-abort check (`if (transition == null)`), never inside the transaction callback and
 * never before it, per the module's own documented ordering.
 */
function testHookWiredAfterTransactionCommitInSourceOrder(): void {
  const source = readSourceRaw('../src/services/viona/vionaRequestStatusActionService.ts');

  const transactionStartMatch = /\$transaction\s*\(\s*async\s*\(\s*tx\s*\)\s*=>/.exec(source);
  const transactionStartIdx = transactionStartMatch?.index ?? -1;
  const transactionEndMarkerIdx = source.indexOf('if (transition == null) {', transactionStartIdx);
  const hookCallMatch = /appendVionaExecutionAuditEvent\s*\(\s*buildVionaStateTransitionAuditEventInput\s*\(/.exec(
    source,
  );
  const hookCallIdx = hookCallMatch?.index ?? -1;

  assert(transactionStartIdx !== -1, 'expected to find the existing $transaction call');
  assert(transactionEndMarkerIdx !== -1, 'expected to find the existing transition == null guard after the transaction');
  assert(hookCallIdx !== -1, 'expected to find the new hook call site');
  assert(
    hookCallIdx > transactionEndMarkerIdx,
    'the new stateTransition hook call must appear after the transition == null guard (i.e. after the transaction has committed), not inside the transaction and not before it',
  );
}

async function main(): Promise<void> {
  testStateTransitionEventTypeRegisteredWithoutRemovingExisting();
  testBuildVionaStateTransitionAuditEventInputShape();
  testBuildVionaStateTransitionAuditEventInputOptionalDefaults();
  await testAppendStateTransitionAuditEventSucceedsAgainstFakeClient();
  await testAppendStateTransitionAuditEventFailureNeverThrows();
  testNoRealProviderCall();
  testExistingStatusMutationSingleCallSiteUnchanged();
  testPack25AllowedTransitionScopeUnchanged();
  testExistingActionStatusAuditEventTypeUnchanged();
  testNoNewPrismaModelOrMigration();
  testHookWiredAfterTransactionCommitInSourceOrder();
  console.log('PASS Pack30D-2 state machine audit hooks tests (11/11)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
