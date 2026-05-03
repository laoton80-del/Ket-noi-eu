import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export type OperationalStatusChipVariant = 'verified' | 'processing' | 'cleared' | 'routeError';

type OperationalStatusChipProps = {
  variant: OperationalStatusChipVariant;
  label: string;
};

const VARIANT_STYLES: Record<
  OperationalStatusChipVariant,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  verified: {
    backgroundColor: theme.hybrid.chipClearedBg,
    borderColor: 'rgba(129, 199, 132, 0.42)',
    color: theme.hybrid.chipClearedText,
  },
  processing: {
    backgroundColor: theme.hybrid.chipProcessingBg,
    borderColor: theme.hybrid.signalSubtleBorder,
    color: theme.hybrid.chipProcessingText,
  },
  cleared: {
    backgroundColor: 'rgba(129, 199, 132, 0.1)',
    borderColor: 'rgba(129, 199, 132, 0.32)',
    color: theme.hybrid.chipClearedText,
  },
  routeError: {
    backgroundColor: theme.hybrid.chipErrorBg,
    borderColor: 'rgba(229, 115, 115, 0.48)',
    color: theme.hybrid.chipErrorText,
  },
};

/** Chip trạng thái vận hành (Lễ tân / B2B) — dùng token hybrid, không đổi luồng dữ liệu. */
export function OperationalStatusChip({ variant, label }: OperationalStatusChipProps) {
  const v = VARIANT_STYLES[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: v.backgroundColor, borderColor: v.borderColor }]}>
      <Text style={[styles.text, { color: v.color }]} numberOfLines={3}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    lineHeight: 14,
  },
});
