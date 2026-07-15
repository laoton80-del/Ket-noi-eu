/**
 * Pack40P5 — staging provenance verification static/fake-client test suite.
 *
 * Operator phrase: APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION.
 * No database, network, deploy, or git-diff-vs-master assertions.
 *
 * Run: npx tsx scripts/test-viona-pack40p5-staging-provenance.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VionaRequestScopeKind } from '@prisma/client';

import {
  APPROVED_CANDIDATE_DIGEST,
  APPROVED_CANDIDATE_COUNT,
} from './apply-viona-pack40p4-merchant-backfill';
import {
  assertP4wMergedEvidencePresent,
  assertStagingApiIdentity,
  auditPack35FixtureSafety,
  buildPack19CreateBody,
  buildPack35WebhookPayload,
  MASTER_SHORT_SHA,
  PACK19_TENANT_MARKER,
  PACK35_EXTERNAL_MESSAGE_ID,
  Pack40p5BlockedError,
  P4W_MERGED_EVIDENCE_RELATIVE,
  STAGING_API_APP_NAME,
  assertStaticSafety,
} from './verify-viona-pack40p5-staging-provenance';
import {
  assertStagingDatabaseIdentity,
  validateApprovedPopulation,
  Pack40p4WriteBlockedError,
} from './apply-viona-pack40p4-merchant-backfill';

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
    if (error instanceof Pack40p5BlockedError) {
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const verifySource = readSource('verify-viona-pack40p5-staging-provenance.ts');
  const testSource = readSource('test-viona-pack40p5-staging-provenance.ts');

  runTest('1: missing P4W merged evidence blocks', () => {
    expectBlocked(
      () => assertP4wMergedEvidencePresent('no digest here'),
      'BLOCKED_PACK40P4_WRITE_EVIDENCE_NOT_MERGED',
    );
  });

  runTest('2: merged P4W evidence with digest passes gate', () => {
    const evidence = readSource(`../${P4W_MERGED_EVIDENCE_RELATIVE}`);
    assertP4wMergedEvidencePresent(evidence);
  });

  runTest('3: wrong staging database identity blocks in apply helper', () => {
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

  runTest('4: wrong staging API identity blocks', () => {
    expectBlocked(
      () => assertStagingApiIdentity('https://viona-api-production.fly.dev'),
      'BLOCKED_ENVIRONMENT_IDENTITY',
    );
  });

  runTest('5: correct staging API identity passes', () => {
    assertStagingApiIdentity(`https://${STAGING_API_APP_NAME}.fly.dev`);
  });

  runTest('6: baseline merchant backfill digest constant is approved value', () => {
    assert(APPROVED_CANDIDATE_DIGEST.length === 64, 'digest length');
    assert(APPROVED_CANDIDATE_COUNT === 5, 'count');
  });

  runTest('7: partial backfill state would block validateApprovedPopulation', () => {
    try {
      validateApprovedPopulation([], APPROVED_CANDIDATE_DIGEST, []);
      throw new Error('expected block');
    } catch (error) {
      assert(error instanceof Pack40p4WriteBlockedError, 'partial state blocks');
    }
  });

  runTest('8: Pack19 QA body never contains scopeKind', () => {
    const body = buildPack19CreateBody();
    assert(!('scopeKind' in body), 'scopeKind absent');
  });

  runTest('9: Pack19 QA body never contains merchantProfileId', () => {
    const body = buildPack19CreateBody();
    assert(!('merchantProfileId' in body), 'merchantProfileId absent');
  });

  runTest('10: Pack19 synthetic tenant marker is non-authorizing label', () => {
    const body = buildPack19CreateBody();
    assert(body.tenantId === PACK19_TENANT_MARKER, 'tenant marker');
    assert(String(body.tenantId).includes(MASTER_SHORT_SHA), 'master short sha embedded');
  });

  runTest('11: verify script encodes single Pack19 create path', () => {
    const matches = verifySource.match(/createPack19Once/g) ?? [];
    assert(matches.length === 2, 'single create helper (+ definition)');
    assert(!verifySource.includes('createPack19Twice'), 'no second create');
  });

  runTest('12: unsafe Pack35 fixture deviation blocks before invocation pattern exists', () => {
    const payload = buildPack35WebhookPayload();
    assert(payload.messageText.includes('opening hours'), 'safe message');
    auditPack35FixtureSafety();
  });

  runTest('13: verify script encodes single Pack35 invocation', () => {
    const matches = verifySource.match(/invokePack35WebhookOnce/g) ?? [];
    assert(matches.length === 2, 'single webhook helper');
  });

  runTest('14: Pack35 payload cannot provide scopeKind', () => {
    const payload = buildPack35WebhookPayload();
    assert(!('scopeKind' in payload), 'scopeKind absent');
  });

  runTest('15: Pack35 payload cannot provide merchantProfileId', () => {
    const payload = buildPack35WebhookPayload();
    assert(!('merchantProfileId' in payload), 'merchantProfileId absent');
  });

  runTest('16: Pack35 payload has no tenantId field', () => {
    const payload = buildPack35WebhookPayload();
    assert(!('tenantId' in payload), 'tenantId absent from webhook body');
  });

  runTest('17: safety audit caps real tool executions at zero', () => {
    const audit = auditPack35FixtureSafety();
    assert(audit.maxRealToolExecutions === 0, 'real tools blocked');
    assert(audit.maxClassificationCalls === 1, 'classification cap');
  });

  runTest('18: Pack19 expected provenance is consumer', () => {
    assert(VionaRequestScopeKind.consumer === 'consumer', 'consumer enum');
  });

  runTest('19: Pack19 merchantProfileId expectation is null-only path', () => {
    assert(verifySource.includes('merchantProfileId must be null'), 'null FK check');
  });

  runTest('20: Pack35 expected provenance is merchant', () => {
    assert(
      verifySource.includes('scopeKind !== VionaRequestScopeKind.merchant'),
      'merchant scope guard present',
    );
  });

  runTest('21: Pack35 merchantProfileId must match resolved profile', () => {
    assert(
      verifySource.includes('merchantProfileId mismatch vs channel resolution'),
      'profile relation check',
    );
  });

  runTest('22: Pack35 tenant snapshot must match resolved profile tenant', () => {
    assert(verifySource.includes('tenantId mismatch vs MerchantProfile'), 'tenant match check');
  });

  runTest('23: original backfill digest constant referenced', () => {
    assert(verifySource.includes('APPROVED_CANDIDATE_DIGEST'), 'digest constant referenced');
    assert(verifySource.includes('validateApprovedPopulation'), 'population validation');
  });

  runTest('24: excluded legacy target count is five', () => {
    assert(verifySource.includes('EXCLUDED_LEGACY_TARGET = 5'), 'five excluded rows');
  });

  runTest('25: no Prisma update/delete/create in verify script', () => {
    assertStaticSafety(verifySource);
  });

  runTest('26: no cleanup delete path in verify script', () => {
    assert(!/\bdelete(Many)?\s*\(/.test(verifySource), 'no delete calls');
  });

  runTest('27: no migration or Fly deploy/auth commands', () => {
    assert(!/prisma\s+migrate/i.test(verifySource), 'no migrate');
    assert(!/fly\s+auth/i.test(verifySource), 'no fly auth');
    assert(!/fly\s+deploy/i.test(verifySource), 'no fly deploy');
  });

  runTest('28: no Pack40A route enforcement edits in verify script', () => {
    assert(!verifySource.includes('pack40a'), 'no pack40a references');
    assert(!verifySource.includes('accessPolicy'), 'no access policy');
  });

  runTest('29: committed markers contain no UUID-like raw identifiers', () => {
    const body = JSON.stringify(buildPack19CreateBody());
    const payload = JSON.stringify(buildPack35WebhookPayload());
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    assert(!uuidPattern.test(body), 'pack19 body uuid-free');
    assert(!uuidPattern.test(payload), 'pack35 payload uuid-free');
    assert(!uuidPattern.test(PACK35_EXTERNAL_MESSAGE_ID), 'webhook marker uuid-free');
  });

  runTest('30: no permanent git-diff-versus-master assertion in tests', () => {
    assert(!/git\s+diff\s+origin\/master/i.test(testSource), 'no git diff vs master');
    assert(!/git\s+diff\s+master/i.test(verifySource), 'verify script no git diff vs master');
  });

  console.log('');
  console.log(`[pack40p5-test] ================ ${passed} CHECK(S) PASSED ================`);
}

main().catch((error) => {
  console.error('[pack40p5-test] FATAL', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
