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
const TRANSITION_MS = 165;

/** Academy hub semantic accents — violet-led learning universe. */
export type AcademyGlassAccent = 'violet' | 'cyan' | 'gold' | 'emerald';

export type AcademyGlassCardProps = Readonly<{
  accent: AcademyGlassAccent;
  title: string;
  status: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}>;

export function AcademyGlassCard({
  accent,
  title,
  status,
  body,
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
  const a11y = accessibilityLabel ?? `${title}. ${body}`;

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
          <View style={styles.header}>
            <View style={[styles.iconCapsule, { borderColor: stroke, shadowColor: glow }]}>
              <Ionicons name={icon} size={20} color={tokens.ink} accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <View style={[styles.statusPill, { borderColor: stroke, backgroundColor: tokens.fillHover }]}>
                <Text style={[styles.statusText, { color: tokens.ink }]} numberOfLines={1}>
                  {status}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.body} numberOfLines={4}>
            {body}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={hovered ? tokens.ink : 'rgba(210, 208, 230, 0.55)'}
            style={styles.chevron}
            accessibilityIgnoresInvertColors
          />
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
  },
  pressOuterHover:
    Platform.OS === 'web' ? ({ transform: [{ translateY: -2 }] } as ViewStyle) : ({} as ViewStyle),
  frame: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1.1,
    overflow: 'hidden',
    minHeight: 136,
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
    padding: 14,
    paddingBottom: 12,
    minHeight: 136,
  },
  edge: {
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCapsule: {
    width: 40,
    height: 40,
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
  titleBlock: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: FontFamily.extrabold,
    color: GLN.titleIvory,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  body: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: GLN.bodyMuted,
    paddingRight: 18,
  },
  chevron: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
});
