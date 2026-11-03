# P0 REL1 — local integration manifest

- Date: 2026-11-03 (Europe/Prague).
- Authorization: `APPROVE_VIONA_P0_REL1_LOCAL_INTEGRATION_BRANCH_V1`.
- Base HEAD: `3a6798d7752caf61000060f7f0401297d3f6f92a`.
- Local branch: `integration/p0-paid-ai-containment-v1`.
- Worktree: `C:\Users\uživatel\Documents\ChatGPT\Viona\viona-p0-rel1`.
- Independent local Git storage: `C:\Users\uživatel\Documents\ChatGPT\Viona\.viona-p0-rel1.git`.
- Included packs: P0-A0; P0-A0b + R1; P0-A0d.
- Excluded: P0-A0c, P0-A0e and every `functions/` path.
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

## Local validation

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

Local readiness: validation permits the three authorized local commits; there is no new failing regression to stop them. Default admission remains DENY. This containment is not a hard-dollar cap. Source candidates, SOS Core and all excluded functions/Academy/protected paths receive no source edits.

## Operator disposal instructions — not executed

Only if the Operator decides to discard this isolated branch/worktree:

```powershell
git --git-dir='C:\Users\uživatel\Documents\ChatGPT\Viona\.viona-p0-rel1.git' worktree remove 'C:\Users\uživatel\Documents\ChatGPT\Viona\viona-p0-rel1'
git --git-dir='C:\Users\uživatel\Documents\ChatGPT\Viona\.viona-p0-rel1.git' branch -D 'integration/p0-paid-ai-containment-v1'
```

The worktree removal has no force option and stops if later uncommitted work exists. These commands target only the independent REL1 Git storage.
