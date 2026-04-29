import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

function RadarRing({ phase }: { phase: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2400 }), -1, false);
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => {
    const p = (progress.value + phase) % 1;
    return {
      opacity: interpolate(p, [0, 0.7, 1], [0.45, 0.18, 0]),
      transform: [{ scale: interpolate(p, [0, 1], [0.2, 1.1]) }],
    };
  });

  return <Animated.View style={StyleSheet.flatten([styles.ring, ringStyle])} />;
}

export function MeshRadar() {
  const netInfo = useNetInfo();
  const offline = netInfo.isConnected === false;

  if (!offline) return null;

  return (
    <View style={styles.container}>
      <View style={styles.radarWrap}>
        <RadarRing phase={0} />
        <RadarRing phase={0.33} />
        <RadarRing phase={0.66} />
        <View style={styles.centerDot} />
      </View>
      <Text style={styles.label}>Đang dò tìm người dùng Kết Nối Global quanh bạn qua Bluetooth...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  radarWrap: {
    width: 140,
    height: 140,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.glass.surface,
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.signalStrong,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.success,
  },
  label: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
