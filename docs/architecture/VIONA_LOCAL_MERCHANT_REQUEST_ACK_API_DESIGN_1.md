# VIONA.LOCAL.MERCHANT_REQUEST_ACK_API_DESIGN.1

**Document ID:** `VIONA_LOCAL_MERCHANT_REQUEST_ACK_API_DESIGN_1`  
**Type:** Architecture / API design (docs only — **no** runtime, schema, or UI in this pack)  
**Branch:** `pack-local-merchant-request-ack-api-design`  
**Base master:** `71f7609` — `Merge branch 'pack-local-merchant-request-inbox-api'`  
**Inputs:** [Local Request Schema Design](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md), [Local Merchant ACK State Machine Design](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md), [Firebase VIP Wallet Isolation Policy](./VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1.md), `prisma/schema.prisma`, implemented Local routes @ `71f7609`  
**Date:** 2026-05-19  

**Design law:** Local commercial mode on master is **request-only / no charge** (`walletMode=REQUEST_ONLY_NO_CHARGE`, `walletPhase=NONE`). Merchant acknowledgement is a **durable status transition** on `LocalServiceRequest` — not payment, not escrow, not dispatch, not provider payout. **CONFIRMED ≠ paid.** **COMPLETED ≠ settled** in current mode.

---

## Purpose

Define the **safe HTTP mutation contract** for Local merchant request acknowledgement **before** any confirm/reject/cancel/timeout implementation ships. This document:

- Specifies allowed and forbidden **state transitions** for the ACK lifecycle.
- Proposes **endpoint shapes**, **authorization**, **idempotency**, **audit**, **DTOs**, and **copy** constraints.
- Documents **wallet hold compatibility** as **blocked** until a separate finance-approved wallet pack.
- Reserves **future merchant inbox UI** compatibility (action flags, inbox DTO) without designing screens in this pack.

**Out of scope for this pack and for v1 implementation until later packs:** Prisma edits, migrations, controllers, services, routes, workers, wallet mutations, Firebase bridge, Tourism/Home/logo/UI changes, production enablement claims.

---

## Current implemented baseline (@ `71f7609`)

| Capability | Status | Route / artifact |
|------------|--------|------------------|
| Durable row create | **Implemented** | `POST /api/local/requests` — `createLocalServiceRequest` |
| Default commercial mode | **Implemented** | `status=REQUESTED`, `walletMode=REQUEST_ONLY_NO_CHARGE`, `walletPhase=NONE`; credit amount fields `null` |
| Merchant inbox read | **Implemented** | `GET /api/local/merchant/requests` — owner-scoped, read-only DTO |
| Merchant confirm/reject | **Not implemented** | — |
| Requester cancel | **Not implemented** | — |
| Ops cancel | **Not implemented** | — |
| Review timeout / expiry job | **Not implemented** | — |
| `IN_PROGRESS` / `COMPLETED` transitions | **Not implemented** | — |
| Wallet hold / debit / settle | **Not implemented** | Blocked by mode + policy |
| Audit event table | **Not implemented** | Requirements defined below for future pack |

**Auth pattern (existing):** `authMiddleware` → `req.authUserId`. Tourism ops uses `superAdminMiddleware` (`Role.ADMIN`) after auth — Local ops cancel should mirror.

**Schema note:** `LocalServiceRequestStatus` includes `DRAFT`; create API today lands on **`REQUESTED`** only. ACK APIs in this design do **not** expose `DRAFT` transitions (preview remains client-side until a future create variant).

---

## Commercial mode (current — non-negotiable for v1 ACK)

| Rule | Value |
|------|--------|
| `walletMode` | Must remain `REQUEST_ONLY_NO_CHARGE` on all ACK mutations in v1 |
| `walletPhase` | Must remain `NONE` |
| VIO Credits hold | **Forbidden** |
| Debit / settlement / provider payout / platform fee | **Forbidden** |
| `Transaction` rows | **Forbidden** on ACK paths in v1 |
| Firebase `walletOps` / VIP | **Forbidden** — isolated product |
| `Booking` / `TourismBooking` bridge | **Forbidden** on ACK paths in v1 |

Future `HOLD_ON_SUBMIT` / `SETTLE_ON_CONFIRM` modes are documented in [Wallet compatibility](#wallet-compatibility-table) but **must not** be enabled by ACK implementation until `VIONA.LOCAL.WALLET_HOLD_POLICY.*` + finance sign-off.

---

## Flow designs

### 1. Merchant confirm flow

**Actor:** Authenticated user who **owns** `LocalServiceRequest.businessId`.

**Preconditions:**

- Row exists.
- `status` ∈ `{ REQUESTED, MERCHANT_REVIEW }` (see [transition table](#state-transition-table)).
- `walletMode=REQUEST_ONLY_NO_CHARGE`, `walletPhase=NONE` (v1 guard).
- Optional: `merchantReviewDeadlineAt` not passed (policy v1: allow confirm until ops/expiry pack defines otherwise).

**Mutation (future implementation):**

- `status` → `CONFIRMED`
- `confirmedAt` → `now()` (UTC) on first successful confirm only
- `walletMode` / `walletPhase` unchanged in v1
- **No** `providerSettledAt`, **no** credit amount fields populated in v1

**Postconditions:**

- Idempotent replay returns same terminal view (see [Idempotency](#idempotency-table)).
- **No** wallet side effects in v1.

**User-facing copy (allowed):** “Merchant confirmed your request.” / “Your request was accepted for review.”  
**Forbidden:** “Payment received”, “escrow secured”, “provider paid”, “booking guaranteed”.

---

### 2. Merchant reject flow

**Actor:** Business owner (same as confirm).

**Preconditions:**

- `status` ∈ `{ REQUESTED, MERCHANT_REVIEW }`.
- Not already terminal.

**Mutation:**

- `status` → `REJECTED`
- `rejectedAt` → `now()` on first reject
- `rejectReason` → `PROVIDER_REJECTED` (or controlled enum / short text per product policy)
- v1: **no** wallet release (no hold exists)

**Postconditions:**

- Terminal; merchant cannot confirm after reject.

**Copy (allowed):** “Request declined by merchant.”  
**Forbidden:** “Refund processed”, “VIO Credits returned” in v1 (no hold).

---

### 3. User cancel flow

**Actor:** Authenticated **requester** (`requesterUserId === req.authUserId`).

**Preconditions:**

- `status` ∈ `{ REQUESTED, MERCHANT_REVIEW }` only — **not** after `CONFIRMED` in v1 (stricter than tourism; ops path for post-confirm disputes).

**Mutation:**

- `status` → `USER_CANCELLED`
- `cancelledAt` → `now()`
- `cancelReason` → `USER_CANCEL`
- `cancelledByRole` → `REQUESTER` (or `B2C`)

**Copy (allowed):** “You cancelled this request.”  
**Forbidden:** “Refund”, “released” in v1.

---

### 4. Ops cancel flow

**Actor:** `Role.ADMIN` via `superAdminMiddleware` (after `authMiddleware`).

**Preconditions:**

- Policy-defined set — v1 proposal: `{ REQUESTED, MERCHANT_REVIEW, CONFIRMED, IN_PROGRESS }` (not `COMPLETED` / terminal states).
- Required body: `cancelReason` ∈ `{ OPS_CANCEL, SYSTEM_SAFETY_RELEASE }` (+ optional `note` for audit, max length).

**Mutation:**

- `status` → `OPS_CANCELLED`
- `cancelledAt`, `cancelReason`, `cancelledByRole=OPS` / `ADMIN`

**Copy (allowed):** “Cancelled by support.”  
**Forbidden:** Silent balance changes; “refunded to bank”.

---

### 5. Expiry / timeout flow

**Actor:** Internal **worker** (no public merchant/requester endpoint in v1).

**Trigger:** `merchantReviewDeadlineAt < now()` AND `status` ∈ `{ REQUESTED, MERCHANT_REVIEW }` (deadline set at create or enter-review pack).

**Mutation:**

- `status` → `EXPIRED`
- `expiredAt` → `now()`
- `cancelReason` → `EXPIRED` (optional; or leave `cancelReason` null and use status only — pick one in implementation pack)

**Wallet (v1):** No release.

**Future worker design (not implemented):**

- Cron / queue: `localRequestExpiryWorker` (name TBD), idempotent per `id`, batch `findMany` with index `(status, merchantReviewDeadlineAt)`.
- Env: `LOCAL_MERCHANT_REVIEW_TIMEOUT_HOURS` (default 48; staging 24).
- Set `merchantReviewDeadlineAt` on create or transition to `MERCHANT_REVIEW` in a prior pack.

**Copy (allowed):** “Request expired — merchant did not respond in time.”

---

### 6–7. State transition table

**Legend:** ✅ allowed | ❌ forbidden | — not applicable (terminal)

#### Allowed transitions (v1 ACK + lifecycle)

| From ↓ / To → | MERCHANT_REVIEW | CONFIRMED | REJECTED | USER_CANCELLED | OPS_CANCELLED | EXPIRED | IN_PROGRESS | COMPLETED |
|---------------|-----------------|-----------|----------|----------------|---------------|---------|-------------|-----------|
| **REQUESTED** | ✅ (optional auto/system) | ✅ merchant confirm | ✅ merchant reject | ✅ requester cancel | ✅ ops | ✅ worker | ❌ | ❌ |
| **MERCHANT_REVIEW** | — | ✅ confirm | ✅ reject | ✅ cancel | ✅ ops | ✅ worker | ❌ | ❌ |
| **CONFIRMED** | ❌ | — (idempotent) | ❌ | ❌ v1 | ✅ ops | ❌ | ✅ merchant/system start | ❌ |
| **IN_PROGRESS** | ❌ | ❌ | ❌ | ❌ | ✅ ops | ❌ | — (idempotent) | ✅ complete |
| **REJECTED** | ❌ | ❌ | — (idempotent) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **USER_CANCELLED** | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ |
| **OPS_CANCELLED** | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **EXPIRED** | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **COMPLETED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — (idempotent) |

**Additional lifecycle endpoints (future packs, not in ACK v1 slice):**

| Transition | Endpoint / actor | Notes |
|------------|------------------|-------|
| → `IN_PROGRESS` | `POST …/start` or confirm side-effect | Only after `CONFIRMED`; vertical-specific |
| → `COMPLETED` | `POST …/complete` | **Does not imply settlement** in v1 |

#### Forbidden transitions (explicit)

| Transition | Reason |
|------------|--------|
| `REQUESTED` / `MERCHANT_REVIEW` → `COMPLETED` | Skips merchant ACK — mirrors tourism guard |
| `REQUESTED` → `CONFIRMED` without owner auth | Forgery |
| `CONFIRMED` → `REJECTED` | Use ops cancel + future clawback pack if ever needed post-settle |
| Any → `CONFIRMED` with `walletMode ≠ REQUEST_ONLY_NO_CHARGE` in v1 | Wallet pack gate |
| Any terminal → non-terminal | No resurrection without admin repair pack |
| `DRAFT` via ACK API | Create/preview only |
| Any ACK mutation with `legacyBookingId` set in v1 | Bridge pack only |

---

## Ownership and authorization rules

| Action | Who | Rule |
|--------|-----|------|
| Confirm / reject | Merchant | `Business.ownerId === req.authUserId` for row’s `businessId` |
| Cancel (user) | Requester | `requesterUserId === req.authUserId` |
| Ops cancel | Admin | `user.role === Role.ADMIN` + `superAdminMiddleware` |
| Expire | System worker | Service account / internal job — no user JWT |
| Read inbox | Merchant | Already implemented — same ownership rule |
| Complete / start | Merchant owner | Future pack — same ownership as confirm |

**Forbidden:**

- Merchant acting on another owner’s `businessId` (404 or 403 — prefer **404** for cross-tenant id guess hardening, align with tourism).
- Requester calling merchant confirm/reject.
- Merchant calling requester cancel on behalf of user.
- Non-admin calling ops cancel.

### Authorization table (proposed endpoints)

| Endpoint | Method | Auth | Scope check |
|----------|--------|------|-------------|
| `/api/local/merchant/requests` | GET | JWT | Owner of `businessId` filter / all owned businesses |
| `/api/local/merchant/requests/:id/confirm` | POST | JWT | Owner of row’s business |
| `/api/local/merchant/requests/:id/reject` | POST | JWT | Owner of row’s business |
| `/api/local/requests/:id/cancel` | POST | JWT | Requester only |
| `/api/local/ops/requests/:id/cancel` | POST | JWT + ADMIN | Row exists; policy status |
| *(worker)* expiry | — | Internal | Batch by deadline index |

Mount ops route under `/api/local/ops/...` with `authMiddleware` + `superAdminMiddleware` (mirror `POST /api/tourism/bookings/:bookingId/ops-cancel`).

---

## Idempotency rules

| Operation | Idempotent when | Behavior on replay | Side effects v1 |
|-----------|-----------------|-------------------|-----------------|
| Confirm | `status` already `CONFIRMED` | `200` + same DTO; **do not** bump `confirmedAt` | None |
| Reject | `status` already `REJECTED` | `200`; **do not** bump `rejectedAt` | None |
| User cancel | `status` already `USER_CANCELLED` | `200` | None |
| Ops cancel | `status` already `OPS_CANCELLED` | `200` | None |
| Expire worker | `status` already `EXPIRED` | Skip update | None |
| Complete (future) | `status` already `COMPLETED` | `200` | None |

**Conflict (not idempotent):**

- Confirm when `REJECTED` / `USER_CANCELLED` / `EXPIRED` → `409` `invalid_status`
- Reject when `CONFIRMED` → `409`
- Cancel when `CONFIRMED` → `409` (v1)

**Future wallet idempotency (blocked):** `idempotencyKey` per transition on `Transaction` writes when hold pack lands — same pattern as tourism/booking.

### Idempotency table (HTTP)

| Request | First call | Duplicate call | Wrong terminal |
|---------|------------|----------------|----------------|
| POST confirm | `200`, `CONFIRMED` | `200`, unchanged timestamps | `409` |
| POST reject | `200`, `REJECTED` | `200` | `409` |
| POST cancel | `200`, `USER_CANCELLED` | `200` | `409` |
| POST ops-cancel | `200`, `OPS_CANCELLED` | `200` | `409` |

---

## Audit / event logging requirements

All mutations in **future implementation** must emit **append-only audit events** (table or structured log sink TBD in implementation pack). Minimum event types:

| Event | Payload (minimum) |
|-------|-------------------|
| `local_request.confirmed` | `requestId`, `businessId`, `actorUserId`, `previousStatus`, `newStatus`, `walletMode`, `walletPhase`, `at` |
| `local_request.rejected` | + `rejectReason` |
| `local_request.user_cancelled` | + `cancelReason` |
| `local_request.ops_cancelled` | + `cancelReason`, `opsNote?` |
| `local_request.expired` | `requestId`, `deadlineAt`, `workerRunId?` |
| `local_request.in_progress` | future |
| `local_request.completed` | future |

**Rules:**

- Log **before or after** DB commit consistently (recommend **after** successful commit with transaction id).
- Never log requester phone, email, or PIN.
- Ops events must include `actorUserId` and reason code.
- Failed eligibility attempts: optional `local_request.transition_denied` at `warn` level (no PII).

**Not in v1:** Merchant-facing audit UI; only server-side observability + future admin tools.

---

## Response copy safety

| State / action | Allowed (EN examples) | Forbidden |
|----------------|----------------------|-----------|
| Confirm success (merchant) | “Request confirmed.” | “Payment captured”, “customer charged” |
| Confirm success (requester notification, future) | “Merchant confirmed your request.” | “Booking guaranteed”, “paid” |
| Reject | “Request declined.” | “Refunded”, “released credits” (v1) |
| User cancel | “Request cancelled.” | “Refund processed” |
| Ops cancel | “Request cancelled by support.” | Balance specifics without ledger proof |
| Expired | “Request expired.” | “Merchant confirmed” |
| CONFIRMED badge | Only if `status=CONFIRMED` | “Paid”, “escrow” |
| COMPLETED badge | “Service marked complete.” | “Settled”, “payout sent” (v1) |

Use **VIO Credits** in user copy when wallet pack eventually applies — not VIG in UI strings.

---

## Wallet mode / phase rules

| `walletMode` | ACK confirm | ACK reject/cancel/expire |
|--------------|-------------|-------------------------|
| `REQUEST_ONLY_NO_CHARGE` (v1) | Status + `confirmedAt` only | Status + terminal timestamps only |
| `NO_LEDGER_PREVIEW` | Same as above | Same |
| `HOLD_ON_SUBMIT` | **Blocked** until wallet pack | Would release hold → `walletPhase=RELEASED` |
| `SETTLE_ON_CONFIRM` | **Blocked** until wallet pack | Settle + fee split on confirm |
| `LEGACY_BOOKING_BRIDGE` | Separate bridge service | Do not mix with generic ACK v1 |
| Firebase VIP | **Never** on `LocalServiceRequest` | — |

| `walletPhase` | v1 ACK |
|---------------|--------|
| `NONE` | Required; unchanged |
| `HELD` / `SETTLED` / `RELEASED` | **Must not** be set by ACK v1 implementation |

---

## Wallet compatibility table

| ACK transition | v1 (`REQUEST_ONLY_NO_CHARGE`) | Future hold mode (documented, **disabled**) |
|----------------|--------------------------------|---------------------------------------------|
| Confirm | No ledger op | Optional settle on confirm per finance policy |
| Reject | No release (nothing held) | Release full hold → `RELEASED` |
| User cancel | No release | Release full hold |
| Ops cancel | No release | Release or manual review per playbook |
| Expire | No release | Release full hold |
| Complete | No payout | Provider credit only with settle pack |

**Future wallet release path:** Documented in [Local Merchant ACK State Machine](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md) as **RELEASED** phase after hold — **implementation blocked** until:

1. `VIONA.LOCAL.WALLET_HOLD_POLICY.1` (or equivalent) merged  
2. Finance sign-off  
3. Staging pilot with eligibility scripts  
4. Explicit feature flag **off** in production until go-live checklist  

ACK API implementation **must** call a single `evaluateLocalRequestWalletTransition()` gate that **no-ops** when `walletMode=REQUEST_ONLY_NO_CHARGE`.

---

## Endpoint design proposal

All mutation routes require `authMiddleware`. JSON bodies small (≤ 2 KB). Reject dangerous client fields (`status`, `walletMode`, `walletPhase`, amount fields, timestamps) — same discipline as create API.

### `POST /api/local/merchant/requests/:id/confirm`

| | |
|-|-|
| **Body** | Optional: `{ "note": string }` (merchant internal, max 500 chars, not shown to requester in v1) |
| **Success** | `200` — see [DTO](#api-response-dto-proposal) |
| **Errors** | `401`, `404`, `409 invalid_status`, `403` optional |

### `POST /api/local/merchant/requests/:id/reject`

| | |
|-|-|
| **Body** | Optional: `{ "rejectReason": "PROVIDER_REJECTED" \| string }` — validate against `LocalCancelReason` subset |
| **Success** | `200` |

### `POST /api/local/requests/:id/cancel`

| | |
|-|-|
| **Body** | Optional: `{ "cancelReason": "USER_CANCEL" }` |
| **Success** | `200` |
| **Note** | Under `/api/local/requests` (requester namespace), not merchant prefix |

### `POST /api/local/ops/requests/:id/cancel`

| | |
|-|-|
| **Middleware** | `authMiddleware`, `superAdminMiddleware` |
| **Body** | Required: `{ "cancelReason": "OPS_CANCEL" \| "SYSTEM_SAFETY_RELEASE", "note"?: string }` |
| **Success** | `200` |

### Future: timeout worker (no HTTP)

- See [Expiry flow](#5-expiry--timeout-flow).
- Optional future: `POST /api/local/merchant/requests/:id/start` → `IN_PROGRESS`
- Optional future: `POST /api/local/merchant/requests/:id/complete` → `COMPLETED`

**Inbox compatibility (future UI):** Extend `GET /api/local/merchant/requests` DTO with `actions: { canConfirm, canReject, canCancel, canStart, canComplete }` derived server-side from status + ownership + mode — mirror `tourismMerchantInboxView`. **Do not** add UI in ACK API pack.

---

## API response DTO proposal

Envelope: existing `{ success: true, data: T }` / `{ success: false, error: string }`.

```ts
type LocalRequestMutationDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  confirmedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  completedAt: string | null;
  message: string; // copy-safe, transition-specific
}>;
```

**Messages (v1 examples):**

| Transition | `message` |
|------------|-----------|
| Confirm | `Merchant confirmed this request.` |
| Reject | `Request declined.` |
| User cancel | `Request cancelled.` |
| Ops cancel | `Request cancelled by support.` |
| Idempotent replay | Same as terminal state (no double wording implying new action) |

**Do not return:** `requesterUserId` to merchant beyond inbox DTO; no wallet balances; no `totalVioCredits` until policy allows.

---

## Error response proposal

| HTTP | `error` (example) | When |
|------|-------------------|------|
| `401` | `Unauthorized` | Missing/invalid JWT |
| `403` | `Forbidden` | Non-admin on ops route |
| `404` | `Request not found` | Missing id or wrong tenant |
| `409` | `Request cannot be confirmed in its current status` | Eligibility failure |
| `400` | `Invalid cancelReason` | Ops body validation |
| `400` | `Request-only create does not accept: …` | Dangerous fields if any |

Prefer **409** over **400** for state conflicts (align with booking/tourism).

---

## Future implementation sequence

| Order | Pack | Delivers |
|-------|------|----------|
| 1 | `VIONA.LOCAL.MERCHANT_REQUEST_ACK_API.1` | Confirm, reject, cancel, ops-cancel services + routes + eligibility helpers |
| 2 | `VIONA.LOCAL.REQUEST_EXPIRY_WORKER.1` | Deadline on create/review + expiry job |
| 3 | `VIONA.LOCAL.REQUEST_INBOX_ACTIONS.1` | `actions` on GET inbox DTO |
| 4 | `VIONA.LOCAL.REQUEST_COMPLETE_API.1` | `IN_PROGRESS` / `COMPLETED` (still no settle in v1) |
| 5 | `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Hold/release/settle gates (finance sign-off) |
| 6 | UI pack | Wire B2B inbox; remove mock ACK; **no UI in ACK design pack** |

Each implementation pack: unit eligibility tests (mirror `scripts/test-tourism-*-eligibility.ts`), integration tests with `DATABASE_URL`, no production flag enablement without checklist.

---

## Review checklist (pre-merge for implementation packs)

- [ ] All mutations owner-scoped or admin-scoped per [authorization table](#authorization-table-proposed-endpoints)
- [ ] Idempotent confirm/reject/cancel covered by tests
- [ ] No `Transaction` / wallet balance updates when `walletMode=REQUEST_ONLY_NO_CHARGE`
- [ ] No Firebase / Tourism / Booking bridge calls
- [ ] Copy reviewed — no escrow/payment/guarantee language
- [ ] Audit events emitted on every successful transition
- [ ] Dangerous body fields rejected
- [ ] `CONFIRMED` and `COMPLETED` docs/strings do not imply settlement in v1
- [ ] Finance sign-off recorded if any wallet mode other than request-only is enabled

---

## Not implemented in this pack

| Item | Status |
|------|--------|
| This design document | **This pack only** |
| `POST …/confirm`, `…/reject`, `…/cancel`, `…/ops-cancel` | Not implemented |
| Expiry worker | Not implemented |
| `IN_PROGRESS` / `COMPLETED` endpoints | Not implemented |
| Inbox `actions` DTO | Not implemented |
| Audit table / logger wiring | Not implemented |
| Prisma / migration changes | **Forbidden** in this pack |
| Wallet / Firebase / Tourism / Home / logo / UI | **Untouched** |

---

## Related documents

- [VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md) — universe state machine and wallet modes  
- [VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md) — column semantics  
- [VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1.md](./VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1.md) — VIP must not use Local ACK ledger paths  

---

*End of document. Docs-only — no runtime behavior change.*
