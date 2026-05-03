import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const ACRYLIC_BG = 'rgba(255, 255, 255, 0.72)';
const CHAMPAGNE_SPECULAR = 'rgba(212, 175, 55, 0.55)';

export type AcrylicPlatinumCardProps = Readonly<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Corner radius for shell + glass face (default 24). Use ~18–22 for pill chips. */
  surfaceRadius?: number;
}>;

/**
 * Luxury acrylic glass tile — pearl mesh stack, champagne specular on top/left, soft elevation.
 */
export function AcrylicPlatinumCard({ children, style, contentStyle, surfaceRadius }: AcrylicPlatinumCardProps) {
  const r = surfaceRadius ?? 24;
  return (
    <View style={[styles.elevationShell, { borderRadius: r }, style]}>
      <View style={[styles.acrylicOuter, { borderRadius: r }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.acrylicTint} />
        <View style={[styles.acrylicInner, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  elevationShell: {
    shadowColor: 'rgba(10, 22, 40, 0.18)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  acrylicOuter: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: CHAMPAGNE_SPECULAR,
    borderLeftColor: CHAMPAGNE_SPECULAR,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(5, 11, 20, 0.06)',
    borderBottomColor: 'rgba(5, 11, 20, 0.06)',
    backgroundColor: Platform.OS === 'android' ? ACRYLIC_BG : 'transparent',
  },
  acrylicTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ACRYLIC_BG,
  },
  acrylicInner: {
    position: 'relative',
    zIndex: 1,
    padding: 16,
  },
});
