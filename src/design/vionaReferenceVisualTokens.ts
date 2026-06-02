/**
 * VIONA six-universe reference visual engine — Local command-center tokens.
 * Dark crystal glass: color on edges/glow, not milky body fills.
 */
import { Platform, type ViewStyle } from 'react-native';

import type { PremiumTileState, VionaUniverseAccent } from './premiumTileVisualTokens';
import { premiumUniverseAccentSpec } from './premiumTileVisualTokens';

export type VionaReferenceSemantic = 'emerald' | 'cyan' | 'gold' | 'violet' | 'magenta' | 'neutral';

export type VionaReferenceGlassSemanticTokens = Readonly<{
  crystalFill: string;
  deepFill: string;
  surfaceTint: string;
  innerRim: string;
  edgeHighlight: string;
  edgeGlow: string;
  specularTop: readonly [string, string, string];
  specularLocations: readonly [number, number, number];
  cornerSpecular: readonly [string, string];
  lowerRefraction: readonly [string, string, string];
  lowerRefractionLocations: readonly [number, number, number];
  semanticGlow: string;
  semanticGlowStrong: string;
  borderGradient: readonly [string, string, string, string];
  floorReflection: readonly [string, string, string];
  floorReflectionLocations: readonly [number, number, number];
  sceneBloom: string;
  sceneWashOpacity: number;
  textVeil: readonly [string, string, string];
  textVeilLocations: readonly [number, number, number];
}>;

const SPECULAR_TOP: VionaReferenceGlassSemanticTokens['specularTop'] = [
  'rgba(255, 255, 255, 0.34)',
  'rgba(200, 235, 255, 0.08)',
  'transparent',
];
const SPECULAR_LOC: VionaReferenceGlassSemanticTokens['specularLocations'] = [0, 0.1, 0.28];
const CORNER_SPECULAR: VionaReferenceGlassSemanticTokens['cornerSpecular'] = [
  'rgba(255, 255, 255, 0.28)',
  'transparent',
];
const TEXT_VEIL: VionaReferenceGlassSemanticTokens['textVeil'] = [
  'rgba(0, 3, 8, 0.58)',
  'rgba(0, 3, 8, 0.16)',
  'transparent',
];
const TEXT_VEIL_LOC: VionaReferenceGlassSemanticTokens['textVeilLocations'] = [0, 0.32, 0.58];

const FLOOR_REFLECT_LOC: VionaReferenceGlassSemanticTokens['floorReflectionLocations'] = [0.38, 0.78, 1];
const LOWER_REFRACT_LOC: VionaReferenceGlassSemanticTokens['lowerRefractionLocations'] = [0.45, 0.82, 1];

function semanticBase(
  glow: string,
  glowStrong: string,
  rim: string,
  edge: string,
  edgeGlow: string,
  border: readonly [string, string, string, string],
  refractMid: string,
  refractLow: string,
  floorMid: string
): VionaReferenceGlassSemanticTokens {
  return {
    crystalFill: 'rgba(0, 2, 6, 0.34)',
    deepFill: 'rgba(0, 1, 4, 0.56)',
    surfaceTint: 'rgba(0, 0, 0, 0.01)',
    innerRim: rim,
    edgeHighlight: edge,
    edgeGlow,
    specularTop: SPECULAR_TOP,
    specularLocations: SPECULAR_LOC,
    cornerSpecular: CORNER_SPECULAR,
    lowerRefraction: ['transparent', refractMid, refractLow],
    lowerRefractionLocations: LOWER_REFRACT_LOC,
    semanticGlow: glow,
    semanticGlowStrong: glowStrong,
    borderGradient: border,
    floorReflection: ['transparent', floorMid, refractLow],
    floorReflectionLocations: FLOOR_REFLECT_LOC,
    sceneBloom: glowStrong,
    sceneWashOpacity: 0.03,
    textVeil: TEXT_VEIL,
    textVeilLocations: TEXT_VEIL_LOC,
  };
}

export const vionaReferenceSemanticGlass: Record<VionaReferenceSemantic, VionaReferenceGlassSemanticTokens> = {
  emerald: semanticBase(
    'rgba(72, 210, 165, 0.42)',
    'rgba(72, 210, 165, 0.72)',
    'rgba(180, 255, 230, 0.62)',
    'rgba(120, 255, 210, 0.85)',
    'rgba(72, 210, 165, 0.55)',
    [
      'rgba(120, 255, 210, 0.95)',
      'rgba(72, 210, 165, 0.55)',
      'rgba(0, 0, 0, 0.35)',
      'rgba(0, 0, 0, 0.55)',
    ],
    'rgba(72, 210, 165, 0.14)',
    'rgba(72, 210, 165, 0.22)',
    'rgba(72, 210, 165, 0.16)'
  ),
  cyan: semanticBase(
    'rgba(92, 205, 255, 0.42)',
    'rgba(92, 205, 255, 0.72)',
    'rgba(190, 240, 255, 0.58)',
    'rgba(140, 220, 255, 0.85)',
    'rgba(92, 205, 255, 0.52)',
    [
      'rgba(160, 230, 255, 0.95)',
      'rgba(92, 205, 255, 0.52)',
      'rgba(0, 0, 0, 0.35)',
      'rgba(0, 0, 0, 0.55)',
    ],
    'rgba(92, 205, 255, 0.14)',
    'rgba(92, 205, 255, 0.22)',
    'rgba(92, 205, 255, 0.16)'
  ),
  gold: semanticBase(
    'rgba(246, 212, 110, 0.4)',
    'rgba(246, 212, 110, 0.7)',
    'rgba(255, 240, 190, 0.55)',
    'rgba(255, 230, 160, 0.88)',
    'rgba(246, 212, 110, 0.5)',
    [
      'rgba(255, 235, 170, 0.96)',
      'rgba(246, 212, 110, 0.5)',
      'rgba(0, 0, 0, 0.35)',
      'rgba(0, 0, 0, 0.55)',
    ],
    'rgba(246, 212, 110, 0.12)',
    'rgba(246, 212, 110, 0.2)',
    'rgba(246, 212, 110, 0.14)'
  ),
  violet: semanticBase(
    'rgba(178, 91, 255, 0.4)',
    'rgba(178, 91, 255, 0.68)',
    'rgba(220, 180, 255, 0.55)',
    'rgba(200, 150, 255, 0.85)',
    'rgba(178, 91, 255, 0.48)',
    [
      'rgba(210, 160, 255, 0.95)',
      'rgba(178, 91, 255, 0.48)',
      'rgba(0, 0, 0, 0.35)',
      'rgba(0, 0, 0, 0.55)',
    ],
    'rgba(178, 91, 255, 0.12)',
    'rgba(178, 91, 255, 0.2)',
    'rgba(178, 91, 255, 0.14)'
  ),
  magenta: semanticBase(
    'rgba(255, 110, 160, 0.38)',
    'rgba(255, 110, 160, 0.65)',
    'rgba(255, 190, 215, 0.52)',
    'rgba(255, 160, 200, 0.82)',
    'rgba(255, 110, 160, 0.45)',
    [
      'rgba(255, 170, 210, 0.94)',
      'rgba(255, 110, 160, 0.45)',
      'rgba(0, 0, 0, 0.35)',
      'rgba(0, 0, 0, 0.55)',
    ],
    'rgba(255, 110, 160, 0.12)',
    'rgba(255, 110, 160, 0.18)',
    'rgba(255, 110, 160, 0.12)'
  ),
  neutral: semanticBase(
    'rgba(160, 200, 230, 0.35)',
    'rgba(160, 200, 230, 0.55)',
    'rgba(210, 235, 255, 0.5)',
    'rgba(180, 220, 255, 0.75)',
    'rgba(92, 205, 255, 0.4)',
    [
      'rgba(180, 235, 255, 0.9)',
      'rgba(92, 205, 255, 0.4)',
      'rgba(0, 0, 0, 0.35)',
      'rgba(0, 0, 0, 0.55)',
    ],
    'rgba(92, 205, 255, 0.1)',
    'rgba(72, 210, 165, 0.16)',
    'rgba(92, 205, 255, 0.12)'
  ),
};

export const vionaReferencePanelGlass = {
  borderWidth: 1.35,
  shellFill: 'rgba(0, 1, 4, 0.34)',
  crystalGradient: [
    'rgba(2, 6, 12, 0.12)',
    'rgba(1, 4, 8, 0.03)',
    'transparent',
  ] as const,
  crystalLocations: [0, 0.35, 1] as const,
  borderGradient: [
    'rgba(160, 255, 220, 0.92)',
    'rgba(92, 205, 255, 0.65)',
    'rgba(0, 0, 0, 0.4)',
    'rgba(0, 0, 0, 0.55)',
  ] as const,
  innerRim: 'rgba(200, 245, 255, 0.55)',
  specularTop: SPECULAR_TOP,
  specularLocations: SPECULAR_LOC,
  cornerSpecular: CORNER_SPECULAR,
  topAccentRail: [
    'rgba(255, 255, 255, 0.42)',
    'rgba(160, 235, 255, 0.18)',
    'transparent',
  ] as const,
  horizonGlow: [
    'transparent',
    'rgba(72, 210, 165, 0.03)',
    'rgba(92, 205, 255, 0.1)',
    'transparent',
  ] as const,
  horizonLocations: [0.12, 0.66, 0.94, 1] as const,
  horizonHeightRatio: 0.2,
  flagshipFloorGlow: [
    'transparent',
    'rgba(72, 210, 165, 0.03)',
    'rgba(92, 205, 255, 0.08)',
  ] as const,
  flagshipFloorLocations: [0, 0.6, 1] as const,
  refractionGridOpacity: 0.18,
  skylineOpacity: 1,
  backdropBlurPx: 18,
  webOuterShadow:
    '0 0 0 1px rgba(200, 245, 255, 0.42), 0 0 28px rgba(72, 210, 165, 0.18), 0 0 48px rgba(92, 205, 255, 0.08), 0 12px 40px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(160,235,255,0.12)',
} as const;

export const vionaReferenceCardGlass = {
  borderWidth: 1.25,
  backdropBlurPx: 14,
  innerRimWidth: 1.05,
  innerRimOpacity: 1,
  specularHeightRatio: 0.17,
  refractionHeightRatio: 0.28,
  haloOpacity: 0.38,
  frameGlowOpacity: 0.9,
} as const;

export function vionaReferenceSemanticFromAccent(accent: VionaUniverseAccent): VionaReferenceSemantic {
  if (accent === 'emerald' || accent === 'assistant') return 'emerald';
  if (accent === 'cyan') return 'cyan';
  if (accent === 'gold') return 'gold';
  if (accent === 'violet') return 'violet';
  if (accent === 'magenta') return 'magenta';
  return 'neutral';
}

export function vionaReferenceTokensForAccent(accent: VionaUniverseAccent): VionaReferenceGlassSemanticTokens {
  return vionaReferenceSemanticGlass[vionaReferenceSemanticFromAccent(accent)];
}

export function vionaReferencePanelWebGlass(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const px = vionaReferencePanelGlass.backdropBlurPx;
  return {
    backdropFilter: `blur(${px}px) saturate(1.08)`,
    WebkitBackdropFilter: `blur(${px}px) saturate(1.08)`,
  } as ViewStyle;
}

export function vionaReferenceCardWebGlass(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const px = vionaReferenceCardGlass.backdropBlurPx;
  return {
    backdropFilter: `blur(${px}px) saturate(1.06)`,
    WebkitBackdropFilter: `blur(${px}px) saturate(1.06)`,
  } as ViewStyle;
}

export function vionaReferenceCardShellShadow(
  accent: VionaUniverseAccent,
  state: PremiumTileState = 'default'
): ViewStyle {
  const tokens = vionaReferenceTokensForAccent(accent);
  const hovered = state === 'hovered';
  return Platform.OS === 'web'
    ? ({
        boxShadow: `0 0 ${hovered ? 22 : 16}px ${tokens.edgeGlow}, 0 0 0 1px ${tokens.edgeHighlight}, 0 8px 24px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.22)`,
      } as ViewStyle)
    : {
        shadowColor: tokens.edgeGlow,
        shadowOpacity: hovered ? 0.45 : 0.32,
        shadowRadius: hovered ? 18 : 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: hovered ? 9 : 6,
      };
}

/** Lab-only — My Requests single-card replica proportions. */
export const vionaReferenceLabSingleCardMyRequests = {
  pageBackground: '#010408',
  cardWidth: 200,
  cardHeight: 296,
  cardBorderRadius: 14,
  borderWidth: 1,
  compareGap: 20,
  compareMaxWidth: 520,
  /** v3.1 — warmer emerald title (reference hue). */
  titleColor: 'rgba(98, 232, 168, 0.97)',
  subtitleColor: 'rgba(175, 205, 195, 0.68)',
} as const;

/** Lab-only — reference Local panel proportions (not production LocalScreen). */
export const vionaReferenceLabLocalPanel = {
  pageBackground: '#010408',
  panelMaxWidth: 920,
  panelBorderRadius: 16,
  cardBorderRadius: 12,
  cardAspect: 0.68,
  cardGap: 10,
  panelPadding: 14,
  headerGap: 4,
  desktopCardRowMinWidth: 620,
} as const;

export function vionaReferenceCtaOrbStyle(accent: VionaUniverseAccent): ViewStyle {
  const spec = premiumUniverseAccentSpec(accent);
  const tokens = vionaReferenceTokensForAccent(accent);
  return Platform.OS === 'web'
    ? ({
        borderColor: spec.stroke,
        backgroundColor: 'rgba(0, 4, 10, 0.62)',
        boxShadow: `0 0 14px ${tokens.edgeGlow}, inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.35)`,
      } as ViewStyle)
    : {
        borderColor: spec.stroke,
        backgroundColor: 'rgba(0, 4, 10, 0.62)',
      };
}
