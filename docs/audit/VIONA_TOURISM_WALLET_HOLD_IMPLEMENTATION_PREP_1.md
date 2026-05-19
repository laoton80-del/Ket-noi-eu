# VIONA.TOURISM.WALLET_HOLD_IMPLEMENTATION_PREP.1

**Document ID:** `VIONA.TOURISM.WALLET_HOLD_IMPLEMENTATION_PREP.1`  
**Type:** Implementation prep / file-function ledger map (docs only)  
**Branch:** `pack-af35-tourism-wallet-hold-implementation-prep`  
**Base master:** `948392b` — `docs(architecture): merge tourism booking state machine design`  
**Design input:** [Tourism Booking State Machine Design](../architecture/VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md)  
**Date:** 2026-05-19  

---

## Summary

| Question | Answer |
|----------|--------|
| **Can `VIONA.TOURISM.WALLET_HOLD.1` ship with zero schema change?** | **Partially.** New holds can use existing `Wallet.balanceVIG` + `Wallet.lockedBalanceVIG` and per-row `TourismBooking.totalPaidVIG` (same pattern as legacy `Booking.lockedAmountVIG`). **Cannot** reliably represent `walletPhase` or distinguish **legacy settled-while-`PENDING`** rows without at least one new nullable column (recommended: `providerSettledAt`) or a backfill-only flag. |
| **Highest money/ledger risks** | (1) Splitting settlement without reversing already-credited provider/treasury on old rows. (2) `Transaction` has **no `tourismBookingId`** — reconciliation is by amount/timing/sentinel unless extended. (3) `completeTourismBookingAsMerchant` still allows `PENDING`→`COMPLETED` with funds already paid. (4) Aggregate `lockedBalanceVIG` must stay ≥ sum of open tourism holds. |
| **Recommended first implementation pack** | **`VIONA.TOURISM.WALLET_HOLD.1`** — new `processTourismBookingHold` + feature flag; **do not** ship consumer launch until **`VIONA.TOURISM.EXISTING_ROWS_COMPATIBILITY.1`** (minimal migration + backfill) is planned. |

---

## Current settlement path

| Step | File / function | Current behavior | Wallet effect (tourist) | Provider / treasury | Booking status | Risk |
|------|-----------------|------------------|-------------------------|---------------------|----------------|------|
| 1 Quote | `TourismHubService.quoteTourismBooking` → `computeTourismDualSplitAmounts` | Server math only | None | None | — | OK |
| 2 Submit | `TourismController.postBook` → `TourismHubService.createTourismBooking` | Calls settlement | — | — | — | Entry |
| 3 Settle | `WalletService.processTourismBookingSettlement` | Single Serializable txn | `balanceVIG` **decrement** `totalPaidVIG` | — | — | P0 |
| 3b Provider pay | Same function L673–677 | Immediate credit | — | `balanceVIG` **increment** `netProviderEarningsVIG` | — | P0 |
| 3c Treasury pay | Same function L680–685 | Immediate fee credit | — | Treasury **increment** `providerFeeVIG + touristFeeVIG` | — | P0 |
| 3d Ledger | Same function L687–727 | `Transaction` rows | `TxType.BOOKING` (tourist leg) | `TxType.BOOKING` (provider), `TxType.PLATFORM_FEE` (treasury) | — | No booking FK |
| 3e Row | Same function L729–746 | Insert | — | — | **`PENDING`** | Misaligned |
| 4 B2C UI | `TourismCheckoutScreen.onPay` → `paymentApi.confirmTourismBooking` | `POST /api/tourism/book` | (already settled) | — | — | Copy says request preview |
| 5 Complete | `TourismController.postCompleteBooking` → `completeTourismBookingAsMerchant` | Status → `COMPLETED` only | No wallet change | No clawback | `PENDING` or `CONFIRMED` → `COMPLETED` | Skips CONFIRMED |

**Call chain (book):**  
`TourismCheckoutScreen` → `paymentApi.confirmTourismBooking` → `POST /api/tourism/book` → `TourismController.postBook` → `createTourismBooking` → **`processTourismBookingSettlement`**.

---

## Focus questions — answers

| # | Answer |
|---|--------|
| 1 | **Debits tourist:** `WalletService.processTourismBookingSettlement` — `tx.wallet.updateMany` decrement `balanceVIG` (L657–664). |
| 2 | **Pays provider:** Same function — `providerWallet.balanceVIG` increment `netProviderEarningsVIG` (L673–677). **Pays treasury:** `treasuryWallet.balanceVIG` increment `masterRevenueVIG` (L680–685). |
| 3 | **Records txs:** Prisma `Transaction` (model `Transaction`, not `WalletTransaction`). No FK to `TourismBooking`. |
| 4 | **Hold type exists?** **Yes** — `TxType.BOOKING_LOCK` used in `BookingService.createBooking` with sentinel `ViGlobalBookingLock`. **Not used** by tourism today. Also `ESCROW_LOCK` / `ESCROW_REFUND` in enum. |
| 5 | **Refund/reversal for tourism?** **No** tourism-specific function. Legacy `BookingService.cancelBooking` releases `lockedBalanceVIG` + `ESCROW_REFUND` tx. |
| 6 | **Tourism cancel API?** **No** — `tourismRoutes.ts` has no cancel/reject/confirm routes. |
| 7 | **`walletPhase` without schema?** **No reliable column.** Infer only: `status` + heuristics (unsafe). `totalPaidVIG` names “paid” but can mean hold amount. |
| 8 | **Schema if needed (minimal):** `providerSettledAt DateTime?`, optional `TourismWalletPhase` enum, optional `Transaction.tourismBookingId` + `TxType.TOURISM_HOLD` (enum migration). See [Hold model feasibility](#hold-model-feasibility). |
| 9 | **Existing PENDING settled?** **Yes** — any row created by current code where provider/treasury credits ran in same txn as create. **Detection:** `status = PENDING` AND provider wallet received `BOOKING` tx with matching `netProviderEarningsVIG` after `createdAt` (fragile) OR set `providerSettledAt` via backfill/migration. |
| 10 | **Smallest safe pack after prep:** Flag-gated **`processTourismBookingHold`** only on book; gate **`complete`** on `providerSettledAt != null` or `CONFIRMED`; compatibility migration before enabling flag in prod. |

---

## Existing ledger / wallet capabilities

| Capability | Exists? | File / entity | Notes |
|------------|---------|---------------|-------|
| Spendable balance | Yes | `Wallet.balanceVIG` | Tourism debits here today |
| Locked balance (aggregate) | Yes | `Wallet.lockedBalanceVIG` | Used by legacy `Booking`; **not** tourism |
| Per-booking locked amount | Yes (legacy) | `Booking.lockedAmountVIG` | Tourism uses `TourismBooking.totalPaidVIG` analog |
| `BOOKING_LOCK` tx | Yes | `BookingService.createBooking` | Pattern to copy for tourism hold |
| `ESCROW_REFUND` tx | Yes | `BookingService.cancelBooking` | Tourism cancel can mirror |
| `PENALTY_FEE` / penalty split | Yes | `cancelBooking` | Optional for post-CONFIRMED cancel v2 |
| Tourism settle-on-book | Yes | `processTourismBookingSettlement` | Target to split |
| Tourism hold-on-book | **No** | — | **Implement** |
| Tourism settle-on-confirm | **No** | — | Extract provider/treasury legs from current function |
| Tourism cancel/release | **No** | — | New API + service |
| Merchant confirm → `CONFIRMED` | **No writer** | Enum exists | New endpoint |
| `Transaction` → booking link | **No** | `Transaction` model | Recommend `idempotencyKey`: `tourism-hold-{bookingId}` |
| Wallet balance API | Yes | `WalletController.getBalance` | Returns `lockedBalanceVIG` — UI can show holds |
| Firebase `walletOps` | Yes | `functions` `walletOps` | **Not** tourism path — do not mix |

---

## Hold model feasibility

### Can hold use existing fields only?

| Mechanism | Feasible? | How |
|-----------|-----------|-----|
| Tourist hold | **Yes** | On book: `balanceVIG -= totalPaidVIG`, `lockedBalanceVIG += totalPaidVIG` (mirror `BookingService` L149–156). |
| Per-booking hold size | **Yes** | Store in existing `TourismBooking.totalPaidVIG` (rename in copy only; optional later `holdAmountVIG` alias). |
| Skip provider pay on book | **Yes** | Omit L673–727 provider/treasury updates in hold path. |
| `walletPhase` on row | **No** | Requires new column or nullable timestamp |
| Ledger audit per booking | **Weak** | Use `BOOKING_LOCK` tx + `idempotencyKey` = `tourism-hold-{id}` until `tourismBookingId` FK added |

### Recommended minimal schema (compatibility + clarity)

```prisma
// Minimal v1 migration (recommended before prod flag)
providerSettledAt   DateTime?  // null = hold only; non-null = provider/treasury credited
confirmedAt         DateTime?  // merchant ACK (CONFIRMED transition)
cancelledAt         DateTime?
cancelReason        String?    // PROVIDER_REJECTED | USER_CANCEL | EXPIRED | OPS
```

Optional v2:

```prisma
enum TourismWalletPhase { NONE HELD SETTLED RELEASED REFUNDED }
walletPhase TourismWalletPhase @default(NONE)
```

```prisma
// Ledger v2
tourismBookingId String? @index
// TxType.TOURISM_HOLD | TOURISM_SETTLE | TOURISM_RELEASE (enum migration)
```

**Verdict:** **`WALLET_HOLD.1` behavior can start without enum `walletPhase`** if `providerSettledAt` is added for compatibility; **strongly recommended** over zero-schema for any environment with existing tourism rows.

---

## Cancel / release / refund readiness

| Scenario | Current support | Required support | Risk |
|----------|-----------------|------------------|------|
| User cancel before ACK | None | `CANCELLED` + release hold (`lockedBalanceVIG` ↓, `balanceVIG` ↑) | P0 if hold ships without this |
| Merchant reject | None | Same as cancel | P0 |
| Review timeout | None | Cron → `CANCELLED` + release | P1 |
| Cancel after CONFIRMED | None | Policy + possible clawback | P2 |
| Failed hold (insufficient) | 409 `insufficient_funds` | Keep | OK |
| Legacy row cancel | N/A | Ops script; may need manual ledger | P0 data |

---

## Existing data compatibility

| Topic | Detail |
|-------|--------|
| **Who is affected** | All `TourismBooking` rows created via `processTourismBookingSettlement` before hold flag: `status = PENDING` (or `COMPLETED`) with provider already paid. |
| **Detection strategy** | **Preferred:** backfill `providerSettledAt = createdAt` (or `fxLockedAt`) for all rows where settlement txn ran. **Heuristic:** count provider `Transaction` `BOOKING` type where `amountVIG ≈ netProviderEarningsVIG` and `senderId = touristUserId` within Δt of booking `createdAt`. |
| **Migration / backfill** | One-off SQL/script in `VIONA.TOURISM.EXISTING_ROWS_COMPATIBILITY.1`; do not auto-release holds on these rows. |
| **Launch gate** | Enable `TOURISM_SETTLEMENT_MODE=hold` only when backfill complete + merchant confirm path planned. Staging may keep `legacy_settle_on_book` behind separate flag for QA comparison. |

---

## Classify required changes

| Area | Status | Pack |
|------|--------|------|
| B2C copy (request preview, hold language) | **Done** (`7292a03`) | — |
| Service: hold on book | **Required** | `WALLET_HOLD.1` |
| Service: settle on confirm | **Required** | `MERCHANT_ACK_CONFIRM.1` |
| Service: release on cancel | **Required** | `CANCEL_RELEASE_API.1` |
| Schema: `providerSettledAt` (+ optional phase enum) | **Recommended** | `EXISTING_ROWS_COMPATIBILITY.1` |
| Ledger: `BOOKING_LOCK` on hold; settle txs on confirm | **Required** | `WALLET_HOLD.1` + confirm pack |
| API: confirm / reject / cancel / inbound list | **Required** | `MERCHANT_ACK_*`, `CANCEL_RELEASE_*` |
| UI: show locked vs spendable | **Required** | UI gate pack |
| Backfill legacy rows | **Required** before prod | `EXISTING_ROWS_COMPATIBILITY.1` |
| Ops / legal sign-off | **Required** | Hold/refund policy before commercial Lite |
| Feature flag `TOURISM_SETTLEMENT_MODE` | **Required** | `WALLET_HOLD.1` |

---

## Recommended implementation packs

### 1. `VIONA.TOURISM.WALLET_HOLD.1`

| Item | Detail |
|------|--------|
| **Target files** | `src/services/WalletService.ts` (split `processTourismBookingSettlement` → `processTourismBookingHold` + `settleTourismBookingToProvider`); `src/services/api/TourismHubService.ts` (`createTourismBooking`); `src/controllers/TourismController.ts`; env `TOURISM_SETTLEMENT_MODE` |
| **Behavior** | Hold path: tourist lock only + `BOOKING_LOCK` tx + `PENDING`; no provider/treasury credit. Legacy path behind `legacy_settle_on_book`. |
| **Schema** | Optional in same pack: `providerSettledAt` only if compatibility pack not separate |
| **Risk** | Breaking staging data expectations; insufficient `lockedBalanceVIG` accounting |
| **Sign-off** | Payments + Ledger |
| **Do-not-touch** | `BookingService` cancel penalty math; Firebase `walletOps`; Stripe rails |

### 2. `VIONA.TOURISM.EXISTING_ROWS_COMPATIBILITY.1`

| Item | Detail |
|------|--------|
| **Target files** | `prisma/schema.prisma`; migration SQL; `scripts/` backfill; docs |
| **Behavior** | Add `providerSettledAt`, backfill existing settled rows; default null for new hold-only rows |
| **Risk** | Wrong backfill → double pay or wrongful release |
| **Sign-off** | Ledger + Ops |
| **Do-not-touch** | Consumer-facing copy until hold verified |

### 3. `VIONA.TOURISM.MERCHANT_ACK_CONFIRM.1`

| Item | Detail |
|------|--------|
| **Target files** | `WalletService.ts` (settle function); `TourismController.ts`; `tourismRoutes.ts` (`POST …/confirm`); B2B inbound UI (later) |
| **Behavior** | `PENDING` → `CONFIRMED`; call settle; set `providerSettledAt`, `confirmedAt` |
| **Risk** | Double settlement if `providerSettledAt` already set |
| **Sign-off** | CPO + B2B owner |
| **Do-not-touch** | `complete` until CONFIRMED gate enforced |

### 4. `VIONA.TOURISM.CANCEL_RELEASE_API.1`

| Item | Detail |
|------|--------|
| **Target files** | New `cancelTourismBooking` / `releaseTourismHold` in `WalletService.ts`; routes `cancel`, `reject` |
| **Behavior** | `CANCELLED` + release hold if `providerSettledAt` null; else ops playbook |
| **Risk** | Releasing already-settled funds |
| **Sign-off** | Trust + Ops |
| **Do-not-touch** | Legacy `cancelBooking` |

### 5. `VIONA.TOURISM.COMPLETE_GATE.1` (small, can merge with ACK)

| Item | Detail |
|------|--------|
| **Target files** | `completeTourismBookingAsMerchant` |
| **Behavior** | Require `status === CONFIRMED` (or `providerSettledAt != null`); forbid `PENDING`→`COMPLETED` |
| **Risk** | Breaks current merchant workflow |
| **Sign-off** | B2B owner |

### 6. `VIONA.TOURISM.UI_WALLET_DISPLAY.1`

| Item | Detail |
|------|--------|
| **Target files** | `TourismCheckoutScreen`, wallet hub, `GET /api/wallet/balance` consumers |
| **Behavior** | Show spendable vs on-hold; gate CTA on `TOURISM_SETTLEMENT_MODE` |
| **Copy** | Already mostly done |
| **Sign-off** | Trust & Safety |

---

## Related surfaces (do not conflate)

| Surface | Ledger | Notes |
|---------|--------|-------|
| `bookingEscrowUi.ts` | Legacy `POST /api/bookings` | Hold via `BookingService`; not tourism |
| `bookingEscrowUi` copy | — | Already request-preview aligned |
| Classifieds VIP | Firebase `walletOps` | Separate pack: wallet SoT unification |
| `completeTourismBookingAsMerchant` | No-op on wallet today | Must not run before settle on old path |

---

## Smallest safe sequence

1. **`EXISTING_ROWS_COMPATIBILITY.1`** (schema + backfill) — or ship together with hold in single migration PR.  
2. **`WALLET_HOLD.1`** (flag default `hold` in staging only).  
3. **`MERCHANT_ACK_CONFIRM.1`** + **`COMPLETE_GATE.1`**.  
4. **`CANCEL_RELEASE_API.1`**.  
5. **`UI_WALLET_DISPLAY.1`** + enable flag for pilot merchants.

---

## File / function index (implementation map)

| Symbol | Path |
|--------|------|
| `processTourismBookingSettlement` | `src/services/WalletService.ts` |
| `completeTourismBookingAsMerchant` | `src/services/WalletService.ts` |
| `createTourismBooking` | `src/services/api/TourismHubService.ts` |
| `confirmTourismBooking` | `src/services/api/paymentApi.ts` |
| `postBook` | `src/controllers/TourismController.ts` |
| `createBooking` / `cancelBooking` | `src/services/api/BookingService.ts` |
| `confirmSecurityDepositThen` | `src/services/bookingEscrowUi.ts` |
| `TourismCheckoutScreen.onPay` | `src/screens/b2c/TourismCheckoutScreen.tsx` |
| `TourismBooking` / `TourismBookingStatus` | `prisma/schema.prisma` |
| `Wallet` / `Transaction` / `TxType` | `prisma/schema.prisma` |
| Tourism routes | `src/routes/tourismRoutes.ts` |

---

*End of prep — no behavior, schema, or route changes in this pack.*
