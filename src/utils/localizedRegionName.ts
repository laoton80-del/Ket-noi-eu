import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';

/**
 * Human-readable region name for the user’s country pack code (ISO 3166-1 alpha-2).
 * Returns `null` when country is unknown / sentinel (`ZZ`).
 */
export function localizedRegionName(countryCode: string | undefined, uiLanguage: string): string | null {
  const code = normalizeCountryCodeOrSentinel(countryCode);
  if (code === 'ZZ') return null;

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
