# VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.1

**Document ID:** `VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1`  
**Type:** Architecture / wallet isolation policy (docs only — **no** runtime change in this pack)  
**Branch:** `pack-af57-wallet-firebase-vip-isolation-policy`  
**Base master:** `97a75fb` — `fix(wallet): merge public ledger terms clarity`  
**Date:** 2026-05-19  

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Wallet Ledger Source of Truth Audit](../audit/VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md), [Wallet Public Copy Ledger Terms Audit](../audit/VIONA_WALLET_PUBLIC_COPY_LEDGER_TERMS_AUDIT_1.md), [Local Merchant Request Source of Truth Audit](../audit/VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Request Schema Design](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md), [Local Merchant ACK State Machine Design](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md).

**Code anchors (reference only):** `functions/src/index.ts` (`walletOps`), `src/state/wallet.ts`, `src/screens/b2c/LocalScreen.tsx` (VIP), `src/services/WalletService.ts`, `prisma/schema.prisma` (`Wallet`, `Transaction`, `LocalServiceRequest`).

---

## Summary

VIONA currently operates **two independent spendable ledgers** for the same persona: **Firebase Firestore** (`walletOps` → `wallets/{firebaseUid}.credits`) and **Prisma Postgres** (`Wallet.balanceVIG` / `lockedBalanceVIG` + `Transaction`). Without an explicit isolation policy, product and engineering can accidentally treat both as one balance, implement **commercial hold/debit** on the wrong rail, or describe **classifieds VIP** as escrow or merchant settlement.

This policy **isolates Firebase `walletOps` and classifieds VIP** from **Prisma commercial wallet flows** until a future migration or compatibility pack is designed, audited, and finance-approved. **Prisma `Wallet` + `Transaction` is the only approved commercial ledger** for tourism settlement, Local service requests (future), legal scan, legacy booking locks, and merchant/provider payout semantics. **Classifieds VIP remains a separate paid listing-boost rail** — not a booking, not escrow, not `LocalServiceRequest`, not provider settlement.

**Why now:** Local `LocalServiceRequest` schema is on master with safe defaults (`REQUEST_ONLY_NO_CHARGE`, `walletPhase = NONE`), but **DB migration is not applied** on reachable dev/staging, **no Local request/ACK APIs** exist, and **dual SoT** remains unresolved. Opening Local wallet hold/debit before this policy is accepted would violate zero-loss and operating-protocol money rules.

---

## Current baseline

From [Wallet Ledger SoT Audit](../audit/VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md) @ master `97a75fb`:

| Area | Today |
|------|--------|
| **Firebase `walletOps`** | Drives **most B2C display** (`useWalletState`, `syncWalletFromServer`) and **burns**: classifieds VIP (`reserveAndCommitCredits`), Leona/LeTan trusted charge, interpreter/HocTap, cosmetics, client top-up path. Ledger: Firestore wallet doc + subcollections (`verifiedTopups`, `holds`, `verifiedCharges`, …). |
| **Prisma `Wallet` + `Transaction`** | Drives **commercial server paths**: tourism book/hold/confirm/cancel/complete/ops-cancel (`WalletService.ts`), legal scan debit, legacy `Booking` lock/cancel/QR complete, REST `GET /api/wallet/balance`, P2P `transferVIG`, Stripe webhook credit. |
| **Home overlay** | `HomeScreen` may call `fetchBalance()` → `applyRestApiVigBalance`, writing **Prisma** balance into the same client `credits` field used for **Firebase** — last-writer split-brain. |
| **Classifieds VIP** | `LocalScreen` debits **Firebase** (120 VIO Credits typical) via `reserve`+`commit`; listing lives in **device React state only** — no server listing row, no merchant ACK, no reversal wired on post failure after commit. |
| **Top-up drift** | Client `topupCreditsServer` vs `walletOps` `packId`/`idempotencyKey` contract mismatch; Stripe may credit **Prisma** while Platform Pay credits **Firebase**. |
| **Tourism** | Hold path exists when `TOURISM_SETTLEMENT_MODE=hold`; default env remains `legacy_settle_on_book`. Reference pattern for Local **design only**. |
| **Local schema** | `LocalServiceRequest` + `LocalWalletMode` on master; **`FIREBASE_VIP_ISOLATED` is not a row enum value** — VIP stays outside the table by design. |

**Risk if unaddressed:** User spends Firebase credits on VIP while tourism debits Prisma; merchant/commercial copy implies hold/settlement; finance cannot reconcile; Local commercial pilot blocked by trust and ledger integrity failures.

---

## Policy decision

| Rail | Role | Status |
|------|------|--------|
| **Prisma `Wallet` + `Transaction`** | **Commercial ledger source-of-truth** — hold, debit, release, settle, refund policy, provider/treasury effects, reconciliation | **Required** for all new commercial flows |
| **Firebase `walletOps`** | **Legacy / client feature rail** — may continue for non-commercial or explicitly labeled pilot features until migrated | **Isolated** — not commercial SoT |
| **Classifieds VIP** | **Paid listing boost** — Firebase debit, device-only listing preview | **Isolated** — not commercial booking ledger |
| **`LocalServiceRequest`** | Durable Local commercial **request** row (status, ACK, wallet policy fields) | **No bridge** from Firebase VIP without future compatibility pack |
| **KNG Rewards / VIO Points** | Loyalty — AsyncStorage, non-withdrawable | **Out of scope** for commercial ledger |

**Explicit non-decisions (this pack):**

- Does **not** migrate Firebase balances to Prisma (future pack).
- Does **not** implement a reconciliation job (future pack).
- Does **not** enable Local wallet hold/debit.
- Does **not** add `FIREBASE_VIP_ISOLATED` to `LocalServiceRequest` rows.

---

## Classifieds VIP isolation rules

Classifieds VIP (`LocalScreen` → `reserveAndCommitCredits` → Firestore) is governed as **promotion / placement**, not commerce settlement.

| Rule | Requirement |
|------|-------------|
| **Product definition** | VIP is a **listing boost** (featured placement in app preview). |
| **Not escrow** | VIP must never be described or modeled as funds held for a counterparty until fulfillment. |
| **Not booking deposit** | VIP does not create a booking, reservation, or merchant obligation to perform a service. |
| **Not merchant-held funds** | No merchant wallet lock, no `lockedBalanceVIG`, no provider settlement from VIP. |
| **No merchant ACK** | VIP success does not imply merchant accepted, confirmed, or dispatched. |
| **No `LocalServiceRequest`** | VIP posts **must not** create or update `LocalServiceRequest` rows. Schema design excludes `FIREBASE_VIP_ISOLATED` on that model. |
| **No provider settlement** | No `providerSettledAt`, treasury split, or tourism-style confirm/settle from VIP. |
| **Not held balance (commercial)** | Firebase `holds` subcollection is **Firebase-internal**; must not be reported as Prisma `lockedBalanceVIG` or tourism “held VIO Credits” in merchant inbox. |
| **Reversal** | `rollback` op exists on Firebase but is **not** wired to VIP post failure after commit on Local today. Any future reversal must be a **dedicated VIP migration pack** with idempotency — not Local cancel/release API. |
| **Listing SoT** | Device-only listing state is **demo/preview** until a separate `ClassifiedListing` (or equivalent) server model exists. |
| **Copy** | Public copy: “VIP boost”, “paid listing placement” — per [Public Copy Ledger Terms Audit](../audit/VIONA_WALLET_PUBLIC_COPY_LEDGER_TERMS_AUDIT_1.md) and post-fix `localHub.vipPostSuccessVipBody`. |

**Allowed:** Debit Firebase credits for boost **only** while rail remains isolated and copy-safe.

**Forbidden:** Connecting VIP debit to `LocalServiceRequest.walletMode`, tourism hold semantics, or Prisma `BOOKING_LOCK` without finance + architecture sign-off and a new pack.

---

## Firebase walletOps restrictions

| # | Restriction |
|---|-------------|
| F1 | **No new commercial hold/debit/settle flows** may be implemented on `walletOps` after this policy merge. |
| F2 | **Existing Firebase burns** (VIP, trusted service, interpreter, HocTap, cosmetics) may remain **only** if labeled non-commercial or pilot in copy and not presented as the same balance used for tourism/Local commercial checkout without a compatibility layer. |
| F3 | **No dual spendable balance** in UX: do not show one “VIO Credits” number that merges Firebase + Prisma without an approved read model (see compatibility options). |
| F4 | **Top-up / credit grants** must not expand on Firebase for commercial pilot until contract alignment (`packId`, `idempotencyKey`, receipt gate) and finance agree on single credit rail. |
| F5 | **Migration** Firebase → Prisma (or reverse) requires: ledger audit, backfill plan, idempotency keys, reconciliation report, rollback plan, **finance sign-off**. |
| F6 | **Identity:** Firebase `uid` ↔ Prisma `User.id` mapping must be explicit in any bridge; never assume equality. |
| F7 | **App Check / auth** on `walletOps` remain mandatory in production; isolation does not relax security. |
| F8 | **D8 doc drift:** `docs/D8_RUNTIME_SENSITIVE_MONEY_PATHS.md` stating walletOps as sole ledger authoritative is **stale** — update in a docs hygiene pack, not by re-expanding Firebase commercial scope. |

**Legacy/demo features** (Leona minute charges, academy unlocks) may stay on Firebase temporarily with **preview/demo** labeling; they must not block Prisma commercial roadmap.

---

## Prisma commercial ledger rules

All **commercial** debit, lock, release, and settle behavior must use `src/services/WalletService.ts` (server-only) and persist **`Transaction`** rows.

| # | Rule |
|---|------|
| P1 | **Single write path** per commercial action: Serializable or conditional `updateMany` patterns already used for tourism — reuse for Local when enabled. |
| P2 | **Idempotency** — client or server idempotency key per debit/hold; duplicate requests must not double-charge. |
| P3 | **Reversal / release** — every hold path must have a documented cancel/release (tourism: `cancelTourismHeldBooking`; Local: future cancel API per state machine design). |
| P4 | **Status + source row** — wallet movement must tie to `TourismBooking`, `Booking`, or `LocalServiceRequest` (future), not device-only state. |
| P5 | **Finance reconciliation** — `Transaction` `TxType`, amounts, timestamps, and booking/request ids must be exportable; treasury user via `VIGLOBAL_TREASURY_USER_ID` where applicable. |
| P6 | **Defaults for Local** — new `LocalServiceRequest` rows: `walletMode = REQUEST_ONLY_NO_CHARGE`, `walletPhase = NONE` until finance enables hold pilot. |
| P7 | **No Firebase VIP bridge** — Prisma commercial APIs must not read Firestore `credits` as spendable for Local merchant confirm/settle. |
| P8 | **Public errors** — user-visible messages say **VIO Credits**, not VIG (see copy fix @ `97a75fb`). |

**Local hold gate (wallet):** Local wallet hold/debit **blocked** until LocalServiceRequest runtime create, merchant inbox/ACK, cancel/release APIs exist **and** this policy is merged **and** finance signs off on `VIONA.LOCAL.WALLET_HOLD_POLICY.1`.

---

## Compatibility options

### Option 1 — Keep Firebase isolated permanently (VIP + legacy features)

| | |
|--|--|
| **Benefits** | Lowest migration risk; VIP stays simple burn; no dual-write. |
| **Risks** | Permanent split-brain for users using both rails; reconciliation manual. |
| **Safeguards** | Separate UI labels or sub-balances; VIP/boost disclaimers; no commercial hold on Firebase. |
| **When allowed** | **Default** until product chooses migration (recommended through Local request-only phase). |

### Option 2 — Migrate Firebase balances to Prisma

| | |
|--|--|
| **Benefits** | One spendable SoT; unified top-up; finance-friendly. |
| **Risks** | Data loss if backfill wrong; downtime; idempotency collisions with existing Firestore history. |
| **Safeguards** | Read-only shadow period; dual-write with reconciliation; cutover flag; rollback. |
| **When allowed** | Only after dedicated **`VIONA.WALLET.FIREBASE_TO_PRISMA_MIGRATION.1`** (or successor) with finance sign-off. |

### Option 3 — Bridge: read-only display merge

| | |
|--|--|
| **Benefits** | Better UX single number; tourism/legal still Prisma-authoritative for debit. |
| **Risks** | Users assume one pool; display sum ≠ debit capacity if only Prisma debited. |
| **Safeguards** | Show breakdown (“In-app wallet” vs “Promotions / legacy”); commercial checkout uses Prisma check only. |
| **When allowed** | Pilot with CPO + Payments approval; **not** sufficient for Local hold alone. |

### Option 4 — Hybrid + reconciliation job

| | |
|--|--|
| **Benefits** | Gradual migration; alerts on divergence. |
| **Risks** | Job complexity; false positives; ops burden. |
| **Safeguards** | Threshold alerts; nightly diff Firestore vs Prisma per linked uid; block commercial pilot on drift. |
| **When allowed** | During migration window only; not permanent architecture. |

**Policy recommendation:** **Option 1** for classifieds VIP through Local request-only pilot; plan **Option 2 or 4** as explicit later packs — never implicit merge.

---

## Local gate

| Gate | Status @ `97a75fb` |
|------|-------------------|
| `LocalServiceRequest` migration `20260520120000_add_local_service_request` | **Not applied** (dev/staging DB unreachable) |
| Firebase VIP isolation policy | **This document** — merge required |
| `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1` | **Blocked** until migration applied |
| Merchant inbox / ACK API | **Not implemented** |
| Cancel / release API | **Not implemented** |
| Prisma wallet policy for Local hold | **Not implemented** |
| Finance sign-off for Local hold | **Required** before `LOCAL.WALLET_HOLD_POLICY` |
| Firebase VIP accepted as isolated | **After this policy merges** |

**Permitted next (after migration + policy merge):** Local request create with **`REQUEST_ONLY_NO_CHARGE`** — durable row, **no** Prisma hold, **no** Firebase VIP bridge.

**Forbidden until all gates above:** `HOLD_ON_SUBMIT`, `SETTLE_ON_CONFIRM`, merchant settlement copy implying VIP or Firebase held funds, production Local commercial pilot.

---

## Copy and UI policy

Aligned with [Public Copy Ledger Terms Audit](../audit/VIONA_WALLET_PUBLIC_COPY_LEDGER_TERMS_AUDIT_1.md) and fix @ `496f55b`:

| Topic | Policy |
|-------|--------|
| VIP | **“VIP boost” / “paid listing placement”** only; disclaim not deposit / merchant-held funds. |
| Escrow / deposit | **Forbidden** on VIP and request-preview flows unless hold API + copy pack explicitly enable. |
| Cash-out / withdraw | **Forbidden** on consumer paths except admin/demo labeled preview. |
| Spendable credits | **“VIO Credits”** in user-facing copy. |
| Loyalty | **“VIO Points”** only when clearly non-withdrawable rewards. |
| Internal | **VIG** field names in schema/API JSON may remain; user strings must not say VIG. |
| Merchant inbox | Human-readable wallet phase labels — not raw `HELD`/`SETTLED` enums. |
| Tourism checkout | Conditional debit copy in `checkout.quoteLegal` — not unconditional “wallet will be debited”. |

New Firebase or VIP UI must pass `scripts/test-wallet-public-copy-ledger-terms.ts` (or successor) before pilot.

---

## Recommended implementation sequence

| Order | Pack / ops | Purpose |
|-------|------------|---------|
| 1 | **Merge this policy** (`VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.MERGE.1`) | Lock isolation rules |
| 2 | Fix dev/staging `DATABASE_URL`; `prisma migrate deploy` | Apply `LocalServiceRequest` table |
| 3 | `VIONA.LOCAL.REQUEST_CREATE_SOURCE_OF_TRUTH.1` | Durable requests; **request-only / no charge** |
| 4 | `VIONA.LOCAL.MERCHANT_INBOX_API.1` | Merchant list/review |
| 5 | `VIONA.LOCAL.CONFIRM_REJECT_CANCEL_API.1` | ACK + release policy (Prisma when wallet enabled) |
| 6 | `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Hold/settle **only** after finance sign-off |
| 7 | Optional `VIONA.WALLET.FIREBASE_TO_PRISMA_MIGRATION.1` or display bridge pack | Unify rails if product chooses |

**Do not reorder** 6 before 1–5 and migration.

---

## Blockers

| Blocker | Owner / note |
|---------|----------------|
| Local migration not applied | Ops — Supabase `ENOTFOUND` on last apply attempt |
| Firebase / Prisma dual SoT | Resolved by **policy**; technical unification still open |
| Local commercial debit / hold | **Blocked** until sequence above |
| Tourism production hold | Separate — staging access, `TOURISM_SETTLEMENT_MODE=hold`, finance |
| Top-up contract mismatch | Payments — align client `walletOps` body before scaling Firebase top-up |
| Classifieds server listing SoT | Product — separate from wallet isolation |

---

## Sign-off matrix (future behavior packs)

| Pack | Payments & Ledger | Finance | CPO / Trust | Architect |
|------|-------------------|---------|-------------|-----------|
| Local request-only create | Inform | Inform | Approve copy | Approve |
| Local wallet hold | **Required** | **Required** | Approve copy | Approve |
| Firebase → Prisma migration | **Required** | **Required** | Approve UX | Approve |

---

## Cross-reference index

| Document | Use |
|----------|-----|
| `VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md` | Technical dual-ledger inventory |
| `VIONA_WALLET_PUBLIC_COPY_LEDGER_TERMS_AUDIT_1.md` | Copy risk register |
| `VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md` | `LocalWalletMode` defaults; no VIP on row |
| `VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md` | ACK before settle |
| `functions/WALLET_MIGRATION.md`, `functions/RECEIPT_TRUTH.md` | Firebase contracts |

---

## Document completion checklist

- [x] Summary and rationale for isolation  
- [x] Current baseline from SoT audit  
- [x] Policy decision (Prisma commercial / Firebase legacy / VIP isolated)  
- [x] Classifieds VIP rules  
- [x] Firebase walletOps restrictions  
- [x] Prisma commercial ledger rules  
- [x] Compatibility options compared  
- [x] Local gate and blockers  
- [x] Copy/UI policy  
- [x] Implementation sequence  
- [x] No runtime/schema/API/UI changes in this branch  
