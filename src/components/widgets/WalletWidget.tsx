import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Props = {
  creditBalance: number;
  isLowBalance: boolean;
  onPressTopUp: () => void;
  /** Ước tính số hành động còn làm được (smart wallet). */
  smartWalletLine?: string | null;
};

const WalletWidgetComponent: React.FC<Props> = ({
  creditBalance,
  isLowBalance,
  onPressTopUp,
  smartWalletLine,
}) => {
  return (
    <WidgetCard>
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <Text style={styles.label}>Số dư Credits</Text>
          <Text style={styles.balance}>{creditBalance}</Text>
          {smartWalletLine ? <Text style={styles.smartLine}>{smartWalletLine}</Text> : null}
          {isLowBalance ? <Text style={styles.warning}>Số dư thấp, nên nạp thêm</Text> : null}
        </View>

        <AnimatedPressable onPress={onPressTopUp} style={styles.button}>
          <Text style={styles.buttonText}>Nạp Credits</Text>
        </AnimatedPressable>
      </View>
    </WidgetCard>
  );
};

export const WalletWidget = React.memo(WalletWidgetComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCol: { flex: 1, minWidth: 0 },
  label: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 6,
  },
  smartLine: {
    ...theme.typeScale.caption,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
  balance: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
    color: theme.colors.GraphiteBlue,
  },
  warning: {
    marginTop: 6,
    ...theme.typeScale.caption,
    color: theme.colors.PendingAmber,
    fontFamily: FontFamily.semibold,
  },
  button: {
    backgroundColor: theme.colors.GraphiteBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
  },
});

