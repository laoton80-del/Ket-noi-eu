import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { MarketCode } from '../../core/i18n/smartTrioTypes';
import { getAllTravelDirections, getTravelDirectionById } from '../../core/travel';
import type { TravelDirectionCommercialStatus, TravelDirectionDefinition, TravelDirectionId } from '../../core/travel/travelDirectionTypes';
import { localConstellation } from '../local/localConstellationTokens';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import { TravelGlassCard, type TravelSemanticAccent } from './TravelGlassCard';

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const INK_SUB = localConstellation.inkCardSub;
const CYAN = localConstellation.accentCyan;
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
  const { width } = useWindowDimensions();
  const directions = useMemo(() => getAllTravelDirections(), []);
  const { currentMarket, nativeLocale } = useSmartTrio();
  const compactLayout = width < 768;
  const [expanded, setExpanded] = useState(false);

  const contextLine = useMemo(() => {
    const marketLabel = t(marketLabelKey(currentMarket));
    const nativeLabel = t(`smartTrio.language.${nativeLocale}`);
    return t('travel.direction.contextLine', { market: marketLabel, native: nativeLabel });
  }, [currentMarket, nativeLocale, t]);

  const toggleA11y = expanded ? t('travel.direction.collapseA11y') : t('travel.direction.expandA11y');

  return (
    <View style={styles.wrapQuiet}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={toggleA11y}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.headerRow, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.headerText}>
          <Text style={styles.sectionKicker}>{t('travel.direction.sectionKicker')}</Text>
          <Text style={styles.title} numberOfLines={expanded ? 2 : 1}>
            {t('travel.direction.title')}
          </Text>
          {expanded ? (
            <Text style={styles.subtitle}>{t('travel.direction.subtitle')}</Text>
          ) : (
            <Text style={styles.collapsedHint} numberOfLines={2}>
              {t('travel.direction.collapsedHint')}
            </Text>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={CYAN} />
      </Pressable>

      {expanded ? (
        <>
          <Text style={styles.contextHint}>{contextLine}</Text>
          <Text style={styles.liteNotice}>{t('travel.direction.liteNotice')}</Text>

          <View style={[styles.cardGrid, compactLayout ? styles.cardGridSingle : styles.cardGridDual]}>
            {directions.map((def) => (
              <View key={def.id} style={[styles.cardCell, compactLayout ? styles.cardCellFull : styles.cardCellHalf]}>
                <DirectionCard
              def={def}
              accent={directionAccent(def.id)}
              selected={selectedId === def.id}
              onSelect={() => onSelect(def.id)}
            />
              </View>
            ))}
          </View>

          {selectedId ? (
            <Text style={styles.selectedLine}>
              {t('travel.direction.selected', {
                label: t(getTravelDirectionById(selectedId)?.titleKey ?? 'travel.direction.title'),
              })}
            </Text>
          ) : null}
        </>
      ) : selectedId ? (
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
  accent: TravelSemanticAccent;
  selected: boolean;
  onSelect: () => void;
}>;

function directionAccent(id: TravelDirectionId): TravelSemanticAccent {
  if (id === 'vietnameseAbroad') return 'cyan';
  if (id === 'inboundVietnam') return 'gold';
  return 'violet';
}

function DirectionCard({ def, accent, selected, onSelect }: DirectionCardProps): ReactElement {
  const { t } = useTranslation();

  return (
    <TravelGlassCard
      visual="standard"
      accent={accent}
      onPress={onSelect}
      accessibilityLabel={t(def.titleKey)}
      contentStyle={styles.cardInner}
      style={selected ? styles.cardSelectedShell : undefined}
    >
      <View style={styles.cardTop}>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeMain}>{t(def.badgeKey)}</Text>
          <Text style={styles.badgeStatus}>{t(statusLabelKey(def.status))}</Text>
        </View>
        {selected ? <Ionicons name="checkmark-circle" size={20} color={CYAN} /> : null}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {t(def.titleKey)}
      </Text>
      <Text style={styles.cardSub} numberOfLines={3}>
        {t(def.subtitleKey)}
      </Text>
      <Text style={styles.cta}>{t(def.primaryCtaKey)}</Text>
    </TravelGlassCard>
  );
}

const styles = StyleSheet.create({
  wrapQuiet: {
    gap: 6,
    opacity: 0.88,
  },
  sectionKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(186, 198, 214, 0.88)',
    letterSpacing: 0.85,
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 17,
  },
  contextHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
  },
  liteNotice: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
    marginBottom: 4,
  },
  cardGrid: {
    gap: 10,
    marginTop: 4,
  },
  cardGridSingle: {
    flexDirection: 'column',
  },
  cardGridDual: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardCell: {},
  cardCellFull: {
    width: '100%',
  },
  cardCellHalf: {
    width: '48.5%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 44,
    paddingVertical: 4,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  collapsedHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
  },
  cardInner: {
    gap: 5,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  cardSelectedShell: {
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.42)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 },
  badgeMain: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: CYAN,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeStatus: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: INK,
    backgroundColor: localConstellation.statusCyanFill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  cardSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 15,
  },
  cta: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: CYAN,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  selectedLine: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
  },
});
