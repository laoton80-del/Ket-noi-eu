/**
 * V7 **Ironclad Seal** — ledger & Stripe payloads are **EUR-only** (minor units).
 * UI may show CZK / USD / VND; **never** send non-EUR minor units to Stripe or Supabase money columns without prior ECB-style conversion (server-side), which KNG avoids by settling in EUR.
 */

import type { SettlementCurrency } from '../services/api/StripeBillingService';

/** Single global settlement / Stripe charge currency for platform liability boundary. */
export const GLOBAL_SETTLEMENT_CURRENCY = 'eur' as const;

/** Stripe `currency` param (lowercase ISO 4217). */
export const STRIPE_LEDGER_CURRENCY_CODE = GLOBAL_SETTLEMENT_CURRENCY;

/** Uppercase ledger code for comparisons with {@link SettlementCurrency}. */
export const LEDGER_CURRENCY_EUR: SettlementCurrency = 'EUR';

/**
 * Throws if a PI / DB payload is not strictly EUR-denominated (prevents silent FX leakage).
 */
export function assertLedgerPayloadUsesEur(
  settlementCurrency: string | undefined,
  context: string
): asserts settlementCurrency is 'EUR' {
  const c = (settlementCurrency ?? '').toUpperCase();
  if (c !== 'EUR') {
    throw new Error(
      `V7FinancialRules: ${context} requires settlement currency EUR (ledger); received "${settlementCurrency ?? 'undefined'}". KNG takes zero FX risk — convert display amounts server-side before booking.`
    );
  }
}

/**
 * Validates non-negative integer minor units (Euro cents) for Stripe `amount` / capture calls.
 */
export function assertEurMinorUnits(n: number, context: string): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`V7FinancialRules: ${context} — EUR minor units must be a non-negative integer (cents).`);
  }
}

/**
 * Metadata fragment for audit logs / Supabase rows proving ledger discipline.
 */
export function ledgerCurrencyMetadata(): Readonly<Record<string, string>> {
  return {
    v7_ledger_currency: STRIPE_LEDGER_CURRENCY_CODE,
    v7_ledger_policy: 'EUR_MINOR_ONLY',
  };
}
