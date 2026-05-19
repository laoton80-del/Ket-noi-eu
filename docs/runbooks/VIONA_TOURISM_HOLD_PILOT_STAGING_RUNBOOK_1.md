# VIONA.TOURISM.HOLD_PILOT_STAGING_RUNBOOK.1

**Document ID:** `VIONA.TOURISM.HOLD_PILOT_STAGING_RUNBOOK_1`  
**Type:** Operational QA / staging pilot — docs-only gate before production hold enablement  
**Base master (authoring):** `fc8f157` — merge held booking cancel release  

**Related:**

- [VIONA_OPERATING_PROTOCOL.md](../ai-context/VIONA_OPERATING_PROTOCOL.md)
- [VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md](../architecture/VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md)
- [VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md](../architecture/VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md)
- [VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md](../audit/VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md)
- [VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md](./VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md)

**Runtime config:** `src/config/tourismSettlementMode.ts`  
**Wallet / APIs:** `src/services/WalletService.ts`, `src/controllers/TourismController.ts`, `src/routes/tourismRoutes.ts`

---

## Purpose

Validate the full Tourism **hold-on-submit** lifecycle on **staging** end-to-end before enabling `TOURISM_SETTLEMENT_MODE=hold` in any **production** environment.

This pilot must prove:

| Path | Outcome |
|------|---------|
| Hold on submit | VIO Credits move spendable → locked; `BOOKING_LOCK` ledger; no provider/treasury payout |
| Confirm → settle | One-time provider + treasury credit; `SETTLE_ON_CONFIRM`; idempotent retry |
| Cancel → release | Full lock release to tourist; `ESCROW_REFUND`; no provider/treasury movement; idempotent retry |
| Safety | Legacy / preview / confirmed rows rejected; no stranded `lockedBalanceVIG` |
| Ledger | Zero-loss reconciliation; no double-settle; no double-release |

**Core law (non-negotiable):**

- Money/ledger behavior must be **zero-loss**.
- Do **not** fake confirmed booking, payment, or provider fulfillment.
- Do **not** enable hold in production until this runbook passes on staging with sign-offs.
- Do **not** manually mutate wallet balances without finance sign-off.

---

## Preconditions

Master must include the tourism hold stack (release wave **#60.6–#60.10**):

| Wave | Deliverable | Master evidence (typical) |
|------|-------------|---------------------------|
| **#60.6** | Schema settlement metadata (`TourismSettlementMode`, `providerSettledAt`, `confirmedAt`, `cancelledAt`, `cancelReason`, …) | Migration `20260519120000_tourism_settlement_metadata` |
| **#60.7** | Legacy settled backfill script + runbook | `scripts/backfills/backfill-tourism-settlement-metadata.ts`, [LEGACY_SETTLED_BACKFILL_RUNBOOK_1](./VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md) |
| **#60.8** | Wallet hold checkout + explicit default guard (`legacy_settle_on_book` when unset) | `processTourismBookingHold`, `getTourismSettlementMode()` |
| **#60.9** | Confirm / settle API | `POST /api/tourism/bookings/:bookingId/confirm`, `confirmTourismHeldBookingAsMerchant` |
| **#60.10** | Cancel / release API | `POST /api/tourism/bookings/:bookingId/cancel`, `cancelTourismHeldBooking` |

**Staging database:**

1. Migration deployed:

```bash
npx prisma migrate deploy
```

2. Legacy backfill **dry-run** reviewed (see [LEGACY_SETTLED_BACKFILL_RUNBOOK_1](./VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md)):

```bash
npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts
```

3. Legacy backfill **applied** on staging with **engineering + finance** sign-off:

```bash
npx tsx scripts/backfills/backfill-tourism-settlement-metadata.ts --apply
```

4. Post-backfill SQL — expect **zero** risky unknown paid pendings:

```sql
SELECT COUNT(*) FROM "TourismBooking"
WHERE status = 'PENDING' AND "totalPaidVIG" > 0
  AND "providerSettledAt" IS NULL AND "settlementMode" = 'UNKNOWN';
```

**Environment policy:**

- **Production:** `TOURISM_SETTLEMENT_MODE` **unset** or `legacy_settle_on_book` only — until staging pilot pass + explicit founder/product/payments approval.
- **Staging only** may set `TOURISM_SETTLEMENT_MODE=hold` for this pilot.

**Server env (staging):**

- `DATABASE_URL` — staging DB
- `VIGLOBAL_TREASURY_USER_ID` — treasury user for confirm settle (not used on cancel)
- JWT / auth as per staging app

---

## Environment gates

| Environment | Allowed `TOURISM_SETTLEMENT_MODE` | Required sign-off | Notes |
|-------------|-----------------------------------|-------------------|-------|
| **Local / dev** | `hold`, `legacy_settle_on_book`, `preview_only` | Developer discretion | Use disposable wallets; run eligibility scripts; optional full API loop |
| **Staging** | `hold` **only after** migration + backfill sign-off | Engineering + Finance (backfill); then pilot executor | **This runbook** — record evidence |
| **Production** | `legacy_settle_on_book` (default) until pilot pass | Founder delegate + Payments & Ledger + Product/Safety + Release Train | Hold enablement is a **separate** change request after all scenarios pass |

Aliases accepted by config: `hold_on_submit` for hold; `legacy` for legacy.

---

## Test data setup

Prepare and record **before-state** snapshots (spreadsheet or ticket attachment).

### Accounts

| Role | Requirement |
|------|-------------|
| **Tourist** | Auth user with wallet; `balanceVIG` ≥ planned `totalPaidVIG` for 3 bookings + buffer |
| **Merchant / business owner** | Owns tourism `Business`; can call confirm/cancel as owner |
| **Tourism product** | Active `TourismService` on that business (discover + quote + book path) |
| **Treasury** | User id = `VIGLOBAL_TREASURY_USER_ID` with wallet row (confirm scenarios only) |

### Before-state wallet balances (record per scenario start)

| Wallet | Fields to record |
|--------|------------------|
| Tourist | `balanceVIG`, `lockedBalanceVIG` |
| Provider (merchant owner) | `balanceVIG` |
| Treasury | `balanceVIG` |

### Booking identifiers

Use three distinct held bookings for Scenarios 1–4:

| Label | Used in |
|-------|---------|
| `booking-hold-confirm` | Scenario 1 → 2 (hold then confirm) |
| `booking-hold-merchant-cancel` | Scenario 3 (merchant cancel) |
| `booking-hold-tourist-cancel` | Scenario 4 (tourist cancel) |

### API surface (existing — do not add routes in this pack)

| Action | Method + path | Auth |
|--------|---------------|------|
| Quote | `POST /api/tourism/quote` | `authMiddleware` |
| Book (hold when mode=hold) | `POST /api/tourism/book` | `authMiddleware` |
| Confirm | `POST /api/tourism/bookings/:bookingId/confirm` | `authMiddleware` (owner in service) |
| Cancel / release | `POST /api/tourism/bookings/:bookingId/cancel` | `authMiddleware` (owner or tourist) |
| Complete | `POST /api/tourism/bookings/:bookingId/complete` | `authMiddleware` (owner; blocked until confirm on hold rows) |

Optional cancel body: `{ "cancelReason": "CUSTOM_REASON" }` (max 200 chars). Defaults: `PROVIDER_REJECTED` (merchant), `USER_CANCEL` (tourist).

### SQL helpers (staging)

```sql
-- Booking row
SELECT id, status, "settlementMode", "totalPaidVIG", "netProviderEarningsVIG",
       "providerFeeVIG", "touristFeeVIG", "providerSettledAt", "confirmedAt",
       "cancelledAt", "cancelReason"
FROM "TourismBooking" WHERE id = '<bookingId>';

-- Tourist wallet
SELECT "balanceVIG", "lockedBalanceVIG" FROM "Wallet" WHERE "userId" = '<touristUserId>';

-- Provider / treasury wallets
SELECT "balanceVIG" FROM "Wallet" WHERE "userId" IN ('<providerUserId>', '<treasuryUserId>');

-- Ledger for booking amount (adjust amount tolerance if needed)
SELECT id, type, "amountVIG", "senderId", "receiverId", status, "createdAt"
FROM "Transaction"
WHERE "walletId" = (SELECT id FROM "Wallet" WHERE "userId" = '<touristUserId>')
ORDER BY "createdAt" DESC
LIMIT 20;
```

---

## Scenario 1 — Hold on booking submit

### Setup

1. On **staging only**, set:

```bash
TOURISM_SETTLEMENT_MODE=hold
```

2. Redeploy or restart API workers so env is loaded.

### Steps

1. Record tourist / provider / treasury **before** balances.
2. `POST /api/tourism/quote` — capture `totalPaidVIG` and fee split.
3. `POST /api/tourism/book` as tourist (same payload shape as production B2C book).
4. Save `bookingId` as `booking-hold-confirm`.

### Verify (booking row)

| Field | Expected |
|-------|----------|
| `status` | `PENDING` |
| `settlementMode` | `HOLD_ON_SUBMIT` |
| `providerSettledAt` | `null` |
| `confirmedAt` | `null` |
| `cancelledAt` | `null` |

### Verify (wallets)

| Check | Expected |
|-------|----------|
| Tourist `balanceVIG` | Decreased by `totalPaidVIG` (± `VIG_EPSILON`) |
| Tourist `lockedBalanceVIG` | Increased by `totalPaidVIG` |
| Provider `balanceVIG` | **Unchanged** |
| Treasury `balanceVIG` | **Unchanged** |

### Verify (ledger)

| TxType | Party pattern | Expected |
|--------|---------------|----------|
| `BOOKING_LOCK` | `senderId` = tourist, `receiverId` = `ViGlobalTourismBookingLock` | One SUCCESS tx, `amountVIG` ≈ `totalPaidVIG` |
| `BOOKING` / `PLATFORM_FEE` | — | **None** on book |

**Pass criteria:** All checks true. Attach booking id + wallet deltas to pilot ticket.

---

## Scenario 2 — Merchant confirm settles once

Uses `booking-hold-confirm` from Scenario 1.

### Steps

1. Record **before** balances (tourist locked, provider, treasury).
2. `POST /api/tourism/bookings/:bookingId/confirm` as **business owner** (merchant JWT).
3. Record **after** balances and ledger.
4. **Repeat** the same confirm call (idempotency).

### Verify (first confirm)

| Check | Expected |
|-------|----------|
| `status` | `CONFIRMED` |
| `settlementMode` | `SETTLE_ON_CONFIRM` |
| `confirmedAt` | Set (non-null) |
| `providerSettledAt` | Set (non-null) |
| Tourist `lockedBalanceVIG` | Decreased by `totalPaidVIG` vs post-hold state |
| Tourist `balanceVIG` | Unchanged vs post-hold (funds left locked bucket to settlement txs, not back to spendable) |
| Provider `balanceVIG` | Increased by `netProviderEarningsVIG` |
| Treasury `balanceVIG` | Increased by `providerFeeVIG + touristFeeVIG` |
| Ledger | `BOOKING` tx(s) + `PLATFORM_FEE` to treasury; no second `BOOKING_LOCK` |

### Verify (second confirm — idempotency)

| Check | Expected |
|-------|----------|
| HTTP / body | Success with `idempotent: true` (or equivalent stable payload) |
| Provider `balanceVIG` | **No additional** credit vs first confirm |
| Treasury `balanceVIG` | **No additional** credit |
| Tourist `lockedBalanceVIG` | **Not negative**; no further decrement |
| Duplicate `BOOKING` / `PLATFORM_FEE` | **None** |

**Pass criteria:** Single settlement; retry is safe.

---

## Scenario 3 — Merchant reject / cancel releases once

### Steps

1. Create **second** held booking (`booking-hold-merchant-cancel`) via Scenario 1 book path (hold mode still on).
2. Record before balances.
3. `POST /api/tourism/bookings/:bookingId/cancel` as **business owner**.
4. Optional: body `{ "cancelReason": "PROVIDER_REJECTED" }` or custom reason.
5. Record after balances and ledger.
6. **Repeat** cancel call.

### Verify (first cancel)

| Check | Expected |
|-------|----------|
| `status` | `CANCELLED` |
| `cancelReason` | `PROVIDER_REJECTED` or supplied reason |
| `cancelledAt` | Set |
| `providerSettledAt` | **null** |
| Tourist `lockedBalanceVIG` | Decreased by `totalPaidVIG` |
| Tourist `balanceVIG` | Restored by `totalPaidVIG` |
| Provider / treasury | **Unchanged** |
| Ledger | `ESCROW_REFUND`: `ViGlobalTourismBookingLock` → tourist, `amountVIG` ≈ `totalPaidVIG` |

### Verify (second cancel — idempotency)

| Check | Expected |
|-------|----------|
| Response | Idempotent success |
| Tourist balances | **No second** release |
| Provider / treasury | **No movement** |

**Pass criteria:** Full release once; no stranded lock.

---

## Scenario 4 — Tourist self-cancel releases once

### Steps

1. Create **third** held booking (`booking-hold-tourist-cancel`).
2. `POST /api/tourism/bookings/:bookingId/cancel` as **booking tourist** (not owner).
3. Verify same release mechanics as Scenario 3.
4. Default `cancelReason` = `USER_CANCEL` when body omits reason.

**Pass criteria:** Tourist-authorized cancel matches merchant cancel ledger behavior; idempotent on retry.

---

## Scenario 5 — Rejection safety

Use existing or seed rows; **do not** corrupt production data. Prefer staging-only fixtures.

| Case | Action | Expected |
|------|--------|----------|
| Legacy settle-on-book row | `POST …/confirm` | **409** `invalid_settlement_mode` (or equivalent) — no wallet mutation |
| Legacy settle-on-book row | `POST …/cancel` | **409** — no release of non-held funds |
| `PREVIEW_ONLY` row | `POST …/confirm` | **409** — no settlement |
| `PREVIEW_ONLY` row | `POST …/cancel` | **409** — no release (no hold) |
| Confirmed / `SETTLE_ON_CONFIRM` + `providerSettledAt` set | `POST …/cancel` | **409** `invalid_status` — no post-confirm refund in this API |
| `HOLD_ON_SUBMIT` + `PENDING` + `providerSettledAt` null | `POST …/complete` | **409** — “must be confirmed before completion” |
| Missing `BOOKING_LOCK` (tampered / broken fixture) | `POST …/cancel` | **409** `not_held` |
| Insufficient `lockedBalanceVIG` (tampered wallet) | `POST …/cancel` | **409** `insufficient_locked_funds` |

**Pass criteria:** All rejections leave balances unchanged; no provider/treasury side effects.

---

## Ledger reconciliation checklist

After Scenarios 1–4, complete one consolidated reconciliation (finance + engineering).

| # | Check | Pass? |
|---|-------|-------|
| 1 | Tourist spendable + locked deltas net to zero across cancel paths (funds returned to spendable) | ☐ |
| 2 | Tourist locked delta on confirm path matches `totalPaidVIG` released from lock | ☐ |
| 3 | Provider balance delta **only** on confirmed booking(s), equals `netProviderEarningsVIG` | ☐ |
| 4 | Treasury balance delta **only** on confirmed booking(s), equals `providerFeeVIG + touristFeeVIG` | ☐ |
| 5 | **No** provider/treasury delta on cancelled bookings | ☐ |
| 6 | **No** stranded `lockedBalanceVIG` on cancelled `TourismBooking` ids | ☐ |
| 7 | Confirm retry did not duplicate `BOOKING` / `PLATFORM_FEE` | ☐ |
| 8 | Cancel retry did not duplicate `ESCROW_REFUND` | ☐ |
| 9 | Sum of transaction `amountVIG` by type matches wallet deltas (± epsilon) | ☐ |

Optional aggregate SQL (staging):

```sql
SELECT tb.id, tb.status, tb."settlementMode", w."lockedBalanceVIG", w."balanceVIG"
FROM "TourismBooking" tb
JOIN "Wallet" w ON w."userId" = tb."userId"
WHERE tb.id IN ('<booking-hold-confirm>', '<booking-hold-merchant-cancel>', '<booking-hold-tourist-cancel>');
```

---

## Rollback / kill switch

If pilot fails or an incident occurs:

1. **Stop new holds** — set staging (or affected env):

```bash
TOURISM_SETTLEMENT_MODE=legacy_settle_on_book
```

2. Redeploy / restart API so config reloads.

3. **Inventory open held rows** before leaving hold off:

```sql
SELECT id, "userId", "totalPaidVIG", status, "settlementMode", "createdAt"
FROM "TourismBooking"
WHERE "settlementMode" = 'HOLD_ON_SUBMIT'
  AND status = 'PENDING'
  AND "providerSettledAt" IS NULL;
```

4. For each open row: either merchant **confirm**, **cancel** via API, or ops playbook — **never** hand-edit `balanceVIG` / `lockedBalanceVIG` without finance sign-off.

5. **Escalation**

| Step | Owner |
|------|-------|
| Stop hold flag | Engineering / Ops |
| Wallet truth audit | Payments & Ledger |
| Customer comms if user-visible | Product / Support |
| Incident record | Operations / Incident Commander |

---

## Production readiness gate

**Hold in production is blocked** until **all** are true:

| Gate | Owner |
|------|-------|
| Staging Scenario 1 pass | Engineering (executor) |
| Staging Scenario 2 pass | Engineering + Payments |
| Staging Scenario 3 pass | Engineering + Payments |
| Staging Scenario 4 pass | Engineering + Payments |
| Scenario 5 safety rejections pass | Engineering |
| Ledger reconciliation checklist pass | Finance / Ledger |
| Engineering sign-off | Engineering lead |
| Finance / ledger sign-off | Payments & Ledger Owner |
| Product / safety sign-off | CPO / Trust & Safety |
| Support / ops aware of hold copy + escalation | Operations |

Evidence: link staging ticket with booking IDs, wallet before/after, API responses, SQL screenshots.

**After approval:** production hold enablement is a **separate** deploy/change request (env var only on prod — no code change required if already on master).

---

## Known gaps after pilot

These are **out of scope** for hold pilot pass; track as follow-up packs:

| Gap | Pack / note |
|-----|-------------|
| Merchant inbox UX (confirm / reject list) | `VIONA.TOURISM.MERCHANT_INBOX.1` |
| Ops / admin cancel | `VIONA.TOURISM.OPS_CANCEL_TIMEOUT_DESIGN.1` |
| Review timeout worker (`EXPIRED` + auto-release) | Ops cancel / timeout design |
| Post-confirm refund / chargeback | Future payments pack |
| Customer-facing status copy / UI gates | UI / i18n pack when ready |
| `tourismBookingId` on `Transaction` FK | v2 ledger hardening (optional) |

---

## Local pre-flight (optional, no staging hold)

Eligibility unit scripts (no DB):

```bash
npx tsx scripts/test-tourism-confirm-settle-eligibility.ts
npx tsx scripts/test-tourism-cancel-release-eligibility.ts
```

---

## Sign-off record (template)

| Role | Name | Date | Ticket / link |
|------|------|------|---------------|
| Pilot executor (Engineering) | | | |
| Finance / Ledger | | | |
| Product / Safety | | | |
| Operations | | | |

---

*End of runbook.*
