export type LocalLanguageCode = 'vi' | 'en' | 'cs' | 'de' | 'ja';

export type LocalLanguageOption = Readonly<{
  code: LocalLanguageCode;
  label: string;
}>;

const VIETNAMESE: LocalLanguageOption = { code: 'vi', label: 'Tiếng Việt' };
const ENGLISH: LocalLanguageOption = { code: 'en', label: 'English' };

function localLanguageForCountry(countryCode: string): LocalLanguageOption {
  const cc = countryCode.trim().toUpperCase();
  if (cc === 'CZ') return { code: 'cs', label: 'Čeština' };
  if (cc === 'DE') return { code: 'de', label: 'Deutsch' };
  if (cc === 'JP') return { code: 'ja', label: '日本語' };
  if (cc === 'US' || cc === 'AU' || cc === 'GB') return ENGLISH;
  return ENGLISH;
}

/**
 * Smart Trio list: [Vietnamese (default), local language, English fallback].
 * Deduplicates when local is English.
 */
export function getLocalLanguageConfig(countryCode: string): readonly LocalLanguageOption[] {
  const local = localLanguageForCountry(countryCode);
  const items: LocalLanguageOption[] = [VIETNAMESE, local, ENGLISH];
  return sanitizeLocalLanguageOptions(items);
}

/**
 * Hard guardrail for Smart Trio surfaces:
 * - dedupe by language code
 * - deterministic order: Vietnamese -> local -> English
 * - max 3 options
 * - fallback to [vi, en] if input is broken/empty
 */
export function sanitizeLocalLanguageOptions(
  input: readonly LocalLanguageOption[]
): readonly LocalLanguageOption[] {
  const unique = new Map<LocalLanguageCode, LocalLanguageOption>();
  const orderedCodes: readonly LocalLanguageCode[] = ['vi', 'cs', 'de', 'ja', 'en'];
  for (const code of orderedCodes) {
    const hit = input.find((item) => item.code === code);
    if (hit && !unique.has(code)) unique.set(code, hit);
  }
  if (!unique.has('vi')) unique.set('vi', VIETNAMESE);
  if (!unique.has('en')) unique.set('en', ENGLISH);
  return Array.from(unique.values()).slice(0, 3);
}

export function coerceLanguageSelection(
  requestedCode: string,
  options: readonly LocalLanguageOption[]
): LocalLanguageCode {
  const requested = requestedCode as LocalLanguageCode;
  if (options.some((item) => item.code === requested)) return requested;
  if (options.some((item) => item.code === 'vi')) return 'vi';
  return 'en';
}
