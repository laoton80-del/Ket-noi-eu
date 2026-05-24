# VIONA Local no-charge — controlled pilot sessions 1–3 rollup

**Pack:** `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_SESSIONS_1_3_ROLLUP.1`
**Superseded for current index by:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` @ `0729e16+`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Handoff:** `docs/handoff/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md`
**Current HEAD:** `2841d3d` — `docs(local): roll up controlled pilot sessions 1-3`
**Readiness review:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_3.md`
**Rollup date (UTC):** 2026-05-24

---

## 1. Milestone summary

| Session | Doc | Verdict | Key evidence |
|---------|-----|---------|--------------|
| **1** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_1.md` | **PASS** | API @ `fece42c`; Expo user/merchant UI @ `4c26830`; **no pause** |
| **2** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` | **PASS** | User/merchant + ops API @ `028ea9f`; Expo Ops Audit UI (web) @ §5; **no pause** |
| **3** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` | **PASS** | Public HTTPS smoke (user/merchant/ops) @ 2026-05-24; **no pause** |

| Cross-cutting | Status |
|---------------|--------|
| **Ops Audit API (HTTPS)** | **FULL PASS** — sessions 2–3 + ongoing smoke |
| **Ops Audit UI (Expo web)** | **PASS** — session 2 §5 (not re-run session 3) |
| **Android dev client build** | **PASS** — session 2 §11.6 (`85fafeb`) |
| **Native secret-tap / PIN / Ops Audit UI** | **NOT RUN / NOT COMPLETED** — session 2 §11.7; session 3 §7 **NOT RUN** |
| **Pause across sessions 1–3** | **No** |

---

## 2. Proven Local capabilities (sessions 1–3 aggregate)

Evidence from paced public HTTPS smoke (`node scripts/smoke-public-staging-api.mjs`) and session 1 operator UI attestation unless noted.

| Capability | Session 1 | Session 2 | Session 3 |
|------------|-------------|-----------|-----------|
| Public HTTPS health | **PASS** | **PASS** | **PASS** |
| User A login | **PASS** | **PASS** | **PASS** |
| User B login | **PASS** | **PASS** | **PASS** |
| Merchant M login | **PASS** | **PASS** | **PASS** |
| Merchant N login | **PASS** | **PASS** | **PASS** |
| Local request create | **PASS** (smoke + UI) | **PASS** | **PASS** |
| Merchant inbox | **PASS** (UI + API) | **PASS** | **PASS** |
| Merchant confirm | **PASS** (UI + API) | **PASS** | **PASS** |
| Merchant decline | **PASS** (UI + API) | **PASS** | **PASS** |
| User tenant isolation | **PASS** | **PASS** | **PASS** |
| Merchant tenant isolation | **PASS** | **PASS** | **PASS** |
| Ops ADMIN login | — | **PASS** | **PASS** |
| Ops Audit list | — | **PASS** | **PASS** |
| Ops Audit detail | — | **PASS** | **PASS** |
| Non-admin ops denied | — | **PASS** (401/403) | **PASS** (401/403) |
| Redaction | — | **PASS** | **PASS** |
| Read-only mutation safety | — | **PASS** | **PASS** |

**API base (all sessions):** `https://viona-api-staging-eu.fly.dev`  
**Dev JWT:** empty (length 0 probes; not logged)

---

## 3. Money safety (invariant across sessions 1–3)

| Field | Value | Status |
|-------|--------|--------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` | **PASS** — smoke + session logs |
| `walletPhase` | `NONE` | **PASS** — no drift observed |
| `paymentCaptured` | `false` | **PASS** |
| Confirmed ≠ paid | Enforced (API `safety` + UI copy) | **PASS** |
| Payment / payout / settlement | Not in pilot scope | **Not claimed** |

**Money law:** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; **confirmed does not mean paid**.

---

## 4. Ops Audit status

| Item | Status | Evidence |
|------|--------|----------|
| Read-only ops API implemented | **Yes** | `GET /api/local/ops/requests`, `GET /api/local/ops/requests/:id` |
| Fly staging deploy | **Yes** | Public HTTPS base |
| HTTPS smoke | **PASS** | Sessions 2–3; latest @ session 3 §11 |
| Expo web walkthrough | **PASS** | Session 2 §5 — list, detail, chips, banner, no mutations |
| Used in controlled pilot | **Yes** | Session 2 user/merchant/ops pack; session 3 API re-verify |
| Native Ops Audit UI | **NOT COMPLETED** | Secret-tap path not attested on device |

**Do not** claim production admin, payment dashboard, or native ops UI PASS without separate attestation.

---

## 5. Native status

| Item | Status |
|------|--------|
| Android `com.ketnoiglobal.app` build | **PASS** @ session 2 §11.6 (Mapbox Maven + Kotlin 2.1.20) |
| Metro / JS launch | **PASS** @ session 2 §11.7 (after speed-compile) |
| Secret-tap ×5 → PIN modal | **NOT COMPLETED** — emulator UI automation blocked |
| Grand Admin Dashboard → Local Ops Audit (native UI) | **NOT RUN** |
| Expo web substitute for native §7 | **Not allowed** for native PASS claim |

**Rule:** Do not claim native secret-tap/PIN **PASS** until session 3 §7 (or equivalent) checklist is completed on a stable device.

---

## 6. Pause criteria status (sessions 1–3)

No pause triggered in any session. Cumulative check:

| Criterion | Status |
|-----------|--------|
| Payment captured | **No** — not observed |
| `walletPhase` drift (≠ NONE) | **No** |
| Tenant isolation failure | **No** |
| Non-admin ops access (200 on ops list/detail) | **No** — 401/403 as expected |
| Redaction leak (JWT/PIN/phone in committed evidence) | **No** |
| Ops mutation from read-only flow | **No** |
| Blocking public HTTPS health/smoke failure | **No** |
| Forbidden commercial wording (session 1 UI + session 2 ops UI) | **Not observed** (session 3 API pack: not re-scanned) |

Full pause triggers: `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` §5 and session 3 §4.

---

## 7. Current classification

| Scope | Classification |
|-------|----------------|
| **Local no-charge public HTTPS controlled pilot (sessions 1–3)** | **Strong PASS evidence** — user, merchant, tenant isolation, ops read-only visibility |
| **Ops Audit (API + Expo web)** | **PASS** for pilot operator use; native UI **open** |
| **Whole VIONA** | Pre-commercial / staging-pilot foundation |
| **Global Active / full commercial** | **Not yet** |

**Not claimed:** production launch, commercial/payment readiness, settlement/payout, production admin certification, AI/SOS automation, App Store native certification, merchant production onboarding at scale.

---

## 8. Session evidence index (detail)

| Session | Commits / dates | Primary doc sections |
|---------|-----------------|----------------------|
| **1** | API `fece42c`; UI `4c26830`; 2026-05-23 | Full session log + UI companion |
| **2** | Ops use `028ea9f`; Expo ops `21ec3ec`; native packs §11; 2026-05-23 | §5 Expo web; §9 API; §11 native |
| **3** | Run @ `c1514e2`+; smoke 2026-05-24 | §6 evidence; §11 API run |

**Latest smoke command:**

```bash
node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev
```

---

## 9. Next options (no finance packs without approval)

| Priority | Option |
|----------|--------|
| 1 | **Sessions 1–4 rollup** — `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` (current aggregate) |
| 2 | **Session 5+** controlled pilot — same Option A constraints |
| 3 | **Native manual attestation** — session 4 §8 on stable device; do not claim PASS until done |
| 4 | **Ops incident / support refinement** — playbook §7–§8 from real operator issues |
| 5 | **Locked** — payment/wallet/commercial packs only with explicit finance approval |

---

## 10. Related documents

| Doc | Role |
|-----|------|
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_1.md` | Session 1 API + UI |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` | Session 2 ops + Expo web + native attempts |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_3.md` | Session 3 API re-verify |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Daily ops + pause + session index |
| `VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md` | Ops Audit UI scope + packs |
| `VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` | Readiness sign-off |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_3.md` | Post sessions 1–3 readiness decision |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_4.md` | Session 4 API re-verify |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` | Sessions 1–4 aggregate (current) |
| `VIONA_PROJECT_KERNEL.md` | Kernel money law + pilot pointers |
