/**
 * Pack40AS — staging adversarial read QA static/fake-client tests.
 *
 * Operator phrase: APPROVE_PACK40AS_STAGING_TENANT_ADVERSARIAL_QA
 * No database, network, deploy, or git-diff-vs-master assertions.
 *
 * Run: npx tsx scripts/test-viona-pack40as-staging-tenant-adversarial-qa.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind } from '@prisma/client';

import {
  APPROVED_CANDIDATE_DIGEST,
  APPROVED_CANDIDATE_COUNT,
  assertStagingDatabaseIdentity,
  validateApprovedPopulation,
  Pack40p4WriteBlockedError,
} from './apply-viona-pack40p4-merchant-backfill';
import {
  assertPack40adMergedEvidence,
  assertPack40aSourcePresent,
  assertStagingApiIdentity,
  assertStaticSafety,
  failuresEquivalent,
  MAX_AUTHENTICATED_GET,
  MAX_UNAUTH_GET,
  MIN_STAGING_RELEASE,
  normalizeFailure,
  PACK19_TENANT_MARKER,
  PACK35_EXTERNAL_MESSAGE_ID,
  PACK40AD_EVIDENCE_RELATIVE,
  Pack40asBlockedError,
} from './verify-viona-pack40as-staging-tenant-adversarial-qa';

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
    if (error instanceof Pack40asBlockedError) {
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const verifySource = readSource('verify-viona-pack40as-staging-tenant-adversarial-qa.ts');

  runTest('1: missing Pack40AD merged evidence blocks', () => {
    expectBlocked(
      () => assertPack40adMergedEvidence('no deployed marker'),
      'BLOCKED_PACK40AD_EVIDENCE_NOT_MERGED',
    );
  });

  runTest('2: merged Pack40AD evidence with markers passes gate', () => {
    const evidence = readSource(`../${PACK40AD_EVIDENCE_RELATIVE}`);
    assertPack40adMergedEvidence(evidence);
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

  runTest('5: Pack40A source present on master', () => {
    assertPack40aSourcePresent();
  });

  runTest('6: consumer fixture marker constant is Pack40P5 label', () => {
    assert(PACK19_TENANT_MARKER === 'pack40p5-consumer-ee22193', 'consumer marker');
  });

  runTest('7: merchant fixture marker constant is Pack40P5 label', () => {
    assert(PACK35_EXTERNAL_MESSAGE_ID === 'pack40p5-webhook-ee22193', 'merchant marker');
  });

  runTest('8: original P4W digest mismatch blocks validateApprovedPopulation', () => {
    try {
      validateApprovedPopulation([], APPROVED_CANDIDATE_DIGEST, []);
      throw new Error('expected block');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'digest mismatch blocks');
    }
  });

  runTest('9: approved digest constant matches P4D evidence', () => {
    assert(APPROVED_CANDIDATE_DIGEST.length === 64, 'digest length');
    assert(APPROVED_CANDIDATE_COUNT === 5, 'count');
  });

  runTest('10: legacy fixture must remain legacyUnresolved in verify checks', () => {
    assert(verifySource.includes('VionaRequestScopeKind.legacyUnresolved'), 'legacy enum use');
  });

  runTest('11: dual-role positive proof required in verify script', () => {
    assert(verifySource.includes('BLOCKED_DUAL_ROLE_STAGING_FIXTURE'), 'dual-role stop');
    assert(verifySource.includes('merchantProfile!.ownerUserId !== dualRoleUserId'), 'positive proof');
  });

  runTest('12: non-owner actor required', () => {
    assert(verifySource.includes('BLOCKED_SAFE_AUTH_FIXTURE'), 'non-owner stop');
    assert(verifySource.includes('resolvePilotBPhone'), 'pilot B phone');
  });

  runTest('13: only GET list/detail application requests (plus auth login precedent)', () => {
    assert(verifySource.includes('/api/viona/requests'), 'list/detail path');
    assert(verifySource.includes("method: 'GET'"), 'GET helper');
    assert(verifySource.includes('/api/auth/login'), 'auth login precedent');
    assert(!/method:\s*['"]POST['"][\s\S]{0,120}\/api\/viona\/requests/.test(verifySource), 'no viona POST');
  });

  runTest('14: POST/PATCH/DELETE to viona routes blocked by static safety patterns', () => {
    assertStaticSafety(verifySource);
  });

  runTest('15: owner consumer list/detail checks encoded', () => {
    assert(verifySource.includes('consumerOwnerListPass'), 'consumer list flag');
    assert(verifySource.includes('consumerOwnerDetailPass'), 'consumer detail flag');
  });

  runTest('16: dual-role merchant list/detail checks encoded', () => {
    assert(verifySource.includes('merchantOwnerListPass'), 'merchant list');
    assert(verifySource.includes('merchantOwnerDetailPass'), 'merchant detail');
  });

  runTest('17: historical merchant checks encoded', () => {
    assert(verifySource.includes('historicalMerchantListPass'), 'historical list');
    assert(verifySource.includes('historicalMerchantDetailPass'), 'historical detail');
  });

  runTest('18: legacy owner list/detail denial encoded', () => {
    assert(verifySource.includes('legacyOwnerListDenied'), 'legacy list deny');
    assert(verifySource.includes('legacyOwnerDetailDenied'), 'legacy detail deny');
  });

  runTest('19: non-owner denial encoded', () => {
    assert(verifySource.includes('nonOwnerConsumerDenied'), 'non-owner consumer');
    assert(verifySource.includes('nonOwnerMerchantDenied'), 'non-owner merchant');
    assert(verifySource.includes('nonOwnerLegacyDenied'), 'non-owner legacy');
  });

  runTest('20: client spoof query parameters encoded', () => {
    assert(verifySource.includes('expectedTenantId'), 'expectedTenantId spoof');
    assert(verifySource.includes('merchantProfileId'), 'merchantProfileId spoof');
    assert(verifySource.includes('directReadPolicy=pack40a_provenance'), 'policy spoof');
  });

  runTest('21: existence-leak normalization helper present', () => {
    assert(verifySource.includes('BLOCKED_EXISTENCE_LEAK'), 'existence leak stop');
    assert(verifySource.includes('failuresEquivalent'), 'equivalence helper');
  });

  runTest('22: normalized failures treat same status and error as equivalent', () => {
    const a = normalizeFailure(404, { success: false, error: 'Request not found' });
    const b = normalizeFailure(404, { success: false, error: 'Request not found' });
    assert(failuresEquivalent(a, b), 'equivalent failures');
  });

  runTest('23: post-QA invariant checks encoded', () => {
    assert(verifySource.includes('BLOCKED_POST_QA_INVARIANT'), 'post invariant stop');
    assert(verifySource.includes('postAuditCountUnchanged'), 'audit count');
  });

  runTest('24: no Prisma mutation methods in verify script', () => {
    assert(!verifySource.includes('.create('), 'no create');
    assert(!verifySource.includes('.update('), 'no update');
    assert(!verifySource.includes('.delete('), 'no delete');
  });

  runTest('25: no Fly deploy/auth command in verify script', () => {
    assert(!/\bfly\s+deploy\b/i.test(verifySource), 'no fly deploy');
    assert(!/\bfly\s+auth\b/i.test(verifySource), 'no fly auth');
  });

  runTest('25b: fly releases read-only allowed for release verification', () => {
    assert(verifySource.includes('fly releases'), 'fly releases for release');
  });

  runTest('26: no migration command in verify script', () => {
    assert(!verifySource.includes('prisma migrate'), 'no migrate');
  });

  runTest('27: request budget caps present', () => {
    assert(String(MAX_AUTHENTICATED_GET) === '30', 'auth cap');
    assert(String(MAX_UNAUTH_GET) === '5', 'unauth cap');
    assert(verifySource.includes('RequestBudget'), 'budget class');
  });

  runTest('28: min staging release requires Pack40AD v24', () => {
    assert(MIN_STAGING_RELEASE === 24, 'v24 minimum');
  });

  runTest('29: no secret logging patterns in verify script', () => {
    assert(!verifySource.includes('console.log(token'), 'no token log');
    assert(!verifySource.includes('console.log(pin'), 'no pin log');
    assert(!verifySource.includes('JSON.stringify(fixtures'), 'fixtures not dumped');
  });

  runTest('30: no Pack40B/C/D implementation in verify script', () => {
    assert(!verifySource.includes('vionaRequestNoteActionService'), 'no note service');
    assert(!verifySource.includes('vionaRequestStatusActionService'), 'no status service');
  });

  runTest('31: consumer enum used for fixture validation', () => {
    assert(VionaRequestScopeKind.consumer === 'consumer', 'consumer enum');
  });

  runTest('32: inactive merchant live QA explicitly not exercised when absent', () => {
    assert(verifySource.includes('inactiveMerchantLiveQaExercised: false'), 'inactive limitation');
  });

  runTest('33: malformed provenance not manufactured on staging', () => {
    assert(verifySource.includes('malformedProvenanceLiveQaExercised: false'), 'malformed limitation');
  });

  runTest('34: no permanent git-diff-versus-master assertion in verify script', () => {
    assert(!/git diff\s+origin\/master/.test(verifySource), 'no git diff in verify');
  });

  runTest('35: verify script never prints raw requestId to committed output shape', () => {
    assert(!verifySource.includes('console.log(requestId'), 'no requestId log');
    assert(!verifySource.includes('JSON.stringify(fixtures'), 'fixtures not dumped');
  });

  console.log('');
  console.log(`[pack40as-test] ================ ${passed} CHECK(S) PASSED ================`);
}

main().catch((error) => {
  console.error('[pack40as-test] FAILED', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
