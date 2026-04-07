# D8 — Runtime-sensitive money paths (canonical commercial context)

**Contract:** `normalizeCountryCodeOrSentinel` → `resolveCommercialCountryContext` (see `src/config/countryPacks/index.ts`).  
All **display fiat**, **Stripe merchant country**, and **payment-service metadata** in these paths must derive from that object (or from helpers that use it internally: `getComboPricesByCountry`, `resolveDisplayCurrencyForCountry`, `pricingTierForUsageDebits`).

## Inventory (client)

| Path | Role | D8 usage |
|------|------|----------|
| `src/screens/ComboWalletScreen.tsx` | Top-up UI, Stripe sheet | `commercialCtx` for intent, merchant, checkout currency |
| `src/components/PremiumCheckoutSheet.tsx` | Apple/Google Pay | `merchantCountryCode` from parent; fallback → `resolveCommercialCountryContext(undefined)` |
| `src/services/PaymentsService.ts` | Intent body, verify top-up, call/booking quotes | `createPlatformPayIntent` optional D8 fields; `verifyTopupCreditEntitlement` normalizes `country`; `calculateCallCreditPrice` / `calculateLeTanBookingPrice` use `resolveCountryPack` via `normalizeCountry` |
| `src/state/wallet.ts` | `walletOps` HTTP | No country in body (server uses auth uid only) |
| `src/screens/TienIchScreen.tsx` | Utility tier cards | `normalizeCountryCodeOrSentinel(user?.country)` + `getComboPricesByCountry` |
| `src/screens/LeonaCallScreen.tsx` | `chargeTrustedService` amount | `calculateCallCreditPrice(normalizeCountryCodeOrSentinel(user?.country))` |
| `src/screens/LeTanScreen.tsx` | `chargeTrustedService` amount | `calculateLeTanBookingPrice(normalizeCountryCodeOrSentinel(user?.country))` |
| `src/context/AuthContext.tsx` | Profile `country` | Persisted as normalized sentinel / tier from `resolveCountryPack` |

## Server (reference)

| Path | Role |
|------|------|
| `functions/src/index.ts` | `walletOps` topup / charge / reserve — ledger authoritative |
| `functions/src/payments/paymentReceiptModel.ts` | Receipt doc shape when strict mode on |

## Non-goals (Wave 1)

- Full repo-wide replacement of every `resolveCountryPack` call (e.g. SOS, travel) — not money surfaces.
- Pricing/package unification (Wave 3).
