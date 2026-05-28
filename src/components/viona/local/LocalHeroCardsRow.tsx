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
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../i18n';
import { LocalHomeParityCard } from './LocalHomeParityCard';

export type LocalHeroCardsRowProps = Readonly<{
  /** Drives hero crossfade and card edge-lit hover boost (includes `default` when idle). */
  hoveredHeroKey?: LocalHeroVisualKey;
  /** @deprecated Ignored — Local cards use theme-invariant premium glass. */
  daylight?: boolean;
  onMyRequests: () => void;
  onBookingAssist: () => void;
  onLegalWealth: () => void;
  onBrowseServices: () => void;
  onHeroCardHover?: (key: LocalHeroVisualKey) => void;
  onHeroCardLeave?: () => void;
  testID?: string;
}>;

export function LocalHeroCardsRow({
  hoveredHeroKey = 'default',
  onMyRequests,
  onBookingAssist,
  onLegalWealth,
  onBrowseServices,
  onHeroCardHover,
  onHeroCardLeave,
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

  const cellStyle = [styles.cell, desktopRow && styles.cellQuarter, oneCol && styles.cellFull];
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

  return (
    <View testID={testID} style={styles.wrap}>
      <Text style={styles.kicker}>{t('localHub.reframe.flagshipRowKicker')}</Text>
      {useCarousel ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.carouselContent}
        >
          {cardDefs.map((c) => (
            <View
              key={c.testID}
              style={[styles.cell, { width: carouselWidth }]}
              {...(Platform.OS === 'web'
                ? ({
                    onMouseEnter: () => onHeroCardHover?.(c.heroKey),
                    onMouseLeave: () => onHeroCardLeave?.(),
                  } as const)
                : {})}
            >
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
                edgeLitHoverBoost={hoveredHeroKey === c.heroKey}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.grid, { flexDirection: 'row', flexWrap: desktopRow ? 'nowrap' : 'wrap' }]}>
          {cardDefs.map((c) => (
            <View
              key={c.testID}
              style={cellStyle}
              {...(Platform.OS === 'web'
                ? ({
                    onMouseEnter: () => onHeroCardHover?.(c.heroKey),
                    onMouseLeave: () => onHeroCardLeave?.(),
                  } as const)
                : {})}
            >
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
                edgeLitHoverBoost={hoveredHeroKey === c.heroKey}
                stretchInColumn={stretch}
              />
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
    gap: 8,
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(140, 200, 185, 0.72)',
  },
  grid: {
    width: '100%',
    gap: 10,
  },
  carouselContent: {
    gap: 10,
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
  cellFull: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
});
