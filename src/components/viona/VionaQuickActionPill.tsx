import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import {
  FASHION_HOME_GLOW_CYAN,
  FASHION_HOME_GLOW_GOLD,
} from './fashionHomeDesktopShell';
import { FontFamily } from '../../theme/typography';

type QuickAccent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'blue' | 'sos';

export type VionaQuickActionPillProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accent?: QuickAccent;
  /** Stretch to fill a grid cell on wide desktop rows. */
  fill?: boolean;
}>;

const accentColor: Record<QuickAccent, string> = {
  gold: vionaTokens.fashionTech.accentGold,
  cyan: vionaTokens.fashionTech.accentCyan,
  emerald: vionaTokens.fashionTech.accentEmerald,
  violet: vionaTokens.fashionTech.accentViolet,
  blue: vionaTokens.fashionTech.statusLite,
  sos: vionaTokens.fashionTech.sosNeon,
};

const accentGlow: Record<QuickAccent, string> = {
  gold: FASHION_HOME_GLOW_GOLD,
  cyan: FASHION_HOME_GLOW_CYAN,
  emerald: 'rgba(88, 214, 168, 0.12)',
  violet: 'rgba(176, 140, 255, 0.12)',
  blue: 'rgba(120, 196, 255, 0.12)',
  sos: 'rgba(255, 92, 108, 0.12)',
};

export function VionaQuickActionPill({
  label,
  icon,
  onPress,
  accent = 'gold',
  fill = false,
}: VionaQuickActionPillProps): ReactElement {
  const tone = accentColor[accent];
  const isSos = accent === 'sos';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fill && styles.baseFill,
        {
          borderColor: isSos ? vionaTokens.fashionTech.sosNeonGlow : `${tone}ea`,
          shadowColor: accentGlow[accent],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 3,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, { backgroundColor: isSos ? 'rgba(255, 92, 108, 0.2)' : `${tone}22` }]}>
        <Ionicons name={icon} size={15} color={tone} />
      </View>
      <Text style={[styles.label, isSos && styles.labelSos]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 36,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 0,
    backgroundColor: 'rgba(8, 12, 20, 0.72)',
    elevation: 1,
  },
  baseFill: {
    width: '100%',
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
  },
  labelSos: {
    color: vionaTokens.fashionTech.sosNeon,
  },
});
