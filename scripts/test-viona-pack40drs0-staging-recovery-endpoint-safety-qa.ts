/**
 * Pack40DRS0 — staging recovery endpoint safety QA static/fake-client tests.
 *
 * Operator phrase: APPROVE_PACK40DRS0_STAGING_RECOVERY_ENDPOINT_SAFETY_QA
 * No live network, staging POST, DB mutation, deploy, or provider call.
 *
 * Run: npx tsx scripts/test-viona-pack40drs0-staging-recovery-endpoint-safety-qa.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  assertPack40drdMergedEvidence,
  assertRecoverySourceBoundaries,
  assertStagingApiIdentity,
  assertStaticSafety,
  FORBIDDEN_PATTERNS,
  MAX_RECOVERY_POST,
  MIN_STAGING_RELEASE,
  PACK40DRD_EVIDENCE_RELATIVE,
  Pack40drs0BlockedError,
  recoveryPath,
  RECOVERY_ROUTE_TEMPLATE,
} from './verify-viona-pack40drs0-staging-recovery-endpoint-safety-qa';

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
    if (error instanceof Pack40drs0BlockedError) {
      assert(error.code === code, `expected ${code}, got ${error.code}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const verifySource = readSource('verify-viona-pack40drs0-staging-recovery-endpoint-safety-qa.ts');

  runTest('1. missing Pack40DRD merged evidence blocks', () => {
    expectBlocked(
      () => assertPack40drdMergedEvidence('no deployed marker'),
      'BLOCKED_PACK40DRD_EVIDENCE_NOT_MERGED',
    );
  });

  runTest('2. merged Pack40DRD evidence with markers passes', () => {
    const evidence = readSource(`../${PACK40DRD_EVIDENCE_RELATIVE}`);
    assertPack40drdMergedEvidence(evidence);
  });

  runTest('3. wrong staging API host blocks', () => {
    expectBlocked(
      () => assertStagingApiIdentity('https://viona-api-production.fly.dev'),
      'BLOCKED_ENVIRONMENT_IDENTITY',
    );
  });

  runTest('4. staging API identity accepts staging host', () => {
    assertStagingApiIdentity('https://viona-api-staging-eu.fly.dev');
  });

  runTest('5. verify script static safety passes', () => {
    assertStaticSafety(verifySource);
  });

  runTest('6. verify script forbids mutating Prisma patterns', () => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      assert(!pattern.test(verifySource) || pattern.source.includes('postRecovery'), `pattern ok`);
    }
    assert(!/\bprisma\.\w+\.create\s*\(/.test(verifySource), 'no prisma create');
    assert(!/\bprisma\.\w+\.update\s*\(/.test(verifySource), 'no prisma update');
    assert(!/\bprisma\.\w+\.delete\s*\(/.test(verifySource), 'no prisma delete');
    assert(!/fly\s+deploy/i.test(verifySource), 'no fly deploy');
    assert(!/prisma\s+migrate/i.test(verifySource), 'no migrate');
  });

  runTest('7. max recovery POST cap is 4', () => {
    assert(MAX_RECOVERY_POST === 4, 'max posts must be 4');
    assert(verifySource.includes('MAX_RECOVERY_POST = 4'), 'literal cap 4');
  });

  runTest('8. min staging release is 28', () => {
    assert(MIN_STAGING_RELEASE === 28, 'min release v28');
  });

  runTest('9. recovery route template matches reviewed path', () => {
    assert(
      RECOVERY_ROUTE_TEMPLATE === '/api/internal/viona/execution-attempts/:attemptId/recovery',
      'route template',
    );
    assert(
      recoveryPath('00000000-0000-0000-0000-000000000001').includes(
        '/api/internal/viona/execution-attempts/',
      ),
      'path helper',
    );
  });

  runTest('10. matrix covers A/B/C/D only', () => {
    assert(verifySource.includes('// A — unauthenticated'), 'case A');
    assert(verifySource.includes('// B — authenticated non-admin'), 'case B');
    assert(verifySource.includes('// C — ADMIN + nonexistent'), 'case C');
    assert(verifySource.includes('// D — ADMIN + completed terminal no-op'), 'case D');
    assert(!verifySource.includes('non-terminal'), 'no non-terminal recovery case');
    assert(!verifySource.includes('providerPending'), 'no providerPending recovery case');
    assert(!verifySource.includes('outcomeUncertain'), 'no uncertain recovery case');
  });

  runTest('11. delta assertions require zeros', () => {
    assert(verifySource.includes('attemptDelta: 0'), 'attempt delta 0');
    assert(verifySource.includes('providerLookupCount: 0'), 'lookup count 0');
    assert(verifySource.includes('providerSendCount: 0'), 'send count 0');
    assert(verifySource.includes('leaseGenerationChange: 0'), 'lease gen 0');
    assert(verifySource.includes('assertNoGlobalDelta'), 'global delta helper');
    assert(verifySource.includes('assertNoAttemptDelta'), 'attempt delta helper');
  });

  runTest('12. Role.ADMIN required for ops fixture', () => {
    assert(verifySource.includes('Role.ADMIN'), 'ADMIN role check');
    assert(verifySource.includes('superAdminMiddleware') || verifySource.includes('ops-admin'), 'ops gate');
    assert(verifySource.includes('VIONA_PILOT_OPS_ADMIN_PHONE'), 'ops phone env');
  });

  runTest('13. completed attempt discovery is read-only findMany/findUnique', () => {
    assert(verifySource.includes('discoverCompletedAttempt'), 'discovery helper');
    assert(verifySource.includes("state: VionaRequestExecutionAttemptState.completed"), 'completed only');
    assert(!verifySource.includes('acquireRecoveryLease('), 'no lease acquire call');
    assert(!verifySource.includes('reconcileProviderOutcomeForRecovery('), 'no provider recon call');
  });

  runTest('14. recovery source boundaries pass on master tree', () => {
    assertRecoverySourceBoundaries();
  });

  runTest('15. no scheduler/worker in recovery wiring', () => {
    const routes = readSource('../src/routes/internalRoutes.ts');
    assert(!/setInterval|node-cron|Bull|agenda/i.test(routes), 'no scheduler in routes');
    const coordinator = readSource('../src/services/viona/vionaRequestExecutionRecoveryCoordinator.ts');
    assert(!coordinator.includes('findMany'), 'coordinator no scan');
  });

  runTest('16. response sanitization checks present', () => {
    assert(verifySource.includes('assertSanitizedBody'), 'sanitization helper');
    assert(verifySource.includes('already_terminal'), 'terminal category');
    assert(verifySource.includes('provider reference leaked'), 'SID leak guard');
  });

  console.log(`\nPack40DRS0 static suite: ${passed} passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
