import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';

import { useTranslation } from '../../../i18n';
import {
  openVionaRec2AlfredUi,
  resolveVionaRec2AlfredPresentation,
  resolveVionaRec2TypographyMetrics,
} from './vionaRec2HomeContract';

export type VionaRec2AlfredPanelProps = Readonly<{
  reducedMotion?: boolean;
}>;

/**
 * Web-only guard: React Native Web's default Text CSS lets a too-narrow flex
 * column fracture a single word mid-character (e.g. "INTELLIGE"/"NCE"). This
 * keeps every word atomic on Web — the browser may still wrap at the space
 * between "SHARED" and "INTELLIGENCE", it just may not split inside a word.
 * Native `<Text>` never performs CSS-style mid-word breaking, so this is a
 * no-op there.
 */
const WEB_EYEBROW_WORD_BREAK_GUARD: TextStyle =
  Platform.OS === 'web'
    ? ({ wordBreak: 'keep-all', overflowWrap: 'normal' } as unknown as TextStyle)
    : {};

export function VionaRec2AlfredPanel({
  reducedMotion = false,
}: VionaRec2AlfredPanelProps) {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const presentation = resolveVionaRec2AlfredPresentation();
  const typography = resolveVionaRec2TypographyMetrics(fontScale);

  const togglePanel = () => {
    openVionaRec2AlfredUi(() => setExpanded((current) => !current));
  };

  return (
    <LinearGradient colors={['#071B35', '#06101F', '#030812']} style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.core} accessibilityElementsHidden>
          <Ionicons name="sparkles" size={25} color="#7FD6FF" />
        </View>
        <View style={styles.headingCopy}>
          <Text
            style={[
              styles.eyebrow,
              WEB_EYEBROW_WORD_BREAK_GUARD,
              { lineHeight: typography.microLineHeight },
            ]}
          >
            {t('home.rec2.alfred.eyebrow')}
          </Text>
          <Text style={[styles.title, { lineHeight: typography.cardTitleLineHeight }]}>
            {t('home.rec2.alfred.title')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? t('home.rec2.alfred.collapse') : t('home.rec2.alfred.expand')
          }
          onPress={togglePanel}
          style={({ pressed }) => [
            styles.expandButton,
            pressed && (reducedMotion ? styles.controlPressedReducedMotion : styles.controlPressed),
          ]}
        >
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#DCEEFF" />
        </Pressable>
      </View>

      <Text style={[styles.status, { lineHeight: typography.bodyLineHeight }]}>
        {t(`home.rec2.alfred.states.${presentation.state}`)}
      </Text>

      {expanded ? (
        <View style={styles.detail}>
          <Text style={[styles.detailText, { lineHeight: typography.bodyLineHeight }]}>
            {t('home.rec2.alfred.uiOnlyDetail')}
          </Text>
          <View
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            style={[
              styles.voiceDisabled,
              { minHeight: Math.max(42, typography.availabilityLineHeight + 20) },
            ]}
          >
            <Ionicons name="mic-off-outline" size={17} color="#7F95AA" />
            <Text
              style={[
                styles.voiceDisabledText,
                { lineHeight: typography.availabilityLineHeight },
              ]}
            >
              {t('home.rec2.alfred.voiceUnavailable')}
            </Text>
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(82, 177, 255, 0.42)',
    padding: 18,
    gap: 10,
    shadowColor: '#006DFF',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  core: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(115, 205, 255, 0.7)',
    backgroundColor: 'rgba(12, 89, 170, 0.28)',
  },
  // minWidth guards the longest eyebrow word ("INTELLIGENCE" at fontSize 11,
  // 800 weight, letterSpacing 1.25 ≈ 96px) so the row can still shrink under
  // the fixed-width icon/expand buttons without squeezing this column below
  // a single word's natural width (the trigger condition for the Web
  // mid-word-break defect). Native never reaches this floor.
  headingCopy: { flexGrow: 1, flexShrink: 1, minWidth: 120, gap: 2 },
  eyebrow: { color: '#69C8FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.25 },
  title: { color: '#F5FAFF', fontSize: 21, fontWeight: '800' },
  status: { color: '#B8C9D9', fontSize: 13 },
  expandButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129, 192, 238, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  controlPressedReducedMotion: { opacity: 0.72 },
  detail: { gap: 10, paddingTop: 2 },
  detailText: { color: '#AFC1D3', fontSize: 12 },
  voiceDisabled: {
    minHeight: 42,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 149, 170, 0.28)',
    backgroundColor: 'rgba(16, 27, 41, 0.72)',
  },
  voiceDisabledText: {
    color: '#7F95AA',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
});
