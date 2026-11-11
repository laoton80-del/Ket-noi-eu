import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useHomeCommand } from '../../context/HomeCommandContext';
import { vionaCinematicTokens } from '../../design/vionaCinematicTokens';
import { useTranslation } from '../../i18n';
import { VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX } from '../../navigation/vionaBottomShellGeometry';

const HOLD_MS = 600;
const SIZE = 56;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function VionaSosFloatingHost(): ReactElement | null {
  const command = useHomeCommand();
  if (!command) return null;
  return <VionaSosFloatingButton onHoldComplete={command.triggerSafetyAssist} />;
}

function VionaSosFloatingButton({ onHoldComplete }: Readonly<{ onHoldComplete: () => void }>): ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearTick();
    startRef.current = null;
    firedRef.current = false;
    setProgress(0);
  }, [clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  const onPressIn = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    firedRef.current = false;
    startRef.current = Date.now();
    setProgress(0);
    clearTick();
    tickRef.current = setInterval(() => {
      const start = startRef.current;
      if (start == null) return;
      const next = Math.min(1, (Date.now() - start) / HOLD_MS);
      setProgress(next);
      if (next < 1 || firedRef.current) return;
      firedRef.current = true;
      clearTick();
      startRef.current = null;
      setProgress(0);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      onHoldComplete();
    }, 16);
  }, [clearTick, onHoldComplete]);

  const onPressOut = useCallback(() => {
    if (!firedRef.current) cancel();
  }, [cancel]);

  const bottom = Math.max(insets.bottom, 10) + VIONA_WEB_BOTTOM_TAB_BAR_HEIGHT_PX + 14;
  const right = Math.max(insets.right, 16);

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Pressable
        testID="viona-sos-floating"
        accessibilityRole="button"
        accessibilityLabel={t('sos.floatingA11y')}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.button, { bottom, right }]}
      >
        <Svg width={SIZE} height={SIZE} style={styles.ring} accessibilityElementsHidden>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#F3D9A6"
            strokeWidth={3}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            strokeLinecap="round"
            rotation={-90}
            originX={SIZE / 2}
            originY={SIZE / 2}
          />
        </Svg>
        <Text style={styles.label}>{t('sos.chip')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as const) : null),
  },
  button: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A3038',
    borderWidth: 2,
    borderColor: '#D4AF7C',
    shadowColor: '#D4AF7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  ring: { position: 'absolute', left: 0, top: 0 },
  label: {
    color: vionaCinematicTokens.color.ice,
    fontSize: 13,
    letterSpacing: 0.6,
    fontFamily: vionaCinematicTokens.fontFamily.semibold,
    fontWeight: '600',
  },
});
