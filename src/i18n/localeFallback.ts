/**
 * AI + UI language fallback: Vietnamese and English are fully supported;
 * unmapped device locales fall back to English (product copy baseline).
 */

export type SupportedUiLocale = 'vi' | 'en';

const VI_PREFIXES = ['vi'];

function normalizeLocaleTag(raw: string | undefined): string {
  return (raw ?? 'en').trim().replace(/_/g, '-').toLowerCase();
}

export function resolveAiUiLocale(deviceLocale: string | undefined): SupportedUiLocale {
  const tag = normalizeLocaleTag(deviceLocale);
  const primary = tag.split('-')[0] ?? 'en';
  if (VI_PREFIXES.some((p) => primary === p || tag.startsWith(`${p}-`))) {
    return 'vi';
  }
  return 'en';
}
