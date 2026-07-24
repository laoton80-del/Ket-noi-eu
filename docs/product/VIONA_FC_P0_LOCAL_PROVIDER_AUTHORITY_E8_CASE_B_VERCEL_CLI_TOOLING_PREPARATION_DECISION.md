# VIONA FC-P0 — E8 Case B Vercel CLI Tooling-Preparation Decision

**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_TOOLING_PREPARATION_DECISION_PACKET_PR_REVIEW`

**Installation-method decision:** `VERCEL_CLI_PINNED_GLOBAL_INSTALLATION_RECOMMENDED_FOR_SEPARATE_AUTHORIZATION`

**Authorization (this packet only):** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_TOOLING_PREPARATION_DECISION_PACKET`

**Mode:** Strict docs-only tooling decision + read-only local toolchain inventory + read-only official documentation / registry metadata review — **no** CLI install, package fetch/install, Vercel login, project create/link, Git connect, env mutation, build, deploy, or B1A retry

**Canonical master baseline:** `5f658cd08842c5be58de5f29f673cb285bb002f2` (PR #441 verified tip)

**Held B1A state:**

```text
BLOCKED_B1A_VERCEL_CLI_NOT_AVAILABLE
```

**Preserved Case B blockers:**

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

**Branch:** `docs/viona-fc-p0-local-provider-authority-e8-case-b-vercel-cli-tooling-preparation-decision`

```text
NO_CLI_INSTALLATION
NO_PACKAGE_FETCH_OR_INSTALL
NO_VERCEL_LOGIN
NO_PROJECT_CREATION
NO_LOCAL_PROJECT_LINK
NO_GIT_CONNECTION
NO_ENVIRONMENT_MUTATION
NO_BUILD
NO_DEPLOYMENT
NO_B1A_RETRY
NO_B1B_THROUGH_B7
NO_E8_DEPLOY
REQUEST_ONLY_NO_CHARGE
AI_HARD_STOP_NOT_STARTED
```

---

## 1. Purpose

Select the safest, reproducible, reversible method for making a usable Vercel CLI available on the operator machine.

This packet decides installation scope, version policy, package source, repository impact, PATH behavior, authentication separation, uninstall/rollback, supply-chain evidence, validation contract, and a future installation authorization phrase.

This packet does **not** install the CLI or authorize B1A.

---

## 2. Canonical workspace gate

| Check | Result |
|---|---|
| Top-level | `C:/KNG/ket-noi-eu` |
| Branch at start | `master` @ `5f658cd08842c5be58de5f29f673cb285bb002f2` |
| `origin/master` | Identical tip |
| Working tree | Clean (ignored `dist/` only) |
| Contains PR #441 | Yes |
| Later commits after tip | **None** |
| Sibling worktrees | Present on disk; **not used** |

No `BLOCKED_VERCEL_CLI_TOOLING_PACKET_CANONICAL_SOURCE_ADVANCED_REVIEW_REQUIRED`.

---

## 3. Current verified tooling state (held)

| Fact | Status |
|---|---|
| `vercel` on PATH | **NO** (reconfirmed this session) |
| `node_modules/.bin/vercel` | **ABSENT** |
| Package fetch / auto-install | **NOT PERFORMED** |
| Vercel authentication | **NOT ATTEMPTED** |
| Staging Case B project (`viona-web-staging-eu`) | **NONE** (not created) |
| B1A retry | **NOT AUTHORIZED** |

### 3.1 Pre-existing operator `.vercel` (not created by this packet)

| Fact | Status |
|---|---|
| Path | gitignored `.vercel/` (see `.gitignore:58`) |
| Created/mutated this packet | **NO** |
| Committed | **NO** |
| `projectName` (sanitized) | `ket-noi-eu` (pre-existing link artifact) |
| Case B dedicated staging target | **NOT** — does **not** satisfy `BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED` |
| Action this packet | Observe only; do not delete, rewrite, or rely on for B1A |

This artifact does **not** authorize reuse of project `ket-noi-eu` as the Case B staging host. B0 still recommends a dedicated staging project under a separate B1A authorization after CLI install + login.

---

## 4. Official tooling contract (read-only)

### 4.1 Primary sources

| Source | Marker | Use |
|---|---|---|
| [Vercel CLI Overview](https://vercel.com/docs/cli) | `last_updated: 2026-07-08` | Official install methods (`pnpm` / `yarn` / `npm` / `bun` package `vercel`); CLI command surface |
| [vercel login](https://vercel.com/docs/cli/login) | `last_updated: 2026-04-10` | Standard login command |
| [vercel link](https://vercel.com/docs/cli/link) | `last_updated: 2026-03-17` | Local directory ↔ project link |
| [Deploying from the CLI](https://vercel.com/docs/projects/deploy-from-cli) | docs | Shows `vercel deploy` / `vercel deploy --prod` as deploy paths; `vercel link` / `vercel env pull` as separate ops |
| [npm package `vercel`](https://www.npmjs.com/package/vercel) + registry metadata | registry read this session | Package identity + current `latest` |

Third-party tutorials are **not** the execution source of truth.

### 4.2 Documented findings (sanitized)

| Item | Finding |
|---|---|
| Package name | `vercel` |
| Documented package managers | npm, pnpm, yarn, bun |
| Current stable (`dist-tag` `latest`) | **56.5.0** (registry read; updated marker on package page ~2026-07-22) |
| Node requirement (package `engines`) | `>= 18` |
| License | Apache-2.0 |
| Registry tarball host | `registry.npmjs.org` |
| Integrity (registry) | `sha512-wAKpT8DFSbnwlgbS711fbvxGjOfQeb1n+NcaBaSC4onq9eJAjbPfERrjrKE4GDsV8dkoBo0627lp0QxbLCGFiw==` |
| Maintainers (count only) | 5 npm maintainers listed on package metadata (names not copied into evidence) |
| Standard login | `vercel login` |
| Local link | `vercel link` |
| Deploy-initiating patterns | bare `vercel`; `vercel deploy`; `vercel --prod` / `vercel deploy --prod` |
| Config / auth storage | Global config directory (see Vercel global configuration docs); local `.vercel/` after link — **must remain gitignored** |
| Uninstall (npm global) | `npm uninstall -g vercel` (standard npm; not a special Vercel uninstall binary) |

---

## 5. Local toolchain inventory (read-only; sanitized)

| Field | Sanitized value |
|---|---|
| Node | `v24.14.1` (meets `>= 18`) |
| npm | `11.11.0` |
| Node path | `C:\Program Files\nodejs\node.exe` (system install) |
| npm path | under `C:\Program Files\nodejs\` |
| npm global prefix | `<USER_APPDATA>\Roaming\npm` |
| npm cache | `<USER_LOCAL_APPDATA>\npm-cache` |
| corepack | `0.34.6` present |
| pnpm / yarn | Unavailable on PATH |
| `vercel` on PATH | **NO** |
| Local repo `node_modules/.bin/vercel` | **ABSENT** |
| Global prefix `vercel.cmd` | **ABSENT** |
| Roaming npm on PATH | **Yes** (1 matching PATH entry) |
| Administrator elevation currently | **No** (session not elevated) |
| Multiple Node installs | Only system NodeJS path observed via `where` |
| Version manager in use | **Not observed** |
| Global packages isolation | Per npm prefix under user AppData (user-scoped; not Program Files) |
| Admin required for user-prefix global install | **Expected no** when writing to user Roaming npm prefix |

Private usernames omitted from committed evidence.

---

## 6. Installation options (not executed)

### OPTION A — Pinned global CLI under existing operator Node/npm scope

**Decision:** `RECOMMENDED_FOR_SEPARATE_AUTHORIZATION`

| Field | Assessment |
|---|---|
| Conceptual command | `npm install -g vercel@56.5.0` |
| Exact-version pinning | **Yes** (`@56.5.0`) |
| Repository files changed | **0** (expected) |
| Lockfile impact | **0** (expected) |
| PATH impact | Uses existing user npm global prefix already on PATH |
| Administrator requirement | **Not expected** for user-prefix install |
| Reproducibility | High when version pinned |
| Supply-chain exposure | Official npm registry package `vercel@56.5.0` |
| Upgrade behavior | No auto-upgrade unless operator re-runs install |
| Rollback / uninstall | `npm uninstall -g vercel` then confirm `vercel --version` unavailable |
| Cursor compatibility | Operator machine PATH; no repo dep required |
| Prove `vercel --version` | **Yes** after successful install + PATH |
| Accidental package fetch risk | Low if exact version pinned and no `npx` |
| Accidental deployment risk | Medium if bare `vercel` is run later — mitigated by guardrails |
| Suitability for B1A | **Best fit** |

### OPTION B — Pinned repository-local `devDependency`

**Decision:** `NOT SELECTED`

| Field | Assessment |
|---|---|
| Conceptual command | `npm install -D vercel@56.5.0` |
| Exact-version pinning | Yes |
| Repository files changed | `package.json` + `package-lock.json` |
| Lockfile impact | **Yes — rejected by this decision’s rank #1** |
| Suitability for B1A | Not preferred: repo would govern CLI version without intentional product need; no canonical policy requires repo-owned CLI versioning today |

### OPTION C — Ephemeral `npx` / equivalent

**Decision:** `NOT SELECTED_FOR_NORMAL_B1A_PATH`

| Field | Assessment |
|---|---|
| Conceptual command | `npx vercel@56.5.0 …` |
| Pinning | Possible per invocation |
| Repository impact | 0 |
| Problem | Implicit package fetch on use; version-drift risk; previously tripped B1A “CLI not available / would fetch” gate; bypasses durable install proof |
| Suitability for B1A | **Not recommended** as normal path |

---

## 7. Decision principles application

Ranked principles favor: no lockfile change → pinned version → predictable path → easy uninstall → no drift → no admin when avoidable → separated from source → login-compatible → no auto-exec → auditable evidence.

**Selected:** Option A.

**Rejected:** unpinned `latest` for the future install lane; Option C as normal B1A path; Option B unless a future docs decision intentionally adopts repo-owned CLI versioning.

---

## 8. Supply-chain evidence contract (pre-install)

Required before a future installation lane runs:

| Evidence | Status in this packet |
|---|---|
| Exact package name | `vercel` — **recorded** |
| Exact version | `56.5.0` — **recorded** (pin at install time; re-verify if registry advances) |
| Registry source | `https://registry.npmjs.org` — **recorded** |
| Publisher/maintainer evidence | Official Vercel package; maintainer count 5 — **recorded** (no private emails) |
| Metadata retrieval | `npm view` / registry HTTP — **read-only** |
| Integrity / checksum | registry `dist.integrity` sha512 — **recorded** |
| Publication / update marker | package updated ~2026-07-22 — **recorded** |
| Node requirement | `>= 18` — **recorded**; operator Node `v24.14.1` OK |
| No Git URL / unofficial binary | Official npm tarball only — **recorded** |
| No typo-squat alias | Exact name `vercel` — **recorded** |

No `BLOCKED_VERCEL_CLI_PACKAGE_IDENTITY_OR_VERSION_UNRESOLVED`.

**This packet did not download the tarball.**

---

## 9. Recommended future installation contract

| Field | Contract |
|---|---|
| Exact pinned version | `56.5.0` (reconfirm with `npm view vercel version` immediately before install; if `latest` ≠ pin, stop and re-decide) |
| Exact command | `npm install -g vercel@56.5.0` |
| Scope | Operator/user npm global prefix (`npm config get prefix`) |
| Expected prefix / executable | `<USER_APPDATA>\Roaming\npm\vercel.cmd` (Windows) |
| Administrator elevation | **Forbidden** unless install fails solely due to permissions after user-prefix confirmation |
| Files outside repo | npm global package tree under user prefix |
| Repository changes | **0** |
| package.json / lockfile changes | **0** |
| PATH behavior | Rely on existing Roaming npm PATH entry; if `vercel --version` fails after install, document PATH gap — do not silently alter system PATH without a separate authorization |
| Verification | `vercel --version` must print `56.5.0` (or CLI-reported string containing that version) |
| Rollback / uninstall | `npm uninstall -g vercel` |
| Post-uninstall verification | `vercel --version` unavailable / command not found |
| Log sanitization | No tokens, emails, or auth cookies in docs |
| Stop-on-error | Any unexpected package.json/lockfile change; admin elevation prompt; wrong package; install of unpinned `latest`; network integrity mismatch |

**Installation lane must stop after proving the CLI exists.** It must **not** run `vercel login` or B1A unless separately authorized.

---

## 10. Authentication separation

Installation authorization **must not** authorize:

- `vercel login`
- browser / email / 2FA completion
- token use / paste into chat
- account/team selection
- project access

Proposed future interactive login phrase:

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_OPERATOR_INTERACTIVE_LOGIN_ONLY`

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

Login lane requirements (future): official `vercel login` only; operator interaction; never request tokens in chat; never commit credentials; sanitized identity/scope only; stop before project creation.

---

## 11. Deployment safety guardrails (post-install)

**Prohibited** unless a later lane explicitly authorizes deployment / mutation:

| Command / class | Classification |
|---|---|
| bare `vercel` | **PROHIBITED** (may deploy) |
| `vercel deploy` | **PROHIBITED** |
| `vercel --prod` / `vercel deploy --prod` | **PROHIBITED** |
| promote / rollback deploy commands | **PROHIBITED** |
| `vercel git` / Git connect | **PROHIBITED** |
| `vercel env add` / `env pull` / env mutation | **PROHIBITED** |

**Permitted only when a later lane authorizes read-only use** (examples): `vercel --version`, `vercel --help`, `vercel project --help`, `vercel link --help`, `vercel whoami` (after login lane).

Tool availability ≠ infrastructure authority.

---

## 12. Tooling rollback contract (CLI only)

| Element | Requirement |
|---|---|
| Uninstall command | `npm uninstall -g vercel` |
| Removal scope | Global npm package under user prefix only |
| PATH verification | Confirm no `vercel` executable remains on PATH |
| Post-check | `vercel --version` unavailable |
| Not included | Repository rollback; VIONA source deletion; Vercel **project** deletion; account mutation; credential exposure |

Do **not** confuse CLI uninstall with client deployment rollback (still `BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE`).

---

## 13. Decision

```text
VERCEL_CLI_PINNED_GLOBAL_INSTALLATION_RECOMMENDED_FOR_SEPARATE_AUTHORIZATION
```

Rationale: official npm package, pinable, zero repository/lockfile impact, user-scoped prefix already on PATH, reversible via `npm uninstall -g`, compatible with later interactive login and B1A without adopting ephemeral `npx` fetch semantics that previously blocked B1A.

---

## 14. Future authorization phrases

### Installation (selected method)

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_PINNED_TOOLING_INSTALLATION_ONLY`

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

### Also preserved

```text
B1A RETRY: NOT AUTHORIZED
B1B–B7: NOT AUTHORIZED
E8 deployment: NOT AUTHORIZED
E9–E10: NOT AUTHORIZED
```

---

## 15. Docs output / non-touch list

**Created:**

- This packet
- `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-e8-case-b-vercel-cli-tooling-preparation-decision/README.md`

**Updated when necessary:** Kernel + Handoff sync rows.

**Not modified:** `src/`; tsconfig; package.json; package-lock.json; npm config; workflows; Expo/Vercel/Fly config; env files; `.vercel`; runtime assets; prisma/migrations; `dist/`.

**Commit:** Left uncommitted unless separately authorized.

---

## 16. Security

No Vercel tokens, login links, account credentials, phone/PIN/JWT, customer PII, or private usernames are committed. Local paths sanitized.

---

## 17. Final classification

```text
READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_VERCEL_CLI_TOOLING_PREPARATION_DECISION_PACKET_PR_REVIEW
VERCEL_CLI_PINNED_GLOBAL_INSTALLATION_RECOMMENDED_FOR_SEPARATE_AUTHORIZATION
```

Confirm:

- CLI remains uninstalled
- no package tarball fetch/install occurred (`npm view` metadata-only is allowed and was used)
- no Vercel authentication this session
- no infrastructure mutation (no project create/link/Git/env/build/deploy)
- pre-existing gitignored `.vercel` observed only; not created or modified
- installation authorization remains **PROPOSED** only
- B1A retry unauthorized
- B1B–B7 unauthorized
- E8 deployment unauthorized
- `REQUEST_ONLY_NO_CHARGE` preserved

### Next operator action

Authorize a separate **commit-and-open-PR** for this docs packet if desired; then separately decide whether to grant the pinned tooling **installation** phrase. Do **not** install or retry B1A automatically.
