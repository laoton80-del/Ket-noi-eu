/**
 * Pack32.3 — Marketing Content API Route Wiring tests, no real HTTP server, no real LLM call, no
 * real DB, no real Twilio/Facebook call.
 *
 * Covers the required test plan from
 * docs/internal-ops/VIONA_PACK32_3_MARKETING_ROUTE_PLAN.md §7, adapted to this repo's existing
 * `tsx` + `assert`-based testing pattern. Tests 1-2 verify (by source-scan) that the route chain
 * still carries the existing, unmodified `authMiddleware`/`superAdminMiddleware` guards — this
 * script never re-tests those middlewares' own internals (already covered elsewhere). Tests 3-12
 * exercise the new controller function directly with a fake `Request`/`Response` and an injected
 * fake `dispatch` function (never calling the real, unmodified `dispatchVionaMarketingContentRequest`).
 *
 * Test list (16 total):
 *   1.  Source-scan: adminRouter applies authMiddleware before the new route is registered
 *   2.  Source-scan: adminRouter applies superAdminMiddleware before the new route is registered
 *   3.  Happy path: ADMIN + valid {topic, tone, targetLanguageCode} + fake dispatch ok:true -> 200, exact body
 *   4.  Missing topic                                                    -> 400, dispatch never called
 *   5.  Missing tone                                                     -> 400, dispatch never called
 *   6.  Missing targetLanguageCode                                       -> 400, dispatch never called
 *   7.  Whitespace-only topic                                            -> 400, dispatch never called
 *   8.  Fake dispatch ok:false, reason low_confidence                    -> 422
 *   9.  Fake dispatch ok:false, reason unknown_tool                      -> 422
 *   10. Fake dispatch ok:false, reason wrong_tool_category (defensive)   -> 422
 *   11. Fake dispatch ok:false, reason content_generation_failed         -> 502
 *   12. Fake dispatch throws synchronously                               -> 500, never crashes the process
 *   13. Source-scan (CRITICAL): new controller code never references publishToFacebookPage/FacebookGraphAPI/tiktok
 *   14. Source-scan (CRITICAL): 7 core Pack32.1/middleware files this pack depends on but never
 *       modifies still expose the exact contract this pack relies on
 *   15. Regression: existing Pack32.1 (14/14) and Pack32 (13/13) test suites still pass unmodified
 *   16. `npm run typecheck` / `npm run lint` — run separately via those npm scripts
 *
 * Pack34.5 tech-debt note (see docs/product/VIONA_PACK34_5_TECH_DEBT_ERADICATION_EVIDENCE.md):
 * test 14 previously asserted `git diff --stat origin/master -- <file>` is empty for each of the 7
 * files. That moving-target baseline meant it broke permanently the instant *any* future,
 * unrelated, legitimate change touched any of those 7 shared files — exactly what happened when
 * Pack34 additively extended `vionaToolRegistry.ts`. Rewritten as a pure content-scan asserting
 * each file still contains the specific exported symbol(s) this pack actually depends on, which
 * protects the real invariant ("this pack's dependencies still work") without caring how many
 * *other*, unrelated, legitimate lines those files accumulate over time.
 *
 * Run: npx tsx scripts/test-viona-pack32-3-marketing-route-wiring.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { postAdminMarketingGenerateDraft } from '../src/controllers/AdminMarketingController';
import type {
  DispatchVionaMarketingContentRequestInput,
  DispatchVionaMarketingContentRequestResult,
} from '../src/services/viona/vionaMarketingContentDispatchService';

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

// ---------------------------------------------------------------------------
// Fakes — no real HTTP server, no real Request/Response, no real LLM call.
// ---------------------------------------------------------------------------

type FakeResponseState = { statusCode: number | null; body: unknown };

function createFakeResponse(): { res: any; state: FakeResponseState } {
  const state: FakeResponseState = { statusCode: null, body: null };
  const res: any = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { res, state };
}

function createFakeRequest(body: Readonly<Record<string, unknown>>): any {
  return { body };
}

const VALID_BODY = { topic: 'summer promo', tone: 'upbeat', targetLanguageCode: 'vi' };

function fakeDispatchSpy(
  result: DispatchVionaMarketingContentRequestResult | Error,
): {
  dispatch: (input: DispatchVionaMarketingContentRequestInput) => Promise<DispatchVionaMarketingContentRequestResult>;
  calls: DispatchVionaMarketingContentRequestInput[];
} {
  const calls: DispatchVionaMarketingContentRequestInput[] = [];
  const dispatch = async (input: DispatchVionaMarketingContentRequestInput) => {
    calls.push(input);
    if (result instanceof Error) throw result;
    return result;
  };
  return { dispatch, calls };
}

/** Test 1: source-scan — adminRouter applies authMiddleware before the new route is registered. */
function testAdminRouterAppliesAuthMiddlewareBeforeNewRoute(): void {
  const source = readSourceNoComments('../src/routes/adminRoutes.ts');
  const authIdx = source.indexOf('adminRouter.use(authMiddleware)');
  const routeIdx = source.indexOf("adminRouter.post('/marketing/generate-draft'");
  assert(authIdx >= 0, 'adminRoutes.ts must still apply authMiddleware to adminRouter');
  assert(routeIdx >= 0, 'adminRoutes.ts must register the new /marketing/generate-draft route');
  assert(authIdx < routeIdx, 'authMiddleware must be registered BEFORE the new route');
}

/** Test 2: source-scan — adminRouter applies superAdminMiddleware before the new route is registered. */
function testAdminRouterAppliesSuperAdminMiddlewareBeforeNewRoute(): void {
  const source = readSourceNoComments('../src/routes/adminRoutes.ts');
  const superAdminIdx = source.indexOf('adminRouter.use(superAdminMiddleware)');
  const routeIdx = source.indexOf("adminRouter.post('/marketing/generate-draft'");
  assert(superAdminIdx >= 0, 'adminRoutes.ts must still apply superAdminMiddleware to adminRouter');
  assert(routeIdx >= 0, 'adminRoutes.ts must register the new /marketing/generate-draft route');
  assert(superAdminIdx < routeIdx, 'superAdminMiddleware must be registered BEFORE the new route');
}

/** Test 3: happy path — valid body + fake dispatch ok:true -> 200, exact response body. */
async function testHappyPathReturns200WithExactBody(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: true, toolName: 'marketing_content_generator', marketingPostId: 'post-1', content: 'Generated draft text.', confidence: 0.93 });
  const req = createFakeRequest(VALID_BODY);
  const { res, state } = createFakeResponse();

  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });

  assert(state.statusCode === 200, `expected 200, got ${state.statusCode}`);
  assert(
    JSON.stringify(state.body) ===
      JSON.stringify({
        success: true,
        data: { marketingPostId: 'post-1', content: 'Generated draft text.', toolName: 'marketing_content_generator', confidence: 0.93 },
      }),
    'response body must be exactly { success: true, data: { marketingPostId, content, toolName, confidence } }',
  );
  assert(spy.calls.length === 1, 'dispatch must be called exactly once');
  assert(
    spy.calls[0].userMessage.includes('summer promo') && spy.calls[0].userMessage.includes('upbeat') && spy.calls[0].userMessage.includes('vi'),
    'the templated userMessage must embed topic, tone, and targetLanguageCode',
  );
}

/** Test 4: missing topic -> 400, dispatch never called. */
async function testMissingTopicReturns400(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: true, toolName: 'marketing_content_generator', marketingPostId: 'x', content: 'x', confidence: 1 });
  const req = createFakeRequest({ tone: 'upbeat', targetLanguageCode: 'vi' });
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 400, `expected 400, got ${state.statusCode}`);
  assert(spy.calls.length === 0, 'dispatch must never be called when topic is missing');
}

/** Test 5: missing tone -> 400, dispatch never called. */
async function testMissingToneReturns400(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: true, toolName: 'marketing_content_generator', marketingPostId: 'x', content: 'x', confidence: 1 });
  const req = createFakeRequest({ topic: 'summer promo', targetLanguageCode: 'vi' });
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 400, `expected 400, got ${state.statusCode}`);
  assert(spy.calls.length === 0, 'dispatch must never be called when tone is missing');
}

/** Test 6: missing targetLanguageCode -> 400, dispatch never called. */
async function testMissingTargetLanguageCodeReturns400(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: true, toolName: 'marketing_content_generator', marketingPostId: 'x', content: 'x', confidence: 1 });
  const req = createFakeRequest({ topic: 'summer promo', tone: 'upbeat' });
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 400, `expected 400, got ${state.statusCode}`);
  assert(spy.calls.length === 0, 'dispatch must never be called when targetLanguageCode is missing');
}

/** Test 7: whitespace-only topic -> 400, dispatch never called. */
async function testWhitespaceOnlyTopicReturns400(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: true, toolName: 'marketing_content_generator', marketingPostId: 'x', content: 'x', confidence: 1 });
  const req = createFakeRequest({ topic: '   ', tone: 'upbeat', targetLanguageCode: 'vi' });
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 400, `expected 400, got ${state.statusCode}`);
  assert(spy.calls.length === 0, 'dispatch must never be called for a whitespace-only topic');
}

/** Test 8: fake dispatch ok:false, reason low_confidence -> 422. */
async function testLowConfidenceReturns422(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: false, reason: 'low_confidence' });
  const req = createFakeRequest(VALID_BODY);
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 422, `expected 422, got ${state.statusCode}`);
}

/** Test 9: fake dispatch ok:false, reason unknown_tool -> 422. */
async function testUnknownToolReturns422(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: false, reason: 'unknown_tool' });
  const req = createFakeRequest(VALID_BODY);
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 422, `expected 422, got ${state.statusCode}`);
}

/** Test 10: fake dispatch ok:false, reason wrong_tool_category (defensive path) -> 422. */
async function testWrongToolCategoryReturns422(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: false, reason: 'wrong_tool_category' });
  const req = createFakeRequest(VALID_BODY);
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 422, `expected 422, got ${state.statusCode}`);
}

/** Test 11: fake dispatch ok:false, reason content_generation_failed -> 502. */
async function testContentGenerationFailedReturns502(): Promise<void> {
  const spy = fakeDispatchSpy({ ok: false, reason: 'content_generation_failed' });
  const req = createFakeRequest(VALID_BODY);
  const { res, state } = createFakeResponse();
  await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  assert(state.statusCode === 502, `expected 502, got ${state.statusCode}`);
}

/** Test 12: fake dispatch throws synchronously -> 500, never crashes the process. */
async function testDispatchThrowingReturns500NeverCrashes(): Promise<void> {
  const spy = fakeDispatchSpy(new Error('simulated unexpected failure'));
  const req = createFakeRequest(VALID_BODY);
  const { res, state } = createFakeResponse();
  let threw = false;
  try {
    await postAdminMarketingGenerateDraft(req, res, { dispatch: spy.dispatch });
  } catch {
    threw = true;
  }
  assert(!threw, 'postAdminMarketingGenerateDraft must never let an unexpected error propagate out');
  assert(state.statusCode === 500, `expected 500, got ${state.statusCode}`);
}

/** Test 13 (CRITICAL): new controller code never references a live social-platform publish path. */
function testNewControllerCodeNeverReferencesFacebookOrTiktok(): void {
  const source = readSourceNoComments('../src/controllers/AdminMarketingController.ts');
  const fnStart = source.indexOf('export async function postAdminMarketingGenerateDraft');
  assert(fnStart >= 0, 'postAdminMarketingGenerateDraft must exist in AdminMarketingController.ts');
  const fnBody = source.slice(fnStart, fnStart + 3000);
  assert(!/publishToFacebookPage/.test(fnBody), 'the new controller must never call publishToFacebookPage');
  assert(!/FacebookGraphAPI/.test(fnBody), 'the new controller must never reference FacebookGraphAPI');
  assert(!/tiktok/i.test(fnBody), 'the new controller must never reference TikTok');
  assert(!/MarketingPostStatus\.PUBLISHED/.test(fnBody), 'the new controller must never set MarketingPostStatus.PUBLISHED');
}

/** Test 14 (CRITICAL, structural): 7 core Pack32.1/middleware files this pack depends on but
 * never modifies still expose the exact contract this pack relies on. Pure content-scan — see
 * Pack34.5 tech-debt note in the module header for why this no longer uses `git diff`. */
function testCoreFilesStillExposeExpectedContract(): void {
  const expectations: ReadonlyArray<readonly [string, readonly string[]]> = [
    ['../src/services/viona/vionaMarketingContentDispatchService.ts', ['export async function dispatchVionaMarketingContentRequest']],
    ['../src/services/marketing/AIPostGenerator.ts', ['export async function generateVionaMarketingContentDraft']],
    [
      '../src/lib/viona/dispatcher/vionaToolRegistry.ts',
      ["export function findVionaToolRegistryEntry", "name: 'marketing_content_generator'", "name: 'twilio_test_sms_poc'"],
    ],
    ['../src/lib/viona/dispatcher/vionaIntentRouter.ts', ['export async function routeVionaDispatchIntent']],
    ['../src/middleware/authMiddleware.ts', ['export function authMiddleware']],
    ['../src/middleware/superAdminMiddleware.ts', ['export async function superAdminMiddleware']],
    ['../src/utils/apiEnvelope.ts', ['export function jsonOk', 'export function jsonFail']],
  ];
  for (const [file, markers] of expectations) {
    const source = readSourceNoComments(file);
    for (const marker of markers) {
      assert(source.includes(marker), `${file} must still contain "${marker}" (this pack must never break this shared file's contract)`);
    }
  }
}

async function main(): Promise<void> {
  testAdminRouterAppliesAuthMiddlewareBeforeNewRoute();
  testAdminRouterAppliesSuperAdminMiddlewareBeforeNewRoute();
  await testHappyPathReturns200WithExactBody();
  await testMissingTopicReturns400();
  await testMissingToneReturns400();
  await testMissingTargetLanguageCodeReturns400();
  await testWhitespaceOnlyTopicReturns400();
  await testLowConfidenceReturns422();
  await testUnknownToolReturns422();
  await testWrongToolCategoryReturns422();
  await testContentGenerationFailedReturns502();
  await testDispatchThrowingReturns500NeverCrashes();
  testNewControllerCodeNeverReferencesFacebookOrTiktok();
  testCoreFilesStillExposeExpectedContract();
  assertNoneMatch(
    ['../src/controllers/AdminMarketingController.ts', '../src/routes/adminRoutes.ts'],
    [/langchain/i, /llamaindex/i, /llama-index/i],
    'Pack32.3 files must never import an agent-framework dependency',
  );
  console.log('PASS Pack32.3 marketing content API route wiring tests (14/14 runnable cases + core-file contract check)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
