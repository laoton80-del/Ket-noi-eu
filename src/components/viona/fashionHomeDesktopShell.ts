import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';

/**
 * Desktop fashion hero frame aspect (width / height).
 * GLASS.HOME.2 — taller cinematic stage (~540px at 1280px wide) so art breathes; clamped further in `HomeScreen` web.
 */
export const FASHION_HOME_DESKTOP_HERO_ASPECT = 1280 / 540;

/** Shared luminous line language for fashion home surfaces. */
export const FASHION_HOME_LINE_GOLD = 'rgba(244, 214, 144, 0.46)';
export const FASHION_HOME_LINE_GOLD_SOFT = 'rgba(242, 212, 136, 0.34)';
export const FASHION_HOME_LINE_CYAN = 'rgba(136, 218, 255, 0.32)';
/** Hero top inner glow only — not a full-width divider. */
export const FASHION_HOME_HERO_TOP_GLOW = 'rgba(244, 214, 144, 0.14)';
export const FASHION_HOME_GLOW_GOLD = 'rgba(238, 206, 128, 0.14)';
export const FASHION_HOME_GLOW_CYAN = 'rgba(128, 210, 255, 0.12)';
/** Academy / violet quick actions — matches vivid academy cards (not SOS magenta). */
export const FASHION_HOME_GLOW_VIOLET = 'rgba(155, 92, 255, 0.2)';
/** Extra horizontal air around the command-rail wordmark (applied inside `VionaBrandLockup`). */
export const FASHION_HOME_WORDMARK_INSET_X = 6;

/** VIONA.HOME.HEADER.BREATHING.1 — clearance before living hero overlaps the fixed rail (~0.4cm). */
export const FASHION_HOME_HERO_COMMAND_CLEARANCE_PX = 15;
/** Fashion-home command rail: nudges wordmark/greeting from the rail’s inner left edge (~0.5cm). `VionaFashionHomeCommandBar` applies. */
export const FASHION_HOME_COMMAND_RAIL_SHELL_INSET_LEFT_PX = 19;
/**
 * Extra margin after the greeting divider (~0.5cm). Together with `FASHION_HOME_COMMAND_RAIL_SHELL_INSET_LEFT_PX`,
 * the greeting block reads ~1cm further right than before (VIONA.HOME.HEADER.BREATHING.1).
 */
export const FASHION_HOME_COMMAND_RAIL_GREETING_EXTRA_MARGIN_PX = 19;

/**
 * GLASS.HOME.2 — air between hero glass and world-card row on Fashion Home desktop web (px).
 * `FASHION_HOME_WORLD_CARD_STAGE_LAP_PX` subtracts a small tuck under the hero rim (premium overlap).
 */
export const FASHION_HOME_WORLD_CARD_HERO_BREATHING_TOP_PX = 28;
export const FASHION_HOME_WORLD_CARD_STAGE_LAP_PX = 6;

/**
 * Extra `ScrollView` bottom padding on Fashion Home desktop web so fullscreen / short viewports can scroll
 * past the world cards + quick actions without clipping the last row.
 */
export const FASHION_HOME_SCROLL_BOTTOM_BREATHING_EXTRA_PX = 8;

export const FASHION_HOME_INNER_HIGHLIGHT = 'rgba(255, 232, 188, 0.18)';
/** Command rail only — lighter than card/hero frames. */
export const FASHION_HOME_COMMAND_RAIL_BORDER = 'rgba(242, 212, 136, 0.2)';
export const FASHION_HOME_COMMAND_RAIL_HIGHLIGHT = 'rgba(255, 232, 188, 0.14)';
/** Command rail fill — matches fashion canvas so the logo does not sit on a separate panel. */
export const FASHION_HOME_COMMAND_RAIL_GRADIENT = [
  'rgba(7, 9, 14, 0.94)',
  'rgba(7, 10, 16, 0.9)',
  'rgba(7, 9, 14, 0.92)',
] as const;

/** VIONA.DAYLIGHT.BOOST.HOME.MVP.1 — Home-only outdoor readability; stays dark/cinematic (not white mode). */
/** GLASS.HOME.1 / GLASS.HOME.1B — Home Daylight as premium **glass material** (card-local light; not canvas backlight). See `VIONA_GLASS_LIGHT_POLISH_SYSTEM.md` §5. */
export const FASHION_HOME_DAYLIGHT_TRANSITION_MS = 220;

/** Slightly lifted canvas vs `fashionTech.canvas`; still deep navy. */
export const FASHION_HOME_DAYLIGHT_CANVAS = 'rgb(13, 18, 28)';
export const FASHION_HOME_DAYLIGHT_CANVAS_ELEVATED = 'rgb(16, 24, 38)';

/** Lighter left scrim so hero art stays vivid outdoors. */
export const FASHION_HOME_DAYLIGHT_HERO_SCRIM_LEFT = [
  'rgba(4, 7, 12, 0.22)',
  'rgba(4, 7, 12, 0.07)',
  'rgba(4, 7, 12, 0)',
] as const;

/** Lower global dark veil on hero interior (vs standard vignette). */
export const FASHION_HOME_DAYLIGHT_HERO_VIGNETTE = [
  'rgba(0, 0, 0, 0.018)',
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0.03)',
] as const;

/** Primary luminous veil — warm ivory bias (GLASS.HOME.2: less cool/cyan read on the full hero). */
export const FASHION_HOME_DAYLIGHT_HERO_LUMINOUS = [
  'rgba(255, 236, 210, 0.07)',
  'rgba(255, 244, 228, 0.038)',
  'rgba(236, 232, 220, 0.042)',
] as const;

/** Secondary very soft lift pass (stacked under copy, over image). */
export const FASHION_HOME_DAYLIGHT_HERO_LIFT_OVERLAY = [
  'rgba(255, 255, 252, 0.024)',
  'rgba(232, 238, 248, 0.032)',
  'rgba(255, 244, 220, 0.028)',
] as const;

export const FASHION_HOME_DAYLIGHT_FRAME_BORDER = 'rgba(252, 232, 190, 0.56)';
export const FASHION_HOME_DAYLIGHT_FRAME_GLOW = 'rgba(252, 228, 168, 0.28)';

/** Brighter hero rim lines (thin neon, same 1px geometry). */
export const FASHION_HOME_DAYLIGHT_HERO_CYAN_EDGE = 'rgba(170, 232, 255, 0.52)';

export const FASHION_HOME_DAYLIGHT_RAIL_GRADIENT = [
  'rgba(12, 18, 30, 0.96)',
  'rgba(11, 17, 28, 0.93)',
  'rgba(12, 18, 30, 0.95)',
] as const;
export const FASHION_HOME_DAYLIGHT_RAIL_BORDER = 'rgba(252, 236, 200, 0.34)';
export const FASHION_HOME_DAYLIGHT_RAIL_HIGHLIGHT = 'rgba(255, 238, 200, 0.22)';

export const FASHION_HOME_DAYLIGHT_HEADLINE = '#ffffff';
export const FASHION_HOME_DAYLIGHT_TEXT_SHADOW = 'rgba(2, 5, 10, 0.32)';
export const FASHION_HOME_DAYLIGHT_SUBTITLE = 'rgba(252, 253, 255, 0.96)';
export const FASHION_HOME_DAYLIGHT_EYEBROW = 'rgba(255, 240, 210, 1)';

/** Legacy neutral card wrapper tint (prefer semantic `fashionHomeDaylightWorldCardNativeShellStyle`). */
export const FASHION_HOME_DAYLIGHT_CARD_FILL = 'rgba(255, 250, 238, 0.04)';

/** Small contained rim for chips / compact glass (not world-card outer bloom). */
export const FASHION_HOME_DAYLIGHT_CHIP_CONTAINED_GLOW = 'rgba(252, 228, 196, 0.34)';

/** World-card daylight accent — drives semantic glass material on wrappers. */
export type FashionHomeWorldCardDaylightAccent = 'local' | 'travel' | 'academy' | 'business';

/** GLASS.HOME.1B — thin refractive rim (not thick neon stroke). */
const FASHION_HOME_DAYLIGHT_WORLD_WEB_MATERIAL: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local:
    'inset 0 1px 0 rgba(255,255,255,0.17), inset 0 18px 52px rgba(52, 175, 140, 0.09), inset 0 -28px 40px rgba(8, 14, 22, 0.2), 0 0 0 1px rgba(72, 195, 155, 0.24), 0 6px 16px rgba(18, 72, 58, 0.1)',
  travel:
    'inset 0 1px 0 rgba(255,255,255,0.17), inset 0 18px 52px rgba(70, 168, 228, 0.1), inset 0 -28px 40px rgba(8, 14, 22, 0.2), 0 0 0 1px rgba(92, 195, 245, 0.22), 0 6px 16px rgba(22, 78, 118, 0.11)',
  academy:
    'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 18px 54px rgba(145, 112, 220, 0.09), inset 0 -28px 40px rgba(8, 14, 22, 0.2), 0 0 0 1px rgba(168, 138, 238, 0.22), 0 6px 16px rgba(52, 40, 92, 0.1)',
  business:
    'inset 0 1px 0 rgba(255,248,232,0.18), inset 0 18px 52px rgba(210, 168, 88, 0.08), inset 0 -28px 40px rgba(8, 14, 22, 0.2), 0 0 0 1px rgba(228, 192, 110, 0.26), 0 6px 16px rgba(68, 48, 22, 0.1)',
};

const FASHION_HOME_DAYLIGHT_WORLD_NATIVE: Record<
  FashionHomeWorldCardDaylightAccent,
  Readonly<{ fill: string; rim: string; shadowRadius: number; elevation: number }>
> = {
  local: { fill: 'rgba(48, 175, 138, 0.055)', rim: 'rgba(58, 190, 150, 0.22)', shadowRadius: 6, elevation: 3 },
  travel: { fill: 'rgba(72, 168, 228, 0.058)', rim: 'rgba(78, 175, 238, 0.22)', shadowRadius: 6, elevation: 3 },
  academy: { fill: 'rgba(138, 108, 218, 0.06)', rim: 'rgba(142, 112, 225, 0.2)', shadowRadius: 6, elevation: 3 },
  business: { fill: 'rgba(210, 172, 92, 0.062)', rim: 'rgba(205, 168, 88, 0.24)', shadowRadius: 6, elevation: 3 },
};

/** In-card surface sheen (stacked in Home wrapper; pointer-events none). */
export const FASHION_HOME_DAYLIGHT_WORLD_SURFACE_SHEEN: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(255, 255, 255, 0.14)', 'rgba(120, 220, 185, 0.06)', 'rgba(255, 255, 255, 0)'],
  travel: ['rgba(255, 255, 255, 0.14)', 'rgba(130, 210, 255, 0.07)', 'rgba(255, 255, 255, 0)'],
  academy: ['rgba(255, 255, 255, 0.13)', 'rgba(190, 160, 255, 0.06)', 'rgba(255, 255, 255, 0)'],
  business: ['rgba(255, 248, 228, 0.15)', 'rgba(235, 200, 120, 0.06)', 'rgba(255, 255, 255, 0)'],
};

/** Contained inner glow near icon/title (upper-left). */
export const FASHION_HOME_DAYLIGHT_WORLD_MATERIAL_GLOW: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(72, 205, 165, 0.2)', 'rgba(52, 175, 140, 0.06)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(95, 195, 248, 0.22)', 'rgba(70, 168, 228, 0.07)', 'rgba(95, 195, 248, 0)'],
  academy: ['rgba(175, 145, 248, 0.2)', 'rgba(140, 110, 220, 0.06)', 'rgba(175, 145, 248, 0)'],
  business: ['rgba(235, 200, 120, 0.18)', 'rgba(210, 168, 88, 0.06)', 'rgba(235, 200, 120, 0)'],
};

/** Softens saturated card rim into glass refraction (full-card veil). */
export const FASHION_HOME_DAYLIGHT_WORLD_EDGE_SOFTEN: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(255, 255, 255, 0.04)', 'rgba(8, 12, 18, 0)'],
  travel: ['rgba(255, 255, 255, 0.04)', 'rgba(8, 12, 18, 0)'],
  academy: ['rgba(255, 255, 255, 0.035)', 'rgba(8, 12, 18, 0)'],
  business: ['rgba(255, 248, 230, 0.045)', 'rgba(8, 12, 18, 0)'],
};

export const FASHION_HOME_WORLD_CARD_GLASS_HOST_RADIUS = vionaTokens.radius.xl;

export function fashionHomeWorldCardGlassHostStyle(): ViewStyle {
  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: FASHION_HOME_WORLD_CARD_GLASS_HOST_RADIUS,
  };
}

/** Native world-card wrapper: semantic fill + tight rim glow (material, not rear halo). */
export function fashionHomeDaylightWorldCardNativeShellStyle(accent: FashionHomeWorldCardDaylightAccent): ViewStyle {
  const w = FASHION_HOME_DAYLIGHT_WORLD_NATIVE[accent];
  return {
    borderRadius: vionaTokens.radius.xl,
    backgroundColor: w.fill,
    shadowColor: w.rim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: w.shadowRadius,
    elevation: w.elevation,
  };
}

/** Web: inset illumination + thin refractive edge + modest outer depth (inside card footprint). */
export function fashionHomeWebDaylightWorldCardMaterialStyle(accent: FashionHomeWorldCardDaylightAccent): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return { boxShadow: FASHION_HOME_DAYLIGHT_WORLD_WEB_MATERIAL[accent] } as ViewStyle;
}

/** Web-only: hero image stack only (avoid filtering card typography). GLASS.HOME.2 — slightly softer lift (less glare). */
export const FASHION_HOME_DAYLIGHT_HERO_IMAGE_FILTER_WEB = 'brightness(1.05) contrast(1.06) saturate(1.06)';

/** Web-only CSS transition for Daylight Boost (no layout animation). */
export function fashionHomeWebDaylightTransitionStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  return {
    transition: `background-color ${ms}ms ease-out, border-color ${ms}ms ease-out, box-shadow ${ms}ms ease-out, color ${ms}ms ease-out, text-shadow ${ms}ms ease-out, filter ${ms}ms ease-out, opacity ${ms}ms ease-out`,
  } as ViewStyle;
}

/** Web-only subtle lift on hero imagery only. */
export function fashionHomeWebDaylightHeroImageLiftStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return { filter: FASHION_HOME_DAYLIGHT_HERO_IMAGE_FILTER_WEB } as ViewStyle;
}

/** Quick-action pill accent (Home fashion strip). */
export type FashionHomeQuickActionAccent = 'gold' | 'cyan' | 'emerald' | 'violet' | 'blue' | 'sos';

const FASHION_HOME_DAYLIGHT_QUICK_ACTION: Record<
  FashionHomeQuickActionAccent,
  Readonly<{
    fill: string;
    border: string;
    iconBg: string;
    iconRim: string;
    webMaterial: string;
    sheen: readonly [string, string];
  }>
> = {
  gold: {
    fill: 'rgba(18, 22, 32, 0.74)',
    border: 'rgba(228, 192, 110, 0.26)',
    iconBg: 'rgba(238, 206, 128, 0.14)',
    iconRim: 'rgba(238, 206, 128, 0.34)',
    webMaterial:
      'inset 0 1px 0 rgba(255,248,230,0.15), inset 0 0 22px rgba(210, 168, 88, 0.045), 0 0 0 1px rgba(228, 192, 110, 0.22), 0 2px 10px rgba(8, 12, 20, 0.32)',
    sheen: ['rgba(255, 248, 228, 0.1)', 'rgba(255, 248, 228, 0)'],
  },
  cyan: {
    fill: 'rgba(16, 22, 34, 0.76)',
    border: 'rgba(95, 195, 248, 0.24)',
    iconBg: 'rgba(128, 210, 255, 0.11)',
    iconRim: 'rgba(128, 210, 255, 0.32)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.11), inset 0 0 22px rgba(70, 168, 228, 0.05), 0 0 0 1px rgba(95, 195, 248, 0.2), 0 2px 10px rgba(8, 12, 20, 0.32)',
    sheen: ['rgba(200, 235, 255, 0.09)', 'rgba(200, 235, 255, 0)'],
  },
  emerald: {
    fill: 'rgba(16, 24, 32, 0.76)',
    border: 'rgba(72, 195, 155, 0.24)',
    iconBg: 'rgba(88, 214, 168, 0.11)',
    iconRim: 'rgba(88, 214, 168, 0.32)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.11), inset 0 0 22px rgba(52, 175, 140, 0.05), 0 0 0 1px rgba(72, 195, 155, 0.2), 0 2px 10px rgba(8, 12, 20, 0.32)',
    sheen: ['rgba(180, 245, 220, 0.09)', 'rgba(180, 245, 220, 0)'],
  },
  violet: {
    fill: 'rgba(18, 20, 34, 0.76)',
    border: 'rgba(168, 138, 238, 0.24)',
    iconBg: 'rgba(176, 140, 255, 0.11)',
    iconRim: 'rgba(176, 140, 255, 0.32)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 22px rgba(140, 110, 220, 0.05), 0 0 0 1px rgba(168, 138, 238, 0.2), 0 2px 10px rgba(8, 12, 20, 0.32)',
    sheen: ['rgba(220, 200, 255, 0.09)', 'rgba(220, 200, 255, 0)'],
  },
  blue: {
    fill: 'rgba(16, 22, 34, 0.76)',
    border: 'rgba(120, 196, 255, 0.24)',
    iconBg: 'rgba(120, 196, 255, 0.1)',
    iconRim: 'rgba(120, 196, 255, 0.3)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.11), inset 0 0 22px rgba(100, 170, 235, 0.045), 0 0 0 1px rgba(120, 196, 255, 0.2), 0 2px 10px rgba(8, 12, 20, 0.32)',
    sheen: ['rgba(200, 228, 255, 0.09)', 'rgba(200, 228, 255, 0)'],
  },
  sos: {
    fill: 'rgba(24, 10, 14, 0.78)',
    border: 'rgba(255, 92, 108, 0.3)',
    iconBg: 'rgba(255, 92, 108, 0.15)',
    iconRim: 'rgba(255, 92, 108, 0.36)',
    webMaterial:
      'inset 0 1px 0 rgba(255,220,225,0.09), inset 0 0 18px rgba(255, 92, 108, 0.05), 0 0 0 1px rgba(255, 92, 108, 0.26), 0 2px 10px rgba(8, 12, 20, 0.32)',
    sheen: ['rgba(255, 180, 190, 0.08)', 'rgba(255, 180, 190, 0)'],
  },
};

export function fashionHomeDaylightQuickActionPillStyle(accent: FashionHomeQuickActionAccent): ViewStyle {
  const q = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent];
  return {
    backgroundColor: q.fill,
    borderColor: q.border,
    borderWidth: 1,
    shadowColor: q.iconRim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 1,
  };
}

export function fashionHomeWebDaylightQuickActionPillMaterialStyle(accent: FashionHomeQuickActionAccent): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return { boxShadow: FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent].webMaterial } as ViewStyle;
}

export function fashionHomeDaylightQuickActionIconCapsuleStyle(accent: FashionHomeQuickActionAccent): ViewStyle {
  const q = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent];
  return {
    backgroundColor: q.iconBg,
    shadowColor: q.iconRim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 6,
    elevation: 1,
  };
}

export function fashionHomeDaylightQuickActionSheen(accent: FashionHomeQuickActionAccent): readonly [string, string] {
  return FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent].sheen;
}

/** Logo plate harmonizes with the rail; soft lift only. */
export const FASHION_HOME_COMMAND_LOGO_PLATE = 'rgba(7, 9, 14, 0.88)';
export const FASHION_HOME_COMMAND_LOGO_GLOW = 'rgba(238, 206, 128, 0.16)';
/** ~30% larger than the prior 237×48 / 192×40 wordmark boxes while keeping rail height. */
export const FASHION_HOME_COMMAND_LOGO_SIZE = {
  width: 308,
  height: 48,
  compactWidth: 250,
  compactHeight: 40,
} as const;
/** Centered auth entry brand (Login / Welcome). */
export const VIONA_AUTH_BRAND_LOGO_SIZE = {
  width: 216,
  height: 52,
} as const;
/** Compact top-left brand (Account). */
export const VIONA_COMPACT_BRAND_LOGO_SIZE = {
  width: 168,
  height: 36,
} as const;
/** Dynamic hero frame — same family as cards, slightly softer. */
export const FASHION_HOME_FRAME_BORDER = 'rgba(244, 214, 144, 0.36)';
export const FASHION_HOME_FRAME_GLOW = 'rgba(238, 206, 128, 0.12)';

/** Crisp 1px luminous stroke; web uses inset box-shadow to avoid muddy corner anti-aliasing. */
export function premiumCrispEdgeStroke(borderColor: string): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      borderWidth: 0,
      boxShadow: `inset 0 0 0 1px ${borderColor}`,
    };
  }
  return {
    borderWidth: 1,
    borderColor,
  };
}

export function premiumFrameEdgeOverlay(radius: number): ViewStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius,
    zIndex: 6,
  };
}

export function premiumFrameInnerHighlight(): ViewStyle {
  return {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 1,
    height: 1,
    backgroundColor: FASHION_HOME_INNER_HIGHLIGHT,
    zIndex: 7,
  };
}

export function premiumFrameSurfaceInset(radius: number): ViewStyle {
  return {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: Math.max(radius - 1, 0),
    overflow: 'hidden',
  };
}

export type FashionHomeDesktopLayout = Readonly<{
  /** Full viewport width for fashion desktop home (no centered max-width box). */
  shellWidth: number;
  /** Horizontal inset for readable rails; hero bleeds with negative margin. */
  pad: number;
  /** Content width inside horizontal padding. */
  inner: number;
}>;

/** Desktop fashion home uses the full viewport width with modest edge inset only. */
export function resolveFashionHomeDesktopLayout(windowWidth: number): FashionHomeDesktopLayout {
  const pad =
    windowWidth >= 1440
      ? vionaTokens.spacing[24]
      : windowWidth >= 960
        ? vionaTokens.spacing[16]
        : vionaTokens.spacing[12];
  const shellWidth = windowWidth;
  return { shellWidth, pad, inner: shellWidth - pad * 2 };
}
