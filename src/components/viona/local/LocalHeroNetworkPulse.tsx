/**
 * LocalHeroNetworkPulse — one or two semantic light pulses that travel ALONG the Local dynamic
 * hero's light-network polyline on hover (web/desktop only).
 *
 * Approach (VIONA.WAVE_3B.LOCAL_DYNAMIC_HERO_HOVER_NETWORK_PULSE):
 * - Does NOT animate the baked raster image. This is a separate overlay layer above the image and
 *   the static network edge, below the hero copy.
 * - A pulse is a small accent-glow dot whose position is interpolated across the SAME vertices used
 *   by `LocalLightingNetworkEdge` (lower-right), so the light follows the network path — not random
 *   motion. Transform + opacity only → runs on the native driver, cheap, no layout shift.
 * - `pointerEvents: none`, clipped by the hero frame (parent overflow hidden).
 * - Disabled entirely under reduced motion (parent keeps the subtle glow/opacity change instead).
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

/** Network polyline vertices as fractions of the frame (matches LocalLightingNetworkEdge MAIN_PATH). */
const VERTICES = [
  { x: 0.96, y: 0.38 },
  { x: 0.91, y: 0.6 },
  { x: 0.82, y: 0.79 },
  { x: 0.69, y: 0.9 },
  { x: 0.52, y: 0.96 },
] as const;

const INPUT_RANGE = [0, 0.25, 0.5, 0.75, 1];

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith('#') || (color.length !== 7 && color.length !== 4)) return color;
  const hex =
    color.length === 4
      ? color
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type LocalHeroNetworkPulseProps = Readonly<{
  accent: string;
  secondaryAccent?: string;
  /** Hover active (already gated to web desktop pointer by the parent). */
  active: boolean;
  reducedMotion: boolean;
  durationMs?: number;
  testID?: string;
}>;

export function LocalHeroNetworkPulse({
  accent,
  secondaryAccent,
  active,
  reducedMotion,
  durationMs = 1900,
  testID,
}: LocalHeroNetworkPulseProps): ReactElement | null {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const progress = useRef(new Animated.Value(0)).current;
  const progress2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reducedMotion || size.w === 0) {
      progress.stopAnimation();
      progress.setValue(0);
      progress2.stopAnimation();
      progress2.setValue(0);
      return;
    }
    const makeLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: durationMs,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(Math.round(durationMs * 0.4)),
        ])
      );
    const a1 = makeLoop(progress, 0);
    const a2 = makeLoop(progress2, Math.round(durationMs * 0.6));
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [active, reducedMotion, size.w, size.h, durationMs, progress, progress2]);

  if (reducedMotion) return null;

  const translateX = (value: Animated.Value) =>
    value.interpolate({ inputRange: INPUT_RANGE, outputRange: VERTICES.map((p) => p.x * size.w) });
  const translateY = (value: Animated.Value) =>
    value.interpolate({ inputRange: INPUT_RANGE, outputRange: VERTICES.map((p) => p.y * size.h) });
  const envelope = (value: Animated.Value) =>
    value.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 1, 1, 0] });

  const renderDot = (value: Animated.Value, color: string) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          backgroundColor: color,
          shadowColor: color,
          opacity: active ? envelope(value) : 0,
          transform: [{ translateX: translateX(value) }, { translateY: translateY(value) }],
        },
      ]}
    />
  );

  return (
    <View
      pointerEvents="none"
      testID={testID}
      style={StyleSheet.absoluteFill}
      onLayout={(e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
      }}
    >
      {size.w > 0 ? renderDot(progress, withAlpha(accent, 0.95)) : null}
      {size.w > 0 ? renderDot(progress2, withAlpha(secondaryAccent ?? accent, 0.9)) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});
