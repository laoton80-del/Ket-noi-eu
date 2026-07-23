# VIONA — PR #436 TypeScript RangeError Dist Exclusion No-Product-Change Implementation Result

**Primary classification:** `READY_FOR_VIONA_PR436_TYPESCRIPT_RANGEERROR_DIST_EXCLUSION_NO_PRODUCT_CHANGE_IMPLEMENTATION_RESULT_PR_REVIEW`

**Input-scope markers:**

```text
GENERATED_DIST_EXCLUDED_FROM_ROOT_TYPESCRIPT_INPUT_SCOPE
DIST_EXCLUSION_REMOVED_ONLY_GENERATED_WEB_ARTIFACT_INPUTS
PR436_POST_MERGE_VALIDATION_READY_FOR_RECHECK_AFTER_DIST_EXCLUSION_REMEDIATION
```

**Authorization:** `APPROVE_VIONA_PR436_TYPESCRIPT_RANGEERROR_EXCLUDE_GENERATED_DIST_NO_PRODUCT_CHANGE_IMPLEMENTATION`

**Mode:** Minimal tooling-only root TypeScript input-scope remediation — **no** product/runtime change, dependency change, dist deletion, or E8 deployment

**Canonical baseline:** `48da52e4e2619a1b2e5a268e2841a858be1f4fae` (PR #437 triage squash)

**Branch:** `fix/viona-pr436-exclude-generated-dist-from-root-typecheck`

**Held root cause (PR #437):** `BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION`

```text
DIST_EXCLUSION_AUTHORIZED_FOR_ROOT_TSCONFIG_ONLY
NO_PRODUCT_RUNTIME_BEHAVIOR_CHANGE
NO_PACKAGE_OR_LOCKFILE_CHANGE
NO_DIST_DELETION
NO_NODE_OPTIONS
NO_STACK_WORKAROUND
NO_E8_DEPLOY
E8_CASE_A_DOCS_ONLY_RECOMMENDED
E8_THROUGH_E10_NOT_AUTHORIZED
REQUEST_ONLY_NO_CHARGE
```

---

## 1. Purpose

Remove generated Expo web export artifacts under `dist/` from the default root TypeScript program so `npx tsc --noEmit` no longer stack-overflows when local `dist/` exists after `npm run build:web`.

---

## 2. Source confirmation

| Fact | Evidence |
|---|---|
| Default typecheck | `package.json` → `typecheck`: `db:generate && tsc --noEmit` (root `tsconfig.json`) |
| Extends | `expo/tsconfig.base` → effective `allowJs: true` |
| Pre-change exclude | `["functions/**"]` only |
| Build output | `build:web` → `npx expo export --platform web` → `dist/` (gitignored) |
| Source not under dist | Canonical sources live under `src/`, `App.tsx`, etc. |
| Functions boundary | Root continues to exclude `functions/**`; Functions debt (TS2322) unchanged / not fixed |

---

## 3. Exact configuration change

**File:** `tsconfig.json`

**Before:**

```json
"exclude": ["functions/**"]
```

**After:**

```json
"exclude": ["functions/**", "dist/**"]
```

No other compiler options changed (`allowJs`, `skipLibCheck`, strictness, module resolution, JSX, paths untouched).

---

## 4. Pre-change evidence (dist present)

| Item | Value |
|---|---|
| `dist/_expo/static/js/web/*.js` | Present (2 bundles) |
| Effective `allowJs` | true |
| `tsc --showConfig` files | 1543 |
| Dist files in scope | **2** |
| Src-ish count | 1131 |
| `npx tsc --noEmit` | exit **1** — `RangeError: Maximum call stack size exceeded` |

---

## 5. Post-change input-scope proof (dist still present)

| Item | Value |
|---|---|
| Effective exclude | `functions/**`, `dist/**` |
| `tsc --showConfig` files | 1541 |
| Dist files in scope | **0** |
| Src-ish count | 1131 (unchanged) |
| Removed from program | Exactly the 2 prior `dist/_expo/static/js/web/*.js` paths |
| Non-dist removed | **0** |

```text
GENERATED_DIST_EXCLUDED_FROM_ROOT_TYPESCRIPT_INPUT_SCOPE
DIST_EXCLUSION_REMOVED_ONLY_GENERATED_WEB_ARTIFACT_INPUTS
```

---

## 6. Validation (dist present; no deletion)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit **0** — no RangeError |
| `npm run ci:expo-readiness` | PASS |
| `npm run ci:release-discipline` | PASS (exit 0) |

Ordinary root TypeScript diagnostics after RangeError removal: **none**.

Functions project TS2322 remains a separate known issue outside this root remediation (root Release Discipline path green).

---

## 7. Build regeneration check

| Step | Result |
|---|---|
| `npm run build:web` | exit 0; regenerated `dist/` |
| Post-build `tsc --showConfig` dist in scope | **0** |
| Post-build `npx tsc --noEmit` | exit **0** — no RangeError |

Artifact may still embed localhost API base — remains E8 Case B blocker `BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE`; out of scope for this tooling lane. Artifact not uploaded/committed.

---

## 8. No-product-change proof

| Area | Diff |
|---|---|
| `tsconfig.json` | exclude `dist/**` only |
| Docs/evidence/Kernel/Handoff | Result documentation |
| `src/`, prisma, migrations, package files, workflows, env, assets | **No** |

```text
NO_PRODUCT_RUNTIME_BEHAVIOR_CHANGE
```

---

## 9. PR #436 closure impact

```text
PR436_POST_MERGE_VALIDATION_READY_FOR_RECHECK_AFTER_DIST_EXCLUSION_REMEDIATION
```

Not yet final verified-on-master closure. Remaining sequence:

1. Strict-review this remediation PR  
2. Merge  
3. Post-merge verify on canonical master  
4. Required validation on master with generated `dist` present  

---

## 10. E8 boundary (unchanged)

```text
E8_CASE_A_DOCS_ONLY_RECOMMENDED
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

E8–E10 remain unauthorized. This change does not authorize client deploy, project binding, Local QA, or E9–E10.

`REQUEST_ONLY_NO_CHARGE` preserved. AI hard-stop not started.

---

## 11. Security

No env values, tokens, credentials, PII, or generated bundle contents committed. `dist/` remains gitignored.

---

## 12. Final classification

```text
READY_FOR_VIONA_PR436_TYPESCRIPT_RANGEERROR_DIST_EXCLUSION_NO_PRODUCT_CHANGE_IMPLEMENTATION_RESULT_PR_REVIEW
GENERATED_DIST_EXCLUDED_FROM_ROOT_TYPESCRIPT_INPUT_SCOPE
DIST_EXCLUSION_REMOVED_ONLY_GENERATED_WEB_ARTIFACT_INPUTS
PR436_POST_MERGE_VALIDATION_READY_FOR_RECHECK_AFTER_DIST_EXCLUSION_REMEDIATION
```

Confirm:

- dist remained present during typecheck validation;
- RangeError no longer reproduced;
- regenerated dist after build remained excluded;
- no product/runtime change;
- no package/dependency/toolchain change;
- remediation PR not yet merged;
- E8–E10 remain unauthorized;
- `REQUEST_ONLY_NO_CHARGE` preserved.
