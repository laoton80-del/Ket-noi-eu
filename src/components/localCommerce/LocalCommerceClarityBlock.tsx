import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { LocalConstellationFrame } from '../local/LocalConstellationFrame';
import { localConstellation } from '../local/localConstellationTokens';
import { useSmartTrio } from '../../context/SmartTrioContext';
import type { LocalBookingStatus } from '../../core/localCommerce';
import { getAllLocalCommerceCapabilities } from '../../core/localCommerce';
import {
  premiumTileLayout,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import { PremiumAppTile, PremiumStatusChip, PremiumTileGrid } from '../viona';

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const EMERALD = localConstellation.accentEmerald;

const SAFETY_PILLS = [
  { key: 'pillRequestOnly', icon: 'paper-plane-outline' as const },
  { key: 'pillNoPayment', icon: 'card-outline' as const },
  { key: 'pillConfirmedNotPaid', icon: 'information-circle-outline' as const },
] as const;

const STATUS_LEGEND = [
  { key: 'legendRequestSent', icon: 'send-outline' as const },
  { key: 'legendMerchantConfirmed', icon: 'checkmark-circle-outline' as const },
  { key: 'legendMerchantDeclined', icon: 'close-circle-outline' as const },
  { key: 'legendConfirmedNotPaid', icon: 'alert-circle-outline' as const },
] as const;

export type LocalCommerceClarityBlockProps = Readonly<{
  onBrowseServices: () => void;
  onRequestBookingAssist: () => void;
}>;

function bookingStatusKey(s: LocalBookingStatus): string {
  return `localCommerce.bookingStatus.${s}`;
}

function safetyKey(suffix: (typeof SAFETY_PILLS)[number]['key'] | (typeof STATUS_LEGEND)[number]['key']): string {
  return `localCommerce.safety.${suffix}`;
}

function resolveClarityGridColumns(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width < 400) return 1;
  if (width < 480) return 2;
  return 2;
}

function resolveClarityCtaColumns(width: number): number {
  if (width < 400) return 1;
  return 2;
}

/** Semantic feature accent per capability — leading Local atmosphere stays emerald. */
function localCapabilityFeatureAccent(capId: string): VionaUniverseAccent {
  switch (capId) {
    case 'localMarketplace':
    case 'bookingRequest':
      return 'emerald';
    case 'serviceMenu':
      return 'cyan';
    case 'merchantDashboard':
      return 'gold';
    case 'aiReceptionistPilot':
    case 'nativeLanguageBooking':
      return 'violet';
    default:
      return 'emerald';
  }
}

function localCapabilityIcon(capId: string): keyof typeof Ionicons.glyphMap {
  switch (capId) {
    case 'localMarketplace':
      return 'storefront-outline';
    case 'serviceMenu':
      return 'menu-outline';
    case 'bookingRequest':
      return 'paper-plane-outline';
    case 'merchantDashboard':
      return 'grid-outline';
    case 'aiReceptionistPilot':
      return 'chatbubbles-outline';
    case 'nativeLanguageBooking':
      return 'language-outline';
    default:
      return 'ellipse-outline';
  }
}

function statusLegendFeatureAccent(
  key: (typeof STATUS_LEGEND)[number]['key']
): VionaUniverseAccent {
  switch (key) {
    case 'legendRequestSent':
      return 'cyan';
    case 'legendMerchantConfirmed':
    case 'legendConfirmedNotPaid':
      return 'emerald';
    case 'legendMerchantDeclined':
      return 'magenta';
    default:
      return 'emerald';
  }
}

function modeStatusFeatureAccent(status: LocalBookingStatus): VionaUniverseAccent {
  switch (status) {
    case 'lite':
    case 'pilot':
      return 'cyan';
    case 'requestOnly':
      return 'emerald';
    case 'demo':
      return 'violet';
    case 'comingSoon':
      return 'gold';
    case 'gated':
      return 'magenta';
    default:
      return 'emerald';
  }
}

export function LocalCommerceClarityBlock({
  onBrowseServices,
  onRequestBookingAssist,
}: LocalCommerceClarityBlockProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const caps = useMemo(() => getAllLocalCommerceCapabilities(), []);
  const { customerLocale, merchantLocale, nativeLocale } = useSmartTrio();
  const isClarityMobile = width < 480;
  const gridColumns = resolveClarityGridColumns(width);
  const ctaColumns = resolveClarityCtaColumns(width);

  const trioLine = useMemo(
    () =>
      t('localCommerce.smartTrioContext', {
        customer: t(`smartTrio.language.${customerLocale}`),
        merchant: t(`smartTrio.language.${merchantLocale}`),
        native: t(`smartTrio.language.${nativeLocale}`),
      }),
    [customerLocale, merchantLocale, nativeLocale, t]
  );

  const statusOrder: readonly LocalBookingStatus[] = [
    'lite',
    'requestOnly',
    'demo',
    'pilot',
    'comingSoon',
    'gated',
  ];

  return (
    <LocalConstellationFrame
      accent="emerald"
      tier="service"
      radius={14}
      style={styles.card}
      contentStyle={[styles.cardInner, isClarityMobile && styles.cardInnerMobile]}
    >
      <Text style={[styles.title, isClarityMobile && styles.titleMobile]}>{t('localCommerce.title')}</Text>
      <Text style={[styles.subtitle, isClarityMobile && styles.subtitleMobile]} numberOfLines={isClarityMobile ? 3 : 2}>
        {t('localCommerce.compactSubtitle')}
      </Text>

      <View style={[styles.chipRow, isClarityMobile && styles.chipRowMobile]}>
        {SAFETY_PILLS.map((pill) => (
          <PremiumStatusChip key={pill.key} accent="emerald" label={t(safetyKey(pill.key))} />
        ))}
      </View>

      <PremiumTileGrid
        columns={ctaColumns}
        wrapCells
        gap={premiumTileLayout.gridGapTight}
        style={styles.tileSection}
      >
        <PremiumAppTile
          variant="local"
          accent="emerald"
          width="100%"
          icon="apps-outline"
          statusLabel={t('localCommerce.bookingStatus.lite')}
          title={t('localCommerce.cta.browseServices')}
          subtitle={t('localCommerce.compactBrowseSub')}
          onPress={onBrowseServices}
          accessibilityLabel={t('localCommerce.cta.browseServices')}
        />
        <PremiumAppTile
          variant="local"
          accent="cyan"
          width="100%"
          icon="chatbubble-ellipses-outline"
          statusLabel={t('localCommerce.bookingStatus.requestOnly')}
          title={t('localCommerce.cta.requestBooking')}
          subtitle={t('localCommerce.compactAssistSub')}
          onPress={onRequestBookingAssist}
          accessibilityLabel={t('localCommerce.cta.requestBooking')}
        />
      </PremiumTileGrid>

      <Text style={styles.sectionKicker}>{t('localCommerce.safety.legendTitle')}</Text>
      <PremiumTileGrid columns={gridColumns} wrapCells gap={premiumTileLayout.gridGapTight} style={styles.tileSection}>
        {STATUS_LEGEND.map((item) => (
          <PremiumAppTile
            key={item.key}
            variant="local"
            accent={statusLegendFeatureAccent(item.key)}
            width="100%"
            icon={item.icon}
            title={t(safetyKey(item.key))}
            statusLabel={t('localCommerce.bookingStatus.requestOnly')}
            accessibilityLabel={t(safetyKey(item.key))}
          />
        ))}
      </PremiumTileGrid>

      <Text style={styles.sectionKicker}>{t('localCommerce.safety.modeChipsTitle')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
        <View style={styles.modeRow}>
          {statusOrder.map((s) => (
            <PremiumStatusChip key={s} accent={modeStatusFeatureAccent(s)} label={t(bookingStatusKey(s))} />
          ))}
        </View>
      </ScrollView>

      <Text style={styles.safetyNote} numberOfLines={2}>
        {t('localCommerce.safety.bookingRequestNote')}
      </Text>

      <Text style={styles.trioHint} numberOfLines={1}>
        {trioLine}
      </Text>

      <Text style={styles.sectionKicker}>{t('localCommerce.compactCapabilitiesKicker')}</Text>
      <PremiumTileGrid columns={gridColumns} wrapCells gap={premiumTileLayout.gridGapTight} style={styles.tileSectionLast}>
        {caps.map((c) => (
          <PremiumAppTile
            key={c.id}
            variant="local"
            accent={localCapabilityFeatureAccent(c.id)}
            width="100%"
            icon={localCapabilityIcon(c.id)}
            statusLabel={t(bookingStatusKey(c.status))}
            title={t(c.titleKey)}
            subtitle={t(c.descriptionKey)}
            accessibilityLabel={`${t(c.titleKey)}. ${t(c.descriptionKey)}. ${t(bookingStatusKey(c.status))}`}
          />
        ))}
      </PremiumTileGrid>
    </LocalConstellationFrame>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  cardInner: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 0,
    maxWidth: '100%',
    width: '100%',
  },
  cardInnerMobile: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  title: { fontSize: 15, fontFamily: FontFamily.extrabold, color: INK, letterSpacing: -0.15 },
  titleMobile: { fontSize: 14 },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    lineHeight: 15,
  },
  subtitleMobile: { fontSize: 10, lineHeight: 14 },
  chipRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipRowMobile: { marginTop: 6, gap: 5 },
  tileSection: { marginTop: 10, marginBottom: 4, maxWidth: '100%', width: '100%' },
  tileSectionLast: { marginTop: 8, marginBottom: 0 },
  sectionKicker: {
    marginTop: 10,
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: EMERALD,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  modeScroll: { marginTop: 6, maxHeight: 36 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  safetyNote: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    lineHeight: 14,
  },
  trioHint: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    lineHeight: 14,
  },
});
