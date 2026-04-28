import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WidgetCard } from '../WidgetCard';
import { AnimatedPressable } from '../AnimatedPressable';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

type Props = {
  currentLevel: string;
  onPressContinue: () => void;
};

const AdultLearningCardComponent: React.FC<Props> = ({
  currentLevel,
  onPressContinue,
}) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Học tiếng bản địa</Text>
      <Text style={styles.subtitle}>
        Bạn đang ở trình độ {currentLevel}
      </Text>

      <AnimatedPressable onPress={onPressContinue} style={styles.button}>
        <Text style={styles.buttonText}>Tiếp tục học</Text>
      </AnimatedPressable>
    </WidgetCard>
  );
};

export const AdultLearningCard = React.memo(AdultLearningCardComponent);

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
    backgroundColor: theme.colors.GraphiteBlue,
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

