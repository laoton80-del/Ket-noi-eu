import type { ReactElement } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import {
  VIONA_GLOBAL_LIGHT_NETWORK_LOGO,
  type VionaGlobalLightNetworkLogoVariant,
} from './globalLightNetworkTokens';

const LOGO_IMAGE = require('../../../assets/brand/viona/logo-in-app.png');

export type VionaBrandLockupVariant = VionaGlobalLightNetworkLogoVariant;

export type VionaBrandLockupProps = Readonly<{
  variant?: VionaBrandLockupVariant;
  subtitle?: string;
  eyebrow?: string;
  showAccentUnderline?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function VionaBrandLockup({
  variant = 'header',
  subtitle,
  eyebrow,
  showAccentUnderline = false,
  onPress,
  accessibilityLabel = 'VIONA',
  style,
}: VionaBrandLockupProps): ReactElement {
  const spec = resolveVariantSpec(variant);
  const caption = subtitle ?? eyebrow;
  const content = (
    <View style={[styles.wrap, style]} accessibilityRole={onPress ? undefined : 'text'} accessibilityLabel={accessibilityLabel}>
      {variant === 'iconOnly' ? (
        <Image
          source={LOGO_IMAGE}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={[
            styles.iconOnlyImage,
            {
              width: spec.imageWidth,
              height: spec.imageHeight,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.wordmark,
            {
              fontSize: spec.fontSize,
              letterSpacing: spec.letterSpacing,
              color: spec.ink,
              textShadowColor: spec.glow,
              textShadowRadius: spec.glowRadius,
              textShadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          VIONA
        </Text>
      )}
      {caption ? (
        <Text style={[styles.subtitle, { color: VIONA_GLOBAL_LIGHT_NETWORK_LOGO.wordmarkMuted }]} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
      {showAccentUnderline ? <View style={styles.accentUnderline} /> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function resolveVariantSpec(variant: VionaBrandLockupVariant) {
  const logo = VIONA_GLOBAL_LIGHT_NETWORK_LOGO;
  switch (variant) {
    case 'hero':
      return {
        fontSize: logo.heroFontSize,
        letterSpacing: logo.heroLetterSpacing,
        ink: logo.wordmarkIvory,
        glow: logo.glowIvory,
        glowRadius: logo.heroGlowRadiusPx,
        imageWidth: 248,
        imageHeight: 56,
      };
    case 'compact':
      return {
        fontSize: logo.compactFontSize,
        letterSpacing: logo.compactLetterSpacing,
        ink: logo.wordmarkGold,
        glow: logo.glowGold,
        glowRadius: logo.compactGlowRadiusPx,
        imageWidth: logo.iconOnlyImageWidthPx,
        imageHeight: logo.iconOnlyImageHeightPx,
      };
    case 'iconOnly':
      return {
        fontSize: logo.compactFontSize,
        letterSpacing: logo.compactLetterSpacing,
        ink: logo.wordmarkGold,
        glow: logo.glowGold,
        glowRadius: logo.iconOnlyGlowRadiusPx,
        imageWidth: logo.iconOnlyImageWidthPx,
        imageHeight: logo.iconOnlyImageHeightPx,
      };
    case 'header':
    default:
      return {
        fontSize: logo.headerFontSize,
        letterSpacing: logo.headerLetterSpacing,
        ink: logo.wordmarkIvory,
        glow: logo.glowGold,
        glowRadius: logo.headerGlowRadiusPx,
        imageWidth: 214,
        imageHeight: 44,
      };
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    gap: 4,
  },
  wordmark: {
    fontFamily: FontFamily.extrabold,
    textTransform: 'uppercase',
    includeFontPadding: false,
    ...(Platform.OS === 'web'
      ? ({
          transitionProperty: 'color, text-shadow',
          transitionDuration: `${VIONA_GLOBAL_LIGHT_NETWORK_LOGO.transitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {}),
  },
  subtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: VIONA_GLOBAL_LIGHT_NETWORK_LOGO.subtitleFontSize,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    maxWidth: '100%',
  },
  accentUnderline: {
    alignSelf: 'flex-start',
    width: 44,
    height: 1,
    borderRadius: 1,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_LOGO.accentUnderline,
    marginTop: 2,
  },
  iconOnlyImage: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
  },
});
