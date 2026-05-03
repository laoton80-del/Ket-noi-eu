import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

type Props = {
  visible: boolean;
  lines: string[];
  onDismiss: () => void;
};

const LifeOSPostActionCardComponent: React.FC<Props> = ({ visible, lines, onDismiss }) => {
  if (!visible || lines.length === 0) return null;

  return (
    <WidgetCard>
      <Text style={styles.title}>Sau hành động vừa rồi</Text>
      <Text style={styles.sub}>Gợi ý tiếp theo để tận dụng Credits hiệu quả:</Text>
      <View style={styles.list}>
        {lines.map((line, i) => (
          <View key={`${i}-${line.slice(0, 20)}`} style={styles.row}>
            <Text style={styles.bullet}>→</Text>
            <Text style={styles.line}>{line}</Text>
          </View>
        ))}
      </View>
      <AnimatedPressable onPress={onDismiss} style={styles.dismiss}>
        <Text style={styles.dismissText}>Đã xem</Text>
      </AnimatedPressable>
    </WidgetCard>
  );
};

export const LifeOSPostActionCard = React.memo(LifeOSPostActionCardComponent);

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6B7280', marginBottom: 10, lineHeight: 18 },
  list: { gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 14, color: '#111827', fontWeight: '700' },
  line: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  dismiss: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  dismissText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
});
