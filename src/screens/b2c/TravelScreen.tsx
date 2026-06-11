import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AccessibilityInfo,
  Easing,
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
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { TravelAppTile, travelAppTileMetrics, travelPerspectiveCardMetrics } from '../../components/travel/TravelAppTile';
import { resolveTravelQuickHelpHeroNetworkColors } from '../../components/travel/travelCardNetworkSemantic';
import { TravelHeroLightingNetwork } from '../../components/travel/TravelHeroLightingNetwork';
import { resolveTravelHeroNetworkLighting } from '../../components/travel/travelHeroSemanticLighting';
import {
  FASHION_HOME_DAYLIGHT_TRANSITION_MS,
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX,
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX,
  FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX,
  computeFashionHomeWebMagneticOffset,
  fashionHomeWebMagneticMotionStyle,
  fashionHomeWebOpeningStageCardCellStyle,
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
  useFashionHomePrefersReducedMotion,
  isHubTabletPortraitViewport,
  isHubWebTabletFullBleedViewport,
  hubWebEffectiveContentWidth,
  hubResponsiveContentShellStyle,
  useHubWebShellCompensation,
  type FashionHomeWebMagneticOffset,
} from '../../components/viona/fashionHomeDesktopShell';
import { useFullscreenMode } from '../../hooks/useFullscreenMode';
import {
  localConstellation,
} from '../../components/local/localConstellationTokens';
import { VionaMiniAppShell, VIONA_TABLET_MIN_WIDTH } from '../../components/viona/VionaMiniAppShell';
import { useVionaGlobalTopRailWebLegacySuppression } from '../../components/viona/VionaGlobalTopRail';
import { VionaBottomEscapeBar } from '../../components/viona/VionaBottomEscapeBar';
import { VionaSosHoldGateModal } from '../../components/viona/VionaSosHoldGateModal';
import { VionaSosPlusInfoModal } from '../../components/viona/VionaSosPlusInfoModal';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { SOS_PLUS_PRODUCT_SURFACE_UI_ENABLED } from '../../config/sosPlusSurface';
import { SOS_PLUS_PROFILE_UI_ENABLED } from '../../config/sosPlusProduction';
import { useHomeCommand } from '../../context/HomeCommandContext';
import {
  TravelGlassCard,
  TravelIconCapsule,
  travelSemanticTokens,
  type TravelSemanticAccent,
} from '../../components/travel/TravelGlassCard';
import { getAllTravelDirections, getTravelDirectionById } from '../../core/travel';
import type {
  TravelDirectionCommercialStatus,
  TravelDirectionDefinition,
  TravelDirectionId,
} from '../../core/travel/travelDirectionTypes';
import { useMiniAppEntry } from '../../hooks/useMiniAppEntry';
import { useTranslation } from '../../i18n';
import { persistUserLanguage } from '../../i18n/persistLanguage';
import { MAIN_TAB, type RootStackParamList, type RootTabParamList } from '../../navigation/routes';
import { useAuth } from '../../context/AuthContext';
import { useSmartTrio } from '../../context/SmartTrioContext';
import type { MarketCode } from '../../core/i18n/smartTrioTypes';
import {
  getTravelLocationConsentState,
  setTravelLocationConsent,
} from '../../services/compliance/sensorConsent';
import { getTravelContext } from '../../services/context/UserContextService';
import { listVietnameseRestaurantsByProximity, type CravingsRadarHit } from '../../services/travel/travelCravingsRadar';
import { openDirectionsExternally, openOsmSearchQuery } from '../../utils/mapExternalLinks';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

function weatherLabelKey(weatherCode: number): string {
  if (weatherCode < 20) return 'clear';
  if (weatherCode < 50) return 'cloudy';
  if (weatherCode < 70) return 'lightRain';
  if (weatherCode < 90) return 'storms';
  return 'watch';
}

function fxLabelKey(homeCountryCode: string | undefined): string {
  const cc = (homeCountryCode ?? 'EU').toUpperCase();
  if (cc === 'CZ') return 'cz';
  if (cc === 'PL') return 'pl';
  if (cc === 'VN') return 'vn';
  return 'default';
}

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const INK_SUB = localConstellation.inkCardSub;
const CYAN = localConstellation.accentCyan;
const EMERALD = localConstellation.accentEmerald;
const BORDER = localConstellation.border;

type TravelLocalDiscoveryCategoryAccent = 'emerald' | 'cyan' | 'violet' | 'magenta' | 'gold';

type TravelLocalDiscoveryCategory = Readonly<{
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelLocalDiscoveryCategoryAccent;
}>;

type TravelLocalDiscoveryPreviewItem = Readonly<{
  id: string;
  label: string;
  categoryId: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelLocalDiscoveryCategoryAccent;
}>;

/** Wave3b — static discovery categories; preview only, not live verified listings. */
const TRAVEL_LOCAL_DISCOVERY_CATEGORY_DEFS = [
  { id: 'nearby-services', icon: 'storefront-outline', accent: 'emerald' },
  { id: 'helpers', icon: 'people-outline', accent: 'cyan' },
  { id: 'interpreter', icon: 'language-outline', accent: 'violet' },
  { id: 'transport', icon: 'bus-outline', accent: 'cyan' },
  { id: 'health', icon: 'medkit-outline', accent: 'magenta' },
  { id: 'viet-food', icon: 'restaurant-outline', accent: 'emerald' },
  { id: 'documents', icon: 'document-text-outline', accent: 'gold' },
  { id: 'community', icon: 'people-circle-outline', accent: 'cyan' },
] as const satisfies readonly {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelLocalDiscoveryCategoryAccent;
}[];

const TRAVEL_LOCAL_DISCOVERY_PREVIEW_DEFS = [
  { id: 'pharmacy', categoryId: 'health', icon: 'medkit-outline', accent: 'magenta' },
  { id: 'viet-restaurant', categoryId: 'viet-food', icon: 'restaurant-outline', accent: 'emerald' },
  { id: 'embassy', categoryId: 'documents', icon: 'business-outline', accent: 'gold' },
] as const satisfies readonly {
  id: string;
  categoryId: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelLocalDiscoveryCategoryAccent;
}[];

function resolveTravelLocalDiscoveryCategories(
  t: (key: string) => string
): readonly TravelLocalDiscoveryCategory[] {
  return TRAVEL_LOCAL_DISCOVERY_CATEGORY_DEFS.map((category) => ({
    ...category,
    label: t(`travelHub.localDiscovery.category.${category.id}`),
  }));
}

function resolveTravelLocalDiscoveryPreviewItems(
  t: (key: string) => string
): readonly TravelLocalDiscoveryPreviewItem[] {
  return TRAVEL_LOCAL_DISCOVERY_PREVIEW_DEFS.map((item) => ({
    ...item,
    label: t(`travelHub.localDiscovery.preview.${item.id}`),
  }));
}

function travelLocalDiscoveryAccentColors(accent: TravelLocalDiscoveryCategoryAccent): Readonly<{
  border: string;
  bg: string;
  icon: string;
}> {
  switch (accent) {
    case 'emerald':
      return {
        border: 'rgba(98, 255, 228, 0.24)',
        bg: 'rgba(98, 255, 228, 0.08)',
        icon: 'rgba(168, 255, 232, 0.92)',
      };
    case 'violet':
      return {
        border: 'rgba(176, 148, 255, 0.24)',
        bg: 'rgba(120, 92, 255, 0.08)',
        icon: 'rgba(196, 180, 255, 0.92)',
      };
    case 'magenta':
      return {
        border: 'rgba(255, 132, 196, 0.22)',
        bg: 'rgba(255, 92, 168, 0.07)',
        icon: 'rgba(255, 196, 228, 0.92)',
      };
    case 'gold':
      return {
        border: 'rgba(232, 196, 120, 0.24)',
        bg: 'rgba(232, 196, 120, 0.07)',
        icon: 'rgba(232, 210, 160, 0.92)',
      };
    case 'cyan':
    default:
      return {
        border: 'rgba(92, 205, 255, 0.22)',
        bg: 'rgba(92, 205, 255, 0.08)',
        icon: 'rgba(148, 228, 255, 0.9)',
      };
  }
}

/** Operator-approved dynamic-hero Travel lane (main repo source of truth). */
const TRAVEL_DYN_HERO_AIRPORT_MASTER = require('../../../assets/viona/dynamic-hero/travel/travel-airport-web-normal-master-62h.png');
const TRAVEL_DYN_HERO_AIRPORT_CARD = require('../../../assets/viona/dynamic-hero/travel/travel-airport-web-normal-card-62y.png');
const TRAVEL_DYN_HERO_TRANSLATION_CARD = require('../../../assets/viona/dynamic-hero/travel/travel-translation-assist-web-normal-card-62y.png');
const TRAVEL_DYN_HERO_TRANSLATION_SOURCE = require('../../../assets/viona/dynamic-hero/travel/travel-translation-assist-web-normal-source.png');
const TRAVEL_DYN_HERO_RIDES_CARD = require('../../../assets/viona/dynamic-hero/travel/travel-rides-assist-web-normal-card-62y.png');
const TRAVEL_DYN_HERO_RIDES_SOURCE = require('../../../assets/viona/dynamic-hero/travel/travel-rides-assist-web-normal-source.png');
const TRAVEL_DYN_HERO_EMERGENCY_CARD = require('../../../assets/viona/dynamic-hero/travel/travel-emergency-police-web-normal-card-62y.png');
const TRAVEL_DYN_HERO_EMERGENCY_SOURCE = require('../../../assets/viona/dynamic-hero/travel/travel-emergency-police-web-normal-source.png');

/** Wave3b.8 — dedicated daylight cinematic cards (Experience Zone only; not opening hero). */
const TRAVEL_DESTINATION_LENS_SCENE = require('../../../assets/viona/travel/viona-travel-destination-lens-cinematic-daylight-v1.png');
const TRAVEL_LOCAL_CONCIERGE_SCENE = TRAVEL_DYN_HERO_AIRPORT_MASTER;
/** Pack 27/29 — Situation section premium light-network frame background (.png). */
const TRAVEL_SITUATION_NETWORK_BG_PREMIUM = require('../../../assets/viona/travel/viona-travel-situation-network-bg-premium-v1.png');
const TRAVEL_SITUATION_SECTION_BORDER_RADIUS_PX = 11;
const TRAVEL_DESTINATION_LENS_SCENE_OBJECT_POSITION = '74% 46%';

/** Pack 6 — deep cinematic band without over-dominating panel (300–340px desktop). */
function travelLocalConciergeSceneShellHeight(
  viewportWidth: number,
  openingStageFullscreen = false
): number {
  if (viewportWidth >= 1024) {
    return openingStageFullscreen ? 308 : 328;
  }
  if (viewportWidth >= 768) {
    return openingStageFullscreen ? 292 : 276;
  }
  if (viewportWidth >= 520) {
    return 228;
  }
  return 200;
}

/** Pack 6 — panel minHeight: room for header/search/scene/dock/demo/CTA/safety, not image-only. */
function travelLocalConciergePanelMinHeight(
  viewportWidth: number,
  openingStageFullscreen = false
): number | undefined {
  if (viewportWidth >= 1024) {
    return openingStageFullscreen ? 580 : 620;
  }
  if (viewportWidth >= 768) {
    return 520;
  }
  if (viewportWidth >= 520) {
    return 480;
  }
  return undefined;
}

/** Pack 5 — focal: vertical street depth (45% Y), slight right bias on wide desktop. */
function travelLocalConciergeSceneObjectPosition(
  viewportWidth: number,
  viewportHeight: number,
  openingStageFullscreen = false
): string {
  const portrait = viewportHeight > viewportWidth;
  if (openingStageFullscreen && viewportWidth >= 1024) {
    return portrait ? '54% 45%' : '60% 45%';
  }
  if (viewportWidth >= 1024) {
    return portrait ? '52% 45%' : '58% 45%';
  }
  if (viewportWidth >= 768) {
    return portrait ? '50% 45%' : '56% 45%';
  }
  return portrait ? '50% 45%' : '52% 45%';
}

function travelLocalConciergeMapShellHeight(
  _baseHeight: number,
  viewportWidth: number,
  openingStageFullscreen = false
): number {
  return travelLocalConciergeSceneShellHeight(viewportWidth, openingStageFullscreen);
}

/** Pack 1 — safe module → uri resolver; never throws (web + native). */
function resolveTravelImageUri(asset: ImageSourcePropType): string | undefined {
  try {
    const source: unknown = asset;
    if (typeof source === 'string' && source.length > 0) return source;
    if (typeof source === 'number') {
      const resolver = Image.resolveAssetSource;
      if (typeof resolver === 'function') {
        const resolved = resolver(source);
        if (typeof resolved?.uri === 'string' && resolved.uri.length > 0) {
          return resolved.uri;
        }
      }
      return undefined;
    }
    if (source && typeof source === 'object') {
      const record = source as Readonly<Record<string, unknown>>;
      if (typeof record.uri === 'string' && record.uri.length > 0) {
        return record.uri;
      }
      const nestedDefault = record.default;
      if (typeof nestedDefault === 'string' && nestedDefault.length > 0) {
        return nestedDefault;
      }
      if (nestedDefault && typeof nestedDefault === 'object') {
        const nestedUri = (nestedDefault as Readonly<Record<string, unknown>>).uri;
        if (typeof nestedUri === 'string' && nestedUri.length > 0) {
          return nestedUri;
        }
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function travelLocalConciergeSceneGradientFallbackStyle(): ViewStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 14, 24, 0.92)',
    backgroundImage:
      'linear-gradient(135deg, rgba(24, 48, 64, 0.95) 0%, rgba(8, 16, 28, 0.88) 55%, rgba(12, 28, 36, 0.82) 100%)',
  } as ViewStyle;
}

function travelLocalConciergeSceneWebBackgroundStyle(
  objectPosition: string,
  assetUri: string
): ViewStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: `url("${assetUri}")`,
    backgroundSize: 'cover',
    backgroundPosition: objectPosition,
    backgroundRepeat: 'no-repeat',
  } as ViewStyle;
}

function travelDestinationFxDisplayParts(
  fxLine: string,
  t: (key: string) => string
): Readonly<{ currency: string; demoNote: string }> {
  const stripped = fxLine.replace(/\s*\(tham chiếu demo\)\s*/i, '').replace(/\s*\(demo reference\)\s*/i, '').trim();
  return {
    currency: stripped.length > 0 ? stripped : fxLine,
    demoNote: t('travelHub.experienceZone.destinationLens.demoNote'),
  };
}

/** Wave3b — Destination Context Strip: weather + FX preview (demo only; no live production claims). */
type TravelWeatherMood =
  | 'clear'
  | 'sunny'
  | 'partlyCloudy'
  | 'lightRain'
  | 'overcast'
  | 'goldenHour'
  | 'windy'
  | 'nightClear';

type TravelWeatherDaypart = 'morning' | 'day' | 'goldenHour' | 'night';

type DestinationWeatherDayPreview = Readonly<{
  id: string;
  dayLabel: string;
  tempC: number;
  conditionLabel: string;
  mood: TravelWeatherMood;
  daypart: TravelWeatherDaypart;
  isToday?: boolean;
}>;

/** Static demo weather day ids — labels resolved via i18n at render time. */
const TRAVEL_WEATHER_DEMO_DAY_DEFS = [
  { id: 'today', tempC: 22, mood: 'clear' as const, daypart: 'day' as const, isToday: true },
  { id: 't3', tempC: 21, mood: 'partlyCloudy' as const, daypart: 'morning' as const },
  { id: 't4', tempC: 19, mood: 'lightRain' as const, daypart: 'day' as const },
  { id: 't5', tempC: 23, mood: 'goldenHour' as const, daypart: 'goldenHour' as const },
  { id: 't6', tempC: 18, mood: 'overcast' as const, daypart: 'night' as const },
  { id: 't7', tempC: 17, mood: 'windy' as const, daypart: 'morning' as const },
  { id: 'cn', tempC: 20, mood: 'sunny' as const, daypart: 'day' as const },
] as const;

type TravelWeatherCinematicCardTier = 'mobile' | 'tablet' | 'desktop';

function travelWeatherCinematicCardMetrics(
  tier: TravelWeatherCinematicCardTier,
  isToday = false,
  widthOverride?: number
): Readonly<{
  width: number;
  height: number;
  iconSize: number;
  borderRadius: number;
}> {
  const todayWidthBump = tier === 'mobile' ? 8 : 4;
  if (widthOverride != null) {
    const height = tier === 'desktop' ? 128 : 128;
    const iconSize = tier === 'mobile' ? 15 : tier === 'tablet' ? 16 : 17;
    const borderRadius = tier === 'desktop' ? 15 : 14;
    return { width: widthOverride, height, iconSize, borderRadius };
  }
  switch (tier) {
    case 'mobile':
      return {
        width: 136 + (isToday ? todayWidthBump : 0),
        height: 128,
        iconSize: 15,
        borderRadius: 14,
      };
    case 'tablet':
      return {
        width: 128 + (isToday ? todayWidthBump : 0),
        height: 128,
        iconSize: 16,
        borderRadius: 14,
      };
    case 'desktop':
    default:
      return {
        width: 118 + (isToday ? 8 : 0),
        height: 128,
        iconSize: 17,
        borderRadius: 15,
      };
  }
}

function travelWeatherComputeFitLayout(
  availableWidth: number,
  cardCount: number
): Readonly<{ cardWidth: number; gap: number; showScroll: boolean; todayWidthBump: number }> {
  const gap = 8;
  const minCard = 118;
  const maxCard = 128;
  const todayBump = 4;

  for (let cardWidth = maxCard; cardWidth >= minCard; cardWidth -= 1) {
    const totalWidth = cardCount * cardWidth + todayBump + (cardCount - 1) * gap;
    if (totalWidth <= availableWidth) {
      return { cardWidth, gap, showScroll: false, todayWidthBump: todayBump };
    }
  }

  return { cardWidth: minCard, gap, showScroll: true, todayWidthBump: 8 };
}

function travelWeatherCinematicCardTier(viewportWidth: number): TravelWeatherCinematicCardTier {
  if (viewportWidth >= 1024) return 'desktop';
  if (viewportWidth >= 768) return 'tablet';
  return 'mobile';
}

function travelWeatherMoodFromCode(weatherCode: number): TravelWeatherMood {
  if (weatherCode < 20) return 'clear';
  if (weatherCode < 50) return 'partlyCloudy';
  if (weatherCode < 70) return 'lightRain';
  if (weatherCode < 90) return 'overcast';
  return 'windy';
}

function travelWeatherMoodVisual(mood: TravelWeatherMood): Readonly<{
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  sheen: string;
  skyTint: string;
}> {
  switch (mood) {
    case 'sunny':
      return {
        colors: ['rgba(228, 132, 48, 0.78)', 'rgba(248, 188, 88, 0.56)', 'rgba(255, 228, 168, 0.22)'],
        locations: [0, 0.5, 1],
        icon: 'sunny',
        iconColor: 'rgba(255, 248, 228, 0.98)',
        sheen: 'rgba(255, 210, 120, 0.2)',
        skyTint: 'rgba(255, 176, 88, 0.22)',
      };
    case 'partlyCloudy':
      return {
        colors: ['rgba(88, 142, 188, 0.72)', 'rgba(138, 178, 212, 0.52)', 'rgba(196, 220, 240, 0.18)'],
        locations: [0, 0.48, 1],
        icon: 'partly-sunny-outline',
        iconColor: 'rgba(252, 254, 255, 0.98)',
        sheen: 'rgba(220, 236, 252, 0.14)',
        skyTint: 'rgba(168, 204, 232, 0.2)',
      };
    case 'lightRain':
      return {
        colors: ['rgba(72, 118, 156, 0.72)', 'rgba(108, 152, 188, 0.52)', 'rgba(168, 204, 228, 0.18)'],
        locations: [0, 0.46, 1],
        icon: 'rainy-outline',
        iconColor: 'rgba(240, 248, 255, 0.98)',
        sheen: 'rgba(148, 196, 255, 0.14)',
        skyTint: 'rgba(120, 168, 212, 0.18)',
      };
    case 'overcast':
      return {
        colors: ['rgba(108, 128, 148, 0.68)', 'rgba(148, 168, 188, 0.48)', 'rgba(196, 210, 224, 0.16)'],
        locations: [0, 0.52, 1],
        icon: 'cloud-outline',
        iconColor: 'rgba(248, 252, 255, 0.96)',
        sheen: 'rgba(196, 210, 224, 0.12)',
        skyTint: 'rgba(148, 168, 188, 0.18)',
      };
    case 'goldenHour':
      return {
        colors: ['rgba(212, 128, 56, 0.76)', 'rgba(236, 168, 88, 0.54)', 'rgba(255, 220, 156, 0.2)'],
        locations: [0, 0.46, 1],
        icon: 'sunny-outline',
        iconColor: 'rgba(255, 246, 228, 0.98)',
        sheen: 'rgba(255, 188, 96, 0.22)',
        skyTint: 'rgba(255, 168, 72, 0.24)',
      };
    case 'windy':
      return {
        colors: ['rgba(88, 138, 172, 0.66)', 'rgba(132, 176, 208, 0.46)', 'rgba(196, 224, 240, 0.16)'],
        locations: [0, 0.5, 1],
        icon: 'leaf-outline',
        iconColor: 'rgba(244, 252, 255, 0.96)',
        sheen: 'rgba(168, 216, 244, 0.14)',
        skyTint: 'rgba(132, 188, 224, 0.16)',
      };
    case 'nightClear':
      return {
        colors: ['rgba(18, 36, 68, 0.78)', 'rgba(32, 56, 96, 0.58)', 'rgba(48, 72, 112, 0.22)'],
        locations: [0, 0.48, 1],
        icon: 'moon-outline',
        iconColor: 'rgba(228, 240, 255, 0.96)',
        sheen: 'rgba(132, 168, 220, 0.12)',
        skyTint: 'rgba(72, 108, 168, 0.2)',
      };
    case 'clear':
    default:
      return {
        colors: ['rgba(48, 128, 204, 0.74)', 'rgba(96, 168, 228, 0.52)', 'rgba(176, 216, 248, 0.16)'],
        locations: [0, 0.5, 1],
        icon: 'sunny-outline',
        iconColor: 'rgba(255, 252, 240, 0.98)',
        sheen: 'rgba(196, 232, 255, 0.16)',
        skyTint: 'rgba(96, 176, 248, 0.2)',
      };
  }
}

function buildDestinationWeatherPreview(
  weatherCode: number,
  liveTodayLabel: string,
  useLiveToday: boolean,
  t: (key: string) => string
): readonly DestinationWeatherDayPreview[] {
  const liveMood = travelWeatherMoodFromCode(weatherCode);
  return TRAVEL_WEATHER_DEMO_DAY_DEFS.map((day) => {
    const dayLabel = t(`travelHub.weatherDemo.days.${day.id}.dayLabel`);
    const conditionLabel = t(`travelHub.weatherDemo.days.${day.id}.conditionLabel`);
    const resolved: DestinationWeatherDayPreview = {
      id: day.id,
      dayLabel,
      tempC: day.tempC,
      conditionLabel,
      mood: day.mood,
      daypart: day.daypart,
      ...(day.id === 'today' ? { isToday: true } : {}),
    };
    if (day.id === 'today' && useLiveToday) {
      return {
        ...resolved,
        conditionLabel: liveTodayLabel.length > 0 ? liveTodayLabel : conditionLabel,
        mood: liveMood,
      };
    }
    return resolved;
  });
}

/** Wave3b Pack 2 — FX reference demo placeholders only; not live market, exchange, or payment service. */
type TravelFxReferenceDemoItem = Readonly<{
  id: string;
  pairLabel: string;
  valueText: string;
  accent: 'cyan' | 'gold';
}>;

/** Static demo FX pair ids — labels resolved via i18n at render time. */
const TRAVEL_FX_REFERENCE_DEMO_ITEM_DEFS = [
  { id: 'eur-usd', accent: 'gold' as const },
  { id: 'usd-local', accent: 'cyan' as const },
  { id: 'eur-local', accent: 'cyan' as const },
  { id: 'eur-vnd', accent: 'gold' as const },
  { id: 'usd-vnd', accent: 'gold' as const },
] as const;

const TRAVEL_FX_REFERENCE_VN_ORDER = ['eur-usd', 'usd-vnd', 'eur-vnd', 'usd-local', 'eur-local'] as const;
const TRAVEL_FX_REFERENCE_CZ_PL_ORDER = ['eur-usd', 'eur-local', 'usd-local', 'eur-vnd', 'usd-vnd'] as const;

function resolveTravelFxReferenceDemoItemIds(homeCountryCode: string | undefined): readonly string[] {
  const cc = (homeCountryCode ?? 'EU').toUpperCase();
  if (cc === 'VN') return TRAVEL_FX_REFERENCE_VN_ORDER;
  if (cc === 'CZ' || cc === 'PL') return TRAVEL_FX_REFERENCE_CZ_PL_ORDER;
  return TRAVEL_FX_REFERENCE_DEMO_ITEM_DEFS.map((item) => item.id);
}

function resolveTravelFxReferenceDemoItems(
  homeCountryCode: string | undefined,
  t: (key: string) => string
): readonly TravelFxReferenceDemoItem[] {
  const byId = new Map(
    TRAVEL_FX_REFERENCE_DEMO_ITEM_DEFS.map((item) => [
      item.id,
      {
        id: item.id,
        accent: item.accent,
        pairLabel: t(`travelHub.fxReference.items.${item.id}.pairLabel`),
        valueText: t(`travelHub.fxReference.items.${item.id}.valueText`),
      },
    ])
  );
  return resolveTravelFxReferenceDemoItemIds(homeCountryCode).flatMap((id) => {
    const item = byId.get(id as (typeof TRAVEL_FX_REFERENCE_DEMO_ITEM_DEFS)[number]['id']);
    return item ? [item] : [];
  });
}

type TravelFxReferenceLayoutMode = 'desktopRow' | 'tabletRow' | 'tabletWrap' | 'mobileGrid';

function travelFxReferenceLayoutMode(viewportWidth: number, twoColumn: boolean): TravelFxReferenceLayoutMode {
  if (twoColumn || viewportWidth >= 1024) return 'desktopRow';
  if (viewportWidth >= 920) return 'tabletRow';
  if (viewportWidth >= 768) return 'tabletWrap';
  return 'mobileGrid';
}

type TravelFxReferenceCardTier = 'desktop' | 'tablet' | 'mobile';

function travelFxReferenceCardTier(viewportWidth: number): TravelFxReferenceCardTier {
  if (viewportWidth >= 1024) return 'desktop';
  if (viewportWidth >= 768) return 'tablet';
  return 'mobile';
}

/** Pack 1 — compact secondary FX strip (weather remains primary at ~128px). */
function travelFxReferenceCardMetrics(tier: TravelFxReferenceCardTier): Readonly<{
  minHeight: number;
  paddingVertical: number;
  paddingHorizontal: number;
  capsuleSize: number;
  iconSize: number;
  inlineGap: number;
  textGap: number;
  pairFontSize: number;
  valueFontSize: number;
  valueLineHeight: number;
  valueLines: 1 | 2;
  gridGap: number;
}> {
  switch (tier) {
    case 'desktop':
      return {
        minHeight: 60,
        paddingVertical: 6,
        paddingHorizontal: 8,
        capsuleSize: 22,
        iconSize: 11,
        inlineGap: 7,
        textGap: 1,
        pairFontSize: 8,
        valueFontSize: 11,
        valueLineHeight: 13,
        valueLines: 1,
        gridGap: 6,
      };
    case 'tablet':
      return {
        minHeight: 62,
        paddingVertical: 6,
        paddingHorizontal: 8,
        capsuleSize: 23,
        iconSize: 11,
        inlineGap: 7,
        textGap: 2,
        pairFontSize: 8,
        valueFontSize: 11,
        valueLineHeight: 13,
        valueLines: 1,
        gridGap: 7,
      };
    case 'mobile':
    default:
      return {
        minHeight: 64,
        paddingVertical: 7,
        paddingHorizontal: 9,
        capsuleSize: 24,
        iconSize: 12,
        inlineGap: 8,
        textGap: 2,
        pairFontSize: 8.5,
        valueFontSize: 10.5,
        valueLineHeight: 14,
        valueLines: 2,
        gridGap: 7,
      };
  }
}

function travelFxReferenceCompactMaterial(accent: 'cyan' | 'gold'): Readonly<{
  stroke: string;
  glow: string;
  iconColor: string;
  sheen: readonly [string, string];
}> {
  if (accent === 'gold') {
    return {
      stroke: 'rgba(232, 196, 120, 0.22)',
      glow: 'rgba(232, 196, 120, 0.08)',
      iconColor: 'rgba(232, 210, 160, 0.9)',
      sheen: ['rgba(255, 248, 228, 0.06)', 'transparent'],
    };
  }
  return {
    stroke: 'rgba(92, 205, 255, 0.2)',
    glow: 'rgba(92, 205, 255, 0.07)',
    iconColor: 'rgba(148, 228, 255, 0.9)',
    sheen: ['rgba(196, 232, 255, 0.06)', 'transparent'],
  };
}

function TravelFxReferenceGlassCard({
  item,
  stretch,
  metrics,
}: Readonly<{
  item: TravelFxReferenceDemoItem;
  stretch?: boolean;
  metrics: ReturnType<typeof travelFxReferenceCardMetrics>;
}>): ReactElement {
  const material = travelFxReferenceCompactMaterial(item.accent);

  return (
    <View
      style={[
        styles.fxReferenceGlassCard,
        stretch ? styles.fxReferenceGlassCardStretch : null,
        {
          minHeight: metrics.minHeight,
          height: metrics.minHeight,
          maxHeight: metrics.minHeight,
          paddingVertical: metrics.paddingVertical,
          paddingHorizontal: metrics.paddingHorizontal,
          gap: metrics.inlineGap,
          borderColor: material.stroke,
          backgroundColor: material.glow,
        },
      ]}
      testID={`travel-fx-reference-chip-${item.id}`}
      accessibilityLabel={`${item.pairLabel} ${item.valueText} tham khảo`}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[material.sheen[0], material.sheen[1]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.fxReferenceGlassCardSheen}
      />
      <View
        style={[
          styles.fxReferenceGlassCardIconCapsule,
          {
            width: metrics.capsuleSize,
            height: metrics.capsuleSize,
            borderRadius: metrics.capsuleSize / 2,
            borderColor: material.stroke,
          },
        ]}
      >
        <Ionicons
          name="cash-outline"
          size={metrics.iconSize}
          color={material.iconColor}
          accessibilityIgnoresInvertColors
        />
      </View>
      <View style={[styles.fxReferenceGlassCardTextCol, { gap: metrics.textGap }]}>
        <Text
          style={[styles.fxReferenceGlassCardPair, { fontSize: metrics.pairFontSize }]}
          numberOfLines={1}
        >
          {item.pairLabel}
        </Text>
        <Text
          style={[
            styles.fxReferenceGlassCardValue,
            {
              fontSize: metrics.valueFontSize,
              lineHeight: metrics.valueLineHeight,
            },
          ]}
          numberOfLines={metrics.valueLines}
        >
          {item.valueText}
        </Text>
      </View>
    </View>
  );
}

function useTravelWeatherReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const sync = () => setReduceMotion(media.matches);
      sync();
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => setReduceMotion(Boolean(enabled)))
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) =>
      setReduceMotion(enabled)
    );
    return () => subscription?.remove?.();
  }, []);

  return reduceMotion;
}

/** Pack 1D — subtle rain wet-glass shimmer; static when reduced-motion is enabled. */
function TravelWeatherRainShimmerOverlay({ reduceMotion }: Readonly<{ reduceMotion: boolean }>): ReactElement {
  const shimmerOpacity = useRef(new Animated.Value(0.32)).current;

  useEffect(() => {
    if (reduceMotion) {
      shimmerOpacity.setValue(0.36);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.52,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.24,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, shimmerOpacity]);

  if (reduceMotion) {
    return <View style={styles.weatherCinematicRainShimmer} pointerEvents="none" />;
  }

  return <Animated.View style={[styles.weatherCinematicRainShimmer, { opacity: shimmerOpacity }]} pointerEvents="none" />;
}

/** Pack 1E — demo daypart lighting layer; stacks above Pack 1D condition effects. Visual-only, not real-time clock. */
function TravelWeatherDaypartOverlay({ daypart }: Readonly<{ daypart: TravelWeatherDaypart }>): ReactElement {
  const effectTestId = `travel-weather-daypart-effect-${daypart}`;

  switch (daypart) {
    case 'morning':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(196, 232, 255, 0.26)', 'rgba(168, 216, 248, 0.12)', 'transparent']}
            locations={[0, 0.36, 0.7]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherDaypartMorningHaze} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(148, 228, 255, 0.1)', 'transparent']}
            start={{ x: 0.12, y: 0.08 }}
            end={{ x: 0.72, y: 0.42 }}
            style={styles.weatherDaypartMorningFreshness}
          />
        </View>
      );
    case 'goldenHour':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 196, 112, 0.22)', 'rgba(255, 168, 88, 0.12)', 'transparent']}
            locations={[0, 0.42, 0.82]}
            start={{ x: 0.18, y: 0.08 }}
            end={{ x: 0.88, y: 0.92 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(255, 176, 96, 0.14)', 'rgba(212, 128, 56, 0.1)']}
            start={{ x: 0.5, y: 0.45 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.weatherDaypartGoldenHorizon}
          />
        </View>
      );
    case 'night':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(10, 22, 44, 0.34)', 'rgba(18, 36, 68, 0.22)', 'rgba(32, 56, 96, 0.1)']}
            locations={[0, 0.48, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherDaypartNightSkyWash} pointerEvents="none" />
          <View style={styles.weatherDaypartMoonHint} pointerEvents="none" />
          <View style={styles.weatherDaypartStarHint} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(72, 132, 196, 0.16)', 'rgba(48, 96, 152, 0.1)']}
            start={{ x: 0.5, y: 0.52 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.weatherDaypartCityGlow}
          />
        </View>
      );
    case 'day':
    default:
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 255, 255, 0.14)', 'rgba(196, 232, 255, 0.08)', 'transparent']}
            locations={[0, 0.32, 0.68]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
  }
}

function TravelWeatherMoodAtmosphereOverlay({
  mood,
  skyTint,
  reduceMotion,
  boosted = false,
}: Readonly<{ mood: TravelWeatherMood; skyTint: string; reduceMotion: boolean; boosted?: boolean }>): ReactElement {
  const effectTestId = `travel-weather-condition-effect-${mood}`;
  const boostVeil = boosted ? (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(255, 255, 255, 0.1)', 'transparent', 'rgba(148, 228, 255, 0.06)']}
      locations={[0, 0.45, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.weatherCinematicEffectBoostVeil}
    />
  ) : null;

  switch (mood) {
    case 'partlyCloudy':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={[skyTint, 'rgba(228, 240, 252, 0.18)', 'transparent']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.82 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherCinematicAtmospherePale} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilA, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilB, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilC, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilD, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          {boostVeil}
        </View>
      );
    case 'lightRain':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(148, 188, 228, 0.28)', 'transparent', 'rgba(96, 132, 168, 0.22)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherCinematicRainMist} pointerEvents="none" />
          <View style={[styles.weatherCinematicRainStreakA, boosted && styles.weatherCinematicRainStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicRainStreakB, boosted && styles.weatherCinematicRainStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicRainStreakC, boosted && styles.weatherCinematicRainStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicRainStreakD, boosted && styles.weatherCinematicRainStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicRainStreakE, boosted && styles.weatherCinematicRainStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicRainStreakF, boosted && styles.weatherCinematicRainStreakBoosted]} pointerEvents="none" />
          <View style={styles.weatherCinematicRainStreakG} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(168, 214, 255, 0.22)']}
            start={{ x: 0.5, y: 0.68 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.weatherCinematicWetGloss}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(220, 240, 255, 0.18)', 'transparent', 'rgba(196, 228, 255, 0.1)']}
            start={{ x: 0.12, y: 0.2 }}
            end={{ x: 0.88, y: 0.72 }}
            style={styles.weatherCinematicGlassSheen}
          />
          <TravelWeatherRainShimmerOverlay reduceMotion={reduceMotion} />
          {boostVeil}
        </View>
      );
    case 'overcast':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(148, 168, 188, 0.34)', 'rgba(120, 140, 160, 0.2)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.82 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherCinematicOvercastVeil} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilA, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilB, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicCloudVeilC, boosted && styles.weatherCinematicCloudVeilBoosted]} pointerEvents="none" />
          {boostVeil}
        </View>
      );
    case 'goldenHour':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <View style={[styles.weatherCinematicSunGlowWarm, boosted && styles.weatherCinematicSunGlowBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicSunRadialHaloWarm, boosted && styles.weatherCinematicSunHaloBoosted]} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 196, 120, 0.44)', 'rgba(255, 168, 88, 0.2)', 'transparent']}
            start={{ x: 0.15, y: 0.08 }}
            end={{ x: 0.85, y: 0.85 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 220, 140, 0.22)', 'transparent']}
            start={{ x: 0.72, y: 0.1 }}
            end={{ x: 0.18, y: 0.55 }}
            style={styles.weatherCinematicLightSweep}
          />
          <View style={styles.weatherCinematicGoldenLensWarmth} pointerEvents="none" />
          {boostVeil}
        </View>
      );
    case 'windy':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={[skyTint, 'transparent']}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 1, y: 0.65 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.weatherCinematicAiryGlow, boosted && styles.weatherCinematicAiryGlowBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicWindStreakA, boosted && styles.weatherCinematicWindStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicWindStreakB, boosted && styles.weatherCinematicWindStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicWindStreakC, boosted && styles.weatherCinematicWindStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicWindStreakD, boosted && styles.weatherCinematicWindStreakBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicWindStreakE, boosted && styles.weatherCinematicWindStreakBoosted]} pointerEvents="none" />
          <View style={styles.weatherCinematicWindStreakF} pointerEvents="none" />
          {boostVeil}
        </View>
      );
    case 'sunny':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <View style={[styles.weatherCinematicSunGlowWarm, boosted && styles.weatherCinematicSunGlowBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicSunRadialHaloWarm, boosted && styles.weatherCinematicSunHaloBoosted]} pointerEvents="none" />
          <View style={styles.weatherCinematicSunRayA} pointerEvents="none" />
          <View style={styles.weatherCinematicSunRayB} pointerEvents="none" />
          <View style={styles.weatherCinematicSunRayC} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 228, 160, 0.4)', 'rgba(255, 196, 110, 0.16)', 'transparent']}
            start={{ x: 0.78, y: 0.08 }}
            end={{ x: 0.2, y: 0.72 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 236, 180, 0.22)', 'transparent']}
            start={{ x: 0.8, y: 0.06 }}
            end={{ x: 0.22, y: 0.48 }}
            style={styles.weatherCinematicLightSweep}
          />
          {boostVeil}
        </View>
      );
    case 'nightClear':
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(12, 24, 48, 0.42)', 'rgba(24, 44, 76, 0.24)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.88 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.weatherCinematicNightSky} pointerEvents="none" />
          <View style={styles.weatherCinematicMoonGlow} pointerEvents="none" />
          <View style={styles.weatherCinematicStarHintA} pointerEvents="none" />
          <View style={styles.weatherCinematicStarHintB} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(72, 132, 196, 0.18)', 'rgba(48, 96, 152, 0.12)']}
            start={{ x: 0.5, y: 0.55 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.weatherCinematicTerminalGlow}
          />
          {boostVeil}
        </View>
      );
    case 'clear':
    default:
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={effectTestId}>
          <View style={[styles.weatherCinematicSunGlowCool, boosted && styles.weatherCinematicSunGlowBoosted]} pointerEvents="none" />
          <View style={[styles.weatherCinematicSunRadialHaloCool, boosted && styles.weatherCinematicSunHaloBoosted]} pointerEvents="none" />
          <View style={styles.weatherCinematicSunRayA} pointerEvents="none" />
          <View style={styles.weatherCinematicSunRayB} pointerEvents="none" />
          <View style={styles.weatherCinematicSunRayC} pointerEvents="none" />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 255, 255, 0.34)', 'rgba(132, 238, 255, 0.14)', 'transparent']}
            start={{ x: 0.82, y: 0.05 }}
            end={{ x: 0.18, y: 0.65 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(196, 232, 255, 0.18)', 'transparent']}
            start={{ x: 0.78, y: 0.04 }}
            end={{ x: 0.24, y: 0.42 }}
            style={styles.weatherCinematicLightSweep}
          />
          {boostVeil}
        </View>
      );
  }
}

function TravelDestinationWeatherMiniCard({
  day,
  cardTier,
  widthOverride,
  reduceMotion,
}: Readonly<{
  day: DestinationWeatherDayPreview;
  cardTier: TravelWeatherCinematicCardTier;
  widthOverride?: number;
  reduceMotion: boolean;
}>): ReactElement {
  const visual = travelWeatherMoodVisual(day.mood);
  const isToday = day.isToday === true;
  const metrics = travelWeatherCinematicCardMetrics(cardTier, isToday, widthOverride);
  const [cardActive, setCardActive] = useState(false);

  const syncCardActive = (active: boolean) => setCardActive(active);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day.dayLabel} ${day.tempC} độ ${day.conditionLabel}. Tham chiếu demo.`}
      testID={`travel-destination-weather-mini-card-${day.id}`}
      onHoverIn={Platform.OS === 'web' ? () => syncCardActive(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => syncCardActive(false) : undefined}
      onFocus={() => syncCardActive(true)}
      onBlur={() => syncCardActive(false)}
      onPressIn={() => syncCardActive(true)}
      onPressOut={() => syncCardActive(false)}
      style={({ pressed }) => [
        styles.weatherCinematicMiniCard,
        {
          width: metrics.width,
          height: metrics.height,
          borderRadius: metrics.borderRadius,
        },
        isToday && styles.weatherCinematicMiniCardToday,
        (cardActive || pressed) && styles.weatherCinematicMiniCardActive,
        Platform.OS === 'web' &&
          (cardActive || pressed) &&
          ({
            transform: [{ translateY: -2 }],
            cursor: 'pointer',
          } as ViewStyle),
      ]}
    >
      {cardActive ? (
        <View
          pointerEvents="none"
          style={[styles.weatherCinematicMiniFocusRing, { borderRadius: metrics.borderRadius + 1 }]}
        />
      ) : null}
      <Image
        source={TRAVEL_DESTINATION_LENS_SCENE}
        style={[
          styles.weatherCinematicMiniScene,
          Platform.OS === 'web' ? ({ objectPosition: TRAVEL_DESTINATION_LENS_SCENE_OBJECT_POSITION } as ImageStyle) : null,
        ]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        pointerEvents="none"
        colors={visual.colors}
        locations={visual.locations}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <TravelWeatherMoodAtmosphereOverlay
        mood={day.mood}
        skyTint={visual.skyTint}
        reduceMotion={reduceMotion}
        boosted={cardActive}
      />
      <TravelWeatherDaypartOverlay daypart={day.daypart} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.16)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.22 }}
        style={styles.weatherCinematicMiniGlassRim}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[visual.sheen, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.48 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4, 10, 18, 0.16)', 'transparent', 'rgba(4, 10, 18, 0.14)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(6, 12, 22, 0.36)', 'rgba(4, 8, 16, 0.68)']}
        locations={[0.48, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.weatherCinematicMiniFooterVeil}
      />
      <View
        style={[styles.weatherCinematicMiniIconOrb, cardActive && styles.weatherCinematicMiniIconOrbActive]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.2)', 'rgba(72, 148, 220, 0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name={visual.icon} size={metrics.iconSize} color={visual.iconColor} accessibilityIgnoresInvertColors />
      </View>
      <Text
        style={[styles.weatherCinematicMiniTempBadge, cardActive && styles.weatherCinematicMiniTempBadgeActive]}
        pointerEvents="none"
      >
        {`${day.tempC}°`}
      </Text>
      <View style={styles.weatherCinematicMiniFooter} pointerEvents="none">
        <Text style={[styles.weatherCinematicMiniDayLabel, isToday && styles.weatherCinematicMiniDayLabelToday]} numberOfLines={1}>
          {day.dayLabel}
        </Text>
        <Text
          style={[styles.weatherCinematicMiniConditionLabel, cardActive && styles.weatherCinematicMiniConditionLabelActive]}
          numberOfLines={2}
        >
          {day.conditionLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function TravelDestinationContextWeatherRow({
  days,
  cardTier,
  loading,
  preferFitAllCards = false,
}: Readonly<{
  days: readonly DestinationWeatherDayPreview[];
  cardTier: TravelWeatherCinematicCardTier;
  loading: boolean;
  preferFitAllCards?: boolean;
}>): ReactElement {
  const { t } = useTranslation();
  const [rowWidth, setRowWidth] = useState(0);
  const fitLayout = useMemo(() => {
    if (!preferFitAllCards || cardTier !== 'desktop' || rowWidth <= 0) return null;
    return travelWeatherComputeFitLayout(rowWidth, days.length);
  }, [preferFitAllCards, cardTier, rowWidth, days.length]);
  const useFitRow = fitLayout != null && !fitLayout.showScroll;
  const showScrollAffordance = !useFitRow && preferFitAllCards && cardTier !== 'mobile';
  const cardMetrics = travelWeatherCinematicCardMetrics(cardTier);
  const reduceMotion = useTravelWeatherReduceMotion();

  const cards = days.map((day) => {
    const fitWidth =
      useFitRow && fitLayout
        ? fitLayout.cardWidth + (day.isToday ? fitLayout.todayWidthBump : 0)
        : undefined;
    return (
      <TravelDestinationWeatherMiniCard
        key={day.id}
        day={day}
        cardTier={cardTier}
        widthOverride={fitWidth}
        reduceMotion={reduceMotion}
      />
    );
  });

  return (
    <View
      style={styles.destinationContextWeatherRowWrap}
      testID="travel-destination-context-weather-row"
      accessibilityLabel="travel-destination-cinematic-weather-row"
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth !== rowWidth) setRowWidth(nextWidth);
      }}
    >
      <View style={styles.destinationContextWeatherRowHeader}>
        <Text style={styles.destinationContextWeatherRowKicker}>{t('travelHub.weatherDemo.rowKicker')}</Text>
        <View style={styles.destinationContextWeatherRowDemoNotes}>
          <Text style={styles.destinationContextWeatherRowDemoNote}>
            {t('travelHub.weatherDemo.contextDemoNote')}
          </Text>
          <Text style={styles.destinationContextWeatherRowDaypartNote}>
            {t('travelHub.weatherDemo.daypartDemoNote')}
          </Text>
        </View>
      </View>
      {loading ? (
        <View style={[styles.destinationContextWeatherRowLoading, { minHeight: cardMetrics.height }]}>
          <ActivityIndicator color={CYAN} size="small" />
        </View>
      ) : useFitRow && fitLayout ? (
        <View
          style={[styles.destinationContextWeatherFitRow, { gap: fitLayout.gap }]}
          testID="travel-destination-weather-fit-row"
        >
          {cards}
        </View>
      ) : (
        <View style={styles.destinationContextWeatherScrollShell} testID="travel-destination-weather-scroll-shell">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.destinationContextWeatherScrollContent,
              showScrollAffordance ? styles.destinationContextWeatherScrollContentWithAffordance : null,
            ]}
          >
            {cards}
          </ScrollView>
          {showScrollAffordance ? (
            <>
              <LinearGradient
                pointerEvents="none"
                colors={['transparent', 'rgba(6, 12, 20, 0.36)', 'rgba(4, 8, 16, 0.68)']}
                locations={[0, 0.62, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.destinationContextWeatherScrollFadeRight}
              />
              <View style={styles.destinationContextWeatherScrollCue} pointerEvents="none">
                <Ionicons name="chevron-forward" size={9} color="rgba(168, 240, 255, 0.72)" />
              </View>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

/** @deprecated Use TravelDestinationContextWeatherRow */
function TravelDestinationWeatherCinemaStrip(
  props: Parameters<typeof TravelDestinationContextWeatherRow>[0]
): ReactElement {
  return <TravelDestinationContextWeatherRow {...props} />;
}

function TravelDestinationContextFxRow({
  homeCountryCode,
  viewportWidth,
  twoColumn,
}: Readonly<{
  homeCountryCode: string | undefined;
  viewportWidth: number;
  twoColumn: boolean;
}>): ReactElement {
  const { t, i18n } = useTranslation();
  const items = useMemo(
    () => resolveTravelFxReferenceDemoItems(homeCountryCode, t),
    [homeCountryCode, t, i18n.language]
  );
  const layoutMode = travelFxReferenceLayoutMode(viewportWidth, twoColumn);
  const cardMetrics = useMemo(
    () => travelFxReferenceCardMetrics(travelFxReferenceCardTier(viewportWidth)),
    [viewportWidth]
  );

  const renderCard = (item: TravelFxReferenceDemoItem, stretch = false) => (
    <TravelFxReferenceGlassCard key={item.id} item={item} stretch={stretch} metrics={cardMetrics} />
  );

  const gridRowStyle = [styles.fxReferenceGlassGridRow, { gap: cardMetrics.gridGap }];

  let cardsGrid: ReactElement;
  switch (layoutMode) {
    case 'desktopRow':
    case 'tabletRow':
      cardsGrid = (
        <View style={gridRowStyle} testID="travel-fx-reference-grid-row">
          {items.map((item) => renderCard(item, true))}
        </View>
      );
      break;
    case 'tabletWrap':
      cardsGrid = (
        <View style={[styles.fxReferenceGlassGridTabletWrap, { gap: cardMetrics.gridGap }]} testID="travel-fx-reference-grid-tablet-wrap">
          <View style={gridRowStyle}>
            {items.slice(0, 3).map((item) => renderCard(item, true))}
          </View>
          <View style={gridRowStyle}>
            {items.slice(3).map((item) => renderCard(item, true))}
          </View>
        </View>
      );
      break;
    case 'mobileGrid':
    default:
      cardsGrid = (
        <View style={[styles.fxReferenceGlassGridMobile, { gap: cardMetrics.gridGap }]} testID="travel-fx-reference-grid-mobile">
          <View style={gridRowStyle}>
            {items.slice(0, 2).map((item) => renderCard(item, true))}
          </View>
          <View style={gridRowStyle}>
            {items.slice(2, 4).map((item) => renderCard(item, true))}
          </View>
          <View style={gridRowStyle}>{renderCard(items[4], true)}</View>
        </View>
      );
      break;
  }

  return (
    <View style={styles.fxPremiumGlassStripWrap} testID="travel-destination-context-fx-row">
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8, 14, 24, 0.42)', 'rgba(6, 12, 20, 0.34)', 'rgba(4, 10, 18, 0.38)']}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fxPremiumGlassStripVeil}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(132, 238, 255, 0.04)', 'transparent', 'rgba(232, 196, 120, 0.025)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fxPremiumGlassStripSheen}
      />
      <View style={styles.fxPremiumGlassStripHeader}>
        <Text style={styles.fxPremiumGlassStripKicker}>{t('travelHub.fxReference.stripKicker')}</Text>
        <Text style={styles.fxPremiumGlassStripDemoLabel}>{t('travelHub.fxReference.demoLabel')}</Text>
      </View>
      <View style={styles.fxReferenceGlassGridShell}>{cardsGrid}</View>
      <Text style={styles.fxPremiumGlassStripSafetyNote}>{t('travelHub.fxReference.safetyMicrocopy')}</Text>
    </View>
  );
}

/** @deprecated Use TravelDestinationContextFxRow */
function TravelDestinationFxReferenceStrip(props: Readonly<{ fxLine: string; compact: boolean }>): ReactElement {
  const { width } = useWindowDimensions();
  return (
    <TravelDestinationContextFxRow
      homeCountryCode={undefined}
      viewportWidth={width}
      twoColumn={!props.compact}
    />
  );
}

/** Local world-card breakpoints (mirrored — do not import navigation shell). */
const TRAVEL_FLAGSHIP_CAROUSEL_MAX_WIDTH = 380;
const TRAVEL_FLAGSHIP_ONE_COL_MAX_WIDTH = 500;
const TRAVEL_FLAGSHIP_TWO_COL_MIN_WIDTH = 501;
const TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH = 1024;
const TRAVEL_FLAGSHIP_KICKER_TO_GRID_GAP_PX = 4;
const TRAVEL_FLAGSHIP_KICKER_TO_GRID_GAP_FULLSCREEN_PX = 2;

/** Legacy hero retained on disk only — default dynamic v1 replaces runtime mapping. */
/** Travel cinematic hero — Pack 4 depth restore; Pack 5 fit balance (first-view Quick Help visible). */
const TRAVEL_HERO_ASPECT = 1600 / 648;
const TRAVEL_WEB_HERO_MIN_PX = 360;
const TRAVEL_WEB_HERO_MAX_PX = 600;
const TRAVEL_HERO_LABEL_AWARE_MAX_BONUS_PX = 32;
/** Opening-stage hero budget — card reserve slightly below render min to reclaim ~16px for hero depth. */
const TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_BUDGET_CARD_RESERVE_PX = 164;
/** Pack 11 — rebalance: slightly lower normal hero; expose Situations below fold. */
/** Pack 23 — subtle depth restore (+14px normal) without oversized hero. */
/** Pack 28 — deeper cinematic hero (+32px normal) while keeping Situations visible. */
const TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_TARGET_PX = 410;
/** Pack 11 — dedicated fullscreen hero path (noticeably lower than normal web). */
/** Pack 23 — fullscreen depth (+10px) while keeping Situations peek. */
/** Pack 28 — modest fullscreen depth (+8px). */
/** Pack 33B — shallower fullscreen hero so Quick Help + Situations sit higher. */
/** Pack 36 — deeper fullscreen hero (+56px) for cinematic scene; normal web target unchanged. */
/** Pack 42A — fullscreen stack reset: trim hero so Quick Help fits without overlap. */
const TRAVEL_OPENING_STAGE_FULLSCREEN_WEB_HERO_TARGET_PX = 376;
/** Pack 11 — opening lock floors (fullscreen may lock below legacy 356px min). */
/** Pack 23 — lock floors track depth targets. */
/** Pack 28 — lock floors track Pack 28 depth targets. */
const TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_LOCK_FLOOR_PX = 372;
const TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_LOCK_FLOOR_PX = 358;
/** Pack 11 — hero glass shell + bridge slack so opening-stage minHeight matches rendered stack. */
/** Pack 23 — tighter slack pulls Situations closer to Quick Help. */
/** Pack 28 — tighter slack compensates for taller hero. */
const TRAVEL_OPENING_STAGE_HERO_CARD_SHELL_SLACK_PX = 78;
/** Pack 39 — tighter fullscreen opening-stage shell slack (normal slack unchanged). */
const TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_CARD_SHELL_SLACK_PX = 58;
/** Pack 9 — opening lock gaps (Travel-only; display gap may add air bonus). */
const TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_TO_CARD_LOCK_GAP_PX = 4;
/** Pack 7–11 — web cover zoom-out so shorter hero keeps cinematic scene. */
/** Pack 23 — slightly more zoom-out to reveal traveler lower body. */
/** Pack 28 — further zoom-out for airy cinematic crop. */
const TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_NORMAL = 0.85;
/** Pack 36 — fullscreen zoom-out for more open scene (normal scale unchanged). */
const TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_FULLSCREEN = 0.815;
/** Pack 23 — hero crop anchor (lower Y = more legs/body visible). */
/** Pack 28 — lower anchor for more body/legs in frame. */
const TRAVEL_DYNAMIC_HERO_OBJECT_POSITION_Y_NORMAL = '34%';
/** Pack 36 — lower anchor shows more body/scene in fullscreen only. */
const TRAVEL_DYNAMIC_HERO_OBJECT_POSITION_Y_FULLSCREEN = '31%';

/** Editorial recompose — left-to-center cover layout (wave3b.dynamic-hero-editorial-recompose). */
const TRAVEL_HERO_LARGE_DESKTOP_MIN_WIDTH = 1366;

type TravelHeroEditorialLayout = Readonly<{
  zoneWidthPx: number;
  zoneWidthPercent: number;
  zoneWidthVw: number;
  zoneMinWidthPx: number;
  zoneLeftInsetPercent: number;
  zoneLeftInsetPx: number;
  titleMaxWidthPx: number;
  subtitleMaxWidthPx: number;
  chipMaxWidthPx: number;
  chipMinWidthPx: number;
  textVeilWidthPercent: number;
  textScrimWidthPx: number;
  useAbsoluteLayer: boolean;
  textStackPaddingTopPx: number;
  textStackPaddingBottomPx: number;
}>;

/** Pack 17 — premium editorial column: ~48–52% hero width (860–980px band). */
const TRAVEL_HERO_EDITORIAL_LEFT_INSET_DESKTOP_NORMAL_PX = 56;
const TRAVEL_HERO_EDITORIAL_LEFT_INSET_DESKTOP_FULLSCREEN_PX = 54;
const TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_NORMAL = 0.52;
const TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_FULLSCREEN = 0.5;
const TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_MIN_PX = 780;
const TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_MAX_NORMAL_PX = 960;
const TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_MAX_FULLSCREEN_PX = 820;
const TRAVEL_HERO_EDITORIAL_TEXT_SCRIM_WIDTH_RATIO_NORMAL = 0.52;
const TRAVEL_HERO_EDITORIAL_TEXT_SCRIM_WIDTH_RATIO_FULLSCREEN = 0.5;
/** Pack 9 — desktop title-block vertical rhythm (kicker / title / subtitle / chips). */
const TRAVEL_HERO_EDITORIAL_SPACING_DESKTOP = {
  kickerToTitle: 18,
  titleToSubtitle: 18,
  subtitleToChips: 20,
} as const;
/** Pack 11 — fullscreen / short hero uses controlled title scale (not billboard). */
/** Pack 17 — fullscreen hero ~358px should not force compact title scale. */
const TRAVEL_HERO_STAGE_COMPACT_TITLE_MAX_HEIGHT_PX = 392;

/** Pack 20/21 — forced editorial presets (bypass responsive title math on desktop web). */
type TravelHeroEditorialTitlePreset = Readonly<{
  fontSize: number;
  lineHeightPx: number;
  titleMaxWidthPx: number;
  columnWidthPx: number;
  leftInsetPx: number;
}>;

/** Pack 40 — hard cap normal desktop title (true premium editorial). */
const TRAVEL_HERO_EDITORIAL_NORMAL_DESKTOP_1366_PRESET: TravelHeroEditorialTitlePreset = {
  fontSize: 50,
  lineHeightPx: 54,
  titleMaxWidthPx: 620,
  columnWidthPx: 620,
  leftInsetPx: 56,
};

/** Pack 40 — hard cap fullscreen title (slightly larger than normal web). */
const TRAVEL_HERO_EDITORIAL_FULLSCREEN_DESKTOP_PRESET: TravelHeroEditorialTitlePreset = {
  fontSize: 54,
  lineHeightPx: 58,
  titleMaxWidthPx: 680,
  columnWidthPx: 680,
  leftInsetPx: 54,
};

function travelHeroEditorialTitlePreset(
  viewportWidth: number,
  openingStageFullscreen: boolean
): TravelHeroEditorialTitlePreset | null {
  if (Platform.OS !== 'web' || viewportWidth < TRAVEL_HERO_LARGE_DESKTOP_MIN_WIDTH) {
    return null;
  }
  if (openingStageFullscreen) {
    return TRAVEL_HERO_EDITORIAL_FULLSCREEN_DESKTOP_PRESET;
  }
  if (viewportWidth >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH) {
    return TRAVEL_HERO_EDITORIAL_NORMAL_DESKTOP_1366_PRESET;
  }
  return null;
}

/** Pack 40 — final hard-cap override; applied last on title Text for actual render path. */
function travelHeroFinalTitleStyle(
  viewportWidth: number,
  openingStageFullscreen: boolean
): TextStyle | null {
  if (Platform.OS !== 'web' || viewportWidth < 1200) return null;
  if (openingStageFullscreen) {
    return {
      fontSize: 54,
      lineHeight: 58,
      width: 680,
      maxWidth: 680,
      alignSelf: 'flex-start',
      flexShrink: 0,
    };
  }
  return {
    fontSize: 46,
    lineHeight: 52,
    width: 600,
    maxWidth: 600,
    alignSelf: 'flex-start',
    flexShrink: 0,
  };
}

/** Pack 17 — editorial title scale (fallback when preset does not apply). */
function travelHeroEditorialTitleScale(
  viewportWidth: number,
  openingStageFullscreen: boolean,
  heroStageMaxHeightPx: number | undefined,
  titleText: string
): Readonly<{ fontSize: number; lineHeightRatio: number; maxWidthPx: number }> {
  const largeDesktop = viewportWidth >= TRAVEL_HERO_LARGE_DESKTOP_MIN_WIDTH;
  const titleLen = titleText.length;
  if (viewportWidth >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH) {
    const compactHero =
      openingStageFullscreen &&
      heroStageMaxHeightPx != null &&
      heroStageMaxHeightPx <= TRAVEL_HERO_STAGE_COMPACT_TITLE_MAX_HEIGHT_PX;
    if (openingStageFullscreen) {
      let fontSize = largeDesktop ? (compactHero ? 52 : 54) : 52;
      if (titleLen > 36) fontSize -= 2;
      if (titleLen > 46) fontSize -= 2;
      return {
        fontSize,
        lineHeightRatio: 58 / 54,
        maxWidthPx: largeDesktop ? 680 : 560,
      };
    }
    let fontSize = largeDesktop ? 50 : 48;
    if (titleLen > 36) fontSize -= 2;
    if (titleLen > 46) fontSize -= 2;
    return {
      fontSize,
      lineHeightRatio: 54 / 50,
      maxWidthPx: largeDesktop ? 620 : 560,
    };
  }
  return { fontSize: 46, lineHeightRatio: 1.02, maxWidthPx: 560 };
}

function travelHeroLineHeight(fontSize: number, ratio: number): number {
  return Math.round(fontSize * ratio);
}

function travelHeroKickerLetterSpacingPx(fontSize: number, em = 0.15): number {
  return Math.round(fontSize * em * 10) / 10;
}

/** Numeric editorial column width — ~40–42% of hero (Pack 8 magazine column). */
function travelHeroEditorialColumnWidthPx(
  viewportWidth: number,
  largeDesktop: boolean,
  openingStageFullscreen: boolean
): number {
  const ratio = openingStageFullscreen
    ? TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_FULLSCREEN
    : TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_NORMAL;
  const maxPx = openingStageFullscreen
    ? TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_MAX_FULLSCREEN_PX
    : TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_MAX_NORMAL_PX;
  const minPx = largeDesktop ? TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_MIN_PX : 460;
  return Math.min(maxPx, Math.max(minPx, Math.round(viewportWidth * ratio)));
}

function travelHeroEditorialTextScrimWidthPx(
  viewportWidth: number,
  zoneWidthPx: number,
  openingStageFullscreen: boolean
): number {
  const ratio = openingStageFullscreen
    ? TRAVEL_HERO_EDITORIAL_TEXT_SCRIM_WIDTH_RATIO_FULLSCREEN
    : TRAVEL_HERO_EDITORIAL_TEXT_SCRIM_WIDTH_RATIO_NORMAL;
  return Math.max(zoneWidthPx, Math.round(viewportWidth * ratio));
}

/** STEP 5 proof only — title DOM width (debug.travel-local-hero-title-actual-dom-width-fix.1). */
const TRAVEL_DEBUG_HERO_TITLE = false;

/** Travel cover zone — wide editorial block spanning left-to-center (numeric px width). */
function travelHeroEditorialRecomposeLayout(
  viewportWidth: number,
  largeDesktop: boolean,
  desktopWebHero: boolean,
  openingStageFullscreen: boolean,
  heroStageMaxHeightPx: number | undefined,
  heroTitleText: string
): TravelHeroEditorialLayout {
  const useAbsoluteLayer = desktopWebHero && Platform.OS === 'web';
  const titlePreset = travelHeroEditorialTitlePreset(viewportWidth, openingStageFullscreen);
  const wrapperWidthPx = travelHeroEditorialColumnWidthPx(
    viewportWidth,
    largeDesktop,
    openingStageFullscreen
  );
  const titleScale = titlePreset
    ? {
        fontSize: titlePreset.fontSize,
        lineHeightRatio: titlePreset.lineHeightPx / titlePreset.fontSize,
        maxWidthPx: titlePreset.titleMaxWidthPx,
      }
    : travelHeroEditorialTitleScale(
        viewportWidth,
        openingStageFullscreen,
        heroStageMaxHeightPx,
        heroTitleText
      );
  /** Pack 20 — preset column width wins over ratio math. */
  const zoneWidthPx = titlePreset
    ? titlePreset.columnWidthPx
    : Math.min(
        openingStageFullscreen ? 940 : 980,
        Math.max(wrapperWidthPx, titleScale.maxWidthPx)
      );
  const textScrimWidthPx = travelHeroEditorialTextScrimWidthPx(
    viewportWidth,
    zoneWidthPx,
    openingStageFullscreen
  );
  const zoneLeftInsetPx = titlePreset
    ? titlePreset.leftInsetPx
    : openingStageFullscreen
      ? TRAVEL_HERO_EDITORIAL_LEFT_INSET_DESKTOP_FULLSCREEN_PX
      : TRAVEL_HERO_EDITORIAL_LEFT_INSET_DESKTOP_NORMAL_PX;
  if (largeDesktop) {
    return {
      zoneWidthPx,
      zoneWidthPercent: Math.round(
        (openingStageFullscreen
          ? TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_FULLSCREEN
          : TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_NORMAL) * 100
      ),
      zoneWidthVw: 0,
      zoneMinWidthPx: zoneWidthPx,
      zoneLeftInsetPercent: 0,
      zoneLeftInsetPx,
      titleMaxWidthPx: titlePreset ? titlePreset.titleMaxWidthPx : zoneWidthPx,
      subtitleMaxWidthPx: zoneWidthPx,
      chipMaxWidthPx: zoneWidthPx,
      chipMinWidthPx: 0,
      textVeilWidthPercent: openingStageFullscreen ? 50 : 52,
      textScrimWidthPx,
      useAbsoluteLayer,
      textStackPaddingTopPx: openingStageFullscreen ? 28 : 52,
      textStackPaddingBottomPx: openingStageFullscreen ? 34 : 68,
    };
  }
  if (viewportWidth >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH) {
    return {
      zoneWidthPx,
      zoneWidthPercent: Math.round(TRAVEL_HERO_EDITORIAL_COLUMN_WIDTH_RATIO_NORMAL * 100),
      zoneWidthVw: 0,
      zoneMinWidthPx: zoneWidthPx,
      zoneLeftInsetPercent: 0,
      zoneLeftInsetPx,
      titleMaxWidthPx: titlePreset ? titlePreset.titleMaxWidthPx : zoneWidthPx,
      subtitleMaxWidthPx: Math.min(zoneWidthPx, 520),
      chipMaxWidthPx: zoneWidthPx,
      chipMinWidthPx: 0,
      textVeilWidthPercent: 44,
      textScrimWidthPx,
      useAbsoluteLayer,
      textStackPaddingTopPx: 56,
      textStackPaddingBottomPx: 80,
    };
  }
  const zoneWidthPxMobile = Math.min(560, Math.max(440, Math.round(viewportWidth * 0.72)));
  return {
    zoneWidthPx: zoneWidthPxMobile,
    zoneWidthPercent: 76,
    zoneWidthVw: 0,
    zoneMinWidthPx: 0,
    zoneLeftInsetPercent: 0,
    zoneLeftInsetPx: 0,
    titleMaxWidthPx: zoneWidthPxMobile,
    subtitleMaxWidthPx: zoneWidthPxMobile,
    chipMaxWidthPx: zoneWidthPxMobile,
    chipMinWidthPx: 0,
    textVeilWidthPercent: 82,
    textScrimWidthPx: zoneWidthPxMobile,
    useAbsoluteLayer: false,
    textStackPaddingTopPx: 20,
    textStackPaddingBottomPx: 20,
  };
}

const TRAVEL_HERO_TYPOGRAPHY = {
  kicker: { fontSize: 14, letterSpacingEm: 0.15 },
  titleDesktop: { fontSize: 46, lineHeightRatio: 1.12 },
  titleLargeDesktop: { fontSize: 48, lineHeightRatio: 1.12 },
  titleTablet: { fontSize: 38, lineHeightRatio: 1.14 },
  titleMobile: { fontSize: 27, lineHeightRatio: 1.18 },
  titleCompact: { fontSize: 27, lineHeightRatio: 1.18 },
  subtitleDesktop: { fontSize: 21, lineHeightRatio: 1.5 },
  subtitleLargeDesktop: { fontSize: 21, lineHeightRatio: 1.5 },
  subtitleTablet: { fontSize: 18, lineHeightRatio: 1.48 },
  subtitleMobile: { fontSize: 15.5, lineHeightRatio: 1.52 },
  subtitleCompact: { fontSize: 15.5, lineHeightRatio: 1.52 },
  spacingDesktop: { kickerToTitle: 18, titleToSubtitle: 24, subtitleToMeta: 28 },
  spacingTablet: { kickerToTitle: 16, titleToSubtitle: 18, subtitleToMeta: 22 },
  spacingMobile: { kickerToTitle: 12, titleToSubtitle: 14, subtitleToMeta: 16 },
  trustGapPx: 10,
  trust: { fontSize: 10 },
} as const;

/** Desktop web hero copy — larger type + trust chips for wide viewports. */
function travelHeroWebReadabilityScale(
  desktopWebHero: boolean,
  largeDesktop: boolean
): Readonly<{
  kickerSize: number;
  subtitleSize: number;
  trustSize: number;
  trustPaddingV: number;
  trustPaddingH: number;
}> {
  if (!desktopWebHero) {
    return { kickerSize: 14, subtitleSize: 16, trustSize: 10, trustPaddingV: 6, trustPaddingH: 10 };
  }
  if (largeDesktop) {
    return { kickerSize: 15, subtitleSize: 20, trustSize: 11, trustPaddingV: 7, trustPaddingH: 11 };
  }
  return { kickerSize: 14, subtitleSize: 19, trustSize: 11, trustPaddingV: 7, trustPaddingH: 10 };
}

/** Opening-stage first-view lock — mirrored from LocalOpeningStageLayout (Travel-only). */
const TRAVEL_OPENING_STAGE_CHROME_ABOVE_PX = 62;
const TRAVEL_OPENING_STAGE_FULLSCREEN_CHROME_ABOVE_PX = 60;
const TRAVEL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX = 12;
const TRAVEL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_LOCK_PX = 0;
/** Display-only — counter shell gap + tighten Quick Help → Situation on desktop web. */
/** Pack 23 — pull Situations closer to Quick Help row. */
const TRAVEL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_PX = -34;
const TRAVEL_OPENING_STAGE_BELOW_FOLD_BUFFER_PX = 4;
/** Pack 36 — less cap trim so fullscreen hero can reach deeper target. */
const TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_MAX_TRIM_PX = 22;
const TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_FLOOR_OFFSET_PX = 58;
const TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_FLOOR_OFFSET_PX = 24;
/** Pack 42A — restore clean hero → Quick Help breathing room in fullscreen. */
const TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_GAP_PX = 14;
const TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_LOCK_GAP_PX = 14;
/** Display-only — neutral vs shell flex gap; lock stays 0 for hero budget. */
/** Pack 42A — fullscreen stack reset: keep Quick Help and Situations tightly separated without overlap. */
const TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_PX = -14;
const TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_LOCK_PX = 0;
const TRAVEL_OPENING_STAGE_FULLSCREEN_BELOW_FOLD_BUFFER_PX = 0;
/** Reserve ≥ compressed situation panel so hero lock leaves room for both grid rows. */
/** Pack 36 — slightly lower bottom reserve so opening stack sits nearer viewport bottom. */
const TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_PANEL_RESERVE_PX = 56;
/** Pack 1K — fullscreen opening-stage compression (spacing only; glass unchanged). */
const TRAVEL_SITUATION_SECTION_SHELL_PADDING_V_FULLSCREEN_PX = 2;
const TRAVEL_SITUATION_SECTION_SHELL_PADDING_V_NORMAL_PX = 2;
const TRAVEL_SITUATION_SECTION_SHELL_GAP_FULLSCREEN_PX = 2;
const TRAVEL_SITUATION_SECTION_SHELL_GAP_NORMAL_PX = 3;
const TRAVEL_SITUATION_SECTION_TITLE_LINE_HEIGHT_FULLSCREEN_PX = 11;
const TRAVEL_SITUATION_GRID_CARD_HEIGHT_FULLSCREEN_PX = 40;
const TRAVEL_SITUATION_GRID_ROW_GAP_FULLSCREEN_PX = 7;
const TRAVEL_SITUATION_GRID_ROW_GAP_DESKTOP_PX = 8;
const TRAVEL_SITUATION_GRID_ROW_GAP_TABLET_PX = 7;
const TRAVEL_SITUATION_GRID_ROW_GAP_MOBILE_PX = 8;
const TRAVEL_SITUATION_GRID_CARD_HEIGHT_DESKTOP_PX = 44;
const TRAVEL_SITUATION_GRID_CARD_HEIGHT_TABLET_PX = 48;
const TRAVEL_SITUATION_GRID_CARD_HEIGHT_MOBILE_PX = 52;
const TRAVEL_SITUATION_GRID_PADDING_H_DESKTOP_PX = 12;
const TRAVEL_SITUATION_GRID_INLINE_GAP_PX = 7;
const TRAVEL_FLAGSHIP_GRID_GAP_DESKTOP_PX = 14;
/** Pack 9 — premium cinematic Quick Help tiles (opening stage only). */
const TRAVEL_OPENING_STAGE_NORMAL_WEB_WORLD_CARD_MIN_HEIGHT_PX = 172;
const TRAVEL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX = 144;
/** Pack 19 — mobile Quick Help tile heights (not full desktop banners). */
const TRAVEL_QUICK_HELP_MOBILE_FLAGSHIP_MIN_HEIGHT_PX = 128;
const TRAVEL_QUICK_HELP_MOBILE_FLAGSHIP_MIN_HEIGHT_NARROW_PX = 118;
const TRAVEL_QUICK_HELP_OPENING_MOBILE_ROW_CLEARANCE_PX = 48;
/** Travel-only premium air between dynamic hero and quick-help row (display gap; hero lock unchanged). */
const TRAVEL_HERO_TO_QUICK_HELP_AIR_GAP_BONUS_PX = -4;
const TRAVEL_HERO_TO_QUICK_HELP_AIR_GAP_BONUS_FULLSCREEN_PX = 0;

function travelHeroToQuickHelpAirGap(baseGapPx: number, openingStageFullscreen = false): number {
  const bonus = openingStageFullscreen
    ? TRAVEL_HERO_TO_QUICK_HELP_AIR_GAP_BONUS_FULLSCREEN_PX
    : TRAVEL_HERO_TO_QUICK_HELP_AIR_GAP_BONUS_PX;
  return baseGapPx + bonus;
}

/** Pack 63A — touch/tablet has no reliable hover; tap selects hero context (nav on second tap). */
function travelQuickHelpPrefersTouchSelection(viewportWidth: number): boolean {
  if (Platform.OS !== 'web') return true;
  if (viewportWidth < 1024) return true;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }
  return false;
}

function useTravelQuickHelpTouchSelection(viewportWidth: number): boolean {
  const [touchSelection, setTouchSelection] = useState(() =>
    travelQuickHelpPrefersTouchSelection(viewportWidth)
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setTouchSelection(travelQuickHelpPrefersTouchSelection(viewportWidth));
      return;
    }
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const sync = () => {
      setTouchSelection(travelQuickHelpPrefersTouchSelection(viewportWidth));
    };
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, [viewportWidth]);

  return touchSelection;
}

/**
 * Hide shared bottom tab bar while Travel hub is focused — Local opening-stage parity.
 * Restored on blur so other tabs keep their bar.
 */
const TRAVEL_HIDDEN_TAB_BAR_STYLE = {
  display: 'none' as const,
  height: 0,
  opacity: 0,
  borderTopWidth: 0,
  pointerEvents: 'none' as const,
};

type TravelOpeningStageFirstViewLock = Readonly<{
  stageMinHeightPx: number;
  heroMaxPx: number;
  isFullscreen: boolean;
}>;

function computeTravelOpeningStageFirstViewLock(
  width: number,
  height: number,
  isFullscreen: boolean
): TravelOpeningStageFirstViewLock | null {
  if (Platform.OS !== 'web' || width < TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH || height <= 0) return null;
  if (isHubTabletPortraitViewport(width, height)) return null;
  const compactHero = height < 520 || width / height > 1.8;
  if (compactHero) return null;

  const labelBand =
    TRAVEL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX +
    (isFullscreen
      ? TRAVEL_FLAGSHIP_KICKER_TO_GRID_GAP_FULLSCREEN_PX
      : TRAVEL_FLAGSHIP_KICKER_TO_GRID_GAP_PX);
  const heroToCardGap = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_LOCK_GAP_PX
    : TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_TO_CARD_LOCK_GAP_PX;
  const cardMinHeight = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX
    : TRAVEL_OPENING_STAGE_NORMAL_WEB_WORLD_CARD_MIN_HEIGHT_PX;
  const stackBelowHeroPx = heroToCardGap + labelBand + cardMinHeight;

  const chromeAbove = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_CHROME_ABOVE_PX
    : TRAVEL_OPENING_STAGE_CHROME_ABOVE_PX;
  const forYouBridge = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_LOCK_PX
    : TRAVEL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_LOCK_PX;
  const belowFoldBuffer = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_BELOW_FOLD_BUFFER_PX
    : TRAVEL_OPENING_STAGE_BELOW_FOLD_BUFFER_PX;
  const bottomReserve = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_PANEL_RESERVE_PX +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX
    : 0;

  const contentBudget = Math.max(
    360,
    height - chromeAbove - forYouBridge - belowFoldBuffer - bottomReserve
  );
  const heroCap =
    TRAVEL_WEB_HERO_MAX_PX +
    TRAVEL_HERO_LABEL_AWARE_MAX_BONUS_PX -
    (isFullscreen ? TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_MAX_TRIM_PX : 0);
  const heroFloorOffset = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_FLOOR_OFFSET_PX
    : TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_FLOOR_OFFSET_PX;
  const heroBudgetPx = contentBudget - stackBelowHeroPx;
  const heroDepthTargetPx = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_WEB_HERO_TARGET_PX
    : TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_TARGET_PX;
  const heroMaxPx = Math.min(
    heroCap,
    heroBudgetPx >= heroDepthTargetPx ? heroDepthTargetPx : heroBudgetPx
  );

  /** Pack 11 — allow fullscreen hero lock down to dedicated target (~324px). */
  const minHeroLockPx = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_LOCK_FLOOR_PX
    : TRAVEL_OPENING_STAGE_NORMAL_WEB_HERO_LOCK_FLOOR_PX;
  if (heroMaxPx < minHeroLockPx) return null;

  /** Pack 11 — tight opening-stage min height on desktop (no dead air above Situations). */
  const heroCardShellSlackPx = isFullscreen
    ? TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_CARD_SHELL_SLACK_PX
    : TRAVEL_OPENING_STAGE_HERO_CARD_SHELL_SLACK_PX;
  const openingStageRenderedMinPx = stackBelowHeroPx + heroMaxPx + heroCardShellSlackPx;
  const stageMinHeightPx =
    width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH || isFullscreen
      ? openingStageRenderedMinPx
      : contentBudget;

  const lock: TravelOpeningStageFirstViewLock = {
    stageMinHeightPx,
    heroMaxPx,
    isFullscreen,
  };

  if (width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH || isFullscreen) {
    return lock;
  }

  if (heroBudgetPx < heroCap) {
    return { ...lock, stageMinHeightPx: stackBelowHeroPx + heroMaxPx };
  }

  return null;
}

/** Travel dynamic hero — Local height family (430–504px desktop), Travel midnight soul. */
function travelDynamicHeroMetrics(
  viewportWidth: number,
  viewportHeight: number,
  openingStageHeroMaxPx?: number,
  openingStageFullscreen?: boolean,
  heroTitleText = ''
): Readonly<{
  stageMinHeight: number;
  stageMaxHeight: number;
  aspectRatio: number;
  objectPosition: string;
  heroKickerSize: number;
  heroKickerLetterSpacing: number;
  heroKickerMarginBottom: number;
  heroTitleSize: number;
  heroTitleLineHeight: number;
  heroTitleMarginBottom: number;
  heroTitleMaxWidth: number;
  heroSubSize: number;
  heroSubLineHeight: number;
  heroSubMarginBottom: number;
  heroSubMaxWidth: number;
  heroSubLines: number;
  heroTrustGap: number;
  heroTrustFontSize: number;
  heroTrustPaddingV: number;
  heroTrustPaddingH: number;
  heroTrustNoWrap: boolean;
  textStackMaxWidthPx: number;
  textStackWidthPx: number;
  textStackWidthPercent: number;
  textStackWidthVw: number;
  textStackLeftInsetPercent: number;
  textStackLeftInsetPx: number;
  textStackMinWidthPx: number;
  chipMinWidthPx: number;
  chipMaxWidthPx: number;
  textVeilWidthPercent: number;
  textScrimWidthPx: number;
  useAbsoluteTextLayer: boolean;
  textStackPaddingTopPx: number;
  textStackPaddingBottomPx: number;
}> {
  const typo = TRAVEL_HERO_TYPOGRAPHY;
  const compactHero =
    viewportHeight > 0 && (viewportHeight < 520 || viewportWidth / viewportHeight > 1.8);
  const desktopWebHero =
    Platform.OS === 'web' &&
    viewportWidth >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH &&
    !compactHero &&
    !isHubTabletPortraitViewport(viewportWidth, viewportHeight);
  const kickerLetterSpacing = travelHeroKickerLetterSpacingPx(
    typo.kicker.fontSize,
    typo.kicker.letterSpacingEm
  );

  if (compactHero) {
    const title = typo.titleCompact;
    const sub = typo.subtitleCompact;
    const space = typo.spacingMobile;
    const stackWidth = Math.min(360, Math.max(280, Math.round(viewportWidth * 0.82)));
    return {
      aspectRatio: TRAVEL_HERO_ASPECT,
      stageMinHeight: 268,
      stageMaxHeight: 392,
      objectPosition: '64% 42%',
      heroKickerSize: typo.kicker.fontSize,
      heroKickerLetterSpacing: kickerLetterSpacing,
      heroKickerMarginBottom: space.kickerToTitle,
      heroTitleSize: title.fontSize,
      heroTitleLineHeight: travelHeroLineHeight(title.fontSize, title.lineHeightRatio),
      heroTitleMarginBottom: space.titleToSubtitle,
      heroTitleMaxWidth: stackWidth,
      heroSubSize: sub.fontSize,
      heroSubLineHeight: travelHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
      heroSubMarginBottom: space.subtitleToMeta,
      heroSubMaxWidth: stackWidth,
      heroSubLines: 0,
      heroTrustGap: typo.trustGapPx,
      heroTrustFontSize: typo.trust.fontSize,
      heroTrustPaddingV: 6,
      heroTrustPaddingH: 10,
      heroTrustNoWrap: false,
      textStackMaxWidthPx: stackWidth,
      textStackWidthPx: stackWidth,
      textStackWidthPercent: 92,
      textStackWidthVw: 0,
      textStackLeftInsetPercent: 0,
      textStackLeftInsetPx: 0,
      textStackMinWidthPx: 0,
      chipMinWidthPx: 0,
      chipMaxWidthPx: 0,
      textVeilWidthPercent: 88,
      textScrimWidthPx: stackWidth,
      useAbsoluteTextLayer: false,
      textStackPaddingTopPx: 20,
      textStackPaddingBottomPx: 20,
    };
  }
  if (desktopWebHero) {
    const heroCap =
      openingStageHeroMaxPx ?? TRAVEL_WEB_HERO_MAX_PX + TRAVEL_HERO_LABEL_AWARE_MAX_BONUS_PX;
    const heroMin =
      openingStageHeroMaxPx != null
        ? Math.min(TRAVEL_WEB_HERO_MIN_PX, heroCap)
        : TRAVEL_WEB_HERO_MIN_PX;
    const largeDesktop = viewportWidth >= TRAVEL_HERO_LARGE_DESKTOP_MIN_WIDTH;
    const isFullscreenDesktop = Boolean(openingStageFullscreen);
    const titlePreset = travelHeroEditorialTitlePreset(viewportWidth, isFullscreenDesktop);
    const titleScale = titlePreset
      ? {
          fontSize: titlePreset.fontSize,
          lineHeightRatio: titlePreset.lineHeightPx / titlePreset.fontSize,
          maxWidthPx: titlePreset.titleMaxWidthPx,
        }
      : travelHeroEditorialTitleScale(
          viewportWidth,
          isFullscreenDesktop,
          heroCap,
          heroTitleText
        );
    const readability = travelHeroWebReadabilityScale(true, largeDesktop);
    const sub = { fontSize: readability.subtitleSize, lineHeightRatio: 1.46 };
    const space = TRAVEL_HERO_EDITORIAL_SPACING_DESKTOP;
    const editorial = travelHeroEditorialRecomposeLayout(
      viewportWidth,
      largeDesktop,
      desktopWebHero,
      isFullscreenDesktop,
      heroCap,
      heroTitleText
    );
    return {
      aspectRatio: TRAVEL_HERO_ASPECT,
      stageMinHeight: heroMin,
      stageMaxHeight: heroCap,
      objectPosition: `64% ${TRAVEL_DYNAMIC_HERO_OBJECT_POSITION_Y_NORMAL}`,
      heroKickerSize: readability.kickerSize,
      heroKickerLetterSpacing: travelHeroKickerLetterSpacingPx(
        readability.kickerSize,
        typo.kicker.letterSpacingEm
      ),
      heroKickerMarginBottom: space.kickerToTitle,
      heroTitleSize: titleScale.fontSize,
      heroTitleLineHeight: titlePreset
        ? titlePreset.lineHeightPx
        : travelHeroLineHeight(titleScale.fontSize, titleScale.lineHeightRatio),
      heroTitleMarginBottom: space.titleToSubtitle,
      heroTitleMaxWidth: editorial.titleMaxWidthPx,
      heroSubSize: sub.fontSize,
      heroSubLineHeight: travelHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
      heroSubMarginBottom: space.subtitleToChips,
      heroSubMaxWidth: editorial.subtitleMaxWidthPx,
      heroSubLines: 0,
      heroTrustGap: typo.trustGapPx,
      heroTrustFontSize: readability.trustSize,
      heroTrustPaddingV: readability.trustPaddingV,
      heroTrustPaddingH: readability.trustPaddingH,
      heroTrustNoWrap: true,
      textStackMaxWidthPx: editorial.zoneWidthPx,
      textStackWidthPx: editorial.zoneWidthPx,
      textStackWidthPercent: editorial.zoneWidthPercent,
      textStackWidthVw: editorial.zoneWidthVw,
      textStackLeftInsetPercent: editorial.zoneLeftInsetPercent,
      textStackLeftInsetPx: editorial.zoneLeftInsetPx,
      textStackMinWidthPx: editorial.zoneMinWidthPx,
      chipMinWidthPx: editorial.chipMinWidthPx,
      chipMaxWidthPx: editorial.chipMaxWidthPx,
      textVeilWidthPercent: editorial.textVeilWidthPercent,
      textScrimWidthPx: editorial.textScrimWidthPx,
      useAbsoluteTextLayer: editorial.useAbsoluteLayer,
      textStackPaddingTopPx: editorial.textStackPaddingTopPx,
      textStackPaddingBottomPx: editorial.textStackPaddingBottomPx,
    };
  }
  if (viewportWidth < 768) {
    const title = typo.titleMobile;
    const sub = typo.subtitleMobile;
    const space = typo.spacingMobile;
    const stackWidth = Math.min(
      360,
      Math.max(300, Math.round(viewportWidth * 0.88)),
      hubWebEffectiveContentWidth(viewportWidth, 12)
    );
    const titleSize = Math.min(title.fontSize, Math.max(22, Math.round(viewportWidth * 0.068)));
    return {
      aspectRatio: TRAVEL_HERO_ASPECT,
      stageMinHeight: 300,
      stageMaxHeight: 428,
      objectPosition: '58% 40%',
      heroKickerSize: typo.kicker.fontSize,
      heroKickerLetterSpacing: kickerLetterSpacing,
      heroKickerMarginBottom: space.kickerToTitle,
      heroTitleSize: titleSize,
      heroTitleLineHeight: travelHeroLineHeight(titleSize, title.lineHeightRatio),
      heroTitleMarginBottom: space.titleToSubtitle,
      heroTitleMaxWidth: stackWidth,
      heroSubSize: sub.fontSize,
      heroSubLineHeight: travelHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
      heroSubMarginBottom: space.subtitleToMeta,
      heroSubMaxWidth: stackWidth,
      heroSubLines: 0,
      heroTrustGap: typo.trustGapPx,
      heroTrustFontSize: typo.trust.fontSize,
      heroTrustPaddingV: 6,
      heroTrustPaddingH: 10,
      heroTrustNoWrap: false,
      textStackMaxWidthPx: stackWidth,
      textStackWidthPx: stackWidth,
      textStackWidthPercent: 90,
      textStackWidthVw: 0,
      textStackLeftInsetPercent: 0,
      textStackLeftInsetPx: 0,
      textStackMinWidthPx: 0,
      chipMinWidthPx: 0,
      chipMaxWidthPx: 0,
      textVeilWidthPercent: 86,
      textScrimWidthPx: stackWidth,
      useAbsoluteTextLayer: false,
      textStackPaddingTopPx: 24,
      textStackPaddingBottomPx: 30,
    };
  }
  const title = typo.titleTablet;
  const sub = typo.subtitleTablet;
  const space = typo.spacingTablet;
  const stackWidth = Math.min(
    Math.round(viewportWidth * 0.9),
    Math.max(440, Math.round(viewportWidth * 0.88)),
    hubWebEffectiveContentWidth(viewportWidth, 16)
  );
  return {
    aspectRatio: TRAVEL_HERO_ASPECT,
    stageMinHeight: 320,
    stageMaxHeight: 432,
    objectPosition: '62% 40%',
    heroKickerSize: typo.kicker.fontSize,
    heroKickerLetterSpacing: kickerLetterSpacing,
    heroKickerMarginBottom: space.kickerToTitle,
    heroTitleSize: title.fontSize,
    heroTitleLineHeight: travelHeroLineHeight(title.fontSize, title.lineHeightRatio),
    heroTitleMarginBottom: space.titleToSubtitle,
    heroTitleMaxWidth: stackWidth,
    heroSubSize: sub.fontSize,
    heroSubLineHeight: travelHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
    heroSubMarginBottom: space.subtitleToMeta,
    heroSubMaxWidth: stackWidth,
    heroSubLines: 0,
    heroTrustGap: typo.trustGapPx,
    heroTrustFontSize: typo.trust.fontSize,
    heroTrustPaddingV: 6,
    heroTrustPaddingH: 10,
    heroTrustNoWrap: false,
    textStackMaxWidthPx: stackWidth,
    textStackWidthPx: stackWidth,
    textStackWidthPercent: 76,
    textStackWidthVw: 0,
    textStackLeftInsetPercent: 0,
    textStackLeftInsetPx: 0,
    textStackMinWidthPx: 0,
    chipMinWidthPx: 0,
    chipMaxWidthPx: 0,
    textVeilWidthPercent: 82,
    textScrimWidthPx: stackWidth,
    useAbsoluteTextLayer: false,
    textStackPaddingTopPx: 20,
    textStackPaddingBottomPx: 20,
  };
}

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TravelRoute = RouteProp<RootStackParamList, 'TravelHub'>;

type TravelScenarioId =
  | 'airport'
  | 'hotel'
  | 'taxi'
  | 'restaurant'
  | 'transit'
  | 'shopping'
  | 'hospital'
  | 'emergency'
  | 'translation';

type TravelScenario = Readonly<{
  id: TravelScenarioId;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelSemanticAccent;
  capsuleSecondary?: TravelSemanticAccent;
  onPress: () => void;
}>;

type TravelScenarioAccentPalette = Readonly<{
  accent: TravelSemanticAccent;
  capsuleSecondary?: TravelSemanticAccent;
  glowRgb: readonly [number, number, number];
  tintGradient: readonly [string, string];
  iconColor: string;
}>;

/** Pack 1 — semantic multicolor accents (one premium glass family, per-scenario tint). */
const TRAVEL_SCENARIO_ACCENT_PALETTE: Readonly<Record<TravelScenarioId, TravelScenarioAccentPalette>> = {
  airport: {
    accent: 'cyan',
    glowRgb: [100, 210, 255],
    tintGradient: ['rgba(100, 210, 255, 0.14)', 'rgba(100, 210, 255, 0.03)'],
    iconColor: 'rgba(186, 238, 255, 0.96)',
  },
  taxi: {
    accent: 'cyan',
    capsuleSecondary: 'emerald',
    glowRgb: [72, 168, 255],
    tintGradient: ['rgba(72, 168, 255, 0.13)', 'rgba(72, 168, 255, 0.02)'],
    iconColor: 'rgba(164, 210, 255, 0.96)',
  },
  transit: {
    accent: 'cyan',
    glowRgb: [64, 220, 210],
    tintGradient: ['rgba(64, 220, 210, 0.12)', 'rgba(64, 220, 210, 0.02)'],
    iconColor: 'rgba(162, 248, 238, 0.96)',
  },
  hotel: {
    accent: 'gold',
    glowRgb: [232, 196, 120],
    tintGradient: ['rgba(232, 196, 120, 0.13)', 'rgba(232, 196, 120, 0.02)'],
    iconColor: 'rgba(255, 236, 200, 0.96)',
  },
  restaurant: {
    accent: 'emerald',
    glowRgb: [88, 220, 160],
    tintGradient: ['rgba(88, 220, 160, 0.11)', 'rgba(88, 220, 160, 0.02)'],
    iconColor: 'rgba(186, 255, 220, 0.96)',
  },
  shopping: {
    accent: 'violet',
    capsuleSecondary: 'gold',
    glowRgb: [180, 160, 240],
    tintGradient: ['rgba(180, 160, 240, 0.12)', 'rgba(180, 160, 240, 0.02)'],
    iconColor: 'rgba(224, 206, 255, 0.96)',
  },
  hospital: {
    accent: 'emerald',
    glowRgb: [72, 210, 190],
    tintGradient: ['rgba(72, 210, 190, 0.11)', 'rgba(72, 210, 190, 0.02)'],
    iconColor: 'rgba(176, 255, 236, 0.96)',
  },
  translation: {
    accent: 'violet',
    capsuleSecondary: 'magenta',
    glowRgb: [196, 164, 255],
    tintGradient: ['rgba(196, 164, 255, 0.13)', 'rgba(196, 164, 255, 0.02)'],
    iconColor: 'rgba(232, 212, 255, 0.96)',
  },
  emergency: {
    accent: 'magenta',
    glowRgb: [255, 92, 140],
    tintGradient: ['rgba(255, 92, 140, 0.14)', 'rgba(255, 92, 140, 0.02)'],
    iconColor: 'rgba(255, 186, 210, 0.96)',
  },
};

const SCENARIO_SEMANTIC: Readonly<Record<TravelScenarioId, TravelSemanticAccent>> = {
  airport: TRAVEL_SCENARIO_ACCENT_PALETTE.airport.accent,
  hotel: TRAVEL_SCENARIO_ACCENT_PALETTE.hotel.accent,
  taxi: TRAVEL_SCENARIO_ACCENT_PALETTE.taxi.accent,
  restaurant: TRAVEL_SCENARIO_ACCENT_PALETTE.restaurant.accent,
  transit: TRAVEL_SCENARIO_ACCENT_PALETTE.transit.accent,
  shopping: TRAVEL_SCENARIO_ACCENT_PALETTE.shopping.accent,
  hospital: TRAVEL_SCENARIO_ACCENT_PALETTE.hospital.accent,
  emergency: TRAVEL_SCENARIO_ACCENT_PALETTE.emergency.accent,
  translation: TRAVEL_SCENARIO_ACCENT_PALETTE.translation.accent,
};

const SCENARIO_CAPSULE_SECONDARY: Partial<Readonly<Record<TravelScenarioId, TravelSemanticAccent>>> = {
  taxi: TRAVEL_SCENARIO_ACCENT_PALETTE.taxi.capsuleSecondary,
  shopping: TRAVEL_SCENARIO_ACCENT_PALETTE.shopping.capsuleSecondary,
  translation: TRAVEL_SCENARIO_ACCENT_PALETTE.translation.capsuleSecondary,
};

/** Situation glass — tokens.glow is rgba(...); never append hex suffixes (Pack 1H audit). */
function travelSituationGlassAlpha(glow: string, alpha: number): string {
  const match = glow.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  }
  return glow;
}

/** FX reference card material alphas — mirrored from TravelFxReferenceGlassCard (Pack 1I). */
const TRAVEL_FX_GLASS_BODY_ALPHA = 0.03;
const TRAVEL_FX_GLASS_GLOW_ALPHA = 0.12;
const TRAVEL_FX_GLASS_GLOW_ACTIVE_ALPHA = 0.14;
const TRAVEL_FX_GLASS_STROKE_ALPHA = 0.32;
const TRAVEL_FX_GLASS_STROKE_ACTIVE_ALPHA = 0.38;
const TRAVEL_FX_GLASS_GOLD_GLOW_ALPHA = 0.14;
const TRAVEL_FX_GLASS_GOLD_GLOW_ACTIVE_ALPHA = 0.16;
const TRAVEL_FX_GLASS_GOLD_STROKE_ALPHA = 0.34;
const TRAVEL_FX_GLASS_GOLD_STROKE_ACTIVE_ALPHA = 0.4;

const TRAVEL_SITUATION_HOVER_MS = 200;

const TRAVEL_SITUATION_LIGHT_NETWORK_NODES: readonly {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}[] = [
  { x: 14, y: 22, size: 3, opacity: 0.42, color: 'rgba(132, 228, 255, 0.55)' },
  { x: 38, y: 58, size: 2, opacity: 0.34, color: 'rgba(92, 205, 255, 0.48)' },
  { x: 56, y: 28, size: 3, opacity: 0.38, color: 'rgba(148, 228, 255, 0.5)' },
  { x: 72, y: 64, size: 2, opacity: 0.3, color: 'rgba(98, 255, 228, 0.42)' },
  { x: 84, y: 34, size: 2, opacity: 0.32, color: 'rgba(176, 148, 255, 0.38)' },
  { x: 26, y: 74, size: 2, opacity: 0.28, color: 'rgba(92, 205, 255, 0.4)' },
  { x: 62, y: 12, size: 2, opacity: 0.26, color: 'rgba(132, 228, 255, 0.38)' },
  { x: 48, y: 82, size: 2, opacity: 0.24, color: 'rgba(88, 220, 160, 0.32)' },
];

function travelSituationScenarioMaterial(
  scenarioId: TravelScenarioId,
  active: boolean
): Readonly<{ stroke: string; glow: string; tintGradient: readonly [string, string]; iconColor: string }> {
  const palette = TRAVEL_SCENARIO_ACCENT_PALETTE[scenarioId];
  const [r, g, b] = palette.glowRgb;
  const strokeAlpha = active ? 0.86 : 0.78;
  const glowAlpha = active ? 0.12 : 0.09;
  return {
    stroke: `rgba(${r}, ${g}, ${b}, ${strokeAlpha})`,
    glow: `rgba(${r}, ${g}, ${b}, ${glowAlpha})`,
    tintGradient: palette.tintGradient,
    iconColor: travelSituationGlassAlpha(palette.iconColor, active ? 1 : 0.99),
  };
}

function travelSituationCardWebFrameStyle(
  scenarioMaterial: ReturnType<typeof travelSituationScenarioMaterial>,
  active: boolean
): ViewStyle | undefined {
  if (Platform.OS !== 'web') return undefined;
  const { stroke, glow } = scenarioMaterial;
  return {
    boxShadow: active
      ? `inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 0 1px ${stroke}, 0 0 14px ${glow}, 0 2px 6px rgba(8, 18, 32, 0.22)`
      : `inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 0 0 1px ${stroke}, 0 0 10px ${glow}, 0 2px 5px rgba(8, 18, 32, 0.18)`,
    transition: `transform ${TRAVEL_SITUATION_HOVER_MS}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${TRAVEL_SITUATION_HOVER_MS}ms ease-out, border-color ${TRAVEL_SITUATION_HOVER_MS}ms ease-out, background-color ${TRAVEL_SITUATION_HOVER_MS}ms ease-out`,
  } as ViewStyle;
}

function travelSituationFxMaterial(
  accent: TravelSemanticAccent,
  active: boolean
): Readonly<{ stroke: string; glow: string; iconColor: string }> {
  const tokens = travelSemanticTokens(accent);
  const isGold = accent === 'gold';
  const strokeAlpha = isGold
    ? active
      ? TRAVEL_FX_GLASS_GOLD_STROKE_ACTIVE_ALPHA
      : TRAVEL_FX_GLASS_GOLD_STROKE_ALPHA
    : active
      ? TRAVEL_FX_GLASS_STROKE_ACTIVE_ALPHA
      : TRAVEL_FX_GLASS_STROKE_ALPHA;
  const glowAlpha = isGold
    ? active
      ? TRAVEL_FX_GLASS_GOLD_GLOW_ACTIVE_ALPHA
      : TRAVEL_FX_GLASS_GOLD_GLOW_ALPHA
    : active
      ? TRAVEL_FX_GLASS_GLOW_ACTIVE_ALPHA
      : TRAVEL_FX_GLASS_GLOW_ALPHA;
  return {
    stroke: travelSituationGlassAlpha(tokens.glow, strokeAlpha),
    glow: travelSituationGlassAlpha(tokens.glow, glowAlpha),
    iconColor: active ? tokens.inkHover : tokens.ink,
  };
}

function travelSituationGridLayout(
  viewportWidth: number,
  viewportHeight = 0,
  openingStageFullscreen = false
): Readonly<{
  columns: 2 | 3 | 4;
  gap: number;
  minCardHeight: number;
  paddingHorizontal: number;
  capsuleSize: number;
  iconSize: number;
  titleLines: 1 | 2;
}> {
  if (openingStageFullscreen && viewportWidth >= 1024) {
    return {
      columns: 4,
      gap: TRAVEL_SITUATION_GRID_ROW_GAP_FULLSCREEN_PX,
      minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_FULLSCREEN_PX,
      paddingHorizontal: TRAVEL_SITUATION_GRID_PADDING_H_DESKTOP_PX,
      capsuleSize: 22,
      iconSize: 12,
      titleLines: 1,
    };
  }
  if (viewportWidth >= 1024) {
    if (isHubTabletPortraitViewport(viewportWidth, viewportHeight)) {
      return {
        columns: 2,
        gap: TRAVEL_SITUATION_GRID_ROW_GAP_TABLET_PX,
        minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_TABLET_PX,
        paddingHorizontal: 12,
        capsuleSize: 26,
        iconSize: 12,
        titleLines: 2,
      };
    }
    return {
      columns: 4,
      gap: TRAVEL_SITUATION_GRID_ROW_GAP_DESKTOP_PX,
      minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_DESKTOP_PX,
      paddingHorizontal: TRAVEL_SITUATION_GRID_PADDING_H_DESKTOP_PX,
      capsuleSize: 24,
      iconSize: 12,
      titleLines: 1,
    };
  }
  if (viewportWidth >= 900) {
    return {
      columns: 4,
      gap: TRAVEL_SITUATION_GRID_ROW_GAP_DESKTOP_PX,
      minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_DESKTOP_PX,
      paddingHorizontal: TRAVEL_SITUATION_GRID_PADDING_H_DESKTOP_PX,
      capsuleSize: 24,
      iconSize: 12,
      titleLines: 1,
    };
  }
  if (viewportWidth >= 768) {
    if (isHubTabletPortraitViewport(viewportWidth, viewportHeight)) {
      return {
        columns: 2,
        gap: TRAVEL_SITUATION_GRID_ROW_GAP_TABLET_PX,
        minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_TABLET_PX,
        paddingHorizontal: 12,
        capsuleSize: 26,
        iconSize: 12,
        titleLines: 2,
      };
    }
    return {
      columns: 3,
      gap: TRAVEL_SITUATION_GRID_ROW_GAP_TABLET_PX,
      minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_TABLET_PX,
      paddingHorizontal: 11,
      capsuleSize: 26,
      iconSize: 12,
      titleLines: 2,
    };
  }
  return {
    columns: 2,
    gap: TRAVEL_SITUATION_GRID_ROW_GAP_MOBILE_PX,
    minCardHeight: TRAVEL_SITUATION_GRID_CARD_HEIGHT_MOBILE_PX,
    paddingHorizontal: 11,
    capsuleSize: 26,
    iconSize: 12,
    titleLines: 2,
  };
}

function travelSituationSectionSpacing(openingStageFullscreen: boolean): Readonly<{
  shellPaddingVertical: number;
  shellGap: number;
  titleLineHeight: number;
}> {
  if (openingStageFullscreen) {
    return {
      shellPaddingVertical: TRAVEL_SITUATION_SECTION_SHELL_PADDING_V_FULLSCREEN_PX,
      shellGap: TRAVEL_SITUATION_SECTION_SHELL_GAP_FULLSCREEN_PX,
      titleLineHeight: TRAVEL_SITUATION_SECTION_TITLE_LINE_HEIGHT_FULLSCREEN_PX,
    };
  }
  return {
    shellPaddingVertical: TRAVEL_SITUATION_SECTION_SHELL_PADDING_V_NORMAL_PX,
    shellGap: TRAVEL_SITUATION_SECTION_SHELL_GAP_NORMAL_PX,
    titleLineHeight: 12,
  };
}

function chunkTravelSituationRows<T>(items: readonly T[], columns: number): readonly (readonly T[])[] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }
  return rows;
}

function travelUtilityGridMetrics(
  viewportWidth: number,
  viewportHeight = 0,
  openingStageFullscreen = false
): Readonly<{
  gridGap: number;
  flagshipGridGap: number;
}> {
  const { gap } = travelSituationGridLayout(viewportWidth, viewportHeight, openingStageFullscreen);
  if (viewportWidth >= 1024) {
    return { gridGap: gap, flagshipGridGap: TRAVEL_FLAGSHIP_GRID_GAP_DESKTOP_PX };
  }
  return { gridGap: gap, flagshipGridGap: 12 };
}

/** Pack 32 — root id for web legacy floating overlay suppression (matches VionaMiniAppShell). */
const TRAVEL_HUB_LEGACY_SUPPRESS_ROOT_ID = 'travel-hub-root';

/** @deprecated Pack 32 — legacy floats suppressed on mobile web; reserve no longer needed. */
const TRAVEL_MOBILE_FLOATING_CHROME_RESERVE_PX = 0;

/** Travel Experience Intelligence Zone rhythm — Destination Lens / Local Map Concierge / Universe Bridge. */
function travelExperienceZoneRhythmMetrics(
  viewportWidth: number,
  viewportHeight = 0
): Readonly<{
  secondaryZoneMarginTop: number;
  secondaryZoneGap: number;
  secondaryZonePaddingBottom: number;
  lensToDestinationGap: number;
  destinationToLocalGap: number;
  localToConnectedGap: number;
  sectionKickerMarginTop: number;
  sectionKickerMarginBottom: number;
  scrollBottomExtra: number;
  hubScrollTailHeight: number;
  metaInnerGap: number;
  mapCardInnerGap: number;
  mapShellHeight: number;
  metaInputMinHeight: number;
  connectedStripMarginBottom: number;
  connectedChipGap: number;
  destinationTwoColumn: boolean;
  connectedChipFullWidth: boolean;
  localAssistCompact: boolean;
  pilotStripMarginBottom: number;
  experienceZoneMobileFloatSpacer: number;
  universeBridgeMobileClearance: number;
}> {
  const tabletPortrait = isHubTabletPortraitViewport(viewportWidth, viewportHeight);
  if (viewportWidth >= 1024 && !tabletPortrait) {
    return {
      secondaryZoneMarginTop: 22,
      secondaryZoneGap: 14,
      secondaryZonePaddingBottom: 0,
      lensToDestinationGap: 22,
      destinationToLocalGap: 28,
      localToConnectedGap: 28,
      sectionKickerMarginTop: 8,
      sectionKickerMarginBottom: 10,
      scrollBottomExtra: 96,
      hubScrollTailHeight: 24,
      metaInnerGap: 4,
      mapCardInnerGap: 10,
      mapShellHeight: 168,
      metaInputMinHeight: 22,
      connectedStripMarginBottom: 18,
      connectedChipGap: 10,
      destinationTwoColumn: true,
      connectedChipFullWidth: false,
      localAssistCompact: false,
      pilotStripMarginBottom: 0,
      experienceZoneMobileFloatSpacer: 0,
      universeBridgeMobileClearance: 0,
    };
  }
  if (viewportWidth >= 768) {
    return {
      secondaryZoneMarginTop: theme.spacing.md,
      secondaryZoneGap: 14,
      secondaryZonePaddingBottom: 8,
      lensToDestinationGap: 16,
      destinationToLocalGap: 20,
      localToConnectedGap: 22,
      sectionKickerMarginTop: 10,
      sectionKickerMarginBottom: 10,
      scrollBottomExtra: 128,
      hubScrollTailHeight: 88,
      metaInnerGap: 4,
      mapCardInnerGap: 8,
      mapShellHeight: 156,
      metaInputMinHeight: 24,
      connectedStripMarginBottom: theme.spacing.lg,
      connectedChipGap: 12,
      destinationTwoColumn: false,
      connectedChipFullWidth: true,
      localAssistCompact: true,
      pilotStripMarginBottom: 2,
      experienceZoneMobileFloatSpacer: 0,
      universeBridgeMobileClearance: 0,
    };
  }
  return {
    secondaryZoneMarginTop: theme.spacing.md,
    secondaryZoneGap: 14,
    secondaryZonePaddingBottom: 20,
    lensToDestinationGap: 14,
    destinationToLocalGap: 16,
    localToConnectedGap: 18,
    sectionKickerMarginTop: 8,
    sectionKickerMarginBottom: 8,
    scrollBottomExtra: 560,
    hubScrollTailHeight: 480,
    metaInnerGap: 4,
    mapCardInnerGap: 8,
    mapShellHeight: 128,
    metaInputMinHeight: 20,
    connectedStripMarginBottom: 88,
    connectedChipGap: 14,
    destinationTwoColumn: false,
    connectedChipFullWidth: true,
    localAssistCompact: true,
    pilotStripMarginBottom: 2,
    experienceZoneMobileFloatSpacer: 360,
    universeBridgeMobileClearance: 220,
  };
}

/** @deprecated alias — Travel Experience Intelligence Zone rhythm */
function travelSecondaryRhythmMetrics(viewportWidth: number, viewportHeight = 0) {
  return travelExperienceZoneRhythmMetrics(viewportWidth, viewportHeight);
}

/** Pack 4 patch — desktop vertical rhythm + dock clearance (>=1024 only). */
function travelDesktopVerticalRhythmMetrics(viewportWidth: number): Readonly<{
  pilotStripMarginBottom: number;
  quickHelpKickerMarginTop: number;
  quickHelpKickerMarginBottom: number;
  quickHelpRowMarginBottom: number;
  scenariosKickerMarginTop: number;
  scenariosKickerMarginBottom: number;
  groupKickerMarginBottom: number;
  groupBlockMarginBottom: number;
  scenarioGridMarginBottom: number;
  secondaryZoneMarginTop: number;
  secondaryZoneGap: number;
  destinationToLocalGap: number;
  sectionKickerMarginTop: number;
  sectionKickerMarginBottom: number;
  scrollBottomExtra: number;
  metaInnerGap: number;
  mapCardInnerGap: number;
  mapShellHeight: number;
  metaInputMinHeight: number;
  connectedStripMarginBottom: number;
}> {
  if (viewportWidth >= 1024) {
    return {
      pilotStripMarginBottom: 0,
      quickHelpKickerMarginTop: 2,
      quickHelpKickerMarginBottom: 4,
      quickHelpRowMarginBottom: 6,
      scenariosKickerMarginTop: 0,
      scenariosKickerMarginBottom: 5,
      groupKickerMarginBottom: 4,
      groupBlockMarginBottom: 2,
      scenarioGridMarginBottom: 1,
      secondaryZoneMarginTop: 16,
      secondaryZoneGap: 8,
      destinationToLocalGap: 20,
      sectionKickerMarginTop: 6,
      sectionKickerMarginBottom: 6,
      scrollBottomExtra: 96,
      metaInnerGap: 5,
      mapCardInnerGap: 8,
      mapShellHeight: 132,
      metaInputMinHeight: 36,
      connectedStripMarginBottom: 12,
    };
  }
  return {
    pilotStripMarginBottom: 2,
    quickHelpKickerMarginTop: 6,
    quickHelpKickerMarginBottom: 10,
    quickHelpRowMarginBottom: theme.spacing.md,
    scenariosKickerMarginTop: 4,
    scenariosKickerMarginBottom: 10,
    groupKickerMarginBottom: 7,
    groupBlockMarginBottom: theme.spacing.xs,
    scenarioGridMarginBottom: theme.spacing.sm,
    secondaryZoneMarginTop: theme.spacing.md,
    secondaryZoneGap: 10,
    destinationToLocalGap: 14,
    sectionKickerMarginTop: 10,
    sectionKickerMarginBottom: 8,
    scrollBottomExtra: 48,
    metaInnerGap: 6,
    mapCardInnerGap: 8,
    mapShellHeight: 128,
    metaInputMinHeight: 40,
    connectedStripMarginBottom: theme.spacing.xl,
  };
}

/** Four flagship cards — Local opening row grammar (Travel soul accents). */
const TRAVEL_FLAGSHIP_IDS = ['airport', 'translation', 'taxi', 'emergency'] as const satisfies readonly TravelScenarioId[];

/** Pack 46 — web Quick Help magnetic lift (outer host only; matches Home/Local feel). */
const TRAVEL_QUICK_HELP_WEB_HOVER_LIFT_PX = -5;
const TRAVEL_QUICK_HELP_WEB_HOVER_SCALE = 1.015;
const TRAVEL_QUICK_HELP_WEB_SELECTED_LIFT_PX = -2;
const TRAVEL_QUICK_HELP_WEB_SELECTED_SCALE = 1.008;

type TravelFlagshipScenarioId = (typeof TRAVEL_FLAGSHIP_IDS)[number];

/** Travel dynamic hero + flagship card artwork (Travel-only). */
type TravelDynamicHeroKey =
  | 'default'
  | 'journey'
  | 'rides'
  | 'transit'
  | 'family'
  | 'global'
  | 'interpreter'
  | 'cityConcierge'
  | 'localGuide'
  | 'emergencyPolice';

const TRAVEL_DYNAMIC_HERO_ASSETS: Readonly<Record<TravelDynamicHeroKey, ImageSourcePropType>> = {
  default: TRAVEL_DYN_HERO_AIRPORT_MASTER,
  journey: TRAVEL_DYN_HERO_AIRPORT_MASTER,
  rides: TRAVEL_DYN_HERO_RIDES_SOURCE,
  transit: TRAVEL_DYN_HERO_AIRPORT_MASTER,
  family: TRAVEL_DYN_HERO_AIRPORT_MASTER,
  global: TRAVEL_DYN_HERO_AIRPORT_MASTER,
  interpreter: TRAVEL_DYN_HERO_TRANSLATION_SOURCE,
  cityConcierge: TRAVEL_DYN_HERO_AIRPORT_MASTER,
  localGuide: TRAVEL_DYN_HERO_TRANSLATION_SOURCE,
  emergencyPolice: TRAVEL_DYN_HERO_EMERGENCY_SOURCE,
};

const TRAVEL_FLAGSHIP_CARD_ASSETS: Readonly<Record<TravelFlagshipScenarioId, ImageSourcePropType>> = {
  airport: TRAVEL_DYN_HERO_AIRPORT_CARD,
  translation: TRAVEL_DYN_HERO_TRANSLATION_CARD,
  taxi: TRAVEL_DYN_HERO_RIDES_CARD,
  emergency: TRAVEL_DYN_HERO_EMERGENCY_CARD,
};

const TRAVEL_FLAGSHIP_DYNAMIC_HERO_KEY: Readonly<Record<TravelFlagshipScenarioId, TravelDynamicHeroKey>> = {
  airport: 'journey',
  translation: 'interpreter',
  taxi: 'rides',
  emergency: 'emergencyPolice',
};

/** Situation utility hover → dynamic hero (approved scene set; glass pills stay icon-only). */
const TRAVEL_SCENARIO_DYNAMIC_HERO_KEY: Readonly<Partial<Record<TravelScenarioId, TravelDynamicHeroKey>>> = {
  airport: 'journey',
  taxi: 'rides',
  transit: 'transit',
  hotel: 'family',
  restaurant: 'cityConcierge',
  shopping: 'global',
  hospital: 'journey',
  translation: 'interpreter',
  emergency: 'emergencyPolice',
};

/** Pack 35 — Quick Help → Dynamic Hero copy via `travelHub.quickHelpHero.*` i18n keys. */
type TravelQuickHelpHeroContextId = 'default' | TravelFlagshipScenarioId;

const TRAVEL_QUICK_HELP_HERO_ACCENT: Readonly<
  Record<TravelQuickHelpHeroContextId, TravelSemanticAccent>
> = {
  default: 'cyan',
  airport: 'cyan',
  translation: 'violet',
  taxi: 'emerald',
  emergency: 'magenta',
};

function travelQuickHelpHeroAccent(contextId: TravelQuickHelpHeroContextId): TravelSemanticAccent {
  return TRAVEL_QUICK_HELP_HERO_ACCENT[contextId];
}

function travelQuickHelpHeroI18nBase(contextId: TravelQuickHelpHeroContextId): string {
  return `travelHub.quickHelpHero.${contextId}`;
}

/** Pack 26 — semantic hero rim/network tint from hovered Quick Help context. */
function travelHeroQuickHelpAccentStageOverlayStyle(
  contextId: TravelQuickHelpHeroContextId,
  lit: boolean
): ViewStyle | null {
  if (!lit || contextId === 'default') return null;
  const material = TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[contextId];
  const [r, g, b] = material.glowRgb;
  const [br, bg, bb] = material.borderRgb;
  return {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: `rgba(${br}, ${bg}, ${bb}, 0.62)`,
    zIndex: 7,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: `inset 0 0 36px rgba(${r}, ${g}, ${b}, 0.14), 0 0 28px rgba(${r}, ${g}, ${b}, 0.24)`,
          pointerEvents: 'none',
          transition: 'box-shadow 220ms ease-out, border-color 220ms ease-out',
        } as ViewStyle)
      : { pointerEvents: 'none' }),
  };
}

function travelHeroQuickHelpAccentNetworkBoost(
  contextId: TravelQuickHelpHeroContextId,
  lit: boolean
): Readonly<{
  routeArcPrimary: readonly [string, string, string];
  routeArcSecondary: readonly [string, string, string];
  bottomHandoff: readonly [string, string, string];
  subjectGlow: readonly [string, string, string];
}> | null {
  if (!lit || contextId === 'default') return null;
  const material = TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[contextId];
  const [r, g, b] = material.glowRgb;
  const [br, bg, bb] = material.borderRgb;
  return {
    routeArcPrimary: ['transparent', `rgba(${r}, ${g}, ${b}, 0.18)`, 'transparent'],
    routeArcSecondary: ['transparent', `rgba(${br}, ${bg}, ${bb}, 0.12)`, 'transparent'],
    bottomHandoff: ['transparent', `rgba(${r}, ${g}, ${b}, 0.14)`, 'rgba(4, 8, 16, 0.28)'],
    subjectGlow: ['transparent', `rgba(${r}, ${g}, ${b}, 0.08)`, 'transparent'],
  };
}

function travelQuickHelpHeroAccentRgb(contextId: TravelQuickHelpHeroContextId): readonly [number, number, number] {
  if (contextId === 'default') return TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL.airport.glowRgb;
  return TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[contextId].glowRgb;
}

const TRAVEL_DYNAMIC_HERO_OBJECT_POSITION: Readonly<Record<TravelDynamicHeroKey, string>> = {
  default: `64% ${TRAVEL_DYNAMIC_HERO_OBJECT_POSITION_Y_NORMAL}`,
  journey: `64% ${TRAVEL_DYNAMIC_HERO_OBJECT_POSITION_Y_NORMAL}`,
  rides: '70% 40%',
  transit: '68% 36%',
  family: '56% 36%',
  global: '70% 34%',
  interpreter: '62% 36%',
  cityConcierge: '58% 40%',
  localGuide: '60% 32%',
  emergencyPolice: '62% 36%',
};

const TRAVEL_FLAGSHIP_CARD_OBJECT_POSITION: Readonly<Record<TravelFlagshipScenarioId, string>> = {
  airport: '66% 38%',
  translation: '62% 36%',
  taxi: '70% 40%',
  emergency: '64% 42%',
};

/** Pack 14 — Quick Help flagship semantic accents (hard-visible rims; Situation palette separate). */
type TravelQuickHelpFlagshipMaterial = Readonly<{
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  borderRgb: readonly [number, number, number];
  glowRgb: readonly [number, number, number];
  cornerGlowRgb: readonly [number, number, number];
  edgeLightRgb: readonly [number, number, number];
  /** Pack 14 — fixed web rim color (matches spec; avoids pale alpha stacking). */
  webRimColor: string;
}>;

/** Pack 20 — web outer rim (single visible frame). */
const TRAVEL_QUICK_HELP_WEB_RIM_RING_PX = 1.5;

const TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL: Readonly<
  Record<TravelFlagshipScenarioId, TravelQuickHelpFlagshipMaterial>
> = {
  airport: {
    accent: 'cyan',
    borderRgb: [130, 235, 255],
    webRimColor: 'rgba(130, 235, 255, 0.86)',
    glowRgb: [96, 228, 255],
    cornerGlowRgb: [72, 214, 255],
    edgeLightRgb: [210, 250, 255],
  },
  translation: {
    accent: 'violet',
    accentSecondary: 'violet',
    borderRgb: [216, 160, 255],
    webRimColor: 'rgba(216, 160, 255, 0.86)',
    glowRgb: [210, 148, 255],
    cornerGlowRgb: [188, 120, 255],
    edgeLightRgb: [244, 214, 255],
  },
  taxi: {
    accent: 'emerald',
    accentSecondary: 'emerald',
    borderRgb: [78, 235, 210],
    webRimColor: 'rgba(78, 235, 210, 0.86)',
    glowRgb: [48, 232, 208],
    cornerGlowRgb: [32, 214, 192],
    edgeLightRgb: [120, 255, 236],
  },
  emergency: {
    accent: 'magenta',
    borderRgb: [255, 92, 170],
    webRimColor: 'rgba(255, 92, 170, 0.86)',
    glowRgb: [255, 88, 168],
    cornerGlowRgb: [248, 64, 148],
    edgeLightRgb: [255, 108, 178],
  },
};

function isTravelFlagshipScenarioId(id: TravelScenarioId): id is TravelFlagshipScenarioId {
  return (TRAVEL_FLAGSHIP_IDS as readonly string[]).includes(id);
}

function travelQuickHelpFlagshipMaterial(id: TravelFlagshipScenarioId): TravelQuickHelpFlagshipMaterial {
  return TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[id];
}

function travelQuickHelpFlagshipAccent(id: TravelFlagshipScenarioId): TravelSemanticAccent {
  return TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[id].accent;
}

function travelQuickHelpFlagshipRgbAlpha(
  rgb: readonly [number, number, number],
  alpha: number
): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function travelQuickHelpFlagshipRimColor(
  material: TravelQuickHelpFlagshipMaterial,
  active: boolean,
  selected: boolean
): string {
  if (!active) return material.webRimColor;
  const alpha = 0.94;
  const [r, g, b] = material.borderRgb;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Pack 30 — Home/Local magnetic pointer handlers on outer View host (not Pressable). */
function createTravelQuickHelpWebPointerHandlers(options: {
  cardId: TravelFlagshipScenarioId;
  reduceMotion: boolean;
  onHeroCardHover?: (id: TravelFlagshipScenarioId) => void;
  onHeroCardLeave?: () => void;
  onPointerHover: (hovered: boolean) => void;
  onMagnetic: (offset: FashionHomeWebMagneticOffset | null) => void;
}): {
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onPointerMove?: (event: {
    nativeEvent: { clientX?: number; clientY?: number };
    currentTarget: unknown;
  }) => void;
} {
  if (Platform.OS !== 'web') return {};
  const { cardId, reduceMotion, onHeroCardHover, onHeroCardLeave, onPointerHover, onMagnetic } =
    options;
  return {
    onPointerEnter: () => {
      onPointerHover(true);
      onHeroCardHover?.(cardId);
    },
    onPointerLeave: () => {
      onPointerHover(false);
      onMagnetic(null);
      onHeroCardLeave?.();
    },
    onPointerMove: (event) => {
      onPointerHover(true);
      onHeroCardHover?.(cardId);
      if (reduceMotion) return;
      const target = event.currentTarget as { getBoundingClientRect?: () => DOMRect } | null;
      const rect = target?.getBoundingClientRect?.();
      const clientX = event.nativeEvent.clientX;
      const clientY = event.nativeEvent.clientY;
      if (rect != null && clientX != null && clientY != null) {
        onMagnetic(computeFashionHomeWebMagneticOffset(clientX, clientY, rect));
      }
    },
  };
}

/** Pack 30 — reuse `fashionHomeWebMagneticMotionStyle` on outer host (LocalHomeParityCard grammar). */
function travelQuickHelpFlagshipHostMotionStyle(
  magnetic: FashionHomeWebMagneticOffset | null,
  interactive: boolean,
  selected: boolean,
  pressed: boolean,
  reduceMotion: boolean
): ViewStyle {
  const active = interactive || pressed;
  if (Platform.OS !== 'web') {
    if (active) return { transform: [{ translateY: -6 }, { scale: 1.018 }], zIndex: 12 };
    if (selected) return { transform: [{ translateY: -2 }, { scale: 1.008 }], zIndex: 6 };
    return { zIndex: 1 };
  }
  if (reduceMotion) {
    return {
      zIndex: active ? 12 : selected ? 6 : 1,
      position: 'relative',
      ...(active || selected ? ({ cursor: 'pointer' } as ViewStyle) : null),
    };
  }
  if (active) {
    const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
    const o = magnetic ?? { translateX: 0, translateY: 0, rotateDeg: 0 };
    return {
      transform: [
        { translateX: o.translateX },
        { translateY: o.translateY + TRAVEL_QUICK_HELP_WEB_HOVER_LIFT_PX },
        { rotate: `${o.rotateDeg}deg` },
        { scale: TRAVEL_QUICK_HELP_WEB_HOVER_SCALE },
      ],
      transition: `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${ms}ms ease-out`,
      zIndex: 12,
      position: 'relative',
      cursor: 'pointer',
    } as ViewStyle;
  }
  if (selected) {
    const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
    return {
      transform: [
        { translateY: TRAVEL_QUICK_HELP_WEB_SELECTED_LIFT_PX },
        { scale: TRAVEL_QUICK_HELP_WEB_SELECTED_SCALE },
      ],
      zIndex: 6,
      position: 'relative',
      ...( {
        transition: `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      } as ViewStyle),
    };
  }
  return {
    ...fashionHomeWebMagneticMotionStyle(null, false),
    zIndex: 1,
    position: 'relative',
  };
}

function travelQuickHelpFlagshipCellInteractiveStyle(
  id: TravelFlagshipScenarioId,
  state: Readonly<{ selected: boolean; hovered: boolean }>,
  pressed: boolean
): ViewStyle {
  const material = TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[id];
  const active = state.selected || state.hovered || pressed;
  const rimColor = travelQuickHelpFlagshipRimColor(material, active, state.selected);
  const [r, g, b] = material.glowRgb;
  const hoveredOnly = state.hovered && !state.selected && !pressed;
  const nearAlpha = active ? (state.selected ? 0.22 : hoveredOnly ? 0.2 : 0.16) : 0.07;
  const farAlpha = active ? (state.selected ? 0.16 : hoveredOnly ? 0.14 : 0.11) : 0.04;
  const nearBlur = active ? (state.selected ? 12 : hoveredOnly ? 11 : 10) : 6;
  const farBlur = active ? (state.selected ? 18 : hoveredOnly ? 16 : 14) : 10;
  const ringPx = TRAVEL_QUICK_HELP_WEB_RIM_RING_PX;
  const base: ViewStyle = {
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
    width: '100%',
    borderWidth: 0,
    borderColor: 'transparent',
    boxShadow: `0 0 0 ${ringPx}px ${rimColor}, 0 0 ${nearBlur}px rgba(${r}, ${g}, ${b}, ${nearAlpha}), 0 0 ${farBlur}px rgba(${r}, ${g}, ${b}, ${farAlpha})`,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'box-shadow 220ms ease-out',
        } as ViewStyle)
      : null),
  };
  if (Platform.OS !== 'web') {
    return {
      ...base,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: rimColor,
      ...(pressed ? { opacity: 0.94 } : null),
    };
  }
  return base;
}

/** Pack 22 — full-bleed tile body; outer Pressable owns the only visible frame. */
function travelQuickHelpFlagshipCellBodyStyle(): ViewStyle {
  return styles.quickHelpFlagshipCellBody;
}

function travelQuickHelpHeroTrustStripStyle(
  accent: TravelSemanticAccent,
  lit: boolean,
  accentRgb?: readonly [number, number, number]
): ViewStyle {
  const tokens = travelSemanticTokens(accent);
  const borderColor = lit
    ? accentRgb
      ? travelQuickHelpFlagshipRgbAlpha(accentRgb, accent === 'violet' ? 0.42 : accent === 'magenta' ? 0.38 : 0.36)
      : travelSituationGlassAlpha(tokens.glow, accent === 'violet' ? 0.42 : 0.36)
    : 'rgba(92, 205, 255, 0.36)';
  const backgroundColor = lit
    ? accentRgb
      ? travelQuickHelpFlagshipRgbAlpha(accentRgb, accent === 'violet' ? 0.1 : 0.08)
      : travelSituationGlassAlpha(tokens.glow, accent === 'violet' ? 0.1 : 0.08)
    : 'rgba(4, 8, 16, 0.78)';
  if (Platform.OS === 'web') {
    const glow = accentRgb
      ? travelQuickHelpFlagshipRgbAlpha(accentRgb, 0.14)
      : travelSituationGlassAlpha(tokens.glow, 0.14);
    return {
      borderColor,
      backgroundColor,
      boxShadow: lit ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 14px ${glow}` : undefined,
      transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out, background-color 200ms ease-out',
    } as ViewStyle;
  }
  return { borderColor, backgroundColor };
}

function TravelQuickHelpFlagshipSemanticVeil({
  id,
  active,
  selected,
  openingStageFullscreen = false,
}: Readonly<{
  id: TravelFlagshipScenarioId;
  active: boolean;
  selected: boolean;
  openingStageFullscreen?: boolean;
}>): ReactElement {
  const material = TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL[id];
  const cornerPeak = active ? (selected ? 0.22 : 0.16) : 0.08;
  const edgePeak = openingStageFullscreen || !active ? 0 : selected ? 0.04 : 0;
  return (
    <View pointerEvents="none" style={styles.quickHelpFlagshipSemanticVeilHost}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          travelQuickHelpFlagshipRgbAlpha(material.cornerGlowRgb, cornerPeak),
          travelQuickHelpFlagshipRgbAlpha(material.glowRgb, cornerPeak * 0.42),
          'transparent',
        ]}
        locations={[0, 0.38, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.72, y: 0.82 }}
        style={StyleSheet.absoluteFillObject}
      />
      {selected ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            travelQuickHelpFlagshipRgbAlpha(material.edgeLightRgb, active ? 0.4 : 0.28),
            travelQuickHelpFlagshipRgbAlpha(material.glowRgb, active ? 0.14 : 0.08),
            'transparent',
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.22 }}
          style={styles.quickHelpFlagshipSelectedTopAccent}
        />
      ) : null}
      {edgePeak > 0 ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={[
              travelQuickHelpFlagshipRgbAlpha(material.edgeLightRgb, edgePeak),
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.1, y: 0.5 }}
            style={styles.quickHelpFlagshipLeftEdgeLight}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', travelQuickHelpFlagshipRgbAlpha(material.glowRgb, edgePeak * 0.72)]}
            start={{ x: 0.9, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.quickHelpFlagshipRightEdgeLight}
          />
        </>
      ) : null}
    </View>
  );
}

function travelDynamicHeroAsset(key: TravelDynamicHeroKey): ImageSourcePropType {
  return TRAVEL_DYNAMIC_HERO_ASSETS[key] ?? TRAVEL_DYNAMIC_HERO_ASSETS.default;
}

function travelFlagshipCardWebImageStyle(scenarioId: TravelFlagshipScenarioId): ImageStyle | undefined {
  if (Platform.OS !== 'web') return undefined;
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: TRAVEL_FLAGSHIP_CARD_OBJECT_POSITION[scenarioId],
  } as ImageStyle;
}

/** Perspective hero cards — Góc nhìn du lịch (Travel-only assets). */
const TRAVEL_PERSPECTIVE_CARD_ASSETS: Readonly<Record<TravelDirectionId, ImageSourcePropType>> = {
  vietnameseAbroad: require('../../../assets/viona/travel/viona-travel-perspective-vietnamese-abroad-v1.png'),
  inboundVietnam: require('../../../assets/viona/travel/viona-travel-perspective-foreigner-to-vietnam-v1.png'),
  returnVietnam: require('../../../assets/viona/travel/viona-travel-perspective-overseas-vietnamese-return-v1.png'),
};

const TRAVEL_PERSPECTIVE_CARD_OBJECT_POSITION: Readonly<Record<TravelDirectionId, string>> = {
  vietnameseAbroad: '62% 36%',
  inboundVietnam: '56% 38%',
  returnVietnam: '60% 34%',
};

const TRAVEL_PERSPECTIVE_DESKTOP_ROW_MIN_WIDTH = 1024;
const TRAVEL_PERSPECTIVE_TWO_COL_MIN_WIDTH = 520;

function travelPerspectiveAccent(id: TravelDirectionId): TravelSemanticAccent {
  if (id === 'vietnameseAbroad') return 'cyan';
  if (id === 'inboundVietnam') return 'gold';
  return 'violet';
}

function travelPerspectiveAccentSecondary(id: TravelDirectionId): TravelSemanticAccent | undefined {
  if (id === 'inboundVietnam' || id === 'returnVietnam') return 'cyan';
  return undefined;
}

function travelPerspectiveIcon(id: TravelDirectionId): keyof typeof Ionicons.glyphMap {
  if (id === 'vietnameseAbroad') return 'airplane-outline';
  if (id === 'inboundVietnam') return 'earth-outline';
  return 'heart-outline';
}

function travelPerspectiveStatusLabelKey(status: TravelDirectionCommercialStatus): string {
  return `travel.direction.status.${status}`;
}

function travelPerspectiveMarketLabelKey(code: MarketCode): string {
  const slug = code === 'GLOBAL' ? 'global' : code.toLowerCase();
  return `smartTrio.market.${slug}`;
}

function travelPerspectiveCardWebImageStyle(id: TravelDirectionId): ImageStyle | undefined {
  if (Platform.OS !== 'web') return undefined;
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: TRAVEL_PERSPECTIVE_CARD_OBJECT_POSITION[id],
  } as ImageStyle;
}

/** Compact utility grid — Local cho bạn grammar (all scenarios except duplicate-only paths). */
const TRAVEL_UTILITY_IDS: readonly TravelScenarioId[] = [
  'airport',
  'taxi',
  'transit',
  'hotel',
  'restaurant',
  'shopping',
  'hospital',
  'translation',
];

/** Travel opens in overview; perspective cards personalize utility priority (not a gate). */
type TravelPerspectiveMode = 'overview' | TravelDirectionId;

/** Utility tile priority by perspective — all scenarios stay accessible; order only. */
const TRAVEL_UTILITY_PRIORITY_BY_MODE: Readonly<
  Record<TravelPerspectiveMode, readonly TravelScenarioId[]>
> = {
  overview: TRAVEL_UTILITY_IDS,
  vietnameseAbroad: [
    'airport',
    'taxi',
    'transit',
    'hotel',
    'hospital',
    'translation',
    'restaurant',
    'shopping',
  ],
  inboundVietnam: [
    'restaurant',
    'taxi',
    'transit',
    'translation',
    'shopping',
    'airport',
    'hotel',
    'hospital',
  ],
  returnVietnam: [
    'restaurant',
    'hotel',
    'taxi',
    'transit',
    'translation',
    'hospital',
    'airport',
    'shopping',
  ],
};

function orderTravelUtilityIds(mode: TravelPerspectiveMode): readonly TravelScenarioId[] {
  const priority = TRAVEL_UTILITY_PRIORITY_BY_MODE[mode] ?? TRAVEL_UTILITY_IDS;
  const rank = new Map(priority.map((id, index) => [id, index]));
  return [...TRAVEL_UTILITY_IDS].sort(
    (a, b) => (rank.get(a) ?? priority.length) - (rank.get(b) ?? priority.length)
  );
}

function travelPerspectiveModeDirectionId(
  mode: TravelPerspectiveMode
): TravelDirectionId | null {
  return mode === 'overview' ? null : mode;
}

/** Pack 4 — pilot strip + connected links rhythm at desktop. */
function travelSecondarySurfaceMetrics(viewportWidth: number): Readonly<{
  pilotPaddingV: number;
  pilotPaddingH: number;
  pilotGap: number;
  pilotPillMinHeight: number;
  connectedGap: number;
  connectedMinHeight: number;
}> {
  if (viewportWidth >= 1024) {
    return {
      pilotPaddingV: 9,
      pilotPaddingH: 11,
      pilotGap: 6,
      pilotPillMinHeight: 30,
      connectedGap: 7,
      connectedMinHeight: 40,
    };
  }
  if (viewportWidth >= 768) {
    return {
      pilotPaddingV: 11,
      pilotPaddingH: 12,
      pilotGap: 8,
      pilotPillMinHeight: 32,
      connectedGap: 8,
      connectedMinHeight: 42,
    };
  }
  return {
    pilotPaddingV: 12,
    pilotPaddingH: 12,
    pilotGap: 8,
    pilotPillMinHeight: 32,
    connectedGap: 8,
    connectedMinHeight: 44,
  };
}

/** Local opening-stage grammar — hero → 4 flagship cards → utility panel (Travel soul: midnight). */
function travelOpeningGrammarMetrics(
  viewportWidth: number,
  openingStageFullscreen: boolean
): Readonly<{
  heroToFlagshipGap: number;
  flagshipToUtilityGap: number;
  openingStagePaddingBottom: number;
}> {
  if (viewportWidth >= 1024) {
    return {
      heroToFlagshipGap: travelHeroToQuickHelpAirGap(
        openingStageFullscreen
          ? TRAVEL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_GAP_PX
          : FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX,
        openingStageFullscreen
      ),
      flagshipToUtilityGap: 0,
      openingStagePaddingBottom: 0,
    };
  }
  if (viewportWidth >= 768) {
    return {
      heroToFlagshipGap: travelHeroToQuickHelpAirGap(8),
      flagshipToUtilityGap: theme.spacing.md,
      openingStagePaddingBottom: 2,
    };
  }
  return {
    heroToFlagshipGap: travelHeroToQuickHelpAirGap(10),
    flagshipToUtilityGap: theme.spacing.md,
    openingStagePaddingBottom: 0,
  };
}

const TRAVEL_PILOT_CYAN = travelSemanticTokens('cyan');

const TRAVEL_PILOT_PILLS = [
  { labelKey: 'travelHub.pilotPill.lite' as const, icon: 'compass-outline' as const },
  { labelKey: 'travelHub.pilotPill.demo' as const, icon: 'flask-outline' as const },
  { labelKey: 'travelHub.pilotPill.preview' as const, icon: 'lock-closed-outline' as const },
] as const;

function resolveTravelLitePanelCopy(
  t: (key: string) => string
): Readonly<{ title: string; subtitle: string; pillLabels: readonly string[] }> {
  return {
    title: t('travelHub.pilotStripTitle'),
    subtitle: t('travelHub.pilotStripBanner'),
    pillLabels: TRAVEL_PILOT_PILLS.map((pill) => t(pill.labelKey)),
  };
}

const TRAVEL_HERO_TRUST_KEYS = [
  'travelHub.heroTrust.lite',
  'travelHub.heroTrust.demo',
  'travelHub.heroTrust.preview',
] as const;

function resolveTravelQuickHelpHeroDisplay(
  contextId: TravelQuickHelpHeroContextId,
  t: (key: string) => string
): Readonly<{ title: string; subtitle: string; chips: readonly string[] }> {
  const base = travelQuickHelpHeroI18nBase(contextId);
  return {
    title: t(`${base}.title`),
    subtitle: t(`${base}.subtitle`),
    chips: [t(`${base}.chip1`), t(`${base}.chip2`), t(`${base}.chip3`)] as const,
  };
}

function travelScenarioStatusLabel(
  id: TravelScenarioId,
  t: (key: string) => string
): string | undefined {
  switch (id) {
    case 'emergency':
      return t('travelHub.scenarioChipSafety');
    case 'hotel':
    case 'airport':
      return t('travelHub.tileBadge.preview');
    case 'taxi':
    case 'transit':
    case 'shopping':
      return t('travelHub.tileBadge.demo');
    case 'translation':
      return t('travelHub.tileBadge.lite');
    case 'restaurant':
    case 'hospital':
      return t('travelHub.tileBadge.pilot');
    default:
      return undefined;
  }
}

/** Pack 22 — single-frame full-bleed Quick Help tile (image + overlay; no inner card frame). */
function TravelQuickHelpFlagshipTile({
  scenarioId,
  title,
  subtitle,
  icon,
  accent,
  accentSecondary,
  layoutMetrics,
  stretchInColumn,
  backgroundImage,
  imageStyle,
  statusLabel,
  active,
  testID,
}: Readonly<{
  scenarioId: TravelFlagshipScenarioId;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  layoutMetrics: ReturnType<typeof travelAppTileMetrics>;
  stretchInColumn?: boolean;
  backgroundImage: ImageSourcePropType;
  imageStyle?: ImageStyle;
  statusLabel?: string;
  active: boolean;
  testID: string;
}>): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const material = travelQuickHelpFlagshipMaterial(scenarioId);
  const minHeight = layoutMetrics.flagshipMinHeight;
  const scrimPeak = accent === 'magenta' ? 0.2 : accent === 'violet' ? 0.17 : 0.16;
  const scrimColors = [
    travelQuickHelpFlagshipRgbAlpha(material.glowRgb, scrimPeak),
    travelQuickHelpFlagshipRgbAlpha(material.glowRgb, scrimPeak * 0.42),
    'transparent',
  ] as const;

  return (
    <View
      testID={testID}
      style={[
        styles.quickHelpFlagshipTileRoot,
        stretchInColumn && styles.quickHelpFlagshipTileStretch,
        { minHeight },
      ]}
    >
      <View pointerEvents="none" style={styles.quickHelpFlagshipTileArtworkClip}>
        <Image
          source={backgroundImage}
          style={[styles.quickHelpFlagshipTileArtworkImage, imageStyle]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          pointerEvents="none"
          colors={scrimColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.72, y: 0.5 }}
          style={styles.quickHelpFlagshipTileAccentScrim}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(4, 7, 12, 0.84)', 'rgba(4, 7, 12, 0.46)', 'rgba(4, 7, 12, 0)']}
          locations={[0, 0.44, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.quickHelpFlagshipTileTextScrim}
        />
        {active ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.quickHelpFlagshipTileHoverBrighten]} />
        ) : null}
      </View>
      <View pointerEvents="none" style={styles.quickHelpFlagshipTileStack}>
        <View style={styles.quickHelpFlagshipTileHeader}>
          <View style={[styles.quickHelpFlagshipTileContentRow, statusLabel ? styles.quickHelpFlagshipTileContentRowBadge : null]}>
            <TravelIconCapsule
              icon={icon}
              ink={tokens.ink}
              accent={accent}
              accentSecondary={accentSecondary}
              size={layoutMetrics.flagshipIconSize}
              prominent
              intensity="primary"
              capsuleSize={layoutMetrics.flagshipCapsuleSize}
              materialActive={active}
            />
            <View style={styles.quickHelpFlagshipTileCopy}>
              <Text
                style={[
                  styles.quickHelpFlagshipTileTitle,
                  {
                    textShadowColor: 'rgba(5, 8, 12, 0.72)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  },
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.quickHelpFlagshipTileSubtitle,
                  {
                    color: active ? 'rgba(218, 228, 242, 0.98)' : 'rgba(210, 222, 238, 0.94)',
                    textShadowColor: 'rgba(5, 8, 12, 0.62)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  },
                ]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            </View>
          </View>
          {statusLabel ? (
            <Text
              style={[
                styles.quickHelpFlagshipTileStatus,
                {
                  color: active ? tokens.inkHover : tokens.ink,
                  borderWidth: 0,
                  backgroundColor: active ? tokens.washHover : tokens.statusFill,
                },
              ]}
              numberOfLines={1}
            >
              {statusLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function TravelScenarioTile({
  scenarioId,
  item,
  variant,
  layoutMetrics,
  stretchInColumn,
  backgroundImage,
  imageStyle,
  onHoverChange,
}: Readonly<{
  scenarioId: TravelScenarioId;
  item: TravelScenario;
  variant: 'flagship' | 'utilityPill';
  layoutMetrics: ReturnType<typeof travelAppTileMetrics>;
  stretchInColumn?: boolean;
  backgroundImage?: ImageSourcePropType;
  imageStyle?: ImageStyle;
  onHoverChange?: (hovered: boolean) => void;
}>): ReactElement {
  const { t } = useTranslation();
  const title = t(`travelHub.scenario.${scenarioId}.title`);
  const subtitle = t(`travelHub.scenario.${scenarioId}.sub`);
  const testIdPrefix = variant === 'flagship' ? 'travel-flagship' : 'travel-utility';
  const flagshipMaterial =
    variant === 'flagship' && isTravelFlagshipScenarioId(scenarioId)
      ? travelQuickHelpFlagshipMaterial(scenarioId)
      : null;
  const tileAccent = flagshipMaterial?.accent ?? item.accent;
  const tileAccentSecondary = flagshipMaterial?.accentSecondary ?? item.capsuleSecondary;
  return (
    <TravelAppTile
      variant={variant}
      accent={tileAccent}
      accentSecondary={tileAccentSecondary}
      layoutMetrics={layoutMetrics}
      stretchInColumn={stretchInColumn}
      testID={`${testIdPrefix}-${scenarioId}`}
      title={title}
      subtitle={variant === 'flagship' ? subtitle : undefined}
      icon={item.icon}
      onPress={item.onPress}
      backgroundImage={backgroundImage}
      imageStyle={imageStyle}
      onHoverChange={onHoverChange}
      statusLabel={variant === 'flagship' ? travelScenarioStatusLabel(scenarioId, t) : undefined}
      accessibilityLabel={`${title}. ${subtitle}`}
    />
  );
}

function TravelQuickHelpFlagshipCell({
  id,
  cellStyle,
  widthStyle,
  scenarioById,
  layoutMetrics,
  stretch,
  openingStageFullscreen,
  activeQuickHelpContextId,
  hoveredQuickHelpContextId,
  onQuickHelpContextSelect,
  onHeroCardHover,
  onHeroCardLeave,
  touchSelectionMode = false,
}: Readonly<{
  id: TravelFlagshipScenarioId;
  cellStyle: StyleProp<ViewStyle>;
  widthStyle?: ViewStyle;
  scenarioById: ReadonlyMap<TravelScenarioId, TravelScenario>;
  layoutMetrics: ReturnType<typeof travelAppTileMetrics>;
  stretch: boolean;
  openingStageFullscreen?: boolean;
  activeQuickHelpContextId: TravelQuickHelpHeroContextId;
  hoveredQuickHelpContextId: TravelFlagshipScenarioId | null;
  onQuickHelpContextSelect: (id: TravelFlagshipScenarioId) => void;
  onHeroCardHover?: (id: TravelFlagshipScenarioId) => void;
  onHeroCardLeave?: () => void;
  touchSelectionMode?: boolean;
}>): ReactElement | null {
  const { t } = useTranslation();
  const reduceMotion = useFashionHomePrefersReducedMotion();
  const [pointerHovered, setPointerHovered] = useState(false);
  const [magnetic, setMagnetic] = useState<FashionHomeWebMagneticOffset | null>(null);
  const [pressed, setPressed] = useState(false);

  const item = scenarioById.get(id);
  const selected = activeQuickHelpContextId === id;

  const syncHeroHoverIn = useCallback(() => {
    setPointerHovered(true);
    onHeroCardHover?.(id);
  }, [id, onHeroCardHover]);

  const syncHeroHoverOut = useCallback(() => {
    if (touchSelectionMode && selected) return;
    setPointerHovered(false);
    setMagnetic(null);
    onHeroCardLeave?.();
  }, [onHeroCardLeave, selected, touchSelectionMode]);

  const activateTouchSelection = useCallback(() => {
    onQuickHelpContextSelect(id);
    onHeroCardHover?.(id);
  }, [id, onHeroCardHover, onQuickHelpContextSelect]);

  const handleQuickHelpPress = useCallback(() => {
    if (touchSelectionMode) {
      if (selected) {
        item?.onPress();
        return;
      }
      activateTouchSelection();
      return;
    }
    onQuickHelpContextSelect(id);
    item?.onPress();
  }, [activateTouchSelection, id, item, onQuickHelpContextSelect, selected, touchSelectionMode]);

  const pointerHandlers = useMemo(
    () =>
      touchSelectionMode
        ? {}
        : createTravelQuickHelpWebPointerHandlers({
            cardId: id,
            reduceMotion,
            onHeroCardHover,
            onHeroCardLeave,
            onPointerHover: setPointerHovered,
            onMagnetic: setMagnetic,
          }),
    [id, reduceMotion, onHeroCardHover, onHeroCardLeave, touchSelectionMode]
  );

  const webHoverHandlers = useMemo(
    () =>
      Platform.OS === 'web' && !touchSelectionMode
        ? ({
            onMouseEnter: syncHeroHoverIn,
            onMouseLeave: syncHeroHoverOut,
          } as const)
        : null,
    [syncHeroHoverIn, syncHeroHoverOut, touchSelectionMode]
  );

  if (!item) return null;
  const hostHovered = hoveredQuickHelpContextId === id || pointerHovered;
  const active = selected || hostHovered;
  const title = t(`travelHub.scenario.${id}.title`);
  const subtitle = t(`travelHub.scenario.${id}.sub`);
  const material = travelQuickHelpFlagshipMaterial(id);

  return (
    <View
      testID={`travel-quick-help-cell-${id}`}
      {...pointerHandlers}
      {...webHoverHandlers}
      {...(Platform.OS === 'web'
        ? ({
            'data-travel-quick-help-id': id,
            'data-travel-quick-help-hovered': hostHovered ? 'true' : 'false',
          } as const)
        : null)}
      style={[
        cellStyle,
        widthStyle,
        travelQuickHelpFlagshipHostMotionStyle(
          magnetic,
          hostHovered,
          selected,
          pressed,
          reduceMotion
        ),
      ]}
    >
      <Pressable
        testID={`travel-quick-help-magnet-host-${id}`}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        accessibilityState={{ selected }}
        onPress={handleQuickHelpPress}
        onPressIn={() => {
          setPressed(true);
          if (touchSelectionMode) activateTouchSelection();
        }}
        onPressOut={() => setPressed(false)}
        onFocus={() => {
          if (touchSelectionMode) {
            activateTouchSelection();
            return;
          }
          syncHeroHoverIn();
        }}
        onBlur={syncHeroHoverOut}
        style={({ pressed: pressablePressed }) => [
          travelQuickHelpFlagshipCellInteractiveStyle(
            id,
            { selected, hovered: hostHovered },
            pressablePressed || pressed
          ),
          { flex: 1, alignSelf: 'stretch', width: '100%' },
        ]}
      >
        <View style={travelQuickHelpFlagshipCellBodyStyle()} pointerEvents="none">
          <TravelQuickHelpFlagshipTile
            scenarioId={id}
            testID={`travel-flagship-${id}`}
            title={title}
            subtitle={subtitle}
            icon={item.icon}
            accent={material.accent}
            accentSecondary={material.accentSecondary}
            layoutMetrics={layoutMetrics}
            stretchInColumn={stretch}
            backgroundImage={TRAVEL_FLAGSHIP_CARD_ASSETS[id]}
            imageStyle={travelFlagshipCardWebImageStyle(id)}
            statusLabel={travelScenarioStatusLabel(id, t)}
            active={active}
          />
          <TravelQuickHelpFlagshipSemanticVeil
            id={id}
            active={active}
            selected={selected}
            openingStageFullscreen={openingStageFullscreen}
          />
        </View>
      </Pressable>
    </View>
  );
}

function TravelFlagshipCardsRow({
  scenarioById,
  layoutMetrics,
  gridGap,
  openingStageFullscreen,
  activeQuickHelpContextId,
  hoveredQuickHelpContextId,
  onQuickHelpContextSelect,
  onHeroCardHover,
  onHeroCardLeave,
  touchSelectionMode = false,
}: Readonly<{
  scenarioById: ReadonlyMap<TravelScenarioId, TravelScenario>;
  layoutMetrics: ReturnType<typeof travelAppTileMetrics>;
  gridGap: number;
  openingStageFullscreen?: boolean;
  activeQuickHelpContextId: TravelQuickHelpHeroContextId;
  hoveredQuickHelpContextId: TravelFlagshipScenarioId | null;
  onQuickHelpContextSelect: (id: TravelFlagshipScenarioId) => void;
  onHeroCardHover?: (id: TravelFlagshipScenarioId) => void;
  onHeroCardLeave?: () => void;
  touchSelectionMode?: boolean;
}>): ReactElement {
  const { t } = useTranslation();
  const { width, height: viewportHeight } = useWindowDimensions();
  const useCarousel = width <= TRAVEL_FLAGSHIP_CAROUSEL_MAX_WIDTH;
  const tabletPortrait = Platform.OS === 'web' && isHubTabletPortraitViewport(width, viewportHeight);
  const desktopRow = width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH && !tabletPortrait;
  const oneCol = !useCarousel && !desktopRow && width <= TRAVEL_FLAGSHIP_ONE_COL_MAX_WIDTH;
  const twoCol =
    !useCarousel && !desktopRow && !oneCol && width >= TRAVEL_FLAGSHIP_TWO_COL_MIN_WIDTH;
  const carouselWidth = Math.min(292, Math.max(256, Math.round(width * 0.78)));
  const stretch = desktopRow || twoCol;

  const cellStyle = [
    styles.flagshipCell,
    desktopRow && styles.flagshipCellQuarter,
    desktopRow && openingStageFullscreen && styles.flagshipCellQuarterFullscreen,
    oneCol && styles.flagshipCellFull,
    desktopRow && fashionHomeWebOpeningStageCardCellStyle(),
  ];

  const renderFlagshipCell = (id: TravelFlagshipScenarioId, widthStyle?: ViewStyle) => (
    <TravelQuickHelpFlagshipCell
      key={id}
      id={id}
      cellStyle={cellStyle}
      widthStyle={widthStyle}
      scenarioById={scenarioById}
      layoutMetrics={layoutMetrics}
      stretch={stretch}
      openingStageFullscreen={openingStageFullscreen}
      activeQuickHelpContextId={activeQuickHelpContextId}
      hoveredQuickHelpContextId={hoveredQuickHelpContextId}
      onQuickHelpContextSelect={onQuickHelpContextSelect}
      onHeroCardHover={onHeroCardHover}
      onHeroCardLeave={onHeroCardLeave}
      touchSelectionMode={touchSelectionMode}
    />
  );

  return (
    <View
      testID="travel-flagship-cards-row"
      style={[
        styles.flagshipRowWrap,
        {
          gap: openingStageFullscreen
            ? TRAVEL_FLAGSHIP_KICKER_TO_GRID_GAP_FULLSCREEN_PX
            : TRAVEL_FLAGSHIP_KICKER_TO_GRID_GAP_PX,
        },
        width < 768
          ? {
              paddingBottom: TRAVEL_QUICK_HELP_OPENING_MOBILE_ROW_CLEARANCE_PX,
              marginBottom: 12,
            }
          : null,
      ]}
    >
      <Text style={styles.flagshipRowKicker}>{t('travelHub.quickHelpKicker')}</Text>
      {useCarousel ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator
          contentContainerStyle={[styles.flagshipCarousel, { gap: gridGap }]}
        >
          {TRAVEL_FLAGSHIP_IDS.map((id) => renderFlagshipCell(id, { width: carouselWidth }))}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.flagshipGrid,
            { gap: gridGap, flexDirection: 'row', flexWrap: desktopRow ? 'nowrap' : 'wrap' },
          ]}
        >
          {TRAVEL_FLAGSHIP_IDS.map((id) => renderFlagshipCell(id))}
        </View>
      )}
    </View>
  );
}

/** Pack 31 — image at full strength; single section-level readability veil only. */
function travelSituationPremiumNetworkBgOpacity(
  viewportWidth: number,
  openingStageFullscreen: boolean
): number {
  if (openingStageFullscreen) return 0.16;
  if (viewportWidth >= 1366) return 0.18;
  if (viewportWidth >= 1024) return 0.17;
  if (viewportWidth >= 768) return 0.16;
  return 0.14;
}

/** Pack 31 — section readability overlay (above image, below content). Target peak ~0.24. */
const TRAVEL_SITUATION_READABILITY_VEIL_COLORS = [
  'rgba(4, 10, 18, 0.16)',
  'rgba(4, 10, 18, 0.09)',
  'rgba(4, 10, 18, 0.13)',
] as const;

function TravelSituationPremiumNetworkBackground({
  opacity,
  borderRadius = TRAVEL_SITUATION_SECTION_BORDER_RADIUS_PX,
}: Readonly<{ opacity: number; borderRadius?: number }>): ReactElement {
  return (
    <View
      pointerEvents="none"
      testID="travel-situation-network-bg"
      style={[styles.situationPremiumNetworkBgHost, { borderRadius }]}
    >
      <Image
        testID="travel-situation-network-bg-image"
        source={TRAVEL_SITUATION_NETWORK_BG_PREMIUM}
        style={[
          styles.situationPremiumNetworkBgImage,
          Platform.OS === 'web'
            ? ({
                opacity,
                objectFit: 'cover',
                objectPosition: 'center center',
                width: '100%',
                height: '100%',
              } as ImageStyle)
            : ({ opacity } as ImageStyle),
        ]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

function TravelSituationSectionReadabilityVeil({
  borderRadius = TRAVEL_SITUATION_SECTION_BORDER_RADIUS_PX,
}: Readonly<{ borderRadius?: number }>): ReactElement {
  return (
    <LinearGradient
      pointerEvents="none"
      testID="travel-situation-section-readability-veil"
      colors={[...TRAVEL_SITUATION_READABILITY_VEIL_COLORS]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.situationSectionReadabilityVeil, { borderRadius }]}
    />
  );
}

function TravelSituationLightNetworkBackdrop(): ReactElement {
  return (
    <View pointerEvents="none" style={styles.situationLightNetworkHost}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(92, 205, 255, 0.07)', 'rgba(98, 255, 228, 0.035)', 'transparent']}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.situationLightNetworkRadial}
      />
      <View style={[styles.situationLightNetworkLine, styles.situationLightNetworkLineA]} />
      <View style={[styles.situationLightNetworkLine, styles.situationLightNetworkLineB]} />
      <View style={[styles.situationLightNetworkLine, styles.situationLightNetworkLineC]} />
      <View style={[styles.situationLightNetworkArc, styles.situationLightNetworkArcPrimary]} />
      <View style={[styles.situationLightNetworkArc, styles.situationLightNetworkArcSecondary]} />
      {TRAVEL_SITUATION_LIGHT_NETWORK_NODES.map((node, index) => (
        <View
          key={`situation-network-node-${index}`}
          style={[
            styles.situationLightNetworkNode,
            {
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: node.size,
              height: node.size,
              borderRadius: node.size / 2,
              backgroundColor: node.color,
              opacity: node.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

function TravelSituationGlassCard({
  scenarioId,
  item,
  title,
  subtitle,
  stretch,
  minHeight,
  paddingHorizontal,
  capsuleSize,
  iconSize,
  titleLines,
  onHoverChange,
}: Readonly<{
  scenarioId: TravelScenarioId;
  item: TravelScenario;
  title: string;
  subtitle: string;
  stretch?: boolean;
  minHeight: number;
  paddingHorizontal: number;
  capsuleSize: number;
  iconSize: number;
  titleLines: 1 | 2;
  onHoverChange?: (hovered: boolean) => void;
}>): ReactElement {
  const [active, setActive] = useState(false);
  const scenarioMaterial = travelSituationScenarioMaterial(scenarioId, active);
  const accentStroke = scenarioMaterial.stroke;
  const accentGlassFill = scenarioMaterial.glow;
  const iconColor = scenarioMaterial.iconColor;
  const cardWebFrameStyle = travelSituationCardWebFrameStyle(scenarioMaterial, active);

  const syncHover = (hovered: boolean) => {
    setActive(hovered);
    onHoverChange?.(hovered);
  };

  return (
    <Pressable
      testID={`travel-utility-${scenarioId}`}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={item.onPress}
      onHoverIn={() => syncHover(true)}
      onHoverOut={() => syncHover(false)}
      onFocus={() => syncHover(true)}
      onBlur={() => syncHover(false)}
      style={({ pressed }) => [
        styles.situationGlassCard,
        stretch ? styles.situationGlassCardStretch : null,
        {
          minHeight,
          height: minHeight,
          maxHeight: minHeight,
          paddingHorizontal,
          paddingVertical: 2,
          borderColor: accentStroke,
          backgroundColor: accentGlassFill,
        },
        cardWebFrameStyle,
        Platform.OS === 'web' &&
          ({
            transform: pressed
              ? [{ scale: 0.985 }]
              : active
                ? [{ translateY: -1 }, { scale: 1.003 }]
                : [],
          } as object),
        Platform.OS !== 'web' && (active || pressed) && styles.situationGlassCardActive,
        Platform.OS !== 'web' && pressed && { opacity: 0.92 },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[scenarioMaterial.tintGradient[0], scenarioMaterial.tintGradient[1], 'transparent']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.situationGlassCardAccentTint}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.11)', 'rgba(255, 255, 255, 0.03)', 'transparent']}
        locations={[0, 0.18, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.situationGlassCardFxSheen}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.situationGlassCardInnerHighlight}
      />
      <View style={[styles.situationGlassCardInlineRow, { gap: TRAVEL_SITUATION_GRID_INLINE_GAP_PX }]}>
        <View style={[styles.situationGlassCardIconStack, { width: capsuleSize, height: capsuleSize }]}>
          <View
            style={[
              styles.situationGlassCardIconCapsule,
              {
                width: capsuleSize,
                height: capsuleSize,
                borderRadius: capsuleSize / 2,
                borderColor: accentStroke,
              },
            ]}
          >
            <Ionicons name={item.icon} size={iconSize} color={iconColor} accessibilityIgnoresInvertColors />
            {item.capsuleSecondary ? (
              <View
                pointerEvents="none"
                style={[
                  styles.situationGlassCardIconSecondaryRing,
                  { borderColor: travelSituationFxMaterial(item.capsuleSecondary, false).stroke },
                ]}
              />
            ) : null}
          </View>
        </View>
        <Text style={styles.situationGlassCardTitleInline} numberOfLines={titleLines}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

function TravelUtilityGrid({
  scenarioById,
  gridGap,
  utilityIds,
  perspectiveHint,
  onUtilityHover,
  openingStageFullscreen = false,
}: Readonly<{
  scenarioById: ReadonlyMap<TravelScenarioId, TravelScenario>;
  layoutMetrics: ReturnType<typeof travelAppTileMetrics>;
  gridGap: number;
  utilityIds: readonly TravelScenarioId[];
  perspectiveHint?: string;
  onUtilityHover?: (scenarioId: TravelScenarioId | null) => void;
  openingStageFullscreen?: boolean;
}>): ReactElement {
  const { t } = useTranslation();
  const { width, height: viewportHeight } = useWindowDimensions();
  const situationSectionSpacing = useMemo(
    () => travelSituationSectionSpacing(openingStageFullscreen),
    [openingStageFullscreen]
  );
  const situationLayout = useMemo(
    () => travelSituationGridLayout(width, viewportHeight, openingStageFullscreen),
    [width, viewportHeight, openingStageFullscreen]
  );
  const situationRows = useMemo(
    () => chunkTravelSituationRows(utilityIds, situationLayout.columns),
    [utilityIds, situationLayout.columns]
  );
  const situationNetworkBgOpacity = useMemo(
    () => travelSituationPremiumNetworkBgOpacity(width, openingStageFullscreen),
    [width, openingStageFullscreen]
  );

  return (
    <View testID="travel-utility-grid" style={styles.utilityWrap}>
      <View
        testID="travel-situations-section"
        style={[
          styles.situationSectionShell,
          {
            paddingVertical: situationSectionSpacing.shellPaddingVertical,
            gap: situationSectionSpacing.shellGap,
          },
          Platform.OS === 'web' &&
            ({
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(92,205,255,0.08), 0 0 16px rgba(92,205,255,0.08)',
            } as object),
        ]}
      >
        <TravelSituationPremiumNetworkBackground opacity={situationNetworkBgOpacity} />
        <TravelSituationSectionReadabilityVeil />
        <View style={styles.situationSectionContent}>
          <Text
            style={[
              styles.utilityPrompt,
              { lineHeight: situationSectionSpacing.titleLineHeight },
            ]}
          >
            {t('travelHub.scenariosKicker')}
          </Text>
          {perspectiveHint ? (
            <Text style={styles.utilityPerspectiveHint} numberOfLines={2}>
              {perspectiveHint}
            </Text>
          ) : null}
          <View style={styles.situationGlassGridStage}>
            <View pointerEvents="none" style={styles.situationGlassGridEdgeGlow} />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.35 }}
              style={styles.situationGlassGridInnerHighlight}
            />
            <View style={[styles.situationGlassGrid, { gap: gridGap }]}>
              {situationRows.map((rowIds, rowIndex) => (
                <View
                  key={`travel-situation-row-${rowIndex}`}
                  style={[styles.situationGlassGridRow, { gap: gridGap }]}
                  testID={rowIndex === 0 ? 'travel-situation-grid-row' : undefined}
                >
                  {rowIds.map((id) => {
                    const item = scenarioById.get(id);
                    if (!item) return null;
                    return (
                      <TravelSituationGlassCard
                        key={id}
                        scenarioId={id}
                        item={item}
                        title={t(`travelHub.scenario.${id}.title`)}
                        subtitle={t(`travelHub.scenario.${id}.sub`)}
                        stretch
                        minHeight={situationLayout.minCardHeight}
                        paddingHorizontal={situationLayout.paddingHorizontal}
                        capsuleSize={situationLayout.capsuleSize}
                        iconSize={situationLayout.iconSize}
                        titleLines={situationLayout.titleLines}
                        onHoverChange={(hovered) => {
                          onUtilityHover?.(hovered ? id : null);
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function TravelPerspectiveCardsRow({
  selectedId,
  onSelect,
}: Readonly<{
  /** `null` = default overview mode (no lens gate). */
  selectedId: TravelDirectionId | null;
  onSelect: (id: TravelDirectionId) => void;
}>): ReactElement {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const directions = useMemo(() => getAllTravelDirections(), []);
  const { currentMarket, nativeLocale } = useSmartTrio();
  const perspectiveMetrics = useMemo(() => travelPerspectiveCardMetrics(width), [width]);
  const [expanded, setExpanded] = useState(true);

  const contextLine = useMemo(() => {
    const marketLabel = t(travelPerspectiveMarketLabelKey(currentMarket));
    const nativeLabel = t(`smartTrio.language.${nativeLocale}`);
    return t('travel.direction.contextLine', { market: marketLabel, native: nativeLabel });
  }, [currentMarket, nativeLocale, t, i18n.language]);

  const toggleA11y = expanded ? t('travel.direction.collapseA11y') : t('travel.direction.expandA11y');
  const desktopRow = width >= TRAVEL_PERSPECTIVE_DESKTOP_ROW_MIN_WIDTH;
  const twoCol = !desktopRow && width >= TRAVEL_PERSPECTIVE_TWO_COL_MIN_WIDTH;

  const cellStyle = [
    styles.perspectiveCell,
    desktopRow && styles.perspectiveCellThird,
    twoCol && styles.perspectiveCellHalf,
    !desktopRow && !twoCol && styles.perspectiveCellFull,
    desktopRow && fashionHomeWebOpeningStageCardCellStyle(),
  ];

  return (
    <View testID="travel-perspective-cards-row" style={styles.perspectiveRowWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={toggleA11y}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.perspectiveHeaderRow, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.perspectiveHeaderText}>
          <Text style={styles.perspectiveSectionKicker}>{t('travel.direction.sectionKicker')}</Text>
          <Text style={styles.perspectiveSectionTitle} numberOfLines={expanded ? 2 : 1}>
            {t('travel.direction.title')}
          </Text>
          {expanded ? (
            <Text style={styles.perspectiveSubtitle}>{t('travel.direction.subtitle')}</Text>
          ) : (
            <Text style={styles.perspectiveCollapsedHint} numberOfLines={2}>
              {t('travel.direction.collapsedHint')}
            </Text>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={CYAN} />
      </Pressable>

      {expanded ? (
        <>
          <Text style={styles.perspectiveContextHint}>{contextLine}</Text>
          <Text style={styles.perspectiveLiteNotice}>{t('travel.direction.liteNotice')}</Text>
          <View
            style={[
              styles.perspectiveGrid,
              {
                gap: perspectiveMetrics.gridGap,
                flexDirection: 'row',
                flexWrap: desktopRow ? 'nowrap' : 'wrap',
              },
            ]}
          >
            {directions.map((def) => (
              <View key={def.id} style={cellStyle}>
                <TravelPerspectiveCard
                  def={def}
                  selected={selectedId === def.id}
                  perspectiveMetrics={perspectiveMetrics}
                  stretchInColumn={desktopRow || twoCol}
                  onSelect={() => onSelect(def.id)}
                />
              </View>
            ))}
          </View>
          {selectedId ? (
            <Text style={styles.perspectiveSelectedLine}>
              {t('travel.direction.selected', {
                label: t(getTravelDirectionById(selectedId)?.titleKey ?? 'travel.direction.title'),
              })}
            </Text>
          ) : (
            <Text style={styles.perspectiveOverviewLine}>{t('travel.direction.subtitle')}</Text>
          )}
        </>
      ) : selectedId ? (
        <Text style={styles.perspectiveSelectedLine}>
          {t('travel.direction.selected', {
            label: t(getTravelDirectionById(selectedId)?.titleKey ?? 'travel.direction.title'),
          })}
        </Text>
      ) : null}
    </View>
  );
}

function TravelPerspectiveCard({
  def,
  selected,
  perspectiveMetrics,
  stretchInColumn,
  onSelect,
}: Readonly<{
  def: TravelDirectionDefinition;
  selected: boolean;
  perspectiveMetrics: ReturnType<typeof travelPerspectiveCardMetrics>;
  stretchInColumn?: boolean;
  onSelect: () => void;
}>): ReactElement {
  const { t } = useTranslation();
  const accent = travelPerspectiveAccent(def.id);
  return (
    <TravelAppTile
      variant="perspective"
      accent={accent}
      accentSecondary={travelPerspectiveAccentSecondary(def.id)}
      icon={travelPerspectiveIcon(def.id)}
      title={t(def.titleKey)}
      subtitle={t(def.subtitleKey)}
      badgeLabel={t(def.badgeKey)}
      statusLabel={t(travelPerspectiveStatusLabelKey(def.status))}
      ctaLabel={t(def.primaryCtaKey)}
      selected={selected}
      perspectiveMetrics={perspectiveMetrics}
      stretchInColumn={stretchInColumn}
      backgroundImage={TRAVEL_PERSPECTIVE_CARD_ASSETS[def.id]}
      imageStyle={travelPerspectiveCardWebImageStyle(def.id)}
      onPress={onSelect}
      testID={`travel-perspective-${def.id}`}
      accessibilityLabel={t(def.titleKey)}
    />
  );
}

function travelExperienceSceneImageStyle(objectPosition: string): ImageStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? ({ objectFit: 'cover', objectPosition } as ImageStyle)
      : null),
  };
}

function TravelDestinationLensSceneLayer({ compact = false }: Readonly<{ compact?: boolean }>): ReactElement {
  return (
    <>
      <Image
        source={TRAVEL_DESTINATION_LENS_SCENE}
        style={travelExperienceSceneImageStyle(TRAVEL_DESTINATION_LENS_SCENE_OBJECT_POSITION)}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4, 12, 22, 0.66)', 'rgba(6, 14, 24, 0.24)', 'rgba(8, 16, 28, 0.03)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(92, 205, 255, 0.22)', 'rgba(132, 238, 255, 0.1)', 'transparent']}
        locations={[0, 0.38, 1]}
        start={{ x: 0.1, y: 0.58 }}
        end={{ x: 0.96, y: 0.34 }}
        style={styles.destinationSceneRouteGlow}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.06)', 'transparent', 'rgba(0, 0, 0, 0.08)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(132, 238, 255, 0.1)', 'transparent']}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 0.72, y: 0.55 }}
        style={styles.destinationContextLightSweep}
      />
      {!compact ? (
        <View style={styles.destinationSceneSparkleTrail} pointerEvents="none">
          <Ionicons name="sparkles" size={11} color="rgba(168, 240, 255, 0.52)" />
        </View>
      ) : null}
    </>
  );
}

function TravelLocalDiscoveryCategoryChip({
  category,
  selected,
  compact,
  onPress,
}: Readonly<{
  category: TravelLocalDiscoveryCategory;
  selected: boolean;
  compact: boolean;
  onPress: () => void;
}>): ReactElement {
  const colors = travelLocalDiscoveryAccentColors(category.accent);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${category.label} bộ lọc xem trước demo`}
      testID={`travel-local-discovery-category-${category.id}`}
      style={({ pressed }) => [
        styles.localDiscoveryCategoryChip,
        {
          borderColor: selected ? colors.border : 'rgba(148, 228, 255, 0.16)',
          backgroundColor: selected ? colors.bg : 'rgba(6, 12, 20, 0.64)',
          opacity: pressed ? 0.92 : selected ? 1 : 0.94,
        },
      ]}
    >
      <View style={[styles.localDiscoveryCategoryIconCapsule, { borderColor: colors.border }]}>
        <Ionicons name={category.icon} size={compact ? 12 : 18} color={colors.icon} accessibilityIgnoresInvertColors />
      </View>
      <Text
        style={[styles.localDiscoveryCategoryLabel, compact ? null : styles.localDiscoveryCategoryLabelDesktop]}
        numberOfLines={1}
      >
        {category.label}
      </Text>
    </Pressable>
  );
}

function TravelLocalDiscoveryCategoryRow({
  compact,
  selectedCategoryId,
  onSelectCategory,
}: Readonly<{
  compact: boolean;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}>): ReactElement {
  const { t, i18n } = useTranslation();
  const categories = useMemo(
    () => resolveTravelLocalDiscoveryCategories(t),
    [t, i18n.language]
  );
  return (
    <View style={styles.localDiscoveryCategoryDockInner} pointerEvents="box-none">
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4, 10, 18, 0.55)', 'rgba(4, 10, 18, 0.82)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.localDiscoveryCategoryOverlayKicker}>
        {t('travelHub.localDiscovery.categoryOverlayKicker')}
      </Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.localDiscoveryCategoryScrollContent}
        testID="travel-local-discovery-category-row"
      >
        {categories.map((category) => (
          <TravelLocalDiscoveryCategoryChip
            key={category.id}
            category={category}
            compact={compact}
            selected={selectedCategoryId === category.id}
            onPress={() => onSelectCategory(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function TravelLocalDiscoverySearchAction({
  compact,
  onPress,
}: Readonly<{ compact: boolean; onPress: () => void }>): ReactElement {
  const { t } = useTranslation();
  const searchTitle = t('travelHub.localDiscovery.searchTitle');
  const searchNote = t('travelHub.localDiscovery.searchNote');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${searchTitle}. ${searchNote}`}
      testID="travel-local-discovery-search-action"
      style={({ pressed }) => [
        styles.localDiscoverySearchAction,
        compact && styles.localDiscoverySearchActionCompact,
        pressed && { opacity: 0.92, transform: [{ scale: 0.992 }] },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(92, 205, 255, 0.2)', 'rgba(12, 24, 36, 0.48)', 'rgba(6, 12, 20, 0.58)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.localDiscoverySearchIconCapsule,
          compact ? styles.localDiscoverySearchIconCapsuleCompact : styles.localDiscoverySearchIconCapsuleDesktop,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={compact ? 16 : 22}
          color="rgba(186, 244, 255, 0.98)"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View style={styles.localDiscoverySearchCopy}>
        <Text
          style={[styles.localDiscoverySearchTitle, compact ? null : styles.localDiscoverySearchTitleDesktop]}
        >
          {searchTitle}
        </Text>
        <Text
          style={[styles.localDiscoverySearchNote, compact ? null : styles.localDiscoverySearchNoteDesktop]}
          numberOfLines={2}
        >
          {searchNote}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={compact ? 13 : 16}
        color="rgba(168, 228, 255, 0.82)"
        accessibilityIgnoresInvertColors
      />
    </Pressable>
  );
}

function TravelLocalDiscoveryPreviewList({
  compact,
  selectedCategoryId,
  selectedPreviewId,
  onSelectPreview,
}: Readonly<{
  compact: boolean;
  selectedCategoryId: string | null;
  selectedPreviewId: string | null;
  onSelectPreview: (previewId: string) => void;
}>): ReactElement | null {
  const { t, i18n } = useTranslation();
  const previewA11ySuffix = t('travelHub.localDiscovery.previewA11ySuffix');
  const allPreviewItems = useMemo(
    () => resolveTravelLocalDiscoveryPreviewItems(t),
    [t, i18n.language]
  );
  const items = useMemo(() => {
    if (!selectedCategoryId) return allPreviewItems;
    return allPreviewItems.filter((item) => item.categoryId === selectedCategoryId);
  }, [allPreviewItems, selectedCategoryId]);

  if (items.length === 0) return null;

  const rows = items.map((item) => {
    const colors = travelLocalDiscoveryAccentColors(item.accent);
    const selected = selectedPreviewId === item.id;
    return (
      <Pressable
        key={item.id}
        onPress={() => onSelectPreview(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.label} ${previewA11ySuffix}`}
        testID={`travel-local-discovery-preview-${item.id}`}
        style={({ pressed }) => [
          styles.localDiscoveryPreviewItem,
          compact && styles.localDiscoveryPreviewItemCompact,
          !compact && styles.localDiscoveryPreviewItemDesktop,
          {
            borderColor: selected ? colors.border : 'rgba(92, 205, 255, 0.06)',
            backgroundColor: selected ? colors.bg : 'rgba(6, 12, 20, 0.22)',
            opacity: pressed ? 0.82 : selected ? 0.92 : 0.72,
          },
        ]}
      >
        <Ionicons name={item.icon} size={compact ? 13 : 17} color={colors.icon} accessibilityIgnoresInvertColors />
        <Text
          style={[styles.localDiscoveryPreviewLabel, compact ? null : styles.localDiscoveryPreviewLabelDesktop]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      style={[styles.localDiscoveryPreviewWrap, compact ? null : styles.localDiscoveryPreviewWrapDesktop]}
      testID="travel-local-discovery-preview-list"
    >
      {!compact ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(4, 10, 18, 0.28)', 'rgba(4, 10, 18, 0.42)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.localDiscoveryPreviewRowScrim}
        />
      ) : null}
      <Text
        style={[styles.localDiscoveryPreviewKicker, compact ? null : styles.localDiscoveryPreviewKickerDesktop]}
      >
        {t('travelHub.localDiscovery.previewKicker')}
      </Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.localDiscoveryPreviewScroll}
      >
        {rows}
      </ScrollView>
    </View>
  );
}

function TravelLocalDiscoveryHandoffRow({
  compact,
  onDirections,
  onOpenMap,
  onOpenGuides,
  onSupportRequest,
}: Readonly<{
  compact: boolean;
  onDirections: () => void;
  onOpenMap: () => void;
  onOpenGuides: () => void;
  onSupportRequest: () => void;
}>): ReactElement {
  const { t } = useTranslation();
  const primaryActions = [
    {
      id: 'directions',
      label: t('travelHub.localDiscovery.nav.directions'),
      icon: 'navigate-outline' as const,
      onPress: onDirections,
    },
    {
      id: 'map',
      label: t('travelHub.localDiscovery.nav.openMap'),
      icon: 'map-outline' as const,
      onPress: onOpenMap,
    },
  ];
  const secondaryActions = [
    {
      id: 'guides',
      label: t('travelHub.localDiscovery.nav.openGuides'),
      icon: 'compass-outline' as const,
      onPress: onOpenGuides,
    },
    {
      id: 'support',
      label: t('travelHub.localDiscovery.nav.supportRequest'),
      icon: 'chatbubble-ellipses-outline' as const,
      onPress: onSupportRequest,
    },
  ];

  const renderAction = (
    action: {
      id: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      onPress: () => void;
    },
    tier: 'primary' | 'secondary',
    stretch = false
  ) => (
    <Pressable
      key={action.id}
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      testID={`travel-local-discovery-handoff-${action.id}`}
      style={({ pressed }) => [
        tier === 'primary'
          ? styles.localDiscoveryHandoffPrimary
          : [styles.localDiscoveryHandoffSecondary, compact ? null : styles.localDiscoveryHandoffSecondaryDesktop],
        stretch ? styles.localDiscoveryHandoffStretch : null,
        compact && tier === 'primary' ? styles.localDiscoveryHandoffPrimaryCompact : null,
        pressed && { opacity: 0.9 },
      ]}
    >
      {tier === 'primary' ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(92, 205, 255, 0.14)', 'rgba(8, 16, 28, 0.58)', 'rgba(6, 12, 20, 0.72)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Ionicons
        name={action.icon}
        size={tier === 'primary' ? (compact ? 15 : 18) : compact ? 11 : 13}
        color={tier === 'primary' ? 'rgba(168, 240, 255, 0.98)' : 'rgba(168, 210, 236, 0.68)'}
        accessibilityIgnoresInvertColors
      />
      <Text
        style={[
          tier === 'primary'
            ? [styles.localDiscoveryHandoffPrimaryLabel, compact ? null : styles.localDiscoveryHandoffPrimaryLabelDesktop]
            : [styles.localDiscoveryHandoffSecondaryLabel, compact ? null : styles.localDiscoveryHandoffSecondaryLabelDesktop],
        ]}
        numberOfLines={1}
      >
        {action.label}
      </Text>
    </Pressable>
  );

  const secondaryRow = (
    <View style={[styles.localDiscoveryHandoffSecondaryRow, compact && styles.localDiscoveryHandoffSecondaryRowCompact]}>
      {secondaryActions.map((action) => renderAction(action, 'secondary'))}
    </View>
  );

  if (compact) {
    return (
      <View style={styles.localDiscoveryHandoffStack} testID="travel-local-discovery-handoff-row">
        <View style={styles.localDiscoveryHandoffPrimaryRow}>
          {primaryActions.map((action) => renderAction(action, 'primary', true))}
        </View>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.localDiscoveryHandoffSecondaryScroll}
        >
          {secondaryActions.map((action) => renderAction(action, 'secondary'))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.localDiscoveryHandoffStack} testID="travel-local-discovery-handoff-row">
      <View style={styles.localDiscoveryHandoffPrimaryRow}>
        {primaryActions.map((action) => renderAction(action, 'primary', true))}
      </View>
      {secondaryRow}
    </View>
  );
}

function TravelLocalConciergeScenePanel({
  height,
  mapHint,
  compact = false,
  categoryOverlay,
  openingStageFullscreen = false,
}: Readonly<{
  height: number;
  mapHint: string;
  compact?: boolean;
  categoryOverlay?: ReactElement | null;
  openingStageFullscreen?: boolean;
}>): ReactElement {
  const { width, height: viewportHeight } = useWindowDimensions();
  const sceneObjectPosition = useMemo(
    () => travelLocalConciergeSceneObjectPosition(width, viewportHeight, openingStageFullscreen),
    [width, viewportHeight, openingStageFullscreen]
  );
  const sceneWebUri = useMemo(
    () => (Platform.OS === 'web' ? resolveTravelImageUri(TRAVEL_LOCAL_CONCIERGE_SCENE) : undefined),
    []
  );
  return (
    <View
      testID="travel-local-concierge-scene-panel"
      style={[styles.conciergeSceneShell, { height }]}
    >
      {Platform.OS === 'web' ? (
        sceneWebUri ? (
          <View
            testID="travel-local-concierge-scene-bg"
            style={travelLocalConciergeSceneWebBackgroundStyle(sceneObjectPosition, sceneWebUri)}
          />
        ) : (
          <>
            <View
              testID="travel-local-concierge-scene-bg-fallback"
              style={travelLocalConciergeSceneGradientFallbackStyle()}
            />
            <Image
              source={TRAVEL_LOCAL_CONCIERGE_SCENE}
              style={travelExperienceSceneImageStyle(sceneObjectPosition)}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </>
        )
      ) : (
        <Image
          source={TRAVEL_LOCAL_CONCIERGE_SCENE}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4, 10, 18, 0.14)', 'rgba(6, 12, 20, 0.05)', 'rgba(8, 14, 24, 0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(98, 255, 228, 0.05)', 'transparent', 'rgba(92, 205, 255, 0.03)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={styles.conciergeSceneTopGlow}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0.18)']}
        start={{ x: 0.5, y: 0.48 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.conciergeSceneBottomDepth}
      />
      <View style={[styles.conciergeSceneOverlayLayer, styles.conciergeSceneOverlayLayerSubtle]} pointerEvents="none">
        <View style={[styles.conciergeSceneRouteArc, compact && styles.conciergeSceneRouteArcCompact]} />
        <View style={[styles.conciergeScenePulseOuter, compact && styles.conciergeScenePulseOuterCompact]} />
        <View style={[styles.conciergeScenePulseMid, compact && styles.conciergeScenePulseMidCompact]} />
        <View style={styles.conciergeScenePinHalo} />
        <View style={styles.conciergeScenePinCore}>
          <Ionicons name="location" size={compact ? 15 : 17} color="rgba(214, 255, 244, 0.88)" />
        </View>
      </View>
      {categoryOverlay ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(4, 10, 18, 0.16)', 'rgba(4, 10, 18, 0.44)']}
            locations={[0.76, 0.9, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.localDiscoveryCategoryDockScrim}
          />
          <View
            style={[
              styles.localDiscoveryCategoryBottomDock,
              compact && styles.localDiscoveryCategoryBottomDockCompact,
            ]}
            pointerEvents="box-none"
          >
            {categoryOverlay}
          </View>
        </>
      ) : null}
    </View>
  );
}

/** @deprecated Use TravelDestinationLensSceneLayer */
function TravelDestinationLensBackdrop(props: Readonly<{ compact?: boolean }>): ReactElement {
  return <TravelDestinationLensSceneLayer {...props} />;
}

/** @deprecated Use TravelLocalConciergeScenePanel */
function TravelLocalMapConciergePreview(props: Parameters<typeof TravelLocalConciergeScenePanel>[0]): ReactElement {
  return <TravelLocalConciergeScenePanel {...props} />;
}

function TravelLocalMapConciergeCard({
  mapHeight,
  panelMinHeight,
  compact,
  mapCardInnerGap,
  pilotBadge,
  destinationQuery,
  gpsOptIn,
  latitude,
  longitude,
  onOpenLocalGuides,
  openingStageFullscreen = false,
}: Readonly<{
  mapHeight: number;
  panelMinHeight?: number;
  compact: boolean;
  mapCardInnerGap: number;
  pilotBadge: string;
  destinationQuery: string;
  gpsOptIn: boolean;
  latitude: number;
  longitude: number;
  onOpenLocalGuides: () => void;
  openingStageFullscreen?: boolean;
}>): ReactElement {
  const { t } = useTranslation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);

  const handleSearchPlace = useCallback(() => {
    const query = destinationQuery.trim() || 'dịch vụ gần điểm đến';
    openOsmSearchQuery(query);
  }, [destinationQuery]);

  const handleDirections = useCallback(() => {
    if (gpsOptIn) {
      void openDirectionsExternally(latitude, longitude, destinationQuery.trim() || 'Điểm đến');
      return;
    }
    Alert.alert(
      'Chỉ đường · xem trước',
      'Bật vị trí hoặc nhập điểm đến để mở chỉ đường ngoài VIONA. Không theo dõi GPS trong app.',
      [{ text: 'OK' }]
    );
  }, [destinationQuery, gpsOptIn, latitude, longitude]);

  const handleOpenMap = useCallback(() => {
    if (gpsOptIn) {
      void openDirectionsExternally(latitude, longitude, destinationQuery.trim() || 'Điểm đến');
      return;
    }
    Alert.alert(
      'Mở bản đồ · xem trước',
      'Bật vị trí hoặc nhập điểm đến để mở bản đồ ngoài VIONA. Đây là xem trước — không phải theo dõi live.',
      [{ text: 'OK' }]
    );
  }, [destinationQuery, gpsOptIn, latitude, longitude]);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
    setSelectedPreviewId(null);
  }, []);

  const categoryOverlay = (
    <TravelLocalDiscoveryCategoryRow
      compact={compact}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={handleSelectCategory}
    />
  );

  return (
    <TravelGlassCard
      testID="travel-local-assist-card"
      visual="standard"
      accent="emerald"
      intensity="quiet"
      compact={compact}
      accessibilityLabel="Hỗ trợ địa phương — khám phá dịch vụ gần bạn và chuyển sang Local"
      style={[
        styles.localConciergeGlassShell,
        panelMinHeight != null ? { minHeight: panelMinHeight } : null,
      ]}
      contentStyle={[
        styles.localConciergeCardInner,
        compact && styles.localConciergeCardInnerCompact,
        !compact && styles.localConciergeCardInnerDesktop,
        { gap: mapCardInnerGap },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(98, 255, 228, 0.04)', 'rgba(6, 12, 20, 0.22)', 'rgba(2, 5, 10, 0.38)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.localAssistReadabilityVeil}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8, 16, 28, 0.38)', 'rgba(8, 16, 28, 0.12)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.42 }}
        style={styles.localConciergeHeaderScrim}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(132, 238, 255, 0.06)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.32 }}
        style={styles.localConciergeTopGlow}
      />
      <View style={styles.localConciergeSection}>
        <View style={styles.localConciergeHeaderRow}>
          <View style={styles.localConciergeHeaderLead}>
            <View style={styles.localConciergeIconCapsule}>
              <LinearGradient
                colors={['rgba(132, 238, 255, 0.14)', 'rgba(92, 205, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="navigate-outline" size={16} color="rgba(168, 240, 255, 0.94)" accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.localConciergeHeaderCopy}>
              <Text style={styles.localConciergeKicker}>
                {t('travelHub.experienceZone.localMapConcierge.kicker')}
              </Text>
              <Text style={[styles.localConciergeTitle, compact && styles.localSupportTitleCompact]}>
                {t('travelHub.experienceZone.localMapConcierge.title')}
              </Text>
              <Text
                style={[styles.localConciergeSubtitle, compact && styles.localAssistHeaderSubCompact]}
                numberOfLines={2}
              >
                {t('travelHub.experienceZone.localMapConcierge.subtitle')}
              </Text>
            </View>
          </View>
          <View style={styles.localConciergePilotBadge}>
            <Text style={styles.localConciergePilotBadgeText}>{pilotBadge}</Text>
          </View>
        </View>
      </View>
      <View style={styles.localConciergeSectionPrimary}>
        <TravelLocalDiscoverySearchAction compact={compact} onPress={handleSearchPlace} />
      </View>
      <View style={styles.localConciergeSectionScene}>
        <TravelLocalConciergeScenePanel
          height={mapHeight}
          mapHint=""
          compact={compact}
          categoryOverlay={categoryOverlay}
          openingStageFullscreen={openingStageFullscreen}
        />
      </View>
      <View style={styles.localConciergeSectionTertiary}>
        <TravelLocalDiscoveryPreviewList
          compact={compact}
          selectedCategoryId={selectedCategoryId}
          selectedPreviewId={selectedPreviewId}
          onSelectPreview={setSelectedPreviewId}
        />
      </View>
      <View style={styles.localConciergeSectionActions}>
        <TravelLocalDiscoveryHandoffRow
          compact={compact}
          onDirections={handleDirections}
          onOpenMap={handleOpenMap}
          onOpenGuides={onOpenLocalGuides}
          onSupportRequest={onOpenLocalGuides}
        />
      </View>
      <Text
        style={[
          styles.localSupportSafetyNote,
          styles.localConciergeSafetyNote,
          compact ? styles.localSupportSafetyNoteCompact : styles.localConciergeSafetyNoteDesktop,
        ]}
      >
        {t('travelHub.localSupport.safetyNote')}
      </Text>
    </TravelGlassCard>
  );
}

function TravelDestinationLensCard({
  destinationQuery,
  onDestinationChange,
  loadingCtx,
  gpsOptIn,
  onEnableLocation,
  weatherCode,
  weatherLine,
  homeCountryCode,
  viewportWidth,
  twoColumn,
  metaInnerGap,
  metaInputMinHeight,
  t,
}: Readonly<{
  destinationQuery: string;
  onDestinationChange: (value: string) => void;
  loadingCtx: boolean;
  gpsOptIn: boolean;
  onEnableLocation: () => void;
  weatherCode: number;
  weatherLine: string;
  homeCountryCode: string | undefined;
  viewportWidth: number;
  twoColumn: boolean;
  metaInnerGap: number;
  metaInputMinHeight: number;
  t: (key: string) => string;
}>): ReactElement {
  const promptTitle = t('travelHub.destinationPlaceholder');
  const useLiveToday = gpsOptIn && !loadingCtx;
  const weatherCardTier = travelWeatherCinematicCardTier(viewportWidth);
  const weatherPreviewDays = useMemo(
    () => buildDestinationWeatherPreview(weatherCode, weatherLine, useLiveToday, t),
    [weatherCode, weatherLine, useLiveToday, t]
  );

  const lensCopy = (
    <View style={styles.destinationLensCopy}>
      <Text style={styles.destinationKicker}>{t('travelHub.experienceZone.destinationLens.kicker')}</Text>
      <Text style={styles.destinationLensTitle}>{promptTitle}</Text>
      <TextInput
        value={destinationQuery}
        onChangeText={onDestinationChange}
        placeholder=""
        style={[styles.destinationLensPromptLine, { minHeight: metaInputMinHeight }]}
        accessibilityLabel={promptTitle}
      />
      <Text style={styles.destinationLensSubtitle}>{t('travelHub.destinationHelper')}</Text>
      {!gpsOptIn ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('travelHub.enableLocationA11y')}
          onPress={onEnableLocation}
          style={({ pressed }) => [styles.destinationLensCtaPill, pressed && { opacity: 0.88 }]}
        >
          <Ionicons name="location-outline" size={12} color="rgba(148, 228, 255, 0.92)" />
          <Text style={styles.destinationLensCtaText}>{t('travelHub.enableLocationCta')}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const weatherRow = (
    <TravelDestinationContextWeatherRow
      days={weatherPreviewDays}
      cardTier={weatherCardTier}
      loading={loadingCtx && gpsOptIn}
      preferFitAllCards={twoColumn}
    />
  );

  return (
    <TravelGlassCard
      testID="travel-destination-card"
      visual="standard"
      accent="cyan"
      intensity="quiet"
      compact
      contentStyle={[
        styles.destinationLensCardInner,
        styles.destinationSceneCardInner,
        twoColumn ? styles.destinationSceneCardInnerDesktop : styles.destinationSceneCardInnerMobile,
        { gap: metaInnerGap },
      ]}
    >
      <View style={styles.destinationSceneLayerWrap} pointerEvents="none">
        <TravelDestinationLensSceneLayer compact={!twoColumn} />
      </View>
      <View style={styles.destinationSceneContent} testID="travel-destination-context-strip">
        {twoColumn ? (
          <View style={styles.destinationContextDesktopStack}>
            <View style={styles.destinationLensRow}>
              <View style={styles.destinationLensColLeft}>{lensCopy}</View>
              <View style={styles.destinationLensColWeather}>{weatherRow}</View>
            </View>
            <TravelDestinationContextFxRow
              homeCountryCode={homeCountryCode}
              viewportWidth={viewportWidth}
              twoColumn={twoColumn}
            />
          </View>
        ) : (
          <View style={styles.destinationContextMobileStack}>
            {lensCopy}
            {weatherRow}
            <TravelDestinationContextFxRow
              homeCountryCode={homeCountryCode}
              viewportWidth={viewportWidth}
              twoColumn={twoColumn}
            />
          </View>
        )}
      </View>
    </TravelGlassCard>
  );
}

/** @deprecated Use TravelLocalConciergeScenePanel */
function TravelLocalAssistMapPreview(props: Parameters<typeof TravelLocalConciergeScenePanel>[0]): ReactElement {
  return <TravelLocalConciergeScenePanel {...props} />;
}

/** @deprecated Use TravelLocalMapConciergeCard */
function TravelLocalAssistPremiumCard(props: Parameters<typeof TravelLocalMapConciergeCard>[0]): ReactElement {
  return <TravelLocalMapConciergeCard {...props} />;
}

/** @deprecated Use TravelDestinationLensCard */
function TravelDestinationCompactCard(props: Parameters<typeof TravelDestinationLensCard>[0]): ReactElement {
  return <TravelDestinationLensCard {...props} />;
}

function TravelPilotStrip({
  surfaceMetrics,
  marginBottom,
}: Readonly<{
  surfaceMetrics: ReturnType<typeof travelSecondarySurfaceMetrics>;
  marginBottom: number;
}>): ReactElement {
  const { t, i18n } = useTranslation();
  const litePanelCopy = useMemo(
    () => resolveTravelLitePanelCopy(t),
    [i18n.language, t]
  );
  return (
    <TravelGlassCard
      testID="travel-pilot-strip"
      visual="standard"
      accent="cyan"
      intensity="quiet"
      compact
      contentStyle={[
        styles.pilotStripInner,
        {
          gap: surfaceMetrics.pilotGap,
          paddingVertical: surfaceMetrics.pilotPaddingV,
          paddingHorizontal: surfaceMetrics.pilotPaddingH,
        },
      ]}
      style={[styles.pilotStripCard, { marginBottom }]}
    >
      <View style={styles.pilotStripTitleRow}>
        <View style={styles.pilotStripIconWrap}>
          <Ionicons name="airplane-outline" size={15} color={TRAVEL_PILOT_CYAN.ink} accessibilityIgnoresInvertColors />
        </View>
        <Text
          style={[
            styles.pilotStripTitle,
            {
              textShadowColor: TRAVEL_PILOT_CYAN.glow,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            },
          ]}
          numberOfLines={2}
        >
          {litePanelCopy.title}
        </Text>
      </View>
      <Text style={styles.pilotStripBanner} numberOfLines={3}>
        {litePanelCopy.subtitle}
      </Text>
      <View style={[styles.pilotPillRow, { gap: surfaceMetrics.pilotGap }]}>
        {TRAVEL_PILOT_PILLS.map((pill, index) => (
          <View
            key={pill.labelKey}
            style={[
              styles.pilotPill,
              {
                minHeight: surfaceMetrics.pilotPillMinHeight,
                borderColor: TRAVEL_PILOT_CYAN.stroke,
                backgroundColor: TRAVEL_PILOT_CYAN.statusFill,
              },
            ]}
            accessibilityRole="text"
            accessibilityLabel={litePanelCopy.pillLabels[index]}
          >
            <Ionicons name={pill.icon} size={11} color={TRAVEL_PILOT_CYAN.ink} accessibilityIgnoresInvertColors />
            <Text
              style={[
                styles.pilotPillText,
                {
                  color: TRAVEL_PILOT_CYAN.ink,
                  textShadowColor: TRAVEL_PILOT_CYAN.glow,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 5,
                },
              ]}
              numberOfLines={2}
            >
              {litePanelCopy.pillLabels[index]}
            </Text>
          </View>
        ))}
      </View>
    </TravelGlassCard>
  );
}

const TRAVEL_CONNECTED_LINK_ACCENTS: Record<TravelSemanticAccent, string> = {
  cyan: 'rgba(110, 208, 255, 0.9)',
  emerald: 'rgba(96, 214, 168, 0.9)',
  violet: 'rgba(198, 172, 248, 0.9)',
  gold: 'rgba(234, 196, 124, 0.9)',
  magenta: 'rgba(232, 148, 210, 0.9)',
};

function TravelConnectedLink({
  icon,
  title,
  subtitle,
  onPress,
  a11yLabel,
  accent,
  testID,
  minHeight,
  fullWidth = false,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  a11yLabel: string;
  accent: TravelSemanticAccent;
  testID: string;
  minHeight?: number;
  fullWidth?: boolean;
}>): ReactElement {
  const [active, setActive] = useState(false);
  const tokens = travelSemanticTokens(accent);
  const iconColor = active ? tokens.inkHover : TRAVEL_CONNECTED_LINK_ACCENTS[accent];
  const TRAVEL_CONNECTED_HOVER_MS = 200;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={({ pressed }) => [
        styles.connectedLink,
        styles.universeBridgePortal,
        fullWidth && styles.connectedLinkFullWidth,
        {
          borderColor: active || pressed ? tokens.strokeHover : tokens.stroke,
          minHeight,
        },
        Platform.OS === 'web' &&
          ({
            backgroundColor: active ? 'rgba(8, 14, 24, 0.94)' : 'rgba(10, 16, 28, 0.82)',
            boxShadow: active
              ? `0 0 0 1px ${tokens.strokeHover}, 0 0 18px ${tokens.glow}, 0 0 28px ${tokens.glow}1a, inset 0 1px 0 rgba(255,255,255,0.08)`
              : `0 0 0 1px ${tokens.stroke}, 0 0 14px ${tokens.glow}14, inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 22px rgba(0,0,0,0.32)`,
            transform: pressed
              ? [{ scale: 0.985 }]
              : active
                ? [{ translateY: -2.5 }, { scale: 1.01 }]
                : [],
            transition: `transform ${TRAVEL_CONNECTED_HOVER_MS}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${TRAVEL_CONNECTED_HOVER_MS}ms ease-out, border-color ${TRAVEL_CONNECTED_HOVER_MS}ms ease-out, background-color ${TRAVEL_CONNECTED_HOVER_MS}ms ease-out`,
          } as object),
        Platform.OS !== 'web' && (active || pressed) && styles.connectedLinkActive,
        Platform.OS !== 'web' && pressed && { opacity: 0.94 },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.05)', 'transparent', 'rgba(0, 0, 0, 0.12)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.universeBridgeInnerSheen}
      />
      <View
        style={[
          styles.connectedIconCapsule,
          {
            borderColor: active ? tokens.strokeHover : tokens.stroke,
            backgroundColor: tokens.washDefault,
          },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255, 255, 255, 0.08)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.connectedIconCapsuleSheen}
        />
        <Ionicons name={icon} size={15} color={iconColor} accessibilityIgnoresInvertColors />
      </View>
      <View style={styles.connectedLinkCopy}>
        <Text style={[styles.connectedLinkTitle, active && styles.connectedLinkTitleActive]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.connectedLinkSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.connectedPortalAffordance, { borderColor: active ? tokens.strokeHover : tokens.stroke }]}>
        <Ionicons name="chevron-forward" size={13} color={iconColor} accessibilityIgnoresInvertColors />
      </View>
    </Pressable>
  );
}

function TravelLocationConsentGate({
  onAllow,
  onDecline,
}: Readonly<{
  onAllow: () => void;
  onDecline: () => void;
}>): ReactElement {
  const { t, i18n } = useTranslation();
  const chips = useMemo(
    () =>
      [
        t('travelHub.consentChipPrivacy'),
        t('travelHub.consentChipSkippable'),
        t('travelHub.consentChipLimited'),
      ] as const,
    [t, i18n.language]
  );
  const benefits = useMemo(
    () =>
      [
        { icon: 'partly-sunny-outline' as const, label: t('travelHub.consentBenefitWeather') },
        { icon: 'compass-outline' as const, label: t('travelHub.consentBenefitNearby') },
        { icon: 'navigate-outline' as const, label: t('travelHub.consentBenefitLocal') },
      ] as const,
    [t, i18n.language]
  );

  return (
    <View style={styles.locationGateStage} testID="travel-location-consent-gate">
      <TravelGlassCard
        visual="standard"
        accent="emerald"
        intensity="quiet"
        accessibilityLabel={t('travelHub.consentHeadline')}
        style={styles.locationGateCardShell}
        contentStyle={styles.locationGateCardInner}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(98, 255, 228, 0.08)', 'rgba(92, 205, 255, 0.04)', 'rgba(6, 12, 20, 0.42)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.locationGateIconOrb} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <LinearGradient
            colors={['rgba(132, 238, 255, 0.22)', 'rgba(98, 255, 228, 0.08)', 'rgba(6, 12, 20, 0.52)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="location-outline" size={28} color="rgba(186, 244, 255, 0.98)" accessibilityIgnoresInvertColors />
        </View>
        <View style={styles.locationGateChipRow}>
          {chips.map((chip) => (
            <View key={chip} style={styles.locationGateChip}>
              <Text style={styles.locationGateChipLabel}>{chip}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.locationGateTitle}>{t('travelHub.consentHeadline')}</Text>
        <Text style={styles.locationGateSubtitle}>{t('travelHub.consentSubtitle')}</Text>
        <View style={styles.locationGateBenefitsBlock}>
          <Text style={styles.locationGateBenefitsKicker}>{t('travelHub.consentBenefitsKicker')}</Text>
          {benefits.map((item) => (
            <View key={item.label} style={styles.locationGateBenefitRow}>
              <View style={styles.locationGateBenefitIconCapsule}>
                <Ionicons name={item.icon} size={14} color="rgba(168, 240, 255, 0.94)" accessibilityIgnoresInvertColors />
              </View>
              <Text style={styles.locationGateBenefitLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.locationGateSupport}>{t('travelHub.consentSupport')}</Text>
        <Pressable
          onPress={onAllow}
          accessibilityRole="button"
          accessibilityLabel={t('travelHub.consentPrimary')}
          testID="travel-location-consent-allow"
          style={({ pressed }) => [styles.locationGatePrimaryBtn, pressed && { opacity: 0.92 }]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(92, 205, 255, 0.2)', 'rgba(98, 255, 228, 0.1)', 'rgba(6, 12, 20, 0.58)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.locationGatePrimaryLabel}>{t('travelHub.consentPrimary')}</Text>
        </Pressable>
        <Pressable
          onPress={onDecline}
          accessibilityRole="button"
          accessibilityLabel={t('travelHub.consentSecondary')}
          testID="travel-location-consent-decline"
          style={({ pressed }) => [styles.locationGateSecondaryBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.locationGateSecondaryLabel}>{t('travelHub.consentSecondary')}</Text>
        </Pressable>
      </TravelGlassCard>
    </View>
  );
}

export function TravelScreen() {
  const { t, i18n } = useTranslation();
  const { userSelectedLocale } = useSmartTrio();
  const { openMiniApp } = useMiniAppEntry();
  const navigation = useNavigation<Nav>();
  const tabBarNavigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const route = useRoute<TravelRoute>();
  const { user } = useAuth();
  const homeCommand = useHomeCommand();

  /** Pack 35 — Smart Trio language sheet updates trio state only; sync to global i18n + storage while on Travel. */
  useEffect(() => {
    if (!userSelectedLocale || userSelectedLocale === i18n.language) return;
    void persistUserLanguage(userSelectedLocale);
  }, [userSelectedLocale, i18n.language]);

  const { width, height: viewportHeight } = useWindowDimensions();
  const quickHelpTouchSelectionMode = useTravelQuickHelpTouchSelection(width);
  const insets = useSafeAreaInsets();
  const { isFullscreen } = useFullscreenMode();

  const travelRailLegacyLabels = useMemo(
    () => ({
      languageTitle: t('smartTrio.switcher.title'),
      accountA11y: t('home.accountChipA11y'),
      accountChip: t('home.accountChip'),
      accountChipShort: t('home.accountChipShort'),
      sosFabLabel: t('sos.fabLabel'),
    }),
    [t, i18n.language]
  );

  /** Pack 32 — hide tab-nav legacy floats on mobile web; shell top rail owns Language / Account / SOS. */
  useVionaGlobalTopRailWebLegacySuppression({
    rootId: TRAVEL_HUB_LEGACY_SUPPRESS_ROOT_ID,
    enabled: Platform.OS === 'web' && width < VIONA_TABLET_MIN_WIDTH,
    labels: travelRailLegacyLabels,
    scenePadMin: 40,
  });

  useHubWebShellCompensation(TRAVEL_HUB_LEGACY_SUPPRESS_ROOT_ID);

  const desktopWeb = Platform.OS === 'web' && width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH;
  const openingStageFullscreen = desktopWeb && isFullscreen;
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const scrollRef = useRef<ScrollView>(null);
  const [destinationQuery, setDestinationQuery] = useState(route.params?.destinationQuery?.trim() ?? '');
  const [gpsCity, setGpsCity] = useState('');
  const [weatherCode, setWeatherCode] = useState(0);
  const [lat, setLat] = useState(10.8231);
  const [lng, setLng] = useState(106.6297);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [cravingsModalOpen, setCravingsModalOpen] = useState(false);
  const [cravingsHits, setCravingsHits] = useState<readonly CravingsRadarHit[]>([]);
  const [sosHoldGateOpen, setSosHoldGateOpen] = useState(false);
  const [sosPlusInfoOpen, setSosPlusInfoOpen] = useState(false);
  type LocationGate = 'loading' | 'prompt' | 'ready';
  const [locationGate, setLocationGate] = useState<LocationGate>('loading');
  const [gpsOptIn, setGpsOptIn] = useState(false);
  const [travelPerspectiveMode, setTravelPerspectiveMode] =
    useState<TravelPerspectiveMode>('overview');
  const [selectedQuickHelpHeroContextId, setSelectedQuickHelpHeroContextId] =
    useState<TravelQuickHelpHeroContextId>('default');
  const [hoveredQuickHelpHeroContextId, setHoveredQuickHelpHeroContextId] =
    useState<TravelFlagshipScenarioId | null>(null);
  const [hoveredUtilityScenarioId, setHoveredUtilityScenarioId] = useState<TravelScenarioId | null>(
    null
  );
  const displayedHeroQuickHelpContextId = useMemo(
    (): TravelQuickHelpHeroContextId =>
      hoveredQuickHelpHeroContextId ?? selectedQuickHelpHeroContextId,
    [hoveredQuickHelpHeroContextId, selectedQuickHelpHeroContextId]
  );
  const [travelHeroDirectHover, setTravelHeroDirectHover] = useState(false);
  const [travelCardHoverAccent, setTravelCardHoverAccent] = useState<TravelSemanticAccent | null>(
    null
  );
  const travelHeroFadeAnim = useRef(new Animated.Value(1)).current;
  const travelHeroLitAnim = useRef(new Animated.Value(0)).current;
  const previousTravelHeroKeyRef = useRef<TravelDynamicHeroKey>('default');
  /** Pack 46 — defer hover clear so moving between Quick Help cards does not flash default hero. */
  const quickHelpHoverClearTokenRef = useRef(0);

  const activeTravelHeroKey = useMemo((): TravelDynamicHeroKey => {
    if (hoveredQuickHelpHeroContextId != null) {
      return TRAVEL_FLAGSHIP_DYNAMIC_HERO_KEY[hoveredQuickHelpHeroContextId];
    }
    if (hoveredUtilityScenarioId != null) {
      return TRAVEL_SCENARIO_DYNAMIC_HERO_KEY[hoveredUtilityScenarioId] ?? 'default';
    }
    if (displayedHeroQuickHelpContextId !== 'default') {
      return TRAVEL_FLAGSHIP_DYNAMIC_HERO_KEY[displayedHeroQuickHelpContextId];
    }
    return 'default';
  }, [displayedHeroQuickHelpContextId, hoveredQuickHelpHeroContextId, hoveredUtilityScenarioId]);

  const activeTravelHeroFrameAccent = useMemo(
    () => travelQuickHelpHeroAccent(displayedHeroQuickHelpContextId),
    [displayedHeroQuickHelpContextId]
  );

  const travelFirstViewLock = useMemo(
    () => computeTravelOpeningStageFirstViewLock(width, viewportHeight, openingStageFullscreen),
    [width, viewportHeight, openingStageFullscreen]
  );
  const desktopStageLock =
    travelFirstViewLock != null &&
    (width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH || openingStageFullscreen) &&
    !isHubTabletPortraitViewport(width, viewportHeight);
  const travelHeroEditorialCopy = useMemo(
    () => resolveTravelQuickHelpHeroDisplay(displayedHeroQuickHelpContextId, t),
    [displayedHeroQuickHelpContextId, t, i18n.language]
  );
  const travelHeroStage = useMemo(
    () =>
      travelDynamicHeroMetrics(
        width,
        viewportHeight,
        desktopStageLock ? travelFirstViewLock?.heroMaxPx : undefined,
        openingStageFullscreen,
        travelHeroEditorialCopy.title
      ),
    [
      width,
      viewportHeight,
      desktopStageLock,
      travelFirstViewLock?.heroMaxPx,
      openingStageFullscreen,
      travelHeroEditorialCopy.title,
    ]
  );
  const travelHeroFinalTitleStyleLock = useMemo(
    () => travelHeroFinalTitleStyle(width, openingStageFullscreen),
    [width, openingStageFullscreen]
  );
  const activeTravelHeroSource = useMemo(
    () => travelDynamicHeroAsset(activeTravelHeroKey),
    [activeTravelHeroKey]
  );
  const defaultTravelHeroSource = useMemo(() => travelDynamicHeroAsset('default'), []);
  const travelHeroObjectPosition =
    activeTravelHeroKey === 'default' || activeTravelHeroKey === 'journey'
      ? openingStageFullscreen
        ? `64% ${TRAVEL_DYNAMIC_HERO_OBJECT_POSITION_Y_FULLSCREEN}`
        : (TRAVEL_DYNAMIC_HERO_OBJECT_POSITION[activeTravelHeroKey] ??
            TRAVEL_DYNAMIC_HERO_OBJECT_POSITION.default)
      : (TRAVEL_DYNAMIC_HERO_OBJECT_POSITION[activeTravelHeroKey] ??
          TRAVEL_DYNAMIC_HERO_OBJECT_POSITION.default);
  const travelTileLayout = useMemo(() => travelAppTileMetrics(width), [width]);
  const travelFlagshipLayout = useMemo(() => {
    const openingDesktopWeb =
      Platform.OS === 'web' &&
      width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH &&
      !isHubTabletPortraitViewport(width, viewportHeight);
    const base = openingDesktopWeb
      ? {
          ...travelTileLayout,
          flagshipMinHeight: openingStageFullscreen
            ? TRAVEL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX
            : TRAVEL_OPENING_STAGE_NORMAL_WEB_WORLD_CARD_MIN_HEIGHT_PX,
        }
      : travelTileLayout;
    if (openingDesktopWeb) {
      return {
        ...base,
        flagshipIconSize: Math.max(base.flagshipIconSize, 28),
        flagshipCapsuleSize: Math.max(base.flagshipCapsuleSize, 48),
        iconSize: Math.max(base.iconSize, 18),
        flagshipPaddingV: Math.max(base.flagshipPaddingV, 16),
      };
    }
    if (width < 768) {
      return {
        ...base,
        flagshipMinHeight:
          width < 520
            ? TRAVEL_QUICK_HELP_MOBILE_FLAGSHIP_MIN_HEIGHT_NARROW_PX
            : TRAVEL_QUICK_HELP_MOBILE_FLAGSHIP_MIN_HEIGHT_PX,
        flagshipPaddingV: 10,
        flagshipIconSize: 20,
        flagshipCapsuleSize: 40,
      };
    }
    return base;
  }, [openingStageFullscreen, travelTileLayout, width, viewportHeight]);
  const travelUtilityGrid = useMemo(
    () => travelUtilityGridMetrics(width, viewportHeight, openingStageFullscreen),
    [width, viewportHeight, openingStageFullscreen]
  );
  const travelSecondarySurface = useMemo(() => travelSecondarySurfaceMetrics(width), [width]);
  const travelSecondaryRhythm = useMemo(
    () => travelSecondaryRhythmMetrics(width, viewportHeight),
    [width, viewportHeight]
  );
  const travelResponsiveShellStyle = useMemo(
    () => hubResponsiveContentShellStyle(width, viewportHeight),
    [width, viewportHeight]
  );
  const travelOpeningGrammar = useMemo(
    () => travelOpeningGrammarMetrics(width, openingStageFullscreen),
    [width, openingStageFullscreen]
  );
  const travelHeroImageStyle = useMemo((): ImageStyle[] => {
    const webCover =
      Platform.OS === 'web' &&
      width >= TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH &&
      !isHubTabletPortraitViewport(width, viewportHeight);
    const zoomScale = openingStageFullscreen
      ? TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_FULLSCREEN
      : TRAVEL_DYNAMIC_HERO_IMAGE_COVER_SCALE_NORMAL;
    const zoomOutPercent = webCover ? Math.round((1 / zoomScale) * 1000) / 10 : 100;
    const zoomInsetPercent = webCover ? Math.round(((zoomOutPercent - 100) / 2) * 10) / 10 : 0;
    return [
      styles.heroCinematicImage,
      ...(webCover
        ? [
            {
              width: `${zoomOutPercent}%`,
              height: `${zoomOutPercent}%`,
              left: `${-zoomInsetPercent}%`,
              top: `${-zoomInsetPercent}%`,
              objectFit: 'cover',
              objectPosition: travelHeroObjectPosition,
            } as ImageStyle,
          ]
        : Platform.OS === 'web'
          ? [
              {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: travelHeroObjectPosition,
              } as ImageStyle,
            ]
          : []),
    ];
  }, [travelHeroObjectPosition, width, viewportHeight, openingStageFullscreen]);
  const travelHeroStageStyle = useMemo(
    () => [
      styles.heroStage,
      {
        aspectRatio: travelHeroStage.aspectRatio,
        minHeight: travelHeroStage.stageMinHeight,
        maxHeight: travelHeroStage.stageMaxHeight,
      },
    ],
    [travelHeroStage]
  );

  const travelHeroFrameLit =
    travelHeroDirectHover ||
    displayedHeroQuickHelpContextId !== 'default' ||
    travelCardHoverAccent != null;

  /** Pack 63A — touch/tap selection gets the same hero brighten as pointer hover. */
  const travelHeroBrightenActive =
    travelHeroDirectHover || displayedHeroQuickHelpContextId !== 'default';

  const travelHeroNetworkHoverAccent = useMemo((): TravelSemanticAccent | null => {
    if (displayedHeroQuickHelpContextId !== 'default') {
      return travelQuickHelpHeroAccent(displayedHeroQuickHelpContextId);
    }
    if (travelCardHoverAccent != null) return travelCardHoverAccent;
    return null;
  }, [displayedHeroQuickHelpContextId, travelCardHoverAccent]);

  const travelHeroQuickHelpNetworkHex = useMemo(() => {
    if (displayedHeroQuickHelpContextId === 'default') return null;
    return resolveTravelQuickHelpHeroNetworkColors(displayedHeroQuickHelpContextId);
  }, [displayedHeroQuickHelpContextId]);

  const travelHeroNetworkLighting = useMemo(
    () => resolveTravelHeroNetworkLighting(travelHeroNetworkHoverAccent, travelHeroFrameLit),
    [travelHeroNetworkHoverAccent, travelHeroFrameLit]
  );
  const travelHeroQuickHelpNetworkBoost = useMemo(
    () =>
      travelHeroQuickHelpAccentNetworkBoost(
        displayedHeroQuickHelpContextId,
        displayedHeroQuickHelpContextId !== 'default' || travelHeroFrameLit
      ),
    [displayedHeroQuickHelpContextId, travelHeroFrameLit]
  );
  const travelHeroQuickHelpAccentOverlay = useMemo(
    () =>
      travelHeroQuickHelpAccentStageOverlayStyle(
        displayedHeroQuickHelpContextId,
        displayedHeroQuickHelpContextId !== 'default'
      ),
    [displayedHeroQuickHelpContextId]
  );
  const travelHeroResolvedNetworkLighting = useMemo(
    () =>
      travelHeroQuickHelpNetworkBoost
        ? {
            ...travelHeroNetworkLighting,
            routeArcPrimary: travelHeroQuickHelpNetworkBoost.routeArcPrimary,
            routeArcSecondary: travelHeroQuickHelpNetworkBoost.routeArcSecondary,
            bottomHandoff: travelHeroQuickHelpNetworkBoost.bottomHandoff,
            subjectGlow: travelHeroQuickHelpNetworkBoost.subjectGlow,
          }
        : travelHeroNetworkLighting,
    [travelHeroNetworkLighting, travelHeroQuickHelpNetworkBoost]
  );

  useEffect(() => {
    Animated.timing(travelHeroLitAnim, {
      toValue: travelHeroFrameLit ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [travelHeroFrameLit, travelHeroLitAnim]);

  const travelHeroBrightenOpacity = travelHeroLitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.05],
  });
  const travelHeroHoverRimOpacity = travelHeroLitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.58],
  });
  const travelHeroCrispStroke = useMemo(
    () => travelSemanticTokens(activeTravelHeroFrameAccent).stroke,
    [activeTravelHeroFrameAccent]
  );
  const travelHeroHoverRimStroke = useMemo(() => {
    return travelSemanticTokens(
      travelHeroNetworkHoverAccent ?? activeTravelHeroFrameAccent
    ).stroke;
  }, [travelHeroNetworkHoverAccent, activeTravelHeroFrameAccent]);

  const travelHeroTrustStripStyle = useMemo(
    () =>
      travelQuickHelpHeroTrustStripStyle(
        activeTravelHeroFrameAccent,
        displayedHeroQuickHelpContextId !== 'default' || travelHeroFrameLit,
        travelQuickHelpHeroAccentRgb(displayedHeroQuickHelpContextId)
      ),
    [activeTravelHeroFrameAccent, displayedHeroQuickHelpContextId, travelHeroFrameLit]
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web' && width >= 768) {
        tabBarNavigation.setOptions({ tabBarStyle: TRAVEL_HIDDEN_TAB_BAR_STYLE });
      }
      return () => {
        tabBarNavigation.setOptions({ tabBarStyle: undefined });
      };
    }, [tabBarNavigation, width])
  );

  useEffect(() => {
    if (previousTravelHeroKeyRef.current === activeTravelHeroKey) return;
    travelHeroFadeAnim.setValue(0);
    Animated.timing(travelHeroFadeAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    previousTravelHeroKeyRef.current = activeTravelHeroKey;
  }, [activeTravelHeroKey, travelHeroFadeAnim]);

  const onTravelHeroCardHover = useCallback((id: TravelFlagshipScenarioId) => {
    quickHelpHoverClearTokenRef.current += 1;
    setHoveredQuickHelpHeroContextId(id);
    setTravelCardHoverAccent(SCENARIO_SEMANTIC[id]);
  }, []);

  const onTravelHeroCardLeave = useCallback(() => {
    if (quickHelpTouchSelectionMode && selectedQuickHelpHeroContextId !== 'default') return;
    const token = (quickHelpHoverClearTokenRef.current += 1);
    requestAnimationFrame(() => {
      if (quickHelpHoverClearTokenRef.current !== token) return;
      setHoveredQuickHelpHeroContextId(null);
      setTravelCardHoverAccent(null);
    });
  }, [quickHelpTouchSelectionMode, selectedQuickHelpHeroContextId]);

  const onQuickHelpContextSelect = useCallback((id: TravelFlagshipScenarioId) => {
    setSelectedQuickHelpHeroContextId(id);
    setTravelCardHoverAccent(SCENARIO_SEMANTIC[id]);
  }, []);

  const travelPerspectiveDirectionId = travelPerspectiveModeDirectionId(travelPerspectiveMode);
  const orderedTravelUtilityIds = useMemo(
    () => orderTravelUtilityIds(travelPerspectiveMode),
    [travelPerspectiveMode]
  );
  const travelUtilityPerspectiveHint = useMemo(() => {
    if (travelPerspectiveDirectionId == null) return undefined;
    const def = getTravelDirectionById(travelPerspectiveDirectionId);
    return def ? t(def.subtitleKey) : undefined;
  }, [t, i18n.language, travelPerspectiveDirectionId]);

  const onTravelPerspectiveSelect = useCallback((id: TravelDirectionId) => {
    setTravelPerspectiveMode((prev) => (prev === id ? 'overview' : id));
  }, []);

  const onTravelUtilityHover = useCallback((scenarioId: TravelScenarioId | null) => {
    setHoveredUtilityScenarioId(scenarioId);
    if (scenarioId == null) {
      setTravelCardHoverAccent(null);
      return;
    }
    const accent = SCENARIO_SEMANTIC[scenarioId];
    setTravelCardHoverAccent(accent);
  }, []);

  useEffect(() => {
    void getTravelLocationConsentState().then((state) => {
      if (state === 'granted') {
        setGpsOptIn(true);
        setLocationGate('ready');
        return;
      }
      if (state === 'declined') {
        setGpsOptIn(false);
        setLocationGate('ready');
        return;
      }
      setGpsOptIn(false);
      setLocationGate('prompt');
    });
  }, []);

  useEffect(() => {
    const q = route.params?.destinationQuery?.trim();
    if (q) setDestinationQuery(q);
  }, [route.params?.destinationQuery]);

  useEffect(() => {
    if (locationGate !== 'ready' || !gpsOptIn) return;
    let cancelled = false;
    void (async () => {
      setLoadingCtx(true);
      try {
        const ctx = await getTravelContext({ skipPersistCity: true });
        if (!cancelled) {
          setGpsCity(ctx.city);
          setWeatherCode(ctx.weatherCode);
          setLat(ctx.latitude);
          setLng(ctx.longitude);
          setCravingsHits(
            listVietnameseRestaurantsByProximity({ latitude: ctx.latitude, longitude: ctx.longitude })
          );
        }
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationGate, gpsOptIn]);

  useEffect(() => {
    if (locationGate !== 'ready' || gpsOptIn) return;
    setLoadingCtx(false);
  }, [locationGate, gpsOptIn]);

  const displayCity = useMemo(() => {
    const q = destinationQuery.trim();
    if (q.length >= 2) return q;
    return gpsCity.length > 0 ? gpsCity : '';
  }, [destinationQuery, gpsCity]);

  const weatherLine = useMemo(
    () => t(`travelHub.weather.${weatherLabelKey(weatherCode)}`),
    [t, i18n.language, weatherCode]
  );
  const fxLine = useMemo(
    () => t(`travelHub.fx.${fxLabelKey(user?.country)}`),
    [t, i18n.language, user?.country]
  );
  const travelScrollBottomClearance = useMemo(() => {
    const mobileFloatingReserve = width < 768 ? TRAVEL_MOBILE_FLOATING_CHROME_RESERVE_PX : 0;
    return (
      localConstellation.tabBarClearanceBottom +
      Math.max(insets.bottom, 12) +
      travelSecondaryRhythm.scrollBottomExtra +
      mobileFloatingReserve
    );
  }, [insets.bottom, travelSecondaryRhythm.scrollBottomExtra, width]);

  const openLeona = useCallback(
    (prefillRequest: string) => {
      openMiniApp('b2cAiCallAssistant', () =>
        navigation.navigate('LeonaCall', { prefillRequest, autoSubmit: false })
      );
    },
    [navigation, openMiniApp]
  );

  const openInterpreter = useCallback(
    (scenario: 'travel' | 'doctor' | 'general' = 'travel') => {
      openMiniApp('minhKhangTranslator', () =>
        navigation.navigate('LiveInterpreter', { scenario, guidedEntry: true })
      );
    },
    [navigation, openMiniApp]
  );

  const openLocalUniverse = useCallback(() => {
    openMiniApp('local', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.local }));
  }, [navigation, openMiniApp]);

  const openAcademyUniverse = useCallback(() => {
    if (!featureFlags.academyLiteEnabled) return;
    openMiniApp('academy', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai }));
  }, [featureFlags.academyLiteEnabled, navigation, openMiniApp]);

  const openBusinessUniverse = useCallback(() => {
    openMiniApp('merchantDashboard', () => navigation.navigate('MerchantDashboard'));
  }, [navigation, openMiniApp]);

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

  // SOS entry parity with Home/Local: shared hold-gate first, then existing in-app SOS flow.
  const openTravelSosEntry = useCallback(() => {
    setSosPlusInfoOpen(false);
    setSosHoldGateOpen(true);
  }, []);

  const onSosHoldGateComplete = useCallback(() => {
    setSosHoldGateOpen(false);
    homeCommand?.triggerSafetyAssist();
  }, [homeCommand]);

  const travelScenarios = useMemo((): readonly TravelScenario[] => {
    const withSemantic = (id: TravelScenarioId): Pick<TravelScenario, 'accent' | 'capsuleSecondary'> => ({
      accent: SCENARIO_SEMANTIC[id],
      capsuleSecondary: SCENARIO_CAPSULE_SECONDARY[id],
    });
    return [
      {
        id: 'airport',
        icon: 'airplane-outline',
        ...withSemantic('airport'),
        onPress: () => navigation.navigate('TravelFlightSearch'),
      },
      {
        id: 'hotel',
        icon: 'bed-outline',
        ...withSemantic('hotel'),
        onPress: () => navigation.navigate('TravelHospitality'),
      },
      {
        id: 'taxi',
        icon: 'car-outline',
        ...withSemantic('taxi'),
        onPress: () => openLeona(t('travelHub.leonaPrefill.taxi')),
      },
      {
        id: 'restaurant',
        icon: 'restaurant-outline',
        ...withSemantic('restaurant'),
        onPress: () => setCravingsModalOpen(true),
      },
      {
        id: 'transit',
        icon: 'train-outline',
        ...withSemantic('transit'),
        onPress: () => openLeona(t('travelHub.leonaPrefill.transit')),
      },
      {
        id: 'shopping',
        icon: 'bag-handle-outline',
        ...withSemantic('shopping'),
        onPress: () => openLeona(t('travelHub.leonaPrefill.shopping')),
      },
      {
        id: 'hospital',
        icon: 'medkit-outline',
        ...withSemantic('hospital'),
        onPress: () => openInterpreter('doctor'),
      },
      {
        id: 'emergency',
        icon: 'shield-outline',
        ...withSemantic('emergency'),
        onPress: openTravelSosEntry,
      },
      {
        id: 'translation',
        icon: 'language-outline',
        ...withSemantic('translation'),
        onPress: () => openInterpreter('travel'),
      },
    ];
  }, [navigation, openInterpreter, openLeona, openTravelSosEntry, t, i18n.language]);

  const scenarioById = useMemo(() => {
    const map = new Map<TravelScenarioId, TravelScenario>();
    for (const item of travelScenarios) map.set(item.id, item);
    return map;
  }, [travelScenarios]);

  const shellProps = {
    universe: 'travel' as const,
    title: t('travelHub.screenTitle'),
    subtitle: t('travelHub.railSubtitle'),
    showDock: false,
    surfaceMode: 'midnight' as const,
    legacySuppressRootId: TRAVEL_HUB_LEGACY_SUPPRESS_ROOT_ID,
    scrollRef,
    scrollBottomClearance: travelScrollBottomClearance,
    tabletFullWidth: isHubWebTabletFullBleedViewport(width),
  };

  if (locationGate === 'loading') {
    return (
      <VionaMiniAppShell {...shellProps} showDock={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={CYAN} />
        </View>
      </VionaMiniAppShell>
    );
  }

  if (locationGate === 'prompt') {
    return (
      <VionaMiniAppShell {...shellProps} showDock={false}>
        <TravelLocationConsentGate
          onAllow={() => {
            void (async () => {
              await setTravelLocationConsent(true);
              setGpsOptIn(true);
              setLocationGate('ready');
            })();
          }}
          onDecline={() => {
            void (async () => {
              await setTravelLocationConsent(false);
              setGpsOptIn(false);
              setLocationGate('ready');
            })();
          }}
        />
      </VionaMiniAppShell>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <VionaMiniAppShell {...shellProps}>
        <View style={travelResponsiveShellStyle}>
        <View
          style={[
            styles.openingStage,
            desktopStageLock ? { minHeight: travelFirstViewLock!.stageMinHeightPx } : null,
            { paddingBottom: travelOpeningGrammar.openingStagePaddingBottom },
          ]}
        >
          <TravelGlassCard
            visual="hero"
            accent={activeTravelHeroFrameAccent}
            intensity="primary"
            compact={false}
            heroFrameBoosted={travelHeroFrameLit}
            onHoverChange={setTravelHeroDirectHover}
            contentStyle={styles.heroInner}
            style={styles.heroCardShell}
          >
            <View
              testID="travel-dynamic-hero-stage"
              style={travelHeroStageStyle}
              {...(Platform.OS === 'web'
                ? ({
                    'data-travel-hero-accent': activeTravelHeroFrameAccent,
                    'data-travel-displayed-quick-help-id': displayedHeroQuickHelpContextId,
                  } as const)
                : null)}
            >
              <View style={styles.heroImageClip} pointerEvents="none">
                <Image
                  source={defaultTravelHeroSource}
                  style={travelHeroImageStyle}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                {activeTravelHeroKey !== 'default' ? (
                  <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: travelHeroFadeAnim }]}>
                    <Image
                      source={activeTravelHeroSource}
                      style={travelHeroImageStyle}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  </Animated.View>
                ) : null}
                <LinearGradient
                  pointerEvents="none"
                  colors={[...travelHeroResolvedNetworkLighting.bottomHandoff]}
                  locations={[0, 0.72, 1]}
                  style={styles.heroBottomHandoff}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={[...travelHeroResolvedNetworkLighting.routeArcPrimary]}
                  start={{ x: 0.18, y: 0.62 }}
                  end={{ x: 0.72, y: 0.38 }}
                  style={styles.heroRouteArcPrimary}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={[...travelHeroResolvedNetworkLighting.routeArcSecondary]}
                  start={{ x: 0.82, y: 0.28 }}
                  end={{ x: 0.42, y: 0.72 }}
                  style={styles.heroRouteArcSecondary}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.heroBrightenWash,
                    { opacity: travelHeroBrightenActive ? travelHeroBrightenOpacity : 0 },
                  ]}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={[...travelHeroResolvedNetworkLighting.subjectGlow]}
                  start={{ x: 0.72, y: 0.22 }}
                  end={{ x: 0.92, y: 0.78 }}
                  style={styles.heroSubjectGlow}
                />
              </View>
              <LinearGradient
                pointerEvents="none"
                colors={
                  travelHeroStage.useAbsoluteTextLayer
                    ? ['rgba(2, 6, 14, 0.97)', 'rgba(4, 10, 20, 0.78)', 'rgba(4, 10, 20, 0)']
                    : ['rgba(4, 8, 16, 0.92)', 'rgba(4, 10, 20, 0.58)', 'rgba(4, 10, 20, 0)']
                }
                locations={travelHeroStage.useAbsoluteTextLayer ? [0, 0.48, 1] : [0, 0.52, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[
                  styles.heroTextVeil,
                  { width: `${travelHeroStage.textVeilWidthPercent}%` },
                ]}
              />
              {travelHeroStage.useAbsoluteTextLayer ? (
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(2, 6, 14, 0.55)', 'rgba(2, 6, 14, 0.28)', 'transparent']}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[
                    styles.heroEditorialTextScrim,
                    {
                      width: travelHeroStage.textScrimWidthPx,
                      marginLeft: travelHeroStage.textStackLeftInsetPx,
                    },
                  ]}
                />
              ) : null}
              <TravelHeroLightingNetwork
                hoverAccent={travelHeroNetworkHoverAccent}
                boosted={travelHeroFrameLit}
                networkPrimaryHex={travelHeroQuickHelpNetworkHex?.primary}
                networkSecondaryHex={travelHeroQuickHelpNetworkHex?.secondary}
                radius={18}
              />
              <View
                testID="travel-hero-editorial-text-layer"
                style={[
                  styles.heroTextStack,
                  travelHeroStage.useAbsoluteTextLayer ? styles.heroEditorialTextLayer : null,
                  travelHeroStage.useAbsoluteTextLayer
                    ? {
                        left: 0,
                        paddingLeft: travelHeroStage.textStackLeftInsetPx,
                        paddingTop: travelHeroStage.textStackPaddingTopPx,
                        paddingBottom: travelHeroStage.textStackPaddingBottomPx,
                        width: travelHeroStage.textStackWidthPx,
                        maxWidth: travelHeroStage.textStackWidthPx,
                        paddingHorizontal: 0,
                        alignSelf: 'auto' as const,
                      }
                    : {
                        width: `${travelHeroStage.textStackWidthPercent}%`,
                        maxWidth: travelHeroStage.textStackMaxWidthPx,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.kicker,
                    travelHeroStage.useAbsoluteTextLayer ? styles.kickerEditorialContrast : null,
                    {
                      fontSize: travelHeroStage.heroKickerSize,
                      letterSpacing: travelHeroStage.heroKickerLetterSpacing,
                      marginBottom: travelHeroStage.heroKickerMarginBottom,
                      ...(travelHeroStage.useAbsoluteTextLayer
                        ? { width: travelHeroStage.textStackWidthPx }
                        : null),
                    },
                  ]}
                >
                  {t('travelHub.heroKicker')}
                </Text>
                <Text
                  testID="travel-hero-title"
                  style={[
                    styles.heroTitle,
                    travelHeroStage.useAbsoluteTextLayer ? styles.heroTitleEditorialContrast : null,
                    {
                      fontSize: travelHeroStage.heroTitleSize,
                      lineHeight: travelHeroStage.heroTitleLineHeight,
                      marginBottom: travelHeroStage.heroTitleMarginBottom,
                      ...(Platform.OS === 'web' ? ({ fontWeight: '800' } as const) : null),
                      ...(travelHeroStage.useAbsoluteTextLayer
                        ? {
                            width: travelHeroStage.heroTitleMaxWidth,
                            maxWidth: travelHeroStage.heroTitleMaxWidth,
                            alignSelf: 'flex-start' as const,
                            flexShrink: 0,
                            ...(TRAVEL_DEBUG_HERO_TITLE
                              ? { borderWidth: 3, borderColor: '#ff0000' }
                              : null),
                          }
                        : { maxWidth: travelHeroStage.heroTitleMaxWidth }),
                    },
                    travelHeroFinalTitleStyleLock,
                  ]}
                >
                  {travelHeroEditorialCopy.title}
                </Text>
                <Text
                  testID="travel-hero-subtitle"
                  style={[
                    styles.heroSub,
                    travelHeroStage.useAbsoluteTextLayer ? styles.heroSubEditorialContrast : null,
                    {
                      fontSize: travelHeroStage.heroSubSize,
                      lineHeight: travelHeroStage.heroSubLineHeight,
                      marginBottom: travelHeroStage.heroSubMarginBottom,
                      ...(travelHeroStage.useAbsoluteTextLayer
                        ? {
                            width: travelHeroStage.textStackWidthPx,
                            maxWidth: travelHeroStage.textStackWidthPx,
                            alignSelf: 'flex-start' as const,
                            flexShrink: 0,
                          }
                        : { maxWidth: travelHeroStage.heroSubMaxWidth }),
                    },
                  ]}
                  {...(travelHeroStage.heroSubLines > 0
                    ? { numberOfLines: travelHeroStage.heroSubLines }
                    : {})}
                >
                  {travelHeroEditorialCopy.subtitle}
                </Text>
                <View
                  style={[
                    styles.heroTrustStrip,
                    travelHeroTrustStripStyle,
                    {
                      gap: travelHeroStage.heroTrustGap,
                      paddingVertical: travelHeroStage.heroTrustPaddingV,
                      paddingHorizontal: travelHeroStage.heroTrustPaddingH,
                      width: travelHeroStage.useAbsoluteTextLayer
                        ? travelHeroStage.textStackWidthPx
                        : undefined,
                      maxWidth: travelHeroStage.useAbsoluteTextLayer
                        ? travelHeroStage.textStackWidthPx
                        : travelHeroStage.textStackMaxWidthPx,
                      minWidth: travelHeroStage.chipMinWidthPx > 0 ? travelHeroStage.chipMinWidthPx : undefined,
                      alignSelf: travelHeroStage.useAbsoluteTextLayer ? 'stretch' : 'flex-start',
                      flexWrap: travelHeroStage.heroTrustNoWrap ? 'nowrap' : 'wrap',
                    },
                  ]}
                >
                  {travelHeroEditorialCopy.chips.map((chip, index) => (
                    <Fragment key={`${chip}-${index}`}>
                      {index > 0 ? <View style={styles.heroTrustDivider} /> : null}
                      <Text
                        style={[
                          styles.heroTrustText,
                          { fontSize: travelHeroStage.heroTrustFontSize },
                        ]}
                      >
                        {chip}
                      </Text>
                    </Fragment>
                  ))}
                </View>
              </View>
              <View
                pointerEvents="none"
                style={[
                  styles.heroPremiumFrameEdge,
                  premiumFrameEdgeOverlay(18),
                  premiumCrispEdgeStroke(travelHeroCrispStroke),
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heroHoverRim,
                  {
                    borderColor: travelHeroHoverRimStroke,
                    borderWidth: displayedHeroQuickHelpContextId !== 'default' ? 2 : 1.5,
                    opacity:
                      displayedHeroQuickHelpContextId !== 'default'
                        ? 0.92
                        : travelHeroHoverRimOpacity,
                  },
                ]}
              />
              {travelHeroQuickHelpAccentOverlay ? (
                <View pointerEvents="none" style={travelHeroQuickHelpAccentOverlay} />
              ) : null}
            </View>
          </TravelGlassCard>

          <View
            style={[
              styles.heroCardsBridge,
              { marginTop: travelOpeningGrammar.heroToFlagshipGap },
              width < 768 ? { paddingBottom: TRAVEL_QUICK_HELP_OPENING_MOBILE_ROW_CLEARANCE_PX } : null,
            ]}
          >
            <TravelFlagshipCardsRow
              scenarioById={scenarioById}
              layoutMetrics={travelFlagshipLayout}
              gridGap={travelUtilityGrid.flagshipGridGap}
              openingStageFullscreen={openingStageFullscreen}
              activeQuickHelpContextId={selectedQuickHelpHeroContextId}
              hoveredQuickHelpContextId={hoveredQuickHelpHeroContextId}
              onQuickHelpContextSelect={onQuickHelpContextSelect}
              onHeroCardHover={onTravelHeroCardHover}
              onHeroCardLeave={onTravelHeroCardLeave}
              touchSelectionMode={quickHelpTouchSelectionMode}
            />
          </View>
        </View>

        <View
          style={[
            styles.utilityBridge,
            { marginTop: travelOpeningGrammar.flagshipToUtilityGap },
            desktopStageLock && !openingStageFullscreen && styles.utilityBridgeNormalWebLock,
            openingStageFullscreen && styles.utilityBridgeFullscreenLock,
          ]}
        >
          <TravelUtilityGrid
            scenarioById={scenarioById}
            layoutMetrics={travelTileLayout}
            gridGap={travelUtilityGrid.gridGap}
            utilityIds={orderedTravelUtilityIds}
            perspectiveHint={travelUtilityPerspectiveHint}
            onUtilityHover={onTravelUtilityHover}
            openingStageFullscreen={openingStageFullscreen}
          />
        </View>

        <View
          testID="travel-experience-intelligence-zone"
          accessibilityLabel="Travel Experience Intelligence Zone"
          style={[
            styles.secondaryZone,
            {
              marginTop: travelSecondaryRhythm.secondaryZoneMarginTop,
              gap: travelSecondaryRhythm.secondaryZoneGap,
              paddingBottom: travelSecondaryRhythm.secondaryZonePaddingBottom,
            },
          ]}
        >
          <TravelPilotStrip
            surfaceMetrics={travelSecondarySurface}
            marginBottom={travelSecondaryRhythm.pilotStripMarginBottom}
          />

          <View style={{ marginBottom: travelSecondaryRhythm.lensToDestinationGap }}>
            <TravelPerspectiveCardsRow
              selectedId={travelPerspectiveDirectionId}
              onSelect={onTravelPerspectiveSelect}
            />
          </View>

          {/* Destination Lens — compact cinematic intro strip */}
          <View
            testID="travel-destination-section"
            style={{ marginBottom: travelSecondaryRhythm.destinationToLocalGap }}
          >
            <TravelDestinationLensCard
              destinationQuery={destinationQuery}
              onDestinationChange={setDestinationQuery}
              loadingCtx={loadingCtx}
              gpsOptIn={gpsOptIn}
              onEnableLocation={() => setLocationGate('prompt')}
              weatherCode={weatherCode}
              weatherLine={weatherLine}
              homeCountryCode={user?.country}
              viewportWidth={width}
              twoColumn={travelSecondaryRhythm.destinationTwoColumn}
              metaInnerGap={travelSecondaryRhythm.metaInnerGap}
              metaInputMinHeight={travelSecondaryRhythm.metaInputMinHeight}
              t={t}
            />
          </View>

          {/* Local Map Concierge — cinematic focal card */}
          <View testID="travel-local-assist-section">
            <TravelLocalMapConciergeCard
              mapHeight={travelLocalConciergeMapShellHeight(
                travelSecondaryRhythm.mapShellHeight,
                width,
                openingStageFullscreen
              )}
              panelMinHeight={travelLocalConciergePanelMinHeight(width, openingStageFullscreen)}
              compact={travelSecondaryRhythm.localAssistCompact}
              mapCardInnerGap={travelSecondaryRhythm.mapCardInnerGap}
              pilotBadge={t('travelHub.tileBadge.pilot')}
              destinationQuery={destinationQuery}
              gpsOptIn={gpsOptIn}
              latitude={lat}
              longitude={lng}
              onOpenLocalGuides={() => navigation.navigate('LocalFixer')}
              openingStageFullscreen={openingStageFullscreen}
            />
          </View>

          {/* Universe Bridge — premium portal chips */}
          <View
            testID="travel-connected-section"
            style={{
              marginTop: travelSecondaryRhythm.localToConnectedGap,
              paddingBottom: width < 768 ? 32 : 0,
            }}
          >
            <Text
              style={[
                styles.connectedUniversesKicker,
                {
                  marginTop: travelSecondaryRhythm.sectionKickerMarginTop,
                  marginBottom: travelSecondaryRhythm.sectionKickerMarginBottom,
                },
              ]}
            >
              {t('travelHub.connectedUniversesKicker')}
            </Text>
            <View
              style={[
                styles.connectedStrip,
                travelSecondaryRhythm.connectedChipFullWidth && styles.connectedStripStacked,
                {
                  gap: travelSecondaryRhythm.connectedChipGap,
                  marginBottom: travelSecondaryRhythm.connectedStripMarginBottom,
                },
              ]}
            >
            <TravelConnectedLink
              testID="travel-connected-local"
              accent="emerald"
              icon="location-outline"
              title={t('travelHub.connectedLocal')}
              subtitle={t('localHub.universeKicker')}
              onPress={openLocalUniverse}
              a11yLabel={t('travelHub.connectedLocal')}
              minHeight={travelSecondarySurface.connectedMinHeight}
              fullWidth={travelSecondaryRhythm.connectedChipFullWidth}
            />
            {featureFlags.academyLiteEnabled ? (
              <TravelConnectedLink
                testID="travel-connected-academy"
                accent="violet"
                icon="school-outline"
                title={t('travelHub.connectedAcademy')}
                subtitle={t('localHub.connectedAcademySub')}
                onPress={openAcademyUniverse}
                a11yLabel={t('travelHub.connectedAcademy')}
                minHeight={travelSecondarySurface.connectedMinHeight}
                fullWidth={travelSecondaryRhythm.connectedChipFullWidth}
              />
            ) : null}
            <TravelConnectedLink
              testID="travel-connected-business"
              accent="gold"
              icon="briefcase-outline"
              title={t('travelHub.connectedBusiness')}
              subtitle={t('localHub.connectedBusinessSub')}
              onPress={openBusinessUniverse}
              a11yLabel={t('travelHub.connectedBusiness')}
              minHeight={travelSecondarySurface.connectedMinHeight}
              fullWidth={travelSecondaryRhythm.connectedChipFullWidth}
            />
            </View>
            {travelSecondaryRhythm.universeBridgeMobileClearance > 0 ? (
              <View
                testID="travel-universe-bridge-mobile-clearance"
                style={{ height: travelSecondaryRhythm.universeBridgeMobileClearance }}
              />
            ) : null}
          </View>

          {travelSecondaryRhythm.experienceZoneMobileFloatSpacer > 0 ? (
            <View
              testID="travel-experience-zone-mobile-float-spacer"
              style={{ height: travelSecondaryRhythm.experienceZoneMobileFloatSpacer }}
            />
          ) : null}

          <View testID="travel-bottom-escape-bar" style={styles.bottomEscapeSection}>
            <VionaBottomEscapeBar showBack showHome onBack={onBackPress} onHome={goHome} />
          </View>
          <View style={[styles.hubScrollTail, { height: travelSecondaryRhythm.hubScrollTailHeight }]} />
        </View>
        </View>
      </VionaMiniAppShell>

      <Modal visible={cravingsModalOpen} transparent animationType="fade" onRequestClose={() => setCravingsModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCravingsModalOpen(false)}>
          <Pressable style={styles.modalShell} onPress={(e) => e.stopPropagation()}>
            <TravelGlassCard tier="utility" contentStyle={styles.modalInner}>
              <Text style={styles.modalTitle}>{t('travelHub.cravingsModalTitle')}</Text>
              <Text style={styles.modalSub}>{t('travelHub.cravingsModalSub')}</Text>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {cravingsHits.length === 0 ? (
                  <Text style={styles.modalEmpty}>{t('travelHub.cravingsEmpty')}</Text>
                ) : (
                  cravingsHits.map((hit) => (
                    <Pressable
                      key={hit.id}
                      onPress={() => {
                        setCravingsModalOpen(false);
                        navigation.navigate('MerchantDetail', {
                          merchantId: hit.id,
                          merchantName: hit.name,
                          industry: 'Restaurant',
                        });
                      }}
                      style={({ pressed }) => [styles.cravingRow, pressed && { opacity: 0.88 }]}
                    >
                      <Text style={styles.cravingName}>{hit.name}</Text>
                      <Text style={styles.cravingMeta}>{hit.distanceKm.toFixed(1)} km</Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
              <Pressable onPress={() => setCravingsModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>{t('travelHub.modalClose')}</Text>
              </Pressable>
            </TravelGlassCard>
          </Pressable>
        </Pressable>
      </Modal>

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
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInner: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
    width: '100%',
  },
  heroCardShell: {
    width: '100%',
  },
  heroStage: {
    width: '100%',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  heroImageClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  heroCinematicImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroBottomHandoff: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
    zIndex: 1,
  },
  heroRouteArcPrimary: {
    position: 'absolute',
    top: '24%',
    left: '8%',
    width: '58%',
    height: '46%',
    zIndex: 1,
    opacity: 0.62,
  },
  heroRouteArcSecondary: {
    position: 'absolute',
    top: '12%',
    right: '6%',
    width: '44%',
    height: '52%',
    zIndex: 1,
    opacity: 0.48,
  },
  heroBrightenWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    zIndex: 1,
  },
  heroSubjectGlow: {
    position: 'absolute',
    top: '18%',
    right: 0,
    width: '48%',
    height: '62%',
    zIndex: 1,
  },
  heroTextVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 2,
  },
  heroEditorialTextScrim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 3,
  },
  /** viona.wave3b.force-editorial-text-layer — flow stack (mobile/tablet). */
  heroTextStack: {
    zIndex: 4,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  /** viona.wave3b.editorial-recompose — absolute cover overlay (desktop web). */
  heroEditorialTextLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    gap: 0,
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    color: CYAN,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(132, 238, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  kickerEditorialContrast: {
    color: '#9EE8FF',
    textShadowColor: 'rgba(2, 6, 12, 0.92)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  heroTitle: {
    fontFamily: FontFamily.extrabold,
    ...(Platform.OS === 'web' ? ({ fontWeight: '900' } as const) : null),
    color: '#FFFFFF',
    letterSpacing: Platform.OS === 'web' ? -0.48 : -0.32,
    textShadowColor: 'rgba(3, 6, 12, 0.84)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 26,
  },
  heroTitleEditorialContrast: {
    color: '#FAFCFF',
    textShadowColor: 'rgba(2, 6, 12, 0.94)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 32,
  },
  heroCompanion: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: 'rgba(248, 250, 252, 0.96)',
    lineHeight: 18,
    letterSpacing: -0.08,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroSub: {
    fontFamily: FontFamily.medium,
    color: 'rgba(236, 244, 255, 0.96)',
    textShadowColor: 'rgba(3, 6, 12, 0.58)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  heroSubEditorialContrast: {
    color: 'rgba(224, 234, 248, 0.98)',
    textShadowColor: 'rgba(2, 6, 12, 0.88)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 14,
  },
  heroTrustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.36)',
    backgroundColor: 'rgba(6, 12, 22, 0.62)',
  },
  heroTrustDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
    flexShrink: 0,
  },
  heroTrustText: {
    fontFamily: FontFamily.semibold,
    color: 'rgba(248, 252, 255, 0.96)',
    letterSpacing: 0.2,
    flexShrink: 0,
    textShadowColor: 'rgba(2, 6, 12, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroPremiumFrameEdge: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  heroHoverRim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  sectionKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(186, 214, 230, 0.78)',
    letterSpacing: 0.95,
    marginTop: 10,
    marginBottom: 8,
  },
  localAssistSectionKicker: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(182, 198, 220, 0.74)',
    marginTop: 2,
    marginBottom: 6,
  },
  destinationCardInner: {
    gap: 4,
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 1,
  },
  destinationLensCardInner: {
    gap: 3,
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  destinationSceneCardInner: {
    minHeight: 96,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  destinationSceneCardInnerDesktop: {
    minHeight: 192,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  destinationSceneCardInnerMobile: {
    minHeight: 268,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  destinationContextLightSweep: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.86,
  },
  destinationSceneLayerWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
  destinationSceneImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  destinationSceneRouteGlow: {
    position: 'absolute',
    top: '32%',
    left: '-6%',
    right: '-6%',
    height: '42%',
    transform: [{ rotate: '-5deg' }],
    opacity: 0.92,
  },
  destinationSceneSparkleTrail: {
    position: 'absolute',
    top: 12,
    right: 18,
    opacity: 0.55,
  },
  destinationSceneContent: {
    position: 'relative',
    zIndex: 2,
  },
  destinationLensDepthBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  destinationLensGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  destinationLensGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(92, 205, 255, 0.1)',
  },
  destinationLensGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(92, 205, 255, 0.07)',
  },
  destinationLensLightSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.72,
  },
  destinationLensInsetHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    borderRadius: 12,
  },
  destinationLensBottomDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    borderRadius: 12,
  },
  destinationLensSparkle: {
    position: 'absolute',
    opacity: 0.68,
  },
  destinationLensSparkleA: {
    top: 9,
    right: 16,
  },
  destinationLensSparkleB: {
    bottom: 10,
    left: '38%',
    opacity: 0.45,
  },
  destinationLensTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    borderRadius: 12,
  },
  destinationLensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  destinationLensColLeft: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 292,
    maxWidth: 320,
    minWidth: 200,
  },
  destinationLensColRight: {
    flex: 0.85,
    minWidth: 0,
    justifyContent: 'center',
  },
  destinationLensColWeather: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  destinationWeatherCinemaDesktopStack: {
    gap: 8,
  },
  destinationWeatherCinemaMobileStack: {
    gap: 8,
  },
  destinationContextDesktopStack: {
    gap: 10,
  },
  destinationContextMobileStack: {
    gap: 8,
  },
  destinationContextWeatherRowWrap: {
    gap: 7,
    zIndex: 1,
    marginBottom: 4,
  },
  destinationContextWeatherRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  destinationContextWeatherRowKicker: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: 'rgba(168, 228, 255, 0.72)',
  },
  destinationContextWeatherRowDemoNote: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 172, 198, 0.68)',
    letterSpacing: 0.2,
  },
  destinationContextWeatherRowDemoNotes: {
    alignItems: 'flex-end',
    gap: 1,
    flexShrink: 1,
  },
  destinationContextWeatherRowDaypartNote: {
    fontSize: 7.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(132, 156, 182, 0.58)',
    letterSpacing: 0.15,
    textAlign: 'right',
  },
  destinationContextWeatherRowLoading: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationContextWeatherFitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  destinationContextWeatherScrollContent: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 4,
  },
  destinationContextWeatherScrollContentWithAffordance: {
    paddingRight: 28,
  },
  destinationContextWeatherScrollShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  destinationContextWeatherScrollFadeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 26,
    zIndex: 2,
  },
  destinationContextWeatherScrollCue: {
    position: 'absolute',
    top: '50%',
    right: 5,
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.14)',
    backgroundColor: 'rgba(6, 12, 20, 0.56)',
    zIndex: 3,
  },
  weatherCinematicMiniCard: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(120, 200, 255, 0.28)',
    backgroundColor: 'rgba(8, 16, 28, 0.28)',
    position: 'relative',
  },
  weatherCinematicMiniCardToday: {
    borderColor: 'rgba(168, 240, 255, 0.48)',
    backgroundColor: 'rgba(10, 20, 34, 0.34)',
    shadowColor: 'rgba(96, 200, 255, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 4,
  },
  weatherCinematicMiniCardActive: {
    borderColor: 'rgba(168, 240, 255, 0.58)',
    shadowColor: 'rgba(96, 200, 255, 0.72)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    elevation: 5,
  },
  weatherCinematicMiniFocusRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 228, 255, 0.52)',
    zIndex: 8,
  },
  weatherCinematicMiniScene: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.56,
  },
  weatherCinematicMiniFooterVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  weatherCinematicMiniEdgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  weatherCinematicMiniIconOrb: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(6, 14, 24, 0.42)',
  },
  weatherCinematicMiniIconOrbActive: {
    borderColor: 'rgba(255, 255, 255, 0.48)',
    backgroundColor: 'rgba(8, 18, 32, 0.52)',
    shadowColor: 'rgba(148, 228, 255, 0.72)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  weatherCinematicMiniTempBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(255, 255, 255, 0.98)',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  weatherCinematicMiniTempBadgeActive: {
    color: 'rgba(255, 255, 255, 1)',
    textShadowColor: 'rgba(0, 0, 0, 0.58)',
    textShadowRadius: 5,
  },
  weatherCinematicMiniFooter: {
    position: 'absolute',
    left: 9,
    right: 9,
    bottom: 8,
    gap: 1,
  },
  weatherCinematicMiniDayLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(208, 236, 255, 0.92)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.38)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  weatherCinematicMiniDayLabelToday: {
    color: 'rgba(236, 252, 255, 0.98)',
  },
  weatherCinematicMiniConditionLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.semibold,
    color: 'rgba(255, 255, 255, 0.98)',
    lineHeight: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  weatherCinematicMiniConditionLabelActive: {
    color: 'rgba(255, 255, 255, 1)',
    textShadowRadius: 4,
  },
  weatherCinematicEffectBoostVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  weatherCinematicCloudVeilBoosted: {
    opacity: 1,
  },
  weatherCinematicRainStreakBoosted: {
    opacity: 1,
  },
  weatherCinematicWindStreakBoosted: {
    opacity: 1,
  },
  weatherCinematicSunGlowBoosted: {
    transform: [{ scale: 1.08 }],
  },
  weatherCinematicSunHaloBoosted: {
    opacity: 0.92,
  },
  weatherCinematicAiryGlowBoosted: {
    backgroundColor: 'rgba(168, 216, 244, 0.14)',
  },
  weatherCinematicGoldenLensWarmth: {
    position: 'absolute',
    top: '8%',
    left: '10%',
    width: '72%',
    height: '42%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 196, 112, 0.12)',
  },
  weatherCinematicSunRayA: {
    position: 'absolute',
    top: '10%',
    right: '16%',
    width: 2,
    height: 22,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 244, 210, 0.42)',
    transform: [{ rotate: '18deg' }],
  },
  weatherCinematicSunRayB: {
    position: 'absolute',
    top: '8%',
    right: '20%',
    width: 2,
    height: 18,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 236, 180, 0.34)',
    transform: [{ rotate: '42deg' }],
  },
  weatherCinematicSunRayC: {
    position: 'absolute',
    top: '12%',
    right: '12%',
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 228, 160, 0.28)',
    transform: [{ rotate: '-8deg' }],
  },
  weatherCinematicSunGlowCool: {
    position: 'absolute',
    top: '8%',
    right: '10%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 236, 180, 0.62)',
    shadowColor: 'rgba(255, 220, 140, 0.82)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.78,
    shadowRadius: 14,
  },
  weatherCinematicSunGlowWarm: {
    position: 'absolute',
    top: '6%',
    right: '8%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 196, 96, 0.68)',
    shadowColor: 'rgba(255, 168, 72, 0.88)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.82,
    shadowRadius: 16,
  },
  weatherCinematicWetGloss: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
  },
  weatherCinematicCloudVeilA: {
    position: 'absolute',
    top: '10%',
    left: '14%',
    width: '62%',
    height: '24%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    opacity: 0.92,
  },
  weatherCinematicCloudVeilB: {
    position: 'absolute',
    top: '26%',
    right: '6%',
    width: '46%',
    height: '18%',
    borderRadius: 999,
    backgroundColor: 'rgba(240, 246, 252, 0.26)',
    opacity: 0.88,
  },
  weatherCinematicCloudVeilC: {
    position: 'absolute',
    top: '18%',
    left: '42%',
    width: '34%',
    height: '14%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    opacity: 0.78,
  },
  weatherCinematicRainStreakA: {
    position: 'absolute',
    top: '6%',
    left: '20%',
    width: 1.5,
    height: '76%',
    backgroundColor: 'rgba(196, 228, 255, 0.58)',
    transform: [{ rotate: '12deg' }],
  },
  weatherCinematicRainStreakB: {
    position: 'absolute',
    top: '2%',
    left: '48%',
    width: 1.5,
    height: '82%',
    backgroundColor: 'rgba(196, 228, 255, 0.48)',
    transform: [{ rotate: '10deg' }],
  },
  weatherCinematicRainStreakC: {
    position: 'absolute',
    top: '8%',
    right: '18%',
    width: 1.5,
    height: '72%',
    backgroundColor: 'rgba(196, 228, 255, 0.42)',
    transform: [{ rotate: '11deg' }],
  },
  weatherCinematicRainStreakD: {
    position: 'absolute',
    top: '4%',
    left: '68%',
    width: 1,
    height: '68%',
    backgroundColor: 'rgba(196, 228, 255, 0.36)',
    transform: [{ rotate: '11deg' }],
  },
  weatherCinematicWindStreakA: {
    position: 'absolute',
    top: '34%',
    left: '8%',
    width: '66%',
    height: 1.5,
    backgroundColor: 'rgba(220, 244, 255, 0.48)',
    transform: [{ rotate: '-4deg' }],
  },
  weatherCinematicWindStreakB: {
    position: 'absolute',
    top: '50%',
    left: '14%',
    width: '52%',
    height: 1,
    backgroundColor: 'rgba(220, 244, 255, 0.36)',
    transform: [{ rotate: '-3deg' }],
  },
  weatherCinematicWindStreakC: {
    position: 'absolute',
    top: '62%',
    left: '22%',
    width: '38%',
    height: 1,
    backgroundColor: 'rgba(220, 244, 255, 0.28)',
    transform: [{ rotate: '-2deg' }],
  },
  weatherCinematicWindStreakD: {
    position: 'absolute',
    top: '42%',
    left: '28%',
    width: '44%',
    height: 1,
    backgroundColor: 'rgba(220, 244, 255, 0.32)',
    transform: [{ rotate: '-5deg' }],
  },
  weatherCinematicWindStreakE: {
    position: 'absolute',
    top: '72%',
    left: '10%',
    width: '58%',
    height: 1,
    backgroundColor: 'rgba(220, 244, 255, 0.22)',
    transform: [{ rotate: '-3deg' }],
  },
  weatherCinematicWindStreakF: {
    position: 'absolute',
    top: '24%',
    left: '18%',
    width: '48%',
    height: 1,
    backgroundColor: 'rgba(220, 244, 255, 0.2)',
    transform: [{ rotate: '-6deg' }],
  },
  weatherCinematicAiryGlow: {
    position: 'absolute',
    top: '28%',
    left: '8%',
    width: '72%',
    height: '38%',
    borderRadius: 999,
    backgroundColor: 'rgba(168, 216, 244, 0.12)',
  },
  weatherCinematicSunRadialHaloCool: {
    position: 'absolute',
    top: '2%',
    right: '4%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 236, 180, 0.18)',
    opacity: 0.72,
  },
  weatherCinematicSunRadialHaloWarm: {
    position: 'absolute',
    top: '0%',
    right: '2%',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 196, 96, 0.22)',
    opacity: 0.78,
  },
  weatherCinematicLightSweep: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.82,
  },
  weatherCinematicAtmospherePale: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(228, 240, 252, 0.1)',
  },
  weatherCinematicCloudVeilD: {
    position: 'absolute',
    top: '34%',
    left: '8%',
    width: '52%',
    height: '16%',
    borderRadius: 999,
    backgroundColor: 'rgba(240, 246, 252, 0.16)',
    opacity: 0.76,
  },
  weatherCinematicOvercastVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(132, 152, 172, 0.1)',
  },
  weatherCinematicRainMist: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: 'rgba(168, 204, 232, 0.12)',
  },
  weatherCinematicGlassSheen: {
    position: 'absolute',
    top: '12%',
    left: '-8%',
    right: '-8%',
    height: '48%',
    transform: [{ rotate: '-8deg' }],
    opacity: 0.72,
  },
  weatherCinematicRainShimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
    backgroundColor: 'rgba(196, 228, 255, 0.1)',
  },
  weatherCinematicRainStreakE: {
    position: 'absolute',
    top: '10%',
    left: '36%',
    width: 1,
    height: '64%',
    backgroundColor: 'rgba(196, 228, 255, 0.22)',
    transform: [{ rotate: '11deg' }],
  },
  weatherCinematicRainStreakF: {
    position: 'absolute',
    top: '0%',
    left: '82%',
    width: 1,
    height: '58%',
    backgroundColor: 'rgba(196, 228, 255, 0.28)',
    transform: [{ rotate: '10deg' }],
  },
  weatherCinematicRainStreakG: {
    position: 'absolute',
    top: '4%',
    left: '58%',
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(196, 228, 255, 0.32)',
    transform: [{ rotate: '11deg' }],
  },
  weatherCinematicNightSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    backgroundColor: 'rgba(16, 32, 60, 0.16)',
  },
  weatherCinematicMoonGlow: {
    position: 'absolute',
    top: '10%',
    right: '14%',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(220, 232, 248, 0.42)',
    shadowColor: 'rgba(196, 216, 240, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  weatherCinematicStarHintA: {
    position: 'absolute',
    top: '18%',
    left: '22%',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(228, 240, 255, 0.72)',
  },
  weatherCinematicStarHintB: {
    position: 'absolute',
    top: '28%',
    left: '58%',
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(228, 240, 255, 0.56)',
  },
  weatherCinematicTerminalGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  weatherCinematicMiniGlassRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '22%',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  weatherDaypartMorningHaze: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(228, 244, 255, 0.08)',
  },
  weatherDaypartMorningFreshness: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  weatherDaypartGoldenHorizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
  },
  weatherDaypartNightSkyWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '54%',
    backgroundColor: 'rgba(12, 24, 48, 0.14)',
  },
  weatherDaypartMoonHint: {
    position: 'absolute',
    top: '12%',
    right: '16%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(216, 228, 244, 0.38)',
    shadowColor: 'rgba(196, 216, 240, 0.45)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  weatherDaypartStarHint: {
    position: 'absolute',
    top: '22%',
    left: '24%',
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(228, 240, 255, 0.62)',
  },
  weatherDaypartCityGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  fxPremiumGlassStripWrap: {
    position: 'relative',
    overflow: 'hidden',
    gap: 5,
    zIndex: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.11)',
    backgroundColor: 'rgba(6, 12, 20, 0.3)',
  },
  fxPremiumGlassStripVeil: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  fxPremiumGlassStripSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    opacity: 0.62,
  },
  fxPremiumGlassStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 1,
    opacity: 0.92,
  },
  fxPremiumGlassStripKicker: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: 'rgba(148, 198, 228, 0.72)',
  },
  fxPremiumGlassStripDemoLabel: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 180, 140, 0.66)',
    letterSpacing: 0.2,
  },
  fxReferenceGlassGridShell: {
    position: 'relative',
    zIndex: 1,
  },
  fxReferenceGlassGridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  fxReferenceGlassGridTabletWrap: {},
  fxReferenceGlassGridMobile: {},
  fxPremiumGlassStripSafetyNote: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 172, 198, 0.66)',
    lineHeight: 12,
    zIndex: 1,
  },
  fxReferenceGlassCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    shadowColor: 'rgba(8, 18, 32, 0.72)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  fxReferenceGlassCardStretch: {
    flex: 1,
    minWidth: 0,
  },
  fxReferenceGlassCardSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    opacity: 0.85,
  },
  fxReferenceGlassCardIconCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(4, 10, 18, 0.34)',
    flexShrink: 0,
    zIndex: 1,
  },
  fxReferenceGlassCardTextCol: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
  },
  fxReferenceGlassCardPair: {
    width: '100%',
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.34,
    textTransform: 'uppercase',
    color: 'rgba(148, 198, 228, 0.68)',
  },
  fxReferenceGlassCardValue: {
    width: '100%',
    fontFamily: FontFamily.semibold,
    color: 'rgba(230, 242, 255, 0.92)',
  },
  destinationContextFxRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  destinationContextFxRowKicker: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    color: 'rgba(168, 228, 255, 0.68)',
  },
  destinationContextFxRowDemoNote: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 172, 198, 0.62)',
    letterSpacing: 0.2,
  },
  destinationContextFxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  destinationContextFxScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  destinationContextFxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.14)',
    backgroundColor: 'rgba(8, 14, 24, 0.58)',
    maxWidth: 280,
  },
  destinationContextFxChipText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(210, 228, 246, 0.92)',
    lineHeight: 13,
    flexShrink: 1,
  },
  destinationFxReferenceStripWrap: {
    gap: 5,
    zIndex: 1,
    paddingTop: 2,
  },
  destinationFxReferenceStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  destinationFxReferenceStripKicker: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    color: 'rgba(168, 228, 255, 0.68)',
  },
  destinationFxReferenceStripDemoNote: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 172, 198, 0.62)',
    letterSpacing: 0.2,
  },
  destinationFxReferenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  destinationFxReferenceScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  destinationFxReferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.14)',
    backgroundColor: 'rgba(8, 14, 24, 0.58)',
    maxWidth: 280,
  },
  destinationFxReferenceChipText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(210, 228, 246, 0.92)',
    lineHeight: 13,
    flexShrink: 1,
  },
  destinationLensCopy: {
    gap: 3,
    zIndex: 1,
    maxWidth: '100%',
  },
  destinationLensTitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(252, 254, 255, 0.98)',
    letterSpacing: -0.18,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  destinationLensPromptLine: {
    minHeight: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(220, 236, 252, 0.72)',
    backgroundColor: 'transparent',
  },
  destinationLensSubtitle: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 214, 232, 0.86)',
    lineHeight: 15,
  },
  destinationLensCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.16)',
    backgroundColor: 'rgba(8, 16, 26, 0.52)',
  },
  destinationLensCtaText: {
    fontSize: 10.5,
    fontFamily: FontFamily.semibold,
    color: 'rgba(148, 228, 255, 0.92)',
    letterSpacing: 0.05,
  },
  destinationCapsuleInset: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.16)',
    backgroundColor: 'rgba(4, 10, 18, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  destinationCapsuleInsetSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderRadius: 11,
  },
  destinationCinematicCluster: {
    gap: 6,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  destinationCinematicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.14)',
    backgroundColor: 'rgba(8, 14, 24, 0.68)',
    maxWidth: '100%',
  },
  destinationCinematicPillText: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(210, 228, 246, 0.94)',
    lineHeight: 13,
    flexShrink: 1,
  },
  destinationCinematicDemoNote: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(148, 172, 198, 0.62)',
    letterSpacing: 0.25,
    textAlign: 'right',
  },
  destinationMobileCinematicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  destinationCinematicDemoNoteMobile: {
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(168, 190, 214, 0.68)',
    width: '100%',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  destinationColLeft: {
    flex: 1.12,
    minWidth: 0,
    gap: 4,
  },
  destinationColRight: {
    flex: 0.88,
    minWidth: 0,
    justifyContent: 'center',
    gap: 6,
  },
  destinationPreviewStack: {
    gap: 6,
  },
  destinationPreviewLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  destinationPreviewChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.22)',
    backgroundColor: 'rgba(16, 28, 44, 0.62)',
  },
  destinationPreviewChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.24)',
    backgroundColor: 'rgba(92, 205, 255, 0.08)',
  },
  destinationPreviewChipText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 214, 234, 0.92)',
    lineHeight: 14,
  },
  destinationTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    borderRadius: 12,
  },
  destinationKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    color: 'rgba(140, 200, 220, 0.78)',
  },
  destinationInput: {
    minHeight: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.2)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: INK,
    backgroundColor: 'rgba(18, 30, 46, 0.52)',
  },
  destinationHelper: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 15,
    opacity: 0.92,
  },
  destinationDemoLine: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: 'rgba(186, 210, 232, 0.9)',
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  destinationMobilePreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  destinationMiniPill: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '46%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.2)',
    backgroundColor: 'rgba(14, 24, 38, 0.58)',
  },
  destinationMiniPillText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 214, 234, 0.9)',
    lineHeight: 13,
  },
  localAssistCardInner: {
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  localConciergeCardInner: {
    gap: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  localConciergeCardInnerCompact: {
    gap: 0,
    paddingVertical: 1,
  },
  localConciergeCardInnerDesktop: {
    paddingVertical: 4,
  },
  localConciergeGlassShell: {
    borderColor: 'rgba(98, 255, 228, 0.12)',
    backgroundColor: 'rgba(4, 10, 18, 0.28)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 0 1px 0 rgba(168, 255, 244, 0.08), 0 8px 28px rgba(0, 0, 0, 0.18)',
        } as ViewStyle)
      : null),
  },
  localConciergeSection: {
    zIndex: 1,
    marginBottom: 10,
  },
  localConciergeSectionPrimary: {
    zIndex: 2,
    marginBottom: 10,
  },
  localConciergeSectionScene: {
    zIndex: 1,
    marginBottom: 6,
  },
  localConciergeSectionTertiary: {
    zIndex: 1,
    marginBottom: 12,
    opacity: 0.94,
  },
  localConciergeSectionActions: {
    zIndex: 1,
    marginBottom: 8,
  },
  localConciergeTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    borderRadius: 14,
  },
  localConciergeHeaderScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    borderRadius: 14,
    zIndex: 0,
  },
  localAssistCardInnerCompact: {
    gap: 5,
    paddingVertical: 1,
  },
  localAssistReadabilityVeil: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  localAssistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 1,
  },
  localConciergeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 1,
  },
  localConciergeHeaderLead: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  localConciergeIconCapsule: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.18)',
    backgroundColor: 'rgba(92, 205, 255, 0.05)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  localConciergeHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  localConciergeKicker: {
    fontSize: 8.5,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
    color: 'rgba(132, 210, 232, 0.68)',
  },
  localConciergeTitle: {
    fontSize: 17.5,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(248, 252, 255, 0.98)',
    letterSpacing: -0.16,
    lineHeight: 22,
    textShadowColor: 'rgba(2, 6, 12, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  localConciergeSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(214, 228, 244, 0.9)',
    lineHeight: 16,
    marginTop: 1,
    textShadowColor: 'rgba(2, 6, 12, 0.58)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  localConciergePilotBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.14)',
    backgroundColor: 'rgba(6, 12, 20, 0.72)',
    flexShrink: 0,
  },
  localConciergePilotBadgeText: {
    fontSize: 7.5,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    color: 'rgba(168, 220, 238, 0.82)',
  },
  localConciergeSafetyNote: {
    opacity: 0.86,
    letterSpacing: 0.04,
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: 'rgba(152, 176, 200, 0.9)',
  },
  localConciergeSafetyNoteDesktop: {
    fontSize: 13.5,
    lineHeight: 18,
    opacity: 0.94,
    color: 'rgba(164, 188, 212, 0.96)',
  },
  localConciergeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 1,
    marginTop: 2,
  },
  localConciergeCtaText: {
    fontSize: 13.5,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(232, 244, 255, 0.96)',
    letterSpacing: -0.08,
  },
  localConciergePortalAffordance: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.18)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  localDiscoverySearchAction: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.34)',
    backgroundColor: 'rgba(6, 12, 20, 0.52)',
    zIndex: 1,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 0 1px 0 rgba(168, 240, 255, 0.12), 0 4px 16px rgba(0, 0, 0, 0.14)',
        } as ViewStyle)
      : null),
  },
  localDiscoverySearchActionCompact: {
    paddingVertical: 9,
    gap: 8,
  },
  localDiscoverySearchIconCapsule: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.22)',
    backgroundColor: 'rgba(4, 10, 18, 0.38)',
    flexShrink: 0,
  },
  localDiscoverySearchIconCapsuleCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  localDiscoverySearchIconCapsuleDesktop: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderColor: 'rgba(92, 205, 255, 0.32)',
    backgroundColor: 'rgba(4, 10, 18, 0.52)',
  },
  localDiscoverySearchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  localDiscoverySearchTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(236, 248, 255, 0.98)',
    letterSpacing: -0.06,
    textShadowColor: 'rgba(2, 6, 12, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  localDiscoverySearchNote: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 220, 240, 0.9)',
    lineHeight: 14,
    textShadowColor: 'rgba(2, 6, 12, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  localDiscoverySearchTitleDesktop: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.08,
  },
  localDiscoverySearchNoteDesktop: {
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(204, 226, 244, 0.94)',
    textShadowColor: 'rgba(2, 6, 12, 0.55)',
    textShadowRadius: 5,
  },
  localDiscoveryCategoryDockScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '26%',
    zIndex: 2,
  },
  localDiscoveryCategoryBottomDock: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    zIndex: 3,
    maxHeight: '28%',
  },
  localDiscoveryCategoryBottomDockCompact: {
    left: 6,
    right: 6,
    bottom: 6,
    maxHeight: '30%',
  },
  localDiscoveryCategoryDockInner: {
    position: 'relative',
    overflow: 'hidden',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.16)',
  },
  localDiscoveryCategoryOverlayKicker: {
    fontSize: 8,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    color: 'rgba(188, 220, 240, 0.82)',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(2, 6, 12, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  localDiscoveryCategoryScrollContent: {
    gap: 5,
    paddingHorizontal: 2,
  },
  localDiscoveryCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 138,
  },
  localDiscoveryCategoryIconCapsule: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(4, 10, 18, 0.42)',
    flexShrink: 0,
  },
  localDiscoveryCategoryLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.semibold,
    color: 'rgba(220, 236, 252, 0.94)',
    flexShrink: 1,
    textShadowColor: 'rgba(2, 6, 12, 0.48)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  localDiscoveryCategoryLabelDesktop: {
    fontSize: 14,
    textShadowColor: 'rgba(2, 6, 12, 0.58)',
    textShadowRadius: 4,
  },
  localDiscoveryPreviewWrap: {
    gap: 4,
    zIndex: 1,
    opacity: 0.9,
  },
  localDiscoveryPreviewWrapDesktop: {
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.08)',
    backgroundColor: 'rgba(4, 10, 18, 0.32)',
    opacity: 1,
  },
  localDiscoveryPreviewRowScrim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
  },
  localDiscoveryPreviewKicker: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(156, 188, 216, 0.78)',
    marginBottom: 2,
  },
  localDiscoveryPreviewKickerDesktop: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.55,
    color: 'rgba(172, 206, 232, 0.9)',
    marginBottom: 4,
  },
  localDiscoveryPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  localDiscoveryPreviewScroll: {
    gap: 7,
    paddingRight: 4,
  },
  localDiscoveryPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 128,
    maxWidth: 196,
  },
  localDiscoveryPreviewItemCompact: {
    minWidth: 128,
    paddingVertical: 6,
  },
  localDiscoveryPreviewItemDesktop: {
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: 10,
  },
  localDiscoveryPreviewLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 218, 240, 0.92)',
  },
  localDiscoveryPreviewLabelDesktop: {
    fontSize: 14.5,
    fontFamily: FontFamily.semibold,
    color: 'rgba(208, 228, 248, 0.96)',
    textShadowColor: 'rgba(2, 6, 12, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  localDiscoveryHandoffStack: {
    gap: 8,
    zIndex: 1,
  },
  localDiscoveryHandoffPrimaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  localDiscoveryHandoffPrimary: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.36)',
    backgroundColor: 'rgba(6, 12, 20, 0.58)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: 'inset 0 1px 0 rgba(168, 240, 255, 0.1), 0 2px 10px rgba(0, 0, 0, 0.12)',
        } as ViewStyle)
      : null),
  },
  localDiscoveryHandoffPrimaryCompact: {
    minHeight: 32,
    paddingVertical: 6,
  },
  localDiscoveryHandoffPrimaryLabel: {
    fontSize: 12.5,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(232, 248, 255, 0.98)',
    letterSpacing: -0.04,
  },
  localDiscoveryHandoffPrimaryLabelDesktop: {
    fontSize: 17.5,
    letterSpacing: -0.06,
    lineHeight: 22,
  },
  localDiscoveryHandoffSecondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  localDiscoveryHandoffSecondaryRowCompact: {
    flexWrap: 'nowrap',
  },
  localDiscoveryHandoffSecondaryScroll: {
    gap: 6,
    paddingRight: 4,
  },
  localDiscoveryHandoffSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.2)',
    backgroundColor: 'rgba(8, 14, 24, 0.42)',
  },
  localDiscoveryHandoffSecondaryDesktop: {
    borderColor: 'rgba(92, 205, 255, 0.26)',
    backgroundColor: 'rgba(8, 14, 24, 0.5)',
  },
  localDiscoveryHandoffSecondaryLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: 'rgba(178, 206, 232, 0.82)',
  },
  localDiscoveryHandoffSecondaryLabelDesktop: {
    fontSize: 12,
    color: 'rgba(196, 222, 244, 0.92)',
  },
  localDiscoveryHandoffStretch: {
    flex: 1,
    minWidth: 0,
  },
  localAssistHeaderLead: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  localAssistIconCapsule: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.22)',
    backgroundColor: 'rgba(98, 255, 228, 0.06)',
    flexShrink: 0,
  },
  localAssistHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  localAssistHeaderSub: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 212, 230, 0.88)',
    lineHeight: 14,
  },
  localAssistHeaderSubCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  localAssistFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    zIndex: 1,
  },
  localAssistChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.22)',
    backgroundColor: 'rgba(98, 255, 228, 0.06)',
    flexShrink: 0,
  },
  pilotStripCard: {
    width: '100%',
    marginTop: 2,
  },
  pilotStripInner: {
    justifyContent: 'flex-start',
  },
  pilotStripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pilotStripIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TRAVEL_PILOT_CYAN.stroke,
    backgroundColor: TRAVEL_PILOT_CYAN.statusFill,
  },
  pilotStripTitle: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: TRAVEL_PILOT_CYAN.ink,
    letterSpacing: 0.65,
  },
  pilotStripBanner: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
    opacity: 0.96,
  },
  pilotPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pilotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  pilotPillText: {
    flexShrink: 1,
    fontSize: 8.5,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.42,
    textTransform: 'uppercase',
  },
  localHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  localSupportTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.12,
    lineHeight: 20,
  },
  localSupportTitleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  localHelpChip: {
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(168, 230, 210, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.24)',
    backgroundColor: 'rgba(8, 16, 24, 0.72)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  localSupportInnerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(98, 255, 228, 0.32)',
    backgroundColor: 'rgba(10, 20, 32, 0.72)',
  },
  localSupportInnerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(98, 255, 228, 0.36)',
    backgroundColor: 'rgba(98, 255, 228, 0.08)',
  },
  localSupportInnerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  localSupportInnerTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK,
    lineHeight: 17,
  },
  localSupportInnerLine: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 14,
  },
  localSupportSafetyNote: {
    fontSize: 9.5,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 13,
    opacity: 0.92,
  },
  localSupportSafetyNoteCompact: {
    fontSize: 9,
    lineHeight: 12,
  },
  scenariosSectionKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(168, 186, 208, 0.68)',
    letterSpacing: 1.05,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 10,
  },
  secondaryZone: {
    marginTop: theme.spacing.md,
    gap: 8,
    opacity: 0.98,
  },
  openingStage: {
    width: '100%',
    minWidth: 0,
    borderRadius: 18,
    overflow: 'visible',
  },
  heroCardsBridge: {
    width: '100%',
    minWidth: 0,
  },
  utilityBridge: {
    width: '100%',
    minWidth: 0,
  },
  utilityBridgeNormalWebLock: {
    marginTop: TRAVEL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_PX,
  },
  utilityBridgeFullscreenLock: {
    marginTop: TRAVEL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_PX,
  },
  flagshipRowWrap: {
    width: '100%',
    paddingBottom: 0,
    overflow: 'visible',
  },
  flagshipRowKicker: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.5,
    lineHeight: 14,
    textTransform: 'uppercase',
    color: 'rgba(168, 214, 232, 0.88)',
  },
  flagshipGrid: {
    width: '100%',
  },
  flagshipCarousel: {
    paddingRight: 8,
  },
  flagshipCell: {
    minWidth: 0,
    flexGrow: 1,
    flexBasis: '48%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  flagshipCellQuarter: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '25%',
  },
  flagshipCellQuarterFullscreen: {
    alignSelf: 'stretch',
    minHeight: TRAVEL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX,
  },
  quickHelpFlagshipCellBody: {
    position: 'relative',
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  quickHelpFlagshipCellPressableActive: Platform.OS === 'web'
    ? ({
        transform: [{ translateY: -2 }, { scale: 1.006 }],
        transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease-out',
      } as ViewStyle)
    : {
        transform: [{ translateY: -2 }, { scale: 1.006 }],
      },
  quickHelpFlagshipCellPressed: {
    opacity: 0.94,
  },
  quickHelpFlagshipTileRoot: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    position: 'relative',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  quickHelpFlagshipTileStretch: {
    alignSelf: 'stretch',
  },
  quickHelpFlagshipTileArtworkClip: {
    ...StyleSheet.absoluteFillObject,
  },
  quickHelpFlagshipTileArtworkImage: {
    ...StyleSheet.absoluteFillObject,
  },
  quickHelpFlagshipTileAccentScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '58%',
    zIndex: 1,
  },
  quickHelpFlagshipTileTextScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '62%',
    maxWidth: 292,
    zIndex: 2,
  },
  quickHelpFlagshipTileHoverBrighten: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 3,
  },
  quickHelpFlagshipTileStack: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'flex-start',
    zIndex: 4,
  },
  quickHelpFlagshipTileHeader: {
    gap: 8,
  },
  quickHelpFlagshipTileContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  quickHelpFlagshipTileContentRowBadge: {
    paddingRight: 52,
  },
  quickHelpFlagshipTileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  quickHelpFlagshipTileTitle: {
    color: '#f4f8fc',
    fontFamily: FontFamily.bold,
    fontSize: 15,
    lineHeight: 18,
  },
  quickHelpFlagshipTileSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  quickHelpFlagshipTileStatus: {
    alignSelf: 'flex-start',
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0,
    overflow: 'hidden',
  },
  quickHelpFlagshipSemanticVeilHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  quickHelpFlagshipSelectedTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 1,
  },
  quickHelpFlagshipBottomCornerWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '26%',
    zIndex: 0,
  },
  quickHelpFlagshipLeftEdgeLight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '10%',
  },
  quickHelpFlagshipRightEdgeLight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '12%',
  },
  flagshipCellFull: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
  utilityWrap: {
    width: '100%',
  },
  situationSectionShell: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: TRAVEL_SITUATION_SECTION_BORDER_RADIUS_PX,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.16)',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  situationSectionContent: {
    position: 'relative',
    zIndex: 4,
    width: '100%',
  },
  situationSectionReadabilityVeil: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  utilityPrompt: {
    fontFamily: FontFamily.semibold,
    fontSize: 9.5,
    letterSpacing: 0.95,
    textTransform: 'uppercase',
    color: 'rgba(168, 228, 255, 0.82)',
    marginBottom: 0,
    lineHeight: 12,
  },
  utilityPerspectiveHint: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    color: INK_SUB,
    opacity: 0.92,
    marginTop: -2,
  },
  situationGlassGrid: {
    width: '100%',
    gap: TRAVEL_SITUATION_GRID_ROW_GAP_DESKTOP_PX,
    zIndex: 5,
  },
  situationGlassGridStage: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 2,
    backgroundColor: 'transparent',
  },
  situationPremiumNetworkBgHost: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  situationPremiumNetworkBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  situationLightNetworkHost: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 3,
  },
  situationLightNetworkRadial: {
    position: 'absolute',
    left: '18%',
    top: '8%',
    width: '64%',
    height: '84%',
    borderRadius: 999,
    opacity: 0.9,
  },
  situationLightNetworkLine: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(132, 228, 255, 0.14)',
  },
  situationLightNetworkLineA: {
    left: '-8%',
    top: '34%',
    width: '72%',
    transform: [{ rotate: '-11deg' }],
    opacity: 0.55,
  },
  situationLightNetworkLineB: {
    left: '22%',
    top: '62%',
    width: '68%',
    transform: [{ rotate: '8deg' }],
    opacity: 0.42,
  },
  situationLightNetworkLineC: {
    left: '8%',
    top: '18%',
    width: '58%',
    transform: [{ rotate: '-24deg' }],
    opacity: 0.32,
  },
  situationLightNetworkArc: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.18)',
  },
  situationLightNetworkArcPrimary: {
    top: '12%',
    left: '8%',
    width: '52%',
    height: '58%',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderRadius: 48,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.48,
  },
  situationLightNetworkArcSecondary: {
    bottom: '6%',
    right: '4%',
    width: '46%',
    height: '52%',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRadius: 42,
    transform: [{ rotate: '6deg' }],
    opacity: 0.36,
  },
  situationLightNetworkNode: {
    position: 'absolute',
    marginLeft: -1,
    marginTop: -1,
  },
  situationGlassGridEdgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.15)',
    zIndex: 4,
  },
  situationGlassGridInnerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    borderRadius: 10,
    zIndex: 4,
  },
  situationGlassGridRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  situationGlassCard: {
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 0,
    borderRadius: 12,
    borderWidth: 1.35,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    shadowColor: 'rgba(8, 18, 32, 0.72)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    justifyContent: 'center',
    zIndex: 2,
  },
  situationGlassCardStretch: {
    flex: 1,
    minWidth: 0,
  },
  situationGlassCardActive: {
    borderColor: 'rgba(132, 238, 255, 0.38)',
  },
  situationGlassCardFxSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.74,
  },
  situationGlassCardInnerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.68,
  },
  situationGlassCardAccentTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    opacity: 0.76,
  },
  situationGlassCardInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    minHeight: 0,
    paddingVertical: 1,
  },
  situationGlassCardIconStack: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  situationGlassCardIconCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    backgroundColor: 'rgba(4, 10, 18, 0.18)',
    zIndex: 1,
    overflow: 'hidden',
  },
  situationGlassCardIconSecondaryRing: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(6, 12, 20, 0.72)',
  },
  situationGlassCardTitleInline: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: 'rgba(244, 251, 255, 1)',
    lineHeight: 12,
  },
  utilityGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  utilityGridCell: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  utilityCell2: { flexBasis: '46%' },
  utilityCell3: { flexBasis: '30%' },
  utilityCell4: { flexBasis: '22%' },
  utilityCell8: { flexBasis: '11%' },
  utilityGridCellGhost: {
    opacity: 0,
  },
  perspectiveRowWrap: {
    width: '100%',
    gap: 8,
    opacity: 0.96,
  },
  perspectiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 44,
    paddingVertical: 4,
  },
  perspectiveHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  perspectiveSectionKicker: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: 'rgba(140, 200, 220, 0.72)',
    letterSpacing: 1.6,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  perspectiveSectionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.2,
  },
  perspectiveSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 17,
  },
  perspectiveCollapsedHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
  },
  perspectiveContextHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
  },
  perspectiveLiteNotice: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
    marginBottom: 4,
  },
  perspectiveGrid: {
    width: '100%',
    marginTop: 6,
  },
  perspectiveCell: {
    minWidth: 0,
    flexGrow: 1,
    flexBasis: '48%',
    maxWidth: '100%',
  },
  perspectiveCellThird: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '33.333%',
  },
  perspectiveCellHalf: {
    flexBasis: '48%',
    maxWidth: '48%',
  },
  perspectiveCellFull: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
  perspectiveSelectedLine: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: INK_MUTED,
  },
  perspectiveOverviewLine: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
    opacity: 0.92,
  },
  mapCardInner: { gap: 8 },
  mapHelpSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: 'rgba(214, 228, 244, 0.92)',
    lineHeight: 16,
  },
  mapHelpSubCompact: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  mapShell: {
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.14)',
  },
  conciergeSceneShell: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.1)',
    position: 'relative',
  },
  conciergeSceneImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  conciergeSceneTopGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  conciergeSceneBottomDepth: {
    ...StyleSheet.absoluteFillObject,
  },
  conciergeSceneOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conciergeSceneOverlayLayerSubtle: {
    opacity: 0.72,
  },
  conciergeSceneRouteArc: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '56%',
    height: '44%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.14)',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderRadius: 52,
    transform: [{ rotate: '-14deg' }],
    opacity: 0.42,
  },
  conciergeSceneRouteArcCompact: {
    top: '28%',
    left: '20%',
    width: '54%',
    height: '42%',
  },
  conciergeScenePulseOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.1)',
    backgroundColor: 'rgba(98, 255, 228, 0.03)',
    opacity: 0.58,
  },
  conciergeScenePulseOuterCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  conciergeScenePulseMid: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.12)',
    backgroundColor: 'rgba(132, 238, 255, 0.03)',
  },
  conciergeScenePulseMidCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  conciergeScenePulseInner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(196, 255, 240, 0.22)',
    backgroundColor: 'rgba(98, 255, 228, 0.06)',
  },
  conciergeScenePulseInnerCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  conciergeScenePinHalo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(132, 238, 255, 0.1)',
  },
  conciergeScenePinCore: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  conciergeSceneNode: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(132, 238, 255, 0.28)',
  },
  conciergeSceneNodeEmerald: {
    backgroundColor: 'rgba(98, 255, 228, 0.34)',
  },
  conciergeSceneHintVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
  },
  conciergeSceneHint: {
    position: 'absolute',
    bottom: 10,
    left: 14,
    right: 14,
    fontSize: 8.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(168, 192, 214, 0.74)',
    lineHeight: 12,
    textAlign: 'center',
    letterSpacing: 0.12,
  },
  conciergeSceneHintCompact: {
    bottom: 8,
    left: 10,
    right: 10,
    fontSize: 8,
    lineHeight: 11,
  },
  mapConciergeShell: {
    borderColor: 'rgba(92, 205, 255, 0.1)',
    borderRadius: 14,
  },
  mapConciergeTopGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  mapConciergeBottomDepth: {
    ...StyleSheet.absoluteFillObject,
  },
  mapConciergeVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  mapConciergeSceneInset: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    bottom: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.08)',
  },
  mapConciergeHintVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  mapGridLinesSoft: {
    opacity: 0.16,
  },
  mapGridLineSoft: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  mapHeroRouteArc: {
    position: 'absolute',
    top: '28%',
    left: '22%',
    width: '52%',
    height: '42%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.14)',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderRadius: 48,
    transform: [{ rotate: '-18deg' }],
  },
  mapHeroRouteArcCompact: {
    top: '30%',
    left: '24%',
    width: '48%',
    height: '38%',
  },
  mapConciergeNode: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: 'rgba(132, 238, 255, 0.28)',
  },
  mapConciergeNodeEmerald: {
    backgroundColor: 'rgba(98, 255, 228, 0.32)',
  },
  mapConciergePinGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginTop: -6,
    marginLeft: -6,
    borderRadius: 14,
    backgroundColor: 'rgba(132, 238, 255, 0.14)',
  },
  mapConciergePinGlowHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginTop: -14,
    marginLeft: -14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.1)',
    backgroundColor: 'rgba(98, 255, 228, 0.03)',
  },
  mapPulseRingInner: {
    position: 'absolute',
    top: '34%',
    left: '45%',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.18)',
    backgroundColor: 'rgba(132, 238, 255, 0.04)',
  },
  mapPulseRingInnerCompact: {
    top: '38%',
    left: '46%',
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  mapVisualHintConcierge: {
    bottom: 8,
    top: undefined,
    left: 12,
    right: 12,
    fontSize: 8.5,
    color: 'rgba(168, 192, 214, 0.72)',
    textAlign: 'center',
  },
  mapTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
  },
  mapGridLines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  mapGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  mapGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  mapRouteLine: {
    position: 'absolute',
    top: '48%',
    left: '18%',
    width: '58%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(98, 255, 228, 0.14)',
    transform: [{ rotate: '-4deg' }],
  },
  mapRouteLineCompact: {
    top: '50%',
    left: '20%',
    width: '52%',
  },
  mapRouteCurve: {
    position: 'absolute',
    top: '32%',
    left: '24%',
    width: '48%',
    height: '34%',
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.12)',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderRadius: 40,
    transform: [{ rotate: '-12deg' }],
    opacity: 0.7,
  },
  mapContextDots: {
    ...StyleSheet.absoluteFillObject,
  },
  mapContextDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(132, 238, 255, 0.32)',
  },
  mapPulseRingOuter: {
    position: 'absolute',
    top: '28%',
    left: '40%',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.12)',
    backgroundColor: 'rgba(98, 255, 228, 0.02)',
  },
  mapPulseRingOuterCompact: {
    top: '30%',
    left: '42%',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  mapPulseRing: {
    position: 'absolute',
    top: '30%',
    left: '42%',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.24)',
    backgroundColor: 'rgba(98, 255, 228, 0.05)',
  },
  mapPulseRingCompact: {
    top: '34%',
    left: '44%',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  mapPin: {
    position: 'absolute',
    marginTop: -2,
    marginLeft: -1,
    zIndex: 2,
  },
  mapVisualHint: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    color: 'rgba(186, 210, 228, 0.88)',
    lineHeight: 12,
    letterSpacing: 0.15,
  },
  mapVisualHintCompact: {
    top: 6,
    left: 8,
    right: 8,
    fontSize: 8.5,
    lineHeight: 11,
  },
  mapCoordsHint: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    fontSize: 9,
    fontFamily: FontFamily.medium,
    color: 'rgba(186, 198, 214, 0.72)',
    lineHeight: 12,
  },
  mapCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mapCtaText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: INK,
  },
  mapCtaArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.32)',
    backgroundColor: 'rgba(98, 255, 228, 0.08)',
  },
  rowCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: INK,
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 15,
  },
  metaInner: { gap: 8, position: 'relative', overflow: 'hidden' },
  metaInnerBright: {
    paddingTop: 2,
  },
  metaSurfaceWash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(210, 228, 246, 0.92)',
    letterSpacing: 0.4,
  },
  metaInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.28)',
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: INK,
    backgroundColor: 'rgba(14, 24, 40, 0.72)',
  },
  metaHelper: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 16,
  },
  metaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLoadingText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
  },
  metaText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 214, 234, 0.92)',
    lineHeight: 18,
  },
  enableLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.24)',
    alignSelf: 'flex-start',
  },
  enableLocationText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: CYAN,
  },
  connectedUniversesKicker: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(182, 198, 220, 0.74)',
  },
  connectedStrip: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connectedStripStacked: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  bottomEscapeSection: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(92, 205, 255, 0.14)',
  },
  hubScrollTail: {
    width: '100%',
    height: 16,
  },
  hubScrollTailMobile: {
    height: 28,
  },
  connectedLink: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '31%',
    minWidth: 0,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(6, 12, 22, 0.88)',
    shadowColor: 'rgba(0, 0, 0, 0.45)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  universeBridgePortal: {
    overflow: 'hidden',
  },
  universeBridgeInnerSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  connectedLinkFullWidth: {
    flexBasis: '100%',
    width: '100%',
    flexGrow: 0,
  },
  connectedIconCapsule: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  connectedIconCapsuleSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
  },
  connectedLinkActive: {
    borderColor: 'rgba(212, 226, 246, 0.82)',
    backgroundColor: 'rgba(42, 58, 84, 0.86)',
    shadowColor: 'rgba(150, 180, 220, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectedChevronWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    opacity: 0.88,
  },
  connectedLinkCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    zIndex: 1,
  },
  connectedLinkTitle: {
    fontSize: 12.5,
    lineHeight: 16,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(248, 252, 255, 0.98)',
    letterSpacing: -0.06,
  },
  connectedLinkTitleActive: {
    color: 'rgba(255, 255, 255, 1)',
  },
  connectedLinkSubtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(186, 204, 224, 0.78)',
  },
  connectedPortalAffordance: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(8, 14, 24, 0.62)',
    flexShrink: 0,
    zIndex: 1,
  },
  mapCardInnerBright: {
    position: 'relative',
    overflow: 'hidden',
  },
  locationGateStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  locationGateCardShell: {
    width: '100%',
    maxWidth: 440,
    borderColor: 'rgba(98, 255, 228, 0.14)',
    backgroundColor: 'rgba(4, 10, 18, 0.36)',
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(168, 255, 244, 0.1)',
        } as ViewStyle)
      : null),
  },
  locationGateCardInner: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  locationGateIconOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(132, 238, 255, 0.24)',
    overflow: 'hidden',
    marginBottom: 2,
  },
  locationGateChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 2,
  },
  locationGateChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(98, 255, 228, 0.16)',
    backgroundColor: 'rgba(6, 12, 20, 0.42)',
  },
  locationGateChipLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: 'rgba(188, 220, 240, 0.88)',
    letterSpacing: 0.2,
  },
  locationGateTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: INK,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  locationGateSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(214, 228, 244, 0.92)',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 2,
  },
  locationGateBenefitsBlock: {
    width: '100%',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.12)',
    backgroundColor: 'rgba(6, 12, 20, 0.32)',
    marginBottom: 2,
  },
  locationGateBenefitsKicker: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(148, 196, 220, 0.72)',
    textAlign: 'center',
    marginBottom: 2,
  },
  locationGateBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  locationGateBenefitIconCapsule: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.18)',
    backgroundColor: 'rgba(4, 10, 18, 0.38)',
    flexShrink: 0,
  },
  locationGateBenefitLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(220, 236, 252, 0.94)',
    lineHeight: 17,
  },
  locationGateSupport: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    lineHeight: 16,
    textAlign: 'center',
    opacity: 0.92,
    marginBottom: 4,
  },
  locationGatePrimaryBtn: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(92, 205, 255, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  locationGatePrimaryLabel: {
    color: INK,
    fontFamily: FontFamily.extrabold,
    fontSize: 14.5,
    letterSpacing: -0.04,
  },
  locationGateSecondaryBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationGateSecondaryLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: 'rgba(148, 196, 228, 0.82)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.72)',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  modalShell: { maxHeight: '78%' },
  modalInner: { gap: 8 },
  modalTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: INK,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
  },
  modalScroll: { maxHeight: 320 },
  modalEmpty: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: INK_MUTED,
    paddingVertical: 12,
  },
  cravingRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  cravingName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: INK,
  },
  cravingMeta: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: INK_SUB,
    marginTop: 2,
  },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCloseText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
});
