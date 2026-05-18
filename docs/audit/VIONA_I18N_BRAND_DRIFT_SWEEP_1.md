# VIONA.I18N.BRAND_DRIFT_SWEEP.1

**Document ID:** `VIONA.I18N.BRAND_DRIFT_SWEEP.1`  
**Type:** Read-only brand / i18n / safety-copy audit (report only)  
**Branch:** `pack-af13-i18n-brand-drift-sweep`  
**Base master:** `d8d7f3d` — `fix(academy): guard kids leaderboard empty podium`  
**Prior milestones:** #51 Academy safety/i18n wave (`aa0195e`), #51.1 KidsLeaderboard crash guard (`d8d7f3d`)  
**Date:** 2026-05-18  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md) — no function removal; risky surfaces stay gated with honest copy.

---

## Summary

| Item | Result |
|------|--------|
| **Overall risk level** | **High** — several public B2C surfaces still show legacy **KNG / VIG** branding, production booking/payment success copy, or locale-specific SOS drift. Academy post-#51 is largely clean. |
| **Code changes in this pack** | **None** — audit report only. |
| **Recommended next pack** | **`VIONA.I18N.SOS_LOCALE_OVERLAY_FIX.1`** (blocker) then **`VIONA.I18N.TRAVEL_KNG_VIG_COPY.1`** and **`VIONA.I18N.CHECKOUT_FULFILLMENT_COPY.1`**. |

---

## Search commands run

Executed from repo root `ket-noi-eu/` (ripgrep / Cursor grep):

```bash
# Brand drift
rg -i "ViGlobal|ViGlobal Academy" src/
rg "VIG Token|\\bVIG\\b" src/
rg "\\bKNG\\b" src/screens src/components src/i18n

# Monetization / points
rg -i "withdrawable|cash-out|cash out|passive income|guaranteed income|earn money|payout completed|payment success|fake checkout|token|crypto" src/

# Education / certification
rg -i "official certificate|official ranking|guaranteed fluency|guaranteed learning|high-stakes|accreditation|official award|certified" src/

# Emergency / SOS
rg -i "ambulance sent|police sent|dispatch|GPS shared|recording started|Twilio call|emergency call completed|verified rescue|embassy contacted" src/
rg "gpsLocationShared|gpsShareDetail|gpsBanner|reportQueuedBody|reportScamSub" src/i18n/locales

# Booking / fulfillment
rg -i "booking confirmed|order confirmed|payment captured|refund completed|hotel confirmed|taxi dispatched|delivery guaranteed|merchant verified|supplier verified" src/

# Display helpers
rg "formatVIG|formatVigTokenNumber" src/
rg "Thanh toán thành công|Hoàn tiền 100%" src/
```

Scoped directories per task: `src/screens/**`, `src/components/**`, `src/i18n/locales/en.json`, `src/i18n/locales/vi.json`, selective `src/services/**` for user-visible errors/strings.

---

## Findings by category

### 1. Brand drift (ViGlobal / KNG / VIG public)

| Category | File | Exact phrase (representative) | Surface | Risk | Why risky | Recommended action |
|----------|------|------------------------------|---------|------|-----------|-------------------|
| Brand | `src/screens/b2c/travel/LocalFixerScreen.tsx` | `KNG Travel` | Public B2C Travel | **High** | Legacy brand on consumer travel surface | Replace copy with **VIONA Travel Lite** + pilot disclaimer |
| Brand | `src/screens/b2c/travel/FlightSearchScreen.tsx` | `KNG Travel` | Public B2C Travel | **High** | Same | Copy-only pack |
| Brand | `src/screens/b2c/travel/HomestayCrossSellWidget.tsx` | `KNG Travel · Cross-sell` | Public B2C Travel | **High** | Same | Copy-only |
| Brand | `src/screens/b2c/travel/LocalFixerCheckoutScreen.tsx` | `Phí dịch vụ KNG` | Public B2C checkout | **High** | Platform fee labeled KNG | **VIONA** platform fee + demo framing |
| Brand | `src/screens/b2c/CashOutScreen.tsx` | `Voucher hệ sinh thái KNG`, `VIG / Xu ví` | Gated B2C (flag) | **Medium** | Legacy names if route reachable | Gate label + **VIO Credits** copy; keep cash-out gated |
| Brand | `src/screens/b2c/DailyRewardScreen.tsx` | `KNG` (wheel hub) | Public B2C gamification | **Medium** | Legacy brand in UI chrome | **VIONA** |
| Brand | `src/screens/b2c/ReferralRewardScreen.tsx` | `KNG-VIP-888` | Public B2C referral | **Medium** | Promo code uses KNG | `VIONA-…` code + VIO Points wording |
| Brand | `src/config/loyaltyRewardsCatalog.ts` | `KNG Local`, `100 VIG Token gọi AI`, `KNG Travel` | Public Loyalty | **High** | Catalog titles/subtitles | i18n + **VIO Points**; remove VIG Token |
| Brand | `src/services/ux/AppTourService.ts` | `Welcome to ViGlobal Hub` | Demo tour overlay | **Medium** | Onboarding tour visible in demo | **VIONA Hub** |
| Brand | `src/utils/currency.ts` | `formatVIG` / `formatVigTokenNumber` → suffix `VIG` | Public tourism checkout | **High** | Public prices show **VIG** not **VIO Credits** | Route display through `vioDisplayLabels` / rename suffix |
| Brand | `src/screens/b2c/TourismCheckoutScreen.tsx` etc. | Prices via `formatVigTokenNumber` | Public B2C tourism | **High** | Consumer sees **VIG** unit | Copy-only + display helper |
| Brand | `src/screens/TienIchScreen.tsx` | `hợp đồng KNG`, `Xu` pricing | Utilities screen | **Medium** | Legacy naming | i18n sweep |
| Brand | `src/screens/admin/AdminDashboardScreen.tsx` | `ViGlobal revenue cut` | Admin only | **Low** | Internal ops | Leave internal or rename in admin-only pack |
| Brand | `src/screens/broker/BrokerDashboardScreen.tsx` | `ViGlobal account`, `viglobal://` | Broker shell | **Low** | B2B/broker | Internal/deep-link doc; optional rename later |
| Brand | `src/services/**` (many) | `ViGlobal`, `VIGLOBAL_*` env, comments | Internal / API | **Low** | Not product UI | **Leave internal**; do not expose in UI |

### 2. Risky points / monetization wording

| Category | File | Exact phrase | Surface | Risk | Why risky | Recommended action |
|----------|------|--------------|---------|------|-----------|-------------------|
| Monetization | `src/components/commercial/PaymentCheckoutSheet.tsx` | `Thanh toán thành công! Đã nhận xác nhận từ máy chủ.` | Commercial checkout component | **Blocker** | Implies server-confirmed payment success | Demo/pilot success copy + “not a live charge” unless webhook verified |
| Monetization | `src/components/commercial/PaymentCheckoutSheet.tsx` | `Hoàn tiền 100% và đền bù… Hỗ trợ 24/7.` | Same | **Blocker** | Fake insurance / refund guarantee | Remove or **Preview — not an insurance product** |
| Monetization | `src/screens/commercial/GlobalTiersScreen.tsx` | `Thanh toán thành công!` | Commercial tiers | **High** | Payment success alert | Pilot framing |
| Monetization | `src/screens/commercial/DashboardScreen.tsx` | `Passive Income & Commission Earnings` | Commercial dashboard | **High** | Earning promise | **Commission preview (demo)** |
| Monetization | `src/screens/commercial/KOLPartnerDashboard.tsx` | `YÊU CẦU RÚT TIỀN (CASH OUT)` | KOL / partner | **High** | Cash-out CTA | Gate + **VIO Points** / compliance copy |
| Monetization | `src/screens/b2c/CashOutScreen.tsx` | `Rút Tiền Thưởng (Cash-Out)` | Gated wallet | **Medium** | Withdraw framing (partially disclaimed in body) | Align title with gate message |
| Monetization | `src/screens/LeonaCallScreen.tsx` | `Hoàn 100% Xu nếu cuộc gọi không thành công` | Leona (gated) | **Medium** | Strong refund guarantee | Soften to **pilot credit adjustment (demo)** |
| Monetization | `src/screens/b2c/ReferralRewardScreen.tsx` | `nhận ngay … Xu gọi AI` | Referral | **Medium** | **Xu** + earn framing | **VIO Credits** + no guaranteed reward |
| Monetization | `src/i18n/locales/en.json` | `academySub.*` — `not cash, crypto, or withdrawable` | Academy | **Low** | Correct safety negation | **Leave** (good) |

### 3. Certification / education claims

| Category | File | Exact phrase | Surface | Risk | Why risky | Recommended action |
|----------|------|--------------|---------|------|-----------|-------------------|
| Education | `src/i18n/locales/en.json` `academySub.*` | `not official certification`, `preview/demo leaderboard` | Academy | **Low** | Correct disclaimers post-#51 | **Leave** |
| Education | `src/screens/TienIchScreen.tsx` | `CERTIFIED_EXPERTS` (variable name; UI “expert”) | Utilities | **Medium** | May imply official certification | Audit visible label; use **partner** / **pilot** |
| Education | Academy stack (`AdultLearningHome`, `KidsLeaderboard`, `LiveAiTeacher`, etc.) | — | Academy | **Low** | #51 wave applied | **Confirmed clean** in i18n keys |

### 4. Emergency / SOS claims

| Category | File | Exact phrase | Surface | Risk | Why risky | Recommended action |
|----------|------|--------------|---------|------|-----------|-------------------|
| SOS i18n | `src/i18n/locales/cs.json` `sos.reportScamSub` | `Okamžité upozornění VIONA včetně přesné polohy` | SOS modal (CS locale) | **Blocker** | Fake live alert + location share | **Replace** with EN-safe `reportScamSub` text |
| SOS i18n | `src/i18n/locales/de.json` `sos.reportScamSub` | `VIONA mit Standortdaten alarmieren` | SOS modal (DE) | **Blocker** | Implies live alarm | Replace overlay |
| SOS i18n | `src/i18n/locales/cs.json` `sos.gpsShareDetail` | `…sdílejí s bezpečnostním centrem VIONA…` | Latent `sos.*` | **High** | Overrides EN merge for key if used | Delete stale keys or align to EN |
| SOS i18n | `src/i18n/locales/de.json` `sos.gpsShareDetail` | `…live mit dem Sicherheitszentrum…` | Latent | **High** | Same | Same |
| SOS i18n | `src/i18n/locales/ko.json` `sos.gpsBanner` | `VIONA 안전 센터와 공유` | Latent | **High** | Live GPS share claim | Remove or align |
| SOS i18n | `src/i18n/locales/ja.json` `sos.gpsBanner` | `VIONAセーフティセンターと共有` | Latent | **High** | Same | Same |
| SOS i18n | `src/i18n/locales/fr.json` `sos.gpsBanner` | `partagée avec le centre de sécurité VIONA` | Latent | **High** | Same | Same |
| SOS i18n | `src/i18n/index.ts` | `mergeSosWithEnglishBase` — locale overlay wins | All non-EN SOS | **High** | Structural: stale partial `sos` blocks override safe EN | Pack: scrub `cs/de/ko/ja/fr` `sos` to EN-safe or drop keys |
| SOS | `src/i18n/locales/en.json` `emergencySos.*`, `sos.footerDisclaimer` | `does not dispatch emergency services` | EN/VI SOS | **Low** | Correct | **Leave** |
| SOS | `src/screens/LeonaCallScreen.tsx` | `chuyển sang màn hình SOS ngay để gọi 112` | Leona | **Medium** | Auto-redirect narrative | Ensure manual user action; add disclaimer |

**Note:** `src/i18n/index.ts` documents that partial locale `sos` objects overlay English — any key present in `cs.json` / `de.json` / etc. **replaces** the safe English string. `SOSModal` uses `t('sos.reportScamSub')`, so **Czech and German users currently see unsafe copy**.

### 5. Booking / fulfillment claims

| Category | File | Exact phrase | Surface | Risk | Why risky | Recommended action |
|----------|------|--------------|---------|------|-----------|-------------------|
| Booking | `src/i18n/locales/en.json` `checkout.confirmedSub` | `You're secured. The merchant sees this booking on their Live Order Radar instantly.` | Tourism booking confirmed | **Blocker** | Production fulfillment / instant merchant sync | **Preview booking recorded (demo)** — not live radar |
| Booking | `src/i18n/locales/vi.json` `checkout.confirmedSub` | `Merchant thấy đơn trên Live Order Radar ngay.` | Same | **Blocker** | Same | Same |
| Booking | `src/i18n/locales/en.json` `checkout.confirmedTitle` | `Booking confirmed` | Same | **High** | Strong confirmation | **Booking request recorded (preview)** |
| Booking | `src/screens/b2b/AiReceptionistSetupChecklistScreen.tsx` | `Merchant verified` | B2B setup checklist | **Medium** | Implies KYC/verification complete | **Merchant profile (demo)** |
| Booking | `src/screens/b2c/travel/FlightSearchScreen.tsx` | Local UI state `confirmed` + success panel | Travel flight search | **Medium** | Can read as ticket confirmed | Label **Lead saved (preview)** |
| Booking | `src/services/booking/V7OfflineFailsafe.ts` | `New booking confirmed` (push template) | Merchant notification | **Medium** | Backend/mock push | Internal template; add **demo** if shown to users |

---

## Safe areas confirmed

| Area | Status |
|------|--------|
| **Academy (#51 / #51.1)** | `academySub.*` / `academyLive.*` in `en.json` / `vi.json` use **VIONA**, preview/demo framing, no ViGlobal/VIG Token in keys. KidsLeaderboard crash guard on master. |
| **Home hub** | Fashion/command copy uses **VIONA** eyebrows (`VIONA HUMAN CONSTELLATION`, etc.). Tab labels via `home.tab*` i18n. |
| **SOS (EN / VI primary)** | `emergencySos.*`, `sos.guideTitle`, `sos.footerDisclaimer`, `travelSosHub.gpsLineDemo` — no dispatch claims in EN/VI paths reviewed. |
| **Account / SetupProfile** | `strings.ts` wallet disclaimer: VIO Points not crypto/withdrawable (per demo checklist #48). |
| **Vietnam hub i18n** | `vietnamHub.scrollKicker` uses **VIONA**; `fromPrice` uses **VIO Credits** in EN. |
| **MVP gates** | `mvpSurfaceGate.tsx` cash-out / token economy off message aligns with product law. |

**Travel / Local / Business:** Not clean — see findings (KNG travel chrome, VIG tourism amounts, B2B checklist). **SOS:** clean for EN/VI; **not clean** for CS/DE/KO/JA/FR overlays.

---

## Prioritized next packs

### 1. `VIONA.I18N.SOS_LOCALE_OVERLAY_FIX.1` (do first)
- **Target files:** `src/i18n/locales/cs.json`, `de.json`, `ko.json`, `ja.json`, `fr.json`; optionally `src/i18n/index.ts` (document or strip stale `sos` keys)
- **Risk fixed:** Fake GPS share, safety-center queue, live scam alert in non-EN SOS
- **Scope:** Copy-only (align overlays to EN-safe `sos.*` or remove overriding keys)

### 2. `VIONA.I18N.CHECKOUT_FULFILLMENT_COPY.1`
- **Target files:** `src/i18n/locales/en.json`, `vi.json` (`checkout.*`); `src/components/commercial/PaymentCheckoutSheet.tsx`, `.web.tsx`; `src/screens/commercial/GlobalTiersScreen.tsx`
- **Risk fixed:** Fake payment success, 100% refund insurance, instant merchant radar
- **Scope:** Copy-only + pilot badges

### 3. `VIONA.I18N.TRAVEL_KNG_VIG_COPY.1`
- **Target files:** `src/screens/b2c/travel/*`, `src/utils/currency.ts` (display suffix), `TourismCheckoutScreen.tsx`, `TourismBookingConfirmedScreen.tsx`, `VietnamHubScreen.tsx`
- **Risk fixed:** KNG public brand, **VIG** unit on consumer tourism
- **Scope:** Copy-only + display helper (no wallet math)

### 4. `VIONA.I18N.LOYALTY_GAMIFICATION_COPY.1`
- **Target files:** `src/config/loyaltyRewardsCatalog.ts`, `src/screens/b2c/LoyaltyRewardsScreen.tsx`, `DailyRewardScreen.tsx`, `ReferralRewardScreen.tsx`, `src/services/ux/AppTourService.ts`
- **Risk fixed:** VIG Token, KNG, Xu, earn promises in loyalty/referral/demo tour
- **Scope:** Copy-only; keep `awardPoints` / redemption logic unchanged

### 5. `VIONA.I18N.COMMERCIAL_B2B_SURFACE_COPY.1` (deeper audit optional)
- **Target files:** `src/screens/commercial/*`, `src/screens/b2b/*`, `MerchantDashboardScreen.tsx`
- **Risk fixed:** Passive income, cash-out, merchant verified, ViGlobal in partner-facing UI
- **Scope:** Copy + Lite/Demo labels; may need product decision on commercial dashboard reachability

---

## Validation (audit pack)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors; pre-existing warnings) |
| `npm run smoke` | Pass |

---

## Audit metadata

- **Functions removed:** None (no code changes)
- **Routes / nav / payment / auth / Prisma / feature flags / packages touched:** None
- **Scoring / `awardPoints` behavior:** Unchanged (not modified)
