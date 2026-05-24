# VIONA — Global Active / Full Commercial master wave roadmap

**Pack:** `VIONA.GLOBAL_ACTIVE_FULL_COMMERCIAL.MASTER_WAVE_ROADMAP.1`
**Kernel:** `docs/operating/VIONA_PROJECT_KERNEL.md`
**Local pilot evidence:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md`, session runbooks 1–5
**Readiness review:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md`
**Roadmap baseline HEAD:** `d118b12` — `docs(local): record controlled pilot session 5`
**Roadmap date (UTC):** 2026-05-24

**Classification:** Planning / sequencing only. **Not** production launch, **not** commercial readiness, **not** payment implementation.

---

## 1. Executive intent

| Dimension | Intent |
|-----------|--------|
| **North star** | **Global Active / Full Commercial** VIONA — super beautiful, premium, easy to use, daily-use super app with large daily-active-user potential |
| **Quality bar** | Consumer trust, merchant clarity, ops visibility, finance safety, human-in-the-loop AI, jurisdiction-aware SOS |
| **Honesty** | No fake production claims; no unsafe monetization; no autonomous money or rescue actions without gates |
| **Current lane** | Controlled **no-charge** Local pilot on public HTTPS staging — strong repeated PASS evidence; whole product remains **pre-commercial** |

**Principle:** Accelerate in **waves**, not one uncontrolled mega-run. Preserve money law, tenant isolation, ops read-only safety, and pilot pause criteria until explicit approval unlocks each risk class.

---

## 2. Current baseline (evidence-backed)

| Area | Status | Evidence |
|------|--------|----------|
| Local no-charge Sessions 1–4 | **PASS** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_4_ROLLUP.md` @ `597bddb` |
| Local no-charge Session 5 | **PASS** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSION_5.md` @ 2026-05-24 |
| Pause (sessions 1–5) | **No** | Session runbooks §issues/pause |
| Ops Audit API (HTTPS) | **PASS** | Sessions 2–5 smoke; read-only list/detail |
| Ops Audit UI (Expo web) | **PASS** | Session 2 §5 (carried forward) |
| Android dev client build | **PASS** | Session 2 §11.6 — `com.ketnoiglobal.app` |
| Native secret-tap / PIN / Ops Audit UI | **NOT COMPLETED** | Wave 2 RUN **NOT RUN** @ 2026-05-24 |
| Money law (Local) | **Holding** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; `paymentCaptured` **false** |
| Whole VIONA | Pre-commercial / staging-pilot foundation | Kernel + handoff |
| **Global Active / full commercial** | **Not yet** | No production/commercial claim |

**Wave 1 exit:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` @ `9619886` — criteria **met** for API/web pilot; optional: support/incident refinement from real ops load.

---

## 3. Acceleration model (Wave Mode)

| Rule | Detail |
|------|--------|
| **Not** | ~130 packs in one uncontrolled Cursor run |
| **Use** | **8–12 waves**, each **5–15 packs** (planning units, not promises) |
| **Execution** | Cursor may run **one wave at a time** or **sub-batches of 2–5 packs** within a wave |
| **Gates** | Hard stop on failed validation; checkpoint report after each wave/batch |
| **Locks** | Money, AI autonomous action, SOS production, production admin, Global Active claim — **locked** until explicit approval per wave |
| **Honesty** | Each wave ends with PASS/FAIL evidence; no forward-fix under pilot pressure into payment/commercial |

```text
Baseline (today) → Wave 1 → checkpoint → Wave 2 → … → Wave 12 → Global Active readiness review (future)
                      ↑
              no skip of finance / AI / SOS gates
```

---

## 4. Wave map

### Wave 1 — Local no-charge pilot completion

| Pack theme | Examples |
|------------|----------|
| Session continuity | Session 5 run (**done** @ `d118b12`); optional Session 6+ under Option A |
| Rollup | Sessions **1–5** rollup doc; sync kernel/handoff |
| Exit criteria | `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` (**met** @ `9619886`) |
| Ops refinement | Support/incident playbook from real operator issues |
| Review | Pilot readiness review after sessions 1–5 (optional) |

**Exit gate:** Repeatable public HTTPS smoke PASS; no pause; money invariants unchanged; **no** payment/wallet implementation.

---

### Wave 2 — Native / mobile confidence

**Prep + run:** `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_PREP.md` / `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` — attestation **NOT RUN** @ 2026-05-24 (package not on emulator; no UI walkthrough)

| Pack theme | Examples |
|------------|----------|
| Android | Secret-tap ×5 → PIN → Admin → Local Ops Audit on **stable** device |
| iOS | Simulator/device smoke; parity notes |
| Ops native UI | List/detail, safety chips, limitation banner, no mutations |
| Stability | Crash/log review; Metro/Gradle operator notes |
| Deliverable | Native readiness note — **PASS only with checklist evidence** |

**Exit gate:** Native attestation **PASS** or explicit **NOT COMPLETED** recorded; **no** native PASS from API/web only.

---

### Wave 3 — Consumer UX excellence

**Prep:** `docs/design/VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md` (**PREP** @ `7b8e9fd+`); surface audit pending

| Pack theme | Examples |
|------------|----------|
| Shell | Home / Local alignment; premium app tile consistency |
| Clarity | Local user status; merchant-facing status copy |
| i18n | VI/EN copy pass; forbidden commercial wording scan |
| QA | Responsive matrix; accessibility spot-check |

**Exit gate:** UX review sign-off on staging; no payment UI creep.

---

### Wave 4 — Merchant onboarding foundation

| Pack theme | Examples |
|------------|----------|
| Signup | Merchant signup flow (staging) |
| Profile | Business profile, service catalog, hours/capacity |
| Legal copy | Merchant terms (draft); onboarding QA |
| Isolation | Tenant checks in onboarding path |

**Exit gate:** Limited-roster onboarding QA PASS; **not** open public production onboarding.

---

### Wave 5 — Ops / admin / support hardening

| Pack theme | Examples |
|------------|----------|
| Incidents | Incident playbook; support escalation |
| Taxonomy | Issue taxonomy; audit review cadence |
| Process | Pause/resume; operator training |
| UI | Operator dashboard hardening (read-only until finance unlock) |

**Exit gate:** Ops can run staged incidents without claiming production admin or payment dashboard.

---

### Wave 6 — Finance / payment architecture (docs-only)

| Pack theme | Examples |
|------------|----------|
| Design | Wallet ledger design; hold/debit/release/refund architecture |
| Risk | Settlement/payout risk model; invoice/tax notes |
| Gates | Finance approval gates; commercial pack index |
| **Implementation** | **None** until finance-approved Wave 7 |

**Exit gate:** Architecture docs + explicit finance sign-off record — **no** Prisma/Transaction/wallet code.

---

### Wave 7 — Commercial implementation (after finance approval)

| Pack theme | Examples |
|------------|----------|
| Credits | VIO Credits; commercial transaction source-of-truth |
| Provider | Payment provider integration (staging first) |
| Merchant | Fee model; refund/dispute flow |
| Pilot | Staged market pilot — limited geography/roster |

**Exit gate:** Finance-approved implementation packs only; staged pilot with pause criteria.

---

### Wave 8 — AI Copilot read-only

| Pack theme | Examples |
|------------|----------|
| Summary | Request summary; status explanation |
| Assist | Draft response; missing-info warning |
| Safety | **No** self-execution; no money actions |

**Exit gate:** Read-only AI PASS on staging; audit log for prompts/responses (redacted).

---

### Wave 9 — Human-confirmed AI actions

| Pack theme | Examples |
|------------|----------|
| Flow | Action suggestions; merchant/user confirmation |
| Control | Audit trail; rate limits; human override |
| Locks | No autonomous payment or SOS dispatch |

**Exit gate:** Every mutating AI path requires human confirm; failure → stop.

---

### Wave 10 — Global i18n / legal / market readiness

| Pack theme | Examples |
|------------|----------|
| Markets | Country readiness gates |
| Language | VI/EN + local language expansion plan |
| Compliance | GDPR/privacy; terms; support routing |
| Rollout | Market-by-market readiness matrix |

**Exit gate:** Legal/compliance review per target market — user/manual sign-off.

---

### Wave 11 — SOS / global lifeline safety

| Pack theme | Examples |
|------------|----------|
| Honesty | No fake rescue; consent; jurisdiction copy |
| Policy | Escalation policy; reliability gates |
| Providers | Provider/legal coverage **only when real** |

**Exit gate:** SOS production reliability **not claimed** until provider/legal evidence exists.

---

### Wave 12 — Growth / GTM / daily-use engine

| Pack theme | Examples |
|------------|----------|
| Loops | Onboarding loops; daily-use entry points |
| Retention | Retention cards; academy/content hooks |
| Acquisition | Merchant/customer acquisition (controlled) |
| Analytics | Analytics readiness (privacy-safe) |

**Exit gate:** GTM plan aligned with unlocked commercial + legal waves — no premature Global Active claim.

---

## 5. Pack count estimate (planning only)

| Scope | Realistic pack range | Notes |
|-------|----------------------|--------|
| Local no-charge market-limited pilot (finish + exit) | **~8–15** | Sessions, rollups, reviews, ops refinement |
| Broader no-charge / pilot readiness (Waves 1–3, partial 5) | **~20–35** | Cumulative with Wave 1 |
| Path to Global Active / full commercial (Waves 1–12) | **~80–130** | Planning estimate across product, finance, AI, SOS, GTM |

**Not a promise** of timeline, headcount, or automatic execution. Actual pack count depends on scope cuts, market choice, and finance/legal approvals.

---

## 6. Locked zones (do not open without explicit approval)

| Zone | Lock |
|------|------|
| Payment / wallet / commercial | Locked until **finance-approved** Wave 7 |
| AI autonomous actions | Locked until Wave 9+ with human-confirm architecture |
| SOS production reliability | Locked until Wave 11 with real provider/legal coverage |
| Production admin certification | Locked — ops remains staging read-only pilot |
| Global Active / full commercial claim | Locked until all wave exit gates + leadership sign-off |
| Native PASS | Locked until Wave 2 checklist on stable device |
| Local money law drift | **Pause** if `paymentCaptured`, `walletPhase` ≠ NONE, or non–`REQUEST_ONLY_NO_CHARGE` |

---

## 7. Cursor wave execution law

Cursor **may**:

| Allowed | Detail |
|---------|--------|
| One wave at a time | Complete checkpoint before starting next wave |
| Sub-batches | **2–5 packs** within the same wave and risk class |
| Validation | `git diff --check`, `tsc`, `lint`, `smoke` (and wave-specific smoke) after each batch |
| Reporting | PASS/FAIL, files changed, limitations, next wave — after each wave/batch |

Cursor **must not**:

| Forbidden | Detail |
|-----------|--------|
| Skip risk class | e.g. open Wave 7 payment code while Wave 1 pilot still failing |
| Auto-open next wave on green CI alone | Requires explicit user direction for next wave |
| Commit secrets | `.env.local`, credentials, production DB |
| Claim production / Global Active / commercial | In docs or code without wave exit gate |
| Implement wallet/Transaction | Without finance approval and Wave 7 scope |

**On failed validation:** Stop, report, fix within current pack scope only — do not expand into payment/AI/SOS.

---

## 8. User / manual-only areas

| Area | Owner |
|------|--------|
| Secrets | User — Supabase, Fly, payment provider, JWT |
| Production DB operations | User / DBA |
| Payment provider accounts & KYC | User / finance |
| Legal / compliance decisions | User / counsel |
| Pricing & fee approval | User / finance |
| App Store / Play certificates | User |
| Real merchant contracts / KYB / KYC | User / ops |
| SOS provider & legal coverage | User / legal |
| Major product & market prioritization | User / leadership |
| Finance approval to unlock Wave 7+ | User / finance |

---

## 9. Next recommended wave

| Priority | Action | Rationale |
|----------|--------|-------------|
| **1** | **Wave 1 exit signoff** — `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` (**done** @ `9619886`) |
| **2** | **Wave 2 re-run** — install app on stable device; complete manual checklist | RUN **NOT RUN** @ 2026-05-24 |
| **3** | **Wave 3** — `VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md`; start **Surface Audit** | May parallel Wave 2 RUN.2; UI-only |
| **4** | Optional **Session 6** smoke (Option A) | Continued corroboration if roster active |
| **Later** | Waves 4–6 docs/planning | Only with explicit scope |

**Do not start Wave 7** without finance approval and Wave 6 architecture sign-off.

---

## 10. Explicit non-goals (this roadmap pack)

- Not production launch
- Not commercial or payment readiness claim
- Not payment/wallet implementation pack
- Not autonomous AI actions
- Not SOS production reliability claim
- Not Global Active / full commercial claim **yet**
- Not open public merchant onboarding at scale
- Not bypass of Local pilot pause criteria or money law

---

## 11. Related documents

| Doc | Role |
|-----|------|
| `VIONA_PROJECT_KERNEL.md` | Operating core + money law |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md` | Pilot ops + pause |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` | Sessions 1–5 aggregate |
| `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` | Wave 1 exit criteria |
| `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_PREP.md` | Wave 2 native prep + checklist |
| `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` | Wave 2 run (**NOT RUN**) |
| `VIONA_WAVE_3_CONSUMER_UX_EXCELLENCE_PREP.md` | Wave 3 consumer UX prep |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_REVIEW_AFTER_SESSIONS_1_4.md` | Option A through session 5+ |
| `VIONA_LOCAL_NO_CHARGE_PILOT_READINESS_HANDOFF_1.md` | Handoff index |
| Session runbooks 1–5 | Per-session evidence |
