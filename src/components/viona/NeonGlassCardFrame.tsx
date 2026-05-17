import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from './fashionHomeDesktopShell';
import {
  neonGlassAccentGlow,
  neonGlassAccentInk,
  neonGlassAccentStroke,
  neonGlassCard,
  neonGlassFamilyWash,
  neonGlassGlassTint,
  neonGlassSurfaceFill,
  neonGlassTierSpec,
  type NeonGlassCardTier,
  type NeonGlassColorFamily,
} from './neonGlassCardTokens';

export type NeonGlassCardFrameProps = Readonly<{
  children: ReactNode;
  tier?: NeonGlassCardTier;
  family?: NeonGlassColorFamily;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  hovered?: boolean;
  cinematicVeil?: boolean;
  veilTop?: string;
  veilBottom?: string;
}>;

export function NeonGlassCardFrame({
  children,
  tier = 'secondary',
  family = 'cyan',
  radius = 16,
  style,
  contentStyle,
  hovered = false,
  cinematicVeil = false,
  veilTop = 'rgba(94, 234, 212, 0.04)',
  veilBottom = 'rgba(5, 11, 20, 0)',
}: NeonGlassCardFrameProps): ReactElement {
  const tierSpec = neonGlassTierSpec(tier);
  const stroke = neonGlassAccentStroke(family, hovered);
  const ink = neonGlassAccentInk(family);
  const wash = neonGlassAccentGlow(family, hovered);
  const aura = neonGlassAccentGlow(family, hovered);
  const familyWash = neonGlassFamilyWash(family, hovered);
  const surfaceFill = neonGlassSurfaceFill(tier, hovered);
  const glassTint = neonGlassGlassTint(tier, hovered);

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
          backgroundColor: surfaceFill,
          shadowColor: ink,
          shadowOpacity: hovered ? tierSpec.shadowOpacityHover : tierSpec.shadowOpacityDefault,
          shadowRadius: hovered ? tierSpec.shadowRadiusHover : tierSpec.shadowRadiusDefault,
          shadowOffset: {
            width: 0,
            height: hovered ? tierSpec.shadowLiftHover : tierSpec.shadowLiftDefault,
          },
          elevation: hovered ? 5 : 2,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: `blur(${tierSpec.backdropBlur}px)`,
              WebkitBackdropFilter: `blur(${tierSpec.backdropBlur}px)`,
            } as ViewStyle)
          : null,
        Platform.OS === 'web' ? styles.frameWeb : null,
        style,
      ]}
    >
      <View pointerEvents="none" style={[styles.glassTint, { backgroundColor: glassTint, borderRadius: radius }]} />
      <View
        pointerEvents="none"
        style={[
          styles.familyAura,
          {
            borderRadius: radius,
            backgroundColor: familyWash,
            opacity: hovered ? tierSpec.familyAuraHover : tierSpec.familyAuraDefault,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.familyGlow,
          {
            borderRadius: radius,
            backgroundColor: aura,
            opacity: hovered ? tierSpec.familyGlowHover : tierSpec.familyGlowDefault,
          },
        ]}
      />
      <View style={[styles.content, { borderRadius: radius }, contentStyle]}>
        <View
          pointerEvents="none"
          style={[
            styles.cornerWash,
            {
              borderTopLeftRadius: radius,
              opacity: hovered ? tierSpec.cornerWashHover : tierSpec.cornerWashDefault,
            },
          ]}
        >
          <LinearGradient
            colors={[wash, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        {hovered ? (
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', wash, 'transparent']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={[
              styles.hoverSheen,
              {
                borderTopLeftRadius: radius,
                borderTopRightRadius: radius,
                opacity: tierSpec.hoverSheenOpacity,
              },
            ]}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            styles.topHighlight,
            {
              backgroundColor: ink,
              opacity: hovered ? tierSpec.topHighlightHover : tierSpec.topHighlightDefault,
            },
          ]}
        />
        {cinematicVeil ? (
          <LinearGradient
            pointerEvents="none"
            colors={[veilTop, veilBottom]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.veil, { borderRadius: radius }]}
          />
        ) : null}
        {children}
      </View>
      <View style={[premiumFrameEdgeOverlay(radius), premiumCrispEdgeStroke(stroke), styles.edge]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'hidden',
  },
  frameWeb:
    Platform.OS === 'web'
      ? ({
          transitionProperty: 'box-shadow, transform, opacity, background-color',
          transitionDuration: `${neonGlassCard.transitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {},
  glassTint: {
    ...StyleSheet.absoluteFillObject,
  },
  familyAura: {
    ...StyleSheet.absoluteFillObject,
  },
  familyGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  cornerWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 48,
  },
  hoverSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
  edge: {
    pointerEvents: 'none',
  },
});
