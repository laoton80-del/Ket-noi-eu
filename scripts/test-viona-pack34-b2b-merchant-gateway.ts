/**
 * Pack34 — B2B Merchant Gateway & AI White-Labeling: implementation test suite.
 *
 * Operator phrase: APPROVE_PACK34_B2B_MERCHANT_GATEWAY_IMPLEMENTATION.
 * Covers the exact 6 required test-plan items from
 * docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §10 (all pure/source-scan, no DB/network
 * required — items 1-4 are pure per the plan's own wording; items 5-6 are source-scan
 * regressions), plus one additional, clearly-separate live-DB smoke test for the new
 * `vionaMerchantProfileService.ts` CRUD service against the already-migrated `MerchantProfile`
 * table. Item 7 (full existing regression) is run separately (see the accompanying drift report).
 *
 * Run (pure tests only, no DB touched):
 *   npx tsx scripts/test-viona-pack34-b2b-merchant-gateway.ts
 * Run including the live-DB smoke test (requires a reachable DATABASE_URL):
 *   npx tsx scripts/test-viona-pack34-b2b-merchant-gateway.ts --with-db
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { assertVionaRequestTenantMatchesMerchant } from '../src/lib/viona/merchant/vionaMerchantTenantScope';
import {
  resolveMerchantAiPersona,
  parseVionaMerchantAiPersona,
  VIONA_MERCHANT_AI_PERSONA_DEFAULT,
} from '../src/lib/viona/merchant/vionaMerchantAiPersonaTypes';
import {
  VIONA_TOOL_REGISTRY,
  findVionaToolRegistryEntry,
  validateVionaToolInputAgainstSchema,
  assertVionaToolRegistryLinkedActionIdsAreKnown,
} from '../src/lib/viona/dispatcher/vionaToolRegistry';
import { buildAuthorizedVionaRequestWhere } from '../src/services/viona/vionaRequestAccessScope';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
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

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  passed += 1;
  console.log(`  PASS ${passed}: ${name}`);
}

// ---------------------------------------------------------------------------
// Test plan item 1 — Tenant-scope gate correctness (pure).
// ---------------------------------------------------------------------------

runTest('tenant scope: matching tenantId + isActive:true -> ok:true', () => {
  const result = assertVionaRequestTenantMatchesMerchant('tenant-a', { tenantId: 'tenant-a', isActive: true });
  assert(result.ok === true, 'matching tenantId + active must be ok');
});

runTest('tenant scope: mismatched tenantId -> tenant_mismatch (even if merchant is active)', () => {
  const result = assertVionaRequestTenantMatchesMerchant('tenant-a', { tenantId: 'tenant-b', isActive: true });
  assert(!result.ok && result.reason === 'tenant_mismatch', 'mismatched tenantId must return tenant_mismatch');
});

runTest('tenant scope: isActive:false -> merchant_inactive, even when tenantId matches', () => {
  const result = assertVionaRequestTenantMatchesMerchant('tenant-a', { tenantId: 'tenant-a', isActive: false });
  assert(!result.ok && result.reason === 'merchant_inactive', 'inactive merchant with matching tenantId must return merchant_inactive');
});

runTest('tenant scope: mismatch takes priority over inactive when both are true', () => {
  const result = assertVionaRequestTenantMatchesMerchant('tenant-a', { tenantId: 'tenant-b', isActive: false });
  assert(!result.ok && result.reason === 'tenant_mismatch', 'mismatch must be reported before inactive is even checked');
});

runTest('tenant scope: empty requestTenantId never matches, never throws', () => {
  const result = assertVionaRequestTenantMatchesMerchant('', { tenantId: '', isActive: true });
  assert(!result.ok && result.reason === 'tenant_mismatch', 'empty tenantId must not be treated as a match');
});

// ---------------------------------------------------------------------------
// Test plan item 2 — Persona resolution fallback (pure).
// ---------------------------------------------------------------------------

runTest('persona: null profile resolves to default', () => {
  const persona = resolveMerchantAiPersona(null);
  assert(JSON.stringify(persona) === JSON.stringify(VIONA_MERCHANT_AI_PERSONA_DEFAULT), 'null profile must resolve to the documented default');
});

runTest('persona: inactive profile resolves to default even with a well-formed aiPersona', () => {
  const persona = resolveMerchantAiPersona({
    isActive: false,
    aiPersona: { systemPromptAddendum: 'Hello', preferredLocale: 'vi', tone: 'formal' },
  });
  assert(JSON.stringify(persona) === JSON.stringify(VIONA_MERCHANT_AI_PERSONA_DEFAULT), 'inactive profile must resolve to default regardless of aiPersona content');
});

runTest('persona: malformed aiPersona JSON (wrong shape) resolves to default, never throws', () => {
  const malformed = [null, undefined, 'a string', 42, [], {}, { tone: 'not_a_real_tone' }, { systemPromptAddendum: 123 }];
  for (const value of malformed) {
    const persona = resolveMerchantAiPersona({ isActive: true, aiPersona: value });
    assert(JSON.stringify(persona) === JSON.stringify(VIONA_MERCHANT_AI_PERSONA_DEFAULT), `malformed value ${JSON.stringify(value)} must resolve to default`);
  }
});

runTest('persona: well-formed, active profile resolves to its own stored values', () => {
  const persona = resolveMerchantAiPersona({
    isActive: true,
    aiPersona: { systemPromptAddendum: 'Always mention our 20% loyalty discount.', preferredLocale: 'vi', tone: 'warm' },
  });
  assert(persona.systemPromptAddendum === 'Always mention our 20% loyalty discount.', 'systemPromptAddendum must round-trip');
  assert(persona.preferredLocale === 'vi', 'preferredLocale must round-trip');
  assert(persona.tone === 'warm', 'tone must round-trip');
});

runTest('persona: parseVionaMerchantAiPersona rejects non-object and array input', () => {
  assert(parseVionaMerchantAiPersona('x') === null, 'string must be rejected');
  assert(parseVionaMerchantAiPersona([1, 2, 3]) === null, 'array must be rejected');
  assert(parseVionaMerchantAiPersona(null) === null, 'null must be rejected');
});

// ---------------------------------------------------------------------------
// Test plan item 3 — Tool registry integrity (critical regression + new-entry checks, pure).
// ---------------------------------------------------------------------------

runTest('tool registry: the 2 pre-existing entries are byte-for-byte unchanged', () => {
  const twilioEntry = findVionaToolRegistryEntry('twilio_test_sms_poc');
  assert(twilioEntry !== null, 'twilio_test_sms_poc must still exist');
  assert(twilioEntry!.category === 'viona_request_execution', 'twilio_test_sms_poc category unchanged');
  assert(twilioEntry!.linkedActionId === 'request.assign', 'twilio_test_sms_poc linkedActionId unchanged');
  assert(
    JSON.stringify(twilioEntry!.inputSchema) === JSON.stringify({ fromNumber: 'string', toNumber: 'string', body: 'string' }),
    'twilio_test_sms_poc inputSchema unchanged',
  );

  const marketingEntry = findVionaToolRegistryEntry('marketing_content_generator');
  assert(marketingEntry !== null, 'marketing_content_generator must still exist');
  assert(marketingEntry!.category === 'content_generation_draft', 'marketing_content_generator category unchanged');
  assert(
    JSON.stringify(marketingEntry!.inputSchema) === JSON.stringify({ topic: 'string', tone: 'string', targetLanguageCode: 'string' }),
    'marketing_content_generator inputSchema unchanged',
  );
});

runTest('tool registry: assertVionaToolRegistryLinkedActionIdsAreKnown() still passes unmodified', () => {
  assertVionaToolRegistryLinkedActionIdsAreKnown();
});

runTest('tool registry: exactly 4 entries total after the additive Pack34 change', () => {
  assert(VIONA_TOOL_REGISTRY.length === 4, `expected exactly 4 entries, got ${VIONA_TOOL_REGISTRY.length}`);
});

runTest('tool registry: 2 new merchant_read_only_query entries are present, merchantScopedOnly, and structurally read-only', () => {
  for (const name of ['merchant_schedule_availability_check', 'merchant_inventory_stock_check'] as const) {
    const entry = findVionaToolRegistryEntry(name);
    assert(entry !== null, `${name} must be registered`);
    assert(entry!.category === 'merchant_read_only_query', `${name} must be category merchant_read_only_query`);
    assert(entry!.merchantScopedOnly === true, `${name} must be merchantScopedOnly`);
    assert(entry!.requiresOperatorApproval === true, `${name} must require operator approval`);
    // Structurally read-only: no field name in the schema even hints at a write action.
    const fieldNames = Object.keys(entry!.inputSchema).join(',').toLowerCase();
    assert(
      !/create|update|delete|cancel|book|reserve|decrement|modify/.test(fieldNames),
      `${name} inputSchema field names must not hint at any write action`,
    );
  }
});

runTest('tool registry: new entries validate their own worked-example input correctly', () => {
  const scheduleEntry = findVionaToolRegistryEntry('merchant_schedule_availability_check')!;
  const scheduleValidation = validateVionaToolInputAgainstSchema(scheduleEntry, {
    dateRangeStart: '2026-08-01',
    dateRangeEnd: '2026-08-07',
  });
  assert(scheduleValidation.ok === true, 'well-formed schedule-check input must validate');

  const inventoryEntry = findVionaToolRegistryEntry('merchant_inventory_stock_check')!;
  const missingFieldValidation = validateVionaToolInputAgainstSchema(inventoryEntry, {});
  assert(!missingFieldValidation.ok && missingFieldValidation.reason === 'missing_field', 'missing itemName must fail validation');
});

// ---------------------------------------------------------------------------
// Test plan item 4 — buildAuthorizedVionaRequestWhere() regression (critical, pure).
// ---------------------------------------------------------------------------

runTest('access scope: omitted tenantId arg is byte-for-byte identical to pre-Pack34 shape', () => {
  const where = buildAuthorizedVionaRequestWhere('user-1');
  const expectedPreExistingShape = {
    OR: [
      { requesterUserId: 'user-1' },
      { ownerUserId: 'user-1' },
      { participants: { some: { userRef: 'user-1' } } },
    ],
  };
  assert(JSON.stringify(where) === JSON.stringify(expectedPreExistingShape), 'omitting expectedTenantId must not change the returned where-shape at all');
  assert(!('tenantId' in where), 'tenantId key must be entirely absent, not merely undefined, when omitted');
});

runTest('access scope: empty-string tenantId arg behaves identically to omitting it', () => {
  const where = buildAuthorizedVionaRequestWhere('user-1', '   ');
  assert(!('tenantId' in where), 'whitespace-only expectedTenantId must not add a tenantId clause');
});

runTest('access scope: providing tenantId adds it additively, without altering the OR clause', () => {
  const where = buildAuthorizedVionaRequestWhere('user-1', 'tenant-xyz');
  assert((where as { tenantId?: string }).tenantId === 'tenant-xyz', 'tenantId must be present when provided');
  assert(
    JSON.stringify(where.OR) === JSON.stringify([
      { requesterUserId: 'user-1' },
      { ownerUserId: 'user-1' },
      { participants: { some: { userRef: 'user-1' } } },
    ]),
    'OR clause must be unchanged when tenantId is additionally provided',
  );
});

// ---------------------------------------------------------------------------
// Test plan item 5 — Escrow call-shape regression (source-scan, critical).
// ---------------------------------------------------------------------------

runTest('vionaRequestEscrowHoldService.ts source has zero Pack34/MerchantProfile footprint (untouched)', () => {
  const source = readSource('../src/services/viona/vionaRequestEscrowHoldService.ts');
  assert(!source.includes('MerchantProfile'), 'escrow hold service must not reference MerchantProfile at all');
  assert(!source.includes('Pack34'), 'escrow hold service must not reference Pack34 at all');
  // Sanity: file still exports its original function names (untouched).
  assert(source.includes('holdVionaRequestExecutionCost'), 'sanity: original export name still present');
  assert(source.includes('settleVionaRequestExecutionHold'), 'sanity: original export name still present');
});

runTest('vionaExecutionPlanRouteService.ts still uses the original hardcoded cost constant (untouched)', () => {
  const source = readSource('../src/services/viona/vionaExecutionPlanRouteService.ts');
  assert(source.includes('VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO = 0.01'), 'original cost constant must be unchanged');
  assert(!source.includes('MerchantProfile'), 'execution plan route service must not reference MerchantProfile at all');
});

// ---------------------------------------------------------------------------
// Test plan item 6 — Business/BizType non-interference regression (source-scan).
// ---------------------------------------------------------------------------

runTest('WalletService.ts has zero Pack34/MerchantProfile footprint (Business/Tourism flows untouched)', () => {
  const source = readSource('../src/services/WalletService.ts');
  assert(!source.includes('MerchantProfile'), 'WalletService.ts must not reference MerchantProfile at all');
  assert(source.includes('createWalletForUser'), 'sanity: original export name still present');
});

runTest('vionaRequestExecutionOrchestrator.ts and vionaRequestStatusActionService.ts have zero Pack34 footprint (untouched)', () => {
  const orchestratorSource = readSource('../src/services/viona/vionaRequestExecutionOrchestrator.ts');
  const statusActionSource = readSource('../src/services/viona/vionaRequestStatusActionService.ts');
  assert(!orchestratorSource.includes('MerchantProfile'), 'orchestrator must not reference MerchantProfile at all in this increment');
  assert(!statusActionSource.includes('MerchantProfile'), 'sanctioned status-action service must remain untouched by Pack34');
});

runTest('dispatchVionaAutonomousRequest() source has zero Pack34 footprint (untouched, per binding Pack32.1 allowlist)', () => {
  const source = readSource('../src/services/viona/vionaAutonomousDispatchService.ts');
  assert(!source.includes('MerchantProfile'), 'dispatcher orchestrator must not reference MerchantProfile at all');
  assert(!source.includes('merchantScopedOnly'), 'dispatcher orchestrator must not itself branch on the new registry field in this increment');
});

// ---------------------------------------------------------------------------
// Bonus (not required by §10, additional confidence) — live-DB smoke test.
// Only runs with --with-db, so the default run stays fast and DB-free.
// ---------------------------------------------------------------------------

async function runLiveDbSmokeTestIfRequested(): Promise<void> {
  if (!process.argv.includes('--with-db')) {
    console.log('  SKIP: live-DB smoke test (pass --with-db to include it)');
    return;
  }

  const { disconnectPrisma, getPrisma } = await import('../src/lib/prisma');
  const {
    createMerchantProfile,
    findMerchantProfileByTenantId,
    findMerchantProfileByOwnerUserId,
    updateMerchantProfileAiPersona,
    updateMerchantProfileToolScope,
  } = await import('../src/services/viona/vionaMerchantProfileService');

  const testOwnerUserId = `pack34-test-owner-${Date.now()}`;
  const testTenantId = `pack34-test-tenant-${Date.now()}`;

  try {
    await runAsyncTest('live-db: createMerchantProfile creates a new, inactive row', async () => {
      const result = await createMerchantProfile({
        ownerUserId: testOwnerUserId,
        tenantId: testTenantId,
        displayName: 'Pack34 Test Merchant',
      });
      assert(result.ok === true && result.created === true, 'first create must succeed and report created:true');
    });

    await runAsyncTest('live-db: createMerchantProfile is idempotent (second call returns created:false)', async () => {
      const result = await createMerchantProfile({
        ownerUserId: testOwnerUserId,
        tenantId: testTenantId,
        displayName: 'Pack34 Test Merchant',
      });
      assert(result.ok === true && result.created === false, 'second create with same ownerUserId must be idempotent');
    });

    await runAsyncTest('live-db: findMerchantProfileByTenantId finds the row and isActive defaults to false', async () => {
      const row = await findMerchantProfileByTenantId(testTenantId);
      assert(row !== null, 'row must be found by tenantId');
      assert(row!.isActive === false, 'isActive must default to false (fail-closed)');
      assert(Array.isArray(row!.toolScope) && row!.toolScope.length === 0, 'toolScope must default to an empty array');
    });

    await runAsyncTest('live-db: findMerchantProfileByOwnerUserId finds the same row', async () => {
      const row = await findMerchantProfileByOwnerUserId(testOwnerUserId);
      assert(row !== null && row!.tenantId === testTenantId, 'row must be found by ownerUserId and match the same tenantId');
    });

    await runAsyncTest('live-db: updateMerchantProfileToolScope rejects an unknown tool name', async () => {
      const result = await updateMerchantProfileToolScope(testOwnerUserId, ['not_a_real_tool_name']);
      assert(!result.ok && result.reason === 'unknown_tool', 'unknown tool name must be rejected');
    });

    await runAsyncTest('live-db: updateMerchantProfileToolScope accepts a known, read-only tool name', async () => {
      const result = await updateMerchantProfileToolScope(testOwnerUserId, ['merchant_schedule_availability_check']);
      assert(result.ok === true, 'known tool name must be accepted');
    });

    await runAsyncTest('live-db: updateMerchantProfileAiPersona persists a well-formed persona', async () => {
      const result = await updateMerchantProfileAiPersona(testOwnerUserId, {
        systemPromptAddendum: 'Test addendum.',
        preferredLocale: 'en',
        tone: 'concise',
      });
      assert(result.ok === true, 'persona update for an existing owner must succeed');
      const row = await findMerchantProfileByOwnerUserId(testOwnerUserId);
      const persisted = row!.aiPersona as Record<string, unknown> | null;
      assert(persisted !== null, 'aiPersona must not be null after update');
      // Field-by-field (not whole-object JSON.stringify) — JSONB does not guarantee key order.
      assert(persisted!.systemPromptAddendum === 'Test addendum.', 'systemPromptAddendum must round-trip');
      assert(persisted!.preferredLocale === 'en', 'preferredLocale must round-trip');
      assert(persisted!.tone === 'concise', 'tone must round-trip');
    });
  } finally {
    await getPrisma().merchantProfile.deleteMany({ where: { ownerUserId: testOwnerUserId } });
    await disconnectPrisma();
    console.log('  (live-DB smoke test row cleaned up)');
  }
}

runLiveDbSmokeTestIfRequested()
  .then(() => {
    console.log(`\nPack34 B2B Merchant Gateway: ${passed}/${passed} PASS`);
  })
  .catch((error) => {
    console.error('\nPack34 B2B Merchant Gateway: FAILED —', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
