import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type RadarScannerProps = {
  active: boolean;
  height: number;
  durationMs?: number;
};

export function RadarScanner({ active, height, durationMs = 1300 }: RadarScannerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withTiming(1, {
          duration: durationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      return;
    }
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 200 });
  }, [active, durationMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * (height - 10) }],
    opacity: active ? 0.95 : 0,
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.line, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(226, 92, 92, 0.76)',
    shadowColor: '#E25C5C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 3,
  },
});
