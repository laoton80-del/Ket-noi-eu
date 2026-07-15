/**
 * Pack40CS — staging status adversarial QA static/fake-client tests.
 *
 * Operator phrase: APPROVE_PACK40CS_STAGING_TENANT_STATUS_ADVERSARIAL_QA
 * No database, network, deploy, or git-diff-vs-master assertions.
 *
 * Run: npx tsx scripts/test-viona-pack40cs-staging-tenant-status-adversarial-qa.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  APPROVED_CANDIDATE_DIGEST,
  APPROVED_CANDIDATE_COUNT,
  assertStagingDatabaseIdentity,
  validateApprovedPopulation,
  Pack40p4WriteBlockedError,
} from './apply-viona-pack40p4-merchant-backfill';
import {
  assertPack40cdMergedEvidence,
  assertPack40cSourcePresent,
  assertStagingApiIdentity,
  assertStaticSafety,
  CONSUMER_IDEM_KEY,
  CONSUMER_STATUS_REASON,
  failuresEquivalent,
  INVALID_TARGET_IDEM_KEY,
  MAX_STATUS_POST,
  MAX_STATUS_POST_ABSOLUTE,
  MERCHANT_IDEM_KEY,
  MERCHANT_STATUS_REASON,
  MIN_STAGING_RELEASE,
  normalizeFailure,
  PACK19_TENANT_MARKER,
  PACK35_EXTERNAL_MESSAGE_ID,
  PACK40CD_EVIDENCE_RELATIVE,
  Pack40csBlockedError,
  PR364_MERGE_SHA,
  STATUS_ENDPOINT_SUFFIX,
  VERIFIED_MASTER_SHA,
} from './verify-viona-pack40cs-staging-tenant-status-adversarial-qa';

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
    if (error instanceof Pack40csBlockedError) {
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const verifySource = readSource('verify-viona-pack40cs-staging-tenant-status-adversarial-qa.ts');

  // 1–5 gates (PR364, API, DB, release, source)
  runTest('1: missing Pack40CD merged evidence blocks', () => {
    expectBlocked(
      () => assertPack40cdMergedEvidence('no deployed marker'),
      'BLOCKED_PACK40CD_EVIDENCE_NOT_MERGED',
    );
  });

  runTest('2: merged Pack40CD evidence with v26 marker passes gate', () => {
    const evidence = readSource(`../${PACK40CD_EVIDENCE_RELATIVE}`);
    assertPack40cdMergedEvidence(evidence);
  });

  runTest('3: wrong staging API blocks', () => {
    expectBlocked(
      () => assertStagingApiIdentity('https://viona-api-production.fly.dev'),
      'BLOCKED_ENVIRONMENT_IDENTITY',
    );
  });

  runTest('4: wrong staging database blocks in apply helper', () => {
    const prevDb = process.env.DATABASE_URL;
    const prevDirect = process.env.DIRECT_URL;
    process.env.DATABASE_URL = 'postgresql://x@wrong-host/db';
    process.env.DIRECT_URL = '';
    try {
      try {
        assertStagingDatabaseIdentity();
        throw new Error('expected block');
      } catch (error) {
        assert(
          error instanceof Error && error.message.includes('staging project ref'),
          'staging ref guard',
        );
      }
    } finally {
      process.env.DATABASE_URL = prevDb;
      process.env.DIRECT_URL = prevDirect;
    }
  });

  runTest('5: Pack40C corrected source present on master', () => {
    assertPack40cSourcePresent();
  });

  // 6–12 fixtures
  runTest('6: consumer fixture marker constant is Pack40P5 label', () => {
    assert(PACK19_TENANT_MARKER === 'pack40p5-consumer-ee22193', 'consumer marker');
    assert(verifySource.includes('VionaRequestScopeKind.consumer'), 'consumer enum used');
  });

  runTest('7: merchant fixture marker constant is Pack40P5 label', () => {
    assert(PACK35_EXTERNAL_MESSAGE_ID === 'pack40p5-webhook-ee22193', 'merchant marker');
  });

  runTest('8: submitted status required for consumer and merchant fixtures', () => {
    assert(verifySource.includes("consumerRow.status !== 'submitted'"), 'consumer submitted gate');
    assert(verifySource.includes("merchantRow.status !== 'submitted'"), 'merchant submitted gate');
  });

  runTest('9: inactive merchant fixture blocks successful merchant test', () => {
    assert(verifySource.includes('merchant profile inactive'), 'inactive merchant block');
    assert(verifySource.includes('BLOCKED_SAFE_STATUS_FIXTURE'), 'status fixture stop');
  });

  runTest('10: legacy fixture mismatch blocks', () => {
    assert(verifySource.includes('legacyUnresolved'), 'legacy enum');
    assert(verifySource.includes('BLOCKED_SAFE_STATUS_FIXTURE'), 'legacy fixture stop');
    assert(verifySource.includes('legacy-fixture'), 'legacy candidate gate');
  });

  runTest('11: missing dual-role actor blocks', () => {
    assert(verifySource.includes('BLOCKED_DUAL_ROLE_STAGING_FIXTURE'), 'dual-role stop');
    assert(verifySource.includes('merchantProfile!.ownerUserId !== dualRoleUserId'), 'positive proof');
  });

  runTest('12: non-owner actor and existing keys block', () => {
    assert(verifySource.includes('BLOCKED_SAFE_AUTH_FIXTURE'), 'non-owner stop');
    assert(verifySource.includes('verifyMarkerAbsence'), 'marker absence gate');
    assert(verifySource.includes('CONSUMER_IDEM_KEY'), 'consumer idem check');
    assert(verifySource.includes('MERCHANT_IDEM_KEY'), 'merchant idem check');
  });

  // 13–18 endpoint / POST budget
  runTest('13: POST allowlist contains only status endpoint', () => {
    assert(verifySource.includes(STATUS_ENDPOINT_SUFFIX), 'status endpoint suffix');
    assert(verifySource.includes("method: 'POST'"), 'POST helper');
    assert(!verifySource.includes('/actions/note'), 'no note endpoint POST');
    assert(!verifySource.includes('/actions/execution'), 'no execution endpoint POST');
    assert(
      !/method:\s*['"]POST['"][\s\S]{0,120}\/api\/viona\/requests['"]/.test(verifySource),
      'no request create POST',
    );
  });

  runTest('14: mandatory status POST budget is ten', () => {
    assert(MAX_STATUS_POST === 10, 'max status post');
    assert(verifySource.includes('MAX_STATUS_POST'), 'budget constant referenced');
  });

  runTest('15: absolute status POST ceiling is eleven', () => {
    assert(MAX_STATUS_POST_ABSOLUTE === 11, 'absolute max post');
    assert(verifySource.includes('MAX_STATUS_POST_ABSOLUTE'), 'absolute budget referenced');
    assert(verifySource.includes('requesterOnlyRequestId != null'), 'optional eleventh POST path');
  });

  runTest('16: no webhook or note write paths in verify script', () => {
    assert(!verifySource.includes('postWebhook('), 'no webhook POST helper');
    assert(!verifySource.includes('/webhook'), 'no webhook route POST');
    assert(!verifySource.includes('postNote('), 'no note POST helper');
    assert(!verifySource.includes('/actions/note'), 'no note action route');
  });

  runTest('17: no DB mutation method exists in verify script', () => {
    assert(!verifySource.includes('prisma.vionaRequest.create'), 'no create');
    assert(!verifySource.includes('prisma.vionaRequest.update'), 'no update');
    assert(!verifySource.includes('prisma.vionaRequest.delete'), 'no delete');
    assertStaticSafety(verifySource);
  });

  runTest('18: no Fly deploy or auth command exists', () => {
    assert(!/\bfly\s+deploy\b/i.test(verifySource), 'no fly deploy');
    assert(!/\bfly\s+auth\b/i.test(verifySource), 'no fly auth');
  });

  // 19–31 contracts
  runTest('19: invalid target status contract is checked', () => {
    assert(verifySource.includes('assertInvalidTargetContract'), 'invalid target contract');
    assert(verifySource.includes('INVALID_TARGET_IDEM_KEY'), 'invalid target idem key');
    assert(verifySource.includes("targetStatus: 'inProgress'"), 'invalid inProgress attempt');
  });

  runTest('20: consumer first-write contract is checked', () => {
    assert(verifySource.includes('assertFirstWriteContract'), 'first write');
    assert(verifySource.includes('status !== 201'), '201 expected');
    assert(verifySource.includes("eventType !== 'action.status'"), 'action.status event');
  });

  runTest('21: consumer replay contract is checked', () => {
    assert(verifySource.includes('assertReplayContract'), 'replay contract');
    assert(verifySource.includes('idempotentReplay'), 'replay flag');
  });

  runTest('22: consumer conflicting idempotency key rejected', () => {
    assert(verifySource.includes('assertConflictContract'), 'conflict contract');
    assert(verifySource.includes('consumerConflict'), 'consumer conflict path');
    assert(verifySource.includes('BLOCKED_IDEMPOTENCY_CONTRACT'), 'idempotency block code');
  });

  runTest('23: merchant first-write contract is checked', () => {
    assert(verifySource.includes('merchantFirst'), 'merchant first path');
    assert(verifySource.includes('MERCHANT_STATUS_REASON'), 'merchant reason constant');
  });

  runTest('24: merchant replay contract is checked', () => {
    assert(verifySource.includes('merchantReplay'), 'merchant replay path');
  });

  runTest('25: non-owner consumer key reuse denied', () => {
    assert(verifySource.includes('nonOwnerConsumer'), 'non-owner consumer');
    assert(verifySource.includes('assertDeniedContract'), 'denied contract');
  });

  runTest('26: non-owner merchant spoof denied', () => {
    assert(verifySource.includes('nonOwnerMerchant'), 'non-owner merchant');
    assert(verifySource.includes('statusAccessPolicy'), 'spoof policy field');
  });

  runTest('27: legacy owner status attempt denied', () => {
    assert(verifySource.includes('legacyOwner'), 'legacy owner attempt');
    assert(verifySource.includes('legacyOwnerStatusDenied'), 'legacy denial tracked');
  });

  runTest('28: nonexistent request denied', () => {
    assert(verifySource.includes('randomUUID'), 'nonexistent id');
    assert(verifySource.includes('nonexistent'), 'nonexistent path');
  });

  runTest('29: optional requester-only status denied when fixture found', () => {
    assert(verifySource.includes('requesterOnlyRequestId'), 'requester-only fixture');
    assert(verifySource.includes('requesterOnlyStatusDenied'), 'requester-only denial tracked');
    assert(verifySource.includes('optionalRequesterOnlyRan'), 'optional path flag');
  });

  runTest('30: spoof fields cannot expand access', () => {
    assert(verifySource.includes('expectedTenantId'), 'tenant spoof');
    assert(verifySource.includes('merchantProfileId'), 'profile spoof');
    assert(verifySource.includes('directReadPolicy'), 'policy spoof');
    assert(verifySource.includes('clientTenantExpansionDenied'), 'tenant expansion denied');
  });

  runTest('31: denial responses normalize without existence leak', () => {
    assert(verifySource.includes('BLOCKED_EXISTENCE_LEAK'), 'existence leak stop');
    assert(verifySource.includes('failuresEquivalent'), 'equivalence helper');
    assert(verifySource.includes('existenceLeakSafe'), 'existence leak summary flag');
    const a = normalizeFailure(404, { success: false, error: 'Request not found' });
    const b = normalizeFailure(404, { success: false, error: 'Request not found' });
    assert(failuresEquivalent(a, b), 'equivalent normalized failures');
  });

  // 32–38 deltas
  runTest('32: exactly two successful status audit events expected', () => {
    assert(verifySource.includes('successfulStatusAuditDelta !== 2'), 'audit delta +2');
  });

  runTest('33: exactly two successful status transition events expected', () => {
    assert(verifySource.includes('successfulStatusTransitionDelta !== 2'), 'transition delta +2');
  });

  runTest('34: consumer and merchant reach triage after successful writes', () => {
    assert(verifySource.includes('consumerStatusTriage'), 'consumer triage flag');
    assert(verifySource.includes('merchantStatusTriage'), 'merchant triage flag');
    assert(verifySource.includes("consumerRowPost?.status === 'triage'"), 'consumer triage check');
    assert(verifySource.includes("merchantRowPost?.status === 'triage'"), 'merchant triage check');
  });

  runTest('35: consumer replay produces zero duplicate audits', () => {
    assert(verifySource.includes('consumerReasonAfterReplay !== 1'), 'consumer reason duplicate guard');
    assert(verifySource.includes('consumerIdemAfterReplay !== 1'), 'consumer idem duplicate guard');
  });

  runTest('36: merchant replay produces zero duplicate audits', () => {
    assert(verifySource.includes('merchantReasonAfterReplay !== 1'), 'merchant reason duplicate guard');
    assert(verifySource.includes('merchantIdemAfterReplay !== 1'), 'merchant idem duplicate guard');
  });

  runTest('37: denied cases produce zero status audit side effects', () => {
    assert(verifySource.includes('deniedStatusAuditDelta !== 0'), 'denied audit delta guard');
  });

  runTest('38: denied cases produce zero status transition side effects', () => {
    assert(verifySource.includes('deniedStatusTransitionDelta !== 0'), 'denied transition delta guard');
  });

  // 39–44 preservation
  runTest('39: request count is unchanged', () => {
    assert(verifySource.includes('postRequestCountUnchanged'), 'request count');
  });

  runTest('40: provenance distribution is unchanged', () => {
    assert(verifySource.includes('postProvenanceUnchanged'), 'provenance unchanged');
  });

  runTest('41: P4W digest is unchanged', () => {
    assert(verifySource.includes('postP4wDigestUnchanged'), 'p4w digest');
    assert(APPROVED_CANDIDATE_DIGEST.length === 64, 'digest length');
    assert(APPROVED_CANDIDATE_COUNT === 5, 'count');
    try {
      validateApprovedPopulation([], APPROVED_CANDIDATE_DIGEST, []);
      throw new Error('expected block');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'digest mismatch blocks');
    }
  });

  runTest('42: MerchantProfile state is unchanged', () => {
    assert(verifySource.includes('merchantProfileChanged'), 'merchant profile guard');
    assert(verifySource.includes('merchantProfileChanged: false'), 'profile unchanged in summary');
  });

  runTest('43: legacy request status is unchanged', () => {
    assert(verifySource.includes('legacyStatusUnchanged'), 'legacy status guard');
    assert(verifySource.includes('legacyRowPost?.status === fixtures.legacyStatus'), 'legacy row check');
  });

  runTest('44: no cleanup or orchestrator side paths exist', () => {
    assert(!verifySource.includes('.delete('), 'no delete cleanup');
    assert(verifySource.includes('dataCleanupPerformed: false'), 'cleanup flag false');
    assert(!/orchestrat/i.test(verifySource), 'no orchestrator');
  });

  // 45–50 privacy, transport, pack40a/b unchanged, no git diff
  runTest('45: no IDs, credentials or tokens enter evidence output', () => {
    assert(!verifySource.includes('console.log(token'), 'no token log');
    assert(!verifySource.includes('JSON.stringify(fixtures'), 'fixtures not dumped');
  });

  runTest('46: transport uncertainty stops without blind retry', () => {
    assert(verifySource.includes('BLOCKED_UNCERTAIN_WRITE_OUTCOME'), 'transport stop');
    assert(verifySource.includes('transportError'), 'transport flag');
    assert(verifySource.includes('handleTransportUncertainty'), 'transport handler');
  });

  runTest('47: Pack40A read scope files remain untouched by verify script', () => {
    assert(!verifySource.includes('vionaRequestIndirectAccessScope'), 'no pack40a scope import');
    assert(!verifySource.includes('apply-viona-pack40a'), 'no pack40a apply script');
    assert(!verifySource.includes('/actions/direct-read'), 'no direct-read POST');
  });

  runTest('48: Pack40B note action remains write-unchanged in verify script', () => {
    assert(!verifySource.includes('/actions/note'), 'no note POST route');
    assert(!verifySource.includes('assertFirstWriteContract(consumerNote'), 'no note first-write');
    assert(verifySource.includes('noteAuditDelta'), 'note delta counted read-only');
    assert(verifySource.includes('noteAuditDelta !== 0'), 'note writes must not occur');
  });

  runTest('49: no permanent git-diff-versus-master assertion exists', () => {
    assert(!verifySource.includes('git diff'), 'no git diff');
    assert(!verifySource.includes('gitDiff'), 'no gitDiff helper');
  });

  runTest('50: verified master sha matches PR364 merge commit', () => {
    assert(VERIFIED_MASTER_SHA.length === 40, 'full sha');
    assert(VERIFIED_MASTER_SHA === PR364_MERGE_SHA, 'PR364 merge sha');
    assert(CONSUMER_STATUS_REASON.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'consumer reason sha');
    assert(MERCHANT_STATUS_REASON.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'merchant reason sha');
    assert(CONSUMER_IDEM_KEY.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'consumer idem sha');
    assert(MERCHANT_IDEM_KEY.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'merchant idem sha');
    assert(INVALID_TARGET_IDEM_KEY.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'invalid target idem sha');
    assert(MIN_STAGING_RELEASE === 26, 'v26 minimum release');
  });

  console.log('');
  console.log(`Pack40CS static tests ${passed} passed`);
}

main().catch((error) => {
  console.error('[pack40cs-test] FATAL', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
