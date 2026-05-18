import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  B2C_LISTING_PIN_FROM_CREDITS_PER_DAY,
  CREDIT_EXCHANGE_RATE,
  INTERPRETER_PER_MIN_CREDITS,
  LEONA_CALL_COST_CREDITS,
  MINH_KHANG_LIVE_INTERPRETER_PER_MIN_CREDITS,
  PRICING_AUTHORITY,
} from '../config/pricingConfig';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../config/launchPilot';
import { APP_BRAND } from '../config/appBrand';
import { getWalletPackagePricesByCountry } from '../config/commercialSpine';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { useAuth } from '../context/AuthContext';
import { useMiniAppEntry } from '../hooks/useMiniAppEntry';
import { getStrings } from '../i18n/strings';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { DiscoveryCuratedList } from '../components/DiscoveryCuratedList';
import { b2cTheme } from '../theme/appModeThemes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { DiasporaRestrictionModal } from '../components/modals/DiasporaRestrictionModal';
import { evaluateMerchantSurfaceAccess } from '../services/auth/merchantSurfaceEntry';
import { applyWebStyles } from '../utils/applyWebStyles';
import { webGlassStyle, webHoverStyle } from '../utils/webStyles';

const CERTIFIED_EXPERTS = [
  { id: 'expert-legal-1', name: 'Luật sư Minh Anh EU', specialty: 'Visa, cư trú, hợp đồng lao động' },
  { id: 'expert-accounting-1', name: 'Kế toán GlobalTax CZ', specialty: 'Thuế cá nhân, doanh nghiệp nhỏ' },
  { id: 'expert-legal-2', name: 'Legal Bridge Deutschland', specialty: 'Luật dân sự và bảo vệ người thuê nhà' },
];

const PREMIUM_LISTINGS = [
  { id: 'listing-job-1', title: 'Tuyển Nails Tech tại Praha', subtitle: 'Lương tốt, hỗ trợ giấy tờ ban đầu', sponsored: true },
  { id: 'listing-market-1', title: 'Sang nhượng tiệm ăn Việt mini', subtitle: 'Khu vực đông khách, bàn giao nhanh', sponsored: true },
  { id: 'listing-job-2', title: 'Tuyển phụ bếp part-time', subtitle: 'Lịch linh hoạt theo tuần', sponsored: false },
];

/** Affiliate / lead-gen: no user service fee; partner pays (flights, legal, housing, remittance/logistics). */
const AFFILIATE_INTERMEDIARY_IDS = ['travel', 'legal', 'housing', 'exchange'] as const;

type UtilityServiceId =
  | 'job'
  | 'housing'
  | 'legal'
  | 'exchange'
  | 'lifeos'
  | 'travel'
  | 'radar'
  | 'vault'
  | 'yeuthuong';

function isAffiliateIntermediaryService(id: UtilityServiceId): boolean {
  return (AFFILIATE_INTERMEDIARY_IDS as readonly string[]).includes(id);
}

export function TienIchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { openMiniApp } = useMiniAppEntry();
  const dailyGiftPulse = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const [diasporaRestrictionOpen, setDiasporaRestrictionOpen] = useState(false);

  const openPartnerOnboarding = useCallback(() => {
    void (async () => {
      const access = await evaluateMerchantSurfaceAccess(user?.phone);
      if (access.denied && access.kind === 'vn_dial') {
        setDiasporaRestrictionOpen(true);
        return;
      }
      if (access.denied && access.kind === 'gps_vn') {
        Alert.alert('VIONA', access.message);
        return;
      }
      navigation.navigate('PartnerOnboarding');
    })();
  }, [navigation, user?.phone]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dailyGiftPulse, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dailyGiftPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [dailyGiftPulse]);
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const locale = languageCode === 'vi' ? 'vi-VN' : languageCode === 'cs' ? 'cs-CZ' : languageCode === 'de' ? 'de-DE' : 'en-GB';
  const country = normalizeCountryCodeOrSentinel(user?.country);
  const walletPackCards = useMemo(() => getWalletPackagePricesByCountry(country, locale), [country, locale]);
  const u = strings.utility;
  const serviceCards = [
    { id: 'job' as const, label: u.serviceJob, icon: 'briefcase-outline' as const },
    { id: 'housing' as const, label: u.serviceHousing, icon: 'home-outline' as const },
    { id: 'legal' as const, label: u.serviceLegal, icon: 'document-text-outline' as const },
    { id: 'exchange' as const, label: u.serviceExchange, icon: 'swap-horizontal-outline' as const },
    { id: 'lifeos' as const, label: u.serviceLifeOS, icon: 'speedometer-outline' as const },
    { id: 'travel' as const, label: u.serviceTravel, icon: 'airplane-outline' as const },
    ...(LAUNCH_PILOT_CONFIG.enableYeuThuongSurface
      ? [{ id: 'yeuthuong' as const, label: u.serviceYeuThuong, icon: 'heart-outline' as const }]
      : []),
    {
      id: 'radar' as const,
      label: LAUNCH_PILOT_CONFIG.enableRadarSurface ? u.serviceRadarDiscovery : u.serviceFindServicesLeona,
      icon: 'radio-outline' as const,
    },
    { id: 'vault' as const, label: u.serviceVault, icon: 'shield-checkmark-outline' as const },
  ];

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.brand}>{APP_BRAND.name}</Text>
      <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
      <Text style={styles.title}>{strings.utility.screenTitle}</Text>
      <Text style={styles.subtitle}>{strings.utility.subtitle}</Text>

      <Animated.View style={{ transform: [{ scale: dailyGiftPulse }] }}>
        <Pressable
          onPress={() => navigation.navigate('DailyReward')}
          style={({ pressed }) => [styles.dailyGiftRow, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Quà tặng mỗi ngày"
        >
          <View style={styles.dailyGiftIconWrap}>
            <Ionicons name="gift" size={26} color={theme.colors.RouteError} />
          </View>
          <View style={styles.dailyGiftBody}>
            <Text style={styles.dailyGiftTitle}>QUÀ TẶNG MỖI NGÀY</Text>
            <Text style={styles.dailyGiftSub}>Điểm danh + Vòng quay may mắn — mở mỗi ngày để không đứt chuỗi.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.primaryBright} />
        </Pressable>
      </Animated.View>

      <View style={styles.asianMarketBanner}>
        <View style={styles.asianMarketBannerIconCol}>
          <Ionicons name="storefront" size={34} color={theme.hybrid.signalStrong} />
        </View>
        <View style={styles.asianMarketBannerBody}>
          <View style={styles.asianMarketBadgeRow}>
            <View style={styles.asianMarketBadge}>
              <Text style={styles.asianMarketBadgeText}>Coming Soon</Text>
            </View>
            <View style={[styles.asianMarketBadge, styles.asianMarketBadgeVision]}>
              <Text style={styles.asianMarketBadgeText}>Super App</Text>
            </View>
          </View>
          <Text style={styles.asianMarketTitle}>Chợ Châu Á & Đặt Đồ Ăn</Text>
          <Text style={styles.asianMarketTitleEn}>Asian Grocery & Food Delivery</Text>
          <Text style={styles.asianMarketSub}>
            Đặt Phở, Bánh Mì và đi chợ Việt ngay trên app. (Sắp ra mắt - Coming Soon)
          </Text>
        </View>
        <Ionicons name="fast-food-outline" size={32} color={theme.colors.primaryBright} />
      </View>

      <Pressable
        onPress={openPartnerOnboarding}
        style={({ pressed }) => [
          styles.partnerEnterpriseRow,
          {
            backgroundColor: b2cTheme.colors.card,
            borderColor: theme.colors.primary,
          },
          pressed && { opacity: 0.78 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Dành cho Doanh nghiệp: Trở thành đối tác"
      >
        <View style={[styles.partnerEnterpriseIcon, { borderColor: theme.colors.primary, backgroundColor: 'rgba(197, 160, 89, 0.12)' }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.partnerEnterpriseMeta}>
          <Text style={[styles.partnerEnterpriseTitle, { color: b2cTheme.colors.text }]}>Dành cho Doanh nghiệp: Trở thành đối tác</Text>
          <Text style={[styles.partnerEnterpriseHint, { color: 'rgba(11, 22, 40, 0.62)' }]}>
            Chương trình Đối tác chứng nhận — chia sẻ doanh thu, liên hệ trong 24h.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={b2cTheme.colors.text} />
      </Pressable>

      <View style={styles.pricingStrip}>
        <Text style={styles.pricingStripTitle}>Micro-giao dịch (Xu)</Text>
        <Text style={styles.pricingStripLine}>
          Leona — Phí: {LEONA_CALL_COST_CREDITS} Xu / cuộc gọi · Phiên dịch — Phí: {INTERPRETER_PER_MIN_CREDITS} Xu / phút
        </Text>
        <Text style={styles.pricingStripLinePremium}>
          Dịch vụ Pháp lý Premium: {MINH_KHANG_LIVE_INTERPRETER_PER_MIN_CREDITS} Xu / phút
        </Text>
        <Text style={styles.pricingStripHint}>
          Quy đổi tham chiếu: 1 Xu ≈ {CREDIT_EXCHANGE_RATE} USD (điều chỉnh theo khu vực khi thanh toán).
        </Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate('ReferralReward')}
        style={({ pressed }) => [styles.referralLaunchBtn, pressed && { opacity: 0.86 }]}
        className={applyWebStyles('kn-glass kn-neon-b2b')}
      >
        <Ionicons name="people-circle-outline" size={20} color={theme.hybrid.onSignal} />
        <Text style={styles.referralLaunchBtnText}>
          MỜI BẠN BÈ - NHẬN {PRICING_AUTHORITY.b2cCredits.referralBonus} XU
        </Text>
      </Pressable>

      <DiscoveryCuratedList
        sectionTitle={strings.utility.discoverySectionTitle}
        sectionSubtitle={strings.utility.discoverySectionSubtitle}
        categories={strings.utility.discoveryCategories}
      />

      <Text style={styles.sectionTitle}>{strings.utility.servicesTitle}</Text>
      <View style={styles.grid}>
        {serviceCards.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.id === 'vault') {
                navigation.navigate('Vault');
                return;
              }
              if (item.id === 'radar') {
                if (LAUNCH_PILOT_CONFIG.enableRadarSurface) {
                  navigation.navigate('RadarDiscovery');
                } else {
                  openMiniApp('b2cAiCallAssistant', () =>
                    navigation.navigate('LeonaCall', {
                      prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
                      autoSubmit: false,
                    })
                  );
                }
                return;
              }
              if (item.id === 'lifeos') {
                navigation.navigate('LifeOSDashboard');
                return;
              }
              if (item.id === 'travel') {
                openMiniApp('travel', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.travel }));
                return;
              }
              if (item.id === 'yeuthuong') {
                navigation.navigate('KetNoiYeuThuong');
                return;
              }
            }}
            style={({ pressed }) => [
              styles.serviceCard,
              isAffiliateIntermediaryService(item.id as UtilityServiceId) && styles.serviceCardAffiliate,
              pressed && { opacity: 0.72 },
            ]}
          >
            <View style={styles.iconBubble}>
              <Ionicons name={item.icon} size={22} color={theme.hybrid.signalStrong} />
            </View>
            <Text style={styles.serviceLabel}>{item.label}</Text>
            {isAffiliateIntermediaryService(item.id as UtilityServiceId) ? (
              <>
                <View style={styles.freeTagPill}>
                  <Text style={styles.freeTagText}>Miễn phí dịch vụ</Text>
                </View>
                <Text style={styles.sponsoredTrustText}>Được tài trợ bởi đối tác chính thức</Text>
              </>
            ) : null}
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Chuyên gia pháp lý & Kế toán</Text>
      <Text style={styles.expertsSectionSub}>
        Lead chuyên nghiệp — bạn không trả phí tư vấn; đối tác nhận lead có trách nhiệm phản hồi.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.expertsRow}>
        {CERTIFIED_EXPERTS.map((expert) => (
          <View
            key={expert.id}
            style={[styles.expertCard, webGlassStyle, webHoverStyle]}
            className={applyWebStyles('kn-glass')}
          >
            <View style={styles.expertTopRow}>
              <Text style={styles.expertName}>{expert.name}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={11} color={theme.colors.primary} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.expertSpecialty}>{expert.specialty}</Text>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Lead đã ghi nhận',
                  'Chúng tôi đã gửi yêu cầu «Nhận tư vấn miễn phí» tới đối tác. Bạn không mất phí; đối tác trả phí lead theo hợp đồng VIONA.',
                )
              }
              style={({ pressed }) => [styles.expertCta, pressed && { opacity: 0.82 }]}
            >
              <Text style={styles.expertCtaText}>Nhận tư vấn miễn phí</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.listingsHeader}>
        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          style={({ pressed }) => [styles.pinListingBtn, pressed && { opacity: 0.82 }]}
          accessibilityRole="button"
          accessibilityLabel="Ghim tin nổi bật từ ví Xu"
        >
          <Ionicons name="pin" size={14} color={theme.colors.primaryBright} />
          <Text style={styles.pinListingBtnText}>
            Ghim tin của bạn (Từ {B2C_LISTING_PIN_FROM_CREDITS_PER_DAY} Xu/ngày)
          </Text>
        </Pressable>
        <Text style={styles.sectionTitle}>Việc làm & Chợ đồng hương</Text>
      </View>
      <View style={styles.listingsCol}>
        {PREMIUM_LISTINGS.map((listing) => (
          <View
            key={listing.id}
            style={[
              styles.listingCard,
              webGlassStyle,
              webHoverStyle,
              listing.sponsored && styles.listingCardSponsored,
            ]}
            className={listing.sponsored ? applyWebStyles('kn-neon-b2b') : undefined}
          >
            {listing.sponsored ? (
              <View style={styles.listingSpotlightRow}>
                <Text style={styles.listingSpotlightLabel}>Tin nổi bật</Text>
              </View>
            ) : null}
            <View style={styles.listingTopRow}>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              {listing.sponsored ? (
                <View style={styles.sponsoredTag}>
                  <Text style={styles.sponsoredTagText}>Tài trợ</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.listingSubtitle}>{listing.subtitle}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{strings.reception.prepaidTitle}</Text>
      {walletPackCards.map((pack) => (
        <Pressable
          key={pack.id}
          onPress={() => {}}
          style={({ pressed }) => [styles.pricingCard, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.cardTitle}>{pack.name}</Text>
          <Text style={styles.cardHint}>
            {pack.purchasable
              ? strings.utility.packTurnsCredits.replace('{turns}', String(pack.turns))
              : strings.walletTopUp.enterpriseCta}
          </Text>
          <Text style={styles.priceLine}>
            {strings.walletTopUp.packPriceLine.replace('{amount}', pack.amountLabel)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
    <DiasporaRestrictionModal
      visible={diasporaRestrictionOpen}
      onClose={() => setDiasporaRestrictionOpen(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },
  brand: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.xs,
  },
  launchHint: {
    fontSize: theme.typeScale.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginBottom: theme.spacing.sm,
    opacity: 0.9,
  },
  title: {
    fontSize: theme.typeScale.h1.fontSize,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  dailyGiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.colors.surfaceElevated,
  },
  dailyGiftIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 115, 115, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.55)',
  },
  dailyGiftBody: {
    flex: 1,
    gap: 4,
  },
  dailyGiftTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.5,
  },
  dailyGiftSub: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  asianMarketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    minHeight: 132,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.surfaceElevated,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  asianMarketBannerIconCol: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  asianMarketBannerBody: {
    flex: 1,
    gap: 8,
  },
  asianMarketBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  asianMarketBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(197, 160, 89, 0.22)',
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  asianMarketBadgeVision: {
    backgroundColor: 'rgba(42, 103, 209, 0.12)',
    borderColor: 'rgba(42, 103, 209, 0.28)',
  },
  asianMarketBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.4,
  },
  asianMarketTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    lineHeight: 26,
  },
  asianMarketTitleEn: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  asianMarketSub: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  partnerEnterpriseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
  },
  partnerEnterpriseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  partnerEnterpriseMeta: {
    flex: 1,
    gap: 4,
  },
  partnerEnterpriseTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  partnerEnterpriseHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  pricingStrip: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
    gap: theme.spacing.xs,
  },
  pricingStripTitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pricingStripLine: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  pricingStripLinePremium: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.signalStrong,
  },
  pricingStripHint: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typeScale.caption.lineHeight * 1.25,
  },
  referralLaunchBtn: {
    marginBottom: theme.spacing.md,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  referralLaunchBtnText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
  },
  sectionTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '48%',
    minHeight: 116,
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardAffiliate: {
    borderColor: 'rgba(76, 175, 80, 0.35)',
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    marginBottom: 10,
  },
  serviceLabel: {
    textAlign: 'center',
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  freeTagPill: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(46, 125, 50, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(129, 199, 132, 0.85)',
  },
  freeTagText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#C8E6C9',
  },
  sponsoredTrustText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(200, 230, 201, 0.92)',
  },
  expertsSectionSub: {
    marginTop: -4,
    marginBottom: theme.spacing.sm,
    fontSize: theme.typeScale.caption.fontSize,
    lineHeight: theme.typeScale.caption.lineHeight * 1.2,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  expertsRow: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  expertCard: {
    width: 280,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.md,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  expertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  expertName: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
  },
  expertSpecialty: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  expertCta: {
    marginTop: 4,
    minHeight: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  expertCtaText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
  },
  listingsHeader: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  pinListingBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.surfaceMuted,
  },
  pinListingBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  listingsCol: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  listingCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.md,
  },
  listingCardSponsored: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.55 : 0.35,
    shadowRadius: Platform.OS === 'web' ? 18 : 12,
    elevation: 8,
  },
  listingSpotlightRow: {
    marginBottom: 8,
  },
  listingSpotlightLabel: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  listingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listingTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  sponsoredTag: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
  },
  sponsoredTagText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  listingSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  pricingCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.hybrid.panelCool,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.hybrid.panelCoolText,
    marginBottom: 6,
    fontFamily: FontFamily.bold,
  },
  cardHint: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
  },
  priceLine: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.hybrid.signalStrong,
    marginTop: 2,
    fontFamily: FontFamily.semibold,
  },
});
