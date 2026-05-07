import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaTokens } from '../../design';
import { VionaSurface } from './VionaSurface';

export type VionaUtilityDockProps = Readonly<{
  accountLabel: string;
  localeLabel: string;
  vioLabel: string;
  onAccountPress: () => void;
  onLocalePress: () => void;
  onVioPress?: () => void;
  compact?: boolean;
}>;

export function VionaUtilityDock({
  accountLabel,
  localeLabel,
  vioLabel,
  onAccountPress,
  onLocalePress,
  onVioPress,
  compact = false,
}: VionaUtilityDockProps) {
  return (
    <VionaSurface variant="glass" style={[styles.surface, compact && styles.surfaceCompact]}>
      <View style={styles.row}>
        <DockChip label={accountLabel} onPress={onAccountPress} compact={compact} />
        <DockChip label={localeLabel} onPress={onLocalePress} compact={compact} />
        <DockChip label={vioLabel} onPress={onVioPress} compact={compact} disabled={!onVioPress} />
      </View>
    </VionaSurface>
  );
}

type DockChipProps = Readonly<{
  label: string;
  onPress?: () => void;
  compact: boolean;
  disabled?: boolean;
}>;

function DockChip({ label, onPress, compact, disabled = false }: DockChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        (disabled || !onPress) && styles.chipDisabled,
        pressed && !disabled && onPress && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, compact && styles.chipLabelCompact]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    paddingHorizontal: vionaTokens.spacing[8],
    paddingVertical: vionaTokens.spacing[8],
  },
  surfaceCompact: {
    paddingHorizontal: vionaTokens.spacing[6],
    paddingVertical: vionaTokens.spacing[6],
  },
  row: {
    flexDirection: 'row',
    gap: vionaTokens.spacing[6],
  },
  chip: {
    flex: 1,
    minHeight: 36,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: vionaTokens.colors.border,
    backgroundColor: vionaTokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: vionaTokens.spacing[8],
  },
  chipCompact: {
    minHeight: 32,
  },
  chipLabel: {
    color: vionaTokens.colors.softInk,
    ...vionaTokens.typography.meta,
    fontWeight: '700',
  },
  chipLabelCompact: {
    fontSize: 11,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipDisabled: {
    opacity: 0.55,
  },
});
