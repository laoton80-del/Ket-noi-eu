/** GLOBAL.CARDS.NEON — shared neon-glass card language (visual only). */
export type NeonGlassCardTier = 'hero' | 'secondary' | 'utility';

export type NeonGlassColorFamily = 'emerald' | 'cyan' | 'gold' | 'violet' | 'magenta';

export const neonGlassCard = {
  ink: '#F8FAFC',
  inkStrong: '#FFFFFF',
  inkMuted: 'rgba(226, 232, 240, 0.72)',
  inkCardSub: 'rgba(226, 232, 240, 0.82)',
  transitionMs: 170,
  tiers: {
    hero: {
      surfaceDefault: 'rgba(8, 14, 26, 0.48)',
      surfaceHover: 'rgba(8, 14, 26, 0.18)',
      glassTintDefault: 'rgba(148, 163, 184, 0.05)',
      glassTintHover: 'rgba(148, 163, 184, 0.01)',
      backdropBlur: 12,
      edgeWidth: 1.35,
      shadowOpacityDefault: 0.24,
      shadowOpacityHover: 0.48,
      shadowRadiusDefault: 14,
      shadowRadiusHover: 26,
      shadowLiftDefault: 4,
      shadowLiftHover: 9,
      familyAuraDefault: 0.2,
      familyAuraHover: 0.38,
      familyGlowDefault: 0.16,
      familyGlowHover: 0.32,
      cornerWashDefault: 0.3,
      cornerWashHover: 0.62,
      topHighlightDefault: 0.26,
      topHighlightHover: 0.52,
      hoverSheenOpacity: 0.26,
      hoverLiftPx: 2.5,
      hoverScale: 1.012,
    },
    secondary: {
      surfaceDefault: 'rgba(8, 14, 26, 0.56)',
      surfaceHover: 'rgba(8, 14, 26, 0.24)',
      glassTintDefault: 'rgba(148, 163, 184, 0.05)',
      glassTintHover: 'rgba(148, 163, 184, 0.015)',
      backdropBlur: 10,
      edgeWidth: 1.25,
      shadowOpacityDefault: 0.2,
      shadowOpacityHover: 0.42,
      shadowRadiusDefault: 12,
      shadowRadiusHover: 22,
      shadowLiftDefault: 4,
      shadowLiftHover: 8,
      familyAuraDefault: 0.18,
      familyAuraHover: 0.34,
      familyGlowDefault: 0.14,
      familyGlowHover: 0.28,
      cornerWashDefault: 0.28,
      cornerWashHover: 0.58,
      topHighlightDefault: 0.24,
      topHighlightHover: 0.48,
      hoverSheenOpacity: 0.22,
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
      topHighlightDefault: 0.14,
      topHighlightHover: 0.24,
      hoverSheenOpacity: 0.1,
      hoverLiftPx: 1,
      hoverScale: 1.004,
    },
  },
  families: {
    emerald: {
      ink: '#5CFFE0',
      inkHover: '#9CFFEA',
      stroke: 'rgba(92, 255, 224, 0.96)',
      strokeHover: 'rgba(92, 255, 224, 0.98)',
      glow: 'rgba(92, 255, 224, 0.34)',
      glowHover: 'rgba(92, 255, 224, 0.54)',
      statusFill: 'rgba(92, 255, 224, 0.18)',
      familyWashDefault: 'rgba(92, 255, 224, 0.07)',
      familyWashHover: 'rgba(92, 255, 224, 0.14)',
    },
    cyan: {
      ink: '#7EE8FF',
      inkHover: '#A8F2FF',
      stroke: 'rgba(126, 232, 255, 0.96)',
      strokeHover: 'rgba(118, 236, 255, 0.98)',
      glow: 'rgba(126, 232, 255, 0.34)',
      glowHover: 'rgba(126, 232, 255, 0.54)',
      statusFill: 'rgba(126, 232, 255, 0.18)',
      familyWashDefault: 'rgba(126, 232, 255, 0.07)',
      familyWashHover: 'rgba(126, 232, 255, 0.14)',
    },
    gold: {
      ink: '#F2D06A',
      inkHover: '#FFE08A',
      stroke: 'rgba(242, 208, 106, 0.96)',
      strokeHover: 'rgba(248, 214, 98, 0.98)',
      glow: 'rgba(242, 208, 106, 0.36)',
      glowHover: 'rgba(242, 208, 106, 0.56)',
      statusFill: 'rgba(242, 208, 106, 0.2)',
      familyWashDefault: 'rgba(242, 208, 106, 0.08)',
      familyWashHover: 'rgba(242, 208, 106, 0.16)',
    },
    violet: {
      ink: '#F2E4FF',
      inkHover: '#F8EEFF',
      stroke: 'rgba(242, 228, 255, 0.94)',
      strokeHover: 'rgba(244, 230, 255, 0.96)',
      glow: 'rgba(242, 228, 255, 0.34)',
      glowHover: 'rgba(242, 228, 255, 0.52)',
      statusFill: 'rgba(242, 228, 255, 0.18)',
      familyWashDefault: 'rgba(242, 228, 255, 0.07)',
      familyWashHover: 'rgba(242, 228, 255, 0.14)',
    },
    magenta: {
      ink: '#FF6B8A',
      inkHover: '#FF8AA0',
      stroke: 'rgba(255, 107, 138, 0.88)',
      strokeHover: 'rgba(255, 122, 148, 0.94)',
      glow: 'rgba(255, 107, 138, 0.24)',
      glowHover: 'rgba(255, 107, 138, 0.38)',
      statusFill: 'rgba(255, 107, 138, 0.16)',
      familyWashDefault: 'rgba(255, 107, 138, 0.06)',
      familyWashHover: 'rgba(255, 107, 138, 0.12)',
    },
  },
} as const;

export function neonGlassTierSpec(tier: NeonGlassCardTier) {
  return neonGlassCard.tiers[tier];
}

export function neonGlassFamilySpec(family: NeonGlassColorFamily) {
  return neonGlassCard.families[family];
}

export function neonGlassSurfaceFill(tier: NeonGlassCardTier, hovered: boolean): string {
  const spec = neonGlassTierSpec(tier);
  return hovered ? spec.surfaceHover : spec.surfaceDefault;
}

export function neonGlassGlassTint(tier: NeonGlassCardTier, hovered: boolean): string {
  const spec = neonGlassTierSpec(tier);
  return hovered ? spec.glassTintHover : spec.glassTintDefault;
}

export function neonGlassAccentInk(family: NeonGlassColorFamily, hovered = false): string {
  const spec = neonGlassFamilySpec(family);
  return hovered ? spec.inkHover : spec.ink;
}

export function neonGlassAccentStroke(family: NeonGlassColorFamily, hovered = false): string {
  const spec = neonGlassFamilySpec(family);
  return hovered ? spec.strokeHover : spec.stroke;
}

export function neonGlassAccentGlow(family: NeonGlassColorFamily, hovered = false): string {
  const spec = neonGlassFamilySpec(family);
  return hovered ? spec.glowHover : spec.glow;
}

export function neonGlassAccentStatusFill(family: NeonGlassColorFamily): string {
  return neonGlassFamilySpec(family).statusFill;
}

export function neonGlassFamilyWash(family: NeonGlassColorFamily, hovered: boolean): string {
  const spec = neonGlassFamilySpec(family);
  return hovered ? spec.familyWashHover : spec.familyWashDefault;
}

export function neonGlassHoverLiftStyle(tier: NeonGlassCardTier): Readonly<{
  translateY: number;
  scale: number;
}> {
  const spec = neonGlassTierSpec(tier);
  return { translateY: -spec.hoverLiftPx, scale: spec.hoverScale };
}

export function neonGlassFashionAccentToFamily(
  accent: 'local' | 'travel' | 'academy' | 'business' | 'care'
): NeonGlassColorFamily {
  switch (accent) {
    case 'local':
      return 'emerald';
    case 'travel':
      return 'cyan';
    case 'academy':
      return 'violet';
    case 'business':
      return 'gold';
    case 'care':
      return 'magenta';
    default: {
      const exhaustive: never = accent;
      return exhaustive;
    }
  }
}
