# JIRA BACKLOG — VIGLOBAL REMEDIATION EXECUTION

**Source:** `REMEDIATION_ROADMAP_VIGLOBAL.md`  
**Ordering rule:** P0 -> P1 -> P2  
**Ticket keyspace:** `VIG-001` onward

---

## P0 — CRITICAL BLOCKERS

### [x] DONE [VIG-001] Implement Server-Authoritative Monthly Hall-of-Fame Payouts
- **Epic:** FinTech Engine / Academy Rewards Integrity
- **Priority:** P0
- **Story Points (Effort):** 8
- **User Story:** As an Admin, I need monthly winner payouts to run exclusively on backend schedules so that rewards are accurate, auditable, and not duplicated.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Monthly Top 3 winner selection and payout run in backend scheduled job (UTC month boundary).
  - [ ] Durable DB tables exist for monthly winners and distributions with unique constraints by country/month/rank.
  - [ ] Payouts use idempotency keys and cannot be applied twice across retries or app restarts.
  - [ ] Client app no longer triggers payout execution; it only reads monthly results.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/services/academy/MonthlyRewardService.ts`, `src/services/loyalty/LoyaltyService.ts`, `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`, `supabase/migrations/20260430_add_merchant_honeymoon_columns.sql`
- **Dependencies:** None

### [x] DONE [VIG-002] Enforce Server-Side 1% Charity Ledger Calculation
- **Epic:** FinTech Engine / CSR
- **Priority:** P0
- **Story Points (Effort):** 8
- **User Story:** As Leadership, I need charity deductions to be computed only server-side from net platform revenue so that margin logic remains confidential and compliant.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Stripe success webhook computes `charity = platform_net_revenue * 0.01` server-side only.
  - [ ] Supabase `charity_ledger` writes include `id`, `amount_added_usd`, and `created_at` with immutable audit trail.
  - [ ] Public endpoint returns aggregated totals only; no confidential fee inputs are exposed.
  - [ ] Client signal flow remains non-authoritative (notify only) and cannot force ledger writes.
  - [ ] Reconciliation job compares settled fee totals vs charity ledger totals monthly.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/services/fintech/CharityService.ts`, `src/services/PaymentsService.ts`, `src/components/ui/CharityWidget.tsx`
- **Dependencies:** None

### [x] DONE [VIG-003] Complete Global VIG Token Terminology Migration
- **Epic:** FinTech Engine / Product Consistency
- **Priority:** P0
- **Story Points (Effort):** 5
- **User Story:** As a User, I need a consistent “VIG Token” currency across app and billing surfaces so that pricing and rewards are unambiguous.
- **Acceptance Criteria (Definition of Done):**
  - [ ] User-facing `Xu`, `Credits`, `Points` labels are removed from core B2C/B2B surfaces and replaced with `VIG Token`.
  - [ ] Data-layer naming follows canonical terms (`vigTokenBalance`, `vigTokens`) with legacy compatibility adapters only where required.
  - [ ] i18n dictionary and pricing copy are synchronized with VIG terminology.
  - [ ] A lint/check script prevents new legacy currency strings outside explicitly allowed legacy compatibility comments.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/config/pricingConfig.ts`, `src/screens/HocTapScreen.tsx`, `src/screens/WalletTopUpScreen.tsx`, `src/state/wallet.ts`, `src/services/PaymentsService.ts`, `src/i18n/strings.ts`
- **Dependencies:** None

---

## P1 — HIGH PRIORITY

### [x] DONE [VIG-004] Add Smart Trio Hard Guardrails in Switcher
- **Epic:** Dual Branding / Smart Trio Language
- **Priority:** P1
- **Story Points (Effort):** 3
- **User Story:** As a User, I need language options strictly limited and safe so that booking UX remains simple and error-free.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Switcher internally deduplicates and caps options to max 3 regardless of caller input.
  - [ ] Invalid/unknown selection auto-falls back to `vi`, then `en`.
  - [ ] Merchant storefront passes only mapped Smart Trio options and handles null/empty country safely.
  - [ ] Unit tests cover dedupe, cap, and fallback behavior.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/components/ui/SmartLanguageSwitcher.tsx`, `src/screens/b2c/MerchantStorefrontScreen.tsx`, `src/utils/languageMapper.ts`
- **Dependencies:** VIG-003

### [x] DONE [VIG-005] Replace Mock Kids Leaderboard with Backend-Authoritative Data
- **Epic:** Academy / Gamification
- **Priority:** P1
- **Story Points (Effort):** 8
- **User Story:** As a Parent, I need real ranking data and stable reward state so that leaderboard results are trusted and motivating.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Weekly/monthly leaderboard data is fetched from backend API by country and period.
  - [ ] Response includes signed metadata (`generated_at`, `period_key`, checksum/version).
  - [ ] Reward processing state is persisted in DB, not memory maps.
  - [ ] UI has loading, retry, and stale-data fallback states.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/services/academy/LeaderboardService.ts`, `src/services/academy/MonthlyRewardService.ts`, `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`
- **Dependencies:** VIG-001

### [x] DONE [VIG-006] Productionize E-Certificate Download and Print Pipeline
- **Epic:** Academy / Social Sharing
- **Priority:** P1
- **Story Points (Effort):** 5
- **User Story:** As a Parent, I need high-quality downloadable and printable certificates so that achievements are shareable and frame-worthy.
- **Acceptance Criteria (Definition of Done):**
  - [ ] `expo-print` PDF generation path is implemented for print-grade output (landscape certificate template).
  - [ ] `expo-sharing` remains available as social share fallback.
  - [ ] Certificate assets meet high-resolution quality constraints (logo, border, signature).
  - [ ] Localization hooks exist for certificate text variants by language/country.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/components/academy/CertificateGenerator.tsx`, `src/components/academy/ShareAchievementButton.tsx`, `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`
- **Dependencies:** VIG-005

### [x] DONE [VIG-007] Standardize AI Persona Capability Contracts
- **Epic:** AI Platform / Persona Governance
- **Priority:** P1
- **Story Points (Effort):** 5
- **User Story:** As a System Architect, I need strict persona capability boundaries so that Leona, Minh Khang, AI Teacher, and B2B Receptionist stay consistent and isolated.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Shared typed persona capability contract is introduced and adopted.
  - [ ] Persona prompt execution routes through standardized policy/context middleware.
  - [ ] Telemetry includes persona tags for quality, cost, and incident tracing.
  - [ ] Route-level persona usage is aligned with contract definitions.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/navigation/routes.ts`, `src/services/ai/MinhKhangService.ts`, `src/services/ai/GeminiTeacherService.ts`, `src/services/b2b/ai/receptionistOrchestrator.ts`, `src/screens/academy/LiveAiTeacherScreen.tsx`
- **Dependencies:** None

### [x] DONE [VIG-008] Make 90-Day Honeymoon Notifications Durable and Backend-Scheduled
- **Epic:** B2B Lock-In / Growth Engine
- **Priority:** P1
- **Story Points (Effort):** 5
- **User Story:** As a Merchant, I need reliable day 83/87/89 pressure notifications and expiry state so that campaign behavior is predictable and fair.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Notification scheduling/checkpoint persistence moves to backend scheduled tasks.
  - [ ] Merchant notification checkpoints are durable (`notification_sent_at` per checkpoint).
  - [ ] App dashboard reflects backend truth (read-only projection).
  - [ ] Hard cut-off behavior remains correct under app restarts and multi-device usage.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/services/b2b/GrowthHookService.ts`, `src/services/b2b/AdBiddingService.ts`, `src/screens/b2b/MerchantDashboardScreen.tsx`
- **Dependencies:** None

---

## P2 — UI/UX & ENHANCEMENTS

### [x] DONE [VIG-009] Enforce B2C/B2B Branding Guardrails in CI
- **Epic:** Dual Branding / QA Governance
- **Priority:** P2
- **Story Points (Effort):** 3
- **User Story:** As Product Ops, I need automated brand term enforcement so that ViGlobal and KNG naming never leaks across wrong surfaces.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Brand token policy is formalized (`publicName` for B2C, `internalName` for B2B/internal contexts).
  - [ ] CI check scans for forbidden brand term usage by surface category.
  - [ ] Violations fail CI with actionable file-level output.
  - [ ] Existing known exceptions are documented with explicit allowlist.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/config/appBrand.ts`, `src/config/commercialFlagshipMapping.ts`, `src/screens/LifeOSDashboard.tsx`, `src/screens/HomeScreen.tsx`
- **Dependencies:** VIG-003

### [x] DONE [VIG-010] Formalize Kids Design-System Exception Pack
- **Epic:** Design System / Academy UX
- **Priority:** P2
- **Story Points (Effort):** 3
- **User Story:** As a Designer/Engineer, I need an approved “Kids mode” token set so that non-`.kn-glass` surfaces remain consistent and accessible.
- **Acceptance Criteria (Definition of Done):**
  - [ ] “Kids mode” design tokens (color, radius, typography, motion) are documented and versioned.
  - [ ] Accessibility constraints (contrast, touch targets) are explicitly defined and validated.
  - [ ] Component surfaces reference approved token set instead of ad hoc values.
  - [ ] Motion budget and low-end fallback policy are documented.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/screens/b2c/academy/VietKidsScreen.tsx`, `src/components/academy/TeacherAvatar.tsx`, `src/components/academy/KidsFlashcard.tsx`, `src/components/academy/KidsMatchingGame.tsx`
- **Dependencies:** VIG-006

### [x] DONE [VIG-011] Stress-Harden Academy and Charity Animations for Rapid Interactions
- **Epic:** QA / Performance
- **Priority:** P2
- **Story Points (Effort):** 3
- **User Story:** As a User, I need smooth interactions even under rapid tapping so that learning and donation feedback feel responsive and stable.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Critical interaction paths use explicit lock/debounce windows where required.
  - [ ] Reanimated shared values are used to reduce JS-thread churn for hot animations.
  - [ ] No visible race/flicker in rapid-tap scenarios across flashcard/game/widget interactions.
  - [ ] Lightweight FPS benchmark script/check is available for mid-tier Android devices.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/components/academy/KidsFlashcard.tsx`, `src/components/academy/KidsMatchingGame.tsx`, `src/components/academy/TeacherAvatar.tsx`, `src/components/ui/CharityWidget.tsx`
- **Dependencies:** VIG-010

### [x] DONE [VIG-012] Reduce Duplicate Namespace and Cross-Layer Drift
- **Epic:** Architecture / Platform Maintainability
- **Priority:** P2
- **Story Points (Effort):** 8
- **User Story:** As an Engineer, I need a canonical service/module map so that duplicate logic is removed and future changes are lower-risk.
- **Acceptance Criteria (Definition of Done):**
  - [ ] Canonical service ownership map is published for autonomy/b2b/marketplace/lifeOS domains.
  - [ ] Deprecated duplicate modules are marked and migrated behind controlled flags.
  - [ ] Import-boundary lint rules prevent cross-layer leakage.
  - [ ] Migration plan includes rollback strategy and phased removals.
  - [ ] `npx tsc --noEmit` passes and no `any` types are introduced in touched files.
- **Target Files:** `src/services/autonomy/*`, `src/services/b2b/*`, `src/services/marketplace/*`, `src/lifeOS/*`
- **Dependencies:** VIG-007

---

## Dependency Snapshot (Quick View)

- `VIG-005` depends on `VIG-001`
- `VIG-006` depends on `VIG-005`
- `VIG-004` depends on `VIG-003`
- `VIG-009` depends on `VIG-003`
- `VIG-010` depends on `VIG-006`
- `VIG-011` depends on `VIG-010`
- `VIG-012` depends on `VIG-007`

