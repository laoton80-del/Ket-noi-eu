import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { vionaPremium, vionaTrust } from '../../../components/viona/vionaTrustTokens';

const CHAMPAGNE_SPECULAR = 'rgba(200, 164, 77, 0.35)';
const RICH_ACRYLIC_BG = 'rgba(255, 255, 255, 0.82)';

export type AcrylicPlatinumCardProps = Readonly<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Corner radius for shell (default 20). */
  surfaceRadius?: number;
  /**
   * `minimal` — solid trust surface, thin border (default — less glass).
   * `rich` — legacy acrylic blur + specular (VIP moments only).
   */
  appearance?: 'minimal' | 'rich';
}>;

/**
 * Travel / hub card — default **minimal** (Clean Trust + restrained premium border).
 */
export function AcrylicPlatinumCard({
  children,
  style,
  contentStyle,
  surfaceRadius,
  appearance = 'minimal',
}: AcrylicPlatinumCardProps) {
  const r = surfaceRadius ?? 20;

  if (appearance === 'minimal') {
    return (
      <View style={[styles.minimalShell, { borderRadius: r }, style]}>
        <View style={[styles.minimalFace, { borderRadius: r }]}>
          <View style={[styles.minimalInner, contentStyle]}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.richShell, { borderRadius: r }, style]}>
      <View style={[styles.acrylicOuter, { borderRadius: r }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.acrylicTint} />
        <View style={[styles.acrylicInner, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  minimalShell: {
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  minimalFace: {
    borderWidth: 1,
    borderColor: vionaPremium.cardBorder,
    backgroundColor: vionaTrust.surface,
    overflow: 'hidden',
  },
  minimalInner: {
    padding: 16,
  },
  richShell: {
    shadowColor: 'rgba(10, 22, 40, 0.12)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
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
    backgroundColor: Platform.OS === 'android' ? RICH_ACRYLIC_BG : 'transparent',
  },
  acrylicTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: RICH_ACRYLIC_BG,
  },
  acrylicInner: {
    position: 'relative',
    zIndex: 1,
    padding: 16,
  },
});
