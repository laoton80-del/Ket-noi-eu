/**
 * Persists UI language for react-i18next + keeps `assistantSettings.languageCode` in sync
 * with `getStrings()` (legacy app copy). Storage key is fixed for CEO / ops visibility.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { setAssistantSettings } from '../state/assistantSettings';
import { STORAGE_KEYS } from '../storage/storageKeys';
import i18n from './index';

/** Single source of truth with `STORAGE_KEYS.appLanguage` (`@app_language`). */
export const APP_LANGUAGE_KEY = STORAGE_KEYS.appLanguage;

export const SUPPORTED_UI_LANGUAGES = ['vi', 'en', 'cs', 'de', 'fr', 'ko', 'ja'] as const;
export type SupportedUiLanguageCode = (typeof SUPPORTED_UI_LANGUAGES)[number];

function isSupported(code: string): code is SupportedUiLanguageCode {
  return (SUPPORTED_UI_LANGUAGES as readonly string[]).includes(code);
}

/**
 * Apply language saved on device (call once after app mount). No-op if missing or invalid.
 */
export async function applyStoredLanguage(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
    if (raw && isSupported(raw)) {
      await i18n.changeLanguage(raw);
      setAssistantSettings({ languageCode: raw });
    }
  } catch {
    /* ignore storage / i18n errors */
  }
}

/**
 * User-selected language: persists, switches i18next immediately, updates assistant copy locale.
 */
export async function persistUserLanguage(langCode: string): Promise<void> {
  if (!isSupported(langCode)) return;
  await AsyncStorage.setItem(APP_LANGUAGE_KEY, langCode);
  await i18n.changeLanguage(langCode);
  setAssistantSettings({ languageCode: langCode });
}
