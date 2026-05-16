import { Platform, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';

/**
 * Desktop fashion hero frame aspect (width / height).
 * GLASS.HOME.2 / 2C — cinematic stage baseline; web deep stage height from `fashionDesktopWebHomeStageLayout` in `HomeScreen`.
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
 * GLASS.HOME.3A / **3C** — desktop web one-viewport “command stage” vertical budget (`HomeScreen` sizes hero from these).
 * World strip reserve must cover hero→cards breathing + four-card row + grid tail so `avail` caps the hero without clipping cards.
 */
/** GLASS.HOME.EXACT — command rail + greeting height budget (scroll starts below this chrome). */
export const FASHION_HOME_WEB_COMMAND_STAGE_BAR_RESERVE_COMFORT_PX = 112;
export const FASHION_HOME_WEB_COMMAND_STAGE_BAR_RESERVE_COMPACT_PX = 98;
/** Compact hero→cards gap on desktop web opening stage (px). */
export const FASHION_HOME_WEB_COMMAND_STAGE_HERO_CARD_HOOK_PX = 6;
/** Initial world-row height before `onLayout` measure (1366×768 four-card row + footers). */
export const FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX = 168;
/** @deprecated Use `FASHION_HOME_WEB_OPENING_STAGE_CARD_ROW_BOTTOM_CLEARANCE_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_WORLD_STRIP_BOTTOM_INSET_PX = 10;
/** Gap between hero bottom edge and world-card row top (px). */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX = 6;
/** Opening hero height floor / cap (px) — viewport-capped; cards must not clip. */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX = 414;
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX = 478;
/** RIGHT.EDGE.ONLY.FINAL — hero + world-card row right reach (desktop web). */
export const FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX = 149;
/** Hub rail right reach — unchanged when opening stage widens. */
export const FASHION_HOME_WEB_OPENING_STAGE_HUB_RIGHT_BLEED_PX = 109;
/** Bottom air under card row inside opening viewport budget (px). */
export const FASHION_HOME_WEB_OPENING_STAGE_SAFE_BOTTOM_GAP_PX = 2;
/** Short-viewport hero nudge when stack still fits (1366×768 budget). */
export const FASHION_HOME_WEB_OPENING_STAGE_SHORT_VIEWPORT_HERO_NUDGE_PX = 12;
/** @deprecated Cards sit below hero; overlap removed. */
export const FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_OVERLAP_INTO_HERO_PX = 0;
/** @deprecated Use `FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_CANVAS_EXTEND_BEHIND_CARDS_PX = 0;
/** @deprecated Cards sit below hero. */
export const FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_ROW_BOTTOM_CLEARANCE_PX = 0;
/** @deprecated Use `FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_OVERLAP_INTO_HERO_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_CARD_ROW_LAP_PX =
  FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_OVERLAP_INTO_HERO_PX;
/** @deprecated Use `FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_ROW_BOTTOM_CLEARANCE_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_CARD_ROW_BOTTOM_CLEARANCE_PX =
  FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_ROW_BOTTOM_CLEARANCE_PX;
/** Fashion web `ScrollView` content top pad; keep minimal so hero hugs topbar. */
export const FASHION_HOME_WEB_OPENING_STAGE_SCROLL_TOP_PAD_PX = 0;
/** Sub-pixel rounding fudge so stage bottom meets viewport (no canvas strip). */
export const FASHION_HOME_WEB_OPENING_STAGE_HEIGHT_FUDGE_PX = 2;
/** Viewports at/above this height may show the first VIONA FOR YOU row in the first screen. */
export const FASHION_HOME_WEB_OPENING_STAGE_TALL_VIEWPORT_MIN_PX = 920;
/** Hub title + first 4-pill row budget when opening must fit in first viewport. */
export const FASHION_HOME_WEB_OPENING_STAGE_HUB_FIRST_ROW_PEEK_PX = 112;
/** @deprecated Alias — same budget as `HUB_FIRST_ROW_PEEK`. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_HUB_ONE_ROW_PEEK_PX =
  FASHION_HOME_WEB_OPENING_STAGE_HUB_FIRST_ROW_PEEK_PX;
/** Viewports at or below this height always reserve hub first-row in layout math. */
export const FASHION_HOME_WEB_OPENING_STAGE_HUB_IN_VIEWPORT_MAX_HEIGHT_PX = 1080;
/** Opening hero `object-position` X (%) — center-right, subject-visible (no zoom). */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_X_PCT = 84;
/** Fullscreen: subtle focal nudge without zoom/translate. */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_X_FULLSCREEN_SHIFT_PCT = 1;
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_Y_PCT = 32;
/** Pull VIONA FOR YOU block up toward cards (fullscreen only). */
export const FASHION_HOME_WEB_OPENING_STAGE_HUB_PULLUP_PX = 6;
/** Non-fullscreen desktop web: keep hero flush under command rail (max 4px in shell). */
export const FASHION_HOME_WEB_OPENING_STAGE_NORMAL_WEB_TOP_OFFSET_PX = 0;
/** @deprecated Use `FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX` + fold pad in layout memo. */
export const FASHION_HOME_WEB_COMMAND_STAGE_WORLD_STRIP_RESERVE_PX = 328;
export const FASHION_HOME_WEB_COMMAND_STAGE_VIEWPORT_BREATHE_PX = 0;

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
/** GLASS.HOME.3 — snappier glass hover (within 160–220ms). */
export const FASHION_HOME_DAYLIGHT_TRANSITION_MS = 200;

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

/** GLASS.HOME.FINAL — edge-lit rim; no full-card white wash. */
const FASHION_HOME_DAYLIGHT_WORLD_WEB_MATERIAL: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local:
    'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -6px 12px rgba(4,10,10,0.28), 0 0 0 1px rgba(72, 210, 165, 0.72), 0 0 0 1px rgba(0,0,0,0.48) inset, 0 4px 12px rgba(4,8,12,0.32)',
  travel:
    'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -6px 12px rgba(6,12,18,0.28), 0 0 0 1px rgba(92, 205, 255, 0.72), 0 0 0 1px rgba(0,0,0,0.46) inset, 0 4px 12px rgba(4,8,12,0.32)',
  academy:
    'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -6px 12px rgba(10,8,16,0.3), 0 0 0 1px rgba(178, 132, 248, 0.72), 0 0 0 1px rgba(0,0,0,0.46) inset, 0 4px 12px rgba(4,8,12,0.32)',
  business:
    'inset 0 1px 0 rgba(255,248,232,0.2), inset 0 -6px 12px rgba(14,10,6,0.26), 0 0 0 1px rgba(228, 192, 110, 0.74), 0 0 0 1px rgba(0,0,0,0.44) inset, 0 4px 12px rgba(4,8,12,0.32)',
};

const FASHION_HOME_DAYLIGHT_WORLD_NATIVE: Record<
  FashionHomeWorldCardDaylightAccent,
  Readonly<{ fill: string; rim: string; shadowRadius: number; elevation: number }>
> = {
  local: { fill: 'rgba(48, 175, 138, 0.04)', rim: 'rgba(58, 190, 150, 0.42)', shadowRadius: 8, elevation: 3 },
  travel: { fill: 'rgba(72, 168, 228, 0.04)', rim: 'rgba(78, 175, 238, 0.42)', shadowRadius: 8, elevation: 3 },
  academy: { fill: 'rgba(138, 108, 218, 0.05)', rim: 'rgba(160, 120, 235, 0.42)', shadowRadius: 8, elevation: 3 },
  business: { fill: 'rgba(210, 172, 92, 0.045)', rim: 'rgba(205, 168, 88, 0.42)', shadowRadius: 8, elevation: 3 },
};

/** Narrow top sheen — specular edge only. */
/** GLASS.HOME.ROOT — top-edge only; Home glass stack omits when edge-lit card mode is active. */
export const FASHION_HOME_DAYLIGHT_WORLD_SURFACE_SHEEN: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(255, 255, 255, 0.014)', 'rgba(120, 220, 188, 0.028)', 'rgba(255, 255, 255, 0)'],
  travel: ['rgba(255, 255, 255, 0.014)', 'rgba(130, 210, 255, 0.028)', 'rgba(255, 255, 255, 0)'],
  academy: ['rgba(255, 255, 255, 0.012)', 'rgba(200, 165, 255, 0.026)', 'rgba(255, 255, 255, 0)'],
  business: ['rgba(255, 248, 232, 0.014)', 'rgba(230, 195, 120, 0.026)', 'rgba(255, 255, 255, 0)'],
};

/** GLASS.HOME.FINAL — minimal horizontal tint; no milk across the photo. */
export const FASHION_HOME_DAYLIGHT_WORLD_FROST_FIELD: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string, string]
> = {
  local: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.01)',
    'rgba(52, 175, 140, 0.05)',
    'rgba(24, 72, 58, 0.08)',
  ],
  travel: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.012)',
    'rgba(70, 168, 228, 0.055)',
    'rgba(22, 58, 92, 0.09)',
  ],
  academy: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.01)',
    'rgba(145, 112, 220, 0.055)',
    'rgba(40, 28, 72, 0.1)',
  ],
  business: [
    'rgba(255, 248, 232, 0)',
    'rgba(255, 248, 232, 0.012)',
    'rgba(210, 168, 88, 0.05)',
    'rgba(72, 48, 22, 0.08)',
  ],
};

/** GLASS.HOME.FINAL — tight diagonal spec; no bright white sheet. */
export const FASHION_HOME_DAYLIGHT_WORLD_DIAGONAL_SPECULAR: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.12)', 'rgba(120, 235, 198, 0.06)'],
  travel: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.11)', 'rgba(140, 210, 255, 0.06)'],
  academy: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.1)', 'rgba(220, 175, 255, 0.065)'],
  business: ['rgba(255, 255, 255, 0)', 'rgba(255, 250, 228, 0.11)', 'rgba(240, 200, 120, 0.055)'],
};

/** Contained semantic glow — icon/title pocket only (used with small layout box in Home). */
export const FASHION_HOME_DAYLIGHT_WORLD_MATERIAL_GLOW: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(72, 210, 170, 0.08)', 'rgba(52, 175, 140, 0.018)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(100, 200, 255, 0.08)', 'rgba(70, 168, 228, 0.018)', 'rgba(95, 195, 248, 0)'],
  academy: ['rgba(195, 155, 255, 0.08)', 'rgba(140, 110, 220, 0.018)', 'rgba(175, 145, 248, 0)'],
  business: ['rgba(235, 198, 120, 0.07)', 'rgba(210, 168, 88, 0.018)', 'rgba(235, 200, 120, 0)'],
};

/** Bottom veil — dark footer only; stays off the photo body. */
export const FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(10, 28, 22, 0)', 'rgba(12, 36, 28, 0.48)'],
  travel: ['rgba(10, 22, 34, 0)', 'rgba(12, 32, 52, 0.48)'],
  academy: ['rgba(18, 12, 32, 0)', 'rgba(22, 16, 40, 0.5)'],
  business: ['rgba(28, 20, 10, 0)', 'rgba(36, 24, 12, 0.48)'],
};

/** Thin top-edge refraction band (Daylight ON world cards, web stack). */
export const FASHION_HOME_DAYLIGHT_WORLD_TOP_REFRACTION_BAND: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(210, 255, 238, 0.82)', 'rgba(255, 255, 255, 0.22)', 'rgba(200, 255, 232, 0.62)'],
  travel: ['rgba(210, 244, 255, 0.8)', 'rgba(255, 255, 255, 0.2)', 'rgba(200, 236, 255, 0.58)'],
  academy: ['rgba(235, 210, 255, 0.78)', 'rgba(255, 255, 255, 0.18)', 'rgba(225, 195, 255, 0.55)'],
  business: ['rgba(255, 236, 200, 0.78)', 'rgba(255, 248, 232, 0.2)', 'rgba(255, 220, 160, 0.55)'],
};

/** GLASS.HOME.FINAL — edge soften optional; kept near-zero (Home may omit layer). */
export const FASHION_HOME_DAYLIGHT_WORLD_EDGE_SOFTEN: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(255, 255, 255, 0.008)', 'rgba(8, 12, 18, 0)'],
  travel: ['rgba(255, 255, 255, 0.008)', 'rgba(8, 12, 18, 0)'],
  academy: ['rgba(255, 255, 255, 0.008)', 'rgba(8, 12, 18, 0)'],
  business: ['rgba(255, 248, 230, 0.01)', 'rgba(8, 12, 18, 0)'],
};

/** Top-left corner edge light. */
export const FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(200, 255, 232, 0.58)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(210, 244, 255, 0.55)', 'rgba(70, 168, 228, 0)'],
  academy: ['rgba(245, 205, 255, 0.55)', 'rgba(168, 138, 238, 0)'],
  business: ['rgba(255, 232, 190, 0.58)', 'rgba(228, 192, 110, 0)'],
};

/** Top-right corner edge light. */
export const FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TR: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(255, 255, 255, 0.28)', 'rgba(52, 175, 140, 0)'],
  travel: ['rgba(220, 246, 255, 0.3)', 'rgba(70, 168, 228, 0)'],
  academy: ['rgba(255, 215, 245, 0.3)', 'rgba(145, 112, 220, 0)'],
  business: ['rgba(255, 240, 210, 0.3)', 'rgba(210, 168, 88, 0)'],
};

/** Hover sweep — semantic glint only. */
export const FASHION_HOME_DAYLIGHT_WORLD_HOVER_EDGE_SWEEP: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(72, 205, 165, 0)', 'rgba(120, 235, 200, 0.26)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(70, 168, 228, 0)', 'rgba(140, 215, 255, 0.26)', 'rgba(70, 168, 228, 0)'],
  academy: ['rgba(168, 138, 238, 0)', 'rgba(220, 175, 255, 0.26)', 'rgba(168, 138, 238, 0)'],
  business: ['rgba(228, 192, 110, 0)', 'rgba(255, 215, 150, 0.24)', 'rgba(228, 192, 110, 0)'],
};

const FASHION_HOME_DAYLIGHT_WORLD_HOVER_RIM: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: ', 0 0 0 1px rgba(110, 240, 200, 0.88), inset 0 2px 0 rgba(255,255,255,0.32), 0 6px 16px rgba(6,10,18,0.36)',
  travel: ', 0 0 0 1px rgba(120, 210, 255, 0.88), inset 0 2px 0 rgba(255,255,255,0.32), 0 6px 16px rgba(6,10,18,0.36)',
  academy: ', 0 0 0 1px rgba(205, 160, 255, 0.86), inset 0 2px 0 rgba(255,255,255,0.28), 0 6px 16px rgba(6,10,18,0.36)',
  business: ', 0 0 0 1px rgba(255, 210, 130, 0.86), inset 0 2px 0 rgba(255,248,232,0.28), 0 6px 16px rgba(6,10,18,0.36)',
};

export const FASHION_HOME_WORLD_CARD_GLASS_HOST_RADIUS = vionaTokens.radius.xl;

export function fashionHomeWorldCardGlassHostStyle(): ViewStyle {
  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: FASHION_HOME_WORLD_CARD_GLASS_HOST_RADIUS,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : {}),
  };
}

/** Native world-card wrapper: semantic fill + tight rim glow (material, not rear halo). */
export function fashionHomeDaylightWorldCardNativeShellStyle(accent: FashionHomeWorldCardDaylightAccent): ViewStyle {
  const w = FASHION_HOME_DAYLIGHT_WORLD_NATIVE[accent];
  if (Platform.OS === 'web') {
    return { borderRadius: vionaTokens.radius.xl, backgroundColor: 'transparent' };
  }
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
export function fashionHomeWebDaylightWorldCardMaterialStyle(
  accent: FashionHomeWorldCardDaylightAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const base = FASHION_HOME_DAYLIGHT_WORLD_WEB_MATERIAL[accent];
  if (!hovered) return { boxShadow: base } as ViewStyle;
  return { boxShadow: `${base}${FASHION_HOME_DAYLIGHT_WORLD_HOVER_RIM[accent]}` } as ViewStyle;
}

const FASHION_HOME_DAYLIGHT_WORLD_INNER_RIM: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: 'rgba(200, 255, 230, 0.62)',
  travel: 'rgba(200, 236, 255, 0.62)',
  academy: 'rgba(230, 210, 255, 0.6)',
  business: 'rgba(255, 230, 186, 0.62)',
};

/** Web-only: thin inner luminous rim (semantic, not rainbow). */
export function fashionHomeWebDaylightWorldCardInnerRimStyle(
  accent: FashionHomeWorldCardDaylightAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const c = FASHION_HOME_DAYLIGHT_WORLD_INNER_RIM[accent];
  const top = hovered ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)';
  const under = hovered ? 'rgba(4,8,14,0.26)' : 'rgba(4,8,14,0.2)';
  return {
    boxShadow: `inset 0 0 0 1px ${c}, inset 0 1px 0 ${top}, inset 0 -22px 36px ${under}`,
  } as ViewStyle;
}

/** Web: subtle lift + scale on world-card glass host (pointer hover). */
export function fashionHomeWebWorldCardHostHoverMotionStyle(hovered: boolean): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  return {
    transform: [{ translateY: hovered ? -2 : 0 }, { scale: hovered ? 1.006 : 1 }],
    transition: `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${ms}ms ease-out`,
  } as ViewStyle;
}

/** Web-only: hero image stack only (avoid filtering card typography). GLASS.HOME.2 — slightly softer lift (less glare). */
export const FASHION_HOME_DAYLIGHT_HERO_IMAGE_FILTER_WEB = 'brightness(1.05) contrast(1.06) saturate(1.06)';

/** Web-only CSS transition for Daylight Boost (no layout animation). */
export function fashionHomeWebDaylightTransitionStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  return {
    transition: `background-color ${ms}ms ease-out, border-color ${ms}ms ease-out, box-shadow ${ms}ms ease-out, color ${ms}ms ease-out, text-shadow ${ms}ms ease-out, filter ${ms}ms ease-out, opacity ${ms}ms ease-out, transform ${ms}ms ease-out`,
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
    fill: 'rgba(14, 18, 28, 0.22)',
    border: 'rgba(228, 192, 110, 0.32)',
    iconBg: 'rgba(238, 206, 128, 0.2)',
    iconRim: 'rgba(238, 206, 128, 0.52)',
    webMaterial:
      'inset 0 1px 0 rgba(255,248,232,0.2), inset 0 -12px 20px rgba(6,10,16,0.22), 0 0 0 1px rgba(228, 192, 110, 0.3), 0 3px 12px rgba(4, 8, 14, 0.32)',
    sheen: ['rgba(255, 248, 228, 0.14)', 'rgba(255, 248, 228, 0)'],
  },
  cyan: {
    fill: 'rgba(12, 18, 28, 0.22)',
    border: 'rgba(95, 195, 248, 0.3)',
    iconBg: 'rgba(128, 210, 255, 0.18)',
    iconRim: 'rgba(128, 210, 255, 0.52)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -12px 20px rgba(6,10,16,0.22), 0 0 0 1px rgba(95, 195, 248, 0.28), 0 3px 12px rgba(4, 8, 14, 0.32)',
    sheen: ['rgba(210, 238, 255, 0.12)', 'rgba(200, 235, 255, 0)'],
  },
  emerald: {
    fill: 'rgba(12, 20, 26, 0.22)',
    border: 'rgba(72, 195, 155, 0.3)',
    iconBg: 'rgba(88, 214, 168, 0.18)',
    iconRim: 'rgba(88, 214, 168, 0.52)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -12px 20px rgba(6,10,16,0.22), 0 0 0 1px rgba(72, 195, 155, 0.28), 0 3px 12px rgba(4, 8, 14, 0.32)',
    sheen: ['rgba(195, 250, 225, 0.12)', 'rgba(180, 245, 220, 0)'],
  },
  violet: {
    fill: 'rgba(14, 16, 28, 0.22)',
    border: 'rgba(168, 138, 238, 0.3)',
    iconBg: 'rgba(176, 140, 255, 0.18)',
    iconRim: 'rgba(176, 140, 255, 0.52)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -12px 20px rgba(6,10,16,0.22), 0 0 0 1px rgba(168, 138, 238, 0.28), 0 3px 12px rgba(4, 8, 14, 0.32)',
    sheen: ['rgba(228, 210, 255, 0.12)', 'rgba(220, 200, 255, 0)'],
  },
  blue: {
    fill: 'rgba(12, 18, 28, 0.22)',
    border: 'rgba(120, 196, 255, 0.3)',
    iconBg: 'rgba(120, 196, 255, 0.16)',
    iconRim: 'rgba(120, 196, 255, 0.5)',
    webMaterial:
      'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -12px 20px rgba(6,10,16,0.22), 0 0 0 1px rgba(120, 196, 255, 0.28), 0 3px 12px rgba(4, 8, 14, 0.32)',
    sheen: ['rgba(210, 232, 255, 0.12)', 'rgba(200, 228, 255, 0)'],
  },
  sos: {
    fill: 'rgba(22, 10, 14, 0.36)',
    border: 'rgba(255, 92, 108, 0.36)',
    iconBg: 'rgba(255, 92, 108, 0.2)',
    iconRim: 'rgba(255, 92, 108, 0.52)',
    webMaterial:
      'inset 0 1px 0 rgba(255,220,225,0.14), inset 0 -10px 18px rgba(8,4,6,0.28), 0 0 0 1px rgba(255, 92, 108, 0.32), 0 3px 12px rgba(4, 8, 14, 0.32)',
    sheen: ['rgba(255, 190, 198, 0.12)', 'rgba(255, 180, 190, 0)'],
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

export function fashionHomeWebDaylightQuickActionPillMaterialStyle(
  accent: FashionHomeQuickActionAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const base = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent].webMaterial;
  if (!hovered) return { boxShadow: base } as ViewStyle;
  const lift =
    ', inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.1), 0 8px 18px rgba(6,10,18,0.3)';
  return { boxShadow: `${base}${lift}` } as ViewStyle;
}

/** Web: inset glass rim on quick pills (no extra fill). */
export function fashionHomeWebDaylightQuickActionInnerRimStyle(accent: FashionHomeQuickActionAccent): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const b = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent].border;
  return {
    ...StyleSheet.absoluteFillObject,
    borderRadius: vionaTokens.radius.pill,
    boxShadow: `inset 0 0 0 1px ${b}, inset 0 1px 0 rgba(255,255,255,0.16)`,
  } as ViewStyle;
}

/** Web: quick-action pill hover lift + micro scale (GLASS.HOME.3). */
export function fashionHomeWebQuickActionHoverMotionStyle(hovered: boolean): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  return {
    transform: [{ translateY: hovered ? -2 : 0 }, { scale: hovered ? 1.006 : 1 }],
    transition: `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${ms}ms ease-out`,
  } as ViewStyle;
}

/**
 * HOME.OPENING.STAGE.ALIGNMENT.1 — break out of ScrollView horizontal pad; shared grid lives inside.
 */
export function fashionHomeWebOpeningStageBreakoutStyle(
  padPx: number,
  rightBleedPx: number = FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX
): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  return {
    marginLeft: -padPx,
    marginRight: -(padPx + rightBleedPx),
    width: '100%',
    alignSelf: 'stretch',
  } as ViewStyle;
}

/** Shared horizontal rail for hero frame and hub (optional bleed override). */
export function fashionHomeWebOpeningStageContentRailStyle(
  padPx: number,
  rightBleedPx: number = FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX
): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  return {
    width: '100%',
    paddingLeft: padPx,
    paddingRight: Math.max(0, padPx - rightBleedPx),
  } as ViewStyle;
}

/**
 * HOME.OPENING.STAGE.CINEMATIC.1 — opening stage owns first viewport below command bar.
 * Hub (`VIONA FOR YOU`) follows after this block; no post-card spacer.
 */
export function fashionHomeWebOpeningStageShellStyle(
  stageHeightPx: number,
  padPx: number,
  isFullscreen = false
): ViewStyle {
  if (Platform.OS !== 'web' || stageHeightPx <= 0) return {};
  return {
    ...fashionHomeWebOpeningStageBreakoutStyle(padPx),
    position: 'relative',
    height: stageHeightPx,
    minHeight: stageHeightPx,
    maxHeight: stageHeightPx,
    marginTop: 0,
    overflow: 'visible',
  } as ViewStyle;
}

const deepStageAbsoluteFill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  width: '100%',
} as const;

/** Opening stage canvas — column stack for hero + cards inside fixed stage height. */
export function fashionHomeWebOpeningStageDeepHeroCanvasStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    ...deepStageAbsoluteFill,
    zIndex: 1,
    overflow: 'hidden',
    flexDirection: 'column',
  } as ViewStyle;
}

/**
 * Opening-stage dynamic hero — one image, one scene (`cover` + balanced focal).
 * Replaces stacked passes / height% zoom / duplicate backdrop layers.
 */
export function fashionHomeWebOpeningStageHeroImageStyle(isFullscreen = false): ImageStyle {
  if (Platform.OS !== 'web') return {};
  const xPct = isFullscreen
    ? FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_X_PCT -
      FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_X_FULLSCREEN_SHIFT_PCT
    : FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_X_PCT;
  return {
    objectFit: 'cover',
    objectPosition: `${xPct}% ${FASHION_HOME_WEB_OPENING_STAGE_HERO_OBJECT_POSITION_Y_PCT}%`,
    width: '100%',
    height: '100%',
    maxWidth: '100%',
  } as ImageStyle;
}

/** @deprecated Use `fashionHomeWebOpeningStageHeroImageStyle`. */
export function fashionHomeWebOpeningStageHeroImageFocalStyle(isFullscreen = false): ImageStyle {
  return fashionHomeWebOpeningStageHeroImageStyle(isFullscreen);
}

/** Single full-bleed clip for the opening hero (no split passes). */
export function fashionHomeWebOpeningStageHeroImageClipStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    zIndex: 0,
  } as ViewStyle;
}

/** Shared grid column: hero block + card row (matches command bar `layout.pad`). */
export function fashionHomeWebOpeningStageGridColumnStyle(padPx: number): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  const rightBleed = FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX;
  return {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingLeft: padPx,
    paddingRight: Math.max(0, padPx - rightBleed),
  } as ViewStyle;
}

/** Opening stage column stack — top-aligned; no flex growth that pushes hero down. */
export function fashionHomeWebOpeningStageDeepHeroBleedStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  } as ViewStyle;
}

/** Hero frame slot — fixed height; bottom edge meets card row. */
export function fashionHomeWebOpeningStageHeroFrameStyle(heroHeightPx: number): ViewStyle {
  if (Platform.OS !== 'web' || heroHeightPx <= 0) return {};
  return {
    width: '100%',
    alignSelf: 'stretch',
    height: heroHeightPx,
    minHeight: heroHeightPx,
    maxHeight: heroHeightPx,
    flexShrink: 0,
    position: 'relative',
  } as ViewStyle;
}

/** @deprecated Use `fashionHomeWebOpeningStageHeroFrameStyle`. */
export function fashionHomeWebOpeningStageDeepHeroFrameStyle(): ViewStyle {
  return {};
}

/** Hero shell fills the hero frame; image ends at frame bottom. */
export function fashionHomeWebOpeningStageDeepHeroShellStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: vionaTokens.radius.xxl,
    backgroundColor: 'transparent',
  } as ViewStyle;
}

/** Copy/CTA band inside hero frame. */
export function fashionHomeWebOpeningStageHeroForegroundStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    justifyContent: 'flex-start',
    paddingBottom: vionaTokens.spacing[16],
  } as ViewStyle;
}

/** Connected chip anchored to hero frame bottom. */
export function fashionHomeWebOpeningStageConnectedChipStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    bottom: vionaTokens.spacing[12],
  } as ViewStyle;
}

/** World cards directly under hero frame (same grid width). */
export function fashionHomeWebOpeningStageWorldStripBelowHeroStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    width: '100%',
    flexShrink: 0,
    marginTop: FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX,
    zIndex: 12,
  } as ViewStyle;
}

/** @deprecated Cards live below hero via `fashionHomeWebOpeningStageWorldStripBelowHeroStyle`. */
export function fashionHomeWebOpeningStageWorldStripInHeroStyle(): ViewStyle {
  return fashionHomeWebOpeningStageWorldStripBelowHeroStyle();
}

/** @deprecated Cards live inside hero shell via `fashionHomeWebOpeningStageWorldStripInHeroStyle`. */
export function fashionHomeWebOpeningStageWorldStripOverlayStyle(padPx: number): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return fashionHomeWebOpeningStageWorldStripInHeroStyle();
}

/** Web opening-stage card grid on deep stage — flush to shared rail (no extra bleed). */
export function fashionHomeWebOpeningStageCardGridStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
    overflow: 'visible',
    width: '100%',
    alignItems: 'stretch',
  } as ViewStyle;
}

/** Opening-stage world card cell — stretch only; row height from measure + budget. */
export function fashionHomeWebOpeningStageCardCellStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    alignSelf: 'stretch',
  } as ViewStyle;
}

export type FashionWebOpeningStageLayout = Readonly<{
  stageHeight: number;
  heroHeightPx: number;
  cardRowH: number;
  hubPeekReserve: number;
}>;

/**
 * Opening-stage viewport budget: hero block + card row inside stage; hub peeks below.
 * No image stitching — height math only.
 */
export function computeFashionHomeWebOpeningStageLayout(input: {
  viewportHeightPx: number;
  chromeAboveScrollPx: number;
  measuredCardRowPx: number;
  isFullscreen: boolean;
}): FashionWebOpeningStageLayout {
  const cardRowH = Math.max(
    FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX,
    Math.ceil(input.measuredCardRowPx)
  );
  const availableBelowChrome = Math.max(
    320,
    input.viewportHeightPx -
      input.chromeAboveScrollPx -
      FASHION_HOME_WEB_OPENING_STAGE_SCROLL_TOP_PAD_PX +
      FASHION_HOME_WEB_OPENING_STAGE_HEIGHT_FUDGE_PX
  );
  /** Hub follows below the fold — do not reserve first-viewport peek (avoids card clipping). */
  const hubPeekReserve = 0;
  /** Visual hero→cards gap only (6px margin on strip); do not double-reserve hook in budget. */
  const stackGap = FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX;
  const contentBudget = Math.max(
    280,
    availableBelowChrome -
      hubPeekReserve -
      FASHION_HOME_WEB_OPENING_STAGE_SAFE_BOTTOM_GAP_PX
  );
  const heroMaxPx =
    input.viewportHeightPx > 900
      ? Math.min(480, FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX + 48)
      : FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX;
  const heroBudgetPx = contentBudget - cardRowH - stackGap;
  let heroHeightPx = Math.min(heroMaxPx, Math.max(0, heroBudgetPx));
  const stageWithHeroMin =
    FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX + cardRowH + stackGap;
  if (stageWithHeroMin <= contentBudget) {
    heroHeightPx = Math.max(FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX, heroHeightPx);
  }
  const stackHeight = heroHeightPx + cardRowH + stackGap;
  if (stackHeight > contentBudget) {
    heroHeightPx = Math.max(0, contentBudget - cardRowH - stackGap);
  }
  if (
    input.viewportHeightPx <= FASHION_HOME_WEB_OPENING_STAGE_HUB_IN_VIEWPORT_MAX_HEIGHT_PX
  ) {
    const nudgedHero = Math.min(
      heroMaxPx,
      heroHeightPx + FASHION_HOME_WEB_OPENING_STAGE_SHORT_VIEWPORT_HERO_NUDGE_PX
    );
    if (nudgedHero + cardRowH + stackGap <= contentBudget) {
      heroHeightPx = nudgedHero;
    }
  }
  const stageHeight = heroHeightPx + cardRowH + stackGap;
  return { stageHeight, heroHeightPx, cardRowH, hubPeekReserve };
}

/** Hub wrapper: breakout + same horizontal pad as hero frame (web fashion home). */
export function fashionHomeWebOpeningStageHubWrapperStyle(
  padPx: number,
  options?: { pullUpPx?: number }
): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  const pullUpPx = options?.pullUpPx ?? 0;
  return {
    ...fashionHomeWebOpeningStageBreakoutStyle(
      padPx,
      FASHION_HOME_WEB_OPENING_STAGE_HUB_RIGHT_BLEED_PX
    ),
    ...fashionHomeWebOpeningStageContentRailStyle(
      padPx,
      FASHION_HOME_WEB_OPENING_STAGE_HUB_RIGHT_BLEED_PX
    ),
    ...(pullUpPx > 0 ? { marginTop: -pullUpPx } : {}),
  } as ViewStyle;
}

/** Web: restrained glass lift on command-rail utilities (caller should skip SOS). */
export function fashionHomeWebCommandUtilityHoverStyle(hovered: boolean, daylightBoost: boolean): ViewStyle {
  if (Platform.OS !== 'web' || !hovered) return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  return {
    backgroundColor: daylightBoost ? 'rgba(255, 255, 255, 0.075)' : 'rgba(255, 255, 255, 0.06)',
    boxShadow: daylightBoost
      ? 'inset 0 0 0 1px rgba(255, 248, 232, 0.26), 0 5px 16px rgba(6, 10, 18, 0.24)'
      : 'inset 0 0 0 1px rgba(255, 255, 255, 0.16), 0 5px 16px rgba(6, 10, 18, 0.22)',
    transition: `background-color ${ms}ms ease-out, box-shadow ${ms}ms ease-out`,
  } as ViewStyle;
}

export function fashionHomeDaylightQuickActionIconCapsuleStyle(
  accent: FashionHomeQuickActionAccent,
  hovered = false
): ViewStyle {
  const q = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent];
  return {
    backgroundColor: q.iconBg,
    shadowColor: q.iconRim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: hovered ? 0.92 : 0.62,
    shadowRadius: hovered ? 11 : 7,
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
