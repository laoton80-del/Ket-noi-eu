/**
 * Pack33 — Global Omni-Compliance & Localization: unit test suite
 * (see docs/product/VIONA_PACK33_GLOBAL_COMPLIANCE_PLAN.md §8 for the mapped test plan).
 *
 * Covers: PII scrubber correctness, region-resolution fallback, audit-writer integration (fake
 * Prisma client), retention-job dry-run/idempotency, anonymization shape-preservation, dictionary
 * fallback chain, and — critically — a source-scan + functional regression proving the scrubber is
 * never applied to the real Twilio provider payload (plan §3.5, the hard separation-of-concerns
 * boundary).
 *
 * Run: npx tsx scripts/test-viona-pack33-global-compliance.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  resolveVionaPiiScrubRegion,
  scrubVionaPii,
  scrubVionaPiiDeep,
} from '../src/lib/viona/compliance/vionaPiiScrubber';
import {
  anonymizeVionaAuditEventRow,
  retentionWindowDays,
  shouldAnonymizeVionaAuditEventRow,
} from '../src/lib/viona/compliance/vionaAuditRetentionPolicy';
import {
  resolveVionaServiceMessage,
  VIONA_SERVICE_MESSAGE_LOCALES,
} from '../src/lib/viona/i18n/vionaServiceMessageDictionary';
import {
  appendVionaExecutionAuditEvent,
  type VionaExecutionAuditWritePrismaClient,
} from '../src/services/viona/vionaExecutionAuditWriteService';
import {
  executeVionaTwilioTestPocReal,
  type VionaTwilioHttpTransport,
  type VionaTwilioHttpTransportResult,
} from '../src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ---------------------------------------------------------------------------
// 1. Scrubber correctness
// ---------------------------------------------------------------------------

function testScrubberMasksPhoneEmailAndCard(): void {
  const result = scrubVionaPii({
    countryCode: null,
    text: 'Contact me at jane.doe@example.com or +15005550006, card 4111111111111111.',
  });
  assert(!result.scrubbedText.includes('jane.doe@example.com'), 'test 1: raw email must not survive scrubbing');
  assert(!result.scrubbedText.includes('+15005550006'), 'test 1: raw phone must not survive scrubbing');
  assert(!result.scrubbedText.includes('4111111111111111'), 'test 1: raw card PAN must not survive scrubbing');
  assert(result.scrubbedText.includes('[REDACTED_EMAIL]'), 'test 1: email replacement token must be present');
  assert(result.scrubbedText.includes('[REDACTED_PHONE]'), 'test 1: phone replacement token must be present');
  assert(result.scrubbedText.includes('[REDACTED_CARD]'), 'test 1: card replacement token must be present');
  assert(result.matchedRuleNames.includes('email'), 'test 1: matchedRuleNames must include "email"');
  assert(result.matchedRuleNames.includes('e164_phone'), 'test 1: matchedRuleNames must include "e164_phone"');
  assert(result.matchedRuleNames.includes('card_pan'), 'test 1: matchedRuleNames must include "card_pan"');
}

function testScrubberLeavesNonPiiTextUnchanged(): void {
  const text = 'The execution plan was denied because the request status is not eligible.';
  const result = scrubVionaPii({ countryCode: 'CZ', text });
  assert(result.scrubbedText === text, 'test 2: non-PII text must pass through byte-for-byte unchanged');
  assert(result.matchedRuleNames.length === 0, 'test 2: matchedRuleNames must be empty for non-PII text');
}

function testScrubberDoesNotTagNonLuhnDigitStringsAsCard(): void {
  // A 16-digit string that fails the Luhn checksum (a typical requestId/idempotencyKey shape)
  // must never be tagged as `card_pan` specifically — avoids mis-classifying operationally useful
  // IDs as payment-card data. (It may still be conservatively masked by the separate, looser
  // `e164_phone` heuristic — that overlap is expected and is a `matchedRuleNames` concern, not a
  // card-PAN false positive.)
  const notACard = '1234567890123456'; // fails Luhn
  const result = scrubVionaPii({ countryCode: null, text: `ref=${notACard}` });
  assert(!result.matchedRuleNames.includes('card_pan'), 'test 3: a non-Luhn-valid 16-digit string must never be tagged as card_pan');
}

function testScrubberDeepWalksNestedPayload(): void {
  const payload = {
    outcome: 'succeeded',
    detail: { fromNumber: '+15005550006', notes: ['contact jane@example.com', 'no pii here'] },
    attempts: 2,
  };
  const scrubbed = scrubVionaPiiDeep(payload, null) as typeof payload;
  assert(!JSON.stringify(scrubbed).includes('+15005550006'), 'test 4: nested string leaf phone must be scrubbed');
  assert(!JSON.stringify(scrubbed).includes('jane@example.com'), 'test 4: nested array string leaf email must be scrubbed');
  assert(scrubbed.attempts === 2, 'test 4: non-string primitives must be preserved unchanged');
  assert(Array.isArray(scrubbed.detail.notes) && scrubbed.detail.notes.length === 2, 'test 4: array shape must be preserved');
}

// ---------------------------------------------------------------------------
// 2. Region resolution fallback
// ---------------------------------------------------------------------------

function testRegionResolutionFallback(): void {
  assert(resolveVionaPiiScrubRegion(null) === 'default', 'test 5: null countryCode must resolve to default');
  assert(resolveVionaPiiScrubRegion(undefined) === 'default', 'test 5: undefined countryCode must resolve to default');
  assert(resolveVionaPiiScrubRegion('') === 'default', 'test 5: empty countryCode must resolve to default');
  assert(resolveVionaPiiScrubRegion('zz') === 'default', 'test 5: unknown countryCode must resolve to default');
  assert(resolveVionaPiiScrubRegion('de') === 'eu_gdpr', 'test 5: lowercase "de" must resolve to eu_gdpr (case-insensitive)');
  assert(resolveVionaPiiScrubRegion('US') === 'us_ccpa', 'test 5: "US" must resolve to us_ccpa');
  assert(resolveVionaPiiScrubRegion('BR') === 'br_lgpd', 'test 5: "BR" must resolve to br_lgpd');
  assert(resolveVionaPiiScrubRegion('JP') === 'jp_appi', 'test 5: "JP" must resolve to jp_appi');
}

function testRegionAwareRuleTableVaries(): void {
  const ssnText = 'ssn 123-45-6789 on file';
  const usResult = scrubVionaPii({ countryCode: 'US', text: ssnText });
  const deResult = scrubVionaPii({ countryCode: 'DE', text: ssnText });
  assert(usResult.matchedRuleNames.includes('ssn_us'), 'test 6: the SSN rule must apply for us_ccpa');
  assert(!deResult.matchedRuleNames.includes('ssn_us'), 'test 6: the SSN rule must NOT apply for eu_gdpr — rule table, not call site, varies by region');
}

// ---------------------------------------------------------------------------
// 3. Audit-writer integration (fake Prisma client)
// ---------------------------------------------------------------------------

async function testAuditWriterScrubsBeforePersisting(): Promise<void> {
  const persistedRows: Array<{ message: string | null; payloadJson: unknown; retentionRegion: string | null }> = [];
  const fakeClient: VionaExecutionAuditWritePrismaClient = {
    vionaRequestAuditEvent: {
      create: (async ({ data }: any) => {
        persistedRows.push({
          message: data.message ?? null,
          payloadJson: data.payloadJson ?? null,
          retentionRegion: data.retentionRegion ?? null,
        });
        return { id: 'fake-audit-1' };
      }) as any,
    },
  } as unknown as VionaExecutionAuditWritePrismaClient;

  const result = await appendVionaExecutionAuditEvent(
    {
      requestId: 'req-pack33-1',
      eventType: 'executionRealFailedBounded',
      message: 'Contact +15005550006 for support.',
      payloadJson: { fromNumber: '+15005550006', notes: 'ok' },
      countryCode: 'DE',
    },
    fakeClient,
  );

  assert(result.ok === true, 'test 7: audit write must succeed against the fake client');
  assert(persistedRows.length === 1, 'test 7: exactly one row must be persisted');
  const row = persistedRows[0]!;
  assert(!String(row.message).includes('+15005550006'), 'test 7: persisted message must not contain the raw phone number');
  assert(!JSON.stringify(row.payloadJson).includes('+15005550006'), 'test 7: persisted payloadJson must not contain the raw phone number');
  assert(row.retentionRegion === 'eu_gdpr', 'test 7: retentionRegion must be resolved and frozen onto the row (DE -> eu_gdpr)');
}

async function testAuditWriterDefaultsToStrictestRegionWhenCountryCodeOmitted(): Promise<void> {
  const persistedRows: Array<{ retentionRegion: string | null }> = [];
  const fakeClient: VionaExecutionAuditWritePrismaClient = {
    vionaRequestAuditEvent: {
      create: (async ({ data }: any) => {
        persistedRows.push({ retentionRegion: data.retentionRegion ?? null });
        return { id: 'fake-audit-2' };
      }) as any,
    },
  } as unknown as VionaExecutionAuditWritePrismaClient;

  await appendVionaExecutionAuditEvent(
    { requestId: 'req-pack33-2', eventType: 'executionRealAttempted', message: 'no country code supplied' },
    fakeClient,
  );

  assert(persistedRows[0]!.retentionRegion === 'default', 'test 8: omitting countryCode must resolve to the strictest default region, never "no region"');
}

// ---------------------------------------------------------------------------
// 4 & 5. Retention job: eligibility, idempotency, shape-preservation
// ---------------------------------------------------------------------------

function testRetentionEligibilityRespectsWindowAndIdempotency(): void {
  const now = new Date('2026-07-13T00:00:00.000Z');
  const region = 'eu_gdpr';
  const windowDays = retentionWindowDays(region);

  const freshRow = { retentionRegion: region, createdAt: new Date(now.getTime() - (windowDays - 1) * 86_400_000), anonymizedAt: null };
  const staleRow = { retentionRegion: region, createdAt: new Date(now.getTime() - (windowDays + 1) * 86_400_000), anonymizedAt: null };
  const alreadyAnonymizedRow = { retentionRegion: region, createdAt: new Date(now.getTime() - (windowDays + 10) * 86_400_000), anonymizedAt: new Date('2026-01-01') };

  assert(!shouldAnonymizeVionaAuditEventRow(freshRow, now), 'test 9: a row still inside its retention window must not be eligible');
  assert(shouldAnonymizeVionaAuditEventRow(staleRow, now), 'test 9: a row past its retention window must be eligible');
  assert(!shouldAnonymizeVionaAuditEventRow(alreadyAnonymizedRow, now), 'test 9: an already-anonymized row must never be re-selected (idempotency)');
}

function testRetentionUnknownRegionFallsBackToDefaultWindow(): void {
  const now = new Date('2026-07-13T00:00:00.000Z');
  const defaultWindow = retentionWindowDays('default');
  const row = { retentionRegion: 'not_a_real_region', createdAt: new Date(now.getTime() - (defaultWindow + 1) * 86_400_000), anonymizedAt: null };
  assert(shouldAnonymizeVionaAuditEventRow(row, now), 'test 10: an unrecognized retentionRegion string must fall back to the default window, not crash or skip');
}

function testAnonymizationPreservesShapeAndRemovesContent(): void {
  const input = {
    message: 'Call +15005550006 now',
    payloadJson: { fromNumber: '+15005550006', outcome: 'succeeded', attempts: 2 },
    retentionRegion: 'eu_gdpr',
  };
  const result = anonymizeVionaAuditEventRow(input, new Date('2026-12-01T00:00:00.000Z'));

  assert(!String(result.message).includes('+15005550006'), 'test 11: anonymized message must not contain the raw phone number');
  const payload = result.payloadJson as { fromNumber: string; outcome: string; attempts: number };
  assert(!payload.fromNumber.includes('+15005550006'), 'test 11: anonymized payloadJson.fromNumber must not contain the raw phone number');
  assert(payload.outcome === 'succeeded', 'test 11: non-PII string fields must be preserved unchanged');
  assert(payload.attempts === 2, 'test 11: non-string fields must be preserved unchanged');
  assert(result.anonymizedAt.getTime() === new Date('2026-12-01T00:00:00.000Z').getTime(), 'test 11: anonymizedAt must be set to the provided timestamp');
}

// ---------------------------------------------------------------------------
// 6. Dictionary fallback chain
// ---------------------------------------------------------------------------

function testDictionaryResolvesKnownLocaleAndInterpolates(): void {
  const message = resolveVionaServiceMessage('execution_plan_denied_policy', 'vi', { denialReason: 'blocked_lane' });
  assert(message.includes('blocked_lane'), 'test 12: {{denialReason}} must be interpolated into the resolved template');
  assert(message.includes('Kế hoạch'), 'test 12: the "vi" template must be used for locale "vi"');
}

function testDictionaryFallsBackToEnglishThenToLiteralId(): void {
  const knownIdUnknownLocale = resolveVionaServiceMessage(
    'dispatcher_rejected_unknown_tool',
    // Cast bypasses the type system deliberately — proving runtime robustness against a future
    // locale value that slips past a compile-time check (e.g. from an un-typed client).
    'xx' as never,
  );
  assert(
    knownIdUnknownLocale === resolveVionaServiceMessage('dispatcher_rejected_unknown_tool', 'en'),
    'test 13: an unrecognized locale must fall back to the English template',
  );

  const unknownId = resolveVionaServiceMessage('does_not_exist' as never, 'en');
  assert(unknownId === 'does_not_exist', 'test 13: an unrecognized messageId must fall back to the literal id string, never throw');
}

function testDictionaryHasEveryLocaleForEveryMessage(): void {
  const ids: readonly string[] = [
    'execution_plan_denied_operator_approval',
    'execution_plan_denied_policy',
    'escrow_hold_denied_insufficient_funds',
    'dispatcher_rejected_unknown_tool',
  ];
  for (const id of ids) {
    for (const locale of VIONA_SERVICE_MESSAGE_LOCALES) {
      const resolved = resolveVionaServiceMessage(id as never, locale);
      assert(resolved !== id, `test 14: message "${id}" must have a real translation for locale "${locale}", not fall back to the literal id`);
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Provider-payload non-interference — the critical separation-of-concerns regression
// ---------------------------------------------------------------------------

function testSourceScanRealProviderAdapterNeverImportsScrubber(): void {
  const adapterDir = path.join(__dirname, '..', 'src', 'lib', 'viona', 'realProviderAdapter');
  const files = fs.readdirSync(adapterDir).filter((f) => f.endsWith('.ts'));
  assert(files.length > 0, 'test 15: the real-provider adapter directory must exist and contain files (sanity check)');
  for (const file of files) {
    const contents = fs.readFileSync(path.join(adapterDir, file), 'utf8');
    assert(
      !contents.includes('vionaPiiScrubber') && !contents.includes('vionaAuditRetentionPolicy'),
      `test 15: ${file} must never import the Pack33 PII scrubber or retention policy — the real-provider outbound payload must never be scrubbed (plan §3.5)`,
    );
  }
}

async function testFakeTwilioTransportReceivesUnscrubbedRealPhoneNumber(): Promise<void> {
  let capturedBody: URLSearchParams | null = null;
  const transport: VionaTwilioHttpTransport = async ({ body }): Promise<VionaTwilioHttpTransportResult> => {
    capturedBody = body;
    return { status: 201, json: { sid: 'SMfakepack33' } };
  };

  const auditRows: Array<{ payloadJson: unknown }> = [];
  const fakeAuditWriter = (async (input: any) => {
    auditRows.push({ payloadJson: input.payloadJson });
    return { ok: true, auditEventId: `fake-${auditRows.length}` };
  }) as typeof appendVionaExecutionAuditEvent;

  const result = await executeVionaTwilioTestPocReal(
    {
      requestId: 'req-pack33-3',
      actionId: 'request.assign',
      intent: { fromNumber: '+15005550006', toNumber: '+15005550006', body: 'Pack33 non-interference check' },
      idempotencyKey: null,
      actorUserId: 'user-1',
      actorRoleLabel: 'requester',
    },
    {
      isEnabled: () => true,
      circuitBreakerCheck: async () => ({ state: 'closed' }),
      credentials: { accountSid: 'ACfake', authToken: 'tokenfake' },
      transport,
      auditWriter: fakeAuditWriter,
    },
  );

  assert(result.outcome.outcome === 'succeeded', 'test 16: the fake transport call must succeed');
  assert(capturedBody != null, 'test 16: the transport must have been called');
  assert(
    capturedBody!.get('From') === '+15005550006' && capturedBody!.get('To') === '+15005550006',
    'test 16 (CRITICAL): the real outbound Twilio payload must contain the UNMODIFIED, unscrubbed phone numbers — masking must never reach the provider call',
  );
}

async function main(): Promise<void> {
  testScrubberMasksPhoneEmailAndCard();
  testScrubberLeavesNonPiiTextUnchanged();
  testScrubberDoesNotTagNonLuhnDigitStringsAsCard();
  testScrubberDeepWalksNestedPayload();
  testRegionResolutionFallback();
  testRegionAwareRuleTableVaries();
  await testAuditWriterScrubsBeforePersisting();
  await testAuditWriterDefaultsToStrictestRegionWhenCountryCodeOmitted();
  testRetentionEligibilityRespectsWindowAndIdempotency();
  testRetentionUnknownRegionFallsBackToDefaultWindow();
  testAnonymizationPreservesShapeAndRemovesContent();
  testDictionaryResolvesKnownLocaleAndInterpolates();
  testDictionaryFallsBackToEnglishThenToLiteralId();
  testDictionaryHasEveryLocaleForEveryMessage();
  testSourceScanRealProviderAdapterNeverImportsScrubber();
  await testFakeTwilioTransportReceivesUnscrubbedRealPhoneNumber();

  console.log('PASS Pack33 global omni-compliance & localization tests (16/16)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
