import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { PlatformPay, PlatformPayButton, useStripe } from '@stripe/stripe-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { APP_BRAND } from '../config/appBrand';
import { resolveCommercialCountryContext } from '../config/countryPacks';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';
import { PinFallbackModal } from './PinFallbackModal';
import { authenticateBiometric, getBiometricAvailability, isValidWalletPin } from '../security/biometricUnlock';

type PremiumCheckoutSheetProps = {
  visible: boolean;
  amountLabel: string;
  amountValue: number;
  currencyCode: string;
  /**
   * Stripe `merchantCountryCode` from the same pipeline as `resolveCommercialCountryContext` (D8) — already ISO2 + Stripe-safe (e.g. GB not UK).
   * Passed through to Apple Pay / Google Pay without re-resolving packs (avoids mixing merchant ISO with user-pack lookup).
   */
  merchantCountryCode?: string;
  platformPayClientSecret?: string;
  onNativePayPress: () => void;
  onFallbackPayPress?: () => void;
  onClose: () => void;
};

function formatStripeCartAmount(amount: number, currencyCode: string): string {
  const c = currencyCode.toUpperCase();
  const zeroDecimal = new Set([
    'BIF',
    'CLP',
    'DJF',
    'GNF',
    'JPY',
    'KMF',
    'KRW',
    'MGA',
    'PYG',
    'RWF',
    'UGX',
    'VND',
    'VUV',
    'XAF',
    'XOF',
    'XPF',
  ]);
  if (zeroDecimal.has(c)) {
    return String(Math.round(amount));
  }
  return amount.toFixed(2);
}

export function PremiumCheckoutSheet({
  visible,
  amountLabel,
  amountValue,
  currencyCode,
  merchantCountryCode,
  platformPayClientSecret,
  onNativePayPress,
  onFallbackPayPress,
  onClose,
}: PremiumCheckoutSheetProps) {
  const { isPlatformPaySupported, confirmPlatformPayPayment } = useStripe();
  const [checkingPay, setCheckingPay] = useState(true);
  const [paySupported, setPaySupported] = useState(false);
  const [paymentAuthOk, setPaymentAuthOk] = useState(false);
  const [pinGateVisible, setPinGateVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supported = await isPlatformPaySupported({
          googlePay: { testEnv: __DEV__ },
        });
        if (!cancelled) setPaySupported(supported);
      } catch {
        if (!cancelled) setPaySupported(false);
      } finally {
        if (!cancelled) setCheckingPay(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPlatformPaySupported, visible]);

  useEffect(() => {
    if (!visible) return;
    setPaymentAuthOk(false);
    let cancelled = false;
    void (async () => {
      const availability = await getBiometricAvailability();
      if (cancelled || !visible) return;
      if (availability === 'ready') {
        const ok = await authenticateBiometric('Xác thực để thanh toán an toàn');
        if (!cancelled) setPaymentAuthOk(ok);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const requestPaymentAuth = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const availability = await getBiometricAvailability();
    if (availability === 'ready') {
      const ok = await authenticateBiometric('Xác thực để thanh toán an toàn');
      if (ok) setPaymentAuthOk(true);
      return;
    }
    setPinGateVisible(true);
  }, []);

  const runPlatformPay = useCallback(async () => {
    if (!paymentAuthOk) {
      Alert.alert('Cần xác thực', 'Vui lòng hoàn tất Face ID / vân tay hoặc mã PIN trước khi thanh toán.');
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const secret = platformPayClientSecret;
    if (!paySupported || !secret) {
      if (!secret) {
        Alert.alert(
          'Chưa sẵn sàng thanh toán',
          'Thiếu client secret từ máy chủ thanh toán. Đóng và chọn gói lại, hoặc kiểm tra EXPO_PUBLIC_PAYMENTS_API_BASE.'
        );
      } else {
        Alert.alert(
          'Thanh toán',
          'Thiết bị chưa hỗ trợ Apple Pay / Google Pay cho luồng này. Đóng và thử cách khác khi có.'
        );
      }
      onFallbackPayPress?.();
      return;
    }
    const amountStr = formatStripeCartAmount(amountValue, currencyCode);
    const cartItems: PlatformPay.CartSummaryItem[] = [
      {
        paymentType: PlatformPay.PaymentType.Immediate,
        label: 'Credits',
        amount: amountStr,
      },
      {
        paymentType: PlatformPay.PaymentType.Immediate,
        label: APP_BRAND.paymentsDisplayName,
        amount: amountStr,
      },
    ];
    const stripeMerchantCountry =
      merchantCountryCode?.trim() || resolveCommercialCountryContext(undefined).merchantCountryCode;
    const cur = currencyCode.toUpperCase();

    try {
      const params: PlatformPay.ConfirmParams =
        Platform.OS === 'ios'
              ? {
                  applePay: {
                    merchantCountryCode: stripeMerchantCountry,
                    currencyCode: cur,
                    cartItems,
                  },
                }
              : {
                  googlePay: {
                    testEnv: __DEV__,
                    merchantCountryCode: stripeMerchantCountry,
                    currencyCode: cur,
                    merchantName: APP_BRAND.paymentsDisplayName,
                  },
                };

      const { error } = await confirmPlatformPayPayment(secret, params);
      if (error) {
        Alert.alert(
          'Thanh toán chưa hoàn tất',
          'Nhà cung cấp chưa xác nhận thanh toán hoặc đã từ chối. Credits chưa được cộng. Bạn có thể thử lại.'
        );
        onFallbackPayPress?.();
        return;
      }
      onNativePayPress();
    } catch {
      Alert.alert(
        'Thanh toán tạm gián đoạn',
        'Không thể hoàn tất xác nhận với ví. Credits chưa được cộng. Kiểm tra mạng và thử lại.'
      );
      onFallbackPayPress?.();
    }
  }, [
    amountValue,
    confirmPlatformPayPayment,
    currencyCode,
    merchantCountryCode,
    onFallbackPayPress,
    onNativePayPress,
    paySupported,
    paymentAuthOk,
    platformPayClientSecret,
  ]);

  if (__DEV__) {
    console.log('[diag][PremiumCheckoutSheet] render (post-hooks)', { visible });
  }

  if (!visible) return null;

  const showNativeButton = Platform.OS === 'ios' || Platform.OS === 'android';
  const payReady =
    !checkingPay && paySupported && !!platformPayClientSecret && paymentAuthOk;
  const payDisabled = checkingPay || !paySupported || !platformPayClientSecret || !paymentAuthOk;
  const awaitingAuth =
    !checkingPay && paySupported && !!platformPayClientSecret && !paymentAuthOk;
  const checkoutTitle = 'Nạp Credits';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <PinFallbackModal
        visible={pinGateVisible}
        title="Xác thực thanh toán"
        onClose={() => setPinGateVisible(false)}
        onVerify={(pin) => {
          if (isValidWalletPin(pin)) {
            setPaymentAuthOk(true);
            setPinGateVisible(false);
          } else {
            Alert.alert('Không thể xác thực', 'Mã PIN không đúng.');
          }
        }}
      />
      <Animated.View entering={FadeInDown.duration(280)} exiting={FadeOutDown.duration(220)} style={styles.sheet}>
        <Text style={styles.checkoutType}>{checkoutTitle}</Text>
        <Text style={styles.totalTitle}>Tổng thanh toán:</Text>
        <Text style={styles.totalAmount}>{amountLabel}</Text>

        {checkingPay ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.text.primary} />
            <Text style={styles.statusText}>Đang kiểm tra Apple Pay / Google Pay…</Text>
          </View>
        ) : !paySupported ? (
          <Text style={styles.statusText}>Thiết bị chưa hỗ trợ thanh toán ví. Dùng thanh toán thay thế bên dưới.</Text>
        ) : null}

        {awaitingAuth ? (
          <View style={styles.authGate}>
            <Text style={styles.authGateTitle}>Bảo vệ thanh toán</Text>
            <Text style={styles.authGateHint}>
              Xác thực Face ID / vân tay (hoặc mã PIN) để kích hoạt Apple Pay / Google Pay.
            </Text>
            <Pressable
              onPress={() => void requestPaymentAuth()}
              style={({ pressed }) => [styles.authGateBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.authGateBtnText}>Xác thực để thanh toán</Text>
            </Pressable>
            <Pressable onPress={() => setPinGateVisible(true)} style={({ pressed }) => [styles.authPinLink, pressed && { opacity: 0.85 }]}>
              <Text style={styles.authPinLinkText}>Dùng mã PIN dự phòng</Text>
            </Pressable>
          </View>
        ) : null}

        {showNativeButton ? (
          <PlatformPayButton
            type={Platform.OS === 'ios' ? PlatformPay.ButtonType.Buy : PlatformPay.ButtonType.Pay}
            appearance={PlatformPay.ButtonStyle.Black}
            borderRadius={14}
            disabled={payDisabled}
            style={styles.payButton}
            onPress={runPlatformPay}
          />
        ) : (
          <Pressable
            disabled={payDisabled}
            onPress={runPlatformPay}
            style={({ pressed }) => [styles.fallbackPayBtn, payDisabled && { opacity: 0.45 }, pressed && !payDisabled && { opacity: 0.84 }]}
          >
            <Text style={styles.fallbackPayText}>Thanh toán Platform Pay</Text>
          </Pressable>
        )}

        {onFallbackPayPress ? (
          <Pressable
            onPress={() => void onFallbackPayPress()}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.84 }]}
          >
            <Text style={styles.secondaryBtnText}>Thanh toán thay thế (không dùng ví)</Text>
          </Pressable>
        ) : null}

        {payReady ? <Text style={styles.unlockedHint}>Đã xác thực — bạn có thể thanh toán.</Text> : null}

        <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.84 }]}>
          <Text style={styles.closeText}>Đóng</Text>
        </Pressable>
      </Animated.View>
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
  totalTitle: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  checkoutType: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    marginBottom: 2,
  },
  totalAmount: {
    color: theme.hybrid.signal,
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    marginBottom: 12,
  },
  payButton: {
    width: '100%',
    height: 50,
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statusText: {
    flex: 1,
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  authGate: {
    marginBottom: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.executive.card,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  authGateTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  authGateHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  authGateBtn: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authGateBtnText: {
    color: theme.hybrid.onSignal,
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  authPinLink: {
    marginTop: 10,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  authPinLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.signatureGold,
    textDecorationLine: 'underline',
  },
  unlockedHint: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.success,
    textAlign: 'center',
  },
  fallbackPayBtn: {
    height: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackPayText: {
    color: theme.hybrid.onSignal,
    fontSize: 15,
    fontFamily: FontFamily.bold,
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
