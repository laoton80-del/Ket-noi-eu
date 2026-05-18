import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTranslation } from '../../../i18n';
import { WidgetCard } from '../../widgets/WidgetCard';
import { AnimatedPressable } from '../../widgets/AnimatedPressable';
import { pickSuggestedSituationKeyToday, situationLabelForKey } from './SituationGrid';
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
  const { t } = useTranslation();
  const situation = useMemo(
    () =>
      situationLabel?.trim() ||
      situationLabelForKey(pickSuggestedSituationKeyToday(), t),
    [situationLabel, t]
  );

  return (
    <WidgetCard>
      <Text style={styles.title}>{t('academySub.adult.suggestedTitle')}</Text>
      <Text style={styles.body}>
        {t('academySub.adult.suggestedBody')}
        <Text style={styles.emphasis}>{situation}</Text>
      </Text>
      <AnimatedPressable
        onPress={() => onPressStudyNow(situation)}
        style={styles.cta}
      >
        <Text style={styles.ctaText}>{t('academySub.adult.studyNow')}</Text>
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
