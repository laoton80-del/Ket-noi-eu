/**
 * Pack30D-3 — read-only frontend Audit Trail Timeline for the VionaRequest detail screen
 * (mock-only, no writes). Operator phrase:
 * `APPROVE_PACK30D_AUDIT_LEDGER_FRONTEND_UI_IMPLEMENTATION`.
 *
 * Scope (this increment only):
 *   - `src/components/viona/requests/vionaRequestAuditTrailTimelineDisplay.ts` (NEW) — pure,
 *     newest-first mapping of the existing `detail.auditEvents` array (already returned by the
 *     existing, unmodified `GET /api/viona/requests/:id` endpoint) into UI-ready rows.
 *   - `src/components/viona/requests/VionaRequestAuditTrailTimeline.tsx` (NEW) — presentational,
 *     read-only React Native component rendering those rows. No write affordance of any kind.
 *   - `src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx` (MODIFY) — adds one new
 *     "Audit trail" `<Section>` wired to the new component, alongside the pre-existing "Timeline"
 *     section (unchanged).
 *   - `src/components/viona/requests/index.ts` (MODIFY) — adds the new component to the barrel
 *     export, following the file's existing pattern exactly.
 *
 * No new API endpoint was added: the existing detail endpoint already returns the full audit-event
 * ledger for the request; this increment only adds a dedicated read-only rendering of that
 * already-authorized, already-fetched data.
 *
 * This script covers, to the extent testable without a running Expo app / device simulator:
 *   1. Newest-first sort order (descending `createdAt`).
 *   2. Stable tie-break sort by `id` when `createdAt` values are identical.
 *   3. Pure function — never mutates the input array.
 *   4. `stateTransition` (Pack30D-2) payload shape (`fromStatus`/`toStatus`) is recognized.
 *   5. `action.status` (Pack25) payload shape (`fromStatus`/`targetStatus`) is recognized.
 *   6. Unknown event types fall back to their raw `eventType` string (never throws).
 *   7. Malformed/missing `payloadJson` never throws and yields `stateChangeLabel: null`.
 *   8. `actorLabel` falls back to `'System'` when `actorRoleLabel` is null/empty.
 *   9. No real provider / network call in any of the new/modified files.
 *  10. No write/action-service import in the new display or component file (read-only boundary).
 *  11. No interactive/editable control (`TextInput`, `Pressable`, `TouchableOpacity`, `Button`,
 *      `onPress`) in the new component (pure read-only rendering).
 *  12. `prisma/schema.prisma`'s `VionaRequestAuditEvent` model block is byte-for-byte unchanged.
 *
 * `tsc --noEmit` (via `npm run typecheck`) and `npm run lint` are run separately, not duplicated
 * here.
 *
 * Run: npx tsx scripts/test-viona-pack30d3-frontend-audit-trail-timeline.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  buildVionaRequestAuditTrailTimelineItems,
  readVionaAuditTrailStateChange,
  resolveVionaAuditTrailEventTypeLabel,
} from '../src/components/viona/requests/vionaRequestAuditTrailTimelineDisplay';
import type { VionaRequestAuditEvent } from '../src/services/vionaRequestApi';

const PACK30D3_NEW_FILES = [
  '../src/components/viona/requests/vionaRequestAuditTrailTimelineDisplay.ts',
  '../src/components/viona/requests/VionaRequestAuditTrailTimeline.tsx',
] as const;

const PACK30D3_TOUCHED_FILES = [
  ...PACK30D3_NEW_FILES,
  '../src/components/viona/requests/VionaRequestLiveDetailReadOnly.tsx',
  '../src/components/viona/requests/index.ts',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

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

function makeAuditEvent(overrides: Partial<VionaRequestAuditEvent>): VionaRequestAuditEvent {
  return {
    id: 'audit-1',
    eventType: 'requestSubmitted',
    actorUserId: null,
    actorRoleLabel: null,
    message: null,
    payloadJson: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Test 1 + 3: newest-first sort order, and the input array is never mutated. */
function testNewestFirstSortOrderAndNoMutation(): void {
  const input: readonly VionaRequestAuditEvent[] = [
    makeAuditEvent({ id: 'a', createdAt: '2026-01-01T00:00:00.000Z' }),
    makeAuditEvent({ id: 'b', createdAt: '2026-01-03T00:00:00.000Z' }),
    makeAuditEvent({ id: 'c', createdAt: '2026-01-02T00:00:00.000Z' }),
  ];
  const inputSnapshot = [...input];

  const items = buildVionaRequestAuditTrailTimelineItems(input);

  assert(items.length === 3, 'must return exactly 3 items');
  assert(items[0]!.id === 'b', 'newest event (2026-01-03) must be first');
  assert(items[1]!.id === 'c', 'middle event (2026-01-02) must be second');
  assert(items[2]!.id === 'a', 'oldest event (2026-01-01) must be last');

  assert(
    input.length === inputSnapshot.length && input.every((e, i) => e.id === inputSnapshot[i]!.id),
    'input array order must never be mutated by the pure builder',
  );
}

/** Test 2: stable tie-break sort by id (descending) when createdAt values are identical. */
function testTieBreakSortById(): void {
  const input: readonly VionaRequestAuditEvent[] = [
    makeAuditEvent({ id: 'a', createdAt: '2026-01-01T00:00:00.000Z' }),
    makeAuditEvent({ id: 'z', createdAt: '2026-01-01T00:00:00.000Z' }),
    makeAuditEvent({ id: 'm', createdAt: '2026-01-01T00:00:00.000Z' }),
  ];

  const items = buildVionaRequestAuditTrailTimelineItems(input);

  assert(
    items.map((i) => i.id).join(',') === 'z,m,a',
    `expected deterministic descending-id tie-break order z,m,a; got ${items.map((i) => i.id).join(',')}`,
  );
}

/** Test 4: Pack30D-2 `stateTransition` payload shape (`fromStatus`/`toStatus`) is recognized. */
function testStateTransitionPayloadRecognized(): void {
  const label = readVionaAuditTrailStateChange({
    fromStatus: 'submitted',
    toStatus: 'triage',
    statusEventId: 'se-1',
  });
  assert(label === 'submitted → triage', `expected "submitted → triage", got ${String(label)}`);

  const eventTypeLabel = resolveVionaAuditTrailEventTypeLabel('stateTransition');
  assert(
    eventTypeLabel === 'Audit ledger hook (state machine)',
    `expected known label for stateTransition, got "${eventTypeLabel}"`,
  );
}

/** Test 5: Pack25 `action.status` payload shape (`fromStatus`/`targetStatus`) is recognized. */
function testActionStatusPayloadRecognized(): void {
  const label = readVionaAuditTrailStateChange({
    fromStatus: 'submitted',
    targetStatus: 'triage',
  });
  assert(label === 'submitted → triage', `expected "submitted → triage", got ${String(label)}`);

  const eventTypeLabel = resolveVionaAuditTrailEventTypeLabel('action.status');
  assert(
    eventTypeLabel === 'Status transition',
    `expected known label for action.status, got "${eventTypeLabel}"`,
  );
}

/** Test 6: unknown event types fall back to their raw string; never throws. */
function testUnknownEventTypeFallsBackToRawString(): void {
  const label = resolveVionaAuditTrailEventTypeLabel('some.future.unregistered.type');
  assert(
    label === 'some.future.unregistered.type',
    'unknown event type must fall back to the raw eventType string',
  );
}

/** Test 7: malformed/missing payloadJson never throws and yields stateChangeLabel: null. */
function testMalformedPayloadNeverThrows(): void {
  const cases: readonly unknown[] = [null, undefined, 'a string', 42, ['array'], {}, { fromStatus: 'x' }];
  for (const payload of cases) {
    let threw = false;
    let result: string | null = null;
    try {
      result = readVionaAuditTrailStateChange(payload);
    } catch {
      threw = true;
    }
    assert(threw === false, `readVionaAuditTrailStateChange must never throw for payload ${JSON.stringify(payload)}`);
    assert(result === null, `expected null stateChangeLabel for payload ${JSON.stringify(payload)}`);
  }
}

/** Test 8: actorLabel falls back to 'System' when actorRoleLabel is null/empty/whitespace. */
function testActorLabelFallsBackToSystem(): void {
  const items = buildVionaRequestAuditTrailTimelineItems([
    makeAuditEvent({ id: 'a', actorRoleLabel: null }),
    makeAuditEvent({ id: 'b', actorRoleLabel: '' }),
    makeAuditEvent({ id: 'c', actorRoleLabel: '   ' }),
    makeAuditEvent({ id: 'd', actorRoleLabel: 'owner' }),
  ]);

  const byId = new Map(items.map((i) => [i.id, i] as const));
  assert(byId.get('a')!.actorLabel === 'System', 'null actorRoleLabel must map to System');
  assert(byId.get('b')!.actorLabel === 'System', 'empty actorRoleLabel must map to System');
  assert(byId.get('c')!.actorLabel === 'System', 'whitespace-only actorRoleLabel must map to System');
  assert(byId.get('d')!.actorLabel === 'owner', 'non-empty actorRoleLabel must pass through unchanged');
}

/** Test 9: no real provider / network call in any new or modified file. */
function testNoRealProviderCall(): void {
  assertNoneMatch(
    PACK30D3_TOUCHED_FILES,
    [/\bfetch\s*\(/, /\baxios\b/i, /node-fetch/i, /\bhttp\.request/i, /\bhttps\.request/i, /XMLHttpRequest/i],
    'no real provider / network calls',
  );
}

/** Test 10: no write/action-service import in the new display or component file. */
function testNoWriteServiceImportInNewFiles(): void {
  assertNoneMatch(
    PACK30D3_NEW_FILES,
    [
      /vionaRequestNoteActionService/,
      /vionaRequestStatusActionService/,
      /vionaExecutionAuditWriteService/,
      /appendVionaRequestNote/,
      /transitionVionaRequestStatus/,
      /PrismaClient/,
      /@prisma\/client/,
    ],
    'no write/action-service or Prisma import in new read-only files',
  );
}

/** Test 11: no interactive/editable control in the new component — pure read-only rendering. */
function testNoInteractiveControlInNewComponent(): void {
  assertNoneMatch(
    ['../src/components/viona/requests/VionaRequestAuditTrailTimeline.tsx'],
    [/TextInput/, /Pressable/, /TouchableOpacity/, /\bButton\b/, /onPress\s*=/, /onChangeText/],
    'no interactive/editable control in the read-only Audit Trail Timeline component',
  );
}

/** Test 12: the VionaRequestAuditEvent Prisma model block is byte-for-byte unchanged. */
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
    'VionaRequestAuditEvent model block must be byte-for-byte unchanged (no schema/migration in Pack30D-3)',
  );
}

function main(): void {
  testNewestFirstSortOrderAndNoMutation();
  testTieBreakSortById();
  testStateTransitionPayloadRecognized();
  testActionStatusPayloadRecognized();
  testUnknownEventTypeFallsBackToRawString();
  testMalformedPayloadNeverThrows();
  testActorLabelFallsBackToSystem();
  testNoRealProviderCall();
  testNoWriteServiceImportInNewFiles();
  testNoInteractiveControlInNewComponent();
  testNoNewPrismaModelOrMigration();
  console.log('PASS Pack30D-3 frontend audit trail timeline tests (11/11)');
}

main();
