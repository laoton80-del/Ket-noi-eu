import Constants from 'expo-constants';

type PreviewExtra = Readonly<{
  vionaUiPreviewOnly?: unknown;
}>;

/**
 * Runtime preview flag. `app.config.js` sets `extra.vionaUiPreviewOnly`
 * only when the process starts with `VIONA_UI_PREVIEW_ONLY=1`.
 * Production builds leave the field unset, so this stays false.
 */
export function isVionaUiPreviewMode(): boolean {
  const extra = Constants.expoConfig?.extra as PreviewExtra | undefined;
  return extra?.vionaUiPreviewOnly === true;
}
