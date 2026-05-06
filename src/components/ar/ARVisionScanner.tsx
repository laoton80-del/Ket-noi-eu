import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function ARVisionScanner() {
  const { screenWidth, screenHeight } = useDeviceLayout();
  const scannerWidth = Math.min(screenWidth * 0.78, 420);
  const scannerHeight = Math.min(screenHeight * 0.42, 280);

  const scanProgress = useSharedValue(0);

  useEffect(() => {
    scanProgress.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
  }, [scanProgress]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanProgress.value * (scannerHeight - 6) }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.overlay} />

      <View style={[styles.scannerWindow, { width: scannerWidth, height: scannerHeight }]}>
        <Animated.View style={StyleSheet.flatten([styles.laser, laserStyle])} />
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Chỉa camera vào văn bản để dịch lập tức</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay.dim,
  },
  scannerWindow: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  laser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  badgeText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
});
