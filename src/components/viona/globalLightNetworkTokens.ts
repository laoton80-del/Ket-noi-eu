/** VIONA.GLOBAL.LIGHT.NETWORK.1 — named Global Light Network visual presets (no behavior). */

export const VIONA_GLOBAL_LIGHT_NETWORK_UI_NAME = 'VIONA Global Light Network UI' as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_CANVAS = {
  base: '#050B14',
  elevated: '#0A1220',
  fieldVeil: 'rgba(5, 11, 20, 0.34)',
  fieldVeilLight: 'rgba(5, 11, 20, 0.22)',
  arcGold: 'rgba(244, 214, 144, 0.22)',
  arcCyan: 'rgba(126, 232, 255, 0.18)',
  arcEmerald: 'rgba(98, 255, 228, 0.16)',
  arcViolet: 'rgba(244, 230, 255, 0.14)',
  nodeWash: 'rgba(148, 163, 184, 0.08)',
  nodeLine: 'rgba(148, 163, 184, 0.12)',
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY = {
  title: '#FFFFFF',
  titleIvory: '#F8FAFC',
  body: 'rgba(226, 232, 240, 0.82)',
  bodyMuted: 'rgba(186, 198, 214, 0.74)',
  label: 'rgba(226, 232, 240, 0.72)',
  labelTracking: 0.8,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET = {
  ink: '#F4E6FF',
  inkHover: '#FAF0FF',
  stroke: 'rgba(244, 230, 255, 0.96)',
  strokeHover: 'rgba(248, 236, 255, 0.98)',
  glow: 'rgba(244, 230, 255, 0.38)',
  glowHover: 'rgba(244, 230, 255, 0.56)',
  washDefault: 'rgba(244, 230, 255, 0.08)',
  washHover: 'rgba(244, 230, 255, 0.16)',
  statusFill: 'rgba(244, 230, 255, 0.2)',
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN = {
  ink: '#84EEFF',
  inkHover: '#B4F4FF',
  stroke: 'rgba(132, 238, 255, 0.98)',
  strokeHover: 'rgba(148, 242, 255, 0.99)',
  glow: 'rgba(132, 238, 255, 0.38)',
  glowHover: 'rgba(132, 238, 255, 0.58)',
  washDefault: 'rgba(132, 238, 255, 0.08)',
  washHover: 'rgba(132, 238, 255, 0.16)',
  statusFill: 'rgba(132, 238, 255, 0.2)',
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD = {
  ink: '#62FFE4',
  inkHover: '#A4FFED',
  stroke: 'rgba(98, 255, 228, 0.98)',
  strokeHover: 'rgba(120, 255, 232, 0.99)',
  glow: 'rgba(98, 255, 228, 0.38)',
  glowHover: 'rgba(98, 255, 228, 0.58)',
  washDefault: 'rgba(98, 255, 228, 0.08)',
  washHover: 'rgba(98, 255, 228, 0.16)',
  statusFill: 'rgba(98, 255, 228, 0.2)',
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD = {
  ink: '#F6D46E',
  inkHover: '#FFE28E',
  stroke: 'rgba(246, 212, 110, 0.98)',
  strokeHover: 'rgba(252, 220, 118, 0.99)',
  glow: 'rgba(246, 212, 110, 0.4)',
  glowHover: 'rgba(246, 212, 110, 0.6)',
  washDefault: 'rgba(246, 212, 110, 0.1)',
  washHover: 'rgba(246, 212, 110, 0.18)',
  statusFill: 'rgba(246, 212, 110, 0.22)',
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA = {
  ink: '#FF6E8C',
  inkHover: '#FF94A8',
  stroke: 'rgba(255, 110, 140, 0.9)',
  strokeHover: 'rgba(255, 128, 152, 0.94)',
  glow: 'rgba(255, 110, 140, 0.28)',
  glowHover: 'rgba(255, 110, 140, 0.42)',
  washDefault: 'rgba(255, 110, 140, 0.07)',
  washHover: 'rgba(255, 110, 140, 0.14)',
  statusFill: 'rgba(255, 110, 140, 0.18)',
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_FAMILIES = {
  violet: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET,
  cyan: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN,
  emerald: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD,
  gold: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD,
  magenta: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_ROLE_MAP = {
  violet: ['ai', 'academy', 'intelligence', 'learning'],
  cyan: ['travel', 'movement', 'discovery', 'network', 'language'],
  emerald: ['local', 'community', 'support', 'trust'],
  gold: ['premium', 'merchant', 'business', 'credits', 'primaryCta'],
  magenta: ['sos', 'urgent', 'safety', 'emergency'],
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_GLASS = {
  heroDefault: 'rgba(8, 14, 26, 0.44)',
  heroHover: 'rgba(8, 14, 26, 0.16)',
  serviceDefault: 'rgba(8, 14, 26, 0.52)',
  serviceHover: 'rgba(8, 14, 26, 0.22)',
  utilityDefault: 'rgba(10, 18, 32, 0.78)',
  utilityHover: 'rgba(10, 18, 32, 0.64)',
  tintDefault: 'rgba(148, 163, 184, 0.05)',
  tintHover: 'rgba(148, 163, 184, 0.012)',
  backdropBlurHeroPx: 12,
  backdropBlurServicePx: 10,
  backdropBlurUtilityPx: 6,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_BORDER = {
  heroWidthPx: 1.4,
  serviceWidthPx: 1.3,
  utilityWidthPx: 1,
  luminousInset: true,
  topHighlightDefault: 0.26,
  topHighlightHover: 0.52,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_GLOW = {
  heroShadowOpacityDefault: 0.28,
  heroShadowOpacityHover: 0.52,
  heroShadowRadiusDefault: 16,
  heroShadowRadiusHover: 28,
  serviceShadowOpacityDefault: 0.22,
  serviceShadowOpacityHover: 0.46,
  serviceShadowRadiusDefault: 14,
  serviceShadowRadiusHover: 24,
  utilityShadowOpacityDefault: 0.1,
  utilityShadowOpacityHover: 0.18,
  utilityShadowRadiusDefault: 8,
  utilityShadowRadiusHover: 12,
  networkNodeDefault: 0.12,
  networkNodeHover: 0.24,
  networkSweepDefault: 0.08,
  networkSweepHover: 0.18,
  iconChipDefault: 0.18,
  iconChipHover: 0.34,
  statusChipDefault: 0.2,
  statusChipHover: 0.36,
  ctaArrowDefault: 0.22,
  ctaArrowHover: 0.42,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_HOVER = {
  transitionMs: 170,
  timingFunction: 'ease-out',
  heroLiftPx: 2.5,
  heroScale: 1.012,
  serviceLiftPx: 2,
  serviceScale: 1.01,
  utilityLiftPx: 1,
  utilityScale: 1.004,
  revealBackground: true,
  brightenEdge: true,
  expandGlow: true,
  brightenIconChip: true,
  brightenStatusChip: true,
  brightenCtaArrow: true,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_TIER_HERO = {
  surfaceDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.heroDefault,
  surfaceHover: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.heroHover,
  backdropBlurPx: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.backdropBlurHeroPx,
  borderWidthPx: VIONA_GLOBAL_LIGHT_NETWORK_BORDER.heroWidthPx,
  glowOpacityDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.heroShadowOpacityDefault,
  glowOpacityHover: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.heroShadowOpacityHover,
  glowRadiusDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.heroShadowRadiusDefault,
  glowRadiusHover: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.heroShadowRadiusHover,
  hoverLiftPx: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.heroLiftPx,
  hoverScale: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.heroScale,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_TIER_SERVICE = {
  surfaceDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.serviceDefault,
  surfaceHover: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.serviceHover,
  backdropBlurPx: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.backdropBlurServicePx,
  borderWidthPx: VIONA_GLOBAL_LIGHT_NETWORK_BORDER.serviceWidthPx,
  glowOpacityDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.serviceShadowOpacityDefault,
  glowOpacityHover: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.serviceShadowOpacityHover,
  glowRadiusDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.serviceShadowRadiusDefault,
  glowRadiusHover: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.serviceShadowRadiusHover,
  hoverLiftPx: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.serviceLiftPx,
  hoverScale: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.serviceScale,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_TIER_UTILITY = {
  surfaceDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.utilityDefault,
  surfaceHover: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.utilityHover,
  backdropBlurPx: VIONA_GLOBAL_LIGHT_NETWORK_GLASS.backdropBlurUtilityPx,
  borderWidthPx: VIONA_GLOBAL_LIGHT_NETWORK_BORDER.utilityWidthPx,
  glowOpacityDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.utilityShadowOpacityDefault,
  glowOpacityHover: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.utilityShadowOpacityHover,
  glowRadiusDefault: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.utilityShadowRadiusDefault,
  glowRadiusHover: VIONA_GLOBAL_LIGHT_NETWORK_GLOW.utilityShadowRadiusHover,
  hoverLiftPx: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.utilityLiftPx,
  hoverScale: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.utilityScale,
} as const;

export const VIONA_GLOBAL_LIGHT_NETWORK_LOGO = {
  wordmarkPreferred: true,
  singleLockupPerViewport: true,
  anchorNotBadge: true,
  noHeavyBox: true,
  plateTransparent: true,
  wordmarkIvory: '#F6F1E8',
  wordmarkGold: '#F2E4C8',
  wordmarkMuted: 'rgba(232, 224, 210, 0.82)',
  glowGold: 'rgba(238, 206, 128, 0.28)',
  glowIvory: 'rgba(246, 241, 232, 0.2)',
  accentUnderline: 'rgba(242, 212, 136, 0.52)',
  heroLetterSpacing: 8,
  headerLetterSpacing: 5.5,
  compactLetterSpacing: 4,
  heroFontSize: 40,
  headerFontSize: 24,
  compactFontSize: 18,
  subtitleFontSize: 11,
  heroGlowRadiusPx: 10,
  headerGlowRadiusPx: 7,
  compactGlowRadiusPx: 5,
  iconOnlyGlowRadiusPx: 4,
  iconOnlyImageWidthPx: 168,
  iconOnlyImageHeightPx: 36,
  transitionMs: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.transitionMs,
} as const;

export type VionaGlobalLightNetworkLogoVariant = 'hero' | 'header' | 'compact' | 'iconOnly';
