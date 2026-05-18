import { getVioCreditsLabel } from '../core/monetization/vioDisplayLabels';

/**
 * In-app amount presentation (VIO Credits). Ledger field names may still use legacy `*VIG` internally.
 * Display-only — consistent 2 dp + public unit suffix.
 */

/**
 * @example formatVIG(15) → "15.00 VIO Credits"
 */
export function formatVIG(amount: number): string {
  if (!Number.isFinite(amount)) {
    return `— ${getVioCreditsLabel()}`;
  }
  return `${amount.toFixed(2)} ${getVioCreditsLabel()}`;
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

/** Locale-aware VIO Credits display (comma vs dot per region). */
export function formatVigTokenNumber(amount: number, i18nLanguage?: string): string {
  const unit = getVioCreditsLabel();
  if (!Number.isFinite(amount)) {
    return `— ${unit}`;
  }
  const code = i18nLanguage?.split('-')[0]?.toLowerCase() ?? 'en';
  const locale = VIG_NUMBER_LOCALE[code] ?? VIG_NUMBER_LOCALE.en;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${unit}`;
}
