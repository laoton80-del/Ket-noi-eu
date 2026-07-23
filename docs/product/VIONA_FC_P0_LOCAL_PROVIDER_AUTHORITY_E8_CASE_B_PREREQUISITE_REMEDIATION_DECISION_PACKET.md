# VIONA FC-P0 — E8 Case B Prerequisite Remediation Decision Packet

**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_PREREQUISITE_REMEDIATION_DECISION_PACKET_PR_REVIEW`

**Case B decision (this packet):** `E8_CASE_B_PREREQUISITE_REMEDIATION_SEQUENCE_READY_FOR_SEPARATE_AUTHORIZATION`

**Not claimed:** `E8_CASE_B_STAGING_CLIENT_DEPLOYMENT_READY`

**Authorization (this packet only):** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_PREREQUISITE_REMEDIATION_DECISION_PACKET`

**Mode:** Strict docs-first decision + readiness planning; read-only infrastructure/source inventory; safe local build diagnostics allowed — **no** client deploy, project creation, environment mutation, login, Local request, provider mutation, or E9/E10

**Canonical master baseline:** `c9292d74015edd8e10cc1db97f560c44bcf50e76`

**Verified tooling status (held):**

```text
VIONA_PR436_TYPESCRIPT_RANGEERROR_DIST_EXCLUSION_NO_PRODUCT_CHANGE_IMPLEMENTATION_RESULT_VERIFIED_ON_MASTER_WITH_REQUIRED_VALIDATION_GREEN
PR436_POST_MERGE_VALIDATION_CLOSED_AFTER_DIST_EXCLUSION_REMEDIATION
```

**Current E8 state (unchanged by this packet):**

```text
E8_CASE_A_DOCS_ONLY_RECOMMENDED
E8 Case B: NOT GRANTED / NOT EFFECTIVE / NOT AUTHORIZED
```

**Preserved Case B blockers:**

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

**Branch:** `docs/viona-fc-p0-local-provider-authority-e8-case-b-prerequisite-remediation-decision-packet`

```text
NO_CLIENT_DEPLOYMENT
NO_PROJECT_CREATION
NO_ENVIRONMENT_MUTATION
NO_LOGIN
NO_PROVIDER_MUTATION
NO_LOCAL_REQUEST
NO_E9_E10
E8_DEPLOY_PHRASE_NOT_GRANTED
REQUEST_ONLY_NO_CHARGE
AI_HARD_STOP_NOT_STARTED
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
```

---

## 1. Purpose

Define the smallest safe, evidence-grounded remediation sequence for the four remaining E8 Case B prerequisites.

This packet **does not** authorize or execute:

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY`

---

## 2. Canonical workspace gate

| Check | Result |
|---|---|
| Top-level | `C:/KNG/ket-noi-eu` |
| Branch at packet start | `master` @ `c9292d74015edd8e10cc1db97f560c44bcf50e76` |
| `origin/master` | Identical tip |
| Working tree | Clean before docs branch |
| Contains PR #438 squash | Yes (tip equals baseline) |
| Later tooling/deploy commits after baseline | **None** |
| Sibling worktrees | Present on disk; **not used** |

Master has **not** advanced past the verified PR #438 tip. No `BLOCKED_E8_CASE_B_CANONICAL_SOURCE_ADVANCED_REVIEW_REQUIRED`.

---

## 3. Held context (not re-mutated)

### 3.1 Provider baseline (E6–E7 chain)

| Field | Held value |
|---|---|
| lifecycle / status | `ACTIVE` |
| `publicB2cVisible` | `true` |
| `supportedServiceTypes` | `GENERIC_REQUEST` only |
| audit | `REGISTERED` → `CONFIG_UPDATED` → `ACTIVATED` |
| Staging API | `https://viona-api-staging-eu.fly.dev` (`viona-api-staging-eu`) |

### 3.2 Prior packets

| Packet | Role |
|---|---|
| PR #435 | Recommend E8 for separate authorization decision (not a grant) |
| PR #436 | E8 Case A docs-only readiness; Case B blockers opened |
| PR #437 | TypeScript RangeError input-scope triage |
| PR #438 | `dist/**` root TypeScript exclusion; post-merge validation closed |

### 3.3 E8 phrase status

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY` remains:

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

---

## 4. Blocker 1 — Verified staging client target

### 4.1 Plausible targets (repository-derived only)

| Target | Platform | Project/site/app id | Account/team | Branch | Staging URL | Production URL | VIONA-specific | Isolated from prod | Provisioned | Evidence | Auth required | Access mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Expo static web → Vercel SPA | Vercel (static) | **UNRESOLVED** as staging-isolated binding. Local gitignored `.vercel` link exists on operator machine — **not** treated as verified staging target; identifiers not copied | **UNRESOLVED** | Would be pinned SHA on master | **None verified** | **UNRESOLVED** | App branded `VIONA` (`app.config.js`) | **UNRESOLVED** until alias/domain proven | Config present (`vercel.json` SPA rewrites); **no** verified live staging host | Repo `vercel.json`, `fix-vercel-fonts.js`, `npm run build:web`, Pack17/18 runbooks | Yes for console/CLI inspect or create | Read-only inspect = auth; create/bind = mutating |
| Local Expo web + staging API | Local Metro | n/a | n/a | Local checkout | Local only | n/a | Yes | Yes (not shared) | Dev pattern | Pack17 QA: “no dedicated deployed staging web host” | Local machine | Not a Case B deploy target |
| EAS preview (APK / internal) | Expo EAS | `extra.eas.projectId` present in `app.config.js` | Expo account | EAS build SHA | None verified for FC-P0 | Store path separate | Yes | Preview ≠ prod if kept internal | Profiles in `eas.json` | `eas.json`, app config | Expo + store credentials | Higher surface; Apple/EAS Phase D2 deferred |
| EAS production / store | EAS + stores | same | Expo + stores | production | — | Store | Yes | No — production path | Out of scope | `eas.json` production | Yes | **Blocked for E8** |

### 4.2 Inventory conclusion

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
```

No invented URL. No project created. No provider authenticated for binding.

### 4.3 Operator/infrastructure action required (future separately authorized lane)

1. Operator confirms or creates an **isolated** VIONA staging web host (preferred: dedicated Vercel staging project or explicitly non-production alias).
2. Records project/site id, team boundary, staging URL, and proof of **no** production domain/alias attachment.
3. Does **not** announce to customers; applies safest available exposure controls (password / allowlist / unlisted / `noindex`).

---

## 5. Blocker 2 — Project binding

### 5.1 Binding field classifications

| Field | Classification | Notes |
|---|---|---|
| Provider project identifier | **UNRESOLVED** | No committed staging project id; local `.vercel` not authoritative |
| Team/account identifier | **UNRESOLVED** | Not inspected (would require auth); ids not copied |
| Repository binding | **READY_WITH_OPERATOR_INPUT** | Repo is VIONA/`ket-noi-eu`; binding to a staging project not proven |
| Branch → environment mapping | **UNRESOLVED** | Must pin exact SHA, not floating branch alone |
| Build command | **VERIFIED** | `npm run build:web` |
| Output directory | **VERIFIED** | `dist/` (gitignored) |
| Framework preset | **VERIFIED** (intent) | Static SPA via Expo export + `vercel.json` rewrites |
| Environment-variable scope | **READY_WITH_OPERATOR_INPUT** | Build-time `EXPO_PUBLIC_*`; staging project env not verified |
| Preview / staging / production separation | **BLOCKED** | Not proven for any live host |
| Domain / alias ownership | **BLOCKED** | Unknown |
| Deployment history | **BLOCKED** | No verified prior staging-client deployment |
| Source SHA visibility in deploy metadata | **READY_WITH_OPERATOR_INPUT** | Contract defined in §11; not live-proven |

```text
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
```

### 5.2 Evidence contract to resolve binding (future B1)

Record without unnecessary secrets:

- Hosting platform + project/site name (or opaque id)
- Team/account boundary (opaque)
- Linked Git repository confirmation
- Environment name (staging / preview) and branch/SHA pin rule
- Build command + output dir confirmation
- Proof: staging URL ≠ production domain; production aliases **not** attached
- Optional: one read-only deployment-history screenshot/export (sanitized)

---

## 6. Blocker 3 — Staging-safe API base

### 6.1 Resolution path (source)

| Item | Evidence |
|---|---|
| Code path | `src/services/apiClient.ts` → `getRestApiBaseUrl()` |
| Primary public env | `EXPO_PUBLIC_REST_API_BASE` |
| Legacy public env | `EXPO_PUBLIC_BACKEND_API_BASE` |
| Default / fallback | Empty string if unset — **no** production URL fallback; **no** automatic localhost fallback in code |
| Build-time vs runtime | Expo inlines `EXPO_PUBLIC_*` at **build** time into web JS |
| JWT | AsyncStorage session only — no `EXPO_PUBLIC_*` JWT bearer |
| Required staging origin | `https://viona-api-staging-eu.fly.dev` |

### 6.2 Current unsafe artifact evidence (this session; no env mutation)

Safe local diagnostic on existing gitignored `dist/` (operator env from prior builds):

| Probe | Result |
|---|---|
| Generated web JS files | 2 |
| Matches for `https://viona-api-staging-eu.fly.dev` | **0** files / **0** matches |
| Matches for `127.0.0.1` | **1** file / **1** match |
| Matches for `localhost` | **1** file / **6** matches |
| Path (relative, no contents) | `dist/_expo/static/js/web/index-*.js` |

```text
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

### 6.3 Future remediation option (B2–B3; not executed here)

Produce a staging-configured local artifact by setting **only** public client env for the build process (separate authorization), preserving:

- no production API fallback
- no secret in client bundle
- no service-role / Fly / Supabase / GitHub management token
- no automatic AI or paid external-provider invocation

**Required artifact proof (Case B):**

1. Staging-configured `npm run build:web` (no upload)
2. `dist/` exists and remains uncommitted
3. Search generated output: **require** `https://viona-api-staging-eu.fly.dev`
4. Search and **reject** `127.0.0.1`, `localhost`, and production API origin (unless separately justified static metadata)
5. Record sanitized counts + relative paths only
6. Fail closed: do not upload if any reject probe hits

---

## 7. Blocker 4 — Rollback contract

### 7.1 Hosting capability (Vercel SPA candidate — unverified live)

| Capability | Status |
|---|---|
| Immutable deployments | Expected for Vercel; **not proven** on a VIONA staging project |
| Prior-deployment promotion / alias reassignment | Expected; **unproven** |
| Deployment rollback | Expected via prior deployment; **unproven** |
| Instant redeploy of prior source SHA | Possible via rebuild/redeploy; **unproven** |
| Preview URL preservation | **UNRESOLVED** |
| Cancel in-progress deploy | Provider console; not accessed |
| Logs + deployment metadata | Provider console; not accessed |

EAS store rollback is **out of scope** for E8 Case B preferred path.

### 7.2 Required future rollback contract contents

| Element | Requirement |
|---|---|
| Pre-deploy baseline | Prior deployment id **or** explicit `NO_CLIENT_BASELINE` |
| Exact rollback action | Restore prior deployment / remove preview alias — platform-specific, recorded before deploy |
| Operator role | Hosting admin with deploy rights |
| Trigger | Smoke failure; wrong API base; production alias hit; secret leak; unexpected paid calls |
| Max smoke-check failure window | Propose ≤ 15 minutes after smoke start (operator-tunable) |
| Domain/alias restoration proof | Staging URL points to rolled-back artifact; production untouched |
| Source SHA after rollback | Recorded |
| Post-rollback checks | Non-mutating only (shell load, API origin, health) |
| Evidence path | Dedicated evidence README under `docs/design/evidence/` |

**Forbidden as client rollback:** database rollback; migration rollback; provider suspension/retirement; Local request deletion.

```text
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
```

---

## 8. Target options (≤3; ranked)

Hard gates for recommendation: isolation · deterministic SHA · rollback · artifact API-base proof · low ongoing cost · no Apple/EAS dependency · no paid runtime invocation.

| Rank | Option | Platform | Provisioned | Setup | Binding | Isolation | API base | Rollback | SHA repro | Credentials | Customer exposure | Cost | Risk | Readiness |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dedicated Vercel **staging** project hosting Expo `dist/` | Vercel static | **No** verified staging project | Create/confirm isolated project; pin SHA; set public env; password/`noindex` | Requires B1 | Best if no prod aliases | B2–B3 build proof | Prior deployment restore | High | Vercel operator auth | Preview/staging URL; must not use prod domain | Low (static) | Binding/exposure misconfig | **Not ready** — blockers 1–4 open |
| 2 | Operator-local Expo web + staging API | Local | Historical pattern | None for deploy | N/A | Full (local) | Operator `.env` | Stop Metro | Checkout SHA | None beyond local | None shared | Lowest | Does **not** satisfy E8 Case B “deployed client” | **Not a Case B target** |
| 3 | EAS preview internal binary | Expo EAS | Project id present | EAS build + distribution | Partial | Internal if kept closed | EAS env | Rebuild prior | EAS build id | Expo + device | Internal testers | Higher | Apple/EAS Phase D2 deferred; wider credential surface | **Not recommended** for E8 |

**No option is recommended for immediate Case B deploy** — none satisfy all hard gates today.

Any option requiring a **production** alias:

```text
BLOCKED_E8_CASE_B_PRODUCTION_EXPOSURE_RISK
```

---

## 9. Remediation sequencing (B0–B7 + E9)

Do **not** combine stages into one broad authorization.

| Stage | Purpose | Prerequisites | Permitted | Prohibited | Evidence | Stop conditions | Rollback | Proposed auth phrase | Type |
|---|---|---|---|---|---|---|---|---|---|
| **B0** | Target + hosting decision | This packet merged/verified | Docs + read-only provider inventory | Deploy, create project, env mutation | Chosen option + isolation proof plan | Cannot prove isolation path | N/A (docs) | `APPROVE_…_E8_CASE_B_B0_TARGET_AND_HOSTING_DECISION` | Docs-only |
| **B1** | Project binding | B0 decided | Operator confirms/creates **staging-only** project; record binding contract | Prod alias attach; secret commit; deploy of unsafe artifact | Binding matrix fields → VERIFIED | Prod exposure risk | Delete unused staging project only if empty/safe | `APPROVE_…_E8_CASE_B_B1_PROJECT_BINDING` | Infrastructure (operator) |
| **B2** | Staging API-base build-safety remediation | B0; source SHA contract | Docs and/or minimal build-env procedure; optional fail-closed check script **if separately authorized** | Runtime product change; secret in bundle; deploy | Written contract for env + fail-closed rules | Would require product/runtime change beyond build env | Revert docs/script only | `APPROVE_…_E8_CASE_B_B2_STAGING_API_BASE_BUILD_SAFETY` | Docs / config procedure |
| **B3** | Local artifact proof with staging origin | B2 | Staging-configured local `build:web`; sanitized probes | Upload/deploy; env file commit; print secrets | Probe counts: staging present; localhost/`127.0.0.1`/prod API absent | Any reject probe | Discard local `dist` | `APPROVE_…_E8_CASE_B_B3_LOCAL_STAGING_ARTIFACT_PROOF` | Build-only |
| **B4** | Rollback contract verification | B1 | Read-only provider capability check; write rollback runbook | Live rollback test that mutates prod; DB/provider rollback | Completed rollback contract table | Capability missing | N/A until deploy | `APPROVE_…_E8_CASE_B_B4_ROLLBACK_CONTRACT_VERIFICATION` | Docs + read-only infra |
| **B5** | Final E8 Case B deploy-readiness decision | B0–B4 green | Docs-only readiness decision | Deploy | Matrix all VERIFIED or N/A | Any blocker remains | N/A | `APPROVE_…_E8_CASE_B_B5_DEPLOY_READINESS_DECISION` | Docs-only |
| **B6** | Actual client deploy | B5 ready + **separate** deploy phrase | Deploy staging-only artifact at pinned SHA | Prod alias; E9 QA; paid AI | Deploy id, URL, SHA, baseline | Smoke fail / exposure | Execute B4 contract | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY` | Deployment |
| **B7** | Non-mutating deploy smoke | B6 | Shell/assets/API-origin/health/no auto-request checks | Login to create Local request; match; pay | Smoke evidence README | Any smoke fail → rollback | B4 | `APPROVE_…_E8_CASE_B_B7_NON_MUTATING_DEPLOY_SMOKE` | Post-deploy read-only |
| **E9** | Local functional QA | B7 green | Separate E9 packet | Bundled with E8 | E9 evidence | E9 scope breach | Per E9 | Separate E9 phrase | Functional QA |

All B0–B7 / E9 proposed authorization phrases in this table (including B0 `APPROVE_…_E8_CASE_B_B0_TARGET_AND_HOSTING_DECISION` and B6 `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY`) remain:

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
NOT AUTHORIZED
```

This packet does **not** start B0 or any later stage.

---

## 10. Zero-loss and AI boundary

| Control | Status |
|---|---|
| AI runtime cost hard-stop | **NOT STARTED** |
| No auto LLM / paid maps / Twilio / booking / travel / payments / payouts from deploy or mere page load | Required |
| `REQUEST_ONLY_NO_CHARGE` | Preserved |
| Local create requires explicit user submit + separate E9 auth | Affirmed |

---

## 11. Source SHA contract (future deploy)

| Rule | Requirement |
|---|---|
| Lineage | Descendant of `c9292d74015edd8e10cc1db97f560c44bcf50e76` (includes PR #438) |
| Review | No unreviewed runtime/client changes on the pinned SHA |
| Recording | Exact full SHA in evidence + deployment metadata |
| Tree | Clean working tree at build/deploy |
| Artifact link | Source SHA ↔ build command ↔ artifact probe results ↔ deploy id |
| Rollback SHA | Prior deployment SHA or `NO_CLIENT_BASELINE` |

Do **not** select a floating branch without an exact SHA.

**Eligible baseline for planning today:** `c9292d74015edd8e10cc1db97f560c44bcf50e76` (or a later safely reviewed descendant when master advances under review).

---

## 12. Customer exposure

| Question | Finding |
|---|---|
| Current verified staging client URL | None |
| Safest controls for future target | No production alias/domain; no indexing; no customer announcement; no auto traffic migration; avoid production analytics contamination |
| Production alias required? | If yes → `BLOCKED_E8_CASE_B_PRODUCTION_EXPOSURE_RISK` |

---

## 13. Prerequisite matrix

| Prerequisite | Classification |
|---|---|
| Verified staging target | **BLOCKED** |
| Hosting provider | **READY_WITH_OPERATOR_INPUT** (Vercel static intent verified; live project not) |
| Project/site binding | **BLOCKED** |
| Team/account boundary | **UNRESOLVED** |
| Staging URL | **BLOCKED** |
| Production isolation | **BLOCKED** |
| Exact source SHA | **VERIFIED** (planning baseline `c9292d7…`) |
| Build command | **VERIFIED** |
| Output directory | **VERIFIED** |
| Public env-variable contract | **READY_WITH_OPERATOR_INPUT** |
| Staging API origin (required value) | **VERIFIED** (`https://viona-api-staging-eu.fly.dev`) |
| Artifact-level API-base proof | **BLOCKED** (current `dist` unsafe) |
| Secret separation | **READY_WITH_OPERATOR_INPUT** |
| Deployment command | **UNRESOLVED** |
| Operator role/credential | **VERIFIED** (required; not used this session) |
| Previous deployment baseline | **BLOCKED** |
| Rollback action | **BLOCKED** |
| Rollback evidence | **BLOCKED** |
| Smoke checks | **VERIFIED** (defined in PR #436 packet; not executed) |
| Customer exposure controls | **UNRESOLVED** |
| Logs/evidence path | **VERIFIED** (this packet + evidence README) |
| AI/paid-service exclusion | **VERIFIED** (doctrine) |
| E9 separation | **VERIFIED** |

---

## 14. Case B decision

```text
E8_CASE_B_PREREQUISITE_REMEDIATION_SEQUENCE_READY_FOR_SEPARATE_AUTHORIZATION
```

**Rationale:** A granular B0–B7 sequence is defined and evidence-grounded, but **deploy readiness is not claimed**. All four Case B blockers remain preserved.

**Not returned:** `E8_CASE_B_STAGING_CLIENT_DEPLOYMENT_READY`

E8 deploy phrase remains **NOT GRANTED**.

---

## 15. Docs output / non-touch list

**Created:**

- This packet
- `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-e8-case-b-prerequisite-remediation-decision/README.md`

**Updated when necessary:** Kernel + Handoff sync rows only.

**Not modified:** `src/`; `tsconfig`; package/lockfile; workflows; app/Expo/Vercel/Fly config; environment files; runtime assets; migrations; provider state.

---

## 16. Security

No deployment tokens, phone/PIN/JWT, DB credential URLs, full Business/User identifiers, customer PII, or generated bundle contents are printed or committed. Local `.vercel` project identifiers are not copied.

---

## 17. Validation summary

| Gate | Result |
|---|---|
| Docs-only intent | Yes |
| Zero client deploy / project create / env mutation | Yes |
| Zero login / provider mutation / Local request | Yes |
| Four Case B blockers preserved accurately | Yes |
| Remediation sequence granular (B0–B7) | Yes |
| E8 deploy phrase not granted | Yes |
| E9–E10 unauthorized | Yes |
| `REQUEST_ONLY_NO_CHARGE` | Preserved |
| Tooling baseline PR #438 validated on master tip | Required at PR time |

---

## 18. Final classification

```text
READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_PREREQUISITE_REMEDIATION_DECISION_PACKET_PR_REVIEW
E8_CASE_B_PREREQUISITE_REMEDIATION_SEQUENCE_READY_FOR_SEPARATE_AUTHORIZATION
```

Confirm:

- no client deployment
- no project creation
- no project binding mutation
- no environment-variable mutation
- no Local request
- no provider mutation
- no E8 deploy authorization
- E9–E10 unauthorized
- `REQUEST_ONLY_NO_CHARGE` preserved

### Next operator action

Authorize **exactly one** next stage — preferred: **B0** (target and hosting decision) — under its own phrase. Do **not** auto-start B1–B7 or E8 deploy.
