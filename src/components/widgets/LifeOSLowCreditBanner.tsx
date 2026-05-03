import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

type Props = {
  visible: boolean;
  balance: number;
  threshold: number;
  minActionCost: number;
  onPressTopUp: () => void;
};

const LifeOSLowCreditBannerComponent: React.FC<Props> = ({
  visible,
  balance,
  threshold,
  minActionCost,
  onPressTopUp,
}) => {
  if (!visible) return null;

  return (
    <WidgetCard>
      <View style={styles.wrap}>
        <Text style={styles.title}>Số dư đang thấp</Text>
        <Text style={styles.body}>
          Bạn còn {balance} Credits — dưới ngưỡng {threshold} (chưa đủ một hành động chính từ ~{minActionCost}{' '}
          Credits). Nạp thêm để không gián đoạn cuộc gọi hỗ trợ và phiên dịch.
        </Text>
        <AnimatedPressable onPress={onPressTopUp} style={styles.button}>
          <Text style={styles.buttonText}>Nạp Credits ngay</Text>
        </AnimatedPressable>
      </View>
    </WidgetCard>
  );
};

export const LifeOSLowCreditBanner = React.memo(LifeOSLowCreditBannerComponent);

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontSize: 16, fontWeight: '700', color: '#B45309' },
  body: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});
