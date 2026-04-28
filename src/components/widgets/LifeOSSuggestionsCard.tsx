import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.GraphiteBlue,
    marginBottom: 6,
  },
  sub: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, paddingVertical: 2 },
  bullet: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
    marginTop: 1,
    width: 14,
  },
  line: {
    flex: 1,
    ...theme.typeScale.body,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.regular,
  },
});
