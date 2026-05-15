import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Localization from 'expo-localization';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useHomeCommand } from '../../context/HomeCommandContext';
import { LocalCommerceClarityBlock } from '../../components/localCommerce/LocalCommerceClarityBlock';
import { LocalConstellationFrame } from '../../components/local/LocalConstellationFrame';
import { VionaBrandLockup } from '../../components/viona/VionaBrandLockup';
import {
  FASHION_HOME_LINE_GOLD_SOFT,
} from '../../components/viona/fashionHomeDesktopShell';
import { SmartTrioLanguageSheet } from '../../components/smartTrio/SmartTrioLanguageSheet';
import {
  localAccentIconChipFill,
  localAccentInk,
  localAccentInkHover,
  localAccentStatusFill,
  localAccentStroke,
  localAccentStrokeHover,
  localConstellation,
  localRailPillInk,
  localRailPillStroke,
  resolveLocalContentRail,
  resolveLocalGridColumns,
  resolveLocalGridItemWidth,
  type LocalConstellationAccent,
  type LocalRailPillAccent,
} from '../../components/local/localConstellationTokens';
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
const LOCAL_GLOBAL_BG = require('../../../assets/UI/viona-local-global-net-bg-v2.png');
const BG = localConstellation.canvas;
const SURFACE = localConstellation.surfaceRaised;
const INK = localConstellation.ink;
const INK_STRONG = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const INK_CARD_SUB = localConstellation.inkCardSub;
const BORDER = localConstellation.border;
const GOLD = localConstellation.accentGold;
const EMERALD = localConstellation.accentEmerald;
const CYAN = localConstellation.accentCyan;
const RISK = localConstellation.risk;
const LOCAL_LEGACY_HIDE_STYLE_ID = 'viona-local-legacy-hide';

function useLocalWebShellCompensation() {
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;

      const hiddenHosts = new Set<HTMLElement>();
      const scenePadHosts = new Set<HTMLElement>();
      const languageTitle = t('smartTrio.switcher.title');
      const accountA11y = t('home.accountChipA11y');
      const accountChip = t('home.accountChip');
      const accountChipShort = t('home.accountChipShort');
      const sosLabel = t('sos.fabLabel');

      const localRoot = () => document.getElementById('local-hub-root');

      const isInsideLocalRoot = (node: Element) => node.closest('#local-hub-root') != null;

      const containsLocalRoot = (node: Element) => node.querySelector('#local-hub-root') != null;

      const matchesLegacyControl = (ariaLabel: string, text: string) => {
        const haystack = `${ariaLabel} ${text}`.trim();
        return (
          ariaLabel === sosLabel ||
          text === sosLabel ||
          ariaLabel === accountA11y ||
          ariaLabel === accountChip ||
          text === accountChip ||
          text === accountChipShort ||
          ariaLabel === languageTitle ||
          (haystack.includes(languageTitle) && haystack.length <= 180)
        );
      };

      const hideHost = (host: HTMLElement) => {
        const root = localRoot();
        if (root && (root === host || root.contains(host) || host.contains(root))) return;
        if (hiddenHosts.has(host)) return;
        hiddenHosts.add(host);
        host.dataset.vionaLocalLegacyChrome = 'true';
        host.dataset.localLegacyHidden = 'true';
        host.style.setProperty('display', 'none', 'important');
      };

      const pickOutsideLegacyHost = (node: Element): HTMLElement | null => {
        const root = localRoot();
        let current: HTMLElement | null = node instanceof HTMLElement ? node : node.parentElement;
        while (current && current !== document.body) {
          if (current.id === 'local-hub-root') return null;
          if (root?.contains(current)) return null;
          const style = window.getComputedStyle(current);
          const positioned =
            style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky';
          const rect = current.getBoundingClientRect();
          if (positioned && rect.width >= 20 && rect.height >= 16) {
            return current;
          }
          current = current.parentElement;
        }
        return null;
      };

      const resetSceneTopPadding = () => {
        let current: HTMLElement | null = localRoot();
        while (current?.parentElement) {
          current = current.parentElement;
          const pad = Number.parseFloat(window.getComputedStyle(current).paddingTop || '0');
          if (pad < localConstellation.desktopScenePadMin) continue;
          if (scenePadHosts.has(current)) continue;
          scenePadHosts.add(current);
          current.dataset.localScenePadPrev = current.style.paddingTop;
          current.style.paddingTop = '0px';
        }
      };

      const scanLegacyChrome = () => {
        const root = localRoot();
        const candidates = new Set<HTMLElement>();

        const consider = (node: Element) => {
          if (isInsideLocalRoot(node)) return;
          const element = node as HTMLElement;
          if (containsLocalRoot(element)) return;
          const ariaLabel = element.getAttribute('aria-label') ?? '';
          const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!matchesLegacyControl(ariaLabel, text)) return;
          const host = pickOutsideLegacyHost(element);
          if (!host || (root && (root.contains(host) || host.contains(root)))) return;
          candidates.add(host);
        };

        document.querySelectorAll('[aria-label]').forEach(consider);
        document.querySelectorAll('[role="button"], button, [tabindex="0"]').forEach(consider);

        document.querySelectorAll('body *').forEach((node) => {
          const element = node as HTMLElement;
          if (isInsideLocalRoot(element)) return;
          if (containsLocalRoot(element)) return;
          const style = window.getComputedStyle(element);
          if (style.position !== 'fixed' && style.position !== 'absolute' && style.position !== 'sticky') {
            return;
          }
          const ariaLabel =
            element.getAttribute('aria-label') ??
            element.querySelector('[aria-label]')?.getAttribute('aria-label') ??
            '';
          const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!matchesLegacyControl(ariaLabel, text)) return;
          if (root?.contains(element) || (root && element.contains(root))) return;
          candidates.add(element);
        });

        candidates.forEach((host) => hideHost(host));
      };

      const ensureLegacyHideStyle = () => {
        if (document.getElementById(LOCAL_LEGACY_HIDE_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = LOCAL_LEGACY_HIDE_STYLE_ID;
        style.textContent = `
          body[data-viona-local-hub="true"] [data-viona-local-legacy-chrome="true"] {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      };

      ensureLegacyHideStyle();
      document.body.dataset.vionaLocalHub = 'true';
      resetSceneTopPadding();
      scanLegacyChrome();
      const t1 = window.setTimeout(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 250);
      const t2 = window.setTimeout(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 1200);
      const t3 = window.setTimeout(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 3000);
      const observer = new MutationObserver(() => {
        resetSceneTopPadding();
        scanLegacyChrome();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'style', 'class'] });

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        observer.disconnect();
        delete document.body.dataset.vionaLocalHub;
        scenePadHosts.forEach((host) => {
          host.style.paddingTop = host.dataset.localScenePadPrev ?? '';
          delete host.dataset.localScenePadPrev;
        });
        scenePadHosts.clear();
        hiddenHosts.forEach((host) => {
          host.style.removeProperty('display');
          delete host.dataset.localLegacyHidden;
          delete host.dataset.vionaLocalLegacyChrome;
        });
        hiddenHosts.clear();
      };
    }, [t])
  );
}

function LocalCommandPill({
  label,
  icon,
  onPress,
  a11yLabel,
  accent,
}: Readonly<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  a11yLabel: string;
  accent: LocalRailPillAccent;
}>) {
  const tone = localRailPillInk(accent);
  const stroke = localRailPillStroke(accent);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.commandPill,
        {
          borderColor: stroke,
          backgroundColor: localConstellation.commandPillBg,
        },
        pressed && styles.commandPillPressed,
      ]}
    >
      <Ionicons name={icon} size={15} color={tone} />
      <Text style={[styles.commandPillLabel, accent === 'risk' && styles.commandPillLabelRisk]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function LocalDestinationCard({
  cardWidth,
  accent,
  icon,
  label,
  title,
  subtitle,
  onPress,
  a11yLabel,
  disabled = false,
}: Readonly<{
  cardWidth: number;
  accent: LocalConstellationAccent;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  a11yLabel: string;
  disabled?: boolean;
}>) {
  const [hovered, setHovered] = useState(false);
  const ink = hovered ? localAccentInkHover(accent) : localAccentInk(accent);

  return (
    <View style={{ width: cardWidth, opacity: disabled ? 0.72 : 1 }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        style={({ pressed }) => [
          styles.gridCardPressable,
          Platform.OS === 'web' && styles.gridCardInteractive,
          Platform.OS === 'web' && hovered && styles.gridCardHovered,
          pressed && styles.gridCardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <LocalConstellationFrame accent={accent} radius={16} hovered={hovered} contentStyle={styles.destinationCard}>
          <View style={styles.gridCardTop}>
            <View
              style={[
                styles.heroIconChip,
                {
                  borderColor: hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent),
                  borderWidth: localConstellation.cardEdgeWidth,
                  backgroundColor: localAccentIconChipFill(accent, hovered),
                  shadowColor: ink,
                  shadowOpacity: hovered ? 0.62 : 0.28,
                  shadowRadius: hovered ? 16 : 7,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Ionicons name={icon} size={20} color={ink} />
            </View>
            <View
              style={[
                styles.gridCardStatusPill,
                {
                  borderColor: hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent),
                  borderWidth: localConstellation.cardEdgeWidth,
                  backgroundColor: localAccentStatusFill(accent, hovered),
                  shadowColor: ink,
                  shadowOpacity: hovered ? 0.42 : 0.12,
                  shadowRadius: hovered ? 10 : 4,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Text style={[styles.gridCardStatusText, { color: ink }]}>{label}</Text>
            </View>
          </View>
          <Text style={[styles.destinationTitle, hovered && { color: ink }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.destinationSub} numberOfLines={2}>
            {subtitle}
          </Text>
          <View style={styles.gridCardFooter}>
            <Text
              style={[
                styles.gridCardCta,
                {
                  color: ink,
                  shadowColor: ink,
                  shadowOpacity: hovered ? 0.68 : 0.24,
                  shadowRadius: hovered ? 10 : 5,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              →
            </Text>
          </View>
        </LocalConstellationFrame>
      </Pressable>
    </View>
  );
}

function LocalClassifiedCard({
  cardWidth,
  item,
}: Readonly<{
  cardWidth: number;
  item: ClassifiedPost;
}>) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const meta = CATEGORY_META[item.category];
  const accent: LocalConstellationAccent = item.isVip ? 'gold' : 'emerald';
  const ink = hovered ? localAccentInkHover(accent) : localAccentInk(accent);

  return (
    <View style={{ width: cardWidth }}>
      <Pressable
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        style={[
          styles.gridCardPressable,
          Platform.OS === 'web' && styles.gridCardInteractive,
          Platform.OS === 'web' && hovered && styles.gridCardHovered,
        ]}
      >
        <LocalConstellationFrame accent={accent} tier="service" radius={14} hovered={hovered} contentStyle={styles.postCard}>
          <View style={styles.postHeader}>
            <View
              style={[
                styles.categoryChip,
                {
                  borderColor: hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent),
                  borderWidth: localConstellation.cardEdgeWidth,
                  backgroundColor: localAccentStatusFill(accent, hovered),
                  shadowColor: ink,
                  shadowOpacity: hovered ? 0.52 : 0.2,
                  shadowRadius: hovered ? 12 : 5,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <Ionicons name={meta.icon} size={14} color={ink} />
              <Text style={[styles.categoryChipText, { color: ink }]}>{meta.title}</Text>
            </View>
            {item.isVip ? <Text style={styles.vipBadge}>{t('localHub.vipHighlight')}</Text> : null}
          </View>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.postMeta} numberOfLines={1}>
            {item.city} · {item.priceLabel}
          </Text>
          <Text style={styles.postDesc} numberOfLines={3}>
            {item.description}
          </Text>
        </LocalConstellationFrame>
      </Pressable>
    </View>
  );
}

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
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const homeCommand = useHomeCommand();
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

  const { horizontalPad, innerWidth } = resolveLocalContentRail(width);
  const gridColumns = resolveLocalGridColumns(width);
  const cardWidth = resolveLocalGridItemWidth(innerWidth, gridColumns);
  const classifiedColumns = resolveLocalGridColumns(width, { desktop: 3, tablet: 2 });
  const classifiedCardWidth = resolveLocalGridItemWidth(innerWidth, classifiedColumns);
  const bottomPadClearance =
    localConstellation.tabBarClearanceBottom +
    (Platform.OS === 'web' ? localConstellation.floatingSosReserveBottom : 12);

  const openLanguageSheet = useCallback(() => {
    setLanguageSheetOpen(true);
  }, []);

  const openSafetyAssist = useCallback(() => {
    homeCommand?.triggerSafetyAssist();
  }, [homeCommand]);

  const openAccountHub = useCallback(() => {
    if (homeCommand) {
      homeCommand.openAccount();
      return;
    }
    navigation.navigate('PersonalHub');
  }, [homeCommand, navigation]);

  useLocalWebShellCompensation();

  const insets = useSafeAreaInsets();
  const desktopWeb = Platform.OS === 'web' && width > 768;
  const canvasBackdropOpacity = desktopWeb
    ? localConstellation.canvasBackdropOpacityDesktop
    : localConstellation.canvasBackdropOpacityMobile;
  const canvasBackdropTopBleed = desktopWeb
    ? Math.min(insets.top, localConstellation.canvasBackdropTopBleed)
    : 0;
  const useCompactCommandLogo = width > 0 && width < 1060;
  const backdropScale = localConstellation.canvasBackdropTextureScale;
  const backdropInset = (1 - backdropScale) * 50;
  const backdropTop = backdropInset - localConstellation.canvasBackdropRisePercent;
  const backdropFocusY = localConstellation.canvasBackdropFocusYPercent;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View
        pointerEvents="none"
        style={[
          styles.canvasBackdropHost,
          { opacity: canvasBackdropOpacity, top: -canvasBackdropTopBleed },
        ]}
      >
        <Image
          source={LOCAL_GLOBAL_BG}
          resizeMode="cover"
          style={[
            styles.canvasBackdrop,
            {
              width: `${backdropScale * 100}%`,
              height: `${backdropScale * 100}%`,
              left: `${backdropInset}%`,
              top: `${backdropTop}%`,
            },
            Platform.OS === 'web'
              ? ({ objectPosition: `center ${backdropFocusY}%` } as ImageStyle)
              : null,
          ]}
          accessibilityIgnoresInvertColors
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.canvasBackdropVeil,
          { opacity: localConstellation.canvasBackdropVeilOpacity, top: -canvasBackdropTopBleed },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          localConstellation.canvasGlowEmerald,
          localConstellation.canvasGlowMid,
          localConstellation.canvasGlowCyan,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.canvasGlow, { top: -canvasBackdropTopBleed }]}
      />
      <View
        style={styles.root}
        nativeID="local-hub-root"
        {...(Platform.OS === 'web' ? ({ id: 'local-hub-root' } as const) : {})}
      >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPad,
            paddingBottom: bottomPadClearance,
            paddingTop: desktopWeb ? 8 : 10,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.contentRail, { width: innerWidth, maxWidth: '100%' }]}>
          <View style={styles.commandRailRow}>
            <View style={styles.commandRailLeft}>
              <VionaBrandLockup variant={useCompactCommandLogo ? 'compact' : 'header'} />
              <View style={styles.commandRailDivider} />
              <View style={styles.commandRailCopy}>
                <Text style={styles.commandCaption}>{t('localHub.hubRailCaption')}</Text>
              </View>
            </View>
            <View style={styles.commandRailRight}>
              <LocalCommandPill
                label={t('localHub.railLanguage')}
                icon="globe-outline"
                onPress={openLanguageSheet}
                a11yLabel={t('smartTrio.switcher.title')}
                accent="cyan"
              />
              <LocalCommandPill
                label={t('localHub.railSos')}
                icon="shield-outline"
                onPress={openSafetyAssist}
                a11yLabel={t('localHub.railSosA11y')}
                accent="risk"
              />
              <LocalCommandPill
                label={t('localHub.railAccount')}
                icon="person-circle-outline"
                onPress={openAccountHub}
                a11yLabel={t('localHub.railAccountA11y')}
                accent="gold"
              />
            </View>
          </View>

        <LocalConstellationFrame
          accent="emerald"
          tier="hero"
          radius={18}
          style={styles.heroIntroCard}
          contentStyle={styles.heroIntroInner}
        >
          <Text style={styles.hubKicker}>{t('localHub.universeKicker')}</Text>
          <Text style={styles.heroHeadline}>{t('localHub.heroHeadline')}</Text>
          <Text style={styles.hubSub} numberOfLines={3}>
            {t('localHub.heroSub')}
          </Text>
          <View style={styles.heroChipRow}>
            <Text style={styles.heroChip}>{t('localCommerce.bookingStatus.lite')}</Text>
            <Text style={styles.heroChip}>{t('localCommerce.bookingStatus.pilot')}</Text>
            <Text style={styles.heroChip}>{t('localCommerce.bookingStatus.requestOnly')}</Text>
          </View>
        </LocalConstellationFrame>

        <LocalCommerceClarityBlock
          onBrowseServices={openServiceHub}
          onRequestBookingAssist={() => openLeonaPrefill(t('localCommerce.leonaBookingAssistPrefill'))}
          onMerchantSetup={() => navigation.navigate('B2BPaywall')}
          onAiReceptionistPilotInfo={onAiReceptionistPilotInfo}
        />

        <Text style={styles.bentoSectionTitle}>{t('localHub.serviceCategoriesKicker')}</Text>
        <View style={styles.cardGrid}>
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="emerald"
            icon="sparkles-outline"
            label={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.nailsTitle')}
            subtitle={t('localHub.nailsSub')}
            onPress={openServiceHub}
            a11yLabel="Nails và Spa"
          />
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="cyan"
            icon="restaurant-outline"
            label={t('localCommerce.bookingStatus.requestOnly')}
            title={t('localHub.restaurantTitle')}
            subtitle={t('localHub.restaurantSub')}
            onPress={() => openLeonaPrefill(t('localCommerce.leonaRestaurantPrefill'))}
            a11yLabel={t('localHub.restaurantTitle')}
          />
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="gold"
            icon="briefcase-outline"
            label={t('localCommerce.bookingStatus.pilot')}
            title={t('localHub.b2bTitle')}
            subtitle={t('localHub.b2bSub')}
            onPress={() => navigation.navigate('B2BPaywall')}
            a11yLabel={t('localCommerce.a11y.merchantB2bHub')}
          />
        </View>

        <Text style={styles.bentoSectionTitle}>{t('localHub.universeGridKicker')}</Text>
        <View style={styles.cardGrid}>
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="emerald"
            icon="scale-outline"
            label={t('localCommerce.bookingStatus.demo')}
            title={t('localHub.legalWealthTitle')}
            subtitle={t('localHub.legalWealthSub')}
            onPress={() => void runUltraMasterBookingWithAlerts(t('localHub.legalWealthTitle'))}
            a11yLabel={t('localHub.legalWealthTitle')}
          />
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="cyan"
            icon="car-outline"
            label={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.transitTitle')}
            subtitle={t('localHub.transitSub')}
            onPress={() => openLeonaPrefill(t('localHub.transitLeonaPrefill'))}
            a11yLabel={t('localHub.transitTitle')}
          />
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="emerald"
            icon="ticket-outline"
            label={t('localCommerce.bookingStatus.preview')}
            title={t('localHub.eventsTitle')}
            subtitle={t('localHub.eventsSub')}
            onPress={() => navigation.navigate('DailyReward')}
            a11yLabel={t('localHub.eventsTitle')}
          />
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="emerald"
            icon="pricetags-outline"
            label={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.classifiedsTitle')}
            subtitle={t('localHub.classifiedsRowSub', { unit: getVioCreditsLabel() })}
            onPress={() => void scrollToClassifieds()}
            a11yLabel={t('localHub.classifiedsTitle')}
          />
          <LocalDestinationCard
            cardWidth={cardWidth}
            accent="violet"
            icon="sparkles-outline"
            label={t('localCommerce.bookingStatus.pilot')}
            title={t('localCommerce.cta.aiReceptionistPilot')}
            subtitle={t('localHub.aiPilotCardSub')}
            onPress={onAiReceptionistPilotInfo}
            a11yLabel={t('localCommerce.cta.aiReceptionistPilot')}
          />
          {showVietnamInboundHub ? (
            <LocalDestinationCard
              cardWidth={cardWidth}
              accent="cyan"
              icon="earth-outline"
              label={t('localCommerce.bookingStatus.preview')}
              title={t('localHub.vnBannerTitle')}
              subtitle={t('localHub.vnBannerSub')}
              onPress={() => navigation.navigate('VietnamHub')}
              a11yLabel="Vietnam inbound hub"
            />
          ) : null}
          {legalScanEnabled ? (
            <LocalDestinationCard
              cardWidth={cardWidth}
              accent="cyan"
              icon="scan-outline"
              label={t('localCommerce.bookingStatus.demo')}
              title={t('localHub.legalScannerLabel')}
              subtitle={t('localHub.legalScannerSub')}
              onPress={() => void onLegalScannerPress()}
              a11yLabel={t('localHub.legalScannerA11y')}
              disabled={legalScanBusy}
            />
          ) : null}
        </View>

        <View
          onLayout={(e) => {
            setClassifiedsY(e.nativeEvent.layout.y);
          }}
          style={styles.classifiedsAnchor}
        >
          <View style={styles.classifiedsHeaderRow}>
            <View style={styles.classifiedsHeaderCopy}>
              <Text style={styles.classifiedsKicker}>{t('localHub.classifiedsKicker')}</Text>
              <Text style={styles.sectionTitle}>{t('localHub.classifiedsTitle')}</Text>
            </View>
            <Text style={styles.walletHint}>{formatVioCredits(wallet.credits)}</Text>
          </View>

          <Pressable style={styles.postBtn} onPress={() => setComposerVisible(true)}>
            <Ionicons name="add-circle-outline" size={18} color={localConstellation.canvas} />
            <Text style={styles.postBtnText}>{t('localHub.postNewListing')}</Text>
          </Pressable>

          <View style={styles.cardGrid}>
            {sortedPosts.map((item) => (
              <LocalClassifiedCard key={item.id} cardWidth={classifiedCardWidth} item={item} />
            ))}
          </View>
        </View>
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
            <TextInput value={title} onChangeText={setTitle} placeholder="Tiêu đề" placeholderTextColor="rgba(226,232,240,0.42)" style={styles.input} />
            <TextInput value={city} onChangeText={setCity} placeholder="Thành phố" placeholderTextColor="rgba(226,232,240,0.42)" style={styles.input} />
            <TextInput
              value={priceLabel}
              onChangeText={setPriceLabel}
              placeholder="Giá / mức lương"
              placeholderTextColor="rgba(226,232,240,0.42)"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết"
              placeholderTextColor="rgba(226,232,240,0.42)"
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

      <SmartTrioLanguageSheet visible={languageSheetOpen} onClose={() => setLanguageSheetOpen(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, position: 'relative', overflow: 'hidden' },
  root: { flex: 1, position: 'relative', zIndex: 1, backgroundColor: 'transparent' },
  canvasBackdropHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  canvasBackdrop: {
    position: 'absolute',
    ...(Platform.OS === 'web'
      ? ({ objectFit: 'cover', imageRendering: '-webkit-optimize-contrast' } as ImageStyle)
      : {}),
  },
  canvasBackdropVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: localConstellation.canvasVeil,
    zIndex: 0,
  },
  canvasGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.14,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  commandRailRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  commandRailLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commandRailDivider: {
    width: 1,
    alignSelf: 'stretch',
    minHeight: 34,
    backgroundColor: FASHION_HOME_LINE_GOLD_SOFT,
  },
  commandRailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: 'center',
  },
  commandRailRight: {
    flexShrink: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: 420,
  },
  commandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  commandPillPressed: { opacity: 0.88 },
  commandPillLabel: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: 0.2,
  },
  commandPillLabelRisk: {
    color: RISK,
  },
  commandSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  commandCaption: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: CYAN,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  heroIntroCard: {
    marginBottom: theme.spacing.sm,
  },
  heroIntroInner: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    gap: 6,
  },
  hubKicker: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: EMERALD,
  },
  heroHeadline: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: FontFamily.extrabold,
    color: INK_STRONG,
    letterSpacing: -0.2,
  },
  hubSub: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
  },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  heroChip: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    color: INK,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: localConstellation.border,
    overflow: 'hidden',
  },
  content: { alignItems: 'center' },
  contentRail: { alignSelf: 'center' },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: localConstellation.gridGap,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  gridCardPressable: { width: '100%' },
  gridCardInteractive:
    Platform.OS === 'web'
      ? ({
          transitionProperty: 'transform, opacity',
          transitionDuration: `${localConstellation.cardHoverTransitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {},
  gridCardHovered:
    Platform.OS === 'web'
      ? ({
          transform: [
            { translateY: -localConstellation.cardHoverLiftPx },
            { scale: localConstellation.cardHoverScale },
          ],
        } as ViewStyle)
      : {},
  gridCardPressed: { opacity: 0.9 },
  destinationCard: {
    minHeight: 148,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridCardStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  gridCardStatusText: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  gridCardFooter: { marginTop: 'auto', alignItems: 'flex-end' },
  gridCardCta: { fontSize: 16, fontFamily: FontFamily.extrabold },
  destinationTitle: { fontSize: 13, fontFamily: FontFamily.extrabold, color: INK_STRONG, lineHeight: 17 },
  destinationSub: { fontSize: 11, fontFamily: FontFamily.medium, color: INK_CARD_SUB, lineHeight: 15 },
  heroIconChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoSectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: INK_MUTED,
    marginBottom: 8,
  },
  classifiedsAnchor: { marginTop: 4 },
  classifiedsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  classifiedsHeaderCopy: { flex: 1, minWidth: 0, gap: 2 },
  classifiedsKicker: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: INK_MUTED,
  },
  sectionTitle: { fontSize: 17, fontFamily: FontFamily.extrabold, color: INK },
  walletHint: { fontSize: 12, fontFamily: FontFamily.bold, color: GOLD },
  postBtn: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  postBtnText: { color: localConstellation.canvas, fontFamily: FontFamily.bold, fontSize: 14 },
  postCard: {
    padding: theme.spacing.md,
    gap: 8,
    minHeight: 148,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER,
  },
  categoryChipText: { fontSize: 11, color: EMERALD, fontFamily: FontFamily.semibold },
  vipBadge: { fontSize: 11, color: GOLD, fontFamily: FontFamily.extrabold },
  postTitle: { fontSize: 15, color: INK, fontFamily: FontFamily.bold },
  postMeta: { fontSize: 12, color: CYAN, fontFamily: FontFamily.semibold },
  postDesc: { fontSize: 12, color: INK_MUTED, fontFamily: FontFamily.medium, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
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
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtnActive: { borderColor: GOLD, backgroundColor: localConstellation.glowGold },
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
    backgroundColor: localConstellation.surfaceMuted,
  },
  inputMultiline: { minHeight: 86, textAlignVertical: 'top', paddingTop: 10 },
  vipToggle: {
    minHeight: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: BORDER,
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
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cancelBtnText: { fontSize: 13, color: INK_MUTED, fontFamily: FontFamily.semibold },
  submitBtn: {
    minHeight: 40,
    minWidth: 110,
    borderRadius: theme.radius.md,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  submitBtnText: { fontSize: 13, color: localConstellation.canvas, fontFamily: FontFamily.bold },
});
