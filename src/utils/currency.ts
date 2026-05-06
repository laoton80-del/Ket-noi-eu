/**
 * Global VIG presentation helper — use everywhere the app shows token balances or prices.
 * Ledger amounts remain plain numbers; this is display-only (consistent 2 dp + unit suffix).
 */

/**
 * Standard display format for VIG worldwide (US / EU / Asia): fixed two decimal places + unit.
 *
 * @example formatVIG(15) → "15.00 VIG"
 * @example formatVIG(15.2) → "15.20 VIG"
 */
export function formatVIG(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '— VIG';
  }
  return `${amount.toFixed(2)} VIG`;
}

/** Maps `i18next` language codes (e.g. from `i18n.language`) to `Intl` locales for separators. */
const VIG_NUMBER_LOCALE: Readonly<Record<string, string>> = {
  en: 'en-US',
  vi: 'vi-VN',
  cs: 'cs-CZ',
  de: 'de-DE',
  fr: 'fr-FR',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

/**
 * Locale-aware VIG display (comma vs dot per region) — use for dashboard metrics & balances.
 */
export function formatVigTokenNumber(amount: number, i18nLanguage?: string): string {
  if (!Number.isFinite(amount)) {
    return '— VIG';
  }
  const code = i18nLanguage?.split('-')[0]?.toLowerCase() ?? 'en';
  const locale = VIG_NUMBER_LOCALE[code] ?? VIG_NUMBER_LOCALE.en;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} VIG`;
}
