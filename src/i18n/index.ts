/**
 * Global i18n bootstrap (react-i18next + expo-localization).
 *
 * Import this module once from the Expo app entry (e.g. `App.tsx`) so `useTranslation` works:
 *   import './i18n';
 *
 * For non-React code, use `i18n.t('welcome_message')` after this module has initialized.
 *
 * Add new strings under `src/i18n/locales/*.json` and register languages in `resources` below.
 */

import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import cs from './locales/cs.json';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import vi from './locales/vi.json';

type LocaleJson = Readonly<Record<string, unknown>>;

/**
 * Non-EN locale files ship a **partial** `sos` object. i18next does not deep-merge missing
 * nested keys into `fallbackLng`, so new SOS keys would render as raw paths (e.g. `sos.guideTitle`).
 * Merge each locale's `sos` on top of English so every `sos.*` key resolves for all UI languages.
 */
function mergeSosWithEnglishBase(locale: LocaleJson): LocaleJson {
  const enSos = en.sos;
  const locSos = locale.sos;
  if (typeof enSos !== 'object' || enSos === null) return locale;
  const overlay =
    typeof locSos === 'object' && locSos !== null ? (locSos as Readonly<Record<string, unknown>>) : {};
  return {
    ...locale,
    sos: {
      ...(enSos as Readonly<Record<string, unknown>>),
      ...overlay,
    },
  };
}

const resources = {
  en: { translation: en },
  vi: { translation: mergeSosWithEnglishBase(vi as LocaleJson) },
  cs: { translation: mergeSosWithEnglishBase(cs as LocaleJson) },
  de: { translation: mergeSosWithEnglishBase(de as LocaleJson) },
  fr: { translation: mergeSosWithEnglishBase(fr as LocaleJson) },
  ko: { translation: mergeSosWithEnglishBase(ko as LocaleJson) },
  ja: { translation: mergeSosWithEnglishBase(ja as LocaleJson) },
} as const;

/** First launch: map device `languageCode` to a bundled UI language; default `en`. */
function pickInitialLanguage(): string {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? '';
  if (code === 'vi' || code.startsWith('vi-')) return 'vi';
  if (code === 'cs' || code.startsWith('cs-')) return 'cs';
  if (code === 'de' || code.startsWith('de-')) return 'de';
  if (code === 'fr' || code.startsWith('fr-')) return 'fr';
  if (code === 'ko' || code.startsWith('ko-')) return 'ko';
  if (code === 'ja' || code.startsWith('ja-')) return 'ja';
  return 'en';
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: pickInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi', 'cs', 'de', 'fr', 'ko', 'ja'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
export { useTranslation } from 'react-i18next';
