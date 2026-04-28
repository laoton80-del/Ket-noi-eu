import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
  title: { ...theme.typeScale.h2, color: theme.colors.GraphiteBlue, fontFamily: FontFamily.bold },
  message: { marginTop: 8, ...theme.typeScale.body, color: theme.colors.text.secondary, fontFamily: FontFamily.regular },
  row: { marginTop: 10, flexDirection: 'row', gap: 8 },
  suggestionBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.GraphiteBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  suggestionText: { ...theme.typeScale.caption, color: theme.colors.CeolWhite, fontFamily: FontFamily.semibold, textAlign: 'center' },
});
