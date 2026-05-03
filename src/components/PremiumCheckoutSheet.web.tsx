import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';
import { applyWebStyles } from '../utils/applyWebStyles';

type PremiumCheckoutSheetProps = {
  visible: boolean;
  amountLabel: string;
  amountValue: number;
  currencyCode: string;
  merchantCountryCode?: string;
  platformPayClientSecret?: string;
  onNativePayPress: () => void;
  onFallbackPayPress?: () => void;
  onClose: () => void;
};

export function PremiumCheckoutSheet({
  visible,
  amountLabel,
  onFallbackPayPress,
  onClose,
}: PremiumCheckoutSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.sheet} className={applyWebStyles('kn-glass kn-neon-b2b')}>
        <Text style={styles.checkoutType}>Nạp Credits</Text>
        <Text style={styles.totalTitle}>Tổng thanh toán:</Text>
        <Text style={styles.totalAmount}>{amountLabel}</Text>
        <Text style={styles.statusText}>
          Web runtime không hỗ trợ native Stripe SDK. Vui lòng dùng luồng thanh toán thay thế.
        </Text>
        {onFallbackPayPress ? (
          <Pressable
            onPress={() => void onFallbackPayPress()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.84 }]}
          >
            <Text style={styles.secondaryBtnText}>Thanh toán thay thế</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.84 }]}>
          <Text style={styles.closeText}>Đóng</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 80,
  },
  sheet: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: theme.elevation.modal.shadowOffset,
    shadowOpacity: theme.elevation.modal.shadowOpacity,
    shadowRadius: theme.elevation.modal.shadowRadius,
    elevation: theme.elevation.modal.elevation,
  },
  checkoutType: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    marginBottom: 2,
  },
  totalTitle: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  totalAmount: {
    color: theme.hybrid.signal,
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    marginBottom: 12,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginBottom: 10,
  },
  secondaryBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.executive.panelMuted,
  },
  secondaryBtnText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  closeBtn: {
    marginTop: 10,
    height: 38,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.executive.card,
  },
  closeText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
});
