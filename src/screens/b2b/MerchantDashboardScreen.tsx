import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import { AppImage } from '../../components/ui/AppImage';
import { fetchMerchantVietQr } from '../../services/api/merchantVietQrApi';
import { fetchMyBusinessRanking } from '../../services/api/merchantRankingApi';
import type { MerchantRankingResult } from '../../services/b2b/merchantRankingLogic';
import { isRestApiConfigured } from '../../services/apiClient';
import { formatVigTokenNumber } from '../../utils/currency';
import { useSyncHubOnFocus } from '../../hooks/useSyncHubOnFocus';
import { useTranslation } from '../../utils/i18n';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CatalogKind = 'SERVICE' | 'ROOM' | 'MENU';

type CatalogItem = Readonly<{
  id: string;
  title: string;
  kind: CatalogKind;
  priceLabel: string;
}>;

type RadarBooking = Readonly<{
  id: string;
  guestLocale: string;
  partySize: number;
  windowLabel: string;
  vigAmount: number;
  status: 'INBOUND' | 'ACCEPTED' | 'DECLINED';
}>;

const INITIAL_CATALOG: readonly CatalogItem[] = [
  { id: 'c1', title: 'Family room · sea view', kind: 'ROOM', priceLabel: '2.4M VND / night' },
  { id: 'c2', title: 'Heritage walking tour (EN)', kind: 'SERVICE', priceLabel: '€45 / guest' },
  { id: 'c3', title: 'Chef tasting menu', kind: 'MENU', priceLabel: '890k / set' },
];

const INITIAL_RADAR: readonly RadarBooking[] = [
  {
    id: 'b1',
    guestLocale: 'Berlin · EUR wallet',
    partySize: 3,
    windowLabel: 'Sat 15:00–18:00',
    vigAmount: 126,
    status: 'INBOUND',
  },
  {
    id: 'b2',
    guestLocale: 'Seoul · KRW card',
    partySize: 2,
    windowLabel: 'Sun 09:30 pickup',
    vigAmount: 58,
    status: 'INBOUND',
  },
];

const TODAY_REVENUE_VIG = 12_400.5;
const TODAY_CHECK_COUNT = 7;

function kindLabel(kind: CatalogKind, t: (k: string) => string): string {
  if (kind === 'ROOM') return t('b2b.catalog.kindRoom');
  if (kind === 'SERVICE') return t('b2b.catalog.kindService');
  return t('b2b.catalog.kindMenu');
}

export function MerchantDashboardScreen(): ReactElement {
  useSyncHubOnFocus('HUB_SERVICE');
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const [catalogAiTranslate, setCatalogAiTranslate] = useState(true);
  const [radar, setRadar] = useState<readonly RadarBooking[]>(INITIAL_RADAR);
  const [ranking, setRanking] = useState<MerchantRankingResult | null>(null);
  const criticalPulse = useRef(new Animated.Value(1)).current;
  const [vietQrPng, setVietQrPng] = useState<string | null>(null);
  const [vietQrEmv, setVietQrEmv] = useState<string | null>(null);
  const [vietQrVnd, setVietQrVnd] = useState<number | null>(null);
  const [vietQrFxSource, setVietQrFxSource] = useState<string>('');
  const [vietQrErr, setVietQrErr] = useState<string | null>(null);
  const [vietQrLoading, setVietQrLoading] = useState(false);
  const [vietQrVigInput, setVietQrVigInput] = useState('150');
  const [vietQrCopied, setVietQrCopied] = useState(false);

  useEffect(() => {
    if (ranking?.status !== 'CRITICAL_LOCKOUT') {
      criticalPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(criticalPulse, {
          toValue: 0.82,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(criticalPulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [criticalPulse, ranking?.status]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const remote = await fetchMyBusinessRanking();
        if (!active) return;
        if (remote != null) {
          setRanking(remote);
          return;
        }
        if (!isRestApiConfigured()) {
          setRanking(null);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const pendingCount = useMemo(() => radar.filter((b) => b.status === 'INBOUND').length, [radar]);

  const revenuePrimaryLine = useMemo(
    () =>
      t('b2b.stats.revenueLine', {
        vig: formatVigTokenNumber(TODAY_REVENUE_VIG, i18n.language),
        checks: TODAY_CHECK_COUNT,
      }),
    [i18n.language, t]
  );

  const openSettings = useCallback(() => {
    navigation.navigate('PersonalHub');
  }, [navigation]);

  const openDeepQueue = useCallback(() => {
    navigation.navigate('InboundQueue');
  }, [navigation]);

  const openDemoSimulator = useCallback(() => {
    navigation.navigate('AiReceptionistDemoSimulator');
  }, [navigation]);

  const openLeonaPromoSettings = useCallback(() => {
    navigation.navigate('B2BPromotionSettings');
  }, [navigation]);

  const openAiReceptionistSetup = useCallback(() => {
    navigation.navigate('AiReceptionistSetupChecklist');
  }, [navigation]);

  const openPilotRequest = useCallback(() => {
    navigation.navigate('AiReceptionistPilotRequest');
  }, [navigation]);

  const aiSetupStates = useMemo(() => {
    const demoAvailable = featureFlags.b2bAiReceptionistDemoEnabled;
    const pilotAvailable = featureFlags.b2bAiReceptionistPilotEnabled;
    const productionReady =
      featureFlags.b2bAiReceptionistProductionEnabled &&
      featureFlags.b2bAutoBookingEnabled &&
      featureFlags.b2bAutoInventoryEnabled &&
      featureFlags.b2bAutoBillPrintEnabled &&
      featureFlags.b2bAutoPaymentEnabled;
    return {
      demoAvailable,
      pilotAvailable,
      productionReady,
    };
  }, [featureFlags]);

  const acceptBooking = useCallback((id: string) => {
    setRadar((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'ACCEPTED' as const } : b))
    );
  }, []);

  const declineBooking = useCallback((id: string) => {
    setRadar((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'DECLINED' as const } : b))
    );
  }, []);

  const loadVietQr = useCallback(async () => {
    if (!isRestApiConfigured()) return;
    const vig = Number(vietQrVigInput.replace(',', '.'));
    if (!Number.isFinite(vig) || vig <= 0) {
      setVietQrErr(t('b2b.vietqr.error'));
      return;
    }
    setVietQrLoading(true);
    setVietQrErr(null);
    setVietQrCopied(false);
    const r = await fetchMerchantVietQr(vig);
    setVietQrLoading(false);
    if (r.ok) {
      setVietQrPng(r.data.pngDataUrl);
      setVietQrEmv(r.data.emvPayload);
      setVietQrVnd(r.data.amountVnd);
      setVietQrFxSource(r.data.fx.source);
      return;
    }
    setVietQrPng(null);
    setVietQrEmv(null);
    setVietQrVnd(null);
    setVietQrFxSource('');
    setVietQrErr(r.error || t('b2b.vietqr.error'));
  }, [vietQrVigInput, t]);

  useFocusEffect(
    useCallback(() => {
      if (!isRestApiConfigured()) return;
      void loadVietQr();
    }, [loadVietQr])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={styles.topBarTitle}>
          <Text
            style={styles.kicker}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            maxFontSizeMultiplier={1.15}
          >
            {t('b2b.kicker')}
          </Text>
          <Text
            style={styles.title}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            maxFontSizeMultiplier={1.2}
          >
            {t('b2b.title')}
          </Text>
        </View>
        <Pressable
          onPress={openSettings}
          accessibilityRole="button"
          accessibilityLabel={t('b2b.settingsA11y')}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="settings-outline" size={22} color="#E8EDF7" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ranking?.status === 'TRIAL_EXPIRING_SOON' ? (
          <View
            style={[styles.rankingBanner, styles.rankingBannerSoftNudge]}
            accessibilityRole="alert"
            accessibilityLabel={t('b2b.rankingBanner.softNudgeA11y')}
          >
            <Text style={styles.rankingBannerTitle}>{t('b2b.kicker')}</Text>
            <Text style={styles.rankingBannerBody}>
              {t('b2b.rankingBanner.softNudgeBody', {
                daysLeft: ranking.premiumRankingDaysLeft,
                growth: ranking.monthOnMonthGrowthPercent,
              })}
            </Text>
          </View>
        ) : null}
        {ranking?.status === 'CRITICAL_LOCKOUT' ? (
          <Animated.View
            style={[styles.rankingBanner, styles.rankingBannerCritical, { opacity: criticalPulse }]}
            accessibilityRole="alert"
            accessibilityLabel={t('b2b.rankingBanner.criticalA11y')}
          >
            <Text style={styles.rankingBannerTitle}>{t('b2b.kicker')}</Text>
            <Text style={styles.rankingBannerBodyCritical}>
              {t('b2b.rankingBanner.criticalBody', { daysLeft: ranking.daysUntilRankDrop })}
            </Text>
          </Animated.View>
        ) : null}
        {ranking?.status === 'LOCKED_RANK' ? (
          <View
            style={[styles.rankingBanner, styles.rankingBannerLocked]}
            accessibilityRole="alert"
            accessibilityLabel={t('b2b.rankingBanner.lockedA11y')}
          >
            <Text style={styles.rankingBannerTitle}>{t('b2b.kicker')}</Text>
            <Text style={styles.rankingBannerBody}>{t('b2b.rankingBanner.lockedBody')}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={openLeonaPromoSettings}
          style={({ pressed }) => [styles.promoLink, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Ưu đãi và cấu hình Leona"
        >
          <Ionicons name="pricetag-outline" size={20} color="#C5A059" />
          <View style={styles.promoLinkTextCol}>
            <Text style={styles.promoLinkTitle}>Ưu đãi & Lễ tân AI</Text>
            <Text style={styles.promoLinkSub} numberOfLines={2}>
              Chỉ chủ tiệm được phép giảm giá — đặt mã Auto-Closer cho Leona
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(232, 237, 247, 0.35)" />
        </Pressable>

        <View style={styles.aiReceptionistCard}>
          <View style={styles.aiReceptionistHead}>
            <View style={styles.aiReceptionistTitleWrap}>
              <Text style={styles.aiReceptionistTitle}>Lễ Tân AI Beta</Text>
              <Text style={styles.aiReceptionistSub}>
                Demo/pilot only. AI may make mistakes and merchant confirmation is required until production approval.
              </Text>
            </View>
          </View>
          <View style={styles.aiReceptionistBadgeRow}>
            <View style={styles.aiReceptionistBadge}>
              <Text style={styles.aiReceptionistBadgeText}>
                {aiSetupStates.demoAvailable ? 'Demo available' : 'Demo locked'}
              </Text>
            </View>
            <View style={styles.aiReceptionistBadge}>
              <Text style={styles.aiReceptionistBadgeText}>
                {aiSetupStates.pilotAvailable ? 'Pilot available' : 'Pilot locked'}
              </Text>
            </View>
            <View style={[styles.aiReceptionistBadge, styles.aiReceptionistBadgeWarn]}>
              <Text style={styles.aiReceptionistBadgeText}>
                {aiSetupStates.productionReady ? 'Production eligible' : 'Production locked'}
              </Text>
            </View>
          </View>
          <Text style={styles.aiReceptionistSafetyCopy}>
            Production automation requires setup checklist, policy approval, and sub-flag gates for booking, inventory,
            bill printing, and payment.
          </Text>
          <View style={styles.aiReceptionistActionRow}>
            <Pressable
              onPress={openDemoSimulator}
              disabled={!aiSetupStates.demoAvailable}
              style={({ pressed }) => [
                styles.aiReceptionistBtn,
                !aiSetupStates.demoAvailable && styles.aiReceptionistBtnDisabled,
                pressed && aiSetupStates.demoAvailable && { opacity: 0.86 },
              ]}
            >
              <Text style={styles.aiReceptionistBtnText}>View demo</Text>
            </Pressable>
            <Pressable
              onPress={openAiReceptionistSetup}
              style={({ pressed }) => [styles.aiReceptionistBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.aiReceptionistBtnText}>Configure</Text>
            </Pressable>
            <Pressable
              onPress={openPilotRequest}
              style={({ pressed }) => [styles.aiReceptionistBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.aiReceptionistBtnText}>Request pilot</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text
              style={styles.statLabel}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {t('b2b.stats.revenueLabel')}
            </Text>
            <Text
              style={styles.statValue}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {revenuePrimaryLine}
            </Text>
            <Text style={styles.statHint} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('b2b.stats.revenueHint')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text
              style={styles.statLabel}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {t('b2b.stats.pendingLabel')}
            </Text>
            <Text style={[styles.statValue, styles.statAccent]} numberOfLines={1} adjustsFontSizeToFit>
              {pendingCount}
            </Text>
            <Text style={styles.statHint} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('b2b.stats.pendingHint')}
            </Text>
          </View>
        </View>

        {isRestApiConfigured() ? (
          <View style={styles.vietQrCard} accessibilityRole="summary">
            <Text style={styles.vietQrTitle}>{t('b2b.vietqr.title')}</Text>
            <Text style={styles.vietQrSub} numberOfLines={4} adjustsFontSizeToFit>
              {t('b2b.vietqr.subtitle')}
            </Text>
            <View style={styles.vietQrRow}>
              <Text style={styles.vietQrLabel}>{t('b2b.vietqr.vigLabel')}</Text>
              <TextInput
                value={vietQrVigInput}
                onChangeText={setVietQrVigInput}
                keyboardType="decimal-pad"
                placeholder="150"
                placeholderTextColor="rgba(148,163,184,0.7)"
                style={styles.vietQrInput}
              />
              <Pressable
                onPress={() => void loadVietQr()}
                style={({ pressed }) => [styles.vietQrBtn, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel={t('b2b.vietqr.refresh')}
              >
                <Text style={styles.vietQrBtnText}>{t('b2b.vietqr.refresh')}</Text>
              </Pressable>
            </View>
            {vietQrLoading ? (
              <View style={styles.vietQrLoading}>
                <ActivityIndicator color="#C5A059" />
                <Text style={styles.vietQrLoadingText}>{t('b2b.vietqr.loading')}</Text>
              </View>
            ) : vietQrErr ? (
              <Text style={styles.vietQrErr} numberOfLines={4}>
                {vietQrErr}
              </Text>
            ) : vietQrPng ? (
              <>
                <AppImage source={{ uri: vietQrPng }} style={styles.vietQrImage} resizeMode="contain" />
                {vietQrVnd != null ? (
                  <Text style={styles.vietQrMeta} numberOfLines={2}>
                    {t('b2b.vietqr.vndLine', {
                      vnd: vietQrVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US'),
                      source: vietQrFxSource,
                    })}
                  </Text>
                ) : null}
                {vietQrEmv ? (
                  <Pressable
                    onPress={() => {
                      void Clipboard.setStringAsync(vietQrEmv).then(() => {
                        setVietQrCopied(true);
                        setTimeout(() => setVietQrCopied(false), 2000);
                      });
                    }}
                    style={({ pressed }) => [styles.vietQrCopy, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={styles.vietQrCopyText}>
                      {vietQrCopied ? t('b2b.vietqr.copied') : t('b2b.vietqr.copyEmv')}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Text
              style={styles.blockTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t('b2b.catalog.title')}
            </Text>
            <View style={styles.masterToggle}>
              <Text
                style={styles.masterToggleLabel}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('b2b.catalog.aiTranslateToggle')}
              </Text>
              <Switch
                value={catalogAiTranslate}
                onValueChange={setCatalogAiTranslate}
                trackColor={{ false: '#2A3444', true: '#3D5AFE' }}
                thumbColor={catalogAiTranslate ? '#FFFFFF' : '#888888'}
              />
            </View>
          </View>
          <Text
            style={styles.blockHint}
            numberOfLines={4}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {t('b2b.catalog.hint')}
          </Text>

          {INITIAL_CATALOG.map((item) => (
            <View key={item.id} style={styles.catalogRow}>
              <View style={styles.catalogBadge}>
                <Text style={styles.catalogBadgeText} numberOfLines={1} adjustsFontSizeToFit>
                  {kindLabel(item.kind, t)}
                </Text>
              </View>
              <View style={styles.catalogMeta}>
                <Text style={styles.catalogTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {item.title}
                </Text>
                <Text style={styles.catalogPrice} numberOfLines={1} adjustsFontSizeToFit>
                  {item.priceLabel}
                </Text>
              </View>
              <View style={[styles.aiPill, !catalogAiTranslate && styles.aiPillOff]}>
                <Text
                  style={[styles.aiPillText, !catalogAiTranslate && styles.aiPillTextOff]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {catalogAiTranslate ? t('b2b.catalog.aiOn') : t('b2b.catalog.aiOff')}
                </Text>
              </View>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={t('b2b.catalog.addItemA11y')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#7AE4FF" />
            <Text style={styles.addBtnLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
              {t('b2b.catalog.addItem')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Text style={styles.blockTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              {t('b2b.radar.title')}
            </Text>
            <Pressable onPress={openDeepQueue} hitSlop={8} style={styles.linkWrap}>
              <Text style={styles.link} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
                {t('b2b.radar.openQueue')}
              </Text>
            </Pressable>
          </View>

          {radar.map((b) => (
            <View
              key={b.id}
              style={[styles.radarCard, b.status !== 'INBOUND' && styles.radarCardMuted]}
            >
              <View style={styles.radarTop}>
                <Ionicons name="globe-outline" size={20} color="#7AE4FF" />
                <Text style={styles.radarGuest} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
                  {b.guestLocale}
                </Text>
              </View>
              <Text style={styles.radarParty} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {t('b2b.radar.guestsWindow', { count: b.partySize, window: b.windowLabel })}
              </Text>
              <Text style={styles.radarVig} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t('b2b.radar.vigFeeEstimated', {
                  amount: formatVigTokenNumber(b.vigAmount, i18n.language),
                })}
              </Text>

              {b.status === 'INBOUND' ? (
                <View style={styles.radarActions}>
                  <Pressable
                    onPress={() => declineBooking(b.id)}
                    style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.9 }]}
                  >
                    <Text style={styles.declineLabel} numberOfLines={1} adjustsFontSizeToFit>
                      {t('b2b.radar.decline')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => acceptBooking(b.id)}
                    style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.92 }]}
                  >
                    <Text style={styles.acceptLabel} numberOfLines={1} adjustsFontSizeToFit>
                      {t('b2b.radar.accept')}
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#061018" />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.radarResolved} numberOfLines={2} adjustsFontSizeToFit>
                  {b.status === 'ACCEPTED' ? t('b2b.radar.acceptedMsg') : t('b2b.radar.declinedMsg')}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#0C1017';
const CARD = '#151C27';
const BORDER = 'rgba(232, 237, 247, 0.08)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 6,
    gap: 10,
  },
  topBarTitle: { flex: 1, minWidth: 0, maxWidth: '100%', gap: 4 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(232,237,247,0.45)' },
  title: { fontSize: 24, fontWeight: '900', color: '#F4F7FF' },
  iconBtn: {
    flexShrink: 0,
    padding: 10,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  promoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 26, 36, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.32)',
    maxWidth: '100%',
  },
  promoLinkTextCol: { flex: 1, minWidth: 0, gap: 4 },
  promoLinkTitle: { fontSize: 15, fontWeight: '900', color: '#E8D5A3' },
  promoLinkSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(232, 237, 247, 0.55)',
    lineHeight: 17,
  },
  aiReceptionistCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.28)',
    backgroundColor: 'rgba(14, 24, 38, 0.94)',
    padding: 14,
    gap: 10,
  },
  aiReceptionistHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  aiReceptionistTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  aiReceptionistTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E8F7FF',
  },
  aiReceptionistSub: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(226, 232, 240, 0.72)',
  },
  aiReceptionistBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiReceptionistBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.35)',
    backgroundColor: 'rgba(122, 228, 255, 0.12)',
  },
  aiReceptionistBadgeWarn: {
    borderColor: 'rgba(250, 204, 21, 0.45)',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
  },
  aiReceptionistBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E8EDF7',
  },
  aiReceptionistSafetyCopy: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232, 237, 247, 0.62)',
  },
  aiReceptionistActionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiReceptionistBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(159, 183, 255, 0.42)',
    backgroundColor: 'rgba(61, 90, 254, 0.18)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  aiReceptionistBtnDisabled: {
    opacity: 0.45,
  },
  aiReceptionistBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DCE8FF',
  },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 18 },
  rankingBanner: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    maxWidth: '100%',
    gap: 6,
  },
  rankingBannerSoftNudge: {
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    borderColor: '#FACC15',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  rankingBannerCritical: {
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
    borderColor: '#FF0055',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 12,
  },
  rankingBannerLocked: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  rankingBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.75)',
  },
  rankingBannerBody: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFEF5',
    lineHeight: 20,
  },
  rankingBannerBodyCritical: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFE4EC',
    lineHeight: 20,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  statLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(232,237,247,0.55)', flexShrink: 1 },
  statValue: { fontSize: 17, fontWeight: '900', color: '#F4F7FF', flexShrink: 1 },
  statAccent: { color: '#7AE4FF' },
  statHint: { fontSize: 11, fontWeight: '600', color: 'rgba(232,237,247,0.38)', flexShrink: 1 },
  vietQrCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(18, 42, 62, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.22)',
    gap: 12,
    maxWidth: '100%',
  },
  vietQrTitle: { fontSize: 16, fontWeight: '900', color: '#E8F7FF' },
  vietQrSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(226, 232, 240, 0.65)',
    lineHeight: 17,
  },
  vietQrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  vietQrLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(226,232,240,0.75)' },
  vietQrInput: {
    minWidth: 88,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 11, 20, 0.65)',
    borderWidth: 1,
    borderColor: BORDER,
    color: '#F4F7FF',
    fontSize: 15,
    fontWeight: '700',
  },
  vietQrBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(197, 160, 89, 0.95)',
  },
  vietQrBtnText: { fontSize: 13, fontWeight: '900', color: '#0A1628' },
  vietQrLoading: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  vietQrLoadingText: { fontSize: 13, fontWeight: '600', color: 'rgba(226,232,240,0.7)' },
  vietQrErr: { fontSize: 13, fontWeight: '600', color: '#FCA5A5', lineHeight: 18 },
  vietQrImage: { width: 220, height: 220, alignSelf: 'center', borderRadius: 12 },
  vietQrMeta: { fontSize: 12, fontWeight: '600', color: 'rgba(167, 243, 208, 0.95)', textAlign: 'center' },
  vietQrCopy: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  vietQrCopyText: { fontSize: 13, fontWeight: '800', color: '#93C5FD' },
  block: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
    maxWidth: '100%',
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F4F7FF',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    maxWidth: '100%',
  },
  blockHint: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(232,237,247,0.55)',
    lineHeight: 19,
    flexShrink: 1,
    maxWidth: '100%',
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    maxWidth: '100%',
  },
  masterToggleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9FB7FF',
    flexShrink: 1,
    maxWidth: 160,
  },
  catalogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    maxWidth: '100%',
  },
  catalogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(122, 228, 255, 0.12)',
    flexShrink: 0,
    maxWidth: 88,
  },
  catalogBadgeText: { fontSize: 10, fontWeight: '900', color: '#7AE4FF' },
  catalogMeta: { flex: 1, minWidth: 0, gap: 2 },
  catalogTitle: { fontSize: 14, fontWeight: '800', color: '#F4F7FF', flexShrink: 1 },
  catalogPrice: { fontSize: 12, fontWeight: '600', color: 'rgba(232,237,247,0.45)', flexShrink: 1 },
  aiPill: {
    flexShrink: 0,
    maxWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(61, 90, 254, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.45)',
  },
  aiPillOff: { backgroundColor: 'rgba(42, 52, 68, 0.9)', borderColor: BORDER },
  aiPillText: { fontSize: 11, fontWeight: '900', color: '#E8EDF7' },
  aiPillTextOff: { color: 'rgba(232,237,247,0.38)' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.35)',
    borderStyle: 'dashed',
    maxWidth: '100%',
  },
  addBtnLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7AE4FF',
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  linkWrap: { flexShrink: 1, maxWidth: '48%', minWidth: 0 },
  link: { fontSize: 13, fontWeight: '800', color: '#9FB7FF', flexShrink: 1, textAlign: 'right' },
  radarCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1A2433',
    borderWidth: 1,
    borderColor: 'rgba(122, 228, 255, 0.22)',
    gap: 8,
    marginBottom: 12,
    maxWidth: '100%',
  },
  radarCardMuted: { opacity: 0.55 },
  radarTop: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  radarGuest: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F4F7FF',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  radarParty: { fontSize: 13, fontWeight: '600', color: 'rgba(232,237,247,0.55)', flexShrink: 1 },
  radarVig: { fontSize: 12, fontWeight: '800', color: '#C9E792', flexShrink: 1 },
  radarActions: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  declineBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.35)',
  },
  declineLabel: { fontSize: 15, fontWeight: '900', color: '#FF8E8E', flexShrink: 1 },
  acceptBtn: {
    flex: 1.35,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#7AE4FF',
  },
  acceptLabel: { fontSize: 15, fontWeight: '900', color: '#061018', flexShrink: 1 },
  radarResolved: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(232,237,247,0.45)',
    marginTop: 4,
    flexShrink: 1,
  },
});
