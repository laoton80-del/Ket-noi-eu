/**
 * Global i18n entrypoint for the Expo app.
 *
 * ## Configuration (implemented in `src/i18n/index.ts`)
 * - **Library:** `react-i18next` + `i18next`, with `expo-localization` for device locale on first launch.
 * - **Fallback:** `fallbackLng: 'en'` — English is the global baseline when a key is missing.
 * - **First launch:** If the device primary `languageCode` is Vietnamese (`vi`), the initial UI language is `vi`;
 *   otherwise `en`. After the user picks a language (e.g. Login or Profile), `persistLanguage` overrides via AsyncStorage.
 *
 * Usage:
 * - `import { useTranslation, i18n } from '../utils/i18n'`
 * - `const { t } = useTranslation();` → `t('login.welcome')`
 */

export {
  applyStoredLanguage,
  APP_LANGUAGE_KEY,
  persistUserLanguage,
  SUPPORTED_UI_LANGUAGES,
} from '../i18n/persistLanguage';
export { default as i18n, useTranslation } from '../i18n';
