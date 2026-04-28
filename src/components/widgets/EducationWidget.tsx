import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Props = {
  isUnlocked: boolean;
  currentLevel: string;
  onPressUpgrade: () => void;
};

const EducationWidgetComponent: React.FC<Props> = ({
  isUnlocked,
  currentLevel,
  onPressUpgrade,
}) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Học tập</Text>
      <Text style={styles.subtitle}>
        {isUnlocked
          ? `Bạn đang học ở mức ${currentLevel}`
          : 'Bạn chưa mở khóa trọn bộ B1-B2'}
      </Text>

      {!isUnlocked ? (
        <AnimatedPressable onPress={onPressUpgrade} style={styles.button}>
          <Text style={styles.buttonText}>Mở khóa trọn bộ (999 Credits)</Text>
        </AnimatedPressable>
      ) : null}
    </WidgetCard>
  );
};

export const EducationWidget = React.memo(EducationWidgetComponent);

const styles = StyleSheet.create({
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.GraphiteBlue,
    marginBottom: 8,
  },
  subtitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 14,
  },
  button: {
    backgroundColor: theme.colors.GraphiteBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
});

