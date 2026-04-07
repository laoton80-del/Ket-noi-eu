import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WidgetCard } from '../../widgets/WidgetCard';
import { AnimatedPressable } from '../../widgets/AnimatedPressable';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

export const DEFAULT_QUICK_PHRASES = [
  'Tôi không hiểu',
  'Xin nói chậm lại',
  'Tôi muốn đặt lịch',
] as const;

type Props = {
  phrases?: readonly string[];
  onPressPhrase?: (phrase: string) => void;
};

const QuickPhrasesCardComponent: React.FC<Props> = ({
  phrases = DEFAULT_QUICK_PHRASES,
  onPressPhrase,
}) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Mẫu câu nhanh</Text>
      <Text style={styles.hint}>Chạm câu để luyện với Minh Khang (khi có)</Text>
      <View style={styles.list}>
        {phrases.map((phrase) => (
          <AnimatedPressable
            key={phrase}
            onPress={() => onPressPhrase?.(phrase)}
            style={styles.row}
            disabled={!onPressPhrase}
          >
            <Text style={[styles.phrase, !onPressPhrase && styles.phraseMuted]}>
              {phrase}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </WidgetCard>
  );
};

export const QuickPhrasesCard = React.memo(QuickPhrasesCardComponent);

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 10,
  },
  list: {
    gap: 8,
  },
  row: {
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  phrase: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  phraseMuted: {
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
});
