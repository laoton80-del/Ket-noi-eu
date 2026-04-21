/**
 * Monetization blueprint — **migration / band tables** (data + resolvers).
 *
 * **Live wallet pack UI + checkout amounts:** `src/config/commercialSpine.ts` + `docs/COMMERCIAL_SPINE_LIVE.md` — **not** this folder’s CZK integer tables.
 * Do not wire `B2C_PACK_LIST_PRICE_BY_BAND` to checkout until Phase 2B exit criteria (`docs/PHASE_2B_MONETIZATION_CHECKOUT_DECISION.md`).
 *
 * HARD GUARDRAIL:
 * - This module is for migration/doctrine/read-only pricing references.
 * - Do NOT import from `src/config/monetization/*` inside runtime checkout/payment code paths
 *   (`WalletTopUpScreen`, `PaymentsService`, wallet top-up verification, or any server debit path).
 * - Runtime checkout SoT stays in `src/config/commercialSpine.ts` + `src/config/Pricing.ts`.
 */

export type {
  B2BMonthlyQuadruple,
  B2BUsageTriple,
  MonetizationBand,
  MonetizationCanonicalDisplayCurrency,
  PayPerCaseTriple,
} from './types';

export {
  MONETIZATION_CANONICAL_DISPLAY_CURRENCY,
  MONETIZATION_TABLE_METADATA,
} from './metadata';
export type { MonetizationTableMetadata } from './metadata';

export {
  B2B_MONTHLY_BY_BAND,
  B2B_USAGE_BY_BAND,
  B2C_PACK_LIST_PRICE_BY_BAND,
  DEFAULT_MONETIZATION_BAND,
  MONETIZATION_COUNTRY_TO_BAND,
  PAY_PER_CASE_BY_BAND,
} from './data';

export {
  getB2BMonthlyByBand,
  getB2BUsageByBand,
  getB2CPackPriceByBand,
  getPayPerCaseByBand,
  resolveBandForCountry,
} from './resolvers';

