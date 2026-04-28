import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import type { DailyLoopAction } from '../../services/engagement';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
  title: { ...theme.typeScale.h2, color: theme.colors.GraphiteBlue, fontFamily: FontFamily.bold },
  streak: { marginTop: 4, ...theme.typeScale.caption, color: theme.colors.GraphiteBlue, fontFamily: FontFamily.semibold },
  suggestion: { marginTop: 8, ...theme.typeScale.body, color: theme.colors.text.secondary, fontFamily: FontFamily.regular },
  row: { marginTop: 10, flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.GraphiteBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  primaryText: { color: theme.colors.CeolWhite, ...theme.typeScale.body, fontFamily: FontFamily.bold, textAlign: 'center' },
  secondaryBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  secondaryText: { color: theme.colors.CeolWhite, ...theme.typeScale.body, fontFamily: FontFamily.semibold, textAlign: 'center' },
  reminder: { marginTop: 10, ...theme.typeScale.caption, color: theme.colors.text.secondary, fontFamily: FontFamily.regular },
  achievement: { marginTop: 6, ...theme.typeScale.caption, color: theme.colors.SoftEmerald, fontFamily: FontFamily.semibold },
});
