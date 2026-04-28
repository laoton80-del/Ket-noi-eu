import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
  title: { ...theme.typeScale.h2, fontFamily: FontFamily.bold, color: theme.colors.GraphiteBlue, marginBottom: 4 },
  sub: { ...theme.typeScale.body, fontFamily: FontFamily.regular, color: theme.colors.text.secondary, marginBottom: 10 },
  list: { gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { ...theme.typeScale.body, color: theme.colors.GraphiteBlue, fontFamily: FontFamily.bold },
  line: { flex: 1, ...theme.typeScale.body, color: theme.colors.GraphiteBlue, fontFamily: FontFamily.regular },
  dismiss: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  dismissText: { ...theme.typeScale.body, fontFamily: FontFamily.semibold, color: theme.colors.SignalBlue },
});
