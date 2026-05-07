import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ConfettiExplosion } from '../vfx/ConfettiExplosion';
import { chargeWalletServer } from '../../state/wallet';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { generateChargeKey } from '../../utils/idempotency';

type PaymentCheckoutSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function PaymentCheckoutSheet({ visible, onClose }: PaymentCheckoutSheetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [paymentMode, setPaymentMode] = useState<'pay_now' | 'bnpl'>('pay_now');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const serviceAmount = 50;
  const platformFee = 1;
  const protectionFee = 1;
  const totalAmount = serviceAmount + platformFee + (protectionEnabled ? protectionFee : 0);
  const bnplInstallment = totalAmount / 4;

  const resetAndClose = () => {
    setIsProcessing(false);
    setIsSuccess(false);
    setShowConfetti(false);
    setProtectionEnabled(true);
    setPaymentMode('pay_now');
    setErrorMessage(null);
    onClose();
  };

  const onPressCheckout = async (mode: 'pay_now' | 'bnpl'): Promise<void> => {
    if (isProcessing) return;
    setPaymentMode(mode);
    setIsProcessing(true);
    setErrorMessage(null);
    const serviceId = mode === 'bnpl' ? 'nail_art_bnpl_checkout' : 'nail_art_direct_checkout';
    const result = await chargeWalletServer(serviceId, generateChargeKey(serviceId));
    setIsProcessing(false);
    if (!result.ok) {
      setErrorMessage('Không thể xác nhận thanh toán từ máy chủ. Vui lòng thử lại.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSuccess(true);
    setShowConfetti(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={resetAndClose} />
        <View style={styles.modalCard}>
          <Text style={styles.title}>Thanh toán dịch vụ</Text>
          <Text style={styles.subtitle}>Bảng kê minh bạch theo mô hình Take-Rate</Text>

          <View style={styles.summaryBlock}>
            <View style={styles.row}>
              <Text style={styles.label}>Dịch vụ: Làm móng tay (Nail Art)</Text>
              <Text style={styles.value}>{formatUsd(serviceAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phí nền tảng VIONA</Text>
              <Text style={styles.value}>{formatUsd(platformFee)}</Text>
            </View>
            <View style={styles.protectionRow}>
              <View style={styles.protectionTextWrap}>
                <Text style={styles.protectionTitle}>Bảo hiểm Dịch vụ Toàn cầu (+$1.00)</Text>
                <Text style={styles.protectionSubtitle}>
                  Hoàn tiền 100% và đền bù nếu dịch vụ không đúng cam kết. Hỗ trợ 24/7.
                </Text>
              </View>
              <Switch
                value={protectionEnabled}
                onValueChange={setProtectionEnabled}
                thumbColor={theme.colors.primary}
                trackColor={{
                  false: theme.colors.glass.borderSoft,
                  true: theme.hybrid.signalSubtleBorder,
                }}
              />
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>{formatUsd(totalAmount)}</Text>
            </View>
          </View>

          {isSuccess ? (
            <View style={styles.successWrap}>
              <Ionicons name="checkmark-circle" size={26} color={theme.colors.success} />
              <Text style={styles.successText}>
                {paymentMode === 'bnpl'
                  ? 'Đăng ký trả góp thành công! Đã nhận xác nhận từ máy chủ.'
                  : 'Thanh toán thành công! Đã nhận xác nhận từ máy chủ.'}
              </Text>
            </View>
          ) : (
            <>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              <Pressable
                onPress={() => void onPressCheckout('pay_now')}
                style={({ pressed }) => [styles.payBtn, pressed && { opacity: 0.9 }, isProcessing && styles.payBtnDisabled]}
                disabled={isProcessing}
              >
                {isProcessing && paymentMode === 'pay_now' ? (
                  <ActivityIndicator color={theme.hybrid.onSignal} />
                ) : (
                  <>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.hybrid.onSignal} />
                    <Text style={styles.payBtnText}>Thanh toán an toàn với Stripe</Text>
                  </>
                )}
              </Pressable>

              <View style={styles.bnplBox}>
                <Text style={styles.bnplTitle}>Chia làm 4 kỳ thanh toán với Kết Nối Pay. 0% Lãi suất.</Text>
                <Text style={styles.bnplBreakdown}>
                  Hôm nay trả: {formatUsd(bnplInstallment)}. Các kỳ sau: {formatUsd(bnplInstallment)}/tháng.
                </Text>
                <Pressable
                  onPress={() => void onPressCheckout('bnpl')}
                  style={({ pressed }) => [styles.bnplBtn, pressed && { opacity: 0.9 }, isProcessing && styles.payBtnDisabled]}
                  disabled={isProcessing}
                >
                  {isProcessing && paymentMode === 'bnpl' ? (
                    <ActivityIndicator color={theme.components.button.variant.primary.text} />
                  ) : (
                    <Text style={styles.bnplBtnText}>Trả góp ngay</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

          <Pressable onPress={resetAndClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.closeText}>Đóng</Text>
          </Pressable>
        </View>
      </View>
      <ConfettiExplosion visible={showConfetti} onComplete={() => setShowConfetti(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay.dim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  summaryBlock: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  value: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  totalRow: {
    marginTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glass.border,
    paddingTop: theme.spacing.sm,
  },
  protectionRow: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  protectionTextWrap: {
    flex: 1,
    gap: 2,
  },
  protectionTitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  protectionSubtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  totalLabel: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  totalValue: {
    ...theme.typeScale.h2,
    color: theme.colors.primary,
    fontFamily: FontFamily.bold,
  },
  errorText: {
    ...theme.typeScale.caption,
    color: theme.colors.danger,
    fontFamily: FontFamily.semibold,
  },
  payBtn: {
    marginTop: theme.spacing.xs,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  payBtnDisabled: {
    opacity: 0.82,
  },
  payBtnText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
  bnplBox: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  bnplTitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  bnplBreakdown: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  bnplBtn: {
    marginTop: theme.spacing.xs,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bnplBtnText: {
    ...theme.typeScale.caption,
    color: theme.components.button.variant.primary.text,
    fontFamily: FontFamily.bold,
  },
  successWrap: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  successText: {
    ...theme.typeScale.body,
    color: theme.colors.success,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  closeBtn: {
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
});
