# VIONA Wave 2 — Native/Mobile Confidence Prep

**Pack:** `VIONA.WAVE_2.NATIVE_MOBILE_CONFIDENCE.PREP.1`
**Wave 1 exit:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md`
**Rollup:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md`
**Master wave roadmap:** `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Prior native attempts:** `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` §11 (build **PASS** §11.6; secret-tap UI **NOT COMPLETED** §11.7)
**Prep baseline HEAD:** `cf685ae` — `docs(local): define Wave 1 pilot exit criteria`
**Prep date (UTC):** 2026-05-24
**Status:** **NOT RUN** @ 2026-05-24 — see `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` (manual walkthrough not completed)

**Classification:** Native/mobile confidence preparation only — **not** production launch, **not** native production ready, **not** Global Active / full commercial.

---

## 1. Baseline (post–Wave 1)

| Area | Status | Evidence |
|------|--------|----------|
| Wave 1 signoff criteria | **Complete** | `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` @ `cf685ae` |
| Controlled pilot Sessions 1–5 | **PASS** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` |
| Public HTTPS Local + Ops evidence | **Strong repeated PASS** | Sessions 3–5 smoke |
| Ops Audit API (HTTPS) | **PASS** | Staging smoke |
| Ops Audit UI (Expo web) | **PASS** | Session 2 §5 |
| Android dev client build | **Restored** | Session 2 §11.6 — `com.ketnoiglobal.app` |
| Native secret-tap / PIN / Ops Audit (native UI) | **NOT RUN / NOT COMPLETED** | Session 2 §11.7; Wave 2 RUN **NOT RUN** @ 2026-05-24 |
| Native production confidence | **Not achieved** | No checklist PASS on stable device |
| Money law (Local) | **Holding** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE** |
| Whole VIONA | Pre-commercial / staging-pilot foundation | Kernel |
| **Global Active / full commercial** | **Not yet** | Master wave roadmap |

---

## 2. Wave 2 purpose

| Goal | Detail |
|------|--------|
| **Honesty** | Prove native/mobile confidence with **manual** evidence — no API/web substitution for native PASS |
| **Android path** | Verify dev client can reach intended **admin/debug** entry (secret-tap ×5 → PIN or documented equivalent) |
| **Ops Audit (native)** | Verify Local Ops Audit reachable through **native** flow when checklist is run |
| **Safety** | Verify list/detail, read-only mutation safety, redaction, limitation copy on native route |
| **Boundary** | **Do not** claim production/native PASS unless every required checklist row is **PASS** on a **stable** run |

**Out of scope for Wave 2 prep:** payment UI, wallet rails, commercial launch, store submission, SOS production, autonomous AI.

---

## 3. Native checklist (fill on RUN)

Operator completes on **stable** physical device preferred; emulator-only runs may be recorded as **FAIL** or **NOT RUN** if UI automation/device unstable (see session 2 §11.7).

| # | Check | PASS / FAIL / NOT RUN | Notes |
|---|------|----------------------|-------|
| 1 | Device/simulator identity recorded (model, OS — no secrets) | | |
| 2 | App build installed (`com.ketnoiglobal.app` or documented id) | | |
| 3 | App launched (cold or warm — record which) | | |
| 4 | Home loads without blocking redbox | | |
| 5 | Local tab — **no** Ops Audit in consumer nav | | |
| 6 | Admin entry path works (secret-tap ×5 → PIN modal, or approved equivalent) | | |
| 7 | PIN prompt appears | | |
| 8 | Valid admin PIN accepted (PIN not logged) | | |
| 9 | Grand Admin Dashboard opens | | |
| 10 | Local Ops Audit entry visible **only** in admin/debug context | | |
| 11 | Ops Audit **list** loads over HTTPS | | |
| 12 | Ops Audit **detail** loads | | |
| 13 | Safety chips visible (4 themes per UI plan) | | |
| 14 | Limitation banner visible (no payment-dashboard implication) | | |
| 15 | **No** mutation affordance visible (confirm/reject/refund/payout/settlement) | | |
| 16 | Redaction — no phone/PIN/JWT on screen | | |
| 17 | **No** payment/commercial wording on Local/Ops surfaces | | |
| 18 | Native status recorded honestly in evidence table (§4) | | |

**Metro session-only overrides (not committed):** `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG`, demo metrics, omni, `EXPO_PUBLIC_ADMIN_PIN` (≥12 chars). Do not log PIN/JWT/phone.

**Android operator notes (from session 2 §11.6):** `npx expo prebuild -p android` after clone; Mapbox Maven + Kotlin 2.1.20; if Gradle worker errors, fresh `GRADLE_USER_HOME` or `cmd package compile -m speed com.ketnoiglobal.app`.

---

## 4. Evidence table (template — fill on RUN)

| Field | Value |
|-------|--------|
| **Date / time (UTC)** | |
| **Operator** | initials only |
| **master / origin @ start** | |
| **Device / simulator** | e.g. physical Pixel · emulator-5554 |
| **OS / version** | e.g. Android 14 API 34 |
| **Build type** | e.g. debug dev client · release internal |
| **App identifier** | `com.ketnoiglobal.app` |
| **API base (probe only)** | `https://viona-api-staging-eu.fly.dev` |
| **Admin entry path** | secret-tap ×5 · other (describe) |
| **PIN result** | PASS / FAIL / NOT RUN |
| **Dashboard result** | PASS / FAIL / NOT RUN |
| **Ops Audit list result** | PASS / FAIL / NOT RUN |
| **Ops Audit detail result** | PASS / FAIL / NOT RUN |
| **Redaction result** | PASS / FAIL / NOT RUN |
| **Mutation safety result** | PASS / FAIL / NOT RUN |
| **Screenshots / video available** | Yes / No (privacy-safe; not committed if secrets) |
| **Issues found** | privacy-safe summary |
| **Verdict** | **PASS** / **FAIL** / **NOT RUN** |

**Request id opened on native detail (non-secret, if any):**

-

---

## 5. PASS / FAIL / NOT RUN rules

### PASS (wave-level) only if **all** required:

| Requirement | Detail |
|-------------|--------|
| Stable run | Completed on **stable** physical device or reliably reproducible simulator session |
| Admin entry | Intended path works (secret-tap ×5 → PIN or documented equivalent) |
| PIN | Valid admin PIN grants dashboard |
| Ops Audit | List **and** detail visible on native route |
| Safety | Redaction + no mutation controls verified |
| Claims | **No** payment/commercial/production overclaim in operator notes |

### NOT RUN if:

| Condition | Detail |
|-----------|--------|
| No device | No stable device/simulator available for manual walkthrough |
| No walkthrough | Prep only — checklist not executed |
| Blocked automation | Emulator/UI automation blocked — record honestly (session 2 §11.7 pattern) |

### FAIL if **any**:

| Condition | Detail |
|-----------|--------|
| Launch | App cannot launch or Home blocked by redbox |
| Admin path | Admin entry path unavailable |
| PIN | PIN blocks access to dashboard |
| Ops Audit | Ops Audit list/detail unavailable on native |
| Mutation | Mutation affordance visible or successful from Ops Audit |
| Redaction | Phone/PIN/JWT visible on screen |
| Wording | Payment/commercial wording on Local/Ops surfaces |

**API/web PASS does not upgrade NOT RUN or FAIL to PASS.**

---

## 6. Native limitation language (required in all Wave 2 docs)

| Use | Avoid |
|-----|-------|
| Android build **restored** | Native production **ready** |
| Native walkthrough **pending** / **NOT COMPLETED** | Mobile production **ready** |
| Native production confidence **not achieved** | Global Active **ready** |
| Expo web ops UI PASS (separate track) | Substituting web for native PASS |

---

## 7. Relation to Wave 3 (consumer UX)

Wave 3 **consumer UX excellence** may start **after this prep** is published. Wave 3 does **not** require native PASS.

| Wave 3 must preserve | Detail |
|---------------------|--------|
| Home design standard | Command rail / hybrid layout discipline |
| Premium App Tiles | Tile consistency across surfaces |
| i18n + safety copy | VI/EN; forbidden commercial wording |
| Local logic | **No** service/money drift — `REQUEST_ONLY_NO_CHARGE` |
| Payment UI | **No** payment/commercial wording or affordances |

**Recommended:** Run Wave 2 attestation when hardware is available; start Wave 3 UI packs in parallel if native is blocked — keep native status **NOT COMPLETED** in rollup until §3 checklist PASS.

---

## 8. Locked zones (unchanged)

| Zone | Status |
|------|--------|
| Payment / wallet / commercial implementation | **Locked** |
| Hold / debit / release / refund | **Locked** |
| Settlement / payout / cash-out / escrow | **Locked** |
| Production admin claim | **Locked** |
| Autonomous AI actions | **Locked** |
| SOS production reliability claim | **Locked** |
| Global Active / full commercial claim | **Locked** |
| Native PASS without §3 checklist | **Locked** |

---

## 9. Next action

| Priority | Action |
|----------|--------|
| **1** | **Wave 2 Native Manual Attestation Run** — fill §3 + §4 on stable device/simulator (`VIONA.WAVE_2.NATIVE_MOBILE_CONFIDENCE.RUN.1`) |
| **2** | If stable native unavailable → proceed to **Wave 3** UX with native status **NOT COMPLETED** |
| **3** | Optional: Session 6+ public HTTPS smoke (Wave 1 Option A) — does not substitute native |

**Do not** claim native production confidence until §5 PASS rules are met on a completed manual run.

---

## 10. Explicit non-goals

- Not production launch
- Not Global Active / full commercial VIONA
- Not commercial or payment readiness
- Not production admin certification
- Not App Store / Play Store submission sign-off
- Not autonomous AI or SOS production claims
- Not payment/wallet implementation

---

## 11. Related documents

| Doc | Role |
|-----|------|
| `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` | Wave 1 exit + Wave 2 entry criteria |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` | Sessions 1–5 API/web aggregate |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_2.md` | Native build + failed emulator attestation |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_5.md` | §8 native checklist template |
| `VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md` | Ops Audit UI scope + safety chips |
| `VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` | Wave 2 map |
| `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` | Wave 2 attestation run (**NOT RUN**) |
| `VIONA_PROJECT_KERNEL.md` | Kernel pointers |
