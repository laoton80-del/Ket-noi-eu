# Evidence — Pack31 Financial Gateway & Escrow (planning packet)

**Packet ID:** `CURSOR_PACK31_FINANCIAL_ESCROW_PLANNING_DOCS_ONLY`
**Operator phrase:** `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` — provided this session, planning only.
**Source master:** `1dd35c0` — PR #303 merged (Pack30D-4 Twilio Test-Credentials real-provider POC).
**Branch:** `docs/pack31-financial-escrow-planning`.
**Plan document:** `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md`.

---

## 1. What this packet is

A **docs-only** planning packet for Pack31 — the financial gate that will sit in front of every
future real-provider `executeReal()` call (Pack30D), ensuring VIONA Credits/Escrow is checked and
held **before** any billable action runs, and settled/refunded after the real outcome is known.
Zero code was written. Zero migration was run.

## 2. Key discovery this session — reuse, don't duplicate

Before drafting the plan, this session searched `prisma/schema.prisma` and `src/services/**` for
existing financial primitives. The operator's instruction suggested a new `VionaUserWallet` +
`VionaEscrowTransaction` pair. The search found:

- `model Wallet` (per-user, `balanceVIG`/`lockedBalanceVIG`) — **already exists and is live.**
- `model Transaction` (ledger, `TxType`/`TxStatus`, `idempotencyKey @unique`) — **already exists.**
- `TxType.ESCROW_LOCK` / `TxType.ESCROW_REFUND` — **already generic, already in the enum.**
- `debitSpendableVigForAiGateway()` (`src/services/WalletService.ts`) — an atomic,
  Serializable-isolation, idempotent, fail-closed debit function for AI-gateway usage — the exact
  contract Pack31's future hold function should mirror.
- `processTourismBookingHold()` / `confirmTourismHeldBookingAsMerchant()` /
  `cancelTourismHeldBooking()` — a **complete, already-shipped** Hold → Settle / Hold → Refund
  pattern for a different vertical (Tourism), which is the direct template for Pack31's flow (§3
  of the plan).
- `VigTokenService.ts` — VIG is a **closed-loop** token (fiat → VIG → burn only; no cash-out path).

**Consequence:** the plan explicitly recommends **against** the operator's `VionaUserWallet`
strawman (§2.1 of the plan document) — a second wallet per user would create two competing
sources of truth for balance, a real financial-risk anti-pattern. Instead, the plan proposes
**exactly one new, narrow, additive table**, `VionaRequestEscrowHold`, that **links** a
`VionaRequest` to the existing `Wallet`/`Transaction` primitives, rather than reimplementing them.
This mirrors the precedent Pack30D-1 set by reusing the existing `VionaRequestAuditEvent` table
instead of inventing a new audit table.

## 3. Deliverables

| File | Type |
| --- | --- |
| `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md` | NEW — the plan itself (14 sections: authorization state, baseline/discovery, flow design, schema proposal, Zero-Loss gate design, mock payment adapter design, 14-case test plan, file allowlist, staged rollout ladder, non-goals, Drift Report, YES/NO assertions, files changed, next step) |
| `docs/design/evidence/cursor-pack31-financial-escrow-planning-packet/README.md` | NEW — this document |

## 4. Design highlights

- **Flow:** `(1) Estimate -> (2) Hold/Lock -> (3) Execute (Pack30D, unchanged) -> (4) Settle/Refund`
  — exactly the 4-phase flow the operator specified, mapped onto `VionaRequest` via a new, parallel
  `VionaRequestEscrowHold` row (not a modification of the core `VionaRequestStatus` enum).
- **Zero-Loss gate:** the future hold function must return `ok: true` **before** any caller may
  invoke `executeReal()`; fails closed on insufficient funds, DB error, or ambiguity; idempotent on
  retry; refund-only reversal (never a silent re-debit).
- **Schema:** one new model (`VionaRequestEscrowHold`) + one new status enum, proposed as
  illustrative Prisma syntax inside the markdown document only — **not applied**, no migration run.
  `Wallet`/`Transaction` fields are **not** modified.
- **Mock Payment Adapter:** scoped narrowly to dev/test wallet top-up simulation (VIG debits/holds
  never call Stripe at all, in dev or prod — confirmed by the existing `debitSpendableVigForAiGateway`
  precedent) — hard-blocked in production, mirroring Pack30D-4's feature-flag discipline.
- **File allowlist (§8 of the plan):** 7 files for a future, separate implementation pack — not
  built in this packet.
- **Test plan (§7 of the plan):** 14 cases covering happy path, insufficient funds, partial/full
  refund, idempotent retry, race conditions, DB-error fail-closed behavior, mock-adapter production
  hard-block, and full regression.

## 5. Drift Report (this packet)

```text
git diff --name-only origin/master -- '*.ts' '*.tsx'   -> (empty)
git diff --stat prisma/schema.prisma                     -> (empty)
git diff --stat .env* package.json package-lock.json     -> (empty)
```

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** |
| `prisma/schema.prisma` diff | **EMPTY** |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| `Wallet` / `Transaction` write | **NONE** |
| Real provider / Stripe network code | **NONE** |
| Secrets printed | **NONE** |

## 6. Explicit NO / YES assertions

| Assertion | Value |
| --- | --- |
| Planning document written | **YES** |
| Existing Wallet/Transaction/escrow infra discovered and reused | **YES** |
| New competing wallet table (`VionaUserWallet`) proposed | **NO — explicitly recommended against** |
| Prisma migration run | **NO** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Real Stripe/Twilio call made | **NO** |
| Production authorized | **NO** |
| Phrase `APPROVE_PACK31_FINANCIAL_ESCROW_PLANNING` provided and recorded | **YES** |
| Phrase authorizes implementation directly | **NO — planning only** |

---

Real execution and real money movement remain **BLOCKED**. Production remains **NOT AUTHORIZED**.
Next step: merge + post-merge verify, then a Kernel/Handoff sync, then (separately, with its own
operator phrase) a Pack31 implementation pack.
