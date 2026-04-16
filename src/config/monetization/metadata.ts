import type { MonetizationCanonicalDisplayCurrency } from './types';

/**
 * **Not the live wallet checkout spine.** See `docs/COMMERCIAL_SPINE_LIVE.md` and `src/config/commercialSpine.ts`.
 *
 * **Migration-phase lock (before consumer migration):** band A/B/C list integers in this package are canonical
 * **display** list-price **base amounts in CZK** (major units). They are **not** EUR; do not infer EUR from older
 * blueprint wording outside this module.
 *
 * This metadata is display / product-contract documentation only. It does **not** alter `walletOps`, receipts,
 * ledger, top-up, server-authoritative debits, or `PaymentsService` behavior.
 */
export const MONETIZATION_CANONICAL_DISPLAY_CURRENCY: MonetizationCanonicalDisplayCurrency = 'CZK';

/**
 * Explicit semantics per table. Currency is never implicit: each row repeats `displayCurrencyCode` where relevant.
 *
 * Guardrails (unchanged):
 * - No coupling to wallet, receipt, or Credits debit math from this layer alone.
 * - Pay-per-case remains **display-only** until a later phase explicitly wires UI and any new debit rules.
 */
export const MONETIZATION_TABLE_METADATA = {
  b2cPackListPrices: {
    displayCurrencyCode: 'CZK' as const satisfies MonetizationCanonicalDisplayCurrency,
    amountUnit: 'major' as const,
    meaning:
      'Canonical display list-price base amounts in CZK per band (Starter→Power); enterprise is custom/null. Not the active checkout spine until consumers migrate.',
  },
  payPerCase: {
    displayCurrencyCode: 'CZK' as const satisfies MonetizationCanonicalDisplayCurrency,
    amountUnit: 'major' as const,
    displayOnly: true as const,
    meaning:
      'Display-only triples in CZK for the migration phase. Do not use for `PaymentsService`, `walletOps`, or Credits debits until a dedicated phase.',
  },
  b2bMonthly: {
    displayCurrencyCode: 'CZK' as const satisfies MonetizationCanonicalDisplayCurrency,
    amountUnit: 'major' as const,
    meaning:
      'Band-scoped B2B monthly display list integers in CZK (four tiers per band). Commercial settlement stays contract- and server-driven; no automatic ledger coupling here.',
  },
  b2bUsage: {
    displayCurrencyCode: 'CZK' as const satisfies MonetizationCanonicalDisplayCurrency,
    amountUnit: 'major' as const,
    meaning:
      'Band-scoped B2B usage display list integers in CZK (three tiers per band). Server-authoritative usage debits remain on existing engine paths until migrated.',
  },
} as const;

export type MonetizationTableMetadata = typeof MONETIZATION_TABLE_METADATA;
