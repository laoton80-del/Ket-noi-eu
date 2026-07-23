# VIONA — PR #436 TypeScript RangeError No-Product-Change Tooling Triage Packet

**Primary classification:** `READY_FOR_VIONA_PR436_TYPESCRIPT_RANGEERROR_NO_PRODUCT_CHANGE_TOOLING_TRIAGE_PACKET_PR_REVIEW`

**Primary root-cause classification:** `BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION`

**PR #436 post-merge closure impact:** `PR436_POST_MERGE_VALIDATION_REMAINS_BLOCKED_PENDING_TOOLING_REMEDIATION`

**Authorization (this packet only):** `APPROVE_VIONA_FC_P0_PR436_POST_MERGE_TYPESCRIPT_RANGEERROR_NO_PRODUCT_CHANGE_TOOLING_TRIAGE_PACKET`

**Mode:** Strict read-only root-cause triage + docs-only result — **no** product change, dependency change, toolchain install, typecheck workaround, or E8 deployment

**Canonical master baseline:** `7f001c6fd403be795c812e247856d23af08a148f` (PR #436 squash)

**Held post-merge block:** `BLOCKED_PR436_POST_MERGE_VALIDATION_TYPESCRIPT_RANGEERROR` / `PR436_CONTENT_PRESERVED_BUT_POST_MERGE_VALIDATION_NOT_GREEN`

**Preserved E8 Case A:** `E8_CASE_A_DOCS_ONLY_RECOMMENDED`

**Branch:** `docs/viona-pr436-typescript-rangeerror-no-product-change-tooling-triage`

```text
TYPESCRIPT_RANGEERROR_TOOLING_TRIAGE_AUTHORIZED_FOR_DOCS_ONLY
NO_PRODUCT_CHANGE
NO_DEPENDENCY_CHANGE
NO_TOOLCHAIN_INSTALL
NO_TYPECHECK_WORKAROUND
NO_NODE_OPTIONS
NO_STACK_SIZE_INCREASE
NO_E8_DEPLOY
NO_LOGIN
NO_PROVIDER_MUTATION
NO_LOCAL_REQUEST
E8_THROUGH_E10_NOT_AUTHORIZED
REQUEST_ONLY_NO_CHARGE
BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION
PR436_POST_MERGE_VALIDATION_REMAINS_BLOCKED_PENDING_TOOLING_REMEDIATION
```

---

## 1. Purpose

Identify the safest root-cause classification for the reproducible failure:

```text
RangeError: Maximum call stack size exceeded
```

on the default repository typecheck (`npx tsc --noEmit` / `npm run typecheck` path inside `ci:release-discipline`).

This packet **does not** implement a fix.

---

## 2. Canonical workspace gate

| Check | Result |
|---|---|
| Top-level | `C:/KNG/ket-noi-eu` |
| Branch at triage start | `master` @ `7f001c6fd403be795c812e247856d23af08a148f` |
| `origin/master` | Identical |
| Working tree | Clean before docs branch |
| Sibling worktrees | Present on disk; **not used** |

---

## 3. Observed failure (held + re-characterized)

| Item | Value |
|---|---|
| Local Node | v24.14.1 |
| Local npm | 11.11.0 |
| Local TypeScript | 5.9.3 (`npx tsc --version`) |
| Lockfile TypeScript | 5.9.3 (`package-lock.json` → `node_modules/typescript`) |
| Declared range | `package.json` devDependency `typescript: ~5.9.2` |

### 3.1 Fresh characterization run (this triage)

| Command | UTC start → end | Exit | RangeError |
|---|---|---|---|
| `npx tsc --noEmit` | `2026-07-23T20:23:14Z` → `~20:24:00Z` | **1** | **Yes** |
| Approximate runtime | ~45 s | | |
| Normal TS diagnostics before crash | **None** (immediate RangeError from `_tsc.js`) | | |
| Working tree afterward | Clean | | |

**First complete error (sanitized):**

```text
RangeError: Maximum call stack size exceeded
    at addLazyDiagnostic / onSuccessfullyResolvedSymbol / resolveNameHelper
    at getResolvedSymbol / checkIdentifier / checkExpressionWorker
    at checkExpression / checkNonNullExpression / checkPropertyAccessExpression
Node.js v24.14.1
```

**Compiler phase classification:** `TYPE_RELATION` (type-checker symbol/expression recursion; not config parse or emit).

### 3.2 Related gates

| Command | Result |
|---|---|
| `npm run ci:expo-readiness` | PASS (prior post-merge + this packet validation) |
| `npm run ci:release-discipline` | FAIL — invokes `preflight:release` → `typecheck` → same RangeError |

---

## 4. Canonical toolchain contract

| Source | Finding |
|---|---|
| `package.json` `engines` | **Absent** |
| `package.json` `packageManager` | **Absent** |
| `.nvmrc` / `.node-version` / Volta | **Absent** |
| SETUP.md | Recommends Expo-compatible Node LTS; states engines **Chưa xác định** |
| `.github/workflows/release-discipline.yml` | `actions/setup-node@v4` with **`node-version: 20`**; `npm ci`; `npm run ci:release-discipline` |
| Workflow push branches | `push.branches: [main]` only — default branch is **`master`**, so master pushes may not run this workflow |
| Dockerfile / EAS Node pin | Not used as the default local typecheck contract |

**Contract classification:**

```text
CANONICAL_TOOLCHAIN_VERSION_PARTIALLY_DECLARED
```

- CI **explicitly** pins Node **20** for Release Discipline.
- TypeScript **~5.9.2** is declared; lock resolves **5.9.3**.
- Root `engines` / local version-manager files do **not** pin Node.
- Node **24** is **not** explicitly supported in repository contracts.

**Supported-toolchain comparison (local Node 20):**

```text
BLOCKED_CANONICAL_NODE_VERSION_NOT_LOCALLY_AVAILABLE_FOR_COMPARISON
```

No `nvm` / `fnm` / `volta` / `asdf` / alternate Node 20 binary found on the operator machine. This lane **did not install** Node 20.

Interpretation letter **D** applies: Node-version comparison remains unresolved locally. Therefore this packet **does not** primary-classify `BLOCKED_TYPESCRIPT_RANGEERROR_NODE24_TOOLCHAIN_INCOMPATIBILITY` even though CI evidence (below) is strong drift signal.

---

## 5. Dependency resolution inventory

| Check | Result |
|---|---|
| `npm ls typescript --all` | Single resolved **typescript@5.9.3**, all dependents **deduped** |
| Duplicate TypeScript majors | **None observed** |
| Critical packages | `expo@54.0.36`, `react@19.1.0`, `react-native@0.81.5`, `@types/react@19.1.17` present; no contradictory duplicate majors observed at depth 1 |
| Lockfile version | Present (`package-lock.json`; TypeScript entry 5.9.3) |
| `BLOCKED_TYPESCRIPT_RANGEERROR_DEPENDENCY_RESOLUTION_CONTRADICTION` | **Not selected** |

---

## 6. TSC configuration graph

| Item | Value |
|---|---|
| Root | `tsconfig.json` |
| Extends | `expo/tsconfig.base` only |
| Project references | **None** |
| Root exclude | `functions/**` only |
| Expo base exclude | `node_modules`, babel/metro/jest configs, `android`, `ios` |
| Expo base `allowJs` | **true** |
| `skipLibCheck` | true (from Expo base) |
| `module` / `moduleResolution` / `jsx` | `preserve` / `bundler` / `react-native` |
| Composite / incremental | unset |
| Circular extends / references | **Not found** |

`npx tsc --showConfig` succeeded (exit 0).  
`BLOCKED_TYPESCRIPT_RANGEERROR_TSCONFIG_GRAPH_RECURSION` — **not selected**.

---

## 7. Input-scope analysis (primary finding)

`npx tsc --noEmit --listFilesOnly` **succeeded** (exit 0, ~15 s, ~4111 paths).

Critical unintended inclusions under the repository root (not `node_modules`):

```text
./dist/_expo/static/js/web/index-7d904f92341ebbfce89f9c6c3188af97.js
./dist/_expo/static/js/web/index-d0ca90b2e69587df7b967178d473cfeb.js
```

These are **generated Expo web export artifacts** from a prior local `npm run build:web` (gitignored `dist/`). They appear in both `--listFilesOnly` and `--showConfig` `files`.

Mechanism:

1. Expo base sets **`allowJs: true`**.
2. Root `tsconfig.json` excludes only `functions/**`.
3. Local `dist/` exists and is therefore eligible for program inclusion.
4. The listed bundles are large minified JS (multi‑MB) — unsuitable as typecheck inputs.
5. Type-checker then fails with stack overflow during **TYPE_RELATION** (no normal diagnostics).

Temporal correlation (same operator session):

- PR #436 readiness packet authoring ran typecheck **before** `build:web` and recorded PASS.
- After `dist/` was produced, subsequent `npx tsc --noEmit` runs reproduce RangeError.

**Not** observed as typecheck inputs: `.expo/` app sources as primary crash set; `web-build/`; sibling worktree paths; repo `prisma/generated` copies; filesystem link cycles.

```text
BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION
```

---

## 8. Filesystem link analysis

Depth-4 reparse-point scan under the canonical root: **0** hits.

```text
BLOCKED_TYPESCRIPT_RANGEERROR_FILESYSTEM_LINK_CYCLE
```

**Not selected.**

---

## 9. Targeted project isolation

| Project | Command | Exit | RangeError | Notes |
|---|---|---|---|---|
| Root (default) | `npx tsc --noEmit` | 1 | **Yes** | Includes `dist/**/*.js` when present |
| Functions (existing) | `npx tsc --noEmit -p functions/tsconfig.json` | 2 | **No** | Ordinary `error TS2322` in functions source (pre-existing Functions debt); **not** the RangeError |

```text
TYPESCRIPT_RANGEERROR_NOT_ISOLATED_BY_EXISTING_PROJECT_BOUNDARIES
```

(The failure is tied to **root** program inputs — specifically generated `dist/` — not to a separate named composite project.)

Functions ordinary type error is recorded only as isolation evidence; this packet does **not** authorize Functions remediation.

---

## 10. CI evidence

| Field | Value |
|---|---|
| Workflow | Release Discipline (`release-discipline.yml`) |
| PR #436 run | `30039107132` @ head `b249166af436f65fae21776d60ccdb512241a72f` |
| Conclusion | **success** |
| CI Node | **v20.20.2** (setup-node `node-version: 20`) |
| CI npm | 10.8.2 (from job log) |
| Command path | `ci:release-discipline` → `typecheck` → `tsc --noEmit` |
| Typecheck | **Green** (smoke OK after typecheck; ~2m wall) |
| Tree equivalence | Squash `7f001c6…` tree == reviewed head `b249166…` tree |
| Fresh CI workspace | No local `dist/` (gitignored) |

Classification for same content:

```text
CI_TYPECHECK_GREEN_ON_SAME_SOURCE_SHA
```

(PR head tree-equivalent to master squash; CI ran on PR event. Master push may not trigger this workflow because `on.push.branches` lists `main` while default branch is `master`.)

CI green under Node 20 **without** `dist/` is strong evidence that:

- the repository source at PR #436 is typecheckable under the CI toolchain;
- local RangeError is **not** explained by PR #436 docs content itself;
- **input-scope** (`dist/` + `allowJs`) is the decisive local differentiator.

It is **not** automatic sole proof of Node 24 incompatibility (local Node 20 comparison unavailable).

---

## 11. Root-cause decision

**Exactly one primary classification:**

```text
BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION
```

**Rationale:** Generated `dist/` web JS is accidentally included in the default root typecheck because `allowJs` is enabled and `dist/` is not excluded; crash occurs in the type-relation phase; CI without `dist/` is green on equivalent source; no tsconfig cycle, no FS link cycle, no duplicate TypeScript majors; Node 24 comparison unresolved locally so Node24 incompatibility is **not** the primary label.

**Not selected as primary:** Node24 incompatibility, dependency contradiction, tsconfig graph recursion, filesystem link cycle, isolated canonical project failure, compiler defect suspected, unresolved.

---

## 12. Remediation options (unimplemented)

### Option 1 — Exclude generated web export from root typecheck (preferred)

| Field | Content |
|---|---|
| Addresses | Input-scope inclusion of `dist/**` under `allowJs` |
| Impact | Tooling-only; no runtime product behavior change |
| Future files | Likely `tsconfig.json` `exclude` additions (`dist`, optionally `.expo`) |
| Lockfile | No |
| CI | Aligns local with CI (CI already lacks `dist`) |
| Rollback | Revert exclude |
| Validation | `npx tsc --noEmit` and `ci:release-discipline` on dirty local tree with `dist` present |
| Risk | Low if only generated dirs excluded |
| Kind | Tooling-only |
| Proposed phrase | `APPROVE_VIONA_TSCONFIG_EXCLUDE_GENERATED_WEB_EXPORT_FROM_ROOT_TYPECHECK` |

### Option 2 — Document + pin canonical Node 20; operator hygiene for `dist/`

| Field | Content |
|---|---|
| Addresses | Partial toolchain undeclared + operator Node 24 drift; reinforces not typechecking export artifacts |
| Impact | Docs + optional `engines` / `.nvmrc`; no runtime change |
| Future files | `package.json` engines, `.nvmrc`, SETUP / RELEASE docs |
| Lockfile | No (unless separately authorized) |
| CI | Matches already-declared CI Node 20 |
| Rollback | Revert docs/engines |
| Validation | Re-run typecheck under Node 20 **with and without** `dist` (separate lane) |
| Risk | Medium if operators ignore engines; does not alone fix `allowJs`+`dist` |
| Kind | Docs-only / light tooling |
| Proposed phrase | `APPROVE_VIONA_CANONICAL_NODE20_TOOLCHAIN_CONTRACT_AND_DIST_TYPECHECK_HYGIENE_DOCS` |

### Option 3 — Align Release Discipline push trigger to `master`

| Field | Content |
|---|---|
| Addresses | Workflow `push.branches: main` vs default branch `master` gap |
| Impact | CI signal on master merges; does not by itself fix local RangeError |
| Future files | `.github/workflows/release-discipline.yml` |
| Lockfile | No |
| CI | Enables master push runs |
| Rollback | Revert workflow |
| Validation | Push/no-op workflow dry observation |
| Risk | Low |
| Kind | Tooling-only (CI) |
| Proposed phrase | `APPROVE_VIONA_RELEASE_DISCIPLINE_WORKFLOW_MASTER_BRANCH_TRIGGER_ALIGNMENT` |

**Ranking:** Option 1 > Option 2 > Option 3.

**Do not recommend:** increasing V8 stack size, `transpileOnly`, manufacturing `skipLibCheck`/exclude of product sources, dependency bumps without evidence, Node install inside this lane.

---

## 13. PR #436 closure impact

```text
PR436_POST_MERGE_VALIDATION_REMAINS_BLOCKED_PENDING_TOOLING_REMEDIATION
```

Reasons:

- Required local `npx tsc --noEmit` / `ci:release-discipline` remain **red** on the operator machine.
- Root cause is tooling/input-scope, not PR #436 docs content corruption.
- Post-merge verification cannot be fully closed while required validation remains red.

**Unchanged E8 conclusions:**

```text
E8_CASE_A_DOCS_ONLY_RECOMMENDED
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE   # review-derived; not claimed verbatim in E8 packet
```

E8 phrase `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY` remains **PROPOSED / NOT GRANTED / NOT EFFECTIVE / NOT AUTHORIZED**.

---

## 14. Security

No tokens, credentials, phones, PINs, JWTs, DB URLs, full Business/User IDs, or customer PII added. Diagnostic logs were written under the OS temp directory (outside the repository) and are not committed.

---

## 15. Validation (this docs packet session)

| Command | Result |
|---|---|
| Docs-only intent | Yes (this packet) |
| `npm run ci:expo-readiness` | Expected PASS (run on docs branch) |
| `npx tsc --noEmit` | **FAIL** — known RangeError (honest; not reported green) |
| `npm run ci:release-discipline` | **FAIL** — same TypeScript path |
| Product/dependency/toolchain mutation | **None** |
| Workarounds | **None** |

---

## 16. Final classification

```text
READY_FOR_VIONA_PR436_TYPESCRIPT_RANGEERROR_NO_PRODUCT_CHANGE_TOOLING_TRIAGE_PACKET_PR_REVIEW
BLOCKED_TYPESCRIPT_RANGEERROR_INPUT_SCOPE_RECURSION
PR436_POST_MERGE_VALIDATION_REMAINS_BLOCKED_PENDING_TOOLING_REMEDIATION
```

Confirm:

- no source change;
- no dependency change;
- no toolchain installation;
- no stack workaround;
- no E8 deploy;
- no login;
- no provider mutation;
- no Local request;
- E8–E10 unauthorized;
- `REQUEST_ONLY_NO_CHARGE` preserved.
