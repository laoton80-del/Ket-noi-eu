/**
 * Pack40DS — staging controlled indirect execution QA static/fake-client tests.
 *
 * Operator phrase: APPROVE_PACK40DS_STAGING_CONTROLLED_INDIRECT_EXECUTION_QA
 * No database, network, deploy, or live Twilio during this suite.
 *
 * Run: npx tsx scripts/test-viona-pack40ds-staging-controlled-indirect-execution-qa.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  assertEscrowAmountPolicy,
  assertPack40ddMergedEvidence,
  assertPack40dSourceBoundaries,
  assertSafeProviderDestination,
  assertStagingApiIdentity,
  assertStaticSafety,
  CORRELATION_MARKER,
  ESCROW_AMOUNT_VIO,
  EXECUTION_MARKER,
  INTERNAL_EXECUTION_PATH,
  MAX_ESCROW_HOLD,
  MAX_ESCROW_SETTLE,
  MAX_EXECUTION_POST,
  MAX_PROVIDER_SEND,
  MIN_STAGING_RELEASE,
  PACK40DD_EVIDENCE_RELATIVE,
  Pack40dsBlockedError,
  PR374_MERGE_SHA,
  SAFE_TWILIO_DESTINATION,
  SMS_BODY,
  SMS_MARKER,
  VERIFIED_MASTER_SHA,
} from './verify-viona-pack40ds-staging-controlled-indirect-execution-qa';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

let passed = 0;

function runTest(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

function expectBlocked(fn: () => void, code: string): void {
  try {
    fn();
    throw new Error(`expected ${code}`);
  } catch (error) {
    if (error instanceof Pack40dsBlockedError) {
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const verifySource = readSource(
    'verify-viona-pack40ds-staging-controlled-indirect-execution-qa.ts',
  );

  runTest('1. #374 merge gate rejects incomplete evidence', () => {
    expectBlocked(
      () => assertPack40ddMergedEvidence('incomplete'),
      'BLOCKED_PACK40DD_EVIDENCE_NOT_MERGED',
    );
  });

  runTest('2. #374 merge gate accepts Pack40DD evidence', () => {
    assertPack40ddMergedEvidence(readSource(`../${PACK40DD_EVIDENCE_RELATIVE}`));
    assert(VERIFIED_MASTER_SHA === PR374_MERGE_SHA, 'master pin');
  });

  runTest('3. Staging API identity rejects production host', () => {
    expectBlocked(
      () => assertStagingApiIdentity('https://viona-api-production.fly.dev'),
      'BLOCKED_ENVIRONMENT_IDENTITY',
    );
  });

  runTest('4. Staging API identity accepts staging host', () => {
    assertStagingApiIdentity('https://viona-api-staging-eu.fly.dev');
  });

  runTest('5. Minimum release gate pins v27', () => {
    assert(MIN_STAGING_RELEASE === 27, 'min release');
  });

  runTest('6. Exactly one enabled trigger and signed-webhook disabled in source', () => {
    assertPack40dSourceBoundaries();
    assert(verifySource.includes("enabledTrigger: 'internalAuthenticatedController'"), 'trigger');
    assert(verifySource.includes('signedWebhookExecutionEnabled: false'), 'webhook disabled');
    assert(verifySource.includes('internalDispatchExecutionEnabled: false'), 'dispatch disabled');
  });

  runTest('7. Merchant fixture requires triage + active profile authority', () => {
    assert(verifySource.includes("merchantRow.status !== 'triage'"), 'triage gate');
    assert(verifySource.includes('merchant profile inactive') || verifySource.includes('authority mismatch'), 'profile');
    assert(verifySource.includes('active attempt already exists'), 'active attempt gate');
  });

  runTest('8. Consumer fixture requires triage consumer without profile', () => {
    assert(verifySource.includes('VionaRequestScopeKind.consumer'), 'consumer enum');
    assert(verifySource.includes('merchantProfileId: null') || verifySource.includes('merchantProfileId == null'), 'null profile');
  });

  runTest('9. Legacy fixture remains provenance-fail-closed', () => {
    assert(verifySource.includes('legacyUnresolved'), 'legacy');
    assert(verifySource.includes('legacy must not succeed'), 'deny');
  });

  runTest('10. Safe destination is forced Twilio magic number', () => {
    assertSafeProviderDestination();
    assert(SAFE_TWILIO_DESTINATION === '+15005550006', 'magic');
  });

  runTest('11. Unique markers derived from master short SHA', () => {
    assert(EXECUTION_MARKER.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'exec marker');
    assert(CORRELATION_MARKER.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'corr marker');
    assert(SMS_MARKER.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'sms marker');
    assert(SMS_BODY.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'sms body');
  });

  runTest('12. Five mandatory POST maximum', () => {
    assert(MAX_EXECUTION_POST === 5, 'post max');
    assert(verifySource.includes('MAX_EXECUTION_POST = 5'), 'source pin');
  });

  runTest('13. One provider-send maximum', () => {
    assert(MAX_PROVIDER_SEND === 1, 'send max');
  });

  runTest('14. One hold and one settlement maximum', () => {
    assert(MAX_ESCROW_HOLD === 1 && MAX_ESCROW_SETTLE === 1, 'escrow max');
  });

  runTest('15. No request creation endpoint in live script', () => {
    assert(!/\/api\/viona\/requests['"]\s*,/.test(verifySource), 'no create route literal call');
    assert(verifySource.includes(INTERNAL_EXECUTION_PATH), 'internal route only');
  });

  runTest('16. No direct DB mutation methods', () => {
    assertStaticSafety(verifySource);
  });

  runTest('17. No deployment command', () => {
    assert(!/fly\s+deploy/i.test(verifySource), 'no deploy');
    assert(!/prisma\s+migrate/i.test(verifySource), 'no migrate');
  });

  runTest('18. Transport uncertainty stops without retry', () => {
    assert(verifySource.includes('BLOCKED_UNCERTAIN_EXECUTION_OUTCOME'), 'uncertain code');
    assert(verifySource.includes('uncertain transport'), 'stop');
    assert(!verifySource.includes('while (provider'), 'no provider loop');
  });

  runTest('19. Exactly one successful attempt expected', () => {
    assert(verifySource.includes('executionAttemptDelta: 1'), 'attempt delta');
    assert(verifySource.includes('completedAttemptDelta: 1'), 'completed delta');
  });

  runTest('20. Exactly two transitions/events/indirect audits expected', () => {
    assert(verifySource.includes('requestTransitionCount: 2'), 'transitions');
    assert(verifySource.includes('eventDelta !== 2'), 'events check');
    assert(verifySource.includes('indirectAuditDelta !== 2'), 'indirect audits check');
  });

  runTest('21. Denials create zero side effects', () => {
    assert(verifySource.includes('BLOCKED_DENIED_EXECUTION_SIDE_EFFECT'), 'denied side effect');
    assert(verifySource.includes('assertDenialNoSideEffects'), 'helper');
  });

  runTest('22. Duplicate invocation creates zero side effects', () => {
    assert(verifySource.includes('BLOCKED_DUPLICATE_EXECUTION'), 'dup code');
    assert(verifySource.includes('duplicate must not succeed'), 'dup deny');
  });

  runTest('23. No cleanup exists', () => {
    assert(verifySource.includes('cleanupPerformed: false'), 'no cleanup');
  });

  runTest('24. No recovery exists', () => {
    assert(verifySource.includes('recoveryPerformed: false'), 'no recovery');
    assert(!verifySource.includes('lease steal'), 'no steal');
  });

  runTest('25. No raw identifiers enter evidence helpers', () => {
    assert(verifySource.includes('function anonymize'), 'anonymize');
    assert(verifySource.includes('Never prints or commits raw'), 'privacy header');
  });

  runTest('26. Pack40A/B/C preservation — Pack40D coordinator only', () => {
    assert(!verifySource.includes('transitionVionaRequestStatus('), 'no Pack40C writer');
    assert(!verifySource.includes('/actions/status'), 'no status route POST');
  });

  runTest('27. Pack40S remains untouched', () => {
    assert(!verifySource.toLowerCase().includes('pack40s') || verifySource.includes('Pack40S'), 'comment only');
    assert(!fs.existsSync(path.resolve(__dirname, '../src/services/viona/pack40s.ts')), 'no pack40s src');
  });

  runTest('28. Escrow amount is bounded 0.01 within safe cap', () => {
    assertEscrowAmountPolicy();
    assert(ESCROW_AMOUNT_VIO === 0.01, 'amount');
  });

  console.log(`\nPack40DS static suite: ${passed}/${passed} PASS`);
}

main().catch((error) => {
  console.error('\nFAIL:', error);
  process.exit(1);
});
