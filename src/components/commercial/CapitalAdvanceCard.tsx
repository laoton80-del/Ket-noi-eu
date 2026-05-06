import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type CapitalAdvanceCardProps = {
  approvedAmount?: number;
  onPress?: () => void;
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function CapitalAdvanceCard({ approvedAmount = 5000, onPress }: CapitalAdvanceCardProps) {
  return (
    <LinearGradient
      colors={[theme.colors.surfaceElevated, theme.colors.surface, theme.colors.backgroundDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hỗ Trợ Vốn Lưu Động</Text>
      </View>
      <Text style={styles.description}>
        Dựa trên doanh thu tháng trước, bạn được phê duyệt ứng trước {formatUsd(approvedAmount)}.
      </Text>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}>
        <Text style={styles.ctaText}>Nhận tiền trong 24h</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.colors.primary,
    fontFamily: FontFamily.bold,
  },
  description: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
  },
  ctaButton: {
    marginTop: theme.spacing.xs,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  ctaText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
});
