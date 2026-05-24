# VIONA Local no-charge pilot readiness handoff — 1

**Pack:** `VIONA.LOCAL.NO_CHARGE_PILOT_READINESS_HANDOFF.1` (+ `VIONA.LOCAL.NO_CHARGE.PILOT_SIGNOFF.1`)
**Branch:** `pack-local-no-charge-pilot-readiness-handoff-1`
**Master tested:** `f87e053` (original handoff); **sign-off @ `5a714a8`**
**Date:** 2026-05-21 (handoff); **2026-05-23** (public HTTPS sign-off)
**Type:** Handoff / readiness summary only (no product, schema, or wallet changes)

**Master wave roadmap:** `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` — Global Active path in 12 waves; **not** commercial yet.
**Wave 1 exit criteria:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` — **met** @ `9619886`.

---

## Final sign-off — public HTTPS no-charge pilot (`PILOT_SIGNOFF.1`)

| Item | Value |
|------|--------|
| **Classification** | **READY_FOR_CONTROLLED_NO_CHARGE_PILOT** (Local / public HTTPS web only) |
| **Master** | `5a714a8` |
| **Sign-off doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` |
| **Public API** | `https://viona-api-staging-eu.fly.dev` |
| **Proven** | HTTPS smoke PASS; REST UI PASS; device matrix 8/8 PASS; money safety invariants |
| **Not claimed** | Production, commercial/payment, Global Active, native store certification, SOS production |

---

## Controlled pilot session 1 (`KERNEL.CONTROLLED_PILOT_SESSION_1_PASS_SYNC.1`)

| Item | Value |
|------|--------|
| **Master** | `4c26830` |
| **Session doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_1.md` |
| **API** | **PASS** @ `fece42c` (paced smoke) |
| **UI** | **PASS** @ `4c26830` (operator attestation) |
| **Pause** | **No** |
| **Money safety** | `REQUEST_ONLY_NO_CHARGE`, `walletPhase` NONE, no payment captured |

**Not claimed:** production, commercial/payment, Global Active, native store cert (unless separate), merchant production onboarding, AI autonomous actions, SOS production.

**Next:** session 2+; optional native spot-check; ops audit UI; no finance packs without approval.

---

## Controlled pilot sessions 1–5 rollup (`SESSIONS_1_5_ROLLUP.1`)

| Item | Value |
|------|--------|
| **HEAD** | `d118b12` |
| **Rollup doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` |
| **Session 1** | API + UI **PASS** |
| **Session 2** | User/merchant/ops API + Expo ops UI **PASS** |
| **Session 3** | Public HTTPS API/ops **PASS** |
| **Session 4** | Public HTTPS API/ops **PASS** |
| **Session 5** | Public HTTPS API/ops **PASS** |
| **Native secret-tap** | **NOT RUN / NOT COMPLETED** |
| **Pause** | **No** (sessions 1–5) |
| **Classification** | Very strong repeated PASS evidence (sessions 1–5); whole VIONA pre-commercial |

---

## Controlled pilot sessions 1–4 rollup (`SESSIONS_1_4_ROLLUP.1`) — snapshot

| Item | Value |
|------|--------|
| **HEAD** | `597bddb` |
| **Rollup doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` |
| **Session 1–4** | **PASS** |
| **Pause** | **No** (sessions 1–4) |
| **Classification** | Superseded by sessions 1–5 rollup |

---

## Controlled pilot sessions 1–3 rollup (`SESSIONS_1_3_ROLLUP.1`) — snapshot

| Item | Value |
|------|--------|
| **HEAD** | `2841d3d` |
| **Rollup doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_3_ROLLUP.md` |
| **Session 1** | API + UI **PASS** |
| **Session 2** | User/merchant/ops API + Expo ops UI **PASS** |
| **Session 3** | Public HTTPS API/ops **PASS** |
| **Native secret-tap** | **NOT RUN / NOT COMPLETED** |
| **Pause** | **No** (sessions 1–3) |
| **Classification** | Strong PASS evidence for Local no-charge public HTTPS pilot; whole VIONA pre-commercial |

---

## Pilot readiness review after sessions 1–4 (`PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.1`)

| Item | Value |
|------|--------|
| **Baseline** | `597bddb` |
| **Review doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md` |
| **Verdict** | Session 5+ controlled no-charge pilot **may proceed** (Option A) — same scope, limited roster, ops audit active, pause criteria unchanged |
| **Not approved** | Production, commercial/payment, Global Active, native production confidence |
| **Native** | Secret-tap/PIN **NOT COMPLETED** — do not claim native PASS |

---

## Pilot readiness review after sessions 1–3 (`PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_3.1`) — snapshot

| Item | Value |
|------|--------|
| **Baseline** | `2841d3d` |
| **Review doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_3.md` |
| **Verdict** | Session 4+ controlled no-charge pilot **may proceed** (Option A) — superseded by post–1–4 review |
| **Not approved** | Production, commercial/payment, Global Active, native production confidence |
| **Native** | Secret-tap/PIN **NOT COMPLETED** — do not claim native PASS |

---

## Session 4 prep (`CONTROLLED_PILOT_SESSION_4.PREP.1`)

| Item | Value |
|------|--------|
| **Baseline** | `7f0653e` |
| **Prep doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_4.md` |
| **Scope** | Option A — same no-charge, limited roster, public HTTPS, Ops Audit active |
| **Status** | **PREP** — run not yet executed |
| **Native** | **NOT COMPLETED** — no native PASS without §8 checklist |

---

## Session 4 run (`CONTROLLED_PILOT_SESSION_4.RUN.1`)

| Item | Value |
|------|--------|
| **Baseline** | `b5d7607` |
| **Run doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_4.md` |
| **Verdict** | **PASS** — public HTTPS smoke exit 0 @ 2026-05-24 |
| **Money** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; `paymentCaptured` **false** |
| **Ops** | ADMIN list/detail **PASS**; B2C/merchant 403; unauthed 401 |
| **Native** | **NOT RUN** — secret-tap/PIN **NOT COMPLETED** |
| **Pause** | **No** |

---

## Session 5 prep (`CONTROLLED_PILOT_SESSION_5.PREP.1`)

| Item | Value |
|------|--------|
| **Baseline** | `8601354` |
| **Prep doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_5.md` |
| **Scope** | Option A — same no-charge, limited roster, public HTTPS, Ops Audit active |
| **Status** | **PREP** — run not yet executed |
| **Native** | **NOT COMPLETED** — no native PASS without §8 checklist |

---

## Session 5 run (`CONTROLLED_PILOT_SESSION_5.RUN.1`)

| Item | Value |
|------|--------|
| **Baseline** | `bcad94b` |
| **Run doc** | `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_5.md` |
| **Verdict** | **PASS** — public HTTPS smoke exit 0 @ 2026-05-24 |
| **Money** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; `paymentCaptured` **false** |
| **Ops** | ADMIN list/detail **PASS**; B2C/merchant 403; unauthed 401 |
| **Native** | **NOT RUN** — secret-tap/PIN **NOT COMPLETED** |
| **Pause** | **No** |

---

## 1. Executive summary

The **Local request-only / no-charge** pilot lane on VIONA is **automated QA-ready** on `master`: schema, APIs, merchant/user UI, EN/VI safe copy, VI runtime status labels, composed E2E runner, staging DB verification runbook, and manual device checklist are in place.

This is **not** a commercial or payment pilot. Local does **not** hold funds, settle to providers, or bridge Firebase VIP / Tourism booking wallets. Merchant confirm/reject updates **request status only** — **confirmed does not mean paid**.

**Automated engineering certification** remains the scope of this handoff (`f87e053` era). **Staging manual walkthrough** is **PASS** @ `4d365bf`. **REST UI login strict operator proof** is **PASS** @ `3cfea5e` — see `docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md`. All PASS scopes are **staging / manual only** — not commercial, payment, escrow, payout, settlement, or production automation.

---

## REST UI login strict proof PASS (2026-05-22)

| Item | Value |
|------|--------|
| **Verdict** | **STRICT UI PASS** (staging / manual only) |
| **Master** | `3cfea5e` |
| **Evidence** | `docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md` |
| **Bridge commit** | `f3fbc4a` — `feat(auth): bridge UI login to REST session` |
| **Proven** | UI phone + PIN → REST login; User A/B + Merchant M/N; isolation; M inbox confirm/decline UI; N isolation; logout/session clear; forbidden wording UI check |
| **`EXPO_PUBLIC_DEV_REST_JWT` required** | **No** (operator strict proof) |
| **Guardrails** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` NONE; no payment captured; Transaction/Wallet delta 0 |
| **Limitations** | Not production HTTPS/device matrix; ops audit UI not covered; keep `.env.local` without dev JWT on disk |

Auth doc commits: `3aed288`, `6853849`, `3cfea5e`.

---

## Staging manual walkthrough PASS (2026-05-22)

| Item | Value |
|------|--------|
| **Verdict** | **PASS** (staging / manual only) |
| **Master** | `4d365bf` |
| **Evidence** | `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md` |
| **Scope** | Staging DB + local-dev API + dev JWT + walkthrough unlock; request-only / no-charge |
| **Guardrails** | No payment captured; `walletPhase` NONE; Transaction/Wallet deltas 0 |
| **Limitations** | Demo login UI; not production HTTPS/device matrix; full EN/VI QA rows not re-filled; ops audit UI not covered |

Supporting commits: `2137ce1`, `c49b354`, `ec1364b`, `40ff5bb`, `4d365bf`.

---

## 2. Master state

| Item | Value |
|------|--------|
| **Master hash** | `f87e053` |
| **Working tree** | Clean at handoff authoring |
| **origin/master** | Synced with local `master` at `f87e053` |

### Key merged milestones (recent `git log`)

| Commit (short) | Milestone |
|----------------|-----------|
| `f87e053` / `5f72ff6` | VI runtime status + wallet badge i18n wiring |
| `ede2c80` / `99aaed7` | Manual device/staging walkthrough checklist |
| `f3aab1b` / `605feea` | Staging DB/migration verification runbook + readiness probe |
| `7340675` / `ff8adc5` | Safe EN/VI no-charge i18n copy pass |
| `cb7a112` / `59cc630` | Local no-charge E2E QA certification |
| `4c7e719` / `b0c66b4` | User request status UI |
| `e87a0ee` / `6ebb748` | User request list API |
| `e45dd3a` / `b2c6d41` | Merchant request inbox UI |
| `8dc4b1b` | Local mutation rate-limit guard |
| `1ef461f` | User request timeline API |
| `b82fdca` | Ops audit read API |
| Earlier stack | Audit runtime, expiry, create API, `LocalServiceRequest` schema migrations |

**Architecture references:** `docs/architecture/VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md`, `docs/architecture/VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md`, `docs/architecture/VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1.md`, `docs/operating/VIONA_PROJECT_KERNEL.md`.

---

## 3. What is complete

| Area | Status | Evidence |
|------|--------|----------|
| **LocalServiceRequest schema** | Done | `prisma/schema.prisma`; migrations `20260520120000_add_local_service_request`, `20260520140000_add_local_service_request_audit_event` |
| **Create request API** | Done | `POST /api/local/requests` — `test-local-request-create-source-of-truth.ts` |
| **User request list API** | Done | `GET /api/local/requests` — `test-local-user-request-list-api.ts` |
| **User timeline API** | Done | `GET /api/local/requests/:id/timeline` — `test-local-user-request-timeline-1.ts` |
| **User cancel API** | Done | `POST /api/local/requests/:id/cancel` — `test-local-user-request-cancel-api.ts` |
| **Merchant inbox API** | Done | `GET /api/local/merchant/requests` — `test-local-merchant-request-inbox-api.ts` |
| **Merchant confirm/reject APIs** | Done | confirm/reject scripts + rate limit |
| **Ops cancel API** | Done | `test-local-ops-request-cancel-api.ts` |
| **Ops audit read** | Done | `test-local-audit-read-api-1.ts` |
| **Audit runtime (append-only)** | Done | `test-local-request-audit-runtime-1.ts` … `3.ts` |
| **Expiry dry-run / apply** | Done | dry-run + apply scripts (status-only `EXPIRED`) |
| **Rate limit guard** | Done | `test-local-rate-limit-abuse-guard-1.ts` |
| **Merchant inbox UI** | Done | `LocalMerchantRequestInbox` — UI display test |
| **User request status UI** | Done | `LocalUserRequestStatus` ← Local hub “My requests” |
| **Safe EN/VI copy** | Done | `test-local-safe-i18n-copy-pass.ts` |
| **VI runtime status labels** | Done | `statusCopy` + `walletBadge` via `t()` on both screens (`f87e053`) |
| **E2E composed runner** | Done | `scripts/test-local-no-charge-e2e-qa.ts` (18 Local + 6 Tourism) |
| **Staging DB verification runbook** | Done | `docs/runbooks/VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md` |
| **Manual walkthrough checklist** | Published | `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` (execution **NOT RUN**) |
| **E2E QA certification doc** | Done | `docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md` |

---

## 4. Current Local safety state

Local pilot lane **must** remain:

| Invariant | Meaning |
|-----------|---------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` (default on create) |
| `walletPhase` | `NONE` |
| Payment | **No payment captured** — user/merchant copy states this explicitly |
| Confirm | **Confirmed does not mean paid** — status-only merchant ACK |
| Settlement | **No settlement**, no provider payout, no platform fee on Local mutations |
| Wallet ops | **No** hold, debit, release, refund, or `WalletTransaction` from Local routes/services |
| Bridges | **No** Firebase VIP bridge; **no** `Booking` / `TourismBooking` bridge from Local UI/API |
| Copy | **No** escrow, guaranteed booking, dispatch-as-fulfillment, or public **VIG** product term in Local lane |
| AI / SOS | **No** autonomous AI status mutation; **no** SOS/rescue production claim in Local scope |

User-facing safe phrases (EN/VI) are in i18n + runtime wiring; see `local.userRequestStatus` / `local.merchantInbox` in `en.json` / `vi.json`.

---

## 5. QA evidence — how to reproduce

Run from repo root on a machine with `DATABASE_URL` set (for DB-backed scripts). UI-only scripts run without DB.

### Standard gates

```bash
git diff --check
npm run typecheck
npm run lint
npm run smoke
npx prisma validate
npx prisma generate
```

**Expected:** typecheck/smoke/prisma **PASS**; lint **0 errors** (pre-existing warnings acceptable).

### Local no-charge suite

```bash
npx tsx scripts/test-local-no-charge-e2e-qa.ts
npx tsx scripts/test-local-safe-i18n-copy-pass.ts
npx tsx scripts/check-local-staging-readiness.ts
```

| Command | Expected | Notes |
|---------|----------|-------|
| `test-local-no-charge-e2e-qa.ts` | **PASS** (24 Local + 6 Tourism) | Skips DB scripts if `DATABASE_URL` unset |
| `test-local-safe-i18n-copy-pass.ts` | **PASS** | Scans Local i18n + wired helpers |
| `check-local-staging-readiness.ts` | **PASS** with limitations | Reports missing keys by name only; often `EXPO_PUBLIC_REST_API_BASE` missing locally |

### Targeted scripts (also in E2E runner)

```bash
npx tsx scripts/test-local-user-request-status-ui-display.ts
npx tsx scripts/test-local-merchant-inbox-ui-display.ts
npx tsx scripts/test-local-request-schema-defaults.ts
```

### Known flakes (retry guidance)

| Flake | Mitigation |
|-------|------------|
| `P2002` on `User.phoneNumber` | Retry failed script once or re-run full E2E runner |
| `request-audit-runtime-2` or `request-audit-runtime-3` under full composed run | Intermittent under load; passes in isolation; **retry once** |
| `merchant-request-confirm-api` / `reject-api` occasional fail in long runs | Same — retry |

Do **not** treat a single flake as lane regression without retry.

### Certification verdict (automated)

**PASS_WITH_LIMITATIONS** — all scripted gates pass on configured dev DB; manual staging/device and operator-labeled staging Supabase **not** signed off.

---

## 6. Manual operator requirements

Before changing verdict to **PASS** in `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md`:

1. **Confirm staging Supabase project** — label which project/environment is pilot staging (name only in docs; no secrets).
2. **Confirm migrations applied** on that DB — `20260520120000_add_local_service_request`, `20260520140000_add_local_service_request_audit_event` (see staging runbook).
3. **Set `EXPO_PUBLIC_REST_API_BASE`** on staging/device build to staging API host (not accidental localhost unless intended).
4. **Provision accounts** — requester A/B, merchant M/N, ops if needed; confirm business ownership (no passwords in docs).
5. **Create test requests** — via available UI or `POST /api/local/requests` if no consumer create path on device.
6. **Run device matrix** — 390×844, tablet portrait/landscape, desktop 1366×768 (mark PASS / NOT RUN).
7. **Execute walkthrough tables** — user flow, merchant flow, EN/VI copy, negative copy scan, wallet safety checklist.
8. **Update walkthrough verdict** to **PASS** only with evidence (date, tester, screenshots refs).

**Do not run `prisma migrate deploy`** on production/staging without explicit operator confirmation (`docs/runbooks/VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md`).

---

## 7. Still blocked (out of scope for this pilot)

| Blocked capability | Why |
|--------------------|-----|
| Wallet hold / debit on Local submit | Finance policy not enabled; `HOLD_ON_SUBMIT` not active for Local pilot |
| Refund / release of held funds | No hold → no release path in Local lane |
| Settlement / provider payout | Tourism hold mode separate; Local is request-only |
| Production Local **commercial** pilot | No payment capture, no paid booking claim |
| Autonomous AI status mutation | AI copilot read-only / future only |
| SOS / rescue production claim | Not in Local request flows |
| Tourism production hold inbox | Separate lane; do not conflate with Local no-charge sign-off |
| Global **Active Full** product mode | Kernel/program gate; Local pilot does not imply global activation |

---

## 8. Recommended next steps (ordered)

| Step | Action | Owner |
|------|--------|-------|
| **A** | Execute manual staging/device walkthrough — `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` | Operator |
| **B** | Update pilot sign-off: walkthrough **PASS** + staging target confirmed | Operator + eng lead |
| **C** | Sync `docs/operating/VIONA_PROJECT_KERNEL.md` with this handoff and latest Local readiness | Docs/engineering |
| **D** | *Later only:* finance-approved Local wallet hold policy (`HOLD_ON_SUBMIT`) | Product/finance |
| **E** | *Later only:* AI Copilot read-only assist on Local requests | Product/AI |

Do **not** enable wallet settlement, Firebase VIP bridge, or Tourism bridge on Local without explicit policy packs.

---

## 9. Verdict

**PASS_WITH_LIMITATIONS**

| Criterion | Status |
|-----------|--------|
| Automated QA (API, UI helpers, i18n, E2E, Tourism regression) | **Ready** on `master` @ `f87e053` |
| Staging DB read-only verification (repo + connected DB) | **Documented** — operator must confirm target |
| Manual device/staging walkthrough | **PASS** on staging @ `4d365bf` — evidence in runbooks (not full QA row fill) |
| Commercial / payment / production Local pilot | **Not claimed** |

**Reason:** Automated QA ready on `master`; **staging manual walkthrough PASS** recorded separately. Commercial/production Local pilot sign-off still **not** claimed.

---

## Related documents

| Document | Purpose |
|----------|---------|
| `docs/qa/VIONA_LOCAL_NO_CHARGE_E2E_QA_1.md` | Automated E2E certification detail |
| `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` | Manual execution checklist |
| `docs/runbooks/VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md` | DB/migration read-only verification |
| `scripts/test-local-no-charge-e2e-qa.ts` | Single command Local + Tourism regression |
| `scripts/check-local-staging-readiness.ts` | Env key presence probe (no secrets) |
| `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` | **Final** public HTTPS no-charge pilot sign-off @ `5a714a8` |
| `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_1.md` | Controlled pilot session 1 **PASS** @ `4c26830` |
| `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Pilot operations |
| `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Fly + HTTPS smoke |
| `docs/runbooks/VIONA_PUBLIC_HTTPS_REST_UI_WALKTHROUGH.md` | Public HTTPS REST UI |
| `docs/runbooks/VIONA_PUBLIC_HTTPS_LOCAL_NO_CHARGE_DEVICE_MATRIX.md` | 8/8 responsive matrix |

---

## Handoff authoring validation (2026-05-21)

| Check | Result |
|-------|--------|
| `git diff --check` | PASS (docs only) |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (0 errors) |
| `npm run smoke` | PASS |
| `npx prisma validate` | PASS |
| `npx tsx scripts/test-local-no-charge-e2e-qa.ts` | PASS |
| `npx tsx scripts/test-local-safe-i18n-copy-pass.ts` | PASS |
| `npx tsx scripts/check-local-staging-readiness.ts` | PASS (`EXPO_PUBLIC_REST_API_BASE` missing noted) |
