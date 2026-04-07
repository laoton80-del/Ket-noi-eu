# Payment receipt → wallet top-up (webhook-authoritative model)

**EU pilot default:** receipt env flags are **off** until a signature-verified webhook writes `platform_payment_receipts/*` in that environment.

This document describes the **trusted** path for granting Credits after a provider captures payment. It is the reference for enabling strict receipt mode without changing client product flows beyond server responses.

## Collections and documents

| Piece | Path | Purpose |
|--------|------|---------|
| Receipt (webhook-owned) | `platform_payment_receipts/{paymentEventId}` | Provider-verified record that money was captured; **must** be written only from a signature-verified HTTPS webhook (or trusted admin). |
| Wallet | `wallets/{firebaseUid}` | Current `credits` / `lifetimeSpent`. |
| Idempotency ledger | `wallets/{firebaseUid}/verifiedTopups/{paymentEventId}` | Ensures each `paymentEventId` applies **at most once** after a successful top-up. |

`paymentEventId` must be the same string the client sends to `walletOps` `op: 'topup'` (e.g. Stripe PaymentIntent id or checkout idempotency key). Slashes are normalized to `_` on the server.

## Sequence (strict receipt optional)

1. **Checkout** — Client completes payment with the provider; client holds `paymentEventId` and intended credit amount.
2. **Webhook (trusted)** — HTTPS function verifies the provider signature, then **writes** `platform_payment_receipts/{paymentEventId}` with at least:
   - `status: 'paid'`
   - `provider`: `'stripe'` | `'unknown'`
   - Optionally `walletUid`, `creditsToGrant`, `amountMinor`, etc. (see `paymentReceiptModel.ts`).
3. **Client** — After local payment confirmation, client calls **`walletOps`** with `Authorization: Bearer <Firebase ID token>` and body:
   - `op: 'topup'`
   - `paymentEventId`
   - `amount` (credits to add; must match receipt when enforcement flags require it).
4. **Server** — `receiptAllowsTopup` runs **only if** `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1`:
   - Rejects with **409** if receipt missing, not `paid`, wallet mismatch, or amount/credits rules fail.
5. **Transaction** — If allowed, Firestore transaction increments `wallets/{uid}.credits` and creates `verifiedTopups/{paymentEventId}` with `status: 'applied'`. Duplicates return `{ ok: true, duplicate: true }` without double-crediting.

When `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` is **unset** (default pilot), step 4 is skipped: behavior remains client-driven verify + `verifiedTopups` idempotency only.

## Environment flags (Cloud Functions)

| Variable | Effect |
|----------|--------|
| `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` | Require a Firestore receipt doc in `paid` state before applying top-up. |
| `WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID=1` | Receipt must include non-empty `walletUid` matching the authenticated user. |
| `WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT=1` | Receipt must include numeric `creditsToGrant` &gt; 0 and it must equal the `amount` in the top-up request. |

Recommended **strong** external pilot combo: set all three **together** with a deployed, signature-verified payment webhook that writes receipts.

### Quick enable (copy-paste env block)

Set on the **`walletOps`** Cloud Function (or project-wide if you centralize env):

```bash
WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1
WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID=1
WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT=1
```

Rollback pilot: remove or set to `0` / unset the first variable; the other two are ignored when receipt mode is off.

### Staging verification checklist (safe enable)

1. Point a **staging** client at staging `walletOps` only (separate `EXPO_PUBLIC_BACKEND_API_BASE` if used).
2. Implement or run the **payment webhook** on staging that writes `platform_payment_receipts/{paymentEventId}` with `status: 'paid'`, matching `walletUid` / `creditsToGrant` you will send in `topup`.
3. Enable **`WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1`** on that function revision.
4. Call `topup` **without** a receipt → expect **409** `payment_receipt_missing`.
5. Write receipt, call `topup` with matching `amount` → **200** `{ ok: true }`; repeat → **200** `{ ok: true, duplicate: true }` and balance unchanged on duplicate.
6. Optionally enable **`WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID=1`** and **`WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT=1`** and repeat negative tests (wrong uid, wrong credits).

Production pilot should keep receipt flags **off** until the same webhook path is production-signed and monitored.

## aiProxy (related trust)

`aiProxy` requires a valid Firebase **ID token** by default (`AI_PROXY_REQUIRE_AUTH` unset or non-`0`). Local emulator may set `AI_PROXY_REQUIRE_AUTH=0`. See `index.ts` and `aiProxyValidation.ts` for payload and size limits.
