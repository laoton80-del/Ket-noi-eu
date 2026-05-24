# VIONA Local no-charge — controlled pilot operations playbook

**Pack:** `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_OPS_PLAYBOOK.1`
**Master / origin baseline:** `8e9859a` or later
**Date:** 2026-05-23
**Classification:** `READY_FOR_CONTROLLED_NO_CHARGE_PILOT` (Local / public HTTPS web only)
**Sign-off:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md`

---

## 1. Pilot purpose

| Goal | Detail |
|------|--------|
| **What** | Controlled **no-charge** pilot for **Local request-only** workflow on **public HTTPS** staging API |
| **Who** | **Limited** approved pilot users/merchants only — not open public |
| **Why** | Validate real operator sessions: login, requests, merchant inbox, confirm/decline, isolation, EN/VI responsive UI |
| **Out of scope** | Payment capture, payout, settlement, escrow, commercial launch, production SLA |

**Money law (always):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; **confirmed does not mean paid**.

---

## 2. Entry criteria (start session only if all PASS)

| # | Criterion |
|---|-----------|
| 1 | `master` / `origin` ≥ `8e9859a` (kernel + sign-off synced) |
| 2 | Public HTTPS smoke **PASS** — `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` |
| 3 | Public HTTPS REST UI operator **PASS** — `VIONA_PUBLIC_HTTPS_REST_UI_WALKTHROUGH.md` |
| 4 | Device matrix **8/8 PASS** — `VIONA_PUBLIC_HTTPS_LOCAL_NO_CHARGE_DEVICE_MATRIX.md` |
| 5 | Pilot participants **approved manually** (names/roles on internal roster — not in public git) |
| 6 | Operator has read sign-off + this playbook |
| 7 | `.env.local` **not committed** |
| 8 | `EXPO_PUBLIC_REST_API_BASE` = `https://viona-api-staging-eu.fly.dev` |
| 9 | `EXPO_PUBLIC_DEV_REST_JWT` **empty** |
| 10 | `npx expo start -c` after any env change |

---

## 3. Pilot participants

### Allowed types

| Type | Role | Staging pilot pattern (labels only) |
|------|------|-------------------------------------|
| **B2C pilot user** | Requester | User A / User B style — phone + PIN login |
| **B2B pilot merchant** | Inbox owner | Merchant M / Merchant N style — business-scoped inbox |

### Not allowed in this pilot

- Open public self-registration or production merchant onboarding
- Unapproved accounts on staging
- Tourism/wallet commercial flows as part of Local pilot evidence
- SOS production dispatch claims

**Provisioning:** Use existing staging pilot accounts per `scripts/provision-local-pilot-accounts-staging.ts` runbook; add participants only via explicit ops approval.

---

## 4. Daily operator checklist

Run at **start** of each pilot session (and after any Fly deploy):

| Step | Action | Record |
|------|--------|--------|
| 1 | Paced HTTPS smoke (exit 0) | Date, operator initials |
| 2 | `GET https://viona-api-staging-eu.fly.dev/health` → 200 | PASS/FAIL |
| 3 | Confirm `EXPO_PUBLIC_DEV_REST_JWT` empty (length check only) | PASS/FAIL |
| 4 | Expo: `npx expo start -c` | Started Y/N |
| 5 | Spot-check: new Local rows `walletMode` / `walletPhase` | NONE only |
| 6 | User A: login → My Requests → logout | PASS/FAIL |
| 7 | User B: login → no User A overlap → logout | PASS/FAIL |
| 8 | Merchant M: inbox → confirm one → decline one → logout | PASS/FAIL |
| 9 | Merchant N: inbox → no Business M → logout | PASS/FAIL |
| 10 | Scan Local UI for forbidden commercial terms | PASS/FAIL |
| 11 | File session log (privacy-safe table below) | Done |

**Session log template (privacy-safe):**

| Field | Example |
|-------|---------|
| Date | 2026-05-23 |
| Operator | initials only |
| Viewport / lang | 390×844 EN |
| Smoke | PASS |
| User A/B/M/N flows | PASS / FAIL + step |
| Issues | HTTP status, screen name — no secrets |
| Payment observed | No |

---

## 5. Incident / pause criteria

**Pause pilot immediately** and follow §8 rollback if any occur:

| # | Trigger |
|---|---------|
| 1 | Payment captured or wallet balance change tied to Local pilot actions |
| 2 | `walletPhase` ≠ `NONE` on new Local requests |
| 3 | `walletMode` ≠ `REQUEST_ONLY_NO_CHARGE` on new Local requests |
| 4 | User B sees User A **private** request data |
| 5 | Merchant N sees or can act on **Business M** rows |
| 6 | Forbidden commercial wording on Local surfaces (paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out) |
| 6b | **Non-admin ops access** — B2C/merchant/unauthenticated receives ops list/detail HTTP 200 |
| 6c | **Redaction leak** — JWT, PIN, `DATABASE_URL`, or raw phone in UI or committed logs |
| 6d | **Mutation from ops UI** — confirm, reject, cancel, refund, payout, settlement, or wallet adjustment from Ops Audit screen |
| 7 | Public HTTPS smoke **fails** twice in a row (after deploy or config change) |
| 8 | Fly app unhealthy / repeated 5xx on `/health` or login |
| 9 | Auth/login regression (PIN login broken for all pilot accounts) |
| 10 | Unexpected SOS dispatch, AI money action, or payment UI on Local path |

**Do not** “fix forward” with payment, wallet, or migration changes without explicit approved pack.

---

## 6. Privacy-safe evidence rules

| Rule | Detail |
|------|--------|
| **Never commit** | JWT, PIN, `DATABASE_URL`, `.env.local`, full phone numbers in public repos |
| **Pilot phones in docs** | Only pre-approved E.164 labels in runbooks (already published); do not add new PII |
| **Screenshots** | Redact tokens, PIN fields, auth headers, full request bodies with PII |
| **Logs** | Summarize: HTTP status, endpoint path, request id (UUID), role label, viewport |
| **Tickets** | Use internal template; attach redacted screenshots only |
| **Evidence tables** | PASS/FAIL per flow; no secret columns |

---

## 7. Support path

| Level | Action |
|-------|--------|
| **L0 — Operator** | Re-run smoke; verify env; retry login; note viewport/lang/step |
| **L1 — Triage** | Classify: auth / isolation / UI / rate-limit / Fly ops; capture non-secret log summary |
| **L2 — Engineering** | Open Cursor pack with: master hash, smoke output (redacted), Fly status, pause criteria hit |
| **L3 — Escalation** | Pause pilot; rollback per §8; do not merge wallet/payment fixes under pilot pressure |

**Non-secret logs to collect:**

- `fly status --app viona-api-staging-eu` (no secrets)
- Smoke script exit code + stage labels (script redacts tokens)
- Browser network: status codes only for `/api/auth/login`, `/api/local/*`
- App version: `master` commit hash

**Escalation pack naming:** `VIONA.LOCAL.NO_CHARGE.PILOT.INCIDENT.<short-topic>.1`

---

## 8. Rollback

| Step | Action |
|------|--------|
| 1 | **Pause pilot** — notify participants |
| 2 | Set `EXPO_PUBLIC_REST_API_BASE` → `http://127.0.0.1:8787` in `.env.local` (not committed) |
| 3 | `npx expo start -c` |
| 4 | Optional: `fly scale count 0 --app viona-api-staging-eu` to stop public HTTPS |
| 5 | **Do not** run Prisma migrations for rollback |
| 6 | **Do not** delete staging evidence docs or DB rows |
| 7 | **Do not** change wallet/payment code under panic |
| 8 | Record rollback reason in internal session log (privacy-safe) |

Staging DB remains source of truth; rollback is **access/config**, not data destruction.

---

## 9. Explicit non-goals

- Not production launch
- Not commercial / payment readiness
- Not merchant production onboarding at scale
- Not AI autonomous money actions
- Not SOS production reliability or emergency dispatch certification
- Not native iOS/Android App Store certification unless separately tested and recorded
- Not Global Active / full commercial VIONA mode

---

## 10. Next after pilot sessions

| Priority | Item |
|----------|------|
| 1 | **Session 3** — operator execution per `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` (prep @ `1b91403+`) |
| 2 | Aggregate **pilot session evidence** (privacy-safe logs per §4) |
| 3 | Session 2 evidence complete — `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` (user/merchant + ops; native secret-tap **NOT COMPLETED**) |
| 4 | Optional: native §7 secret-tap on stable device (`com.ketnoiglobal.app`) — do not claim PASS until checklist done |
| 5 | Refine support/incident playbook from real issues |
| 6 | **Locked:** finance-approved payment/wallet ledger, settlement, payout — separate architecture packs only |

---

## Pilot sessions index

**Rollup (sessions 1–4):** `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` @ `0729e16+`
**Readiness review (post 1–4):** `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md` — Session 5+ **may proceed** (same scope)

| Session | Doc | Verdict |
|---------|-----|---------|
| **1** (API + UI) | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_1.md` | **PASS** — API @ `fece42c`; UI @ `4c26830`; **no pause** |
| **2** (user/merchant + ops) | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` | **PASS** — user/merchant/ops API @ `028ea9f`; Expo ops UI @ `21ec3ec`; **no pause** |
| **2b** (native ops secret-tap) | Same doc §11.5–§11.7 | **NOT COMPLETED** — build unblock §11.6 **PASS**; secret-tap UI **FAIL** on emulator (§11.7) |
| **3** (prep + run) | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` | **PASS** — user/merchant/ops API @ 2026-05-24; native §7 **NOT RUN** |
| **4** (prep + run) | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_4.md` | **PASS** — user/merchant/ops API @ 2026-05-24; native §8 **NOT RUN** |

---

## Quick reference

| Item | Value |
|------|--------|
| Public API | `https://viona-api-staging-eu.fly.dev` |
| Smoke | `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` |
| Expo | `npx expo start -c` |
| Sign-off | `VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` |
| Deploy evidence | `VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` |
| Kernel | `VIONA_PROJECT_KERNEL.md` §6 |
| Ops audit UI plan | `VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md` |
| Ops audit API (read-only list) | `GET /api/local/ops/requests` — `Role.ADMIN`; test: `test-local-ops-request-list-api-1.ts` |
| Ops audit HTTPS smoke | **PASS** — latest paced smoke; see `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` |
| Ops audit UI session 2 | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` |
| Sessions 1–4 rollup | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` |
| Ops ADMIN PIN rehash | `npx tsx scripts/provision-local-ops-admin-staging.ts` (staging only) |
