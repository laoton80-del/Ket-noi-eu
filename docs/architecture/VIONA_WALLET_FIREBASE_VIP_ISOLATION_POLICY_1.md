# VIONA.WALLET.FIREBASE_VIP_ISOLATION_POLICY.1

**Document ID:** `VIONA_WALLET_FIREBASE_VIP_ISOLATION_POLICY_1`
**Type:** Architecture / wallet isolation policy (docs only â€” **no** runtime change in this pack)
**Branch:** `pack-af55-wallet-firebase-vip-isolation-policy`
**Base master:** `1c11084` â€” `Merge branch 'pack-local-rate-limit-abuse-guard-1'`
**Date:** 2026-05-20

**Governing law:** [VIONA Operating Protocol](../ai-context/VIONA_OPERATING_PROTOCOL.md), [Wallet Ledger Source of Truth Audit](../audit/VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Merchant Request Source of Truth Audit](../audit/VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md), [Local Request Schema Design](./VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md), [Local Merchant ACK State Machine Design](./VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md).

**Code anchors (reference only):** `functions/src/index.ts` (`walletOps`), `src/state/wallet.ts`, `src/screens/b2c/LocalScreen.tsx` (VIP), `src/services/WalletService.ts`, `src/services/local/*`, `prisma/schema.prisma` (`Wallet`, `Transaction`, `LocalServiceRequest`).

---

## Summary

- **Firebase `walletOps` + classifieds VIP** is an **isolated legacy / B2C burn rail** â€” promotional listing visibility and non-commercial micro-charges, not commercial settlement.
- **Prisma `Wallet` + `Transaction`** is the **commercial ledger source of truth** for tourism hold/settle, legal scan, legacy booking, REST balance, Stripe webhook credit, and **future** Local commercial hold only on the Prisma path.
- **`LocalServiceRequest` must not reuse VIP semantics** â€” no Firebase VIP debit may create, advance, or settle a Local request row; defaults remain `REQUEST_ONLY_NO_CHARGE` and `walletPhase = NONE` until finance approves a Prisma hold pack.

---

## Current risks

| Risk | Detail @ `1c11084` |
|------|---------------------|
| **Dual spendable balance** | Firestore `wallets/{firebaseUid}.credits` vs Prisma `Wallet.balanceVIG` with no reconciliation job. |
| **VIP debit without durable request row** | `LocalScreen` â†’ `reserveAndCommitCredits` (Firebase); listing remains device React state â€” **no** `LocalServiceRequest`, **no** merchant ACK. |
| **User could misread VIP as paid service / escrow** | One-phase Firebase commit; copy must not imply hold, refund, or merchant confirmation. |
| **Home balance overlay split-brain** | `HomeScreen` `fetchBalance()` â†’ `applyRestApiVigBalance` may overwrite Firebase `credits` in the same Zustand store. |
| **Firebase and Prisma top-up rails mismatch** | Client `{ op: 'topup', amount, paymentEventId }` vs server `packId` + `idempotencyKey`; Stripe may credit Prisma while Platform Pay credits Firebase. |
| **Local runtime vs wallet** | Local lifecycle APIs (create, inbox, confirm/reject/cancel, audit, timeline, rate limit) ship on master in **request-only / no charge** mode â€” **wallet hold still unsafe** while dual SoT persists. |

---

## Policy rules

| # | Rule |
|---|------|
| R1 | VIP burn may only mean **promotional listing visibility** (featured placement / boost). |
| R2 | VIP burn must **not** imply merchant ACK, provider assignment, or service fulfillment obligation. |
| R3 | VIP burn must **not** imply **escrow**, **refundable hold**, or funds held for a counterparty. |
| R4 | VIP burn must **not** imply **provider/merchant settlement**, treasury split, or `providerSettledAt`. |
| R5 | VIP burn must **not** unlock `LocalServiceRequest.walletPhase` beyond **`NONE`** unless a **Prisma** ledger path is used under finance-approved hold policy. |
| R6 | `LocalServiceRequest.walletMode` must remain **`REQUEST_ONLY_NO_CHARGE`** (or explicit future Prisma hold mode) â€” **never** driven by Firebase VIP success. |
| R7 | Commercial debit, lock, release, and settle require **`WalletService.ts`** + **`Transaction`** rows tied to a durable commercial row (`TourismBooking`, `Booking`, or `LocalServiceRequest`). |
| R8 | No new commercial hold/debit/settle flows on `walletOps` after this policy merges. |

---

## Allowed Firebase walletOps scope

| Use case | Allowed when |
|----------|----------------|
| **Legacy B2C display** | `syncWalletFromServer` / `useWalletState` â€” must not be presented as the same spendable pool used for Prisma commercial checkout without an approved read model. |
| **Non-commercial demo/burn** | Leona/LeTan trusted charge, interpreter/HocTap, cosmetics â€” **honest preview/demo** copy only. |
| **Classifieds VIP promotion only** | `reserve` + `commit` on Firebase for listing boost; idempotency key per post attempt; **isolated** from `LocalServiceRequest` and Prisma `BOOKING_LOCK`. |
| **Firebase-internal holds** | Firestore `holds` subcollection for VIP pipeline â€” **not** reportable as Prisma `lockedBalanceVIG` or tourism â€śheld VIO Creditsâ€ť. |
| **Client top-up (interim)** | Only with aligned `packId` / `idempotencyKey` contract and finance awareness â€” not a substitute for Prisma commercial credit rail. |

---

## Forbidden coupling

Explicitly **forbidden** (no exception without dedicated compatibility pack + finance sign-off):

| Forbidden link | Reason |
|----------------|--------|
| Firebase VIP â†’ `LocalServiceRequest` row create/update | VIP is not a commercial request. |
| Firebase VIP â†’ `LocalWalletMode.HOLD_ON_SUBMIT` / `SETTLE_ON_CONFIRM` | Hold/settle is Prisma-only. |
| Firebase VIP â†’ `walletPhase` â‰  `NONE` on Local rows | Ledger phase follows Prisma policy only. |
| Firebase VIP â†’ `providerSettledAt` / merchant settlement fields | No provider payout from VIP burn. |
| Firebase VIP â†’ merchant **confirmed** / **assigned** status | No ACK semantics on VIP. |
| Firebase VIP â†’ escrow / refund / release copy or APIs | One-phase burn; not tourism cancel/release. |
| Firebase VIP â†’ Prisma `Transaction` write without compatibility pack | No silent dual-write. |
| Firebase VIP â†’ **Local commercial pilot readiness** | Dual SoT and listing SoT gaps block pilot claims. |
| VIP success â†’ Prisma wallet debit for â€śsameâ€ť purchase | Zero-loss requires single commercial write path. |

---

## Required copy rules

### Use (VIP / Firebase B2C rail)

- â€śPromote listingâ€ť
- â€śVIP visibilityâ€ť
- â€śVIP boostâ€ť / â€śpaid listing placementâ€ť
- â€śB2C credit useâ€ť (when rail is labeled legacy / in-app wallet)
- â€śVIO Creditsâ€ť for user-facing spendable display (per `vioDisplayConfig`)

### Do not use (VIP / request preview / Firebase burns)

- paid booking
- escrow
- deposit
- refundable hold
- provider paid / merchant paid
- merchant confirmed
- guaranteed lead
- funds held until merchant accepts
- settlement / payout (for VIP)

**Internal:** Prisma/API field names may remain `*VIG`; user-visible strings must not say â€śVIGâ€ť as the product name.

---

## Future compatibility layer requirements

Before Firebase and Prisma spendable balances are unified for commercial flows, a dedicated pack must deliver:

| Requirement | Detail |
|-------------|--------|
| **Identity map** | Explicit Firebase `uid` â†” Prisma `User.id` â€” never assume equality. |
| **Reconciliation design** | One-way sync, two-way sync, or read-only merge â€” with drift thresholds and alerts. |
| **Idempotency** | Shared idempotency keys across rails for top-up and migration backfill. |
| **Balance conflict resolution** | Authoritative debit source for commercial checkout; display vs spendable rules documented. |
| **Historical import policy** | Firestore `verifiedTopups` / `holds` â†’ Prisma `Transaction` backfill rules and cutover. |
| **Finance sign-off** | Required before any dual-write or display-merge pilot. |
| **Rollback plan** | Feature flag cutover; restore prior rail ownership on failure. |
| **User-facing balance truth** | Single number vs split (â€śCommercial walletâ€ť vs â€śPromotions walletâ€ť) â€” CPO decision, not engineering default. |

**Policy default until then:** **Option 1 â€” keep Firebase isolated** for VIP and legacy burns; **Prisma canonical** for all commercial settlement.

---

## Local wallet gate

Local wallet **hold / debit / settle** remains **blocked** until **all** gates pass:

| Gate | Status @ `1c11084` |
|------|---------------------|
| `LocalServiceRequest` migration applied on reachable dev/staging DB | **Ops** â€” verify `prisma migrate deploy` / `migrate status` on target env |
| Local request create API verified on DB | **Shipped** â€” `POST /api/local/requests`; `REQUEST_ONLY_NO_CHARGE` |
| Merchant inbox + confirm/reject + user/ops cancel APIs verified | **Shipped** â€” Prisma status only; no wallet side effects in request-only mode |
| Audit + timeline + rate limit | **Shipped** â€” read-only / guard only; no wallet mutation |
| **Prisma `Wallet`/`Transaction` chosen for Local holds** | **Not met for hold pilot** â€” policy requires Prisma path only |
| **Firebase VIP isolation policy merged** | **This document** |
| **Finance sign-off** | **Required** before `VIONA.LOCAL.WALLET_HOLD_POLICY.1` |

**Allowed now:** request-only Local commercial flow, Firebase VIP boost (isolated), tourism Prisma paths per env, docs and eligibility scripts.

**Forbidden now:** `HOLD_ON_SUBMIT` / `SETTLE_ON_CONFIRM` on Local, Firebase VIP bridge to `LocalServiceRequest`, production claims that VIP or Firebase holds fund merchant settlement.

---

## Recommended implementation sequence

| Order | Pack / ops | Purpose |
|-------|------------|---------|
| 1 | **Merge this policy** | Lock Firebase VIP â†” Prisma commercial isolation |
| 2 | Audit public copy if still incomplete | `VIONA.WALLET.PUBLIC_COPY_LEDGER_TERMS_AUDIT.1` / fixes on master |
| 3 | Fix dev/staging `DATABASE_URL`; apply Local migrations | `20260520120000_add_local_service_request` (+ audit tables if pending) |
| 4 | Verify Local request lifecycle against DB | Integration scripts: create, inbox, confirm/reject/cancel, audit, timeline, rate limit |
| 5 | **Only then** design `VIONA.LOCAL.WALLET_HOLD_POLICY.1` | Prisma hold/settle for Local â€” **finance sign-off** |
| 6 | Optional `VIONA.WALLET.FIREBASE_TO_PRISMA_MIGRATION.1` | Unify rails if product chooses â€” not implicit |

**Do not** open Local wallet hold before steps 1â€“4 and explicit finance approval.

---

## Cross-reference index

| Document | Use |
|----------|-----|
| `VIONA_WALLET_LEDGER_SOURCE_OF_TRUTH_AUDIT_1.md` | Dual-ledger inventory and flow table |
| `VIONA_LOCAL_MERCHANT_REQUEST_SOURCE_OF_TRUTH_AUDIT_1.md` | Local flows, VIP vs Prisma booking |
| `VIONA_LOCAL_REQUEST_SCHEMA_DESIGN_1.md` | `LocalWalletMode` defaults; VIP excluded from row semantics |
| `VIONA_LOCAL_MERCHANT_ACK_STATE_MACHINE_DESIGN_1.md` | ACK before settle |
| `functions/WALLET_MIGRATION.md`, `functions/RECEIPT_TRUTH.md` | Firebase `walletOps` contracts |

---

## Document completion checklist (this pack)

- [x] Summary â€” Firebase VIP isolated; Prisma commercial SoT; Local must not reuse VIP semantics
- [x] Current risks â€” dual balance, VIP without request row, copy, Home overlay, top-up drift
- [x] Policy rules â€” promotion-only VIP; no escrow/settlement/ACK on VIP
- [x] Allowed Firebase walletOps scope
- [x] Forbidden coupling table
- [x] Required copy rules (use / do not use)
- [x] Future compatibility layer requirements
- [x] Local wallet gate updated for master `1c11084`
- [x] Recommended implementation sequence
- [x] No runtime/schema/API/UI/locale changes in this branch
