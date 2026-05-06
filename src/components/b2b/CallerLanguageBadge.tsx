import { StyleSheet, Text, View } from 'react-native';
import type { VoiceCallerLanguage } from '../../state/b2bBooking';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export const CALLER_LANG_UI: Record<VoiceCallerLanguage, { readonly flag: string; readonly labelVi: string }> = {
  cs: { flag: '🇨🇿', labelVi: 'Séc' },
  de: { flag: '🇩🇪', labelVi: 'Đức' },
  en: { flag: '🇬🇧', labelVi: 'Anh' },
  vi: { flag: '🇻🇳', labelVi: 'Việt' },
  pl: { flag: '🇵🇱', labelVi: 'Ba Lan' },
  unknown: { flag: '🌐', labelVi: 'Tự động' },
};

export function getCallerLanguageFlagEmoji(language: VoiceCallerLanguage): string {
  return CALLER_LANG_UI[language].flag;
}

export function getCallerLanguageLabelVi(language: VoiceCallerLanguage): string {
  return CALLER_LANG_UI[language].labelVi;
}

export type CallerLanguageBadgeProps = {
  language: VoiceCallerLanguage;
  compact?: boolean;
};

export function CallerLanguageBadge({ language, compact }: CallerLanguageBadgeProps) {
  const ui = CALLER_LANG_UI[language];
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.flag}>{ui.flag}</Text>
      {!compact ? <Text style={styles.label}>{ui.labelVi}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,89,0.35)',
  },
  wrapCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flag: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
});
