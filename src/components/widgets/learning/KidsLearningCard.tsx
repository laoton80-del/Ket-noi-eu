import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WidgetCard } from '../WidgetCard';
import { AnimatedPressable } from '../AnimatedPressable';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

type Props = {
  progress: number;
  onPressStart: () => void;
};

const KidsLearningCardComponent: React.FC<Props> = ({
  progress,
  onPressStart,
}) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Học tiếng Việt cho bé</Text>
      <Text style={styles.subtitle}>
        Tiến độ: {progress}%
      </Text>
      <AnimatedPressable onPress={onPressStart} style={styles.button}>
        <Text style={styles.buttonText}>Bắt đầu học</Text>
      </AnimatedPressable>
    </WidgetCard>
  );
};

export const KidsLearningCard = React.memo(KidsLearningCardComponent);

const styles = StyleSheet.create({
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.GraphiteBlue,
  },
  subtitle: {
    marginVertical: 8,
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  button: {
    backgroundColor: theme.colors.SignalBlue,
    borderRadius: 12,
    padding: 12,
  },
  buttonText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
});

