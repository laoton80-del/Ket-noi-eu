import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, type ReactElement, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenSkeleton } from '../../components/ui/ScreenSkeleton';
import { STALE_TIME_MS_CATALOG } from '../../constants/globalPerformance';
import { queryKeys } from '../../lib/queryKeys';
import type { RootStackParamList } from '../../navigation/routes';
import {
  fetchTourismDiscover,
  type TourismDiscoverBusiness,
  type TourismDiscoverPayload,
} from '../../services/viGlobalTourismApi';
import { isRestApiConfigured } from '../../services/apiClient';
import { formatVigTokenNumber } from '../../utils/currency';
import { FontFamily } from '../../theme/typography';
import { useHubTheme } from '../../context/HubThemeContext';
import { useSyncHubOnFocus } from '../../hooks/useSyncHubOnFocus';
import { useTranslation } from '../../utils/i18n';

const NAVY = '#050B14';
const GOLD = '#D4AF37';
const GOLD_SOFT = 'rgba(212, 175, 55, 0.22)';
const GLASS = 'rgba(255, 255, 255, 0.06)';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type PriceLineStyle = 'perNight' | 'from';

function PreviewLines({
  businesses,
  emptyLabel,
  t,
  i18nLanguage,
  priceStyle,
}: Readonly<{
  businesses: readonly TourismDiscoverBusiness[];
  emptyLabel: string;
  t: (key: string, opts?: Record<string, string | number>) => string;
  i18nLanguage: string;
  priceStyle: PriceLineStyle;
}>): ReactElement {
  if (businesses.length === 0) {
    return (
      <Text style={styles.previewMuted} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.85}>
        {emptyLabel}
      </Text>
    );
  }
  const lines = businesses.slice(0, 3).map((b) => {
    const svc = b.tourismServices[0];
    const amountStr = svc ? formatVigTokenNumber(svc.priceVIG, i18nLanguage) : '';
    const pricePart = svc
      ? priceStyle === 'perNight'
        ? t('tourism.price_per_night', { amount: amountStr })
        : t('tourism.price_from', { amount: amountStr })
      : '';
    const tail = svc ? ` · ${pricePart}` : '';
    return `• ${b.name}${tail}`;
  });
  return (
    <Text style={styles.previewText} numberOfLines={6} adjustsFontSizeToFit minimumFontScale={0.82}>
      {lines.join('\n')}
    </Text>
  );
}

function BentoCard({
  title,
  subtitle,
  icon,
  height,
  onPress,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  height: number;
  onPress: () => void;
  children: ReactNode;
}>): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.bentoOuter, { minHeight: height }, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={['rgba(18, 28, 48, 0.98)', 'rgba(8, 14, 26, 0.99)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bentoInner}
      >
        <View style={styles.bentoHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name={icon} size={22} color={GOLD} />
          </View>
          <View style={styles.headerTextCol}>
            <Text
              style={styles.bentoTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              maxFontSizeMultiplier={1.15}
            >
              {title}
            </Text>
            <Text
              style={styles.bentoSub}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={1.12}
            >
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" style={styles.chevron} />
        </View>
        <View style={styles.bentoBody}>{children}</View>
      </LinearGradient>
    </Pressable>
  );
}

export function VietnamHubScreen(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { renderAuraWatermark } = useHubTheme();
  useSyncHubOnFocus('HUB_TOURISM');

  const discoverQuery = useQuery({
    queryKey: queryKeys.tourism.discover(),
    queryFn: async (): Promise<TourismDiscoverPayload> => {
      if (!isRestApiConfigured()) {
        return { stays: [], tours: [], gastronomy: [], localFixers: [] };
      }
      const r = await fetchTourismDiscover();
      if (!r.ok) {
        throw new Error(r.error);
      }
      return r.data;
    },
    staleTime: STALE_TIME_MS_CATALOG,
    retry: 1,
  });

  const configOk = isRestApiConfigured();
  const data = discoverQuery.data ?? null;
  const loading = discoverQuery.isPending;
  const fetchError =
    discoverQuery.isError && discoverQuery.error instanceof Error ? discoverQuery.error.message : null;
  const error = !configOk ? t('tourism.errorLoad') : fetchError;

  const emptyHint = t('tourism.empty');

  const onVoiceFab = useCallback(() => {
    navigation.navigate('LiveInterpreter', { guidedEntry: true });
  }, [navigation]);

  const onOpenFixers = useCallback(() => {
    navigation.navigate('LocalFixer');
  }, [navigation]);

  const stays = data?.stays ?? [];
  const tours = data?.tours ?? [];
  const gastro = data?.gastronomy ?? [];
  const fixers = data?.localFixers ?? [];

  const bentoGap = useMemo(() => ({ gap: 12 as const }), []);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {renderAuraWatermark({ width: winW, height: winH })}
      </View>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('tourism.backA11y')}
          >
            <Ionicons name="chevron-back" size={26} color="rgba(255,255,255,0.92)" />
          </Pressable>
          <Text
            style={styles.topTitle}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            maxFontSizeMultiplier={1.2}
          >
            {t('tourism.screenTitle')}
          </Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={styles.kicker}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {t('tourism.scrollKicker')}
          </Text>

          <LinearGradient
            colors={['rgba(212, 175, 55, 0.35)', 'rgba(5, 11, 20, 0.2)', 'rgba(5, 11, 20, 0.85)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroGlow} />
            <Text
              style={styles.heroTitle}
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.15}
            >
              {t('tourism.heroTitle')}
            </Text>
            <Text
              style={styles.heroSub}
              numberOfLines={4}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              maxFontSizeMultiplier={1.12}
            >
              {t('tourism.heroSubtitle')}
            </Text>
            {loading ? (
              <View style={styles.heroLoading}>
                <ScreenSkeleton rows={5} />
                <Text style={styles.heroLoadingText} numberOfLines={2} adjustsFontSizeToFit>
                  {t('tourism.loading')}
                </Text>
              </View>
            ) : null}
            {error && !loading ? (
              <View style={styles.heroErr}>
                <Text style={styles.heroErrText} numberOfLines={4} adjustsFontSizeToFit>
                  {!configOk ? t('tourism.errorLoad') : error}
                </Text>
                <Pressable onPress={() => void discoverQuery.refetch()} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText} numberOfLines={1} adjustsFontSizeToFit>
                    {t('tourism.retry')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </LinearGradient>

          <View style={[styles.bentoGrid, bentoGap]}>
            <BentoCard
              title={t('tourism.staysTitle')}
              subtitle={`${t('tourism.staysSub')} · ${t('tourism.providersCount', { count: stays.length })}`}
              icon="bed"
              height={168}
              onPress={() => navigation.navigate('TravelHospitality')}
            >
              <PreviewLines
                businesses={stays}
                emptyLabel={emptyHint}
                t={t}
                i18nLanguage={i18n.language}
                priceStyle="perNight"
              />
            </BentoCard>

            <View style={styles.rowTwo}>
              <View style={styles.rowHalf}>
                <BentoCard
                  title={t('tourism.toursTitle')}
                  subtitle={t('tourism.toursSub')}
                  icon="ticket"
                  height={148}
                  onPress={() => navigation.navigate('TravelFlightSearch')}
                >
                  <PreviewLines
                    businesses={tours}
                    emptyLabel={emptyHint}
                    t={t}
                    i18nLanguage={i18n.language}
                    priceStyle="from"
                  />
                </BentoCard>
              </View>
              <View style={styles.rowHalf}>
                <BentoCard
                  title={t('tourism.gastroTitle')}
                  subtitle={t('tourism.gastroSub')}
                  icon="restaurant"
                  height={148}
                  onPress={() => navigation.navigate('TravelHospitality')}
                >
                  <PreviewLines
                    businesses={gastro}
                    emptyLabel={emptyHint}
                    t={t}
                    i18nLanguage={i18n.language}
                    priceStyle="from"
                  />
                </BentoCard>
              </View>
            </View>

            <BentoCard
              title={t('tourism.fixersTitle')}
              subtitle={`${t('tourism.fixersSub')} · ${t('tourism.providersCount', { count: fixers.length })}`}
              icon="star"
              height={132}
              onPress={onOpenFixers}
            >
              <PreviewLines
                businesses={fixers}
                emptyLabel={emptyHint}
                t={t}
                i18nLanguage={i18n.language}
                priceStyle="from"
              />
            </BentoCard>

            {!loading && !error && stays.length > 0 && stays[0].tourismServices.length > 0 ? (
              <Pressable
                style={({ pressed }) => [styles.checkoutCta, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  const b = stays[0];
                  const s = b.tourismServices[0];
                  const start = new Date();
                  start.setDate(start.getDate() + 1);
                  start.setHours(14, 0, 0, 0);
                  const end = new Date(start);
                  end.setDate(end.getDate() + 2);
                  navigation.navigate('TourismCheckout', {
                    businessId: b.id,
                    serviceId: s.id,
                    businessName: b.name,
                    serviceTitle: s.title,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    guestCount: 2,
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel={t('tourism.checkoutDemo')}
              >
                <Ionicons name="card-outline" size={22} color={NAVY} />
                <Text style={styles.checkoutCtaText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
                  {t('tourism.checkoutDemo')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Pressable
        onPress={onVoiceFab}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: 24 + insets.bottom,
            right: 20,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('tourism.fabVoice')}
        accessibilityHint={t('tourism.fabVoiceHint')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <LinearGradient colors={[GOLD, '#8a6d2c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
          <Ionicons name="mic" size={26} color={NAVY} />
        </LinearGradient>
        <View style={styles.fabLabelWrap}>
          <Text
            style={styles.fabLabel}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            maxFontSizeMultiplier={1.1}
          >
            {t('tourism.fabVoice')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  topSpacer: { width: 40, height: 40, flexShrink: 0 },
  topTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    color: 'rgba(248,250,252,0.95)',
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    maxWidth: '100%',
  },
  kicker: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(212, 175, 55, 0.75)',
    marginBottom: 10,
    flexShrink: 1,
    maxWidth: '100%',
  },
  heroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
  },
  heroTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 28,
    lineHeight: 34,
    color: 'rgba(253, 251, 245, 0.98)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    maxWidth: '100%',
  },
  heroSub: {
    marginTop: 10,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(226, 232, 240, 0.88)',
    maxWidth: '100%',
  },
  heroLoading: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    maxWidth: '100%',
  },
  heroLoadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(248,250,252,0.8)',
    flex: 1,
    minWidth: 0,
  },
  heroErr: { marginTop: 14, gap: 10, maxWidth: '100%' },
  heroErrText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#ffb4b4',
    flexShrink: 1,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    maxWidth: '100%',
  },
  retryBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: GOLD,
  },
  checkoutCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: GOLD,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    maxWidth: '100%',
  },
  checkoutCtaText: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: NAVY,
    textAlign: 'center',
  },
  bentoGrid: {
    marginTop: 4,
    maxWidth: '100%',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: '100%',
  },
  rowHalf: { flex: 1, minWidth: 0, maxWidth: '100%' },
  bentoOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    maxWidth: '100%',
  },
  bentoInner: {
    flex: 1,
    padding: 14,
    minWidth: 0,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '100%',
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  chevron: { flexShrink: 0 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    flexShrink: 0,
  },
  bentoTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: 'rgba(252, 250, 245, 0.98)',
    flexShrink: 1,
    maxWidth: '100%',
  },
  bentoSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(200, 210, 225, 0.75)',
    marginTop: 2,
    flexShrink: 1,
    maxWidth: '100%',
  },
  bentoBody: {
    marginTop: 10,
    minWidth: 0,
    maxWidth: '100%',
  },
  previewText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(226, 232, 240, 0.82)',
    flexShrink: 1,
    maxWidth: '100%',
  },
  previewMuted: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(148, 163, 184, 0.75)',
    fontStyle: 'italic',
    flexShrink: 1,
    maxWidth: '100%',
  },
  fab: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 40,
    gap: 6,
    maxWidth: 112,
  },
  fabGrad: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabLabelWrap: {
    width: 112,
    maxWidth: 112,
    alignItems: 'center',
    alignSelf: 'center',
  },
  fabLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: GOLD,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    width: '100%',
  },
});
