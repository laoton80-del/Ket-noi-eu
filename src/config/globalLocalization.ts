/**
 * Region → ISO 4217 resolution for dynamic pricing / checkout labels.
 * Ledger anchors remain USD-major in `pricingConfig`; display currency follows user/merchant region.
 */

export type Iso4217Code =
  | 'USD'
  | 'EUR'
  | 'AUD'
  | 'JPY'
  | 'VND'
  | 'GBP'
  | 'CZK'
  | 'PLN'
  | 'CHF';

const EZ_EUR: readonly string[] = [
  'AT',
  'BE',
  'CY',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PT',
  'SK',
  'SI',
  'ES',
] as const;

/**
 * Primary settlement/display currency for a user's ISO 3166-1 alpha-2 country code.
 * Unknown or invalid → USD (global product default).
 */
export function resolveCurrencyForRegion(iso3166Alpha2: string | undefined): Iso4217Code {
  const c = (iso3166Alpha2 ?? '').trim().toUpperCase();
  if (c.length !== 2) return 'USD';
  switch (c) {
    case 'US':
    case 'PR':
    case 'GU':
    case 'VI':
      return 'USD';
    case 'AU':
      return 'AUD';
    case 'JP':
      return 'JPY';
    case 'VN':
      return 'VND';
    case 'GB':
      return 'GBP';
    case 'CH':
      return 'CHF';
    case 'CZ':
      return 'CZK';
    case 'PL':
      return 'PLN';
    default:
      if (EZ_EUR.includes(c)) return 'EUR';
      return 'USD';
  }
}
