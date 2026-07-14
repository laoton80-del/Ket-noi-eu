/**
 * Pack32.4 — Marketing Admin Dashboard UI Integration tests.
 *
 * IMPORTANT REPO CONSTRAINT (documented in the plan, §7): this repo has no React Native
 * component-rendering test harness (no `@testing-library/react-native`, no Jest config for
 * `.tsx`), and any file that transitively imports `react-native` cannot be executed directly
 * under this repo's plain `tsx` script runner (verified: `react-native/index.js` uses syntax
 * esbuild/tsx cannot parse outside the Metro bundler). Every test below is therefore a
 * **static source-scan** (reading file text and asserting patterns) or a **git-diff-based**
 * check — never a runtime import/execution of `AdminMarketingDraftGenerator.tsx`,
 * `MarketingApprovalScreen.tsx`, or `viGlobalAdminApi.ts`. This mirrors and extends the
 * source-scan pattern already used by `test-viona-pack32-3-marketing-route-wiring.ts`.
 *
 * Covers the test plan from
 * docs/internal-ops/VIONA_PACK32_4_MARKETING_ADMIN_UI_PLAN.md §7.
 *
 * Test list (10 total):
 *   1.  New API wrapper `postAdminMarketingGenerateDraft` calls restApiFetchJson with the exact
 *       path, method POST, and forwards {topic, tone, targetLanguageCode} as the body
 *   2.  New API wrapper's payload type declares exactly {marketingPostId, content, toolName, confidence}
 *   3.  AdminMarketingDraftGenerator.tsx imports the new wrapper from viGlobalAdminApi (not a
 *       duplicate/inline fetch implementation) and renders 3 controlled TextInput fields
 *       (topic/tone/targetLanguageCode)
 *   4.  Source-scan (CRITICAL): AdminMarketingDraftGenerator.tsx never references publish/
 *       Facebook/TikTok/Share in any form
 *   5.  Source-scan (CRITICAL): the generated-content result field is a non-editable TextInput
 *       (`editable={false}`) — never an editable field for AI-generated content
 *   6.  Source-scan (CRITICAL): none of the 3 new/modified frontend files import a new UI/CSS
 *       framework (tailwind, bootstrap, @mui, native-base, styled-components, etc.)
 *   7.  Structural (CRITICAL): every backend Pack32.1/32.3 file this pack depends on but never
 *       modifies still exposes the exact contract this pack relies on (this pack is frontend-only)
 *   8.  Structural (CRITICAL): MarketingApprovalScreen.tsx still renders the embedded
 *       AdminMarketingDraftGenerator AND every pre-existing approve/publish/reject/save action
 *       handler (existing approve/publish/delete flow untouched)
 *   9.  Client-side validation: AdminMarketingDraftGenerator.tsx disables submission unless all
 *       3 fields are non-empty after trim (source-scan of the `isFormValid` gate)
 *
 * Pack34.5 tech-debt note (see docs/product/VIONA_PACK34_5_TECH_DEBT_ERADICATION_EVIDENCE.md):
 * tests 7, 8, and the former test 10 (`package.json` 0-line diff) previously shelled out to
 * `git diff` against `origin/master`, a moving-target baseline. Test 7 and 8 broke permanently the
 * instant *any* future, unrelated, legitimate change touched any of those shared files (exactly
 * what Pack34 did to `vionaToolRegistry.ts` and `prisma/schema.prisma`) — rewritten as pure
 * content-scans asserting each file still contains the specific marker(s) this pack actually
 * depends on. The former test 10 asserted `package.json` would never change again, ever, which
 * was never a real ongoing invariant this repo wants (dependencies do legitimately get added over
 * time for unrelated features) — it was a one-time proof for this pack's own original PR, already
 * historically true and of no further protective value, so it was removed outright rather than
 * converted, per the operator's explicit "remove if no longer serving a security purpose" option.
 *
 * Run: npx tsx scripts/test-viona-pack32-4-marketing-admin-ui.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSourceNoComments(relativePath: string): string {
  const raw = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const API_WRAPPER_FILE = '../src/services/viGlobalAdminApi.ts';
const COMPONENT_FILE = '../src/components/admin/AdminMarketingDraftGenerator.tsx';
const HOST_SCREEN_FILE = '../src/screens/admin/MarketingApprovalScreen.tsx';

/** Test 1: new API wrapper calls restApiFetchJson with the exact path/method/body shape. */
function testApiWrapperCallsCorrectEndpoint(): void {
  const source = readSourceNoComments(API_WRAPPER_FILE);
  const fnStart = source.indexOf('export async function postAdminMarketingGenerateDraft');
  assert(fnStart >= 0, 'postAdminMarketingGenerateDraft must exist in viGlobalAdminApi.ts');
  const fnBody = source.slice(fnStart, fnStart + 800);
  assert(
    fnBody.includes("restApiFetchJson<AdminMarketingGenerateDraftPayload>('/api/admin/marketing/generate-draft'"),
    'the wrapper must call restApiFetchJson with the exact path /api/admin/marketing/generate-draft'
  );
  assert(fnBody.includes("method: 'POST'"), 'the wrapper must use method POST');
  assert(fnBody.includes('body: input'), 'the wrapper must forward the input object as the request body');
}

/** Test 2: payload type declares exactly the 4 expected fields. */
function testPayloadTypeShapeMatchesController(): void {
  const source = readSourceNoComments(API_WRAPPER_FILE);
  const typeStart = source.indexOf('export type AdminMarketingGenerateDraftPayload');
  assert(typeStart >= 0, 'AdminMarketingGenerateDraftPayload type must exist');
  const typeBody = source.slice(typeStart, typeStart + 300);
  for (const field of ['marketingPostId: string', 'content: string', 'toolName: string', 'confidence: number']) {
    assert(typeBody.includes(field), `AdminMarketingGenerateDraftPayload must declare ${field}`);
  }
}

/** Test 3: component imports the new wrapper (no duplicate fetch) and renders 3 controlled fields. */
function testComponentUsesWrapperAndRendersThreeFields(): void {
  const source = readSourceNoComments(COMPONENT_FILE);
  assert(
    /import\s*\{\s*postAdminMarketingGenerateDraft\s*\}\s*from\s*'\.\.\/\.\.\/services\/viGlobalAdminApi'/.test(source),
    'AdminMarketingDraftGenerator.tsx must import postAdminMarketingGenerateDraft from viGlobalAdminApi (no inline duplicate fetch)'
  );
  assert(!/\bfetch\s*\(/.test(source), 'AdminMarketingDraftGenerator.tsx must never call fetch() directly');
  assert(/useState\(''\)/.test(source), 'form fields must be controlled useState string inputs');
  assert(/setTopic/.test(source) && /setTone/.test(source) && /setTargetLanguageCode/.test(source),
    'component must manage topic, tone, and targetLanguageCode as separate controlled fields');
}

/** Test 4 (CRITICAL): no publish/Facebook/TikTok/Share reference anywhere in the new component. */
function testComponentNeverReferencesPublishOrSocialPlatforms(): void {
  const source = readSourceNoComments(COMPONENT_FILE);
  assert(!/publish/i.test(source), 'AdminMarketingDraftGenerator.tsx must never reference "publish" in any form');
  assert(!/facebook/i.test(source), 'AdminMarketingDraftGenerator.tsx must never reference "Facebook"');
  assert(!/tiktok/i.test(source), 'AdminMarketingDraftGenerator.tsx must never reference "TikTok"');
  assert(!/\bshare\b/i.test(source), 'AdminMarketingDraftGenerator.tsx must never reference "Share"');
}

/** Test 5 (CRITICAL): the generated-content result field is non-editable. */
function testResultFieldIsReadOnly(): void {
  const source = readSourceNoComments(COMPONENT_FILE);
  const resultInputIdx = source.indexOf('value={result.content}');
  assert(resultInputIdx >= 0, 'the result content must be bound via value={result.content}');
  const window = source.slice(resultInputIdx, resultInputIdx + 200);
  assert(/editable=\{false\}/.test(window), 'the generated-content TextInput must be editable={false}');
}

/** Test 6 (CRITICAL): no new UI/CSS framework imported in any of the 3 touched frontend files. */
function testNoNewUiLibraryImported(): void {
  const forbidden = [/tailwind/i, /bootstrap/i, /@mui/i, /native-base/i, /styled-components/i, /@shopify\/restyle/i];
  for (const file of [API_WRAPPER_FILE, COMPONENT_FILE, HOST_SCREEN_FILE]) {
    const source = readSourceNoComments(file);
    for (const pattern of forbidden) {
      assert(!pattern.test(source), `${file} must not import a new UI/CSS library (matched ${pattern})`);
    }
  }
}

/** Test 7 (CRITICAL, structural): every backend Pack32.1/32.3 file this pack depends on but never
 * modifies still exposes the exact contract this pack relies on. Pure content-scan — see
 * Pack34.5 tech-debt note in the module header for why this no longer uses `git diff`. */
function testBackendCoreFilesStillExposeExpectedContract(): void {
  const expectations: ReadonlyArray<readonly [string, readonly string[]]> = [
    ['../src/controllers/AdminMarketingController.ts', ['export async function postAdminMarketingGenerateDraft', 'export async function postMarketingPostPublish']],
    ['../src/routes/adminRoutes.ts', ['adminRouter.use(authMiddleware)', 'adminRouter.use(superAdminMiddleware)']],
    ['../src/services/viona/vionaMarketingContentDispatchService.ts', ['export async function dispatchVionaMarketingContentRequest']],
    ['../src/services/marketing/AIPostGenerator.ts', ['export async function generateVionaMarketingContentDraft']],
    ['../src/services/marketing/FacebookGraphAPI.ts', ['export async function publishToFacebookPage']],
    ['../src/lib/viona/dispatcher/vionaToolRegistry.ts', ['export function findVionaToolRegistryEntry']],
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

  // prisma/schema.prisma: rather than a frozen 0-diff check (which this repo's own Pack34 already
  // legitimately broke by adding an unrelated MerchantProfile model), assert the specific models
  // this frontend-only pack does not own are still present, unchanged in name/shape.
  const schemaSource = fs.readFileSync(path.resolve(__dirname, '../prisma/schema.prisma'), 'utf8');
  assert(schemaSource.includes('model MarketingPost {'), 'schema.prisma must still declare model MarketingPost');
  assert(schemaSource.includes('model MarketingTranslation {'), 'schema.prisma must still declare model MarketingTranslation');
}

/** Test 8 (CRITICAL, structural): MarketingApprovalScreen.tsx still renders the embedded
 * AdminMarketingDraftGenerator AND every pre-existing approve/publish/reject/save action handler.
 * Pure content-scan — see Pack34.5 tech-debt note in the module header for why this no longer
 * uses `git diff`. */
function testHostScreenStillEmbedsGeneratorAndPreservesExistingActions(): void {
  const source = readSourceNoComments(HOST_SCREEN_FILE);
  assert(
    /import\s*\{\s*AdminMarketingDraftGenerator\s*\}\s*from\s*'\.\.\/\.\.\/components\/admin\/AdminMarketingDraftGenerator'/.test(source),
    'MarketingApprovalScreen.tsx must still import AdminMarketingDraftGenerator',
  );
  assert(source.includes('<AdminMarketingDraftGenerator'), 'MarketingApprovalScreen.tsx must still render <AdminMarketingDraftGenerator');
  for (const marker of ['onApprovePolyglot', 'onApprovePublish', 'onReject', 'onSave', 'onForceDraft']) {
    assert(
      source.includes(marker),
      `MarketingApprovalScreen.tsx must still reference its pre-existing ${marker} handler (existing approve/publish/reject/save flow untouched)`,
    );
  }
}

/** Test 9: client-side validation gates submission on all 3 fields being non-empty after trim. */
function testClientSideValidationGatesAllThreeFields(): void {
  const source = readSourceNoComments(COMPONENT_FILE);
  const gateIdx = source.indexOf('const isFormValid');
  assert(gateIdx >= 0, 'AdminMarketingDraftGenerator.tsx must define an isFormValid gate');
  const gateBody = source.slice(gateIdx, gateIdx + 300);
  assert(gateBody.includes('topic.trim().length > 0'), 'isFormValid must require a non-empty trimmed topic');
  assert(gateBody.includes('tone.trim().length > 0'), 'isFormValid must require a non-empty trimmed tone');
  assert(
    gateBody.includes('targetLanguageCode.trim().length > 0'),
    'isFormValid must require a non-empty trimmed targetLanguageCode'
  );
  assert(source.includes('disabled={!isFormValid || submitting}'), 'the Generate button must be disabled unless isFormValid');
}

function main(): void {
  testApiWrapperCallsCorrectEndpoint();
  testPayloadTypeShapeMatchesController();
  testComponentUsesWrapperAndRendersThreeFields();
  testComponentNeverReferencesPublishOrSocialPlatforms();
  testResultFieldIsReadOnly();
  testNoNewUiLibraryImported();
  testBackendCoreFilesStillExposeExpectedContract();
  testHostScreenStillEmbedsGeneratorAndPreservesExistingActions();
  testClientSideValidationGatesAllThreeFields();
  console.log('PASS Pack32.4 marketing admin dashboard UI integration tests (9/9 — former test 10, a package.json 0-diff check with no ongoing protective value, was removed in Pack34.5)');
}

main();
