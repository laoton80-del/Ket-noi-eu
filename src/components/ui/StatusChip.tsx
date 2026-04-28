import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export type StatusChipState = 'Processing' | 'Cleared' | 'Pending' | 'Error';

type StatusChipProps = {
  state: StatusChipState;
};

export function StatusChip({ state }: StatusChipProps) {
  const palette = statusPalette[state];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.text }]}>{state}</Text>
    </View>
  );
}

const statusPalette: Record<StatusChipState, { bg: string; border: string; text: string }> = {
  Processing: {
    bg: theme.hybrid.chipProcessingBg,
    border: theme.hybrid.signalSubtleBorder,
    text: theme.hybrid.chipProcessingText,
  },
  Cleared: {
    bg: theme.hybrid.chipClearedBg,
    border: theme.colors.SoftEmerald,
    text: theme.hybrid.chipClearedText,
  },
  Pending: {
    bg: theme.colors.executive.panelMuted,
    border: theme.colors.PendingAmber,
    text: theme.colors.PendingAmber,
  },
  Error: {
    bg: theme.hybrid.chipErrorBg,
    border: theme.colors.RouteError,
    text: theme.hybrid.chipErrorText,
  },
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 22,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
});
