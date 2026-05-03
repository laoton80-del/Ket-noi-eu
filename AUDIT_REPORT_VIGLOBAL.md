# AUDIT REPORT — VIGLOBAL V4.0 ULTRA MASTER BLUEPRINT

**Project:** ViGlobal (formerly KNG)  
**Workspace:** `C:\KNG\ket-noi-eu`  
**Audit Type:** Deep static code audit (architecture, product intent, implementation fidelity)  
**Audit Timestamp:** 2026-04-30  
**TypeScript Status:** `npx tsc --noEmit` passed during audit

---

## Executive Summary

The ecosystem shows strong momentum with substantial implementation across branding, loyalty/fintech, Viet-Kids gamification, and B2B lock-in mechanics.  
However, there are critical consistency gaps between blueprint intent and production-grade behavior:

- Legacy currency language (`Xu`, `Credits`, `Points`) still exists broadly in user-facing and core services.
- Monthly Hall-of-Fame rewards are currently client-triggered/mock, not server-scheduled authoritative payout logic.
- Smart Trio language rendering depends on caller-provided options (safe in current storefront usage), but component-level hard caps are not enforced.
- B2B/B2C brand boundary is mostly good, yet some mixed terminology remains in cross-surface files.

---

## Domain Scores

| Domain | Score (/10) |
|---|---:|
| 1. Dual Branding & Smart Trio Language | **7.5** |
| 2. VIG Token & FinTech Engine | **6.5** |
| 3. 3 Universes & 4 AI Personas | **8.0** |
| 4. Viet-Kids Academy & Gamification | **8.5** |
| 5. B2B Merchant Lock-In (90-Day Trap) | **8.5** |
| 6. Code Architecture & Strictness | **8.0** |

---

## 1) DUAL BRANDING & SMART TRIO LANGUAGE — **7.5/10**

### Flawlessly Implemented
- Public branding config is clean and explicit in `src/config/brandConfig.ts` (`publicName: ViGlobal`, `internalName: KNG`).
- App identity in Expo config is correct (`name: ViGlobal`, package remains KNG-aligned) in `app.json`.
- Auth branding panel correctly presents public-facing identity with internal ecosystem acknowledgment in `src/screens/auth/WelcomeScreen.tsx`.
- Smart Trio mapping and dedupe logic are correctly implemented in `src/utils/languageMapper.ts`.
- Storefront uses Smart Trio options from country context in `src/screens/b2c/MerchantStorefrontScreen.tsx`.

### Missing / Broken / Risky
- `SmartLanguageSwitcher` does not enforce max 3 options at component boundary; it trusts caller input.
- Brand references to legacy KNG naming still appear in mixed B2C/B2B contexts (terminology drift risk).
- No global branding lint/guardrail to prevent accidental KNG leakage into B2C copy.

### Exact File Paths Needing Attention
- `src/components/ui/SmartLanguageSwitcher.tsx`
- `src/screens/b2c/MerchantStorefrontScreen.tsx`
- `src/config/appBrand.ts`
- `src/config/commercialFlagshipMapping.ts`
- `src/screens/LifeOSDashboard.tsx`

---

## 2) VIG TOKEN & FINTECH ENGINE — **6.5/10**

### Flawlessly Implemented
- VIG token icon is premium metallic gold with glow in `src/components/ui/VigTokenIcon.tsx`.
- Split-fee pricing authority is centralized and configurable in `src/config/pricingConfig.ts`.
- Local Fixer split math and Stripe destination charge planning are correctly structured in `src/services/travel/LocalFixerService.ts`.
- Loyalty service supports VIG token grants and tier updates in `src/services/loyalty/LoyaltyService.ts`.
- AI billing VIG rates (Leona/Minh Khang) implemented in `src/services/ai/AiBillingService.ts`.

### Missing / Broken / Risky
- Legacy currency vocabulary remains widespread (`Xu`, `Credits`, `Points`) in UI and pricing comments/constants.
- Partial rename state introduces mixed semantics (VIG + Xu/Credits simultaneously), confusing users and finance reporting.
- Monthly reward payouts currently use in-memory/mock flow (not persisted/ledger-backed).

### Exact File Paths Needing Attention
- `src/config/pricingConfig.ts` (legacy `Xu` terminology)
- `src/screens/HocTapScreen.tsx` (user-facing Xu/Credits copy)
- `src/screens/WalletTopUpScreen.tsx`
- `src/state/wallet.ts`
- `src/services/academy/MonthlyRewardService.ts` (non-authoritative payout engine)

---

## 3) THE 3 UNIVERSES & 4 AI PERSONAS — **8.0/10**

### Flawlessly Implemented
- Structural separation exists for Local/Travel/Academy through route and screen organization.
- Travel universe has dedicated SOS/fixer/flight modules and wiring.
- AI persona implementation exists across:
  - Leona: call workflows (`LeonaCall`, voice services)
  - Minh Khang: legal/interpreter pathways
  - AI Teacher: academy flow (`LiveAiTeacher`, Gemini service)
  - B2B AI Receptionist: merchant-facing orchestration and panels

### Missing / Broken / Risky
- Persona boundaries are present but not uniformly enforced by shared contracts (copy + behavior can bleed across modules).
- Some modules remain mock-oriented for production-critical AI flows.
- Naming consistency across persona surfaces is uneven (mixed legacy labels).

### Exact File Paths Needing Attention
- `src/navigation/routes.ts`
- `src/services/ai/MinhKhangService.ts`
- `src/services/ai/GeminiTeacherService.ts`
- `src/services/b2b/ai/receptionistOrchestrator.ts`
- `src/components/b2b/VoiceAiReceptionistMerchantPanel.tsx`
- `src/screens/academy/LiveAiTeacherScreen.tsx`

---

## 4) VIET-KIDS ACADEMY & GAMIFICATION — **8.5/10**

### Flawlessly Implemented
- AI Teacher avatar with emotion states and reanimated interactions exists and is integrated.
- Interactive flashcards with animated flip, audio, and pronunciation scoring implemented.
- Matching mini-game implemented with cue, correctness feedback, and confetti behavior.
- Kids leaderboard screen (weekly + monthly tab) and share workflows are present.
- Monthly certificate component and share/export mechanism are implemented.

### Missing / Broken / Risky
- Leaderboard and monthly hall-of-fame data are currently mock/seeded, not backend-authoritative.
- Monthly rewards are triggered from app flow, not true cron/server scheduler.
- Certificate flow uses generated SVG share path; print-grade pipeline (`expo-print`) is not implemented.
- Potential duplicate award risks over long-term if memory state resets between app sessions (idempotency not persisted server-side).

### Exact File Paths Needing Attention
- `src/services/academy/LeaderboardService.ts`
- `src/services/academy/MonthlyRewardService.ts`
- `src/components/academy/CertificateGenerator.tsx`
- `src/components/academy/ShareAchievementButton.tsx`
- `src/screens/b2c/academy/KidsLeaderboardScreen.tsx`

---

## 5) B2B MERCHANT LOCK-IN (90-DAY TRAP) — **8.5/10**

### Flawlessly Implemented
- UTC-based countdown logic and expiry calculations are correctly implemented.
- Checkpoint notifications for day 83/87/89 are implemented.
- Effective bid power behavior and hard cut-off semantics are present.
- Merchant dashboard renders active countdown and expired urgency CTA.
- Supabase migration includes UTC columns and defaults.

### Missing / Broken / Risky
- Notification scheduling is app-runtime dependent; guaranteed delivery requires backend job orchestration.
- Merchant registry/checkpoint maps are in-memory process state (not durable).
- Demo merchant ID in dashboard can mask real multi-tenant behavior.

### Exact File Paths Needing Attention
- `src/services/b2b/GrowthHookService.ts`
- `src/screens/b2b/MerchantDashboardScreen.tsx`
- `src/services/b2b/AdBiddingService.ts`
- `src/types/merchant.ts`
- `supabase/migrations/20260430_add_merchant_honeymoon_columns.sql`

---

## 6) CODE ARCHITECTURE & STRICTNESS — **8.0/10**

### Flawlessly Implemented
- TypeScript strict compile passes (`npx tsc --noEmit`).
- No direct `any` type usages detected in `src/` type declarations during this scan.
- UTC handling quality is strong in growth hooks and SQL migration.
- Layering is mostly coherent: `config/`, `services/`, `screens/`, `components/`.

### Missing / Broken / Risky
- Residual duplicate/legacy files and naming drift increase maintenance risk.
- `.kn-glass` visual consistency is intentionally broken in kids modules (by design), but no formal design-system exception contract exists.
- Multiple domains still carry legacy nomenclature and mixed monetization lexicon.

### Exact File Paths Needing Attention
- `src/config/pricingConfig.ts`
- `src/screens/HocTapScreen.tsx`
- `src/screens/LifeOSDashboard.tsx`
- `src/screens/b2c/academy/VietKidsScreen.tsx` (intentional non-glass; needs design-system annotation)
- `src/services/autonomy/*` and duplicated service namespaces (consistency review)

---

## High-Priority Remediation Queue (No Code Changes Applied In This Audit)

1. **Server-authoritative monthly rewards** (cron + durable idempotency + ledger audit trail).  
2. **Global terminology cleanup** for all user-facing `Xu/Credits/Points` to `VIG Token`.  
3. **SmartLanguageSwitcher hard guardrails** (max 3 options and fallback safety at component boundary).  
4. **Certificate print pipeline** upgrade to print-optimized output path.  
5. **Brand policy enforcement** to prevent KNG leakage in B2C text surfaces.

---

## Auditor Note

This report intentionally focuses on implementation fidelity, risk posture, and blueprint conformance.  
No fixes were applied per request; this file is analysis-only.
