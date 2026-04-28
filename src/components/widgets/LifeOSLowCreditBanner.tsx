import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
  title: { ...theme.typeScale.h2, color: theme.colors.PendingAmber, fontFamily: FontFamily.bold },
  body: { ...theme.typeScale.body, color: theme.colors.text.secondary, fontFamily: FontFamily.regular },
  button: {
    backgroundColor: theme.colors.GraphiteBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  buttonText: { ...theme.typeScale.body, color: theme.colors.CeolWhite, fontFamily: FontFamily.semibold },
});
