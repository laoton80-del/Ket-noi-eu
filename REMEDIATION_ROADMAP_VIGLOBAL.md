# REMEDIATION ROADMAP — VIGLOBAL V4.0

**Source of truth:** `AUDIT_REPORT_VIGLOBAL.md`  
**Workspace:** `C:\KNG\ket-noi-eu`  
**Execution model:** Phase-ordered, no scope skipping (P0 -> P1 -> P2)  
**Constraint:** This roadmap is planning-only. No application code changes are included here.

---

## Delivery Rules

- **P0 first, always:** No P1/P2 rollout before P0 acceptance.
- **Definition of Done per item:**  
  1) Implementation complete, 2) tests added/updated, 3) no TS regressions, 4) release notes updated.
- **Validation gate per phase:** run `npx tsc --noEmit` and targeted functional smoke checks.

---

## P0 — CRITICAL BLOCKERS (SHOWSTOPPERS)

## P0.1 Server-authoritative monthly payouts (financial integrity)

1. **Exact issue**  
Monthly Hall-of-Fame payouts are currently app-triggered/mock and not guaranteed authoritative. This creates payout duplication, audit, and compliance risk.

2. **Target file path(s)**  
- `src/services/academy/MonthlyRewardService.ts`  
- `src/services/loyalty/LoyaltyService.ts`  
- `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`  
- `supabase/migrations/20260430_add_merchant_honeymoon_columns.sql` (pattern reference for migration style)  
- *(Backend counterpart, required)* payments/functions webhook layer + Supabase job scheduler

3. **How to fix (technical instruction)**  
- Move winner selection + payout execution to backend scheduled job (UTC monthly boundary).
- Add durable tables: `monthly_hall_of_fame`, `monthly_reward_distributions` with unique `(country_code, month_key, rank)` constraints.
- Use idempotency key pattern: `viglobal:monthly_reward:${country}:${month}:${rank}`.
- Make client read-only for monthly winners; remove/disable client payout trigger path.
- Persist reward ledger event with source + reason string for audit.

---

## P0.2 Charity deduction confidentiality & server enforcement

1. **Exact issue**  
CSR feature requires strict server-side 1% deduction from real platform net revenue. Current client wiring is notification-only and must not be treated as source of truth.

2. **Target file path(s)**  
- `src/services/fintech/CharityService.ts`  
- `src/services/PaymentsService.ts`  
- `src/components/ui/CharityWidget.tsx`  
- *(Backend counterpart, required)* Stripe success webhook / payment service + Supabase `charity_ledger`

3. **How to fix (technical instruction)**  
- Implement backend webhook step: compute `charity = platform_net_revenue * 0.01` after platform fee settlement.
- Insert into `charity_ledger(id, amount_added_usd, created_at)` server-side only.
- Expose read-only aggregate endpoint (`/charity/totals`) with caching.
- Keep client limited to `notify-payment` signal and aggregate display; never expose formula inputs.
- Add reconciliation job comparing Stripe settled fee totals vs charity_ledger monthly sum.

---

## P0.3 Global currency terminology integrity (VIG Token migration completeness)

1. **Exact issue**  
Legacy `Xu/Credits/Points` terms remain in user-facing and core configuration areas, causing product inconsistency and potential billing misunderstandings.

2. **Target file path(s)**  
- `src/config/pricingConfig.ts`  
- `src/screens/HocTapScreen.tsx`  
- `src/screens/WalletTopUpScreen.tsx`  
- `src/state/wallet.ts`  
- `src/services/PaymentsService.ts`  
- `src/i18n/strings.ts`

3. **How to fix (technical instruction)**  
- Define canonical naming matrix: `VIG Token` (display), `vigTokenBalance` (data model), legacy aliases only in compatibility layer.
- Replace user-facing copy and labels in UI + i18n resources.
- Keep API compatibility via typed adapters (deprecated mapping) until backend parity is complete.
- Add lint rule/check script to block new `Xu|Credits|Points` strings outside allowed legacy docs/comments.

---

## P1 — HIGH PRIORITY (CORE FEATURE COMPLETION)

## P1.1 Smart Trio switcher hard guardrails

1. **Exact issue**  
`SmartLanguageSwitcher` trusts caller-provided options; no component-level enforcement of max 3 languages + fallback safety.

2. **Target file path(s)**  
- `src/components/ui/SmartLanguageSwitcher.tsx`  
- `src/screens/b2c/MerchantStorefrontScreen.tsx`  
- `src/utils/languageMapper.ts`

3. **How to fix (technical instruction)**  
- Add internal clamp in switcher: dedupe + `slice(0, 3)` with deterministic ordering.
- Enforce guaranteed fallback chain (`vi` then `en`) when selected code is invalid.
- Add unit tests for country mappings and duplicate suppression.

---

## P1.2 Kids Leaderboard data realism + anti-duplication hardening

1. **Exact issue**  
Leaderboard and monthly winners are seeded/mock; no backend ranking API and no durable anti-duplication safeguards in app runtime restarts.

2. **Target file path(s)**  
- `src/services/academy/LeaderboardService.ts`  
- `src/services/academy/MonthlyRewardService.ts`  
- `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`

3. **How to fix (technical instruction)**  
- Replace seeded ranking with backend endpoint by country + week/month window.
- Add signed response metadata (`generated_at`, `period_key`, checksum).
- Store processed payout status in DB (not in-memory map/set).
- Add failure fallback state in UI (skeleton + retry + stale-data banner).

---

## P1.3 E-certificate export/print productionization

1. **Exact issue**  
Certificate export currently uses SVG sharing path; print-grade output pipeline is incomplete.

2. **Target file path(s)**  
- `src/components/academy/CertificateGenerator.tsx`  
- `src/components/academy/ShareAchievementButton.tsx`  
- `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`

3. **How to fix (technical instruction)**  
- Add `expo-print` path for PDF generation (A4 + landscape certificate template).
- Keep `expo-sharing` as secondary channel for social sharing.
- Add high-resolution asset constraints (logo, signatures, border raster quality).
- Add localized template variants per language/country where required.

---

## P1.4 AI persona boundary contracts

1. **Exact issue**  
Persona surfaces exist but shared contract boundaries are inconsistent; copy/behavior drift risk across Leona, Minh Khang, AI Teacher, and B2B Receptionist.

2. **Target file path(s)**  
- `src/navigation/routes.ts`  
- `src/services/ai/MinhKhangService.ts`  
- `src/services/ai/GeminiTeacherService.ts`  
- `src/services/b2b/ai/receptionistOrchestrator.ts`  
- `src/screens/academy/LiveAiTeacherScreen.tsx`

3. **How to fix (technical instruction)**  
- Define persona capability contract (`voice`, `vision`, `legal`, `merchant_ops`) in shared typed config.
- Route all persona prompts through standardized policy/context middleware.
- Add telemetry tags per persona for quality and cost tracking.

---

## P1.5 B2B honeymoon notifications durability

1. **Exact issue**  
Day 83/87/89 notifications rely on app runtime and in-memory checkpoint tracking.

2. **Target file path(s)**  
- `src/services/b2b/GrowthHookService.ts`  
- `src/services/b2b/AdBiddingService.ts`  
- `src/screens/b2b/MerchantDashboardScreen.tsx`

3. **How to fix (technical instruction)**  
- Move notification scheduling and checkpoint marking to backend scheduled tasks.
- Persist `notification_sent_at` per checkpoint in merchant campaign table.
- Keep app-side display as read-only reflection of backend truth.

---

## P2 — UI/UX & ENHANCEMENTS (POLISH)

## P2.1 Branding policy guardrails

1. **Exact issue**  
Residual mixed KNG/ViGlobal naming appears in cross-surface copy.

2. **Target file path(s)**  
- `src/config/appBrand.ts`  
- `src/config/commercialFlagshipMapping.ts`  
- `src/screens/LifeOSDashboard.tsx`  
- `src/screens/HomeScreen.tsx`

3. **How to fix (technical instruction)**  
- Introduce brand token usage policy (`publicName` for B2C, `internalName` for B2B/internals).
- Add CI content scan to flag forbidden brand terms by surface type.

---

## P2.2 Design-system exceptions for Kids surfaces

1. **Exact issue**  
Kids modules intentionally diverge from `.kn-glass`, but there is no documented design exception standard.

2. **Target file path(s)**  
- `src/screens/b2c/academy/VietKidsScreen.tsx`  
- `src/components/academy/TeacherAvatar.tsx`  
- `src/components/academy/KidsFlashcard.tsx`  
- `src/components/academy/KidsMatchingGame.tsx`

3. **How to fix (technical instruction)**  
- Add design-system note: “Kids mode” tokens (color, radius, motion, typography).
- Define allowed exception classes and accessibility contrast thresholds.
- Add motion budget policy for low-end device fallback.

---

## P2.3 Animation and interaction stress-hardening

1. **Exact issue**  
Rapid taps and repeated state transitions can still expose subtle race/UX roughness under load.

2. **Target file path(s)**  
- `src/components/academy/KidsFlashcard.tsx`  
- `src/components/academy/KidsMatchingGame.tsx`  
- `src/components/academy/TeacherAvatar.tsx`  
- `src/components/ui/CharityWidget.tsx`

3. **How to fix (technical instruction)**  
- Add explicit interaction lock windows where needed.
- Move expensive animation state to shared values only; avoid extra JS re-renders.
- Add lightweight FPS/interaction benchmark script for Android mid-tier devices.

---

## P2.4 Architecture cleanup and duplicate namespace reduction

1. **Exact issue**  
Residual duplicate/legacy service namespaces increase maintenance and drift risk.

2. **Target file path(s)**  
- `src/services/autonomy/*`  
- `src/services/b2b/*`  
- `src/services/marketplace/*`  
- `src/lifeOS/*`

3. **How to fix (technical instruction)**  
- Create a canonical service map (owner, purpose, replacement status).
- Deprecate and remove duplicate modules behind migration flags.
- Add import-boundary lint rules to prevent cross-layer leakage.

---

## Phase Acceptance Criteria

### P0 Exit Criteria
- Backend-authoritative monthly rewards live with DB idempotency.
- Charity 1% deduction computed only on server from private net revenue.
- User-facing currency terminology standardized to VIG Token in critical flows.

### P1 Exit Criteria
- Smart Trio hard caps + fallback tests complete.
- Leaderboard/certificate connected to backend-grade data flows.
- AI persona contracts and honeymoon notification durability implemented.

### P2 Exit Criteria
- Brand/content guardrails in CI.
- Kids design exception documentation approved.
- UI animation and architecture cleanup polish complete.

---

## Proposed Delivery Cadence

- **Sprint A (P0):** Financial integrity + confidentiality + terminology blockers  
- **Sprint B (P1):** Core feature completion and backend data authority  
- **Sprint C (P2):** UX polish, design governance, architecture hygiene

---

## PM Note

This roadmap is intentionally strict and phase-gated to minimize regression and compliance risk while preserving delivery velocity.
