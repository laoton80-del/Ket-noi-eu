import { normalizeCountryCodeOrSentinel } from '../countryPacks';
import type { WalletPackageId } from '../globalWalletPackages';
import {
  B2B_MONTHLY_BY_BAND,
  B2B_USAGE_BY_BAND,
  B2C_PACK_LIST_PRICE_BY_BAND,
  DEFAULT_MONETIZATION_BAND,
  MONETIZATION_COUNTRY_TO_BAND,
  PAY_PER_CASE_BY_BAND,
} from './data';
import type { B2BMonthlyQuadruple, B2BUsageTriple, MonetizationBand, PayPerCaseTriple } from './types';

/**
 * Resolves monetization band from profile / commercial country code.
 * Empty or invalid ISO → `ZZ` → {@link DEFAULT_MONETIZATION_BAND}.
 * Unknown ISO2 not in the explicit map → {@link DEFAULT_MONETIZATION_BAND}.
 */
export function resolveBandForCountry(countryCode?: string): MonetizationBand {
  const normalized = normalizeCountryCodeOrSentinel(countryCode);
  if (normalized === 'ZZ') {
    return DEFAULT_MONETIZATION_BAND;
  }
  return MONETIZATION_COUNTRY_TO_BAND[normalized] ?? DEFAULT_MONETIZATION_BAND;
}

/** B2C pack list price for band + pack; `null` = enterprise / custom. */
export function getB2CPackPriceByBand(band: MonetizationBand, packId: WalletPackageId): number | null {
  return B2C_PACK_LIST_PRICE_BY_BAND[band][packId];
}

export function getPayPerCaseByBand(band: MonetizationBand): PayPerCaseTriple {
  return PAY_PER_CASE_BY_BAND[band];
}

export function getB2BMonthlyByBand(band: MonetizationBand): B2BMonthlyQuadruple {
  return B2B_MONTHLY_BY_BAND[band];
}

export function getB2BUsageByBand(band: MonetizationBand): B2BUsageTriple {
  return B2B_USAGE_BY_BAND[band];
}
