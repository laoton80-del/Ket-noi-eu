import React from 'react';
import type { SellCTA } from '../../services/selling';
import { AnimatedPressable } from '../widgets/AnimatedPressable';
import { WidgetCard } from '../widgets/WidgetCard';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  cta: SellCTA;
  disabled?: boolean;
  onPress: () => void;
};

function shortCreditsLine(creditsCost: number) {
  return `${creditsCost} Credits`;
}

export const SellCTAButton: React.FC<Props> = ({ cta, onPress, disabled }) => {
  return (
    <WidgetCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title}>Gợi ý chốt ngay</Text>
          <Text style={styles.cost}>{shortCreditsLine(cta.creditsCost)}</Text>
        </View>
        <AnimatedPressable
          disabled={disabled}
          onPress={onPress}
          style={[styles.button, disabled ? { opacity: 0.55 } : null]}
        >
          <Text style={styles.buttonText}>{cta.action === 'leona_booking' ? 'Gọi Leona' : cta.action === 'start_interpreter' ? 'Mở phiên dịch' : 'Chuyển Lễ tân'}</Text>
        </AnimatedPressable>
      </View>
      <Text style={styles.message}>{cta.message.split('\n')[0] ?? cta.message}</Text>
    </WidgetCard>
  );
};

const styles = StyleSheet.create({
  card: { marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cost: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginTop: 2 },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  message: { marginTop: 10, fontSize: 13, color: '#374151', lineHeight: 19 },
});

