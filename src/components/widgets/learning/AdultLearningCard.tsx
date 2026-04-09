import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { WidgetCard } from '../WidgetCard';
import { AnimatedPressable } from '../AnimatedPressable';

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
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginVertical: 8,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

