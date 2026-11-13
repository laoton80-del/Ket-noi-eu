import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaCompanionOrbImage } from '../brand/VionaCompanionOrbImage';
import { VionaRec2AlfredPanel } from './VionaRec2AlfredPanel';
import {
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
} from './vionaRec2HomeContract';

const ASSISTANT_PROMPTS = ['news', 'translate', 'food', 'email', 'concept', 'practice'] as const;

export function VionaHomeCompanionPanel({
  displayName,
  previewMode = false,
  reducedMotion = false,
  onClose,
}: Readonly<{
  displayName?: string | null;
  previewMode?: boolean;
  reducedMotion?: boolean;
  universes: readonly VionaRec2UniverseContract[];
  callbacks: VionaRec2UniverseCallbacks;
  onClose?: () => void;
}>) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const name = displayName?.trim() || null;
  const greeting = name
    ? t('home.rec2.greetingNamed', { name })
    : t('home.rec2.greetingGuest');

  return (
    <LinearGradient colors={['rgba(18, 42, 74, 0.72)', 'rgba(10, 26, 51, 0.58)', 'rgba(7, 17, 28, 0.78)']} style={styles.panel}>
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.rec2.alfred.collapse')} onPress={onClose} style={styles.close}>
          <Text style={styles.closeLabel}>{t('home.rec2.alfred.collapse')}</Text>
        </Pressable>
      ) : null}
      <View style={styles.orb} accessibilityElementsHidden>
        <VionaCompanionOrbImage size={112} reducedMotion={reducedMotion} />
      </View>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.status}>{t('home.rec2.companionPreview')}</Text>
      <View style={styles.chips}>
        {ASSISTANT_PROMPTS.map((id) => {
          const label = t(`home.rec2.assistantChips.${id}`);
          const selected = activePrompt === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => {
                setActivePrompt(id);
                setDraft(label);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <LinearGradient colors={['rgba(18, 42, 74, 0.92)', 'rgba(10, 26, 51, 0.84)']} style={styles.chipFill}>
                <Text style={styles.chipLabel}>{label}</Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
      <View
        style={styles.inputRow}
        accessibilityState={{ disabled: true }}
      >
        <Ionicons name="lock-closed-outline" size={15} color={vionaCinematicTokens.color.muted} />
        <TextInput
          accessibilityLabel={t('home.rec2.companionInputPlaceholder')}
          accessibilityHint={t('home.rec2.companionPreview')}
          editable={false}
          placeholder={t('home.rec2.companionInputPlaceholder')}
          placeholderTextColor={vionaCinematicTokens.color.muted}
          value={draft}
          style={styles.input}
        />
      </View>
      <VionaRec2AlfredPanel reducedMotion={reducedMotion} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.16)',
    padding: 16,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' } as ViewStyle)
      : {}),
    ...vionaCinematicTokens.elevation.cardOnShell,
  },
  close: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center' },
  closeLabel: { color: vionaCinematicTokens.color.cyan, fontSize: 12, fontFamily: vionaCinematicTokens.fontFamily.semibold },
  orb: {
    alignSelf: 'center',
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  greeting: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  status: { color: vionaCinematicTokens.color.gold, fontSize: 12, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  chip: {
    borderRadius: vionaCinematicTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 255, 0.22)',
    overflow: 'hidden',
  },
  chipSelected: { borderColor: '#00D1FF' },
  chipFill: { paddingHorizontal: 16, paddingVertical: 11 },
  chipLabel: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.medium,
    fontSize: 12,
  },
  inputRow: {
    minHeight: 44,
    borderRadius: vionaCinematicTokens.radius.md,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: 'rgba(10, 26, 51, 0.35)',
    opacity: 0.55,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed' } as ViewStyle) : {}),
  },
  input: {
    flex: 1,
    minHeight: 40,
    color: vionaCinematicTokens.color.muted,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed', outlineStyle: 'none' } as ViewStyle) : {}),
  },
});
