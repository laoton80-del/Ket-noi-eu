import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WidgetCard } from '../WidgetCard';
import { AnimatedPressable } from '../AnimatedPressable';

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
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginVertical: 8,
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

