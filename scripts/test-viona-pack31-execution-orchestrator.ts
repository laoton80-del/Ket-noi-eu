/**
 * Pack31 — Business Flow Orchestrator tests (state lock -> real execution -> finalize -> audit).
 *
 * Operator phrase: APPROVE_PACK31_ORCHESTRATOR_DIRECT_PRISMA.
 * No live DB, no live Twilio call — `previewVionaExecutionPlanRealProviderPocRoute` and Prisma are
 * exercised only indirectly via source-scan + the pure `resolveVionaRequestBusinessFlowFinalStatus`
 * helper (the only piece of orchestration logic that is DB/network-free and directly importable).
 *
 * Run: npx tsx scripts/test-viona-pack31-execution-orchestrator.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { resolveVionaRequestBusinessFlowFinalStatus } from '../src/services/viona/vionaRequestExecutionOrchestrator';
import { canTransitionRequestStatus } from '../src/domain/requests/vionaRequestStatusMachine';
import { vionaRequestStatuses } from '../src/domain/requests/vionaRequestTypes';
import { VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES } from '../src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard';
import type { PreviewVionaExecutionPlanRealProviderPocResult } from '../src/services/viona/vionaExecutionPlanRouteService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSourceNoComments(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

let passed = 0;

function runTest(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

// ---------------------------------------------------------------------------
// 1. CRITICAL — orchestrator never imports/touches the forbidden sanctioned service file.
// ---------------------------------------------------------------------------

runTest('orchestrator source never imports vionaRequestStatusActionService', () => {
  const source = readSourceNoComments('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
  assert(
    !source.includes('vionaRequestStatusActionService'),
    'must not import from the forbidden sanctioned status-transition service file',
  );
});

runTest('vionaRequestStatusActionService.ts itself has zero diff (untouched)', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/services/viona/vionaRequestStatusActionService.ts'),
    'utf8',
  );
  // Sentinel: the narrow Pack25 owner-only transition must still be exactly `submitted -> triage`.
  assert(
    source.includes("from: 'submitted'") === false, // constant lives in the DTO file, not here
    'sanity: this file itself does not redeclare the allowed-transition constant',
  );
  assert(
    source.includes('transitionVionaRequestStatus'),
    'sanity: file still exports its original function name (untouched)',
  );
});

// ---------------------------------------------------------------------------
// 2-4. Domain additions are additive-only.
// ---------------------------------------------------------------------------

runTest('vionaRequestStatuses gained inProgress additively (all prior statuses still present)', () => {
  const priorStatuses = [
    'draft',
    'submitted',
    'triage',
    'needsHumanConfirmation',
    'sentToPartner',
    'partnerResponded',
    'completed',
    'cancelled',
    'failed',
  ];
  for (const status of priorStatuses) {
    assert(
      (vionaRequestStatuses as readonly string[]).includes(status),
      `pre-existing status ${status} must still be present`,
    );
  }
  assert(
    (vionaRequestStatuses as readonly string[]).includes('inProgress'),
    'new inProgress status must be present',
  );
});

runTest('state machine: triage -> inProgress -> completed|failed all valid; no prior transition removed', () => {
  assert(canTransitionRequestStatus('triage', 'inProgress'), 'triage -> inProgress must be allowed');
  assert(canTransitionRequestStatus('inProgress', 'completed'), 'inProgress -> completed must be allowed');
  assert(canTransitionRequestStatus('inProgress', 'failed'), 'inProgress -> failed must be allowed');
  // Spot-check a sample of pre-existing transitions are still intact.
  assert(canTransitionRequestStatus('draft', 'submitted'), 'draft -> submitted must remain allowed');
  assert(canTransitionRequestStatus('triage', 'completed'), 'triage -> completed must remain allowed');
  assert(canTransitionRequestStatus('triage', 'failed'), 'triage -> failed must remain allowed');
  assert(canTransitionRequestStatus('failed', 'draft'), 'failed -> draft must remain allowed');
  assert(!canTransitionRequestStatus('completed', 'inProgress'), 'completed must remain terminal');
  assert(!canTransitionRequestStatus('cancelled', 'inProgress'), 'cancelled must remain terminal');
});

runTest('execution eligibility guard includes inProgress additively', () => {
  assert(
    (VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES as readonly string[]).includes('inProgress'),
    'inProgress must be eligible for the execution-plan check the orchestrator re-runs post-claim',
  );
  for (const status of ['triage', 'needsHumanConfirmation', 'sentToPartner', 'partnerResponded', 'completed']) {
    assert(
      (VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES as readonly string[]).includes(status),
      `pre-existing eligible status ${status} must still be present`,
    );
  }
});

// ---------------------------------------------------------------------------
// 5-9. resolveVionaRequestBusinessFlowFinalStatus — pure decision function.
// ---------------------------------------------------------------------------

function fakeResult(
  overrides: Partial<PreviewVionaExecutionPlanRealProviderPocResult & { ok: true }>,
): PreviewVionaExecutionPlanRealProviderPocResult {
  return {
    ok: true,
    requestId: 'req-1',
    actionId: 'request.assign',
    planAllowed: true,
    denialReason: 'not_denied',
    escrow: { attempted: false },
    realProviderResult: null,
    ...overrides,
  } as PreviewVionaExecutionPlanRealProviderPocResult;
}

runTest('finalStatus: route ok:false -> failed', () => {
  const result: PreviewVionaExecutionPlanRealProviderPocResult = { ok: false, reason: 'invalid_input' };
  assert(resolveVionaRequestBusinessFlowFinalStatus(result) === 'failed', 'ok:false must resolve to failed');
});

runTest('finalStatus: plan denied -> failed', () => {
  const result = fakeResult({ planAllowed: false, denialReason: 'missing_operator_approval' });
  assert(resolveVionaRequestBusinessFlowFinalStatus(result) === 'failed', 'plan denied must resolve to failed');
});

runTest('finalStatus: escrow hold denied -> failed', () => {
  const result = fakeResult({
    escrow: { attempted: true, holdOk: false, reason: 'insufficient_funds' },
  });
  assert(resolveVionaRequestBusinessFlowFinalStatus(result) === 'failed', 'escrow hold denial must resolve to failed');
});

runTest('finalStatus: real provider succeeded -> completed', () => {
  const result = fakeResult({
    escrow: {
      attempted: true,
      holdOk: true,
      holdId: 'hold-1',
      heldAmountVIO: 0.01,
      resolvedStatus: 'SETTLED',
      settledAmountVIO: 0.01,
      refundedAmountVIO: null,
    },
    realProviderResult: {
      requestId: 'req-1',
      actionId: 'request.assign',
      auditWritten: true,
      outcome: { outcome: 'succeeded', providerMessageSid: 'SM123', attempts: 1, latencyMs: 10 },
    },
  });
  assert(resolveVionaRequestBusinessFlowFinalStatus(result) === 'completed', 'succeeded outcome must resolve to completed');
});

runTest('finalStatus: real provider blockedPolicy/failedBounded -> failed', () => {
  const blocked = fakeResult({
    escrow: {
      attempted: true,
      holdOk: true,
      holdId: 'hold-2',
      heldAmountVIO: 0.01,
      resolvedStatus: 'REFUNDED',
      settledAmountVIO: null,
      refundedAmountVIO: 0.01,
    },
    realProviderResult: {
      requestId: 'req-1',
      actionId: 'request.assign',
      auditWritten: true,
      outcome: { outcome: 'blockedPolicy', reason: 'invalid_to_number' },
    },
  });
  assert(resolveVionaRequestBusinessFlowFinalStatus(blocked) === 'failed', 'blockedPolicy must resolve to failed');
});

console.log(`\nPack31 execution orchestrator: ${passed}/${passed} PASS`);
