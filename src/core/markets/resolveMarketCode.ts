import type { MarketCode } from '../i18n/smartTrioTypes';

const ISO2_TO_MARKET: Readonly<Record<string, MarketCode>> = {
  CZ: 'CZ',
  DE: 'DE',
  VN: 'VN',
  US: 'US',
  FR: 'FR',
  JP: 'JP',
  KR: 'KR',
};

const ISO3_TO_MARKET: Readonly<Record<string, MarketCode>> = {
  CZE: 'CZ',
  DEU: 'DE',
  VNM: 'VN',
  USA: 'US',
  FRA: 'FR',
  JPN: 'JP',
  KOR: 'KR',
};

/**
 * Maps a user / residency country code to a Smart Trio {@link MarketCode}.
 * No network; ISO2 from auth (`normalizeCountryCodeOrSentinel`) or optional ISO3.
 * Unknown, empty, or sentinel `ZZ` → `GLOBAL`.
 */
export function resolveMarketCode(country?: string | null): MarketCode {
  const raw = country?.trim().toUpperCase() ?? '';
  if (!raw || raw === 'ZZ') return 'GLOBAL';
  if (raw.length === 2) {
    return ISO2_TO_MARKET[raw] ?? 'GLOBAL';
  }
  if (raw.length === 3) {
    return ISO3_TO_MARKET[raw] ?? 'GLOBAL';
  }
  return 'GLOBAL';
}
