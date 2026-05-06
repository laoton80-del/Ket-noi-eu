import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Localization from 'expo-localization';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getDemoBookingPayload } from '../../config/demoRestBooking';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { formatVioCredits, getVioCreditsLabel } from '../../core/monetization/vioDisplayLabels';
import type { RootStackParamList } from '../../navigation/routes';
import { previewLegalScanCostVig, scanLegalDocument } from '../../services/aiService';
import { confirmSecurityDepositThen } from '../../services/bookingEscrowUi';
import { formatNetworkFailureMessage, getRestApiJwt, isRestApiConfigured } from '../../services/apiClient';
import { createBooking } from '../../services/bookingService';
import { runUltraMasterBookingWithAlerts } from '../../services/ultraMasterBookingFlow';
import { reserveAndCommitCredits, useWalletState } from '../../state/wallet';
import { useTranslation } from '../../i18n';
import { LocalCommerceClarityBlock } from '../../components/localCommerce/LocalCommerceClarityBlock';
import { VionaCard } from '../../components/viona/VionaCard';
import { VionaHeader } from '../../components/viona/VionaHeader';
import { VionaSectionHeader } from '../../components/viona/VionaSectionHeader';
import { vionaTrust } from '../../components/viona/vionaTrustTokens';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ClassifiedCategory = 'hiring' | 'shop_transfer' | 'housing';

type ClassifiedPost = Readonly<{
  id: string;
  category: ClassifiedCategory;
  title: string;
  city: string;
  priceLabel: string;
  description: string;
  postedAtIso: string;
  isVip: boolean;
}>;

const VIP_POSTING_COST_VIG = 120;
const BG = vionaTrust.canvas;
const SURFACE = vionaTrust.surface;
const INK = vionaTrust.ink;
const INK_MUTED = vionaTrust.inkMuted;
const BORDER = vionaTrust.border;
const GOLD = vionaTrust.accentGold;
const GOLD_BORDER = 'rgba(197, 160, 89, 0.35)';

const CATEGORY_META: Readonly<Record<ClassifiedCategory, { title: string; icon: keyof typeof Ionicons.glyphMap }>> = {
  hiring: { title: 'Tuyển thợ', icon: 'construct-outline' },
  shop_transfer: { title: 'Sang tiệm', icon: 'storefront-outline' },
  housing: { title: 'Thuê nhà', icon: 'home-outline' },
};

const DEFAULT_POSTS: readonly ClassifiedPost[] = [
  {
    id: 'cf_001',
    category: 'hiring',
    title: 'Tuyển thợ nail full-time (khu trung tâm)',
    city: 'TP. Hồ Chí Minh',
    priceLabel: 'Lương thỏa thuận + tip',
    description: 'Tiệm đông khách, hỗ trợ giấy tờ và chỗ ở (tin demo).',
    postedAtIso: '2026-04-28T08:30:00.000Z',
    isVip: true,
  },
  {
    id: 'cf_002',
    category: 'shop_transfer',
    title: 'Sang tiệm tóc mặt tiền đẹp',
    city: 'Hà Nội',
    priceLabel: 'Giá sang: thỏa thuận',
    description: 'Mặt bằng tốt, lượng khách ổn định (tin demo).',
    postedAtIso: '2026-04-27T14:00:00.000Z',
    isVip: false,
  },
  {
    id: 'cf_003',
    category: 'housing',
    title: 'Căn hộ 2PN gần trung tâm',
    city: 'Đà Nẵng',
    priceLabel: 'Giá thuê tham khảo',
    description: 'Nội thất đầy đủ, phù hợp gia đình nhỏ (tin demo).',
    postedAtIso: '2026-04-25T18:15:00.000Z',
    isVip: false,
  },
];

export function LocalScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<Nav>();
  const { openMiniApp } = useMiniAppEntry();
  const wallet = useWalletState();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const legalScanEnabled = featureFlags.legalScanEnabled;
  const showVietnamInboundHub = useMemo(() => {
    const region = Localization.getLocales()[0]?.regionCode?.toUpperCase() ?? '';
    return region === 'VN' && featureFlags.travelEnabled;
  }, [featureFlags.travelEnabled]);
  const scrollRef = useRef<ScrollView>(null);
  const [classifiedsY, setClassifiedsY] = useState(0);
  const [posts, setPosts] = useState<readonly ClassifiedPost[]>(DEFAULT_POSTS);
  const [composerVisible, setComposerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClassifiedCategory>('hiring');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [description, setDescription] = useState('');
  const [vipEnabled, setVipEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [legalScanBusy, setLegalScanBusy] = useState(false);
  const modalAnim = useSharedValue(0);

  modalAnim.value = withTiming(composerVisible ? 1 : 0, {
    duration: composerVisible ? 240 : 160,
    easing: Easing.out(Easing.cubic),
  });

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
    transform: [{ translateY: (1 - modalAnim.value) * 20 }],
  }));

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((a, b) => {
        if (a.isVip === b.isVip) return b.postedAtIso.localeCompare(a.postedAtIso);
        return a.isVip ? -1 : 1;
      }),
    [posts]
  );

  const openServiceHub = useCallback(() => {
    openMiniApp('local', () => navigation.navigate('Tabs', { screen: 'TabLocal' }));
  }, [navigation, openMiniApp]);

  const onAiReceptionistPilotInfo = useCallback(() => {
    Alert.alert(t('localCommerce.cta.aiReceptionistPilot'), t('localCommerce.safety.aiPilotNote'));
  }, [t]);

  const resetComposer = () => {
    setTitle('');
    setCity('');
    setPriceLabel('');
    setDescription('');
    setSelectedCategory('hiring');
    setVipEnabled(false);
  };

  const scrollToClassifieds = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, classifiedsY - 12), animated: true });
  }, [classifiedsY]);

  const openLeonaPrefill = useCallback(
    (prefillRequest: string) => {
      openMiniApp('b2cAiCallAssistant', () =>
        navigation.navigate('LeonaCall', { prefillRequest, autoSubmit: false })
      );
    },
    [navigation, openMiniApp]
  );

  const bookLawyerAfterCritical = useCallback(() => {
    confirmSecurityDepositThen(async () => {
      const payload = getDemoBookingPayload();
      if (!payload) {
        Alert.alert(
          t('localCommerce.alert.demoBookingTitle'),
          t('localCommerce.alert.demoBookingMissingEnv')
        );
        return;
      }
      Alert.alert(t('localCommerce.alert.demoBookingTitle'), t('localCommerce.alert.processingRequest'));
      try {
        const bk = await createBooking(payload);
        if (bk.ok) {
          Alert.alert(t('localCommerce.alert.demoBookingTitle'), t('localCommerce.alert.requestRecordedDemo'));
        } else {
          Alert.alert(t('localCommerce.alert.demoBookingTitle'), bk.error);
        }
      } catch (e) {
        Alert.alert(t('localCommerce.alert.demoBookingTitle'), formatNetworkFailureMessage(e));
      }
    });
  }, [t]);

  const runLegalScanAfterPriceConfirm = useCallback(
    async (documentText: string) => {
      setLegalScanBusy(true);
      Alert.alert('AI Trạng Sư', 'AI is analyzing document...');
      try {
        const r = await scanLegalDocument(documentText);
        if (!r.ok) {
          Alert.alert('AI Trạng Sư', r.error);
          return;
        }

        if (r.data.alertLevel === 'CRITICAL') {
          const body = r.data.summary.join('\n');
          Alert.alert('⚠️ CRITICAL — AI Trạng Sư', body, [
            { text: 'Đóng', style: 'cancel' },
            { text: t('localCommerce.alert.bookLawyerImmediate'), onPress: bookLawyerAfterCritical },
          ]);
        } else {
          Alert.alert('AI Trạng Sư', r.data.summary.join('\n'));
        }
      } catch (e) {
        Alert.alert('AI Trạng Sư', formatNetworkFailureMessage(e));
      } finally {
        setLegalScanBusy(false);
      }
    },
    [bookLawyerAfterCritical, t]
  );

  const onLegalScannerPress = useCallback(() => {
    if (!featureFlags.legalScanEnabled) {
      Alert.alert('AI Trạng Sư', 'Tính năng đang tạm đóng băng (Coming soon).');
      return;
    }
    void (async () => {
      if (!isRestApiConfigured()) {
        Alert.alert('AI Trạng Sư', 'Chưa cấu hình EXPO_PUBLIC_REST_API_BASE.');
        return;
      }
      const jwt = await getRestApiJwt();
      if (!jwt?.trim()) {
        Alert.alert('AI Trạng Sư', 'Cần JWT REST (đăng nhập API hoặc EXPO_PUBLIC_DEV_REST_JWT).');
        return;
      }

      const dummyCriticalText =
        'Official court notice regarding eviction and penalty. Reference: Kündigung and strafe under local housing act.';
      const est = previewLegalScanCostVig(dummyCriticalText);
      Alert.alert(
        'AI Trạng Sư',
        `Ước tính: ${formatVioCredits(est)} (đơn vị trong app) theo độ dài văn bản. Tiếp tục?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => void runLegalScanAfterPriceConfirm(dummyCriticalText) },
        ]
      );
    })();
  }, [runLegalScanAfterPriceConfirm]);

  const submitPost = async () => {
    if (!title.trim() || !city.trim() || !priceLabel.trim() || !description.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ nội dung tin rao.');
      return;
    }
    setSubmitting(true);
    try {
      if (vipEnabled) {
        const idempotencyKey = `classified-vip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const paid = await reserveAndCommitCredits(VIP_POSTING_COST_VIG, idempotencyKey);
        if (!paid.ok) {
          Alert.alert('Không thể đăng VIP', 'Số dư VIO Credits không đủ hoặc hệ thống tạm gián đoạn.');
          return;
        }
      }
      const newPost: ClassifiedPost = {
        id: `cf_${Date.now()}`,
        category: selectedCategory,
        title: title.trim(),
        city: city.trim(),
        priceLabel: priceLabel.trim(),
        description: description.trim(),
        postedAtIso: new Date().toISOString(),
        isVip: vipEnabled,
      };
      setPosts((prev) => [newPost, ...prev]);
      setComposerVisible(false);
      resetComposer();
      Alert.alert('Đăng tin thành công', vipEnabled ? 'Tin VIP đã được đẩy lên đầu bảng.' : 'Tin thường đã được đăng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <VionaHeader
        variant="light"
        title={t('localHub.screenTitle')}
        titleAlign="center"
        onBack={() => navigation.goBack()}
        backA11yLabel="Quay lại"
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && width > 768 && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VionaCard style={styles.heroIntroCard} surfaceVariant="light">
          <VionaSectionHeader
            emphasis="hero"
            kicker={t('localHub.universeKicker')}
            title={t('localHub.heroHeadline')}
            subtitle={t('localHub.heroSub')}
          />
        </VionaCard>

        <LocalCommerceClarityBlock
          onBrowseServices={openServiceHub}
          onRequestBookingAssist={() =>
            openLeonaPrefill(t('localCommerce.leonaBookingAssistPrefill'))
          }
          onMerchantSetup={() => navigation.navigate('B2BPaywall')}
          onAiReceptionistPilotInfo={onAiReceptionistPilotInfo}
        />

        {showVietnamInboundHub ? (
          <Pressable
            onPress={() => navigation.navigate('VietnamHub')}
            style={({ pressed }) => [styles.vnHubBanner, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="Vietnam inbound hub"
          >
            <LinearGradient
              colors={['#E8F1FC', '#FFF8EC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vnHubBannerInner}
            >
              <Ionicons name="earth" size={22} color={theme.hybrid.signalStrong} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vnHubBannerTitle}>{t('localHub.vnBannerTitle')}</Text>
                <Text style={styles.vnHubBannerSub}>{t('localHub.vnBannerSub')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={INK_MUTED} />
            </LinearGradient>
          </Pressable>
        ) : null}

        <View style={styles.heroRow}>
          <Pressable
            onPress={openServiceHub}
            style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Nails và Spa"
          >
            <Ionicons name="sparkles-outline" size={26} color={GOLD} />
            <Text style={styles.heroCardTitle}>{t('localHub.nailsTitle')}</Text>
            <Text style={styles.heroCardSub}>{t('localHub.nailsSub')}</Text>
          </Pressable>
          <Pressable
            onPress={() => openLeonaPrefill(t('localCommerce.leonaRestaurantPrefill'))}
            style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={t('localHub.restaurantTitle')}
          >
            <Ionicons name="restaurant-outline" size={26} color={GOLD} />
            <Text style={styles.heroCardTitle}>{t('localHub.restaurantTitle')}</Text>
            <Text style={styles.heroCardSub}>{t('localHub.restaurantSub')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('B2BPaywall')}
            style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={t('localCommerce.a11y.merchantB2bHub')}
          >
            <Ionicons name="briefcase-outline" size={26} color={GOLD} />
            <Text style={styles.heroCardTitle}>{t('localHub.b2bTitle')}</Text>
            <Text style={styles.heroCardSub}>{t('localHub.b2bSub')}</Text>
          </Pressable>
        </View>

        <Text style={styles.bentoSectionTitle}>{t('localHub.eliteSection')}</Text>

        <TouchableOpacity
          onPress={() => void runUltraMasterBookingWithAlerts(t('localHub.legalWealthTitle'))}
          activeOpacity={0.88}
          style={styles.bentoLarge}
          accessibilityRole="button"
          accessibilityLabel={t('localHub.legalWealthTitle')}
        >
          <Ionicons name="scale-outline" size={28} color={GOLD} />
          <Text style={styles.bentoTitle}>{t('localHub.legalWealthTitle')}</Text>
          <Text style={styles.bentoSub}>{t('localHub.legalWealthSub')}</Text>
        </TouchableOpacity>

        {legalScanEnabled ? (
          <TouchableOpacity
            onPress={() => void onLegalScannerPress()}
            activeOpacity={0.88}
            disabled={legalScanBusy}
            style={[styles.legalScannerBtn, legalScanBusy && styles.legalScannerBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('localHub.legalScannerA11y')}
          >
            {legalScanBusy ? (
              <ActivityIndicator size="small" color={GOLD} accessibilityLabel="Đang phân tích" />
            ) : (
              <Text style={styles.legalScannerEmoji}>⚖️</Text>
            )}
            <Text style={styles.legalScannerLabel}>{t('localHub.legalScannerLabel')}</Text>
            <Ionicons name="scan-outline" size={22} color={GOLD} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.bentoMidRow}>
          <TouchableOpacity
            onPress={() => openLeonaPrefill(t('localHub.transitLeonaPrefill'))}
            activeOpacity={0.88}
            style={styles.bentoMedium}
            accessibilityRole="button"
            accessibilityLabel={t('localHub.transitTitle')}
          >
            <Ionicons name="car-outline" size={24} color={GOLD} />
            <Text style={styles.bentoTitle}>{t('localHub.transitTitle')}</Text>
            <Text style={styles.bentoSub}>{t('localHub.transitSub')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DailyReward')}
            activeOpacity={0.88}
            style={styles.bentoMedium}
            accessibilityRole="button"
            accessibilityLabel={t('localHub.eventsTitle')}
          >
            <Ionicons name="ticket-outline" size={24} color={GOLD} />
            <Text style={styles.bentoTitle}>{t('localHub.eventsTitle')}</Text>
            <Text style={styles.bentoSub}>{t('localHub.eventsSub')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => void scrollToClassifieds()}
          activeOpacity={0.88}
          style={styles.bentoBanner}
          accessibilityRole="button"
          accessibilityLabel={t('localHub.classifiedsTitle')}
        >
          <Ionicons name="pricetags-outline" size={24} color={GOLD} />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bentoTitle}>{t('localHub.classifiedsTitle')}</Text>
            <Text style={styles.bentoSub}>
              {t('localHub.classifiedsRowSub', { unit: getVioCreditsLabel() })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={GOLD} />
        </TouchableOpacity>

        <View
          onLayout={(e) => {
            setClassifiedsY(e.nativeEvent.layout.y);
          }}
          style={styles.classifiedsAnchor}
        >
          <View style={styles.classifiedsHeaderRow}>
            <Text style={styles.sectionTitle}>{t('localHub.classifiedsTitle')}</Text>
            <Text style={styles.walletHint}>{formatVioCredits(wallet.credits)}</Text>
          </View>
          <Pressable style={styles.postBtn} onPress={() => setComposerVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color={INK} />
            <Text style={styles.postBtnText}>{t('localHub.postNewListing')}</Text>
          </Pressable>

          {sortedPosts.map((item) => {
            const meta = CATEGORY_META[item.category];
            return (
              <View key={item.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.categoryChip}>
                    <Ionicons name={meta.icon} size={14} color={GOLD} />
                    <Text style={styles.categoryChipText}>{meta.title}</Text>
                  </View>
                  {item.isVip ? <Text style={styles.vipBadge}>VIP</Text> : null}
                </View>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postMeta}>
                  {item.city} · {item.priceLabel}
                </Text>
                <Text style={styles.postDesc}>{item.description}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={composerVisible} transparent animationType="none" onRequestClose={() => setComposerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Reanimated.View style={[styles.modalCard, modalAnimatedStyle]}>
            <Text style={styles.modalTitle}>{t('localHub.classifiedsComposerTitle')}</Text>
            <View style={styles.categoryRow}>
              {(Object.keys(CATEGORY_META) as ClassifiedCategory[]).map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[styles.categoryBtn, selectedCategory === category && styles.categoryBtnActive]}
                >
                  <Text style={[styles.categoryBtnText, selectedCategory === category && styles.categoryBtnTextActive]}>
                    {CATEGORY_META[category].title}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="Tiêu đề" placeholderTextColor="rgba(11,22,40,0.42)" style={styles.input} />
            <TextInput value={city} onChangeText={setCity} placeholder="Thành phố" placeholderTextColor="rgba(11,22,40,0.42)" style={styles.input} />
            <TextInput
              value={priceLabel}
              onChangeText={setPriceLabel}
              placeholder="Giá / mức lương"
              placeholderTextColor="rgba(11,22,40,0.42)"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết"
              placeholderTextColor="rgba(11,22,40,0.42)"
              style={[styles.input, styles.inputMultiline]}
              multiline
            />
            <Pressable onPress={() => setVipEnabled((v) => !v)} style={[styles.vipToggle, vipEnabled && styles.vipToggleActive]}>
              <Ionicons name={vipEnabled ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={GOLD} />
              <Text style={styles.vipToggleText}>Đăng VIP (+{formatVioCredits(VIP_POSTING_COST_VIG)})</Text>
            </Pressable>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setComposerVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>
              <Pressable onPress={() => void submitPost()} style={styles.submitBtn} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={INK} /> : <Text style={styles.submitBtnText}>Đăng tin</Text>}
              </Pressable>
            </View>
          </Reanimated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  heroIntroCard: {
    marginBottom: theme.spacing.md,
  },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl * 2.25, paddingTop: 4 },
  contentDesktop: { paddingBottom: theme.spacing.xxl * 3.25, paddingRight: 28 },
  heroRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.lg },
  heroCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroCardTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: INK, textAlign: 'center' },
  heroCardSub: { fontSize: 10, fontFamily: FontFamily.medium, color: INK_MUTED, textAlign: 'center' },
  bentoSectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    color: INK,
    marginBottom: 10,
  },
  legalScannerBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    marginBottom: 12,
    backgroundColor: 'rgba(197, 160, 89, 0.18)',
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  legalScannerBtnDisabled: { opacity: 0.72 },
  legalScannerEmoji: { fontSize: 22 },
  legalScannerLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: 0.2,
  },
  bentoLarge: {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  bentoMidRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  bentoMedium: {
    width: '48%',
    minHeight: 118,
    borderRadius: 18,
    padding: theme.spacing.md,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  bentoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: theme.spacing.md,
    gap: 12,
    marginBottom: theme.spacing.lg,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  bannerTextCol: { flex: 1, minWidth: 0 },
  bentoTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: INK },
  bentoSub: { fontSize: 12, fontFamily: FontFamily.medium, color: INK_MUTED },
  classifiedsAnchor: { marginTop: 4 },
  classifiedsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: INK },
  walletHint: { fontSize: 12, fontFamily: FontFamily.bold, color: GOLD },
  postBtn: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: GOLD,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  postBtnText: { color: INK, fontFamily: FontFamily.bold, fontSize: 14 },
  postCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 6,
    backgroundColor: SURFACE,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: vionaTrust.surfaceMuted,
    borderWidth: 1,
    borderColor: BORDER,
  },
  categoryChipText: { fontSize: 11, color: GOLD, fontFamily: FontFamily.semibold },
  vipBadge: { fontSize: 11, color: GOLD, fontFamily: FontFamily.extrabold },
  postTitle: { fontSize: 15, color: INK, fontFamily: FontFamily.bold },
  postMeta: { fontSize: 12, color: GOLD, fontFamily: FontFamily.semibold },
  postDesc: { fontSize: 12, color: 'rgba(226,232,240,0.7)', fontFamily: FontFamily.medium, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: { fontSize: 16, color: INK, fontFamily: FontFamily.extrabold },
  categoryRow: { flexDirection: 'row', gap: 6 },
  categoryBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtnActive: { borderColor: GOLD, backgroundColor: 'rgba(197, 160, 89, 0.12)' },
  categoryBtnText: { fontSize: 11, color: INK_MUTED, fontFamily: FontFamily.semibold },
  categoryBtnTextActive: { color: GOLD },
  input: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: theme.spacing.md,
    color: INK,
    fontFamily: FontFamily.medium,
    backgroundColor: vionaTrust.surfaceMuted,
  },
  inputMultiline: { minHeight: 86, textAlignVertical: 'top', paddingTop: 10 },
  vipToggle: {
    minHeight: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipToggleActive: { borderColor: GOLD },
  vipToggleText: { fontSize: 12, color: INK, fontFamily: FontFamily.semibold },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  cancelBtn: {
    minHeight: 40,
    minWidth: 84,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cancelBtnText: { fontSize: 13, color: 'rgba(226,232,240,0.75)', fontFamily: FontFamily.semibold },
  submitBtn: {
    minHeight: 40,
    minWidth: 110,
    borderRadius: theme.radius.md,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  submitBtnText: { fontSize: 13, color: INK, fontFamily: FontFamily.bold },
  vnHubBanner: {
    marginTop: 14,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  vnHubBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  vnHubBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: INK,
  },
  vnHubBannerSub: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: INK_MUTED,
  },
});
