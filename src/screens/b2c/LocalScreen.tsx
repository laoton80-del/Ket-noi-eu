import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
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
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getDemoBookingPayload } from '../../config/demoRestBooking';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { formatVioCredits, getVioCreditsLabel } from '../../core/monetization/vioDisplayLabels';
import type { RootStackParamList } from '../../navigation/routes';
import { MAIN_TAB } from '../../navigation/routes';
import { previewLegalScanCostVig, scanLegalDocument } from '../../services/aiService';
import { confirmSecurityDepositThen } from '../../services/bookingEscrowUi';
import { formatNetworkFailureMessage, getRestApiJwt, isRestApiConfigured } from '../../services/apiClient';
import { createBooking } from '../../services/bookingService';
import { runUltraMasterBookingWithAlerts } from '../../services/ultraMasterBookingFlow';
import { reserveAndCommitCredits, useWalletState } from '../../state/wallet';
import { useTranslation } from '../../i18n';
import { useHomeCommand } from '../../context/HomeCommandContext';
import { useFullscreenMode } from '../../hooks/useFullscreenMode';
import { useVionaHomeDaylightBoost } from '../../components/viona/useVionaHomeDaylightBoost';
import { LocalCommerceClarityBlock } from '../../components/localCommerce/LocalCommerceClarityBlock';
import { LocalAppTile } from '../../components/local/LocalAppTile';
import { LocalConstellationFrame } from '../../components/local/LocalConstellationFrame';
import { VionaBrandLockup } from '../../components/viona/VionaBrandLockup';
import { VIONA_TABLET_MIN_WIDTH } from '../../components/viona/VionaMiniAppShell';
import { vionaTokens } from '../../design';
import {
  FASHION_HOME_COMMAND_RAIL_GRADIENT,
  FASHION_HOME_COMMAND_RAIL_HIGHLIGHT,
  FASHION_HOME_LINE_GOLD_SOFT,
  fashionHomeWebCommandUtilityHoverStyle,
  fashionHomeWebCommandUtilityPressStyle,
} from '../../components/viona/fashionHomeDesktopShell';
import { SmartTrioLanguageSheet } from '../../components/smartTrio/SmartTrioLanguageSheet';
import {
  localAccentInk,
  localAccentInkHover,
  localAccentStatusFill,
  localAccentStroke,
  localAccentStrokeHover,
  localConstellation,
  resolveLocalContentRail,
  resolveLocalGridColumns,
  resolveLocalGridItemWidth,
  localWebRailPillGlassStyle,
  type LocalConstellationAccent,
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
const INK = localConstellation.ink;
const INK_STRONG = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const BORDER = localConstellation.border;
const GOLD = localConstellation.accentGold;
const EMERALD = localConstellation.accentEmerald;
const CYAN = localConstellation.accentCyan;
const RISK = localConstellation.risk;
const LOCAL_LEGACY_HIDE_STYLE_ID = 'viona-local-legacy-hide';

type LocalShellPressableState = { pressed: boolean; hovered?: boolean };

function LocalShellUtilityBtn({
  icon,
  label,
  onPress,
  a11yLabel,
  iconColor = vionaTokens.fashionTech.champagne,
  compact = false,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  a11yLabel: string;
  iconColor?: string;
  compact?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      style={(s) => {
        const { pressed, hovered } = s as LocalShellPressableState;
        return [
          styles.shellUtilBtn,
          compact && styles.shellUtilBtnCompact,
          Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, false),
          Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
          pressed && styles.shellUtilBtnPressed,
        ];
      }}
    >
      <Ionicons name={icon} size={compact ? 15 : 16} color={iconColor} />
      <Text style={styles.shellUtilLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function LocalConnectedUniverseLink({
  icon,
  label,
  onPress,
  a11yLabel,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  a11yLabel: string;
}>) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.connectedLink,
        Platform.OS === 'web' ? localWebRailPillGlassStyle('cyan', hovered) : { borderColor: BORDER, borderWidth: 1 },
        pressed && { opacity: 0.88 },
      ]}
    >
      <Ionicons name={icon} size={15} color={CYAN} />
      <Text style={styles.connectedLinkText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={INK_MUTED} />
    </Pressable>
  );
}

function LocalMiniappDock({
  onBack,
  onHome,
  onLocalHub,
  bottomOffset,
}: Readonly<{
  onBack: () => void;
  onHome: () => void;
  onLocalHub: () => void;
  bottomOffset: number;
}>) {
  const { t } = useTranslation();
  return (
    <View pointerEvents="box-none" style={[styles.miniappDockHost, { bottom: bottomOffset }]}>
      <View style={styles.miniappDock}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('localHub.miniappDockBack')}
          onPress={onBack}
          style={({ pressed }) => [styles.miniappDockBtn, pressed && styles.shellUtilBtnPressed]}
        >
          <Ionicons name="arrow-back" size={16} color={INK} />
          <Text style={styles.miniappDockBtnText}>{t('localHub.miniappDockBack')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('localHub.miniappDockHome')}
          onPress={onHome}
          style={({ pressed }) => [styles.miniappDockBtn, pressed && styles.shellUtilBtnPressed]}
        >
          <Ionicons name="home-outline" size={16} color={EMERALD} />
          <Text style={styles.miniappDockBtnText}>{t('localHub.miniappDockHome')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('localHub.miniappDockLocal')}
          onPress={onLocalHub}
          style={({ pressed }) => [styles.miniappDockBtn, styles.miniappDockBtnActive, pressed && styles.shellUtilBtnPressed]}
        >
          <Ionicons name="location-outline" size={16} color={EMERALD} />
          <Text style={[styles.miniappDockBtnText, styles.miniappDockBtnTextActive]}>{t('localHub.miniappDockLocal')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
                  shadowOpacity: hovered ? 0.2 : 0.08,
                  shadowRadius: hovered ? 4 : 2,
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
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<Nav>();
  const { openMiniApp } = useMiniAppEntry();
  const wallet = useWalletState();
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const legalScanEnabled = featureFlags.legalScanEnabled;
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

  const [daylightBoost, setDaylightBoost] = useVionaHomeDaylightBoost();
  const { isWeb: isWebFullscreen, isSupported: isFullscreenSupported, isFullscreen, toggleFullscreen } =
    useFullscreenMode();
  const desktopWeb = Platform.OS === 'web' && width > 768;
  const fullscreenControl =
    desktopWeb && isWebFullscreen && isFullscreenSupported
      ? {
          isActive: isFullscreen,
          onPress: toggleFullscreen,
          label: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
          a11y: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
        }
      : undefined;
  const daylightToggleLabel = daylightBoost
    ? i18n.language?.startsWith('vi')
      ? 'Tắt đèn'
      : 'Night'
    : i18n.language?.startsWith('vi')
      ? 'Bật đèn'
      : 'Daylight';

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
          Alert.alert(t('localHub.vipPostFailTitle'), t('localHub.vipPostFailBody'));
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
      Alert.alert(
        t('localHub.vipPostSuccessTitle'),
        vipEnabled ? t('localHub.vipPostSuccessVipBody') : t('localHub.vipPostSuccessNormalBody')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const { horizontalPad, innerWidth } = resolveLocalContentRail(width);
  const gridColumns = resolveLocalGridColumns(width);
  const cardWidth = resolveLocalGridItemWidth(innerWidth, gridColumns);
  const classifiedColumns = resolveLocalGridColumns(width, {
    desktop: 3,
    tablet: 2,
    phone: 1,
    tabletMin: 600,
  });
  const classifiedCardWidth = resolveLocalGridItemWidth(innerWidth, classifiedColumns);

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

  const walletChipLabel = useMemo(() => {
    const n = wallet.credits;
    const useCompact = width < 400;
    return useCompact ? t('home.walletChipCompact', { amount: n }) : t('home.walletChipFull', { amount: n });
  }, [t, wallet.credits, width]);

  const goHome = useCallback(() => {
    openMiniApp('hub', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home }));
  }, [navigation, openMiniApp]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    goHome();
  }, [goHome, navigation]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const openTravelUniverse = useCallback(() => {
    if (!featureFlags.travelLiteEnabled) return;
    openMiniApp('travel', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.travel }));
  }, [featureFlags.travelLiteEnabled, navigation, openMiniApp]);

  const openAcademyUniverse = useCallback(() => {
    if (!featureFlags.academyLiteEnabled) return;
    openMiniApp('academy', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai }));
  }, [featureFlags.academyLiteEnabled, navigation, openMiniApp]);

  const openBusinessUniverse = useCallback(() => {
    openMiniApp('merchantDashboard', () => navigation.navigate('MerchantDashboard'));
  }, [navigation, openMiniApp]);

  useLocalWebShellCompensation();

  const insets = useSafeAreaInsets();
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
  const miniappDockBottom = localConstellation.miniappDockBottomOffset + insets.bottom;
  const bottomPadClearance =
    miniappDockBottom +
    localConstellation.miniappDockHeight +
    localConstellation.tabBarClearanceBottom +
    Math.max(insets.bottom, 12) +
    20;

  const tabletFullWidth = Platform.OS === 'web' && width >= VIONA_TABLET_MIN_WIDTH;
  const tabletBreakoutStyle = useMemo((): StyleProp<ViewStyle> | null => {
    if (!tabletFullWidth) return null;
    return {
      width: '100vw',
      maxWidth: '100vw',
      alignSelf: 'center',
      marginLeft: 'calc(50% - 50vw)',
      marginRight: 'calc(50% - 50vw)',
    } as unknown as ViewStyle;
  }, [tabletFullWidth, width]);

  return (
    <SafeAreaView style={[styles.container, tabletBreakoutStyle]} edges={['left', 'right']}>
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
        style={[styles.canvasGlow, { top: -canvasBackdropTopBleed, opacity: 0.1 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.contentFieldVeil, { top: -canvasBackdropTopBleed }]}
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
          <View style={styles.shellRailWrap}>
            <LinearGradient
              colors={FASHION_HOME_COMMAND_RAIL_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shellRail}
            >
              <View style={[styles.shellRailHighlight, { backgroundColor: FASHION_HOME_COMMAND_RAIL_HIGHLIGHT }]} />
              <View style={styles.shellRailRow}>
                <View style={styles.shellRailBrand}>
                  <VionaBrandLockup variant={useCompactCommandLogo ? 'compact' : 'header'} />
                  <View style={styles.commandRailDivider} />
                  <Text style={styles.commandCaption} numberOfLines={1}>
                    {t('localHub.hubRailCaption')}
                  </Text>
                </View>
                <View style={styles.shellUtilityTrack}>
                  {homeCommand?.showRolePicker ? (
                    <LocalShellUtilityBtn
                      icon="shuffle-outline"
                      label={t('shell.utility.switchRole')}
                      onPress={() => homeCommand.openRolePicker()}
                      a11yLabel={t('shell.utility.switchRole')}
                      compact={useCompactCommandLogo}
                    />
                  ) : null}
                  <LocalShellUtilityBtn
                    icon="globe-outline"
                    label={t('shell.utility.language')}
                    onPress={openLanguageSheet}
                    a11yLabel={t('smartTrio.switcher.title')}
                    compact={useCompactCommandLogo}
                  />
                  {Platform.OS === 'web' ? (
                    <LocalShellUtilityBtn
                      icon={daylightBoost ? 'moon-outline' : 'sunny-outline'}
                      label={daylightToggleLabel}
                      onPress={() => setDaylightBoost((v) => !v)}
                      a11yLabel={daylightToggleLabel}
                      compact={useCompactCommandLogo}
                    />
                  ) : null}
                  {fullscreenControl ? (
                    <LocalShellUtilityBtn
                      icon={fullscreenControl.isActive ? 'contract-outline' : 'expand-outline'}
                      label={fullscreenControl.label}
                      onPress={fullscreenControl.onPress}
                      a11yLabel={fullscreenControl.a11y}
                      compact={useCompactCommandLogo}
                    />
                  ) : null}
                  <LocalShellUtilityBtn
                    icon="wallet-outline"
                    label={walletChipLabel}
                    onPress={() => navigation.navigate('PersonalHub')}
                    a11yLabel={walletChipLabel}
                    iconColor={GOLD}
                    compact={useCompactCommandLogo}
                  />
                  <LocalShellUtilityBtn
                    icon="shield-outline"
                    label={t('shell.utility.safetyAssist')}
                    onPress={openSafetyAssist}
                    a11yLabel={t('localHub.railSosA11y')}
                    iconColor={RISK}
                    compact={useCompactCommandLogo}
                  />
                  <LocalShellUtilityBtn
                    icon="person-circle-outline"
                    label={t('shell.utility.accountProfile')}
                    onPress={openAccountHub}
                    a11yLabel={t('localHub.railAccountA11y')}
                    compact={useCompactCommandLogo}
                  />
                </View>
              </View>
            </LinearGradient>
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
        />

        <Text style={styles.bentoSectionTitle}>{t('localHub.serviceCategoriesKicker')}</Text>
        <View style={styles.cardGrid}>
          <LocalAppTile
            cardWidth={cardWidth}
            accent="emerald"
            icon="sparkles-outline"
            statusLabel={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.nailsTitle')}
            subtitle={t('localHub.nailsSub')}
            onPress={openServiceHub}
            accessibilityLabel="Nails và Spa"
            testID="local-tile-nails"
          />
          <LocalAppTile
            cardWidth={cardWidth}
            accent="cyan"
            icon="restaurant-outline"
            statusLabel={t('localCommerce.bookingStatus.requestOnly')}
            title={t('localHub.restaurantTitle')}
            subtitle={t('localHub.restaurantSub')}
            onPress={() => openLeonaPrefill(t('localCommerce.leonaRestaurantPrefill'))}
            accessibilityLabel={t('localHub.restaurantTitle')}
            testID="local-tile-restaurant"
          />
        </View>

        <Text style={styles.bentoSectionTitle}>{t('localHub.localServicesKicker')}</Text>
        <View style={styles.cardGrid}>
          <LocalAppTile
            cardWidth={cardWidth}
            accent="emerald"
            icon="scale-outline"
            statusLabel={t('localCommerce.bookingStatus.demo')}
            title={t('localHub.legalWealthTitle')}
            subtitle={t('localHub.legalWealthSub')}
            onPress={() => void runUltraMasterBookingWithAlerts(t('localHub.legalWealthTitle'))}
            accessibilityLabel={t('localHub.legalWealthTitle')}
            testID="local-tile-legal-wealth"
          />
          <LocalAppTile
            cardWidth={cardWidth}
            accent="cyan"
            icon="car-outline"
            statusLabel={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.transitTitle')}
            subtitle={t('localHub.transitSub')}
            onPress={() => openLeonaPrefill(t('localHub.transitLeonaPrefill'))}
            accessibilityLabel={t('localHub.transitTitle')}
            testID="local-tile-transit"
          />
          <LocalAppTile
            cardWidth={cardWidth}
            accent="emerald"
            icon="ticket-outline"
            statusLabel={t('localCommerce.bookingStatus.preview')}
            title={t('localHub.eventsTitle')}
            subtitle={t('localHub.eventsSub')}
            onPress={() => navigation.navigate('DailyReward')}
            accessibilityLabel={t('localHub.eventsTitle')}
            testID="local-tile-events"
          />
          <LocalAppTile
            cardWidth={cardWidth}
            accent="emerald"
            icon="home-outline"
            statusLabel={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.classifiedsHousingTitle')}
            subtitle={t('localHub.classifiedsHousingSub')}
            onPress={() => void scrollToClassifieds()}
            accessibilityLabel={t('localHub.classifiedsHousingTitle')}
            testID="local-tile-housing"
          />
          <LocalAppTile
            cardWidth={cardWidth}
            accent="emerald"
            icon="pricetags-outline"
            statusLabel={t('localCommerce.bookingStatus.lite')}
            title={t('localHub.classifiedsTitle')}
            subtitle={t('localHub.classifiedsRowSub', { unit: getVioCreditsLabel() })}
            onPress={() => void scrollToClassifieds()}
            accessibilityLabel={t('localHub.classifiedsTitle')}
            testID="local-tile-classifieds"
          />
          {legalScanEnabled ? (
            <LocalAppTile
              cardWidth={cardWidth}
              accent="cyan"
              icon="scan-outline"
              statusLabel={t('localCommerce.bookingStatus.demo')}
              title={t('localHub.legalScannerLabel')}
              subtitle={t('localHub.legalScannerSub')}
              onPress={() => void onLegalScannerPress()}
              accessibilityLabel={t('localHub.legalScannerA11y')}
              disabled={legalScanBusy}
              testID="local-tile-legal-scanner"
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
            <Ionicons name="add-circle-outline" size={18} color={GOLD} />
            <Text style={styles.postBtnText}>{t('localHub.postNewListing')}</Text>
          </Pressable>

          <View style={styles.cardGrid}>
            {sortedPosts.map((item) => (
              <LocalClassifiedCard key={item.id} cardWidth={classifiedCardWidth} item={item} />
            ))}
          </View>
        </View>

        <Text style={styles.bentoSectionTitle}>{t('localHub.connectedUniversesKicker')}</Text>
        <View style={styles.connectedStrip}>
          {featureFlags.travelLiteEnabled ? (
            <LocalConnectedUniverseLink
              icon="airplane-outline"
              label={t('localHub.connectedTravel')}
              onPress={openTravelUniverse}
              a11yLabel={t('localHub.connectedTravel')}
            />
          ) : null}
          <LocalConnectedUniverseLink
            icon="briefcase-outline"
            label={t('localHub.connectedBusiness')}
            onPress={openBusinessUniverse}
            a11yLabel={t('localHub.connectedBusiness')}
          />
          {featureFlags.academyLiteEnabled ? (
            <LocalConnectedUniverseLink
              icon="school-outline"
              label={t('localHub.connectedAcademy')}
              onPress={openAcademyUniverse}
              a11yLabel={t('localHub.connectedAcademy')}
            />
          ) : null}
        </View>
        </View>
      </ScrollView>

      <LocalMiniappDock
        onBack={goBack}
        onHome={goHome}
        onLocalHub={scrollToTop}
        bottomOffset={miniappDockBottom}
      />

      <Modal visible={composerVisible} transparent animationType="none" onRequestClose={() => setComposerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Reanimated.View style={[styles.modalCardWrap, modalAnimatedStyle]}>
            <LocalConstellationFrame accent="emerald" tier="utility" radius={theme.radius.lg} contentStyle={styles.modalCard}>
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
              <Text style={styles.vipToggleText}>
                {t('localHub.vipToggleLabel', { amount: formatVioCredits(VIP_POSTING_COST_VIG) })}
              </Text>
            </Pressable>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setComposerVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </Pressable>
              <Pressable onPress={() => void submitPost()} style={styles.submitBtn} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color={INK} /> : <Text style={styles.submitBtnText}>Đăng tin</Text>}
              </Pressable>
            </View>
            </LocalConstellationFrame>
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
    opacity: 0.1,
  },
  contentFieldVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: localConstellation.contentFieldVeil,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  shellRailWrap: {
    width: '100%',
    marginBottom: 10,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  shellRail: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  shellRailHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    zIndex: 2,
  },
  shellRailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 48,
  },
  shellRailBrand: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shellUtilityTrack: {
    flexShrink: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    maxWidth: '72%',
  },
  shellUtilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(10, 14, 22, 0.35)',
  },
  shellUtilBtnCompact: {
    minHeight: 28,
    paddingHorizontal: 7,
  },
  shellUtilBtnPressed: { opacity: 0.88 },
  shellUtilLabel: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: 0.15,
    maxWidth: 88,
  },
  miniappDockHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 8,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  miniappDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(8, 14, 26, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.28)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 1px rgba(72, 210, 165, 0.12), 0 0 8px rgba(72, 210, 165, 0.08)' } as ViewStyle)
      : {}),
  },
  miniappDockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: 'rgba(10, 14, 22, 0.45)',
  },
  miniappDockBtnActive: {
    borderColor: 'rgba(72, 210, 165, 0.42)',
    backgroundColor: 'rgba(72, 210, 165, 0.1)',
  },
  miniappDockBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: INK_MUTED,
  },
  miniappDockBtnTextActive: {
    color: EMERALD,
  },
  connectedStrip: {
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  connectedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(10, 14, 22, 0.42)',
  },
  connectedLinkText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: INK,
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
    color: EMERALD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(72, 210, 165, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.28)',
    overflow: 'hidden',
  },
  content: { alignItems: 'center' },
  contentRail: {
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(5, 11, 20, 0.22)',
    paddingVertical: 4,
  },
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
    backgroundColor: 'rgba(228, 192, 110, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(228, 192, 110, 0.42)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  postBtnText: { color: GOLD, fontFamily: FontFamily.bold, fontSize: 14 },
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
  modalCardWrap: {
    width: '100%',
  },
  modalCard: {
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
    backgroundColor: 'rgba(72, 210, 165, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  submitBtnText: { fontSize: 13, color: EMERALD, fontFamily: FontFamily.bold },
});
