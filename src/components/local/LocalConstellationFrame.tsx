import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { premiumCrispEdgeStroke, premiumFrameEdgeOverlay } from '../viona/fashionHomeDesktopShell';
import {
  localAccentGlow,
  localAccentStroke,
  localAccentStrokeHover,
  localCardBackdropBlur,
  localCardGlassTint,
  localCardSurfaceFill,
  localConstellation,
  localNativeConstellationEdgeStyle,
  localWebConstellationGlassStyle,
  type LocalConstellationAccent,
  type LocalNetworkCardTier,
} from './localConstellationTokens';

export type LocalConstellationFrameProps = Readonly<{
  children: ReactNode;
  accent?: LocalConstellationAccent;
  tier?: LocalNetworkCardTier;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  cinematicVeil?: boolean;
  hovered?: boolean;
}>;

export function LocalConstellationFrame({
  children,
  accent = 'emerald',
  tier = 'service',
  radius = 16,
  style,
  contentStyle,
  cinematicVeil = false,
  hovered = false,
}: LocalConstellationFrameProps): ReactElement {
  const stroke = hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent);
  const slabFill = localCardSurfaceFill(tier, hovered);
  const glassTint = localCardGlassTint(tier, hovered);
  const backdropBlur = localCardBackdropBlur(tier, hovered);
  const cornerGlint = localAccentGlow(accent, hovered);
  const webGlass = Platform.OS === 'web' ? localWebConstellationGlassStyle(accent, hovered) : null;
  const nativeEdge = Platform.OS !== 'web' ? localNativeConstellationEdgeStyle(accent) : null;

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
        },
        Platform.OS === 'web' ? styles.frameWeb : nativeEdge,
        webGlass,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.glassBackdrop,
          {
            borderRadius: radius,
            backgroundColor: slabFill,
          },
          Platform.OS === 'web'
            ? ({
                backdropFilter: `blur(${backdropBlur}px)`,
                WebkitBackdropFilter: `blur(${backdropBlur}px)`,
                transitionProperty: 'background-color, backdrop-filter, -webkit-backdrop-filter',
                transitionDuration: `${localConstellation.cardHoverTransitionMs}ms`,
                transitionTimingFunction: 'ease-out',
              } as ViewStyle)
            : null,
        ]}
      />
      <View pointerEvents="none" style={[styles.glassTint, { backgroundColor: glassTint, borderRadius: radius }]} />
      <View style={[styles.content, { borderRadius: radius }, contentStyle]}>
        <View
          pointerEvents="none"
          style={[
            styles.cornerGlint,
            {
              borderTopLeftRadius: radius,
              opacity: hovered ? 0.22 : 0.14,
            },
          ]}
        >
          <LinearGradient
            colors={[cornerGlint, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.bottomDepth,
            {
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
              opacity: hovered ? 0.32 : 0.24,
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(3, 10, 22, 0.48)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.topHighlight,
            {
              opacity: hovered ? 0.55 : 0.38,
            },
          ]}
        />
        {cinematicVeil ? (
          <LinearGradient
            pointerEvents="none"
            colors={[localConstellation.hubVeilTop, localConstellation.hubVeilBottom]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.veil, { borderRadius: radius }]}
          />
        ) : null}
        {children}
      </View>
      {Platform.OS !== 'web' ? (
        <View style={[premiumFrameEdgeOverlay(radius), premiumCrispEdgeStroke(stroke), styles.edge]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  frameWeb:
    Platform.OS === 'web'
      ? ({
          transitionProperty: 'box-shadow, transform, opacity',
          transitionDuration: `${localConstellation.cardHoverTransitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {},
  glassBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    zIndex: 2,
    position: 'relative',
  },
  cornerGlint: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 30,
  },
  bottomDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 248, 235, 0.5)',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
  edge: {
    pointerEvents: 'none',
  },
});
