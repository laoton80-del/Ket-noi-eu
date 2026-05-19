# VIONA.TOURISM.EXISTING_ROWS_COMPATIBILITY.1

**Document ID:** `VIONA.TOURISM.EXISTING_ROWS_COMPATIBILITY.1`  
**Type:** Compatibility / migration design (docs only — no runtime or schema apply in this pack)  
**Branch:** `pack-af36-tourism-existing-rows-compatibility`  
**Base master:** `05e8bb6` — `docs(audit): merge tourism wallet hold implementation prep`  
**Inputs:** [State Machine Design](./VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md), [Wallet Hold Implementation Prep](../audit/VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md), [Backend SoT Audit](../audit/VIONA_TRAVEL_LOCAL_BACKEND_SOURCE_OF_TRUTH_AUDIT_1.md)  
**Date:** 2026-05-19  

**Scope:** Plan only. This pack does **not** run migrations, backfills, or change `processTourismBookingSettlement`.

---

## Summary

| Question | Recommendation |
|----------|----------------|
| **Recommended minimal migration** | Add nullable metadata on `TourismBooking`: **`providerSettledAt`**, **`settlementMode`**, **`confirmedAt`**, **`cancelledAt`**, **`cancelReason`**, plus **`createdAt`** (backfilled from `fxLockedAt` where available). **Defer** `walletPhase` enum column to v2; derive phase in application layer. |
| **`providerSettledAt` enough?** | **Yes, with `settlementMode`.** `providerSettledAt != null` means provider/treasury legs already ran; `null` + `settlementMode = HOLD_ON_SUBMIT` means hold-only. Without `settlementMode`, you cannot distinguish legacy settle-on-book from future settle-on-confirm once both set `providerSettledAt` on confirm. |
| **`walletPhase` needed now?** | **No** for migration v1. Derive: `HELD` = `PENDING` ∧ `providerSettledAt IS NULL`; `SETTLED` = `providerSettledAt IS NOT NULL`; `RELEASED`/`REFUNDED` = `CANCELLED` + settlement/cancel metadata. Add column only if reporting/SQL filters need it without app logic. |
| **Launch gate before `WALLET_HOLD.1`** | (1) Apply schema migration. (2) Run backfill + dry-run report sign-off. (3) Deploy code that **reads** new fields (no-op write). (4) Enable `TOURISM_SETTLEMENT_MODE=hold` in staging. (5) Ship confirm/settle + cancel/release before production consumer launch. |

---

## Current schema inventory

| Model | Relevant fields today | Behavior | Gap |
|-------|----------------------|----------|-----|
| **`TourismBooking`** | `status` (`PENDING` \| `CONFIRMED` \| `COMPLETED` \| `CANCELLED`); `totalPaidVIG`; `netProviderEarningsVIG`; `providerFeeVIG`; `touristFeeVIG`; `fxLockedAt`; `grossPlatformFeePoolVIG`; `kngNetPlatformRevenueVIG` (set on complete) | Row created at book with `PENDING`; settlement runs in same txn as create | No `createdAt`; no settlement timestamp; no hold vs settled flag; **`CONFIRMED` never written** |
| **`Wallet`** | `balanceVIG`, `lockedBalanceVIG` | Tourism debits **spendable only** today (not locked) | Tourism does not use lock path |
| **`Transaction`** | `walletId`, `senderId`, `receiverId`, `amountVIG`, `feeAmount`, `type`, `status`, `idempotencyKey`, `createdAt` | Tourist `BOOKING` + provider `BOOKING` + treasury `PLATFORM_FEE` on book | **No `tourismBookingId` FK** |
| **`TourismBookingStatus`** | 4 values | `COMPLETED` via merchant complete; `CANCELLED` unused in writers | Semantics overloaded vs wallet |
| **Legacy `Booking`** | `lockedAmountVIG`, `status`, `paymentStatus` | Hold + cancel pattern | Separate product path |

**Repo migration convention:** Timestamped folders under `prisma/migrations/` (e.g. `20250430120000_tourism_net_gross_platform_fields/migration.sql`); `prisma migrate deploy` / `db:generate` in CI. New pack should add one migration folder + optional `scripts/tourism-legacy-settlement-backfill.mjs` (read-only dry-run first).

---

## Legacy row detection

### Assumption

Any row created through **`processTourismBookingSettlement`** before hold mode had:

- Tourist `balanceVIG` reduced by `totalPaidVIG`
- Provider credited `netProviderEarningsVIG` (if > 0)
- Treasury credited `providerFeeVIG + touristFeeVIG` (if > 0)
- `status` typically **`PENDING`** (some **`COMPLETED`** via complete endpoint)
- **`fxLockedAt`** set at settlement time (good proxy for `providerSettledAt` when `createdAt` missing)

### Detection tiers

| Tier | Rule | Confidence | False-positive risk |
|------|------|------------|---------------------|
| **A — Strong** | `netProviderEarningsVIG > 0` OR `providerFeeVIG + touristFeeVIG > 0` AND booking exists pre-hold deploy | High for “settlement math ran” | Zero-amount test bookings |
| **B — Ledger corroboration** | Provider wallet `Transaction` where `type = 'BOOKING'`, `senderId = TourismBooking.userId`, `amountVIG` ≈ `netProviderEarningsVIG`, `createdAt` within **±5 min** of `fxLockedAt` | High when txs exist | Missing txs in partial failures; no FK link |
| **C — Status** | `status = 'COMPLETED'` AND `grossPlatformFeePoolVIG > 0` | High for completed path | N/A |
| **D — Weak** | `status = 'PENDING'` AND `totalPaidVIG > 0` only | Medium | **Cannot distinguish** future hold-only `PENDING` without `providerSettledAt` / `settlementMode` |

### Pseudocode (dry-run report)

```sql
-- Candidates for LEGACY_SETTLE_ON_BOOK (pre-backfill)
SELECT tb.id, tb.status, tb."totalPaidVIG", tb."netProviderEarningsVIG",
       tb."fxLockedAt", tb."grossPlatformFeePoolVIG"
FROM "TourismBooking" tb
WHERE tb."totalPaidVIG" > 0
  AND (tb."netProviderEarningsVIG" > 0 OR tb."providerFeeVIG" + tb."touristFeeVIG" > 0);

-- After migration, unbackfilled risky rows:
SELECT * FROM "TourismBooking"
WHERE "settlementMode" = 'UNKNOWN'
   OR ("providerSettledAt" IS NULL AND "totalPaidVIG" > 0 AND status = 'PENDING');
```

```typescript
// Optional Node corroboration (read-only)
// For each TourismBooking candidate, load Business.ownerId → provider Wallet →
// Transaction.findMany({ type: BOOKING, senderId: userId, createdAt around fxLockedAt })
// Match amountVIG to netProviderEarningsVIG within epsilon
```

### Manual review required when

- `totalPaidVIG > 0` but **no** provider/treasury txs (failed txn half-state — should not exist if Serializable txn intact)
- `status = 'CANCELLED'` with non-zero amounts (enum unused today — investigate)
- Provider changed owners after book (businessId mismatch)
- Staging fixtures with zero fees

---

## Recommended migration

### Fields to add (v1 minimal)

```prisma
enum TourismSettlementMode {
  UNKNOWN              // pre-backfill / legacy import
  LEGACY_SETTLE_ON_BOOK // tourist debited + provider paid at POST /book
  HOLD_ON_SUBMIT       // tourist hold only at POST /book
  SETTLE_ON_CONFIRM    // provider paid at merchant confirm
  PREVIEW_NO_LEDGER    // demo / quote-only path (no wallet mutation)
}

model TourismBooking {
  // ... existing fields ...

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  providerSettledAt  DateTime? // non-null ⇒ provider/treasury credit executed
  confirmedAt        DateTime? // merchant ACK (status → CONFIRMED)
  cancelledAt        DateTime?
  cancelReason       String?   // PROVIDER_REJECTED | USER_CANCEL | EXPIRED | OPS | ...

  settlementMode     TourismSettlementMode @default(UNKNOWN)
}
```

### Why each field

| Field | Purpose |
|-------|---------|
| `providerSettledAt` | **Primary compatibility latch** — prevents double settlement and wrongful full hold release |
| `settlementMode` | Distinguishes **legacy settle-on-book** vs **future settle-on-confirm** when both set `providerSettledAt` at different lifecycle points |
| `confirmedAt` | Merchant ACK audit; required before consumer “confirmed” copy |
| `cancelledAt` / `cancelReason` | Cancel/release without overloading `status` alone |
| `createdAt` | Future detection, timeouts, support; backfill from `fxLockedAt` |

### Defaults and nullability

| Field | Default | Notes |
|-------|---------|-------|
| `settlementMode` | `UNKNOWN` | Backfill sets `LEGACY_SETTLE_ON_BOOK` |
| `providerSettledAt` | `NULL` | Backfill sets for legacy settled rows |
| `createdAt` | `now()` on new rows only | Existing rows: `UPDATE … SET createdAt = COALESCE(fxLockedAt, startDate)` |

### Indexes

```prisma
@@index([status, providerSettledAt])
@@index([businessId, status])
@@index([settlementMode])
```

### Backward compatibility

- Existing readers ignore new columns (nullable / default).
- **`processTourismBookingSettlement` unchanged** until `WALLET_HOLD.1` — but **must** start writing `settlementMode = LEGACY_SETTLE_ON_BOOK` and `providerSettledAt = now()` in same PR as hold split **or** immediately after backfill to avoid new ambiguous rows.

### Rollback

- Migration additive only — rollback = deploy old code; new columns ignored.
- **Do not** drop columns once hold mode writes them.
- If hold deploy reverts, rows with `HOLD_ON_SUBMIT` need ops playbook (manual release).

### `walletPhase` — defer

| Derived phase | Rule (app layer) |
|---------------|------------------|
| `HELD` | `status = PENDING` ∧ `providerSettledAt IS NULL` ∧ `settlementMode = HOLD_ON_SUBMIT` |
| `SETTLED` | `providerSettledAt IS NOT NULL` |
| `RELEASED` | `status = CANCELLED` ∧ `providerSettledAt IS NULL` |
| `REFUNDED` | `status = CANCELLED` ∧ `providerSettledAt IS NOT NULL` ∧ refund ledger exists (v2) |

Add `walletPhase` column only when BI/ops require SQL-only dashboards without application derivation.

---

## Backfill strategy

### Safe sequence

1. **Freeze** production deploy of tourism wallet changes (docs-only packs OK).
2. **Dry-run report** (`scripts/tourism-legacy-settlement-backfill.mjs --dry-run`): counts by tier A/B/C; export CSV for Ledger review.
3. **Apply migration** (`SCHEMA_SETTLEMENT_METADATA.1`) — columns only, no behavior change.
4. **Backfill transaction** (single maintenance window):

```sql
BEGIN;

-- Timestamps for rows missing createdAt
UPDATE "TourismBooking"
SET "createdAt" = COALESCE("fxLockedAt", "startDate")
WHERE "createdAt" IS NULL;  -- only if column added without default on existing

-- Legacy settled-at-book
UPDATE "TourismBooking" tb
SET
  "providerSettledAt" = COALESCE(tb."fxLockedAt", tb."startDate"),
  "settlementMode" = 'LEGACY_SETTLE_ON_BOOK'
WHERE tb."totalPaidVIG" > 0
  AND (tb."netProviderEarningsVIG" > 0 OR (tb."providerFeeVIG" + tb."touristFeeVIG") > 0)
  AND tb."providerSettledAt" IS NULL;

-- COMPLETED rows: ensure settled timestamp even if fees zero edge case
UPDATE "TourismBooking" tb
SET
  "providerSettledAt" = COALESCE(tb."providerSettledAt", tb."fxLockedAt", tb."startDate"),
  "settlementMode" = CASE
    WHEN tb."settlementMode" = 'UNKNOWN' THEN 'LEGACY_SETTLE_ON_BOOK'
    ELSE tb."settlementMode"
  END
WHERE tb.status = 'COMPLETED'
  AND tb."providerSettledAt" IS NULL;

COMMIT;
```

5. **Verification queries:**

```sql
-- Should be zero before enabling hold:
SELECT COUNT(*) FROM "TourismBooking"
WHERE status = 'PENDING' AND "totalPaidVIG" > 0
  AND "providerSettledAt" IS NULL AND "settlementMode" = 'UNKNOWN';

-- Legacy inventory:
SELECT "settlementMode", status, COUNT(*) FROM "TourismBooking"
GROUP BY 1, 2;
```

6. **Ledger sign-off** — spot-check N rows: tourist debit + provider credit amounts match `totalPaidVIG` / `netProviderEarningsVIG`.
7. Enable **`TOURISM_SETTLEMENT_MODE=hold`** in staging only.
8. Deploy **`WALLET_HOLD.1`** with writes: new rows `HOLD_ON_SUBMIT`, `providerSettledAt = NULL`.

### Avoid double settlement

Application guards (implement in `settleTourismBookingToProvider`):

```typescript
if (booking.providerSettledAt != null) {
  return idempotent success; // already settled
}
if (booking.settlementMode === 'LEGACY_SETTLE_ON_BOOK') {
  throw new Error('legacy row — do not settle again');
}
```

### Avoid double refund

Cancel/release for `LEGACY_SETTLE_ON_BOOK` + `providerSettledAt != null`:

- **Do not** move `lockedBalanceVIG` (tourist was debited spendable, not locked).
- Refund policy = **ops/manual** or v2 clawback — **not** automatic full release to tourist without Ledger approval.

Cancel for new `HOLD_ON_SUBMIT`:

- Release `lockedBalanceVIG` → `balanceVIG` by `totalPaidVIG` only when `providerSettledAt IS NULL`.

---

## Feature flag / rollout strategy

| Mode | Env | Wallet on `POST /book` | `settlementMode` | Consumer launch |
|------|-----|------------------------|------------------|-----------------|
| **`legacy_settle_on_book`** | Staging QA only (current) | Debit + pay provider | `LEGACY_SETTLE_ON_BOOK` | **Blocked** for commercial |
| **`hold_on_submit`** | Staging → pilot | Lock only | `HOLD_ON_SUBMIT` | Pilot merchants after backfill |
| **`preview_no_ledger`** | Demo | No mutation | `PREVIEW_NO_LEDGER` | Demo builds |
| **`settle_on_confirm`** | After CONFIRM API | N/A at book | `SETTLE_ON_CONFIRM` at confirm | Commercial Lite |

**Kill switch:** `TOURISM_SETTLEMENT_MODE=legacy_settle_on_book` reverts to current function — only safe if new hold rows not yet created, or ops converts holds first.

**Order:** migration → backfill → read new fields → hold flag → confirm API → cancel API → UI gates.

---

## Required implementation packs

### 1. `VIONA.TOURISM.SCHEMA_SETTLEMENT_METADATA.1`

| Item | Detail |
|------|--------|
| **Target** | `prisma/schema.prisma`, `prisma/migrations/YYYYMMDD_tourism_settlement_metadata/migration.sql` |
| **Type** | Schema only |
| **Validation** | `prisma validate`, `prisma migrate diff`, staging migrate |
| **Sign-off** | Ledger + Principal Architect |
| **Do-not-touch** | `WalletService` settlement logic |

### 2. `VIONA.TOURISM.LEGACY_SETTLED_BACKFILL.1`

| Item | Detail |
|------|--------|
| **Target** | `scripts/tourism-legacy-settlement-backfill.mjs` (dry-run + apply), ops runbook in `docs/ops/` |
| **Type** | Data migration (one-off) |
| **Validation** | Dry-run counts; post SQL verification; sample ledger reconcile |
| **Sign-off** | Payments + Ops |
| **Do-not-touch** | Automatic refund scripts |

### 3. `VIONA.TOURISM.WALLET_HOLD.1`

| Item | Detail |
|------|--------|
| **Target** | `WalletService.ts`, `TourismHubService.ts`, feature flag |
| **Type** | Behavior — **after** 1 + 2 |
| **Validation** | Integration test: book → hold only; provider balance unchanged |
| **Sign-off** | Payments |
| **Do-not-touch** | Legacy `BookingService` |

### 4. `VIONA.TOURISM.CONFIRM_SETTLE_API.1`

| Item | Detail |
|------|--------|
| **Target** | `TourismController`, `tourismRoutes`, `settleTourismBookingToProvider`, status → `CONFIRMED` |
| **Type** | Behavior + API |
| **Guards** | `providerSettledAt` idempotency |
| **Sign-off** | CPO + B2B |

### 5. `VIONA.TOURISM.CANCEL_RELEASE_API.1`

| Item | Detail |
|------|--------|
| **Target** | Cancel/reject routes, release hold logic |
| **Type** | Behavior + API |
| **Guards** | Branch on `settlementMode` / `providerSettledAt` |
| **Sign-off** | Trust + Ops |

### 6. (Optional v2) `VIONA.TOURISM.LEDGER_BOOKING_FK.1`

| Item | Detail |
|------|--------|
| **Target** | `Transaction.tourismBookingId`, `TxType` extensions |
| **Type** | Schema + ledger |
| **When** | After hold stable |

---

## Answers to design requirements (checklist)

| # | Answer |
|---|--------|
| 1 | Schema inspected — see inventory |
| 2 | Migrations: timestamped SQL under `prisma/migrations/` |
| 3 | `Transaction` model — no `WalletTransaction` table |
| 4 | Minimal: `providerSettledAt` + `settlementMode` + cancel/confirm timestamps |
| 5 | **`providerSettledAt` sufficient with `settlementMode`** |
| 6 | **`walletPhase` defer** — derive in app |
| 7 | **`settlementMode` required** — yes, now |
| 8 | Detection: fee fields + `fxLockedAt` + optional tx corroboration |
| 9 | Backfill: SQL above + dry-run |
| 10 | Rollout: migration → backfill → hold flag → confirm → cancel |

---

## Top risks

1. **Backfill marks wrong rows** → wrongful confirm skip or hold release. Mitigate: dry-run + Ledger sample + `UNKNOWN` quarantine.
2. **New rows between migration and backfill** still use old settlement without metadata writes. Mitigate: deploy metadata writers in same release window as migration, before hold flag.
3. **Legacy `PENDING` refunded as hold** → tourist double-benefit. Mitigate: cancel API branches on `settlementMode`.
4. **No `Transaction.bookingId`** → weak forensic audit until v2.
5. **`TourismBooking` lacks `createdAt` today** — add in migration + backfill from `fxLockedAt`.

---

## Relation to `CONFIRMED` enum

- Backfill **does not** set `status = CONFIRMED` for legacy rows (they were never merchant-ACK’d).
- Legacy settled `PENDING` stays `PENDING` until merchant confirm API or ops migration explicitly transitions.
- Optional ops policy: bulk `CONFIRMED` for historical rows **only** with merchant written consent — **not** automatic in backfill.

---

*End of compatibility design — no runtime, migration apply, or wallet behavior change in this pack.*
