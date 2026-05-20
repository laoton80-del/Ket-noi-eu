# VIONA.LOCAL.REQUEST_EXPIRY_WORKER_DESIGN.1

**Document ID:** `VIONA_LOCAL_REQUEST_EXPIRY_WORKER_DESIGN_1`  
**Type:** Architecture / worker design (docs only — **no** runtime, schema, or UI in this pack)  
**Branch:** `pack-local-request-expiry-worker-design`  
**Base master:** `85b5413` — `feat(local): merge ops request cancel API`  
**Inputs:** [Local Merchant Request ACK API Design](./VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1.md), [Local Request Schema Design](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md), [Local Merchant ACK State Machine Design](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md), [Tourism Ops Cancel / Timeout Design](./VIONA_TOURISM_OPS_CANCEL_TIMEOUT_DESIGN_1.md), `prisma/schema.prisma` (read-only reference), implemented Local routes @ `85b5413`  
**Date:** 2026-05-19  

**Status:** Design-only / **not implemented** — no worker, cron, API, migration, or wallet mutation in this pack.

**Design law:** Local commercial mode on master is **request-only / no charge** (`walletMode=REQUEST_ONLY_NO_CHARGE`, `walletPhase=NONE`). Expiry is a **durable status transition** on `LocalServiceRequest` — not payment, not escrow, not refund. **EXPIRED ≠ refunded** in current mode.

---

## Purpose

Define the **safe internal expiry/timeout worker** for Local merchant-review staleness **before** any automatic mutation ships. This document:

1. States why a background worker is needed and what it must **not** do in v1.
2. Anchors on the **current implemented** Local lifecycle (create, inbox, confirm, reject, user cancel, ops cancel).
3. Specifies **expirable vs non-expirable** states, timeout selection, execution model, idempotency, and concurrency.
4. Reserves **audit**, **notification**, and **UI** hooks without implementing them.
5. Documents **wallet compatibility** (no-op today; blocked hold release until finance-approved pack).
6. Proposes an **implementation sequence** and **review checklist** for a future `VIONA.LOCAL.REQUEST_EXPIRY_WORKER.1` pack.

**Out of scope for this pack:** Prisma edits, migrations, controllers, services, routes, worker scripts, cron registration, wallet mutations, Firebase bridge, Tourism/Home/logo/UI changes, production SLA commitments, public HTTP expiry endpoint.

---

## Current implemented baseline (@ `85b5413`)

| Capability | Status | Route / artifact |
|------------|--------|------------------|
| Durable row create | **Implemented** | `POST /api/local/requests` — `createLocalServiceRequest` |
| Default commercial mode | **Implemented** | `status=REQUESTED`, `walletMode=REQUEST_ONLY_NO_CHARGE`, `walletPhase=NONE`; credit amount fields `null` |
| Merchant inbox read | **Implemented** | `GET /api/local/merchant/requests` — owner-scoped, read-only DTO |
| Merchant confirm | **Implemented** | `POST /api/local/merchant/requests/:id/confirm` |
| Merchant reject | **Implemented** | `POST /api/local/merchant/requests/:id/reject` |
| Requester cancel | **Implemented** | `POST /api/local/requests/:id/cancel` |
| Ops/admin cancel | **Implemented** | `POST /api/local/ops/requests/:id/cancel` — `superAdminMiddleware` + `Role.ADMIN` in service |
| Review timeout / expiry worker | **Not implemented** | This document |
| `IN_PROGRESS` / `COMPLETED` transitions | **Not implemented** | — |
| Wallet hold / debit / settle | **Not implemented** | Blocked by mode + policy |
| Audit event table | **Not implemented** | Requirements defined below |

**Schema (existing, not modified in this pack):**

- `LocalServiceRequest.merchantReviewDeadlineAt` — nullable `DateTime`; indexed `(status, merchantReviewDeadlineAt)` and `(businessId, merchantReviewDeadlineAt)`.
- `LocalServiceRequest.expiredAt` — nullable `DateTime`.
- `LocalCancelReason.EXPIRED` — enum value exists; use only if implementation pack chooses consistent terminal semantics (see [Expiry mutation](#expiry-mutation-proposal)).

**Create API note (@ `85b5413`):** `merchantReviewDeadlineAt` is **not** set by the create service today; client-supplied deadline fields are rejected (same discipline as other dangerous fields). A **prior or companion pack** should set `merchantReviewDeadlineAt` at create or on transition to `MERCHANT_REVIEW` before the worker can rely on per-row deadlines in production.

**Auth pattern (existing HTTP):** Merchant/requester routes use `authMiddleware` + ownership checks. Ops cancel uses `superAdminMiddleware`. The expiry worker has **no user JWT** — internal execution only.

---

## 1. Purpose of the expiry worker

The worker closes the **merchant review window** for requests that remain unanswered:

- Reduces stale `REQUESTED` / `MERCHANT_REVIEW` rows in inbox and support tooling.
- Gives requesters a clear terminal outcome without implying payment or refund.
- Complements (does not replace) merchant reject, requester cancel, and ops cancel.

**v1 worker responsibilities:**

- Select eligible rows by deadline + status.
- Atomically transition eligible rows to `EXPIRED` with `expiredAt`.
- Emit audit/observability events (when audit pack exists).
- Remain a **no-op** for wallet ledger in `REQUEST_ONLY_NO_CHARGE`.

**v1 worker must not:**

- Expose a public HTTP mutation endpoint (unless a future ops-only repair route is explicitly approved).
- Expire `CONFIRMED` or post-ACK rows.
- Create `Transaction` rows, mutate balances, or call Firebase `walletOps`.
- Create `Booking` / `TourismBooking` bridge rows.
- Claim production SLA or refund language in user copy.

---

## 2. Current Local lifecycle baseline

```text
[Create] --> REQUESTED --(optional)--> MERCHANT_REVIEW
                |    \________ merchant confirm _________/
                |              \____ merchant reject ____/
                |              \____ user cancel ________/
                |              \____ ops cancel _________/
                |              \____ worker expire _____/  (NOT IMPLEMENTED)
                v
         CONFIRMED --> IN_PROGRESS --> COMPLETED   (future packs)
```

Terminal states today (HTTP-implemented): `REJECTED`, `USER_CANCELLED`, `OPS_CANCELLED`.  
Terminal state **designed, not implemented:** `EXPIRED`.

Parallel invariants (all implemented ACK paths):

| Field | v1 value on ACK / expiry design |
|-------|--------------------------------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` (guard on mutations) |
| `walletPhase` | `NONE` |
| Credit amount fields | `null` |
| `Transaction` | No writes |

---

## 3. Expirable states

Only rows in **pre-ACK review** may expire:

| Status | Expirable? | Rationale |
|--------|------------|-----------|
| `REQUESTED` | **Yes** | Awaiting merchant action; no commitment |
| `MERCHANT_REVIEW` | **Yes** | Explicit review state; same timeout policy |

**Precondition (wallet):** `walletMode=REQUEST_ONLY_NO_CHARGE` AND `walletPhase=NONE` (mirror confirm/reject/cancel guards). Rows in future hold modes are **out of scope** for v1 worker implementation until wallet pack + finance sign-off.

---

## 4. Non-expirable states

| Status | Expirable? | Rationale |
|--------|------------|-----------|
| `DRAFT` | **No** | Not persisted via create API today; worker should not select |
| `CONFIRMED` | **No** | Merchant committed; use reject/cancel/ops paths only if product adds post-confirm policy later |
| `IN_PROGRESS` | **No** | Fulfillment started |
| `COMPLETED` | **No** | Terminal |
| `REJECTED` | **No** | Terminal |
| `USER_CANCELLED` | **No** | Terminal |
| `OPS_CANCELLED` | **No** | Terminal |
| `EXPIRED` | **No** (idempotent skip) | Already terminal |

---

## Expiry state transition table

| From | To | Actor | Timestamps | Wallet v1 |
|------|-----|-------|------------|-----------|
| `REQUESTED` | `EXPIRED` | System worker | `expiredAt` → now (first transition only); `updatedAt` via Prisma | None |
| `MERCHANT_REVIEW` | `EXPIRED` | System worker | Same | None |
| `EXPIRED` | `EXPIRED` | Worker replay | **No** timestamp bump | None |

**Optional fields (implementation pack decision — pick one policy and test it):**

| Field | Recommendation |
|-------|----------------|
| `cancelReason` | Set `LocalCancelReason.EXPIRED` on first expire **or** leave `null` and rely on `status=EXPIRED` only. Prefer **`EXPIRED`** for analytics parity with ACK design doc; do **not** reuse `OPS_CANCEL` or `USER_CANCEL`. |
| `cancelledAt` | **Do not set** on expiry (reserved for cancel flows); use `expiredAt` only. |
| `cancelledByRole` | **Do not set** on expiry; audit uses `actorType=SYSTEM`. |

---

## Forbidden transition table

| Transition | Reason |
|------------|--------|
| Any → `EXPIRED` when `status` ∉ `{ REQUESTED, MERCHANT_REVIEW }` | Wrong lifecycle stage |
| `CONFIRMED` → `EXPIRED` | Post-ACK expiry forbidden in v1 |
| `REJECTED` / `USER_CANCELLED` / `OPS_CANCELLED` → `EXPIRED` | Terminal resurrection |
| `EXPIRED` → any non-terminal | No resurrection without admin repair pack |
| Expire when `walletMode ≠ REQUEST_ONLY_NO_CHARGE` | Wallet pack gate |
| Expire when `walletPhase ≠ NONE` | Hold/settle pack gate |
| Expire with side effect on `Transaction` / balance | Forbidden in v1 |
| Public `POST /api/local/.../expire` without ops approval | Worker is internal-only in v1 |

---

## 5. Timeout policy proposal

### Primary selector (preferred when deadline is populated)

Worker batch query (conceptual):

```sql
WHERE status IN ('REQUESTED', 'MERCHANT_REVIEW')
  AND walletMode = 'REQUEST_ONLY_NO_CHARGE'
  AND walletPhase = 'NONE'
  AND merchantReviewDeadlineAt IS NOT NULL
  AND merchantReviewDeadlineAt < NOW() AT TIME ZONE 'UTC'
```

Use existing index `(status, merchantReviewDeadlineAt)` for bounded scans.

**Deadline source (future packs, not this doc):**

| Event | Proposed anchor |
|-------|-----------------|
| Create | `merchantReviewDeadlineAt = requestedAt + reviewTimeoutHours` |
| Enter `MERCHANT_REVIEW` | Set if null: `now() + reviewTimeoutHours` |

### Fallback when `merchantReviewDeadlineAt` is null

**Do not implement fallback in the same pack as the first worker apply** without product sign-off.

Design options (document only):

| Option | Formula | Risk |
|--------|---------|------|
| A — Skip | Worker ignores rows with null deadline | Safe; requires deadline backfill pack |
| B — `requestedAt + env hours` | `COALESCE(merchantReviewDeadlineAt, requestedAt + interval)` | May expire old rows unexpectedly if env misconfigured |
| C — Ops backfill script | One-time set deadline from `requestedAt` | Preferred before first `--apply` in staging |

**Pilot suggestion (configurable, not production commitment):**

- Internal env `LOCAL_MERCHANT_REVIEW_TIMEOUT_HOURS` — suggested pilot range **24–72 hours** for staging only.
- Default **48 hours** as engineering default (align with tourism timeout design pattern) — **must be overridden via env** per environment; **not** a product SLA until ops/product approves.
- Staging may use **24h** for faster dry-runs (mirror `TOURISM_HOLD_REVIEW_TIMEOUT_HOURS` pattern).

**Forbidden in this pack:** Hardcoding production SLA in code or docs as a customer-facing guarantee.

---

## 6. Worker execution model

Mirror tourism timeout **pattern** (`scripts/jobs/release-tourism-held-timeouts.ts`) — dry-run first, apply later — adapted for Local **status-only** mutation.

| Aspect | Proposal |
|--------|----------|
| **Name** | `localRequestExpiryWorker` / script `scripts/jobs/expire-local-service-requests.ts` (exact name in implementation pack) |
| **Trigger** | Cron every **15 minutes** (staging/production after pilot) — same cadence as tourism design; not binding until ops approves |
| **Deployment** | Platform job runner / manual `npx tsx` in staging; **no** in-process timer inside API server in v1 |
| **Auth** | No HTTP; job uses DB credentials only; optional internal service token if moved to queue worker later |
| **Modes** | **Dry-run (default):** classify candidates, print counts/samples, **zero writes**. **Apply:** conditional updates only after finance/product sign-off on staging dry-run |
| **Batch** | `--max-batch N` (e.g. 50–200) per run to limit lock time |
| **Single-row** | `--request-id <uuid>` for support replay |
| **Observability** | Structured log line per run: `runId`, mode, counts, duration; no PII |

**No public HTTP endpoint in v1.** Optional future: ops-only `POST /api/local/ops/requests/:id/expire` for manual repair — requires separate design approval; not part of this worker pack.

---

## 7. Idempotency rules

| Condition | Behavior |
|-----------|----------|
| `status` already `EXPIRED` | **Skip** `update` — return success for that id; do **not** bump `expiredAt` or `updatedAt` intentionally |
| Worker run twice on same row before first commit | At most one row transitions (see concurrency) |
| Dry-run replay | Always read-only |
| Duplicate `runId` in audit | Allowed; idempotency is per **request row**, not per audit event |

**Audit idempotency key:** `{runId}:{requestId}:expire` — duplicate audit rows acceptable if implementation uses at-least-once logging; DB transition remains authoritative.

---

## 8. Concurrency / race-condition protection

Races between worker and HTTP mutations (confirm, reject, user cancel, ops cancel) must be safe.

### Strategy (recommended for implementation pack)

Use **conditional update** (Prisma `updateMany` with status guard):

```ts
// Conceptual — not shipped in this pack
await prisma.localServiceRequest.updateMany({
  where: {
    id: requestId,
    status: { in: ['REQUESTED', 'MERCHANT_REVIEW'] },
    walletMode: 'REQUEST_ONLY_NO_CHARGE',
    walletPhase: 'NONE',
    merchantReviewDeadlineAt: { lt: now },
  },
  data: {
    status: 'EXPIRED',
    expiredAt: now,
    cancelReason: 'EXPIRED', // if policy chosen
  },
});
// affected === 0 → lost race or ineligible; do not treat as error at worker level
```

| Competing action | Outcome |
|------------------|---------|
| Merchant confirm wins | Worker `affected=0`; row stays `CONFIRMED` |
| Merchant reject wins | Worker `affected=0`; row stays `REJECTED` |
| User/ops cancel wins | Worker `affected=0` |
| Worker wins | HTTP confirm/reject/cancel returns `409 invalid_status` (existing eligibility) |
| Two worker instances | At most one `affected=1`; second gets `affected=0` |

**Optional:** Serializable transaction or `SELECT … FOR UPDATE` only if metrics show unacceptable duplicate audit noise — prefer conditional `updateMany` first.

**Clock:** Compare deadlines in **UTC**; server `now()` must be NTP-synced in production.

---

## 9. Authorization / internal execution rules

| Actor | May expire? | Rule |
|-------|-------------|------|
| System worker | **Yes** | Internal job credentials only |
| Merchant JWT | **No** | Use reject endpoint |
| Requester JWT | **No** | Use cancel endpoint |
| Admin JWT | **No** in v1 worker | Use ops cancel; optional future manual expire route |
| Anonymous | **No** | — |

Worker code must **not** accept `req.authUserId` from HTTP. If later exposed via queue, message payload carries `requestId` + `runId` only — no impersonation of merchant/requester.

---

## 10. Audit / event logging requirements

Future implementation must record append-only events (table or structured log sink TBD):

| Field | Value |
|-------|-------|
| `requestId` | UUID |
| `previousStatus` | e.g. `REQUESTED` |
| `newStatus` | `EXPIRED` |
| `actorType` | `SYSTEM` |
| `reason` | `TIMEOUT_EXPIRED` |
| `runId` | Worker run UUID |
| `idempotencyKey` | `{runId}:{requestId}:expire` |
| `timestamp` | ISO UTC |
| `noWalletAction` | `true` |
| `merchantReviewDeadlineAt` | Snapshot at selection time |
| `walletMode` / `walletPhase` | Snapshot |

**Event name:** `local_request.expired` (align with ACK design doc).

**Rules:**

- Emit **after** successful DB commit (or in same transaction as audit insert if table exists).
- Never log requester phone, email, or PIN.
- Log `affected=0` skips at `debug` only (high volume).
- Failed eligibility: optional `local_request.expire_skipped` with reason `not_due` | `wrong_status` | `invalid_wallet_mode`.

**Not in v1:** Merchant-facing audit UI.

---

## 11. Wallet compatibility rules

### Current mode: `REQUEST_ONLY_NO_CHARGE` + `walletPhase=NONE`

| Action | Worker behavior |
|--------|-----------------|
| Hold | **No** |
| Debit | **No** |
| Release | **No** |
| Refund | **No** |
| Settlement / provider payout | **No** |
| `Transaction.create` | **Forbidden** |
| Firebase `walletOps` | **Forbidden** |

Worker must call a single gate (future): `evaluateLocalRequestWalletTransition({ action: 'expire', row })` that **no-ops** when `walletMode=REQUEST_ONLY_NO_CHARGE`.

### Wallet compatibility table

| `walletMode` | Expiry worker v1 | Future hold mode (**blocked**) |
|--------------|------------------|--------------------------------|
| `REQUEST_ONLY_NO_CHARGE` | Status + `expiredAt` only | N/A |
| `NO_LEDGER_PREVIEW` | Same as above (if ever used) | N/A |
| `HOLD_ON_SUBMIT` | **Must not run** until wallet hold/release pack | Release full hold → `walletPhase=RELEASED`; Prisma `Transaction` ledger SoT; idempotency + reversal path; **finance sign-off** |
| `SETTLE_ON_CONFIRM` | **Blocked** | Expiry after confirm is separate policy — not v1 |
| `LEGACY_BOOKING_BRIDGE` | **Blocked** | Bridge pack only |
| Firebase VIP | **Never** | — |

**Future wallet release path:** Documented in ACK / state machine designs as **RELEASED** after hold — **implementation blocked** until:

1. `VIONA.LOCAL.WALLET_HOLD_POLICY.1` (or equivalent) merged  
2. Finance sign-off  
3. Staging pilot with eligibility + dry-run scripts  
4. Production feature flag **off** until go-live checklist  

---

## Worker selection proposal

### Phase 1 — Dry-run (implementation pack)

1. Resolve timeout hours from env `LOCAL_MERCHANT_REVIEW_TIMEOUT_HOURS` (for fallback/backfill docs only).
2. `findMany` candidates with primary selector (deadline `< now`, expirable statuses, wallet guards).
3. Classify buckets: `eligible` | `not_yet_due` | `already_expired` | `wrong_status` | `invalid_wallet` | `null_deadline` | `manual_review`.
4. Print reconciliation summary (mirror tourism dry-run).
5. **Zero writes.**

### Phase 2 — Apply (separate gate)

1. Require explicit `--apply` + `--max-batch`.
2. Per row: conditional `updateMany` (see [Concurrency](#8-concurrency--race-condition-protection)).
3. Emit audit event on `affected=1`.
4. **No** wallet service calls in v1.

### Expiry mutation proposal

| Field | On first successful expire |
|-------|----------------------------|
| `status` | `EXPIRED` |
| `expiredAt` | `now()` UTC |
| `cancelReason` | `EXPIRED` (recommended) or `null` (if product prefers status-only) |
| `updatedAt` | Prisma `@updatedAt` |
| `walletMode` | Unchanged |
| `walletPhase` | Unchanged |
| Credit fields | Unchanged (`null`) |

---

## 12. Future notification hooks

| Trigger | Audience | Channel (future) | Copy direction |
|---------|----------|------------------|----------------|
| 12h before deadline | Merchant | Push/email (TBD) | “Review pending request” — no payment language |
| On expire | Requester | Push/in-app | “Request expired — merchant did not respond in time.” |
| On expire | Merchant | Optional | “Request removed from inbox (expired)” |

**i18n keys (proposal only):**

| Key | EN (example) |
|-----|----------------|
| `local_request.expired.title` | Request expired |
| `local_request.expired.body` | The merchant did not respond before the review deadline. No payment was captured. |
| `local_request.expired.merchant` | A request in your inbox has expired. |

**Forbidden notification copy:** “Refunded”, “VIO Credits returned”, “Payment reversed”, “Booking cancelled with refund”.

Notifications are **out of scope** for the worker implementation pack; worker only emits events/logs that a future dispatcher consumes.

---

## 13. Future merchant / user UI compatibility

| Surface | Behavior |
|---------|----------|
| Merchant inbox `GET` | Rows in `EXPIRED` appear as terminal; `actions.canConfirm/canReject=false` (future `actions` pack) |
| Requester history | Show `expiredAt`; badge “Expired” — not “Cancelled” |
| Status badge | Only if `status=EXPIRED` | **Forbidden:** “Refunded”, “Paid” |
| Inbox filter | Include `EXPIRED` in “Closed” tab |

No UI changes in worker design pack. Inbox DTO may later add `displayState: 'expired'` (mirror tourism `merchantDisplayState`).

---

## 14. Safety copy

| Context | Allowed (EN) | Forbidden |
|---------|--------------|-----------|
| Worker log / ops summary | `expired_count=N`, `no_wallet_action=true` | Balance amounts |
| Requester message (future) | “Request expired. No payment was captured.” | “Refund processed” |
| Merchant message (future) | “Request expired — review window ended.” | “Customer charged” |
| API (if ever added) | Same as above | “Released credits” in v1 |

Align with implemented ops cancel message pattern: *“No payment was captured.”*

---

## 15. Future implementation sequence

| Order | Pack | Delivers |
|-------|------|----------|
| 0 | `VIONA.LOCAL.REQUEST_EXPIRY_WORKER_DESIGN.1` | **This document** |
| 1 | `VIONA.LOCAL.REQUEST_DEADLINE_ON_CREATE.1` (optional) | Set `merchantReviewDeadlineAt` on create / `MERCHANT_REVIEW` transition |
| 2 | `VIONA.LOCAL.REQUEST_EXPIRY_WORKER.1` | Eligibility module + dry-run script + integration tests |
| 3 | Staging pilot | Dry-run sign-off; then `--apply` with small batch |
| 4 | `VIONA.LOCAL.REQUEST_INBOX_ACTIONS.1` | `actions` flags including expired terminal |
| 5 | `VIONA.LOCAL.REQUEST_NOTIFICATIONS.1` | Dispatcher hooks |
| 6 | `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Hold release on expire (**blocked** until finance) |

**Dependencies before production apply:**

- [ ] Deadline population strategy chosen (per-row vs fallback)
- [ ] Dry-run on staging with reconciliation sign-off
- [ ] Confirm/reject/cancel integration tests still pass (race tests)
- [ ] No `Transaction` count delta in tests (mirror ops cancel test pattern)

**Suggested tests (implementation pack):**

- `scripts/test-local-request-expiry-eligibility.ts` (unit)
- `scripts/test-local-request-expiry-worker-api.ts` (DB integration: expire REQUESTED, idempotent EXPIRED, race with confirm, no tx/booking delta)

---

## Review checklist (pre-merge for implementation pack)

- [ ] Worker is internal-only (no public HTTP unless separately approved)
- [ ] Only `REQUESTED` / `MERCHANT_REVIEW` → `EXPIRED`
- [ ] Conditional `updateMany` (or equivalent) prevents lost-race corruption
- [ ] Idempotent on `EXPIRED` — no timestamp bump on replay
- [ ] No `Transaction` / wallet balance updates when `walletMode=REQUEST_ONLY_NO_CHARGE`
- [ ] No Firebase / Tourism / Home / logo / UI changes in worker pack
- [ ] No schema migration unless unavoidable (prefer using existing `expiredAt` / `merchantReviewDeadlineAt`)
- [ ] Audit events include `noWalletAction=true`
- [ ] Copy safe for request-only mode
- [ ] Dry-run default; `--apply` gated
- [ ] Env timeout labeled configurable — not production SLA

---

## Not implemented in this pack

The following are **explicitly not shipped** in `VIONA.LOCAL.REQUEST_EXPIRY_WORKER_DESIGN.1`:

- Runtime worker / cron / queue consumer  
- `scripts/jobs/expire-local-service-requests.ts` (or any job script)  
- Eligibility or service modules under `src/services/local/`  
- Controller, route, or HTTP endpoint changes  
- Prisma schema edits or migrations  
- UI, Home, Travel, Tourism, logo, or public pricing changes  
- Wallet hold, debit, release, refund, settlement, or `Transaction` writes  
- Firebase VIP bridge  
- `merchantReviewDeadlineAt` population on create  
- Notification dispatcher wiring  
- Production enablement or SLA claims  

---

## References

- [VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1.md](./VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1.md) — §5 Expiry flow, transition tables, audit `local_request.expired`  
- [VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md) — `merchantReviewDeadlineAt`, `expiredAt`, indexes  
- [VIONA_TOURISM_OPS_CANCEL_TIMEOUT_DESIGN_1.md](./VIONA_TOURISM_OPS_CANCEL_TIMEOUT_DESIGN_1.md) — dry-run worker pattern  
- `scripts/jobs/release-tourism-held-timeouts.ts` — reference dry-run structure (Tourism; do not conflate with Local v1 no-wallet behavior)

---

*End of document.*
