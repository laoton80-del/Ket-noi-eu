# VIONA.TOURISM.BOOKING.STATE_MACHINE_DESIGN.1

**Document ID:** `VIONA.TOURISM.BOOKING.STATE_MACHINE_DESIGN.1`  
**Type:** Architecture / state-machine design (docs only — no behavior change in this pack)  
**Branch:** `pack-af34-tourism-booking-state-machine-design`  
**Base master:** `60b6733` — `docs(audit): merge travel local backend source of truth audit`  
**Inputs:** [Travel/Local Backend SoT Audit](../audit/VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md), [Fulfillment Readiness Audit](../audit/VIONA_TRAVEL_LOCAL_FULFILLMENT_READINESS_AUDIT_1.md), [Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md)  
**Date:** 2026-05-19  

**Design law:** No function removal. Do not ship behavior that implies confirmed booking, captured payment, or provider fulfillment until the state machine and ledger rules below are implemented and verified.

---

## Summary

| Item | Recommendation |
|------|----------------|
| **Recommended model** | **Hold-then-settle tourism booking** on Prisma `TourismBooking`, reusing enum values `PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED`, plus a parallel **`walletPhase`** (or reuse `Wallet.lockedBalanceVIG` per booking) for ledger truth. Client-only **request preview** before `POST /api/tourism/book`. |
| **Debit timing** | **Pilot / commercial Lite:** place **hold** on submit (`PENDING`); **settle to provider/treasury only on merchant `CONFIRMED`**. **Do not** keep today’s “debit + pay provider at book” for consumer launch. |
| **Launch gate** | **Block consumer “commercial” tourism checkout** until: hold + cancel/release API, merchant ACK API + inbox, UI copy gated by `status` + `walletPhase`, single wallet SoT for tourism debits. **Pilot** may use `tourismSettlementMode=preview` (no ledger) or `hold` (ledger). |
| **Highest-risk current gap** | `processTourismBookingSettlement` **debits tourist and credits provider in one transaction** while `status=PENDING` — irreversible without new APIs. |

---

## Current behavior from audit

| Behavior | Today (code) | Risk |
|----------|--------------|------|
| Wallet debit | Tourist `Wallet.balanceVIG` decremented on `POST /api/tourism/book` | P0 — treated as final pay |
| Provider payout | Provider `balanceVIG` incremented + treasury fees in same txn | P0 — before ACK |
| Booking status | `TourismBooking.status = PENDING` at create | Misaligned with ledger |
| `CONFIRMED` | Enum exists; **never written** | Dead state / false expectation |
| Cancel / refund | **No tourism API** | P0 |
| Merchant ACK | Only `POST …/bookings/:id/complete` → `COMPLETED` (owner) | Skips CONFIRMED |
| Legacy `Booking` | Hold + `cancelBooking` 80/20 split | Good reference pattern |
| B2C wallet display | Prisma (tourism) vs Firebase `walletOps` (other) | Split SoT |

---

## Design questions — answers

1. **Correct lifecycle:** Request → merchant review → confirmed commitment → fulfilled → closed (or cancelled/rejected/expired at review stage).
2. **When debit VIO Credits:** On **submit** only as **hold** (move to locked / booking escrow bucket), not as final settlement.
3. **Credit model comparison:** See [Wallet / VIO Credits model](#wallet--vio-credits-model). **Recommend hold on submit, settle on CONFIRMED** for pilot+.
4. **Required states:** Prisma `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` (+ optional `cancelReason` / `rejectedBy` fields). Client-only preview before row exists.
5. **Transitions:** See state table below.
6. **Reject / timeout:** → `CANCELLED` with reason; release hold (full or policy refund); **no** provider settlement.
7. **Refund path:** Required before launch — release hold or reverse settlement with idempotent ledger txs.
8. **UI per state:** See [UI wording rules](#ui-wording-rules-by-state).
9. **SoT entity:** **`TourismBooking`** (+ `Transaction` ledger lines). Wallet balances on **`Wallet`** (`balanceVIG`, `lockedBalanceVIG` or per-booking hold linkage).
10. **`PENDING` / `CONFIRMED` enum:** **Retain** values; **redefine semantics** and implement missing writers. Do not add 14 Prisma enum values in v1 — map extras to `CANCELLED` + metadata or `walletPhase`.
11. **Ledger representation:** Distinct `TxType` or tagged `BOOKING` lines: `TOURISM_HOLD`, `TOURISM_SETTLE_PROVIDER`, `TOURISM_SETTLE_TREASURY`, `TOURISM_RELEASE_HOLD`, `TOURISM_REFUND` (names illustrative; align with existing `TxType` migration policy).
12. **Pilot / demo:** Feature-flagged `tourismSettlementMode`: `preview` (no wallet), `hold` (recommended pilot), `legacy_settle_on_book` (staging only, labeled internal).

---

## Candidate states — evaluation

| Candidate | Verdict | Mapping |
|-----------|---------|---------|
| `DRAFT` | Optional v2 | Client draft or server draft before pay CTA — not in Prisma v1 |
| `REQUEST_PREVIEW` | **Client-only** | Before `POST /book`; quote screen |
| `SUBMITTED` | Merge | = `PENDING` at row create |
| `PENDING_PROVIDER` | Rename meaning | Use **`PENDING`** = awaiting merchant/provider review |
| `PENDING_PAYMENT_HOLD` | Parallel field | **`walletPhase=HELD`** not separate booking status |
| `PROVIDER_ACCEPTED` | Merge | = **`CONFIRMED`** |
| `CONFIRMED` | **Keep** | Merchant ACK — implement writer |
| `PROVIDER_REJECTED` | Metadata | `CANCELLED` + `cancelReason=PROVIDER_REJECTED` |
| `CANCEL_REQUESTED` | v2 ops | Optional user-initiated cancel before ACK |
| `CANCELLED` | **Keep** | Terminal |
| `EXPIRED` | Metadata | `CANCELLED` + `cancelReason=EXPIRED` (scheduler) |
| `REFUND_PENDING` | `walletPhase` | Async refund job — not user-facing status v1 |
| `REFUNDED` | `walletPhase` | Hold released or settlement reversed |
| `FAILED` | Metadata | No row or `CANCELLED` + `FAILED_DEBIT` if hold failed |

---

## Recommended state machine

### Booking status (`TourismBooking.status`)

| State | Meaning | Created by | Allowed next states | Wallet effect | Provider / merchant | User-visible wording allowed |
|-------|---------|------------|---------------------|---------------|---------------------|------------------------------|
| *(none)* | Quote / request preview | `POST /quote` only | User submits → create row | None | None | “Estimate”, “request preview”, “not booked” |
| `PENDING` | Submitted; **awaiting merchant review**; hold placed | `POST /api/tourism/book` (new hold path) | `CONFIRMED`, `CANCELLED` | **Hold** — `balanceVIG` ↓, `lockedBalanceVIG` ↑ (or linked hold) | Merchant must accept/reject | “Request sent”, “pending merchant review”, “VIO Credits on hold” |
| `CONFIRMED` | Merchant accepted dates/price/terms | Merchant `POST …/confirm` | `COMPLETED`, `CANCELLED` | **Settle** — release hold; credit provider net + treasury fees | ACK recorded (`confirmedAt`, `confirmedByUserId`) | “Merchant confirmed”, “confirmed request” (not “paid cash”) |
| `COMPLETED` | Fulfillment / stay completed | Merchant `POST …/complete` | Terminal | No further movement (or post-audit adjustments via ops) | Fulfillment sign-off | “Completed”, “trip fulfilled” |
| `CANCELLED` | Terminal — reject, timeout, user cancel, ops | Merchant reject, cron, user cancel API, ops | Terminal | **Release hold** or **refund** per policy + phase | No fulfillment | “Cancelled”, “request declined”, “hold released” |

**Forbidden transition (launch):** `PENDING` → `COMPLETED` without `CONFIRMED` (today’s shortcut). Ops override requires audit log + feature flag.

### Parallel: `walletPhase` (recommended new column or derive from ledger)

| Phase | Meaning |
|-------|---------|
| `NONE` | Preview / no hold |
| `HELD` | Tourist funds locked, provider not paid |
| `SETTLED` | Provider/treasury credited (on or after CONFIRMED) |
| `RELEASED` | Hold returned to tourist (cancel before settle) |
| `REFUNDED` | Settlement reversed or partial (ops policy) |

---

## Wallet / VIO Credits model

| Model | Pilot | Commercial Lite | Full production | Verdict |
|-------|-------|-----------------|-----------------|---------|
| **Immediate debit + provider pay** (today) | Staging only | **No** | **No** | **Retire** for B2C |
| **Hold on submit, settle on CONFIRMED** | **Yes** | **Yes** | **Yes** | **Default** |
| **Debit only on CONFIRMED** | Optional | Possible | Possible | Higher dispute risk; defer v2 |
| **No touch until accept** | `preview` flag only | Weak for commitment | — | Quote-only / demo |
| **Request preview only (no ledger)** | **Yes** (`preview` mode) | No | No | Demos, missing API config |

**Recommendation:**

- **Pilot:** `tourismSettlementMode=hold` + merchant manual ACK in admin/pilot inbox; timeout 48–72h → `CANCELLED`/`EXPIRED`.
- **Commercial Lite:** Same + consumer cancel before ACK + basic refund release.
- **Full production:** Hold + settle + partial refund policy + Stripe/card rail optional layer (out of scope for VIG-only v1).

**VIO Credits rules:**

- Holds are **in-app only**; copy: “on hold”, not “paid out” or “withdrawable”.
- **Single SoT:** Tourism must use **Prisma `Wallet`** for holds/debits; do not mix Firebase `walletOps` on tourism path (separate pack: wallet unification).

**Alignment with legacy `Booking`:** Reuse patterns from `BookingService.createBooking` (lock) and `cancelBooking` (release + penalty). Tourism may use **100% hold to locked** first; penalty rules can differ (tourism: 0% penalty on merchant reject before CONFIRMED).

---

## Provider / merchant ACK model

| Requirement | Design |
|-------------|--------|
| **ACK required** | Yes before `CONFIRMED` and before provider settlement |
| **Who ACKs** | `Business.ownerId` (or delegated staff role — future) |
| **Timeout** | Configurable `merchantReviewDeadlineAt`; job → `CANCELLED`/`EXPIRED`, release hold |
| **Rejection** | `POST …/reject` → `CANCELLED`, reason `PROVIDER_REJECTED`, full hold release |
| **Manual ops override** | Admin tool with `opsUserId`, reason code, immutable audit row |
| **Audit log** | `TourismBookingEvent` table or append-only `booking_events`: `created`, `hold_placed`, `confirmed`, `rejected`, `completed`, `cancelled`, `refund_issued` |

**B2B UI:** Replace mock `b2bBooking` confirm for tourism with **API-backed inbound queue** listing `TourismBooking` where `status=PENDING`.

---

## Cancellation / refund / reversal model

| Scenario | Booking status | Wallet action | API |
|----------|----------------|---------------|-----|
| User cancel before merchant ACK | → `CANCELLED` | Release 100% hold | `POST …/cancel` (tourist) |
| Merchant reject | → `CANCELLED` | Release 100% hold | `POST …/reject` (merchant) |
| Merchant timeout | → `CANCELLED` (EXPIRED) | Release 100% hold | Cron / worker |
| User cancel after CONFIRMED | → `CANCELLED` | Policy refund (ops) | v2 — partial settle clawback |
| Ops cancellation | → `CANCELLED` | Per playbook | Admin API |
| Failed hold (insufficient) | No row / failed create | None | 409 like today |
| Settle then dispute | `COMPLETED` + ops | Manual adjustment | Ops + ledger |

**Idempotency:** All wallet mutations keyed by `bookingId` + transition name (mirror `idempotencyKey` on `Transaction`).

---

## UI wording rules by state

| State / phase | Allowed copy | Forbidden copy |
|---------------|--------------|----------------|
| Quote only | “Preview”, “estimate”, “send request” | “Booked”, “confirmed”, “paid” |
| `PENDING` + `HELD` | “Request sent”, “pending merchant review”, “VIO Credits on hold (in-app)” | “Confirmed booking”, “payment captured”, “merchant accepted” |
| `CONFIRMED` | “Merchant confirmed your request”, “confirmed stay request” | “Guaranteed”, “refund guaranteed”, “paid to merchant” (unless settle phase shown) |
| `COMPLETED` | “Stay marked complete”, “fulfilled” | “Refundable” unless policy link |
| `CANCELLED` | “Cancelled”, “declined”, “hold released” | “Completed”, “confirmed” |
| Pilot flag `preview` | “Demo request — no VIO Credits charged” | Any live payment claim |

---

## Backend / API design recommendations

### Endpoints (new or changed)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/tourism/book` | Create `PENDING` + **hold** (replace settle-on-book) |
| `GET` | `/api/tourism/bookings/mine` | Tourist list |
| `GET` | `/api/tourism/bookings/inbound` | Merchant queue (`PENDING`) |
| `POST` | `/api/tourism/bookings/:id/confirm` | Merchant ACK → `CONFIRMED` + settle |
| `POST` | `/api/tourism/bookings/:id/reject` | → `CANCELLED` + release |
| `POST` | `/api/tourism/bookings/:id/cancel` | Tourist cancel (rules) |
| `POST` | `/api/tourism/bookings/:id/complete` | Keep — only from `CONFIRMED` |
| `GET` | `/api/wallet/balance` | Must reflect holds (locked visible) |

### Data fields (Prisma — future migration pack)

| Field | Purpose |
|-------|---------|
| `confirmedAt`, `confirmedByUserId` | ACK audit |
| `cancelledAt`, `cancelReason`, `cancelledByRole` | Terminal audit |
| `merchantReviewDeadlineAt` | Timeout |
| `walletPhase` | Ledger phase enum |
| `holdAmountVIG` | Snapshot at submit |
| `settledAt` | When provider paid |

### Ledger events

- One hold tx per book; settlement txs on confirm; release txs on cancel; no duplicate provider credit.

### Migration risk

| Risk | Mitigation |
|------|------------|
| Existing `PENDING` rows already settled | Backfill script: set `walletPhase=SETTLED` or flag `legacy_settle_on_book` |
| Enum change | Prefer metadata over new enum values in v1 |
| Dual wallet | Block tourism on Firebase-only accounts until unified |

---

## Implementation pack breakdown

| Pack | Target | Purpose | Type | Sign-off | Do-not-touch |
|------|--------|---------|------|----------|--------------|
| **1. `VIONA.TOURISM.WALLET_HOLD.1`** | `WalletService.processTourismBookingSettlement`, tourism book route | Hold-not-settle on book | **Behavior** | Payments + Ledger | Legacy `Booking` cancel math |
| **2. `VIONA.TOURISM.MERCHANT_ACK_API.1`** | `TourismController`, routes, Prisma fields | confirm/reject/inbound list | **Behavior + schema** | CPO + B2B owner | Mock `b2bBooking` until wired |
| **3. `VIONA.TOURISM.CANCEL_RELEASE.1`** | Cancel APIs, release hold | Tourist + merchant reject + timeout job | **Behavior** | Trust + Ops | Card/Stripe rails |
| **4. `VIONA.TOURISM.UI_STATUS_GATE.1`** | `TourismCheckoutScreen`, confirmed screen, i18n | Copy from `status` + `walletPhase` | **Copy + UI** | Trust & Safety | — |
| **5. `VIONA.WALLET.SOT_UNIFICATION.1`** | `state/wallet.ts`, Home balance | One consumer balance for tourism | **Behavior** | Platform | Classifieds VIP (coordinate) |
| **6. `VIONA.TOURISM.SETTLE_ON_CONFIRM.1`** | Confirm handler | Move provider/treasury credit here | **Behavior** | Payments | — |

**Order:** 1 → 2 → 3 → 6 (confirm settles) → 4 → 5 (parallel where possible).

---

## Relation to existing `PENDING` / `CONFIRMED` enum

- **Do not remove** enum values (no function removal law).
- **`PENDING`:** Redefine as “submitted + awaiting merchant review + hold active”.
- **`CONFIRMED`:** Implement as merchant ACK; **required** before consumer “confirmed” copy.
- **`COMPLETED`:** Fulfillment only; gate `complete` endpoint on prior `CONFIRMED`.
- **`CANCELLED`:** Implement writers for reject/cancel/expire; use `cancelReason` for REJECTED/EXPIRED nuance.

---

## Pilot / demo behavior

| Mode | `POST /book` | Wallet | Merchant UI | Consumer copy |
|------|--------------|--------|-------------|---------------|
| `preview` | Optional row, no hold | No mutation | Manual ops | “Demo — not charged” |
| `hold` (recommended pilot) | Row + hold | Prisma lock | Pilot inbox / admin | Pending review + hold |
| `legacy_settle_on_book` | Current behavior | Immediate settle | Staging only | Internal QA label only |

Feature flag: `EXPO_PUBLIC_TOURISM_SETTLEMENT_MODE` / server `TOURISM_SETTLEMENT_MODE`.

---

## References (code anchors)

- Settlement today: `src/services/WalletService.ts` — `processTourismBookingSettlement`, `completeTourismBookingAsMerchant`
- Routes: `src/routes/tourismRoutes.ts`
- Schema: `prisma/schema.prisma` — `TourismBooking`, `TourismBookingStatus`, `Wallet`
- Legacy hold pattern: `src/services/api/BookingService.ts` — `createBooking`, `cancelBooking`

---

*End of design — implementation packs must not merge without Payments/Ledger + Trust & Safety sign-off on hold/refund rules.*
