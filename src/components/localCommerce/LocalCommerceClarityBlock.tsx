import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { LocalBookingStatus } from '../../core/localCommerce';
import { getAllLocalCommerceCapabilities } from '../../core/localCommerce';
import { premiumLuminousInk, premiumTileLayout, type VionaUniverseAccent } from '../../design/premiumTileVisualTokens';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import { PremiumAppTile, PremiumSection, PremiumStatusChip, PremiumTileGrid } from '../viona';

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
  return 2;
}

function resolveClarityCtaColumns(width: number): number {
  if (width < 400) return 1;
  return 2;
}

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

/** Hub status strip — safety chips + compact commerce context (no-charge visible). */
export function LocalCommerceHubStatusStrip(): ReactElement {
  const { t } = useTranslation();
  return (
    <PremiumSection
      kicker={t('localCommerce.title')}
      subtitle={t('localCommerce.compactSubtitle')}
      leadingAccent="emerald"
      compact
      testID="local-clarity-status-strip"
    >
      <View style={styles.chipRow}>
        {SAFETY_PILLS.map((pill) => (
          <PremiumStatusChip key={pill.key} accent="emerald" label={t(safetyKey(pill.key))} />
        ))}
      </View>
    </PremiumSection>
  );
}

/** Hub primary actions — browse + booking assist (controlled multicolor). */
export function LocalCommerceHubPrimaryActions({
  onBrowseServices,
  onRequestBookingAssist,
}: LocalCommerceClarityBlockProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const ctaColumns = resolveClarityCtaColumns(width);

  return (
    <PremiumTileGrid columns={ctaColumns} wrapCells gap={premiumTileLayout.gridGapTight}>
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
  );
}

/** Request status guide — legend tiles + mode chips (semantic multicolor). */
export function LocalCommerceHubStatusGuide(): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const gridColumns = resolveClarityGridColumns(width);
  const { customerLocale, merchantLocale, nativeLocale } = useSmartTrio();

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
    <PremiumSection
      kicker={t('localCommerce.safety.legendTitle')}
      subtitle={t('localCommerce.safety.bookingRequestNote')}
      leadingAccent="emerald"
      compact
      testID="local-clarity-status-guide"
    >
      <PremiumTileGrid columns={gridColumns} wrapCells gap={premiumTileLayout.gridGapTight}>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
        <View style={styles.modeRow}>
          {statusOrder.map((s) => (
            <PremiumStatusChip key={s} accent={modeStatusFeatureAccent(s)} label={t(bookingStatusKey(s))} />
          ))}
        </View>
      </ScrollView>
      <Text style={styles.trioHint} numberOfLines={2}>
        {trioLine}
      </Text>
    </PremiumSection>
  );
}

/** Capability preview grid — controlled multicolor per feature meaning. */
export function LocalCommerceHubCapabilities(): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const caps = useMemo(() => getAllLocalCommerceCapabilities(), []);
  const gridColumns = resolveClarityGridColumns(width);

  return (
    <PremiumSection
      kicker={t('localCommerce.compactCapabilitiesKicker')}
      leadingAccent="emerald"
      compact
      testID="local-clarity-capabilities"
    >
      <PremiumTileGrid columns={gridColumns} wrapCells gap={premiumTileLayout.gridGapTight}>
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
    </PremiumSection>
  );
}

/** @deprecated Use hub slot exports; kept for gradual migration. */
export function LocalCommerceClarityBlock({
  onBrowseServices,
  onRequestBookingAssist,
}: LocalCommerceClarityBlockProps): ReactElement {
  return (
    <View style={styles.legacyStack}>
      <LocalCommerceHubStatusStrip />
      <LocalCommerceHubPrimaryActions
        onBrowseServices={onBrowseServices}
        onRequestBookingAssist={onRequestBookingAssist}
      />
      <LocalCommerceHubStatusGuide />
      <LocalCommerceHubCapabilities />
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
    maxWidth: '100%',
  },
  modeScroll: { marginTop: 8, maxHeight: 40 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  trioHint: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
    lineHeight: 14,
  },
  legacyStack: { width: '100%', maxWidth: '100%', gap: 10 },
});
