import type { WalletPackageId } from '../globalWalletPackages';
import { MONETIZATION_CANONICAL_DISPLAY_CURRENCY } from './metadata';
import type { B2BMonthlyQuadruple, B2BUsageTriple, MonetizationBand, PayPerCaseTriple } from './types';

/**
 * Integer amounts in {@link MONETIZATION_CANONICAL_DISPLAY_CURRENCY} (major units); table semantics in `metadata.ts` (`MONETIZATION_TABLE_METADATA`).
 * **Not** the live B2C wallet checkout spine — see `docs/COMMERCIAL_SPINE_LIVE.md` (`commercialSpine` + `Pricing`).
 */

/**
 * Countries not explicitly mapped resolve to {@link DEFAULT_MONETIZATION_BAND}
 * (see `resolveBandForCountry`).
 */
export const DEFAULT_MONETIZATION_BAND: MonetizationBand = 'B';

/** Explicit ISO 3166-1 alpha-2 → band. `GB` included alongside `UK` for alias parity with packs. */
export const MONETIZATION_COUNTRY_TO_BAND: Readonly<Record<string, MonetizationBand>> = {
  // Band A — developed / premium (blueprint)
  US: 'A',
  CA: 'A',
  UK: 'A',
  GB: 'A',
  DE: 'A',
  NL: 'A',
  AT: 'A',
  CH: 'A',
  SE: 'A',
  NO: 'A',
  DK: 'A',
  FI: 'A',
  AU: 'A',
  NZ: 'A',
  SG: 'A',
  // Band B — EU launch / mid (blueprint)
  CZ: 'B',
  SK: 'B',
  PL: 'B',
  HU: 'B',
  RO: 'B',
  BG: 'B',
  HR: 'B',
  SI: 'B',
  LT: 'B',
  LV: 'B',
  EE: 'B',
  GR: 'B',
  PT: 'B',
  // Band C — value-sensitive (blueprint)
  VN: 'C',
} as const;

/**
 * B2C wallet pack list prices by band — **integer table keyed in CZK major units** for a future monetization spine alignment spec only.
 * **Not** the live checkout/display master: app Wallet still uses `getWalletPackagePricesByCountry` (USD × tier → local label). Do not treat this table as the public commercial anchor (GLOBAL_V1: USD-base + Band A/B/C).
 * `enterprise` → `null` (custom / sales-led).
 */
export const B2C_PACK_LIST_PRICE_BY_BAND: Readonly<
  Record<MonetizationBand, Readonly<Record<WalletPackageId, number | null>>>
> = {
  A: {
    starter: 349,
    basic: 599,
    standard: 990,
    pro: 1490,
    power: 2990,
    enterprise: null,
  },
  B: {
    starter: 199,
    basic: 349,
    standard: 599,
    pro: 990,
    power: 1990,
    enterprise: null,
  },
  C: {
    starter: 129,
    basic: 249,
    standard: 399,
    pro: 699,
    power: 1290,
    enterprise: null,
  },
} as const;

/** Pay-per-case display triples (CZK). Display-only until a later phase; see metadata. */
export const PAY_PER_CASE_BY_BAND: Readonly<Record<MonetizationBand, PayPerCaseTriple>> = {
  A: [199, 349, 590],
  B: [99, 179, 299],
  C: [49, 99, 149],
} as const;

/** B2B monthly display lists (CZK). */
export const B2B_MONTHLY_BY_BAND: Readonly<Record<MonetizationBand, B2BMonthlyQuadruple>> = {
  A: [2490, 4990, 7990, 12990],
  B: [1490, 2990, 4990, 8990],
  C: [790, 1490, 2990, 5990],
} as const;

/** B2B usage display lists (CZK). */
export const B2B_USAGE_BY_BAND: Readonly<Record<MonetizationBand, B2BUsageTriple>> = {
  A: [15, 25, 49],
  B: [10, 15, 29],
  C: [5, 8, 15],
} as const;
