# VIONA Local no-charge — controlled pilot session 4 (prep)

**Pack:** `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_SESSION_4.PREP.1`
**Rollup (sessions 1–3):** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_3_ROLLUP.md`
**Readiness review:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_3.md` — Option A (proceed same scope)
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Prior sessions:** Sessions 1–3 **PASS**; native secret-tap/PIN **NOT COMPLETED**
**Prep master baseline:** `7f0653e` — `docs(local): review pilot readiness after sessions 1-3`
**Status:** **PREP** — session 4 run not yet executed; fill §7 evidence table on `CONTROLLED_PILOT_SESSION_4.RUN.1`

---

## Session verdict (prep)

| Layer | Carried forward (sessions 1–3) | Session 4 execution |
|-------|-------------------------------|---------------------|
| **Public HTTPS health + smoke** | **PASS** | Record at session start |
| **User A/B + Merchant M/N flows (API)** | **PASS** | Re-verify |
| **Create / confirm / decline (API)** | **PASS** | Re-verify |
| **Tenant isolation (API)** | **PASS** | Re-verify |
| **Ops admin login + ops list/detail (API)** | **PASS** | Re-verify |
| **Non-admin ops access rejected** | **PASS** | Re-verify |
| **Redaction + mutation safety (API)** | **PASS** | Re-verify |
| **No-charge money law** | **PASS** (invariant) | Re-verify |
| **Ops Audit UI (Expo web)** | **PASS** @ session 2 §5 | Optional re-run; not required if API corroborates |
| **Native secret-tap / PIN / Ops Audit UI** | **NOT COMPLETED** | **NOT RUN** default until §8 checklist done |
| **Pause triggered** | **No** (sessions 1–3) | TBD |
| **Overall session 4** | — | **PENDING RUN** |

**Money law (unchanged):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; `paymentCaptured` **false**; **confirmed does not mean paid**. Whole VIONA: pre-commercial / staging-pilot foundation. **Global Active / full commercial: not yet.**

---

## 1. Purpose

| Goal | Detail |
|------|--------|
| **What** | Continue controlled **no-charge** Local pilot on **public HTTPS** staging — same scope as sessions 1–3 per readiness review Option A |
| **Why session 4** | Fresh operator evidence after post–sessions 1–3 readiness review; repeat API gates + Ops Audit corroboration |
| **Out of scope** | Payment capture, payout, settlement, production admin, commercial launch, AI/SOS automation, native production claims without §8 completion |

---

## 2. Session 4 scope (Option A)

| Constraint | Requirement |
|------------|-------------|
| **Money** | Same controlled **no-charge** request-only pilot — `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE** |
| **Participants** | **Limited** approved internal roster only — no new accounts without ops approval |
| **API** | **Public HTTPS** — `https://viona-api-staging-eu.fly.dev` |
| **Ops** | **Ops Audit active** — read-only ADMIN list/detail; smoke + role gates each session |
| **Native** | **No native PASS** unless §8 checklist completed on stable device in a separate attestation record |
| **Claims** | **No** production, payment, settlement, Global Active, or commercial readiness wording |

---

## 3. Preconditions (start session 4 run only if all PASS)

| # | Criterion | Carried forward | Session 4 check |
|---|-----------|-----------------|-----------------|
| 1 | `master` / `origin` ≥ `7f0653e` | **PASS** | Record hash at session start |
| 2 | Readiness review Option A acknowledged | **PASS** @ `7f0653e` | Operator read review + this doc |
| 3 | `EXPO_PUBLIC_REST_API_BASE` → `https://viona-api-staging-eu.fly.dev` | **PASS** | Probe length/domain only |
| 4 | `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** | Length 0 only |
| 5 | Public HTTPS smoke exit 0 | **PASS** @ session 3 | `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` |
| 6 | `GET /health` → 200 | **PASS** | Same base URL |
| 7 | Ops roster `Role.ADMIN` configured (not logged) | **PASS** | `VIONA_PILOT_OPS_ADMIN_PHONE` + PIN env |
| 8 | `.env.local` not committed | **Yes** | — |
| 9 | Pilot participants approved (limited roster) | **PASS** | No new accounts without ops approval |
| 10 | Native secret-tap | **NOT COMPLETED** | Not a blocker for API/web session 4 |

---

## 4. Proven gates (carry forward — re-verify each session 4 run)

Re-run public HTTPS smoke and record PASS/FAIL. Any **FAIL** triggers §6 pause.

| Gate | Requirement | Prior reference |
|------|-------------|-----------------|
| **Health** | `GET /health` HTTP 200 | Session 3 §11 |
| **User A login** | `POST /api/auth/login` | Session 2 §9 |
| **User B login** | `POST /api/auth/login` | Session 2 §9 |
| **Merchant M login** | `POST /api/auth/login` | Session 2 §9 |
| **Merchant N login** | `POST /api/auth/login` | Session 2 §9 |
| **Create** | User A creates Local request HTTP 201 | Session 3 §11 |
| **Merchant inbox** | Merchant M inbox visible | Session 3 §11 |
| **Confirm** | Merchant M confirm HTTP 200 | Session 3 §11 |
| **Decline** | Merchant M decline HTTP 200 | Session 3 §11 |
| **Tenant — user** | User B isolation | Session 3 §11 |
| **Tenant — merchant** | Merchant N isolation | Session 3 §11 |
| **Ops admin login** | `Role.ADMIN`; no dev JWT | Session 2 §9 |
| **Ops audit list** | `GET /api/local/ops/requests` HTTP 200 | Session 3 §11.4 |
| **Ops audit detail** | `GET /api/local/ops/requests/:id` HTTP 200 | Session 3 §11.4 |
| **Non-admin ops denied** | Unauthed 401; B2C/merchant 403 | Session 3 §11.4 |
| **Redaction** | `assertOpsResponseRedacted` | Session 2 §9 |
| **Mutation safety** | `opsAuditMutationSafe`; no ops UI mutation controls | Session 2 §5 + §9 |
| **No-charge safety** | `walletMode` `REQUEST_ONLY_NO_CHARGE`; `walletPhase` `NONE`; `paymentCaptured` false | Session 3 §11.3 |

**Smoke command (required at session start):**

```bash
node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev
```

---

## 5. Money safety (carry forward)

| Invariant | Requirement |
|-----------|-------------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | **NONE** |
| `paymentCaptured` | **false** |
| Confirmed ≠ paid | API `safety` + UI copy — no “paid booking” implication |
| Forbidden rails | No hold, debit, refund, settlement, payout, cash-out, escrow in pilot actions |

---

## 6. Pause criteria (immediate stop)

**Pause session 4** and follow playbook §8 if **any** occur:

| # | Trigger |
|---|---------|
| 1 | **Payment captured** or wallet balance change tied to Local pilot actions |
| 2 | **`walletPhase` not `NONE`** on new Local requests |
| 3 | **`walletMode` not `REQUEST_ONLY_NO_CHARGE`** on new Local requests |
| 4 | **`paymentCaptured` true** on pilot Local rows |
| 5 | **Tenant isolation failure** — User B sees User A private data, or Merchant N sees/acts on Business M rows |
| 6 | **Non-admin ops access** — unauthenticated or B2C/merchant role receives ops list/detail HTTP 200 |
| 7 | **Redaction leak** — JWT, PIN, `DATABASE_URL`, or raw roster phone in UI, logs committed to git, or smoke redaction failure |
| 8 | **Ops mutation** — confirm, reject, cancel, refund, payout, settlement, or wallet adjustment from Ops Audit UI or ops API beyond read-only |
| 9 | **Forbidden commercial/payment wording** on Local or Ops Audit surfaces |
| 10 | **Public HTTPS smoke failure** — exit non-zero after session start (investigate; pause if repeated or unexplained) |

**Do not** fix forward with payment, wallet, DB migration, or production admin claims under pilot pressure.

---

## 7. Session 4 evidence table (template — fill on RUN)

| Field | Value |
|-------|--------|
| **Date / timestamp (UTC)** | |
| **Operator** | initials only |
| **master / origin @ start** | |
| **Platform** | e.g. public HTTPS smoke · Expo web · Android `com.ketnoiglobal.app` |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Dev JWT empty** | PASS / FAIL |
| **Public HTTPS smoke** | PASS / FAIL (exit code) |
| **User flows (A/B)** | PASS / FAIL |
| **Merchant flows (M/N)** | PASS / FAIL |
| **Create / confirm / decline** | PASS / FAIL |
| **Tenant isolation** | PASS / FAIL |
| **Ops admin login** | PASS / FAIL |
| **Ops audit list** | PASS / FAIL |
| **Ops audit detail** | PASS / FAIL |
| **Ops audit visibility** | Expo web PASS/FAIL/NOT RUN · Native PASS/FAIL/NOT RUN |
| **Non-admin ops denied** | PASS / FAIL |
| **Redaction** | PASS / FAIL |
| **Mutation safety** | PASS / FAIL |
| **No-charge safety** | `REQUEST_ONLY_NO_CHARGE` / `walletPhase NONE` / `paymentCaptured false` — PASS / FAIL |
| **Native status** | **NOT RUN** (default) / PASS / FAIL — see §8 |
| **Issues found** | privacy-safe summary |
| **Pause decision** | **Yes** / **No** |

**Request ids (non-secret, if created this session):**

- Create:
- Confirm:
- Decline:
- Ops detail:

---

## 8. Known limitation — native secret-tap (do not claim PASS)

| Item | Status |
|------|--------|
| **Android dev client build** | **PASS** @ session 2 §11.6 — `com.ketnoiglobal.app` |
| **Secret-tap ×5 → PIN → Admin → Local Ops Audit (native UI)** | **NOT COMPLETED** |
| **Expo web ops UI** | **PASS** @ session 2 §5 — valid for API/web session 4; not a substitute for native §8 checklist |

**Rules for session 4:**

- **Do not** mark native secret-tap/PIN as **PASS** without completing the checklist below on a **stable** device (physical device preferred).
- **Do not** substitute Expo web walkthrough for native PASS.
- API + Expo web evidence **remain valid** while native UI is incomplete.

### 8.1 Native attestation checklist (optional — separate from API smoke)

| Check | PASS/FAIL | Notes |
|-------|-----------|-------|
| Home loads on `com.ketnoiglobal.app` | | |
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

Metro admin-debug overrides are **session-only** (not committed). Do not log PIN/JWT/phone.

---

## 9. Explicit limitations (session 4)

- **Not** production launch or production admin certification
- **Not** commercial / payment readiness or payment dashboard
- **Not** settlement, payout, escrow, or wallet ledger operations
- **Not** AI autonomous actions or SOS production reliability
- **Not** Global Active / full commercial VIONA mode
- **Not** open public merchant onboarding at scale
- **Not** native production confidence until §8 checklist **PASS** on stable device

---

## 10. Validation (docs commits for this prep pack)

| Check | Prep @ commit |
|-------|---------------|
| `git diff --check` | Required PASS |
| `npx tsc --noEmit` | Required PASS |
| `npm run lint` | Required PASS |
| `npm run smoke` | Required PASS |

Session 4 **run** additionally requires `smoke-public-staging-api.mjs` exit 0 recorded in §7.

---

## 11. Follow-up after session 4 prep

1. Execute `CONTROLLED_PILOT_SESSION_4.RUN.1` — smoke + fill §7 evidence table.
2. Update session verdict table at top of this doc with PASS/FAIL and date.
3. Optional parallel: native §8 on stable device (does not block API-only Option A).
4. **Locked:** payment/wallet/commercial packs without finance approval.

---

## 12. Related documents

| Doc | Role |
|-----|------|
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_3_ROLLUP.md` | Sessions 1–3 aggregate |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_3.md` | Option A decision |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` | Latest API run evidence |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Daily ops + pause + session index |
