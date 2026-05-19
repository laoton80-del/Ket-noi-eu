# VIONA.TOURISM.OPS_CANCEL_TIMEOUT_DESIGN.1

**Document ID:** `VIONA_TOURISM_OPS_CANCEL_TIMEOUT_DESIGN_1`  
**Type:** Architecture / policy / implementation design — **no runtime changes in this pack**  
**Base master (authoring):** `ecab1f9` — merge merchant booking inbox  
**Status:** Design only — ops API, timeout worker, and schema extensions are follow-up packs  

**Related:**

- [VIONA_OPERATING_PROTOCOL.md](../ai-context/VIONA_OPERATING_PROTOCOL.md)
- [VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md](../runbooks/VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md)
- [VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md](../runbooks/VIONA_TOURISM_LEGACY_SETTLED_BACKFILL_RUNBOOK_1.md)
- [VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md](./VIONA_TOURISM_BOOKING_STATE_MACHINE_DESIGN_1.md)
- [VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md](./VIONA_TOURISM_EXISTING_ROWS_COMPATIBILITY_1.md)
- [VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md](../audit/VIONA_TOURISM_WALLET_HOLD_IMPLEMENTATION_PREP_1.md)

**Code references (current behavior):**

- Hold / confirm / cancel: `src/services/WalletService.ts`
- Eligibility: `tourismHeldBookingConfirmEligibility.ts`, `tourismHeldBookingCancelEligibility.ts`
- Merchant inbox: `tourismMerchantInboxService.ts`, `tourismMerchantInboxView.ts`
- Routes: `src/routes/tourismRoutes.ts` (`POST …/confirm`, `POST …/cancel`; no ops route)
- Admin gate pattern: `src/middleware/superAdminMiddleware.ts` (`Role.ADMIN`)

---

## Summary

| Area | Recommendation |
|------|----------------|
| **Timeout policy** | Default **48 hours** after `COALESCE(createdAt, fxLockedAt)` for held `PENDING` rows; product override via env/config per vertical (v2: `merchantReviewDeadlineAt` column). |
| **Ops / admin cancel** | New `POST /api/tourism/bookings/:bookingId/ops-cancel` with `authMiddleware` + `superAdminMiddleware`, mandatory `cancelReason`, append-only audit event (v2 table or structured log). |
| **Timeout execution** | **Reuse** `cancelTourismHeldBooking` via thin internal wrapper after extending actor authorization — same ledger path (`ESCROW_REFUND`), same idempotency. |
| **Worker / dry-run** | Script `scripts/jobs/release-tourism-held-timeouts.ts` — dry-run default, `--apply` + `--max-batch`, reconciliation summary; cron every **15 minutes** in staging/production after pilot. |
| **Production hold gate** | Production `TOURISM_SETTLEMENT_MODE=hold` remains blocked until staging pilot pass **and** (manual ops cancel API **or** approved timeout dry-run on staging) **and** finance/product/safety sign-off. |

**Core law (unchanged):**

- Zero-loss ledger discipline; no stranded `lockedBalanceVIG` on eligible held rows.
- No fake merchant confirmation or provider settlement.
- No timeout release on legacy settled, preview-only (wallet), or post-confirm rows.
- No post-confirm refund in v1 ops/timeout packs.

---

## Current state

| Capability | Status on master (`ecab1f9`) |
|------------|------------------------------|
| Hold on submit | `processTourismBookingHold` when `TOURISM_SETTLEMENT_MODE=hold` (opt-in) |
| Merchant inbox | `GET /api/tourism/bookings/merchant` |
| Confirm → settle | `POST /api/tourism/bookings/:bookingId/confirm` |
| Cancel → release | `POST /api/tourism/bookings/:bookingId/cancel` (merchant owner or tourist only) |
| Complete | `POST /api/tourism/bookings/:bookingId/complete` (blocked until confirm on hold rows) |
| **Gap** | No ops/admin cancel; no timeout worker; no `merchantReviewDeadlineAt`; `cancelTourismHeldBooking` rejects non-owner actors |

---

## Design decisions (Q1–Q10)

### Q1 — Timeout window

| Tier | Value | Notes |
|------|-------|-------|
| **Default (v1)** | **48h** | Balances merchant SLA vs tourist lock duration; aligns with “next business day” review in many hospitality flows. |
| **Staging pilot** | **24h** optional via `TOURISM_HOLD_REVIEW_TIMEOUT_HOURS=24` | Faster feedback during [HOLD_PILOT_STAGING_RUNBOOK](../runbooks/VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md). |
| **Future override** | Per `BizType` or service category | Requires config table or `merchantReviewDeadlineAt` on row at book time. |

**Clock anchor:** `reviewDeadlineAt = COALESCE(createdAt, fxLockedAt) + timeoutHours` (UTC). Do not use `startDate` (stay may be weeks ahead).

### Q2 — Rows eligible for timeout release

All must be true:

| Condition | Required |
|-----------|----------|
| `settlementMode = HOLD_ON_SUBMIT` | Yes |
| `status = PENDING` | Yes |
| `providerSettledAt IS NULL` | Yes |
| `confirmedAt IS NULL` | Yes |
| `reviewDeadlineAt < now()` | Yes |
| `BOOKING_LOCK` tx exists for `totalPaidVIG` (± epsilon) | Yes (same as cancel API) |
| Tourist wallet `lockedBalanceVIG >= totalPaidVIG` | Yes (same as cancel API) |

### Q3 — Rows that must never be timeout-released

See [Timeout eligibility matrix](#timeout-eligibility-matrix).

### Q4 — Reuse `cancelTourismHeldBooking`?

**Yes — strongly recommended.**

| Approach | Verdict |
|----------|---------|
| **Extend `cancelTourismHeldBooking`** with `actorKind: 'merchant' \| 'tourist' \| 'system_timeout' \| 'ops_admin'` and optional `cancelReason` override | **Preferred** — one release implementation, one idempotency story |
| Duplicate release logic in worker | **Reject** — double-release risk |
| Raw SQL wallet updates | **Forbidden** without finance sign-off |

**Implementation sketch (future pack):**

- Add `CancelTourismHeldBookingActor` enum to input.
- For `system_timeout` / `ops_admin`: skip merchant/tourist ownership check; still run `evaluateTourismHeldBookingCancelEligibility` (or parallel `release` path).
- Set `cancelReason` from caller (`TIMEOUT_AUTO_RELEASE`, `OPS_CANCEL`) — do not use `PROVIDER_REJECTED` for automated timeout.

### Q5 — `cancelReason` codes

See [Cancel reasons](#cancel-reasons).

### Q6 — Admin/ops route (later)

`POST /api/tourism/bookings/:bookingId/ops-cancel`

| Aspect | Spec |
|--------|------|
| Auth | `authMiddleware` → `superAdminMiddleware` (`Role.ADMIN`) |
| Body | `{ "cancelReason": "OPS_CANCEL", "note": "optional ops ticket id" }` — `cancelReason` required, allowlisted |
| Behavior | Call extended `cancelTourismHeldBooking` with `actorKind: 'ops_admin'` |
| Response | Same envelope as tourist/merchant cancel |
| Audit | Log `opsUserId`, `bookingId`, reason, timestamp (structured log v1; `TourismBookingEvent` v2) |
| Forbidden | Post-confirm refund; mutating `providerSettledAt` rows |

### Q7 — Worker / cron cadence

| Environment | Cadence | Notes |
|-------------|---------|-------|
| **Staging (pilot)** | Every **15 min** | Catches 24h timeout tests within same day |
| **Production** | Every **15 min** | Low volume inbound tourism initially; avoid hourly “stuck until top of hour” |
| **Kill switch** | `TOURISM_TIMEOUT_RELEASE_ENABLED=false` | Default **off** until staging dry-run signed off |

**Safety:** Process at most **N=50** rows per run (`--max-batch 50`); oldest `createdAt` first.

### Q8 — Reporting / dry-run before auto-release

Required before `--apply` in any environment:

1. **Dry-run output:** count eligible, sample booking IDs, sum `totalPaidVIG` to release, count missing `BOOKING_LOCK`, count insufficient lock.
2. **Reconciliation block:** per run — `releasedCount`, `skippedCount`, `errorCount`, `totalVIGReleased`.
3. **Alert threshold:** if `eligibleCount > 20` in one run or `errorCount > 0`, page `#payments-ledger` (or ticket).
4. **Manual sign-off:** Finance + Engineering on first staging `--apply` log attachment.

### Q9 — Notifications (future work)

| Event | Audience | Channel (future) |
|-------|----------|------------------|
| Booking submitted (hold) | Merchant | Push / email — “Pending review” |
| 12h before timeout | Merchant | Reminder to confirm/reject |
| Timeout release | Tourist | “Request expired; VIO Credits returned” |
| Timeout release | Merchant | “Auto-closed — no response” |
| Ops cancel | Tourist + merchant | Transactional email |

**Not in v1 packs** — inbox API + pilot can proceed without notifications if copy on B2C states “pending review” only.

### Q10 — Staging pilot and production hold gate

| Gate | Impact |
|------|--------|
| [HOLD_PILOT_STAGING_RUNBOOK](../runbooks/VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md) | Scenarios 1–5 unchanged; add **Scenario 6** (optional): dry-run timeout script lists held row past threshold without apply. |
| Production `hold` enablement | **Still blocked** until timeout policy approved **and** ops cancel **or** worker dry-run signed off on staging. |
| Merchant inbox | `canCancel` remains true for merchant manual reject; timeout is **system** path — display `merchantDisplayState` stays `pending_merchant_review` until released. |

---

## Timeout eligibility matrix

| Row state | Eligible for timeout release? | Reason | Action |
|-----------|--------------------------------|--------|--------|
| `HOLD_ON_SUBMIT` + `PENDING` + unsettled + past deadline | **Yes** | Standard held review timeout | System cancel → `TIMEOUT_AUTO_RELEASE` |
| `HOLD_ON_SUBMIT` + `PENDING` + unsettled + before deadline | No | Within review window | None |
| `HOLD_ON_SUBMIT` + `CANCELLED` | No | Terminal | Idempotent skip |
| `HOLD_ON_SUBMIT` + `CONFIRMED` / `COMPLETED` | No | Past review / fulfilled | None |
| `SETTLE_ON_CONFIRM` + settled | No | Already settled | None |
| `LEGACY_SETTLE_ON_BOOK` | No | Not a hold row | None — ops playbook only |
| `PREVIEW_ONLY` | No | No wallet hold | None |
| `UNKNOWN` + paid + unsettled | No | Ambiguous metadata — manual review | Ops / backfill first |
| `providerSettledAt` set | No | Funds already moved | None |
| `confirmedAt` set, unsettled | No | Inconsistent — ops | Manual investigation |
| Missing `BOOKING_LOCK` | No | Cannot prove hold | Alert ops; no auto-release |
| Insufficient `lockedBalanceVIG` | No | Wallet drift | Alert ops; no auto-release |

---

## Cancel reasons

Canonical string codes (max 200 chars on `TourismBooking.cancelReason`):

| Code | Set by | When | Wallet |
|------|--------|------|--------|
| `USER_CANCEL` | Tourist | Self-cancel before confirm | Full hold release |
| `PROVIDER_REJECTED` | Merchant owner | Reject before confirm | Full hold release |
| `OPS_CANCEL` | Admin (`Role.ADMIN`) | Manual ops intervention | Full hold release (pre-confirm only) |
| `TIMEOUT_AUTO_RELEASE` | System worker | Past `reviewDeadlineAt` | Full hold release |
| `MERCHANT_NO_RESPONSE` | **Deprecated alias** | Do not write in v1 — use `TIMEOUT_AUTO_RELEASE` | — |
| `SYSTEM_SAFETY_RELEASE` | System / ops | Incident kill-switch batch | Full hold release; requires dual sign-off |

**Rules:**

- Timeout worker **must** use `TIMEOUT_AUTO_RELEASE` (not `PROVIDER_REJECTED`) to preserve analytics truth.
- Ops manual cancel **must** pass explicit `OPS_CANCEL` or `SYSTEM_SAFETY_RELEASE` — never impersonate tourist/merchant default reasons.
- Post-confirm cancel reasons (`REFUND_*`, `CHARGEBACK_*`) — **out of scope** until dedicated refund pack.

---

## Worker / dry-run design

**Script (proposed):** `scripts/jobs/release-tourism-held-timeouts.ts`

```bash
# Dry-run (default)
npx tsx scripts/jobs/release-tourism-held-timeouts.ts

# Staging / prod apply (explicit)
TOURISM_TIMEOUT_RELEASE_ENABLED=true \
  npx tsx scripts/jobs/release-tourism-held-timeouts.ts --apply --max-batch 50
```

| Flag | Purpose |
|------|---------|
| (none) | Dry-run — list candidates, no writes |
| `--apply` | Execute releases |
| `--max-batch N` | Cap per run (default 50, hard max 100) |
| `--booking-id <uuid>` | Single-row ops/debug |

**Selection query (conceptual):**

```sql
SELECT id FROM "TourismBooking"
WHERE "settlementMode" = 'HOLD_ON_SUBMIT'
  AND status = 'PENDING'
  AND "providerSettledAt" IS NULL
  AND "confirmedAt" IS NULL
  AND COALESCE("createdAt", "fxLockedAt") < NOW() - INTERVAL '<timeoutHours> hours'
ORDER BY COALESCE("createdAt", "fxLockedAt") ASC
LIMIT :maxBatch;
```

**Per-row execution:**

1. Re-check eligibility (including `evaluateTourismHeldBookingCancelEligibility`).
2. Call `cancelTourismHeldBooking({ bookingId, actorKind: 'system_timeout', cancelReason: 'TIMEOUT_AUTO_RELEASE' })`.
3. On success: log booking id + `totalPaidVIG`.
4. On reject: increment `skipped` / `error`; do not partial-update wallet.

**Idempotency:** Relies on existing cancel idempotency (`CANCELLED` → no double `ESCROW_REFUND`).

**Kill switch:**

| Env var | Default | Effect |
|---------|---------|--------|
| `TOURISM_TIMEOUT_RELEASE_ENABLED` | `false` | Worker exits 0 with message if not `true` |
| `TOURISM_HOLD_REVIEW_TIMEOUT_HOURS` | `48` | Deadline calculation |
| `TOURISM_SETTLEMENT_MODE` | `legacy_settle_on_book` | Worker no-op if not `hold` (no candidates) |

**Ledger reconciliation output (each run):**

```
[tourism-timeout-release] mode=DRY-RUN|APPLY
  eligible: <n>
  released: <n>
  idempotent_skip: <n>
  rejected_ineligible: <n>
  errors: <n>
  totalVIGReleased: <sum>
  sample_ids: [...]
```

**Alerting:** `errors > 0` OR `eligible > 20` → ticket; `totalVIGReleased` over daily cap (config) → finance review.

---

## Ops/admin cancel design

| Item | Specification |
|------|----------------|
| **Endpoint** | `POST /api/tourism/bookings/:bookingId/ops-cancel` |
| **Middleware** | `authMiddleware`, `superAdminMiddleware` |
| **Body** | `{ "cancelReason": "OPS_CANCEL" \| "SYSTEM_SAFETY_RELEASE", "note"?: string }` |
| **Service** | Extended `cancelTourismHeldBooking` with `actorKind: 'ops_admin'` |
| **Audit (v1)** | Structured log: `{ event: 'tourism_ops_cancel', opsUserId, bookingId, cancelReason, note, at }` |
| **Audit (v2)** | `TourismBookingEvent` append-only table |
| **Forbidden** | Cancel when `providerSettledAt` set; cancel `LEGACY_SETTLE_ON_BOOK` hold path; wallet SQL |

**Alternative (not v1):** Reuse generic admin tourism tool under `/api/admin/tourism/...` — only if admin router pattern already exists; prefer tourism namespace for discoverability.

---

## Reuse of `cancelTourismHeldBooking`

| Concern | How reuse addresses it |
|---------|-------------------------|
| Double release | Same `updateMany` + idempotent `CANCELLED` path |
| Wrong row types | Same `evaluateTourismHeldBookingCancelEligibility` |
| Ledger correctness | Same `ESCROW_REFUND` + lock decrement / balance increment |
| Actor authorization | **Only extension point** — add `ops_admin` and `system_timeout` actors |

**Do not** extract a separate `releaseTourismHoldFunds()` for v1 unless unit-test duplication becomes painful; if extracted, confirm and cancel must call it (larger refactor — defer).

**Tourist/merchant behavior:** Unchanged — existing `actorUserId` ownership checks remain default.

---

## Production gates

Production `TOURISM_SETTLEMENT_MODE=hold` remains **blocked** until **all**:

| # | Gate |
|---|------|
| 1 | [HOLD_PILOT_STAGING_RUNBOOK](../runbooks/VIONA_TOURISM_HOLD_PILOT_STAGING_RUNBOOK_1.md) Scenarios 1–5 pass |
| 2 | Legacy backfill applied on production (if any tourism rows exist) |
| 3 | This design approved (Product, Payments, Ops, Trust & Safety) |
| 4 | `VIONA.TOURISM.OPS_CANCEL_API.1` deployed **or** explicit ops playbook for manual DB (emergency only) |
| 5 | `VIONA.TOURISM.TIMEOUT_RELEASE_DRY_RUN.1` run on staging; finance sign-off on output |
| 6 | `VIONA.TOURISM.TIMEOUT_RELEASE_WORKER.1` enabled on staging; 0 errors over 7 days |
| 7 | Engineering + Finance + Product/Safety sign-off |
| 8 | Support runbook: timeout copy, ops escalation |

**Ordering:** Ops cancel API **before** enabling production timeout worker (manual escape hatch). Timeout worker **before** production `hold` flag.

---

## Implementation packs

### 1. `VIONA.TOURISM.OPS_CANCEL_API.1`

| | |
|-|-|
| **Target files** | `WalletService.ts` (actor extension), `TourismController.ts`, `tourismRoutes.ts`, optional `tourismOpsCancelEligibility.ts` |
| **Behavior** | `POST …/ops-cancel`; `OPS_CANCEL` / `SYSTEM_SAFETY_RELEASE`; structured audit log |
| **Do-not-touch** | Confirm settle math; legacy settlement; schema |
| **Validation** | typecheck, eligibility scripts, integration test with ADMIN JWT |
| **Sign-off** | Security + Payments + Ops |

### 2. `VIONA.TOURISM.TIMEOUT_RELEASE_DRY_RUN.1`

| | |
|-|-|
| **Target files** | `scripts/jobs/release-tourism-held-timeouts.ts`, `docs/runbooks/VIONA_TOURISM_TIMEOUT_RELEASE_RUNBOOK_1.md` |
| **Behavior** | Dry-run only; reconciliation report; no `--apply` |
| **Do-not-touch** | WalletService except shared cancel extension from pack 1 |
| **Validation** | Run against staging DB snapshot; attach log to ticket |
| **Sign-off** | Finance + Engineering |

### 3. `VIONA.TOURISM.TIMEOUT_RELEASE_WORKER.1`

| | |
|-|-|
| **Target files** | Same script `--apply`; cron/k8s/Cloud Scheduler manifest or worker entry |
| **Behavior** | 15 min cadence; kill switch; max batch |
| **Do-not-touch** | Hold default; UI |
| **Validation** | Staging soak; zero double-release in ledger audit |
| **Sign-off** | Payments + Ops + Release Train |

### 4. `VIONA.TOURISM.HOLD_PILOT_EXECUTION_REPORT.1`

| | |
|-|-|
| **Target files** | `docs/runbooks/` execution report template |
| **Behavior** | Human checklist + evidence links from staging pilot |
| **Do-not-touch** | Runtime |
| **Validation** | N/A (ops doc) |
| **Sign-off** | Product + Finance |

### 5. `VIONA.TOURISM.MERCHANT_INBOX_UI.1`

| | |
|-|-|
| **Target files** | B2B screen (e.g. extend merchant dashboard or new queue), `viGlobalTourismApi.ts` |
| **Behavior** | List `GET …/bookings/merchant`; confirm/cancel buttons gated by `actions.*`; backend-truth labels only |
| **Do-not-touch** | Settlement logic; timeout worker |
| **Validation** | Manual QA + smoke |
| **Sign-off** | CPO + B2B owner |

**Recommended sequence:** 1 → 2 → (staging pilot + report 4) → 3 → 5 (parallel after 1).

---

## Staging pilot addendum (Scenario 6 — optional)

After hold pilot Scenarios 1–5:

1. Create held booking; set `TOURISM_HOLD_REVIEW_TIMEOUT_HOURS=1` on staging (test only).
2. Run timeout dry-run — expect booking in `eligible` list.
3. Do **not** `--apply` until finance reviews dry-run log.
4. Verify merchant inbox still shows `canCancel: true` before timeout.

---

## Future schema (deferred — not this design pack)

| Field | Purpose |
|-------|---------|
| `merchantReviewDeadlineAt` | Per-row deadline at book |
| `cancelledByUserId` / `cancelledByRole` | Audit |
| `TourismBookingEvent` | Append-only lifecycle |

v1 uses `COALESCE(createdAt, fxLockedAt) + env hours` only.

---

## Sign-off (design approval)

| Role | Approved | Date |
|------|----------|------|
| Payments & Ledger | | |
| Operations | | |
| Product / Trust & Safety | | |
| Engineering | | |

---

*End of design document.*
