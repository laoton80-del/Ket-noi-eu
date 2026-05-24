import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../viona/fashionHomeDesktopShell';
import {
  VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE,
  VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY,
  vionaAccountCornerWash,
  vionaAccountRoleGlow,
  vionaAccountRoleStroke,
  VIONA_ACCOUNT_ROLE_ACCENTS,
  type VionaAccountNeonRole,
} from '../viona/globalLightNetworkTokens';

const GLN = VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY;
const INK_SUB = 'rgba(210, 208, 230, 0.78)';
const TRANSITION_MS = 165;

/** Academy hub semantic accents — violet-led learning universe. */
export type AcademyGlassAccent = 'violet' | 'cyan' | 'gold' | 'emerald';

export type AcademyGlassCardProps = Readonly<{
  accent: AcademyGlassAccent;
  title: string;
  status: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}>;

export function AcademyGlassCard({
  accent,
  title,
  status,
  subtitle,
  icon,
  onPress,
  accessibilityLabel,
  testID,
}: AcademyGlassCardProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const role: VionaAccountNeonRole = accent;
  const tokens = VIONA_ACCOUNT_ROLE_ACCENTS[role];
  const stroke = vionaAccountRoleStroke(role, hovered);
  const glow = vionaAccountRoleGlow(role, hovered);
  const wash = vionaAccountCornerWash(role, hovered);
  const a11y = accessibilityLabel ?? `${title}. ${subtitle}`;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.pressOuter,
        Platform.OS === 'web' && hovered && styles.pressOuterHover,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View
        style={[
          styles.frame,
          {
            borderColor: stroke,
            backgroundColor: hovered
              ? VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE.hoverFill
              : VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE.defaultFill,
            shadowColor: glow,
            shadowOpacity: hovered ? 0.48 : 0.28,
            shadowRadius: hovered ? 14 : 8,
            shadowOffset: { width: 0, height: hovered ? 3 : 1 },
            elevation: hovered ? 3 : 1,
          },
          Platform.OS === 'web'
            ? ({
                backdropFilter: `blur(${hovered ? VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE.backdropBlurWebHover : VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE.backdropBlurWebDefault}px)`,
                WebkitBackdropFilter: `blur(${hovered ? VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE.backdropBlurWebHover : VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE.backdropBlurWebDefault}px)`,
                transitionProperty: 'box-shadow, border-color, background-color, backdrop-filter',
                transitionDuration: `${TRANSITION_MS}ms`,
                transitionTimingFunction: 'ease-out',
              } as ViewStyle)
            : null,
        ]}
      >
        <View pointerEvents="none" style={styles.tint} accessibilityElementsHidden />
        <View
          pointerEvents="none"
          style={[styles.cornerWash, { opacity: hovered ? 0.5 : 0.36 }]}
          accessibilityElementsHidden
        >
          <LinearGradient colors={[wash, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.ambientGlow, { backgroundColor: tokens.fillPressed }]}
          accessibilityElementsHidden
        />
        <View style={styles.content}>
          <View style={styles.iconRow}>
            <View style={[styles.iconCapsule, { borderColor: stroke, shadowColor: glow }]}>
              <Ionicons name={icon} size={22} color={tokens.ink} accessibilityIgnoresInvertColors />
            </View>
            <Text style={[styles.statusPill, { color: tokens.ink, borderColor: stroke }]} numberOfLines={1}>
              {status}
            </Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={[premiumFrameEdgeOverlay(16), premiumCrispEdgeStroke(stroke), styles.edge]} pointerEvents="none" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressOuter: {
    width: '100%',
    minWidth: 0,
    minHeight: 44,
  },
  pressOuterHover:
    Platform.OS === 'web' ? ({ transform: [{ translateY: -2 }] } as ViewStyle) : ({} as ViewStyle),
  frame: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1.1,
    overflow: 'hidden',
    minHeight: 108,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(148, 163, 184, 0.018)',
  },
  cornerWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 52,
    borderTopLeftRadius: 16,
  },
  ambientGlow: {
    position: 'absolute',
    right: -12,
    top: -8,
    width: 88,
    height: 88,
    borderRadius: 44,
    opacity: 0.35,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 108,
    gap: 10,
    justifyContent: 'flex-start',
  },
  edge: {
    pointerEvents: 'none',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: 44,
  },
  iconCapsule: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 8, 18, 0.55)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 2,
  },
  statusPill: {
    flexShrink: 1,
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  textBlock: {
    width: '100%',
    gap: 4,
    minWidth: 0,
  },
  title: {
    width: '100%',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: FontFamily.extrabold,
    color: GLN.titleIvory,
    letterSpacing: -0.16,
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    opacity: 0.94,
  },
});
