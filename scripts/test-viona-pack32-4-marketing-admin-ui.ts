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
 *   7.  Source-scan (CRITICAL): every backend Pack32.1/32.3 core file has a 0-line diff vs
 *       origin/master (this pack is frontend-only)
 *   8.  git-diff-based (CRITICAL): MarketingApprovalScreen.tsx's diff vs origin/master contains
 *       ONLY added lines — zero removed/modified lines (existing approve/publish/delete flow
 *       untouched)
 *   9.  Client-side validation: AdminMarketingDraftGenerator.tsx disables submission unless all
 *       3 fields are non-empty after trim (source-scan of the `isFormValid` gate)
 *   10. package.json has a 0-line diff vs origin/master (no new dependency added)
 *
 * Run: npx tsx scripts/test-viona-pack32-4-marketing-admin-ui.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

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

/** Test 7 (CRITICAL): every backend Pack32.1/32.3 core file has a 0-line diff vs origin/master. */
function testBackendCoreFilesHaveZeroLineDiffVsMaster(): void {
  const coreFiles = [
    'src/controllers/AdminMarketingController.ts',
    'src/routes/adminRoutes.ts',
    'src/services/viona/vionaMarketingContentDispatchService.ts',
    'src/services/marketing/AIPostGenerator.ts',
    'src/services/marketing/FacebookGraphAPI.ts',
    'src/lib/viona/dispatcher/vionaToolRegistry.ts',
    'src/lib/viona/dispatcher/vionaIntentRouter.ts',
    'src/middleware/authMiddleware.ts',
    'src/middleware/superAdminMiddleware.ts',
    'src/utils/apiEnvelope.ts',
    'prisma/schema.prisma',
  ];
  const repoRoot = path.resolve(__dirname, '..');
  for (const file of coreFiles) {
    const diff = execSync(`git diff --stat origin/master -- "${file}"`, { cwd: repoRoot, encoding: 'utf8' });
    assert(diff.trim().length === 0, `${file} must have a 0-line diff vs origin/master (got: ${diff.trim()})`);
  }
}

/** Test 8 (CRITICAL): MarketingApprovalScreen.tsx diff vs origin/master contains ONLY added lines. */
function testHostScreenDiffIsPurelyAdditive(): void {
  const repoRoot = path.resolve(__dirname, '..');
  const diff = execSync('git diff origin/master -- "src/screens/admin/MarketingApprovalScreen.tsx"', {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert(diff.trim().length > 0, 'expected MarketingApprovalScreen.tsx to have a non-empty diff (the embed change)');
  const lines = diff.split('\n');
  const removedLines = lines.filter((l) => l.startsWith('-') && !l.startsWith('---'));
  assert(
    removedLines.length === 0,
    `MarketingApprovalScreen.tsx diff must contain zero removed/modified lines, found ${removedLines.length}: ${removedLines.join(' | ')}`
  );
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

/** Test 10: package.json has a 0-line diff vs origin/master (no new dependency added). */
function testPackageJsonHasZeroLineDiff(): void {
  const repoRoot = path.resolve(__dirname, '..');
  const diff = execSync('git diff --stat origin/master -- "package.json"', { cwd: repoRoot, encoding: 'utf8' });
  assert(diff.trim().length === 0, `package.json must have a 0-line diff vs origin/master (got: ${diff.trim()})`);
}

function main(): void {
  testApiWrapperCallsCorrectEndpoint();
  testPayloadTypeShapeMatchesController();
  testComponentUsesWrapperAndRendersThreeFields();
  testComponentNeverReferencesPublishOrSocialPlatforms();
  testResultFieldIsReadOnly();
  testNoNewUiLibraryImported();
  testBackendCoreFilesHaveZeroLineDiffVsMaster();
  testHostScreenDiffIsPurelyAdditive();
  testClientSideValidationGatesAllThreeFields();
  testPackageJsonHasZeroLineDiff();
  console.log('PASS Pack32.4 marketing admin dashboard UI integration tests (10/10)');
}

main();
