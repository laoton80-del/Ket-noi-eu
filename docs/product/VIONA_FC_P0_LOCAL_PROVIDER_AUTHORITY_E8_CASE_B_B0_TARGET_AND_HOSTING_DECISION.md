# VIONA FC-P0 — E8 Case B B0 Target and Hosting Decision

**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_B0_TARGET_AND_HOSTING_DECISION_PACKET_PR_REVIEW`

**B0 decision:** `B0_DEDICATED_VERCEL_STAGING_PROJECT_RECOMMENDED_FOR_SEPARATE_B1_AUTHORIZATION`

**Not claimed:** `E8_CASE_B_STAGING_CLIENT_DEPLOYMENT_READY`

**Authorization (this packet only):** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_B0_TARGET_AND_HOSTING_DECISION`

**Mode:** Strict docs-first target/hosting decision — read-only repository and public config inventory — **no** hosting authentication, project creation/binding, environment configuration, staging-env build, deployment, or B1–B7

**Canonical master baseline:** `8ca1dbb9339ee6112490f22c7afc42d72dfe68d5` (PR #439 verified tip)

**Held Case B state:**

```text
E8_CASE_B_PREREQUISITE_REMEDIATION_SEQUENCE_READY_FOR_SEPARATE_AUTHORIZATION
```

**Preserved blockers (unchanged by B0):**

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

**Branch:** `docs/viona-fc-p0-local-provider-authority-e8-case-b-b0-target-hosting-decision`

```text
NO_HOSTING_AUTHENTICATION
NO_PROJECT_CREATION
NO_PROJECT_BINDING
NO_ENVIRONMENT_CONFIGURATION
NO_STAGING_ENV_BUILD
NO_CLIENT_DEPLOYMENT
NO_B1_THROUGH_B7
NO_E8_DEPLOY
NO_E9_E10
REQUEST_ONLY_NO_CHARGE
AI_HARD_STOP_NOT_STARTED
DEFER_VIONA_APPLE_DEVELOPER_AND_IOS_PHASE_D2_UNTIL_FEATURE_COMPLETE
```

---

## 1. Purpose

Select or block the safest **candidate hosting model** for a future isolated VIONA staging web client.

B0 decides:

- preferred hosting platform;
- required isolation model;
- required operator-owned account/team boundary;
- required future project properties;
- required evidence for B1 project binding;
- whether a safe candidate can be recommended.

B0 does **not** create, bind, authenticate, configure env, build staging artifacts, deploy, or authorize B1–B7 / E8 deploy.

---

## 2. Canonical workspace gate

| Check | Result |
|---|---|
| Top-level | `C:/KNG/ket-noi-eu` |
| Branch at start | `master` @ `8ca1dbb9339ee6112490f22c7afc42d72dfe68d5` |
| `origin/master` | Identical tip |
| Working tree | Clean before docs branch (ignored `dist/` only) |
| Contains PR #439 | Yes (tip equals squash) |
| Later commits after tip | **None** |
| Sibling worktrees | Present on disk; **not used** |

No `BLOCKED_B0_CANONICAL_SOURCE_ADVANCED_REVIEW_REQUIRED`.

---

## 3. Held inventory (not re-opened)

| Fact | Status |
|---|---|
| Verified staging client URL | **NONE** |
| Vercel | Preferred candidate only (PR #439) |
| Expo web output | `dist/` via `npm run build:web` |
| SPA intent | Root `vercel.json` rewrites `/(.*)` → `/index.html`; `fix-vercel-fonts.js` copies `vercel.json` into `dist/` |
| Local `.vercel` | **Not** live binding proof |
| EAS preview | Deferred / not selected |
| API base | `getRestApiBaseUrl()` ← `EXPO_PUBLIC_REST_API_BASE` (build-time) |
| Existing artifact | Not staging-safe (localhost/`127.0.0.1` evidence held) |
| E8 deploy phrase | **NOT GRANTED** |

---

## 4. Target options (≤3)

### OPTION A — Dedicated Vercel staging project

| Field | Assessment |
|---|---|
| Platform | Vercel static SPA hosting |
| Staging isolation | **SUPPORTED_IN_PRINCIPLE** if a **new/dedicated** staging project is used with no production aliases |
| Production separation | Requires operator proof at B1 — no production project reuse / no production domain |
| Project provisioning | Required (operator-owned; **not performed** in B0) |
| Repository binding | Required at B1; not performed now |
| Build command | `npm run build:web` (= `npx expo export --platform web --clear && node fix-vercel-fonts.js`) |
| Output directory | `dist/` |
| Env support | Build-time `EXPO_PUBLIC_*` (Vercel project env / CLI) |
| Staging API-base support | Yes **in principle** via `EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev` — proof deferred to B2/B3 |
| SHA traceability | **SUPPORTED_IN_PRINCIPLE** (deployment metadata / commit SHA on Vercel) — must be recorded at B6 |
| Immutable deployments | **SUPPORTED_IN_PRINCIPLE** (Vercel immutable deployment model, documented industry/platform capability; **not** project-proven) |
| Rollback | Prior deployment promote/restore **SUPPORTED_IN_PRINCIPLE** — contract remains incomplete until B4 |
| URL / access | Preview or staging hostname; password/SSO/protection **READY_WITH_OPERATOR_INPUT** |
| Indexing controls | `noindex` / robots / unlisted URL **READY_WITH_OPERATOR_INPUT** |
| Operator role | Vercel project admin on operator-owned team |
| Ongoing cost | Low / free-tier capable for static SPA (**READY_WITH_OPERATOR_INPUT** on account plan) |
| Apple/EAS dependency | **None** for this path |
| Suitability for B1–B7 | **Best fit** among evaluated options |

### OPTION B — Local Expo web only

| Field | Assessment |
|---|---|
| Platform | Local Metro / local `build:web` artifact inspection |
| Staging isolation | Local machine only |
| Remote staging host | **No** |
| Classification | `NOT_A_CASE_B_STAGING_HOSTING_TARGET` |
| Useful for | Local build, artifact inspection, **B2/B3 preparation** |
| Case B hosting | **Does not satisfy** — no remotely accessible isolated staging deployment |

**Do not recommend localhost as the final B0 target.**

### OPTION C — EAS / Expo preview

| Field | Assessment |
|---|---|
| Platform | Expo EAS (`eas.json` preview / production profiles; `extra.eas.projectId` in `app.config.js`) |
| Classification | `DEFERRED` / `NOT SELECTED` / `NOT AUTHORIZED` |
| Apple/EAS Phase D2 | Preserve `DEFER_VIONA_APPLE_DEVELOPER_AND_IOS_PHASE_D2_UNTIL_FEATURE_COMPLETE` |
| Why not preferred | Higher credential surface; Apple/store adjacency; unnecessary when web/Vercel can satisfy E8 client without Apple |

---

## 5. Hard target requirements checklist (Option A)

| # | Requirement | Option A status |
|---|---|---|
| 1 | Dedicated VIONA staging boundary | **SUPPORTED_IN_PRINCIPLE** (requires B1 dedicated project) |
| 2 | No production project/domain/alias mutation | **READY_WITH_OPERATOR_INPUT** (B1 must prove) |
| 3 | Exact source SHA per deployment | **SUPPORTED_IN_PRINCIPLE** |
| 4 | Expo web output from `dist/` | **VERIFIED** (repo) |
| 5 | Build-time `EXPO_PUBLIC_REST_API_BASE` | **VERIFIED** (source resolver) |
| 6 | Future API origin Fly staging | **READY_WITH_OPERATOR_INPUT** (B2/B3) |
| 7 | No service-role/server secret in bundle | **SUPPORTED_IN_PRINCIPLE** (discipline + B3 scan) |
| 8 | No automatic Local request creation | **VERIFIED** (doctrine / user-submit create) |
| 9 | No automatic AI/paid invocation | **VERIFIED** (doctrine; hard-stop not started) |
| 10 | Reversible / prior deployment restore | **SUPPORTED_IN_PRINCIPLE** (B4 still incomplete) |
| 11 | Non-mutating smoke | **VERIFIED** (defined in prior packets) |
| 12 | No Apple/EAS for preferred path | **VERIFIED** |
| 13 | Low/zero bounded staging cost | **READY_WITH_OPERATOR_INPUT** |
| 14 | Reduce discovery/indexing | **READY_WITH_OPERATOR_INPUT** |
| 15 | Separate B1 before create/bind | **VERIFIED** (this packet) |

Any path requiring a **production** alias:

```text
BLOCKED_B0_TARGET_REQUIRES_PRODUCTION_EXPOSURE
```

Option A as recommended **forbids** production alias attachment.

---

## 6. Vercel candidate — required future properties (no project created)

| Property | Required future value (proposal only) |
|---|---|
| Purpose | Isolated VIONA **staging** Expo web SPA for FC-P0 / Pack B Local client shell |
| Naming convention (non-sensitive) | e.g. `viona-web-staging` or `ket-noi-eu-web-staging` — exact name chosen at B1; **no** ID invented here |
| Account/team | Operator-owned Vercel team/account dedicated or clearly scoped for staging |
| Git repository | `laoton80-del/Ket-noi-eu` (or canonical remote equivalent) |
| Branch policy | Deploy only from pinned full SHA / reviewed master descendant — **no** floating unreviewed branch |
| Production-branch setting | Must **not** treat production domain as this project’s production alias; prefer no production branch promotion to customer domains |
| Framework preset | Other / static (Expo export SPA) |
| Build command | `npm run build:web` |
| Output directory | `dist` |
| Install command | `npm ci` (preferred) or `npm install` per lockfile discipline |
| Node version | Align with CI/local Node used for green gates (repo `engines` unset; Expo ~54) — pin at B1 |
| Public env scope | `EXPO_PUBLIC_REST_API_BASE` (and other `EXPO_PUBLIC_*` as needed); **no** server secrets |
| Preview vs persistent | Prefer password-protected preview **or** dedicated staging hostname without customer announcement |
| Domain/alias restriction | **No** production custom domain; **no** production alias |
| Indexing | `noindex` / robots / unlisted where controllable |
| Deployment protection | Password / SSO / Vercel Deployment Protection where available |
| Retention | Keep prior deployments for rollback window |
| Rollback behavior | Promote/restore prior immutable deployment (contractized in B4) |
| Logs/evidence | Deployment id, URL, SHA, timestamps captured under `docs/design/evidence/` |
| Cost boundary | Static hosting free/hobby tier preferred; no paid AI runtime from deploy |

**Explicitly not claimed:** project ID, staging URL, team ID, or live binding.

Local `.vercel` metadata remains **non-authoritative**.

---

## 7. B1 evidence contract (not executed)

Before any project creation/binding mutation, B1 must prove:

| Evidence item | Required |
|---|---|
| Selected hosting provider | Vercel (dedicated staging) |
| Operator-owned account/team confirmation | Yes (opaque ids OK; no secrets) |
| Exact project naming proposal | Non-sensitive name string |
| Proof project is staging-only | Written attestation + settings screenshots/export (sanitized) |
| Repository + branch mapping | Repo link + SHA pin rule |
| No production project reuse | Confirmed |
| No production domain/alias | Confirmed |
| Build command | `npm run build:web` |
| Output directory | `dist` |
| Node/runtime version | Pinned |
| Env variable names + scopes | Public `EXPO_PUBLIC_*` only; list names (not secret values) |
| Staging API origin | `https://viona-api-staging-eu.fly.dev` (wired later in B2/B3; name reserved) |
| Deployment access controls | Password/SSO/protection plan |
| Project cost expectations | Documented |
| Rollback capability | Platform features listed for B4 |
| Evidence capture plan | Path under `docs/design/evidence/` |
| Proposed B1 authorization phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_B1_PROJECT_BINDING` |

```text
B1 phrase status: PROPOSED / NOT GRANTED / NOT EFFECTIVE / NOT AUTHORIZED
```

---

## 8. Rollback feasibility (platform-level only)

| Capability | Feasibility at B0 |
|---|---|
| Immutable deployments | **SUPPORTED_IN_PRINCIPLE** |
| Prior deployment promote/restore | **SUPPORTED_IN_PRINCIPLE** |
| Alias reassignment | **SUPPORTED_IN_PRINCIPLE** (must not touch production) |
| Source SHA association | **SUPPORTED_IN_PRINCIPLE** |
| Logs | **SUPPORTED_IN_PRINCIPLE** |
| Cancellation | **SUPPORTED_IN_PRINCIPLE** |

```text
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
```

B4 must verify a **specific** project and deployment baseline before the contract is complete.

---

## 9. API-base boundary (B0 does not fix)

```text
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

B2/B3 must separately prove:

- staging build uses `https://viona-api-staging-eu.fly.dev`;
- generated artifact contains that origin;
- generated artifact rejects `localhost` / `127.0.0.1` API origin;
- no production API origin embedded;
- no secret exposed.

B0 performs **no** env mutation and **no** staging-configured artifact build.

---

## 10. Decision matrix (Option A preferred candidate)

Statuses: `VERIFIED` · `SUPPORTED_IN_PRINCIPLE` · `READY_WITH_OPERATOR_INPUT` · `BLOCKED` · `UNRESOLVED` · `NOT_APPLICABLE`

| Row | Option A (Vercel staging) | Option B (local Expo) | Option C (EAS preview) |
|---|---|---|---|
| Staging isolation | SUPPORTED_IN_PRINCIPLE | NOT_APPLICABLE (local only) | SUPPORTED_IN_PRINCIPLE (if internal) |
| Production separation | READY_WITH_OPERATOR_INPUT | VERIFIED (no shared URL) | READY_WITH_OPERATOR_INPUT |
| Project provisioning | READY_WITH_OPERATOR_INPUT | NOT_APPLICABLE | READY_WITH_OPERATOR_INPUT |
| Repository binding | READY_WITH_OPERATOR_INPUT | NOT_APPLICABLE | READY_WITH_OPERATOR_INPUT |
| Build compatibility | VERIFIED | VERIFIED | SUPPORTED_IN_PRINCIPLE |
| `dist` output support | VERIFIED | VERIFIED | NOT_APPLICABLE (native binary) |
| Public env support | SUPPORTED_IN_PRINCIPLE | VERIFIED (local) | SUPPORTED_IN_PRINCIPLE |
| API-base proof support | READY_WITH_OPERATOR_INPUT (B2/B3) | READY_WITH_OPERATOR_INPUT (local B3) | READY_WITH_OPERATOR_INPUT |
| SHA traceability | SUPPORTED_IN_PRINCIPLE | VERIFIED (checkout) | SUPPORTED_IN_PRINCIPLE |
| Rollback feasibility | SUPPORTED_IN_PRINCIPLE | NOT_APPLICABLE | SUPPORTED_IN_PRINCIPLE |
| Access protection | READY_WITH_OPERATOR_INPUT | VERIFIED (local) | READY_WITH_OPERATOR_INPUT |
| Indexing controls | READY_WITH_OPERATOR_INPUT | NOT_APPLICABLE | READY_WITH_OPERATOR_INPUT |
| Logs/evidence | SUPPORTED_IN_PRINCIPLE | READY_WITH_OPERATOR_INPUT | SUPPORTED_IN_PRINCIPLE |
| Ongoing cost | READY_WITH_OPERATOR_INPUT | VERIFIED (local) | READY_WITH_OPERATOR_INPUT (higher) |
| Apple/EAS dependency | VERIFIED (none) | VERIFIED (none) | BLOCKED (deferred path) |
| B1 readiness | READY_WITH_OPERATOR_INPUT | NOT_APPLICABLE | NOT SELECTED |
| B2/B3 compatibility | SUPPORTED_IN_PRINCIPLE | SUPPORTED_IN_PRINCIPLE (prep only) | SUPPORTED_IN_PRINCIPLE |
| B4 compatibility | SUPPORTED_IN_PRINCIPLE | NOT_APPLICABLE | SUPPORTED_IN_PRINCIPLE |
| Customer exposure risk | READY_WITH_OPERATOR_INPUT | VERIFIED (none shared) | READY_WITH_OPERATOR_INPUT |

Option B remains useful for B2/B3 prep but is **not** a Case B hosting target.

---

## 11. B0 decision

```text
B0_DEDICATED_VERCEL_STAGING_PROJECT_RECOMMENDED_FOR_SEPARATE_B1_AUTHORIZATION
```

**Meaning:**

- Dedicated Vercel staging project is the safest **candidate** consistent with repository hosting intent (`build:web` → `dist/` + `vercel.json` SPA).
- **No** project is verified, created, or bound.
- Target blocker remains until B1 proves a real staging-only project:

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
```

- Binding blocker remains until B1 completes:

```text
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
```

B1–B7 phrases remain:

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

E8 deploy phrase remains **NOT GRANTED**.

---

## 12. Zero-loss and AI boundary

| Control | Status |
|---|---|
| AI runtime cost hard-stop | **NOT STARTED** |
| No auto AI / Twilio / paid maps / booking / payment / payout from host decision | Affirmed |
| `REQUEST_ONLY_NO_CHARGE` | Preserved |
| No automatic Local request from render/load | Affirmed |

---

## 13. Docs output / non-touch list

**Created:**

- This packet
- `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-e8-case-b-b0-target-hosting-decision/README.md`

**Updated when necessary:** Kernel + Handoff sync rows.

**Not modified:** `src/`; tsconfig; package files; workflows; Expo/Vercel/Fly config; env files; runtime assets; prisma/migrations; `dist/`; provider/request state.

**Commit:** Left uncommitted unless a separate commit-and-open-PR authorization is granted.

---

## 14. Security

No Vercel/GitHub/Fly/Supabase tokens, env secret values, phone/PIN/JWT, customer PII, full Business/User identifiers, or private account identifiers are printed. Local `.vercel` data not copied.

---

## 15. Validation summary

| Gate | Result |
|---|---|
| Docs-only intent | Yes |
| Zero hosting auth / project create / bind / env / staging build / deploy | Yes |
| Zero login / Local request / provider mutation | Yes |
| B1–B7 unauthorized | Yes |
| E8–E10 unauthorized | Yes |
| `REQUEST_ONLY_NO_CHARGE` | Preserved |
| Required CI gates | Run at packet completion |

---

## 16. Final classification

```text
READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_B0_TARGET_AND_HOSTING_DECISION_PACKET_PR_REVIEW
B0_DEDICATED_VERCEL_STAGING_PROJECT_RECOMMENDED_FOR_SEPARATE_B1_AUTHORIZATION
```

Confirm:

- no project created
- no project bound
- no provider authentication
- no environment mutation
- no deployment
- B1–B7 unauthorized
- E8 deployment unauthorized
- E9–E10 unauthorized
- `REQUEST_ONLY_NO_CHARGE` preserved

### Next operator action

Authorize a separate **commit-and-open-PR** lane for this B0 packet (if desired), then after merge/verify, separately decide whether to grant **B1** project-binding. Do **not** auto-start B1.
