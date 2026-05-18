import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../../i18n';
import { WidgetCard } from '../../widgets/WidgetCard';
import { AnimatedPressable } from '../../widgets/AnimatedPressable';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';

/** Single source of truth for adult situation i18n keys (grid + today's suggestion). */
export const ADULT_SITUATION_ITEM_KEYS = [
  'doctor',
  'paperwork',
  'work',
  'phone',
  'school',
  'grocery',
] as const;

export type AdultSituationKey = (typeof ADULT_SITUATION_ITEM_KEYS)[number];

const FALLBACK_SITUATION_KEY: AdultSituationKey = 'doctor';

export function situationLabelForKey(
  key: AdultSituationKey,
  t: (key: string) => string
): string {
  return t(`academySub.adult.situations.${key}`);
}

export function pickSuggestedSituationKeyToday(): AdultSituationKey {
  if (!ADULT_SITUATION_ITEM_KEYS.length) return FALLBACK_SITUATION_KEY;
  const idx = new Date().getDate() % ADULT_SITUATION_ITEM_KEYS.length;
  return ADULT_SITUATION_ITEM_KEYS[idx] ?? FALLBACK_SITUATION_KEY;
}

/** @deprecated Use pickSuggestedSituationKeyToday + situationLabelForKey — kept for legacy exports. */
export const ADULT_SITUATION_ITEMS = ADULT_SITUATION_ITEM_KEYS;

export function pickSuggestedSituationToday(): string {
  return pickSuggestedSituationKeyToday();
}

type Props = {
  onPressSituation: (label: string) => void;
};

const SituationGridComponent: React.FC<Props> = ({ onPressSituation }) => {
  const { t } = useTranslation();

  return (
    <WidgetCard>
      <Text style={styles.sectionTitle}>{t('academySub.adult.situationSection')}</Text>
      <Text style={styles.hint}>{t('academySub.adult.situationHint')}</Text>
      <View style={styles.grid}>
        {ADULT_SITUATION_ITEM_KEYS.map((key) => {
          const label = situationLabelForKey(key, t);
          return (
            <AnimatedPressable
              key={key}
              onPress={() => onPressSituation(label)}
              style={styles.chip}
            >
              <Text style={styles.chipText} numberOfLines={2}>
                {label}
              </Text>
            </AnimatedPressable>
          );
        })}
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
