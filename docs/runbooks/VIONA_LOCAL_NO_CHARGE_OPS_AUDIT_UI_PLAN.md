# VIONA Local no-charge — Ops Audit UI plan

**Pack:** `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI_PLAN.1`
**Master / origin baseline:** `40c2711` — `docs(kernel): sync controlled pilot session 1 pass`
**Date:** 2026-05-23
**Classification:** Planning only — **no runtime shipped by this pack**
**Pilot context:** Controlled no-charge pilot session 1 **API PASS + UI PASS + no pause** @ `4c26830`

**Related:**

| Doc | Role |
|-----|------|
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Daily pilot ops |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_1.md` | Session 1 evidence |
| `VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` | Pilot readiness sign-off |
| `VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Public HTTPS smoke |
| `VIONA_PROJECT_KERNEL.md` | Kernel gates / money law |

---

## 1. Purpose

| Goal | Detail |
|------|--------|
| **Primary** | Give **operators** a **safe, read-only** view of Local pilot activity to support controlled no-charge pilot sessions 2+ |
| **Triage** | Improve issue triage with **privacy-safe** evidence (request ids, status, wallet safety flags, tenant boundaries) |
| **Evidence links** | Surface links to smoke output, session runbooks, and audit trails — not raw secrets |
| **Explicitly not** | A production admin console, payment/settlement dashboard, merchant self-service back office, or commercial readiness claim |

**Money law (unchanged):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; **confirmed does not mean paid**; no payment captured.

**Whole VIONA:** pre-commercial / staging-pilot foundation. **Global Active / full commercial:** not yet.

---

## 2. Read-only first scope

### Ops UI may display (allowlist)

| Field / concept | Source (planned) | Notes |
|-----------------|------------------|-------|
| Request id | List / detail API | UUID only; copy-friendly |
| Created / updated time | List / detail | ISO timestamps |
| Status + safe status label | List / detail | No “paid” implication |
| `walletMode` / `walletPhase` | List / detail / audit | Must show `REQUEST_ONLY_NO_CHARGE` + `NONE` chips when applicable |
| User role label | Operator context | e.g. “Pilot User A” — **label**, not phone/PIN |
| Merchant / business label | List / detail | Business **name** + id; no owner PII |
| Confirm / decline outcome | Status + audit events | Merchant ACK only — not settlement |
| Tenant isolation indicators | Cross-check panels | e.g. “Business M rows absent for Merchant N lens” |
| No-charge safety flags | API `safety` blocks + UI chips | `readOnly`, `noPaymentCaptured`, `requestOnlyNoCharge` |
| Smoke / session summary links | Static runbook URLs + last smoke JSON path hint | No JWT/PIN in UI |

### Ops UI must not mutate (forbidden in v1)

| Domain | Rationale |
|--------|-----------|
| Payment capture / charge | Out of pilot money law |
| Wallet hold / debit / release / refund | Blocked until finance pack |
| Settlement / payout / escrow / cash-out | Commercial — not in scope |
| Merchant balance / ledger | Not exposed in Local list DTOs today |
| Request status (confirm / reject / cancel) | User/merchant flows only; **ops cancel** exists server-side but is **excluded** from v1 UI unless `OPS_CANCEL` pack approved |
| AI / SOS actions | Separate safety domains |

**Later (explicit pack only):** `POST /api/local/ops/requests/:id/cancel` — super-admin; **not** in read-only v1 UI.

---

## 3. Safety rules (non-negotiable)

| Rule | UI enforcement |
|------|----------------|
| `REQUEST_ONLY_NO_CHARGE` | Persistent banner + per-row chip |
| `walletPhase` **NONE** | Chip; warn if non-`NONE` |
| No payment captured | Chip from API `safety.noPaymentCaptured` |
| **Confirmed ≠ paid** | Copy on every `CONFIRMED` row |
| No cash-out / payout / escrow wording | Copy lint checklist; forbidden-term scan in ops playbook |
| No secrets | Never render JWT, PIN, `EXPO_PUBLIC_DEV_REST_JWT`, webhook secrets |
| Minimal PII | Prefer ids + role labels; mask phone/email; full requester display only if super-admin detail pack approves |

**Operator attestation:** Ops Audit UI evidence rows are **privacy-safe** (no PIN, no tokens) — same standard as pilot session logs.

---

## 4. Proposed screens and components

### Screen

| Name | Route (proposed) | Access |
|------|------------------|--------|
| `LocalOpsAuditScreen` | `LocalOpsAudit` (internal nav only) | Operator / super-admin gated |

### Components (read-only)

| Component | Function |
|-----------|----------|
| **Request table / card list** | Paginated Local requests with status, wallet chips, business label |
| **Request detail drawer** | Id, timeline summary, confirm/decline audit hints |
| **Safety status chips** | `REQUEST_ONLY_NO_CHARGE`, `walletPhase NONE`, `noPaymentCaptured` |
| **Tenant isolation panel** | Compare expected pilot boundaries (docs-driven checklist + optional dual-lens fetch) |
| **Pilot session evidence panel** | Links: session 1 runbook, device matrix, REST UI walkthrough |
| **Smoke status panel** | Last smoke stage summary (manual paste or CI artifact URL — no secrets) |
| **Pause checklist panel** | Mirrors ops playbook pause criteria (read-only checklist) |

**UX standard:**

- Dense admin/operator layout acceptable (not Home Premium App Tile standard).
- Safety copy **always visible** (sticky header).
- Mobile-readable; **desktop/tablet priority** for session 2+ ops.
- EN primary; VI labels optional later (reuse safe status label maps).

**Out of scope for shell:** Tourism wallet, Firebase VIP, B2B voice, `AdminDashboard` finance tiles.

---

## 5. Access model

| Layer | v1 policy |
|-------|-----------|
| **Audience** | Dev / operator **internal builds only** |
| **Public users** | **No** route registration in external pilot builds |
| **Merchants** | **No** ops audit access in v1 (merchant inbox remains separate) |
| **Server role** | `GET /api/local/ops/*` requires **super-admin** (`Role.ADMIN` + `superAdminMiddleware`) |
| **Client gate** | Follow `adminDebugGate` pattern: `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1` + dev-only; no client PIN backdoor in release |
| **Auth** | REST JWT via operator login (staging super-admin account) — **not** dev JWT bypass for evidence |
| **Tenant safety** | Cross-tenant list only via **ops** endpoints; never merge User A token with Merchant M inbox in one conflated “god view” without server enforcement |

**Provisioning note:** Staging super-admin account must exist and be roster-approved; credentials never in git.

---

## 6. Data requirements

### Existing API endpoints (usable read-only today)

| Method | Path | Auth | Scope | Use in Ops Audit UI |
|--------|------|------|-------|---------------------|
| `GET` | `/health` | None | Liveness | Smoke status panel |
| `GET` | `/api/local/requests` | Bearer (requester) | Own requests only | **Not** ops-wide; optional “impersonation lens” doc-only in session 2 — prefer ops list |
| `GET` | `/api/local/requests/:id/timeline` | Bearer (requester) | Own request timeline | **Not** ops-wide without ownership |
| `GET` | `/api/local/merchant/requests` | Bearer (merchant) | Owned businesses inbox | Per-merchant lens only; isolation checks |
| `GET` | `/api/local/ops/requests/:id/audit-events` | Bearer + **super-admin** | Audit trail for one id | Detail drawer — **requires known request id** |
| `POST` | `/api/local/ops/requests/:id/cancel` | Super-admin | Mutation | **Excluded** from v1 UI |

**Smoke script (operator, not UI):** `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` — validates personas; output is privacy-safe stage JSON (no pin).

### Ops list/detail endpoints (`OPS_AUDIT_UI.READONLY_API_AUDIT.1`) — **implemented**

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| `GET` | `/api/local/ops/requests` | **Live** | `superAdminMiddleware`; paginated; `safety` block; no phone/PIN |
| `GET` | `/api/local/ops/requests/:id` | **Live** | Same redaction as list item |
| `GET` | `/api/local/ops/requests/:id/audit-events` | **Live** (prior pack) | Per-request audit trail |

**Service:** `src/services/local/localOpsRequestListService.ts`
**Tests:** `npx tsx scripts/test-local-ops-request-list-api-1.ts` (DATABASE_URL; ephemeral ADMIN)

### Public HTTPS ops smoke (`FLY_DEPLOY_AND_HTTPS_SMOKE.1`) — **PASS** @ `944d8eb` (2026-05-23)

| Item | Result |
|------|--------|
| Fly deploy | `fly deploy -a viona-api-staging-eu` — release **v8**, image `deployment-01KSAF805PBGS7DD43ZESG2B22` |
| Git at deploy | `944d8eb` (includes `READONLY_API_AUDIT.1` ops routes) |
| `GET /health` | **PASS** |
| Pilot A/B/M/N + create/confirm/decline | **PASS** |
| `login:opsAdmin` | **PASS** (`Role.ADMIN`) |
| `opsAuditList` | **PASS** |
| `opsAuditDetail` | **PASS** |
| `opsAuditUnauthed` | **PASS** (401) |
| `opsAuditForbiddenB2c` | **PASS** (403) |
| `opsAuditForbiddenMerchant` | **PASS** (403) |
| `opsAuditMutationSafe` | **PASS** |
| Redaction scan | **PASS** |
| `walletMode` / `walletPhase` | `REQUEST_ONLY_NO_CHARGE` / `NONE` |
| `paymentCaptured` | **false** |

**Command:** `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` (exit 0)

**Prior blockers resolved:** `pin_storage_plaintext_not_bcrypt` (`provision-local-ops-admin-staging.ts`); `fly_api_deploy_drift` (Fly deploy v8).

**Does not certify:** production admin console, payment/settlement dashboard, commercial/payment readiness, settlement/payout, AI/SOS automation. Super-admin ops routes only by design.

**Staging HTTPS smoke (`READONLY_API_HTTPS_SMOKE.1`) — historical:** was **BLOCKED** before ADMIN PIN rehash + Fly deploy (see sections below).

**Unblock (ops, not engineering inventing accounts):**

1. Internal roster approval for one staging `Role.ADMIN` operator identity.
2. Provision ADMIN on staging DB (engineering runbook — **do not** commit phone/PIN).
3. Operator sets in `.env.local` (gitignored, never commit):
   - `VIONA_PILOT_OPS_ADMIN_PHONE=<E.164>` (roster ADMIN)
   - `VIONA_PILOT_OPS_ADMIN_PIN=<pin>` **optional** — use when ADMIN PIN differs from pilot personas (`SMOKE_ADMIN_PIN_SUPPORT.1`); if unset, smoke uses `VIONA_PILOT_PIN` for ops admin login only
4. Re-run: `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` — expect `opsAuditList`, `opsAuditDetail`, `opsAuditUnauthed`, `opsAuditForbiddenB2c`, `opsAuditForbiddenMerchant`, `opsAuditMutationSafe` all **PASS**.

**Ops admin login 401:** Smoke reports a safe message only (no PIN/phone logged). Verify phone + dedicated `VIONA_PILOT_OPS_ADMIN_PIN` or shared `VIONA_PILOT_PIN`. `Role.ADMIN` check unchanged after login.

### Ops ADMIN DB target diagnosis (`OPS_ADMIN_DB_TARGET_DIAGNOSE.1`) — **BLOCKED** @ `0be8057`

Run: `node scripts/smoke-public-staging-api.mjs --diagnose-ops-db` (no secrets printed).

| Finding | Result |
|---------|--------|
| Local `DATABASE_URL` host | `aws-1-eu-central-1.pooler.supabase.com` — staging ref `euqbfanilcssjiwwtcby` present |
| Fly `DATABASE_URL` secret | **Deployed** (`fly secrets list -a viona-api-staging-eu`; digest differs from local — credentials differ, same Supabase project ref typical) |
| Local `Role.ADMIN` count | **1** |
| Ops phone in local DB | **yes** — `role` ADMIN |
| Ops `pinCode` storage | **plaintext** (`pinCodeFieldLength` 6, not `$2…` bcrypt) |
| Pilot User A `pinCode` | **bcrypt** (field length 60) — explains pilot HTTPS login PASS |
| `pinMatchesProvidedLoginPin` | **false** with current env PIN |
| HTTPS smoke `login:opsAdmin` | **HTTP 401** |

**Blocker classification:** `pin_storage_plaintext_not_bcrypt` (primary). Fly API uses `bcrypt.compare` on `User.pinCode`; ops ADMIN was provisioned without bcrypt hash. Same row is visible to Fly runtime DB → 401 is not a separate “missing user on Fly” case when local and Fly share staging Supabase.

**Operator unblock (no fake PASS):**

1. On staging DB via `DIRECT_URL` (same project `euqbfanilcssjiwwtcby`), set ops ADMIN `User.pinCode` to `bcrypt.hash(plainPin, 10)` (mirror `scripts/provision-local-pilot-accounts-staging.ts`).
2. Use the **same** plain PIN in `.env.local` as `VIONA_PILOT_OPS_ADMIN_PIN` or `VIONA_PILOT_PIN`.
3. Re-run diagnose → expect `pinStorageLooksBcrypt: true`, `pinMatchesProvidedLoginPin: true`.
4. Re-run HTTPS smoke → all `opsAudit*` **PASS** before PASS evidence commit.

### Ops ADMIN PIN rehash (`OPS_ADMIN_PIN_REHASH.1`) — 2026-05-23

**Script:** `npx tsx scripts/provision-local-ops-admin-staging.ts` — updates **existing** `Role.ADMIN` `pinCode` only (no new user).

| Step | Result |
|------|--------|
| Staging pin bcrypt rehash | **PASS** — `pinCodeFieldLength` 60, `pinStorageLooksBcrypt` true |
| Diagnose `--diagnose-ops-db` | **PASS** — `blockerClassification`: `none_local_db_ok_check_fly_runtime` |
| HTTPS `login:opsAdmin` | **PASS** @ `https://viona-api-staging-eu.fly.dev` |
| HTTPS `GET /api/local/ops/requests` | Was **404** before Fly deploy v8 — **PASS** after `FLY_DEPLOY_AND_HTTPS_SMOKE.1` |

**Not claimed:** production admin, payment dashboard, commercial readiness, settlement/payout, AI/SOS automation.

**Smoke script coverage when unblocked:** admin login; `GET /api/local/ops/requests`; `GET /api/local/ops/requests/:id`; unauthenticated 401/403; User A 403; Merchant M 403; redaction scan; list-row `REQUEST_ONLY_NO_CHARGE` + `walletPhase` NONE; read-only mutation check (`status`/`updatedAt` unchanged).

**Roster blocker:** Pilot provision script (`provision-local-pilot-accounts-staging.ts`) does **not** create ADMIN.

**No DB migration in this plan.** Implement via existing Prisma models + select projections (mirror `localUserRequestListService` / `localMerchantRequestInboxService` field discipline).

**No direct client DB access.** All data via REST on `EXPO_PUBLIC_REST_API_BASE`.

### Client service (future)

| Module (proposed) | Role |
|-------------------|------|
| `localOpsAuditApi.ts` | Typed fetch for ops list + audit-events |
| Reuse `restApiFetchJson` | Same envelope as Local user/merchant APIs |

---

## 7. UX and copy standards

| Element | Standard |
|---------|----------|
| Page title | “Local pilot ops audit (read-only)” |
| Subtitle | “Staging · no-charge · not production” |
| Confirmed rows | Tooltip: “Merchant confirmed — not a payment” |
| Empty state | Link to smoke runbook if no rows |
| Error state | No raw stack traces; no response bodies with tokens |
| Refresh | Manual refresh only in v1 (no aggressive polling — respect Fly 5 req/s; use 500ms+ pacing if batching) |

---

## 8. Implementation packs (small, sequential)

| Order | Pack ID | Deliverable | Depends on |
|-------|---------|-------------|------------|
| 1 | `OPS_AUDIT_UI.READONLY_API_AUDIT.1` | ~~`GET /api/local/ops/requests`~~ **done** (+ `GET .../:id`); tests; redaction review | None (server-only) |
| 2 | `OPS_AUDIT_UI.SCREEN_SHELL.1` | `LocalOpsAuditScreen` + components; internal nav gate; read-only wiring to ops list + audit-events | Pack 1 |
| 3 | `OPS_AUDIT_UI.PUBLIC_HTTPS_SMOKE.1` | Extend or companion script: ops list + audit-events smoke on staging HTTPS; runbook evidence row | Pack 1 |
| 4 | `OPS_AUDIT_UI.PILOT_SESSION_2_USE.1` | Ops playbook session 2 checklist includes Ops Audit UI steps; privacy-safe session log columns | Packs 2–3 |

**This plan pack (`OPS_AUDIT_UI_PLAN.1`):** docs only — no app or API changes.

---

## 9. Non-goals

- Not a production admin console or SLA-backed ops tool
- Not commercial / payment / settlement / payout readiness
- Not merchant production onboarding at scale
- Not AI autonomous actions or SOS production reliability certification
- Not native store certification unless separately tested
- Not Global Active / full commercial VIONA mode
- Not wallet ledger, Transaction deltas, or Firebase VIP bridge UI
- Not replacing paced public HTTPS smoke or manual UI walkthrough for pilot sign-off

---

## 10. Pilot session 2 operator preview (after packs 1–3)

When implemented, session 2 **optional** ops audit steps:

1. Login as staging super-admin (roster-approved).
2. Open `LocalOpsAudit` (internal build).
3. Verify banner: `REQUEST_ONLY_NO_CHARGE` / `walletPhase NONE`.
4. Confirm list shows recent pilot requests (ids only in session log).
5. Open one request → audit-events drawer → `noWalletAction: true` on events.
6. Cross-check isolation doc labels (User B / Merchant N) — no cross-tenant rows.
7. Record PASS/FAIL in session log (no secrets).

---

## 11. Validation (for future implementation packs)

| Check | When |
|-------|------|
| `git diff --check` | Every commit |
| `npx tsc --noEmit` | UI/API packs |
| `npm run lint` | UI/API packs |
| `npm run smoke` | UI/API packs |
| Ops HTTPS smoke | Pack 3 |
| Forbidden commercial wording scan | Pack 4 session log |

---

## 12. Acceptance criteria (plan only)

| # | Criterion |
|---|-----------|
| 1 | Plan approved by operator lead |
| 2 | Finance sign-off **not** required (read-only, no money mutation) |
| 3 | Super-admin staging account provisioned before Pack 1 |
| 4 | Pack 1 merged before Pack 2 UI |

**Plan acceptance for `OPS_AUDIT_UI_PLAN.1`:** this document merged @ kernel pointer; no runtime diff.

---

## 13. Pack `SCREEN_SHELL.1` (shipped)

| Item | Detail |
|------|--------|
| **Screen** | `src/screens/local/LocalOpsAuditScreen.tsx` |
| **Components** | `src/components/local/ops/*` (banner, chips, card, detail) |
| **API client** | `src/services/localOpsAuditApi.ts` — `GET` only |
| **Route** | `LocalOpsAudit` — registered only when `isAdminDebugSurfaceEnabled()` && `adminDemoMetricsEnabled` (same gate as `AdminDashboard`) |
| **Entry** | `AdminDashboard` → Local Ops Audit nav (not Home / Local consumer UI) |
| **i18n** | `local.opsAudit.*` in `en.json` / `vi.json` |
| **Next** | Complete interactive Expo attestation in `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` §5 |

---

## 14. Pack `PILOT_SESSION_2_USE.1` (evidence @ `727cc38`)

| Item | Result |
|------|--------|
| **Doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` |
| **API smoke** | **PASS** — ops list/detail/forbidden/redaction/mutation-safe |
| **Interactive Expo UI (web)** | **PASS** — `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` §5 @ 2026-05-23 |
| **Static UI audit** | **PASS** — chips, banner, GET-only client, no mutation controls, admin-only route |

---

## 15. Pack `EXPO_OPERATOR_WALKTHROUGH.1` (shipped)

| Item | Detail |
|------|--------|
| **Evidence** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` §5 |
| **Platform** | Expo web + staging HTTPS API |
| **Caveat** | Secret-tap/PIN path not exercised; deep-link + ADMIN REST login used |
| **Next** | Session 3 prep + optional native §7 — `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` |

---

## 16. Pack `NATIVE_SECRET_TAP_SPOT_CHECK.1` (evidence @ `028ea9f`)

| Item | Result |
|------|--------|
| **Preconditions probe** | **PASS** (admin debug + staging HTTPS + empty dev JWT) |
| **Native interactive** | **NOT RUN** — no device/simulator attested |
| **API corroboration** | **PASS** — public HTTPS smoke |
| **Next** | Session 2 §11.6–§11.7 — build **PASS**; native UI walkthrough **NOT COMPLETED** |

---

## 17. Pack `NATIVE_SECRET_TAP_ATTESTATION.1` (evidence @ `47e3687`)

| Item | Result |
|------|--------|
| **Device** | Android emulator connected |
| **Interactive secret-tap path** | **FAIL** — Home not reached (`ExpoLocalization` native module) |
| **Fresh dev build** | **FAIL** — Mapbox Maven resolution on `expo run:android` |
| **API smoke** | **PASS** |

---

## 18. Session 2 close + session 3 prep (`CONTROLLED_PILOT_SESSION_3.PREP.1`)

| Item | Result |
|------|--------|
| **Android build unblock** | **PASS** @ session 2 §11.6 (`85fafeb`) — Mapbox Maven + Kotlin 2.1.20 |
| **Native attestation retry** | **NOT COMPLETED** @ session 2 §11.7 (`1b91403`) — Metro/JS OK; secret-tap/PIN UI not confirmed |
| **Expo web ops UI** | **PASS** @ session 2 §5 (carried forward) |
| **Public HTTPS ops API** | **PASS** @ session 2 §9 (carried forward) |
| **Session 3 prep doc** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` |
| **Session 3 run** | **PASS** @ 2026-05-24 — public HTTPS smoke; native §7 **NOT RUN** |
| **Sessions 1–5 rollup** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` |
| **Readiness review** | `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md` — Session 5+ may proceed (API/web scope) |
| **Session 4 prep + run** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_4.md` — **PASS** @ 2026-05-24 (API); native §8 **NOT RUN** |
| **Session 5 prep + run** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_5.md` — **PASS** @ 2026-05-24 (API); native §8 **NOT RUN** |
| **Next** | Session 6+ or optional native §8 on stable device — **do not claim native PASS** until checklist complete |
