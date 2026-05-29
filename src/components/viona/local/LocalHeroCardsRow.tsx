/**
 * Four Local flagship cards — Home world-card row grammar.
 */
import { useMemo, type ReactElement } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getLocalHeroCardAsset, type LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import { getLocalHeroVisualSpec } from '../../../design/vionaLocalHeroVisuals';
import {
  FASHION_HOME_WORLD_CAROUSEL_MAX_WIDTH,
  FASHION_HOME_WORLD_DESKTOP_ROW_MIN_WIDTH,
  FASHION_HOME_WORLD_ONE_COL_GRID_MAX_WIDTH,
  FASHION_HOME_WORLD_TWO_COL_MIN_WIDTH,
} from '../../../navigation/fashionHomeDesktopShell';
import { vionaTokens } from '../../../design';
import { fashionHomeWebOpeningStageCardCellStyle } from '../fashionHomeDesktopShell';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../i18n';
import { LocalHomeParityCard } from './LocalHomeParityCard';

/** Kicker band between dynamic hero and flagship cards — kept visible; spacing tuned vs Home 6px hero→cards. */
export const LOCAL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX = 12;
export const LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_PX = 4;
/** Fullscreen opening stage — tighter kicker → grid gap. */
export const LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_FULLSCREEN_PX = 2;
/** Fullscreen desktop flagship card min height (Home opening stage uses 180px). */
export const LOCAL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX = 160;

export type LocalHeroCardsRowProps = Readonly<{
  /** @deprecated Cards manage pointer hover internally; still drives hero via callbacks. */
  hoveredHeroKey?: LocalHeroVisualKey;
  /** @deprecated Ignored — Local cards use theme-invariant premium glass. */
  daylight?: boolean;
  onMyRequests: () => void;
  onBookingAssist: () => void;
  onLegalWealth: () => void;
  onBrowseServices: () => void;
  onHeroCardHover?: (key: LocalHeroVisualKey) => void;
  onHeroCardLeave?: () => void;
  /** Web desktop browser fullscreen — tighter kicker gap + slightly shorter cards. */
  openingStageFullscreen?: boolean;
  testID?: string;
}>;

export function LocalHeroCardsRow({
  hoveredHeroKey: _hoveredHeroKey = 'default',
  onMyRequests,
  onBookingAssist,
  onLegalWealth,
  onBrowseServices,
  onHeroCardHover,
  onHeroCardLeave,
  openingStageFullscreen = false,
  testID = 'local-hero-cards-row',
}: LocalHeroCardsRowProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const webImageStyles =
    Platform.OS === 'web'
      ? {
          myRequests: {
            objectFit: 'cover' as const,
            objectPosition: getLocalHeroVisualSpec('myRequests').preferredObjectPosition,
          },
          bookingAssist: {
            objectFit: 'cover' as const,
            objectPosition: getLocalHeroVisualSpec('bookingAssist').preferredObjectPosition,
          },
          legalWealth: {
            objectFit: 'cover' as const,
            objectPosition: getLocalHeroVisualSpec('legalWealth').preferredObjectPosition,
          },
          browseServices: {
            objectFit: 'cover' as const,
            objectPosition: getLocalHeroVisualSpec('browseServices').preferredObjectPosition,
          },
        }
      : undefined;

  const useCarousel = width <= FASHION_HOME_WORLD_CAROUSEL_MAX_WIDTH;
  const desktopRow = width >= FASHION_HOME_WORLD_DESKTOP_ROW_MIN_WIDTH;
  const oneCol = !useCarousel && !desktopRow && width <= FASHION_HOME_WORLD_ONE_COL_GRID_MAX_WIDTH;
  const twoCol =
    !useCarousel && !desktopRow && !oneCol && width >= FASHION_HOME_WORLD_TWO_COL_MIN_WIDTH;

  const carouselWidth = useMemo(
    () => Math.min(292, Math.max(256, Math.round(width * 0.78))),
    [width]
  );

  const cellStyle = [
    styles.cell,
    desktopRow && styles.cellQuarter,
    oneCol && styles.cellFull,
    desktopRow &&
      (openingStageFullscreen
        ? styles.cellQuarterFullscreen
        : fashionHomeWebOpeningStageCardCellStyle()),
  ];
  const stretch = desktopRow || twoCol;

  const cardDefs = [
    {
      accent: 'emerald' as const,
      title: t('local.userRequestStatus.localTileTitle'),
      subtitle: t('local.userRequestStatus.localTileSub'),
      statusLabel: t('localCommerce.bookingStatus.requestOnly'),
      statusTone: 'lite' as const,
      icon: 'list-outline' as const,
      heroKey: 'myRequests' as const,
      backgroundImage: getLocalHeroCardAsset('myRequests'),
      imageStyle: webImageStyles?.myRequests,
      onPress: onMyRequests,
      a11y: t('local.userRequestStatus.localTileA11y'),
      testID: 'local-tile-my-requests',
    },
    {
      accent: 'cyan' as const,
      title: t('localCommerce.cta.requestBooking'),
      subtitle: t('localCommerce.compactAssistSub'),
      statusLabel: t('localCommerce.bookingStatus.requestOnly'),
      statusTone: 'lite' as const,
      icon: 'chatbubble-ellipses-outline' as const,
      heroKey: 'bookingAssist' as const,
      backgroundImage: getLocalHeroCardAsset('bookingAssist'),
      imageStyle: webImageStyles?.bookingAssist,
      onPress: onBookingAssist,
      a11y: t('localCommerce.cta.requestBooking'),
      testID: 'local-cta-booking-assist',
    },
    {
      accent: 'gold' as const,
      title: t('localHub.legalWealthTitle'),
      subtitle: t('localHub.legalWealthSub'),
      statusLabel: t('localCommerce.bookingStatus.demo'),
      statusTone: 'demo' as const,
      icon: 'scale-outline' as const,
      heroKey: 'legalWealth' as const,
      backgroundImage: getLocalHeroCardAsset('legalWealth'),
      imageStyle: webImageStyles?.legalWealth,
      onPress: onLegalWealth,
      a11y: t('localHub.legalWealthTitle'),
      testID: 'local-tile-legal-wealth',
    },
    {
      accent: 'violet' as const,
      title: t('localCommerce.cta.browseServices'),
      subtitle: t('localCommerce.compactBrowseSub'),
      statusLabel: t('localCommerce.bookingStatus.lite'),
      statusTone: 'lite' as const,
      icon: 'apps-outline' as const,
      heroKey: 'browseServices' as const,
      backgroundImage: getLocalHeroCardAsset('browseServices'),
      imageStyle: webImageStyles?.browseServices,
      onPress: onBrowseServices,
      a11y: t('localCommerce.cta.browseServices'),
      testID: 'local-cta-browse-services',
    },
  ];

  const onHeroHoverChange = (key: LocalHeroVisualKey | null) => {
    if (key != null) onHeroCardHover?.(key);
    else onHeroCardLeave?.();
  };

  const renderCard = (c: (typeof cardDefs)[number], stretch: boolean) => (
    <LocalHomeParityCard
      accent={c.accent}
      title={c.title}
      subtitle={c.subtitle}
      statusLabel={c.statusLabel}
      statusTone={c.statusTone}
      icon={c.icon}
      backgroundImage={c.backgroundImage}
      imageStyle={c.imageStyle}
      onPress={c.onPress}
      accessibilityLabel={c.a11y}
      testID={c.testID}
      heroKey={c.heroKey}
      onHeroHoverChange={onHeroHoverChange}
      stretchInColumn={stretch}
    />
  );

  return (
    <View
      testID={testID}
      style={[
        styles.wrap,
        openingStageFullscreen && styles.wrapFullscreen,
      ]}
    >
      <Text style={styles.kicker}>{t('localHub.reframe.flagshipRowKicker')}</Text>
      {useCarousel ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.carouselContent}
        >
          {cardDefs.map((c) => (
            <View key={c.testID} style={[styles.cell, { width: carouselWidth }]}>
              {renderCard(c, false)}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.grid, { flexDirection: 'row', flexWrap: desktopRow ? 'nowrap' : 'wrap' }]}>
          {cardDefs.map((c) => (
            <View key={c.testID} style={cellStyle}>
              {renderCard(c, stretch)}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_PX,
  },
  wrapFullscreen: {
    gap: LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_FULLSCREEN_PX,
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    lineHeight: LOCAL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(140, 200, 185, 0.72)',
  },
  grid: {
    width: '100%',
    gap: vionaTokens.spacing[12],
  },
  carouselContent: {
    gap: vionaTokens.spacing[12],
    paddingRight: 8,
  },
  cell: {
    minWidth: 0,
    flexGrow: 1,
    flexBasis: '48%',
    maxWidth: '100%',
  },
  cellQuarter: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '25%',
  },
  cellQuarterFullscreen: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '25%',
    alignSelf: 'stretch',
    minHeight: LOCAL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX,
  },
  cellFull: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
});
