# VIONA Web UI Product Audit

**Scope:** Brand Shell Refresh P0 — web preview at `http://localhost:8085/home` (local), super-app / mini-app direction, public brand **VIONA**.  
**Method:** Static code review + route/navigation/copy trace. **Live browser:** not available from the audit environment (localhost blocked); conclusions are evidence-backed from `src/` and `src/i18n/locales/en.json`.  
**Date:** 2026-05-05  
**Constraint:** No code changes in this task; this document only.

---

## 1. Executive Summary

| Question | Assessment |
|----------|------------|
| **App hiện nhìn đã giống VIONA chưa?** | **Partially.** Core consumer surfaces (Home hero lines, VIONA Briefing, Dashboard B2C universe cards, Local header) lean **VIONA**. Legacy naming still appears in **config + i18n + a few boot/marketing strings**, so the product does not read as 100% VIONA yet. |
| **Còn cảm giác ViGlobal/KNG cũ không?** | **Yes, in places.** `APP_BRAND.publicName` is still **ViGlobal** (`src/config/appBrand.ts`). Home renders the B2C eyebrow via `brandNameForSurface('b2c')` → **ViGlobal** while adjacent copy says **VIONA** (`src/screens/HomeScreen.tsx`). Merchant EN strings reference **ViGlobal** and **VIG Tokens** (`src/i18n/locales/en.json` `b2b.rankingBanner`). Boot gate shows **Kết Nối Global** (`src/components/TrustPreflightGate.tsx`). |
| **Có quá nhiều feature gây rối không?** | **Moderate risk.** B2C shell exposes four hubs (Hub / Local / Travel Lite / Academy Lite) plus deep merchant/broker/admin decks when roles unlock — aligned with super-app vision but **heavy for a first-time web preview** without progressive disclosure. |
| **Có điểm nào làm user mất niềm tin không?** | **Risk on merchant demo path:** ranking nudge copy mixes **ViGlobal**, **VIG Tokens**, and urgent “drop ranking” tone while wallet product naming elsewhere is **VIO** (`vioDisplayConfig`, `WalletTopUpScreen`). That inconsistency reads as immature or unfinished rather than malicious. |
| **Có điểm nào cần sửa trước merchant demo không?** | **Yes — P0 copy/brand alignment** on merchant EN strings + Home eyebrow + any first-run boot string merchants might screen-record. AI Receptionist demo/pilot surfaces already carry **simulated / no payment / manual review** language (strong). |

---

## 2. P0 Issues — Must Fix Before Demo

| Area | Issue | User Impact | Evidence | Recommendation |
|------|-------|-------------|----------|----------------|
| **Brand / Home** | Hero **eyebrow** shows **ViGlobal** while headline/subhead say **VIONA** | First screen feels **split-brand**; undermines “VIONA is the public brand” story | `HomeScreen.tsx` uses `brandNameForSurface('b2c')`; `appBrand.ts` sets `publicName: 'ViGlobal'` | Use **`brandConfig.displayName`** (or dedicated `publicBrandName`) for B2C hero eyebrow so it matches VIONA P0; keep `appBrand` only where legacy/legal truly required. |
| **Brand / config** | Two canonical brand sources: **`brandConfig` (VIONA)** vs **`APP_BRAND` (ViGlobal / KNG / Kết Nối Global)** | Engineering + UI drift; easy to ship mixed strings | `src/core/brand/brandConfig.ts` vs `src/config/appBrand.ts` | Document single **public** vs **internal** mapping; migrate B2C-visible call sites off `APP_BRAND.publicName` where P0 requires VIONA. |
| **Merchant / i18n** | EN **ranking banner** references **ViGlobal** and **VIG Tokens** | Merchant demo: looks like **wrong product** + **token wording** conflicts with VIO public naming | `src/i18n/locales/en.json` → `b2b.rankingBanner.softNudgeBody`, `criticalBody` | Replace ViGlobal → **VIONA**; replace “VIG Tokens” with **VIO Points / VIO Credits** per `vioDisplayConfig`; soften coercive tone if demo is not live billing. |
| **Merchant / dashboard** | Mock revenue line uses **`formatVigTokenNumber`** / **`TODAY_REVENUE_VIG`** | Screenshot risk: **VIG** unit on revenue tile while consumer wallet uses **VIO** language elsewhere | `MerchantDashboardScreen.tsx` (`TODAY_REVENUE_VIG`, `formatVigTokenNumber`); stats use `b2b.stats.revenueLine` with `{{vig}}` | Align label with **VIO Credits** (or neutral “credits”) for public demo OR add explicit “mock / illustrative” sublabel. |
| **Trust / boot** | Cold-start gate copy: **“Kết Nối Global - Đang bảo mật…”** | Public web preview reads **legacy master brand**, not VIONA | `TrustPreflightGate.tsx` | For web P0, show **VIONA** + short security line; keep legacy only if legal name must appear (then pair VIONA + legal subtitle). |
| **B2B paywall (if surfaced)** | Copy references **ViGlobal**, **VIG Token top-up** | Merchant trust: **token** framing + legacy brand | `B2BPaywallScreen.tsx` (grep ViGlobal / VIG) | P0 if paywall appears in demo path: align to **VIONA** + **VIO** naming + non-crypto disclaimer tone. |

*Web runtime blockers (Mapbox, zustand `import.meta`, FastImage, `jsonwebtoken` barrel) were addressed in prior tasks; this audit assumes web loads past those.*

---

## 3. P1 Issues — Before Beta

| Area | Issue | User Impact | Recommendation |
|------|-------|-------------|----------------|
| **Navigation** | Tab **“Hub”** vs mental model **“Home”**; **Academy Lite** on route that hosts AI shell | Slight **cognitive mismatch** for non-internal users | `v7FourUniversesBlueprint.ts` `V7_B2C_TAB_LABELS` | A/B test labels: “Home”, “AI”, or tooltip on first visit; align marketing name to route purpose. |
| **Super-app density** | **Universe 01–03** cards + pills on Dashboard + Home briefing | Power users OK; **new users** may feel marketed-at | `DashboardB2CScreen.tsx`, `HomeScreen.tsx` | Add **one-line** “Start here” or collapse Travel/Academy when flags off. |
| **Visual system** | **VigTokenIcon** still named/implied “Vig” while badge shows **VIO Points** | Minor **iconography vs naming** friction | `DashboardB2CScreen.tsx` uses `VigTokenIcon` + `formatVioPoints` | Rename icon component or swap asset to VIO-neutral mark for P1 polish. |
| **Local** | Rich **mock** classifieds + booking flows; success `Alert.alert('VIONA', 'Success!')` is generic | Functional but **not polished** feedback | `LocalScreen.tsx` | Replace generic alert with structured toast + next-step copy. |
| **i18n parity** | Merchant ranking strings likely **EN-only** audit here; **vi/cs/de** may still carry legacy | Non-EN demos see drift | `src/i18n/locales/*.json` | Audit `b2b.rankingBanner` across locales for VIONA/VIO. |
| **Mesh / network** | Radar component Vietnamese: **“người dùng Kết Nối Global”** | Legacy brand leak if surfaced | `MeshRadar.tsx` | VIONA wording if shown on web. |

---

## 4. P2 Issues — Later Polish

| Area | Issue | Recommendation |
|------|-------|----------------|
| **Web** | RN **shadow** props on cards (Dashboard badge/universe cards) | Expect console warnings; tune `boxShadow` via web style adapter or reduce shadows on web. |
| **Typography** | Mixed **EN/VI** in same hero (by design for diaspora) but hierarchy could be tighter | Optional locale-split hero for web. |
| **Motion** | Haptics / audio on Home — fine on native; web may ignore | Gate or noop for web parity. |
| **Internal naming** | Comments / server modules still say ViGlobal/KNG | Harmless for users; cleanup for OSS/compliance narrative later. |
| **Map** | Web placeholder is **clear and honest** | Optional: add “Preview” chip in nav title when Radar route opened on web. |

---

## 5. Screen-by-Screen Review

Scoring: **Good** / **Needs work** / **Risky**

| Screen | Brand Fit | Clarity | Trust | Visual Quality | Main Fix |
|--------|-----------|---------|-------|----------------|----------|
| **Home** | Needs work | Good | Good | Good | Align **eyebrow** with VIONA (`brandNameForSurface` vs `brandConfig`). |
| **Dashboard B2C** | Good | Good | Good | Good | Optional: tab rename / icon semantic polish. |
| **Local** | Good | Good | Good | Good | Sharpen **success** feedback; ensure VIP cost always shown as **VIO Credits** (already `formatVioCredits`). |
| **Merchant Dashboard** | Risky | Good | Needs work | Good | **i18n ranking** + mock **VIG** revenue label vs **VIO** public story. |
| **AI Receptionist setup** | Good | Good | Good | Good | None blocking; optional VIONA kicker on header. |
| **AI Receptionist demo** | Good | Good | Good | Good | **SIMULATED DEMO** + disclaimers — keep visible in any recording. |
| **AI Receptionist pilot request** | Good | Good | Good | Good | Consent block is explicit (VIONA, no prod AI, no payment) — strong. |
| **Wallet / VIO** | Good | Good | Good | Good | `WalletTopUpScreen` uses **VIO Credits** in alerts/UI; ensure any remaining “VIG” only in legacy/internal contexts. |
| **Main tabs** | Needs work | Needs work | Good | Good | **Hub / Academy Lite** naming vs user expectations. |

---

## 6. Navigation / Super App Complexity

- **User mới có hiểu app làm gì không?** Partially. Home + Dashboard explain **VIONA** hubs, but tab labels (**Hub**, **Travel Lite**, **Academy Lite**) read as **internal product vocabulary** unless onboarding explains them.
- **Quá nhiều universe cùng lúc?** On large web width, **multiple universe cards + briefing** can feel busy; acceptable for **power** positioning, heavy for **casual**.
- **Mini-app status (active/beta/frozen)?** Feature gates show **MVP off** alerts in code paths (`mvpSurfaceGate` messages referenced from `HomeScreen` imports); **visible consistency** of “beta” chips across tabs is not uniform — **P1**.
- **Tab labels dễ hiểu?** Mixed — **Local** is clear; **Hub** is abstract; **Academy Lite** on AI route may confuse (blueprint comment admits route hosts Leona shell).
- **CTA vào feature chưa ready?** **Alert** paths for disabled travel/academy/rewards (`DashboardB2CScreen`) are honest (“not available in this MVP build”) — **good** for trust.

---

## 7. Brand / Copy Review

| Check | Status |
|-------|--------|
| **VIONA public brand** | Strong on Home body, Local hero, Dashboard cards, pilot consent. |
| **VIO Points / VIO Credits** | Centralized in `vioDisplayLabels` / `WalletTopUpScreen` — **good**. |
| **Avoid VIG Token public** | **Gap** on merchant EN ranking + merchant mock revenue uses **VIG** token formatting. |
| **Avoid KNG / Kết Nối Global public** | **Boot gate** + `APP_BRAND` still surface legacy; **MeshRadar** string if shown. |
| **Token không giống crypto / không rút** | `getVioDisclaimer()` text is strong; ensure **merchant** strings don’t imply withdrawable token economy. |
| **AI không hứa production** | Demo + pilot copy **explicit** — **good**. |

---

## 8. Trust & Safety Review

| Check | Status |
|-------|--------|
| **AI Receptionist simulated/demo** | **Yes** — badge + disclaimer card + transcript note (`AiReceptionistDemoSimulatorScreen.tsx`). |
| **Pilot consent** | **Yes** — VIONA named; no prod automation; no payment/booking/call (`AiReceptionistPilotRequestScreen.tsx`). |
| **Wallet / VIO disclaimer** | **Partial** — product has `getVioDisclaimer()`; confirm it is **surfaced** wherever balance is shown prominently (not re-audited line-by-line here). |
| **Payment/booking “live” confusion** | Local flow uses real-ish booking helpers; **copy** should continue to distinguish mock vs production — **P1** review per flow. |
| **Map web placeholder** | **Yes** — English placeholder; clear expectation to open mobile app (`AppMap.web.tsx`). |

---

## 9. Recommended UI Fix Plan

- **Fix Pack A — Brand/copy cleanup:** `HomeScreen` eyebrow; `TrustPreflightGate` boot; `b2b.rankingBanner` EN (+ other locales); `B2BPaywallScreen` if in demo path; `MeshRadar` if visible.  
- **Fix Pack B — Home hero + first impression:** Single brand spine line under logo; reduce competing kicker count on first fold (web).  
- **Fix Pack C — Navigation simplification:** Tab label pass (`Hub` → `Home` or contextual); first-run tooltip for **Academy Lite** vs AI.  
- **Fix Pack D — AI Receptionist polish:** Optional VIONA header kicker on setup checklist; keep **SIMULATED** high contrast on demo.  
- **Fix Pack E — Wallet/VIO trust polish:** Audit wallet header/subheader for disclaimer visibility; align any residual “VIG” in merchant mock with **VIO** or “illustrative credits”.  
- **Fix Pack F — Web-only polish:** Shadow warnings; max-width for hero on ultra-wide; test **8085** keyboard focus on pilot form.

---

## 10. Smallest Next Code Task

**Goal:** Remove the loudest **P0 split-brand** signals without touching auth/payment logic.

**Suggested smallest change (≤ 5 files):**

1. `src/screens/HomeScreen.tsx` — replace hero eyebrow `brandNameForSurface('b2c')` with `brandConfig.displayName` (or equivalent single source of truth for **public** B2C).  
2. `src/i18n/locales/en.json` — update `b2b.rankingBanner.*` strings: ViGlobal → **VIONA**, VIG Tokens → **VIO Points / VIO Credits** per policy.  
3. `src/i18n/locales/vi.json` (and `cs.json` / `de.json` if same keys carry legacy) — parity pass for `b2b.rankingBanner`.  
4. `src/components/TrustPreflightGate.tsx` — user-visible boot line to **VIONA** + security (legal subtitle optional).  
5. *(Optional if merchant demo hits paywall)* `src/screens/b2b/B2BPaywallScreen.tsx` — headline/subhead ViGlobal/VIG alignment only.

---

## 11. Final Recommendation

**B. Need P0 UI cleanup before demo** — with a strong subset of **D. Trust/copy cleanup** driven by **merchant i18n + Home eyebrow + boot gate**, not by AI Receptionist surfaces (those are already careful).

---

## Appendix — Commands Run (audit hygiene)

| Command | Result |
|---------|--------|
| `git status --short` | `?? metro-web-bundle.js` (untracked local artifact; consider `.gitignore` or delete outside git — not part of VIONA UI). |
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** (0 errors; existing repo warnings unchanged) |

---

## Printed Summary (per instructions)

### P0 issues (short list)

1. Home **ViGlobal** eyebrow vs **VIONA** hero (`HomeScreen` + `appBrand`).  
2. **Dual brand config** (`brandConfig` vs `APP_BRAND`).  
3. Merchant **EN ranking** ViGlobal + **VIG Tokens**.  
4. Merchant dashboard **mock revenue** uses **VIG** formatting.  
5. **TrustPreflightGate** “Kết Nối Global” boot copy.  
6. **B2BPaywall** legacy strings if shown in demo.

### Smallest next code task

**Home eyebrow + merchant `b2b.rankingBanner` i18n + boot gate line** (3–5 files) to align **public VIONA + VIO** without touching JWT, payments, or gates logic.

### Recommendation letter

**B** — Need P0 UI cleanup before demo.
