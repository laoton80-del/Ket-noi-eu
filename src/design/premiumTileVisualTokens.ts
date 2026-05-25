/**
 * VIONA Wave 3B — Premium App Tile visual foundation.
 * North-star: “Premium App Tiles — Universe Standard” (see docs/design/VIONA_WAVE_3B_VISUAL_WOW_GAP_AUDIT.md).
 *
 * DESIGN LAW (docs — `VIONA.WAVE_3B.SEMANTIC_MULTICOLOR_LUMINOUS_UI_LAW.1`):
 * - `docs/design/VIONA_SEMANTIC_COLOR_MAPPING_V1.md` — per-surface semantic accent tables (mandatory for packs).
 * - `docs/design/VIONA_LUMINOUS_DARK_PREMIUM_UI_LAW.md` — dark glass + **bright luminous typography** + old-UI ban.
 * - Reference direction: north-star overview + luminous AI/glass reference (design-time assets; not production claims).
 *
 * COLOR GOVERNANCE (Wave 3B semantic correction — `VIONA.WAVE_3B.SEMANTIC_COLOR_GOVERNANCE.1`):
 * - **Not** one fixed color per universe. Each hub has a **leadingUniverseAccent** (atmosphere / section identity).
 * - Each feature tile uses a **semanticFeatureAccent** (`PremiumAppTile` `accent` override) based on **function meaning**.
 * - **controlledMultiAccent** grids mix accents inside a hub when semantics differ (**required** when feature meaning differs).
 * - `premiumUniverseAccentMap` = material specs (glow/stroke/ink) for **all** accents — use per **feature**, not hub name alone.
 * - `premiumUniverseAccentByHub` / `leadingUniverseAccentByHub` = **defaults only**, not a hard color lock.
 *
 * SEMANTIC FEATURE ACCENT MEANINGS (product + safety — not optional):
 * - **Cyan** — travel / tech / navigation / interactive / focus (not autonomous AI execution).
 * - **Emerald** — local trust / safe status / request clarity / progress (not settled, provider paid, or payment captured).
 * - **Violet** — academy / AI / language / translation / learning (not production AI teacher or accredited certification).
 * - **Gold** — premium / account / business / highlighted value (not paid, payout, cash-out, or commercial readiness).
 * - **Magenta** — SOS / alert / risk / urgent (not dispatch, rescue guarantee, or auto-alert).
 * - **Assistant** — LeTan / pilot assistant (cyan-led + violet wash; pilot UI only).
 * - Glow encodes **feature** meaning on each tile (stroke + corner wash + semantic shadow) — not decoration-only blobs.
 * - **Text status chip carries meaning; color is secondary** — never icon-only status.
 * - Local remains REQUEST_ONLY_NO_CHARGE; SOS remains guidance-only (copy packs enforce; tokens do not imply money).
 *
 * LUMINOUS TYPOGRAPHY (dark glass):
 * - Public UI text on dark glass must stay **bright and readable** — see `premiumLuminousInk` and luminous UI law.
 * - Avoid muddy mid-gray body copy; subtitles use high-contrast cool white, not dashboard dim gray.
 *
 * This module is tokens/utilities only.
 */

import { Platform, type ViewStyle } from 'react-native';

/**
 * Semantic feature accent palette — usable on any hub tile via `accent` override.
 * Not tied to a single universe; see `leadingUniverseAccentByHub` for hub defaults.
 */
export type VionaUniverseAccent =
  | 'emerald'
  | 'cyan'
  | 'violet'
  | 'gold'
  | 'magenta'
  | 'assistant';

/** @alias VionaUniverseAccent — default atmosphere when a tile has no `accent` override. */
export type LeadingUniverseAccent = VionaUniverseAccent;

/** @alias VionaUniverseAccent — per-tile accent chosen for feature meaning inside a hub grid. */
export type SemanticFeatureAccent = VionaUniverseAccent;

/** Interaction state for tile material resolution. */
export type PremiumTileState = 'default' | 'hovered' | 'pressed' | 'disabled';

/** Tile footprint tier — compact app tile is the default consumer module. */
export type PremiumTileSize = 'compact' | 'quickHelp' | 'hero';

export type PremiumUniverseAccentSpec = Readonly<{
  ink: string;
  inkHover: string;
  stroke: string;
  strokeHover: string;
  glow: string;
  glowHover: string;
  glowPressed: string;
  statusFill: string;
  statusFillHover: string;
  iconCapsuleFill: string;
  iconCapsuleFillHover: string;
  cornerWash: string;
  cornerWashHover: string;
  /** Secondary wash for assistant (violet) — undefined for single-accent universes. */
  cornerWashSecondary?: string;
}>;

/** Dark premium hub canvas — shared field behind tile grids. */
export const premiumTileCanvas = {
  base: '#050B14',
  veil: 'rgba(5, 11, 20, 0.44)',
  contentFieldVeil: 'rgba(5, 11, 20, 0.38)',
  ambientEmerald: 'rgba(72, 210, 165, 0.06)',
  ambientCyan: 'rgba(92, 205, 255, 0.05)',
  ambientViolet: 'rgba(178, 132, 248, 0.05)',
} as const;

/**
 * Luminous ink on dark glass — minimum contrast targets (`VIONA_LUMINOUS_DARK_PREMIUM_UI_LAW.md`).
 * Prefer these over muddy dashboard grays when building or migrating hub screens.
 */
export const premiumLuminousInk = {
  title: '#FFFFFF',
  titleBright: '#FFFFFF',
  subtitle: 'rgba(244, 250, 255, 0.96)',
  subtitleMinimum: 'rgba(236, 244, 255, 0.84)',
  sectionKicker: 'rgba(248, 252, 255, 0.98)',
  disabledReadable: 'rgba(186, 198, 216, 0.82)',
  chipLabel: '#FFFFFF',
} as const;

/** Interior micro-scene footprint on premium tiles (hard cutover). */
export const premiumTileMicroSceneLayout = {
  canvasWidth: 112,
  canvasHeight: 76,
  slotOpacity: 0.9,
  glowOrbOpacity: 0.58,
  backdropWashOpacity: 0.28,
} as const;

/** Dark premium modal shell — intent entry / Local-adjacent overlays. */
export const premiumModalGlass = {
  backdrop: 'rgba(2, 6, 14, 0.82)',
  surface: 'rgba(6, 12, 24, 0.92)',
  surfaceBorder: 'rgba(92, 255, 224, 0.48)',
  innerHighlight: 'rgba(255, 255, 255, 0.2)',
  optionBorder: 'rgba(148, 163, 184, 0.32)',
  optionBorderHover: 'rgba(126, 232, 255, 0.62)',
} as const;

/** Glass slab material (tile card body). */
export const premiumTileGlass = {
  surfaceDefault: 'rgba(6, 12, 24, 0.42)',
  surfaceHover: 'rgba(6, 12, 24, 0.28)',
  surfacePressed: 'rgba(6, 12, 24, 0.52)',
  surfaceDisabled: 'rgba(10, 14, 22, 0.72)',
  glassTintDefault: 'rgba(200, 230, 255, 0.1)',
  glassTintHover: 'rgba(200, 230, 255, 0.14)',
  borderDefault: 'rgba(148, 163, 184, 0.22)',
  borderHover: 'rgba(148, 163, 184, 0.32)',
  innerHighlight: 'rgba(255, 255, 255, 0.24)',
  innerHighlightHover: 'rgba(255, 255, 255, 0.38)',
  frameGlowOpacity: 0.72,
  cornerWashOpacity: 1,
  haloOpacity: 0.38,
  backdropBlurDefault: 14,
  backdropBlurHover: 18,
  edgeWidth: 2,
  shadowColor: 'rgba(5, 11, 20, 0.85)',
  shadowOpacityDefault: 0.48,
  shadowOpacityHover: 0.58,
  shadowRadiusDefault: 20,
  shadowRadiusHover: 28,
  shadowLiftDefault: 3,
  shadowLiftHover: 6,
  transitionMs: 165,
} as const;

/** Compact tile layout — aligns with VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md. */
export const premiumTileLayout = {
  radius: 16,
  radiusHero: 18,
  paddingVertical: 12,
  paddingHorizontal: 12,
  stackGap: 10,
  iconRowGap: 8,
  textBlockGap: 4,
  gridGap: 16,
  gridGapTight: 12,
  minPressHeight: 44,
  iconCapsuleSize: 44,
  iconCapsuleSizeCompact: 40,
  iconSize: 24,
  iconSizeQuickHelp: 22,
  minHeightCompact: 108,
  minHeightCompactInner: 108,
  minHeightQuickHelp: 112,
  minHeightHero: 168,
  titleFontSize: 13,
  titleLineHeight: 17,
  subtitleFontSize: 10,
  subtitleLineHeight: 14,
  statusFontSize: 8,
  statusLineHeight: 11,
  titleMaxLines: 1,
  subtitleMaxLines: 2,
} as const;

export const premiumTileIconCapsule = {
  borderWidth: 1.25,
  shadowOpacityDefault: 0.28,
  shadowOpacityHover: 0.44,
  shadowRadiusDefault: 8,
  shadowRadiusHover: 14,
} as const;

export const premiumTileStatusChip = {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  borderWidth: 1,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
} as const;

export const premiumTileInteraction = {
  pressOpacity: 0.94,
  disabledOpacity: 0.72,
  hoverScaleWeb: 1.01,
  pressedScale: 0.985,
  hoverLiftPx: 2,
} as const;

/**
 * Material specs for every **semantic feature accent** (glow/stroke/ink/capsule).
 * `premiumUniverseAccentMap` is **not** a universe color lock — tiles pick an entry via `accent` prop by feature meaning.
 * When a hub grid mixes features (transit=cyan, safety=emerald, VIP=gold), each tile must set `accent` explicitly.
 */
export const premiumUniverseAccentMap: Readonly<Record<VionaUniverseAccent, PremiumUniverseAccentSpec>> = {
  emerald: {
    ink: '#78E8C4',
    inkHover: '#9CFFEA',
    stroke: 'rgba(72, 210, 165, 0.9)',
    strokeHover: 'rgba(92, 255, 224, 0.98)',
    glow: 'rgba(72, 210, 165, 0.52)',
    glowHover: 'rgba(92, 255, 224, 0.68)',
    glowPressed: 'rgba(72, 210, 165, 0.18)',
    statusFill: 'rgba(72, 210, 165, 0.18)',
    statusFillHover: 'rgba(92, 255, 224, 0.24)',
    iconCapsuleFill: 'rgba(72, 210, 165, 0.14)',
    iconCapsuleFillHover: 'rgba(92, 255, 224, 0.2)',
    cornerWash: 'rgba(72, 210, 165, 0.22)',
    cornerWashHover: 'rgba(92, 255, 224, 0.32)',
  },
  cyan: {
    ink: '#8CD4FF',
    inkHover: '#B8E8FF',
    stroke: 'rgba(126, 232, 255, 0.9)',
    strokeHover: 'rgba(200, 245, 255, 1)',
    glow: 'rgba(92, 205, 255, 0.48)',
    glowHover: 'rgba(126, 232, 255, 0.64)',
    glowPressed: 'rgba(92, 205, 255, 0.16)',
    statusFill: 'rgba(92, 205, 255, 0.16)',
    statusFillHover: 'rgba(126, 232, 255, 0.22)',
    iconCapsuleFill: 'rgba(92, 205, 255, 0.12)',
    iconCapsuleFillHover: 'rgba(126, 232, 255, 0.18)',
    cornerWash: 'rgba(92, 205, 255, 0.18)',
    cornerWashHover: 'rgba(126, 232, 255, 0.28)',
  },
  violet: {
    ink: '#C8A8F0',
    inkHover: '#E8D8FF',
    stroke: 'rgba(178, 132, 248, 0.86)',
    strokeHover: 'rgba(200, 160, 255, 0.94)',
    glow: 'rgba(178, 132, 248, 0.46)',
    glowHover: 'rgba(200, 160, 255, 0.62)',
    glowPressed: 'rgba(178, 132, 248, 0.15)',
    statusFill: 'rgba(178, 132, 248, 0.16)',
    statusFillHover: 'rgba(200, 160, 255, 0.22)',
    iconCapsuleFill: 'rgba(178, 132, 248, 0.12)',
    iconCapsuleFillHover: 'rgba(200, 160, 255, 0.18)',
    cornerWash: 'rgba(178, 132, 248, 0.18)',
    cornerWashHover: 'rgba(200, 160, 255, 0.28)',
  },
  gold: {
    ink: '#E8C878',
    inkHover: '#FFE08A',
    stroke: 'rgba(228, 192, 110, 0.88)',
    strokeHover: 'rgba(242, 208, 106, 0.96)',
    glow: 'rgba(228, 192, 110, 0.48)',
    glowHover: 'rgba(242, 208, 106, 0.64)',
    glowPressed: 'rgba(228, 192, 110, 0.18)',
    statusFill: 'rgba(228, 192, 110, 0.18)',
    statusFillHover: 'rgba(242, 208, 106, 0.24)',
    iconCapsuleFill: 'rgba(228, 192, 110, 0.14)',
    iconCapsuleFillHover: 'rgba(242, 208, 106, 0.2)',
    cornerWash: 'rgba(228, 192, 110, 0.18)',
    cornerWashHover: 'rgba(242, 208, 106, 0.28)',
  },
  magenta: {
    ink: '#FF8AA0',
    inkHover: '#FFB0C0',
    stroke: 'rgba(255, 107, 138, 0.86)',
    strokeHover: 'rgba(255, 122, 148, 0.94)',
    glow: 'rgba(255, 107, 138, 0.44)',
    glowHover: 'rgba(255, 140, 168, 0.6)',
    glowPressed: 'rgba(255, 107, 138, 0.14)',
    statusFill: 'rgba(255, 107, 138, 0.16)',
    statusFillHover: 'rgba(255, 122, 148, 0.22)',
    iconCapsuleFill: 'rgba(255, 107, 138, 0.12)',
    iconCapsuleFillHover: 'rgba(255, 122, 148, 0.18)',
    cornerWash: 'rgba(255, 107, 138, 0.16)',
    cornerWashHover: 'rgba(255, 107, 138, 0.26)',
  },
  assistant: {
    ink: '#8CD4FF',
    inkHover: '#B8E8FF',
    stroke: 'rgba(92, 205, 255, 0.84)',
    strokeHover: 'rgba(126, 232, 255, 0.92)',
    glow: 'rgba(92, 205, 255, 0.2)',
    glowHover: 'rgba(126, 232, 255, 0.34)',
    glowPressed: 'rgba(92, 205, 255, 0.14)',
    statusFill: 'rgba(92, 205, 255, 0.14)',
    statusFillHover: 'rgba(178, 132, 248, 0.18)',
    iconCapsuleFill: 'rgba(92, 205, 255, 0.1)',
    iconCapsuleFillHover: 'rgba(178, 132, 248, 0.14)',
    cornerWash: 'rgba(92, 205, 255, 0.09)',
    cornerWashHover: 'rgba(126, 232, 255, 0.16)',
    cornerWashSecondary: 'rgba(178, 132, 248, 0.08)',
  },
} as const;

/**
 * Hub → **leadingUniverseAccent** (section atmosphere / `PremiumAppTile` default when `accent` omitted).
 * **controlledMultiAccent:** override per tile with `accent` for feature semantics — required for north-star grids.
 */
export const premiumUniverseAccentByHub = {
  local: 'emerald',
  travel: 'cyan',
  academy: 'violet',
  business: 'gold',
  account: 'gold',
  sos: 'magenta',
  assistant: 'assistant',
} as const satisfies Readonly<Record<string, VionaUniverseAccent>>;

/** @alias premiumUniverseAccentByHub — explicit leading-accent naming for docs/code review. */
export const leadingUniverseAccentByHub = premiumUniverseAccentByHub;

export type PremiumUniverseHubKey = keyof typeof premiumUniverseAccentByHub;

/** Leading accent for hub canvas / hero atmosphere (not a per-tile lock). */
export function resolveLeadingUniverseAccent(hub: PremiumUniverseHubKey): LeadingUniverseAccent {
  return premiumUniverseAccentByHub[hub];
}

/**
 * Tile accent resolution: explicit **semanticFeatureAccent** override wins; else hub leading accent.
 * Use in packs when documenting intent: `resolveSemanticFeatureAccent('local', 'cyan')` for transit tile.
 */
export function resolveSemanticFeatureAccent(
  hub: PremiumUniverseHubKey,
  featureAccentOverride?: SemanticFeatureAccent
): SemanticFeatureAccent {
  return featureAccentOverride ?? premiumUniverseAccentByHub[hub];
}

export function premiumUniverseAccentSpec(accent: VionaUniverseAccent): PremiumUniverseAccentSpec {
  return premiumUniverseAccentMap[accent];
}

export function premiumUniverseInk(accent: VionaUniverseAccent, state: PremiumTileState = 'default'): string {
  const spec = premiumUniverseAccentSpec(accent);
  if (state === 'hovered' || state === 'pressed') return spec.inkHover;
  return spec.ink;
}

export function premiumUniverseStroke(accent: VionaUniverseAccent, state: PremiumTileState = 'default'): string {
  const spec = premiumUniverseAccentSpec(accent);
  if (state === 'hovered' || state === 'pressed') return spec.strokeHover;
  return spec.stroke;
}

export function premiumSemanticGlow(accent: VionaUniverseAccent, state: PremiumTileState = 'default'): string {
  const spec = premiumUniverseAccentSpec(accent);
  if (state === 'pressed') return spec.glowPressed;
  if (state === 'hovered') return spec.glowHover;
  return spec.glow;
}

export function premiumGlassSurface(state: PremiumTileState = 'default'): string {
  switch (state) {
    case 'hovered':
      return premiumTileGlass.surfaceHover;
    case 'pressed':
      return premiumTileGlass.surfacePressed;
    case 'disabled':
      return premiumTileGlass.surfaceDisabled;
    default:
      return premiumTileGlass.surfaceDefault;
  }
}

export function premiumTileMinHeight(size: PremiumTileSize): number {
  switch (size) {
    case 'quickHelp':
      return premiumTileLayout.minHeightQuickHelp;
    case 'hero':
      return premiumTileLayout.minHeightHero;
    default:
      return premiumTileLayout.minHeightCompact;
  }
}

export function premiumIconCapsuleSize(size: PremiumTileSize): number {
  return size === 'compact' ? premiumTileLayout.iconCapsuleSizeCompact : premiumTileLayout.iconCapsuleSize;
}

/**
 * Wave 3B — Premium App Shell layout breakpoints (shared hub chrome).
 * Mobile-first: 390px must never horizontally overflow.
 */
export const premiumShellBreakpoints = {
  mobile: 480,
  tablet: 768,
  landscapeTablet: 1024,
  desktop: 1280,
} as const;

export type PremiumShellViewportTier = 'mobile' | 'tablet' | 'landscapeTablet' | 'desktop';

export const premiumShellLayout = {
  contentMaxWidthDesktop: 1200,
  contentMaxWidthLandscape: 1080,
  hubSlotGapMobile: 8,
  hubSlotGapDefault: 10,
  hubSlotGapDesktop: 12,
  sectionGapMobile: 8,
  sectionGapDefault: 10,
  sectionKickerSize: 9,
  sectionTitleSize: 14,
  sectionSubtitleSize: 11,
} as const;

/** Bottom chrome reserved for mini-app dock + tab bar + scroll breathing room. */
export const premiumShellChrome = {
  miniappDockBottomOffset: 58,
  miniappDockHeight: 46,
  tabBarClearanceBottom: 64,
  scrollPaddingBase: 48,
  scrollPaddingMobileExtra: 96,
} as const;

export function resolvePremiumShellViewportTier(width: number): PremiumShellViewportTier {
  if (width >= premiumShellBreakpoints.desktop) return 'desktop';
  if (width >= premiumShellBreakpoints.landscapeTablet) return 'landscapeTablet';
  if (width >= premiumShellBreakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function isPremiumShellMobile(width: number): boolean {
  return width > 0 && width < premiumShellBreakpoints.mobile;
}

export function resolvePremiumShellContentRail(windowWidth: number): Readonly<{
  horizontalPad: number;
  innerWidth: number;
  tier: PremiumShellViewportTier;
  isMobile: boolean;
}> {
  const tier = resolvePremiumShellViewportTier(windowWidth);
  const { horizontalPad, innerWidth } = resolvePremiumContentRail(windowWidth);
  const cap =
    tier === 'desktop'
      ? premiumShellLayout.contentMaxWidthDesktop
      : tier === 'landscapeTablet'
        ? premiumShellLayout.contentMaxWidthLandscape
        : innerWidth;
  return {
    horizontalPad,
    innerWidth: Math.min(innerWidth, cap),
    tier,
    isMobile: isPremiumShellMobile(windowWidth),
  };
}

export function resolvePremiumShellBottomPadding(
  width: number,
  insetsBottom = 0,
  options?: Readonly<{
    withMiniappDock?: boolean;
    withTabBar?: boolean;
    extra?: number;
  }>
): number {
  const withTabBar = options?.withTabBar !== false;
  const withMiniappDock = options?.withMiniappDock === true;
  let pad = Math.max(insetsBottom, 12) + (options?.extra ?? 0);
  if (withTabBar) pad += premiumShellChrome.tabBarClearanceBottom;
  if (withMiniappDock) {
    pad += premiumShellChrome.miniappDockBottomOffset + premiumShellChrome.miniappDockHeight;
  }
  pad += premiumShellChrome.scrollPaddingBase;
  if (isPremiumShellMobile(width)) pad += premiumShellChrome.scrollPaddingMobileExtra;
  return pad;
}

export function resolvePremiumHubSlotGap(width: number): number {
  const tier = resolvePremiumShellViewportTier(width);
  if (tier === 'desktop') return premiumShellLayout.hubSlotGapDesktop;
  if (tier === 'mobile') return premiumShellLayout.hubSlotGapMobile;
  return premiumShellLayout.hubSlotGapDefault;
}

/** Responsive premium tile grid — north-star breakpoints (Wave 3B). */
export function resolvePremiumTileGridColumns(
  width: number,
  options?: Readonly<{
    desktop?: number;
    tablet?: number;
    phone?: number;
    desktopMin?: number;
    tabletMin?: number;
    phoneMin?: number;
  }>
): number {
  const desktopMin = options?.desktopMin ?? 1024;
  const tabletMin = options?.tabletMin ?? 768;
  const phoneMin = options?.phoneMin ?? 360;
  const desktop = options?.desktop ?? 4;
  const tablet = options?.tablet ?? 3;
  const phone = options?.phone ?? 2;
  if (width >= desktopMin) return desktop;
  if (width >= tabletMin) return tablet;
  if (width >= phoneMin) return phone;
  return 1;
}

export function resolvePremiumTileItemWidth(
  contentWidth: number,
  columns: number,
  gap = premiumTileLayout.gridGap
): number {
  if (columns <= 1) return contentWidth;
  return (contentWidth - gap * (columns - 1)) / columns;
}

/** Flex-basis percent for wrapped tile rows (gap-aware; avoids mobile horizontal overflow). */
export function resolvePremiumTileCellWidthPercent(
  columns: number,
  gapPx: number = premiumTileLayout.gridGap
): `${number}%` {
  if (columns <= 1) return '100%';
  if (columns === 2) return gapPx <= 12 ? '47.5%' : '48.4%';
  if (columns === 3) return gapPx <= 12 ? '30.5%' : '31.4%';
  return gapPx <= 12 ? '22.5%' : '23.2%';
}

export function resolvePremiumContentRail(windowWidth: number): Readonly<{ horizontalPad: number; innerWidth: number }> {
  const horizontalPad = windowWidth >= 1440 ? 24 : windowWidth >= 960 ? 16 : 12;
  return {
    horizontalPad,
    innerWidth: Math.max(0, windowWidth - horizontalPad * 2),
  };
}

/** Web-only backdrop blur style fragment (safe no-op on native when not applied). */
export function premiumTileWebBackdropBlur(blurPx: number): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
  } as ViewStyle;
}

/** Semantic shadow for tiles — use accent glow as shadowColor on native/web. */
export function premiumTileSemanticShadowStyle(
  accent: VionaUniverseAccent,
  state: PremiumTileState = 'default'
): ViewStyle {
  const glow = premiumSemanticGlow(accent, state);
  const hovered = state === 'hovered' || state === 'pressed';
  return {
    shadowColor: glow,
    shadowOffset: { width: 0, height: hovered ? premiumTileGlass.shadowLiftHover : premiumTileGlass.shadowLiftDefault },
    shadowOpacity: hovered ? premiumTileGlass.shadowOpacityHover : premiumTileGlass.shadowOpacityDefault,
    shadowRadius: hovered ? premiumTileGlass.shadowRadiusHover : premiumTileGlass.shadowRadiusDefault,
    elevation: hovered ? 8 : 4,
  };
}
