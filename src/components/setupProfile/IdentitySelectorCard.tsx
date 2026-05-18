import { useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import {
  VIONA_ACCOUNT_ROLE_ACCENTS,
  VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY,
  VIONA_IDENTITY_SETUP_NEON,
  vionaAccountRoleGlow,
  vionaAccountRoleStroke,
} from '../viona/globalLightNetworkTokens';

const GLN = VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY;

export type IdentitySelectorAccent = 'cyan' | 'emerald' | 'violet';

export type IdentitySelectorCardProps = Readonly<{
  kicker: string;
  valueLine: string;
  accent: IdentitySelectorAccent;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
}>;

export function IdentitySelectorCard({
  kicker,
  valueLine,
  accent,
  onPress,
  testID,
  accessibilityLabel,
}: IdentitySelectorCardProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const ink = VIONA_ACCOUNT_ROLE_ACCENTS[accent].ink;
  const stroke = vionaAccountRoleStroke(accent, hovered);
  const glow = vionaAccountRoleGlow(accent, hovered);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${kicker}. ${valueLine}`}
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.pressOuter,
        Platform.OS === 'web' && hovered && styles.pressOuterHover,
        Platform.OS === 'web' && styles.pressOuterWeb,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View
        style={[
          styles.surface,
          {
            borderColor: stroke,
            backgroundColor: hovered
              ? VIONA_IDENTITY_SETUP_NEON.selectorGlassHover
              : VIONA_IDENTITY_SETUP_NEON.selectorGlass,
            shadowColor: glow,
            shadowOpacity: hovered ? 0.52 : 0.3,
            shadowRadius: hovered ? 16 : 9,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.dot, { backgroundColor: ink, shadowColor: glow }]} />
          <Text style={styles.kicker}>{kicker}</Text>
        </View>
        <Text style={styles.value} numberOfLines={2}>
          {valueLine}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressOuter: {
    alignSelf: 'stretch',
    width: '100%',
    minWidth: 0,
  },
  pressOuterHover:
    Platform.OS === 'web' ? ({ transform: [{ translateY: -2 }] } as ViewStyle) : ({} as ViewStyle),
  pressOuterWeb:
    Platform.OS === 'web'
      ? ({
          transitionProperty: 'transform, opacity',
          transitionDuration: `${VIONA_IDENTITY_SETUP_NEON.transitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {},
  surface: {
    borderRadius: 14,
    borderWidth: 1.15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 78,
    justifyContent: 'center',
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 2,
  },
  kicker: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    color: GLN.label,
  },
  value: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.semibold,
    color: GLN.titleIvory,
  },
});
