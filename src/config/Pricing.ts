/**
 * Global pricing display spine:
 * - **Canonical list prices:** USD at tier (see `globalWalletPackages.usdT2` × tier multiplier).
 * - **Local fiat labels:** `usdToLocalDisplayAmount` uses **static** approximate rates per currency (not live FX).
 * - **Per-call debit anchors:** `internal_call_czk` / `external_call_czk` are legacy **credit-unit anchors** (name retained for compatibility), converted to local display via `EXCHANGE_RATE_FROM_CZK`.
 * - **Country truth:** use `resolveCommercialCountryContext` as the canonical fallback contract:
 *   `{ countryCode, pricingPack, displayCurrency, merchantCountryCode }`.
 * - **Functions bundle:** Cloud Functions inlines this module via esbuild (`functions/npm run build`); keep tier logic in sync with `countryPacks/index.ts`.
 */
import type { PackCurrencyCode } from './countryPacks/types';
import {
  COUNTRY_PACKS,
  normalizeCountryCodeOrSentinel,
  pricingTierForUsageDebits,
  resolveCommercialCountryContext,
  resolveCountryPack,
  type PricingTierId,
} from './countryPacks';
import { EXTERNAL_CALL_CZK_BY_TIER, INTERNAL_CALL_CZK_BY_TIER } from './countryPacks/pricingByTier';
import { GLOBAL_WALLET_PACKAGES, usdListPriceForPackageAtTier, type WalletPackageId } from './globalWalletPackages';

export type CurrencyCode = PackCurrencyCode;

export type MarketTier = {
  tier: PricingTierId;
  market_group: string;
  countries: string[];
  /** Debit anchor in internal credit units (historical name; not necessarily CZK). */
  internal_call_czk: number;
  /** Debit anchor in internal credit units (historical name; not necessarily CZK). */
  external_call_czk: number;
  currencyCode: CurrencyCode;
};

export type ComboPlan = {
  id: WalletPackageId;
  name: string;
  /** Credits granted after successful top-up (field name kept for wallet UI compatibility). */
  turns: number;
  gift: string;
  purchasable: boolean;
};

export type ComboPriceCard = ComboPlan & {
  amount: number;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  amountLabel: string;
  /** Tier-adjusted list price in USD (canonical layer). */
  listUsd: number;
};

/**
 * Markets matrix for geo labels + per-call debit anchors → local display.
 * Legacy JSON market table (debit anchors + display currency per region). Prefer `countryPacks` + `pricingByTier` for new code.
 */
export const PRICING_GLOBAL_LEGACY_MARKETS_JSON: {
  markets: MarketTier[];
} = {
  markets: [
    {
      tier: 'T1',
      market_group: 'Central Europe Core',
      countries: ['CZ'],
      internal_call_czk: 29,
      external_call_czk: 99,
      currencyCode: 'CZK',
    },
    {
      tier: 'T1',
      market_group: 'Poland Local',
      countries: ['PL'],
      internal_call_czk: 29,
      external_call_czk: 99,
      currencyCode: 'PLN',
    },
    {
      tier: 'T2',
      market_group: 'Euro Area',
      countries: ['SK', 'DE', 'FR', 'NL', 'BE', 'AT', 'CH', 'LU', 'IE'],
      internal_call_czk: 99,
      external_call_czk: 199,
      currencyCode: 'EUR',
    },
    {
      tier: 'T2',
      market_group: 'United Kingdom',
      countries: ['UK'],
      internal_call_czk: 99,
      external_call_czk: 199,
      currencyCode: 'GBP',
    },
  ],
};

const DEFAULT_LOCALE = 'en-GB';

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  CZK: 'Kč',
  PLN: 'zł',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
};

const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  CZK: 0,
  PLN: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
};

/** Static scaffold: approximate local currency units per 1 USD for wallet package display only. */
const UNITS_LOCAL_CURRENCY_PER_USD: Record<CurrencyCode, number> = {
  CZK: 23,
  PLN: 4.0,
  EUR: 0.92,
  GBP: 0.79,
  CHF: 0.88,
};

export const EXCHANGE_RATE_FROM_CZK: Record<CurrencyCode, number> = {
  CZK: 1,
  EUR: 25,
  GBP: 29,
  CHF: 26,
  PLN: 6,
};

/** Must stay aligned with `COUNTRY_PACKS[].currencyCode` for listed ISO codes. */
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  CZ: 'CZK',
  PL: 'PLN',
  SK: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  LU: 'EUR',
  IE: 'EUR',
  CH: 'CHF',
  UK: 'GBP',
  GB: 'GBP',
  VN: 'EUR',
};

function normalizeCountry(countryCode?: string): string {
  return normalizeCountryCodeOrSentinel(countryCode);
}

function convertCzkToLocal(amountCzk: number, countryCode?: string): { amount: number; currencyCode: CurrencyCode } {
  const currencyCode = resolveDisplayCurrencyForCountry(countryCode);
  const rate = EXCHANGE_RATE_FROM_CZK[currencyCode] || 1;
  const amount = amountCzk / rate;
  return { amount, currencyCode };
}

export type LocalPriceMeta = {
  amount: number;
  currencyCode: CurrencyCode;
  symbol: string;
  label: string;
};

/** Display currency from country pack (single source of truth for wallet / geo UI). */
export function resolveDisplayCurrencyForCountry(countryCode?: string): CurrencyCode {
  return resolveCommercialCountryContext(countryCode).displayCurrency;
}

export function usdToLocalDisplayAmount(usd: number, currencyCode: CurrencyCode): number {
  const perUsd = UNITS_LOCAL_CURRENCY_PER_USD[currencyCode] ?? 1;
  const raw = usd * perUsd;
  const decimals = CURRENCY_DECIMALS[currencyCode];
  const factor = 10 ** decimals;
  return Math.round(raw * factor) / factor;
}

export function getCurrencyByCountry(countryCode?: string): CurrencyCode {
  return resolveDisplayCurrencyForCountry(countryCode);
}

export function formatMoneyByCurrency(amount: number, currencyCode: CurrencyCode, locale = 'vi-VN'): string {
  const decimals = CURRENCY_DECIMALS[currencyCode];
  const symbol = CURRENCY_SYMBOL[currencyCode];
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

export function formatLocalPrice(basePriceCzk: number, countryCode?: string, locale = DEFAULT_LOCALE): string {
  const local = getLocalPriceMeta(basePriceCzk, countryCode, locale);
  return local.label;
}

export function getLocalPriceMeta(
  basePriceCzk: number,
  countryCode?: string,
  locale?: string
): LocalPriceMeta {
  const ctx = resolveCommercialCountryContext(countryCode);
  const resolvedLocale = locale ?? ctx.pricingPack.locale ?? DEFAULT_LOCALE;
  const { amount, currencyCode } = convertCzkToLocal(basePriceCzk, countryCode);
  return {
    amount,
    currencyCode,
    symbol: CURRENCY_SYMBOL[currencyCode],
    label: formatMoneyByCurrency(amount, currencyCode, resolvedLocale),
  };
}

export function getPricingByCountry(countryCode?: string) {
  const market = getMarketTierByCountry(countryCode);
  const internal = convertCzkToLocal(market.internal_call_czk, countryCode);
  const external = convertCzkToLocal(market.external_call_czk, countryCode);
  return {
    tier: market.tier,
    countryCurrency: resolveDisplayCurrencyForCountry(countryCode),
    currencySymbol: CURRENCY_SYMBOL[resolveDisplayCurrencyForCountry(countryCode)],
    internalCallPrice: internal.amount,
    externalCallPrice: external.amount,
    internalCallPriceCzk: market.internal_call_czk,
    externalCallPriceCzk: market.external_call_czk,
  };
}

export function getComboPricesByCountry(countryCode?: string, locale?: string): ComboPriceCard[] {
  const ctx = resolveCommercialCountryContext(countryCode);
  const tier = pricingTierForUsageDebits(ctx.countryCode);
  const currencyCode = ctx.displayCurrency;
  const symbol = CURRENCY_SYMBOL[currencyCode];
  const resolvedLocale = locale ?? ctx.pricingPack.locale ?? DEFAULT_LOCALE;

  return GLOBAL_WALLET_PACKAGES.map((pkg) => {
    const listUsd = usdListPriceForPackageAtTier(pkg, tier);
    const amount = usdToLocalDisplayAmount(listUsd, currencyCode);
    return {
      id: pkg.id,
      name: pkg.nameVi,
      turns: pkg.credits ?? 0,
      gift: pkg.giftVi,
      purchasable: pkg.purchasable,
      amount,
      currencyCode,
      currencySymbol: symbol,
      amountLabel: formatMoneyByCurrency(amount, currencyCode, resolvedLocale),
      listUsd,
    };
  });
}

export function getMarketTierByCountry(countryCode?: string): MarketTier {
  const normalized = normalizeCountry(countryCode);
  const tier = pricingTierForUsageDebits(normalized);
  const pack = resolveCommercialCountryContext(normalized).pricingPack;
  const direct = PRICING_GLOBAL_LEGACY_MARKETS_JSON.markets.find((market) => market.countries.includes(normalized));
  if (direct && direct.tier === tier) {
    return direct;
  }
  const listed = Object.prototype.hasOwnProperty.call(COUNTRY_PACKS, normalized);
  return {
    tier,
    market_group: listed ? `Pack:${pack.regionCode}` : 'Global default (unlisted)',
    countries: [normalized],
    internal_call_czk: INTERNAL_CALL_CZK_BY_TIER[tier],
    external_call_czk: EXTERNAL_CALL_CZK_BY_TIER[tier],
    currencyCode: resolveDisplayCurrencyForCountry(normalized),
  };
}

// Luôn gọi getMarketTierByCountry(countryCode) trước khi báo giá gọi / CSKH;
// không hard-code giá khi chưa biết quốc gia hồ sơ.
