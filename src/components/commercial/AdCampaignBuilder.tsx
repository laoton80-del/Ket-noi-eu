import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { PaymentCheckoutSheet } from './PaymentCheckoutSheet';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function AdCampaignBuilder() {
  const { isMobile } = useDeviceLayout();
  const [promotionText, setPromotionText] = useState('Giảm 20% Phở bò');
  const [radiusKm, setRadiusKm] = useState(5);
  const [showCheckout, setShowCheckout] = useState(false);

  const estimatedCost = useMemo(() => Math.round(radiusKm * 10), [radiusKm]);
  const estimatedReach = useMemo(() => radiusKm * 400, [radiusKm]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hyper-Local Ad Builder</Text>
      <Text style={styles.subtitle}>Tạo chiến dịch phủ khách hàng quanh cửa hàng theo bán kính địa phương.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nội dung khuyến mãi (VD: Giảm 20% Phở bò)</Text>
        <TextInput
          value={promotionText}
          onChangeText={setPromotionText}
          placeholder="Nhập nội dung khuyến mãi"
          placeholderTextColor={theme.colors.text.tertiary}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bán kính phát sóng: {radiusKm}km</Text>
        <Slider
          value={radiusKm}
          onValueChange={(value: number) => setRadiusKm(Math.round(value))}
          minimumValue={1}
          maximumValue={50}
          step={1}
          minimumTrackTintColor={theme.hybrid.signalStrong}
          maximumTrackTintColor={theme.colors.glass.borderSoft}
          thumbTintColor={theme.colors.primary}
        />
      </View>

      <Text style={styles.costHint}>
        Chi phí dự kiến: ${estimatedCost} cho ~{estimatedReach.toLocaleString('en-US')} khách hàng xung quanh.
      </Text>

      <Pressable
        onPress={() => setShowCheckout(true)}
        style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }, isMobile && styles.ctaButtonCompact]}
      >
        <Text style={styles.ctaText}>Thanh toán & Phát sóng ngay</Text>
      </Pressable>

      <PaymentCheckoutSheet visible={showCheckout} onClose={() => setShowCheckout(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
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
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  input: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.text.primary,
    ...theme.typeScale.body,
    fontFamily: FontFamily.medium,
  },
  costHint: {
    ...theme.typeScale.body,
    color: theme.colors.primary,
    fontFamily: FontFamily.semibold,
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
  ctaButtonCompact: {
    minHeight: theme.components.button.height.sm,
  },
  ctaText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});
