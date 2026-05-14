/** GLOBAL.NEON.CARDS.1 — named Neon Glass card presets (visual only; no behavior). */

export const NEON_CARD_INK = {
  primary: '#F8FAFC',
  strong: '#FFFFFF',
  muted: 'rgba(226, 232, 240, 0.72)',
  cardSub: 'rgba(226, 232, 240, 0.82)',
} as const;

export const NEON_CARD_GLASS_NEUTRAL = {
  tintDefault: 'rgba(148, 163, 184, 0.05)',
  tintHover: 'rgba(148, 163, 184, 0.01)',
  tintUtilityDefault: 'rgba(148, 163, 184, 0.035)',
  tintUtilityHover: 'rgba(148, 163, 184, 0.02)',
} as const;

export const NEON_CARD_TIER_HERO = {
  surfaceDefault: 'rgba(8, 14, 26, 0.48)',
  surfaceHover: 'rgba(8, 14, 26, 0.18)',
  glassTintDefault: 'rgba(148, 163, 184, 0.05)',
  glassTintHover: 'rgba(148, 163, 184, 0.01)',
  backdropBlurPx: 12,
  borderWidthPx: 1.35,
  shadowOpacityDefault: 0.24,
  shadowOpacityHover: 0.48,
  shadowRadiusDefaultPx: 14,
  shadowRadiusHoverPx: 26,
  shadowLiftDefaultPx: 4,
  shadowLiftHoverPx: 9,
  familyAuraOpacityDefault: 0.2,
  familyAuraOpacityHover: 0.38,
  familyGlowOpacityDefault: 0.16,
  familyGlowOpacityHover: 0.32,
  cornerWashOpacityDefault: 0.3,
  cornerWashOpacityHover: 0.62,
  topHighlightOpacityDefault: 0.26,
  topHighlightOpacityHover: 0.52,
  hoverSheenOpacity: 0.26,
  hoverLiftPx: 2.5,
  hoverScale: 1.012,
} as const;

export const NEON_CARD_TIER_SECONDARY = {
  surfaceDefault: 'rgba(8, 14, 26, 0.56)',
  surfaceHover: 'rgba(8, 14, 26, 0.24)',
  glassTintDefault: 'rgba(148, 163, 184, 0.05)',
  glassTintHover: 'rgba(148, 163, 184, 0.015)',
  backdropBlurPx: 10,
  borderWidthPx: 1.25,
  shadowOpacityDefault: 0.2,
  shadowOpacityHover: 0.42,
  shadowRadiusDefaultPx: 12,
  shadowRadiusHoverPx: 22,
  shadowLiftDefaultPx: 4,
  shadowLiftHoverPx: 8,
  familyAuraOpacityDefault: 0.18,
  familyAuraOpacityHover: 0.34,
  familyGlowOpacityDefault: 0.14,
  familyGlowOpacityHover: 0.28,
  cornerWashOpacityDefault: 0.28,
  cornerWashOpacityHover: 0.58,
  topHighlightOpacityDefault: 0.24,
  topHighlightOpacityHover: 0.48,
  hoverSheenOpacity: 0.22,
  hoverLiftPx: 2,
  hoverScale: 1.01,
} as const;

export const NEON_CARD_TIER_UTILITY = {
  surfaceDefault: 'rgba(10, 18, 32, 0.78)',
  surfaceHover: 'rgba(10, 18, 32, 0.64)',
  glassTintDefault: 'rgba(148, 163, 184, 0.035)',
  glassTintHover: 'rgba(148, 163, 184, 0.02)',
  backdropBlurPx: 6,
  borderWidthPx: 1,
  shadowOpacityDefault: 0.1,
  shadowOpacityHover: 0.18,
  shadowRadiusDefaultPx: 8,
  shadowRadiusHoverPx: 12,
  shadowLiftDefaultPx: 2,
  shadowLiftHoverPx: 4,
  familyAuraOpacityDefault: 0.08,
  familyAuraOpacityHover: 0.14,
  familyGlowOpacityDefault: 0.06,
  familyGlowOpacityHover: 0.12,
  cornerWashOpacityDefault: 0.12,
  cornerWashOpacityHover: 0.22,
  topHighlightOpacityDefault: 0.14,
  topHighlightOpacityHover: 0.24,
  hoverSheenOpacity: 0.1,
  hoverLiftPx: 1,
  hoverScale: 1.004,
} as const;

export const NEON_CARD_BORDER = {
  crispInsetStroke: true,
  luminousEdge: true,
  heroWidthPx: NEON_CARD_TIER_HERO.borderWidthPx,
  secondaryWidthPx: NEON_CARD_TIER_SECONDARY.borderWidthPx,
  utilityWidthPx: NEON_CARD_TIER_UTILITY.borderWidthPx,
} as const;

export const NEON_CARD_HOVER = {
  transitionMs: 170,
  timingFunction: 'ease-out',
  revealBackground: true,
  brightenEdge: true,
  intensifyGlow: true,
  brightenCtaInk: true,
  heroLiftPx: NEON_CARD_TIER_HERO.hoverLiftPx,
  heroScale: NEON_CARD_TIER_HERO.hoverScale,
  secondaryLiftPx: NEON_CARD_TIER_SECONDARY.hoverLiftPx,
  secondaryScale: NEON_CARD_TIER_SECONDARY.hoverScale,
  utilityLiftPx: NEON_CARD_TIER_UTILITY.hoverLiftPx,
  utilityScale: NEON_CARD_TIER_UTILITY.hoverScale,
} as const;

export const NEON_CARD_FAMILY_EMERALD = {
  ink: '#5CFFE0',
  inkHover: '#9CFFEA',
  stroke: 'rgba(92, 255, 224, 0.96)',
  strokeHover: 'rgba(92, 255, 224, 0.98)',
  glow: 'rgba(92, 255, 224, 0.34)',
  glowHover: 'rgba(92, 255, 224, 0.54)',
  statusFill: 'rgba(92, 255, 224, 0.18)',
  familyWashDefault: 'rgba(92, 255, 224, 0.07)',
  familyWashHover: 'rgba(92, 255, 224, 0.14)',
  iconGlowOpacityDefault: 0.16,
  iconGlowOpacityHover: 0.44,
} as const;

export const NEON_CARD_FAMILY_CYAN = {
  ink: '#7EE8FF',
  inkHover: '#A8F2FF',
  stroke: 'rgba(126, 232, 255, 0.96)',
  strokeHover: 'rgba(118, 236, 255, 0.98)',
  glow: 'rgba(126, 232, 255, 0.34)',
  glowHover: 'rgba(126, 232, 255, 0.54)',
  statusFill: 'rgba(126, 232, 255, 0.18)',
  familyWashDefault: 'rgba(126, 232, 255, 0.07)',
  familyWashHover: 'rgba(126, 232, 255, 0.14)',
  iconGlowOpacityDefault: 0.16,
  iconGlowOpacityHover: 0.44,
} as const;

export const NEON_CARD_FAMILY_GOLD = {
  ink: '#F2D06A',
  inkHover: '#FFE08A',
  stroke: 'rgba(242, 208, 106, 0.96)',
  strokeHover: 'rgba(248, 214, 98, 0.98)',
  glow: 'rgba(242, 208, 106, 0.36)',
  glowHover: 'rgba(242, 208, 106, 0.56)',
  statusFill: 'rgba(242, 208, 106, 0.2)',
  familyWashDefault: 'rgba(242, 208, 106, 0.08)',
  familyWashHover: 'rgba(242, 208, 106, 0.16)',
  iconGlowOpacityDefault: 0.18,
  iconGlowOpacityHover: 0.46,
} as const;

export const NEON_CARD_FAMILY_VIOLET = {
  ink: '#F2E4FF',
  inkHover: '#F8EEFF',
  stroke: 'rgba(242, 228, 255, 0.94)',
  strokeHover: 'rgba(244, 230, 255, 0.96)',
  glow: 'rgba(242, 228, 255, 0.34)',
  glowHover: 'rgba(242, 228, 255, 0.52)',
  statusFill: 'rgba(242, 228, 255, 0.18)',
  familyWashDefault: 'rgba(242, 228, 255, 0.07)',
  familyWashHover: 'rgba(242, 228, 255, 0.14)',
  iconGlowOpacityDefault: 0.16,
  iconGlowOpacityHover: 0.44,
} as const;

export const NEON_CARD_FAMILY_MAGENTA = {
  ink: '#FF6B8A',
  inkHover: '#FF8AA0',
  stroke: 'rgba(255, 107, 138, 0.88)',
  strokeHover: 'rgba(255, 122, 148, 0.94)',
  glow: 'rgba(255, 107, 138, 0.24)',
  glowHover: 'rgba(255, 107, 138, 0.38)',
  statusFill: 'rgba(255, 107, 138, 0.16)',
  familyWashDefault: 'rgba(255, 107, 138, 0.06)',
  familyWashHover: 'rgba(255, 107, 138, 0.12)',
  iconGlowOpacityDefault: 0.12,
  iconGlowOpacityHover: 0.32,
} as const;

export const NEON_CARD_GLOW_PRESET = {
  heroOuterShadowOpacityDefault: NEON_CARD_TIER_HERO.shadowOpacityDefault,
  heroOuterShadowOpacityHover: NEON_CARD_TIER_HERO.shadowOpacityHover,
  secondaryOuterShadowOpacityDefault: NEON_CARD_TIER_SECONDARY.shadowOpacityDefault,
  secondaryOuterShadowOpacityHover: NEON_CARD_TIER_SECONDARY.shadowOpacityHover,
  utilityOuterShadowOpacityDefault: NEON_CARD_TIER_UTILITY.shadowOpacityDefault,
  utilityOuterShadowOpacityHover: NEON_CARD_TIER_UTILITY.shadowOpacityHover,
} as const;
