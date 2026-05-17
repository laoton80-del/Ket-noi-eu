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
import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const EMERALD = localConstellation.accentEmerald;

export type LocalCommerceClarityBlockProps = Readonly<{
  onBrowseServices: () => void;
  onRequestBookingAssist: () => void;
}>;

function bookingStatusKey(s: LocalBookingStatus): string {
  return `localCommerce.bookingStatus.${s}`;
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
        <View style={styles.statusRow}>
          {statusOrder.map((s) => (
            <ClarityGlassChip key={s} accent="emerald">
              <Text style={styles.statusChipText}>{t(bookingStatusKey(s))}</Text>
            </ClarityGlassChip>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.safety}>{t('localCommerce.safety.bookingRequestNote')}</Text>

      <View style={styles.capList}>
        {caps.map((c) => (
          <View key={c.id} style={styles.capRow}>
            <View style={styles.capTextCol}>
              <Text style={styles.capTitle}>{t(c.titleKey)}</Text>
              <Text style={styles.capPill}>{t(bookingStatusKey(c.status))}</Text>
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
  audienceGrid: { marginTop: 10, gap: 8 },
  glassChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: 'rgba(10, 14, 22, 0.48)',
  },
  audienceTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: EMERALD },
  audienceSub: { marginTop: 2, fontSize: 10, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 14 },
  trioHint: { marginTop: 9, fontSize: 11, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 15 },
  statusScroll: { marginTop: 8, maxHeight: 34 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  statusChipText: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: EMERALD,
    textTransform: 'uppercase',
  },
  safety: { marginTop: 8, fontSize: 11, fontFamily: FontFamily.semibold, color: INK_MUTED, lineHeight: 15 },
  capList: { marginTop: 8, gap: 6 },
  capRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  capTextCol: { flex: 1, minWidth: 0 },
  capTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: INK },
  capDesc: { fontSize: 10, fontFamily: FontFamily.semibold, color: INK_MUTED, marginTop: 2, lineHeight: 14 },
  capPill: {
    alignSelf: 'flex-start',
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: EMERALD,
    textTransform: 'uppercase',
    marginTop: 2,
    backgroundColor: 'rgba(72, 210, 165, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ctaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  ctaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 14, 22, 0.48)',
  },
  ctaText: { fontSize: 11, fontFamily: FontFamily.extrabold, maxWidth: 140 },
});
