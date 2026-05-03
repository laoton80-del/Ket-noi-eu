import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

