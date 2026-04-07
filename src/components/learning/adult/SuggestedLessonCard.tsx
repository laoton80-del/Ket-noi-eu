import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { WidgetCard } from '../../widgets/WidgetCard';
import { AnimatedPressable } from '../../widgets/AnimatedPressable';
import { pickSuggestedSituationToday } from './SituationGrid';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

type Props = {
  /** Optional override; otherwise derived from simple “today” rotation with fallback. */
  situationLabel?: string;
  onPressStudyNow: (situation: string) => void;
};

const SuggestedLessonCardComponent: React.FC<Props> = ({
  situationLabel,
  onPressStudyNow,
}) => {
  const situation = useMemo(
    () => situationLabel?.trim() || pickSuggestedSituationToday(),
    [situationLabel]
  );

  return (
    <WidgetCard>
      <Text style={styles.title}>Gợi ý hôm nay</Text>
      <Text style={styles.body}>
        Hôm nay bạn nên học:{' '}
        <Text style={styles.emphasis}>{situation}</Text>
      </Text>
      <AnimatedPressable
        onPress={() => onPressStudyNow(situation)}
        style={styles.cta}
      >
        <Text style={styles.ctaText}>Học ngay</Text>
      </AnimatedPressable>
    </WidgetCard>
  );
};

export const SuggestedLessonCard = React.memo(SuggestedLessonCardComponent);

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 14,
  },
  emphasis: {
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  cta: {
    minHeight: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});
