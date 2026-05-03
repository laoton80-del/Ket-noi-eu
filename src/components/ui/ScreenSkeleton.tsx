/**
 * Lightweight shimmer-style placeholders (no extra native deps) for React Query `isPending` / loading gates.
 */

import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const BAR_BG = 'rgba(255,255,255,0.08)';
const BAR_HI = 'rgba(255,255,255,0.18)';

function SkeletonBar({ style }: Readonly<{ style?: StyleProp<ViewStyle> }>): ReactElement {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [opacity]);
  return <Animated.View style={[styles.bar, { opacity }, style]} />;
}

export function ScreenSkeleton({
  rows = 6,
  style,
}: Readonly<{ rows?: number; style?: StyleProp<ViewStyle> }>): ReactElement {
  return (
    <View style={[styles.root, style]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonBar key={i} style={{ width: `${70 + ((i * 17) % 25)}%` }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, paddingVertical: 8 },
  bar: {
    height: 14,
    borderRadius: 8,
    backgroundColor: BAR_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BAR_HI,
  },
});
