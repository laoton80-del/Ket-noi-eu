# VIONA Wave 3 — Consumer UX Excellence Prep

**Pack:** `VIONA.WAVE_3.CONSUMER_UX_EXCELLENCE.PREP.1`
**Master wave roadmap:** `docs/roadmap/VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md`
**Wave 1 exit:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md`
**Wave 2 native:** `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_PREP.md` · `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` (**NOT RUN**)
**Design references:** `docs/design/VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md`, `VIONA_ACTION_GRID_PATTERN.md`, `VIONA_NEON_GLASS_CARD_SYSTEM.md`
**Prep baseline HEAD:** `e2b43ef` — `docs(design): prepare Wave 3 consumer UX excellence`
**Prep date (UTC):** 2026-05-24
**Surface audit:** `docs/design/VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md` — **COMPLETE**
**Tile rules:** `docs/design/VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` — **COMPLETE** (`VIONA.WAVE_3.PREMIUM_APP_TILE_RULES.1`)
**Status:** **RULES COMPLETE** — next: `VIONA.WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY_VISIBILITY.1`

**Classification:** UX planning only — **not** production launch, **not** commercial/payment readiness, **not** Global Active / full commercial, **not** native production confidence.

---

## 1. Baseline

| Area | Status | Evidence |
|------|--------|----------|
| Wave 1 Local pilot signoff | **Complete** | `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` |
| Controlled pilot Sessions 1–5 | **PASS** | `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` |
| Wave 2 native RUN.1 | **NOT RUN** | `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` @ 2026-05-24 |
| Native production confidence | **Not achieved** | No completed native checklist PASS |
| Local money law | **Locked** | `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE** |
| Ops Audit API / Expo web | **PASS** (separate track) | Sessions 1–5 + session 2 §5 |
| Whole VIONA | Pre-commercial / staging-pilot foundation | Kernel |
| **Global Active / full commercial** | **Not yet** | Master wave roadmap |

---

## 2. UX intent (consumer target)

VIONA consumer experience should feel:

| Dimension | Target |
|-----------|--------|
| **Visual** | Super beautiful, premium, calm-but-powerful — not dashboard/admin/crypto |
| **Usability** | Easy to use, fast to understand, daily-use friendly |
| **Audience** | Clear for **Vietnamese abroad** and **local customers** |
| **Language** | Multilingual-friendly (VI primary, EN strong, local-language readiness path) |
| **Trust** | Trust-first — no-charge safety visible; no fake payment or rescue claims |
| **Daily use** | Obvious entry points; short titles; scannable module grid |

**North star (planning):** A premium companion super-app shell where Local / Travel / Academy / Business feel like one coherent **Premium App Tile** universe — not a long ugly dashboard.

---

## 3. Design laws (preserve — do not drift)

| Law | Requirement |
|-----|-------------|
| **Home standard** | Home is the design reference for shell, rail, and tile rhythm |
| **Premium App Tiles** | Consumer modules use compact premium tiles — not icon-only ambiguity |
| **Hybrid layout** | Major quick actions may be **larger hero tiles**; scenario/module cards stay **compact premium app tiles** |
| **Semantic glow** | Gold = premium/brand/CTA · Cyan = tech/interactive/focus · Emerald = verified/good status · Magenta = SOS/special/high attention |
| **Copy** | Short title + concise subtitle on every consumer tile |
| **Anti-patterns** | No long ugly dashboard rows for consumer modules; no random floating chrome |
| **Responsive** | Mobile-first; scale up to tablet/desktop without breaking tile grammar |

Cross-reference: `VIONA_GLOBAL_EXPERIENCE_MANIFESTO.md`, `VIONA_ACTION_GRID_PATTERN.md`.

---

## 4. Scope guardrails (Wave 3 must not)

| Forbidden | Reason |
|-----------|--------|
| Change Local **service logic** | Wave 3 is UX/copy/layout only |
| Change payment/wallet behavior | Money law locked |
| Open commercial copy | Pre-commercial pilot |
| Change API contracts | Out of Wave 3 scope |
| Change tenant isolation | Safety invariant |
| Expose Ops Audit on consumer tabs | Admin/debug only |
| SOS production claims | Wave 11 gate |
| Claim native production confidence | Wave 2 **NOT RUN** |
| Claim Global Active / full commercial | Wave 12 + leadership gate |

---

## 5. Proposed Wave 3 pack map (planning units)

| Pack | ID | Focus |
|------|-----|--------|
| **UX Audit Pack 1** | `WAVE_3.CONSUMER_UX_SURFACE_AUDIT.1` | Home / Local / Travel / Academy / Business surface inventory — **DONE** → `VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md` |
| **UX Standards Pack 2** | `WAVE_3.PREMIUM_APP_TILE_RULES.1` | Premium App Tile system rules — **DONE** → `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` |
| **Local UX Pack 3** | `WAVE_3.LOCAL_USER_STATUS_CLARITY.1` | User request status clarity (no-charge) |
| **Local UX Pack 4** | `WAVE_3.LOCAL_MERCHANT_STATUS_CLARITY.1` | Merchant status clarity |
| **Local UX Pack 5** | `WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY.1` | No-charge safety copy visibility |
| **Global Nav Pack 6** | `WAVE_3.DAILY_USE_ENTRY_POINTS.1` | Daily-use entry points + command rail alignment |
| **i18n UX Pack 7** | `WAVE_3.VI_EN_COPY_COMPRESSION.1` | VI/EN/local copy compression |
| **Responsive QA Pack 8** | `WAVE_3.RESPONSIVE_MATRIX.1` | Viewport matrix QA |
| **Accessibility Pack 9** | `WAVE_3.A11Y_TOUCH_CONTRAST.1` | Touch targets, contrast, hierarchy |
| **Final Wave 3 Review Pack 10** | `WAVE_3.UX_READINESS_REVIEW.1` | UX readiness review (staging; no commercial claim) |

**Execution:** One pack or sub-batch (2–5) at a time per master wave roadmap Cursor law; hard stop on validation failure.

---

## 6. First implementation recommendation

**Start with:** `VIONA.WAVE_3.PREMIUM_APP_TILE_RULES.1` (surface audit **complete** — `VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md`)

| Item | Detail |
|------|--------|
| **Type** | Docs/static audit only — inventory screens, tiles, copy themes, gaps |
| **Before** | Any UI implementation pack |
| **Output** | Surface audit doc with PASS/GAP per screen; no code in audit pack |
| **Surfaces** | Home, Local, Travel, Academy, Business (merchant-facing where consumer-visible), Account/Profile shell |

---

## 7. QA matrix (required for Wave 3 implementation packs)

### Viewports

| Viewport | Use |
|----------|-----|
| **390×844** | Mobile primary |
| **768×1024** | Tablet portrait |
| **1024×768** | Tablet landscape / small desktop |
| **1366×768** | Desktop hybrid |

### Content checks

| Check | Requirement |
|-------|-------------|
| **VI** | Primary copy readable; status labels correct |
| **EN** | Secondary copy parity where shipped |
| **Local-language readiness** | Extension points documented; no hard-coded-only blocks |
| **Forbidden commercial wording** | No paid booking, payout, settlement, escrow, guaranteed payment |
| **Claim discipline** | No production / native production / Global Active overclaim in UI copy |
| **No-charge safety** | Request-only; confirmed ≠ paid visible on Local surfaces |

---

## 8. Relation to native (Wave 2)

| Statement | Valid |
|-----------|-------|
| Wave 3 **may proceed** while native remains **NOT COMPLETED** | **Yes** |
| Wave 3 must **not** claim native production confidence | **Yes** |
| Expo web / API Ops evidence **does not** substitute native PASS | **Yes** |
| **Wave 2 RUN.2** should re-run on stable **physical** device when available | **Yes** |

Native status remains **NOT RUN / NOT COMPLETED** until `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` (or RUN.2) records checklist PASS on stable hardware.

---

## 9. Locked zones (unchanged)

| Zone | Status |
|------|--------|
| Payment / wallet / commercial implementation | **Locked** |
| Hold / debit / release / refund | **Locked** |
| Settlement / payout / cash-out / escrow | **Locked** |
| Production admin claim | **Locked** |
| Autonomous AI | **Locked** |
| SOS production reliability claim | **Locked** |
| Global Active / full commercial claim | **Locked** |
| Native PASS without real attestation | **Locked** |

---

## 10. Next action

| Priority | Action |
|----------|--------|
| **1** | **Local no-charge safety copy visibility** — `VIONA.WAVE_3.LOCAL_NO_CHARGE_SAFETY_COPY_VISIBILITY.1` |
| **2** | **Wave 2 RUN.2** — pending stable physical device + `com.ketnoiglobal.app` install |
| **3** | Optional Session 6+ HTTPS smoke — does not block Wave 3 audit |

**Do not** open payment UI or commercial packs under UX pressure.

---

## 11. Explicit non-goals

- Not production launch
- Not Global Active / full commercial VIONA
- Not commercial or payment readiness
- Not native or mobile production ready
- Not production admin
- Not autonomous AI or SOS production claims
- Not implementation in this prep pack

---

## 12. Related documents

| Doc | Role |
|-----|------|
| `VIONA_GLOBAL_ACTIVE_FULL_COMMERCIAL_MASTER_WAVE_ROADMAP.md` | Wave 3 map |
| `VIONA_WAVE_3_CONSUMER_UX_SURFACE_AUDIT.md` | Surface audit (**COMPLETE**) |
| `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` | Premium App Tile rules (**COMPLETE**) |
| `VIONA_LOCAL_NO_CHARGE_WAVE_1_EXIT_PILOT_SIGNOFF_CRITERIA.md` | Wave 3 entry criteria |
| `VIONA_WAVE_2_NATIVE_MOBILE_CONFIDENCE_RUN.md` | Native **NOT RUN** |
| `VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md` | API/web evidence |
| `VIONA_PROJECT_KERNEL.md` | Kernel pointers |
