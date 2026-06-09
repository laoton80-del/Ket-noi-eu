import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState, type ReactElement } from 'react';
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
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { getDemoBookingPayload } from '../../config/demoRestBooking';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { formatVioCredits } from '../../core/monetization/vioDisplayLabels';
import type { RootStackParamList, RootTabParamList } from '../../navigation/routes';
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
import { VionaBottomEscapeBar } from '../../components/viona/VionaBottomEscapeBar';
import { LocalConnectedUniverseLinks } from '../../components/viona/local/LocalConnectedUniverseLinks';
import { LocalClassifiedsFeaturedPreview } from '../../components/viona/local/LocalClassifiedsFeaturedPreview';
import { LocalMerchantToolsSection } from '../../components/viona/local/LocalMerchantToolsSection';
import { LocalOpeningStageLayout } from '../../components/viona/local/LocalOpeningStageLayout';
import { PremiumAppShell, PremiumHubLayout } from '../../components/viona';
import { VionaBrandLockup } from '../../components/viona/VionaBrandLockup';
import { VIONA_TABLET_MIN_WIDTH } from '../../components/viona/VionaMiniAppShell';
import { vionaTokens } from '../../design';
import {
  premiumLuminousInk,
  premiumModalGlass,
  premiumTileGlass,
  premiumTileLayout,
  premiumTileWebBackdropBlur,
  premiumUniverseAccentSpec,
  premiumUniverseStroke,
} from '../../design/premiumTileVisualTokens';
import {
  FASHION_HOME_COMMAND_RAIL_GRADIENT,
  FASHION_HOME_COMMAND_RAIL_HIGHLIGHT,
  FASHION_HOME_LINE_GOLD_SOFT,
  fashionHomeWebCommandUtilityHoverStyle,
  fashionHomeWebCommandUtilityPressStyle,
  hubResponsiveContentShellStyle,
  hubTabletPortraitWebBreakoutStyle,
  HUB_WEB_TABLET_FULL_BLEED_MIN_WIDTH_PX,
  useHubWebShellCompensation,
} from '../../components/viona/fashionHomeDesktopShell';
import { SmartTrioLanguageSheet } from '../../components/smartTrio/SmartTrioLanguageSheet';
import { VionaSosHoldGateModal } from '../../components/viona/VionaSosHoldGateModal';
import { VionaSosPlusInfoModal } from '../../components/viona/VionaSosPlusInfoModal';
import { SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED } from '../../config/sosPlusSurface';
import { SOS_PLUS_PROFILE_UI_ENABLED } from '../../config/sosPlusProduction';
import { localConstellation } from '../../components/local/localConstellationTokens';
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
/**
 * Local-only Premium Glass shell canvas.
 * A deep, premium ambient stage — deep navy easing into emerald-black — that reads brighter
 * than the legacy near-black cyber-night (`localConstellation.canvas` = #050B14) without
 * collapsing into a flat teal wash. A warm golden-hour radial glow lifts only the hero/top
 * band, and a very subtle emerald/cyan network keeps the field alive while the dark-glass
 * hero/cards remain the visual focus. Theme-invariant by design.
 */
const LOCAL_PREMIUM_CANVAS = '#0A1622';
const LOCAL_PREMIUM_SKY_TOP = '#11222C';
const LOCAL_PREMIUM_SKY_BOTTOM = '#06130F';
const LOCAL_PREMIUM_WARM_GLOW = 'rgba(255, 210, 156, 0.10)';
const LOCAL_PREMIUM_WARM_GLOW_SOFT = 'rgba(255, 210, 156, 0.03)';
const LOCAL_PREMIUM_AURORA_EMERALD = 'rgba(72, 210, 165, 0.06)';
const LOCAL_PREMIUM_AURORA_CYAN = 'rgba(98, 206, 255, 0.045)';
const INK = localConstellation.ink;
const INK_MUTED = localConstellation.inkMuted;
const BORDER = localConstellation.border;
const GOLD = localConstellation.accentGold;
const EMERALD = localConstellation.accentEmerald;
const CYAN = localConstellation.accentCyan;
const RISK = localConstellation.risk;
const LOCAL_LEGACY_HIDE_STYLE_ID = 'viona-local-legacy-hide';

/**
 * Fully hides the shared bottom tab bar while the Local hub is focused. The Local main page
 * already exposes universe handoff via "Vũ trụ liên kết" plus compact Back/Home controls, so the
 * 4-item bottom tab bar (Hub / Local / Travel Lite / Academy Lite) is redundant here. Applied only
 * on focus and reverted on blur, so Hub / Travel / Academy tabs keep their bar untouched.
 */
const LOCAL_HIDDEN_TAB_BAR_STYLE = {
  display: 'none' as const,
  height: 0,
  opacity: 0,
  borderTopWidth: 0,
  pointerEvents: 'none' as const,
};

const LOCAL_STATUS_FLOW_STEPS = [
  'localHub.statusFlow.sent',
  'localHub.statusFlow.await',
  'localHub.statusFlow.confirm',
] as const;

type LocalShellPressableState = { pressed: boolean; hovered?: boolean };

/**
 * Compact request-flow strip — a single light line (Request sent → Await reply → Confirm
 * later) plus a tiny no-payment note. Intentionally low visual weight so it does not compete
 * with the hero, flagship cards, or classifieds. No fake booking/payment success.
 */
function LocalHubCompactStatusGuide(): ReactElement {
  const { t } = useTranslation();
  return (
    <View style={styles.statusStrip} testID="local-compact-status-guide">
      <View style={styles.statusStripFlow}>
        {LOCAL_STATUS_FLOW_STEPS.map((key, idx) => (
          <View key={key} style={styles.statusStripStep}>
            {idx > 0 ? (
              <Ionicons
                name="arrow-forward"
                size={11}
                color="rgba(148, 210, 255, 0.7)"
                style={styles.statusStripArrow}
                accessibilityIgnoresInvertColors
              />
            ) : null}
            <Text style={styles.statusStripStepText} numberOfLines={1}>
              {t(key)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.statusStripNote} numberOfLines={1}>
        {t('localHub.statusFlow.note')}
      </Text>
    </View>
  );
}

function LocalShellUtilityBtn({
  icon,
  label,
  onPress,
  a11yLabel,
  iconColor = vionaTokens.fashionTech.champagne,
  compact = false,
  iconOnly = false,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  a11yLabel: string;
  iconColor?: string;
  compact?: boolean;
  iconOnly?: boolean;
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
          iconOnly && styles.shellUtilBtnIconOnly,
          Platform.OS === 'web' && fashionHomeWebCommandUtilityHoverStyle(!!hovered, false),
          Platform.OS === 'web' && fashionHomeWebCommandUtilityPressStyle(!!pressed),
          pressed && styles.shellUtilBtnPressed,
        ];
      }}
    >
      <Ionicons name={icon} size={compact || iconOnly ? 15 : 16} color={iconColor} />
      {iconOnly ? null : (
        <Text style={styles.shellUtilLabel} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Local-only Premium Glass backdrop.
 * Sits ABOVE the shared shell's opaque night canvas/veils and BELOW the Local content,
 * re-tinting the page to a deep premium stage (deep navy → emerald-black) with a warm
 * golden-hour glow confined to the hero/top band and a very subtle emerald/cyan aurora.
 * Web uses fixed positioning so the wash stays put while scrolling; native falls back to an
 * absolute fill. Theme-invariant.
 */
function LocalPremiumShellBackdrop(): ReactElement {
  const isWeb = Platform.OS === 'web';
  return (
    <View pointerEvents="none" style={styles.premiumBackdrop}>
      <LinearGradient
        colors={[LOCAL_PREMIUM_SKY_TOP, LOCAL_PREMIUM_CANVAS, LOCAL_PREMIUM_SKY_BOTTOM]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.premiumLayerFill}
      />
      {isWeb ? (
        <View style={styles.premiumWarmGlowWeb} />
      ) : (
        <LinearGradient
          colors={[LOCAL_PREMIUM_WARM_GLOW, LOCAL_PREMIUM_WARM_GLOW_SOFT, 'rgba(255, 210, 156, 0)']}
          locations={[0, 0.26, 0.58]}
          start={{ x: 0.72, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.premiumLayerFill}
        />
      )}
      <LinearGradient
        colors={[LOCAL_PREMIUM_AURORA_EMERALD, 'rgba(0, 0, 0, 0)', LOCAL_PREMIUM_AURORA_CYAN]}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 1, y: 0.95 }}
        style={styles.premiumLayerFill}
      />
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
      const widenedShellHosts = new Set<HTMLElement>();
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
          html[data-viona-local-hub="true"],
          body[data-viona-local-hub="true"] {
            background-color: ${LOCAL_PREMIUM_CANVAS} !important;
            overflow-x: hidden !important;
          }
          body[data-viona-local-hub="true"] [data-viona-local-legacy-chrome="true"] {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      };

      const applyWebPageCanvas = () => {
        document.documentElement.dataset.vionaLocalHub = 'true';
        document.body.dataset.vionaLocalHub = 'true';
      document.documentElement.style.backgroundColor = LOCAL_PREMIUM_CANVAS;
      document.body.style.backgroundColor = LOCAL_PREMIUM_CANVAS;
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';
      };

      const widenNarrowAppShellAncestors = () => {
        const root = localRoot();
        if (!root) return;
        const viewportWidth = window.innerWidth || 0;
        if (viewportWidth < HUB_WEB_TABLET_FULL_BLEED_MIN_WIDTH_PX) return;
        let current: HTMLElement | null = root.parentElement;
        while (current && current !== document.body) {
          const maxWidth = window.getComputedStyle(current).maxWidth;
          const maxWidthPx = Number.parseFloat(maxWidth);
          if (
            maxWidth === '600px' ||
            (!Number.isNaN(maxWidthPx) && maxWidthPx > 0 && maxWidthPx <= 600)
          ) {
            if (!widenedShellHosts.has(current)) {
              widenedShellHosts.add(current);
              current.dataset.vionaLocalShellMaxWidthPrev = current.style.maxWidth;
              current.dataset.vionaLocalShellWidthPrev = current.style.width;
            }
            current.style.maxWidth = '100%';
            current.style.width = '100%';
          }
          current = current.parentElement;
        }
      };

      ensureLegacyHideStyle();
      applyWebPageCanvas();
      widenNarrowAppShellAncestors();
      resetSceneTopPadding();
      scanLegacyChrome();
      const t1 = window.setTimeout(() => {
        widenNarrowAppShellAncestors();
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 250);
      const t2 = window.setTimeout(() => {
        widenNarrowAppShellAncestors();
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 1200);
      const t3 = window.setTimeout(() => {
        widenNarrowAppShellAncestors();
        resetSceneTopPadding();
        scanLegacyChrome();
      }, 3000);
      const observer = new MutationObserver(() => {
        widenNarrowAppShellAncestors();
        resetSceneTopPadding();
        scanLegacyChrome();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'style', 'class'] });

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        observer.disconnect();
        delete document.documentElement.dataset.vionaLocalHub;
        delete document.body.dataset.vionaLocalHub;
        document.documentElement.style.removeProperty('background-color');
        document.body.style.removeProperty('background-color');
        document.documentElement.style.removeProperty('overflow-x');
        document.body.style.removeProperty('overflow-x');
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
        widenedShellHosts.forEach((host) => {
          host.style.maxWidth = host.dataset.vionaLocalShellMaxWidthPrev ?? '';
          host.style.width = host.dataset.vionaLocalShellWidthPrev ?? '';
          delete host.dataset.vionaLocalShellMaxWidthPrev;
          delete host.dataset.vionaLocalShellWidthPrev;
        });
        widenedShellHosts.clear();
      };
    }, [t])
  );
}

const CATEGORY_META: Readonly<Record<ClassifiedCategory, { title: string }>> = {
  hiring: { title: 'Tuyen tho' },
  shop_transfer: { title: 'Sang tiem' },
  housing: { title: 'Thue nha' },
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
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<Nav>();
  // Same underlying navigation object as `navigation`, but typed as the bottom-tab navigator so we
  // can toggle this screen's `tabBarStyle`. Used only to hide the redundant 4-item bottom nav while
  // Local is focused; no routes/handlers/behavior change.
  const tabBarNavigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
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
  const [sosHoldGateOpen, setSosHoldGateOpen] = useState(false);
  const [sosPlusInfoOpen, setSosPlusInfoOpen] = useState(false);
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

  const isLocalMobile = width > 0 && width < 480;
  const useIconOnlyShellUtilities = isLocalMobile;
  const isHubWide = width >= 768;
  const isShortLandscape = width > height && height > 0 && height < 500;
  const bookingAssistPrefill = t('localCommerce.leonaBookingAssistPrefill');
  const openLanguageSheet = useCallback(() => {
    setLanguageSheetOpen(true);
  }, []);

  // SOS entry parity with Home: open the shared hold-gate modal first (3s hold + safety
  // copy), then hand off to the same in-app SOS flow Home uses. Never auto-dial/dispatch.
  const openSafetyAssist = useCallback(() => {
    setSosPlusInfoOpen(false);
    setSosHoldGateOpen(true);
  }, []);

  const onSosHoldGateComplete = useCallback(() => {
    setSosHoldGateOpen(false);
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

  // Compact contextual nav (replaces the redundant bottom tab bar on Local). Home goes to the
  // existing Hub tab; Back uses native back, falling back to Home when there is nothing to pop.
  const goHome = useCallback(() => {
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home });
  }, [navigation]);

  const onBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home });
  }, [navigation]);

  // Hide the shared 4-item bottom nav only while Local is focused; restore on blur.
  useFocusEffect(
    useCallback(() => {
      tabBarNavigation.setOptions({ tabBarStyle: LOCAL_HIDDEN_TAB_BAR_STYLE });
      return () => {
        tabBarNavigation.setOptions({ tabBarStyle: undefined });
      };
    }, [tabBarNavigation])
  );

  useLocalWebShellCompensation();
  useHubWebShellCompensation('local-hub-root');

  const useCompactCommandLogo = width > 0 && width < 1060;

  const webTabletFullWidth = Platform.OS === 'web' && width >= VIONA_TABLET_MIN_WIDTH;
  const localResponsiveShellStyle = useMemo(
    () => hubResponsiveContentShellStyle(width, height),
    [width, height]
  );
  const localTabletPortraitBreakout = useMemo(
    () => hubTabletPortraitWebBreakoutStyle(width, height),
    [width, height]
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View
        style={[
          styles.root,
          webTabletFullWidth && styles.rootWebTabletFull,
          localTabletPortraitBreakout,
        ]}
        nativeID="local-hub-root"
        {...(Platform.OS === 'web' ? ({ id: 'local-hub-root' } as const) : {})}
      >
      <PremiumAppShell
        leadingAccent="emerald"
        scrollRef={scrollRef}
        withTabBarClearance
        bottomClearanceExtra={isLocalMobile ? 48 : isShortLandscape ? 36 : isHubWide ? 30 : 22}
        contentStyle={desktopWeb ? styles.contentRailHomeParity : undefined}
        testID="local-premium-shell"
      >
        <LocalPremiumShellBackdrop />
        <View style={[styles.premiumContentLift, localResponsiveShellStyle]}>
        <View style={styles.shellRailWrap}>
            <LinearGradient
              colors={FASHION_HOME_COMMAND_RAIL_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shellRail}
            >
              <View style={[styles.shellRailHighlight, { backgroundColor: FASHION_HOME_COMMAND_RAIL_HIGHLIGHT }]} />
              <View style={[styles.shellRailRow, isLocalMobile && styles.shellRailRowMobile]}>
                <View style={styles.shellRailBrand}>
                  <VionaBrandLockup variant={useCompactCommandLogo ? 'compact' : 'header'} />
                  {!isLocalMobile ? (
                    <>
                      <View style={styles.commandRailDivider} />
                      <Text style={styles.commandCaption} numberOfLines={1}>
                        {t('localHub.hubRailCaption')}
                      </Text>
                    </>
                  ) : null}
                </View>
                <View style={[styles.shellUtilityTrack, isLocalMobile && styles.shellUtilityTrackMobile]}>
                  {homeCommand?.showRolePicker ? (
                    <LocalShellUtilityBtn
                      icon="shuffle-outline"
                      label={t('shell.utility.switchRole')}
                      onPress={() => homeCommand.openRolePicker()}
                      a11yLabel={t('shell.utility.switchRole')}
                      compact={useCompactCommandLogo}
                      iconOnly={useIconOnlyShellUtilities}
                    />
                  ) : null}
                  <LocalShellUtilityBtn
                    icon="globe-outline"
                    label={t('shell.utility.language')}
                    onPress={openLanguageSheet}
                    a11yLabel={t('smartTrio.switcher.title')}
                    compact={useCompactCommandLogo}
                    iconOnly={useIconOnlyShellUtilities}
                  />
                  {fullscreenControl ? (
                    <LocalShellUtilityBtn
                      icon={fullscreenControl.isActive ? 'contract-outline' : 'expand-outline'}
                      label={fullscreenControl.label}
                      onPress={fullscreenControl.onPress}
                      a11yLabel={fullscreenControl.a11y}
                      compact={useCompactCommandLogo}
                      iconOnly={useIconOnlyShellUtilities}
                    />
                  ) : null}
                  <LocalShellUtilityBtn
                    icon="wallet-outline"
                    label={walletChipLabel}
                    onPress={() => navigation.navigate('PersonalHub')}
                    a11yLabel={walletChipLabel}
                    iconColor={GOLD}
                    compact={useCompactCommandLogo}
                    iconOnly={useIconOnlyShellUtilities}
                  />
                  <LocalShellUtilityBtn
                    icon="shield-outline"
                    label={t('shell.utility.safetyAssist')}
                    onPress={openSafetyAssist}
                    a11yLabel={t('localHub.railSosA11y')}
                    iconColor={RISK}
                    compact={useCompactCommandLogo}
                    iconOnly={useIconOnlyShellUtilities}
                  />
                  <LocalShellUtilityBtn
                    icon="person-circle-outline"
                    label={t('shell.utility.accountProfile')}
                    onPress={openAccountHub}
                    a11yLabel={t('localHub.railAccountA11y')}
                    compact={useCompactCommandLogo}
                    iconOnly={useIconOnlyShellUtilities}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

        <PremiumHubLayout
          testID="local-premium-hub"
          hero={
            <LocalOpeningStageLayout
              openingStageFullscreen={desktopWeb && isFullscreen}
              onBrowseServices={openServiceHub}
              onBookingAssist={() => openLeonaPrefill(bookingAssistPrefill)}
              onMyRequests={() => navigation.navigate('LocalUserRequestStatus')}
              onLegalWealth={() => void runUltraMasterBookingWithAlerts(t('localHub.legalWealthTitle'))}
              onRestaurants={() => openLeonaPrefill(t('localCommerce.leonaRestaurantPrefill'))}
              onTransit={() => openLeonaPrefill(t('localHub.transitLeonaPrefill'))}
              onRentals={() => void scrollToClassifieds()}
              onClassifieds={() => void scrollToClassifieds()}
              onNailsSpa={openServiceHub}
              onCommunityEvents={() => navigation.navigate('DailyReward')}
              onAiReceptionist={() => navigation.navigate('AiReceptionistDemoSimulator')}
              onLanguageAssist={openLanguageSheet}
            />
          }
        >
          <LocalHubCompactStatusGuide />

          <View
            onLayout={(e) => {
              setClassifiedsY(e.nativeEvent.layout.y);
            }}
            style={styles.classifiedsAnchor}
          >
            <LocalClassifiedsFeaturedPreview
              posts={sortedPosts}
              totalCount={sortedPosts.length}
              walletLabel={formatVioCredits(wallet.credits)}
              onCreateListing={() => setComposerVisible(true)}
              onViewAll={scrollToClassifieds}
            />
          </View>

          <View style={[styles.secondaryHubSection, styles.merchantToolsSection]}>
            <LocalMerchantToolsSection
              onMerchantHub={openBusinessUniverse}
              onBookingAssist={() => openLeonaPrefill(bookingAssistPrefill)}
              onAiReceptionist={() => navigation.navigate('AiReceptionistDemoSimulator')}
            />
          </View>

          <View style={[styles.secondaryHubSection, styles.connectedUniversesSection]}>
            <LocalConnectedUniverseLinks
              travelEnabled={featureFlags.travelLiteEnabled}
              academyEnabled={featureFlags.academyLiteEnabled}
              onTravel={openTravelUniverse}
              onBusiness={openBusinessUniverse}
              onAcademy={openAcademyUniverse}
            />
          </View>

          <VionaBottomEscapeBar
            showBack
            showHome
            onBack={onBackPress}
            onHome={goHome}
          />
          <View
            style={[
              styles.hubScrollTail,
              isLocalMobile && styles.hubScrollTailMobile,
              isShortLandscape && styles.hubScrollTailLandscape,
            ]}
          />
        </PremiumHubLayout>
        </View>
      </PremiumAppShell>

      <Modal visible={composerVisible} transparent animationType="none" onRequestClose={() => setComposerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Reanimated.View
            style={[
              styles.modalCardWrap,
              modalAnimatedStyle,
              premiumTileWebBackdropBlur(premiumTileGlass.backdropBlurDefault),
            ]}
          >
            <View
              style={[
                styles.modalCardLuminous,
                { borderColor: premiumUniverseStroke('emerald') },
              ]}
            >
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
            </View>
          </Reanimated.View>
        </View>
      </Modal>

      <SmartTrioLanguageSheet visible={languageSheetOpen} onClose={() => setLanguageSheetOpen(false)} />

      <VionaSosHoldGateModal
        visible={sosHoldGateOpen}
        onRequestClose={() => setSosHoldGateOpen(false)}
        onHoldComplete={onSosHoldGateComplete}
        variant="continueToAppSos"
        onOpenPlusInfo={
          SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED ? () => setSosPlusInfoOpen(true) : undefined
        }
      />
      {SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED ? (
        <VionaSosPlusInfoModal
          visible={sosPlusInfoOpen}
          onRequestClose={() => setSosPlusInfoOpen(false)}
          onPressOpenProfile={
            SOS_PLUS_PROFILE_UI_ENABLED
              ? () => {
                  setSosPlusInfoOpen(false);
                  navigation.navigate('SosPlusProfile');
                }
              : undefined
          }
        />
      ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LOCAL_PREMIUM_CANVAS, position: 'relative', overflow: 'hidden' },
  root: { flex: 1, position: 'relative', zIndex: 1, backgroundColor: 'transparent' },
  premiumBackdrop: {
    // One continuous canvas: the premium gradient must span the FULL scroll content (not just
    // the viewport) so it runs top-to-bottom with no mid-page seam. Web previously used
    // position:fixed, which only paints the first viewport in a full-page render — below the
    // fold the darker page canvas showed through, splitting the page into two bands around
    // "Local cho bạn". Absolute fill the scroll content; bleed the sides so it still reaches the
    // viewport edges when the content rail is narrower than the window (clipped by overflowX).
    zIndex: 0,
    ...(Platform.OS === 'web'
      ? ({ position: 'absolute', top: 0, bottom: 0, left: -40, right: -40 } as unknown as ViewStyle)
      : StyleSheet.absoluteFillObject),
  },
  premiumLayerFill: { ...StyleSheet.absoluteFillObject },
  // Warm golden-hour glow stays anchored to the hero/top band (fixed-height top strip) so it
  // does not wash down the now full-height backdrop.
  premiumWarmGlowWeb:
    Platform.OS === 'web'
      ? ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 760,
          backgroundImage:
            'radial-gradient(140% 150% at 74% -8%, rgba(255, 211, 156, 0.10) 0%, rgba(255, 211, 156, 0.035) 38%, rgba(255, 211, 156, 0) 70%)',
        } as unknown as ViewStyle)
      : {},
  premiumContentLift: { position: 'relative', zIndex: 1 },
  rootWebTabletFull: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    alignSelf: 'stretch',
    ...(Platform.OS === 'web' ? ({ overflowX: 'hidden' } as const) : {}),
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ overflowX: 'hidden' } as const) : {}),
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
  shellRailRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 0,
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
  shellUtilityTrackMobile: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    justifyContent: 'flex-start',
    gap: 5,
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
  shellUtilBtnIconOnly: {
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  shellUtilBtnPressed: { opacity: 0.88 },
  shellUtilLabel: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: 0.15,
    maxWidth: 88,
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
    color: premiumLuminousInk.subtitle,
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
    paddingVertical: 10,
    gap: 4,
  },
  heroIntroInnerMobile: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  hubKicker: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: EMERALD,
  },
  heroHeadline: {
    fontSize: 17,
    lineHeight: 21,
    fontFamily: FontFamily.extrabold,
    color: premiumLuminousInk.titleBright,
    letterSpacing: -0.15,
  },
  heroHeadlineMobile: {
    fontSize: 15,
    lineHeight: 19,
  },
  hubSub: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
  },
  hubSubMobile: {
    fontSize: 10,
    lineHeight: 14,
  },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  heroChipRowMobile: {
    gap: 4,
    marginTop: 4,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: premiumUniverseAccentSpec('emerald').statusFill,
    borderWidth: premiumTileGlass.edgeWidth,
    borderColor: premiumUniverseStroke('emerald'),
    overflow: 'hidden',
    minHeight: 32,
  },
  heroChipText: {
    flexShrink: 1,
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    color: EMERALD,
  },
  hubTrustLine: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitleMinimum,
    marginTop: 2,
  },
  heroActionRow: {
    width: '100%',
    gap: premiumTileLayout.gridGap,
    flexDirection: 'column',
  },
  heroActionRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
  },
  heroActionRowDesktop: {
    gap: 14,
  },
  heroActionCell: {
    width: '100%',
    minWidth: 0,
  },
  heroActionCellPrimaryWide: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '60%',
    maxWidth: '60%',
    minWidth: 0,
  },
  heroActionCellSecondaryWide: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '40%',
    maxWidth: '40%',
    minWidth: 0,
  },
  statusStrip: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.16)',
    backgroundColor: 'rgba(8, 14, 26, 0.32)',
  },
  statusStripFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap: 4,
  },
  statusStripStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusStripArrow: {
    marginHorizontal: 1,
  },
  statusStripStepText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: 'rgba(226, 240, 252, 0.9)',
    letterSpacing: 0.1,
  },
  statusStripNote: {
    flexShrink: 1,
    fontSize: 9.5,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitleMinimum,
    letterSpacing: 0.1,
  },
  exploreMoreWrap: {
    width: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
  exploreMoreText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(172, 192, 210, 0.72)',
  },
  secondaryHubSection: {
    // No whole-section opacity: dimming the entire subtree made the secondary cards read as
    // disabled. Hierarchy is now carried by the cards' own muted fill/border/title tokens.
    width: '100%',
  },
  capabilitiesSection: {
    marginTop: 6,
  },
  merchantToolsSection: {
    marginTop: 8,
  },
  connectedUniversesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(72, 210, 165, 0.14)',
  },
  hubScrollTail: {
    width: '100%',
    height: 16,
  },
  hubScrollTailMobile: {
    height: 28,
  },
  hubScrollTailLandscape: {
    height: 24,
  },
  safetyBridge: {
    marginBottom: 8,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  // Home-width parity (web desktop only): lift the PremiumAppShell content cap
  // (contentMaxWidthDesktop 1200 / Landscape 1080) so Local spans the full viewport
  // minus the same edge padding Home uses, instead of a narrower centered rail.
  // The shell already applies identical horizontalPad, so this matches Home's inset.
  contentRailHomeParity: {
    maxWidth: '100%',
  },
  contentRail: {
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(5, 11, 20, 0.22)',
    paddingVertical: 4,
    overflow: 'hidden',
  },
  contentRailMobile: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
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
  walletHint: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: premiumUniverseAccentSpec('gold').inkHover,
  },
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
  postBtnText: {
    color: premiumLuminousInk.titleBright,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
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
    backgroundColor: premiumModalGlass.backdrop,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCardWrap: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  modalCardLuminous: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: premiumTileGlass.edgeWidth,
    backgroundColor: premiumModalGlass.surface,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 17,
    color: premiumLuminousInk.titleBright,
    fontFamily: FontFamily.extrabold,
  },
  categoryRow: { flexDirection: 'row', gap: 6 },
  categoryBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: premiumModalGlass.optionBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 14, 26, 0.55)',
  },
  categoryBtnActive: {
    borderColor: premiumUniverseStroke('emerald'),
    backgroundColor: premiumUniverseAccentSpec('emerald').statusFill,
  },
  categoryBtnText: {
    fontSize: 11,
    color: premiumLuminousInk.subtitle,
    fontFamily: FontFamily.semibold,
  },
  categoryBtnTextActive: { color: premiumLuminousInk.titleBright },
  input: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: premiumModalGlass.optionBorder,
    paddingHorizontal: theme.spacing.md,
    color: premiumLuminousInk.titleBright,
    fontFamily: FontFamily.medium,
    backgroundColor: 'rgba(8, 14, 26, 0.62)',
  },
  inputMultiline: { minHeight: 86, textAlignVertical: 'top', paddingTop: 10 },
  vipToggle: {
    minHeight: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: premiumModalGlass.optionBorder,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(8, 14, 26, 0.5)',
  },
  vipToggleActive: { borderColor: premiumUniverseStroke('gold') },
  vipToggleText: {
    fontSize: 12,
    color: premiumLuminousInk.subtitle,
    fontFamily: FontFamily.semibold,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  cancelBtn: {
    minHeight: 40,
    minWidth: 84,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: premiumModalGlass.optionBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(8, 14, 26, 0.45)',
  },
  cancelBtnText: {
    fontSize: 13,
    color: premiumLuminousInk.subtitle,
    fontFamily: FontFamily.semibold,
  },
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
