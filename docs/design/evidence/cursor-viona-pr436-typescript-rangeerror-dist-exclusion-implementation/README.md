# Evidence — PR #436 TypeScript RangeError Dist Exclusion Implementation

## 1. Authorization

`APPROVE_VIONA_PR436_TYPESCRIPT_RANGEERROR_EXCLUDE_GENERATED_DIST_NO_PRODUCT_CHANGE_IMPLEMENTATION`

## 2. Baseline

`48da52e4e2619a1b2e5a268e2841a858be1f4fae`

## 3. Classification

- Branch: `fix/viona-pr436-exclude-generated-dist-from-root-typecheck`
- Primary: `READY_FOR_VIONA_PR436_TYPESCRIPT_RANGEERROR_DIST_EXCLUSION_NO_PRODUCT_CHANGE_IMPLEMENTATION_RESULT_PR_REVIEW`
- Markers: `GENERATED_DIST_EXCLUDED_FROM_ROOT_TYPESCRIPT_INPUT_SCOPE` / `DIST_EXCLUSION_REMOVED_ONLY_GENERATED_WEB_ARTIFACT_INPUTS`
- PR #436 impact: `PR436_POST_MERGE_VALIDATION_READY_FOR_RECHECK_AFTER_DIST_EXCLUSION_REMEDIATION`

## 4. Exact change

| Path | Change |
|---|---|
| `tsconfig.json` | `"exclude": ["functions/**", "dist/**"]` |
| Result packet | docs product + this evidence tree |
| Kernel / Handoff | Sync rows |

## 5. Proof summary

| Stage | Dist in `showConfig` | `tsc --noEmit` |
|---|---|---|
| Pre-change | 2 | RangeError (exit 1) |
| Post-change (dist present) | 0 | exit 0 |
| After `build:web` regen | 0 | exit 0 |

Removed program inputs: only the two `dist/_expo/static/js/web/*.js` files. Non-dist removed: 0. `ci:expo-readiness` + `ci:release-discipline`: PASS.

## 6. Boundaries

No dist deletion; no package/lockfile/Node/TS version change; no E8 deploy; E8 Case A preserved; Case B blockers preserved; `REQUEST_ONLY_NO_CHARGE` preserved.
