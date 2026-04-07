# Cloud Functions bundle parity (Kết Nối Global)

`functions/lib/index.js` is a **committed build artifact**: esbuild bundles shared app code from `../src` (alias `@app`) into the Functions entrypoint. If you change logic that the bundle pulls in — especially **`src/config/countryPacks/**`**, **`src/services/PaymentsService.ts`**, **`src/config/Pricing.ts`**, or B2B billing paths — the **deployed** runtime can drift from the **Expo app** until `lib` is rebuilt and committed.

## Before merging or deploying Functions

1. From repo root: **`npm run functions:verify-bundle`**  
   - Rebuilds `functions/` and **fails** if build introduces new `functions/lib` changes relative to pre-build git state.

2. Or manually: `cd functions && npm run build`, then commit any updates to `functions/lib`.

## Scripts

| Location | Command |
|----------|---------|
| Repo root | `npm run functions:build` — build only |
| Repo root | `npm run functions:verify-bundle` — build + git parity check |
| `functions/` | `npm run verify-bundle` — same as verify |

## HEAD sync after build (fail if `functions/lib` not committed)

The verify script runs a **`git diff --quiet HEAD -- functions/lib`** check when:

- **`CI=true`** or **`GITHUB_ACTIONS=true`** — **on by default**, unless **`FUNCTIONS_BUNDLE_CI_RELAX_HEAD_SYNC=1`** (escape hatch; document in PR why).
- **`FUNCTIONS_BUNDLE_CI_REQUIRE_HEAD_SYNC=1`** — same check locally or in non-GitHub CI.

This catches PRs that changed bundled `../src` or `functions/src` but did not commit an updated `functions/lib`.

## Escape hatches

- **`SKIP_FUNCTIONS_BUNDLE_GIT_CHECK=1`** — rebuild only; no git parity check (e.g. no `.git` directory).
- If **`git`** is not on `PATH`, the script rebuilds and **exits 0** with a warning (local sandboxes). In **CI** (`CI=true` or `GITHUB_ACTIONS`), missing git **fails** the script so checks are not silently skipped.

## Phase 3+ expectation

Any PR that touches bundled `@app` modules or `functions/src` should either:

- include an updated **`functions/lib`** from a clean `npm run build`, or  
- prove the bundle output is unchanged (verify-bundle passes without diff).

This does **not** replace full integration tests; it only reduces **accidental stale `lib`** shipping while avoiding false failures from unrelated pre-existing git dirt.
