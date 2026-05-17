import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { PersonaOnboardingModal } from '../components/PersonaOnboardingModal';
import { ProactiveSuggestions } from '../components/ProactiveSuggestions';
import { CharityWidget } from '../components/ui/CharityWidget';
import {
  VionaBrandLockup,
  VionaFashionHomeCommandBar,
  VionaFashionWorldCard,
  VionaGlassPanel,
  VionaInfoTile,
  VionaQuickActionPill,
  VionaSosHoldGateModal,
  VionaSosPlusInfoModal,
} from '../components/viona';
import {
  FASHION_HOME_DESKTOP_HERO_ASPECT,
  FASHION_HOME_DAYLIGHT_CANVAS,
  FASHION_HOME_DAYLIGHT_CANVAS_ELEVATED,
  FASHION_HOME_DAYLIGHT_CHIP_CONTAINED_GLOW,
  FASHION_HOME_DAYLIGHT_EYEBROW,
  FASHION_HOME_DAYLIGHT_FRAME_BORDER,
  FASHION_HOME_DAYLIGHT_FRAME_GLOW,
  FASHION_HOME_DAYLIGHT_HEADLINE,
  FASHION_HOME_DAYLIGHT_HERO_CYAN_EDGE,
  FASHION_HOME_DAYLIGHT_HERO_LIFT_OVERLAY,
  FASHION_HOME_DAYLIGHT_HERO_LUMINOUS,
  FASHION_HOME_DAYLIGHT_HERO_SCRIM_LEFT,
  FASHION_HOME_DAYLIGHT_HERO_VIGNETTE,
  FASHION_HOME_DAYLIGHT_SUBTITLE,
  FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
  FASHION_HOME_FRAME_BORDER,
  FASHION_HOME_FRAME_GLOW,
  FASHION_HOME_GLOW_GOLD,
  FASHION_HOME_INNER_HIGHLIGHT,
  FASHION_HOME_LINE_CYAN,
  FASHION_HOME_LINE_GOLD,
  FASHION_HOME_HERO_TOP_GLOW,
  FASHION_HOME_HERO_COMMAND_CLEARANCE_PX,
  FASHION_HOME_SCROLL_BOTTOM_BREATHING_EXTRA_PX,
  FASHION_HOME_WORLD_CARD_HERO_BREATHING_TOP_PX,
  FASHION_HOME_WORLD_CARD_STAGE_LAP_PX,
  FASHION_HOME_WEB_COMMAND_STAGE_BAR_RESERVE_COMFORT_PX,
  FASHION_HOME_WEB_COMMAND_STAGE_BAR_RESERVE_COMPACT_PX,
  FASHION_HOME_WEB_COMMAND_STAGE_HERO_CARD_HOOK_PX,
  FASHION_HOME_WEB_OPENING_STAGE_CARD_ROW_BOTTOM_CLEARANCE_PX,
  FASHION_HOME_WEB_OPENING_STAGE_CARD_ROW_LAP_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HUB_PULLUP_PX,
  FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_OVERLAP_INTO_HERO_PX,
  FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_ROW_BOTTOM_CLEARANCE_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HEIGHT_FUDGE_PX,
  computeFashionHomeWebOpeningStageLayout,
  FASHION_HOME_WEB_OPENING_STAGE_SCROLL_TOP_PAD_PX,
  FASHION_HOME_WEB_OPENING_STAGE_TALL_VIEWPORT_MIN_PX,
  FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX,
  fashionHomeWebOpeningStageCardCellStyle,
  fashionHomeWebOpeningStageCardGridStyle,
  fashionHomeWebOpeningStageConnectedChipStyle,
  fashionHomeWebOpeningStageDeepHeroBleedStyle,
  fashionHomeWebOpeningStageDeepHeroCanvasStyle,
  fashionHomeWebOpeningStageDeepHeroShellStyle,
  fashionHomeWebOpeningStageFullscreenGridColumnStyle,
  fashionHomeWebOpeningStageGridColumnStyle,
  fashionHomeWebOpeningStageHeroForegroundStyle,
  fashionHomeWebOpeningStageHeroFrameStyle,
  fashionHomeWebOpeningStageHeroImageClipStyle,
  fashionHomeWebOpeningStageHeroImageStyle,
  fashionHomeWebOpeningStageFullscreenHubPullUpPx,
  fashionHomeWebOpeningStageHubDockFullscreenStyle,
  fashionHomeWebOpeningStageHubPromptFullscreenStyle,
  fashionHomeWebOpeningStageQuickActionStripFullscreenStyle,
  fashionHomeWebOpeningStageSharedRailWrapperStyle,
  fashionHomeWebOpeningStageWorldStripBelowHeroStyle,
  FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL,
  FASHION_HOME_DAYLIGHT_WORLD_DIAGONAL_SPECULAR,
  FASHION_HOME_DAYLIGHT_WORLD_TOP_REFRACTION_BAND,
  FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL,
  FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TR,
  FASHION_HOME_DAYLIGHT_WORLD_HOVER_EDGE_SWEEP,
  FASHION_HOME_WORLD_CARD_GLASS_HOST_RADIUS,
  fashionHomeDaylightQuickActionIconCapsuleStyle,
  fashionHomeDaylightQuickActionPillStyle,
  fashionHomeDaylightQuickActionSheen,
  fashionHomeDaylightWorldCardNativeShellStyle,
  fashionHomeWebDaylightHeroImageLiftStyle,
  fashionHomeWebDaylightQuickActionInnerRimStyle,
  fashionHomeWebDaylightQuickActionPillMaterialStyle,
  fashionHomeWebDaylightWorldCardInnerRimStyle,
  fashionHomeWebDaylightWorldCardMaterialStyle,
  fashionHomeWebDaylightTransitionStyle,
  fashionHomeWebOpeningStageShellStyle,
  fashionHomeWebQuickActionHoverMotionStyle,
  fashionHomeWebWorldCardHostHoverMotionStyle,
  fashionHomeWorldCardGlassHostStyle,
  type FashionHomeQuickActionAccent,
  type FashionHomeWorldCardDaylightAccent,
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
  resolveFashionHomeDesktopLayout,
} from '../components/viona/fashionHomeDesktopShell';
import { useVionaHomeDaylightBoost } from '../components/viona/useVionaHomeDaylightBoost';
import { VionaCard } from '../components/viona/VionaCard';
import { VionaSectionHeader } from '../components/viona/VionaSectionHeader';
import { vionaTrust } from '../components/viona/vionaTrustTokens';
import {
  getConfiguredAdminDebugPin,
  isAdminDebugPinConfigured,
  isAdminDebugSurfaceEnabled,
} from '../config/adminDebugGate';
import { SOS_PLUS_PROFILE_UI_ENABLED } from '../config/sosPlusProduction';
import { SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED } from '../config/sosPlusSurface';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../hooks/useMiniAppEntry';
import { useHomeCommand } from '../context/HomeCommandContext';
import { getVioPointsLabel } from '../core/monetization/vioDisplayLabels';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import { MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG } from '../navigation/mvpSurfaceGate';
import {
  FASHION_HOME_WORLD_DESKTOP_ROW_MIN_WIDTH,
  FASHION_HOME_WORLD_CAROUSEL_MAX_WIDTH,
  FASHION_HOME_WORLD_ONE_COL_GRID_MAX_WIDTH,
  FASHION_HOME_WORLD_TWO_COL_MIN_WIDTH,
  isFashionHomeDesktopShell,
  readFocusedTabRouteFromRootState,
} from '../navigation/fashionHomeDesktopShell';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { vionaTokens } from '../design';
import { getRestApiJwt, isRestApiConfigured } from '../services/apiClient';
import { patchUserPersonaOnServer } from '../services/viGlobalUserPersonaApi';
import { fetchBalance } from '../services/viGlobalWalletApi';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { useFullscreenMode } from '../hooks/useFullscreenMode';
import { useTranslation } from '../i18n';
import { useUserStore } from '../store/userStore';
import { hasB2BWorkspaceAccess } from '../utils/b2bAccess';
import { localizedRegionName } from '../utils/localizedRegionName';
import { DashboardB2CScreen } from './b2c/DashboardB2CScreen';
import type { AuthUser } from '../context/authTypes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_HOME_HERO = require('../assets/viona/home/viona-hero-human-constellation-1280x428.png');
const IMG_HERO_DESKTOP_HUMAN = IMG_HOME_HERO;
const IMG_HERO_DESKTOP_LOCAL = require('../assets/viona/home/viona-hero-local-1280x428.png');
const IMG_HERO_DESKTOP_TRAVEL = require('../assets/viona/home/viona-hero-travel-1280x428.png');
const IMG_HERO_DESKTOP_ACADEMY = require('../assets/viona/home/viona-hero-academy-1280x428.png');
const IMG_HERO_DESKTOP_BUSINESS = require('../assets/viona/home/viona-hero-business-1280x428.png');

const IMG_HOME_LOCAL = require('../../assets/UI/viona-home-card-local-v1.png');
const IMG_HOME_TRAVEL = require('../../assets/UI/viona-home-card-travel-v1.png');
const IMG_HOME_ACADEMY = require('../../assets/UI/viona-home-card-academy-v1.png');
const IMG_HOME_BUSINESS = require('../../assets/UI/viona-home-card-business-v1.png');

type LivingHeroVisualKey = 'default' | 'local' | 'travel' | 'academy' | 'business';

const LIVING_HERO_VISUAL_ORDER: readonly LivingHeroVisualKey[] = [
  'default',
  'local',
  'travel',
  'academy',
  'business',
];

const LIVING_HERO_REVERT_MS = 900;
const LIVING_HERO_CROSSFADE_MS = 800;
const LIVING_HERO_AUTO_INTERVAL_MS = 12000;
/** Pause while hovering/focusing cards; disabled entirely when reduced-motion is on. */
const LIVING_HERO_AUTO_ROTATION_ENABLED = false;

const LIVING_HERO_DESKTOP_IMAGE: Readonly<Record<LivingHeroVisualKey, ImageSourcePropType>> = {
  default: IMG_HERO_DESKTOP_HUMAN,
  local: IMG_HERO_DESKTOP_LOCAL,
  travel: IMG_HERO_DESKTOP_TRAVEL,
  academy: IMG_HERO_DESKTOP_ACADEMY,
  business: IMG_HERO_DESKTOP_BUSINESS,
};

const LIVING_HERO_DESKTOP_COPY: Readonly<
  Record<LivingHeroVisualKey, Readonly<{ eyebrow: string; title: string; subtitle: string }>>
> = {
  default: {
    eyebrow: 'VIONA HUMAN CONSTELLATION',
    title: 'Your global companion, wherever life moves.',
    subtitle:
      'Local life, travel support, learning, and AI assistance — designed for Vietnamese people worldwide.',
  },
  local: {
    eyebrow: 'VIONA LOCAL',
    title: 'Find trusted support around where you live.',
    subtitle:
      'Local services, community connection, and daily life abroad — built for Vietnamese people worldwide.',
  },
  travel: {
    eyebrow: 'VIONA TRAVEL',
    title: 'Move across countries with confidence.',
    subtitle:
      'Direction, language support, and travel guidance before, during, and after the journey.',
  },
  academy: {
    eyebrow: 'VIONA ACADEMY',
    title: 'Learn, practice, and grow with AI.',
    subtitle:
      'Family learning, Vietnamese language support, and future skills in one calm space.',
  },
  business: {
    eyebrow: 'VIONA BUSINESS',
    title: 'Turn customer requests into growth.',
    subtitle:
      'AI receptionist, merchant tools, and service support for Vietnamese businesses.',
  },
};

/** Left band only â€” keeps center/right hero art bright; copy stays on the left rail. */
const DESKTOP_HERO_SCRIM_LEFT_COLORS = [
  'rgba(4, 7, 12, 0.45)',
  'rgba(4, 7, 12, 0.16)',
  'rgba(4, 7, 12, 0)',
] as const;
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;
/** World Stage â€” light canvas (aurora gradient applied in hero). */
const SCREEN_BG = vionaTokens.gradients.multiverseHero[0];
const CARD_BG = vionaTrust.surface;
const GOLD_ACCENT = vionaTrust.accentGold;
const GOLD_BORDER = vionaTrust.accentGoldLine;
const TEXT_PRIMARY = vionaTrust.ink;
const TEXT_MUTED = vionaTrust.inkMuted;

type BriefingCard = Readonly<{
  id: string;
  headline: string;
  sub: string;
}>;

/** Runtime auth snapshot may include server/extra keys merged into AsyncStorage JSON. */
type HomeAuthSnapshot = AuthUser & Record<string, unknown>;

function isLikelyPhoneOnlyName(s: string): boolean {
  const compact = s.replace(/\s/g, '');
  return /^\+?\d{8,}$/.test(compact);
}

function isPlaceholderRegionLabel(s: string): boolean {
  const lower = s.trim().toLowerCase();
  return lower === 'your region' || lower === 'khu vá»±c cá»§a báşˇn';
}

function pickRawDisplayNameForHome(user: AuthUser | null | undefined): { raw: string; field: string } | null {
  if (!user) return null;
  const u = user as HomeAuthSnapshot;
  const loose = u as Record<string, unknown>;
  const profile =
    u.profile && typeof u.profile === 'object' && u.profile !== null
      ? (u.profile as Record<string, unknown>)
      : undefined;
  const account =
    loose.account && typeof loose.account === 'object' && loose.account !== null
      ? (loose.account as Record<string, unknown>)
      : undefined;
  const candidates: readonly { field: string; value: unknown }[] = [
    { field: 'user.name', value: u.name },
    { field: 'user.firstName', value: u.firstName },
    { field: 'user.displayName', value: u.displayName },
    { field: 'user.fullName', value: u.fullName },
    { field: 'user.givenName', value: loose.givenName },
    { field: 'profile.firstName', value: profile?.firstName },
    { field: 'profile.name', value: profile?.name },
    { field: 'profile.displayName', value: profile?.displayName },
    { field: 'account.name', value: account?.name },
  ];
  for (const c of candidates) {
    if (typeof c.value === 'string' && c.value.trim().length > 0) {
      const trimmed = c.value.trim();
      if (isLikelyPhoneOnlyName(trimmed)) continue;
      return { raw: trimmed, field: c.field };
    }
  }
  return null;
}

function firstTokenFromPersonName(raw: string): string {
  return raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)[0] ?? '';
}

type HeaderHintPick = Readonly<{ raw: string; field: string }>;

/** ISO2 first; then freeform location/country label (length â‰Ą 3), never ZZ-only or placeholder. */
function pickLocationHeaderFromCandidates(
  candidates: readonly { field: string; value: unknown }[]
): HeaderHintPick | null {
  for (const c of candidates) {
    if (typeof c.value !== 'string') continue;
    const raw = c.value.trim();
    if (!raw) continue;
    if (normalizeCountryCodeOrSentinel(raw) !== 'ZZ') {
      return { raw, field: c.field };
    }
  }
  for (const c of candidates) {
    if (typeof c.value !== 'string') continue;
    const raw = c.value.trim();
    if (raw.length < 3) continue;
    if (/^zz$/i.test(raw)) continue;
    if (isPlaceholderRegionLabel(raw)) continue;
    if (isLikelyPhoneOnlyName(raw)) continue;
    return { raw, field: c.field };
  }
  return null;
}

function headerRegionDisplayLabel(raw: string, uiLanguage: string): string | null {
  const viaIntl = localizedRegionName(raw, uiLanguage);
  if (viaIntl != null && viaIntl.length > 0) return viaIntl;
  const trimmed = raw.trim();
  if (trimmed.length >= 3 && !/^zz$/i.test(trimmed) && !isPlaceholderRegionLabel(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Greeting-only: read persisted `authSession` JSON (same key as AuthContext), without changing
 * hydration rules or `AuthUser` shape.
 */
function coalesceDisplayNameWithFieldFromAuthSessionJson(parsed: Record<string, unknown>): HeaderHintPick | null {
  const pick = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const account = parsed.account;
  const accountName =
    account && typeof account === 'object' && account !== null && 'name' in account
      ? pick((account as { name?: unknown }).name)
      : '';
  const profile =
    parsed.profile && typeof parsed.profile === 'object' && parsed.profile !== null
      ? (parsed.profile as Record<string, unknown>)
      : undefined;
  const ordered: readonly { field: string; value: string }[] = [
    { field: 'authSession.json.name', value: pick(parsed.name) },
    { field: 'authSession.json.firstName', value: pick(parsed.firstName) },
    { field: 'authSession.json.displayName', value: pick(parsed.displayName) },
    { field: 'authSession.json.fullName', value: pick(parsed.fullName) },
    { field: 'authSession.json.givenName', value: pick(parsed.givenName) },
    { field: 'authSession.json.profile.firstName', value: profile ? pick(profile.firstName) : '' },
    { field: 'authSession.json.profile.name', value: profile ? pick(profile.name) : '' },
    { field: 'authSession.json.profile.displayName', value: profile ? pick(profile.displayName) : '' },
    { field: 'authSession.json.account.name', value: accountName },
  ];
  for (const o of ordered) {
    if (o.value.length > 0 && !isLikelyPhoneOnlyName(o.value)) return { raw: o.value, field: o.field };
  }
  return null;
}

function pickCountryWithFieldFromAuthSessionJson(parsed: Record<string, unknown>): HeaderHintPick | null {
  const profile =
    parsed.profile && typeof parsed.profile === 'object' && parsed.profile !== null
      ? (parsed.profile as Record<string, unknown>)
      : undefined;
  const candidates: readonly { field: string; value: unknown }[] = [
    { field: 'authSession.json.country', value: parsed.country },
    { field: 'authSession.json.countryCode', value: parsed.countryCode },
    { field: 'authSession.json.residenceCountry', value: parsed.residenceCountry },
    { field: 'authSession.json.profile.country', value: profile?.country },
    { field: 'authSession.json.market', value: parsed.market },
    { field: 'authSession.json.countryName', value: parsed.countryName },
    { field: 'authSession.json.location', value: parsed.location },
    { field: 'authSession.json.region', value: parsed.region },
    { field: 'authSession.json.profile.countryName', value: profile?.countryName },
    { field: 'authSession.json.profile.location', value: profile?.location },
  ];
  return pickLocationHeaderFromCandidates(candidates);
}

function pickRawCountryForHome(user: AuthUser | null | undefined): { raw: string; field: string } | null {
  if (!user) return null;
  const u = user as HomeAuthSnapshot;
  const loose = u as Record<string, unknown>;
  const profile =
    u.profile && typeof u.profile === 'object' && u.profile !== null
      ? (u.profile as Record<string, unknown>)
      : undefined;
  const candidates: readonly { field: string; value: unknown }[] = [
    { field: 'user.country', value: u.country },
    { field: 'user.countryCode', value: u.countryCode },
    { field: 'user.residenceCountry', value: u.residenceCountry },
    { field: 'profile.country', value: profile?.country },
    { field: 'user.market', value: u.market },
    { field: 'user.countryName', value: loose.countryName },
    { field: 'user.location', value: loose.location },
    { field: 'user.region', value: loose.region },
    { field: 'profile.countryName', value: profile?.countryName },
    { field: 'profile.location', value: profile?.location },
  ];
  return pickLocationHeaderFromCandidates(candidates);
}

/** Desktop Living Hero: fill the frame; focal bias keeps subject/city visible on wide assets. */
const heroDesktopLivingImageWebStyle = (
  Platform.OS === 'web'
    ? { objectFit: 'cover' as const, objectPosition: '40% 38%' as const }
    : {}
) as ImageStyle;
const heroImageWebCoverStyle = (Platform.OS === 'web' ? { objectFit: 'cover' as const } : {}) as ImageStyle;
/** Hero shell aspect tuned for desktop viewport fit; image still covers via resizeMode/object-fit. */
const DESKTOP_HERO_FRAME_ASPECT = FASHION_HOME_DESKTOP_HERO_ASPECT;

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { openMiniApp } = useMiniAppEntry();
  const navigation = useNavigation<Nav>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, setPendingRedirect, updateProfile } = useAuth();
  const isTourist = user?.persona === 'TOURIST';
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const [personaModalVisible, setPersonaModalVisible] = useState(false);
  const wallet = useWalletState();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const inboundPersonaName = getPersonaDisplayName('loan');
  const outboundPersonaName = getPersonaDisplayName('leona');
  const [clockTick, setClockTick] = useState(() => new Date());
  const [walletBalanceLoading, setWalletBalanceLoading] = useState(false);
  /** Home-only header hints from raw `authSession` JSON (does not alter AuthContext / hydration). */
  const [sessionHeaderHints, setSessionHeaderHints] = useState<{
    name: HeaderHintPick | null;
    country: HeaderHintPick | null;
  }>({ name: null, country: null });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.authSession);
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!cancelled) {
          setSessionHeaderHints({
            name: coalesceDisplayNameWithFieldFromAuthSessionJson(parsed),
            country: pickCountryWithFieldFromAuthSessionJson(parsed),
          });
        }
      } catch {
        if (!cancelled) setSessionHeaderHints({ name: null, country: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.country, user?.name, user?.phone]);

  useEffect(() => {
    if (!user) setPersonaModalVisible(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        if (!isRestApiConfigured()) return;
        const jwt = await getRestApiJwt();
        if (!jwt?.trim()) return;
        setWalletBalanceLoading(true);
        try {
          const r = await fetchBalance();
          if (!cancelled && !r.ok && __DEV__) {
            console.warn('[HomeScreen] REST wallet balance:', r.error);
          }
        } finally {
          if (!cancelled) setWalletBalanceLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.needsPersonaOnboarding === true) setPersonaModalVisible(true);
    }, [user?.needsPersonaOnboarding])
  );

  const applyPersonaChoice = useCallback(
    (persona: 'EXPAT' | 'TOURIST') => {
      void patchUserPersonaOnServer(persona);
      updateProfile({ persona, needsPersonaOnboarding: false });
      setPersonaModalVisible(false);
    },
    [updateProfile]
  );

  const localClock = useMemo(
    () => clockTick.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    [clockTick]
  );
  const vnClock = useMemo(
    () =>
      clockTick.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
    [clockTick]
  );

  const briefingCards = useMemo((): readonly BriefingCard[] => {
    const all: readonly BriefingCard[] = [
      {
        id: 'b1',
        headline: t('home.briefingB1h'),
        sub: t('home.briefingB1s'),
      },
      {
        id: 'b2',
        headline: t('home.briefingB2h'),
        sub: t('home.briefingB2s'),
      },
      {
        id: 'b3',
        headline: t('home.briefingB3h'),
        sub: t('home.briefingB3s'),
      },
      {
        id: 'b4',
        headline: t('home.briefingB4h'),
        sub: t('home.briefingB4s'),
      },
    ];
    if (isTourist) return all.filter((c) => c.id !== 'b1' && c.id !== 'b4');
    return all;
  }, [isTourist, t]);

  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const currentActiveRole = useUserStore((s) => s.currentActiveRole);
  const switchRole = useUserStore((s) => s.switchRole);
  const focusedTabRoute = useNavigationState(readFocusedTabRouteFromRootState);
  const fashionHomeDesktopShellActive = useMemo(
    () =>
      isFashionHomeDesktopShell({
        platform: Platform.OS,
        windowWidth: width,
        activeRole: currentActiveRole,
        focusedTabRoute,
      }),
    [currentActiveRole, focusedTabRoute, width]
  );

  const [daylightBoost, setDaylightBoost] = useVionaHomeDaylightBoost();
  const fashionDaylight = fashionHomeDesktopShellActive && daylightBoost;

  const isLandscapeViewport = width > height;
  const isShortViewport = height < 560;
  /** Horizontal rail only for very narrow widths; wider mobile uses 1- or 2-column grid. */
  const useWorldCardCarousel = width <= FASHION_HOME_WORLD_CAROUSEL_MAX_WIDTH;
  /** Four cards in one row: Fashion Home web shell, or wide non-fashion layout. */
  const worldCardsDesktopSingleRow =
    fashionHomeDesktopShellActive || width >= FASHION_HOME_WORLD_DESKTOP_ROW_MIN_WIDTH;
  /** One full-width card per row (narrow grid, no carousel). */
  const worldCardsOneColumnGrid =
    !useWorldCardCarousel &&
    !worldCardsDesktopSingleRow &&
    width <= FASHION_HOME_WORLD_ONE_COL_GRID_MAX_WIDTH;
  /** Equal card heights within each flex row (1-col, 2Ă—2, or 4Ă—1). */
  const stretchWorldCardsInGrid =
    !useWorldCardCarousel &&
    !worldCardsOneColumnGrid &&
    (worldCardsDesktopSingleRow || width >= FASHION_HOME_WORLD_TWO_COL_MIN_WIDTH);
  const worldCardsTwoColumnGrid =
    !useWorldCardCarousel && !worldCardsDesktopSingleRow && !worldCardsOneColumnGrid;
  const fashionCarouselCardWidth = useMemo(
    () => Math.min(292, Math.max(256, Math.round(Math.min(width, height) * 0.78))),
    [width, height]
  );
  const commandBarDensity = useMemo(() => {
    if (!fashionHomeDesktopShellActive) return 'comfortable' as const;
    if (width < 1180) return 'compact' as const;
    if (isLandscapeViewport && height < 520) return 'compact' as const;
    return 'comfortable' as const;
  }, [fashionHomeDesktopShellActive, width, height, isLandscapeViewport]);
  const ftVisualMinHeight = useMemo(() => {
    if (isLandscapeViewport) return Math.max(168, Math.min(240, Math.floor(height * 0.42)));
    if (isShortViewport) return Math.max(200, Math.min(260, Math.floor(height * 0.28)));
    return 280;
  }, [height, isLandscapeViewport, isShortViewport]);
  const ftHeroPaddingV = useMemo(() => {
    if (isLandscapeViewport) return vionaTokens.spacing[16];
    if (isShortViewport || width < 400) return vionaTokens.spacing[20];
    return vionaTokens.spacing[32];
  }, [isLandscapeViewport, isShortViewport, width]);
  const quickActionsHorizontal = width < 768;
  const quickActionsSingleRow = width >= 1400;
  const quickActionsGrid = !quickActionsHorizontal && !quickActionsSingleRow;

  useEffect(() => {
    const ms = fashionHomeDesktopShellActive ? 1000 : 30000;
    const id = setInterval(() => setClockTick(new Date()), ms);
    return () => clearInterval(id);
  }, [fashionHomeDesktopShellActive]);

  const fashionDesktopHeaderBlock = useMemo(() => {
    const h = clockTick.getHours();
    /** Late night 23:00â€“04:59; evening through 22:59. */
    const slot =
      h >= 23 || h < 5 ? 'lateNight' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    const namePick = pickRawDisplayNameForHome(user) ?? sessionHeaderHints.name;
    const first = namePick ? firstTokenFromPersonName(namePick.raw) : '';

    const line1 =
      slot === 'lateNight'
        ? first
          ? t('shell.header.greeting.lateNightNamed', { name: first })
          : t('shell.header.greeting.lateNightGeneric')
        : first
          ? t(`shell.header.greeting.${slot}Named`, { name: first })
          : t(`shell.header.greeting.${slot}Generic`);

    const wish = t(`shell.header.wish.${slot}`);

    const timeStr = new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(clockTick);

    const countryPick = pickRawCountryForHome(user) ?? sessionHeaderHints.country;
    const region = countryPick ? headerRegionDisplayLabel(countryPick.raw, i18n.language) : null;
    const timeLocation =
      region != null && region.length > 0
        ? t('shell.header.timeAtLocation', { time: timeStr, location: region })
        : t('shell.header.timeOnly', { time: timeStr });

    const a11y = `${line1} ${wish} ${t('shell.header.localTimeA11y')} ${timeLocation}`;

    return {
      line1,
      wish,
      timeLocation,
      a11y,
      /** One line: `12:26 Â· Czech Republic` (see `shell.header.timeAtLocation`); region omitted when unknown. */
      clockLine: timeLocation,
      regionLine: null,
    };
  }, [clockTick, i18n.language, sessionHeaderHints, t, user]);

  const heroCopyByVariant = useMemo(
    () => ({
      default: {
        eyebrow: LIVING_HERO_DESKTOP_COPY.default.eyebrow,
        title: LIVING_HERO_DESKTOP_COPY.default.title,
        subtitle: LIVING_HERO_DESKTOP_COPY.default.subtitle,
        image: IMG_HOME_HERO,
      },
      local: {
        eyebrow: LIVING_HERO_DESKTOP_COPY.local.eyebrow,
        title: LIVING_HERO_DESKTOP_COPY.local.title,
        subtitle: LIVING_HERO_DESKTOP_COPY.local.subtitle,
        image: IMG_HOME_LOCAL,
      },
      travel: {
        eyebrow: LIVING_HERO_DESKTOP_COPY.travel.eyebrow,
        title: LIVING_HERO_DESKTOP_COPY.travel.title,
        subtitle: LIVING_HERO_DESKTOP_COPY.travel.subtitle,
        image: IMG_HOME_TRAVEL,
      },
      academy: {
        eyebrow: LIVING_HERO_DESKTOP_COPY.academy.eyebrow,
        title: LIVING_HERO_DESKTOP_COPY.academy.title,
        subtitle: LIVING_HERO_DESKTOP_COPY.academy.subtitle,
        image: IMG_HOME_ACADEMY,
      },
      business: {
        eyebrow: LIVING_HERO_DESKTOP_COPY.business.eyebrow,
        title: LIVING_HERO_DESKTOP_COPY.business.title,
        subtitle: LIVING_HERO_DESKTOP_COPY.business.subtitle,
        image: IMG_HOME_BUSINESS,
      },
    }),
    []
  );
  const activeHero = heroCopyByVariant.default;

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const apply = (v: boolean) => {
      if (!cancelled) setReduceMotion(v);
    };
    const p = AccessibilityInfo.isReduceMotionEnabled?.();
    if (p && typeof (p as Promise<boolean>).then === 'function') {
      void (p as Promise<boolean>).then(apply).catch(() => {});
    }
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', apply);
    let mqRemove: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq) {
        apply(mq.matches);
        const handler = (e: MediaQueryListEvent) => apply(e.matches);
        mq.addEventListener('change', handler);
        mqRemove = () => mq.removeEventListener('change', handler);
      }
    }
    return () => {
      cancelled = true;
      sub?.remove?.();
      mqRemove?.();
    };
  }, []);

  /** Web Daylight: pointer-driven polish on world-card glass hosts (visual only). */
  const [webWorldCardHover, setWebWorldCardHover] = useState<FashionHomeWorldCardDaylightAccent | null>(null);
  /** GLASS.HOME.ROOT â€” visible viewport height on web (accounts for browser chrome). */
  const [webVisualViewportHeight, setWebVisualViewportHeight] = useState<number | null>(null);
  /** LAYOUT.HOME â€” measured command bar + world row (web opening stage). */
  const [webCommandBarHeight, setWebCommandBarHeight] = useState(0);
  /** Measured fashion shell chrome (padding + command bar) for cinematic stage height. */
  const [webFashionChromeHeight, setWebFashionChromeHeight] = useState(0);
  const [webWorldStripHeight, setWebWorldStripHeight] = useState(FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX);
  const [quickActionWebHoverId, setQuickActionWebHoverId] = useState<string | null>(null);

  const [livingBaseKey, setLivingBaseKey] = useState<LivingHeroVisualKey>('default');
  const [livingOverlayKey, setLivingOverlayKey] = useState<LivingHeroVisualKey | null>(null);
  const livingHeroOverlayOpacity = useRef(new Animated.Value(0)).current;
  const livingHeroCopyBlend = useRef(new Animated.Value(1)).current;
  const livingSettledKeyRef = useRef<LivingHeroVisualKey>('default');
  const livingOverlayKeyRef = useRef<LivingHeroVisualKey | null>(null);
  const livingHoverPinnedRef = useRef<LivingHeroVisualKey | null>(null);
  const livingRevertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livingAutoRotateIndexRef = useRef(0);
  const transitionLivingHeroRef = useRef<(next: LivingHeroVisualKey) => void>(() => {});

  useEffect(() => {
    return () => {
      if (livingRevertTimerRef.current != null) clearTimeout(livingRevertTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setWebVisualViewportHeight(null);
      return;
    }
    const apply = () => {
      const vv = window.visualViewport;
      setWebVisualViewportHeight(Math.round(vv?.height ?? window.innerHeight));
    };
    apply();
    window.visualViewport?.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    return () => {
      window.visualViewport?.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);

  useEffect(() => {
    if (fashionHomeDesktopShellActive) return;
    livingHeroOverlayOpacity.stopAnimation();
    livingHeroCopyBlend.stopAnimation();
    livingHoverPinnedRef.current = null;
    livingOverlayKeyRef.current = null;
    livingSettledKeyRef.current = 'default';
    livingAutoRotateIndexRef.current = 0;
    if (livingRevertTimerRef.current != null) {
      clearTimeout(livingRevertTimerRef.current);
      livingRevertTimerRef.current = null;
    }
    setLivingBaseKey('default');
    setLivingOverlayKey(null);
    livingHeroOverlayOpacity.setValue(0);
    livingHeroCopyBlend.setValue(1);
  }, [fashionHomeDesktopShellActive, livingHeroCopyBlend, livingHeroOverlayOpacity]);

  const flushLivingHeroOverlay = useCallback(() => {
    livingHeroOverlayOpacity.stopAnimation();
    livingHeroCopyBlend.stopAnimation();
    const ov = livingOverlayKeyRef.current;
    if (ov !== null) {
      livingSettledKeyRef.current = ov;
      setLivingBaseKey(ov);
      livingOverlayKeyRef.current = null;
      setLivingOverlayKey(null);
      livingHeroOverlayOpacity.setValue(0);
    }
  }, [livingHeroCopyBlend, livingHeroOverlayOpacity]);

  const transitionLivingHero = useCallback(
    (next: LivingHeroVisualKey) => {
      if (!fashionHomeDesktopShellActive) return;
      flushLivingHeroOverlay();

      /** GLASS.HOME.HARD â€” web: snap to global companion on revert (no 800ms crossfade â€śstuck Academyâ€ť). */
      if (Platform.OS === 'web' && next === 'default' && !reduceMotion) {
        livingHeroOverlayOpacity.stopAnimation();
        livingHeroCopyBlend.stopAnimation();
        livingHoverPinnedRef.current = null;
        livingSettledKeyRef.current = 'default';
        setLivingBaseKey('default');
        livingOverlayKeyRef.current = null;
        setLivingOverlayKey(null);
        livingHeroOverlayOpacity.setValue(0);
        livingHeroCopyBlend.setValue(1);
        return;
      }

      const from = livingSettledKeyRef.current;
      if (next === from) return;

      livingOverlayKeyRef.current = next;
      setLivingOverlayKey(next);
      livingHeroOverlayOpacity.setValue(0);

      if (reduceMotion) {
        livingSettledKeyRef.current = next;
        setLivingBaseKey(next);
        livingOverlayKeyRef.current = null;
        setLivingOverlayKey(null);
        livingHeroOverlayOpacity.setValue(0);
        livingHeroCopyBlend.setValue(1);
        return;
      }

      const cross = LIVING_HERO_CROSSFADE_MS;
      const dip = Math.floor(cross * 0.35);
      const lift = Math.ceil(cross * 0.65);

      Animated.parallel([
        Animated.timing(livingHeroOverlayOpacity, {
          toValue: 1,
          duration: cross,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(livingHeroCopyBlend, {
            toValue: 0.88,
            duration: dip,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(livingHeroCopyBlend, {
            toValue: 1,
            duration: lift,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (!finished) return;
        livingSettledKeyRef.current = next;
        setLivingBaseKey(next);
        livingOverlayKeyRef.current = null;
        setLivingOverlayKey(null);
        livingHeroOverlayOpacity.setValue(0);
        livingHeroCopyBlend.setValue(1);
      });
    },
    [fashionHomeDesktopShellActive, flushLivingHeroOverlay, reduceMotion, livingHeroCopyBlend, livingHeroOverlayOpacity]
  );

  const revertDesktopLivingHeroImmediately = useCallback(() => {
    if (!fashionHomeDesktopShellActive) return;
    if (livingRevertTimerRef.current != null) {
      clearTimeout(livingRevertTimerRef.current);
      livingRevertTimerRef.current = null;
    }
    livingHoverPinnedRef.current = null;
    transitionLivingHero('default');
  }, [fashionHomeDesktopShellActive, transitionLivingHero]);

  transitionLivingHeroRef.current = transitionLivingHero;

  useEffect(() => {
    if (
      !fashionHomeDesktopShellActive ||
      !LIVING_HERO_AUTO_ROTATION_ENABLED ||
      reduceMotion
    ) {
      return;
    }
    const id = setInterval(() => {
      if (livingHoverPinnedRef.current != null) return;
      livingAutoRotateIndexRef.current =
        (livingAutoRotateIndexRef.current + 1) % LIVING_HERO_VISUAL_ORDER.length;
      const next = LIVING_HERO_VISUAL_ORDER[livingAutoRotateIndexRef.current];
      transitionLivingHeroRef.current(next);
    }, LIVING_HERO_AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fashionHomeDesktopShellActive, reduceMotion]);

  const pinDesktopLivingHero = useCallback(
    (key: LivingHeroVisualKey) => {
      if (!fashionHomeDesktopShellActive || key === 'default') return;
      livingHoverPinnedRef.current = key;
      if (livingRevertTimerRef.current != null) {
        clearTimeout(livingRevertTimerRef.current);
        livingRevertTimerRef.current = null;
      }
      transitionLivingHero(key);
    },
    [fashionHomeDesktopShellActive, transitionLivingHero]
  );

  const scheduleDesktopLivingHeroRevert = useCallback(() => {
    if (!fashionHomeDesktopShellActive) return;
    if (livingRevertTimerRef.current != null) clearTimeout(livingRevertTimerRef.current);
    livingRevertTimerRef.current = setTimeout(() => {
      livingRevertTimerRef.current = null;
      livingHoverPinnedRef.current = null;
      livingAutoRotateIndexRef.current = 0;
      transitionLivingHero('default');
    }, LIVING_HERO_REVERT_MS);
  }, [fashionHomeDesktopShellActive, transitionLivingHero]);

  const desktopLivingCopyKey: LivingHeroVisualKey = livingOverlayKey ?? livingBaseKey;
  const desktopLivingCopy = LIVING_HERO_DESKTOP_COPY[desktopLivingCopyKey];

  const desktopCardLivingHoverProps = useMemo(() => {
    if (!fashionHomeDesktopShellActive) return null;
    /** GLASS.HOME.FINAL â€” web: pointer hover preview only (focus was sticking Academy hero after Tab / a11y). */
    const pointerOnly = Platform.OS === 'web';
    const mk = (key: LivingHeroVisualKey) =>
      pointerOnly
        ? {
            onHoverIn: () => pinDesktopLivingHero(key),
            onHoverOut: revertDesktopLivingHeroImmediately,
          }
        : {
            onHoverIn: () => pinDesktopLivingHero(key),
            onHoverOut: scheduleDesktopLivingHeroRevert,
            onFocus: () => pinDesktopLivingHero(key),
            onBlur: scheduleDesktopLivingHeroRevert,
          };
    return {
      local: mk('local'),
      travel: mk('travel'),
      academy: mk('academy'),
      business: mk('business'),
    } as const;
  }, [
    fashionHomeDesktopShellActive,
    pinDesktopLivingHero,
    revertDesktopLivingHeroImmediately,
    scheduleDesktopLivingHeroRevert,
  ]);

  /** GLASS.HOME.2C â€” snap living hero + hover chrome when Home regains focus (fixes stuck Academy desktop preview). */
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || !fashionHomeDesktopShellActive) return;
      if (livingRevertTimerRef.current != null) {
        clearTimeout(livingRevertTimerRef.current);
        livingRevertTimerRef.current = null;
      }
      livingHoverPinnedRef.current = null;
      setWebWorldCardHover(null);
      setQuickActionWebHoverId(null);
      livingHeroOverlayOpacity.stopAnimation();
      livingHeroCopyBlend.stopAnimation();
      livingOverlayKeyRef.current = null;
      livingSettledKeyRef.current = 'default';
      livingAutoRotateIndexRef.current = 0;
      setLivingOverlayKey(null);
      setLivingBaseKey('default');
      livingHeroOverlayOpacity.setValue(0);
      livingHeroCopyBlend.setValue(1);
    }, [fashionHomeDesktopShellActive, livingHeroCopyBlend, livingHeroOverlayOpacity])
  );

  const walletChipLabel = useMemo(() => {
    const n = wallet.credits;
    const useCompact = width < 400;
    return useCompact ? t('home.walletChipCompact', { amount: n }) : t('home.walletChipFull', { amount: n });
  }, [t, wallet.credits, width]);

  const layout = useMemo(() => {
    if (fashionHomeDesktopShellActive) {
      return resolveFashionHomeDesktopLayout(width);
    }
    const maxShell = width > 1280 ? 860 : 760;
    const shellWidth = Math.min(width, maxShell);
    const pad = theme.spacing.lg;
    const inner = shellWidth - pad * 2;
    return { shellWidth, pad, inner };
  }, [fashionHomeDesktopShellActive, width]);

  const scrollBottomPad = useMemo(() => {
    if (!isDesktopWeb) return 140;
    if (fashionHomeDesktopShellActive) {
      return Math.max(insets.bottom, 20) + 56 + FASHION_HOME_SCROLL_BOTTOM_BREATHING_EXTRA_PX;
    }
    return Math.max(insets.bottom, 16) + 48;
  }, [fashionHomeDesktopShellActive, isDesktopWeb, insets.bottom]);

  const creditPillMax = useMemo(() => Math.min(width * 0.9, 300), [width]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!isAdminDebugSurfaceEnabled()) {
          await AsyncStorage.removeItem(ADMIN_UNLOCK_KEY);
          setAdminUnlocked(false);
          return;
        }
        const raw = await AsyncStorage.getItem(ADMIN_UNLOCK_KEY);
        setAdminUnlocked(raw === '1');
      })();
    }, [])
  );

  const openProtected = useCallback(
    (target: 'Wallet' | 'AiEye' | 'LeonaCall' | 'Vault') => {
      if (target === 'AiEye' && !featureFlags.b2bAiReceptionistDemoEnabled) {
        Alert.alert('B2B AI Receptionist (demo)', MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG);
        return;
      }
      if (target === 'LeonaCall') {
        if (!user) {
          setPendingRedirect('LeonaCall');
          setShowPaywall(true);
          return;
        }
        openMiniApp('b2cAiCallAssistant', () => navigation.navigate('LeonaCall'));
        return;
      }
      if (!user) {
        setPendingRedirect(target);
        setShowPaywall(true);
        return;
      }
      navigation.navigate(target);
    },
    [
      featureFlags.b2bAiReceptionistDemoEnabled,
      navigation,
      openMiniApp,
      setPendingRedirect,
      user,
    ]
  );

  const openInterpreter = useCallback(() => {
    if (!user) {
      setPendingRedirect('LiveInterpreter');
      setShowPaywall(true);
      return;
    }
    openMiniApp('minhKhangTranslator', () =>
      navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' })
    );
  }, [navigation, openMiniApp, setPendingRedirect, user]);

  const goUniverseLocal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openMiniApp('local', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.local }));
  }, [navigation, openMiniApp]);

  const goUniverseTravel = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!featureFlags.travelEnabled) return;
    openMiniApp('travel', () => navigation.navigate('TravelCompanion'));
  }, [featureFlags.travelEnabled, navigation, openMiniApp]);

  const goUniverseAcademy = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openMiniApp('academy', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai }));
  }, [navigation, openMiniApp]);

  const goUniverseBusiness = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasB2BWorkspaceAccess(user)) {
      switchRole('B2B');
      navigation.navigate('Tabs', { screen: MAIN_TAB.B2B.merchant });
      return;
    }
    /** Merchant operating hub first (pilot preview); upgrade remains on `B2BPaywall`. */
    navigation.navigate('MerchantDashboard');
  }, [navigation, switchRole, user]);

  const homeCommand = useHomeCommand();
  const { isWeb: isWebFullscreen, isSupported: isFullscreenSupported, isFullscreen, toggleFullscreen } =
    useFullscreenMode();
  const fullscreenControl = useMemo(() => {
    if (!fashionHomeDesktopShellActive || !isWebFullscreen || !isFullscreenSupported) return undefined;
    return {
      isActive: isFullscreen,
      onPress: toggleFullscreen,
      accessibilityLabel: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
      label: isFullscreen ? t('shell.fullscreen.exit') : t('shell.fullscreen.enter'),
    };
  }, [
    fashionHomeDesktopShellActive,
    isFullscreen,
    isFullscreenSupported,
    isWebFullscreen,
    t,
    toggleFullscreen,
  ]);

  /**
   * HOME.OPENING.STAGE.ALIGNMENT.FINAL â€” shared grid, in-hero cards, tall/fullscreen hub peek budget.
   */
  const fashionDesktopWebHomeStageLayout = useMemo(() => {
    if (!fashionHomeDesktopShellActive || Platform.OS !== 'web') return null;
    const viewportH = webVisualViewportHeight ?? height;
    const shellTopPad = Math.max(insets.top, 8);
    const commandBarH =
      webCommandBarHeight > 0
        ? webCommandBarHeight
        : commandBarDensity === 'compact'
          ? FASHION_HOME_WEB_COMMAND_STAGE_BAR_RESERVE_COMPACT_PX
          : FASHION_HOME_WEB_COMMAND_STAGE_BAR_RESERVE_COMFORT_PX;
    const chromeAboveScroll =
      webFashionChromeHeight > 0 ? webFashionChromeHeight : shellTopPad + commandBarH;
    const opening = computeFashionHomeWebOpeningStageLayout({
      viewportHeightPx: viewportH,
      chromeAboveScrollPx: chromeAboveScroll,
      measuredCardRowPx: webWorldStripHeight,
      isFullscreen,
    });
    return {
      ...opening,
      contentPad: layout.pad,
      isTallViewport:
        viewportH >= FASHION_HOME_WEB_OPENING_STAGE_TALL_VIEWPORT_MIN_PX || isFullscreen,
    };
  }, [
    commandBarDensity,
    fashionHomeDesktopShellActive,
    height,
    insets.top,
    isFullscreen,
    layout.pad,
    webCommandBarHeight,
    webFashionChromeHeight,
    webVisualViewportHeight,
    webWorldStripHeight,
  ]);

  /** TRUE_COMPACT_LAYOUT — explicit fullscreen branch for opening-stage geometry (web fashion home). */
  const webOpeningStageFullscreen =
    fashionHomeDesktopShellActive &&
    Platform.OS === 'web' &&
    isFullscreen &&
    fashionDesktopWebHomeStageLayout != null;

  const fashionHomeEdgeLitWorldCardProps = useCallback(
    (accent: FashionHomeWorldCardDaylightAccent) =>
      fashionHomeDesktopShellActive && fashionDaylight && Platform.OS === 'web'
        ? {
            glassMaterialMode: 'edgeLit' as const,
            edgeLitHoverBoost: webWorldCardHover === accent,
          }
        : {},
    [fashionDaylight, fashionHomeDesktopShellActive, webWorldCardHover]
  );

  const daylightToggleLabel = useMemo(() => {
    const vi = typeof i18n.language === 'string' && i18n.language.toLowerCase().startsWith('vi');
    if (daylightBoost) return vi ? 'TáşŻt Ä‘Ă¨n' : 'Night';
    return vi ? 'Báş­t Ä‘Ă¨n' : 'Daylight';
  }, [daylightBoost, i18n.language]);

  const onPressDaylightBoost = useCallback(() => {
    setDaylightBoost((v) => !v);
  }, [setDaylightBoost]);

  const fashionHomeWebTintTransition =
    Platform.OS === 'web' && fashionHomeDesktopShellActive ? fashionHomeWebDaylightTransitionStyle() : null;

  const scrollRef = useRef<InstanceType<typeof ScrollView> | null>(null);
  const charitySectionY = useRef(0);
  /** Desktop fashion home: Care Heart Fund card is hidden; strip CTA scrolls to this impact row. */
  const impactCareScrollY = useRef(0);
  const worldSectionY = useRef(0);
  const [sosHoldGateOpen, setSosHoldGateOpen] = useState(false);
  const [sosPlusInfoOpen, setSosPlusInfoOpen] = useState(false);

  const scrollToCareSection = useCallback(() => {
    const y = fashionHomeDesktopShellActive ? impactCareScrollY.current : charitySectionY.current;
    scrollRef.current?.scrollTo({
      y: Math.max(0, y - 16),
      animated: true,
    });
  }, [fashionHomeDesktopShellActive]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const scrollToWorldSection = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, worldSectionY.current - 20),
      animated: true,
    });
  }, []);

  const onWatchOverview = useCallback(() => {
    if (!featureFlags.academyLiteEnabled) {
      Alert.alert('VIONA', t('home.fashionTech.watchOverviewUnavailable'));
      return;
    }
    openMiniApp('academy', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai }));
  }, [featureFlags.academyLiteEnabled, navigation, openMiniApp, t]);

  const onSecretTap = useCallback(() => {
    if (!isAdminDebugSurfaceEnabled()) return;
    const now = Date.now();
    const recent = [...tapsRef.current, now].filter((t) => now - t <= 3000);
    tapsRef.current = recent;
    if (recent.length >= 5) {
      tapsRef.current = [];
      if (adminUnlocked) {
        navigation.navigate('AdminDashboard');
        return;
      }
      setPinInput('');
      setPinError('');
      setShowPin(true);
    }
  }, [adminUnlocked, navigation]);

  const onSelectProactive = useCallback(
    (question: string, persona: 'leona' | 'loan') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!user) {
        setPendingRedirect(persona === 'loan' ? 'LeTan' : 'LeonaCall');
        setShowPaywall(true);
        return;
      }
      if (persona === 'loan') {
        openMiniApp('b2bAiReceptionist', () => navigation.navigate('AiReceptionistDemoSimulator'));
        return;
      }
      openMiniApp('b2cAiCallAssistant', () =>
        navigation.navigate('LeonaCall', { prefillRequest: question, autoSubmit: true })
      );
    },
    [navigation, openMiniApp, setPendingRedirect, user]
  );

  const openSosEntry = useCallback(() => {
    setSosPlusInfoOpen(false);
    if (fashionHomeDesktopShellActive) setSosHoldGateOpen(true);
    else homeCommand?.triggerSafetyAssist();
  }, [fashionHomeDesktopShellActive, homeCommand]);

  const onSosHoldGateComplete = useCallback(() => {
    setSosHoldGateOpen(false);
    homeCommand?.triggerSafetyAssist();
  }, [homeCommand]);

  const quickActionItems = useMemo(
    () => [
      {
        id: 'bookServices',
        icon: 'calendar-outline' as const,
        accent: 'emerald' as const,
        label: t('home.quickActions.bookServices'),
        onPress: () => goUniverseLocal(),
      },
      {
        id: 'quickTranslate',
        icon: 'language-outline' as const,
        accent: 'cyan' as const,
        label: t('home.quickActions.quickTranslate'),
        onPress: openInterpreter,
      },
      {
        id: 'aiAssistant',
        icon: 'sparkles-outline' as const,
        accent: 'violet' as const,
        label: t('home.quickActions.aiAssistant'),
        onPress: () => openProtected('LeonaCall'),
      },
      {
        id: 'documents',
        icon: 'document-text-outline' as const,
        accent: 'gold' as const,
        label: t('home.quickActions.documents'),
        onPress: () => openProtected('Vault'),
      },
      {
        id: 'nearbySupport',
        icon: 'location-outline' as const,
        accent: 'blue' as const,
        label: t('home.quickActions.nearbySupport'),
        onPress: () => goUniverseLocal(),
      },
      {
        id: 'travelLite',
        icon: 'airplane-outline' as const,
        accent: 'cyan' as const,
        label: t('home.quickActions.travelLite'),
        onPress: () => goUniverseTravel(),
      },
      {
        id: 'learning',
        icon: 'school-outline' as const,
        accent: 'violet' as const,
        label: t('home.quickActions.learning'),
        onPress: () => goUniverseAcademy(),
      },
      {
        id: 'safety',
        icon: 'shield' as const,
        accent: 'sos' as const,
        label: t('sos.chip'),
        onPress: () => openSosEntry(),
      },
    ],
    [goUniverseAcademy, goUniverseLocal, goUniverseTravel, openInterpreter, openProtected, openSosEntry, t]
  );

  const FashionHomeDaylightQuickActionPill = ({
    pillId,
    label,
    icon,
    onPress,
    accent,
    fill,
    webTransition,
  }: {
    pillId: string;
    label: string;
    // Ionicons name union is cumbersome here; keep it permissive.
    icon: any;
    onPress: () => void;
    accent: FashionHomeQuickActionAccent;
    fill: boolean;
    webTransition?: any;
  }) => {
    const hovered = Platform.OS === 'web' && quickActionWebHoverId === pillId;

    const iconColor =
      accent === 'gold'
        ? vionaTokens.fashionTech.accentGold
        : accent === 'cyan'
          ? vionaTokens.fashionTech.accentCyan
          : accent === 'emerald'
            ? vionaTokens.fashionTech.accentEmerald
            : accent === 'violet'
              ? vionaTokens.fashionTech.accentViolet
              : accent === 'blue'
                ? vionaTokens.fashionTech.statusLite
                : vionaTokens.fashionTech.sosNeon;

    const sheen = fashionHomeDaylightQuickActionSheen(accent);

    return (
      <Pressable
        onPress={onPress}
        onPointerEnter={Platform.OS === 'web' ? () => setQuickActionWebHoverId(pillId) : undefined}
        onPointerLeave={
          Platform.OS === 'web'
            ? () => setQuickActionWebHoverId((cur) => (cur === pillId ? null : cur))
            : undefined
        }
        style={({ pressed }) => [
          styles.quickActionPillDaylightBase,
          fill && styles.quickActionPillDaylightFill,
          fashionHomeDaylightQuickActionPillStyle(accent),
          Platform.OS === 'web' && fashionHomeWebDaylightQuickActionPillMaterialStyle(accent, hovered),
          Platform.OS === 'web' && !reduceMotion && fashionHomeWebQuickActionHoverMotionStyle(hovered),
          webTransition,
          pressed && styles.quickActionPillDaylightPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={[sheen[0], sheen[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={styles.quickActionPillDaylightSheen}
        />
        {Platform.OS === 'web' ? (
          <View
            pointerEvents="none"
            style={[styles.quickActionPillDaylightInnerRimWrap, fashionHomeWebDaylightQuickActionInnerRimStyle(accent)]}
          />
        ) : null}

        <View
          style={[
            styles.quickActionPillDaylightIconCapsule,
            Platform.OS === 'web' ? styles.quickActionPillDaylightIconCapsuleWeb : null,
            fashionHomeDaylightQuickActionIconCapsuleStyle(accent, hovered),
          ]}
        >
          <Ionicons name={icon} size={15} color={iconColor} />
        </View>

        <Text
          style={[
            styles.quickActionPillDaylightLabel,
            accent === 'sos' && styles.quickActionPillDaylightLabelSos,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  /** GLASS.HOME.ROOT â€” edge-lit stack only (no full-card sheen/glow wash; card fog removed in VionaFashionWorldCard). */
  const FashionHomeWorldCardGlassLayers = ({
    accent,
    hoverBoost,
  }: {
    accent: FashionHomeWorldCardDaylightAccent;
    hoverBoost?: boolean;
  }) => (
    <View pointerEvents="none" style={styles.worldCardGlassLayers}>
      <LinearGradient
        colors={[...FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL[accent]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={[
          styles.worldCardGlassCornerLitTl,
          hoverBoost && Platform.OS === 'web' && styles.worldCardGlassCornerBoost,
        ]}
      />
      <LinearGradient
        colors={[...FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TR[accent]]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.85 }}
        pointerEvents="none"
        style={[
          styles.worldCardGlassCornerLitTr,
          hoverBoost && Platform.OS === 'web' && styles.worldCardGlassCornerBoost,
        ]}
      />
      <LinearGradient
        colors={[...FASHION_HOME_DAYLIGHT_WORLD_DIAGONAL_SPECULAR[accent]]}
        locations={[0.44, 0.54, 0.66]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={[
          styles.worldCardGlassDiagonalSpec,
          hoverBoost && Platform.OS === 'web' && styles.worldCardGlassDiagonalSpecHover,
        ]}
      />
      <LinearGradient
        colors={[...FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL[accent]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        style={styles.worldCardGlassBottomVeil}
      />
      {Platform.OS === 'web' ? (
        <View
          pointerEvents="none"
          style={[
            styles.worldCardGlassInnerRim,
            { borderRadius: FASHION_HOME_WORLD_CARD_GLASS_HOST_RADIUS },
            fashionHomeWebDaylightWorldCardInnerRimStyle(accent, !!hoverBoost),
            hoverBoost && styles.worldCardGlassInnerRimHover,
          ]}
        />
      ) : null}
      {hoverBoost && Platform.OS === 'web' ? (
        <LinearGradient
          colors={[...FASHION_HOME_DAYLIGHT_WORLD_HOVER_EDGE_SWEEP[accent]]}
          locations={[0.36, 0.52, 0.68]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={[styles.worldCardGlassHoverEdgeSweep, hoverBoost && styles.worldCardGlassHoverEdgeSweepBoost]}
        />
      ) : null}
      {Platform.OS === 'web' ? (
        <LinearGradient
          colors={[...FASHION_HOME_DAYLIGHT_WORLD_TOP_REFRACTION_BAND[accent]]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
          style={[
            styles.worldCardGlassTopRefractionGrad,
            hoverBoost && styles.worldCardGlassRefractionBoost,
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[styles.worldCardGlassTopRefraction, hoverBoost ? styles.worldCardGlassRefractionBoost : null]}
        />
      )}
    </View>
  );

  const renderQuickActionPill = (item: (typeof quickActionItems)[number], fill = false) =>
    fashionDaylight && fashionHomeDesktopShellActive ? (
      <FashionHomeDaylightQuickActionPill
        key={item.id}
        pillId={item.id}
        label={item.label}
        icon={item.icon}
        accent={item.accent}
        onPress={item.onPress}
        fill={fill}
        webTransition={fashionHomeWebTintTransition}
      />
    ) : (
      <VionaQuickActionPill
        key={item.id}
        label={item.label}
        icon={item.icon}
        accent={item.accent}
        onPress={item.onPress}
        fill={fill}
      />
    );

  const renderWorldCardGlassLayers = (
    accent: FashionHomeWorldCardDaylightAccent,
    hoverBoost = false
  ) => (fashionDaylight ? <FashionHomeWorldCardGlassLayers accent={accent} hoverBoost={hoverBoost} /> : null);

  const renderFashionWebOpeningWorldCardCells = () => (
    <>
      <View
        style={[
          styles.ftCardCell,
          stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
          fashionHomeWebOpeningStageCardCellStyle(),
          fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
          fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('local'),
          fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('local', webWorldCardHover === 'local'),
          Platform.OS === 'web' &&
            fashionDaylight &&
            fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'local' && !reduceMotion),
          fashionHomeWebTintTransition,
        ]}
        onPointerEnter={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('local') : undefined}
        onPointerLeave={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined}
      >
        <VionaFashionWorldCard
          accent="local"
          backgroundImage={IMG_HOME_LOCAL}
          imageStyle={styles.cardImageLocal}
          title={t('home.fashionTech.local.title')}
          subtitle={t('home.fashionTech.local.subtitle')}
          icon={<Ionicons name="grid-outline" size={22} color={vionaTokens.fashionTech.accentEmerald} />}
          status={{ label: t('home.worldStage.local.status'), tone: 'lite' }}
          onPress={goUniverseLocal}
          footerHint={t('home.fashionTech.cardExploreHint')}
          showChevron
          stretchInColumn={stretchWorldCardsInGrid}
          {...fashionHomeEdgeLitWorldCardProps('local')}
          {...(desktopCardLivingHoverProps?.local ?? {})}
        />
        {renderWorldCardGlassLayers('local', webWorldCardHover === 'local')}
      </View>
      <View
        style={[
          styles.ftCardCell,
          stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
          fashionHomeWebOpeningStageCardCellStyle(),
          fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
          fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('travel'),
          fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('travel', webWorldCardHover === 'travel'),
          Platform.OS === 'web' &&
            fashionDaylight &&
            fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'travel' && !reduceMotion),
          fashionHomeWebTintTransition,
        ]}
        onPointerEnter={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('travel') : undefined}
        onPointerLeave={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined}
      >
        <VionaFashionWorldCard
          accent="travel"
          backgroundImage={IMG_HOME_TRAVEL}
          imageStyle={styles.cardImageTravel}
          title={t('home.fashionTech.travel.title')}
          subtitle={t('home.fashionTech.travel.subtitle')}
          icon={<Ionicons name="airplane-outline" size={22} color={vionaTokens.fashionTech.accentCyan} />}
          status={
            featureFlags.travelEnabled
              ? { label: t('home.worldStage.travel.status'), tone: 'pilot' }
              : { label: t('home.worldStage.travel.statusComingSoon'), tone: 'comingSoon' }
          }
          onPress={featureFlags.travelEnabled ? goUniverseTravel : undefined}
          footerHint={t('home.fashionTech.cardExploreHint')}
          showChevron
          stretchInColumn={stretchWorldCardsInGrid}
          {...fashionHomeEdgeLitWorldCardProps('travel')}
          {...(desktopCardLivingHoverProps?.travel ?? {})}
        />
        {renderWorldCardGlassLayers('travel', webWorldCardHover === 'travel')}
      </View>
      <View
        style={[
          styles.ftCardCell,
          stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
          fashionHomeWebOpeningStageCardCellStyle(),
          fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
          fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('academy'),
          fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('academy', webWorldCardHover === 'academy'),
          Platform.OS === 'web' &&
            fashionDaylight &&
            fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'academy' && !reduceMotion),
          fashionHomeWebTintTransition,
        ]}
        onPointerEnter={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('academy') : undefined}
        onPointerLeave={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined}
      >
        <VionaFashionWorldCard
          accent="academy"
          backgroundImage={IMG_HOME_ACADEMY}
          imageStyle={styles.cardImageAcademy}
          title={t('home.fashionTech.academy.title')}
          subtitle={t('home.fashionTech.academy.subtitle')}
          icon={<Ionicons name="sparkles-outline" size={22} color="#C77DFF" />}
          status={{ label: t('home.worldStage.academy.status'), tone: 'demo' }}
          onPress={goUniverseAcademy}
          footerHint={t('home.fashionTech.cardExploreHint')}
          showChevron
          stretchInColumn={stretchWorldCardsInGrid}
          {...fashionHomeEdgeLitWorldCardProps('academy')}
          {...(desktopCardLivingHoverProps?.academy ?? {})}
        />
        {renderWorldCardGlassLayers('academy', webWorldCardHover === 'academy')}
      </View>
      <View
        style={[
          styles.ftCardCell,
          stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
          fashionHomeWebOpeningStageCardCellStyle(),
          fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
          fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('business'),
          fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('business', webWorldCardHover === 'business'),
          Platform.OS === 'web' &&
            fashionDaylight &&
            fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'business' && !reduceMotion),
          fashionHomeWebTintTransition,
        ]}
        onPointerEnter={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('business') : undefined}
        onPointerLeave={Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined}
      >
        <VionaFashionWorldCard
          accent="business"
          backgroundImage={IMG_HOME_BUSINESS}
          imageStyle={styles.cardImageBusiness}
          title={t('home.fashionTech.business.title')}
          subtitle={t('home.fashionTech.business.subtitle')}
          icon={<Ionicons name="briefcase-outline" size={22} color={vionaTokens.fashionTech.accentGold} />}
          status={{ label: t('home.worldStage.business.status'), tone: 'pilot' }}
          onPress={goUniverseBusiness}
          footerHint={t('home.fashionTech.cardExploreHint')}
          showChevron
          stretchInColumn={stretchWorldCardsInGrid}
          {...fashionHomeEdgeLitWorldCardProps('business')}
          {...(desktopCardLivingHoverProps?.business ?? {})}
        />
        {renderWorldCardGlassLayers('business', webWorldCardHover === 'business')}
      </View>
    </>
  );

  return (
    <View
      style={[
        styles.rootFill,
        fashionHomeDesktopShellActive && styles.rootFillFashion,
        fashionDaylight && { backgroundColor: FASHION_HOME_DAYLIGHT_CANVAS },
        fashionHomeWebTintTransition,
        Platform.OS === 'web' && styles.rootFillWeb,
      ]}
    >
      <StatusBar style={isDesktopWeb ? 'light' : 'dark'} />
      {fashionHomeDesktopShellActive && homeCommand ? (
        <View
          style={[
            styles.fashionShellOuter,
            fashionDaylight && { backgroundColor: FASHION_HOME_DAYLIGHT_CANVAS },
            fashionHomeWebTintTransition,
            {
              paddingTop: Math.max(insets.top, 8),
              paddingHorizontal: layout.pad,
            },
          ]}
          onLayout={
            Platform.OS === 'web'
              ? (e) => {
                  const h = Math.ceil(e.nativeEvent.layout.height);
                  if (h > 0 && h !== webFashionChromeHeight) setWebFashionChromeHeight(h);
                }
              : undefined
          }
        >
          {/** Match ScrollView + hero bleed: pad then negative margin so rail frame spans same width as `desktopHeroFrameShell`. */}
          <View
            style={{ marginHorizontal: -layout.pad }}
            onLayout={
              Platform.OS === 'web'
                ? (e) => {
                    const h = Math.ceil(e.nativeEvent.layout.height);
                    if (h > 0 && h !== webCommandBarHeight) setWebCommandBarHeight(h);
                  }
                : undefined
            }
          >
            <VionaFashionHomeCommandBar
              density={commandBarDensity}
              onPressLogo={scrollToTop}
              headerGreetingLine1={fashionDesktopHeaderBlock.line1}
              headerWishLine={fashionDesktopHeaderBlock.wish}
              headerGreetingA11y={`${fashionDesktopHeaderBlock.line1} ${fashionDesktopHeaderBlock.wish}`}
              onPressLanguage={() => homeCommand.openLanguageSheet()}
              onPressVio={() => openProtected('Wallet')}
              onPressSafety={openSosEntry}
              onPressAccount={() => homeCommand.openAccount()}
              onPressRole={homeCommand.showRolePicker ? () => homeCommand.openRolePicker() : undefined}
              showRolePicker={homeCommand.showRolePicker}
              fullscreenControl={fullscreenControl}
              daylightBoost={fashionDaylight}
              onPressDaylightBoost={onPressDaylightBoost}
              daylightBoostLabel={daylightToggleLabel}
            />
          </View>
        </View>
      ) : null}
      <SafeAreaView style={styles.container} edges={isDesktopWeb ? ['left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <ScrollView
        key={`home-scroll-${Math.round(width)}-${Math.round(height)}`}
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          fashionHomeDesktopShellActive ? styles.scrollContentFashion : null,
          {
            paddingHorizontal: layout.pad,
            paddingBottom: scrollBottomPad,
            paddingTop:
              fashionHomeDesktopShellActive && Platform.OS === 'web'
                ? FASHION_HOME_WEB_OPENING_STAGE_SCROLL_TOP_PAD_PX
                : fashionHomeDesktopShellActive
                  ? theme.spacing.xs
                  : theme.spacing.md,
            width: fashionHomeDesktopShellActive ? '100%' : layout.shellWidth,
            maxWidth: '100%',
            alignSelf: fashionHomeDesktopShellActive ? 'stretch' : 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {fashionHomeDesktopShellActive ? (
          <View
            style={[
              styles.fashionDesktopWebOpeningStage,
              fashionDesktopWebHomeStageLayout != null &&
                fashionHomeWebOpeningStageShellStyle(
                  fashionDesktopWebHomeStageLayout.stageHeight,
                  fashionDesktopWebHomeStageLayout.contentPad,
                  isFullscreen
                ),
            ]}
            onPointerLeave={
              Platform.OS === 'web' && fashionHomeDesktopShellActive
                ? revertDesktopLivingHeroImmediately
                : undefined
            }
          >
          <View style={fashionHomeWebOpeningStageDeepHeroCanvasStyle()}>
          <View
            style={[
              styles.ftHeroBleedFashion,
              fashionDesktopWebHomeStageLayout != null && fashionHomeWebOpeningStageDeepHeroBleedStyle(),
              {
                marginHorizontal: fashionDesktopWebHomeStageLayout != null ? 0 : -layout.pad,
                marginTop: fashionDesktopWebHomeStageLayout != null ? 0 : -vionaTokens.spacing[6] + FASHION_HOME_HERO_COMMAND_CLEARANCE_PX,
              },
            ]}
          >
            <View
              style={
                fashionDesktopWebHomeStageLayout != null
                  ? fashionHomeWebOpeningStageFullscreenGridColumnStyle(
                      fashionDesktopWebHomeStageLayout.contentPad,
                      webOpeningStageFullscreen
                    )
                  : undefined
              }
            >
            <View
              style={[
                styles.desktopHeroFrameShell,
                fashionDesktopWebHomeStageLayout != null &&
                  fashionHomeWebOpeningStageHeroFrameStyle(
                    fashionDesktopWebHomeStageLayout.heroHeightPx,
                    webOpeningStageFullscreen
                  ),
              ]}
            >
            <View
              style={[
                styles.desktopHeroShell,
                fashionDaylight && styles.desktopHeroShellDaylight,
                fashionHomeWebTintTransition,
                ...(fashionDesktopWebHomeStageLayout
                  ? [fashionHomeWebOpeningStageDeepHeroShellStyle()]
                  : [{ aspectRatio: DESKTOP_HERO_FRAME_ASPECT }]),
              ]}
              accessibilityRole="image"
              accessibilityLabel={t('home.fashionTech.heroVisualA11y')}
            >
              <LinearGradient
                colors={['rgba(242, 212, 136, 0)', FASHION_HOME_HERO_TOP_GLOW, 'rgba(242, 212, 136, 0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.desktopHeroGoldAccent}
                pointerEvents="none"
              />
              <View
                style={[styles.desktopHeroCyanEdge, fashionDaylight && styles.desktopHeroCyanEdgeDaylight]}
                pointerEvents="none"
              />
              <View
                style={[styles.desktopHeroBottomCyanEdge, fashionDaylight && styles.desktopHeroBottomCyanEdgeDaylight]}
                pointerEvents="none"
              />
              <View
                style={[
                  styles.desktopHeroImageClip,
                  fashionDesktopWebHomeStageLayout == null &&
                    fashionDaylight &&
                    styles.desktopHeroImageClipDaylight,
                  fashionDesktopWebHomeStageLayout == null &&
                    fashionDaylight &&
                    fashionHomeWebDaylightHeroImageLiftStyle(),
                  fashionDesktopWebHomeStageLayout != null && fashionHomeWebOpeningStageHeroImageClipStyle(),
                  fashionHomeWebTintTransition,
                ]}
                pointerEvents="none"
              >
                {fashionDesktopWebHomeStageLayout != null ? (
                  <Image
                    source={LIVING_HERO_DESKTOP_IMAGE[livingOverlayKey ?? livingBaseKey]}
                    resizeMode="cover"
                    style={[
                      styles.desktopHeroImageFill,
                      fashionHomeWebOpeningStageHeroImageStyle(isFullscreen),
                    ]}
                  />
                ) : (
                  <>
                    <Image
                      source={LIVING_HERO_DESKTOP_IMAGE[livingBaseKey]}
                      resizeMode="cover"
                      style={[styles.desktopHeroImageFill, heroDesktopLivingImageWebStyle]}
                    />
                    {livingOverlayKey != null ? (
                      <Animated.Image
                        source={LIVING_HERO_DESKTOP_IMAGE[livingOverlayKey]}
                        resizeMode="cover"
                        style={[
                          styles.desktopHeroImageFill,
                          heroDesktopLivingImageWebStyle,
                          { opacity: livingHeroOverlayOpacity },
                        ]}
                      />
                    ) : null}
                  </>
                )}
              </View>
              <LinearGradient
                colors={
                  fashionDaylight ? [...FASHION_HOME_DAYLIGHT_HERO_SCRIM_LEFT] : [...DESKTOP_HERO_SCRIM_LEFT_COLORS]
                }
                locations={[0, 0.48, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.desktopHeroReadabilityScrim}
                pointerEvents="none"
              />
              <LinearGradient
                colors={
                  fashionDaylight
                    ? [...FASHION_HOME_DAYLIGHT_HERO_VIGNETTE]
                    : fashionDesktopWebHomeStageLayout != null
                      ? ['rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.05)']
                      : ['rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.08)']
                }
                locations={[0, 0.42, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.desktopHeroInnerVignette}
                pointerEvents="none"
              />
              {fashionDaylight ? (
                <LinearGradient
                  colors={[...FASHION_HOME_DAYLIGHT_HERO_LUMINOUS]}
                  locations={[0, 0.52, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.desktopHeroLuminousVeil}
                  pointerEvents="none"
                />
              ) : null}
              {fashionDaylight ? (
                <LinearGradient
                  colors={[...FASHION_HOME_DAYLIGHT_HERO_LIFT_OVERLAY]}
                  locations={[0, 0.42, 1]}
                  start={{ x: 0.15, y: 0.35 }}
                  end={{ x: 0.85, y: 0.95 }}
                  style={styles.desktopHeroLiftOverlay}
                  pointerEvents="none"
                />
              ) : null}
              {fashionDesktopWebHomeStageLayout == null ? (
                <LinearGradient
                  colors={
                    fashionDaylight
                      ? ['rgba(10, 14, 22, 0)', 'rgba(12, 18, 28, 0.04)', 'rgba(16, 24, 38, 0.14)']
                      : ['rgba(6, 10, 16, 0)', 'rgba(8, 12, 18, 0.14)', 'rgba(10, 16, 26, 0.52)']
                  }
                  locations={[0, 0.52, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[
                    styles.desktopHeroBottomHandoff,
                    fashionHomeDesktopShellActive &&
                      Platform.OS === 'web' &&
                      styles.desktopHeroBottomHandoffWebTight,
                  ]}
                  pointerEvents="none"
                />
              ) : null}
              <View style={styles.desktopHeroInnerFrame} pointerEvents="none" />
              <View
                style={[
                  styles.desktopHeroLivingStatusCapsule,
                  width < 520 && styles.desktopHeroLivingStatusCapsuleNarrow,
                  fashionDaylight && styles.desktopHeroLivingStatusCapsuleDaylight,
                  fashionHomeWebTintTransition,
                ]}
                accessibilityRole="text"
                accessibilityLabel={`${t('shell.header.localTimeA11y')} ${fashionDesktopHeaderBlock.timeLocation}`}
                pointerEvents="none"
              >
                <View style={styles.desktopHeroLivingStatusCapsuleHighlight} pointerEvents="none" />
                <Text
                  style={[
                    styles.desktopHeroLivingStatusClock,
                    fashionDaylight && styles.desktopHeroLivingStatusClockDaylight,
                    fashionHomeWebTintTransition,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {fashionDesktopHeaderBlock.clockLine}
                </Text>
                {fashionDesktopHeaderBlock.regionLine ? (
                  <Text
                    style={[
                      styles.desktopHeroLivingStatusRegion,
                      fashionDaylight && styles.desktopHeroLivingStatusRegionDaylight,
                      fashionHomeWebTintTransition,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {fashionDesktopHeaderBlock.regionLine}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.desktopHeroForeground,
                  isLandscapeViewport && styles.desktopHeroForegroundLandscape,
                  fashionDesktopWebHomeStageLayout != null && fashionHomeWebOpeningStageHeroForegroundStyle(),
                  { flexDirection: width >= 920 ? 'row' : 'column', justifyContent: width >= 920 ? 'flex-start' : 'flex-start' },
                ]}
                pointerEvents="box-none"
              >
                <Animated.View
                  style={[
                    styles.desktopHeroCopy,
                    width < 920 ? { maxWidth: '100%' } : null,
                    { opacity: livingHeroCopyBlend },
                  ]}
                >
                  <Text
                    style={[
                      styles.desktopHeroEyebrow,
                      fashionDaylight && styles.desktopHeroEyebrowDaylight,
                      fashionHomeWebTintTransition,
                    ]}
                  >
                    {desktopLivingCopy.eyebrow}
                  </Text>
                  <Text
                    style={[
                      styles.desktopHeroHeadline,
                      width < 720 ? styles.desktopHeroHeadlineSm : null,
                      width < 520 ? styles.desktopHeroHeadlineXs : null,
                      fashionDaylight && styles.desktopHeroHeadlineDaylight,
                      fashionHomeWebTintTransition,
                    ]}
                  >
                    {desktopLivingCopy.title}
                  </Text>
                  <Text
                    style={[
                      styles.desktopHeroSubtitle,
                      width < 520 && styles.desktopHeroSubtitleNarrow,
                      fashionDaylight && styles.desktopHeroSubtitleDaylight,
                      fashionHomeWebTintTransition,
                    ]}
                  >
                    {desktopLivingCopy.subtitle}
                  </Text>
                  <View style={styles.desktopHeroCtaRow}>
                    <Pressable
                      onPress={scrollToWorldSection}
                      style={({ pressed }) => [
                        styles.desktopHeroCtaPrimary,
                        fashionDaylight && styles.desktopHeroCtaPrimaryDaylight,
                        fashionHomeWebTintTransition,
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('home.fashionTech.ctaExplore')}
                    >
                      <LinearGradient
                        colors={
                          fashionDaylight
                            ? ['rgba(255, 232, 188, 0.99)', 'rgba(214, 186, 118, 0.99)', 'rgba(182, 148, 78, 0.99)']
                            : ['rgba(248, 220, 156, 0.98)', 'rgba(201, 169, 98, 0.98)', 'rgba(168, 132, 62, 0.98)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.desktopHeroCtaPrimaryFill}
                      >
                        <Text
                          style={[
                            styles.desktopHeroCtaPrimaryText,
                            fashionDaylight && styles.desktopHeroCtaPrimaryTextDaylight,
                            fashionHomeWebTintTransition,
                          ]}
                        >
                          {t('home.fashionTech.ctaExplore')}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable
                      onPress={onWatchOverview}
                      style={({ pressed }) => [
                        styles.desktopHeroCtaSecondary,
                        fashionDaylight && styles.desktopHeroCtaSecondaryDaylight,
                        fashionHomeWebTintTransition,
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('home.fashionTech.ctaWatch')}
                    >
                      <Text
                        style={[
                          styles.desktopHeroCtaSecondaryText,
                          fashionDaylight && styles.desktopHeroCtaSecondaryTextDaylight,
                          fashionHomeWebTintTransition,
                        ]}
                      >
                        {t('home.fashionTech.ctaWatch')}
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    style={[
                      styles.desktopHeroStatusStrip,
                      fashionDaylight && styles.desktopHeroStatusStripDaylight,
                      fashionHomeWebTintTransition,
                    ]}
                  >
                    <View style={styles.desktopHeroStatusPill}>
                      <Text
                        style={[
                          styles.desktopHeroStatusText,
                          fashionDaylight && styles.desktopHeroStatusTextDaylight,
                          fashionHomeWebTintTransition,
                        ]}
                      >
                        {t('home.fashionTech.statusNetwork')}
                      </Text>
                    </View>
                    <View style={styles.desktopHeroStatusDivider} />
                    <View style={styles.desktopHeroStatusPill}>
                      <Text
                        style={[
                          styles.desktopHeroStatusText,
                          fashionDaylight && styles.desktopHeroStatusTextDaylight,
                          fashionHomeWebTintTransition,
                        ]}
                      >
                        {t('home.fashionTech.statusSupport')}
                      </Text>
                    </View>
                    <View style={styles.desktopHeroStatusDivider} />
                    <View style={styles.desktopHeroStatusPill}>
                      <Text
                        style={[
                          styles.desktopHeroStatusText,
                          fashionDaylight && styles.desktopHeroStatusTextDaylight,
                          fashionHomeWebTintTransition,
                        ]}
                      >
                        {t('home.fashionTech.statusCountries')}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
                {width >= 920 ? <View style={styles.desktopHeroImageSpacer} pointerEvents="none" /> : null}
              </View>
              <View
                style={[
                  styles.desktopHeroConnectedChip,
                  fashionDaylight && styles.desktopHeroConnectedChipDaylight,
                  fashionHomeWebTintTransition,
                  fashionDesktopWebHomeStageLayout != null && fashionHomeWebOpeningStageConnectedChipStyle(),
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.desktopHeroConnectedChipText,
                    fashionDaylight && styles.desktopHeroConnectedChipTextDaylight,
                    fashionHomeWebTintTransition,
                  ]}
                >
                  {t('home.fashionTech.connectedChip')}
                </Text>
              </View>
            </View>
              <View
                pointerEvents="none"
                style={[
                  styles.desktopHeroEdgeOverlay,
                  premiumFrameEdgeOverlay(vionaTokens.radius.xxl),
                  premiumCrispEdgeStroke(
                    fashionDaylight ? FASHION_HOME_DAYLIGHT_FRAME_BORDER : FASHION_HOME_FRAME_BORDER
                  ),
                ]}
              />
            </View>
            {fashionDesktopWebHomeStageLayout != null ? (
              <View
                style={fashionHomeWebOpeningStageWorldStripBelowHeroStyle(webOpeningStageFullscreen)}
                onLayout={(e) => {
                  worldSectionY.current = e.nativeEvent.layout.y;
                  const h = Math.ceil(e.nativeEvent.layout.height);
                  if (h > 0 && Math.abs(h - webWorldStripHeight) > 2) setWebWorldStripHeight(h);
                }}
              >
                <View
                  style={[
                    styles.ftCardGrid,
                    fashionHomeWebOpeningStageCardGridStyle(),
                    {
                      flexDirection: 'row',
                      flexWrap: worldCardsDesktopSingleRow ? 'nowrap' : 'wrap',
                    },
                  ]}
                >
                  {renderFashionWebOpeningWorldCardCells()}
                </View>
              </View>
            ) : null}
            </View>
          </View>
          </View>
          </View>
        ) : (
          <View style={[styles.ftHeroBleed, { marginHorizontal: -layout.pad }]}>
            <LinearGradient
              colors={[...vionaTokens.fashionTech.heroGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.ftHero,
                {
                  paddingVertical: ftHeroPaddingV,
                  paddingHorizontal:
                    width < 400 ? vionaTokens.spacing[16] : vionaTokens.spacing[24],
                },
              ]}
            >
              <View
                style={[
                  styles.ftHeroMain,
                  {
                    flexDirection: width >= 980 ? 'row' : 'column',
                    alignItems: width >= 980 ? 'stretch' : 'flex-start',
                    marginBottom: isLandscapeViewport ? vionaTokens.spacing[12] : vionaTokens.spacing[24],
                  },
                ]}
              >
                <Animated.View style={[styles.ftCopyCol]}>
                  <Text style={styles.ftEyebrow}>{activeHero.eyebrow}</Text>
                  <Text style={[styles.ftHeadline, width < 420 && styles.ftHeadlineCompact]}>
                    {activeHero.title}
                  </Text>
                  <Text style={[styles.ftSubtitle, width < 420 && styles.ftSubtitleNarrow]}>
                    {activeHero.subtitle}
                  </Text>
                </Animated.View>
                <View
                  style={[styles.ftVisualPanel, { minHeight: ftVisualMinHeight }]}
                  accessibilityRole="image"
                  accessibilityLabel={t('home.fashionTech.heroVisualA11y')}
                >
                  <View style={styles.ftVisualImageClip} pointerEvents="none">
                    <Image
                      source={activeHero.image}
                      resizeMode="cover"
                      style={[styles.ftVisualImageFill, heroImageWebCoverStyle]}
                    />
                  </View>
                  <LinearGradient
                    colors={['transparent', 'rgba(4, 6, 10, 0.12)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.ftVisualBottomVignette}
                    pointerEvents="none"
                  />
                </View>
              </View>

              {useWorldCardCarousel ? (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                  style={[styles.ftCardGrid, styles.ftCardRailScrollOuter]}
                  contentContainerStyle={styles.ftCardRailContent}
                >
                  <View
                    style={[
                      styles.ftCardCarouselCell,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('local'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('local', webWorldCardHover === 'local'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'local' && !reduceMotion),
                      fashionHomeWebTintTransition,
                      { width: fashionCarouselCardWidth },
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('local') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="local"
                      backgroundImage={IMG_HOME_LOCAL}
                      imageStyle={styles.cardImageLocal}
                      title={t('home.fashionTech.local.title')}
                      subtitle={t('home.fashionTech.local.subtitle')}
                      icon={<Ionicons name="grid-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                      status={{ label: t('home.worldStage.local.status'), tone: 'lite' }}
                      onPress={goUniverseLocal}
                    />
                    {renderWorldCardGlassLayers('local', webWorldCardHover === 'local')}
                  </View>
                  <View
                    style={[
                      styles.ftCardCarouselCell,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('travel'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('travel', webWorldCardHover === 'travel'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'travel' && !reduceMotion),
                      fashionHomeWebTintTransition,
                      { width: fashionCarouselCardWidth },
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('travel') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="travel"
                      backgroundImage={IMG_HOME_TRAVEL}
                      imageStyle={styles.cardImageTravel}
                      title={t('home.fashionTech.travel.title')}
                      subtitle={t('home.fashionTech.travel.subtitle')}
                      icon={<Ionicons name="airplane-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                      status={
                        featureFlags.travelEnabled
                          ? { label: t('home.worldStage.travel.status'), tone: 'pilot' }
                          : { label: t('home.worldStage.travel.statusComingSoon'), tone: 'comingSoon' }
                      }
                      onPress={featureFlags.travelEnabled ? goUniverseTravel : undefined}
                    />
                    {renderWorldCardGlassLayers('travel', webWorldCardHover === 'travel')}
                  </View>
                  <View
                    style={[
                      styles.ftCardCarouselCell,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('academy'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('academy', webWorldCardHover === 'academy'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'academy' && !reduceMotion),
                      fashionHomeWebTintTransition,
                      { width: fashionCarouselCardWidth },
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('academy') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="academy"
                      backgroundImage={IMG_HOME_ACADEMY}
                      imageStyle={styles.cardImageAcademy}
                      title={t('home.fashionTech.academy.title')}
                      subtitle={t('home.fashionTech.academy.subtitle')}
                      icon={<Ionicons name="sparkles-outline" size={22} color="#C77DFF" />}
                      status={{ label: t('home.worldStage.academy.status'), tone: 'demo' }}
                      onPress={goUniverseAcademy}
                    />
                    {renderWorldCardGlassLayers('academy', webWorldCardHover === 'academy')}
                  </View>
                  <View
                    style={[
                      styles.ftCardCarouselCell,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('business'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('business', webWorldCardHover === 'business'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'business' && !reduceMotion),
                      fashionHomeWebTintTransition,
                      { width: fashionCarouselCardWidth },
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('business') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="business"
                      backgroundImage={IMG_HOME_BUSINESS}
                      imageStyle={styles.cardImageBusiness}
                      title={t('home.fashionTech.business.title')}
                      subtitle={t('home.fashionTech.business.subtitle')}
                      icon={<Ionicons name="briefcase-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                      status={{ label: t('home.worldStage.business.status'), tone: 'pilot' }}
                      onPress={goUniverseBusiness}
                    />
                    {renderWorldCardGlassLayers('business', webWorldCardHover === 'business')}
                  </View>
                </ScrollView>
              ) : (
                <View
                  style={[
                    styles.ftCardGrid,
                    {
                      flexDirection: 'row',
                      flexWrap: worldCardsDesktopSingleRow ? 'nowrap' : 'wrap',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.ftCardCell,
                      worldCardsOneColumnGrid ? styles.ftCardCellSingle : null,
                      worldCardsTwoColumnGrid ? styles.ftCardCellTwoColMobile : null,
                      worldCardsDesktopSingleRow ? styles.ftCardCellQuarter : null,
                      stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('local'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('local', webWorldCardHover === 'local'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'local' && !reduceMotion),
                      fashionHomeWebTintTransition,
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('local') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="local"
                      backgroundImage={IMG_HOME_LOCAL}
                      imageStyle={styles.cardImageLocal}
                      title={t('home.fashionTech.local.title')}
                      subtitle={t('home.fashionTech.local.subtitle')}
                      icon={<Ionicons name="grid-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                      status={{ label: t('home.worldStage.local.status'), tone: 'lite' }}
                      onPress={goUniverseLocal}
                      stretchInColumn={stretchWorldCardsInGrid}
                    />
                    {renderWorldCardGlassLayers('local', webWorldCardHover === 'local')}
                  </View>
                  <View
                    style={[
                      styles.ftCardCell,
                      worldCardsOneColumnGrid ? styles.ftCardCellSingle : null,
                      worldCardsTwoColumnGrid ? styles.ftCardCellTwoColMobile : null,
                      worldCardsDesktopSingleRow ? styles.ftCardCellQuarter : null,
                      stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('travel'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('travel', webWorldCardHover === 'travel'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'travel' && !reduceMotion),
                      fashionHomeWebTintTransition,
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('travel') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="travel"
                      backgroundImage={IMG_HOME_TRAVEL}
                      imageStyle={styles.cardImageTravel}
                      title={t('home.fashionTech.travel.title')}
                      subtitle={t('home.fashionTech.travel.subtitle')}
                      icon={<Ionicons name="airplane-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                      status={
                        featureFlags.travelEnabled
                          ? { label: t('home.worldStage.travel.status'), tone: 'pilot' }
                          : { label: t('home.worldStage.travel.statusComingSoon'), tone: 'comingSoon' }
                      }
                      onPress={featureFlags.travelEnabled ? goUniverseTravel : undefined}
                      stretchInColumn={stretchWorldCardsInGrid}
                    />
                    {renderWorldCardGlassLayers('travel', webWorldCardHover === 'travel')}
                  </View>
                  <View
                    style={[
                      styles.ftCardCell,
                      worldCardsOneColumnGrid ? styles.ftCardCellSingle : null,
                      worldCardsTwoColumnGrid ? styles.ftCardCellTwoColMobile : null,
                      worldCardsDesktopSingleRow ? styles.ftCardCellQuarter : null,
                      stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('academy'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('academy', webWorldCardHover === 'academy'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'academy' && !reduceMotion),
                      fashionHomeWebTintTransition,
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('academy') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="academy"
                      backgroundImage={IMG_HOME_ACADEMY}
                      imageStyle={styles.cardImageAcademy}
                      title={t('home.fashionTech.academy.title')}
                      subtitle={t('home.fashionTech.academy.subtitle')}
                      icon={<Ionicons name="sparkles-outline" size={22} color="#C77DFF" />}
                      status={{ label: t('home.worldStage.academy.status'), tone: 'demo' }}
                      onPress={goUniverseAcademy}
                      stretchInColumn={stretchWorldCardsInGrid}
                    />
                    {renderWorldCardGlassLayers('academy', webWorldCardHover === 'academy')}
                  </View>
                  <View
                    style={[
                      styles.ftCardCell,
                      worldCardsOneColumnGrid ? styles.ftCardCellSingle : null,
                      worldCardsTwoColumnGrid ? styles.ftCardCellTwoColMobile : null,
                      worldCardsDesktopSingleRow ? styles.ftCardCellQuarter : null,
                      stretchWorldCardsInGrid ? styles.ftCardCellFashionDesktop : null,
                      fashionDaylight && fashionHomeWorldCardGlassHostStyle(),
                      fashionDaylight && fashionHomeDaylightWorldCardNativeShellStyle('business'),
                      fashionDaylight && fashionHomeWebDaylightWorldCardMaterialStyle('business', webWorldCardHover === 'business'),
                      Platform.OS === 'web' &&
                        fashionDaylight &&
                        fashionHomeWebWorldCardHostHoverMotionStyle(webWorldCardHover === 'business' && !reduceMotion),
                      fashionHomeWebTintTransition,
                    ]}
                    onPointerEnter={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover('business') : undefined
                    }
                    onPointerLeave={
                      Platform.OS === 'web' && fashionDaylight ? () => setWebWorldCardHover(null) : undefined
                    }
                  >
                    <VionaFashionWorldCard
                      accent="business"
                      backgroundImage={IMG_HOME_BUSINESS}
                      imageStyle={styles.cardImageBusiness}
                      title={t('home.fashionTech.business.title')}
                      subtitle={t('home.fashionTech.business.subtitle')}
                      icon={<Ionicons name="briefcase-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                      status={{ label: t('home.worldStage.business.status'), tone: 'pilot' }}
                      onPress={goUniverseBusiness}
                      stretchInColumn={stretchWorldCardsInGrid}
                    />
                    {renderWorldCardGlassLayers('business', webWorldCardHover === 'business')}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {featureFlags.hubEnabled ? (
          <View
            style={
              fashionHomeDesktopShellActive && Platform.OS === 'web'
                ? [
                    fashionHomeWebOpeningStageSharedRailWrapperStyle(layout.pad, {
                      pullUpPx: webOpeningStageFullscreen
                        ? fashionHomeWebOpeningStageFullscreenHubPullUpPx()
                        : 0,
                    }),
                    fashionHomeWebOpeningStageHubDockFullscreenStyle(webOpeningStageFullscreen),
                  ]
                : fashionHomeDesktopShellActive
                  ? { marginHorizontal: -layout.pad }
                  : undefined
            }
          >
          <VionaGlassPanel
            style={[
              styles.quickActionStrip,
              fashionHomeDesktopShellActive ? styles.quickActionStripFashion : { width: layout.inner },
              fashionDaylight && styles.quickActionStripFashionDaylight,
              fashionHomeWebTintTransition,
              webOpeningStageFullscreen &&
                fashionHomeWebOpeningStageQuickActionStripFullscreenStyle(true),
            ]}
            tone="warm"
          >
            {!webOpeningStageFullscreen ? (
              <Text
                style={[
                  styles.quickActionPrompt,
                  fashionDaylight && styles.quickActionPromptDaylight,
                  fashionHomeWebTintTransition,
                ]}
              >
                {t('home.quickActions.prompt')}
              </Text>
            ) : null}
            {quickActionsHorizontal ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator
                keyboardShouldPersistTaps="handled"
                style={styles.quickActionRowScroll}
                contentContainerStyle={styles.quickActionRowScrollContent}
              >
                {quickActionItems.map((item) => renderQuickActionPill(item))}
              </ScrollView>
            ) : quickActionsGrid ? (
              <View style={styles.quickActionGrid}>
                <View style={styles.quickActionGridRow}>
                  {quickActionItems.slice(0, 4).map((item) => (
                    <View key={item.id} style={styles.quickActionGridCell}>
                      {renderQuickActionPill(item, true)}
                    </View>
                  ))}
                </View>
                <View style={styles.quickActionGridRow}>
                  {quickActionItems.slice(4, 8).map((item) => (
                    <View key={item.id} style={styles.quickActionGridCell}>
                      {renderQuickActionPill(item, true)}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.quickActionRowEight}>
                {quickActionItems.map((item) => (
                  <View key={item.id} style={styles.quickActionCellEight}>
                    {renderQuickActionPill(item, true)}
                  </View>
                ))}
              </View>
            )}
          </VionaGlassPanel>
          </View>
        ) : null}

        {!fashionHomeDesktopShellActive ? (
          <VionaGlassPanel style={[styles.trustStrip, { width: layout.inner }]} tone="cool">
            <View style={styles.trustStripRow}>
              {!isDesktopWeb ? (
                <View
                  style={[
                    styles.creditPill,
                    isTourist && styles.creditPillTourist,
                    { maxWidth: creditPillMax, flexShrink: 0 },
                  ]}
                >
                  <View style={styles.creditPillRow}>
                    {walletBalanceLoading ? (
                      <ActivityIndicator size="small" color={GOLD_ACCENT} accessibilityLabel={t('home.walletLoadingA11y')} />
                    ) : (
                      <Ionicons name="wallet-outline" size={14} color={GOLD_ACCENT} />
                    )}
                    <Text
                      style={styles.creditPillText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                      maxFontSizeMultiplier={1.15}
                    >
                      {walletChipLabel}
                    </Text>
                  </View>
                  {isTourist && !walletBalanceLoading ? (
                    <Text style={styles.creditPillSub} numberOfLines={2}>
                      {t('home.touristCreditsHint')}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Text style={[styles.trustStripHint, isDesktopWeb && styles.trustStripHintDesktop]}>{t('home.trustStripHint')}</Text>
            </View>
          </VionaGlassPanel>
        ) : null}

        <View
          onLayout={(e) => {
            if (fashionHomeDesktopShellActive) {
              impactCareScrollY.current = e.nativeEvent.layout.y;
            }
          }}
        >
          {fashionHomeDesktopShellActive ? (
            <View
              style={
                Platform.OS === 'web'
                  ? fashionHomeWebOpeningStageSharedRailWrapperStyle(layout.pad)
                  : { marginHorizontal: -layout.pad }
              }
            >
              <CharityWidget layoutVariant="desktopFashionCare" />
            </View>
          ) : (
            <VionaGlassPanel
              style={[styles.impactStrip, { width: layout.inner }]}
              tone="warm"
            >
              <View style={styles.impactStripRow}>
                <View style={styles.impactStripCopy}>
                  <Text style={styles.impactStripKicker}>{t('home.impact.kicker')}</Text>
                  <Text style={styles.impactStripTitle}>{t('home.impact.title')}</Text>
                  <Text style={styles.impactStripSubtitle}>{t('home.impact.subtitle')}</Text>
                </View>
                <Pressable
                  onPress={scrollToCareSection}
                  style={({ pressed }) => [styles.impactStripCta, pressed && { opacity: 0.88 }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.impact.title')}
                >
                  <Ionicons name="heart-outline" size={14} color={vionaTokens.fashionTech.champagne} />
                  <Text style={styles.impactStripCtaText}>{t('home.impact.stripCta')}</Text>
                </Pressable>
              </View>
            </VionaGlassPanel>
          )}
        </View>

        {!fashionHomeDesktopShellActive ? (
          <View
            style={[styles.charityWrap, { width: layout.inner }]}
            onLayout={(e) => {
              charitySectionY.current = e.nativeEvent.layout.y;
            }}
          >
            <CharityWidget layoutVariant="impactSecondary" />
          </View>
        ) : null}

        {isTourist && !fashionHomeDesktopShellActive ? (
          <DashboardB2CScreen contentWidth={layout.inner} />
        ) : null}

        {isTourist && featureFlags.leonaAssistantEnabled && !fashionHomeDesktopShellActive ? (
          <VionaCard style={{ width: layout.inner, marginBottom: theme.spacing.lg }} padded>
            <VionaSectionHeader title={t('home.survivalTitle')} subtitle={t('home.survivalSub')} />
            <View style={styles.survivalRow}>
              <Pressable
                onPress={openInterpreter}
                style={({ pressed }) => [styles.survivalChip, styles.survivalChipPrimary, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={t('home.liveInterpreter')}
              >
                <Ionicons name="mic" size={20} color={theme.hybrid.signalStrong} />
                <Text style={styles.survivalChipText}>{t('home.liveInterpreter')}</Text>
              </Pressable>
              <Pressable
                onPress={() => openProtected('LeonaCall')}
                style={({ pressed }) => [styles.survivalChip, styles.survivalChipPrimary, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={t('home.aiVoiceLine')}
              >
                <Ionicons name="call" size={20} color={theme.hybrid.signalStrong} />
                <Text style={styles.survivalChipText}>{t('home.aiVoiceLine')}</Text>
              </Pressable>
            </View>
          </VionaCard>
        ) : null}

        {!fashionHomeDesktopShellActive ? (
        <View style={[styles.actionCenter, { width: layout.inner }]}>
          <VionaInfoTile
            icon="qr-code"
            title={t('home.qrPayTitle')}
            lines={[t('home.qrPaySub')]}
            accent="gold"
            onPress={() => openProtected('Wallet')}
            accessibilityLabel={t('home.qrPayA11y')}
          />
          <VionaInfoTile
            icon="time-outline"
            title={t('home.dualClockTitle')}
            lines={[
              `${t('home.dualClockLocalLabel')} ${localClock}`,
              `${t('home.dualClockVnLabel')} ${vnClock}`,
            ]}
            accent="cyan"
          />
          {featureFlags.vigTokenEconomyEnabled ? (
            <VionaInfoTile
              icon="trending-up"
              title={t('home.vioIndexTitle', { label: getVioPointsLabel() })}
              lines={[t('home.vioIndexSub')]}
              accent="violet"
              onPress={() => navigation.navigate('LoyaltyRewards')}
              accessibilityLabel={`${getVioPointsLabel()} index`}
            />
          ) : null}
        </View>
        ) : null}

        {!fashionHomeDesktopShellActive ? (
        <View style={[styles.briefingBlock, { width: layout.inner }]}>
          <Text style={styles.briefingTitle}>{t('home.briefingTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.briefingRail}>
            {briefingCards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() =>
                  Alert.alert(card.headline, `${card.sub}\n\n${t('home.briefingAlertDemo')}`)
                }
                style={({ pressed }) => [pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={card.headline}
              >
                <VionaGlassPanel style={styles.briefingCard} tone="default">
                  <Text style={styles.briefingHeadline} numberOfLines={2}>
                    {card.headline}
                  </Text>
                  <Text style={styles.briefingSub} numberOfLines={2}>
                    {card.sub}
                  </Text>
                </VionaGlassPanel>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        ) : null}

        {!fashionHomeDesktopShellActive &&
        (featureFlags.academyLiteEnabled || featureFlags.leonaAssistantEnabled) ? (
          <ProactiveSuggestions onSelect={onSelectProactive} />
        ) : null}

        {!fashionHomeDesktopShellActive ? (
        <VionaCard style={{ width: layout.inner, marginBottom: theme.spacing.lg }} padded>
          <View style={styles.featureRow}>
            <Pressable
              onPress={isAdminDebugSurfaceEnabled() ? onSecretTap : undefined}
              style={({ pressed }) => [pressed && { opacity: 0.92 }]}
            >
              <VionaBrandLockup variant="header" />
            </Pressable>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>Tá»•ng Ä‘Ă i viĂŞn {inboundPersonaName}</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Sáşµn sĂ ng há»— trá»Ł</Text>
              </View>
              {isAdminDebugSurfaceEnabled() && adminUnlocked ? (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={theme.hybrid.signalStrong} />
                  <Text style={styles.adminBadgeText}>{t('home.adminUnlockedBadge')}</Text>
                </View>
              ) : null}
              {isAdminDebugSurfaceEnabled() ? (
                <Text style={styles.debugHint}>Gá»Łi Ă˝: cháşˇm nhanh logo 5 láş§n Ä‘á» má»ź khu vá»±c quáşŁn trá»‹ (dev).</Text>
              ) : null}
            </View>
          </View>
        </VionaCard>
        ) : null}

        {!isTourist && !fashionHomeDesktopShellActive ? <DashboardB2CScreen contentWidth={layout.inner} /> : null}

        {!fashionHomeDesktopShellActive ? (
        <VionaCard style={{ width: layout.inner, marginBottom: theme.spacing.lg }} padded>
          <Text style={styles.utilityStripTitle}>{t('home.utilityShortcutsTitle')}</Text>
          <View style={styles.utilityRow}>
            <Pressable
              onPress={() => openProtected('Vault')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>{t('home.vaultChipLabel')}</Text>
            </Pressable>
            {featureFlags.travelEnabled ? (
              <Pressable
                onPress={() =>
                  openMiniApp('travel', () => navigation.navigate('TravelCompanion'))
                }
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="airplane-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>{t('home.utilityTravelChip')}</Text>
              </Pressable>
            ) : null}
            {featureFlags.b2bAiReceptionistDemoEnabled ? (
              <Pressable
                onPress={() => openProtected('AiEye')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="scan-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>{t('home.utilityAiEyeChip')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => openProtected('Wallet')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="wallet-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>{t('home.utilityWalletChip')}</Text>
            </Pressable>
            {featureFlags.leonaAssistantEnabled ? (
              <Pressable
                onPress={() => openProtected('LeonaCall')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="call-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>{outboundPersonaName}</Text>
              </Pressable>
            ) : null}
          </View>
        </VionaCard>
        ) : null}
      </ScrollView>

      <PersonaOnboardingModal
        visible={personaModalVisible}
        onPickExpat={() => applyPersonaChoice('EXPAT')}
        onPickTourist={() => applyPersonaChoice('TOURIST')}
      />

      <AuthPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onContinue={() => {
          setShowPaywall(false);
          navigation.navigate('Login');
        }}
      />

      {isAdminDebugSurfaceEnabled() && showPin ? (
        <View style={styles.pinOverlay}>
          <View style={[styles.pinCard, { maxWidth: Math.min(width - 48, 400) }]}>
            <Text style={styles.pinTitle}>Super Admin</Text>
            <Text style={styles.pinHint}>
              Nháş­p mĂŁ PIN cáşĄu hĂ¬nh qua biáşżn mĂ´i trĆ°á»ťng build (khĂ´ng dĂąng máş·c Ä‘á»‹nh trong mĂŁ nguá»“n).
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="PIN"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
              secureTextEntry
              style={styles.pinInput}
              placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <AppButton
              label="Má»ź Dashboard"
              variant="danger"
              onPress={() => {
                if (!isAdminDebugPinConfigured()) {
                  setPinError(
                    'Admin PIN chá»‰ há»— trá»Ł trong build dev vĂ  yĂŞu cáş§u EXPO_PUBLIC_ADMIN_PIN >= 12 kĂ˝ tá»±.'
                  );
                  return;
                }
                const expected = getConfiguredAdminDebugPin();
                if (pinInput === expected) {
                  setShowPin(false);
                  setAdminUnlocked(true);
                  void AsyncStorage.setItem(ADMIN_UNLOCK_KEY, '1');
                  navigation.navigate('AdminDashboard');
                  return;
                }
                setPinError('Sai PIN');
              }}
            />
            <AppButton label="Há»§y" variant="ghost" onPress={() => setShowPin(false)} />
          </View>
        </View>
      ) : null}
      </SafeAreaView>
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
  );
}

const styles = StyleSheet.create({
  rootFill: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  rootFillFashion: {
    backgroundColor: vionaTokens.fashionTech.canvas,
  },
  rootFillWeb: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  fashionShellOuter: {
    width: '100%',
    backgroundColor: vionaTokens.fashionTech.canvas,
    position: 'relative',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {},
  scrollContentFashion: {
    width: '100%',
    alignSelf: 'stretch',
  },
  fashionDesktopWebOpeningStage: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  ftHeroBleedFashion: {
    marginBottom: 0,
  },
  desktopHeroFrameShell: {
    position: 'relative',
    width: '100%',
  },
  desktopHeroShell: {
    position: 'relative',
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    overflow: 'hidden',
    backgroundColor: vionaTokens.fashionTech.canvasElevated,
    shadowColor: FASHION_HOME_FRAME_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  desktopHeroShellDaylight: {
    backgroundColor: FASHION_HOME_DAYLIGHT_CANVAS_ELEVATED,
    shadowColor: FASHION_HOME_DAYLIGHT_FRAME_GLOW,
    shadowRadius: 5,
  },
  desktopHeroLuminousVeil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  desktopHeroLiftOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  desktopHeroEdgeOverlay: {
    pointerEvents: 'none',
  },
  desktopHeroGoldAccent: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: 0,
    height: 1,
    zIndex: 4,
  },
  desktopHeroCyanEdge: {
    position: 'absolute',
    right: 0,
    top: '12%',
    bottom: '12%',
    width: 1,
    backgroundColor: FASHION_HOME_LINE_CYAN,
    zIndex: 4,
  },
  desktopHeroCyanEdgeDaylight: {
    backgroundColor: FASHION_HOME_DAYLIGHT_HERO_CYAN_EDGE,
  },
  desktopHeroBottomCyanEdge: {
    position: 'absolute',
    left: '18%',
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: FASHION_HOME_LINE_CYAN,
    zIndex: 4,
  },
  desktopHeroBottomCyanEdgeDaylight: {
    backgroundColor: FASHION_HOME_DAYLIGHT_HERO_CYAN_EDGE,
  },
  desktopHeroImageClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#0a1018',
  },
  desktopHeroImageClipDaylight: {
    backgroundColor: 'rgb(14, 20, 32)',
  },
  desktopHeroReadabilityScrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '48%',
    maxWidth: 560,
    zIndex: 1,
  },
  desktopHeroInnerVignette: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  desktopHeroBottomHandoff: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    zIndex: 2,
    pointerEvents: 'none',
  },
  desktopHeroBottomHandoffWebTight: {
    height: '17%',
  },
  desktopHeroEyebrowDaylight: {
    color: FASHION_HOME_DAYLIGHT_EYEBROW,
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  desktopHeroHeadlineDaylight: {
    color: FASHION_HOME_DAYLIGHT_HEADLINE,
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 16,
  },
  desktopHeroSubtitleDaylight: {
    color: FASHION_HOME_DAYLIGHT_SUBTITLE,
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  desktopHeroCtaSecondaryDaylight: {
    borderColor: 'rgba(140, 210, 255, 0.42)',
    backgroundColor: 'rgba(12, 20, 34, 0.72)',
    shadowColor: 'rgba(120, 200, 255, 0.32)',
    shadowOpacity: 0.28,
  },
  desktopHeroCtaSecondaryTextDaylight: {
    color: 'rgba(230, 244, 255, 0.96)',
  },
  desktopHeroStatusStripDaylight: {
    borderColor: 'rgba(233, 199, 120, 0.34)',
    backgroundColor: 'rgba(8, 14, 24, 0.62)',
  },
  desktopHeroStatusTextDaylight: {
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 6,
  },
  desktopHeroConnectedChipTextDaylight: {
    color: 'rgba(248, 250, 255, 0.94)',
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 6,
  },
  desktopHeroLivingStatusCapsuleDaylight: {
    borderColor: 'rgba(252, 228, 180, 0.52)',
    backgroundColor: 'rgba(10, 16, 28, 0.78)',
  },
  desktopHeroLivingStatusClockDaylight: {
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
  },
  desktopHeroLivingStatusRegionDaylight: {
    color: 'rgba(236, 244, 255, 0.94)',
    opacity: 0.96,
  },
  desktopHeroInnerFrame: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    borderRadius: vionaTokens.radius.xxl - 1,
    borderWidth: 0,
    zIndex: 4,
  },
  desktopHeroImageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  desktopHeroLivingStatusCapsule: {
    position: 'absolute',
    top: vionaTokens.spacing[16],
    right: vionaTokens.spacing[16],
    zIndex: 5,
    maxWidth: '32%',
    minWidth: 148,
    paddingVertical: vionaTokens.spacing[6],
    paddingHorizontal: vionaTokens.spacing[8],
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: FASHION_HOME_LINE_GOLD,
    backgroundColor: 'rgba(6, 10, 18, 0.68)',
    gap: 1,
    shadowColor: FASHION_HOME_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  desktopHeroLivingStatusCapsuleNarrow: {
    top: vionaTokens.spacing[16],
    right: vionaTokens.spacing[16],
    left: vionaTokens.spacing[16],
    maxWidth: '100%',
    minWidth: 0,
    alignSelf: 'flex-start',
  },
  desktopHeroLivingStatusCapsuleHighlight: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 1,
    height: 1,
    borderTopLeftRadius: vionaTokens.radius.lg,
    borderTopRightRadius: vionaTokens.radius.lg,
    backgroundColor: FASHION_HOME_INNER_HIGHLIGHT,
  },
  desktopHeroLivingStatusClock: {
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    letterSpacing: 0.28,
    lineHeight: 22,
    color: vionaTokens.fashionTech.champagne,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(5, 10, 18, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  desktopHeroLivingStatusRegion: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.12,
    lineHeight: 15,
    color: vionaTokens.fashionTech.inkOnDark,
    opacity: 0.9,
  },
  desktopHeroForeground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    paddingHorizontal: vionaTokens.spacing[24],
    paddingTop: vionaTokens.spacing[24],
    paddingBottom: vionaTokens.spacing[24],
    justifyContent: 'center',
  },
  desktopHeroForegroundLandscape: {
    paddingTop: vionaTokens.spacing[20],
    paddingBottom: vionaTokens.spacing[24],
    paddingHorizontal: vionaTokens.spacing[16],
  },
  desktopHeroCopy: {
    flex: 1,
    minWidth: 0,
    maxWidth: 520,
    zIndex: 2,
    gap: vionaTokens.spacing[8],
    justifyContent: 'center',
  },
  desktopHeroHeadline: {
    fontSize: 32,
    lineHeight: 38,
    color: '#fcfdff',
    fontFamily: FontFamily.extrabold,
    textShadowColor: 'rgba(3, 6, 12, 0.52)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 14,
  },
  desktopHeroHeadlineSm: {
    fontSize: 28,
    lineHeight: 34,
  },
  desktopHeroHeadlineXs: {
    fontSize: 24,
    lineHeight: 30,
  },
  desktopHeroCtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
    marginTop: vionaTokens.spacing[4],
  },
  desktopHeroCtaPrimary: {
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 232, 188, 0.72)',
    overflow: 'hidden',
    shadowColor: 'rgba(233, 199, 120, 0.55)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 4,
  },
  desktopHeroCtaPrimaryDaylight: {
    borderColor: 'rgba(255, 240, 210, 0.82)',
    shadowColor: 'rgba(255, 220, 160, 0.5)',
    shadowOpacity: 0.52,
    shadowRadius: 12,
  },
  desktopHeroCtaPrimaryFill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: vionaTokens.radius.pill,
  },
  desktopHeroCtaPrimaryText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    color: vionaTokens.fashionTech.canvas,
    letterSpacing: 0.3,
  },
  desktopHeroCtaPrimaryTextDaylight: {
    color: 'rgb(10, 14, 22)',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 4,
  },
  desktopHeroCtaSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(112, 200, 255, 0.34)',
    backgroundColor: 'rgba(8, 14, 22, 0.68)',
    shadowColor: 'rgba(112, 200, 255, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
  },
  desktopHeroCtaSecondaryText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: 'rgba(214, 236, 255, 0.92)',
  },
  desktopHeroStatusStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: vionaTokens.spacing[6],
    marginTop: vionaTokens.spacing[12],
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(233, 199, 120, 0.22)',
    backgroundColor: 'rgba(4, 8, 14, 0.72)',
  },
  desktopHeroStatusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  desktopHeroStatusDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(233, 199, 120, 0.2)',
  },
  desktopHeroStatusText: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(244, 246, 250, 0.82)',
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.15,
  },
  desktopHeroImageSpacer: {
    flex: 1,
    minWidth: 0,
  },
  desktopHeroConnectedChip: {
    position: 'absolute',
    right: vionaTokens.spacing[16],
    bottom: vionaTokens.spacing[16],
    maxWidth: '46%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.32)',
    backgroundColor: 'rgba(6, 10, 18, 0.72)',
    zIndex: 3,
  },
  desktopHeroConnectedChipDaylight: {
    borderColor: 'rgba(252, 228, 180, 0.42)',
    backgroundColor: 'rgba(10, 16, 26, 0.78)',
    shadowColor: FASHION_HOME_DAYLIGHT_CHIP_CONTAINED_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 2,
  },
  desktopHeroConnectedChipText: {
    fontSize: 11,
    lineHeight: 15,
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.medium,
  },
  ftCardGridFashionSibling: {
    marginTop:
      FASHION_HOME_WORLD_CARD_HERO_BREATHING_TOP_PX - FASHION_HOME_WORLD_CARD_STAGE_LAP_PX,
    marginBottom: vionaTokens.spacing[8],
  },
  ftHeroBleed: {
    marginBottom: vionaTokens.spacing[20],
  },
  ftHero: {
    borderRadius: vionaTokens.radius.xxl,
    paddingHorizontal: vionaTokens.spacing[24],
    paddingVertical: vionaTokens.spacing[32],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    backgroundColor: vionaTokens.fashionTech.surfaceGlass,
    ...vionaTokens.shadows.hero,
  },
  ftHeroMain: {
    gap: vionaTokens.spacing[20],
    marginBottom: vionaTokens.spacing[24],
  },
  ftCopyCol: {
    flex: 1,
    minWidth: 0,
    maxWidth: 560,
    paddingRight: vionaTokens.spacing[4],
    justifyContent: 'center',
  },
  desktopHeroSubtitleNarrow: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '100%',
  },
  desktopHeroEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(248, 220, 156, 0.96)',
    fontFamily: FontFamily.semibold,
    marginBottom: vionaTokens.spacing[12],
    textShadowColor: 'rgba(5, 10, 18, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  desktopHeroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(244, 246, 250, 0.88)',
    fontFamily: FontFamily.medium,
    maxWidth: 520,
    textShadowColor: 'rgba(3, 6, 12, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ftEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: vionaTokens.fashionTech.champagne,
    fontFamily: FontFamily.semibold,
    marginBottom: vionaTokens.spacing[12],
  },
  ftHeadline: {
    fontSize: 28,
    lineHeight: 34,
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.extrabold,
    marginBottom: vionaTokens.spacing[12],
    maxWidth: 560,
  },
  ftHeadlineCompact: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: vionaTokens.spacing[12],
  },
  ftSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.medium,
    maxWidth: 520,
  },
  ftSubtitleNarrow: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '100%',
  },
  ftVisualPanel: {
    flex: 1,
    minHeight: 280,
    minWidth: 0,
    position: 'relative',
    borderRadius: vionaTokens.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.36)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  ftVisualImageClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ftVisualImageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  ftVisualBottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  cardImageLocal: {
    transform: [{ scale: 1.02 }, { translateX: 0 }],
  },
  cardImageTravel: {
    transform: [{ scale: 1.02 }, { translateX: 0 }],
  },
  cardImageAcademy: {
    transform: [{ scale: 1.02 }, { translateX: 0 }],
  },
  /** Match peers: centered frame, light zoom only. */
  cardImageBusiness: {
    transform: [{ scale: 1.02 }, { translateX: 0 }],
  },
  ftCardRailScrollOuter: {
    marginTop: FASHION_HOME_WORLD_CARD_HERO_BREATHING_TOP_PX + 10,
    marginHorizontal: -vionaTokens.spacing[4],
    paddingBottom: vionaTokens.spacing[12],
  },
  ftCardRailContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: vionaTokens.spacing[12],
    paddingRight: vionaTokens.spacing[16],
    paddingBottom: vionaTokens.spacing[8],
  },
  ftCardRailCell: {
    width: 276,
    flexShrink: 0,
  },
  ftCardCarouselCell: {
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  ftCardGrid: {
    gap: vionaTokens.spacing[12],
    marginTop: 0,
    paddingBottom: vionaTokens.spacing[8],
  },
  ftCardCell: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 240,
    maxWidth: '100%',
  },
  ftCardCellSingle: {
    flexBasis: '100%',
    minWidth: 0,
    maxWidth: '100%',
  },
  ftCardCellTwoColMobile: {
    flexBasis: '48%',
    minWidth: 160,
    maxWidth: '100%',
  },
  ftCardCellQuarter: {
    flexBasis: '23%',
    minWidth: 200,
  },
  /** Equal-width columns for the four primary world cards on desktop fashion home. */
  ftCardCellFashionDesktop: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  trustStripHintDesktop: {
    flex: 1,
    textAlign: 'right',
  },
  trustStrip: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[16],
  },
  quickActionStrip: {
    alignSelf: 'center',
    marginTop: -vionaTokens.spacing[4],
    marginBottom: theme.spacing.md,
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[16],
    borderWidth: 1,
    borderColor: FASHION_HOME_LINE_GOLD,
    backgroundColor: 'rgba(8, 12, 20, 0.42)',
    shadowColor: FASHION_HOME_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionStripFashion: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 0,
    borderWidth: 1,
    borderColor: FASHION_HOME_LINE_GOLD,
    backgroundColor: 'rgba(8, 12, 20, 0.34)',
    shadowColor: FASHION_HOME_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionStripFashionDaylight: {
    borderColor: 'rgba(242, 212, 136, 0.44)',
    backgroundColor: 'rgba(12, 18, 30, 0.52)',
    shadowColor: 'rgba(238, 206, 128, 0.24)',
    shadowRadius: 6,
  },
  quickActionPrompt: {
    fontSize: 13,
    lineHeight: 18,
    color: vionaTokens.fashionTech.champagne,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    marginBottom: vionaTokens.spacing[12],
  },
  quickActionPromptDaylight: {
    color: 'rgba(255, 244, 220, 0.98)',
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 8,
  },
  quickActionPillDaylightBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 36,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 0,
    elevation: 1,
    overflow: 'hidden',
  },
  quickActionPillDaylightFill: {
    width: '100%',
    minWidth: 0,
  },
  quickActionPillDaylightPressed: {
    opacity: 0.88,
  },
  quickActionPillDaylightSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 14,
    zIndex: 1,
    pointerEvents: 'none',
  },
  quickActionPillDaylightInnerRimWrap: {
    zIndex: 2,
    pointerEvents: 'none',
  },
  quickActionPillDaylightIconCapsule: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  quickActionPillDaylightIconCapsuleWeb: {
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -6px 10px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.05)',
  },
  quickActionPillDaylightLabel: {
    zIndex: 3,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(248, 250, 252, 0.98)',
    fontFamily: FontFamily.semibold,
    textShadowColor: FASHION_HOME_DAYLIGHT_TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 6,
  },
  quickActionPillDaylightLabelSos: {
    color: vionaTokens.fashionTech.sosNeon,
  },
  worldCardGlassLayers: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 8,
    pointerEvents: 'none',
  },
  worldCardGlassCornerLitTl: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '38%',
    height: '30%',
    zIndex: 1,
  },
  worldCardGlassCornerBoost: {
    opacity: 1.16,
  },
  worldCardGlassCornerLitTr: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '34%',
    height: '26%',
    zIndex: 1,
  },
  worldCardGlassDiagonalSpec: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '36%',
    height: '44%',
    zIndex: 2,
    opacity: 1,
  },
  worldCardGlassDiagonalSpecHover: {
    opacity: 1.08,
  },
  worldCardGlassSurfaceSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '14%',
    opacity: 1,
    zIndex: 3,
  },
  worldCardGlassLayerBoost: {
    opacity: 1.04,
  },
  worldCardGlassInnerGlow: {
    position: 'absolute',
    left: 0,
    width: '48%',
    top: 0,
    height: '26%',
    opacity: 1,
    zIndex: 4,
  },
  worldCardGlassBottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '22%',
    zIndex: 5,
  },
  worldCardGlassInnerRim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
  worldCardGlassInnerRimHover: {
    opacity: 1.06,
  },
  worldCardGlassHoverEdgeSweep: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    top: '18%',
    height: '38%',
    zIndex: 8,
    opacity: 0.64,
  },
  worldCardGlassHoverEdgeSweepBoost: {
    opacity: 0.96,
  },
  worldCardGlassTopRefractionGrad: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
    height: 4,
    zIndex: 9,
  },
  worldCardGlassTopRefraction: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 9,
  },
  worldCardGlassRefractionBoost: {
    opacity: 1.12,
    height: 4,
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
  },
  quickActionRowEight: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: vionaTokens.spacing[8],
    alignItems: 'stretch',
  },
  quickActionCellEight: {
    flex: 1,
    minWidth: 0,
  },
  quickActionGrid: {
    gap: vionaTokens.spacing[8],
  },
  quickActionGridRow: {
    flexDirection: 'row',
    gap: vionaTokens.spacing[8],
    alignItems: 'stretch',
  },
  quickActionGridCell: {
    flex: 1,
    minWidth: 0,
  },
  quickActionRowScroll: {
    flexGrow: 0,
    maxWidth: '100%',
  },
  quickActionRowScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vionaTokens.spacing[8],
    paddingRight: vionaTokens.spacing[8],
  },
  impactStrip: {
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: vionaTokens.spacing[16],
    paddingHorizontal: vionaTokens.spacing[16],
  },
  impactStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[12],
    flexWrap: 'wrap',
  },
  impactStripCopy: {
    flex: 1,
    minWidth: 180,
    gap: 4,
  },
  impactStripKicker: {
    fontSize: 11,
    lineHeight: 16,
    color: vionaTokens.fashionTech.champagneMuted,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  impactStripTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.extrabold,
  },
  impactStripSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: vionaTokens.fashionTech.textSecondary,
    fontFamily: FontFamily.medium,
  },
  impactStripCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 124, 198, 0.42)',
    backgroundColor: 'rgba(255, 124, 198, 0.12)',
  },
  impactStripCtaText: {
    fontSize: 12,
    lineHeight: 16,
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.semibold,
  },
  trustStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vionaTokens.spacing[12],
    flexWrap: 'wrap',
  },
  trustStripHint: {
    flex: 1,
    minWidth: 120,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.textSecondary,
    fontFamily: FontFamily.medium,
  },
  creditPill: {
    minWidth: 170,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: CARD_BG,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  creditPillTourist: {
    borderColor: 'rgba(212, 175, 55, 0.85)',
    shadowOpacity: 0.12,
  },
  creditPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  creditPillText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.semibold,
    flexShrink: 1,
    minWidth: 0,
  },
  creditPillSub: {
    fontSize: 10,
    lineHeight: 13,
    color: GOLD_ACCENT,
    fontFamily: FontFamily.semibold,
    textAlign: 'left',
    maxWidth: 168,
  },
  survivalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  survivalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
    flexGrow: 1,
    minWidth: 140,
  },
  survivalChipPrimary: {
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
  },
  survivalChipText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
    flexShrink: 1,
  },
  actionCenter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  briefingBlock: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  briefingTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  briefingRail: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 4,
    paddingBottom: 4,
  },
  briefingCard: {
    width: 220,
    minHeight: 92,
    borderRadius: 16,
    padding: 14,
  },
  briefingHeadline: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: TEXT_PRIMARY,
    marginBottom: 6,
    lineHeight: 18,
  },
  briefingSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(244, 246, 250, 0.92)',
    lineHeight: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  onlineText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontFamily: FontFamily.medium,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    marginBottom: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    color: theme.hybrid.signalStrong,
    fontFamily: FontFamily.semibold,
  },
  debugHint: {
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
  },
  charityWrap: {
    marginTop: vionaTokens.spacing[8],
    marginBottom: theme.spacing.md,
  },
  utilityStripTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: FontFamily.semibold,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  utilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
  },
  utilityChipText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.semibold,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 22, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pinCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: CARD_BG,
    padding: theme.spacing.lg,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  pinTitle: {
    fontSize: 20,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  pinHint: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  pinInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
    paddingHorizontal: 12,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  pinError: {
    fontSize: 12,
    color: theme.colors.danger,
    fontFamily: FontFamily.regular,
    marginBottom: 8,
  },
});
