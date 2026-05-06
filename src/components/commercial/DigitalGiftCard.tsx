import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type DigitalGiftCardProps = {
  shopName: string;
  balance: number;
  recipientName: string;
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function DigitalGiftCard({ shopName, balance, recipientName }: DigitalGiftCardProps) {
  const tilt = useSharedValue(0);
  tilt.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(tilt.value, [0, 1], [-4, 4])}deg` },
      { rotateX: `${interpolate(tilt.value, [0, 1], [1.5, -1.5])}deg` },
    ],
  }));

  const maskedRecipient = useMemo(() => recipientName.toUpperCase(), [recipientName]);

  return (
    <Animated.View style={StyleSheet.flatten([styles.card, cardStyle])}>
      <View style={styles.headerRow}>
        <Text style={styles.brandText}>{shopName}</Text>
        <Text style={styles.giftTag}>DIGITAL GIFT</Text>
      </View>

      <View style={styles.qrPlaceholder}>
        <View style={styles.qrInner} />
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.label}>Người nhận</Text>
          <Text style={styles.value}>{maskedRecipient}</Text>
        </View>
        <View style={styles.balanceWrap}>
          <Text style={styles.label}>Số dư</Text>
          <Text style={styles.balance}>{formatUsd(balance)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    minHeight: 220,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.modal.shadowOffset,
    shadowOpacity: theme.elevation.modal.shadowOpacity,
    shadowRadius: theme.elevation.modal.shadowRadius,
    elevation: theme.elevation.modal.elevation,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  giftTag: {
    ...theme.typeScale.caption,
    color: theme.colors.primary,
    fontFamily: FontFamily.bold,
  },
  qrPlaceholder: {
    marginTop: theme.spacing.md,
    alignSelf: 'center',
    width: 116,
    height: 116,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInner: {
    width: 78,
    height: 78,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.colors.glass.surface,
  },
  footerRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  value: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  balanceWrap: {
    alignItems: 'flex-end',
  },
  balance: {
    ...theme.typeScale.h2,
    color: theme.colors.primary,
    fontFamily: FontFamily.bold,
  },
});
