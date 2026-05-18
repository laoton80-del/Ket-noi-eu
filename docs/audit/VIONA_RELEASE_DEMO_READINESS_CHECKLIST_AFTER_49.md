# VIONA Release / Demo Readiness Checklist (After #40–#49)

**Document ID:** `VIONA.RELEASE.DEMO_READINESS_CHECKLIST.1`  
**Type:** Readiness gate — docs only (no product code changes in this pack)  
**Baseline master:** `a780eae` — Merge branch `pack-af9-home-legacy-strips-consistency-audit`  
**Date authored:** 2026-05-18  
**Audience:** Founder delegate, release train owner, demo presenters, QA, engineering leads  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) — VIONA is **Global Vietnamese Companion OS + Super App Mini-App Platform**. **Do not remove functions from any universe.** Risky or non-production-ready surfaces must be **Lite / Demo / Pilot / Beta / Coming Soon / Gated / Frozen**, with safety copy, feature flags, and cost guards — never deleted or faked.

**Prior checkpoint:** `VIONA.MASTER_CHECKPOINT_AUDIT.AFTER_49.1`

---

## 1. Scope / baseline

### 1.1 Master baseline

| Check | Command / expectation | Pass criteria |
|-------|---------------------|---------------|
| Branch | `master` @ `a780eae` (or newer signed release tag) | Matches release candidate |
| Build green | `npm run typecheck` | Exit 0 |
| Lint | `npm run lint` | 0 errors (warnings tracked separately) |
| Smoke | `npm run smoke` | Navigation registry spot-check OK |
| Git clean for RC | `git status -sb` | No uncommitted app changes on RC branch |

### 1.2 Consumer spine milestones (#40–#49) — must remain on RC

| # | Milestone | Master anchor | Demo relevance |
|---|-----------|---------------|----------------|
| 40 | B2C foundation (Home, Travel, Local, SetupProfile, Account glass) | `2625e89` | Shell + world launchers |
| 41 | Academy Premium Hub | `b19be3a` | Academy tab hub |
| 42 | Travel Premium App Tiles | `4be5c7d` | Travel hub tiles |
| 43 | Local Premium App Tiles | `83b69bc` | Local hub tiles |
| 44 | SOS B2C modal premium tiles | `89de395` | Tab SOS modal |
| 45 | SOS emergency copy safety | `3522b7f` | Disclaimers, no fake dispatch copy |
| 46 | SOS calm tile polish | `c3a5695` | EmergencySOSScreen, TravelSosHub |
| 47 | Account / PersonalHub shell | `0b28494` | `PersonalHub` / Account |
| 48 | SetupProfile i18n + self-declared form | `ac1b499` | Profile setup/edit modal |
| 49 | Home mobile legacy strips | `a72b085` | Mobile/narrow Home only; desktop shell frozen |

### 1.3 Rules before any external demo

- [ ] **No functions removed** — every universe entry that existed on `a780eae` must still be reachable (may be gated, collapsed, or pilot-labeled).
- [ ] **No fake production** — presenters follow §8 “Do not say” and §4 Safety.
- [ ] **Feature flags documented** — note which flags are ON for this demo build (do not change flags in a docs-only pack).
- [ ] **Language** — confirm demo language (VI / EN) in app settings before recording.
- [ ] **Auth** — use pilot/test account; do not imply KYC/verified identity unless backend confirms.

### 1.4 Checks required before demo (minimum)

1. `npm run typecheck` + `npm run smoke` on RC commit.  
2. Manual route smoke (§3) on **390×844** and **1366×768** at minimum; **768×1024** if tablet web demo.  
3. Safety spot-check: SOS, Wallet, SetupProfile disclaimer (§4–§5).  
4. Brand/i18n spot-check on surfaces shown in script (§6–§7).  
5. Sign-off row in §9 for P0 blockers.

---

## 2. Universe readiness table

| Universe | Demo status | Primary routes / screens | Safe to show | Must frame (Lite / Demo / Pilot / Gated / Coming soon) | Known risks | Owner / next action |
|----------|-------------|--------------------------|--------------|--------------------------------------------------------|-------------|---------------------|
| **Home** | **partial** (desktop **ready**, mobile **partial**) | Tab `TabHome` → `/home`; world cards → Local/Travel/Academy/Business; legacy strips mobile only | Desktop opening stage, 4 world cards, command bar (VIO, SOS, Account), quick actions when `hubEnabled` | Mobile: briefing (demo), DashboardB2C (expand “More spaces”), ProactiveSuggestions (AI pilot) | Mobile web ≤768 uses legacy stack; `DashboardB2C` duplicates worlds when expanded | **Frozen:** desktop fashion shell. **Next:** optional LifeOS link only if in script |
| **Travel** | **partial** | Tab `TabTravel` → `TravelHub` / `TravelScreen`; stack: `TravelSosHub`, `EmergencySOS`, flights/hospitality/fixer routes | Hub scenarios, quick-help tiles, SOS hub entry, guidance copy | Deep booking, fixer checkout, hospitality purchase, flight search — **pilot/demo** unless backend verified | Some sub-screens retain **KNG** internal copy; fulfillment not production | **Next:** `VIONA.TRAVEL.APP_TILE_POLISH.2` or deep-flow audit; i18n sweep |
| **Local** | **partial** | Tab `TabLocal` → `LocalUniverse` / `LocalScreen`; merchant detail, discovery | Hub `LocalAppTile` grid, discovery browse, lite merchant flows | Marketplace auto-book, legal scan, wholesale — **pilot** per flags/copy | Classifieds/checkout claims must stay gated | **Next:** Local deep-flow + fulfillment copy audit |
| **Academy** | **partial** (hub **ready**, subs **needs audit**) | Tab `TabAi` → `AcademyScreen`; stack: `AdultLearningHome`, `KidsLearningHome`, `VietKids`, etc. | Academy hub glass, module entry with **Lite/Demo** badges | All learning outcomes, certificates, tutor booking — **demo / not official certification** | Sub-screens below hub standard; mixed i18n | **Next:** `VIONA.ACADEMY.SUBSCREENS_CONSISTENCY_AUDIT.1` |
| **SOS** | **pilot** (copy-safe) | Tab modal `SOSModal`; `EmergencySOS`; `TravelSosHub` | Guidance-first UI, country context, **confirm before `tel:`** where implemented | Live dispatch, GPS share to authorities, recording, background listen, “VIONA handles emergency” | Automation behind flags; numbers country-dependent | **Trust & Safety** sign-off per market matrix |
| **Account** | **ready** (demo) | `PersonalHub` (`/account`); Wallet, settings shortcuts | Personal hub shell, VIO credits framing, edit profile → SetupProfile | Wallet balance = in-app preview; partner/B2B upgrade paths | Balance may be local/sync preview | **Frozen:** shell from #47; copy-only packs OK |
| **SetupProfile** | **ready** (demo) | `SetupProfile` modal (`/SetupProfile`); edit from Account | Self-declared fields, country/residency/segment cycles, disclaimer | Any “verified” or government identity interpretation | Save logic unchanged — do not demo backend KYC | **Frozen:** save/auth behavior |
| **LifeOS** | **needs audit** | `LifeOSDashboard` (`/LifeOSDashboard`) | High-level “companion actions” if presenter knows pilot scope | Predictive AI, sell CTAs, legal widget — **pilot** | Widget UI not aligned with Premium App Tile standard | **Next:** `VIONA.LIFEOS_DASHBOARD.CONSISTENCY_AUDIT.1` |
| **Business / B2B** | **gated** / **needs audit** | Home world card → Business; `MerchantDashboard`, `B2BPaywall`, AI receptionist demo routes, admin (dev only) | Home Business card with **Pilot** badge; AI receptionist **demo** checklist | Live payments, auto-booking, inventory, bill print, KYC payouts | Admin/broker surfaces: ViGlobal/KNG naming; mock dashboards | **Next:** `VIONA.BUSINESS_B2B.READINESS_AUDIT.1`; never demo admin to public |

---

## 3. Route smoke checklist

**Environment:** Expo web `npx expo start --web` (or signed native build). Dismiss GDPR/intent with Skip / Để sau if shown. Use pilot user with profile filled.

**Per route — mark Pass/Fail/N/A + build id + date:**

| Route / screen | Opens | No crash | No raw `home.*` / `setupProfile.*` keys | No ViGlobal / KNG / VIG Token in **shown** UI | No fake production claim | Overflow 390 | Overflow 768 | Overflow 1024 | Overflow 1366 |
|----------------|-------|----------|----------------------------------------|---------------------------------------------|-------------------------|--------------|--------------|---------------|-----------------|
| Home `TabHome` / `/home` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Travel `TabTravel` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Local `TabLocal` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Academy `TabAi` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Account `PersonalHub` / `/account` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| SetupProfile `/SetupProfile` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| B2C `SOSModal` (tab SOS) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `EmergencySOS` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `TravelSosHub` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `LifeOSDashboard` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Business entry (Home card → B2B) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Merchant / B2B (if flagged on) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

### 3.1 Manual steps (abbreviated)

**Home**
1. Open `/home`. Desktop (≥769px): verify command bar, living hero, 4 world cards, optional “VIONA for you” quick actions.  
2. Mobile (390px): scroll legacy strips — trust pill, Care, tools panel, briefing; expand “More spaces” only if needed.  
3. Tap each world card — navigates to correct universe (no crash).

**Travel**
1. Open Travel tab — hub tiles render.  
2. Open one scenario tile (e.g. translation / emergency).  
3. Open Travel SOS hub if linked — tiles + disclaimer visible.

**Local**
1. Open Local tab — `LocalAppTile` grid.  
2. Open one discovery/merchant path — back navigation works.

**Academy**
1. Open Academy tab — hub modules with Lite/Demo labels.  
2. Open one module (e.g. Adult learning) — note framing; do not claim certification.

**Account**
1. Open Account — 560px-style column, shortcuts, credits framing.  
2. Tap edit profile → SetupProfile edit mode.

**SetupProfile**
1. Open `/SetupProfile` (onboarding or edit).  
2. Cycle country / residency / segment; invalid visa date shows error; disclaimer visible.

**SOS**
1. Tab SOS modal — tiles, no instant dial without confirmation path.  
2. `EmergencySOS` — confirm-before-dial on emergency lines where applicable.  
3. `TravelSosHub` — same safety pattern.

**LifeOS / Business**
1. Navigate to LifeOS only if in demo script — smoke open/scroll.  
2. Business: Home card only unless internal B2B demo — document flags first.

---

## 4. Safety checklist

| # | Requirement | Verify | Pass |
|---|-------------|--------|------|
| S1 | SOS does **not** replace local emergency services (112/911/ambulance) | Copy on modal + emergency screens | ☐ |
| S2 | `tel:` only after user confirmation where `confirmAndDial` / `confirmDialMission` exists | Tap emergency line — confirm dialog | ☐ |
| S3 | No copy implying VIONA **dispatches** responders or guarantees outcome | Read SOS headers/footers | ☐ |
| S4 | No fake **GPS live tracking** to authorities unless feature explicitly on + consented | SOS Plus / ping flows | ☐ |
| S5 | No **recording / background listening** claims on consumer demo path | Mic/camera flows | ☐ |
| S6 | Briefing / AI suggestions: **not** professional medical/legal/financial advice | Tap briefing card — demo alert | ☐ |
| S7 | Academy: **not** official certification / guaranteed job or visa outcome | Hub + learning screens | ☐ |
| S8 | SetupProfile / Account: **not** verified government identity | No verified badge on setup | ☐ |
| S9 | Travel/Local: **not** live booking/payment/fulfillment unless RC build + backend verified | Presenter script + env | ☐ |
| S10 | Leona / interpreter: **pilot** AI — not human emergency operator | Call/interpreter screens | ☐ |

---

## 5. Money / wallet / VIO checklist

| # | Requirement | Verify | Pass |
|---|-------------|--------|------|
| M1 | **VIO Credits** = in-app loyalty/credits for features — not bank money | Account, Home trust strip, Wallet | ☐ |
| M2 | No **cash-out** or withdrawable balance implication in consumer demo | Wallet, Home, top-up copy | ☐ |
| M3 | No **crypto** / investment / token sale wording in public consumer UI | Home VIO index, Wallet | ☐ |
| M4 | No **fake payment success** toast/UI without Stripe/backend confirmation | Top-up flow (if shown) | ☐ |
| M5 | No **active subscription / premium** claim unless entitlement API confirms | Account, Home | ☐ |
| M6 | No **payout / broker commission / supplier settlement** claims in B2C demo | Avoid broker/admin routes | ☐ |
| M7 | No **live wholesale / inventory / checkout** unless B2B pack signed off | B2B surfaces | ☐ |
| M8 | QR Pay tile: availability follows wallet flow — not universal POS | Home tools panel | ☐ |

---

## 6. Brand / i18n checklist

| # | Requirement | Pass |
|---|-------------|------|
| B1 | Public product brand = **VIONA** (lockup on Home, Account, Academy) | ☐ |
| B2 | Public points = **VIO Points** / **VIO Credits** (`getVioPointsLabel` / wallet copy) — not “VIG Token” in UI | ☐ |
| B3 | No public **ViGlobal** / **KNG** on consumer demo surfaces (Home, Travel hub, Local hub, Academy hub, Account, SetupProfile, SOS) | ☐ |
| B4 | **Smart Trio** — switch VI / EN in command bar or settings; spot-check visible strings | ☐ |
| B5 | Market-native language: document which locales are **not** demo-ready (CS/DE in `strings.ts` tables — spot-check if used) | ☐ |

### Known remaining i18n / brand debt (do not show in public demo without sweep)

| Area | Debt type | Action |
|------|-----------|--------|
| Academy sub-screens (`AdultLearningHome`, etc.) | Mixed maturity / hardcoded pockets | `VIONA.ACADEMY.SUBSCREENS_CONSISTENCY_AUDIT.1` |
| `LifeOSDashboard` | English widget copy; legacy layout | `VIONA.LIFEOS_DASHBOARD.CONSISTENCY_AUDIT.1` |
| Travel/Local **deep** flows (fixer, flights, hospitality) | KNG-era strings | `VIONA.I18N.BRAND_DRIFT_SWEEP.1` |
| `DashboardB2CScreen` (when expanded on Home) | Hardcoded VI marketing | Collapse by default (#49) or i18n pack |
| Business / B2B / Admin / Broker | ViGlobal, KNG, mock labels | `VIONA.BUSINESS_B2B.READINESS_AUDIT.1` |
| Admin-only | “Cash-Out”, “ViGlobal revenue” | Dev/internal only |

---

## 7. Responsive demo checklist

Mark **Pass/Fail** per viewport for surfaces **in demo script** (§8).

| Surface | 390×844 | 768×1024 | 1024×768 | 1366×768 | Notes |
|---------|---------|----------|----------|----------|-------|
| Home | ☐ | ☐ | ☐ | ☐ | ≤768 = legacy shell; ≥769 = fashion desktop |
| Travel hub | ☐ | ☐ | ☐ | ☐ | Tile grid / scroll |
| Local hub | ☐ | ☐ | ☐ | ☐ | Tile grid |
| Academy hub | ☐ | ☐ | ☐ | ☐ | Hub max-width ~1040 |
| SOS modal / emergency | ☐ | ☐ | ☐ | ☐ | Centered column ~520px on wide |
| Account | ☐ | ☐ | ☐ | ☐ | ~560px column |
| SetupProfile | ☐ | ☐ | ☐ | ☐ | ~560px card |

**Global:** no horizontal scrollbar on `documentElement`; bottom tab bar not covering primary CTA on 390 (scroll or `scrollBottomPad`).

---

## 8. Demo script (safe flow)

**Duration:** ~12–15 minutes  
**Build:** master `a780eae` or signed RC  
**Language:** Vietnamese (primary) or English — set before start  

### 8.1 Flow

| Step | Action | Say (example) |
|------|--------|----------------|
| 1 | Open **Home** (desktop if possible) | “VIONA is a companion OS — four worlds: Local, Travel, Academy, and Business.” |
| 2 | Point to world cards | “Each opens its own universe — we don’t merge them into one feed.” |
| 3 | **Travel** tab → one scenario tile | “Travel Lite helps with language and safety scenarios — pilot features, not a travel agency checkout.” |
| 4 | **Local** tab → one service tile | “Local connects community services — discovery and lite flows; not a guaranteed marketplace fulfillment.” |
| 5 | **Academy** tab → hub only | “Academy is AI-assisted learning — demo modules, not an official certificate.” |
| 6 | Tab **SOS** or Travel SOS hub | “SOS is guidance-first — it helps you reach local emergency numbers; VIONA does not dispatch ambulances.” |
| 7 | **Account** | “VIO Credits are used inside the app for features — they’re not cash or crypto.” |
| 8 | **SetupProfile** (edit) | “Profile data is self-declared for personalization — not government identity verification.” |
| 9 | Optional: expand Home “More spaces” | “Extra shortcuts for power users — same universes, optional panel.” |

### 8.2 Do not say (presenter warnings)

| Do not say | Why |
|------------|-----|
| “VIONA dispatches emergency services / sends an ambulance” | SOS is guidance + dial assist only |
| “VIO is money you can withdraw” or “crypto investment” | In-app credits only |
| “Bookings and payments are live and guaranteed” on Travel/Local | Unless RC + backend sign-off |
| “Wholesale checkout and inventory are production-ready” | B2B gated |
| “Academy certificates are government- or employer-official” | Demo / Lite education |
| “Identity is verified by VIONA or the state” | Self-declared profile only |
| “We are ViGlobal / KNG” in consumer pitch | Public brand is **VIONA** |

---

## 9. Release blockers

### P0 — stop external demo until resolved

| ID | Blocker | Owner |
|----|---------|-------|
| P0-1 | Build not green (`typecheck` / `smoke` fail on RC) | Release train |
| P0-2 | Crash on any route in §3 demo script | Engineering |
| P0-3 | Raw i18n keys visible on demo surfaces | i18n / surface owner |
| P0-4 | Consumer UI claims verified identity, guaranteed emergency response, or cash/crypto VIO | Trust & Safety + CPO |
| P0-5 | SOS dials without confirmation on RC build | Trust & Safety |

*As of checkpoint `a780eae`, no P0 code defects were recorded in master audit — **re-validate on your RC build**.*

### P1 — before public beta

| ID | Item |
|----|------|
| P1-1 | Academy sub-screen consistency + certification copy audit |
| P1-2 | LifeOS dashboard consistency or explicit “pilot hub” gate |
| P1-3 | Brand drift sweep (KNG/ViGlobal) on Travel/Local deep flows shown to users |
| P1-4 | Country-specific SOS number matrix reviewed for demo markets |
| P1-5 | Wallet top-up / credits: backend truth vs local preview documented |

### P2 — after first demo

| ID | Item |
|----|------|
| P2-1 | Business/B2B readiness audit + merchant pilot boundaries |
| P2-2 | Travel final polish pass |
| P2-3 | Home mobile legacy strip further polish (non-blocking if desktop demo) |
| P2-4 | Automated visual regression (Playwright) in CI optional |

---

## 10. Recommended next engineering packs

| Priority | Pack | Purpose |
|----------|------|---------|
| 1 | `VIONA.ACADEMY.SUBSCREENS_CONSISTENCY_AUDIT.1` | Close largest consumer UI gap below Academy hub |
| 2 | `VIONA.I18N.BRAND_DRIFT_SWEEP.1` | KNG/ViGlobal/hardcoded sweep on user-visible paths |
| 3 | `VIONA.LIFEOS_DASHBOARD.CONSISTENCY_AUDIT.1` | Align or gate LifeOS before featuring in demos |
| 4 | `VIONA.BUSINESS_B2B.READINESS_AUDIT.1` | B2B/Merchant demo boundaries before partner pilots |
| 5 | `VIONA.TRAVEL.APP_TILE_POLISH.2` | Optional hub/deep polish after audits |

---

## Sign-off

| Role | Name | Date | RC commit | Demo approved (Y/N) |
|------|------|------|-----------|---------------------|
| Release train | | | | |
| Trust & Safety (SOS) | | | | |
| CPO / Founder delegate | | | | |

---

*End of checklist — `VIONA.RELEASE.DEMO_READINESS_CHECKLIST.1`*
