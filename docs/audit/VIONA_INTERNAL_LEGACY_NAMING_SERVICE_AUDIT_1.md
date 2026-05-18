# VIONA.INTERNAL_LEGACY_NAMING_SERVICE_AUDIT.1

**Document ID:** `VIONA.INTERNAL_LEGACY_NAMING_SERVICE_AUDIT.1`  
**Type:** Read-only internal legacy naming / service-path audit (report only)  
**Branch:** `pack-af24-internal-legacy-naming-service-audit`  
**Base master:** `d904075` — `chore(dev): merge tier1 locale helper hygiene`  
**Prior waves:** Brand drift sweep (`9f38c23` area), loyalty catalog cleanup, SOS copy safety packs (`404212a`–`5eb5666`), Tier-1 locale expansion, dev helper hygiene (`d904075`)  
**Date:** 2026-05-16  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) §1.1, [Global Active/Full lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md), [Brand Drift Sweep](./VIONA_I18N_BRAND_DRIFT_SWEEP_1.md), [Tier-1 locale completeness](./VIONA_I18N_TIER1_LOCALE_COMPLETENESS_AUDIT_1.md).

**Method:** ripgrep across `src/**`, `prisma/schema.prisma`, spot-read of high-risk screens/services. **No** broad rename, **no** runtime changes in this pack.

**Product vision (unchanged):** VIONA targets **Active / Full globally**. Legacy **KNG / ViGlobal / VIG Token** names are **implementation debt**, not public brand law.

---

## Summary

| Item | Result |
|------|--------|
| **Overall risk level** | **Medium–low** — Tier-0 i18n and main B2C travel/loyalty/catalog surfaces are largely aligned with **VIONA / VIO Credits**. Remaining risk is **clustered** in gated B2B/admin/broker UI, **service-layer error strings**, and **notification / demo-tour defaults**. |
| **Public leak risk count** | **9** screen/UI findings (mostly gated or vi-only hardcoded) |
| **Service-path risk count** | **16** user-reachable message/title strings |
| **Internal-only count** | **200+** identifiers/comments (types, stores, Prisma fields, API module names) — **safe if not surfaced** |
| **Persisted/API risk count** | **40+** schema fields & storage contracts (`*VIG`, `vigToken*`, `kngNet*`, `kngLoyalty` store module) |
| **Recommended next pack** | **`VIONA.I18N.SERVICE_MESSAGE_VIO_REBRAND.1`** (service toasts/errors) then **`VIONA.I18N.B2B_ADMIN_BROKER_PUBLIC_COPY.1`** |

### Progress since brand drift sweep (2026-05-16)

| Area | Prior audit | Current master |
|------|-------------|----------------|
| `src/i18n/locales/*` public keys | KNG/VIG Token risks | **Clean** — ripgrep finds **no** `KNG`, `ViGlobal`, `VIG Token` in locale JSON |
| `loyaltyRewardsCatalog.ts` | KNG Local, VIG Token titles | **Fixed** — VIONA Local, VIO Credits copy |
| B2C travel screens (`LocalFixer*`, `FlightSearch`, homestay) | `KNG Travel` chrome | **Fixed** — no matches in `src/screens/b2c/travel/` |
| Tourism price display | `formatVigTokenNumber` → `VIG` suffix | **Fixed** — `currency.ts` routes through `getVioCreditsLabel()` → **VIO Credits** |
| SOS locale overlays | unsafe CS/DE GPS | Addressed in SOS hygiene packs |

---

## Public / user-facing findings

| Term | File | Context | User-facing? | Risk class | Recommended action | Suggested pack |
|------|------|---------|--------------|------------|-------------------|----------------|
| KNG | `src/screens/TienIchScreen.tsx` | Alert: `…hợp đồng KNG` | **Yes** (utilities) | Public leak | Replace with **VIONA** partner lead copy | `VIONA.I18N.B2B_ADMIN_BROKER_PUBLIC_COPY.1` |
| KNG | `src/screens/b2b/AdBiddingScreen.tsx` | Body: `Feed B2C KNG Local…` | **Yes** (B2B merchant) | Public leak | **VIONA Local** | Same |
| KNG | `src/screens/b2b/InternalTradeMarketScreen.tsx` | `hệ sinh thái KNG` | **Yes** (B2B) | Public leak | **VIONA** ecosystem | Same |
| KNG | `src/screens/b2b/SmartCalendarScreen.tsx` | `Phí Nền Tảng KNG`, `1% biên KNG` | **Yes** (B2B) | Public leak | **VIONA** platform fee (demo) | Same |
| KNG | `src/screens/admin/FacebookWarRoomScreen.tsx` | `merchant KNG`, `Link KNG` (mock marketing UI) | **Yes** (admin/dev) | Public leak (ops) | **VIONA** in visible labels; keep `ketnoiglobal.com` URL internal | Same (admin-only) |
| ViGlobal | `src/screens/admin/AdminDashboardScreen.tsx` | KPI: `ViGlobal revenue cut` | **Yes** (admin) | Public leak (ops) | **VIONA** revenue cut | Same |
| ViGlobal | `src/screens/broker/BrokerDashboardScreen.tsx` | Errors/help: `ViGlobal account`, `ViGlobal web`, `viglobal://` deep link | **Yes** (broker shell) | Public leak | **VIONA** account; document `viglobal://` scheme as legacy URI until migration | `VIONA.I18N.BROKER_SHELL_COPY.1` |
| KNG | `src/services/auth/b2bMerchantPhonePolicy.ts` | `Hệ thống kinh doanh B2B của KNG…` | **Yes** (signup error) | Service-path → public | **VIONA** B2B policy message | `VIONA.I18N.SERVICE_MESSAGE_VIO_REBRAND.1` |
| ViGlobal | `src/services/ux/AppTourService.ts` | Tour: `Welcome to ViGlobal Hub`, Academy demo line | **Yes** (demo tour overlay) | Public leak | **VIONA Hub**; wire to i18n | `VIONA.UX.APP_TOUR_DEMO_COPY.1` |

**Not found on master (fixed since prior sweep):** `KNG Travel` in travel screens, `KNG`/`VIG Token` in `loyaltyRewardsCatalog.ts`, `KNG`/`VIG Token` in locale JSON, `KNG` in main `src/screens/b2c/*` consumer paths (except gated cash-out routes using Vietnamese “rút tiền” framing with separate compliance review).

**Cash-out / withdraw surfaces (review, not auto-blocker):** `CashOutScreen`, `ReferralRewardScreen`, `WalletTopUpScreen`, `KOLPartnerDashboard` use **cash-out / rút tiền** Vietnamese copy — gated by flags/MVP; body disclaimers exist in places. Treat as **monetization compliance** pack, not legacy brand rename.

---

## Service-path findings

Messages, alerts, or notification titles that can reach users without passing through i18n.

| Term | File | Context | User-facing? | Risk class | Recommended action | Suggested pack |
|------|------|---------|--------------|------------|-------------------|----------------|
| VIG Token | `src/services/ai/AiBillingService.ts` | `message`: insufficient balance | **Yes** | Service-path | Use `getVioCreditsLabel()` / i18n | `VIONA.I18N.SERVICE_MESSAGE_VIO_REBRAND.1` |
| VIG Token | `src/services/loyalty/LoyaltyService.ts` | `message`: redeem insufficient | **Yes** | Service-path | Same (Loyalty UI mostly uses VIO labels; service still leaks) | Same |
| VIG Token | `src/services/fintech/WalletService.ts` | Multiple `messageVi` P2P transfer errors | **Yes** | Service-path | **VIO Credits** wording | Same |
| VIG Tokens | `src/services/liveInterpreterService.ts` | Energy depleted banner | **Yes** | Service-path | **VIO Credits** + pilot top-up | Same |
| VIG Tokens | `src/services/ai/AIEngine.ts` | `ENERGY_DEPLETED` constant | **Yes** | Service-path | Same | Same |
| VIG Token | `src/services/PaymentsService.ts` | `amountLabel`: `VIG Token/cuộc`, `VIG Token/lượt` | **Yes** (Leona pricing UI) | Service-path | **VIO Credits** via display helpers | Same |
| VIG Token | `src/services/fintech/StripeConnectService.ts` | Mock summary: `Stripe+KNG 1%` | **Yes** (B2B checkout preview) | Service-path | **VIONA** margin label | `VIONA.I18N.B2B_ADMIN_BROKER_PUBLIC_COPY.1` |
| ViGlobal | `src/services/notifications/centralDispatcherExecution.ts` | Default push `title` fallback `'ViGlobal'` | **Yes** | Service-path | Default **VIONA** | `VIONA.NOTIFICATIONS.DEFAULT_TITLE_VIONA.1` |
| ViGlobal | `src/services/payment/VietQRService.ts` | Default transfer `purpose` memo | **Maybe** (bank memo) | Service-path | Default **VIONA** | Same |
| ViGlobal | `src/services/compliance/gdprErasureService.ts` | Success copy mentions ViGlobal server | **Yes** | Service-path | **VIONA** | Service message pack |
| ViGlobal | `src/services/comms/useP2PVoiceCall.ts` | JWT error string | **Yes** | Service-path | **VIONA API** | Same |
| ViGlobal | `src/services/booking/V7OfflineFailsafe.ts` | Push template `ViGlobal Alert: New booking confirmed` | **Yes** (merchant) | Service-path | **VIONA** + demo framing | Same + fulfillment copy audit |
| VIG Token | `src/monetization/v7MerchantTrialTrap.ts` | Trial trap message | **Yes** (merchant) | Service-path | **VIO Credits** | Service message pack |
| ViGlobal | `src/services/auth/EmailOtpService.ts` | `MAIL_BRAND_NAME` default `'ViGlobal'` | **Yes** (email) | Service-path | Env default **VIONA** | Ops/config pack |
| ViGlobal | `src/services/marketing/*` | Demo/sandbox Facebook copy, hashtags | **Dev/admin** | Service-path (low) | Freeze demo-only; no consumer route | Document only |
| KNG | `src/services/fintech/StripeConnectService.ts` | Comments + user-facing mock fee line | Mixed | Service-path | See B2B copy pack | Same |

**Demo sandbox (`DemoSandbox.ts`, `AIPostGenerator.ts`):** Heavy **ViGlobal** marketing strings — **admin/marketing tooling only**. Risk **low** if routes stay dev-gated; do not paste into consumer UI.

---

## Internal-only naming findings

Safe **if not shown in UI**. Document for engineers; rename only with migration plan.

| Term | Representative locations | Notes |
|------|-------------------------|-------|
| `useKngLoyaltyStore`, `kngLoyaltyStore.ts` | `src/state/`, `LoyaltyRewardsScreen`, `DashboardB2CScreen` | Store module name; UI uses **VIO Points** labels |
| `KngTravelHospitalityMerchant`, `kngTravelHospitality.ts` | Travel data layer | Type/data only; travel UI copy clean |
| `formatVigTokenNumber`, `formatVIG`, `VIG_NUMBER_LOCALE` | `src/utils/currency.ts` | **Display already VIO Credits**; function names legacy |
| `VigTokenIcon` | `src/components/ui/VigTokenIcon.tsx` | Component name; renders icon only |
| `vigTokenCost`, `vig_tokens`, `vig_100_ai` | `loyaltyRewardsCatalog.ts`, loyalty types | Catalog **id/kind** + field names; public titles fixed |
| `vigTokenEconomyEnabled` | `App.tsx`, feature flags | Feature flag key |
| `quote.totalVIG`, `totalPaidVIG`, `*VIG` locals | Tourism/checkout screens | Field names; display uses `formatVigTokenNumber` → VIO Credits |
| `APP_BRAND.internalName: 'KNG'` | `src/config/appBrand.ts` | Documented internal spine; `publicName: 'VIONA'` |
| `KNGBridge` | `src/components/superapp/MiniAppContainer.tsx` | WebView JS bridge object — not user-visible label |
| `routes.ts` comments | `/** KNG Travel — … */` | Dev navigation comments only |
| `WalletService.ts`, `api/*` comments | ViGlobal REST, KNG net margin | Server/finance layer documentation |
| `insufficient_vig_tokens` | Error codes | API contract — map to user copy via i18n |

**Tolerated per protocol (audit confirms, do not “fix” in rename-only pack):** internal `*VIG` amount fields, `estimateKngNetPlatformVigAfterAcquirer`, ledger party `ViGlobalPlatformAI`, file names `viGlobalWalletApi.ts`.

---

## Persisted/API/migration-sensitive findings

**Do not rename without DB migration + API versioning.**

| Term | Location | Why sensitive |
|------|----------|---------------|
| `balanceVIG`, `lockedBalanceVIG`, `amountVIG`, `totalPaidVIG`, `providerFeeVIG`, `kngNetPlatformRevenueVIG`, … | `prisma/schema.prisma` | Column names, reports, Stripe reconciliation |
| `ketnoieu.loyalty.v1` | `storageKeys.kngLoyalty` | AsyncStorage key string (value is neutral; **module** name `kngLoyalty` is code-only) |
| `vigTokenBalance`, `lifetimeVigTokensEarned` | Loyalty snapshot types + store | Client persisted shape |
| `currencyCode: 'VIG_TOKEN'` | `PaymentsService.ts` | Pricing quote contract |
| `insufficient_vig_tokens`, `invalid_minutes` | AI/loyalty error codes | Client handling |
| `viglobal://onboard?brokerId=` | Broker QR payload | Deep link scheme |
| `EXPO_PUBLIC_*` / `viGlobal*` API base paths | `apiClient.ts`, env | Deployment config |
| `LEADERSHIP_RATE_OF_KNG_NET` | `brokerEmpireEscrow.ts` | Finance constant name |

**Freeze/document:** Expose **VIONA / VIO Credits** only at presentation boundary (`vioDisplayLabels`, i18n, formatters). Keep ledger/schema `VIG` until finance signs migration.

---

## Safe deferrals

| Item | Reason |
|------|--------|
| Prisma `*VIG` column rename | DB migration + backfill + reporting |
| `useKngLoyaltyStore` → `useVionaLoyaltyStore` | Import graph + persisted snapshot typing |
| `viGlobalWalletApi.ts` / server `ViGlobal API` module names | Backend contract |
| `VigTokenIcon` component rename | Low value; no user-visible string |
| Admin `KNG_MARKETING_ORIGIN` constant (domain URL) | URL is not brand copy; label text still needs VIONA |
| Marketing polyglot demo content | Dev-only; already isolated |
| `routes.ts` block comments | Non-executable |
| Loyalty reward id `vig_100_ai` | Catalog key; subtitle already safe |

---

## Recommended next packs

| Priority | Pack name | Target files | Risk fixed | Type | Do-not-touch |
|----------|-----------|--------------|------------|------|--------------|
| **P0** | `VIONA.I18N.SERVICE_MESSAGE_VIO_REBRAND.1` | `AiBillingService`, `LoyaltyService`, `fintech/WalletService`, `liveInterpreterService`, `AIEngine`, `PaymentsService`, `gdprErasureService`, `useP2PVoiceCall`, `v7MerchantTrialTrap` | User-visible **VIG Token** / **ViGlobal** errors | Copy-only / thin wrapper to `vioDisplayLabels` | Prisma, wallet math, error **codes** |
| **P1** | `VIONA.I18N.B2B_ADMIN_BROKER_PUBLIC_COPY.1` | `TienIchScreen`, `AdBiddingScreen`, `InternalTradeMarketScreen`, `SmartCalendarScreen`, `FacebookWarRoomScreen`, `AdminDashboardScreen`, `b2bMerchantPhonePolicy`, `StripeConnectService` user string | **KNG** / **ViGlobal** on B2B/admin surfaces | Copy-only | Stripe fee math, admin routing |
| **P1** | `VIONA.UX.APP_TOUR_DEMO_COPY.1` | `AppTourService.ts`, `DemoTourOverlay` consumers | Demo tour **ViGlobal Hub** | Copy-only + optional i18n keys | Tour step machine logic |
| **P2** | `VIONA.NOTIFICATIONS.DEFAULT_TITLE_VIONA.1` | `centralDispatcherExecution.ts`, `VietQRService.ts`, `EmailOtpService` default brand | Push/QR/email default **ViGlobal** | Copy/config default | Dispatcher routing |
| **P2** | `VIONA.I18N.BROKER_SHELL_COPY.1` | `BrokerDashboardScreen.tsx` | Broker onboarding errors + `viglobal://` help text | Copy-only | URI scheme registration |
| **P3** | `VIONA.MONETIZATION.CASHOUT_COPY_COMPLIANCE.1` | `CashOutScreen`, `ReferralRewardScreen`, `KOLPartnerDashboard`, `WalletTopUpScreen` | Cash-out / withdraw framing vs closed-loop law | Copy + gate review | `cashOutPayoutQueue` logic |
| **Deferred** | `VIONA.LEDGER.VIG_SCHEMA_RENAME.MIGRATION.1` | `prisma/schema.prisma`, all `*VIG` types | Internal consistency | **Migration** | Any rename without finance sign-off |
| **Deferred** | `VIONA.STORE.KNG_LOYALTY_RENAME.1` | `kngLoyaltyStore`, imports | Developer clarity | Refactor | AsyncStorage key string |

**Cross-reference (not this audit’s scope):** `VIONA.SOS.COUNTRY_EMERGENCY_ROUTING_MATRIX.1`, checkout fulfillment copy (`checkout.confirmed*` — see brand drift sweep), `VIONA.TRAVEL.LOCAL.FULFILLMENT.READINESS.1`.

---

## Search commands (repeat audit)

```bash
rg -n "\\bKNG\\b|Kng|kng" src prisma --glob '!**/node_modules/**'
rg -n "ViGlobal|VIG Token|vigToken|vig_tokens" src
rg -n "accessibilityAnnounce|formatVigTokenNumber|useKngLoyalty" src
rg -n "cash out|cashout|withdrawable" src/i18n src/screens -i
```

---

## Audit sign-off

| Check | Status |
|-------|--------|
| Broad rename performed | **No** |
| App logic changed | **No** |
| Locale JSON changed | **No** |
| Docs-only deliverable | **Yes** — this file |
