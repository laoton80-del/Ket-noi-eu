# ViGlobal Omniversal Prime Blueprint — Codebase Audit

**Workspace:** `C:\KNG\ket-noi-eu`  
**Scope:** `src/`, `prisma/schema.prisma`, root config (`app.config.js`, `App.tsx`), representative `functions/` references.  
**Method:** Static scan (grep, semantic search, file reads). No runtime E2E.  
**Date:** 2026-04-30  

This report maps the **six Core Pillars** to **evidence in the repo**. Items marked **MISSING** or **PARTIAL** are honest gaps: copy, mocks, or admin-only surfaces do **not** count as production-complete integrations unless noted.

---

### Pillar 1: IDENTITY & BORDER CONTROL

- [x] **ViGlobal product branding & naming** — Gold/navy visual system, “ViGlobal” copy, heart-fund naming (`src/theme/theme.ts`, `src/components/ui/CharityWidget.tsx` “Quỹ Trái Tim ViGlobal”, `src/config/appBrand.ts` via `APP_BRAND` in `App.tsx`).
- [x] **App identity / shell constraints** — `app.config.js` (name, slug, scheme `ketnoiglobal`), brand badge overlay in `App.tsx`.
- [ ] **End-user Dark/Light theme toggle (system or in-app)** — **MISSING** as a user-controlled or `useColorScheme`-driven experience. `src/theme/appModeThemes.ts` defines `b2cTheme` (light) and `b2bTheme` (dark), but the root navigator uses **`navigationTheme = b2cTheme` fixed** (`App.tsx`); B2B workspace screens are wrapped in `ThemeProvider value={b2bTheme}` only inside `B2BWorkspaceGate`. This is **role-shell duality**, not a universal dual-theme product control. No `Appearance` / `useColorScheme` usage found under `src/`.
- [x] **Dual navigation theming (B2C light vs B2B dark stack)** — `App.tsx` (`b2cTheme` + `B2BWorkspaceGate` + `b2bTheme`).
- [x] **“Smart” multi-language UX** — `src/components/ui/SmartLanguageSwitcher.tsx`; storefront uses VI/EN/CS/DE copy matrices (`src/screens/b2c/MerchantStorefrontScreen.tsx`). i18n + `src/i18n/strings.ts` language options (VI, EN, CS, DE).
- [ ] **Blueprint label “Smart Trio” as exactly three languages** — **PARTIAL / naming**: Implementation supports **four** storefront languages and broader app i18n; there is no identifier literally named “Smart Trio” in code—capability exists under **Smart Language Switcher** + country-driven options.
- [x] **+84 border block for B2B merchant registration (diaspora-only policy)** — `src/services/auth/AuthService.ts` (`B2B_DOMESTIC_VIETNAM_PHONE_PREFIX`, `registerMerchant`, `isDomesticVietnamDialForMerchantPolicy`, `normalizePhoneForB2BPrefixCheck`).

---

### Pillar 2: 4 UNIVERSES

#### Hub (CSR / “Heart Fund”)

- [x] **CSR Heart Fund UI surface** — `src/components/ui/CharityWidget.tsx` (“Quỹ Trái Tim ViGlobal”, animated total, heart icon).
- [ ] **Fully wired charity ledger without optional API** — **PARTIAL**: `src/services/fintech/CharityService.ts` `readCharityLedgerTotals()` returns **zeros** when `EXPO_PUBLIC_PAYMENTS_API_BASE` is unset; production depends on external payments API. Webhook-side 1% logic is **documented** and **client `processCharityLedgerServerOnly` throws by design** (server-only contract).

#### Local (B2B booking)

- [x] **B2C Local / classifieds-style surfaces** — e.g. `src/screens/b2c/LocalScreen.tsx`, routes `LocalUniverse`, `TabLocal`.
- [x] **B2B booking / queue metaphor** — `src/screens/b2b/InboundQueueScreen.tsx` + `src/state/b2bBooking.ts` (voice AI meta on bookings).
- [x] **Merchant operational tabs** — `MainTabNavigator` B2B tabs (`TabMerchant`, `TabCatalog`, `TabOrders`, `TabEarnings`).

#### Travel (Skyscanner, SOS, Local Fixer)

- [ ] **Skyscanner (or equivalent) live flight booking integration** — **MISSING** as a real API integration. Evidence explicitly says upcoming: `src/screens/b2c/TravelScreen.tsx` (“Duffel / Skyscanner (tích hợp sắp tới)”), `src/services/travel/FlightApiService.ts` (design notes), `src/screens/b2c/travel/FlightSearchScreen.tsx` (demo / affiliate messaging).
- [x] **Flight search / travel stack routes** — `TravelFlightSearch` → `FlightSearchScreen`, `TravelHub`, `TravelCompanion`, etc. (`App.tsx`, `src/navigation/routes.ts`).
- [x] **SOS “neon” high-visibility floating action** — `src/components/SOSFloatingButton.tsx` (red/gold gradient, Reanimated pulse ring; used in `MainTabNavigator.tsx` for B2C shell). Full-screen SOS flows: `EmergencySOSScreen`, `TravelSosHub`, etc.
- [x] **Local Fixer marketplace & checkout** — `src/screens/b2c/travel/LocalFixerScreen.tsx`, `LocalFixerCheckoutScreen`, `FixerEarningsScreen`, `src/services/travel/LocalFixerService.ts`, `src/services/travel/localFixerCatalog.ts`.

#### Academy (Leaderboards)

- [x] **Kids leaderboard (VietKids path)** — `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`, `src/services/academy/LeaderboardService.ts` (API + local fallback), `VietKidsScreen` navigates to `KidsLeaderboard`.
- [ ] **Adult Academy leaderboard** — **MISSING** in `src/screens/learning/` (no leaderboard references). Adult path: `AdultLearningHome`, `HocTapScreen`, `LiveAiTeacher` exist without a parallel **leaderboard** screen.

---

### Pillar 3: 4 AI PERSONAS

*Prisma enum `AIPersona` aligns with four slots:* `LEONA | MINH_KHANG | TEACHER | RECEPTIONIST` (`prisma/schema.prisma`).

- [x] **AI Leona** — Routes/persona `leona`: `LeonaCallScreen`, `src/config/aiPrompts.ts`, `src/config/aiPersonaCapabilities.ts` (`leona`), commercial mapping in `src/config/commercialFlagshipMapping.ts`.
- [x] **AI Minh Khang (voice / interpreter / CSKH)** — `LeTanScreen`, `MinhKhangService`, `LiveInterpreter` persona `minh_khang`, prompts in `src/config/aiPrompts.ts`, `TravelCompanionScreen` quick actions.
- [x] **AI Minh Khang / vision-adjacent surfaces** — `AiEyeScreen`, `VaultScreen` / document flows (document AI stack under `src/services/documentAI/`, `src/screens/VaultScreen.tsx`) — **present** as product surfaces; full production OCR/vision pipeline depends on configured providers.
- [x] **AI Teacher** — `LiveAiTeacherScreen`, `TeacherPrompt`, persona `ai_teacher`, `AcademyScreen` / learning routes.
- [ ] **B2B AI Receptionist on Twilio (live telephony)** — **PARTIAL / mostly mock**: `src/services/ai/VoiceReceptionistService.ts` explicitly “architecture sketch” with **simulated** pipelines; `MerchantDetailScreen` calls `voiceReceptionistService.initiateCall` / `simulateFunctionCallingPipeline`. **No** `functions/src/*twilio*` files found; Twilio secrets exist in `src/config/env.ts` for **server** use but **end-to-end Twilio Voice in repo is not implemented as production-ready**.

---

### Pillar 4: FINTECH & LOCK-IN

- [x] **VIG token domain model & transfers** — `prisma/schema.prisma` (`balanceVIG`, `TxType`, roles), `src/services/WalletService.ts`, `src/controllers/WalletController.ts`, wallet APIs under `src/services/api/`.
- [x] **Tourism dual split fee (server-authoritative)** — `computeTourismDualSplitAmounts`, `resolveTouristTrustFeeRate` in `src/services/WalletService.ts`; `src/services/api/TourismHubService.ts`, `src/controllers/TourismController.ts`, client quote/book via `src/services/api/paymentApi.ts`.
- [ ] **Stripe Connect live onboarding & real money movement** — **PARTIAL**: `src/services/fintech/StripeConnectService.ts` is explicitly **mock** KYC/onboarding messaging; real Connect depends on external Stripe dashboard + secrets (`src/config/env.ts` documents `STRIPE_*` — not proof of live Connect in app code).
- [x] **SaaS tier concept (3+ commercial tiers)** — `src/screens/commercial/GlobalTiersScreen.tsx`, `ProSubscriptionPaywall.tsx` (“Bảng giá SaaS B2B”), `src/config/monetization/*` (`PRICING_AUTHORITY`, `GLOBAL_COMMERCIAL_TIERS`), Prisma `UserTier` enum `STANDARD | POWER | ELITE`.
- [x] **Auto-tip → payroll distribution (logic present)** — `src/services/b2b/PayrollService.ts` (“Auto-distributes daily Stripe tips…”), used from `src/screens/commercial/DashboardScreen.tsx`.
- [ ] **End-to-end payroll paid to real bank accounts** — **PARTIAL**: Implementation is **software logic + mocks** unless backed by live payroll rails (not evidenced in static scan).

---

### Pillar 5: MARTECH

- [x] **Broker QR acquisition path** — `src/screens/broker/BrokerQrTabScreen.tsx`, `MAIN_TAB.BROKER.qr`, deep-link examples in `BrokerDashboardScreen.tsx`.
- [x] **“Trojan Horse” narrative in B2B promo** — `src/screens/b2b/PromoToolsScreen.tsx` (explicit “Trojan Horse” strategy copy).
- [ ] **“90-Day Trap” named campaign / timer logic** — **MISSING** — no code or config reference to a 90-day retention trap (grep across `src/` returned no meaningful hit).
- [x] **Flyer / deep-link “cannon” (universal links & paths)** — `App.tsx` `rootLinking` config (`TabHome`, `broker-merchants`, `MerchantStorefront`, etc.), scheme `ketnoiglobal` in `app.config.js`, `src/services/api/BrokerService.ts` URL builder for `MerchantStorefront`.
- [ ] **Outbound AI Sales — live Twilio cold calling** — **PARTIAL**: `src/services/marketing/OutboundAiSalesService.ts` uses **mock** Twilio CallSid / provisioning; CRM state `src/state/outboundAiSalesCrm.ts`; UI `src/screens/admin/OutboundCampaignScreen.tsx` is **admin/debug gated** (`isAdminDebugSurfaceEnabled()` in `App.tsx`). Not a generally available CEO-facing production campaign runner in the consumer shell.

---

### Pillar 6: 10/10 STRICTNESS

- [x] **Zero TypeScript `any` in typed sources (strict check)** — Repository scan: **no** matches for `as any` or `: any` type annotations in `*.ts` / `*.tsx` under the project root (excluding natural-language “any” in **comments** / UI strings, e.g. `AdminCommandCenter` “Search any user…”).
- [ ] **Absolute zero occurrences of the word “any”** — **NOT MET** — English copy and comments still contain “any” (`src/screens/admin/AdminCommandCenter.tsx`, doc comments in `documentScanProvider.ts`, etc.). If the pillar means **only** “no `any` type,” treat as **[x]**; if literal word ban, **[ ]**.
- [x] **Responsive / adaptive layouts (partial coverage)** — `useWindowDimensions` in `MainTabNavigator.tsx` (web sidebar tabs), `useDeviceLayout` / `AdaptiveContainer` (`InboundQueueScreen`, etc.), multiple admin/B2B screens with desktop breakpoints (`SponsoredAdsScreen`, `PromoToolsScreen`, `FacebookWarRoomScreen`, …).
- [ ] **Universal responsive strictness on every screen** — **PARTIAL** — many screens are mobile-first; not all surfaces use shared adaptive primitives.

---

## Database schema (Prisma) — blueprint alignment snapshot

**File:** `prisma/schema.prisma`

| Area | Evidence |
|------|----------|
| Roles | `B2C`, `B2B`, `B2B_EU`, `B2B_VN`, `ADMIN`, `BROKER` |
| User tiers | `UserTier`: `STANDARD`, `POWER`, `ELITE` |
| Transactions | Rich `TxType` including `BOOKING`, `QR_MERCHANT`, `BROKER_COMMISSION`, `CHARITY_FEE`, `PLATFORM_FEE`, … |
| Tourism | `TourismBookingStatus`, `BizType` for Vietnam inbound vertical |
| AI personas | `AIPersona` enum matches four persona slots |

*Full relational coverage requires reading remaining models in the same file (bookings, businesses, wallet ledger)—this audit confirms **schema intent** aligns with blueprint pillars, not that every migration is applied in all environments.*

---

## Executive honesty summary

| Pillar | Strongest evidence | Largest gaps |
|--------|--------------------|--------------|
| 1 | +84 B2B gate, branding, Smart language UI | User-global dark/light toggle |
| 2 | Heart widget, travel/fixture routes, kids leaderboard | Live Skyscanner/Duffel; adult leaderboard |
| 3 | All four personas represented in code & schema | Live Twilio receptionist + realtime voice |
| 4 | VIG + dual-split tourism math in services | Live Stripe Connect + bank payroll |
| 5 | QR broker tab, deep links, Trojan copy | “90-day trap”; outbound is mock/admin |
| 6 | No `any` types found in TS | “Strictness” ≠ all screens fully adaptive |

---

*End of report.*
