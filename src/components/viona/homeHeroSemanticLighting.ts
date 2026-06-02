/**
 * Home dynamic hero semantic light-network + frame accents.
 * Keys mirror `LivingHeroVisualKey` in HomeScreen (default | local | travel | academy | business).
 *
 * Also exports shared dynamic-hero typography + network governance for Home / Local / Travel parity.
 */
import { Platform, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';
import { VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN } from './globalLightNetworkTokens';

export type HomeLivingHeroVisualKey = 'default' | 'local' | 'travel' | 'academy' | 'business';

export type HomeHeroSemanticLighting = Readonly<{
  accent: string;
  secondaryAccent: string;
}>;

export type HomeHeroEdgeAccents = Readonly<{
  /** Right vertical rim line. */
  verticalEdge: string;
  /** Bottom handoff line — gold on default, semantic otherwise. */
  bottomEdge: string;
}>;

const ft = vionaTokens.fashionTech;

/** Shared typography bands — Local dynamic hero is the reference class. */
export const DYNAMIC_HERO_TYPOGRAPHY = {
  kicker: { fontSize: 11, letterSpacing: 2 },
  titleDesktop: { fontSize: 26, lineHeight: 32 },
  titleDesktopFullscreenBoost: 2,
  titleTablet: { fontSize: 26, lineHeight: 32 },
  titleNarrow: { fontSize: 22, lineHeight: 28 },
  titleCompact: { fontSize: 21, lineHeight: 26 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  subtitleCompact: { fontSize: 12, lineHeight: 17 },
  trust: { fontSize: 10 },
  copyMaxWidthPx: 520,
  textSafeWidthPercent: 58,
} as const;

/**
 * Shared network quality + semantic color governance (VIONA.WAVE_3B parity).
 * Quality/rhythm aligned; semantic accents differ per universe.
 */
export const DYNAMIC_HERO_NETWORK_GOVERNANCE = {
  heroTier: 'hero' as const,
  hoverTransitionMs: 240,
  bottomHandoffHeightPercent: 28,
  networkBoostMultiplier: 1.42,
  semantic: {
    homeDefault: { primary: ft.accentGold, secondary: ft.accentCyan },
    homeTravel: { primary: ft.accentCyan, secondary: '#66B6FF' },
    local: { primary: '#78E8C4', secondary: '#8CD4FF' },
    travel: {
      primary: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.ink,
      secondary: '#66B6FF',
    },
    academy: { primary: ft.accentViolet, secondary: '#B56DFF' },
    business: { primary: ft.accentGold, secondary: '#F0B35D' },
  },
} as const;

/** Default Human Constellation — gold primary, cyan glass-tech secondary (nodes only). */
const HOME_CONSTELLATION: HomeHeroSemanticLighting = {
  accent: DYNAMIC_HERO_NETWORK_GOVERNANCE.semantic.homeDefault.primary,
  secondaryAccent: DYNAMIC_HERO_NETWORK_GOVERNANCE.semantic.homeDefault.secondary,
};

/** Semantic hero network + rim accents per active/hovered world card. */
export const HOME_HERO_SEMANTIC_LIGHTING: Record<HomeLivingHeroVisualKey, HomeHeroSemanticLighting> = {
  default: HOME_CONSTELLATION,
  local: { accent: ft.accentEmerald, secondaryAccent: ft.accentCyan },
  travel: {
    accent: DYNAMIC_HERO_NETWORK_GOVERNANCE.semantic.homeTravel.primary,
    secondaryAccent: DYNAMIC_HERO_NETWORK_GOVERNANCE.semantic.homeTravel.secondary,
  },
  /** Violet-led only — no magenta/pink secondary (prevents stray pink network node + pulse). */
  academy: { accent: ft.accentViolet, secondaryAccent: '#B56DFF' },
  business: { accent: ft.accentGold, secondaryAccent: '#F0B35D' },
};

const HOME_HERO_EDGE_ACCENTS: Record<HomeLivingHeroVisualKey, HomeHeroEdgeAccents> = {
  /** Default: warm gold edges — no harsh cyan strip through the hero. */
  default: {
    verticalEdge: 'rgba(201, 169, 98, 0.26)',
    bottomEdge: 'rgba(201, 169, 98, 0.2)',
  },
  local: {
    verticalEdge: 'rgba(46, 207, 155, 0.34)',
    bottomEdge: 'rgba(46, 207, 155, 0.26)',
  },
  travel: {
    verticalEdge: 'rgba(112, 200, 255, 0.36)',
    bottomEdge: 'rgba(112, 200, 255, 0.28)',
  },
  academy: {
    verticalEdge: 'rgba(168, 141, 255, 0.34)',
    bottomEdge: 'rgba(168, 141, 255, 0.24)',
  },
  business: {
    verticalEdge: 'rgba(201, 169, 98, 0.34)',
    bottomEdge: 'rgba(240, 179, 93, 0.26)',
  },
};

const HOME_HERO_EDGE_ACCENTS_DAYLIGHT: Record<HomeLivingHeroVisualKey, HomeHeroEdgeAccents> = {
  default: {
    verticalEdge: 'rgba(255, 242, 215, 0.22)',
    bottomEdge: 'rgba(255, 242, 215, 0.18)',
  },
  local: {
    verticalEdge: 'rgba(120, 232, 196, 0.3)',
    bottomEdge: 'rgba(120, 232, 196, 0.22)',
  },
  travel: {
    verticalEdge: 'rgba(148, 210, 255, 0.32)',
    bottomEdge: 'rgba(148, 210, 255, 0.24)',
  },
  academy: {
    verticalEdge: 'rgba(198, 172, 248, 0.3)',
    bottomEdge: 'rgba(198, 172, 248, 0.22)',
  },
  business: {
    verticalEdge: 'rgba(255, 242, 215, 0.28)',
    bottomEdge: 'rgba(234, 196, 124, 0.22)',
  },
};

export function getHomeHeroSemanticLighting(key: HomeLivingHeroVisualKey): HomeHeroSemanticLighting {
  return HOME_HERO_SEMANTIC_LIGHTING[key] ?? HOME_CONSTELLATION;
}

export function getHomeHeroEdgeAccents(
  key: HomeLivingHeroVisualKey,
  daylight = false
): HomeHeroEdgeAccents {
  const map = daylight ? HOME_HERO_EDGE_ACCENTS_DAYLIGHT : HOME_HERO_EDGE_ACCENTS;
  return map[key] ?? map.default;
}

/** Web: smooth accent crossfade on hover rim (matches 240ms hero lit timing). */
export function homeHeroSemanticHoverRimWebStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    transitionProperty: 'border-color, opacity',
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  } as ViewStyle;
}
