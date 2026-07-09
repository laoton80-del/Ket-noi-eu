/**
 * Pack29 — pure execution eligibility guard tests (no DB, no network, no side effects).
 */

import { buildDryRunOnlyVionaExecutionAttempt } from '../src/lib/viona/executionLane/vionaExecutionLaneBuilders';
import {
  VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID,
  VIONA_PACK29_EXECUTION_BLOCKED_STATUSES,
  VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES,
  evaluateVionaRequestExecutionEligibility,
  isVionaPack29PostTriageEligibleStatus,
} from '../src/lib/viona/executionGate/vionaRequestExecutionEligibilityGuard';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testPostTriageEligibleStatuses(): void {
  for (const status of VIONA_PACK29_POST_TRIAGE_ELIGIBLE_STATUSES) {
    assert(isVionaPack29PostTriageEligibleStatus(status), `expected eligible: ${status}`);
    const result = evaluateVionaRequestExecutionEligibility({
      requestId: 'req-pack29-test',
      requestStatus: status,
    });
    assert(result.eligible, `expected eligible evaluation for ${status}`);
    assert(result.reason === 'eligible', `expected reason eligible for ${status}`);
    assert(
      result.actionId === VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID,
      'default action id',
    );
  }
}

function testPreTriageBlocked(): void {
  for (const status of ['draft', 'submitted'] as const) {
    const result = evaluateVionaRequestExecutionEligibility({
      requestId: 'req-pack29-test',
      requestStatus: status,
    });
    assert(!result.eligible, `expected blocked for ${status}`);
    assert(result.reason === 'status_pre_triage', `expected pre-triage reason for ${status}`);
  }
}

function testTerminalBlockedStatuses(): void {
  for (const status of VIONA_PACK29_EXECUTION_BLOCKED_STATUSES) {
    if (status === 'draft' || status === 'submitted') continue;
    const result = evaluateVionaRequestExecutionEligibility({
      requestId: 'req-pack29-test',
      requestStatus: status,
    });
    assert(!result.eligible, `expected blocked for ${status}`);
    assert(
      result.reason === 'status_cancelled_or_failed' || result.reason === 'status_pre_triage',
      `expected terminal/pre-triage block for ${status}`,
    );
  }
}

function testUnsupportedAction(): void {
  const result = evaluateVionaRequestExecutionEligibility({
    requestId: 'req-pack29-test',
    requestStatus: 'triage',
    actionId: 'payment.intent',
  });
  assert(!result.eligible, 'forbidden action must be blocked');
  assert(result.reason === 'unsupported_action', 'unsupported action reason');
}

function testInvalidInput(): void {
  const result = evaluateVionaRequestExecutionEligibility({
    requestId: '   ',
    requestStatus: 'triage',
  });
  assert(!result.eligible, 'blank request id blocked');
  assert(result.reason === 'invalid_input', 'invalid input reason');
}

function testDryRunEnvelopeSafetyFields(): void {
  const envelope = buildDryRunOnlyVionaExecutionAttempt({
    executionAttemptId: 'pack29-test',
    actionId: VIONA_PACK29_DEFAULT_EXECUTION_ACTION_ID,
    targetType: 'viona_request',
    targetId: 'req-pack29-test',
    requestedByRole: 'request_owner',
    createdAt: '1970-01-01T00:00:00.000Z',
  });
  assert(envelope.dryRunOnly === true, 'dryRunOnly must be true');
  assert(envelope.executionAuthorized === false, 'executionAuthorized must be false');
  assert(envelope.auditTimelineSnapshot.persistent === false, 'no persistent audit');
}

function main(): void {
  testPostTriageEligibleStatuses();
  testPreTriageBlocked();
  testTerminalBlockedStatuses();
  testUnsupportedAction();
  testInvalidInput();
  testDryRunEnvelopeSafetyFields();
  console.log('PASS Pack29 execution gate pure tests');
}

main();
