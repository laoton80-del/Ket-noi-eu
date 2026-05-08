import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';

type QuickAccent = 'gold' | 'cyan' | 'emerald' | 'violet';

export type VionaQuickActionPillProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accent?: QuickAccent;
}>;

const accentColor: Record<QuickAccent, string> = {
  gold: vionaTokens.fashionTech.accentGold,
  cyan: vionaTokens.fashionTech.accentCyan,
  emerald: vionaTokens.fashionTech.accentEmerald,
  violet: vionaTokens.fashionTech.accentViolet,
};

export function VionaQuickActionPill({
  label,
  icon,
  onPress,
  accent = 'gold',
}: VionaQuickActionPillProps): ReactElement {
  const tone = accentColor[accent];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, { borderColor: `${tone}99` }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tone}22` }]}>
        <Ionicons name={icon} size={15} color={tone} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(10, 15, 24, 0.72)',
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
});
