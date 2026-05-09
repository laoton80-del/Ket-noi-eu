import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';

type QuickAccent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'sos';

export type VionaQuickActionPillProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accent?: QuickAccent;
  /** Stronger SOS framing (e.g. desktop home quick actions). */
  prominent?: boolean;
}>;

const accentColor: Record<QuickAccent, string> = {
  gold: vionaTokens.fashionTech.accentGold,
  cyan: vionaTokens.fashionTech.accentCyan,
  emerald: vionaTokens.fashionTech.accentEmerald,
  violet: vionaTokens.fashionTech.accentViolet,
  sos: vionaTokens.fashionTech.sosNeon,
};

export function VionaQuickActionPill({
  label,
  icon,
  onPress,
  accent = 'gold',
  prominent = false,
}: VionaQuickActionPillProps): ReactElement {
  const tone = accentColor[accent];
  const isSos = accent === 'sos';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderColor: isSos ? vionaTokens.fashionTech.sosNeonGlow : `${tone}99` },
        isSos && styles.baseSos,
        isSos && prominent && styles.baseSosProminent,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isSos ? 'rgba(255, 92, 108, 0.2)' : `${tone}22` },
          isSos && styles.iconWrapSos,
          isSos && prominent && styles.iconWrapSosProminent,
        ]}
      >
        <Ionicons name={icon} size={prominent && isSos ? 17 : 15} color={tone} />
      </View>
      <Text style={[styles.label, prominent && isSos && styles.labelProminent]}>{label}</Text>
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
  baseSos: {
    shadowColor: vionaTokens.fashionTech.sosNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  baseSosProminent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    shadowOpacity: 0.52,
    shadowRadius: 14,
    elevation: 6,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrapSos: {
    shadowColor: vionaTokens.fashionTech.sosNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  iconWrapSosProminent: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowOpacity: 0.58,
    shadowRadius: 8,
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
  labelProminent: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: vionaTokens.fashionTech.sosNeon,
  },
});
