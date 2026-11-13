# P0 REL1 / REL2 — local integration manifest

- Date: 2026-11-03 (Europe/Prague).
- Authorization: `APPROVE_VIONA_P0_REL1_LOCAL_INTEGRATION_BRANCH_V1`.
- Base HEAD: `3a6798d7752caf61000060f7f0401297d3f6f92a`.
- Local branch: `integration/p0-paid-ai-containment-v1`.
- Worktree: `C:\Users\uživatel\Documents\ChatGPT\Viona\viona-p0-rel1`.
- Independent local Git storage: `C:\Users\uživatel\Documents\ChatGPT\Viona\.viona-p0-rel1.git`.
- Included packs: P0-A0; P0-A0b + R1; P0-A0d.
- REL1 exclusions: P0-A0c, P0-A0e and every `functions/` path. REL2's uncommitted copies and validation blocker are recorded below.
- Main checkout and source worktrees are preserved. No remote publication or deployment is authorized.

## Source preflight

All three source worktrees exist at the exact base HEAD, detached, with no staged paths. Their dirty path sets match the existing candidates: A0 has four paths, A0b has seven paths including inherited A0 files, and A0d has two paths.

Every referenced source SHA-256 matched before copy. ViralWrap had no Operator reference hash; the source hash recorded below was measured and then bound to the destination copy.

SHA-256 values in this manifest identify raw worktree bytes, including the candidates' existing line endings. Normal Git `core.autocrlf=true` staging records LF-normalized text blobs without rewriting these reviewed worktree bytes; staged blobs are checked against that normalization before each commit.

| Pack / source | Path | Source SHA-256 | Integration SHA-256 |
| --- | --- | --- | --- |
| A0 / `viona-p0-a0` | `src/services/ai/llmProviderAdmissionGate.ts` | `E3ADE60C635ECD63320154935890EAA9BB72245548F2141D696346C4DF909340` | `E3ADE60C635ECD63320154935890EAA9BB72245548F2141D696346C4DF909340` |
| A0 / `viona-p0-a0` | `src/services/ai/AIRouterService.ts` | `4F35E4D121E552A77ECCFB33C024FF188FF51DF826317C90580AB512C6E65FF0` | `4F35E4D121E552A77ECCFB33C024FF188FF51DF826317C90580AB512C6E65FF0` |
| A0 / `viona-p0-a0` | `src/controllers/AIController.ts` | `6765A1B48E9A0430F7C29604C65BD071373AD9E0528BA4FB36DA59A844F0C484` | `6765A1B48E9A0430F7C29604C65BD071373AD9E0528BA4FB36DA59A844F0C484` |
| A0 / `viona-p0-a0` | `scripts/test-viona-llm-provider-admission-gate.ts` | `023F11D8FFC7D2C9849447229291F0A7ED7F6DE63F0212FF8C7DE5DB3317D56D` | `023F11D8FFC7D2C9849447229291F0A7ED7F6DE63F0212FF8C7DE5DB3317D56D` |
| A0b / `viona-p0-a0b` | `src/services/marketing/ViralWrapEngine.ts` | `69B489B6D82834A1A668DA199E38506CA11256376EB0FAF7491A3325967CC433` | `69B489B6D82834A1A668DA199E38506CA11256376EB0FAF7491A3325967CC433` |
| A0b + R1 / `viona-p0-a0b` | `src/controllers/AdminMarketingController.ts` | `A56776DCAFAB5C609FEAE456C427B1E66E6E325365F9F80CD9438AF89D8362EE` | `A56776DCAFAB5C609FEAE456C427B1E66E6E325365F9F80CD9438AF89D8362EE` |
| A0b + R1 / `viona-p0-a0b` | `scripts/test-viona-p0-a0b-direct-caller-containment.ts` | `957E5113C048912A3A1828CA18027370CAC4F0A13022812FABFFAC963D5FD104` | `87DBD3C42681F9A078F825583610FC7DCEF4C3E98E9EFEFCA8261A9E8028C401` |
| A0d / `viona-p0-a0d` | `src/services/ai/MinhKhangService.ts` | `38DAC782F3276A767F530A8D04C3355E85C6D133E2F4A6D71CBA3D265CFFEAE4` | `38DAC782F3276A767F530A8D04C3355E85C6D133E2F4A6D71CBA3D265CFFEAE4` |
| A0d / `viona-p0-a0d` | `scripts/test-viona-minhkhang-no-paid-fallback.ts` | `46F0D77E7930BBAE6961B4C6B809A9D97E2622FF64DA9756A1B36243E978259E` | `46F0D77E7930BBAE6961B4C6B809A9D97E2622FF64DA9756A1B36243E978259E` |

## Authorized portability edit

Only the integrated A0b test copy changed. Removed the SHA-only crypto import, `P0_A0_CANDIDATE_SHA256`, `sourceRoot`, `verifyCandidateHashes`, and its two calls. An AST comparison confirmed all 23 test call sites are unchanged; the runtime expectation remains 43 tests. Source worktree bytes remain untouched.

## REL1 local validation

The Operator clarified that the required target scripts are the three named source scripts plus the regressions in step 6.

| Check | Result |
| --- | --- |
| Root `tsc --noEmit` | PASS; `--project tsconfig.json --noEmit --incremental false --pretty false` |
| A0 admission test | PASS — 42 cases |
| A0b + R1 portable test | PASS — 43 cases |
| A0d no-paid-fallback test | PASS — 19 cases |
| `git diff --check` | PASS |
| Offline regressions and R0 comparison | Same on baseline and integration: 23 PASS / 2 known FAIL / 16 DB-required SKIP; zero new failures |

R0 reference supplied by the Operator: 68 PASS / 4 FAIL. Known failures: `test-local-safe-i18n-copy-pass`, `test-viona-mobile-sos-shell-consolidation-phase-1`, `test-viona-modern-home-shell-mode-resolver-foundation`, `test-viona-rec2-home-shell-contract`. Any new regression failure blocks commits.

The current check covers the 41 selected scripts below, not a rerun of the complete 72-script R0 suite. Every offline script was run twice: once against the exact base (the five modified existing modules read from Git into an in-memory filesystem view, with new integration paths hidden), and once against the integrated files. No regression script or application file was edited for this comparison.

The two reproduced failures are unchanged on both sides: Local public-copy assertions find seven occurrences of `payment captured`; the mobile SOS shell contract fails `Native chrome row is a non-overlapping reserved band`. The other two supplied R0 failures PASS on both sides in this isolated environment; this is not attributed to the containment changes. There are zero new failing scripts relative to the supplied R0 failure set and zero baseline-PASS/integration-FAIL transitions.

The runner starts with a sanitized synthetic environment, no OpenAI key and no database URL. Existing `vionaTestEnvGuard` behavior is retained, including each test's fake-key guards. Dotenv imports are no-ops, secret-file reads are denied, optional tsx parent IPC is mocked, and network/native DB engines/unapproved subprocesses/repository writes are blocked. Every completed regression run (including aggregate children) recorded zero network, native-engine or repository-write attempts. Installed dependencies are reused read-only; no dependency link, install or compiler output is added to this worktree.

`test-local-no-charge-e2e-qa` runs its offline subset through the same guarded child runner, including six tourism scripts; its 15 DB-backed child entries are skipped. `test-local-provider-eligibility-read-ops-control` runs the deterministic cases and explicitly skips its optional DB integration. Sixteen top-level scripts require DB and were not executed; SKIP is not counted as PASS.

| Script | Exact-base control | Integration |
| --- | --- | --- |
| `scripts/test-local-audit-read-api-1.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-create-failure-code-envelope.ts` | PASS | PASS |
| `scripts/test-local-create-pack-b-recovery-discrimination.ts` | PASS | PASS |
| `scripts/test-local-merchant-inbox-ui-display.ts` | PASS | PASS |
| `scripts/test-local-merchant-request-confirm-api.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-merchant-request-inbox-api.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-merchant-request-reject-api.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-no-charge-e2e-qa.ts` | PASS | PASS |
| `scripts/test-local-ops-request-cancel-api.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-ops-request-list-api-1.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-provider-eligibility-client-wiring.ts` | PASS | PASS |
| `scripts/test-local-provider-eligibility-read-ops-control.ts` | PASS | PASS |
| `scripts/test-local-provider-eligibility-schema-domain.ts` | PASS | PASS |
| `scripts/test-local-rate-limit-abuse-guard-1.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-audit-runtime-1.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-audit-runtime-2.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-audit-runtime-3.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-create-source-of-truth.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-eligibility-client-contract.ts` | PASS | PASS |
| `scripts/test-local-request-expiry-apply.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-expiry-dry-run.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-request-schema-defaults.ts` | PASS | PASS |
| `scripts/test-local-safe-i18n-copy-pass.ts` | FAIL | FAIL |
| `scripts/test-local-service-request-client-contract.ts` | PASS | PASS |
| `scripts/test-local-user-request-cancel-api.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-user-request-create-client.ts` | PASS | PASS |
| `scripts/test-local-user-request-list-api.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-local-user-request-status-ui-display.ts` | PASS | PASS |
| `scripts/test-local-user-request-timeline-1.ts` | SKIP — requires DB | SKIP — requires DB |
| `scripts/test-viona-mobile-sos-shell-consolidation-phase-1.ts` | FAIL | FAIL |
| `scripts/test-viona-modern-home-shell-mode-resolver-foundation.ts` | PASS | PASS |
| `scripts/test-viona-pack30d-5-real-provider-circuit-breaker.ts` | PASS | PASS |
| `scripts/test-viona-pack32-1-marketing-content-generator.ts` | PASS | PASS |
| `scripts/test-viona-pack32-3-marketing-route-wiring.ts` | PASS | PASS |
| `scripts/test-viona-pack32-4-marketing-admin-ui.ts` | PASS | PASS |
| `scripts/test-viona-pack32-5-core-integration-audit.ts` | PASS | PASS |
| `scripts/test-viona-pack32-autonomous-dispatcher.ts` | PASS | PASS |
| `scripts/test-viona-pack37-b2b-dispatcher-realization.ts` | PASS | PASS |
| `scripts/test-viona-pack39-routing-performance-and-test-isolation.ts` | PASS | PASS |
| `scripts/test-viona-rec2-home-shell-contract.ts` | PASS | PASS |
| `scripts/test-wallet-public-copy-ledger-terms.ts` | PASS | PASS |

Target validation totals 104 passing cases. No provider, Firebase, production DB or real credential was used. No functions typecheck/build/deploy is part of REL1.

The R1 guard still allows `generateTranslations` to have replaced translations before a concurrent status change is detected; the guarded approval write preserves `content` and `approvedBaseContent` when it returns 409. This is a recorded limitation, with no additional code change in REL1.

## Commit plan and evidence

Commits are created only after validation, in this order: (1) A0, (2) A0b + R1 and the two documentation files, (3) A0d. Each local commit message contains its pack, test result and `chưa deploy`. Exact commit/tree IDs and final file hashes are supplied in the consolidated report after verification, outside the commits they identify.

Environment document `docs/ops/VIONA_P0_PAID_AI_CONTAINMENT_ENV.md` SHA-256: `05BFE36469CF22D561C4CDDF01FD90B52423425F21FA6DCAEEAAB6CC06064D8A`. Together with the nine-file table above, this covers all other changed files. This manifest's own SHA-256 and the exact commit/tree IDs are reported externally to avoid self-reference.

REL1 readiness: validation permitted its three authorized local commits. Default admission remains DENY. This containment is not a hard-dollar cap. REL1 preserved source candidates, SOS Core and its excluded functions/Academy/protected paths.

## Operator disposal instructions — not executed

Only if the Operator decides to discard this isolated branch/worktree:

```powershell
git --git-dir='C:\Users\uživatel\Documents\ChatGPT\Viona\.viona-p0-rel1.git' worktree remove 'C:\Users\uživatel\Documents\ChatGPT\Viona\viona-p0-rel1'
git --git-dir='C:\Users\uživatel\Documents\ChatGPT\Viona\.viona-p0-rel1.git' branch -D 'integration/p0-paid-ai-containment-v1'
```

The worktree removal has no force option and stops if later uncommitted work exists. These commands target only the independent REL1 Git storage.

## REL2 — two local commits completed; manifest remains outside commits

- Authorizations: `APPROVE_VIONA_P0_REL2_LOCAL_INTEGRATION_A0C_A0E_V1` and `APPROVE_VIONA_P0_REL2_AMENDMENT_A0E_TEST_GUARD_V1`.
- Starting HEAD: `bf0197e3ba9a15cd603599985c75a0cb3b4d53d0`; current HEAD: `f1641d0df61276a64432981c8bb9387fdf58bb07`; current tree: `6ffb39ae5fc65e2c2d105a0643f96cc8bc0f3c19`.
- Branch: `integration/p0-paid-ai-containment-v1`, worktree `viona-p0-rel1`, private Git storage `.viona-p0-rel1.git`; no branch, worktree or Git-storage substitution.
- Initial REL2 preflight found the integration worktree clean. The amendment preflight matched exactly the ten expected uncommitted REL2 paths, with no staged paths. Source candidates remain detached at `3a6798d7752caf61000060f7f0401297d3f6f92a`, with exactly their four expected paths each.
- Seven copied source/test files remain byte-for-byte identical to the reviewed sources. The integrated A0e test has only the explicitly authorized guard replacement and three SHA-256 checks. Both source worktrees are unmodified.
- Validation status: PASS, including all five target scripts and no new failing selective regression.
- Commit status: exactly two authorized local commits created, (4) P0-A0c and (5) P0-A0e-v2. The index is empty. Only this manifest remains unstaged, outside the two commits as explicitly permitted by the Operator; the whole worktree is therefore not reported as clean.

### Review provenance and released commit condition

The Operator's latest message explicitly confirms independent P0-A0c review = PASS and authorizes the two local commits. That message releases the amendment's earlier commit hold. The review covers bundle P0-A0C (eight source files plus one diff); its final file, `functions/src/trustRuntimeDiagnostics.ts`, was checked locally and matches `AAAF6B9DB6C3A54735B597971FC05DC552A4715281BC916866219FC1817C6B3F`. This file was not edited or staged. The Operator classifies this review as weak and insufficient as a basis for deployment; the report preserves that limitation.

### REL2 source/destination SHA-256

| Source worktree | Path | Source SHA-256 | Integration SHA-256 |
| --- | --- | --- | --- |
| `viona-p0-a0c` | `functions/src/index.ts` | `F0C51CDBB517B1768313F82D72484D2E93CF66519C31D7D7CADEB1BDF9B1F4A8` | `F0C51CDBB517B1768313F82D72484D2E93CF66519C31D7D7CADEB1BDF9B1F4A8` |
| `viona-p0-a0c` | `functions/src/aiProxyValidation.ts` | `1DFA9C86A577294B9068817BB788212F3A3CBE92C0CEDFC200733EA1A888FE6D` | `1DFA9C86A577294B9068817BB788212F3A3CBE92C0CEDFC200733EA1A888FE6D` |
| `viona-p0-a0c` | `functions/src/aiProxyRateLimit.ts` | `95F0487DEB558188F26A6DC602A71B7F612DC07AF61027C9F75EF6A16A525222` | `95F0487DEB558188F26A6DC602A71B7F612DC07AF61027C9F75EF6A16A525222` |
| `viona-p0-a0c` | `scripts/test-viona-aiproxy-soft-caps.ts` | `7DAE92B6F601954EF7CBB47C936B0C79CDFAB41FDC56D54E5C5EE6D46A8A83A1` | `7DAE92B6F601954EF7CBB47C936B0C79CDFAB41FDC56D54E5C5EE6D46A8A83A1` |
| `viona-p0-a0e` | `src/services/voicePersona/voicePersonaTypes.ts` | `04C035E64132725CCECCBF3E36062FE320B970B89360241E90BFE99A1F910E13` | `04C035E64132725CCECCBF3E36062FE320B970B89360241E90BFE99A1F910E13` |
| `viona-p0-a0e` | `src/services/voicePersona/resolveVoiceProfile.ts` | `6813ED672443F30A03C90A68542B8CCB2FCBDEBA73FE5908CAD166DD271A2269` | `6813ED672443F30A03C90A68542B8CCB2FCBDEBA73FE5908CAD166DD271A2269` |
| `viona-p0-a0e` | `src/services/voice/voicePersonaRegistry.ts` | `A78B968415A3081B94E17AF2F606D3B2409C9E9138FD131C5C7462024AABBADA` | `A78B968415A3081B94E17AF2F606D3B2409C9E9138FD131C5C7462024AABBADA` |
| `viona-p0-a0e` | `scripts/test-viona-voice-scenario-retail-taphoa.ts` | `84520C3E897DC8247CCA85D1EAA3A0838B54D85D93649EC0478E3084D87B771B` | `E73D5DA65FABE7128469DF4ABEC5D7E7C358E0476F0081E5081E7978EA37DD05` |

The different A0e test destination hash is the amendment's sole exception to source = destination. All seven other copies, including the three reviewed A0e-v2 modules checked by the amended test, still match their source hashes.

### Authorized test diff and before/after evidence

- File: `scripts/test-viona-voice-scenario-retail-taphoa.ts`, integrated copy only.
- Before SHA-256: `84520C3E897DC8247CCA85D1EAA3A0838B54D85D93649EC0478E3084D87B771B`.
- After SHA-256: `E73D5DA65FABE7128469DF4ABEC5D7E7C358E0476F0081E5081E7978EA37DD05`.
- The source test is unchanged. An exact string-replacement comparison proves every other byte of the integrated test is unchanged; BASE and all 32 cases retain their original logic.
- The ancestry command runs against real read-only Git state. Its result and the baseline source bytes are not mocked.
- The three new startup SHA assertions use the reviewed A0e-v2 values and do not add or remove test cases.

The source-to-integration diff contains only:

```diff
-assert.equal(git(['rev-parse', 'HEAD']).trim(), BASE);
+git(['merge-base', '--is-ancestor', BASE, 'HEAD']);
+const REVIEWED_A0E_V2_SHA256: Readonly<Record<string, string>> = {
+  [TYPES]: '04C035E64132725CCECCBF3E36062FE320B970B89360241E90BFE99A1F910E13',
+  [PROFILE]: '6813ED672443F30A03C90A68542B8CCB2FCBDEBA73FE5908CAD166DD271A2269',
+  [REGISTRY]: 'A78B968415A3081B94E17AF2F606D3B2409C9E9138FD131C5C7462024AABBADA',
+};
+for (const [file, expected] of Object.entries(REVIEWED_A0E_V2_SHA256)) {
+  assert.equal(createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex').toUpperCase(), expected);
+}
```

### Validation after the amendment

| Check | Result |
| --- | --- |
| Root `tsc --noEmit` | PASS — noEmit; incremental disabled |
| Functions `tsc --noEmit` | PASS — noEmit; incremental disabled |
| `scripts/test-viona-llm-provider-admission-gate.ts` | PASS — 42 cases |
| `scripts/test-viona-p0-a0b-direct-caller-containment.ts` | PASS — 43 cases |
| `scripts/test-viona-minhkhang-no-paid-fallback.ts` | PASS — 19 cases |
| `scripts/test-viona-aiproxy-soft-caps.ts` | PASS — 52 cases |
| `scripts/test-viona-voice-scenario-retail-taphoa.ts` | PASS — 32 cases |
| Selective offline regressions | REL1 control and amended REL2 both 23 PASS / 2 known FAIL / 16 DB-required SKIP; zero new failures |
| `git diff --check` | PASS |
| SHA source = destination | PASS for seven unchanged copies; approved A0e test exception recorded above |
| `functions/lib/index.js` | Unchanged, SHA-256 `6619F7642D30AF0D437311FE7A3C0E5B2830F98449E7E08E4E20FCA475F9C2CF` |

All five target scripts pass: 42 + 43 + 19 + 52 + 32 = 188 cases. A0e performs 13,752 identical before/after comparisons across all 12 previous scenarios. Both output digests are `202AC09945D43FF2736F494069BD47D4CF6FADEA0AAB1CF95AF814D570367BB9`. The original exact-HEAD test failure is resolved by the approved amendment.

The same 41 regression scripts listed in the REL1 table were rerun. The control reads the six overwritten modules and the two documentation files from the REL1 starting commit into memory and hides the two newly added target scripts; the candidate reads the amended integrated worktree. All 25 executed top-level scripts have identical baseline/candidate status and output hashes. The two known failures remain Local public-copy (seven forbidden English strings) and the mobile SOS reserved-band contract. Sixteen DB-required scripts and optional DB branches remain skipped. The full 72-script R0 suite was not rerun.

Validation uses synthetic environments, closed loaders and an exact allowlist for the A0e test's read-only Git commands. Dotenv, real network/provider/DB access and repository writes are blocked. Target and regression audit counters show zero network, native DB-engine or repository-write attempts. Dependencies are reused read-only; no install, emitted output or functions build occurs.

### Documentation, preserved paths and runtime boundary

The environment document contains the three named AI_PROXY variables and changed/new soft-limit constants with defaults. Its current raw-byte SHA-256 is `05CE719287E768158C6C583368078E6448E2359EEFDF1CD2A130B9263AF46C67`; its earlier REL1 hash above is historical. This manifest's own current hash is reported externally.

The nine REL1 candidate file hashes remain unchanged. Main/source worktrees, `walletAuth.ts`, the functions voice caller, SOS Core, Academy and all other non-allowlisted paths remain unedited. No reset, clean, stash, pull, push, PR, merge or deployment is performed. `functions/lib` is not built or edited; it must be rebuilt before a separately approved deployment. The soft limits are not a Firebase admission gate or hard-dollar spending cap.

### Local commit evidence

| Number / pack | Commit SHA | Tree SHA | Parent |
| --- | --- | --- | --- |
| (4) P0-A0c | `3ad5ced95ef79753ce903e4c14009238f156d5b8` | `3a69d094b8880b7c96e98f72adbb6c04443cd186` | `bf0197e3ba9a15cd603599985c75a0cb3b4d53d0` |
| (5) P0-A0e-v2 | `f1641d0df61276a64432981c8bb9387fdf58bb07` | `6ffb39ae5fc65e2c2d105a0643f96cc8bc0f3c19` | `3ad5ced95ef79753ce903e4c14009238f156d5b8` |

Commit (4) contains exactly:

- `functions/src/index.ts`
- `functions/src/aiProxyValidation.ts`
- `functions/src/aiProxyRateLimit.ts`
- `scripts/test-viona-aiproxy-soft-caps.ts`
- `docs/ops/VIONA_P0_PAID_AI_CONTAINMENT_ENV.md`

Commit (5) contains exactly:

- `src/services/voicePersona/voicePersonaTypes.ts`
- `src/services/voicePersona/resolveVoiceProfile.ts`
- `src/services/voice/voicePersonaRegistry.ts`
- `scripts/test-viona-voice-scenario-retail-taphoa.ts`

Before each commit, the exact staged path set and every staged blob were compared with the validated candidate, applying normal LF text normalization. Staged whitespace checks passed. Hooks and GPG signing were disabled for these local commits. No evidence file was staged; no third REL2 commit was created.

The 188 target cases and both tsc checks passed on the combined candidate before committing. Their source hashes are unchanged after staging/committing; no unchanged validation suite was redundantly rerun in this final commit step. Post-commit checks cover the two commit file sets, parent chain, source/candidate hashes, original BASE ancestry, unstaged/index state and `git diff --check`.

The remaining Git status is exactly ` M docs/evidence/p0-rel1/MANIFEST.md`. All source/test paths and the environment document are clean; the index and untracked-file list are empty. This is the Operator-permitted evidence exception, not a claim that the whole worktree is clean. The two-commit budget does not authorize an additional evidence commit.

### Single next gate — evidence disposition

Operator authorization for one separate local commit containing only `docs/evidence/p0-rel1/MANIFEST.md` would allow the remaining evidence change to be recorded and the entire worktree to become clean. Until then the manifest stays outside the two pack commits. No push/PR/merge/deploy or functions build is authorized. The disposal commands above were not executed. STOP.
