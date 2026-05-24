import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LocalConstellationFrame } from '../local/LocalConstellationFrame';
import {
  localAccentInk,
  localAccentInkHover,
  localConstellation,
  localWebCompactGlassChipStyle,
  type LocalConstellationAccent,
} from '../local/localConstellationTokens';
import { useSmartTrio } from '../../context/SmartTrioContext';
import type { LocalBookingStatus } from '../../core/localCommerce';
import { getAllLocalCommerceCapabilities } from '../../core/localCommerce';
import { PremiumStatusChip } from '../viona/PremiumStatusChip';
import {
  premiumGlassSurface,
  premiumTileGlass,
  premiumUniverseAccentSpec,
  premiumUniverseStroke,
} from '../../design/premiumTileVisualTokens';
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';

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

function ClarityGlassChip({
  children,
  accent = 'emerald',
}: Readonly<{ children: ReactNode; accent?: LocalConstellationAccent }>) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      disabled
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={[
        styles.glassChip,
        Platform.OS === 'web'
          ? localWebCompactGlassChipStyle(accent, hovered)
          : { borderColor: localConstellation.border, borderWidth: 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

function SafetyTrustPill({
  icon,
  label,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}>) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      disabled
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={[
        styles.trustPill,
        Platform.OS === 'web' ? localWebCompactGlassChipStyle('emerald', hovered) : { borderColor: 'rgba(72, 210, 165, 0.28)', borderWidth: 1 },
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={14} color={EMERALD} accessibilityIgnoresInvertColors />
      <Text style={styles.trustPillText} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatusLegendItem({
  icon,
  label,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}>) {
  return (
    <View style={styles.legendItem} accessibilityRole="text" accessible accessibilityLabel={label}>
      <View style={styles.legendIconWrap}>
        <Ionicons name={icon} size={15} color={EMERALD} accessibilityIgnoresInvertColors />
      </View>
      <Text style={styles.legendText} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function LocalCommerceClarityBlock({
  onBrowseServices,
  onRequestBookingAssist,
}: LocalCommerceClarityBlockProps): ReactElement {
  const { t } = useTranslation();
  const caps = useMemo(() => getAllLocalCommerceCapabilities(), []);
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
  const audienceItems = [
    {
      title: t('localCommerce.vietnameseAbroadTitle'),
      subtitle: t('localCommerce.vietnameseAbroadSubtitle'),
    },
    {
      title: t('localCommerce.nativeCustomerTitle'),
      subtitle: t('localCommerce.nativeCustomerSubtitle'),
    },
    {
      title: t('localCommerce.vietnameseMerchantTitle'),
      subtitle: t('localCommerce.vietnameseMerchantSubtitle'),
    },
  ];

  return (
    <LocalConstellationFrame accent="emerald" tier="hero" radius={16} style={styles.card} contentStyle={styles.cardInner}>
      <Text style={styles.title}>{t('localCommerce.title')}</Text>
      <Text style={styles.subtitle}>{t('localCommerce.subtitle')}</Text>

      <View style={styles.trustHeader}>
        <Ionicons name="shield-checkmark-outline" size={18} color={EMERALD} accessibilityIgnoresInvertColors />
        <View style={styles.trustHeaderText}>
          <Text style={styles.trustTitle}>{t('localCommerce.safety.trustTitle')}</Text>
          <Text style={styles.trustSubtitle} numberOfLines={2}>
            {t('localCommerce.safety.trustSubtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.trustPillRow}>
        {SAFETY_PILLS.map((pill) => (
          <SafetyTrustPill key={pill.key} icon={pill.icon} label={t(safetyKey(pill.key))} />
        ))}
      </View>

      <View style={styles.audienceGrid}>
        {audienceItems.map((item) => (
          <ClarityGlassChip key={item.title} accent="emerald">
            <Text style={styles.audienceTitle}>{item.title}</Text>
            <Text style={styles.audienceSub} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </ClarityGlassChip>
        ))}
      </View>

      <Text style={styles.trioHint}>{trioLine}</Text>

      <Text style={styles.sectionKicker}>{t('localCommerce.safety.legendTitle')}</Text>
      <View style={styles.legendGrid}>
        {STATUS_LEGEND.map((item) => (
          <StatusLegendItem key={item.key} icon={item.icon} label={t(safetyKey(item.key))} />
        ))}
      </View>

      <Text style={styles.sectionKicker}>{t('localCommerce.safety.modeChipsTitle')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
        <View style={styles.statusRow}>
          {statusOrder.map((s) => (
            <PremiumStatusChip key={s} accent="emerald" label={t(bookingStatusKey(s))} />
          ))}
        </View>
      </ScrollView>

      <Text style={styles.safety}>{t('localCommerce.safety.bookingRequestNote')}</Text>

      <View style={styles.capList}>
        {caps.map((c) => (
          <View key={c.id} style={styles.capRow}>
            <View style={styles.capTextCol}>
              <Text style={styles.capTitle}>{t(c.titleKey)}</Text>
              <View style={styles.capPillWrap}>
                <PremiumStatusChip accent="emerald" label={t(bookingStatusKey(c.status))} />
              </View>
              <Text style={styles.capDesc} numberOfLines={1}>
                {t(c.descriptionKey)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.ctaRow}>
        <ClarityCtaChip icon="apps-outline" label={t('localCommerce.cta.browseServices')} onPress={onBrowseServices} accent="emerald" />
        <ClarityCtaChip
          icon="chatbubble-ellipses-outline"
          label={t('localCommerce.cta.requestBooking')}
          onPress={onRequestBookingAssist}
          accent="cyan"
        />
      </View>
    </LocalConstellationFrame>
  );
}

function ClarityCtaChip({
  icon,
  label,
  onPress,
  accent,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent: LocalConstellationAccent;
}>) {
  const [hovered, setHovered] = useState(false);
  const ink = hovered ? localAccentInkHover(accent) : localAccentInk(accent);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.ctaChip,
        Platform.OS === 'web' ? localWebCompactGlassChipStyle(accent, hovered) : { borderColor: localConstellation.border, borderWidth: 1 },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Ionicons name={icon} size={16} color={ink} />
      <Text style={[styles.ctaText, { color: INK }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardInner: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 0,
  },
  title: { fontSize: 17, fontFamily: FontFamily.extrabold, color: INK },
  subtitle: { marginTop: 5, fontSize: 12, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 17 },
  trustHeader: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  trustHeaderText: { flex: 1, minWidth: 0, gap: 2 },
  trustTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: EMERALD, letterSpacing: 0.2 },
  trustSubtitle: { fontSize: 11, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 15 },
  trustPillRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    flexGrow: 1,
    flexBasis: 120,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 8,
    backgroundColor: 'rgba(10, 14, 22, 0.48)',
  },
  trustPillText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: INK,
    lineHeight: 13,
    letterSpacing: 0.1,
  },
  audienceGrid: { marginTop: 10, gap: 8 },
  glassChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: premiumGlassSurface(),
    borderWidth: premiumTileGlass.edgeWidth,
    borderColor: premiumUniverseStroke('emerald'),
  },
  audienceTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: EMERALD },
  audienceSub: { marginTop: 2, fontSize: 10, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 14 },
  trioHint: { marginTop: 9, fontSize: 11, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 15 },
  sectionKicker: {
    marginTop: 10,
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: EMERALD,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  legendGrid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 148,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: premiumGlassSurface(),
    borderWidth: premiumTileGlass.edgeWidth,
    borderColor: premiumUniverseStroke('emerald'),
  },
  legendIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premiumUniverseAccentSpec('emerald').iconCapsuleFill,
  },
  legendText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: INK,
    lineHeight: 14,
  },
  statusScroll: { marginTop: 6, maxHeight: 34 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  safety: { marginTop: 8, fontSize: 11, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 15 },
  capPillWrap: { marginTop: 4, alignSelf: 'flex-start' },
  capList: { marginTop: 8, gap: 6 },
  capRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  capTextCol: { flex: 1, minWidth: 0 },
  capTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: INK },
  capDesc: { fontSize: 10, fontFamily: FontFamily.semibold, color: INK_MUTED, marginTop: 2, lineHeight: 14 },
  ctaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  ctaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: premiumGlassSurface(),
    borderWidth: premiumTileGlass.edgeWidth,
    borderColor: premiumUniverseStroke('emerald'),
    minHeight: 44,
  },
  ctaText: { fontSize: 11, fontFamily: FontFamily.extrabold, maxWidth: 140 },
});
