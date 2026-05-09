/**
 * SOS hold-to-activate **UI stub** (AF pack).
 *
 * TODO (future, not in this pack): Wire to production-safe emergency flow after legal review,
 * regional emergency number database, consent, and explicit device permissions. Do not enable
 * background recording, auto-dispatch claims, or unreviewed voice pipelines from this component alone.
 */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../i18n';

const DEFAULT_HOLD_MS = 3000;
const TICK_MS = 40;

export type VionaSosHoldButtonProps = Readonly<{
  /** Total press duration required to fire `onHoldComplete`. */
  holdDurationMs?: number;
  onHoldComplete: () => void;
  disabled?: boolean;
}>;

export function VionaSosHoldButton({
  holdDurationMs = DEFAULT_HOLD_MS,
  onHoldComplete,
  disabled = false,
}: VionaSosHoldButtonProps): ReactElement {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAtRef = useRef<number>(0);
  const completedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const finishHold = useCallback(() => {
    if (completedRef.current || disabled) return;
    completedRef.current = true;
    clearTimer();
    setProgress(1);
    onHoldComplete();
  }, [clearTimer, disabled, onHoldComplete]);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    completedRef.current = false;
    startAtRef.current = Date.now();
    setProgress(0);
    clearTimer();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startAtRef.current;
      const p = Math.min(1, elapsed / holdDurationMs);
      setProgress(p);
      if (p >= 1) {
        finishHold();
      }
    }, TICK_MS);
  }, [clearTimer, disabled, finishHold, holdDurationMs]);

  const onPressOut = useCallback(() => {
    if (completedRef.current) return;
    clearTimer();
    setProgress(0);
  }, [clearTimer]);

  const secondsLeft = Math.max(0, Math.ceil((1 - progress) * (holdDurationMs / 1000)));
  const showCountdown = progress > 0 && progress < 1;

  return (
    <View style={styles.wrap} accessibilityLabel={t('sos.holdA11y')}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={({ pressed }) => [styles.holdTarget, disabled && styles.disabled, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityHint={t('sos.holdHelper')}
      >
        <View style={styles.iconRing}>
          <Ionicons name="shield" size={32} color={vionaTokens.fashionTech.sosNeon} />
        </View>
        <Text style={styles.sosMark}>{t('sos.chip')}</Text>
        <Text style={styles.helper}>{t('sos.holdHelper')}</Text>
        {showCountdown ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{secondsLeft}</Text>
          </View>
        ) : null}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: vionaTokens.spacing[8],
  },
  holdTarget: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingVertical: vionaTokens.spacing[20],
    paddingHorizontal: vionaTokens.spacing[16],
    borderRadius: vionaTokens.radius.xl,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.sosNeonGlow,
    backgroundColor: 'rgba(32, 8, 12, 0.72)',
    shadowColor: vionaTokens.fashionTech.sosNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  pressed: {
    opacity: 0.96,
  },
  disabled: {
    opacity: 0.45,
  },
  iconRing: {
    marginBottom: vionaTokens.spacing[8],
  },
  sosMark: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    letterSpacing: 3,
    color: vionaTokens.fashionTech.sosNeon,
    textShadowColor: vionaTokens.fashionTech.sosNeonGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  helper: {
    marginTop: vionaTokens.spacing[8],
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 19,
    color: vionaTokens.fashionTech.mutedOnDark,
    textAlign: 'center',
  },
  countPill: {
    marginTop: vionaTokens.spacing[12],
    minWidth: 40,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 108, 0.55)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  countText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    color: vionaTokens.fashionTech.sosNeon,
    textAlign: 'center',
  },
  track: {
    marginTop: vionaTokens.spacing[16],
    height: 4,
    width: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: vionaTokens.fashionTech.sosNeon,
  },
});
