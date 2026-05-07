import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSmartTrio } from '../../context/SmartTrioContext';
import type { LocalBookingStatus } from '../../core/localCommerce';
import { getAllLocalCommerceCapabilities } from '../../core/localCommerce';
import { useTranslation } from '../../i18n';
import { VionaCard } from '../viona/VionaCard';
import { vionaTrust } from '../viona/vionaTrustTokens';

const INK = vionaTrust.ink;
const INK_MUTED = vionaTrust.inkMuted;
const GOLD = vionaTrust.accentGold;

export type LocalCommerceClarityBlockProps = Readonly<{
  onBrowseServices: () => void;
  onRequestBookingAssist: () => void;
  onMerchantSetup: () => void;
  onAiReceptionistPilotInfo: () => void;
}>;

function bookingStatusKey(s: LocalBookingStatus): string {
  return `localCommerce.bookingStatus.${s}`;
}

export function LocalCommerceClarityBlock({
  onBrowseServices,
  onRequestBookingAssist,
  onMerchantSetup,
  onAiReceptionistPilotInfo,
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

  return (
    <VionaCard style={styles.card} surfaceVariant="light">
      <Text style={styles.title}>{t('localCommerce.title')}</Text>
      <Text style={styles.subtitle}>{t('localCommerce.subtitle')}</Text>

      <View style={styles.audienceBlock}>
        <Text style={styles.audienceTitle}>{t('localCommerce.vietnameseAbroadTitle')}</Text>
        <Text style={styles.audienceSub} numberOfLines={2}>{t('localCommerce.vietnameseAbroadSubtitle')}</Text>
        <Text style={styles.audienceTitle}>{t('localCommerce.nativeCustomerTitle')}</Text>
        <Text style={styles.audienceSub} numberOfLines={2}>{t('localCommerce.nativeCustomerSubtitle')}</Text>
        <Text style={styles.audienceTitle}>{t('localCommerce.vietnameseMerchantTitle')}</Text>
        <Text style={styles.audienceSub} numberOfLines={2}>{t('localCommerce.vietnameseMerchantSubtitle')}</Text>
      </View>

      <Text style={styles.trioHint}>{trioLine}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
        <View style={styles.statusRow}>
          {statusOrder.map((s) => (
            <View key={s} style={styles.statusChip}>
              <Text style={styles.statusChipText}>{t(bookingStatusKey(s))}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.safety}>{t('localCommerce.safety.bookingRequestNote')}</Text>

      <View style={styles.capList}>
        {caps.map((c) => (
          <View key={c.id} style={styles.capRow}>
            <View style={styles.capTextCol}>
              <Text style={styles.capTitle}>{t(c.titleKey)}</Text>
              <Text style={styles.capDesc} numberOfLines={1}>
                {t(c.descriptionKey)}
              </Text>
            </View>
            <Text style={styles.capPill}>{t(bookingStatusKey(c.status))}</Text>
          </View>
        ))}
      </View>

      <View style={styles.ctaRow}>
        <Pressable onPress={onBrowseServices} style={({ pressed }) => [styles.ctaChip, pressed && { opacity: 0.88 }]}>
          <Ionicons name="apps-outline" size={16} color={GOLD} />
          <Text style={styles.ctaText}>{t('localCommerce.cta.browseServices')}</Text>
        </Pressable>
        <Pressable
          onPress={onRequestBookingAssist}
          style={({ pressed }) => [styles.ctaChip, pressed && { opacity: 0.88 }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={GOLD} />
          <Text style={styles.ctaText}>{t('localCommerce.cta.requestBooking')}</Text>
        </Pressable>
        <Pressable onPress={onMerchantSetup} style={({ pressed }) => [styles.ctaChip, pressed && { opacity: 0.88 }]}>
          <Ionicons name="briefcase-outline" size={16} color={GOLD} />
          <Text style={styles.ctaText}>{t('localCommerce.cta.merchantSetup')}</Text>
        </Pressable>
        <Pressable
          onPress={onAiReceptionistPilotInfo}
          style={({ pressed }) => [styles.ctaChip, pressed && { opacity: 0.88 }]}
        >
          <Ionicons name="sparkles-outline" size={16} color={GOLD} />
          <Text style={styles.ctaText}>{t('localCommerce.cta.aiReceptionistPilot')}</Text>
        </Pressable>
      </View>
    </VionaCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '900', color: INK },
  subtitle: { marginTop: 5, fontSize: 12, fontWeight: '600', color: INK_MUTED, lineHeight: 17 },
  audienceBlock: { marginTop: 10, gap: 4 },
  audienceTitle: { fontSize: 13, fontWeight: '800', color: INK },
  audienceSub: { fontSize: 11, fontWeight: '600', color: INK_MUTED, lineHeight: 15 },
  trioHint: { marginTop: 8, fontSize: 11, fontWeight: '600', color: 'rgba(5, 11, 20, 0.5)', lineHeight: 15 },
  statusScroll: { marginTop: 8, maxHeight: 34 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.28)',
  },
  statusChipText: { fontSize: 10, fontWeight: '800', color: INK, textTransform: 'uppercase' },
  safety: { marginTop: 8, fontSize: 11, fontWeight: '600', color: INK_MUTED, lineHeight: 15 },
  capList: { marginTop: 8, gap: 6 },
  capRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  capTextCol: { flex: 1, minWidth: 0 },
  capTitle: { fontSize: 12, fontWeight: '800', color: INK },
  capDesc: { fontSize: 10, fontWeight: '600', color: INK_MUTED, marginTop: 1, lineHeight: 14 },
  capPill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0B2A66',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  ctaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  ctaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 11, 20, 0.1)',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  ctaText: { fontSize: 11, fontWeight: '800', color: INK, maxWidth: 140 },
});
