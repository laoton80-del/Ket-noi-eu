import { MARKET_LANGUAGE_CONFIG, getMarketLanguageConfig } from '../markets/marketLanguageConfig';
import type { MarketCode, SmartTrioLocale, UserLanguageRole } from './smartTrioTypes';

function isSmartTrioLocale(value: string | undefined): value is SmartTrioLocale {
  return (
    value === 'vi' ||
    value === 'en' ||
    value === 'cs' ||
    value === 'de' ||
    value === 'fr' ||
    value === 'ja' ||
    value === 'ko'
  );
}

/**
 * Normalizes BCP47-ish tags (`en-US`, `vi_VN`) to a Smart Trio primary subtag.
 * Returns null when the language is outside the Smart Trio bundle.
 */
export function normalizeLocaleCode(raw: string | undefined): SmartTrioLocale | null {
  if (raw == null || raw.trim().length === 0) return null;
  const tag = raw.trim().replace(/_/g, '-').toLowerCase();
  const primary = tag.split('-')[0] ?? '';
  const alias: Record<string, SmartTrioLocale> = {
    vi: 'vi',
    vie: 'vi',
    en: 'en',
    eng: 'en',
    cs: 'cs',
    ces: 'cs',
    cze: 'cs',
    de: 'de',
    deu: 'de',
    ger: 'de',
    fr: 'fr',
    fra: 'fr',
    fre: 'fr',
    ja: 'ja',
    jpn: 'ja',
    ko: 'ko',
    kor: 'ko',
  };
  const mapped = alias[primary];
  if (mapped) return mapped;
  if (isSmartTrioLocale(primary)) return primary;
  return null;
}

export function getSupportedLocalesForMarket(marketCode: MarketCode | undefined): readonly SmartTrioLocale[] {
  const key = marketCode ?? 'GLOBAL';
  return getMarketLanguageConfig(key).supportedLocales;
}

export function isSmartTrioLocaleSupported(
  marketCode: MarketCode | undefined,
  rawLocale: string | undefined
): boolean {
  const locale = normalizeLocaleCode(rawLocale);
  if (!locale) return false;
  const supported = getSupportedLocalesForMarket(marketCode);
  return supported.includes(locale);
}

/** Re-export market row accessor for non-resolver call sites. */
export { getMarketLanguageConfig, MARKET_LANGUAGE_CONFIG };

/**
 * Example fixtures (documentation + future tests) — not wired to runtime UI.
 * - Vietnamese merchant in CZ
 * - Czech customer booking Vietnamese merchant
 * - Foreigner traveling Vietnam (inbound)
 * - Vietnamese traveling Japan
 * - Unsupported device locale → English bridge
 */
export const SMART_TRIO_EXAMPLE_FIXTURES: readonly Readonly<{
  label: string;
  input: Readonly<{
    userSelectedLocale?: string;
    deviceLocale?: string;
    marketCode?: MarketCode;
    userRole?: UserLanguageRole;
    preferredMerchantLocale?: string;
  }>;
}>[] = [
  {
    label: 'Vietnamese merchant in CZ',
    input: { marketCode: 'CZ', userRole: 'merchant', userSelectedLocale: 'vi', deviceLocale: 'cs' },
  },
  {
    label: 'Czech customer booking Vietnamese merchant',
    input: { marketCode: 'CZ', userRole: 'customer', userSelectedLocale: 'cs', deviceLocale: 'cs' },
  },
  {
    label: 'Foreign traveler inbound Vietnam',
    input: { marketCode: 'VN', userRole: 'customer', userSelectedLocale: 'en', deviceLocale: 'en' },
  },
  {
    label: 'Vietnamese traveling Japan',
    input: { marketCode: 'JP', userRole: 'customer', userSelectedLocale: 'vi', deviceLocale: 'ja' },
  },
  {
    label: 'Unsupported device locale → English bridge',
    input: { marketCode: 'DE', userRole: 'customer', deviceLocale: 'pl-PL' },
  },
] as const;
