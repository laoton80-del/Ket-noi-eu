import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import type { DailyLoopAction } from '../../services/engagement';

type Props = {
  streakDays: number;
  suggestion: string;
  reminder: string;
  achievement?: string | null;
  primaryLabel: string;
  primaryAction: DailyLoopAction;
  secondaryLabel: string;
  secondaryAction: DailyLoopAction;
  onAction: (action: DailyLoopAction) => void;
};

const DailyEngagementCardComponent: React.FC<Props> = ({
  streakDays,
  suggestion,
  reminder,
  achievement,
  primaryLabel,
  primaryAction,
  secondaryLabel,
  secondaryAction,
  onAction,
}) => {
  return (
    <WidgetCard>
      <Text style={styles.title}>Nhip hom nay</Text>
      <Text style={styles.streak}>Streak: {streakDays} ngay</Text>
      <Text style={styles.suggestion}>{suggestion}</Text>
      <View style={styles.row}>
        <AnimatedPressable onPress={() => onAction(primaryAction)} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => onAction(secondaryAction)} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </AnimatedPressable>
      </View>
      <Text style={styles.reminder}>{reminder}</Text>
      {achievement ? <Text style={styles.achievement}>{achievement}</Text> : null}
    </WidgetCard>
  );
};

export const DailyEngagementCard = React.memo(DailyEngagementCardComponent);

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  streak: { marginTop: 4, fontSize: 13, color: '#374151', fontWeight: '600' },
  suggestion: { marginTop: 8, fontSize: 13, color: '#4B5563', lineHeight: 18 },
  row: { marginTop: 10, flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  primaryText: { color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  secondaryBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  secondaryText: { color: '#FFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  reminder: { marginTop: 10, fontSize: 12, color: '#6B7280', lineHeight: 17 },
  achievement: { marginTop: 6, fontSize: 12, color: '#065F46', fontWeight: '600', lineHeight: 17 },
});
