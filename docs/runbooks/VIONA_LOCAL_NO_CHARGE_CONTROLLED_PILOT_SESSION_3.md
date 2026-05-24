# VIONA Local no-charge — controlled pilot session 3 (prep)

**Pack:** `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_SESSION_3.PREP.1` · `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_SESSION_3.RUN.1`
**Rollup (sessions 1–4):** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Prior sessions:** Session 1 @ `4c26830` (API + UI) · Session 2 @ `1b91403` (user/merchant + ops API + Expo ops UI; native secret-tap **NOT COMPLETED**)
**Run master baseline:** `c1514e2`
**Status:** **PASS** (public HTTPS API) @ 2026-05-24 — see §11. Native §7 **NOT RUN**.

---

## Session verdict

| Layer | Result |
|-------|--------|
| **Public HTTPS health + smoke** | **PASS** @ 2026-05-24 — §11 |
| **User A/B + Merchant M/N flows (API)** | **PASS** |
| **Create / confirm / decline (API)** | **PASS** |
| **Tenant isolation (API)** | **PASS** |
| **Ops admin login + ops list/detail (API)** | **PASS** |
| **Non-admin ops access rejected** | **PASS** — 401 unauthed; B2C/merchant HTTP 403 |
| **Redaction + mutation safety (API)** | **PASS** |
| **No-charge money law** | **PASS** — `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; `paymentCaptured` **false** |
| **Ops Audit UI (Expo web)** | **PASS** (carried forward @ session 2 §5 — not re-run) |
| **Native secret-tap / PIN / Ops Audit UI** | **NOT RUN** @ §7 |
| **Pause triggered** | **No** |
| **Overall controlled pilot session 3** | **PASS** (staging / public HTTPS — user, merchant, ops read-only API) |

**Money law (unchanged):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; `paymentCaptured` **false**; **confirmed does not mean paid**. Whole VIONA: pre-commercial / staging-pilot foundation. **Global Active / full commercial: not yet.**

---

## Session verdict (prep — superseded by run above)

| Layer | Carried forward | Session 3 execution |
|-------|-----------------|---------------------|
| **Public HTTPS health + smoke** | **PASS** @ session 2 | **PASS** @ §11 |
| **User A/B + Merchant M/N flows (API)** | **PASS** @ session 2 §9 | **PASS** |
| **Ops admin login + ops list/detail (API)** | **PASS** @ session 2 | **PASS** |
| **Ops Audit UI (Expo web)** | **PASS** @ session 2 §5 | Not re-run (carried forward) |
| **Ops read-only / redaction / mutation safety (API)** | **PASS** @ session 2 | **PASS** |
| **No-charge money law** | **PASS** (invariant) | **PASS** |
| **Android dev client build** | **PASS** @ session 2 §11.6 | Not re-tested this run |
| **Native secret-tap / PIN / Ops Audit UI** | **NOT COMPLETED** @ session 2 §11.7 | **NOT RUN** @ §7 |
| **Pause triggered** | **No** (sessions 1–2) | **No** |
| **Overall session 3** | — | **PASS** (API) |

## 1. Purpose

| Goal | Detail |
|------|--------|
| **What** | Continue controlled **no-charge** Local pilot on **public HTTPS** staging with proven API gates + Ops Audit visibility |
| **Why session 3** | Fresh operator evidence after Android dev-client unblock; optional user/merchant re-check; ops audit corroboration |
| **Out of scope** | Payment capture, payout, settlement, production admin, commercial launch, AI/SOS automation, native UI automation packs |

---

## 2. Preconditions (start session 3 only if all PASS)

| # | Criterion | Carried forward | Session 3 check |
|---|-----------|-----------------|-----------------|
| 1 | `master` / `origin` ≥ `1b91403` | **PASS** | Record hash at session start |
| 2 | `EXPO_PUBLIC_REST_API_BASE` → `https://viona-api-staging-eu.fly.dev` | **PASS** | Probe length/domain only |
| 3 | `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** | Length 0 only |
| 4 | Public HTTPS smoke exit 0 | **PASS** @ session 2 | `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` |
| 5 | `GET /health` → 200 | **PASS** @ session 2 | Same base URL |
| 6 | Ops roster `Role.ADMIN` configured (not logged) | **PASS** | `VIONA_PILOT_OPS_ADMIN_PHONE` + PIN env |
| 7 | `.env.local` not committed | **Yes** | — |
| 8 | Pilot participants approved (internal roster) | **PASS** | No new accounts without ops approval |
| 9 | Operator read playbook + this doc | Required | — |
| 10 | Native secret-tap | **NOT COMPLETED** | See §5 — not a blocker for API/web session 3 |

---

## 3. Proven gates (carry forward — re-verify each session 3 run)

Re-run public HTTPS smoke and record PASS/FAIL. These gates were **PASS** at session 2; any **FAIL** triggers §4 pause.

| Gate | Requirement | Session 2 reference |
|------|-------------|---------------------|
| **Health** | `GET /health` HTTP 200 | §9 step 1 |
| **User A login** | `POST /api/auth/login` | §9 step 2 |
| **User B login** | `POST /api/auth/login` | §9 step 3 |
| **Merchant M login** | `POST /api/auth/login` | §9 step 4 |
| **Merchant N login** | `POST /api/auth/login` | §9 step 5 |
| **Create** | User A creates Local request HTTP 201 | §9 step 6 |
| **Tenant — user** | User B isolation | §9 step 7 |
| **Merchant M inbox** | Inbox visible for M | §9 step 8 |
| **Tenant — merchant** | Merchant N isolation | §9 step 9 |
| **Confirm** | Merchant M confirm HTTP 200 | §9 step 10 |
| **Decline** | Merchant M decline HTTP 200 | §9 step 11 |
| **Ops admin login** | `Role.ADMIN`; no dev JWT | §9 + §11.7 API |
| **Ops audit list** | `GET /api/local/ops/requests` HTTP 200 | §9.4 `opsAuditList` |
| **Ops audit detail** | `GET /api/local/ops/requests/:id` HTTP 200 | §9.4 `opsAuditDetail` |
| **Ops forbidden** | B2C + merchant GET ops → 403 | §9.4 |
| **Redaction** | `assertOpsResponseRedacted` | §9 step 16 |
| **Mutation safety** | `opsAuditMutationSafe`; no ops UI mutation controls | §9 steps 17–18; §5 UI |
| **No-charge safety** | `walletMode` `REQUEST_ONLY_NO_CHARGE`; `walletPhase` `NONE`; `paymentCaptured` false | §9.3 |

**Smoke command (required at session start):**

```bash
node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev
```

---

## 4. Pause criteria (immediate stop)

**Pause session 3** and follow playbook §8 rollback if **any** occur:

| # | Trigger |
|---|---------|
| 1 | **Payment captured** or wallet balance change tied to Local pilot actions |
| 2 | **`walletPhase` not `NONE`** on new Local requests |
| 3 | **`walletMode` not `REQUEST_ONLY_NO_CHARGE`** on new Local requests |
| 4 | **`paymentCaptured` true** on pilot Local rows |
| 5 | **Tenant isolation failure** — User B sees User A private data, or Merchant N sees/acts on Business M rows |
| 6 | **Non-admin ops access** — unauthenticated or B2C/merchant role receives ops list/detail HTTP 200 |
| 7 | **Redaction leak** — JWT, PIN, `DATABASE_URL`, or raw roster phone in UI, logs committed to git, or smoke redaction failure |
| 8 | **Mutation from ops UI** — confirm, reject, cancel, refund, payout, settlement, or wallet adjustment controls visible or successful from Ops Audit screen |
| 9 | **Forbidden commercial wording** on Local or Ops Audit surfaces (paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out) |
| 10 | Public HTTPS smoke **fails twice in a row** after deploy or config change |
| 11 | Fly app unhealthy / repeated 5xx on `/health` or login |
| 12 | Unexpected SOS dispatch, AI money action, or payment UI on Local path |

**Do not** fix forward with payment, wallet, DB migration, or production admin claims under pilot pressure.

---

## 5. Known limitation — native secret-tap (do not claim PASS)

| Item | Status |
|------|--------|
| **Session 2 §11.3 checklist** | **NOT COMPLETED** on emulator |
| **Session 2 §11.6** | Android build **PASS** — `com.ketnoiglobal.app` |
| **Session 2 §11.7** | Metro/JS launch **PASS**; secret-tap/PIN UI **FAIL**; Ops Audit screen UI **NOT RUN** |
| **Root cause (emulator)** | `uiautomator` hangs/timeouts; `adb` offline; not an ops API defect |
| **Expo web ops UI** | **PASS** @ session 2 §5 (deep-link + ADMIN REST; secret-tap not substituted) |

**Rules for session 3:**

- **Do not** mark native secret-tap/PIN as **PASS** without completing §7 on a **stable** device (physical device preferred over unstable emulator).
- **Do not** substitute Expo web walkthrough for native §7 PASS.
- API + Expo web evidence **remain valid** while native UI is incomplete.

---

## 6. Session 3 evidence table (`CONTROLLED_PILOT_SESSION_3.RUN.1`) — 2026-05-24

| Field | Value |
|-------|--------|
| **Date** | 2026-05-24 (UTC) |
| **Operator** | automated smoke (no initials) |
| **master / origin @ start** | `c1514e2` |
| **Platform / device** | Public HTTPS API — `node scripts/smoke-public-staging-api.mjs` |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Dev JWT empty** | **PASS** (length 0) |
| **Public HTTPS smoke** | **PASS** (exit 0) |
| **Health** | **PASS** — HTTP 200 |
| **User A/B flows** | **PASS** |
| **Merchant M/N flows** | **PASS** |
| **Create / confirm / decline** | **PASS** |
| **Tenant isolation** | **PASS** — user B + merchant N |
| **Ops admin login** | **PASS** — `Role.ADMIN`; no dev JWT |
| **Ops audit list** | **PASS** |
| **Ops audit detail** | **PASS** |
| **Non-admin ops access** | **PASS** — unauthed HTTP 401; User A + Merchant M HTTP 403 |
| **No-charge safety** | **PASS** — see §11.3 |
| **Redaction** | **PASS** — smoke redaction checks |
| **Mutation safety (API)** | **PASS** — `opsAuditMutationSafe` |
| **Ops audit visibility (UI)** | Expo web **NOT RUN** (carried forward session 2 §5 **PASS**) · Native **NOT RUN** |
| **Forbidden commercial wording** | **NOT SCANNED** (API pack only) |
| **Native secret-tap §7** | **NOT RUN** |
| **Issues found** | None blocking |
| **Pause decision** | **No** |

**Request ids (this run, non-secret):**

- Confirm target: `58d8d3c3-eeb6-433b-ab91-f827dce1995a`
- Decline target: `2105a85f-16df-4875-9bf4-bf449ade1742`
- Ops detail opened: `2105a85f-16df-4875-9bf4-bf449ade1742` (declined row)

---

## 6b. Session 3 evidence table (template — superseded by §6)

| Field | Value |
|-------|--------|
| **Date** | |
| **Operator** | initials only |
| **master / origin @ start** | |
| **Platform / device** | e.g. public HTTPS smoke only · Expo web · Android `com.ketnoiglobal.app` |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Dev JWT empty** | PASS / FAIL |
| **Public HTTPS smoke** | PASS / FAIL (exit code) |
| **User A/B flows** | PASS / FAIL |
| **Merchant M/N flows** | PASS / FAIL |
| **Create / confirm / decline** | PASS / FAIL |
| **Tenant isolation** | PASS / FAIL |
| **Ops admin login** | PASS / FAIL |
| **Ops audit list** | PASS / FAIL |
| **Ops audit detail** | PASS / FAIL |
| **Ops audit visibility (UI)** | Expo web PASS/FAIL/NOT RUN · Native PASS/FAIL/NOT RUN |
| **No-charge safety** | `REQUEST_ONLY_NO_CHARGE` / `walletPhase NONE` / `paymentCaptured false` — PASS / FAIL |
| **Redaction** | PASS / FAIL |
| **Mutation safety (ops UI)** | PASS / FAIL |
| **Forbidden commercial wording** | PASS / FAIL / NOT SCANNED |
| **Native secret-tap §7** | PASS / FAIL / **NOT RUN** (default: NOT RUN until proven) |
| **Issues found** | privacy-safe summary |
| **Pause decision** | **Yes** / **No** |

**Request ids (non-secret, if created this session):**

- Create:
- Confirm:
- Decline:
- Ops detail:

---

## 7. Native secret-tap attestation (optional — §11.3 template)

Complete only when `npx expo start -c` reaches Home on `com.ketnoiglobal.app` without redbox. Use Metro **session** admin-debug overrides (not committed). Do not log PIN/JWT/phone.

| Check | PASS/FAIL | Notes |
|-------|-----------|-------|
| Home loads | | |
| Local tab — no Ops Audit | | |
| Secret-tap ×5 → PIN modal | | |
| PIN → Grand Admin Dashboard | | |
| Local Ops Audit row visible | | |
| Ops Audit list loads (HTTPS) | | |
| Ops Audit detail | | |
| Safety chips (4) | | |
| Limitation banner (4 themes) | | |
| No mutation controls | | |
| Consumer nav cannot reach Ops Audit | | |
| Redaction (no phone/PIN/JWT on screen) | | |

**Android operator notes (from session 2 §11.6):** `npx expo prebuild -p android` after clone; if Gradle `GradleWorkerMain` errors, use fresh `GRADLE_USER_HOME` or `cmd package compile -m speed com.ketnoiglobal.app`.

---

## 8. Explicit limitations (session 3)

- **Not** production launch or production admin certification
- **Not** commercial / payment readiness or payment dashboard
- **Not** settlement, payout, escrow, or wallet ledger operations
- **Not** AI autonomous actions or SOS production reliability
- **Not** Global Active / full commercial VIONA mode
- **Not** open public onboarding or merchant production scale

---

## 9. Validation (docs commits)

| Check | Session 3 run |
|-------|---------------|
| `git diff --check` | PASS @ commit |
| `npx tsc --noEmit` | PASS @ commit |
| `npm run lint` | PASS @ commit |
| `npm run smoke` | PASS @ commit |
| `smoke-public-staging-api.mjs` | PASS exit 0 @ §11 |

---

## 11. User / merchant + ops visibility (`CONTROLLED_PILOT_SESSION_3.RUN.1`) — 2026-05-24

### 11.1 Environment

| Field | Value |
|-------|--------|
| **Platform** | Public HTTPS API — paced smoke |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Dev JWT** | Empty (probe: length 0) |
| **Ops UI** | Not re-run; corroborated via session 2 Expo web **PASS** + API ops stages below |

### 11.2 Flow results

| Step | Requirement | Result |
|------|-------------|--------|
| 1 | Health check | **PASS** — HTTP 200 |
| 2 | User A login | **PASS** |
| 3 | User B login | **PASS** |
| 4 | Merchant M login | **PASS** |
| 5 | Merchant N login | **PASS** |
| 6 | User A creates Local request | **PASS** — HTTP 201 (`local:create`) |
| 7 | User B isolation | **PASS** |
| 8 | Merchant M inbox | **PASS** |
| 9 | Merchant N isolation | **PASS** |
| 10 | Merchant M confirm | **PASS** — HTTP 200 |
| 11 | Merchant M decline | **PASS** — HTTP 200 |
| 12 | Ops ADMIN login | **PASS** — `Role.ADMIN` |
| 13 | Ops audit list | **PASS** — `ops:listRequests` HTTP 200 |
| 14 | Ops audit detail | **PASS** — `ops:detailRequest` HTTP 200 |
| 15 | Non-admin ops rejected | **PASS** — unauthed HTTP 401; User A + Merchant M HTTP 403 |
| 16 | Redaction | **PASS** |
| 17 | Mutation safety | **PASS** — `opsAuditMutationSafe` |
| 18 | No-charge safety | **PASS** — see §11.3 |

### 11.3 Money law (smoke snapshot)

| Field | Value |
|-------|--------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| `paymentCaptured` | `false` |
| Confirmed ≠ paid | Enforced in ops list `safety` + session 2 UI copy |

### 11.4 Ops audit stages (same smoke run)

| Stage | Result |
|-------|--------|
| `opsAuditUnauthed` | **PASS** — HTTP 401 |
| `opsAuditList` | **PASS** |
| `opsAuditDetail` | **PASS** |
| `opsAuditForbiddenB2c` | **PASS** — HTTP 403 |
| `opsAuditForbiddenMerchant` | **PASS** — HTTP 403 |
| `opsAuditMutationSafe` | **PASS** |

### 11.5 Issues / pause

| Item | Detail |
|------|--------|
| **Issues found** | None blocking |
| **Pause decision** | **No** |

---

## 10. Follow-up after session 3 run

1. Optional: complete §7 native attestation on stable device — only then update session verdict for native PASS.
2. **Locked:** payment/wallet/commercial packs without finance approval.
