import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

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
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  smartLine: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    lineHeight: 17,
    fontWeight: '500',
  },
  balance: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  warning: {
    marginTop: 6,
    fontSize: 13,
    color: '#B45309',
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

