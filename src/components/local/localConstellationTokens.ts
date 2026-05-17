/** HC.LOCAL — Local / service constellation palette (visual only). */
import { Platform, type ViewStyle } from 'react-native';

import {
  fashionHomeWebDaylightQuickActionPillGlassStyle,
  fashionHomeWebDaylightWorldCardMaterialStyle,
  type FashionHomeQuickActionAccent,
  type FashionHomeWorldCardDaylightAccent,
} from '../viona/fashionHomeDesktopShell';
import {
  neonNetworkCard,
  neonNetworkGlassTint,
  neonNetworkSurfaceFill,
  neonNetworkTierSpec,
  type NeonNetworkCardTier,
} from '../viona/neonNetworkCardTokens';

export const localConstellation = {
  canvas: '#050B14',
  canvasVeil: 'rgba(5, 11, 20, 0.44)',
  canvasBackdropOpacityDesktop: 0.5,
  canvasBackdropOpacityMobile: 0.36,
  canvasBackdropVeilOpacity: 0.32,
  contentFieldVeil: 'rgba(5, 11, 20, 0.38)',
  canvasBackdropTopBleed: 28,
  canvasBackdropTextureScale: 1.04,
  canvasBackdropRisePercent: 10,
  canvasBackdropFocusYPercent: 14,
  canvasGlowEmerald: 'rgba(72, 210, 165, 0.05)',
  canvasGlowCyan: 'rgba(92, 205, 255, 0.04)',
  canvasGlowMid: 'rgba(5, 11, 20, 0.12)',
  surface: 'rgba(10, 18, 32, 0.94)',
  surfaceRaised: 'rgba(8, 14, 26, 0.96)',
  surfaceCardDefault: 'rgba(10, 14, 22, 0.58)',
  surfaceCardHover: 'rgba(10, 14, 22, 0.48)',
  surfaceCardGlassTint: 'rgba(148, 163, 184, 0.01)',
  surfaceCardGlassTintHover: 'rgba(148, 163, 184, 0.006)',
  surfaceCardBackdropBlur: 3,
  surfaceHeroDefault: 'rgba(8, 14, 24, 0.72)',
  surfaceHeroHover: 'rgba(8, 14, 24, 0.6)',
  surfaceHeroBackdropBlur: 3,
  surfaceMuted: 'rgba(15, 26, 44, 0.88)',
  commandRail: 'transparent',
  commandRailBorder: 'rgba(148, 163, 184, 0.14)',
  ink: neonNetworkCard.ink,
  inkStrong: neonNetworkCard.inkStrong,
  inkMuted: neonNetworkCard.inkMuted,
  inkCardSub: neonNetworkCard.inkCardSub,
  border: 'rgba(148, 163, 184, 0.18)',
  accentEmerald: '#78E8C4',
  accentEmeraldStroke: 'rgba(72, 210, 165, 0.8)',
  accentCyan: '#8CD4FF',
  accentCyanStroke: 'rgba(92, 205, 255, 0.8)',
  accentGold: '#E8C878',
  accentGoldStroke: 'rgba(228, 192, 110, 0.84)',
  accentViolet: '#C8A8F0',
  accentVioletStroke: 'rgba(178, 132, 248, 0.74)',
  risk: '#FF6B82',
  riskStroke: 'rgba(255, 92, 108, 0.78)',
  glowEmerald: 'rgba(72, 210, 165, 0.14)',
  glowCyan: 'rgba(92, 205, 255, 0.14)',
  glowGold: 'rgba(228, 192, 110, 0.12)',
  glowViolet: 'rgba(178, 132, 248, 0.12)',
  glowRisk: 'rgba(255, 92, 108, 0.16)',
  glowEmeraldHover: 'rgba(72, 210, 165, 0.2)',
  glowCyanHover: 'rgba(92, 205, 255, 0.2)',
  glowGoldHover: 'rgba(228, 192, 110, 0.18)',
  glowVioletHover: 'rgba(178, 132, 248, 0.18)',
  statusEmeraldFill: 'rgba(72, 210, 165, 0.14)',
  statusCyanFill: 'rgba(92, 205, 255, 0.14)',
  statusGoldFill: 'rgba(228, 192, 110, 0.15)',
  statusVioletFill: 'rgba(178, 132, 248, 0.14)',
  cardEdgeWidth: 1,
  cardHoverLiftPx: 2,
  cardHoverScale: 1,
  cardHoverTransitionMs: 165,
  commandPillBg: 'rgba(10, 14, 22, 0.23)',
  commandPillBorder: 'rgba(148, 163, 184, 0.24)',
  hubVeilTop: 'rgba(94, 234, 212, 0.04)',
  hubVeilBottom: 'rgba(5, 11, 20, 0)',
  /** Wider grid rhythm — more air between cards (desktop 3-col). */
  gridGap: 16,
  tabBarClearanceBottom: 172,
  miniappDockBottomOffset: 58,
  miniappDockHeight: 46,
  floatingSosReserveBottom: 24,
  desktopSceneLift: 0,
  desktopScenePadMin: 40,
} as const;

export type LocalConstellationAccent = 'emerald' | 'cyan' | 'gold' | 'violet';

export type LocalNetworkCardTier = NeonNetworkCardTier;

export type LocalRailPillAccent = 'cyan' | 'gold' | 'risk';

export type LocalContentRail = Readonly<{
  horizontalPad: number;
  innerWidth: number;
}>;

export function resolveLocalContentRail(windowWidth: number): LocalContentRail {
  const horizontalPad = windowWidth >= 1440 ? 24 : windowWidth >= 960 ? 16 : 12;
  return {
    horizontalPad,
    innerWidth: Math.max(0, windowWidth - horizontalPad * 2),
  };
}

export function resolveLocalGridColumns(
  width: number,
  options?: Readonly<{ desktop?: number; tablet?: number; tabletMin?: number; desktopMin?: number }>
): number {
  const desktopMin = options?.desktopMin ?? 1024;
  const tabletMin = options?.tabletMin ?? 600;
  const desktop = options?.desktop ?? 3;
  const tablet = options?.tablet ?? 2;
  if (width >= desktopMin) return desktop;
  if (width >= tabletMin) return tablet;
  return 1;
}

export function resolveLocalGridItemWidth(contentWidth: number, columns: number, gap = localConstellation.gridGap): number {
  if (columns <= 1) return contentWidth;
  return (contentWidth - gap * (columns - 1)) / columns;
}

export function localAccentStroke(accent: LocalConstellationAccent): string {
  switch (accent) {
    case 'emerald':
      return localConstellation.accentEmeraldStroke;
    case 'cyan':
      return localConstellation.accentCyanStroke;
    case 'gold':
      return localConstellation.accentGoldStroke;
    case 'violet':
      return localConstellation.accentVioletStroke;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localAccentInk(accent: LocalConstellationAccent): string {
  switch (accent) {
    case 'emerald':
      return localConstellation.accentEmerald;
    case 'cyan':
      return localConstellation.accentCyan;
    case 'gold':
      return localConstellation.accentGold;
    case 'violet':
      return localConstellation.accentViolet;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localRailPillInk(accent: LocalRailPillAccent): string {
  switch (accent) {
    case 'cyan':
      return localConstellation.accentCyan;
    case 'gold':
      return localConstellation.accentGold;
    case 'risk':
      return localConstellation.risk;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localRailPillStroke(accent: LocalRailPillAccent): string {
  switch (accent) {
    case 'cyan':
      return localConstellation.accentCyanStroke;
    case 'gold':
      return localConstellation.accentGoldStroke;
    case 'risk':
      return localConstellation.riskStroke;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localRailPillGlow(accent: LocalRailPillAccent): string {
  switch (accent) {
    case 'cyan':
      return localConstellation.glowCyan;
    case 'gold':
      return localConstellation.glowGold;
    case 'risk':
      return localConstellation.glowRisk;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localAccentGlow(accent: LocalConstellationAccent, hovered = false): string {
  switch (accent) {
    case 'emerald':
      return hovered ? localConstellation.glowEmeraldHover : localConstellation.glowEmerald;
    case 'cyan':
      return hovered ? localConstellation.glowCyanHover : localConstellation.glowCyan;
    case 'gold':
      return hovered ? localConstellation.glowGoldHover : localConstellation.glowGold;
    case 'violet':
      return hovered ? localConstellation.glowVioletHover : localConstellation.glowViolet;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localAccentAuraFill(accent: LocalConstellationAccent, hovered: boolean): string {
  return localAccentGlow(accent, hovered);
}

export function localAccentFamilyWash(accent: LocalConstellationAccent, hovered: boolean): string {
  switch (accent) {
    case 'emerald':
      return hovered ? 'rgba(72, 210, 165, 0.08)' : 'rgba(72, 210, 165, 0.04)';
    case 'cyan':
      return hovered ? 'rgba(92, 205, 255, 0.08)' : 'rgba(92, 205, 255, 0.04)';
    case 'gold':
      return hovered ? 'rgba(228, 192, 110, 0.09)' : 'rgba(228, 192, 110, 0.05)';
    case 'violet':
      return hovered ? 'rgba(178, 132, 248, 0.08)' : 'rgba(178, 132, 248, 0.04)';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localCardSurfaceFill(tier: LocalNetworkCardTier, hovered: boolean): string {
  if (tier === 'hero') {
    return hovered ? localConstellation.surfaceHeroHover : localConstellation.surfaceHeroDefault;
  }
  if (tier === 'utility') {
    return neonNetworkSurfaceFill(tier, hovered);
  }
  return hovered ? localConstellation.surfaceCardHover : localConstellation.surfaceCardDefault;
}

export function localCardGlassTint(tier: LocalNetworkCardTier, hovered: boolean): string {
  if (tier === 'utility') {
    return neonNetworkGlassTint(tier, hovered);
  }
  return hovered ? localConstellation.surfaceCardGlassTintHover : localConstellation.surfaceCardGlassTint;
}

export function localCardBackdropBlur(tier: LocalNetworkCardTier, hovered: boolean): number {
  if (tier === 'utility') {
    return neonNetworkTierSpec(tier).backdropBlur;
  }
  // Hero + service: crisp tinted glass — minimal blur so the Local scene stays sharp, not smeared.
  if (tier === 'hero') {
    return hovered ? 2 : 3;
  }
  return hovered ? 2 : 3;
}

export function localAccentStatusFill(accent: LocalConstellationAccent, hovered = false): string {
  switch (accent) {
    case 'emerald':
      return hovered ? 'rgba(72, 210, 165, 0.2)' : localConstellation.statusEmeraldFill;
    case 'cyan':
      return hovered ? 'rgba(92, 205, 255, 0.2)' : localConstellation.statusCyanFill;
    case 'gold':
      return hovered ? 'rgba(228, 192, 110, 0.22)' : localConstellation.statusGoldFill;
    case 'violet':
      return hovered ? 'rgba(178, 132, 248, 0.2)' : localConstellation.statusVioletFill;
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localAccentIconChipFill(accent: LocalConstellationAccent, hovered: boolean): string {
  switch (accent) {
    case 'emerald':
      return hovered ? 'rgba(72, 210, 165, 0.1)' : 'rgba(72, 210, 165, 0.05)';
    case 'cyan':
      return hovered ? 'rgba(92, 205, 255, 0.1)' : 'rgba(92, 205, 255, 0.05)';
    case 'gold':
      return hovered ? 'rgba(228, 192, 110, 0.11)' : 'rgba(228, 192, 110, 0.06)';
    case 'violet':
      return hovered ? 'rgba(178, 132, 248, 0.1)' : 'rgba(178, 132, 248, 0.05)';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localNetworkNodeGlow(accent: LocalConstellationAccent, hovered: boolean): string {
  return localAccentGlow(accent, hovered);
}

export function localAccentStrokeHover(accent: LocalConstellationAccent): string {
  switch (accent) {
    case 'emerald':
      return 'rgba(120, 235, 198, 0.92)';
    case 'cyan':
      return 'rgba(140, 215, 255, 0.92)';
    case 'gold':
      return 'rgba(255, 215, 150, 0.92)';
    case 'violet':
      return 'rgba(200, 165, 255, 0.9)';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localAccentInkHover(accent: LocalConstellationAccent): string {
  switch (accent) {
    case 'emerald':
      return '#98F0D0';
    case 'cyan':
      return '#A8E0FF';
    case 'gold':
      return '#F0D890';
    case 'violet':
      return '#D8B8F8';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localAccentToHomeWorldGlass(accent: LocalConstellationAccent): FashionHomeWorldCardDaylightAccent {
  switch (accent) {
    case 'emerald':
      return 'local';
    case 'cyan':
      return 'travel';
    case 'gold':
      return 'business';
    case 'violet':
      return 'academy';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

export function localRailAccentToHomePillGlass(accent: LocalRailPillAccent): FashionHomeQuickActionAccent {
  switch (accent) {
    case 'cyan':
      return 'cyan';
    case 'gold':
      return 'gold';
    case 'risk':
      return 'sos';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}

const LOCAL_ACCENT_INNER_HIGHLIGHT: Record<LocalConstellationAccent, string> = {
  emerald: 'inset 0 0 0 1px rgba(120, 235, 198, 0.14)',
  cyan: 'inset 0 0 0 1px rgba(140, 215, 255, 0.13)',
  gold: 'inset 0 0 0 1px rgba(255, 215, 150, 0.14)',
  violet: 'inset 0 0 0 1px rgba(200, 165, 255, 0.13)',
};

const LOCAL_ACCENT_EDGE_MICRO_GLOW: Record<LocalConstellationAccent, string> = {
  emerald: '0 0 3px rgba(72, 210, 165, 0.1)',
  cyan: '0 0 3px rgba(92, 205, 255, 0.1)',
  gold: '0 0 3px rgba(228, 192, 110, 0.1)',
  violet: '0 0 3px rgba(178, 132, 248, 0.085)',
};

const LOCAL_ACCENT_EDGE_MICRO_GLOW_HOVER: Record<LocalConstellationAccent, string> = {
  emerald: '0 0 3px rgba(72, 210, 165, 0.12)',
  cyan: '0 0 3px rgba(92, 205, 255, 0.12)',
  gold: '0 0 3px rgba(228, 192, 110, 0.12)',
  violet: '0 0 3px rgba(178, 132, 248, 0.1)',
};

/** Web: Home-aligned premium glass + inner highlight + close-edge micro glow. */
export function localWebConstellationGlassStyle(
  accent: LocalConstellationAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const home = fashionHomeWebDaylightWorldCardMaterialStyle(localAccentToHomeWorldGlass(accent), hovered);
  const base = typeof home.boxShadow === 'string' ? home.boxShadow : '';
  const glow = hovered ? LOCAL_ACCENT_EDGE_MICRO_GLOW_HOVER[accent] : LOCAL_ACCENT_EDGE_MICRO_GLOW[accent];
  return {
    boxShadow: [base, LOCAL_ACCENT_INNER_HIGHLIGHT[accent], glow, 'inset 0 1px 0 rgba(255, 248, 235, 0.028)']
      .filter(Boolean)
      .join(', '),
  } as ViewStyle;
}

/** Native: thin rim + inner highlight + micro depth (no heavy outer bloom). */
export function localNativeConstellationEdgeStyle(accent: LocalConstellationAccent): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: localAccentStroke(accent),
    shadowColor: localAccentGlow(accent, false),
    shadowOpacity: 0.14,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  };
}

/** Web: thin glass capsule for command-rail pills. */
export function localWebRailPillGlassStyle(accent: LocalRailPillAccent, hovered = false): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return fashionHomeWebDaylightQuickActionPillGlassStyle(localRailAccentToHomePillGlass(accent), hovered);
}

/** Web: compact dark glass chip (status / audience). */
export function localWebCompactGlassChipStyle(
  accent: LocalConstellationAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const stroke = hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent);
  return {
    backgroundColor: 'rgba(10, 14, 22, 0.48)',
    borderWidth: 0,
    boxShadow: `0 0 0 1px ${stroke}, ${LOCAL_ACCENT_INNER_HIGHLIGHT[accent]}, 0 0 3px ${localAccentGlow(accent, hovered)}`,
  } as ViewStyle;
}

export function localNetworkTierSpec(tier: LocalNetworkCardTier) {
  return neonNetworkTierSpec(tier);
}
