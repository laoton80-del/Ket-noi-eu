import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';

export type VionaInfoTileProps = Readonly<{
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  lines: readonly string[];
  accent?: 'gold' | 'cyan' | 'violet';
  onPress?: () => void;
  rightSlot?: ReactNode;
  accessibilityLabel?: string;
}>;

const accentColor: Record<NonNullable<VionaInfoTileProps['accent']>, string> = {
  gold: vionaTokens.fashionTech.accentGold,
  cyan: vionaTokens.fashionTech.accentCyan,
  violet: vionaTokens.fashionTech.accentViolet,
};

export function VionaInfoTile({
  icon,
  title,
  lines,
  accent = 'gold',
  onPress,
  rightSlot,
  accessibilityLabel,
}: VionaInfoTileProps): ReactElement {
  const color = accentColor[accent];
  const body = (
    <View style={[styles.base, { borderColor: `${color}4d` }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}14` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line} numberOfLines={2}>
          {line}
        </Text>
      ))}
      {rightSlot}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: 100,
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(10, 14, 22, 0.78)',
    gap: 4,
  },
  pressed: {
    opacity: 0.9,
  },
  pressable: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.extrabold,
  },
  line: {
    fontSize: 11,
    lineHeight: 15,
    color: vionaTokens.fashionTech.textSecondary,
    fontFamily: FontFamily.medium,
    opacity: 0.94,
  },
});
