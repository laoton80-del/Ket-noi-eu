# VIONA.TRAVEL_LOCAL.FULFILLMENT_READINESS_AUDIT.1

**Document ID:** `VIONA.TRAVEL_LOCAL.FULFILLMENT_READINESS_AUDIT.1`  
**Type:** Read-only fulfillment / payment / booking truth audit (report only)  
**Branch:** `pack-af31-travel-local-fulfillment-readiness-audit`  
**Base master:** `381b4fe` — `docs(audit): merge SOS countryPacks data legal matrix`  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Global Active / Full Standard Lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md), [I18n Brand Drift Sweep](./VIONA_I18N_BRAND_DRIFT_SWEEP_1.md), [Internal Legacy Naming Service Audit](./VIONA_INTERNAL_LEGACY_NAMING_SERVICE_AUDIT_1.md), [Design Mode Lock](../design/VIONA_DESIGN_MODE_LOCK.md).

**Scope note:** Task paths `src/screens/travel/**`, `src/screens/tourism/**`, and `src/screens/local/**` do not exist as top-level folders. Audited equivalents: `src/screens/b2c/travel/**`, `src/screens/b2c/*Tourism*`, `src/screens/b2c/LocalScreen.tsx`, `src/screens/b2c/TravelScreen.tsx` (Travel Hub shell), `src/screens/FlightSearchAssistantScreen.tsx`, `src/components/travel/**`, `src/components/local/**`, `src/components/localCommerce/**`, and scoped services/i18n per pack brief.

---

## Summary

| Item | Result |
|------|--------|
| **Overall readiness** | **Mixed.** Travel Lite surfaces are largely honest (guidance, demo, pilot, “not OTA”). Tourism checkout has **real server wallet settlement** (VIO Credits debit + `TourismBooking` row `PENDING`) but **success UI and several i18n CTAs frame “request preview”** while `checkout.payNow` / `quoteLegal` / `topUpBody` still read like **completed booking payment**. Local fixer marketplace is **pricing preview only** (no pay CTA, no dispatch). Local classifieds VIP posting debits VIO Credits but is **device-local listings** (not merchant fulfillment). |
| **Highest-risk flows** | (1) **Tourism checkout** — wallet debited vs “preview / not payment capture” copy tension. (2) **`home.universeLocalSub`** — “merchant-confirmed flow” without universal production confirmation. (3) **`bookingEscrowUi.ts`** — hardcoded **VIG** escrow / settlement language shown before `createBooking`. (4) **`HomestayCrossSellWidget`** — “đặt phòng sớm khi vé đã chốt” after demo flight selection. (5) **`checkout.payNow` / `tourism.checkoutDemo` / `topUpBody`** — booking/payment completion wording across locales. |
| **Copy fixes needed?** | **Yes** — P1 copy pack recommended (no behavior change). Align pay CTAs with: *VIO Credits debited for request intake; merchant must confirm fulfillment; not card capture / not guaranteed stay.* |
| **Behavior / backend fixes needed?** | **Not in this audit pack.** Separate packs if product wants: hold-not-capture wallet model, merchant ACK gate before debit, or Stripe Connect fixer checkout — each needs Payments/Ledger + ops sign-off. |
| **Recommended next pack** | **`VIONA.TRAVEL_LOCAL.COPY_FULFILLMENT_SAFETY.1`** (copy-only, scoped keys + hardcoded travel/local strings). |

---

## Audit questions (answers)

1. **Guidance / demo / request preview only:** Travel Hub scenarios, Leona prefills, Flight Search Assistant, FlightSearchScreen demo confirm, Travel SOS embassy dial (confirm + demo kicker), premium travel alerts (fast track, tax refund, vault, telehealth, eSIM), Local fixer catalog + checkout receipt (no charge), Local commerce clarity block, legal scanner (gated), classifieds composer (local device).
2. **Real backend state:** Tourism `POST /api/tourism/quote` + `POST /api/tourism/book` (`processTourismBookingSettlement` — tourist wallet debit, provider/treasury credit, `TourismBookingStatus.PENDING`). Local demo lawyer path `createBooking` when env IDs set. Classified VIP `reserveAndCommitCredits`. B2B merchant radar / booking status (out of B2C scope but related).
3. **Implies merchant/provider acceptance:** `home.universeLocalSub`, `localCommerce.vietnameseAbroadSubtitle` (“merchants typically confirm”), `checkout.topUpBody` (“complete this booking”) — **overstates** for tourism where status stays `PENDING` until merchant workflow.
4. **Implies payment capture / secured payment:** Tourism checkout debits **spendable VIO Credits** immediately (in-app payment capture). Copy on confirmed screen says preview / not guaranteed — **understates debit**. `checkout.quoteLegal` states wallet will be debited (accurate for tourism). `bookingEscrowUi` describes VIG lock/hold (accurate for generic booking path, wrong public unit label).
5. **Implies booking confirmation:** Screen route `TourismBookingConfirmed` + checkmark UX; mitigated by `checkout.confirmedTitle` = “Request preview created”. **FlightSearchScreen** demo block titled “Xác nhận đặt vé (demo)” — mitigated by “(demo)”. **HomestayCrossSellWidget** “vé đã chốt” — **not mitigated**.
6. **Fixer / driver / agent dispatch:** Local fixer — **no dispatch** (static catalog, manual ops per `travelHub` direction packs). Travel taxi/transit prefills explicitly deny booking. No “driver assigned” / “fixer dispatched” in scoped B2C travel/local UI.
7. **Embassy / authority help:** `TravelSosHubScreen` — demo mission number, confirm-before-dial, `travelSosHub.embassyCallConfirmBody` denies dispatch. `travelHub` emergency scenario — safety reporting, not ER substitute.
8. **Needs gating labels:** Local fixer CTA **“Thuê Ngay”** (no pilot badge on button); `tourism.checkoutDemo` on Vietnam hub; Stripe footnote on fixer checkout (already says demo/pilot).
9. **Needs copy fixes:** See [Risky wording findings](#risky-wording-findings) and tables below.
10. **Product / legal / ops before commercial launch:** Tourism wallet debit before merchant ACK; fixer marketplace payouts (Stripe Connect copy only); classifieds VIP as real debit for non-merchant listing; cross-border stay/refund policy; “merchant-confirmed flow” marketing on Home.

---

## Travel surfaces audited

| Surface | File | Flow type | Current claim | Risk | Recommended action |
|---------|------|-----------|---------------|------|-------------------|
| Travel Hub (tab) | `src/screens/b2c/travel/TravelHubScreen.tsx` | Guidance / Lite companion | i18n `travelHub.*` — not OTA; scenarios demo/pilot | OK | Keep; periodic re-audit when new tiles ship |
| Travel shell (stack) | `src/screens/b2c/TravelScreen.tsx` | Same as Hub | Same i18n keys | OK | Document alias to Travel Hub |
| Travel directions & tiles | `src/components/travel/*` | Navigation chrome | No fulfillment claims in components | OK | — |
| Flight search (demo offers) | `src/screens/b2c/travel/FlightSearchScreen.tsx` | Demo compare | “Xác nhận đặt vé (demo)” | OK | Add one-line “not airline ticket” under title (P3) |
| Flight search assistant | `src/screens/FlightSearchAssistantScreen.tsx` | Guidance → Leona | System prompt denies booked/paid | OK | — |
| Homestay cross-sell | `src/screens/b2c/travel/HomestayCrossSellWidget.tsx` | Marketing cross-sell | “vé đã chốt”, “đặt phòng” | **P1** | Copy: “if you book elsewhere” / request preview |
| Travel hospitality browse | `src/screens/b2c/TravelHospitalityScreen.tsx` | Discovery | FX “minh họa”; merchant preview list | OK | Gate checkout entry labels if added |
| Travel SOS hub | `src/screens/b2c/travel/TravelSosHubScreen.tsx` | Embassy dial assist | Demo + confirm; no dispatch | OK | — |
| Local fixer marketplace | `src/screens/b2c/travel/LocalFixerScreen.tsx` | Pilot catalog | Hero “xem trước / pilot (demo)”; CTA “Thuê Ngay” | **P2** | CTA → “Xem thanh toán (pilot)” + request framing |
| Local fixer checkout | `src/screens/b2c/travel/LocalFixerCheckoutScreen.tsx` | Pricing preview | Stripe Connect footnote “demo/pilot”; no pay button | OK | Add banner “No charge in this build” (P3) |
| Fixer earnings preview | `src/screens/b2c/travel/FixerEarningsScreen.tsx` | Demo split math | Platform fee labeled VIONA | OK | — |
| Tourism checkout | `src/screens/b2c/TourismCheckoutScreen.tsx` | REST quote + book | `payNow`, wallet debit on server | **P1** | Copy pack: “Submit request & debit VIO Credits” |
| Tourism “confirmed” | `src/screens/b2c/TourismBookingConfirmedScreen.tsx` | Post-book UI | i18n preview titles + checkmark | **P1** | Soften icon/CTA; keep demo note prominent |
| Trip Wrapped | Route from confirmed screen | Viral / AI stats | Entertainment only | **P2** | Label “preview stats” on CTA |
| Vietnam hub entry | `src/screens/b2c/VietnamHubScreen.tsx` | Discovery → checkout | `tourism.checkoutDemo` | **P1** | “Request stay preview” wording |
| Payment checkout sheet | `src/components/commercial/PaymentCheckoutSheet.tsx` | Commercial demo (not Travel tab) | Uses safe `checkout.paymentSheet*` keys | OK | Out of Travel pack unless wired to Travel |
| Travel data module | `src/data/kngTravelHospitality.ts` | Internal comment | “KNG Travel” in comment only | **P3** | Rename comment in internal cleanup pack |

---

## Local surfaces audited

| Surface | File | Flow type | Current claim | Risk | Recommended action |
|---------|------|-----------|---------------|------|-------------------|
| Local universe screen | `src/screens/b2c/LocalScreen.tsx` | Mixed Lite/demo | Classifieds “Đăng tin thành công”; lawyer demo booking + escrow | **P1** | i18n alerts; fix `bookingEscrowUi` copy |
| Local commerce clarity | `src/components/localCommerce/LocalCommerceClarityBlock.tsx` | Capability disclosure | `localCommerce.*` honest statuses | OK | — |
| Local components | `src/components/local/*` | Chrome | No fulfillment claims | OK | — |
| Home Local card | `src/i18n/locales/*.json` `home.universeLocalSub` | Marketing | “merchant-confirmed flow” | **P1** | “Request + merchant review” all locales |
| Local hub i18n | `localHub.*`, `localCommerce.*` | Mixed | Strong safety in `localCommerce`; abroad subtitle soft-implies confirm | **P2** | Tighten `vietnameseAbroadSubtitle` |
| Classified VIP post | `LocalScreen.submitPost` | Wallet debit + local state | Debits VIO Credits; success “đã được đăng” | **P2** | Clarify not marketplace moderation / merchant |
| Legal scan → booking | `LocalScreen` + `bookingEscrowUi` | Demo intake | Escrow alert **VIG** lock language | **P1** | VIO Credits + request-only alert copy |
| Fixer entry from Travel | `TravelScreen` → `LocalFixer` | Cross-link | — | OK | — |

---

## Payment / checkout / booking truth table

| Flow | Payment captured? | Booking confirmed? | Merchant/provider accepted? | Source of truth | Current copy risk | Launch gate |
|------|-------------------|--------------------|-----------------------------|-----------------|-------------------|-------------|
| Tourism checkout (`/api/tourism/book`) | **Yes** — tourist `balanceVIG` decremented; ledger `BOOKING` txs | **No** — `TourismBooking.status = PENDING` | **No** — merchant radar / manual CONFIRMED workflow | `WalletService.processTourismBookingSettlement`, Prisma `TourismBooking` | Success screen says “request preview” (good) but `payNow` / `topUpBody` / `checkoutDemo` imply pay-to-book (bad) | **Pilot** — copy alignment + ops runbook for refunds/disputes |
| Tourism quote only | No | No | No | `POST /api/tourism/quote` | Low | Demo-safe |
| Local fixer checkout UI | **No** — display-only split | No | No | `LocalFixerService.calculateSplitPayment` | Stripe footnote says demo/pilot | **Demo** until PI + dispatch model |
| Local `createBooking` (lawyer demo) | Depends on server booking/escrow rules | No final appointment | No | `bookingService` + env demo IDs | Escrow alert overpromises; alert after says demo | **Demo** — env-gated |
| Classified VIP post | **Yes** — `reserveAndCommitCredits` | N/A (not a booking) | N/A | Wallet service | “Đăng tin thành công” OK for post, not merchant order | **Pilot** — disclose local-only list |
| Travel Hub Leona assists | No | No | No | Feature flags + prefills | Explicit “does not book/pay” | **Lite** |
| FlightSearch demo confirm | No | No (demo state only) | No | In-memory UI | Title includes “(demo)” | **Demo** |
| B2B merchant confirm | N/A B2C | Partial | Merchant workflow | B2B dashboards | Out of scope | **B2B Pilot** |

---

## Risky wording findings

| File / key | Phrase | Risk | Recommended replacement |
|------------|--------|------|---------------------------|
| `en.json` `checkout.payNow` (+ vi/ja/ko/de/fr/cs) | “Pay {{amount}} now” / “Trả … ngay” | **P1** — sounds like final payment for confirmed booking | “Submit request · debit {{amount}} VIO Credits” |
| `en.json` `checkout.topUpBody` | “complete this booking” | **P1** — implies booking completion | “finish your request preview” |
| `en.json` `tourism.checkoutDemo` | “Book featured stay · pay in VIO Credits” | **P1** | “Request featured stay preview · VIO Credits” |
| `en.json` `home.universeLocalSub` (+ de/cs/vi) | “merchant-confirmed flow” / equivalents | **P1** | “request-first; merchant review required” |
| `en.json` `localCommerce.vietnameseAbroadSubtitle` | “merchants typically confirm” | **P2** | “merchants may confirm asynchronously (pilot)” |
| `bookingEscrowUi.ts` | “VIG will be locked… settles payment to merchant” | **P1** brand + fulfillment | VIO Credits + “request hold (pilot)” + merchant must confirm |
| `HomestayCrossSellWidget.tsx` | “đặt phòng sớm khi vé đã chốt” | **P1** — implies ticket confirmed | “If you book flights elsewhere, consider homestay requests (preview)” |
| `LocalFixerScreen.tsx` | “Thuê Ngay” | **P2** — implies hire/dispatch | “View pilot pricing” / “Send request (pilot)” |
| `LocalScreen.tsx` | `Alert.alert('Đăng tin thành công', …)` | **P2** | i18n + “on this device preview” |
| `TourismBookingConfirmedScreen.tsx` | Checkmark + route name `TourismBookingConfirmed` | **P2** | Keep keys; rename route in future behavior pack only |
| `vi.json` `b2b` acceptedMsg (if shown in B2C) | “Đã nhận · đã gửi tin tự động” | **P2** | Verify B2C exposure; gate if needed |
| `FlightSearchScreen.tsx` | “Xác nhận đặt vé (demo)” | OK | Optional clarify “not issued ticket” |

**Vietnamese search (scoped):** No B2C travel/local hits for “tài xế đã nhận”, “đã điều phối”, “khách sạn đã xác nhận” in audited screens. `vi.json` travel taxi sub correctly denies booked ride. Embassy/help strings deny dispatch.

---

## Brand / VIO copy findings

| Finding | Location | Risk | Action |
|---------|----------|------|--------|
| Public display uses **VIO Credits** via `formatVigTokenNumber` | `src/utils/currency.ts` | OK | Keep |
| Internal/API fields still `*VIG` | `paymentApi.ts`, Prisma, `WalletService` | Low (internal) | No public change in copy pack |
| `bookingEscrowUi.ts` says **VIG** | Shown to Local users before booking | **P1** | Copy-only fix |
| `paymentApi.ts` header comment “ViGlobal tourism” | Comment only | Low | Internal naming pack |
| `kngTravelHospitality.ts` comment “KNG Travel” | Comment only | **P3** | Internal rename |
| No **KNG / ViGlobal / VIG Token** in scoped B2C travel screen UI strings | Grep 2026-05-19 | OK | Re-grep after edits |
| `checkout.vioCreditsFootnote` | en + locales | OK | Keep visible on tourism checkout |
| Cash/crypto/withdrawable | Not claimed on tourism/local audited paths | OK | — |

---

## Recommended next packs

| Pack name | Target files | Risk fixed | Copy vs behavior | Do-not-touch |
|-----------|--------------|------------|------------------|--------------|
| **`VIONA.TRAVEL_LOCAL.COPY_FULFILLMENT_SAFETY.1`** | `src/i18n/locales/*` (`checkout.*`, `home.universeLocalSub`, `tourism.checkoutDemo`, `localCommerce.vietnameseAbroadSubtitle`); `bookingEscrowUi.ts`; `HomestayCrossSellWidget.tsx`; `LocalFixerScreen.tsx`; `LocalScreen.tsx` alerts | Pay/book/confirm/dispatch implication | **Copy-only** | Wallet settlement, Prisma, routes, `paymentApi` |
| **`VIONA.TOURISM.CHECKOUT.UX_TRUTH.1`** (optional) | `TourismCheckoutScreen.tsx`, `TourismBookingConfirmedScreen.tsx`, route display name | Checkmark vs debit truth | **UX/copy** — may rename route with nav audit | `processTourismBookingSettlement` |
| **`VIONA.LOCAL.FIXER.MARKETPLACE.PILOT.1`** | `LocalFixer*` screens, `localFixerCatalog.ts`, Stripe integration | Fake hire / payout | **Behavior/backend** — needs ops | Tourism checkout |
| **`VIONA.I18N.INTERNAL_LEGACY_NAMING.MIGRATION_PLAN.1`** | `paymentApi.ts` comments, `kngTravelHospitality.ts`, service env `VIGLOBAL_*` | Internal drift | **Docs / internal** | Public UI without review |
| **`VIONA.LOCAL.CLASSIFIEDS.WALLET_DISCLOSURE.1`** | `LocalScreen.tsx` VIP flow | Debit without marketplace SoT | **Copy + light UX** | Classifieds backend if none |

---

## Validation (audit pack)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors; pre-existing warnings) |
| `npm run smoke` | See CI log on branch (run at commit time) |
| `git status -sb` | Clean after docs commit |
| App logic changed | **No** |
| Payment / wallet / booking / backend / Prisma | **No** |
| Routes / nav / package.json | **No** |
| Functions removed | **No** |

---

## Search commands (representative)

```bash
rg -i "booking confirmed|payment captured|merchant accepted|fixer dispatched|guaranteed" src/screens/b2c/travel src/screens/b2c/LocalScreen.tsx src/i18n/locales
rg "KNG|ViGlobal|VIG Token" src/screens/b2c/travel src/screens/b2c/Tourism*.tsx
rg "đã xác nhận|đã thanh toán|đã đặt|đảm bảo" src/i18n/locales/vi.json
```

---

*End of audit — implementation packs must follow Operating Protocol: no fake production readiness, no function removal without explicit approval.*
