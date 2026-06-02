/**
 * VIONA reference glass material — Local command-center panel + flagship tiles.
 * Code-only layers (gradients, rims, specular); no raster assets.
 */
import { Platform, type ViewStyle } from 'react-native';

import type { PremiumTileState, VionaUniverseAccent } from './premiumTileVisualTokens';
import { premiumSemanticGlow, premiumUniverseAccentSpec } from './premiumTileVisualTokens';

/** Local universe atmosphere (emerald + cyan). */
export const vionaLocalGlassAtmosphere = {
  emerald: 'rgba(72, 210, 165, 1)',
  cyan: 'rgba(92, 205, 255, 1)',
  emeraldGlow: 'rgba(72, 210, 165, 0.55)',
  cyanGlow: 'rgba(92, 205, 255, 0.48)',
  edgeEmerald: 'rgba(72, 210, 165, 0.68)',
  edgeCyan: 'rgba(92, 205, 255, 0.55)',
  innerRim: 'rgba(148, 230, 255, 0.42)',
  specular: 'rgba(255, 255, 255, 0.22)',
  specularSoft: 'rgba(255, 255, 255, 0.1)',
} as const;

export const vionaLocalPanelGlass = {
  /** Crystal shell — transparent, not opaque block. */
  shellFill: 'rgba(4, 12, 18, 0.42)',
  crystalGradient: [
    'rgba(8, 22, 28, 0.55)',
    'rgba(4, 14, 20, 0.38)',
    'rgba(2, 8, 14, 0.52)',
  ] as const,
  crystalLocations: [0, 0.45, 1] as const,
  border: vionaLocalGlassAtmosphere.edgeEmerald,
  innerRim: vionaLocalGlassAtmosphere.innerRim,
  specularTop: [vionaLocalGlassAtmosphere.specular, 'rgba(255,255,255,0.04)', 'transparent'] as const,
  specularLocations: [0, 0.22, 0.55] as const,
  cornerWash: [
    'rgba(72, 210, 165, 0.14)',
    'rgba(92, 205, 255, 0.08)',
    'transparent',
  ] as const,
  horizonGlow: [
    'transparent',
    'rgba(72, 210, 165, 0.1)',
    'rgba(92, 205, 255, 0.22)',
    'rgba(72, 210, 165, 0.16)',
  ] as const,
  horizonLocations: [0.15, 0.5, 0.82, 1] as const,
  flagshipFloorGlow: [
    'transparent',
    'rgba(72, 210, 165, 0.08)',
    'rgba(92, 205, 255, 0.14)',
  ] as const,
  flagshipFloorLocations: [0, 0.5, 1] as const,
  skylineOpacity: 0.94,
  backdropBlurPx: 14,
  webOuterShadow:
    '0 0 0 1px rgba(92, 205, 255, 0.22), 0 0 48px rgba(72, 210, 165, 0.2), 0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(92, 205, 255, 0.08)',
} as const;

export const vionaLocalFlagshipCardGlass = {
  surfaceFill: 'rgba(6, 14, 24, 0.32)',
  surfaceFillHover: 'rgba(8, 18, 30, 0.38)',
  glassTint: 'rgba(10, 22, 34, 0.22)',
  glassTintHover: 'rgba(12, 26, 40, 0.28)',
  innerRimWidth: 1.15,
  innerRimOpacity: 0.88,
  specularShine: [
    'rgba(255, 255, 255, 0.2)',
    'rgba(255, 255, 255, 0.06)',
    'transparent',
  ] as const,
  specularLocations: [0, 0.18, 0.42] as const,
  bottomRefraction: [
    'transparent',
    'rgba(92, 205, 255, 0.06)',
    'rgba(72, 210, 165, 0.12)',
  ] as const,
  bottomRefractionLocations: [0.35, 0.72, 1] as const,
  sceneFloorReflection: [
    'transparent',
    'rgba(120, 200, 255, 0.08)',
    'rgba(72, 210, 165, 0.14)',
  ] as const,
  sceneFloorLocations: [0.45, 0.78, 1] as const,
  textVeilTop: ['rgba(4, 10, 18, 0.72)', 'rgba(4, 10, 18, 0.28)', 'transparent'] as const,
  textVeilLocations: [0, 0.32, 0.58] as const,
  sceneWashOpacity: 0.32,
  backdropBlurPx: 10,
  edgeWidth: 1.55,
  frameGlowOpacity: 0.92,
  haloOpacity: 0.34,
  ctaOrbFill: 'rgba(8, 18, 30, 0.52)',
  ctaOrbSpecular: 'rgba(255, 255, 255, 0.18)',
  ctaWebShadow: '0 0 14px rgba(92, 205, 255, 0.28), inset 0 1px 0 rgba(255,255,255,0.2)',
} as const;

export function vionaLocalPanelWebGlass(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const px = vionaLocalPanelGlass.backdropBlurPx;
  return {
    backdropFilter: `blur(${px}px) saturate(1.15)`,
    WebkitBackdropFilter: `blur(${px}px) saturate(1.15)`,
  } as ViewStyle;
}

export function vionaLocalFlagshipCardWebGlass(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const px = vionaLocalFlagshipCardGlass.backdropBlurPx;
  return {
    backdropFilter: `blur(${px}px) saturate(1.12)`,
    WebkitBackdropFilter: `blur(${px}px) saturate(1.12)`,
  } as ViewStyle;
}

export function vionaLocalFlagshipCardShellStyle(
  accent: VionaUniverseAccent,
  state: PremiumTileState = 'default'
): ViewStyle {
  const glow = premiumSemanticGlow(accent, state);
  const hovered = state === 'hovered';
  return Platform.OS === 'web'
    ? ({
        boxShadow: `0 0 ${hovered ? 22 : 16}px ${glow}, 0 0 0 1px rgba(92, 205, 255, 0.22), 0 6px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(92, 205, 255, 0.06)`,
      } as ViewStyle)
    : {
        shadowColor: glow,
        shadowOpacity: hovered ? 0.38 : 0.28,
        shadowRadius: hovered ? 18 : 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: hovered ? 8 : 5,
      };
}

export function vionaLocalFlagshipInnerRimColor(accent: VionaUniverseAccent, state: PremiumTileState): string {
  const spec = premiumUniverseAccentSpec(accent);
  const glow = premiumSemanticGlow(accent, state);
  return state === 'hovered' ? spec.strokeHover : glow;
}

export function vionaLocalFlagshipSurfaceFill(state: PremiumTileState): string {
  return state === 'hovered'
    ? vionaLocalFlagshipCardGlass.surfaceFillHover
    : vionaLocalFlagshipCardGlass.surfaceFill;
}

export function vionaLocalFlagshipGlassTint(state: PremiumTileState): string {
  return state === 'hovered'
    ? vionaLocalFlagshipCardGlass.glassTintHover
    : vionaLocalFlagshipCardGlass.glassTint;
}
