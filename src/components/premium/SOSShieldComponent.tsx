/**
 * V7 SOS shield — **hold-to-trigger** (≥3000ms) with neon-red circular progress.
 * Prevents accidental emergency sheet opens; pairs with {@link initiateAITriage} + 10s dial buffer in {@link SOSModal}.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';

export const V7_SOS_HOLD_TO_TRIGGER_MS = 3_000 as const;

const RING_SIZE = 64;
const STROKE = 4;
const R = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const NEON_RED = '#FF1744';
const NEON_RED_GLOW = '#FF5252';

export type SOSShieldComponentProps = Readonly<{
  /** Fires once when hold duration completes (single-shot per gesture). */
  onHoldComplete: () => void;
  /** Softer pulse/shadow for wide layouts (e.g. web) so SOS stays visible without overlapping content visually. */
  reduceMotionGlow?: boolean;
}>;

export function SOSShieldComponent({
  onHoldComplete,
  reduceMotionGlow = false,
}: SOSShieldComponentProps): ReactElement {
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);
  const pulse = useSharedValue(1);
  const ringPulse = useSharedValue(0.35);

  useEffect(() => {
    if (reduceMotionGlow || Platform.OS === 'web') {
      pulse.value = 1;
      ringPulse.value = 0.32;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.28, { duration: 850, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse, ringPulse, reduceMotionGlow]);

  const fabAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringAnim = useAnimatedStyle(() => ({
    opacity: ringPulse.value,
    transform: [{ scale: pulse.value * 1.12 }],
  }));

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

  const strokeDashoffset = CIRC * (1 - progress);

  return (
    <View
      key={`sos-shield-${i18n.language}`}
      style={styles.wrap}
      accessibilityElementsHidden={false}
    >
      <Animated.View
        style={[styles.pulseRing, reduceMotionGlow && styles.pulseRingDesktop, ringAnim]}
        pointerEvents="none"
      />
      <Animated.View style={fabAnim}>
        <View style={styles.ringSlot}>
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={styles.svgRing}
            pointerEvents="none"
          >
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              stroke="rgba(255, 23, 68, 0.22)"
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              stroke={NEON_RED}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={R}
              stroke={NEON_RED_GLOW}
              strokeWidth={1.5}
              fill="none"
              opacity={0.55}
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={({ pressed }) => [
              styles.hit,
              reduceMotionGlow && styles.hitDesktop,
              pressed && styles.hitPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('sos.fabLabel')}
            accessibilityHint={t('sos.fabHoldHint')}
          >
            <LinearGradient
              colors={['#7F1D1D', '#B91C1C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.mainRow}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={styles.iconShadow} />
                <View style={styles.labelCol}>
                  <Text style={styles.mainLabel}>{t('shell.utility.sosAssist')}</Text>
                  <Text style={styles.subLabel}>{t('shell.utility.safety')}</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
      {progress > 0 && progress < 1 ? (
        <View style={styles.captionWrap} pointerEvents="none">
          <Text
            style={styles.caption}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            maxFontSizeMultiplier={1.1}
          >
            {t('sos.holdProgress')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    maxWidth: 168,
  },
  pulseRing: {
    position: 'absolute',
    width: 116,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 23, 68, 0.24)',
    backgroundColor: 'rgba(255, 23, 68, 0.04)',
  },
  pulseRingDesktop: {
    borderWidth: 1,
    borderColor: 'rgba(255, 23, 68, 0.18)',
    backgroundColor: 'rgba(255, 23, 68, 0.03)',
  },
  ringSlot: {
    width: 116,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgRing: {
    position: 'absolute',
  },
  hit: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
  },
  hitDesktop: {
    elevation: 4,
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  hitPressed: { opacity: 0.92 },
  gradient: {
    width: 116,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  labelCol: {
    minWidth: 0,
    alignItems: 'flex-start',
  },
  mainLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFF1F2',
    lineHeight: 13,
  },
  subLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    color: '#FECACA',
    lineHeight: 11,
  },
  iconShadow: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captionWrap: {
    marginTop: 6,
    width: 120,
    maxWidth: 120,
    alignItems: 'center',
  },
  caption: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    fontWeight: '800',
    color: '#FEE2E2',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    width: '100%',
  },
});
