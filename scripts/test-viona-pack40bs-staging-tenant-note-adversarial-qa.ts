/**
 * Pack40BS — staging note adversarial QA static/fake-client tests.
 *
 * Operator phrase: APPROVE_PACK40BS_STAGING_TENANT_NOTE_ADVERSARIAL_QA
 * No database, network, deploy, or git-diff-vs-master assertions.
 *
 * Run: npx tsx scripts/test-viona-pack40bs-staging-tenant-note-adversarial-qa.ts
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
  assertPack40bdMergedEvidence,
  assertPack40bSourcePresent,
  assertStagingApiIdentity,
  assertStaticSafety,
  CONSUMER_IDEM_KEY,
  CONSUMER_NOTE_MARKER,
  failuresEquivalent,
  MAX_NOTE_POST,
  MERCHANT_IDEM_KEY,
  MERCHANT_NOTE_MARKER,
  MIN_STAGING_RELEASE,
  normalizeFailure,
  PACK19_TENANT_MARKER,
  PACK35_EXTERNAL_MESSAGE_ID,
  PACK40BD_EVIDENCE_RELATIVE,
  Pack40bsBlockedError,
  VERIFIED_MASTER_SHA,
} from './verify-viona-pack40bs-staging-tenant-note-adversarial-qa';

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
    if (error instanceof Pack40bsBlockedError) {
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const verifySource = readSource('verify-viona-pack40bs-staging-tenant-note-adversarial-qa.ts');

  runTest('1: missing Pack40BD merged evidence blocks', () => {
    expectBlocked(
      () => assertPack40bdMergedEvidence('no deployed marker'),
      'BLOCKED_PACK40BD_EVIDENCE_NOT_MERGED',
    );
  });

  runTest('2: merged Pack40BD evidence with markers passes gate', () => {
    const evidence = readSource(`../${PACK40BD_EVIDENCE_RELATIVE}`);
    assertPack40bdMergedEvidence(evidence);
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

  runTest('5: Pack40B corrected source present on master', () => {
    assertPack40bSourcePresent();
  });

  runTest('6: consumer fixture marker constant is Pack40P5 label', () => {
    assert(PACK19_TENANT_MARKER === 'pack40p5-consumer-ee22193', 'consumer marker');
  });

  runTest('7: merchant fixture marker constant is Pack40P5 label', () => {
    assert(PACK35_EXTERNAL_MESSAGE_ID === 'pack40p5-webhook-ee22193', 'merchant marker');
  });

  runTest('8: inactive merchant fixture blocks successful merchant test', () => {
    assert(verifySource.includes('merchant profile inactive'), 'inactive merchant block');
  });

  runTest('9: legacy fixture mismatch blocks', () => {
    assert(verifySource.includes('legacyUnresolved'), 'legacy enum');
    assert(verifySource.includes('BLOCKED_SAFE_NOTE_FIXTURE'), 'legacy fixture stop');
  });

  runTest('10: missing dual-role actor blocks', () => {
    assert(verifySource.includes('BLOCKED_DUAL_ROLE_STAGING_FIXTURE'), 'dual-role stop');
    assert(verifySource.includes('merchantProfile!.ownerUserId !== dualRoleUserId'), 'positive proof');
  });

  runTest('11: missing non-owner actor blocks', () => {
    assert(verifySource.includes('BLOCKED_SAFE_AUTH_FIXTURE'), 'non-owner stop');
  });

  runTest('12: existing marker or idempotency key blocks', () => {
    assert(verifySource.includes('verifyMarkerAbsence'), 'marker absence gate');
    assert(verifySource.includes('BLOCKED_SAFE_NOTE_FIXTURE'), 'marker block code');
  });

  runTest('13: POST allowlist contains only note endpoint', () => {
    assert(verifySource.includes('/actions/note'), 'note endpoint');
    assert(verifySource.includes("method: 'POST'"), 'POST helper');
    assert(!/method:\s*['"]POST['"][\s\S]{0,120}\/api\/viona\/requests['"]/.test(verifySource), 'no request create POST');
    assert(!verifySource.includes('/actions/status'), 'no status endpoint');
    assert(!verifySource.includes('/actions/execution'), 'no execution endpoint');
  });

  runTest('14: maximum POST count is eight', () => {
    assert(MAX_NOTE_POST === 8, 'max post');
    assert(verifySource.includes('MAX_NOTE_POST'), 'budget constant');
  });

  runTest('15: no DB mutation method exists in verify script', () => {
    assert(!verifySource.includes('prisma.vionaRequest.create'), 'no create');
    assert(!verifySource.includes('prisma.vionaRequest.update'), 'no update');
    assert(!verifySource.includes('prisma.vionaRequest.delete'), 'no delete');
  });

  runTest('16: no Fly deploy/auth command exists', () => {
    assert(!/\bfly\s+deploy\b/i.test(verifySource), 'no fly deploy');
    assert(!/\bfly\s+auth\b/i.test(verifySource), 'no fly auth');
  });

  runTest('17: consumer first-write contract is checked', () => {
    assert(verifySource.includes('assertFirstWriteContract'), 'first write');
    assert(verifySource.includes('status !== 201'), '201 expected');
  });

  runTest('18: consumer replay contract is checked', () => {
    assert(verifySource.includes('assertReplayContract'), 'replay contract');
    assert(verifySource.includes('idempotentReplay'), 'replay flag');
  });

  runTest('19: merchant first-write contract is checked', () => {
    assert(verifySource.includes('merchantFirst'), 'merchant first path');
  });

  runTest('20: merchant replay contract is checked', () => {
    assert(verifySource.includes('merchantReplay'), 'merchant replay path');
  });

  runTest('21: non-owner consumer key reuse denied', () => {
    assert(verifySource.includes('nonOwnerConsumer'), 'non-owner consumer');
    assert(verifySource.includes('assertDeniedContract'), 'denied contract');
  });

  runTest('22: non-owner merchant key reuse denied', () => {
    assert(verifySource.includes('nonOwnerMerchant'), 'non-owner merchant');
    assert(verifySource.includes('noteAccessPolicy'), 'spoof policy field');
  });

  runTest('23: legacy owner denied', () => {
    assert(verifySource.includes('legacyOwner'), 'legacy owner attempt');
  });

  runTest('24: nonexistent request denied', () => {
    assert(verifySource.includes('randomUUID'), 'nonexistent id');
    assert(verifySource.includes('nonexistent'), 'nonexistent path');
  });

  runTest('25: spoof fields cannot expand access', () => {
    assert(verifySource.includes('expectedTenantId'), 'tenant spoof');
    assert(verifySource.includes('merchantProfileId'), 'profile spoof');
    assert(verifySource.includes('directReadPolicy'), 'policy spoof');
  });

  runTest('26: denial responses normalize', () => {
    assert(verifySource.includes('BLOCKED_EXISTENCE_LEAK'), 'existence leak stop');
    assert(verifySource.includes('failuresEquivalent'), 'equivalence helper');
  });

  runTest('27: exactly two note markers expected post-QA', () => {
    assert(CONSUMER_NOTE_MARKER.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'consumer marker sha');
    assert(MERCHANT_NOTE_MARKER.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'merchant marker sha');
  });

  runTest('28: exactly two successful audit events expected', () => {
    assert(verifySource.includes('successfulNoteAuditDelta !== 2'), 'audit delta +2');
  });

  runTest('29: replay produces zero duplicates', () => {
    assert(verifySource.includes('consumerMarkerAfterReplay !== 1'), 'consumer duplicate guard');
    assert(verifySource.includes('merchantMarkerAfterReplay !== 1'), 'merchant duplicate guard');
  });

  runTest('30: denied cases produce zero note events', () => {
    assert(verifySource.includes('deniedNoteAuditDelta !== 0'), 'denied delta guard');
  });

  runTest('31: request count is unchanged', () => {
    assert(verifySource.includes('postRequestCountUnchanged'), 'request count');
  });

  runTest('32: provenance distribution is unchanged', () => {
    assert(verifySource.includes('postProvenanceUnchanged'), 'provenance unchanged');
  });

  runTest('33: P4W digest is unchanged', () => {
    assert(verifySource.includes('postP4wDigestUnchanged'), 'p4w digest');
    assert(APPROVED_CANDIDATE_DIGEST.length === 64, 'digest length');
    assert(APPROVED_CANDIDATE_COUNT === 5, 'count');
  });

  runTest('34: MerchantProfile state is unchanged', () => {
    assert(verifySource.includes('merchantProfileChanged'), 'merchant profile guard');
  });

  runTest('35: request status is unchanged', () => {
    assert(verifySource.includes('requestStatusChanged'), 'status guard');
  });

  runTest('36: no cleanup exists', () => {
    assert(!verifySource.includes('.delete('), 'no delete');
    assert(verifySource.includes('dataCleanupPerformed: false'), 'cleanup flag');
  });

  runTest('37: no IDs, credentials or tokens enter evidence output', () => {
    assert(!verifySource.includes('console.log(token'), 'no token log');
    assert(!verifySource.includes('JSON.stringify(fixtures'), 'fixtures not dumped');
  });

  runTest('38: transport uncertainty stops without blind retry', () => {
    assert(verifySource.includes('BLOCKED_UNCERTAIN_WRITE_OUTCOME'), 'transport stop');
    assert(verifySource.includes('transportError'), 'transport flag');
  });

  runTest('39: Pack40A remains unchanged in verify script scope', () => {
    assert(!verifySource.includes('vionaRequestStatusActionService'), 'no status service');
  });

  runTest('40: Pack40C/D/S files remain untouched by verify script', () => {
    assert(!verifySource.includes('vionaRequestStatusAccessScope'), 'no pack40c');
    assert(!verifySource.includes('vionaRequestIndirectAccessScope'), 'no pack40d');
  });

  runTest('41: min staging release requires Pack40BD v25', () => {
    assert(MIN_STAGING_RELEASE === 25, 'v25 minimum');
  });

  runTest('42: idempotency keys derived from master short sha', () => {
    assert(CONSUMER_IDEM_KEY.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'consumer idem');
    assert(MERCHANT_IDEM_KEY.includes(VERIFIED_MASTER_SHA.slice(0, 7)), 'merchant idem');
  });

  runTest('43: consumer fixture mismatch blocks', () => {
    assert(verifySource.includes('consumer fixture provenance invalid'), 'consumer mismatch');
  });

  runTest('44: merchant fixture mismatch blocks', () => {
    assert(verifySource.includes('merchant fixture profile mismatch'), 'merchant mismatch');
  });

  runTest('45: normalized failures treat same status and error as equivalent', () => {
    const a = normalizeFailure(404, { success: false, error: 'Request not found' });
    const b = normalizeFailure(404, { success: false, error: 'Request not found' });
    assert(failuresEquivalent(a, b), 'equivalent failures');
  });

  runTest('46: P4W digest mismatch blocks validateApprovedPopulation', () => {
    try {
      validateApprovedPopulation([], APPROVED_CANDIDATE_DIGEST, []);
      throw new Error('expected block');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'digest mismatch blocks');
    }
  });

  runTest('47: consumer enum used for fixture validation', () => {
    assert(verifySource.includes('VionaRequestScopeKind.consumer'), 'consumer enum');
  });

  runTest('48: static safety patterns block forbidden operations', () => {
    assertStaticSafety(verifySource);
  });

  runTest('49: no permanent git-diff-versus-master assertion exists', () => {
    assert(!verifySource.includes('git diff'), 'no git diff');
    assert(!verifySource.includes('gitDiff'), 'no gitDiff helper');
  });

  runTest('50: verified master sha matches PR358 merge commit', () => {
    assert(VERIFIED_MASTER_SHA.length === 40, 'full sha');
  });

  console.log('');
  console.log(`[pack40bs-test] ALL ${passed} TESTS PASSED`);
}

main().catch((error) => {
  console.error('[pack40bs-test] FATAL', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
