import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';

/**
 * Human-readable region name for the user’s country pack code (ISO 3166-1 alpha-2).
 * Returns `null` when country is unknown / sentinel (`ZZ`).
 */
export function localizedRegionName(countryCode: string | undefined, uiLanguage: string): string | null {
  const raw = countryCode?.trim() ?? '';
  if (!raw) return null;
  const upper = raw.toUpperCase();

  const iso3ToIso2: Readonly<Record<string, string>> = {
    CZE: 'CZ',
    DEU: 'DE',
    VNM: 'VN',
    USA: 'US',
    FRA: 'FR',
    JPN: 'JP',
    KOR: 'KR',
  };
  const maybeIso2 = upper.length === 3 ? iso3ToIso2[upper] : upper;
  const code = normalizeCountryCodeOrSentinel(maybeIso2);
  if (code === 'ZZ') return raw.length > 2 ? raw : null;

  try {
    if (typeof Intl === 'undefined' || typeof Intl.DisplayNames === 'undefined') {
      return code;
    }
    const lng = uiLanguage.replace('_', '-');
    const dn = new Intl.DisplayNames([lng], { type: 'region' });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}
