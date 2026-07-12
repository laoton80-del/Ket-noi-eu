# VIONA Request Engine — Pack31: Financial Gateway & Escrow (Planning Packet)

**Document type:** Planning packet (docs-only — no implementation, no Prisma migration, no schema
change applied, no real money movement, no API calls, no deploy, no data mutation, no `.ts`/`.tsx`
file touched in this pack).
**Packet ID:** `CURSOR_PACK31_FINANCIAL_ESCROW_PLANNING_DOCS_ONLY`
**Operator phrase:** `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` — provided this session, unlocks
**planning only**, not implementation.
**Source master:** `1dd35c0` — PR #303 merged (Pack30D-4 Twilio Test-Credentials real-provider POC).
**Branch:** `docs/pack31-financial-escrow-planning`
**Status:** `pack31_financial_escrow_planning_only`
**Related:** `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md`,
`docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
§12/§17 (VIONA Master Economy & Monetization Architecture).

---

## 0.1 Terminology correction (applied retroactively to this document)

**Operator directive (this session, after this packet's original merge as PR #304):** the platform's
internal-currency brand name is now **"VIO Credits" (VIO)**, not "VIG". This document has been
edited in place to apply that correction:

- Every **generic/conceptual** reference to the currency ("VIG is EUR-pegged", "VIG closed-loop
  policy", "VIG fiat withdrawal", "VIG-only ledger movements", etc.) now reads **"VIO Credits
  (VIO)"**.
- The **new** table proposed in §4.1 (`VionaRequestEscrowHold`, not yet created by any migration
  until §8's future implementation) now uses **`estimatedAmountVIO`/`heldAmountVIO`/
  `settledAmountVIO`/`refundedAmountVIO`** field names — this table does not exist yet, so it can
  use the new naming with zero legacy risk.
- The **existing, live** `Wallet.balanceVIG` / `Wallet.lockedBalanceVIG` / `Transaction.amountVIG`
  Prisma fields, and the existing exported function names that reference them
  (`debitSpendableVigForAiGateway`, `calculateVigBurnForService`,
  `assertVigFiatWithdrawalForbidden`, `getWalletBalanceByUserId`, etc.), are **intentionally left
  unrenamed** below — renaming a live, shared column used by Tourism/AI-gateway/other verticals
  would require its own migration and is out of scope for a terminology-only correction. The future
  Pack31 implementation (§8) reads these legacy fields through one narrow adapter
  (`vionaWalletVioBalanceAdapter.ts`, added to the §8 allowlist) that maps them to a `VIO`-named
  interface at the boundary — so every new VionaRequest-facing type/variable name is `VIO`, while
  the underlying legacy column names stay `VIG`, unchanged, by design.

---

## 0. Why this packet now

Pack30D-4 (PR #303) proved the full audit-bound path to a real provider (Twilio Test Credentials)
end to end: flag-gated `executeReal()`, magic-numbers-only, unconditional audit-ledger binding.
That path currently has **no financial gate at all** — a future real (billable) provider call
could, in principle, run with no VIONA Credits check, no hold, and no settlement. The operator has
now ordered Pack31 to close that gap: **before any `executeReal()`-class call is ever allowed to
run against a real, billable provider, the caller's cost must be estimated, held (escrow-locked or
credit-debited), and only settled/refunded after the call's real outcome is known.** This packet
is **planning only** — it defines the flow, reuses/extends the schema (description only, no
migration run), designs a dev-only mock payment adapter, and lays out the test plan and file
allowlist for a **future, separate** implementation pack. It follows the same staged-rollout
discipline as every Pack29/30 pack before it: **plan first, implement only after a separate,
explicit review of this document.**

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack31 planning authorized | **YES** — this packet |
| Phrase `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` | **Required: YES \| Provided: YES (operator chat, this session) \| Recorded: YES — this document + evidence + Handoff** |
| Pack31 **implementation** authorized | **NO** — requires a **separate**, future implementation PR scoped to §8 below, with its own operator phrase |
| Prisma schema change / migration | **NO** — §4 is a description of a proposed future change only; `prisma/schema.prisma` is untouched by this packet |
| Real money movement (VIO Credits debit/credit, Stripe charge) | **NO** — this packet contains no code |
| `.ts`/`.tsx` file changes in this packet | **NO — zero, verified in §11 Drift Report** |

**This packet authorizes planning only.** It does not authorize implementation, any schema
migration, any wallet/ledger write, any Stripe call, or any change to `executeReal()`'s current
behavior.

---

## 2. Baseline — what already exists (critical discovery this session)

Before proposing anything new, this session searched the repo for existing financial primitives.
**The result changes the shape of this plan significantly: VIONA already has a mature, in-production
internal-currency wallet/ledger/escrow system.** Reusing it — rather than building a second,
competing one — is the single most important design decision in this packet.

| Existing primitive | File | What it already does |
| --- | --- | --- |
| `model Wallet` | `prisma/schema.prisma` | One row per `User` (`@unique` on `userId`). `balanceVIG` (spendable) + `lockedBalanceVIG` (held) — legacy Prisma field names, unchanged (§0.1). VIO Credits (VIO) is EUR-pegged 1:1 by policy. |
| `model Transaction` | `prisma/schema.prisma` | Append-style ledger row per wallet movement. `senderId`/`receiverId`, `amountVIG`, `feeAmount`, `type: TxType`, `status: TxStatus`, and a **`@unique idempotencyKey`** — the exact same idempotent-write pattern this repo's Pack30D-1 audit ledger later mirrored for a different table. |
| `enum TxType` | `prisma/schema.prisma` | Already includes `BOOKING_LOCK`, `ESCROW_LOCK`, `ESCROW_REFUND`, `PLATFORM_FEE`, `PENALTY_FEE`, `TOPUP`, `WITHDRAW`, `P2P`, `CHARITY_FEE`, `AI_LEGAL_SCAN`, `QR_MERCHANT`, `LESSON_REWARD` — **`ESCROW_LOCK`/`ESCROW_REFUND` are already generic, not tourism-specific.** |
| `enum TxStatus` | `prisma/schema.prisma` | `PENDING \| SUCCESS \| FAILED` |
| `model BrokerCommissionEscrow` | `prisma/schema.prisma` | A **different** escrow shape: broker-commission *clearance holding period* (`PENDING_CLEARANCE -> RELEASED/CANCELLED_*`), not a spend-hold. Not reused directly, but its `idempotencyKey @unique` + `status` + `clearAt` pattern is a useful precedent. |
| `debitSpendableVigForAiGateway()` | `src/services/WalletService.ts` | **This is the closest existing precedent to what Pack31 needs.** Atomic (`Prisma.$transaction`, `Serializable` isolation), idempotent (dedupes on `idempotencyKey`, returns the prior result instead of double-debiting), conditional (`updateMany` with `balanceVIG: { gte: amount }` — fails closed with `insufficient_funds` if the conditional update affects 0 rows, never a negative balance), and writes exactly one `Transaction` leg (`PLATFORM_FEE`) per debit. |
| `processTourismBookingHold()` / `confirmTourismHeldBookingAsMerchant()` / `cancelTourismHeldBooking()` | `src/services/WalletService.ts` | **A complete, already-shipped Hold -> Settle / Hold -> Refund pattern** for a different vertical (Tourism bookings): hold moves `balanceVIG -> lockedBalanceVIG` via a `BOOKING_LOCK` leg; settle finalizes and clears the lock; cancel writes an `ESCROW_REFUND` leg and decrements `lockedBalanceVIG` back. This is the **template** Pack31 reuses (§3), applied to `VionaRequest` instead of a tourism booking. |
| `creditWalletFromStripePaymentSucceeded()` | `src/services/WalletService.ts` | Real fiat top-up path, driven **only** by a verified `payment_intent.succeeded` Stripe webhook (never client input), idempotent via `ProcessedStripeEvent.stripeEventId @unique`. **Unchanged, not touched by this plan.** |
| `calculateVigBurnForService()` / VIO Credits closed-loop policy | `src/services/billing/VigTokenService.ts` (legacy filename/function names unchanged, §0.1) | VIO Credits is a **closed-loop** utility token: fiat purchase -> in-app burn only; `assertVigFiatWithdrawalForbidden()` blocks any cash-out path. **Pack31 must never introduce a withdrawal path for VionaRequest refunds — a refund returns VIO to `balanceVIG` (legacy field name, spendable in-app), never to fiat/Stripe.** |
| `VionaRequest` state machine (Pack25/29/30A/30B) | `src/domain/requests/vionaRequestStatusMachine.ts`, `vionaRequestStatusActionService.ts` | 9 states (`draft…failed`); no financial state today. `vionaRequestStatusActionService.ts` already has a durable audit-hook injection point (Pack30D-2, `appendVionaExecutionAuditEvent` called after every committed transition) — the template for how a future escrow hook would be wired in without touching the core transition logic. |
| Pack30D-4 `executeReal()` (Twilio Test Credentials POC) | `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` | **Has no financial gate today.** `executeVionaTwilioTestPocReal()` checks the feature flag and the magic-number-only intent, then calls the provider — it does **not** check any wallet balance, and does **not** hold or debit anything. This is the exact gap Pack31 closes (§5). |

### 2.1 Decision: reuse `Wallet` + `Transaction`, do **not** create a second wallet system

The operator's instruction suggested designing a new `VionaUserWallet` table. Given the discovery
above, this plan explicitly recommends **against** that: a second, parallel wallet per user would
create two independent sources of truth for "how much money does this user have" — precisely the
kind of double-ledger bug class that causes real financial loss (a request could be allowed to
spend from a `VionaUserWallet` balance that has no relationship to the real `Wallet.balanceVIG`
(the real VIO Credits balance, legacy field name) already enforced everywhere else in the app). **Every existing precedent in this repo (Pack30D-1's
reuse of `VionaRequestAuditEvent` instead of a new audit table; this session's own discovery) points
the same direction: reuse the single existing `Wallet`, extend narrowly.** See §4 for the one,
narrow, additive table this plan proposes instead of `VionaUserWallet`.

---

## 3. Flow design — Estimate → Hold → Execute → Settle/Refund

This is the exact 4-phase flow the operator specified, mapped onto the existing `VionaRequest`
lifecycle and the existing `Wallet`/`Transaction` primitives (§2), and gated in front of Pack30D's
`executeReal()`.

```text
 VionaRequest (existing status machine, UNCHANGED)          New: VionaRequestEscrowHold (§4)
 ───────────────────────────────────────────────────         ──────────────────────────────────
 triage / needsHumanConfirmation ... (existing states)

        │  caller requests an execution-plan preview
        │  (existing Pack30B route, UNCHANGED)
        ▼
 ┌─────────────────┐
 │ (1) ESTIMATE     │  Pure function — no DB write. Computes `estimatedAmountVIO` for the
 │                  │  requested action (e.g. one Twilio Test-Credentials SMS send has a
 │                  │  deterministic, tiny estimated cost in the real-money POC; a future
 │                  │  token-metered provider would estimate from a max-token ceiling).
 └────────┬─────────┘  Reuses the existing Pack30A `VionaExecutionPlan` — adds one new,
          │             optional field, `estimatedAmountVIO`, computed alongside the plan.
          ▼
 ┌─────────────────┐   Row created: status = 'held'
 │ (2) HOLD / LOCK  │──────────────────────────────────────▶ estimatedAmountVIO, heldAmountVIO,
 │                  │   Atomic, idempotent (mirrors           idempotencyKey, walletHoldTxId
 │                  │   `debitSpendableVigForAiGateway`):
 │                  │   `balanceVIG -gte-check-> decrement`,   Underlying `Transaction` leg:
 │                  │   `lockedBalanceVIG increment` (legacy   type = ESCROW_LOCK (existing
 │                  │   field names, §0.1), ONE `Transaction`   enum value, reused as-is)
 │                  │   row (`ESCROW_LOCK`).
 │                  │   Fails closed (`insufficient_funds`)
 │                  │   if `balanceVIG < estimatedAmountVIO`
 │                  │   — Pack31's core Zero-Loss gate (§5).
 └────────┬─────────┘
          │  hold succeeded (`ok: true`) — REQUIRED before the next step is ever reachable
          ▼
 ┌─────────────────┐
 │ (3) EXECUTE      │   The existing, unmodified Pack30D-4 `executeReal()` (or a future
 │  (Pack30D, UNCHANGED) provider's `executeReal()`) — called ONLY after (2) returns `ok: true`.
 └────────┬─────────┘   Still audit-bound exactly as today (Pack30D-1..4, unchanged).
          │  real outcome known: succeeded / failedBounded / blockedOperator / blockedPolicy
          ▼
 ┌─────────────────┐   Row updated: status = 'settled' | 'refunded' | 'partiallyRefunded'
 │ (4) SETTLE /     │──────────────────────────────────────▶ settledAmountVIO, refundedAmountVIO,
 │     REFUND       │   Atomic: `lockedBalanceVIG decrement`   settledAt
 │                  │   (legacy field name, §0.1) by
 │                  │   `heldAmountVIO`; if the real call      Underlying `Transaction` leg(s):
 │                  │   cost less than the hold (or failed/     - succeeded, cost == hold:
 │                  │   was blocked before any provider cost     one PLATFORM_FEE-equivalent
 │                  │   was incurred), the difference is         settle leg (existing type)
 │                  │   refunded back to `balanceVIG` via an    - failed/blocked before any
 │                  │   `ESCROW_REFUND` leg (existing enum       provider cost: 100% refund,
 │                  │   value, reused as-is) — VIO Credits        one ESCROW_REFUND leg
 │                  │   only ever returns to **spendable        - succeeded, cost < hold:
 │                  │   in-app balance**, never to fiat           one settle leg (actual cost)
 │                  │   (closed-loop policy, §2,                  + one ESCROW_REFUND leg
 │                  │   `VigTokenService.ts`, unchanged).          (the difference)
 └──────────────────┘
 ```

### 3.1 Mapping to `VionaRequest.status` — no change to the core enum

The core `VionaRequestStatus` enum (`draft…failed`, Pack25) is **not** modified. The escrow hold's
own lifecycle (`held -> settled | refunded | partiallyRefunded | failed`) lives entirely in the new,
additive `VionaRequestEscrowHold` row (§4) linked by `requestId` + `actionId`, mirroring exactly how
Pack30D-1's audit trail lives in a parallel table rather than as new `VionaRequestStatus` values.
This keeps the already-tested core state machine (Pack25/29/30A/30B regression suites) byte-for-byte
unchanged.

### 3.2 Where this hooks into existing code (future implementation only, not built here)

| Hook point | Existing file | Change (future, not this packet) |
| --- | --- | --- |
| Compute `estimatedAmountVIO` alongside the plan | `src/lib/viona/executionPlan/vionaExecutionPlanBuilder.ts` | Additive: one new, optional field on the existing `VionaExecutionPlan` type; no existing field removed or renamed |
| Hold before `executeReal()` | `src/services/viona/vionaExecutionPlanRouteService.ts` (`previewVionaExecutionPlanRealProviderPocRoute`, Pack30D-4) | Additive: call the new `holdVionaRequestExecutionCost()` function; only call `executeVionaTwilioTestPocReal()` if the hold returned `ok: true` — see §5 |
| Settle/refund after the real outcome | Same file, same function | Additive: call the new `settleVionaRequestExecutionHold()` after `executeVionaTwilioTestPocReal()` returns, passing its outcome |
| Audit trail of hold/settle/refund | `appendVionaExecutionAuditEvent()` (Pack30D-1, unmodified) | Reused as-is — new `eventType` values proposed in §4.3 |

**No change to `src/domain/requests/vionaRequestStatusMachine.ts` or `vionaRequestStatusActionService.ts`** — the escrow hold is orthogonal to the request's own status transitions, exactly as the audit trail was.

---

## 4. Schema — proposed change (description only; **no migration run, no `prisma/schema.prisma` diff in this packet**)

### 4.1 New model: `VionaRequestEscrowHold` (additive-only; replaces the operator's `VionaUserWallet`/`VionaEscrowTransaction` strawman per §2.1)

```prisma
// PROPOSED — illustrative only, NOT applied by this packet. No migration run.
// Field names use "VIO" (VIO Credits, §0.1) — this is a brand-new table, so it can adopt the
// corrected terminology directly with zero legacy risk.
model VionaRequestEscrowHold {
  id                   String    @id @default(uuid())
  requestId            String
  actionId             String
  userId               String
  /// Computed at (1) ESTIMATE — never written to after HOLD.
  estimatedAmountVIO   Float
  /// Written at (2) HOLD — the amount actually moved into `Wallet.lockedBalanceVIG` (legacy field name, §0.1).
  heldAmountVIO        Float
  /// Written at (4) SETTLE — the real, final cost (<= heldAmountVIO always; never negative).
  settledAmountVIO     Float?
  /// Written at (4) REFUND — heldAmountVIO - settledAmountVIO when settled, or heldAmountVIO in full
  /// if the call never reached the provider (blockedOperator/blockedPolicy after the hold).
  refundedAmountVIO    Float?
  status               VionaRequestEscrowHoldStatus @default(HELD)
  /// The `ESCROW_LOCK`-type `Transaction.id` created at (2) HOLD (existing `Transaction` table).
  holdTransactionId    String    @unique
  /// The `ESCROW_REFUND`-type `Transaction.id` created at (4), if any refund occurred.
  refundTransactionId  String?   @unique
  /// The settle-type `Transaction.id` created at (4), if the call actually incurred a real cost.
  settleTransactionId  String?   @unique
  /// Same idempotency contract as `Transaction.idempotencyKey` (Pack25-era pattern) — prevents a
  /// caller retry from double-holding for the same requestId+actionId.
  idempotencyKey       String    @unique
  createdAt            DateTime  @default(now())
  settledAt            DateTime?

  @@index([requestId, actionId])
  @@index([userId, status])
}

// PROPOSED — illustrative only, NOT applied by this packet.
enum VionaRequestEscrowHoldStatus {
  HELD
  SETTLED
  REFUNDED
  PARTIALLY_REFUNDED
  FAILED
}
```

**Why a new table instead of reusing `BrokerCommissionEscrow`:** that table's shape encodes a
*commission clearance* lifecycle (`PENDING_CLEARANCE` for ~7 days, then `RELEASED`) which is
semantically different from a *spend hold* that resolves within the lifetime of a single HTTP
request/execution attempt (seconds, not days). Reusing it would overload one status enum with two
unrelated meanings — a real, if subtle, risk of a future bug where a broker-clearance query
accidentally matches a request-hold row or vice versa. A new, narrowly-scoped table avoids that.

### 4.2 `Wallet` / `Transaction` — reused as-is, **zero schema change**

No field is added to `Wallet` or `Transaction`. The hold/settle/refund legs are ordinary
`Transaction` rows using the **existing** `TxType.ESCROW_LOCK` / `TxType.ESCROW_REFUND` values
(already in the enum today — confirmed §2) plus one proposed new value for the "real cost settled"
leg, to keep it distinguishable from Tourism's `PLATFORM_FEE` in ledger reporting:

```prisma
// PROPOSED addition to the EXISTING enum — illustrative only, NOT applied by this packet.
enum TxType {
  // ... all existing values unchanged (P2P, BOOKING, BOOKING_LOCK, TOPUP, WITHDRAW,
  //     CHARITY_FEE, ESCROW_LOCK, ESCROW_REFUND, PENALTY_FEE, AI_LEGAL_SCAN, LESSON_REWARD,
  //     PLATFORM_FEE, QR_MERCHANT, and any broker-commission value already present) ...
  VIONA_REQUEST_EXECUTION_SETTLED // NEW — the real-cost settle leg for a VionaRequest execution hold
}
```

If a future implementation pack decides `PLATFORM_FEE` is precise enough for the settle leg (it is
already used for the analogous AI-gateway debit, §2), this one new enum value can be dropped
entirely — it is proposed, not required, and is called out explicitly as optional in §8.

### 4.3 Audit event types — reuse `appendVionaExecutionAuditEvent`, propose 3 new `eventType` values

```prisma
// PROPOSED additions to the EXISTING vionaRequestAuditEventTypes array
// (src/domain/requests/vionaRequestAuditEventTypes.ts) — illustrative only, NOT applied by this packet.
'escrowHoldPlaced'
'escrowSettled'
'escrowRefunded'
```

No schema change is needed for this — `vionaRequestAuditEventTypes` is a plain TypeScript
`as const` array (Pack30D-1), not a Prisma enum; adding values to it is a `.ts` change, deferred to
the future implementation pack (§8), not this docs-only packet.

---

## 5. Zero-Loss compliance — the mandatory ordering gate

This is the operator's explicit, non-negotiable requirement, and it is designed as a **structural**
gate, not a convention callers must remember to follow:

1. The future `holdVionaRequestExecutionCost()` function (mirroring `debitSpendableVigForAiGateway`'s
   exact atomicity contract, §2) is the **only** function that increments `Wallet.lockedBalanceVIG`
   for a VionaRequest execution. It **must** return `ok: true` with a `holdId` before any caller is
   permitted to invoke `executeVionaTwilioTestPocReal()` (or any future real-provider `executeReal()`).
2. In the future implementation pack, `previewVionaExecutionPlanRealProviderPocRoute()` (Pack30D-4,
   the only current caller of `executeReal()`) is modified so that the hold call is placed
   **immediately before** the `executeVionaTwilioTestPocReal()` call, and the function returns
   early — **never reaching `executeReal()`** — if the hold fails for any reason (`insufficient_funds`,
   `concurrency_conflict`, or any other typed failure). This mirrors the exact control-flow shape
   `executeReal()` itself already uses for its own feature-flag check (Pack30D-4 §4.3: "checked
   inside `executeReal()`, as its first statement... never falls through by accident").
3. **Fail-closed, not fail-open:** exactly like `debitSpendableVigForAiGateway`'s conditional
   `updateMany` (`balanceVIG: { gte: amount }`, §2), any ambiguous or errored hold attempt is
   treated as "hold did not happen" — it can never be treated as "assume the hold succeeded and
   proceed anyway."
4. **Idempotent, not double-charged:** a retried request with the same `idempotencyKey` returns the
   **existing** hold's result rather than placing a second hold — mirroring the exact dedup branch
   already in `debitSpendableVigForAiGateway`.
5. **Refund-only reversal — never a new debit:** if `executeReal()` fails, is blocked, or costs less
   than estimated, the difference moves back to `balanceVIG` (legacy field name, §0.1) via an
   `ESCROW_REFUND` leg — VIO Credits is never re-debited from a user for the same
   `(requestId, actionId)` outside of a brand-new, distinct hold with its own idempotency key.

This gate is what makes "call a real, billable provider" and "the user's VIONA Credits/Escrow can
go negative or be silently skipped" **structurally impossible** in the future implementation,
mirroring exactly how Pack30D-4's feature flag makes "call a real provider outside sandbox" and
"call a real provider in production" structurally impossible today.

---

## 6. Dummy Payment Adapter (Mock Stripe) — dev/test environment only

**Important clarification, grounded in §2:** VIO Credits debits/holds/refunds for a `VionaRequest`
execution are **internal ledger movements** against the existing `Wallet`/`Transaction` tables —
they do **not** call Stripe at all, in dev or in production (exactly like the existing
`debitSpendableVigForAiGateway` AI-gateway debit, which never touches Stripe). Stripe is only
involved on the **fiat top-up** side (`creditWalletFromStripePaymentSucceeded`, driven by a real
webhook) — unrelated to, and unmodified by, this plan.

The "Mock Stripe" the operator asked for is therefore scoped narrowly to the one legitimate dev/test
gap: **a developer or CI test needs a wallet with a non-zero `balanceVIG` to exercise the hold flow,
without needing a real Stripe test-mode checkout for every test run.** The proposed adapter is a
**pure, deterministic, dev/test-only top-up simulator** — never wired to any real HTTP route,
mirroring the exact shape of the Pack30A mock execution adapter (no network, no real provider, an
explicit safety-flag object):

```ts
// PROPOSED shape — illustrative only, NOT implemented by this packet.
// Function/type names use "VIO Credits" (VIO) naming (§0.1) — this is a brand-new function, so it
// adopts the corrected terminology directly.
export const VIONA_MOCK_PAYMENT_ADAPTER_SAFETY = {
  providerCalled: false,
  stripeCalled: false,
  realMoneyMoved: false,
  devTestOnly: true,
} as const;

export type VionaMockPaymentTopUpInput = Readonly<{ userId: string; amountVIO: number }>;

// Simulates exactly what `creditWalletFromStripePaymentSucceeded` does for a REAL webhook, but
// without any Stripe call — writes directly to `Wallet.balanceVIG` (legacy field name, §0.1) + one
// `Transaction` (`TOPUP`) row, tagged with a `mock_topup_` idempotency-key prefix so it can never
// be mistaken for a real Stripe-verified top-up in a ledger audit.
export declare function simulateVioCreditsMockTopUp(
  input: VionaMockPaymentTopUpInput,
): Promise<Readonly<{ ok: true; newBalanceVIO: number } | { ok: false; reason: string }>>;
```

**Hard-blocked outside dev/test, by design (future implementation, not this packet):** this
function must refuse to run (throw) unless `NODE_ENV !== 'production'` **and** an explicit
dev/test opt-in env var (e.g. `PACK31_MOCK_PAYMENT_ADAPTER_ENABLED=true`) is set — mirroring the
exact `isRealProviderExecutionEnabled()` production-hard-block pattern from Pack30D-4, applied in
the opposite direction (this flag gates a *convenience* path, not a *real* one, but the same
"never in production, fail closed" discipline applies).

---

## 7. Required test plan — future implementation pack (not run in this packet)

| # | Test case | Category | Expected outcome |
| --- | --- | --- | --- |
| 1 | Sufficient balance, valid estimate | Happy path | Hold succeeds; `lockedBalanceVIG` (legacy field name, §0.1) increases by exactly `estimatedAmountVIO`; one `ESCROW_LOCK` `Transaction` row created |
| 2 | Insufficient balance | Zero-Loss gate | Hold fails closed with `insufficient_funds`; `executeReal()` is **never called** (verified by a spy that throws if invoked); `Wallet` unchanged |
| 3 | Hold succeeds, `executeReal()` succeeds at the estimated cost | Happy path settle | Lock fully converted to a settle leg; `lockedBalanceVIG` returns to pre-hold value; no refund leg created |
| 4 | Hold succeeds, `executeReal()` succeeds at **less** than the estimated cost | Partial refund | One settle leg (actual cost) + one `ESCROW_REFUND` leg (the difference); `balanceVIG` increases by exactly the difference; `lockedBalanceVIG` fully cleared |
| 5 | Hold succeeds, `executeReal()` returns `blockedOperator`/`blockedPolicy`/`failedBounded` (no real cost incurred) | Full refund | 100% refund via one `ESCROW_REFUND` leg; `balanceVIG` restored to pre-hold value |
| 6 | Idempotent retry — same `(requestId, actionId, idempotencyKey)` called twice before settlement | Idempotency | Second call returns the **existing** hold's id/result; **zero** additional `Wallet` mutation |
| 7 | Concurrent hold attempts for the same user, different requests, at the balance boundary | Race condition | Exactly one hold succeeds if only one estimate fits the remaining `balanceVIG`; the other fails closed with `insufficient_funds` — never both succeeding and over-drafting (`Serializable` isolation + conditional `updateMany`, mirroring `debitSpendableVigForAiGateway`) |
| 8 | Simulated DB error during hold | Fail-closed | No partial state: either the hold row + `Transaction` + `Wallet` decrement all commit together, or none do (single `$transaction`) |
| 9 | Simulated DB error during settle/refund | Fail-closed, non-blocking to the already-known real outcome | The real provider outcome (already returned by `executeReal()`) is never lost or altered; a settle/refund failure is logged and flagged for reconciliation, never silently dropped |
| 10 | Mock payment adapter (§6) invoked with `NODE_ENV=production` | Hard block | Throws immediately; zero `Wallet` mutation |
| 11 | Mock payment adapter invoked without the dev/test opt-in flag | Hard block | Throws immediately; zero `Wallet` mutation |
| 12 | Source-scan: no `fetch`/`axios`/Stripe SDK call anywhere in the new hold/settle/refund functions | Credential/side-effect isolation | Confirms VIO Credits movements never call Stripe (§6) |
| 13 | Existing Pack25/29/30A/30B/30D-1/30D-2/30D-3/30D-4 regression scripts | Regression | **PASS** unchanged |
| 14 | `tsc --noEmit` / `npm run lint` | Quality gate | **PASS**, 0 errors |

---

## 8. Exact file allowlist — Pack31 implementation (future increment only, **NOT built in this packet**)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PLANNING PACKET`
**Precondition:** This planning packet merged and post-merge verified; a **separate**, explicit
operator phrase for implementation (not yet requested or provided).

| # | Path | Change type | Purpose |
| --- | --- | --- | --- |
| 1 | `prisma/schema.prisma` | **MIGRATE (additive)** | Add `model VionaRequestEscrowHold` + `enum VionaRequestEscrowHoldStatus` per §4.1; optionally add one `TxType` value per §4.2 (may be dropped in favor of reusing `PLATFORM_FEE`) |
| 2 | `src/services/viona/vionaRequestEscrowHoldService.ts` | **NEW** | `holdVionaRequestExecutionCost()`, `settleVionaRequestExecutionHold()`, `refundVionaRequestExecutionHold()` — atomic, idempotent, mirroring `debitSpendableVigForAiGateway`'s exact contract (§5) |
| 3 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | **MODIFY (additive)** | Add `escrowHoldPlaced`/`escrowSettled`/`escrowRefunded` per §4.3 |
| 4 | `src/services/viona/vionaExecutionPlanRouteService.ts` | **MODIFY (narrow)** | Insert the hold call before, and the settle/refund call after, the existing `executeVionaTwilioTestPocReal()` call in `previewVionaExecutionPlanRealProviderPocRoute()` — the **only** touch point into Pack30D-4's code |
| 5 | `src/lib/viona/mockPaymentAdapter/vionaMockPaymentAdapter.ts` | **NEW** | `simulateVioCreditsMockTopUp()` per §6, dev/test-only, hard-blocked in production |
| 6 | `scripts/test-viona-pack31-financial-escrow.ts` | **NEW** | 14 test cases per §7 |
| 7 | `docs/design/evidence/cursor-pack31-financial-escrow-implementation/README.md` | **NEW** | Evidence doc for that future implementation PR |
| 8 | `src/services/viona/vionaWalletVioBalanceAdapter.ts` | **NEW (added at implementation time, not in the original §8 list)** | The one, narrow "read a legacy `Wallet` row, map it to a `VIO`-named interface" boundary function required by the operator's terminology-correction Adapter Pattern instruction (§0.1) — item 2's service imports this instead of reading `Wallet.balanceVIG`/`lockedBalanceVIG` inline |

**No other files may be touched.** In particular: **no changes** to `Wallet`/`Transaction` model
fields (only new rows, via existing fields), `src/services/WalletService.ts`'s existing exported
functions (all reused as-is, none modified), any frontend/UI file, `src/routes/vionaRoutes.ts` /
`src/controllers/VionaRequestController.ts` (mirroring Pack30D-4's own choice to keep the
real-provider path service-layer-only, not yet wired to any HTTP route), or any live Stripe
credential.

| Area | Allowed in the future Pack31 implementation pack |
| --- | --- |
| New Prisma model + enum (additive migration) | **YES** — the one, narrow addition in §4.1 |
| Modification of `Wallet`/`Transaction` model **fields** | **NO** |
| Real Stripe call from the new hold/settle/refund code | **NO — NEVER** (§6) |
| Real Twilio/other real-provider call | **NO** — reuses Pack30D-4's existing, unmodified `executeReal()` |
| New HTTP route | **NO** — service-layer only, matching Pack30D-4 |
| VIO Credits fiat withdrawal / cash-out path | **NO — FORBIDDEN**, closed-loop policy unchanged (§2) |
| Production real-money movement | **NO** — this plan only ever describes VIO Credits (internal, closed-loop) ledger movements, never a live card charge |

---

## 9. Staged rollout ladder (Pack31, new — mirrors the Pack30D discipline)

| Step | Pack | Authorizes | Real money movement |
| --- | --- | --- | --- |
| 1 | Pack31 planning (**THIS PACKET**) | Flow design, schema proposal (description only), mock adapter design, file allowlist, test plan | **NO — planning only** |
| 2 | Pack31 Kernel/Handoff sync | Docs-only record on master | NO |
| 3 | Pack31 implementation (future, separate PR, exact allowlist in §8, own operator phrase) | `VionaRequestEscrowHold` table (migration), hold/settle/refund functions, wired in front of Pack30D-4's `executeReal()` | **NO real Stripe/card call** — VIO Credits-only internal ledger movements, using the existing, already-live `Wallet`/`Transaction` tables |
| 4 | Pack31 staging QA (future, separate pack) | Verify insufficient-funds/race-condition/idempotency behavior against a staging DB | VIO Credits-only, same as step 3 |
| 5 | Production readiness review for real-provider spend (separate legal/ops/finance review, per `VIONA_OPERATING_PROTOCOL.md` §1.1/§2/§3, and per Pack30D's own §10 step 9/8) | The only step that could ever authorize a **live, billable** real-provider call to run behind this gate | Only after this step, if separately authorized — **not proposed or scheduled by this packet** |

---

## 10. Non-goals / forbidden scope (this packet)

| Forbidden category | Status |
| --- | --- |
| Prisma migration / schema change applied | **FORBIDDEN in this packet** — §4 is description only |
| Real Stripe / card charge | **FORBIDDEN** |
| Real Twilio/other real-provider call | **FORBIDDEN** — unchanged from Pack30D-4 |
| VIO Credits fiat withdrawal / cash-out | **FORBIDDEN — always**, per closed-loop policy |
| `Wallet`/`Transaction` write of any kind | **FORBIDDEN in this packet** |
| `VionaRequest.status` mutation | **FORBIDDEN** |
| New HTTP route | **FORBIDDEN in this packet** |
| Frontend/UI change | **FORBIDDEN in this packet** |
| Production | **FORBIDDEN** |
| Secrets printed | **FORBIDDEN** |
| `.ts`/`.tsx` file change **in this packet** | **FORBIDDEN** — verified empty in §11 |

---

## 11. Drift Report (this packet)

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** (verified: `git diff --name-only` against `origin/master` for this branch contains only the files listed in §13) |
| `prisma/schema.prisma` diff | **EMPTY** — §4 is illustrative Prisma syntax inside a markdown code block, not an applied schema change |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| `Wallet` / `Transaction` write | **NONE** |
| Real provider / Stripe network code | **NONE** |
| Secrets printed | **NONE** |
| Real execution / real money movement enabled | **NO** |
| Production authorized | **NO** |

---

## 12. Explicit NO / YES assertions (this packet)

| Assertion | Value |
| --- | --- |
| Planning / design document written | **YES** |
| Existing `Wallet`/`Transaction`/escrow infrastructure discovered and reused (not duplicated) | **YES — §2** |
| `VionaUserWallet` (operator's strawman) proposed as a new table | **NO — explicitly recommended against, §2.1** |
| New, narrow linking table (`VionaRequestEscrowHold`) proposed | **YES — §4.1, description only** |
| Zero-Loss ordering gate (hold before `executeReal()`) designed | **YES — §5** |
| Dev/test-only mock payment adapter designed | **YES — §6** |
| Test plan for future implementation | **YES — §7, 14 cases** |
| Exact file allowlist for future implementation | **YES — §8** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Prisma migration run | **NO** |
| Real Stripe/Twilio call made | **NO** |
| `Wallet`/`Transaction` row written | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Phrase `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` provided and recorded | **YES** |
| Phrase authorizes implementation directly | **NO — planning only, per §1 and this ladder (§9)** |

---

## 13. Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` (this document) |
| Created | `docs/design/evidence/cursor-pack31-financial-escrow-planning-packet/README.md` |

**No other file is touched by this packet.**

---

## 14. Recommended next step

1. **Open PR** for this planning packet — docs-only; exactly the two files in §13.
2. **Merge and post-merge verify.**
3. **Docs-only Kernel/Handoff sync** — separate pack; record this planning packet on the canonical
   Kernel file (`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`).
4. Only then prepare a **separate Pack31 implementation pack** with exactly the file allowlist in
   §8, the test plan in §7, and its own, distinct operator phrase — implementing
   `VionaRequestEscrowHold` and the hold/settle/refund functions, wired in front of Pack30D-4's
   existing `executeReal()`, using **VIO Credits-only internal ledger movements** against the
   existing `Wallet`/`Transaction` tables — never a real Stripe/card charge.
5. **Do not implement any part of §4/§6/§8 from this packet.** Do not run any Prisma migration
   from this packet.

Real execution against live providers remains **BLOCKED** (Pack30D-4's production hard-block,
unchanged). Production remains **NOT AUTHORIZED**. PR chain **#251 → #303** preserved.

Evidence (planning packet, PR #304): `docs/design/evidence/cursor-pack31-financial-escrow-planning-packet/README.md`

---

## 15. Terminology correction + implementation record (this session, after PR #304 merged)

This section is added retroactively, in the same PR that applies the §0.1 terminology correction.

| Field | Value |
| --- | --- |
| Terminology correction (§0.1) | Applied — "VIG" → "VIO Credits (VIO)" for every new/generic reference in this document; legacy `Wallet`/`Transaction` field names left unrenamed |
| Phrase `APPROVE_PACK31_FINANCIAL_ESCROW_IMPLEMENTATION` | **Required: YES \| Provided: YES — this session, in the same message that ordered the terminology correction \| Recorded: YES — this document + evidence + Handoff.** Correction of record: the operator's message referred to this phrase as "already given" (`đã giao trước đó`); no earlier message in this chat contained it — only `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` (§1) had been given before. It is recorded here as provided **in this session**, not earlier, for an accurate audit trail. |
| Pack31 implementation | Proceeded in the same branch/PR as the terminology fix, per explicit operator order (§0.1 + this section) — see the implementation evidence README at `docs/design/evidence/cursor-pack31-financial-escrow-implementation/README.md` for the full file list, deviations, and test results |
| §9 step 2 ("Pack31 Kernel/Handoff sync") | Not yet done — remains a future, separate docs-only pack |
| Real Stripe / real Twilio (billable) call enabled by this implementation | **NO — still unchanged.** This implementation only adds VIO Credits hold/settle/refund around the existing Pack30D-4 Twilio **Test-Credentials** POC; no billable provider call exists in this repo |
| Production | **Still NOT AUTHORIZED** |
