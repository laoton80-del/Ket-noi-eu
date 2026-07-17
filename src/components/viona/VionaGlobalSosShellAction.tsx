import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTranslation } from '../../utils/i18n';
import { FontFamily } from '../../theme/typography';
import { vionaTokens } from '../../design';
import { V7_SOS_HOLD_TO_TRIGGER_MS } from '../premium/SOSShieldComponent';

export type VionaGlobalSosShellActionProps = Readonly<{
  /** After hold completes — parent opens the canonical SOS modal (no auto-dial). */
  onHoldComplete: () => void;
}>;

const NEON = vionaTokens.fashionTech.sosNeon;
const NEON_GLOW = vionaTokens.fashionTech.sosNeonGlow;
const MIN_TOUCH = 44;

/**
 * Shell-integrated SOS control for the bottom-tab chrome.
 * Preserves hold-to-trigger safety (same duration as {@link SOSShieldComponent}).
 * Not an absolute floating overlay.
 */
export function VionaGlobalSosShellAction({
  onHoldComplete,
}: VionaGlobalSosShellActionProps): ReactElement {
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const resetHoldUi = useCallback(() => {
    clearTick();
    holdStartRef.current = null;
    firedRef.current = false;
    setProgress(0);
  }, [clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  const onPressIn = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    firedRef.current = false;
    holdStartRef.current = Date.now();
    setProgress(0);
    clearTick();
    tickRef.current = setInterval(() => {
      const start = holdStartRef.current;
      if (start == null) return;
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / V7_SOS_HOLD_TO_TRIGGER_MS);
      setProgress(p);
      if (p >= 1 && !firedRef.current) {
        firedRef.current = true;
        clearTick();
        holdStartRef.current = null;
        setProgress(0);
        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        void AccessibilityInfo.announceForAccessibility?.(t('ai_voice.accessibilityAnnounce'));
        onHoldComplete();
      }
    }, 16);
  }, [clearTick, onHoldComplete, t]);

  const onPressOut = useCallback(() => {
    if (!firedRef.current) {
      resetHoldUi();
    }
  }, [resetHoldUi]);

  return (
    <Pressable
      key={`sos-shell-${i18n.language}`}
      testID="viona-global-sos-shell-action"
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={t('sos.a11yChip')}
      accessibilityHint={t('sos.holdHelper')}
      style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}
    >
      <View style={styles.chip}>
        <Ionicons name="shield" size={18} color={NEON} accessibilityIgnoresInvertColors />
        <Text style={styles.label} numberOfLines={1}>
          {t('sos.chip')}
        </Text>
        <View style={styles.track} accessibilityElementsHidden>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  hitPressed: {
    opacity: 0.9,
  },
  chip: {
    minHeight: MIN_TOUCH,
    minWidth: 72,
    maxWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NEON_GLOW,
    backgroundColor: 'rgba(69, 10, 10, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: NEON,
    textTransform: 'uppercase',
  },
  track: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 23, 68, 0.22)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    backgroundColor: NEON,
  },
});
