import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../viona/fashionHomeDesktopShell';
import {
  VIONA_ACCOUNT_NEON_GLASS,
  vionaAccountCornerWash,
  vionaAccountRoleGlow,
  vionaAccountRoleStroke,
  type VionaAccountNeonRole,
} from '../viona/globalLightNetworkTokens';

export type AccountNeonGlassTier = 'default' | 'elevated' | 'identity';

export type AccountNeonGlassPanelProps = Readonly<{
  role: VionaAccountNeonRole;
  tier?: AccountNeonGlassTier;
  hovered?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}>;

export function AccountNeonGlassPanel({
  role,
  tier = 'default',
  hovered = false,
  radius = 16,
  style,
  contentStyle,
  children,
}: AccountNeonGlassPanelProps): ReactElement {
  const stroke = vionaAccountRoleStroke(role, hovered);
  const glow = vionaAccountRoleGlow(role, hovered);
  const wash = vionaAccountCornerWash(role, hovered);

  let surface: string;
  if (tier === 'identity') {
    surface = hovered ? VIONA_ACCOUNT_NEON_GLASS.panelIdentityHover : VIONA_ACCOUNT_NEON_GLASS.panelIdentity;
  } else if (tier === 'elevated') {
    surface = hovered ? VIONA_ACCOUNT_NEON_GLASS.panelHover : VIONA_ACCOUNT_NEON_GLASS.panelElevated;
  } else {
    surface = hovered ? VIONA_ACCOUNT_NEON_GLASS.panelHover : VIONA_ACCOUNT_NEON_GLASS.panelDefault;
  }

  const tint = hovered ? VIONA_ACCOUNT_NEON_GLASS.glassTintHover : VIONA_ACCOUNT_NEON_GLASS.glassTint;
  const shadowOpacity = hovered ? VIONA_ACCOUNT_NEON_GLASS.shadowOpacityHover : VIONA_ACCOUNT_NEON_GLASS.shadowOpacityDefault;
  const shadowRadius = hovered ? VIONA_ACCOUNT_NEON_GLASS.shadowRadiusHover : VIONA_ACCOUNT_NEON_GLASS.shadowRadiusDefault;
  const lift = hovered ? VIONA_ACCOUNT_NEON_GLASS.shadowLiftHover : VIONA_ACCOUNT_NEON_GLASS.shadowLiftDefault;

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
          backgroundColor: surface,
          shadowColor: glow,
          shadowOpacity,
          shadowRadius,
          shadowOffset: { width: 0, height: lift },
          elevation: hovered ? 5 : 2,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: `blur(${VIONA_ACCOUNT_NEON_GLASS.backdropBlurPx}px)`,
              WebkitBackdropFilter: `blur(${VIONA_ACCOUNT_NEON_GLASS.backdropBlurPx}px)`,
              transitionProperty: 'box-shadow, background-color, backdrop-filter, -webkit-backdrop-filter',
              transitionDuration: `${VIONA_ACCOUNT_NEON_GLASS.transitionMs}ms`,
              transitionTimingFunction: 'ease-out',
            } as ViewStyle)
          : null,
        style,
      ]}
    >
      <View pointerEvents="none" style={[styles.tint, { borderRadius: radius, backgroundColor: tint }]} />
      <View pointerEvents="none" style={[styles.cornerWash, { borderTopLeftRadius: radius, opacity: hovered ? 0.52 : 0.38 }]}>
        <LinearGradient
          colors={[wash, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.bottomDepth, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius, opacity: hovered ? 0.48 : 0.36 }]}
      >
        <LinearGradient
          colors={['transparent', VIONA_ACCOUNT_NEON_GLASS.bottomDepth]}
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
            backgroundColor: stroke,
            opacity: hovered ? 0.48 : 0.34,
          },
        ]}
      />
      <View style={[styles.content, { borderRadius: radius }, contentStyle]}>{children}</View>
      <View style={[premiumFrameEdgeOverlay(radius), premiumCrispEdgeStroke(stroke), styles.edge]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 76,
    height: 54,
  },
  bottomDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '44%',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
  },
  content: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  edge: {
    pointerEvents: 'none',
  },
});
