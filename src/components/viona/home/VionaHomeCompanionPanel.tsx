import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import { VionaCompanionOrbImage } from '../brand/VionaCompanionOrbImage';
import { VionaRec2AlfredPanel } from './VionaRec2AlfredPanel';
import { VionaPanelHeader, vionaSidePanelColors, vionaSidePanelFrame } from './VionaPanelHeader';
import {
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
} from './vionaRec2HomeContract';

const ASSISTANT_PROMPTS = ['news', 'translate', 'food', 'email', 'concept', 'practice'] as const;
const FACE_SIZE = 104;
const FACE_PULSE_STYLE_ID = 'viona-face-pulse';

export function ensureFacePulse(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  let style = document.getElementById(FACE_PULSE_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = FACE_PULSE_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = [
    '@keyframes viona-orb-pulse {',
    '  0%, 100% { transform: scale(1); }',
    '  50% { transform: scale(1.04); }',
    '}',
    '@keyframes viona-orb-glow-pulse {',
    '  0%, 100% { opacity: 0.6; }',
    '  50% { opacity: 1; }',
    '}',
    '[data-viona-orb="wrap"] { position: relative; }',
    '[data-viona-orb="glow"],',
    '[data-viona-orb="glow-still"] {',
    '  position: absolute;',
    '  inset: -40px;',
    '  border-radius: 50%;',
    '  background: radial-gradient(circle, rgba(70, 140, 255, 0.72) 0%, rgba(50, 110, 230, 0.4) 40%, rgba(40, 90, 220, 0) 70%);',
    '  filter: blur(28px);',
    '  z-index: 0;',
    '  pointer-events: none;',
    '}',
    '[data-viona-orb="glow"] {',
    '  animation: viona-orb-glow-pulse 2.6s ease-in-out infinite;',
    '}',
    '[data-viona-orb="body"] {',
    '  position: relative;',
    '  z-index: 1;',
    '  transform-origin: center center;',
    '  animation: viona-orb-pulse 2.6s ease-in-out infinite;',
    '}',
  ].join('\n');
}

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
  useEffect(() => {
    ensureFacePulse();
  }, []);

  return (
    <LinearGradient colors={[...vionaSidePanelColors]} style={styles.panel}>
      <View style={styles.intro}>
        <VionaPanelHeader showMark={false} closeLabel={t('home.rec2.alfred.collapse')} onClose={onClose} />
        <View
          accessibilityElementsHidden
          style={styles.face}
          {...(Platform.OS === 'web' ? ({ dataSet: { vionaOrb: 'wrap' } } as const) : null)}
        >
          <View
            pointerEvents="none"
            style={styles.faceGlow}
            {...(Platform.OS === 'web'
              ? ({ dataSet: { vionaOrb: reducedMotion ? 'glow-still' : 'glow' } } as const)
              : null)}
          />
          <View
            style={styles.faceOrb}
            {...(Platform.OS === 'web' && !reducedMotion ? ({ dataSet: { vionaOrb: 'body' } } as const) : null)}
          >
            <VionaCompanionOrbImage size={FACE_SIZE} reducedMotion={reducedMotion} />
          </View>
        </View>
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
    paddingTop: 6,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    ...vionaSidePanelFrame,
  },
  intro: { gap: 0 },
  face: {
    alignSelf: 'center',
    position: 'relative',
    width: FACE_SIZE,
    height: FACE_SIZE,
    marginTop: -22,
    marginBottom: 14,
    overflow: 'visible',
  },
  faceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    bottom: -40,
    left: -40,
    zIndex: 0,
    ...(Platform.OS === 'web'
      ? null
      : {
          borderRadius: 92,
          backgroundColor: 'rgba(60, 120, 255, 0.22)',
        }),
  },
  faceOrb: {
    position: 'relative',
    zIndex: 1,
    width: FACE_SIZE,
    height: FACE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  greeting: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  status: {
    color: vionaCinematicTokens.color.muted,
    fontFamily: vionaCinematicTokens.fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
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
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed' } as unknown as ViewStyle) : {}),
  },
  input: {
    flex: 1,
    minHeight: 40,
    color: vionaCinematicTokens.color.muted,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed', outlineStyle: 'none' } as unknown as ViewStyle) : {}),
  },
});
