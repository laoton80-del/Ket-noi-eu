# VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_AUDIT.1

**Document ID:** `VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_AUDIT.1`  
**Type:** Read-only public copy / ledger terminology audit (report only)  
**Branch:** `pack-af55-wallet-public-copy-ledger-terms-audit`  
**Base master:** `eb66d16` — `docs(audit): merge wallet ledger source of truth`  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Wallet Ledger Source of Truth Audit](./VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Merchant Request Source of Truth Audit](./VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Request Schema Design](../architecture/VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md).

**Scope:** User-visible strings in i18n JSON, `src/i18n/strings.ts`, screen hardcodes, alert copy, API error messages surfaced to clients, and navigation labels that imply money movement. **Out of scope for changes in this pack:** any file edits.

---

## Summary

| Item | Result |
|------|--------|
| **Overall copy safety readiness** | **Mixed.** Tier-1 tourism checkout and merchant inbox (EN + several locales) include strong disclaimers (request preview, not withdrawable, hold/release language). **High-risk gaps** remain: cash-out / bank payout surfaces, mock merchant “accept” copy, hardcoded Local/fixer payment titles, **“get paid in one wallet”** merchant gate copy, raw ledger enum labels (`HELD`) in B2B inbox UI, dual **Xu vs VIO Credits** naming, and API errors that say **“VIG”** to users. |
| **Highest-risk wording** | (1) `CashOutScreen` + `MerchantVnDashboardScreen` “cash out to local bank”; (2) `profileRoleGateMerchantBody` “get paid in one wallet”; (3) `checkout.quoteLegal` “wallet will be debited” without settlement-mode qualifier; (4) B2B radar `acceptedMsg` implies real order acceptance; (5) Classifieds VIP success “Đăng tin thành công” without paid-placement disclaimer; (6) `LocalFixerCheckoutScreen` “Thanh toán” with no charge. |
| **Immediate correction pack required?** | **Yes — recommended** `VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_FIX.1` for **P0/P1** items before Local commercial wallet work. Not blocking docs-only merge of this audit. |

---

## Public terminology policy

| Term | Definition | Public use |
|------|------------|------------|
| **VIO Credits** | In-app spendable usage balance for services (EUR-pegged reference in copy). Maps to Prisma `balanceVIG` / Firebase `credits` internally. | **Default** for wallet balance, checkout, top-up, tourism/local commercial preview. |
| **VIO Points** | Loyalty / gamification balance (`kngLoyaltyStore`, `LoyaltyRewardsScreen`) — non-cash, redeem for perks. | Allowed when labeled **loyalty** or **rewards**, with “not withdrawable” nearby. |
| **Internal legacy VIG** | Schema field suffix `*VIG`, `TxType`, server logs, developer enums. | **Forbidden** in user-facing product copy except unavoidable admin/debug. API JSON field names may remain; **message strings** should say VIO Credits. |
| **Xu** | Legacy/demo unit on `CashOutScreen`, `TienIchScreen` reference lines. | **Avoid** in consumer wallet; confuses VIO Credits. If retained in demo, prefix “demo ledger · not withdrawable”. |
| **KNG / ViGlobal** | Legacy brand strings in routes, data filenames (`kngTravelHospitality`), admin URLs. | Do not present as **customer-facing wallet brand**. Prefer **VIONA** + VIO Credits. |
| **Forbidden public terms** | “Escrow” (unless legally reviewed and matched to hold API), “guaranteed refund”, “cash out”, “withdraw to bank”, “investment”, “crypto”, “guaranteed earnings”, “provider already paid” (without `providerSettledAt`), “booking confirmed” (without backend `CONFIRMED` / merchant ACK). | Replace per rules below. |
| **Allowed refund / release** | Hold-mode **decline**: “release held VIO Credits back to guest wallet” (not “refund” after settlement). Legacy booking cancel: describe **policy split** only if that API is exposed in UI. | Tourism inbox EN `rejectBody` is **good reference**. |
| **Allowed merchant settlement** | Only when backend records settlement: “Provider settlement recorded on this booking” (`providerSettledAt`); “Merchant confirmed — settled per server record” when `confirmedAt` + settle path true. | Tourism inbox `confirmedNote` / `providerSettledNote` pattern. |
| **Classifieds VIP** | “VIP boost” / “featured placement” — **paid in-app promotion**, not deposit, escrow, or merchant-held funds. | Never “escrow” or “held until merchant accepts”. |

**Config anchor:** `src/core/monetization/vioDisplayConfig.ts` — `publicCreditName: 'VIO Credits'`, `isWithdrawableCash: false`.

---

## Copy inventory

Priority: **P0** = misleading money movement before Local wallet; **P1** = significant trust risk; **P2** = cleanup / locale parity.

| File | Screen / flow | Current wording (representative) | Risk type | Recommended wording | Priority |
|------|---------------|-----------------------------------|-----------|---------------------|----------|
| `src/screens/b2c/CashOutScreen.tsx` | Referral / commission cash-out | Mock bank rail, “SEPA mock”, progress to bank goal, `Xu` balances | cash-out implication; dual-ledger naming | “Demo payout preview — not available. VIO Credits cannot be withdrawn to bank.” Remove or gate behind admin debug. | **P0** |
| `src/screens/merchant/MerchantVnDashboardScreen.tsx` | Merchant hub | “Cash out to local bank (VND)” | cash-out implication | “Settlement preview (demo) — contact ops” or remove CTA until real rail | **P0** |
| `src/screens/b2c/ReferralRewardScreen.tsx` | Referral | Nav a11y “Quy đổi tiền mặt” → `CashOut` | cash-out implication | “Rewards preview (demo)” | **P0** |
| `src/i18n/locales/en.json` | Home role gate | `profileRoleGateMerchantBody`: “get paid in one wallet” | provider-paid overclaim | “Track VIO Credits from tourism requests when settlement is enabled — preview” | **P1** |
| `src/i18n/locales/en.json` | Tourism checkout | `checkout.quoteLegal`: “wallet will be debited the total shown” | refund/hold confusion; legacy settle | “VIO Credits may be reserved or debited per server settlement mode…” | **P1** |
| `src/i18n/locales/cs.json` (and peers) | Tourism checkout | Same `quoteLegal` pattern in CS/DE | dual-ledger / mode confusion | Align with EN hold-aware variant | **P1** |
| `src/i18n/locales/en.json` | B2B radar | `b2b.radar.acceptedMsg`: “Accepted · auto-message sent” | fake confirmation/dispatch | “Demo only — not a live booking acceptance” | **P1** |
| `src/screens/b2c/LocalScreen.tsx` | Classifieds VIP | Hardcoded: “Đăng VIP”, success “Tin VIP đã được đẩy…” | escrow overclaim; no listing SoT | i18n: “VIP boost ({{amount}} VIO Credits) — in-app placement, not a booking hold” | **P1** |
| `src/screens/b2c/LocalScreen.tsx` | VIP failure | “Không thể đăng VIP” / insufficient balance | OK-ish | Use `getVioCreditsLabel()`; add “not refunded automatically” only if rollback absent | **P2** |
| `src/screens/b2c/travel/LocalFixerCheckoutScreen.tsx` | Fixer checkout | “Thanh toán Thổ Địa”, “Biên lai thanh toán”, “Tổng thanh toán” | provider-paid / payment overclaim | “Fixer hire preview (pilot) — no charge in this build” | **P1** |
| `src/screens/b2c/travel/LocalFixerScreen.tsx` | Fixer catalog | “thanh toán & hợp đồng qua VIONA (xem trước / pilot)” | payment overclaim | Keep “xem trước / pilot”; drop “thanh toán” or qualify | **P2** |
| `src/services/bookingEscrowUi.ts` | Demo lawyer booking | Title OK; message mentions “Holds and refunds apply only when enabled” | escrow overclaim (mild) | Keep title; avoid word “escrow” in constants/comments only | **P2** |
| `src/screens/b2b/tourismMerchantInboxUi.ts` | Merchant inbox | `walletPhaseLabel`: raw `HELD`, `SETTLED`, `LEGACY_SETTLED` | legacy naming; dual-ledger confusion | “Credits held”, “Settled to provider”, “Legacy: settled at submit” | **P1** |
| `src/i18n/locales/en.json` | Tourism inbox | `confirmBody` / `rejectBody` / `safetyBanner` | — (good) | Keep; propagate to VI/CS/DE/JA/KO/FR | **P2** parity |
| `src/i18n/locales/en.json` | Tourism checkout | `vioCreditsFootnote`, `confirmedSub`, `confirmedDemoNote` | — (good) | Keep | — |
| `src/i18n/locales/en.json` | Tourism inbox | `confirmedNote`: “settled per backend record” | provider-paid | Gate display on `providerSettledAt` (UI already has helper) | **P2** |
| `src/controllers/WalletController.ts` | REST errors | “Minimum transfer is 1.0 VIG” | legacy token naming | “Minimum transfer is 1 VIO Credits” | **P1** |
| `src/controllers/TourismController.ts` | REST errors | “Insufficient spendable VIG…” | legacy token naming | “Insufficient spendable VIO Credits…” | **P1** |
| `src/controllers/BookingController.ts` | REST errors | “pre-authorization”, “VIG” | legacy naming | “reserve VIO Credits” / “VIO Credits” | **P2** |
| `src/i18n/strings.ts` | Wallet top-up (VI/EN) | `vioDisclaimerBody`: not crypto, not withdrawable | — (good) | Keep; ensure on screen | — |
| `src/screens/TienIchScreen.tsx` | Utility tiers | “1 Xu ≈ … USD” | loyalty vs spendable confusion | “Reference pricing — pay with VIO Credits in wallet” | **P2** |
| `src/screens/b2c/LoyaltyRewardsScreen.tsx` | KNG Rewards | Vietnamese hardcodes “VIG Tokens” / demo redeem | loyalty vs spendable | Use `getVioPointsLabel()` everywhere | **P2** |
| `src/screens/b2c/ViralWrapScreen.tsx` | Trip wrap | “VIO Credits on this trip” | — (good) | Keep | — |
| `src/screens/admin/AdminDashboardScreen.tsx` | Admin | “Cash-Out · Auto-Fraud Engine” (mock) | cash-out (admin) | Label “Admin mock — no customer cash-out” | **P2** |
| `src/screens/broker/BrokerDashboardScreen.tsx` | Broker | “Payout preview (demo)” | — (acceptable if visible “demo”) | Keep demo qualifier prominent | **P2** |
| `src/screens/b2b/WalletB2BScreen.tsx` | B2B wallet | Stripe/subscription demo (not VIG) | — | Ensure no “VIO wallet withdraw” | **P2** |
| `src/navigation/routes.ts` | Deep link comment | “VIG wallet & payouts” | internal comment | Update comment only in fix pack | **P3** |
| `docs/D8_RUNTIME_SENSITIVE_MONEY_PATHS.md` | Doc | walletOps “ledger authoritative” | dual-ledger confusion (internal) | Doc fix in separate pack | **P3** |

*Full locale matrix:* `en.json` tourism/checkout/localHub keys are strongest; **vi.json** Local VIP strings partly hardcoded in `LocalScreen.tsx`; **cs/de/fr/ja/ko** should be spot-checked for `checkout.quoteLegal` and missing `tourism.merchantInbox` keys when fix pack runs.

---

## Flow-specific findings

### Tourism hold / confirm / cancel / inbox UI

| Aspect | Finding |
|--------|---------|
| **B2C checkout** (`checkout.*`, `TourismCheckoutScreen`) | Generally **safe**: “Send request”, footnote not withdrawable, demo note on confirmed screen. **Risk:** `quoteLegal` implies unconditional debit — inaccurate when `TOURISM_SETTLEMENT_MODE=hold` (reserve) or `preview_only` (no debit). |
| **Merchant inbox** (`tourism.merchantInbox.*`, `TourismMerchantInboxScreen`) | **Strong** EN copy for hold decline/release vs refund. **Risk:** `tourismMerchantInboxUi.ts` exposes raw enum strings `HELD`/`SETTLED` to merchants. **Risk:** `profileRoleGateMerchantBody` overclaims “get paid”. |
| **Legacy settle mode** | UI may still say “settled per backend record” only when flags true — OK. Marketing must not promise hold when env is `legacy_settle_on_book`. |

### Local classifieds VIP

| Aspect | Finding |
|--------|---------|
| Copy | i18n: `classifiedsRowSub` “VIP posts use {{unit}}” — **OK**. Composer toggle **hardcoded VI** “Đăng VIP (+amount)”. |
| Risk | Success alert implies live marketplace listing; **no** “paid boost only” disclaimer. **Do not** use escrow/hold/deposit language. |
| Ledger | User sees Firebase-synced balance chip — may not match Prisma tourism balance (dual-ledger confusion). |

### Local fixer checkout / payment preview

| Aspect | Finding |
|--------|---------|
| Copy | Screen title **“Thanh toán”** and receipt labels imply payment execution. |
| Backend | No charge; static `calculateSplitPayment` only. |
| Fix | Rename to “Hire request preview (pilot)” / i18n keys under `localHub.fixerCheckout.*`. |

### Demo lawyer booking

| Aspect | Finding |
|--------|---------|
| Copy | `bookingEscrowUi` — user title “Booking request acknowledgement” (**good**). Body explains reserve preview, not guaranteed booking. |
| Risk | Word “escrow” only in code constant names — not user-visible. |

### Legal scan charge

| Aspect | Finding |
|--------|---------|
| Copy | i18n labels include “(demo)” on scanner sublines. |
| Risk | Charge path is **Prisma debit** — user may not see price before scan unless UI shows `previewLegalScanCostVig`. Ensure debit confirmation alert mentions **VIO Credits** spend, not “payment to lawyer”. |

### Top-up / wallet pack purchase

| Aspect | Finding |
|--------|---------|
| Copy | `strings.ts` `walletTopUp.vioDisclaimerBody` — **excellent** closed-loop statement (VI + EN). |
| Risk | `balanceHint` says “synced from server” but does not clarify **Firebase vs Prisma** rail. `historyFootnote` says device history reference-only — **good**. |

### User balance display / Home overlay

| Aspect | Finding |
|--------|---------|
| Copy | `home.walletChip*` uses numeric credits; `walletTopUp.balanceCreditsDisplay` uses VIO Credits. |
| Risk | Home may overlay Prisma REST balance while Local uses Firebase — **same label, different source** (dual-ledger confusion, not wrong word). Fix in balance-unification pack + footnote “balance source: in-app wallet service”. |

### B2B merchant wallet / payment

| Aspect | Finding |
|--------|---------|
| `WalletB2BScreen` | Stripe Connect / subscription **demo** — avoid implying consumer VIO Credits withdraw. |
| `MerchantDashboardScreen` | VietQR uses `vigLabel` key but text says VIO Credits — **OK**. Radar accept/decline — **P1 fake ACK**. |
| `b2b.operatingPreview.body` | States pilot/demo data — **good**. |

### Broker escrow / cash-out demo

| Aspect | Finding |
|--------|---------|
| `BrokerDashboardScreen` | “Payout preview (demo)” — acceptable with demo label. |
| `brokerEmpireEscrow` | Mostly internal; any user-facing broker copy must not say withdrawable. |

### Loyalty / reward copy

| Aspect | Finding |
|--------|---------|
| `LoyaltyRewardsScreen` | Uses VIO Points label in places but hardcoded Vietnamese still says “VIG Tokens” in errors. |
| Policy | Points ≠ Credits; never imply points convert to bank cash. |

---

## Recommended wording rules

| Situation | Use |
|-----------|-----|
| Pre-merchant-ACK | “Request submitted for merchant review” / “VIO Credits may be held until the merchant responds (when hold mode is enabled).” |
| Decline before settle | “Release held VIO Credits back to the guest wallet” — **not** “refund” after settlement. |
| After `providerSettledAt` | “Provider settlement completed on this booking.” |
| Closed-loop disclaimer | “VIO Credits are in-app credits for VIONA services. They are not cash, cryptocurrency, or a withdrawable bank balance.” |
| Classifieds VIP | “VIP boost — featured placement in this app preview. Not a booking deposit or escrow.” |
| Fixer / Local hire | “Price preview only — no payment captured in this build.” |
| Top-up success | “VIO Credits added to your in-app wallet after server verification.” |
| Demo / mock | Prefix “Demo ·” or “Preview ·” on any CTA that does not call production settlement APIs. |
| API errors (user-visible) | Replace “VIG” with “VIO Credits”; replace “escrow” with “held balance” or “reserved credits”. |

---

## Immediate correction candidates

**Do not edit in this pack.** Target **`VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_FIX.1`**:

1. `src/screens/b2c/CashOutScreen.tsx` — gate, rename Xu, kill bank cash-out CTA or mark demo-only.
2. `src/screens/merchant/MerchantVnDashboardScreen.tsx` — cash-out button copy/nav.
3. `src/screens/b2c/ReferralRewardScreen.tsx` — cash-out nav label.
4. `src/i18n/locales/en.json` (+ vi/cs/de/fr/ja/ko) — `profileRoleGateMerchantBody`, `checkout.quoteLegal`, `b2b.radar.acceptedMsg`.
5. `src/screens/b2c/LocalScreen.tsx` — VIP toggle/success alerts → i18n + boost disclaimer.
6. `src/screens/b2c/travel/LocalFixerCheckoutScreen.tsx` (+ `LocalFixerScreen.tsx`) — payment → preview wording.
7. `src/screens/b2b/tourismMerchantInboxUi.ts` — human-readable wallet phase labels.
8. `src/controllers/WalletController.ts`, `TourismController.ts`, `BookingController.ts` — user-visible error strings (VIG → VIO Credits).

**Optional same pack:** `src/services/bookingEscrowUi.ts` constant rename (internal only).

---

## Blockers

| Blocker | Status |
|---------|--------|
| Local wallet hold/debit | **Blocked** — copy alone does not unblock |
| `VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.1` | **Still required** |
| `LocalServiceRequest` DB migration | **Not applied** on reachable dev/staging |
| Production Local commercial pilot | **Blocked** |
| Tourism production hold | Separate env + ops sign-off |

---

## Recommended next implementation packs

| # | Pack | Purpose | Allowed files | Do-not-touch | Validation | Gate |
|---|------|---------|---------------|--------------|------------|------|
| 1 | `VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_FIX.1` | Apply P0/P1 copy corrections | i18n, listed screens, controller **messages only** | Wallet math, schema, routes behavior | typecheck, lint, tourism UI display script, spot QA | CPO + Trust |
| 2 | `VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.1` | VIP vs Local vs tourism ledger boundaries | docs, flags, Local guards | Tourism hold | schema defaults test | Payments owner |
| 3 | Ops | Fix `DATABASE_URL`; `prisma migrate deploy` | env | production | migrate status | DBA |
| 4 | `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1` | Request rows | Local API | wallet hold | + Local tests | After migration |
| 5 | `VIONA.LOCAL.MERCHANT_INBOX_API.1` | Merchant inbox | inbox routes | wallet debit | inbox tests | After #4 |
| 6 | `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Local hold/settle | `WalletService` Local paths | VIP Firebase | finance scripts | **Finance sign-off** |

---

## Cross-reference

| Doc | Relevance |
|-----|-----------|
| `VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md` | Technical dual-ledger findings driving copy risk |
| `VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md` | Local VIP / mock ACK context |
| `vioDisplayConfig.ts` | Canonical public naming |

---

## Audit completion checklist

- [x] Tourism, Local VIP, fixer, lawyer demo, legal scan, top-up, balance, B2B, broker, loyalty surveyed  
- [x] Terminology policy defined  
- [x] Copy inventory table with priorities  
- [x] Immediate correction candidates listed (not implemented)  
- [x] No runtime/schema/wallet/API/UI/locale edits in this branch  
