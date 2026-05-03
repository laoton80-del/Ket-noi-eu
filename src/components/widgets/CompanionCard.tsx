import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

type Props = {
  message: string;
  suggestedActions: string[];
  onPressSuggestion: (label: string) => void;
};

const CompanionCardComponent: React.FC<Props> = ({ message, suggestedActions, onPressSuggestion }) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Đồng hành & gợi ý</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.row}>
        {suggestedActions.slice(0, 2).map((s) => (
          <AnimatedPressable key={s} onPress={() => onPressSuggestion(s)} style={styles.suggestionBtn}>
            <Text style={styles.suggestionText}>{s}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </WidgetCard>
  );
};

export const CompanionCard = React.memo(CompanionCardComponent);

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  message: { marginTop: 8, fontSize: 13, color: '#4B5563', lineHeight: 19 },
  row: { marginTop: 10, flexDirection: 'row', gap: 8 },
  suggestionBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  suggestionText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
