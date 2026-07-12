/**
 * Pack30D-1 — persistent execution-audit ledger writer tests (mock-only, no real execution).
 *
 * Covers the required test plan from
 * docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md (section 9), to the
 * extent testable without a live database connection:
 *   1. Eligible request, mock invocation requested   -> `executionMockInvoked` event type
 *   2. Eligible request, no mock invocation requested -> `executionPlanBuilt` event type
 *   3. Policy denies (various reasons)                -> `executionBlockedPolicy` /
 *      `executionBlockedOperator` as applicable
 *   4. Idempotency replay                              -> payload records `metadata.replay: true`
 *      rather than a misleading duplicate "fresh" event
 *   5. Audit write failure (simulated)                 -> never throws; typed `ok: false` result
 *   6. No `VionaRequest.status` mutation                -> source scan
 *   7. No real provider call                            -> source scan
 *   8. No new Prisma model / no migration                -> schema.prisma model-block check
 *   9. `tsc --noEmit`                                    -> run separately via `npm run typecheck`
 *  10. Existing Pack30A/Pack30B test scripts             -> run separately (regression)
 *
 * Note on DB scope: `appendVionaExecutionAuditEvent` accepts an injectable Prisma-shaped client
 * (defaulting to the shared `getPrisma()` singleton), so this script exercises the full writer
 * logic — including the simulated-failure path — via a fake, in-memory client, without opening a
 * live database connection. The full integration through `previewVionaExecutionPlanRoute`
 * (which requires a live DB via the existing, unmodified `getVionaRequestById` lookup) is
 * explicitly deferred, mirroring the same boundary Pack30B's own test script drew for
 * `request_not_found` — this is exercised by a future Pack30D-1 staging QA pack instead.
 *
 * Run: npx tsx scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  appendVionaExecutionAuditEvent,
  type AppendVionaExecutionAuditEventInput,
  type VionaExecutionAuditWritePrismaClient,
} from '../src/services/viona/vionaExecutionAuditWriteService';
import {
  buildVionaExecutionAuditPayload,
  buildVionaExecutionPlanPreviewAction,
  resolveVionaExecutionAuditActorRoleLabel,
  resolveVionaExecutionAuditEventType,
} from '../src/services/viona/vionaExecutionPlanRouteService';
import type { BuildVionaExecutionPlanPreviewActionInput } from '../src/services/viona/vionaExecutionPlanRouteService';
import { vionaRequestAuditEventTypes } from '../src/domain/requests/vionaRequestAuditEventTypes';

const PACK30D1_TOUCHED_FILES = [
  '../src/domain/requests/vionaRequestAuditEventTypes.ts',
  '../src/services/viona/vionaExecutionAuditWriteService.ts',
  '../src/services/viona/vionaExecutionPlanRouteService.ts',
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

function assertNoneMatch(files: readonly string[], patterns: readonly RegExp[], label: string): void {
  for (const file of files) {
    const source = readSourceNoComments(file);
    for (const pattern of patterns) {
      assert(!pattern.test(source), `${label}: ${file} must not match forbidden pattern ${pattern}`);
    }
  }
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
 * Minimal in-memory fake satisfying the writer's injectable client shape. Cast via `unknown`
 * (never `any`) since a fake test double only needs the one method the writer actually calls —
 * matching the same narrow-surface intent as the production `VionaExecutionAuditWritePrismaClient`
 * type itself.
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
        throw new Error('simulated_audit_write_failure');
      }
      counter += 1;
      const row: FakeAuditRow = {
        id: `fake-audit-${counter}`,
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

const BASE_ACTION_INPUT: BuildVionaExecutionPlanPreviewActionInput = {
  requestId: 'req-pack30d1-test',
  requestStatus: 'triage',
  actionId: 'request.assign',
  requestSafetyLabels: [],
  operatorApprovalGranted: true,
  userConsentGranted: true,
  idempotencyKey: null,
  clientCorrelationId: 'corr-pack30d1-test',
  invokeMockAdapter: false,
};

function buildAction(overrides: Partial<BuildVionaExecutionPlanPreviewActionInput> = {}) {
  return buildVionaExecutionPlanPreviewAction({ ...BASE_ACTION_INPUT, ...overrides });
}

function baseAppendInput(
  overrides: Partial<AppendVionaExecutionAuditEventInput> = {},
): AppendVionaExecutionAuditEventInput {
  return {
    requestId: 'req-pack30d1-test',
    eventType: 'executionPlanBuilt',
    actorUserId: 'user-pack30d1-test',
    actorRoleLabel: 'requester',
    message: 'test',
    payloadJson: { note: 'test' },
    ...overrides,
  };
}

/** New event types (§6.2) must exist, without removing any pre-existing event type. */
function testNewEventTypesRegisteredWithoutRemovingExisting(): void {
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
  ] as const;
  const newTypes = [
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

  for (const type of [...preExisting, ...newTypes]) {
    assert(
      (vionaRequestAuditEventTypes as readonly string[]).includes(type),
      `vionaRequestAuditEventTypes must include ${type}`,
    );
  }
  // Pack30D-2 (see scripts/test-viona-pack30d2-state-machine-audit-hooks.ts) deliberately adds
  // exactly one more value, `stateTransition`, on top of this Pack30D-1 set. Pack31 (see
  // scripts/test-viona-pack31-financial-escrow.ts) adds exactly three more —
  // `escrowHoldPlaced`/`escrowSettled`/`escrowRefunded`. Both are accounted for here as fixed,
  // documented additions rather than an open-ended tolerance, so this assertion still catches any
  // *other* accidental extra/removed value.
  const pack30d2AdditionsCount = 1;
  const pack31AdditionsCount = 3;
  const pack32AdditionsCount = 3;
  assert(
    vionaRequestAuditEventTypes.length ===
      preExisting.length + newTypes.length + pack30d2AdditionsCount + pack31AdditionsCount + pack32AdditionsCount,
    'vionaRequestAuditEventTypes must contain exactly the pre-existing + Pack30D-1 + Pack30D-2 + Pack31 + Pack32 types (no accidental extra/removed values)',
  );
}

/** Test 1: eligible + mock invocation requested -> `executionMockInvoked` event, row created. */
async function testEligibleMockInvocationCreatesExecutionMockInvokedRow(): Promise<void> {
  const action = buildAction({ invokeMockAdapter: true });
  assert(action.plan.allowed, 'baseline eligible plan must be allowed');
  assert(action.mockAdapterCalled === true, 'mock adapter must have been called');

  const eventType = resolveVionaExecutionAuditEventType(action);
  assert(eventType === 'executionMockInvoked', `expected executionMockInvoked, got ${eventType}`);

  const { client, rows } = createFakeAuditPrismaClient();
  const result = await appendVionaExecutionAuditEvent(
    baseAppendInput({ eventType, payloadJson: buildVionaExecutionAuditPayload(action) }),
    client,
  );

  assert(result.ok === true, 'audit write must succeed against a healthy fake client');
  assert(rows.length === 1, 'exactly one VionaRequestAuditEvent row must be created');
  assert(rows[0]!.eventType === 'executionMockInvoked', 'row eventType must be executionMockInvoked');
}

/** Test 2: eligible, no mock invocation requested (mock_ready path) -> `executionPlanBuilt` event. */
async function testEligibleNoMockInvocationCreatesExecutionPlanBuiltRow(): Promise<void> {
  const action = buildAction({ invokeMockAdapter: false });
  assert(action.plan.allowed, 'baseline eligible plan must be allowed');
  assert(action.plan.state === 'mock_ready', 'plan must be in mock_ready state');
  assert(action.mockAdapterCalled === false, 'mock adapter must not have been called');

  const eventType = resolveVionaExecutionAuditEventType(action);
  assert(eventType === 'executionPlanBuilt', `expected executionPlanBuilt, got ${eventType}`);

  const { client, rows } = createFakeAuditPrismaClient();
  const result = await appendVionaExecutionAuditEvent(
    baseAppendInput({ eventType, payloadJson: buildVionaExecutionAuditPayload(action) }),
    client,
  );

  assert(result.ok === true, 'audit write must succeed against a healthy fake client');
  assert(rows.length === 1, 'exactly one VionaRequestAuditEvent row must be created');
  assert(rows[0]!.eventType === 'executionPlanBuilt', 'row eventType must be executionPlanBuilt');
}

/** Test 3: policy denial -> `executionBlockedOperator` for missing operator approval, else `executionBlockedPolicy`. */
async function testPolicyDenialMapsToBlockedPolicyOrBlockedOperator(): Promise<void> {
  const operatorDenied = buildAction({ operatorApprovalGranted: false });
  assert(!operatorDenied.plan.allowed, 'expected denial for missing operator approval');
  assert(
    resolveVionaExecutionAuditEventType(operatorDenied) === 'executionBlockedOperator',
    'missing operator approval must map to executionBlockedOperator',
  );

  const otherDenialCases: Array<Partial<BuildVionaExecutionPlanPreviewActionInput>> = [
    { requestStatus: 'draft' },
    { requestSafetyLabels: ['hold'] },
    { userConsentGranted: false },
  ];

  for (const overrides of otherDenialCases) {
    const denied = buildAction(overrides);
    assert(!denied.plan.allowed, `expected denial for overrides ${JSON.stringify(overrides)}`);
    assert(
      resolveVionaExecutionAuditEventType(denied) === 'executionBlockedPolicy',
      `expected executionBlockedPolicy for overrides ${JSON.stringify(overrides)}, got ${resolveVionaExecutionAuditEventType(denied)}`,
    );
  }

  const { client, rows } = createFakeAuditPrismaClient();
  const eventType = resolveVionaExecutionAuditEventType(operatorDenied);
  const result = await appendVionaExecutionAuditEvent(
    baseAppendInput({ eventType, payloadJson: buildVionaExecutionAuditPayload(operatorDenied) }),
    client,
  );
  assert(result.ok === true, 'audit write for a denial event must still succeed');
  assert(rows[0]!.eventType === 'executionBlockedOperator', 'row eventType must be executionBlockedOperator');
}

/** Test 4: idempotency replay -> payload records `metadata.replay: true`, same eventType as first call. */
function testIdempotencyReplayRecordsReplayMetadata(): void {
  const key = `idem-pack30d1-${Date.now()}`;
  const first = buildAction({ idempotencyKey: key, invokeMockAdapter: true });
  const second = buildAction({ idempotencyKey: key, invokeMockAdapter: true });

  assert(first.mockResult != null && first.mockResult.replay === false, 'first invocation must not be a replay');
  assert(second.mockResult != null && second.mockResult.replay === true, 'second invocation must be a replay');

  assert(
    resolveVionaExecutionAuditEventType(first) === 'executionMockInvoked',
    'first invocation eventType must be executionMockInvoked',
  );
  assert(
    resolveVionaExecutionAuditEventType(second) === 'executionMockInvoked',
    'replay must reuse the same eventType, not a distinct "fresh" event',
  );

  const firstPayload = buildVionaExecutionAuditPayload(first) as { metadata: { replay: boolean } };
  const secondPayload = buildVionaExecutionAuditPayload(second) as { metadata: { replay: boolean } };
  assert(firstPayload.metadata.replay === false, 'first payload metadata.replay must be false');
  assert(secondPayload.metadata.replay === true, 'replay payload metadata.replay must be true');
}

/** Test 5: audit write failure (simulated) -> never throws; returns a typed ok:false result. */
async function testAuditWriteFailureNeverThrows(): Promise<void> {
  const { client } = createFakeAuditPrismaClient({ shouldFail: true });

  let threw = false;
  let result: Awaited<ReturnType<typeof appendVionaExecutionAuditEvent>> | undefined;
  try {
    result = await appendVionaExecutionAuditEvent(baseAppendInput(), client);
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

/** Test 6: no `VionaRequest.status` mutation — source scan of the touched Pack30D-1 files. */
function testNoStatusMutation(): void {
  assertNoneMatch(
    PACK30D1_TOUCHED_FILES,
    [/vionaRequest\.update/, /vionaRequest\.updateMany/, /UPDATE\s+"?VionaRequest"?\s+SET/i],
    'no VionaRequest.status mutation',
  );

  const action = buildAction();
  assert(Object.isFrozen(action.plan), 'plan must remain frozen (Pack30A builder unmodified)');
}

/** Test 7: no real provider call — source scan of the touched Pack30D-1 files. */
function testNoRealProviderCall(): void {
  assertNoneMatch(
    PACK30D1_TOUCHED_FILES,
    [/\bfetch\s*\(/, /\baxios\b/i, /node-fetch/i, /\bhttp\.request/i, /\bhttps\.request/i, /XMLHttpRequest/i],
    'no real provider / network calls',
  );
}

/** Test 7b: writer exposes exactly one write method (append-only, no update/delete method). */
function testWriterExposesAppendOnly(): void {
  const source = readSourceNoComments('../src/services/viona/vionaExecutionAuditWriteService.ts');
  assert(/export async function appendVionaExecutionAuditEvent/.test(source), 'append method must be exported');
  assert(!/export\s+(async\s+)?function\s+\w*update/i.test(source), 'no update method may be exported');
  assert(!/export\s+(async\s+)?function\s+\w*delete/i.test(source), 'no delete method may be exported');
  assert(!/\.update\s*\(/.test(source), 'writer must not call .update(');
  assert(!/\.updateMany\s*\(/.test(source), 'writer must not call .updateMany(');
  assert(!/\.delete\s*\(/.test(source), 'writer must not call .delete(');
  assert(!/\.deleteMany\s*\(/.test(source), 'writer must not call .deleteMany(');
}

/** Test 8: no new Prisma model / no migration — the existing model block must be unchanged. */
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
    'VionaRequestAuditEvent model block must be byte-for-byte unchanged (no schema/migration in Pack30D-1)',
  );
  assert(
    !/model\s+VionaExecutionAudit/i.test(schema),
    'no new audit-ledger-specific Prisma model may be introduced in Pack30D-1',
  );
}

/** Actor role label resolution — pure helper, no DB access. */
function testActorRoleLabelResolution(): void {
  const request = { requesterUserId: 'user-req', ownerUserId: 'user-owner' };
  assert(
    resolveVionaExecutionAuditActorRoleLabel(request, 'user-req') === 'requester',
    'requester must resolve to "requester"',
  );
  assert(
    resolveVionaExecutionAuditActorRoleLabel(request, 'user-owner') === 'owner',
    'owner must resolve to "owner"',
  );
  assert(
    resolveVionaExecutionAuditActorRoleLabel(request, 'user-other') === 'participant',
    'any other actor must resolve to "participant"',
  );
}

/** Response safety-flag contract on the underlying Pack30A/B action must remain unchanged. */
function testResponseSafetyFlagsUnchangedByAuditWrite(): void {
  const action = buildAction({ invokeMockAdapter: true });
  assert(action.operatorApprovalRequired === true, 'operatorApprovalRequired must remain true');
  assert(action.externalExecutionBlocked === true, 'externalExecutionBlocked must remain true');
  assert(
    action.persistentAuditWritten === false,
    'the Pack30A/B action-meta flag itself remains false — the durable write is a side channel documented separately, not a response-shape change',
  );
}

async function main(): Promise<void> {
  testNewEventTypesRegisteredWithoutRemovingExisting();
  await testEligibleMockInvocationCreatesExecutionMockInvokedRow();
  await testEligibleNoMockInvocationCreatesExecutionPlanBuiltRow();
  await testPolicyDenialMapsToBlockedPolicyOrBlockedOperator();
  testIdempotencyReplayRecordsReplayMetadata();
  await testAuditWriteFailureNeverThrows();
  testNoStatusMutation();
  testNoRealProviderCall();
  testWriterExposesAppendOnly();
  testNoNewPrismaModelOrMigration();
  testActorRoleLabelResolution();
  testResponseSafetyFlagsUnchangedByAuditWrite();
  console.log('PASS Pack30D-1 execution audit ledger writer tests (12/12)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
