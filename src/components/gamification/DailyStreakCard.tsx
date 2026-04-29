import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type DailyStreakCardProps = {
  currentStreak?: number;
  maxDays?: number;
};

export function DailyStreakCard({
  currentStreak = 5,
  maxDays = 7,
}: DailyStreakCardProps) {
  const days = Array.from({ length: maxDays }, (_, idx) => idx + 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flame-outline" size={18} color={theme.colors.warning} />
          <Text style={styles.title}>Chuỗi ngày liên tiếp</Text>
        </View>
        <Text style={styles.value}>{currentStreak}/{maxDays}</Text>
      </View>

      <View style={styles.row}>
        {days.map((day) => {
          const active = day <= currentStreak;
          return (
            <View key={`day_${day}`} style={[styles.dayDot, active ? styles.dayActive : styles.dayInactive]}>
              <Text style={[styles.dayLabel, active ? styles.dayLabelActive : styles.dayLabelInactive]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  value: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: theme.colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.surfaceElevated,
  },
  dayInactive: {
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
  },
  dayLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  dayLabelActive: {
    color: theme.colors.warning,
  },
  dayLabelInactive: {
    color: theme.colors.text.secondary,
  },
});
