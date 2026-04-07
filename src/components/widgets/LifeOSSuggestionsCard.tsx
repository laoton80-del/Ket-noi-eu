import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

export type LifeOSSuggestionsCardProps = {
  lines: string[];
  onPressLine?: (line: string) => void;
};

const LifeOSSuggestionsCardComponent: React.FC<LifeOSSuggestionsCardProps> = ({ lines, onPressLine }) => {
  if (lines.length === 0) return null;

  return (
    <WidgetCard>
      <Text style={styles.title}>Gợi ý tiếp theo</Text>
      <Text style={styles.sub}>LifeOS sắp xếp theo mức độ quan trọng — bạn có thể làm dần.</Text>
      <View style={styles.list}>
        {lines.map((line, i) => (
          <AnimatedPressable key={`${i}-${line.slice(0, 24)}`} style={styles.row} onPress={() => onPressLine?.(line)}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.line}>{line}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </WidgetCard>
  );
};

export const LifeOSSuggestionsCard = React.memo(LifeOSSuggestionsCardComponent);

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, paddingVertical: 2 },
  bullet: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 1,
    width: 14,
  },
  line: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
