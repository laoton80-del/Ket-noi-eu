/**
 * Pack32.1 — Marketing Content Generator Tool Expansion tests, no real LLM call, no real DB, no
 * real social-platform call.
 *
 * Covers the required test plan from
 * docs/internal-ops/VIONA_PACK32_1_MARKETING_CONTENT_POC_PLAN.md §7, adapted to this repo's
 * existing `tsx` + `assert`-based testing pattern (mirrors
 * `scripts/test-viona-pack32-autonomous-dispatcher.ts`). Every test injects a **fake** `callLlm`
 * (never calling OpenAI) and, where generation itself is exercised, a **fake** `generateDraft`
 * (never calling OpenAI or a real Prisma client).
 *
 * Test list (14 total):
 *   1.  Happy path: valid tool + valid input + confidence >= threshold, faked draft generation -> ok:true
 *   2.  Hallucinated/unregistered toolName                                    -> unknown_tool
 *   3.  Category isolation (CRITICAL): classification returns the REAL twilio_test_sms_poc tool
 *       via this content-only entrypoint                                      -> wrong_tool_category,
 *       generateDraft never called
 *   4.  toolInputRaw missing a required field (topic)                        -> tool_input_schema_invalid
 *   5.  LLM response is not valid JSON                                       -> response_not_valid_json
 *   6.  Valid shape but confidence below threshold                            -> low_confidence
 *   7.  Injected callLlm throws                                               -> llm_call_failed, never throws out
 *   8.  Injected generateDraft throws                                        -> content_generation_failed
 *   9.  Source-scan: generateVionaMarketingContentDraft only ever persists MarketingPostStatus.DRAFT
 *   10. Source-scan (CRITICAL): new files never reference publishToFacebookPage/FacebookGraphAPI
 *   11. Source-scan (CRITICAL): the new orchestrator never imports the Pack31/Pack30D-4 pipeline
 *   12. Registry integrity: assertVionaToolRegistryLinkedActionIdsAreKnown() still passes (2 entries)
 *   13. Registry: exact-match lookup for both entries resolves to the expected category
 *   14. Source-scan: no LangChain/LlamaIndex/agent-framework import; package.json diff-safe
 *
 * Run: npx tsx scripts/test-viona-pack32-1-marketing-content-generator.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  dispatchVionaMarketingContentRequest,
  type DispatchVionaMarketingContentRequestInput,
} from '../src/services/viona/vionaMarketingContentDispatchService';
import {
  findVionaToolRegistryEntry,
  assertVionaToolRegistryLinkedActionIdsAreKnown,
} from '../src/lib/viona/dispatcher/vionaToolRegistry';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSourceNoComments(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function assertNoneMatch(files: readonly string[], patterns: readonly RegExp[], label: string): void {
  for (const file of files) {
    const source = readSourceNoComments(file);
    for (const pattern of patterns) {
      assert(!pattern.test(source), `${label}: ${file} must not match forbidden pattern ${pattern}`);
    }
  }
}

const PACK32_1_TOUCHED_FILES = [
  '../src/lib/viona/dispatcher/vionaToolRegistry.ts',
  '../src/services/viona/vionaMarketingContentDispatchService.ts',
] as const;

// ---------------------------------------------------------------------------
// Fakes — no real LLM call, no real DB, no real network call.
// ---------------------------------------------------------------------------

function jsonLlm(shape: Readonly<Record<string, unknown>>): (prompt: string) => Promise<string> {
  return async () => JSON.stringify(shape);
}

const VALID_MARKETING_TOOL_INPUT = { topic: 'summer promo', tone: 'upbeat', targetLanguageCode: 'vi' };
const VALID_TWILIO_TOOL_INPUT = { fromNumber: '+15005550006', toNumber: '+15005550006', body: 'hello' };

const BASE_INPUT: DispatchVionaMarketingContentRequestInput = {
  userMessage: 'Please draft a short upbeat Vietnamese social post about our summer promo.',
};

function fakeGenerateDraftSpy(
  result: { marketingPostId: string; content: string } | Error,
): { generateDraft: (input: { topic: string; tone: string; targetLanguageCode: string }) => Promise<{ marketingPostId: string; content: string }>; calls: unknown[] } {
  const calls: unknown[] = [];
  const generateDraft = async (input: { topic: string; tone: string; targetLanguageCode: string }) => {
    calls.push(input);
    if (result instanceof Error) throw result;
    return result;
  };
  return { generateDraft, calls };
}

/** Test 1: happy path — valid tool + valid input + confidence >= threshold, faked draft generation. */
async function testHappyPathGeneratesAndReturnsDraft(): Promise<void> {
  const spy = fakeGenerateDraftSpy({ marketingPostId: 'post-1', content: 'Generated draft text.' });

  const result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
    callLlm: jsonLlm({
      toolName: 'marketing_content_generator',
      toolInputRaw: VALID_MARKETING_TOOL_INPUT,
      confidence: 0.95,
      rationale: 'User explicitly asked for a marketing draft.',
    }),
    generateDraft: spy.generateDraft,
  });

  assert(result.ok === true, 'a valid, high-confidence, schema-valid marketing tool call must be accepted');
  assert(result.ok && result.marketingPostId === 'post-1', 'marketingPostId must be passed through from generateDraft unchanged');
  assert(result.ok && result.content === 'Generated draft text.', 'content must be passed through from generateDraft unchanged');
  assert(spy.calls.length === 1, 'generateDraft must be called exactly once');
  assert(
    JSON.stringify(spy.calls[0]) === JSON.stringify(VALID_MARKETING_TOOL_INPUT),
    'generateDraft must receive the exact topic/tone/targetLanguageCode the LLM proposed',
  );
}

/** Test 2: hallucinated/unregistered toolName -> unknown_tool, generateDraft never called. */
async function testHallucinatedToolNameIsBlocked(): Promise<void> {
  const spy = fakeGenerateDraftSpy({ marketingPostId: 'should-not-be-created', content: 'n/a' });
  const result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
    callLlm: jsonLlm({ toolName: 'send_real_stripe_charge', toolInputRaw: {}, confidence: 0.99, rationale: 'invented' }),
    generateDraft: spy.generateDraft,
  });
  assert(!result.ok && result.reason === 'unknown_tool', 'an unregistered tool name must be rejected as unknown_tool');
  assert(spy.calls.length === 0, 'generateDraft must never be called for a hallucinated tool');
}

/**
 * Test 3 (CRITICAL): classification correctly matches the REAL `twilio_test_sms_poc` tool via this
 * content-only entrypoint -> wrong_tool_category; generateDraft never called. This is the primary
 * category-isolation safety property of `dispatchVionaMarketingContentRequest()`.
 */
async function testRealExecutionToolViaContentEntrypointIsBlocked(): Promise<void> {
  const spy = fakeGenerateDraftSpy({ marketingPostId: 'should-not-be-created', content: 'n/a' });
  const result = await dispatchVionaMarketingContentRequest(
    { userMessage: 'Please send a test SMS to confirm the request.' },
    {
      callLlm: jsonLlm({
        toolName: 'twilio_test_sms_poc',
        toolInputRaw: VALID_TWILIO_TOOL_INPUT,
        confidence: 0.95,
        rationale: 'User explicitly asked for an SMS.',
      }),
      generateDraft: spy.generateDraft,
    },
  );
  assert(
    !result.ok && result.reason === 'wrong_tool_category',
    'a real, registered, but wrong-category tool must be rejected as wrong_tool_category, never silently forwarded',
  );
  assert(spy.calls.length === 0, 'generateDraft must never be called when the matched tool is a real-execution tool');
}

/** Test 4: toolInputRaw missing a required field (topic) -> tool_input_schema_invalid. */
async function testMissingRequiredFieldIsBlocked(): Promise<void> {
  const spy = fakeGenerateDraftSpy({ marketingPostId: 'should-not-be-created', content: 'n/a' });
  const result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
    callLlm: jsonLlm({
      toolName: 'marketing_content_generator',
      toolInputRaw: { tone: 'upbeat', targetLanguageCode: 'vi' }, // missing "topic"
      confidence: 0.9,
      rationale: 'ok',
    }),
    generateDraft: spy.generateDraft,
  });
  assert(!result.ok && result.reason === 'tool_input_schema_invalid', 'a missing required field must be rejected as tool_input_schema_invalid');
  assert(spy.calls.length === 0, 'generateDraft must never be called for an invalid tool input');
}

/** Test 5: LLM response is not valid JSON -> response_not_valid_json. */
async function testMalformedJsonResponseIsBlocked(): Promise<void> {
  const result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
    callLlm: async () => 'Sure! Here you go: {"toolName": "marketing_content_generator"', // truncated / prose-wrapped
  });
  assert(!result.ok && result.reason === 'response_not_valid_json', 'malformed JSON must be rejected as response_not_valid_json');
}

/** Test 6: valid shape but confidence below the threshold -> low_confidence. */
async function testLowConfidenceIsBlocked(): Promise<void> {
  const result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
    callLlm: jsonLlm({ toolName: 'marketing_content_generator', toolInputRaw: VALID_MARKETING_TOOL_INPUT, confidence: 0.2, rationale: 'unsure' }),
  });
  assert(!result.ok && result.reason === 'low_confidence', 'confidence below the threshold must be rejected as low_confidence');
}

/** Test 7: injected callLlm throws -> llm_call_failed, never throws out. */
async function testLlmCallFailureNeverThrowsOut(): Promise<void> {
  let threw = false;
  let result;
  try {
    result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
      callLlm: async () => {
        throw new Error('simulated network/API error');
      },
    });
  } catch {
    threw = true;
  }
  assert(!threw, 'dispatchVionaMarketingContentRequest must convert an injected callLlm failure into a typed result, never rethrow');
  assert(result != null && !result.ok && result.reason === 'llm_call_failed', 'an injected callLlm failure must resolve to llm_call_failed');
}

/** Test 8: injected generateDraft throws -> content_generation_failed, never throws out. */
async function testContentGenerationFailureNeverThrowsOut(): Promise<void> {
  const spy = fakeGenerateDraftSpy(new Error('simulated OpenAI failure'));
  let threw = false;
  let result;
  try {
    result = await dispatchVionaMarketingContentRequest(BASE_INPUT, {
      callLlm: jsonLlm({ toolName: 'marketing_content_generator', toolInputRaw: VALID_MARKETING_TOOL_INPUT, confidence: 0.95, rationale: 'ok' }),
      generateDraft: spy.generateDraft,
    });
  } catch {
    threw = true;
  }
  assert(!threw, 'a generateDraft failure must never propagate as an unhandled rejection out of dispatchVionaMarketingContentRequest');
  assert(result != null && !result.ok && result.reason === 'content_generation_failed', 'a generateDraft failure must resolve to content_generation_failed');
}

/** Test 9: source-scan — generateVionaMarketingContentDraft only ever persists MarketingPostStatus.DRAFT. */
function testGeneratorOnlyEverPersistsDraftStatus(): void {
  const source = readSourceNoComments('../src/services/marketing/AIPostGenerator.ts');
  const fnStart = source.indexOf('export async function generateVionaMarketingContentDraft');
  assert(fnStart >= 0, 'generateVionaMarketingContentDraft must exist in AIPostGenerator.ts');
  const fnBody = source.slice(fnStart, fnStart + 2000);
  assert(fnBody.includes('MarketingPostStatus.DRAFT'), 'generateVionaMarketingContentDraft must persist MarketingPostStatus.DRAFT');
  assert(
    !fnBody.includes('MarketingPostStatus.PUBLISHED') && !fnBody.includes('MarketingPostStatus.REJECTED'),
    'generateVionaMarketingContentDraft must never set any status other than DRAFT',
  );
}

/** Test 10 (CRITICAL): new files never reference publishToFacebookPage/FacebookGraphAPI. */
function testNewFilesNeverReferenceFacebookPublish(): void {
  assertNoneMatch(
    ['../src/services/viona/vionaMarketingContentDispatchService.ts', '../src/services/marketing/AIPostGenerator.ts'],
    [/publishToFacebookPage/, /FacebookGraphAPI/, /\btiktok\b/i],
    'Pack32.1 files must never call or reference a live social-platform publish path',
  );
}

/** Test 11 (CRITICAL): the new orchestrator never imports the Pack31/Pack30D-4 real-execution pipeline. */
function testNewOrchestratorNeverImportsRealExecutionPipeline(): void {
  assertNoneMatch(
    ['../src/services/viona/vionaMarketingContentDispatchService.ts'],
    [
      /vionaAutonomousDispatchService/,
      /vionaExecutionPlanRouteService/,
      /vionaRequestEscrowHoldService/,
      /vionaTwilioTestRealProviderAdapter/,
      /buildVionaExecutionPlan/,
    ],
    'dispatchVionaMarketingContentRequest must never import or reference the Pack31/Pack30D-4 real-execution pipeline',
  );
}

/** Test 12: registry integrity check still passes with the new, additive entry (skipped by category). */
function testToolRegistryLinkedActionIdsAreKnown(): void {
  assertVionaToolRegistryLinkedActionIdsAreKnown();
}

/** Test 13: exact-match lookup resolves both entries to their expected category. */
function testRegistryLookupResolvesExpectedCategories(): void {
  const marketing = findVionaToolRegistryEntry('marketing_content_generator');
  assert(marketing != null, 'marketing_content_generator must be registered');
  assert(marketing!.category === 'content_generation_draft', 'marketing_content_generator must be category content_generation_draft');

  const twilio = findVionaToolRegistryEntry('twilio_test_sms_poc');
  assert(twilio != null, 'twilio_test_sms_poc must still be registered (unmodified)');
  assert(twilio!.category === 'viona_request_execution', 'twilio_test_sms_poc must be category viona_request_execution (additive tag, unchanged behavior)');

  assert(findVionaToolRegistryEntry('marketing_content_generatorX') == null, 'lookup must remain exact-match only, never fuzzy');
}

/** Test 14: source-scan — no LangChain/LlamaIndex/agent-framework import; package.json diff-safe. */
function testNoAgentFrameworkImportOrDependency(): void {
  assertNoneMatch(
    PACK32_1_TOUCHED_FILES,
    [/langchain/i, /llamaindex/i, /llama-index/i, /\bautogen\b/i, /crewai/i],
    'Pack32.1 files must never import a LangChain/LlamaIndex/agent-framework dependency',
  );
  const pkgRaw = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8');
  for (const pattern of [/langchain/i, /llamaindex/i, /llama-index/i, /\bautogen\b/i, /crewai/i]) {
    assert(!pattern.test(pkgRaw), `package.json must not reference a forbidden agent-framework dependency (${pattern})`);
  }
}

async function main(): Promise<void> {
  await testHappyPathGeneratesAndReturnsDraft();
  await testHallucinatedToolNameIsBlocked();
  await testRealExecutionToolViaContentEntrypointIsBlocked();
  await testMissingRequiredFieldIsBlocked();
  await testMalformedJsonResponseIsBlocked();
  await testLowConfidenceIsBlocked();
  await testLlmCallFailureNeverThrowsOut();
  await testContentGenerationFailureNeverThrowsOut();
  testGeneratorOnlyEverPersistsDraftStatus();
  testNewFilesNeverReferenceFacebookPublish();
  testNewOrchestratorNeverImportsRealExecutionPipeline();
  testToolRegistryLinkedActionIdsAreKnown();
  testRegistryLookupResolvesExpectedCategories();
  testNoAgentFrameworkImportOrDependency();
  console.log('PASS Pack32.1 marketing content generator tool expansion tests (14/14)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
