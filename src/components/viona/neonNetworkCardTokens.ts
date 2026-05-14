/** VIONA.NEON.NETWORK.CARDS — Local-first global network neon-glass presets (visual only). */
export type NeonNetworkCardTier = 'hero' | 'service' | 'utility';

export type NeonNetworkColorFamily = 'emerald' | 'cyan' | 'gold' | 'violet' | 'magenta';

export const neonNetworkCard = {
  ink: '#F8FAFC',
  inkStrong: '#FFFFFF',
  inkMuted: 'rgba(226, 232, 240, 0.74)',
  inkCardSub: 'rgba(226, 232, 240, 0.84)',
  transitionMs: 170,
  tiers: {
    hero: {
      surfaceDefault: 'rgba(8, 14, 26, 0.44)',
      surfaceHover: 'rgba(8, 14, 26, 0.16)',
      glassTintDefault: 'rgba(148, 163, 184, 0.045)',
      glassTintHover: 'rgba(148, 163, 184, 0.008)',
      backdropBlur: 12,
      edgeWidth: 1.4,
      shadowOpacityDefault: 0.28,
      shadowOpacityHover: 0.52,
      shadowRadiusDefault: 16,
      shadowRadiusHover: 28,
      shadowLiftDefault: 4,
      shadowLiftHover: 10,
      familyAuraDefault: 0.24,
      familyAuraHover: 0.42,
      familyGlowDefault: 0.18,
      familyGlowHover: 0.36,
      cornerWashDefault: 0.34,
      cornerWashHover: 0.68,
      networkNodeDefault: 0.14,
      networkNodeHover: 0.28,
      networkSweepDefault: 0.1,
      networkSweepHover: 0.22,
      topHighlightDefault: 0.28,
      topHighlightHover: 0.56,
      hoverSheenOpacity: 0.28,
      hoverLiftPx: 2.5,
      hoverScale: 1.012,
    },
    service: {
      surfaceDefault: 'rgba(8, 14, 26, 0.52)',
      surfaceHover: 'rgba(8, 14, 26, 0.22)',
      glassTintDefault: 'rgba(148, 163, 184, 0.05)',
      glassTintHover: 'rgba(148, 163, 184, 0.012)',
      backdropBlur: 10,
      edgeWidth: 1.3,
      shadowOpacityDefault: 0.22,
      shadowOpacityHover: 0.46,
      shadowRadiusDefault: 14,
      shadowRadiusHover: 24,
      shadowLiftDefault: 4,
      shadowLiftHover: 8,
      familyAuraDefault: 0.2,
      familyAuraHover: 0.38,
      familyGlowDefault: 0.16,
      familyGlowHover: 0.32,
      cornerWashDefault: 0.3,
      cornerWashHover: 0.62,
      networkNodeDefault: 0.12,
      networkNodeHover: 0.24,
      networkSweepDefault: 0.08,
      networkSweepHover: 0.18,
      topHighlightDefault: 0.26,
      topHighlightHover: 0.5,
      hoverSheenOpacity: 0.24,
      hoverLiftPx: 2,
      hoverScale: 1.01,
    },
    utility: {
      surfaceDefault: 'rgba(10, 18, 32, 0.78)',
      surfaceHover: 'rgba(10, 18, 32, 0.64)',
      glassTintDefault: 'rgba(148, 163, 184, 0.035)',
      glassTintHover: 'rgba(148, 163, 184, 0.02)',
      backdropBlur: 6,
      edgeWidth: 1,
      shadowOpacityDefault: 0.1,
      shadowOpacityHover: 0.18,
      shadowRadiusDefault: 8,
      shadowRadiusHover: 12,
      shadowLiftDefault: 2,
      shadowLiftHover: 4,
      familyAuraDefault: 0.08,
      familyAuraHover: 0.14,
      familyGlowDefault: 0.06,
      familyGlowHover: 0.12,
      cornerWashDefault: 0.12,
      cornerWashHover: 0.22,
      networkNodeDefault: 0.05,
      networkNodeHover: 0.1,
      networkSweepDefault: 0.04,
      networkSweepHover: 0.08,
      topHighlightDefault: 0.14,
      topHighlightHover: 0.24,
      hoverSheenOpacity: 0.1,
      hoverLiftPx: 1,
      hoverScale: 1.004,
    },
  },
  families: {
    emerald: {
      ink: '#62FFE4',
      inkHover: '#A4FFED',
      stroke: 'rgba(98, 255, 228, 0.98)',
      strokeHover: 'rgba(120, 255, 232, 0.99)',
      glow: 'rgba(98, 255, 228, 0.38)',
      glowHover: 'rgba(98, 255, 228, 0.58)',
      statusFill: 'rgba(98, 255, 228, 0.2)',
      familyWashDefault: 'rgba(98, 255, 228, 0.08)',
      familyWashHover: 'rgba(98, 255, 228, 0.16)',
      networkNode: 'rgba(98, 255, 228, 0.22)',
    },
    cyan: {
      ink: '#84EEFF',
      inkHover: '#B4F4FF',
      stroke: 'rgba(132, 238, 255, 0.98)',
      strokeHover: 'rgba(148, 242, 255, 0.99)',
      glow: 'rgba(132, 238, 255, 0.38)',
      glowHover: 'rgba(132, 238, 255, 0.58)',
      statusFill: 'rgba(132, 238, 255, 0.2)',
      familyWashDefault: 'rgba(132, 238, 255, 0.08)',
      familyWashHover: 'rgba(132, 238, 255, 0.16)',
      networkNode: 'rgba(132, 238, 255, 0.22)',
    },
    gold: {
      ink: '#F6D46E',
      inkHover: '#FFE28E',
      stroke: 'rgba(246, 212, 110, 0.98)',
      strokeHover: 'rgba(252, 220, 118, 0.99)',
      glow: 'rgba(246, 212, 110, 0.4)',
      glowHover: 'rgba(246, 212, 110, 0.6)',
      statusFill: 'rgba(246, 212, 110, 0.22)',
      familyWashDefault: 'rgba(246, 212, 110, 0.1)',
      familyWashHover: 'rgba(246, 212, 110, 0.18)',
      networkNode: 'rgba(246, 212, 110, 0.24)',
    },
    violet: {
      ink: '#F4E6FF',
      inkHover: '#FAF0FF',
      stroke: 'rgba(244, 230, 255, 0.96)',
      strokeHover: 'rgba(248, 236, 255, 0.98)',
      glow: 'rgba(244, 230, 255, 0.38)',
      glowHover: 'rgba(244, 230, 255, 0.56)',
      statusFill: 'rgba(244, 230, 255, 0.2)',
      familyWashDefault: 'rgba(244, 230, 255, 0.08)',
      familyWashHover: 'rgba(244, 230, 255, 0.16)',
      networkNode: 'rgba(244, 230, 255, 0.22)',
    },
    magenta: {
      ink: '#FF6E8C',
      inkHover: '#FF94A8',
      stroke: 'rgba(255, 110, 140, 0.9)',
      strokeHover: 'rgba(255, 128, 152, 0.94)',
      glow: 'rgba(255, 110, 140, 0.28)',
      glowHover: 'rgba(255, 110, 140, 0.42)',
      statusFill: 'rgba(255, 110, 140, 0.18)',
      familyWashDefault: 'rgba(255, 110, 140, 0.07)',
      familyWashHover: 'rgba(255, 110, 140, 0.14)',
      networkNode: 'rgba(255, 110, 140, 0.18)',
    },
  },
} as const;

export function neonNetworkTierSpec(tier: NeonNetworkCardTier) {
  return neonNetworkCard.tiers[tier];
}

export function neonNetworkFamilySpec(family: NeonNetworkColorFamily) {
  return neonNetworkCard.families[family];
}

export function neonNetworkSurfaceFill(tier: NeonNetworkCardTier, hovered: boolean): string {
  const spec = neonNetworkTierSpec(tier);
  return hovered ? spec.surfaceHover : spec.surfaceDefault;
}

export function neonNetworkGlassTint(tier: NeonNetworkCardTier, hovered: boolean): string {
  const spec = neonNetworkTierSpec(tier);
  return hovered ? spec.glassTintHover : spec.glassTintDefault;
}

export function neonNetworkAccentInk(family: NeonNetworkColorFamily, hovered = false): string {
  const spec = neonNetworkFamilySpec(family);
  return hovered ? spec.inkHover : spec.ink;
}

export function neonNetworkAccentStroke(family: NeonNetworkColorFamily, hovered = false): string {
  const spec = neonNetworkFamilySpec(family);
  return hovered ? spec.strokeHover : spec.stroke;
}

export function neonNetworkAccentGlow(family: NeonNetworkColorFamily, hovered = false): string {
  const spec = neonNetworkFamilySpec(family);
  return hovered ? spec.glowHover : spec.glow;
}

export function neonNetworkAccentStatusFill(family: NeonNetworkColorFamily): string {
  return neonNetworkFamilySpec(family).statusFill;
}

export function neonNetworkFamilyWash(family: NeonNetworkColorFamily, hovered: boolean): string {
  const spec = neonNetworkFamilySpec(family);
  return hovered ? spec.familyWashHover : spec.familyWashDefault;
}

export function neonNetworkNodeGlow(family: NeonNetworkColorFamily): string {
  return neonNetworkFamilySpec(family).networkNode;
}

export function neonNetworkHoverLiftStyle(tier: NeonNetworkCardTier): Readonly<{
  translateY: number;
  scale: number;
}> {
  const spec = neonNetworkTierSpec(tier);
  return { translateY: -spec.hoverLiftPx, scale: spec.hoverScale };
}
