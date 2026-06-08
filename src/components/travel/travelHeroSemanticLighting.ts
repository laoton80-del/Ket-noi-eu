/**
 * Travel dynamic hero semantic lighting — cyan-led baseline; card-hover accents shift the network coherently.
 * Frame rim uses TravelGlassCard; arcs/nodes/pulse/handoff use this resolver.
 */
import {
  DYNAMIC_HERO_NETWORK_GOVERNANCE,
} from '../viona/homeHeroSemanticLighting';
import {
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET,
} from '../viona/globalLightNetworkTokens';
import type { TravelSemanticAccent } from './TravelGlassCard';

/** Travel dynamic hero typography — Local grammar with Travel midnight authority. */
export const TRAVEL_DYNAMIC_HERO_TYPOGRAPHY = {
  kicker: { fontSize: 12, letterSpacing: 1.85 },
  titleDesktop: { fontSize: 32, lineHeight: 38 },
  titleDesktopFullscreenBoost: 2,
  titleTablet: { fontSize: 28, lineHeight: 34 },
  titleNarrow: { fontSize: 24, lineHeight: 30 },
  titleCompact: { fontSize: 22, lineHeight: 28 },
  subtitle: { fontSize: 14, lineHeight: 22 },
  subtitleCompact: { fontSize: 12, lineHeight: 17 },
  trust: { fontSize: 10 },
  copyMaxWidthPx: 520,
  textSafeWidthPercent: 58,
} as const;

export type TravelHeroNetworkLighting = Readonly<{
  /** Network arcs, nodes, pulse — semantic when boosted; cyan baseline otherwise. */
  networkPrimary: string;
  /** Route depth / hover hint — semantic secondary or sky-blue depth. */
  networkSecondary: string;
  textSafeWash: readonly [string, string, string];
  bottomHandoff: readonly [string, string, string];
  routeArcPrimary: readonly [string, string, string];
  routeArcSecondary: readonly [string, string, string];
  edgeBloomBorder: string;
  edgeBloomShadow: string;
  /** Right-side subject lift — soft only; never a hard scanline. */
  subjectGlow: readonly [string, string, string];
}>;

const TRAVEL_SEMANTIC = DYNAMIC_HERO_NETWORK_GOVERNANCE.semantic.travel;
const CYAN = VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN;
const SKY = TRAVEL_SEMANTIC.secondary;

const TRAVEL_HERO_LIGHTING_BASELINE: TravelHeroNetworkLighting = {
  networkPrimary: TRAVEL_SEMANTIC.primary,
  networkSecondary: SKY,
  textSafeWash: ['rgba(132, 238, 255, 0.1)', 'rgba(132, 238, 255, 0.04)', 'transparent'],
  bottomHandoff: ['transparent', 'rgba(92, 205, 255, 0.09)', 'rgba(4, 8, 16, 0.28)'],
  routeArcPrimary: ['transparent', 'rgba(92, 205, 255, 0.11)', 'transparent'],
  routeArcSecondary: ['transparent', 'rgba(132, 238, 255, 0.07)', 'transparent'],
  edgeBloomBorder: 'rgba(92, 205, 255, 0.16)',
  edgeBloomShadow: 'rgba(92, 205, 255, 0.32)',
  subjectGlow: ['transparent', 'rgba(92, 205, 255, 0.045)', 'transparent'],
};

/** Semantic lighting profiles when a Travel card is hovered/active. */
const TRAVEL_HERO_LIGHTING_BY_ACCENT: Readonly<
  Record<TravelSemanticAccent, TravelHeroNetworkLighting>
> = {
  cyan: {
    networkPrimary: CYAN.ink,
    networkSecondary: SKY,
    textSafeWash: ['rgba(132, 238, 255, 0.12)', 'rgba(102, 182, 255, 0.05)', 'transparent'],
    bottomHandoff: ['transparent', 'rgba(92, 205, 255, 0.12)', 'rgba(4, 8, 16, 0.28)'],
    routeArcPrimary: ['transparent', 'rgba(92, 205, 255, 0.14)', 'transparent'],
    routeArcSecondary: ['transparent', 'rgba(102, 182, 255, 0.09)', 'transparent'],
    edgeBloomBorder: CYAN.stroke,
    edgeBloomShadow: CYAN.glow,
    subjectGlow: ['transparent', 'rgba(92, 205, 255, 0.07)', 'transparent'],
  },
  violet: {
    networkPrimary: '#D294FF',
    networkSecondary: '#B56DFF',
    textSafeWash: ['rgba(168, 141, 255, 0.09)', 'rgba(132, 238, 255, 0.04)', 'transparent'],
    bottomHandoff: ['transparent', 'rgba(168, 141, 255, 0.09)', 'rgba(4, 8, 16, 0.28)'],
    routeArcPrimary: ['transparent', 'rgba(168, 141, 255, 0.11)', 'transparent'],
    routeArcSecondary: ['transparent', 'rgba(132, 238, 255, 0.08)', 'transparent'],
    edgeBloomBorder: 'rgba(168, 141, 255, 0.22)',
    edgeBloomShadow: 'rgba(168, 141, 255, 0.3)',
    subjectGlow: ['transparent', 'rgba(168, 141, 255, 0.06)', 'transparent'],
  },
  magenta: {
    networkPrimary: '#FF58A8',
    networkSecondary: '#FF8CB4',
    textSafeWash: ['rgba(132, 238, 255, 0.1)', 'rgba(255, 110, 140, 0.05)', 'transparent'],
    bottomHandoff: ['transparent', 'rgba(92, 205, 255, 0.1)', 'rgba(4, 8, 16, 0.28)'],
    routeArcPrimary: ['transparent', 'rgba(92, 205, 255, 0.12)', 'transparent'],
    routeArcSecondary: ['transparent', 'rgba(255, 110, 140, 0.09)', 'transparent'],
    edgeBloomBorder: 'rgba(255, 110, 140, 0.2)',
    edgeBloomShadow: 'rgba(255, 110, 140, 0.24)',
    subjectGlow: ['transparent', 'rgba(255, 110, 140, 0.05)', 'transparent'],
  },
  emerald: {
    networkPrimary: '#30E8D0',
    networkSecondary: '#8CD4FF',
    textSafeWash: ['rgba(98, 255, 228, 0.09)', 'rgba(132, 238, 255, 0.04)', 'transparent'],
    bottomHandoff: ['transparent', 'rgba(98, 255, 228, 0.1)', 'rgba(4, 8, 16, 0.28)'],
    routeArcPrimary: ['transparent', 'rgba(98, 255, 228, 0.11)', 'transparent'],
    routeArcSecondary: ['transparent', 'rgba(132, 238, 255, 0.08)', 'transparent'],
    edgeBloomBorder: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD.stroke,
    edgeBloomShadow: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD.glow,
    subjectGlow: ['transparent', 'rgba(98, 255, 228, 0.06)', 'transparent'],
  },
  gold: {
    networkPrimary: CYAN.ink,
    networkSecondary: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD.ink,
    textSafeWash: ['rgba(132, 238, 255, 0.1)', 'rgba(246, 212, 110, 0.04)', 'transparent'],
    bottomHandoff: ['transparent', 'rgba(92, 205, 255, 0.09)', 'rgba(4, 8, 16, 0.28)'],
    routeArcPrimary: ['transparent', 'rgba(92, 205, 255, 0.11)', 'transparent'],
    routeArcSecondary: ['transparent', 'rgba(246, 212, 110, 0.07)', 'transparent'],
    edgeBloomBorder: 'rgba(246, 212, 110, 0.16)',
    edgeBloomShadow: 'rgba(246, 212, 110, 0.2)',
    subjectGlow: ['transparent', 'rgba(246, 212, 110, 0.04)', 'transparent'],
  },
};

export function resolveTravelHeroNetworkLighting(
  hoverAccent: TravelSemanticAccent | null,
  boosted: boolean
): TravelHeroNetworkLighting {
  if (!boosted || hoverAccent == null) {
    return TRAVEL_HERO_LIGHTING_BASELINE;
  }
  return TRAVEL_HERO_LIGHTING_BY_ACCENT[hoverAccent];
}
