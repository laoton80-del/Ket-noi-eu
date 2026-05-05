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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getDemoBookingPayload } from '../../config/demoRestBooking';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { formatVioCredits, getVioCreditsLabel } from '../../core/monetization/vioDisplayLabels';
import { MVP_LEONA_LITE_OFF_MSG } from '../../navigation/mvpSurfaceGate';
import type { RootStackParamList } from '../../navigation/routes';
import { previewLegalScanCostVig, scanLegalDocument } from '../../services/aiService';
import { confirmSecurityDepositThen } from '../../services/bookingEscrowUi';
import { formatNetworkFailureMessage, getRestApiJwt, isRestApiConfigured } from '../../services/apiClient';
import { createBooking } from '../../services/bookingService';
import { runUltraMasterBookingWithAlerts } from '../../services/ultraMasterBookingFlow';
import { reserveAndCommitCredits, useWalletState } from '../../state/wallet';
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
const NAVY = '#050B14';
const GOLD = 'rgba(197, 160, 89, 0.95)';
const GOLD_BORDER = 'rgba(212, 175, 55, 0.5)';
const GLASS = 'rgba(255, 255, 255, 0.07)';

const CATEGORY_META: Readonly<Record<ClassifiedCategory, { title: string; icon: keyof typeof Ionicons.glyphMap }>> = {
  hiring: { title: 'Tuyển thợ', icon: 'construct-outline' },
  shop_transfer: { title: 'Sang tiệm', icon: 'storefront-outline' },
  housing: { title: 'Thuê nhà', icon: 'home-outline' },
};

const DEFAULT_POSTS: readonly ClassifiedPost[] = [
  {
    id: 'cf_001',
    category: 'hiring',
    title: 'Cần thợ nail full-time tại Praha',
    city: 'Praha',
    priceLabel: 'Lương 1.700 EUR/tháng + tip',
    description: 'Tiệm đông khách, hỗ trợ giấy tờ và chỗ ở.',
    postedAtIso: '2026-04-28T08:30:00.000Z',
    isVip: true,
  },
  {
    id: 'cf_002',
    category: 'shop_transfer',
    title: 'Sang tiệm tóc khu trung tâm Berlin',
    city: 'Berlin',
    priceLabel: 'Giá sang: 48.000 EUR',
    description: 'Mặt bằng đẹp, hợp đồng 5 năm, lượng khách ổn định.',
    postedAtIso: '2026-04-27T14:00:00.000Z',
    isVip: false,
  },
  {
    id: 'cf_003',
    category: 'housing',
    title: 'Căn hộ 2PN gần tàu điện Vienna',
    city: 'Vienna',
    priceLabel: '1.150 EUR/tháng',
    description: 'Nội thất đầy đủ, phù hợp gia đình có con nhỏ.',
    postedAtIso: '2026-04-25T18:15:00.000Z',
    isVip: false,
  },
];

export function LocalScreen() {
  const navigation = useNavigation<Nav>();
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
    navigation.navigate('Tabs', { screen: 'TabLocal' });
  }, [navigation]);

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
      if (!featureFlags.leonaAssistantEnabled) {
        Alert.alert('Leona Assistant Lite', MVP_LEONA_LITE_OFF_MSG);
        return;
      }
      navigation.navigate('LeonaCall', { prefillRequest, autoSubmit: false });
    },
    [featureFlags.leonaAssistantEnabled, navigation]
  );

  const bookLawyerAfterCritical = useCallback(() => {
    confirmSecurityDepositThen(async () => {
      const payload = getDemoBookingPayload();
      if (!payload) {
        Alert.alert(
          'Đặt luật sư',
          'Thiếu EXPO_PUBLIC_DEMO_BOOKING_BUSINESS_ID hoặc EXPO_PUBLIC_DEMO_BOOKING_SERVICE_ID trong .env.'
        );
        return;
      }
      Alert.alert('Đặt luật sư', 'Transaction Processing…');
      try {
        const bk = await createBooking(payload);
        if (bk.ok) {
          Alert.alert('ViGlobal', 'Success!');
        } else {
          Alert.alert('Đặt luật sư', bk.error);
        }
      } catch (e) {
        Alert.alert('Đặt luật sư', formatNetworkFailureMessage(e));
      }
    });
  }, []);

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
            { text: 'Book Lawyer Immediately', onPress: bookLawyerAfterCritical },
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
    [bookLawyerAfterCritical]
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
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.topTitle}>ViGlobal Local</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.universeKicker}>Universe 02 · Dark</Text>
        <Text style={styles.heroHeadline}>Đặt dịch vụ đời thường</Text>
        <Text style={styles.heroSub}>Nails & Spa · Nhà hàng · Đối tác B2B — tốc độ địa phương, chuẩn ViGlobal.</Text>

        {showVietnamInboundHub ? (
          <Pressable
            onPress={() => navigation.navigate('VietnamHub')}
            style={({ pressed }) => [styles.vnHubBanner, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="Vietnam inbound hub"
          >
            <LinearGradient
              colors={['rgba(212, 175, 55, 0.28)', 'rgba(5, 11, 20, 0.92)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vnHubBannerInner}
            >
              <Ionicons name="earth" size={22} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vnHubBannerTitle}>Vietnam Inbound Hub</Text>
                <Text style={styles.vnHubBannerSub}>Stays · Tours · Fixers — V6.3 blueprint</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.45)" />
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
            <Text style={styles.heroCardTitle}>Nails & Spa</Text>
            <Text style={styles.heroCardSub}>Beauty & nail concierge</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              navigation.navigate('LeonaCall', { prefillRequest: 'Đặt bàn nhà hàng Việt gần tôi', autoSubmit: false })
            }
            style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Nhà hàng"
          >
            <Ionicons name="restaurant-outline" size={26} color={GOLD} />
            <Text style={styles.heroCardTitle}>Restaurant</Text>
            <Text style={styles.heroCardSub}>Đặt bàn & giao hàng</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('B2BPaywall')}
            style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Đặt lịch B2B"
          >
            <Ionicons name="briefcase-outline" size={26} color={GOLD} />
            <Text style={styles.heroCardTitle}>B2B Booking</Text>
            <Text style={styles.heroCardSub}>SaaS & đối tác</Text>
          </Pressable>
        </View>

        <Text style={styles.bentoSectionTitle}>Elite Services</Text>

        <TouchableOpacity
          onPress={() => void runUltraMasterBookingWithAlerts('Legal & Wealth')}
          activeOpacity={0.88}
          style={styles.bentoLarge}
          accessibilityRole="button"
          accessibilityLabel="Legal and Wealth"
        >
          <Ionicons name="scale-outline" size={28} color={GOLD} />
          <Text style={styles.bentoTitle}>Legal & Wealth</Text>
          <Text style={styles.bentoSub}>Immigration · Tax · Asset desk</Text>
        </TouchableOpacity>

        {legalScanEnabled ? (
          <TouchableOpacity
            onPress={() => void onLegalScannerPress()}
            activeOpacity={0.88}
            disabled={legalScanBusy}
            style={[styles.legalScannerBtn, legalScanBusy && styles.legalScannerBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="AI Legal Scanner"
          >
            {legalScanBusy ? (
              <ActivityIndicator size="small" color={GOLD} accessibilityLabel="Đang phân tích" />
            ) : (
              <Text style={styles.legalScannerEmoji}>⚖️</Text>
            )}
            <Text style={styles.legalScannerLabel}>AI Legal Scanner</Text>
            <Ionicons name="scan-outline" size={22} color={GOLD} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.bentoMidRow}>
          <TouchableOpacity
            onPress={() => openLeonaPrefill('ViGlobal Transit — ghép xe / gửi hàng')}
            activeOpacity={0.88}
            style={styles.bentoMedium}
            accessibilityRole="button"
            accessibilityLabel="ViGlobal Transit"
          >
            <Ionicons name="car-outline" size={24} color={GOLD} />
            <Text style={styles.bentoTitle}>ViGlobal Transit</Text>
            <Text style={styles.bentoSub}>Carpool · Parcel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DailyReward')}
            activeOpacity={0.88}
            style={styles.bentoMedium}
            accessibilityRole="button"
            accessibilityLabel="Expat Events"
          >
            <Ionicons name="ticket-outline" size={24} color={GOLD} />
            <Text style={styles.bentoTitle}>Expat Events</Text>
            <Text style={styles.bentoSub}>Community & VIP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => void scrollToClassifieds()}
          activeOpacity={0.88}
          style={styles.bentoBanner}
          accessibilityRole="button"
          accessibilityLabel="Classifieds"
        >
          <Ionicons name="pricetags-outline" size={24} color={GOLD} />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bentoTitle}>Classifieds</Text>
            <Text style={styles.bentoSub}>{`Chợ rao vặt · VIP đăng tin bằng ${getVioCreditsLabel()}`}</Text>
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
            <Text style={styles.sectionTitle}>Chợ rao vặt</Text>
            <Text style={styles.walletHint}>{formatVioCredits(wallet.credits)}</Text>
          </View>
          <Pressable style={styles.postBtn} onPress={() => setComposerVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color={NAVY} />
            <Text style={styles.postBtnText}>Đăng tin mới</Text>
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
            <Text style={styles.modalTitle}>Đăng bài trong Chợ rao vặt</Text>
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
            <TextInput value={title} onChangeText={setTitle} placeholder="Tiêu đề" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.input} />
            <TextInput value={city} onChangeText={setCity} placeholder="Thành phố" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.input} />
            <TextInput
              value={priceLabel}
              onChangeText={setPriceLabel}
              placeholder="Giá / mức lương"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết"
              placeholderTextColor="rgba(255,255,255,0.45)"
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
                {submitting ? <ActivityIndicator size="small" color={NAVY} /> : <Text style={styles.submitBtnText}>Đăng tin</Text>}
              </Pressable>
            </View>
          </Reanimated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: 6,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: 44 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(248, 250, 252, 0.95)',
    letterSpacing: -0.2,
  },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl * 1.5, paddingTop: 4 },
  universeKicker: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: GOLD,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(248, 250, 252, 0.98)',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(226, 232, 240, 0.72)',
    lineHeight: 19,
    marginBottom: theme.spacing.md,
  },
  heroRow: { flexDirection: 'row', gap: 10, marginBottom: theme.spacing.lg },
  heroCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: GLASS,
    borderWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderTopWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: 'rgba(248,250,252,0.96)', textAlign: 'center' },
  heroCardSub: { fontSize: 10, fontFamily: FontFamily.medium, color: 'rgba(226,232,240,0.6)', textAlign: 'center' },
  bentoSectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1,
    color: GOLD,
    marginBottom: 10,
    textTransform: 'uppercase',
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
    color: 'rgba(248, 250, 252, 0.96)',
    letterSpacing: 0.2,
  },
  bentoLarge: {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    padding: theme.spacing.md,
    marginBottom: 12,
    backgroundColor: GLASS,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  bentoMidRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  bentoMedium: {
    width: '48%',
    minHeight: 118,
    borderRadius: 18,
    padding: theme.spacing.md,
    backgroundColor: GLASS,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
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
    backgroundColor: GLASS,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 9,
  },
  bannerTextCol: { flex: 1, minWidth: 0 },
  bentoTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: 'rgba(248,250,252,0.98)' },
  bentoSub: { fontSize: 12, fontFamily: FontFamily.medium, color: 'rgba(226,232,240,0.65)' },
  classifiedsAnchor: { marginTop: 4 },
  classifiedsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: 'rgba(248,250,252,0.95)' },
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
  postBtnText: { color: NAVY, fontFamily: FontFamily.bold, fontSize: 14 },
  postCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftColor: GOLD_BORDER,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 6,
    backgroundColor: GLASS,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  categoryChipText: { fontSize: 11, color: GOLD, fontFamily: FontFamily.semibold },
  vipBadge: { fontSize: 11, color: GOLD, fontFamily: FontFamily.extrabold },
  postTitle: { fontSize: 15, color: 'rgba(248,250,252,0.96)', fontFamily: FontFamily.bold },
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
    borderTopColor: GOLD_BORDER,
    borderLeftColor: GOLD_BORDER,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(12, 20, 36, 0.96)',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: { fontSize: 16, color: 'rgba(248,250,252,0.96)', fontFamily: FontFamily.extrabold },
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
  categoryBtnText: { fontSize: 11, color: 'rgba(226,232,240,0.65)', fontFamily: FontFamily.semibold },
  categoryBtnTextActive: { color: GOLD },
  input: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: theme.spacing.md,
    color: 'rgba(248,250,252,0.95)',
    fontFamily: FontFamily.medium,
    backgroundColor: 'rgba(0,0,0,0.25)',
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
  vipToggleText: { fontSize: 12, color: 'rgba(248,250,252,0.9)', fontFamily: FontFamily.semibold },
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
  submitBtnText: { fontSize: 13, color: NAVY, fontFamily: FontFamily.bold },
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
    color: 'rgba(252, 250, 245, 0.98)',
  },
  vnHubBannerSub: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(226, 232, 240, 0.78)',
  },
});
