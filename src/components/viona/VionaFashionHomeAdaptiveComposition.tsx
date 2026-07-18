import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import type { FashionHomeShellMode } from '../../navigation/fashionHomeShellMode';

export type VionaFashionHomeAdaptiveCompositionProps = Readonly<{
  /** Phase-B web modes only — never `desktop` / `legacy`. */
  mode: Extract<FashionHomeShellMode, 'mobile' | 'tablet'>;
  brandLabel: string;
  greetingLine1: string;
  greetingWish: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: ImageSourcePropType;
  heroA11yLabel: string;
  style?: ViewStyle;
  /** Optional world-card / strip slot below the opening stage. */
  children?: React.ReactNode;
}>;

/**
 * Phase B — adaptive Fashion-Tech Home opening for mobile/tablet **web**.
 *
 * Does not own SOS / Account / Language (global shell hosts remain exact-one).
 * Does not mount the desktop command bar. Safe cover-crop of approved master assets.
 */
export function VionaFashionHomeAdaptiveComposition({
  mode,
  brandLabel,
  greetingLine1,
  greetingWish,
  eyebrow,
  title,
  subtitle,
  heroImage,
  heroA11yLabel,
  style,
  children,
}: VionaFashionHomeAdaptiveCompositionProps) {
  const isTablet = mode === 'tablet';
  const heroHeight = isTablet ? 220 : 188;

  return (
    <View
      testID="viona-fashion-home-adaptive-composition"
      accessibilityLabel={`VIONA Fashion Home ${mode}`}
      style={[styles.root, style]}
    >
      <View style={styles.identityRow} accessibilityRole="header">
        <Text style={styles.brand} numberOfLines={1}>
          {brandLabel}
        </Text>
        <View style={styles.greetingCol}>
          <Text style={styles.greetingLine} numberOfLines={1}>
            {greetingLine1}
          </Text>
          <Text style={styles.greetingWish} numberOfLines={2}>
            {greetingWish}
          </Text>
        </View>
      </View>

      <View
        style={[styles.heroShell, { minHeight: heroHeight }]}
        accessibilityRole="image"
        accessibilityLabel={heroA11yLabel}
      >
        <Image source={heroImage} resizeMode="cover" style={styles.heroImage} />
        <LinearGradient
          colors={['rgba(6, 8, 14, 0.15)', 'rgba(6, 8, 14, 0.72)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eyebrow}
          </Text>
          <Text style={[styles.title, isTablet && styles.titleTablet]} numberOfLines={3}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={isTablet ? 3 : 4}>
            {subtitle}
          </Text>
        </View>
      </View>

      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: vionaTokens.spacing[12],
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[4],
  },
  brand: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    letterSpacing: 1.2,
    color: vionaTokens.fashionTech.champagne,
    paddingTop: 2,
  },
  greetingCol: {
    flex: 1,
    minWidth: 0,
  },
  greetingLine: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: vionaTokens.fashionTech.textPrimary,
  },
  greetingWish: {
    marginTop: 2,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: vionaTokens.fashionTech.textSecondary,
  },
  heroShell: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0B0E16',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroCopy: {
    paddingHorizontal: vionaTokens.spacing[16],
    paddingBottom: vionaTokens.spacing[16],
    paddingTop: vionaTokens.spacing[48],
    gap: 6,
  },
  eyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: vionaTokens.fashionTech.champagne,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: '#F7F3EA',
  },
  titleTablet: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(247, 243, 234, 0.86)',
  },
  childrenSlot: {
    marginTop: vionaTokens.spacing[4],
  },
});
