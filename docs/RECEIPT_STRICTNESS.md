# Wallet top-up / receipt strictness (Wave 1 D10)

Server-authoritative Credits remain in `wallets/{firebaseUid}` via `walletOps` (`functions/src/index.ts`). **No `userId` in body** — the authenticated Firebase **ID token** subject is the only wallet owner for top-up.

## Truth split (client vs server)

| Step | Meaning |
|------|---------|
| Payments service `verify` / poll (`src/services/PaymentsService.ts`) | **Entitlement**: payment path says the user *may* receive this top-up. **Not** the same as Credits already on the ledger. |
| `walletOps` `op: 'topup'` | **Applied**: transaction grants Credits once per `paymentEventId` (idempotent `verifiedTopups`). |

## Cloud Function env (explicit per environment)

| Variable | When `1` | Default |
|----------|----------|---------|
| `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` | Require existing `platform_payment_receipts/{paymentEventId}` with `status: 'paid'` before applying Credits | unset → **not** required |
| `WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID` | Receipt must include `walletUid` matching caller when present | unset |
| `WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT` | Receipt must set `creditsToGrant` exactly equal to top-up `amount` | unset |

Firestore shape: `functions/src/payments/paymentReceiptModel.ts`.

## Staging order (migration-safe)

1. Deploy **signature-verified** webhook that writes `platform_payment_receipts/{paymentEventId}` as `paid` with metadata aligned to checkout.
2. Turn on `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1` on a **staging** `walletOps` URL first.
3. Confirm **409** + `payment_receipt_*` errors when receipt missing; confirm idempotent replay returns `duplicate: true`.

Production: enable strict flags only when the webhook path is live for that deployment.

## Verifiable evidence (Wave 1 W1-04)

| Step | Command | Expected |
|------|---------|----------|
| HTTP probe / duplicate | `TRUST_SMOKE_BACKEND_BASE=... TRUST_SMOKE_ID_TOKEN=... [TRUST_SMOKE_APP_CHECK=...] npm run verify:receipt` | JSON evidence lines on stdout; exit `0` (strict OFF path) or `2` (strict ON — missing receipt proven; finish with `seeded-flow`) |
| Missing-only | `... npm run verify:receipt -- missing-only` | `409` + `payment_receipt_*` when strict ON |
| Seed receipt (Admin) | `npm run receipt:seed --prefix functions -- <paymentEventId> <firebaseUid> [credits]` | Requires ADC / `GOOGLE_APPLICATION_CREDENTIALS` |
| Full strict path | See `docs/WAVE1_CLOSURE_EVIDENCE.md` (`seeded-flow`) | `OK: seeded receipt → topup → duplicate` |

**Staging only:** top-up probes mutate wallet balances.
