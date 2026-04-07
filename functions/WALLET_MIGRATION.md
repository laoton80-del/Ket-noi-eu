# Wallet document ID migration (phone → Firebase `uid`)

## What changed

- **Before:** `walletOps` accepted `userId` in the JSON body (often the user’s phone string). Firestore paths looked like `wallets/{phone}`.
- **After:** The caller must send `Authorization: Bearer <Firebase ID token>`. The server derives the wallet key **only** from `verifyIdToken(...).uid` (anonymous Auth on device). Paths are `wallets/{firebaseUid}`.
- **Payload hardening:** Any request body that still includes a `userId` field is rejected with **400** and error `userId_in_body_not_allowed`.

## Why

Prevents clients from impersonating another user’s wallet. Phone or arbitrary strings must never select the ledger document.

## Migrating existing Firestore data

1. Enable **Anonymous** sign-in in Firebase Authentication (if not already).
2. For each affected user, obtain their **Firebase Auth UID** (e.g. Auth export, or support flow after they open the app once).
3. If a legacy doc `wallets/{oldPhoneOrClientId}` exists and the new doc `wallets/{firebaseUid}` is missing or empty, copy fields (`credits`, `lifetimeSpent`, subcollections such as `holds` if any) into `wallets/{firebaseUid}` in a **controlled** maintenance window.
4. Optionally archive or delete legacy docs after verification.

## Logging

Successful `walletOps` requests emit a structured log line: `[walletOps] request` with `firebaseUid` and `op` for audit and debugging.

---

## Phase 2 — top-up idempotency & trusted monetized charges

### `op: topup` (breaking)

- **Required body:** `paymentEventId` (immutable string aligned with payment backend: same value as checkout idempotency key / Stripe PaymentIntent id after verify).
- **Ledger:** `wallets/{uid}/verifiedTopups/{paymentEventId}` — second request with the same id returns `200` with `{ ok: true, duplicate: true }` and **does not** add credits again.
- **Client:** Must only call `topup` **after** `pollTopupCreditEntitlement` (or equivalent) succeeds, passing that id as `paymentEventId`.

### `op: chargeTrustedService`

- **Body:** `amount`, `idempotencyKey`, `serviceKind` ∈ `leona_outbound` | `letan_booking`.
- **Ledger:** `wallets/{uid}/trustedServiceCharges/{idempotencyKey}` — at-most-once debit; Leona / LeTan pilot flows use this instead of client-side reserve+commit so UI success follows **server** acceptance only.

### Webhook payment receipts (optional precondition)

- Schema: `functions/src/payments/paymentReceiptModel.ts` → collection `platform_payment_receipts/{paymentEventId}`.
- Full sequence: **`functions/RECEIPT_TRUTH.md`**.
- Enable strict mode: **`WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1`** (409 if no `paid` receipt). Tighten further with **`WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID=1`** and **`WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT=1`**.
- When unset (default pilot), behavior is unchanged: client verify + `verifiedTopups` idempotency only.
