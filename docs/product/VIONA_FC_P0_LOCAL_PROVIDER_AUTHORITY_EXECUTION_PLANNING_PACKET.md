# VIONA FC-P0 — Local Provider Authority Controlled Execution Planning Packet

**Classification target:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_EXECUTION_PLANNING_PACKET_PR_REVIEW`

**Authorization (this packet only):** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_EXECUTION_PLANNING_PACKET`

**Mode:** `DOCS_ONLY_NO_EXECUTION_SIDE_EFFECTS`

**Canonical verified master baseline:** `c7b936595abaf8ffca8d12687833ef47e4be5791`

**Branch:** `docs/viona-fc-p0-local-provider-authority-execution-planning-packet`

**HEAD:** `8b3b0ffe83450a979a7df10ff9f9f4dd12067e35`

**PR:** https://github.com/laoton80-del/Ket-noi-eu/pull/424

```text
PLANNING_PACKET_AUTHORIZED_FOR_DOCS_ONLY_CREATION
MIGRATION_PREFLIGHT_NOT_AUTHORIZED
MIGRATION_APPLY_NOT_AUTHORIZED
API_DEPLOY_NOT_AUTHORIZED
PROVIDER_REGISTRATION_CONFIGURATION_NOT_AUTHORIZED
PROVIDER_ACTIVATION_NOT_AUTHORIZED
CLIENT_DEPLOY_NOT_AUTHORIZED
CONTROLLED_LOCAL_QA_NOT_AUTHORIZED
FC_P0_CLOSURE_NOT_AUTHORIZED
REQUEST_ONLY_NO_CHARGE
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
NO_SOURCE_SCHEMA_MIGRATION_DEPLOY_OR_DATA_MUTATION_IN_THIS_PACKET
```

---

## 0. Status model (mandatory)

Every future gate uses exactly one of:

| Status | Meaning |
|---|---|
| `PLANNED` | Described here; **not** authorized |
| `AUTHORIZED` | Operator phrase granted for that gate only |
| `EXECUTED` | Bounded action performed under that phrase |
| `VERIFIED` | Evidence observed; gate closed green or blocked-safe |
| `CLOSED` | Gate complete; later gates still require their own phrases |

**Current statuses**

| Gate | Status |
|---|---|
| This planning packet (docs-only) | `AUTHORIZED` for docs-only creation |
| E0 environment resolution | `PLANNED` |
| E1 read-only preflight | `PLANNED` / **NOT AUTHORIZED** |
| E2 staging migration apply | **EXECUTED / VERIFIED ON MASTER** (PR #428) — Pack A1 applied; **E3 executed separately below** |
| E3 staging API deploy | **EXECUTED** (Fly **v29** @ `2026-07-23T10:45:07Z`); result PR pending review — **E4–E10 remain NOT AUTHORIZED** |
| E4 route/schema compatibility | `PLANNED` / **NOT AUTHORIZED** |
| E5 Role.ADMIN operator identity | `PLANNED` / **NOT AUTHORIZED** |
| E6 provider registration/configuration | **AUTHORIZED** (phrase granted) / **BLOCKED — NO MUTATION** — see observed result below |
| E7 provider activation | `PLANNED` / **NOT AUTHORIZED** |
| E8 client deployment decision | `PLANNED` / **NOT AUTHORIZED** |
| E9 controlled Local create QA | `PLANNED` / **NOT AUTHORIZED** |
| E10 FC-P0 staging closure | `PLANNED` / **NOT AUTHORIZED** |

Describing a gate here does **not** mark it `AUTHORIZED`, `EXECUTED`, or `VERIFIED`.

---

## 1. Purpose

Move the **code-complete** Local FC-P0 implementation already verified on master into a **separately authorized** staging execution sequence.

This packet plans gates only. It must not execute them.

### 1.1 Verified implementation on baseline (code-complete; execution gates open)

| Pack / remediation | Master squash | Status |
|---|---|---|
| Pack A1 schema + create enforcement | PR #419 @ `97d9ee01f6159a7ed7d48ac3b422ddb4359bca60` | MERGED; migration **authored, unapplied** |
| Pack A2 read + ops control | PR #420 @ `ff0fdfa7752eacb265e94f1de75e676d57ae5c62` | MERGED |
| A2 deterministic behavioral remediation | PR #421 @ `0dab3f40053f1601beabe77ced9a6da990f9b954` | MERGED |
| Pack B client authority wiring | PR #422 @ `5ef5a1d58539648311548db2c9f6017440f088f4` | MERGED |
| Failure-code envelope + Pack B recovery discrimination | PR #423 @ `c7b936595abaf8ffca8d12687833ef47e4be5791` | MERGED + post-merge verified |

Local FC-P0 remains **blocked** pending operational execution gates below.

---

## 2. Execution doctrine

```text
ONE GATE
→ ONE EXPLICIT OPERATOR AUTHORIZATION
→ ONE BOUNDED EXECUTION
→ ONE EVIDENCE RESULT
→ STOP
```

Forbidden: a single phrase that chains migration + deploy + activation + client deploy + live QA.

A failed gate **stops** all later gates.

---

## 3. Canonical source inventory (read-only, current master)

### 3.1 Pack A1 migration

| Field | Value |
|---|---|
| Path | `prisma/migrations/20260722120000_add_local_provider_eligibility_authority/migration.sql` |
| Nature | Structure-only (enums + tables + indexes + Restrict FKs) |
| Data mutation | **None** — no INSERT/UPDATE/DELETE/backfill/seed/activation |
| Expected post-apply rows | Zero eligibility; zero eligibility audit |

### 3.2 Local server routes (mounted under `/api/local` via `authMiddleware`)

| Method | Path | Gate | Purpose |
|---|---|---|---|
| GET | `/api/local/providers` | auth | B2C selectable provider list |
| POST | `/api/local/ops/providers` | auth + `superAdminMiddleware` (`Role.ADMIN`) | Register DRAFT eligibility |
| PATCH | `/api/local/ops/providers/:businessId` | Role.ADMIN | Configure visibility / service types |
| POST | `/api/local/ops/providers/:businessId/activate` | Role.ADMIN | Activate |
| POST | `/api/local/ops/providers/:businessId/suspend` | Role.ADMIN | Suspend (reversible containment) |
| POST | `/api/local/ops/providers/:businessId/retire` | Role.ADMIN | Retire (terminal; **not** default rollback) |
| POST | `/api/local/requests` | auth | Local create (`REQUEST_ONLY_NO_CHARGE`) |
| GET | `/api/local/requests` | auth | Requester list |
| GET | `/api/local/requests/:id/timeline` | auth | Timeline |
| POST | `/api/local/requests/:id/cancel` | auth | Cancel |

Health (unauthenticated): `GET /health` → `{ success: true, data: { status: 'ok' } }` (`src/app.ts`).

### 3.3 Client authority path

```text
TabLocal
→ LocalScreen
→ local-tile-my-requests
→ LocalUserRequestStatusScreen
→ LocalUserRequestCreateComposer
→ GET /api/local/providers (service-type-first)
→ POST /api/local/requests
→ recovery only via classifyLocalCreateRecovery
   (provider_not_available@404 | service_type_not_supported@400)
```

### 3.4 Staging API target (canonically verified in repo)

| Field | Verified value | Source |
|---|---|---|
| Fly app | `viona-api-staging-eu` | `fly.toml` `app = 'viona-api-staging-eu'`; Kernel Pack29+ evidence |
| Primary region | `fra` | `fly.toml` `primary_region = 'fra'` |
| Public host label | `viona-api-staging-eu.fly.dev` | Kernel staging evidence rows |
| Deploy convention | `fly deploy --app viona-api-staging-eu --remote-only` | Prior staging deploy evidence (Pack36A / Pack40*) |
| Migration convention | `npx prisma migrate deploy` against staging DB only | Prior Pack40DR1 / Pack36A evidence |
| Staging DB host label | `db.staging-redacted.supabase.co` (symbolic; never paste secrets) | Pack40DR1 evidence convention |

### 3.5 Unknowns — required E0/E1 preflight inputs (do not guess)

| Input | Status in this packet |
|---|---|
| Current staging Fly **release version** / image id | **UNRESOLVED** — resolve in E0/E1 |
| Current **deployed source SHA** on staging | **UNRESOLVED** |
| Current staging **migration history** (is Pack A1 pending?) | **UNRESOLVED** (local SoT skips imply table absent locally; staging must be re-read) |
| Staging DB backup/restore readiness proof | **UNRESOLVED** |
| Approved staging **Role.ADMIN** operator identity | **UNRESOLVED** (no identity invented here) |
| Operator-approved staging-only **Business** fixture | **UNRESOLVED** |
| Staging **client/web** artifact SHA (Pack B + #423 present?) | **UNRESOLVED** |
| Exact rollback Fly version before next API deploy | **UNRESOLVED** until E1 records it |

**E0 readiness classification for this planning packet:**

`READY_FOR_READ_ONLY_PREFLIGHT`

Staging API **service** and **region** are canonically resolved. Remaining unknowns are **preflight inputs**, not a target-name ambiguity that would force `BLOCKED_EXECUTION_ENVIRONMENT_TARGET_UNRESOLVED`.

---

## 4. Canonical execution sequence (E0–E10)

| Stage | Name | Side effects | Status |
|---|---|---|---|
| E0 | Environment resolution | None (docs / read inventory) | PLANNED |
| E1 | Read-only migration + deploy preflight | Read-only only | NOT AUTHORIZED |
| E2 | Staging migration apply | DB schema apply (staging) | NOT AUTHORIZED |
| E3 | Staging API deploy | Fly API deploy | NOT AUTHORIZED |
| E4 | Route/schema compatibility | Read-only HTTP checks | NOT AUTHORIZED |
| E5 | Role.ADMIN operator verification | Auth probe only | NOT AUTHORIZED |
| E6 | Provider registration + DRAFT config | Ops writes (DRAFT only) | NOT AUTHORIZED |
| E7 | Separate provider activation | Ops activate | NOT AUTHORIZED |
| E8 | Client deploy decision | Optional client/web deploy | NOT AUTHORIZED |
| E9 | Controlled Local create QA | Exactly one request | NOT AUTHORIZED |
| E10 | Staging FC-P0 closure verification | Docs/evidence only | NOT AUTHORIZED |

No stage may be skipped without explicit operator approval and written rationale.

---

## 5. Stage E0 — Environment resolution

**Goal:** Resolve all unknowns in §3.5 before any apply/deploy phrase is granted.

**Actions (future, when E0 is executed under a broader preflight or as part of E1):**

1. Record `origin/master` SHA (must preserve PRs #419–#423 contracts).
2. Record Fly app `viona-api-staging-eu`, region `fra`.
3. Record current Fly release / image id (symbolic evidence path only).
4. Record current deployed source SHA if discoverable from release evidence.
5. Record `npx prisma migrate status` output summary (pending vs applied) — **read-only**.
6. Confirm Pack A1 migration filename exact match.
7. Confirm backup/restore owner and procedure label (no secrets).
8. Confirm evidence root: `docs/product/` + `docs/design/evidence/…`.

**Stop if:** production target appears; Fly app ≠ `viona-api-staging-eu`; master no longer preserves Local authority contracts.

---

## 6. Stage E1 — Read-only preflight

**Proposed phrase (NOT GRANTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_EXECUTION_PREFLIGHT`

**Required checks**

1. Canonical source SHA verified (`c7b9365…` or later verified master preserving #419–#423).
2. Working tree / release source clean.
3. Migration SQL matches reviewed Pack A1 file byte-for-byte.
4. Migration contains no INSERT/UPDATE/DELETE/backfill/activation.
5. Target DB is staging only (never production).
6. Migration history read-only inspected.
7. Pack A1 migration confirmed **unapplied** (or stop with conflict classification).
8. DB connectivity read-only verified.
9. Backup/restore capability confirmed.
10. API rollback version known.
11. Current `GET /health` behavior known.
12. Existing Local route inventory matches §3.2.
13. No incompatible later migration blocking apply.
14. No silent assumption that staging Business/providers already exist.
15. Stop conditions understood before apply.

**Must not:** apply migration; deploy; mutate provider/Business/User/request data.

---

## 7. Stage E2 — Staging migration apply

**Authorization phrase (GRANTED / EXECUTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY`

**Observed result (docs):** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY_RESULT.md`  
Pack A1 applied on staging @ `2026-07-23T10:06:06Z`–`10:06:10Z` (`npx prisma migrate deploy` exit 0).  
History clean; schema objects present; eligibility/audit rows = 0.  
**E3–E10 remain NOT AUTHORIZED.** Do not treat this section as E3 authorization.

| Constraint | Rule |
|---|---|
| Target | Staging DB only |
| Source | Exact Pack A1 migration on verified master |
| Command class | One `prisma migrate deploy` (or repo-approved equivalent) |
| Forbidden | Schema generate from dirty tree; seed; backfill; provider/audit/Business/User/request writes |

**Pre-apply evidence:** target identity; migrate status; backup readiness; SQL checksum; expected enums/tables/indexes/Restrict FKs.

**Post-apply verification:** history records exact migration; enums/tables/indexes/FKs exist; **zero** eligibility rows; **zero** eligibility audit rows; Business row counts unchanged; **do not** assume API compatibility yet.

**Stop after migration verification. Do not auto-deploy.**

### 7.1 Migration failure / rollback (additive)

| When | Containment |
|---|---|
| Before migration recorded complete | Stop; preserve logs; do not deploy new API; determine Prisma failed/partial state; use repository-approved recovery; **no** manual history edits without separate approval |
| After successful apply | Do **not** drop tables to “roll back”; hold deploy if needed; if API incompatible later, roll **API** back while preserving additive schema; DB restore = last resort, **separate** authorization |

**No executable destructive SQL is included in this packet.**

---

## 8. Stage E3 — Staging API deploy

**Authorization phrase (GRANTED / EXECUTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY`

**Observed result (docs):** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY_RESULT.md`  
Fly staging deploy @ `2026-07-23T10:45:07Z`–`10:48:14Z` (`fly deploy --app viona-api-staging-eu --remote-only` exit 0) → **v29** / `deployment-01KY798FWDYE8YM0ZD4QW98JP0`.  
Pre-deploy rollback target exact **v28**. Post-deploy `/health` 200; unauth Local routes 401; Pack A1 clean; rows 0/0.  
**E4–E10 remain NOT AUTHORIZED.** Do not treat this section as E4 authorization.

| Constraint | Rule |
|---|---|
| Deploy source | `c7b936595abaf8ffca8d12687833ef47e4be5791` or later verified master preserving Local authority contracts |
| Target | `viona-api-staging-eu` only |
| Convention | `fly deploy --app viona-api-staging-eu --remote-only` (per prior evidence) |
| Preconditions | E2 verified |
| Forbidden | Production; secret changes unless separately authorized; provider data mutation during deploy |

Record exact source SHA, build/release gate results, and prior rollback version.

---

## 9. Stage E4 — Route / schema compatibility

Read-only after E2+E3. **No provider mutation.**

| # | Check | Expected |
|---|---|---|
| 1 | `GET /health` | success |
| 2 | Unauth `GET /api/local/providers` | **401**, not 404 |
| 3 | Unauth `POST /api/local/requests` | **401**, not 404 |
| 4 | Unauth ops provider routes | **401** |
| 5 | Auth non-admin ops | **403** |
| 6 | Auth B2C `GET /api/local/providers` (no ACTIVE providers) | **200** `{ items: [], pagination… }` |
| 7 | No missing-table / raw Prisma errors | Held |
| 8 | Local create fail envelope retains `{ success:false, code, error }` | Held |
| 9 | Legacy unrelated `jsonFail` without code | `{ success:false, error }` |
| 10 | No provider/request created | Held |
| 11 | Platform health/auth unchanged | Held |

If any Local authority route returns **404** or missing-table error: **STOP** — classify `BLOCKED_LOCAL_PROVIDER_STAGING_ROUTE_SCHEMA_INCOMPATIBILITY`. Do not register a provider.

**Future green classification:** `READY_FOR_CONTROLLED_PROVIDER_REGISTRATION`

---

## 10. Stage E5 — Role.ADMIN operator identity

| Requirement | Rule |
|---|---|
| Identity | Existing approved **staging** `Role.ADMIN` only |
| Gate | `superAdminMiddleware` |
| Actor | Server-derived `actorUserId` — **never** body-supplied |
| Evidence | No shared personal credentials / JWTs in docs |
| Token | Short-lived; handled outside documentation |
| Deny | Ordinary user / merchant identities for ops writes |

Do **not** create or elevate a user in this planning packet.

If no approved staging Role.ADMIN exists at execution time:  
`BLOCKED_NO_APPROVED_STAGING_ROLE_ADMIN_OPERATOR`

---

## 11. Stage E6 — Provider registration and configuration (DRAFT)

**Authorization phrase (GRANTED / ATTEMPTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_PROVIDER_REGISTRATION_AND_CONFIGURATION`

**Observed result (docs):** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_PROVIDER_REGISTRATION_AND_CONFIGURATION_RESULT.md`  
Primary `BLOCKED_LIVE_ROLE_ADMIN_AUTHENTICATION_UNRESOLVED`; concurrent `BLOCKED_NO_SAFE_STAGING_BUSINESS_FIXTURE`; **zero** provider registration/configuration mutations.  
**E7–E10 remain NOT AUTHORIZED.** Do not treat this section as activation authorization.

### 11.1 Business fixture

Must be operator-approved, staging-only, non-production, non-sensitive, human-readable, Local-test compatible.

**Do not assume such a Business exists.** If absent: **STOP** and require a separate fixture authorization.

### 11.2 Sequence

1. `POST /api/local/ops/providers` → DRAFT eligibility only  
2. Verify `REGISTERED` audit; lifecycle timestamps null  
3. `PATCH` config as required (`publicB2cVisible`, `supportedServiceTypes`)  
4. Verify `CONFIG_UPDATED` audit  
5. Confirm status remains **DRAFT**  
6. Confirm provider **does not** appear in B2C list  
7. **Stop before activation**

---

## 12. Stage E7 — Separate provider activation

**Proposed phrase (NOT GRANTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_PROVIDER_ACTIVATION`

**Preconditions:** DRAFT eligibility; valid display name; `publicB2cVisible=true`; non-empty supported types; REGISTERED + CONFIG_UPDATED verified; E4 green; approved operator; exact Business id; suspend containment understood.

**Action:** `POST /api/local/ops/providers/:businessId/activate`

**Expected:** status ACTIVE; `activatedAt` set; `suspendedAt` null; `retiredAt` null; one ACTIVATED audit; appears in authenticated provider list for compatible service types.

**Do not** auto-create a Local request. Stop after activation verification.

### 12.1 Activation containment

Canonical reversible containment: **SUSPEND** (separately authorized).  
Do **not** default to RETIRE. Do not delete eligibility/audit history.  
No suspend/retire is authorized by this planning packet.

---

## 13. Stage E8 — Client deployment decision

**Proposed phrase if needed (NOT GRANTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY`

| Case | Action |
|---|---|
| Staging client already serves verified Pack B + PR #423 source | Document; **no** new client deploy |
| Client missing those contracts | Separate client/web deploy only; record SHA; run readiness gates |

Do not assume native deploy. Physical Android/iOS remain separate confidence lanes. Do not combine client deploy authorization with Local QA authorization.

---

## 14. Stage E9 — Controlled Local create QA

**Proposed phrase (NOT GRANTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_CONTROLLED_STAGING_LOCAL_CREATE_QA`

### 14.1 Preconditions

Migration verified; API compatible; approved provider ACTIVE; compatible client available; approved test user/session; exact service type; provider list shows intended provider; no payment/charge path; evidence capture ready.

### 14.2 Positive scenario (exactly one request)

1. Open existing Local request status/composer flow  
2. Select canonical `LocalServiceType`  
3. Load providers via authenticated `GET /api/local/providers`  
4. Select human-readable approved staging provider  
5. Enter synthetic non-sensitive title/details  
6. Submit **exactly one** request  
7. Verify POST count = 1; HTTP 201; request id returned  
8. Verify list appearance + created-row expansion/highlight  
9. Verify request + request audit atomic  
10. Verify no payment/wallet/VIO/charge  
11. Verify eligibility audit **not** created by request creation  
12. **Stop**

No automatic retry. No second request unless a separate QA step authorizes it.

### 14.3 Optional later negatives (separate authorization if executed)

`provider_not_available`; `service_type_not_supported`; unrelated validation preserving selection; 401; 429; network-unknown.  
Do **not** force suspend/retire during first positive QA.

### 14.4 Privacy

Synthetic staging-safe data only. Evidence must not contain real JWTs, full emails, private merchant details, phones/addresses, secrets, or connection strings. Redact while retaining stable proof of one provider + one request.

---

## 15. Stage E10 — Staging FC-P0 closure

**Proposed phrase (NOT GRANTED):**  
`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLOSURE_VERIFICATION`

### 15.1 Closure criteria (all required)

1. Pack A1 schema + create enforcement verified on deployed environment  
2. Pack A2 provider read/ops verified  
3. Pack B client authority verified  
4. Failure-code + recovery preserved  
5. Migration applied to staging successfully  
6. No migration data mutation/backfill  
7. API deployed from verified source  
8. Route/schema compatibility green  
9. Approved Role.ADMIN verified  
10. Provider registered/configured with audit  
11. Provider separately activated with audit  
12. Provider appears only when selectable  
13. Exactly one controlled Local request created successfully  
14. Request + request audit atomic  
15. Client success/list/expansion verified  
16. `REQUEST_ONLY_NO_CHARGE` confirmed  
17. No provider-authority privacy leak  
18. No automatic POST retry  
19. No deploy/migration/activation evidence gaps  
20. Rollback/suspension readiness documented  
21. No production claim  
22. No physical-native confidence claim unless separately evidenced  

### 15.2 Classification distinction

| Label | Meaning |
|---|---|
| `STAGING_FC_P0_CLOSED_GREEN` | Staging Local FC-P0 closed |
| `PRODUCTION_READY` | **Not** implied by staging closure |

---

## 16. Stop conditions

| Phase | Stop if |
|---|---|
| Before migration | Target unresolved; production risk; checksum mismatch; backup unavailable; history conflict |
| Before deploy | Migration unverified; source SHA unverified; build/release fail; rollback unknown |
| Before registration | Routes 404; missing-table/Prisma error; Role.ADMIN unresolved; safe Business unresolved |
| Before activation | Invalid display name; visibility false; empty types; audit missing; unexpected state |
| Before Local QA | List does not show intended provider; client unresolved; auth unstable; not ACTIVE; route errors; payment/charge appears |
| Before closure | Evidence inferred; step outside authorization; unsafe real data; automatic retry / duplicate request |

---

## 17. Evidence matrix (future stages)

| Stage | Phrase | Operator | Target | Source SHA | Start | Action | Expected | Observed | Evidence path | Stop | Containment | Next | Explicitly unauthorized later |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | `…_STAGING_EXECUTION_PREFLIGHT` | TBD | staging | TBD | PLANNED | read-only checks | READY_FOR_APPLY or BLOCKED | — | TBD | §16 | n/a | E2 | apply/deploy/activation/QA |
| E2 | `…_STAGING_MIGRATION_APPLY` | `91b7aaf…` | staging DB `euqbfanilcssjiwwtcby` | `2026-07-23T10:06:06Z` | E1 VERIFIED | migrate deploy | schema + zero rows **PASS** | — | EXECUTED | §16 | §7.1 | E3 decision only | deploy/activation/QA still unauthorized |
| E3 | `…_STAGING_API_DEPLOY` | `de59110…` | `viona-api-staging-eu` | `2026-07-23T10:45:07Z` | E2 VERIFIED | fly deploy | health 200 **PASS** | — | EXECUTED | §16 | roll API **v28** | E4 decision only | activation/QA still unauthorized |
| E4 | (under E3 or dedicated) | TBD | staging API | TBD | E3 VERIFIED | HTTP probes | READY_FOR_REGISTRATION | — | TBD | §16 | hold | E5/E6 | registration |
| E5 | (under E6 precheck) | TBD | staging auth | TBD | E4 green | admin probe | ADMIN ok | — | TBD | §16 | stop | E6 | elevation |
| E6 | `…_PROVIDER_REGISTRATION_AND_CONFIGURATION` | TBD | ops routes | TBD | E5 ok | POST+PATCH | DRAFT + audits | — | TBD | §16 | leave DRAFT | E7 | activation/QA |
| E7 | `…_PROVIDER_ACTIVATION` | TBD | activate | TBD | E6 VERIFIED | activate | ACTIVE + list | — | TBD | §16 | SUSPEND (sep.) | E8/E9 | QA |
| E8 | `…_STAGING_CLIENT_DEPLOY` | TBD | client/web | TBD | if needed | deploy | Pack B+#423 live | — | TBD | §16 | prior artifact | E9 | QA |
| E9 | `…_CONTROLLED_STAGING_LOCAL_CREATE_QA` | TBD | composer | TBD | E7(+E8) | one POST | 201 + list | — | TBD | §16 | no delete audits | E10 | second request |
| E10 | `…_STAGING_CLOSURE_VERIFICATION` | TBD | docs | TBD | E9 VERIFIED | evidence review | STAGING_FC_P0_CLOSED_GREEN | — | TBD | §16 | n/a | stop | production |

Fill **Observed** only during authorized execution. Planned ≠ completed.

---

## 18. Rollback / containment matrix

| Stage | Containment |
|---|---|
| Migration | Stop; preserve logs; no automatic destructive rollback; approved recovery only |
| API deploy | Rollback to known prior API version; additive schema may remain |
| Registration/config | Leave DRAFT; do not delete authority/audit rows |
| Activation | Separately authorize **SUSPEND**; do not default to RETIRE |
| Client deploy | Rollback to previous verified client artifact |
| Local QA | Do not delete audit history; mark test evidence; no second request unless authorized |

---

## 19. Future authorization phrases (proposed; **none granted**)

1. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_EXECUTION_PREFLIGHT`  
2. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY`  
3. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY`  
4. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_PROVIDER_REGISTRATION_AND_CONFIGURATION`  
5. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_PROVIDER_ACTIVATION`  
6. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLIENT_DEPLOY`  
7. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_CONTROLLED_STAGING_LOCAL_CREATE_QA`  
8. `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_CLOSURE_VERIFICATION`  

Each phrase authorizes **only** its named gate. No phrase implicitly authorizes later gates.

---

## 20. Monetization and safety

Preserve **`REQUEST_ONLY_NO_CHARGE`**.

This sequence must not introduce price, quote, charge, payment intent, wallet, VIO, settlement, provider payout, AI matching, or background automation.

AI runtime cost hard-stop remains the next P0 lane **only after** Local FC-P0 is properly closed. **Not begun** by this packet.

Pack40S **NOT AUTHORIZED**. Apple / EAS / Phase D2 **deferred**. Phase C remains closed green.

---

## 21. Confirmations (this packet)

1. Docs-only — no source / Prisma / migration / package / env / deploy config edits  
2. No migration apply  
3. No deploy  
4. No provider registration / configuration / activation  
5. No staging data mutation  
6. No live QA / live Local request  
7. No payment / charge  
8. No Role.ADMIN JWT generated or pasted  
9. No execution phrase granted beyond docs-only planning creation  
10. FC-P0 remains blocked pending separately authorized execution gates  

---

## 22. Exactly one next operator action

**Strict-review this docs-only planning PR.**  

Do **not** auto-authorize E1–E10. Do **not** apply migration, deploy, register/activate providers, or run live Local QA from this packet.
