# VIONA.TRAVEL_LOCAL.BACKEND_SOURCE_OF_TRUTH_AUDIT.1

**Document ID:** `VIONA.TRAVEL_LOCAL.BACKEND_SOURCE_OF_TRUTH_AUDIT.1`  
**Type:** Read-only backend / ledger / state-machine audit (report only)  
**Branch:** `pack-af33-travel-local-backend-source-of-truth-audit`  
**Base master:** `8f21ee9` — `fix(copy): merge travel local fulfillment wording safety`  
**Prior copy pack:** `7292a03` — Travel/Local fulfillment wording aligned on B2C surfaces  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Travel/Local Fulfillment Readiness Audit](./VIONA_TRAVEL_LOCAL_FULFILLMENT_READINESS_AUDIT_1.md), [Global Active / Full Standard Lock](./VIONA_GLOBAL_ACTIVE_FULL_STANDARD_LOCK_1.md).

**Scope note:** Paths `src/screens/travel/**`, `src/screens/tourism/**`, `src/screens/local/**` map to `src/screens/b2c/travel/**`, `src/screens/b2c/*Tourism*`, `src/screens/b2c/LocalScreen.tsx`. No `src/services/checkout/**` package; checkout logic lives under `paymentApi`, `WalletService`, `BookingService`, and screens.

---

## Summary

| Item | Result |
|------|--------|
| **Overall backend readiness** | **Not launch-ready for unified fulfillment truth.** Tourism checkout has a **real Postgres wallet settlement** at book time, but **no merchant ACK transition to `CONFIRMED`**, **no tourism cancel/refund API**, and **funds move immediately to provider/treasury** while status stays `PENDING`. Legacy `Booking` uses a **stronger hold + cancel/refund** model but is only wired from demo/env-gated Local paths. B2C merchant “confirm” UIs largely use **Zustand mocks**, not `TourismBooking` rows. |
| **Highest-risk flows** | (1) **Tourism `POST /api/tourism/book`** — immediate debit + provider credit, `PENDING` only, no reversal path in API. (2) **Dual wallet SoT** — tourism uses **Prisma `Wallet.balanceVIG`**; classifieds VIP uses **Firebase `walletOps` credits**. (3) **Missing merchant tourism inbox** — `POST …/complete` exists; no list/confirm/cancel routes for inbound tourism on merchant app. |
| **Behavior fixes needed?** | **Yes** — separate behavior pack(s): hold-not-settle tourism, tourism cancel/refund, `CONFIRMED` transition + merchant ACK API/UI, align display wallet with debit ledger. |
| **Data model / state machine changes?** | **Yes** — document and implement tourism lifecycle (`PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED`) with ledger rules per transition; resolve dead `CONFIRMED` enum usage. |
| **Recommended next pack** | **`VIONA.TOURISM.BOOKING.STATE_MACHINE_DESIGN.1`** (design doc + API contract, no blind code) then **`VIONA.TOURISM.WALLET_HOLD_AND_REFUND.1`** (behavior). |

---

## Flow inventory

| Flow | Files / services | User action | Wallet debit? | Backend record? | Status | Merchant/provider ACK? | Fulfillment? | Risk | Notes |
|------|------------------|-------------|---------------|-----------------|---------|------------------------|--------------|------|-------|
| Tourism checkout | `TourismCheckoutScreen`, `paymentApi.confirmTourismBooking`, `TourismHubService.createTourismBooking`, `WalletService.processTourismBookingSettlement` | Submit request (CTA debits) | **Yes** — `balanceVIG` decrement (spendable) | **Yes** — `TourismBooking` | `PENDING` at create | **No API** to set `CONFIRMED` | **Partial** — `POST /api/tourism/bookings/:id/complete` → `COMPLETED` (owner only) | **P0** | Provider paid at book time; tourist not held in escrow |
| Tourism quote | `POST /api/tourism/quote` | Preview pricing | No | No | — | — | — | OK | Server-only math |
| Tourism success UI | `TourismBookingConfirmedScreen` | View after book | (already debited) | Row exists | `PENDING` | — | — | **P1** | Copy now says request preview; ledger already moved |
| Tourism Trip Wrapped | `GET /api/tourism/wrap/:id`, `ViralWrapEngine` | Share stats | No | Reads booking | Allows `PENDING`/`CONFIRMED`/`COMPLETED` for wrap | — | — | **P2** | Marketing read path |
| Legacy booking (Local lawyer demo) | `LocalScreen` → `bookingService.createBooking` → `api/BookingService.createBooking` | Accept escrow alert → POST | **Hold** — `balanceVIG` → `lockedBalanceVIG` | **Yes** — `Booking` | `PENDING`, `PayStatus.DEPOSIT_PAID` if lock > 0 | Merchant QR complete / B2B flows | QR `completeBookingViaQr` → `COMPLETED` | **P2** | Real escrow-style lock; env-gated demo IDs |
| Legacy booking cancel | `BookingService.cancelBooking` | (API; not wired on audited B2C Local UI) | Release lock; 80% refund / 20% penalty split | Updates `Booking` | → `CANCELLED` | N/A | — | **P3** | Implemented server-side; exposure gap on UI |
| Local classifieds (normal) | `LocalScreen.submitPost` | Post listing | No | **No** — React state only | — | — | — | OK | `DEFAULT_POSTS` + local `useState` |
| Classifieds VIP | `LocalScreen` → `reserveAndCommitCredits` | VIP toggle post | **Yes** — Firebase `walletOps` reserve+commit | **No** listing persistence | — | — | — | **P1** | Debits **different** ledger than tourism; posts not on server |
| Local fixer marketplace | `LocalFixerScreen`, `LocalFixerCheckoutScreen`, `LocalFixerService` | View pricing / navigate | No | No | — | No dispatch | No | OK | Split math only; demo/pilot footnote |
| Flight search demo | `FlightSearchScreen`, `FlightApiService.searchFlights` | Search / “book” offer | No | No | In-memory `confirmed` | — | — | OK | Mock offers; alert says demo |
| Homestay cross-sell | `HomestayCrossSellWidget` → `MerchantDetail` | Tap listing | No | Merchant browse only | — | — | — | OK | No order created from widget |
| Travel Hub scenarios | `TravelScreen` / `TravelHubScreen`, Leona prefills | Guidance / call assist | No* | No | — | — | — | OK | *Unless user opens separate monetized call flows |
| B2B merchant calendar mock | `state/b2bBooking.ts`, `InboundQueueScreen` | Confirm inquiry | No | **Zustand only** | `inquiry` → `confirmed` | **UI mock only** | No | **P2** | Not `TourismBooking` / Prisma `Booking` |
| `bookingEscrowUi` | `bookingEscrowUi.ts` | Alert before `createBooking` | Describes hold | — | — | — | — | **P3** | Copy fixed; legacy lock behavior on server |
| Stripe commercial sheet | `PaymentCheckoutSheet`, `walletOps` charge | Demo nail checkout | Firebase charge op | No booking | — | — | — | OK | Out of Travel/Local tab scope |

---

## Wallet / VIO Credits truth table

| Action | Debit? | Ledger / source of truth | Reversible? | Refund / cancel path? | User-facing copy (post copy-pack) | Risk |
|--------|--------|---------------------------|-------------|------------------------|-----------------------------------|------|
| Tourism book | **Yes** — Prisma `Wallet.balanceVIG` ↓ | `WalletService.processTourismBookingSettlement` + `Transaction` rows (`BOOKING`, `PLATFORM_FEE`) | **No API** | None for tourism | Request preview / send request | **P0** |
| Tourism book (provider side) | **Credit** at same txn | Provider `balanceVIG` ↑ `netProviderEarningsVIG`; treasury ↑ fees | N/A | No clawback API found | — | **P0** |
| Legacy `createBooking` | **Hold** — spendable ↓, `lockedBalanceVIG` ↑ | Prisma `Booking` + `BOOKING_LOCK` tx | **Yes** | `cancelBooking` — 80% to booker, 20% penalty split | Escrow alert → request preview | **P2** |
| Legacy QR complete | Release lock → pay merchant | `completeBookingViaQr` | No (final) | — | B2B / merchant | **P3** |
| Classifieds VIP | **Yes** — Firebase `users/{uid}` credits | `functions` `walletOps` `reserve` + `commit` | `rollback` op exists | Not wired on Local VIP failure after commit | Local alert only | **P1** |
| Interpreter / Leona / Academy debits | Yes (various) | `walletOps` / trusted charge | Partial | Flow-specific | Out of scope | — |
| Wallet display (Home / checkout) | — | **Split:** REST `GET /api/wallet/balance` (Prisma) vs `syncWalletFromServer` (Firebase) | — | Tourism checkout insufficient funds uses **REST 409** | VIO Credits footnote on checkout | **P2** |
| Stripe top-up | Credit | `walletOps` topup + Payments verify | — | — | Top-up screens | **P3** |

**Critical finding:** Tourism and classifieds VIP can debit **different balances** on the same user if both subsystems are active — product must declare **one consumer spendable SoT** or sync bridges.

---

## Booking / request state machine

### `TourismBooking` (Prisma `TourismBookingStatus`)

| Status | Set by (code found) | Transitions found | Missing transitions | Launch gate |
|--------|---------------------|-------------------|---------------------|-------------|
| `PENDING` | `processTourismBookingSettlement` on `POST /api/tourism/book` | → `COMPLETED` via merchant complete | → `CONFIRMED` (**no writer**), → `CANCELLED` (**no writer**) | **Pilot** until cancel + ACK |
| `CONFIRMED` | **None** | Referenced in `completeTourismBookingAsMerchant` (allowed input) | Never assigned in codebase grep | **Do not expose** until implemented |
| `COMPLETED` | `completeTourismBookingAsMerchant` (`POST /api/tourism/bookings/:id/complete`) | Terminal | — | Merchant fulfillment sign-off |
| `CANCELLED` | **None** | In admin stats aggregation | No cancel API | **Required** before commercial launch |

**Routes (`tourismRoutes.ts`):** `GET /discover`, `POST /quote`, `POST /book`, `GET /wrap/:bookingId`, `POST /bookings/:bookingId/complete` — **no** list-for-merchant, **no** confirm, **no** cancel.

### `Booking` (legacy B2C services — Prisma `BookStatus` / `PayStatus`)

| Status | Set by | Transitions |
|--------|--------|-------------|
| `PENDING` | `createBooking` | → `COMPLETED` (QR), → `CANCELLED` (`cancelBooking`) |
| `CONFIRMED` | Not set on create in `createBooking` | Used in B2B staff labels / other paths |
| `COMPLETED` | `completeBookingViaQr` | Terminal |
| `CANCELLED` | `cancelBooking` | Terminal |

`paymentStatus`: `UNPAID` \| `DEPOSIT_PAID` \| `FULL_PAID` — lock moves on create when price > 0.

### B2B Zustand `state/b2bBooking.ts`

| Status | Storage | Backend |
|--------|---------|---------|
| `inquiry` \| `confirmed` \| `completed` \| `no_show` | In-memory mock | **None** |

### Local commerce registry (`core/localCommerce`)

| `LocalBookingStatus` | Meaning |
|----------------------|---------|
| `lite` \| `requestOnly` \| `demo` \| `pilot` \| `comingSoon` \| `gated` | **Capability labels only** — not Prisma enums |

---

## Merchant / provider ACK matrix

| Flow | ACK required? | ACK implemented? | User-visible confirmation source | Risk |
|------|---------------|------------------|----------------------------------|------|
| Tourism stay book | **Yes** (product) | **No** `CONFIRMED` transition; merchant complete skips to `COMPLETED` | B2C screen: i18n request preview | **P0** |
| Tourism merchant UI | Yes | **No** inbound tourism queue in audited B2B screens | Admin stats only | **P0** |
| Legacy `Booking` | Yes | QR complete + optional B2B staff queue (separate) | Server `Booking.status` | **P2** |
| Local fixer hire | Yes | **No** booking row / dispatch | Pilot CTA only | OK |
| Classifieds | No | N/A | Local device list | OK |
| Flight demo | No | N/A | Demo alert + in-memory state | OK |
| B2B `confirmBooking` | Appears yes | **Mock store only** | Zustand | **P2** |

---

## Local-only / demo-only flows

| Flow | Storage / source | Commercial risk | Recommended framing |
|------|----------------|-----------------|---------------------|
| Flight search offers | `FlightApiService` mock + component state | Low if labeled demo | Keep demo + no backend order |
| Flight “book” | `setConfirmed(offer)` + Alert | Low | Already demo alert |
| Classifieds posts | `useState` + `DEFAULT_POSTS` | Medium if VIP debits real credits | Disclose device-local + no marketplace moderation |
| Local fixer checkout | `calculateSplitPayment` only | Medium if Stripe wired without request row | Pilot / preview only |
| Lawyer demo booking | `EXPO_PUBLIC_DEMO_BOOKING_*` env | Low when env missing | Demo/staging only |
| B2B booking board | Zustand mocks | High if mistaken for production | Gate B2B dashboards as pilot |
| Travel premium alerts (fast track, etc.) | Alert demos on Travel hub | Low | Demo/pilot |

---

## Audit question answers

1. **Debit VIO Credits:** Tourism book (Prisma wallet); classifieds VIP (Firebase walletOps); legacy booking hold (Prisma); various AI/call flows (walletOps).
2. **Create backend records:** Tourism → `TourismBooking`; legacy booking → `Booking` + transactions; classifieds → none.
3. **Status fields:** `TourismBooking.status`, `Booking.status` + `paymentStatus`, B2B mock `status`, localCommerce capability `status` (label only).
4. **Statuses:** See state machine tables.
5. **User-visible:** Tourism confirmed screen (preview copy); B2B mock labels; Prisma statuses on API responses if exposed.
6. **Merchant ACK:** Legacy booking (QR/B2B); tourism **not** for CONFIRMED; mock B2B only.
7. **Cancel/refund:** `cancelBooking` for legacy `Booking`; **none** for tourism; walletOps `rollback` for uncommitted reserve (not used after VIP commit).
8. **Local/on-device:** Classifieds, flight selection, B2B mock bookings.
9. **Demo-only:** Flight API, demo booking env, many Travel hub tiles, fixer checkout (no charge).
10. **Launch gates:** Tourism needs hold/refund, merchant ACK API + UI, single wallet SoT, tourism cancel.
11. **Source of truth:**
    - **Wallet balance (tourism):** Postgres `Wallet` via REST.
    - **Wallet balance (many B2C features):** Firebase `walletOps`.
    - **Booking status (tourism):** `TourismBooking.status` in Postgres.
    - **Booking status (local services):** `Booking` in Postgres (when API used).
    - **Merchant acceptance:** Not persisted for tourism; mock for B2B UI.
    - **Provider dispatch:** Not implemented (fixer).
    - **Payment capture:** Tourism = immediate VIG ledger transfer; legacy = lock then QR release; card Stripe separate.
    - **Refund/reversal:** Legacy cancel only.

---

## Recommended next packs

| Pack | Target | Risk fixed | Type | Do-not-touch | Sign-off |
|------|--------|------------|------|--------------|----------|
| **`VIONA.TOURISM.BOOKING.STATE_MACHINE_DESIGN.1`** | `docs/` + OpenAPI sketch; `TourismBookingStatus` transitions | Dead `CONFIRMED`, missing cancel | Design / docs | Prisma until approved | CPO + Payments owner |
| **`VIONA.TOURISM.WALLET_HOLD_AND_REFUND.1`** | `WalletService.processTourismBookingSettlement`, tourism routes | P0 debit-without-refund | **Behavior** | Legacy `Booking` lock logic | Payments + Ledger |
| **`VIONA.TOURISM.MERCHANT_INBOUND_QUEUE.1`** | B2B screens + `TourismController` list/confirm APIs | No merchant ACK UI | **Behavior + UI** | Mock `b2bBooking` store | Mini-app owner + Ops |
| **`VIONA.WALLET.SOT_UNIFICATION.1`** | `state/wallet.ts`, Home/checkout balance reads | Dual Firebase vs Prisma | **Behavior** | Stripe top-up verify contract | Platform lead |
| **`VIONA.LOCAL.CLASSIFIEDS.VIP_TRUTH.1`** | `LocalScreen`, wallet bridge | VIP debits wrong ledger / no persistence | Copy + light behavior | Tourism settlement | Product + Trust |

---

## Search commands (representative)

```bash
rg "processTourismBookingSettlement|TourismBookingStatus|createBooking|cancelBooking" src/services src/controllers prisma
rg "reserveAndCommitCredits|walletOps" src state functions
rg "tourismRouter|/api/tourism" src/routes
rg "confirmBooking|useB2BBookingStore" src/screens/b2b src/state
```

---

*End of audit — no application logic, schema, or route changes in this pack.*
