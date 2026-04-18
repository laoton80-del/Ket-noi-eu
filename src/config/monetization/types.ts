/**
 * Phase 1 — monetization band spine (Kết Nối Global blueprint).
 * Canonical display currency for locked list integers: see `MONETIZATION_TABLE_METADATA` / `metadata.ts`.
 */

/** ISO 4217 code for band list-price display integers (major units, not haléře). */
export type MonetizationCanonicalDisplayCurrency = 'CZK';

export type MonetizationBand = 'A' | 'B' | 'C';

/** Three pay-per-case price points per band (blueprint order). */
export type PayPerCaseTriple = readonly [number, number, number];

/** Four B2B monthly price points per band (blueprint order). */
export type B2BMonthlyQuadruple = readonly [number, number, number, number];

/** Three B2B usage price points per band (blueprint order). */
export type B2BUsageTriple = readonly [number, number, number];
