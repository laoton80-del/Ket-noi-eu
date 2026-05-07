import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { MarketCode } from '../../core/i18n/smartTrioTypes';
import { getAllTravelDirections, getTravelDirectionById } from '../../core/travel';
import type { TravelDirectionCommercialStatus, TravelDirectionDefinition, TravelDirectionId } from '../../core/travel/travelDirectionTypes';
import { useTranslation } from '../../i18n';
import { theme } from '../../theme/theme';

export type TravelDirectionSelectorProps = Readonly<{
  selectedId: TravelDirectionId | null;
  onSelect: (id: TravelDirectionId) => void;
}>;

function marketLabelKey(code: MarketCode): string {
  const slug = code === 'GLOBAL' ? 'global' : code.toLowerCase();
  return `smartTrio.market.${slug}`;
}

function statusLabelKey(s: TravelDirectionCommercialStatus): string {
  return `travel.direction.status.${s}`;
}

export function TravelDirectionSelector({ selectedId, onSelect }: TravelDirectionSelectorProps): ReactElement {
  const { t } = useTranslation();
  const directions = useMemo(() => getAllTravelDirections(), []);
  const { currentMarket, nativeLocale } = useSmartTrio();

  const contextLine = useMemo(() => {
    const marketLabel = t(marketLabelKey(currentMarket));
    const nativeLabel = t(`smartTrio.language.${nativeLocale}`);
    return t('travel.direction.contextLine', { market: marketLabel, native: nativeLabel });
  }, [currentMarket, nativeLocale, t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('travel.direction.title')}</Text>
      <Text style={styles.subtitle}>{t('travel.direction.subtitle')}</Text>
      <Text style={styles.contextHint}>{contextLine}</Text>
      <Text style={styles.liteNotice}>{t('travel.direction.liteNotice')}</Text>

      {directions.map((def) => (
        <DirectionCard key={def.id} def={def} selected={selectedId === def.id} onSelect={() => onSelect(def.id)} />
      ))}

      {selectedId ? (
        <Text style={styles.selectedLine}>
          {t('travel.direction.selected', {
            label: t(getTravelDirectionById(selectedId)?.titleKey ?? 'travel.direction.title'),
          })}
        </Text>
      ) : null}
    </View>
  );
}

type DirectionCardProps = Readonly<{
  def: TravelDirectionDefinition;
  selected: boolean;
  onSelect: () => void;
}>;

function DirectionCard({ def, selected, onSelect }: DirectionCardProps): ReactElement {
  const { t } = useTranslation();
  const previewActions = def.recommendedActions.slice(0, 3);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={t(def.titleKey)}
    >
      <View style={styles.cardTop}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeMain}>{t(def.badgeKey)}</Text>
          <Text style={styles.badgeStatus}>{t(statusLabelKey(def.status))}</Text>
        </View>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={theme.colors.primaryBright} /> : null}
      </View>
      <Text style={styles.cardTitle}>{t(def.titleKey)}</Text>
      <Text style={styles.cardSub}>{t(def.subtitleKey)}</Text>
      <View style={styles.actionList}>
        {previewActions.map((a) => (
          <View key={a.labelKey} style={styles.actionRow}>
            <Text style={styles.actionBullet}>•</Text>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionText} numberOfLines={2}>
                {t(a.labelKey)}
              </Text>
              <Text style={styles.actionPill}>{t(statusLabelKey(a.itemStatus))}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.cta}>{t(def.primaryCtaKey)}</Text>
    </Pressable>
  );
}

const INK = 'rgba(5, 11, 20, 0.92)';
const MUTE = 'rgba(5, 11, 20, 0.55)';

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    gap: 8,
    paddingRight: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: INK,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTE,
    lineHeight: 18,
  },
  contextHint: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(5, 11, 20, 0.45)',
  },
  liteNotice: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(5, 11, 20, 0.42)',
    lineHeight: 16,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5, 11, 20, 0.08)',
  },
  cardSelected: {
    borderColor: 'rgba(11, 42, 102, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 },
  badgeMain: {
    fontSize: 11,
    fontWeight: '800',
    color: INK,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B2A66',
    backgroundColor: 'rgba(11, 42, 102, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: INK },
  cardSub: { fontSize: 12, fontWeight: '600', color: MUTE, marginTop: 4, lineHeight: 17 },
  actionList: { marginTop: 10, gap: 6 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  actionBullet: { fontSize: 13, color: MUTE, marginTop: 1 },
  actionTextCol: { flex: 1, minWidth: 0, gap: 4 },
  actionText: { fontSize: 12, fontWeight: '600', color: INK, lineHeight: 16 },
  actionPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0B2A66',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11, 42, 102, 0.12)',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cta: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '900',
    color: '#0B2A66',
    backgroundColor: 'rgba(11, 42, 102, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  selectedLine: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#0B2A66',
  },
});
