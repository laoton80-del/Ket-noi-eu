import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaCompanionOrbImage } from '../brand/VionaCompanionOrbImage';
import { VionaRec2AlfredPanel } from './VionaRec2AlfredPanel';
import { VionaHomeSuggestionChips } from './VionaHomeSuggestionChips';
import {
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
} from './vionaRec2HomeContract';

export function VionaHomeCompanionPanel({
  displayName,
  previewMode = false,
  reducedMotion = false,
  universes,
  callbacks,
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
  const name = displayName?.trim() || null;
  const greeting = name
    ? t('home.rec2.greetingNamed', { name })
    : t('home.rec2.greetingGuest');

  return (
    <LinearGradient colors={['rgba(18, 42, 74, 0.96)', 'rgba(10, 26, 51, 0.92)', 'rgba(7, 17, 28, 0.96)']} style={styles.panel}>
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.rec2.alfred.collapse')} onPress={onClose} style={styles.close}>
          <Text style={styles.closeLabel}>{t('home.rec2.alfred.collapse')}</Text>
        </Pressable>
      ) : null}
      <View style={styles.orb} accessibilityElementsHidden>
        <VionaCompanionOrbImage size={112} reducedMotion={reducedMotion} />
      </View>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.status}>
        {previewMode ? t('home.rec2.companionPreview') : t('home.rec2.alfred.states.unavailable')}
      </Text>
      <VionaHomeSuggestionChips universes={universes} callbacks={callbacks} />
      <TextInput
        accessibilityLabel={t('home.rec2.companionInputPlaceholder')}
        accessibilityHint={t('home.rec2.companionNotConnected')}
        placeholder={t('home.rec2.companionInputPlaceholder')}
        placeholderTextColor={vionaCinematicTokens.color.muted}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => undefined}
        style={styles.input}
      />
      <Text style={styles.note}>{t('home.rec2.companionNotConnected')}</Text>
      <VionaRec2AlfredPanel reducedMotion={reducedMotion} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(230, 244, 255, 0.14)',
    padding: 14,
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
  input: {
    minHeight: 44,
    borderRadius: vionaCinematicTokens.radius.md,
    borderWidth: 1,
    borderColor: vionaCinematicTokens.color.line,
    backgroundColor: vionaCinematicTokens.color.surfaceGlass,
    color: vionaCinematicTokens.color.ice,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  note: { color: vionaCinematicTokens.color.muted, fontSize: 11, lineHeight: 16 },
});
