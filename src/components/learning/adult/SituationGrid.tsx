import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WidgetCard } from '../../widgets/WidgetCard';
import { AnimatedPressable } from '../../widgets/AnimatedPressable';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

/** Single source of truth for adult “tình huống” labels (grid + gợi ý hôm nay). */
export const ADULT_SITUATION_ITEMS = [
  'Đi khám bệnh',
  'Làm giấy tờ',
  'Đi làm',
  'Gọi điện',
  'Trường học',
  'Siêu thị',
] as const;

const FALLBACK_SITUATION = 'Đi khám bệnh';

export function pickSuggestedSituationToday(): string {
  if (!ADULT_SITUATION_ITEMS.length) return FALLBACK_SITUATION;
  const idx = new Date().getDate() % ADULT_SITUATION_ITEMS.length;
  return ADULT_SITUATION_ITEMS[idx] ?? FALLBACK_SITUATION;
}

type Props = {
  onPressSituation: (label: string) => void;
};

const SituationGridComponent: React.FC<Props> = ({ onPressSituation }) => {
  return (
    <WidgetCard>
      <Text style={styles.sectionTitle}>Chọn tình huống</Text>
      <Text style={styles.hint}>Chạm để mở Học tập</Text>
      <View style={styles.grid}>
        {ADULT_SITUATION_ITEMS.map((label) => (
          <AnimatedPressable
            key={label}
            onPress={() => onPressSituation(label)}
            style={styles.chip}
          >
            <Text style={styles.chipText} numberOfLines={2}>
              {label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </WidgetCard>
  );
};

export const SituationGrid = React.memo(SituationGridComponent);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: '47%',
    minHeight: 44,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
