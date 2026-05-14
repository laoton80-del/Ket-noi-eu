/** VIONA.GLOBAL.NETWORK.UI.1 — named Global Network visual presets (no behavior). */

export const VIONA_GLOBAL_NETWORK_UI_NAME = 'VIONA Global Network UI' as const;

export const VIONA_GLOBAL_NETWORK_CANVAS = {
  base: '#050B14',
  elevated: '#0A1220',
  veil: 'rgba(5, 11, 20, 0.34)',
  arcGold: 'rgba(244, 214, 144, 0.22)',
  arcCyan: 'rgba(126, 232, 255, 0.18)',
  arcEmerald: 'rgba(98, 255, 228, 0.16)',
  nodeWash: 'rgba(148, 163, 184, 0.08)',
} as const;

export const VIONA_GLOBAL_NETWORK_TYPOGRAPHY = {
  title: '#FFFFFF',
  titleIvory: '#F8FAFC',
  body: 'rgba(226, 232, 240, 0.82)',
  bodyMuted: 'rgba(186, 198, 214, 0.74)',
  label: 'rgba(226, 232, 240, 0.72)',
  labelTracking: 0.8,
} as const;

export const VIONA_GLOBAL_NETWORK_ACCENT_VIOLET = {
  ink: '#F4E6FF',
  stroke: 'rgba(244, 230, 255, 0.96)',
  glow: 'rgba(244, 230, 255, 0.38)',
} as const;

export const VIONA_GLOBAL_NETWORK_ACCENT_CYAN = {
  ink: '#84EEFF',
  stroke: 'rgba(132, 238, 255, 0.98)',
  glow: 'rgba(132, 238, 255, 0.38)',
} as const;

export const VIONA_GLOBAL_NETWORK_ACCENT_EMERALD = {
  ink: '#62FFE4',
  stroke: 'rgba(98, 255, 228, 0.98)',
  glow: 'rgba(98, 255, 228, 0.38)',
} as const;

export const VIONA_GLOBAL_NETWORK_ACCENT_GOLD = {
  ink: '#F6D46E',
  stroke: 'rgba(246, 212, 110, 0.98)',
  glow: 'rgba(246, 212, 110, 0.4)',
} as const;

export const VIONA_GLOBAL_NETWORK_ACCENT_MAGENTA = {
  ink: '#FF6E8C',
  stroke: 'rgba(255, 110, 140, 0.9)',
  glow: 'rgba(255, 110, 140, 0.28)',
} as const;

export const VIONA_GLOBAL_NETWORK_ROLE_MAP = {
  violet: ['ai', 'academy', 'intelligence', 'prediction', 'learning'],
  cyan: ['travel', 'movement', 'network', 'language', 'discovery', 'connection'],
  emerald: ['local', 'community', 'growth', 'support', 'trust'],
  gold: ['premium', 'merchant', 'business', 'protect', 'credits', 'primaryCta'],
  magenta: ['sos', 'urgent', 'safety', 'emergency', 'heartCare'],
} as const;

export const VIONA_GLOBAL_NETWORK_GLASS = {
  deepDefault: 'rgba(8, 14, 26, 0.52)',
  deepHover: 'rgba(8, 14, 26, 0.22)',
  utilityDefault: 'rgba(10, 18, 32, 0.78)',
  utilityHover: 'rgba(10, 18, 32, 0.64)',
  tintDefault: 'rgba(148, 163, 184, 0.05)',
  tintHover: 'rgba(148, 163, 184, 0.012)',
  backdropBlurHeroPx: 12,
  backdropBlurServicePx: 10,
  backdropBlurUtilityPx: 6,
} as const;

export const VIONA_GLOBAL_NETWORK_BORDER = {
  heroWidthPx: 1.4,
  serviceWidthPx: 1.3,
  utilityWidthPx: 1,
  luminousInset: true,
} as const;

export const VIONA_GLOBAL_NETWORK_GLOW = {
  heroShadowOpacityDefault: 0.28,
  heroShadowOpacityHover: 0.52,
  serviceShadowOpacityDefault: 0.22,
  serviceShadowOpacityHover: 0.46,
  utilityShadowOpacityDefault: 0.1,
  utilityShadowOpacityHover: 0.18,
  networkNodeDefault: 0.12,
  networkNodeHover: 0.24,
  networkSweepDefault: 0.08,
  networkSweepHover: 0.18,
} as const;

export const VIONA_GLOBAL_NETWORK_HOVER = {
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
} as const;

export const VIONA_GLOBAL_NETWORK_TIER_HERO = {
  surfaceDefault: VIONA_GLOBAL_NETWORK_GLASS.deepDefault,
  surfaceHover: 'rgba(8, 14, 26, 0.16)',
  glowDefault: VIONA_GLOBAL_NETWORK_GLOW.heroShadowOpacityDefault,
  glowHover: VIONA_GLOBAL_NETWORK_GLOW.heroShadowOpacityHover,
} as const;

export const VIONA_GLOBAL_NETWORK_TIER_SERVICE = {
  surfaceDefault: VIONA_GLOBAL_NETWORK_GLASS.deepDefault,
  surfaceHover: VIONA_GLOBAL_NETWORK_GLASS.deepHover,
  glowDefault: VIONA_GLOBAL_NETWORK_GLOW.serviceShadowOpacityDefault,
  glowHover: VIONA_GLOBAL_NETWORK_GLOW.serviceShadowOpacityHover,
} as const;

export const VIONA_GLOBAL_NETWORK_TIER_UTILITY = {
  surfaceDefault: VIONA_GLOBAL_NETWORK_GLASS.utilityDefault,
  surfaceHover: VIONA_GLOBAL_NETWORK_GLASS.utilityHover,
  glowDefault: VIONA_GLOBAL_NETWORK_GLOW.utilityShadowOpacityDefault,
  glowHover: VIONA_GLOBAL_NETWORK_GLOW.utilityShadowOpacityHover,
} as const;

export const VIONA_GLOBAL_NETWORK_LOGO = {
  useAssetPreferred: true,
  singleLockupPerViewport: true,
  plateTransparent: true,
  anchorNotBadge: true,
} as const;
