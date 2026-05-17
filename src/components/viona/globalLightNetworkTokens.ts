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

/** Union of all Global Light Network accent token objects (for props / maps that vary by accent). */
export type VionaGlobalLightNetworkAccentTokens =
  (typeof VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_FAMILIES)[keyof typeof VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_FAMILIES];

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

/**
 * VIONA.GLOBAL.GLASS.READABILITY.1 — **Readable glass recipe for off-Home surfaces** (field-visible, copy sharp).
 *
 * **Home is excluded:** `HomeScreen`, `VionaFashionWorldCard`, and Home hero/card assets stay on their **approved**
 * implementation — use them as the **visual reference only**. Wire this object on **Account, Local, Travel,
 * Identity, Auth, Merchant, B2B Paywall**, and other non-Home frames.
 *
 * **Layering doctrine:** apply `backdrop-filter` / frosted fill only on an **absolute background slab**
 * (`pointerEvents: 'none'`, z-index below content). **Never** attach blur or “card opacity” to a wrapper that
 * owns `Text` / icons / inputs.
 */
export const VIONA_GLOBAL_LIGHT_NETWORK_GLASS_READABLE = {
  defaultFill: 'rgba(7, 12, 26, 0.5)',
  hoverFill: 'rgba(7, 12, 26, 0.38)',
  heroFill: 'rgba(6, 12, 24, 0.56)',
  heroHoverFill: 'rgba(6, 12, 24, 0.36)',
  utilityFill: 'rgba(7, 12, 26, 0.46)',
  utilityHoverFill: 'rgba(7, 12, 26, 0.36)',
  /** Web: blur the **page** behind the glass slab only — max ~10px to avoid Vaseline fog. */
  backdropBlurWebDefault: 8,
  backdropBlurWebHover: 6,
  backdropBlurWebHero: 10,
  backdropBlurWebHeroHover: 8,
  /** Native: keep low; frames may skip blur and rely on fill + tint for performance. */
  mobileBackdropBlur: 4,
  borderOpacity: 0.92,
  hoverBorderOpacity: 0.97,
  innerHighlight: 'rgba(255, 255, 255, 0.08)',
  innerHighlightHover: 'rgba(255, 255, 255, 0.1)',
  contentTextPrimary: VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY.titleIvory,
  contentTextSecondary: VIONA_GLOBAL_LIGHT_NETWORK_TYPOGRAPHY.body,
  layeringNote: 'BACKGROUND_BLUR_LAYER_ONLY' as const,
} as const;

/**
 * VIONA.LANGUAGE.SHEET.GLOBAL.GLASS.1 — Smart Trio language / market sheet (visual tokens only).
 * Used by `SmartTrioLanguageSheet`; no blur on text layers — fills + strokes only.
 */
export const VIONA_GLOBAL_LIGHT_NETWORK_LANGUAGE_SHEET = {
  backdrop: 'rgba(0, 0, 0, 0.48)',
  panelFill: 'rgba(8, 12, 28, 0.78)',
  panelBorder: 'rgba(102, 217, 255, 0.46)',
  panelGoldHairline: 'rgba(244, 214, 144, 0.2)',
  sectionWash: 'rgba(12, 18, 38, 0.48)',
  innerTopHighlight: 'rgba(255, 255, 255, 0.1)',
  titleIvory: '#F8FAFC',
  subtitleCool: 'rgba(186, 205, 226, 0.84)',
  sectionLabelCyan: 'rgba(126, 232, 255, 0.96)',
  optionIdleBorder: 'rgba(255, 255, 255, 0.11)',
  optionIdleFill: 'rgba(255, 255, 255, 0.055)',
  optionHoverBorder: 'rgba(132, 238, 255, 0.58)',
  optionHoverFill: 'rgba(255, 255, 255, 0.09)',
  optionSelectedBorder: 'rgba(105, 245, 255, 0.92)',
  optionSelectedFill: 'rgba(20, 40, 58, 0.48)',
  optionGlow: 'rgba(80, 220, 255, 0.22)',
  readonlyLabel: 'rgba(186, 198, 214, 0.72)',
  readonlyValue: 'rgba(241, 245, 249, 0.94)',
  notice: 'rgba(186, 198, 214, 0.66)',
  closePillBorder: 'rgba(246, 212, 110, 0.52)',
  closePillGlow: 'rgba(132, 238, 255, 0.16)',
  closePillFill: 'rgba(10, 18, 34, 0.76)',
  closeLabel: 'rgba(248, 250, 252, 0.96)',
  check: '#69F5FF',
  checkMuted: 'rgba(255, 255, 255, 0.32)',
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

/**
 * VIONA.HOME.CANONICAL.STYLE.1 — **Home** as the canonical **Global Light Network** card reference.
 * Numeric targets for future rollout packs; **not** auto-wired to screens. Prefer aligning fills, blur, and glow
 * to these bands before pushing accent saturation. See `docs/design/VIONA_HUMAN_CONSTELLATION_DESIGN_SYSTEM.md` §14.10.
 */
export const VIONA_GLOBAL_LIGHT_NETWORK_HOME_CANONICAL = {
  reference: 'home' as const,
  /** Card body translucency (alpha on dark glass layer) — keep field visible; utility may sit higher. */
  cardFillAlphaGuidance: {
    hero: { default: 0.42, hover: 0.18 },
    service: { default: 0.48, hover: 0.22 },
    utility: { default: 0.62, hover: 0.48 },
  },
  /** Luminous stroke: crisp, thin; avoid tube-thick rims. */
  borderGuidance: {
    /** Typical stroke alpha on accent RGBA strings used for edges */
    strokeAlphaTarget: 0.94,
    maxWidthPx: 1.4,
  },
  /** Outer glow / drop-shadow discipline — low–medium only. */
  glowGuidance: {
    shadowRadiusDefaultMaxPx: 18,
    shadowRadiusHoverMaxPx: 26,
    shadowOpacityDefaultMax: 0.32,
    shadowOpacityHoverMax: 0.52,
    /** Above this radius, glow tends to merge tiles — treat as anti-pattern unless hero-only. */
    avoidBloomRadiusBeyondPx: 34,
  },
  hoverGuidance: {
    liftPxPreferred: 2,
    liftPxHeroMax: 2.5,
    transitionMsPreferred: 170,
    scaleMax: 1.012,
  },
  /** Refined glass: low blur + controlled tint — avoids muddy “frosted fog.” */
  backdropBlurGuidance: {
    heroMaxPx: 10,
    serviceMaxPx: 8,
    utilityMaxPx: 6,
    glassTintMaxAlpha: 0.06,
  },
  densityGuidance: {
    preferMoreNegativeSpace: true,
    suggestedGridGapPx: 16,
    reduceCardMassBeforeGlow: true,
  },
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

/**
 * VIONA.B2B.PAYWALL.TIER3 — restrained commerce / upgrade glass (lower chroma than hero hubs).
 * Numeric bands only; screens wire imagery + copy. No payment behavior.
 */
export const VIONA_GLOBAL_LIGHT_NETWORK_PAYWALL_TIER3 = {
  backdropOpacityDesktop: 0.5,
  backdropOpacityMobile: 0.37,
  backdropVeil: 'rgba(5, 11, 20, 0.36)',
  heroPanel: 'rgba(8, 14, 26, 0.48)',
  trapStrip: 'rgba(7, 12, 26, 0.46)',
  metricPanel: 'rgba(8, 12, 28, 0.50)',
  planPanel: 'rgba(7, 12, 26, 0.50)',
  planPanelHover: 'rgba(7, 12, 26, 0.38)',
  planPanelRecommended: 'rgba(38, 27, 7, 0.48)',
  planPanelRecommendedHover: 'rgba(38, 27, 7, 0.38)',
  borderCyan: 'rgba(102, 217, 255, 0.64)',
  borderCyanHover: 'rgba(132, 238, 255, 0.82)',
  borderGold: 'rgba(255, 215, 106, 0.78)',
  borderGoldHover: 'rgba(255, 225, 125, 0.95)',
  borderHybrid: 'rgba(102, 217, 255, 0.58)',
  ctaGoldFill: 'rgba(246, 212, 110, 0.14)',
  ctaGoldFillHover: 'rgba(246, 212, 110, 0.22)',
  secondaryOutline: 'rgba(148, 163, 184, 0.38)',
  secondaryFill: 'rgba(8, 14, 26, 0.34)',
  secondaryFillHover: 'rgba(8, 14, 26, 0.28)',
  transitionMs: 180,
} as const;

/**
 * VIONA.AUTH.LOGIN.COMPACT.GLASS — Login entry glass (Home-canonical: light panel, crisp cyan/gold edges).
 * Visual tokens only; screens own layout.
 */
export const VIONA_AUTH_LOGIN_GLASS = {
  panel: 'rgba(7, 12, 26, 0.50)',
  panelVeilTop: 'rgba(112, 200, 255, 0.04)',
  inputFill: 'rgba(7, 12, 26, 0.48)',
  inputFillFocus: 'rgba(7, 12, 26, 0.38)',
  codeChipFill: 'rgba(7, 12, 26, 0.46)',
  borderPanel: 'rgba(102, 217, 255, 0.58)',
  borderPanelWeb: 'rgba(102, 217, 255, 0.62)',
  borderInput: 'rgba(102, 217, 255, 0.50)',
  borderInputFocus: 'rgba(120, 228, 255, 0.88)',
  borderGold: 'rgba(255, 215, 106, 0.80)',
  borderGoldHover: 'rgba(255, 225, 125, 0.94)',
  ctaFill: 'rgba(246, 212, 110, 0.18)',
  ctaFillHover: 'rgba(246, 212, 110, 0.28)',
  ctaDisabledFill: 'rgba(7, 12, 26, 0.44)',
  innerHighlight: 'rgba(255, 255, 255, 0.10)',
  backdropOverlay: 'rgba(7, 9, 14, 0.16)',
  constellationOpacity: 0.7,
  focusGlowCyan: 'rgba(80, 220, 255, 0.16)',
  focusGlowCyanStrong: 'rgba(90, 228, 255, 0.22)',
  ctaGlowGold: 'rgba(255, 210, 90, 0.18)',
  ctaGlowGoldHover: 'rgba(255, 215, 106, 0.26)',
  transitionMs: 170,
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
  headerLetterSpacing: 6.75,
  compactLetterSpacing: 4.75,
  heroFontSize: 40,
  headerFontSize: 24,
  compactFontSize: 18,
  subtitleFontSize: 11,
  heroGlowRadiusPx: 10,
  headerGlowRadiusPx: 8,
  compactGlowRadiusPx: 6,
  iconOnlyGlowRadiusPx: 4,
  iconOnlyImageWidthPx: 168,
  iconOnlyImageHeightPx: 36,
  transitionMs: VIONA_GLOBAL_LIGHT_NETWORK_HOVER.transitionMs,
} as const;

export type VionaGlobalLightNetworkLogoVariant = 'hero' | 'header' | 'compact' | 'iconOnly';

/** VIONA.ACCOUNT.NEON.GLASS — Account / Identity / Settings glass surfaces (crisp edge, low blur). */
export const VIONA_ACCOUNT_NEON_GLASS = {
  panelDefault: 'rgba(7, 12, 26, 0.42)',
  panelElevated: 'rgba(7, 12, 26, 0.40)',
  panelHover: 'rgba(7, 12, 26, 0.32)',
  panelIdentity: 'rgba(7, 12, 26, 0.44)',
  panelIdentityHover: 'rgba(7, 12, 26, 0.34)',
  glassTint: 'rgba(148, 163, 184, 0.014)',
  glassTintHover: 'rgba(148, 163, 184, 0.008)',
  backdropBlurPx: 2,
  shadowOpacityDefault: 0.32,
  shadowOpacityHover: 0.52,
  shadowRadiusDefault: 11,
  shadowRadiusHover: 20,
  shadowLiftDefault: 2,
  shadowLiftHover: 5,
  bottomDepth: 'rgba(2, 6, 14, 0.32)',
  transitionMs: 170,
} as const;

export type VionaAccountNeonRole = 'gold' | 'cyan' | 'emerald' | 'violet' | 'magenta';

export const VIONA_ACCOUNT_ROLE_ACCENTS = {
  gold: {
    ink: '#F6D46E',
    stroke: 'rgba(255, 218, 120, 0.93)',
    strokeHover: 'rgba(255, 225, 132, 0.98)',
    glow: 'rgba(255, 199, 71, 0.24)',
    glowHover: 'rgba(255, 205, 96, 0.32)',
    cornerWash: 'rgba(255, 199, 71, 0.09)',
    cornerWashHover: 'rgba(255, 199, 71, 0.14)',
    fillHover: 'rgba(255, 199, 71, 0.09)',
    fillPressed: 'rgba(255, 199, 71, 0.12)',
  },
  cyan: {
    ink: '#66D9FF',
    stroke: 'rgba(110, 224, 255, 0.93)',
    strokeHover: 'rgba(128, 236, 255, 0.98)',
    glow: 'rgba(35, 183, 255, 0.24)',
    glowHover: 'rgba(55, 200, 255, 0.32)',
    cornerWash: 'rgba(35, 183, 255, 0.08)',
    cornerWashHover: 'rgba(35, 183, 255, 0.13)',
    fillHover: 'rgba(35, 183, 255, 0.08)',
    fillPressed: 'rgba(35, 183, 255, 0.11)',
  },
  emerald: {
    ink: '#4FF5C6',
    stroke: 'rgba(64, 245, 198, 0.9)',
    strokeHover: 'rgba(82, 250, 206, 0.94)',
    glow: 'rgba(64, 245, 198, 0.24)',
    glowHover: 'rgba(64, 245, 198, 0.32)',
    cornerWash: 'rgba(64, 245, 198, 0.08)',
    cornerWashHover: 'rgba(64, 245, 198, 0.13)',
    fillHover: 'rgba(64, 245, 198, 0.07)',
    fillPressed: 'rgba(64, 245, 198, 0.1)',
  },
  violet: {
    ink: '#D9B8FF',
    stroke: 'rgba(205, 138, 255, 0.93)',
    strokeHover: 'rgba(218, 152, 255, 0.98)',
    glow: 'rgba(178, 91, 255, 0.24)',
    glowHover: 'rgba(178, 91, 255, 0.32)',
    cornerWash: 'rgba(178, 91, 255, 0.07)',
    cornerWashHover: 'rgba(178, 91, 255, 0.12)',
    fillHover: 'rgba(178, 91, 255, 0.07)',
    fillPressed: 'rgba(178, 91, 255, 0.1)',
  },
  magenta: {
    ink: '#FF5A9E',
    stroke: 'rgba(255, 78, 162, 0.93)',
    strokeHover: 'rgba(255, 92, 170, 0.97)',
    glow: 'rgba(255, 64, 153, 0.24)',
    glowHover: 'rgba(255, 82, 160, 0.32)',
    cornerWash: 'rgba(255, 64, 153, 0.08)',
    cornerWashHover: 'rgba(255, 64, 153, 0.13)',
    fillHover: 'rgba(255, 64, 153, 0.08)',
    fillPressed: 'rgba(255, 64, 153, 0.11)',
  },
} as const;

export function vionaAccountRoleStroke(role: VionaAccountNeonRole, hovered: boolean): string {
  const a = VIONA_ACCOUNT_ROLE_ACCENTS[role];
  return hovered ? a.strokeHover : a.stroke;
}

export function vionaAccountRoleGlow(role: VionaAccountNeonRole, hovered: boolean): string {
  const a = VIONA_ACCOUNT_ROLE_ACCENTS[role];
  return hovered ? a.glowHover : a.glow;
}

export function vionaAccountCornerWash(role: VionaAccountNeonRole, hovered: boolean): string {
  const a = VIONA_ACCOUNT_ROLE_ACCENTS[role];
  return hovered ? a.cornerWashHover : a.cornerWash;
}

/** VIONA.IDENTITY.NEON.GLASS — Setup / Identity profile console (SetupProfileScreen only). */
export const VIONA_IDENTITY_SETUP_NEON = {
  shellSurface: 'rgba(6, 12, 24, 0.54)',
  shellBorder: 'rgba(145, 190, 255, 0.3)',
  shellGlow: 'rgba(100, 170, 255, 0.2)',
  shellShadowRadius: 20,
  /** Blur applies only to the identity shell **background slab** — never the content wrapper (SetupProfile). */
  backdropBlurPx: 6,
  innerWashTop: 'rgba(255, 255, 255, 0.08)',
  innerWashGold: 'rgba(255, 224, 160, 0.055)',
  selectorGlass: 'rgba(5, 10, 24, 0.54)',
  selectorGlassHover: 'rgba(5, 10, 24, 0.42)',
  inputGlass: 'rgba(5, 10, 24, 0.58)',
  inputGlassFocus: 'rgba(5, 10, 24, 0.5)',
  inputBorder: 'rgba(92, 155, 255, 0.4)',
  inputBorderFocus: 'rgba(102, 217, 255, 0.86)',
  inputMinHeight: 44,
  placeholder: 'rgba(200, 215, 235, 0.78)',
  transitionMs: 165,
  ctaGlass: 'rgba(12, 9, 5, 0.52)',
  ctaGlassHover: 'rgba(18, 14, 8, 0.4)',
  ctaBorder: 'rgba(255, 215, 106, 0.9)',
  ctaBorderHover: 'rgba(255, 224, 130, 1)',
  ctaGlow: 'rgba(255, 199, 71, 0.26)',
  ctaGlowHover: 'rgba(255, 199, 71, 0.4)',
  ctaText: '#FEFCE8',
  ctaTextDisabled: 'rgba(200, 180, 130, 0.5)',
} as const;

/**
 * Web: right inset so floating assistants (e.g. Copilot FAB) do not cover command-rail labels
 * (VIONA.GLOBAL.NETWORK.STABILIZE.1).
 */
export function vionaGlobalTopRailWebRightReservePx(windowWidth: number): number {
  if (windowWidth <= 0) return 40;
  if (windowWidth < 860) return 72;
  if (windowWidth < 1120) return 56;
  return 40;
}

/** VIONA.GLOBAL.BOTTOM.ESCAPE.1 — optional layout anchor for in-scroll escape rows. */
export const VIONA_BOTTOM_ESCAPE_VISUAL = {
  railMaxWidth: 520,
} as const;
