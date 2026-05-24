# VIONA Local no-charge — Wave 1 exit / pilot signoff criteria

**Pack:** `VIONA.LOCAL.NO_CHARGE.WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.1`
**Rollup:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md`
**Master wave roadmap:** `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Readiness review:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md`
**Criteria baseline HEAD:** `9619886` — `docs(local): roll up controlled pilot sessions 1-5`
**Criteria date (UTC):** 2026-05-24

**Classification:** Wave 1 **exit criteria** and honest signoff boundaries — **not** production launch, **not** Global Active / full commercial.

---

## 1. Current baseline (evidence-backed)

| Area | Status | Evidence |
|------|--------|----------|
| Controlled pilot Sessions 1–5 | **PASS** | Session runbooks + `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` |
| Pause (sessions 1–5) | **No** | Rollup §6; session §issues/pause |
| Public HTTPS smoke | **Stable** | Exit 0 on `smoke-public-staging-api.mjs` each session 3–5 |
| Ops Audit read-only safety | **Stable** | `opsAuditMutationSafe`; 401/403 role gates; redaction PASS |
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` | Smoke + session logs |
| `walletPhase` | **NONE** | No drift observed |
| `paymentCaptured` | **false** | No capture in pilot actions |
| Native secret-tap / PIN | **NOT RUN / NOT COMPLETED** | Sessions 2–5 native §7/§8 |
| Whole VIONA | Pre-commercial / staging-pilot foundation | Kernel + handoff |
| **Global Active / full commercial** | **Not yet** | Master wave roadmap |

---

## 2. Wave 1 achievements (proven on staging public HTTPS)

Repeated PASS across Sessions 1–5 unless noted (Session 1 adds operator UI attestation for user/merchant flows).

| Achievement | Status |
|-------------|--------|
| Public HTTPS health | **PASS** |
| User A login | **PASS** |
| User B login | **PASS** |
| Merchant M login | **PASS** |
| Merchant N login | **PASS** |
| Local request create | **PASS** |
| Merchant inbox | **PASS** |
| Merchant confirm | **PASS** |
| Merchant decline | **PASS** |
| User tenant isolation | **PASS** |
| Merchant tenant isolation | **PASS** |
| Ops ADMIN login | **PASS** (sessions 2–5) |
| Ops Audit list | **PASS** |
| Ops Audit detail | **PASS** |
| Non-admin ops denied (401/403) | **PASS** |
| Redaction | **PASS** |
| Read-only mutation safety | **PASS** |
| No-charge safety invariants | **PASS** |

**Ops Audit UI (Expo web):** **PASS** @ Session 2 §5 — carried forward; not re-run every API session.

---

## 3. Wave 1 exit classification (honest)

| Scope | Classification |
|-------|----------------|
| **Local no-charge public HTTPS controlled pilot** | **Strong repeated PASS evidence** (sessions 1–5) |
| **Local limited pilot continuation (Session 6+)** | **Allowed** under Option A constraints (§5) |
| **Native production confidence** | **Not achieved** — attestation incomplete |
| **Commercial / payment readiness** | **Not achieved** |
| **Production admin** | **Not achieved** |
| **Global Active / full commercial** | **Not achieved** |

**Wave 1 exit verdict:** Criteria for **closing Wave 1 planning lane** are **met** for API/web controlled pilot evidence. **Does not** unlock payment, commercial, production, or Global Active claims.

---

## 4. Signoff criteria — continuing Session 6+ (Option A)

Session 6+ **may proceed** only if **all** of the following hold:

| # | Criterion |
|---|-----------|
| 1 | Same **no-charge** scope — `REQUEST_ONLY_NO_CHARGE`; no payment/wallet packs |
| 2 | **Limited** approved internal roster only |
| 3 | **Ops Audit active** — read-only ADMIN list/detail each session |
| 4 | **Public HTTPS smoke** exit 0 at session start |
| 5 | **Pause criteria unchanged** — stop on any §9 trigger |
| 6 | **No** production, payment, settlement, or Global Active wording in evidence |
| 7 | **Native** status **NOT COMPLETED** in session logs until real §8 checklist PASS on stable device |

**Not required for Session 6+:** native PASS; Expo web re-run (if API corroborates); commercial sign-off.

---

## 5. Criteria to start Wave 2 — native / mobile confidence

Wave 2 **may start** when:

| # | Criterion |
|---|-----------|
| 1 | Android dev client build remains **stable** (`com.ketnoiglobal.app` @ session 2 §11.6) |
| 2 | **Stable** physical device or reliable simulator available (emulator-only **not** sufficient for PASS claim) |
| 3 | Secret-tap ×5 → PIN → Admin → Local Ops Audit path can be **manually** tested |
| 4 | Evidence table exists (`VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_PREP.md` §3–§4) |
| 5 | Operator accepts **no native PASS** without completed checklist — API/web PASS does not substitute |

**Wave 2 exit (future):** Native readiness note with honest PASS/FAIL per checklist row; still **not** store certification or Global Active.

---

## 6. Criteria to start Wave 3 — consumer UX excellence

Wave 3 **may start** when:

| # | Criterion |
|---|-----------|
| 1 | Scope is **UI/UX only** — no Local service logic drift |
| 2 | **No** Home standard violation (command rail / hybrid layout discipline) |
| 3 | Preserve **Premium App Tiles** / hybrid layout conventions |
| 4 | Preserve **i18n** and safety copy (VI/EN; forbidden commercial wording scan) |
| 5 | **No** payment or commercial UI wording |
| 6 | QA viewports: **390×844**, **768×1024**, **1024×768**, **1366×768** |

**May run in parallel with Wave 2** if native hardware is blocked — Wave 3 does not require native PASS.

---

## 7. Locked zones (remain locked after Wave 1 exit)

| Zone | Lock |
|------|------|
| Payment / wallet / commercial **implementation** | Until finance-approved Wave 7 |
| Hold / debit / release / refund | Until Wave 6 architecture + Wave 7 approval |
| Settlement / payout / cash-out / escrow | Until finance-approved commercial wave |
| Production admin claim | Until separate production ops certification |
| AI **autonomous** actions | Until Wave 9 with human confirm |
| SOS **production reliability** claim | Until Wave 11 with real provider/legal coverage |
| **Global Active / full commercial** claim | Until master roadmap waves + leadership sign-off |
| **Native PASS** claim | Until real native attestation checklist PASS |

---

## 8. Pause criteria (unchanged — any triggers stop expansion)

| # | Trigger |
|---|---------|
| 1 | **`paymentCaptured` true** or wallet balance change from pilot actions |
| 2 | **`walletPhase` ≠ NONE** on new Local requests |
| 3 | **Non-admin ops access succeeds** — B2C/merchant HTTP 200 on ops list/detail |
| 4 | **Redaction leak** — JWT, PIN, roster phone in UI or committed evidence |
| 5 | **Tenant isolation failure** |
| 6 | **Ops mutation** from read-only flow (UI or API) |
| 7 | **Public HTTPS smoke failure** — unexplained or repeated |
| 8 | **Forbidden commercial/payment wording** on Local or Ops Audit surfaces |
| 9 | **Staging evidence over-generalized as production** in docs or operator comms |

Full playbook: `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` §5.

---

## 9. Recommended next step

| Option | Action | When |
|--------|--------|------|
| **1** | **Session 6** prep/run | Continue corroborating Option A evidence on roster |
| **2** | **Wave 2** native/mobile confidence | When stable device available |
| **3** | **Wave 3** consumer UX excellence | UI-only; can parallel Wave 2 |

**Preferred sequence:**

| Step | Action |
|------|--------|
| **A** | **Close Wave 1 signoff** — this document + rollup @ `9619886` (done) |
| **B** | **Wave 2** — native/mobile confidence (secret-tap/PIN attestation) |
| **C** | **Wave 3** — consumer UX excellence |
| **D** | Keep **payment/commercial locked** until finance architecture wave (Wave 6 docs → Wave 7 impl) |

**Do not** open Wave 7 payment implementation without finance approval and Wave 6 architecture sign-off.

---

## 10. Explicit non-goals

- Not production launch
- Not Global Active / full commercial VIONA
- Not commercial or payment readiness
- Not production admin or payment dashboard certification
- Not settlement / payout / escrow operations
- Not autonomous AI actions
- Not SOS production reliability claim
- Not native store certification without separate evidence
- Not open public merchant onboarding at scale

---

## 11. Related documents

| Doc | Role |
|-----|------|
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` | Sessions 1–5 aggregate |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md` | Option A decision (sessions 1–4 review) |
| `VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` | Waves 1–12 map |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Daily ops + pause |
| `VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md` | Ops Audit UI scope |
| `VIONA_LOCAL_NO_CHARGE_PILOT_SIGNOFF.md` | Initial public HTTPS sign-off |
| `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_PREP.md` | Wave 2 native prep |
| `VIONA_PROJECT_KERNEL.md` | Kernel money law |
